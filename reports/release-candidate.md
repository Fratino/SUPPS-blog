# リリース候補レポート — RC-1

FDO（Spec → Test → AI 実装 → 検証）の 1 周ぶんの記録。

| 項目 | 値 |
|---|---|
| 日付 | 2026-08-09 |
| 仕様バージョン | `specs/SPEC.md` v1.0.0 |
| 設計仕様 | `DESIGN.md` sha256 `0549bdd9eb648396c1e73db810c542e661ad95ed0be2ddcee3568049187b465a` |
| 受入基準 | AC-01 〜 AC-35（AC-32〜35 は検証・レビュー中に追加） |
| 自動検証 | 78 件 / 全 pass |
| Ruby | 3.3.9（rbenv / ホスト） |
| Jekyll | 4.4.1 |

---

## 1. 品質ゲート

| Gate | 結果 | 根拠 |
|---|---|---|
| Spec | ✅ | `specs/SPEC.md` に AC-01〜AC-35。DESIGN.md 内部の矛盾 6 件を §2.7 に明記して解決済み |
| Test | ✅ | `tests/` 12 ファイル・78 件。全 AC にトレーサビリティ表で 1:1 対応 |
| Build | ✅ | `jekyll build` がエラー・警告ゼロで完了。`jekyll doctor` も "Everything looks fine" |
| Quality | ✅ | `npm test` 78/78 pass |
| Security | ✅ | `bundle-audit check` → No vulnerabilities found / `npm audit` → 0 vulnerabilities |
| Review | ✅ | `code-review` の指摘 14 件を処理（§8）。13 件修正、1 件は根拠を記録して維持 |

---

## 2. ビルド成果物

```
_site/  21 ファイル / 80,575 バイト
  index.html                     トップ（1 ページ目）
  page/2/index.html              ページネーション 2 ページ目
  posts/{3 記事}/index.html
  tags/index.html                タグ一覧
  tags/{ドラム,音作り,機材,練習法}/index.html   autopages が生成
  about/index.html
  404.html
  feed.xml  sitemap.xml  robots.txt
  assets/css/main.css            12,062 バイト（compressed / sourcemap なし）
```

パフォーマンス面の実測: CSS 12.1KB、最大 HTML 10KB、外部リクエストは Google Fonts の
2 ドメインのみ。第三者スクリプトはゼロ（AC で継続的に検証）。

## 3. 依存

| gem | version |
|---|---|
| jekyll | 4.4.1 |
| jekyll-feed | 0.17.0 |
| jekyll-paginate-v2 | 3.0.0 |
| jekyll-sass-converter | 3.1.0（sass-embedded 1.102.0） |
| kramdown | 2.5.2 / rouge 4.7.0 |

npm 側は `linkedom` のみ（devDependency）。

---

## 4. 仕様に対する逸脱と判断

`specs/SPEC.md` §2.7 に一覧がある。要点だけ再掲する。

| # | 内容 | 判断 |
|---|---|---|
| C-1 | §3.4「font-weight は 400/600/700/900」vs §5.1 `.nav-link` の `500` | **400** を採用（一般規則を優先） |
| C-2 | §11「ボーダーは 2px まで」vs §6 `blockquote { border-left: 3px }` | **3px** を維持し AC-16 に例外を明記 |
| C-3 | §10 の `@import` | **`@use`** に変更（Dart Sass で `@import` は非推奨。出力 CSS は同一） |
| C-4 | §5 の `font:` shorthand | **longhand に展開**（Dart Sass が `13px/1` をスラッシュ除算と解釈し line-height が落ちる。出力 CSS は同一） |
| C-5 | §3.3 の表は h4 の字送りを 0、§6 は h2/h3/h4 まとめて -.01em | **0**（表のほうが役割ごとに個別指定していて意図が明確） |
| C-6 | §11「日本語に uppercase を掛けない」vs §5.3 `.tag` / §6 `.prose th` の uppercase 指定 | **uppercase を維持**（日本語に case が無く描画は変わらない。§8 R-15 参照） |

その他の構成上の判断:

- **Jekyll ソースをリポジトリルートに置いた**（FDO の `src/` 規約からの逸脱）。
  `src/` 配下に押し込むと GitHub Pages を含む標準的なデプロイ経路が壊れるため。
  `DESIGN.md` §10 の構成表もルート配置を前提にしている。
- **rouge のテーマ CSS を読み込んでいない**。既存の rouge テーマはハードコードされた色を
  大量に含み、「色は必ず `var(--token)`」（§11 Do）と両立しない。コードブロックは
  `_sass/_prose.scss` の `pre` / `code` の指定だけで組んでいる。
  シンタックスの色分けが必要になったら、トークンから作った独自テーマを足すこと。
- **ロゴはプレースホルダ**。本体アプリのロゴ SVG が無いため、`assets/img/logo.svg` に
  単色のワードマークを置いた。`filter: brightness(0) invert(1)` での反転が効く形にしてある。
- **タグページは jekyll-paginate-v2 の autopages で生成**。素の Jekyll はタグページを
  生成できず、`_layouts/post.html` が `/tags/:slug/` へ無条件にリンクするため必須。
  ただし **GitHub Pages の標準ビルドではこのプラグインが動かない**。GH Pages に載せるなら
  Actions で自前ビルドする必要がある。

