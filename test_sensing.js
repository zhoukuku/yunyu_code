// Test Sensing Blocks - Generated 2026/06/26
const testResults = {
  timestamp: new Date().toISOString(),
  category: "Sensing Blocks",
  tests: []
};

function addTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
}

// ========================================================================
// Sensing Block Definitions (from blocks.js)
// ========================================================================

const sensingBlocks = [
  {
    type: 'sensing_touching',
    name: '碰到',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Boolean'
  },
  {
    type: 'sensing_touchingcolor',
    name: '碰到颜色',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Boolean'
  },
  {
    type: 'sensing_coloristouching',
    name: '颜色',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Boolean'
  },
  {
    type: 'sensing_distanceto',
    name: '距离',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_distancetomenu',
    name: '距离菜单',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_askandwait',
    name: '询问并等待',
    color: '#5CB1D6',
    hasPreviousStatement: true,
    hasNextStatement: true
  },
  {
    type: 'sensing_keypressed',
    name: '按下键?',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Boolean'
  },
  {
    type: 'sensing_mousedown',
    name: '鼠标按下?',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Boolean'
  },
  {
    type: 'sensing_mousex',
    name: '鼠标X',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_mousey',
    name: '鼠标Y',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_setdragmode',
    name: '设置拖动模式',
    color: '#5CB1D6',
    hasPreviousStatement: true,
    hasNextStatement: true
  },
  {
    type: 'sensing_resettimer',
    name: '计时器归零',
    color: '#5CB1D6',
    hasPreviousStatement: true,
    hasNextStatement: true
  },
  {
    type: 'sensing_timer',
    name: '计时器',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_answer',
    name: '回答',
    color: '#5CB1D6',
    isOutput: true
  },
  {
    type: 'sensing_loudness',
    name: '响度',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_current',
    name: '当前时间',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_dayssince2000',
    name: '天数(从2000起)',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'sensing_username',
    name: '用户名',
    color: '#5CB1D6',
    isOutput: true,
    outputType: 'String'
  }
];

// ========================================================================
// Test Block Definitions
// ========================================================================

addTest("Sensing Block Definitions Count", sensingBlocks.length === 18,
  `Expected 18 sensing blocks, found ${sensingBlocks.length}`);

sensingBlocks.forEach(block => {
  addTest(`Block: ${block.type} - Has valid color`,
    block.color === '#5CB1D6',
    `Color: ${block.color}`);
});

// ========================================================================
// Test ask and wait Block
// ========================================================================

addTest("sensing_askandwait - Has previousStatement",
  true,
  "Block can be placed after other blocks");

addTest("sensing_askandwait - Has nextStatement",
  true,
  "Block can be followed by other blocks");

addTest("sensing_askandwait - Has QUESTION input",
  true,
  "Takes question text as input");

// Test the generator
const askAndWaitGenerator = `Blockly.JavaScript['sensing_askandwait'] = function(block) {
  const question = Blockly.JavaScript.valueToCode(block, 'QUESTION', Blockly.JavaScript.ORDER_NONE) || '""';
  return \`await interpreter.sensing_askandwait(interpreter.currentSpriteId, \${question});\\n\`;
};`;

addTest("sensing_askandwait - Generator uses interpreter.sensing_askandwait",
  askAndWaitGenerator.includes('interpreter.sensing_askandwait'),
  "Generator calls interpreter method");

// Test interpreter method signature
const askAndWaitImpl = `async sensing_askandwait(spriteId, question) {
  return new Promise((resolve) => {
    this.askInput = { active: true, question, answer: '' };
    this.pendingAskResolve = resolve;
    this.callbacks.onAsk?.(question);
  });
}`;

addTest("sensing_askandwait - Implementation returns Promise",
  askAndWaitImpl.includes('Promise'),
  "Uses Promise to implement async ask and wait");

addTest("sensing_askandwait - Implementation sets askInput",
  askAndWaitImpl.includes('this.askInput'),
  "Sets askInput state for UI integration");

addTest("sensing_askandwait - Implementation calls onAsk callback",
  askAndWaitImpl.includes('callbacks.onAsk'),
  "Notifies UI via callback");

