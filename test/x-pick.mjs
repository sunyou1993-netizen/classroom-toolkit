/* 한 판에 나오는 10문제가 어떻게 뽑히는지 실제로 돌려서 봅니다. (조사용)
 *
 * 무엇을 보나:
 *   퀴즈 코드에서 «문제 고르는 함수» 를 그대로 꺼내 5천 판을 돌립니다.
 *     · 한 판의 O 개수가 매번 같은가 (같으면 아이가 눈치챕니다)
 *     · 같은 답이 3개 연달아 나오는가
 *     · 특정 문항만 자주 나오고 어떤 문항은 안 나오는가
 *     · 한 판 안에 같은 문제가 두 번 나오는가
 */
import fs from 'fs';
import path from 'path';
import { 퀴즈, 원본문항, 제목, 알림 } from './lib/util.mjs';

const 갈래들 = [['environment', '환경'], ['safe', '안전'], ['violence', '학교폭력']];
const 판수 = 5000;

/* 번들에서 «문제 고르는 함수» 를 통째로 꺼냅니다 */
function 고르는함수꺼내기(갈래) {
  const d = path.join(퀴즈, 갈래, 'assets');
  const f = fs.readdirSync(d).find((n) => n.endsWith('.js'));
  const s = fs.readFileSync(path.join(d, f), 'utf8');
  /* function 이름(문항들,개수=10){const a=문항들.filter(…="O"), … } 형태를 찾습니다.
     번들마다 변수 이름이 다르게 줄여져 있으므로(p/t, d/x …) 이름을 그대로 받아 씁니다. */
  const m = s.match(/function\s+\w+\((\w+),\s*(\w+)=10\)\{const \w+=\1\.filter\(\w+=>\w+\.answer==="O"\)/);
  if (!m) return null;
  const [문항이름, 개수이름] = [m[1], m[2]];
  const i = s.indexOf(m[0]);
  /* 중괄호를 세어 함수 끝을 찾습니다 */
  let 깊이 = 0, 시작 = s.indexOf('{', i), j = 시작;
  for (; j < s.length; j++) {
    if (s[j] === '{') 깊이++;
    else if (s[j] === '}') { 깊이--; if (깊이 === 0) break; }
  }
  const 본문 = s.slice(시작 + 1, j);
  return new Function(문항이름, 개수이름, `${개수이름}=${개수이름}||10;${본문}`);
}

제목(`■ 한 판에 나오는 10문제가 어떻게 뽑히나 (${판수.toLocaleString()}판)`);
알림('퀴즈 코드에서 문제 고르는 함수를 그대로 꺼내 돌렸습니다');

for (const [갈래, 이름] of 갈래들) {
  const 고르기 = 고르는함수꺼내기(갈래);
  const 문항 = 원본문항(갈래).map((x) => ({ ...x, answer: x.ans, question: x.q }));
  console.log('');
  console.log(`   ── ${이름} (전체 ${문항.length}문항) ──`);
  if (!고르기) { console.log('     (고르는 함수를 못 찾았습니다)'); continue; }

  const O개수분포 = new Map();
  const 나온횟수 = new Map();
  let 삼연속 = 0, 중복있는판 = 0, 개수틀림 = 0;

  for (let n = 0; n < 판수; n++) {
    const 한판 = 고르기(문항, 10);
    if (한판.length !== 10) 개수틀림++;
    const o = 한판.filter((x) => x.answer === 'O').length;
    O개수분포.set(o, (O개수분포.get(o) || 0) + 1);
    const ids = new Set(한판.map((x) => x.id));
    if (ids.size !== 한판.length) 중복있는판++;
    for (const x of 한판) 나온횟수.set(x.id, (나온횟수.get(x.id) || 0) + 1);
    for (let k = 0; k < 한판.length - 2; k++) {
      if (한판[k].answer === 한판[k + 1].answer && 한판[k + 1].answer === 한판[k + 2].answer) { 삼연속++; break; }
    }
  }

  const 분포 = [...O개수분포.entries()].sort((a, b) => a[0] - b[0]);
  console.log(`     한 판의 O 개수: ${분포.map(([k, v]) => `${k}개→${(v / 판수 * 100).toFixed(0)}%`).join(' · ')}`);
  if (분포.length === 1) {
    console.log(`     ⚠ 언제나 O 가 정확히 ${분포[0][0]}개입니다.`);
    console.log(`        O 를 ${분포[0][0]}번 맞히고 나면 나머지는 전부 X 라는 뜻입니다.`);
  } else {
    console.log('     ✓ 판마다 O 개수가 다릅니다');
  }
  console.log(`     같은 답 3연속: ${삼연속}판 (${(삼연속 / 판수 * 100).toFixed(1)}%)  ${삼연속 / 판수 > 0.05 ? '⚠' : '✓'}`);
  console.log(`     한 판에 같은 문제 두 번: ${중복있는판}판  ${중복있는판 ? '✗' : '✓'}`);
  console.log(`     10문제가 아닌 판: ${개수틀림}판  ${개수틀림 ? '✗' : '✓'}`);

  const 값 = [...나온횟수.values()];
  const 안나온 = 문항.length - 나온횟수.size;
  const 기대 = 판수 * 10 / 문항.length;
  console.log(`     문항별 등장: 기대 ${기대.toFixed(0)}회 · 최소 ${Math.min(...값)}회 · 최대 ${Math.max(...값)}회 · 한 번도 안 나온 문항 ${안나온}개  ${안나온 ? '✗' : '✓'}`);
}

console.log('');
