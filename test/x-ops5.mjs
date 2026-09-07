/* 운영 검수 5 — 보드마다 다른 «설정» 때문에 생기는 일들. (조사용)
 *
 *   ① 선생님이 마이크 권한을 «차단» 눌렀을 때   (없는 것과 다릅니다)
 *   ② 보드 시간대가 한국이 아닐 때              (공장 초기값이 UTC 인 보드가 있습니다)
 *   ③ 소리가 실제로 나는가                       (브라우저는 «누르기 전» 소리를 막습니다)
 *   ④ 화면 파일 하나가 빠졌을 때                 (USB 로 옮기다 하나 빠지는 일)
 *
 * 쓰는 법: node test/x-ops5.mjs
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 루트, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const 서버 = await 서버띄우기(47870);

async function 열기(ctx, 길, 기다림 = 2500) {
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 70)));
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(기다림);
  return { page, f: page.frames().length > 1 ? page.frames()[1] : page.mainFrame(), 오류 };
}
const 글 = (f) => f.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim());

/* ══════ ① 마이크를 «차단» 했을 때 ══════ */
제목('■ ① 선생님이 마이크 권한 창에서 «차단» 을 눌렀을 때');
알림('«마이크가 없는 것» 과 다릅니다. 한 번 차단하면 브라우저가 다시 묻지도 않습니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  /* 브라우저가 «사용자가 차단함» 으로 답하는 상황을 그대로 만듭니다 */
  await ctx.addInitScript(() => {
    const 거절 = () => Promise.reject(Object.assign(new DOMException('Permission denied', 'NotAllowedError')));
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = 거절;
    navigator.getUserMedia = (c, ok, no) => no(new DOMException('Permission denied', 'NotAllowedError'));
  });
  const { page, f, 오류 } = await 열기(ctx, '/noise/', 3000);
  const 처음 = await 글(f);
  console.log('');
  console.log(`   화면에 나온 말: ${처음.slice(0, 120)}`);
  /* 「눌러서 켜기」를 눌러 봅니다 */
  const 눌렀나 = await f.evaluate(() => {
    const b = [...document.querySelectorAll('button, [role="button"]')].find((x) => /켜기|시작|측정/.test(x.innerText || ''));
    if (!b) return false; b.click(); return true;
  });
  await page.waitForTimeout(2500);
  const 나중 = await 글(f);
  console.log(`   「켜기」 단추: ${눌렀나 ? '눌렀습니다' : '못 찾았습니다'}`);
  console.log(`   누른 뒤 화면: ${나중.slice(0, 120)}`);
  const 안내있나 = /마이크|권한|허용|차단|예시/.test(나중);
  console.log(`   ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 자바스크립트 오류 없음 (안 죽습니다)'}`);
  console.log(`   ${안내있나 ? '· 마이크 이야기는 화면에 나옵니다' : '✗ 왜 안 되는지 화면에 아무 말이 없습니다'}`);
  console.log(`   ${처음 === 나중 ? '· 눌러도 화면이 그대로입니다 (검수 대장 L 과 같은 상황)' : '· 누르면 화면이 바뀝니다'}`);
  await ctx.close();
}

/* ══════ ② 보드 시간대가 한국이 아닐 때 ══════ */
제목('■ ② 보드 시간대가 한국이 아닐 때');
알림('인터넷이 막힌 보드는 공장 초기값(UTC)이나 엉뚱한 시간대로 남아 있기도 합니다');
{
  for (const 지역 of ['Asia/Seoul', 'UTC', 'America/New_York']) {
    const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, timezoneId: 지역 });
    const { page, f, 오류 } = await 열기(ctx, '/worldclock/', 3000);
    const t = await 글(f);
    /* 도시 이름과 그 옆의 시각을 짝지어 읽습니다 */
    const 짝 = [...t.matchAll(/(서울|도쿄|베이징|런던|파리|뉴욕|시드니|로스앤젤레스)[^\d]{0,12}(\d{1,2}:\d{2})/g)]
      .map((m) => `${m[1]} ${m[2]}`);
    console.log('');
    console.log(`   ── 보드 시간대가 ${지역} 일 때 ──`);
    console.log(`     ${짝.slice(0, 6).join('  ·  ') || '(도시·시각을 못 읽었습니다) ' + t.slice(0, 80)}`);
    console.log(`     ${오류.length ? '✗ 오류: ' + 오류[0] : '✓ 오류 없음'}`);
    await ctx.close();
  }
  console.log('');
  알림('세 줄의 «도시별 시각 차이» 가 같으면, 보드 시간대와 무관하게 계산한다는 뜻입니다');
}

