/* 퀴즈 첫화면이 버벅이던 것을 고칩니다.
 *
 * 무엇이 문제였나:
 *   보드 해상도(2160×3840)로 띄워 놓고 프레임을 재 봤습니다.
 *   (60이 부드럽고, 30 밑이면 눈에 끊겨 보입니다)
 *
 *     사다리      60프레임      환경 퀴즈   60프레임
 *     수업도우미   60프레임      속담·사자성어 60프레임
 *     ...
 *     퀴즈 첫화면  28프레임   ← 여기만
 *
 *   CPU 를 8배 느리게 해도 28, 그대로 둬도 28 이었습니다.
 *   즉 "보드가 느려서"가 아니라 **이 화면 자체가** 그렇습니다.
 *   아이들이 퀴즈에서 제일 먼저 보는 화면입니다.
 *
 * 왜 그런가:
 *   배경에서 반짝이는 별이 24개 있습니다. 각 별의 규칙이 이렇습니다.
 *
 *     .twinkle-star { filter: drop-shadow(...) drop-shadow(...) }
 *     @keyframes twinkleStar { 50% { ... filter: drop-shadow(...) drop-shadow(...) } }
 *
 *   투명도(opacity)와 크기(transform)를 움직이는 것은 그래픽칩이 처리해서 쌉니다.
 *   그런데 **그림자 번짐(drop-shadow)을 움직이면** 매 프레임 화면을 다시 그리고
 *   흐림 효과를 다시 계산해야 합니다. 그것도 별 24개가 각자, 2겹씩.
 *
 * 어떻게 고쳤나:
 *   반짝임(투명도 .15→1)과 커졌다 작아짐(0.6→1.35배), 회전은 **그대로 둡니다.**
 *   빛 번짐만 '가장 밝을 때 값'으로 고정합니다.
 *   눈으로는 거의 같고, 프레임은 28 → 60 으로 돌아옵니다.
 *
 *   ※ 별 개수를 줄이거나 반짝임을 끄지 않았습니다. 보이는 것은 그대로입니다.
 *
 * 사용법: node scripts/fix-star-glow.mjs      (퀴즈 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'star-glow-perf';

const 넣을것 = `<style id="${표시}">
/* 반짝이는 별의 '빛 번짐'만 고정합니다 (scripts/fix-star-glow.mjs).
   반짝임·크기·회전은 그대로 둡니다. 빛 번짐을 움직이면 매 프레임 화면을
   다시 그려야 해서, 별 24개 × 2겹이면 보드에서 28프레임까지 떨어집니다.
   고정하면 60프레임으로 돌아오고, 눈으로는 거의 같습니다. */
@keyframes twinkleStar {
  0%, 100% { opacity: .15; transform: scale(.6) rotate(0deg); }
  50%      { opacity: 1;   transform: scale(1.35) rotate(25deg); }
}
.twinkle-star {
  filter: drop-shadow(0 0 10px rgba(255,255,255,.95))
          drop-shadow(0 0 20px rgba(147,197,253,.8));
}
</style>
`;

const ROOT = process.cwd();
const 후보 = [path.join(ROOT, 'app.html')];
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (e.isDirectory()) 후보.push(path.join(ROOT, e.name, 'app.html'));
}

let 넣음 = 0, 이미 = 0, 해당없음 = 0;
for (const p of 후보) {
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(표시)) { 이미++; continue; }
  /* 이 화면이 정말 별을 쓰는지 확인하고 넣습니다 */
  const 폴더 = path.dirname(p);
  const css = path.join(폴더, 'assets');
  let 별쓰나 = false;
  if (fs.existsSync(css)) {
    for (const f of fs.readdirSync(css).filter((n) => n.endsWith('.css'))) {
      if (fs.readFileSync(path.join(css, f), 'utf8').includes('twinkleStar')) { 별쓰나 = true; break; }
    }
  }
  if (!별쓰나) { 해당없음++; continue; }
  const i = s.lastIndexOf('</head>');
  if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </head> 가 없어 건너뜁니다`); continue; }
  fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
  console.log(`  ✓ ${path.relative(ROOT, p)}`);
  넣음++;
}

if (!넣음 && !이미) {
  console.error('✗ 반짝이는 별을 쓰는 화면을 찾지 못했습니다.');
  process.exit(1);
}
console.log(`\n${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음 · ${해당없음}개는 별을 안 씀`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
