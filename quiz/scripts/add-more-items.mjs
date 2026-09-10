/* 속담·사자성어를 «덧붙입니다» — 이미 있는 것은 한 글자도 안 건드립니다.
 *
 * ── 왜 이 파일이 필요한가 ──────────────────────────────────────
 *
 * O/X 퀴즈(환경·안전·학교폭력)는 scripts/install-questions.mjs 로
 * 통째로 갈아 끼우면 됩니다. 그런데 속담·사자성어는 그런 통로가 없었습니다.
 * 자료가 앱 코드(번들 js) 안에 박혀 있어서입니다.
 *
 * 그래서 «맨 뒤에 덧붙이기» 만 합니다.
 *   ① 번들 안에서 자료 배열을 찾습니다
 *   ② 이미 들어 있는 속담/사자성어는 건너뜁니다
 *   ③ 없는 것만 배열 맨 뒤에 붙입니다
 *
 * 여러 번 돌려도 결과는 같습니다. 원래 있던 항목은 손대지 않습니다.
 *
 * 자료: scripts/questions/proverb-extra.json
 *       scripts/questions/fourchar-extra.json
 *
 * 사용법: node scripts/add-more-items.mjs        (quiz 폴더에서)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const 자료폴더 = path.join(ROOT, 'scripts', 'questions');

const 초록 = (s) => `\x1b[32m${s}\x1b[0m`;
const 빨강 = (s) => `\x1b[31m${s}\x1b[0m`;
const 흐리게 = (s) => `\x1b[2m${s}\x1b[0m`;

const 대상 = [
  {
    폴더: 'proverb', 자료: 'proverb-extra.json', 키: 'proverb',
    시작표시: 'proverb:', 이름: '속담',
    검사(it) {
      if (!it.proverb || !it.meaning || !it.category) return '형식';
      if (!Array.isArray(it.targets) || it.targets.length !== 2) return 'targets 가 2개가 아님';
      for (const t of it.targets) if (!it.proverb.includes(t)) return `targets «${t}» 가 속담 안에 없음`;
      if (it.targets[0] === it.targets[1]) return 'targets 두 개가 같음';
      return null;
    },
    글로쓰기(it) {
      return `{proverb:${JSON.stringify(it.proverb)},targets:${JSON.stringify(it.targets)}`
        + `,meaning:${JSON.stringify(it.meaning)},category:${JSON.stringify(it.category)}}`;
    },
  },
  {
    폴더: 'fourchar', 자료: 'fourchar-extra.json', 키: 'idiom',
    시작표시: 'idiom:', 이름: '사자성어',
    검사(it) {
      if (!it.idiom || !it.hanja || !it.meaning || !it.category) return '형식';
      if (it.idiom.length !== 4) return `«${it.idiom}» 이 네 글자가 아님`;
      if (it.hanja.length !== 4) return `한자 «${it.hanja}» 가 네 글자가 아님`;
      if (!Array.isArray(it.targets) || it.targets.length !== 2) return 'targets 가 2개가 아님';
      for (const t of it.targets) if (!it.idiom.includes(t)) return `targets «${t}» 가 사자성어 안에 없음`;
      if (it.targets[0] === it.targets[1]) return 'targets 두 개가 같음';
      return null;
    },
    글로쓰기(it) {
      return `{idiom:${JSON.stringify(it.idiom)},hanja:${JSON.stringify(it.hanja)}`
        + `,meaning:${JSON.stringify(it.meaning)},category:${JSON.stringify(it.category)}`
        + `,targets:${JSON.stringify(it.targets)}}`;
    },
  },
];

/* 번들 안에서 «[{proverb: …}, …]» 배열의 시작과 끝 위치를 찾습니다.
 * 문자열 안의 대괄호에 속지 않도록 따옴표를 제대로 넘깁니다. */
function 배열자리(s, 시작표시) {
  const i = s.indexOf('[{' + 시작표시);
  if (i < 0) return null;
  let 깊이 = 0;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (c === '"' || c === "'" || c === '`') {          /* 문자열은 통째로 건너뜁니다 */
      const 따옴표 = c;
      k++;
      while (k < s.length && s[k] !== 따옴표) { if (s[k] === '\\') k++; k++; }
      continue;
    }
    if (c === '[') 깊이++;
    else if (c === ']') { 깊이--; if (깊이 === 0) return { 시작: i, 끝: k }; }
  }
  return null;
}

let 실패 = 0;
console.log('■ 속담·사자성어 덧붙이기');
console.log(흐리게('  (이미 있는 것은 건드리지 않습니다. 여러 번 돌려도 같습니다)'));
console.log('');

for (const 것 of 대상) {
  const 자료길 = path.join(자료폴더, 것.자료);
  if (!fs.existsSync(자료길)) { console.log(`  ${흐리게('건너뜀(자료 없음): ' + 것.자료)}`); continue; }
  const 새것 = JSON.parse(fs.readFileSync(자료길, 'utf8'));

  /* 자료부터 검사합니다. 하나라도 어긋나면 아무것도 안 넣습니다. */
  const 탈 = [];
  const 본 = new Set();
  for (const it of 새것) {
    const 잘못 = 것.검사(it);
    if (잘못) 탈.push(`${it[것.키] || '(이름없음)'}: ${잘못}`);
    if (본.has(it[것.키])) 탈.push(`${it[것.키]}: 자료 안에서 중복`);
    본.add(it[것.키]);
  }
  if (탈.length) {
    console.log(`  ${빨강('✗')} ${것.이름} — 자료에 문제 ${탈.length}건`);
    탈.slice(0, 10).forEach((x) => console.log('        ' + x));
    실패++;
    continue;
  }

  const assets = path.join(ROOT, 것.폴더, 'assets');
  if (!fs.existsSync(assets)) { console.log(`  ${빨강('✗')} ${것.이름} — ${것.폴더}/assets 가 없습니다`); 실패++; continue; }

  let 고친파일 = 0, 넣은수 = 0, 건너뛴수 = 0;
  for (const n of fs.readdirSync(assets).filter((x) => x.endsWith('.js'))) {
    const f = path.join(assets, n);
    const s = fs.readFileSync(f, 'utf8');
    const 자리 = 배열자리(s, 것.시작표시);
    if (!자리) continue;

    const 안쪽 = s.slice(자리.시작, 자리.끝 + 1);
    const 붙일것 = [];
    for (const it of 새것) {
      /* 이미 들어 있으면 건너뜁니다 */
      if (안쪽.includes(JSON.stringify(it[것.키]))) { 건너뛴수++; continue; }
      붙일것.push(것.글로쓰기(it));
    }
    if (!붙일것.length) { 고친파일++; continue; }

    const 새문장 = s.slice(0, 자리.끝) + ',' + 붙일것.join(',') + s.slice(자리.끝);
    fs.writeFileSync(f, 새문장);
    고친파일++;
    넣은수 += 붙일것.length;
  }

  if (!고친파일) { console.log(`  ${빨강('✗')} ${것.이름} — 자료 배열을 찾지 못했습니다`); 실패++; continue; }
  console.log(`  ${초록('✓')} ${것.이름.padEnd(8)} ${넣은수}개 넣음 · ${건너뛴수}개는 이미 있어 건너뜀 ${흐리게('(파일 ' + 고친파일 + '개)')}`);
}

console.log('');
if (실패) { console.log(빨강(`${실패}가지가 안 됐습니다. 위 메시지를 그대로 알려 주세요.`)); process.exit(1); }
console.log(초록('덧붙이기 완료. 이어서 node scripts/make-sw.mjs 를 실행해 주세요.'));
