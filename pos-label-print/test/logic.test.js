'use strict';

const assert = require('assert');
const {
  dedupeByProductCode,
  parseCountItNumber,
  shouldPrintLabel
} = require('../src/logic');
const { parseArgs } = require('../src/args');
const { filterDuplicateLabelPrintItems, _test: labelPrintPageTest } = require('../src/labelPrintPage');
const { _test: stockCountPageTest } = require('../src/stockCountPage');

assert.strictEqual(parseCountItNumber('0'), 0);
assert.strictEqual(parseCountItNumber('0,00'), 0);
assert.strictEqual(parseCountItNumber('-1'), -1);
assert.strictEqual(parseCountItNumber('-1,00'), -1);
assert.strictEqual(parseCountItNumber('1.234,50'), 1234.5);

assert.strictEqual(shouldPrintLabel('0'), true);
assert.strictEqual(shouldPrintLabel('0,00'), true);
assert.strictEqual(shouldPrintLabel('-1,00'), true);
assert.strictEqual(shouldPrintLabel('0,01'), false);
assert.strictEqual(shouldPrintLabel('abc'), false);

const { deduped, duplicates } = dedupeByProductCode([
  { productCode: '10001' },
  { productCode: '10002' },
  { productCode: '10001' }
]);
assert.deepStrictEqual(deduped.map((item) => item.productCode), ['10001', '10002']);
assert.deepStrictEqual(duplicates.map((item) => item.productCode), ['10001']);

const appendArgs = parseArgs([
  'node',
  'main.js',
  '--append-to-label-print',
  'Existing labels',
  '--stock-count',
  'Stock count',
  '--semi-auto',
  '--limit',
  '3'
]);
assert.strictEqual(appendArgs.appendToLabelPrintName, 'Existing labels');
assert.strictEqual(appendArgs.stockCountDescription, 'Stock count');
assert.strictEqual(appendArgs.semiAuto, true);
assert.strictEqual(appendArgs.limit, 3);
assert.throws(
  () => parseArgs(['node', 'main.js', '--stock-count', 'Stock', '--label-print-name', 'New', '--append-to-label-print', 'Existing']),
  /must not be used together/
);

const duplicateResult = filterDuplicateLabelPrintItems([
  { productCode: '10001' },
  { productCode: '10002' },
  { productCode: '10002' },
  { productCode: '10003' }
], [
  { productCode: '10001' }
]);
assert.deepStrictEqual(duplicateResult.uniqueItems.map((item) => item.productCode), ['10002', '10003']);
assert.deepStrictEqual(duplicateResult.skippedDuplicates.map((item) => item.productCode), ['10001', '10002']);

function makeMockRow(cellValues) {
  const cells = cellValues.map((value) => {
    const cell = {
      innerText: async () => value.text ?? '',
      locator: () => ({
        first: () => ({
          inputValue: async () => value.input ?? ''
        })
      })
    };
    return cell;
  });

  return {
    locator: (selector) => {
      if (selector === 'td') {
        return {
          nth: (index) => cells[index] ?? {
            innerText: async () => '',
            locator: () => ({ first: () => ({ inputValue: async () => '' }) })
          }
        };
      }

      return {
        count: async () => 0
      };
    }
  };
}

(async () => {
  const item = await stockCountPageTest.readStockCountRow(
    makeMockRow([
      { text: '50038' },
      { text: '0,00' },
      { text: '' },
      { text: '' }
    ]),
    { currentStock: 1, difference: 2, newStock: 3 },
    '50038',
    1
  );

  assert.deepStrictEqual(item, {
    productCode: '50038',
    description: '',
    currentStock: '0,00',
    difference: '',
    newStock: ''
  });

  const labelLookupState = {
    entered: '94000',
    description: '',
    fills: [],
    pressed: []
  };
  const expectedLabelDescription = "Shinshi Yukata 2-Ten Set (Men's Casual Summer Kimono 2-Piece Set)";
  const labelProductInput = {
    fill: async (value) => {
      labelLookupState.entered = value;
      labelLookupState.fills.push(value);
    },
    press: async (key) => {
      labelLookupState.pressed.push(key);
      if (key !== 'Enter' && key !== 'Tab') return;
      labelLookupState.description = labelLookupState.entered === '94000'
        ? 'Flying Fish Hamachi (Hamachi Yellowtail)'
        : labelLookupState.entered;
    }
  };
  const labelPage = {
    waitForTimeout: async () => {},
    locator: (selector) => {
      assert.strictEqual(selector, '#scan_line_tr_1 td.td_description');
      return {
        innerText: async () => labelLookupState.description
      };
    }
  };

  await labelPrintPageTest.selectProductForLabelPrintRow(
    labelPage,
    labelProductInput,
    { productCode: '94000', description: expectedLabelDescription },
    1,
    { timeout: 1 }
  );
  assert.deepStrictEqual(labelLookupState.fills, ['', expectedLabelDescription]);
  assert.strictEqual(labelLookupState.description, expectedLabelDescription);
  assert.deepStrictEqual(labelLookupState.pressed, ['ArrowDown', 'Enter', 'Tab', 'ArrowDown', 'Enter']);

  await assert.rejects(
    () => stockCountPageTest.readStockCountRow(
      makeMockRow([
        { text: '17619' },
        { text: '' },
        { text: '1' },
        { text: '1' }
      ]),
      { currentStock: 1, difference: 2, newStock: 3 },
      '17619',
      1
    ),
    /Current stock cell was empty or unreadable/
  );

  console.log('label print logic tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
