// Test script for Motion blocks
// Run with: node testMotionBlocks.cjs

const testResults = [];

// Mock interpreter class to test motion functions
class MockInterpreter {
  constructor() {
    this.state = {
      sprites: {}
    };
  }

  _getSprite(spriteId) {
    return { id: spriteId };
  }

  _updateState(spriteId, updates) {
    if (!this.state.sprites[spriteId]) {
      this.state.sprites[spriteId] = {};
    }
    Object.assign(this.state.sprites[spriteId], updates);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Motion blocks (copied from ide/index.jsx for testing)
  motion_movesteps(spriteId, steps) {
    const state = this.state.sprites[spriteId] || {};
    const rad = ((state.direction || 90) - 90) * Math.PI / 180;
    const oldX = state.x || 0;
    const oldY = state.y || 0;
    const newX = oldX + Math.cos(rad) * steps;
    const newY = oldY - Math.sin(rad) * steps;
    this._updateState(spriteId, { x: newX, y: newY });
    return { oldX, oldY, newX, newY, direction: state.direction || 90 };
  }

  motion_gotoxy(spriteId, x, y) {
    this._updateState(spriteId, { x, y });
    return { x, y };
  }

  motion_setx(spriteId, x) {
    this._updateState(spriteId, { x });
    return { x };
  }

  motion_sety(spriteId, y) {
    this._updateState(spriteId, { y });
    return { y };
  }

  motion_changexby(spriteId, dx) {
    const state = this.state.sprites[spriteId] || {};
    const newX = (state.x || 0) + dx;
    this._updateState(spriteId, { x: newX });
    return { x: newX };
  }

  motion_changeyby(spriteId, dy) {
    const state = this.state.sprites[spriteId] || {};
    const newY = (state.y || 0) + dy;
    this._updateState(spriteId, { y: newY });
    return { y: newY };
  }

  motion_turn_right(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction || 90) + deg) % 360;
    const finalDir = newDir < 0 ? newDir + 360 : newDir;
    this._updateState(spriteId, { direction: finalDir });
    return { direction: finalDir };
  }

  motion_turn_left(spriteId, deg) {
    const state = this.state.sprites[spriteId] || {};
    const newDir = ((state.direction || 90) - deg + 360) % 360;
    this._updateState(spriteId, { direction: newDir });
    return { direction: newDir };
  }

  async motion_glideto(spriteId, secs, x, y) {
    await this._delay(secs * 1000);
    this._updateState(spriteId, { x, y });
    return { x, y };
  }

  motion_xposition(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.x || 0;
  }

  motion_yposition(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.y || 0;
  }

  motion_direction(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    return state.direction || 90;
  }

  motion_ifonedgebounce(spriteId) {
    const state = this.state.sprites[spriteId] || {};
    let { x, y, direction } = state;
    const stageWidth = 240;
    const stageHeight = 180;
    const halfW = stageWidth / 2;
    const halfH = stageHeight / 2;

    if (x > halfW || x < -halfW || y > halfH || y < -halfH) {
      let newDir = (180 - direction) % 360;
      if (newDir < 0) newDir += 360;
      x = Math.max(-halfW, Math.min(halfW, x));
      y = Math.max(-halfH, Math.min(halfH, y));
      this._updateState(spriteId, { x, y, direction: newDir });
      return { bounced: true, x, y, direction: newDir };
    }
    return { bounced: false };
  }

  motion_setrotationstyle(spriteId, style) {
    this._updateState(spriteId, { rotationStyle: style });
    return { rotationStyle: style };
  }
}

const spriteId = 'sprite1';

function test(name, fn) {
  const interp = new MockInterpreter();
  try {
    const result = fn(interp);
    testResults.push({ name, passed: true, result });
    console.log(`PASS: ${name}`);
  } catch (e) {
    testResults.push({ name, passed: false, error: e.message });
    console.log(`FAIL: ${name} - ${e.message}`);
  }
}

// Test motion_move_steps - direction 90 (up in Scratch)
test('motion_move_steps - move 10 steps (direction 90)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_movesteps(spriteId, 10);
  if (Math.abs(result.newX - 10) > 0.001) throw new Error(`Expected x=10, got x=${result.newX}`);
  if (Math.abs(result.newY - 0) > 0.001) throw new Error(`Expected y=0, got y=${result.newY}`);
  return result;
});

