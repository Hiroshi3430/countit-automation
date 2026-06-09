'use strict';

const { getCurrentCompanyName, switchCompanyIfNeeded } = require('./company');
const { countItSelectors } = require('./selectors');

function loadCountItConfig(appName) {
  const appKey = String(appName || '').trim().toUpperCase();
  const email = process.env.COUNTIT_EMAIL;
  const password = process.env.COUNTIT_PASSWORD;
  const companyName = appKey
    ? process.env[`COUNTIT_COMPANY_NAME_${appKey}`] || process.env.COUNTIT_COMPANY_NAME
    : process.env.COUNTIT_COMPANY_NAME;

  const missing = [];
  if (!email) missing.push('COUNTIT_EMAIL');
  if (!password) missing.push('COUNTIT_PASSWORD');
  if (!companyName) {
    missing.push(appKey ? `COUNTIT_COMPANY_NAME_${appKey} or COUNTIT_COMPANY_NAME` : 'COUNTIT_COMPANY_NAME');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    appName,
    email,
    password,
    companyName,
    loginUrl: process.env.COUNTIT_BASE_URL || countItSelectors.loginUrl
  };
}

async function loginIfNeeded(page, config) {
  console.log('login: checking session');
  await page.goto(config.loginUrl);
  await page.waitForLoadState('domcontentloaded').catch(() => {});

  if (await isLoggedIn(page)) {
    console.log('login: already logged in');
    return;
  }

  const emailInput = page.locator(countItSelectors.emailInput);
  const passwordInput = page.locator(countItSelectors.passwordInput);
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(config.email);
  await passwordInput.fill(config.password);
  await page.getByRole(countItSelectors.loginButton.role, { name: countItSelectors.loginButton.name }).click();
  console.log('login: form submitted');

  await page.waitForLoadState('networkidle').catch(() => {});
  const currentCompanyName = await getCurrentCompanyName(page);
  if (!currentCompanyName) {
    throw new Error('Login submitted, but CountIT company display was not found.');
  }
}

async function loginAndSelectCompany(page, config) {
  await loginIfNeeded(page, config);
  await switchCompanyIfNeeded(page, config.companyName);
}

async function isLoggedIn(page) {
  if (await getCurrentCompanyName(page)) return true;

  const emailInput = page.locator(countItSelectors.emailInput).first();
  if (await emailInput.isVisible().catch(() => false)) return false;

  return false;
}

module.exports = {
  loadCountItConfig,
  loginAndSelectCompany,
  loginIfNeeded
};
