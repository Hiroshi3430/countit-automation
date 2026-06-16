'use strict';

const assert = require('assert');
const {
  DangerousAutomationError,
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
