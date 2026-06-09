'use strict';

const countItSelectors = {
  loginUrl: 'https://start.count-it.eu/en/account/login/ZW4vZGFzaGJvYXJkL2Rhc2hib2FyZA==?allowcodelogin=1',
  emailInput: 'input[name="forms_form_100_emailaddress"]',
  passwordInput: 'input[name="forms_form_100_password"]',
  loginButton: { role: 'button', name: 'Login' },
  companyNameDisplayCandidates: [
    'span.companyname',
    '.companyname',
    '[class*="company"]',
    'header [class*="company"]'
  ],
  companyLinkCandidates: [
    'a',
    '[role="link"]'
  ]
};

module.exports = { countItSelectors };
