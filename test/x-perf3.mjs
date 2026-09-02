/* 가설을 시험합니다. (조사용)
 *
 * 가설:
 *   버벅임의 원인은 "움직이는 것이 많아서" 가 아니라
 *   **어떤 속성을 움직이느냐** 때문이다.
 *
 *   그림카드를 옮기는 것(transform)과 투명도(opacity)는 그래픽칩이 처리해서 쌉니다.
 *   그런데 그림자(box-shadow / drop-shadow)와 배경 위치(background-position)는
 *   매 프레임 화면을 **다시 그려야** 합니다. 2160×3840 짜리 화면에서는 아주 비쌉니다.
 *
 *   퀴즈 첫화면 twinkleStar : filter: drop-shadow(...) drop-shadow(...)  ← 별 24개가 각자
 *   소음측정기 ripple-1/2   : box-shadow: 0 0 50px ...
 *   소음측정기 liquid-flow  : background-position
 *
 * 시험:
 *   움직임 개수는 그대로 두고, **비싼 속성만 고정**시킨 뒤 프레임을 다시 잽니다.
 *   프레임이 회복되면 가설이 맞습니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 느리게 = Number(process.argv[2] || 6);

/* 비싼 속성만 고정시키는 덧칠.
   움직임(transform·opacity)은 그대로 두므로 반짝임은 계속 보입니다.
   그림자는 '가운데 값'으로 고정해서 빛나는 느낌은 남깁니다. */
const 덧칠 = `
/* 퀴즈 첫화면: 별의 빛번짐을 고정 (반짝임·회전은 그대로) */
@keyframes twinkleStar {
  0%, 100% { opacity: .15; transform: scale(.6) rotate(0); }
  50%      { opacity: 1;   transform: scale(1.35) rotate(25deg); }
}
.hero-star, svg[class*="star"], [style*="twinkleStar"] {
  filter: drop-shadow(0 0 12px rgba(255,255,255,.85));
}
/* 소음측정기: 물결의 그림자를 고정 (퍼지는 움직임은 그대로) */
@keyframes ripple-1 {
  0%   { transform: scale(.97); opacity: .95; }
  100% { transform: scale(1.25); opacity: 0; }
}
@keyframes ripple-2 {
  0%   { transform: scale(.97); opacity: .85; }
  100% { transform: scale(1.38); opacity: 0; }
}
`;

const 볼것 = [['소음측정기', '/noise/'], ['퀴즈 첫화면', '/quiz/index.html']];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47357);

async function 재기(길, 덧칠할까) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 느리게 });
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => {
    const f = document.querySelector('iframe'); const d = f && f.contentDocument;
    const t = d && d.body ? d.body : document.body;
    return t && t.innerText.trim().length > 3;
  }, null, { timeout: 40000 }).catch(() => {});
  const 잴곳 = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();
  if (덧칠할까) {
    await 잴곳.evaluate((css) => {
      const st = document.createElement('style'); st.textContent = css;
      document.head.appendChild(st);
    }, 덧칠);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(800);
  const 개수 = await 잴곳.evaluate(() => document.getAnimations().length);
  const fps = await 잴곳.evaluate(() => new Promise((r) => {
    let n = 0; const 끝 = performance.now() + 3000;
    const 한번 = () => { n++; if (performance.now() < 끝) requestAnimationFrame(한번); else r(Math.round(n / 3)); };
    requestAnimationFrame(한번);
  }));
  await ctx.close();
  return { fps, 개수 };
}

제목(`■ 가설 시험 — 비싼 속성만 고정하면 회복되는가 (CPU ${느리게}배 느리게)`);
알림('움직이는 개수는 그대로 두고, 그림자·배경위치만 고정했습니다');
console.log('');
console.log('   화면                 그대로      그림자만 고정   움직이는 개수');
console.log('   ' + '─'.repeat(58));
for (const [이름, 길] of 볼것) {
  const a = await 재기(길, false);
  const b = await 재기(길, true);
  const 판정 = b.fps >= 30 && b.fps > a.fps * 1.5 ? '  ← 회복됨' : '';
  console.log(`   ${이름.padEnd(18)} ${String(a.fps + '프레임').padStart(8)}   ${String(b.fps + '프레임').padStart(10)}   ${a.개수} → ${b.개수}개${판정}`);
}
서버.닫기(); await br.close();
