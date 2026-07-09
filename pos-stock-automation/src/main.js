'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { chromium } = require('playwright');
const { login } = require('./auth');
const { collectBatchStockInputFiles, readStockInput } = require('./input');
const { fillInventoryCount, openInventoryCountForm, saveOrPause } = require('./stockPage');
const { buildLogRecord, createCsvLogger, ensureRunDirs } = require('./logger');

function parseArgs(argv) {
  const args = {
    mode: 'dry-run',
    input: 'input/stock_input.tsv',
    inputDir: null,
    headed: true
  };
  let inputExplicit = false;

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') {
      args.input = argv[++i];
      inputExplicit = true;
    }
    else if (arg === '--input-dir') args.inputDir = argv[++i];
    else if (arg === '--mode') args.mode = argv[++i];
    else if (arg === '--headless') args.headed = false;
    else if (arg === '--headed') args.headed = true;
    else if (arg === '--slow-mo') args.slowMo = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!['dry-run', 'semi-auto', 'full-auto'].includes(args.mode)) {
    throw new Error('--mode must be dry-run, semi-auto, or full-auto.');
  }

  if (args.inputDir && inputExplicit) {
    throw new Error('--input and --input-dir cannot be used together.');
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPaths = args.inputDir ? await collectBatchStockInputFiles(args.inputDir) : [args.input];
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const { logPath, screenshotDir } = await ensureRunDirs(runId);
  const logger = await createCsvLogger(logPath);
  let currentInputPath = '';
  let currentInput = null;

  const browser = await chromium.launch({
    headless: !args.headed,
    slowMo: args.slowMo || 0
  });
  const page = await browser.newPage();

  try {
    await login(page);

    for (const inputPath of inputPaths) {
      currentInputPath = inputPath;
      currentInput = null;
      currentInput = await readStockInput(inputPath);

      await openInventoryCountForm(page);
      await fillInventoryCount(page, currentInput);
      await saveOrPause(page, args.mode);
      logger.append(buildLogRecord({
        mode: args.mode,
        status: 'SUCCESS',
        input: inputPath,
        itemCount: currentInput.records.length
      }));
    }
  } catch (error) {
    const screenshot = path.join(screenshotDir, `stock-${Date.now()}.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    logger.append(buildLogRecord({
      mode: args.mode,
      status: 'ERROR',
      reason: error.message,
      input: currentInputPath || (args.inputDir || args.input),
      itemCount: currentInput ? currentInput.records.length : 0,
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
