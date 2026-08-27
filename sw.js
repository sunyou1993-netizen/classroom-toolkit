/* 수업도우미 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = 'suup-doumi-20aa1940642a';
const ASSETS = [
  "./app.html",
  "./assets/character11-DZuNsAEY.png",
  "./assets/clock-DcZ_-H-T.png",
  "./assets/hub-bg-Dcf0D4Ho.webp",
  "./assets/index-DQfoVmUJ.css",
  "./assets/index-DV9tjrWy.js",
  "./assets/instrument-DsovIA_G.png",
  "./assets/ladder-DZrK4QoX.png",
  "./assets/noise-CR8mdZn6.png",
  "./assets/paint-CmUIdA4v.png",
  "./assets/pomodoro-CYL_Tn_h.png",
  "./assets/random-DOe117BQ.png",
  "./assets/stopwatch-DZDvzkUZ.png",
  "./assets/worldclock-CrsZxc5r.png",
  "./favicon.ico",
  "./fonts/PretendardVariable.woff2",
  "./fonts/fonts.css",
  "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  "./fonts/outfit-latin-wght-normal.woff2",
  "./index.html",
  "./instruments/app.html",
  "./instruments/assets/character_piano.png",
  "./instruments/assets/index-CZl-8_Nx.css",
  "./instruments/assets/index-rRh4Pgjt.js",
  "./instruments/assets/piano_bear_mascot.png",
  "./instruments/index.html",
  "./ladder/app.html",
  "./ladder/assets/image231-BAiGMIFN.png",
  "./ladder/assets/index-Cpmt0EVM.js",
  "./ladder/assets/index-GuPj4nOJ.css",
  "./ladder/assets/ladder-board-bg-Cix7d0Sh.png",
  "./ladder/char-cat-1.png",
  "./ladder/char-deer-1.png",
  "./ladder/char-dog-1.png",
  "./ladder/char-fox-1.png",
  "./ladder/char-koala-1.png",
  "./ladder/char-lion-1.png",
  "./ladder/char-panda-1.png",
  "./ladder/char-pig-1.png",
  "./ladder/char-rabbit-1.png",
  "./ladder/char-tiger-1.png",
  "./ladder/index.html",
  "./manifest.webmanifest",
  "./noise/app.html",
  "./noise/app.js",
  "./noise/index.html",
  "./noise/noise.png",
  "./noise/style.css",
  "./noise/tailwind.css",
  "./paint/app.html",
  "./paint/assets/index-BXO7XPyu.js",
  "./paint/assets/index-Dhns_zDJ.css",
  "./paint/index.html",
  "./picker/app.html",
  "./picker/assets/image2342-CgPr5Nk1.png",
  "./picker/assets/image33-CK9JRsBq.png",
  "./picker/assets/index-DsCMtcaw.js",
  "./picker/assets/index-FvUXDqSi.css",
  "./picker/index.html",
  "./pomodoro/app.html",
  "./pomodoro/assets/character2-BIxUVbiX.png",
  "./pomodoro/index.html",
  "./shared/flags/ae.svg",
  "./shared/flags/ar.svg",
  "./shared/flags/at.svg",
  "./shared/flags/au.svg",
  "./shared/flags/bd.svg",
  "./shared/flags/be.svg",
  "./shared/flags/br.svg",
  "./shared/flags/ca.svg",
  "./shared/flags/ch.svg",
  "./shared/flags/cl.svg",
  "./shared/flags/cn.svg",
  "./shared/flags/co.svg",
  "./shared/flags/cz.svg",
  "./shared/flags/de.svg",
  "./shared/flags/dk.svg",
  "./shared/flags/eg.svg",
  "./shared/flags/es.svg",
  "./shared/flags/fi.svg",
  "./shared/flags/fj.svg",
  "./shared/flags/fr.svg",
  "./shared/flags/gb.svg",
  "./shared/flags/gr.svg",
  "./shared/flags/gu.svg",
  "./shared/flags/hk.svg",
  "./shared/flags/hu.svg",
  "./shared/flags/id.svg",
  "./shared/flags/ie.svg",
  "./shared/flags/il.svg",
  "./shared/flags/in.svg",
  "./shared/flags/is.svg",
  "./shared/flags/it.svg",
  "./shared/flags/jp.svg",
  "./shared/flags/ke.svg",
  "./shared/flags/kh.svg",
  "./shared/flags/kr.svg",
  "./shared/flags/kw.svg",
  "./shared/flags/la.svg",
  "./shared/flags/lk.svg",
  "./shared/flags/ma.svg",
  "./shared/flags/mm.svg",
  "./shared/flags/mn.svg",
  "./shared/flags/mo.svg",
  "./shared/flags/mp.svg",
  "./shared/flags/mx.svg",
  "./shared/flags/my.svg",
  "./shared/flags/ng.svg",
  "./shared/flags/nl.svg",
  "./shared/flags/no.svg",
  "./shared/flags/np.svg",
  "./shared/flags/nz.svg",
  "./shared/flags/pe.svg",
  "./shared/flags/ph.svg",
  "./shared/flags/pk.svg",
  "./shared/flags/pl.svg",
  "./shared/flags/pt.svg",
  "./shared/flags/qa.svg",
  "./shared/flags/ru.svg",
  "./shared/flags/sa.svg",
  "./shared/flags/se.svg",
  "./shared/flags/sg.svg",
  "./shared/flags/th.svg",
  "./shared/flags/tr.svg",
  "./shared/flags/tw.svg",
  "./shared/flags/us.svg",
  "./shared/flags/vn.svg",
  "./shared/flags/za.svg",
  "./shared/icon-192.png",
  "./shared/icon-512.png",
  "./shared/lucide.min.js",
  "./shared/world-map.svg",
  "./stopwatch/app.html",
  "./stopwatch/assets/image111-Bp6pEQNO.png",
  "./stopwatch/assets/image999.png",
  "./stopwatch/assets/index-BmgKoYmN.js",
  "./stopwatch/assets/index-CRwaGTGP.css",
  "./stopwatch/index.html",
  "./timer/app.html",
  "./timer/assets/index-9ey447Go.js",
  "./timer/assets/index-LixKbbkp.css",
  "./timer/character.png",
  "./timer/image222.png",
  "./timer/image223.png",
  "./timer/index.html",
  "./worldclock/app.html",
  "./worldclock/assets/index-CiHkq2Vq.css",
  "./worldclock/assets/index-DlxY5pLf.js",
  "./worldclock/assets/travel-B7GNZuE7.png",
  "./worldclock/index.html"
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
