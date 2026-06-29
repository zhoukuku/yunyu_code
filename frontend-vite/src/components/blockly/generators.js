// ============================================================================
// Blockly Code Generators - JavaScript, Python, and C++
// ============================================================================

export const registerGenerators = (Blockly) => {
  if (typeof Blockly === 'undefined') return;

  // Helper to get value or default
  const getValue = (block, name, defaultValue = 0) => {
    const value = Blockly.JavaScript.valueToCode(block, name, Blockly.JavaScript.ORDER_NONE);
    return value !== '' && value !== null ? value : String(defaultValue);
  };

  const getFieldValue = (block, name) => {
    return block.getFieldValue(name);
  };

  // ========================================================================
  // JavaScript Code Generators
  // ========================================================================

  // Motion blocks
  Blockly.JavaScript['motion_move_steps'] = function(block) {
    const steps = getValue(block, 'STEPS', 10);
    return `await interpreter.motion_movesteps(interpreter.currentSpriteId, ${steps});\n`;
  };

  Blockly.JavaScript['motion_turn_right'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `await interpreter.motion_turn_right(interpreter.currentSpriteId, ${degrees});\n`;
  };

  Blockly.JavaScript['motion_turn_left'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `await interpreter.motion_turn_left(interpreter.currentSpriteId, ${degrees});\n`;
  };

  Blockly.JavaScript['motion_goto'] = function(block) {
    const to = getFieldValue(block, 'TO') || '_mouse_';
    let x = 0, y = 0;
    if (to === '_random_') {
      x = 'Math.random() * 200 - 100';
      y = 'Math.random() * 200 - 100';
    } else if (to === '_mouse_') {
      x = 'interpreter.sensing_mousex()';
      y = 'interpreter.sensing_mousey()';
    }
    return `await interpreter.motion_gotoxy(interpreter.currentSpriteId, ${x}, ${y});\n`;
  };

  Blockly.JavaScript['motion_xposition'] = function(block) {
    return [`interpreter.motion_xposition(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['motion_yposition'] = function(block) {
    return [`interpreter.motion_yposition(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['motion_direction'] = function(block) {
    return [`interpreter.motion_direction(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['motion_gotoxy'] = function(block) {
    const x = getValue(block, 'X', 0);
    const y = getValue(block, 'Y', 0);
    return `await interpreter.motion_gotoxy(interpreter.currentSpriteId, ${x}, ${y});\n`;
  };

  Blockly.JavaScript['motion_glideto'] = function(block) {
    const secs = getValue(block, 'SECS', 1);
    const to = getFieldValue(block, 'TO') || '_mouse_';
    let x = 0, y = 0;
    if (to === '_random_') {
      x = 'Math.random() * 200 - 100';
      y = 'Math.random() * 200 - 100';
    } else if (to === '_mouse_') {
      x = 'interpreter.sensing_mousex()';
      y = 'interpreter.sensing_mousey()';
    }
    return `await interpreter.motion_glideto(interpreter.currentSpriteId, ${secs}, ${x}, ${y});\n`;
  };

  Blockly.JavaScript['motion_changexby'] = function(block) {
    const dx = getValue(block, 'DX', 10);
    return `await interpreter.motion_changexby(interpreter.currentSpriteId, ${dx});\n`;
  };

  Blockly.JavaScript['motion_changeyby'] = function(block) {
    const dy = getValue(block, 'DY', 10);
    return `await interpreter.motion_changeyby(interpreter.currentSpriteId, ${dy});\n`;
  };

  Blockly.JavaScript['motion_setx'] = function(block) {
    const x = getValue(block, 'X', 0);
    return `await interpreter.motion_setx(interpreter.currentSpriteId, ${x});\n`;
  };

  Blockly.JavaScript['motion_sety'] = function(block) {
    const y = getValue(block, 'Y', 0);
    return `await interpreter.motion_sety(interpreter.currentSpriteId, ${y});\n`;
  };

  Blockly.JavaScript['motion_ifonedgebounce'] = function(block) {
    return `await interpreter.motion_ifonedgebounce(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['motion_setrotationstyle'] = function(block) {
    const style = getFieldValue(block, 'STYLE');
    return `interpreter.motion_setrotationstyle(interpreter.currentSpriteId, '${style}');\n`;
  };

  Blockly.JavaScript['motion_pointindirection'] = function(block) {
    const direction = getValue(block, 'DIRECTION', 90);
    return `await interpreter.motion_pointindirection(interpreter.currentSpriteId, ${direction});\n`;
  };

  Blockly.JavaScript['motion_pointtowards'] = function(block) {
    const target = getFieldValue(block, 'TOWARDS');
    return `await interpreter.motion_pointtowards(interpreter.currentSpriteId, '${target}');\n`;
  };

  Blockly.JavaScript['motion_changexspeed'] = function(block) {
    const dx = getValue(block, 'DX', 0);
    return `await interpreter.motion_changexspeed(interpreter.currentSpriteId, ${dx});\n`;
  };

  Blockly.JavaScript['motion_changeyspeed'] = function(block) {
    const dy = getValue(block, 'DY', 0);
    return `await interpreter.motion_changeyspeed(interpreter.currentSpriteId, ${dy});\n`;
  };

  Blockly.JavaScript['motion_gotoxy_menu'] = function(block) {
    const dropdown = getFieldValue(block, 'DROPDOWN') || 'x_position';
    return [dropdown, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['motion_glideto_menu'] = function(block) {
    const dropdown = getFieldValue(block, 'DROPDOWN') || 'x_position';
    return [dropdown, Blockly.JavaScript.ORDER_NONE];
  };

  // Looks blocks
  Blockly.JavaScript['looks_say'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '""';
    return `await interpreter.looks_say(interpreter.currentSpriteId, ${text});\n`;
  };

  Blockly.JavaScript['looks_sayforsecs'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '""';
    const secs = getValue(block, 'SECS', 2);
    return `await interpreter.looks_sayforsecs(interpreter.currentSpriteId, ${text}, ${secs});\n`;
  };

  Blockly.JavaScript['looks_think'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '""';
    return `await interpreter.looks_think(interpreter.currentSpriteId, ${text});\n`;
  };

  Blockly.JavaScript['looks_thinkforsecs'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '""';
    const secs = getValue(block, 'SECS', 2);
    return `await interpreter.looks_thinkforsecs(interpreter.currentSpriteId, ${text}, ${secs});\n`;
  };

  Blockly.JavaScript['looks_show'] = function(block) {
    return `await interpreter.looks_show(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['looks_hide'] = function(block) {
    return `await interpreter.looks_hide(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['looks_hideallsprites'] = function(block) {
    return `await interpreter.looks_hideallsprites();\n`;
  };

  Blockly.JavaScript['looks_switchcostumeto'] = function(block) {
    const costume = getFieldValue(block, 'COSTUME');
    return `await interpreter.looks_switchcostumeto(interpreter.currentSpriteId, '${costume}');\n`;
  };

  Blockly.JavaScript['looks_nextcostume'] = function(block) {
    return `await interpreter.looks_nextcostume(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['looks_changesizeby'] = function(block) {
    const change = getValue(block, 'CHANGE', 10);
    return `await interpreter.looks_changesizeby(interpreter.currentSpriteId, ${change});\n`;
  };

  Blockly.JavaScript['looks_setsizeto'] = function(block) {
    const size = getValue(block, 'SIZE', 100);
    return `await interpreter.looks_setsizeto(interpreter.currentSpriteId, ${size});\n`;
  };

  Blockly.JavaScript['looks_changeeffectby'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT');
    const change = getValue(block, 'CHANGE', 0);
    return `await interpreter.looks_changeeffectby(interpreter.currentSpriteId, '${effect}', ${change});\n`;
  };

  Blockly.JavaScript['looks_seteffectto'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT');
    const value = getValue(block, 'VALUE', 0);
    return `await interpreter.looks_seteffectto(interpreter.currentSpriteId, '${effect}', ${value});\n`;
  };

  Blockly.JavaScript['looks_cleargraphiceffects'] = function(block) {
    return `await interpreter.looks_cleargraphiceffects(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['looks_backdropname'] = function(block) {
    return [`interpreter.looks_backdropname(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['looks_costumenumbername'] = function(block) {
    return [`interpreter.looks_costumenumbername(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['looks_costumename'] = function(block) {
    return [`interpreter.looks_costumename(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['looks_backdropnumber'] = function(block) {
    return [`interpreter.looks_backdropnumber(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['looks_size'] = function(block) {
    return [`interpreter.looks_size(interpreter.currentSpriteId)`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['looks_switchbackdropto'] = function(block) {
    const backdrop = getFieldValue(block, 'BACKDROP') || 'backdrop1';
    return `await interpreter.looks_switchbackdropto(interpreter.currentSpriteId, '${backdrop}');\n`;
  };

  Blockly.JavaScript['looks_nextbackdrop'] = function(block) {
    return `await interpreter.looks_nextbackdrop(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['looks_goforwardlayers'] = function(block) {
    const num = getValue(block, 'NUM', 1);
    return `await interpreter.looks_goforwardlayers(interpreter.currentSpriteId, ${num});\n`;
  };

  Blockly.JavaScript['looks_gobacklayers'] = function(block) {
    const num = getValue(block, 'NUM', 1);
    return `await interpreter.looks_gobacklayers(interpreter.currentSpriteId, ${num});\n`;
  };

  Blockly.JavaScript['looks_gotofrontback'] = function(block) {
    const frontBack = getFieldValue(block, 'FRONT_BACK');
    return `await interpreter.looks_gotofrontback(interpreter.currentSpriteId, ${frontBack === 'front'});\n`;
  };

  // Sound blocks
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

  Blockly.JavaScript['sound_changevolumeby'] = function(block) {
    const volume = getValue(block, 'VOLUME', -10);
    return `await interpreter.sound_changevolumeby(interpreter.currentSpriteId, ${volume});\n`;
  };

  Blockly.JavaScript['sound_setvolumeto'] = function(block) {
    const volume = getValue(block, 'VOLUME', 100);
    return `await interpreter.sound_setvolumeto(interpreter.currentSpriteId, ${volume});\n`;
  };

  Blockly.JavaScript['sound_playnotemusic'] = function(block) {
    const note = getValue(block, 'NOTE', 60);
    const beats = getValue(block, 'BEATS', 0.5);
    return `await interpreter.sound_playnotemusic(interpreter.currentSpriteId, ${note}, ${beats});\n`;
  };

  Blockly.JavaScript['sound_playdrum'] = function(block) {
    const drum = getFieldValue(block, 'DRUM') || '1';
    const beats = getValue(block, 'BEATS', 0.5);
    return `await interpreter.sound_playdrum(interpreter.currentSpriteId, ${drum}, ${beats});\n`;
  };

  Blockly.JavaScript['sound_rest'] = function(block) {
    const beats = getValue(block, 'BEATS', 1);
    return `await interpreter.sound_rest(interpreter.currentSpriteId, ${beats});\n`;
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

  // Event blocks
  Blockly.JavaScript['event_whenflagclicked'] = function(block) {
    return '';
  };

  Blockly.JavaScript['event_whenkeypressed'] = function(block) {
    const key = getFieldValue(block, 'KEY');
    const doCode = Blockly.JavaScript.statementToCode(block, 'HANDLER') || '';
    return `// 当按下 ${key} 键\n${doCode}`;
  };

  Blockly.JavaScript['event_whenthisspriteclicked'] = function(block) {
    const doCode = Blockly.JavaScript.statementToCode(block, 'HANDLER') || '';
    return `// 当角色被点击\n${doCode}`;
  };

  Blockly.JavaScript['event_whenbackdropswitchto'] = function(block) {
    const backdrop = getFieldValue(block, 'BACKDROP');
    return `// 当背景切换到 ${backdrop}\n`;
  };

  Blockly.JavaScript['event_whengreaterthan'] = function(block) {
    const property = getFieldValue(block, 'WHENGREATERTHANMENU');
    const value = getValue(block, 'VALUE', 0);
    return `// 当 ${property} > ${value}\n`;
  };

  Blockly.JavaScript['event_broadcast'] = function(block) {
    const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    return `await interpreter.event_broadcast(interpreter.currentSpriteId, '${message}');\n`;
  };

  Blockly.JavaScript['event_broadcastandwait'] = function(block) {
    const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    return `await interpreter.event_broadcastandwait(interpreter.currentSpriteId, '${message}');\n`;
  };

  Blockly.JavaScript['event_whenbroadcastreceived'] = function(block) {
    const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    const doCode = Blockly.JavaScript.statementToCode(block, 'HANDLER') || '';
    // Register the handler with the interpreter's broadcastHandlers Map
    return `interpreter.addBroadcastHandler('${message}', async function() {\n${doCode}});\n`;
  };

  // Control blocks
  Blockly.JavaScript['control_wait'] = function(block) {
    const duration = getValue(block, 'DURATION', 1);
    return `await interpreter.control_wait(interpreter.currentSpriteId, ${duration});\n`;
  };

  Blockly.JavaScript['control_wait_secs'] = function(block) {
    const secs = getValue(block, 'SECS', 1);
    return `await interpreter.control_wait(interpreter.currentSpriteId, ${secs});\n`;
  };

  Blockly.JavaScript['control_repeat'] = function(block) {
    const times = getValue(block, 'TIMES', 10);
    const substack = Blockly.JavaScript.statementToCode(block, 'SUBSTACK') || '';
    return `(async () => {
      await interpreter.control_repeat(interpreter.currentSpriteId, ${times}, async () => {
        ${substack}
      });
    })();\n`;
  };

  Blockly.JavaScript['control_repeat_until'] = function(block) {
    const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_NONE) || 'false';
    const substack = Blockly.JavaScript.statementToCode(block, 'SUBSTACK') || '';
    return `(async () => {
      await interpreter.control_repeat_until(interpreter.currentSpriteId, () => !(${condition}), async () => {
        ${substack}
      });
    })();\n`;
  };

  Blockly.JavaScript['control_forever'] = function(block) {
    const substack = Blockly.JavaScript.statementToCode(block, 'SUBSTACK') || '';
    return `(async () => {
      await interpreter.control_forever(interpreter.currentSpriteId, async () => {
        ${substack}
      });
    })();\n`;
  };

  Blockly.JavaScript['control_stop'] = function(block) {
    const option = getFieldValue(block, 'STOP_OPTION') || 'all';
    return `await interpreter.control_stop(interpreter.currentSpriteId, '${option}');\n`;
  };

  Blockly.JavaScript['control_if'] = function(block) {
    const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_NONE) || 'false';
    const substack = Blockly.JavaScript.statementToCode(block, 'SUBSTACK') || '';
    return `(async () => {
      await interpreter.control_if(interpreter.currentSpriteId, () => ${condition}, async () => {
        ${substack}
      });
    })();\n`;
  };

  Blockly.JavaScript['control_if_else'] = function(block) {
    const condition = Blockly.JavaScript.valueToCode(block, 'CONDITION', Blockly.JavaScript.ORDER_NONE) || 'false';
    const substack = Blockly.JavaScript.statementToCode(block, 'SUBSTACK') || '';
    const substack2 = Blockly.JavaScript.statementToCode(block, 'SUBSTACK2') || '';
    return `(async () => {
      await interpreter.control_if_else(interpreter.currentSpriteId, () => ${condition},
        async () => { ${substack} },
        async () => { ${substack2} }
      );
    })();\n`;
  };

  Blockly.JavaScript['control_start_as_clone'] = function(block) {
    return `// 作为克隆体启动\n`;
  };

  Blockly.JavaScript['control_create_clone_of'] = function(block) {
    const target = getFieldValue(block, 'CLONE_OPTION') || 'Sprite1';
    return `await interpreter.control_create_clone_of(interpreter.currentSpriteId, '${target}');\n`;
  };

  Blockly.JavaScript['control_delete_this_clone'] = function(block) {
    return `await interpreter.control_delete_this_clone(interpreter.currentSpriteId);\n`;
  };

  // Sensing blocks
  Blockly.JavaScript['sensing_touching'] = function(block) {
    const target = getFieldValue(block, 'TOUCHINGOBJECT') || '_mouse_';
    const sprite = block.getFieldValue('SPRITE') || '角色1';
    const targetSprite = (target === '_mouse_' || target === '_edge_') ? target : sprite;
    return [`interpreter.sensing_touching(interpreter.currentSpriteId, '${targetSprite}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_touchingcolor'] = function(block) {
    const color = getValue(block, 'COLOR', '#ffffff');
    return [`interpreter.sensing_touchingcolor(interpreter.currentSpriteId, ${color})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_coloristouching'] = function(block) {
    const color = getValue(block, 'COLOR', '#ffffff');
    const color2 = getFieldValue(block, 'COLOR2') || '#ffffff';
    return [`interpreter.sensing_coloristouching(interpreter.currentSpriteId, ${color}, '${color2}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_distanceto'] = function(block) {
    const target = getFieldValue(block, 'DISTANCETOMENU') || '_mouse_';
    const sprite = block.getFieldValue('SPRITE') || '角色1';
    const targetSprite = (target === '_mouse_' || target === '_random_') ? target : sprite;
    return [`interpreter.sensing_distanceto(interpreter.currentSpriteId, '${targetSprite}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_askandwait'] = function(block) {
    const question = Blockly.JavaScript.valueToCode(block, 'QUESTION', Blockly.JavaScript.ORDER_NONE) || '""';
    return `await interpreter.sensing_askandwait(interpreter.currentSpriteId, ${question});\n`;
  };

  Blockly.JavaScript['sensing_keypressed'] = function(block) {
    const key = getFieldValue(block, 'KEY_OPTION') || 'space';
    return [`interpreter.sensing_keypressed('${key}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_mousedown'] = function(block) {
    return [`interpreter.sensing_mousedown()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_mousex'] = function(block) {
    return [`interpreter.sensing_mousex()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_mousey'] = function(block) {
    return [`interpreter.sensing_mousey()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_setdragmode'] = function(block) {
    const mode = getFieldValue(block, 'DRAG_MODE') || 'none';
    return `await interpreter.sensing_setdragmode(interpreter.currentSpriteId, '${mode}');\n`;
  };

  Blockly.JavaScript['sensing_resettimer'] = function(block) {
    return `await interpreter.sensing_resettimer();\n`;
  };

  Blockly.JavaScript['sensing_timer'] = function(block) {
    return [`interpreter.sensing_timer()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_current'] = function(block) {
    const menu = getFieldValue(block, 'CURRENTMENU') || 'YEAR';
    return [`interpreter.sensing_current('${menu}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_dayssince2000'] = function(block) {
    return [`interpreter.sensing_dayssince2000()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_loudness'] = function(block) {
    return [`interpreter.sensing_loudness()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_answer'] = function(block) {
    return [`interpreter.answer()`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['sensing_username'] = function(block) {
    return [`'user'`, Blockly.JavaScript.ORDER_NONE];
  };

  // Operator blocks
  Blockly.JavaScript['operator_add'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_ADDITION) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_ADDITION) || '0';
    return [`(${num1}) + (${num2})`, Blockly.JavaScript.ORDER_ADDITION];
  };

  Blockly.JavaScript['operator_subtract'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_SUBTRACTION) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_SUBTRACTION) || '0';
    return [`(${num1}) - (${num2})`, Blockly.JavaScript.ORDER_SUBTRACTION];
  };

  Blockly.JavaScript['operator_multiply'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_MULTIPLICATION) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_MULTIPLICATION) || '0';
    return [`(${num1}) * (${num2})`, Blockly.JavaScript.ORDER_MULTIPLICATION];
  };

  Blockly.JavaScript['operator_divide'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_DIVISION) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_DIVISION) || '1';
    return [`(${num1}) / (${num2})`, Blockly.JavaScript.ORDER_DIVISION];
  };

  Blockly.JavaScript['operator_random'] = function(block) {
    const from = Blockly.JavaScript.valueToCode(block, 'FROM', Blockly.JavaScript.ORDER_NONE) || '1';
    const to = Blockly.JavaScript.valueToCode(block, 'TO', Blockly.JavaScript.ORDER_NONE) || '10';
    return [`interpreter.operator_random(interpreter.currentSpriteId, ${from}, ${to})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['operator_gt'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_RELATIONAL) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_RELATIONAL) || '0';
    return [`(${num1}) > (${num2})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['operator_lt'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_RELATIONAL) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_RELATIONAL) || '0';
    return [`(${num1}) < (${num2})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['operator_equals'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_EQUALITY) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_EQUALITY) || '0';
    return [`(${num1}) === (${num2})`, Blockly.JavaScript.ORDER_EQUALITY];
  };

  Blockly.JavaScript['operator_and'] = function(block) {
    const operand1 = Blockly.JavaScript.valueToCode(block, 'OPERAND1', Blockly.JavaScript.ORDER_LOGICAL_AND) || 'false';
    const operand2 = Blockly.JavaScript.valueToCode(block, 'OPERAND2', Blockly.JavaScript.ORDER_LOGICAL_AND) || 'false';
    return [`(${operand1}) && (${operand2})`, Blockly.JavaScript.ORDER_LOGICAL_AND];
  };

  Blockly.JavaScript['operator_or'] = function(block) {
    const operand1 = Blockly.JavaScript.valueToCode(block, 'OPERAND1', Blockly.JavaScript.ORDER_LOGICAL_OR) || 'false';
    const operand2 = Blockly.JavaScript.valueToCode(block, 'OPERAND2', Blockly.JavaScript.ORDER_LOGICAL_OR) || 'false';
    return [`(${operand1}) || (${operand2})`, Blockly.JavaScript.ORDER_LOGICAL_OR];
  };

  Blockly.JavaScript['operator_not'] = function(block) {
    const operand = Blockly.JavaScript.valueToCode(block, 'OPERAND', Blockly.JavaScript.ORDER_LOGICAL_NOT) || 'false';
    return [`!(${operand})`, Blockly.JavaScript.ORDER_LOGICAL_NOT];
  };

  Blockly.JavaScript['operator_join'] = function(block) {
    const str1 = Blockly.JavaScript.valueToCode(block, 'STRING1', Blockly.JavaScript.ORDER_NONE) || '""';
    const str2 = Blockly.JavaScript.valueToCode(block, 'STRING2', Blockly.JavaScript.ORDER_NONE) || '""';
    return [`interpreter.operator_join(${str1}, ${str2})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['operator_letter_of'] = function(block) {
    const letter = Blockly.JavaScript.valueToCode(block, 'LETTER', Blockly.JavaScript.ORDER_NONE) || '1';
    const str = Blockly.JavaScript.valueToCode(block, 'STRING', Blockly.JavaScript.ORDER_NONE) || '""';
    return [`interpreter.operator_letter_of(interpreter.currentSpriteId, ${letter}, ${str})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['operator_length'] = function(block) {
    const str = Blockly.JavaScript.valueToCode(block, 'STRING', Blockly.JavaScript.ORDER_NONE) || '""';
    return [`interpreter.operator_length(interpreter.currentSpriteId, ${str})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['operator_mod'] = function(block) {
    const num1 = Blockly.JavaScript.valueToCode(block, 'NUM1', Blockly.JavaScript.ORDER_MODULUS) || '0';
    const num2 = Blockly.JavaScript.valueToCode(block, 'NUM2', Blockly.JavaScript.ORDER_MODULUS) || '1';
    return [`(${num1}) % (${num2})`, Blockly.JavaScript.ORDER_MODULUS];
  };

  Blockly.JavaScript['operator_round'] = function(block) {
    const num = Blockly.JavaScript.valueToCode(block, 'NUM', Blockly.JavaScript.ORDER_NONE) || '0';
    return [`interpreter.operator_round(${num})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['operator_mathop'] = function(block) {
    const op = getFieldValue(block, 'OP') || 'abs';
    const num = Blockly.JavaScript.valueToCode(block, 'NUM', Blockly.JavaScript.ORDER_NONE) || '0';
    return [`interpreter.operator_mathop(interpreter.currentSpriteId, '${op}', ${num})`, Blockly.JavaScript.ORDER_NONE];
  };

  // Data/Variable blocks
  Blockly.JavaScript['data_variable'] = function(block) {
    const variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'myVariable';
    return [`interpreter.variables['${variable}']`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['data_setvariableto'] = function(block) {
    const variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'myVariable';
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '0';
    return `await interpreter.data_setvariableto(interpreter.currentSpriteId, '${variable}', ${value});\n`;
  };

  Blockly.JavaScript['data_changevariableby'] = function(block) {
    const variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'myVariable';
    const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || '1';
    return `await interpreter.data_changevariableby(interpreter.currentSpriteId, '${variable}', ${value});\n`;
  };

  Blockly.JavaScript['data_showvariable'] = function(block) {
    const variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'myVariable';
    return `await interpreter.data_showvariable(interpreter.currentSpriteId, '${variable}');\n`;
  };

  Blockly.JavaScript['data_hidevariable'] = function(block) {
    const variable = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'myVariable';
    return `await interpreter.data_hidevariable(interpreter.currentSpriteId, '${variable}');\n`;
  };

  // List blocks
  Blockly.JavaScript['data_addtolist'] = function(block) {
    const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_NONE) || '""';
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_addtolist(interpreter.currentSpriteId, ${item}, '${list}');\n`;
  };

  Blockly.JavaScript['data_deleteoflist'] = function(block) {
    const index = getFieldValue(block, 'INDEX') || '1';
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_deleteoflist(interpreter.currentSpriteId, ${index}, '${list}');\n`;
  };

  Blockly.JavaScript['data_inserttolist'] = function(block) {
    const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_NONE) || '""';
    const index = getFieldValue(block, 'INDEX') || '1';
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_inserttolist(interpreter.currentSpriteId, ${item}, ${index}, '${list}');\n`;
  };

  Blockly.JavaScript['data_itemoflist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    const index = getFieldValue(block, 'INDEX') || '1';
    return [`interpreter.data_itemoflist(interpreter.currentSpriteId, ${index}, '${list}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['data_lengthoflist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return [`interpreter.data_lengthoflist(interpreter.currentSpriteId, '${list}')`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['data_listcontainsitem'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_NONE) || '""';
    return [`interpreter.data_listcontainsitem(interpreter.currentSpriteId, '${list}', ${item})`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['data_deletealloflist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_deletealloflist(interpreter.currentSpriteId, '${list}');\n`;
  };

  Blockly.JavaScript['data_showlist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_showlist(interpreter.currentSpriteId, '${list}');\n`;
  };

  Blockly.JavaScript['data_hidelist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return `await interpreter.data_hidelist(interpreter.currentSpriteId, '${list}');\n`;
  };

  Blockly.JavaScript['data_list'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    return [`interpreter.lists['${list}'] || []`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['data_replaceitemoflist'] = function(block) {
    const list = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'myList';
    const index = getFieldValue(block, 'INDEX') || '1';
    const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_NONE) || '""';
    return `await interpreter.data_replaceitemoflist(interpreter.currentSpriteId, ${index}, '${list}', ${item});\n`;
  };

  // Procedure blocks
  Blockly.JavaScript['procedures_definition'] = function(block) {
    const name = getFieldValue(block, 'NAME') || 'myBlock';
    const stack = Blockly.JavaScript.statementToCode(block, 'STACK') || '';
    return `// 定义 ${name}\n${stack}\n`;
  };

  Blockly.JavaScript['procedures_call'] = function(block) {
    const name = getFieldValue(block, 'NAME') || 'myBlock';
    return `// 调用 ${name}\n`;
  };

  // Pen blocks
  Blockly.JavaScript['pen_up'] = function(block) {
    return `await interpreter.pen_up(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['pen_down'] = function(block) {
    return `await interpreter.pen_down(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['pen_color'] = function(block) {
    const color = getFieldValue(block, 'COLOR') || '#000000';
    return `await interpreter.pen_color(interpreter.currentSpriteId, '${color}');\n`;
  };

  Blockly.JavaScript['pen_size'] = function(block) {
    const size = getValue(block, 'SIZE', 1);
    return `await interpreter.pen_size(interpreter.currentSpriteId, ${size});\n`;
  };

  Blockly.JavaScript['pen_clear'] = function(block) {
    return `await interpreter.pen_clear(interpreter.currentSpriteId);\n`;
  };

  Blockly.JavaScript['pen_stamp'] = function(block) {
    return `await interpreter.pen_stamp(interpreter.currentSpriteId);\n`;
  };
};

// ============================================================================
// Python Code Generators
// ============================================================================

export const registerPythonGenerators = (Blockly) => {
  if (typeof Blockly === 'undefined') return;

  const getValue = (block, name, defaultValue = 0) => {
    const value = Blockly.Python.valueToCode(block, name, Blockly.Python.ORDER_NONE);
    return value !== '' && value !== null ? value : String(defaultValue);
  };

  const getFieldValue = (block, name) => block.getFieldValue(name);

  // Motion blocks
  Blockly.Python['motion_move_steps'] = function(block) {
    const steps = getValue(block, 'STEPS', 10);
    return `move(${steps})\n`;
  };

  Blockly.Python['motion_turn_right'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `turn_right(${degrees})\n`;
  };

  Blockly.Python['motion_turn_left'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `turn_left(${degrees})\n`;
  };

  Blockly.Python['motion_gotoxy'] = function(block) {
    const x = getValue(block, 'X', 0);
    const y = getValue(block, 'Y', 0);
    return `go_to(${x}, ${y})\n`;
  };

  Blockly.Python['motion_glideto'] = function(block) {
    const secs = getValue(block, 'SECS', 1);
    const x = getValue(block, 'X', 0);
    const y = getValue(block, 'Y', 0);
    return `glide(${secs}, ${x}, ${y})\n`;
  };

  Blockly.Python['motion_ifonedgebounce'] = function(block) {
    return `if_on_edge_bounce()\n`;
  };

  Blockly.Python['looks_say'] = function(block) {
    const text = Blockly.Python.valueToCode(block, 'TEXT', Blockly.Python.ORDER_NONE) || '""';
    return `say(${text})\n`;
  };

  Blockly.Python['looks_sayforsecs'] = function(block) {
    const text = Blockly.Python.valueToCode(block, 'TEXT', Blockly.Python.ORDER_NONE) || '""';
    const secs = getValue(block, 'SECS', 2);
    return `say(${text}, ${secs})\n`;
  };

  Blockly.Python['looks_show'] = function(block) {
    return `show()\n`;
  };

  Blockly.Python['looks_hide'] = function(block) {
    return `hide()\n`;
  };

  Blockly.Python['control_wait'] = function(block) {
    const duration = getValue(block, 'DURATION', 1);
    return `wait(${duration})\n`;
  };

  Blockly.Python['control_wait_secs'] = function(block) {
    const secs = getValue(block, 'SECS', 1);
    return `wait(${secs})\n`;
  };

  Blockly.Python['control_repeat'] = function(block) {
    const times = getValue(block, 'TIMES', 10);
    const substack = Blockly.Python.statementToCode(block, 'SUBSTACK') || 'pass';
    const indent = '  ';
    return `for i in range(${times}):\n${substack.split('\n').map(line => indent + line).join('\n')}\n`;
  };

  Blockly.Python['control_forever'] = function(block) {
    const substack = Blockly.Python.statementToCode(block, 'SUBSTACK') || 'pass';
    const indent = '  ';
    return `while True:\n${substack.split('\n').map(line => indent + line).join('\n')}\n`;
  };

  Blockly.Python['control_if'] = function(block) {
    const condition = Blockly.Python.valueToCode(block, 'CONDITION', Blockly.Python.ORDER_NONE) || 'True';
    const substack = Blockly.Python.statementToCode(block, 'SUBSTACK') || 'pass';
    const indent = '  ';
    return `if ${condition}:\n${substack.split('\n').map(line => indent + line).join('\n')}\n`;
  };

  Blockly.Python['operator_add'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_ADDITIVE) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_ADDITIVE) || '0';
    return [`${num1} + ${num2}`, Blockly.Python.ORDER_ADDITIVE];
  };

  Blockly.Python['operator_subtract'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_ADDITIVE) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_ADDITIVE) || '0';
    return [`${num1} - ${num2}`, Blockly.Python.ORDER_ADDITIVE];
  };

  Blockly.Python['operator_multiply'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
    return [`${num1} * ${num2}`, Blockly.Python.ORDER_MULTIPLICATIVE];
  };

  Blockly.Python['operator_divide'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_MULTIPLICATIVE) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_MULTIPLICATIVE) || '1';
    return [`${num1} / ${num2}`, Blockly.Python.ORDER_MULTIPLICATIVE];
  };

  Blockly.Python['operator_gt'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_RELATIONAL) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_RELATIONAL) || '0';
    return [`${num1} > ${num2}`, Blockly.Python.ORDER_RELATIONAL];
  };

  Blockly.Python['operator_lt'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_RELATIONAL) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_RELATIONAL) || '0';
    return [`${num1} < ${num2}`, Blockly.Python.ORDER_RELATIONAL];
  };

  Blockly.Python['operator_equals'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_RELATIONAL) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_RELATIONAL) || '0';
    return [`${num1} == ${num2}`, Blockly.Python.ORDER_RELATIONAL];
  };

  Blockly.Python['operator_and'] = function(block) {
    const op1 = Blockly.Python.valueToCode(block, 'OPERAND1', Blockly.Python.ORDER_LOGICAL_AND) || 'False';
    const op2 = Blockly.Python.valueToCode(block, 'OPERAND2', Blockly.Python.ORDER_LOGICAL_AND) || 'False';
    return [`${op1} and ${op2}`, Blockly.Python.ORDER_LOGICAL_AND];
  };

  Blockly.Python['operator_or'] = function(block) {
    const op1 = Blockly.Python.valueToCode(block, 'OPERAND1', Blockly.Python.ORDER_LOGICAL_OR) || 'False';
    const op2 = Blockly.Python.valueToCode(block, 'OPERAND2', Blockly.Python.ORDER_LOGICAL_OR) || 'False';
    return [`${op1} or ${op2}`, Blockly.Python.ORDER_LOGICAL_OR];
  };

  Blockly.Python['operator_not'] = function(block) {
    const op = Blockly.Python.valueToCode(block, 'OPERAND', Blockly.Python.ORDER_LOGICAL_NOT) || 'False';
    return [`not ${op}`, Blockly.Python.ORDER_LOGICAL_NOT];
  };

  Blockly.Python['operator_random'] = function(block) {
    const from = Blockly.Python.valueToCode(block, 'FROM', Blockly.Python.ORDER_NONE) || '1';
    const to = Blockly.Python.valueToCode(block, 'TO', Blockly.Python.ORDER_NONE) || '10';
    return [`random.randint(${from}, ${to})`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['operator_mod'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_MODULUS) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_MODULUS) || '1';
    return [`${num1} % ${num2}`, Blockly.Python.ORDER_MODULUS];
  };

  Blockly.Python['operator_round'] = function(block) {
    const num = Blockly.Python.valueToCode(block, 'NUM', Blockly.Python.ORDER_NONE) || '0';
    return [`round(${num})`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['operator_join'] = function(block) {
    const str1 = Blockly.Python.valueToCode(block, 'STRING1', Blockly.Python.ORDER_NONE) || '""';
    const str2 = Blockly.Python.valueToCode(block, 'STRING2', Blockly.Python.ORDER_NONE) || '""';
    return [`str(${str1}) + str(${str2})`, Blockly.Python.ORDER_ADDITIVE];
  };

  Blockly.Python['operator_letter_of'] = function(block) {
    const letter = Blockly.Python.valueToCode(block, 'LETTER', Blockly.Python.ORDER_NONE) || '1';
    const str = Blockly.Python.valueToCode(block, 'STRING', Blockly.Python.ORDER_NONE) || '""';
    return [`str(${str})[int(${letter})-1]`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['operator_length'] = function(block) {
    const str = Blockly.Python.valueToCode(block, 'STRING', Blockly.Python.ORDER_NONE) || '""';
    return [`len(str(${str}))`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_keypressed'] = function(block) {
    const key = getFieldValue(block, 'KEY_OPTION') || 'space';
    return [`key_pressed("${key}")`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_mousedown'] = function(block) {
    return [`mouse_down()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_mousex'] = function(block) {
    return [`mouse_x()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_mousey'] = function(block) {
    return [`mouse_y()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_timer'] = function(block) {
    return [`timer()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['event_whenflagclicked'] = function(block) {
    return `# 当绿旗被点击\n`;
  };

  Blockly.Python['event_broadcast'] = function(block) {
    const msg = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    return `broadcast("${msg}")\n`;
  };

  Blockly.Python['data_setvariableto'] = function(block) {
    const varName = Blockly.Python.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'my_variable';
    const value = Blockly.Python.valueToCode(block, 'VALUE', Blockly.Python.ORDER_NONE) || '0';
    return `${varName} = ${value}\n`;
  };

  Blockly.Python['data_changevariableby'] = function(block) {
    const varName = Blockly.Python.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'my_variable';
    const value = Blockly.Python.valueToCode(block, 'VALUE', Blockly.Python.ORDER_NONE) || '1';
    return `${varName} += ${value}\n`;
  };

  Blockly.Python['data_variable'] = function(block) {
    const varName = Blockly.Python.variableDB_.getName(block.getFieldValue('VARIABLE'), Blockly.Variables.NAME_TYPE) || 'my_variable';
    return [varName, Blockly.Python.ORDER_NONE];
  };

  Blockly.Python['data_addtolist'] = function(block) {
    const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
    const listName = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    return `${listName}.append(${item})\n`;
  };

  Blockly.Python['procedures_definition'] = function(block) {
    const name = getFieldValue(block, 'NAME') || 'my_block';
    const stack = Blockly.Python.statementToCode(block, 'STACK') || 'pass';
    return `def ${name}():\n${stack.split('\n').map(line => '  ' + line).join('\n')}\n`;
  };

  Blockly.Python['procedures_call'] = function(block) {
    const name = getFieldValue(block, 'NAME') || 'my_block';
    return `${name}()\n`;
  };

  // Additional Python generators for completeness
  Blockly.Python['operator_mod'] = function(block) {
    const num1 = Blockly.Python.valueToCode(block, 'NUM1', Blockly.Python.ORDER_MODULUS) || '0';
    const num2 = Blockly.Python.valueToCode(block, 'NUM2', Blockly.Python.ORDER_MODULUS) || '1';
    return [`${num1} % ${num2}`, Blockly.Python.ORDER_MODULUS];
  };

  Blockly.Python['operator_mathop'] = function(block) {
    const op = getFieldValue(block, 'OP') || 'abs';
    const num = Blockly.Python.valueToCode(block, 'NUM', Blockly.Python.ORDER_NONE) || '0';
    const opMap = {
      'abs': 'abs',
      'floor': 'math.floor',
      'ceiling': 'math.ceil',
      'sqrt': 'math.sqrt',
      'sin': 'math.sin',
      'cos': 'math.cos',
      'tan': 'math.tan',
      'asin': 'math.asin',
      'acos': 'math.acos',
      'atan': 'math.atan',
      'ln': 'math.log',
      'log': 'math.log10',
      'e^': 'math.exp',
      '10^': '(10 **)'
    };
    const pyOp = opMap[op] || op;
    if (op === '10^') {
      return [`math.pow(10, ${num})`, Blockly.Python.ORDER_FUNCTION_CALL];
    }
    return [`${pyOp}(${num})`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['operator_contains'] = function(block) {
    const str1 = Blockly.Python.valueToCode(block, 'STRING1', Blockly.Python.ORDER_NONE) || '""';
    const str2 = Blockly.Python.valueToCode(block, 'STRING2', Blockly.Python.ORDER_NONE) || '""';
    return [`str(${str1}) in str(${str2})`, Blockly.Python.ORDER_LOGICAL_AND];
  };

  Blockly.Python['sensing_askandwait'] = function(block) {
    const question = Blockly.Python.valueToCode(block, 'QUESTION', Blockly.Python.ORDER_NONE) || '""';
    return `ask(${question})\n`;
  };

  Blockly.Python['sensing_answer'] = function(block) {
    return ['answer()', Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_timer'] = function(block) {
    return ['timer()', Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sensing_resettimer'] = function(block) {
    return `reset_timer()\n`;
  };

  Blockly.Python['sensing_current'] = function(block) {
    const menu = getFieldValue(block, 'CURRENTMENU') || 'YEAR';
    const menuMap = {
      'YEAR': 'year', 'MONTH': 'month', 'DATE': 'date', 'DAYOFWEEK': 'weekday',
      'HOUR': 'hour', 'MINUTE': 'minute', 'SECOND': 'second'
    };
    return [`datetime.datetime.now().${menuMap[menu] || 'year'}`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['looks_switchcostumeto'] = function(block) {
    const costume = getFieldValue(block, 'COSTUME') || 'costume1';
    return `switch_costume('${costume}')\n`;
  };

  Blockly.Python['looks_nextcostume'] = function(block) {
    return `next_costume()\n`;
  };

  Blockly.Python['looks_changesizeby'] = function(block) {
    const change = getValue(block, 'CHANGE', 10);
    return `change_size(${change})\n`;
  };

  Blockly.Python['looks_setsizeto'] = function(block) {
    const size = getValue(block, 'SIZE', 100);
    return `set_size(${size})\n`;
  };

  Blockly.Python['looks_show'] = function(block) {
    return `show()\n`;
  };

  Blockly.Python['looks_hide'] = function(block) {
    return `hide()\n`;
  };

  Blockly.Python['looks_cleargraphiceffects'] = function(block) {
    return `clear_graphic_effects()\n`;
  };

  Blockly.Python['looks_changeeffectby'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT') || 'color';
    const change = getValue(block, 'CHANGE', 0);
    return `change_graphic_effect('${effect}', ${change})\n`;
  };

  Blockly.Python['looks_seteffectto'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT') || 'color';
    const value = getValue(block, 'VALUE', 0);
    return `set_graphic_effect('${effect}', ${value})\n`;
  };

  Blockly.Python['looks_switchbackdropto'] = function(block) {
    const backdrop = getFieldValue(block, 'BACKDROP') || 'backdrop1';
    return `switch_backdrop('${backdrop}')\n`;
  };

  Blockly.Python['looks_nextbackdrop'] = function(block) {
    return `next_backdrop()\n`;
  };

  Blockly.Python['looks_costumename'] = function(block) {
    return [`costume_name()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['looks_backdropname'] = function(block) {
    return [`backdrop_name()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['looks_costumenumbername'] = function(block) {
    return [`costume_number()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['looks_backdropnumber'] = function(block) {
    return [`backdrop_number()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['looks_size'] = function(block) {
    return [`size()`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['sound_play'] = function(block) {
    const sound = getFieldValue(block, 'SOUND') || 'pop';
    return `play_sound('${sound}')\n`;
  };

  Blockly.Python['sound_playuntildone'] = function(block) {
    const sound = getFieldValue(block, 'SOUND') || 'pop';
    return `play_sound_until_done('${sound}')\n`;
  };

  Blockly.Python['sound_stopallsounds'] = function(block) {
    return `stop_all_sounds()\n`;
  };

  Blockly.Python['control_stop'] = function(block) {
    const option = getFieldValue(block, 'STOP_OPTION') || 'all';
    return `stop(${option})\n`;
  };

  Blockly.Python['control_wait_until'] = function(block) {
    const condition = Blockly.Python.valueToCode(block, 'CONDITION', Blockly.Python.ORDER_NONE) || 'True';
    const indent = '  ';
    return `while not ${condition}:\n${indent}pass\n`;
  };

  Blockly.Python['control_if_else'] = function(block) {
    const condition = Blockly.Python.valueToCode(block, 'CONDITION', Blockly.Python.ORDER_NONE) || 'True';
    const substack = Blockly.Python.statementToCode(block, 'SUBSTACK') || 'pass';
    const substack2 = Blockly.Python.statementToCode(block, 'SUBSTACK2') || 'pass';
    const indent = '  ';
    return `if ${condition}:\n${substack.split('\n').map(line => indent + line).join('\n')}\nelse:\n${substack2.split('\n').map(line => indent + line).join('\n')}\n`;
  };

  Blockly.Python['data_deleteoflist'] = function(block) {
    const index = getValue(block, 'INDEX', 1);
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    return `${list}.pop(${index} - 1)\n`;
  };

  Blockly.Python['data_inserttolist'] = function(block) {
    const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
    const index = getValue(block, 'INDEX', 1);
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    return `${list}.insert(${index} - 1, ${item})\n`;
  };

  Blockly.Python['data_replaceitemoflist'] = function(block) {
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    const index = getValue(block, 'INDEX', 1);
    const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
    return `${list}[${index} - 1] = ${item}\n`;
  };

  Blockly.Python['data_itemoflist'] = function(block) {
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    const index = getValue(block, 'INDEX', 1);
    return [`${list}[${index} - 1]`, Blockly.Python.ORDER_NONE];
  };

  Blockly.Python['data_lengthoflist'] = function(block) {
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    return [`len(${list})`, Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['data_listcontainsitem'] = function(block) {
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
    return [`${item} in ${list}`, Blockly.Python.ORDER_LOGICAL_AND];
  };

  Blockly.Python['data_list'] = function(block) {
    const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
    return [list, Blockly.Python.ORDER_NONE];
  };

  Blockly.Python['motion_gotoxy'] = function(block) {
    const x = getValue(block, 'X', 0);
    const y = getValue(block, 'Y', 0);
    return `go_to(${x}, ${y})\n`;
  };

  Blockly.Python['motion_setx'] = function(block) {
    const x = getValue(block, 'X', 0);
    return `set_x(${x})\n`;
  };

  Blockly.Python['motion_sety'] = function(block) {
    const y = getValue(block, 'Y', 0);
    return `set_y(${y})\n`;
  };

  Blockly.Python['motion_changexby'] = function(block) {
    const dx = getValue(block, 'DX', 10);
    return `change_x(${dx})\n`;
  };

  Blockly.Python['motion_changeyby'] = function(block) {
    const dy = getValue(block, 'DY', 10);
    return `change_y(${dy})\n`;
  };

  Blockly.Python['motion_goto'] = function(block) {
    const to = getFieldValue(block, 'TO') || '_mouse_';
    if (to === '_random_') {
      return `go_to(random.randint(-200, 200), random.randint(-150, 150))\n`;
    } else if (to === '_mouse_') {
      return `go_to(mouse_x(), mouse_y())\n`;
    }
    return `go_to(0, 0)\n`;
  };

  Blockly.Python['motion_glideto'] = function(block) {
    const secs = getValue(block, 'SECS', 1);
    const to = getFieldValue(block, 'TO') || '_mouse_';
    if (to === '_random_') {
      return `glide(${secs}, random.randint(-200, 200), random.randint(-150, 150))\n`;
    } else if (to === '_mouse_') {
      return `glide(${secs}, mouse_x(), mouse_y())\n`;
    }
    return `glide(${secs}, 0, 0)\n`;
  };

  Blockly.Python['motion_changexspeed'] = function(block) {
    const dx = getValue(block, 'DX', 0);
    return `change_x_speed(${dx})\n`;
  };

  Blockly.Python['motion_changeyspeed'] = function(block) {
    const dy = getValue(block, 'DY', 0);
    return `change_y_speed(${dy})\n`;
  };

  Blockly.Python['motion_setrotationstyle'] = function(block) {
    const style = getFieldValue(block, 'STYLE') || 'normal';
    return `set_rotation_style('${style}')\n`;
  };

  Blockly.Python['motion_ifonedgebounce'] = function(block) {
    return `if_on_edge_bounce()\n`;
  };

  Blockly.Python['motion_turn_right'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `turn_right(${degrees})\n`;
  };

  Blockly.Python['motion_turn_left'] = function(block) {
    const degrees = getValue(block, 'DEGREES', 15);
    return `turn_left(${degrees})\n`;
  };

  Blockly.Python['motion_pointindirection'] = function(block) {
    const direction = getValue(block, 'DIRECTION', 90);
    return `point_in_direction(${direction})\n`;
  };

  Blockly.Python['motion_pointtowards'] = function(block) {
    const towards = getFieldValue(block, 'TOWARDS') || '_mouse_';
    if (towards === '_random_') {
      return `point_towards(random.randint(-200, 200), random.randint(-150, 150))\n`;
    }
    return `point_towards(mouse_x(), mouse_y())\n`;
  };

  Blockly.Python['motion_xposition'] = function(block) {
    return ['x_position()', Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['motion_yposition'] = function(block) {
    return ['y_position()', Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['motion_direction'] = function(block) {
    return ['direction()', Blockly.Python.ORDER_FUNCTION_CALL];
  };

  Blockly.Python['event_broadcastandwait'] = function(block) {
    const msg = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    return `broadcast_and_wait("${msg}")\n`;
  };

  Blockly.Python['event_whenbroadcastreceived'] = function(block) {
    const msg = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
    const doCode = Blockly.Python.statementToCode(block, 'HANDLER') || 'pass';
    return `# 当收到广播 ${msg}\n${doCode}`;
  };

  Blockly.Python['looks_think'] = function(block) {
    const text = Blockly.Python.valueToCode(block, 'TEXT', Blockly.Python.ORDER_NONE) || '""';
    return `think(${text})\n`;
  };

  Blockly.Python['looks_thinkforsecs'] = function(block) {
    const text = Blockly.Python.valueToCode(block, 'TEXT', Blockly.Python.ORDER_NONE) || '""';
    const secs = getValue(block, 'SECS', 2);
    return `think(${text}, ${secs})\n`;
  };

  Blockly.Python['looks_hideallsprites'] = function(block) {
    return `hide_all_sprites()\n`;
  };

  Blockly.Python['looks_goforwardlayers'] = function(block) {
    const num = getValue(block, 'NUM', 1);
    return `go_forward_layers(${num})\n`;
  };

  Blockly.Python['looks_gobacklayers'] = function(block) {
    const num = getValue(block, 'NUM', 1);
    return `go_back_layers(${num})\n`;
  };

  Blockly.Python['looks_gotofrontback'] = function(block) {
    const frontBack = getFieldValue(block, 'FRONT_BACK');
    return `go_to_front_back('${frontBack}')\n`;
  };

  Blockly.Python['looks_changeeffectby'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT') || 'color';
    const change = getValue(block, 'CHANGE', 0);
    return `change_graphic_effect('${effect}', ${change})\n`;
  };

  Blockly.Python['looks_seteffectto'] = function(block) {
    const effect = getFieldValue(block, 'EFFECT') || 'color';
    const value = getValue(block, 'VALUE', 0);
    return `set_graphic_effect('${effect}', ${value})\n`;
  };

  Blockly.Python['looks_cleargraphiceffects'] = function(block) {
    return `clear_graphic_effects()\n`;
  };

  Blockly.Python['looks_switchbackdropto'] = function(block) {
    const backdrop = getFieldValue(block, 'BACKDROP') || 'backdrop1';
    return `switch_backdrop('${backdrop}')\n`;
  };

  Blockly.Python['looks_nextbackdrop'] = function(block) {
    return `next_backdrop()\n`;
  };
};
