import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button, Space, Tabs, message, Card, Row, Col, Modal, List, Input, Dropdown, Badge, Upload, Radio, Slider, ColorPicker, Tooltip, Select, Switch, Divider, Tag, Progress, Empty } from 'antd';
import { PlayCircleOutlined, StopOutlined, SaveOutlined, ArrowLeftOutlined, BgColorsOutlined, CloudOutlined, FolderOpenOutlined, PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SoundOutlined, CustomerServiceOutlined, DownloadOutlined, FullscreenOutlined, ShrinkOutlined, ClearOutlined, CopyOutlined, SyncOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, WarningOutlined, CodeOutlined, ConsoleSqlOutlined, BlockOutlined, LayoutOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createProject, getProjects, getProject, updateProject, deleteProject, updateProjectData, remixProject, getCloudVariables, updateCloudVariables } from '../../services/api';
import { defineBlocks } from '../../components/blockly/blocks';
import { registerGenerators, registerPythonGenerators } from '../../components/blockly/generators';

import './style.css';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Option } = Select;

// ============================================================================
// Code Executor & Scratch Interpreter (abbreviated - same as original)
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
  setInputCallback(callback) { this.onInput = callback; }
  log(message, type = 'log') {
    const entry = { message: String(message), type, timestamp: Date.now() };
    this.output.push(entry);
    this.onOutput?.(entry);
  }
  error(message, details = null) {
    const entry = { message: String(message), type: 'error', timestamp: Date.now(), details };
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
  getGeneratedCode(language) { return this.generatedCode[language] || ''; }

  async executePython(code) {
    if (this.running) { this.warn('代码正在执行中，请等待完成'); return; }
    this.running = true;
    this.clear();
    this.info('=== Python 代码执行 ===');
    this.generatedCode.python = code;

    const safeBuiltins = {
      'print': (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
      'len': (x) => x == null ? 0 : (typeof x === 'string' || Array.isArray(x)) ? x.length : (typeof x === 'object') ? Object.keys(x).length : 0,
      'range': (...args) => {
        if (args.length === 0) return [];
        const start = args.length > 1 ? args[0] : 0;
        const end = args.length > 1 ? args[1] : args[0];
        const step = args.length > 2 ? args[2] : 1;
        if (step === 0) throw new Error('range() arg 3 must not be zero');
        const result = [];
        if (step > 0) { for (let i = start; i < end; i += step) result.push(i); }
        else { for (let i = start; i > end; i += step) result.push(i); }
        return result;
      },
      'str': (x) => x == null ? '' : String(x),
      'int': (x) => { if (x == null) return 0; const n = parseInt(x); if (isNaN(n)) throw new Error(`invalid literal for int(): '${x}'`); return n; },
      'float': (x) => { if (x == null) return 0.0; const n = parseFloat(x); if (isNaN(n)) throw new Error(`could not convert string to float: '${x}'`); return n; },
      'bool': (x) => Boolean(x),
      'list': (x) => { if (x == null) return []; if (Array.isArray(x)) return [...x]; if (typeof x === 'string') return x.split(''); return Array.from(x || []); },
      'dict': (x) => x ? { ...x } : {},
      'abs': Math.abs, 'min': (...args) => Math.min(...(args.length === 1 && Array.isArray(args[0]) ? args[0] : args)),
      'max': (...args) => Math.max(...(args.length === 1 && Array.isArray(args[0]) ? args[0] : args)),
      'sum': (arr) => arr && Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0,
      'round': (x, digits = 0) => { const factor = Math.pow(10, digits); return Math.round(x * factor) / factor; },
      'sorted': (arr, reverse = false) => { if (!arr || !Array.isArray(arr)) return []; const result = [...arr].sort((a, b) => a < b ? -1 : a > b ? 1 : 0); return reverse ? result.reverse() : result; },
      'reversed': (arr) => { if (!arr || !Array.isArray(arr)) return []; return [...arr].reverse(); },
      'enumerate': function* (arr, start = 0) { let i = start; for (const x of arr || []) { yield [i++, x]; } },
      'zip': function* (...arrs) { const minLen = Math.min(...arrs.map(a => a?.length || 0)); for (let i = 0; i < minLen; i++) { yield arrs.map(a => a[i]); } },
      'map': (fn, arr) => [...(arr || [])].map(fn),
      'filter': (fn, arr) => [...(arr || [])].filter(fn),
      'type': (x) => { if (x === null) return 'NoneType'; if (Array.isArray(x)) return "<class 'list'>"; if (typeof x === 'object') return "<class 'dict'>"; return typeof x; },
      'isinstance': (x, t) => { const types = { 'int': () => Number.isInteger(x), 'float': () => typeof x === 'number' && !Number.isInteger(x), 'str': () => typeof x === 'string', 'bool': () => typeof x === 'boolean', 'list': () => Array.isArray(x), 'dict': () => typeof x === 'object' && x !== null && !Array.isArray(x) }; return types[t] ? types[t]() : x instanceof t; },
      'input': async (prompt) => { return new Promise(resolve => { this.onInput?.(prompt || '', resolve); }); },
      'open': (filename, mode = 'r') => { this.warn(`open() not fully supported - simulated for: ${filename}`); return { read: () => '', write: (s) => this.log(s), close: () => {} }; },
      'chr': (n) => String.fromCharCode(n), 'ord': (c) => c.charCodeAt(0),
      'hex': (n) => '0x' + n.toString(16), 'oct': (n) => '0o' + n.toString(8), 'bin': (n) => '0b' + n.toString(2),
      'pow': Math.pow, 'divmod': (a, b) => [Math.floor(a / b), a % b],
      'all': (arr) => arr && arr.every(x => Boolean(x)), 'any': (arr) => arr && arr.some(x => Boolean(x)),
      'repr': (x) => JSON.stringify(x), 'format': (x, fmt) => { try { if (typeof x === 'number' && fmt) { return x.toFixed(fmt.includes('.') ? fmt.split('.')[1].length : 0); } return String(x); } catch { return String(x); } },
      'sin': Math.sin, 'cos': Math.cos, 'tan': Math.tan, 'asin': Math.asin, 'acos': Math.acos, 'atan': Math.atan, 'atan2': Math.atan2,
      'sqrt': Math.sqrt, 'floor': Math.floor, 'ceil': Math.ceil, 'log': Math.log, 'log10': Math.log10, 'log2': Math.log2, 'exp': Math.exp,
      'degrees': (rad) => rad * 180 / Math.PI, 'radians': (deg) => deg * Math.PI / 180, 'hypot': (...args) => Math.sqrt(args.reduce((sum, n) => sum + n * n, 0)),
      'isfinite': Number.isFinite, 'isinf': Number.isInfinite, 'isnan': Number.isNaN,
    };

    const int = 'int', float = 'float', str = 'str', bool = 'bool', list = 'list', dict = 'dict';
    const mathNamespace = { 'pi': Math.PI, 'e': Math.E, 'fabs': Math.abs, 'fmod': (a, b) => a % b, 'modf': (x) => [x - Math.floor(x), Math.floor(x)], 'trunc': Math.trunc, 'copysign': (a, b) => Math.abs(a) * (b >= 0 ? 1 : -1) };

    const pythonToJS = (code) => {
      let js = code;
      js = js.replace(/\belif\b/g, 'else if');
      js = js.replace(/print\s*\((.*)\)\s*$/g, (_, args) => `__print(${args})`);
      js = js.replace(/input\s*\((.*)\)/g, (_, prompt) => `await __input(${prompt})`);
      js = js.replace(/range\s*\(\s*(\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
      js = js.replace(/range\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
      js = js.replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, 'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');
      js = js.replace(/range\s*\(\s*(\w+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
      js = js.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
      js = js.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/g, 'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');
      js = js.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
      js = js.replace(/\bnot\s+in\b/g, '!').replace(/\bis\s+not\b/g, '!==').replace(/\b(\w+)\s+in\s+(\w+)/g, '($2).includes($1)');
      js = js.replace(/\bnot\b(?!\s*in|\s*is)/g, '!');
      js = js.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
      js = js.replace(/\bself\b/g, 'this');
      js = js.replace(/try\s*\{/g, 'try {').replace(/\}except(?:\s*\(\s*(\w+)\s*\))?\s*\{/g, '} catch ($1) {');
      return js;
    };

    this._formatValue = (v) => {
      if (v === null) return 'None'; if (v === undefined) return 'None';
      if (typeof v === 'boolean') return v ? 'True' : 'False';
      if (Array.isArray(v)) return '[' + v.map(x => this._formatValue(x)).join(', ') + ']';
      if (typeof v === 'object') return '{' + Object.entries(v).map(([k, val]) => `${this._formatValue(k)}: ${this._formatValue(val)}`).join(', ') + '}';
      return String(v);
    };

    try {
      const jsCode = pythonToJS(code);
      const contextKeys = ['int', 'float', 'str', 'bool', 'list', 'dict', ...Object.keys(safeBuiltins)];
      const contextValues = [int, float, str, bool, list, dict, ...Object.values(safeBuiltins)];
      const mathKeys = Object.keys(mathNamespace);
      const mathValues = Object.values(mathNamespace);

      const fn = new Function(...contextKeys, ...mathKeys, '__print', '__input', '__this', `"use strict";return (async () => {try {${jsCode}} catch (__py_error) {const errorMsg = __py_error.message || String(__py_error);const stack = __py_error.stack || '';const lineMatch = stack.match(/<anonymous>:(\d+):(\d+)/);let lineInfo = '';if (lineMatch) {const jsLine = parseInt(lineMatch[1]) - 12;lineInfo = \` (行号 ~\${jsLine})\`;}throw new Error(\`Python执行错误: \${errorMsg}\${lineInfo}\`);}})()`);

      const thisProxy = new Proxy({}, { get: (_, prop) => { if (prop === '_output') return this.output; return (...args) => this.log(`${prop}(${args.map(a => JSON.stringify(a)).join(', ')})`, 'function'); } });

      await fn(...contextValues, ...mathValues, (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')), async (prompt) => { return new Promise(resolve => { this.onInput?.(prompt, resolve); }); }, thisProxy);
      this.log('\n=== 执行完成 ===', 'info');
    } catch (e) {
      this.error(`\n=== 执行错误 ===`, e.message);
    } finally {
      this.running = false;
    }
  }

  async executeCPlusPlus(code, compileAPIUrl = null) {
    if (this.running) { this.warn('代码正在执行中，请等待完成'); return; }
    this.running = true;
    this.clear();
    this.info('=== C++ 代码生成 ===\n');
    const cppCode = this.generateCppCode(code);
    this.generatedCode.cpp = cppCode;
    this.log('生成的 C++ 代码:', 'info');
    this.log(cppCode, 'code');
    this.log('\n提示: C++代码已生成，可复制到本地编译器使用', 'info');
    if (compileAPIUrl) {
      this.log('\n正在编译...', 'info');
      try {
        const response = await fetch(compileAPIUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: cppCode, language: 'cpp' }) });
        const result = await response.json();
        if (result.output) { this.log('\n=== 编译输出 ===', 'info'); this.log(result.output); }
        if (result.error) { this.error('\n=== 编译错误 ==='); this.error(result.error); }
        if (result.executionTime) { this.info(`\n执行时间: ${result.executionTime}ms`); }
      } catch (e) { this.error(`编译请求失败: ${e.message}`); }
    } else {
      this.warn('\n提示: 要执行C++代码，需要配置编译API服务');
      this.warn('建议: 可使用 Judge0 API 或自建编译服务');
    }
    this.running = false;
  }

  generateCppCode(jsCode) {
    let cpp = `// Auto-generated C++ code\n// Generated from Blockly/Scratch\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n`;
    const lines = jsCode.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line === '{' || line === '}') continue;
      line = line.replace(/async\s+/g, '').replace(/await\s+/g, '');
      line = line.replace(/const\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;').replace(/let\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;').replace(/var\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
      if (/^\w+\s*=\s*.+;$/.test(line) && !line.includes('auto ')) { line = 'auto ' + line; }
      line = line.replace(/console\.log\(/g, 'cout << ').replace(/JSON\.stringify\(([^)]+)\)/g, '$1');
      line = line.replace(/Math\.abs\(/g, 'abs(').replace(/Math\.floor\(/g, 'floor(').replace(/Math\.ceil\(/g, 'ceil(').replace(/Math\.sqrt\(/g, 'sqrt(').replace(/Math\.pow\(/g, 'pow(').replace(/Math\.PI/g, 'M_PI');
      line = line.replace(/parseInt\(([^)]+)\)/g, 'stoi($1)').replace(/parseFloat\(([^)]+)\)/g, 'stod($1)');
      line = line.replace(/===/g, '==').replace(/!==/g, '!=');
      line = line.replace(/for\s*\(\s*const\s+(\w+)\s+of\s+(.+?)\)/g, 'for (const auto&$1 : $2)').replace(/for\s*\(\s*let\s+(\w+)\s+of\s+(.+?)\)/g, 'for (auto&$1 : $2)');
      if (line) { cpp += '    ' + line + '\n'; }
    }
    cpp += `\n    return 0;\n}\n`;
    return cpp;
  }

  translateToPython(workspace) {
    try {
      if (!window.Blockly || !workspace) return '# Blockly not available';
      const pythonCode = window.Blockly.Python.workspaceToCode(workspace);
      this.generatedCode.python = pythonCode;
      return pythonCode;
    } catch (e) { this.error(`翻译失败: ${e.message}`); return '# 翻译失败'; }
  }
}

// Simplified ScratchInterpreter
class ScratchInterpreter {
  constructor(sprites, initialState, callbacks = {}) {
    this.sprites = sprites;
    this.state = initialState;
    this.callbacks = callbacks;
    this.running = false;
    this.keyboardState = {};
    this.mouseState = { x: 0, y: 0, down: false };
    this._bindEvents();
  }
  _bindEvents() {
    document.addEventListener('keydown', (e) => { this.keyboardState[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (e) => { this.keyboardState[e.key.toLowerCase()] = false; });
    document.addEventListener('mousemove', (e) => { this.mouseState.x = e.clientX; this.mouseState.y = e.clientY; });
    document.addEventListener('mousedown', () => { this.mouseState.down = true; });
    document.addEventListener('mouseup', () => { this.mouseState.down = false; });
  }
  _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  _random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  _updateState(spriteId, updates) { if (spriteId) { this.state.sprites[spriteId] = { ...this.state.sprites[spriteId], ...updates }; } this.callbacks.onStateChange?.(this.state); }
  _getSprite(spriteId) { return this.sprites.find(s => s.id === spriteId) || this.sprites[0]; }

  motion_movesteps(spriteId, steps) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const rad = ((state.direction || 90) - 90) * Math.PI / 180;
    const newX = (state.x || 0) + Math.cos(rad) * steps;
    const newY = (state.y || 0) - Math.sin(rad) * steps;
    this._updateState(spriteId, { x: newX, y: newY });
  }
  motion_gotoxy(spriteId, x, y) { this._updateState(spriteId, { x, y }); }
  motion_setx(spriteId, x) { this._updateState(spriteId, { x }); }
  motion_sety(spriteId, y) { this._updateState(spriteId, { y }); }
  motion_turn_right(spriteId, deg) { const state = this.state.sprites[spriteId] || {}; const newDir = ((state.direction || 90) + deg) % 360; this._updateState(spriteId, { direction: newDir < 0 ? newDir + 360 : newDir }); }
  motion_turn_left(spriteId, deg) { const state = this.state.sprites[spriteId] || {}; const newDir = ((state.direction || 90) - deg + 360) % 360; this._updateState(spriteId, { direction: newDir }); }
  motion_pointindirection(spriteId, direction) { this._updateState(spriteId, { direction }); }
  motion_xposition(spriteId) { return this.state.sprites[spriteId]?.x || 0; }
  motion_yposition(spriteId) { return this.state.sprites[spriteId]?.y || 0; }
  motion_direction(spriteId) { return this.state.sprites[spriteId]?.direction || 90; }

  looks_say(spriteId, text) { this._updateState(spriteId, { saying: String(text) }); }
  looks_sayforsecs(spriteId, text, secs) { this._updateState(spriteId, { saying: String(text) }); return this._delay(secs * 1000).then(() => { this._updateState(spriteId, { saying: null }); }); }
  looks_think(spriteId, text) { this._updateState(spriteId, { thinking: String(text) }); }
  looks_show(spriteId) { this._updateState(spriteId, { visible: true }); }
  looks_hide(spriteId) { this._updateState(spriteId, { visible: false }); }
  looks_switchcostumeto(spriteId, costumeName) { const sprite = this._getSprite(spriteId); if (!sprite) return; const idx = sprite.costumes.findIndex(c => c.name === costumeName); if (idx >= 0) { this._updateState(spriteId, { currentCostume: idx }); } }
  looks_nextcostume(spriteId) { const sprite = this._getSprite(spriteId); if (!sprite) return; const state = this.state.sprites[spriteId] || {}; const next = ((state.currentCostume || 0) + 1) % sprite.costumes.length; this._updateState(spriteId, { currentCostume: next }); }
  looks_changesizeby(spriteId, delta) { const state = this.state.sprites[spriteId] || {}; const newSize = Math.max(1, (state.size || 100) + delta); this._updateState(spriteId, { size: newSize }); }
  looks_setsizeto(spriteId, size) { this._updateState(spriteId, { size: Math.max(1, size) }); }
  looks_size(spriteId) { return this.state.sprites[spriteId]?.size || 100; }

  sensing_touching(spriteId, targetId) { const state = this.state.sprites[spriteId] || {}; const dx = (state.x || 0); const dy = (state.y || 0); return Math.sqrt(dx * dx + dy * dy) < 50; }
  sensing_distanceto(spriteId, targetId) { const state = this.state.sprites[spriteId] || {}; return Math.sqrt((state.x || 0) ** 2 + (state.y || 0) ** 2); }
  sensing_keypressed(spriteId, key) { return this.keyboardState[key.toLowerCase()] || false; }
  sensing_mousedown() { return this.mouseState.down; }
  sensing_mousex() { return this.mouseState.x - 100; }
  sensing_mousey() { return -(this.mouseState.y - 100); }

  operator_add(a, b) { return (a || 0) + (b || 0); }
  operator_subtract(a, b) { return (a || 0) - (b || 0); }
  operator_multiply(a, b) { return (a || 0) * (b || 0); }
  operator_divide(a, b) { return b !== 0 ? (a || 0) / b : 0; }
  operator_random(spriteId, from, to) { return this._random(from, to); }
  operator_gt(a, b) { return (a || 0) > (b || 0); }
  operator_lt(a, b) { return (a || 0) < (b || 0); }
  operator_equals(a, b) { return a === b; }
  operator_and(a, b) { return !!(a && b); }
  operator_or(a, b) { return !!(a || b); }
  operator_not(a) { return !a; }
  operator_mod(a, b) { return b !== 0 ? (a || 0) % b : 0; }
  operator_round(a) { return Math.round(a || 0); }
  operator_mathop(spriteId, op, num) { const n = num || 0; const ops = { 'abs': Math.abs, 'floor': Math.floor, 'ceiling': Math.ceil, 'sqrt': Math.sqrt, 'sin': (x) => Math.sin(x * Math.PI / 180), 'cos': (x) => Math.cos(x * Math.PI / 180), 'tan': (x) => Math.tan(x * Math.PI / 180), 'ln': Math.log, 'log': (x) => Math.log(x) / Math.LN10, 'e^': Math.exp, '10^': (x) => Math.pow(10, x) }; return ops[op] ? ops[op](n) : n; }
  operator_join(a, b) { return String(a || '') + String(b || ''); }
  operator_letter_of(spriteId, letter, string) { const s = String(string || ''); const idx = Math.floor(letter || 1) - 1; return idx >= 0 && idx < s.length ? s[idx] : ''; }
  operator_length(spriteId, string) { return String(string || '').length; }
  operator_contains(spriteId, string1, string2) { return String(string1 || '').toLowerCase().includes(String(string2 || '').toLowerCase()); }

  async control_wait(spriteId, seconds) { await this._delay(seconds * 1000); }
  async control_repeat(spriteId, times, fn) { for (let i = 0; i < times && this.running; i++) { await fn(); } }
  async control_forever(spriteId, fn) { while (this.running) { await fn(); } }
  async control_if(spriteId, condition, fn) { if (condition()) { await fn(); } }
  async control_if_else(spriteId, condition, ifFn, elseFn) { if (condition()) { await ifFn?.(); } else { await elseFn?.(); } }
  async control_repeat_until(spriteId, condition, fn) { while (!condition() && this.running) { await fn(); } }
  control_stop(spriteId, option) { if (option === 'all') { this.running = false; } }

  data_setvariableto(spriteId, name, value) { this.variables = this.variables || {}; this.variables[name] = value; }
  data_changevariableby(spriteId, name, delta) { this.variables = this.variables || {}; this.variables[name] = (this.variables[name] || 0) + delta; }

  pen_up(spriteId) { this._updateState(spriteId, { penDown: false }); }
  pen_down(spriteId) { this._updateState(spriteId, { penDown: true }); }
  pen_color(spriteId, color) { this._updateState(spriteId, { penColor: color }); }
  pen_size(spriteId, size) { this._updateState(spriteId, { penSize: Math.max(1, Math.min(100, size || 1)) }); }
  pen_clear(spriteId) { this.callbacks.onPenClear?.(); }

  event_broadcast(spriteId, message) { this.callbacks.onBroadcast?.(message); }

  start() { this.running = true; }
  stop() { this.running = false; }
  setCurrentSprite(spriteId) { this.currentSpriteId = spriteId; }
  resolveAsk(answer) { if (this.pendingAskResolve) { this.askInput.answer = answer; this.askInput.active = false; this.pendingAskResolve(); this.pendingAskResolve = null; } }
}

// ============================================================================
// Enhanced IDE Component
// ============================================================================

export default function IDEEnhancedPage() {
  const workspaceRef = useRef(null);
  const stageRef = useRef(null);
  const penRef = useRef(null);
  const consoleRef = useRef(null);
  const codePreviewRef = useRef(null);
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
  const [themeMode, setThemeMode] = useState('dark');
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(280);
  const [isResizingConsole, setIsResizingConsole] = useState(false);
  const [blocklyFullscreen, setBlocklyFullscreen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState('scratch');
  const [outputTab, setOutputTab] = useState('output');
  const [selectedToolboxCategory, setSelectedToolboxCategory] = useState('motion');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoCompile, setAutoCompile] = useState(false);

  const navigate = useNavigate();
  const { type } = useParams();
  const location = useLocation();

  const [projectData, setProjectData] = useState({
    stage: { backdrops: [{ id: 'backdrop1', name: '背景1', dataUrl: '' }], currentBackdrop: 0 },
    sprites: [],
  });
  const [sprites, setSprites] = useState([]);
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [spriteModalVisible, setSpriteModalVisible] = useState(false);
  const [editingSpriteName, setEditingSpriteName] = useState('');
  const [costumeModalVisible, setCostumeModalVisible] = useState(false);
  const [editingCostumeName, setEditingCostumeName] = useState('');
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [editingSoundName, setEditingSoundName] = useState('');
  const [runtimeState, setRuntimeState] = useState({ sprites: {}, running: false, threads: [] });
  const [cloudVariables, setCloudVariables] = useState([]);
  const [cloudVariablesModalVisible, setCloudVariablesModalVisible] = useState(false);
  const [newCloudVariableName, setNewCloudVariableName] = useState('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced');
  const [outputConsole, setOutputConsole] = useState([]);
  const [outputVisible, setOutputVisible] = useState(true);
  const [askQuestion, setAskQuestion] = useState('');
  const [askVisible, setAskVisible] = useState(false);
  const [askAnswer, setAskAnswer] = useState('');
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputVisible, setInputVisible] = useState(false);
  const [inputResolve, setInputResolve] = useState(null);
  const codeExecutorRef = useRef(null);

  const projectType = type || 'scratch';

  // Category icons mapping
  const categoryIcons = {
    motion: '🚗', looks: '👁️', sound: '🔊', events: '⚡', control: '🔄',
    sensing: '🎮', operators: '🔢', variables: '📦', lists: '📋', pen: '🖊️'
  };

  // Category definitions with enhanced metadata
  const toolboxCategories = useMemo(() => [
    { id: 'motion', name: '运动', colour: '#4C97FF', icon: '🚗', description: '移动和旋转角色' },
    { id: 'looks', name: '外观', colour: '#9966FF', icon: '👁️', description: '控制角色外观' },
    { id: 'sound', name: '声音', colour: '#CFCF4F', icon: '🔊', description: '播放声音和音乐' },
    { id: 'events', name: '事件', colour: '#FFBF00', icon: '⚡', description: '响应各种事件' },
    { id: 'control', name: '控制', colour: '#FFAB19', icon: '🔄', description: '循环和条件' },
    { id: 'sensing', name: '传感', colour: '#5CB1D6', icon: '🎮', description: '检测和交互' },
    { id: 'operators', name: '运算', colour: '#59C059', icon: '🔢', description: '数学和逻辑运算' },
    { id: 'variables', name: '变量', colour: '#FF8C1A', icon: '📦', description: '存储数据' },
    { id: 'lists', name: '列表', colour: '#FF661A', icon: '📋', description: '列表操作' },
    { id: 'pen', name: '画笔', colour: '#00A0A0', icon: '🖊️', description: '绘图功能' },
  ], []);

  // Filter blocks based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return toolboxCategories;
    const query = searchQuery.toLowerCase();
    return toolboxCategories.filter(cat =>
      cat.name.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query)
    );
  }, [toolboxCategories, searchQuery]);

  // Console resize handling
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingConsole) return;
      const newHeight = window.innerHeight - e.clientY - 60;
      setConsoleHeight(Math.max(150, Math.min(600, newHeight)));
    };
    const handleMouseUp = () => setIsResizingConsole(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingConsole]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current && outputConsole.length > 0) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [outputConsole]);

  const fetchCloudProjects = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const projects = await getProjects(user.id);
      setCloudProjects(projects.filter(p => p.type === projectType));
    } catch (error) { console.error('获取云端项目列表失败:', error); }
  }, [projectType]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize Blockly workspace
  useEffect(() => {
    loadBlockly();
    fetchCloudProjects();
    initDefaultProjectData();

    codeExecutorRef.current = new CodeExecutor(
      (entry) => { if (entry.clear) { setOutputConsole([]); } else { setOutputConsole(prev => [...prev, entry]); } },
      (entry) => { setOutputConsole(prev => [...prev, entry]); },
      (prompt, resolve) => { setInputPrompt(prompt); setInputVisible(true); setInputResolve(resolve); }
    );

    if (location.state?.projectId) { handleLoadProject(location.state.projectId); }

    return () => {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [location.state]);

  useEffect(() => {
    if (projectId) {
      const timer = setInterval(() => handleAutoSave(), 60000);
      setAutoSaveTimer(timer);
      return () => clearInterval(timer);
    }
  }, [projectId, lastSavedContent, lastSavedData]);

  useEffect(() => {
    if (stageRef.current && isRunning) { drawStage(); }
  }, [runtimeState, isRunning]);

  const initDefaultProjectData = () => {
    const defaultSprite = {
      id: generateId(), name: '角色1', x: 0, y: 0, direction: 90, visible: true, size: 100,
      rotationStyle: 'normal', costumes: [{ id: generateId(), name: '造型1', dataUrl: createDefaultCostume('#FFBF00') }],
      currentCostume: 0, sounds: [], scripts: '',
    };
    setSprites([defaultSprite]);
    setSelectedSprite(defaultSprite.id);
    setProjectData({ stage: { backdrops: [{ id: generateId(), name: '背景1', dataUrl: '' }], currentBackdrop: 0 } });
  };

  const createDefaultCostume = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(50, 50, 45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(35, 40, 8, 0, Math.PI * 2); ctx.arc(65, 40, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(50, 60, 20, 0, Math.PI); ctx.stroke();
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
          if (window.Blockly) { defineBlocks(window.Blockly); registerGenerators(window.Blockly); registerPythonGenerators(window.Blockly); }
          initWorkspace();
        };
        msgScript.onerror = () => { if (window.Blockly) { defineBlocks(window.Blockly); registerGenerators(window.Blockly); registerPythonGenerators(window.Blockly); } initWorkspace(); };
        document.head.appendChild(msgScript);
      };
      link.onerror = () => {
        const backupLink = document.createElement('link');
        backupLink.rel = 'stylesheet';
        backupLink.href = 'https://blockly.googleapis.com/blockly/latest/blockly.css';
        backupLink.onload = () => { if (window.Blockly) { defineBlocks(window.Blockly); registerGenerators(window.Blockly); registerPythonGenerators(window.Blockly); } initWorkspace(); };
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
        backupLink.onload = () => { if (window.Blockly) { defineBlocks(window.Blockly); registerGenerators(window.Blockly); registerPythonGenerators(window.Blockly); } initWorkspace(); };
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
          grid: { spacing: 20, length: 3, colour: themeMode === 'dark' ? '#444' : '#ddd', snap: true },
          trashcan: true,
          zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 2.5, minScale: 0.3 },
          sounds: false,
          theme: themeMode === 'dark' ? window.Blockly.Theme.defineTheme('dark', {
            base: window.Blockly.Themes.Classic,
            componentStyles: { workspaceBackgroundColour: '#1a1a2e', toolboxBackgroundColour: '#16213e', toolboxForegroundColour: '#e4e4e7', flyoutBackgroundColour: '#1e1e3f', flyoutForegroundColour: '#e4e4e7', flyoutOpacity: 0.95, scrollbarColour: '#4a4a6a', insertionMarkerColour: '#6366f1', insertionMarkerOpacity: 0.3, scrollbarOpacity: 0.4, cursorColour: '#6366f1' }
          }) : undefined,
        });

        if (selectedSprite) {
          const sprite = sprites.find(s => s.id === selectedSprite);
          if (sprite?.scripts) {
            try { const xmlDom = window.Blockly.Xml.textToDom(sprite.scripts); workspaceRef.current.clear(); window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current); } catch (e) {} }
        }
        message.success('编程环境已就绪！');
      } catch (e) { console.error('Blockly初始化失败:', e); message.error('编程环境初始化失败'); }
    }
  };

  const getToolbox = () => ({
    kind: 'categoryToolbox',
    contents: [
      { kind: 'category', name: '运动', colour: '#4C97FF', contents: [
        { kind: 'block', type: 'motion_move_steps' }, { kind: 'block', type: 'motion_turn_right' }, { kind: 'block', type: 'motion_turn_left' },
        { kind: 'block', type: 'motion_goto' }, { kind: 'block', type: 'motion_gotoxy' }, { kind: 'block', type: 'motion_glideto' },
        { kind: 'block', type: 'motion_changexby' }, { kind: 'block', type: 'motion_changeyby' }, { kind: 'block', type: 'motion_setx' }, { kind: 'block', type: 'motion_sety' },
        { kind: 'block', type: 'motion_ifonedgebounce' }, { kind: 'block', type: 'motion_pointindirection' }, { kind: 'block', type: 'motion_pointtowards' },
        { kind: 'block', type: 'motion_xposition' }, { kind: 'block', type: 'motion_yposition' }, { kind: 'block', type: 'motion_direction' },
      ]},
      { kind: 'category', name: '外观', colour: '#9966FF', contents: [
        { kind: 'block', type: 'looks_say' }, { kind: 'block', type: 'looks_sayforsecs' }, { kind: 'block', type: 'looks_think' }, { kind: 'block', type: 'looks_thinkforsecs' },
        { kind: 'block', type: 'looks_show' }, { kind: 'block', type: 'looks_hide' }, { kind: 'block', type: 'looks_switchcostumeto' }, { kind: 'block', type: 'looks_nextcostume' },
        { kind: 'block', type: 'looks_changesizeby' }, { kind: 'block', type: 'looks_setsizeto' }, { kind: 'block', type: 'looks_size' },
      ]},
      { kind: 'category', name: '声音', colour: '#CFCF4F', contents: [
        { kind: 'block', type: 'sound_play' }, { kind: 'block', type: 'sound_playuntildone' }, { kind: 'block', type: 'sound_stopallsounds' },
        { kind: 'block', type: 'sound_playnotemusic' }, { kind: 'block', type: 'sound_playdrum' }, { kind: 'block', type: 'sound_rest' },
        { kind: 'block', type: 'sound_settempo' }, { kind: 'block', type: 'sound_changetempoby' },
      ]},
      { kind: 'category', name: '事件', colour: '#FFBF00', contents: [
        { kind: 'block', type: 'event_whenflagclicked' }, { kind: 'block', type: 'event_whenkeypressed' }, { kind: 'block', type: 'event_whenthisspriteclicked' },
        { kind: 'block', type: 'event_whenbackdropswitchto' }, { kind: 'block', type: 'event_whengreaterthan' },
      ]},
      { kind: 'category', name: '控制', colour: '#FFAB19', contents: [
        { kind: 'block', type: 'control_wait' }, { kind: 'block', type: 'control_wait_secs' }, { kind: 'block', type: 'control_repeat' },
        { kind: 'block', type: 'control_repeat_until' }, { kind: 'block', type: 'control_forever' }, { kind: 'block', type: 'control_if' },
        { kind: 'block', type: 'control_if_else' }, { kind: 'block', type: 'control_stop' },
      ]},
      { kind: 'category', name: '传感', colour: '#5CB1D6', contents: [
        { kind: 'block', type: 'sensing_touching' }, { kind: 'block', type: 'sensing_distanceto' }, { kind: 'block', type: 'sensing_askandwait' },
        { kind: 'block', type: 'sensing_keypressed' }, { kind: 'block', type: 'sensing_mousedown' }, { kind: 'block', type: 'sensing_mousex' },
        { kind: 'block', type: 'sensing_mousey' }, { kind: 'block', type: 'sensing_answer' }, { kind: 'block', type: 'sensing_timer' },
      ]},
      { kind: 'category', name: '运算', colour: '#59C059', contents: [
        { kind: 'block', type: 'operator_add' }, { kind: 'block', type: 'operator_subtract' }, { kind: 'block', type: 'operator_multiply' },
        { kind: 'block', type: 'operator_divide' }, { kind: 'block', type: 'operator_random' }, { kind: 'block', type: 'operator_gt' },
        { kind: 'block', type: 'operator_lt' }, { kind: 'block', type: 'operator_equals' }, { kind: 'block', type: 'operator_and' },
        { kind: 'block', type: 'operator_or' }, { kind: 'block', type: 'operator_not' }, { kind: 'block', type: 'operator_mod' },
        { kind: 'block', type: 'operator_round' }, { kind: 'block', type: 'operator_mathop' }, { kind: 'block', type: 'operator_join' },
        { kind: 'block', type: 'operator_letter_of' }, { kind: 'block', type: 'operator_length' }, { kind: 'block', type: 'operator_contains' },
      ]},
      { kind: 'category', name: '变量', colour: '#FF8C1A', custom: 'VARIABLE' },
      { kind: 'category', name: '列表', colour: '#FF661A', custom: 'LIST' },
      { kind: 'category', name: '画笔', colour: '#00A0A0', contents: [
        { kind: 'block', type: 'pen_up' }, { kind: 'block', type: 'pen_down' }, { kind: 'block', type: 'pen_color' },
        { kind: 'block', type: 'pen_size' }, { kind: 'block', type: 'pen_clear' }, { kind: 'block', type: 'pen_stamp' },
      ]},
    ]
  });

  // Draw speech/thought bubble helper
  const drawBubble = (ctx, x, y, text, isThink) => {
    if (!text) return;
    ctx.save();
    const padding = 8, fontSize = 12;
    ctx.font = `${fontSize}px Arial, sans-serif`;
    const lines = text.split('\n');
    const maxWidth = Math.min(150, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
    const lineHeight = fontSize * 1.3;
    const bubbleHeight = lines.length * lineHeight + padding * 2;
    ctx.fillStyle = isThink ? '#d4d4d4' : '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - maxWidth / 2, y - bubbleHeight, maxWidth, bubbleHeight, 10);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (isThink) { ctx.arc(x - 5, y, 4, 0, Math.PI * 2); ctx.arc(x + 5, y + 5, 3, 0, Math.PI * 2); ctx.arc(x + 10, y + 10, 2, 0, Math.PI * 2); }
    else { ctx.moveTo(x - 8, y); ctx.lineTo(x, y + 10); ctx.lineTo(x + 8, y); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((line, i) => { ctx.fillText(line, x, y - bubbleHeight + padding + i * lineHeight); });
    ctx.restore();
  };

  const drawStage = useCallback(() => {
    const canvas = stageRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const backdrop = projectData.stage.backdrops[projectData.stage.currentBackdrop];
    if (backdrop?.dataUrl) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, width, height); img.src = backdrop.dataUrl; }
    else { ctx.fillStyle = '#2a2a4a'; ctx.fillRect(0, 0, width, height); }
    const sortedSprites = [...sprites].sort((a, b) => (runtimeState.sprites[a.id]?.layer || 0) - (runtimeState.sprites[b.id]?.layer || 0));
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
        ctx.translate(drawX, drawY); ctx.rotate(radians); ctx.scale(scale, scale);
        if (state.graphicEffects?.brightness) { ctx.filter = `brightness(${100 + state.graphicEffects.brightness}%)`; }
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
        if (state.saying) { drawBubble(ctx, drawX, drawY - img.height * scale / 2 - 20, state.saying, false); }
        else if (state.thinking) { drawBubble(ctx, drawX, drawY - img.height * scale / 2 - 20, state.thinking, true); }
      };
      img.src = costume.dataUrl;
    });
  }, [sprites, runtimeState, projectData]);

  const executeCode = (code) => {
    if (!code) return;
    const allSprites = [...sprites];
    const initialState = {};
    allSprites.forEach(s => { initialState[s.id] = { x: s.x, y: s.y, direction: s.direction, visible: s.visible, size: s.size, currentCostume: s.currentCostume, saying: null, thinking: null, volume: 100, graphicEffects: {}, penDown: false, penColor: '#000000', penSize: 1 }; });

    const interpreter = new ScratchInterpreter(allSprites, { sprites: { ...initialState } }, {
      onStateChange: (newState) => { setRuntimeState(newState); },
      onAsk: (question) => { setAskQuestion(question); setAskVisible(true); },
      onPenClear: () => { const canvas = penRef.current; if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); } },
      onPenDraw: (spriteId, oldX, oldY, newX, newY, color, size) => {
        const canvas = penRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const stageW = canvas.width, stageH = canvas.height;
        const drawOldX = stageW / 2 + oldX, drawOldY = stageH / 2 - oldY, drawNewX = stageW / 2 + newX, drawNewY = stageH / 2 - newY;
        ctx.beginPath(); ctx.moveTo(drawOldX, drawOldY); ctx.lineTo(drawNewX, drawNewY);
        ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.stroke();
      },
      onBroadcast: (message) => { console.log('Broadcast:', message); },
      onBackdropChange: (index) => { setProjectData(prev => ({ ...prev, stage: { ...prev.stage, currentBackdrop: index } })); },
      onNextBackdrop: () => { setProjectData(prev => ({ ...prev, stage: { ...prev.stage, currentBackdrop: (prev.stage.currentBackdrop + 1) % prev.stage.backdrops.length } })); },
    });

    cloudVariables.forEach(cv => { interpreter.variables[cv.name] = cv.value; interpreter.cloudVariables[cv.name] = cv.value; });
    interpreter.setCurrentSprite(selectedSprite);
    interpreter.start();
    setRuntimeState({ sprites: initialState, running: true, threads: [], interpreter });
    runAsyncCode(interpreter, code);
  };

  const runAsyncCode = async (interpreter, code) => {
    try {
      const asyncFn = new AsyncFunction(code);
      await asyncFn(interpreter);
    } catch (e) { if (e.message !== 'STOP_SCRIPT') { console.error('Execution error:', e); } }
    finally { if (interpreter.running) { setRuntimeState(prev => ({ ...prev, running: false })); setIsRunning(false); } }
  };

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  const handlePlay = () => {
    if (workspaceRef.current) {
      const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current);
      const scriptsXml = window.Blockly.Xml.domToText(xml);
      setSprites(prev => prev.map(s => s.id === selectedSprite ? { ...s, scripts: scriptsXml } : s));
      const code = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      executeCode(code);
    }
    setIsRunning(true);
    setOutputVisible(true);
    message.success('项目运行中...');
  };

  const handleRunPython = async (pythonCode) => {
    if (codeExecutorRef.current) { setOutputVisible(true); setActiveLanguage('python'); await codeExecutorRef.current.executePython(pythonCode); }
  };

  const handleRunCpp = async (cppCode) => {
    if (codeExecutorRef.current) { setOutputVisible(true); setActiveLanguage('cpp'); await codeExecutorRef.current.executeCPlusPlus(cppCode); }
  };

  const getPythonCode = () => {
    if (workspaceRef.current && codeExecutorRef.current) { return codeExecutorRef.current.translateToPython(workspaceRef.current); }
    return '';
  };

  const getCppCode = () => {
    if (workspaceRef.current && codeExecutorRef.current) {
      const jsCode = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      return codeExecutorRef.current.generateCppCode(jsCode);
    }
    return '';
  };

  const handleClearOutput = () => { if (codeExecutorRef.current) { codeExecutorRef.current.clear(); } setOutputConsole([]); };

  const handleInputSubmit = () => {
    if (inputResolve) { inputResolve(inputPrompt); setInputResolve(null); setInputPrompt(''); setInputVisible(false); }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (runtimeState.interpreter) { runtimeState.interpreter.stop(); }
    setRuntimeState(prev => ({ ...prev, running: false }));
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); }
    message.info('已停止');
  };

  const handleAskSubmit = () => { if (runtimeState.interpreter) { runtimeState.interpreter.resolveAsk(askAnswer); } setAskVisible(false); setAskAnswer(''); setAskQuestion(''); };

  const handleAddCloudVariable = () => {
    const name = newCloudVariableName.trim();
    if (!name) { message.error('请输入云变量名称'); return; }
    if (!name.startsWith('_cloud_')) { message.error('云变量名称必须以 _cloud_ 开头'); return; }
    if (cloudVariables.some(v => v.name === name)) { message.error('云变量已存在'); return; }
    setCloudVariables(prev => [...prev, { name, value: '0' }]);
    setNewCloudVariableName('');
    setCloudVariablesModalVisible(false);
    message.success('云变量已创建');
  };

  const handleDeleteCloudVariable = (name) => { setCloudVariables(prev => prev.filter(v => v.name !== name)); message.success('云变量已删除'); };

  const handleCloudVariableSync = async () => {
    if (!projectId) return;
    setCloudSyncStatus('syncing');
    try { await updateCloudVariables(projectId, cloudVariables); setCloudSyncStatus('synced'); }
    catch (error) { console.error('云变量同步失败:', error); setCloudSyncStatus('error'); }
  };

  const fetchCloudVariables = useCallback(async (pid) => {
    if (!pid) return;
    try { const vars = await getCloudVariables(pid); if (Array.isArray(vars) && vars.length > 0) { setCloudVariables(vars); } return { result: vars }; }
    catch (error) { console.error('获取云变量失败:', error); return { result: null }; }
  }, []);

  const handleAddSprite = () => {
    const newSprite = {
      id: generateId(), name: `角色${sprites.length + 1}`, x: Math.random() * 200 - 100, y: Math.random() * 200 - 100,
      direction: 90, visible: true, size: 100, rotationStyle: 'normal',
      costumes: [{ id: generateId(), name: '造型1', dataUrl: createDefaultCostume(`hsl(${Math.random() * 360}, 70%, 50%)`) }],
      currentCostume: 0, sounds: [], scripts: '',
    };
    setSprites(prev => [...prev, newSprite]);
    setSelectedSprite(newSprite.id);
    setSpriteModalVisible(false);
    message.success('已添加角色');
  };

  const handleDeleteSprite = (id) => { if (sprites.length <= 1) { message.warning('至少保留一个角色'); return; } setSprites(prev => prev.filter(s => s.id !== id)); if (selectedSprite === id) { setSelectedSprite(sprites[0]?.id); } message.success('已删除角色'); };
  const handleRenameSprite = () => { setSprites(prev => prev.map(s => s.id === selectedSprite ? { ...s, name: editingSpriteName } : s)); setSpriteModalVisible(false); };

  const handleSelectSprite = (id) => {
    setSelectedSprite(id);
    const sprite = sprites.find(s => s.id === id);
    if (sprite && workspaceRef.current) {
      try { if (sprite.scripts) { const xmlDom = window.Blockly.Xml.textToDom(sprite.scripts); workspaceRef.current.clear(); window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current); } else { workspaceRef.current.clear(); } } catch (e) { workspaceRef.current.clear(); } }
  };

  const handleAddCostume = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newCostume = { id: generateId(), name: file.name.replace(/\.[^/.]+$/, ''), dataUrl: e.target.result };
      setSprites(prev => prev.map(s => s.id === selectedSprite ? { ...s, costumes: [...s.costumes, newCostume], currentCostume: s.costumes.length } : s));
      message.success('造型已添加');
    };
    reader.readAsDataURL(file);
    setCostumeModalVisible(false);
  };

  const handleDeleteCostume = (costumeId) => { setSprites(prev => prev.map(s => { if (s.id !== selectedSprite) return s; if (s.costumes.length <= 1) { message.warning('至少保留一个造型'); return s; } return { ...s, costumes: s.costumes.filter(c => c.id !== costumeId), currentCostume: 0 }; })); };
  const handleSelectCostume = (costumeId) => { setSprites(prev => prev.map(s => { if (s.id !== selectedSprite) return s; const idx = s.costumes.findIndex(c => c.id === costumeId); return { ...s, currentCostume: idx }; })); };

  const handleAddSound = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newSound = { id: generateId(), name: file.name.replace(/\.[^/.]+$/, ''), dataUrl: e.target.result, duration: 0 };
      setSprites(prev => prev.map(s => s.id === selectedSprite ? { ...s, sounds: [...s.sounds, newSound] } : s));
      message.success('声音已添加');
    };
    reader.readAsDataURL(file);
    setSoundModalVisible(false);
  };

  const handleDeleteSound = (soundId) => { setSprites(prev => prev.map(s => { if (s.id !== selectedSprite) return s; return { ...s, sounds: s.sounds.filter(snd => snd.id !== soundId) }; })); };

  const handleAddBackdrop = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newBackdrop = { id: generateId(), name: file.name.replace(/\.[^/.]+$/, ''), dataUrl: e.target.result };
      setProjectData(prev => ({ ...prev, stage: { ...prev.stage, backdrops: [...prev.stage.backdrops, newBackdrop], currentBackdrop: prev.stage.backdrops.length } }));
      message.success('背景已添加');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectBackdrop = (index) => { setProjectData(prev => ({ ...prev, stage: { ...prev.stage, currentBackdrop: index } })); };
  const handleDeleteBackdrop = (index) => { if (projectData.stage.backdrops.length <= 1) { message.warning('至少保留一个背景'); return; } setProjectData(prev => ({ ...prev, stage: { ...prev.stage, backdrops: prev.stage.backdrops.filter((_, i) => i !== index), currentBackdrop: 0 } })); };

  const getWorkspaceContent = () => { if (workspaceRef.current) { const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current); return window.Blockly.Xml.domToText(xml); } return ''; };

  const handleSaveLocal = () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    localStorage.setItem('scratch-project', xmlText);
    localStorage.setItem('scratch-project-name', projectName);
    localStorage.setItem('scratch-project-type', projectType);
    localStorage.setItem('scratch-project-data', data);
    message.success('项目已保存到本地！');
  };

  const handleSaveToCloud = async () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      if (projectId) { await updateProject(projectId, { name: projectName, content: xmlText, projectData: data }); message.success('项目已更新到云端！'); }
      else { const result = await createProject({ name: projectName, type: projectType, content: xmlText, projectData: data, userId: user.id }); setProjectId(result.id); message.success('项目已保存到云端！'); }
      setLastSavedContent(xmlText);
      setLastSavedData(data);
      setSaveModalVisible(false);
      fetchCloudProjects();
    } catch (error) { console.error('保存失败:', error); message.error('保存失败，请重试'); }
  };

  const handleAutoSave = async () => {
    if (!projectId) return;
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    if (xmlText === lastSavedContent && data === lastSavedData) return;
    try { await updateProject(projectId, { name: projectName, content: xmlText, projectData: data }); setLastSavedContent(xmlText); setLastSavedData(data); }
    catch (error) { console.error('自动保存失败:', error); }
  };

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
          if (data.cloudVariables && Array.isArray(data.cloudVariables)) { setCloudVariables(data.cloudVariables); }
          if (data.sprites?.length > 0) { setSelectedSprite(data.sprites[0].id); }
        } catch (e) { console.error('解析项目数据失败:', e); }
      }
      fetchCloudVariables(id).then(result => { if (result?.result) { setCloudVariables(result.result); } }).catch(() => {});
      if (workspaceRef.current && project.content) {
        try { const xmlDom = window.Blockly.Xml.textToDom(project.content); workspaceRef.current.clear(); window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current); } catch (e) { console.error('加载项目失败:', e); message.error('加载项目失败'); }
      }
      setLastSavedContent(project.content || '');
      setLastSavedData(project.projectData || '');
      setLoadModalVisible(false);
      message.success('项目加载成功！');
    } catch (error) { console.error('加载项目失败:', error); message.error('加载项目失败，请重试'); }
  };

  const handleDeleteProject = async (id) => { try { await deleteProject(id); message.success('项目已删除'); fetchCloudProjects(); if (projectId === id) setProjectId(null); } catch (error) { console.error('删除失败:', error); message.error('删除失败，请重试'); } };

  const handleRemixProject = async (id) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) { message.error('请先登录'); return; }
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
            if (data.cloudVariables && Array.isArray(data.cloudVariables)) { setCloudVariables(data.cloudVariables); }
            if (data.sprites?.length > 0) { setSelectedSprite(data.sprites[0].id); }
          } catch (e) { console.error('解析项目数据失败:', e); }
        }
        if (workspaceRef.current && remixed.content) {
          try { const xmlDom = window.Blockly.Xml.textToDom(remixed.content); workspaceRef.current.clear(); window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current); } catch (e) { console.error('加载项目失败:', e); }
        }
        setLastSavedContent(remixed.content || '');
        setLastSavedData(remixed.projectData || '');
        setLoadModalVisible(false);
        message.success('已成功派生项目！');
      }
    } catch (error) { console.error('派生失败:', error); message.error('派生失败，请重试'); }
  };

  const handleNewProject = () => {
    if (workspaceRef.current) workspaceRef.current.clear();
    setProjectId(null);
    setProjectName('我的项目');
    setLastSavedContent('');
    setLastSavedData('');
    setCloudVariables([]);
    initDefaultProjectData();
    setLoadModalVisible(false);
    message.success('已创建新项目');
  };

  const handleExportProject = () => {
    const xmlText = getWorkspaceContent();
    const exportData = { name: projectName, type: projectType, content: xmlText, projectData: JSON.stringify({ sprites, projectData, cloudVariables }), exportedAt: new Date().toISOString(), version: '1.0' };
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

  const handleImportProject = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.name) setProjectName(data.name);
        if (data.content && workspaceRef.current) {
          try { const xmlDom = window.Blockly.Xml.textToDom(data.content); workspaceRef.current.clear(); window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current); } catch (err) { message.error('加载项目块失败'); }
        }
        if (data.projectData) {
          try {
            const parsed = JSON.parse(data.projectData);
            if (parsed.sprites) setSprites(parsed.sprites);
            if (parsed.projectData) setProjectData(parsed.projectData);
            if (parsed.cloudVariables) setCloudVariables(parsed.cloudVariables);
          } catch (err) { console.error('解析项目数据失败', err); }
        }
        message.success('项目导入成功');
      } catch (err) { message.error('项目文件格式错误'); console.error('导入失败', err); }
    };
    reader.readAsText(file);
  };

  const selectedSpriteData = sprites.find(s => s.id === selectedSprite);

  // Syntax highlighting for code preview
  const highlightCode = (code, language) => {
    if (!code) return '';
    let highlighted = code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (language === 'python') {
      highlighted = highlighted
        .replace(/(#.*)/g, '<span class="hl-comment">$1</span>')
        .replace(/\b(def|class|return|if|else|elif|for|while|import|from|as|try|except|finally|with|lambda|yield|True|False|None|and|or|not|in|is)\b/g, '<span class="hl-keyword">$1</span>')
        .replace(/\b(print|len|range|str|int|float|bool|list|dict|abs|min|max|sum|round|sorted|reversed|enumerate|zip|map|filter|type|isinstance|input|open)\b/g, '<span class="hl-builtin">$1</span>')
        .replace(/"([^"]*)"/g, '<span class="hl-string">"$1"</span>')
        .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    } else if (language === 'cpp') {
      highlighted = highlighted
        .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
        .replace(/\b(#include|using|namespace|int|char|float|double|bool|void|return|if|else|for|while|do|switch|case|break|continue|const|static|struct|class|public|private|protected|virtual|override|new|delete|true|false|nullptr|std|cout|cin|endl|string|vector|map|set)\b/g, '<span class="hl-keyword">$1</span>')
        .replace(/"([^"]*)"/g, '<span class="hl-string">"$1"</span>')
        .replace(/'([^']*)'/g, '<span class="hl-string">\'$1\'</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    }
    return highlighted;
  };

  // Count lines for code display
  const getLineNumbers = (code) => {
    if (!code) return '1';
    return code.split('\n').map((_, i) => i + 1).join('\n');
  };

  return (
    <div className={`ide-enhanced-page ${themeMode}`}>
      {/* Enhanced Header */}
      <header className="ide-header-enhanced">
        <div className="header-left">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="header-btn" />
          <div className="project-name-wrapper">
            <input className="project-name-input-enhanced" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="项目名称" />
            {projectId && <Badge status="success" text={<span className="sync-status">已同步</span>} />}
          </div>
        </div>

        <div className="header-center">
          <Space size="small">
            <Tooltip title="运行 (绿旗)">
              <Button type="primary" danger={isRunning} icon={<PlayCircleOutlined />} onClick={handlePlay} disabled={isRunning} className="control-btn run-btn" />
            </Tooltip>
            <Tooltip title="停止">
              <Button icon={<StopOutlined />} onClick={handleStop} disabled={!isRunning} className="control-btn" />
            </Tooltip>
            <Divider type="vertical" className="header-divider" />
            <Tooltip title={blocklyFullscreen ? "退出全屏" : "Blockly全屏"}>
              <Button icon={blocklyFullscreen ? <ShrinkOutlined /> : <FullscreenOutlined />} onClick={() => setBlocklyFullscreen(!blocklyFullscreen)} className="control-btn" />
            </Tooltip>
            <Tooltip title={consoleCollapsed ? "展开控制台" : "收起控制台"}>
              <Button icon={<ConsoleSqlOutlined />} onClick={() => setConsoleCollapsed(!consoleCollapsed)} className="control-btn" type={outputVisible ? 'primary' : 'default'} />
            </Tooltip>
          </Space>
        </div>

        <div className="header-right">
          <Space size="small">
            <Button icon={<FolderOpenOutlined />} onClick={() => setLoadModalVisible(true)} className="header-btn">打开</Button>
            <Dropdown overlay={
              <Space direction="vertical" style={{ padding: 8 }} className="save-dropdown">
                <Button icon={<SaveOutlined />} onClick={handleSaveLocal} block>保存到本地</Button>
                <Button icon={<CloudOutlined />} onClick={() => setSaveModalVisible(true)} block>保存到云端</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportProject} block>导出项目</Button>
                <Dragger showUploadList={false} beforeUpload={(file) => { handleImportProject(file); return false; }} accept=".json">
                  <Button icon={<UploadOutlined />} block>导入项目</Button>
                </Dragger>
              </Space>
            }}>
              <Button icon={<SaveOutlined />} className="header-btn">保存</Button>
            </Dropdown>
            <Tooltip title={themeMode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
              <Button icon={<SyncOutlined spin={false} />} onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} className="header-btn theme-toggle">
                {themeMode === 'dark' ? '🌙' : '☀️'}
              </Button>
            </Tooltip>
          </Space>
        </div>
      </header>

      {/* Main Content */}
      <div className={`ide-main-content ${blocklyFullscreen ? 'fullscreen' : ''}`}>
        {/* Left Sidebar - Sprite & Category Panel */}
        <aside className="left-sidebar">
          {/* Sprite Panel */}
          <div className="sprite-panel-enhanced">
            <div className="panel-header">
              <LayoutOutlined />
              <span>角色</span>
              <Button type="text" icon={<PlusOutlined />} size="small" onClick={() => setSpriteModalVisible(true)} />
            </div>
            <div className="sprite-list-enhanced">
              {sprites.map(sprite => (
                <div key={sprite.id} className={`sprite-item-enhanced ${selectedSprite === sprite.id ? 'selected' : ''}`} onClick={() => handleSelectSprite(sprite.id)}>
                  <div className="sprite-thumb">
                    {sprite.costumes[0]?.dataUrl ? <img src={sprite.costumes[0].dataUrl} alt={sprite.name} /> : <div className="sprite-placeholder" />}
                  </div>
                  <span className="sprite-label">{sprite.name}</span>
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

          {/* Block Category Panel */}
          <div className="category-panel-enhanced">
            <div className="panel-header">
              <BlockOutlined />
              <span>积木分类</span>
            </div>
            <div className="category-search">
              <Input prefix={<span style={{opacity: 0.5}}>🔍</span>} placeholder="搜索积木..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} size="small" allowClear />
            </div>
            <div className="category-list">
              {filteredCategories.map(cat => (
                <Tooltip key={cat.id} title={cat.description} placement="right">
                  <div
                    className={`category-item ${selectedToolboxCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedToolboxCategory(cat.id)}
                    style={{ '--cat-color': cat.colour }}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-dot" style={{ background: cat.colour }} />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Cloud Variables Panel */}
          <div className="cloud-panel-enhanced">
            <div className="panel-header">
              <CloudOutlined />
              <span>云变量</span>
              <span className={`sync-indicator ${cloudSyncStatus}`}>
                {cloudSyncStatus === 'synced' && <CheckCircleOutlined />}
                {cloudSyncStatus === 'syncing' && <LoadingOutlined spin />}
                {cloudSyncStatus === 'error' && <CloseCircleOutlined />}
              </span>
              <Button type="text" icon={<PlusOutlined />} size="small" onClick={() => setCloudVariablesModalVisible(true)} />
            </div>
            <div className="cloud-vars-list">
              {cloudVariables.length === 0 && <div className="empty-hint">暂无云变量</div>}
              {cloudVariables.map(cv => (
                <div key={cv.name} className="cloud-var-item">
                  <span className="var-name">{cv.name}</span>
                  <span className="var-value">{cv.value}</span>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCloudVariable(cv.name)} />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center - Blockly Workspace */}
        <main className="blockly-area">
          <div id="blocks-editor" className="blocks-editor-enhanced" />
        </main>

        {/* Right Sidebar - Stage */}
        <aside className="right-sidebar">
          <div className="stage-panel-enhanced">
            <div className="panel-header">
              <BgColorsOutlined />
              <span>舞台</span>
              <Tag color="blue">240x180</Tag>
            </div>
            <div className="stage-container">
              <canvas ref={stageRef} className="stage-canvas-enhanced" width={480} height={360} />
              <canvas ref={penRef} className="pen-canvas-enhanced" width={480} height={360} />
              {isRunning && <div className="running-indicator"><span className="pulse"></span>运行中</div>}
            </div>
            <div className="backdrop-section">
              <span className="section-label">背景</span>
              <div className="backdrop-grid">
                {projectData.stage.backdrops.map((backdrop, idx) => (
                  <Tooltip key={backdrop.id} title={backdrop.name}>
                    <div className={`backdrop-thumb ${projectData.stage.currentBackdrop === idx ? 'selected' : ''}`} onClick={() => handleSelectBackdrop(idx)}>
                      {backdrop.dataUrl ? <img src={backdrop.dataUrl} alt={backdrop.name} /> : <span>背景{idx + 1}</span>}
                    </div>
                  </Tooltip>
                ))}
                <Dragger showUploadList={false} beforeUpload={(file) => { handleAddBackdrop(file); return false; }}>
                  <div className="backdrop-add"><PlusOutlined /></div>
                </Dragger>
              </div>
            </div>
          </div>

          {/* Stage Info */}
          <div className="stage-info-panel">
            <div className="info-row">
              <span className="info-label">当前角色:</span>
              <span className="info-value">{selectedSpriteData?.name || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">造型:</span>
              <span className="info-value">{selectedSpriteData?.costumes?.length || 0} 个</span>
            </div>
            <div className="info-row">
              <span className="info-label">声音:</span>
              <span className="info-value">{selectedSpriteData?.sounds?.length || 0} 个</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Enhanced Console/Output Panel */}
      <div className={`console-panel-enhanced ${consoleCollapsed ? 'collapsed' : ''}`} style={{ height: consoleCollapsed ? 40 : consoleHeight }}>
        <div className="console-resize-handle" onMouseDown={() => setIsResizingConsole(true)} />
        <div className="console-header">
          <div className="console-tabs">
            <div className={`console-tab ${outputTab === 'output' ? 'active' : ''}`} onClick={() => setOutputTab('output')}>
              <ConsoleSqlOutlined /> 输出
              {outputConsole.filter(e => e.type === 'error').length > 0 && (
                <Tag color="red" className="error-badge">{outputConsole.filter(e => e.type === 'error').length}</Tag>
              )}
            </div>
            <div className={`console-tab ${outputTab === 'code' ? 'active' : ''}`} onClick={() => setOutputTab('code')}>
              <CodeOutlined /> 代码预览
            </div>
          </div>
          <div className="console-actions">
            <Radio.Group value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} size="small" className="lang-select">
              <Radio.Button value="scratch">Scratch</Radio.Button>
              <Radio.Button value="python">Python</Radio.Button>
              <Radio.Button value="cpp">C++</Radio.Button>
            </Radio.Group>
            {activeLanguage !== 'scratch' && (
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => {
                if (activeLanguage === 'python') { handleRunPython(getPythonCode()); }
                else if (activeLanguage === 'cpp') { handleRunCpp(getCppCode()); }
              }}>运行</Button>
            )}
            <Button size="small" icon={<CopyOutlined />} onClick={() => {
              const code = activeLanguage === 'python' ? getPythonCode() : getCppCode();
              navigator.clipboard.writeText(code);
              message.success('代码已复制');
            }}>复制</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={handleClearOutput}>清空</Button>
            <Button size="small" icon={consoleCollapsed ? <FullscreenOutlined /> : <ShrinkOutlined />} onClick={() => setConsoleCollapsed(!consoleCollapsed)} />
          </div>
        </div>

        <div className="console-body">
          {outputTab === 'output' ? (
            <div className="console-output" ref={consoleRef}>
              {outputConsole.length === 0 && <div className="console-empty">控制台输出将显示在这里...</div>}
              {outputConsole.map((entry, idx) => (
                <div key={idx} className={`console-entry ${entry.type}`}>
                  <span className="entry-icon">
                    {entry.type === 'error' && <WarningOutlined />}
                    {entry.type === 'warn' && <InfoCircleOutlined />}
                    {entry.type === 'info' && <InfoCircleOutlined />}
                    {entry.type === 'code' && <CodeOutlined />}
                    {entry.type === 'log' && <span style={{opacity: 0.3}}>{">"}</span>}
                  </span>
                  <span className="entry-content">{entry.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="code-preview-panel" ref={codePreviewRef}>
              <div className="code-with-lines">
                <div className="line-numbers">
                  {getLineNumbers(activeLanguage === 'python' ? getPythonCode() : getCppCode())}
                </div>
                <pre className="code-content" dangerouslySetInnerHTML={{ __html: highlightCode(activeLanguage === 'python' ? getPythonCode() : getCppCode(), activeLanguage) || '<span class="hl-comment">// 暂无代码</span>' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Tabs */}
      <footer className="ide-footer-enhanced">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
          <TabPane tab={<span><CodeOutlined /> 脚本</span>} key="scripts">
            <div className="tab-hint">在左侧选择角色，然后拖拽积木编写程序</div>
          </TabPane>
          <TabPane tab={<span>👔 造型</span>} key="costumes">
            {selectedSpriteData && (
              <div className="costumes-grid">
                <div className="costumes-header">
                  <span>造型列表 - {selectedSpriteData.name}</span>
                  <Dragger showUploadList={false} beforeUpload={(file) => { handleAddCostume(file); return false; }}>
                    <Button icon={<UploadOutlined />}>上传造型</Button>
                  </Dragger>
                </div>
                <div className="costumes-list">
                  {selectedSpriteData.costumes.map((costume, idx) => (
                    <div key={costume.id} className={`costume-item ${selectedSpriteData.currentCostume === idx ? 'selected' : ''}`} onClick={() => handleSelectCostume(costume.id)}>
                      <img src={costume.dataUrl} alt={costume.name} />
                      <span>{costume.name}</span>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeleteCostume(costume.id); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabPane>
          <TabPane tab={<span>🔊 声音</span>} key="sounds">
            {selectedSpriteData && (
              <div className="sounds-grid">
                <div className="sounds-header">
                  <span>声音列表 - {selectedSpriteData.name}</span>
                  <Dragger showUploadList={false} beforeUpload={(file) => { handleAddSound(file); return false; }}>
                    <Button icon={<UploadOutlined />}>上传声音</Button>
                  </Dragger>
                </div>
                <div className="sounds-list">
                  {selectedSpriteData.sounds.length === 0 && <Empty description="暂无声音" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
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
      </footer>

      {/* Modals */}
      <Modal title={editingSpriteName ? '重命名角色' : '添加角色'} open={spriteModalVisible} onCancel={() => { setSpriteModalVisible(false); setEditingSpriteName(''); }}
        footer={editingSpriteName ? (<Space><Button onClick={() => { setSpriteModalVisible(false); setEditingSpriteName(''); }}>取消</Button><Button type="primary" onClick={handleRenameSprite}>确定</Button></Space>) : (<Space><Button onClick={() => setSpriteModalVisible(false)}>取消</Button><Button type="primary" onClick={handleAddSprite}>添加</Button></Space>)}>
        <Input placeholder="角色名称" value={editingSpriteName} onChange={e => setEditingSpriteName(e.target.value)} />
      </Modal>

      <Modal title="打开项目" open={loadModalVisible} onCancel={() => setLoadModalVisible(false)} footer={null} width={600}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject} block>新建项目</Button>
          <List header={<div>云端项目</div>} dataSource={cloudProjects} renderItem={item => (
            <List.Item actions={[<Button type="text" icon={<EditOutlined />} onClick={() => handleLoadProject(item.id)}>打开</Button>, <Button type="text" icon={<CustomerServiceOutlined />} onClick={() => handleRemixProject(item.id)}>派生</Button>, <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteProject(item.id)}>删除</Button>]}>
              <List.Item.Meta title={item.name} description={`更新时间: ${new Date(item.updatedAt).toLocaleString()}`} />
            </List.Item>
          )} locale={{ emptyText: '暂无云端项目' }} />
        </Space>
      </Modal>

      <Modal title="保存项目" open={saveModalVisible} onCancel={() => setSaveModalVisible(false)} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div><label>项目名称:</label><Input value={projectName} onChange={e => setProjectName(e.target.value)} /></div>
          <Space><Button onClick={handleSaveLocal}>保存到本地</Button><Button type="primary" onClick={handleSaveToCloud}>保存到云端</Button></Space>
        </Space>
      </Modal>

      <Modal title="询问" open={askVisible} onCancel={() => { setAskVisible(false); if (runtimeState.interpreter) runtimeState.interpreter.resolveAsk(''); }} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ fontSize: 16, padding: '8px 0' }}>{askQuestion}</div>
          <Input placeholder="请输入答案..." value={askAnswer} onChange={e => setAskAnswer(e.target.value)} onPressEnter={handleAskSubmit} />
          <Button type="primary" onClick={handleAskSubmit}>确定</Button>
        </Space>
      </Modal>

      <Modal title="创建云变量" open={cloudVariablesModalVisible} onCancel={() => { setCloudVariablesModalVisible(false); setNewCloudVariableName(''); }} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div><div style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: 12 }}>云变量名称（必须以 _cloud_ 开头）</div>
            <Input placeholder="_cloud_score" value={newCloudVariableName} onChange={e => setNewCloudVariableName(e.target.value)} onPressEnter={handleAddCloudVariable} /></div>
          <Space><Button onClick={() => { setCloudVariablesModalVisible(false); setNewCloudVariableName(''); }}>取消</Button><Button type="primary" onClick={handleAddCloudVariable}>创建</Button></Space>
        </Space>
      </Modal>

      <Modal title="输入" open={inputVisible} onCancel={() => { setInputVisible(false); if (inputResolve) { inputResolve(''); setInputResolve(null); } }} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ fontSize: 16, padding: '8px 0' }}>{inputPrompt || '请输入:'}</div>
          <Input placeholder="请输入..." value={inputPrompt} onChange={e => setInputPrompt(e.target.value)} onPressEnter={handleInputSubmit} />
          <Button type="primary" onClick={handleInputSubmit}>确定</Button>
        </Space>
      </Modal>
    </div>
  );
}
