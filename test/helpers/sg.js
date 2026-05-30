'use strict';

const path = require('node:path');
const sg   = require('@ast-grep/napi');

const grammarDir = path.dirname(
  require.resolve('tree-sitter-ucode/package.json')
);
sg.registerDynamicLanguage({
  ucode: {
    libraryPath: path.join(grammarDir, 'ucode.so'),
    extensions:  ['uc'],
  },
});

function lint(src, matcher) {
  return sg.parse('ucode', src).root().findAll(matcher);
}

module.exports = { sg, lint };
