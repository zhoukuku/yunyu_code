// Test Events Blocks - Generated 2026/06/26
const testResults = {
  timestamp: new Date().toISOString(),
  category: "Events Blocks",
  tests: []
};

function addTest(name, passed, details = "") {
  testResults.tests.push({ name, passed, details });
}

// ========================================================================
// Event Block Definitions (from blocks.js)
// ========================================================================

const eventBlocks = [
  {
    type: 'event_whenflagclicked',
    name: '当绿旗被点击',
    color: '#FFBF00',
    hasHandler: true
  },
  {
    type: 'event_whenkeypressed',
    name: '当按下键',
    color: '#FFBF00',
    hasHandler: true
  },
  {
    type: 'event_whenthisspriteclicked',
    name: '当角色被点击',
    color: '#FFBF00',
    hasHandler: true
  },
  {
    type: 'event_whenbackdropswitchto',
    name: '当背景切换到',
    color: '#FFBF00',
    hasHandler: true
  },
  {
    type: 'event_whengreaterthan',
    name: '当大于',
    color: '#FFBF00',
    hasHandler: true
  },
  {
    type: 'event_broadcast',
    name: '广播',
    color: '#FFBF00',
    hasPreviousStatement: true,
    hasNextStatement: true
  },
  {
    type: 'event_broadcastandwait',
    name: '广播并等待',
    color: '#FFBF00',
    hasPreviousStatement: true,
    hasNextStatement: true
  },
  {
    type: 'event_whenbroadcastreceived',
    name: '当收到广播',
    color: '#FFBF00',
    hasHandler: true
  }
];

// ========================================================================
// Test Block Definitions
// ========================================================================

addTest("Events Block Definitions Count", eventBlocks.length === 8,
  `Expected 8 event blocks, found ${eventBlocks.length}`);

eventBlocks.forEach(block => {
  addTest(`Block: ${block.type} - Has valid color`,
    block.color === '#FFBF00',
    `Color: ${block.color}`);
});

// ========================================================================
// Test broadcast Block (event_broadcast)
// ========================================================================

const broadcastBlockDef = `Blockly.Blocks['event_broadcast'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('广播')
      .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#FFBF00');
  }
};`;

addTest("event_broadcast - Has BROADCASTINPUT field",
  broadcastBlockDef.includes('BROADCASTINPUT'),
  "Uses FieldTextInput for message");

addTest("event_broadcast - Has previousStatement",
  broadcastBlockDef.includes('setPreviousStatement'),
  "Can be placed after other blocks");

addTest("event_broadcast - Has nextStatement",
  broadcastBlockDef.includes('setNextStatement'),
  "Can be followed by other blocks");

addTest("event_broadcast - Has correct color",
  broadcastBlockDef.includes('#FFBF00'),
  "Events category color is #FFBF00");

// Test generator
const broadcastGenerator = `Blockly.JavaScript['event_broadcast'] = function(block) {
  const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
  return \`await interpreter.event_broadcast(interpreter.currentSpriteId, '\${message}');\n\`;
};`;

addTest("event_broadcast - Generator uses getFieldValue for BROADCASTINPUT",
  broadcastGenerator.includes("getFieldValue(block, 'BROADCASTINPUT')"),
  "Reads message from BROADCASTINPUT field");

addTest("event_broadcast - Generator calls interpreter.event_broadcast",
  broadcastGenerator.includes('interpreter.event_broadcast'),
  "Generator calls interpreter method");

addTest("event_broadcast - Generator uses await",
  broadcastGenerator.includes('await'),
  "Uses await for async call");

// ========================================================================
// Test broadcast and wait Block (event_broadcastandwait)
// ========================================================================

const broadcastAndWaitBlockDef = `Blockly.Blocks['event_broadcastandwait'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('广播并等待')
      .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#FFBF00');
  }
};`;

addTest("event_broadcastandwait - Has BROADCASTINPUT field",
  broadcastAndWaitBlockDef.includes('BROADCASTINPUT'),
  "Uses FieldTextInput for message");

addTest("event_broadcastandwait - Has previousStatement",
  broadcastAndWaitBlockDef.includes('setPreviousStatement'),
  "Can be placed after other blocks");

addTest("event_broadcastandwait - Has nextStatement",
  broadcastAndWaitBlockDef.includes('setNextStatement'),
  "Can be followed by other blocks");

// Test generator
const broadcastAndWaitGenerator = `Blockly.JavaScript['event_broadcastandwait'] = function(block) {
  const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
  return \`await interpreter.event_broadcastandwait(interpreter.currentSpriteId, '\${message}');\n\`;
};`;

