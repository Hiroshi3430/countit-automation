'use strict';

const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');

function parseDelimited(text, delimiter = ',') {
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
  const pathname = /^https?:\/\//i.test(inputPathOrUrl)
    ? new URL(inputPathOrUrl).pathname
    : inputPathOrUrl;

  return path.extname(pathname).toLowerCase() === '.tsv' ? '\t' : ',';
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
    throw new Error('Pass --input <csv path or Google Sheets URL>.');
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
      throw new Error(`Failed to fetch input CSV: HTTP ${response.status} ${response.statusText}`);
    }
    return parseDelimited(await response.text(), delimiter);
  }

  const absolutePath = path.resolve(inputPathOrUrl);
  return parseDelimited(await fs.readFile(absolutePath, 'utf8'), delimiter);
}

module.exports = { detectDelimiter, parseDelimited, readInput, toGoogleSheetsCsvUrl };
