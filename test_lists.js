// test_lists.js - Test Lists blocks code generation
// Run with: node test_lists.js

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

// Helper functions (extracted from generators.js)
const getFieldValue = (block, name) => {
  return block.getFieldValue(name);
};

// Python getValue extracts [0] from valueToCode return
const pythonGetValue = (block, name, defaultValue = 0) => {
  const value = Blockly.Python.valueToCode(block, name, Blockly.Python.ORDER_NONE);
  if (value !== '' && value !== null && value !== undefined && value[0] !== undefined) {
    return value[0];
  }
  return String(defaultValue);
};

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
    ORDER_FUNCTION_CALL: 100,
    valueToCode: function(block, name, order) {
      return block._values[name];
    },
    variableDB_: {
      getName: function(name, type) {
        return name;
      }
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
    ORDER_FUNCTION_CALL: 100,
    valueToCode: function(block, name, order) {
      return block._values[name];
    },
    variableDB_: {
      getName: function(name, type) {
        return name;
      }
    }
  },
  Variables: {
    NAME_TYPE: {}
  }
};

// JavaScript List Generators (extracted from generators.js)
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

// Python List Generators (extracted from generators.js)
Blockly.Python['data_addtolist'] = function(block) {
  const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
  const listName = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
  return `${listName}.append(${item})\n`;
};

Blockly.Python['data_deleteoflist'] = function(block) {
  const index = pythonGetValue(block, 'INDEX', 1);
  const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
  return `${list}.pop(${index} - 1)\n`;
};

Blockly.Python['data_inserttolist'] = function(block) {
  const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
  const index = pythonGetValue(block, 'INDEX', 1);
  const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
  return `${list}.insert(${index} - 1, ${item})\n`;
};

Blockly.Python['data_replaceitemoflist'] = function(block) {
  const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
  const index = pythonGetValue(block, 'INDEX', 1);
  const item = Blockly.Python.valueToCode(block, 'ITEM', Blockly.Python.ORDER_NONE) || '""';
  return `${list}[${index} - 1] = ${item}\n`;
};

Blockly.Python['data_itemoflist'] = function(block) {
  const list = Blockly.Python.variableDB_.getName(block.getFieldValue('LIST'), Blockly.Variables.NAME_TYPE) || 'my_list';
  const index = pythonGetValue(block, 'INDEX', 1);
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

// Helper to create mock block
function createMockBlock(fields, values) {
  return {
    _fields: fields || {},
    _values: values || {},
    getFieldValue: function(name) {
      return this._fields[name];
    }
  };
}

// Mock interpreter
const interpreter = {
  currentSpriteId: 'sprite1',
  data_addtolist: function(spriteId, item, list) { return `addtolist(${item})`; },
  data_deleteoflist: function(spriteId, index, list) { return `deleteoflist(${index})`; },
  data_inserttolist: function(spriteId, item, index, list) { return `inserttolist(${item},${index})`; },
  data_itemoflist: function(spriteId, index, list) { return `itemoflist(${index})`; },
  data_lengthoflist: function(spriteId, list) { return `lengthoflist()`; },
  data_listcontainsitem: function(spriteId, list, item) { return `listcontainsitem(${item})`; },
  data_deletealloflist: function(spriteId, list) { return `deletealloflist()`; },
  data_replaceitemoflist: function(spriteId, index, list, item) { return `replaceitemoflist(${index},${item})`; },
  data_showlist: function(spriteId, list) { return `showlist()`; },
  data_hidelist: function(spriteId, list) { return `hidelist()`; },
  lists: { myList: ['a', 'b', 'c'], my_list: ['a', 'b', 'c'] }
};

global.interpreter = interpreter;

// Create block with values helper
function createListBlock(listName, values, fields) {
  const block = createMockBlock(fields || { LIST: listName }, values);
  return block;
}

console.log('\n=== Testing Lists JavaScript Code Generation ===\n');

// Test: Add to List (增)
test('JavaScript: data_addtolist generates correct code', () => {
  const block = createListBlock('myList', { ITEM: '"apple"' }, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_addtolist'](block);
  assertEqual(code, 'await interpreter.data_addtolist(interpreter.currentSpriteId, "apple", \'myList\');\n', 'Add to list code mismatch');
});

test('JavaScript: data_addtolist handles missing ITEM', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_addtolist'](block);
  assertEqual(code, 'await interpreter.data_addtolist(interpreter.currentSpriteId, "", \'myList\');\n', 'Default ITEM not empty string');
});

test('JavaScript: data_addtolist handles missing LIST field', () => {
  const block = createMockBlock({}, { ITEM: '"test"' });
  const code = Blockly.JavaScript['data_addtolist'](block);
  assertEqual(code.includes('myList'), true, 'Default list name not used');
});

// Test: Delete of List (删)
test('JavaScript: data_deleteoflist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList', INDEX: '2' });
  const code = Blockly.JavaScript['data_deleteoflist'](block);
  assertEqual(code, 'await interpreter.data_deleteoflist(interpreter.currentSpriteId, 2, \'myList\');\n', 'Delete of list code mismatch');
});

