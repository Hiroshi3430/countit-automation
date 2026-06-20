# countit-automation - Claude Code 作業指示

このファイルは Claude Code 専用の実行チェックリストです。
複数AIエージェント共通のセキュリティ規則・詳細ルールは `AGENTS.md` を参照してください。

本ファイルは **単独で完結** するように設計されています。各サブディレクトリで起動する場合も、本ファイルですべての必須チェックリストが完備されています。

---

## プロジェクト概要

このリポジトリは、Atariya の業務向け CountIT 操作補助ツールをまとめたものです。
汎用ライブラリではなく、特定のCountIT環境・業務ルール・画面構造に依存しています。

**安定性と既存業務ロジックの保護を最優先にしてください。積極的なリファクタリングより、動作確認済みの挙動を壊さないことを優先します。**

### ディレクトリ構成

- `README.md`: セットアップ・操作・安全注意・環境ノート（日本語）
- `ENVIRONMENT.md`: 開発環境ノートと移行注意事項
- `AGENTS.md`: 全AIエージェント共通のセキュリティ規則
- `CLAUDE.md`: Claude Code向け作業指示（このファイル）
- `pos-common/`: CountIT ログイン・会社切替の共通処理
- `pos-discount-automation/`: 割引作成・終了・置換ワークフロー
- `pos-stock-automation/`: Inventory Counts 入力補助ワークフロー
- `pos-label-print/`: Stock CountからPrint labels作成ワークフロー

---

## 安全規則 - 実行前チェック

### 機密ファイル取り扱い

コード変更前に以下を確認してください:

- [ ] `.env` / `.env.local` ファイルを読み取っていないか？
- [ ] `.env` の内容をコマンド実行（`cat .env`、`grep`等）で表示していないか？
- [ ] 認証ファイル（`auth.json`、`cookies.json` 等）を読み取っていないか？
- [ ] 環境変数の**値**をレスポンス・ログ・README に含めていないか？
- [ ] `.env.example` のみを参照しているか？

### 生成物・業務データ確認

コミット前に以下を実行してください:

```bash
git status --short
git ls-files
```

- [ ] `.env` / `.env.local` がステージされていないか？
- [ ] `input/*.tsv`, `input/*.csv` がステージされていないか？
- [ ] `logs/`, `debug/`, `recordings/` がステージされていないか？
- [ ] `runs/`, スクリーンショット, テスト結果がステージされていないか？
- [ ] `node_modules/` がステージされていないか？

### CountIT 本番操作禁止

ブラウザ操作を伴うコマンド実行前に以下を確認してください:

- [ ] 人間が**明示的に許可**しているか？
- [ ] コマンドが `--dry-run` で始まっているか？（初回は必ず dry-run）
- [ ] 対象シート・操作内容が明確か？

**実行禁止コマンド:**
- `npm run label-print` （許可がない限り）
- `npm run stock:*` （許可がない限り）
- `npm run discounts:*` （許可がない限り）

---

## 変更前の確認事項 - チェックリスト

コードを変更する前に、必ず以下を確認・説明してください:

- [ ] どのサブディレクトリ（`pos-discount-automation` / `pos-stock-automation` / `pos-label-print` など）を変更するか明記
- [ ] なぜその変更が必要か説明
- [ ] 変更による影響範囲を分析
- [ ] ローカルテスト・確認方法を説明

分析や調査の依頼には、コードを変更せずに結果のみ報告してください。

---

## リファクタリング安全ルール - 実行チェックリスト

変数名・関数名・定数名・設定キーを変更する場合、以下を実行してください。

### 変更前チェック

- [ ] 旧識別子で全文検索：`rg "旧識別子"`
- [ ] 新識別子の既存使用を確認：`rg "新識別子"`
- [ ] 影響范囲を一覧化
- [ ] 変更対象外の範囲への影響を分析

