# JS23 課題 No.06 `dolync`

IH12A 17 中尾 元信

## 📱 dolync（ドゥーリンク）

**App URL**

https://app.moto0314.com

# 先生へ。<br>

にて、先生の学校のアカウント：<br>
@thi.hal.ac.jp<br>
cloudflare の認証をクリアすれば接続できます。<br>
メール認証に、outlook の登録？メール見ることが必要なので、お願いします。<br>

それから、コラボレーターとして、<br>
https://github.com/moto060314/node06<br>
に招待しています。

今回のプロジェクトはあえて、.env を ignore してません。<br>
（セットアップを作るのがめんどくさくて...）<br>

compose には、mysql, phpmyadmin, node.js が入ってます。<br>

app.moto0314.com はアプリケーションの URL ですが、<br>
別途、 https://sql.moto0314.com で今回のサーバーの phpmyadmin を公開しています。<br>

**「『今、何やってる？』を、みんなの承認に変える。」**

`dolync` は、完了したタスクではなく、**「今まさに取り組んでいる状態（Doing）」** を共有することに特化した SNS 型 TODO アプリケーションです。<br>
孤独になりがちな作業時間を、リアルタイムなリアクションを通じて「みんなに見守られ、評価される時間」へと変えることを目指しています。<br>

---

## 💡 コンセプト

従来の TODO アプリは「タスクを完了させること」がゴールであり、その過程は孤独なものでした。<br>
しかし、努力の過程こそが尊く、評価されるべきではないでしょうか？<br>

`dolync` は以下の価値を提供します：

1.  **Process Economy**: 成果物だけでなく、プロセスそのものをコンテンツ化し、価値に変える。
2.  **Live Validation**: 「今やっている」ことに対して即座にリアクションが届くことで、モチベーションを維持する。
3.  **Creative Communication**: ユーザー自身がリアクションを作成・共有することで、独自のコミュニケーション文化を形成する。

---

## 🚀 機能一覧

### 1. Public Doing Timeline (リアルタイム投稿)

- ユーザーは「今やっていること」を投稿します。
- **1 ユーザーにつき 1 つの投稿のみ**：新しい投稿をすると、古い投稿は自動的に削除されます。「今」にフォーカスするためです。
- Socket.io によるリアルタイム更新で、リロードなしで他ユーザーの活動が流れてきます。

### 2. Custom Live Reactions (リアクション)

- 投稿に対して、Discord のようなスタンプ形式でリアクションを送れます。
- **ユーザー定義リアクション**: ユーザーは好きな画像と名前でオリジナルのリアクションを作成・追加できます。
- 誰がどのリアクションをしたかが可視化され、承認欲求を満たします。

### 3. User Profile

- ユーザー名、プロフィール画像のカスタマイズが可能。
- 認証機能（サインアップ、サインイン、サインアウト）を完備。

---

## 🛠 技術スタック

### Backend

- **Runtime**: Node.js (v22)
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Realtime**: Socket.io
- **Session Store**: express-mysql-session

### Frontend

- **Template Engine**: EJS
- **CSS**: Custom CSS (SCSS-like nesting), Mobile Responsive
- **JS**: Vanilla JS (ES6+)

### Infrastructure / Dev Tools

- **Container**: Docker, Docker Compose
- **Process Manager**: Nodemon
- **Build Tool**: Makefile

---

## 🗄 データベース設計

| テーブル名       | 説明                                                                     |
| :--------------- | :----------------------------------------------------------------------- |
| `users`          | ユーザー情報（ID, 名前, Email, パスワードハッシュ, アイコン）            |
| `posts`          | 投稿データ（ユーザー ID, 内容, 作成日時）。1 ユーザー最新 1 件のみ保持。 |
| `reaction_types` | リアクションの定義（名前, 画像 URL, 作成者 ID）。ユーザーが追加可能。    |
| `reactions`      | リアクション履歴（投稿 ID, ユーザー ID, リアクション種別 ID）。          |
| `sessions`       | セッション情報（ログイン状態の永続化）。                                 |

---

## 💻 セットアップ & 起動方法

### 前提条件

- Docker および Docker Compose がインストールされていること。

### 1. リポジトリのクローン

```bash
git clone https://github.com/moto060314/node06.git
cd node06
```

### 2. 環境変数の設定

`.env` ファイルを確認してください（デフォルト設定で動作します）。

### 3. アプリケーションの起動

Makefile を使用して簡単に起動できます。

```bash
make build
```

```bash
make up
```

または

### 4. アクセス

ブラウザで以下の URL にアクセスしてください。

- **アプリ本体**: [http://localhost:3000](http://localhost:3000)
- **phpMyAdmin**: [http://localhost:8080](http://localhost:8080)

### 5. 停止

```bash
make down
```

---

## 📝 開発者向け情報

### ディレクトリ構成

```
.
├── public/          # 静的ファイル (CSS, JS, Uploads)
├── src/
│   ├── controllers/ # リクエスト処理ロジック
│   ├── database/    # DB接続設定, スキーマ
│   ├── models/      # データアクセス層
│   ├── routes/      # ルーティング定義
│   └── sockets/     # Socket.io イベントハンドラ
├── views/           # EJS テンプレート
├── app.js           # エントリーポイント
└── docker-compose.yml
```

### リアルタイム通信の仕組み

- **投稿時**: `create_post` イベントを送信 → サーバーが DB 更新 → `new_post` イベントを全クライアントにブロードキャスト。
- **リアクション時**: `toggle_reaction` イベントを送信 → サーバーが DB 更新 → `update_reactions` イベントを全クライアントにブロードキャスト。
