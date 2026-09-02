/* 소음측정기에서 무엇이 얼마나 비싼지 하나씩 꺼 가며 잽니다. (조사용) */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 느리게 = Number(process.argv[2] || 6);

const 실험들 = [
  ['① 아무것도 안 건드림', ''],
  ['② 물결 그림자만 고정', `
     @keyframes ripple-1 { 0%{transform:scale(.97);opacity:.95} 100%{transform:scale(1.25);opacity:0} }
     @keyframes ripple-2 { 0%{transform:scale(.97);opacity:.85} 100%{transform:scale(1.38);opacity:0} }`],
  ['③ ②+단추 배경 흐름 멈춤', `
     @keyframes ripple-1 { 0%{transform:scale(.97);opacity:.95} 100%{transform:scale(1.25);opacity:0} }
     @keyframes ripple-2 { 0%{transform:scale(.97);opacity:.85} 100%{transform:scale(1.38);opacity:0} }
     @keyframes liquid-flow { 0%,100% { background-position: 50% 50%; } }`],
  ['④ ③+ping/pulse 멈춤', `
     @keyframes ripple-1 { 0%{transform:scale(.97);opacity:.95} 100%{transform:scale(1.25);opacity:0} }
     @keyframes ripple-2 { 0%{transform:scale(.97);opacity:.85} 100%{transform:scale(1.38);opacity:0} }
     @keyframes liquid-flow { 0%,100% { background-position: 50% 50%; } }
     .animate-ping, .ping-ripple { animation: none !important; }
     .animate-pulse { animation: none !important; }`],
  ['⑤ 전부 멈춤 (비교용)', `*,*::before,*::after{animation:none!important;transition:none!important}`],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47358);

제목(`■ 소음측정기 — 무엇이 비싼가 (CPU ${느리게}배 느리게)`);
알림('위에서부터 하나씩 더 꺼 가며 잽니다. 크게 뛰는 칸이 원인입니다.');
console.log('');
console.log('   무엇을 껐나                     프레임   움직이는것');
console.log('   ' + '─'.repeat(52));

let 앞 = null;
for (const [이름, css] of 실험들) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 느리게 });
  await page.goto(서버.주소 + '/noise/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => {
    const f = document.querySelector('iframe'); const d = f && f.contentDocument;
    const t = d && d.body ? d.body : document.body;
    return t && t.innerText.trim().length > 3;
  }, null, { timeout: 40000 }).catch(() => {});
  const 잴곳 = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();
  if (css) await 잴곳.evaluate((c) => {
    const s = document.createElement('style'); s.textContent = c; document.head.appendChild(s);
  }, css);
  await page.waitForTimeout(1000);
  const 개수 = await 잴곳.evaluate(() => document.getAnimations().length);
  const fps = await 잴곳.evaluate(() => new Promise((r) => {
    let n = 0; const 끝 = performance.now() + 3000;
    const 한번 = () => { n++; if (performance.now() < 끝) requestAnimationFrame(한번); else r(Math.round(n / 3)); };
    requestAnimationFrame(한번);
  }));
  const 차이 = 앞 === null ? '' : `   (${fps - 앞 >= 0 ? '+' : ''}${fps - 앞})`;
  console.log(`   ${이름.padEnd(28)} ${String(fps).padStart(5)}   ${String(개수).padStart(6)}${차이}`);
  앞 = fps;
  await ctx.close();
}
서버.닫기(); await br.close();
