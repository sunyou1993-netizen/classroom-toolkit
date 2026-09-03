/* 속담·사자성어를 실제로 풀어 봅니다. (조사용)
 *
 * 이 두 개는 O/X 가 아니라 «빈칸에 글자 타일을 끼우는» 놀이입니다.
 *   사자성어:  모 삼 (孟母三遷)  →  빈칸에 '맹', '천' 을 끼워야 합니다
 *   보기 타일: 지 골 급 천 안 탐 공 맹 망 행 육 삼 체 치
 *
 * 여기서 제일 무서운 고장은 이것입니다.
 *   **필요한 글자가 보기 타일에 없으면, 아이는 아무리 해도 못 풉니다.**
 *   화면은 멀쩡해 보이는데 답이 아예 존재하지 않습니다.
 *   한 판에 10문제씩 무작위로 나오므로, 손으로 눌러 보다가 발견하기 어렵습니다.
 *
 * 그래서 전체 문항을 상대로 돌려 봅니다.
 *   1) 필요한 글자가 보기에 다 있는가
 *   2) 실제로 끼우면 «정답» 이 뜨는가
 *   3) 10문제를 끝까지 풀면 결과가 나오는가
 */
import fs from 'fs';
import path from 'path';
import { 퀴즈, 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

/* 번들에서 낱말 자료를 꺼냅니다 */
function 자료꺼내기(갈래, 열쇠) {
  const d = path.join(퀴즈, 갈래, 'assets');
  const f = fs.readdirSync(d).find((n) => n.endsWith('.js'));
  const s = fs.readFileSync(path.join(d, f), 'utf8');
  /* 자료마다 항목 순서가 다릅니다 (속담은 targets 가 meaning 보다 앞).
     그래서 «한 덩어리» 를 먼저 자르고, 그 안에서 항목을 따로 찾습니다. */
  const 목록 = [];
  const re = new RegExp(`\\{${열쇠}:"([^"]+)"([^{}]*)`, 'g');
  let m;
  while ((m = re.exec(s))) {
    const 덩어리 = m[2];
    const 뜻 = (덩어리.match(/meaning:"([^"]+)"/) || [])[1] || '';
    const 빈칸 = ((덩어리.match(/targets:\[([^\]]*)\]/) || [])[1] || '')
      .split(',').map((x) => x.replace(/"/g, '').trim()).filter(Boolean);
    if (뜻 || 빈칸.length) 목록.push({ 낱말: m[1], 뜻, 빈칸 });
  }
  return 목록;
}

const 대상 = [
  ['사자성어', '/quiz/fourchar/', 'fourchar', 'idiom'],
  ['속담', '/quiz/proverb/', 'proverb', 'proverb'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47470);

제목('■ 속담·사자성어를 실제로 풀어 보기');
알림('제일 무서운 고장: 필요한 글자가 보기 타일에 없어서 아예 못 푸는 문제');

for (const [이름, 길, 갈래, 열쇠] of 대상) {
  let 자료 = 자료꺼내기(갈래, 열쇠);
  if (!자료.length) 자료 = 자료꺼내기(갈래, 'proverb').concat(자료꺼내기(갈래, 'idiom'));
  console.log('');
  console.log(`   ── ${이름} (자료 ${자료.length}개) ──`);
  if (!자료.length) { console.log('     ✗ 낱말 자료를 못 꺼냈습니다'); continue; }

  const 뜻으로 = new Map(자료.map((x) => [x.뜻.replace(/\s+/g, ' ').trim(), x]));

  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  const 오류 = [];
  page.on('pageerror', (e) => 오류.push(String(e).slice(0, 60)));
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const f = page.frames()[1];

  let 푼수 = 0, 정답뜸 = 0, 타일없음 = [], 자료없음 = 0, 결과화면 = false;

  for (let n = 0; n < 12; n++) {
    const 화면 = await f.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ');
      const 뜻 = t.match(/"([^"]{6,})"/);
      const 번호 = t.match(/(\d+)\s*\/\s*(\d+)/);
      const 타일 = [...document.querySelectorAll('button')]
        .map((b) => b.innerText.trim())
        .filter((x) => x.length === 1);
      return {
        뜻: 뜻 ? 뜻[1] : '', 번호: 번호 ? +번호[1] : null, 전체: 번호 ? +번호[2] : null,
        타일, 글: t.slice(0, 160),
        끝났나: /결과|점수|정답률|다시 풀기|맞혔/.test(t) && !번호,
      };
    });
    if (화면.끝났나) { 결과화면 = true; break; }
    if (!화면.뜻) break;

    const 답 = 뜻으로.get(화면.뜻.replace(/\s+/g, ' ').trim());
    if (!답) { 자료없음++; }
    else {
      /* 1) 필요한 글자가 보기에 다 있는가 */
      const 없는것 = 답.빈칸.filter((g) => !화면.타일.includes(g));
      if (없는것.length) 타일없음.push({ 낱말: 답.낱말, 없는것, 타일: 화면.타일.join('') });
      else {
        /* 2) 실제로 끼워 봅니다.
           타일은 글자 하나짜리 단추입니다. Playwright 의 글자 맞추기로는 안 잡혀서
           («선» 같은 한 글자를 못 찾습니다) 화면 안에서 직접 눌렀습니다. */
        for (const 글자 of 답.빈칸) {
          await f.evaluate((g) => {
            const b = [...document.querySelectorAll('button')]
              .find((x) => x.innerText.trim() === g && !x.disabled);
            if (b) b.click();
          }, 글자);
          await page.waitForTimeout(300);
        }
        await page.waitForTimeout(900);
        const 판정 = await f.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
        if (/정답|맞|참 잘|🎉|잘했/.test(판정)) 정답뜸++;
      }
    }
    푼수++;

    /* 다음으로 */
    const 다음 = f.locator('button').filter({ hasText: /다음|계속|확인/ }).first();
    if (await 다음.count()) { await 다음.click({ timeout: 4000 }).catch(() => {}); }
    else {
      const 패스 = f.locator('#btn-pass-question');
      if (await 패스.count()) await 패스.click({ timeout: 4000 }).catch(() => {});
    }
    await page.waitForTimeout(1100);
  }

  console.log(`     푼 문제: ${푼수}개 · 정답으로 인정된 것: ${정답뜸}개`);
  console.log(`     ${타일없음.length ? '✗ 필요한 글자가 보기에 없던 문제 ' + 타일없음.length + '개' : '✓ 필요한 글자가 보기에 다 있었습니다'}`);
  타일없음.slice(0, 3).forEach((x) => console.log(`         «${x.낱말}» 에 필요한 «${x.없는것.join(',')}» 이 보기에 없음 (보기: ${x.타일})`));
  if (자료없음) console.log(`     ⚠ 화면에 나온 문제 ${자료없음}개를 자료에서 못 찾았습니다 (제 대조 방법 문제일 수 있습니다)`);
  console.log(`     ${결과화면 ? '✓ 결과 화면까지 갔습니다' : '⚠ 결과 화면을 못 봤습니다 (10문제를 다 못 풀었을 수 있습니다)'}`);
  console.log(`     ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 오류 없음'}`);

  await ctx.close();
}

