# DRUM SUPPS BLOG

`DESIGN.md`（デザイン仕様）を唯一の真実として実装した Jekyll ブログ。
仕様は `specs/SPEC.md` に受入基準として展開してあり、`tests/` がビルド成果物に対して機械検証する。

## セットアップ

Ruby が必要。ホストに rbenv があればそれを、無ければ podman のコンテナを自動的に使う。

### A. rbenv（推奨）

```bash
sudo dnf install -y libffi-devel gdbm-devel bzip2-devel readline-devel \
                    libyaml-devel perl-FindBin autoconf gcc-c++
rbenv install 3.3.9      # .ruby-version の指定
gem install bundler
bundle config set --local path vendor/bundle
bundle install
```

`gcc-c++` は `eventmachine`（`jekyll` → `em-websocket` の依存。`serve --livereload` で使う）の
ネイティブ拡張ビルドに要る。`gcc` だけでは `bundle install` がここで止まる。

### B. podman（Ruby を入れたくない場合）

何もしなくてよい。`bin/jekyll` がホストで `bundle` が使えないことを検出して、
`docker.io/library/ruby:3.3` の中で同じコマンドを走らせる。
`--userns=keep-id` で動かすので、生成物の所有者はホストのユーザーのまま。

## コマンド

```bash
npm run build      # 本番ビルド → _site/（sass compressed）
npm test           # ビルド 2 回 + 仕様検証（80 件）
npm run serve      # http://127.0.0.1:4000
```

`npm test` は `_config.test.yml` を重ねた展開 CSS のビルド（`_site-test/`）に対して
アサートする。圧縮 CSS に正規表現を当てると空白差で壊れるため。

## ディレクトリ

```
DESIGN.md          デザイン仕様（唯一の真実。実装側の都合で書き換えない）
specs/SPEC.md      受入基準 AC-01〜AC-35 と、DESIGN.md 内部の矛盾に対する判断
tests/             AC に 1:1 対応する自動検証（node:test + linkedom）
docs/authoring.md  記事の書き方
reports/           品質ゲートの記録

_sass/             DESIGN.md §2〜§9 をそのまま落としたスタイル
_includes/         head / banner / header / footer / post-card / pagination
_layouts/          default / page / post
_posts/            記事
archive.html       /archive/（全記事の年別一覧）
assets/            css / js / img
bin/jekyll         Ruby が無い環境向けのコンテナフォールバック
```

## 触るときの注意

- **色は必ず `var(--token)`**。ハードコードすると `AC-02` が落ちる
- **`font-weight` は 400 / 600 / 700 / 900 のみ**（`AC-08`）
- **ホバーで浮かせない・影を落とさない**（`AC-14`）
- ブレークポイントは **768px だけ**（`AC-12`）
- `theme-init.js` に `defer` / `async` を付けない（`AC-03`。付けると白フラッシュが出る）

いずれも `npm test` が検出する。仕様を変えるときは `DESIGN.md` → `specs/SPEC.md` →
`tests/` → 実装、の順に落とす。
