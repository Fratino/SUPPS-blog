// AC-20, AC-21 — トップの記事一覧。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doc, posts, postPath, siteHas, allHtml, hrefToPath } from '../helpers/site.mjs';

/** 全ページを走査して .post-card を集める（ページネーションで分割されるため）。 */
function allCards() {
  const cards = [];
  for (const page of allHtml()) {
    for (const card of doc(page).querySelectorAll('.post-card')) {
      cards.push({ page, card });
    }
  }
  return cards;
}

test('AC-20: トップに .post-grid があり、.post-card が並ぶ', () => {
  const d = doc('index.html');
  const grid = d.querySelector('.post-grid');
  assert.ok(grid, 'トップに .post-grid が無い');

  const cards = grid.querySelectorAll('.post-card');
  assert.ok(cards.length > 0, 'トップに記事カードが 1 枚も無い');
});

test('AC-20: 公開記事がすべてどこかの一覧ページに出ている', () => {
  const linked = new Set();
  for (const { card } of allCards()) {
    const href = card.getAttribute('href') ?? card.querySelector('a')?.getAttribute('href');
    if (href) linked.add(hrefToPath(href));
  }

  for (const fm of posts()) {
    assert.ok(linked.has(postPath(fm)), `一覧に出ていない記事がある: ${fm.__file}`);
  }
});

test('AC-20: カードがタイトル・抜粋・日付を持つ', () => {
  const { card } = allCards()[0];

  const title = card.querySelector('.post-card__title');
  assert.ok(title && title.textContent.trim(), 'カードにタイトルが無い');

  const meta = card.querySelector('.post-card__meta');
  assert.ok(meta && meta.textContent.trim(), 'カードに日付・メタが無い');

  const excerpt = card.querySelector('.post-card__excerpt');
  assert.ok(excerpt && excerpt.textContent.trim(), 'カードに抜粋が無い');
});

test('AC-21: thumbnail が無い記事はサムネイル領域を出力しない', (t) => {
  const withThumb = [];
  const withoutThumb = [];

  for (const fm of posts()) {
    (fm.thumbnail ? withThumb : withoutThumb).push(fm);
  }

  // 分岐の両側を検証したいが、現在の記事が片側しか無ければ、有る方の分岐だけ検証してスキップする。
  if (withThumb.length === 0) t.diagnostic('thumbnail 付きの記事が無いため、その分岐は未検証');
  if (withoutThumb.length === 0) t.diagnostic('thumbnail 無しの記事が無いため、その分岐は未検証');
  if (withThumb.length === 0 && withoutThumb.length === 0) {
    t.skip('記事が無く、分岐を検証できない');
    return;
  }

  const byHref = new Map();
  for (const { card } of allCards()) {
    const href = card.getAttribute('href') ?? card.querySelector('a')?.getAttribute('href');
    if (href) byHref.set(hrefToPath(href), card);
  }

  for (const fm of posts()) {
    const card = byHref.get(postPath(fm));
    assert.ok(card, `カードが見つからない: ${fm.__file}`);

    const thumb = card.querySelector('.post-card__thumb');
    if (fm.thumbnail) {
      assert.ok(thumb, `${fm.__file}: thumbnail があるのにサムネイル領域が無い`);
      const img = thumb.querySelector('img');
      assert.ok(img, `${fm.__file}: サムネイルに img が無い`);
      assert.ok(img.getAttribute('alt') !== null, `${fm.__file}: サムネイル img に alt が無い`);
      assert.ok(
        siteHas(hrefToPath(img.getAttribute('src'))?.replace(/index\.html$/, '') ?? ''),
        `${fm.__file}: サムネイル画像が存在しない (${img.getAttribute('src')})`
      );
    } else {
      assert.equal(thumb, null, `${fm.__file}: thumbnail 無しなのに空のサムネイル領域が出ている`);
    }
  }
});

test('カード全体がリンクになっている（クリック領域が広い）', () => {
  for (const { page, card } of allCards()) {
    const isAnchor = card.tagName.toLowerCase() === 'a';
    const hasAnchor = card.querySelector('a[href]');
    assert.ok(isAnchor || hasAnchor, `${page}: カードにリンクが無い`);
  }
});
