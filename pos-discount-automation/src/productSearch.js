'use strict';

const { selectors } = require('./selectors');

async function firstVisibleEditableInput(page, selectorList, timeout = 5000) {
  for (const selector of selectorList) {
    const locators = page.locator(selector);
    const count = await locators.count();

    for (let i = 0; i < count; i += 1) {
      const locator = locators.nth(i);
      try {
        await locator.waitFor({ state: 'visible', timeout });
        if (!(await locator.isEditable())) continue;
        return locator;
      } catch (_) {
        // Try next matched element or selector candidate.
      }
    }
  }

  throw new Error(`No editable product search input became visible: ${selectorList.join(', ')}`);
}

async function extractFirstNonEmptyText(scope, selectorCandidates) {
  for (const selector of selectorCandidates) {
    const locator = scope.locator(selector);
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const text = String(await locator.nth(i).textContent({ timeout: 500 }) || '').trim();
      if (text && text !== '-') return text;
    }
  }
  return '';
}

async function openProducts(page) {
  console.log('openProducts:goto');
  await page.goto(selectors.products.overviewUrl);
  await page.waitForLoadState('domcontentloaded');

  const searchInput = await firstVisibleEditableInput(page, selectors.products.searchInputCandidates, 5000);
  console.log('searchBox:ready');
  return searchInput;
}

async function searchProductCode(page, searchInput, searchValue) {
  await searchInput.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(searchValue);
  await page.keyboard.press('Enter');
  console.log('searchBox:filled');
}

async function findProductRowByArticleNumber(page, searchValue) {
  const rows = page.locator(selectors.products.resultRows);
  await rows.first().waitFor({ state: 'visible', timeout: 5000 });

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const match = await findExactArticleNumberMatch(rows, searchValue);
    if (match) {
      console.log(`productRows:count=${match.count}`);
      console.log(`productRowCandidate:index=${match.index} artNumber="${match.articleNumber}" name="${match.name}"`);
      console.log('productRow:foundByArtNumber');
      return match.row;
    }
    await page.waitForTimeout(250);
  }

  await logProductRowCandidates(rows);
  throw new Error(`Product not found by Article number: ${searchValue}`);
}

async function findExactArticleNumberMatch(rows, searchValue) {
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const articleNumber = await extractFirstNonEmptyText(row, selectors.products.codeCellCandidates);
    if (articleNumber !== searchValue) continue;
    const name = await extractFirstNonEmptyText(row, selectors.products.nameCellCandidates);
    return { row, index: i, count, articleNumber, name };
  }
  return null;
}

async function logProductRowCandidates(rows) {
  const count = await rows.count();
  console.log(`productRows:count=${count}`);
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const articleNumber = await extractFirstNonEmptyText(row, selectors.products.codeCellCandidates);
    const name = await extractFirstNonEmptyText(row, selectors.products.nameCellCandidates);
    console.log(`productRowCandidate:index=${i} artNumber="${articleNumber}" name="${name}"`);
  }
}

async function searchProduct(page, productCode) {
  const searchValue = String(productCode || '').trim();
  if (!searchValue) {
    throw new Error('Product Code is empty');
  }

  const searchInput = await openProducts(page);
  await searchProductCode(page, searchInput, searchValue);

  const row = await findProductRowByArticleNumber(page, searchValue);
  console.log('productRow:found');
  const actualProductName = await extractFirstNonEmptyText(row, selectors.products.nameCellCandidates);
  const clickCell = await firstExistingCell(row, selectors.products.rowClickCellCandidates);
  await clickCell.click();
  await page.getByText(selectors.navigation.discountsText).waitFor({ state: 'visible' });
  console.log('productDetail:opened');
  return { actualProductName };
}

async function firstExistingCell(row, selectorCandidates) {
  for (const selector of selectorCandidates) {
    const locator = row.locator(selector);
    if (await locator.count()) return locator.first();
  }
  return row;
}

module.exports = { searchProduct };
