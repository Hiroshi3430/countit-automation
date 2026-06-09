# CountIT Discount Automation

## 概要

このツールは、CSV入力をもとに CountIT の商品割引を登録・終了・置き換えするための自動化ツールです。

- CountITログインと会社切替は `../pos-common` を使います。
- 実行時設定は `Automation/.env` を使います。
- 現行運用は Node script 型です。

## 実行コマンド

```bash
npm run discounts:dry-run
npm run discounts:semi-auto
npm run discounts:full-auto
```

任意の入力ファイルを指定する場合:

```bash
node src/main.js --mode dry-run --input input/discount_input.csv
```

## 実行モード

- `dry-run`: CountIT画面を検索し、判定ログを出します。Save/Add は押しません。
- `semi-auto`: Save/Add の直前で止まります。popup内容を確認し、ターミナルで Enter を押すと続行します。
- `full-auto`: Save/Add の直前で止まらず、自動で保存します。十分に `dry-run` と `semi-auto` で確認した後だけ使ってください。

## 入力CSV

必要な列:

```csv
Product Code,Expected Product Name,Discount Price,Start Mode,Start Date,End Date,Operation,Memo
```

- `Product Code`: CountIT の `ArtNumber` と完全一致させる商品番号です。
- `Expected Product Name`: CountITの商品名と照合する期待商品名です。
- `Discount Price`: CountIT の New price に入力する割引後価格です。`END_ONLY` では空欄でも構いません。
- `Start Mode`: `NOW` または `FUTURE` を指定します。
- `Start Date`: `Start Mode = FUTURE` の場合に必要です。
- `End Date`: 新規割引の終了日時です。空欄なら終了なしです。
- `Operation`: 空欄、`CREATE_OR_REPLACE`、または `END_ONLY` を指定します。
- `Memo`: 運用メモです。処理判定には使いません。

## Operation

`Operation` には以下を指定できます。

- 空欄 または `CREATE_OR_REPLACE`
  - 通常の作成・置き換え処理です。
- `END_ONLY`
  - 現在有効な既存割引だけを終了します。
  - 新規割引は作成しません。
  - Add discount はクリックしません。
  - `Discount Price` は空欄で構いません。

## Start Mode と日付ルール

CountIT画面上の日時はローカル時刻として扱います。UTC変換はしません。

- `Start Mode = NOW`: 実行時点の現在日時で開始します。`Start Date` は不要です。
- `Start Mode = FUTURE` で日付のみ指定: その日の `00:00` に開始します。
- `Start Date` に時刻まで指定: 指定した日時に開始します。
- `End Date` が空欄: 終了日なしです。
- `End Date` が日付のみ: その日の `23:59` に終了します。
- `End Date` に時刻まで指定: 指定した日時に終了します。

## CREATE_OR_REPLACE の挙動

- 現在有効な既存割引なし: `CREATE_NEW`
- 現在有効な既存割引が1件: `END_EXISTING_AND_CREATE_NEW`
- 現在有効な既存割引が複数: `NEED_REVIEW`
- 未来開始の open-ended 割引予約あり: `NEED_REVIEW`
- 終了済み割引は自動処理では触りません。ただし件数が多い場合は review warning としてログに残ります。

## END_ONLY の挙動

- 現在有効な既存割引が1件: `END_EXISTING_ONLY`
- 現在有効な既存割引なし: `NEED_REVIEW`
- 現在有効な既存割引が複数: `NEED_REVIEW`
- 未来開始の open-ended 割引予約あり: `NEED_REVIEW`

既存割引の終了日時は、`Start Mode` と `Start Date` から決まります。

## 商品照合

- `Product Code` は CountIT の `ArtNumber` と完全一致させます。
- `Expected Product Name` は CountITの商品名と空白正規化後に一致確認します。
- fuzzy match は使いません。
- 商品番号または商品名が一致しない場合は `NEED_REVIEW` になります。

## 安全設計

- Confirm dialog が出ても、自動で Yes は押しません。
- Confirm dialog が出た場合は `DangerousAutomationError` で停止します。
- Save/Add 後のエラーも、CountIT側の保存状態が不明なため全体停止します。
- `semi-auto` は Save/Add 前に Enter 待ちします。
- `full-auto` は十分に検証した後だけ使ってください。

## input と examples

- `input/discount_input.csv` は実運用ローカルファイルです。
- `input/discount_input.csv` はGit管理しません。
- `examples/discounts.csv` はサンプルとしてGit管理します。

初回はサンプルをコピーして使います。

```bash
cp examples/discounts.csv input/discount_input.csv
```

## 実行ログ

実行ごとに以下を作成します。

```text
runs/<timestamp>/result-log.csv
runs/<timestamp>/screenshots/
```

`result-log.csv` には status、action、reason、新規割引日時、既存割引終了日時、warning、スクリーンショットパスなどが残ります。

## DEBUG_COUNTIT_COMPANY

通常は使いません。

CountITの会社名取得や会社切替で問題が起きた時だけ使います。

```bash
DEBUG_COUNTIT_COMPANY=1 npm run discounts:dry-run
```

DEBUG時は、CountIT画面上の会社名や候補テキストがログに出ます。email/password は出ない設計ですが、外部共有する場合はログ内容に注意してください。

## ローカル確認

以下はCountITにアクセスしません。

```bash
node --check src/*.js
npm test
```
