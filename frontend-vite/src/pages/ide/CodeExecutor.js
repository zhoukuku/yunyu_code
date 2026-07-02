// ============================================================================
// Code Execution Engine - Supports Python, C++, and Scratch
// ============================================================================

const LOG_PREFIX = '[CodeExecutor]';

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

  // Format value for display (similar to Python's print)
  _formatValue = (v) => {
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

  // =========================================================================
  // Python-to-JavaScript Converter (enhanced)
  // =========================================================================
  _pythonToJS(code) {
    const getIndent = (line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    };

    let lines = code.split('\n');
    let result = [];
    let i = 0;

    while (i < lines.length) {
      let line = lines[i];

      // Skip empty lines and comments
      if (/^\s*$/.test(line) || /^\s*#/.test(line)) {
        i++;
        continue;
      }

      // Handle elif
      line = line.replace(/\belif\b/g, 'else if');

      // Handle print with proper formatting
      line = line.replace(/print\s*\((.*)\)\s*$/, (_, args) => {
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

    let js = result.join('\n');

    // Handle try-except
    js = js.replace(/try\s*\{/g, 'try {');
    js = js.replace(/\}except(?:\s*\(\s*(\w+)\s*\))?\s*\{/g, '} catch ($1) {');

    // Handle Python-style string concatenation
    js = js.replace(/print\s*\((.+?)\+\s*"([^"]*)"\s*\)/g, 'print($1+"$2")');

    return js;
  }

  // =========================================================================
  // Build safe builtins
  // =========================================================================
  _buildSafeBuiltins() {
    return {
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
  }

  _buildMathNamespace() {
    return {
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

    const safeBuiltins = this._buildSafeBuiltins();
    const mathNamespace = this._buildMathNamespace();

    try {
      const jsCode = this._pythonToJS(code);

      // Create execution context with dedup to avoid "Duplicate parameter name" in strict mode
      const rawContextKeys = Object.keys(safeBuiltins);
      const rawContextValues = Object.values(safeBuiltins);
      const mathKeys = Object.keys(mathNamespace);
      const mathValues = Object.values(mathNamespace);

      const allParamNames = [];
      const allParamValues = [];
      const seen = new Set();

      for (let i = 0; i < rawContextKeys.length; i++) {
        if (!seen.has(rawContextKeys[i])) {
          seen.add(rawContextKeys[i]);
          allParamNames.push(rawContextKeys[i]);
          allParamValues.push(rawContextValues[i]);
        }
      }

      const mathSurvived = [];
      for (let i = 0; i < mathKeys.length; i++) {
        if (!seen.has(mathKeys[i])) {
          seen.add(mathKeys[i]);
          mathSurvived.push(i);
          allParamNames.push(mathKeys[i]);
          allParamValues.push(mathValues[i]);
        }
      }

      const mathObj = mathSurvived.length
        ? `const __math = {${mathSurvived.map(i => mathKeys[i]).join(',')}};`
        : 'const __math = {};';

      // Build function with safe context
      const fn = new Function(
        ...allParamNames, '__print', '__input', '__this',
        `${mathObj}
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
              const jsLine = parseInt(lineMatch[1]) - 12; // Adjust for wrapper overhead
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

      await fn(...allParamValues,
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
      console.error(`${LOG_PREFIX} Python execution error:`, e);
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
    const indent = '    ';

    for (let line of lines) {
      line = line.trim();
      if (!line || line === '{' || line === '}') continue;

      line = this._transformJsLineToCpp(line);

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

  // Transform a single JavaScript line to C++ (shared utility)
  _transformJsLineToCpp(line) {
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
      content = content.trim();
      content = content.replace(/\+\s*"([^"]*)"/g, ' << "$1"');
      content = content.replace(/\+\s*'([^']*)'/g, ' << \'$1\'');
      content = content.replace(/JSON\.stringify\(([^)]+)\)/g, '$1');
      content = content.replace(/"\s*\+\s*/g, '" << ');
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

    // if statements
    line = line.replace(/if\s*\((.+)\)\s*\{/g, 'if ($1) {');

    // function calls cleanup
    line = line.replace(/,\s*\$1\)/g, ')');
    line = line.replace(/,\s*\$2\)/g, ')');

    return line;
  }

  // Translate Scratch blocks to Python using Blockly's Python generator
  translateToPython(workspace) {
    try {
      if (!window.Blockly || !workspace) {
        return '# Blockly not available';
      }
      const pythonCode = window.Blockly.Python.workspaceToCode(workspace);
      this.generatedCode.python = pythonCode;
      return pythonCode;
    } catch (e) {
      this.error(`翻译失败: ${e.message}`);
      return '# 翻译失败';
    }
  }
}

// Export shared line-level C++ transformation for use by the legacy getCppCode
CodeExecutor.transformJsLineToCpp = function (line) {
  // Skip async/await
  line = line.replace(/async\s+/g, '');
  line = line.replace(/await\s+/g, '');

  // Variable declarations
  line = line.replace(/const\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
  line = line.replace(/let\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
  line = line.replace(/var\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');

  // console.log to cout
  line = line.replace(/console\.log\(/g, 'cout << ');
  line = line.replace(/,\s*' '\s*\+/g, ' << " " << ');
  line = line.replace(/,\s*" "\s*\+/g, ' << " " << ');

  // Math functions
  line = line.replace(/Math\.abs\(/g, 'abs(');
  line = line.replace(/Math\.floor\(/g, 'floor(');
  line = line.replace(/Math\.ceil\(/g, 'ceil(');
  line = line.replace(/Math\.round\(/g, 'round(');
  line = line.replace(/Math\.sqrt\(/g, 'sqrt(');
  line = line.replace(/Math\.pow\(/g, 'pow(');
  line = line.replace(/Math\.PI/g, 'M_PI');

  // parseInt / parseFloat
  line = line.replace(/parseInt\(/g, 'stoi(');
  line = line.replace(/parseFloat\(/g, 'stod(');

  // comparisons
  line = line.replace(/===/g, '==');
  line = line.replace(/!==/g, '!=');

  // for...of loops
  line = line.replace(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(.+?)\)/g, 'for (const auto&$1 : $2)');

  // Add semicolon if missing
  if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) {
    line += ';';
  }

  // Add cout << endl for print statements
  if (line.includes('cout <<') && !line.includes('<< endl')) {
    line = line.replace(/;$/, ' << endl;');
  }

  return line;
};

export default CodeExecutor;
