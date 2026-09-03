/* 교가 화면을 실제로 열어 풀어 봅니다. (조사용)
 *
 * 왜 이게 중요한가:
 *   교가는 «학교마다 다른 유일한 화면» 입니다. 배포 구조 전체가 이것 하나 때문에
 *   있습니다. 그런데 지금까지 교가.txt 를 읽는 배관만 봤지,
 *   **화면 자체를 열어 풀어 본 적이 한 번도 없습니다.**
 *
 * 무엇을 보나:
 *   1) 저장소에 들어 있는 «양식 가사» 로도 화면이 제대로 도는가
 *   2) 초성 힌트(ㄱ, ㅊ 같은)가 정답 글자와 맞는가  ← 틀리면 아이가 못 풉니다
 *   3) 빈칸 글자가 보기 타일에 다 있는가
 *   4) 실제로 풀면 정답으로 인정되는가, 끝까지 가면 결과가 나오는가
 *   5) 절(1절·2절)이 여러 개일 때도 넘어가는가
 */
import fs from 'fs';
import path from 'path';
import { 퀴즈, 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

/* 번들에서 교가 자료를 꺼냅니다 */
function 교가자료() {
  const d = path.join(퀴즈, 'song', 'assets');
  const f = fs.readdirSync(d).find((n) => n.endsWith('.js'));
  const s = fs.readFileSync(path.join(d, f), 'utf8');
  const i = s.indexOf('{schoolName:"');
  if (i < 0) return null;
  let 깊이 = 0, j = i;
  for (; j < s.length; j++) {
    if (s[j] === '{') 깊이++;
    else if (s[j] === '}') { 깊이--; if (깊이 === 0) break; }
  }
  const 조각 = s.slice(i, j + 1).replace(/^\{schoolName:/, '{"schoolName":').replace(/,verses:/, ',"verses":');
  try { return JSON.parse(조각); } catch { return null; }
}

/* 한글 첫 자음(초성) 뽑기 — 힌트가 맞는지 검사하려고 */
const 초성표 = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function 초성(글자) {
  const c = 글자.charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return null;
  return 초성표[Math.floor((c - 0xac00) / 588)];
}

제목('■ 교가 화면 — 자료부터 확인');
const 자료 = 교가자료();
if (!자료) { console.log('   ✗ 교가 자료를 꺼내지 못했습니다'); process.exit(0); }
알림(`지금 들어 있는 학교: «${자료.schoolName}»`);
알림(`절 개수: ${자료.verses.length}개 · 줄 수: ${자료.verses.reduce((n, v) => n + v.lines.length, 0)}줄`);

console.log('');
let 초성틀림 = [], 답없음 = [], 빈칸수 = 0;
for (const v of 자료.verses) {
  for (const l of v.lines) {
    const 표시빈칸 = (l.displayParts || []).filter((p) => p.target);
    빈칸수 += 표시빈칸.length;
    for (const p of 표시빈칸) {
      const 진짜 = 초성(p.target);
      if (진짜 && p.choseong && 진짜 !== p.choseong) 초성틀림.push({ 글자: p.target, 적힌힌트: p.choseong, 진짜힌트: 진짜, 줄: l.fullText });
    }
    /* 빈칸 글자가 실제 문장 안에 있는가 */
    for (const a of (l.answers || [])) if (!l.fullText.includes(a)) 답없음.push({ 답: a, 줄: l.fullText });
  }
}
console.log(`   빈칸 ${빈칸수}개`);
console.log(`   ${초성틀림.length ? '✗ 초성 힌트가 틀린 곳 ' + 초성틀림.length + '개' : '✓ 초성 힌트가 전부 정답 글자와 맞습니다'}`);
초성틀림.slice(0, 5).forEach((x) => console.log(`       «${x.글자}» 의 힌트가 ${x.적힌힌트} 로 적혀 있는데 실제로는 ${x.진짜힌트} — "${x.줄}"`));
console.log(`   ${답없음.length ? '✗ 빈칸 글자가 줄 안에 없는 곳 ' + 답없음.length + '개' : '✓ 빈칸 글자가 전부 줄 안에 있습니다'}`);
답없음.slice(0, 5).forEach((x) => console.log(`       «${x.답}» 이 "${x.줄}" 안에 없음`));

/* ── 브라우저로 실제로 풀어 보기 ── */
const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47700);

제목('■ 교가 화면 — 실제로 열어 풀어 보기');
const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await ctx.newPage();
const 오류 = [];
page.on('pageerror', (e) => 오류.push(String(e).slice(0, 70)));
await page.goto(서버.주소 + '/quiz/song/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const f = page.frames()[1];

const 화면 = () => f.evaluate(() => {
  const t = document.body.innerText.replace(/\s+/g, ' ');
  const 타일 = [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter((x) => x.length === 1);
  return { 글: t, 타일, 끝났나: /결과|점수|다시|잘했/.test(t) };
});

const 처음 = await 화면();
console.log('');
알림(`첫 화면: ${처음.글.slice(0, 130)}`);
console.log(`   ${처음.글.includes(자료.schoolName) ? `✓ 학교 이름 «${자료.schoolName}» 이 화면에 나옵니다` : '⚠ 학교 이름이 화면에 안 보입니다'}`);
console.log(`   보기 타일 ${처음.타일.length}개: ${처음.타일.join('')}`);

/* 모든 빈칸을 차례로 눌러 풉니다 */
const 모든답 = [];
for (const v of 자료.verses) for (const l of v.lines) for (const a of (l.answers || [])) 모든답.push(a);

let 누른수 = 0, 못찾은글자 = [];
for (let n = 0; n < 모든답.length + 6; n++) {
  const st = await 화면();
  if (st.끝났나) break;
  const 남은 = 모든답[누른수];
  if (!남은) break;
  if (!st.타일.includes(남은)) { 못찾은글자.push({ 글자: 남은, 보기: st.타일.join('') }); break; }
  await f.evaluate((g) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === g && !x.disabled);
    if (b) b.click();
  }, 남은);
  누른수++;
  await page.waitForTimeout(320);
  /* 다음 줄·다음 절로 넘어가는 단추가 있으면 누릅니다 */
  const 다음 = f.locator('button').filter({ hasText: /다음|계속|확인|절/ }).first();
  if (await 다음.count()) { await 다음.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(700); }
}

await page.waitForTimeout(2500);
const 끝 = await 화면();
console.log('');
console.log(`   눌러 넣은 글자: ${누른수} / ${모든답.length}개`);
console.log(`   ${못찾은글자.length ? `✗ 보기에 없는 글자: «${못찾은글자[0].글자}» (보기: ${못찾은글자[0].보기})` : '✓ 필요한 글자가 보기에 다 있었습니다'}`);
console.log(`   ${끝.끝났나 ? '✓ 끝까지 가서 결과가 나왔습니다' : '⚠ 결과 화면을 못 봤습니다'}`);
알림(`마지막 화면: ${끝.글.slice(0, 160)}`);
console.log(`   ${오류.length ? '✗ 오류: ' + [...new Set(오류)].join(' / ') : '✓ 오류 없음'}`);

await page.screenshot({ path: '/tmp/song.png' });
서버.닫기(); await br.close();
