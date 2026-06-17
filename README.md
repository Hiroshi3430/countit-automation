# CountIT Automation Helper

## 概要

このリポジトリは、CountIT操作補助のための automation helper です。
一般向けのライブラリやサポート付きツールとして公開しているものではありません。
利用する場合は各自の責任で、対象環境・画面構造・業務ルールを確認してください。

| ツール | 用途 |
|--------|------|
| `pos-discount-automation` | CountITの商品割引登録・既存割引の終了・既存割引の置き換え |
| `pos-stock-automation` | CountITの Inventory Counts 入力補助（入力ファイルから） |
| `pos-label-print` | CountIT の Stock Count から値札印刷用 Print labels ファイルを作成・追記 |
| `pos-common` | CountITログイン・会社切替など、各ツール共通処理 |

## 現行運用方式

- 現在の運用は Node script 型です
- `pos-discount-automation` と `pos-stock-automation` は各プロジェクトフォルダで `npm run ...` を実行します
- `pos-label-print` は **リポジトリルート** で `npm run label-print -- ...` を実行します
- `npx playwright test` は使いません

## 必要環境

- Node.js
- npm
- Playwright Chromium
- CountIT アカウント
- リポジトリルートの `.env`（ログイン情報）
- 各自動化ツール用の入力ファイル（discount / stock のみ）

初期開発と動作確認は macOS で行っています。Windows では未検証ですが、Node.js と Playwright ベースのため動作する可能性はあります。Windows で使う場合は `npm install`、Playwright browser、`.env` の場所、入力ファイルの文字コード・改行コード、PowerShell/Git Bash のコマンド差に注意してください。

---

## セットアップ手順

### 1. リポジトリを取得

```bash
git clone <repository-url>
cd countit-automation
```

### 2. `.env` を作成

```bash
cp .env.example .env
```

`.env` に CountIT のログイン情報と会社名を設定します:

```text
COUNTIT_EMAIL=
COUNTIT_PASSWORD=
COUNTIT_COMPANY_NAME=
```

discount と stock で別の CountIT 会社を使う場合のみ、必要に応じて以下も設定します:

```text
COUNTIT_COMPANY_NAME_DISCOUNT=
COUNTIT_COMPANY_NAME_STOCK=
COUNTIT_COMPANY_NAME_LABEL=
```

`.env` は絶対に Git 管理しないでください。

### 3. 依存関係をインストール

**pos-label-print はリポジトリルートで:**

```bash
npm install
npx playwright install chromium
```

**pos-discount-automation:**

```bash
cd pos-discount-automation
npm install
npx playwright install chromium
cd ..
```

**pos-stock-automation:**

```bash
cd pos-stock-automation
npm install
npx playwright install chromium
cd ..
```

### 4. サンプル入力ファイルをコピー（discount / stock のみ）

```bash
cp pos-discount-automation/examples/discounts.tsv pos-discount-automation/input/discount_input.tsv
cp pos-stock-automation/examples/stock_input.example.tsv pos-stock-automation/input/stock_input.tsv
```

`input/*.tsv` は Git 管理しません。各利用者がローカルで作成・管理してください。
`pos-label-print` は入力ファイル不要です（引数で Stock Count 名を指定します）。

### 5. ローカルテストを実行

すべてのコマンドは **リポジトリルート** で実行してください。

```bash
node --check pos-common/*.js
node --check pos-label-print/src/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js

# サブシェルで実行することでカレントディレクトリが変わりません
npm run test:label-print
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
```

### 6. CountIT 操作は必ず `dry-run` から開始

`dry-run` で読み取りと判定ログを確認した後、`semi-auto` → 通常モードの順で進めてください。

---

## ディレクトリ構成

```text
countit-automation/
  .env                    ← ローカルのみ・Git管理外
  .env.example            ← テンプレート（コミット可）
  .gitignore
  README.md
  CLAUDE.md               ← Claude Code向け作業指示
  AGENTS.md               ← 全AIエージェント共通セキュリティ規則
  package.json            ← pos-label-print 用ルートスクリプト
  package-lock.json
  pos-common/             ← ログイン・会社切替 共通処理
  pos-discount-automation/ ← 割引自動化
  pos-stock-automation/   ← 在庫入力補助
  pos-label-print/        ← 値札印刷ファイル作成補助
```

---

## .env 設定

`.env` は必ずリポジトリルートに置きます。各プロジェクト配下には `.env` を置かないでください。

必須項目:

```text
COUNTIT_EMAIL=
COUNTIT_PASSWORD=
COUNTIT_COMPANY_NAME=
```

任意項目:

```text
COUNTIT_COMPANY_NAME_DISCOUNT=   ← discount専用会社名（通常不要）
COUNTIT_COMPANY_NAME_STOCK=      ← stock専用会社名（通常不要）
COUNTIT_COMPANY_NAME_LABEL=      ← label-print専用会社名（通常不要）
COUNTIT_BASE_URL=                 ← 通常不要
DEBUG_COUNTIT_COMPANY=           ← 会社切替トラブル時のみ
GOOGLE_ACCESS_TOKEN=             ← 非公開CSVアクセスが必要な場合のみ
```

通常は `COUNTIT_EMAIL`、`COUNTIT_PASSWORD`、`COUNTIT_COMPANY_NAME` の3つだけで運用できます。

---

## 安全な実行順序

**必ず以下の順番で使ってください。**

| ステップ | モード | 説明 |
|---------|--------|------|
| 1 | `--dry-run` | CountIT を読み取り、ログを出力する。Print labels は作成・保存しない（pos-label-print は Stock Count の Save のみ実行） |
| 2 | `--semi-auto` | Save直前でターミナルが止まる。Enter後にのみ保存される |
| 3 | 通常（引数なし） | 自動でSaveまで実行。dry-runとsemi-autoで十分確認後のみ |

