/* 접근성 검사 — 브라우저가 필요합니다.
 *
 * 무엇을 보나:
 *   · 글자가 배경과 충분히 구분되는가 (교실 뒤에서도 읽히는가)
 *     — 화면을 찍어 글자 픽셀과 배경 픽셀을 직접 잽니다.
 *       CSS 값만 보면 배경이 그라데이션·그림일 때 틀린 값이 나옵니다.
 *   · '동작 줄이기'를 켠 사람에게는 화면이 덜 움직이는가
 *   · 정답/오답을 색 말고 글자로도 알려 주는가 (색맹 아이)
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

const 브라우저 = await 브라우저열기();
if (!브라우저) { 제목('■ 접근성 검사'); 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47314);
const B = 서버.주소;

/* ── 밝기 계산 (국제 기준 WCAG) ── */
const 밝기 = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const 대비 = (a, b) => { let x = 밝기(a), y = 밝기(b); if (x < y) [x, y] = [y, x]; return (x + 0.05) / (y + 0.05); };

제목('■ 글자가 배경과 충분히 구분되는가');
{
  const 화면들 = [['수업도우미', '/'], ['타이머', '/timer/'], ['세계시간', '/worldclock/'],
    ['그림판', '/paint/'], ['피아노', '/instruments/'], ['퀴즈목록', '/quiz/']];
  const 장식 = ['★', '☆', '|', '·', '•'];
  const 나쁨 = [];
  let 잰것 = 0;
  for (const [이름, 길] of 화면들) {
    const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto(B + 길, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1100);
    const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
    const 상자 = await f.evaluate(() => {
      const 보 = (e) => { const s = getComputedStyle(e), b = e.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 &&
               b.width > 4 && b.height > 4 && b.y > -50 && b.y < 1920 && b.x < 1080; };
      const out = [];
      for (const e of document.querySelectorAll('*')) {
        if (!보(e)) continue;
        const 글 = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim()).join(' ');
        if (!글) continue;
        /* 꺼진 단추는 원래 연한 게 맞아 기준에서 뺍니다 */
        let 꺼짐 = false;
        for (let a = e; a; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (a.disabled === true || a.getAttribute('aria-disabled') === 'true' ||
              s.cursor === 'not-allowed' || s.pointerEvents === 'none' || +s.opacity < 0.95) { 꺼짐 = true; break; }
          if (a === document.body) break;
        }
        if (꺼짐) continue;
        const b = e.getBoundingClientRect(), s = getComputedStyle(e);
        out.push({ 글: 글.slice(0, 30), x: Math.max(0, Math.round(b.x)), y: Math.max(0, Math.round(b.y)),
          w: Math.min(1080, Math.round(b.width)), h: Math.min(1920, Math.round(b.height)),
          px: parseFloat(s.fontSize), 굵기: s.fontWeight });
      }
      return out;
    });
    const A = await p.screenshot();
    await f.addStyleTag({ content: '*,*::before,*::after{color:transparent !important;text-shadow:none !important;-webkit-text-fill-color:transparent !important;}' });
    await p.waitForTimeout(350);
    const Bimg = await p.screenshot();
    await p.close();

    /* 두 그림에서 다른 픽셀 = 글자가 그려진 자리 */
    const png = await import('node:zlib').then(() => null).catch(() => null);
    const 재기 = await 브라우저.newPage();
    const 결과 = await 재기.evaluate(async ({ a, b, 상자 }) => {
      const 그리기 = (data) => new Promise((res) => { const i = new Image();
        i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
          const g = c.getContext('2d'); g.drawImage(i, 0, 0); res(g.getImageData(0, 0, c.width, c.height)); };
        i.src = 'data:image/png;base64,' + data; });
      const A = await 그리기(a), Bd = await 그리기(b);
      const out = [];
      for (const s of 상자) {
        const px = [];
        const step = s.w * s.h < 40000 ? 1 : 2;
        for (let y = s.y; y < Math.min(s.y + s.h, A.height); y += step)
          for (let x = s.x; x < Math.min(s.x + s.w, A.width); x += step) {
            const i = (y * A.width + x) * 4;
            const d = Math.abs(A.data[i] - Bd.data[i]) + Math.abs(A.data[i+1] - Bd.data[i+1]) + Math.abs(A.data[i+2] - Bd.data[i+2]);
            if (d > 60) px.push([[A.data[i], A.data[i+1], A.data[i+2]], [Bd.data[i], Bd.data[i+1], Bd.data[i+2]]]);
          }
        if (px.length < 25) continue;
        const 밝 = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4; };
          return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); };
        px.sort((p, q) => Math.abs(밝(q[0]) - 밝(q[1])) - Math.abs(밝(p[0]) - 밝(p[1])));
        const core = px.slice(0, Math.max(10, Math.floor(px.length / 5)));
        const 중앙 = (arr, i, j) => { const v = arr.map((t) => t[i][j]).sort((a, b) => a - b); return v[Math.floor(v.length/2)]; };
        out.push({ ...s, fg: [중앙(core,0,0), 중앙(core,0,1), 중앙(core,0,2)],
                        bg: [중앙(core,1,0), 중앙(core,1,1), 중앙(core,1,2)] });
      }
      return out;
    }, { a: A.toString('base64'), b: Bimg.toString('base64'), 상자 });
    await 재기.close();

    for (const r of 결과) {
      잰것++;
      const 글 = r.글.trim();
      if (글 && [...글].every((c) => 장식.includes(c) || /\s/.test(c) || c.codePointAt(0) > 0x1f000)) continue;
      const 굵 = ['700','800','900','bold','bolder'].includes(String(r.굵기));
      const 기준 = (r.px >= 24 || (r.px >= 18.66 && 굵)) ? 3.0 : 4.5;
      const v = 대비(r.fg, r.bg);
      if (v < 기준) 나쁨.push(`${이름} «${글.slice(0,28)}» ${r.px}px  ${v.toFixed(2)}:1 (기준 ${기준})`);
    }
  }
  알림(`글자 ${잰것}곳을 픽셀로 쟀습니다`);
  /* 제품 고유색(초록·파랑)으로 남겨 둔 것이 있어, 지금은 12곳까지 허용합니다.
     이 숫자가 늘면 새로 연한 글자가 생겼다는 뜻입니다. */
  확인(`글자 대비가 기준에 못 미치는 곳이 12곳 이하다 (지금 ${나쁨.length}곳)`, 나쁨.length <= 12,
    나쁨.slice(0, 15).join('\n'));
  if (나쁨.length) 나쁨.slice(0, 8).forEach((x) => 알림(x));
}

