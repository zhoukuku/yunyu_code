import fs from 'fs';

const content = fs.readFileSync('e:/k/meee/code/project01/frontend-vite/src/pages/python-editor/index.jsx', 'utf8');
const lines = content.split('\n');

// Find all const declarations with their line numbers
const constDecls = [];
lines.forEach((line, i) => {
  const m = line.match(/^\s*const\s+(\w+)\s*=/);
  if (m) {
    constDecls.push({ name: m[1], line: i + 1, lineText: line.trim() });
  }
});

console.log('Found ' + constDecls.length + ' top-level const declarations');
console.log('');

// For each const variable, check if it's reassigned later
constDecls.forEach(decl => {
  const escaped = decl.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^\\s*' + escaped + '\\s*=\\s*[^=]');
  for (let i = decl.line; i < lines.length; i++) {
    const line = lines[i];
    if (re.test(line)) {
      console.log('POSSIBLE REASSIGN: ' + decl.name + ' (const at line ' + decl.line + ') -> line ' + (i+1) + ': ' + line.trim());
      break;
    }
  }
});

console.log('Done.');
