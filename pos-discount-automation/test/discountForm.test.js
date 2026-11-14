'use strict';

const assert = require('assert');
const { chromium } = require('playwright');
const { fillNewDiscount, setExistingDiscountEndDate } = require('../src/discountPage');

function fixture(number, title) {
  const fields = ['NewPrice', 'StartDate_date', 'StartDate_time', 'EndDate_date', 'EndDate_time'];
  const inputs = fields.map(field => `<input name="forms_form_${number}_${field}" value="${field === 'NewPrice' ? '6,00' : ''}">`).join('');
  return `<input name="forms_form_100_NewPrice" value="outside">
    <a href="#" onclick="document.querySelector('.popup-container').style.display='block'">Add discount</a>
    <table><tbody><tr class="popup" data-href="productdiscount-edit" onclick="document.querySelector('.popup-container').style.display='block'"><td>Edit</td></tr></tbody></table>
    <div class="popup-container shadow-light-popup" style="display:none">
      <h1 class="popup-title">${title}</h1>${inputs}
    </div>`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    page.setDefaultTimeout(1000);
    for (const number of [200, 100, 300]) {
      await page.setContent(fixture(number, 'Add discount'));
      await fillNewDiscount(page, { 'Discount Price': '4.5' }, {
        newStartDate: '2026-11-14', newStartTime: '10:30',
        newEndDate: '2026-11-20', newEndTime: '18:00'
      });
      const popup = page.locator('.popup-container');
      const expected = { NewPrice: '4.5', StartDate_date: '14-11-2026', StartDate_time: '10:30', EndDate_date: '20-11-2026', EndDate_time: '18:00' };
      for (const [field, value] of Object.entries(expected)) {
        assert.strictEqual(await popup.locator(`input[name="forms_form_${number}_${field}"]`).inputValue(), value);
      }
      assert.strictEqual(await page.locator('body > input').inputValue(), 'outside');

      await page.setContent(fixture(number, 'Edit discount'));
      const previousPrice = await setExistingDiscountEndDate(page, { rowIndex: 0 }, '2026-11-14', '10:35');
      assert.strictEqual(previousPrice, '6,00');
      assert.strictEqual(await popup.locator(`input[name="forms_form_${number}_EndDate_date"]`).inputValue(), '14-11-2026');
      assert.strictEqual(await popup.locator(`input[name="forms_form_${number}_EndDate_time"]`).inputValue(), '10:35');
      console.log(`discount form ${number}: add/edit passed`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
