import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Space, Tabs, message, Modal, List, Input, Dropdown, Badge, Upload, Radio, Slider, Select, InputNumber } from 'antd';
import { PlayCircleOutlined, StopOutlined, SaveOutlined, ArrowLeftOutlined, BgColorsOutlined, CloudOutlined, FolderOpenOutlined, PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SoundOutlined, CustomerServiceOutlined, DownloadOutlined, ConsoleSqlOutlined, ClearOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createProject, getProjects, getProject, updateProject, deleteProject, updateProjectData, remixProject, getCloudVariables, updateCloudVariables } from '../../services/api';
import { safeGetJSON, safeSetItem } from '../../utils/storage';
import { defineBlocks } from '../../components/blockly/blocks';
import { registerGenerators, registerPythonGenerators } from '../../components/blockly/generators';
import { connectCloudVariablesSocket, subscribeToProject, onVariablesUpdated, onVariableChanged, pushCloudVariableUpdate } from '../../services/socket';
import CodeExecutor from './CodeExecutor';
import ScratchInterpreter from './ScratchInterpreter';
import OutputConsole from './OutputConsole';
import SpritePanel from './SpritePanel';
import {
  STAGE_WIDTH, STAGE_HEIGHT, STAGE_HALF_W, STAGE_HALF_H,
  CANVAS_WIDTH, CANVAS_HEIGHT, COSTUME_CANVAS_SIZE,
  COLLISION_THRESHOLD, MAX_LAYER, MIN_LAYER,
  MIN_SPRITE_SIZE, MAX_SPRITE_SIZE, DEFAULT_SPRITE_SIZE, DEFAULT_DIRECTION,
  MIN_TEMPO, MAX_TEMPO, DEFAULT_TEMPO, DEFAULT_VOLUME,
  DEFAULT_SOUND_DURATION_MS, BLOCKLY_TIMEOUT_MS,
  EVENT_POLL_INTERVAL_MS, EVENT_MAX_WAIT_MS, BROADCAST_AND_WAIT_DELAY_MS,
  AUTOSAVE_INTERVAL_MS, SPRITE_RANDOM_POS_RANGE,
} from './constants';
import { useUpdateSelectedSprite, generateId, normalizeAngle } from './hooks';

const { TextArea } = Input;
const { Dragger } = Upload;

const LOG_PREFIX = '[IDE]';

