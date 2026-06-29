// ============================================================================
// Blockly Block Definitions - Complete Scratch-like Blocks
// ============================================================================

export const defineBlocks = (Blockly) => {
  if (typeof Blockly === 'undefined') return;

  // ========================================================================
  // Motion Blocks
  // ========================================================================
  Blockly.Blocks['motion_move_steps'] = {
    init: function() {
      this.appendValueInput('STEPS')
        .setCheck('Number')
        .appendField('移动');
      this.appendDummyInput()
        .appendField('步');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('让角色向前移动指定的步数');
    }
  };

  Blockly.Blocks['motion_turn_right'] = {
    init: function() {
      this.appendValueInput('DEGREES')
        .setCheck('Number')
        .appendField('右转');
      this.appendDummyInput()
        .appendField('度');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('让角色向右旋转指定角度');
    }
  };

  Blockly.Blocks['motion_turn_left'] = {
    init: function() {
      this.appendValueInput('DEGREES')
        .setCheck('Number')
        .appendField('左转');
      this.appendDummyInput()
        .appendField('度');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('让角色向左旋转指定角度');
    }
  };

  Blockly.Blocks['motion_goto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('移到')
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['随机位置', '_random_']
        ]), 'TO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_gotoxy_menu'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['x坐标', 'x_position'],
          ['y坐标', 'y_position']
        ]), 'DROPDOWN');
      this.setOutput(true, 'Number');
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_xposition'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('x坐标');
      this.setOutput(true, 'Number');
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_yposition'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('y坐标');
      this.setOutput(true, 'Number');
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_direction'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('方向');
      this.setOutput(true, 'Number');
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_gotoxy'] = {
    init: function() {
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('x:');
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('y:');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('将角色移到指定坐标位置');
    }
  };

  Blockly.Blocks['motion_glideto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('滑行')
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['随机位置', '_random_']
        ]), 'TO');
      this.appendValueInput('SECS')
        .setCheck('Number')
        .appendField('秒');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_glideto_menu'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['x坐标', 'x_position'],
          ['y坐标', 'y_position']
        ]), 'DROPDOWN');
      this.setOutput(true, 'Number');
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_changexby'] = {
    init: function() {
      this.appendValueInput('DX')
        .setCheck('Number')
        .appendField('将X增加');
      this.appendDummyInput()
        .appendField('步');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_changeyby'] = {
    init: function() {
      this.appendValueInput('DY')
        .setCheck('Number')
        .appendField('将Y增加');
      this.appendDummyInput()
        .appendField('步');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_setx'] = {
    init: function() {
      this.appendValueInput('X')
        .setCheck('Number')
        .appendField('将X设为');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_sety'] = {
    init: function() {
      this.appendValueInput('Y')
        .setCheck('Number')
        .appendField('将Y设为');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_ifonedgebounce'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('碰到边缘就反弹');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_setrotationstyle'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('旋转模式')
        .appendField(new Blockly.FieldDropdown([
          ['左右翻转', 'left-right'],
          ['不可旋转', 'none'],
          ['任意旋转', 'normal']
        ]), 'STYLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_pointindirection'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('面向')
        .appendField(new Blockly.FieldDropdown([
          ['90', '90'],
          ['-90', '-90'],
          ['180', '180'],
          ['0', '0']
        ]), 'DIRECTION');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_pointtowards'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('面向')
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['随机位置', '_random_']
        ]), 'TOWARDS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };

  Blockly.Blocks['motion_changexspeed'] = {
    init: function() {
      this.appendValueInput('DX')
        .setCheck('Number')
        .appendField('将X速度增加');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('将角色的X速度增加指定值');
    }
  };

  Blockly.Blocks['motion_changeyspeed'] = {
    init: function() {
      this.appendValueInput('DY')
        .setCheck('Number')
        .appendField('将Y速度增加');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
      this.setTooltip('将角色的Y速度增加指定值');
    }
  };

  // ========================================================================
  // Looks Blocks
  // ========================================================================
  Blockly.Blocks['looks_say'] = {
    init: function() {
      this.appendValueInput('TEXT')
        .setCheck(['String', 'Number'])
        .appendField('说');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
      this.setTooltip('让角色说话');
    }
  };

  Blockly.Blocks['looks_sayforsecs'] = {
    init: function() {
      this.appendValueInput('TEXT')
        .setCheck(['String', 'Number'])
        .appendField('说');
      this.appendValueInput('SECS')
        .setCheck('Number')
        .appendField('持续');
      this.appendDummyInput()
        .appendField('秒');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_think'] = {
    init: function() {
      this.appendValueInput('TEXT')
        .setCheck(['String', 'Number'])
        .appendField('思考');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_thinkforsecs'] = {
    init: function() {
      this.appendValueInput('TEXT')
        .setCheck(['String', 'Number'])
        .appendField('思考');
      this.appendValueInput('SECS')
        .setCheck('Number')
        .appendField('持续');
      this.appendDummyInput()
        .appendField('秒');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_show'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('显示');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_hide'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('隐藏');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_hideallsprites'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('隐藏所有角色');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_switchcostumeto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('换成造型')
        .appendField(new Blockly.FieldVariable('造型1'), 'COSTUME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_nextcostume'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('下一个造型');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_changesizeby'] = {
    init: function() {
      this.appendValueInput('CHANGE')
        .setCheck('Number')
        .appendField('将大小增加');
      this.appendDummyInput()
        .appendField('%');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_setsizeto'] = {
    init: function() {
      this.appendValueInput('SIZE')
        .setCheck('Number')
        .appendField('将大小设为');
      this.appendDummyInput()
        .appendField('%');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_changeeffectby'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将特效')
        .appendField(new Blockly.FieldDropdown([
          ['颜色', 'color'],
          ['鱼眼', 'fisheye'],
          ['漩涡', 'whirl'],
          ['像素化', 'pixelate'],
          ['亮度', 'brightness'],
          ['虚像', 'ghost']
        ]), 'EFFECT');
      this.appendValueInput('CHANGE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_seteffectto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将特效')
        .appendField(new Blockly.FieldDropdown([
          ['颜色', 'color'],
          ['鱼眼', 'fisheye'],
          ['漩涡', 'whirl'],
          ['像素化', 'pixelate'],
          ['亮度', 'brightness'],
          ['虚像', 'ghost']
        ]), 'EFFECT');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_cleargraphiceffects'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('清除所有图形特效');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_goforwardlayers'] = {
    init: function() {
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('移到最');
      this.appendDummyInput()
        .appendField('前');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_gobacklayers'] = {
    init: function() {
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('移到最');
      this.appendDummyInput()
        .appendField('后');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_gotofrontback'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('移到')
        .appendField(new Blockly.FieldDropdown([['最前面', 'front'], ['最后面', 'back']]), 'FRONT_BACK');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_switchbackdropto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('换成背景')
        .appendField(new Blockly.FieldDropdown([['背景1', 'backdrop1']]), 'BACKDROP');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_nextbackdrop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('下一个背景');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_backdropname'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('背景名称');
      this.setOutput(true, 'String');
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_costumenumbername'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('造型编号');
      this.setOutput(true, 'Number');
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_costumename'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('造型名称');
      this.setOutput(true, 'String');
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_backdropnumber'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('背景编号');
      this.setOutput(true, 'Number');
      this.setColour('#9966FF');
    }
  };

  Blockly.Blocks['looks_size'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('大小');
      this.setOutput(true, 'Number');
      this.setColour('#9966FF');
    }
  };

  // ========================================================================
  // Sound Blocks
  // ========================================================================
  Blockly.Blocks['sound_play'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('播放声音')
        .appendField(new Blockly.FieldVariable('pop'), 'SOUND');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
    }
  };

  Blockly.Blocks['sound_playuntildone'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('播放声音直到结束')
        .appendField(new Blockly.FieldVariable('pop'), 'SOUND');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
    }
  };

  Blockly.Blocks['sound_stopallsounds'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('停止所有声音');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
    }
  };

  Blockly.Blocks['sound_changeeffectby'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将音效')
        .appendField(new Blockly.FieldDropdown([['音高', 'pitch'], ['平衡', 'pan']]), 'EFFECT');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
    }
  };

  Blockly.Blocks['sound_seteffectto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将音效')
        .appendField(new Blockly.FieldDropdown([['音高', 'pitch'], ['平衡', 'pan']]), 'EFFECT');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
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
      this.setColour('#CFcf4F');
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
      this.setColour('#CFcf4F');
    }
  };

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
      this.setColour('#CFcf4F');
    }
  };

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
          ['Ride Bell', '12']
        ]), 'DRUM');
      this.appendValueInput('BEATS')
        .setCheck('Number')
        .appendField('拍');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
      this.setTooltip('演奏打击乐器');
    }
  };

  Blockly.Blocks['sound_rest'] = {
    init: function() {
      this.appendValueInput('BEATS')
        .setCheck('Number')
        .appendField('休止');
      this.appendDummyInput()
        .appendField('拍');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
      this.setTooltip('休止拍数');
    }
  };

  Blockly.Blocks['sound_settempo'] = {
    init: function() {
      this.appendValueInput('TEMPO')
        .setCheck('Number')
        .appendField('将演奏速度设为');
      this.appendDummyInput()
        .appendField('bpm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
      this.setTooltip('设置演奏速度(每分钟节拍数)');
    }
  };

  Blockly.Blocks['sound_changetempoby'] = {
    init: function() {
      this.appendValueInput('TEMPO')
        .setCheck('Number')
        .appendField('将演奏速度增加');
      this.appendDummyInput()
        .appendField('bpm');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#CFcf4F');
      this.setTooltip('增加演奏速度');
    }
  };

  Blockly.Blocks['sound_tempo'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('演奏速度');
      this.setOutput(true, 'Number');
      this.setColour('#CFcf4F');
      this.setTooltip('返回当前演奏速度(bpm)');
    }
  };

  Blockly.Blocks['sound_volume'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('音量');
      this.setOutput(true, 'Number');
      this.setColour('#CFcf4F');
      this.setTooltip('返回当前音量');
    }
  };

  // ========================================================================
  // Event Blocks
  // ========================================================================
  Blockly.Blocks['event_whenflagclicked'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当绿旗被点击');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
      this.setTooltip('当绿旗被点击时开始执行');
    }
  };

  Blockly.Blocks['event_whenkeypressed'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当按下')
        .appendField(new Blockly.FieldDropdown([
          ['空格', 'space'],
          ['上移', 'up arrow'],
          ['下移', 'down arrow'],
          ['左移', 'left arrow'],
          ['右移', 'right arrow'],
          ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'],
          ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
          ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9']
        ]), 'KEY');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whenthisspriteclicked'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当角色被点击');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whenbackdropswitchto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当背景切换到')
        .appendField(new Blockly.FieldDropdown([['背景1', 'backdrop1']]), 'BACKDROP');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whengreaterthan'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当')
        .appendField(new Blockly.FieldDropdown([
          ['计时器', 'TIMER'],
          ['响度', 'LOUDNESS']
        ]), 'WHENGREATERTHANMENU');
      this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('大于');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  // ========================================================================
  // Event Blocks
  // ========================================================================
  Blockly.Blocks['event_whenflagclicked'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当绿旗被点击');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
      this.setTooltip('当绿旗被点击时开始执行');
    }
  };

  Blockly.Blocks['event_whenkeypressed'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当按下')
        .appendField(new Blockly.FieldDropdown([
          ['空格', 'space'],
          ['上移', 'up arrow'],
          ['下移', 'down arrow'],
          ['左移', 'left arrow'],
          ['右移', 'right arrow'],
          ['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd'], ['e', 'e'],
          ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
          ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9']
        ]), 'KEY');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whenthisspriteclicked'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当角色被点击');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whenbackdropswitchto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当背景切换到')
        .appendField(new Blockly.FieldDropdown([['背景1', 'backdrop1']]), 'BACKDROP');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whengreaterthan'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当')
        .appendField(new Blockly.FieldDropdown([
          ['计时器', 'TIMER'],
          ['响度', 'LOUDNESS']
        ]), 'WHENGREATERTHANMENU');
      this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('大于');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_broadcast'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('广播')
        .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_broadcastandwait'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('广播并等待')
        .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };

  Blockly.Blocks['event_whenbroadcastreceived'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当收到广播')
        .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
      this.appendStatementInput('HANDLER');
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
      this.setTooltip('当接收到指定广播消息时执行');
    }
  };

  // ========================================================================
  // Control Blocks
  // ========================================================================
  Blockly.Blocks['control_wait'] = {
    init: function() {
      this.appendValueInput('DURATION')
        .setCheck('Number')
        .appendField('等待');
      this.appendDummyInput()
        .appendField('秒');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_wait_secs'] = {
    init: function() {
      this.appendValueInput('SECS')
        .setCheck('Number')
        .appendField('等待');
      this.appendDummyInput()
        .appendField('秒');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
      this.setTooltip('等待指定的秒数');
    }
  };

  Blockly.Blocks['control_wait_until'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('等待');
      this.appendValueInput('CONDITION')
        .setCheck('Boolean');
      this.appendDummyInput()
        .appendField('成立');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_repeat'] = {
    init: function() {
      this.appendValueInput('TIMES')
        .setCheck('Number')
        .appendField('重复');
      this.appendDummyInput()
        .appendField('次');
      this.appendStatementInput('SUBSTACK')
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
      this.setTooltip('重复执行积木块指定的次数');
    }
  };

  Blockly.Blocks['control_repeat_until'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('重复直到');
      this.appendValueInput('CONDITION')
        .setCheck('Boolean');
      this.appendStatementInput('SUBSTACK')
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_forever'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('无限循环');
      this.appendStatementInput('SUBSTACK')
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('停止')
        .appendField(new Blockly.FieldDropdown([
          ['全部', 'all'],
          ['这个脚本', 'this script'],
          ['角色的其他脚本', 'other scripts in sprite']
        ]), 'STOP_OPTION');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_start_as_clone'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('作为克隆体启动');
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_create_clone_of'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('创建')
        .appendField(new Blockly.FieldVariable('角色1'), 'CLONE_OPTION')
        .appendField('的克隆体');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_delete_this_clone'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('删除此克隆体');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_if'] = {
    init: function() {
      this.appendValueInput('CONDITION')
        .setCheck('Boolean')
        .appendField('如果');
      this.appendStatementInput('SUBSTACK')
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['control_if_else'] = {
    init: function() {
      this.appendValueInput('CONDITION')
        .setCheck('Boolean')
        .appendField('如果');
      this.appendStatementInput('SUBSTACK')
        .setCheck(null);
      this.appendDummyInput()
        .appendField('那么');
      this.appendStatementInput('SUBSTACK2')
        .setCheck(null);
      this.appendDummyInput()
        .appendField('否则');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  // ========================================================================
  // Sensing Blocks
  // ========================================================================
  Blockly.Blocks['sensing_touching'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('碰到')
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['边缘', '_edge_']
        ]), 'TOUCHINGOBJECT');
      this.appendDummyInput()
        .appendField('或角色')
        .appendField(new Blockly.FieldVariable('角色1'), 'SPRITE');
      this.setOutput(true, 'Boolean');
      this.setColour('#5CB1D6');
      this.setTooltip('检测角色是否碰到鼠标指针、边缘或其他角色');
    }
  };

  Blockly.Blocks['sensing_touchingcolor'] = {
    init: function() {
      this.appendValueInput('COLOR')
        .setCheck('Colour');
      this.appendDummyInput()
        .appendField('碰到颜色');
      this.setOutput(true, 'Boolean');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_coloristouching'] = {
    init: function() {
      this.appendValueInput('COLOR')
        .setCheck('Colour');
      this.appendDummyInput()
        .appendField('颜色');
      this.setOutput(true, 'Boolean');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_distanceto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('到')
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['随机位置', '_random_']
        ]), 'DISTANCETOMENU');
      this.appendDummyInput()
        .appendField('或角色')
        .appendField(new Blockly.FieldVariable('角色1'), 'SPRITE');
      this.appendDummyInput()
        .appendField('的距离');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
      this.setTooltip('检测到鼠标指针、随机位置或其他角色的距离');
    }
  };

  Blockly.Blocks['sensing_distancetomenu'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['鼠标指针', '_mouse_'],
          ['随机位置', '_random_']
        ]), 'DROPDOWN');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_dayssince2000'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('天数(从2000起)');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_askandwait'] = {
    init: function() {
      this.appendValueInput('QUESTION')
        .setCheck('String')
        .appendField('询问');
      this.appendDummyInput()
        .appendField('并等待');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_keypressed'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('按下')
        .appendField(new Blockly.FieldDropdown([
          ['空格', 'space'],
          ['上移', 'up arrow'],
          ['下移', 'down arrow'],
          ['左移', 'left arrow'],
          ['右移', 'right arrow']
        ]), 'KEY_OPTION');
      this.appendDummyInput()
        .appendField('键?');
      this.setOutput(true, 'Boolean');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_mousedown'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('鼠标按下?');
      this.setOutput(true, 'Boolean');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_mousex'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('鼠标X');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_mousey'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('鼠标Y');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_setdragmode'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('设置拖动模式')
        .appendField(new Blockly.FieldDropdown([
          ['可拖动', 'draggable'],
          ['不可拖动', 'none']
        ]), 'DRAG_MODE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_resettimer'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('计时器归零');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_timer'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('计时器');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_answer'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('回答');
      this.setOutput(true);
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_loudness'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('响度');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_current'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('当前时间')
        .appendField(new Blockly.FieldDropdown([
          ['年', 'YEAR'],
          ['月', 'MONTH'],
          ['日', 'DATE'],
          ['星期', 'DAYOFWEEK'],
          ['小时', 'HOUR'],
          ['分钟', 'MINUTE'],
          ['秒', 'SECOND']
        ]), 'CURRENTMENU');
      this.setOutput(true, 'Number');
      this.setColour('#5CB1D6');
    }
  };

  Blockly.Blocks['sensing_username'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('用户名');
      this.setOutput(true, 'String');
      this.setColour('#5CB1D6');
    }
  };

  // ========================================================================
  // Operator Blocks
  // ========================================================================
  Blockly.Blocks['operator_add'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('+');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_subtract'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('-');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_multiply'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('*');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_divide'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('/');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_random'] = {
    init: function() {
      this.appendValueInput('FROM')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('到');
      this.appendValueInput('TO')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('之间的随机整数');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_gt'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('>');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_lt'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('<');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_equals'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('=');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_and'] = {
    init: function() {
      this.appendValueInput('OPERAND1')
        .setCheck('Boolean');
      this.appendDummyInput()
        .appendField('且');
      this.appendValueInput('OPERAND2')
        .setCheck('Boolean');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_or'] = {
    init: function() {
      this.appendValueInput('OPERAND1')
        .setCheck('Boolean');
      this.appendDummyInput()
        .appendField('或');
      this.appendValueInput('OPERAND2')
        .setCheck('Boolean');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_not'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('不');
      this.appendValueInput('OPERAND')
        .setCheck('Boolean');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_join'] = {
    init: function() {
      this.appendValueInput('STRING1')
        .setCheck('String');
      this.appendDummyInput()
        .appendField('连接');
      this.appendValueInput('STRING2')
        .setCheck('String');
      this.setOutput(true, 'String');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_letter_of'] = {
    init: function() {
      this.appendValueInput('LETTER')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('的字符');
      this.appendValueInput('STRING')
        .setCheck('String');
      this.setOutput(true, 'String');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_length'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('长度');
      this.appendValueInput('STRING')
        .setCheck('String');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_mod'] = {
    init: function() {
      this.appendValueInput('NUM1')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('的余数');
      this.appendValueInput('NUM2')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_round'] = {
    init: function() {
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('四舍五入');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_mathop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('运算')
        .appendField(new Blockly.FieldDropdown([
          ['绝对值', 'abs'],
          ['向下取整', 'floor'],
          ['向上取整', 'ceiling'],
          ['平方根', 'sqrt'],
          ['正弦', 'sin'],
          ['余弦', 'cos'],
          ['正切', 'tan'],
          ['反正弦', 'asin'],
          ['反余弦', 'acos'],
          ['反正切', 'atan'],
          ['自然对数', 'ln'],
          ['常用对数', 'log'],
          ['e的幂', 'e^'],
          ['10的幂', '10^']
        ]), 'OP');
      this.appendValueInput('NUM')
        .setCheck('Number');
      this.setOutput(true, 'Number');
      this.setColour('#59C059');
    }
  };

  Blockly.Blocks['operator_contains'] = {
    init: function() {
      this.appendValueInput('STRING1')
        .setCheck('String');
      this.appendDummyInput()
        .appendField('包含');
      this.appendValueInput('STRING2')
        .setCheck('String');
      this.setOutput(true, 'Boolean');
      this.setColour('#59C059');
    }
  };

  // ========================================================================
  // Data Blocks (Variables)
  // ========================================================================
  Blockly.Blocks['data_variable'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldVariable('我的变量'), 'VARIABLE');
      this.setOutput(true);
      this.setColour('#FF8C1A');
      this.setTooltip('获取变量的值');
    }
  };

  Blockly.Blocks['data_setvariableto'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将变量')
        .appendField(new Blockly.FieldVariable('我的变量'), 'VARIABLE')
        .appendField('设为');
      this.appendValueInput('VALUE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };

  Blockly.Blocks['data_changevariableby'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将变量')
        .appendField(new Blockly.FieldVariable('我的变量'), 'VARIABLE')
        .appendField('增加');
      this.appendValueInput('VALUE')
        .setCheck('Number');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };

  Blockly.Blocks['data_showvariable'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('显示变量')
        .appendField(new Blockly.FieldVariable('我的变量'), 'VARIABLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };

  Blockly.Blocks['data_hidevariable'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('隐藏变量')
        .appendField(new Blockly.FieldVariable('我的变量'), 'VARIABLE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };

  // ========================================================================
  // List Blocks
  // ========================================================================
  Blockly.Blocks['data_addtolist'] = {
    init: function() {
      this.appendValueInput('ITEM')
        .appendField('将');
      this.appendDummyInput()
        .appendField('加入列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_deleteoflist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('删除第');
      this.appendValueInput('INDEX')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('项从列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_deletealloflist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('删除列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST')
        .appendField('的全部项目');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_inserttolist'] = {
    init: function() {
      this.appendValueInput('ITEM')
        .appendField('将');
      this.appendDummyInput()
        .appendField('插入第');
      this.appendValueInput('INDEX')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('项到列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_replaceitemoflist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('将列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST')
        .appendField('的第');
      this.appendValueInput('INDEX')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('项替换为');
      this.appendValueInput('ITEM');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_itemoflist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST')
        .appendField('的第');
      this.appendValueInput('INDEX')
        .setCheck('Number');
      this.appendDummyInput()
        .appendField('项');
      this.setOutput(true);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_lengthoflist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST')
        .appendField('的长度');
      this.setOutput(true, 'Number');
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_listcontainsitem'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST')
        .appendField('包含');
      this.appendValueInput('ITEM');
      this.appendDummyInput()
        .appendField('?');
      this.setOutput(true, 'Boolean');
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_list'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setOutput(true);
      this.setColour('#FF661A');
      this.setTooltip('获取列表的全部内容');
    }
  };

  Blockly.Blocks['data_showlist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('显示列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  Blockly.Blocks['data_hidelist'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('隐藏列表')
        .appendField(new Blockly.FieldVariable('我的列表'), 'LIST');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF661A');
    }
  };

  // ========================================================================
  // Procedure Blocks
  // ========================================================================
  Blockly.Blocks['procedures_definition'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('定义')
        .appendField(new Blockly.FieldTextInput('我的积木'), 'NAME');
      this.appendStatementInput('STACK');
      this.setColour('#FFAB19');
    }
  };

  Blockly.Blocks['procedures_call'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('调用')
        .appendField(new Blockly.FieldTextInput('我的积木'), 'NAME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  // ========================================================================
  // Pen Blocks
  // ========================================================================
  Blockly.Blocks['pen_up'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('抬笔');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('抬起画笔，停止绘制');
    }
  };

  Blockly.Blocks['pen_down'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('落笔');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('放下画笔，开始绘制');
    }
  };

  Blockly.Blocks['pen_color'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('画笔颜色')
        .appendField(new Blockly.FieldColour('#000000'), 'COLOR');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('设置画笔颜色');
    }
  };

  Blockly.Blocks['pen_size'] = {
    init: function() {
      this.appendValueInput('SIZE')
        .setCheck('Number')
        .appendField('画笔大小');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('设置画笔粗细');
    }
  };

  Blockly.Blocks['pen_clear'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('清除');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('清除所有画笔痕迹');
    }
  };

  Blockly.Blocks['pen_stamp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('图章');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#00A0A0');
      this.setTooltip('将角色图像印在舞台上');
    }
  };
};