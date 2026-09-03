/* 자정을 넘길 때와, 두 아이가 동시에 누를 때. (조사용)
 *
 * 자정을 왜 보나:
 *   교실 보드는 아침에 켜서 계속 둡니다. 방과후·야간 돌봄이면 자정을 넘깁니다.
 *   시계가 날짜를 못 넘기거나, 타이머가 24:00 을 지나며 음수가 되면
 *   다음 날 아침에 이상한 화면으로 아이들을 맞게 됩니다.
 *
 * 멀티터치를 왜 보나:
 *   65인치 보드 앞에 아이 둘이 서면 동시에 누릅니다.
 *   O 와 X 를 동시에 누르면 어떻게 되는지, 두 번 세어지지는 않는지 봐야 합니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47800);

/* ─────────── 자정 넘기기 ─────────── */
제목('■ 자정을 넘길 때');
알림('브라우저 시계를 23:59:30 으로 맞춰 두고 실제로 1분 넘게 지켜봅니다');

async function 자정열기(길) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, timezoneId: 'Asia/Seoul' });
  /* 페이지가 뜨기 전에 시계를 바꿔 놓습니다 */
  await ctx.addInitScript(() => {
    const 시작 = new Date();
    시작.setHours(23, 59, 30, 0);
    const 기준 = 시작.getTime();
    const 진짜시작 = Date.now();
    const 원래 = Date;
    function 가짜(...a) {
      if (a.length) return new 원래(...a);
      return new 원래(기준 + (원래.now() - 진짜시작));
    }
    가짜.now = () => 기준 + (원래.now() - 진짜시작);
    가짜.parse = 원래.parse; 가짜.UTC = 원래.UTC;
    가짜.prototype = 원래.prototype;
    window.Date = 가짜;
  });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2200);
  return { ctx, page, f: page.frames().length > 1 ? page.frames()[1] : page.mainFrame(), 오류 };
}

/* 세계시간 */
{
  const { ctx, page, f, 오류 } = await 자정열기('/worldclock/');
  const 읽기 = () => f.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const 시각 = (t) => (t.match(/\d{1,2}:\d{2}/g) || []).slice(0, 4);
  const 전 = await 읽기();
  console.log('');
  console.log('   ── 세계시간 ──');
  console.log(`     자정 30초 전: ${시각(전).join('  ')}`);
  await page.waitForTimeout(45000);
  const 후 = await 읽기();
  console.log(`     자정 15초 뒤: ${시각(후).join('  ')}`);
  const 날짜보임 = /\d{1,2}월|\d{1,2}\/\d{1,2}|월요일|화요일|수요일|목요일|금요일|토요일|일요일/.test(후);
  console.log(`     날짜도 보이나: ${날짜보임 ? '보임' : '안 보임(시각만)'}`);
  const 넘어감 = 시각(전)[0] !== 시각(후)[0];
  console.log(`     ${넘어감 ? '✓ 시각이 자정을 넘어 바뀌었습니다' : '✗ 시각이 멈춰 있습니다'}`);
  console.log(`     ${오류.length ? '✗ 오류: ' + 오류.join(' / ') : '✓ 오류 없음'}`);
  await ctx.close();
}

/* 타이머 — 자정을 지나며 계속 세는가 */
{
  const { ctx, page, f, 오류 } = await 자정열기('/timer/');
  const 초 = () => f.evaluate(() => {
    const m = document.body.innerText.replace(/\s+/g, ' ').match(/(\d{1,2}):(\d{2})/);
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  });
  await f.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === '3분'); if (b) b.click(); });
  await page.waitForTimeout(500);
  await f.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === '시작'); if (b) b.click(); });
  const a = await 초();
  console.log('');
  console.log('   ── 타이머 (3분을 걸고 자정을 넘김) ──');
  console.log(`     자정 전: 남은 ${a}초`);
  await page.waitForTimeout(45000);
  const b2 = await 초();
  console.log(`     자정 뒤: 남은 ${b2}초 (45초 지났으니 ${a - 45}초쯤이어야 합니다)`);
  const 정상 = b2 !== null && Math.abs((a - b2) - 45) <= 4 && b2 >= 0;
  console.log(`     ${정상 ? '✓ 자정을 넘어도 그대로 셉니다' : '✗ 어긋났습니다'}`);
  console.log(`     ${오류.length ? '✗ 오류: ' + 오류.join(' / ') : '✓ 오류 없음'}`);
  await ctx.close();
}

/* ─────────── 두 아이가 동시에 ─────────── */
제목('■ 두 아이가 동시에 누를 때 (멀티터치)');
알림('65인치 보드 앞에 둘이 서면 흔히 일어납니다');

