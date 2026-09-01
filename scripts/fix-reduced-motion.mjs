/* '움직임 줄이기'를 켠 사람에게는 화면이 덜 움직이게 합니다.
 *
 * 무엇이 문제였나:
 *   화면마다 계속 움직이는 것이 많습니다.
 *     수업도우미 78개 · 퀴즈 목록 39개 · 사다리 23개 · 속담 21개
 *   반짝이는 별, 커졌다 작아지는 제목, 물결, 돌아가는 룰렛 같은 것들입니다.
 *
 *   그런데 어느 화면에도 '움직임 줄이기' 규칙이 없었습니다.
 *   윈도우·안드로이드·iOS 에는 「동작 줄이기」 설정이 있고, 어지럼증(전정기관)
 *   문제가 있거나 움직임에 쉽게 산만해지는 아이를 위해 켭니다.
 *   그 설정을 켜도 이 화면들은 그대로 움직였습니다.
 *
 * 어떻게 고쳤나:
 *   설정을 켠 경우에만 애니메이션을 아주 짧게 만듭니다.
 *   설정을 안 켠 사람(대부분)에게는 **아무것도 달라지지 않습니다.**
 *   0 이 아니라 0.01ms 로 두는 이유: 애니메이션이 '끝난 것'으로 처리되어야
 *   나타나야 할 것이 제대로 나타납니다. (0 으로 하면 안 보일 수 있습니다)
 *
 * 사용법: node scripts/fix-reduced-motion.mjs                    (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-reduced-motion.mjs     (퀴즈까지)
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'reduced-motion';

const 넣을것 = `<style id="${표시}">
/* 기기에서 '동작 줄이기'를 켠 경우에만 적용됩니다 (scripts/fix-reduced-motion.mjs).
   켜지 않은 사람에게는 아무 변화도 없습니다. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
`;

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 넣음 = 0, 이미 = 0;
for (const ROOT of 뿌리들) {
  const 후보 = [path.join(ROOT, 'app.html'), path.join(ROOT, 'index.html')];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (e.isDirectory()) {
      후보.push(path.join(ROOT, e.name, 'app.html'));
      후보.push(path.join(ROOT, e.name, 'index.html'));
    }
  }
  for (const p of 후보) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes(표시)) { 이미++; continue; }
    const i = s.lastIndexOf('</head>');
    if (i < 0) continue;
    fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
    넣음++;
  }
}
console.log(`움직임 줄이기 규칙을 ${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
