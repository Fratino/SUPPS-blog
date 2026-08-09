// ビルド成果物へのアクセスと、最小限の CSS パーサ。
//
// ビルド自体は npm の pretest（jekyll build ×2）が済ませている前提で、
// ここではディスク上の _site / _site-test を読むだけにしてある。
// テストファイルごとにプロセスが分かれる node:test で毎回ビルドすると
// Jekyll が何度も走ってしまうため。

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseHTML } from 'linkedom';

export const ROOT = resolve(import.meta.dirname, '..', '..');
/** 本番ビルド（sass compressed）。AC-30 の確認に使う。 */
export const PROD_DIR = join(ROOT, '_site');
/** テストビルド（sass expanded）。CSS のアサートはすべてこちら。 */
export const TEST_DIR = join(ROOT, '_site-test');

function requireBuild(dir) {
  if (!existsSync(dir)) {
    throw new Error(
      `ビルド成果物が見つかりません: ${dir}\n` +
        `先に \`npm run pretest\`（bundle exec jekyll build ×2）を実行してください。`
    );
  }
  return dir;
}

/** テストビルドからテキストファイルを読む。 */
export function readSite(relPath) {
  const p = join(requireBuild(TEST_DIR), relPath);
  if (!existsSync(p)) throw new Error(`生成されていません: ${relPath}`);
  return readFileSync(p, 'utf8');
}

export function siteHas(relPath) {
  return existsSync(join(requireBuild(TEST_DIR), relPath));
}

export function prodHas(relPath) {
  return existsSync(join(requireBuild(PROD_DIR), relPath));
}

export function readProd(relPath) {
  const p = join(requireBuild(PROD_DIR), relPath);
  if (!existsSync(p)) throw new Error(`生成されていません (prod): ${relPath}`);
  return readFileSync(p, 'utf8');
}

/** テストビルドの HTML を DOM にして返す。 */
export function doc(relPath) {
  return parseHTML(readSite(relPath)).document;
}

/** テストビルド配下の全 .html を _site-test からの相対パスで列挙。 */
export function allHtml(dir = requireBuild(TEST_DIR), out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) allHtml(p, out);
    else if (name.endsWith('.html')) out.push(relative(TEST_DIR, p));
  }
  return out;
}

// ─────────────────────────── CSS ───────────────────────────

let cssCache = null;
/** 展開済み（expanded）のビルド CSS。 */
export function css() {
  if (cssCache === null) cssCache = readSite('assets/css/main.css');
  return cssCache;
}

/**
 * 宣言リストを { prop: value } に。同名プロパティは後勝ち（CSS と同じ）。
 * セミコロンの分割は括弧の深さを見て行う（`font-family: a, b` を壊さないため）。
 */
export function parseDecls(body) {
  const decls = {};
  const order = [];
  let depth = 0;
  let cur = '';
  const flush = () => {
    const s = cur.trim();
    cur = '';
    if (!s) return;
    const i = s.indexOf(':');
    if (i < 0) return;
    const prop = s.slice(0, i).trim();
    const value = s.slice(i + 1).trim();
    decls[prop] = value;
    order.push([prop, value]);
  };
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      flush();
      continue;
    }
    cur += ch;
  }
  flush();
  return { decls, order };
}

let rulesCache = null;
/**
 * CSS を平坦なルール配列にする。
 * 各要素: { selector, at: [囲っている @ ルールの prelude], decls, order, body }
 * Sass の expanded 出力は「@media > ルール > 宣言」の 2 段までなので、
 * その範囲で正しく動けば足りる。
 */
export function rules() {
  if (rulesCache) return rulesCache;
  const src = css().replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const prelude = stack.pop();
      if (prelude !== undefined) {
        const { decls, order } = parseDecls(buf);
        if (order.length) {
          out.push({ selector: prelude, at: [...stack], decls, order, body: buf.trim() });
        }
      }
      buf = '';
    } else {
      buf += ch;
    }
  }
  rulesCache = out;
  return out;
}

/** カンマ区切りセレクタを分解して、いずれかが sel に一致するルールを集める。 */
export function rulesFor(sel) {
  return rules().filter((r) =>
    r.selector.split(',').some((s) => s.trim() === sel)
  );
}

/**
 * sel に当たる宣言を、出現順にマージして 1 つの { prop: value } にする。
 * @media 配下のルールは既定で除外（デフォルトの見た目を検証したいため）。
 */
export function computed(sel, { includeMedia = false } = {}) {
  const merged = {};
  for (const r of rulesFor(sel)) {
    if (!includeMedia && r.at.length) continue;
    Object.assign(merged, r.decls);
  }
  return merged;
}

