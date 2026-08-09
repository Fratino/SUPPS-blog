// AC-11, AC-12, AC-13 — DESIGN.md §4 / §5.1 のレイアウト値。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computed, atRules, rules, doc } from '../helpers/site.mjs';

test('AC-11: コンテナ幅が 1200px / 記事カラムが 760px', () => {
  const wrap = computed('.wrap');
  assert.equal(wrap['max-width'], '1200px');
  assert.equal(wrap['margin'], '0 auto');
  assert.equal(wrap['padding'], '0 24px');

  const prose = computed('.wrap--prose');
  assert.equal(prose['max-width'], '760px', '記事カラムが 760px でない');
});

test('AC-11: 768px 以下で水平パディングが 20px に落ちる', () => {
  const narrowed = rules().filter(
    (r) =>
      r.at.some((a) => a.includes('768px')) &&
      r.selector.split(',').some((s) => s.trim() === '.wrap')
  );
  assert.ok(narrowed.length > 0, '768px 以下の .wrap 上書きが無い');
  assert.ok(
    narrowed.some((r) => r.decls['padding'] === '0 20px'),
    'モバイルの padding が 0 20px でない'
  );
});

test('AC-12: メディアクエリのブレークポイントは 768px のみ', () => {
  // 分岐点を増やすと本体アプリとレスポンシブの挙動がズレる（DESIGN.md §4「唯一の分岐点」）。
  const widthQueries = atRules().filter((a) => /(min|max)-width/.test(a));
  const offenders = widthQueries.filter((a) => !/\b768px\b/.test(a));

  assert.deepEqual(offenders, [], `768px 以外のブレークポイントがある: ${offenders.join(' / ')}`);
});

test('AC-13: 固定ヘッダーが 52px（バナー分だけ下げて配置）、body がその分ずれている', () => {
  const header = computed('.site-header');
  assert.equal(header['position'], 'fixed');
  assert.equal(header['top'], '40px', 'ヘッダーがバナーの高さ分だけ下がっていない');
  assert.equal(header['height'], '52px');
  assert.match(header['backdrop-filter'] ?? '', /blur\(12px\)/, 'backdrop-filter が無い');
  assert.match(
    header['-webkit-backdrop-filter'] ?? '',
    /blur\(12px\)/,
    'Safari 向けの -webkit- 接頭辞が無い'
  );
  assert.match(header['border-bottom'] ?? '', /0\.5px solid var\(--border\)/);

  const body = computed('body');
  assert.equal(body['padding-top'], '92px', 'body にバナー + 固定ヘッダー分の余白が無い');
});

test('AC-40: お知らせバナーが最上部に固定され、DRUM SUPPS へのリンクを持つ', () => {
  const banner = computed('.site-banner');
  assert.equal(banner['position'], 'fixed');
  assert.equal(banner['top'], '0', 'バナーが最上部（top: 0）に固定されていない');
  assert.equal(banner['height'], '40px');

  const d = doc('index.html');
  const el = d.querySelector('.site-banner');
  assert.ok(el, 'バナーが出力されていない');
  assert.equal(el.tagName.toLowerCase(), 'a', 'バナー全体がリンクになっていない');
  assert.match(el.getAttribute('href') ?? '', /^https:\/\/drum\.musicsupps\.com/, 'DRUM SUPPS へのリンクでない');
});

test('ヘッダーはスクロールしても影を付けない', () => {
  const shadowed = rules().filter(
    (r) => /site-header/.test(r.selector) && Object.keys(r.decls).some((p) => p.includes('box-shadow'))
  );
  assert.deepEqual(
    shadowed.map((r) => r.selector),
    [],
    'ヘッダーに box-shadow が付いている'
  );
});

test('記事カードのグリッドが最小1列・最大3列 / gap 20px', () => {
  const grid = computed('.post-grid');
  assert.equal(grid['display'], 'grid');
  assert.equal(
    (grid['grid-template-columns'] ?? '').replace(/\s+/g, ' '),
    'repeat(auto-fill, minmax(max(280px, (100% - 40px) / 3), 1fr))'
  );
  assert.equal(grid['gap'], '20px');
});

test('AC-37: フッターが常にビューポート下端に置かれる（sticky footer）', () => {
  const body = computed('body');
  assert.equal(body['min-height'], '100vh', 'body に min-height: 100vh が無い');
  assert.equal(body['display'], 'flex', 'body が flex になっていない');
  assert.equal(body['flex-direction'], 'column', 'body が column 方向になっていない');

  const main = computed('#main');
  assert.match(main['flex'] ?? '', /^1(\s+0\s+auto)?$/, '#main が flex: 1 で伸びない');
});

test('AC-38: 768px 以下でページ本体の上下余白がデスクトップより広い', () => {
  const narrowed = rules().filter(
    (r) =>
      r.at.some((a) => a.includes('768px')) &&
      r.selector.split(',').some((s) => s.trim() === '.page-body')
  );
  assert.ok(narrowed.length > 0, '768px 以下の .page-body 上書きが無い');

  const mobile = narrowed[0].decls;
  const top = parseInt(mobile['padding-top'] ?? '0', 10);
  const bottom = parseInt(mobile['padding-bottom'] ?? '0', 10);

  const desktop = computed('.page-body');
  const desktopTop = parseInt(desktop['padding-top'] ?? '0', 10);
  const desktopBottom = parseInt(desktop['padding-bottom'] ?? '0', 10);

  assert.ok(top > desktopTop, `モバイルの上余白 (${top}px) がデスクトップ (${desktopTop}px) 以下`);
  assert.ok(bottom > desktopBottom, `モバイルの下余白 (${bottom}px) がデスクトップ (${desktopBottom}px) 以下`);
});

test('主要カードのボーダーは 2px', () => {
  const card = computed('.post-card');
  assert.match(card['border'] ?? '', /^2px solid var\(--border\)/, '記事カードのボーダーが 2px でない');
  assert.equal(card['border-radius'], '16px');
});
