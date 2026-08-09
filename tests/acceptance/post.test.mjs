// AC-22 — 記事ページの構造と、prose が Markdown 出力を受け止めているか。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doc, posts, postPath } from '../helpers/site.mjs';

test('AC-22: 全記事が post-header と .prose を持つ', () => {
  for (const fm of posts()) {
    const d = doc(postPath(fm));

    const title = d.querySelector('h1.post-header__title');
    assert.ok(title, `${fm.__file}: h1.post-header__title が無い`);
    assert.equal(title.textContent.trim(), fm.title, `${fm.__file}: タイトルが front matter と違う`);

    const meta = d.querySelector('.post-header__meta');
    assert.ok(meta, `${fm.__file}: .post-header__meta が無い`);

    const time = meta.querySelector('time[datetime]');
    assert.ok(time, `${fm.__file}: <time datetime> が無い`);
    assert.match(
      time.getAttribute('datetime'),
      /^\d{4}-\d{2}-\d{2}/,
      `${fm.__file}: datetime が ISO 形式でない`
    );
    assert.match(time.textContent.trim(), /^\d{4}\.\d{2}\.\d{2}$/, `${fm.__file}: 表示日付が YYYY.MM.DD でない`);

    const prose = d.querySelector('.prose');
    assert.ok(prose, `${fm.__file}: .prose が無い`);
    assert.ok(prose.textContent.trim().length > 0, `${fm.__file}: 本文が空`);
  }
});

test('AC-22: category が front matter にある記事は eyebrow を出す', () => {
  for (const fm of posts()) {
    const d = doc(postPath(fm));
    const eyebrow = d.querySelector('.post-header__eyebrow');

    if (fm.category) {
      assert.ok(eyebrow, `${fm.__file}: category があるのに eyebrow が無い`);
      assert.equal(eyebrow.textContent.trim(), fm.category);
    } else {
      assert.equal(eyebrow, null, `${fm.__file}: category が無いのに空の eyebrow が出ている`);
    }
  }
});

test('AC-22: 記事カラムが .wrap--prose（760px 側）に入っている', () => {
  for (const fm of posts()) {
    const d = doc(postPath(fm));
    const article = d.querySelector('article');
    assert.ok(article, `${fm.__file}: <article> が無い`);
    assert.ok(
      article.classList.contains('wrap--prose'),
      `${fm.__file}: 記事が .wrap--prose に入っていない（1200px 幅で本文が流れる）`
    );
  }
});

test('Markdown の主要要素が .prose 配下に出力される', (t) => {
  // prose の全要素を網羅したサンプル記事（見出し・コードブロック・表を持つもの）を探す。
  // 実際の記事がたまたまその全部を含んでいない期間はスキップする（レンダリング機構自体は
  // .prose 単位のユニットテスト側 tests/unit/typography.test.mjs でも別途担保されている）。
  const showcase = posts().find(
    (fm) => /^## /m.test(fm.__body) && /^```/m.test(fm.__body) && /^\|/m.test(fm.__body)
  );
  if (!showcase) {
    t.skip('見出し・コードブロック・表をすべて含む記事が無く、検証できない');
    return;
  }

  const prose = doc(postPath(showcase)).querySelector('.prose');

  const required = ['h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'th', 'td', 'hr', 'a', 'strong', 'img'];
  for (const tag of required) {
    assert.ok(prose.querySelector(tag), `.prose 配下に <${tag}> が出力されていない`);
  }
});

test('コードブロックが rouge でハイライトされている', (t) => {
  const showcase = posts().find((fm) => /^```/m.test(fm.__body));
  if (!showcase) {
    t.skip('コードブロックを含む記事が無く、検証できない');
    return;
  }

  const prose = doc(postPath(showcase)).querySelector('.prose');
  const highlighted = prose.querySelector('.highlight, .highlighter-rouge');
  assert.ok(highlighted, 'rouge のハイライト用マークアップが出ていない');
});
