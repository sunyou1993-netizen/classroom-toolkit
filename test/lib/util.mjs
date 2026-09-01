/* 검사 도구들이 함께 쓰는 것들 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import url, { fileURLToPath } from 'url';

export const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 루트 = path.resolve(여기, '..', '..');      // 저장소 루트
export const 퀴즈 = fs.existsSync(path.join(루트, 'quiz')) ? path.join(루트, 'quiz') : 루트;

/* ── 결과 모으기 ────────────────────────────────────── */
let 통과 = 0, 실패 = 0;
const 실패목록 = [];

export function 확인(설명, 조건, 덧붙임) {
  if (조건) { 통과++; console.log(`   ✓ ${설명}`); }
  else {
    실패++; 실패목록.push(설명);
    console.log(`   ✗ ${설명}`);
    if (덧붙임) String(덧붙임).split('\n').forEach((l) => console.log(`       ${l}`));
  }
}
export function 알림(글) { console.log(`   · ${글}`); }
export function 제목(글) { console.log(`\n${글}`); }

export function 마무리(이름) {
  console.log(`\n${'─'.repeat(58)}`);
  if (실패) {
    console.log(`${이름}: ${통과}개 통과, ${실패}개 실패 ✗`);
    실패목록.forEach((x) => console.log(`   ✗ ${x}`));
    process.exit(1);
  }
  console.log(`${이름}: ${통과}개 모두 통과 ✓`);
  process.exit(0);
}

/* ── 파일 도우미 ────────────────────────────────────── */
export const 읽기 = (p) => fs.readFileSync(p, 'utf8');
export const 있나 = (p) => fs.existsSync(p);
export function 번들찾기(폴더) {
  const d = path.join(폴더, 'assets');
  if (!fs.existsSync(d)) return null;
  const f = fs.readdirSync(d).filter((n) => n.endsWith('.js'))[0];
  return f ? path.join(d, f) : null;
}

/* ── 문항 읽기 ──────────────────────────────────────── */
export function 원본문항(갈래) {
  const p = path.join(퀴즈, 'scripts', 'questions', `${갈래}.json`);
  const j = JSON.parse(읽기(p));
  return Array.isArray(j) ? j : Object.values(j).find(Array.isArray);
}
export function 번들문항(갈래) {
  const f = 번들찾기(path.join(퀴즈, 갈래));
  if (!f) return [];
  const s = 읽기(f);
  return [...s.matchAll(/\{id:(\d+),question:"((?:[^"\\]|\\.)*)",answer:"([OX])",explanation:"((?:[^"\\]|\\.)*)"\}/g)]
    .map((m) => ({ id: +m[1], q: JSON.parse(`"${m[2]}"`), ans: m[3], exp: JSON.parse(`"${m[4]}"`) }));
}

/* ── 잠깐 띄우는 웹서버 (브라우저 검사용) ────────────── */
const 종류 = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
export async function 서버띄우기(포트 = 47311) {
  const s = http.createServer((q, res) => {
    let p = path.join(루트, decodeURIComponent(q.url.split('?')[0]));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 종류[path.extname(p).toLowerCase()] || 'application/octet-stream' });
    res.end(fs.readFileSync(p));
  });
  await new Promise((r) => s.listen(포트, r));
  return { 주소: `http://127.0.0.1:${포트}`, 닫기: () => s.close() };
}

/* ── 브라우저 (없으면 알려 주고 건너뜁니다) ──────────── */
export async function 브라우저열기() {
  let pw = null;
  const 후보모듈 = ['playwright', 'playwright-core'];
  for (const m of 후보모듈) { try { pw = await import(m); break; } catch { /* 다음 */ } }
  if (!pw) {
    /* 전역(global)으로 깔린 경우도 찾아 봅니다 */
    const 전역 = [process.env.PLAYWRIGHT_DIR, ...(process.env.NODE_PATH || '').split(path.delimiter)]
      .filter(Boolean)
      .flatMap((d) => 후보모듈.map((m) => path.join(d, m, 'index.js')));
    for (const p2 of 전역) {
      try { if (fs.existsSync(p2)) { pw = await import(url.pathToFileURL(p2).href); break; } } catch { /* 다음 */ }
    }
  }
  if (!pw) return null;
  /* 전역에서 파일로 불러온 경우 실제 내용이 default 안에 들어 있습니다 */
  const 크로미움 = pw.chromium || (pw.default && pw.default.chromium);
  if (!크로미움) return null;
  const 후보 = [
    process.env.CHROME_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const exe = 후보.find((p) => { try { return fs.existsSync(p); } catch { return false; } });
  try {
    return await 크로미움.launch(exe
      ? { executablePath: exe, args: ['--no-sandbox'] }
      : { args: ['--no-sandbox'] });
  } catch { return null; }
}
export function 브라우저없음안내() {
  console.log('   (건너뜀) 이 검사는 브라우저가 필요합니다.');
  console.log('   준비하려면:  npm i -D playwright && npx playwright install chromium');
}
