/* 마이크가 없거나 막혔을 때 소음측정기가 어떻게 되나. (조사용)
 *
 * 왜:
 *   소음측정기는 마이크가 있어야 하는 유일한 화면입니다. 그런데
 *     · 보드에 마이크가 없을 수 있고
 *     · 학교에서 마이크 권한을 막아 둘 수 있고
 *     · 선생님이 실수로 「차단」을 누를 수 있습니다
 *   그때 아이들 앞에서 무슨 일이 벌어지는지 보는 것이 이 검사입니다.
 *   "아무 일도 안 일어나고 가만히 있는 것"이 제일 나쁩니다 — 고장인 줄 압니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47410);

const 상황들 = [
  ['① 마이크 권한을 준 경우', 'grant'],
  ['② 권한을 「차단」한 경우', 'deny'],
  ['③ 물어보지도 않은 경우(기본)', 'ask'],
];

제목('■ 마이크가 없거나 막혔을 때 소음측정기');
알림('보드에 마이크가 없거나, 학교에서 막아 두거나, 실수로 차단을 누른 경우입니다');

for (const [이름, 모드] of 상황들) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  if (모드 === 'grant') await ctx.grantPermissions(['microphone'], { origin: 서버.주소 });
  if (모드 === 'deny') await ctx.grantPermissions([], { origin: 서버.주소 });

  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 70)));
  const 콘솔 = [];
  page.on('console', (m) => { if (m.type() === 'error') 콘솔.push(m.text().slice(0, 70)); });

  await page.goto(서버.주소 + '/noise/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const f = page.frames()[1];

  /* 마이크를 켜는 단추를 누릅니다. 「닫기」는 절대 누르면 안 됩니다 (화면이 사라집니다) */
  const 켜기 = f.locator('button').filter({ hasText: /마이크|켜기|측정 시작/ }).first();
  let 눌린것 = '(못 찾음)';
  if (await 켜기.count()) {
    눌린것 = (await 켜기.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 34);
    await 켜기.click({ timeout: 4000 }).catch(() => {});
  }
  await page.waitForTimeout(4000);

  const 상태 = await f.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    return {
      글: t.slice(0, 200),
      안내있나: /마이크|권한|허용|허락|사용할 수 없|연결/.test(t),
      예시라는말: /예시|샘플|데모/.test(t),
      숫자: (t.match(/(\d{1,3})\s*dB/) || [])[1] || null,
    };
  });

  console.log('');
  console.log(`   ${이름}`);
  console.log(`     누른 단추: 「${눌린것}」`);
  console.log(`     마이크 안내 문구: ${상태.안내있나 ? '✓ 있음' : '✗ 없음'}`);
  console.log(`     "예시/샘플" 이라고 알려 주나: ${상태.예시라는말 ? '✓ 알려 줌' : '✗ 안 알려 줌'}`);
  console.log(`     화면에 뜬 숫자: ${상태.숫자 ? 상태.숫자 + ' dB' : '없음'}`);
  console.log(`     오류: ${오류.length || 콘솔.length ? '✗ ' + [...오류, ...콘솔].slice(0, 2).join(' / ') : '✓ 없음'}`);
  console.log(`     화면 글: ${상태.글}`);

  await page.screenshot({ path: `/tmp/mic-${모드}.png` });
  await ctx.close();
}

서버.닫기(); await br.close();
