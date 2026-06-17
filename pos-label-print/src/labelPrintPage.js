'use strict';

const fs = require('fs/promises');
const path = require('path');
const { selectors } = require('./selectors');
const { normalizeText } = require('./logic');

class LabelPrintAlreadyExistsError extends Error {
  constructor(labelPrintName) {
    super(`Print labels file already exists: "${labelPrintName}". If a previous run failed mid-way, delete that file in CountIT before retrying.`);
    this.name = 'LabelPrintAlreadyExistsError';
    this.code = 'LABEL_PRINT_ALREADY_EXISTS';
  }
}

async function openPrintLabels(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  console.log(`labelPrint:beforeOpenUrl=${page.url()}`);

  const menuLink = page.getByRole('link', { name: selectors.labelPrint.menuLinkName });
  const menuVisible = await menuLink.first().isVisible().catch(() => false);
  console.log(`labelPrint:menuVisible=${menuVisible}`);

  if (menuVisible) {
    await menuLink.first().click();
  } else {
    await page.goto(selectors.labelPrint.overviewUrl);
  }

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await waitForPrintLabelsOverviewReady(page);
  console.log(`labelPrint:overviewUrl=${page.url()}`);
}

async function waitForPrintLabelsOverviewReady(page) {
  const addLink = page.getByRole('link', { name: selectors.labelPrint.addLinkName });
  const deadline = Date.now() + 15000;

  while (Date.now() < deadline) {
    const addVisible = await addLink.first().isVisible().catch(() => false);
    const tableVisible = await page.locator('table').first().isVisible().catch(() => false);
    if (addVisible) {
      console.log(`labelPrint:ready addLabelPrint=${addVisible} table=${tableVisible}`);
      return;
    }
    await page.waitForTimeout(250);
  }

  const tableVisible = await page.locator('table').first().isVisible().catch(() => false);
  throw new Error(`Print labels overview did not become ready: addLabelPrint=false table=${tableVisible} url=${page.url()}`);
}

async function assertLabelPrintNameAvailable(page, labelPrintName) {
  const existing = page.getByRole('cell', { name: labelPrintName, exact: true });
  if (await existing.first().isVisible().catch(() => false)) {
    throw new LabelPrintAlreadyExistsError(labelPrintName);
  }
}

async function openExistingLabelPrintForEdit(page, labelPrintName) {
  let matches = await findLabelPrintRowsByName(page, labelPrintName, 3000);
  if (matches.length === 0) {
    const searchInput = await findLabelPrintSearchInput(page);
    console.log('labelPrint:searchInput:found');
    await searchLabelPrintName(page, searchInput, labelPrintName);
    matches = await findLabelPrintRowsByName(page, labelPrintName, 10000);
  }

  console.log(`labelPrint:matchingRows=${matches.length}`);
  if (matches.length === 0) throw new Error(`Print labels file not found: "${labelPrintName}"`);
  if (matches.length > 1) throw new Error(`Multiple Print labels files found: "${labelPrintName}"`);

  await matches[0].click();
  await page.getByRole('link', { name: selectors.labelPrint.editLinkName }).click();
  await page.locator(selectors.labelPrint.lineProductInputFor(1)).waitFor({ state: 'visible', timeout: 10000 });
}

async function createLabelPrint(page, labelPrintName) {
  await page.getByRole('link', { name: selectors.labelPrint.addLinkName }).click();
  const nameInput = page.locator(selectors.labelPrint.nameInput);
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill(labelPrintName);
  await page.getByRole('button', { name: selectors.labelPrint.addButtonName }).click();
  await page.locator(selectors.labelPrint.lineProductInputFor(1)).waitFor({ state: 'visible', timeout: 10000 });
}

async function readExistingLabelPrintItems(page) {
  const rows = await readVisibleLabelPrintRows(page);
  const existingItems = [];
  const unknownRows = [];

  for (const row of rows) {
    if (!row.productInputValue && !row.description) continue;
    if (isReliableProductCode(row.productInputValue)) {
      existingItems.push({
        rowNumber: row.rowNumber,
        productCode: row.productInputValue,
        description: row.description
      });
      continue;
    }

    unknownRows.push(row);
  }

  if (unknownRows.length > 0) {
    const details = unknownRows
      .map((row) => `row=${row.rowNumber}, productInput="${row.productInputValue}", description="${row.description}"`)
      .join('; ');
    throw new Error(`Existing label print rows could not be read safely. Manual check required before append: ${details}`);
  }

  return existingItems;
}