## 5. 検証で見つかり、修正した不具合

自動テストが通ったあとの生成物の目視確認で 3 件見つかった。いずれも回帰テストを追加済み。

| # | 内容 | 修正 | 追加した検証 |
|---|---|---|---|
| B-1 | `bin/jekyll`（コンテナ実行用ラッパー）が `_site` に公開されていた | `_config.yml` の `exclude` に `bin` を追加 | AC-33 |
| B-2 | トップでナビの HOME がアクティブにならない。`page.url` が `/` とは限らず、2 ページ目は `/page/2/` になるため | `_includes/header.html` で `index.html` を除去して比較し、`/page/` もトップ扱いに | AC-32 |
| B-3 | トップの `<title>` が `DRUM SUPPS BLOG \| DRUM SUPPS BLOG` と二重になる。jekyll-paginate-v2 が `page.title` に `site.title` を注入するため | `page.title != site.title` のときだけ連結 | AC-28 に追加 |

テスト側の不備も 3 件直した（実装の欠陥ではない）。

- Sass が `.01em` を `0.01em` に正規化するため、DESIGN.md の表記と直接文字列比較すると落ちていた
  → `normNum()` で数値表記のゆれを吸収
- prose 全要素を含むサンプル記事の判定条件が誤っていた（Markdown 本文を HTML タグ名で探していた）

## 5.1 公開前に差し替えが要るもの

| 場所 | 現在の値 | 備考 |
|---|---|---|
| `_config.yml` の `url` | `https://blog.drumsupps.example` | `feed.xml` / `sitemap.xml` / `robots.txt` の絶対 URL に出る。**本番ドメインに要変更** |
| `about.md` の本体サイトリンク | `https://drumsupps.example` | 本体サイトの URL に要変更 |
| `assets/img/logo.svg` | 暫定ワードマーク | 本体アプリのロゴ SVG に差し替え |
| `assets/img/posts/*.svg` | プレースホルダ | 実写に差し替え |
| `_posts/` の 3 本 | 検証用のサンプル | 実記事に差し替えるか削除 |

## 6. 環境

rbenv での構築が完了。ホストだけでビルド・テスト・プレビューが完結する。

| 項目 | 状態 |
|---|---|
| `~/.rbenv` + `ruby-build` | ✅ 設置済み。`~/.bashrc` に `rbenv init` を追記 |
| Ruby 3.3.9 | ✅ `rbenv install` 完了。`.ruby-version` で local 指定 |
| bundler / gem | ✅ `bundle install` 完了（40 gems、`vendor/bundle`） |

途中 2 回、`sudo` の要る OS パッケージ導入が必要だった。同じ環境を再構築する場合は先に入れておくとよい。

```
sudo dnf install -y libffi-devel gdbm-devel bzip2-devel readline-devel \
                    libyaml-devel perl-FindBin autoconf gcc-c++
```

`gcc-c++` は `eventmachine`（`jekyll` → `em-websocket` の依存、`serve --livereload` で使う）の
ネイティブ拡張ビルドに要る。`gcc` だけでは足りない。

### `bin/jekyll` について

ホストに Ruby が無い環境向けのフォールバックとして残してある。
`bundle` が使えて `bundle check` が通るときはホストの Ruby を、
そうでなければ `docker.io/library/ruby:3.3` コンテナを使う。

rbenv の shims は npm scripts の非対話シェルに載らない（`.bashrc` が読まれない）ため、
`bin/jekyll` 側で `~/.rbenv/shims` を PATH に足している。これが無いと、
ホストに Ruby があるのに `npm test` が毎回コンテナへ落ちる。

### 実機での動作確認

`bundle exec jekyll serve` を起動して HTTP で確認した結果:

| パス | 応答 |
|---|---|
| `/` | 200 |
| `/posts/rudiments-practice/` | 200 |
| `/tags/ドラム/`（%エンコード） | 200 |
| `/assets/js/theme-init.js` | 200（JS として。HTML ではない） |
| `/assets/css/main.css` | 200 |

## 7. 監査ログ

| 要求項目 | 記録 |
|---|---|
| 仕様バージョン | `specs/SPEC.md` v1.0.0 / `DESIGN.md` sha256 上記 |
| テスト結果 | `npm test` 78 件 pass（本レポート §1） |
| AI 生成コミット | **なし**。git リポジトリを作らない選択のため未記録 |
| 独立レビュー結果 | §8（`code-review` スキル） |

---

## 8. 独立レビュー結果

`code-review` スキル（実装文脈を持たない別エージェント）が実ビルドとテスト実行を伴って確認。
**14 件の指摘、うち 13 件を修正、1 件は仕様矛盾として記録して現状維持。**

指摘のすべてが「70 件のテストが全部通っている状態で、なお残っていた欠陥」だった点が重要。
テストが仕様を検証できていない箇所の指摘が半数を占める。

### 実装の欠陥（修正済み）

