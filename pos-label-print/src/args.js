'use strict';

function parseArgs(argv) {
  const args = {
    stockCountDescription: '',
    labelPrintName: '',
    appendToLabelPrintName: '',
    dryRun: false,
    semiAuto: false,
    limit: null,
    headed: true,
    slowMo: 0
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--stock-count') args.stockCountDescription = argv[++i] || '';
    else if (arg === '--label-print-name') args.labelPrintName = argv[++i] || '';
    else if (arg === '--append-to-label-print') args.appendToLabelPrintName = argv[++i] || '';
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--semi-auto') args.semiAuto = true;
    else if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--headless') args.headed = false;
    else if (arg === '--headed') args.headed = true;
    else if (arg === '--slow-mo') args.slowMo = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  args.stockCountDescription = args.stockCountDescription.trim();
  args.labelPrintName = args.labelPrintName.trim();
  args.appendToLabelPrintName = args.appendToLabelPrintName.trim();
  if (!args.stockCountDescription) {
    throw new Error('Pass --stock-count "<Stock Count Description>".');
  }
  if (args.appendToLabelPrintName && args.labelPrintName) {
    throw new Error('--append-to-label-print and --label-print-name must not be used together.');
  }
  if (args.dryRun && args.semiAuto) {
    throw new Error('Use only one mode flag: --dry-run or --semi-auto.');
  }
  if (args.limit !== null && (!Number.isInteger(args.limit) || args.limit <= 0)) {
    throw new Error('--limit must be a positive integer.');
  }

  return args;
}

module.exports = { parseArgs };