// Test motion_move_steps - direction 0 (right in Scratch)
test('motion_move_steps - move 10 steps (direction 0)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 0 };
  const result = interp.motion_movesteps(spriteId, 10);
  // At direction 0, rad = (0-90)*PI/180 = -PI/2, cos(-PI/2)=0, sin(-PI/2)=-1
  // newY = oldY - (-1)*10 = oldY + 10
  if (Math.abs(result.newX - 0) > 0.001) throw new Error(`Expected x=0, got x=${result.newX}`);
  if (Math.abs(result.newY - 10) > 0.001) throw new Error(`Expected y=10, got y=${result.newY}`);
  return result;
});

// Test motion_move_steps - direction 180 (left in Scratch)
test('motion_move_steps - move 10 steps (direction 180)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 180 };
  const result = interp.motion_movesteps(spriteId, 10);
  // At direction 180, rad = (180-90)*PI/180 = PI/2, cos(PI/2)=0, sin(PI/2)=1
  // newY = oldY - 1*10 = oldY - 10
  if (Math.abs(result.newX - 0) > 0.001) throw new Error(`Expected x=0, got x=${result.newX}`);
  if (Math.abs(result.newY - (-10)) > 0.001) throw new Error(`Expected y=-10, got y=${result.newY}`);
  return result;
});

// Test motion_move_steps - direction 270 (down in Scratch)
test('motion_move_steps - move 10 steps (direction 270)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 270 };
  const result = interp.motion_movesteps(spriteId, 10);
  // At direction 270, rad = (270-90)*PI/180 = PI, cos(PI)=-1, sin(PI)=0
  // newX = oldX + (-1)*10 = oldX - 10
  if (Math.abs(result.newX - (-10)) > 0.001) throw new Error(`Expected x=-10, got x=${result.newX}`);
  if (Math.abs(result.newY - 0) > 0.001) throw new Error(`Expected y=0, got y=${result.newY}`);
  return result;
});

// Test motion_turn_right
test('motion_turn_right - turn 15 degrees from 90', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_turn_right(spriteId, 15);
  if (Math.abs(result.direction - 105) > 0.001) throw new Error(`Expected 105, got ${result.direction}`);
  return result;
});

test('motion_turn_right - turn 360 degrees', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_turn_right(spriteId, 360);
  if (Math.abs(result.direction - 90) > 0.001) throw new Error(`Expected 90, got ${result.direction}`);
  return result;
});

// Test motion_turn_left
test('motion_turn_left - turn 15 degrees from 90', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_turn_left(spriteId, 15);
  if (Math.abs(result.direction - 75) > 0.001) throw new Error(`Expected 75, got ${result.direction}`);
  return result;
});

test('motion_turn_left - turn past 0 (from 15 to 345)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 15 };
  const result = interp.motion_turn_left(spriteId, 30);
  if (Math.abs(result.direction - 345) > 0.001) throw new Error(`Expected 345, got ${result.direction}`);
  return result;
});

// Test motion_gotoxy
test('motion_gotoxy - move to (100, 50)', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_gotoxy(spriteId, 100, 50);
  if (result.x !== 100) throw new Error(`Expected x=100, got ${result.x}`);
  if (result.y !== 50) throw new Error(`Expected y=50, got ${result.y}`);
  return result;
});

// Test motion_glideto (async)
test('motion_glideto - glide to (100, 50) over 0.05s', async (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const start = Date.now();
  const result = await interp.motion_glideto(spriteId, 0.05, 100, 50);
  const elapsed = Date.now() - start;
  if (result.x !== 100) throw new Error(`Expected x=100, got ${result.x}`);
  if (result.y !== 50) throw new Error(`Expected y=50, got ${result.y}`);
  if (elapsed < 40) throw new Error(`Expected at least 40ms delay, got ${elapsed}ms`);
  return result;
});

