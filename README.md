# ユニバーサルYTチャットビューア

複数のプラットフォーム（ローカルPC、Vercel、Render.com）で動作するように設計された、ポータブルなYouTubeライブチャットビューアです。

UIはYouTubeのダークテーマを模しており、日本語化されています。

## アーキテクチャ

このアプリケーションは、多くのNode.jsホスティング環境で動作する標準的な構成を採用しています。

-   `/public`: フロントエンドの `index.html` ファイルが配置されています。
-   `/api/index.js`: `Express`で構築されたAPIサーバーのコアロジックです。Vercelではサーバーレス関数として、Render/ローカルではNode.jsサーバーの一部として動作します。
-   `/server.js`: Renderおよびローカル環境でサーバーを起動するためのエントリーポイントです。
-   `/package.json`: 依存関係 (`express`, `axios`) を定義します。
-   `/vercel.json`: Vercelのためのルーティング設定ファイルです。

---

## 依存関係のインストール

どの環境で実行する場合でも、最初に一度だけ依存関係をインストールする必要があります。

ターミナルでプロジェクトのルートディレクトリに移動し、以下のコマンドを実行してください。

```bash
npm install
```

---

## 各環境での実行・デプロイ方法

### 1. ローカル環境での実行

開発やローカルでのテストを行う場合の手順です。

1.  `npm install` を実行（初回のみ）。
2.  以下のコマンドでサーバーを起動します。

    ```bash
    npm start
    ```
3.  ブラウザで `http://localhost:3000` にアクセスします。

### 2. Vercelへのデプロイ

VercelはGitリポジトリと連携して、非常に簡単にデプロイできます。

1.  このプロジェクトのファイルをすべてGitHubリポジトリにアップロードします。
2.  Vercelにログインし、"Add New... > Project" を選択します。
3.  作成したGitHubリポジトリをインポートします。
4.  フレームワークのプリセットとして`Vercel`が自動的に設定を認識します。そのまま`Deploy`ボタンをクリックします。
5.  デプロイが完了すると、`.vercel.app`のURLが発行されます。

### 3. Render.comへのデプロイ

RenderもGitリポジトリと連携してデプロイします。

1.  このプロジェクトのファイルをすべてGitHubリポジトリにアップロードします。
2.  Renderのダッシュボードで "New + > Web Service" を選択します。
3.  作成したGitHubリポジトリに接続します。
4.  以下の設定を確認・入力します。
    -   **Runtime:** `Node`
    -   **Build Command:** `npm install`
    -   **Start Command:** `npm start`
5.  「Create Web Service」をクリックすると、ビルドとデプロイが開始されます。

### Cloudflare Pagesについて

このコードベースはNode.jsランタイムを前提としています。Cloudflare Pagesの標準環境はNode.jsではないため、このままでは動作しません。

Cloudflareで実行したい場合は、以前にご提案した**Cloudflare Pages + Functions**の構成（`functions`ディレクトリにAPIを配置する方式）で別途構築する必要があります。