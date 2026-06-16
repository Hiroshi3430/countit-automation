'use strict';

const selectors = {
  stockCounts: {
    overviewUrl: 'https://start.count-it.eu/en/products/stockcount-overview',
    menuLinkName: 'Stock counts',
    addInventoryLinkName: 'Add Inventory Count',
    editLinkName: 'Edit',
    nameInput: 'input[name="forms_form_100_Name"]',
    saveButtonName: 'Save',
    searchInputCandidates: [
      'div.advanced-table-search input[placeholder="Search"]',
      '.advanced-table-search input[type="text"]',
      '.advanced-table-search input',
      'input[type="search"]',
      'input[name="search"]',
      'input[name="Search"]',
      'input[name*="search" i][type="text"]',
      'input[name*="search" i]:not([type])',
      'input[placeholder*="search" i][type="text"]',
      'input[placeholder*="search" i][type="search"]'
    ],
    resultRows: [
      'tbody.content tr[data-href*="stockcount"]',
      'tr[data-href*="stockcount"]',
      'table tbody tr'
    ],
    lineProductInput: 'input[name^="scan_line_product_name_"]',
    lineAmountInputFor: (rowNumber) => `input[name="scan_line_amount_${rowNumber}"]`,
    lineProductInputFor: (rowNumber) => `input[name="scan_line_product_name_${rowNumber}"]`,
    descriptionCell: 'td.td_description'
  },
  labelPrint: {
    overviewUrl: 'https://start.count-it.eu/en/products/labelprint-overview',
    menuLinkName: 'Print labels',
    addLinkName: 'Add label print',
    editLinkName: 'Edit',
    nameInput: 'input[name="forms_form_100_Name"]',
    addButtonName: 'Add',
    saveButtonName: 'Save',
    searchInputCandidates: [
      'div.advanced-table-search input[placeholder="Search"]',
      '.advanced-table-search input[type="text"]',
      '.advanced-table-search input',
      'input[type="search"]',
      'input[name="search"]',
      'input[name="Search"]',
      'input[name*="search" i][type="text"]',
      'input[name*="search" i]:not([type])',
      'input[placeholder*="search" i][type="text"]',
      'input[placeholder*="search" i][type="search"]'
    ],
    resultRows: [
      'tbody.content tr[data-href*="labelprint"]',
      'tr[data-href*="labelprint"]',
      'table tbody tr'
    ],
    lineProductInput: 'input[name^="scan_line_product_name_"]',
    lineProductInputFor: (rowNumber) => `input[name="scan_line_product_name_${rowNumber}"]`,
    lineAmountInputFor: (rowNumber) => `input[name="scan_line_amount_${rowNumber}"]`,
    lineDescriptionCellFor: (rowNumber) => `#scan_line_tr_${rowNumber} td.td_description`
  }
};

module.exports = { selectors };
