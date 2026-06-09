'use strict';

const { selectors } = require('./selectors');

class DangerousAutomationError extends Error {
  constructor(message, cause) {
    super(`Dangerous automation error: ${message}`);
    this.name = 'DangerousAutomationError';
    this.cause = cause;
    this.isDangerousAutomationError = true;
  }
}

function dangerousError(message, cause) {
  if (cause instanceof DangerousAutomationError) return cause;
  return new DangerousAutomationError(message, cause);
}

async function waitForAnyVisible(page, locators, timeout = 10000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      try {
        if (await locator.first().isVisible()) return locator.first();
      } catch (_) {
        // Try the next locator.
      }
    }
    await page.waitForTimeout(250);
  }

  throw new Error('Discounts screen did not become ready.');
}

async function extractFirstNonEmptyText(scope, selectorCandidates) {
  for (const selector of selectorCandidates) {
    const locator = scope.locator(selector);
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const text = (await locator.nth(i).innerText()).trim();
      if (text && text !== '-') return text;
    }
  }
  return '';
}

async function extractCellTextPreservingDash(scope, primarySelector, fallbackSelectors = []) {
  const primary = scope.locator(primarySelector);
  if (await primary.count()) {
    return (await primary.first().innerText()).trim();
  }

  for (const selector of fallbackSelectors) {
    const locator = scope.locator(selector);
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const text = (await locator.nth(i).innerText()).trim();
      if (text) return text;
    }
  }
  return '';
}

async function openDiscounts(page) {
  console.log('discounts:open:start');
  await page.getByText(selectors.navigation.discountsText).click();
  await waitForAnyVisible(page, [
    page.getByRole('link', { name: selectors.navigation.addDiscountLinkName }),
    page.locator(selectors.discounts.table),
    page.getByText(selectors.discounts.noResultsText)
  ]);
  console.log('discounts:opened');
}

async function readExistingDiscounts(page) {
  await openDiscounts(page);

  if (await page.getByText(selectors.discounts.noResultsText).isVisible().catch(() => false)) {
    console.log('existingDiscounts:zero');
    return [];
  }

  const rows = page.locator(selectors.discounts.editableRows);

  try {
    await rows.first().waitFor({ state: 'visible', timeout: 3000 });
  } catch (_) {
    return [];
  }

  const discounts = [];
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText()).trim();
    if (!text || /no\s+results/i.test(text) || /no\s+records/i.test(text)) continue;
    const startDate = await extractFirstNonEmptyText(row, selectors.discounts.startDateCellCandidates);
    const endDate = await extractCellTextPreservingDash(
      row,
      selectors.discounts.endDatePrimaryCell,
      selectors.discounts.endDateFallbackCellCandidates
    );
    const price = await extractFirstNonEmptyText(row, selectors.discounts.priceCellCandidates);
    console.log(`existingDiscount:row=${i} price=${price} from="${startDate}" till="${endDate}"`);

    discounts.push({
      rowIndex: i,
      startDate,
      endDate,
      price,
      rawText: text
    });
  }
  if (discounts.length === 0) console.log('existingDiscounts:zero');
  else console.log(`existingDiscounts:found:${discounts.length}`);
  return discounts;
}

async function setExistingDiscountEndDate(page, discount, endDate, endTime) {
  const row = page.locator(selectors.discounts.editableRows).nth(discount.rowIndex);
  const clickCell = row.locator(selectors.discounts.editableRowClickCell).first();
  await clickCell.click();
  const popup = await waitForPopup(page, 'Edit discount');
  await fillDateTime(page, {
    scope: popup,
    dateSelector: selectors.discounts.endDateInput,
    timeSelector: selectors.discounts.endDateTimeInput,
    dateValue: endDate,
    timeValue: endTime
  });
}

async function waitForPopup(page, titleText) {
  const popup = page.locator(selectors.discounts.popup).last();
  await popup.waitFor({ state: 'visible', timeout: 10000 });
  await popup.locator(selectors.discounts.popupTitle).filter({ hasText: titleText })
    .waitFor({ state: 'visible', timeout: 10000 });
  return popup;
}

async function assertNoConfirmAlert(page) {
  const confirmAlert = page.locator(selectors.discounts.confirmAlert).filter({ hasText: 'You have changed data' });
  if (await confirmAlert.isVisible().catch(() => false)) {
    console.log('confirm alert detected');
    throw new DangerousAutomationError('Confirm alert detected. Stop without clicking Yes.');
  }
}

