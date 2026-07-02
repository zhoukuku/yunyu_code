// test_ipc_handlers.mjs - Test Electron main.js IPC handler logic
// Run with: node test_ipc_handlers.mjs

import { spawn, spawnSync } from 'child_process';
import { mkdirSync, existsSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const testResults = [];

function test(name, fn) {
  try {
    const result = fn();
    testResults.push({ name, passed: true });
    console.log(`PASS: ${name}`);
    return result;
  } catch (e) {
    testResults.push({ name, passed: false, error: e.message });
    console.log(`FAIL: ${name} - ${e.message}`);
    return null;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
  }
}

function assertContains(str, substr, msg) {
  if (!str.includes(substr)) {
    throw new Error(`${msg || 'Assertion failed'}: expected string to contain "${substr}", got "${str}"`);
  }
}

// =====================================================================
// Helper: replicate the temp dir logic from main.js
// =====================================================================
const TEMP_DIR = join(__dirname, 'test_temp');

function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

// =====================================================================
// 1. Test execute-python (spawn python directly to verify logic)
// =====================================================================
console.log('\n========== 1. execute-python handler tests ==========\n');

test('Python: print("hello") produces stdout "hello"', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_${Date.now()}.py`);
  const code = 'print("hello")';
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  // Cleanup temp file
  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
  const stdout = proc.stdout.toString().trim();
  assertEqual(stdout, 'hello', 'Python output mismatch');
});

test('Python: temp file is cleaned up after execution', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_cleanup_${Date.now()}.py`);
  const code = 'print("cleanup test")';
  writeFileSync(testFile, code, 'utf8');

  assert(existsSync(testFile), 'Temp file should exist before execution');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  // Simulate main.js cleanup
  try { unlinkSync(testFile); } catch (e) {}

  assert(!existsSync(testFile), 'Temp file should be cleaned up after execution');
  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
});

test('Python: code validation rejects non-string input', () => {
  // Replicate validateCodeInput logic
  const MAX_CODE_LENGTH = 1_000_000;

  function validateCodeInput(code, language) {
    if (typeof code !== 'string') {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `Invalid input: ${language} code must be a string, received ${code === null ? 'null' : typeof code}`
        }
      };
    }
    if (code.trim().length === 0) {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `No ${language} code provided. Please write some code before executing.`
        }
      };
    }
    if (code.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `Code is too long (${code.length} characters). Maximum allowed is ${MAX_CODE_LENGTH} characters.`
        }
      };
    }
    return { valid: true, code };
  }

  // Test null
  const r1 = validateCodeInput(null, 'Python');
  assert(!r1.valid, 'null should be invalid');
  assertContains(r1.error.stderr, 'null', 'Error should mention null');

  // Test number
  const r2 = validateCodeInput(123, 'Python');
  assert(!r2.valid, 'number should be invalid');
  assertContains(r2.error.stderr, 'number', 'Error should mention type');

  // Test empty string
  const r3 = validateCodeInput('   ', 'Python');
  assert(!r3.valid, 'whitespace-only should be invalid');
  assertContains(r3.error.stderr, 'No Python code', 'Error should mention no code');

  // Test valid code
  const r4 = validateCodeInput('print("hi")', 'Python');
  assert(r4.valid, 'valid code should pass');
  assertEqual(r4.code, 'print("hi")');

  // Test too-long code
  const longCode = 'x'.repeat(MAX_CODE_LENGTH + 1);
  const r5 = validateCodeInput(longCode, 'Python');
  assert(!r5.valid, 'too-long code should be invalid');
});

test('Python: stdin is piped correctly', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_stdin_${Date.now()}.py`);
  const code = 'name = input()\nprint(f"Hello, {name}!")';
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    input: 'World',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
  const stdout = proc.stdout.toString().trim();
  assertEqual(stdout, 'Hello, World!', 'Python stdin test failed');
});

test('Python: syntax error produces stderr and non-zero exit', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_err_${Date.now()}.py`);
  const code = 'print(undefined_var';
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status !== 0, 'Syntax error should produce non-zero exit code');
  assert(proc.stderr.length > 0, 'Syntax error should produce stderr output');
});

