/* 운영 검수 2 — 설치가 끝난 뒤, 교실에서 몇 달 굴러가는 동안 생기는 일들. (조사용)
 *
 * 1차~7차에서 본 것: 화면 동작 · 성능 · 오프라인 · 키오스크 · 여러 학교 배포 ·
 *                    실행 파일 운영 · 자정 · 멀티터치
 *
 * 여기서 새로 보는 것 — 전부 «설치 뒤 몇 달» 의 이야기입니다:
 *   ① 선생님이 탭을 여러 개 열어 둔다            (하나 켜고 또 켜고, 안 닫습니다)
 *   ② 화면 한가운데서 새로고침한다               (멈춘 것 같으면 누르는 버릇)
 *   ③ 브라우저 저장 공간이 꽉 찬다               (몇 달 쌓이면 실제로 찹니다)
 *   ④ 보드 시계가 몇 년 틀려 있다                (교실망은 시간 서버가 없는 곳이 많습니다)
 *   ⑤ 보드가 아니라 선생님 노트북·태블릿에서 연다
 *   ⑥ 다른 탭을 보다가 한참 만에 돌아온다        (타이머가 맞을까)
 *   ⑦ 선생님이 인쇄를 누른다
 *
 * 쓰는 법: node test/x-ops2.mjs
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47820);
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

/* 화면 하나를 여는 공통 절차. 안쪽 iframe 까지 잡아 줍니다. */
async function 열기(ctx, 길, 기다림 = 2500) {
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 70)));
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(기다림);
  const f = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();
  return { page, f, 오류 };
}
const 글 = (f) => f.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim());

/* ══════════════ ① 탭을 여러 개 열어 두면 ══════════════ */
제목('■ ① 선생님이 탭을 여러 개 열어 둘 때');
알림('한 화면 쓰다가 다른 화면을 또 열고, 앞의 탭은 안 닫습니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const 길들 = ['/', '/timer/', '/quiz/environment/', '/paint/', '/picker/'];
  const 연것 = [];
  for (const 길 of 길들) 연것.push({ 길, ...(await 열기(ctx, 길)) });

  console.log('');
  console.log('   ── 다섯 화면을 한꺼번에 열어 둔 채 ──');
  let 나쁨 = 0;
  for (const t of 연것) {
    const s = (await 글(t.f)).length;
    const 산다 = s > 20 && t.오류.length === 0;
    if (!산다) 나쁨++;
    console.log(`     ${t.길.padEnd(22)} 글자 ${String(s).padStart(4)}자  ${t.오류.length ? '✗ ' + t.오류[0] : '✓'}`);
  }
  console.log(`     ${나쁨 === 0 ? '✓ 다섯 개를 동시에 열어 두어도 다 멀쩡합니다' : `✗ ${나쁨}개가 이상합니다`}`);

  /* 같은 화면을 두 탭에 — 서로 영향을 주는가 */
  console.log('');
  console.log('   ── 같은 «타이머» 를 두 탭에 열고 각각 다르게 맞추면 ──');
  const a = await 열기(ctx, '/timer/');
  const b = await 열기(ctx, '/timer/');
  const 누르기 = (f, 이름) => f.evaluate((n) => {
    const btn = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === n);
    if (btn) btn.click();
    return !!btn;
  }, 이름);
  await 누르기(a.f, '3분'); await 잠깐(400);
  await 누르기(b.f, '5분'); await 잠깐(400);
  const 남은 = (f) => f.evaluate(() => {
    const m = (document.body.innerText || '').match(/(\d{1,2}):(\d{2})/);
    return m ? m[0] : '(못 읽음)';
  });
  await a.page.bringToFront(); await 잠깐(300);
  const A = await 남은(a.f);
  await b.page.bringToFront(); await 잠깐(300);
  const B = await 남은(b.f);
  console.log(`     첫 탭(3분으로 맞춤): ${A}   ·   둘째 탭(5분으로 맞춤): ${B}`);
  console.log(`     ${A !== B ? '✓ 탭마다 따로 셉니다 (서로 안 건드립니다)' : '✗ 두 탭이 서로 값을 덮어씁니다'}`);
  await ctx.close();
}