/* ── 전체 문항을 상대로: 필요한 글자가 «자료 안에» 다 있는가 (브라우저 없이) ── */
제목('■ 전체 문항 점검 — 빈칸 글자가 낱말 안에 실제로 있는가');
알림('한 판에 10개만 나오므로, 눌러 보는 것으로는 전체를 못 봅니다. 자료 전체를 봅니다.');
console.log('');
for (const [이름, , 갈래, 열쇠] of 대상) {
  const 자료 = 자료꺼내기(갈래, 열쇠);
  if (!자료.length) { console.log(`   ${이름}: 자료를 못 꺼냄`); continue; }
  const 이상 = 자료.filter((x) => x.빈칸.some((g) => !x.낱말.includes(g)));
  const 빈칸없음 = 자료.filter((x) => !x.빈칸.length);
  const 전부빈칸 = 자료.filter((x) => x.빈칸.length >= [...x.낱말.replace(/\s/g, '')].length);
  console.log(`   ${이름.padEnd(8)} ${자료.length}개 · 빈칸 글자가 낱말에 없는 것 ${이상.length}개 ${이상.length ? '✗' : '✓'}`
    + ` · 빈칸이 0개인 것 ${빈칸없음.length}개 ${빈칸없음.length ? '✗' : '✓'}`
    + ` · 전부 빈칸인 것 ${전부빈칸.length}개 ${전부빈칸.length ? '⚠' : '✓'}`);
  이상.slice(0, 3).forEach((x) => console.log(`       «${x.낱말}» 의 빈칸 ${x.빈칸.join(',')}`));
}

서버.닫기(); await br.close();
