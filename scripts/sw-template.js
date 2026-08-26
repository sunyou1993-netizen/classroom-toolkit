/* 수업도우미 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = '__VERSION__';
const ASSETS = __ASSETS__;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선 — 인터넷이 끊겨도, 서버가 없어도 동작합니다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 프로그램 내려받기 폴더는 캐시하지 않고 그대로 통과시킵니다(용량이 큽니다).
  if (url.pathname.startsWith('/download/')) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    // 1) 정확히 일치하는 캐시
    let hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;

    // 2) 폴더 주소는 index.html 로 보정  (/timer/ -> /timer/index.html)
    const last = url.pathname.split('/').pop();
    if (url.pathname.endsWith('/') || !last.includes('.')) {
      const indexPath = url.pathname.replace(/\/?$/, '/') + 'index.html';
      hit = await cache.match(indexPath, { ignoreSearch: true });
      if (hit) return hit;
    }

    // 3) 캐시에 없으면 네트워크 시도 후 캐시에 저장
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const home = await cache.match('./index.html', { ignoreSearch: true });
        if (home) return home;
      }
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
