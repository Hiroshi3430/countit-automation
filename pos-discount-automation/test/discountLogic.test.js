'use strict';

const assert = require('assert');
const { decideDiscountAction } = require('../src/discountLogic');

const baseRow = {
  'Product Code': '12345',
  'Expected Product Name': 'Marudaizu Shoyu Moromi No',
  'Discount Price': '2',
  'Start Mode': 'NOW',
  'Start Date': '',
  'End Date': '2026-12-31',
  'End Existing Discount': 'YES',
  Operation: '',
  Memo: ''
};

function decide(overrides = {}) {
  return decideDiscountAction({
    row: { ...baseRow, ...(overrides.row || {}) },
    actualProductName: overrides.actualProductName || baseRow['Expected Product Name'],
    existingDiscounts: overrides.existingDiscounts || [],
    today: overrides.today || '2026-06-05 12:00:00'
  });
}

const createNew = decide();
assert.strictEqual(createNew.status, 'READY');
assert.strictEqual(createNew.action, 'CREATE_NEW');
assert.strictEqual(createNew.newStartDate, '2026-06-05');
assert.strictEqual(createNew.newStartTime, '12:00');
assert.strictEqual(createNew.newStartDateTime, '2026-06-05 12:00:00');
assert.strictEqual(createNew.newEndDate, '2026-12-31');
assert.strictEqual(createNew.newEndTime, '23:59');
assert.strictEqual(createNew.newEndDateTime, '2026-12-31 23:59:00');
assert.strictEqual(createNew.endExistingDate, null);

const endedExistingOnly = decide({
  existingDiscounts: [{ rowIndex: 1, startDate: '2026-01-01 10:31:00', endDate: '2026-06-04 13:04:00', price: '3' }]
});
assert.strictEqual(endedExistingOnly.status, 'READY');
assert.strictEqual(endedExistingOnly.action, 'CREATE_NEW');

