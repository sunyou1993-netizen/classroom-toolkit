/* 속담 한 개를 뺍니다 — "송충이는 솔잎을 먹어야 한다"
 *
 * ── 왜 빼기로 했나 ────────────────────────────────────────────
 *
 * 이 속담의 표준국어대사전 뜻은 하나뿐입니다.
 *   "자기 분수에 맞게 처신하여야 함을 비유적으로 이르는 말."
 *
 * 두 번 살려 보려다 두 번 다 실패했습니다.
 *   1차(fix-proverbs.mjs) — '분수' 라는 어려운 말을 빼고 쉽게 쓰려다
 *      "자기가 할 수 있는 일부터 차근차근 해야 한다" 가 되었습니다.
 *      **뜻이 아예 다른 속담의 뜻으로 바뀌어** 1년 가까이 화면에 나갔습니다.
 *   2차(fix-proverbs2.mjs) — 사전 뜻으로 되돌렸더니, 이번에는
 *      2160×3840 교실 화면에 "제 분수에 맞게 … 살아야 한다" 가 크게 뜹니다.
 *      퀴즈는 뜻을 먼저 보여 주고 아이가 속담을 맞히는 방식이라,
 *      그 문장은 **앱이 아이에게 하는 말**이 됩니다.
 *
 * 즉 «쉽게 쓰면 거짓이 되고, 정확히 쓰면 아이에게 할 말이 아닌» 속담입니다.
 * 뜻풀이를 손보는 것으로는 풀 수 없어서 뺍니다.
 *
 * ── 왜 이것 하나만 빼나 ───────────────────────────────────────
 * "뱁새가 황새를 따라가면 다리가 찢어진다" 는 남깁니다.
 *   표준국어대사전 뜻이 "힘에 겨운 일을 억지로 하면 도리어 해만 입는다" 로,
 *   **분수가 아니라 무리한 노력의 결과**를 말합니다. 화면에 그대로 써도 됩니다.
 * 2026-09-01 에 «검토했지만 남기기로» 한 11개도 그대로 둡니다.
 *   그것들은 표현이 걸렸을 뿐, 뜻 자체는 아이에게 해도 되는 말입니다.
 *
 * ── 되돌리려면 ────────────────────────────────────────────────
 * 이 스크립트를 돌리지 말고, add-more-items.mjs 로 다시 넣으면 됩니다.
 *   { proverb: "송충이는 솔잎을 먹어야 한다", targets: ["송","솔"],
 *     meaning: "제 분수에 맞게, 자기에게 어울리는 일을 하며 살아야 한다는 뜻.",
 *     category: "겸손과 분수" }
 *
 * 사용법: node scripts/remove-proverb-songchungi.mjs   (퀴즈 폴더에서)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 뺄것 = '송충이는 솔잎을 먹어야 한다';

const 파일들 = fs.readdirSync(path.join(ROOT, 'proverb', 'assets'))
  .filter((n) => n.endsWith('.js')).map((n) => path.join(ROOT, 'proverb', 'assets', n));

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
  if (s[끝] === ',') 끝++;
  else if (s[시작 - 1] === ',') 시작--;
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

  if (전 - 후 !== 1) { console.error(`✗ ${전}개 → ${후}개. 한 개만 줄어야 합니다. 멈춥니다.`); process.exit(1); }
  if (s.includes('},,{') || s.includes('[,') || s.includes(',]')) { console.error('✗ 쉼표가 어긋났습니다. 멈춥니다.'); process.exit(1); }
  if (!s.includes('proverb:"뱁새가 황새를 따라가면 다리가 찢어진다"')) { console.error('✗ 남겨야 할 속담이 사라졌습니다. 멈춥니다.'); process.exit(1); }

  fs.writeFileSync(f, s);
  console.log(`  ✓ ${path.relative(ROOT, f)}`);
  console.log(`    들어낸 것: ${들어낸것.slice(0, 100)}…`);
  console.log(`    속담 ${전}개 → ${후}개`);
  바뀜++;
}

if (!바뀜) { console.error('뺄 속담을 찾지 못했습니다 (이미 빠졌을 수 있습니다).'); process.exit(1); }

/* 마무리 확인 */
{
  const s = fs.readFileSync(파일들[0], 'utf8');
  const 목록 = [...s.matchAll(/proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\]/g)];
  const 탈 = [];
  for (const m of 목록) {
    const 본문 = JSON.parse('"' + m[1] + '"');
    const 빈칸 = m[2].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean);
    for (const c of 빈칸) if (!본문.includes(c)) 탈.push(`${본문} → 빈칸 '${c}' 없음`);
  }
  const 갈래 = {};
  for (const m of s.matchAll(/category:"((?:[^"\\]|\\.)*)"/g)) 갈래[m[1]] = (갈래[m[1]] || 0) + 1;
  console.log(`\n확인: 남은 속담 ${목록.length}개 · 빈칸 어긋남 ${탈.length}건`, 탈.length ? '✗' : '✓');
  탈.forEach((x) => console.log('   -', x));
  console.log('   갈래별:', Object.entries(갈래).map(([k, v]) => `${k} ${v}`).join(' · '));
}

console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요 (오프라인 캐시 갱신).');
