/* 퀴즈의 «남은 시간 5:00» 이 다 됐을 때 무슨 일이 나는가. (조사용)
 *
 * 왜 보나:
 *   퀴즈 화면 위에 5분짜리 시계가 돌아갑니다.
 *   수업 중에는 아이들이 손 들고 이야기하다가 5분을 그냥 넘기는 일이 흔합니다.
 *   그때 화면이 멈추는지, 점수가 날아가는지, 그냥 계속 되는지를 봐야
 *   선생님한테 «시간 지나면 이렇게 됩니다» 라고 말할 수 있습니다.
 *
 * 실제로 5분을 기다립니다. 검사에 6분쯤 걸립니다.
 *
 * 쓰는 법: node test/x-quiztime.mjs
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47841);
const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await ctx.newPage();
const 오류 = [];
page.on('pageerror', (e) => 오류.push(String(e).split('\n')[0].slice(0, 70)));
await page.goto(서버.주소 + '/quiz/environment/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const f = page.frames()[1];

const 글 = () => f.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim());
const 상태 = async () => {
  const t = await 글();
  return {
    시계: (t.match(/남은 시간\s*(\d{1,2}:\d{2})/) || [])[1] || '(없음)',
    번호: (t.match(/문제\s*\d+\s*\/\s*\d+/) || [])[0] || '-',
    점수: (t.match(/(\d+)\s*점/) || [])[0] || '-',
    끝남: /결과|다시 풀어보기|목록으로/.test(t),
    전체: t,
  };
};

제목('■ 퀴즈 제한 시간(5분)이 다 됐을 때');
알림('아이들이 이야기하다 5분을 그냥 넘기는 상황입니다. 실제로 5분을 기다립니다');

/* 두 문제만 풀어 두고 나머지 시간은 그냥 흘려 보냅니다 */
for (let i = 0; i < 2; i++) {
  await f.evaluate(() => { const o = document.getElementById('btn-choice-o'); if (o) o.click(); });
  await page.waitForTimeout(1300);
  await f.evaluate(() => { const n = document.getElementById('btn-next-q'); if (n) n.click(); });
  await page.waitForTimeout(1300);
}
const 시작 = await 상태();
console.log('');
console.log(`   두 문제를 풀어 둔 상태: ${시작.번호} · 시계 ${시작.시계}`);
console.log('   이제 아무것도 안 만지고 기다립니다…');

let 마지막 = 시작;
for (let 분 = 1; 분 <= 6; 분++) {
  await page.waitForTimeout(60000);
  마지막 = await 상태();
  console.log(`     ${분}분 뒤 — 시계 ${마지막.시계} · ${마지막.번호} · ${마지막.점수} · ${마지막.끝남 ? '끝남' : '진행 중'}`);
  if (마지막.끝남) break;
}

console.log('');
console.log('   ── 시간이 다 된 뒤 화면 ──');
console.log('   ', 마지막.전체.slice(0, 260));

/* 시간이 다 된 뒤에도 답을 누를 수 있는가 */
const 눌러봄 = await f.evaluate(() => {
  const o = document.getElementById('btn-choice-o');
  if (!o) return '답 단추가 사라졌습니다';
  o.click(); return '답 단추가 아직 있습니다 (눌러 봤습니다)';
});
await page.waitForTimeout(1500);
const 뒤 = await 상태();
console.log('');
console.log(`   시간이 다 된 뒤 O 를 눌러 보니: ${눌러봄}`);
console.log(`     → ${뒤.번호} · ${뒤.점수} · ${뒤.끝남 ? '끝난 화면 그대로' : '진행 중'}`);
console.log(`   ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 자바스크립트 오류 없음'}`);

/* 다시 시작이 되는가 */
const 다시 = await f.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /다시|처음|목록/.test(x.innerText));
  if (!b) return false; b.click(); return true;
});
await page.waitForTimeout(2200);
const 새로 = await 상태();
console.log(`   «다시 풀어보기» 가 있나: ${다시 ? '있음' : '없음'} · 누른 뒤 시계 ${새로.시계} · ${새로.번호}`);
console.log(`   ${다시 && 새로.시계 !== '(없음)' ? '✓ 시간이 다 돼도 바로 다시 시작할 수 있습니다' : '⚠ 확인 필요'}`);

서버.닫기(); await br.close();
console.log('');
