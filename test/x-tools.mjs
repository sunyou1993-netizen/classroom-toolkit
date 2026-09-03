/* 도구들을 실제로 «써» 봅니다. (조사용)
 *
 * 화면이 열리는지는 이미 봤습니다. 여기서는 수업 중에 실제로 하는 일을 합니다.
 *   타이머    시간을 맞추고 시작해서 0 이 될 때까지 두기 (알림이 오나)
 *   스톱워치  시작 → 랩 → 멈춤 → 초기화
 *   그림판    선을 긋고 → 되돌리기 → 전체 지우기 → 내보내기
 *   발표자    이름을 넣고 여러 번 뽑기 (같은 아이만 계속 나오지 않나)
 *   피아노    건반을 눌러 소리가 나나
 *   세계시간  도시 더하기·빼기
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47600);

async function 열기(길, 소리켜기) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  if (소리켜기) {
    /* 소리가 실제로 나는지 보려면, 소리 장치가 만들어졌는지 세어야 합니다 */
    await ctx.addInitScript(() => {
      window.__소리 = { 만든횟수: 0, 낸소리: 0 };
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const 원래 = AC.prototype.createOscillator;
        AC.prototype.createOscillator = function () { window.__소리.낸소리++; return 원래.apply(this, arguments); };
        window.AudioContext = function (...a) { window.__소리.만든횟수++; return new AC(...a); };
        window.AudioContext.prototype = AC.prototype;
      }
    });
  }
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2200);
  return { ctx, page, f: page.frames()[1], 오류 };
}
const 글 = (f) => f.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const 누르기 = async (f, 무엇) => f.evaluate((t) => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').replace(/\s+/g, ' ').includes(t) && !x.disabled);
  if (b) { b.click(); return true; } return false;
}, 무엇);

제목('■ 도구를 실제로 써 보기');

/* ── 타이머: 10초로 맞추고 0 까지 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/timer/', true);
  console.log('');
  console.log('   ── 타이머 ──');
  const 처음 = await 글(f);
  const 시간읽기 = () => f.evaluate(() => {
    const m = document.body.innerText.replace(/\s+/g, ' ').match(/(\d{1,2}):(\d{2})/);
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  });
  await 누르기(f, '시작');
  await page.waitForTimeout(3500);
  const a = await 시간읽기();
  await page.waitForTimeout(4000);
  const b = await 시간읽기();
  console.log(`     시작 뒤 시간이 줄어드나: ${a} → ${b}  ${b !== null && a !== null && b < a ? '✓' : '✗'}`);
  const 멈춤 = await 누르기(f, '일시') || await 누르기(f, '정지') || await 누르기(f, '멈춤');
  await page.waitForTimeout(2500);
  const c = await 시간읽기();
  await page.waitForTimeout(2500);
  const d = await 시간읽기();
  console.log(`     멈춤 단추가 있나: ${멈춤 ? '✓' : '✗ 못 찾음'}${멈춤 ? ` · 멈추면 안 줄어드나: ${c === d ? '✓' : '✗ 계속 줄어듭니다'}` : ''}`);
  const 소리 = await f.evaluate(() => window.__소리 || null);
  console.log(`     소리 장치를 쓰나: ${소리 && (소리.만든횟수 || 소리.낸소리) ? '✓' : '· 아직 안 씀(0초에 울릴 수 있음)'}`);
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

/* ── 스톱워치 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/stopwatch/', false);
  console.log('');
  console.log('   ── 스톱워치 ──');
  await 누르기(f, '시작');
  await page.waitForTimeout(2500);
  const 랩 = await 누르기(f, '랩') || await 누르기(f, '구간') || await 누르기(f, '기록');
  await page.waitForTimeout(1500);
  const 글자 = await 글(f);
  console.log(`     시작하면 시간이 흐르나: ${/0[0-9]:0[1-9]|00:0[1-9]/.test(글자) ? '✓' : '?'}`);
  console.log(`     랩(구간 기록) 단추가 있나: ${랩 ? '✓' : '✗ 못 찾음'}`);
  const 초기화 = await 누르기(f, '초기화') || await 누르기(f, '리셋');
  await page.waitForTimeout(1200);
  const 뒤 = await 글(f);
  console.log(`     초기화가 되나: ${초기화 ? (/00:00/.test(뒤) ? '✓' : '⚠ 0 으로 안 돌아감') : '✗ 단추 못 찾음'}`);
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

/* ── 그림판 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/paint/', false);
  console.log('');
  console.log('   ── 그림판 ──');
  const 캔버스 = f.locator('canvas').first();
  const 있나 = await 캔버스.count();
  let 그려짐 = false, 지워짐 = false;
  if (있나) {
    const 상자 = await 캔버스.boundingBox();
    const 픽셀세기 = () => f.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return -1;
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4 * 37) if (d[i] > 10) n++;   // 띄엄띄엄 세기
      return n;
    });
    const 전 = await 픽셀세기();
    /* 손가락으로 선을 긋듯 */
    await page.mouse.move(상자.x + 상자.width * 0.3, 상자.y + 상자.height * 0.4);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(상자.x + 상자.width * (0.3 + 0.03 * i), 상자.y + 상자.height * (0.4 + 0.02 * i));
      await page.waitForTimeout(35);
    }
    await page.mouse.up();
    await page.waitForTimeout(900);
    const 후 = await 픽셀세기();
    그려짐 = 후 > 전;
    console.log(`     선을 그으면 그려지나: ${그려짐 ? '✓' : '✗'} (찍힌 점 ${전} → ${후})`);

    const 되돌리기 = await 누르기(f, '되돌리') || await 누르기(f, '실행 취소');
    await page.waitForTimeout(900);
    const 되돌린뒤 = await 픽셀세기();
    console.log(`     되돌리기: ${되돌리기 ? (되돌린뒤 < 후 ? '✓ 지워짐' : '⚠ 눌리는데 안 지워짐') : '✗ 단추 못 찾음'}`);

    const 전체지우기 = await 누르기(f, '전체') || await 누르기(f, '지우기') || await 누르기(f, '새로');
    await page.waitForTimeout(1200);
    const 지운뒤 = await 픽셀세기();
    지워짐 = 지운뒤 <= 전 + 2;
    console.log(`     전체 지우기: ${전체지우기 ? (지워짐 ? '✓' : '⚠ 눌리는데 안 지워짐') : '✗ 단추 못 찾음'}`);
  } else console.log('     ✗ 그림판(canvas)을 못 찾았습니다');
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

