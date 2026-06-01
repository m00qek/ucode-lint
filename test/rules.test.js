'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const path     = require('node:path');
const fs       = require('node:fs');
const { lint } = require('./helpers/sg');
const { parseRule } = require('../lib/parse-rule');

function loadRule(name) {
  const text = fs.readFileSync(
    path.join(__dirname, '..', 'rules', name + '.yml'),
    'utf8'
  );
  const rule = parseRule(text);
  assert.notEqual(rule, null, `${name}.yml failed to parse`);
  return rule;
}

// ---------------------------------------------------------------------------
// no-error-nodes — array destructuring (now covered after grammar fix)
// ---------------------------------------------------------------------------

test('no-error-nodes: flags let array destructuring (let [a,b] = arr)', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.ok(lint('let [a, b] = arr;', matcher).length > 0, 'let array destructuring must be flagged');
});

test('no-error-nodes: flags let array destructuring literal', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.ok(lint('let [a, b, c] = [1, 2, 3];', matcher).length > 0);
});

test('no-error-nodes: does not flag valid subscript access', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.equal(lint('let a = arr[0];', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-export-default-expression
// ---------------------------------------------------------------------------

test('no-export-default-expression: flags anonymous function without semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.ok(lint('export default function() {}', matcher).length > 0);
});

test('no-export-default-expression: flags named function without semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.ok(lint('export default function foo() {}', matcher).length > 0);
});

test('no-export-default-expression: passes function with trailing semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.equal(lint('export default function() {};', matcher).length, 0);
});

test('no-export-default-expression: does not flag named export (no default)', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.equal(lint('export function foo() {}', matcher).length, 0);
});

test('no-export-default-expression: flags arrow function without semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.ok(lint('export default (x) => x', matcher).length > 0);
});

test('no-export-default-expression: passes arrow function with trailing semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.equal(lint('export default (x) => x;', matcher).length, 0);
});

test('no-export-default-expression: flags number literal without semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.ok(lint('export default 42', matcher).length > 0);
});

test('no-export-default-expression: flags identifier without semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.ok(lint('export default obj', matcher).length > 0);
});

test('no-export-default-expression: passes number literal with trailing semicolon', () => {
  const { matcher } = loadRule('no-export-default-expression');
  assert.equal(lint('export default 42;', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-error-nodes
// ---------------------------------------------------------------------------

test('no-error-nodes: flags var declaration (not valid ucode)', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.ok(lint('var x = 1;', matcher).length > 0);
});

test('no-error-nodes: flags new keyword (not valid ucode)', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.ok(lint('let o = new Foo();', matcher).length > 0);
});

test('no-error-nodes: passes valid ucode let declaration', () => {
  const { matcher } = loadRule('no-error-nodes');
  assert.equal(lint('let x = 1;', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-eval
// ---------------------------------------------------------------------------

test('no-eval: flags eval()', () => {
  const { matcher } = loadRule('no-eval');
  assert.equal(lint('eval("code");', matcher).length, 1);
});

test('no-eval: flags eval() with expression argument', () => {
  const { matcher } = loadRule('no-eval');
  assert.equal(lint('eval(src);', matcher).length, 1);
});

test('no-eval: does not flag other call expressions', () => {
  const { matcher } = loadRule('no-eval');
  assert.equal(lint('parseInt("42");', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-unsafe-popen
// popen() has no array form and always runs through /bin/sh
// ---------------------------------------------------------------------------

test('no-unsafe-popen: flags template literal', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen(`ls ${dir}`, "r");', matcher).length > 0);
});

test('no-unsafe-popen: flags concatenation', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen("ls " + dir, "r");', matcher).length > 0);
});

test('no-unsafe-popen: flags bare variable (one-arg form)', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen(cmd);', matcher).length > 0, 'bare variable must be flagged');
});

test('no-unsafe-popen: flags bare variable (two-arg form)', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen(cmd, "r");', matcher).length > 0, 'bare variable + mode must be flagged');
});

test('no-unsafe-popen: flags function call result', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen(getCmd(), "r");', matcher).length > 0);
});

test('no-unsafe-popen: does not flag static string literal', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.equal(lint('popen("ls -la", "r");', matcher).length, 0, 'static string must not be flagged');
});

test('no-unsafe-popen: does not flag static template literal (no interpolation)', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.equal(lint('popen(`ls -la`, "r");', matcher).length, 0, 'static template must not be flagged');
});

test('no-unsafe-popen: flags template literal with interpolation', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('popen(`ls ${dir}`, "r");', matcher).length > 0, 'interpolated template must be flagged');
});

test('no-unsafe-popen: flags fs.popen(cmd) member-call form (one arg)', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('fs.popen(cmd);', matcher).length > 0, 'fs.popen(cmd) must be flagged');
});

