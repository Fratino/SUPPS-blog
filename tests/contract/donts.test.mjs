// DESIGN.md §11 Do/Don't の機械検証。
// AC-02, AC-08, AC-14〜AC-19。
//
// この手のルールはレビューで人が見落とすので、CSS 出力そのものに当てる。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rules, atRules, fontOf, pxIn } from '../helpers/site.mjs';

const normSel = (s) => s.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
const isTokenBlock = (r) =>
  r.selector.split(',').some((s) => /^(:root|\[data-theme=(dark|light)\])$/.test(normSel(s)));

/** どのルールのどの宣言か、が分かる形で違反を並べる。 */
const where = (v) => v.map((x) => `  ${x.selector} { ${x.prop}: ${x.value} }`).join('\n');

// ─────────────── AC-02: 色のハードコード禁止 ───────────────

// DESIGN.md が直値で指定しているぶんだけを許す。増やすときは DESIGN.md の側に根拠が要る。
const ALLOWED_LITERALS = new Set([
  '#fff', // .btn--accent の前景（§5.4）
  '#ffffff',
  'rgba(7,7,7,0.7)', // .site-header 背景（§5.1）
  'rgba(240,242,245,0.7)', // light の .site-header 背景（§5.1）
  'rgba(128,128,128,0.08)', // .nav-link:hover 背景（§5.1）
]);

const NAMED_COLORS = /\b(white|black|red|blue|green|gray|grey|silver|orange|yellow|purple|pink|brown|navy|teal|olive|maroon|lime|aqua|fuchsia)\b/i;

const normLit = (s) =>
  s.replace(/\s+/g, '').replace(/(^|[(,])\.(\d)/g, '$10.$2').toLowerCase();

test('AC-02: 色は var(--token) 経由。生の色リテラルを使わない', () => {
  const violations = [];

  for (const r of rules()) {
    if (isTokenBlock(r)) continue; // トークン定義そのものは当然リテラル
    for (const [prop, value] of r.order) {
      if (prop.startsWith('--')) continue;

      // rgba(var(--accent-rgb), .35) のような var 経由は許可。
      // 先に「var を含む色関数」ごと落としてから、残りの生リテラルを探す。
      const withoutVars = value
        .replace(/(rgba?|hsla?)\([^()]*var\([^)]*\)[^()]*\)/g, '')
        .replace(/var\([^)]*\)/g, '');

      for (const m of withoutVars.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)) {
        if (!ALLOWED_LITERALS.has(normLit(m[0]))) {
          violations.push({ selector: r.selector, prop, value });
        }
      }
      if (NAMED_COLORS.test(withoutVars)) {
        violations.push({ selector: r.selector, prop, value });
      }
    }
  }

  assert.deepEqual(violations, [], `色をハードコードしている箇所がある:\n${where(violations)}`);
});

// ─────────────── AC-08: font-weight 800 禁止 ───────────────

test('AC-08: font-weight は 400 / 600 / 700 / 900 のみ（800 を使わない）', () => {
  const allowed = new Set(['400', '600', '700', '900', 'normal', 'bold', 'inherit']);
  const violations = [];

  for (const r of rules()) {
    for (const [prop, value] of r.order) {
      if (prop === 'font-weight') {
        if (!allowed.has(value.trim())) violations.push({ selector: r.selector, prop, value });
      } else if (prop === 'font') {
        const w = fontOf({ font: value }).weight;
        if (w && !allowed.has(w)) violations.push({ selector: r.selector, prop, value });
      }
    }
  }

  assert.deepEqual(violations, [], `許可されていない font-weight:\n${where(violations)}`);
});

// ─────────────── AC-14: hover で浮かせない・影を落とさない ───────────────

test('AC-14: :hover の宣言に box-shadow / translateY が現れない', () => {
  const violations = [];

  for (const r of rules()) {
    if (!r.selector.includes(':hover')) continue;
    for (const [prop, value] of r.order) {
      if (prop.includes('box-shadow')) violations.push({ selector: r.selector, prop, value });
      if (prop === 'transform' && /translate(Y|3d|\b)/i.test(value)) {
        violations.push({ selector: r.selector, prop, value });
      }
    }
  }

  assert.deepEqual(violations, [], `hover で浮いている / 影が出ている:\n${where(violations)}`);
});

