import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Table, Tag, Tooltip, Modal, Input, Card, Badge, Popover, List, Empty } from 'antd';
import {
  PauseCircleOutlined, PlayCircleOutlined, StepForwardOutlined,
  StepBackwardOutlined, NodeIndexOutlined, DeleteOutlined, EyeOutlined,
  EyeInvisibleOutlined, PlusOutlined, ClearOutlined, ConsoleSqlOutlined,
  InfoCircleOutlined, BugOutlined
} from '@ant-design/icons';

// ============================================================================
// Debugger Feature Components
// ============================================================================

/**
 * Breakpoint Manager - Manages breakpoints for code lines
 */
export class BreakpointManager {
  constructor() {
    this.breakpoints = new Map(); // lineNumber -> { enabled: boolean, condition: string, hitCount: number }
    this.listeners = new Set();
  }

  setBreakpoint(line) {
    if (!this.breakpoints.has(line)) {
      this.breakpoints.set(line, { enabled: true, condition: null, hitCount: 0 });
    }
    this.notifyListeners();
  }

  removeBreakpoint(line) {
    if (this.breakpoints.has(line)) {
      this.breakpoints.delete(line);
      this.notifyListeners();
    }
  }

  toggleBreakpoint(line) {
    if (this.breakpoints.has(line)) {
      const bp = this.breakpoints.get(line);
      bp.enabled = !bp.enabled;
    } else {
      this.breakpoints.set(line, { enabled: true, condition: null, hitCount: 0 });
    }
    this.notifyListeners();
  }

  setCondition(line, condition) {
    if (this.breakpoints.has(line)) {
      this.breakpoints.get(line).condition = condition;
    }
  }

  incrementHitCount(line) {
    if (this.breakpoints.has(line)) {
      this.breakpoints.get(line).hitCount++;
    }
  }

  isBreakpoint(line) {
    return this.breakpoints.has(line);
  }

  isEnabled(line) {
    return this.breakpoints.get(line)?.enabled ?? false;
  }

  getBreakpoints() {
    return Array.from(this.breakpoints.entries()).map(([line, data]) => ({
      line,
      ...data
    }));
  }

  clearAll() {
    this.breakpoints.clear();
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.getBreakpoints()));
  }
}

// ============================================================================
// Debugger State Machine
// ============================================================================

export const DebuggerState = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STEP_OVER: 'step_over',
  STEP_INTO: 'step_into',
  STEP_OUT: 'step_out',
  STOPPED: 'stopped'
};

// ============================================================================
// Step Execution Controller
// ============================================================================

export class StepController {
  constructor() {
    this.state = DebuggerState.IDLE;
    this.currentLine = 0;
    this.callStack = [];
    this.stepDepth = 0;
    this.listeners = new Set();
  }

  setState(newState) {
    this.state = newState;
    this.notifyListeners();
  }

  setCurrentLine(line) {
    this.currentLine = line;
    this.notifyListeners();
  }

  pushCallStack(frame) {
    this.callStack.push(frame);
    this.stepDepth++;
  }

  popCallStack() {
    this.callStack.pop();
    this.stepDepth = Math.max(0, this.stepDepth - 1);
  }

  getCallStack() {
    return [...this.callStack];
  }

  reset() {
    this.state = DebuggerState.IDLE;
    this.currentLine = 0;
    this.callStack = [];
    this.stepDepth = 0;
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb({
      state: this.state,
      currentLine: this.currentLine,
      callStack: this.callStack,
      stepDepth: this.stepDepth
    }));
  }
}

// ============================================================================
// Variable Watcher
// ============================================================================

export class VariableWatcher {
  constructor() {
    this.watchedVariables = new Map(); // name -> { value, type, expanded: boolean }
    this.scope = {}; // Current execution scope
    this.history = []; // Value change history
    this.listeners = new Set();
  }

  watch(name, value = null, type = null) {
    this.watchedVariables.set(name, {
      value,
      type,
      expanded: false,
      lastModified: Date.now()
    });
    this.notifyListeners();
  }

