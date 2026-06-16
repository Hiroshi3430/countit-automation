'use strict';

const assert = require('assert');
const { normalizeStockProductName } = require('../src/stockPage');

assert.strictEqual(normalizeStockProductName(' Sample Product '), 'Sample Product');
assert.strictEqual(normalizeStockProductName('Sample   Product'), 'Sample Product');
assert.strictEqual(normalizeStockProductName('Sample\u00a0Product'), 'Sample Product');
assert.strictEqual(normalizeStockProductName('SAMPLE Product'), 'SAMPLE Product');
assert.strictEqual(normalizeStockProductName(null), '');

console.log('stock page tests passed');
