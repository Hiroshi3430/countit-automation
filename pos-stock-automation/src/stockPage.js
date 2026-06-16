'use strict';

const { selectors } = require('./selectors');

function normalizeStockProductName(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

async function ensureLocatorExists(locator, { timeout = 10000, message }) {
  try {
    await locator.waitFor({ state: 'attached', timeout });
  } catch (error) {
    throw new Error(message);
  }
}

async function waitForNonEmptyText(locator, { timeout = 15000, message }) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const text = await locator.innerText({ timeout: Math.min(1000, Math.max(1, deadline - Date.now())) });
      if (text.trim()) return text;
    } catch (error) {
      // Keep polling until the timeout so dynamic CountIT rows have time to populate.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(message);
}

async function openInventoryCountForm(page) {
  await page.goto(selectors.stock.overviewUrl);

  const addInventoryLink = page.getByRole('link', { name: selectors.stock.addInventoryLinkName });
  await addInventoryLink.waitFor({ state: 'visible', timeout: 10000 });
  await addInventoryLink.click();

  const descriptionInput = page.locator(selectors.stock.descriptionInput).first();
  await descriptionInput.waitFor({ state: 'visible', timeout: 10000 });
}

async function fillInventoryCount(page, { inventoryDescription, records }) {
  const descriptionInput = page.locator(selectors.stock.descriptionInput).first();
  await descriptionInput.waitFor({ state: 'visible', timeout: 10000 });
  await descriptionInput.fill(inventoryDescription);

  for (let i = 0; i < records.length; i += 1) {
    const item = records[i];
    const rowNumber = i + 1;

    const row = page.locator(`#scan_line_tr_${rowNumber}`);
    const productInput = row.locator(`input[name="scan_line_product_name_${rowNumber}"]`);
    const amountInput = row.locator(`input[name="scan_line_amount_${rowNumber}"]`);
    const descriptionCell = row.locator('td.td_description');

    await ensureLocatorExists(row, {
      message: `Stock row not found: row=${rowNumber}, product_code=${item.product_code}`
    });
    await ensureLocatorExists(productInput, {
      message: `Stock product input not found: row=${rowNumber}, product_code=${item.product_code}`
    });
    await ensureLocatorExists(amountInput, {
      message: `Stock amount input not found: row=${rowNumber}, product_code=${item.product_code}`
    });

    await productInput.fill(item.product_code);
    await productInput.press('Tab');

    const actualProductName = await waitForNonEmptyText(descriptionCell, {
      message: `Stock product description did not load: row=${rowNumber}, product_code=${item.product_code}`
    });

    const normalizedActualProductName = normalizeStockProductName(actualProductName);
    const normalizedExpectedProductName = normalizeStockProductName(item.product_name);

    if (normalizedActualProductName !== normalizedExpectedProductName) {
      throw new Error(
        `商品名不一致: code=${item.product_code}, input_raw="${item.product_name}", input_normalized="${normalizedExpectedProductName}", CountIT_raw="${actualProductName}", CountIT_normalized="${normalizedActualProductName}"`
      );
    }

    await amountInput.fill(item.amount);
  }
}

async function saveOrPause(page, mode) {
  if (mode === 'dry-run') return;

  const button = page.getByRole('button', { name: selectors.stock.addButtonName });
  await button.waitFor({ state: 'visible' });

  if (mode === 'semi-auto') {
    console.log('[semi-auto] Paused before "Add". Review browser, then press Enter here to continue.');
    await waitForEnter();
  }

  await button.click();
  await page.waitForURL(/stockcount-overview/, { timeout: 15000 });
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

module.exports = { fillInventoryCount, normalizeStockProductName, openInventoryCountForm, saveOrPause };
