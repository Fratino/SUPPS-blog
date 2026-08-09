---
spec-version: 1.3.0
status: approved
date: 2026-08-09
source-of-truth: DESIGN.md
source-sha256: a8cf2350e62c5e996ed7ceb77d6199a5357dadb8f93beb88f31155b0019a2781
---

# DRUM SUPPS Blog — 受入仕様

`DESIGN.md` は**設計仕様**（何をどう作るか）。本書はそれを**受入仕様**（何をもって完成とするか）に
落としたもので、各 `AC-xx` は `tests/` のいずれかのテストで機械検証される。

`DESIGN.md` と本書が食い違った場合、**`DESIGN.md` を正とする**。本書を直す。

---

## 1. 用語

| 用語 | 定義 |
|---|---|
| **トークン** | `--bg` 等の CSS カスタムプロパティ。色は必ずこれ経由で参照する |
| **テーマ** | `<html data-theme="dark\|light">`。`localStorage` キーは本体と共有の `ds-theme` |
| **prose** | 記事本文のラッパークラス。Markdown 出力にクラスが付かないため子孫セレクタで当てる |
| **eyebrow** | 見出しの上に置く小さな英字大文字ラベル（カテゴリ等）。11px / 700 / `letter-spacing: .2em` |
| **wrap** | 中央寄せコンテナ。`max-width: 1200px` |
| **wrap--prose** | 記事カラム用の狭いコンテナ。`max-width: 760px` |
| **主要カード** | 記事カード等、一覧の主役となるカード。ボーダー 2px |
| **基本イージング** | `cubic-bezier(0.16, 1, 0.3, 1)` |

### トークン一覧

`--bg` `--bg-surface` `--bg-card` `--bg-card-hover` `--border` `--border-hover`
`--text` `--text-muted` `--text-faint` `--accent` `--accent-rgb` `--accent-dim`
`--accent-glow` `--secondary` `--nav-bg` `--nav-border` `--input-bg` `--input-border`
`--divider` `--success` `--warning` `--error` `--error-border`

（23 個。`tests/contract/tokens.test.mjs` がこの集合を dark / light 双方で全数照合する）

（`--accent-rgb` は色値ではなく `R,G,B` の裸のリスト。`rgba(var(--accent-rgb), .35)` 用）

---

## 2. 受入基準

### 2.1 カラー / テーマ

| ID | 基準 | 出典 |
|---|---|---|
| **AC-01** | 上記トークンが `:root, [data-theme="dark"]` と `[data-theme="light"]` の双方で定義され、値が DESIGN.md §2 と 1:1 で一致する | §2 |
| **AC-02** | ビルド後 CSS に、`var()` を介さない生の色リテラル（`#hex` / `rgb()` / `rgba()` / 名前付き色）が現れない。例外はトークン定義ブロック自身、`#fff`（`.tag.is-active` と `.btn--accent` の前景）、`rgba(7,7,7,.7)` / `rgba(240,242,245,.7)`（ヘッダー背景、§5.1 が直値で指定）、`rgba(128,128,128,.08)`（ナビ hover、§5.1）、`rgba(var(--accent-rgb), …)` | §11 Do |
| **AC-03** | `theme-init.js` が `<head>` 内にあり、`defer` / `async` を持たない（FOUC 防止） | §8, §11 Don't |
| **AC-04** | テーマトグルが `ds-theme` を `localStorage` に読み書きし、`document.documentElement` の `data-theme` を切り替える | §8 |

### 2.2 タイポグラフィ

| ID | 基準 | 出典 |
|---|---|---|
| **AC-05** | `.prose` が `font-family: 'Noto Serif JP', Georgia, serif` / `font-size: 16px` / **`line-height: 1.9`** / `letter-spacing: .01em` / `color: var(--text-muted)` | §3.3, §6 |
| **AC-06** | `.prose h2/h3/h4` はサンセリフ（Manrope 先頭）に戻り、`color: var(--text)` | §6 |
| **AC-07** | 見出しスケールが §3.3 の表と一致する: h2 = 22px/900/1.4、h3 = 17px/700/1.5、h4 = 15px/700、記事タイトル = `clamp(28px, 5vw, 40px)`/900/1.25 | §3.3, §6 |
| **AC-08** | CSS 全体で `font-weight: 800` が使われていない（400 / 600 / 700 / 900 のみ） | §3.4, §11 Don't |
| **AC-09** | フォント読み込み URL が DESIGN.md §3.1 のものと完全一致し、`preconnect` が 2 本（`fonts.googleapis.com` と `crossorigin` 付き `fonts.gstatic.com`）ある | §3.1 |
| **AC-10** | `.prose em` が `font-style: normal`（日本語に斜体を掛けない） | §6, §11 Don't |
| **AC-39** | `.prose strong`（太字）が `'Noto Sans JP', sans-serif`、色は `var(--text)` | §6 |

