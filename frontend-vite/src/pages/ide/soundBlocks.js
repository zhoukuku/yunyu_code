// ============================================================================
// Scratch Music Blocks - Web Audio API Implementation
// ============================================================================

// Sound/Music block definitions for Blockly
export const defineSoundBlocks = (Blockly) => {
  if (typeof Blockly === 'undefined') return;

  // --------------------------------------------------------------------------
  // Play Drum Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_playdrum'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('演奏打击乐器')
        .appendField(new Blockly.FieldDropdown([
          ['Kick Drum', '1'],
          ['Snare Drum', '2'],
          ['Electric Snare', '3'],
          ['Closed Hi-Hat', '4'],
          ['Open Hi-Hat', '5'],
          ['Low Tom', '6'],
          ['Mid Tom', '7'],
          ['High Tom', '8'],
          ['Cowbell', '9'],
          ['Crash Cymbal', '10'],
          ['Chinese Cymbal', '11'],
          ['Ride Bell', '12'],
          ['Hand Clap', '13'],
          ['Clap', '14'],
          ['Claves', '15'],
          ['Wood Block', '16'],
          ['Low Conga', '17'],
          ['High Conga', '18'],
          ['Low Agogo', '19'],
          ['High Agogo', '20'],
          ['Cabasa', '21'],
          ['Maracas', '22'],
          ['Whistle', '23'],
          ['Low Whistle', '24'],
          ['Ocarina', '25'],
          ['Saxophone', '26'],
          ['Trumpet', '27'],
          ['Violin', '28'],
          ['Guitar', '29'],
          ['Pizzicato', '30']
        ]), 'DRUM');
      this.appendValueInput('BEATS')
        .setCheck('Number')
        .appendField('拍');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('演奏打击乐器');
    }
  };

  // --------------------------------------------------------------------------
  // Rest Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_rest'] = {
    init: function() {
      this.appendValueInput('BEATS')
        .setCheck('Number')
        .appendField('休止');
      this.appendDummyInput()
        .appendField('拍');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('休止拍数');
    }
  };

  // --------------------------------------------------------------------------
  // Play Note Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_playnotemusic'] = {
    init: function() {
      this.appendValueInput('NOTE')
        .setCheck('Number')
        .appendField('弹奏音符');
      this.appendValueInput('BEATS')
        .setCheck('Number')
        .appendField('拍');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('弹奏音符(0-100对应C0-C10)');
    }
  };

  // --------------------------------------------------------------------------
  // Note Name Block (dropdown selector)
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_note'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('音符')
        .appendField(new Blockly.FieldDropdown([
          ['C4 (60)', '60'], ['D4 (62)', '62'], ['E4 (64)', '64'], ['F4 (65)', '65'],
          ['G4 (67)', '67'], ['A4 (69)', '69'], ['B4 (71)', '71'],
          ['C5 (72)', '72'], ['D5 (74)', '74'], ['E5 (76)', '76'], ['F5 (77)', '77'],
          ['G5 (79)', '79'], ['A5 (81)', '81'], ['B5 (83)', '83'],
          ['C3 (48)', '48'], ['D3 (50)', '50'], ['E3 (52)', '52'], ['F3 (53)', '53'],
          ['G3 (55)', '55'], ['A3 (57)', '57'], ['B3 (59)', '59']
        ]), 'NOTE');
      this.setOutput(true, 'Number');
      this.setColour('#CFCF4F');
      this.setTooltip('选择音符');
    }
  };

  // --------------------------------------------------------------------------
  // Set Tempo Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_settempo'] = {
    init: function() {
      this.appendValueInput('TEMPO')
        .setCheck('Number')
        .appendField('将演奏速度设为');
      this.appendDummyInput()
        .appendField('bpm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('设置演奏速度(每分钟节拍数)');
    }
  };

  // --------------------------------------------------------------------------
  // Change Tempo Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_changetempoby'] = {
    init: function() {
      this.appendValueInput('TEMPO')
        .setCheck('Number')
        .appendField('将演奏速度增加');
      this.appendDummyInput()
        .appendField('bpm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('增加演奏速度');
    }
  };

  // --------------------------------------------------------------------------
  // Tempo Reporter Block
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_tempo'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('演奏速度');
      this.setOutput(true, 'Number');
      this.setColour('#CFCF4F');
      this.setTooltip('返回当前演奏速度(bpm)');
    }
  };

  // --------------------------------------------------------------------------
  // Volume Blocks
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_volume'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('音量');
      this.setOutput(true, 'Number');
      this.setColour('#CFCF4F');
      this.setTooltip('返回当前音量');
    }
  };

  Blockly.Blocks['sound_setvolumeto'] = {
    init: function() {
      this.appendValueInput('VOLUME')
        .setCheck('Number')
        .appendField('将音量设为');
      this.appendDummyInput()
        .appendField('%');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('设置音量');
    }
  };

  Blockly.Blocks['sound_changevolumeby'] = {
    init: function() {
      this.appendValueInput('VOLUME')
        .setCheck('Number')
        .appendField('将音量增加');
      this.appendDummyInput()
        .appendField('%');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
      this.setTooltip('增加或减少音量');
    }
  };

  // --------------------------------------------------------------------------
  // Play Sound Blocks
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_play'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('播放声音')
        .appendField(new Blockly.FieldVariable('pop'), 'SOUND');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
    }
  };

  Blockly.Blocks['sound_playuntildone'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('播放声音直到结束')
        .appendField(new Blockly.FieldVariable('pop'), 'SOUND');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
    }
  };

  Blockly.Blocks['sound_stopallsounds'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('停止所有声音');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
    }
  };

  // --------------------------------------------------------------------------
  // Sound Effect Blocks
  // --------------------------------------------------------------------------
  Blockly.Blocks['sound_changeeffectby'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将音效')
        .appendField(new Blockly.FieldDropdown([
          ['音高', 'pitch'],
          ['平衡', 'pan']
        ]), 'EFFECT');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
    }
  };

  Blockly.Blocks['sound_seteffectto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将音效')
        .appendField(new Blockly.FieldDropdown([
          ['音高', 'pitch'],
          ['平衡', 'pan']
        ]), 'EFFECT');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFCF4F');
    }
  };
};

