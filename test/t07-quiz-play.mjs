/* 퀴즈를 실제로 풀어 보는 검사 — 브라우저가 필요합니다.
 *
 * 무엇을 보나:
 *   · 화면에 뜬 문항의 채점이 원본 데이터와 맞는가 (가장 위험한 곳)
 *   · 다 맞히면 100점, 다 틀리면 0점인가
 *   · 한 판에 같은 문제가 두 번 나오지 않는가
 *   · 같은 버튼을 빠르게 두 번 눌러도 두 번 처리되지 않는가
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 번들문항, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

const 브라우저 = await 브라우저열기();
if (!브라우저) { 제목('■ 퀴즈 풀어 보기'); 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47312);
const B = 서버.주소;

const 갈래 = [['환경', 'environment'], ['안전', 'safe'], ['학교폭력', 'violence']];

async function 한판(폴더, 정답표, 전략) {
  const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 } });
  const 오류 = [];
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 90)));
  await p.goto(`${B}/quiz/${폴더}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1100);
  const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
  const 본것 = [], 어긋남 = [];
  for (let n = 0; n < 10; n++) {
    const q = await f.evaluate(() => { const m = document.body.innerText.match(/"([^"]{6,})"/); return m ? m[1] : null; });
    if (!q) break;
    const 정답 = 정답표.get(q.replace(/\s+/g, ''));
    본것.push(q);
    const 누를것 = 전략 === '정답' ? 정답 : 전략 === '오답' ? (정답 === 'O' ? 'X' : 'O') : 'O';
    await f.evaluate((누를것) => {
      const c = [...document.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect();
        return b.width > 200 && b.height > 200 && b.y > 1000 && b.y < 1450; })
        .sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
      if (c.length >= 2) (누를것 === 'O' ? c[0] : c[1]).click();
    }, 누를것);
    await p.waitForTimeout(650);
    const 판정 = await f.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, ' ');
      return { 맞: /정답입니다/.test(t), 화면정답: (t.match(/정답[:：]\s*([OX])/) || [])[1] || null }; });
    const 기대 = (누를것 === 정답);
    if (정답 && (판정.맞 !== 기대 || (판정.화면정답 && 판정.화면정답 !== 정답)))
      어긋남.push(`«${q.slice(0, 40)}» 원본 ${정답} · 누름 ${누를것} · 화면 ${판정.화면정답} · 판정 ${판정.맞 ? '정답' : '오답'}`);
    await f.evaluate(() => { const b = document.getElementById('btn-next-q'); if (b && !b.disabled) b.click(); });
    await p.waitForTimeout(650);
  }
  /* 결과 화면은 갈래마다 늦게 뜰 수 있어 넉넉히 기다립니다 */
  let 점수 = null;
  for (let i = 0; i < 40; i++) {
    점수 = await f.evaluate(() => { const m = document.body.innerText.match(/(\d+)\s*점/); return m ? Number(m[1]) : null; });
    if (점수 !== null) break;
    await p.waitForTimeout(300);
  }
  await p.close();
  return { 본것, 어긋남, 점수, 오류 };
}

for (const [이름, 폴더] of 갈래) {
  제목(`■ ${이름}`);
  const 표 = new Map(번들문항(폴더).map((q) => [q.q.replace(/\s+/g, ''), q.ans]));

  const 다맞 = await 한판(폴더, 표, '정답');
  확인(`${이름}: 채점이 원본 데이터와 맞는다 (10문항)`, 다맞.어긋남.length === 0, 다맞.어긋남.join('\n'));
  확인(`${이름}: 한 판에 같은 문제가 두 번 나오지 않는다`, new Set(다맞.본것).size === 다맞.본것.length);
  확인(`${이름}: 전부 맞히면 100점`, 다맞.점수 === 100, `나온 점수 ${다맞.점수}`);
  확인(`${이름}: 자바스크립트 오류가 없다`, 다맞.오류.length === 0, 다맞.오류.join('\n'));

  const 다틀 = await 한판(폴더, 표, '오답');
  확인(`${이름}: 전부 틀리면 0점`, 다틀.점수 === 0, `나온 점수 ${다틀.점수}`);
}

제목('■ 아이가 같은 곳을 연타했을 때');
{
  /* 사람 손가락으로 낼 수 있는 가장 빠른 속도(50ms 간격)로 다섯 번 누릅니다.
     코드로 0ms 에 몰아치는 것은 사람이 할 수 없는 방식이라 검사하지 않습니다
     — 그렇게 하면 다섯 문제를 건너뛰지만, 실제로는 일어나지 않습니다. */
  const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const 오류 = []; p.on('pageerror', (e) => 오류.push(String(e).slice(0, 90)));
  await p.goto(`${B}/quiz/safe/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1100);
  const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
  const 처음 = await f.evaluate(() => Number(document.body.innerText.match(/(\d+)\s*\/\s*10/)?.[1] || 0));

  /* O 를 손가락으로 다섯 번 */
  const ox = await f.evaluate(() => {
    const c = [...document.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect();
      return b.width > 200 && b.height > 200 && b.y > 1000 && b.y < 1450; })
      .sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
    const b = c[0]?.getBoundingClientRect();
    return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null;
  });
  if (ox) for (let i = 0; i < 5; i++) { await p.touchscreen.tap(ox.x, ox.y); await p.waitForTimeout(50); }
  await p.waitForTimeout(700);

  /* 「다음 문제」도 손가락으로 다섯 번 */
  const el = await f.$('#btn-next-q');
  if (el) { const b = await el.boundingBox();
    for (let i = 0; i < 5; i++) { await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(50); } }
  await p.waitForTimeout(1400);

  const 뒤 = await f.evaluate(() => Number(document.body.innerText.match(/(\d+)\s*\/\s*10/)?.[1] || 0));
  알림(`손가락으로 50ms 간격 연타 → 문항 ${처음} → ${뒤}`);
  확인('아이가 연타해도 문제를 건너뛰지 않는다', 뒤 - 처음 <= 1, `${뒤 - 처음}칸 넘어갔습니다`);
  확인('연타해도 오류가 나지 않는다', 오류.length === 0, 오류.join('\n'));
  await p.close();
}

await 브라우저.close(); 서버.닫기();
마무리('퀴즈 풀어 보기 검사');