{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  await page.goto(서버.주소 + '/quiz/environment/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const f = page.frames()[1];

  const 상태 = () => f.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    const m = t.match(/문제\s*(\d+)\s*\/\s*(\d+)/);
    return { 번호: m ? +m[1] : null, 글: t.slice(0, 90) };
  });

  console.log('');
  console.log('   ── 퀴즈에서 O 와 X 를 «동시에» 누르면 ──');
  const 전 = await 상태();
  /* 손가락 두 개가 동시에 닿는 것을 그대로 흉내 냅니다 */
  const 좌표 = await f.evaluate(() => {
    const o = document.getElementById('btn-choice-o'), x = document.getElementById('btn-choice-x');
    if (!o || !x) return null;
    const a = o.getBoundingClientRect(), b = x.getBoundingClientRect();
    return { ox: a.x + a.width / 2, oy: a.y + a.height / 2, xx: b.x + b.width / 2, xy: b.y + b.height / 2 };
  });
  if (좌표) {
    await f.evaluate((c) => {
      const o = document.getElementById('btn-choice-o');
      const 만들기 = (el, id, x, y) => new Touch({ identifier: id, target: el, clientX: x, clientY: y });
      const t1 = 만들기(document.getElementById('btn-choice-o'), 1, c.ox, c.oy);
      const t2 = 만들기(document.getElementById('btn-choice-x'), 2, c.xx, c.xy);
      const 보내기 = (el, 종류, 목록) => el.dispatchEvent(new TouchEvent(종류, {
        touches: 목록, targetTouches: 목록, changedTouches: 목록, bubbles: true, cancelable: true,
      }));
      보내기(document.getElementById('btn-choice-o'), 'touchstart', [t1, t2]);
      보내기(document.getElementById('btn-choice-o'), 'touchend', [t1, t2]);
      /* 브라우저는 터치 뒤에 click 을 만들어 냅니다 — 둘 다 눌린 것처럼 */
      document.getElementById('btn-choice-o').click();
      document.getElementById('btn-choice-x').click();
    }, 좌표);
    await page.waitForTimeout(1500);
    const 후 = await 상태();
    console.log(`     누르기 전: 문제 ${전.번호}`);
    console.log(`     누른 뒤: ${후.글}`);
    /* 점수가 두 번 오르지 않았는지는 «답한 뒤 잠금» 이 막아 줍니다 */
    const 둘다반영 = /정답입니다.*아쉬|아쉬.*정답입니다/.test(후.글);
    console.log(`     ${둘다반영 ? '✗ O 와 X 가 둘 다 반영됐습니다' : '✓ 하나만 반영됐습니다'}`);
  } else console.log('     (O/X 단추를 못 찾았습니다)');
  console.log(`     ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 오류 없음'}`);
  await ctx.close();
}

/* 그림판에서 두 손가락이 동시에 */
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  await page.goto(서버.주소 + '/paint/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const f = page.frames()[1];
  await f.evaluate(() => { const b = document.getElementById('tool-pen'); if (b) b.click(); });
  await page.waitForTimeout(500);
  const 상자 = await f.locator('canvas').first().boundingBox();

  const 지문 = () => f.evaluate(() => {
    const c = document.querySelector('canvas'); const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data; let h = 0;
    for (let i = 0; i < d.length; i += 4 * 31) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0;
    return h;
  });

  console.log('');
  console.log('   ── 그림판에서 두 손가락이 동시에 그으면 ──');
  const 전 = await 지문();
  /* 두 손가락이 각각 다른 자리에서 동시에 움직입니다 */
  await page.touchscreen.tap(상자.x + 상자.width * 0.3, 상자.y + 상자.height * 0.3);
  await f.evaluate((c) => {
    const cv = document.querySelector('canvas');
    const 만들기 = (id, x, y) => new Touch({ identifier: id, target: cv, clientX: x, clientY: y });
    const 보내기 = (종류, 목록) => cv.dispatchEvent(new TouchEvent(종류, {
      touches: 목록, targetTouches: 목록, changedTouches: 목록, bubbles: true, cancelable: true,
    }));
    let a = [만들기(1, c.x1, c.y1), 만들기(2, c.x2, c.y2)];
    보내기('touchstart', a);
    for (let i = 1; i <= 10; i++) {
      a = [만들기(1, c.x1 + i * 12, c.y1 + i * 8), 만들기(2, c.x2 + i * 12, c.y2 - i * 8)];
      보내기('touchmove', a);
    }
    보내기('touchend', a);
  }, { x1: 200, y1: 500, x2: 600, y2: 900 });
  await page.waitForTimeout(1200);
  const 후 = await 지문();
  console.log(`     두 손가락으로 그은 뒤 화면이 ${후 !== 전 ? '바뀜 ✓' : '그대로'}`);
  console.log(`     ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 오류 없음 (두 손가락에도 안 깨짐)'}`);
  await ctx.close();
}

서버.닫기(); await br.close();
console.log('');
