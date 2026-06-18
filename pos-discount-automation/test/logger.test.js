'use strict';

const assert = require('assert');
const { buildLogRecord, buildPriceChange, parsePriceLabel } = require('../src/logger');

const row = {
  __rowNumber: 2,
  'Product Code': '12345',
  'Expected Product Name': 'Sample Product',
  'Discount Price': '2.5',
  Memo: ''
};

const decision = {
  status: 'READY',
  action: 'CREATE_NEW',
  reviewWarnings: []
};

const record = buildLogRecord({
  row,
  mode: 'dry-run',
  actualProductName: 'Sample Product',
  decision,
  status: 'SUCCESS',
  priceInfo: {
    previousPrice: '3.00',
    previousPriceLabel: '€ 3,00  (vAT included)',
    priceSource: 'regular_price',
    reviewWarnings: []
  }
});

assert.strictEqual(record['Previous Price'], '3.00');
assert.strictEqual(record['Previous Price Label'], '€ 3,00  (vAT included)');
assert.strictEqual(record['Price Source'], 'regular_price');
assert.strictEqual(record['Price Change'], '€3.00 -> €2.50');
assert.strictEqual(parsePriceLabel('€ 12,30  (vAT included)'), '12.30');
assert.strictEqual(parsePriceLabel('€12.30'), '12.30');
assert.strictEqual(parsePriceLabel('5,30'), '5.30');
assert.strictEqual(parsePriceLabel('5.3'), '5.30');
assert.strictEqual(parsePriceLabel(''), '');
assert.strictEqual(parsePriceLabel('VAT included'), '');
assert.strictEqual(buildPriceChange('€ 12,30  (vAT included)', '2.5'), '€12.30 -> €2.50');
assert.strictEqual(buildPriceChange('', '2'), '');

const warningRecord = buildLogRecord({
  row,
  mode: 'dry-run',
  actualProductName: 'Sample Product',
  decision,
  status: 'SUCCESS',
  priceInfo: {
    previousPrice: '',
    previousPriceLabel: '',
    priceSource: 'existing_discount_new_price',
    reviewWarnings: ['price_not_found']
  }
});

assert.strictEqual(warningRecord['Previous Price'], '');
assert.strictEqual(warningRecord['Previous Price Label'], '');
assert.strictEqual(warningRecord['Price Source'], 'existing_discount_new_price');
assert.strictEqual(warningRecord['Price Change'], '');
assert.strictEqual(warningRecord['Review Warnings'], 'price_not_found');

const skippedRecord = buildLogRecord({
  row,
  mode: 'dry-run',
  actualProductName: 'Sample Product',
  decision: {
    status: 'READY',
    action: 'SKIP_ALREADY_ACTIVE_SAME_PRICE',
    reason: 'already_active_same_price',
    existingLatestDiscount: {
      price: '€2.50',
      endDate: ''
    }
  },
  status: 'SKIPPED',
  priceInfo: {
    previousPrice: '2.50',
    previousPriceLabel: '€2.50',
    priceSource: 'existing_latest_discount_price',
    reviewWarnings: []
  }
});

assert.strictEqual(skippedRecord.Status, 'SKIPPED');
assert.strictEqual(skippedRecord.Action, 'SKIP_ALREADY_ACTIVE_SAME_PRICE');
assert.strictEqual(skippedRecord.Reason, 'already_active_same_price');
assert.strictEqual(skippedRecord['Existing Latest Discount Price'], '€2.50');
assert.strictEqual(skippedRecord['Existing Latest Discount End Date'], '');

console.log('logger tests passed');
