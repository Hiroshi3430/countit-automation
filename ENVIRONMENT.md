# 実行環境メモ

## 現在の開発・確認環境

この CountIT 自動化コードの初期開発・試作環境は macOS です。

現行構成は Node.js + Playwright + Git/GitHub を前提にしています。

macOS では、以下の動作を確認済みです。

- CountIT ログイン
- CountIT 会社切替
- Product検索
- Discount dry-run
- Stock Counts dry-run
- `npm test`

## Windowsでの利用について

Windowsでは現時点で未検証です。

ただし、この自動化は Node.js と Playwright ベースで作られているため、Windowsでも動作する可能性は高いです。利用前に、必ず `dry-run` から確認してください。

Windowsで使う場合は、特に以下に注意してください。

- Node.js がインストールされていること
- 各プロジェクトで `npm install` を実行すること
- Playwright browser が正しくインストールされていること
- `Automation/.env` を正しい場所に置くこと
- CSVの文字コードがUTF-8であること
- CSVの改行コードによる読み込み差がないこと
- PowerShell と Git Bash でコマンドの書き方が一部異なること
- パス区切りやカレントディレクトリの扱いを確認すること

## GitHubに上げないもの

以下は実行環境・実運用データ・生成物のため、GitHubには上げません。

- `.env`
- `.env.local`
- `input/*.csv`
- `runs/`
- `node_modules/`
- スクリーンショット
- 実行ログ

必要な環境変数は `.env.example` を参考にして、各PCの `Automation/.env` に設定してください。

## 他PC・Windowsへ移行する手順

1. GitHubから `Automation` リポジトリを取得します。
2. ルートの `.env.example` を参考に、`Automation/.env` をローカルで作成します。
3. `.env` に CountIT のログイン情報と会社名を設定します。
4. `pos-discount-automation` で `npm install` を実行します。
5. `pos-stock-automation` で `npm install` を実行します。
6. 必要に応じて Playwright browser をインストールします。
7. `examples/*.csv` を参考に、各プロジェクトの `input/*.csv` をローカルで作成します。
8. まず `npm test` を実行します。
9. CountIT操作は必ず `dry-run` から確認します。
10. `dry-run` 確認後、必要に応じて `semi-auto`、十分に検証した後で `full-auto` を使います。

## 利用範囲

現時点では、このコードは Atariya 業務用の社内自動化ツールです。

CountITの画面構造、Atariyaの運用ルール、入力CSVの形式に合わせて作られており、完全な汎用ツールではありません。他社・他業務・異なるCountIT設定で使う場合は、事前に画面構造と業務ルールを確認してください。
