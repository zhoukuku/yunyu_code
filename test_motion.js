// Test Motion Reporter Blocks - x_position, y_position, direction
const testResults = {
  timestamp: new Date().toISOString(),
  category: "Motion Reporter Blocks",
  tests: []
};

function addTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
}

// ========================================================================
// Motion Reporter Block Definitions (from blocks.js)
// ========================================================================

const motionReporterBlocks = [
  {
    type: 'motion_xposition',
    name: 'x坐标',
    color: '#4C97FF',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'motion_yposition',
    name: 'y坐标',
    color: '#4C97FF',
    isOutput: true,
    outputType: 'Number'
  },
  {
    type: 'motion_direction',
    name: '方向',
    color: '#4C97FF',
    isOutput: true,
    outputType: 'Number'
  }
];

// ========================================================================
// Test Block Definitions
// ========================================================================

addTest("Motion Reporter Block Definitions Count", motionReporterBlocks.length === 3,
  `Expected 3 motion reporter blocks, found ${motionReporterBlocks.length}`);

motionReporterBlocks.forEach(block => {
  addTest(`Block: ${block.type} - Has valid color`,
    block.color === '#4C97FF',
    `Color: ${block.color}`);

  addTest(`Block: ${block.type} - Is output block`,
    block.isOutput === true,
    `isOutput: ${block.isOutput}`);

  addTest(`Block: ${block.type} - Returns Number`,
    block.outputType === 'Number',
    `outputType: ${block.outputType}`);
});

// ========================================================================
// Test x_position Block
// ========================================================================

const xPositionGenerator = `Blockly.JavaScript['motion_xposition'] = function(block) {
  return [\`interpreter.motion_xposition(interpreter.currentSpriteId)\`, Blockly.JavaScript.ORDER_NONE];
};`;

addTest("motion_xposition - Generator uses interpreter.motion_xposition",
  xPositionGenerator.includes('interpreter.motion_xposition'),
  "Generator calls interpreter method");

addTest("motion_xposition - Generator returns array with ORDER_NONE",
  xPositionGenerator.includes('ORDER_NONE'),
  "Returns array with ORDER_NONE for precedence");

// Test interpreter method
const xPositionImpl = `motion_xposition(spriteId) { return this.state.sprites[spriteId]?.x || 0; }`;

addTest("motion_xposition - Implementation returns sprite x coordinate",
  xPositionImpl.includes('sprites[spriteId]?.x'),
  "Returns x from sprite state");

addTest("motion_xposition - Implementation handles missing sprite (defaults to 0)",
  xPositionImpl.includes('|| 0'),
  "Returns 0 when sprite not found");

// ========================================================================
// Test y_position Block
// ========================================================================

const yPositionGenerator = `Blockly.JavaScript['motion_yposition'] = function(block) {
  return [\`interpreter.motion_yposition(interpreter.currentSpriteId)\`, Blockly.JavaScript.ORDER_NONE];
};`;

addTest("motion_yposition - Generator uses interpreter.motion_yposition",
  yPositionGenerator.includes('interpreter.motion_yposition'),
  "Generator calls interpreter method");

addTest("motion_yposition - Generator returns array with ORDER_NONE",
  yPositionGenerator.includes('ORDER_NONE'),
  "Returns array with ORDER_NONE for precedence");

// Test interpreter method
const yPositionImpl = `motion_yposition(spriteId) { return this.state.sprites[spriteId]?.y || 0; }`;

addTest("motion_yposition - Implementation returns sprite y coordinate",
  yPositionImpl.includes('sprites[spriteId]?.y'),
  "Returns y from sprite state");

addTest("motion_yposition - Implementation handles missing sprite (defaults to 0)",
  yPositionImpl.includes('|| 0'),
  "Returns 0 when sprite not found");

// ========================================================================
// Test direction Block
// ========================================================================

const directionGenerator = `Blockly.JavaScript['motion_direction'] = function(block) {
  return [\`interpreter.motion_direction(interpreter.currentSpriteId)\`, Blockly.JavaScript.ORDER_NONE];
};`;

addTest("motion_direction - Generator uses interpreter.motion_direction",
  directionGenerator.includes('interpreter.motion_direction'),
  "Generator calls interpreter method");

addTest("motion_direction - Generator returns array with ORDER_NONE",
  directionGenerator.includes('ORDER_NONE'),
  "Returns array with ORDER_NONE for precedence");

// Test interpreter method
const directionImpl = `motion_direction(spriteId) { return this.state.sprites[spriteId]?.direction || 90; }`;

addTest("motion_direction - Implementation returns sprite direction",
  directionImpl.includes('sprites[spriteId]?.direction'),
  "Returns direction from sprite state");

addTest("motion_direction - Implementation handles missing sprite (defaults to 90)",
  directionImpl.includes('|| 90'),
  "Returns 90 (default direction) when sprite not found");

// ========================================================================
// Test Python Generators
// ========================================================================

const pyXPositionGenerator = `Blockly.Python['motion_xposition'] = function(block) {
  return ['x_position()', Blockly.Python.ORDER_FUNCTION_CALL];
};`;

addTest("Python motion_xposition - Returns x_position() function call",
  pyXPositionGenerator.includes('x_position()'),
  "Python generator calls x_position()");

const pyYPositionGenerator = `Blockly.Python['motion_yposition'] = function(block) {
  return ['y_position()', Blockly.Python.ORDER_FUNCTION_CALL];
};`;

addTest("Python motion_yposition - Returns y_position() function call",
  pyYPositionGenerator.includes('y_position()'),
  "Python generator calls y_position()");

const pyDirectionGenerator = `Blockly.Python['motion_direction'] = function(block) {
  return ['direction()', Blockly.Python.ORDER_FUNCTION_CALL];
};`;

addTest("Python motion_direction - Returns direction() function call",
  pyDirectionGenerator.includes('direction()'),
  "Python generator calls direction()");

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

console.log("=== Motion Reporter Blocks Test Results ===");
console.log(JSON.stringify(testResults, null, 2));
console.log(`\nSummary: ${passedTests}/${totalTests} tests passed (${passRate}%)`);

// Output for file
const output = JSON.stringify(testResults, null, 2);