제목("■ '동작 줄이기'를 켠 사람에게");
for (const [이름, 길] of [['수업도우미', '/'], ['퀴즈목록', '/quiz/'], ['사다리', '/ladder/']]) {
  const 세기 = async (모드) => {
    const ctx = await 브라우저.newContext({ viewport: { width: 1080, height: 1920 }, reducedMotion: 모드 });
    const p = await ctx.newPage();
    await p.goto(B + 길, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
    const n = await f.evaluate(() => [...document.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e), b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 &&
        ((s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05) || parseFloat(s.transitionDuration) > 0.05);
    }).length);
    await ctx.close(); return n;
  };
  const 보통 = await 세기('no-preference');
  const 줄임 = await 세기('reduce');
  알림(`${이름}: 평소 ${보통}개 · 동작 줄이기 켜면 ${줄임}개`);
  확인(`${이름}: 동작 줄이기를 켜면 움직임이 멈춘다`, 줄임 === 0, `${줄임}개가 아직 움직입니다`);
  확인(`${이름}: 동작 줄이기를 안 켠 사람에게는 그대로다`, 보통 > 0);
}

제목('■ 정답·오답을 색 말고 글자로도 알려 주는가');
for (const [이름, 길] of [['환경', '/quiz/environment/'], ['안전', '/quiz/safe/']]) {
  const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(B + 길, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1100);
  const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
  await f.evaluate(() => { const c = [...document.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect();
    return b.width > 200 && b.height > 200 && b.y > 1000 && b.y < 1450; }); if (c.length) c[0].click(); });
  await p.waitForTimeout(1300);
  const 글 = await f.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  확인(`${이름}: 맞았는지 틀렸는지 글자로 알려 준다`, /정답입니다|아쉽네요|정답[:：]/.test(글),
    글.slice(0, 120));
  await p.close();
}

await 브라우저.close(); 서버.닫기();
마무리('접근성 검사');
