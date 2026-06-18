'use strict';

const { pricesMatch } = require('./discountLogic');

function buildPopupSamePriceSkipDecision({ row, decision, previousPriceLabel }) {
  if (decision.action !== 'END_EXISTING_AND_CREATE_NEW') return null;
  if (!pricesMatch(previousPriceLabel, row['Discount Price'])) return null;

  const matchedDiscount = decision.existingDiscountToEnd || {};
  return {
    status: 'READY',
    action: 'SKIP_ALREADY_ACTIVE_SAME_PRICE',
    reason: 'already_active_same_price',
    message: 'Existing active discount popup New price has the same price.',
    // Kept for logger compatibility; this is the matched active discount popup price.
    existingLatestDiscount: {
      price: previousPriceLabel || '',
      endDate: matchedDiscount.endDate ?? matchedDiscount.till ?? ''
    }
  };
}

module.exports = {
  buildPopupSamePriceSkipDecision
};