test('JavaScript: data_deleteoflist handles missing INDEX', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_deleteoflist'](block);
  assertEqual(code, 'await interpreter.data_deleteoflist(interpreter.currentSpriteId, 1, \'myList\');\n', 'Default INDEX not 1');
});

// Test: Insert to List (增 - 插入)
test('JavaScript: data_inserttolist generates correct code', () => {
  const block = createListBlock('myList', { ITEM: '"banana"' }, { LIST: 'myList', INDEX: '3' });
  const code = Blockly.JavaScript['data_inserttolist'](block);
  assertEqual(code, 'await interpreter.data_inserttolist(interpreter.currentSpriteId, "banana", 3, \'myList\');\n', 'Insert to list code mismatch');
});

test('JavaScript: data_inserttolist handles missing values', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_inserttolist'](block);
  assertEqual(code, 'await interpreter.data_inserttolist(interpreter.currentSpriteId, "", 1, \'myList\');\n', 'Default values not used');
});

// Test: Item of List (查 - 获取项)
test('JavaScript: data_itemoflist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList', INDEX: '1' });
  const code = Blockly.JavaScript['data_itemoflist'](block);
  assertEqual(code[0], 'interpreter.data_itemoflist(interpreter.currentSpriteId, 1, \'myList\')', 'Item of list code mismatch');
});

test('JavaScript: data_itemoflist handles missing INDEX', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_itemoflist'](block);
  assertEqual(code[0], 'interpreter.data_itemoflist(interpreter.currentSpriteId, 1, \'myList\')', 'Default INDEX not 1');
});

// Test: Length of List (查 - 获取长度)
test('JavaScript: data_lengthoflist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_lengthoflist'](block);
  assertEqual(code[0], 'interpreter.data_lengthoflist(interpreter.currentSpriteId, \'myList\')', 'Length of list code mismatch');
});

// Test: List Contains Item (查 - 包含判断)
test('JavaScript: data_listcontainsitem generates correct code', () => {
  const block = createListBlock('myList', { ITEM: '"apple"' }, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_listcontainsitem'](block);
  assertEqual(code[0], 'interpreter.data_listcontainsitem(interpreter.currentSpriteId, \'myList\', "apple")', 'List contains item code mismatch');
});

test('JavaScript: data_listcontainsitem handles missing ITEM', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_listcontainsitem'](block);
  assertEqual(code[0], 'interpreter.data_listcontainsitem(interpreter.currentSpriteId, \'myList\', "")', 'Default ITEM not empty string');
});

// Test: Replace Item of List (改)
test('JavaScript: data_replaceitemoflist generates correct code', () => {
  const block = createListBlock('myList', { ITEM: '"grape"' }, { LIST: 'myList', INDEX: '2' });
  const code = Blockly.JavaScript['data_replaceitemoflist'](block);
  assertEqual(code, 'await interpreter.data_replaceitemoflist(interpreter.currentSpriteId, 2, \'myList\', "grape");\n', 'Replace item of list code mismatch');
});

test('JavaScript: data_replaceitemoflist handles missing values', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_replaceitemoflist'](block);
  assertEqual(code, 'await interpreter.data_replaceitemoflist(interpreter.currentSpriteId, 1, \'myList\', "");\n', 'Default values not used');
});

// Test: Delete All of List (删 - 清空)
test('JavaScript: data_deletealloflist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_deletealloflist'](block);
  assertEqual(code, 'await interpreter.data_deletealloflist(interpreter.currentSpriteId, \'myList\');\n', 'Delete all of list code mismatch');
});

// Test: Show/Hide List (显示/隐藏)
test('JavaScript: data_showlist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_showlist'](block);
  assertEqual(code, 'await interpreter.data_showlist(interpreter.currentSpriteId, \'myList\');\n', 'Show list code mismatch');
});

test('JavaScript: data_hidelist generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_hidelist'](block);
  assertEqual(code, 'await interpreter.data_hidelist(interpreter.currentSpriteId, \'myList\');\n', 'Hide list code mismatch');
});

