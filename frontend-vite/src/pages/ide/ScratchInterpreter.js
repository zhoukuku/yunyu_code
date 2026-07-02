// ============================================================================
// Scratch Interpreter - Complete Blockly Code Execution Engine
// ============================================================================

import {
  STAGE_HALF_W, STAGE_HALF_H,
  COLLISION_THRESHOLD,
  MAX_LAYER, MIN_LAYER,
  MIN_TEMPO, MAX_TEMPO, DEFAULT_TEMPO, DEFAULT_VOLUME,
  DEFAULT_SOUND_DURATION_MS,
  EVENT_POLL_INTERVAL_MS, EVENT_MAX_WAIT_MS,
  BROADCAST_AND_WAIT_DELAY_MS,
} from './constants';

const LOG_PREFIX = '[ScratchInterpreter]';

// MIDI note 60 = C4 = 261.63 Hz
const MIDI_BASE_NOTE = 60;
const MIDI_BASE_FREQ = 261.63;

// Drum sound configurations: type -> { freq (Hz), type (waveform), attack (s), decay (s) }
const DRUM_CONFIGS = {
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
  '12': { freq: 800, type: 'triangle', attack: 0.01, decay: 0.3 },
};

// Mouse offset for approximate stage coordinate mapping
const MOUSE_OFFSET_X = 100;
const MOUSE_OFFSET_Y = 100;

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
    this.cloudVariables = {};
    this.tempo = DEFAULT_TEMPO;
    this.volume = DEFAULT_VOLUME;
    this.broadcastHandlers = new Map();

    // Bind event listeners
    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard events
    this._onKeydown = (e) => {
      this.keyboardState[e.key.toLowerCase()] = true;
      this.keyboardState[e.code] = true;
    };
    this._onKeyup = (e) => {
      this.keyboardState[e.key.toLowerCase()] = false;
      this.keyboardState[e.code] = false;
    };
    // Mouse events
    this._onMousemove = (e) => {
      this.mouseState.x = e.clientX;
      this.mouseState.y = e.clientY;
    };
    this._onMousedown = () => {
      this.mouseState.down = true;
    };
    this._onMouseup = () => {
      this.mouseState.down = false;
    };
    document.addEventListener('keydown', this._onKeydown);
    document.addEventListener('keyup', this._onKeyup);
    document.addEventListener('mousemove', this._onMousemove);
    document.addEventListener('mousedown', this._onMousedown);
    document.addEventListener('mouseup', this._onMouseup);
  }

  _unbindEvents() {
    if (this._onKeydown) {
      document.removeEventListener('keydown', this._onKeydown);
      document.removeEventListener('keyup', this._onKeyup);
      document.removeEventListener('mousemove', this._onMousemove);
      document.removeEventListener('mousedown', this._onMousedown);
      document.removeEventListener('mouseup', this._onMouseup);
      this._onKeydown = null;
      this._onKeyup = null;
      this._onMousemove = null;
      this._onMousedown = null;
      this._onMouseup = null;
    }
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
    const oldX = state.x ?? 0;
    const oldY = state.y ?? 0;
    const newX = oldX + Math.cos(rad) * steps;
    const newY = oldY - Math.sin(rad) * steps;

    // Draw on pen canvas if pen is down
    if (state.penDown) {
      this.callbacks.onPenDraw?.(spriteId, oldX, oldY, newX, newY, state.penColor ?? '#000000', state.penSize ?? 1);
    }

    this._updateState(spriteId, { x: newX, y: newY });
  }

  motion_gotoxy(spriteId, x, y) {
    this._updateState(spriteId, { x, y });
  }

  motion_setx(spriteId, x) {
    this._updateState(spriteId, { x });
  }

  motion_sety(spriteId, y) {
    this._updateState(spriteId, { y });
  }

  motion_changexby(spriteId, dx) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { x: (state.x ?? 0) + dx });
  }

  motion_changeyby(spriteId, dy) {
    const state = this.state.sprites[spriteId] || {};
    this._updateState(spriteId, { y: (state.y ?? 0) + dy });
  }

  motion_turn_right(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction ?? 90) + deg) % 360;
    this._updateState(spriteId, { direction: newDir < 0 ? newDir + 360 : newDir });
  }

  motion_turn_left(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction ?? 90) - deg + 360) % 360;
    this._updateState(spriteId, { direction: newDir });
  }

  motion_ifonedgebounce(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    let { x, y, direction } = state;
    const halfW = STAGE_HALF_W;
    const halfH = STAGE_HALF_H;

    if (x > halfW || x < -halfW || y > halfH || y < -halfH) {
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
    return state.x ?? 0;
  }

  motion_yposition(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.y ?? 0;
  }

  motion_direction(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.direction ?? 90;
  }

  motion_changexspeed(spriteId, dx) {
    const state = this.state.sprites[spriteId] || {};
    const speed = (state.speedX ?? 0) + dx;
    this._updateState(spriteId, { speedX: speed });
  }

  motion_changeyspeed(spriteId, dy) {
    const state = this.state.sprites[spriteId] || {};
    const speed = (state.speedY ?? 0) + dy;
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
    const next = ((state.currentCostume ?? 0) + 1) % sprite.costumes.length;
    this._updateState(spriteId, { currentCostume: next });
  }

  looks_changesizeby(spriteId, delta) {
    const state = this.state.sprites[spriteId] || {};
    const newSize = Math.max(1, (state.size ?? 100) + delta);
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
    return this.callbacks.getBackdropName?.() || '背景1';
  }

  looks_costumenumbername(spriteId) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const costumeIdx = state.currentCostume ?? 0;
    return costumeIdx + 1; // Scratch uses 1-indexed costume numbers
  }

  looks_costumename(spriteId) {
    const sprite = this._getSprite(spriteId);
    const state = this.state.sprites[spriteId] || {};
    const costumeIdx = state.currentCostume ?? 0;
    return sprite?.costumes?.[costumeIdx]?.name || '造型1';
  }

  looks_backdropnumber(spriteId) {
    return this.callbacks.getBackdropNumber?.() ?? 1;
  }

  looks_size(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.size ?? 100;
  }

  looks_changeeffectby(spriteId, effect, delta) {
    const state = this.state.sprites[spriteId] || {};
    const effects = state.graphicEffects || {};
    effects[effect] = (effects[effect] ?? 0) + delta;
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
    const currentLayer = state.layer ?? 0;
    this._updateState(spriteId, { layer: Math.min(MAX_LAYER, currentLayer + n) });
  }

  looks_gobacklayers(spriteId, n) {
    const state = this.state.sprites[spriteId] || {};
    const currentLayer = state.layer ?? 0;
    this._updateState(spriteId, { layer: Math.max(MIN_LAYER, currentLayer - n) });
  }

  looks_gotofrontback(spriteId, front) {
    this._updateState(spriteId, { layer: front ? MAX_LAYER : MIN_LAYER });
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
      await this._delay(DEFAULT_SOUND_DURATION_MS);
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
    effects[effect] = (effects[effect] ?? 0) + delta;
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
    const newVol = Math.max(0, Math.min(100, (state.volume ?? DEFAULT_VOLUME) + delta));
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
      console.warn(`${LOG_PREFIX} Audio playback error:`, e);
      return this._delay(DEFAULT_SOUND_DURATION_MS);
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
      const frequency = MIDI_BASE_FREQ * Math.pow(2, (note - MIDI_BASE_NOTE) / 12);
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

    const config = DRUM_CONFIGS[drumType] || DRUM_CONFIGS['1'];
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
    const duration = (beats * 60) / this.tempo;
    await this._delay(duration * 1000);
  }

  sound_settempo(spriteId, tempo) {
    this.tempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, tempo));
  }

  sound_changetempoby(spriteId, delta) {
    this.tempo = Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, this.tempo + delta));
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

    if (targetId === '_mouse_') {
      // Check if sprite is under mouse
      const mouseX = this.mouseState.x - MOUSE_OFFSET_X;
      const mouseY = -(this.mouseState.y - MOUSE_OFFSET_Y);
      const dx = (state.x ?? 0) - mouseX;
      const dy = (state.y ?? 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < COLLISION_THRESHOLD;
    }
    if (targetId === '_edge_') {
      // Check if sprite is touching edge
      const x = state.x ?? 0;
      const y = state.y ?? 0;
      return x >= STAGE_HALF_W || x <= -STAGE_HALF_W || y >= STAGE_HALF_H || y <= -STAGE_HALF_H;
    }
    // Check collision with another sprite by name
    const targetSprite = this.sprites.find(s => s.name === targetId);
    if (!targetSprite) return false;
    const targetState = this.state.sprites[targetSprite.id] || {};
    const dx = (state.x ?? 0) - (targetState.x ?? 0);
    const dy = (state.y ?? 0) - (targetState.y ?? 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < COLLISION_THRESHOLD;
  }

  sensing_touchingcolor(spriteId, color) {
    // Basic proximity detection - check if sprite is near edge or another sprite
    const state = this.state.sprites[spriteId] || {};
    const x = state.x ?? 0;
    const y = state.y ?? 0;
    const size = state.size ?? 100;

    // Check edge touching
    const halfSize = size / 200;
    if (x - halfSize < -240 || x + halfSize > 240 || y - halfSize < -180 || y + halfSize > 180) {
      return true;
    }

    // Check if touching another sprite
    for (const sprite of this.sprites) {
      if (sprite.id === spriteId) continue;
      const otherState = this.state.sprites[sprite.id] || {};
      const otherX = otherState.x ?? 0;
      const otherY = otherState.y ?? 0;
      const otherSize = otherState.size ?? 100;
      const dx = x - otherX;
      const dy = y - otherY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < (halfSize + otherSize / 200)) {
        return true;
      }
    }

    return false;
  }

  sensing_coloristouching(spriteId, color1, color2) {
    return this.sensing_touchingcolor(spriteId, color1);
  }

  sensing_distanceto(spriteId, targetId) {
    const state = this.state.sprites[spriteId] || {};
    if (targetId === '_mouse_') {
      const mouseX = this.mouseState.x - MOUSE_OFFSET_X;
      const mouseY = -(this.mouseState.y - MOUSE_OFFSET_Y);
      const dx = (state.x ?? 0) - mouseX;
      const dy = (state.y ?? 0) - mouseY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    if (targetId === '_random_') {
      return Math.sqrt((state.x ?? 0) ** 2 + (state.y ?? 0) ** 2);
    }
    const targetSprite = this.sprites.find(s => s.name === targetId);
    if (!targetSprite) return COLLISION_THRESHOLD * 2; // Default distance if sprite not found
    const targetState = this.state.sprites[targetSprite.id] || {};
    const dx = (state.x ?? 0) - (targetState.x ?? 0);
    const dy = (state.y ?? 0) - (targetState.y ?? 0);
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
    return this.mouseState.x - MOUSE_OFFSET_X;
  }

  sensing_mousey() {
    return -(this.mouseState.y - MOUSE_OFFSET_Y);
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
  operator_add(a, b) { return (a ?? 0) + (b ?? 0); }
  operator_subtract(a, b) { return (a ?? 0) - (b ?? 0); }
  operator_multiply(a, b) { return (a ?? 0) * (b ?? 0); }
  operator_divide(a, b) { return b !== 0 ? (a ?? 0) / (b ?? 0) : 0; }
  operator_random(spriteId, from, to) { return this._random(from, to); }
  operator_gt(a, b) { return (a ?? 0) > (b ?? 0); }
  operator_lt(a, b) { return (a ?? 0) < (b ?? 0); }
  operator_equals(a, b) { return a === b; }
  operator_and(a, b) { return !!(a && b); }
  operator_or(a, b) { return !!(a || b); }
  operator_not(a) { return !a; }
  operator_mod(a, b) { return b !== 0 ? (a ?? 0) % b : 0; }
  operator_round(a) { return Math.round(a ?? 0); }
  operator_mathop(spriteId, op, num) {
    const n = num ?? 0;
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
  operator_join(a, b) { return String(a ?? '') + String(b ?? ''); }
  operator_letter_of(spriteId, letter, string) {
    const s = String(string ?? '');
    const idx = Math.floor(letter ?? 1) - 1;
    return idx >= 0 && idx < s.length ? s[idx] : '';
  }
  operator_length(spriteId, string) { return String(string ?? '').length; }
  operator_contains(spriteId, string1, string2) {
    return String(string1 ?? '').toLowerCase().includes(String(string2 ?? '').toLowerCase());
  }

  operator_tr(spriteId, op, string) {
    const s = String(string ?? '');
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
      await this._delay(EVENT_POLL_INTERVAL_MS);
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
    // Wait until key is pressed
    while (this.running && !this.sensing_keypressed(key)) {
      await this._delay(EVENT_POLL_INTERVAL_MS);
    }
    if (this.running) {
      await fn();
    }
  }

  async event_whenthisspriteclicked(spriteId, fn) {
    await fn();
  }

  async event_whenbackdropswitchto(spriteId, backdropName, fn) {
    // In this single-threaded interpreter, event handlers run inline
    if (this.running && fn) {
      await fn();
    }
  }

  async event_whengreaterthan(spriteId, property, value, fn) {
    // Poll until the condition is met or execution stops
    const startTime = Date.now();
    while (this.running) {
      let currentValue = 0;
      if (property === 'TIMER') {
        currentValue = this.sensing_timer();
      } else if (property === 'LOUDNESS') {
        currentValue = this.sensing_loudness();
      }
      // Guard: if currentValue is not a number, break to avoid infinite loop
      if (typeof currentValue !== 'number' || isNaN(currentValue)) {
        break;
      }
      if (currentValue > value) {
        await fn();
        break;
      }
      if (Date.now() - startTime > EVENT_MAX_WAIT_MS) {
        break;
      }
      await this._delay(EVENT_POLL_INTERVAL_MS);
    }
  }

  event_broadcast(spriteId, message) {
    console.log(`${LOG_PREFIX} Broadcast:`, message);
    const handlers = this.broadcastHandlers.get(message);
    if (handlers) {
      handlers.forEach(fn => fn());
    }
    this.callbacks.onBroadcast?.(message);
  }

  async event_broadcastandwait(spriteId, message) {
    this.event_broadcast(spriteId, message);
    await this._delay(BROADCAST_AND_WAIT_DELAY_MS);
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
      this.callbacks.onCloudVariableChange?.(name, value);
    }
  }

  data_changevariableby(spriteId, name, delta) {
    this.variables = this.variables || {};
    this.variables[name] = (this.variables[name] ?? 0) + delta;

    if (name.startsWith('_cloud_')) {
      this.cloudVariables[name] = this.variables[name];
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
    this._updateState(spriteId, { penSize: Math.max(1, Math.min(100, size ?? 1)) });
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

  destroy() {
    this.stop();
    this._unbindEvents();
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

export default ScratchInterpreter;
