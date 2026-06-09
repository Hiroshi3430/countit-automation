'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { chromium } = require('playwright');
const { login } = require('./auth');
const { readStockInput } = require('./input');
const { fillInventoryCount, openInventoryCountForm, saveOrPause } = require('./stockPage');
const { buildLogRecord, createCsvLogger, ensureRunDirs } = require('./logger');

function parseArgs(argv) {
  const args = {
    mode: 'dry-run',
    input: 'input/stock_input.csv',
    headed: true
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') args.input = argv[++i];
    else if (arg === '--mode') args.mode = argv[++i];
    else if (arg === '--headless') args.headed = false;
    else if (arg === '--headed') args.headed = true;
    else if (arg === '--slow-mo') args.slowMo = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['dry-run', 'semi-auto', 'full-auto'].includes(args.mode)) {
    throw new Error('--mode must be dry-run, semi-auto, or full-auto.');
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const input = await readStockInput(args.input);
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const { logPath, screenshotDir } = await ensureRunDirs(runId);
  const logger = await createCsvLogger(logPath);

  const browser = await chromium.launch({
    headless: !args.headed,
    slowMo: args.slowMo || 0
  });
  const page = await browser.newPage();

  try {
    await login(page);
    await openInventoryCountForm(page);
    await fillInventoryCount(page, input);
    await saveOrPause(page, args.mode);
    logger.append(buildLogRecord({
      mode: args.mode,
      status: 'SUCCESS',
      input: args.input,
      itemCount: input.records.length
    }));
  } catch (error) {
    const screenshot = path.join(screenshotDir, `stock-${Date.now()}.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    logger.append(buildLogRecord({
      mode: args.mode,
      status: 'ERROR',
      reason: error.message,
      input: args.input,
      itemCount: input.records.length,
      screenshot
    }));
    throw error;
  } finally {
    if (args.mode !== 'semi-auto') await browser.close();
    console.log(`Result log: ${logPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
