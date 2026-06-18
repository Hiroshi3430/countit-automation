'use strict';

const assert = require('assert');
const { buildPopupSamePriceSkipDecision } = require('../src/discountSkip');

const row = {
  'Discount Price': '9.4'
};

const endAndCreateDecision = {
  action: 'END_EXISTING_AND_CREATE_NEW',
  existingDiscountToEnd: {
    rowIndex: 1,
    endDate: ''
  }
};

const samePriceSkip = buildPopupSamePriceSkipDecision({
  row,
  decision: endAndCreateDecision,
  previousPriceLabel: '9.40'
});
assert.strictEqual(samePriceSkip.status, 'READY');
assert.strictEqual(samePriceSkip.action, 'SKIP_ALREADY_ACTIVE_SAME_PRICE');
assert.strictEqual(samePriceSkip.reason, 'already_active_same_price');
assert.strictEqual(samePriceSkip.existingLatestDiscount.price, '9.40');

assert.strictEqual(buildPopupSamePriceSkipDecision({
  row,
  decision: endAndCreateDecision,
  previousPriceLabel: '9,40'
}).action, 'SKIP_ALREADY_ACTIVE_SAME_PRICE');

assert.strictEqual(buildPopupSamePriceSkipDecision({
  row: { 'Discount Price': '9.40' },
  decision: endAndCreateDecision,
  previousPriceLabel: '9.4'
}).action, 'SKIP_ALREADY_ACTIVE_SAME_PRICE');

assert.strictEqual(buildPopupSamePriceSkipDecision({
  row,
  decision: endAndCreateDecision,
  previousPriceLabel: '8.99'
}), null);

assert.strictEqual(buildPopupSamePriceSkipDecision({
  row,
  decision: { action: 'END_EXISTING_ONLY' },
  previousPriceLabel: '9.40'
}), null);

console.log('discount skip tests passed');
