import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Space, Tabs, message, Card, Row, Col, Modal, List, Input, Dropdown, Badge, Upload, Radio, Slider, ColorPicker, Select, InputNumber } from 'antd';
import { PlayCircleOutlined, StopOutlined, SaveOutlined, ArrowLeftOutlined, BgColorsOutlined, CloudOutlined, FolderOpenOutlined, PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SoundOutlined, CustomerServiceOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createProject, getProjects, getProject, updateProject, deleteProject, updateProjectData, remixProject, getCloudVariables, updateCloudVariables } from '../../services/api';
import { defineBlocks } from '../../components/blockly/blocks';
import { registerGenerators, registerPythonGenerators } from '../../components/blockly/generators';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;

// ============================================================================
// Code Execution Engine - Supports Python, C++, and Scratch
// ============================================================================

class CodeExecutor {
  constructor(onOutput, onError, onInput) {
    this.onOutput = onOutput;
    this.onError = onError;
    this.onInput = onInput;
    this.output = [];
    this.running = false;
    this.generatedCode = { python: '', cpp: '' };
  }

  setInputCallback(callback) {
    this.onInput = callback;
  }

  log(message, type = 'log') {
    const entry = { message: String(message), type, timestamp: Date.now() };
    this.output.push(entry);
    this.onOutput?.(entry);
  }

  error(message, details = null) {
    const entry = {
      message: String(message),
      type: 'error',
      timestamp: Date.now(),
      details: details
    };
    this.output.push(entry);
    this.onError?.(entry);
  }

  warn(message) {
    const entry = { message: String(message), type: 'warn', timestamp: Date.now() };
    this.output.push(entry);
    this.onOutput?.(entry);
  }

  info(message) {
    const entry = { message: String(message), type: 'info', timestamp: Date.now() };
    this.output.push(entry);
    this.onOutput?.(entry);
  }

  clear() {
    this.output = [];
    this.onOutput?.({ clear: true });
  }

  // Get generated code
  getGeneratedCode(language) {
    return this.generatedCode[language] || '';
  }

