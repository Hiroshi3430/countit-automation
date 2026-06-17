# CLAUDE.md

このファイルは Claude Code（AIエージェント）向けの作業指示です。
複数AIエージェント共通のセキュリティ規則は `AGENTS.md` を参照してください。

## プロジェクト概要 / Project overview

このリポジトリは、Atariya の業務向け CountIT 操作補助ツールをまとめたものです。
汎用ライブラリではなく、特定のCountIT環境・業務ルール・画面構造に依存しています。

**安定性と既存業務ロジックの保護を最優先にしてください。積極的なリファクタリングより、動作確認済みの挙動を壊さないことを優先します。**

## ディレクトリ構成 / Main directories and files

- `README.md`: セットアップ・操作・安全注意・環境ノート（日本語）
- `ENVIRONMENT.md`: 開発環境ノートと移行注意事項
- `AGENTS.md`: 全AIエージェント共通のセキュリティ規則
- `CLAUDE.md`: Claude Code向け作業指示（このファイル）
- `pos-common/`: CountIT ログイン・会社切替の共通処理
- `pos-discount-automation/`: 割引作成・終了・置換ワークフロー
  - `src/`: 割引automation本体
  - `test/`: Node `assert` テスト（割引ロジック・入力解析・ロガー）
  - `examples/`: サンプル割引入力ファイル（コミット管理）
  - `input/`: ローカル業務入力ファイル（コミット不可・中身を読まない）
- `pos-stock-automation/`: Inventory Counts 入力補助ワークフロー
  - `src/`: stock automation本体
  - `test/`: Node `assert` テスト
  - `examples/`: サンプル在庫入力ファイル（コミット管理）
  - `input/`: ローカル業務入力ファイル（コミット不可・中身を読まない）
- `pos-label-print/`: Stock CountからPrint labels作成ワークフロー
  - `src/`: label print automation本体
  - `test/`: Node `assert` テスト（ロジック・引数解析）
  - `logs/`: 実行ログ（ローカルのみ・コミット不可）
  - `debug/`: デバッグ用スクリーンショット（ローカルのみ・コミット不可）
  - `recordings/`: Playwright録画ファイル（ローカルのみ・コミット不可）

生成物（ローカルのみ存在する可能性あり）: `node_modules/`, `runs/`, スクリーンショット, Playwrightレポート, テスト結果

## 業務コンテキスト / Business context

- `pos-discount-automation`: TSV/CSV入力から CountIT 商品割引を登録・終了・置換します
- `pos-stock-automation`: TSV/CSV入力から CountIT Inventory Counts の入力を補助します
- `pos-label-print`: CountIT の Stock Count から Current stock が 0 以下の商品を検出し、Print labels ファイルを作成します（値札印刷用途）
- `pos-common`: CountIT ログイン・会社切替の共通処理です

入力ファイルは業務データであり、意図的にローカル管理です。
CountIT のブラウザフローは、画面構造・会社設定・商品コード・商品名・業務ルールに依存します。

**pos-label-print 固有の注意:**
- Stock Count は「読み取り後に Save して離脱」するだけです。Stock Count の確定・在庫反映・inventory processing に相当する操作は絶対に実行しません
- Print labels も「Save のみ」です。在庫確定・在庫処理・inventory processing に相当するボタン・リンク・アクションは一切実行しません
- Current stock が 0 以下の商品を label print 対象として検出します（0 を含む）

## 安全規則 / Safety rules

- `.env`、`.env.local`、セッションファイル、スクリーンショット、ログ、業務入力ファイルは読み取り・出力・コミットをしないでください
- `pos-common/auth.js` 等の `auth.js` はログイン処理のソースコードであり読み取り・編集の対象です。ただし、実際の認証情報（メール・パスワード・クッキー・セッショントークン・生成された auth データ）は読み取り・出力・コミットしてはいけません
- `.env.example` は環境変数名を文書化する目的にのみ使用してください
- 環境変数の値をレスポンス・ログ・テスト・ドキュメント・スクリーンショットに含めないでください
- スプレッドシートデータや業務入力データを上書きしないでください
- 明示的な確認なしにファイル・トリガー・シート・ログ・データを削除しないでください
- `full-auto` ワークフローは高リスクです。必ず `dry-run` → `semi-auto` → `full-auto` の順で進めてください
- **在庫確定・在庫反映・inventory processing に相当する操作（+Process または同等のボタン・リンク・アクション）は、どのツール・どのモードでも絶対に実行してはいけません。** `pos-label-print` は Stock Count を読み取って Print labels を Save するだけです。Stock Count の確定や在庫反映は行いません
- **CountIT 本番画面を操作するコマンドは、人間が明示的に許可した場合のみ実行してください**

