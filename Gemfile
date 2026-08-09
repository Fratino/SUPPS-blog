source "https://rubygems.org"

# 3.3 系であればよい。ホストは rbenv の 3.3.9（.ruby-version）、
# コンテナ側（bin/jekyll のフォールバック）は ruby:3.3-slim の 3.3.x が入る。
# 3.4 系を避けているのは、csv / logger / base64 の default gem 剥がしで
# Jekyll 系プラグインが警告や依存崩れを起こすため。
ruby "~> 3.3.0"

gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-paginate-v2" # 一覧のページネーション
  # sitemap は自前（sitemap.xml）。jekyll-sitemap は paginate-v2 と併用すると
  # トップページを取りこぼす。理由は sitemap.xml のコメントを参照。
end

group :development do
  gem "bundler-audit", require: false # Gemfile.lock の既知脆弱性チェック
end
