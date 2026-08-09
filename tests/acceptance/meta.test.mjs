// AC-25, AC-27, AC-28 — 付随ページとリンク健全性。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { doc, readSite, siteHas, allHtml, hrefToPath, posts, postPath, ROOT } from '../helpers/site.mjs';

test('AC-25: sitemap / robots / 404 / archive が生成される', () => {
  for (const path of ['sitemap.xml', 'robots.txt', '404.html', 'archive/index.html']) {
    assert.ok(siteHas(path), `生成されていない: ${path}`);
  }
});

test('AC-25: sitemap.xml にトップ・記事・アーカイブが載る', () => {
  const xml = readSite('sitemap.xml');
  assert.match(xml, /<urlset[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeURIComponent(m[1]));
  const paths = locs.map((u) => new URL(u).pathname);

  // トップが落ちやすい。jekyll-paginate-v2 がトップの Page を差し替えるため、
  // jekyll-sitemap 任せにしていたときは実際にここが空だった。
  assert.ok(paths.includes('/'), 'sitemap にトップページが無い');

  for (const fm of posts()) {
    const path = `/${postPath(fm).replace(/index\.html$/, '')}`;
    assert.ok(paths.includes(path), `sitemap に記事が無い: ${fm.__file}`);
  }

  assert.ok(paths.includes('/archive/'), 'sitemap にアーカイブが無い');
  assert.ok(!paths.includes('/404.html'), 'sitemap に 404 が載っている');
});

test('AC-25: robots.txt が sitemap を指す', () => {
  const txt = readSite('robots.txt');
  assert.match(txt, /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i, 'robots.txt に Sitemap 行が無い');
});

test('AC-25: 404 ページがトップへ戻る導線を持つ', () => {
  const d = doc('404.html');
  const links = [...d.querySelectorAll('main a[href], article a[href]')].map((a) =>
    a.getAttribute('href')
  );
  // baseurl 付きで運用される可能性があるので、`/` 決め打ちでは見ない。
  // 大事なのは「トップの実体に届くこと」。
  assert.ok(
    links.some((h) => hrefToPath(h) === 'index.html'),
    `404 ページにトップへの導線が無い (${links.join(', ')})`
  );
});

test('AC-27: サイト内部リンクにリンク切れが無い', () => {
  const broken = [];
  const skip = /^(https?:|mailto:|tel:|#|data:|javascript:)/i;

  for (const page of allHtml()) {
    const dir = page.includes('/') ? page.slice(0, page.lastIndexOf('/') + 1) : '';
    const d = doc(page);

    for (const el of d.querySelectorAll('a[href], link[href], img[src], script[src]')) {
      const raw = el.getAttribute('href') ?? el.getAttribute('src');
      if (!raw || skip.test(raw)) continue;

      // 相対リンクも黙って飛ばさず、掲載元ページからの相対で解決して確認する。
      const path = raw.startsWith('/')
        ? hrefToPath(raw)
        : hrefToPath('/' + new URL(raw, `http://x/${dir}`).pathname.replace(/^\//, ''));

      if (!path || !siteHas(path)) broken.push(`${page} → ${raw}`);
    }
  }

  assert.deepEqual(broken, [], `リンク切れ:\n  ${broken.join('\n  ')}`);
});

test('AC-28: 全ページにヘッダーとフッターが入る', () => {
  for (const page of allHtml()) {
    const d = doc(page);
    assert.ok(d.querySelector('.site-header'), `${page}: ヘッダーが無い`);
    assert.ok(d.querySelector('.site-footer'), `${page}: フッターが無い`);
  }
});

test('AC-40: 全ページに DRUM SUPPS 誘導バナーが入る', () => {
  for (const page of allHtml()) {
    const d = doc(page);
    assert.ok(d.querySelector('.site-banner'), `${page}: バナーが無い`);
  }
});

test('AC-28: 全ページに meta description と viewport がある', () => {
  for (const page of allHtml()) {
    const d = doc(page);
    assert.ok(d.querySelector('meta[name="viewport"]'), `${page}: viewport が無い`);
    const desc = d.querySelector('meta[name="description"]')?.getAttribute('content');
    assert.ok(desc && desc.trim(), `${page}: meta description が空`);
  }
});

test('外部リンクは Google Fonts のみ（第三者スクリプトを増やさない）', () => {
  // jekyll-feed の <link rel="alternate"> などは site.url を絶対 URL で出すので、
  // 自サイトのホストは「外部」扱いしない。
  const cfg = readFileSync(join(ROOT, '_config.yml'), 'utf8');
  const selfUrl = cfg.match(/^url:\s*["']?([^"'\s]+)/m)?.[1];
  const allowedHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
  if (selfUrl) allowedHosts.add(new URL(selfUrl).host);
  const foreign = new Set();

  for (const page of allHtml()) {
    const d = doc(page);
    for (const el of d.querySelectorAll('link[href], script[src], img[src], iframe[src]')) {
      const raw = el.getAttribute('href') ?? el.getAttribute('src');
      if (!raw || !/^https?:\/\//i.test(raw)) continue;
      const host = new URL(raw).host;
      if (!allowedHosts.has(host)) foreign.add(`${page}: ${host}`);
    }
  }

  assert.deepEqual([...foreign], [], `想定外の外部ホストを読み込んでいる:\n  ${[...foreign].join('\n  ')}`);
});

test('AC-32: ARCHIVE ナビは /archive/ でだけ現在地を示す', () => {
  const archiveActive = [...doc('archive/index.html').querySelectorAll('.site-nav .nav-link.active')];
  assert.equal(archiveActive.length, 1, `archive/index.html: active なナビリンクが ${archiveActive.length} 個ある`);
  assert.equal(archiveActive[0].textContent.trim(), 'アーカイブ', 'archive/index.html: 現在地の表示が違う');
  assert.equal(archiveActive[0].getAttribute('aria-current'), 'page', 'archive/index.html: aria-current が無い');

  // HOME はロゴが担うのでナビ項目自体が無い。トップ・2 ページ目では active が 0 件でよい。
  // 2 ページ目は記事数が per_page を超えたときしか生成されないので、無ければスキップする。
  for (const page of ['index.html', 'page/2/index.html']) {
    if (!siteHas(page)) continue;
    const active = doc(page).querySelectorAll('.site-nav .nav-link.active');
    assert.equal(active.length, 0, `${page}: ARCHIVE 以外のページで active なナビリンクが出ている`);
  }
});

test('AC-28: <title> が同じ語を二重に並べない', () => {
  for (const page of allHtml()) {
    const title = doc(page).querySelector('title').textContent.trim();
    const parts = title.split('|').map((s) => s.trim());
    assert.equal(new Set(parts).size, parts.length, `${page}: <title> が重複している (${title})`);
  }
});

test('AC-33: 開発用ファイルが公開物に混ざらない', () => {
  for (const path of ['bin/jekyll', 'package.json', 'Gemfile', 'DESIGN.md', 'README.md']) {
    assert.ok(!siteHas(path), `公開物に開発用ファイルが出力されている: ${path}`);
  }
});

test('テーマトグルがキーボードで操作できる', () => {
  const d = doc('index.html');
  const toggle = d.querySelector('.theme-toggle');

  assert.ok(toggle, 'テーマトグルが無い');
  assert.equal(toggle.tagName.toLowerCase(), 'button', 'トグルが <button> でない（Tab で届かない）');
  assert.ok(toggle.getAttribute('aria-label')?.trim(), 'トグルに aria-label が無い');
});
