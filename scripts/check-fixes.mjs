/* 손으로 넣은 고침이 «지금도 다 붙어 있는가» 를 확인합니다.
 *
 * ── 왜 필요한가 ────────────────────────────────────────────────
 *
 * 이 저장소의 고침은 두 종류입니다.
 *   ① 원본 앱에 넣는 것(scripts/patches/*.patch) — 다시 가져와도 살아남습니다.
 *   ② 빌드 «결과물» 위에 덧붙이는 것            — 다시 가져오면 전부 없어집니다.
 *
 * ② 가 없어져도 화면은 멀쩡히 열립니다. 그래서 아무도 모릅니다.
 * 학교에 나가고 나서야 «고쳤다던 게 왜 원래대로예요?» 로 돌아옵니다.
 *
 * 그래서 «지금 붙어 있어야 하는 목록» 을 파일로 적어 두고(고침목록.json),
 * 지금 상태와 대조합니다. 하나라도 빠지면 여기서 걸립니다.
 *
 * 사용법:
 *   node scripts/check-fixes.mjs           확인만 합니다 (빠진 게 있으면 실패)
 *   node scripts/check-fixes.mjs --기준     지금 상태를 «맞는 상태» 로 다시 적습니다
 *
 * 화면을 새로 추가했다면 --기준 으로 한 번 다시 적어 주세요.
 * (그때는 반드시 «지금 상태가 맞다» 고 확인한 뒤에 하세요)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const 기준파일 = path.join(HERE, '고침목록.json');

const 초록 = (s) => `\x1b[32m${s}\x1b[0m`;
const 빨강 = (s) => `\x1b[31m${s}\x1b[0m`;
const 흐리게 = (s) => `\x1b[2m${s}\x1b[0m`;

/* 붙어 있어야 하는 표시들. 이름은 화면 안에 id 로 남습니다. */
const 표시들 = {
  'kiosk-guard': '키오스크 잠금 (아이가 화면 밖으로 못 나가게)',
  'font-pretendard': '글꼴 심기 (인터넷 없이도 같은 글씨체)',
  'font-hanja': '한자 글꼴 (사자성어가 네모로 안 나오게)',
  'contrast-bump': '연한 글자 진하게 (교실 뒤에서도 읽히게)',
  'reduced-motion': '동작 줄이기 설정 따르기',
  'drop-guard': '파일 끌어놓기 막기',
  'sw-update-once': '새 판을 한 번에 반영',
  'blank-guard': '하얀 화면 대신 안내',
  'sw-register-quiz': '퀴즈를 주소로 바로 열어도 오프라인',
  'answer-once': '한 문제에 한 번만 답하기 (점수 부풀림 막기)',
  'card-keyboard': '퀴즈 첫화면을 키보드로도',
  'star-glow-perf': '퀴즈 첫화면 별 반짝임 (끊김 없애기)',
  'noise-sample-labels': '소음측정기 문구 맞추기',
  'paint-share-trim': '그림판 내보내기 이름',
};

/* 화면 «파일» 이 아니라 앱 «코드» 안에 들어가는 고침도 있습니다.
 * 이것들은 index.html / app.html 이 아니라 번들(js) 안에 있어서 위 표시로는 못 찾습니다.
 * (실제로 처음에 이걸 빠뜨려서 «0곳» 인데도 통과하는 헛검사가 됐었습니다)
 *
 * 그래서 코드 안에서 찾을 «그 고침만의 문구» 를 따로 적어 둡니다. */
const 코드속고침 = {
  'noise-sample-labels': { 설명: '소음측정기 문구 맞추기', 찾을것: 'noise-sample-labels' },
  '사다리-층수': { 설명: '사다리 층 수를 인원에 맞춤 (공정하게)', 찾을것: 'const t=[],e=Math.max(6,(l-1)*3);' },
  '사다리-높이': { 설명: '사다리 가로줄 높이를 고르게', 찾을것: 'level:.12+(n.lvl+1)*(.76/(e+1))' },
};

/* 화면 파일을 모읍니다 (quiz 안까지). 검사 도구·문서는 뺍니다. */
function 화면파일들() {
  const 나온것 = [];
  const 훑기 = (d, 깊이 = 0) => {
    if (깊이 > 2) return;
    let 목록;
    try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of 목록) {
      const p = path.join(d, e.name);
      let 폴더 = e.isDirectory();
      if (!폴더 && e.isSymbolicLink()) { try { 폴더 = fs.statSync(p).isDirectory(); } catch { } }
      if (폴더) {
        if (['scripts', 'launcher', 'download', 'test', '.git', 'node_modules', 'assets', 'fonts', 'shared'].includes(e.name)) continue;
        훑기(p, 깊이 + 1);
      } else if (e.name === 'index.html' || e.name === 'app.html') {
        나온것.push(path.relative(ROOT, p).split(path.sep).join('/'));
      }
    }
  };
  훑기(ROOT);
  return 나온것.sort();
}

