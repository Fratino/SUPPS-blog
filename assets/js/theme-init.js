---
# front matter が無いと Jekyll が Liquid を処理しないので空で置く。
# layout: none は必須。_config.yml の defaults が全ファイルに layout: page を当てるため、
# 書き忘れるとこの JS が HTML ページに包まれて出力され、テーマ初期化が丸ごと死ぬ。
layout: none
---
// DESIGN.md §8 — テーマ初期化。
//
// <head> 内で同期実行すること。defer / async を付けると、
// CSS 適用後に data-theme が変わって白フラッシュ（FOUC）が出る。
// 本体アプリと localStorage キー 'ds-theme' を共有しているので、
// 同一ドメイン配下ならユーザーの選択が引き継がれる。
//
// setAttribute は try の外に出すこと。中に入れると、localStorage が使えない環境
// （Safari のプライベートモード、サードパーティ Cookie を遮断された iframe など）で
// getItem が投げた瞬間に data-theme が付かないまま終わる。そうなると
// _sass/_header.scss の [data-theme="dark"|"light"] がどちらも当たらず、
// 太陽と月のアイコンが両方出て、トグルの初回クリックが無反応になる。
(function () {
  var t = null;
  try {
    t = localStorage.getItem('ds-theme');
  } catch (e) {}

  if (t !== 'dark' && t !== 'light') {
    try {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      t = 'dark';
    }
  }

  document.documentElement.setAttribute('data-theme', t);
})();