// ============================================================================
// Sound Generators
// ============================================================================

export const registerSoundGenerators = (Blockly) => {
  if (typeof Blockly === 'undefined') return;

  const getValue = (block, name, defaultValue = 0) => {
    const value = Blockly.JavaScript.valueToCode(block, name, Blockly.JavaScript.ORDER_NONE);
    return value !== '' && value !== null ? value : String(defaultValue);
  };

  const getFieldValue = (block, name) => block.getFieldValue(name);

  Blockly.JavaScript['sound_playdrum'] = function(block) {
    const drum = getFieldValue(block, 'DRUM') || '1';
    const beats = getValue(block, 'BEATS', 0.5);
    return `await interpreter.sound_playdrum(interpreter.currentSpriteId, ${drum}, ${beats});\n`;
  };

  Blockly.JavaScript['sound_rest'] = function(block) {
    const beats = getValue(block, 'BEATS', 1);
    return `await interpreter.sound_rest(interpreter.currentSpriteId, ${beats});\n`;
  };

  Blockly.JavaScript['sound_playnotemusic'] = function(block) {
    const note = getValue(block, 'NOTE', 60);
    const beats = getValue(block, 'BEATS', 0.5);
    return `await interpreter.sound_playnotemusic(interpreter.currentSpriteId, ${note}, ${beats});\n`;
  };

  Blockly.JavaScript['sound_note'] = function(block) {
    const note = getFieldValue(block, 'NOTE') || '60';
    return [note, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sound_settempo'] = function(block) {
    const tempo = getValue(block, 'TEMPO', 60);
    return `await interpreter.sound_settempo(interpreter.currentSpriteId, ${tempo});\n`;
  };

  Blockly.JavaScript['sound_changetempoby'] = function(block) {
    const tempo = getValue(block, 'TEMPO', 20);
    return `await interpreter.sound_changetempoby(interpreter.currentSpriteId, ${tempo});\n`;
  };

  Blockly.JavaScript['sound_tempo'] = function(block) {
    return [`interpreter.sound_tempo(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sound_volume'] = function(block) {
    return [`interpreter.sound_volume(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sound_setvolumeto'] = function(block) {
    const volume = getValue(block, 'VOLUME', 100);
    return `await interpreter.sound_setvolumeto(interpreter.currentSpriteId, ${volume});\n`;
  };

  Blockly.JavaScript['sound_changevolumeby'] = function(block) {
    const volume = getValue(block, 'VOLUME', -10);
    return `await interpreter.sound_changevolumeby(interpreter.currentSpriteId, ${volume});\n`;
  };

  Blockly.JavaScript['sound_play'] = function(block) {
    const sound = getFieldValue(block, 'SOUND');
    return `await interpreter.sound_play(interpreter.currentSpriteId, '${sound}');\n`;
  };

  Blockly.JavaScript['sound_playuntildone'] = function(block) {
    const sound = getFieldValue(block, 'SOUND');
    return `await interpreter.sound_playuntildone(interpreter.currentSpriteId, '${sound}');\n`;
  };

  Blockly.JavaScript['sound_stopallsounds'] = function(block) {
    return `await interpreter.sound_stopallsounds();\n`;
  };

  Blockly.JavaScript['sound_changeeffectby'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT');
    const value = getValue(block, 'VALUE', 0);
    return `await interpreter.sound_changeeffectby(interpreter.currentSpriteId, '${effect}', ${value});\n`;
  };

  Blockly.JavaScript['sound_seteffectto'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT');
    const value = getValue(block, 'VALUE', 0);
    return `await interpreter.sound_seteffectto(interpreter.currentSpriteId, '${effect}', ${value});\n`;
  };
};

// ============================================================================
// ScratchInterpreter Sound Extension
// Uses Web Audio API for music synthesis
// ============================================================================

export class SoundInterpreter {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.tempo = 60; // BPM
    this.volume = 100;
    this.initialized = false;
  }

  // Initialize Web Audio API context
  _initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume / 100;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // Delay helper
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert MIDI note to frequency
  _noteToFrequency(note) {
    // MIDI note 69 = A4 = 440Hz
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Calculate duration in seconds from beats
  _beatsToSeconds(beats) {
    return (beats * 60) / this.tempo;
  }

  // Play a musical note
  async playNote(note, beats) {
    try {
      const ctx = this._initAudio();
      const freq = this._noteToFrequency(note);
      const duration = this._beatsToSeconds(beats);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      // ADSR envelope
      const attackTime = 0.02;
      const decayTime = 0.1;
      const sustainLevel = 0.7;
      const releaseTime = 0.1;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime((this.volume / 100) * 0.5, ctx.currentTime + attackTime);
      gainNode.gain.linearRampToValueAtTime((this.volume / 100) * sustainLevel * 0.5, ctx.currentTime + attackTime + decayTime);
      gainNode.gain.setValueAtTime((this.volume / 100) * sustainLevel * 0.5, ctx.currentTime + duration - releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);

      await this._delay(duration * 1000);
    } catch (e) {
      await this._delay(this._beatsToSeconds(beats) * 1000);
    }
  }

  // Drum configurations with Web Audio parameters
  _getDrumConfig(drumType) {
    const configs = {
      // Percussion drums
      '1': { type: 'sine', freq: 150, decay: 0.3, filterFreq: 500, filterType: 'lowpass' },           // Kick
      '2': { type: 'noise', freq: 0, decay: 0.15, filterFreq: 2000, filterType: 'highpass' },         // Snare
      '3': { type: 'noise', freq: 0, decay: 0.12, filterFreq: 3000, filterType: 'highpass' },         // Electric Snare
      '4': { type: 'noise', freq: 0, decay: 0.05, filterFreq: 8000, filterType: 'highpass' },          // Closed Hi-Hat
      '5': { type: 'noise', freq: 0, decay: 0.3, filterFreq: 6000, filterType: 'highpass' },          // Open Hi-Hat
      '6': { type: 'sine', freq: 200, decay: 0.25, filterFreq: 0, filterType: 'lowpass' },            // Low Tom
      '7': { type: 'sine', freq: 250, decay: 0.2, filterFreq: 0, filterType: 'lowpass' },             // Mid Tom
      '8': { type: 'sine', freq: 350, decay: 0.15, filterFreq: 0, filterType: 'lowpass' },             // High Tom
      '9': { type: 'square', freq: 600, decay: 0.1, filterFreq: 1500, filterType: 'bandpass' },        // Cowbell
      '10': { type: 'noise', freq: 0, decay: 0.5, filterFreq: 4000, filterType: 'highpass' },         // Crash
      '11': { type: 'noise', freq: 0, decay: 0.5, filterFreq: 3000, filterType: 'highpass' },         // Chinese
      '12': { type: 'sine', freq: 800, decay: 0.4, filterFreq: 2000, filterType: 'lowpass' },          // Ride Bell
      '13': { type: 'noise', freq: 0, decay: 0.1, filterFreq: 2500, filterType: 'bandpass' },         // Hand Clap
      '14': { type: 'noise', freq: 0, decay: 0.08, filterFreq: 3000, filterType: 'highpass' },         // Clap
      '15': { type: 'square', freq: 1200, decay: 0.05, filterFreq: 3000, filterType: 'highpass' },     // Claves
      '16': { type: 'square', freq: 400, decay: 0.08, filterFreq: 1000, filterType: 'lowpass' },      // Wood Block
      '17': { type: 'sine', freq: 180, decay: 0.2, filterFreq: 0, filterType: 'lowpass' },              // Low Conga
      '18': { type: 'sine', freq: 280, decay: 0.2, filterFreq: 0, filterType: 'lowpass' },             // High Conga
      '19': { type: 'triangle', freq: 600, decay: 0.15, filterFreq: 0, filterType: 'lowpass' },       // Low Agogo
      '20': { type: 'triangle', freq: 900, decay: 0.15, filterFreq: 0, filterType: 'lowpass' },       // High Agogo
      '21': { type: 'noise', freq: 0, decay: 0.2, filterFreq: 5000, filterType: 'highpass' },         // Cabasa
      '22': { type: 'noise', freq: 0, decay: 0.15, filterFreq: 4000, filterType: 'highpass' },         // Maracas
      '23': { type: 'sine', freq: 1200, decay: 0.2, filterFreq: 0, filterType: 'lowpass' },           // Whistle
      '24': { type: 'sine', freq: 800, decay: 0.25, filterFreq: 0, filterType: 'lowpass' },           // Low Whistle
      // Wind/Melodic instruments
      '25': { type: 'triangle', freq: 523, decay: 0.3, filterFreq: 0, filterType: 'lowpass' },         // Ocarina (C5)
      '26': { type: 'sawtooth', freq: 400, decay: 0.3, filterFreq: 1500, filterType: 'lowpass' },      // Saxophone
      '27': { type: 'sawtooth', freq: 466, decay: 0.25, filterFreq: 2000, filterType: 'lowpass' },     // Trumpet (Bb)
      '28': { type: 'sawtooth', freq: 392, decay: 0.4, filterFreq: 3000, filterType: 'lowpass' },      // Violin (G)
      '29': { type: 'triangle', freq: 330, decay: 0.35, filterFreq: 0, filterType: 'lowpass' },        // Guitar (E)
      '30': { type: 'triangle', freq: 294, decay: 0.3, filterFreq: 0, filterType: 'lowpass' }          // Pizzicato (D)
    };
    return configs[String(drumType)] || configs['1'];
  }

  // Play a drum sound
  async playDrum(drumType, beats) {
    try {
      const ctx = this._initAudio();
      const config = this._getDrumConfig(drumType);
      const duration = this._beatsToSeconds(beats);

      const volume = (this.volume / 100) * 0.6;
      const now = ctx.currentTime;

      if (config.type === 'noise') {
        // Create noise for percussion
        const bufferSize = ctx.sampleRate * config.decay;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = config.filterType;
        filter.frequency.value = config.filterFreq;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.decay);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + config.decay);
      } else {
        // Create oscillator for tonal drums
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.freq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.freq * 0.5, now + config.decay);

        if (config.filterFreq > 0) {
          const filter = ctx.createBiquadFilter();
          filter.type = config.filterType;
          filter.frequency.value = config.filterFreq;
          oscillator.connect(filter);
          filter.connect(gainNode);
        } else {
          oscillator.connect(gainNode);
        }

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.decay);

        gainNode.connect(this.masterGain);
        oscillator.start(now);
        oscillator.stop(now + config.decay + 0.1);
      }

      await this._delay(duration * 1000);
    } catch (e) {
      await this._delay(this._beatsToSeconds(beats) * 1000);
    }
  }

  // Rest (silence) for specified beats
  async rest(beats) {
    const duration = this._beatsToSeconds(beats);
    await this._delay(duration * 1000);
  }

  // Set tempo (BPM)
  setTempo(tempo) {
    this.tempo = Math.max(20, Math.min(500, tempo));
  }

  // Change tempo by delta
  changeTempo(delta) {
    this.tempo = Math.max(20, Math.min(500, this.tempo + delta));
  }

  // Get current tempo
  getTempo() {
    return this.tempo;
  }

  // Get current volume
  getVolume() {
    return this.volume;
  }

  // Set volume
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume / 100;
    }
  }

  // Change volume by delta
  changeVolume(delta) {
    this.setVolume(this.volume + delta);
  }

  // Stop all sounds
  stopAllSounds() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }

  // Play a sequence of notes (for chord or melody)
  async playNotes(notes, beats = 0.5) {
    const duration = this._beatsToSeconds(beats);
    try {
      const ctx = this._initAudio();
      const volume = (this.volume / 100) * 0.3;
      const now = ctx.currentTime;

      notes.forEach((note, i) => {
        const freq = this._noteToFrequency(note);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });

      await this._delay(duration * 1000);
    } catch (e) {
      await this._delay(duration * 1000);
    }
  }

  // Cleanup
  dispose() {
    this.stopAllSounds();
  }
}

// ============================================================================
// Sound Block Toolbox Configuration
// ============================================================================

export const getSoundToolbox = () => ({
  kind: 'category',
  name: '声音',
  colour: '#CFCF4F',
  contents: [
    { kind: 'block', type: 'sound_play' },
    { kind: 'block', type: 'sound_playuntildone' },
    { kind: 'block', type: 'sound_stopallsounds' },
    { kind: 'block', type: 'sound_playdrum' },
    { kind: 'block', type: 'sound_playnotemusic' },
    { kind: 'block', type: 'sound_rest' },
    { kind: 'block', type: 'sound_settempo' },
    { kind: 'block', type: 'sound_changetempoby' },
    { kind: 'block', type: 'sound_changevolumeby' },
    { kind: 'block', type: 'sound_setvolumeto' },
    { kind: 'block', type: 'sound_changeeffectby' },
    { kind: 'block', type: 'sound_seteffectto' },
    { kind: 'sep' },
    { kind: 'block', type: 'sound_tempo' },
    { kind: 'block', type: 'sound_volume' }
  ]
});

export default {
  defineSoundBlocks,
  registerSoundGenerators,
  SoundInterpreter,
  getSoundToolbox
};
