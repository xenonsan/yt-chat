# YT-chat

ローカルPC、Cloudflare Pages、Vercel、Render.comなど、複数の環境で動作するYouTubeライブチャットビューアです。

---

## 各環境での実行・デプロイ方法

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
