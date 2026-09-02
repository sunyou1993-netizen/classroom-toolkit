/* 인터넷이 끊긴 채로도 되는가 + 없는 파일을 부르지 않는가. (조사용)
 *
 * 왜:
 *   학교 보드는 인터넷 없이 도는 것이 기본입니다. 실행 파일이 자기 안에서
 *   화면을 내주고, 서비스워커가 파일을 미리 받아 둡니다.
 *   그런데 미리 받아 두는 목록에서 파일 하나가 빠지면, 그 화면은
 *   **인터넷이 있을 때는 멀쩡하고 없을 때만 깨집니다.** 교실에서 처음 발견하게 됩니다.
 *
 * 무엇을 보나:
 *   1) 각 화면이 부르는 모든 파일을 기록해 404(없는 파일)가 있는지
 *   2) 서비스워커가 다 받은 뒤 인터넷을 끊고 다시 열었을 때 되는지
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 화면들 = [
  ['수업도우미 첫화면', '/index.html'], ['타이머', '/timer/'], ['뽀모도로', '/pomodoro/'],
  ['스톱워치', '/stopwatch/'], ['세계시간', '/worldclock/'], ['그림판', '/paint/'],
  ['소음측정기', '/noise/'], ['발표자 선정', '/picker/'], ['피아노', '/instruments/'],
  ['사다리', '/ladder/'], ['퀴즈 첫화면', '/quiz/index.html'], ['환경 퀴즈', '/quiz/environment/'],
  ['안전 퀴즈', '/quiz/safe/'], ['학교폭력 퀴즈', '/quiz/violence/'],
  ['속담', '/quiz/proverb/'], ['사자성어', '/quiz/fourchar/'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47420);

/* ── 1) 없는 파일을 부르는가 ── */
제목('■ 없는 파일을 부르는 화면이 있나');
알림('화면이 부르는 파일을 전부 기록해서 404 를 찾습니다');
console.log('');
const 못찾은것 = [];
const 바깥으로 = [];
{
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  page.on('response', (r) => {
    const u = r.url();
    if (r.status() === 404) 못찾은것.push(u.replace(서버.주소, ''));
    if (!u.startsWith(서버.주소) && !u.startsWith('data:') && !u.startsWith('blob:')) 바깥으로.push(u.slice(0, 80));
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (u.startsWith(서버.주소)) 못찾은것.push(u.replace(서버.주소, '') + ' (연결 실패)');
  });
  for (const [, 길] of 화면들) {
    await page.goto(서버.주소 + 길, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
  await ctx.close();
}
const 없는것 = [...new Set(못찾은것)];
console.log(`   ${없는것.length ? '✗ 없는 파일을 부릅니다:' : '✓ 없는 파일을 부르는 곳 없음'}`);
없는것.slice(0, 25).forEach((u) => console.log(`       ${u}`));
if (없는것.length > 25) console.log(`       … 그리고 ${없는것.length - 25}개 더`);
const 바깥 = [...new Set(바깥으로)];
console.log(`   ${바깥.length ? '✗ 바깥 인터넷으로 나갑니다: ' + 바깥.slice(0, 5).join(', ') : '✓ 바깥 인터넷으로 나가지 않음'}`);

/* ── 2) 인터넷을 끊고 다시 열기 ── */
제목('■ 인터넷을 끊은 채로 다시 열면');
알림('한 번 열어 서비스워커가 파일을 받게 한 뒤, 인터넷을 끊고 다시 엽니다');
console.log('');
console.log('   화면                 글자 나옴   오류   못 받은 파일');
console.log('   ' + '─'.repeat(56));
let 끊겨도됨 = 0, 안됨 = [];
for (const [이름, 길] of 화면들) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  /* 먼저 두 번 열어 서비스워커가 등록되고 캐시를 채우게 합니다 */
  await page.goto(서버.주소 + 길, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.goto(서버.주소 + 길, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);

  /* 인터넷을 끊습니다 */
  const 실패 = [];
  page.on('requestfailed', (r) => 실패.push(r.url().replace(서버.주소, '').slice(0, 40)));
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 40)));
  await ctx.setOffline(true);

  let 글있나 = false;
  try {
    await page.reload({ waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => {
      const fr = document.querySelector('iframe'); const d = fr && fr.contentDocument;
      const t = d && d.body ? d.body : document.body;
      return t && t.innerText.trim().length > 5;
    }, null, { timeout: 15000 });
    글있나 = true;
  } catch { 글있나 = false; }

  const 표 = `   ${이름.padEnd(18)} ${(글있나 ? '  ✓  ' : '  ✗  ').padStart(8)} ${String(오류.length).padStart(5)} ${String([...new Set(실패)].length).padStart(12)}`;
  console.log(표);
  if (글있나 && !오류.length) 끊겨도됨++;
  else 안됨.push({ 이름, 실패: [...new Set(실패)].slice(0, 3), 오류: 오류.slice(0, 2) });
  await ctx.close();
}

console.log('');
if (안됨.length === 0) {
  console.log(`   ✓ 16개 화면 모두 인터넷 없이 열립니다`);
} else {
  console.log(`   ✗ 인터넷이 끊기면 안 되는 화면 ${안됨.length}개:`);
  안됨.forEach((x) => {
    console.log(`       ${x.이름}`);
    if (x.실패.length) console.log(`         못 받은 것: ${x.실패.join(', ')}`);
    if (x.오류.length) console.log(`         오류: ${x.오류.join(' / ')}`);
  });
}

서버.닫기(); await br.close();
