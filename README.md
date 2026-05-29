# ucode-lint

Lint rules for [ucode](https://github.com/jow-/ucode), the ECMAScript-like
scripting language used in OpenWrt.

Powered by [ast-grep](https://ast-grep.github.io) and
[tree-sitter-ucode](https://github.com/m00qek/tree-sitter-ucode).

## CI integration

```yaml
- run: npm install ucode-lint
- run: npx ucode-lint
```

## Usage

```sh
npx ucode-lint [paths...]   # lint specific files or directories
npx ucode-lint              # lint current directory
```

## Rules

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| `no-error-nodes` | error | Removed JS syntax | Flags any construct ucode cannot parse: `var`, `new`, `throw`, `typeof`, `class`, destructuring, `for...of`, `async`/`await`, `>>>` |
| `no-assignment-in-condition` | error | Common bugs | Assignment inside `if`/`while` condition — almost always `===` was intended |
| `no-eval` | error | Security | `eval()` executes arbitrary code |
| `no-unsafe-shell` | error | Security | `popen()`/`system()` called with a template literal or string concatenation — command injection risk |
| `prefer-strict-equality` | warning | Common bugs | `==` / `!=` — use `===` / `!==` to avoid type coercion |
| `no-optional-chain` | warning | Ucode-specific | `?.` short-circuits on ANY non-object (strings, numbers, booleans) — not just null. Use explicit null checks |
| `no-alt-block-syntax` | warning | Style | Prefer `{}` blocks over `if/endif`, `for/endfor`, `while/endwhile`, `function/endfunction` |

## Supported platforms

Ships prebuilt binaries for:
- Linux x64 (glibc and musl)
- Linux arm64 (glibc and musl)
- macOS x64 and arm64
- Windows x64 and arm64

## License

MIT