## Claude Code が避けるべきこと / What Claude Code should avoid

- レビュー依頼がない限り、ソースコードを勝手に修正しないでください
- 割引判定ロジック・商品名マッチング・日時処理・Save/Add 挙動・在庫処理境界を安易に変更しないでください
- エクスポート関数名・スクリプトエントリポイント・パッケージスクリプト・ファイル名を確認なしに変更しないでください
- `input/*.tsv`, `input/*.csv`, `.env*`, `runs/`, スクリーンショット, ログ, その他プライベート・生成物を検査しないでください
- 大規模リファクタリング・新依存関係追加・TypeScript移行・フォーマット変更・Playwright Test移行を明示的な依頼なしに行わないでください
- CountIT の UI ラベル・セレクタ・会社設定が安定していると証拠なしに仮定しないでください

## コーディング規約 / Coding conventions

- ランタイムは CommonJS モジュールの Node.js です（`'use strict'`・`require(...)`・`module.exports`）
- テストは Playwright Test ではなく、`assert` を使った素の Node スクリプトです
- TSV/CSV 解析は `csv-parse/sync` を使います（pos-stock / pos-discount）
- `pos-label-print` は引数からパラメータを受け取り、入力ファイルは不要です
- モジュール分割: `args.js`, `logic.js`, `selectors.js`, `logger.js`, `*Page.js` の形を維持してください
- コメントは「なぜそうするか」が自明でない場合のみ記述します
- CommonJS の `fs/promises` hint が IDE に表示されることがありますが、意図的な設計です

## 実行・テスト・構文確認 / How to run, test, and lint

### 依存関係のインストール

```bash
# pos-label-print はリポジトリルートから実行
npm install
npx playwright install chromium

# pos-discount-automation
cd pos-discount-automation
npm install
npx playwright install chromium

# pos-stock-automation
cd pos-stock-automation
npm install
npx playwright install chromium
```

### CountIT にアクセスしないローカル確認（必ず修正後に実行）

すべてのコマンドは **リポジトリルート** で実行してください。

```bash
# 構文チェック
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js

# ロジックテスト（サブシェルで実行することでカレントディレクトリが変わりません）
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
npm run test:label-print
```

### CountIT にアクセスするコマンド（人間の明示的な許可が必要）

```bash
# label-print（リポジトリルートから実行）
npm run label-print -- --stock-count "<Stock Count名>" --dry-run
npm run label-print -- --stock-count "<Stock Count名>" --semi-auto --limit 3
npm run label-print -- --stock-count "<Stock Count名>"
npm run label-print -- --append-to-label-print "<既存ラベル名>" --stock-count "<Stock Count名>" --semi-auto

# discount
cd pos-discount-automation
npm run discounts:dry-run
npm run discounts:semi-auto
npm run discounts:full-auto

# stock
cd pos-stock-automation
npm run stock:dry-run
npm run stock:semi-auto
npm run stock:full-auto
```

CountIT にアクセスするコマンドは、人間が明示的に要求し、対象入力・モードを確認した後のみ実行してください。必ず `dry-run` を優先してください。

## Git ワークフロー / Git workflow for safe PRs

- クリーンな作業ツリーから開始してください
- 変更は要求された範囲に絞ってください
- `.gitignore` 対象ファイル（生成物・`runs/`・スクリーンショット・ログ・`.env*`・実業務入力データ）はコミットしないでください
- コミット前に `git status --short` と `git diff` で確認してください
- PR説明には実行したテスト・確認コマンドを記載してください
- 挙動に影響する変更・CountITワークフローのリスク・必要な手動確認を文書化してください

**コミットしてよいファイル:** `src/`, `test/`, `examples/`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `config.example.json`

**コミットしてはいけないファイル:** `.env`, `input/*.tsv`, `input/*.csv`, `logs/`, `debug/`, `recordings/`, スクリーンショット, 認証ファイル, セッションファイル

## レビュー重点 / Recommended review scope for Claude Code

以下に重点的にレビュー工数をかけてください:

- `pos-discount-automation/src/discountLogic.js` の業務ルール保護
- 各 `src/input.js` の入力バリデーションとデリミタ処理
- `dry-run`・`semi-auto`・`full-auto`・Save/Add・確認ダイアログ・stock Process 周辺の安全挙動
- `pos-label-print/src/labelPrintPage.js` の商品選択・描写セル確認・重複チェック・append モード
- `pos-common/` の共有ログイン・会社切替変更
- `selectors.js` のセレクタ脆弱性と CountIT UI の前提
- 日付・重複商品コード・操作モード・失敗パスのテストカバレッジ
- 機密情報・プライベートデータの意図しない露出

不明な点は「Unknown / needs confirmation」と記載し、推測しないでください。
