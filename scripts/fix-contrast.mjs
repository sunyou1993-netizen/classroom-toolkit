/* 연한 회색 보조 글자를 한 단계 진하게 해서, 교실 뒤에서도 읽히게 합니다.
 *
 * 무엇이 문제였나:
 *   화면을 찍어서 글자 픽셀과 그 아래 배경 픽셀을 직접 재 봤습니다.
 *   보조 설명 글자가 거의 다 같은 색이었습니다.
 *
 *     rgb(144,161,185)  (= Tailwind 의 slate-400)  흰 바탕에서 대비 2.63 : 1
 *
 *   국제 기준(WCAG AA)은 본문 글자 4.5:1, 큰 글자 3:1 을 요구합니다.
 *   지금은 둘 다 못 넘깁니다. 화면이 65인치이고 아이들이 교실 뒤에서 보는
 *   물건이라, 손바닥만 한 화면보다 오히려 더 중요합니다.
 *
 *   이런 글자들이 걸렸습니다:
 *     · 수업도우미 첫 화면의 도구 설명 9줄 ("원하는 시간을 설정하고…")
 *     · 그림판 탭 이름 5개 (색상·스티커·배경지·테이프·종이)
 *     · 세계시간의 UTC 표시 6개
 *     · 소음측정기의 dB 단위
 *     · 피아노의 정확도·진행도·마디·반주 소리
 *     · 타이머의 "다같이 시작해볼까요?"
 *
 * 어떻게 고쳤나:
 *   색을 한 단계만 진하게 합니다. slate-400 → slate-500 (#64748B).
 *   같은 색 계열이라 보기에는 거의 그대로이고, 흰 바탕에서 4.76:1 이 되어
 *   기준을 넘깁니다. 글자 색만 바꾸고 배경·테두리·배치는 건드리지 않습니다.
 *
 *   꺼져 있는(누를 수 없는) 단추는 원래 연한 게 맞고 기준에서도 빼므로
 *   그대로 둡니다.
 *
 * 사용법: node scripts/fix-contrast.mjs                    (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-contrast.mjs     (퀴즈까지)
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'contrast-bump';
const 진하게 = '#64748B'; // slate-500 — 흰 바탕에서 4.76:1

const 넣을것 = `<style id="${표시}">
/* 보조 글자를 한 단계 진하게 (scripts/fix-contrast.mjs)
   slate-400 은 흰 바탕에서 2.63:1 이라 국제 기준(4.5:1)에 못 미칩니다.
   같은 계열의 slate-500 으로 한 단계만 내려 4.76:1 을 맞춥니다.
   배경·테두리는 그대로 두고 글자 색만 바꿉니다. */
.text-slate-400 { color: ${진하게} !important; }
.stat-title,
.bar-progress-label,
.backing-volume-label { color: ${진하게} !important; }   /* 피아노 정확도·진행도·마디·반주 소리 */

/* 타이머의 "다같이 시작해볼까요?" 는 위 utility 를 쓰지 않고 색을 직접 씁니다 */
[class*="text-slate-400"] { color: ${진하게} !important; }
</style>
`;

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 넣음 = 0, 이미 = 0;
for (const ROOT of 뿌리들) {
  const 후보 = [path.join(ROOT, 'app.html')];
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (e.isDirectory()) 후보.push(path.join(ROOT, e.name, 'app.html'));
  }
  for (const p of 후보) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (s.includes(표시)) { 이미++; continue; }
    const i = s.lastIndexOf('</head>');
    if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </head> 가 없어 건너뜁니다`); continue; }
    fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
    console.log(`  ✓ ${path.relative(ROOT, p)}`);
    넣음++;
  }
}
console.log(`\n${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
