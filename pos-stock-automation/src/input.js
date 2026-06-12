'use strict';

const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');

function detectDelimiterFromExtension(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();

  if (extension === '.tsv') return '\t';
  if (extension === '.csv') return ',';

  throw new Error('stock inputは .tsv または .csv の入力ファイルを指定してください');
}

function parseStockInput(text, delimiter = '\t') {
  const allRows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter
  });

  if (allRows.length === 0) {
    throw new Error('TSV/CSV入力ファイルにデータがありません');
  }

  const settingRow = allRows.find((row) => row.type === 'setting');
  const inventoryDescription = settingRow?.description?.trim();

  if (!inventoryDescription) {
    throw new Error('TSV/CSV入力ファイルのsetting行にdescriptionを入力してください');
  }

  const records = allRows.filter((row) => row.type === 'item');

  if (records.length === 0) {
    throw new Error('TSV/CSV入力ファイルにitem行がありません');
  }

  for (const [index, item] of records.entries()) {
    if (!item.product_code?.trim()) {
      throw new Error(`TSV/CSV入力ファイル item ${index + 1}件目: product_code が空です`);
    }

    if (!item.amount?.trim()) {
      throw new Error(`TSV/CSV入力ファイル item ${index + 1}件目: amount が空です`);
    }

    if (!item.product_name?.trim()) {
      throw new Error(`TSV/CSV入力ファイル item ${index + 1}件目: product_name が空です`);
    }

    if (!/^\d+$/.test(item.amount.trim())) {
      throw new Error(
        `TSV/CSV入力ファイル item ${index + 1}件目: amount は整数で入力してください。現在値="${item.amount}"`
      );
    }
  }

  const duplicatedCodes = records
    .map((item) => item.product_code)
    .filter((code, index, array) => array.indexOf(code) !== index);

  if (duplicatedCodes.length > 0) {
    console.warn(
      `注意: TSV/CSV入力ファイル内に重複商品コードがあります。CountIT側で合算される想定です: ${[...new Set(duplicatedCodes)].join(', ')}`
    );
  }

  return { inventoryDescription, records };
}

async function readStockInput(inputPath) {
  const absolutePath = path.resolve(inputPath);
  const delimiter = detectDelimiterFromExtension(absolutePath);
  return parseStockInput(await fs.readFile(absolutePath, 'utf8'), delimiter);
}

module.exports = { detectDelimiterFromExtension, parseStockInput, readStockInput };
