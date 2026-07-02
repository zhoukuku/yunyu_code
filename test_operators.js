// test_operators.js - Test Operators blocks code generation
// Run with: node test_operators.js

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
  JavaScript: {
    ORDER_ADDITION: 1,
    ORDER_SUBTRACTION: 2,
    ORDER_MULTIPLICATION: 3,
    ORDER_DIVISION: 4,
    ORDER_RELATIONAL: 5,
    ORDER_EQUALITY: 6,
    ORDER_LOGICAL_AND: 7,
    ORDER_LOGICAL_OR: 8,
    ORDER_LOGICAL_NOT: 9,
    ORDER_NONE: 0,
    valueToCode: function(block, name, order) {
      return block._values[name];
    }
  },
  Python: {
    ORDER_ADDITIVE: 1,
    ORDER_MULTIPLICATIVE: 2,
    ORDER_RELATIONAL: 3,
    ORDER_LOGICAL_AND: 4,
    ORDER_LOGICAL_OR: 5,
    ORDER_LOGICAL_NOT: 6,
    ORDER_NONE: 0,
    valueToCode: function(block, name, order) {
      return block._values[name];
    }
  }
};

// Load generators
const { registerGenerators, registerPythonGenerators } = require('./frontend-vite/src/components/blockly/generators.js');
registerGenerators(Blockly);
registerPythonGenerators(Blockly);

// Helper to create mock block
function createMockBlock(values) {
  return { _values: values };
}

console.log('\n=== Testing JavaScript Code Generation ===\n');

// Math Operators
test('JavaScript: operator_add generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.JavaScript['operator_add'](block);
  assertEqual(code[0], '(5) + (3)', 'Addition code mismatch');
});

test('JavaScript: operator_subtract generates correct code', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '4' });
  const code = Blockly.JavaScript['operator_subtract'](block);
  assertEqual(code[0], '(10) - (4)', 'Subtraction code mismatch');
});

test('JavaScript: operator_multiply generates correct code', () => {
  const block = createMockBlock({ NUM1: '6', NUM2: '7' });
  const code = Blockly.JavaScript['operator_multiply'](block);
  assertEqual(code[0], '(6) * (7)', 'Multiplication code mismatch');
});

test('JavaScript: operator_divide generates correct code', () => {
  const block = createMockBlock({ NUM1: '20', NUM2: '4' });
  const code = Blockly.JavaScript['operator_divide'](block);
  assertEqual(code[0], '(20) / (4)', 'Division code mismatch');
});

test('JavaScript: operator_add handles missing values', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['operator_add'](block);
  assertEqual(code[0], '(0) + (0)', 'Default values not used');
});

test('JavaScript: operator_divide handles missing divisor', () => {
  const block = createMockBlock({ NUM1: '10' });
  const code = Blockly.JavaScript['operator_divide'](block);
  assertEqual(code[0], '(10) / (1)', 'Default divisor not 1');
});

// Comparison Operators
test('JavaScript: operator_gt generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.JavaScript['operator_gt'](block);
  assertEqual(code[0], '(5) > (3)', 'Greater than code mismatch');
});

test('JavaScript: operator_lt generates correct code', () => {
  const block = createMockBlock({ NUM1: '2', NUM2: '7' });
  const code = Blockly.JavaScript['operator_lt'](block);
  assertEqual(code[0], '(2) < (7)', 'Less than code mismatch');
});

test('JavaScript: operator_equals generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '5' });
  const code = Blockly.JavaScript['operator_equals'](block);
  assertEqual(code[0], '(5) === (5)', 'Equals code mismatch');
});

// Logical Operators
test('JavaScript: operator_and generates correct code', () => {
  const block = createMockBlock({ OPERAND1: 'true', OPERAND2: 'false' });
  const code = Blockly.JavaScript['operator_and'](block);
  assertEqual(code[0], '(true) && (false)', 'AND code mismatch');
});

test('JavaScript: operator_or generates correct code', () => {
  const block = createMockBlock({ OPERAND1: 'true', OPERAND2: 'false' });
  const code = Blockly.JavaScript['operator_or'](block);
  assertEqual(code[0], '(true) || (false)', 'OR code mismatch');
});

