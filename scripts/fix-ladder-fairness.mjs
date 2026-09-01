/* 사다리 타기를 공정하게 만듭니다.
 *
 * 무엇이 문제였나:
 *   사다리 알고리즘을 코드에서 그대로 꺼내 5만 번 돌려 봤습니다.
 *   참가자와 결과가 1:1 로 짝지어지는 것은 언제나 맞았습니다(0건 실패).
 *   그런데 **어느 자리에서 어느 결과로 갈 수 있는지가 심하게 치우쳐** 있었습니다.
 *
 *   10명일 때 (고르게 나오면 각 칸 10% 여야 합니다):
 *      1번 참가자 → 1번 결과 34.7% · 2번 31.6% … 8·9·10번 결과는 **0.0%**
 *     10번 참가자 → 10번 결과 35.3% …  1·2·3번 결과는 **0.0%**
 *
 *   즉 "1번 자리에 선 아이는 뒤쪽 결과를 아예 받을 수 없습니다."
 *   5만 번 돌려도 한 번도 안 나옵니다. 아이들은 금방 알아챕니다 —
 *   "저는 맨 앞이라 맨 뒤 상품은 절대 못 받아요."
 *   순서 정하기·상품 뽑기에 쓰는 도구라 공정해 보여야 합니다.
 *
 * 왜 그런가:
 *   가로줄 층이 **6개로 고정**되어 있었습니다. 가로줄 하나는 이웃한 두 줄을
 *   맞바꾸는 것이라, 6번 맞바꿔서는 한 자리에서 6칸 넘게 움직일 수 없습니다.
 *   사람이 6명 이하면 괜찮지만, 8~10명이면 반대편까지 갈 수가 없습니다.
 *
 * 어떻게 고쳤나:
 *   층 수를 사람 수에 맞춰 늘립니다.  6개 고정  →  (인원-1) × 3, 최소 6개
 *   그리고 가로줄이 그려지는 높이 간격을 층 수에 맞춰 자동으로 나눕니다.
 *   (원래는 층마다 0.1 씩 고정이라, 층이 늘면 화면 밖으로 나갑니다)
 *
 *   고친 뒤 (10명, 5만 번): 갈 수 없는 결과 0개.
 *   1:1 짝짓기는 그대로 지켜집니다(맞바꾸기를 아무리 겹쳐도 1:1 은 유지됩니다).
 *
 * 사용법: node scripts/fix-ladder-fairness.mjs      (수업도우미 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 폴더 = path.join(ROOT, 'ladder', 'assets');
const 파일들 = fs.readdirSync(폴더).filter((n) => n.endsWith('.js')).map((n) => path.join(폴더, n));

/* 원본 (압축된 코드):
 *   function Z(){gt(),v=[];const t=[],e=6;for(let n=0;n<e;n++)for(let s=0;s<l-1;s++)
 *     Math.random()>.45&&(t.some(r=>r.lvl===n&&r.col===s-1)||t.push({lvl:n,col:s}));
 *   v=t.map(n=>({level:.15+(n.lvl+1)*.09999999999999999,fromCol:n.col,toCol:n.col+1})),
 *   v.sort((n,s)=>n.level-s.level)}
 *
 * 바꾸는 곳 두 군데:
 *   ① const t=[],e=6;                    → 층 수를 인원에 맞춰
 *   ② level:.15+(n.lvl+1)*.0999…         → 층 수로 높이를 고르게 나눔
 */
const 옛층수 = 'const t=[],e=6;';
const 새층수 = 'const t=[],e=Math.max(6,(l-1)*3);';   // l = 참가자 수

const 옛높이 = 'level:.15+(n.lvl+1)*.09999999999999999';
const 새높이 = 'level:.12+(n.lvl+1)*(.76/(e+1))';

let 고침 = 0, 이미 = 0;
for (const f of 파일들) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes(새층수)) { 이미++; continue; }
  if (!s.includes(옛층수)) continue;
  if (!s.includes(옛높이)) {
    console.error(`✗ ${path.basename(f)} — 높이 계산 부분을 찾지 못했습니다. 멈춥니다.`);
    process.exit(1);
  }
  const 전 = s.length;
  s = s.replace(옛층수, 새층수).replace(옛높이, 새높이);
  // 확인: 두 곳 다 바뀌었는지
  if (!s.includes(새층수) || !s.includes(새높이)) {
    console.error('✗ 바꾸지 못했습니다. 멈춥니다.'); process.exit(1);
  }
  fs.writeFileSync(f, s);
  console.log(`  ✓ ${path.relative(ROOT, f)}  (${전} → ${s.length}자)`);
  console.log(`      층 수 : 6개 고정 → (인원-1)×3, 최소 6개`);
  console.log(`      높이  : 층마다 0.1 고정 → 층 수에 맞춰 고르게 나눔`);
  고침++;
}

if (!고침 && !이미) { console.error('✗ 사다리 코드를 찾지 못했습니다.'); process.exit(1); }
if (이미) console.log('  (이미 고쳐져 있습니다)');
console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
