# 記事の書き方

`DESIGN.md` が見た目の仕様、`specs/SPEC.md` が受入基準。この文書は **記事を書く人向け** の手引き。

---

## 1. 新しい記事を作る

`_posts/YYYY-MM-DD-slug.md` を作る。**ファイル名の slug がそのまま URL になる**
（`_config.yml` の `permalink: /posts/:title/`）ので、ASCII の短い英単語にする。

```
_posts/2026-08-05-rudiments-practice.md  →  /posts/rudiments-practice/
```

日付が未来だとビルド結果に出ない。公開日を入れる。

## 2. front matter

```yaml
---
layout: post
title: "ルーディメンツを 4 週間で仕上げる練習の組み立て方"
date: 2026-08-05
category: PRACTICE                       # eyebrow に出る。英字大文字
thumbnail: /assets/img/posts/xxx.svg     # 任意。16:9。無ければカードは文字だけになる
excerpt: "一覧カードに出る 2 行程度の要約。"
---
```

| キー | 必須 | 効くところ |
|---|---|---|
| `layout` | ○ | `post` 固定（`_config.yml` の `defaults` で自動的に付くので省略可） |
| `title` | ○ | 記事の h1、`<title>`、一覧カード |
| `date` | ○ | 記事のメタ、並び順、`/archive/` での並び |
| `category` | | 記事上部と一覧カードの eyebrow。**英字大文字**にする |
| `thumbnail` | | 一覧カードの 16:9 画像。無い場合はサムネイル領域ごと出ない |
| `excerpt` | | 一覧カードの本文（2 行でクランプされる）。省くと本文冒頭が使われる |
| `description` | | `<meta name="description">`。省くと `excerpt` → サイト説明の順で埋まる |

`category` を英字大文字にするのは、eyebrow が `text-transform: uppercase` +
`letter-spacing: .2em` で組まれているため。日本語を入れると字間が開きすぎる。

## 3. 本文で使える要素

本文は `.prose` の中に入り、`_sass/_prose.scss` が Markdown 出力に直接スタイルを当てる。
つまり **クラスを書く必要はない**。素の Markdown で書けばよい。

| 書きたいもの | 書き方 | 見え方 |
|---|---|---|
| セクション見出し | `## 見出し` | 22px / 上に細い区切り線 |
| 小見出し | `### 見出し` | 17px |
| その下 | `#### 見出し` | 15px |
| 強調 | `**強い**` | 色が `--text` に上がる |
| 弱い強調 | `*これ*` | 斜体にはならず色だけ変わる（日本語に italic を掛けない方針） |
| 引用 | `> …` | 左に 3px のアクセントバー |
| コード | ` ```python ` | 言語を書けば rouge がトークン分けする |
| 表 | `\| a \| b \|` | サンセリフ・見出し行は uppercase |
| 区切り | `---` | 48px の余白付きの罫 |
| 画像 | 下記 | 角丸 12px・中央寄せ |

### 画像とキャプション

キャプションを付けたいときだけ生の HTML を書く。kramdown はそのまま通す。

```html
<figure>
  <img src="/assets/img/posts/xxx.svg" alt="内容が分かる説明">
  <figcaption>キャプション。</figcaption>
</figure>
```

`alt` は必ず埋める。装飾目的の画像なら `alt=""`。

### 使わないもの

- `<div>` でのレイアウト調整 — `.prose` の余白設計が崩れる
- インライン `style` 属性 — 色をハードコードするとテーマ切り替えが効かなくなる
- 見出しの `#`（h1）— 記事タイトルが h1 なので、本文は `##` から始める

## 4. 画像の置き場所

`assets/img/posts/` に置く。一覧カードのサムネイルは **16:9**（1280×720 相当）。
それ以外の比率でも表示はされるが、`object-fit: cover` で上下が切られる。

## 5. 確認する

```bash
npm test                 # 仕様（specs/SPEC.md の AC）に対する自動検証
npm run serve            # http://127.0.0.1:4000 で目視確認
```

`npm test` はビルドを 2 回走らせてから、生成された HTML と CSS を検証する。
色をハードコードした、`font-weight: 800` を使った、ホバーで影を付けた、といった
`DESIGN.md` §11 の違反はここで落ちる。

新しい記事を足すと `/archive/` に自動的に並ぶ。手で作るものは何もない。
