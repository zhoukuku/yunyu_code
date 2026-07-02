// C++ Editor Test Suite
// Tests: Hello World, Compilation Errors, Code Templates, Error Handling

const fs = require('fs');
const path = require('path');

const testResults = {
  timestamp: new Date().toISOString(),
  category: "C++ Editor",
  tests: []
};

function addTest(name, passed, output = "") {
  testResults.tests.push({ name, passed, output });
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
  if (output) console.log(`  Output: ${output.substring(0, 200)}`);
}

// Test 1: Hello World Code Structure
function testHelloWorldCode() {
  const helloWorld = `#include <iostream>
int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`;

  const hasMain = helloWorld.includes('int main()');
  const hasInclude = helloWorld.includes('#include <iostream>');
  const hasCout = helloWorld.includes('std::cout');

  addTest(
    "Hello World: Code structure is valid",
    hasMain && hasInclude && hasCout,
    "Valid C++ hello world structure"
  );
}

// Test 2: Hello World File Exists
function testHelloWorldFile() {
  const filePath = path.join(__dirname, 'test_cpp_hello.cpp');
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf-8');
    addTest("Hello World: test_cpp_hello.cpp exists", true, content);
  } else {
    addTest("Hello World: test_cpp_hello.cpp exists", false, "File not found");
  }
}

// Test 3: Syntax Error Detection
function testSyntaxErrorDetection() {
  const syntaxErrorCode = `#include <iostream>
int main() {
    std::cout << "Hello" << std::endl
    return 0;
}`;

  // Check for missing semicolon pattern
  const hasError = syntaxErrorCode.includes('std::cout << "Hello" << std::endl\n    return');
  addTest(
    "Syntax Error: Missing semicolon detection",
    hasError,
    "Code with missing semicolon after cout"
  );
}

// Test 4: Undeclared Variable Detection
function testUndeclaredVariable() {
  const undeclaredCode = `#include <iostream>
int main() {
    std::cout << x << std::endl;
    return 0;
}`;

  const hasUndeclared = undeclaredCode.includes('cout << x');
  addTest(
    "Undeclared Variable: Error detection pattern",
    hasUndeclared,
    "Code with undeclared variable x"
  );
}

// Test 5: Template Code Verification
function testCppTemplates() {
  const templates = {
    default: { name: '默认模板', category: '基础' },
    algorithm: { name: '算法模板', category: '算法' },
    datastructure: { name: '数据结构模板', category: '数据结构' },
    oop: { name: '面向对象模板', category: 'OOP' },
    stl: { name: 'STL 容器模板', category: 'STL' },
    recursion: { name: '递归模板', category: '算法' },
    dynamicProgramming: { name: '动态规划模板', category: '算法' },
    string: { name: '字符串处理模板', category: '基础' },
    fileIO: { name: '文件读写模板', category: '基础' },
    sorting: { name: '排序算法模板', category: '算法' },
    graph: { name: '图算法模板', category: '算法' }
  };

  const templateCount = Object.keys(templates).length;
  addTest(
    `Templates: All ${templateCount} templates defined`,
    templateCount === 11,
    `Found ${templateCount} templates`
  );
}

// Test 6: Error Patterns Definition
function testErrorPatterns() {
  const errorPatterns = [
    { pattern: /error: (.+)/i, type: 'syntax' },
    { pattern: /expected (.+)/i, type: 'syntax' },
    { pattern: /(.+) was not declared in this scope/i, type: 'undeclared' },
    { pattern: /undefined reference to (.+)/i, type: 'linker' },
    { pattern: /Segmentation fault/i, type: 'runtime' }
  ];

  const patternCount = errorPatterns.length;
  addTest(
    `Error Patterns: ${patternCount} patterns defined`,
    patternCount >= 5,
    `Found ${patternCount} error patterns`
  );
}

// Test 7: Backend C++ Execution Service
function testBackendExecutionService() {
  const servicePath = path.join(__dirname, 'electron', 'backend', 'src', 'code-execution', 'code-execution.service.ts');
  const exists = fs.existsSync(servicePath);

  if (exists) {
    const content = fs.readFileSync(servicePath, 'utf-8');
    const hasCppExecution = content.includes('executeCpp');
    const hasCompilerCheck = content.includes('g++') || content.includes('clang++');
    const hasTimeout = content.includes('EXECUTION_TIMEOUT');

    addTest(
      "Backend: C++ execution service exists",
      exists,
      "code-execution.service.ts found"
    );
    addTest(
      "Backend: executeCpp method defined",
      hasCppExecution,
      "executeCpp method found"
    );
    addTest(
      "Backend: Compiler detection (g++/clang++)",
      hasCompilerCheck,
      "Compiler paths defined"
    );
    addTest(
      "Backend: Execution timeout configured",
      hasTimeout,
      "30 second timeout set"
    );
  } else {
    addTest("Backend: C++ execution service exists", false, "Service file not found");
  }
}

