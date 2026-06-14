/* Z勤怠 Service Worker
   方針：ネットワーク優先（network-first）
   - オンライン時は必ずサーバーから最新を取得 → 更新が確実に反映される
   - オフライン時のみ、直近に取得したキャッシュを表示
   - ドキュメント(HTML)の遷移リクエストのみ介入。API(Supabase/Stripe)やフォント等は素通り
*/
const CACHE = 'zkin-cache-v1';

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (!isDoc) return; // HTML遷移以外は介入しない（API・フォント等はそのまま）

  e.respondWith(
    fetch(req).then(function (res) {
      // 正常な同一オリジンのHTMLのみキャッシュ更新（オフライン用の控え）
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      // オフライン時：キャッシュ → なければ index.html
      return caches.match(req).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
