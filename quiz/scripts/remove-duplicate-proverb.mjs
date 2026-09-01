/* 중복 속담 한 개를 뺍니다.
 *
 * 무엇이 중복이었나:
 *   "말 한마디로 천 냥 빚을 갚는다"  (13번쯤)
 *   "말 한마디에 천 냥 빚도 갚는다"  (뒤쪽)
 *   같은 속담인데 조사만 다르게 두 번 들어가 있었습니다.
 *   한 판에 둘 다 나오면 아이 눈에는 같은 문제가 두 번 나온 것처럼 보입니다.
 *
 * 어느 쪽을 뺐나:
 *   표준국어대사전 표제어가 "말 한마디에 천 냥 빚도 갚는다" 입니다.
 *   그래서 사전에 없는 표기인 "말 한마디로 천 냥 빚을 갚는다" 를 뺐습니다.
 *
 * 나머지 11개(모로 가도 서울만…, 도토리 키 재기 등)는 그대로 둡니다.
 *
 * 사용법: node scripts/remove-duplicate-proverb.mjs   (퀴즈 폴더에서)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 뺄것 = '말 한마디로 천 냥 빚을 갚는다';
const 남길것 = '말 한마디에 천 냥 빚도 갚는다';

const 파일들 = fs.readdirSync(path.join(ROOT, 'proverb', 'assets'))
  .filter((n) => n.endsWith('.js')).map((n) => path.join(ROOT, 'proverb', 'assets', n));

/* 한 항목은 {proverb:"…",targets:[…],meaning:"…",category:"…"} 모양입니다.
 * 여는 중괄호부터 짝이 맞는 닫는 중괄호까지를 통째로 들어냅니다.
 * (문자열 안의 중괄호에 속지 않도록 따옴표 안은 건너뜁니다) */
function 항목잘라내기(s, 자리) {
  let 시작 = s.lastIndexOf('{', 자리);
  let i = 시작, 깊이 = 0, 따옴표 = false;
  for (; i < s.length; i++) {
    const c = s[i];
    if (따옴표) { if (c === '\\') i++; else if (c === '"') 따옴표 = false; continue; }
    if (c === '"') { 따옴표 = true; continue; }
    if (c === '{') 깊이++;
    else if (c === '}') { 깊이--; if (깊이 === 0) { i++; break; } }
  }
  let 끝 = i;
  if (s[끝] === ',') 끝++;              // 뒤 쉼표까지
  else if (s[시작 - 1] === ',') 시작--;  // 마지막 항목이면 앞 쉼표를
  return [시작, 끝];
}

const 세기 = (s) => (s.match(/proverb:"/g) || []).length;

let 바뀜 = 0;
for (const f of 파일들) {
  let s = fs.readFileSync(f, 'utf8');
  const 자리 = s.indexOf(`proverb:"${뺄것}"`);
  if (자리 < 0) continue;

  const 전 = 세기(s);
  const [시작, 끝] = 항목잘라내기(s, 자리);
  const 들어낸것 = s.slice(시작, 끝);
  s = s.slice(0, 시작) + s.slice(끝);
  const 후 = 세기(s);

  // 안전 확인: 딱 한 개만 줄었고, 남길 것은 그대로 있어야 합니다.
  if (전 - 후 !== 1) { console.error(`✗ ${전}개 → ${후}개. 한 개만 줄어야 합니다. 멈춥니다.`); process.exit(1); }
  if (!s.includes(`proverb:"${남길것}"`)) { console.error('✗ 남길 속담이 사라졌습니다. 멈춥니다.'); process.exit(1); }
  if (s.includes('},,{') || s.includes('[,') || s.includes(',]')) { console.error('✗ 쉼표가 어긋났습니다. 멈춥니다.'); process.exit(1); }

  fs.writeFileSync(f, s);
  console.log(`  ✓ ${path.relative(ROOT, f)}`);
  console.log(`    들어낸 것: ${들어낸것.slice(0, 90)}…`);
  console.log(`    속담 ${전}개 → ${후}개`);
  바뀜++;
}

if (!바뀜) { console.error('뺄 속담을 찾지 못했습니다 (이미 빠졌을 수 있습니다).'); process.exit(1); }

/* 마무리 확인: 조사만 다른 중복 짝이 더 없는지 다시 훑습니다. */
{
  const s = fs.readFileSync(파일들[0], 'utf8');
  const 목록 = [...s.matchAll(/proverb:"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  const 줄이기 = (x) => x.replace(/ /g, '').replace(/[은는이가을를에게로도의만]/g, '');
  const 통 = {};
  목록.forEach((p) => { (통[줄이기(p)] = 통[줄이기(p)] || []).push(p); });
  const 겹침 = Object.values(통).filter((v) => v.length > 1);
  console.log(`\n확인: 남은 속담 ${목록.length}개 · 중복 짝 ${겹침.length}건`, 겹침.length ? '✗' : '✓');
  겹침.forEach((v) => console.log('   -', v.join('  ↔  ')));
}

console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요 (오프라인 캐시 갱신).');
