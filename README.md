# YouTubeチャットビューア (Cloudflare Pages版)

アプリケーションの構造を**Cloudflare Pages + Functions**を利用する、よりモダンで管理しやすい構成に更新しました。

## 新しいファイル構成

- **`/index.html`**: UI（ユーザーインターフェース）のすべてを担う単一のファイルです。**Cloudflare Pages**によって静的サイトとして配信されます。
- **`/functions/api/[[path]].js`**: YouTubeからのチャット取得など、すべてのバックエンドAPIロジックを担うファイルです。**Cloudflare Functions**として自動的にデプロイされます。

### 旧ファイルについて
以前のバージョンで使われていた `server.js`, `wrangler.toml`, `src` フォルダは現在使用されていません。これらは無視していただいて問題ありませんし、手動で削除しても構いません。

---

## デプロイ方法

このアプリケーションは、Cloudflare Pagesにデプロイすることで公開されます。方法は2つあります。

### 方法1: GitHub連携（推奨）

最も簡単で推奨される方法です。

1.  このプロジェクトのファイル（`index.html`と`functions`フォルダなど）を、ご自身のGitHubリポジトリにアップロード（プッシュ）します。
2.  Cloudflareのダッシュボードにログインします。
3.  `Workers & Pages` > `Pages` > `Create a new project` を選択し、先ほど作成したGitHubリポジトリに接続します。
4.  ビルド設定は不要です。「静的サイト」のプリセットのままで問題ありません。
5.  「Save and Deploy」をクリックすると、自動的にビルドとデプロイが開始されます。以降、GitHubリポジトリに新しい変更をプッシュするたびに、自動でサイトが更新されます。

### 方法2: Wrangler CLIによる手動デプロイ

コマンドラインから直接デプロイする方法です。

1.  **Wranglerのインストール** (未インストールの場合)
    ```bash
    npm install -g wrangler
    ```

2.  **Cloudflareへのログイン** (未ログインの場合)
    ```bash
    wrangler login
    ```

3.  **デプロイの実行**
    このプロジェクトのルートディレクトリ（`index.html`がある場所）で、以下のコマンドを実行します。
    ```bash
    wrangler pages deploy .
    ```
    `--project-name`フラグでCloudflare上のプロジェクト名を指定できます（例: `wrangler pages deploy . --project-name=yt-chat`）。

デプロイが完了すると表示される `.pages.dev` のURLにアクセスすれば、公開されたアプリケーションが使用できます。
