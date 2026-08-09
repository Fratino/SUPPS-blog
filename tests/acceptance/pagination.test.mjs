// AC-26 — 一覧のページネーション。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { doc, posts, siteHas, ROOT, hrefToPath } from '../helpers/site.mjs';

/** _config.yml から 1 ページあたりの件数を読む（設定とテストをズラさないため）。 */
function perPage() {
  const cfg = readFileSync(join(ROOT, '_config.yml'), 'utf8');
  const m = cfg.match(/^\s*per_page:\s*(\d+)/m) ?? cfg.match(/^\s*paginate:\s*(\d+)/m);
  assert.ok(m, '_config.yml に per_page / paginate の設定が無い');
  return Number(m[1]);
}

test('AC-26: 記事数が per_page を超えたら 2 ページ目が生成される', (t) => {
  const total = posts().length;
  const n = perPage();

  // ページ分割は記事数が per_page を超えたときだけ発生する仕組みなので、
  // 現在の記事数がそれに満たない間はこの AC を検証できない（機構そのものは他テストが担保）。
  if (total <= n) {
    t.skip(`記事 ${total} 本 / per_page ${n} ではページ分割が起きず、検証できない`);
    return;
  }
  assert.ok(siteHas('page/2/index.html'), '2 ページ目が生成されていない');
});

test('AC-26: 1 ページ目のカード数が per_page ぶん', () => {
  const cards = doc('index.html').querySelectorAll('.post-card');
  const expected = Math.min(perPage(), posts().length);
  assert.equal(cards.length, expected, '1 ページ目のカード数が per_page と一致しない');
});

test('AC-26: 全ページを合わせると記事が重複なく全部出る', () => {
  const seen = [];
  let page = 'index.html';

  for (let i = 0; i < 50 && existsSync(join(ROOT, '_site-test', page)); i++) {
    const d = doc(page);
    for (const c of d.querySelectorAll('.post-card')) {
      const href = c.getAttribute('href') ?? c.querySelector('a')?.getAttribute('href');
      if (href) seen.push(hrefToPath(href));
    }
    const next = d.querySelector('.pagination a[rel="next"], .pagination__next');
    if (!next) break;
    page = hrefToPath(next.getAttribute('href'));
  }

  assert.equal(new Set(seen).size, seen.length, '同じ記事が複数ページに出ている');
  assert.equal(seen.length, posts().length, '全ページを合わせても記事数が合わない');
});

test('AC-26: 前後リンクが張られ、端では出さない', (t) => {
  if (!siteHas('page/2/index.html')) {
    t.skip('記事数が per_page 以下でページ分割が起きていないため検証できない');
    return;
  }

  const first = doc('index.html');
  assert.ok(
    first.querySelector('.pagination a[rel="next"], .pagination__next'),
    '1 ページ目に「次へ」が無い'
  );
  assert.equal(
    first.querySelector('.pagination a[rel="prev"], .pagination__prev'),
    null,
    '1 ページ目に「前へ」が出ている'
  );

  const last = doc('page/2/index.html');
  assert.ok(
    last.querySelector('.pagination a[rel="prev"], .pagination__prev'),
    '最終ページに「前へ」が無い'
  );
  assert.equal(
    last.querySelector('.pagination a[rel="next"], .pagination__next'),
    null,
    '最終ページに「次へ」が出ている'
  );
});
