/* 새 판을 보냈을 때, 브라우저에 남아 있는 «오프라인 캐시» 때문에
 * 옛 화면이 계속 보이지는 않는가. (조사용)
 *
 * 왜 이것을 보나:
 *   7차에서 «판 번호가 같으면 새 exe 를 눌러도 옛 화면이 그대로» 를 잡아
 *   빌드 때 판 번호를 다시 찍도록 고쳤습니다. 그건 exe 쪽 이야기입니다.
 *
 *   브라우저 쪽에도 같은 위험이 있습니다. 이 프로그램은 인터넷 없이도 되도록
 *   화면을 브라우저 안에 통째로 저장해 둡니다(오프라인 캐시).
 *   저장해 둔 것을 먼저 보여 주기 때문에, 새 판을 깔아도 «저장해 둔 옛 화면» 이
 *   먼저 나올 수 있습니다. 몇 번을 열어야 새 화면이 나오는지가 중요합니다.
 *   선생님한테 «업데이트하면 한 번 더 열어 주세요» 라고 말해야 할지 아닌지가
 *   여기서 갈립니다.
 *
 * 어떻게 보나:
 *   같은 파일을 주면서 index.html 의 제목과 캐시 판 번호만 A → B 로 바꾸고,
 *   화면을 몇 번 다시 열어야 B 가 나오는지 셉니다. (실제 업데이트와 같은 모양입니다)
 *
 * 쓰는 법: node test/x-swupdate.mjs
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { 브라우저열기, 브라우저없음안내, 루트, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }

/* ── 판을 바꿔 가며 주는 작은 웹서버 ── */
let 판 = 'A';
const 종류 = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
const 서버 = http.createServer((q, res) => {
  let p = path.join(루트, decodeURIComponent(q.url.split('?')[0]));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  let 몸 = fs.readFileSync(p);
  const 상대 = path.relative(루트, p).split(path.sep).join('/');
  if (상대 === 'index.html') {
    몸 = Buffer.from(String(몸).replace(/<title>[^<]*<\/title>/, `<title>수업도우미 ${판}판</title>`));
  } else if (상대 === 'sw.js') {
    /* 실제 업데이트처럼 캐시 판 번호도 같이 올립니다 */
    몸 = Buffer.from(String(몸).replace(/suup-doumi-[a-f0-9]+/g, 판 === 'A' ? 'suup-doumi-aaaaaaaaaaaa' : 'suup-doumi-bbbbbbbbbbbb'));
  }
  res.writeHead(200, { 'content-type': 종류[path.extname(p).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(몸);
});
await new Promise((r) => 서버.listen(47850, r));
const 주소 = 'http://127.0.0.1:47850';

const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await ctx.newPage();
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const 캐시목록 = () => page.evaluate(() => caches.keys());
const 서비스워커 = () => page.evaluate(async () => {
  const rs = await navigator.serviceWorker.getRegistrations();
  return rs.map((r) => (r.active && r.active.scriptURL ? '켜짐' : '준비중')).join(',') || '없음';
});

제목('■ 새 판을 보냈을 때 브라우저 캐시가 옛 화면을 붙들지 않는가');
알림('A판을 깔아 캐시를 만든 뒤, 서버가 주는 것만 B판으로 바꿔 봅니다');

/* ① A판 설치 */
await page.goto(주소 + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1200);
/* 오프라인 캐시가 다 채워질 때까지 기다립니다 */
for (let i = 0; i < 40; i++) {
  const ks = await 캐시목록();
  if (ks.length) { await 잠깐(2500); break; }
  await 잠깐(500);
}
console.log('');
console.log(`   ① A판을 열었습니다 — 제목 «${await page.title()}»`);
console.log(`      오프라인 캐시: ${(await 캐시목록()).join(', ') || '(아직 없음)'} · 서비스워커: ${await 서비스워커()}`);

/* ② 캐시만으로도 되는지 (서버를 잠시 막아 봅니다) */
await page.context().setOffline(true);
await page.reload({ waitUntil: 'load' }).catch(() => { });
await page.waitForTimeout(1500);
console.log(`   ② 인터넷을 끊고 열어도 — 제목 «${await page.title()}» (캐시가 살아 있다는 뜻입니다)`);
await page.context().setOffline(false);

/* ③ 서버를 B판으로 바꿉니다 = 학교에 새 exe 를 보낸 상황 */
판 = 'B';
console.log('');
console.log('   ③ 서버가 주는 것을 B판으로 바꿨습니다 (= 새 판을 깔았습니다)');
for (let 번 = 1; 번 <= 4; 번++) {
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const 제 = await page.title();
  console.log(`      ${번}번째로 다시 열었을 때 — 제목 «${제}» · 캐시 ${(await 캐시목록()).join(',')}`);
  if (/B판/.test(제)) { console.log(`      → ${번}번 만에 새 판이 나왔습니다`); break; }
  if (번 === 4) console.log('      → ✗ 네 번을 열어도 옛 판이 그대로입니다');
}

/* ④ 옛 캐시가 지워졌는가 (안 지워지면 보드 저장 공간이 계속 불어납니다) */
const 남은 = await 캐시목록();
console.log('');
console.log(`   ④ 남아 있는 오프라인 캐시: ${남은.join(', ')}`);
const 옛것 = 남은.filter((k) => k.includes('aaaaaaaaaaaa'));
console.log(`      ${옛것.length === 0 ? '✓ 옛 캐시는 지워졌습니다 (저장 공간이 쌓이지 않습니다)' : '✗ 옛 캐시가 남아 있습니다: ' + 옛것.join(', ')}`);

/* ⑤ 새 판도 인터넷 없이 되는가 */
await page.context().setOffline(true);
await page.reload({ waitUntil: 'load' }).catch(() => { });
await page.waitForTimeout(1500);
const 끝제목 = await page.title();
console.log(`   ⑤ 새 판을 인터넷 끊고 열어도 — 제목 «${끝제목}»`);
console.log(`      ${/B판/.test(끝제목) ? '✓ 새 판이 오프라인으로도 남았습니다' : '✗ 새 판이 오프라인에서 안 나옵니다'}`);
await page.context().setOffline(false);

서버.close(); await br.close();
console.log('');