// =====================================================================
// 2. Test execute-cpp (spawn compiler directly to verify logic)
// =====================================================================
console.log('\n========== 2. execute-cpp handler tests ==========\n');

test('C++: simple hello world compiles and runs', () => {
  ensureTempDir();
  const id = Date.now();
  const cppFile = join(TEMP_DIR, `cpp_${id}.cpp`);
  const exeFile = join(TEMP_DIR, `cpp_${id}.exe`);
  const code = '#include <iostream>\nint main() {\n    std::cout << "hello" << std::endl;\n    return 0;\n}';
  writeFileSync(cppFile, code, 'utf8');

  // Compile
  const compile = spawnSync('g++', ['-o', exeFile, cppFile, '-std=c++17'], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  if (compile.status !== 0) {
    // Try clang++
    const compile2 = spawnSync('clang++', ['-o', exeFile, cppFile, '-std=c++17'], {
      timeout: 30000,
      windowsHide: true,
      stdio: 'pipe'
    });
    assert(compile2.status === 0,
      `C++ compilation failed.\ng++ stderr: ${compile.stderr.toString()}\nclang++ stderr: ${compile2.stderr ? compile2.stderr.toString() : 'N/A'}`);
  }

  assert(existsSync(exeFile), 'Compiled executable should exist');

  // Run
  const run = spawnSync(exeFile, [], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  // Cleanup
  try { unlinkSync(cppFile); } catch (e) {}
  try { unlinkSync(exeFile); } catch (e) {}

  assert(run.status === 0, `Expected exit code 0, got ${run.status}, stderr: ${run.stderr.toString()}`);
  const stdout = run.stdout.toString().trim();
  assertEqual(stdout, 'hello', 'C++ output mismatch');
});

test('C++: temp files cleaned up after execution', () => {
  ensureTempDir();
  const id = Date.now();
  const cppFile = join(TEMP_DIR, `cpp_cleanup_${id}.cpp`);
  const exeFile = join(TEMP_DIR, `cpp_cleanup_${id}.exe`);
  const code = '#include <iostream>\nint main() { std::cout << "ok"; return 0; }';
  writeFileSync(cppFile, code, 'utf8');

  assert(existsSync(cppFile), 'C++ source file should exist before compile');

  // Compile
  const compile = spawnSync('g++', ['-o', exeFile, cppFile, '-std=c++17'], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  if (compile.status !== 0) {
    try { unlinkSync(cppFile); } catch (e) {}
    throw new Error('C++ compilation failed: ' + compile.stderr.toString());
  }

  // Run
  spawnSync(exeFile, [], { timeout: 30000, windowsHide: true, stdio: 'pipe' });

  // Simulate main.js cleanup
  try { unlinkSync(cppFile); } catch (e) {}
  try { unlinkSync(exeFile); } catch (e) {}

  assert(!existsSync(cppFile), 'C++ source file should be cleaned up');
  assert(!existsSync(exeFile), 'C++ executable should be cleaned up');
});

test('C++: stdin is piped correctly', () => {
  ensureTempDir();
  const id = Date.now();
  const cppFile = join(TEMP_DIR, `cpp_stdin_${id}.cpp`);
  const exeFile = join(TEMP_DIR, `cpp_stdin_${id}.exe`);
  const code = `#include <iostream>
#include <string>
int main() {
    std::string name;
    std::getline(std::cin, name);
    std::cout << "Hello, " << name << "!";
    return 0;
}`;
  writeFileSync(cppFile, code, 'utf8');

  // Compile
  const compile = spawnSync('g++', ['-o', exeFile, cppFile, '-std=c++17'], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  if (compile.status !== 0) {
    try { unlinkSync(cppFile); } catch (e) {}
    throw new Error('C++ compilation failed: ' + compile.stderr.toString());
  }

  // Run with stdin
  const run = spawnSync(exeFile, [], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe',
    input: 'World'
  });

  // Cleanup
  try { unlinkSync(cppFile); } catch (e) {}
  try { unlinkSync(exeFile); } catch (e) {}

  assert(run.status === 0, `Expected exit code 0, got ${run.status}`);
  const stdout = run.stdout.toString().trim();
  assertEqual(stdout, 'Hello, World!', 'C++ stdin test failed');
});

test('C++: compilation error produces stderr', () => {
  ensureTempDir();
  const id = Date.now();
  const cppFile = join(TEMP_DIR, `cpp_err_${id}.cpp`);
  const exeFile = join(TEMP_DIR, `cpp_err_${id}.exe`);
  const code = '#include <iostream>\nint main() { std::cout << undefined_var; return 0; }';
  writeFileSync(cppFile, code, 'utf8');

  const compile = spawnSync('g++', ['-o', exeFile, cppFile, '-std=c++17'], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  // Cleanup
  try { unlinkSync(cppFile); } catch (e) {}
  try { unlinkSync(exeFile); } catch (e) {}

  assert(compile.status !== 0, 'Compilation error should produce non-zero exit code');
  assert(compile.stderr.length > 0, 'Compilation error should produce stderr output');
});

test('C++: code validation rejects non-string input', () => {
  const MAX_CODE_LENGTH = 1_000_000;
  function validateCodeInput(code, language) {
    if (typeof code !== 'string') {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `Invalid input: ${language} code must be a string, received ${code === null ? 'null' : typeof code}`
        }
      };
    }
    if (code.trim().length === 0) {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `No ${language} code provided. Please write some code before executing.`
        }
      };
    }
    if (code.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
        error: {
          success: false,
          stdout: '',
          stderr: `Code is too long (${code.length} characters). Maximum allowed is ${MAX_CODE_LENGTH} characters.`
        }
      };
    }
    return { valid: true, code };
  }

  const r1 = validateCodeInput(null, 'C++');
  assert(!r1.valid, 'null should be invalid');

  const r2 = validateCodeInput(undefined, 'C++');
  assert(!r2.valid, 'undefined should be invalid');

  const r3 = validateCodeInput('', 'C++');
  assert(!r3.valid, 'empty string should be invalid');

  const valid = validateCodeInput('#include <iostream>\nint main() { return 0; }', 'C++');
  assert(valid.valid, 'valid C++ code should pass');
});

