// AC-03, AC-04, AC-09 — <head> の構成とテーマ初期化。
// FOUC はここを間違えた瞬間に出るので、属性レベルで固定する。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doc, readSite, allHtml } from '../helpers/site.mjs';

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Noto+Serif+JP:wght@400;600&family=Manrope:wght@600;800&display=swap';
const ICON_CSS =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';

test('AC-09: フォント読み込みが DESIGN.md §3.1 と完全一致する', () => {
  const d = doc('index.html');
  const hrefs = [...d.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href'));

  assert.ok(hrefs.includes(FONT_CSS), 'Google Fonts の URL が DESIGN.md と一致しない');
  assert.ok(hrefs.includes(ICON_CSS), 'Material Symbols の URL が DESIGN.md と一致しない');
});

test('AC-09: preconnect が googleapis と gstatic(crossorigin) の 2 本ある', () => {
  const d = doc('index.html');
  const pre = [...d.querySelectorAll('link[rel="preconnect"]')];

  const api = pre.find((l) => l.getAttribute('href') === 'https://fonts.googleapis.com');
  const stat = pre.find((l) => l.getAttribute('href') === 'https://fonts.gstatic.com');

  assert.ok(api, 'fonts.googleapis.com への preconnect が無い');
  assert.ok(stat, 'fonts.gstatic.com への preconnect が無い');
  assert.ok(stat.hasAttribute('crossorigin'), 'gstatic の preconnect に crossorigin が無い');
});

test('AC-03: theme-init が <head> 内にあり、defer / async を持たない', () => {
  for (const page of allHtml()) {
    const d = doc(page);
    const head = d.querySelector('head');
    const scripts = [...head.querySelectorAll('script')];

    const init = scripts.find(
      (s) => /ds-theme/.test(s.textContent ?? '') || /theme-init/.test(s.getAttribute('src') ?? '')
    );
    assert.ok(init, `${page}: <head> 内にテーマ初期化スクリプトが無い（FOUC が出る）`);
    assert.ok(!init.hasAttribute('defer'), `${page}: theme-init に defer が付いている`);
    assert.ok(!init.hasAttribute('async'), `${page}: theme-init に async が付いている`);
  }
});

test('AC-03: theme-init はスタイルシートより前に置かれている', () => {
  const html = readSite('index.html');
  const initAt = html.search(/ds-theme|theme-init/);
  const cssAt = html.indexOf('/assets/css/main.css');

  assert.ok(initAt >= 0 && cssAt >= 0, 'theme-init か main.css が見つからない');
  assert.ok(initAt < cssAt, 'theme-init が CSS より後にある（描画済みの色が書き換わる）');
});

test('AC-04: 初期化スクリプトが ds-theme と prefers-color-scheme を読む', () => {
  const js = readSite('assets/js/theme-init.js');

  assert.match(js, /localStorage\.getItem\(\s*['"]ds-theme['"]\s*\)/, 'ds-theme を読んでいない');
  assert.match(js, /prefers-color-scheme:\s*dark/, 'OS 設定へのフォールバックが無い');
  assert.match(js, /setAttribute\(\s*['"]data-theme['"]/, 'data-theme を設定していない');
  assert.match(js, /try\s*\{/, 'localStorage の失敗を握り潰す try が無い（プライベートモードで死ぬ）');
});

/**
 * theme-init.js を最小の偽ブラウザで実際に走らせ、data-theme が何になるかを見る。
 * ソースを grep するだけでは「localStorage が投げたとき」の分岐を検証できず、
 * 属性が付かないまま終わる不具合（アイコン二重表示・初回クリック無反応）を素通しする。
 */
function runThemeInit({ stored = null, throws = false, prefersDark = true } = {}) {
  const root = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } };
  const sandbox = {
    document: { documentElement: root },
    localStorage: {
      getItem(key) {
        if (throws) throw new Error('SecurityError: localStorage is not available');
        return key === 'ds-theme' ? stored : null;
      },
    },
    matchMedia: () => ({ matches: prefersDark }),
  };
  sandbox.window = sandbox;

  const src = readSite('assets/js/theme-init.js');
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', 'localStorage', 'matchMedia', src)(
    sandbox, sandbox.document, sandbox.localStorage, sandbox.matchMedia
  );
  return root.attrs['data-theme'];
}

test('AC-03: localStorage が使えなくても data-theme が必ず付く', () => {
  // Safari のプライベートモードや、サードパーティ Cookie を遮断された iframe の状況。
  const theme = runThemeInit({ throws: true });
  assert.ok(
    theme === 'dark' || theme === 'light',
    `localStorage が投げると data-theme が付かない (${theme})。` +
      'setAttribute が try の中に入っていないか確認すること'
  );
});

test('AC-04: 保存済みの選択が OS 設定より優先される', () => {
  assert.equal(runThemeInit({ stored: 'light', prefersDark: true }), 'light');
  assert.equal(runThemeInit({ stored: 'dark', prefersDark: false }), 'dark');
});

test('AC-04: 未保存なら OS 設定に従う', () => {
  assert.equal(runThemeInit({ stored: null, prefersDark: true }), 'dark');
  assert.equal(runThemeInit({ stored: null, prefersDark: false }), 'light');
});

test('AC-04: 壊れた保存値は OS 設定にフォールバックする', () => {
  assert.equal(runThemeInit({ stored: 'purple', prefersDark: false }), 'light');
});

test('AC-04: トグルが ds-theme を書き戻す', () => {
  const js = readSite('assets/js/theme-toggle.js');

  assert.match(js, /localStorage\.setItem\(\s*['"]ds-theme['"]/, 'ds-theme を保存していない');
  assert.match(js, /setAttribute\(\s*['"]data-theme['"]/, 'data-theme を切り替えていない');
});

test('AC-28: 全ページが lang="ja" と非空の <title> を持つ', () => {
  for (const page of allHtml()) {
    const d = doc(page);
    assert.equal(d.documentElement.getAttribute('lang'), 'ja', `${page}: lang が ja でない`);
    const title = (d.querySelector('title')?.textContent ?? '').trim();
    assert.ok(title.length > 0, `${page}: <title> が空`);
  }
});
