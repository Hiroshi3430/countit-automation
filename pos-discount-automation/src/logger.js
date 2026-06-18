'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const LOG_COLUMNS = [
  'Timestamp',
  'Row Number',
  'Product Code',
  'Expected Product Name',
  'Actual Product Name',
  'Mode',
  'Status',
  'Action',
  'Reason',
  'Discount Price',
  'Previous Price',
  'Previous Price Label',
  'Price Source',
  'Price Change',
  'New Start Date',
  'New Start Time',
  'New Start DateTime',
  'New End Date',
  'New End Time',
  'New End DateTime',
  'End Existing Date',
  'End Existing Time',
  'End Existing DateTime',
  'Existing Latest Discount Price',
  'Existing Latest Discount End Date',
  'Review Warnings',
  'Screenshot',
  'Memo'
];

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

async function ensureRunDirs(runId) {
  const runDir = path.resolve('runs', runId);
  const screenshotDir = path.join(runDir, 'screenshots');
  await fsp.mkdir(screenshotDir, { recursive: true });
  return {
    runDir,
    screenshotDir,
    logPath: path.join(runDir, 'result-log.csv')
  };
}

async function createCsvLogger(logPath) {
  await fsp.writeFile(logPath, `${LOG_COLUMNS.join(',')}\n`, 'utf8');

  return {
    append(record) {
      const line = LOG_COLUMNS.map((column) => csvEscape(record[column])).join(',');
      fs.appendFileSync(logPath, `${line}\n`, 'utf8');
    }
  };
}

function parsePriceLabel(value) {
  const label = String(value ?? '').trim();
  if (!label) return '';

  const match = label.match(/\d[\d.,]*/);
  if (!match) return '';

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
  if (!Number.isFinite(amount)) return '';
  return amount.toFixed(2);
}

function formatPriceForChange(value) {
  const amount = parsePriceLabel(value);
  if (!amount) return '';
  return `€${amount}`;
}

function buildPriceChange(previousPrice, discountPrice) {
  const previous = formatPriceForChange(previousPrice);
  const discount = formatPriceForChange(discountPrice);
  if (!previous || !discount) return '';
  return `${previous} -> ${discount}`;
}

function buildLogRecord({ row, mode, actualProductName, decision, status, reason, screenshot, priceInfo }) {
  const reviewWarnings = [
    ...(Array.isArray(decision.reviewWarnings) ? decision.reviewWarnings : []),
    ...(Array.isArray(priceInfo?.reviewWarnings) ? priceInfo.reviewWarnings : [])
  ];

  return {
    Timestamp: new Date().toISOString(),
    'Row Number': row.__rowNumber,
    'Product Code': row['Product Code'],
    'Expected Product Name': row['Expected Product Name'],
    'Actual Product Name': actualProductName || '',
    Mode: mode,
    Status: status || decision.status,
    Action: decision.action || '',
    Reason: reason || decision.reason || '',
    'Discount Price': row['Discount Price'],
    'Previous Price': priceInfo?.previousPrice || '',
    'Previous Price Label': priceInfo?.previousPriceLabel || '',
    'Price Source': priceInfo?.priceSource || '',
    'Price Change': buildPriceChange(priceInfo?.previousPrice, row['Discount Price']),
    'New Start Date': decision.newStartDate || '',
    'New Start Time': decision.newStartTime || '',
    'New Start DateTime': decision.newStartDateTime || '',
    'New End Date': decision.newEndDate || '',
    'New End Time': decision.newEndTime || '',
    'New End DateTime': decision.newEndDateTime || '',
    'End Existing Date': decision.endExistingDate || '',
    'End Existing Time': decision.endExistingTime || '',
    'End Existing DateTime': decision.endExistingDateTime || '',
    'Existing Latest Discount Price': decision.existingLatestDiscount?.price || '',
    'Existing Latest Discount End Date': decision.existingLatestDiscount?.endDate || '',
    'Review Warnings': reviewWarnings.join(' | '),
    Screenshot: screenshot || '',
    Memo: row.Memo || ''
  };
}

module.exports = {
  buildLogRecord,
  buildPriceChange,
  createCsvLogger,
  ensureRunDirs,
  parsePriceLabel
};
