/* 수업도우미 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = 'suup-doumi-918441ebb943';
const ASSETS = [
  "./assets/character11-DZuNsAEY.png",
  "./assets/index-f3BSwFll.js",
  "./assets/index-x4yf08m0.css",
  "./assets/랜덤-DOe117BQ.png",
  "./assets/뽀모돌-CYL_Tn_h.png",
  "./assets/사다리-DZrK4QoX.png",
  "./assets/세계시간-CrsZxc5r.png",
  "./assets/소음-CR8mdZn6.png",
  "./assets/스톰워치-DZDvzkUZ.png",
  "./assets/시계-DcZ_-H-T.png",
  "./assets/악기-DsovIA_G.png",
  "./assets/판서-CmUIdA4v.png",
  "./favicon.ico",
  "./fonts/PretendardVariable.woff2",
  "./fonts/fonts.css",
  "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  "./fonts/outfit-latin-wght-normal.woff2",
  "./index.html",
  "./instruments/assets/character_piano.png",
  "./instruments/assets/index-CZl-8_Nx.css",
  "./instruments/assets/index-rRh4Pgjt.js",
  "./instruments/assets/piano_bear_mascot.png",
  "./instruments/index.html",
  "./ladder/assets/image231-BAiGMIFN.png",
  "./ladder/assets/index-CvaFtnc5.js",
  "./ladder/assets/index-DVtDJrbj.css",
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
  "./noise/app.js",
  "./noise/index.html",
  "./noise/noise.png",
  "./noise/style.css",
  "./noise/tailwind.css",
  "./paint/assets/index-CAO4ROHa.js",
  "./paint/assets/index-CLXRffU1.css",
  "./paint/index.html",
  "./picker/assets/image2342-CgPr5Nk1.png",
  "./picker/assets/image33-CK9JRsBq.png",
  "./picker/assets/index-DsCMtcaw.js",
  "./picker/assets/index-FvUXDqSi.css",
  "./picker/image2342.png",
  "./picker/image33.png",
  "./picker/index.html",
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
  "./stopwatch/assets/image111-Bp6pEQNO.png",
  "./stopwatch/assets/image999.png",
  "./stopwatch/assets/index-BmgKoYmN.js",
  "./stopwatch/assets/index-CRwaGTGP.css",
  "./stopwatch/index.html",
  "./timer/assets/index-9ey447Go.js",
  "./timer/assets/index-LixKbbkp.css",
  "./timer/character.png",
  "./timer/image222.png",
  "./timer/image223.png",
  "./timer/index.html",
  "./worldclock/assets/index-C4NYHq7h.js",
  "./worldclock/assets/index-CP8yQiqI.css",
  "./worldclock/assets/travel-B7GNZuE7.png",
  "./worldclock/index.html",
  "./worldclock/travel.png"
];

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