/* ══════════════ ② 한가운데서 새로고침 ══════════════ */
제목('■ ② 화면 한가운데서 새로고침을 누를 때');
알림('«멈춘 것 같으면 새로고침» 은 선생님들이 가장 많이 하는 동작입니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });

  /* 퀴즈를 세 문제 풀다가 */
  const q = await 열기(ctx, '/quiz/environment/');
  const 시작 = await q.f.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /시작|퀴즈/.test(x.innerText));
    if (b) { b.click(); return true; } return false;
  });
  await q.page.waitForTimeout(2000);
  /* 답을 고르면 풀이가 뜨고, «다음 문제» 를 눌러야 넘어갑니다 (저절로 안 넘어갑니다) */
  for (let i = 0; i < 3; i++) {
    await q.f.evaluate(() => { const o = document.getElementById('btn-choice-o'); if (o) o.click(); });
    await q.page.waitForTimeout(1400);
    await q.f.evaluate(() => { const n = document.getElementById('btn-next-q'); if (n) n.click(); });
    await q.page.waitForTimeout(1400);
  }
  const 전 = await 글(q.f);
  const 전번호 = (전.match(/문제\s*(\d+)\s*\/\s*(\d+)/) || [])[0] || '(못 읽음)';
  const 전점수 = (전.match(/(\d+)\s*점/) || [])[0] || '(점수 안 보임)';
  console.log('');
  console.log('   ── 퀴즈를 세 문제 풀고 나서 새로고침 ──');
  console.log(`     새로고침 전: ${전번호} · ${전점수}`);
  await q.page.reload({ waitUntil: 'load' });
  await q.page.waitForTimeout(2500);
  const f2 = q.page.frames().length > 1 ? q.page.frames()[1] : q.page.mainFrame();
  const 후 = await 글(f2);
  const 쓸수있나 = await f2.evaluate(() => document.querySelectorAll('button').length > 0);
  console.log(`     새로고침 뒤: ${후.slice(0, 60)}`);
  console.log(`     단추가 있나: ${쓸수있나 ? '있음' : '없음'} · 오류: ${q.오류.length ? '✗ ' + q.오류[0] : '없음 ✓'}`);
  console.log(`     ${쓸수있나 && !q.오류.length ? '✓ 처음 화면으로 돌아가 다시 쓸 수 있습니다 (푼 문제는 사라집니다)' : '✗ 새로고침 뒤 못 쓰게 됩니다'}`);

  /* 타이머가 돌아가는 중에 */
  const t = await 열기(ctx, '/timer/');
  await t.f.evaluate(() => {
    const g = (n) => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === n);
    (g('3분') || {}).click?.(); setTimeout(() => (g('시작') || {}).click?.(), 200);
  });
  await t.page.waitForTimeout(3000);
  const t전 = await 남은글(t.f);
  await t.page.reload({ waitUntil: 'load' });
  await t.page.waitForTimeout(2200);
  const tf = t.page.frames().length > 1 ? t.page.frames()[1] : t.page.mainFrame();
  const t후 = await 남은글(tf);
  const t쓸수 = await tf.evaluate(() => document.querySelectorAll('button').length > 0);
  console.log('');
  console.log('   ── 타이머가 돌아가는 중에 새로고침 ──');
  console.log(`     새로고침 전: ${t전}   →   뒤: ${t후}`);
  console.log(`     ${t쓸수 ? '✓ 다시 맞춰 쓸 수 있습니다 (세던 것은 초기화됩니다)' : '✗ 새로고침 뒤 못 쓰게 됩니다'}`);
  await ctx.close();
}
async function 남은글(f) {
  return f.evaluate(() => {
    const m = (document.body.innerText || '').match(/(\d{1,2}):(\d{2})/);
    return m ? m[0] : '(시간 표시 없음)';
  });
}

/* ══════════════ ③ 저장 공간이 꽉 찼을 때 ══════════════ */
제목('■ ③ 브라우저 저장 공간이 꽉 찼을 때');
알림('보드 한 대를 몇 달 안 지우면 실제로 찹니다. 꽉 차면 저장 명령이 오류를 냅니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  /* 화면이 뜨기 전에 저장 공간을 가득 채워 둡니다 */
  await ctx.addInitScript(() => {
    try {
      const 덩어리 = 'x'.repeat(200000);
      for (let i = 0; i < 500; i++) localStorage.setItem('__꽉__' + i, 덩어리);
    } catch (e) { /* 다 차면 여기로 옵니다 — 그게 목적입니다 */ }
  });
  console.log('');
  console.log('   ── 저장 공간을 가득 채운 뒤 화면 열기 ──');
  let 죽은화면 = 0;
  for (const 길 of ['/', '/timer/', '/paint/', '/quiz/', '/quiz/environment/', '/picker/']) {
    const { page, f, 오류 } = await 열기(ctx, 길, 2200);
    const s = (await 글(f)).length;
    const 산다 = s > 20;
    if (!산다) 죽은화면++;
    console.log(`     ${길.padEnd(22)} 글자 ${String(s).padStart(4)}자  ${오류.length ? '✗ ' + 오류[0] : '✓ 오류 없음'}`);
    await page.close();
  }
  console.log(`     ${죽은화면 === 0 ? '✓ 저장 공간이 꽉 차도 화면은 뜹니다' : `✗ ${죽은화면}개 화면이 하얗게 뜹니다`}`);
  await ctx.close();
}