// ScratchInterpreter is imported from ./ScratchInterpreter.js

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
  const [blocklyError, setBlocklyError] = useState(null); // null | 'loading' | 'error'

  // Runtime state for animation
  const [runtimeState, setRuntimeState] = useState({
    sprites: {},
    running: false,
    threads: [],
  });
  const runtimeStateRef = useRef(runtimeState);
  runtimeStateRef.current = runtimeState; // keep ref in sync for useEffect closures

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
      const user = safeGetJSON('user', {});
      const projects = await getProjects(user.id);
      setCloudProjects(projects.filter(p => p.type === projectType));
    } catch (error) {
      console.error(`${LOG_PREFIX} 获取云端项目列表失败:`, error);
    }
  }, [projectType]);

  // Generate unique ID
  // generateId is imported from ./hooks.js

  // Helper to update the currently selected sprite (shared pattern)
  const updateSelectedSprite = useUpdateSelectedSprite(setSprites, selectedSprite);

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
      // Clean up ScratchInterpreter on unmount to prevent memory leak
      if (runtimeStateRef.current?.interpreter) {
        runtimeStateRef.current.interpreter.destroy();
      }
    };
  }, [location.state]);

  // Auto-save every 60 seconds
  useEffect(() => {
    if (projectId) {
      const timer = setInterval(() => handleAutoSave(), AUTOSAVE_INTERVAL_MS);
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
      direction: DEFAULT_DIRECTION,
      visible: true,
      size: DEFAULT_SPRITE_SIZE,
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
        backdrops: [{ id: generateId(), name: '背景1', dataUrl: createDefaultBackdrop() }],
        currentBackdrop: 0,
      },
    });
  };

  const createDefaultCostume = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = COSTUME_CANVAS_SIZE;
    canvas.height = COSTUME_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    const cx = COSTUME_CANVAS_SIZE / 2, cy = COSTUME_CANVAS_SIZE / 2;

    // Scratch-style cat body
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - 5, 55, 0, Math.PI * 2);
    ctx.fill();

    // Ears (triangles)
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 42);
    ctx.lineTo(cx - 28, cy - 77);
    ctx.lineTo(cx - 13, cy - 42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 48, cy - 42);
    ctx.lineTo(cx + 28, cy - 77);
    ctx.lineTo(cx + 13, cy - 42);
    ctx.closePath();
    ctx.fill();

    // Inner ears
    ctx.fillStyle = '#FFB3B3';
    ctx.beginPath();
    ctx.moveTo(cx - 42, cy - 42);
    ctx.lineTo(cx - 28, cy - 67);
    ctx.lineTo(cx - 18, cy - 42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 42, cy - 42);
    ctx.lineTo(cx + 28, cy - 67);
    ctx.lineTo(cx + 18, cy - 42);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 15, 16, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 20, cy - 15, 16, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - 14, cy - 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 26, cy - 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FF9999';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx - 6, cy + 6);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.closePath();
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx, cy + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 22, cx, cy + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 12);
    ctx.quadraticCurveTo(cx, cy + 22, cx, cy + 18);
    ctx.stroke();

    // Whiskers
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    for (let side = -1; side <= 1; side += 2) {
      for (let dy = -5; dy <= 5; dy += 5) {
        ctx.beginPath();
        ctx.moveTo(cx + side * 25, cy - 2 + dy);
        ctx.lineTo(cx + side * 55, cy - 8 + dy);
        ctx.stroke();
      }
    }

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 73, 45, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
  };

  const createDefaultBackdrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = STAGE_WIDTH;
    canvas.height = STAGE_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Sky gradient backdrop
    const gradient = ctx.createLinearGradient(0, 0, 0, STAGE_HEIGHT);
    gradient.addColorStop(0, '#1a1a4e');
    gradient.addColorStop(0.5, '#3a3a8e');
    gradient.addColorStop(1, '#2a5a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * STAGE_WIDTH;
      const y = Math.random() * STAGE_HALF_H; // Stars only in top sky portion
      const r = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground: bottom 100px with a 5px accent at the grass line
    ctx.fillStyle = '#2a5a2a';
    ctx.fillRect(0, STAGE_HEIGHT - 100, STAGE_WIDTH, 100);
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(0, STAGE_HEIGHT - 100, STAGE_WIDTH, 5);

    return canvas.toDataURL('image/png');
  };

  const loadBlockly = () => {
    // CDN sources ordered by priority (Chinese-friendly CDNs first)
    const cdns = [
      {
        name: 'bootcdn',
        script: 'https://cdn.bootcdn.net/ajax/libs/blockly/9.0.1/blockly_compressed.js',
        css: 'https://cdn.bootcdn.net/ajax/libs/blockly/9.0.1/blockly.css',
        msg: 'https://cdn.bootcdn.net/ajax/libs/blockly/9.0.1/msg/zh-hans.js',
      },
      {
        name: 'jsdelivr',
        script: 'https://cdn.jsdelivr.net/npm/blockly@9.0.1/blockly_compressed.js',
        css: 'https://cdn.jsdelivr.net/npm/blockly@9.0.1/blockly.css',
        msg: 'https://cdn.jsdelivr.net/npm/blockly@9.0.1/msg/zh-hans.js',
      },
      {
        name: 'unpkg',
        script: 'https://unpkg.com/blockly@9.0.1/blockly_compressed.js',
        css: 'https://unpkg.com/blockly@9.0.1/blockly.css',
        msg: 'https://unpkg.com/blockly@9.0.1/msg/zh-hans.js',
      },
      {
        name: 'googleapis',
        script: 'https://blockly.googleapis.com/blockly/latest/blockly_compressed.js',
        css: 'https://blockly.googleapis.com/blockly/latest/blockly.css',
        msg: 'https://blockly.googleapis.com/blockly/latest/msg/zh-hans.js',
      },
    ];

    let cdnIndex = 0;
    let timeoutId = null;

    const clearLoadTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const finalizeBlockly = () => {
      clearLoadTimeout();
      if (window.Blockly) {
        defineBlocks(window.Blockly);
        registerGenerators(window.Blockly);
        registerPythonGenerators(window.Blockly);
        setBlocklyError(null);
        initWorkspace();
      } else {
        setBlocklyError('error');
        console.error('[Blockly] Failed to load Blockly from all CDN sources');
      }
    };

    const tryLoadCss = (cdn, onComplete) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cdn.css;
      link.onload = onComplete;
      link.onerror = () => {
        console.warn(`[Blockly] CSS failed from ${cdn.name}, continuing without`);
        onComplete(); // CSS is non-critical — continue even if it fails
      };
      document.head.appendChild(link);
    };

    const tryLoadMsg = (cdn, onComplete) => {
      const msgScript = document.createElement('script');
      msgScript.src = cdn.msg;
      msgScript.onload = onComplete;
      msgScript.onerror = () => {
        console.warn(`[Blockly] Message script failed from ${cdn.name}, continuing without`);
        onComplete(); // Messages are non-critical — continue even if they fail
      };
      document.head.appendChild(msgScript);
    };

    const tryLoadScript = (index) => {
      if (index >= cdns.length) {
        // All CDNs exhausted
        clearLoadTimeout();
        setBlocklyError('error');
        console.error('[Blockly] All CDN sources exhausted — Blockly could not be loaded');
        return;
      }

      const cdn = cdns[index];
      const script = document.createElement('script');
      script.src = cdn.script;

      script.onload = () => {
        clearLoadTimeout();
        console.debug(`[Blockly] Core script loaded from ${cdn.name}`);
        tryLoadCss(cdn, () => {
          tryLoadMsg(cdn, finalizeBlockly);
        });
      };

      script.onerror = () => {
        console.warn(`[Blockly] Core script failed from ${cdn.name}, trying next CDN...`);
        tryLoadScript(index + 1);
      };

      document.head.appendChild(script);
    };

    // Start the timeout
    setBlocklyError('loading');
    timeoutId = setTimeout(() => {
      console.error(`[Blockly] Loading timed out after ${BLOCKLY_TIMEOUT_MS}ms`);
      setBlocklyError('error');
    }, BLOCKLY_TIMEOUT_MS);

    tryLoadScript(0);
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
            } catch (e) { console.error(`${LOG_PREFIX} Blockly脚本加载失败:`, e); }
          }
        }

        message.success('编程环境已就绪！');
      } catch (e) {
        console.error(`${LOG_PREFIX} Blockly初始化失败:`, e);
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
          { kind: 'block', type: 'event_broadcast' },
          { kind: 'block', type: 'event_broadcastandwait' },
          { kind: 'block', type: 'event_whenbroadcastreceived' },
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
        name: '自制积木',
        colour: '#FF6680',
        custom: 'PROCEDURE',
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
      const layerA = runtimeState.sprites[a.id]?.layer ?? 0;
      const layerB = runtimeState.sprites[b.id]?.layer ?? 0;
      return layerA - layerB;
    });

    sortedSprites.forEach(sprite => {
      const state = runtimeState.sprites[sprite.id] || {};
      if (!state.visible) return;

      const costume = sprite.costumes[state.currentCostume ?? sprite.currentCostume];
      if (!costume?.dataUrl) return;

      const img = new Image();
      img.onload = () => {
        ctx.save();
        const scale = (state.size ?? sprite.size) / 100;
        const radians = ((state.direction ?? sprite.direction) - 90) * Math.PI / 180;
        const drawX = width / 2 + (state.x ?? sprite.x);
        const drawY = height / 2 - (state.y ?? sprite.y);
        ctx.translate(drawX, drawY);
        ctx.rotate(radians);
        ctx.scale(scale, scale);

        // Apply graphic effects
        if (state.graphicEffects) {
          const brightness = state.graphicEffects.brightness ?? 0;
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
        // Merge with existing state to preserve interpreter reference
        setRuntimeState(prev => ({ ...prev, sprites: newState.sprites }));
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
        const costume = sprite?.costumes[state.currentCostume ?? 0];
        if (!costume?.dataUrl) return;
        const img = new Image();
        img.onload = () => {
          ctx.save();
          const scale = (state.size ?? 100) / 100;
          const radians = ((state.direction ?? 90) - 90) * Math.PI / 180;
          const drawX = canvas.width / 2 + (state.x ?? 0);
          const drawY = canvas.height / 2 - (state.y ?? 0);
          ctx.translate(drawX, drawY);
          ctx.rotate(radians);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          ctx.restore();
        };
        img.src = costume.dataUrl;
      },
      onBroadcast: (message) => {
        // Handle broadcast messages
        // Broadcast logged via [ScratchInterpreter] prefix in ScratchInterpreter.js
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
        // Broadcast to other clients via WebSocket
        pushCloudVariableUpdate(projectId, name, String(value));
        // Sync to cloud (REST fallback)
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
        console.error(`${LOG_PREFIX} Execution error:`, e);
      }
    } finally {
      if (interpreter.running) {
        setRuntimeState(prev => ({ ...prev, running: false }));
        setIsRunning(false);
      }
      // Clean up event listeners to prevent memory leaks
      interpreter.destroy();
    }
  };

  // AsyncFunction constructor for running generated code
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

  const handlePlay = () => {
    if (!workspaceRef.current || !window.Blockly) {
      message.warning('编程环境尚未就绪，请稍后再试');
      return;
    }
    try {
      const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current);
      const scriptsXml = window.Blockly.Xml.domToText(xml);

      // Update current sprite's scripts
      setSprites(prev => prev.map(s =>
        s.id === selectedSprite ? { ...s, scripts: scriptsXml } : s
      ));

      // Generate and execute code
      const code = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      setIsRunning(true);
      setOutputVisible(true);
      executeCode(code);
      message.success('项目运行中...');
    } catch (e) {
      console.error(`${LOG_PREFIX} 执行失败:`, e);
      message.error('代码执行失败');
    }
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
    if (!window.Blockly || !workspaceRef.current) return '';
    const jsCode = window.Blockly.JavaScript.workspaceToCode(workspaceRef.current);

    // Prefer CodeExecutor's enhanced generator when available
    if (codeExecutorRef.current) {
      return codeExecutorRef.current.generateCppCode(jsCode);
    }

    // Fallback: use shared line-level transform
    const lines = jsCode.split('\n').filter(l => l.trim());
    let cpp = `// Auto-generated C++ code
// Generated from Blockly/Scratch

#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

`;

    for (const line of lines) {
      const processed = CodeExecutor.transformJsLineToCpp(line.trim());
      if (processed) {
        cpp += `    ${processed}\n`;
      }
    }

    cpp += `
    return 0;
}
`;
    return cpp;
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
  // Output panel resize state
  const outputPanelRef = useRef(null);
  const [outputPanelHeight, setOutputPanelHeight] = useState(200); // default 200px
  const resizeRef = useRef({ isResizing: false, startY: 0, startHeight: 0 });

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    resizeRef.current = {
      isResizing: true,
      startY: e.clientY,
      startHeight: outputPanelRef.current?.offsetHeight || outputPanelHeight,
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [outputPanelHeight]);

  const handleResizeMove = useCallback((e) => {
    if (!resizeRef.current.isResizing) return;
    const dy = resizeRef.current.startY - e.clientY;
    const newHeight = Math.max(100, Math.min(600, resizeRef.current.startHeight + dy));
    setOutputPanelHeight(newHeight);
  }, []);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.isResizing = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

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
      console.error(`${LOG_PREFIX} 云变量同步失败:`, error);
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
      console.error(`${LOG_PREFIX} 获取云变量失败:`, error);
      return { result: null };
    }
  }, []);

  // WebSocket real-time cloud variable sync
  useEffect(() => {
    if (!projectId) return;

    const socket = connectCloudVariablesSocket();
    subscribeToProject(projectId);

    // Listen for batch variable updates from server
    const unsubUpdated = onVariablesUpdated((data) => {
      if (data.projectId === projectId && Array.isArray(data.variables)) {
        setCloudVariables(data.variables);
        setCloudSyncStatus('synced');
        // Update the interpreter's cloud variables if it's running
        if (runtimeStateRef.current.interpreter) {
          data.variables.forEach((cv) => {
            runtimeStateRef.current.interpreter.variables[cv.name] = cv.value;
            runtimeStateRef.current.interpreter.cloudVariables[cv.name] = cv.value;
          });
        }
      }
    });

    // Listen for single variable changes from other clients
    const unsubChanged = onVariableChanged((data) => {
      if (data.projectId === projectId && data.name) {
        setCloudVariables((prev) => {
          const exists = prev.some((v) => v.name === data.name);
          if (exists) {
            return prev.map((v) =>
              v.name === data.name ? { ...v, value: String(data.value) } : v
            );
          }
          return [...prev, { name: data.name, value: String(data.value) }];
        });
        // Update the interpreter's cloud variables if it's running
        if (runtimeStateRef.current.interpreter) {
          runtimeStateRef.current.interpreter.variables[data.name] = String(data.value);
          runtimeStateRef.current.interpreter.cloudVariables[data.name] = String(data.value);
        }
      }
    });

    return () => {
      unsubUpdated();
      unsubChanged();
    };
  }, [projectId]);

  // Sprite management
  const handleAddSprite = () => {
    const newSprite = {
      id: generateId(),
      name: `角色${sprites.length + 1}`,
      x: Math.random() * SPRITE_RANDOM_POS_RANGE - SPRITE_RANDOM_POS_RANGE / 2,
      y: Math.random() * SPRITE_RANDOM_POS_RANGE - SPRITE_RANDOM_POS_RANGE / 2,
      direction: DEFAULT_DIRECTION,
      visible: true,
      size: DEFAULT_SPRITE_SIZE,
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
    updateSelectedSprite({ name: editingSpriteName });
    setSpriteModalVisible(false);
  };

  const handleSelectSprite = (id) => {
    setSelectedSprite(id);
    const sprite = sprites.find(s => s.id === id);
    if (sprite && workspaceRef.current && window.Blockly) {
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
      const next = ((s.currentCostume ?? 0) + 1) % s.costumes.length;
      return { ...s, currentCostume: next };
    }));
  };

  // Go to previous costume (wraps around)
  const handlePrevCostume = () => {
    setSprites(prev => prev.map(s => {
      if (s.id !== selectedSprite) return s;
      const len = s.costumes.length;
      const prev = ((s.currentCostume ?? 0) - 1 + len) % len;
      return { ...s, currentCostume: prev };
    }));
  };

  // Change sprite size (delta from current)
  const handleChangeSize = (delta) => {
    const selected = sprites.find(s => s.id === selectedSprite);
    if (!selected) return;
    const newSize = Math.max(MIN_SPRITE_SIZE, Math.min(MAX_SPRITE_SIZE, (selected.size || DEFAULT_SPRITE_SIZE) + delta));
    updateSelectedSprite({ size: newSize });
  };

  // Set sprite size to specific value
  const handleSetSize = (newSize) => {
    updateSelectedSprite({ size: Math.max(MIN_SPRITE_SIZE, Math.min(MAX_SPRITE_SIZE, newSize)) });
  };

  // Change direction (delta from current)
  const handleChangeDirection = (delta) => {
    const selected = sprites.find(s => s.id === selectedSprite);
    if (!selected) return;
    const newDir = normalizeAngle((selected.direction || DEFAULT_DIRECTION) + delta);
    updateSelectedSprite({ direction: newDir });
  };

  // Set direction to specific value
  const handleSetDirection = (newDirection) => {
    updateSelectedSprite({ direction: normalizeAngle(newDirection) });
  };

  // Set rotation style: 'normal', 'left-right', 'none'
  const handleSetRotationStyle = (style) => {
    updateSelectedSprite({ rotationStyle: style });
  };

  // Toggle sprite visibility
  const handleToggleVisibility = () => {
    const selected = sprites.find(s => s.id === selectedSprite);
    if (!selected) return;
    updateSelectedSprite({ visible: !selected.visible });
  };

  // Reset sprite to center
  const handleResetSpritePosition = () => {
    updateSelectedSprite({ x: 0, y: 0 });
  };

  const selectedSpriteData = sprites.find(s => s.id === selectedSprite);

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
    if (workspaceRef.current && window.Blockly) {
      const xml = window.Blockly.Xml.workspaceToDom(workspaceRef.current);
      return window.Blockly.Xml.domToText(xml);
    }
    return '';
  };

  // Save to local
  const handleSaveLocal = () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    safeSetItem('scratch-project', xmlText);
    safeSetItem('scratch-project-name', projectName);
    safeSetItem('scratch-project-type', projectType);
    safeSetItem('scratch-project-data', data);
    message.success('项目已保存到本地！');
  };

  // Save to cloud
  const handleSaveToCloud = async () => {
    const xmlText = getWorkspaceContent();
    const data = JSON.stringify({ sprites, projectData, cloudVariables });
    const user = safeGetJSON('user', {});

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
      console.error(`${LOG_PREFIX} 保存失败:`, error);
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
      console.error(`${LOG_PREFIX} 自动保存失败:`, error);
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
          console.error(`${LOG_PREFIX} 解析项目数据失败:`, e);
        }
      }

      // Also try to fetch cloud variables from server
      fetchCloudVariables(id).then(result => {
        if (result?.result) {
          setCloudVariables(result.result);
        }
      }).catch((e) => { console.error(`${LOG_PREFIX} 获取云变量失败:`, e); });

      if (workspaceRef.current && window.Blockly && project.content) {
        try {
          const xmlDom = window.Blockly.Xml.textToDom(project.content);
          workspaceRef.current.clear();
          window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        } catch (e) {
          console.error(`${LOG_PREFIX} 加载项目失败:`, e);
          message.error('加载项目失败');
        }
      }

      setLastSavedContent(project.content || '');
      setLastSavedData(project.projectData || '');
      setLoadModalVisible(false);
      message.success('项目加载成功！');
    } catch (error) {
      console.error(`${LOG_PREFIX} 加载项目失败:`, error);
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
      console.error(`${LOG_PREFIX} 删除失败:`, error);
      message.error('删除失败，请重试');
    }
  };

  // Remix (派生) project
  const handleRemixProject = async (id) => {
    const user = safeGetJSON('user', {});
    if (!user.id) {
      message.error('请先登录');
      return;
    }
    try {
      const remixed = await remixProject(id);
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
            console.error(`${LOG_PREFIX} 解析项目数据失败:`, e);
          }
        }
        if (workspaceRef.current && window.Blockly && remixed.content) {
          try {
            const xmlDom = window.Blockly.Xml.textToDom(remixed.content);
            workspaceRef.current.clear();
            window.Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
          } catch (e) {
            console.error(`${LOG_PREFIX} 加载项目失败:`, e);
          }
        }
        setLastSavedContent(remixed.content || '');
        setLastSavedData(remixed.projectData || '');
        setLoadModalVisible(false);
        message.success('已成功派生项目！');
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} 派生失败:`, error);
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
        if (data.content && workspaceRef.current && window.Blockly) {
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
            console.error(`${LOG_PREFIX} 解析项目数据失败:`, err);
          }
        }
        message.success('项目导入成功');
      } catch (err) {
        message.error('项目文件格式错误');
        console.error(`${LOG_PREFIX} 导入失败:`, err);
      }
    };
    reader.readAsText(file);
  };

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
          <Button
            type={outputVisible ? 'primary' : 'default'}
            icon={<ConsoleSqlOutlined />}
            onClick={() => setOutputVisible(!outputVisible)}
          >
            输出
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={() => setLoadModalVisible(true)}>
            打开
          </Button>
          <Dropdown dropdownRender={() => (
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05)' }}>
              <Space direction="vertical" style={{ padding: 8 }}>
                <Button icon={<SaveOutlined />} onClick={handleSaveLocal}>保存到本地</Button>
                <Button icon={<CloudOutlined />} onClick={() => setSaveModalVisible(true)}>保存到云端</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportProject}>导出项目</Button>
                <Dragger showUploadList={false} beforeUpload={(file) => { handleImportProject(file); return false; }} accept=".json">
                  <Button icon={<UploadOutlined />}>导入项目</Button>
                </Dragger>
              </Space>
            </div>
          )}>
            <Button icon={<SaveOutlined />}>保存</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Main content */}
      <div className="ide-content">
        {/* Sprite list panel */}
        <SpritePanel
          sprites={sprites}
          selectedSprite={selectedSprite}
          spriteFeaturesVisible={spriteFeaturesVisible}
          spriteModalVisible={spriteModalVisible}
          editingSpriteName={editingSpriteName}
          setSpriteFeaturesVisible={setSpriteFeaturesVisible}
          setSpriteModalVisible={setSpriteModalVisible}
          setEditingSpriteName={setEditingSpriteName}
          handleSelectSprite={handleSelectSprite}
          handleDeleteSprite={handleDeleteSprite}
        />

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
                    options={selectedSpriteData.costumes.map((c, idx) => ({
                      key: c.id, value: idx, label: c.name
                    }))}
                  />
                </div>
              </div>

              {/* Size Section */}
              <div className="feature-section">
                <div className="feature-section-title">大小</div>
                <div className="size-control">
                  <Slider
                    min={1}
                    max={500}
                    value={selectedSpriteData.size ?? 100}
                    onChange={(val) => handleSetSize(val)}
                    tooltip={{ formatter: (val) => `${val}%` }}
                  />
                  <Space>
                    <Button size="small" onClick={() => handleChangeSize(-10)}>-10</Button>
                    <InputNumber
                      size="small"
                      min={1}
                      max={500}
                      value={selectedSpriteData.size ?? 100}
                      onChange={(val) => handleSetSize(val ?? 100)}
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
                    value={selectedSpriteData.direction ?? 90}
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
                      value={selectedSpriteData.direction ?? 90}
                      onChange={(val) => handleSetDirection(val ?? 90)}
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
                  <span>X: {(selectedSpriteData.x ?? 0).toFixed(0)}</span>
                  <span>Y: {(selectedSpriteData.y ?? 0).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blocks workspace */}
        <div className="blocks-panel">
          {blocklyError === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', color: '#888' }}>
              <div style={{ fontSize: 18, marginBottom: 12 }}>正在加载积木编辑器...</div>
              <div style={{ fontSize: 13, color: '#aaa' }}>正在从CDN加载 Blockly，请稍候</div>
            </div>
          )}
          {blocklyError === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>!</div>
              <div style={{ fontSize: 18, marginBottom: 12, color: '#ff4d4f', fontWeight: 500 }}>
                积木编辑器加载失败
              </div>
              <div style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 1.6, marginBottom: 16, maxWidth: 360 }}>
                无法从 CDN 加载 Blockly。请检查网络连接后刷新页面重试。
                <br />
                如使用的是桌面客户端，请确认已连接互联网。
              </div>
              <Button onClick={() => { setBlocklyError(null); loadBlockly(); }}>
                重试加载
              </Button>
            </div>
          )}
          {!blocklyError && (
            <div id="blocks-editor" className="blocks-editor" />
          )}
        </div>

        {/* Stage */}
        <div className="stage-panel">
          <div className="stage-header">
            <BgColorsOutlined /> 舞台
          </div>
          <div className="stage-content" style={{position:'relative'}}>
            <canvas ref={stageRef} className="stage-canvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            <canvas ref={penRef} className="pen-canvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{position:'absolute',top:0,left:0,pointerEvents:'none'}} />
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
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'scripts', label: '脚本', children: <div className="tab-content">在左侧选择角色，然后在这里为角色编写程序</div> },
          { key: 'costumes', label: '造型', children: selectedSpriteData && (
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
          )},
          { key: 'sounds', label: '声音', children: selectedSpriteData && (
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
          )},
        ]} />
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

      {/* Code Output Panel — fixed bottom, VS Code terminal style */}
      <OutputConsole
        outputConsole={outputConsole}
        outputVisible={outputVisible}
        outputPanelHeight={outputPanelHeight}
        activeLanguage={activeLanguage}
        outputTab={outputTab}
        setOutputVisible={setOutputVisible}
        setActiveLanguage={setActiveLanguage}
        setOutputTab={setOutputTab}
        handleResizeStart={handleResizeStart}
        handleClearOutput={handleClearOutput}
        getPythonCode={getPythonCode}
        getCppCode={getCppCode}
        handleRunPython={handleRunPython}
        handleRunCpp={handleRunCpp}
        outputPanelRef={outputPanelRef}
      />
    </div>
  );
}