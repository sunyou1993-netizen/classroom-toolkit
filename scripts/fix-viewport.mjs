/* 화면마다 다르던 '손가락 확대 막기' 설정을 맞춥니다.
 *
 * 무엇이 달랐나:
 *   보드는 터치스크린입니다. 아이가 두 손가락으로 벌리면 화면이 확대되고,
 *   그대로 두면 다음 사람이 볼 때까지 틀어진 채로 남습니다.
 *   겉틀(index.html)에는 확대 막기가 다 들어 있는데, 속 화면(app.html)은
 *   9개 중 3개만 들어 있었습니다.
 *
 *     들어 있던 것 : pomodoro, stopwatch, noise
 *     없던 것      : timer, worldclock, paint, picker, instruments, ladder
 *
 * 얼마나 급한가:
 *   평소에는 겉틀을 거쳐 들어가므로 겉틀의 설정이 먹습니다. 그래서 지금
 *   당장 문제가 되지는 않습니다. 다만 주소로 바로 들어가거나 즐겨찾기로
 *   열면 막이 없습니다. 화면 제목을 맞춘 것과 같은 이유로 맞춰 둡니다.
 *
 * 사용법: node scripts/fix-viewport.mjs                     (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-viewport.mjs      (퀴즈까지)
 */
import fs from 'fs';
import path from 'path';

const 맞출값 = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 고침 = 0, 그대로 = 0;
for (const ROOT of 뿌리들) {
  for (const 이름 of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!이름.isDirectory()) continue;
    const p = path.join(ROOT, 이름.name, 'app.html');
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    const m = s.match(/<meta\s+name="viewport"\s+content="([^"]*)"\s*\/?>/i);
    if (!m) { console.log(`  · ${이름.name}/app.html — viewport 줄이 없어 건너뜁니다`); continue; }
    const 막혀있나 = /user-scalable\s*=\s*no/.test(m[1]) && /maximum-scale\s*=\s*1/.test(m[1]);
    if (막혀있나) { 그대로++; continue; }
    fs.writeFileSync(p, s.replace(m[0], `<meta name="viewport" content="${맞출값}">`));
    console.log(`  ✓ ${이름.name}/app.html  «${m[1]}»`);
    console.log(`      → «${맞출값}»`);
    고침++;
  }
}
console.log(`\n확대 막기 ${고침}개 화면에 넣음 · ${그대로}개는 이미 되어 있었음`);