/* ══════════════ ④ 보드 시계가 몇 년 틀려 있을 때 ══════════════ */
제목('■ ④ 보드 시계가 몇 년 틀려 있을 때');
알림('인터넷이 막힌 교실망에서는 보드 시계가 공장 출하 날짜에 멈춰 있기도 합니다');
{
  for (const [이름, 날짜] of [['2년 뒤(2028-06-15)', '2028-06-15T10:20:00'], ['6년 전(2020-01-01)', '2020-01-01T09:00:00']]) {
    const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, timezoneId: 'Asia/Seoul' });
    await ctx.addInitScript((iso) => {
      const 기준 = new Date(iso).getTime(); const 진짜 = Date.now(); const 원래 = Date;
      function 가짜(...a) { return a.length ? new 원래(...a) : new 원래(기준 + (원래.now() - 진짜)); }
      가짜.now = () => 기준 + (원래.now() - 진짜);
      가짜.parse = 원래.parse; 가짜.UTC = 원래.UTC; 가짜.prototype = 원래.prototype;
      window.Date = 가짜;
    }, 날짜);
    console.log('');
    console.log(`   ── 보드 시계가 ${이름} 일 때 ──`);
    let 탈 = 0;
    for (const 길 of ['/', '/worldclock/', '/timer/', '/quiz/']) {
      const { page, f, 오류 } = await 열기(ctx, 길, 2200);
      const t = await 글(f);
      const 시각 = (t.match(/\d{1,2}:\d{2}/g) || []).slice(0, 3).join(' ');
      const 이상 = /NaN|Invalid|undefined/.test(t);
      if (이상 || 오류.length) 탈++;
      console.log(`     ${길.padEnd(14)} ${시각 || '(시각 표시 없음)'}  ${이상 ? '✗ NaN/Invalid 가 보입니다' : 오류.length ? '✗ ' + 오류[0] : '✓'}`);
      await page.close();
    }
    console.log(`     ${탈 === 0 ? '✓ 시계가 틀려도 화면은 정상입니다 (보이는 시각만 틀립니다)' : `✗ ${탈}개 화면이 깨집니다`}`);
    await ctx.close();
  }
}

/* ══════════════ ⑤ 보드가 아닌 화면에서 열 때 ══════════════ */
제목('■ ⑤ 보드가 아니라 선생님 노트북·태블릿에서 열 때');
알림('선생님이 자기 노트북에서 미리 보거나, 태블릿으로 여는 일이 흔합니다');
{
  const 화면들 = [
    ['보드(세로 2160×3840)', 2160, 3840],
    ['노트북(가로 1920×1080)', 1920, 1080],
    ['작은 노트북(1366×768)', 1366, 768],
    ['태블릿(세로 800×1280)', 800, 1280],
  ];
  for (const [이름, w, h] of 화면들) {
    const ctx = await br.newContext({ viewport: { width: w, height: h } });
    const { page, f, 오류 } = await 열기(ctx, '/', 2500);
    const 잰것 = await page.evaluate(() => {
      const d = document.documentElement;
      const st = document.getElementById('stage');
      const r = st ? st.getBoundingClientRect() : null;
      return {
        옆으로넘침: d.scrollWidth - window.innerWidth,
        아래로넘침: d.scrollHeight - window.innerHeight,
        무대: r ? { w: Math.round(r.width), h: Math.round(r.height), 위: Math.round(r.top), 왼: Math.round(r.left) } : null,
        창: { w: window.innerWidth, h: window.innerHeight },
      };
    });
    /* 화면 밖으로 나간 누를 거리 */
    const 밖 = await f.evaluate(() => {
      let n = 0;
      for (const b of document.querySelectorAll('button, [role="button"], a')) {
        const r = b.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.bottom < -1 || r.right < -1 || r.top > window.innerHeight + 1 || r.left > window.innerWidth + 1) n++;
      }
      return n;
    });
    const 무대 = 잰것.무대;
    const 무대가려짐 = 무대 ? (무대.위 < -1 || 무대.왼 < -1 || 무대.위 + 무대.h > 잰것.창.h + 1 || 무대.왼 + 무대.w > 잰것.창.w + 1) : null;
    console.log('');
    console.log(`   ── ${이름} ──`);
    console.log(`     화면 밖으로 넘침: 옆 ${잰것.옆으로넘침}px · 아래 ${잰것.아래로넘침}px`);
    if (무대) console.log(`     안쪽 화면 크기: ${무대.w}×${무대.h} (창 ${잰것.창.w}×${잰것.창.h}, 왼${무대.왼} 위${무대.위})`);
    console.log(`     화면 밖으로 나간 누를 거리: ${밖}개`);
    const 좋음 = 잰것.옆으로넘침 <= 1 && 밖 === 0 && !무대가려짐 && 오류.length === 0;
    console.log(`     ${좋음 ? '✓ 다 보이고 다 누를 수 있습니다' : '✗ 잘리거나 넘칩니다 — 확인 필요'}`);
    await ctx.close();
  }
}

