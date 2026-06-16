'use strict';

const { selectors } = require('./selectors');
const {
  dedupeByProductCode,
  normalizeText,
  parseCountItNumber,
  shouldPrintLabel
} = require('./logic');

async function openStockCountForEdit(page, stockCountDescription) {
  await openStockCountsOverview(page);

  let matches = await findStockCountRowsByDescription(page, stockCountDescription, 3000);
  if (matches.length === 0) {
    const searchInput = await findStockCountSearchInput(page);
    console.log('stockCounts:searchInput:found');
    await searchStockCountDescription(page, searchInput, stockCountDescription);
    matches = await findStockCountRowsByDescription(page, stockCountDescription, 10000);
  }

  console.log(`stockCounts:matchingRows=${matches.length}`);
  if (matches.length === 0) throw new Error(`Stock count not found: ${stockCountDescription}`);
  if (matches.length > 1) throw new Error(`Multiple stock counts found: ${stockCountDescription}`);

  await matches[0].click();
  await page.getByRole('link', { name: selectors.stockCounts.editLinkName }).click();
  await page.locator(selectors.stockCounts.nameInput).waitFor({ state: 'visible', timeout: 10000 });
}

async function openStockCountsOverview(page) {
  await page.goto(selectors.stockCounts.overviewUrl);
  await page.waitForLoadState('domcontentloaded').catch(() => {});

  let state = await readStockCountsOverviewState(page);
  if (!isReadyStockCountsOverviewState(state)) {
    await page.getByRole('link', { name: selectors.stockCounts.menuLinkName }).click();
    state = await waitForStockCountsOverviewReady(page);
  }

  console.log(`stockCounts:currentUrl=${page.url()}`);
  console.log(`stockCounts:ready addInventory=${state.addInventoryVisible} table=${state.tableVisible} header=${state.headerVisible}`);
}

async function waitForStockCountsOverviewReady(page) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const state = await readStockCountsOverviewState(page);
    if (isReadyStockCountsOverviewState(state)) return state;
    await page.waitForTimeout(250);
  }

  const state = await readStockCountsOverviewState(page);
  throw new Error(`Stock counts overview did not become ready: ${JSON.stringify(state)}`);
}

function isReadyStockCountsOverviewState(state) {
  return state.addInventoryVisible || state.tableVisible;
}

async function readStockCountsOverviewState(page) {
  const addInventoryVisible = await page.getByRole('link', { name: selectors.stockCounts.addInventoryLinkName })
    .first().isVisible().catch(() => false);
  const tableVisible = await page.locator('table').first().isVisible().catch(() => false);
  const headerVisible = await page.getByRole('heading', { name: /stock counts/i }).first().isVisible().catch(() => false);

  return { addInventoryVisible, tableVisible, headerVisible };
}

async function findStockCountSearchInput(page) {
  for (const selector of selectors.stockCounts.searchInputCandidates) {
    const locators = page.locator(selector);
    const count = await locators.count();

    for (let i = 0; i < count; i += 1) {
      const locator = locators.nth(i);
      try {
        await locator.waitFor({ state: 'visible', timeout: 1000 });
        if (!(await locator.isEditable())) continue;
        return locator;
      } catch (_) {
        // Try the next search input candidate.
      }
    }
  }

  throw new Error(`Stock counts search input was not found: ${selectors.stockCounts.searchInputCandidates.join(', ')}`);
}

async function searchStockCountDescription(page, searchInput, stockCountDescription) {
  await searchInput.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(stockCountDescription);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500);
  console.log(`stockCounts:searchSubmitted="${stockCountDescription}"`);
}

async function findStockCountRowsByDescription(page, stockCountDescription, timeout) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const matches = await findVisibleRowsByDescription(page, stockCountDescription);
    if (matches.length > 0) return matches;
    await page.waitForTimeout(250);
  }

  return findVisibleRowsByDescription(page, stockCountDescription);
}

async function findVisibleRowsByDescription(page, stockCountDescription) {
  const rows = page.locator(selectors.stockCounts.resultRows.join(', '));
  const count = await rows.count();
  const matches = [];

  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    if (!(await row.isVisible().catch(() => false))) continue;
    if (await rowHasExactDescription(row, stockCountDescription)) matches.push(row);
  }

  return matches;
}

async function rowHasExactDescription(row, stockCountDescription) {
  const cells = row.locator('td');
  const count = await cells.count();

  for (let i = 0; i < count; i += 1) {
    const text = normalizeText(await cells.nth(i).innerText().catch(() => ''));
    if (text === stockCountDescription) return true;
  }

  return false;
}

