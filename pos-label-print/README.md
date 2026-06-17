# CountIT Label Print From Stock Count

## 概要

CountIT の Stock Count を読み取り、**Current stock が 0 以下の商品**を自動検出して、CountIT の Products > Print labels に値札印刷用のファイルを作成します。

**重要な制約:**
- Stock Count は「読み取り後に Save して離脱」するだけです。inventory processing（+Process 等）は絶対に実行しません
- Print labels も「Save のみ」です。+Process や在庫処理系のボタンは絶対にクリックしません

---

## 実行前チェックリスト

1. `.env` に `COUNTIT_EMAIL`・`COUNTIT_PASSWORD`・`COUNTIT_COMPANY_NAME` が設定されているか確認
2. リポジトリルートで `npm install` と `npx playwright install chromium` を済ませているか確認
3. 必ず `--dry-run` から始める
4. `--semi-auto` で内容を確認してから通常モードに進む

---

## コマンド（リポジトリルートから実行）

### 内容確認のみ（CountIT への書き込みなし）

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --dry-run
```

- Stock Count を開き、Current stock ≤ 0 の商品一覧をログに出力します
- Print labels ファイルは作成しません
- Stock Count の Save は実行します（編集画面から抜けるため）

### 少数件数でのテスト（推奨：初回は必ずこちら）

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --semi-auto --limit 3
```

- 全件を検出しますが、Print labels への追加は最初の 3 件のみ
- 追加後にターミナルが止まります。ブラウザで確認後、Enter で Save、Ctrl+C でキャンセル

### 全件 semi-auto

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --semi-auto
```

### 全件 通常モード（自動 Save）

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088"
```

`dry-run` と `semi-auto` で十分確認した後のみ使用してください。

---

## semi-auto モードの操作手順

1. コマンドを実行するとブラウザが開きます
2. Stock Count を開いて Current stock ≤ 0 の商品を検出します
3. Stock Count を Save して Print labels 画面に移動します
4. Print labels ファイルを作成し、商品を入力します
5. **ターミナルにメッセージが表示され、処理が止まります**
6. ブラウザで内容を確認します
7. ターミナルで **Enter** を押すと自動化が Save します
8. **Ctrl+C** を押すと Save 前にキャンセルできます（Print labels ファイルは残るので手動削除が必要）

---

## 既存 Print labels への追記（appendモード）

別の Stock Count の商品を既存の Print labels ファイルに追記します。

```bash
npm run label-print -- \
  --append-to-label-print "Atariya 16-06-2026 #47088" \
  --stock-count "Atariya 15-06-2026 #47070" \
  --semi-auto
```

append モードでの動作:
- 既存 Print labels ファイルを Edit で開きます
- 既存行の商品コードを読み取り、**重複商品はスキップ**します
- 読み取れない行がある場合は安全のため**実行を停止**します（手動確認が必要）
- 最初の空白行から新しい商品を追記します
- Save 後は通常モードと同様に Print labels 一覧に戻ります

---

## カスタムラベル名

Print labels ファイル名を Stock Count 名と別に指定できます:

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --label-print-name "新入荷ラベル"
```

---

## 引数一覧

| 引数 | 必須 | 説明 |
|------|------|------|
| `--stock-count "<名前>"` | ○ | 読み取り対象の Stock Count 名 |
| `--dry-run` | △ | 内容確認のみ（`--semi-auto` と同時使用不可） |
| `--semi-auto` | △ | Save前にターミナルで確認停止（`--dry-run` と同時使用不可） |
| `--limit N` | × | 追加する商品数を最初のN件に制限 |
| `--append-to-label-print "<名前>"` | × | 追記先の既存 Print labels 名（`--label-print-name` と同時使用不可） |
| `--label-print-name "<名前>"` | × | 新規作成時のラベル名（省略時は Stock Count 名）|
| `--headless` | × | ブラウザを非表示で実行 |
| `--slow-mo <ms>` | × | 操作をスローモーションで実行（デバッグ用） |

---

## 検出条件

Current stock の値が **0 以下**（0・マイナス値）の行を対象とします。

- Current stock = `0` → 対象
- Current stock = `-1` → 対象
- Current stock = `1` → 対象外
- Current stock が空・文字列 → スキップ（ログに記録）
- 同じ商品コードが複数行に存在する場合 → 最初の1件のみ追加（重複スキップ）

Difference・New stock 列はオプションです。空でも処理を継続します。

---

## ログ

各実行は `pos-label-print/logs/<runId>.json` に結果を記録します。

ログには以下が含まれます:
- `status`: `DRY_RUN` / `SUCCESS` / `SEMI_AUTO_CANCELLED` / `DUPLICATE_LABEL_PRINT` / `NO_NEW_LABEL_ITEMS` / `ERROR`
- `detectedItems`: 検出した全商品（Current stock ≤ 0）
- `labelPrintItems`: 実際に追加対象とした商品（`--limit` 適用後）
- `existingLabelItems`: append モードで読み取った既存商品
- `addedItems`: 実際に追加した商品
- `skippedItems`: スキップした行（商品コード不明 等）
- `skippedDuplicateProductCodes`: 重複としてスキップした商品
- `failedItems`: 追加に失敗した商品

ログファイルは Git 管理外です（`.gitignore` で除外済み）。

---

## エラーと対処

### `Print labels file already exists`

同名の Print labels ファイルが既に存在します。前回の実行が途中で失敗した場合、空・不完全なファイルが残っている可能性があります。CountIT の Print labels 画面でファイルを手動削除してから再実行してください。

または `--append-to-label-print` で既存ファイルに追記することもできます。

### `Stock count not found`

指定した Stock Count 名が見つかりません。CountIT の Stock counts 画面で正確な名前を確認してください。

### `Product selection not confirmed`

商品入力時にオートコンプリートの確認が取れませんでした。ネットワーク遅延や画面構造変更の可能性があります。`--slow-mo 500` を付けて再実行し、ブラウザの動作を確認してください。

### `Existing label print rows could not be read safely`

append モードで、既存行の商品コードが信頼できる形式で読み取れませんでした。CountIT の Print labels 画面を手動確認してから再実行してください。

---

## 開発者向けメモ

- ソース: `pos-label-print/src/`
- テスト: `pos-label-print/test/logic.test.js`
- コード変更後の確認:
  ```bash
  node --check pos-label-print/src/*.js
  npm run test:label-print
  ```
- CountIT の UI セレクタは `src/selectors.js` に集約しています
- 商品選択は `ArrowDown + Enter` の後 `Tab` でフォールバックし、description セルへの反映で確認します
- `_test` エクスポートはロジックテストのためにプライベート関数を公開しています