/* ══════════════ ⑥ 한참 뒤에 탭으로 돌아왔을 때 ══════════════ */
제목('■ ⑥ 다른 것을 보다가 한참 만에 타이머 탭으로 돌아왔을 때');
알림('브라우저는 안 보이는 탭의 시간 재기를 느리게 만듭니다. 그래서 타이머가 밀릴 수 있습니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const t = await 열기(ctx, '/timer/');
  await t.f.evaluate(() => {
    const g = (n) => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === n);
    const a = g('3분'); if (a) a.click();
  });
  await t.page.waitForTimeout(500);
  await t.f.evaluate(() => {
    const g = (n) => [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === n);
    const a = g('시작'); if (a) a.click();
  });
  await t.page.waitForTimeout(1500);
  const 읽초 = async (f) => f.evaluate(() => {
    const m = (document.body.innerText || '').match(/(\d{1,2}):(\d{2})/);
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  });
  const 처음 = await 읽초(t.f);

  /* 탭을 뒤로 보냅니다 — 실제로 다른 탭을 앞으로 꺼내는 것과 같습니다 */
  const 딴탭 = await ctx.newPage();
  await 딴탭.goto('about:blank');
  await 딴탭.bringToFront();
  /* 브라우저가 «얼려 두는» 상태까지 흉내 냅니다 (절전·다른 앱 전환과 같은 상황) */
  let 얼림 = '못 함';
  try {
    const cdp = await ctx.newCDPSession(t.page);
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
    얼림 = '얼림';
    await 잠깐(60000);
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  } catch (e) { await 잠깐(60000); 얼림 = '못 얼림(그냥 뒤로만)'; }
  await t.page.bringToFront();
  await 잠깐(1200);
  const 나중 = await 읽초(t.f);
  const 실제경과 = 61;
  console.log('');
  console.log(`   ── 3분 타이머를 걸고 ${실제경과}초 동안 다른 탭을 봄 (${얼림}) ──`);
  console.log(`     돌아오기 전 남은 시간: ${처음}초`);
  console.log(`     돌아온 뒤 남은 시간:   ${나중}초  (맞다면 ${처음 - 실제경과}초쯤)`);
  const 밀림 = 나중 === null ? null : (처음 - 나중) - 실제경과;
  if (밀림 === null) console.log('     ✗ 시간을 못 읽었습니다');
  else if (Math.abs(밀림) <= 4) console.log(`     ✓ ${Math.abs(밀림)}초 차이 — 돌아와도 시간이 맞습니다`);
  else console.log(`     ✗ ${밀림 > 0 ? '너무 많이' : '거의 안'} 흘렀습니다 (${밀림}초 어긋남) — 수업 중 타이머가 틀려집니다`);
  await ctx.close();
}

/* ══════════════ ⑦ 인쇄를 누를 때 ══════════════ */
제목('■ ⑦ 선생님이 인쇄(Ctrl+P)를 누를 때');
알림('퀴즈 결과나 시간표를 종이로 뽑아 두는 선생님이 있습니다');
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  for (const 길 of ['/', '/quiz/environment/', '/timer/']) {
    const { page, f } = await 열기(ctx, 길, 2200);
    const 전 = (await 글(f)).length;
    await page.emulateMedia({ media: 'print' });
    await 잠깐(800);
    const 후 = (await 글(f)).length;
    let 쪽수 = '(못 만듦)';
    try {
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      쪽수 = `${(pdf.length / 1024).toFixed(0)}KB`;
    } catch { }
    console.log('');
    console.log(`   ── ${길} 인쇄 ──`);
    console.log(`     화면 글자 ${전}자 → 인쇄 모양에서 ${후}자 · 만들어진 PDF ${쪽수}`);
    console.log(`     ${후 > 20 ? '✓ 인쇄해도 내용이 남습니다' : '✗ 인쇄하면 빈 종이가 나옵니다'}`);
    await page.emulateMedia({ media: 'screen' });
    await page.close();
  }
  await ctx.close();
}

서버.닫기(); await br.close();
console.log('');
