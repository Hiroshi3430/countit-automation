'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const LOG_COLUMNS = [
  'Timestamp',
  'Mode',
  'Status',
  'Reason',
  'Input',
  'Item Count',
  'Screenshot'
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

function buildLogRecord({ mode, status, reason, input, itemCount, screenshot }) {
  return {
    Timestamp: new Date().toISOString(),
    Mode: mode,
    Status: status,
    Reason: reason || '',
    Input: input,
    'Item Count': itemCount,
    Screenshot: screenshot || ''
  };
}

module.exports = { buildLogRecord, createCsvLogger, ensureRunDirs };
