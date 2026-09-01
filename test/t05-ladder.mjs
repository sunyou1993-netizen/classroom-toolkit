/* 사다리 타기 공정성 검사 — 브라우저 없이 돌아갑니다.
 *
 * 왜 필요한가:
 *   예전에는 가로줄 층이 6개로 고정이라, 10명일 때 1번 자리 아이는
 *   8·9·10번 결과를 **한 번도** 받을 수 없었습니다(5만 번 확인).
 *   순서 정하기·상품 뽑기에 쓰는 도구라 공정해 보여야 합니다.
 *
 * 어떻게 하나:
 *   화면 코드에서 사다리 만드는 규칙을 그대로 읽어 와, 여기서 여러 번 돌려 봅니다.
 *   (화면을 몇 만 번 누를 수는 없으니 계산으로 확인합니다)
 */
import path from 'path';
import { 루트, 읽기, 번들찾기, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

제목('■ 화면 코드에서 사다리 규칙 읽기');
const f = 번들찾기(path.join(루트, 'ladder'));
const s = 읽기(f);
const 층수식 = (s.match(/const t=\[\],e=([^;]+);/) || [])[1];
알림(`가로줄 층 수: ${층수식}`);
확인('층 수가 사람 수에 따라 늘어난다 (6개 고정이 아니다)',
  !!층수식 && /l/.test(층수식),
  '6개로 고정되어 있으면 8명 이상일 때 반대편 결과로 갈 수 없습니다.\n' +
  '고치는 법: node scripts/fix-ladder-fairness.mjs');

/* 원본과 같은 규칙 */
const 층계산 = 층수식 && /l/.test(층수식)
  ? new Function('l', `return ${층수식.replace(/Math\./g, 'Math.')}`)
  : () => 6;

function 가로줄(l) {
  const e = 층계산(l), t = [];
  for (let n = 0; n < e; n++) for (let c = 0; c < l - 1; c++)
    if (Math.random() > 0.45 && !t.some((r) => r.lvl === n && r.col === c - 1)) t.push({ lvl: n, col: c });
  return t.sort((a, b) => a.lvl - b.lvl);
}
const 따라가기 = (시작, v) => {
  let n = 시작;
  v.forEach((o) => { if (o.col === n) n = o.col + 1; else if (o.col + 1 === n) n = o.col; });
  return n;
};

제목('■ 여러 번 돌려 보기');
const N = 20000;
for (const 인원 of [2, 3, 5, 8, 10]) {
  const 표 = Array.from({ length: 인원 }, () => new Array(인원).fill(0));
  let 안맞 = 0;
  for (let i = 0; i < N; i++) {
    const v = 가로줄(인원);
    const 도착 = Array.from({ length: 인원 }, (_, c) => 따라가기(c, v));
    if (new Set(도착).size !== 인원) 안맞++;
    도착.forEach((d, c) => 표[c][d]++);
  }
  const 못감 = 표.flat().filter((x) => x === 0).length;
  const 확률 = 표.flat().map((x) => x / N * 100);
  알림(`${String(인원).padStart(2)}명 · 층 ${층계산(인원)}개 · 확률 ${Math.min(...확률).toFixed(1)}~${Math.max(...확률).toFixed(1)}% (고르면 ${(100/인원).toFixed(1)}%)`);
  확인(`${인원}명: 참가자와 결과가 언제나 1:1 로 짝지어진다 (${N}번)`, 안맞 === 0,
    `${안맞}번은 두 사람이 같은 결과로 갔습니다 — 교실에서 바로 문제가 됩니다`);
  확인(`${인원}명: 어느 자리에서든 모든 결과로 갈 수 있다`, 못감 === 0,
    `${못감}개 칸은 ${N}번 돌려도 한 번도 안 나왔습니다 (앞자리 아이가 뒤쪽 상품을 못 받습니다)`);
}

마무리('사다리 공정성 검사');
