/* 퀴즈 5종을 실제로 끝까지 풀어 봅니다. (조사용)
 *
 * 무엇을 보나:
 *   · 10문제를 끝까지 풀 수 있는가 (중간에 막히지 않는가)
 *   · 일부러 다 맞히면 100점, 일부러 다 틀리면 0점이 나오는가
 *   · 맞았을 때/틀렸을 때 알려 주는 말이 정확한가
 *   · 결과 화면이 뜨고 «다시 풀기» 가 되는가
 *   · 푸는 동안 오류가 나지 않는가
 *
 * 왜 «일부러 다 틀리기» 까지 하나:
 *   다 맞히기만 시험하면, 채점이 «무조건 정답» 이어도 통과합니다.
 *   반대쪽을 같이 봐야 채점이 진짜 맞는지 알 수 있습니다.
 */
import fs from 'fs';
import path from 'path';
import { 퀴즈, 원본문항, 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 퀴즈들 = [
  ['환경', '/quiz/environment/', 'environment'],
  ['안전', '/quiz/safe/', 'safe'],
  ['학교폭력', '/quiz/violence/', 'violence'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47460);

/* 정답표: 문장 → 정답 (O/X 퀴즈용) */
function 정답표(갈래) {
  if (!갈래) return null;
  const m = new Map();
  for (const x of 원본문항(갈래)) m.set((x.q || '').replace(/\s+/g, ' ').trim(), x.ans);
  return m;
}

async function 한판(길, 갈래, 일부러틀리기) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const f = page.frames()[1];
  const 표 = 정답표(갈래);

  const 읽기 = () => f.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    const 번호 = t.match(/문제\s*(\d+)\s*\/\s*(\d+)/);
    const 문장 = t.match(/"([^"]{6,})"/);
    return {
      글: t, 번호: 번호 ? +번호[1] : null, 전체: 번호 ? +번호[2] : null,
      문장: 문장 ? 문장[1] : '',
      결과화면: /점|정답률|다시|결과/.test(t) && !번호,
    };
  });

  let 푼수 = 0, 맞게답함 = 0, 피드백틀림 = 0, 막힘 = null;
  for (let i = 0; i < 14; i++) {
    const 상태 = await 읽기();
    if (상태.결과화면) break;
    if (상태.번호 === null) { 막힘 = '문제 번호를 못 읽음'; break; }

    /* 정답을 알면 그대로(또는 일부러 반대로) 누릅니다 */
    let 누를것 = 'O';
    let 진짜정답 = null;
    if (표) {
      진짜정답 = 표.get(상태.문장.replace(/\s+/g, ' ').trim()) || null;
      if (진짜정답) 누를것 = 일부러틀리기 ? (진짜정답 === 'O' ? 'X' : 'O') : 진짜정답;
    }

    const 단추 = f.locator(`#btn-choice-${누를것.toLowerCase()}`);
    const 있나 = await 단추.count();
    if (!있나) {
      /* 속담·사자성어는 O/X 가 아니라 보기 중 고르기입니다 */
      const 보기 = f.locator('button').filter({ hasNotText: /닫기|뒤로|다음|그만/ });
      const n = await 보기.count();
      if (!n) { 막힘 = '누를 단추를 못 찾음'; break; }
      await 보기.nth(일부러틀리기 ? n - 1 : 0).click({ timeout: 5000 }).catch(() => {});
    } else {
      await 단추.click({ timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(900);

    /* 알려 주는 말이 정답과 맞는지 */
    if (진짜정답) {
      const 뒤 = await f.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      const 맞다고함 = /정답입니다|맞았|참 잘|🎉/.test(뒤);
      const 틀리다고함 = /아쉬|틀렸|다시 생각|💡/.test(뒤);
      const 실제로맞음 = !일부러틀리기;
      if (맞다고함 !== 실제로맞음 && (맞다고함 || 틀리다고함)) 피드백틀림++;
      else if (맞다고함 === 실제로맞음) 맞게답함++;
    }

    /* 마지막 문제에서는 «다음 문제» 대신 «결과 보기» 가 나옵니다.
       이걸 안 누르면 결과 화면에 영영 도달하지 못합니다. (제가 처음에 놓쳤습니다) */
    const 넘기기 = f.locator('button').filter({ hasText: /다음|결과 보기/ }).first();
    if (await 넘기기.count()) { await 넘기기.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(1100); }
    푼수++;
  }

  await page.waitForTimeout(2500);
  const 끝 = await 읽기();
  /* 점수는 «결과 화면» 에서만 읽습니다. 해설 안의 숫자("약 4.4%를 아껴요")를
     점수로 잘못 읽은 적이 있어서, 앞뒤 말까지 같이 확인합니다. */
  const 점수 = (끝.글.match(/(\d{1,3})\s*점\s*(?:.*?(?:기록|맞|정답))?/) || [])[1] || null;
  const 다시있나 = await f.locator('button').filter({ hasText: /다시|한 번 더|처음/ }).count();

  await ctx.close();
  return { 푼수, 점수, 피드백틀림, 맞게답함, 오류: [...new Set(오류)], 막힘, 결과화면: 끝.결과화면, 다시있나, 끝글: 끝.글.slice(0, 120) };
}

제목('■ 퀴즈 5종을 끝까지 풀어 보기');
알림('일부러 다 맞히기 / 일부러 다 틀리기 를 각각 한 판씩 합니다');
console.log('');
console.log('   퀴즈        다 맞히면   다 틀리면   푼문제  결과화면  다시풀기  오류');
console.log('   ' + '─'.repeat(68));

for (const [이름, 길, 갈래] of 퀴즈들) {
  const a = await 한판(길, 갈래, false);
  const b = await 한판(길, 갈래, true);
  const 점 = (x) => (x.점수 !== null ? x.점수 + '점' : '(못읽음)');
  console.log(`   ${이름.padEnd(10)}${점(a).padStart(9)}${점(b).padStart(11)}${String(a.푼수).padStart(8)}`
    + `${(a.결과화면 ? '  ✓' : '  ✗').padStart(9)}${(a.다시있나 ? '  ✓' : '  ✗').padStart(9)}`
    + `${(a.오류.length + b.오류.length ? '  ✗' : '  ✓').padStart(6)}`);
  if (a.막힘 || b.막힘) console.log(`       ⚠ 막힘: ${a.막힘 || b.막힘}`);
  if (a.피드백틀림 || b.피드백틀림) console.log(`       ✗ 맞다/틀리다 알림이 어긋난 문제: ${a.피드백틀림 + b.피드백틀림}개`);
  if (a.오류.length) console.log(`       오류: ${a.오류.join(' / ')}`);
  if (갈래 && a.점수 !== null && a.점수 !== '100') console.log(`       ⚠ 다 맞혔는데 100점이 아닙니다 (${a.점수}) — 화면 글: ${a.끝글}`);
  if (갈래 && b.점수 !== null && b.점수 !== '0') console.log(`       ⚠ 다 틀렸는데 0점이 아닙니다 (${b.점수}) — 화면 글: ${b.끝글}`);
}

서버.닫기(); await br.close();