### 2.3 レイアウト

| ID | 基準 | 出典 |
|---|---|---|
| **AC-11** | `.wrap` = `max-width: 1200px` / `padding: 0 24px`、`.wrap--prose` = `max-width: 760px` | §4 |
| **AC-12** | メディアクエリのブレークポイントが **768px のみ**（他の px 値の分岐を作らない） | §4 |
| **AC-13** | `.site-header` が `position: fixed` / `top: 40px`（バナー分）/ `height: 52px` / `backdrop-filter: blur(12px)`、`body` に `padding-top: 92px`（バナー 40px + ヘッダー 52px） | §4, §5.0, §5.1 |
| **AC-40** | `.site-banner` が `position: fixed` / `top: 0` / `height: 40px` で、DRUM SUPPS 本体（`drum.musicsupps.com`）へのリンクを持ち、全ページに出る | §5.0 |
| **AC-37** | `body` が `min-height: 100vh` の flex column、`#main` が `flex: 1` で伸びる（コンテンツが短いページでもフッターがビューポート下端に置かれる） | §5.5a |
| **AC-38** | 768px 以下で `.page-body` の上下パディングがデスクトップ（48px/80px）より広い | §4 |

### 2.4 インタラクション（Don't の機械検証）

| ID | 基準 | 出典 |
|---|---|---|
| **AC-14** | `:hover` を含むセレクタの宣言に `box-shadow` と `transform: translateY(…)` が一切現れない | §11 Don't |
| **AC-15** | CSS 全体に `linear-gradient` / `radial-gradient` / `conic-gradient` が現れない | §1-5, §11 Don't |
| **AC-16** | `border-width` が 2px を超える指定が無い。例外は `.prose blockquote` の `border-left: 3px`（下記の仕様矛盾を参照） | §11 Don't |
| **AC-17** | `.post-card:hover` が `border-color` と `background` のみを変える | §5.2 |
| **AC-18** | `@media (prefers-reduced-motion: reduce)` ブロックが存在し、`animation: none` と `transition: none` を `!important` で当てる | §7, §11 Do |
| **AC-19** | アニメーションの easing に基本イージング `cubic-bezier(.16,1,.3,1)` が使われている | §7 |

### 2.5 ページ生成

| ID | 基準 | 出典 |
|---|---|---|
| **AC-20** | トップ `/` が `.post-grid` を持ち、その中に公開記事数ぶんの `.post-card` がある | §5.2, §10 |
| **AC-21** | `.post-card` は `thumbnail` front matter が無い記事でサムネイル領域を出力しない（レイアウトが崩れない） | §10 |
| **AC-22** | 記事ページが `.post-header__title`（h1）、`.post-header__meta` 内の `<time datetime>`、`.prose` を持つ | §10 |
| **AC-25** | `/sitemap.xml`、`/robots.txt`、`/404.html`、`/archive/` が生成される | 追加要件, §9 |
| **AC-26** | 一覧のページネーションが有効で、記事数が 1 ページあたりの上限を超えたとき 2 ページ目が生成され、前後リンクが張られる | 追加要件 |
| **AC-27** | 生成 HTML 内のサイト内部リンクにリンク切れが無い | 追加要件 |
| **AC-28** | 全ページが `<html lang="ja">` と `data-theme` 初期化を持ち、`<title>` が空でなく、同じ語を二重に並べない | 追加要件 |
| **AC-32** | ナビの ARCHIVE リンクは `/archive/` でだけ現在地（`.active` + `aria-current="page"`）を示す。HOME はロゴが担うためナビ項目自体を持たず、トップ・ページネーション 2 ページ目以降では active なリンクが 0 件でよい | §5.1 |
| **AC-33** | `bin/`・`Gemfile`・`package.json`・`DESIGN.md` などの開発用ファイルが `_site` に出力されない | 追加要件 |
| **AC-36** | アーカイブ `/archive/` が存在し、全公開記事へのリンクを年ごとにグルーピングして持ち、年・記事とも新しい順に並ぶ。リンクは 404 を作らない | 追加要件, §5.6 |

