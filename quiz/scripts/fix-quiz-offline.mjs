/* 퀴즈를 주소로 곧장 열면 인터넷 없이 안 되던 문제를 고칩니다.
 *
 * 무엇이 문제였나:
 *   16개 화면을 한 번씩 열어 파일을 받게 한 뒤, 인터넷을 끊고 다시 열어 봤습니다.
 *
 *     수업도우미 9개 + 퀴즈 첫화면   → 인터넷 없이도 열림   ✓
 *     환경·안전·학교폭력·속담·사자성어 → 안 열림             ✗
 *
 *   더 파 보니 「어느 길로 들어왔는가」에 따라 달랐습니다.
 *
 *     퀴즈 첫화면을 거쳐서 들어가면  → 됨
 *     주소로 곧장 들어가면          → 안 됨
 *
 * 왜 그런가:
 *   화면마다 "파일을 미리 받아 두는 일꾼(서비스워커)"을 등록하는 코드가 있습니다.
 *
 *     timer/index.html      →  register('../sw.js', { scope: '../' })   ✓ 있음
 *     quiz/index.html       →  register('./sw.js',  { scope: './'  })   ✓ 있음
 *     quiz/environment/…    →  (없음)                                    ✗
 *
 *   수업도우미 쪽 9개에는 다 있는데, 퀴즈 속 5개에만 빠져 있었습니다.
 *   첫화면을 거치면 첫화면이 등록해 준 일꾼이 퀴즈까지 맡아 주기 때문에 됩니다.
 *   곧장 들어가면 등록하는 사람이 아무도 없습니다.
 *
 * 언제 문제가 되나:
 *   · 선생님이 특정 퀴즈를 즐겨찾기 해 두었을 때
 *   · 보드 바탕화면에 퀴즈 바로가기를 만들어 두었을 때
 *   · 실행 파일이 퀴즈를 곧바로 열도록 설정했을 때
 *   교실에서 인터넷이 끊기는 순간에야 알게 됩니다.
 *
 * 어떻게 고쳤나:
 *   수업도우미 화면들이 이미 쓰고 있는 것과 **똑같은 코드**를 5개에 넣습니다.
 *   새로 만든 방식이 아니라, 옆에 있던 것을 그대로 맞춘 것입니다.
 *
 * 사용법: node scripts/fix-quiz-offline.mjs      (퀴즈 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'sw-register-quiz';

const 넣을것 = `<script id="${표시}">
/* 파일을 미리 받아 두는 일꾼을 등록합니다 (scripts/fix-quiz-offline.mjs).
   수업도우미의 timer/index.html 등이 쓰는 것과 같은 코드입니다.
   이게 없으면 이 주소로 곧장 들어왔을 때 인터넷 없이 안 열립니다. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(function () {});
  });
}
</script>
`;

const ROOT = process.cwd();

/* 퀴즈 첫화면(quiz/index.html)은 이미 자기 것을 등록하므로 건드리지 않습니다 */
const 대상 = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => path.join(ROOT, e.name, 'index.html'))
  .filter((p) => fs.existsSync(p));

let 넣음 = 0, 이미 = 0, 원래있음 = 0;
for (const p of 대상) {
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(표시)) { 이미++; continue; }
  if (s.includes('serviceWorker.register')) {
    원래있음++;
    console.log(`  · ${path.relative(ROOT, p)} — 원래 등록 코드가 있어 그냥 둡니다`);
    continue;
  }
  const i = s.lastIndexOf('</body>');
  if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </body> 가 없어 건너뜁니다`); continue; }
  fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
  console.log(`  ✓ ${path.relative(ROOT, p)}`);
  넣음++;
}

if (!넣음 && !이미) {
  console.error('✗ 넣을 곳을 찾지 못했습니다.');
  process.exit(1);
}
console.log(`\n${넣음}개에 넣음 · ${이미}개는 이미 되어 있었음 · ${원래있음}개는 원래 있었음`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
