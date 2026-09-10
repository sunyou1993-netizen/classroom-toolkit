/* 지금 화면에 들어 있는 «검증된 문항» 을 AI Studio 원본(소스)에도 그대로 넣습니다.
 *
 * ── 왜 필요한가 (이게 없으면 생기는 일) ──────────────────────────
 *
 * 퀴즈 문항은 두 군데에 있습니다.
 *   ① AI Studio 앱의 소스   (js/main.js · js/proverbs_data.js)  ← 선유 님이 고치는 곳
 *   ② 빌드해서 만든 화면     (각 퀴즈 폴더의 assets 안 js)         ← 보드에 나가는 것
 *
 * 지금까지 문항을 고친 것은 ② 뿐입니다. ① 은 처음 만든 그대로입니다.
 * 그래서 AI Studio 에서 앱을 한 번 고치고 다시 빌드하면
 * **검증 전 문항으로 통째로 되돌아갑니다.** (커터칼날 배출처럼 지침과 반대인 것 포함)
 *
 * 이 스크립트는 ② 의 내용을 ① 의 «모양 그대로» 다시 써 줍니다.
 * 배열만 갈아 끼우고, 그 앞뒤 코드는 한 글자도 건드리지 않습니다.
 *
 * 사용법:
 *   node scripts/sync-to-source.mjs <AI Studio 소스 폴더>
 *
 *   예)  node scripts/sync-to-source.mjs ~/claix-quiz-src
 *
 *   그 폴더 안에 이런 폴더들이 있어야 합니다:
 *     claix_quiz_environment / claix_quiz_safe / claix_quiz_violence
 *     claix_quiz_proverb / claix_quiz_fourcharcter
 *
 *   --확인   붙이면 «무엇이 바뀌는지» 만 보여 주고 파일은 안 고칩니다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 초록 = (s) => `\x1b[32m${s}\x1b[0m`;
const 빨강 = (s) => `\x1b[31m${s}\x1b[0m`;
const 흐리게 = (s) => `\x1b[2m${s}\x1b[0m`;

const ROOT = process.cwd();
const 인자 = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const 확인만 = process.argv.includes('--확인') || process.argv.includes('--dry');
const 소스루트 = 인자[0] ? path.resolve(인자[0].replace(/^~/, process.env.HOME || '~')) : null;

if (!소스루트) {
  console.error('✗ AI Studio 소스 폴더를 알려 주세요.');
  console.error('  예)  node scripts/sync-to-source.mjs ~/claix-quiz-src');
  process.exit(1);
}
if (!fs.existsSync(소스루트)) {
  console.error('✗ 그런 폴더가 없습니다: ' + 소스루트);
  process.exit(1);
}

/* ── 배열의 시작과 끝 찾기 (문자열 안의 대괄호에 안 속게) ── */
function 배열자리(s, 시작글) {
  const i = s.indexOf(시작글);
  if (i < 0) return null;
  const j = s.indexOf('[', i);
  if (j < 0) return null;
  let 깊이 = 0;
  for (let k = j; k < s.length; k++) {
    const c = s[k];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; k++;
      while (k < s.length && s[k] !== q) { if (s[k] === '\\') k++; k++; }
      continue;
    }
    if (c === '[') 깊이++;
    else if (c === ']') { 깊이--; if (깊이 === 0) return { 시작: j, 끝: k }; }
  }
  return null;
}

function 갈아끼우기(파일, 시작글, 새배열글, 이름) {
  if (!fs.existsSync(파일)) { console.log(`  ${빨강('✗')} ${이름} — 파일이 없습니다: ${파일}`); return false; }
  const s = fs.readFileSync(파일, 'utf8');
  const 자리 = 배열자리(s, 시작글);
  if (!자리) { console.log(`  ${빨강('✗')} ${이름} — «${시작글}» 를 찾지 못했습니다`); return false; }
  const 옛것 = s.slice(자리.시작, 자리.끝 + 1);
  if (옛것 === 새배열글) { console.log(`  ${흐리게('· ' + 이름 + ' — 이미 같습니다')}`); return true; }
  if (!확인만) fs.writeFileSync(파일, s.slice(0, 자리.시작) + 새배열글 + s.slice(자리.끝 + 1));
  console.log(`  ${초록('✓')} ${이름.padEnd(16)} ${흐리게(옛것.length + '자 → ' + 새배열글.length + '자')}`);
  return true;
}

/* ── 1. O/X 세 가지 ── */
const OX = [
  { 폴더: 'claix_quiz_environment', 자료: 'environment.json', 이름: '환경' },
  { 폴더: 'claix_quiz_safe', 자료: 'safe.json', 이름: '안전' },
  { 폴더: 'claix_quiz_violence', 자료: 'violence.json', 이름: '학교폭력' },
];

const 따옴표 = (v) => JSON.stringify(v);

