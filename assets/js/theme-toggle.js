---
# layout: none は必須。理由は theme-init.js のコメントを参照。
layout: none
---
// DESIGN.md §8 — テーマトグル。
// 初期化（theme-init.js）と違い描画を止めないので、こちらは defer で読み込んでよい。
(function () {
  function toggleTheme() {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ds-theme', next);
    } catch (e) {}
  }

  var btn = document.querySelector('.theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
})();
