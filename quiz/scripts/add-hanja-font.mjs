/* 한자 글꼴을 모든 화면에 연결합니다.
 *
 * 왜 필요한가:
 *   제품에 담아 보내는 글꼴은 Pretendard 하나인데, Pretendard에는 한자가
 *   한 글자도 없습니다(글리프 14,336자 중 한자 0자 — 파일을 열어 확인했습니다).
 *   지금은 한자가 전부 보드 윈도우에 깔린 글꼴에 기대고 있어서,
 *   Windows 10 IoT 에 맑은 고딕이 없으면 사자성어 144문항의 한자가
 *   모두 네모(□)로 나옵니다.
 *
 * 무엇을 하나:
 *   1) scripts/make-hanja-font.py 로 만든 HanjaSubset.woff2 를 각 화면에 연결하고
 *   2) 강제 글꼴 줄에 "Hanja" 를 Pretendard 바로 뒤에 끼워 넣습니다.
 *      한글·숫자는 Pretendard 가 먼저 가져가고, Pretendard 에 없는 한자만
 *      이 글꼴로 넘어갑니다. 글꼴 순서가 그렇게 동작합니다.
 *
 * 여러 번 실행해도 중복으로 들어가지 않습니다.
 * 사용법: python3 scripts/make-hanja-font.py && node scripts/add-hanja-font.mjs
 */
import fs from 'fs';
import path from 'path';

const MARK = 'font-hanja';
const ROOT = process.cwd();

if (!fs.existsSync(path.join(ROOT, 'fonts', 'HanjaSubset.woff2'))) {
  console.error('fonts/HanjaSubset.woff2 가 없습니다. 먼저 python3 scripts/make-hanja-font.py 를 실행하세요.');
  process.exit(1);
}

const 블록 = (up) => `<style id="${MARK}">
  /* 한자 글꼴 — Pretendard 에 한자가 한 글자도 없어서 따로 담았습니다.
     Noto Sans CJK KR 에서 실제로 쓰는 한자 387자만 뽑은 파일입니다(SIL 오픈폰트 라이선스). */
  @font-face {
    font-family: "Hanja";
    font-style: normal;
    font-display: swap;
    src: url("${up}fonts/HanjaSubset.woff2") format("woff2");
    /* 한자 영역만 이 글꼴을 쓰게 해서, 한글은 Pretendard 가 그대로 맡습니다. */
    unicode-range: U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF;
  }
</style>
`;

let 넣음 = 0, 건너뜀 = 0, 순서고침 = 0;
function walk(dir, depth) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['scripts', 'node_modules', '.git', 'assets', 'fonts', 'shared', 'download'].includes(e.name) && depth < 2) walk(p, depth + 1);
      continue;
    }
    if (e.name !== 'app.html' && e.name !== 'index.html') continue;
    let s = fs.readFileSync(p, 'utf8');
    let 바뀜 = false;

    // 강제 글꼴 줄에 Hanja 를 Pretendard 바로 뒤로 끼워 넣습니다.
    const 옛줄 = '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif !important';
    const 새줄 = '"Pretendard", "Hanja", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif !important';
    if (s.includes(옛줄)) { s = s.split(옛줄).join(새줄); 바뀜 = true; 순서고침++; }

    if (!s.includes(MARK)) {
      if (!s.includes('</body>')) { if (바뀜) fs.writeFileSync(p, s); continue; }
      const up = depth === 0 ? './' : '../';
      s = s.replace('</body>', 블록(up) + '</body>');
      바뀜 = true; 넣음++;
    } else 건너뜀++;

    if (바뀜) { fs.writeFileSync(p, s); console.log('  ✓', path.relative(ROOT, p) || e.name); }
  }
}
walk(ROOT, 0);

// 공용 fonts.css 에도 남겨 둡니다(직접 불러 쓰는 화면이 있을 수 있어서).
const css = path.join(ROOT, 'fonts', 'fonts.css');
if (fs.existsSync(css)) {
  let s = fs.readFileSync(css, 'utf8');
  if (!s.includes('"Hanja"')) {
    s += `\n/* 한자 글꼴 — Pretendard 에 한자가 없어 따로 담았습니다.
   Noto Sans CJK KR 에서 쓰는 글자만 뽑았습니다(SIL 오픈폰트 라이선스). */
@font-face{font-family:"Hanja";font-style:normal;font-display:swap;
  src:url("./HanjaSubset.woff2") format("woff2");
  unicode-range:U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF;}
`;
    fs.writeFileSync(css, s);
    console.log('  ✓ fonts/fonts.css');
  }
}

console.log(`\n글꼴 블록 ${넣음}개 넣음 · ${건너뜀}개는 이미 있음 · 글꼴 순서 ${순서고침}곳 고침`);
