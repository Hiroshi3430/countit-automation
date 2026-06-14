'use strict';

const selectors = {
  login: {
    url: 'https://start.count-it.eu/en/account/login/ZW4vZGFzaGJvYXJkL2Rhc2hib2FyZA==?allowcodelogin=1',
    email: 'input[name="forms_form_100_emailaddress"]',
    password: 'input[name="forms_form_100_password"]',
    submitRole: { role: 'button', name: 'Login' },
    companyName: 'span.companyname'
  },
  navigation: {
    productsLinkName: 'Products',
    productsSectionCandidates: [
      'nav a:has-text("Products")',
      'nav button:has-text("Products")',
      'a:has-text("Products")',
      'button:has-text("Products")'
    ],
    discountsText: 'Discounts',
    addDiscountLinkName: 'Add discount'
  },
  products: {
    overviewUrl: 'https://start.count-it.eu/en/products/product-overview',
    searchInputCandidates: [
      'div.advanced-table-search input[placeholder="Search"]',
      '.advanced-table-search input[type="text"]',
      '.advanced-table-search input',
      'input[type="search"]',
      'input.search[type="text"]',
      'input.search:not([type])',
      'input[name="search"]',
      'input[name="Search"]',
      'input[name*="search" i][type="text"]',
      'input[name*="search" i]:not([type])',
      'input[placeholder*="search" i][type="text"]',
      'input[placeholder*="search" i][type="search"]'
    ],
    resultRows: 'tbody.content tr[data-href*="products/product-view"], tr[data-href*="products/product-view"]',
    codeCellCandidates: [
      'td[data-overview-column-key="ArtNumber"]',
      'td[data-overview-column-key="article number"]',
      'td:nth-child(3)'
    ],
    nameCellCandidates: [
      'td[data-overview-column-key="Name"]',
      'td:nth-child(2)'
    ],
    rowClickCellCandidates: [
      'td[data-overview-column-key="Name"]',
      'td[data-overview-column-key="ArtNumber"]',
      'td:nth-child(2)',
      'td:nth-child(3)'
    ],
    regularPriceInputCandidates: [
      'input[name="forms_form_100_SalesPrice"]',
      'input[name="forms_form_100_Price"]',
      'input[name*="RegularPrice" i]',
      'input[name*="SalesPrice" i]',
      'input[name*="RetailPrice" i]',
      'input[name*="Price" i]:not([name*="NewPrice" i])'
    ],
    regularPriceTextCandidates: [
      '[data-form-name*="RegularPrice" i]',
      '[data-form-name*="SalesPrice" i]',
      '[data-form-name*="RetailPrice" i]',
      '[data-form-name*="Price" i]',
      '.formrow:has-text("Regular price")',
      '.formrow:has-text("Sales price")',
      '.formrow:has-text("Retail price")',
      '.formrow:has-text("Price")',
      'tr:has-text("Regular price") td:last-child',
      'tr:has-text("Sales price") td:last-child',
      'tr:has-text("Retail price") td:last-child',
      'tr:has-text("Price") td:last-child'
    ]
  },
  discounts: {
    rows: 'table tbody tr',
    editableRows: 'table tbody tr.popup[data-href*="productdiscount-edit"]',
    editableRowClickCell: 'td:not(.overview-pinned-right):not(.minwidth)',
    table: 'table',
    noResultsText: 'No results',
    popup: '.popup-container.shadow-light-popup:visible',
    popupAny: '.popup-container.shadow-light-popup',
    popupBackground: '.popup-background',
    confirmAlert: '.hdc_alerts-message.shadow-light-popup',
    popupTitle: 'h1.popup-title',
    popupFooterButton: '.popup-footer button:visible, .popup-footer input[type="submit"]:visible, button:visible, input[type="submit"]:visible',
    startDateCellCandidates: [
      'td[data-overview-column-key="from"]',
      'td:nth-child(4)',
      'td:nth-child(5)'
    ],
    endDateCellCandidates: [
      'td[data-overview-column-key="till"]',
      'td:nth-child(5)',
      'td:nth-child(6)'
    ],
    endDatePrimaryCell: 'td[data-overview-column-key="till"]',
    endDateFallbackCellCandidates: ['td:nth-child(5)', 'td:nth-child(6)'],
    priceCellCandidates: [
      'td[data-overview-column-key="discount"]',
      'td:nth-child(1)',
      'td:nth-child(2)'
    ],
    endDateInput: 'input[name="forms_form_100_EndDate_date"]',
    endDateTimeInput: 'input[name="forms_form_100_EndDate_time"]',
    endDateClockIcon: '.frminputcontainer_forms_form_100_EndDate > .hdc_icon-clock-o',
    startDateInput: 'input[name="forms_form_100_StartDate_date"]',
    startDateTimeInput: 'input[name="forms_form_100_StartDate_time"]',
    startDateClockIcon: '.frminputcontainer_forms_form_100_StartDate > .hdc_icon-clock-o',
    newPriceInput: 'input[name="forms_form_100_NewPrice"]',
    popupCloseCandidates: [
      '.popup-close:visible',
      '.popup-header .close:visible',
      '.popup-header button:has-text("Close"):visible',
      'button[aria-label="Close"]:visible',
      'a[aria-label="Close"]:visible'
    ],
    saveButtonName: 'Save',
    addButtonName: 'Add'
  }
};

module.exports = { selectors };