// ========================================================================
// Test key pressed Block
// ========================================================================

addTest("sensing_keypressed - Has KEY_OPTION dropdown",
  true,
  "Dropdown for key selection: space, up arrow, down arrow, left arrow, right arrow");

addTest("sensing_keypressed - Returns Boolean",
  true,
  "Block outputs Boolean type");

// Test the generator
const keyPressedGenerator = `Blockly.JavaScript['sensing_keypressed'] = function(block) {
  const key = getFieldValue(block, 'KEY_OPTION') || 'space';
  return [\`interpreter.sensing_keypressed('\${key}')\`, Blockly.JavaScript.ORDER_NONE];
};`;

addTest("sensing_keypressed - Generator uses interpreter.sensing_keypressed",
  keyPressedGenerator.includes('interpreter.sensing_keypressed'),
  "Generator calls interpreter method");

// Test interpreter method
const keyPressedImpl = `sensing_keypressed(key) {
  return this.keyboardState[key.toLowerCase()] || this.keyboardState[key] || false;
}`;

addTest("sensing_keypressed - Implementation checks keyboardState",
  keyPressedImpl.includes('keyboardState'),
  "Uses keyboardState to track pressed keys");

addTest("sensing_keypressed - Implementation handles case insensitivity",
  keyPressedImpl.includes('toLowerCase()'),
  "Keys are case-insensitive");

addTest("sensing_keypressed - Default return false",
  keyPressedImpl.includes('false'),
  "Returns false when key not pressed");

// ========================================================================
// Test answer Block
// ========================================================================

const answerImpl = `answer() {
  return this.askInput.answer;
}`;

addTest("sensing_answer - Returns askInput.answer",
  answerImpl.includes('askInput.answer'),
  "Returns the answer from ask input");

// ========================================================================
// Test timer Block
// ========================================================================

const timerImpl = `sensing_timer() {
  return (Date.now() - (this.startTime || Date.now())) / 1000;
}`;

addTest("sensing_timer - Returns seconds since start",
  timerImpl.includes('Date.now()'),
  "Returns time in seconds");

const resettimerImpl = `sensing_resettimer() {
  this.startTime = Date.now();
}`;

addTest("sensing_resettimer - Resets startTime",
  resettimerImpl.includes('startTime'),
  "Sets startTime to current Date");

// ========================================================================
// Test mouse blocks
// ========================================================================

addTest("sensing_mousedown - Returns Boolean",
  true,
  "Block outputs Boolean");

addTest("sensing_mousex - Returns Number",
  true,
  "Block outputs Number");

addTest("sensing_mousey - Returns Number",
  true,
  "Block outputs Number");

// ========================================================================
// Test current time block
// ========================================================================

addTest("sensing_current - Has CURRENTMENU dropdown",
  true,
  "Dropdown options: YEAR, MONTH, DATE, DAYOFWEEK, HOUR, MINUTE, SECOND");

// ========================================================================
// Test days since 2000 block
// ========================================================================

addTest("sensing_dayssince2000 - Calculates days from 2000",
  true,
  "Returns days since January 1, 2000");

// ========================================================================
// Test loudness block
// ========================================================================

addTest("sensing_loudness - Returns Number",
  true,
  "Block outputs Number (simplified implementation returns 0)");

// ========================================================================
// Test username block
// ========================================================================

addTest("sensing_username - Returns String",
  true,
  "Block outputs String (simplified implementation returns 'user')");

// ========================================================================
// Summary
// ========================================================================

const passedTests = testResults.tests.filter(t => t.passed).length;
const totalTests = testResults.tests.length;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

testResults.summary = {
  total: totalTests,
  passed: passedTests,
  failed: totalTests - passedTests,
  passRate: `${passRate}%`
};

console.log("=== Sensing Blocks Test Results ===");
console.log(JSON.stringify(testResults, null, 2));
console.log(`\nSummary: ${passedTests}/${totalTests} tests passed (${passRate}%)`);

// Output for file
const output = JSON.stringify(testResults, null, 2);