test('no-unsafe-popen: flags fs.popen(cmd, mode) member-call form (two args)', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.ok(lint('fs.popen(cmd, "r");', matcher).length > 0, 'fs.popen(cmd, "r") must be flagged');
});

test('no-unsafe-popen: does not flag fs.popen with static string', () => {
  const { matcher } = loadRule('no-unsafe-popen');
  assert.equal(lint('fs.popen("ls", "r");', matcher).length, 0, 'fs.popen("static") must not be flagged');
});

// ---------------------------------------------------------------------------
// no-unsafe-system
// system() has a safe array form — only flag string-based dynamic calls
// ---------------------------------------------------------------------------

test('no-unsafe-system: flags bare variable', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system(cmd);', matcher).length > 0);
});

test('no-unsafe-system: flags template literal', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system(`rm -rf ${path}`);', matcher).length > 0);
});

test('no-unsafe-system: flags function call result', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system(buildCmd());', matcher).length > 0);
});

test('no-unsafe-system: does not flag static string', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.equal(lint('system("ls");', matcher).length, 0);
});

test('no-unsafe-system: does not flag static template literal (no interpolation)', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.equal(lint('system(`ls`);', matcher).length, 0, 'static template must not be flagged');
});

test('no-unsafe-system: flags template literal with interpolation', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system(`rm -rf ${path}`);', matcher).length > 0, 'interpolated template must be flagged');
});

test('no-unsafe-system: does not flag array literal (safe argv form)', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.equal(
    lint('system(["/bin/ls", dir]);', matcher).length, 0,
    'system([...]) is safe and must not be flagged'
  );
});

test('no-unsafe-system: flags string concatenation', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system("rm -rf " + path);', matcher).length > 0, 'string concatenation must be flagged');
});

test('no-unsafe-system: flags dynamic string with timeout argument', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.ok(lint('system(cmd, 5);', matcher).length > 0, 'two-arg form with dynamic cmd must be flagged');
});

test('no-unsafe-system: does not flag static string with timeout argument', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.equal(lint('system("ls", 5);', matcher).length, 0);
});

test('no-unsafe-system: does not flag array form with timeout argument', () => {
  const { matcher } = loadRule('no-unsafe-system');
  assert.equal(lint('system(["/bin/ls", dir], 5);', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-assignment-in-condition
// ---------------------------------------------------------------------------

test('no-assignment-in-condition: flags assignment in if condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('if (x = 1) { y = 2; }', matcher).length > 0);
});

test('no-assignment-in-condition: flags assignment in while condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('while (x = getNext()) {}', matcher).length > 0);
});

test('no-assignment-in-condition: passes strict equality in if', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('if (x === 1) { y = 2; }', matcher).length, 0);
});

test('no-assignment-in-condition: passes assignment in body (not condition)', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('if (x > 0) { x = 1; }', matcher).length, 0);
});

test('no-assignment-in-condition: flags assignment in ternary condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('let r = (x = lookup()) ? x : 0;', matcher).length > 0, 'ternary condition assignment must be flagged');
});

test('no-assignment-in-condition: passes normal ternary with no assignment', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('let r = x > 0 ? a : b;', matcher).length, 0);
});

test('no-assignment-in-condition: flags assignment in for-loop condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('for (let i = 0; i = getNext(); i++) {}', matcher).length > 0, 'for-condition assignment must be flagged');
});

test('no-assignment-in-condition: passes assignment in for-loop initializer', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('for (let i = 0; i < 10; i++) {}', matcher).length, 0);
});

test('no-assignment-in-condition: passes assignment in for-loop body', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('for (let i = 0; i < 10; i++) { x = 1; }', matcher).length, 0);
});

test('no-assignment-in-condition: flags assignment nested in if condition via &&', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('if (a && (x = 1)) {}', matcher).length > 0, 'nested && assignment must be flagged');
});

test('no-assignment-in-condition: flags assignment nested in if condition via ||', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('if (a || (x = fn())) {}', matcher).length > 0, 'nested || assignment must be flagged');
});

test('no-assignment-in-condition: flags assignment nested in while condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('while (a && (x = fn())) {}', matcher).length > 0, 'nested while assignment must be flagged');
});