async function addProductsToLabelPrint(page, items, options = {}) {
  const added = [];
  const failed = [];
  let rowNumber = options.startRowNumber || 1;

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    try {
      await addProductToLabelPrintRow(page, item, rowNumber);
      added.push({ ...item, amount: 1 });
      rowNumber += 1;
    } catch (error) {
      await logProductEntryFailure(page, item, rowNumber);
      failed.push({ ...item, amount: 1, reason: error.message });
      error.addedItems = added;
      error.failedItems = failed;
      throw error;
    }
  }

  return { added, failed };
}

async function findFirstBlankLabelPrintRowNumber(page) {
  const rows = await readVisibleLabelPrintRows(page);
  const blank = rows.find((row) => !row.productInputValue && !row.description);
  if (blank) return blank.rowNumber;

  const maxRowNumber = rows.reduce((max, row) => Math.max(max, row.rowNumber), 0);
  const nextRowNumber = maxRowNumber + 1;
  try {
    await page.locator(selectors.labelPrint.lineProductInputFor(nextRowNumber)).waitFor({ state: 'visible', timeout: 10000 });
  } catch (error) {
    throw new Error(`Could not find a blank row to append label print items. Last visible row: ${maxRowNumber}. CountIT may not have rendered a new blank row.`);
  }
  return nextRowNumber;
}

function filterDuplicateLabelPrintItems(items, existingItems) {
  const existingCodes = new Set(existingItems.map((item) => item.productCode));
  const usedCodes = new Set();
  const uniqueItems = [];
  const skippedDuplicates = [];

  for (const item of items) {
    const productCode = normalizeText(item.productCode);
    if (existingCodes.has(productCode) || usedCodes.has(productCode)) {
      skippedDuplicates.push({ ...item, reason: 'duplicate productCode' });
      continue;
    }

    usedCodes.add(productCode);
    uniqueItems.push(item);
  }

  return { uniqueItems, skippedDuplicates };
}

async function addProductToLabelPrintRow(page, item, rowNumber) {
  const productCode = normalizeText(item.productCode);
  if (!productCode) throw new Error(`Product code missing for label print row ${rowNumber}`);

  const productInput = page.locator(selectors.labelPrint.lineProductInputFor(rowNumber));
  await productInput.waitFor({ state: 'visible', timeout: 10000 });
  await productInput.click();
  await productInput.fill(productCode);

  await selectProductForLabelPrintRow(page, productInput, item, rowNumber);

  const amountInput = page.locator(selectors.labelPrint.lineAmountInputFor(rowNumber));
  await waitForEditableAmountInput(page, amountInput, item, rowNumber);
  await amountInput.fill('1');
  await amountInput.press('Tab');
}

async function selectProductForLabelPrintRow(page, productInput, item, rowNumber) {
  await page.waitForTimeout(500);

  await productInput.press('ArrowDown');
  await productInput.press('Enter');
  if (await waitForProductSelection(page, item, rowNumber, 5000)) return;

  await productInput.press('Tab');
  if (await waitForProductSelection(page, item, rowNumber, 5000)) return;

  throw new Error(`Autocomplete result not found: row=${rowNumber}, productCode=${item.productCode}, description="${item.description}"`);
}

async function waitForProductSelection(page, item, rowNumber, timeout) {
  const deadline = Date.now() + timeout;
  const descriptionCell = page.locator(selectors.labelPrint.lineDescriptionCellFor(rowNumber));

  while (Date.now() < deadline) {
    const text = normalizeText(await descriptionCell.innerText().catch(() => ''));
    if (text && approximatelyMatchesDescription(text, item.description)) return true;
    await page.waitForTimeout(250);
  }

  return false;
}

function approximatelyMatchesDescription(actual, expected) {
  const actualText = normalizeText(actual);
  const expectedText = normalizeText(expected);
  if (!actualText) return false;
  if (!expectedText) return true;
  if (actualText === expectedText) return true;
  if (actualText.includes(expectedText) || expectedText.includes(actualText)) return true;

  const prefixLength = Math.min(24, actualText.length, expectedText.length);
  return prefixLength >= 8 && actualText.slice(0, prefixLength) === expectedText.slice(0, prefixLength);
}

async function waitForEditableAmountInput(page, amountInput, item, rowNumber) {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    if (await amountInput.isVisible().catch(() => false)) {
      const editable = await amountInput.isEditable().catch(() => false);
      if (editable) return;
    }
    await page.waitForTimeout(250);
  }

  const amountVisible = await amountInput.isVisible().catch(() => false);
  const amountEditable = await amountInput.isEditable().catch(() => false);
  throw new Error(`Amount input not editable after product selection: row=${rowNumber}, productCode=${item.productCode}, amountVisible=${amountVisible}, amountEditable=${amountEditable}`);
}