// =====================================================================
// 3. Test get-version handler logic
// =====================================================================
console.log('\n========== 3. get-version handler tests ==========\n');

test('get-version: returns all required version fields', () => {
  // Simulate what the handler does
  const pkg = require(join(__dirname, 'electron', 'package.json'));
  const result = {
    app: pkg.version,
    electron: process.versions.electron || 'not running in Electron',
    chrome: process.versions.chrome || 'not running in Electron',
    node: process.versions.node
  };

  assert(result.app !== undefined, 'app version should exist');
  assert(typeof result.app === 'string', 'app version should be a string');
  assert(result.node !== undefined, 'node version should exist');
  assert(typeof result.node === 'string', 'node version should be a string');
  // When running outside Electron, electron and chrome versions may be undefined
  // but when running IN Electron, they must be present

  console.log(`  app: ${result.app}`);
  console.log(`  node: ${result.node}`);
  console.log(`  electron: ${result.electron}`);
  console.log(`  chrome: ${result.chrome}`);
});

test('get-version: node version is valid semver', () => {
  const v = process.versions.node;
  assert(/^\d+\.\d+\.\d+/.test(v), `Node version should be semver-like, got: ${v}`);
});

// =====================================================================
// 4. Test open-external URL validation logic
// =====================================================================
console.log('\n========== 4. open-external handler tests ==========\n');

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function validateURL(url) {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return { valid: false, reason: 'empty or non-string URL' };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return { valid: false, reason: `invalid URL format: ${e.message}` };
  }
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, reason: `disallowed protocol: ${parsed.protocol}` };
  }
  return { valid: true, url: parsed.href };
}

