'use strict';

const sg = require('@ast-grep/napi');
const { registerUcodeGrammar } = require('../../lib/load-grammar');

registerUcodeGrammar(sg);

function lint(src, matcher) {
  return sg.parse('ucode', src).root().findAll(matcher);
}

module.exports = { sg, lint };
