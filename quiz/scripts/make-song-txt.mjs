/* 학교 파일(schools/○○.json)을 보드에 넣을 '교가.txt' 로 만들어 줍니다.
 *
 * 왜 필요한가:
 *   교가는 exe 안에 들어가지 않습니다. 학교마다 다르고 가사에 저작권이 있어서,
 *   exe 는 모든 학교가 똑같은 것을 쓰고 교가만 exe 옆의 글 파일 하나로 정합니다.
 *
 *     수업도우미.exe   ← 모든 학교가 같은 파일
 *     교가.txt         ← 이 스크립트가 만들어 주는, 학교마다 다른 파일
 *
 * 쓰는 법 (퀴즈 폴더에서):
 *   node scripts/make-song-txt.mjs                    어떤 학교가 있는지 보기
 *   node scripts/make-song-txt.mjs 서울신답초등학교     교가.txt 만들기
 *   node scripts/make-song-txt.mjs 전체                있는 학교 전부 만들기
 *
 * 만들어진 파일은 scripts/out/ 안에 학교 이름으로 생깁니다.
 * 보드에 넣을 때는 exe 와 같은 폴더에 두고 이름을 '교가.txt' 로 바꿔 주세요.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 학교폴더 = path.join(ROOT, 'scripts', 'schools');
const 나갈폴더 = path.join(ROOT, 'scripts', 'out');

const 학교목록 = fs.existsSync(학교폴더)
  ? fs.readdirSync(학교폴더).filter((n) => n.endsWith('.json') && !n.startsWith('_'))
      .map((n) => n.replace(/\.json$/, ''))
  : [];

const 고른것 = process.argv[2];
if (!고른것) {
  console.log('만들 수 있는 학교:');
  학교목록.forEach((n) => console.log('   ·', n));
  if (!학교목록.length) console.log('   (없습니다. scripts/schools/_새학교_양식.json 을 복사해 만드세요)');
  console.log('\n쓰는 법:');
  console.log('   node scripts/make-song-txt.mjs ' + (학교목록[0] || '○○초등학교'));
  console.log('   node scripts/make-song-txt.mjs 전체');
  process.exit(0);
}

const 만들목록 = (고른것 === '전체' || 고른것 === 'all') ? 학교목록 : [고른것];

fs.mkdirSync(나갈폴더, { recursive: true });
let 만듦 = 0;
for (const 학교 of 만들목록) {
  const p = path.join(학교폴더, 학교 + '.json');
  if (!fs.existsSync(p)) {
    console.error(`✗ scripts/schools/${학교}.json 이 없습니다`);
    console.error('  있는 학교:', 학교목록.join(' / ') || '(없음)');
    process.exit(1);
  }
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));

  const 줄들 = [];
  줄들.push(`# ${s.schoolName} 교가`);
  줄들.push('#');
  줄들.push('# 이 파일을 수업도우미.exe 와 같은 폴더에 두고 이름을 \'교가.txt\' 로 하세요.');
  줄들.push('# 프로그램을 껐다 켜면 교가 퀴즈에 우리 학교 교가가 나옵니다.');
  줄들.push('# 잘 됐는지는 옆에 생기는 \'교가-확인.txt\' 를 열어 보면 알 수 있습니다.');
  줄들.push('#');
  줄들.push('# 고칠 때는 반드시 인코딩을 UTF-8 로 저장하세요.');
  줄들.push('# (메모장 → 다른 이름으로 저장 → 아래쪽 \'인코딩\'을 UTF-8 로)');
  줄들.push('#');
  줄들.push('# ※ 교가 가사와 곡에는 작사·작곡가의 저작권이 있습니다. 우리 학교 교가만 넣으세요.');
  줄들.push('');
  줄들.push(`학교이름: ${s.schoolName}`);
  if (s.refrain) 줄들.push(`후렴: ${s.refrain}`);
  s.verses.forEach((절, i) => {
    줄들.push('');
    줄들.push(`${i + 1}절`);
    절.forEach((줄) => 줄들.push(줄));
  });
  줄들.push('');

  const 나갈길 = path.join(나갈폴더, `교가-${s.schoolName}.txt`);
  fs.writeFileSync(나갈길, 줄들.join('\n'), 'utf8');
  const 줄수 = s.verses.reduce((n, v) => n + v.length, 0);
  console.log(`  ✓ ${path.relative(ROOT, 나갈길)}  (${s.verses.length}절 · ${줄수}줄)`);
  만듦++;
}

console.log(`\n${만듦}개를 만들었습니다.`);
console.log('보드에 넣을 때: exe 와 같은 폴더에 두고 이름을 "교가.txt" 로 바꾸세요.');
