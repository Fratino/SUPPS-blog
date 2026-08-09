# DRUM SUPPS Blog デザインシステム（Jekyll 向け）

本体（Next.js アプリ）の `src/app/globals.css` / 各 CSS Module から抽出した実測値をもとに、
Jekyll ブログ側で本体と視覚的に一貫させるための仕様をまとめる。

- 抽出元: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/*.module.css`, `src/components/ui/*.module.css`, `src/app/terms/page.module.css`
- 本体側の全体仕様は `DESIGN.md` を参照。本書はそのうち **ブログに必要な部分だけ** を切り出し、Jekyll の構成に落とし込んだもの。

---

## 1. 設計方針

1. **色は必ず CSS カスタムプロパティ経由**で使う。SCSS 変数に色を持たせない（テーマ切り替えが効かなくなるため）。
2. **テーマは `<html data-theme="dark|light">`**。`localStorage` キーは本体と共有の `ds-theme`。
3. **UI は Manrope / Noto Sans JP（サンセリフ）、記事本文は Noto Serif JP（明朝）**。
   本体の `/terms`・`/privacy` が同じ組み方をしており、ブログはその系譜に属する。
4. **ホバーで浮かせない・影を落とさない**。変化させるのは `background` / `border-color` / `color` のみ。
5. **グラデーション背景を使わない**（skeleton の shimmer は例外）。

---

## 2. カラートークン

`_sass/_tokens.scss` にそのまま貼れる形。値は `globals.css` と 1:1。

```scss
// _sass/_tokens.scss
:root,
[data-theme="dark"] {
  --bg:            #070707;
  --bg-surface:    #0A0A0A;
  --bg-card:       rgba(255,255,255,0.03);
  --bg-card-hover: rgba(255,59,0,0.04);
  --border:        rgba(255,255,255,0.07);
  --border-hover:  rgba(255,59,0,0.3);
  --text:          #F0F0F0;
  --text-muted:    rgba(255,255,255,0.45);
  --text-faint:    rgba(255,255,255,0.2);
  --accent:        #FF3B00;
  --accent-rgb:    255,59,0;
  --accent-dim:    #CC2E00;
  --accent-glow:   rgba(255,59,0,0.15);
  --secondary:     #00D4FF;
  --nav-bg:        rgba(7,7,7,0.90);
  --nav-border:    rgba(255,255,255,0.08);
  --input-bg:      rgba(255,255,255,0.05);
  --input-border:  rgba(255,255,255,0.1);
  --divider:       rgba(255,255,255,0.07);
  --success:       #00E676;
  --warning:       #FFD600;
  --error:         #FF4444;
  --error-border:  rgba(255,68,68,0.3);
}

[data-theme="light"] {
  --bg:            #FFFFFF;
  --bg-surface:    #FFFFFF;
  --bg-card:       #FFFFFF;
  --bg-card-hover: #FFF5F2;
  --border:        rgba(0,0,0,0.12);
  --border-hover:  rgba(255,59,0,0.4);
  --text:          #0D0D0D;
  --text-muted:    #555555;
  --text-faint:    #999999;
  --accent:        #E63200;
  --accent-rgb:    230,50,0;
  --accent-dim:    #B82800;
  --accent-glow:   rgba(230,50,0,0.12);
  --secondary:     #0077A0;
  --nav-bg:        #FFFFFF;
  --nav-border:    rgba(0,0,0,0.1);
  --input-bg:      #F7F8FA;
  --input-border:  rgba(0,0,0,0.18);
  --divider:       rgba(0,0,0,0.1);
  --success:       #007A38;
  --warning:       #9A7000;
  --error:         #C0392B;
  --error-border:  rgba(192,57,43,0.3);
}
```

### 用途早見表

| トークン | ブログでの用途 |
|---|---|
| `--bg` | `body` 背景 |
| `--bg-surface` | ヘッダードロップダウン、コードブロック背景 |
| `--bg-card` | 記事カード、引用、テーブル `thead` |
| `--bg-card-hover` | 記事カードのホバー |
| `--border` | カード枠、区切り線、`hr`、テーブル罫 |
| `--border-hover` | カードのホバー枠（アクセント寄り） |
| `--text` | 見出し・強調テキスト |
| `--text-muted` | **記事本文**、リード文、カードの概要 |
| `--text-faint` | 日付、アーカイブの年月、フッター、キャプション |
| `--accent` | リンク、アクティブなナビ、記事内 `<a>` の下線 |
| `--accent-dim` | リンクの hover / active |
| `--secondary` | 補助リンク（外部リンク・目次のホバー等） |

> **禁止**: `--accent` を大面積の背景に使わない。アクセントは「操作できるもの」「今いる場所」の合図に限定する。

---

## 3. タイポグラフィ

### 3.1 フォント読み込み

本体 `layout.tsx` と同じ URL を使う（キャッシュ共有のため揃える）。
ブログは長文があるので **Noto Serif JP を追加**する。

```html
<!-- _includes/head.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Noto+Serif+JP:wght@400;600&family=Manrope:wght@600;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet">
```

### 3.2 ファミリーの役割

| スタック | 使う場所 |
|---|---|
| `Manrope, 'Noto Sans JP', sans-serif` | 見出し、日付、ナビ、フッター、数値 |
| `'Noto Serif JP', Georgia, serif` | **記事本文（`.prose` 配下の段落・リスト）** |
| `'Noto Sans JP', sans-serif` | UI ラベル・ボタン、記事本文中の `strong`（太字） |
| `ui-monospace, SFMono-Regular, Menlo, monospace` | コードブロック・インラインコード |

### 3.3 スケール

本体 `/terms` の組みを基準に、ブログ用として本文サイズを 14px → 16px に上げてある（読み物として長時間読むため）。

| 役割 | size | weight | letter-spacing | line-height | family |
|---|---|---|---|---|---|
| 記事タイトル (h1) | `clamp(28px, 5vw, 40px)` | 900 | -0.02em | 1.25 | Manrope |
| セクション見出し (h2) | 22px | 900 | -0.01em | 1.4 | Manrope |
| 小見出し (h3) | 17px | 700 | -0.01em | 1.5 | Manrope |
| h4 | 15px | 700 | 0 | 1.5 | Manrope |
| 本文 | 16px | 400 | 0.01em | **1.9** | Noto Serif JP |
| リード文 | 17px | 400 | 0.01em | 1.85 | Noto Serif JP |
| 引用 | 15px | 400 | 0.01em | 1.85 | Noto Serif JP |
| コード | 13px | 400 | 0 | 1.7 | mono |
| eyebrow（カテゴリ等） | 11px | 700 | **0.2em** / uppercase | 1 | Manrope |
| 日付・メタ | 13px | 600 | 0.04em | 1 | Manrope |
| フッター | 11px | 400 | 0.12em / uppercase | 1 | Manrope |

### 3.4 原則

- 英字の見出し・ラベルは **uppercase + letter-spacing 0.1em 以上**。
- 日本語見出しは uppercase を掛けない（無意味なので）。italic も日本語には掛けない。
- `font-weight` は 400 / 600 / 700 / 900 のみ使う。800 は使わない。
- 記事本文の `line-height: 1.9` は死守。日本語の可読性の要。

---

## 4. レイアウト

| 用途 | 値 |
|---|---|
| 記事カラム幅 | `max-width: 760px` |
| 一覧・トップの幅 | `max-width: 1200px` |
| 水平パディング | 24px（`<768px` は 20px） |
| バナー高さ | 40px（固定・ヘッダーの上に重なる） |
| ヘッダー高さ | 52px（固定・`backdrop-filter: blur(12px)`。バナー分だけ `top` を下げる） |
| 記事の上下パディング | `48px 24px` |
| セクション間マージン | 36px |
| ブレークポイント | 768px（唯一の分岐点。本体と揃える） |

```scss
// _sass/_layout.scss
$bp-md: 768px;

.wrap      { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.wrap--prose { max-width: 760px; }

@media (max-width: $bp-md) {
  .wrap { padding: 0 20px; }
}

body { padding-top: 92px; } // バナー 40px + 固定ヘッダー 52px 分
```

### 角丸スケール

| 名前 | 値 | 用途 |
|---|---|---|
| xs | 4px | インラインコード |
| sm | 6px | ナビリンク、小ボタン、コードブロック |
| md | 8px | 標準ボタン |
| lg | 12px | ドロップダウン |
| xl | 14–16px | 記事カード、サムネイル |
| full | 9999px | ピルバッジ、アバター |

---

## 5. コンポーネント

### 5.0 お知らせバナー

DRUM SUPPS 本体への誘導バナー。全ページ最上部、ヘッダーのさらに上に固定する。
バーの全体が 1 つのリンク（クリック領域を広く取る。§5.2 の記事カードと同じ考え方）。

```scss
.site-banner {
  position: fixed; top: 0; left: 0; right: 0; z-index: 10002;
  height: 40px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 0 16px;
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
  text-decoration: none;
  color: var(--accent); // 大面積の背景には使わないが、テキスト色としては「操作できるもの」の合図
  transition: background 150ms ease;

  &:hover { background: var(--bg-card-hover); }
}

.site-banner__text {
  font-family: Manrope, 'Noto Sans JP', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 5.1 ヘッダー

```scss
.site-header {
  // top はバナーの高さ（40px）ぶん下げる。バナーが無くなったら 0 に戻す。
  position: fixed; top: 40px; left: 0; right: 0; z-index: 10001;
  height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: rgba(7,7,7,0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid var(--border);
}
[data-theme="light"] .site-header { background: rgba(240,242,245,0.7); }

// ロゴは SVG の内部色を無効化してからテーマに合わせて反転
[data-theme="dark"]  .site-logo { filter: brightness(0) invert(1); }
[data-theme="light"] .site-logo { filter: brightness(0); }

.nav-link {
  padding: 6px 14px;
  font: 500 13px/1 Manrope, 'Noto Sans JP', sans-serif;
  letter-spacing: 0.01em;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 6px;
  transition: color 150ms ease, background 150ms ease;

  &:hover  { color: var(--text); background: rgba(128,128,128,0.08); }
  &.active { color: var(--accent); font-weight: 700; }
}
```

> スクロールしても影は付けない（本体の `.navBar.scrolled { box-shadow: none; }` に合わせる）。

### 5.2 記事カード（一覧）

```scss
.post-card {
  display: block;
  background: var(--bg-card);
  border: 2px solid var(--border);       // 主要カードは 2px（本体の courseCard と同じ）
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  transition: border-color 250ms cubic-bezier(0.16,1,0.3,1), background 250ms;

  &:hover {
    border-color: var(--accent);
    background: var(--bg-card-hover);
    // 影も translateY も付けない
  }
  &:hover .post-card__thumb img { transform: scale(1.05); }
}

.post-card__thumb   { aspect-ratio: 16/9; overflow: hidden; }
.post-card__thumb img { width: 100%; height: 100%; object-fit: cover;
                        transition: transform 400ms cubic-bezier(0.16,1,0.3,1); }
.post-card__body    { padding: 16px 18px 18px; }
.post-card__eyebrow { font: 700 11px/1 Manrope, sans-serif; letter-spacing: .2em;
                      text-transform: uppercase; color: var(--text-faint); }
.post-card__title   { font: 900 17px/1.45 Manrope, 'Noto Sans JP', sans-serif;
                      letter-spacing: -.01em; color: var(--text); margin: 8px 0; }
.post-card__excerpt { font: 400 14px/1.8 'Noto Serif JP', serif; color: var(--text-muted);
                      display: -webkit-box; -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical; overflow: hidden; }
.post-card__meta    { margin-top: 12px; font: 600 12px/1 Manrope, sans-serif;
                      letter-spacing: .04em; color: var(--text-faint); }
```

グリッド:

```scss
.post-grid {
  display: grid;
  // 最小1列・最大3列。280px を下回らず、3列ぶんの幅を超えたら
  // (100% - gap*2) / 3 が 280px を上書きして3列で頭打ちにする。
  grid-template-columns: repeat(auto-fill, minmax(max(280px, (100% - 40px) / 3), 1fr));
  gap: 20px;
}
```

### 5.4 ボタン

本体 `Button.module.css` からブログに要るものだけ。

```scss
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-weight: 700; cursor: pointer;
  padding: 8px 16px; font-size: 13px; border-radius: 8px;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.btn--accent    { background: var(--accent); color: #fff; border: none;
                  &:hover { background: var(--accent-dim); } }
.btn--secondary { background: var(--bg-card); border: 1px solid var(--border); color: var(--text);
                  &:hover { border-color: var(--accent); } }
.btn--ghost     { background: transparent; border: 1px solid var(--border); color: var(--text-muted);
                  &:hover { border-color: var(--secondary); color: var(--secondary); } }
```

> ページ送り（`.pagination__prev` / `__next`）と記事の前後リンク（`.post-nav` 内）は `btn--accent` を使う。
> 「次に進める操作」であることを一目で示すため。

### 5.5 フッター

```scss
.site-footer {
  border-top: 0.5px solid var(--border);
  padding: 32px 24px;
  font-family: Manrope, sans-serif;
  flex: none; // 5.5a のフッター固定と組み合わせる

  &__inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap;
             justify-content: space-between; align-items: center; gap: 12px; }
  &__copy, &__link {
    font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    color: var(--text-faint); text-decoration: none;
  }
  &__link:hover { color: var(--text-muted); }
}
```

### 5.5a フッターの固定（sticky footer）

コンテンツが少ないページ（記事が 1〜2 件しか無いアーカイブ等）でフッターが
画面の途中に浮いてしまわないよう、`body` を `100vh` の flex column にし、
`main` 側を伸縮させてフッターを常に画面下端（またはコンテンツ末尾のどちらか低い方）へ押し出す。

```scss
// _sass/_layout.scss
body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
#main { flex: 1 0 auto; }
```

`.site-header` は `position: fixed` でフローから外れているので、この計算には関与しない。

### 5.6 アーカイブ

`/archive/` 専用。年ごとに見出しを立て、日付とタイトルだけの 1 行リストを積む
（記事カードは使わない。一覧性を優先する）。

```scss
.archive-year { margin-top: 40px; &:first-child { margin-top: 0; } }
.archive-year__heading {
  font: 900 22px/1.4 Manrope, 'Noto Sans JP', sans-serif;
  letter-spacing: -.01em; color: var(--text);
  padding-bottom: 12px; margin-bottom: 8px;
  border-bottom: 0.5px solid var(--border);
}
.archive-list { list-style: none; padding: 0; }
.archive-item {
  display: flex; align-items: baseline; gap: 16px; padding: 14px 0;
  & + & { border-top: 0.5px solid var(--divider); }
}
.archive-item__date {
  flex: none;
  font: 600 13px/1 Manrope, sans-serif; letter-spacing: .04em;
  color: var(--text-faint);
}
.archive-item__title {
  font: 700 15px/1 Manrope, 'Noto Sans JP', sans-serif;
  color: var(--text); text-decoration: none;
  &:hover { color: var(--accent); }
}
```

---

## 6. 記事本文（`.prose`）

Jekyll の Markdown 出力にはクラスが付かないので、ラッパー `.prose` の子孫セレクタで当てる。
ここがブログ固有の中心部分。

```scss
// _sass/_prose.scss
.prose {
  font-family: 'Noto Serif JP', Georgia, serif;
  font-size: 16px;
  line-height: 1.9;
  letter-spacing: .01em;
  color: var(--text-muted);

  // ── 見出しはサンセリフに戻す ──
  h2, h3, h4 {
    font-family: Manrope, 'Noto Sans JP', sans-serif;
    color: var(--text);
    letter-spacing: -.01em;
  }
  h2 { font-size: 22px; font-weight: 900; line-height: 1.4;
       margin: 56px 0 16px; padding-top: 24px; border-top: 0.5px solid var(--border); }
  h3 { font-size: 17px; font-weight: 700; line-height: 1.5; margin: 36px 0 12px; }
  h4 { font-size: 15px; font-weight: 700; margin: 28px 0 10px; }

  p  { margin: 0 0 24px; }
  strong { font-family: 'Noto Sans JP', sans-serif; color: var(--text); font-weight: 700; }
  em { font-style: normal; color: var(--text); }   // 日本語に斜体は使わない

  a {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid rgba(var(--accent-rgb), .35);
    transition: color 150ms ease, border-color 150ms ease;
    &:hover { color: var(--accent-dim); border-bottom-color: var(--accent-dim); }
  }

  ul, ol { margin: 0 0 24px; padding-left: 1.4em; }
  li { margin-bottom: 8px; }
  li::marker { color: var(--text-faint); }

  blockquote {
    margin: 28px 0;
    padding: 16px 20px;
    background: var(--bg-card);
    border-left: 3px solid var(--accent);
    border-radius: 0 8px 8px 0;
    font-size: 15px;
    p:last-child { margin-bottom: 0; }
  }

  hr { border: none; border-top: 0.5px solid var(--divider); margin: 48px 0; }

  img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 32px auto; }
  figcaption { font: 400 12px/1.6 Manrope, sans-serif; color: var(--text-faint);
               text-align: center; margin-top: 8px; }

  // ── code ──
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: .875em;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
  }
  pre {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px 18px;
    overflow-x: auto;
    margin: 0 0 24px;
    font-size: 13px;
    line-height: 1.7;
    code { padding: 0; border: none; background: none; font-size: inherit; }
  }

  // ── table ──
  table { width: 100%; border-collapse: collapse; margin: 0 0 24px;
          font-family: Manrope, 'Noto Sans JP', sans-serif; font-size: 14px; }
  th, td { padding: 10px 12px; border-bottom: 0.5px solid var(--border); text-align: left; }
  th { background: var(--bg-card); font-weight: 700; color: var(--text);
       font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  td { color: var(--text-muted); }
}
```

### 記事ヘッダー

```scss
.post-header {
  margin-bottom: 48px;

  &__eyebrow { font: 700 11px/1 Manrope, sans-serif; letter-spacing: .2em;
               text-transform: uppercase; color: var(--text-faint); margin-bottom: 8px; }
  &__title   { font: 900 clamp(28px, 5vw, 40px)/1.25 Manrope, 'Noto Sans JP', sans-serif;
               letter-spacing: -.02em; color: var(--text); margin: 0 0 12px; }
  &__meta    { font: 600 13px/1 Manrope, sans-serif; letter-spacing: .04em;
               color: var(--text-faint); display: flex; gap: 16px; flex-wrap: wrap; }
}
```

---

## 7. モーション

| 用途 | duration | easing |
|---|---|---|
| リンク・アイコンの色変化 | 150ms | `ease` |
| ボタン・小要素 | 200ms | `ease` |
| カード | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| ページ進入アニメ | 500–600ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| テーマ切替 | 250ms | `ease`（`background-color` / `border-color` / `color`） |

**基本イージングは `cubic-bezier(0.16, 1, 0.3, 1)`。**

```scss
// _sass/_motion.scss
@keyframes fadeUp   { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform:none; } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes scaleIn  { from { opacity:0; transform: scale(.96); } to { opacity:1; transform:none; } }

.animate-fade-up  { animation: fadeUp  .6s cubic-bezier(.16,1,.3,1) both; }
.animate-fade-in  { animation: fadeIn  .5s ease both; }
.animate-scale-in { animation: scaleIn .5s cubic-bezier(.16,1,.3,1) both; }

@for $i from 1 through 6 { .delay-#{$i} { animation-delay: #{$i * 0.05}s; } }

// テーマ切替のなめらか化（アニメーション要素は除外）
*, *::before, *::after {
  transition: background-color 250ms ease, border-color 250ms ease, color 250ms ease;
}
.animate-fade-up, .animate-fade-in, .animate-scale-in { transition: none; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## 8. テーマ切り替え

本体とキーを共有するので、同一ドメイン配下ならユーザーの選択が引き継がれる。

`assets/js/theme-init.js`（`<head>` 内で **同期読み込み**。FOUC 防止のため defer/async 禁止）:

```js
(function(){try{var t=localStorage.getItem('ds-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
```

トグル:

```js
function toggleTheme() {
  var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('ds-theme', next); } catch (e) {}
}
```

---

## 9. アイコン

Material Symbols Outlined。本体と同じ設定を移植する。

```scss
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  display: inline-flex; align-items: center; justify-content: center;
  line-height: 1; vertical-align: middle; user-select: none;
}
.material-symbols-outlined.is-filled { font-variation-settings: 'FILL' 1; }
```

- `inline-flex` + `align-items: center` で常に垂直中央。`transform` での位置補正はしない。
- サイズは 14px（極小）〜 22px。ブログでは 15–18px が中心。
- よく使うもの: `light_mode`, `dark_mode`, `arrow_back`, `arrow_forward`, `schedule`, `calendar_month`, `campaign`

---

## 10. Jekyll 構成

```
_config.yml
_sass/
  _tokens.scss      # 2章
  _base.scss        # reset + body + a + 見出しの既定
  _layout.scss      # 4章、5.5a（sticky footer）
  _banner.scss      # 5.0
  _header.scss      # 5.1
  _components.scss  # 5.2, 5.4–5.6（card / btn / footer / archive）
  _prose.scss       # 6章
  _motion.scss      # 7章
  _icons.scss       # 9章
assets/
  css/main.scss     # ↓ front matter 必須
  js/theme-init.js
_includes/
  head.html         # フォント + theme-init（同期）
  banner.html
  header.html
  footer.html
  post-card.html
  pagination.html
_layouts/
  default.html
  page.html
  post.html
_posts/
archive.html         # /archive/。5.6
```

`assets/css/main.scss`:

```scss
---
---
@import "tokens", "base", "layout", "banner", "header", "components", "prose", "motion", "icons";
```

`_layouts/post.html`:

```html
---
layout: default
---
<article class="wrap wrap--prose" style="padding-top:48px; padding-bottom:80px;">
  <header class="post-header">
    {% if page.category %}<div class="post-header__eyebrow">{{ page.category }}</div>{% endif %}
    <h1 class="post-header__title">{{ page.title }}</h1>
    <div class="post-header__meta">
      <time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: "%Y.%m.%d" }}</time>
    </div>
  </header>
  <div class="prose animate-fade-up">
    {{ content }}
  </div>
</article>
```

推奨 front matter:

```yaml
---
layout: post
title: "記事タイトル"
date: 2026-08-09
category: PRACTICE       # eyebrow に出る。英字大文字推奨
thumbnail: /assets/img/posts/xxx.jpg   # 一覧カードの 16:9 画像
excerpt: "一覧に出る 2 行程度の要約。"
---
```

`_config.yml` に最低限:

```yaml
sass:
  style: compressed
markdown: kramdown
kramdown:
  syntax_highlighter: rouge
```

---

## 11. Do / Don't

### Do
- 色は必ず `var(--token)`。ハードコードしない。
- 記事本文は Noto Serif JP・`line-height: 1.9`。
- 見出し・メタ・ラベルは Manrope。英字ラベルは uppercase + `letter-spacing ≥ 0.1em`。
- カードのホバーは `border-color` と `background` のみ。
- 基本イージングは `cubic-bezier(0.16, 1, 0.3, 1)`。
- 主要カードのボーダーは 2px、それ以外は 0.5–1px。
- `prefers-reduced-motion` を必ず尊重する。

### Don't
- ホバーで `translateY` / `box-shadow` を付けない（全要素で禁止）。
- `--accent` を大面積の背景・装飾テキストに使わない。
- グラデーション背景を使わない。
- `font-weight: 800` を使わない（400 / 600 / 700 / 900 のみ）。
- 日本語テキストに `italic` / `text-transform: uppercase` を掛けない。
- ボーダーを 2px より太くしない。
- `theme-init.js` を `defer` / `async` で読み込まない（FOUC が出る）。
