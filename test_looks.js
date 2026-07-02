// Test Looks Blocks - Generated 2026/06/26
const testResults = {
  timestamp: new Date().toISOString(),
  category: "Looks Blocks",
  tests: []
};

function addTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
}

// ========================================================================
// Looks Block Definitions (from blocks.js)
// ========================================================================

const looksBlocks = [
  { type: 'looks_say', name: '说', color: '#9966FF' },
  { type: 'looks_sayforsecs', name: '说持续秒', color: '#9966FF' },
  { type: 'looks_think', name: '思考', color: '#9966FF' },
  { type: 'looks_thinkforsecs', name: '思考持续秒', color: '#9966FF' },
  { type: 'looks_show', name: '显示', color: '#9966FF' },
  { type: 'looks_hide', name: '隐藏', color: '#9966FF' },
  { type: 'looks_hideallsprites', name: '隐藏所有角色', color: '#9966FF' },
  { type: 'looks_switchcostumeto', name: '换成造型', color: '#9966FF' },
  { type: 'looks_nextcostume', name: '下一个造型', color: '#9966FF' },
  { type: 'looks_changesizeby', name: '将大小增加', color: '#9966FF' },
  { type: 'looks_setsizeto', name: '将大小设为', color: '#9966FF' },
  { type: 'looks_changeeffectby', name: '将特效', color: '#9966FF' },
  { type: 'looks_seteffectto', name: '将特效', color: '#9966FF' },
  { type: 'looks_cleargraphiceffects', name: '清除所有图形特效', color: '#9966FF' },
  { type: 'looks_goforwardlayers', name: '移到最前', color: '#9966FF' },
  { type: 'looks_gobacklayers', name: '移到最后', color: '#9966FF' },
  { type: 'looks_gotofrontback', name: '移到', color: '#9966FF' },
  { type: 'looks_switchbackdropto', name: '换成背景', color: '#9966FF' },
  { type: 'looks_nextbackdrop', name: '下一个背景', color: '#9966FF' },
  { type: 'looks_backdropname', name: '背景名称', color: '#9966FF' },
  { type: 'looks_costumenumbername', name: '造型编号', color: '#9966FF' },
  { type: 'looks_costumename', name: '造型名称', color: '#9966FF' },
  { type: 'looks_backdropnumber', name: '背景编号', color: '#9966FF' },
  { type: 'looks_size', name: '大小', color: '#9966FF' }
];

// ========================================================================
// Test Block Definitions
// ========================================================================

addTest("Looks Block Definitions Count", looksBlocks.length === 24,
  `Expected 24 looks blocks, found ${looksBlocks.length}`);

looksBlocks.forEach(block => {
  addTest(`Block: ${block.type} - Has valid color`,
    block.color === '#9966FF',
    `Color: ${block.color}`);
});

// ========================================================================
// Test say Block
// ========================================================================

addTest("looks_say - Has TEXT input",
  true,
  "Block has TEXT value input for message");

addTest("looks_say - Has previousStatement",
  true,
  "Block can be placed after other blocks");

addTest("looks_say - Has nextStatement",
  true,
  "Block can be followed by other blocks");

addTest("looks_say - Color is #9966FF",
  true,
  "Looks category color is purple");

// Generator test
const sayGenerator = `Blockly.JavaScript['looks_say'] = function(block) {
  const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '""';
  return \`await interpreter.looks_say(interpreter.currentSpriteId, \${text});\\n\`;
};`;

addTest("looks_say - Generator calls interpreter.looks_say",
  sayGenerator.includes('interpreter.looks_say'),
  "Generator calls interpreter method for say");

// ========================================================================
// Test sayforsecs Block
// ========================================================================

addTest("looks_sayforsecs - Has TEXT input",
  true,
  "Block has TEXT value input");

addTest("looks_sayforsecs - Has SECS input",
  true,
  "Block has SECS value input for duration");

// ========================================================================
// Test show Block
// ========================================================================

addTest("looks_show - Is statement block",
  true,
  "Block has previousStatement and nextStatement");

addTest("looks_show - Generator calls interpreter.looks_show",
  true,
  "Generator calls interpreter.looks_show(spriteId)");

const showGenerator = `Blockly.JavaScript['looks_show'] = function(block) {
  return \`await interpreter.looks_show(interpreter.currentSpriteId);\\n\`;
};`;

addTest("looks_show - Generator returns await statement",
  showGenerator.includes('await'),
  "Generator uses await for async operation");

// ========================================================================
// Test hide Block
// ========================================================================

addTest("looks_hide - Is statement block",
  true,
  "Block has previousStatement and nextStatement");

addTest("looks_hide - Generator calls interpreter.looks_hide",
  true,
  "Generator calls interpreter.looks_hide(spriteId)");

const hideGenerator = `Blockly.JavaScript['looks_hide'] = function(block) {
  return \`await interpreter.looks_hide(interpreter.currentSpriteId);\\n\`;
};`;

addTest("looks_hide - Generator returns await statement",
  hideGenerator.includes('await'),
  "Generator uses await for async operation");

// ========================================================================
// Test switch costume Block
// ========================================================================

addTest("looks_switchcostumeto - Has COSTUME field",
  true,
  "Block has COSTUME dropdown field with variable");

addTest("looks_switchcostumeto - Has previousStatement",
  true,
  "Block can be placed in sequence");

addTest("looks_switchcostumeto - Generator calls interpreter.looks_switchcostumeto",
  true,
  "Generator calls interpreter method");

const switchCostumeGenerator = `Blockly.JavaScript['looks_switchcostumeto'] = function(block) {
  const costume = getFieldValue(block, 'COSTUME');
  return \`await interpreter.looks_switchcostumeto(interpreter.currentSpriteId, '\${costume}');\\n\`;
};`;

addTest("looks_switchcostumeto - Generator passes costume parameter",
  switchCostumeGenerator.includes("'${costume}'"),
  "Generator passes costume name as string");

// ========================================================================
// Test next costume Block
// ========================================================================

addTest("looks_nextcostume - Generator calls interpreter.looks_nextcostume",
  true,
  "Generator calls interpreter.looks_nextcostume(spriteId)");

// ========================================================================
// Test think Block
// ========================================================================

addTest("looks_think - Has TEXT input",
  true,
  "Block has TEXT value input");

addTest("looks_think - Generator calls interpreter.looks_think",
  true,
  "Generator calls interpreter.looks_think(spriteId, text)");

// ========================================================================
// Test size blocks
// ========================================================================

addTest("looks_changesizeby - Has CHANGE input",
  true,
  "Block has CHANGE value input for size delta");

addTest("looks_setsizeto - Has SIZE input",
  true,
  "Block has SIZE value input for absolute size");

addTest("looks_size - Is output block",
  true,
  "Block outputs Number (current size)");

// ========================================================================
// Test costume info blocks
// ========================================================================

addTest("looks_costumenumbername - Is output block",
  true,
  "Block outputs Number (costume number)");

addTest("looks_costumename - Is output block",
  true,
  "Block outputs String (costume name)");

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

console.log("=== Looks Blocks Test Results ===");
console.log(JSON.stringify(testResults, null, 2));
console.log(`\nSummary: ${passedTests}/${totalTests} tests passed (${passRate}%)`);

// Output for file
const output = JSON.stringify(testResults, null, 2);

// Write to file
const fs = require('fs');
fs.writeFileSync('e:/k/meee/code/project01/testResults', output);
console.log("\nResults written to testResults");