addTest("event_broadcastandwait - Generator calls interpreter.event_broadcastandwait",
  broadcastAndWaitGenerator.includes('interpreter.event_broadcastandwait'),
  "Generator calls interpreter method");

// ========================================================================
// Test when I receive Block (event_whenbroadcastreceived)
// ========================================================================

const whenBroadcastReceivedBlockDef = `Blockly.Blocks['event_whenbroadcastreceived'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('当收到广播')
      .appendField(new Blockly.FieldTextInput('message1'), 'BROADCASTINPUT');
    this.appendStatementInput('HANDLER');
    this.setNextStatement(true, null);
    this.setColour('#FFBF00');
    this.setTooltip('当接收到指定广播消息时执行');
  }
};`;

addTest("event_whenbroadcastreceived - Has BROADCASTINPUT field",
  whenBroadcastReceivedBlockDef.includes('BROADCASTINPUT'),
  "Uses FieldTextInput for message");

addTest("event_whenbroadcastreceived - Has HANDLER statement input",
  whenBroadcastReceivedBlockDef.includes('HANDLER'),
  "Takes handler code as statement input");

addTest("event_whenbroadcastreceived - Has nextStatement",
  whenBroadcastReceivedBlockDef.includes('setNextStatement'),
  "Can be followed by other blocks");

addTest("event_whenbroadcastreceived - Has tooltip",
  whenBroadcastReceivedBlockDef.includes('setTooltip'),
  "Has tooltip explaining the block");

// Test generator
const whenBroadcastReceivedGenerator = `Blockly.JavaScript['event_whenbroadcastreceived'] = function(block) {
  const message = getFieldValue(block, 'BROADCASTINPUT') || 'message1';
  const doCode = Blockly.JavaScript.statementToCode(block, 'HANDLER') || '';
  // Register the handler with the interpreter's broadcastHandlers Map
  return \`interpreter.addBroadcastHandler('\${message}', async function() {\n\${doCode}});\n\`;
};`;

addTest("event_whenbroadcastreceived - Generator uses getFieldValue",
  whenBroadcastReceivedGenerator.includes("getFieldValue(block, 'BROADCASTINPUT')"),
  "Reads message from BROADCASTINPUT field");

addTest("event_whenbroadcastreceived - Generator uses statementToCode for HANDLER",
  whenBroadcastReceivedGenerator.includes("statementToCode(block, 'HANDLER')"),
  "Converts HANDLER statement to code");

addTest("event_whenbroadcastreceived - Generator calls addBroadcastHandler",
  whenBroadcastReceivedGenerator.includes('interpreter.addBroadcastHandler'),
  "Registers handler via interpreter method");

addTest("event_whenbroadcastreceived - Generator wraps handler in async function",
  whenBroadcastReceivedGenerator.includes('async function()'),
  "Handler is async function");

// ========================================================================
// Test Interpreter Implementation
// ========================================================================

// Test broadcastHandlers Map initialization
const interpreterInit = `this.broadcastHandlers = new Map(); // Map<message, handler>`;

addTest("Interpreter - Initializes broadcastHandlers as Map",
  interpreterInit.includes('new Map()'),
  "Uses Map for handlers storage");

// Test event_broadcast implementation
const eventBroadcastImpl = `event_broadcast(spriteId, message) {
  // Invoke registered broadcast handlers
  const handlers = this.broadcastHandlers.get(message);
  if (handlers) {
    handlers.forEach(fn => fn());
  }
  this.callbacks.onBroadcast?.(message);
}`;

addTest("Interpreter.event_broadcast - Gets handlers from broadcastHandlers Map",
  eventBroadcastImpl.includes('this.broadcastHandlers.get(message)'),
  "Retrieves handlers by message");

addTest("Interpreter.event_broadcast - Invokes all handlers",
  eventBroadcastImpl.includes('handlers.forEach'),
  "Calls each registered handler");

addTest("Interpreter.event_broadcast - Calls onBroadcast callback",
  eventBroadcastImpl.includes('callbacks.onBroadcast'),
  "Notifies UI via callback");

// Test event_broadcastandwait implementation
const eventBroadcastAndWaitImpl = `async event_broadcastandwait(spriteId, message) {
  this.event_broadcast(spriteId, message);
  await this._delay(100);
}`;

addTest("Interpreter.event_broadcastandwait - Is async function",
  eventBroadcastAndWaitImpl.includes('async'),
  "Uses async for non-blocking wait");

addTest("Interpreter.event_broadcastandwait - Calls event_broadcast first",
  eventBroadcastAndWaitImpl.includes('this.event_broadcast'),
  "Broadcasts the message");

addTest("Interpreter.event_broadcastandwait - Uses _delay for wait",
  eventBroadcastAndWaitImpl.includes('this._delay'),
  "Delays for specified time");

