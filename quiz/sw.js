/* 수업도우미 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = 'suup-doumi-8e5c9486e8d0';
const ASSETS = [
  "./app.html",
  "./assets/index-BH_A0YdW.css",
  "./assets/index-CFF_0IS4.js",
  "./environment/app.html",
  "./environment/assets/index-BXQ3NjQK.css",
  "./environment/assets/index-D5mT4lkU.js",
  "./environment/image12.webp",
  "./environment/image213.webp",
  "./environment/image_o-1.webp",
  "./environment/image_o_2.webp",
  "./environment/image_x-1.webp",
  "./environment/image_x_2.webp",
  "./environment/index.html",
  "./fonts/PretendardVariable.woff2",
  "./fonts/fonts.css",
  "./fonts/gaegu-korean-400-normal.woff2",
  "./fonts/gaegu-korean-700-normal.woff2",
  "./fonts/gaegu-latin-400-normal.woff2",
  "./fonts/gaegu-latin-700-normal.woff2",
  "./fonts/gowun-dodum-korean-400-normal.woff2",
  "./fonts/gowun-dodum-latin-400-normal.woff2",
  "./fonts/jua-korean-400-normal.woff2",
  "./fonts/jua-latin-400-normal.woff2",
  "./fourchar/app.html",
  "./fourchar/assets/index-BaNGOn0w.css",
  "./fourchar/assets/index-t6nwc6NF.js",
  "./fourchar/image234.webp",
  "./fourchar/image2349.webp",
  "./fourchar/index.html",
  "./image 1680.webp",
  "./image 1681.png",
  "./image 1682.webp",
  "./image 1683.webp",
  "./image 1684.webp",
  "./image 1685.png",
  "./image 1686.webp",
  "./image 1687.webp",
  "./image 1688.webp",
  "./image31.webp",
  "./image4.webp",
  "./image67.webp",
  "./image7.webp",
  "./index.html",
  "./proverb/app.html",
  "./proverb/assets/index-BZcWoRtN.js",
  "./proverb/assets/index-DhewQwsj.css",
  "./proverb/image652.webp",
  "./proverb/image776.webp",
  "./proverb/index.html",
  "./safe/app.html",
  "./safe/assets/index-CmjevM14.js",
  "./safe/assets/index-gBeO7IXp.css",
  "./safe/image0949.webp",
  "./safe/image2432.webp",
  "./safe/image_o-1.webp",
  "./safe/image_o_2.webp",
  "./safe/image_x-1.webp",
  "./safe/image_x_2.webp",
  "./safe/index.html",
  "./song/app.html",
  "./song/assets/index-CPtnxLiB.js",
  "./song/assets/index-CZtWZlhW.css",
  "./song/image123.webp",
  "./song/image243.webp",
  "./song/index.html",
  "./violence/app.html",
  "./violence/assets/index-DFlLdJOA.css",
  "./violence/assets/index-DKaEGmw4.js",
  "./violence/image1713.webp",
  "./violence/image333.webp",
  "./violence/image64.webp",
  "./violence/image_o-1.webp",
  "./violence/image_o_2.webp",
  "./violence/image_x-1.webp",
  "./violence/image_x_2.webp",
  "./violence/index.html"
];

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
