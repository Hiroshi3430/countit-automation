'use strict';

const assert = require('assert');
const { detectDelimiter, parseDelimited } = require('../src/input');

const csvRows = parseDelimited([
  'Product Code,Expected Product Name,Discount Price',
  '12345,"Sample, Product",2'
].join('\n'));

assert.strictEqual(csvRows.length, 1);
assert.strictEqual(csvRows[0].__rowNumber, 2);
assert.strictEqual(csvRows[0]['Product Code'], '12345');
assert.strictEqual(csvRows[0]['Expected Product Name'], 'Sample, Product');

const tsvRows = parseDelimited([
  'Product Code\tExpected Product Name\tDiscount Price',
  '54321\tSample Product\t3'
].join('\n'), '\t');

assert.strictEqual(tsvRows.length, 1);
assert.strictEqual(tsvRows[0]['Product Code'], '54321');
assert.strictEqual(tsvRows[0]['Discount Price'], '3');

assert.strictEqual(detectDelimiter('examples/discounts.csv'), ',');
assert.strictEqual(detectDelimiter('examples/discounts.tsv'), '\t');

console.log('input tests passed');
