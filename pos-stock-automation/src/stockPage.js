'use strict';

const { expect } = require('@playwright/test');
const { selectors } = require('./selectors');

async function openInventoryCountForm(page) {
  await page.goto(selectors.stock.overviewUrl);

  const addInventoryLink = page.getByRole('link', { name: selectors.stock.addInventoryLinkName });
  await expect(addInventoryLink).toBeVisible({ timeout: 10000 });
  await addInventoryLink.click();

  const descriptionInput = page.locator(selectors.stock.descriptionInput).first();
  await expect(descriptionInput).toBeVisible({ timeout: 10000 });
}

async function fillInventoryCount(page, { inventoryDescription, records }) {
  const descriptionInput = page.locator(selectors.stock.descriptionInput).first();
  await expect(descriptionInput).toBeVisible({ timeout: 10000 });
  await descriptionInput.fill(inventoryDescription);

  for (let i = 0; i < records.length; i += 1) {
    const item = records[i];
    const rowNumber = i + 1;

    const row = page.locator(`#scan_line_tr_${rowNumber}`);
    const productInput = row.locator(`input[name="scan_line_product_name_${rowNumber}"]`);
    const amountInput = row.locator(`input[name="scan_line_amount_${rowNumber}"]`);
    const descriptionCell = row.locator('td.td_description');

    await productInput.fill(item.product_code);
    await productInput.press('Tab');

    await expect(descriptionCell).toHaveText(/.+/, { timeout: 15000 });

    const actualProductName = (await descriptionCell.innerText()).trim();

    if (actualProductName !== item.product_name) {
      throw new Error(
        `商品名不一致: code=${item.product_code}, CSV="${item.product_name}", CountIT="${actualProductName}"`
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
  await expect(page).toHaveURL(/stockcount-overview/, { timeout: 15000 });
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

module.exports = { fillInventoryCount, openInventoryCountForm, saveOrPause };
