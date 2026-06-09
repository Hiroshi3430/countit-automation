'use strict';

const { countItSelectors } = require('./selectors');

function debugCompanyEnabled() {
  return process.env.DEBUG_COUNTIT_COMPANY === '1';
}

function debugCompany(message) {
  if (debugCompanyEnabled()) console.log(message);
}

function normalizeCompanyName(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getCurrentCompanyName(page) {
  try {
    const companyName = await firstVisibleCompanyNameDisplay(page, 3000);
    const rawText = await companyName.innerText();
    const text = normalizeCompanyName(rawText);
    debugCompany(`company: debug current raw=${JSON.stringify(rawText)} normalized=${JSON.stringify(text)}`);
    if (text) {
      console.log('company: current name detected');
      return text;
    }
  } catch (_) {
    // Continue to not detected log below.
  }
  console.log('company: current name not detected');
  return null;
}

async function switchCompanyIfNeeded(page, targetCompanyName) {
  if (!targetCompanyName) {
    throw new Error('COUNTIT company name is not configured.');
  }

  const normalizedTargetCompanyName = normalizeCompanyName(targetCompanyName);
  debugCompany(`company: debug target normalized=${JSON.stringify(normalizedTargetCompanyName)}`);
  const currentCompanyName = await getCurrentCompanyName(page);
  if (normalizeCompanyName(currentCompanyName) === normalizedTargetCompanyName) {
    console.log('company: normalized current matches target');
    console.log('company: already selected');
    return;
  }

  console.log('company: switching');
  const companyNameDisplay = await firstVisibleCompanyNameDisplay(page, 10000);
  const beforeHoverCount = await countCompanyLinkCandidates(page);
  await companyNameDisplay.hover();
  console.log('company: menu opened by hover');
  const afterHoverCount = await countCompanyLinkCandidates(page);
  debugCompany(`company: debug menu candidate count before hover=${beforeHoverCount} after hover=${afterHoverCount}`);

  let companyLink = await findCompanyLink(page, targetCompanyName, { throwIfMissing: false });
  if (!companyLink) {
    console.log('company: retrying menu open by click');
    const beforeClickCount = await countCompanyLinkCandidates(page);
    await companyNameDisplay.click();
    const afterClickCount = await countCompanyLinkCandidates(page);
    debugCompany(`company: debug menu candidate count before click=${beforeClickCount} after click=${afterClickCount}`);
    companyLink = await findCompanyLink(page, targetCompanyName, { throwIfMissing: false });
  }
  if (!companyLink) {
    throw new Error('Configured CountIT company link was not found after scanning company menu candidates.');
  }

  await companyLink.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  const selectedCompanyName = await getCurrentCompanyName(page);
  if (normalizeCompanyName(selectedCompanyName) !== normalizedTargetCompanyName) {
    throw new Error('Current company could not be confirmed after switching.');
  }
}

async function firstVisibleCompanyNameDisplay(page, timeout = 3000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const selector of countItSelectors.companyNameDisplayCandidates) {
      const locators = page.locator(selector);
      const count = await locators.count();
      debugCompany(`company: debug display selector=${JSON.stringify(selector)} count=${count}`);
      for (let i = 0; i < count; i += 1) {
        const locator = locators.nth(i);
        if (await locator.isVisible().catch(() => false)) return locator;
      }
    }
    await page.waitForTimeout(250);
  }
  throw new Error('Current CountIT company display was not found.');
}

async function findCompanyLink(page, targetCompanyName, options = {}) {
  const normalizedTargetCompanyName = normalizeCompanyName(targetCompanyName);
  const exactRoleLink = page.getByRole('link', { name: targetCompanyName, exact: true });
  if (await exactRoleLink.count()) return exactRoleLink.first();

  let scannedCount = 0;
  const matches = [];
  for (const selector of countItSelectors.companyLinkCandidates) {
    const candidates = page.locator(selector);
    const count = await candidates.count();
    debugCompany(`company: debug selector=${JSON.stringify(selector)} count=${count}`);
    scannedCount += count;
    for (let i = 0; i < count; i += 1) {
      const candidate = candidates.nth(i);
      const rawText = await candidate.innerText().catch(() => '');
      const text = normalizeCompanyName(rawText);
      debugCompany(`company: debug candidate[${i}] raw=${JSON.stringify(rawText)} normalized=${JSON.stringify(text)}`);
      if (text === normalizedTargetCompanyName) matches.push(candidate);
    }
  }

  console.log(`company: link candidates scanned count=${scannedCount}`);
  console.log(`company: normalized matches count=${matches.length}`);

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error('Multiple CountIT company links matched configured company name.');
  }
  if (options.throwIfMissing === false) return null;
  throw new Error('Configured CountIT company link was not found after scanning company menu candidates.');
}

async function countCompanyLinkCandidates(page) {
  let total = 0;
  for (const selector of countItSelectors.companyLinkCandidates) {
    total += await page.locator(selector).count();
  }
  return total;
}

module.exports = {
  debugCompanyEnabled,
  getCurrentCompanyName,
  normalizeCompanyName,
  switchCompanyIfNeeded
};
