# CountIT Stock Automation

## 概要

このツールは、ローカル入力ファイルをもとに CountIT の Inventory Counts 入力を補助する自動化ツールです。

- CountITログインと会社切替は `../pos-common` を使います。
- 実行時設定はリポジトリルートの `.env` を使います。
- Add はモードに応じて自動化対象です。
- Process はどのモードでも押しません。

## 実行コマンド

```bash
npm run stock:dry-run
npm run stock:semi-auto
npm run stock:full-auto
```

任意の入力ファイルを指定する場合:

```bash
node src/main.js --mode dry-run --input input/stock_input.tsv
```

## 実行モード

- `dry-run`: 入力内容の確認を行います。Add は押しません。
- `semi-auto`: Add の直前で止まります。ブラウザ内容を確認し、ターミナルで Enter を押すと Add します。
- `full-auto`: Add まで自動実行します。

Process は、`dry-run` / `semi-auto` / `full-auto` のどのモードでも押しません。

## 入力ファイル

標準の stock 入力形式は、`examples/stock_input.example.tsv` と同じタブ区切りTSV形式です。
`--input` で `.csv` ファイルを指定した場合は、カンマ区切りCSVとして読み込みます。
Google Sheets由来のファイルは、列内のカンマによる事故を避けるためTSVを推奨します。
`.tsv` / `.csv` 以外の拡張子は読み込みません。

列:

```text
type	product_code	amount	product_name	description
```

行の種類:

- `setting` 行が1行必要です。
  - `type`: `setting`
  - `description`: CountIT の Inventory Count description に入力する説明文です。
  - その他の列は空欄で構いません。
- `item` 行が1行以上必要です。
  - `type`: `item`
  - `product_code`: CountITに入力する商品コードです。
  - `amount`: 数量です。整数で入力します。
  - `product_name`: CountIT上で照合する期待商品名です。
  - `description`: 通常は空欄です。

例:

```text
type	product_code	amount	product_name	description
setting				Sample stock dry-run
item	10001	1	Sample Product	
```

## input と examples

- `input/stock_input.tsv` は実運用ローカルファイルです。
- `input/stock_input.tsv` はGit管理しません。
- `examples/stock_input.example.tsv` はサンプルとしてGit管理します。

初回はサンプルをコピーして使います。

```bash
cp examples/stock_input.example.tsv input/stock_input.tsv
```

## 実行ログ

実行ごとに以下を作成します。

```text
runs/<timestamp>/result-log.csv
runs/<timestamp>/screenshots/
```

`result-log.csv` は実行ログのCSVであり、stock入力ファイルとは別物です。

## 安全設計

- `full-auto` でも Add までしか実行しません。Process は絶対に押しません。
- CountIT上で Process しない限り、実在庫には反映されません。
- Process 前に、必ず CountIT画面で内容を確認してください。
- Add 送信前に `assertSafeStockSubmitState` が URL・フォーム・ボタン状態を確認します。異常があれば `DangerousAutomationError` で停止します。
- Add 後にエラーが起きた場合も、CountIT側の保存状態が不明なため `DangerousAutomationError` で全体停止します。
- `semi-auto` は Add の直前でターミナルが止まり、Enter 後にのみ Add します。

## Known gaps

- Google Sheets URL を直接 `--input` に指定する読み込みにはまだ対応していません。ローカルの `.tsv` または `.csv` として保存してから使ってください。
- CountIT の行IDと入力欄名に対して厳密なセレクタ前提があります。画面構造が変わった場合は、代替セレクタを推測せずに停止します。

## DEBUG_COUNTIT_COMPANY

通常は使いません。

CountITの会社名取得や会社切替で問題が起きた時だけ使います。

```bash
DEBUG_COUNTIT_COMPANY=1 npm run stock:dry-run
```

DEBUG時は、CountIT画面上の会社名や候補テキストがログに出ます。email/password は出ない設計ですが、外部共有する場合はログ内容に注意してください。

## ローカル確認

以下はCountITにアクセスしません。`pos-stock-automation/` ディレクトリ内から実行するか、リポジトリルートからサブシェル形式で実行してください。

```bash
# pos-stock-automation/ 内から実行
node --check src/*.js
npm test

# リポジトリルートから実行する場合
( cd pos-stock-automation && npm test )
```