async function waitForNoBlockingPopup(page) {
  await assertNoConfirmAlert(page);
  const popup = page.locator(selectors.discounts.popupAny);
  const background = page.locator(selectors.discounts.popupBackground);

  if (await popup.count()) {
    await popup.last().waitFor({ state: 'hidden', timeout: 10000 });
  }
  if (await background.count()) {
    await background.last().waitFor({ state: 'hidden', timeout: 10000 });
  }
  await assertNoConfirmAlert(page);
}

async function waitForPopupClosed(page, popup) {
  console.log('wait popup closed start');
  try {
    await popup.waitFor({ state: 'hidden', timeout: 10000 });

    const background = page.locator(selectors.discounts.popupBackground);
    if (await background.count()) {
      await background.last().waitFor({ state: 'hidden', timeout: 10000 });
    }

    await assertNoConfirmAlert(page);
    console.log('wait popup closed done');
  } catch (error) {
    throw dangerousError('Popup did not close cleanly after submit. CountIT save state is unclear.', error);
  }
}

async function fillDateTime(page, { scope, dateSelector, timeSelector, dateValue, timeValue }) {
  if (!dateValue) return;

  const root = scope || page;
  const dateInput = root.locator(dateSelector);
  if (await dateInput.count()) {
    await dateInput.fill(formatDateForCountIt(dateValue));
  } else {
    throw new Error(`Date input not found: ${dateSelector}`);
  }

  const timeInput = root.locator(timeSelector);
  if (timeValue && await timeInput.count()) {
    await timeInput.fill(timeValue);
  }
}

function formatDateForCountIt(isoDate) {
  const match = String(isoDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

async function fillNewDiscount(page, row, decision) {
  console.log('before Add discount click');
  await waitForNoBlockingPopup(page);
  await page.getByRole('link', { name: selectors.navigation.addDiscountLinkName }).click();
  const popup = await waitForPopup(page, 'Add discount');
  await popup.locator(selectors.discounts.newPriceInput).fill(String(row['Discount Price']).trim());

  await fillDateTime(page, {
    scope: popup,
    dateSelector: selectors.discounts.startDateInput,
    timeSelector: selectors.discounts.startDateTimeInput,
    dateValue: decision.newStartDate,
    timeValue: decision.newStartTime
  });

  if (decision.newEndDate) {
    await fillDateTime(page, {
      scope: popup,
      dateSelector: selectors.discounts.endDateInput,
      timeSelector: selectors.discounts.endDateTimeInput,
      dateValue: decision.newEndDate,
      timeValue: decision.newEndTime
    });
  }
}

async function saveOrPause(page, mode, buttonName) {
  if (mode === 'dry-run') return;

  const popup = page.locator(selectors.discounts.popup).last();
  const button = await findPopupSubmitButton(popup, buttonName);
  await button.waitFor({ state: 'visible' });
  await assertNoConfirmAlert(page);

  if (mode === 'semi-auto') {
    console.log(`[semi-auto] Paused before "${buttonName}". Review browser, then press Enter here to continue.`);
    console.log('Do not click outside the popup.');
    console.log('Review the popup only.');
    console.log('Press Enter in this terminal to submit.');
    console.log('If a Confirm dialog appears, click No.');
    await waitForEnter();
    await assertNoConfirmAlert(page);
  }

  console.log(`before popup submit ${buttonName}`);
  try {
    await button.click();
    console.log(`after popup submit ${buttonName}`);
    await waitForPopupClosed(page, popup);
  } catch (error) {
    throw dangerousError(`${buttonName} submit failed after submit was attempted. CountIT save state is unclear.`, error);
  }
}

async function findPopupSubmitButton(popup, buttonName) {
  const footer = popup.locator('.popup-footer');
  const candidates = [
    footer.getByRole('button', { name: buttonName }).last(),
    footer.locator(`input[type="submit"][value="${buttonName}"]`).last(),
    popup.getByRole('button', { name: buttonName }).last(),
    popup.locator(`input[type="submit"][value="${buttonName}"]`).last()
  ];

  for (const candidate of candidates) {
    try {
      await candidate.waitFor({ state: 'visible', timeout: 1000 });
      return candidate;
    } catch (_) {
      // Try next popup button candidate.
    }
  }

  throw new Error(`Popup submit button not found: ${buttonName}`);
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

module.exports = {
  DangerousAutomationError,
  fillNewDiscount,
  openDiscounts,
  readExistingDiscounts,
  saveOrPause,
  setExistingDiscountEndDate
};
