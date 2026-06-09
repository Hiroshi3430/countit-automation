'use strict';

const {
  loadCountItConfig,
  loginAndSelectCompany
} = require('../../pos-common/auth');

async function login(page) {
  const config = loadCountItConfig('stock');
  await loginAndSelectCompany(page, config);
}

module.exports = { login };
