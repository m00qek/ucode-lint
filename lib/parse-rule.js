'use strict';

const yaml = require('yaml');

function parseRule(yamlText) {
  let doc;
  try {
    doc = yaml.parse(yamlText);
  } catch {
    return null;
  }
  if (!doc || !doc.rule) return null;

  const id = typeof doc.id === 'string' && doc.id.trim() ? doc.id.trim() : null;
  if (!id) return null;
  const severity = doc.severity ?? 'error';
  const message  = doc.message != null
    ? String(doc.message).replace(/\s+/g, ' ').trim()
    : id;

  const matcher = { rule: doc.rule };
  if (doc.constraints) matcher.constraints = doc.constraints;
  if (doc.utils)       matcher.utils       = doc.utils;

  return { id, severity, message, matcher };
}

module.exports = { parseRule };
