# 真のユニバーサルYTチャットビューア

ローカルPC、Cloudflare Pages、Vercel、Render.comなど、複数の環境で**同じコードベース**で動作するように設計された、究極のポータブルYouTubeライブチャットビューアです。

UIはYouTubeのダークテーマを模しており、日本語化されています。

## アーキテクチャ：Write Once, Run Anywhere

このプロジェクトは、各プラットフォームのランタイムの違いを吸収する「アダプターパターン」を採用しています。

-   **`/src/handler.js`**: アプリケーションのすべてのコアロジックを含みます。特定のプラットフォームに依存しないWeb標準API（`Request`, `Response`, `fetch`）のみで記述されています。
-   **`/public/index.html`**: フロントエンドのHTMLファイルです。handlerに埋め込まれて配信されます。
-   **`/public/_worker.js`**: **Cloudflare Pages**用のエントリーポイントです。リクエストをコアロジックに直接渡すだけの薄いラッパーです。
-   **`/server.js`**: **ローカル環境、Render, Vercel**用のNode.jsエントリーポイントです。Node.js固有のHTTPリクエストをWeb標準の`Request`オブジェクトに変換し、コアロジックを呼び出す「アダプター」として機能します。
-   **`package.json`**: 依存関係のない最小限の構成ファイルですが、各プラットフォームがNode.jsプロジェクトとして認識し、`start`コマンドを実行するために必要です。

---

## 各環境での実行・デプロイ方法

この構成では、依存関係のインストールは**不要**です (`npm install`は必要ありません)。

### 1. ローカル環境での実行

1.  ターミナルで以下のコマンドを実行してサーバーを起動します。
    ```bash
    npm start
    ```
    または
    ```bash
    node server.js
    ```
2.  ブラウザで `http://localhost:3000` にアクセスします。

### 2. Cloudflare Pagesへのデプロイ

Cloudflare PagesはGitリポジトリと連携して、`_worker.js`を自動的に認識します。

1.  このプロジェクトのファイル（特に`public`フォルダと`src`フォルダ）をすべてGitHubリポジトリにアップロードします。
2.  Cloudflareのダッシュボードで`Pages`プロジェクトを新規作成し、GitHubリポジトリを接続します。
3.  **ビルド設定は不要です。** 「プリセット」として「None」を選択し、「ビルドコマンド」や「ビルド出力ディレクトリ」は空のままで構いません。
4.  「Save and Deploy」をクリックします。Cloudflareが自動的に`/public`ディレクトリを静的サイトとして認識し、`_worker.js`を有効にします。

### 3. Vercelへのデプロイ

Vercelは`server.js`をサーバーレス関数として自動的にラップしてくれます。

1.  このプロジェクトのファイルをすべてGitHubリポジトリにアップロードします。
2.  Vercelにログインし、GitHubリポジトリをインポートしてプロジェクトを作成します。
3.  Vercelが`package.json`と`server.js`を認識し、自動的に正しい設定でデプロイしてくれます。「Root Directory」がプロジェクトのルートになっていることを確認してください。
4.  そのまま`Deploy`ボタンをクリックします。

### 4. Render.comへのデプロイ

Renderは`server.js`をNode.jsのWebサービスとして起動します。

1.  このプロジェクトのファイルをすべてGitHubリポジトリにアップロードします。
2.  Renderのダッシュボードで "New > Web Service" を選択し、GitHubリポジトリを接続します。
3.  以下の設定を確認・入力します。
    -   **Runtime:** `Node`
    -   **Build Command:** (空のままでOK、または `npm install` のままでも問題ありません)
    -   **Start Command:** `npm start` または `node server.js`
4.  「Create Web Service」をクリックすると、デプロイが開始されます。
