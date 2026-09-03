/* 아이들이 내용을 안 보고 «찍어서» 맞출 수 있는가. (조사용)
 *
 * 왜 이걸 보나:
 *   O/X 퀴즈에서 정답이 한쪽으로 쏠려 있으면, 아이들은 며칠 안에 알아챕니다.
 *   "그냥 O 누르면 대충 맞아." 그러면 배우는 게 아니라 요령이 됩니다.
 *
 *   교육 평가에서 보는 것들입니다.
 *     1) O 와 X 의 비율 — 50:50 에 가까워야 합니다
 *     2) 같은 답이 몇 개나 연달아 나오나 — 길면 패턴이 보입니다
 *     3) 문제를 섞는가 — 늘 같은 순서면 답 순서를 외웁니다
 *     4) 문항 길이가 정답과 관련 있나 — "긴 문장은 대체로 O" 같은 힌트가 생깁니다
 *     5) "항상·절대·반드시" 같은 말이 든 문장은 대개 X — 이것도 요령입니다
 */
import fs from 'fs';
import path from 'path';
import { 퀴즈, 원본문항, 제목, 알림 } from './lib/util.mjs';

const 갈래들 = ['environment', 'safe', 'violence'];
const 이름 = { environment: '환경', safe: '안전', violence: '학교폭력' };

제목('■ 정답이 한쪽으로 쏠려 있나');
알림('O/X 퀴즈는 찍어도 절반은 맞습니다. 쏠려 있으면 절반보다 훨씬 잘 맞습니다.');
console.log('');
console.log('   갈래         문항    O개    X개    O비율   찍으면 맞는 확률');
console.log('   ' + '─'.repeat(58));

const 전체 = [];
for (const g of 갈래들) {
  const q = 원본문항(g);
  전체.push(...q.map((x) => ({ ...x, 갈래: g })));
  const o = q.filter((x) => (x.ans || x.answer) === 'O').length;
  const x = q.length - o;
  const 비율 = o / q.length;
  const 찍기 = Math.max(비율, 1 - 비율);
  const 판정 = 찍기 > 0.6 ? '⚠' : '✓';
  console.log(`   ${이름[g].padEnd(10)} ${String(q.length).padStart(4)} ${String(o).padStart(6)} ${String(x).padStart(6)}   ${(비율 * 100).toFixed(0).padStart(3)}%   ${(찍기 * 100).toFixed(0).padStart(11)}%  ${판정}`);
}
{
  const o = 전체.filter((x) => (x.ans || x.answer) === 'O').length;
  const 비율 = o / 전체.length;
  console.log('   ' + '─'.repeat(58));
  console.log(`   ${'전체'.padEnd(10)} ${String(전체.length).padStart(4)} ${String(o).padStart(6)} ${String(전체.length - o).padStart(6)}   ${(비율 * 100).toFixed(0).padStart(3)}%   ${(Math.max(비율, 1 - 비율) * 100).toFixed(0).padStart(11)}%`);
}

/* ── 같은 답이 연달아 ── */
제목('■ 같은 답이 몇 개나 연달아 나오나 (원본 순서 기준)');
알림('원본 그대로 내면 "O O O O O" 같은 구간이 보입니다. 섞어서 내면 문제없습니다.');
console.log('');
for (const g of 갈래들) {
  const q = 원본문항(g);
  let 최장 = 1, 지금 = 1, 최장답 = '';
  for (let i = 1; i < q.length; i++) {
    const a = (q[i].ans || q[i].answer), b = (q[i-1].ans || q[i-1].answer);
    if (a === b) { 지금++; if (지금 > 최장) { 최장 = 지금; 최장답 = a; } } else 지금 = 1;
  }
  console.log(`   ${이름[g].padEnd(10)} 가장 긴 연속: ${최장}개 (${최장답 || '-'})  ${최장 >= 6 ? '⚠' : '✓'}`);
}

/* ── 문장 길이가 힌트가 되나 ── */
제목('■ 문장 길이로 답을 짐작할 수 있나');
알림('"긴 문장은 대체로 O" 같은 규칙이 생기면 안 됩니다');
console.log('');
for (const g of 갈래들) {
  const q = 원본문항(g);
  const 길이 = (x) => (x.q || x.question || '').length;
  const O = q.filter((x) => (x.ans || x.answer) === 'O').map(길이);
  const X = q.filter((x) => (x.ans || x.answer) === 'X').map(길이);
  const 평균 = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  const 차 = Math.abs(평균(O) - 평균(X));
  console.log(`   ${이름[g].padEnd(10)} O 평균 ${평균(O).toFixed(0)}자 · X 평균 ${평균(X).toFixed(0)}자 · 차이 ${차.toFixed(0)}자  ${차 > 8 ? '⚠ 힌트가 될 수 있음' : '✓'}`);
}

/* ── 단정하는 말이 든 문장은 대개 X 인가 ── */
제목('■ "항상·절대·반드시" 가 든 문장은 대개 X 인가');
알림('시험 요령으로 널리 알려진 규칙입니다. 그대로 들어맞으면 아이들이 그 요령을 씁니다.');
console.log('');
const 단정어 = ['항상', '절대', '반드시', '모두', '전혀', '무조건', '언제나'];
{
  const 든것 = 전체.filter((x) => 단정어.some((w) => (x.q || x.question || '').includes(w)));
  const X인것 = 든것.filter((x) => (x.ans || x.answer) === 'X').length;
  if (!든것.length) console.log('   ✓ 그런 문장이 없습니다');
  else {
    const 비율 = X인것 / 든것.length;
    console.log(`   그런 문장 ${든것.length}개 중 ${X인것}개가 X (${(비율 * 100).toFixed(0)}%)  ${비율 > 0.8 || 비율 < 0.2 ? '⚠ 규칙이 너무 잘 들어맞습니다' : '✓ 규칙이 안 통합니다'}`);
    if (비율 > 0.8) 든것.filter((x) => (x.ans || x.answer) === 'X').slice(0, 3)
      .forEach((x) => console.log(`       예: "${(x.q || x.question).slice(0, 44)}…" → X`));
  }
}

/* ── 문제를 섞어서 내는가 ── */
제목('■ 낼 때 문제를 섞는가');
알림('안 섞으면 두 번째 푸는 아이가 "1번은 O, 2번은 X" 를 외웁니다');
console.log('');
for (const g of 갈래들) {
  const d = path.join(퀴즈, g, 'assets');
  if (!fs.existsSync(d)) { console.log(`   ${이름[g]}: 번들을 못 찾음`); continue; }
  const f = fs.readdirSync(d).find((n) => n.endsWith('.js'));
  const s = fs.readFileSync(path.join(d, f), 'utf8');
  const 섞나 = /Math\.random\(\)\s*-\s*\.?5|sort\(\(\)\s*=>\s*Math\.random/.test(s) || /shuffle/i.test(s);
  const 몇개 = (s.match(/slice\(0,\s*(\d+)\)/) || [])[1];
  console.log(`   ${이름[g].padEnd(10)} 섞기: ${섞나 ? '✓ 함' : '✗ 안 함'}${몇개 ? ` · 한 번에 ${몇개}문제` : ''}`);
}

console.log('');