console.log('■ 검증된 문항을 AI Studio 소스에도 넣기');
console.log(흐리게('  소스 폴더: ' + 소스루트));
if (확인만) console.log(흐리게('  (--확인 이라서 파일은 고치지 않습니다)'));
console.log('');

let 실패 = 0;
for (const 것 of OX) {
  const 자료길 = path.join(ROOT, 'scripts', 'questions', 것.자료);
  if (!fs.existsSync(자료길)) { console.log(`  ${빨강('✗')} ${것.이름} — 자료가 없습니다: ${것.자료}`); 실패++; continue; }
  const 목록 = JSON.parse(fs.readFileSync(자료길, 'utf8'));

  /* 영역별로 묶어서, 주석과 함께 사람이 읽기 좋게 씁니다 */
  const 묶음 = new Map();
  목록.forEach((it) => { if (!묶음.has(it.영역)) 묶음.set(it.영역, []); 묶음.get(it.영역).push(it); });

  const 줄 = ['['];
  let 번호 = 0, 칸 = 0;
  for (const [영역, 것들] of 묶음) {
    칸++;
    줄.push(`    // ${칸}. ${영역} (${것들.length}문항)`);
    for (const it of 것들) {
      번호++;
      줄.push(`    { id: ${번호}, question: ${따옴표(it.q)}, answer: ${따옴표(it.ans)}, explanation: ${따옴표(it.exp)} },`);
    }
  }
  줄.push('  ]');
  if (!갈아끼우기(path.join(소스루트, 것.폴더, 'js', 'main.js'), 'questions:', 줄.join('\n'), 것.이름 + ` (${목록.length}문항)`)) 실패++;
}

/* ── 2. 속담·사자성어는 «지금 화면에 든 것» 을 그대로 옮깁니다 ── */
function 번들에서읽기(폴더, 시작표시) {
  const assets = path.join(ROOT, 폴더, 'assets');
  if (!fs.existsSync(assets)) return null;
  for (const n of fs.readdirSync(assets).filter((x) => x.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(assets, n), 'utf8');
    const 자리 = 배열자리(s, '[{' + 시작표시);
    if (!자리) continue;
    try { return (0, eval)(s.slice(자리.시작, 자리.끝 + 1)); } catch { return null; }
  }
  return null;
}

function 갈래별로쓰기(목록, 한줄로) {
  const 묶음 = new Map();
  목록.forEach((it) => { if (!묶음.has(it.category)) 묶음.set(it.category, []); 묶음.get(it.category).push(it); });
  const 줄 = ['['];
  let 칸 = 0;
  for (const [갈래, 것들] of 묶음) {
    칸++;
    줄.push(`  // ${칸}. ${갈래} (${것들.length}개)`);
    것들.forEach((it) => 줄.push('  ' + 한줄로(it) + ','));
  }
  줄.push(']');
  return 줄.join('\n');
}

const 속담 = 번들에서읽기('proverb', 'proverb:');
if (!속담) { console.log(`  ${빨강('✗')} 속담 — 화면에서 자료를 읽지 못했습니다`); 실패++; }
else {
  const 글 = 갈래별로쓰기(속담, (it) =>
    `{ proverb: ${따옴표(it.proverb)}, targets: [${it.targets.map(따옴표).join(', ')}], meaning: ${따옴표(it.meaning)}, category: ${따옴표(it.category)} }`);
  if (!갈아끼우기(path.join(소스루트, 'claix_quiz_proverb', 'js', 'proverbs_data.js'),
    'RAW_PROVERB_DATA', 글, `속담 (${속담.length}개)`)) 실패++;
}

const 사자 = 번들에서읽기('fourchar', 'idiom:');
if (!사자) { console.log(`  ${빨강('✗')} 사자성어 — 화면에서 자료를 읽지 못했습니다`); 실패++; }
else {
  const 글 = 갈래별로쓰기(사자, (it) =>
    `{ idiom: ${따옴표(it.idiom)}, hanja: ${따옴표(it.hanja)}, meaning: ${따옴표(it.meaning)}, category: ${따옴표(it.category)}, targets: [${it.targets.map(따옴표).join(', ')}] }`);
  if (!갈아끼우기(path.join(소스루트, 'claix_quiz_fourcharcter', 'js', 'proverbs_data.js'),
    'RAW_IDIOMS_DATA', 글, `사자성어 (${사자.length}개)`)) 실패++;
}

console.log('');
if (실패) { console.log(빨강(`${실패}가지가 안 됐습니다.`)); process.exit(1); }
console.log(초록(확인만 ? '확인만 했습니다 (파일은 그대로).' : '소스에도 넣었습니다.'));
console.log(흐리게('이어서 AI Studio 에서 GitHub 에 올리거나, 소스 저장소에 커밋해 주세요.'));