test('no-assignment-in-condition: flags nested assignment in for-loop condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.ok(lint('for (let i = 0; ok && (i = fn()); i++) {}', matcher).length > 0, 'nested for-condition assignment must be flagged');
});

test('no-assignment-in-condition: does not flag assignment inside callback in if condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('if (arr.filter(function(x) { return x = 1; }).length) {}', matcher).length, 0, 'callback body must not be flagged');
});

test('no-assignment-in-condition: does not flag assignment inside arrow function in if condition', () => {
  const { matcher } = loadRule('no-assignment-in-condition');
  assert.equal(lint('if (arr.map(x => x = fn()).length) {}', matcher).length, 0, 'arrow fn body must not be flagged');
});

// ---------------------------------------------------------------------------
// prefer-strict-equality
// ---------------------------------------------------------------------------

test('prefer-strict-equality: flags == operator', () => {
  const { matcher } = loadRule('prefer-strict-equality');
  assert.ok(lint('if (a == b) {}', matcher).length > 0);
});

test('prefer-strict-equality: flags != operator', () => {
  const { matcher } = loadRule('prefer-strict-equality');
  assert.ok(lint('if (a != b) {}', matcher).length > 0);
});

test('prefer-strict-equality: passes === operator', () => {
  const { matcher } = loadRule('prefer-strict-equality');
  assert.equal(lint('if (a === b) {}', matcher).length, 0);
});

test('prefer-strict-equality: passes !== operator', () => {
  const { matcher } = loadRule('prefer-strict-equality');
  assert.equal(lint('if (a !== b) {}', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-optional-chain
// ---------------------------------------------------------------------------

test('no-optional-chain: flags ?. member access', () => {
  const { matcher } = loadRule('no-optional-chain');
  assert.ok(lint('let x = obj?.prop;', matcher).length > 0);
});

test('no-optional-chain: flags ?. subscript access', () => {
  const { matcher } = loadRule('no-optional-chain');
  assert.ok(lint('let x = obj?.[key];', matcher).length > 0);
});

test('no-optional-chain: flags ?. call', () => {
  const { matcher } = loadRule('no-optional-chain');
  assert.ok(lint('let x = fn?.();', matcher).length > 0);
});

test('no-optional-chain: passes regular member access', () => {
  const { matcher } = loadRule('no-optional-chain');
  assert.equal(lint('let x = obj.prop;', matcher).length, 0);
});

// ---------------------------------------------------------------------------
// no-alt-block-syntax (critical: this rule was silently dropped before the fix)
// ---------------------------------------------------------------------------

test('no-alt-block-syntax: rule loads without being silently dropped', () => {
  const rule = loadRule('no-alt-block-syntax');
  assert.notEqual(rule, null);
  assert.ok(Array.isArray(rule.matcher.rule.any), 'matcher must have an any: array');
  // Must contain both kind and pattern entries
  const hasKind    = rule.matcher.rule.any.some(r => r.kind);
  const hasPattern = rule.matcher.rule.any.some(r => r.pattern);
  assert.ok(hasKind,    'matcher must include kind entries');
  assert.ok(hasPattern, 'matcher must include pattern entry');
});

test('no-alt-block-syntax: flags if/endif syntax (if_alt_statement)', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.ok(lint('if (x): y = 1; endif', matcher).length > 0);
});

test('no-alt-block-syntax: flags counting for/endfor syntax (for_alt_statement)', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.ok(lint('for (let i = 0; i < 3; i++): print(i); endfor', matcher).length > 0);
});

test('no-alt-block-syntax: flags for-in/endfor syntax (for_in_alt_statement)', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.ok(lint('for (k in arr): print(k); endfor', matcher).length > 0);
});

test('no-alt-block-syntax: flags while/endwhile syntax (while_alt_statement)', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.ok(lint('while (x > 0): x--; endwhile', matcher).length > 0);
});

test('no-alt-block-syntax: flags function/endfunction syntax', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.ok(lint('function foo(): return 1; endfunction', matcher).length > 0);
});

test('no-alt-block-syntax: passes brace-delimited if block', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.equal(lint('if (x) { y = 1; }', matcher).length, 0);
});

test('no-alt-block-syntax: passes brace-delimited for block', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.equal(lint('for (let i = 0; i < 3; i++) { print(i); }', matcher).length, 0);
});

test('no-alt-block-syntax: passes brace-delimited function', () => {
  const { matcher } = loadRule('no-alt-block-syntax');
  assert.equal(lint('function foo() { return 1; }', matcher).length, 0);
});
