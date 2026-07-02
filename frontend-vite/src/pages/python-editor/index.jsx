import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Space, Tabs, message, Modal, Input, Dropdown, Tooltip, Select, Tag, Popover, List } from 'antd';
import {
  PlayCircleOutlined, StopOutlined, SaveOutlined, CloudOutlined,
  FolderOpenOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  CopyOutlined, ClearOutlined, FormatPainterOutlined, DownloadOutlined,
  BgColorsOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import {
  createCodeExecution, getCodeExecutions, getCodeExecution,
  executeCode, deleteCodeExecution, getCodeExecutionStats,
  getProjects, createProject, updateProject, deleteProject
} from '../../services/api';
import { safeGetJSON } from '../../utils/storage';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, HighlightStyle, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';

const { TextArea } = Input;

// ============================================================================
// Enhanced Python Function Definitions
// ============================================================================

// Comprehensive list of supported Python built-in functions
export const pythonFunctions = {
  // Core builtins
  print: 'print(*objects, sep=" ", end="\\n", file=sys.stdout, flush=False)',
  len: 'len(s) -> integer',
  range: 'range(stop) / range(start, stop[, step])',
  str: 'str(object="")',
  int: 'int(x=0)',
  float: 'float(x=0)',
  bool: 'bool([x])',
  list: 'list([iterable])',
  dict: 'dict(**kwargs) / dict(mapping, **kwargs)',
  set: 'set([iterable])',
  tuple: 'tuple([iterable])',
  type: 'type(object)',
  isinstance: 'isinstance(object, classinfo)',
  issubclass: 'issubclass(class, classinfo)',

  // Math functions
  abs: 'abs(x)',
  min: 'min(arg1, arg2, *args, key=None)',
  max: 'max(arg1, arg2, *args, key=None)',
  sum: 'sum(iterable, /, start=0)',
  round: 'round(number[, ndigits])',
  pow: 'pow(base, exp[, mod])',
  divmod: 'divmod(a, b)',
  hex: 'hex(number)',
  oct: 'oct(number)',
  bin: 'bin(number)',
  chr: 'chr(i)',
  ord: 'ord(c)',

  // Iterator functions
  sorted: 'sorted(iterable, *, key=None, reverse=False)',
  reversed: 'reversed(sequence)',
  enumerate: 'enumerate(iterable, start=0)',
  zip: 'zip(*iterables, strict=False)',
  map: 'map(function, iterable, ...)',
  filter: 'filter(function, iterable)',
  any: 'any(iterable)',
  all: 'all(iterable)',
  next: 'next(iterator[, default])',
  iter: 'iter(object[, sentinel])',

  // String/Bytes functions
  repr: 'repr(obj)',
  ascii: 'ascii(obj)',
  format: 'format(value[, format_spec])',
  eval: 'eval(expression, globals=None, locals=None)',
  exec: 'exec(code[, globals, locals])',
  compile: 'compile(source, filename, mode)',

  // Object inspection
  dir: 'dir([object])',
  vars: 'vars([object])',
  help: 'help([object])',
  id: 'id(obj)',
  hash: 'hash(obj)',
  callable: 'callable(obj)',
  getattr: 'getattr(obj, name[, default])',
  setattr: 'setattr(obj, name, value)',
  delattr: 'delattr(obj, name)',
  hasattr: 'hasattr(obj, name)',

  // Input/Output
  input: 'input([prompt])',
  open: 'open(file, mode="r", ...)',

  // Type creation
  complex: 'complex([real[, imag]])',
  bytes: 'bytes(source)',
  bytearray: 'bytearray(source)',
  memoryview: 'memoryview(obj)',
  frozenset: 'frozenset([iterable])',

  // Other
  quit: 'quit()',
  exit: 'exit()',
};

// Libraries supported with full implementations
export const librariesSupported = {
  math: {
    description: 'Mathematical functions',
    functions: ['pi', 'e', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sqrt', 'pow', 'abs', 'floor', 'ceil', 'log', 'log10', 'log2', 'exp', 'degrees', 'radians', 'hypot', 'fabs', 'fmod', 'trunc', 'isfinite', 'isinf', 'isnan', 'factorial', 'gcd', 'lcm', 'copysign', 'frexp', 'ldexp', 'modf', 'ceil', 'fsum'],
  },
  random: {
    description: 'Generate pseudo-random numbers',
    functions: ['random', 'randint', 'randrange', 'choice', 'shuffle', 'sample', 'uniform', 'triangular', 'betavariate', 'expovariate', 'gammavariate', 'gauss', 'lognormvariate', 'normalvariate', 'vonmisesvariate', 'weibullvariate', 'seed', 'getstate', 'setstate'],
  },
  datetime: {
    description: 'Date and time manipulation',
    classes: ['date', 'time', 'datetime', 'timedelta'],
    functions: ['now', 'utcnow', 'today', 'fromtimestamp', 'strftime', 'strptime', 'weekday', 'isoweekday', 'isoformat', 'ctime'],
  },
  json: {
    description: 'JSON encoder and decoder',
    functions: ['dump', 'dumps', 'load', 'loads', 'JSONDecoder', 'JSONEncoder'],
  },
  turtle: {
    description: 'Turtle graphics for drawing',
    functions: ['forward', 'backward', 'right', 'left', 'goto', 'setpos', 'setposition', 'setheading', 'pensize', 'penup', 'pendown', 'speed', 'color', 'begin_fill', 'end_fill', 'circle', 'dot', 'undo', 'clear', 'reset', 'showturtle', 'hideturtle', 'isvisible', 'shape', 'write', 'bgcolor', 'bye', 'exitonclick'],
  },
  re: {
    description: 'Regular expression operations',
    functions: ['match', 'search', 'sub', 'subn', 'split', 'findall', 'finditer', 'compile', 'purge', 'escape'],
  },
  string: {
    description: 'String operations',
    constants: ['ascii_letters', 'ascii_lowercase', 'ascii_uppercase', 'digits', 'hexdigits', 'octdigits', 'punctuation', 'printable', 'whitespace'],
    functions: ['capwords'],
  },
  collections: {
    description: 'Specialized container datatypes',
    classes: ['namedtuple', 'deque', 'Counter', 'OrderedDict', 'defaultdict', 'ChainMap'],
  },
  itertools: {
    description: 'Iterator building functions',
    functions: ['count', 'cycle', 'repeat', 'accumulate', 'chain', 'compress', 'dropwhile', 'filterfalse', 'groupby', 'islice', 'starmap', 'takewhile', 'tee', 'zip_longest', 'product', 'permutations', 'combinations', 'combinations_with_replacement'],
  },
  functools: {
    description: 'Functions for function manipulation',
    functions: ['reduce', 'partial', 'wraps', 'update_wrapper', 'lru_cache', 'cache', 'cached_property'],
  },
  os: {
    description: 'Operating system interface',
    functions: ['path', 'getcwd', 'chdir', 'listdir', 'mkdir', 'makedirs', 'remove', 'rename'],
  },
  sys: {
    description: 'System-specific parameters and functions',
    variables: ['argv', 'path', 'version', 'version_info', 'platform', 'maxsize'],
    functions: ['exit', 'getrecursionlimit', 'setrecursionlimit'],
  },
};

// Editor features
export const editorFeatures = {
  autoIndent: true,
  lineNumbers: true,
  bracketMatching: true,
  autoClosingBrackets: true,
  autoClosingQuotes: true,
  indentation: '    ',
  syntaxHighlighting: {
    keywords: ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None'],
    builtins: ['print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'type', 'isinstance', 'abs', 'min', 'max', 'sum', 'round', 'pow', 'divmod', 'hex', 'oct', 'bin', 'chr', 'ord', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'input', 'open', 'repr', 'eval', 'exec', 'format', 'dir', 'vars', 'id', 'hash', 'callable', 'getattr', 'setattr', 'delattr', 'hasattr'],
    strings: true,
    comments: true,
    numbers: true,
    functions: true,
    classes: true,
    decorators: true,
  },
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    keyword: '#569cd6',
    builtin: '#4ec9b0',
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    function: '#dcdcaa',
    class: '#4ec9b0',
    decorator: '#d7ba7d',
    operator: '#d4d4d4',
    variable: '#9cdcfe',
    error: '#f44747',
  },
  settings: {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSizeOptions: [12, 14, 16, 18, 20],
    defaultFontSize: 14,
    tabSize: 4,
    wordWrap: false,
    lineHeight: 1.6,
    minimap: false,
    folding: true,
    autoSave: false,
  },
  execution: {
    timeout: 30000,
    maxOutputLines: 1000,
    supportInput: true,
    supportAsync: true,
  },
};

// ============================================================================
// CodeMirror Python Editor with Syntax Highlighting
// ============================================================================

// Custom Python highlight style matching VS Code Dark+ theme
// Some tags may not exist in older @lezer/highlight versions, filter them out
const allTagSpecs = [
  { tag: tags.keyword, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.operatorKeyword, color: '#569cd6' },
  { tag: tags.definitionKeyword, color: '#569cd6' },
  { tag: tags.moduleKeyword, color: '#569cd6' },
  { tag: tags.atom, color: '#569cd6' },
  { tag: tags.bool, color: '#569cd6' },
  { tag: tags.null, color: '#569cd6' },
  { tag: tags.builtin, color: '#4ec9b0' },
  { tag: tags.typeName, color: '#4ec9b0' },
  { tag: tags.className, color: '#4ec9b0' },
  { tag: tags.string, color: '#ce9178' },
  { tag: tags.special && tags.special(tags.string), color: '#ce9178' },
  { tag: tags.regexp, color: '#ce9178' },
  { tag: tags.number, color: '#b5cea8' },
  { tag: tags.comment, color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#9cdcfe' },
  { tag: tags.propertyName, color: '#9cdcfe' },
  { tag: tags.operator, color: '#d4d4d4' },
  { tag: tags.punctuation, color: '#d4d4d4' },
  { tag: tags.meta, color: '#d4d4d4' },
  { tag: tags.namespace, color: '#4ec9b0' },
].filter(function(s) { return s.tag != null; });

let pythonHighlightStyle;
try {
  pythonHighlightStyle = HighlightStyle.define(allTagSpecs);
} catch(e) {
  console.warn('HighlightStyle.define failed, using default:', e.message);
  pythonHighlightStyle = defaultHighlightStyle;
}

// Dark theme for CodeMirror
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    caretColor: '#fff',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#fff',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: '#262626',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#262626',
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    color: '#858585',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#37373d',
    border: 'none',
    color: '#aaa',
  },
  '.cm-tooltip': {
    backgroundColor: '#252526',
    border: '1px solid #444',
    borderRadius: '4px',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#37373d',
    },
  },
  '.cm-selectionBackground': {
    backgroundColor: '#264f78 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#264f78 !important',
  },
  '.cm-searchMatch': {
    backgroundColor: '#515c6a',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#613214',
  },
  '.cm-panels': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
  },
  '.cm-panel.cm-search': {
    padding: '8px',
    borderTop: '1px solid #444',
  },
  '.cm-panel.cm-search input': {
    backgroundColor: '#3c3c3c',
    border: '1px solid #444',
    color: '#d4d4d4',
    borderRadius: '2px',
    padding: '2px 6px',
  },
  '.cm-panel.cm-search button': {
    backgroundColor: '#3c3c3c',
    border: '1px solid #444',
    color: '#d4d4d4',
    borderRadius: '2px',
    padding: '2px 8px',
    marginLeft: '4px',
  },
  '.cm-panel.cm-search label': {
    color: '#d4d4d4',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
}, { dark: true });