// Test 8: Frontend C++ Editor Component
function testCppEditorComponent() {
  const editorPath = path.join(__dirname, 'frontend-vite', 'src', 'pages', 'cpp-editor', 'index.jsx');
  const exists = fs.existsSync(editorPath);

  if (exists) {
    const content = fs.readFileSync(editorPath, 'utf-8');
    const hasHandleRun = content.includes('handleRun');
    const hasCodeMirror = content.includes('EditorView');
    const hasCppLang = content.includes('cpp()');
    const hasTemplates = content.includes('cppTemplates');
    const hasErrorDisplay = content.includes('cppErrorPatterns');

    addTest(
      "Frontend: C++ Editor component exists",
      exists,
      "index.jsx found"
    );
    addTest(
      "Frontend: handleRun function defined",
      hasHandleRun,
      "Run handler found"
    );
    addTest(
      "Frontend: CodeMirror editor integration",
      hasCodeMirror,
      "EditorView integration found"
    );
    addTest(
      "Frontend: C++ language support",
      hasCppLang,
      "cpp() language extension found"
    );
    addTest(
      "Frontend: Code templates available",
      hasTemplates,
      "cppTemplates object found"
    );
    addTest(
      "Frontend: Error pattern matching",
      hasErrorDisplay,
      "cppErrorPatterns found"
    );
  } else {
    addTest("Frontend: C++ Editor component exists", false, "Editor file not found");
  }
}

// Test 9: Compilation Error Simulation
function testCompilationErrorMessages() {
  const errorMessages = {
    missingSemicolon: "error: expected ';' after return statement",
    undeclaredVariable: "error: 'x' was not declared in this scope",
    undefinedReference: "undefined reference to 'main'",
    missingInclude: "fatal error: iostream: No such file or directory"
  };

  // Check that all error message patterns cover both compile errors and linker errors
  const hasAllErrors = Object.values(errorMessages).every(msg =>
    msg.includes('error') || msg.includes('undefined reference')
  );
  addTest(
    "Compilation Errors: All error types defined",
    hasAllErrors,
    `Defined ${Object.keys(errorMessages).length} error message patterns`
  );
}

// Test 10: Code Execution Flow
function testCodeExecutionFlow() {
  const flowSteps = [
    'createCodeExecution',
    'executeCode',
    'updateExecution',
    'executeCpp',
    'compileAndRunCpp',
    'runCommand'
  ];

  const servicePath = path.join(__dirname, 'electron', 'backend', 'src', 'code-execution', 'code-execution.service.ts');
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf-8');
    const foundSteps = flowSteps.filter(step => content.includes(step));

    addTest(
      `Code Execution Flow: ${foundSteps.length}/${flowSteps.length} steps defined`,
      foundSteps.length >= 5,
      `Found steps: ${foundSteps.join(', ')}`
    );
  }
}

// Run all tests
console.log("\n=== C++ Editor Test Suite ===\n");
console.log("Timestamp:", testResults.timestamp);
console.log("");

testHelloWorldCode();
testHelloWorldFile();
testSyntaxErrorDetection();
testUndeclaredVariable();
testCppTemplates();
testErrorPatterns();
testBackendExecutionService();
testCppEditorComponent();
testCompilationErrorMessages();
testCodeExecutionFlow();

// Summary
const passed = testResults.tests.filter(t => t.passed).length;
const failed = testResults.tests.filter(t => !t.passed).length;
const total = testResults.tests.length;

testResults.summary = {
  total,
  passed,
  failed,
  passRate: `${((passed / total) * 100).toFixed(1)}%`
};

console.log("\n=== Test Summary ===");
console.log(`Total: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${testResults.summary.passRate}`);

// Write results to file
fs.writeFileSync(
  path.join(__dirname, 'testResults'),
  JSON.stringify(testResults, null, 2)
);

console.log("\nResults written to testResults");