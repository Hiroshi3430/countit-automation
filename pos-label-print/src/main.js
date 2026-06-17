'use strict';

const path = require('path');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

const { chromium } = require('playwright');
const { loadCountItConfig, loginAndSelectCompany } = require('../../pos-common/auth');
const { parseArgs } = require('./args');
const { createRunId, writeResultLog } = require('./logger');
const {
  openStockCountForEdit,
  readTargetProductsFromStockCount,
  saveStockCountAndLeaveEdit
} = require('./stockCountPage');
const {
  addProductsToLabelPrint,
  assertLabelPrintNameAvailable,
  createLabelPrint,
  filterDuplicateLabelPrintItems,
  findFirstBlankLabelPrintRowNumber,
  LabelPrintAlreadyExistsError,
  openExistingLabelPrintForEdit,
  openPrintLabels,
  readExistingLabelPrintItems,
  saveLabelPrint
} = require('./labelPrintPage');

class SemiAutoCancelledError extends Error {
  constructor() {
    super('Semi-auto cancelled before final Save.');
    this.name = 'SemiAutoCancelledError';
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const runId = createRunId();
  const result = {
    runId,
    stockCountDescription: args.stockCountDescription,
    stockCountDescriptions: [args.stockCountDescription],
    labelPrintName: args.appendToLabelPrintName || args.labelPrintName || args.stockCountDescription,
    appendToLabelPrintName: args.appendToLabelPrintName || '',
    timestamp: new Date().toISOString(),
    mode: args.dryRun ? 'dry-run' : args.semiAuto ? 'semi-auto' : 'full-auto',
    dryRun: args.dryRun,
    semiAuto: args.semiAuto,
    status: 'STARTED',
    totalDetectedItems: 0,
    itemsUsedForLabelPrint: 0,
    detectedItems: [],
    labelPrintItems: [],
    existingLabelItems: [],
    addedItems: [],
    skippedItems: [],
    skippedDuplicateProductCodes: [],
    failedItems: []
  };

  const browser = await chromium.launch({
    headless: !args.headed,
    slowMo: args.slowMo || 0
  });
  const page = await browser.newPage();

  try {
    const config = loadCountItConfig('label');
    await loginAndSelectCompany(page, config);

    await openStockCountForEdit(page, args.stockCountDescription);
    try {
      const extracted = await readTargetProductsFromStockCount(page);
      result.detectedItems = extracted.detected;
      result.skippedItems = extracted.skipped;
    } finally {
      await saveStockCountAndLeaveEdit(page);
    }

    if (result.detectedItems.length === 0) {
      throw new Error('No target products found with Current stock <= 0.');
    }
    result.totalDetectedItems = result.detectedItems.length;
    result.labelPrintItems = args.limit === null
      ? result.detectedItems
      : result.detectedItems.slice(0, args.limit);
    result.itemsUsedForLabelPrint = result.labelPrintItems.length;

    console.log(`Detected ${result.detectedItems.length} products with Current stock <= 0.`);
    for (const item of result.detectedItems) {
      console.log(`- ${item.productCode}\t${item.description}\tcurrent=${item.currentStock}\tdiff=${item.difference}\tnew=${item.newStock}`);
    }

    if (args.dryRun) {
      result.status = 'DRY_RUN';
      console.log('Dry run: not creating Print labels file.');
      return;
    }

    await openPrintLabels(page);
    let startRowNumber = 1;

    if (args.appendToLabelPrintName) {
      await openExistingLabelPrintForEdit(page, args.appendToLabelPrintName);
      result.existingLabelItems = await readExistingLabelPrintItems(page);
      const dedupeResult = filterDuplicateLabelPrintItems(result.labelPrintItems, result.existingLabelItems);
      result.labelPrintItems = dedupeResult.uniqueItems;
      result.skippedDuplicateProductCodes = dedupeResult.skippedDuplicates;
      result.itemsUsedForLabelPrint = result.labelPrintItems.length;
      startRowNumber = await findFirstBlankLabelPrintRowNumber(page);
      console.log(`Append mode: ${result.existingLabelItems.length} existing items, ${result.skippedDuplicateProductCodes.length} duplicate products skipped, startRow=${startRowNumber}.`);
    } else {
      await assertLabelPrintNameAvailable(page, result.labelPrintName);
      await createLabelPrint(page, result.labelPrintName);
    }

    if (result.labelPrintItems.length === 0) {
      result.status = 'NO_NEW_LABEL_ITEMS';
      console.log('No non-duplicate products to add to Print labels file.');
      return;
    }

    console.log(`About to add ${result.labelPrintItems.length} of ${result.detectedItems.length} detected products to Print labels "${args.appendToLabelPrintName || result.labelPrintName}".`);
    const addResult = await addProductsToLabelPrint(page, result.labelPrintItems, { startRowNumber });
    result.addedItems = addResult.added;
    result.failedItems = addResult.failed;

    if (args.semiAuto) {
      result.status = 'SEMI_AUTO_READY';
      console.log('Semi-auto mode: products have been added. Review the browser. Press Enter to Save, or Ctrl+C to cancel.');
      await waitForEnter();
    }

    await saveLabelPrint(page);
    result.status = 'SUCCESS';
  } catch (error) {
    if (error instanceof LabelPrintAlreadyExistsError) result.status = 'DUPLICATE_LABEL_PRINT';
    else if (error instanceof SemiAutoCancelledError) result.status = 'SEMI_AUTO_CANCELLED';
    else result.status = 'ERROR';
    result.error = error.message;
    if (error.addedItems) result.addedItems = error.addedItems;
    if (error.failedItems) result.failedItems = error.failedItems;
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
    const logPath = await writeResultLog(result);
    console.log(`Result log: ${logPath}`);
  }
}

function waitForEnter() {
  return new Promise((resolve, reject) => {
    const onSigint = () => {
      process.stdin.pause();
      rejectOnce(new SemiAutoCancelledError());
    };
    const rejectOnce = (error) => {
      process.off('SIGINT', onSigint);
      reject(error);
    };
    const resolveOnce = () => {
      process.off('SIGINT', onSigint);
      resolve();
    };

    process.stdin.resume();
    process.once('SIGINT', onSigint);
    process.stdin.once('data', resolveOnce);
  });
}

main();
