# countit-automation - Claude Code 作業チェックリスト

このファイルは Claude Code の **実行チェックリスト** です。
ポリシー・ルール詳細・背景説明は `AGENTS.md` を参照してください。

本ファイルは基本チェックだけで作業開始できるように設計されています。詳細判断は `AGENTS.md` を参照してください。

---

## プロジェクト概要

- CountIT 本番画面を直接操作する Node.js ツール
- `pos-discount-automation/`: 割引作成・終了・置換
- `pos-stock-automation/`: Inventory Counts 入力補助
- `pos-label-print/`: Print labels 作成
- `pos-common/`: 共通ログイン処理

**安定性最優先。既存ロジック保護を優先。**

---

## 安全規則 - 実行前チェック

### 機密ファイル

- [ ] `.env` / `.env.local` を読み取らない
- [ ] 認証ファイル（`auth.json` 等）を読み取らない
- [ ] 環境変数の**値**を出力・ログ・README に含めない
- [ ] `.env.example` のみ参照

### 生成物・業務データ

- [ ] `input/*.tsv`, `input/*.csv` をコミットしない
- [ ] `logs/`, `debug/`, `runs/` をコミットしない
- [ ] `node_modules/` をコミットしない

```bash
git status --short  # コミット前に必ず確認
```

### CountIT 本番操作

- [ ] `npm run label-print` は人間の明示的許可後のみ実行
- [ ] `npm run stock:*` / `npm run discounts:*` も同様
- [ ] 初回は必ず `--dry-run` で実行
- [ ] `--semi-auto` で最終確認後に `full-auto` 実行
- [ ] inventory processing（+Process ボタン等）は**絶対実行禁止**

**詳細は AGENTS.md の「CountIT 本番操作に関する規則」を参照。**

---

## 変更前チェック

- [ ] 対象モジュール（pos-discount / pos-stock / pos-label-print 等）明記
- [ ] 変更理由を説明
- [ ] 影響範囲を分析
- [ ] 分析のみ依頼時はコード変更しない

---

## リファクタリング安全 - チェックリスト

識別子（変数名・関数名等）変更時：

### 変更前

- [ ] `rg "旧識別子"` で全文検索
- [ ] `rg "新識別子"` で既存使用確認
- [ ] 影響箇所を一覧化

### 変更後

- [ ] 構文チェック：`node --check pos-*/src/*.js`
- [ ] `rg "旧識別子"` で残存確認（0 matches 期待）
- [ ] テスト実行：`cd pos-discount-automation && npm test` 等
- [ ] `git diff` で差分確認

**詳細は AGENTS.md の「リファクタリング安全ルール」を参照。**

---

## Spreadsheet ↔ GAS 連携確認 - チェックリスト

複数シート連携時（確認事項の要約）：

- [ ] `openById()` で参照しているシート ID が正しいか
- [ ] `IMPORTRANGE` 式の参照先が正しいか
- [ ] 連携先シート構造に変更がないか

**詳細は Atariya/AGENTS.md の「複数 Spreadsheet 連携確認」を参照。**

---

## schema 更新確認 - チェックリスト

（countit-automation は Node.js プロジェクトですが、schema ファイルがある場合）

- [ ] `docs/schema.json` が存在するか
- [ ] 入出力フォーマット構造に変更があるか
- [ ] 更新必要/不要を報告に記載

**詳細は AGENTS.md を参照。**

---

## README 更新確認 - チェックリスト

以下の変更時：

- [ ] 新機能追加
- [ ] `.env` キー追加・変更
- [ ] 実行手順変更
- [ ] 新コマンド追加

判定：

- [ ] ユーザー操作に影響あり → README 更新必要
- [ ] 内部実装変更のみ → README 更新不要

**詳細は AGENTS.md の「README 整合性ルール」を参照。**

---

## レビュー報告チェックリスト

コード変更レビュー時、必ず以下を報告：

| 項目 | 内容 |
|------|------|
| 変更ファイル | （一覧） |
| 影響範囲 | （機能・モジュール） |
| シート連携変更 | 有 / 無 / 対象外 |
| schema 更新 | 必要 / 不要 / 対象外 |
| README 更新 | 必要 / 不要 |
| commit 可否 | 可 / 要確認 / 不可 |
| 本番操作テスト | dry-run 済 / semi-auto 済 / 不要 |

---

## コーディング規約 - 確認項目

- [ ] CommonJS（`require` / `module.exports`）を使用
- [ ] テストは `assert` ライブラリ使用（Playwright Test ではない）
- [ ] TSV/CSV 解析は `csv-parse/sync` 使用
- [ ] モジュール分割：`args.js`, `logic.js`, `selectors.js`, `*Page.js` 構造維持
- [ ] コメントは「なぜ」が非自明な場合のみ記述

**詳細は AGENTS.md を参照。**

---

## テスト・構文確認 - チェックリスト

修正後、**リポジトリルート**で実行：

```bash
# 構文チェック
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js

# テスト実行
( cd pos-discount-automation && npm test )
( cd pos-stock-automation && npm test )
npm run test:label-print

# コミット前確認
git status --short
git diff --stat
```

- [ ] すべてのチェックが PASS
- [ ] 構文エラーなし
- [ ] テスト失敗なし

---

## Git ワークフロー - チェックリスト

- [ ] クリーンな作業ツリーから開始
- [ ] 変更を要求範囲に絞る
- [ ] `.gitignore` 対象ファイルをコミットしない
- [ ] PR説明に実行テスト・確認内容を記載

**詳細は AGENTS.md の「生成物・業務データのコミット禁止」と「コード変更レビュー報告フォーマット」を参照。**

---

## 実行禁止項目 - 確認

以下を実行しないこと：

- [ ] 依頼なしにソースコード修正
- [ ] 割引判定ロジック・商品名マッチングの安易な変更
- [ ] 関数名・エントリポイント・ファイル名の無確認変更
- [ ] `input/*.tsv`, `.env*`, スクリーンショット等の検査
- [ ] 大規模リファクタリング・新依存関係・TypeScript移行を無確認実行
- [ ] inventory processing（+Process 等）の実行

**詳細は AGENTS.md を参照。**
