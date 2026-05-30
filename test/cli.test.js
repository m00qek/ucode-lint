'use strict';

const { test }    = require('node:test');
const assert      = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path        = require('node:path');
const fs          = require('node:fs');
const os          = require('node:os');

const CLI = path.join(__dirname, '..', 'bin', 'ucode-lint');

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// --help
// ---------------------------------------------------------------------------

test('--help exits with code 0', () => {
  const { status } = run(['--help']);
  assert.equal(status, 0);
});

test('--help prints usage line', () => {
  const { stdout } = run(['--help']);
  assert.ok(stdout.includes('Usage: ucode-lint'), 'must include Usage line');
});

test('--help lists all rule names', () => {
  const { stdout } = run(['--help']);
  const ruleNames = fs.readdirSync(path.join(__dirname, '..', 'rules'))
    .filter(f => f.endsWith('.yml'))
    .map(f => f.slice(0, -4));
  for (const name of ruleNames) {
    assert.ok(stdout.includes(name), `help output must list rule: ${name}`);
  }
});

test('-h is an alias for --help', () => {
  const { status, stdout } = run(['-h']);
  assert.equal(status, 0);
  assert.ok(stdout.includes('Usage: ucode-lint'));
});

// ---------------------------------------------------------------------------
// Non-existent path
// ---------------------------------------------------------------------------

test('non-existent path prints a message and exits 0 (no errors)', () => {
  const { status, stderr } = run(['/absolutely/does/not/exist']);
  // Should print an error message to stderr, NOT crash with a stack trace
  assert.ok(stderr.includes('ENOENT') || stderr.includes('no such file'),
    'must report ENOENT, not crash silently');
  // No .uc files found → exit 0
  assert.equal(status, 0);
});

// ---------------------------------------------------------------------------
// Linting clean files
// ---------------------------------------------------------------------------

test('exits 0 for a clean file with no issues', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  const file = path.join(dir, 'clean.uc');
  fs.writeFileSync(file, 'let x = 1;\n');
  try {
    const { status, stdout } = run([file]);
    assert.equal(status, 0);
    assert.ok(stdout.includes('0 problems'));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Linting files with errors
// ---------------------------------------------------------------------------

test('exits 1 when errors are found', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  const file = path.join(dir, 'bad.uc');
  fs.writeFileSync(file, 'eval("x");\n');
  try {
    const { status, stdout } = run([file]);
    assert.equal(status, 1);
    assert.ok(stdout.includes('no-eval'));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('output line format is file:line:col: [severity] message (id)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  const file = path.join(dir, 'bad.uc');
  fs.writeFileSync(file, 'eval("x");\n');
  try {
    const { stdout } = run([file]);
    // e.g. /tmp/…/bad.uc:1:1: [error] … (no-eval)
    assert.match(stdout, /bad\.uc:\d+:\d+: \[error\] .+ \(no-eval\)/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('exits 0 for warnings-only file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  const file = path.join(dir, 'warn.uc');
  fs.writeFileSync(file, 'if (a == b) {}\n');
  try {
    const { status, stdout } = run([file]);
    assert.equal(status, 0, 'warnings alone must not trigger exit 1');
    assert.ok(stdout.includes('prefer-strict-equality'));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// No .uc files found
// ---------------------------------------------------------------------------

test('exits 0 with message when no .uc files are found', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  fs.writeFileSync(path.join(dir, 'readme.txt'), 'hello');
  try {
    const { status, stdout } = run([dir]);
    assert.equal(status, 0);
    assert.ok(stdout.includes('no .uc files found'));
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// Symlink cycle (must not crash or hang)
// ---------------------------------------------------------------------------

test('handles symlink cycle without crashing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucode-lint-'));
  // Create a symlink pointing back to the directory itself
  fs.symlinkSync(dir, path.join(dir, 'loop'));
  try {
    const { status } = run([dir], { timeout: 5000 });
    // Should exit cleanly (0 = no errors / no files found)
    assert.equal(status, 0);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
