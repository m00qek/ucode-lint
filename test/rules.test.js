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
// no-unsafe-shell (enhanced: catches bare variables, not just concat/template)
// ---------------------------------------------------------------------------

test('no-unsafe-shell: flags template literal in popen', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('popen(`ls ${dir}`, "r");', matcher).length > 0);
});

test('no-unsafe-shell: flags concatenation in popen', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('popen("ls " + dir, "r");', matcher).length > 0);
});

test('no-unsafe-shell: flags bare variable in popen (one-arg form)', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('popen(cmd);', matcher).length > 0, 'bare variable must be flagged');
});

test('no-unsafe-shell: flags bare variable in popen (two-arg form)', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('popen(cmd, "r");', matcher).length > 0, 'bare variable + mode must be flagged');
});

test('no-unsafe-shell: flags function call result in popen', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('popen(getCmd(), "r");', matcher).length > 0);
});

test('no-unsafe-shell: does not flag static string literal in popen', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.equal(lint('popen("ls -la", "r");', matcher).length, 0, 'static string must not be flagged');
});

test('no-unsafe-shell: flags bare variable in system', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.ok(lint('system(cmd);', matcher).length > 0);
});

test('no-unsafe-shell: does not flag static string in system', () => {
  const { matcher } = loadRule('no-unsafe-shell');
  assert.equal(lint('system("ls");', matcher).length, 0);
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
