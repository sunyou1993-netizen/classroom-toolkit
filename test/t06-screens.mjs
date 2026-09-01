/* 화면 검사 — 브라우저가 필요합니다.
 *
 * 무엇을 보나:
 *   · 화면 16개가 오류 없이 열리는가
 *   · 바깥 인터넷으로 나가는 요청이 없는가 (학교망·오프라인 보드)
 *   · 화면 제목이 제대로 붙어 있는가
 *   · 보드 해상도(2160x3840)에서 여백 없이 꽉 차는가
 *   · 손가락으로 누를 수 있는 크기인가
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

const 브라우저 = await 브라우저열기();
if (!브라우저) { 제목('■ 화면 검사'); 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기();
const B = 서버.주소;

const 화면들 = [
  ['수업도우미', '/', '수업도우미'], ['타이머', '/timer/', '타이머'],
  ['뽀모도로', '/pomodoro/', '뽀모도로 타이머'], ['스톱워치', '/stopwatch/', '스톱워치'],
  ['세계시간', '/worldclock/', '세계시간'], ['그림판', '/paint/', '그림판(판서)'],
  ['소음측정기', '/noise/', '소음측정기'], ['발표자선정', '/picker/', '발표자 선정'],
  ['피아노', '/instruments/', '피아노 연주'], ['사다리', '/ladder/', '사다리 타기'],
  ['퀴즈목록', '/quiz/', '무엇을 맞춰볼까요?'], ['속담', '/quiz/proverb/', '속담 맞추기'],
  ['사자성어', '/quiz/fourchar/', '사자성어 맞추기'], ['환경', '/quiz/environment/', '환경 퀴즈'],
  ['안전', '/quiz/safe/', '안전 퀴즈'], ['학교폭력', '/quiz/violence/', '학교폭력 예방 퀴즈'],
];

제목('■ 화면 하나씩 열어 보기');
const 바깥전체 = [];
for (const [이름, 길, 제목글] of 화면들) {
  const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 } });
  const 오류 = [], 실패응답 = [], 바깥 = [];
  p.on('pageerror', (e) => 오류.push(String(e).slice(0, 90)));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) 오류.push(m.text().slice(0, 90)); });
  p.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) 실패응답.push(`${r.status()} ${r.url().replace(B, '')}`); });
  p.on('request', (r) => { const u = r.url();
    if (!/^(data:|blob:|about:)/.test(u) && !u.startsWith(B)) 바깥.push(u.slice(0, 70)); });
  try {
    await p.goto(B + 길, { waitUntil: 'networkidle', timeout: 25000 });
    await p.waitForTimeout(900);
    const 탭제목 = await p.title();
    확인(`${이름}: 오류 없이 열린다`, 오류.length === 0, 오류.join('\n'));
    확인(`${이름}: 없는 파일을 찾지 않는다`, 실패응답.length === 0, 실패응답.join('\n'));
    확인(`${이름}: 화면 제목이 «${제목글}» 이다`, 탭제목 === 제목글, `지금 «${탭제목}»`);
  } catch (e) { 확인(`${이름}: 열린다`, false, String(e).split('\n')[0]); }
  바깥.forEach((u) => 바깥전체.push(`${이름}: ${u}`));
  await p.close();
}
확인('어느 화면도 바깥 인터넷으로 나가지 않는다', 바깥전체.length === 0,
  [...new Set(바깥전체)].slice(0, 10).join('\n') +
  '\n학교망이 막혀 있거나 인터넷이 없는 보드에서 화면이 깨질 수 있습니다.');

제목('■ 실제 보드 해상도(2160x3840)에서');
for (const [이름, 길] of [['수업도우미', '/'], ['퀴즈', '/quiz/']]) {
  const p = await 브라우저.newPage({ viewport: { width: 2160, height: 3840 } });
  await p.goto(B + 길, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const el = document.querySelector('#stage') || document.querySelector('iframe') || document.body;
    const t = getComputedStyle(el).transform;
    const m = t && t !== 'none' ? parseFloat(t.split('(')[1]) : 1;
    /* getBoundingClientRect 는 이미 확대가 반영된 크기입니다. 다시 곱하면 안 됩니다. */
    const b = el.getBoundingClientRect();
    return { 배율: Math.round(m * 100) / 100,
             좌우여백: Math.round(innerWidth - b.width),
             위아래여백: Math.round(innerHeight - b.height) };
  });
  알림(`${이름}: 배율 ${r.배율} · 좌우여백 ${r.좌우여백} · 위아래여백 ${r.위아래여백}`);
  확인(`${이름}: 보드 화면을 여백 없이 꽉 채운다`, r.배율 === 2 && Math.abs(r.좌우여백) <= 2 && Math.abs(r.위아래여백) <= 2);
  await p.close();
}

제목('■ 손가락으로 누를 수 있는 크기인가 (65인치 기준 1픽셀 ≈ 0.75mm)');
{
  const 작은것 = [];
  for (const [이름, 길] of 화면들) {
    const p = await 브라우저.newPage({ viewport: { width: 1080, height: 1920 } });
    try {
      await p.goto(B + 길, { waitUntil: 'networkidle', timeout: 20000 });
      await p.waitForTimeout(700);
      const f = p.frames().find((fr) => fr.url().includes('app.html')) || p.mainFrame();
      const r = await f.evaluate(() => [...document.querySelectorAll('button,[role=button],a')]
        .filter((e) => { const s = getComputedStyle(e), b = e.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.5 &&
                 b.width > 0 && b.height > 0 && !e.disabled && s.cursor !== 'not-allowed'; })
        .map((e) => { const b = e.getBoundingClientRect();
          return { 글: (e.textContent || '').trim().slice(0, 14), 짧은쪽: Math.round(Math.min(b.width, b.height)) }; })
        .filter((x) => x.짧은쪽 * 0.75 < 9));
      r.forEach((x) => 작은것.push(`${이름} «${x.글 || '(아이콘)'}» ${(x.짧은쪽 * 0.75).toFixed(1)}mm`));
    } catch { /* 위에서 이미 잡힘 */ }
    await p.close();
  }
  확인('누르는 곳이 모두 9mm 이상이다 (초등학생 손가락 기준)', 작은것.length === 0,
    [...new Set(작은것)].slice(0, 10).join('\n'));
}

await 브라우저.close(); 서버.닫기();
마무리('화면 검사');
