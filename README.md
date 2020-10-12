# Backlog Notify

Notify commit messages to [Backlog.com](https://backlog.com/) issue.

プッシュされたコミットメッセージを Backlog 課題のコメントに追加する GitHub Action です。キーワードによる課題の状態変更も可能です。

:warning: プライベートリポジトリでの使用を想定しています。パブリックリポジトリでは使用しないでください。

:warning: 大量にプッシュするとそのまま投稿され、 Backlog に負荷がかかるのでご注意ください。

:warning: 個人が開発した Action です。Backlog へのお問い合わせはご遠慮ください。何かございましたらお気軽に issue へお願いいたします。 Pull request も歓迎します。

## 設定方法

1. BOT アカウントの作成
    1. Backlog のプロジェクトに移動します。
    1. `プロジェクト設定` →参加ユーザー→ `新しいユーザの追加はこちらから` を選択します。
    1. クラシックプランの場合は `一般ユーザ` 、新プランの場合は `ゲスト` を選択します。
    1. 登録します。
1. API キーの取得
    1. 登録した BOT アカウントにログインします。
    1. `個人設定` → `API` → `登録` で発行します。
1. API キーの登録
    1. GitGub のリポジトリページに移動します。
    1. `Setting` → `Secrets` → `Add a new secret` を選択します。
    1. `Name` は `BACKLOG_API_KEY` とし、 `Value` に API キーをそのまま貼り付けます。
    1. 登録します。
1. GitHub Actions workflow の作成
    1. GitGubのリポジトリページに移動します。
    1. `Actions` → `New workflow` → `Set up a workflow yourself` を選択します。
    1. `main.yml` を `backlog-notify` などの名前に変更します。
    1. 入力欄にYAMLを下記を参考に設定します。

        ```yaml
        name: Backlog Notify
        on: push
        jobs:
          backlog:
            runs-on: ubuntu-latest
            steps:
              - name: Backlog Notify
                uses: bicstone/backlog-notify@master
                env:
                  PROJECT_KEY: PROJECT_KEY
                  API_HOST: example.backlog.jp
                  API_KEY: ${{ secrets.BACKLOG_API_KEY }}
        ```

    1. `Start commit` をクリックしてコミットとプッシュします。

## 使用方法

[Backlog の Git](https://support-ja.backlog.com/hc/ja/articles/360035640734#Git_%E3%81%AE%E3%82%B3%E3%83%9F%E3%83%83%E3%83%88%E3%83%AD%E3%82%B0%E3%81%A7%E3%81%AE%E8%AA%B2%E9%A1%8C%E3%81%AE%E6%93%8D%E4%BD%9C) と同様です。ただし、今の所は先頭にある1つ目のキーしか認識しません。
付加機能として、コミットログで課題を操作することができます。

* `#fix` `#fixes` `#fixed` のどれかで処理済み
* `#close` `#closes` `#closed` のどれかで完了

例えば下記のようにコミットメッセージを設定してください。

```
PROJECT-123 不具合修正 #fix
```

## 環境変数一覧

|変数名|説明|必須|
|-|-|-|
|PROJECT_KEY|プロジェクトキー|○|
|API_HOST|APIのURL|○|
|API_KEY|APIキー|○|

## ライセンス

MIT License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbicstone%2Fbacklog-notify?ref=badge_large)
