import { Button, Radio, message } from 'antd';
import { ConsoleSqlOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';

export default function OutputConsole({
  outputConsole,
  outputVisible,
  outputPanelHeight,
  activeLanguage,
  outputTab,
  setOutputVisible,
  setActiveLanguage,
  setOutputTab,
  handleResizeStart,
  handleClearOutput,
  getPythonCode,
  getCppCode,
  handleRunPython,
  handleRunCpp,
  outputPanelRef,
}) {
  if (!outputVisible) return null;

  return (
    <div
      ref={outputPanelRef}
      className="output-panel"
      style={{ height: outputPanelHeight }}
    >
      {/* Resize handle — drag top edge to resize */}
      <div
        className="output-panel-resize-handle"
        onMouseDown={handleResizeStart}
      >
        <div className="output-panel-resize-grip" />
      </div>

      <div className="panel-header">
        <span className="panel-title">
          <ConsoleSqlOutlined />
          <span>输出控制台</span>
          <Radio.Group value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} size="small">
            <Radio.Button value="scratch">Scratch</Radio.Button>
            <Radio.Button value="python">Python</Radio.Button>
            <Radio.Button value="cpp">C++</Radio.Button>
          </Radio.Group>
        </span>
        <div className="panel-actions">
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
          <Button size="small" icon={<ClearOutlined />} onClick={handleClearOutput}>清空</Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={() => setOutputVisible(false)} />
        </div>
      </div>

      {/* Code Preview Tabs */}
      {activeLanguage !== 'scratch' && (
        <div className="sub-tabs">
          <div
            className={`sub-tab ${outputTab === 'output' ? 'active' : ''}`}
            onClick={() => setOutputTab('output')}
          >
            输出
          </div>
          <div
            className={`sub-tab ${outputTab === 'code' ? 'active' : ''}`}
            onClick={() => setOutputTab('code')}
          >
            代码预览
          </div>
        </div>
      )}

      <div className="output-console">
        {outputTab === 'output' && outputConsole.length === 0 && (
          <div className="output-empty">控制台输出将显示在这里...</div>
        )}

        {/* Error details panel */}
        {outputTab === 'output' && outputConsole.some(e => e.type === 'error') && (
          <div>
            {outputConsole.filter(e => e.type === 'error').map((entry, idx) => (
              <div key={`error-${entry.id ?? idx}`} className="output-entry error">
                <span className="prefix">[错误]</span>
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
          <div key={`entry-${entry.id ?? idx}`} className={`output-entry ${entry.type || 'log'}`}>
            {entry.type === 'error' && <span className="prefix">[错误] </span>}
            {entry.type === 'warn' && <span className="prefix">[警告] </span>}
            {entry.type === 'info' && <span className="prefix">[信息] </span>}
            {entry.type === 'code' && <span className="prefix">    </span>}
            {entry.message}
          </div>
        ))}

        {/* Code preview */}
        {outputTab === 'code' && (
          <div className="code-preview">
            <Button
              size="small"
              className="code-copy-btn"
              onClick={() => {
                const code = activeLanguage === 'python' ? getPythonCode() : getCppCode();
                navigator.clipboard.writeText(code);
                message.success('代码已复制到剪贴板');
              }}
            >
              复制代码
            </Button>
            <pre>
              {activeLanguage === 'python' ? getPythonCode() || '# 暂无Python代码' : getCppCode() || '// 暂无C++代码'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}