/* 앱 코드(js) 파일을 모읍니다. 번들 안에 넣은 고침을 찾기 위해서입니다. */
function 코드파일들() {
  const 나온것 = [];
  const 훑기 = (d, 깊이 = 0) => {
    if (깊이 > 3) return;
    let 목록;
    try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of 목록) {
      const p = path.join(d, e.name);
      let 폴더 = e.isDirectory();
      if (!폴더 && e.isSymbolicLink()) { try { 폴더 = fs.statSync(p).isDirectory(); } catch { } }
      if (폴더) {
        if (['scripts', 'launcher', 'download', 'test', '.git', 'node_modules', 'fonts'].includes(e.name)) continue;
        훑기(p, 깊이 + 1);
      } else if (e.name.endsWith('.js') && e.name !== 'sw.js') {
        나온것.push(path.relative(ROOT, p).split(path.sep).join('/'));
      }
    }
  };
  훑기(ROOT);
  return 나온것.sort();
}

/* 지금 상태: 표시 → 그 표시가 들어 있는 화면 파일 목록 */
function 지금상태() {
  const 상태 = {};
  for (const 표시 of Object.keys(표시들)) 상태[표시] = [];
  for (const f of 화면파일들()) {
    let s;
    try { s = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { continue; }
    for (const 표시 of Object.keys(표시들)) if (s.includes(표시)) 상태[표시].push(f);
  }
  /* 번들(js) 안에 들어간 고침 */
  for (const 이름 of Object.keys(코드속고침)) 상태[이름] = [];
  for (const f of 코드파일들()) {
    let s;
    try { s = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { continue; }
    for (const [이름, 것] of Object.entries(코드속고침)) if (s.includes(것.찾을것)) 상태[이름].push(f);
  }
  return 상태;
}

const 지금 = 지금상태();

/* ── 기준을 다시 적는 모드 ── */
if (process.argv.includes('--기준') || process.argv.includes('--baseline')) {
  fs.writeFileSync(기준파일, JSON.stringify({
    설명: '이 파일은 «지금 붙어 있어야 하는 고침» 의 목록입니다. scripts/check-fixes.mjs 가 이것과 대조합니다.',
    만든날: new Date().toISOString().slice(0, 10),
    고침: 지금,
  }, null, 2) + '\n');
  const 합 = Object.values(지금).reduce((a, b) => a + b.length, 0);
  console.log(초록(`기준을 다시 적었습니다 — 표시 ${Object.keys(지금).length}종 · 화면 ${합}곳`));
  console.log(흐리게(`  ${path.relative(ROOT, 기준파일)}`));
  process.exit(0);
}

/* ── 확인 모드 ── */
if (!fs.existsSync(기준파일)) {
  console.log(빨강('기준 파일이 없습니다.'));
  console.log('지금 상태가 맞다면 한 번만: node scripts/check-fixes.mjs --기준');
  process.exit(1);
}
const 기준 = JSON.parse(fs.readFileSync(기준파일, 'utf8')).고침;

console.log('■ 손으로 넣은 고침이 다 붙어 있는가');
console.log(흐리게(`  기준: ${path.relative(ROOT, 기준파일)}`));
console.log('');

let 빠진합 = 0, 새로생긴합 = 0;
const 전부 = { ...표시들, ...Object.fromEntries(Object.entries(코드속고침).map(([k, v]) => [k, v.설명])) };
for (const 표시 of Object.keys(전부)) {
  const 있어야 = new Set(기준[표시] || []);
  const 지금것 = new Set(지금[표시] || []);
  const 빠짐 = [...있어야].filter((x) => !지금것.has(x));
  const 늘어남 = [...지금것].filter((x) => !있어야.has(x));
  빠진합 += 빠짐.length; 새로생긴합 += 늘어남.length;
  const 상태 = 빠짐.length ? 빨강(`✗ ${빠짐.length}곳 빠짐`)
    : 있어야.size === 0 ? 빨강('✗ 기준이 0곳(헛검사)')
      : 초록(`✓ ${지금것.size}곳`);
  if (있어야.size === 0) 빠진합++;   // 아무 데도 없으면 «있다» 고 말할 수 없습니다
  console.log(`  ${상태.padEnd(24)} ${표시.padEnd(20)} ${흐리게(전부[표시])}`);
  for (const f of 빠짐) console.log(`        ${빨강('빠짐:')} ${f}`);
  for (const f of 늘어남) console.log(`        ${흐리게('새로 생김: ' + f)}`);
}

console.log('');
if (빠진합) {
  console.log(빨강(`${빠진합}곳에서 고침이 빠졌습니다.`));
  console.log('');
  console.log('  앱을 다시 가져온 뒤라면 이것이 정상입니다. 아래 한 줄로 다시 입히면 됩니다:');
  console.log('      node scripts/apply-fixes.mjs');
  process.exit(1);
}
if (새로생긴합) {
  console.log(흐리게(`(고침이 ${새로생긴합}곳에 새로 생겼습니다. 일부러 그런 것이면 --기준 으로 기준을 다시 적어 주세요)`));
}
console.log(초록('빠진 고침 없습니다.'));
