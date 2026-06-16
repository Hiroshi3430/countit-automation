# CLAUDE.md

## Project overview

This repository contains CountIT automation helpers for Atariya business operations. It is not a general-purpose public library. The tools are Node.js scripts that use Playwright to assist with CountIT browser workflows.

Stability and preserving existing business logic are more important than aggressive refactoring.

## Main directories and files

- `README.md`: top-level setup, operation, safety, and environment notes.
- `ENVIRONMENT.md`: current development environment notes and migration cautions.
- `AGENTS.md`: required security rules for agents working in this repo.
- `pos-common/`: shared CountIT login, company-switching, and selector helpers.
- `pos-discount-automation/`: discount creation, replacement, and ending workflow.
- `pos-discount-automation/src/`: discount automation source code.
- `pos-discount-automation/test/`: Node `assert` tests for discount logic, input parsing, and logging.
- `pos-discount-automation/examples/`: committed sample discount input files.
- `pos-discount-automation/input/`: local operational input files; do not inspect or commit real data.
- `pos-stock-automation/`: Inventory Counts entry helper workflow.
- `pos-stock-automation/src/`: stock automation source code.
- `pos-stock-automation/test/`: Node `assert` tests for stock input parsing.
- `pos-stock-automation/examples/`: committed sample stock input files.
- `pos-stock-automation/input/`: local operational input files; do not inspect or commit real data.

Ignored/generated directories may exist locally, including `node_modules/`, `runs/`, screenshots, Playwright reports, and test results.

## Business context

- `pos-discount-automation` registers CountIT product discounts, ends existing discounts, and replaces existing discounts from TSV/CSV input.
- `pos-stock-automation` assists with CountIT Inventory Counts entry from TSV/CSV input.
- `pos-common` holds shared CountIT login and company-selection behavior.
- Input files are operational business data and are intentionally kept local.
- CountIT browser flows depend on current screen structure, company settings, product codes, product names, and business rules.
- Unknown / needs confirmation: exact production CountIT environment, complete operational approval process, and all staff-owned spreadsheet workflows.

## Safety rules

- Do not read, print, summarize, copy, edit, or expose `.env`, `.env.local`, service account JSON files, credentials, tokens, API keys, screenshots, logs, or real operational input files.
- Use `.env.example` only if environment variable names need to be documented.
- Never include environment variable values in responses, logs, tests, docs, or screenshots.
- Do not overwrite spreadsheet data or local input data.
- Do not delete files, triggers, sheets, logs, or data unless explicitly confirmed.
- Treat `full-auto` workflows as high risk; recommend `dry-run` first, then `semi-auto`, then `full-auto` only after validation.
- For stock automation, `Process` must not be automated; existing docs state that no mode presses `Process`.

## What Claude Code should avoid

- Do not modify source code during a review unless explicitly asked.
- Do not change business logic casually, especially discount decision rules, product-name matching, date/time handling, save/add behavior, or stock processing boundaries.
- Do not rename exported functions, script entry points, package scripts, or files without confirmation.
- Do not inspect `input/*.tsv`, `input/*.csv`, `.env*`, `runs/`, screenshots, logs, or other private/generated data.
- Do not introduce broad refactors, new dependencies, TypeScript migration, formatting churn, or Playwright Test migration unless explicitly requested.
- Do not assume CountIT UI labels/selectors or company settings are stable without evidence.

## Coding conventions

- Runtime is Node.js with CommonJS modules.
- Source files use `'use strict';`, `require(...)`, and `module.exports`.
- Tests are plain Node scripts using `assert`, not Playwright Test.
- Parsing uses `csv-parse/sync` for TSV/CSV input.
- Input validation throws or returns explicit review/status results with Japanese and English user-facing messages already present.
- Existing code prefers small focused modules such as `input.js`, `discountLogic.js`, `auth.js`, `selectors.js`, `logger.js`, and page workflow modules.
- Unknown / needs confirmation: formal formatter, lint tool, naming policy beyond the existing style.

## How to run, test, and lint

Install dependencies per subproject if needed:

```bash
cd pos-discount-automation
npm install
npx playwright install chromium

cd ../pos-stock-automation
npm install
npx playwright install chromium
```

Local checks that should not access CountIT:

```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js

cd pos-discount-automation
npm test

cd ../pos-stock-automation
npm test
```

CountIT-accessing commands:

```bash
cd pos-discount-automation
npm run discounts:dry-run
npm run discounts:semi-auto
npm run discounts:full-auto

cd ../pos-stock-automation
npm run stock:dry-run
npm run stock:semi-auto
npm run stock:full-auto
```

Only run CountIT-accessing commands when explicitly requested and after confirming the target input file and mode. Prefer `dry-run`.

Unknown / needs confirmation: CI provider, required Node.js version, and any formal lint command.

## Git workflow for safe PRs

- Start from a clean working tree when possible.
- Keep changes small and scoped to the requested area.
- Do not commit ignored files, generated files, `runs/`, screenshots, logs, `.env*`, or real input data.
- Review with `git status --short` and `git diff` before proposing a commit.
- Include tests/checks run in the PR description.
- Document any behavior-affecting change, CountIT workflow risk, and manual verification needed.

## Recommended review scope for Claude Code

Focus review effort on:

- Business-rule preservation in `pos-discount-automation/src/discountLogic.js`.
- Input validation and delimiter handling in each `src/input.js`.
- Safety behavior around `dry-run`, `semi-auto`, `full-auto`, Save/Add, confirm dialogs, and stock `Process`.
- Shared login/company-switching changes in `pos-common/`.
- Selector fragility and CountIT UI assumptions in `selectors.js` and page modules.
- Test coverage for date/time edge cases, duplicate product codes, operation modes, and failure paths.
- Accidental exposure of secrets or private operational data.

Review with the assumption that conservative fixes are preferred. If details are unclear, write `Unknown / needs confirmation` instead of guessing.
