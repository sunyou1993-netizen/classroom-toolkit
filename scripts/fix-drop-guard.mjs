/* 화면에 파일을 끌어다 놓아도 수업 화면을 벗어나지 않게 막습니다.
 *
 * 무엇이 문제였나:
 *   12개 화면에서 실제로 눌러 보고 확인했습니다.
 *
 *     오른쪽 클릭(길게 누르기) 메뉴  →  12개 다 막혀 있음   ✓
 *     글자 선택·복사               →  12개 다 막혀 있음   ✓
 *     파일을 끌어다 놓기            →  12개 다 **열려 있음** ✗
 *
 *   브라우저는 창에 파일을 끌어다 놓으면 그 파일을 엽니다. 기본 동작입니다.
 *   즉 아이가 아무 사진이나 문서를 보드 화면에 끌어다 놓으면
 *   수업도우미가 사라지고 그 파일이 뜹니다. 선생님이 다시 맞춰 놓아야 합니다.
 *
 * 얼마나 급한가:
 *   보드가 전체화면 키오스크로 돌면 끌어올 파일 목록 자체가 안 보이므로
 *   당장 큰 문제는 아닙니다. 다만 창 모드로 쓰거나, 보드에 파일 탐색기가
 *   같이 떠 있으면 바로 일어납니다. 막는 비용이 거의 없어서 막아 둡니다.
 *
 * 어떻게 고쳤나:
 *   끌어오는 것과 놓는 것을 그냥 무시합니다. 여섯 줄입니다.
 *   그림판이 나중에 "사진 끌어다 넣기"를 지원하게 되면 이 부분을 빼면 됩니다.
 *   (지금은 그런 기능이 없습니다 — 확인했습니다)
 *
 * 사용법: node scripts/fix-drop-guard.mjs                    (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-drop-guard.mjs     (퀴즈까지)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'drop-guard';

const 넣을것 = `<script id="${표시}">
/* 파일을 끌어다 놓아도 수업 화면을 벗어나지 않게 합니다 (scripts/fix-drop-guard.mjs).
   브라우저는 기본으로 끌어다 놓은 파일을 열어 버립니다. */
['dragenter', 'dragover', 'drop'].forEach(function (종류) {
  window.addEventListener(종류, function (e) { e.preventDefault(); }, false);
});
</script>
`;

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 넣음 = 0, 이미 = 0;
for (const ROOT of 뿌리들) {
  const 후보 = [path.join(ROOT, 'index.html'), path.join(ROOT, 'app.html')];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (e.isDirectory()) {
      후보.push(path.join(ROOT, e.name, 'index.html'));
      후보.push(path.join(ROOT, e.name, 'app.html'));
    }
  }
  for (const p of 후보) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes(표시)) { 이미++; continue; }
    const i = s.lastIndexOf('</body>');
    if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </body> 가 없어 건너뜁니다`); continue; }
    fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
    console.log(`  ✓ ${path.relative(ROOT, p)}`);
    넣음++;
  }
}
console.log(`\n${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
