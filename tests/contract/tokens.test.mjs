// AC-01: カラートークンが dark/light 双方で DESIGN.md §2 と 1:1 で一致すること。
//
// ここの表は DESIGN.md §2 のコードブロックを転記したもの。実装（_sass/_tokens.scss）とは
// 独立に持っておくことに意味がある。片方だけ書き換えたら落ちる、という契約になる。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rules } from '../helpers/site.mjs';

const DARK = {
  '--bg': '#070707',
  '--bg-surface': '#0A0A0A',
  '--bg-card': 'rgba(255,255,255,0.03)',
  '--bg-card-hover': 'rgba(255,59,0,0.04)',
  '--border': 'rgba(255,255,255,0.07)',
  '--border-hover': 'rgba(255,59,0,0.3)',
  '--text': '#F0F0F0',
  '--text-muted': 'rgba(255,255,255,0.45)',
  '--text-faint': 'rgba(255,255,255,0.2)',
  '--accent': '#FF3B00',
  '--accent-rgb': '255,59,0',
  '--accent-dim': '#CC2E00',
  '--accent-glow': 'rgba(255,59,0,0.15)',
  '--secondary': '#00D4FF',
  '--nav-bg': 'rgba(7,7,7,0.90)',
  '--nav-border': 'rgba(255,255,255,0.08)',
  '--input-bg': 'rgba(255,255,255,0.05)',
  '--input-border': 'rgba(255,255,255,0.1)',
  '--divider': 'rgba(255,255,255,0.07)',
  '--success': '#00E676',
  '--warning': '#FFD600',
  '--error': '#FF4444',
  '--error-border': 'rgba(255,68,68,0.3)',
};

const LIGHT = {
  '--bg': '#FFFFFF',
  '--bg-surface': '#FFFFFF',
  '--bg-card': '#FFFFFF',
  '--bg-card-hover': '#FFF5F2',
  '--border': 'rgba(0,0,0,0.12)',
  '--border-hover': 'rgba(255,59,0,0.4)',
  '--text': '#0D0D0D',
  '--text-muted': '#555555',
  '--text-faint': '#999999',
  '--accent': '#E63200',
  '--accent-rgb': '230,50,0',
  '--accent-dim': '#B82800',
  '--accent-glow': 'rgba(230,50,0,0.12)',
  '--secondary': '#0077A0',
  '--nav-bg': '#FFFFFF',
  '--nav-border': 'rgba(0,0,0,0.1)',
  '--input-bg': '#F7F8FA',
  '--input-border': 'rgba(0,0,0,0.18)',
  '--divider': 'rgba(0,0,0,0.1)',
  '--success': '#007A38',
  '--warning': '#9A7000',
  '--error': '#C0392B',
  '--error-border': 'rgba(192,57,43,0.3)',
};

/** セレクタの引用符と空白を無視して比較できる形に。 */
const normSel = (s) => s.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
/** 値は空白差とゼロ詰めの差を無視する（Sass の出力差を吸収）。 */
const normVal = (v) =>
  v.replace(/\s+/g, '').replace(/(^|[(,])\.(\d)/g, '$10.$2').toLowerCase();

/** 指定セレクタを含むルールの宣言をマージ。 */
function tokensUnder(target) {
  const merged = {};
  for (const r of rules()) {
    if (r.at.length) continue;
    const hit = r.selector.split(',').some((s) => normSel(s) === target);
    if (!hit) continue;
    for (const [prop, value] of r.order) if (prop.startsWith('--')) merged[prop] = value;
  }
  return merged;
}

test('AC-01: dark テーマのトークンが DESIGN.md §2 と一致する', () => {
  // :root と [data-theme=dark] は同じブロックで定義される想定だが、
  // 分けて書かれていても両方から拾えるようマージして見る。
  const actual = { ...tokensUnder(':root'), ...tokensUnder('[data-theme=dark]') };

  for (const [name, expected] of Object.entries(DARK)) {
    assert.ok(name in actual, `dark: ${name} が定義されていない`);
    assert.equal(normVal(actual[name]), normVal(expected), `dark: ${name} の値が違う`);
  }
});

test('AC-01: light テーマのトークンが DESIGN.md §2 と一致する', () => {
  const actual = tokensUnder('[data-theme=light]');

  for (const [name, expected] of Object.entries(LIGHT)) {
    assert.ok(name in actual, `light: ${name} が定義されていない`);
    assert.equal(normVal(actual[name]), normVal(expected), `light: ${name} の値が違う`);
  }
});

test('AC-01: dark と light で定義されるトークンの集合が一致する', () => {
  const dark = new Set(Object.keys({ ...tokensUnder(':root'), ...tokensUnder('[data-theme=dark]') }));
  const light = new Set(Object.keys(tokensUnder('[data-theme=light]')));

  const onlyDark = [...dark].filter((k) => !light.has(k));
  const onlyLight = [...light].filter((k) => !dark.has(k));

  assert.deepEqual(onlyDark, [], 'dark にしか無いトークンがある（light 切替で壊れる）');
  assert.deepEqual(onlyLight, [], 'light にしか無いトークンがある');
});

test('AC-01: :root にも dark 相当のトークンが乗っている（テーマ属性なしのフォールバック）', () => {
  const root = tokensUnder(':root');
  assert.ok(Object.keys(root).length >= Object.keys(DARK).length,
    ':root 単体でも全トークンが解決できること（data-theme 未設定時の保険）');
});