// Light theme for CodeMirror
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#000000',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    caretColor: '#000',
    padding: '12px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#000',
    borderLeftWidth: '2px',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0f0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f0f0f0',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    color: '#6e6e6e',
    border: 'none',
    paddingRight: '8px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#e0e0e0',
    border: 'none',
    color: '#666',
  },
  '.cm-tooltip': {
    backgroundColor: '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    color: '#000',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul > li[aria-selected]': {
      backgroundColor: '#e8e8e8',
    },
  },
  '.cm-selectionBackground': {
    backgroundColor: '#add6ff !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#add6ff !important',
  },
  '.cm-searchMatch': {
    backgroundColor: '#f5f5dc',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: '#ff9632',
  },
  '.cm-panels': {
    backgroundColor: '#ffffff',
    color: '#000',
  },
  '.cm-panel.cm-search': {
    padding: '8px',
    borderTop: '1px solid #ccc',
  },
  '.cm-panel.cm-search input': {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    color: '#000',
    borderRadius: '2px',
    padding: '2px 6px',
  },
  '.cm-panel.cm-search button': {
    backgroundColor: '#e0e0e0',
    border: '1px solid #ccc',
    color: '#000',
    borderRadius: '2px',
    padding: '2px 8px',
    marginLeft: '4px',
  },
  '.cm-panel.cm-search label': {
    color: '#000',
  },
  '.cm-line': {
    padding: '0 12px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
  },
}, { dark: false });

// Python-specific autocomplete source for CodeMirror
const pythonCompletionSource = (context) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const prefix = word.text.toLowerCase();
  const options = [];

  // Python keywords
  for (const kw of autoCompletionItems.keywords) {
    if (kw.toLowerCase().startsWith(prefix)) {
      options.push({ label: kw, type: 'keyword', boost: 2 });
    }
  }

  // Python builtins
  for (const b of autoCompletionItems.builtins) {
    if (b.toLowerCase().startsWith(prefix)) {
      options.push({ label: b, type: 'function', detail: pythonFunctions[b] || `${b}()`, boost: 1 });
    }
  }

  // Check if we're in an import context for library name completions
  const line = context.state.doc.lineAt(word.from);
  const lineText = line.text.trimStart();
  const importLibMatch = lineText.match(/^(?:import|from)\s+(\w*)$/);
  if (importLibMatch) {
    for (const lib of Object.keys(autoCompletionItems.libraries)) {
      if (lib.toLowerCase().startsWith(prefix)) {
        options.push({ label: lib, type: 'module', detail: librariesSupported[lib]?.description || '', boost: 3 });
      }
    }
  }

  // Check if we're in from X import Y context for member completions
  const fromImportMatch = lineText.match(/^from\s+(\w+)\s+import\s+[\w,\s]*(\w*)$/);
  if (fromImportMatch) {
    const libName = fromImportMatch[1];
    const libFunctions = autoCompletionItems.libraries[libName];
    if (libFunctions) {
      for (const fn of libFunctions) {
        if (fn.toLowerCase().startsWith(prefix)) {
          options.push({ label: fn, type: 'function', detail: `${libName}.${fn}()`, boost: 3 });
        }
      }
    }
  }

  // Deduplicate by label
  const seen = new Set();
  const unique = options.filter((o) => {
    if (seen.has(o.label)) return false;
    seen.add(o.label);
    return true;
  });

  return unique.length > 0 ? { from: word.from, options: unique, filter: false } : null;
};

