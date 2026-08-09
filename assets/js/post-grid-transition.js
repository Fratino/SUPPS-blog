// トップ（ページネーション含む）の記事一覧を遷移する際、
// 実際のコンテンツが届くまで .post-grid をスケルトン表示に差し替える。
// .post-grid を持たないページ（記事詳細・アーカイブ）では何もしない。
(function () {
  var grid = document.querySelector('.post-grid');
  if (!grid) return;

  var main = document.getElementById('main');

  function skeletonMarkup(count) {
    var card =
      '<div class="post-card post-card--skeleton" aria-hidden="true">' +
        '<div class="post-card__thumb skeleton-block"></div>' +
        '<div class="post-card__body">' +
          '<div class="skeleton-line skeleton-line--eyebrow"></div>' +
          '<div class="skeleton-line skeleton-line--title"></div>' +
          '<div class="skeleton-line skeleton-line--title" style="width:70%"></div>' +
          '<div class="skeleton-line skeleton-line--meta"></div>' +
        '</div>' +
      '</div>';
    return new Array(count + 1).join(card); // card を count 回繰り返す
  }

  function isTransitionable(a) {
    if (!a || !a.href) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    if (a.origin !== location.origin) return false;
    return a.matches('.site-header__brand, .pagination__prev, .pagination__next');
  }

  function loadPage(url, push) {
    var count = grid.querySelectorAll('.post-card').length || 2;
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = skeletonMarkup(count);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('failed to fetch ' + url);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newGrid = doc.querySelector('.post-grid');
        var newPagination = doc.querySelector('.pagination');
        var oldPagination = main.querySelector('.pagination');

        if (newGrid) grid.innerHTML = newGrid.innerHTML;
        grid.removeAttribute('aria-busy');

        if (oldPagination && newPagination) {
          oldPagination.outerHTML = newPagination.outerHTML;
        } else if (oldPagination) {
          oldPagination.remove();
        }

        document.title = doc.title;
        if (push) history.pushState({ url: url }, '', url);
        window.scrollTo(0, 0);
      })
      .catch(function () {
        location.href = url; // 失敗時は通常遷移にフォールバック
      });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!isTransitionable(a)) return;
    e.preventDefault();
    loadPage(a.href, true);
  });

  window.addEventListener('popstate', function () {
    loadPage(location.href, false);
  });
})();