async function logProductEntryFailure(page, item, rowNumber, extra = {}) {
  const productInput = page.locator(selectors.labelPrint.lineProductInputFor(rowNumber));
  const inputValue = normalizeText(await productInput.inputValue().catch(() => ''));
  const rowDescription = normalizeText(await page.locator(selectors.labelPrint.lineDescriptionCellFor(rowNumber)).innerText().catch(() => ''));
  const screenshot = await saveDebugScreenshot(page, rowNumber, item.productCode);
  console.log(`labelPrint:autocompleteFailure row=${rowNumber} productCode=${item.productCode} inputValue="${inputValue}" rowDescription="${rowDescription}" amountVisible=${extra.amountVisible ?? ''} amountEditable=${extra.amountEditable ?? ''} screenshot=${screenshot}`);
}

async function saveDebugScreenshot(page, rowNumber, productCode) {
  const debugDir = path.resolve(__dirname, '..', 'debug');
  await fs.mkdir(debugDir, { recursive: true });
  const safeCode = String(productCode || 'unknown').replace(/[^A-Za-z0-9_-]/g, '_');
  const screenshotPath = path.join(debugDir, `autocomplete-row-${rowNumber}-${safeCode}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  return screenshotPath;
}

async function saveLabelPrint(page) {
  const saveButton = page.getByRole('button', { name: selectors.labelPrint.saveButtonName });
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await saveButton.click();

  try {
    await page.getByRole('link', { name: selectors.labelPrint.addLinkName }).waitFor({ state: 'visible', timeout: 15000 });
  } catch (error) {
    throw new Error(`Save failed or did not return to Print labels list: ${error.message}`);
  }
}

async function findLabelPrintSearchInput(page) {
  for (const selector of selectors.labelPrint.searchInputCandidates) {
    const locators = page.locator(selector);
    const count = await locators.count();

    for (let i = 0; i < count; i += 1) {
      const locator = locators.nth(i);
      try {
        await locator.waitFor({ state: 'visible', timeout: 1000 });
        if (!(await locator.isEditable())) continue;
        return locator;
      } catch (_) {
        // Try next search input candidate.
      }
    }
  }

  throw new Error(`Print labels search input was not found: ${selectors.labelPrint.searchInputCandidates.join(', ')}`);
}

async function searchLabelPrintName(page, searchInput, labelPrintName) {
  await searchInput.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(labelPrintName);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  console.log(`labelPrint:searchSubmitted="${labelPrintName}"`);
}

async function findLabelPrintRowsByName(page, labelPrintName, timeout) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const matches = await findVisibleLabelPrintRowsByName(page, labelPrintName);
    if (matches.length > 0) return matches;
    await page.waitForTimeout(250);
  }

  return findVisibleLabelPrintRowsByName(page, labelPrintName);
}

async function findVisibleLabelPrintRowsByName(page, labelPrintName) {
  const rows = page.locator(selectors.labelPrint.resultRows.join(', '));
  const count = await rows.count();
  const matches = [];

  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    if (await rowHasExactCellText(row, labelPrintName)) matches.push(row);
  }

  return matches;
}

async function rowHasExactCellText(row, expectedText) {
  const cells = row.locator('td');
  const count = await cells.count();

  for (let i = 0; i < count; i += 1) {
    const text = normalizeText(await cells.nth(i).innerText().catch(() => ''));
    if (text === expectedText) return true;
  }

  return false;
}

async function readVisibleLabelPrintRows(page) {
  const inputs = page.locator(selectors.labelPrint.lineProductInput);
  const count = await inputs.count();
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const input = inputs.nth(i);
    if (!(await input.isVisible().catch(() => false))) continue;

    const name = await input.getAttribute('name').catch(() => '');
    const match = String(name || '').match(/scan_line_product_name_(\d+)/);
    if (!match) continue;

    const rowNumber = Number(match[1]);
    const productInputValue = normalizeText(await input.inputValue().catch(() => ''));
    const description = normalizeText(await page.locator(selectors.labelPrint.lineDescriptionCellFor(rowNumber)).innerText().catch(() => ''));
    rows.push({ rowNumber, productInputValue, description });
  }

  rows.sort((a, b) => a.rowNumber - b.rowNumber);
  return rows;
}

function isReliableProductCode(value) {
  return /^[A-Za-z0-9_-]+$/.test(normalizeText(value));
}

module.exports = {
  addProductsToLabelPrint,
  assertLabelPrintNameAvailable,
  createLabelPrint,
  filterDuplicateLabelPrintItems,
  findFirstBlankLabelPrintRowNumber,
  LabelPrintAlreadyExistsError,
  openPrintLabels,
  openExistingLabelPrintForEdit,
  readExistingLabelPrintItems,
  saveLabelPrint
};
