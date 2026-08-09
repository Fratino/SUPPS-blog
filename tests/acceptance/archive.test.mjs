// AC-36 — アーカイブページ。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doc, posts, postPath, siteHas, hrefToPath } from '../helpers/site.mjs';

test('AC-36: /archive/ が存在し、全記事へのリンクを年でグルーピングして持つ', () => {
  assert.ok(siteHas('archive/index.html'), '/archive/ が生成されていない');

  const d = doc('archive/index.html');
  const linked = [...d.querySelectorAll('.archive-item__title[href]')]
    .map((a) => hrefToPath(a.getAttribute('href')))
    .filter(Boolean);

  for (const fm of posts()) {
    assert.ok(linked.includes(postPath(fm)), `アーカイブに記事が無い: ${fm.__file}`);
  }
  assert.equal(linked.length, posts().length, 'アーカイブの記事数が公開記事数と合わない');
});

test('AC-36: アーカイブは年見出しを持ち、記事が新しい順に並ぶ', () => {
  const d = doc('archive/index.html');
  const headings = [...d.querySelectorAll('.archive-year__heading')].map((h) => h.textContent.trim());
  assert.ok(headings.length > 0, '年見出しが無い');

  // 年の並びが降順（新しい年が先）
  const years = headings.map(Number);
  const sorted = [...years].sort((a, b) => b - a);
  assert.deepEqual(years, sorted, '年の並びが新しい順になっていない');

  const dates = [...d.querySelectorAll('.archive-item time[datetime]')].map((t) => t.getAttribute('datetime'));
  const sortedDates = [...dates].sort().reverse();
  assert.deepEqual(dates, sortedDates, '記事の並びが新しい順になっていない');
});

test('AC-36: アーカイブの記事リンクに 404 が無い', () => {
  const d = doc('archive/index.html');
  const missing = [];
  for (const a of d.querySelectorAll('.archive-item__title[href]')) {
    const href = a.getAttribute('href');
    const path = hrefToPath(href);
    if (!path || !siteHas(path)) missing.push(href);
  }
  assert.deepEqual(missing, [], `アーカイブのリンクが 404 になる:\n  ${missing.join('\n  ')}`);
});
