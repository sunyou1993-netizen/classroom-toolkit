/* 고치는 방법을 시험합니다. (조사용)
 *
 * 애니메이션을 **끄지 않고** 싸게 만들 수 있는지 봅니다.
 *   가) 그림자만 고정 (움직임은 그대로)
 *   나) 반짝이는 요소를 그래픽칩 전용 층으로 올림 (translateZ)  — 모양은 그대로
 *   다) 가+나
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 느리게 = Number(process.argv[2] || 6);

const 그림자고정 = `
@keyframes ripple-1 { 0%{transform:scale(.97);opacity:.95} 100%{transform:scale(1.25);opacity:0} }
@keyframes ripple-2 { 0%{transform:scale(.97);opacity:.85} 100%{transform:scale(1.38);opacity:0} }
.ripple-1, .ripple-2, [class*="ripple"] { box-shadow: 0 0 32px rgba(0,82,224,.28); }
`;
const 층으로 = `
.animate-ping, .animate-pulse, .ping-ripple,
[class*="ripple"], [class*="breath"] {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
`;

const 실험들 = [
  ['① 지금 그대로', ''],
  ['② 그림자만 고정', 그림자고정],
  ['③ 그래픽칩 층으로만', 층으로],
  ['④ ②+③ (둘 다)', 그림자고정 + 층으로],
  ['⑤ 전부 멈춤 (천장)', '*,*::before,*::after{animation:none!important}'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47359);

async function 재기(길, css) {
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
  if (css) await 잴곳.evaluate((c) => {
    const s = document.createElement('style'); s.textContent = c; document.head.appendChild(s);
  }, css);
  await page.waitForTimeout(1200);
  const 개수 = await 잴곳.evaluate(() => document.getAnimations().length);
  const fps = await 잴곳.evaluate(() => new Promise((r) => {
    let n = 0; const 끝 = performance.now() + 3000;
    const 한번 = () => { n++; if (performance.now() < 끝) requestAnimationFrame(한번); else r(Math.round(n / 3)); };
    requestAnimationFrame(한번);
  }));
  await ctx.close();
  return { fps, 개수 };
}

제목(`■ 고치는 방법 시험 — 소음측정기 (CPU ${느리게}배 느리게)`);
알림('움직임은 끄지 않고, 같은 모양으로 싸게 만들 수 있는지 봅니다');
console.log('');
console.log('   방법                        프레임   움직이는것');
console.log('   ' + '─'.repeat(50));
for (const [이름, css] of 실험들) {
  const r = await 재기('/noise/', css);
  console.log(`   ${이름.padEnd(26)} ${String(r.fps).padStart(5)}   ${String(r.개수).padStart(6)}`);
}
서버.닫기(); await br.close();
