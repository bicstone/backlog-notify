# Backlog Notify

[![CI](https://github.com/bicstone/backlog-notify/actions/workflows/ci.yml/badge.svg)](https://github.com/bicstone/backlog-notify/actions/workflows/ci.yml)
[![coverage](https://github.com/bicstone/backlog-notify/actions/workflows/coverage.yml/badge.svg)](https://github.com/bicstone/backlog-notify/actions/workflows/coverage.yml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify?ref=badge_shield)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bicstone_backlog-notify&metric=alert_status)](https://sonarcloud.io/dashboard?id=bicstone_backlog-notify)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/bicstone/backlog-notify.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/bicstone/backlog-notify/alerts/)
[![Coverage Status](https://coveralls.io/repos/github/bicstone/backlog-notify/badge.svg?branch=master)](https://coveralls.io/github/bicstone/backlog-notify?branch=master)

Notify commit messages to [Backlog.com](https://backlog.com/) issue.

プッシュされたコミットメッセージを Backlog 課題のコメントに追加する GitHub Action です。キーワードによる課題の状態変更も可能です。

個人が開発した Action です。Backlog へのお問い合わせはご遠慮ください。

## スクリーンショット

## 設定方法

### Backlog API キーの取得

1. Backlog のプロジェクトに移動します。
1. プロジェクト設定 → 参加ユーザー → 新しいユーザの追加はこちらから を選択します。
1. クラシックプランの場合は `一般ユーザ` 、新プランの場合は `ゲスト` を選択します。
1. 登録します。
1. 登録した BOT アカウントにログインします。
1. `個人設定` → `API` → `登録` で API キーを発行します。

### API キーを GitHub に登録

1. GitHub のリポジトリページに移動します。
1. Setting → Secrets → Add a new secret を選択します。
1. Name は `BACKLOG_API_KEY` とし、 Value に API キーをそのまま貼り付けます。
1. 登録します。

### collaborator による workflow の実行を制限

プライベートリポジトリの場合は下記の操作を行う必要はありません。  
パブリックリポジトリの場合は、collaborator からの workflow の実行を制限してください。

1. Setting → Actions → Fork pull request workflows from outside collaborators を開きます。
1. `Require approval for all outside collaborators` を選択します。

### Workflow の作成

GitHub Actions workflow を作成します (例: `.github/workflows/backlog-notify.yml` )。
下記のような形式である必要があります。

```yaml
name: Backlog Notify

on: push

jobs:
  notify:
    runs-on: ubuntu-latest

    steps:
      - name: Backlog Notify
        uses: bicstone/backlog-notify@v1
        env:
          PROJECT_KEY: PROJECT_KEY
          API_HOST: example.backlog.jp
          API_KEY: ${{ secrets.BACKLOG_API_KEY }}
```

## 設定一覧

他の Github Actions と異なり、env を用いて指定します。

| 変数名      | 説明             | 必須 |
| ----------- | ---------------- | ---- |
| PROJECT_KEY | プロジェクトキー | ○    |
| API_HOST    | API の URL       | ○    |
| API_KEY     | API キー         | ○    |

## 使用方法

[Backlog の Git](https://support-ja.backlog.com/hc/ja/articles/360035640734) と同様です。課題キーは先頭にある 1 つ目のキーのみ認識します。  
付加機能として、コミットログで課題を操作することができます。

- `#fix` `#fixes` `#fixed` のどれかで処理済み
- `#close` `#closes` `#closed` のどれかで完了

例えば下記のようにコミットメッセージを設定してください。

```
PROJECT-123 不具合修正 #fix
```

大量にプッシュするとそのまま投稿され、 Backlog に負荷がかかるのでご注意ください。

## よくある質問と回答

- 何をプッシュしても実行に失敗し、ログに 401 エラーとある
  →API キーが誤っている可能性があります。

- プロジェクトキーと課題キーが正しいのに実行に失敗し、ログに 404 エラーとある
  → 該当 API キーのユーザーがプロジェクトに参加していない可能性があります。

## 貢献

貢献はいつでも大歓迎いたします。事前に [./CONTRIBUTING.md](CONTRIBUTING.md) をご確認ください。

contributions are always welcome. Please read [./CONTRIBUTING.md](CONTRIBUTING.md).

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## ライセンス

MIT License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify?ref=badge_large)
