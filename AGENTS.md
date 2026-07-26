# countit-automation AGENTS.md

このファイルは、このリポジトリで作業するすべての AI エージェントに適用されます。CountIT 本番環境の安全と既存動作の安定性を最優先してください。

## 対象と前提

- CountIT 本番画面を直接操作する Node.js ツールです。
- `pos-discount-automation/` は割引、`pos-stock-automation/` は Inventory Counts、`pos-label-print/` は Print labels、`pos-common/` は共通ログイン処理を扱います。
- 分析・調査のみの依頼ではコードを変更しません。

---

## 絶対に守るべきセキュリティ規則

### 機密ファイルの取り扱い

- `.env`、`.env.local` を **読み取り・出力・コピー・編集・コミット** してはいけません
- `cat .env`、`less .env`、`grep COUNTIT .env` 等、内容を表示するコマンドを実行してはいけません
- 環境変数の **値** をレスポンス・ログ・テスト・README・スクリーンショット・生成ファイルに含めてはいけません
- 環境変数名を確認する目的には `.env.example` のみ使用してください
- タスクに `.env` の読み取りが必要に見える場合は、実行を止めて確認を求めてください
- `.env` と `.env.local` は必ず Git 管理外にしてください
- **`pos-common/auth.js` などの `auth.js` はログイン処理のソースコードです。読み取り・編集の対象です。** ただし、実際の認証情報（メール・パスワード・クッキー・セッショントークン・生成された auth データ）は読み取り・出力・コミットしてはいけません
- 生成された認証ファイル（`auth.json`、`cookies.json` 等）は **読み取り・出力・コピー・コミット** してはいけません

### 生成物・業務データのコミット禁止

以下のファイルは **絶対にコミットしてはいけません**:

| 種類 | 場所の例 |
|------|----------|
| `.env` / `.env.local` | リポジトリルート |
| 業務入力ファイル | `pos-discount-automation/input/*.tsv` / `input/*.csv` |
| 業務入力ファイル | `pos-stock-automation/input/*.tsv` / `input/*.csv` |
| 実行ログ | `pos-label-print/logs/*.json` |
| デバッグスクリーンショット | `pos-label-print/debug/*.png` |
| Playwright録画ファイル | `pos-label-print/recordings/*.spec.ts` 等 |
| 認証・セッションファイル | `auth.json`、`cookies.json` 等 |
| Playwrightレポート | `playwright-report/`、`test-results/`、`blob-report/` |
| 実行結果 | `runs/`、`result-log.csv` |
| node_modules | `**/node_modules/` |

コミット前に必ず `git status --short` と `git ls-files` で確認してください。

### コミットしてよいファイル

| 種類 | 場所の例 |
|------|----------|
| ソースコード | `pos-*/src/*.js`、`pos-common/*.js` |
| テスト | `pos-*/test/*.js` |
| サンプル入力 | `pos-*/examples/*.tsv` |
| 設定例 | `.env.example`、`config.example.json` |
| ドキュメント | `README.md`、`CLAUDE.md`、`AGENTS.md`、`pos-*/README.md` |
| 設定ファイル | `.gitignore`、`package.json`、`package-lock.json` |

---

## CountIT 本番操作に関する規則

**このリポジトリのツールは CountIT の本番画面を直接操作します。AIエージェントは以下の規則を厳守してください。**

### 実ブラウザ操作の禁止

- CountIT にログインしてブラウザ操作を行うコマンド（`npm run label-print`・`npm run label-print:*`・`npm run stock:*`・`npm run discounts:*` 等）は、**人間が明示的に許可した場合のみ** 実行してください
- `label-print:dry-run` も CountIT へのログインと Stock Count の Save を伴うため、許可対象から除外しないでください
- AIエージェントが自発的にブラウザ操作コマンドを実行してはいけません
- コードレビュー・ドキュメント更新・静的チェック・ローカルテストは実行して構いません

### 安全な実行モードの順序

CountIT にアクセスする操作は、必ず以下の順番で進めてください:

1. `--dry-run`: CountIT を読み取り、ログを出力します。Print labels / Discount / Inventory Count の保存は行いません。ただし `pos-label-print` は Stock Count 編集画面を安全に離脱するため、Stock Count の Save を実行します（在庫確定・inventory processing とは別物）
2. `--semi-auto`: 処理を実行しますが、最終Save/Addの直前でターミナルが止まります。人間がEnterを押した後にのみ保存されます
3. (通常モード / `full-auto`): 自動で保存します。`dry-run` と `semi-auto` で十分確認した後のみ使用してください

### inventory processing の絶対禁止

- Stock Count の確定・在庫反映・inventory processing に相当する操作（+Process または同等のボタン・リンク・アクション）は、**どのツール・どのモード（dry-run・semi-auto・full-auto）でも絶対に実行してはいけません**
- `pos-label-print` は Stock Count を読み取って Print labels を Save するだけです。Stock Count の確定や在庫反映は行いません
- `pos-stock-automation` は Inventory Counts フォームを入力・Add するだけです。在庫確定（+Process）は行いません
- この制約はコード設計上も明示的に除外されており、画面上にそのようなボタンが存在するかどうかにかかわらず適用されます

---

## 変更と検証

- 識別子・設定キー・セレクタを変更する前後に旧名と新名を全文検索し、影響箇所を確認してください。旧名が残る場合は理由を説明します。
- 既存の関数名・エントリポイント・ファイル名、割引判定、商品名マッチングを、明示的な依頼なしに変更しません。
- 大規模なリファクタリング、新規依存関係、TypeScript 移行は事前確認が必要です。
- CommonJS（`require` / `module.exports`）、`assert` テスト、`csv-parse/sync` による TSV/CSV 解析、`args.js`・`logic.js`・`selectors.js`・`*Page.js` のモジュール分割を維持します。
- コメントは「なぜ」が非自明な場合のみ記述します。
- 利用可能なローカルテストと `node --check` を実行し、`ReferenceError`、`TypeError`、`undefined`、`null`、存在しない設定キー・セレクタも確認してください。構文検査だけでは実行時動作を保証しません。
- コード変更のコミットはレビュー完了後のみ行います。
- 不明な点や判断に迷う点があれば、実行を止めて確認を求めてください。

## 外部の Sheets / GAS と連携する変更

現在、このリポジトリ自体に Sheets / GAS 依存はありません。他リポジトリの Sheets / GAS と連携する変更では、変更対象リポジトリの `AGENTS.md` に従い、データ契約・対象シート・権限・更新方法を確認してください。

## schema と README

- `docs/schema.json` 等の schema が存在するか確認し、入出力形式または構造を変える場合は更新要否を報告してください。該当ファイルがなければ「対象外」とします。
- 新機能、設定キー、実行手順、操作モード、コマンド、入出力形式、外部連携、セットアップ、注意事項・制限事項、前提条件を変える場合は README の更新要否を確認してください。
- 内部実装のみの変更でも、README 更新不要の理由を報告してください。

## 完了条件

- 変更ファイル、主な変更内容、影響範囲、実施した検証、想定リスク、`git diff` の要約、schema と README の更新要否を報告してください。
- シート連携変更、commit 可否、本番操作テストの要否と実施状況も報告してください。
- CountIT を操作するテストは、人間の明示的許可なしに実行しません。

## Agent skills

### Issue tracker

Issue と PRD は GitHub Issues で管理します。`docs/agents/issue-tracker.md` を参照してください。

### Triage labels

`docs/agents/triage-labels.md` で定義された 5 個の標準トリアージラベルを使用します。

### Domain docs

単一コンテキストのドメイン文書構成を使用します。`docs/agents/domain.md` を参照してください。
