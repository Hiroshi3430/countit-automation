'use strict';

const fs = require('fs/promises');
const path = require('path');

function createRunId(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function writeResultLog(record) {
  const logsDir = path.resolve(__dirname, '..', 'logs');
  await fs.mkdir(logsDir, { recursive: true });

  const logPath = path.join(logsDir, `${record.runId || createRunId()}.json`);
  await fs.writeFile(logPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return logPath;
}

module.exports = { createRunId, writeResultLog };