const endAndCreate = decide({
  existingDiscounts: [{ rowIndex: 7, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(endAndCreate.status, 'READY');
assert.strictEqual(endAndCreate.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(endAndCreate.endExistingDate, '2026-06-05');
assert.strictEqual(endAndCreate.existingDiscountToEnd.rowIndex, 7);

const endAndCreateWithNo = decide({
  row: { 'End Existing Discount': 'NO' },
  existingDiscounts: [{ rowIndex: 8, startDate: '2026-01-01 10:00:00', endDate: '-', price: '4' }]
});
assert.strictEqual(endAndCreateWithNo.status, 'READY');
assert.strictEqual(endAndCreateWithNo.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(endAndCreateWithNo.endExistingDate, '2026-06-05');
assert.strictEqual(endAndCreateWithNo.existingDiscountToEnd.rowIndex, 8);

const endAndCreateWithBlank = decide({
  row: { 'End Existing Discount': '' },
  existingDiscounts: [{ rowIndex: 9, startDate: '2026-01-01 10:00:00', endDate: '-', price: '5' }]
});
assert.strictEqual(endAndCreateWithBlank.status, 'READY');
assert.strictEqual(endAndCreateWithBlank.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(endAndCreateWithBlank.endExistingDate, '2026-06-05');

const endAndCreateWithIgnoredEndExistingValue = decide({
  row: { 'End Existing Discount': 'IGNORE-ME' },
  existingDiscounts: [{ rowIndex: 10, startDate: '2026-01-01 10:00:00', endDate: '-', price: '6' }]
});
assert.strictEqual(endAndCreateWithIgnoredEndExistingValue.status, 'READY');
assert.strictEqual(endAndCreateWithIgnoredEndExistingValue.action, 'END_EXISTING_AND_CREATE_NEW');

const futureStartEndAndCreate = decide({
  row: {
    'Start Mode': 'FUTURE',
    'Start Date': '2026-07-01'
  },
  existingDiscounts: [{ rowIndex: 7, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(futureStartEndAndCreate.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(futureStartEndAndCreate.newStartDate, '2026-07-01');
assert.strictEqual(futureStartEndAndCreate.newStartTime, '00:00');
assert.strictEqual(futureStartEndAndCreate.newStartDateTime, '2026-07-01 00:00:00');
assert.strictEqual(futureStartEndAndCreate.endExistingDate, '2026-07-01');
assert.strictEqual(futureStartEndAndCreate.endExistingTime, '00:00');
assert.strictEqual(futureStartEndAndCreate.endExistingDateTime, '2026-07-01 00:00:00');

const futureStartWithTime = decide({
  row: {
    'Start Mode': 'FUTURE',
    'Start Date': '2026-06-10 14:30'
  },
  existingDiscounts: [{ rowIndex: 7, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(futureStartWithTime.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(futureStartWithTime.newStartDate, '2026-06-10');
assert.strictEqual(futureStartWithTime.newStartTime, '14:30');
assert.strictEqual(futureStartWithTime.newStartDateTime, '2026-06-10 14:30:00');
assert.strictEqual(futureStartWithTime.endExistingDateTime, '2026-06-10 14:30:00');

const nowStartAndExistingEndDateTime = decide({
  today: '2026-06-07 18:15:00',
  existingDiscounts: [{ rowIndex: 7, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(nowStartAndExistingEndDateTime.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(nowStartAndExistingEndDateTime.newStartDate, '2026-06-07');
assert.strictEqual(nowStartAndExistingEndDateTime.newStartTime, '18:15');
assert.strictEqual(nowStartAndExistingEndDateTime.newStartDateTime, '2026-06-07 18:15:00');
assert.strictEqual(nowStartAndExistingEndDateTime.endExistingDate, '2026-06-07');
assert.strictEqual(nowStartAndExistingEndDateTime.endExistingTime, '18:15');
assert.strictEqual(nowStartAndExistingEndDateTime.endExistingDateTime, '2026-06-07 18:15:00');

const endDateOnly = decide({
  row: {
    'End Date': '2026-06-30'
  }
});
assert.strictEqual(endDateOnly.action, 'CREATE_NEW');
assert.strictEqual(endDateOnly.newEndDate, '2026-06-30');
assert.strictEqual(endDateOnly.newEndTime, '23:59');
assert.strictEqual(endDateOnly.newEndDateTime, '2026-06-30 23:59:00');

const endDateWithTime = decide({
  row: {
    'End Date': '2026-06-30 15:45'
  }
});
assert.strictEqual(endDateWithTime.action, 'CREATE_NEW');
assert.strictEqual(endDateWithTime.newEndDate, '2026-06-30');
assert.strictEqual(endDateWithTime.newEndTime, '15:45');
assert.strictEqual(endDateWithTime.newEndDateTime, '2026-06-30 15:45:00');

const endOnlyNow = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY'
  },
  today: '2026-06-07 18:15:00',
  existingDiscounts: [{ rowIndex: 4, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(endOnlyNow.status, 'READY');
assert.strictEqual(endOnlyNow.action, 'END_EXISTING_ONLY');
assert.strictEqual(endOnlyNow.endExistingDate, '2026-06-07');
assert.strictEqual(endOnlyNow.endExistingTime, '18:15');
assert.strictEqual(endOnlyNow.endExistingDateTime, '2026-06-07 18:15:00');
assert.strictEqual(endOnlyNow.newStartDate, null);
assert.strictEqual(endOnlyNow.newEndDate, null);
assert.strictEqual(endOnlyNow.existingDiscountToEnd.rowIndex, 4);

const endOnlyFutureDateOnly = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY',
    'Start Mode': 'FUTURE',
    'Start Date': '2026-06-10'
  },
  existingDiscounts: [{ rowIndex: 5, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(endOnlyFutureDateOnly.action, 'END_EXISTING_ONLY');
assert.strictEqual(endOnlyFutureDateOnly.endExistingDateTime, '2026-06-10 00:00:00');

const endOnlyFutureDateTime = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY',
    'Start Mode': 'FUTURE',
    'Start Date': '2026-06-10 14:30'
  },
  existingDiscounts: [{ rowIndex: 6, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' }]
});
assert.strictEqual(endOnlyFutureDateTime.action, 'END_EXISTING_ONLY');
assert.strictEqual(endOnlyFutureDateTime.endExistingDateTime, '2026-06-10 14:30:00');

const endOnlyNoActive = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY'
  },
  existingDiscounts: []
});
assert.strictEqual(endOnlyNoActive.status, 'NEED_REVIEW');
assert.strictEqual(endOnlyNoActive.reason, 'No active discount to end');

const endOnlyMultipleActive = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY'
  },
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' },
    { rowIndex: 2, startDate: '2026-01-02 10:00:00', endDate: '-', price: '4' }
  ]
});
assert.strictEqual(endOnlyMultipleActive.status, 'NEED_REVIEW');
assert.strictEqual(endOnlyMultipleActive.reason, 'Multiple active discounts found');

const endOnlyFutureReservation = decide({
  row: {
    'Discount Price': '',
    Operation: 'END_ONLY'
  },
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-05 13:00:00', endDate: '-', price: '3' }
  ]
});
assert.strictEqual(endOnlyFutureReservation.status, 'NEED_REVIEW');
assert.strictEqual(endOnlyFutureReservation.reason, 'Future discount reservation exists');

const oneOpenEndedAmongEnded = decide({
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-01 10:00:00', endDate: '2026-06-02 10:00:00', price: '10' },
    { rowIndex: 2, startDate: '2026-06-03 10:00:00', endDate: '2026-06-04 10:00:00', price: '12' },
    { rowIndex: 3, startDate: '2026-06-05 10:00:00', endDate: '-', price: '14' }
  ]
});
assert.strictEqual(oneOpenEndedAmongEnded.status, 'READY');
assert.strictEqual(oneOpenEndedAmongEnded.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(oneOpenEndedAmongEnded.existingDiscountToEnd.rowIndex, 3);

assert.strictEqual(decide({
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-01 10:00:00', endDate: '-', price: '10' },
    { rowIndex: 2, startDate: '2026-06-03 10:00:00', endDate: '', price: '12' }
  ]
}).status, 'NEED_REVIEW');

assert.strictEqual(decide({
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-05 13:00:00', endDate: '-', price: '10' }
  ]
}).status, 'NEED_REVIEW');

const allEnded = decide({
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-01 10:00:00', endDate: '2026-06-02 10:00:00', price: '10' },
    { rowIndex: 2, startDate: '2026-06-03 10:00:00', endDate: '2026-06-04 10:00:00', price: '12' }
  ]
});
assert.strictEqual(allEnded.status, 'READY');
assert.strictEqual(allEnded.action, 'CREATE_NEW');

const endedDiscountIgnoresLegacyActiveFlag = decide({
  existingDiscounts: [
    {
      rowIndex: 1,
      startDate: '2026-06-01 10:00:00',
      endDate: '2026-06-02 10:00:00',
      isActive: true,
      price: '10'
    }
  ]
});
assert.strictEqual(endedDiscountIgnoresLegacyActiveFlag.status, 'READY');
assert.strictEqual(endedDiscountIgnoresLegacyActiveFlag.action, 'CREATE_NEW');

const futureDiscountIgnoresLegacyInactiveFlag = decide({
  existingDiscounts: [
    {
      rowIndex: 1,
      startDate: '2026-06-05 13:00:00',
      endDate: '-',
      isFuture: false,
      price: '10'
    }
  ]
});
assert.strictEqual(futureDiscountIgnoresLegacyInactiveFlag.status, 'NEED_REVIEW');

const countItLocalStartedDiscount = decide({
  today: '2026-06-06 18:10:00',
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-06 16:29:00', endDate: '-', price: '10' }
  ]
});
assert.strictEqual(countItLocalStartedDiscount.status, 'READY');
assert.strictEqual(countItLocalStartedDiscount.action, 'END_EXISTING_AND_CREATE_NEW');
assert.strictEqual(countItLocalStartedDiscount.existingDiscountToEnd.rowIndex, 1);

const countItLocalFutureDiscount = decide({
  today: '2026-06-06 16:10:00',
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-06-06 16:29:00', endDate: '-', price: '10' }
  ]
});
assert.strictEqual(countItLocalFutureDiscount.status, 'NEED_REVIEW');

const manyEnded = decide({
  existingDiscounts: Array.from({ length: 10 }, (_, index) => ({
    rowIndex: index,
    startDate: '2026-06-01 10:00:00',
    endDate: '2026-06-02 10:00:00',
    price: String(index)
  }))
});
assert.strictEqual(manyEnded.status, 'READY');
assert.strictEqual(manyEnded.action, 'CREATE_NEW');
assert.strictEqual(manyEnded.reviewWarnings.length, 1);

assert.strictEqual(decide({
  existingDiscounts: [
    { rowIndex: 1, startDate: '2026-01-01 10:00:00', endDate: '-', price: '3' },
    { rowIndex: 2, startDate: '2026-02-01 10:00:00', endDate: '-', price: '4' }
  ]
}).status, 'NEED_REVIEW');

const noEndDate = decide({
  row: { 'End Date': '' }
});
assert.strictEqual(noEndDate.action, 'CREATE_NEW');
assert.strictEqual(noEndDate.newEndDate, null);

assert.strictEqual(decide({
  actualProductName: 'Different product'
}).status, 'NEED_REVIEW');

console.log('discountLogic tests passed');
