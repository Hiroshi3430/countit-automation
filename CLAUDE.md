# countit-automation - Claude Code 作業チェックリスト

@AGENTS.md

このファイルは Claude Code の **実行チェックリスト** です。

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

- [ ] `npm run label-print` / `npm run label-print:*` は人間の明示的許可後のみ実行
- [ ] `npm run stock:*` / `npm run discounts:*` も同様
- [ ] `label-print:dry-run` も CountIT へのログインと Stock Count の Save を伴うため許可対象から除外しない
- [ ] 初回は必ず `--dry-run` で実行
- [ ] `--semi-auto` で最終確認後に `full-auto` 実行
- [ ] inventory processing（+Process ボタン等）は**絶対実行禁止**

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
- [ ] テスト実行：`npm run test:discounts` 等（countit-automation 直下から実行）
- [ ] `git diff` で差分確認

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

## テスト・構文確認 - チェックリスト

修正後、**リポジトリルート**で実行：

```bash
# 構文チェック
node --check pos-common/*.js
node --check pos-discount-automation/src/*.js
node --check pos-stock-automation/src/*.js
node --check pos-label-print/src/*.js

# テスト実行
npm run test:label-print
npm run test:discounts
npm run test:stock
# まとめて実行する場合
npm test

# コミット前確認
git status --short
git diff --stat
git ls-files pos-label-print/
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

---

## 実行禁止項目 - 確認

以下を実行しないこと：

- [ ] 依頼なしにソースコード修正
- [ ] 割引判定ロジック・商品名マッチングの安易な変更
- [ ] 関数名・エントリポイント・ファイル名の無確認変更
- [ ] `input/*.tsv`, `.env*`, スクリーンショット等の検査
- [ ] 大規模リファクタリング・新依存関係・TypeScript移行を無確認実行
- [ ] inventory processing（+Process 等）の実行
