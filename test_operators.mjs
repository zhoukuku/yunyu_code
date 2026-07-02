// test_operators.mjs - Test Operators blocks code generation
// Run with: node test_operators.mjs

const testResults = [];

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
    ORDER_MODULUS: 10,
    ORDER_FUNCTION_CALL: 11,
    ORDER_NONE: 0,
    valueToCode: function(block, name, order) {
      return block._values[name] || '';
    }
  },
  Python: {
    ORDER_ADDITIVE: 1,
    ORDER_MULTIPLICATIVE: 2,
    ORDER_RELATIONAL: 3,
    ORDER_LOGICAL_AND: 4,
    ORDER_LOGICAL_OR: 5,
    ORDER_LOGICAL_NOT: 6,
    ORDER_MODULUS: 7,
    ORDER_FUNCTION_CALL: 8,
    ORDER_NONE: 0,
    valueToCode: function(block, name, order) {
      return block._values[name] || '';
    }
  }
};

// Import generators
import { registerGenerators, registerPythonGenerators } from './frontend-vite/src/components/blockly/generators.js';
registerGenerators(Blockly);
registerPythonGenerators(Blockly);

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

function createMockBlock(values) {
  return { _values: values };
}

console.log('\n=== Testing JavaScript Code Generation ===\n');

// Math Operators
test('JavaScript: operator_add', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.JavaScript['operator_add'](block);
  assertEqual(code[0], '(5) + (3)');
});

test('JavaScript: operator_subtract', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '4' });
  const code = Blockly.JavaScript['operator_subtract'](block);
  assertEqual(code[0], '(10) - (4)');
});

test('JavaScript: operator_multiply', () => {
  const block = createMockBlock({ NUM1: '6', NUM2: '7' });
  const code = Blockly.JavaScript['operator_multiply'](block);
  assertEqual(code[0], '(6) * (7)');
});

test('JavaScript: operator_divide', () => {
  const block = createMockBlock({ NUM1: '20', NUM2: '4' });
  const code = Blockly.JavaScript['operator_divide'](block);
  assertEqual(code[0], '(20) / (4)');
});

test('JavaScript: operator_add defaults', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['operator_add'](block);
  assertEqual(code[0], '(0) + (0)');
});

test('JavaScript: operator_divide default divisor', () => {
  const block = createMockBlock({ NUM1: '10' });
  const code = Blockly.JavaScript['operator_divide'](block);
  assertEqual(code[0], '(10) / (1)');
});

// Comparison Operators
test('JavaScript: operator_gt', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.JavaScript['operator_gt'](block);
  assertEqual(code[0], '(5) > (3)');
});

test('JavaScript: operator_lt', () => {
  const block = createMockBlock({ NUM1: '2', NUM2: '7' });
  const code = Blockly.JavaScript['operator_lt'](block);
  assertEqual(code[0], '(2) < (7)');
});

test('JavaScript: operator_equals', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '5' });
  const code = Blockly.JavaScript['operator_equals'](block);
  assertEqual(code[0], '(5) === (5)');
});

// Logical Operators
test('JavaScript: operator_and', () => {
  const block = createMockBlock({ OPERAND1: 'true', OPERAND2: 'false' });
  const code = Blockly.JavaScript['operator_and'](block);
  assertEqual(code[0], '(true) && (false)');
});

test('JavaScript: operator_or', () => {
  const block = createMockBlock({ OPERAND1: 'true', OPERAND2: 'false' });
  const code = Blockly.JavaScript['operator_or'](block);
  assertEqual(code[0], '(true) || (false)');
});

test('JavaScript: operator_not', () => {
  const block = createMockBlock({ OPERAND: 'true' });
  const code = Blockly.JavaScript['operator_not'](block);
  assertEqual(code[0], '!(true)');
});

test('JavaScript: operator_not default', () => {
  const block = createMockBlock({});
  const code = Blockly.JavaScript['operator_not'](block);
  assertEqual(code[0], '!(false)');
});

console.log('\n=== Testing Python Code Generation ===\n');

// Python Math Operators
test('Python: operator_add', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.Python['operator_add'](block);
  assertEqual(code[0], '5 + 3');
});

