# CountIT Stock Automation

## 概要

このツールは、ローカル入力ファイルをもとに CountIT の Inventory Counts 入力を補助する自動化ツールです。

- CountITログインと会社切替は `../pos-common` を使います。
- 実行時設定は `Automation/.env` を使います。
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
node src/main.js --mode dry-run --input input/stock_input.csv
```

## 実行モード

- `dry-run`: 入力内容の確認を行います。Add は押しません。
- `semi-auto`: Add の直前で止まります。ブラウザ内容を確認し、ターミナルで Enter を押すと Add します。
- `full-auto`: Add まで自動実行します。

Process は、`dry-run` / `semi-auto` / `full-auto` のどのモードでも押しません。

## 入力ファイル

現在の stock 入力形式は、`examples/stock_input.example.csv` と同じタブ区切り形式です。

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

- `input/stock_input.csv` は実運用ローカルファイルです。
- `input/stock_input.csv` はGit管理しません。
- `examples/stock_input.example.csv` はサンプルとしてGit管理します。

初回はサンプルをコピーして使います。

```bash
cp examples/stock_input.example.csv input/stock_input.csv
```

## 実行ログ

実行ごとに以下を作成します。

```text
runs/<timestamp>/result-log.csv
runs/<timestamp>/screenshots/
```

## 注意事項

- `full-auto` でも Add までしか実行しません。
- Process は絶対に押しません。
- CountIT上で Process しない限り、実在庫には反映されません。
- Process 前に、必ず CountIT画面で内容を確認してください。

## DEBUG_COUNTIT_COMPANY

通常は使いません。

CountITの会社名取得や会社切替で問題が起きた時だけ使います。

```bash
DEBUG_COUNTIT_COMPANY=1 npm run stock:dry-run
```

DEBUG時は、CountIT画面上の会社名や候補テキストがログに出ます。email/password は出ない設計ですが、外部共有する場合はログ内容に注意してください。

## ローカル確認

以下はCountITにアクセスしません。

```bash
node --check src/*.js
npm test
```
