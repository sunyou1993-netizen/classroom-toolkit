/* 화면 제목(<title>)을 바로잡습니다.
 *
 * 왜 필요한가:
 *   화면 제목을 하나씩 열어 보니 개발 과정의 흔적이 그대로 남아 있었습니다.
 *     · 학교폭력 화면 제목이 "서울신답초등학교 교가 맞추기"  ← 복사해 쓴 자국
 *     · 타이머·그림판 제목이 "My Google AI Studio App"
 *     · 소음측정기 제목이 "소음측정기 WebView"
 *   평소에는 바깥 틀의 제목이 보여서 눈에 띄지 않지만, 주소로 바로 들어가거나
 *   즐겨찾기에 담으면 이 제목이 그대로 나옵니다.
 *
 * 사용법: node scripts/fix-titles.mjs          (퀴즈 폴더에서)
 *         BASE=/root/work/_toolkit node scripts/fix-titles.mjs   (수업도우미까지)
 */
import fs from 'fs';
import path from 'path';

const 고칠제목 = {
  // 퀴즈
  'violence/app.html': '학교폭력 예방 퀴즈',
  'song/app.html': '교가 맞추기',
  'app.html': '간단교육 퀴즈',
  'proverb/app.html': '속담 맞추기',
  'environment/app.html': '환경 퀴즈',
  'safe/app.html': '안전 퀴즈',
  // 수업도우미
  'timer/app.html': '타이머',
  'pomodoro/app.html': '뽀모도로 타이머',
  'paint/app.html': '그림판(판서)',
  'noise/app.html': '소음측정기',
  'picker/app.html': '발표자 선정',
  'instruments/app.html': '피아노 연주',
  'ladder/app.html': '사다리 타기',
  'stopwatch/app.html': '스톱워치',
  'worldclock/app.html': '세계시간',
};

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 고침 = 0, 그대로 = 0;
for (const ROOT of 뿌리들) {
  for (const [상대, 새제목] of Object.entries(고칠제목)) {
    const p = path.join(ROOT, 상대);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    const m = s.match(/<title>([^<]*)<\/title>/);
    if (!m) continue;
    if (m[1] === 새제목) { 그대로++; continue; }
    fs.writeFileSync(p, s.replace(m[0], `<title>${새제목}</title>`));
    console.log(`  ✓ ${path.relative(ROOT, p).padEnd(24)} «${m[1]}» → «${새제목}»`);
    고침++;
  }
}
console.log(`\n제목 ${고침}개 고침 · ${그대로}개는 이미 맞음`);
