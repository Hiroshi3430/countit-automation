'use strict';

const VALID_MODES = ['dry-run', 'semi-auto', 'full-auto'];

function parseArgs(argv) {
  const args = {
    stockCountDescription: '',
    labelPrintName: '',
    appendToLabelPrintName: '',
    mode: null,
    limit: null,
    headed: true,
    slowMo: 0
  };

  let modeFlag = null;
  let dryRunFlag = false;
  let semiAutoFlag = false;
  let stockCountFlagGiven = false;
  let labelPrintNameFlagGiven = false;
  let appendFlagGiven = false;
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--stock-count') {
      args.stockCountDescription = argv[++i] || '';
      stockCountFlagGiven = true;
    } else if (arg === '--label-print-name') {
      args.labelPrintName = argv[++i] || '';
      labelPrintNameFlagGiven = true;
    } else if (arg === '--append-to-label-print') {
      args.appendToLabelPrintName = argv[++i] || '';
      appendFlagGiven = true;
    } else if (arg === '--dry-run') {
      dryRunFlag = true;
    } else if (arg === '--semi-auto') {
      semiAutoFlag = true;
    } else if (arg === '--mode') {
      modeFlag = argv[++i];
    } else if (arg === '--limit') {
      args.limit = Number(argv[++i]);
    } else if (arg === '--headless') {
      args.headed = false;
    } else if (arg === '--headed') {
      args.headed = true;
    } else if (arg === '--slow-mo') {
      args.slowMo = Number(argv[++i]);
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const oldStockOrLabelFlagUsed = stockCountFlagGiven || labelPrintNameFlagGiven || appendFlagGiven;

  if (positional.length > 0 && oldStockOrLabelFlagUsed) {
    throw new Error(
      'Do not mix positional arguments ("<Stock Count>" ["<Print Label>" | add "<Print Label>"]) ' +
      'with --stock-count / --label-print-name / --append-to-label-print. Use one form only.'
    );
  }

  if (positional.length > 3) {
    throw new Error(`Too many arguments: ${positional.slice(3).join(' ')}`);
  }

  if (positional.length > 0) {
    const [stockCount, second, third] = positional;
    args.stockCountDescription = stockCount || '';

    if (second === 'add') {
      if (positional.length < 3) {
        throw new Error('Pass the target Print Label name after "add": "<Stock Count>" add "<Print Label>".');
      }
      args.appendToLabelPrintName = third || '';
    } else if (second !== undefined) {
      if (positional.length > 2) {
        throw new Error(`Too many arguments: ${positional.slice(2).join(' ')}`);
      }
      args.labelPrintName = second;
    }
  }

  if (modeFlag !== null && (dryRunFlag || semiAutoFlag)) {
    throw new Error('Use either --mode or --dry-run/--semi-auto, not both.');
  }

  if (modeFlag !== null) {
    if (!VALID_MODES.includes(modeFlag)) {
      throw new Error(`--mode must be one of: ${VALID_MODES.join(', ')}.`);
    }
    args.mode = modeFlag;
  } else if (dryRunFlag && semiAutoFlag) {
    throw new Error('Use only one mode flag: --dry-run or --semi-auto.');
  } else if (dryRunFlag) {
    args.mode = 'dry-run';
  } else if (semiAutoFlag) {
    args.mode = 'semi-auto';
  } else {
    args.mode = 'full-auto';
  }

  args.dryRun = args.mode === 'dry-run';
  args.semiAuto = args.mode === 'semi-auto';
  args.fullAuto = args.mode === 'full-auto';

  args.stockCountDescription = args.stockCountDescription.trim();
  args.labelPrintName = args.labelPrintName.trim();
  args.appendToLabelPrintName = args.appendToLabelPrintName.trim();

  if (!args.stockCountDescription) {
    throw new Error('Pass a Stock Count name as the first argument, or use --stock-count "<Stock Count name>".');
  }
  if (args.appendToLabelPrintName && args.labelPrintName) {
    throw new Error('--append-to-label-print and --label-print-name must not be used together.');
  }
  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit <= 0)) {
    throw new Error('--limit must be a positive integer.');
  }

  return args;
}

module.exports = { parseArgs, VALID_MODES };
