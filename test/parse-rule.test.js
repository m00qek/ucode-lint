'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { parseRule } = require('../lib/parse-rule');

// ---------------------------------------------------------------------------
// Basic field extraction
// ---------------------------------------------------------------------------

test('parses id, severity, message from a simple kind rule', () => {
  const rule = parseRule(`
id: no-error-nodes
language: ucode
severity: error
message: Syntax error detected.
rule:
  kind: ERROR
`);
  assert.equal(rule.id, 'no-error-nodes');
  assert.equal(rule.severity, 'error');
  assert.equal(rule.message, 'Syntax error detected.');
  assert.deepEqual(rule.matcher, { rule: { kind: 'ERROR' } });
});

test('parses a single-pattern rule', () => {
  const rule = parseRule(`
id: no-eval
language: ucode
severity: error
message: eval is dangerous
rule:
  pattern: eval($$$ARGS)
`);
  assert.deepEqual(rule.matcher, { rule: { pattern: 'eval($$$ARGS)' } });
});

test('defaults severity to error when omitted', () => {
  const rule = parseRule(`
id: my-rule
message: something
rule:
  kind: ERROR
`);
  assert.equal(rule.severity, 'error');
});

test('uses id as message fallback when message is absent', () => {
  const rule = parseRule(`
id: fallback-rule
rule:
  kind: ERROR
`);
  assert.equal(rule.message, 'fallback-rule');
});

// ---------------------------------------------------------------------------
// Message scalar styles (the >- / |- variants were broken before)
// ---------------------------------------------------------------------------

test('parses folded block scalar (>) and collapses whitespace', () => {
  const rule = parseRule(`
id: my-rule
severity: warning
message: >
  This is a long message
  that spans multiple lines.
rule:
  kind: ERROR
`);
  assert.equal(rule.message, 'This is a long message that spans multiple lines.');
});

test('parses strip-folded scalar (>-)', () => {
  const rule = parseRule(`
id: my-rule
severity: warning
message: >-
  No trailing newline here.
rule:
  kind: ERROR
`);
  assert.equal(rule.message, 'No trailing newline here.');
});

test('parses literal block scalar (|)', () => {
  const rule = parseRule(`
id: my-rule
severity: error
message: |
  Line one.
  Line two.
rule:
  kind: ERROR
`);
  // | preserves newlines; we collapse them to spaces
  assert.equal(rule.message, 'Line one. Line two.');
});

// ---------------------------------------------------------------------------
// any: with mixed kind and pattern items (critical bug fix)
// ---------------------------------------------------------------------------

test('parses any: block with kind-only items', () => {
  const rule = parseRule(`
id: no-alt-block-syntax
language: ucode
severity: warning
message: prefer braces
rule:
  any:
    - kind: if_alt_statement
    - kind: for_alt_statement
    - kind: while_alt_statement
`);
  assert.notEqual(rule, null, 'rule must not be silently dropped');
  assert.deepEqual(rule.matcher, {
    rule: {
      any: [
        { kind: 'if_alt_statement' },
        { kind: 'for_alt_statement' },
        { kind: 'while_alt_statement' },
      ],
    },
  });
});

test('parses any: block with mixed kind and pattern items', () => {
  const rule = parseRule(`
id: no-alt-block-syntax
language: ucode
severity: warning
message: prefer braces
rule:
  any:
    - kind: if_alt_statement
    - kind: for_alt_statement
    - pattern: "function $NAME($$$PARAMS): $$$BODY endfunction"
`);
  assert.notEqual(rule, null, 'rule must not be silently dropped');
  assert.deepEqual(rule.matcher.rule.any, [
    { kind: 'if_alt_statement' },
    { kind: 'for_alt_statement' },
    { pattern: 'function $NAME($$$PARAMS): $$$BODY endfunction' },
  ]);
});

// ---------------------------------------------------------------------------
// constraints propagation
// ---------------------------------------------------------------------------

test('propagates constraints to the matcher', () => {
  const rule = parseRule(`
id: no-unsafe-shell
language: ucode
severity: error
message: unsafe shell
rule:
  pattern: popen($CMD)
constraints:
  CMD:
    not:
      kind: string
`);
  assert.notEqual(rule, null);
  assert.deepEqual(rule.matcher.constraints, {
    CMD: { not: { kind: 'string' } },
  });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

test('returns null for a rule missing the rule: field', () => {
  const result = parseRule(`
id: my-rule
severity: error
message: missing rule field
`);
  assert.equal(result, null);
});

test('returns null when id field is absent', () => {
  const result = parseRule(`
severity: error
message: no id here
rule:
  kind: ERROR
`);
  assert.equal(result, null, 'a rule without an id must be rejected, not produce (null) in output');
});

test('returns null when id field is empty string', () => {
  const result = parseRule(`
id: ""
severity: error
message: empty id
rule:
  kind: ERROR
`);
  assert.equal(result, null);
});

test('returns null when id field is null', () => {
  const result = parseRule(`
id: ~
severity: error
message: null id
rule:
  kind: ERROR
`);
  assert.equal(result, null);
});

test('returns null for completely invalid YAML', () => {
  const result = parseRule('{ invalid: [yaml: content');
  assert.equal(result, null);
});

test('returns null for empty input', () => {
  const result = parseRule('');
  assert.equal(result, null);
});
