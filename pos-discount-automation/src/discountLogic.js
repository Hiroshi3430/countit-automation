'use strict';

const REQUIRED_COLUMNS = [
  'Product Code',
  'Expected Product Name',
  'Discount Price',
  'Start Mode',
  'Start Date',
  'End Date',
  'Operation',
  'Memo'
];

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function namesMatch(actualName, expectedName) {
  return normalizeText(actualName) === normalizeText(expectedName);
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function parseIsoDate(value) {
  const text = String(value || '').trim();
  if (!text || text === '-') return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const euMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD or DD/MM/YYYY.`);
}

function parseDateTimeParts(value, defaultTime = '00:00') {
  const text = String(value || '').trim();
  if (!text || text === '-') return null;
  const [defaultHour = '00', defaultMinute = '00'] = defaultTime.split(':');

  const isoDateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (isoDateTime) {
    const [, year, month, day, hour = defaultHour, minute = defaultMinute, second = '0'] = isoDateTime;
    return buildDateTimeParts(year, month, day, hour, minute, second);
  }

  const euDateTime = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (euDateTime) {
    const [, day, month, year, hour = defaultHour, minute = defaultMinute, second = '0'] = euDateTime;
    return buildDateTimeParts(year, month, day, hour, minute, second);
  }

  throw new Error(`Invalid date: "${value}". Use YYYY-MM-DD or DD/MM/YYYY.`);
}

function buildDateTimeParts(year, month, day, hour, minute, second) {
  const date = `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`;
  const time = `${pad2(hour)}:${pad2(minute)}`;
  return {
    date,
    time,
    dateTime: `${date} ${time}:${pad2(second)}`,
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second)
  };
}

function parseDateTime(value) {
  const parts = parseDateTimeParts(value);
  if (!parts) return null;
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function parseReferenceDateTime(value) {
  if (value instanceof Date) return value;
  return parseDateTime(value);
}

function normalizePrice(value) {
  const text = String(value ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (!text) return null;

  const match = text.match(/\d[\d.,]*/);
  if (!match) return null;

  let numericText = match[0];
  const lastComma = numericText.lastIndexOf(',');
  const lastDot = numericText.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    numericText = numericText.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
    if (decimalSeparator === ',') numericText = numericText.replace(',', '.');
  } else if (lastComma !== -1) {
    numericText = numericText.replace(',', '.');
  }

  const amount = Number(numericText);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function pricesMatch(left, right) {
  const leftPrice = normalizePrice(left);
  const rightPrice = normalizePrice(right);
  if (leftPrice === null || rightPrice === null) return false;
  return Math.abs(leftPrice - rightPrice) < 0.005;
}

function todayIso(date = new Date()) {
  if (date instanceof Date) return formatLocalIsoDate(date);
  return formatLocalIsoDate(parseDateTime(date));
}

function formatLocalIsoDate(date) {
  return localDateTimeParts(date).date;
}

function localDateTimeParts(date = new Date()) {
  return buildDateTimeParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

function getNewStartDate(row, today = new Date()) {
  return getNewStartDateTime(row, today).date;
}

function getNewStartDateTime(row, today = new Date()) {
  const mode = normalizeText(row['Start Mode']).toUpperCase();
  if (mode === 'NOW') return localDateTimeParts(parseReferenceDateTime(today));
  if (mode === 'FUTURE') return parseDateTimeParts(row['Start Date'], '00:00');
  throw new Error(`Invalid Start Mode: "${row['Start Mode']}". Use NOW or FUTURE.`);
}

function getNewEndDateTime(row) {
  return parseDateTimeParts(row['End Date'], '23:59');
}

function getOperation(row) {
  const operation = normalizeText(row.Operation).toUpperCase();
  return operation || 'CREATE_OR_REPLACE';
}

function validateRow(row) {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in row));
  if (missing.length) {
    return { ok: false, reason: `Missing columns: ${missing.join(', ')}` };
  }

  const operation = getOperation(row);
  if (!['CREATE_OR_REPLACE', 'END_ONLY'].includes(operation)) {
    return { ok: false, reason: 'Operation must be empty, CREATE_OR_REPLACE, or END_ONLY' };
  }

  if (!String(row['Product Code'] || '').trim()) {
    return { ok: false, reason: 'Product Code is empty' };
  }
  if (!String(row['Expected Product Name'] || '').trim()) {
    return { ok: false, reason: 'Expected Product Name is empty' };
  }
  if (operation !== 'END_ONLY' && !String(row['Discount Price'] || '').trim()) {
    return { ok: false, reason: 'Discount Price is empty' };
  }

  const mode = normalizeText(row['Start Mode']).toUpperCase();
  if (!['NOW', 'FUTURE'].includes(mode)) {
    return { ok: false, reason: 'Start Mode must be NOW or FUTURE' };
  }
  try {
    if (mode === 'FUTURE' && !parseDateTimeParts(row['Start Date'], '00:00')) {
      return { ok: false, reason: 'Start Date is required when Start Mode is FUTURE' };
    }
    parseDateTimeParts(row['End Date'], '23:59');
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true };
}

function isOpenEndedDiscount(discount) {
  const tillText = String(discount.till ?? discount.endDate ?? '').trim();
  return !tillText || tillText === '-';
}

function isActiveDiscount(discount, today = new Date()) {
  if (!isOpenEndedDiscount(discount)) return false;

  const startDate = parseDateTime(discount.from ?? discount.startDate);
  const referenceDate = parseReferenceDateTime(today);
  return !startDate || startDate <= referenceDate;
}

function isFutureDiscount(discount, today = new Date()) {
  if (!isOpenEndedDiscount(discount)) return false;

  const startDate = parseDateTime(discount.from ?? discount.startDate);
  const referenceDate = parseReferenceDateTime(today);
  return Boolean(startDate && startDate > referenceDate);
}

function decideDiscountAction({ row, actualProductName, existingDiscounts, today = new Date() }) {
  const rowValidation = validateRow(row);
  if (!rowValidation.ok) {
    return needReview(rowValidation.reason);
  }

  if (!namesMatch(actualProductName, row['Expected Product Name'])) {
    return needReview(`Product name mismatch. Expected "${row['Expected Product Name']}", found "${actualProductName}".`);
  }

  const operation = getOperation(row);
  const activeDiscounts = existingDiscounts.filter((discount) => isActiveDiscount(discount, today));
  const futureDiscounts = existingDiscounts.filter((discount) => isFutureDiscount(discount, today));
  const endedDiscounts = existingDiscounts.filter((discount) => (
    !isOpenEndedDiscount(discount) && !isActiveDiscount(discount, today) && !isFutureDiscount(discount, today)
  ));
  const reviewWarnings = [];
  if (endedDiscounts.length >= 10) {
    reviewWarnings.push(`Ended discounts count is high (${endedDiscounts.length}).`);
  }
  const newStart = getNewStartDateTime(row, today);
  const newEnd = getNewEndDateTime(row);

  if (futureDiscounts.length > 0) {
    return needReview(operation === 'END_ONLY' ? 'Future discount reservation exists' : 'Future discount already exists.');
  }
  if (activeDiscounts.length > 1) {
    return needReview(operation === 'END_ONLY' ? 'Multiple active discounts found' : `Multiple active discounts exist (${activeDiscounts.length}).`);
  }

  if (operation === 'END_ONLY') {
    if (activeDiscounts.length === 0) {
      return needReview('No active discount to end');
    }

    return {
      status: 'READY',
      action: 'END_EXISTING_ONLY',
      newStartDate: null,
      newStartTime: null,
      newStartDateTime: null,
      newEndDate: null,
      newEndTime: null,
      newEndDateTime: null,
      endExistingDate: newStart.date,
      endExistingTime: newStart.time,
      endExistingDateTime: newStart.dateTime,
      existingDiscountToEnd: activeDiscounts[0],
      reviewWarnings
    };
  }

  if (activeDiscounts.length === 0) {
    return {
      status: 'READY',
      action: 'CREATE_NEW',
      newStartDate: newStart.date,
      newStartTime: newStart.time,
      newStartDateTime: newStart.dateTime,
      newEndDate: newEnd ? newEnd.date : null,
      newEndTime: newEnd ? newEnd.time : null,
      newEndDateTime: newEnd ? newEnd.dateTime : null,
      endExistingDate: null,
      endExistingTime: null,
      endExistingDateTime: null,
      reviewWarnings
    };
  }

  return {
    status: 'READY',
    action: 'END_EXISTING_AND_CREATE_NEW',
    newStartDate: newStart.date,
    newStartTime: newStart.time,
    newStartDateTime: newStart.dateTime,
    newEndDate: newEnd ? newEnd.date : null,
    newEndTime: newEnd ? newEnd.time : null,
    newEndDateTime: newEnd ? newEnd.dateTime : null,
    endExistingDate: newStart.date,
    endExistingTime: newStart.time,
    endExistingDateTime: newStart.dateTime,
    existingDiscountToEnd: activeDiscounts[0],
    reviewWarnings
  };
}

function needReview(reason) {
  return {
    status: 'NEED_REVIEW',
    action: 'SKIP',
    reason
  };
}

module.exports = {
  REQUIRED_COLUMNS,
  decideDiscountAction,
  getNewStartDate,
  getNewStartDateTime,
  namesMatch,
  parseDateTime,
  parseDateTimeParts,
  normalizePrice,
  normalizeText,
  parseIsoDate,
  pricesMatch,
  todayIso,
  validateRow
};
