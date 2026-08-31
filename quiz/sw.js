/* 퀴즈 오프라인 캐시
   scripts/make-sw.mjs 가 자동 생성합니다. 직접 고치지 마세요. */
const CACHE = 'suup-doumi-9ef58db93f21';
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
  "./fonts/LICENSE.txt",
  "./fonts/PretendardVariable.woff2",
  "./fonts/fonts.css",
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
  "./violence/index.html",
  "./문항근거.html",
  "./문항집.html"
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

/* ── 사이트를 내렸을 때 스스로 물러나기 ────────────────────────────
 * 오프라인 캐시는 한 번 설치되면 기기에 남습니다. 서버에서 이 사이트를
 * 지워도 그 기기에서는 캐시된 화면이 계속 나와서, "되돌렸는데 흔적이 남는"
 * 문제가 생깁니다.
 *
 * 그래서 우리 파일을 부를 때 서버가 "없음(404/410)"이라고 분명히 답하면,
 * 캐시를 지우고 등록을 해제한 뒤 화면을 새로 고칩니다.
 * 인터넷이 끊겨서 못 부른 경우(응답 자체가 없음)와는 구분하므로,
 * 오프라인 동작은 그대로 유지됩니다.
 */
let 물러나는중 = false;

async function 물러나기() {
  if (물러나는중) return;
  물러나는중 = true;              // 이 순간부터 요청에 일절 끼어들지 않습니다
  try { await self.registration.unregister(); } catch (err) {}
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(MINE)).map((k) => caches.delete(k)));
  } catch (err) {}
  try {
    const cs = await self.clients.matchAll({ type: 'window' });
    for (const c of cs) { try { await c.navigate(c.url); } catch (err) {} }
  } catch (err) {}
}

/* 화면을 연 뒤, 뒤에서 조용히 최신본을 받아 캐시를 갱신합니다.
 *
 * 왜 필요한가:
 *   캐시 우선이라 화면은 바로 뜨지만, 누군가 파일만 고치고 캐시 버전을
 *   올리지 않으면 그 기기에서는 옛 화면이 영영 그대로일 수 있습니다.
 *   그래서 열 때마다 한 번 최신본을 확인해 두고, 다음에 열 때 반영합니다.
 *
 * 같은 요청 하나로 "사이트가 지워졌는지"까지 함께 판정합니다.
 *   - 응답이 404/410  → 지워진 것 → 스스로 물러나기
 *   - 응답 자체가 없음 → 인터넷이 끊긴 것 → 아무것도 하지 않음
 */
async function 배경갱신(path, url) {
  if (물러나는중) return;
  let res;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch (err) {
    return;   // 인터넷이 없을 뿐 — 지워진 것이 아닙니다
  }
  if (res && (res.status === 404 || res.status === 410)) {
    // 화면 하나만 없어졌을 수도 있으므로, 첫 화면까지 없을 때만 물러납니다.
    try {
      const 첫화면 = await fetch(new URL('./index.html', self.location.href), { cache: 'no-store' });
      if (첫화면 && (첫화면.status === 404 || 첫화면.status === 410)) await 물러나기();
    } catch (err) {}
    return;
  }
  if (!res || !res.ok || 물러나는중) return;
  try {
    const cache = await caches.open(CACHE);
    if (!물러나는중) await cache.put(path, res.clone());
  } catch (err) {}
}

// 캐시 우선 — 인터넷이 끊겨도, 서버가 없어도 동작합니다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 물러나는 중에는 아무것도 하지 않습니다.
  // (여기서 캐시를 열면 방금 지운 캐시가 빈 채로 다시 만들어집니다.)
  if (물러나는중) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 우리 파일이 아니면 아무것도 하지 않습니다(브라우저가 평소대로 처리).
  const path = ownedPath(url);
  if (!path) return;

  // 화면을 새로 열 때마다 뒤에서 최신본 확인 + 사이트 존재 여부 확인
  if (req.mode === 'navigate') e.waitUntil(배경갱신(path, req.url));

  e.respondWith((async () => {
    // caches.open 은 없으면 새로 만들기 때문에, 읽을 때는 match 만 씁니다.
    const hit = await caches.match(path, { ignoreSearch: true, cacheName: CACHE });
    if (hit) return hit;

    // 캐시에 없으면 네트워크에서 받아 두었다가 다음부터 씁니다.
    try {
      const res = await fetch(req);
      if (res && res.ok && !물러나는중) {
        const cache = await caches.open(CACHE);
        if (!물러나는중) await cache.put(path, res.clone());
      }
      return res;
    } catch (err) {
      if (req.mode === 'navigate') {
        const home = await caches.match(HOME, { ignoreSearch: true, cacheName: CACHE });
        if (home) return home;
      }
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});
