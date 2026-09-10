/* 사자성어의 한자가 한글 음과 맞는지 봅니다.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────
 * 보드 화면에는 «온고지신 溫故知新» 처럼 한글과 한자가 나란히 나옵니다.
 * 한자 한 글자가 틀려도 화면은 멀쩡해 보입니다. 네모(□)로도 안 나옵니다.
 * 글꼴 검사(check-hanja-font.mjs)는 «글자가 글꼴에 있나» 만 보기 때문에
 * 엉뚱한 한자가 들어와도 그냥 통과합니다.
 *
 * 이 검사는 «이 한자를 이 음으로 읽는 게 맞나» 를 봅니다.
 * 예) 溫 을 '고' 라고 읽어 놓았으면 여기서 걸립니다.
 *
 * ── 표는 어디서 왔나 ───────────────────────────────────────
 * scripts/hanja-reading-table.txt (396자).
 * 2026-09-10 에 지금 자료의 한자 616자(154개 × 4자)를 공개 한자 음 사전
 * (9,031자, github.com/myungcheol/hanja)과 한 자씩 대조해 **전부 맞는 것을 확인한 뒤**
 * 그 결과를 표로 굳혀 둔 것입니다. 두음법칙(락→낙, 량→양 …)도 함께 확인했습니다.
 *
 * 새 사자성어를 넣었는데 표에 없는 한자가 나오면 «표에 없음» 으로 알려 줍니다.
 * 그때는 사람이 음을 확인하고 이 표에 한 줄 넣어 주세요. 조용히 넘어가지 않습니다.
 *
 * 사용법: node scripts/check-hanja-reading.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

/* 표 읽기: "溫온 樂낙락악" 형태 (첫 글자가 한자, 나머지가 그 한자의 음) */
const 표 = new Map();
for (const 덩이 of fs.readFileSync(path.join(ROOT, 'scripts', 'hanja-reading-table.txt'), 'utf8').split(/\s+/)) {
  if (!덩이) continue;
  표.set([...덩이][0], new Set([...덩이].slice(1)));
}

/* 자료 읽기: 화면에 나가는 번들에서 그대로 뽑습니다 */
function 번들에서() {
  const dir = path.join(ROOT, 'fourchar', 'assets');
  for (const n of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(dir, n), 'utf8');
    const 목록 = [...s.matchAll(/idiom:"([^"]+)",hanja:"([^"]+)"/g)].map((m) => ({ 성어: m[1], 한자: m[2] }));
    if (목록.length) return 목록;
  }
  return [];
}

const 목록 = 번들에서();
if (!목록.length) { console.error('✗ 사자성어 자료를 찾지 못했습니다 (fourchar/assets)'); process.exit(1); }

const 탈 = [];
let 검사 = 0;
for (const it of 목록) {
  const 글 = [...it.성어], 한 = [...it.한자];
  if (글.length !== 4 || 한.length !== 4) { 탈.push(`${it.성어} ${it.한자} — 네 글자가 아닙니다`); continue; }
  for (let i = 0; i < 4; i++) {
    검사++;
    const 음 = 표.get(한[i]);
    if (!음) { 탈.push(`${it.성어} ${it.한자} — ${한[i]} 은 표에 없습니다 (scripts/hanja-reading-table.txt 에 "${한[i]}${글[i]}" 를 넣어 주세요)`); continue; }
    if (!음.has(글[i])) 탈.push(`${it.성어} ${it.한자} — ${한[i]} 은 [${[...음].join('/')}] 로 읽는데 '${글[i]}' 로 되어 있습니다`);
  }
}

console.log(`■ 사자성어 ${목록.length}개 · 한자 ${검사}자를 음과 대조했습니다`);
if (!탈.length) { console.log('   어긋난 것 없음 ✓'); process.exit(0); }
console.log(`   어긋난 것 ${탈.length}건 ✗`);
탈.forEach((x) => console.log('   -', x));
process.exit(1);