// CodeMirror Editor Component
const CodeMirrorEditor = ({ value, onChange, fontSize = 14, onRun, theme = 'dark' }) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        onChange?.(newValue);
      }
    });

    const runKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          onRun?.();
          return true;
        },
      },
      {
        key: 'Shift-Enter',
        run: () => {
          onRun?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        history(),
        python(),
        syntaxHighlighting(pythonHighlightStyle),
        theme === 'dark' ? darkTheme : lightTheme,
        autocompletion({ override: [pythonCompletionSource] }),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        runKeymap,
        updateListener,
        EditorView.lineWrapping,
        EditorState.tabSize.of(4),
        EditorView.theme({
          '.cm-content': {
            fontSize: `${fontSize}px`,
            lineHeight: '1.6',
          },
          '.cm-gutters': {
            fontSize: `${fontSize - 2}px`,
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    editorRef.current = containerRef.current;

    return () => {
      view.destroy();
    };
  }, []); // Only run once on mount

  // Sync external value changes
  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    />
  );
};

// ============================================================================
// Syntax Highlighter - Pure CSS/JS approach for TextArea overlay
// ============================================================================
const SyntaxHighlighter = ({ code, fontSize = 14, theme }) => {
  const highlightPython = useCallback((code) => {
    if (!code) return [];

    const tokens = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      let remaining = line;
      let pos = 0;

      while (remaining.length > 0) {
        let matched = false;

        // Check for comment
        const commentMatch = remaining.match(/^(#.*)/);
        if (commentMatch) {
          tokens.push({ type: 'comment', value: commentMatch[1], line: lineIndex, col: pos });
          pos += commentMatch[1].length;
          remaining = '';
          matched = true;
          continue;
        }

        // Check for triple quotes
        const tripleMatch = remaining.match(/^("""[\s\S]*?"""|'''[\s\S]*?''')/);
        if (tripleMatch) {
          tokens.push({ type: 'string', value: tripleMatch[1], line: lineIndex, col: pos });
          pos += tripleMatch[1].length;
          remaining = remaining.slice(tripleMatch[1].length);
          matched = true;
          continue;
        }

        // Check for string
        const stringMatch = remaining.match(/^("[^"]*"|'[^']*')/);
        if (stringMatch) {
          tokens.push({ type: 'string', value: stringMatch[1], line: lineIndex, col: pos });
          pos += stringMatch[1].length;
          remaining = remaining.slice(stringMatch[1].length);
          matched = true;
          continue;
        }

        // Check for decorator
        const decoratorMatch = remaining.match(/^(@\w+)/);
        if (decoratorMatch) {
          tokens.push({ type: 'decorator', value: decoratorMatch[1], line: lineIndex, col: pos });
          pos += decoratorMatch[1].length;
          remaining = remaining.slice(decoratorMatch[1].length);
          matched = true;
          continue;
        }

        // Check for keyword
        const keywordMatch = remaining.match(/^(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|True|False|None)\b/);
        if (keywordMatch) {
          tokens.push({ type: 'keyword', value: keywordMatch[1], line: lineIndex, col: pos });
          pos += keywordMatch[1].length;
          remaining = remaining.slice(keywordMatch[1].length);
          matched = true;
          continue;
        }

        // Check for builtin function
        const builtinMatch = remaining.match(/^(print|len|range|str|int|float|bool|list|dict|set|tuple|type|isinstance|abs|min|max|sum|round|pow|divmod|hex|oct|bin|chr|ord|sorted|reversed|enumerate|zip|map|filter|any|all|input|open|repr|eval|exec|format|dir|vars|id|hash|callable|getattr|setattr|delattr|hasattr|issubclass)\b/);
        if (builtinMatch) {
          tokens.push({ type: 'builtin', value: builtinMatch[1], line: lineIndex, col: pos });
          pos += builtinMatch[1].length;
          remaining = remaining.slice(builtinMatch[1].length);
          matched = true;
          continue;
        }

        // Check for number
        const numberMatch = remaining.match(/^(\d+\.?\d*|\.\d+)/);
        if (numberMatch) {
          tokens.push({ type: 'number', value: numberMatch[1], line: lineIndex, col: pos });
          pos += numberMatch[1].length;
          remaining = remaining.slice(numberMatch[1].length);
          matched = true;
          continue;
        }

        // Check for function definition
        const funcMatch = remaining.match(/^(def\s+\w+)/);
        if (funcMatch) {
          tokens.push({ type: 'function', value: funcMatch[1], line: lineIndex, col: pos });
          pos += funcMatch[1].length;
          remaining = remaining.slice(funcMatch[1].length);
          matched = true;
          continue;
        }

        // Check for class definition
        const classMatch = remaining.match(/^(class\s+\w+)/);
        if (classMatch) {
          tokens.push({ type: 'class', value: classMatch[1], line: lineIndex, col: pos });
          pos += classMatch[1].length;
          remaining = remaining.slice(classMatch[1].length);
          matched = true;
          continue;
        }

        // Check for operator
        const operatorMatch = remaining.match(/^([+\-*/%=<>!&|^~:,.\[\](){}]+)/);
        if (operatorMatch) {
          tokens.push({ type: 'operator', value: operatorMatch[1], line: lineIndex, col: pos });
          pos += operatorMatch[1].length;
          remaining = remaining.slice(operatorMatch[1].length);
          matched = true;
          continue;
        }

        // Check for identifier
        const identMatch = remaining.match(/^([a-zA-Z_]\w*)/);
        if (identMatch) {
          tokens.push({ type: 'variable', value: identMatch[1], line: lineIndex, col: pos });
          pos += identMatch[1].length;
          remaining = remaining.slice(identMatch[1].length);
          matched = true;
          continue;
        }

        // Whitespace
        const wsMatch = remaining.match(/^(\s+)/);
        if (wsMatch) {
          tokens.push({ type: 'whitespace', value: wsMatch[1], line: lineIndex, col: pos });
          pos += wsMatch[1].length;
          remaining = remaining.slice(wsMatch[1].length);
          matched = true;
          continue;
        }

        // Any other character
        tokens.push({ type: 'text', value: remaining[0], line: lineIndex, col: pos });
        pos++;
        remaining = remaining.slice(1);
      }
    });

    return tokens;
  }, []);

  const tokens = highlightPython(code);
  const defaultTheme = theme || editorFeatures.theme;

  const getTokenStyle = (type) => {
    const colors = {
      keyword: { color: defaultTheme.keyword },
      builtin: { color: defaultTheme.builtin },
      string: { color: defaultTheme.string },
      number: { color: defaultTheme.number },
      comment: { color: defaultTheme.comment, fontStyle: 'italic' },
      function: { color: defaultTheme.function },
      class: { color: defaultTheme.class },
      decorator: { color: defaultTheme.decorator },
      operator: { color: defaultTheme.operator },
      variable: { color: defaultTheme.variable },
      whitespace: {},
      text: { color: defaultTheme.foreground },
    };
    return colors[type] || {};
  };

  return (
    <div style={{
      fontFamily: editorFeatures.settings.fontFamily,
      fontSize,
      lineHeight: editorFeatures.settings.lineHeight,
      background: defaultTheme.background,
      color: defaultTheme.foreground,
      padding: 12,
      margin: 0,
      whiteSpace: 'pre-wrap',
      overflow: 'auto',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    }}>
      {tokens.map((token, idx) => (
        <span key={idx} style={getTokenStyle(token.type)}>
          {token.value}
        </span>
      ))}
    </div>
  );
};

// ============================================================================
// Auto-completion Provider
// ============================================================================
const autoCompletionItems = {
  keywords: ['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None'],
  builtins: ['print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'type', 'isinstance', 'abs', 'min', 'max', 'sum', 'round', 'pow', 'divmod', 'hex', 'oct', 'bin', 'chr', 'ord', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'input', 'open', 'repr', 'eval', 'exec', 'format', 'dir', 'vars', 'id', 'hash', 'callable', 'getattr', 'setattr', 'delattr', 'hasattr', 'issubclass', 'super', 'staticmethod', 'classmethod', 'property', 'slice', 'property'],
  libraries: {
    math: ['pi', 'e', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sqrt', 'pow', 'abs', 'floor', 'ceil', 'log', 'log10', 'log2', 'exp', 'degrees', 'radians', 'hypot', 'fabs', 'fmod', 'trunc', 'isfinite', 'isinf', 'isnan', 'factorial', 'gcd', 'lcm'],
    random: ['random', 'randint', 'randrange', 'choice', 'shuffle', 'sample', 'uniform', 'triangular', 'gauss', 'seed', 'getstate', 'setstate'],
    datetime: ['date', 'datetime', 'time', 'timedelta', 'now', 'utcnow', 'today', 'fromtimestamp', 'strftime', 'strptime'],
    json: ['dumps', 'loads', 'dump', 'load'],
    turtle: ['forward', 'backward', 'right', 'left', 'goto', 'penup', 'pendown', 'pensize', 'speed', 'color', 'circle', 'dot', 'write', 'clear', 'reset', 'begin_fill', 'end_fill'],
    re: ['match', 'search', 'sub', 'split', 'findall', 'compile'],
    string: ['ascii_letters', 'ascii_lowercase', 'ascii_uppercase', 'digits', 'hexdigits', 'punctuation', 'capwords'],
    collections: ['Counter', 'deque', 'namedtuple', 'OrderedDict', 'defaultdict'],
    itertools: ['count', 'cycle', 'repeat', 'accumulate', 'chain', 'islice', 'takewhile', 'dropwhile', 'product', 'permutations', 'combinations'],
    functools: ['reduce', 'partial', 'lru_cache'],
    os: ['getcwd', 'listdir', 'mkdir', 'path'],
    sys: ['argv', 'path', 'version', 'exit'],
  }
};

const getAutoCompletions = (text, cursorPos) => {
  const textBeforeCursor = text.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const currentLine = lines[lines.length - 1];

  // Check for import statements
  const importMatch = currentLine.match(/^(\s*)import\s+(\w*)$/);
  if (importMatch) {
    const libPrefix = importMatch[2];
    return Object.keys(autoCompletionItems.libraries)
      .filter(lib => lib.startsWith(libPrefix))
      .map(lib => ({ text: lib, display: lib, type: 'library', description: librariesSupported[lib]?.description || '' }));
  }

  // Check for from...import statements
  const fromImportMatch = currentLine.match(/^(\s*)from\s+(\w+)\s+import\s+(\w*)$/);
  if (fromImportMatch) {
    const libName = fromImportMatch[2];
    const prefix = fromImportMatch[3];
    const libFunctions = autoCompletionItems.libraries[libName] || [];
    return libFunctions
      .filter(fn => fn.startsWith(prefix))
      .map(fn => ({ text: fn, display: fn, type: 'function', description: `${libName}.${fn}()` }));
  }

  // Check for method access (e.g., something.)
  const methodMatch = currentLine.match(/^.*\.(\w*)$/);
  if (methodMatch) {
    const prefix = methodMatch[1];
    const commonMethods = ['append', 'extend', 'insert', 'remove', 'pop', 'clear', 'index', 'count', 'sort', 'reverse', 'keys', 'values', 'items', 'get', 'setdefault', 'update', 'join', 'split', 'strip', 'replace', 'format', 'upper', 'lower', 'title', 'capitalize'];
    return commonMethods
      .filter(m => m.startsWith(prefix))
      .map(m => ({ text: m, display: m, type: 'method' }));
  }

  // Check for simple identifier completion
  const identMatch = currentLine.match(/^(\s*)(\w*)$/);
  if (identMatch) {
    const prefix = identMatch[2];
    if (prefix.length > 0) {
      const results = [];

      // Keywords
      autoCompletionItems.keywords
        .filter(kw => kw.startsWith(prefix))
        .forEach(kw => results.push({ text: kw, display: kw, type: 'keyword' }));

      // Builtins
      autoCompletionItems.builtins
        .filter(b => b.startsWith(prefix))
        .forEach(b => results.push({ text: b, display: b, type: 'builtin', description: pythonFunctions[b] || '' }));

      // Library names
      Object.keys(autoCompletionItems.libraries)
        .filter(lib => lib.startsWith(prefix))
        .forEach(lib => results.push({ text: `import ${lib}`, display: `import ${lib}`, type: 'import' }));

      return results.slice(0, 15);
    }
  }

  return [];
};

// ============================================================================
// Turtle Graphics Canvas Component
// ============================================================================
const TurtleCanvas = ({ width = 400, height = 400 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
  }, [width, height]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #444',
          borderRadius: 4,
          background: '#fff'
        }}
      />
    </div>
  );
};

// ============================================================================
// Turtle Graphics Engine
// ============================================================================
class TurtleGraphics {
  constructor(canvas, onUpdate) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.onUpdate = onUpdate;

    // Turtle state
    this.x = (canvas?.width ?? 400) / 2;
    this.y = (canvas?.height ?? 400) / 2;
    this.heading = 0; // 0 = east (right), 90 = north (up)
    this.penDown = true;
    this.penColor = '#000000';
    this.penSize = 1;
    this.speed = 1;
    this.pendown = true;
    this.speed_val = 3;

    // Path for filling
    this._fillPath = [];
    this._isFilling = false;
    this._fillColor = '';

    // Visibility
    this._visible = true;

    // History for undo
    this._history = [];

    this.reset();
  }

  reset() {
    this.x = (this.canvas?.width ?? 400) / 2;
    this.y = (this.canvas?.height ?? 400) / 2;
    this.heading = 0;
    this.penDown = true;
    this.penColor = '#000000';
    this.penSize = 1;
    this._fillPath = [];
    this._isFilling = false;
    this._visible = true;
    this.clear();
  }

  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
    }
    this._history = [];
    this._fillPath = [];
    this._redraw();
  }

  drawGrid() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  _drawTurtle() {
    if (!this._visible || !this.ctx) return;
    const ctx = this.ctx;
    const size = 10;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.heading - 90) * Math.PI / 180);

    ctx.fillStyle = this.penColor;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, size * 0.7);
    ctx.lineTo(0, size * 0.3);
    ctx.lineTo(-size * 0.7, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  _redraw() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();

    // Restore from history
    for (const cmd of this._history) {
      if (cmd.type === 'line' && cmd.penDown) {
        this.ctx.strokeStyle = cmd.color;
        this.ctx.lineWidth = cmd.size;
        this.ctx.beginPath();
        this.ctx.moveTo(cmd.x1, cmd.y1);
        this.ctx.lineTo(cmd.x2, cmd.y2);
        this.ctx.stroke();
      }
    }

    if (this._isFilling && this._fillPath.length > 2) {
      this.ctx.fillStyle = this._fillColor || this.penColor;
      this.ctx.beginPath();
      this.ctx.moveTo(this._fillPath[0].x, this._fillPath[0].y);
      for (let i = 1; i < this._fillPath.length; i++) {
        this.ctx.lineTo(this._fillPath[i].x, this._fillPath[i].y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }

    this._drawTurtle();
    this.onUpdate?.();
  }

  forward(distance) {
    const rad = (this.heading - 90) * Math.PI / 180;
    const newX = this.x + Math.cos(rad) * distance;
    const newY = this.y + Math.sin(rad) * distance;

    if (this.penDown && this.ctx) {
      this.ctx.strokeStyle = this.penColor;
      this.ctx.lineWidth = this.penSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      this.ctx.lineTo(newX, newY);
      this.ctx.stroke();

      this._history.push({
        type: 'line',
        x1: this.x, y1: this.y,
        x2: newX, y2: newY,
        color: this.penColor,
        size: this.penSize,
        penDown: this.penDown
      });
    }

    if (this._isFilling) {
      this._fillPath.push({ x: newX, y: newY });
    }

    this.x = newX;
    this.y = newY;
    this._redraw();
    return distance;
  }

  backward(distance) {
    return this.forward(-distance);
  }

  right(angle) {
    this.heading = (this.heading + angle) % 360;
    this._redraw();
    return angle;
  }

  left(angle) {
    this.heading = (this.heading - angle + 360) % 360;
    this._redraw();
    return angle;
  }

  goto(x, y) {
    if (this.penDown && this.ctx) {
      this.ctx.strokeStyle = this.penColor;
      this.ctx.lineWidth = this.penSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      this._history.push({
        type: 'line',
        x1: this.x, y1: this.y,
        x2: x, y2: y,
        color: this.penColor,
        size: this.penSize,
        penDown: this.penDown
      });
    }

    this.x = x;
    this.y = y;

    if (this._isFilling) {
      this._fillPath.push({ x, y });
    }

    this._redraw();
  }

  setposition(x, y) {
    this.goto(x, y);
  }

  setpos(x, y) {
    this.goto(x, y);
  }

  setheading(angle) {
    this.heading = angle % 360;
    this._redraw();
    return angle;
  }

  pensize(size) {
    this.penSize = size;
    return size;
  }

  penup() {
    this.penDown = false;
    this.pendown = false;
    return;
  }

  pendown() {
    this.penDown = true;
    this.pendown = true;
    return;
  }

  speed(s) {
    this.speed_val = s;
    this.speed = s;
    return s;
  }

  color(c) {
    if (typeof c === 'string') {
      this.penColor = c;
    } else if (Array.isArray(c)) {
      this.penColor = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
    }
    return this.penColor;
  }

  begin_fill() {
    this._isFilling = true;
    this._fillPath = [{ x: this.x, y: this.y }];
  }

  end_fill() {
    this._isFilling = false;
    if (this._fillPath.length > 2) {
      this.ctx.fillStyle = this.penColor;
      this.ctx.beginPath();
      this.ctx.moveTo(this._fillPath[0].x, this._fillPath[0].y);
      for (let i = 1; i < this._fillPath.length; i++) {
        this.ctx.lineTo(this._fillPath[i].x, this._fillPath[i].y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
    this._fillPath = [];
  }

  circle(radius, extent = 360) {
    if (!this.ctx) return;
    const steps = Math.max(Math.abs(Math.floor(extent / 10)), 1);
    const startX = this.x;
    const startY = this.y;

    for (let i = 0; i <= steps; i++) {
      const angle = (extent * i / steps) * Math.PI / 180;
      const dx = radius * Math.sin(angle);
      const dy = radius * (1 - Math.cos(angle));
      const newX = startX + dx * Math.cos((this.heading - 90) * Math.PI / 180) - dy * Math.sin((this.heading - 90) * Math.PI / 180);
      const newY = startY + dy * Math.cos((this.heading - 90) * Math.PI / 180) + dx * Math.sin((this.heading - 90) * Math.PI / 180);

      if (this.penDown) {
        this.ctx.strokeStyle = this.penColor;
        this.ctx.lineWidth = this.penSize;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(newX, newY);
        this.ctx.stroke();

        this._history.push({
          type: 'line',
          x1: this.x, y1: this.y,
          x2: newX, y2: newY,
          color: this.penColor,
          size: this.penSize,
          penDown: this.penDown
        });
      }

      this.x = newX;
      this.y = newY;
    }

    if (extent === 360) {
      // Full circle, turn back
      if (this.penDown) {
        const newHeading = (this.heading + 360) % 360;
        this.heading = newHeading;
      }
    }

    this._redraw();
  }

  dot(size, color) {
    if (!this.ctx) return;
    this.ctx.fillStyle = color || this.penColor;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, size || 4, 0, 2 * Math.PI);
    this.ctx.fill();
    this._redraw();
  }

  undo() {
    if (this._history.length > 0) {
      this._history.pop();
      this._redraw();
    }
  }

  showturtle() {
    this._visible = true;
    this._redraw();
  }

  hideturtle() {
    this._visible = false;
    this._redraw();
  }

  isvisible() {
    return this._visible;
  }

  shape(name) {
    // Basic turtle shapes - just store for reference
    return name;
  }

  write(text, font = null, align = 'left') {
    if (!this.ctx) return;
    this.ctx.fillStyle = this.penColor;
    this.ctx.font = font || '12px Consolas';
    this.ctx.textAlign = align;
    this.ctx.fillText(String(text), this.x, this.y);
    this._redraw();
  }

  bgcolor(color) {
    if (this.canvas) {
      this.canvas.style.background = color;
    }
  }

  bye() {
    this.reset();
  }

  exitonclick() {
    // No-op in non-blocking mode
  }
}

// Default Python code template
const DEFAULT_CODE = `# Python 编辑器
# 在这里编写你的 Python 代码

print("Hello, World!")

# 尝试一些基本操作
numbers = [1, 2, 3, 4, 5]
print("列表:", numbers)
print("总和:", sum(numbers))
print("最大值:", max(numbers))
print("最小值:", min(numbers))

# 使用 random 模块
import random
print("随机数:", random.randint(1, 100))

# 使用 datetime 模块
import datetime
print("当前时间:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

# 使用 json 模块
import json
data = {"name": "Alice", "age": 25}
print("JSON:", json.dumps(data))
`;

// ============================================================================
// Code Executor - Enhanced Python execution engine
// ============================================================================
class PythonCodeExecutor {
  constructor(onOutput, onError, onInput) {
    this.onOutput = onOutput;
    this.onError = onError;
    this.onInput = onInput;
    this.output = [];
    this.running = false;
    this.turtle = null;
    this.canvas = null;
    this._inputResolve = null;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.turtle = new TurtleGraphics(canvas, () => {});
  }

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

  clear() {
    this.output = [];
    this.onOutput?.({ clear: true });
  }

  _formatValue(v) {
    if (v === null) return 'None';
    if (v === undefined) return 'None';
    if (typeof v === 'boolean') return v ? 'True' : 'False';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      return `[${v.map(x => this._formatValue(x)).join(', ')}]`;
    }
    if (typeof v === 'object') {
      if (v.constructor?.name === 'Object' || Object.getPrototypeOf(v) === Object.prototype) {
        const entries = Object.entries(v);
        return `{${entries.map(([k, val]) => `${this._formatValue(k)}: ${this._formatValue(val)}`).join(', ')}}`;
      }
      // For custom objects
      const entries = Object.entries(v);
      return `{${entries.map(([k, val]) => `${k}: ${this._formatValue(val)}`).join(', ')}}`;
    }
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return String(v);
      return Number.isInteger(v) ? String(v) : String(v);
    }
    return String(v);
  }

  async executePython(code) {
    if (this.running) {
      this.log('代码正在执行中，请等待完成', 'warn');
      return;
    }
    this.running = true;
    this.clear();
    this.log('=== Python 代码执行 ===');

    // ============================================================================
    // Enhanced Built-in Functions
    // ============================================================================
    const safeBuiltins = {
      print: (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
      input: async (prompt) => {
        return new Promise(resolve => {
          this._inputResolve = resolve;
          this.onInput?.(prompt || '', resolve);
        });
      },

      len: (x) => x == null ? 0 : (typeof x === 'string' || Array.isArray(x) ? x.length : typeof x === 'object' ? Object.keys(x).length : 0),
      str: (x) => x == null ? '' : String(x),
      int: (x, base) => {
        if (x == null) return 0;
        if (base !== undefined) return parseInt(String(x), base);
        const n = parseInt(String(x));
        if (isNaN(n)) throw new Error(`invalid literal for int(): '${x}'`);
        return n;
      },
      float: (x) => { if (x == null) return 0.0; const n = parseFloat(String(x)); if (isNaN(n)) throw new Error(`could not convert string to float: '${x}'`); return n; },
      bool: (x) => Boolean(x),
      list: (x) => { if (x == null) return []; if (Array.isArray(x)) return [...x]; if (typeof x === 'string') return x.split(''); return Array.from(x || []); },
      dict: (x) => x ? { ...x } : {},
      set: (x) => { if (x == null) return new Set(); if (Array.isArray(x)) return new Set(x); return new Set(x || []); },
      tuple: (x) => { if (x == null) return []; if (Array.isArray(x)) return [...x]; return Array.from(x || []); },
      frozenset: (x) => { if (x == null) return new Set(); if (Array.isArray(x)) return new Set(x); return new Set(x || []); },
      bytes: (x) => { if (typeof x === 'string') return new TextEncoder().encode(x); if (Array.isArray(x)) return new Uint8Array(x); return new Uint8Array(); },
      bytearray: (x) => { if (typeof x === 'string') return new TextEncoder().encode(x); if (Array.isArray(x)) return new Uint8Array(x); return new Uint8Array(); },
      complex: (a, b = 0) => ({ real: Number(a), imag: Number(b) }),
      type: (x) => { if (x === null) return 'NoneType'; if (Array.isArray(x)) return "class 'list'"; if (typeof x === 'object') return "class 'dict'"; return typeof x; },

      range: (...args) => {
        if (args.length === 0) return [];
        const start = args.length > 1 ? args[0] : 0;
        const end = args.length > 1 ? args[1] : args[0];
        const step = args.length > 2 ? args[2] : 1;
        if (step === 0) throw new Error('range() arg 3 must not be zero');
        const result = [];
        if (step > 0) {
          for (let i = start; i < end; i += step) result.push(i);
        } else {
          for (let i = start; i > end; i += step) result.push(i);
        }
        return result;
      },
      sorted: (arr, reverse = false, key) => {
        if (!arr || !Array.isArray(arr)) return [];
        let result = [...arr];
        if (key) {
          result.sort((a, b) => {
            const ka = key(a), kb = key(b);
            return ka < kb ? -1 : ka > kb ? 1 : 0;
          });
        } else {
          result.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
        }
        return reverse ? result.reverse() : result;
      },
      reversed: (arr) => { if (!arr || !Array.isArray(arr)) return []; return [...arr].reverse(); },
      enumerate: function* (arr, start = 0) { let i = start; for (const x of arr || []) { yield [i++, x]; } },
      zip: function* (...arrs) { const minLen = Math.min(...arrs.map(a => a?.length || 0)); for (let i = 0; i < minLen; i++) yield arrs.map(a => a[i]); },
      map: (fn, arr) => [...(arr || [])].map(fn),
      filter: (fn, arr) => [...(arr || [])].filter(fn),
      any: (arr) => arr && arr.some(x => Boolean(x)),
      all: (arr) => arr && arr.every(x => Boolean(x)),
      next: (it, defaultVal) => { const val = it?.next?.(); return val?.done ? defaultVal : val?.value; },
      iter: (obj) => { if (Array.isArray(obj)) return obj[Symbol.iterator](); return obj; },
      slice: (start, stop, step) => ({ start: start ?? 0, stop: stop, step: step ?? 1 }),

      abs: Math.abs,
      min: (...args) => { if (args.length === 0) return Infinity; if (args.length === 1 && Array.isArray(args[0])) return Math.min(...args[0]); return Math.min(...args); },
      max: (...args) => { if (args.length === 0) return -Infinity; if (args.length === 1 && Array.isArray(args[0])) return Math.max(...args[0]); return Math.max(...args); },
      sum: (arr) => { if (!arr || !Array.isArray(arr)) return 0; return arr.reduce((a, b) => a + (Number(b) || 0), 0); },
      round: (x, digits = 0) => { const factor = Math.pow(10, digits); return Math.round(x * factor) / factor; },
      pow: Math.pow,
      divmod: (a, b) => [Math.floor(a / b), a % b],

      chr: (n) => String.fromCharCode(n),
      ord: (c) => c.charCodeAt(0),
      hex: (n) => `0x${Math.abs(Math.floor(n)).toString(16)}`,
      oct: (n) => `0o${Math.abs(Math.floor(n)).toString(8)}`,
      bin: (n) => `0b${Math.abs(Math.floor(n)).toString(2)}`,

      repr: (x) => JSON.stringify(x),
      ascii: (x) => JSON.stringify(x).replace(/[-￿]/g, (m) => `\\u${m.charCodeAt(0).toString(16).padStart(4, '0')}`),
      format: (val, fmt) => {
        try {
          if (fmt) {
            const num = Number(val);
            if (fmt.endsWith('f')) return num.toFixed(parseInt(fmt.slice(0, -1)));
            if (fmt.includes('.')) {
              const [w, d] = fmt.split('.');
              return num.toFixed(parseInt(d || 0)).padStart(parseInt(w || 0), ' ');
            }
            return String(val);
          }
          return String(val);
        } catch { return String(val); }
      },

      isinstance: (x, t) => {
        if (typeof t === 'string') {
          if (t === 'int' || t === 'Int') return Number.isInteger(x);
          if (t === 'float' || t === 'Float') return typeof x === 'number' && !Number.isInteger(x);
          if (t === 'str' || t === 'Str') return typeof x === 'string';
          if (t === 'bool' || t === 'Bool') return typeof x === 'boolean';
          if (t === 'list' || t === 'List') return Array.isArray(x);
          if (t === 'dict' || t === 'Dict') return typeof x === 'object' && x !== null && !Array.isArray(x);
          if (t === 'tuple' || t === 'Tuple') return Array.isArray(x);
          if (t === 'set' || t === 'Set') return x instanceof Set;
          if (t === 'bytes' || t === 'Bytes') return x instanceof Uint8Array;
        }
        return false;
      },
      issubclass: (c1, c2) => false,
      hasattr: (obj, name) => obj && typeof obj === 'object' && name in obj,
      getattr: (obj, name, defaultVal) => obj && typeof obj === 'object' ? (obj[name] !== undefined ? obj[name] : defaultVal) : defaultVal,
      setattr: (obj, name, val) => { if (obj && typeof obj === 'object') obj[name] = val; },
      delattr: (obj, name) => { if (obj && typeof obj === 'object') delete obj[name]; },
      id: (x) => x ? (x._id || Math.random().toString(36).slice(2)) : undefined,
      hash: (x) => x ? (typeof x === 'number' ? x : x.toString().split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) : 0,
      callable: (x) => typeof x === 'function',

      dir: (obj) => obj ? Object.keys(obj) : [],
      vars: (obj) => obj || {},
      help: (obj) => this.log(obj ? String(obj) : 'Help on...'),
      exit: () => { throw new Error('Program terminated by exit()'); },
      quit: () => { throw new Error('Program terminated by quit()'); },
    };

    // ============================================================================
    // Math library
    // ============================================================================
    const mathNamespace = {
      pi: Math.PI, e: Math.E,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
      sqrt: Math.sqrt, pow: Math.pow, abs: Math.abs, floor: Math.floor,
      ceil: Math.ceil, log: Math.log, log10: Math.log10, log2: Math.log2,
      exp: Math.exp,
      degrees: (rad) => rad * 180 / Math.PI,
      radians: (deg) => deg * Math.PI / 180,
      hypot: (...args) => Math.sqrt(args.reduce((sum, n) => sum + n * n, 0)),
      fabs: Math.abs, fmod: (a, b) => a % b, trunc: Math.trunc,
      isfinite: Number.isFinite, isinf: Number.isInfinite, isnan: Number.isNaN,
      factorial: (n) => { if (n < 0) throw new Error('factorial() not defined for negative numbers'); if (n > 170) return Infinity; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
      gcd: (a, b) => { a = Math.abs(Math.floor(a)); b = Math.abs(Math.floor(b)); while (b) { const t = b; b = a % b; a = t; } return a; },
      lcm: (a, b) => Math.abs(a * b) / (a === 0 || b === 0 ? 1 : mathNamespace.gcd(a, b)),
      copysign: (a, b) => Math.abs(a) * (b >= 0 ? 1 : -1),
      frexp: (x) => { if (x === 0) return [0, 0]; const exp = Math.floor(Math.log2(Math.abs(x))); return [x / Math.pow(2, exp), exp]; },
      ldexp: (m, e) => m * Math.pow(2, e),
      modf: (x) => [x - Math.floor(x), Math.floor(x)],
      fsum: (arr) => arr.reduce((a, b) => a + b, 0),
    };

    // ============================================================================
    // Random library - Enhanced with seed support
    // ============================================================================
    let randomState = Math.random;
    const randomNamespace = {
      random: () => randomState(),
      randint: (a, b) => Math.floor(randomState() * (b - a + 1)) + a,
      randrange: (start, stop, step = 1) => {
        if (step === 0) throw new Error('randrange() arg 3 must not be zero');
        const arr = [];
        for (let i = start; i < stop; i += step) arr.push(i);
        return arr[Math.floor(randomState() * arr.length)];
      },
      choice: (arr) => arr[Math.floor(randomState() * arr.length)],
      shuffle: (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(randomState() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      sample: (arr, k) => { const a = [...arr]; const result = []; for (let i = 0; i < k && i < a.length; i++) { const j = Math.floor(randomState() * a.length); result.push(a.splice(j, 1)[0]); } return result; },
      uniform: (a, b) => a + randomState() * (b - a),
      triangular: (low = 0, high = 1) => low + randomState() * (high - low),
      betavariate: (alpha, beta) => { const x = randomNamespace.beta_sample ? randomNamespace.beta_sample(alpha, beta) : randomState(); return x; },
      expovariate: (lambd) => -Math.log(randomState()) / lambd,
      gammavariate: (alpha, beta) => { const sg = Math.sqrt(2 * alpha - 1); const cc = sg / Math.sqrt(alpha); const x = sg + alpha * randomNamespace._normal_sample(alpha, cc); return alpha * x / beta; },
      gauss: (mu = 0, sigma = 1) => { const u = randomState(), v = randomState(); return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
      lognormvariate: (mu, sigma) => Math.exp(mu + sigma * randomNamespace.gauss(0, 1)),
      normalvariate: (mu, sigma) => randomNamespace.gauss(mu, sigma),
      vonmisesvariate: (mu, kappa) => randomState() * 2 * Math.PI,
      weibullvariate: (alpha, beta) => alpha * Math.pow(-Math.log(randomState()), 1 / beta),
      seed: (x) => {
        if (x === undefined || x === null) {
          randomState = Math.random;
        } else {
          // Simple seed - not perfect but functional
          const seed = Math.abs(Math.floor(x));
          randomState = () => {
            const next = (seed * 1103515245 + 12345) & 0x7fffffff;
            randomState = () => (next / 0x7fffffff);
            return next / 0x7fffffff;
          };
          randomState();
        }
      },
      getstate: () => ({ type: 'fake' }),
      setstate: (state) => { /* No-op for now */ },
      _normal_sample: (alpha, cc) => { const u = randomState(), v = randomState(); return cc * Math.tan(Math.PI * (u - 0.5)); },
      beta_sample: (alpha, beta) => { const x = randomNamespace.gamma_sample(alpha, 1); const y = randomNamespace.gamma_sample(beta, 1); return x / (x + y); },
      gamma_sample: (alpha, scale) => { const sg = Math.sqrt(2 * alpha - 1); const u = randomState(); return alpha * Math.pow(u, 1 / alpha) * scale; },
    };

    // ============================================================================
    // Datetime library - Full implementation
    // ============================================================================
    class DateTime {
      constructor(year, month, day, hour = 0, minute = 0, second = 0, microsecond = 0) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.microsecond = microsecond;
      }

      static fromJSDate(d) {
        return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds() * 1000);
      }

      isoformat() {
        return `${String(this.year).padStart(4, '0')}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}T${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}:${String(this.second).padStart(2, '0')}`;
      }

      strftime(fmt) {
        const d = new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second);
        return fmt
          .replace('%Y', d.getFullYear())
          .replace('%m', String(d.getMonth() + 1).padStart(2, '0'))
          .replace('%d', String(d.getDate()).padStart(2, '0'))
          .replace('%H', String(d.getHours()).padStart(2, '0'))
          .replace('%M', String(d.getMinutes()).padStart(2, '0'))
          .replace('%S', String(d.getSeconds()).padStart(2, '0'))
          .replace('%f', String(this.microsecond).padStart(6, '0'))
          .replace('%a', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()])
          .replace('%A', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()])
          .replace('%b', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()])
          .replace('%B', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()])
          .replace('%I', String(d.getHours() % 12 || 12).padStart(2, '0'))
          .replace('%p', d.getHours() < 12 ? 'AM' : 'PM')
          .replace('%j', String(Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)).padStart(3, '0'))
          .replace('%U', String(Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 604800000)).padStart(2, '0'))
          .replace('%W', String(Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 604800000)).padStart(2, '0'))
          .replace('%w', d.getDay());
      }

      weekday() { return new Date(this.year, this.month - 1, this.day).getDay(); }
      isoweekday() { return this.weekday() === 0 ? 7 : this.weekday(); }
      ctime() { return new Date(this.year, this.month - 1, this.day).toDateString(); }
      toordinal() { const diff = new Date(this.year, this.month - 1, this.day) - new Date(1, 0, 1); return Math.floor(diff / 86400000) + 1; }

      __add__(other) {
        if (other instanceof TimeDelta) {
          const ms = other.total_seconds() * 1000;
          const d = new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.microsecond / 1000);
          d.setTime(d.getTime() + ms);
          return DateTime.fromJSDate(d);
        }
        return null;
      }

      __sub__(other) {
        if (other instanceof DateTime) {
          const d1 = new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second);
          const d2 = new Date(other.year, other.month - 1, other.day, other.hour, other.minute, other.second);
          return new TimeDelta(0, 0, (d1 - d2) / 1000);
        }
        if (other instanceof TimeDelta) {
          const ms = other.total_seconds() * 1000;
          const d = new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second);
          d.setTime(d.getTime() - ms);
          return DateTime.fromJSDate(d);
        }
        return null;
      }

      toString() { return this.isoformat(); }
    }

    class Date {
      constructor(year, month, day) {
        this.year = year;
        this.month = month;
        this.day = day;
      }

      static fromJSDate(d) {
        return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
      }

      isoformat() {
        return `${String(this.year).padStart(4, '0')}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
      }

      strftime(fmt) {
        const d = new Date(this.year, this.month - 1, this.day);
        return fmt
          .replace('%Y', d.getFullYear())
          .replace('%m', String(d.getMonth() + 1).padStart(2, '0'))
          .replace('%d', String(d.getDate()).padStart(2, '0'))
          .replace('%a', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()])
          .replace('%A', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()])
          .replace('%b', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()])
          .replace('%B', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()])
          .replace('%w', d.getDay());
      }

      weekday() { return new Date(this.year, this.month - 1, this.day).getDay(); }
      isoweekday() { return this.weekday() === 0 ? 7 : this.weekday(); }
      ctime() { return new Date(this.year, this.month - 1, this.day).toDateString(); }
      toordinal() { const diff = new Date(this.year, this.month - 1, this.day) - new Date(1, 0, 1); return Math.floor(diff / 86400000) + 1; }

      __add__(other) {
        if (other instanceof TimeDelta) {
          const d = new Date(this.year, this.month - 1, this.day);
          d.setDate(d.getDate() + other.days);
          return Date.fromJSDate(d);
        }
        return null;
      }

      toString() { return this.isoformat(); }
    }

    class Time {
      constructor(hour = 0, minute = 0, second = 0, microsecond = 0) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.microsecond = microsecond;
      }

      isoformat() {
        return `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}:${String(this.second).padStart(2, '0')}`;
      }

      strftime(fmt) {
        const d = new Date(2000, 0, 1, this.hour, this.minute, this.second);
        return fmt
          .replace('%H', String(this.hour).padStart(2, '0'))
          .replace('%M', String(this.minute).padStart(2, '0'))
          .replace('%S', String(this.second).padStart(2, '0'))
          .replace('%f', String(this.microsecond).padStart(6, '0'))
          .replace('%I', String(this.hour % 12 || 12).padStart(2, '0'))
          .replace('%p', this.hour < 12 ? 'AM' : 'PM');
      }

      toString() { return this.isoformat(); }
    }

    class TimeDelta {
      constructor(days = 0, seconds = 0, microseconds = 0) {
        this.days = days;
        this.seconds = seconds;
        this.microseconds = microseconds;
      }

      total_seconds() {
        return this.days * 86400 + this.seconds + this.microseconds / 1000000;
      }

      total_milliseconds() {
        return this.total_seconds() * 1000;
      }

      __add__(other) {
        if (other instanceof TimeDelta) {
          const ms = this.total_seconds() * 1000000 + other.total_seconds() * 1000000;
          const days = Math.floor(ms / 86400000000);
          const secs = Math.floor((ms % 86400000000) / 1000000);
          const us = ms % 1000000;
          return new TimeDelta(days, secs, us);
        }
        return null;
      }

      __mul__(n) {
        const ms = this.total_seconds() * 1000000 * n;
        const days = Math.floor(ms / 86400000000);
        const secs = Math.floor((ms % 86400000000) / 1000000);
        const us = ms % 1000000;
        return new TimeDelta(days, secs, us);
      }

      toString() {
        const s = this.total_seconds();
        const sign = s < 0 ? '-' : '';
        const absS = Math.abs(s);
        const d = Math.floor(absS / 86400);
        const h = Math.floor((absS % 86400) / 3600);
        const m = Math.floor((absS % 3600) / 60);
        const sec = absS % 60;
        return `${sign}${d}, ${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }
    }

    const datetimeNamespace = {
      date: Date,
      datetime: DateTime,
      time: Time,
      timedelta: TimeDelta,
      now: () => DateTime.fromJSDate(new Date()),
      utcnow: () => DateTime.fromJSDate(new Date()),
      today: () => Date.fromJSDate(new Date()),
      fromtimestamp: (ts) => { const d = new Date(ts * 1000); return DateTime.fromJSDate(d); },
      strptime: (str, fmt) => {
        // Simple strptime - parse ISO format
        const d = new Date(str);
        if (isNaN(d.getTime())) throw new Error(`Invalid datetime: ${str}`);
        return DateTime.fromJSDate(d);
      },
      max: new DateTime(9999, 12, 31, 23, 59, 59),
      min: new DateTime(1, 1, 1, 0, 0, 0),
    };

    // ============================================================================
    // Turtle library - Full implementation
    // ============================================================================
    const turtleNamespace = {
      forward: (d) => this.turtle?.forward(d),
      backward: (d) => this.turtle?.backward(d),
      right: (angle) => this.turtle?.right(angle),
      left: (angle) => this.turtle?.left(angle),
      goto: (x, y) => this.turtle?.goto(x, y),
      setpos: (x, y) => this.turtle?.setpos(x, y),
      setposition: (x, y) => this.turtle?.setposition(x, y),
      setheading: (angle) => this.turtle?.setheading(angle),
      pensize: (size) => this.turtle?.pensize(size),
      penup: () => this.turtle?.penup(),
      pendown: () => this.turtle?.pendown(),
      speed: (s) => this.turtle?.speed(s),
      color: (c) => this.turtle?.color(c),
      begin_fill: () => this.turtle?.begin_fill(),
      end_fill: () => this.turtle?.end_fill(),
      circle: (r, extent) => this.turtle?.circle(r, extent),
      dot: (size, color) => this.turtle?.dot(size, color),
      undo: () => this.turtle?.undo(),
      clear: () => this.turtle?.clear(),
      reset: () => this.turtle?.reset(),
      showturtle: () => this.turtle?.showturtle(),
      hideturtle: () => this.turtle?.hideturtle(),
      isvisible: () => this.turtle?.isvisible(),
      shape: (name) => this.turtle?.shape(name),
      write: (text, font, align) => this.turtle?.write(text, font, align),
      bgcolor: (color) => this.turtle?.bgcolor(color),
      bye: () => this.turtle?.bye(),
      exitonclick: () => this.turtle?.exitonclick(),
      pencolor: (c) => this.turtle?.color(c),
      fillcolor: (c) => { /* Fill color not separately supported */ },
      width: (w) => this.turtle?.pensize(w),
    };

    // ============================================================================
    // JSON library - Full implementation
    // ============================================================================
    const jsonNamespace = {
      dumps: (obj, indent = null) => JSON.stringify(obj, null, indent),
      loads: (str) => JSON.parse(str),
      dump: (obj, file) => JSON.stringify(obj),
      load: (file) => { throw new Error('json.load requires a file object'); },
      JSONDecoder: class {},
      JSONEncoder: class {},
    };

    // ============================================================================
    // String library
    // ============================================================================
    const stringNamespace = {
      ascii_letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ascii_lowercase: 'abcdefghijklmnopqrstuvwxyz',
      ascii_uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      digits: '0123456789',
      hexdigits: '0123456789abcdefABCDEF',
      octdigits: '01234567',
      punctuation: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
      printable: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
      whitespace: ' \t\n\r\x0b\x0c',
      capwords: (s) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      Template: class { constructor(s) { this.s = s; } substitute(obj) { return this.s.replace(/\$\{(\w+)\}/g, (_, k) => obj[k] || ''); } },
      Formatter: class { format(format_string, ...args) { return format_string.replace(/\{(\d+)\}/g, (_, i) => args[i] || ''); } },
    };

    // ============================================================================
    // Collections library
    // ============================================================================
    const collectionsNamespace = {
      Counter: (arr) => { const c = {}; (arr || []).forEach(x => { c[x] = (c[x] || 0) + 1; }); return { ...c, most_common: (n) => Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n) }; },
      deque: function(arr = [], maxlen = null) {
        const array = [...arr];
        return {
          array,
          maxlen,
          append: (x) => { array.push(x); if (maxlen && array.length > maxlen) array.shift(); },
          appendleft: (x) => { array.unshift(x); if (maxlen && array.length > maxlen) array.pop(); },
          pop: () => array.pop(),
          popleft: () => array.shift(),
          clear: () => { array.length = 0; },
          count: (x) => array.filter(y => y === x).length,
          extend: (arr) => array.push(...arr),
          extendleft: (arr) => array.unshift(...arr),
          remove: (x) => { const i = array.indexOf(x); if (i >= 0) array.splice(i, 1); },
          rotate: (n) => { for (let i = 0; i < Math.abs(n); i++) { n > 0 ? array.unshift(array.pop()) : array.push(array.shift()); } },
          __len__: () => array.length,
          __getitem__: (i) => array[i],
          __setitem__: (i, v) => { array[i] = v; },
        };
      },
      namedtuple: (name, fields) => {
        const fn = (...args) => { const obj = {}; fields.split(',').forEach((f, i) => { obj[f.trim()] = args[i]; }); return obj; };
        fn._fields = fields.split(',').map(f => f.trim());
        fn._make = (arr) => fn(...arr);
        return fn;
      },
      OrderedDict: (obj) => ({ ...obj, _order: Object.keys(obj || {}), move_to_end: (k) => { const idx = obj._order.indexOf(k); if (idx >= 0) { obj._order.splice(idx, 1); obj._order.push(k); } } }),
      defaultdict: (defaultFn) => ({ __default: defaultFn, _data: {}, __getitem__: function(k) { if (!(k in this._data)) this._data[k] = this.__default(); return this._data[k]; }, __setitem__: (k, v) => { this._data[k] = v; }, __contains__: (k) => k in this._data, __iter__: () => Object.keys(this._data)[Symbol.iterator](), get: (k, d) => k in this._data ? this._data[k] : d }),
      ChainMap: (...maps) => ({ maps, __getitem__: (k) => { for (const m of maps) { if (k in m) return m[k]; } throw new Error(`KeyError: ${k}`); }, __iter__: function* () { const seen = new Set(); for (const m of maps) { for (const k of Object.keys(m)) { if (!seen.has(k)) { seen.add(k); yield k; } } } }, __len__() { return [...this.__iter__()].length; } }),
    };

    // ============================================================================
    // Itertools library
    // ============================================================================
    const itertoolsNamespace = {
      count: function* (start = 0, step = 1) { let i = start; while (true) { yield i; i += step; } },
      cycle: function* (arr) { let i = 0; const a = arr || []; while (true) { yield a[i % a.length]; i++; } },
      repeat: function* (x, n = Infinity) { let i = 0; while (i++ < n) yield x; },
      accumulate: function* (arr, fn = (a, b) => a + b) { let acc = arr[0] || 0; yield acc; for (let i = 1; i < arr.length; i++) { acc = fn(acc, arr[i]); yield acc; } },
      chain: function* (...arrs) { for (const arr of arrs) for (const x of arr) yield x; },
      compress: function* (data, selectors) { let i = 0; for (const d of data) { if (selectors[i++]) yield d; } },
      islice: function* (arr, start, stop, step = 1) { const a = arr || []; const s = start ?? 0; const e = stop ?? a.length; for (let i = s; i < e; i += step) yield a[i]; },
      takewhile: function* (fn, arr) { for (const x of arr || []) { if (!fn(x)) break; yield x; } },
      dropwhile: function* (fn, arr) { let dropping = true; for (const x of arr || []) { if (!dropping || !fn(x)) { dropping = false; yield x; } } },
      filterfalse: function* (fn, arr) { for (const x of arr || []) { if (!fn(x)) yield x; } },
      groupby: function* (arr, key = x => x) { const groups = {}; for (const x of arr || []) { const k = key(x); if (!groups[k]) groups[k] = []; groups[k].push(x); } for (const [k, v] of Object.entries(groups)) yield [k, v]; },
      product: (...arrs) => { let result = [[]]; for (const arr of arrs) { const newResult = []; for (const r of result) for (const x of arr) newResult.push([...r, x]); result = newResult; } return result; },
      permutations: (arr, r = null) => { const a = arr || []; const n = r !== null ? r : a.length; const result = []; function perm(curr, remaining) { if (curr.length === n) { result.push([...curr]); return; } for (let i = 0; i < remaining.length; i++) { curr.push(remaining[i]); perm(curr, remaining.slice(0, i).concat(remaining.slice(i + 1))); curr.pop(); } } perm([], a); return result; },
      combinations: (arr, r) => { const a = arr || []; const result = []; function comb(start, combo) { if (combo.length === r) { result.push([...combo]); return; } for (let i = start; i < a.length; i++) { combo.push(a[i]); comb(i + 1, combo); combo.pop(); } } comb(0, []); return result; },
      combinations_with_replacement: (arr, r) => { const a = arr || []; const result = []; function comb(start, combo) { if (combo.length === r) { result.push([...combo]); return; } for (let i = start; i < a.length; i++) { combo.push(a[i]); comb(i, combo); combo.pop(); } } comb(0, []); return result; },
      zip_longest: (...arrs) => { const maxLen = Math.max(...arrs.map(a => a?.length || 0)); const result = []; for (let i = 0; i < maxLen; i++) { result.push(arrs.map(a => a?.[i])); } return result; },
    };

    // ============================================================================
    // Functools library
    // ============================================================================
    const functoolsNamespace = {
      reduce: (fn, arr, init) => { let acc = init !== undefined ? init : arr[0]; for (let i = init !== undefined ? 0 : 1; i < arr.length; i++) acc = fn(acc, arr[i]); return acc; },
      partial: (fn, ...args) => (...rest) => fn(...args, ...rest),
      wraps: (fn) => (wrapper) => { Object.assign(wrapper, fn); return wrapper; },
      update_wrapper: (wrapper, fn) => { wrapper.__name__ = fn.name; wrapper.__doc__ = fn.__doc__; return wrapper; },
      lru_cache: (maxsize = 128) => (fn) => { const cache = new Map(); return (...args) => { const key = JSON.stringify(args); if (cache.has(key)) return cache.get(key); const result = fn(...args); if (cache.size >= maxsize) { const firstKey = cache.keys().next().value; cache.delete(firstKey); } cache.set(key, result); return result; }; },
      cache: (fn) => functoolsNamespace.lru_cache(128)(fn),
      cached_property: (fn) => ({ __get__: (obj) => { const value = fn.call(obj); obj[fn.name] = value; return value; } }),
      total_ordering: (cls) => cls,
      singledispatch: (fn) => { const registry = {}; return function(...args) { const type = args[0]?.constructor?.name || 'NoneType'; const handler = registry[type] || registry['*'] || fn; return handler.apply(this, args); }; },
    };

    // ============================================================================
    // OS library (simplified)
    // ============================================================================
    const osNamespace = {
      getcwd: () => '/',
      chdir: (path) => { /* No-op in browser */ },
      listdir: (path = '.') => ['.DS_Store', 'node_modules', 'package.json', 'src', 'index.js'],
      mkdir: (path) => { /* No-op in browser */ },
      makedirs: (path) => { /* No-op in browser */ },
      remove: (path) => { /* No-op in browser */ },
      rename: (old, new_) => { /* No-op in browser */ },
      stat: (path) => ({ st_mode: 33188, st_size: 0, st_ctime: Date.now() / 1000, st_mtime: Date.now() / 1000 }),
      path: {
        exists: (p) => true,
        join: (...args) => args.join('/'),
        basename: (p) => p.split('/').pop(),
        dirname: (p) => p.split('/').slice(0, -1).join('/') || '.',
        split: (p) => { const i = p.lastIndexOf('/'); return [p.slice(0, i) || '.', p.slice(i + 1)]; },
        splitext: (p) => { const i = p.lastIndexOf('.'); return [p.slice(0, i), p.slice(i)]; },
        isfile: (p) => true,
        isdir: (p) => false,
      },
    };

    // ============================================================================
    // Sys library
    // ============================================================================
    const sysNamespace = {
      argv: ['python'],
      path: ['/usr/lib/python3', '/usr/local/lib/python3'],
      version: '3.11.4',
      version_info: { major: 3, minor: 11, micro: 4, releaselevel: 'final' },
      platform: 'javascript',
      maxsize: Number.MAX_SAFE_INTEGER,
      copyright: 'Copyright (c) 2001-2023 Python Software Foundation',
      exit: (code = 0) => { throw new Error(`Program terminated with exit code ${code}`); },
      getrecursionlimit: () => 1000,
      setrecursionlimit: (n) => { /* No-op in browser */ },
      stdin: { read: () => '', readline: () => '' },
      stdout: { write: (s) => this.log(s), flush: () => {} },
      stderr: { write: (s) => this.error(s), flush: () => {} },
    };

    // ============================================================================
    // Python to JavaScript Transpiler
    // ============================================================================
    const pythonToJS = (code) => {
      let lines = code.split('\n');
      let result = [];
      let indentStack = [0];
      let inFunction = false;
      let inClass = false;
      let inAsync = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const origLine = line;

        // Skip empty lines and comments
        if (/^\s*$/.test(line) || /^\s*#/.test(line)) {
          result.push('');
          continue;
        }

        // Track indentation
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const trimmed = line.trim();

        // Handle dedent (simplified - just track indent level)
        if (indent < indentStack[indentStack.length - 1]) {
          while (indentStack[indentStack.length - 1] > indent) {
            indentStack.pop();
            if (inFunction && indentStack[indentStack.length - 1] < indent) {
              result.push('}'); // Close function
              inFunction = false;
            }
            if (inClass && indentStack[indentStack.length - 1] < indent) {
              result.push('}'); // Close class
              inClass = false;
            }
          }
        }

        // Handle def
        if (/^\s*def\s+/.test(trimmed)) {
          inFunction = true;
          indentStack.push(indent + 4);
          const match = trimmed.match(/^def\s+(\w+)\s*\((.*)\)\s*(->\s*\w+)?\s*:/);
          if (match) {
            const [, name, args] = match;
            const jsArgs = args.split(',').map(a => a.trim().split(':')[0].split('=')[0].trim()).filter(a => a);
            line = `const ${name} = (${jsArgs.join(', ')}) => {`;
          }
        }
        // Handle async def
        else if (/^\s*async\s+def\s+/.test(trimmed)) {
          inFunction = true;
          inAsync = true;
          indentStack.push(indent + 4);
          const match = trimmed.match(/^async\s+def\s+(\w+)\s*\((.*)\)\s*:/);
          if (match) {
            const [, name, args] = match;
            const jsArgs = args.split(',').map(a => a.trim().split(':')[0].split('=')[0].trim()).filter(a => a);
            line = `const ${name} = (${jsArgs.join(', ')}) => {`;
          }
        }
        // Handle class
        else if (/^\s*class\s+\w+/.test(trimmed)) {
          inClass = true;
          indentStack.push(indent + 4);
          const match = trimmed.match(/^class\s+(\w+)\s*(\([^)]*\))?\s*:/);
          if (match) {
            const [, name] = match;
            line = `const ${name} = class {`;
          }
        }
        // Handle elif
        else if (/^\s*elif\b/.test(trimmed)) {
          const condition = trimmed.replace(/^\s*elif\s+/, '').replace(/\s*:\s*$/, '');
          line = `} else if (${this._translateCondition(condition)}) {`;
        }
        // Handle else
        else if (/^\s*else\s*:\s*$/.test(trimmed)) {
          line = '} else {';
        }
        // Handle if
        else if (/^\s*if\s+/.test(trimmed)) {
          const match = trimmed.match(/^\s*if\s+(.+?)\s*:\s*$/);
          if (match) {
            line = `if (${this._translateCondition(match[1])}) {`;
          }
        }
        // Handle for
        else if (/^\s*for\s+/.test(trimmed)) {
          const match = trimmed.match(/^\s*for\s+(\w+)\s+in\s+(.+?)\s*:\s*$/);
          if (match) {
            const [, varName, iter] = match;
            line = `for (const ${varName} of ${this._translateIterable(iter)}) {`;
            indentStack.push(indent + 4);
          }
        }
        // Handle while
        else if (/^\s*while\s+/.test(trimmed)) {
          const match = trimmed.match(/^\s*while\s+(.+?)\s*:\s*$/);
          if (match) {
            line = `while (${this._translateCondition(match[1])}) {`;
            indentStack.push(indent + 4);
          }
        }
        // Handle try
        else if (/^\s*try\s*:\s*$/.test(trimmed)) {
          line = 'try {';
          indentStack.push(indent + 4);
        }
        // Handle except
        else if (/^\s*except(?:\s+\w+)?\s*(?:\s+as\s+\w+)?\s*:\s*$/.test(trimmed)) {
          line = '} catch(__py_error) {';
        }
        // Handle finally
        else if (/^\s*finally\s*:\s*$/.test(trimmed)) {
          line = '} finally {';
          indentStack.push(indent + 4);
        }
        // Handle with
        else if (/^\s*with\s+/.test(trimmed)) {
          const match = trimmed.match(/^\s*with\s+(.+?)\s+as\s+(.+?)\s*:\s*$/);
          if (match) {
            line = `{ const ${match[2]} = ${this._translateIterable(match[1])};`;
          }
        }
        // Handle return
        else if (/^\s*return\s*/.test(trimmed)) {
          line = trimmed.replace(/^\s*return\s*/, 'return ');
        }
        // Handle break
        else if (/^\s*break\s*$/.test(trimmed)) {
          line = 'break;';
        }
        // Handle continue
        else if (/^\s*continue\s*$/.test(trimmed)) {
          line = 'continue;';
        }
        // Handle pass
        else if (/^\s*pass\s*$/.test(trimmed)) {
          line = '// pass';
        }
        // Handle raise
        else if (/^\s*raise\s*/.test(trimmed)) {
          line = trimmed.replace(/^\s*raise\s*/, 'throw new Error(').replace(/\s*$/, '))');
        }
        // Handle yield
        else if (/^\s*yield\s*/.test(trimmed)) {
          line = trimmed.replace(/^\s*yield\s*/, 'yield ');
        }
        // Handle await
        else if (/^\s*await\s*/.test(trimmed)) {
          line = trimmed.replace(/^\s*await\s*/, 'await ');
        }
        // Handle print
        else if (/print\s*\(/.test(trimmed)) {
          line = line.replace(/print\s*\((.*)\)\s*$/, (_, args) => {
            const argParts = args.split(',').map(a => a.trim());
            if (argParts.length > 1) {
              return `__print(${argParts.map(a => `__format(${a})`).join(', ')})`;
            }
            return `__print(__format(${args}))`;
          });
        }
        // Handle input
        else if (/input\s*\(/.test(trimmed)) {
          line = line.replace(/input\s*\((.*)\)/g, (_, prompt) => `await __input(${prompt})`);
        }
        // Handle range
        else if (/range\s*\(/.test(trimmed)) {
          line = line.replace(/range\s*\(\s*(-?\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
          line = line.replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
          line = line.replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, 'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');
          line = line.replace(/range\s*\(\s*(\w+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
          line = line.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
          line = line.replace(/range\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/g, 'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)');
        }
        // Handle operators
        else {
          line = line
            .replace(/\band\b/g, '&&')
            .replace(/\bor\b/g, '||')
            .replace(/\bnot\s+in\b/g, '!')
            .replace(/\bis\s+not\b/g, '!==')
            .replace(/\bnot\b(?!\s*in|\s*is)/g, '!')
            .replace(/\bTrue\b/g, 'true')
            .replace(/\bFalse\b/g, 'false')
            .replace(/\bNone\b/g, 'null');

          // Handle "in" for arrays
          line = line.replace(/([\w\]])\s+in\s+(["'][\w]+["']|\w+)/g, (match, item, arr) => {
            if (arr.startsWith('"') || arr.startsWith("'")) return match;
            return `(${arr}).includes(${item})`;
          });

          // Handle list comprehension
          line = line.replace(/\[(\w+)\s+for\s+(\w+)\s+in\s+(\w+)\s+if\s+(.+?)\]/g, '($3).filter($4).map($2 => $1)');
          line = line.replace(/\[(\w+)\s+for\s+(\w+)\s+in\s+(\w+)\]/g, '($3).map($2 => $1)');

          // Handle f-strings (basic)
          line = line.replace(/f"(.*?)"/g, (_, s) => `"${s.replace(/\{(\w+)\}/g, '" + $1 + "')}"`);
          line = line.replace(/f'(.*?)'/g, (_, s) => `"${s.replace(/\{(\w+)\}/g, '" + $1 + "')}"`);
        }

        result.push(line);
      }

      return result.join('\n');
    };

    // Helper to translate Python conditions
    this._translateCondition = (cond) => {
      return cond
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\s+in\b/g, '!')
        .replace(/\bis\s+not\b/g, '!==')
        .replace(/\bnot\b/g, '!')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null')
        .replace(/(\w+)\s+in\s+(\w+)/g, '($2).includes($1)')
        .replace(/(\w+)\s+not\s+in\s+(\w+)/g, '!($2).includes($1)');
    };

    // Helper for iterable translation
    this._translateIterable = (iter) => {
      return iter
        .replace(/range\s*\(\s*(\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)')
        .replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)')
        .replace(/range\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g, 'Array.from({length: Math.ceil(($2-$1)/$3)}, (_, i) => $1 + i*$3)')
        .replace(/enumerate\s*\(([^)]+)\)/g, '([...($1)].entries())')
        .replace(/zip\s*\(([^)]+)\)/g, '([...($1)].entries())')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\bNone\b/g, 'null');
    };

    try {
      const jsCode = pythonToJS(code);

      // Build all namespaces with their keys and values
      // Use safeBuiltins properties directly (not bare identifiers which are undefined)
      const bi = safeBuiltins;
      const allNamespaces = [
        { keys: ['int', 'float', 'len', 'str', 'bool', 'list', 'dict', 'set', 'tuple', 'frozenset', 'bytes', 'bytearray', 'complex', 'type', 'range', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'next', 'iter', 'slice', 'abs', 'min', 'max', 'sum', 'round', 'pow', 'divmod', 'chr', 'ord', 'hex', 'oct', 'bin', 'repr', 'ascii', 'format', 'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr', 'delattr', 'id', 'hash', 'callable', 'dir', 'vars', 'help', 'exit', 'quit'], vals: [bi.int, bi.float, bi.len, bi.str, bi.bool, bi.list, bi.dict, bi.set, bi.tuple, bi.frozenset, bi.bytes, bi.bytearray, bi.complex, bi.type, bi.range, bi.sorted, bi.reversed, bi.enumerate, bi.zip, bi.map, bi.filter, bi.any, bi.all, bi.next, bi.iter, bi.slice, bi.abs, bi.min, bi.max, bi.sum, bi.round, bi.pow, bi.divmod, bi.chr, bi.ord, bi.hex, bi.oct, bi.bin, bi.repr, bi.ascii, bi.format, bi.isinstance, bi.issubclass, bi.hasattr, bi.getattr, bi.setattr, bi.delattr, bi.id, bi.hash, bi.callable, bi.dir, bi.vars, bi.help, bi.exit, bi.quit] },
        { keys: Object.keys(mathNamespace), vals: Object.values(mathNamespace) },
        { keys: Object.keys(randomNamespace), vals: Object.values(randomNamespace) },
        { keys: ['date', 'datetime', 'time', 'timedelta', 'now', 'utcnow', 'today', 'fromtimestamp', 'strptime'], vals: [Date, DateTime, Time, TimeDelta, datetimeNamespace.now, datetimeNamespace.utcnow, datetimeNamespace.today, datetimeNamespace.fromtimestamp, datetimeNamespace.strptime] },
        { keys: Object.keys(jsonNamespace), vals: Object.values(jsonNamespace) },
        { keys: Object.keys(stringNamespace), vals: Object.values(stringNamespace) },
        { keys: Object.keys(collectionsNamespace), vals: Object.values(collectionsNamespace) },
        { keys: Object.keys(itertoolsNamespace), vals: Object.values(itertoolsNamespace) },
        { keys: Object.keys(functoolsNamespace), vals: Object.values(functoolsNamespace) },
        { keys: Object.keys(osNamespace), vals: Object.values(osNamespace) },
        { keys: Object.keys(turtleNamespace), vals: Object.values(turtleNamespace) },
        { keys: Object.keys(sysNamespace), vals: Object.values(sysNamespace) },
      ];

      // Deduplicate: first namespace (builtins) wins for conflicting names
      const allParamNames = [];
      const allParamValues = [];
      const nsSurvivedIndices = allNamespaces.map(() => []); // track which original indices survived for each ns
      const seen = new Set();

      for (let nsIdx = 0; nsIdx < allNamespaces.length; nsIdx++) {
        const ns = allNamespaces[nsIdx];
        for (let k = 0; k < ns.keys.length; k++) {
          if (!seen.has(ns.keys[k])) {
            seen.add(ns.keys[k]);
            nsSurvivedIndices[nsIdx].push(k);
            allParamNames.push(ns.keys[k]);
            allParamValues.push(ns.vals[k]);
          }
        }
      }

      // Build namespace object construction code using surviving key names (ES6 shorthand)
      const buildNsObj = (nsIdx) => {
        const entries = nsSurvivedIndices[nsIdx].map(i => allNamespaces[nsIdx].keys[i]).join(', ');
        return `{${entries}}`;
      };

      const nsBuilders = [
        '', // builtins are used directly, no object needed
        `const __math = ${buildNsObj(1)};`,
        `const __random = ${buildNsObj(2)};`,
        `const __datetime = ${buildNsObj(3)};`,
        `const __json = ${buildNsObj(4)};`,
        `const __string = ${buildNsObj(5)};`,
        `const __collections = ${buildNsObj(6)};`,
        `const __itertools = ${buildNsObj(7)};`,
        `const __functools = ${buildNsObj(8)};`,
        `const __os = ${buildNsObj(9)};`,
        `const __turtle = ${buildNsObj(10)};`,
        `const __sys = ${buildNsObj(11)};`,
      ];

      const fn = new Function(
        ...allParamNames, '__print', '__input',
        `${nsBuilders.join('\n        ')}
        const __format = (v) => {
          if (v === null) return 'None';
          if (v === undefined) return 'None';
          if (typeof v === 'boolean') return v ? 'True' : 'False';
          if (typeof v === 'string') return v;
          if (Array.isArray(v)) return '[' + v.map(x => __format(x)).join(', ') + ']';
          if (typeof v === 'object') {
            const entries = Object.entries(v);
            return '{' + entries.map(([k, val]) => k + ': ' + __format(val)).join(', ') + '}';
          }
          return String(v);
        };

        return (async () => {
          try {
            ${jsCode}
          } catch (__py_error) {
            const errorMsg = __py_error.message || String(__py_error);
            throw new Error(\`Python执行错误: \${errorMsg}\`);
          }
        })()`
      );

      await fn(
        ...allParamValues,
        (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
        async (prompt) => new Promise(resolve => { this._inputResolve = resolve; this.onInput?.(prompt, resolve); })
      );

      this.log('\n=== 执行完成 ===', 'info');
    } catch (e) {
      this.error(`\n=== 执行错误 ===\n${e.message}`);
    } finally {
      this.running = false;
      this._inputResolve = null;
    }
  }

  stop() {
    this.running = false;
    this._inputResolve?.('');
    this.log('\n=== 执行已停止 ===', 'warn');
  }
}

// ============================================================================
// Main Python Editor Component
// ============================================================================
const PythonEditor = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [fontSize, setFontSize] = useState(14);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('我的Python项目');
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputResolve, setInputResolve] = useState(null);
  const [showTurtle, setShowTurtle] = useState(false);
  const [turtleCanvasSize, setTurtleCanvasSize] = useState({ width: 500, height: 400 });
  const [theme, setTheme] = useState('dark');

  const executorRef = useRef(null);
  const codeRef = useRef(code);
  const turtleCanvasRef = useRef(null);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleOutput = useCallback((entry) => {
    if (entry.clear) {
      setOutput([]);
    } else {
      setOutput(prev => [...prev, entry]);
    }
  }, []);

  const handleError = useCallback((entry) => {
    setOutput(prev => [...prev, entry]);
  }, []);

  const handleInput = useCallback((prompt, resolve) => {
    setInputPrompt(prompt);
    setInputValue('');
    setInputVisible(true);
    // Wrap in a function so React doesn't treat resolve as a state updater
    setInputResolve(() => (value) => resolve(value));
  }, []);

  useEffect(() => {
    executorRef.current = new PythonCodeExecutor(handleOutput, handleError, handleInput);
  }, [handleOutput, handleError, handleInput]);

  const handleRun = async () => {
    if (isRunning) return;
    if (!executorRef.current) return;

    // Set turtle canvas if turtle mode is active
    if (showTurtle && turtleCanvasRef.current) {
      executorRef.current.setCanvas(turtleCanvasRef.current);
    }

    setIsRunning(true);
    setActiveTab('output');

    try {
      await executorRef.current.executePython(code);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (executorRef.current) {
      executorRef.current.stop();
      setIsRunning(false);
      setInputVisible(false);
      setInputPrompt('');
      setInputValue('');
      setInputResolve(null);
    }
  };

  const handleClear = () => {
    if (executorRef.current) {
      executorRef.current.clear();
    }
    setOutput([]);
  };

  const handleInputSubmit = () => {
    if (inputResolve) {
      inputResolve(inputValue);
      setInputResolve(null);
      setInputVisible(false);
      setInputPrompt('');
      setInputValue('');
    }
  };

  const handleSaveToCloud = async () => {
    try {
      const user = safeGetJSON('user');

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          name: projectName,
          type: 'python',
          content: code,
        });
        message.success('项目已更新');
      } else {
        const result = await createProject({
          name: projectName,
          type: 'python',
          content: code,
          userId: user?.id,
        });
        if (result) {
          setCurrentProjectId(result.id);
          message.success('项目已保存');
        }
      }
      setShowSaveModal(false);
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleLoadProjects = async () => {
    try {
      const user = safeGetJSON('user');

      const projects = await getProjects(user?.id);
      const pythonProjects = Array.isArray(projects)
        ? projects.filter(p => p.type === 'python')
        : [];
      setSavedProjects(pythonProjects);
      setShowHistory(true);
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  const handleLoadProject = async (project) => {
    setCode(project.content || DEFAULT_CODE);
    setProjectName(project.name);
    setCurrentProjectId(project.id);
    setShowHistory(false);
    message.success(`已加载项目: ${project.name}`);
  };

  const handleNewProject = () => {
    setCode(DEFAULT_CODE);
    setProjectName('我的Python项目');
    setCurrentProjectId(null);
    setShowHistory(false);
    message.success('已创建新项目');
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      setSavedProjects(prev => prev.filter(p => p.id !== id));
      message.success('项目已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    message.success('代码已复制到剪贴板');
  };

  const handleFormatCode = () => {
    const lines = code.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) return line;
      return line.trimEnd();
    }).join('\n');
    setCode(formatted);
    message.success('代码已格式化');
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOutputStyle = (type) => {
    switch (type) {
      case 'error': return { color: '#ff6b6b' };
      case 'warn': return { color: '#ffd93d' };
      case 'info': return { color: '#6bcbff' };
      case 'code': return { color: '#98d8aa' };
      default: return { color: '#fff' };
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#323233',
        borderBottom: '1px solid #444'
      }}>
        <Space>
          <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleRun} disabled={isRunning}>
            运行
          </Button>
          <Button icon={<StopOutlined />} onClick={handleStop} disabled={!isRunning}>
            停止
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空输出
          </Button>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setShowTurtle(!showTurtle)}
            type={showTurtle ? 'primary' : 'default'}
          >
            海龟绘图
          </Button>
        </Space>

        <Space>
          <span style={{ color: '#fff', fontSize: 14 }}>字体大小:</span>
          <Select
            value={fontSize}
            onChange={setFontSize}
            style={{ width: 80 }}
            size="small"
            options={[
              { value: 12, label: '12px' },
              { value: 14, label: '14px' },
              { value: 16, label: '16px' },
              { value: 18, label: '18px' },
              { value: 20, label: '20px' },
            ]}
          />
          <Tooltip title={theme === 'dark' ? '切换浅色主题' : '切换深色主题'}>
            <Button
              icon={<BgColorsOutlined />}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              size="small"
            />
          </Tooltip>
        </Space>

        <Space>
          <Button icon={<FolderOpenOutlined />} onClick={handleLoadProjects}>
            打开
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => setShowSaveModal(true)}>
            保存
          </Button>
          <Dropdown menu={{
            items: [
              { key: 'copy', label: '复制代码', icon: <CopyOutlined />, onClick: handleCopyCode },
              { key: 'format', label: '格式化', icon: <FormatPainterOutlined />, onClick: handleFormatCode },
              { key: 'download', label: '下载.py文件', icon: <DownloadOutlined />, onClick: handleDownloadCode },
            ]
          }}>
            <Button icon={<EditOutlined />}>更多</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #444', position: 'relative' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ height: '100%' }} items={[
            { key: 'editor', label: '编辑器', children: (
              <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                {/* CodeMirror Editor with Python Syntax Highlighting */}
                <CodeMirrorEditor
                  value={code}
                  onChange={setCode}
                  fontSize={fontSize}
                  onRun={handleRun}
                  theme={theme}
                />
              </div>
            )},
            { key: 'history', label: '历史记录', children: (
              <div style={{ padding: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject} block>
                    新建项目
                  </Button>
                  {savedProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>暂无保存的项目</div>
                  ) : (
                    savedProjects.map(project => (
                      <div key={project.id} style={{
                        padding: 12,
                        background: '#252526',
                        borderRadius: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{project.name}</div>
                          <div style={{ color: '#888', fontSize: 12 }}>
                            更新于: {new Date(project.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <Space>
                          <Button size="small" onClick={() => handleLoadProject(project)}>打开</Button>
                          <Button size="small" danger onClick={() => handleDeleteProject(project.id)}>删除</Button>
                        </Space>
                      </div>
                    ))
                  )}
                </Space>
              </div>
            )},
            { key: 'libs', label: '库帮助', children: (
              <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {Object.entries(librariesSupported).map(([name, lib]) => (
                    <div key={name} style={{ background: '#252526', borderRadius: 4, padding: 12 }}>
                      <div style={{ color: '#569cd6', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                        import {name}
                      </div>
                      <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                        {lib.description}
                      </div>
                      <div style={{ color: '#d4d4d4' }}>
                        {lib.functions && (
                          <div style={{ fontSize: 12 }}>
                            {'functions: '}
                            {lib.functions.map((f, i) => (
                              <span key={i} style={{ color: '#4ec9b0', marginRight: 8 }}>{f}()</span>
                            ))}
                          </div>
                        )}
                        {lib.classes && (
                          <div style={{ fontSize: 12 }}>
                            {'classes: '}
                            {lib.classes.map((c, i) => (
                              <span key={i} style={{ color: '#ce9178', marginRight: 8 }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </Space>
              </div>
            )},
          ]} />
        </div>

        {/* Turtle Canvas Panel */}
        {showTurtle && (
          <div style={{ width: 520, display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderRight: '1px solid #444' }}>
            <div style={{ padding: '8px 12px', background: '#323233', borderBottom: '1px solid #444', color: '#fff', fontWeight: 500 }}>
              海龟绘图
            </div>
            <div style={{ padding: 8 }}>
              <canvas
                ref={turtleCanvasRef}
                width={turtleCanvasSize.width}
                height={turtleCanvasSize.height}
                style={{
                  border: '1px solid #444',
                  borderRadius: 4,
                  background: '#fff',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>
            <div style={{ padding: '8px 12px', fontSize: 12, color: '#888' }}>
              代码示例:
              <pre style={{ background: '#252526', padding: 8, borderRadius: 4, marginTop: 4, overflow: 'auto' }}>
{`import turtle
turtle.forward(100)
turtle.right(90)
turtle.forward(50)
turtle.circle(50)`}
              </pre>
            </div>
          </div>
        )}

        {/* Output panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
          <div style={{
            padding: '8px 12px',
            background: '#323233',
            borderBottom: '1px solid #444',
            color: '#fff',
            fontWeight: 500
          }}>
            输出控制台
            {isRunning && <Tag color="blue" style={{ marginLeft: 8 }}>运行中</Tag>}
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: fontSize - 2,
            lineHeight: 1.6
          }}>
            {output.length === 0 && (
              <div style={{ color: '#888' }}>控制台输出将显示在这里...</div>
            )}
            {output.map((entry, idx) => (
              <div key={idx} style={{ ...getOutputStyle(entry.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {entry.type === 'error' && <span style={{ color: '#ff6b6b' }}>[错误] </span>}
                {entry.type === 'warn' && <span style={{ color: '#ffd93d' }}>[警告] </span>}
                {entry.type === 'info' && <span style={{ color: '#6bcbff' }}>[信息] </span>}
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Modal */}
      <Modal
        title="Python input()"
        open={inputVisible}
        onCancel={() => {
          setInputVisible(false);
          setInputPrompt('');
          setInputValue('');
          setInputResolve(null);
          if (inputResolve) inputResolve('');
        }}
        footer={null}
        maskClosable={false}
        closable={true}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ fontSize: 14, padding: '8px 0', color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {inputPrompt || '请输入:'}
          </div>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleInputSubmit}
            placeholder="输入内容后按回车..."
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={handleInputSubmit}
              disabled={inputValue === ''}
            >
              确定
            </Button>
          </div>
        </Space>
      </Modal>

      {/* Save Modal */}
      <Modal
        title="保存项目"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#fff' }}>项目名称:</label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <Button type="primary" onClick={handleSaveToCloud} block>
            保存到云端
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default PythonEditor;
