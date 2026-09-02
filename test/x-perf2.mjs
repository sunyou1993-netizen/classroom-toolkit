/* 버벅이는 두 화면의 원인을 찾습니다. (조사용)
 * 움직이는 것을 끄면 프레임이 회복되는지 보고, 무엇이 움직이는지 이름을 뽑습니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 느리게 = Number(process.argv[2] || 6);
const 볼것 = [
  ['소음측정기', '/noise/'],
  ['퀴즈 첫화면', '/quiz/index.html'],
  ['수업도우미 첫화면', '/index.html'],   // 비교용 (멀쩡한 화면)
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47356);

async function 재기(길, 움직임끄기) {
  const ctx = await br.newContext({
    viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2,
    reducedMotion: 움직임끄기 ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 느리게 });
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => {
    const f = document.querySelector('iframe');
    const d = f && f.contentDocument;
    const t = d && d.body ? d.body : document.body;
    return t && t.innerText.trim().length > 3;
  }, null, { timeout: 40000 }).catch(() => {});
  const 잴곳 = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();
  await page.waitForTimeout(800);
  const fps = await 잴곳.evaluate(() => new Promise((r) => {
    let n = 0; const 끝 = performance.now() + 3000;
    const 한번 = () => { n++; if (performance.now() < 끝) requestAnimationFrame(한번); else r(Math.round(n / 3)); };
    requestAnimationFrame(한번);
  }));
  const 목록 = await 잴곳.evaluate(() => document.getAnimations().map((a) => {
    const el = a.effect && a.effect.target;
    return {
      이름: (a.animationName || (a.effect && a.effect.getTiming && '') || '') || '(transition)',
      태그: el ? el.tagName.toLowerCase() : '?',
      클래스: el && el.className ? String(el.className).slice(0, 70) : '',
      무한: a.effect && a.effect.getTiming().iterations === Infinity,
    };
  }));
  await ctx.close();
  return { fps, 목록 };
}

제목(`■ 버벅임의 원인 찾기 (CPU ${느리게}배 느리게)`);
알림('"움직임 끄기" 는 기기의 「동작 줄이기」 설정을 켠 것과 같습니다');
console.log('');
console.log('   화면                  그냥    움직임 끄면   움직이는 것');
console.log('   ' + '─'.repeat(56));

const 모음 = [];
for (const [이름, 길] of 볼것) {
  const a = await 재기(길, false);
  const b = await 재기(길, true);
  console.log(`   ${이름.padEnd(18)} ${String(a.fps + '프레임').padStart(8)}  ${String(b.fps + '프레임').padStart(9)}   ${a.목록.length}개`);
  모음.push({ 이름, a, b });
}

console.log('');
for (const { 이름, a } of 모음) {
  if (a.fps >= 30) continue;
  제목(`■ ${이름} 에서 계속 움직이는 것들`);
  const 무한들 = a.목록.filter((x) => x.무한);
  알림(`전부 ${a.목록.length}개, 그중 ${무한들.length}개가 **끝없이** 반복됩니다`);
  const 셈 = new Map();
  for (const x of a.목록) {
    const 키 = `${x.이름} · ${x.태그}.${x.클래스.split(/\s+/).slice(0, 3).join('.')}`;
    셈.set(키, (셈.get(키) || 0) + 1);
  }
  [...셈.entries()].sort((p, q) => q[1] - p[1]).slice(0, 10)
    .forEach(([k, n]) => console.log(`       ${String(n).padStart(3)}개  ${k}`));
}

서버.닫기(); await br.close();