test('JavaScript: operator_not generates correct code', () => {
  const block = createMockBlock({ OPERAND: 'true' });
  const code = Blockly.JavaScript['operator_not'](block);
  assertEqual(code[0], '!(true)', 'NOT code mismatch');
});

test('JavaScript: operator_not handles missing operand', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['operator_not'](block);
  assertEqual(code[0], '!(false)', 'Default operand not false');
});

console.log('\n=== Testing Python Code Generation ===\n');

// Python Math Operators
test('Python: operator_add generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.Python['operator_add'](block);
  assertEqual(code[0], '5 + 3', 'Python addition code mismatch');
});

test('Python: operator_subtract generates correct code', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '4' });
  const code = Blockly.Python['operator_subtract'](block);
  assertEqual(code[0], '10 - 4', 'Python subtraction code mismatch');
});

test('Python: operator_multiply generates correct code', () => {
  const block = createMockBlock({ NUM1: '6', NUM2: '7' });
  const code = Blockly.Python['operator_multiply'](block);
  assertEqual(code[0], '6 * 7', 'Python multiplication code mismatch');
});

test('Python: operator_divide generates correct code', () => {
  const block = createMockBlock({ NUM1: '20', NUM2: '4' });
  const code = Blockly.Python['operator_divide'](block);
  assertEqual(code[0], '20 / 4', 'Python division code mismatch');
});

// Python Comparison Operators
test('Python: operator_gt generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.Python['operator_gt'](block);
  assertEqual(code[0], '5 > 3', 'Python greater than code mismatch');
});

test('Python: operator_lt generates correct code', () => {
  const block = createMockBlock({ NUM1: '2', NUM2: '7' });
  const code = Blockly.Python['operator_lt'](block);
  assertEqual(code[0], '2 < 7', 'Python less than code mismatch');
});

test('Python: operator_equals generates correct code', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '5' });
  const code = Blockly.Python['operator_equals'](block);
  assertEqual(code[0], '5 == 5', 'Python equals code mismatch');
});

// Python Logical Operators
test('Python: operator_and generates correct code', () => {
  const block = createMockBlock({ OPERAND1: 'True', OPERAND2: 'False' });
  const code = Blockly.Python['operator_and'](block);
  assertEqual(code[0], 'True and False', 'Python AND code mismatch');
});

test('Python: operator_or generates correct code', () => {
  const block = createMockBlock({ OPERAND1: 'True', OPERAND2: 'False' });
  const code = Blockly.Python['operator_or'](block);
  assertEqual(code[0], 'True or False', 'Python OR code mismatch');
});

test('Python: operator_not generates correct code', () => {
  const block = createMockBlock({ OPERAND: 'True' });
  const code = Blockly.Python['operator_not'](block);
  assertEqual(code[0], 'not True', 'Python NOT code mismatch');
});

// Test String Operators
console.log('\n=== Testing String Operators ===\n');

test('JavaScript: operator_join generates correct code', () => {
  const block = createMockBlock({ STRING1: '"Hello"', STRING2: '"World"' });
  const code = Blockly.JavaScript['operator_join'](block);
  assertEqual(code[0], 'interpreter.operator_join("Hello", "World")', 'Join code mismatch');
});

test('JavaScript: operator_length generates correct code', () => {
  const block = createMockBlock({ STRING: '"test"' });
  const code = Blockly.JavaScript['operator_length'](block);
  assertEqual(code[0], 'interpreter.operator_length(interpreter.currentSpriteId, "test")', 'Length code mismatch');
});

test('JavaScript: operator_contains generates correct code', () => {
  const block = createMockBlock({ STRING1: '"Hello World"', STRING2: '"World"' });
  const code = Blockly.JavaScript['operator_contains'](block);
  assertEqual(code[0], 'String("Hello World").includes(String("World"))', 'Contains code mismatch');
});

// Summary
console.log('\n=== Test Summary ===');
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;
console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
}

// Export for programmatic use
module.exports = { testResults };
console.log('\ntestResults exported as module.exports');