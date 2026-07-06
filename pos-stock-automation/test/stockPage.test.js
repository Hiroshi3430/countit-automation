'use strict';

const assert = require('assert');
const {
  DangerousAutomationError,
  fillInventoryCount,
  normalizeStockProductName,
  saveOrPause
} = require('../src/stockPage');

assert.strictEqual(normalizeStockProductName(' Sample Product '), 'Sample Product');
assert.strictEqual(normalizeStockProductName('Sample   Product'), 'Sample Product');
assert.strictEqual(normalizeStockProductName('Sample\u00a0Product'), 'Sample Product');
assert.strictEqual(normalizeStockProductName('SAMPLE Product'), 'SAMPLE Product');
assert.strictEqual(normalizeStockProductName(null), '');

const dangerousError = new DangerousAutomationError('Stop before submit.');
assert.strictEqual(dangerousError.name, 'DangerousAutomationError');
assert.strictEqual(dangerousError.isDangerousAutomationError, true);
assert.match(dangerousError.message, /Dangerous automation error/);

const dryRunPage = new Proxy({}, {
  get() {
    throw new Error('dry-run should not access the page or click Add');
  }
});

async function run() {
  await saveOrPause(dryRunPage, 'dry-run');

  const lookupState = { entered: '', description: '', fills: [], amount: '' };
  const productInput = {
    waitFor: async () => {},
    fill: async (value) => {
      lookupState.entered = value;
      lookupState.fills.push(value);
    },
    press: async (key) => {
      assert.strictEqual(key, 'Tab');
      lookupState.description = lookupState.entered === '94000'
        ? 'Flying Fish Hamachi (Hamachi Yellowtail)'
        : lookupState.entered;
    }
  };
  const amountInput = {
    waitFor: async () => {},
    fill: async (value) => {
      lookupState.amount = value;
    }
  };
  const descriptionCell = {
    innerText: async () => lookupState.description
  };
  const row = {
    waitFor: async () => {},
    locator: (selector) => {
      if (selector.startsWith('input[name="scan_line_product_name_')) return productInput;
      if (selector.startsWith('input[name="scan_line_amount_')) return amountInput;
      if (selector === 'td.td_description') return descriptionCell;
      throw new Error(`Unexpected row selector: ${selector}`);
    }
  };
  const descriptionInput = {
    first: () => descriptionInput,
    waitFor: async () => {},
    fill: async () => {}
  };
  const fallbackPage = {
    locator: (selector) => selector.startsWith('#scan_line_tr_') ? row : descriptionInput
  };
  const expectedName = "Shinshi Yukata 2-Ten Set (Men's Casual Summer Kimono 2-Piece Set)";

  await fillInventoryCount(fallbackPage, {
    inventoryDescription: 'Inventory counting test',
    records: [{ product_code: '94000', product_name: expectedName, amount: '8' }]
  });
  assert.deepStrictEqual(lookupState.fills, ['94000', '', expectedName]);
  assert.strictEqual(lookupState.description, expectedName);
  assert.strictEqual(lookupState.amount, '8');

  let clicked = false;
  const unsafePage = {
    url: () => 'https://start.count-it.eu/en/products/unexpected',
    getByRole: () => ({
      click: async () => {
        clicked = true;
      }
    })
  };

  await assert.rejects(
    () => saveOrPause(unsafePage, 'full-auto'),
    (error) => error instanceof DangerousAutomationError && error.isDangerousAutomationError
  );
  assert.strictEqual(clicked, false);

  console.log('stock page tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