| # | 内容 | 対応 | 追加した検証 |
|---|---|---|---|
| R-1 | **`sitemap.xml` にトップページが載っていない**。jekyll-paginate-v2 がトップの Page オブジェクトを差し替えるため、jekyll-sitemap の `site.html_pages` から消える。正規 URL がクローラに一度も出ない | jekyll-sitemap を外し、`sitemap.xml` を自前の Liquid テンプレートに置き換え | AC-25 を「トップ・記事・タグ・about が載り、404 は載らない」に強化 |
| R-2 | `.prose h4` に `line-height` が無く、本文の 1.9 を継承（§3.3 は 1.5） | 追加 | AC-07 |
| R-3 | `theme-init.js` の `setAttribute` が `try` の中にあり、localStorage が投げると `data-theme` が付かないまま終わる。結果、アイコンが両方出てトグル初回クリックが無反応 | `setAttribute` を `try` の外へ。フォールバックも段階化 | 偽ブラウザでスクリプトを**実際に実行**する 4 件を追加 |
| R-4 | `404.html` の 2 つの導線が `relative_url` を通しておらず、`baseurl` 運用時にサイト外を指す | 修正 | AC-25 を「`/` 決め打ち」から「トップの実体に届くか」に変更 |
| R-5 | `.prose blockquote` に `line-height` が無い（§3.3 は 1.85） | 追加 | AC-05 |
| R-6 | `.prose h4` の `letter-spacing` が `-0.01em`（§3.3 の表は 0） | 0 に修正。仕様矛盾 **C-5** として記録 | AC-06 |
| R-7 | フッターに `font-weight: 400` / `line-height: 1` が無い（§3.3） | 追加 | AC-07 |
| R-8 | **本番ビルドが `main.css.map` を公開**し、`_sass` のソースが外から読める | `sass.sourcemap: never` | **AC-34** |
| R-9 | `bin/jekyll` が `build` でも `-p 4000:4000` を付けるため、`serve` 起動中に `npm test` を回すとポート衝突でビルドごと落ちる | `serve` のときだけ publish | — |

### テストが仕様を検証できていなかった箇所（修正済み）

| # | 内容 | 対応 |
|---|---|---|
| R-10 | `posts()` が `published: false` と未来日付を除外せず、予約投稿を 1 本置いた瞬間に AC-20 / 25 / 26 が誤った理由で落ちる | ヘルパで除外 |
| R-11 | AC-27 のリンクチェッカが相対リンクを丸ごと読み飛ばしていた（壊れた相対リンクが素通り） | 掲載元ページからの相対で解決して検査 |
| R-12 | 各テストが `.replace(/\.md$/, '')` を各自に持ち、`postPath()` の `.markdown` 対応と食い違う | `postPath()` に集約 |
| R-13 | 「eyebrow / タグ / **フッター**の…」というテスト名に反し、対象にフッターが入っていなかった（R-7 が隠れていた原因） | フッター専用の検証を分離し、テスト名を実態に合わせた |
| R-14 | SPEC の「トークン一覧（24 個）」が実際は 23 個。取りこぼし検知の唯一の手掛かりが 1 つズレていた | 修正。README のテスト件数も更新 |

### 現状維持（仕様矛盾として記録）

| # | 内容 | 判断 |
|---|---|---|
| R-15 | `.tag` / `.prose th` の `text-transform: uppercase` が日本語にも当たり、§11 Don't に反する | **C-6** として記録し維持。§3.4 が理由を「無意味なので」と書いているとおり日本語に case は無く描画は変わらない。字送り 0.15em が広すぎるなら `letter-spacing` のほうを見直す |

### レビューをきっかけに自力で発見した重大な欠陥（修正済み）

R-3 の検証テスト（`theme-init.js` を偽ブラウザで実行するもの）を書いた副産物として発覚。

| # | 内容 | 対応 | 追加した検証 |
|---|---|---|---|
| R-16 | **`_config.yml` の catch-all な `defaults` が `assets/js/*.js` にも `layout: page` を当てており、`theme-init.js` と `theme-toggle.js` が HTML ページとして出力されていた。** テーマ初期化とトグルが一度も動いていない状態 | `defaults` を `type: posts` のみに限定し、JS 側にも `layout: none` を明示 | **AC-35**（`type` 無しの scope を禁止 + 資産が HTML でないことを確認） |

R-16 が当時 73 件通っていたテストをすり抜けていたのは、`head.test.mjs` が JS の**ソース文字列を grep**
していただけで、HTML に包まれても本文中に JS が残るため一致してしまっていたから。
「出力を読む」ではなく「動かす」テストに変えたことで初めて出た。

### 修正後の再検証

- `npm test` **78 / 78 pass**（レビュー前は 70 件）
- `jekyll build` 警告ゼロ / `jekyll doctor` clean
- `bundle-audit check --update`（advisory DB 1231 件・2026-08-07 時点）→ No vulnerabilities found
- `npm audit` → 0 vulnerabilities
- `_site` 21 ファイル / 80,575 バイト、`main.css` 12,062 バイト（sourcemap 削除で `.map` が消え総量は減少）

**Review Gate: 合格**（指摘 14 件のうち 13 件を修正、1 件は根拠を記録して維持）
