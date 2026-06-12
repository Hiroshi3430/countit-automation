'use strict';

const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseDelimited(text, delimiter = '\t') {
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter
  });

  return records.map((record, index) => ({
    __rowNumber: index + 2,
    ...record
  }));
}

function detectDelimiter(inputPathOrUrl) {
  const isUrl = /^https?:\/\//i.test(inputPathOrUrl);
  const url = isUrl ? new URL(inputPathOrUrl) : null;
  const pathname = url ? url.pathname : inputPathOrUrl;
  const extension = path.extname(pathname).toLowerCase();

  if (extension === '.tsv') return '\t';
  if (extension === '.csv') return ',';
  if (url?.hostname === 'docs.google.com' && pathname.includes('/spreadsheets/d/')) return ',';

  throw new Error('discount inputは .tsv または .csv の入力ファイルを指定してください');
}

function toGoogleSheetsCsvUrl(input) {
  const url = new URL(input);
  const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!match) return input;

  const id = match[1];
  const gid = url.searchParams.get('gid') || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

async function readInput(inputPathOrUrl) {
  if (!inputPathOrUrl) {
    throw new Error('Pass --input <tsv/csv path or URL>.');
  }

  const delimiter = detectDelimiter(inputPathOrUrl);

  if (/^https?:\/\//i.test(inputPathOrUrl)) {
    const csvUrl = toGoogleSheetsCsvUrl(inputPathOrUrl);
    const headers = {};
    if (process.env.GOOGLE_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`;
    }

    const response = await fetch(csvUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch input file: HTTP ${response.status} ${response.statusText}`);
    }
    return parseDelimited(await response.text(), delimiter);
  }

  const absolutePath = path.resolve(inputPathOrUrl);
  return parseDelimited(await fs.readFile(absolutePath, 'utf8'), delimiter);
}

module.exports = { detectDelimiter, parseDelimited, readInput, toGoogleSheetsCsvUrl };
