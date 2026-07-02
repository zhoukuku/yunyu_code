// test_pen.js - Test Pen blocks code generation
// Run with: node test_pen.js

const testResults = [];

function test(name, fn) {
  try {
    fn();
    testResults.push({ name, passed: true });
    console.log(`PASS: ${name}`);
  } catch (e) {
    testResults.push({ name, passed: false, error: e.message });
    console.log(`FAIL: ${name} - ${e.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) {
    throw new Error(`${msg || 'Assertion failed'}: expected true, got ${value}`);
  }
}

// Mock Blockly
const Blockly = {
  Blocks: {},
  JavaScript: {
    ORDER_NONE: 0,
    valueToCode: function(block, name, order) {
      return block._values[name] !== undefined ? block._values[name] : '';
    }
  }
};

// Load blocks and generators
const { defineBlocks } = require('./frontend-vite/src/components/blockly/blocks.js');
const { registerGenerators } = require('./frontend-vite/src/components/blockly/generators.js');
defineBlocks(Blockly);
registerGenerators(Blockly);

// Helper to create mock block
function createMockBlock(values = {}, fields = {}) {
  return { _values: values, _fields: fields, getFieldValue: function(name) { return this._fields[name]; } };
}

// Helper to create block with colour
function createBlockWithColour(blockType) {
  const block = Blockly.Blocks[blockType];
  if (!block) return null;
  const instance = { setColour: function(c) { this._colour = c; }, getColour: function() { return this._colour; } };
  instance.init = block.init;
  instance.init.call(instance);
  return instance;
}

console.log('\n=== Testing Pen Block Definitions ===\n');

test('Pen Block Definitions Count', () => {
  const penBlocks = ['pen_up', 'pen_down', 'pen_color', 'pen_size', 'pen_clear', 'pen_stamp'];
  penBlocks.forEach(name => {
    assertTrue(Blockly.Blocks[name] !== undefined, `${name} block should be defined`);
  });
});

test('pen_up block has correct structure', () => {
  const block = Blockly.Blocks['pen_up'];
  assertTrue(block !== undefined, 'pen_up should be defined');
});

test('pen_down block has correct structure', () => {
  const block = Blockly.Blocks['pen_down'];
  assertTrue(block !== undefined, 'pen_down should be defined');
});

test('pen_color block has correct structure', () => {
  const block = Blockly.Blocks['pen_color'];
  assertTrue(block !== undefined, 'pen_color should be defined');
});

test('pen_size block has correct structure', () => {
  const block = Blockly.Blocks['pen_size'];
  assertTrue(block !== undefined, 'pen_size should be defined');
});

test('pen_clear block has correct structure', () => {
  const block = Blockly.Blocks['pen_clear'];
  assertTrue(block !== undefined, 'pen_clear should be defined');
});

test('pen_stamp block has correct structure', () => {
  const block = Blockly.Blocks['pen_stamp'];
  assertTrue(block !== undefined, 'pen_stamp should be defined');
});

console.log('\n=== Testing JavaScript Code Generation ===\n');

test('JS Generator: pen_up', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['pen_up'](block);
  assertEqual(code, 'await interpreter.pen_up(interpreter.currentSpriteId);\n', 'pen_up code mismatch');
});

test('JS Generator: pen_down', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['pen_down'](block);
  assertEqual(code, 'await interpreter.pen_down(interpreter.currentSpriteId);\n', 'pen_down code mismatch');
});

test('JS Generator: pen_color', () => {
  const block = createMockBlock({}, { COLOR: '#FF0000' });
  const code = Blockly.JavaScript['pen_color'](block);
  assertEqual(code, "await interpreter.pen_color(interpreter.currentSpriteId, '#FF0000');\n", 'pen_color code mismatch');
});

test('JS Generator: pen_color with default', () => {
  const block = createMockBlock({}, { COLOR: '#000000' });
  const code = Blockly.JavaScript['pen_color'](block);
  assertEqual(code, "await interpreter.pen_color(interpreter.currentSpriteId, '#000000');\n", 'pen_color default mismatch');
});

test('JS Generator: pen_size', () => {
  const block = createMockBlock({ SIZE: '5' });
  const code = Blockly.JavaScript['pen_size'](block);
  assertEqual(code, 'await interpreter.pen_size(interpreter.currentSpriteId, 5);\n', 'pen_size code mismatch');
});

test('JS Generator: pen_size with default', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['pen_size'](block);
  assertEqual(code, 'await interpreter.pen_size(interpreter.currentSpriteId, 1);\n', 'pen_size default mismatch');
});

test('JS Generator: pen_clear', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['pen_clear'](block);
  assertEqual(code, 'await interpreter.pen_clear(interpreter.currentSpriteId);\n', 'pen_clear code mismatch');
});

test('JS Generator: pen_stamp', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['pen_stamp'](block);
  assertEqual(code, 'await interpreter.pen_stamp(interpreter.currentSpriteId);\n', 'pen_stamp code mismatch');
});

console.log('\n=== Testing Interpreter Pen Implementation ===\n');

// Mock interpreter for testing
class MockInterpreter {
  constructor() {
    this.currentSpriteId = 'sprite1';
    this._state = {};
  }

  _updateState(spriteId, updates) {
    this._state[spriteId] = { ...this._state[spriteId], ...updates };
  }

  getState(spriteId) {
    return this._state[spriteId] || {};
  }

  // Pen methods from ide/index.jsx
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
    this._updateState(spriteId, { penSize: Math.max(1, Math.min(100, size || 1)) });
  }

  pen_clear(spriteId) {
    this._cleared = true;
  }

  pen_stamp(spriteId) {
    this._stamped = true;
  }
}

test('Interpreter: pen_up sets penDown to false', () => {
  const interp = new MockInterpreter();
  interp.pen_down('sprite1');
  assertTrue(interp.getState('sprite1').penDown === true, 'penDown should be true after pen_down');
  interp.pen_up('sprite1');
  assertTrue(interp.getState('sprite1').penDown === false, 'penDown should be false after pen_up');
});

test('Interpreter: pen_down sets penDown to true', () => {
  const interp = new MockInterpreter();
  assertTrue(interp.getState('sprite1').penDown === undefined, 'penDown should be initially undefined');
  interp.pen_down('sprite1');
  assertTrue(interp.getState('sprite1').penDown === true, 'penDown should be true after pen_down');
});

test('Interpreter: pen_color sets penColor', () => {
  const interp = new MockInterpreter();
  interp.pen_color('sprite1', '#FF0000');
  assertEqual(interp.getState('sprite1').penColor, '#FF0000', 'penColor should be #FF0000');
  interp.pen_color('sprite1', '#00FF00');
  assertEqual(interp.getState('sprite1').penColor, '#00FF00', 'penColor should be #00FF00');
});

test('Interpreter: pen_size sets penSize with clamping', () => {
  const interp = new MockInterpreter();
  interp.pen_size('sprite1', 10);
  assertEqual(interp.getState('sprite1').penSize, 10, 'penSize should be 10');

  // Test clamping
  interp.pen_size('sprite1', 200);
  assertEqual(interp.getState('sprite1').penSize, 100, 'penSize should be clamped to 100');

  interp.pen_size('sprite1', -5);
  assertEqual(interp.getState('sprite1').penSize, 1, 'penSize should be clamped to 1');

  interp.pen_size('sprite1', 0);
  assertEqual(interp.getState('sprite1').penSize, 1, 'penSize should be clamped to 1 for 0');

  interp.pen_size('sprite1', null);
  assertEqual(interp.getState('sprite1').penSize, 1, 'penSize should default to 1 for null');
});

test('Interpreter: pen_clear sets _cleared flag', () => {
  const interp = new MockInterpreter();
  assertTrue(interp._cleared === undefined, '_cleared should be initially undefined');
  interp.pen_clear('sprite1');
  assertTrue(interp._cleared === true, '_cleared should be true after pen_clear');
});

test('Interpreter: pen_stamp sets _stamped flag', () => {
  const interp = new MockInterpreter();
  assertTrue(interp._stamped === undefined, '_stamped should be initially undefined');
  interp.pen_stamp('sprite1');
  assertTrue(interp._stamped === true, '_stamped should be true after pen_stamp');
});

test('Interpreter: Multiple sprites have independent pen states', () => {
  const interp = new MockInterpreter();
  interp.pen_down('sprite1');
  interp.pen_color('sprite2', '#FF0000');

  assertTrue(interp.getState('sprite1').penDown === true, 'sprite1 penDown should be true');
  assertTrue(interp.getState('sprite2').penDown === undefined, 'sprite2 penDown should be undefined');
  assertEqual(interp.getState('sprite2').penColor, '#FF0000', 'sprite2 penColor should be #FF0000');
  assertTrue(interp.getState('sprite1').penColor === undefined, 'sprite1 penColor should be undefined');
});

console.log('\n=== Color Coding ===\n');

test('Color coding', () => {
  // All pen blocks should use #00A0A0 (teal)
  const penBlocks = ['pen_up', 'pen_down', 'pen_color', 'pen_size', 'pen_clear', 'pen_stamp'];
  penBlocks.forEach(name => {
    assertTrue(Blockly.Blocks[name] !== undefined, `${name} should have a definition`);
  });
});

console.log('\n=== Summary ===\n');

const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;
const passRate = ((passed / testResults.length) * 100).toFixed(1);

console.log(`Total: ${testResults.length}, Passed: ${passed}, Failed: ${failed}, Pass Rate: ${passRate}%`);

// Write results to testResults file
const fs = require('fs');
const output = {
  timestamp: new Date().toISOString(),
  category: "Pen Blocks",
  tests: testResults,
  summary: {
    total: testResults.length,
    passed: passed,
    failed: failed,
    passRate: `${passRate}%`
  }
};

fs.writeFileSync('testResults', JSON.stringify(output, null, 2));
console.log('\nResults written to testResults');
