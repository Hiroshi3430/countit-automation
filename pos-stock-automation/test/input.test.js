'use strict';

const assert = require('assert');
const { detectDelimiterFromExtension, parseStockInput } = require('../src/input');

assert.strictEqual(detectDelimiterFromExtension('input/stock_input.tsv'), '\t');
assert.strictEqual(detectDelimiterFromExtension('input/stock_input.csv'), ',');
assert.throws(
  () => detectDelimiterFromExtension('input/stock_input.txt'),
  /\.tsv または \.csv/
);

const parsed = parseStockInput([
  'type\tproduct_code\tamount\tproduct_name\tdescription',
  'setting\t\t\t\tTest stock count',
  'item\t12345\t2\tSample Product\t'
].join('\n'));

assert.strictEqual(parsed.inventoryDescription, 'Test stock count');
assert.strictEqual(parsed.records.length, 1);
assert.strictEqual(parsed.records[0].product_code, '12345');
assert.strictEqual(parsed.records[0].amount, '2');
assert.strictEqual(parsed.records[0].product_name, 'Sample Product');

const csvParsed = parseStockInput([
  'type,product_code,amount,product_name,description',
  'setting,,,,Test stock count',
  'item,54321,3,Sample Product,'
].join('\n'), ',');

assert.strictEqual(csvParsed.inventoryDescription, 'Test stock count');
assert.strictEqual(csvParsed.records.length, 1);
assert.strictEqual(csvParsed.records[0].product_code, '54321');
assert.strictEqual(csvParsed.records[0].amount, '3');
assert.strictEqual(csvParsed.records[0].product_name, 'Sample Product');

assert.throws(() => parseStockInput([
  'type\tproduct_code\tamount\tproduct_name\tdescription',
  'setting\t\t\t\tTest stock count',
  'item\t12345\tabc\tSample Product\t'
].join('\n')), /amount は整数/);

console.log('stock input tests passed');