### 2.6 ビルド

| ID | 基準 | 出典 |
|---|---|---|
| **AC-29** | `bundle exec jekyll build` がエラー・警告なしで完了する | §10 |
| **AC-30** | 本番ビルドの `assets/css/main.css` が圧縮されている（`sass.style: compressed`） | §10 |
| **AC-34** | 本番ビルドが `main.css.map` を公開せず、CSS に `sourceMappingURL` を残さない | 追加要件 |
| **AC-35** | `defaults` が `type` 無しの catch-all を持たず、`assets/` の JS / CSS が HTML レイアウトに包まれない | 追加要件 |
| **AC-31** | Markdown は kramdown、シンタックスハイライトは rouge | §10 |

---

## 2.7 DESIGN.md 内部の矛盾と、その解決

実装中に見つかった、DESIGN.md が自分自身と食い違っている箇所。
どちらを採ったかを残す。判断を変える場合はここと該当テストの両方を直す。

| # | 矛盾 | 採った側 | 理由 |
|---|---|---|---|
| C-1 | §3.4「`font-weight` は 400/600/700/900 のみ」 vs §5.1 の `.nav-link` が `font: **500** 13px/1 …` | **400**（§3.4 の一般規則） | 一般規則のほうが後段の Don't（§11）でも繰り返されており、意図が強い。500 は §5.1 のスニペットにしか現れない |
| C-2 | §11「ボーダーを 2px より太くしない」 vs §6 の `blockquote { border-left: **3px** solid var(--accent) }` | **3px**（§6 の具体指定） | 引用の左バーはボックスの枠ではなく装飾。§6 が直値で指定している具体のほうを採り、AC-16 に例外として明記した |
| C-3 | §10 の `assets/css/main.scss` が `@import` を使用 | **`@use`** | Dart Sass で `@import` は非推奨。警告なしビルド（AC-29）と両立しない。出力 CSS は同一 |
| C-4 | §5 の各所が `font: <weight> <size>/<lh> <family>` の shorthand | **longhand に展開** | Dart Sass が `13px/1` をスラッシュ除算と解釈して警告を出し、`line-height` が落ちる。出力 CSS は同一 |
| C-5 | §3.3 の表は h4 の `letter-spacing` を **0** とするが、§6 のコードブロックは `h2, h3, h4` をまとめて `-.01em` にしている | **0**（§3.3 の表） | 表は役割ごとに個別の値を与えており、まとめ書きより意図が明確 |
| C-6 | §11「日本語テキストに `text-transform: uppercase` を掛けない」vs §6 `.prose th` が uppercase 指定。表見出しは日本語になりうる | **uppercase を維持** | §3.4 が uppercase を避ける理由を「無意味なので」と書いているとおり、日本語には case が無く描画は変わらない。英字見出しのための指定として §6 の具体を優先した |

---

## 3. 非対象

以下は本バージョンのスコープ外。

- 記事内検索、コメント欄、いいね等の動的機能
- 多言語対応（i18n）
- OGP 画像の自動生成
- 目次（TOC）の自動生成 — §2 の用途表に「目次のホバー」の言及はあるが、実装は次バージョン
- 本体 Next.js アプリとのビルド統合
- タグ / カテゴリでの絞り込み、RSS/Atom フィード配信、固定の ABOUT ページ — 本バージョンで撤去。一覧性はアーカイブ（`/archive/`）に一本化した

---

## 4. トレーサビリティ

| AC | 検証テスト |
|---|---|
| AC-01 | `tests/contract/tokens.test.mjs` |
| AC-02, 08, 14–19 | `tests/contract/donts.test.mjs` |
| AC-05–07, 10, 39 | `tests/unit/typography.test.mjs` |
| AC-03, 04, 09 | `tests/unit/head.test.mjs` |
| AC-11–13, 37, 38, 40 | `tests/unit/layout.test.mjs` |
| AC-20, 21 | `tests/acceptance/index.test.mjs` |
| AC-22 | `tests/acceptance/post.test.mjs` |
| AC-36 | `tests/acceptance/archive.test.mjs` |
| AC-26 | `tests/acceptance/pagination.test.mjs` |
| AC-25, 27, 28, 32, 33 | `tests/acceptance/meta.test.mjs` |
| AC-29–31, 34, 35 | `tests/acceptance/build.test.mjs` |