  unwatch(name) {
    if (this.watchedVariables.has(name)) {
      this.watchedVariables.delete(name);
      this.notifyListeners();
    }
  }

  updateScope(scope) {
    this.scope = { ...scope };
    this.updateWatchedValues();
  }

  updateWatchedValues() {
    let changed = false;
    this.watchedVariables.forEach((data, name) => {
      if (name in this.scope) {
        const newValue = this.scope[name];
        if (data.value !== newValue) {
          this.history.push({
            name,
            oldValue: data.value,
            newValue,
            timestamp: Date.now()
          });
          data.value = newValue;
          data.type = this.getType(newValue);
          data.lastModified = Date.now();
          changed = true;
        }
      }
    });
    if (changed) {
      this.notifyListeners();
    }
  }

  getType(value) {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  toggleExpand(name) {
    if (this.watchedVariables.has(name)) {
      this.watchedVariables.get(name).expanded = !this.watchedVariables.get(name).expanded;
      this.notifyListeners();
    }
  }

  getWatchedVariables() {
    return Array.from(this.watchedVariables.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    this.notifyListeners();
  }

  clearAll() {
    this.watchedVariables.clear();
    this.scope = {};
    this.history = [];
    this.notifyListeners();
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb({
      variables: this.getWatchedVariables(),
      history: this.history,
      scope: this.scope
    }));
  }
}

// ============================================================================
// Format Value for Display
// ============================================================================

const formatValue = (value, maxLength = 50) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    const truncated = value.length > maxLength ? value.slice(0, maxLength) + '...' : value;
    return `"${truncated}"`;
  }
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// ============================================================================
// Debugger UI Components
// ============================================================================

/**
 * BreakpointGutter - Renders breakpoint markers in the line number gutter
 */