**報告例:**
```
旧識別子 "discountCode" の参照箇所:
- pos-discount-automation/src/logic.js: 行 45, 78, 150
- pos-discount-automation/test/test.js: 行 20, 50
- 他ファイル: なし
```

### 変更後チェック

- [ ] 構文チェック実行: `node --check pos-*/src/*.js`
- [ ] 旧識別子の残存確認：`rg "旧識別子"`（結果: 0 matches が期待値）
- [ ] 差分を報告：`git diff` の要約

**報告例:**
```
変更ファイル: pos-discount-automation/src/logic.js, test/test.js
主な変更内容: discountCode → discountId（変数名変更）
影響範囲: 5箇所
旧識別子残存: 0 matches ✓
```

### テスト実行チェック

- [ ] 対象モジュールのテストを実行：`cd pos-discount-automation && npm test`
- [ ] テスト結果がすべて PASS か確認
- [ ] ローカルの構文チェックが通っているか確認

---

## Spreadsheet ↔ GAS 整合性ルール - 実行チェックリスト

本プロジェクトは Node.js ですが、連携する GAS プロジェクトとのシート連携確認が必要な場合があります。

### 複数 Spreadsheet 連携確認

以下のいずれかがある場合、必ず確認してください:

#### 1. `openById()` による連携

- [ ] コード内で `openById()` が使用されているか？：`rg "openById"`
- [ ] 参照先スプレッドシート ID が正しいか？
- [ ] ID の変更がコード修正を伴うか？
- [ ] アクセス権限に変更がないか？

#### 2. `IMPORTRANGE` による連携

- [ ] コード内で `IMPORTRANGE` が参照されているか？：`rg "IMPORTRANGE"`
- [ ] 参照先 ID・範囲が正しいか？
- [ ] 連携元シート構造の変更がないか？

#### 3. 外部シート書き込み

- [ ] 複数のシートへの書き込み処理があるか？
- [ ] 書き込み先シート・列・行が正しいか？
- [ ] 書き込み順序に依存関係がないか？

**報告形式:**

- [ ] 複数シート連携確認結果を報告

```text
複数 Spreadsheet 連携確認:
- openById() 参照: [変更有無]
- IMPORTRANGE 式: [変更有無]
- 外部シート書き込み: [変更有無]
```

---

## schema 更新ルール - 実行チェックリスト

本プロジェクトはNode.jsプロジェクトですが、schema ファイルが存在する場合は以下を確認してください:

- [ ] `docs/schema.json` / `docs/input-schema.json` 等のファイルが存在するか？
- [ ] コード構造・入力フォーマット・出力フォーマットに変更があるか？
- [ ] schema ファイルの更新が必要か判定

**報告形式:**

```text
schema.json 更新が必要です
理由: [具体的な構造変更内容]
```

または

```text
schema.json 更新不要です
理由: [内部実装変更のみ]
```

---

## README 整合性チェック - 実行チェックリスト

以下の変更を行う場合、README の更新要否を必ず確認してください:

### 変更内容の確認

- [ ] 新機能追加があるか？
- [ ] 設定変更（`.env` キー、コマンドオプション等）があるか？
- [ ] 実行手順に変更があるか？
- [ ] インストール手順に変更があるか？
- [ ] 新しいコマンド・実行モードが追加されるか？

### README 更新が必要な判定

以下のいずれかに該当する場合 → **UPDATE REQUIRED**

- ユーザー（スタッフ）が実行する手順に変更がある
- セットアップ・インストール手順に変更がある
- `.env` キーに追加・削除がある
- 実行時の入力形式・出力形式に変更がある
- 前提条件に変更がある
- 新しいコマンド・実行モードが追加される

### README 更新が不要な判定

以下のいずれかのみの場合 → **UPDATE NOT REQUIRED**

- 内部関数の変更のみ
- リファクタリングで振る舞いが変わらない
- バグ修正で機能が意図通りになるだけ
- パフォーマンス改善のみ

### 報告形式

- [ ] README 更新要否を明記