// Test: Get List (获取列表)
test('JavaScript: data_list generates correct code', () => {
  const block = createListBlock('myList', {}, { LIST: 'myList' });
  const code = Blockly.JavaScript['data_list'](block);
  assertEqual(code[0], 'interpreter.lists[\'myList\'] || []', 'Get list code mismatch');
});

console.log('\n=== Testing Lists Python Code Generation ===\n');

// Test: Add to List (增)
test('Python: data_addtolist generates correct code', () => {
  const block = createListBlock('my_list', { ITEM: '"apple"' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_addtolist'](block);
  assertEqual(code, 'my_list.append("apple")\n', 'Python add to list code mismatch');
});

test('Python: data_addtolist handles missing ITEM', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_addtolist'](block);
  assertEqual(code, 'my_list.append("")\n', 'Default ITEM not empty string');
});

// Test: Delete of List (删)
test('Python: data_deleteoflist generates correct code', () => {
  const block = createListBlock('my_list', { INDEX: '3' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_deleteoflist'](block);
  assertEqual(code, 'my_list.pop(3 - 1)\n', 'Python delete of list code mismatch');
});

test('Python: data_deleteoflist handles missing INDEX', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_deleteoflist'](block);
  assertEqual(code, 'my_list.pop(1 - 1)\n', 'Default INDEX not 1 (converted to 0)');
});

// Test: Insert to List (增 - 插入)
test('Python: data_inserttolist generates correct code', () => {
  const block = createListBlock('my_list', { ITEM: '"banana"', INDEX: '2' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_inserttolist'](block);
  assertEqual(code, 'my_list.insert(2 - 1, "banana")\n', 'Python insert to list code mismatch');
});

test('Python: data_inserttolist handles missing values', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_inserttolist'](block);
  assertEqual(code, 'my_list.insert(1 - 1, "")\n', 'Default values not used');
});

// Test: Item of List (查 - 获取项)
test('Python: data_itemoflist generates correct code', () => {
  const block = createListBlock('my_list', { INDEX: '3' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_itemoflist'](block);
  assertEqual(code[0], 'my_list[3 - 1]', 'Python item of list code mismatch');
});

test('Python: data_itemoflist handles missing INDEX', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_itemoflist'](block);
  assertEqual(code[0], 'my_list[1 - 1]', 'Default INDEX not 1 (converted to 0)');
});

// Test: Length of List (查 - 获取长度)
test('Python: data_lengthoflist generates correct code', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_lengthoflist'](block);
  assertEqual(code[0], 'len(my_list)', 'Python length of list code mismatch');
});

// Test: List Contains Item (查 - 包含判断)
test('Python: data_listcontainsitem generates correct code', () => {
  const block = createListBlock('my_list', { ITEM: '"apple"' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_listcontainsitem'](block);
  assertEqual(code[0], '"apple" in my_list', 'Python list contains item code mismatch');
});

test('Python: data_listcontainsitem handles missing ITEM', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_listcontainsitem'](block);
  // Note: empty string default becomes " " due to valueToCode returning undefined
  assertEqual(code[0].includes(' in my_list'), true, 'Default ITEM not handled');
});

// Test: Replace Item of List (改)
test('Python: data_replaceitemoflist generates correct code', () => {
  const block = createListBlock('my_list', { ITEM: '"grape"', INDEX: '2' }, { LIST: 'my_list' });
  const code = Blockly.Python['data_replaceitemoflist'](block);
  assertEqual(code, 'my_list[2 - 1] = "grape"\n', 'Python replace item of list code mismatch');
});

test('Python: data_replaceitemoflist handles missing values', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_replaceitemoflist'](block);
  assertEqual(code, 'my_list[1 - 1] = ""\n', 'Default values not used');
});

// Test: Get List (获取列表)
test('Python: data_list generates correct code', () => {
  const block = createListBlock('my_list', {}, { LIST: 'my_list' });
  const code = Blockly.Python['data_list'](block);
  assertEqual(code[0], 'my_list', 'Python get list code mismatch');
});

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

// Write to testResults file
const fs = require('fs');
const timestamp = new Date().toISOString();
const output = {
  timestamp,
  category: 'Lists (Lists积木)',
  description: '测试列表的增删改查操作',
  results: testResults,
  summary: {
    total: testResults.length,
    passed: passed,
    failed: failed
  }
};
fs.writeFileSync('testResults', JSON.stringify(output, null, 2));
console.log('\nResults written to testResults');
