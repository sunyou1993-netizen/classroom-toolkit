/* O/X 퀴즈 문항을 "근거 있는 문항"으로 통째로 갈아 끼웁니다.
 *
 * 왜:
 *   원래 문항들은 출처가 없었고, 그래서 공식 지침과 반대로 가르치는 내용이
 *   섞여 있었습니다(커터칼날 배출, 태풍 때 신문지 등).
 *   기관 공식 자료를 근거로 다시 쓴 문항으로 바꿉니다.
 *
 * 자료: scripts/questions/*.json
 *   [{ id, q, ans, exp, 영역, 근거기관, 근거문서, 출처, 라이선스 }, ...]
 *
 * 사용법: node scripts/install-questions.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 자료폴더 = path.join(ROOT, 'scripts', 'questions');
const 대상 = { environment: 'environment', safe: 'safe', violence: 'violence' };

function 검사(목록, 이름) {
  const 탈 = [];
  const 본 = new Set();
  목록.forEach((it, i) => {
    if (!it.q || !it.exp || !['O', 'X'].includes(it.ans)) 탈.push(`${i} 형식`);
    if (it.ans === 'O' && !/^(맞아요|맞습니다)/.test(it.exp)) 탈.push(`${it.id} 해설이 O와 안 맞음`);
    if (it.ans === 'X' && !/^(틀려요|아니요|아닙니다)/.test(it.exp)) 탈.push(`${it.id} 해설이 X와 안 맞음`);
    if (it.q.length > 90) 탈.push(`${it.id} 문항이 ${it.q.length}자로 김`);
    if (!/^https?:\/\//.test(it.출처 || '')) 탈.push(`${it.id} 출처 없음`);
    if (본.has(it.q)) 탈.push(`${it.id} 같은 문항 중복`);
    본.add(it.q);
  });
  if (탈.length) {
    console.error(`✗ ${이름}: 문제 ${탈.length}건`);
    탈.slice(0, 10).forEach((x) => console.error('   -', x));
    process.exit(1);
  }
}

let 총 = 0;
for (const [폴더, 파일이름] of Object.entries(대상)) {
  const 자료 = path.join(자료폴더, 파일이름 + '.json');
  if (!fs.existsSync(자료)) { console.warn('건너뜀(자료 없음):', 파일이름); continue; }
  const 목록 = JSON.parse(fs.readFileSync(자료, 'utf8'));
  검사(목록, 파일이름);

  // 앱이 읽는 모양 그대로 만듭니다
  const 새배열 = '[' + 목록.map((it, i) =>
    '{id:' + (i + 1) +
    ',question:' + JSON.stringify(it.q) +
    ',answer:' + JSON.stringify(it.ans) +
    ',explanation:' + JSON.stringify(it.exp) + '}').join(',') + ']';

  const assets = path.join(ROOT, 폴더, 'assets');
  let 바뀜 = 0;
  for (const n of fs.readdirSync(assets).filter((x) => x.endsWith('.js'))) {
    const f = path.join(assets, n);
    const s = fs.readFileSync(f, 'utf8');
    const i = s.indexOf('questions:[');
    if (i < 0) continue;
    let d = 0, k = i + 'questions:'.length;
    for (; k < s.length; k++) {
      if (s[k] === '[') d++;
      else if (s[k] === ']') { d--; if (d === 0) { k++; break; } }
    }
    fs.writeFileSync(f, s.slice(0, i) + 'questions:' + 새배열 + s.slice(k));
    바뀜++;
  }
  if (!바뀜) { console.error('✗ ' + 폴더 + ': questions 배열을 찾지 못했습니다'); process.exit(1); }
  console.log(`  ✓ ${폴더.padEnd(12)} ${목록.length}문항 교체`);
  총 += 목록.length;
}

// 근거를 사람이 읽을 수 있게 저장소에 남깁니다
const 줄 = ['# 퀴즈 문항 근거', '',
  '모든 문항은 아래 기관의 공식 자료를 근거로 새로 작성했습니다.',
  '기관 자료의 문장을 그대로 옮긴 것은 없습니다.', ''];
for (const [폴더, 파일이름] of Object.entries(대상)) {
  const 자료 = path.join(자료폴더, 파일이름 + '.json');
  if (!fs.existsSync(자료)) continue;
  const 목록 = JSON.parse(fs.readFileSync(자료, 'utf8'));
  const 기관 = {};
  목록.forEach((it) => { 기관[it.근거기관] = (기관[it.근거기관] || 0) + 1; });
  줄.push(`## ${파일이름} — ${목록.length}문항`, '',
    '근거 기관: ' + Object.entries(기관).map(([k, v]) => `${k}(${v})`).join(' · '), '',
    '| # | 문항 | 정답 | 근거기관 | 근거문서 | 출처 |', '|---|---|---|---|---|---|');
  목록.forEach((it, i) => 줄.push(
    `| ${i + 1} | ${it.q.replace(/\|/g, '/')} | ${it.ans} | ${it.근거기관} | ${(it.근거문서 || '').replace(/\|/g, '/')} | ${it.출처} |`));
  줄.push('');
}
fs.writeFileSync(path.join(ROOT, '문항근거.md'), 줄.join('\n'));
console.log(`\n총 ${총}문항 · 근거표를 문항근거.md 에 남겼습니다`);