  // =========================================================================
  // Python Code Execution - Enhanced with better error handling
  // =========================================================================
  async executePython(code) {
    if (this.running) {
      this.warn('代码正在执行中，请等待完成');
      return;
    }
    this.running = true;
    this.clear();
    this.info('=== Python 代码执行 ===');

    // Store generated code
    this.generatedCode.python = code;

    // Enhanced safe subset of Python builtins
    const safeBuiltins = {
      'print': (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
      'len': (x) => {
        if (x == null) return 0;
        if (typeof x === 'string' || Array.isArray(x)) return x.length;
        if (typeof x === 'object') return Object.keys(x).length;
        return 0;
      },
      'range': (...args) => {
        if (args.length === 0) return [];
        const start = args.length > 1 ? args[0] : 0;
        const end = args.length > 1 ? args[1] : args[0];
        const step = args.length > 2 ? args[2] : 1;
        if (step === 0) {
          throw new Error('range() arg 3 must not be zero');
        }
        const result = [];
        if (step > 0) {
          for (let i = start; i < end; i += step) result.push(i);
        } else {
          for (let i = start; i > end; i += step) result.push(i);
        }
        return result;
      },
      'str': (x) => x == null ? '' : String(x),
      'int': (x) => {
        if (x == null) return 0;
        const n = parseInt(x);
        if (isNaN(n)) throw new Error(`invalid literal for int(): '${x}'`);
        return n;
      },
      'float': (x) => {
        if (x == null) return 0.0;
        const n = parseFloat(x);
        if (isNaN(n)) throw new Error(`could not convert string to float: '${x}'`);
        return n;
      },
      'bool': (x) => Boolean(x),
      'list': (x) => {
        if (x == null) return [];
        if (Array.isArray(x)) return [...x];
        if (typeof x === 'string') return x.split('');
        return Array.from(x || []);
      },
      'dict': (x) => x ? { ...x } : {},
      'abs': Math.abs,
      'min': (...args) => {
        if (args.length === 0) return Infinity;
        if (args.length === 1 && Array.isArray(args[0])) {
          return Math.min(...args[0]);
        }
        return Math.min(...args);
      },
      'max': (...args) => {
        if (args.length === 0) return -Infinity;
        if (args.length === 1 && Array.isArray(args[0])) {
          return Math.max(...args[0]);
        }
        return Math.max(...args);
      },
      'sum': (arr) => {
        if (!arr || !Array.isArray(arr)) return 0;
        return arr.reduce((a, b) => a + (Number(b) || 0), 0);
      },
      'round': (x, digits = 0) => {
        const factor = Math.pow(10, digits);
        return Math.round(x * factor) / factor;
      },
      'sorted': (arr, reverse = false) => {
        if (!arr || !Array.isArray(arr)) return [];
        const result = [...arr].sort((a, b) => {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        });
        return reverse ? result.reverse() : result;
      },
      'reversed': (arr) => {
        if (!arr || !Array.isArray(arr)) return [];
        return [...arr].reverse();
      },
      'enumerate': function* (arr, start = 0) {
        let i = start;
        for (const x of arr || []) { yield [i++, x]; }
      },
      'zip': function* (...arrs) {
        const minLen = Math.min(...arrs.map(a => a?.length || 0));
        for (let i = 0; i < minLen; i++) {
          yield arrs.map(a => a[i]);
        }
      },
      'map': (fn, arr) => [...(arr || [])].map(fn),
      'filter': (fn, arr) => [...(arr || [])].filter(fn),
      'type': (x) => {
        if (x === null) return 'NoneType';
        if (x === undefined) return "'NoneType'";
        if (Array.isArray(x)) return "<class 'list'>";
        if (typeof x === 'object') return "<class 'dict'>";
        return typeof x;
      },
      'isinstance': (x, t) => {
        if (t === int || t === 'int') return Number.isInteger(x);
        if (t === float || t === 'float') return typeof x === 'number' && !Number.isInteger(x);
        if (t === str || t === 'str') return typeof x === 'string';
        if (t === bool || t === 'bool') return typeof x === 'boolean';
        if (t === list || t === 'list') return Array.isArray(x);
        if (t === dict || t === 'dict') return typeof x === 'object' && x !== null && !Array.isArray(x);
        return x instanceof t;
      },
      'input': async (prompt) => {
        return new Promise(resolve => {
          this.onInput?.(prompt || '', resolve);
        });
      },
      'open': (filename, mode = 'r') => {
        this.warn(`open() not fully supported - simulated for: ${filename}`);
        return {
          read: () => '',
          write: (s) => this.log(s),
          close: () => {}
        };
      },
      'chr': (n) => String.fromCharCode(n),
      'ord': (c) => c.charCodeAt(0),
      'hex': (n) => '0x' + n.toString(16),
      'oct': (n) => '0o' + n.toString(8),
      'bin': (n) => '0b' + n.toString(2),
      'pow': Math.pow,
      'divmod': (a, b) => [Math.floor(a / b), a % b],
      'all': (arr) => arr && arr.every(x => Boolean(x)),
      'any': (arr) => arr && arr.some(x => Boolean(x)),
      'repr': (x) => JSON.stringify(x),
      'format': (x, fmt) => {
        try {
          if (typeof x === 'number' && fmt) {
            return x.toFixed(fmt.includes('.') ? fmt.split('.')[1].length : 0);
          }
          return String(x);
        } catch {
          return String(x);
        }
      },
    };

    // Add variable argument names for isinstance
    const int = 'int';
    const float = 'float';
    const str = 'str';
    const bool = 'bool';
    const list = 'list';
    const dict = 'dict';

    // Safe math functions
    const mathNamespace = {
      'pi': Math.PI,
      'e': Math.E,
      'sin': Math.sin,
      'cos': Math.cos,
      'tan': Math.tan,
      'asin': Math.asin,
      'acos': Math.acos,
      'atan': Math.atan,
      'atan2': Math.atan2,
      'sqrt': Math.sqrt,
      'pow': Math.pow,
      'abs': Math.abs,
      'floor': Math.floor,
      'ceil': Math.ceil,
      'log': Math.log,
      'log10': Math.log10,
      'log2': Math.log2,
      'exp': Math.exp,
      'degrees': (rad) => rad * 180 / Math.PI,
      'radians': (deg) => deg * Math.PI / 180,
      'hypot': (...args) => Math.sqrt(args.reduce((sum, n) => sum + n * n, 0)),
      'fabs': Math.abs,
      'fmod': (a, b) => a % b,
      'modf': (x) => [x - Math.floor(x), Math.floor(x)],
      'trunc': Math.trunc,
      'copysign': (a, b) => Math.abs(a) * (b >= 0 ? 1 : -1),
      'isfinite': Number.isFinite,
      'isinf': Number.isInfinite,
      'isnan': Number.isNaN,
    };

    // Enhanced Python-to-JavaScript converter
    const pythonToJS = (code, lineOffset = 0) => {
      let lines = code.split('\n');
      let js = code;
      const errors = [];

      // Track indentation
      const getIndent = (line) => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      };

      // Multi-line statement handling
      let result = [];
      let i = 0;
      while (i < lines.length) {
        let line = lines[i];
        const indent = getIndent(line);

        // Skip empty lines and comments
        if (/^\s*$/.test(line) || /^\s*#/.test(line)) {
          i++;
          continue;
        }

        // Handle elif
        line = line.replace(/\belif\b/g, 'else if');

        // Handle print with proper formatting
        line = line.replace(/print\s*\((.*)\)\s*$/, (_, args) => {
          // Handle print with multiple arguments
          const argParts = args.split(',').map(a => a.trim());
          if (argParts.length > 1) {
            return `__print(${argParts.map(a => `JSON.stringify(${a})`).join(' + " " + ')})`;
          }
          return `__print(${args})`;
        });

        // Handle input
        line = line.replace(/input\s*\((.*)\)/g, (_, prompt) => `await __input(${prompt})`);

        // Handle range with single arg (only digits)
        line = line.replace(/range\s*\(\s*(\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');

        // Handle range with two args (digits only)
        line = line.replace(/range\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');

        // Handle range with three args
        line = line.replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g,
          'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');

        // Handle range with variables
        line = line.replace(/range\s*\(\s*(\w+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
        line = line.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
        line = line.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/g,
          'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');

        // Handle "and" / "or" operators
        line = line.replace(/\band\b/g, '&&');
        line = line.replace(/\bor\b/g, '||');

        // Handle "not in" / "is not" / "in"
        line = line.replace(/\bnot\s+in\b/g, '!');
        line = line.replace(/\bis\s+not\b/g, '!==');
        line = line.replace(/\b(\w+)\s+in\s+(\w+)/g, '($2).includes($1)');
        line = line.replace(/\bnot\b(?!\s*in|\s*is)/g, '!');

        // Handle "True" / "False" / "None"
        line = line.replace(/\bTrue\b/g, 'true');
        line = line.replace(/\bFalse\b/g, 'false');
        line = line.replace(/\bNone\b/g, 'null');

        // Handle "self"
        line = line.replace(/\bself\b/g, 'this');

        // Handle Python string formatting
        line = line.replace(/"([^"]*)"%\([^)]*\)/g, (_, fmt) => {
          const replacement = fmt.replace(/%[sdif]/g, '${""}');
          return '`' + replacement + '`';
        });

        // Handle list comprehension: [expr for x in list if cond]
        const listCompMatch = line.match(/^\s*\[\s*(.+?)\s+for\s+(\w+)\s+in\s+(.+?)\s*(?:if\s+(.+?))?\s*\]\s*$/);
        if (listCompMatch) {
          const [, expr, varName, listExpr, cond] = listCompMatch;
          let mapFn = `${listExpr}.map(${varName} => ${expr})`;
          if (cond) {
            mapFn = `${mapFn}.filter(${varName} => ${cond})`;
          }
          line = line.replace(/^\s*\[\s*.+?\s+for\s+\w+\s+in\s+.+?(?:\s+if\s+.+?)?\]\s*$/, mapFn);
        }

        result.push(line);
        i++;
      }

      js = result.join('\n');

      // Handle try-except
      js = js.replace(/try\s*\{/g, 'try {');
      js = js.replace(/\}except(?:\s*\(\s*(\w+)\s*\))?\s*\{/g, '} catch ($1) {');

      // Handle Python-style string concatenation
      js = js.replace(/print\s*\((.+?)\+\s*"([^"]*)"\s*\)/g, 'print($1+"$2")');

      return js;
    };

    // Format value for display (similar to Python's print)
    this._formatValue = (v) => {
      if (v === null) return 'None';
      if (v === undefined) return 'None';
      if (typeof v === 'boolean') return v ? 'True' : 'False';
      if (typeof v === 'string') return v;
      if (Array.isArray(v)) {
        return '[' + v.map(x => this._formatValue(x)).join(', ') + ']';
      }
      if (typeof v === 'object') {
        const entries = Object.entries(v);
        return '{' + entries.map(([k, val]) => `${this._formatValue(k)}: ${this._formatValue(val)}`).join(', ') + '}';
      }
      return String(v);
    };

    try {
      const jsCode = pythonToJS(code);

      // Create execution context
      const contextKeys = ['int', 'float', 'str', 'bool', 'list', 'dict', ...Object.keys(safeBuiltins)];
      const contextValues = [int, float, str, bool, list, dict, ...Object.values(safeBuiltins)];
      const mathKeys = Object.keys(mathNamespace);
      const mathValues = Object.values(mathNamespace);

      // Build function with safe context
      const fn = new Function(
        ...contextKeys, ...mathKeys, '__print', '__input', '__this',
        `"use strict";
        return (async () => {
          try {
            ${jsCode}
          } catch (__py_error) {
            const errorMsg = __py_error.message || String(__py_error);
            const stack = __py_error.stack || '';
            // Extract line number from stack if available
            const lineMatch = stack.match(/<anonymous>:(\d+):(\d+)/);
            let lineInfo = '';
            if (lineMatch) {
              const jsLine = parseInt(lineMatch[1]) - 12; // Adjust for wrapper
              lineInfo = \` (行号 ~\${jsLine})\`;
            }
            throw new Error(\`Python执行错误: \${errorMsg}\${lineInfo}\`);
          }
        })()`
      );

      // Create a proxy for 'this' context
      const thisProxy = new Proxy({}, {
        get: (_, prop) => {
          if (prop === '_output') return this.output;
          return (...args) => this.log(`${prop}(${args.map(a => JSON.stringify(a)).join(', ')})`, 'function');
        }
      });

      await fn(...contextValues, ...mathValues,
        (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
        async (prompt) => {
          return new Promise(resolve => {
            this.onInput?.(prompt, resolve);
          });
        },
        thisProxy
      );

      this.log('\n=== 执行完成 ===', 'info');

    } catch (e) {
      this.error(`\n=== 执行错误 ===`, e.message);
      console.error('Python execution error:', e);
    } finally {
      this.running = false;
    }
  }

  // =========================================================================
  // C++ Code Generation - Enhanced with better translation
  // =========================================================================
  async executeCPlusPlus(code, compileAPIUrl = null) {
    if (this.running) {
      this.warn('代码正在执行中，请等待完成');
      return;
    }
    this.running = true;
    this.clear();
    this.info('=== C++ 代码生成 ===\n');

    // Generate enhanced C++ code
    const cppCode = this.generateCppCode(code);
    this.generatedCode.cpp = cppCode;

    this.log('生成的 C++ 代码:', 'info');
    this.log(cppCode, 'code');
    this.log('\n提示: C++代码已生成，可复制到本地编译器使用', 'info');

    if (compileAPIUrl) {
      this.log('\n正在编译...', 'info');
      try {
        const response = await fetch(compileAPIUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cppCode, language: 'cpp' })
        });
        const result = await response.json();
        if (result.output) {
          this.log('\n=== 编译输出 ===', 'info');
          this.log(result.output);
        }
        if (result.error) {
          this.error('\n=== 编译错误 ===');
          this.error(result.error);
        }
        if (result.executionTime) {
          this.info(`\n执行时间: ${result.executionTime}ms`);
        }
      } catch (e) {
        this.error(`编译请求失败: ${e.message}`);
      }
    } else {
      this.warn('\n提示: 要执行C++代码，需要配置编译API服务');
      this.warn('建议: 可使用 Judge0 API 或自建编译服务');
    }

    this.running = false;
  }

  // Generate C++ code from Blockly JavaScript
  generateCppCode(jsCode) {
    let cpp = `// Auto-generated C++ code
// Generated from Blockly/Scratch
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

`;

    // Process line by line
    const lines = jsCode.split('\n');
    let indent = '    ';

    for (let line of lines) {
      line = line.trim();
      if (!line || line === '{' || line === '}') continue;

      // Skip async/await
      line = line.replace(/async\s+/g, '');
      line = line.replace(/await\s+/g, '');

      // Variable declarations
      line = line.replace(/const\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
      line = line.replace(/let\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
      line = line.replace(/var\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');

      // Simple variable without type
      if (/^\w+\s*=\s*.+;$/.test(line) && !line.includes('auto ')) {
        line = 'auto ' + line;
      }

      // console.log to cout
      line = line.replace(/console\.log\(/g, 'cout << ');
      line = line.replace(/cout\s*<<\s*(.+?)\s*;?$/g, (match, content) => {
        // Handle multiple << operators
        content = content.trim();
        // Convert + for string concatenation
        content = content.replace(/\+\s*"([^"]*)"/g, ' << "$1"');
        content = content.replace(/\+\s*'([^']*)'/g, ' << \'$1\'');
        // Convert JSON.stringify
        content = content.replace(/JSON\.stringify\(([^)]+)\)/g, '$1');
        // Add << for any remaining +
        content = content.replace(/"\s*\+\s*/g, '" << ');
        content = content.replace(/"\s*\+\s*/g, '" << ');
        // Add endl for newlines implied by print
        return 'cout << ' + content + ' << endl;';
      });

      // Math functions
      line = line.replace(/Math\.abs\(/g, 'abs(');
      line = line.replace(/Math\.floor\(/g, 'floor(');
      line = line.replace(/Math\.ceil\(/g, 'ceil(');
      line = line.replace(/Math\.round\(/g, 'round(');
      line = line.replace(/Math\.sqrt\(/g, 'sqrt(');
      line = line.replace(/Math\.pow\(/g, 'pow(');
      line = line.replace(/Math\.sin\(/g, 'sin(');
      line = line.replace(/Math\.cos\(/g, 'cos(');
      line = line.replace(/Math\.tan\(/g, 'tan(');
      line = line.replace(/Math\.log\(/g, 'log(');
      line = line.replace(/Math\.log10\(/g, 'log10(');
      line = line.replace(/Math\.exp\(/g, 'exp(');
      line = line.replace(/Math\.PI/g, 'M_PI');

      // parseInt / parseFloat
      line = line.replace(/parseInt\(([^)]+)\)/g, 'stoi($1)');
      line = line.replace(/parseFloat\(([^)]+)\)/g, 'stod($1)');

      // Array creation
      line = line.replace(/Array\.from\({length:(\d+)}/g, 'vector<double>($1');
      line = line.replace(/Array\.from\({length:(\w+)}/g, 'vector<double>($1');
      line = line.replace(/\[(.+)\]\.map\(/g, '// map operation on [$1]');

      // comparisons
      line = line.replace(/===/g, '==');
      line = line.replace(/!==/g, '!=');

      // typeof
      line = line.replace(/typeof\s+(\w+)\s*===\s*['"]number['"]/g, 'typeof($1) == typeof(double())');
      line = line.replace(/typeof\s+(\w+)\s*===\s*['"]string['"]/g, 'typeof($1) == typeof(string())');

      // for loops
      line = line.replace(/for\s*\(\s*const\s+(\w+)\s+of\s+(.+?)\)/g, 'for (const auto&$1 : $2)');
      line = line.replace(/for\s*\(\s*let\s+(\w+)\s+of\s+(.+?)\)/g, 'for (auto&$1 : $2)');
      line = line.replace(/for\s*\(\s*var\s+(\w+)\s+of\s+(.+?)\)/g, 'for (auto&$1 : $2)');

      // while loops - keep as is
      if (line.startsWith('while')) {
        // Adjust condition for boolean
      }

      // if statements
      line = line.replace(/if\s*\((.+)\)\s*\{/g, 'if ($1) {');

      // function calls cleanup
      line = line.replace(/,\s*\$1\)/g, ')');
      line = line.replace(/,\s*\$2\)/g, ')');

      if (line) {
        cpp += indent + line + '\n';
      }
    }

    cpp += `
    return 0;
}
`;
    return cpp;
  }

  // Translate Scratch blocks to Python using Blockly's Python generator
  translateToPython(workspace) {
    try {
      if (!window.Blockly || !workspace) {
        return '# Blockly not available';
      }
      // Use Blockly's Python generator directly
      const pythonCode = window.Blockly.Python.workspaceToCode(workspace);
      this.generatedCode.python = pythonCode;
      return pythonCode;
    } catch (e) {
      this.error(`翻译失败: ${e.message}`);
      return '# 翻译失败';
    }
  }
}

// ============================================================================
// Scratch Interpreter - Complete Blockly Code Execution Engine
// ============================================================================

class ScratchInterpreter {
  constructor(sprites, initialState, callbacks = {}) {
    this.sprites = sprites;
    this.state = initialState;
    this.callbacks = callbacks;
    this.running = false;
    this.threads = [];
    this.audioContext = null;
    this.audioBuffers = {};
    this.keyboardState = {};
    this.mouseState = { x: 0, y: 0, down: false };
    this.askInput = { active: false, question: '', answer: '' };
    this.pendingAskResolve = null;
    this.clonedSprites = [];
    this.currentSpriteId = null;
    this.variables = {};
    this.cloudVariables = {}; // Store cloud variables locally
    this.tempo = 60; // BPM for music playback
    this.volume = 100; // Volume percentage
    this.broadcastHandlers = new Map(); // Map<message, handler>

    // Bind event listeners
    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keyboardState[e.key.toLowerCase()] = true;
      this.keyboardState[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keyboardState[e.key.toLowerCase()] = false;
      this.keyboardState[e.code] = false;
    });
    // Mouse events
    document.addEventListener('mousemove', (e) => {
      this.mouseState.x = e.clientX;
      this.mouseState.y = e.clientY;
    });
    document.addEventListener('mousedown', () => {
      this.mouseState.down = true;
    });
    document.addEventListener('mouseup', () => {
      this.mouseState.down = false;
    });
  }

  _initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  _updateState(spriteId, updates) {
    if (spriteId) {
      this.state.sprites[spriteId] = { ...this.state.sprites[spriteId], ...updates };
    }
    this.callbacks.onStateChange?.(this.state);
  }

  _getSprite(spriteId) {
    return this.sprites.find(s => s.id === spriteId) || this.sprites[0];
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ========================================================================
  // Motion Blocks
  // ========================================================================
  motion_movesteps(spriteId, steps) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const rad = ((state.direction ?? 90) - 90) * Math.PI / 180;
    const oldX = state.x || 0;
    const oldY = state.y || 0;
    const newX = oldX + Math.cos(rad) * steps;
    const newY = oldY - Math.sin(rad) * steps;

    // Draw on pen canvas if pen is down
    if (state.penDown) {
      this.callbacks.onPenDraw?.(spriteId, oldX, oldY, newX, newY, state.penColor || '#000000', state.penSize || 1);
    }

    this._updateState(spriteId, { x: newX, y: newY });
  }

  motion_gotoxy(spriteId, x, y) {
    this._updateState(spriteId, { x, y });
  }

  motion_setx(spriteId, x) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { x });
  }

  motion_sety(spriteId, y) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { y });
  }

  motion_changexby(spriteId, dx) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { x: (state.x || 0) + dx });
  }

  motion_changeyby(spriteId, dy) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { y: (state.y || 0) + dy });
  }

  motion_turn_right(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction || 90) + deg) % 360;
    this._updateState(spriteId, { direction: newDir < 0 ? newDir + 360 : newDir });
  }

  motion_turn_left(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction || 90) - deg + 360) % 360;
    this._updateState(spriteId, { direction: newDir });
  }

  motion_ifonedgebounce(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    let { x, y, direction } = state;
    const stageWidth = 240;
    const stageHeight = 180;
    const halfW = stageWidth / 2;
    const halfH = stageHeight / 2;

    if (x > halfW || x < -halfW || y > halfH || y < -halfH) {
      // Bounce: reverse direction
      let newDir = (180 - direction) % 360;
      if (newDir < 0) newDir += 360;
      // Clamp position
      x = Math.max(-halfW, Math.min(halfW, x));
      y = Math.max(-halfH, Math.min(halfH, y));
      this._updateState(spriteId, { x, y, direction: newDir });
    }
  }

  motion_glideto(spriteId, secs, x, y) {
    return this._delay(secs * 1000).then(() => {
      this._updateState(spriteId, { x, y });
    });
  }

  motion_pointindirection(spriteId, direction) {
    this._updateState(spriteId, { direction });
  }

  motion_pointtowards(spriteId, targetId) {
    const state = this.state.sprites[spriteId] || {};
    const target = this._getSprite(targetId);
    const targetState = this.state.sprites[target?.id] || {};
    const dx = targetState.x - state.x;
    const dy = -(targetState.y - state.y);
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    this._updateState(spriteId, { direction: angle });
  }

  motion_setrotationstyle(spriteId, style) {
    const sprite = this._getSprite(spriteId);
    if (sprite) sprite.rotationStyle = style;
  }

  motion_xposition(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.x || 0;
  }

  motion_yposition(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.y || 0;
  }

  motion_direction(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.direction || 90;
  }

  motion_changexspeed(spriteId, dx) {
    const state = this.state.sprites[spriteId] || {};
    const speed = (state.speedX || 0) + dx;
    this._updateState(spriteId, { speedX: speed });
  }

  motion_changeyspeed(spriteId, dy) {
    const state = this.state.sprites[spriteId] || {};
    const speed = (state.speedY || 0) + dy;
    this._updateState(spriteId, { speedY: speed });
  }

  // ========================================================================
  // Looks Blocks
  // ========================================================================
  looks_say(spriteId, text) {
    this._updateState(spriteId, { saying: String(text) });
  }

  looks_sayforsecs(spriteId, text, secs) {
    this._updateState(spriteId, { saying: String(text) });
    return this._delay(secs * 1000).then(() => {
      this._updateState(spriteId, { saying: null });
    });
  }

  looks_think(spriteId, text) {
    this._updateState(spriteId, { thinking: String(text) });
  }

  looks_thinkforsecs(spriteId, text, secs) {
    this._updateState(spriteId, { thinking: String(text) });
    return this._delay(secs * 1000).then(() => {
      this._updateState(spriteId, { thinking: null });
    });
  }

  looks_show(spriteId) {
    this._updateState(spriteId, { visible: true });
  }

  looks_hide(spriteId) {
    this._updateState(spriteId, { visible: false });
  }

  looks_hideallsprites() {
    Object.keys(this.state.sprites).forEach(id => {
      this._updateState(id, { visible: false });
    });
  }

  looks_switchcostumeto(spriteId, costumeName) {
    const sprite = this._getSprite(spriteId);
    if (!sprite) return;
    const idx = sprite.costumes.findIndex(c => c.name === costumeName);
    if (idx >= 0) {
      this._updateState(spriteId, { currentCostume: idx });
    }
  }

  looks_nextcostume(spriteId) {
    const sprite = this._getSprite(spriteId);
    if (!sprite) return;
    const state = this.state.sprites[spriteId] || {};
    const next = ((state.currentCostume || 0) + 1) % sprite.costumes.length;
    this._updateState(spriteId, { currentCostume: next });
  }

  looks_changesizeby(spriteId, delta) {
    const state = this.state.sprites[spriteId] || {};
    const newSize = Math.max(1, (state.size || 100) + delta);
    this._updateState(spriteId, { size: newSize });
  }

  looks_setsizeto(spriteId, size) {
    this._updateState(spriteId, { size: Math.max(1, size) });
  }

  looks_switchbackdropto(spriteId, backdropName) {
    const idx = this.callbacks.findBackdropIndex?.(backdropName);
    if (idx >= 0) {
      this.callbacks.onBackdropChange?.(idx);
    }
  }

  looks_nextbackdrop() {
    this.callbacks.onNextBackdrop?.();
  }

  looks_backdropname(spriteId) {
    const backdrop = this.callbacks.getBackdropName?.() || '背景1';
    return backdrop;
  }

  looks_costumenumbername(spriteId) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const costumeIdx = state.currentCostume || 0;
    return costumeIdx + 1; // Scratch uses 1-indexed costume numbers
  }

  looks_costumename(spriteId) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const costumeIdx = state.currentCostume || 0;
    return sprite?.costumes?.[costumeIdx]?.name || '造型1';
  }

  looks_backdropnumber(spriteId) {
    return this.callbacks.getBackdropNumber?.() || 1;
  }

  looks_size(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.size || 100;
  }

  looks_changeeffectby(spriteId, effect, delta) {
    const state = this.state.sprites[spriteId] || {};
    const effects = state.graphicEffects || {};
    effects[effect] = (effects[effect] || 0) + delta;
    this._updateState(spriteId, { graphicEffects: effects });
  }

  looks_seteffectto(spriteId, effect, value) {
    const state = this.state.sprites[spriteId] || {};
    const effects = state.graphicEffects || {};
    effects[effect] = value;
    this._updateState(spriteId, { graphicEffects: effects });
  }

  looks_cleargraphiceffects(spriteId) {
    this._updateState(spriteId, { graphicEffects: {} });
  }

  looks_goforwardlayers(spriteId, n) {
    const state = this.state.sprites[spriteId] || {};
    const currentLayer = state.layer || 0;
    this._updateState(spriteId, { layer: Math.min(100, currentLayer + n) });
  }

  looks_gobacklayers(spriteId, n) {
    const state = this.state.sprites[spriteId] || {};
    const currentLayer = state.layer || 0;
    this._updateState(spriteId, { layer: Math.max(-100, currentLayer - n) });
  }

  looks_gotofrontback(spriteId, front) {
    this._updateState(spriteId, { layer: front ? 100 : -100 });
  }

  // ========================================================================
  // Sound Blocks
  // ========================================================================
  async sound_play(spriteId, soundName) {
    const sprite = this._getSprite(spriteId);
    const sound = sprite?.sounds?.find(s => s.name === soundName);
    if (sound?.dataUrl) {
      await this._playAudio(sound.dataUrl);
    }
  }

  async sound_playuntildone(spriteId, soundName) {
    const sprite = this._getSprite(spriteId);
    const sound = sprite?.sounds?.find(s => s.name === soundName);
    if (sound?.dataUrl) {
      await this._playAudio(sound.dataUrl, false);
    } else {
      await this._delay(500); // Default delay if no sound
    }
  }

  sound_stopallsounds() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  sound_changeeffectby(spriteId, effect, delta) {
    const state = this.state.sprites[spriteId] || {};
    const effects = state.soundEffects || {};
    effects[effect] = (effects[effect] || 0) + delta;
    this._updateState(spriteId, { soundEffects: effects });
  }

  sound_seteffectto(spriteId, effect, value) {
    const state = this.state.sprites[spriteId] || {};
    const effects = state.soundEffects || {};
    effects[effect] = value;
    this._updateState(spriteId, { soundEffects: effects });
  }

  sound_changevolumeby(spriteId, delta) {
    const state = this.state.sprites[spriteId] || {};
    const newVol = Math.max(0, Math.min(100, (state.volume || 100) + delta));
    this._updateState(spriteId, { volume: newVol });
  }

  sound_setvolumeto(spriteId, volume) {
    this._updateState(spriteId, { volume: Math.max(0, Math.min(100, volume)) });
  }

  async _playAudio(dataUrl, loop = false) {
    try {
      const ctx = this._initAudio();
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = loop;
      source.connect(ctx.destination);
      source.start(0);
      return new Promise(resolve => {
        source.onended = resolve;
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
      return this._delay(500);
    }
  }

  async sound_playnotemusic(spriteId, note, beats) {
    // Simple beep tone using Web Audio API
    try {
      const ctx = this._initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'triangle';
      // Convert MIDI note to frequency (note 60 = C4 = 261.63 Hz)
      const frequency = 261.63 * Math.pow(2, (note - 60) / 12);
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime((this.volume / 100) * 0.3, ctx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      // Duration based on tempo: beats / (tempo/60) = seconds
      const duration = (beats * 60) / this.tempo;
      await this._delay(duration * 1000);
      oscillator.stop();
    } catch (e) {
      const duration = (beats * 60) / this.tempo;
      await this._delay(duration * 1000);
    }
  }

  // Drum sound frequencies and characteristics
  _playDrum(drumType, duration) {
    const ctx = this._initAudio();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Different drum types have different frequencies and waveforms
    const drumConfigs = {
      '1': { freq: 150, type: 'sine', attack: 0.01, decay: 0.2 },
      '2': { freq: 200, type: 'triangle', attack: 0.01, decay: 0.15 },
      '3': { freq: 180, type: 'sawtooth', attack: 0.01, decay: 0.12 },
      '4': { freq: 800, type: 'square', attack: 0.001, decay: 0.05 },
      '5': { freq: 600, type: 'square', attack: 0.001, decay: 0.3 },
      '6': { freq: 200, type: 'sine', attack: 0.01, decay: 0.25 },
      '7': { freq: 250, type: 'sine', attack: 0.01, decay: 0.2 },
      '8': { freq: 350, type: 'sine', attack: 0.01, decay: 0.15 },
      '9': { freq: 600, type: 'square', attack: 0.01, decay: 0.1 },
      '10': { freq: 400, type: 'square', attack: 0.001, decay: 0.4 },
      '11': { freq: 350, type: 'square', attack: 0.001, decay: 0.5 },
      '12': { freq: 800, type: 'triangle', attack: 0.01, decay: 0.3 }
    };

    const config = drumConfigs[drumType] || drumConfigs['1'];
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(config.freq * 0.5, ctx.currentTime + config.decay);

    const volume = (this.volume / 100) * 0.5;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + config.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.decay);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + config.decay + 0.1);

    return config.decay * 1000;
  }

  async sound_playdrum(spriteId, drum, beats) {
    try {
      const duration = (beats * 60) / this.tempo;
      this._playDrum(drum, duration);
      await this._delay(duration * 1000);
    } catch (e) {
      const duration = (beats * 60) / this.tempo;
      await this._delay(duration * 1000);
    }
  }

  async sound_rest(spriteId, beats) {
    // Rest for the specified number of beats
    const duration = (beats * 60) / this.tempo;
    await this._delay(duration * 1000);
  }

  sound_settempo(spriteId, tempo) {
    this.tempo = Math.max(20, Math.min(500, tempo));
  }

  sound_changetempoby(spriteId, delta) {
    this.tempo = Math.max(20, Math.min(500, this.tempo + delta));
  }

  sound_tempo(spriteId) {
    return this.tempo;
  }

  sound_volume(spriteId) {
    return this.volume;
  }

  // ========================================================================
  // Sensing Blocks
  // ========================================================================
  sensing_touching(spriteId, targetId) {
    const state = this.state.sprites[spriteId] || {};
    const stageWidth = 240;
    const stageHeight = 180;
    const halfW = stageWidth / 2;
    const halfH = stageHeight / 2;

    if (targetId === '_mouse_') {
      // Check if sprite is under mouse - simplified check
      const mouseX = this.mouseState.x - 100;
      const mouseY = -(this.mouseState.y - 100);
      const dx = (state.x || 0) - mouseX;
      const dy = (state.y || 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 50;
    }
    if (targetId === '_edge_') {
      // Check if sprite is touching edge
      const x = state.x || 0;
      const y = state.y || 0;
      return x >= halfW || x <= -halfW || y >= halfH || y <= -halfH;
    }
    // Check collision with another sprite by name
    const targetSprite = this.sprites.find(s => s.name === targetId);
    if (!targetSprite) return false;
    const targetState = this.state.sprites[targetSprite.id] || {};
    const dx = (state.x || 0) - (targetState.x || 0);
    const dy = (state.y || 0) - (targetState.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 50; // Approximate collision threshold
  }

  sensing_touchingcolor(spriteId, color) {
    // Would need canvas pixel detection
    return false;
  }

  sensing_coloristouching(spriteId, color1, color2) {
    return false;
  }

  sensing_distanceto(spriteId, targetId) {
    const state = this.state.sprites[spriteId] || {};
    if (targetId === '_mouse_') {
      // Approximate distance to mouse
      const mouseX = this.mouseState.x - 100;
      const mouseY = -(this.mouseState.y - 100);
      const dx = (state.x || 0) - mouseX;
      const dy = (state.y || 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    if (targetId === '_random_') {
      // Random position distance
      return Math.sqrt((state.x || 0) ** 2 + (state.y || 0) ** 2);
    }
    // Find target sprite by name
    const targetSprite = this.sprites.find(s => s.name === targetId);
    if (!targetSprite) return 100; // Default distance if sprite not found
    const targetState = this.state.sprites[targetSprite.id] || {};
    const dx = (state.x || 0) - (targetState.x || 0);
    const dy = (state.y || 0) - (targetState.y || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  async sensing_askandwait(spriteId, question) {
    return new Promise((resolve) => {
      this.askInput = { active: true, question, answer: '' };
      this.pendingAskResolve = resolve;
      this.callbacks.onAsk?.(question);
    });
  }

  answer() {
    return this.askInput.answer;
  }

  sensing_keypressed(key) {
    return this.keyboardState[key.toLowerCase()] || this.keyboardState[key] || false;
  }

  sensing_mousedown() {
    return this.mouseState.down;
  }

  sensing_mousex() {
    return this.mouseState.x - 100; // Approximate stage offset
  }

  sensing_mousey() {
    return -(this.mouseState.y - 100); // Approximate stage offset
  }

  sensing_setdragmode(spriteId, mode) {
    const sprite = this._getSprite(spriteId);
    if (sprite) sprite.draggable = mode !== 'none';
  }

  sensing_resettimer() {
    this.startTime = Date.now();
  }

  sensing_timer() {
    return (Date.now() - (this.startTime || Date.now())) / 1000;
  }

  sensing_current(menu) {
    const now = new Date();
    switch (menu) {
      case 'YEAR': return now.getFullYear();
      case 'MONTH': return now.getMonth() + 1; // Scratch uses 1-indexed months
      case 'DATE': return now.getDate();
      case 'DAYOFWEEK': return now.getDay(); // 0 = Sunday in JS, Scratch uses 0 = Sunday too
      case 'HOUR': return now.getHours();
      case 'MINUTE': return now.getMinutes();
      case 'SECOND': return now.getSeconds();
      default: return 0;
    }
  }

  sensing_dayssince2000() {
    const start = new Date('2000-01-01T00:00:00Z').getTime();
    const now = Date.now();
    return (now - start) / (1000 * 60 * 60 * 24);
  }

  sensing_loudness() {
    // Simplified - would need audio analysis API
    return 0;
  }

  // ========================================================================
  // Operator Blocks
  // ========================================================================
  operator_add(a, b) { return (a || 0) + (b || 0); }
  operator_subtract(a, b) { return (a || 0) - (b || 0); }
  operator_multiply(a, b) { return (a || 0) * (b || 0); }
  operator_divide(a, b) { return b !== 0 ? (a || 0) / (b || 0) : 0; }
  operator_random(spriteId, from, to) { return this._random(from, to); }
  operator_gt(a, b) { return (a || 0) > (b || 0); }
  operator_lt(a, b) { return (a || 0) < (b || 0); }
  operator_equals(a, b) { return a === b; }
  operator_and(a, b) { return !!(a && b); }
  operator_or(a, b) { return !!(a || b); }
  operator_not(a) { return !a; }
  operator_mod(a, b) { return b !== 0 ? (a || 0) % b : 0; }
  operator_round(a) { return Math.round(a || 0); }
  operator_mathop(spriteId, op, num) {
    const n = num || 0;
    switch (op) {
      case 'abs': return Math.abs(n);
      case 'floor': return Math.floor(n);
      case 'ceiling': return Math.ceil(n);
      case 'sqrt': return Math.sqrt(n);
      case 'sin': return Math.sin(n * Math.PI / 180);
      case 'cos': return Math.cos(n * Math.PI / 180);
      case 'tan': return Math.tan(n * Math.PI / 180);
      case 'asin': return Math.asin(n) * 180 / Math.PI;
      case 'acos': return Math.acos(n) * 180 / Math.PI;
      case 'atan': return Math.atan(n) * 180 / Math.PI;
      case 'ln': return Math.log(n);
      case 'log': return Math.log(n) / Math.LN10;
      case 'e^': return Math.exp(n);
      case '10^': return Math.pow(10, n);
      default: return n;
    }
  }

  // String operations
  operator_join(a, b) { return String(a || '') + String(b || ''); }
  operator_letter_of(spriteId, letter, string) {
    const s = String(string || '');
    const idx = Math.floor(letter || 1) - 1;
    return idx >= 0 && idx < s.length ? s[idx] : '';
  }
  operator_length(spriteId, string) { return String(string || '').length; }
  operator_contains(spriteId, string1, string2) {
    return String(string1 || '').toLowerCase().includes(String(string2 || '').toLowerCase());
  }

  operator_tr(spriteId, op, string) {
    const s = String(string || '');
    switch (op) {
      case 'letter': return '';
      case 'trim': return s.trim();
      case 'uppercase': return s.toUpperCase();
      case 'lowercase': return s.toLowerCase();
      default: return s;
    }
  }

  // ========================================================================
  // Control Blocks
  // ========================================================================
  async control_wait(spriteId, seconds) {
    await this._delay(seconds * 1000);
  }

  async control_wait_until(spriteId, condition) {
    while (!condition()) {
      await this._delay(50);
    }
  }

  async control_repeat_until(spriteId, condition, fn) {
    while (!condition() && this.running) {
      await fn();
    }
  }

  async control_repeat(spriteId, times, fn) {
    for (let i = 0; i < times && this.running; i++) {
      await fn();
    }
  }

  async control_forever(spriteId, fn) {
    while (this.running) {
      await fn();
    }
  }

  async control_if(spriteId, condition, fn) {
    if (condition()) {
      await fn();
    }
  }

  async control_if_else(spriteId, condition, ifFn, elseFn) {
    if (condition()) {
      await ifFn?.();
    } else {
      await elseFn?.();
    }
  }

  control_stop(spriteId, option) {
    if (option === 'all') {
      this.running = false;
    } else if (option === 'this script') {
      throw new Error('STOP_SCRIPT');
    }
  }

  control_create_clone_of(spriteId, targetId) {
    const original = this._getSprite(targetId);
    if (original) {
      const clone = {
        ...original,
        id: `clone_${Date.now()}`,
        isClone: true,
      };
      this.clonedSprites.push(clone);
      this.callbacks.onCloneCreated?.(clone);
    }
  }

  control_delete_this_clone(spriteId) {
    this.callbacks.onCloneDeleted?.(spriteId);
  }

  control_start_as_clone(spriteId) {
    // Clone initialization
  }

  control_gety(count, elapsed, lastValue) {
    // Timed execution support
    return elapsed;
  }

  // ========================================================================
  // Event Blocks
  // ========================================================================
  async event_whenflagclicked(spriteId, fn) {
    // This is called when green flag is clicked
    if (this.running) {
      await fn();
    }
  }

  async event_whenkeypressed(spriteId, key, fn) {
    // This would need event binding
    while (this.running && !this.sensing_keypressed(key)) {
      await this._delay(50);
    }
    if (this.running) {
      await fn();
    }
  }

  async event_whenthisspriteclicked(spriteId, fn) {
    // Sprite click handling
    await fn();
  }

  async event_whenbackdropswitchto(spriteId, backdropName, fn) {
    while (this.running) {
      await this._delay(100);
    }
  }

  async event_whengreaterthan(spriteId, property, value, fn) {
    while (this.running) {
      let currentValue;
      if (property === 'TIMER') {
        currentValue = this.sensing_timer();
      } else if (property === 'LOUDNESS') {
        currentValue = 0;
      }
      if (currentValue > value) {
        await fn();
        break;
      }
      await this._delay(50);
    }
  }

  event_broadcast(spriteId, message) {
    // Invoke registered broadcast handlers
    const handlers = this.broadcastHandlers.get(message);
    if (handlers) {
      handlers.forEach(fn => fn());
    }
    this.callbacks.onBroadcast?.(message);
  }

  async event_broadcastandwait(spriteId, message) {
    this.event_broadcast(spriteId, message);
    await this._delay(100);
  }

  // ========================================================================
  // Variable Blocks
  // ========================================================================
  data_setvariableto(spriteId, name, value) {
    this.variables = this.variables || {};
    this.variables[name] = value;

    // Check if this is a cloud variable (name starts with _cloud_)
    if (name.startsWith('_cloud_')) {
      this.cloudVariables[name] = value;
      // Notify callback for cloud variable sync
      this.callbacks.onCloudVariableChange?.(name, value);
    }
  }

  data_changevariableby(spriteId, name, delta) {
    this.variables = this.variables || {};
    this.variables[name] = (this.variables[name] || 0) + delta;

    // Check if this is a cloud variable (name starts with _cloud_)
    if (name.startsWith('_cloud_')) {
      this.cloudVariables[name] = this.variables[name];
      // Notify callback for cloud variable sync
      this.callbacks.onCloudVariableChange?.(name, this.variables[name]);
    }
  }

  data_showvariable(spriteId, name) {
    // UI handling
  }

  data_hidevariable(spriteId, name) {
    // UI handling
  }

  // ========================================================================
  // List Blocks
  // ========================================================================
  data_addtolist(spriteId, item, listName) {
    this.lists = this.lists || {};
    this.lists[listName] = this.lists[listName] || [];
    this.lists[listName].push(item);
  }

  data_deleteoflist(spriteId, index, listName) {
    this.lists = this.lists || {};
    const list = this.lists[listName] || [];
    const idx = Math.floor(index) - 1;
    if (idx >= 0 && idx < list.length) {
      list.splice(idx, 1);
    }
  }

  data_inserttolist(spriteId, item, index, listName) {
    this.lists = this.lists || {};
    const list = this.lists[listName] || [];
    const idx = Math.floor(index) - 1;
    list.splice(idx, 0, item);
  }

  data_replaceitemoflist(spriteId, index, listName, newItem) {
    this.lists = this.lists || {};
    const list = this.lists[listName] || [];
    const idx = Math.floor(index) - 1;
    if (idx >= 0 && idx < list.length) {
      list[idx] = newItem;
    }
  }

  data_itemoflist(spriteId, index, listName) {
    const list = this.lists?.[listName] || [];
    const idx = Math.floor(index) - 1;
    return idx >= 0 && idx < list.length ? list[idx] : '';
  }

  data_lengthoflist(spriteId, listName) {
    return (this.lists?.[listName] || []).length;
  }

  data_listcontainsitem(spriteId, listName, item) {
    return (this.lists?.[listName] || []).includes(item);
  }

  data_deletealloflist(spriteId, listName) {
    this.lists = this.lists || {};
    this.lists[listName] = [];
  }

  data_replaceitemoflist(spriteId, index, listName, newItem) {
    this.lists = this.lists || {};
    const list = this.lists[listName] || [];
    const idx = Math.floor(index) - 1;
    if (idx >= 0 && idx < list.length) {
      list[idx] = newItem;
    }
  }

  data_showlist(spriteId, listName) {
    // UI handling
  }

  data_hidelist(spriteId, listName) {
    // UI handling
  }

  // ========================================================================
  // Pen Blocks
  // ========================================================================
  pen_up(spriteId) {
    this._updateState(spriteId, { penDown: false });
  }

  pen_down(spriteId) {
    this._updateState(spriteId, { penDown: true });
  }

  pen_color(spriteId, color) {
    this._updateState(spriteId, { penColor: color });
  }

  pen_size(spriteId, size) {
    this._updateState(spriteId, { penSize: Math.max(1, Math.min(100, size || 1)) });
  }

  pen_clear(spriteId) {
    this.callbacks.onPenClear?.();
  }

  pen_stamp(spriteId) {
    this.callbacks.onPenStamp?.(spriteId);
  }

  // ========================================================================
  // Execution Control
  // ========================================================================
  start() {
    this.running = true;
    this.startTime = Date.now();
  }

  stop() {
    this.running = false;
    this.sound_stopallsounds();
  }

  setCurrentSprite(spriteId) {
    this.currentSpriteId = spriteId;
  }

  resolveAsk(answer) {
    if (this.pendingAskResolve) {
      this.askInput.answer = answer;
      this.askInput.active = false;
      this.pendingAskResolve();
      this.pendingAskResolve = null;
    }
  }

  // Broadcast handler management
  addBroadcastHandler(message, handler) {
    if (!this.broadcastHandlers.has(message)) {
      this.broadcastHandlers.set(message, []);
    }
    this.broadcastHandlers.get(message).push(handler);
  }

  clearBroadcastHandlers(message) {
    if (message) {
      this.broadcastHandlers.delete(message);
    } else {
      this.broadcastHandlers.clear();
    }
  }
}

export default function IDEPage() {
  const workspaceRef = useRef(null);
  const stageRef = useRef(null);
  const penRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [projectName, setProjectName] = useState('我的项目');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('scripts');
  const [projectId, setProjectId] = useState(null);
  const [cloudProjects, setCloudProjects] = useState([]);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [lastSavedData, setLastSavedData] = useState('');
  const navigate = useNavigate();
  const { type } = useParams();
  const location = useLocation();

  // Project data state
  const [projectData, setProjectData] = useState({
    stage: {
      backdrops: [{ id: 'backdrop1', name: '背景1', dataUrl: '' }],
      currentBackdrop: 0,
    },
    sprites: [],
  });

  // Sprite management state
  const [sprites, setSprites] = useState([]);
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [spriteModalVisible, setSpriteModalVisible] = useState(false);
  const [editingSpriteName, setEditingSpriteName] = useState('');
  const [costumeModalVisible, setCostumeModalVisible] = useState(false);
  const [editingCostumeName, setEditingCostumeName] = useState('');
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [editingSoundName, setEditingSoundName] = useState('');

  // Runtime state for animation
  const [runtimeState, setRuntimeState] = useState({
    sprites: {},
    running: false,
    threads: [],
  });

  // Cloud variables state
  const [cloudVariables, setCloudVariables] = useState([]);
  const [cloudVariablesModalVisible, setCloudVariablesModalVisible] = useState(false);
  const [newCloudVariableName, setNewCloudVariableName] = useState('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'

  // Sprite Features State - for direct sprite property editing
  const [spriteFeaturesVisible, setSpriteFeaturesVisible] = useState(true);
  const [editingDirection, setEditingDirection] = useState(false);
  const [tempDirection, setTempDirection] = useState(90);

  const projectType = type || 'scratch';

  // Fetch cloud projects
  const fetchCloudProjects = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const projects = await getProjects(user.id);
      setCloudProjects(projects.filter(p => p.type === projectType));
    } catch (error) {
      console.error('获取云端项目列表失败:', error);
    }
  }, [projectType]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize Blockly workspace and CodeExecutor
  useEffect(() => {
    loadBlockly();
    fetchCloudProjects();
    initDefaultProjectData();

    // Initialize code executor
    codeExecutorRef.current = new CodeExecutor(
      (entry) => {
        if (entry.clear) {
          setOutputConsole([]);
        } else {
          setOutputConsole(prev => [...prev, entry]);
        }
      },
      (entry) => {
        setOutputConsole(prev => [...prev, entry]);
      },
      (prompt, resolve) => {
        setInputPrompt(prompt);
        setInputVisible(true);
        setInputResolve(resolve);
      }
    );

    if (location.state?.projectId) {
      handleLoadProject(location.state.projectId);
    }

    return () => {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [location.state]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (projectId) {
      const timer = setInterval(() => handleAutoSave(), 60000);
      setAutoSaveTimer(timer);
      return () => clearInterval(timer);
    }
  }, [projectId, lastSavedContent, lastSavedData]);

  // Redraw stage when runtime state changes
  useEffect(() => {
    if (stageRef.current && isRunning) {
      drawStage();
    }
  }, [runtimeState, isRunning]);

  const initDefaultProjectData = () => {
    const defaultSprite = {
      id: generateId(),
      name: '角色1',
      x: 0,
      y: 0,
      direction: 90,
      visible: true,
      size: 100,
      rotationStyle: 'normal',
      costumes: [
        { id: generateId(), name: '造型1', dataUrl: createDefaultCostume('#FFBF00') }
      ],
      currentCostume: 0,
      sounds: [],
      scripts: '',
    };

    setSprites([defaultSprite]);
    setSelectedSprite(defaultSprite.id);
    setProjectData({
      stage: {
        backdrops: [{ id: generateId(), name: '背景1', dataUrl: '' }],
        currentBackdrop: 0,
      },
    });
  };

  const createDefaultCostume = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(50, 50, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(35, 40, 8, 0, Math.PI * 2);
    ctx.arc(65, 40, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(50, 60, 20, 0, Math.PI);
    ctx.stroke();
    return canvas.toDataURL('image/png');
  };

  const loadBlockly = () => {
    const cdnBase = 'https://cdn.jsdelivr.net/npm/blockly';
    const version = '9.0.1';

    const script = document.createElement('script');
    script.src = `${cdnBase}@${version}/blockly_compressed.js`;
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${cdnBase}@${version}/blockly.css`;
      link.onload = () => {
        const msgScript = document.createElement('script');
        msgScript.src = `${cdnBase}@${version}/msg/zh-hans.js`;
        msgScript.onload = () => {
          // Register custom blocks and code generators after Blockly loads
          if (window.Blockly) {
            defineBlocks(window.Blockly);
            registerGenerators(window.Blockly);
            registerPythonGenerators(window.Blockly);
          }
          initWorkspace();
        };
        msgScript.onerror = () => {
          if (window.Blockly) {
            defineBlocks(window.Blockly);
            registerGenerators(window.Blockly);
            registerPythonGenerators(window.Blockly);
          }
          initWorkspace();
        };
        document.head.appendChild(msgScript);
      };
      link.onerror = () => {
        const backupLink = document.createElement('link');
        backupLink.rel = 'stylesheet';
        backupLink.href = 'https://blockly.googleapis.com/blockly/latest/blockly.css';
        backupLink.onload = () => {
          if (window.Blockly) {
            defineBlocks(window.Blockly);
            registerGenerators(window.Blockly);
            registerPythonGenerators(window.Blockly);
          }
          initWorkspace();
        };
        document.head.appendChild(backupLink);
      };
      document.head.appendChild(link);
    };
    script.onerror = () => {
      const backupScript = document.createElement('script');
      backupScript.src = 'https://blockly.googleapis.com/blockly/latest/blockly_compressed.js';
      backupScript.onload = () => {
        const backupLink = document.createElement('link');
        backupLink.rel = 'stylesheet';
        backupLink.href = 'https://blockly.googleapis.com/blockly/latest/blockly.css';
        backupLink.onload = () => {
          if (window.Blockly) {
            defineBlocks(window.Blockly);
            registerGenerators(window.Blockly);
            registerPythonGenerators(window.Blockly);
          }
          initWorkspace();
        };
        document.head.appendChild(backupLink);
      };
      document.head.appendChild(backupScript);
    };
    document.head.appendChild(script);
  };

  const initWorkspace = () => {
    if (window.Blockly) {
      try {
        const toolbox = getToolbox();
        workspaceRef.current = window.Blockly.inject('blocks-editor', {
          toolbox: toolbox,
          grid: { spacing: 20, length: 3, colour: '#ddd', snap: true },
          trashcan: true,
          zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 2, minScale: 0.5 },
          sounds: false,
        });

        // Load scripts for selected sprite
        if (selectedSprite) {
          const sprite = sprites.find(s => s.id === selectedSprite);
          if (sprite?.scripts) {
            try {
              const xmlDom = window.Blockly.Xml.textToDom(sprite.scripts);
              workspaceRef.current.clear();
              window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
            } catch (e) {}
          }
        }

        message.success('编程环境已就绪！');
      } catch (e) {
        console.error('Blockly初始化失败:', e);
        message.error('编程环境初始化失败');
      }
    }
  };

  const getToolbox = () => ({
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: '运动',
        colour: '#4C97FF',
        contents: [
          { kind: 'block', type: 'motion_move_steps' },
          { kind: 'block', type: 'motion_turn_right' },
          { kind: 'block', type: 'motion_turn_left' },
          { kind: 'block', type: 'motion_goto' },
          { kind: 'block', type: 'motion_gotoxy' },
          { kind: 'block', type: 'motion_glideto' },
          { kind: 'block', type: 'motion_changexby' },
          { kind: 'block', type: 'motion_changeyby' },
          { kind: 'block', type: 'motion_setx' },
          { kind: 'block', type: 'motion_sety' },
          { kind: 'block', type: 'motion_ifonedgebounce' },
          { kind: 'block', type: 'motion_pointindirection' },
          { kind: 'block', type: 'motion_pointtowards' },
          { kind: 'block', type: 'motion_setrotationstyle' },
          { kind: 'block', type: 'motion_changexspeed' },
          { kind: 'block', type: 'motion_changeyspeed' },
          { kind: 'block', type: 'motion_xposition' },
          { kind: 'block', type: 'motion_yposition' },
          { kind: 'block', type: 'motion_direction' },
        ]
      },
      {
        kind: 'category',
        name: '外观',
        colour: '#9966FF',
        contents: [
          { kind: 'block', type: 'looks_say' },
          { kind: 'block', type: 'looks_sayforsecs' },
          { kind: 'block', type: 'looks_think' },
          { kind: 'block', type: 'looks_thinkforsecs' },
          { kind: 'block', type: 'looks_show' },
          { kind: 'block', type: 'looks_hide' },
          { kind: 'block', type: 'looks_hideallsprites' },
          { kind: 'block', type: 'looks_switchcostumeto' },
          { kind: 'block', type: 'looks_nextcostume' },
          { kind: 'block', type: 'looks_changesizeby' },
          { kind: 'block', type: 'looks_setsizeto' },
          { kind: 'block', type: 'looks_changeeffectby' },
          { kind: 'block', type: 'looks_seteffectto' },
          { kind: 'block', type: 'looks_cleargraphiceffects' },
          { kind: 'block', type: 'looks_goforwardlayers' },
          { kind: 'block', type: 'looks_gobacklayers' },
          { kind: 'block', type: 'looks_gotofrontback' },
          { kind: 'block', type: 'looks_switchbackdropto' },
          { kind: 'block', type: 'looks_nextbackdrop' },
          { kind: 'block', type: 'looks_costumename' },
          { kind: 'block', type: 'looks_backdropname' },
          { kind: 'block', type: 'looks_backdropnumber' },
          { kind: 'block', type: 'looks_costumenumbername' },
          { kind: 'block', type: 'looks_size' },
        ]
      },
      {
        kind: 'category',
        name: '声音',
        colour: '#CFCF4F',
        contents: [
          { kind: 'block', type: 'sound_play' },
          { kind: 'block', type: 'sound_playuntildone' },
          { kind: 'block', type: 'sound_stopallsounds' },
          { kind: 'block', type: 'sound_changeeffectby' },
          { kind: 'block', type: 'sound_seteffectto' },
          { kind: 'block', type: 'sound_changevolumeby' },
          { kind: 'block', type: 'sound_setvolumeto' },
          { kind: 'block', type: 'sound_playnotemusic' },
          { kind: 'block', type: 'sound_playdrum' },
          { kind: 'block', type: 'sound_rest' },
          { kind: 'block', type: 'sound_settempo' },
          { kind: 'block', type: 'sound_changetempoby' },
        ]
      },
      {
        kind: 'category',
        name: '事件',
        colour: '#FFBF00',
        contents: [
          { kind: 'block', type: 'event_whenflagclicked' },
          { kind: 'block', type: 'event_whenkeypressed' },
          { kind: 'block', type: 'event_whenthisspriteclicked' },
          { kind: 'block', type: 'event_whenbackdropswitchto' },
          { kind: 'block', type: 'event_whengreaterthan' },
        ]
      },
      {
        kind: 'category',
        name: '控制',
        colour: '#FFAB19',
        contents: [
          { kind: 'block', type: 'control_wait' },
          { kind: 'block', type: 'control_wait_secs' },
          { kind: 'block', type: 'control_repeat' },
          { kind: 'block', type: 'control_repeat_until' },
          { kind: 'block', type: 'control_forever' },
          { kind: 'block', type: 'control_if' },
          { kind: 'block', type: 'control_if_else' },
          { kind: 'block', type: 'control_stop' },
          { kind: 'block', type: 'control_start_as_clone' },
          { kind: 'block', type: 'control_create_clone_of' },
          { kind: 'block', type: 'control_delete_this_clone' },
        ]
      },
      {
        kind: 'category',
        name: '传感',
        colour: '#5CB1D6',
        contents: [
          { kind: 'block', type: 'sensing_touching' },
          { kind: 'block', type: 'sensing_touchingcolor' },
          { kind: 'block', type: 'sensing_coloristouching' },
          { kind: 'block', type: 'sensing_distanceto' },
          { kind: 'block', type: 'sensing_askandwait' },
          { kind: 'block', type: 'sensing_keypressed' },
          { kind: 'block', type: 'sensing_mousedown' },
          { kind: 'block', type: 'sensing_mousex' },
          { kind: 'block', type: 'sensing_mousey' },
          { kind: 'block', type: 'sensing_answer' },
          { kind: 'block', type: 'sensing_timer' },
          { kind: 'block', type: 'sensing_resettimer' },
          { kind: 'block', type: 'sensing_current' },
          { kind: 'block', type: 'sensing_dayssince2000' },
          { kind: 'block', type: 'sensing_loudness' },
          { kind: 'block', type: 'sensing_username' },
          { kind: 'block', type: 'sensing_setdragmode' },
        ]
      },
      {
        kind: 'category',
        name: '运算',
        colour: '#59C059',
        contents: [
          { kind: 'block', type: 'operator_add' },
          { kind: 'block', type: 'operator_subtract' },
          { kind: 'block', type: 'operator_multiply' },
          { kind: 'block', type: 'operator_divide' },
          { kind: 'block', type: 'operator_random' },
          { kind: 'block', type: 'operator_gt' },
          { kind: 'block', type: 'operator_lt' },
          { kind: 'block', type: 'operator_equals' },
          { kind: 'block', type: 'operator_and' },
          { kind: 'block', type: 'operator_or' },
          { kind: 'block', type: 'operator_not' },
          { kind: 'block', type: 'operator_join' },
          { kind: 'block', type: 'operator_letter_of' },
          { kind: 'block', type: 'operator_length' },
          { kind: 'block', type: 'operator_mod' },
          { kind: 'block', type: 'operator_round' },
          { kind: 'block', type: 'operator_mathop' },
          { kind: 'block', type: 'operator_contains' },
        ]
      },
      {
        kind: 'category',
        name: '变量',
        colour: '#FF8C1A',
        custom: 'VARIABLE',
        contents: []
      },
      {
        kind: 'category',
        name: '列表',
        colour: '#FF661A',
        custom: 'LIST',
        contents: []
      },
      {
        kind: 'category',
        name: '画笔',
        colour: '#00A0A0',
        contents: [
          { kind: 'block', type: 'pen_up' },
          { kind: 'block', type: 'pen_down' },
          { kind: 'block', type: 'pen_color' },
          { kind: 'block', type: 'pen_size' },
          { kind: 'block', type: 'pen_clear' },
          { kind: 'block', type: 'pen_stamp' },
        ]
      },
    ]
  });

  // Draw speech/thought bubble helper
  const drawBubble = (ctx, x, y, text, isThink) => {
    if (!text) return;
    ctx.save();
    const padding = 8;
    const fontSize = 12;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    const lines = text.split('\n');
    const maxWidth = Math.min(150, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
    const lineHeight = fontSize * 1.3;
    const bubbleHeight = lines.length * lineHeight + padding * 2;

    // Bubble background
    ctx.fillStyle = isThink ? '#d4d4d4' : '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - maxWidth / 2, y - bubbleHeight, maxWidth, bubbleHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Bubble tail
    ctx.beginPath();
    if (isThink) {
      ctx.arc(x - 5, y, 4, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 5, 3, 0, Math.PI * 2);
      ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2);
    } else {
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x + 8, y);
    }
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y - bubbleHeight + padding + i * lineHeight);
    });
    ctx.restore();
  };

  // Draw stage with all sprites
  const drawStage = useCallback(() => {
    const canvas = stageRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw backdrop
    const backdrop = projectData.stage.backdrops[projectData.stage.currentBackdrop];
    if (backdrop?.dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = backdrop.dataUrl;
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw all sprites sorted by layer
    const sortedSprites = [...sprites].sort((a, b) => {
      const layerA = runtimeState.sprites[a.id]?.layer || 0;
      const layerB = runtimeState.sprites[b.id]?.layer || 0;
      return layerA - layerB;
    });

    sortedSprites.forEach(sprite => {
      const state = runtimeState.sprites[sprite.id] || {};
      if (!state.visible) return;

      const costume = sprite.costumes[state.currentCostume || sprite.currentCostume];
      if (!costume?.dataUrl) return;

      const img = new Image();
      img.onload = () => {
        ctx.save();
        const scale = (state.size || sprite.size) / 100;
        const radians = ((state.direction || sprite.direction) - 90) * Math.PI / 180;
        const drawX = width / 2 + (state.x || sprite.x);
        const drawY = height / 2 - (state.y || sprite.y);
        ctx.translate(drawX, drawY);
        ctx.rotate(radians);
        ctx.scale(scale, scale);

        // Apply graphic effects
        if (state.graphicEffects) {
          const brightness = state.graphicEffects.brightness || 0;
          if (brightness !== 0) {
            ctx.filter = `brightness(${100 + brightness}%)`;
          }
        }

        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Draw say/think bubble
        if (state.saying) {
          drawBubble(ctx, drawX, drawY - img.height * scale / 2 - 20, state.saying, false);
        } else if (state.thinking) {
          drawBubble(ctx, drawX, drawY - img.height * scale / 2 - 20, state.thinking, true);
        }
      };
      img.src = costume.dataUrl;
    });
  }, [sprites, runtimeState, projectData]);

  // Execute Blockly code using ScratchInterpreter
  const executeCode = (code) => {
    if (!code) return;

    const allSprites = [...sprites];
    const initialState = {};
    allSprites.forEach(s => {
      initialState[s.id] = {
        x: s.x,
        y: s.y,
        direction: s.direction,
        visible: s.visible,
        size: s.size,
        currentCostume: s.currentCostume,
        saying: null,
        thinking: null,
        volume: 100,
        graphicEffects: {},
        soundEffects: {},
        penDown: false,
        layer: 0,
        penColor: '#000000',
        penSize: 1,
      };
    });

    const interpreter = new ScratchInterpreter(allSprites, { sprites: { ...initialState } }, {
      onStateChange: (newState) => {
        setRuntimeState(newState);
      },
      onAsk: (question) => {
        // Show ask input
        setAskQuestion(question);
        setAskVisible(true);
      },
      onPenClear: () => {
        const canvas = penRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
      onPenDraw: (spriteId, oldX, oldY, newX, newY, color, size) => {
        const canvas = penRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const stageW = canvas.width;
        const stageH = canvas.height;
        const drawOldX = stageW / 2 + oldX;
        const drawOldY = stageH / 2 - oldY;
        const drawNewX = stageW / 2 + newX;
        const drawNewY = stageH / 2 - newY;
        ctx.beginPath();
        ctx.moveTo(drawOldX, drawOldY);
        ctx.lineTo(drawNewX, drawNewY);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
      },
      onPenStamp: (spriteId) => {
        const canvas = penRef.current;
        const stageCanvas = stageRef.current;
        if (!canvas || !stageCanvas) return;
        const ctx = canvas.getContext('2d');
        const sprite = sprites.find(s => s.id === spriteId);
        const state = runtimeState.sprites[spriteId] || {};
        const costume = sprite?.costumes[state.currentCostume || 0];
        if (!costume?.dataUrl) return;
        const img = new Image();
        img.onload = () => {
          ctx.save();
          const scale = (state.size || 100) / 100;
          const radians = ((state.direction || 90) - 90) * Math.PI / 180;
          const drawX = canvas.width / 2 + (state.x || 0);
          const drawY = canvas.height / 2 - (state.y || 0);
          ctx.translate(drawX, drawY);
          ctx.rotate(radians);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
        };
        img.src = costume.dataUrl;
      },
      },
      onBroadcast: (message) => {
        // Handle broadcast messages
        console.log('Broadcast:', message);
      },
      onBackdropChange: (index) => {
        setProjectData(prev => ({
          ...prev,
          stage: { ...prev.stage, currentBackdrop: index }
        }));
      },
      onNextBackdrop: () => {
        setProjectData(prev => ({
          ...prev,
          stage: {
            ...prev.stage,
            currentBackdrop: (prev.stage.currentBackdrop + 1) % prev.stage.backdrops.length
          }
        }));
      },
      findBackdropIndex: (name) => {
        return projectData.stage.backdrops.findIndex(b => b.name === name);
      },
      getBackdropNumber: () => {
        return (projectData.stage.currentBackdrop || 0) + 1;
      },
      getBackdropName: () => {
        return projectData.stage.backdrops[projectData.stage.currentBackdrop]?.name || '背景1';
      },
      onCloneCreated: (clone) => {
        setSprites(prev => [...prev, clone]);
        const newState = { ...runtimeState.sprites };
        newState[clone.id] = {
          x: 0, y: 0, direction: 90, visible: true, size: 100,
          currentCostume: 0, saying: null, thinking: null
        };
        setRuntimeState(prev => ({ ...prev, sprites: newState }));
      },
      onCloneDeleted: (cloneId) => {
        setSprites(prev => prev.filter(s => s.id !== cloneId));
        const newState = { ...runtimeState.sprites };
        delete newState[cloneId];
        setRuntimeState(prev => ({ ...prev, sprites: newState }));
      },
      onCloudVariableChange: (name, value) => {
        // Update cloud variables state
        setCloudVariables(prev => {
          const exists = prev.some(v => v.name === name);
          if (exists) {
            return prev.map(v => v.name === name ? { ...v, value: String(value) } : v);
          }
          return [...prev, { name, value: String(value) }];
        });
        // Sync to cloud
        handleCloudVariableSync();
      },
    });

    // Initialize interpreter with current cloud variables
    cloudVariables.forEach(cv => {
      interpreter.variables[cv.name] = cv.value;
      interpreter.cloudVariables[cv.name] = cv.value;
    });

    interpreter.setCurrentSprite(selectedSprite);
    interpreter.start();
    setRuntimeState({ sprites: initialState, running: true, threads: [], interpreter });

    // Run the generated code asynchronously
    runAsyncCode(interpreter, code);
  };

  // Run async code with the interpreter
  const runAsyncCode = async (interpreter, code) => {
    try {
      // Create a function from generated code that uses the interpreter
      const asyncFn = new AsyncFunction(code);
      await asyncFn(interpreter);
    } catch (e) {
      if (e.message !== 'STOP_SCRIPT') {
        console.error('Execution error:', e);
      }
    } finally {
      if (interpreter.running) {
        setRuntimeState(prev => ({ ...prev, running: false }));
        setIsRunning(false);
      }
    }
  };

  // AsyncFunction constructor for running generated code
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  const handlePlay = () => {
    if (workspaceRef.current) {
      const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current);
      const scriptsXml = window.Blockly.Xml.domToText(xml);

      // Update current sprite's scripts
      setSprites(prev => prev.map(s =>
        s.id === selectedSprite ? { ...s, scripts: scriptsXml } : s
      ));

      // Generate and execute code
      const code = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      executeCode(code);
    }
    setIsRunning(true);
    setOutputVisible(true);
    message.success('项目运行中...');
  };

  // Handle Python code execution
  const handleRunPython = async (pythonCode) => {
    if (codeExecutorRef.current) {
      setOutputVisible(true);
      setActiveLanguage('python');
      await codeExecutorRef.current.executePython(pythonCode);
    }
  };

  // Handle C++ code execution
  const handleRunCpp = async (cppCode) => {
    if (codeExecutorRef.current) {
      setOutputVisible(true);
      setActiveLanguage('cpp');
      await codeExecutorRef.current.executeCPlusPlus(cppCode);
    }
  };

  // Get generated Python code from blocks using Blockly Python generator
  const getPythonCode = () => {
    if (workspaceRef.current && codeExecutorRef.current) {
      return codeExecutorRef.current.translateToPython(workspaceRef.current);
    }
    return '';
  };

  // Get generated C++ code from blocks
  const getCppCode = () => {
    if (workspaceRef.current && codeExecutorRef.current) {
      // Use the enhanced generator from CodeExecutor
      const jsCode = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      return codeExecutorRef.current.generateCppCode(jsCode);
    }
    if (workspaceRef.current) {
      const jsCode = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      // Enhanced JS-to-C++ conversion
      let cpp = `// Auto-generated C++ code
// Generated from Blockly/Scratch

#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

`;

      // Process line by line
      const lines = jsCode.split('\n').filter(l => l.trim());

      for (const line of lines) {
        let processed = line.trim();

        // Skip async/await
        processed = processed.replace(/async\s+/g, '');
        processed = processed.replace(/await\s+/g, '');

        // Variable declarations
        processed = processed.replace(/const\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
        processed = processed.replace(/let\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
        processed = processed.replace(/var\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');

        // console.log to cout
        processed = processed.replace(/console\.log\(/g, 'cout << ');
        processed = processed.replace(/,\s*' '\s*\+/g, ' << " " << ');
        processed = processed.replace(/,\s*" "\s*\+/g, ' << " " << ');

        // Math functions
        processed = processed.replace(/Math\.abs\(/g, 'abs(');
        processed = processed.replace(/Math\.floor\(/g, 'floor(');
        processed = processed.replace(/Math\.ceil\(/g, 'ceil(');
        processed = processed.replace(/Math\.round\(/g, 'round(');
        processed = processed.replace(/Math\.sqrt\(/g, 'sqrt(');
        processed = processed.replace(/Math\.pow\(/g, 'pow(');
        processed = processed.replace(/Math\.PI/g, 'M_PI');

        // parseInt / parseFloat
        processed = processed.replace(/parseInt\(/g, 'stoi(');
        processed = processed.replace(/parseFloat\(/g, 'stod(');

        // comparisons
        processed = processed.replace(/===/g, '==');
        processed = processed.replace(/!==/g, '!=');

        // for...of loops
        processed = processed.replace(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(.+?)\)/g, 'for (const auto&$1 : $2)');

        // Add semicolon if missing
        if (processed && !processed.endsWith(';') && !processed.endsWith('{') && !processed.endsWith('}')) {
          processed += ';';
        }

        // Add cout << endl for print statements
        if (processed.includes('cout <<') && !processed.includes('<< endl')) {
          processed = processed.replace(/;$/, ' << endl;');
        }

        cpp += '    ' + processed + '\n';
      }

      cpp += `
    return 0;
}
`;
      return cpp;
    }
    return '';
  };

  // Clear output console
  const handleClearOutput = () => {
    if (codeExecutorRef.current) {
      codeExecutorRef.current.clear();
    }
    setOutputConsole([]);
  };

  // Handle input from code execution
  const handleInputSubmit = () => {
    if (inputResolve) {
      inputResolve(inputPrompt);
      setInputResolve(null);
      setInputPrompt('');
      setInputVisible(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (runtimeState.interpreter) {
      runtimeState.interpreter.stop();
    }
    setRuntimeState(prev => ({ ...prev, running: false }));
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    message.info('已停止');
  };

  // Handle ask input
  const [askQuestion, setAskQuestion] = useState('');
  const [askVisible, setAskVisible] = useState(false);
  const [askAnswer, setAskAnswer] = useState('');

  // Code output panel state
  const [outputConsole, setOutputConsole] = useState([]);
  const [outputVisible, setOutputVisible] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('scratch'); // scratch, python, cpp
  const [outputTab, setOutputTab] = useState('output'); // output, code
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [inputResolve, setInputResolve] = useState(null);
  const codeExecutorRef = useRef(null);

  const handleAskSubmit = () => {
    if (runtimeState.interpreter) {
      runtimeState.interpreter.resolveAsk(askAnswer);
    }
    setAskVisible(false);
    setAskAnswer('');
    setAskQuestion('');
  };

  // Cloud variable management
  const handleAddCloudVariable = () => {
    const name = newCloudVariableName.trim();
    if (!name) {
      message.error('请输入云变量名称');
      return;
    }
    if (!name.startsWith('_cloud_')) {
      message.error('云变量名称必须以 _cloud_ 开头');
      return;
    }
    if (cloudVariables.some(v => v.name === name)) {
      message.error('云变量已存在');
      return;
    }
    const newCloudVar = { name, value: '0' };
    setCloudVariables(prev => [...prev, newCloudVar]);
    setNewCloudVariableName('');
    setCloudVariablesModalVisible(false);
    message.success('云变量已创建');
  };

  const handleDeleteCloudVariable = (name) => {
    setCloudVariables(prev => prev.filter(v => v.name !== name));
    message.success('云变量已删除');
  };

  const handleCloudVariableSync = async () => {
    if (!projectId) return;
    setCloudSyncStatus('syncing');
    try {
      await updateCloudVariables(projectId, cloudVariables);
      setCloudSyncStatus('synced');
    } catch (error) {
      console.error('云变量同步失败:', error);
      setCloudSyncStatus('error');
    }
  };

  // Fetch cloud variables when project loads
  const fetchCloudVariables = useCallback(async (pid) => {
    if (!pid) return;
    try {
      const vars = await getCloudVariables(pid);
      if (Array.isArray(vars) && vars.length > 0) {
        setCloudVariables(vars);
      }
      return { result: vars };
    } catch (error) {
      console.error('获取云变量失败:', error);
      return { result: null };
    }
  }, []);

  // Sprite management
  const handleAddSprite = () => {
    const newSprite = {
      id: generateId(),
      name: `角色${sprites.length + 1}`,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      direction: 90,
      visible: true,
      size: 100,
      rotationStyle: 'normal',
      costumes: [
        { id: generateId(), name: '造型1', dataUrl: createDefaultCostume(`hsl(${Math.random() * 360}, 70%, 50%)`) }
      ],
      currentCostume: 0,
      sounds: [],
      scripts: '',
    };
    setSprites(prev => [...prev, newSprite]);
    setSelectedSprite(newSprite.id);
    setSpriteModalVisible(false);
    message.success('已添加角色');
  };

  const handleDeleteSprite = (id) => {
    if (sprites.length <= 1) {
      message.warning('至少保留一个角色');
      return;
    }
    setSprites(prev => prev.filter(s => s.id !== id));
    if (selectedSprite === id) {
      setSelectedSprite(sprites[0]?.id);
    }
    message.success('已删除角色');
  };

  const handleRenameSprite = () => {
    setSprites(prev => prev.map(s =>
      s.id === selectedSprite ? { ...s, name: editingSpriteName } : s
    ));
    setSpriteModalVisible(false);
  };

  const handleSelectSprite = (id) => {
    setSelectedSprite(id);
    const sprite = sprites.find(s => s.id === id);
    if (sprite && workspaceRef.current) {
      try {
        if (sprite.scripts) {
          const xmlDom = window.Blockly.Xml.textToDom(sprite.scripts);
          workspaceRef.current.clear();
          window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        } else {
          workspaceRef.current.clear();
        }
      } catch (e) {
        workspaceRef.current.clear();
      }
    }
  };

  // Costume management
  const handleAddCostume = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newCostume = {
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: e.target.result,
      };
      setSprites(prev => prev.map(s =>
        s.id === selectedSprite ? {
          ...s,
          costumes: [...s.costumes, newCostume],
          currentCostume: s.costumes.length,
        } : s
      ));
      message.success('造型已添加');
    };
    reader.readAsDataURL(file);
    setCostumeModalVisible(false);
  };

  const handleDeleteCostume = (costumeId) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      if (s.costumes.length <= 1) {
        message.warning('至少保留一个造型');
        return s;
      }
      const newCostumes = s.costumes.filter(c => c.id !== costumeId);
      return { ...s, costumes: newCostumes, currentCostume: 0 };
    }));
  };

  const handleSelectCostume = (costumeId) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const idx = s.costumes.findIndex(c => c.id === costumeId);
      return { ...s, currentCostume: idx };
    }));
  };

  // Sound management
  const handleAddSound = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newSound = {
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: e.target.result,
        duration: 0,
      };
      setSprites(prev => prev.map(s =>
        s.id === selectedSprite ? { ...s, sounds: [...s.sounds, newSound] } : s
      ));
      message.success('声音已添加');
    };
    reader.readAsDataURL(file);
    setSoundModalVisible(false);
  };

  const handleDeleteSound = (soundId) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      return { ...s, sounds: s.sounds.filter(snd => snd.id !== soundId) };
    }));
  };

  // ============================================================================
  // Sprite Features - Direct Property Editing
  // ============================================================================

  // Switch to specific costume by name or index
  const handleSwitchCostume = (costumeNameOrIndex) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const sprite = s;
      let idx;
      if (typeof costumeNameOrIndex === 'number') {
        idx = costumeNameOrIndex;
      } else {
        idx = sprite.costumes.findIndex(c => c.name === costumeNameOrIndex);
      }
      if (idx >= 0 && idx < sprite.costumes.length) {
        return { ...s, currentCostume: idx };
      }
      return s;
    }));
  };

  // Go to next costume (wraps around)
  const handleNextCostume = () => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const next = ((s.currentCostume || 0) + 1) % s.costumes.length;
      return { ...s, currentCostume: next };
    }));
  };

  // Go to previous costume (wraps around)
  const handlePrevCostume = () => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const len = s.costumes.length;
      const prev = ((s.currentCostume || 0) - 1 + len) % len;
      return { ...s, currentCostume: prev };
    }));
  };

  // Change sprite size
  const handleChangeSize = (delta) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const newSize = Math.max(1, Math.min(500, (s.size || 100) + delta));
      return { ...s, size: newSize };
    }));
  };

  // Set sprite size to specific value
  const handleSetSize = (newSize) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      return { ...s, size: Math.max(1, Math.min(500, newSize)) };
    }));
  };

  // Change direction
  const handleChangeDirection = (delta) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      let newDir = ((s.direction || 90) + delta) % 360;
      if (newDir < 0) newDir += 360;
      return { ...s, direction: newDir };
    }));
  };

  // Set direction to specific value
  const handleSetDirection = (newDirection) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      let dir = newDirection % 360;
      if (dir < 0) dir += 360;
      return { ...s, direction: dir };
    }));
  };

  // Set rotation style: 'normal', 'left-right', 'none'
  const handleSetRotationStyle = (style) => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      return { ...s, rotationStyle: style };
    }));
  };

  // Toggle sprite visibility
  const handleToggleVisibility = () => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      return { ...s, visible: !s.visible };
    }));
  };

  // Reset sprite to center
  const handleResetSpritePosition = () => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      return { ...s, x: 0, y: 0 };
    }));
  };

  // Export spriteFeatures object for external access
  const spriteFeatures = {
    // Current sprite data
    sprite: selectedSpriteData,
    // Costume operations
    switchCostume: handleSwitchCostume,
    nextCostume: handleNextCostume,
    prevCostume: handlePrevCostume,
    // Size operations
    changeSize: handleChangeSize,
    setSize: handleSetSize,
    // Direction operations
    changeDirection: handleChangeDirection,
    setDirection: handleSetDirection,
    // Rotation style
    setRotationStyle: handleSetRotationStyle,
    // Visibility
    toggleVisibility: handleToggleVisibility,
    // Position
    resetPosition: handleResetSpritePosition,
  };

  // Backdrop management
  const handleAddBackdrop = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newBackdrop = {
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: e.target.result,
      };
      setProjectData(prev => ({
        ...prev,
        stage: {
          ...prev.stage,
          backdrops: [...prev.stage.backdrops, newBackdrop],
          currentBackdrop: prev.stage.backdrops.length,
        }
      }));
      message.success('背景已添加');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectBackdrop = (index) => {
    setProjectData(prev => ({
      ...prev,
      stage: { ...prev.stage, currentBackdrop: index }
    }));
  };

  const handleDeleteBackdrop = (index) => {
    if (projectData.stage.backdrops.length <= 1) {
      message.warning('至少保留一个背景');
      return;
    }
    setProjectData(prev => ({
      ...prev,
      stage: {
        ...prev.stage,
        backdrops: prev.stage.backdrops.filter((_, i) => i !== index),
        currentBackdrop: 0,
      }
    }));
  };

  // Get workspace content
  const getWorkspaceContent = () => {
    if (workspaceRef.current) {
      const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current);
      return window.Blockly.Xml.domToText(xml);
    }
    return '';
  };

  // Save to local
  const handleSaveLocal = () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    localStorage.setItem('scratch-project', xmlText);
    localStorage.setItem('scratch-project-name', projectName);
    localStorage.setItem('scratch-project-type', projectType);
    localStorage.setItem('scratch-project-data', data);
    message.success('项目已保存到本地！');
  };

  // Save to cloud
  const handleSaveToCloud = async () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      if (projectId) {
        await updateProject(projectId, { name: projectName, content: xmlText, projectData: data });
        message.success('项目已更新到云端！');
      } else {
        const result = await createProject({
          name: projectName,
          type: projectType,
          content: xmlText,
          projectData: data,
          userId: user.id,
        });
        setProjectId(result.id);
        message.success('项目已保存到云端！');
      }
      setLastSavedContent(xmlText);
      setLastSavedData(data);
      setSaveModalVisible(false);
      fetchCloudProjects();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    }
  };

  // Auto-save to cloud
  const handleAutoSave = async () => {
    if (!projectId) return;

    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    if (xmlText === lastSavedContent && data === lastSavedData) return;

    try {
      await updateProject(projectId, { name: projectName, content: xmlText, projectData: data });
      setLastSavedContent(xmlText);
      setLastSavedData(data);
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  };

  // Load cloud project
  const handleLoadProject = async (id) => {
    try {
      const project = await getProject(id);
      setProjectId(project.id);
      setProjectName(project.name);

      if (project.projectData) {
        try {
          const data = JSON.parse(project.projectData);
          setSprites(data.sprites || []);
          setProjectData(data.projectData || { stage: { backdrops: [], currentBackdrop: 0 } });
          // Restore cloud variables from project data
          if (data.cloudVariables && Array.isArray(data.cloudVariables)) {
            setCloudVariables(data.cloudVariables);
          }
          if (data.sprites?.length > 0) {
            setSelectedSprite(data.sprites[0].id);
          }
        } catch (e) {
          console.error('解析项目数据失败:', e);
        }
      }

      // Also try to fetch cloud variables from server
      fetchCloudVariables(id).then(result => {
        if (result?.result) {
          setCloudVariables(result.result);
        }
      }).catch(() => {});

      if (workspaceRef.current && project.content) {
        try {
          const xmlDom = window.Blockly.Xml.textToDom(project.content);
          workspaceRef.current.clear();
          window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        } catch (e) {
          console.error('加载项目失败:', e);
          message.error('加载项目失败');
        }
      }

      setLastSavedContent(project.content || '');
      setLastSavedData(project.projectData || '');
      setLoadModalVisible(false);
      message.success('项目加载成功！');
    } catch (error) {
      console.error('加载项目失败:', error);
      message.error('加载项目失败，请重试');
    }
  };

  // Delete cloud project
  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      message.success('项目已删除');
      fetchCloudProjects();
      if (projectId === id) setProjectId(null);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // Remix (派生) project
  const handleRemixProject = async (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      message.error('请先登录');
      return;
    }
    try {
      const remixed = await remixProject(id, user.id);
      if (remixed) {
        setProjectId(remixed.id);
        setProjectName(remixed.name);
        if (remixed.projectData) {
          try {
            const data = JSON.parse(remixed.projectData);
            setSprites(data.sprites || []);
            setProjectData(data.projectData || { stage: { backdrops: [], currentBackdrop: 0 } });
            // Restore cloud variables from remixed project
            if (data.cloudVariables && Array.isArray(data.cloudVariables)) {
              setCloudVariables(data.cloudVariables);
            }
            if (data.sprites?.length > 0) {
              setSelectedSprite(data.sprites[0].id);
            }
          } catch (e) {
            console.error('解析项目数据失败:', e);
          }
        }
        if (workspaceRef.current && remixed.content) {
          try {
            const xmlDom = window.Blockly.Xml.textToDom(remixed.content);
            workspaceRef.current.clear();
            window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
          } catch (e) {
            console.error('加载项目失败:', e);
          }
        }
        setLastSavedContent(remixed.content || '');
        setLastSavedData(remixed.projectData || '');
        setLoadModalVisible(false);
        message.success('已成功派生项目！');
      }
    } catch (error) {
      console.error('派生失败:', error);
      message.error('派生失败，请重试');
    }
  };

  // New project
  const handleNewProject = () => {
    if (workspaceRef.current) workspaceRef.current.clear();
    setProjectId(null);
    setProjectName('我的项目');
    setLastSavedContent('');
    setLastSavedData('');
    setCloudVariables([]); // Reset cloud variables
    initDefaultProjectData();
    setLoadModalVisible(false);
    message.success('已创建新项目');
  };

  // Export project as JSON file
  const handleExportProject = () => {
    const xmlText = getWorkspaceContent();
    const exportData = {
      name: projectName,
      type: projectType,
      content: xmlText,
      projectData: JSON.stringify({ sprites, projectData, cloudVariables }),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9一-龥]/g, '_')}.scratch3.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('项目已导出');
  };

  // Import project from JSON file
  const handleImportProject = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.name) setProjectName(data.name);
        if (data.content && workspaceRef.current) {
          try {
            const xmlDom = window.Blockly.Xml.textToDom(data.content);
            workspaceRef.current.clear();
            window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
          } catch (err) {
            message.error('加载项目块失败');
          }
        }
        if (data.projectData) {
          try {
            const parsed = JSON.parse(data.projectData);
            if (parsed.sprites) setSprites(parsed.sprites);
            if (parsed.projectData) setProjectData(parsed.projectData);
            if (parsed.cloudVariables) setCloudVariables(parsed.cloudVariables);
          } catch (err) {
            console.error('解析项目数据失败', err);
          }
        }
        message.success('项目导入成功');
      } catch (err) {
        message.error('项目文件格式错误');
        console.error('导入失败', err);
      }
    };
    reader.readAsText(file);
  };

  const selectedSpriteData = sprites.find(s => s.id === selectedSprite);

  return (
    <div className="ide-page">
      {/* Header toolbar */}
      <div className="ide-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <input
            className="project-name-input"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="项目名称"
          />
          {projectId && <Badge status="processing" text="已同步" />}
        </Space>
        <Space size="large">
          <Button type="primary" danger={isRunning} icon={<PlayCircleOutlined />} onClick={handlePlay} disabled={isRunning}>
            绿旗
          </Button>
          <Button icon={<StopOutlined />} onClick={handleStop} disabled={!isRunning}>
            停止
          </Button>
          <Button icon={<CustomerServiceOutlined />} onClick={() => setOutputVisible(!outputVisible)} style={{ background: outputVisible ? '#1890ff' : undefined }}>
            输出
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={() => setLoadModalVisible(true)}>
            打开
          </Button>
          <Dropdown overlay={
            <Space direction="vertical" style={{ padding: 8 }}>
              <Button icon={<SaveOutlined />} onClick={handleSaveLocal}>保存到本地</Button>
              <Button icon={<CloudOutlined />} onClick={() => setSaveModalVisible(true)}>保存到云端</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportProject}>导出项目</Button>
              <Dragger showUploadList={false} beforeUpload={(file) => { handleImportProject(file); return false; }} accept=".json">
                <Button icon={<UploadOutlined />}>导入项目</Button>
              </Dragger>
            </Space>
          }>
            <Button icon={<SaveOutlined />}>保存</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Main content */}
      <div className="ide-content">
        {/* Sprite list panel */}
        <div className="sprite-panel">
          <div className="sprite-panel-header">
            <span>角色列表</span>
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={spriteFeaturesVisible ? <EditOutlined /> : <EditOutlined />}
                onClick={() => setSpriteFeaturesVisible(!spriteFeaturesVisible)}
                style={{ color: spriteFeaturesVisible ? '#6366f1' : undefined }}
                title="角色属性"
              />
              <Button type="text" icon={<PlusOutlined />} onClick={() => setSpriteModalVisible(true)} />
            </Space>
          </div>
          <div className="sprite-list">
            {sprites.map(sprite => (
              <div
                key={sprite.id}
                className={`sprite-item ${selectedSprite === sprite.id ? 'selected' : ''}`}
                onClick={() => handleSelectSprite(sprite.id)}
              >
                <div className="sprite-thumbnail">
                  {sprite.costumes[0]?.dataUrl ? (
                    <img src={sprite.costumes[0].dataUrl} alt={sprite.name} />
                  ) : (
                    <div className="sprite-placeholder" />
                  )}
                </div>
                <span className="sprite-name">{sprite.name}</span>
                <Dropdown overlay={
                  <Space direction="vertical" size="small">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); setEditingSpriteName(sprite.name); setSpriteModalVisible(true); }}>重命名</Button>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteSprite(sprite.id); }}>删除</Button>
                  </Space>
                }>
                  <Button type="text" size="small" icon={<CustomerServiceOutlined />} onClick={e => e.stopPropagation()} />
                </Dropdown>
              </div>
            ))}
          </div>
        </div>

        {/* Cloud Variables Panel */}
        <div className="cloud-variables-panel">
          <div className="cloud-variables-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
            <Space>
              <CloudOutlined />
              <span>云变量</span>
              {cloudSyncStatus === 'synced' && <span style={{ fontSize: 10, color: '#52c41a' }}>已同步</span>}
              {cloudSyncStatus === 'syncing' && <span style={{ fontSize: 10, color: '#1890ff' }}>同步中...</span>}
              {cloudSyncStatus === 'error' && <span style={{ fontSize: 10, color: '#ff4d4f' }}>同步失败</span>}
            </Space>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setCloudVariablesModalVisible(true)} />
          </div>
          <div className="cloud-variables-list" style={{ maxHeight: 150, overflow: 'auto', padding: '4px 8px' }}>
            {cloudVariables.length === 0 && (
              <div style={{ color: '#999', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>暂无云变量</div>
            )}
            {cloudVariables.map(cv => (
              <div key={cv.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                <Space>
                  <span style={{ fontSize: 12, color: '#333' }}>{cv.name}</span>
                  <span style={{ fontSize: 11, color: '#666' }}>= {cv.value}</span>
                </Space>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCloudVariable(cv.name)} />
              </div>
            ))}
          </div>
        </div>

        {/* Sprite Features Panel - Direct property editing */}
        {selectedSpriteData && spriteFeaturesVisible && (
          <div className="sprite-features-panel">
            <div className="sprite-features-header">
              <Space>
                <span>角色属性</span>
                <Badge count={selectedSpriteData.name} style={{ fontSize: 10 }} />
              </Space>
              <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => setSpriteFeaturesVisible(false)} />
            </div>

            <div className="sprite-features-content">
              {/* Costume Section */}
              <div className="feature-section">
                <div className="feature-section-title">造型 ({selectedSpriteData.currentCostume + 1}/{selectedSpriteData.costumes.length})</div>
                <div className="costume-nav">
                  <Button size="small" onClick={handlePrevCostume}>上一造型</Button>
                  <Button size="small" onClick={handleNextCostume}>下一造型</Button>
                </div>
                <div className="costume-selector">
                  <Select
                    size="small"
                    value={selectedSpriteData.currentCostume}
                    onChange={(val) => handleSwitchCostume(val)}
                    style={{ width: '100%' }}
                  >
                    {selectedSpriteData.costumes.map((c, idx) => (
                      <Select.Option key={c.id} value={idx}>{c.name}</Select.Option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Size Section */}
              <div className="feature-section">
                <div className="feature-section-title">大小</div>
                <div className="size-control">
                  <Slider
                    min={1}
                    max={500}
                    value={selectedSpriteData.size || 100}
                    onChange={(val) => handleSetSize(val)}
                    tooltip={{ formatter: (val) => `${val}%` }}
                  />
                  <Space>
                    <Button size="small" onClick={() => handleChangeSize(-10)}>-10</Button>
                    <InputNumber
                      size="small"
                      min={1}
                      max={500}
                      value={selectedSpriteData.size || 100}
                      onChange={(val) => handleSetSize(val || 100)}
                      addonAfter="%"
                      style={{ width: 90 }}
                    />
                    <Button size="small" onClick={() => handleChangeSize(10)}>+10</Button>
                  </Space>
                </div>
              </div>

              {/* Direction Section */}
              <div className="feature-section">
                <div className="feature-section-title">方向</div>
                <div className="direction-control">
                  <Slider
                    min={0}
                    max={359}
                    value={selectedSpriteData.direction || 90}
                    onChange={(val) => handleSetDirection(val)}
                    tooltip={{ formatter: (val) => `${val}°` }}
                    marks={{ 0: '0°', 90: '90°', 180: '180°', 270: '270°' }}
                  />
                  <Space>
                    <Button size="small" onClick={() => handleChangeDirection(-15)}>-15°</Button>
                    <InputNumber
                      size="small"
                      min={0}
                      max={359}
                      value={selectedSpriteData.direction || 90}
                      onChange={(val) => handleSetDirection(val || 90)}
                      addonAfter="°"
                      style={{ width: 80 }}
                    />
                    <Button size="small" onClick={() => handleChangeDirection(15)}>+15°</Button>
                  </Space>
                </div>
              </div>

              {/* Rotation Style Section */}
              <div className="feature-section">
                <div className="feature-section-title">旋转样式</div>
                <Radio.Group
                  value={selectedSpriteData.rotationStyle || 'normal'}
                  onChange={(e) => handleSetRotationStyle(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="normal">任意</Radio.Button>
                  <Radio.Button value="left-right">左右翻转</Radio.Button>
                  <Radio.Button value="none">不旋转</Radio.Button>
                </Radio.Group>
              </div>

              {/* Visibility Section */}
              <div className="feature-section">
                <div className="feature-section-title">显示</div>
                <Space>
                  <Button
                    size="small"
                    type={selectedSpriteData.visible ? 'primary' : 'default'}
                    onClick={handleToggleVisibility}
                  >
                    {selectedSpriteData.visible ? '显示' : '隐藏'}
                  </Button>
                  <Button size="small" onClick={handleResetSpritePosition}>
                    回到中心
                  </Button>
                </Space>
              </div>

              {/* Position Display */}
              <div className="feature-section">
                <div className="feature-section-title">位置</div>
                <div className="position-display">
                  <span>X: {(selectedSpriteData.x || 0).toFixed(0)}</span>
                  <span>Y: {(selectedSpriteData.y || 0).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blocks workspace */}
        <div className="blocks-panel">
          <div id="blocks-editor" className="blocks-editor" />
        </div>

        {/* Stage */}
        <div className="stage-panel">
          <div className="stage-header">
            <BgColorsOutlined /> 舞台
          </div>
          <div className="stage-content" style={{position:'relative'}}>
            <canvas ref={stageRef} className="stage-canvas" width={400} height={300} />
            <canvas ref={penRef} className="pen-canvas" width={400} height={300} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}} />
          </div>
          <div className="stage-backdrops">
            <div className="backdrop-list">
              {projectData.stage.backdrops.map((backdrop, idx) => (
                <div
                  key={backdrop.id}
                  className={`backdrop-item ${projectData.stage.currentBackdrop === idx ? 'selected' : ''}`}
                  onClick={() => handleSelectBackdrop(idx)}
                >
                  {backdrop.dataUrl ? (
                    <img src={backdrop.dataUrl} alt={backdrop.name} />
                  ) : (
                    <div className="backdrop-placeholder">背景{idx + 1}</div>
                  )}
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteBackdrop(idx); }} />
                </div>
              ))}
              <Dragger showUploadList={false} beforeUpload={(file) => { handleAddBackdrop(file); return false; }}>
                <Button type="text" icon={<PlusOutlined />}>添加背景</Button>
              </Dragger>
            </div>
          </div>
        </div>
      </div>

      {/* Footer tabs */}
      <div className="ide-footer">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="脚本" key="scripts">
            <div className="tab-content">在左侧选择角色，然后在这里为角色编写程序</div>
          </TabPane>
          <TabPane tab="造型" key="costumes">
            {selectedSpriteData && (
              <div className="costumes-panel">
                <div className="costumes-header">
                  <span>造型列表 - {selectedSpriteData.name}</span>
                  <Dragger showUploadList={false} beforeUpload={(file) => { handleAddCostume(file); return false; }}>
                    <Button icon={<UploadOutlined />}>上传造型</Button>
                  </Dragger>
                </div>
                <div className="costumes-list">
                  {selectedSpriteData.costumes.map((costume, idx) => (
                    <div
                      key={costume.id}
                      className={`costume-item ${selectedSpriteData.currentCostume === idx ? 'selected' : ''}`}
                      onClick={() => handleSelectCostume(costume.id)}
                    >
                      <img src={costume.dataUrl} alt={costume.name} />
                      <span>{costume.name}</span>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteCostume(costume.id); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabPane>
          <TabPane tab="声音" key="sounds">
            {selectedSpriteData && (
              <div className="sounds-panel">
                <div className="sounds-header">
                  <span>声音列表 - {selectedSpriteData.name}</span>
                  <Dragger showUploadList={false} beforeUpload={(file) => { handleAddSound(file); return false; }}>
                    <Button icon={<UploadOutlined />}>上传声音</Button>
                  </Dragger>
                </div>
                <div className="sounds-list">
                  {selectedSpriteData.sounds.length === 0 && (
                    <div className="empty-message">暂无声音，请上传音频文件</div>
                  )}
                  {selectedSpriteData.sounds.map(sound => (
                    <div key={sound.id} className="sound-item">
                      <SoundOutlined />
                      <span>{sound.name}</span>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSound(sound.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabPane>
        </Tabs>
      </div>

      {/* Sprite modal */}
      <Modal
        title={editingSpriteName ? '重命名角色' : '添加角色'}
        open={spriteModalVisible}
        onCancel={() => { setSpriteModalVisible(false); setEditingSpriteName(''); }}
        footer={editingSpriteName ? (
          <Space>
            <Button onClick={() => { setSpriteModalVisible(false); setEditingSpriteName(''); }}>取消</Button>
            <Button type="primary" onClick={handleRenameSprite}>确定</Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={() => setSpriteModalVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleAddSprite}>添加</Button>
          </Space>
        )}
      >
        <Input
          placeholder="角色名称"
          value={editingSpriteName}
          onChange={e => setEditingSpriteName(e.target.value)}
        />
      </Modal>

      {/* Load project modal */}
      <Modal
        title="打开项目"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject} block>
            新建项目
          </Button>
          <List
            header={<div>云端项目</div>}
            dataSource={cloudProjects}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleLoadProject(item.id)}>打开</Button>,
                  <Button type="text" icon={<CustomerServiceOutlined />} onClick={() => handleRemixProject(item.id)}>派生</Button>,
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProject(item.id)}>删除</Button>
                ]}
              >
                <List.Item.Meta title={item.name} description={`更新时间: ${new Date(item.updatedAt).toLocaleString()}`} />
              </List.Item>
            )}
            locale={{ emptyText: '暂无云端项目' }}
          />
        </Space>
      </Modal>

      {/* Save project modal */}
      <Modal
        title="保存项目"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label>项目名称:</label>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <Space>
            <Button onClick={handleSaveLocal}>保存到本地</Button>
            <Button type="primary" onClick={handleSaveToCloud}>保存到云端</Button>
          </Space>
        </Space>
      </Modal>

      {/* Ask input modal */}
      <Modal
        title="询问"
        open={askVisible}
        onCancel={() => { setAskVisible(false); if (runtimeState.interpreter) runtimeState.interpreter.resolveAsk(''); }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ fontSize: 16, padding: '8px 0' }}>{askQuestion}</div>
          <Input
            placeholder="请输入答案..."
            value={askAnswer}
            onChange={e => setAskAnswer(e.target.value)}
            onPressEnter={handleAskSubmit}
          />
          <Button type="primary" onClick={handleAskSubmit}>确定</Button>
        </Space>
      </Modal>

      {/* Cloud Variables Modal */}
      <Modal
        title="创建云变量"
        open={cloudVariablesModalVisible}
        onCancel={() => { setCloudVariablesModalVisible(false); setNewCloudVariableName(''); }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>云变量名称（必须以 _cloud_ 开头）</div>
            <Input
              placeholder="_cloud_score"
              value={newCloudVariableName}
              onChange={e => setNewCloudVariableName(e.target.value)}
              onPressEnter={handleAddCloudVariable}
            />
          </div>
          <Space>
            <Button onClick={() => { setCloudVariablesModalVisible(false); setNewCloudVariableName(''); }}>取消</Button>
            <Button type="primary" onClick={handleAddCloudVariable}>创建</Button>
          </Space>
        </Space>
      </Modal>

      {/* Code Input Modal for Python input() */}
      <Modal
        title="输入"
        open={inputVisible}
        onCancel={() => { setInputVisible(false); if (inputResolve) { inputResolve(''); setInputResolve(null); } }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ fontSize: 16, padding: '8px 0' }}>{inputPrompt || '请输入:'}</div>
          <Input
            placeholder="请输入..."
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onPressEnter={handleInputSubmit}
          />
          <Button type="primary" onClick={handleInputSubmit}>确定</Button>
        </Space>
      </Modal>

      {/* Code Output Panel */}
      {outputVisible && (
        <div className="output-panel" style={{
          position: 'fixed',
          bottom: 60,
          right: 20,
          width: 550,
          height: 400,
          background: '#1e1e1e',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: '#333',
            borderBottom: '1px solid #444'
          }}>
            <Space>
              <span style={{ color: '#fff', fontWeight: 500 }}>输出控制台</span>
              <Radio.Group value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} size="small">
                <Radio.Button value="scratch">Scratch</Radio.Button>
                <Radio.Button value="python">Python</Radio.Button>
                <Radio.Button value="cpp">C++</Radio.Button>
              </Radio.Group>
            </Space>
            <Space>
              {activeLanguage !== 'scratch' && (
                <Button size="small" onClick={() => {
                  if (activeLanguage === 'python') {
                    const code = getPythonCode();
                    handleRunPython(code);
                  } else if (activeLanguage === 'cpp') {
                    const code = getCppCode();
                    handleRunCpp(code);
                  }
                }}>
                  运行
                </Button>
              )}
              <Button size="small" onClick={handleClearOutput}>清空</Button>
              <Button size="small" icon={<DeleteOutlined />} onClick={() => setOutputVisible(false)} />
            </Space>
          </div>

          {/* Code Preview Tabs */}
          {activeLanguage !== 'scratch' && (
            <div style={{
              display: 'flex',
              background: '#252526',
              borderBottom: '1px solid #444'
            }}>
              <div
                style={{
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  borderBottom: outputTab === 'output' ? '2px solid #007acc' : 'none',
                  fontSize: 12
                }}
                onClick={() => setOutputTab('output')}
              >
                输出
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  borderBottom: outputTab === 'code' ? '2px solid #007acc' : 'none',
                  fontSize: 12
                }}
                onClick={() => setOutputTab('code')}
              >
                代码预览
              </div>
            </div>
          )}

          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 8,
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: 13,
            lineHeight: 1.5
          }}>
            {outputTab === 'output' && outputConsole.length === 0 && (
              <div style={{ color: '#888', padding: 8 }}>控制台输出将显示在这里...</div>
            )}

            {/* Error details panel */}
            {outputTab === 'output' && outputConsole.some(e => e.type === 'error') && (
              <div style={{ marginBottom: 8 }}>
                {outputConsole.filter(e => e.type === 'error').map((entry, idx) => (
                  <div key={idx} style={{
                    color: '#ff6b6b',
                    background: 'rgba(255,107,107,0.1)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: 4,
                    padding: '8px 12px',
                    marginBottom: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      <span style={{ color: '#ff6b6b' }}>[错误]</span>
                    </div>
                    <div>{entry.message}</div>
                    {entry.details && (
                      <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                        {entry.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Normal output */}
            {outputTab === 'output' && outputConsole.filter(e => e.type !== 'error').map((entry, idx) => (
              <div key={idx} style={{
                color: entry.type === 'error' ? '#ff6b6b' :
                       entry.type === 'warn' ? '#ffd93d' :
                       entry.type === 'info' ? '#6bcbff' :
                       entry.type === 'code' ? '#98d8aa' : '#fff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                padding: '2px 0'
              }}>
                {entry.type === 'error' && <span style={{ color: '#ff6b6b' }}>[错误] </span>}
                {entry.type === 'warn' && <span style={{ color: '#ffd93d' }}>[警告] </span>}
                {entry.type === 'info' && <span style={{ color: '#6bcbff' }}>[信息] </span>}
                {entry.type === 'code' && <span style={{ color: '#98d8aa' }}>    </span>}
                {entry.message}
              </div>
            ))}

            {/* Code preview */}
            {outputTab === 'code' && (
              <div style={{ position: 'relative' }}>
                <Button
                  size="small"
                  style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                  onClick={() => {
                    const code = activeLanguage === 'python' ? getPythonCode() : getCppCode();
                    navigator.clipboard.writeText(code);
                    message.success('代码已复制到剪贴板');
                  }}
                >
                  复制代码
                </Button>
                <pre style={{
                  color: '#d4d4d4',
                  background: '#1e1e1e',
                  padding: 12,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 300,
                  fontSize: 12,
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  {activeLanguage === 'python' ? getPythonCode() || '# 暂无Python代码' : getCppCode() || '// 暂无C++代码'}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}