/* ── 발표자 선정 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/picker/', false);
  console.log('');
  console.log('   ── 발표자 선정 ──');
  const 뽑힌것 = [];
  for (let i = 0; i < 6; i++) {
    await 누르기(f, '시작');
    await page.waitForTimeout(4500);
    const t = await 글(f);
    const m = t.match(/(?:당첨|발표자|뽑힌|축하)[^가-힣]*([가-힣A-Za-z0-9]{1,12})/);
    뽑힌것.push(m ? m[1] : '(못읽음)');
    /* 다시 하기 */
    await 누르기(f, '다시') || await 누르기(f, '한 번 더') || await 누르기(f, '닫기');
    await page.waitForTimeout(1200);
  }
  const 읽은것 = 뽑힌것.filter((x) => x !== '(못읽음)');
  console.log(`     6번 뽑은 결과: ${뽑힌것.join(', ')}`);
  if (읽은것.length >= 4) {
    const 서로다름 = new Set(읽은것).size;
    console.log(`     ${서로다름 === 1 ? '⚠ 6번 다 같은 사람이 나왔습니다' : `✓ 서로 다른 사람이 ${서로다름}명 나왔습니다`}`);
  } else console.log('     · 결과 글자를 읽지 못해 판단은 보류합니다');
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

/* ── 피아노 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/instruments/', true);
  console.log('');
  console.log('   ── 피아노 ──');
  const 건반 = f.locator('[class*="key"], button').first();
  const 상자 = await 건반.boundingBox().catch(() => null);
  if (상자) {
    for (let i = 0; i < 3; i++) {
      await page.mouse.click(상자.x + 상자.width / 2, 상자.y + 상자.height * 0.8);
      await page.waitForTimeout(400);
    }
  }
  await page.waitForTimeout(800);
  const 소리 = await f.evaluate(() => window.__소리 || null);
  console.log(`     건반을 누르면 소리를 만드나: ${소리 && (소리.낸소리 > 0 || 소리.만든횟수 > 0) ? `✓ (소리 ${소리.낸소리}개)` : '✗ 소리 장치를 안 씀'}`);
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

/* ── 세계시간 ── */
{
  const { ctx, page, f, 오류 } = await 열기('/worldclock/', false);
  console.log('');
  console.log('   ── 세계시간 ──');
  const 도시수 = () => f.evaluate(() => (document.body.innerText.match(/\d{1,2}:\d{2}/g) || []).length);
  const 전 = await 도시수();
  const 더하기 = await 누르기(f, '추가') || await 누르기(f, '도시') || await 누르기(f, '+');
  await page.waitForTimeout(1500);
  const 후 = await 도시수();
  console.log(`     시각이 보이는 도시: ${전}곳`);
  console.log(`     도시 추가 단추: ${더하기 ? (후 !== 전 ? '✓ 늘어남' : '· 눌렸지만 목록이 열린 듯') : '✗ 못 찾음'}`);
  console.log(`     오류: ${오류.length ? '✗ ' + 오류.join(' / ') : '✓ 없음'}`);
  await ctx.close();
}

서버.닫기(); await br.close();
console.log('');
