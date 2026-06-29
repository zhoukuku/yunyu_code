import { useEffect, useRef, useState } from 'react';
import { Button, Space, Tabs, message } from 'antd';
import { PlayCircleOutlined, StopOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import './index.less';

const { TabPane } = Tabs;

export default function IDEPage() {
  const workspaceRef = useRef<any>(null);
  const [projectName, setProjectName] = useState('未命名项目');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadBlockly();
    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose?.();
      }
    };
  }, []);

  const loadBlockly = () => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/blockly@latest/blockly.min.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/blockly@latest/blockly.min.css';
      link.onload = () => initWorkspace();
      link.onerror = () => message.error('Blockly样式加载失败');
      document.head.appendChild(link);
    };
    script.onerror = () => message.error('Blockly脚本加载失败');
    document.head.appendChild(script);
  };

  const initWorkspace = () => {
    if ((window as any).Blockly) {
      const toolbox = getToolbox();
      const workspace = (window as any).Blockly.inject('blocks-editor', {
        toolbox: toolbox,
        grid: { spacing: 20, length: 3, colour: '#ddd', snap: true },
        trashcan: true,
        zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 2, minScale: 0.5 },
      });
      workspaceRef.current = workspace;
      message.success('Blockly工作区已就绪');
    }
  };

  const getToolbox = () => ({
    kind: 'categoryToolbox',
    contents: [
      { kind: 'category', name: '运动', colour: '#4C97FF', contents: [
        { kind: 'block', type: 'motion_move_steps' },
        { kind: 'block', type: 'motion_turn' },
        { kind: 'block', type: 'motion_goto' },
      ]},
      { kind: 'category', name: '外观', colour: '#9966FF', contents: [
        { kind: 'block', type: 'looks_say' },
        { kind: 'block', type: 'looks_show' },
        { kind: 'block', type: 'looks_hide' },
      ]},
      { kind: 'category', name: '声音', colour: '#CFCF4F', contents: [
        { kind: 'block', type: 'sound_play' },
        { kind: 'block', type: 'sound_stopallsounds' },
      ]},
      { kind: 'category', name: '事件', colour: '#FFBF00', contents: [
        { kind: 'block', type: 'event_whenflagclicked' },
        { kind: 'block', type: 'event_whenkeypressed' },
      ]},
      { kind: 'category', name: '控制', colour: '#FFAB19', contents: [
        { kind: 'block', type: 'control_wait' },
        { kind: 'block', type: 'control_repeat' },
        { kind: 'block', type: 'control_forever' },
      ]},
    ],
  });

  const handlePlay = () => { setIsRunning(true); message.success('项目运行中...'); };
  const handleStop = () => { setIsRunning(false); message.info('已停止'); };
  const handleSave = () => {
    if (workspaceRef.current) {
      const xml = (window as any).Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = (window as any).Blockly.Xml.domToText(xml);
      localStorage.setItem('scratch-project', xmlText);
      message.success('项目已保存');
    }
  };

  return (
    <div className="ide-page">
      <div className="ide-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.back()}>返回</Button>
          <input type="text" className="project-name-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </Space>
        <Space>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handlePlay} disabled={isRunning}>绿旗</Button>
          <Button icon={<StopOutlined />} onClick={handleStop} disabled={!isRunning}>停止</Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>保存</Button>
        </Space>
      </div>
      <div className="ide-content">
        <div className="blocks-panel"><div id="blocks-editor" className="blocks-editor"></div></div>
        <div className="stage-panel">
          <div className="stage-header">舞台</div>
          <div className="stage-content"><div className="stage-canvas">舞台预览区</div></div>
        </div>
      </div>
      <div className="ide-footer"><Tabs defaultActiveKey="scripts"><TabPane tab="脚本" key="scripts" /><TabPane tab="造型" key="costumes" /><TabPane tab="声音" key="sounds" /></Tabs></div>
    </div>
  );
}