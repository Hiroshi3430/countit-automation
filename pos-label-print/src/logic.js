'use strict';

function normalizeText(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseCountItNumber(value) {
  const text = normalizeText(value);
  if (!text) return NaN;

  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(/,/g, '');

  return Number(normalized);
}

function dedupeByProductCode(items) {
  const seen = new Set();
  const deduped = [];
  const duplicates = [];

  for (const item of items) {
    if (seen.has(item.productCode)) {
      duplicates.push(item);
      continue;
    }
    seen.add(item.productCode);
    deduped.push(item);
  }

  return { deduped, duplicates };
}

function shouldPrintLabel(currentStock) {
  const numericStock = parseCountItNumber(currentStock);
  return Number.isFinite(numericStock) && numericStock <= 0;
}

module.exports = {
  dedupeByProductCode,
  normalizeText,
  parseCountItNumber,
  shouldPrintLabel
};