test('AC-14: box-shadow を一切使わない', () => {
  const violations = [];
  for (const r of rules()) {
    for (const [prop, value] of r.order) {
      if (prop.includes('box-shadow') && value.trim() !== 'none') {
        violations.push({ selector: r.selector, prop, value });
      }
    }
  }
  assert.deepEqual(violations, [], `box-shadow が使われている:\n${where(violations)}`);
});

// ─────────────── AC-15: グラデーション禁止 ───────────────

test('AC-15: グラデーション背景を使わない', () => {
  const hits = [...css().matchAll(/(linear|radial|conic)-gradient/g)].map((m) => m[0]);
  assert.deepEqual(hits, [], 'グラデーションが使われている');
});

// ─────────────── AC-16: ボーダーは 2px 以下 ───────────────

// DESIGN.md 内部の矛盾に対する明示的な例外。
// §11 Don't は「ボーダーを 2px より太くしない」と書いているが、
// §6 は引用のアクセントバーを `border-left: 3px solid var(--accent)` と直値で指定している。
// 装飾バーであってボックスの枠ではないので、§6 の具体指定を採って例外扱いにした。
// 2px に揃える判断になったら、ここと _sass/_prose.scss の両方を直す。
const BORDER_EXCEPTIONS = new Set(['.prose blockquote|border-left']);

test('AC-16: border の太さが 2px を超えない', () => {
  const borderProp = /^border(-(top|right|bottom|left))?(-width)?$/;
  const violations = [];

  for (const r of rules()) {
    for (const [prop, value] of r.order) {
      if (!borderProp.test(prop)) continue;
      if (BORDER_EXCEPTIONS.has(`${r.selector.trim()}|${prop}`)) continue;
      for (const n of pxIn(value)) {
        // border-radius は別プロパティなのでここには来ない
        if (n > 2) violations.push({ selector: r.selector, prop, value });
      }
    }
  }

  assert.deepEqual(violations, [], `2px より太いボーダーがある:\n${where(violations)}`);
});

// ─────────────── AC-17: カードの hover は色だけ ───────────────

test('AC-17: .post-card:hover が変えるのは border-color と background だけ', () => {
  const target = rules().filter((r) =>
    r.selector.split(',').some((s) => normSel(s) === '.post-card:hover')
  );
  assert.ok(target.length > 0, '.post-card:hover が定義されていない');

  const allowed = new Set(['border-color', 'background', 'background-color']);
  const bad = [];
  for (const r of target) {
    for (const [prop, value] of r.order) {
      if (!allowed.has(prop)) bad.push({ selector: r.selector, prop, value });
    }
  }
  assert.deepEqual(bad, [], `カードの hover で色以外を変えている:\n${where(bad)}`);
});

// ─────────────── AC-18 / AC-19: モーション ───────────────

test('AC-18: prefers-reduced-motion を尊重する', () => {
  const media = atRules().filter((a) => a.includes('prefers-reduced-motion'));
  assert.ok(media.length > 0, '@media (prefers-reduced-motion: reduce) が無い');

  const inside = rules().filter((r) => r.at.some((a) => a.includes('prefers-reduced-motion')));
  const flat = inside.flatMap((r) => r.order);

  const animOff = flat.some(([p, v]) => p === 'animation' && /none/.test(v) && /!important/.test(v));
  const transOff = flat.some(([p, v]) => p === 'transition' && /none/.test(v) && /!important/.test(v));

  assert.ok(animOff, 'reduced-motion 下で animation: none !important になっていない');
  assert.ok(transOff, 'reduced-motion 下で transition: none !important になっていない');
});

test('AC-19: 基本イージング cubic-bezier(.16, 1, .3, 1) が使われている', () => {
  const normalized = css().replace(/\s+/g, '');
  const hit =
    normalized.includes('cubic-bezier(.16,1,.3,1)') ||
    normalized.includes('cubic-bezier(0.16,1,0.3,1)');
  assert.ok(hit, '基本イージングが使われていない');
});
