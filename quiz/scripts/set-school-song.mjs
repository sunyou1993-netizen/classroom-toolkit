/* 교가 퀴즈를 우리 학교 교가로 바꿉니다.
 *
 * 왜 필요한가:
 *   교가 퀴즈에는 특정 학교(서울신답초등학교)의 교가가 그대로 들어 있습니다.
 *   다른 학교에 그대로 배포하면 남의 학교 교가를 가르치게 됩니다.
 *
 * 쓰는 법:
 *   1) scripts/school-song.json 파일을 우리 학교 교가로 고칩니다.
 *   2) node scripts/set-school-song.mjs
 *   3) node scripts/make-sw.mjs  (오프라인 캐시 버전 갱신)
 *
 * school-song.json 모양:
 *   {
 *     "schoolName": "○○초등학교",
 *     "verses": [
 *       ["첫째 줄 [빈칸]으로 만들 두 글자", "둘째 줄 ...", ...],   ← 1절
 *       ["...", "..."]                                              ← 2절 (없으면 생략)
 *     ]
 *   }
 *   대괄호 [ ] 로 감싼 두 글자가 빈칸이 됩니다.
 *   대괄호를 안 쓰면 줄마다 적당한 두 글자를 자동으로 고릅니다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 설정경로 = path.join(ROOT, 'scripts', 'school-song.json');
if (!fs.existsSync(설정경로)) {
  console.error('scripts/school-song.json 이 없습니다. 먼저 만들어 주세요.');
  process.exit(1);
}
const 설정 = JSON.parse(fs.readFileSync(설정경로, 'utf8'));

const 초성표 = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const 초성 = (글자) => {
  const c = 글자.charCodeAt(0) - 44032;
  return (c < 0 || c > 11171) ? 글자 : 초성표[Math.floor(c / 588)];
};

function 줄만들기(원문) {
  let 본문 = 원문, 시작 = -1;
  const m = 원문.match(/\[([^\]]{2})\]/);
  if (m) { 시작 = 원문.indexOf(m[0]); 본문 = 원문.replace(m[0], m[1]); }
  else {
    // 대괄호가 없으면: 공백이 아닌 연속 두 글자를 가운데쯤에서 고릅니다.
    const 후보 = [];
    for (let i = 0; i < 본문.length - 1; i++) {
      if (본문[i] !== ' ' && 본문[i + 1] !== ' ') 후보.push(i);
    }
    if (!후보.length) throw new Error('빈칸으로 쓸 두 글자를 찾지 못했습니다: ' + 원문);
    시작 = 후보[Math.floor(후보.length / 2)];
  }
  const a = 본문[시작], b = 본문[시작 + 1];
  const 앞 = 본문.slice(0, 시작), 뒤 = 본문.slice(시작 + 2);
  const parts = [];
  if (앞) parts.push({ text: 앞 });
  parts.push({ target: a, choseong: 초성(a) });
  parts.push({ text: ' ' });
  parts.push({ target: b, choseong: 초성(b) });
  if (뒤) parts.push({ text: 뒤 });
  return { fullText: 본문, displayParts: parts, answers: [a, b] };
}

// 아이가 눌러서 채우는 글자 타일. 정답 글자들 + 헷갈리게 하는 글자 몇 개.
const 여벌후보 = ['꿈', '빛', '별', '숲', '해', '달', '샘', '길', '들', '터'];
function 타일만들기(lines) {
  const 정답 = lines.flatMap((l) => l.answers);
  const 여벌 = 여벌후보.filter((c) => !정답.includes(c)).slice(0, 2);
  return [...정답, ...여벌];
}

const verses = 설정.verses.map((줄들, i) => {
  const lines = 줄들.map(줄만들기);
  return {
    verseNum: i + 1,
    title: `교가 ${i + 1}절`,
    lines,
    keypadTiles: 타일만들기(lines),
  };
});

const 새데이터 = 'schoolName:' + JSON.stringify(설정.schoolName) + ',verses:' + JSON.stringify(verses);

// 번들 안의 기존 데이터를 통째로 갈아 끼웁니다.
const 파일들 = fs.readdirSync(path.join(ROOT, 'song', 'assets')).filter((n) => n.endsWith('.js'))
  .map((n) => path.join(ROOT, 'song', 'assets', n));
let 바뀜 = 0;
for (const f of 파일들) {
  const s = fs.readFileSync(f, 'utf8');
  const i = s.indexOf('schoolName:');
  if (i < 0) continue;
  // verses 배열의 끝을 찾습니다.
  const j = s.indexOf('verses:[', i);
  if (j < 0) continue;
  let depth = 0, k = j + 'verses:'.length;
  for (; k < s.length; k++) {
    if (s[k] === '[') depth++;
    else if (s[k] === ']') { depth--; if (depth === 0) { k++; break; } }
  }
  fs.writeFileSync(f, s.slice(0, i) + 새데이터 + s.slice(k));
  console.log('  ✓ 교체:', path.relative(ROOT, f));
  바뀜++;
}
if (!바뀜) { console.error('교가 데이터를 찾지 못했습니다.'); process.exit(1); }

/* 목록에서 교가 카드 켜기 / 끄기
 *
 * 교가는 학교마다 다릅니다. 우리 학교 교가를 넣기 전에는 목록에 보이지 않게 해서,
 * 다른 학교 교가가 그대로 나가는 일이 없도록 합니다.
 * 이 스크립트를 돌리면(= 우리 학교 교가를 넣으면) 자동으로 다시 켜집니다.
 */
const 카드 = '{id:"school",title:"교가",desc:"우리 학교 노래를 불러봐요",iconBg:"#E0F2FE",iconImg:d.image1680,url:"./song/app.html",questions:[]},';
const 목록파일 = fs.readdirSync(path.join(ROOT, 'assets')).filter((n) => n.endsWith('.js'))
  .map((n) => path.join(ROOT, 'assets', n));
const 켜기 = process.env.SCHOOL_SONG !== 'off';
for (const f of 목록파일) {
  const s = fs.readFileSync(f, 'utf8');
  const 있음 = s.includes('id:"school"');
  if (켜기 && !있음 && s.includes('y=[{id:"sokdam"')) {
    fs.writeFileSync(f, s.replace('y=[{id:"sokdam"', 'y=[' + 카드 + '{id:"sokdam"'));
    console.log('  ✓ 목록에 교가 카드를 켰습니다');
  } else if (!켜기 && 있음) {
    fs.writeFileSync(f, s.replace(카드, ''));
    console.log('  ✓ 목록에서 교가 카드를 껐습니다');
  }
}

console.log(`\n${설정.schoolName} 교가로 바꿨습니다 · ${verses.length}절 · ${verses.reduce((n,v)=>n+v.lines.length,0)}줄`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
