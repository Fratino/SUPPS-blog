// AC-05, AC-06, AC-07, AC-10 — DESIGN.md §3.3 のスケール表と §6 の .prose。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computed, fontOf, normNum } from '../helpers/site.mjs';

const family = (v) => (v ?? '').replace(/["']/g, '').replace(/\s+/g, ' ').trim();

test('AC-05: .prose 本文が Noto Serif JP / 16px / line-height 1.9', () => {
  const d = computed('.prose');
  const f = fontOf(d);

  assert.match(family(f.family), /^Noto Serif JP,/, '本文が明朝になっていない');
  assert.equal(f.size, '16px', '本文サイズが 16px でない');
  // ここは日本語の可読性の要。DESIGN.md が「死守」と書いている値。
  assert.equal(String(f.lineHeight), '1.9', '本文の line-height が 1.9 でない');
  assert.equal(normNum(d['letter-spacing']), normNum('.01em'));
  assert.equal(d['color'], 'var(--text-muted)');
});

test('AC-06: .prose の見出しはサンセリフに戻り、色は --text', () => {
  for (const h of ['h2', 'h3', 'h4']) {
    const d = computed(`.prose ${h}`);
    assert.match(family(fontOf(d).family), /^Manrope,/, `.prose ${h} が Manrope 始まりでない`);
    assert.equal(d['color'], 'var(--text)', `.prose ${h} の色が --text でない`);
  }

  // 字送りは §3.3 の表に従う（§6 のコードブロックは h4 も -.01em にしているが、
  // 表のほうが個別に値を指定していて意図が明確。specs/SPEC.md §2.7 C-5 参照）
  assert.equal(normNum(computed('.prose h2')['letter-spacing']), normNum('-.01em'));
  assert.equal(normNum(computed('.prose h3')['letter-spacing']), normNum('-.01em'));
  assert.equal(normNum(computed('.prose h4')['letter-spacing']), '0', '.prose h4 の字送りは 0');
});

test('AC-39: .prose strong（太字）はサンセリフ（Noto Sans JP）', () => {
  const d = computed('.prose strong');
  assert.match(family(fontOf(d).family), /^Noto Sans JP,/, '.prose strong が Noto Sans JP 始まりでない');
  assert.equal(d['color'], 'var(--text)', '.prose strong の色が --text でない');
});

test('AC-07: 見出しスケールが DESIGN.md §3.3 と一致する', () => {
  const h2 = computed('.prose h2');
  assert.equal(h2['font-size'], '22px');
  assert.equal(h2['font-weight'], '900');
  assert.equal(String(h2['line-height']), '1.4');
  // 上に細い区切り線が入るのが h2 の特徴（§6）
  assert.match(h2['border-top'] ?? '', /0\.5px solid var\(--border\)/);

  const h3 = computed('.prose h3');
  assert.equal(h3['font-size'], '17px');
  assert.equal(h3['font-weight'], '700');
  assert.equal(String(h3['line-height']), '1.5');

  const h4 = computed('.prose h4');
  assert.equal(h4['font-size'], '15px');
  assert.equal(h4['font-weight'], '700');
  // 指定が無いと .prose の 1.9 を継いで本文と同じ行送りになる
  assert.equal(String(h4['line-height']), '1.5', '.prose h4 の line-height が 1.5 でない');
});

test('AC-05: 引用の組みが §3.3 の「引用」行と一致する', () => {
  const bq = computed('.prose blockquote');
  assert.equal(bq['font-size'], '15px');
  assert.equal(String(bq['line-height']), '1.85', '引用の line-height が 1.85 でない');
});

test('AC-07: フッターの組みが §3.3 の「フッター」行と一致する', () => {
  for (const sel of ['.site-footer__copy', '.site-footer__link']) {
    const d = computed(sel);
    const f = fontOf(d);
    assert.equal(f.size, '11px', `${sel} のサイズが違う`);
    assert.equal(f.weight, '400', `${sel} のウェイトが違う`);
    assert.equal(String(f.lineHeight), '1', `${sel} の line-height が違う`);
    assert.equal(normNum(d['letter-spacing']), normNum('.12em'), `${sel} の字送りが違う`);
    assert.equal(d['text-transform'], 'uppercase', `${sel} が uppercase でない`);
  }
});

test('AC-07: 記事タイトルが clamp(28px, 5vw, 40px) / 900 / 1.25', () => {
  const f = fontOf(computed('.post-header__title'));
  assert.equal((f.size ?? '').replace(/\s+/g, ''), 'clamp(28px,5vw,40px)');
  assert.equal(f.weight, '900');
  assert.equal(String(f.lineHeight), '1.25');
  assert.match(family(f.family), /^Manrope,/);
});

test('AC-10: 日本語に斜体を掛けない（.prose em が normal）', () => {
  const d = computed('.prose em');
  assert.equal(d['font-style'], 'normal', '.prose em が italic のままになっている');
});

// フッターは上の「AC-07: フッターの組み」で個別に見ているので、ここでは扱わない。
test('eyebrow は uppercase + letter-spacing >= .1em', () => {
  const targets = {
    '.post-card__eyebrow': '.2em',
    '.post-header__eyebrow': '.2em',
  };

  for (const [sel, ls] of Object.entries(targets)) {
    const d = computed(sel);
    const f = fontOf(d);
    assert.equal(d['text-transform'], 'uppercase', `${sel} が uppercase でない`);
    const spacing = d['letter-spacing'] ?? '';
    assert.equal(normNum(spacing), normNum(ls), `${sel} の letter-spacing が違う`);
    assert.ok(parseFloat(spacing) >= 0.1, `${sel} の letter-spacing が .1em 未満`);
    assert.match(family(f.family), /^Manrope,/, `${sel} が Manrope でない`);
  }
});
