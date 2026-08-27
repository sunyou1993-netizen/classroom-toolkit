/* 수업도우미 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = '__VERSION__';
const ASSETS = __ASSETS__;

// 우리 파일만 다룹니다. 같은 폴더에 있는 다른 페이지(예: env.html)는
// 손대지 않고 그대로 통과시켜, 그쪽이 바뀌어도 옛날 내용이 보이는 일이 없게 합니다.
const OWNED = new Set(ASSETS.map((p) => new URL(p, self.location.href).pathname));
const HOME = new URL('./index.html', self.location.href).pathname;

function ownedPath(url) {
  if (OWNED.has(url.pathname)) return url.pathname;
  // 폴더 주소는 index.html 로 보정  (…/timer/ -> …/timer/index.html)
  const last = url.pathname.split('/').pop();
  if (url.pathname.endsWith('/') || !last.includes('.')) {
    const idx = url.pathname.replace(/\/?$/, '/') + 'index.html';
    if (OWNED.has(idx)) return idx;
  }
  return null;
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

// 같은 주소에 다른 화면(예: /quiz/)이 함께 있을 수 있습니다.
// 예전 캐시를 지울 때 "내 것"만 지워야 서로의 오프라인 캐시를 없애지 않습니다.
const MINE = CACHE.replace(/-[a-f0-9]+$/, '-');

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith(MINE) && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 캐시 우선 — 인터넷이 끊겨도, 서버가 없어도 동작합니다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 우리 파일이 아니면 아무것도 하지 않습니다(브라우저가 평소대로 처리).
  const path = ownedPath(url);
  if (!path) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    const hit = await cache.match(path, { ignoreSearch: true });
    if (hit) return hit;

    // 캐시에 없으면 네트워크에서 받아 두었다가 다음부터 씁니다.
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(path, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const home = await cache.match(HOME, { ignoreSearch: true });
        if (home) return home;
      }
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
