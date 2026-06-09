# CountIT Automation Helper

## 概要

このリポジトリは、CountIT操作補助のための試作的な automation helper です。
一般向けのライブラリやサポート付きツールとして公開しているものではありません。
利用する場合は各自の責任で、対象環境・画面構造・業務ルールを確認してください。

- `pos-discount-automation`
  - CountITの商品割引登録、既存割引の終了、既存割引の置き換えを行います。
- `pos-stock-automation`
  - CountITの Inventory Counts 入力を、ローカルの入力ファイルから補助します。
- `pos-common`
  - CountITログイン、会社切替など、各自動化ツールで共通して使う処理をまとめています。

## 現行運用方式

- 現在の運用は Node script 型です。
- 各プロジェクトのフォルダで `npm run ...` を実行します。
- 現行運用では `npx playwright test` は使いません。
- 旧 Playwright Test 型のファイルは削除済みです。

## ディレクトリ構成

```text
Automation/
  .env
  .env.example
  .gitignore
  README.md
  pos-common/
  pos-discount-automation/
  pos-stock-automation/
```

- `.env`: 実行時のローカル設定ファイルです。Git管理しません。
- `.env.example`: `.env` を作るためのテンプレートです。
- `pos-common/`: CountITログイン・会社切替の共通処理です。
- `pos-discount-automation/`: 割引設定用の自動化ツールです。
- `pos-stock-automation/`: Inventory Counts入力用の自動化ツールです。

## .env 設定

`.env` は必ず `Automation/.env` に置きます。各プロジェクト配下には `.env` を置かないでください。

初回は `.env.example` をコピーして作成します。

```bash
cp .env.example .env
```

必須項目:

```text
COUNTIT_EMAIL=
COUNTIT_PASSWORD=
COUNTIT_COMPANY_NAME=
```

任意項目:

```text
COUNTIT_COMPANY_NAME_DISCOUNT=
COUNTIT_COMPANY_NAME_STOCK=
COUNTIT_BASE_URL=
DEBUG_COUNTIT_COMPANY=
GOOGLE_ACCESS_TOKEN=
```

通常は `COUNTIT_EMAIL`、`COUNTIT_PASSWORD`、`COUNTIT_COMPANY_NAME` の3つだけで運用できます。

discount と stock で別の CountIT会社を使う場合だけ、`COUNTIT_COMPANY_NAME_DISCOUNT` または `COUNTIT_COMPANY_NAME_STOCK` を設定します。`COUNTIT_BASE_URL` は通常不要です。`DEBUG_COUNTIT_COMPANY` は会社名取得や会社切替で問題が起きた時だけ使います。`GOOGLE_ACCESS_TOKEN` は、非公開のGoogle Sheets CSV exportを読む必要がある場合だけ使います。

`.env` と `.env.local` は絶対にGit管理しないでください。

## input と examples の扱い

- `input/*.csv` は実運用で使うローカル入力ファイルです。
- `input/*.csv` はGit管理しません。
- 各利用者がローカルで作成して使います。
- `examples/*.csv` はサンプルファイルです。
- `examples/*.csv` はGit管理します。
- 初回は `examples` から `input` にコピーして使います。

```bash
cp pos-discount-automation/examples/discounts.csv pos-discount-automation/input/discount_input.csv
cp pos-stock-automation/examples/stock_input.example.csv pos-stock-automation/input/stock_input.csv
```

## 安全な実行順序

必ず以下の順番で使ってください。

1. `dry-run`
2. `semi-auto`
3. `full-auto`

- `dry-run`: CountIT画面を確認し、判定ログを出します。保存はしません。
- `semi-auto`: Save/Add の直前で止まり、ターミナルで Enter を押すまで保存しません。
- `full-auto`: 自動で保存します。十分に `dry-run` と `semi-auto` で確認した後だけ使ってください。

## CountITにアクセスするコマンド

以下のコマンドはブラウザを起動し、CountITにアクセスします。

discount:

```bash
cd pos-discount-automation
npm run discounts:dry-run
npm run discounts:semi-auto
npm run discounts:full-auto
```

stock:

```bash
cd pos-stock-automation
npm run stock:dry-run
npm run stock:semi-auto
npm run stock:full-auto
```

以下はローカル確認のみで、CountITにはアクセスしません。

```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
```

```bash
cd pos-discount-automation && npm test
cd pos-stock-automation && npm test
```

## DEBUG_COUNTIT_COMPANY

会社名取得や会社切替で問題が起きた時だけ使います。

```bash
DEBUG_COUNTIT_COMPANY=1 npm run discounts:dry-run
DEBUG_COUNTIT_COMPANY=1 npm run stock:dry-run
```

DEBUG時は、CountIT画面上の会社名や候補テキストがログに出ます。email/password は出ない設計ですが、外部共有する場合はログ内容に注意してください。

## 生成物

以下は実行時に作られる生成物です。Git管理しません。

- `runs/`
- `result-log.csv`
- `screenshots/`
- `playwright-report/`
- `test-results/`
- debug画像
- `node_modules/`

## 開発・確認コマンド

CountITにアクセスしない確認:

```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
```

各プロジェクトのテスト:

```bash
cd pos-discount-automation && npm test
cd pos-stock-automation && npm test
```

## 今後の共通化候補

以下はまだ共通化していません。現時点では安定運用を優先しています。

- result logger の共通化
- browser起動処理の共通化
- input parser の共通化
- stock automation への `DangerousAutomationError` 導入