export const BreakpointGutter = ({ line, breakpointManager, onBreakpointClick }) => {
  const hasBreakpoint = breakpointManager.isBreakpoint(line);
  const isEnabled = breakpointManager.isEnabled(line);

  return (
    <div
      onClick={() => onBreakpointClick?.(line)}
      style={{
        width: 20,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {hasBreakpoint && (
        <Tooltip title={`断点 ${isEnabled ? '已启用' : '已禁用'}`}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: isEnabled ? '#f5222d' : '#999',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};

/**
 * DebuggerControlBar - Control buttons for debugger actions
 */
export const DebuggerControlBar = ({
  debuggerState,
  onStart,
  onPause,
  onStop,
  onStepOver,
  onStepInto,
  onStepOut,
  onContinue,
  disabled = false
}) => {
  const isRunning = debuggerState === DebuggerState.RUNNING;
  const isPaused = debuggerState === DebuggerState.PAUSED;
  const isStopped = debuggerState === DebuggerState.IDLE || debuggerState === DebuggerState.STOPPED;

  return (
    <Space size="small">
      {isStopped ? (
        <Tooltip title="开始调试 (F5)">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onStart}
            disabled={disabled}
            style={{ backgroundColor: '#52c41a' }}
          >
            开始
          </Button>
        </Tooltip>
      ) : isRunning ? (
        <Tooltip title="暂停 (F6)">
          <Button
            icon={<PauseCircleOutlined />}
            onClick={onPause}
            style={{ backgroundColor: '#faad14', color: '#fff' }}
          >
            暂停
          </Button>
        </Tooltip>
      ) : (
        <Tooltip title="继续 (F5)">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={onContinue}
            style={{ backgroundColor: '#52c41a' }}
          >
            继续
          </Button>
        </Tooltip>
      )}

      {isPaused && (
        <>
          <Tooltip title="单步跳过 (F10)">
            <Button icon={<StepForwardOutlined />} onClick={onStepOver} />
          </Tooltip>
          <Tooltip title="单步进入 (F11)">
            <Button icon={<NodeIndexOutlined />} onClick={onStepInto} />
          </Tooltip>
          <Tooltip title="单步退出 (Shift+F11)">
            <Button icon={<StepBackwardOutlined />} onClick={onStepOut} />
          </Tooltip>
        </>
      )}

      {!isStopped && (
        <Tooltip title="停止调试 (Shift+F5)">
          <Button
            danger
            icon={<StopOutlined />}
            onClick={onStop}
          />
        </Tooltip>
      )}
    </Space>
  );
};

/**
 * WatchPanel - Panel for watching variables
 */
export const WatchPanel = ({
  variableWatcher,
  onAddWatch,
  onRemoveWatch,
  onToggleExpand,
  style = {}
}) => {
  const [newWatchName, setNewWatchName] = useState('');
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    const update = ({ variables }) => setVariables(variables);
    variableWatcher.addListener(update);
    update({ variables: variableWatcher.getWatchedVariables() });
    return () => variableWatcher.removeListener(update);
  }, [variableWatcher]);

  const handleAddWatch = () => {
    if (newWatchName.trim()) {
      onAddWatch(newWatchName.trim());
      setNewWatchName('');
    }
  };

  const renderValue = (variable) => {
    const { name, value, type, expanded } = variable;

    if (type === 'object' && expanded) {
      return (
        <div style={{ marginLeft: 16, marginTop: 4 }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} style={{ fontSize: 12 }}>
              <span style={{ color: '#9cdcfe' }}>{k}: </span>
              <span>{formatValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    const colorMap = {
      string: '#ce9178',
      number: '#b5cea8',
      boolean: '#569cd6',
      null: '#569cd6',
      undefined: '#569cd6',
      array: '#dcdcaa',
      object: '#dcdcaa'
    };

    return (
      <span style={{ color: colorMap[type] || '#d4d4d4' }}>
        {formatValue(value)}
      </span>
    );
  };

  return (
    <div style={{ padding: 8, ...style }}>
      <div style={{ marginBottom: 8 }}>
        <Space>
          <Input
            size="small"
            placeholder="添加监视..."
            value={newWatchName}
            onChange={e => setNewWatchName(e.target.value)}
            onPressEnter={handleAddWatch}
            style={{ width: 120 }}
          />
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddWatch}
          />
        </Space>
      </div>

      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        {variables.length === 0 ? (
          <Empty description="暂无监视变量" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={variables}
            renderItem={(variable) => (
              <List.Item
                style={{ padding: '4px 0' }}
                actions={[
                  <Tooltip title={variable.expanded ? '折叠' : '展开'}>
                    <Button
                      size="small"
                      type="text"
                      icon={variable.expanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => onToggleExpand(variable.name)}
                    />
                  </Tooltip>,
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveWatch(variable.name)}
                  />
                ]}
              >
                <div style={{ width: '100%' }}>
                  <div>
                    <span style={{ color: '#9cdcfe', fontWeight: 500 }}>{variable.name}</span>
                    <span style={{ color: '#6a9955', marginLeft: 8 }}>
                      {variable.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {renderValue(variable)}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

/**
 * CallStackPanel - Shows the current call stack
 */
export const CallStackPanel = ({ stepController, style = {} }) => {
  const [callStack, setCallStack] = useState([]);

  useEffect(() => {
    const update = ({ callStack }) => setCallStack(callStack);
    stepController.addListener(update);
    return () => stepController.removeListener(update);
  }, [stepController]);

  return (
    <div style={{ padding: 8, ...style }}>
      <div style={{ fontWeight: 500, marginBottom: 8, color: '#fff' }}>
        <ConsoleSqlOutlined /> 调用栈
      </div>
      <div style={{ maxHeight: 150, overflow: 'auto' }}>
        {callStack.length === 0 ? (
          <Empty description="暂无调用信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={[...callStack].reverse()}
            renderItem={(frame, index) => (
              <List.Item style={{ padding: '2px 0' }}>
                <Tag color={index === 0 ? 'blue' : 'default'}>
                  {frame.depth || index}
                </Tag>
                <span style={{ color: '#d4d4d4', fontSize: 12 }}>
                  {frame.name || `<anonymous:${frame.line}>`}
                </span>
                <span style={{ color: '#6a9955', fontSize: 11, marginLeft: 8 }}>
                  行 {frame.line}
                </span>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

/**
 * BreakpointPanel - Shows all breakpoints
 */
export const BreakpointPanel = ({ breakpointManager, onGoToLine, style = {} }) => {
  const [breakpoints, setBreakpoints] = useState([]);

  useEffect(() => {
    const update = (bps) => setBreakpoints(bps);
    breakpointManager.addListener(update);
    update(breakpointManager.getBreakpoints());
    return () => breakpointManager.removeListener(update);
  }, [breakpointManager]);

  return (
    <div style={{ padding: 8, ...style }}>
      <div style={{ fontWeight: 500, marginBottom: 8, color: '#fff' }}>
        <BugOutlined /> 断点 ({breakpoints.length})
        <Button
          size="small"
          type="text"
          icon={<ClearOutlined />}
          onClick={() => breakpointManager.clearAll()}
          style={{ float: 'right' }}
        />
      </div>
      <div style={{ maxHeight: 150, overflow: 'auto' }}>
        {breakpoints.length === 0 ? (
          <Empty description="暂无断点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={breakpoints}
            renderItem={(bp) => (
              <List.Item
                style={{ padding: '2px 0', cursor: 'pointer' }}
                onClick={() => onGoToLine?.(bp.line)}
                actions={[
                  <Tooltip title={bp.enabled ? '禁用' : '启用'}>
                    <Tag color={bp.enabled ? 'red' : 'default'}>
                      {bp.enabled ? '启用' : '禁用'}
                    </Tag>
                  </Tooltip>,
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      breakpointManager.removeBreakpoint(bp.line);
                    }}
                  />
                ]}
              >
                <span style={{ color: '#d4d4d4' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                  行 {bp.line + 1}
                </span>
                {bp.hitCount > 0 && (
                  <Badge count={bp.hitCount} size="small" style={{ marginLeft: 8 }} />
                )}
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

/**
 * DebuggerOutput - Shows debug output and console
 */
export const DebuggerOutput = ({ output = [], style = {} }) => {
  return (
    <div style={{
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 12,
      padding: 8,
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      maxHeight: 200,
      overflow: 'auto',
      ...style
    }}>
      {output.length === 0 ? (
        <div style={{ color: '#6a9955', fontStyle: 'italic' }}>
          调试输出将显示在这里...
        </div>
      ) : (
        output.map((entry, index) => (
          <div
            key={index}
            style={{
              color: entry.type === 'error' ? '#f48771' :
                     entry.type === 'warn' ? '#cca700' :
                     entry.type === 'info' ? '#6cb6ff' :
                     entry.type === 'debug' ? '#9cdcfe' : '#d4d4d4',
              marginBottom: 2,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {entry.type === 'error' && '[错误] '}
            {entry.type === 'warn' && '[警告] '}
            {entry.type === 'info' && '[信息] '}
            {entry.type === 'debug' && '[调试] '}
            {entry.prefix && `[${entry.prefix}] `}
            {entry.message}
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================================
// Main Debugger Component
// ============================================================================

/**
 * CodeDebugger - Complete debugger component for integration with editors
 */
export const CodeDebugger = ({
  code = '',
  language = 'python', // python, cpp, javascript
  onExecute = null,
  onPause = null,
  onStop = null,
  initialVariables = {},
  executionEngine = null // Optional custom execution engine
}) => {
  const [debuggerState, setDebuggerState] = useState(DebuggerState.IDLE);
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState([]);

  const breakpointManagerRef = useRef(new BreakpointManager());
  const stepControllerRef = useRef(new StepController());
  const variableWatcherRef = useRef(new VariableWatcher());
  const codeLinesRef = useRef(code.split('\n'));

  // Sync code lines
  useEffect(() => {
    codeLinesRef.current = code.split('\n');
  }, [code]);

  // Sync initial variables
  useEffect(() => {
    variableWatcherRef.current.updateScope(initialVariables);
  }, [initialVariables]);

  // Listen to step controller
  useEffect(() => {
    const update = ({ state, currentLine: line }) => {
      setDebuggerState(state);
      setCurrentLine(line);
    };
    stepControllerRef.current.addListener(update);
    return () => stepControllerRef.current.removeListener(update);
  }, []);

  // Start debugging
  const handleStart = useCallback(() => {
    setOutput([]);
    setCurrentLine(0);
    stepControllerRef.current.reset();
    stepControllerRef.current.setState(DebuggerState.RUNNING);
    breakpointManagerRef.current.clearAll();

    if (executionEngine) {
      // Use custom execution engine with debugging
      executeWithDebugger();
    } else {
      // Default execution with basic debugging
      executeCode();
    }
  }, []);

  // Execute code with debugging capabilities
  const executeWithDebugger = async () => {
    const lines = codeLinesRef.current;

    for (let i = 0; i < lines.length; i++) {
      if (!stepControllerRef.current) break;

      const state = stepControllerRef.current.state;

      // Check for stop
      if (state === DebuggerState.STOPPED) break;

      // Check for pause
      if (state === DebuggerState.PAUSED) {
        await waitForResume();
      }

      // Handle step modes
      if (state === DebuggerState.STEP_OVER) {
        stepControllerRef.current.setCurrentLine(i);
        // Execute current line and continue
      } else if (state === DebuggerState.STEP_INTO) {
        stepControllerRef.current.setCurrentLine(i);
        // Would enter function calls
      } else if (state === DebuggerState.STEP_OUT) {
        // Run until current function returns
        if (stepControllerRef.current.stepDepth > 0) {
          stepControllerRef.current.setCurrentLine(i);
        } else {
          stepControllerRef.current.setState(DebuggerState.RUNNING);
        }
      }

      // Check breakpoint
      if (breakpointManagerRef.current.isBreakpoint(i) &&
          breakpointManagerRef.current.isEnabled(i)) {
        breakpointManagerRef.current.incrementHitCount(i);
        stepControllerRef.current.setState(DebuggerState.PAUSED);
        stepControllerRef.current.setCurrentLine(i);
        break;
      }

      setCurrentLine(i);
      setOutput(prev => [...prev, {
        type: 'debug',
        prefix: `行 ${i + 1}`,
        message: lines[i]
      }]);

      // Small delay for UI update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    stepControllerRef.current.setState(DebuggerState.STOPPED);
    setOutput(prev => [...prev, {
      type: 'info',
      message: '=== 调试结束 ==='
    }]);
  };

  // Default code execution (simplified for demonstration)
  const executeCode = async () => {
    const lines = codeLinesRef.current;

    for (let i = 0; i < lines.length; i++) {
      if (!stepControllerRef.current || stepControllerRef.current.state === DebuggerState.STOPPED) {
        break;
      }

      while (stepControllerRef.current.state === DebuggerState.PAUSED) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (breakpointManagerRef.current.isBreakpoint(i) &&
          breakpointManagerRef.current.isEnabled(i)) {
        breakpointManagerRef.current.incrementHitCount(i);
        stepControllerRef.current.setState(DebuggerState.PAUSED);
        stepControllerRef.current.setCurrentLine(i);
        break;
      }

      setCurrentLine(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    stepControllerRef.current.setState(DebuggerState.STOPPED);
  };

  const waitForResume = () => {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (stepControllerRef.current?.state !== DebuggerState.PAUSED) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  };

  // Pause execution
  const handlePause = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.PAUSED);
    setOutput(prev => [...prev, {
      type: 'info',
      message: '=== 暂停 ==='
    }]);
    onPause?.();
  }, [onPause]);

  // Continue execution
  const handleContinue = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.RUNNING);
    setOutput(prev => [...prev, {
      type: 'info',
      message: '=== 继续 ==='
    }]);
  }, []);

  // Stop debugging
  const handleStop = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.STOPPED);
    setOutput(prev => [...prev, {
      type: 'info',
      message: '=== 停止 ==='
    }]);
    onStop?.();
  }, [onStop]);

  // Step over
  const handleStepOver = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.STEP_OVER);
  }, []);

  // Step into
  const handleStepInto = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.STEP_INTO);
  }, []);

  // Step out
  const handleStepOut = useCallback(() => {
    stepControllerRef.current?.setState(DebuggerState.STEP_OUT);
  }, []);

  // Toggle breakpoint
  const handleToggleBreakpoint = useCallback((line) => {
    breakpointManagerRef.current.toggleBreakpoint(line);
  }, []);

  // Add watch
  const handleAddWatch = useCallback((name) => {
    variableWatcherRef.current.watch(name, initialVariables[name], typeof initialVariables[name]);
  }, [initialVariables]);

  // Remove watch
  const handleRemoveWatch = useCallback((name) => {
    variableWatcherRef.current.unwatch(name);
  }, []);

  // Toggle expand
  const handleToggleExpand = useCallback((name) => {
    variableWatcherRef.current.toggleExpand(name);
  }, []);

  // Go to line
  const handleGoToLine = useCallback((line) => {
    setCurrentLine(line);
  }, []);

  return {
    // State
    debuggerState,
    currentLine,
    output,

    // Managers (for direct access if needed)
    breakpointManager: breakpointManagerRef.current,
    stepController: stepControllerRef.current,
    variableWatcher: variableWatcherRef.current,

    // UI Components
    DebuggerControlBar: (props) => (
      <DebuggerControlBar
        {...props}
        debuggerState={debuggerState}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onStepOver={handleStepOver}
        onStepInto={handleStepInto}
        onStepOut={handleStepOut}
        onContinue={handleContinue}
      />
    ),

    WatchPanel: (props) => (
      <WatchPanel
        {...props}
        variableWatcher={variableWatcherRef.current}
        onAddWatch={handleAddWatch}
        onRemoveWatch={handleRemoveWatch}
        onToggleExpand={handleToggleExpand}
      />
    ),

    CallStackPanel: (props) => (
      <CallStackPanel
        {...props}
        stepController={stepControllerRef.current}
      />
    ),

    BreakpointPanel: (props) => (
      <BreakpointPanel
        {...props}
        breakpointManager={breakpointManagerRef.current}
        onGoToLine={handleGoToLine}
      />
    ),

    DebuggerOutput,

    // Breakpoint gutter for code display
    BreakpointGutter: (props) => (
      <BreakpointGutter
        {...props}
        breakpointManager={breakpointManagerRef.current}
        onBreakpointClick={handleToggleBreakpoint}
      />
    ),

    // Line renderer with current line highlighting
    renderCodeLines: (customRender) => {
      const lines = codeLinesRef.current;
      return lines.map((line, index) => {
        const isCurrentLine = index === currentLine;
        const hasBreakpoint = breakpointManagerRef.current.isBreakpoint(index);
        const isBreakpointEnabled = breakpointManagerRef.current.isEnabled(index);

        return customRender?.(line, index, {
          isCurrentLine,
          hasBreakpoint,
          isBreakpointEnabled,
          onToggleBreakpoint: () => handleToggleBreakpoint(index)
        }) || (
          <div
            key={index}
            style={{
              display: 'flex',
              backgroundColor: isCurrentLine ? 'rgba(86, 156, 214, 0.2)' : 'transparent',
              borderLeft: hasBreakpoint
                ? `3px solid ${isBreakpointEnabled ? '#f5222d' : '#999'}`
                : '3px solid transparent',
              paddingLeft: 4,
              cursor: 'pointer'
            }}
            onClick={() => handleToggleBreakpoint(index)}
          >
            <span style={{ color: '#858585', width: 40, textAlign: 'right', marginRight: 8 }}>
              {index + 1}
            </span>
            <span style={{ color: isCurrentLine ? '#fff' : '#d4d4d4' }}>
              {line || ' '}
            </span>
          </div>
        );
      });
    },

    // Actions
    start: handleStart,
    pause: handlePause,
    continue: handleContinue,
    stop: handleStop,
    stepOver: handleStepOver,
    stepInto: handleStepInto,
    stepOut: handleStepOut,
    toggleBreakpoint: handleToggleBreakpoint,
    addWatch: handleAddWatch,
    removeWatch: handleRemoveWatch,
    clearOutput: () => setOutput([])
  };
};

// ============================================================================
// Integration Helper - Hook for React components
// ============================================================================

export const useDebugger = (code, language = 'python', initialVariables = {}) => {
  const debuggerRef = useRef(null);

  if (!debuggerRef.current) {
    debuggerRef.current = CodeDebugger({
      code,
      language,
      initialVariables
    });
  }

  // Update code when it changes
  useEffect(() => {
    debuggerRef.current?.breakpointManager; // Reference to keep alive
  }, []);

  return debuggerRef.current;
};

// ============================================================================
// Debugger Panel Layout Component
// ============================================================================

export const DebuggerPanelLayout = ({
  code,
  language,
  initialVariables,
  showWatch = true,
  showCallStack = true,
  showBreakpoints = true,
  showOutput = true,
  style = {}
}) => {
  const debuggerApi = useDebugger(code, language, initialVariables);
  const [activeTab, setActiveTab] = useState('watch');

  const tabs = [];
  if (showWatch) tabs.push({ key: 'watch', label: '监视' });
  if (showCallStack) tabs.push({ key: 'callstack', label: '调用栈' });
  if (showBreakpoints) tabs.push({ key: 'breakpoints', label: '断点' });
  if (showOutput) tabs.push({ key: 'output', label: '输出' });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'watch':
        return <debuggerApi.WatchPanel />;
      case 'callstack':
        return <debuggerApi.CallStackPanel />;
      case 'breakpoints':
        return <debuggerApi.BreakpointPanel />;
      case 'output':
        return <debuggerApi.DebuggerOutput output={debuggerApi.output} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#252526',
      borderLeft: '1px solid #444',
      ...style
    }}>
      {/* Control Bar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #444',
        backgroundColor: '#323233'
      }}>
        <debuggerApi.DebuggerControlBar />
      </div>

      {/* Debugger Status */}
      <div style={{
        padding: '4px 12px',
        borderBottom: '1px solid #444',
        backgroundColor: '#2d2d2d',
        fontSize: 12
      }}>
        <Space>
          <Badge
            status={
              debuggerApi.debuggerState === DebuggerState.RUNNING ? 'processing' :
              debuggerApi.debuggerState === DebuggerState.PAUSED ? 'warning' :
              debuggerApi.debuggerState === DebuggerState.STOPPED ? 'default' : 'default'
            }
          />
          <span style={{ color: '#d4d4d4' }}>
            {debuggerApi.debuggerState === DebuggerState.IDLE && '就绪'}
            {debuggerApi.debuggerState === DebuggerState.RUNNING && '运行中'}
            {debuggerApi.debuggerState === DebuggerState.PAUSED && `已暂停 - 行 ${debuggerApi.currentLine + 1}`}
            {debuggerApi.debuggerState === DebuggerState.STOPPED && '已停止'}
          </span>
        </Space>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #444'
        }}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                color: activeTab === tab.key ? '#fff' : '#858585',
                borderBottom: activeTab === tab.key ? '2px solid #1890ff' : '2px solid transparent',
                fontSize: 13
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div style={{ height: 'calc(100% - 37px)', overflow: 'auto' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default CodeDebugger;
