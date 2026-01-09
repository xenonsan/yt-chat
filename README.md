# YouTubeチャットビューア (Cloudflare Workers版)

アプリケーションの構造を、Node.jsで実行する形態から**Cloudflare Workers**上で実行する形態に全面的に刷新しました。
これにより、ご自身のPCでサーバーを起動する必要がなくなり、Cloudflareのグローバルネットワーク上でアプリケーションを公開・実行できます。

## 新しいアーキテクチャ

- **`src/index.js`**: フロントエンドのHTMLと、APIのロジックがすべて含まれたCloudflare Workerスクリプトです。
- **`wrangler.toml`**: Cloudflareにデプロイするための設定ファイルです。

## デプロイ方法

このアプリケーションをCloudflareにデプロイするには、`wrangler`というコマンドラインツールを使用します。

### ステップ1: Wranglerのインストール

まだWranglerをインストールしていない場合は、ターミナルで以下のコマンドを実行してインストールします。Node.jsがPCにインストールされている必要があります。

```bash
npm install -g wrangler
```

### ステップ2: Cloudflareへのログイン

以下のコマンドを実行すると、ブラウザが開きCloudflareアカウントへのログインを求められます。一度ログインすれば、このPCでは再ログインは不要です。

```bash
wrangler login
```

### ステップ3: アプリケーションのデプロイ

最後に、このプロジェクトのルートディレクトリ（この`README.md`ファイルがある場所）で、以下のコマンドを実行します。

```bash
wrangler deploy
```

コマンドが成功すると、`... .workers.dev` という形式のURLが表示されます。そのURLにブラウザでアクセスすると、公開されたアプリケーションを使用できます。

## 開発（ローカルテスト）

ローカル環境でデプロイ前に動作確認をしたい場合は、以下のコマンドを実行します。

```bash
wrangler dev
```

これにより、`http://localhost:8787` でローカルサーバーが起動します。