test('Python: operator_subtract', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '4' });
  const code = Blockly.Python['operator_subtract'](block);
  assertEqual(code[0], '10 - 4');
});

test('Python: operator_multiply', () => {
  const block = createMockBlock({ NUM1: '6', NUM2: '7' });
  const code = Blockly.Python['operator_multiply'](block);
  assertEqual(code[0], '6 * 7');
});

test('Python: operator_divide', () => {
  const block = createMockBlock({ NUM1: '20', NUM2: '4' });
  const code = Blockly.Python['operator_divide'](block);
  assertEqual(code[0], '20 / 4');
});

// Python Comparison Operators
test('Python: operator_gt', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '3' });
  const code = Blockly.Python['operator_gt'](block);
  assertEqual(code[0], '5 > 3');
});

test('Python: operator_lt', () => {
  const block = createMockBlock({ NUM1: '2', NUM2: '7' });
  const code = Blockly.Python['operator_lt'](block);
  assertEqual(code[0], '2 < 7');
});

test('Python: operator_equals', () => {
  const block = createMockBlock({ NUM1: '5', NUM2: '5' });
  const code = Blockly.Python['operator_equals'](block);
  assertEqual(code[0], '5 == 5');
});

// Python Logical Operators
test('Python: operator_and', () => {
  const block = createMockBlock({ OPERAND1: 'True', OPERAND2: 'False' });
  const code = Blockly.Python['operator_and'](block);
  assertEqual(code[0], 'True and False');
});

test('Python: operator_or', () => {
  const block = createMockBlock({ OPERAND1: 'True', OPERAND2: 'False' });
  const code = Blockly.Python['operator_or'](block);
  assertEqual(code[0], 'True or False');
});

test('Python: operator_not', () => {
  const block = createMockBlock({ OPERAND: 'True' });
  const code = Blockly.Python['operator_not'](block);
  assertEqual(code[0], 'not True');
});

// Additional Math Functions
console.log('\n=== Testing Additional Math Functions ===\n');

test('JavaScript: operator_mod', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '3' });
  const code = Blockly.JavaScript['operator_mod'](block);
  assertEqual(code[0], '(10) % (3)');
});

test('Python: operator_mod', () => {
  const block = createMockBlock({ NUM1: '10', NUM2: '3' });
  const code = Blockly.Python['operator_mod'](block);
  assertEqual(code[0], '10 % 3');
});

test('JavaScript: operator_round', () => {
  const block = createMockBlock({ NUM: '3.7' });
  const code = Blockly.JavaScript['operator_round'](block);
  assertEqual(code[0], 'interpreter.operator_round(3.7)');
});

test('Python: operator_round', () => {
  const block = createMockBlock({ NUM: '3.7' });
  const code = Blockly.Python['operator_round'](block);
  assertEqual(code[0], 'round(3.7)');
});

// String Operators
console.log('\n=== Testing String Operators ===\n');

test('Python: operator_join', () => {
  const block = createMockBlock({ STRING1: '"Hello"', STRING2: '"World"' });
  const code = Blockly.Python['operator_join'](block);
  assertEqual(code[0], 'str("Hello") + str("World")');
});

test('Python: operator_length', () => {
  const block = createMockBlock({ STRING: '"test"' });
  const code = Blockly.Python['operator_length'](block);
  assertEqual(code[0], 'len(str("test"))');
});

test('Python: operator_letter_of', () => {
  const block = createMockBlock({ LETTER: '1', STRING: '"hello"' });
  const code = Blockly.Python['operator_letter_of'](block);
  assertEqual(code[0], 'str("hello")[int(1)-1]');
});

test('Python: operator_contains', () => {
  const block = createMockBlock({ STRING1: '"Hello World"', STRING2: '"World"' });
  const code = Blockly.Python['operator_contains'](block);
  assertEqual(code[0], 'str("Hello World") in str("World")');
});

test('Python: operator_random', () => {
  const block = createMockBlock({ FROM: '1', TO: '10' });
  const code = Blockly.Python['operator_random'](block);
  assertEqual(code[0], 'random.randint(1, 10)');
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

export { testResults };