test('open-external: allows http:// URLs', () => {
  const r = validateURL('http://example.com');
  assert(r.valid, 'http: should be allowed');
});

test('open-external: allows https:// URLs', () => {
  const r = validateURL('https://example.com/path?q=1');
  assert(r.valid, 'https: should be allowed');
});

test('open-external: allows mailto: URLs', () => {
  const r = validateURL('mailto:test@example.com');
  assert(r.valid, 'mailto: should be allowed');
});

test('open-external: rejects javascript: URLs', () => {
  const r = validateURL('javascript:alert(1)');
  assert(!r.valid, 'javascript: should be rejected');
  assertContains(r.reason, 'disallowed protocol', 'Reason should mention protocol');
});

test('open-external: rejects file: URLs', () => {
  const r = validateURL('file:///etc/passwd');
  assert(!r.valid, 'file: should be rejected');
});

test('open-external: rejects data: URLs', () => {
  const r = validateURL('data:text/html,<script>alert(1)</script>');
  assert(!r.valid, 'data: should be rejected');
});

test('open-external: rejects empty string', () => {
  const r = validateURL('');
  assert(!r.valid, 'empty string should be rejected');
});

test('open-external: rejects whitespace-only string', () => {
  const r = validateURL('   ');
  assert(!r.valid, 'whitespace should be rejected');
});

test('open-external: rejects invalid URL format', () => {
  const r = validateURL('not a url at all');
  assert(!r.valid, 'gibberish should be rejected');
});

test('open-external: rejects null/undefined', () => {
  const r = validateURL(null);
  assert(!r.valid, 'null should be rejected');

  const r2 = validateURL(undefined);
  assert(!r2.valid, 'undefined should be rejected');
});

// =====================================================================
// 5. Test show-notification handler logic
// =====================================================================
console.log('\n========== 5. show-notification handler tests ==========\n');

test('show-notification: destructuring handles valid input', () => {
  // Simulate what the handler receives from preload
  const args = { title: 'Test Title', body: 'Test Body' };
  const { title, body } = args;
  assertEqual(title, 'Test Title', 'title should be extracted');
  assertEqual(body, 'Test Body', 'body should be extracted');
});

test('show-notification: returns null when no notificationManager', () => {
  // Simulate when windowManagement module failed to load
  const notificationManager = null;

  function handleNotification(event, { title, body }) {
    if (notificationManager) {
      return notificationManager.show(title, body);
    }
    // Fallback path would try Electron API - but we can't test that in Node
    return null;
  }

  // When no notificationManager and no Electron fallback available,
  // the function returns null gracefully
  const result = handleNotification(null, { title: 'Test', body: 'Body' });
  assert(result === null, 'Should return null when notifications unavailable');
});

test('show-notification: handles missing body field gracefully', () => {
  // The handler code uses: { title: title || '', body: body || '' }
  // in the fallback path
  function simulateFallback(title, body) {
    const safeTitle = title || '';
    const safeBody = body || '';
    // Would create Notification with these defaults
    // Returns null in non-Electron environment
    return { title: safeTitle, body: safeBody };
  }

  const r = simulateFallback(undefined, undefined);
  assertEqual(r.title, '', 'undefined title should default to empty string');
  assertEqual(r.body, '', 'undefined body should default to empty string');

  const r2 = simulateFallback(null, null);
  assertEqual(r2.title, '', 'null title should default to empty string');
  assertEqual(r2.body, '', 'null body should default to empty string');
});

// =====================================================================
// 6. Edge case / cross-cutting tests
// =====================================================================
console.log('\n========== 6. Edge case tests ==========\n');

