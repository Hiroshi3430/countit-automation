'use strict';

const assert = require('assert');
const { detectDelimiter, parseDelimited } = require('../src/input');

const tsvRows = parseDelimited([
  'Product Code\tExpected Product Name\tDiscount Price',
  '54321\tSample Product\t3'
].join('\n'));

assert.strictEqual(tsvRows.length, 1);
assert.strictEqual(tsvRows[0].__rowNumber, 2);
assert.strictEqual(tsvRows[0]['Product Code'], '54321');
assert.strictEqual(tsvRows[0]['Discount Price'], '3');

const csvRows = parseDelimited([
  'Product Code,Expected Product Name,Discount Price',
  '12345,"Sample, Product",2'
].join('\n'), ',');

assert.strictEqual(csvRows.length, 1);
assert.strictEqual(csvRows[0].__rowNumber, 2);
assert.strictEqual(csvRows[0]['Product Code'], '12345');
assert.strictEqual(csvRows[0]['Expected Product Name'], 'Sample, Product');

const embeddedQuoteName = 'Seasoning for "Chicken"';
assert.strictEqual(parseDelimited([
  'Product Code\tExpected Product Name\tDiscount Price',
  `12345\t${embeddedQuoteName}\t2`
].join('\n'))[0]['Expected Product Name'], embeddedQuoteName);

for (const delimiter of ['\t', ',']) {
  const quotedRows = parseDelimited([
    ['Product Code', 'Expected Product Name', 'Discount Price'].join(delimiter),
    ['12345', '"Sample ""Product""\nwith' + delimiter + 'separator"', '2'].join(delimiter)
  ].join('\n'), delimiter);
  assert.strictEqual(quotedRows[0]['Expected Product Name'], 'Sample "Product"\nwith' + delimiter + 'separator');
  assert.strictEqual(quotedRows[0]['Discount Price'], '2');
  assert.throws(() => parseDelimited(`A${delimiter}B\n1${delimiter}2${delimiter}3`, delimiter),
    { code: 'CSV_RECORD_INCONSISTENT_COLUMNS' });
  assert.throws(() => parseDelimited(`A${delimiter}B\n1${delimiter}"unclosed`, delimiter),
    { code: 'CSV_QUOTE_NOT_CLOSED' });
}

assert.throws(() => parseDelimited('A,B\n1,Seasoning for "Chicken"', ','),
  { code: 'INVALID_OPENING_QUOTE' });

assert.strictEqual(detectDelimiter('examples/discounts.tsv'), '\t');
assert.strictEqual(detectDelimiter('examples/discounts.csv'), ',');
assert.throws(
  () => detectDelimiter('examples/discounts.txt'),
  /\.tsv または \.csv/
);

console.log('input tests passed');
