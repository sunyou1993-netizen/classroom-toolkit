/* 교실 대형 터치화면(사이니지)에서만 생기는 잔손질을 각 앱에 심어 줍니다.
 *
 * 무엇을 막나:
 *   - 손가락을 오래 누르고 있으면 뜨는 브라우저 메뉴(복사/저장…)
 *   - 두 손가락으로 벌려서 화면이 확대돼 레이아웃이 어긋나는 것
 *   - 드래그하면 글자가 파랗게 잡히는 것 (입력칸은 그대로 둡니다)
 *   - 끝까지 스크롤했을 때 화면이 튕기는 것
 *
 * 두 번 실행해도 중복으로 들어가지 않습니다.
 * 사용법: node scripts/kiosk-guard.mjs   (사이트 폴더 루트에서)
 */
import fs from 'fs';
import path from 'path';

const MARK = 'kiosk-guard';
const BLOCK = `<style id="${MARK}">
  * { -webkit-tap-highlight-color: transparent; }
  html, body { touch-action: manipulation; overscroll-behavior: none; }
  body { -webkit-user-select: none; user-select: none; }
  input, textarea, select, [contenteditable] { -webkit-user-select: text; user-select: text; }
</style>
<script data-${MARK}>
  /* 길게 누르기 메뉴와 두 손가락 확대만 막습니다.
     앱이 가진 기능은 그대로 두고, 브라우저 기본 동작만 취소합니다. */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, true);
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
</script>
`;

const ROOT = process.cwd();
let n = 0, skip = 0;
function walk(dir, depth) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['scripts', 'node_modules', '.git', 'assets', 'fonts', 'shared', 'download'].includes(e.name) && depth < 2) walk(p, depth + 1);
      continue;
    }
    if (e.name !== 'app.html') continue;
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes(MARK)) { skip++; continue; }
    if (!s.includes('</body>')) { console.warn('  body 태그 없음:', p); continue; }
    fs.writeFileSync(p, s.replace('</body>', BLOCK + '</body>'));
    console.log('  ✓', path.relative(ROOT, p));
    n++;
  }
}
walk(ROOT, 0);
console.log(`\n${n}개 추가, ${skip}개는 이미 적용됨`);
