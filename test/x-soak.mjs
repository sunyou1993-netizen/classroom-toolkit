/* 두 가지를 봅니다. (조사용)
 *  1) 퀴즈를 풀던 중에 새로고침하면 어떻게 되나
 *  2) 하루 종일 켜 두면 점점 무거워지나 (화면을 60번 열고 닫으며 메모리를 잽니다)
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47380);

/* ───────── 1) 풀던 중에 새로고침 ───────── */
제목('■ 퀴즈를 풀던 중에 새로고침하면');
알림('보드는 터치라 실수로 화면을 다시 부르는 일이 생깁니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  await page.goto(서버.주소 + '/quiz/environment/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  let f = page.frames()[1];

  // 시작해서 3문제를 풉니다
  await f.locator('button:has-text("시작")').first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
  /* 「문제 N / 10」 과 문제 글을 읽는 도우미 */
  const 읽기 = async (fr) => fr.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    const m = t.match(/문제\s*(\d+)\s*\/\s*(\d+)/);
    const q = t.match(/"([^"]{10,})"/);
    const 시 = t.match(/(\d\d:\d\d)/);
    return { 번호: m ? +m[1] : null, 전체: m ? +m[2] : null, 문제: q ? q[1].slice(0, 40) : '', 시간: 시 ? 시[1] : '' };
  });

  let 푼개수 = 0;
  for (let i = 0; i < 3; i++) {
    /* O·X 는 글자가 아니라 그림 단추일 수 있으므로 여러 방법으로 찾습니다 */
    const 후보 = ['button:has-text("O")', 'button[aria-label*="O"]', '[role=button]:has-text("O")',
      'button img', 'button svg'];
    let 눌렀나 = false;
    for (const sel of 후보) {
      const b = f.locator(sel).first();
      if (await b.count()) { await b.click({ timeout: 4000 }).then(() => { 눌렀나 = true; }).catch(() => {}); }
      if (눌렀나) break;
    }
    if (!눌렀나) break;
    await page.waitForTimeout(1300);
    const 다음 = f.locator('button:has-text("다음")').first();
    if (await 다음.count()) { await 다음.click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(1000); }
    푼개수++;
  }
  const 전 = await 읽기(f);
  알림(`${푼개수}문제를 눌러 봤습니다 → 지금: 문제 ${전.번호}/${전.전체}, 남은시간 ${전.시간}`);
  알림(`   지금 문제: "${전.문제}…"`);

  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  f = page.frames()[1];
  const 후 = await 읽기(f);
  알림(`새로고침 뒤: 문제 ${후.번호}/${후.전체}, 남은시간 ${후.시간}`);
  알림(`   지금 문제: "${후.문제}…"`);

  const 같은자리 = 전.번호 !== null && 후.번호 === 전.번호 && 후.문제 === 전.문제;
  console.log(`   ${같은자리
    ? '✓ 풀던 자리와 문제를 그대로 기억합니다'
    : '⚠ 처음부터 다시 시작합니다 — 풀던 것도, 남은 시간도 초기화됩니다'}`);
  if (!같은자리 && 전.문제 && 후.문제 && 전.문제 !== 후.문제) {
    알림('문제 순서도 매번 섞이므로, 같은 문제로 이어지지도 않습니다');
  }

  // 브라우저 뒤로가기
  await page.goBack({ waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(1500);
  const 뒤로 = await page.evaluate(() => document.title + ' | ' + location.pathname);
  알림(`뒤로가기를 누르면: ${뒤로}`);
  await ctx.close();
}

/* ───────── 2) 하루 종일 켜 두기 ───────── */
제목('■ 하루 종일 켜 두면 무거워지나');
알림('한 창에서 화면 10개를 6바퀴(60번) 열고 닫으며 메모리를 잽니다');
{
  const 돌것 = ['/timer/', '/pomodoro/', '/stopwatch/', '/worldclock/', '/paint/',
    '/noise/', '/picker/', '/instruments/', '/ladder/', '/index.html'];
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');          // ← 이걸 먼저 켜야 숫자가 나옵니다
  await cdp.send('HeapProfiler.enable').catch(() => {});
  const 잰것 = [];
  console.log('');
  console.log('   바퀴   메모리    DOM 조각   듣고있는 것');
  console.log('   ' + '─'.repeat(44));
  for (let 바퀴 = 1; 바퀴 <= 6; 바퀴++) {
    for (const 길 of 돌것) {
      await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(280);
    }
    await page.goto(서버.주소 + '/index.html', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(600);
    await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
    await page.waitForTimeout(400);
    const m = await cdp.send('Performance.getMetrics');
    const 값 = Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
    if (바퀴 === 1 && !값.JSHeapUsedSize) {
      console.log('   ⚠ 메모리 숫자를 읽지 못했습니다. 이 결과는 믿으면 안 됩니다.');
    }
    const MB = (값.JSHeapUsedSize || 0) / 1048576;
    잰것.push({ 바퀴, MB, 노드: 값.Nodes || 0, 듣기: 값.JSEventListeners || 0 });
    console.log(`   ${String(바퀴).padStart(3)}   ${MB.toFixed(1).padStart(6)}MB ${String(값.Nodes || 0).padStart(9)} ${String(값.JSEventListeners || 0).padStart(12)}`);
  }
  await ctx.close();

  const 첫 = 잰것[1] || 잰것[0];      // 첫 바퀴는 준비 과정이 섞이므로 두 번째부터
  const 끝 = 잰것[잰것.length - 1];
  const 늘어난 = 끝.MB - 첫.MB;
  const 비율 = 첫.MB ? (늘어난 / 첫.MB) * 100 : 0;
  console.log('');
  알림(`2바퀴 ${첫.MB.toFixed(1)}MB → 6바퀴 ${끝.MB.toFixed(1)}MB  (${늘어난 >= 0 ? '+' : ''}${늘어난.toFixed(1)}MB, ${비율.toFixed(0)}%)`);
  if (늘어난 > 첫.MB * 0.5 && 늘어난 > 5) {
    console.log('   ⚠ 열고 닫을수록 메모리가 계속 늘어납니다 (하루 종일 켜 두면 느려질 수 있습니다)');
  } else {
    console.log('   ✓ 반복해서 열고 닫아도 메모리가 계속 늘지는 않습니다');
  }
  const 노드늘음 = 끝.노드 - 첫.노드;
  console.log(`   ${노드늘음 > 첫.노드 * 0.5 ? '⚠' : '✓'} 화면 조각(DOM) ${첫.노드} → ${끝.노드}`);
}

서버.닫기(); await br.close();