```text
README 更新必要
理由: [具体的な変更内容]
```

または

```text
README 更新不要
理由: [内部実装変更のみで、ユーザー操作に影響なし]
```

---

## レビューチェックリスト - 報告項目

コード変更のレビュー時は、必ず以下の表を報告してください:

| 項目 | 内容 |
|------|------|
| 変更ファイル | （変更したファイルの一覧） |
| 影響範囲 | （影響する機能・モジュール） |
| GAS 変更有無 | 対象外（Node.js プロジェクト） |
| シート変更有無 | 有 / 無 / 対象外 |
| 複数シート連携変更有無 | 有 / 無 / 対象外 |
| schema 更新要否 | 必要 / 不要 / 対象外 |
| README 更新要否 | 必要 / 不要 |
| commit 可否 | 可 / 要確認 / 不可 |
| clasp push 可否 | 対象外（Node.js プロジェクト） |

---

## コーディング規約

- ランタイムは CommonJS モジュールの Node.js です（`'use strict'`・`require(...)`・`module.exports`）
- テストは Playwright Test ではなく、`assert` を使った素の Node スクリプトです
- TSV/CSV 解析は `csv-parse/sync` を使います（pos-stock / pos-discount）
- `pos-label-print` は引数からパラメータを受け取り、入力ファイルは不要です
- モジュール分割: `args.js`, `logic.js`, `selectors.js`, `logger.js`, `*Page.js` の形を維持してください
- コメントは「なぜそうするか」が自明でない場合のみ記述します

---

## 実行・テスト・構文確認 - チェックリスト

### 依存関係のインストール

- [ ] 必要に応じて `npm install` を実行
- [ ] Playwright がインストールされているか確認：`npx playwright install chromium`

### CountIT にアクセスしないローカル確認（修正後に必ず実行）

すべてのコマンドは **リポジトリルート** で実行してください。

- [ ] 構文チェック実行:
```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js
```

- [ ] ロジックテスト実行:
```bash
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
npm run test:label-print
```

- [ ] コミット前確認実行:
```bash
git status --short
git diff --stat
```

### CountIT にアクセスするコマンド（人間の明示的な許可が必須）

以下のコマンドは、人間が明示的に許可し、対象入力・モードを確認した後のみ実行してください。

必ず `dry-run` を優先してください。

```bash
# label-print（リポジトリルートから実行）
npm run label-print -- --stock-count "<Stock Count名>" --dry-run
npm run label-print -- --stock-count "<Stock Count名>" --semi-auto --limit 3
npm run label-print -- --stock-count "<Stock Count名>"

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

---

## Git ワークフロー - チェックリスト

- [ ] クリーンな作業ツリーから開始
- [ ] 変更は要求された範囲に絞る
- [ ] `.gitignore` 対象ファイル（生成物・`runs/`・スクリーンショット・ログ・`.env*`・実業務入力データ）をコミットしない
- [ ] コミット前に `git status --short` と `git diff` で確認
- [ ] PR説明には実行したテスト・確認コマンドを記載
- [ ] 挙動に影響する変更・CountITワークフローのリスク・必要な手動確認を文書化

---

## Claude Code が避けるべきこと

- レビュー依頼がない限り、ソースコードを勝手に修正しないでください
- 割引判定ロジック・商品名マッチング・日時処理・Save/Add 挙動・在庫処理境界を安易に変更しないでください
- エクスポート関数名・スクリプトエントリポイント・パッケージスクリプト・ファイル名を確認なしに変更しないでください
- `input/*.tsv`, `input/*.csv`, `.env*`, `runs/`, スクリーンショット, ログ, その他プライベート・生成物を検査しないでください
- 大規模リファクタリング・新依存関係追加・TypeScript移行・フォーマット変更・Playwright Test移行を明示的な依頼なしに行わないでください
- CountIT の UI ラベル・セレクタ・会社設定が安定していると証拠なしに仮定しないでください

---
