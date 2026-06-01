'use strict';

const path = require('node:path');

function registerUcodeGrammar(sg) {
  const grammarDir = path.dirname(require.resolve('tree-sitter-ucode/package.json'));
  const ngb = require(require.resolve('node-gyp-build', { paths: [grammarDir] }));
  sg.registerDynamicLanguage({
    ucode: {
      libraryPath: ngb.path(grammarDir),
      extensions:  ['uc'],
    },
  });
}

module.exports = { registerUcodeGrammar };
