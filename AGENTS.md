# countit-automation AGENTS.md

このファイルは、このリポジトリで作業するすべてのAIエージェント（Claude Code、Codex、その他）に共通するセキュリティ規則と作業ガイドラインです。

各ルールの詳細は、特に明記がない限り、親の `Atariya/AGENTS.md` も参照してください。ただし、本ファイルは **単独で完結** するように設計されています。

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

- CountIT にログインしてブラウザ操作を行うコマンド（`npm run label-print`・`npm run stock:*`・`npm run discounts:*` 等）は、**人間が明示的に許可した場合のみ** 実行してください
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

## 作業前チェックリスト

コード修正を行った後は、必ず以下を **リポジトリルート** で実行してください:

```bash
# 構文チェック（CountIT にアクセスしない）
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js

# ロジックテスト（サブシェルで実行することでカレントディレクトリが変わりません）
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
npm run test:label-print

# コミット前確認
git status --short
git diff --stat
git ls-files pos-label-print/
```

不明な点・判断が迷う点は、実行を止めて確認を求めてください。

---

## リファクタリング安全ルール

変数名・関数名・定数名・設定キーなど既存の識別子を変更する場合、以下の手順が必須です。

このルールは、親の `Atariya/AGENTS.md` でも定義されていますが、本ファイルは単独で完結させるため、完全版を記載します。

### 1. 変更前の影響範囲調査

識別子を変更する前に、必ず以下を実施してください:

- 旧識別子への参照を全文検索する。
- 新識別子への参照も確認する。
- 参照箇所の一覧を報告する。
- 変更対象外の範囲への影響有無をまとめる。

例:

```bash
rg "旧識別子"
rg "新識別子"
```

### 2. 変更後の旧識別子残存確認

変更後、旧識別子を全文検索してください。

例:

```bash
rg "旧識別子"
```

期待される結果:

```text
0 matches
```

旧識別子が残っている場合は、その理由を説明してください。

### 3. 差分レビュー（必須）

変更後、必ず以下を報告してください:

- 変更ファイル
- 主な変更内容
- 影響範囲
- 想定リスク
- `git diff` の要約

### 4. 構文チェック

可能な場合は構文チェックを実行してください。

例:

```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js
```

構文チェックに合格してもランタイムの動作を保証するものではないことを必ず明記してください。

### 5. 実行時エラーリスク確認

以下の一般的な実行時エラーを確認してください:

- `ReferenceError`
- `TypeError`
- `undefined` 参照
- `null` 参照
- 存在しない設定キー
- 存在しないセレクタ・DOM 要素

### 6. 変更後のローカル確認

コード変更後、必ず以下を実行してください:

```bash
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js

( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
npm run test:label-print
```

コミットはレビュー完了後のみ実行してください。

---

## Spreadsheet ↔ GAS 整合性ルール

countit-automation は Node.js プロジェクトですが、Atariya ワークスペースの他のプロジェクト（GAS プロジェクト）と連携する可能性があります。本ルールは **参考情報** としてここに記載します。

### Atariya 内での GAS プロジェクト連携時

countit-automation から他の GAS プロジェクトのスプレッドシートと連携する場合:

- API や Webhook を使う強い理由がない限り、最初の統合レイヤーとして Google Sheets を優先してください。
- 実装前に明確なデータ契約を定義してください。
- ソースデータ・出力フォーマット・対象シート・列定義・更新頻度・エラー処理を文書化してください。

### 複数 Spreadsheet 連携確認

複数のスプレッドシートを連携させる場合は、親の `Atariya/AGENTS.md` の「Spreadsheet ↔ GAS 整合性ルール」を参照してください。

特に以下を確認してください:

- `openById()` で参照しているスプレッドシート ID が正しいか
- `IMPORTRANGE` 式の参照先 ID が正しいか
- 外部シート書き込み時のアクセス権限は確保されているか

### レビュー時の必須報告

Spreadsheet との連携に変更がある場合、以下を報告してください:

```text
複数 Spreadsheet 連携確認:
- openById() 参照: [変更有無]
- IMPORTRANGE 式: [変更有無]
- 外部シート書き込み: [変更有無]
```

---

## schema 更新確認

このプロジェクトは Node.js プロジェクトであり、直接的なシート構造管理の対象外です。

ただし、連携している GAS プロジェクトのシート構造が変わった場合:

- 親の `Atariya/AGENTS.md` の「schema ファイル更新確認」を参照してください。

countit-automation 独自の schema ファイル（`docs/schema.json` 等）がある場合:

- コード構造・入力フォーマット・出力フォーマットの変更時に schema ファイルの更新要否を確認してください。

---

## README 整合性ルール

以下の変更を行う場合、README の更新要否を必ず確認してください:

### 対象となる変更

- 新機能追加
- 設定変更（`.env` のキー追加・変更）
- 実行手順変更
- 操作モード変更
- 新しいコマンド追加
- インストール手順変更
- API・外部連携変更

### レビュー時の報告

レビュー時に必ず以下のいずれかを報告してください:

```text
README 更新必要
```

理由も含めて記載例:

```text
README 更新必要
理由: 新しい実行モード（--append-to-label-print）を追加したため、使用例セクションを更新
```

または

```text
README 更新不要
理由: 内部ロジック変更のみで、ユーザー操作に影響なし
```

### README 更新が必要な判定基準

以下のいずれかに該当する場合、README 更新が必要です:

- ユーザー（スタッフ）が実行する手順に変更がある
- セットアップ・インストール手順に変更がある
- `.env` キーに追加・削除がある
- 実行時の入力形式・出力形式に変更がある
- 注意事項・制限事項に追加がある
- 前提条件に変更がある
- 新しいコマンド・実行モードが追加される

### README 更新が不要な判定基準

以下のいずれかに該当する場合、README 更新は不要な場合が多いです:

- 内部関数の変更のみ
- リファクタリングで振る舞いが変わらない
- パフォーマンス改善のみ
- バグ修正で機能が意図通りになるだけ
- コメント・ドキュメント内部の改善のみ

---

## コード変更レビュー報告フォーマット

コード変更のレビュー時は、必ず以下を報告してください:

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