/* ══════ ③ 소리가 실제로 나는가 ══════ */
제목('■ ③ 소리가 실제로 나는가');
알림('브라우저는 사람이 한 번도 안 누른 화면에서는 소리를 막습니다. 그래서 실제로 세어 봅니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  await ctx.addInitScript(() => {
    window.__소리 = { 만든것: 0, 상태: [], 재생시도: 0, 막힘: 0, 성공: 0 };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      window.AudioContext = function (...a) {
        const c = new AC(...a);
        window.__소리.만든것++;
        window.__소리.상태.push(c.state);
        return c;
      };
      window.AudioContext.prototype = AC.prototype;
      window.webkitAudioContext = window.AudioContext;
    }
    const 원래 = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) {
      window.__소리.재생시도++;
      const p = 원래.apply(this, a);
      if (p && p.catch) p.then(() => window.__소리.성공++).catch(() => window.__소리.막힘++);
      return p;
    };
  });
  const 재기 = (f) => f.evaluate(() => window.__소리 || (window.top && window.top.__소리) || null);

  /* 사람이 아무것도 안 눌렀을 때 */
  const q = await 열기(ctx, '/quiz/environment/', 3000);
  const 전 = await 재기(q.f);
  console.log('');
  console.log(`   아무것도 안 눌렀을 때: 소리틀 ${전 ? 전.만든것 : '?'}개(${전 ? 전.상태.join(',') : ''}) · 재생시도 ${전 ? 전.재생시도 : '?'} · 막힘 ${전 ? 전.막힘 : '?'}`);

  /* 사람이 한 번 누른 뒤 */
  await q.f.evaluate(() => { const o = document.getElementById('btn-choice-o'); if (o) o.click(); });
  await q.page.waitForTimeout(2500);
  const 후 = await 재기(q.f);
  console.log(`   답을 한 번 누른 뒤:   소리틀 ${후 ? 후.만든것 : '?'}개(${후 ? 후.상태.join(',') : ''}) · 재생시도 ${후 ? 후.재생시도 : '?'} · 성공 ${후 ? 후.성공 : '?'} · 막힘 ${후 ? 후.막힘 : '?'}`);
  const 막힌게있나 = 후 && (후.막힘 > 0 || 후.상태.includes('suspended'));
  console.log(`   ${!후 ? '· 소리 쓰는 곳을 못 찾았습니다 (효과음이 없는 화면일 수 있습니다)'
    : 막힌게있나 ? '⚠ 브라우저가 소리를 막은 흔적이 있습니다 — 보드에서 확인이 필요합니다'
      : '✓ 막힌 흔적 없음'}`);
  await ctx.close();
}

/* ══════ ④ 화면 파일 하나가 빠졌을 때 ══════ */
제목('■ ④ 옮기다가 화면 파일 하나가 빠졌을 때');
알림('USB 로 폴더째 옮기다 하나가 안 따라오는 일이 있습니다. 그때 무엇이 보이는지');
{
  /* 파일 하나만 «없음» 으로 돌려주는 서버를 따로 띄웁니다 */
  const 종류 = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css',
    '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json',
  };
  let 뺄것 = null;
  const s2 = http.createServer((q, res) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    if (뺄것 && u.endsWith(뺄것)) { res.writeHead(404); return res.end(); }
    let p = path.join(루트, u);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 종류[path.extname(p).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(p));
  });
  await new Promise((r) => s2.listen(47871, r));

  const 목록 = fs.readdirSync(path.join(루트, 'timer', 'assets'));
  const js = 목록.find((n) => n.endsWith('.js'));
  const css = 목록.find((n) => n.endsWith('.css'));

  for (const [이름, 파일] of [['그림·모양 파일(css)', css], ['화면을 그리는 파일(js)', js]]) {
    if (!파일) continue;
    뺄것 = '/timer/assets/' + 파일;
    const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
    const page = await ctx.newPage();
    const 오류 = [];
    page.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 50)));
    await page.goto('http://127.0.0.1:47871/timer/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);
    const f = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();
    const t = await 글(f).catch(() => '');
    const 단추 = await f.evaluate(() => document.querySelectorAll('button').length).catch(() => 0);
    console.log('');
    console.log(`   ── ${이름} 이 빠졌을 때 (${파일}) ──`);
    console.log(`     화면 글자: ${t ? '"' + t.slice(0, 60) + '"' : '(아무것도 없음 — 하얀 화면)'} · 단추 ${단추}개`);
    console.log(`     ${t.length > 5 ? '· 뭔가는 보입니다' : '✗ 하얀 화면입니다. 왜 그런지 알려 주는 말이 없습니다'}`);
    await ctx.close();
  }
  s2.close();
}

서버.닫기(); await br.close();
console.log('');
