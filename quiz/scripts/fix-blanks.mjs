/* 빈칸에 들어갈 글자가 문제 안에 또 나오면, 답이 화면에 그대로 보입니다.
 *
 * 예: "가는 [말]이 고와야 오는 말이 곱다"  → 뒤쪽 '말'을 보고 그냥 맞힙니다.
 *
 * 그래서 문제 안에 한 번만 나오는 글자로 빈칸을 바꿉니다.
 * 바꿀 글자가 없으면 그대로 둡니다(억지로 바꾸지 않습니다).
 *
 * 사용법: node scripts/fix-blanks.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// 조사·어미처럼 뜻이 없는 글자는 빈칸으로 쓰지 않습니다.
// ("물에 빠지면…" 에서 '에'를 뚫으면 문제가 되지 않습니다)
const 조사 = new Set('에이가은는을를도의와과로만서야며고나지구려서'.split(''));

function 후보뽑기(본문) {
  const 한번만 = [];
  for (let i = 0; i < 본문.length; i++) {
    const ch = 본문[i];
    if (!/[가-힣]/.test(ch)) continue;
    if (본문.split(ch).length - 1 !== 1) continue;
    // 낱말의 첫 글자를 더 좋아합니다(앞이 공백이거나 문장 처음)
    const 첫글자 = i === 0 || 본문[i - 1] === ' ';
    한번만.push({ ch, 첫글자, 조사여부: 조사.has(ch) && !첫글자 });
  }
  // 뜻 있는 글자 → 낱말 첫 글자 우선
  한번만.sort((a, b) => (a.조사여부 - b.조사여부) || (b.첫글자 - a.첫글자));
  return 한번만.map((x) => x.ch);
}

function 고르기(본문, 기존) {
  const 후보 = 후보뽑기(본문);
  const 결과 = [];
  for (const t of 기존) {
    if (본문.split(t).length - 1 === 1) { 결과.push(t); continue; }   // 이미 한 번뿐이면 그대로
    const 대체 = 후보.find((c) => !결과.includes(c) && !기존.includes(c));
    결과.push(대체 || t);
  }
  return 결과;
}

function 처리(파일, 정규식, 본문번호, 타깃번호) {
  if (!fs.existsSync(파일)) return 0;
  let s = fs.readFileSync(파일, 'utf8');
  let 바뀜 = 0;
  s = s.replace(정규식, (전체, ...g) => {
    const 본문 = g[본문번호 - 1];
    const 원타깃 = g[타깃번호 - 1].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean);
    const 새타깃 = 고르기(본문, 원타깃);
    if (새타깃.join() === 원타깃.join()) return 전체;
    바뀜++;
    console.log(`  ${본문}  [${원타깃.join(',')}] → [${새타깃.join(',')}]`);
    return 전체.replace(
      'targets:[' + 원타깃.map((x) => JSON.stringify(x)).join(',') + ']',
      'targets:[' + 새타깃.map((x) => JSON.stringify(x)).join(',') + ']');
  });
  if (바뀜) fs.writeFileSync(파일, s);
  return 바뀜;
}

let 총 = 0;
console.log('■ 속담');
for (const f of fs.readdirSync(path.join(ROOT, 'proverb', 'assets')).filter((n) => n.endsWith('.js')))
  총 += 처리(path.join(ROOT, 'proverb', 'assets', f),
    /proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\]/g, 1, 2);

console.log('■ 사자성어');
for (const f of fs.readdirSync(path.join(ROOT, 'fourchar', 'assets')).filter((n) => n.endsWith('.js')))
  총 += 처리(path.join(ROOT, 'fourchar', 'assets', f),
    /idiom:"((?:[^"\\]|\\.)*)",hanja:"[^"]*",meaning:"(?:[^"\\]|\\.)*",category:"[^"]*",targets:\[([^\]]*)\]/g, 1, 2);

console.log(`\n${총}개 문제의 빈칸을 "답이 안 보이는" 글자로 바꿨습니다`);
