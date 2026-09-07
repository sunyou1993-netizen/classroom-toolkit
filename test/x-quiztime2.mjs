/* 맞힌 점수가 있는 채로 제한 시간이 다 되면, 그 점수가 남는가. (조사용)
 *
 * 앞선 검사에서 «시간이 다 되면 0점으로 결과가 뜬다» 를 봤습니다.
 * 그때는 답을 아무렇게나 눌렀기 때문에 정말 0점이었을 수 있습니다.
 * 그래서 이번에는 «반드시 맞는 답» 을 눌러 30점을 만들어 놓고,
 * 그 상태로 5분을 흘려 보냅니다. 결과가 30점이면 정상, 0점이면 점수가 날아가는 것입니다.
 *
 * 쓰는 법: node test/x-quiztime2.mjs
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 원본문항, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47842);

/* 원본 문항에서 «문장 → 정답» 표를 만들어 둡니다 */
const 표 = new Map();
for (const x of 원본문항('environment')) 표.set(String(x.q).replace(/\s+/g, ' ').trim(), x.ans);
알림(`원본 문항 ${표.size}개로 정답표를 만들었습니다`);

const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await ctx.newPage();
const 오류 = [];
page.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 70)));
await page.goto(서버.주소 + '/quiz/environment/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const f = page.frames()[1];

const 글 = () => f.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim());
const 지금문장 = async () => ((await 글()).match(/"([^"]{6,})"/) || [])[1] || null;
const 상태 = async () => {
  const t = await 글();
  return {
    시계: (t.match(/남은 시간\s*(\d{1,2}:\d{2})/) || [])[1] || '(없음)',
    번호: (t.match(/문제\s*\d+\s*\/\s*\d+/) || [])[0] || '-',
    점수: (t.match(/(\d+)\s*점/) || [])[0] || '-',
    끝남: /다시 풀어보기|목록으로/.test(t),
    전체: t,
  };
};

제목('■ 30점을 만들어 놓고 제한 시간을 넘겨 봅니다');

let 맞힌수 = 0;
for (let i = 1; i <= 3; i++) {
  const 문장 = await 지금문장();
  const 정답 = 문장 ? 표.get(문장.replace(/\s+/g, ' ').trim()) : null;
  if (!정답) { console.log(`   ${i}번째 문제의 정답을 표에서 못 찾았습니다: ${String(문장).slice(0, 40)}`); break; }
  await f.evaluate((a) => { const b = document.getElementById('btn-choice-' + a.toLowerCase()); if (b) b.click(); }, 정답);
  await page.waitForTimeout(1400);
  const t = await 글();
  const 맞음 = /정답입니다/.test(t);
  if (맞음) 맞힌수++;
  console.log(`   ${i}번째: «${문장.slice(0, 28)}…» 에 ${정답} → ${맞음 ? '맞음' : '틀림'}`);
  await f.evaluate(() => { const n = document.getElementById('btn-next-q'); if (n) n.click(); });
  await page.waitForTimeout(1400);
}
const 시작 = await 상태();
console.log('');
console.log(`   ${맞힌수}문제를 맞힌 상태 (${맞힌수 * 10}점이어야 합니다) · ${시작.번호} · 시계 ${시작.시계}`);
console.log('   이제 아무것도 안 만지고 5분을 흘려 보냅니다…');

let 마지막 = 시작;
for (let 분 = 1; 분 <= 6; 분++) {
  await page.waitForTimeout(60000);
  마지막 = await 상태();
  console.log(`     ${분}분 뒤 — 시계 ${마지막.시계} · ${마지막.번호} · ${마지막.점수} · ${마지막.끝남 ? '끝남' : '진행 중'}`);
  if (마지막.끝남) break;
}

const 나온점수 = parseInt((마지막.점수.match(/\d+/) || [0])[0], 10);
const 맞다 = 나온점수 === 맞힌수 * 10;
console.log('');
console.log('   ── 시간이 다 된 뒤 결과 화면 ──');
console.log('   ', 마지막.전체.slice(0, 240));
console.log('');
console.log(`   맞힌 문제 ${맞힌수}개 → 나와야 할 점수 ${맞힌수 * 10}점 · 실제로 나온 점수 ${나온점수}점`);
console.log(`   ${맞다 ? '✓ 시간이 다 돼도 그때까지 맞힌 점수는 그대로 남습니다'
  : '✗ 시간이 다 되면 그때까지 맞힌 점수가 사라집니다 — 아이들이 억울해합니다'}`);
console.log(`   ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 자바스크립트 오류 없음'}`);

서버.닫기(); await br.close();
console.log('');