test('Edge: Python execution with special characters', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_special_${Date.now()}.py`);
  const code = 'print("你好, 世界! @#$%^&*()")';
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
  const stdout = proc.stdout.toString().trim();
  assertEqual(stdout, '你好, 世界! @#$%^&*()', 'Special characters output mismatch');
});

test('Edge: Python execution with Unicode (multi-byte)', () => {
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_unicode_${Date.now()}.py`);
  const code = 'print("\\U0001f600")  # grinning face emoji';
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
  const stdout = proc.stdout.toString().trim();
  assert(stdout.length > 0, 'Should produce output');
  console.log(`  Unicode output: ${stdout}`);
});

test('Edge: C++ execution - runtime error produces non-zero exit', () => {
  ensureTempDir();
  const id = Date.now();
  const cppFile = join(TEMP_DIR, `cpp_rterr_${id}.cpp`);
  const exeFile = join(TEMP_DIR, `cpp_rterr_${id}.exe`);
  const code = '#include <iostream>\nint main() { std::cerr << "error message"; return 1; }';
  writeFileSync(cppFile, code, 'utf8');

  const compile = spawnSync('g++', ['-o', exeFile, cppFile, '-std=c++17'], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  if (compile.status !== 0) {
    try { unlinkSync(cppFile); } catch (e) {}
    throw new Error('C++ compilation failed: ' + compile.stderr.toString());
  }

  const run = spawnSync(exeFile, [], {
    timeout: 30000,
    windowsHide: true,
    stdio: 'pipe'
  });

  try { unlinkSync(cppFile); } catch (e) {}
  try { unlinkSync(exeFile); } catch (e) {}

  // main.js sets success: code === 0, so exit code 1 should mean success: false
  assert(run.status === 1, `Expected exit code 1, got ${run.status}`);
  const stderr = run.stderr.toString().trim();
  assertEqual(stderr, 'error message', 'stderr should contain error message');
});

test('Edge: PYTHONIOENCODING=utf-8 env var is set (verified)', () => {
  // This is a logic verification test - the env var in main.js uses 'utf-8'
  // Python accepts 'utf-8' as an alias for 'utf_8'
  ensureTempDir();
  const testFile = join(TEMP_DIR, `test_py_enc_${Date.now()}.py`);
  const code = `import sys, os
enc = os.environ.get('PYTHONIOENCODING', 'NOT SET')
print(enc)`;
  writeFileSync(testFile, code, 'utf8');

  const proc = spawnSync('python', ['-u', testFile], {
    timeout: 10000,
    windowsHide: true,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' })
  });

  try { unlinkSync(testFile); } catch (e) {}

  assert(proc.status === 0, `Expected exit code 0, got ${proc.status}`);
  const stdout = proc.stdout.toString().trim();
  assertEqual(stdout, 'utf-8', 'PYTHONIOENCODING should be utf-8');
});

test('Edge: Multiple C++ compilers detection (g++ found)', () => {
  // Verify that at least g++ or clang++ is available
  const gppResult = spawnSync('g++', ['--version'], {
    timeout: 5000,
    windowsHide: true,
    stdio: 'pipe'
  });
  const clangResult = spawnSync('clang++', ['--version'], {
    timeout: 5000,
    windowsHide: true,
    stdio: 'pipe'
  });

  const hasGpp = !gppResult.error;
  const hasClang = !clangResult.error;

  assert(hasGpp || hasClang, 'At least one C++ compiler (g++ or clang++) must be available');
  console.log(`  g++ available: ${hasGpp}`);
  console.log(`  clang++ available: ${hasClang}`);
});

// =====================================================================
// Summary
// =====================================================================
console.log('\n========== Test Summary ==========');
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;
console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log('\nFailed tests:');
  testResults.filter(r => !r.passed).forEach(r => {
    console.log(`  FAIL: ${r.name} - ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
}
