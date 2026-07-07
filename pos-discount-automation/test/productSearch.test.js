'use strict';

const assert = require('assert');
const { searchProduct, _test } = require('../src/productSearch');

assert.strictEqual(_test.productNamesMatch(' Sample Product ', 'sample   product'), true);
assert.strictEqual(_test.productNamesMatch('Sample Product', 'Different Product'), false);

function makeCell(text, onClick) {
  return {
    textContent: async () => text,
    click: async () => {
      if (onClick) onClick();
    }
  };
}

function makeCollection(items) {
  return {
    count: async () => items.length,
    nth: (index) => items[index],
    first: () => items[0] || {
      waitFor: async () => {
        throw new Error('No items');
      }
    },
    waitFor: async () => {}
  };
}

function makeProductRow({ articleNumber, name, onClick }) {
  const codeCell = makeCell(articleNumber);
  const nameCell = makeCell(name, onClick);

  return {
    locator: (selector) => {
      if (selector.includes('ArtNumber') || selector.includes('article number') || selector.includes('nth-child(3)')) {
        return makeCollection([codeCell]);
      }
      if (selector.includes('Name') || selector.includes('nth-child(2)')) {
        return makeCollection([nameCell]);
      }
      return makeCollection([]);
    }
  };
}

function makeRowsLocator(state, expectedName) {
  const wrongCodeRows = [
    makeProductRow({
      articleNumber: '12345',
      name: 'Flying Fish Hamachi (Hamachi Yellowtail)'
    })
  ];
  const nameRows = [
    makeProductRow({
      articleNumber: '94000',
      name: expectedName,
      onClick: () => {
        state.openedProduct = expectedName;
      }
    })
  ];

  return {
    count: async () => (state.search === expectedName ? nameRows : wrongCodeRows).length,
    nth: (index) => (state.search === expectedName ? nameRows : wrongCodeRows)[index],
    first: () => ({
      waitFor: async () => {}
    })
  };
}

function makeSearchInput() {
  return {
    waitFor: async () => {},
    isEditable: async () => true,
    click: async () => {}
  };
}

function makeMockPage(expectedName) {
  const state = {
    pendingSearch: '',
    search: '',
    typed: [],
    openedProduct: ''
  };
  const searchInput = makeSearchInput();
  const searchInputs = makeCollection([searchInput]);
  const rows = makeRowsLocator(state, expectedName);

  return {
    state,
    keyboard: {
      press: async (key) => {
        if (key === 'Backspace') state.pendingSearch = '';
        if (key === 'Enter') state.search = state.pendingSearch;
      },
      type: async (text) => {
        state.pendingSearch += text;
        state.typed.push(text);
      }
    },
    locator: (selector) => {
      if (selector.includes('advanced-table-search') || selector.includes('search')) return searchInputs;
      if (selector.includes('products/product-view')) return rows;
      return makeCollection([]);
    },
    goto: async () => {},
    waitForLoadState: async () => {},
    waitForTimeout: async () => {},
    getByText: () => ({
      waitFor: async () => {}
    })
  };
}

(async () => {
  const expectedName = "Shinshi Yukata 2-Ten Set (Men's Casual Summer Kimono 2-Piece Set)";
  const page = makeMockPage(expectedName);

  const product = await searchProduct(page, '94000', expectedName, { lookupTimeout: 1 });

  assert.strictEqual(product.actualProductName, expectedName);
  assert.strictEqual(page.state.openedProduct, expectedName);
  assert.deepStrictEqual(page.state.typed, ['94000', expectedName]);

  console.log('discount product search tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