// Test motion_changexby
test('motion_changexby - increase x by 25', (interp) => {
  interp.state.sprites[spriteId] = { x: 100, y: 50, direction: 90 };
  const result = interp.motion_changexby(spriteId, 25);
  if (result.x !== 125) throw new Error(`Expected x=125, got ${result.x}`);
  return result;
});

test('motion_changexby - decrease x by 10', (interp) => {
  interp.state.sprites[spriteId] = { x: 50, y: 50, direction: 90 };
  const result = interp.motion_changexby(spriteId, -10);
  if (result.x !== 40) throw new Error(`Expected x=40, got ${result.x}`);
  return result;
});

// Test motion_changeyby
test('motion_changeyby - increase y by 30', (interp) => {
  interp.state.sprites[spriteId] = { x: 100, y: 50, direction: 90 };
  const result = interp.motion_changeyby(spriteId, 30);
  if (result.y !== 80) throw new Error(`Expected y=80, got ${result.y}`);
  return result;
});

test('motion_changeyby - decrease y by 15', (interp) => {
  interp.state.sprites[spriteId] = { x: 50, y: 50, direction: 90 };
  const result = interp.motion_changeyby(spriteId, -15);
  if (result.y !== 35) throw new Error(`Expected y=35, got ${result.y}`);
  return result;
});

// Test motion_setx
test('motion_setx - set x to 200', (interp) => {
  interp.state.sprites[spriteId] = { x: 100, y: 50, direction: 90 };
  const result = interp.motion_setx(spriteId, 200);
  if (result.x !== 200) throw new Error(`Expected x=200, got ${result.x}`);
  return result;
});

// Test motion_sety
test('motion_sety - set y to 75', (interp) => {
  interp.state.sprites[spriteId] = { x: 100, y: 50, direction: 90 };
  const result = interp.motion_sety(spriteId, 75);
  if (result.y !== 75) throw new Error(`Expected y=75, got ${result.y}`);
  return result;
});

// Test motion_xposition
test('motion_xposition - get x position', (interp) => {
  interp.state.sprites[spriteId] = { x: 123.5, y: 45.2, direction: 90 };
  const result = interp.motion_xposition(spriteId);
  if (Math.abs(result - 123.5) > 0.001) throw new Error(`Expected 123.5, got ${result}`);
  return result;
});

// Test motion_yposition
test('motion_yposition - get y position', (interp) => {
  interp.state.sprites[spriteId] = { x: 123.5, y: 45.2, direction: 90 };
  const result = interp.motion_yposition(spriteId);
  if (Math.abs(result - 45.2) > 0.001) throw new Error(`Expected 45.2, got ${result}`);
  return result;
});

// Test motion_direction
test('motion_direction - get direction', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 135 };
  const result = interp.motion_direction(spriteId);
  if (Math.abs(result - 135) > 0.001) throw new Error(`Expected 135, got ${result}`);
  return result;
});

// Test motion_ifonedgebounce
test('motion_ifonedgebounce - bounce when past edge', (interp) => {
  interp.state.sprites[spriteId] = { x: 130, y: 0, direction: 90 };
  const result = interp.motion_ifonedgebounce(spriteId);
  if (!result.bounced) throw new Error('Expected bounce to happen');
  if (result.direction !== 90) throw new Error(`Expected direction 90 (reversed), got ${result.direction}`);
  return result;
});

test('motion_ifonedgebounce - no bounce within bounds', (interp) => {
  interp.state.sprites[spriteId] = { x: 100, y: 50, direction: 90 };
  const result = interp.motion_ifonedgebounce(spriteId);
  if (result.bounced) throw new Error('Expected no bounce');
  return result;
});

// Test motion_setrotationstyle
test('motion_setrotationstyle - set rotation style', (interp) => {
  interp.state.sprites[spriteId] = { x: 0, y: 0, direction: 90 };
  const result = interp.motion_setrotationstyle(spriteId, 'left-right');
  if (result.rotationStyle !== 'left-right') throw new Error(`Expected 'left-right', got ${result.rotationStyle}`);
  return result;
});

// Summary
console.log('\n=== Test Summary ===');
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;
console.log(`Passed: ${passed}/${testResults.length}`);
console.log(`Failed: ${failed}/${testResults.length}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
}

// Export results
module.exports = { testResults, passed, failed };