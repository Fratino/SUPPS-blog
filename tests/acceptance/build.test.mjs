// AC-29, AC-30, AC-31 — ビルド設定そのもの。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProd, prodHas, ROOT, css } from '../helpers/site.mjs';

const config = () => readFileSync(join(ROOT, '_config.yml'), 'utf8');

test('AC-30: 本番ビルドの main.css が圧縮されている', () => {
  const prod = readProd('assets/css/main.css');

  assert.ok(prod.length > 0, '本番 CSS が空');
  // compressed 出力は改行をほぼ持たない。テストビルド（expanded）との差でも確認する。
  const lines = prod.split('\n').length;
  assert.ok(lines <= 5, `本番 CSS が圧縮されていない（${lines} 行）`);
  assert.ok(
    prod.length < css().length,
    '本番 CSS がテストビルド（expanded）より小さくなっていない'
  );
});

test('AC-34: 本番ビルドがソースマップを公開しない', () => {
  // 既定では main.css.map が出て _sass のソースがそのまま外から読める。
  assert.ok(!prodHas('assets/css/main.css.map'), 'main.css.map が公開物に出ている');
  assert.ok(
    !readProd('assets/css/main.css').includes('sourceMappingURL'),
    'main.css に sourceMappingURL が残っている'
  );
});

test('AC-30: 本番 CSS が肥大していない', () => {
  const bytes = Buffer.byteLength(readProd('assets/css/main.css'));
  // 目安。超えたときは何かを取り込みすぎている合図なので、まず中身を疑う。
  assert.ok(bytes < 20_000, `main.css が ${bytes} バイト（目安 20KB 未満）`);
});

test('AC-31: kramdown + rouge が設定されている', () => {
  const cfg = config();
  assert.match(cfg, /^markdown:\s*kramdown/m, 'markdown が kramdown でない');
  assert.match(cfg, /syntax_highlighter:\s*rouge/m, 'rouge が設定されていない');
});

test('AC-30: sass の出力スタイルが compressed', () => {
  assert.match(config(), /style:\s*compressed/, '_config.yml の sass.style が compressed でない');
});

test('AC-35: defaults が _posts の外へ波及しない', () => {
  const cfg = config();
  assert.match(cfg, /^defaults:/m, '_config.yml に defaults が無い');

  // `scope: {path: ""}` を type 無しで書くと、front matter を持つ資産ファイル
  // （assets/js/*.js など）まで layout に包まれる。実際にそれで
  // theme-init.js が HTML になり、テーマ初期化が丸ごと死んだ。
  const defaultsBlock = cfg.slice(cfg.search(/^defaults:/m)).split(/\n(?=\S)/)[0];
  const scopes = [...defaultsBlock.matchAll(/scope:\s*\n((?:\s+\S.*\n)+?)\s*values:/g)].map((m) => m[1]);

  assert.ok(scopes.length > 0, 'defaults の scope が読み取れない');
  for (const scope of scopes) {
    assert.match(scope, /type:\s*\S+/, `type の無い catch-all な scope がある:\n${scope}`);
  }
});

test('AC-35: JS / CSS の資産が HTML に包まれていない', () => {
  for (const path of ['assets/js/theme-init.js', 'assets/js/theme-toggle.js', 'assets/css/main.css']) {
    const body = readProd(path).trimStart();
    assert.ok(
      !body.startsWith('<!DOCTYPE') && !body.startsWith('<html'),
      `${path} が HTML ページとして出力されている（layout: none の書き忘れ）`
    );
  }
});