---

## pos-label-print の使い方

Stock Count の Current stock が 0 以下の商品を検出し、CountIT の Print labels ファイルを作成します（値札印刷用）。

**重要な制約:**
- Stock Count の在庫データは「読み取り後に Save して離脱」します
- Print labels も「Save のみ」で、**+Process（在庫処理）は絶対に実行しません**

### 基本コマンド（リポジトリルートから実行）

```bash
# 内容確認のみ（Print labels を作成・保存しない。Stock Count の Save のみ実行）
npm run label-print -- --stock-count "<Stock Count名>" --dry-run

# 3件のみ追加して動作確認（semi-auto推奨）
npm run label-print -- --stock-count "<Stock Count名>" --semi-auto --limit 3

# 全件追加（semi-auto）
npm run label-print -- --stock-count "<Stock Count名>" --semi-auto

# 全件追加（通常モード・自動Save）
npm run label-print -- --stock-count "<Stock Count名>"
```

### 既存 Print labels への追記（appendモード）

```bash
# 既存の Print labels ファイルに新しい Stock Count の商品を追記
npm run label-print -- \
  --append-to-label-print "<Stock Count名>" \
  --stock-count "<別のStock Count名>" \
  --semi-auto
```

append モードでは:
- 既存行の商品コードを読み取り、重複商品はスキップします
- 読み取れない行がある場合は安全のため実行を停止します
- 最初の空白行から追記を開始します

### カスタムラベル名

```bash
# Print labels ファイル名を Stock Count 名と別に指定
npm run label-print -- --stock-count "<Stock Count名>" --label-print-name "新入荷ラベル"
```

### --limit オプション

```bash
# 最初のN件だけ追加（大量商品の段階テストに便利）
npm run label-print -- --stock-count "<Stock Count名>" --semi-auto --limit 3
```

全件の検出は行いますが、Print labels への追加は最初の N 件のみに絞ります。

### semi-auto モードの操作

1. コマンドを実行するとブラウザが開き、Stock Count を読み取ります
2. Print labels が作成され、商品が入力されます
3. ブラウザに商品が入力された状態でターミナルが止まります
4. ブラウザで内容を確認します
5. ターミナルで **Enter** を押すと自動化が Save します
6. **Ctrl+C** を押すと Save 前にキャンセルできます

### ログ

各実行は `pos-label-print/logs/` 配下に JSON ログを生成します。ログは Git 管理外です。

---

## pos-discount-automation の使い方

```bash
cd pos-discount-automation
npm run discounts:dry-run
npm run discounts:semi-auto
npm run discounts:full-auto
```

入力ファイル: `pos-discount-automation/input/discount_input.tsv`

---

## pos-stock-automation の使い方

```bash
cd pos-stock-automation
npm run stock:dry-run
npm run stock:semi-auto
npm run stock:full-auto
```

入力ファイル: `pos-stock-automation/input/stock_input.tsv`

---

## ローカル確認コマンド（CountIT にアクセスしない）

すべてのコマンドは **リポジトリルート** で実行してください。

```bash
# 構文チェック
node --check pos-common/*.js
node --check pos-label-print/src/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js

# ロジックテスト（サブシェルで実行することでカレントディレクトリが変わりません）
npm run test:label-print
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
```

---

## コミットしてよいファイル / してはいけないファイル

**コミットしてよい:**
- `pos-*/src/*.js`, `pos-common/*.js`（ソースコード）
- `pos-*/test/*.js`（テスト）
- `pos-*/examples/*.tsv`（サンプル入力）
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `pos-*/README.md`（ドキュメント）
- `.env.example`, `config.example.json`（設定テンプレート）
- `.gitignore`, `package.json`, `package-lock.json`

**絶対にコミットしてはいけない:**
- `.env`, `.env.local`（認証情報）
- `pos-*/input/*.tsv`, `pos-*/input/*.csv`（業務入力データ）
- `pos-label-print/logs/`（実行ログ）
- `pos-label-print/debug/`（デバッグスクリーンショット）
- `pos-label-print/recordings/`（Playwright録画）
- `auth.json`, `cookies.json` 等の認証・セッションファイル
- `node_modules/`, `runs/`, `playwright-report/`, `test-results/`

---

## DEBUG_COUNTIT_COMPANY

会社名取得や会社切替で問題が起きたときのみ使います。

```bash
DEBUG_COUNTIT_COMPANY=1 npm run label-print -- --stock-count "..." --dry-run
DEBUG_COUNTIT_COMPANY=1 npm run discounts:dry-run
DEBUG_COUNTIT_COMPANY=1 npm run stock:dry-run
```

デバッグ時は CountIT 画面上の会社名や候補テキストがログに出ます。メール・パスワードは出力されない設計ですが、外部共有する場合はログ内容に注意してください。

---

## 生成物（Git管理外）

以下は実行時に作られる生成物です。Git 管理しません。

- `pos-label-print/logs/` — 実行ログ（JSON）
- `pos-label-print/debug/` — デバッグスクリーンショット
- `node_modules/`
- `runs/`
- `playwright-report/`, `test-results/`, `blob-report/`
- debug画像（`.png`）

---

## 今後の共通化候補

以下はまだ共通化していません。現時点では安定運用を優先しています。

- result logger の共通化（discount/stock は CSV 形式、label-print は JSON 形式で現在は別実装）
- browser 起動処理の共通化
- input parser の共通化
- `DangerousAutomationError` は `pos-common/errors.js` に共通化済み。今後は必要に応じて他の安全系エラーも同じ方針で整理する
- `waitForEnter()` の pos-common への移動（discount/stock/label-print でそれぞれ定義中）

