'use strict';

const assert = require('assert');
const { parseStockInput } = require('../src/input');

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

assert.throws(() => parseStockInput([
  'type\tproduct_code\tamount\tproduct_name\tdescription',
  'setting\t\t\t\tTest stock count',
  'item\t12345\tabc\tSample Product\t'
].join('\n')), /amount は整数/);

console.log('stock input tests passed');
