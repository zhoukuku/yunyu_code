import fs from 'fs';

const content = fs.readFileSync('e:/k/meee/code/project01/frontend-vite/src/pages/python-editor/index.jsx', 'utf8');

// Simple but more accurate: find ALL const declarations in function/block scopes
// and check if the same name is reassigned at the same brace level

// Split into lines
const lines = content.split('\n');

// Track all const-declared variables with their scope (brace depth)
// A const declaration like: const name = ...
// Detected by matching: const name = (not followed by another =)
const issues = [];

// For each line, track brace depth
let braceDepth = 0;
// Map of variable name -> {line, depth, isConst}
const varDecls = []; // array of {name, line, depth}

lines.forEach((line, lineIdx) => {
  const lineno = lineIdx + 1;

  // Update brace depth for this line
  for (const ch of line) {
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
  }

  // Check for const declarations
  // Match: const name1 = ..., name2 = ..., ...
  const constMatch = line.match(/^\s*const\s+([\w$]+)\s*=/);
  if (constMatch) {
    varDecls.push({ name: constMatch[1], line: lineno, depth: braceDepth, isConst: true });
    // Check for multiple declarations in same statement
    const rest = line.substring(constMatch.index + constMatch[0].length);
    // handle: const a = 1, b = 2
    const moreDecls = rest.matchAll(/,?\s*([\w$]+)\s*=/g);
    for (const m of moreDecls) {
      varDecls.push({ name: m[1], line: lineno, depth: braceDepth, isConst: true });
    }
  }

  // Check for let/var declarations (to exclude them from false positives)
  const letMatch = line.match(/^\s*(?:let|var)\s+([\w$]+)\s*=/);
  if (letMatch) {
    varDecls.push({ name: letMatch[1], line: lineno, depth: braceDepth, isConst: false });
  }

  // Check for reassignment: name = value (not ==, ===, !=, etc.)
  const assignRe = /(?:^|[{;(]\s*)([\w$]+)\s*=\s*[^=]/g;
  let assignMatch;
  while ((assignMatch = assignRe.exec(line)) !== null) {
    const name = assignMatch[1];
    // Check if this name is a JSX prop (e.g., width={...}) - skip
    if (line.trim().startsWith(name + '={')) continue;
    // Check if it's an object property (e.g., { name: value }) - skip
    // Simple check: if preceded by { or , and the char before is not ; { (
    // This is approximate

    // Find the most recent const declaration of this name at the same or higher depth
    const relevantDecl = [...varDecls].reverse().find(d => d.name === name && d.depth <= braceDepth);

    if (relevantDecl && relevantDecl.isConst && relevantDecl.line < lineno) {
      // Verify it's not a false positive for object literals
      const beforeName = line.substring(0, assignMatch.index + assignMatch[0].indexOf(name));
      // If preceded by property-like patterns, skip
      if (/\{\s*$/.test(beforeName)) continue; // { name pattern
      if (/,\s*$/.test(beforeName)) continue; // in object literal comma
      if (/\w['"]?\s*:\s*$/.test(beforeName)) continue; // property:

      issues.push({
        name,
        declLine: relevantDecl.line,
        reassignLine: lineno,
        declText: lines[relevantDecl.line - 1].trim().substring(0, 80),
        reassignText: line.trim().substring(0, 80)
      });
    }
  }
});

// Deduplicate
const seen = new Set();
const uniqueIssues = issues.filter(i => {
  const key = i.name + ':' + i.declLine + ':' + i.reassignLine;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (uniqueIssues.length === 0) {
  console.log('No const reassignment errors found.');
} else {
  console.log('=== CONST REASSIGNMENT ERRORS ===');
  uniqueIssues.forEach(i => {
    console.log('Variable "' + i.name + '" declared const at line ' + i.declLine + ', reassigned at line ' + i.reassignLine);
    console.log('  Decl: ' + i.declText);
    console.log('  Reas: ' + i.reassignText);
    console.log('');
  });
}
