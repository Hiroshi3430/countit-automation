'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { chromium } = require('playwright');
const { selectors } = require('./selectors');
const { login } = require('./auth');
const { decideDiscountAction } = require('./discountLogic');
const { searchProduct } = require('./productSearch');
const {
  DangerousAutomationError,
  fillNewDiscount,
  readExistingDiscountNewPrice,
  readExistingDiscounts,
  saveOrPause,
  setExistingDiscountEndDate
} = require('./discountPage');
const { readInput } = require('./input');
const { buildLogRecord, createCsvLogger, ensureRunDirs, parsePriceLabel } = require('./logger');

function parseArgs(argv) {
  const args = {
    mode: 'dry-run',
    input: 'input/discount_input.tsv',
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

async function processRow({ page, row, mode, logger, screenshotDir }) {
  let actualProductName = '';
  let decision = { status: 'ERROR', action: 'SKIP' };
  let priceInfo = null;

  try {
    const product = await searchProduct(page, row['Product Code']);
    actualProductName = product.actualProductName;

    const existingDiscounts = await readExistingDiscounts(page);
    decision = decideDiscountAction({ row, actualProductName, existingDiscounts });

    if (decision.status === 'NEED_REVIEW') {
      logger.append(buildLogRecord({ row, mode, actualProductName, decision }));
      return;
    }

    if (['END_EXISTING_AND_CREATE_NEW', 'END_EXISTING_ONLY'].includes(decision.action)) {
      const activeDiscount = decision.existingDiscountToEnd;
      if (mode === 'dry-run') {
        const previousPrice = await readExistingDiscountNewPrice(page, activeDiscount);
        priceInfo = buildPriceInfo({
          previousPrice,
          priceSource: 'existing_discount_new_price'
        });
      } else {
        const previousPrice = await setExistingDiscountEndDate(
          page,
          activeDiscount,
          decision.endExistingDate,
          decision.endExistingTime
        );
        priceInfo = buildPriceInfo({
          previousPrice,
          priceSource: 'existing_discount_new_price'
        });
        await saveOrPause(page, mode, selectors.discounts.saveButtonName);
      }
    } else if (decision.action === 'CREATE_NEW') {
      priceInfo = buildPriceInfo({
        previousPrice: product.regularPrice,
        priceSource: 'regular_price'
      });
    }

    if (mode !== 'dry-run' && decision.action !== 'END_EXISTING_ONLY') {
      await fillNewDiscount(page, row, decision);
      await saveOrPause(page, mode, selectors.discounts.addButtonName);
    }

    logger.append(buildLogRecord({ row, mode, actualProductName, decision, status: 'SUCCESS', priceInfo }));
  } catch (error) {
    const screenshot = path.join(screenshotDir, `row-${row.__rowNumber}-${Date.now()}.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    logger.append(buildLogRecord({
      row,
      mode,
      actualProductName,
      decision,
      status: 'ERROR',
      reason: error.message,
      screenshot,
      priceInfo
    }));
    if (error instanceof DangerousAutomationError || error.isDangerousAutomationError) {
      throw error;
    }
  }
}

function buildPriceInfo({ previousPrice, priceSource }) {
  const previousPriceLabel = String(previousPrice || '').trim();
  const parsedPreviousPrice = parsePriceLabel(previousPriceLabel);
  const reviewWarnings = [];
  if (!previousPriceLabel) reviewWarnings.push('price_not_found');
  else if (!parsedPreviousPrice) reviewWarnings.push('price_parse_failed');

  return {
    previousPrice: parsedPreviousPrice,
    previousPriceLabel,
    priceSource,
    reviewWarnings
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const rows = await readInput(args.input);
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
    for (const row of rows) {
      await processRow({ page, row, mode: args.mode, logger, screenshotDir });
    }
  } finally {
    if (args.mode !== 'semi-auto') await browser.close();
    console.log(`Result log: ${logPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