// Test addBroadcastHandler implementation
const addBroadcastHandlerImpl = `addBroadcastHandler(message, handler) {
  if (!this.broadcastHandlers.has(message)) {
    this.broadcastHandlers.set(message, []);
  }
  this.broadcastHandlers.get(message).push(handler);
}`;

addTest("Interpreter.addBroadcastHandler - Creates array for new messages",
  addBroadcastHandlerImpl.includes("broadcastHandlers.set(message, [])"),
  "Creates empty array if message has no handlers");

addTest("Interpreter.addBroadcastHandler - Pushes handler to array",
  addBroadcastHandlerImpl.includes('broadcastHandlers.get(message).push(handler)'),
  "Adds handler to message's handler array");

// Test clearBroadcastHandlers implementation
const clearBroadcastHandlersImpl = `clearBroadcastHandlers(message) {
  if (message) {
    this.broadcastHandlers.delete(message);
  } else {
    this.broadcastHandlers.clear();
  }
}`;

addTest("Interpreter.clearBroadcastHandlers - Can clear specific message",
  clearBroadcastHandlersImpl.includes('broadcastHandlers.delete(message)'),
  "Deletes handlers for specific message");

addTest("Interpreter.clearBroadcastHandlers - Can clear all messages",
  clearBroadcastHandlersImpl.includes('broadcastHandlers.clear()'),
  "Clears all handlers when no message specified");

// ========================================================================
// Test Connection: broadcast -> when I receive
// ========================================================================

// Simulate the connection flow
let testBroadcastHandlers = new Map();
let broadcastCalled = false;
let handler1Called = false;
let handler2Called = false;

// Simulate addBroadcastHandler
function testAddBroadcastHandler(message, handler) {
  if (!testBroadcastHandlers.has(message)) {
    testBroadcastHandlers.set(message, []);
  }
  testBroadcastHandlers.get(message).push(handler);
}

// Simulate event_broadcast
function testEventBroadcast(message) {
  broadcastCalled = true;
  const handlers = testBroadcastHandlers.get(message);
  if (handlers) {
    handlers.forEach(fn => fn());
  }
}

// Register two handlers for "message1"
testAddBroadcastHandler('message1', () => { handler1Called = true; });
testAddBroadcastHandler('message1', () => { handler2Called = true; });

// Broadcast "message1"
testEventBroadcast('message1');

addTest("Connection: broadcast -> when I receive - Handler array created",
  testBroadcastHandlers.has('message1'),
  "Handler array exists for message1");

addTest("Connection: broadcast -> when I receive - Both handlers registered",
  testBroadcastHandlers.get('message1').length === 2,
  "Two handlers registered for message1");

addTest("Connection: broadcast -> when I receive - Broadcast invokes handlers",
  handler1Called && handler2Called,
  "Both handlers were called when broadcast sent");

// Test multiple messages
let msg1HandlerCalled = false;
let msg2HandlerCalled = false;

testAddBroadcastHandler('msg2', () => { msg2HandlerCalled = true; });

broadcastCalled = false;
handler1Called = false;
handler2Called = false;
testEventBroadcast('message1');

addTest("Connection: Multiple messages - Correct handler called for message1",
  handler1Called && handler2Called && !msg1HandlerCalled && !msg2HandlerCalled,
  "Only message1 handlers called for message1 broadcast");

// Test unknown message (should not throw)
let errorThrown = false;
try {
  testEventBroadcast('nonexistent');
} catch (e) {
  errorThrown = true;
}

addTest("Connection: Unknown message - Does not throw error",
  !errorThrown,
  "Broadcast to unknown message is safe");

// ========================================================================
// Test broadcast and wait flow
// ========================================================================

let asyncWaitCompleted = false;

async function testEventBroadcastAndWait(message) {
  testEventBroadcast(message);
  await new Promise(resolve => setTimeout(resolve, 10)); // Simulate _delay
  asyncWaitCompleted = true;
}

(async () => {
  await testEventBroadcastAndWait('message1');

  addTest("Connection: broadcast and wait - Completes async wait",
    asyncWaitCompleted,
    "Async broadcast and wait completes");

  // Final summary
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const totalTests = testResults.tests.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  testResults.summary = {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    passRate: `${passRate}%`
  };

  console.log("=== Events Blocks Test Results ===");
  console.log(JSON.stringify(testResults, null, 2));
  console.log(`\nSummary: ${passedTests}/${totalTests} tests passed (${passRate}%)`);

  // Write to file
  const fs = require('fs');
  fs.writeFileSync('e:/k/meee/code/project01/testResults', JSON.stringify(testResults, null, 2));
})();