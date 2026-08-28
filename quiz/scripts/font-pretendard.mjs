/* 모든 화면의 글꼴을 Pretendard 하나로 통일합니다.
 *
 * 왜 필요한가:
 *   앱마다 다른 글꼴 이름을 적어 두었고(Inter, Space Grotesk, Arial,
 *   Jua, Gaegu, Gowun Dodum, Outfit, JetBrains Mono …), 그 중 상당수는
 *   파일이 아예 없어서 윈도우에서는 맑은고딕·Segoe UI 로 나옵니다.
 *   실제로 소음측정기는 Pretendard 를 한 글자도 쓰지 않고 있었습니다.
 *
 * 무엇을 하나:
 *   1) 각 화면에 Pretendard 글꼴 파일을 확실히 연결하고
 *   2) 모든 글자에 Pretendard 를 강제로 적용합니다.
 *   숫자는 자리폭이 흔들리지 않도록 고정폭(tabular-nums)으로 둡니다.
 *   이모지는 Pretendard 에 없으므로 자동으로 시스템 이모지로 넘어갑니다.
 *
 * 여러 번 실행해도 중복으로 들어가지 않습니다.
 * 사용법: node scripts/font-pretendard.mjs   (사이트 폴더 루트에서)
 */
import fs from 'fs';
import path from 'path';

const MARK = 'font-pretendard';
const ROOT = process.cwd();

const 블록 = (up) => `<style id="${MARK}">
  /* 글꼴 파일을 이 화면에 직접 연결합니다(빠져 있던 화면이 있었습니다) */
  @font-face {
    font-family: "Pretendard";
    font-weight: 45 920;
    font-style: normal;
    font-display: swap;
    src: url("${up}fonts/PretendardVariable.woff2") format("woff2-variations");
  }
  /* 앱마다 제각각이던 글꼴 변수도 전부 Pretendard 로 */
  :root {
    --font-sans: "Pretendard", sans-serif !important;
    --font-mono: "Pretendard", monospace !important;
    --font-rounded: "Pretendard", sans-serif !important;
    --font-display: "Pretendard", sans-serif !important;
  }
  /* 모든 글자를 Pretendard 로. 이모지는 자동으로 시스템 이모지로 넘어갑니다. */
  *, *::before, *::after {
    font-family: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif !important;
  }
  /* 숫자가 바뀔 때 자리폭이 흔들리지 않게 (타이머·스톱워치) */
  body { font-variant-numeric: tabular-nums; }
</style>
`;

let 넣음 = 0, 건너뜀 = 0;
function walk(dir, depth) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['scripts', 'node_modules', '.git', 'assets', 'fonts', 'shared', 'download'].includes(e.name) && depth < 2) walk(p, depth + 1);
      continue;
    }
    if (e.name !== 'app.html') continue;
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes(MARK)) { 건너뜀++; continue; }
    if (!s.includes('</body>')) { console.warn('  body 태그 없음:', p); continue; }
    const up = depth === 0 ? './' : '../';
    fs.writeFileSync(p, s.replace('</body>', 블록(up) + '</body>'));
    console.log('  ✓', path.relative(ROOT, p) || 'app.html');
    넣음++;
  }
}
walk(ROOT, 0);
console.log(`\n${넣음}개 적용, ${건너뜀}개는 이미 적용됨`);
