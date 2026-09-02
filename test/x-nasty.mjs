/* 사다리·발표자 선정에 '못된 이름'을 넣어 봅니다. (조사용)
 * 아이들이 장난으로 넣을 만한 것, 그리고 공격에 쓰이는 것들입니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 못된이름 = [
  ['HTML 그림 태그', '<img src=x onerror="window.__털림=1">'],
  ['스크립트 태그', '<script>window.__털림2=1</script>'],
  ['아주 긴 이름 120자', '김'.repeat(120)],
  ['이모지 여러 개', '\u{1F467}\u{1F3FD}‍\u{1F393}\u{1F1F0}\u{1F1F7}\u{1F600}\u{1F600}'],
  ['공백만', '   '],
  ['따옴표 깨기', '"><b>굵게</b>'],
  ['보이지 않는 글자', '김철수​​​'],
  ['아주 넓은 글자', 'ﷺ﷽'],
  ['글자 방향 뒤집기', '‮' + 'abc'],
  ['줄바꿈', 'a\nb\nc'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47371);

const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const 콘솔오류 = [];
page.on('pageerror', (e) => 콘솔오류.push(String(e).slice(0, 90)));

await page.goto(서버.주소 + '/ladder/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);
const f = page.frames()[1];

제목('■ 사다리 — 못된 이름 넣어 보기');

/* 인원을 최대까지 올려 봅니다 */
for (let i = 0; i < 30; i++) {
  const 전 = await f.evaluate(() => [...document.querySelectorAll('input[type=text]')].filter(e=>e.placeholder!=='선택').length);
  await f.locator('button:has-text("+")').first().click().catch(() => {});
  await page.waitForTimeout(90);
  const 후 = await f.evaluate(() => [...document.querySelectorAll('input[type=text]')].filter(e=>e.placeholder!=='선택').length);
  if (후 === 전) break;
}
const 인원 = await f.evaluate(() => [...document.querySelectorAll('input[type=text]')].filter(e=>e.placeholder!=='선택').length);
알림(`+ 를 계속 눌렀을 때 늘어나는 최대 인원: ${인원}명`);
알림('참고: 초등학교 한 반은 보통 20~28명입니다');

const 칸 = f.locator('input[type=text]').filter({ hasNot: f.locator('[placeholder="선택"]') });
const 넣은것 = [];
for (let i = 0; i < Math.min(인원, 못된이름.length); i++) {
  await 칸.nth(i).fill(못된이름[i][1]);
  넣은것.push(못된이름[i][0]);
}
await page.waitForTimeout(400);

/* 결과 칸은 «💣꽝 / ✅당첨» 단추로 정합니다. 번갈아 눌러 채웁니다. */
const 꽝 = f.locator('button:has-text("💣꽝")');
const 당첨 = f.locator('button:has-text("✅당첨")');
const 줄수 = await 꽝.count();
for (let i = 0; i < 줄수; i++) {
  await (i % 2 ? 당첨 : 꽝).nth(i).click({ timeout: 3000 }).catch(() => {});
}
await page.waitForTimeout(400);

await f.locator('button:has-text("시작하기")').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(4000);

const 바깥 = await page.evaluate(() => ({ a: !!window.__털림, b: !!window.__털림2 }));
const 안쪽 = await f.evaluate(() => ({
  a: !!window.__털림, b: !!window.__털림2,
  넘침: document.documentElement.scrollWidth > document.documentElement.clientWidth + 4,
  가로: document.documentElement.scrollWidth, 화면: document.documentElement.clientWidth,
  태그남았나: /<img|<script|<b>/i.test(document.body.innerHTML.replace(/&lt;/g, '<')) ,
  글: document.body.innerText.replace(/\s+/g, ' ').slice(0, 240),
}));

console.log('');
알림(`넣은 이름: ${넣은것.join(', ')}`);
console.log('');
console.log(`   ${바깥.a || 바깥.b ? '✗ 스크립트가 실행됐습니다 (바깥틀)' : '✓ 스크립트가 실행되지 않음 (바깥틀)'}`);
console.log(`   ${안쪽.a || 안쪽.b ? '✗ 스크립트가 실행됐습니다 (화면 안)' : '✓ 스크립트가 실행되지 않음 (화면 안)'}`);
console.log(`   ${안쪽.넘침 ? `✗ 화면이 가로로 넘침 (${안쪽.가로} > ${안쪽.화면})` : '✓ 화면이 가로로 안 넘침'}`);
console.log(`   ${콘솔오류.length ? '✗ 오류: ' + 콘솔오류.join(' / ') : '✓ 자바스크립트 오류 없음'}`);
console.log('');
알림(`화면 글: ${안쪽.글}`);

await page.screenshot({ path: '/tmp/ladder-nasty.png' });
서버.닫기(); await br.close();
