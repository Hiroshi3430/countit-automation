# AGENTS.md

このファイルは、このリポジトリで作業するすべてのAIエージェント（Claude Code、Codex、その他）に共通するセキュリティ規則と作業ガイドラインです。

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

1. `--dry-run`: CountIT を読み取り専用で確認し、ログを出力します。保存はしません
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

## Security rules (English summary)

- Never read, print, summarize, copy, edit, or expose `.env` or `.env.local` files.
- Never run commands such as `cat .env`, `less .env`, `grep COUNTIT .env`, or anything that prints secrets.
- Do not include environment variable values in responses, logs, tests, README files, screenshots, or generated files.
- Use `.env.example` when you need to inspect or document required environment variables.
- If environment variables are needed, only check whether required variable names exist, not their values.
- If a task appears to require reading `.env`, stop and ask for confirmation.
- Keep `.env` and `.env.local` ignored by Git.
- Never run CountIT-accessing browser commands without explicit human approval.
- Never execute stock finalization, inventory processing, or any equivalent action (+Process or equivalent button/link/action) in any tool or mode. This applies regardless of whether such a button is visible on screen.
- Source files such as `pos-common/auth.js` are login logic and may be read and edited. However, actual credentials, cookies, session tokens, and generated auth data must never be read, printed, copied, or committed.
- Always run `node --check` and logic tests after code changes. Use subshell form: `( cd pos-discount-automation && npm test )` to avoid changing the working directory.
- Never commit logs, debug screenshots, recordings, generated auth files, session files, or operational input data.
