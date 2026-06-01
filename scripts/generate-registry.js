#!/usr/bin/env node
const { readFileSync, readdirSync, writeFileSync } = require("fs");
const { join } = require("path");
const { parse } = require("yaml");

const root = join(__dirname, "..");
const pkgVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const packagesDir = join(root, "packages");

const entries = readdirSync(packagesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => {
    const yaml = readFileSync(join(packagesDir, d.name, "package.yaml"), "utf8");
    const pkg = parse(yaml);
    pkg.source.id = pkg.source.id.replace(/@[^@]+$/, `@${pkgVersion}`);
    return pkg;
  });

writeFileSync(join(root, "registry.json"), JSON.stringify(entries, null, 2) + "\n");
console.log(`Generated registry.json with ${entries.length} package(s).`);
