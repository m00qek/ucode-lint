# ucode-lint

Static linter for [ucode](https://github.com/jow-/ucode), the ECMAScript-like
scripting language used in OpenWrt. Catches security vulnerabilities, common
bugs, and ucode-specific pitfalls that standard JavaScript linters miss.

Powered by [ast-grep](https://ast-grep.github.io) and
[tree-sitter-ucode](https://github.com/m00qek/tree-sitter-ucode).

## Installation

```sh
npm install --save-dev ucode-lint
```

## Usage

```sh
npx ucode-lint [paths...]   # lint specific files or directories
npx ucode-lint              # lint current directory (default)
```

Example output:

```
src/handler.uc:12:5: [error] popen() always passes its argument through /bin/sh … (no-unsafe-popen)
src/handler.uc:34:3: [warning] Use `===` / `!==` instead of `==` / `!=`. … (prefer-strict-equality)

2 problems (1 error, 1 warning) in 1 file.
```

Exit code `0` if no errors are found (warnings do not affect the exit code).  
Exit code `1` if one or more errors are found.

## CI integration

```yaml
- run: npm install
- run: npx ucode-lint
```

## Rules

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| `no-error-nodes` | error | Removed JS syntax | Flags any construct ucode cannot parse: `var`, `new`, `throw`, `typeof`, `class`, destructuring, `for...of`, `async`/`await`, `>>>` |
| `no-assignment-in-condition` | error | Common bugs | Assignment inside an `if`, `while`, `for`, or ternary condition — use `===` to compare, or move the assignment before the condition |
| `no-eval` | error | Security | `eval()` executes arbitrary code |
| `no-unsafe-popen` | error | Security | `popen()` always runs its argument through `/bin/sh` and has no array form — sanitize inputs or replace with `system([...])` |
| `no-unsafe-system` | error | Security | `system()` with a dynamic string runs through `/bin/sh` — use the array form `system(["/cmd", arg1, arg2])` to bypass the shell entirely |
| `prefer-strict-equality` | warning | Common bugs | `==` / `!=` do type coercion — use `===` / `!==` instead |
| `no-optional-chain` | warning | Ucode-specific | `?.` short-circuits on ANY non-object value (strings, numbers, booleans), not just `null` — use explicit null checks |
| `no-alt-block-syntax` | warning | Style | Prefer `{}` blocks over `if/endif`, `for/endfor`, `while/endwhile`, `function/endfunction` |

## Supported platforms

Ships prebuilt binaries for:
- Linux x64 (glibc and musl)
- Linux arm64 (glibc and musl)
- macOS x64 and arm64
- Windows x64 and arm64

## License

MIT
