/* 속담·사자성어 뜻풀이 2차 검수 반영 (307개 전수 대조, 18차)
 *
 * 1차(fix-proverbs.mjs)에서 속담 128개를 표준국어대사전과 대조했습니다.
 * 이번에는 속담 153 + 사자성어 154 = 307개를 하나씩 다시 읽었습니다.
 * 고칠 것이 두 개 나왔고, 둘 다 «1차에서 손댄 자리» 였습니다.
 *
 * 사용법: node scripts/fix-proverbs2.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 파일들 = fs.readdirSync(path.join(ROOT, 'proverb', 'assets'))
  .filter((n) => n.endsWith('.js')).map((n) => path.join(ROOT, 'proverb', 'assets', n));

/* ── 1. 표기 ──────────────────────────────────────────────
 * 표준국어대사전 표제어는 «살인도 피한다» 입니다. «면한다» 는 흔히 쓰는 변형입니다.
 * 빈칸 글자(참·셋)는 새 문장에도 그대로 있습니다. */
const 표기 = {
  '참을 인 자 셋이면 살인도 면한다': '참을 인 자 셋이면 살인도 피한다',
};

/* ── 2. 뜻풀이 ────────────────────────────────────────────
 *
 * (가) 송충이 — 1차에서 «어려운 낱말 정리» 로 '분수' 라는 말을 뺐는데,
 *      그 바람에 **뜻 자체가 달라졌습니다.**
 *        1차 결과: "자기가 할 수 있는 일부터 차근차근 해야 한다"  ← 이건 다른 속담의 뜻입니다
 *        표준국어대사전: "자기 분수에 맞게 처신하여야 함을 비유적으로 이르는 말"
 *      갈래도 [겸손과 분수] 인데 뜻에 분수가 없어 서로 어긋나 있었습니다.
 *      낱말은 쉽게 쓰되 뜻은 사전대로 되돌립니다.
 *
 * (나) 참을 인 — 표준국어대사전 뜻은 "화를 막는다" 가 아니라
 *      "끝까지 참으면 무슨 일이든 이루지 못할 것이 없다" 입니다.
 */
const 뜻 = {
  '송충이는 솔잎을 먹어야 한다':
    '제 분수에 맞게, 자기에게 어울리는 일을 하며 살아야 한다는 뜻.',
  '참을 인 자 셋이면 살인도 피한다':
    '어떤 경우에도 끝까지 참으면 이루지 못할 일이 없다는 뜻.',
};

/* ── 실행 ─────────────────────────────────────────────── */
function 바꾸기(표, 만들기) {
  let 총 = 0; const 못찾음 = [];
  for (const [옛, 새] of Object.entries(표)) {
    let 찾음 = false;
    for (const f of 파일들) {
      let s = fs.readFileSync(f, 'utf8');
      const 자리 = s.indexOf(`proverb:"${옛}"`);
      if (자리 < 0) continue;
      const [시작, 길이, 값] = 만들기(s, 자리, 새);
      if (시작 < 0) continue;
      fs.writeFileSync(f, s.slice(0, 시작) + 값 + s.slice(시작 + 길이));
      찾음 = true; 총++;
    }
    if (!찾음) 못찾음.push(옛);
  }
  return { 총, 못찾음 };
}

const a = 바꾸기(표기, (s, 자리, 새) => {
  const m = s.slice(자리).match(/^proverb:"(?:[^"\\]|\\.)*"/);
  return [자리, m[0].length, 'proverb:' + JSON.stringify(새)];
});
console.log(`■ 표기 ${a.총}건`);
if (a.못찾음.length) console.log('  (이미 고쳐졌거나 없음:', a.못찾음.join(' / '), ')');

const b = 바꾸기(뜻, (s, 자리, 새) => {
  const 뒤 = s.slice(자리, 자리 + 600);
  const m = 뒤.match(/meaning:"(?:[^"\\]|\\.)*"/);
  if (!m) return [-1, 0, ''];
  return [자리 + 뒤.indexOf(m[0]), m[0].length, 'meaning:' + JSON.stringify(새)];
});
console.log(`■ 뜻풀이 ${b.총}건`);
if (b.못찾음.length) console.log('  ✗ 못 찾음:', b.못찾음.join(' / '));

/* 빈칸 글자가 문장에 남아 있는지 다시 봅니다 */
{
  const s = fs.readFileSync(파일들[0], 'utf8');
  const 탈 = [];
  for (const m of s.matchAll(/proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\]/g)) {
    const 본문 = JSON.parse('"' + m[1] + '"');
    const 빈칸 = m[2].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean);
    for (const c of 빈칸) if (!본문.includes(c)) 탈.push(`${본문} → 빈칸 '${c}' 이 문장에 없음`);
  }
  console.log(`\n확인: 빈칸 글자가 문장에 없는 속담 ${탈.length}건`, 탈.length ? '✗' : '✓');
  탈.forEach((x) => console.log('   -', x));
}
