/* 저사양 보드를 흉내 내어 성능을 잽니다. (검사 도구가 아니라 조사용입니다)
 *
 * 왜:
 *   AI보드는 Windows 10 IoT 가 도는 저사양 기기입니다. 개발한 맥북과 성능이
 *   많이 다릅니다. 여기서는 CPU 를 일부러 느리게 만들어 놓고
 *     · 화면이 뜨는 데 몇 초 걸리는지
 *     · 애니메이션이 몇 프레임으로 도는지 (60이 부드럽고, 30 밑이면 버벅임)
 *     · 화면 하나가 메모리를 얼마나 쓰는지
 *   를 잽니다.
 *
 * 사용법: node test/x-perf.mjs [배속]     기본 6배 느리게
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 느리게 = Number(process.argv[2] || 6);

const 화면들 = [
  ['수업도우미 첫화면', '/index.html'],
  ['타이머', '/timer/'],
  ['뽀모도로', '/pomodoro/'],
  ['스톱워치', '/stopwatch/'],
  ['세계시간', '/worldclock/'],
  ['그림판', '/paint/'],
  ['소음측정기', '/noise/'],
  ['발표자 선정', '/picker/'],
  ['피아노', '/instruments/'],
  ['사다리', '/ladder/'],
  ['퀴즈 첫화면', '/quiz/index.html'],
  ['환경 퀴즈', '/quiz/environment/'],
  ['안전 퀴즈', '/quiz/safe/'],
  ['학교폭력 퀴즈', '/quiz/violence/'],
  ['속담', '/quiz/proverb/'],
  ['사자성어', '/quiz/fourchar/'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47355);

제목(`■ 저사양 보드 흉내 — CPU 를 ${느리게}배 느리게 해 놓고 잽니다`);
알림('보드 해상도 2160×3840, 애니메이션 켜진 상태');
console.log('');
console.log('   화면                 뜨는데   프레임   메모리   움직이는것');
console.log('   ' + '─'.repeat(58));

const 결과 = [];
for (const [이름, 길] of 화면들) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 느리게 });

  const t0 = Date.now();
  let 오류 = null;
  page.on('pageerror', (e) => { if (!오류) 오류 = String(e).slice(0, 60); });
  page.on('frameattached', () => {});

  /* 이 화면들은 겉틀(index.html)이 iframe 으로 속 화면(app.html)을 띄웁니다.
     겉틀의 글자를 보면 언제나 비어 있으므로, 반드시 속 화면을 봐야 합니다. */
  let 속 = null;
  try {
    await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
    속 = await page.waitForFunction(() => {
      const f = document.querySelector('iframe');
      const d = f && (f.contentDocument);
      const 대상 = d && d.body ? d.body : document.body;
      return 대상 && 대상.innerText.trim().length > 3;
    }, null, { timeout: 40000 }).then(() => true);
  } catch (e) { 오류 = 오류 || '글자가 안 나타남(40초)'; }
  const 뜨는데 = Date.now() - t0;

  /* 속 화면 프레임을 잡습니다 (없으면 겉틀 그대로) */
  const 잴곳 = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();

  // 프레임률: 2초 동안 requestAnimationFrame 이 몇 번 불리나
  let fps = 0;
  try {
    fps = await 잴곳.evaluate(() => new Promise((r) => {
      let n = 0; const 끝 = performance.now() + 2000;
      const 한번 = () => { n++; if (performance.now() < 끝) requestAnimationFrame(한번); else r(Math.round(n / 2)); };
      requestAnimationFrame(한번);
    }));
  } catch { fps = -1; }

  let 메모리 = 0, 움직임 = 0;
  try {
    메모리 = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : 0));
    움직임 = await 잴곳.evaluate(() => document.getAnimations().length);
  } catch { /* 무시 */ }

  const MB = 메모리 ? (메모리 / 1048576).toFixed(1) + 'MB' : '  -  ';
  const 표시 = `   ${이름.padEnd(18)} ${String(뜨는데 + 'ms').padStart(7)} ${String(fps).padStart(6)} ${MB.padStart(8)} ${String(움직임).padStart(8)}`;
  console.log(표시 + (오류 ? `   ⚠ ${오류}` : ''));
  결과.push({ 이름, 뜨는데, fps, 메모리, 움직임, 오류 });

  await ctx.close();
}

서버.닫기(); await br.close();

console.log('');
제목('■ 읽는 법');
const 느린것 = 결과.filter((r) => r.뜨는데 > 3000);
const 버벅 = 결과.filter((r) => r.fps >= 0 && r.fps < 30);
const 오류난것 = 결과.filter((r) => r.오류);

if (오류난것.length) {
  console.log(`   ✗ 오류가 난 화면 ${오류난것.length}개: ${오류난것.map((r) => r.이름).join(', ')}`);
} else console.log('   ✓ 오류가 난 화면 없음');

if (느린것.length) {
  console.log(`   ⚠ 3초 넘게 걸린 화면 ${느린것.length}개:`);
  느린것.forEach((r) => console.log(`       ${r.이름} — ${r.뜨는데}ms`));
} else console.log('   ✓ 모든 화면이 3초 안에 떴습니다');

if (버벅.length) {
  console.log(`   ⚠ 30프레임 밑으로 떨어진 화면 ${버벅.length}개 (눈에 버벅임이 보입니다):`);
  버벅.forEach((r) => console.log(`       ${r.이름} — ${r.fps}프레임, 움직이는 것 ${r.움직임}개`));
} else console.log('   ✓ 모든 화면이 30프레임 이상');

const 무거운 = [...결과].sort((a, b) => b.메모리 - a.메모리)[0];
if (무거운 && 무거운.메모리) {
  console.log(`   · 메모리를 제일 많이 쓰는 화면: ${무거운.이름} ${(무거운.메모리 / 1048576).toFixed(1)}MB`);
}
