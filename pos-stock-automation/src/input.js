'use strict';

const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseStockInput(text) {
  const allRows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: '\t'
  });

  if (allRows.length === 0) {
    throw new Error('CSVにデータがありません');
  }

  const settingRow = allRows.find((row) => row.type === 'setting');
  const inventoryDescription = settingRow?.description?.trim();

  if (!inventoryDescription) {
    throw new Error('CSVのsetting行にdescriptionを入力してください');
  }

  const records = allRows.filter((row) => row.type === 'item');

  if (records.length === 0) {
    throw new Error('CSVにitem行がありません');
  }

  for (const [index, item] of records.entries()) {
    if (!item.product_code?.trim()) {
      throw new Error(`CSV item ${index + 1}件目: product_code が空です`);
    }

    if (!item.amount?.trim()) {
      throw new Error(`CSV item ${index + 1}件目: amount が空です`);
    }

    if (!item.product_name?.trim()) {
      throw new Error(`CSV item ${index + 1}件目: product_name が空です`);
    }

    if (!/^\d+$/.test(item.amount.trim())) {
      throw new Error(
        `CSV item ${index + 1}件目: amount は整数で入力してください。現在値="${item.amount}"`
      );
    }
  }

  const duplicatedCodes = records
    .map((item) => item.product_code)
    .filter((code, index, array) => array.indexOf(code) !== index);

  if (duplicatedCodes.length > 0) {
    console.warn(
      `注意: CSV内に重複商品コードがあります。CountIT側で合算される想定です: ${[...new Set(duplicatedCodes)].join(', ')}`
    );
  }

  return { inventoryDescription, records };
}

async function readStockInput(inputPath) {
  const absolutePath = path.resolve(inputPath);
  return parseStockInput(await fs.readFile(absolutePath, 'utf8'));
}

module.exports = { parseStockInput, readStockInput };
