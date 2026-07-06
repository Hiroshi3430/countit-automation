'use strict';

const assert = require('assert');
const { parseArgs } = require('../src/args');

function baseArgv(...rest) {
  return ['node', 'main.js', ...rest];
}

// --- --mode: three valid modes ---
assert.strictEqual(parseArgs(baseArgv('Stock', '--mode', 'dry-run')).mode, 'dry-run');
assert.strictEqual(parseArgs(baseArgv('Stock', '--mode', 'semi-auto')).mode, 'semi-auto');
assert.strictEqual(parseArgs(baseArgv('Stock', '--mode', 'full-auto')).mode, 'full-auto');

// mode defaults to full-auto when no mode flag is given
{
  const args = parseArgs(baseArgv('Stock'));
  assert.strictEqual(args.mode, 'full-auto');
  assert.strictEqual(args.dryRun, false);
  assert.strictEqual(args.semiAuto, false);
  assert.strictEqual(args.fullAuto, true);
}

// derived dryRun/semiAuto/fullAuto booleans track args.mode
{
  const args = parseArgs(baseArgv('Stock', '--mode', 'dry-run'));
  assert.strictEqual(args.dryRun, true);
  assert.strictEqual(args.semiAuto, false);
  assert.strictEqual(args.fullAuto, false);
}

// --- positional: new Print Label (Stock Count name only) ---
{
  const args = parseArgs(baseArgv('Stock Count A'));
  assert.strictEqual(args.stockCountDescription, 'Stock Count A');
  assert.strictEqual(args.labelPrintName, '');
  assert.strictEqual(args.appendToLabelPrintName, '');
}

// --- positional: new Print Label with custom name ---
{
  const args = parseArgs(baseArgv('Stock Count A', 'Custom Label'));
  assert.strictEqual(args.stockCountDescription, 'Stock Count A');
  assert.strictEqual(args.labelPrintName, 'Custom Label');
  assert.strictEqual(args.appendToLabelPrintName, '');
}

// --- positional: append via "add" ---
{
  const args = parseArgs(baseArgv('Stock Count A', 'add', 'Existing Label'));
  assert.strictEqual(args.stockCountDescription, 'Stock Count A');
  assert.strictEqual(args.appendToLabelPrintName, 'Existing Label');
  assert.strictEqual(args.labelPrintName, '');
}

// --- positional combined with --mode/--limit (allowed) ---
{
  const args = parseArgs(baseArgv('Stock Count A', 'add', 'Existing Label', '--mode', 'semi-auto', '--limit', '3'));
  assert.strictEqual(args.mode, 'semi-auto');
  assert.strictEqual(args.limit, 3);
  assert.strictEqual(args.appendToLabelPrintName, 'Existing Label');
}

// --- old option form still works ---
{
  const args = parseArgs(baseArgv('--stock-count', 'Stock Count A', '--label-print-name', 'Custom Label', '--mode', 'dry-run'));
  assert.strictEqual(args.stockCountDescription, 'Stock Count A');
  assert.strictEqual(args.labelPrintName, 'Custom Label');
  assert.strictEqual(args.mode, 'dry-run');
}

// --- old mode flags still work and convert to args.mode ---
assert.strictEqual(parseArgs(baseArgv('--stock-count', 'Stock', '--dry-run')).mode, 'dry-run');
assert.strictEqual(parseArgs(baseArgv('--stock-count', 'Stock', '--semi-auto')).mode, 'semi-auto');
assert.strictEqual(parseArgs(baseArgv('--stock-count', 'Stock')).mode, 'full-auto');

// --- old --append-to-label-print form still works ---
{
  const args = parseArgs(baseArgv('--stock-count', 'Stock', '--append-to-label-print', 'Existing Label', '--semi-auto'));
  assert.strictEqual(args.appendToLabelPrintName, 'Existing Label');
  assert.strictEqual(args.mode, 'semi-auto');
}

// --- conflict: positional stock count + old --stock-count ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', '--stock-count', 'Stock Count B')),
  /Do not mix positional arguments/
);

// --- conflict: positional label name + old --label-print-name ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', 'Custom Label', '--label-print-name', 'Other Label')),
  /Do not mix positional arguments/
);

// --- conflict: positional add + old --append-to-label-print ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', 'add', 'Existing Label', '--append-to-label-print', 'Other Label')),
  /Do not mix positional arguments/
);

// --- conflict: --mode with --dry-run/--semi-auto ---
assert.throws(
  () => parseArgs(baseArgv('Stock', '--mode', 'dry-run', '--dry-run')),
  /Use either --mode or --dry-run\/--semi-auto/
);
assert.throws(
  () => parseArgs(baseArgv('Stock', '--mode', 'semi-auto', '--semi-auto')),
  /Use either --mode or --dry-run\/--semi-auto/
);

// --- conflict: --dry-run and --semi-auto together (pre-existing rule) ---
assert.throws(
  () => parseArgs(baseArgv('Stock', '--dry-run', '--semi-auto')),
  /Use only one mode flag/
);

// --- conflict: --label-print-name and --append-to-label-print together (pre-existing rule) ---
assert.throws(
  () => parseArgs(['node', 'main.js', '--stock-count', 'Stock', '--label-print-name', 'New', '--append-to-label-print', 'Existing']),
  /must not be used together/
);

// --- invalid mode value ---
assert.throws(
  () => parseArgs(baseArgv('Stock', '--mode', 'turbo')),
  /--mode must be one of/
);

// --- missing stock count entirely ---
assert.throws(
  () => parseArgs(baseArgv()),
  /Pass a Stock Count name/
);
assert.throws(
  () => parseArgs(baseArgv('--mode', 'dry-run')),
  /Pass a Stock Count name/
);

// --- "add" without a target Print Label name ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', 'add')),
  /Pass the target Print Label name after "add"/
);

// --- too many positional arguments (second is not "add") ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', 'Custom Label', 'Extra')),
  /Too many arguments/
);

// --- too many positional arguments (4+ args) ---
assert.throws(
  () => parseArgs(baseArgv('Stock Count A', 'add', 'Existing Label', 'Extra')),
  /Too many arguments/
);

// --- unknown flag still rejected ---
assert.throws(
  () => parseArgs(baseArgv('Stock', '--bogus-flag')),
  /Unknown argument/
);

console.log('label print args tests passed');
