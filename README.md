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
| (none yet — Phase 2a) | | | |

## Supported platforms

Ships prebuilt binaries for:
- Linux x64 (glibc and musl)
- Linux arm64 (glibc and musl)
- macOS x64 and arm64
- Windows x64 and arm64

## License

MIT