/** @media などの at ルール prelude を重複なしで列挙。 */
export function atRules() {
  const set = new Set();
  for (const r of rules()) for (const a of r.at) set.add(a);
  return [...set];
}

/** 括弧の深さを見ながら区切り文字で分割する（`clamp(28px, 5vw, 40px)` を壊さない）。 */
function splitTop(str, isSep) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (depth === 0 && isSep(ch)) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/**
 * longhand と `font: 700 11px/1 Manrope, sans-serif` 形式の shorthand の
 * どちらでも { weight, size, lineHeight, family } を返す。
 * 実装側は Dart Sass のスラッシュ除算を避けて longhand で書くが、
 * テストが書き方に縛られないよう両対応にしてある。
 */
export function fontOf(decls) {
  const out = {
    weight: decls['font-weight'],
    size: decls['font-size'],
    lineHeight: decls['line-height'],
    family: decls['font-family'],
  };

  const sh = decls['font'];
  if (sh) {
    const tokens = splitTop(sh, (c) => /\s/.test(c));
    let i = 0;
    if (tokens[i] && /^(\d{3}|normal|bold)$/.test(tokens[i])) out.weight ??= tokens[i++];

    if (tokens[i]) {
      const [size, lineHeight] = splitTop(tokens[i++], (c) => c === '/');
      out.size ??= size;
      if (lineHeight) out.lineHeight ??= lineHeight;
    }
    if (tokens.length > i) out.family ??= tokens.slice(i).join(' ');
  }

  return out;
}

/**
 * 数値表記のゆれを吸収する。Sass は `.01em` を `0.01em` に正規化して出すので、
 * DESIGN.md の表記と CSS 出力をそのまま文字列比較すると落ちる。
 */
export function normNum(v) {
  return String(v ?? '')
    .replace(/(^|[\s(,\-])\.(\d)/g, '$10.$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 値の中の px 数値をすべて返す。 */
export function pxIn(value) {
  return [...value.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => Number(m[1]));
}

// ─────────────────────── ソース側（_posts） ───────────────────────

/**
 * `_posts/*.md` の front matter を読み、**公開される記事だけ** を返す。
 * YAML の全機能は要らないので、`key: value` / `key: [a, b]` / `key: "..."` だけ拾う。
 *
 * `published: false` と未来日付を落とすのが要点。Jekyll は既定で
 * `future: false` なのでこれらをビルドしない。落とさずに数えると、
 * 予約投稿を 1 本置いた瞬間に AC-20 / AC-25 / AC-26 が
 * 「一覧に出ていない記事がある」という誤った理由で落ちる。
 */
export function posts() {
  const dir = join(ROOT, '_posts');
  if (!existsSync(dir)) return [];

  const now = new Date();

  return readdirSync(dir)
    .filter((f) => /\.(md|markdown)$/.test(f))
    .sort()
    .reverse() // 新しい順（ファイル名が日付始まりなので辞書順の逆で足りる）
    .map((file) => {
      const raw = readFileSync(join(dir, file), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) throw new Error(`${file}: front matter が無い`);

      const fm = {};
      for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const [, key] = kv;
        let value = kv[2].trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          fm[key] = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        } else {
          fm[key] = value.replace(/^["']|["']$/g, '');
        }
      }
      fm.__file = file;
      fm.__body = raw.slice(m[0].length);
      return fm;
    })
    .filter((fm) => {
      if (String(fm.published).toLowerCase() === 'false') return false;
      // date が無ければファイル名先頭の日付を使う（Jekyll と同じ扱い）
      const stamp = fm.date || fm.__file.slice(0, 10);
      const d = new Date(stamp);
      return Number.isNaN(d.getTime()) ? true : d <= now;
    });
}

/**
 * 記事の出力先 index.html への相対パス（_config.yml の permalink: /posts/:title/ に対応）。
 * 拡張子の剥がし方をここ 1 箇所に閉じ込める。各テストで `.replace(/\.md$/, '')` を
 * 書くと `.markdown` の記事だけ経路がズレて、無関係な理由で落ちる。
 */
export function postPath(fm) {
  const slug = fm.__file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.(md|markdown)$/, '');
  return `posts/${slug}/index.html`;
}

/** href（%エンコード済みでも可）をビルド出力の相対パスに直す。 */
export function hrefToPath(href) {
  const clean = decodeURIComponent(href.split('#')[0].split('?')[0]);
  if (!clean.startsWith('/')) return null;
  const p = clean.replace(/^\//, '');
  if (p === '' || p.endsWith('/')) return `${p}index.html`;
  return p;
}