async function readTargetProductsFromStockCount(page) {
  const table = await findLineTable(page);
  const columnIndexes = await readColumnIndexes(table);
  const rows = table.locator(`tbody tr:has(${selectors.stockCounts.lineProductInput})`);
  const rowCount = await rows.count();
  const detected = [];
  const skipped = [];

  for (let i = 0; i < rowCount; i += 1) {
    const row = rows.nth(i);
    const productInput = row.locator(selectors.stockCounts.lineProductInput).first();
    const productCode = normalizeText(await productInput.inputValue().catch(() => ''));
    if (!productCode) {
      skipped.push({ row: i + 1, reason: 'product code missing' });
      continue;
    }

    const item = await readStockCountRow(row, columnIndexes, productCode, i + 1);
    if (shouldPrintLabel(item.currentStock)) detected.push(item);
  }

  const { deduped, duplicates } = dedupeByProductCode(detected);
  for (const duplicate of duplicates) {
    skipped.push({ ...duplicate, reason: 'duplicate productCode' });
  }

  return { detected: deduped, skipped };
}

async function saveStockCountAndLeaveEdit(page) {
  const saveButton = page.getByRole('button', { name: selectors.stockCounts.saveButtonName });
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await saveButton.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await waitForStockCountSaveNavigation(page);
  console.log(`stockCounts:afterSaveUrl=${page.url()}`);
}

async function waitForStockCountSaveNavigation(page) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (/\/products\/stockcount-(view|overview)/.test(page.url())) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`Stock Count Save did not reach a stable page: ${page.url()}`);
}

async function findLineTable(page) {
  const productInput = page.locator(selectors.stockCounts.lineProductInput).first();
  await productInput.waitFor({ state: 'visible', timeout: 10000 });
  return productInput.locator('xpath=ancestor::table[1]');
}

async function readColumnIndexes(table) {
  const headers = table.locator('thead th, tr th');
  const count = await headers.count();
  const byHeader = {};

  for (let i = 0; i < count; i += 1) {
    const label = normalizeText(await headers.nth(i).innerText().catch(() => ''));
    if (!label) continue;
    if (/current\s*stock/i.test(label)) byHeader.currentStock = i;
    else if (/difference/i.test(label)) byHeader.difference = i;
    else if (/new\s*stock/i.test(label)) byHeader.newStock = i;
  }

  if (byHeader.currentStock === undefined) {
    throw new Error('Current stock column was not found in the Stock Count edit table.');
  }

  return byHeader;
}

async function readStockCountRow(row, columnIndexes, productCode, rowNumber) {
  const description = await readFirstText(row, [
    selectors.stockCounts.descriptionCell,
    'td[data-overview-column-key*="description" i]',
    'td[data-overview-column-key*="name" i]'
  ]);
  const currentStock = await readRequiredCellByIndex(row, columnIndexes.currentStock, 'Current stock', rowNumber, productCode);
  const difference = columnIndexes.difference === undefined
    ? ''
    : await readOptionalCellByIndex(row, columnIndexes.difference);
  const newStock = columnIndexes.newStock === undefined
    ? ''
    : await readOptionalCellByIndex(row, columnIndexes.newStock);

  if (!Number.isFinite(parseCountItNumber(currentStock))) {
    throw new Error(`Current stock is not a number: row=${rowNumber}, productCode=${productCode}, value="${currentStock}"`);
  }

  return {
    productCode,
    description,
    currentStock,
    difference,
    newStock
  };
}

async function readFirstText(scope, selectorsToTry) {
  for (const selector of selectorsToTry) {
    const locator = scope.locator(selector);
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const text = normalizeText(await locator.nth(i).innerText().catch(() => ''));
      if (text) return text;
    }
  }
  return '';
}

async function readRequiredCellByIndex(row, index, label, rowNumber, productCode) {
  const value = await readOptionalCellByIndex(row, index);
  if (value) return value;

  throw new Error(`${label} cell was empty or unreadable: row=${rowNumber}, productCode=${productCode}`);
}

async function readOptionalCellByIndex(row, index) {
  const cell = row.locator('td').nth(index);
  const text = normalizeText(await cell.innerText().catch(() => ''));
  if (text) return text;

  const inputValue = normalizeText(await cell.locator('input').first().inputValue().catch(() => ''));
  if (inputValue) return inputValue;

  return '';
}

module.exports = {
  openStockCountForEdit,
  readTargetProductsFromStockCount,
  saveStockCountAndLeaveEdit,
  _test: {
    readOptionalCellByIndex,
    readRequiredCellByIndex,
    readStockCountRow
  }
};
