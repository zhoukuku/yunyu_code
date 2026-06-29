import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Progress, Spin, message, List, Tag, Divider, Tabs, Slider, Tooltip, Select, Space } from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleOutlined, PlayCircleOutlined, BookOutlined, FilePdfOutlined, DownloadOutlined, VideoCameraOutlined, PauseOutlined, SoundOutlined, MutedOutlined, ExpandOutlined, CompressOutlined, CodeOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';
import { getLessonDetail, markLessonCompleted, markLessonIncomplete, getCourseLessonProgress, getVideoProgress, saveVideoProgress, markVideoCompleted } from '../../services/api';
import PptViewer from '../../components/PptViewer';
import './index.less';

// ============================================================================
// Code Executor - Client-side Python execution engine (simplified version)
// ============================================================================
class LessonCodeExecutor {
  constructor(onOutput, onError) {
    this.onOutput = onOutput;
    this.onError = onError;
    this.output = [];
    this.running = false;
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
      return '[' + v.map(x => this._formatValue(x)).join(', ') + ']';
    }
    if (typeof v === 'object') {
      const entries = Object.entries(v);
      return '{' + entries.map(([k, val]) => `${this._formatValue(k)}: ${this._formatValue(val)}`).join(', ') + '}';
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

    const safeBuiltins = {
      'print': (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')),
      'len': (x) => x == null ? 0 : (typeof x === 'string' || Array.isArray(x) ? x.length : typeof x === 'object' ? Object.keys(x).length : 0),
      'range': (...args) => {
        if (args.length === 0) return [];
        const start = args.length > 1 ? args[0] : 0;
        const end = args.length > 1 ? args[1] : args[0];
        const step = args.length > 2 ? args[2] : 1;
        if (step === 0) throw new Error('range() arg 3 must not zero');
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
      'abs': Math.abs,
      'min': (...args) => { if (args.length === 0) return Infinity; if (args.length === 1 && Array.isArray(args[0])) return Math.min(...args[0]); return Math.min(...args); },
      'max': (...args) => { if (args.length === 0) return -Infinity; if (args.length === 1 && Array.isArray(args[0])) return Math.max(...args[0]); return Math.max(...args); },
      'sum': (arr) => { if (!arr || !Array.isArray(arr)) return 0; return arr.reduce((a, b) => a + (Number(b) || 0), 0); },
      'round': (x, digits = 0) => { const factor = Math.pow(10, digits); return Math.round(x * factor) / factor; },
      'sorted': (arr, reverse = false) => { if (!arr || !Array.isArray(arr)) return []; const result = [...arr].sort((a, b) => a < b ? -1 : a > b ? 1 : 0); return reverse ? result.reverse() : result; },
      'reversed': (arr) => { if (!arr || !Array.isArray(arr)) return []; return [...arr].reverse(); },
      'enumerate': function* (arr, start = 0) { let i = start; for (const x of arr || []) { yield [i++, x]; } },
      'type': (x) => { if (x === null) return 'NoneType'; if (Array.isArray(x)) return "<class 'list'>"; if (typeof x === 'object') return "<class 'dict'>"; return typeof x; },
      'isinstance': (x, t) => { if (t === 'int') return Number.isInteger(x); if (t === 'float') return typeof x === 'number' && !Number.isInteger(x); if (t === 'str') return typeof x === 'string'; if (t === 'bool') return typeof x === 'boolean'; if (t === 'list') return Array.isArray(x); if (t === 'dict') return typeof x === 'object' && x !== null; return false; },
      'chr': (n) => String.fromCharCode(n),
      'ord': (c) => c.charCodeAt(0),
    };

    const mathNamespace = {
      'pi': Math.PI, 'e': Math.E, 'sin': Math.sin, 'cos': Math.cos, 'tan': Math.tan,
      'sqrt': Math.sqrt, 'pow': Math.pow, 'floor': Math.floor, 'ceil': Math.ceil,
      'log': Math.log, 'log10': Math.log10, 'exp': Math.exp,
    };

    const pythonToJS = (code) => {
      let lines = code.split('\n');
      let result = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/^\s*$/.test(line) || /^\s*#/.test(line)) continue;
        line = line.replace(/\belif\b/g, 'else if');
        line = line.replace(/print\s*\((.*)\)\s*$/, (_, args) => `__print(${args})`);
        line = line.replace(/range\s*\(\s*(\d+)\s*\)/g, 'Array.from({length: $1}, (_, i) => i)');
        line = line.replace(/range\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');
        line = line.replace(/\band\b/g, '&&');
        line = line.replace(/\bor\b/g, '||');
        line = line.replace(/\bnot\b/g, '!');
        line = line.replace(/\bTrue\b/g, 'true');
        line = line.replace(/\bFalse\b/g, 'false');
        line = line.replace(/\bNone\b/g, 'null');
        result.push(line);
      }
      return result.join('\n');
    };

    try {
      const jsCode = pythonToJS(code);
      // Build deduplicated parameter list to avoid "Duplicate parameter name" in strict mode
      const rawContextKeys = Object.keys(safeBuiltins);
      const rawContextValues = Object.values(safeBuiltins);
      const mathKeys = Object.keys(mathNamespace);
      const mathValues = Object.values(mathNamespace);

      // Deduplicate: builtins first, then math
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
      // Track which math keys survived dedup
      const mathSurvivedIndices = [];
      for (let i = 0; i < mathKeys.length; i++) {
        if (!seen.has(mathKeys[i])) {
          seen.add(mathKeys[i]);
          mathSurvivedIndices.push(i);
          allParamNames.push(mathKeys[i]);
          allParamValues.push(mathValues[i]);
        }
      }

      // Build math object with surviving keys
      const mathObjEntries = mathSurvivedIndices.map(i => mathKeys[i]).join(', ');
      const mathObjCode = mathObjEntries ? `const __math = {${mathObjEntries}};` : 'const __math = {};';

      const fn = new Function(
        ...allParamNames, '__print',
        `"use strict"; ${mathObjCode} return (async () => { try { ${jsCode} } catch (__py_error) { throw new Error(\`Python执行错误: \${__py_error.message}\`); } })()`
      );

      await fn(...allParamValues, (...args) => this.log(args.map(a => this._formatValue(a)).join(' ')));
      this.log('\n=== 执行完成 ===', 'info');
    } catch (e) {
      this.error(`\n=== 执行错误 ===\n${e.message}`);
    } finally {
      this.running = false;
    }
  }

  generateCppCode(code) {
    let cpp = `// Auto-generated C++ code
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

`;
    const lines = code.split('\n');
    for (const line of lines) {
      let processed = line.trim();
      if (!processed || processed === '{' || processed === '}') continue;
      processed = processed.replace(/const\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
      processed = processed.replace(/let\s+(\w+)\s*=\s*(.+?);/g, 'auto $1 = $2;');
      processed = processed.replace(/console\.log\(/g, 'cout << ');
      processed = processed.replace(/Math\./g, '');
      processed = processed.replace(/\+\s*"([^"]*)"/g, ' << "$1"');
      if (processed.includes('cout <<') && !processed.includes('<< endl')) {
        processed = processed.replace(/;$/, ' << endl;');
      }
      if (processed) cpp += '    ' + processed + '\n';
    }
    cpp += `
    return 0;
}
`;
    return cpp;
  }

  stop() {
    this.running = false;
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Default code templates for different languages
const DEFAULT_PYTHON_CODE = `# 在这里编写Python代码
print("Hello, World!")

# 尝试一些基本操作
numbers = [1, 2, 3, 4, 5]
print("列表:", numbers)
print("总和:", sum(numbers))
`;

const DEFAULT_CPP_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`;

const DEFAULT_SCRATCH_BLOCKS = `<xml>
  <block type="event_whenflagclicked" x="0" y="0">
    <next>
      <block type="motion_movesteps">
        <value name="STEPS">
          <shadow type="math_number">
            <field name="NUM">10</field>
          </shadow>
        </value>
      </block>
    </next>
  </block>
</xml>`;

export default function LessonPage() {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [courseProgress, setCourseProgress] = useState([]);
  const [initialVideoTime, setInitialVideoTime] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const lastSaveTimeRef = useRef(0);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Code editor state
  const [codeLanguage, setCodeLanguage] = useState('python'); // python, cpp, scratch
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE);
  const [codeOutput, setCodeOutput] = useState([]);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [codeExecutor] = useState(() => new LessonCodeExecutor(
    (entry) => { if (entry.clear) setCodeOutput([]); else setCodeOutput(prev => [...prev, entry]); },
    (entry) => setCodeOutput(prev => [...prev, entry])
  ));
  const [courseHierarchy, setCourseHierarchy] = useState(null);

  useEffect(() => {
    if (lessonId) {
      loadLessonDetail();
      loadVideoProgress();
    }
  }, [lessonId]);

  useEffect(() => {
    if (courseId) {
      loadCourseProgress();
    }
  }, [courseId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!videoRef.current || !lesson?.videoUrl) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lesson, videoDuration]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const loadLessonDetail = async () => {
    try {
      setLoading(true);
      const res = await getLessonDetail(lessonId);
      if (res.status === 200 && res.result) {
        setLesson(res.result);
      } else {
        message.error('课时不存在');
      }
    } catch (e) {
      console.error('加载课时详情失败', e);
      message.error('加载课时详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseProgress = async () => {
    try {
      const res = await getCourseLessonProgress(courseId);
      if (res.status === 200 && res.result) {
        setCourseProgress(res.result);
      }
    } catch (e) {
      console.error('加载课程进度失败', e);
    }
  };

  const loadVideoProgress = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !lessonId) return;

    try {
      const res = await getVideoProgress(lessonId);
      if (res.status === 200 && res.result && res.result.currentTime > 0) {
        setInitialVideoTime(res.result.currentTime);
      }
    } catch (e) {
      console.error('加载视频进度失败', e);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      if (initialVideoTime > 0) {
        videoRef.current.currentTime = initialVideoTime;
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    setVideoTime(currentTime);
    setVideoDuration(duration);

    // Save progress every 10 seconds
    if (currentTime - lastSaveTimeRef.current >= 10) {
      lastSaveTimeRef.current = currentTime;
      handleSaveVideoProgress(currentTime, duration);
    }
  };

  const handleSaveVideoProgress = async (currentTime, duration) => {
    const token = localStorage.getItem('accessToken');
    if (!token || !lessonId) return;

    try {
      await saveVideoProgress(Number(lessonId), Math.floor(currentTime), Math.floor(duration));
    } catch (e) {
      console.error('保存视频进度失败', e);
    }
  };

  const handleVideoEnded = async () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 0;
    setIsPlaying(false);

    // Save final progress
    await handleSaveVideoProgress(duration, duration);

    // Mark video as completed
    const token = localStorage.getItem('accessToken');
    if (token && lessonId) {
      try {
        await markVideoCompleted(Number(lessonId));
      } catch (e) {
        console.error('标记视频完成失败', e);
      }
    }

    // Also mark the lesson as completed
    handleMarkComplete();
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  }, []);

  const handleVolumeChange = useCallback((value) => {
    if (!videoRef.current) return;
    videoRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  }, []);

  const handleProgressChange = useCallback((value) => {
    if (!videoRef.current) return;
    const newTime = (value / 100) * videoDuration;
    videoRef.current.currentTime = newTime;
    setVideoTime(newTime);
  }, [videoDuration]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleMarkComplete = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      message.info('请先登录');
      navigate('/login');
      return;
    }

    try {
      setCompleting(true);
      const res = await markLessonCompleted(lessonId);
      if (res.status === 200) {
        setLesson(prev => ({ ...prev, isCompleted: true }));
        loadCourseProgress();
        message.success('已标记为完成');
      }
    } catch (e) {
      message.error('标记失败，请重试');
    } finally {
      setCompleting(false);
    }
  };

  const handleMarkIncomplete = async () => {
    try {
      setCompleting(true);
      const res = await markLessonIncomplete(lessonId);
      if (res.status === 200) {
        setLesson(prev => ({ ...prev, isCompleted: false }));
        loadCourseProgress();
        message.success('已取消完成标记');
      }
    } catch (e) {
      message.error('操作失败，请重试');
    } finally {
      setCompleting(false);
    }
  };

  // Code execution handlers
  const handleRunCode = async () => {
    if (isCodeRunning) return;
    setIsCodeRunning(true);
    try {
      if (codeLanguage === 'python') {
        await codeExecutor.executePython(code);
      } else if (codeLanguage === 'cpp') {
        const cppCode = codeExecutor.generateCppCode(code);
        setCodeOutput([{ message: '=== C++ 代码已生成 ===', type: 'info', timestamp: Date.now() }]);
        setCodeOutput(prev => [...prev, { message: '\n生成的代码:\n' + cppCode, type: 'code', timestamp: Date.now() }]);
      }
    } finally {
      setIsCodeRunning(false);
    }
  };

  const handleClearCode = () => {
    codeExecutor.clear();
    setCodeOutput([]);
  };

  const handleCodeChange = (value) => {
    setCode(value || '');
  };

  const handleLanguageChange = (lang) => {
    setCodeLanguage(lang);
    if (lang === 'python') {
      setCode(DEFAULT_PYTHON_CODE);
    } else if (lang === 'cpp') {
      setCode(DEFAULT_CPP_CODE);
    }
    handleClearCode();
  };

  // Get course hierarchy from course data when lesson is loaded
  useEffect(() => {
    if (lesson?.courseId) {
      // Try to determine hierarchy from course info if available
      // Default to scratch for now, can be enhanced with actual course data
    }
  }, [lesson]);

  const handleNavigateToLesson = (targetLessonId) => {
    navigate(`/courses/${courseId}/lessons/${targetLessonId}`);
  };

  if (loading) {
    return (
      <div className="lesson-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="lesson-page">
        <Card>
          <div style={{ textAlign: 'center', padding: 50 }}>
            <h2>课时不存在</h2>
            <Button type="primary" onClick={() => navigate(`/course-detail/${courseId}`)}>
              返回课程详情
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const completedCount = courseProgress.filter(l => l.isCompleted).length;
  const totalCount = courseProgress.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const currentLessonIndex = courseProgress.findIndex(l => l.id === Number(lessonId));

  return (
    <div className="lesson-page">
      <Button icon={<LeftOutlined />} onClick={() => navigate(`/course-detail/${courseId}`)} style={{ marginBottom: 16 }}>
        返回课程详情
      </Button>

      <Row gutter={[24, 24]}>
        {/* Main content area */}
        <Col xs={24} lg={16}>
          {/* Tabs for all content types */}
          <Card title={lesson.lessonName}>
            <Tabs
              defaultActiveKey={lesson.videoUrl ? 'video' : 'content'}
              style={{ marginTop: 0 }}
              items={[
                {
                  key: 'video',
                  label: (
                    <span>
                      <VideoCameraOutlined />
                      视频
                    </span>
                  ),
                  children: lesson.videoUrl ? (
                    <div
                      ref={containerRef}
                      className="video-wrapper"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <video
                        ref={videoRef}
                        src={lesson.videoUrl}
                        preload="metadata"
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onEnded={handleVideoEnded}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onClick={togglePlay}
                        style={{ width: '100%', borderRadius: 8, cursor: 'pointer' }}
                      >
                        您的浏览器不支持视频播放
                      </video>

                      {/* Custom Controls */}
                      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
                        {/* Progress Bar */}
                        <div className="video-progress">
                          <Slider
                            value={videoDuration > 0 ? (videoTime / videoDuration) * 100 : 0}
                            onChange={handleProgressChange}
                            tooltip={{ formatter: (v) => formatTime((v / 100) * videoDuration) }}
                          />
                        </div>

                        <div className="video-controls-bottom">
                          {/* Play/Pause */}
                          <Button
                            type="text"
                            icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                            onClick={togglePlay}
                            className="control-btn"
                          />

                          {/* Time Display */}
                          <span className="time-display">
                            {formatTime(videoTime)} / {formatTime(videoDuration)}
                          </span>

                          <div className="controls-right">
                            {/* Volume */}
                            <div className="volume-control">
                              <Button
                                type="text"
                                icon={isMuted || volume === 0 ? <MutedOutlined /> : <SoundOutlined />}
                                onClick={toggleMute}
                                className="control-btn"
                              />
                              <Slider
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                              />
                            </div>

                            {/* Fullscreen */}
                            <Button
                              type="text"
                              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                              onClick={toggleFullscreen}
                              className="control-btn"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Play button overlay when paused */}
                      {!isPlaying && (
                        <div className="play-overlay" onClick={togglePlay}>
                          <PlayCircleOutlined style={{ fontSize: 64, color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="video-placeholder">
                      <PlayCircleOutlined style={{ fontSize: 64, color: '#ccc' }} />
                      <p>暂无视频内容</p>
                    </div>
                  ),
                },
                {
                  key: 'content',
                  label: (
                    <span>
                      <BookOutlined />
                      图文内容
                    </span>
                  ),
                  children: lesson.content ? (
                    <div
                      className="lesson-content"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      <BookOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>暂无图文内容</p>
                    </div>
                  ),
                },
                {
                  key: 'ppt',
                  label: (
                    <span>
                      <FilePdfOutlined />
                      课件
                    </span>
                  ),
                  children: lesson.pptUrl ? (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => window.open(lesson.pptUrl, '_blank')}
                        >
                          下载课件
                        </Button>
                      </div>
                      <PptViewer pptUrl={lesson.pptUrl} lessonName={lesson.lessonName} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      <FilePdfOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>暂无课件</p>
                    </div>
                  ),
                },
                {
                  key: 'code',
                  label: (
                    <span>
                      <CodeOutlined />
                      代码练习
                    </span>
                  ),
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
                      {/* Code editor toolbar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#323233',
                        borderBottom: '1px solid #444'
                      }}>
                        <Space>
                          <Select
                            value={codeLanguage}
                            onChange={handleLanguageChange}
                            style={{ width: 120 }}
                            size="small"
                            options={[
                              { value: 'python', label: 'Python' },
                              { value: 'cpp', label: 'C++' },
                            ]}
                          />
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={handleRunCode}
                            disabled={isCodeRunning}
                            size="small"
                          >
                            运行
                          </Button>
                          <Button
                            icon={<ClearOutlined />}
                            onClick={handleClearCode}
                            size="small"
                          >
                            清空
                          </Button>
                        </Space>
                        <Button
                          icon={<SaveOutlined />}
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            message.success('代码已复制到剪贴板');
                          }}
                        >
                          复制代码
                        </Button>
                      </div>

                      {/* Code editor area */}
                      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <textarea
                          value={code}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          style={{
                            flex: 1,
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: 14,
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            border: 'none',
                            padding: '12px',
                            resize: 'none',
                            lineHeight: 1.6,
                          }}
                          placeholder="在这里编写代码..."
                          spellCheck={false}
                        />
                      </div>

                      {/* Output area */}
                      <div style={{
                        height: '180px',
                        background: '#1e1e1e',
                        borderTop: '1px solid #444',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{
                          padding: '4px 12px',
                          background: '#323233',
                          color: '#fff',
                          fontSize: 12,
                          borderBottom: '1px solid #444'
                        }}>
                          输出 {isCodeRunning && <Tag color="blue" style={{ marginLeft: 8 }}>运行中</Tag>}
                        </div>
                        <div style={{
                          flex: 1,
                          overflow: 'auto',
                          padding: 8,
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: 13,
                        }}>
                          {codeOutput.length === 0 && (
                            <div style={{ color: '#888' }}>代码输出将显示在这里...</div>
                          )}
                          {codeOutput.map((entry, idx) => (
                            <div key={idx} style={{
                              color: entry.type === 'error' ? '#ff6b6b' :
                                     entry.type === 'warn' ? '#ffd93d' :
                                     entry.type === 'info' ? '#6bcbff' :
                                     entry.type === 'code' ? '#98d8aa' : '#fff',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}>
                              {entry.type === 'error' && <span style={{ color: '#ff6b6b' }}>[错误] </span>}
                              {entry.type === 'warn' && <span style={{ color: '#ffd93d' }}>[警告] </span>}
                              {entry.type === 'info' && <span style={{ color: '#6bcbff' }}>[信息] </span>}
                              {entry.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          {/* Navigation buttons */}
          <Card style={{ marginTop: 24 }}>
            <div className="lesson-navigation">
              {lesson.prevLesson ? (
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => handleNavigateToLesson(lesson.prevLesson.id)}
                >
                  上一课：{lesson.prevLesson.lessonName}
                </Button>
              ) : (
                <Button disabled icon={<LeftOutlined />}>已是第一节</Button>
              )}

              {lesson.nextLesson ? (
                <Button
                  type="primary"
                  onClick={() => handleNavigateToLesson(lesson.nextLesson.id)}
                >
                  下一课：{lesson.nextLesson.lessonName} <RightOutlined />
                </Button>
              ) : (
                <Button type="primary" disabled>已是最后一节</Button>
              )}
            </div>
          </Card>
        </Col>

        {/* Sidebar - course progress and lesson list */}
        <Col xs={24} lg={8}>
          {/* Progress card */}
          <Card title="学习进度" className="progress-card">
            <Progress
              type="circle"
              percent={progressPercent}
              format={() => `${completedCount}/${totalCount}`}
              size={100}
            />
            <Divider />
            <List
              size="small"
              dataSource={courseProgress}
              locale={{ emptyText: '暂无课时信息' }}
              renderItem={(item, index) => (
                <List.Item
                  className={`lesson-list-item ${item.id === Number(lessonId) ? 'active' : ''} ${item.isCompleted ? 'completed' : ''}`}
                  onClick={() => handleNavigateToLesson(item.id)}
                >
                  <List.Item.Meta
                    title={item.lessonName}
                    description={`第 ${index + 1} 节`}
                  />
                  {item.isCompleted ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <PlayCircleOutlined style={{ color: '#1890ff' }} />
                  )}
                </List.Item>
              )}
            />
          </Card>

          {/* Mark complete button */}
          <Card style={{ marginTop: 24 }}>
            <div className="complete-action">
              {lesson.isCompleted ? (
                <>
                  <Tag color="green" style={{ marginBottom: 16 }}>已完成</Tag>
                  <Button block onClick={handleMarkIncomplete} loading={completing}>
                    取消完成标记
                  </Button>
                </>
              ) : (
                <>
                  <Tag color="blue" style={{ marginBottom: 16 }}>未完成</Tag>
                  <Button type="primary" block onClick={handleMarkComplete} loading={completing}>
                    标记为已完成
                  </Button>
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}