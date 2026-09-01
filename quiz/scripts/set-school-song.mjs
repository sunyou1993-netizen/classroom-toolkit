/* 교가 퀴즈를 학교별 교가로 바꿉니다.
 *
 * 왜 필요한가:
 *   교가는 학교마다 다르고, 가사에는 작사·작곡가의 저작권이 있습니다.
 *   A학교에 배포하는 프로그램에 B학교 교가가 들어 있으면 안 됩니다.
 *   그래서 학교마다 파일을 따로 두고, 만들 때 하나만 골라 넣습니다.
 *
 * 쓰는 법:
 *   node scripts/set-school-song.mjs                  ← 어떤 학교가 있는지 보여 줍니다
 *   node scripts/set-school-song.mjs 서울신답초등학교   ← 그 학교 교가를 넣습니다
 *   node scripts/set-school-song.mjs 없음              ← 교가를 빼고 카드도 숨깁니다
 *   node scripts/make-sw.mjs                          ← 그다음 꼭 실행 (오프라인 캐시 갱신)
 *
 * 학교 파일은 scripts/schools/ 안에 한 학교당 한 개씩 둡니다.
 *   scripts/schools/서울신답초등학교.json
 *   scripts/schools/_새학교_양식.json     ← 새 학교를 만들 때 복사해 쓰는 양식
 *   (이름이 _ 로 시작하는 파일은 학교로 세지 않습니다)
 *
 * 학교 파일 모양:
 *   {
 *     "schoolName": "○○초등학교",
 *     "refrain": "아 빛내자 우리 학교 ○○초등학교",
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
const 학교폴더 = path.join(ROOT, 'scripts', 'schools');

/* 어떤 학교 파일들이 있는지 모읍니다 (_ 로 시작하는 것은 양식이라 뺍니다) */
const 학교목록 = fs.existsSync(학교폴더)
  ? fs.readdirSync(학교폴더).filter((n) => n.endsWith('.json') && !n.startsWith('_'))
      .map((n) => n.replace(/\.json$/, ''))
  : [];

/* 지금 무슨 교가가 들어가 있는지 봅니다 */
function 지금학교() {
  try {
    const f = fs.readdirSync(path.join(ROOT, 'song', 'assets')).find((n) => n.endsWith('.js'));
    const s = fs.readFileSync(path.join(ROOT, 'song', 'assets', f), 'utf8');
    const m = s.match(/schoolName:"([^"]*)"/);
    const 꺼짐 = fs.readFileSync(path.join(ROOT, 'song', 'app.html'), 'utf8').includes('song-guard');
    return (m ? m[1] : '?') + (꺼짐 ? '  (꺼져 있음 — 목록에 안 보임)' : '');
  } catch { return '?'; }
}

const 고른학교 = process.argv[2];

if (!고른학교) {
  console.log('지금 들어 있는 교가:', 지금학교());
  console.log('\n고를 수 있는 학교:');
  if (학교목록.length) 학교목록.forEach((n) => console.log('   ·', n));
  else console.log('   (아직 없습니다. scripts/schools/_새학교_양식.json 을 복사해서 만드세요)');
  console.log('\n쓰는 법:');
  console.log('   node scripts/set-school-song.mjs ' + (학교목록[0] || '○○초등학교'));
  console.log('   node scripts/set-school-song.mjs 없음          ← 교가 빼기');
  process.exit(0);
}

/* 세 가지 모드
 *   ○○초등학교 : 그 학교 교가를 넣고 카드도 켭니다 (한 학교만 쓰는 경우)
 *   없음        : 자리표시자를 넣고 카드도 끕니다 (저장소의 기본 상태)
 *   런처        : 자리표시자 + 문지기는 달되 **카드는 켠 채로** 둡니다.
 *                 exe 를 만들 때만 씁니다(build.sh 가 부릅니다).
 *
 * 왜 '런처' 모드가 따로 있나:
 *   exe 는 켜질 때 옆의 교가.txt 를 보고 교가를 넣습니다(launcher/schoolsong.go).
 *   런처는 카드를 **빼는 것만** 할 수 있고 없는 카드를 새로 만들지는 못합니다.
 *   (카드 코드에 압축된 변수 이름이 섞여 있어, 바깥에서 지어 넣으면 깨집니다.)
 *   그래서 exe 안에는 카드를 켠 채로 넣어 두고,
 *     · 교가.txt 있음 → 런처가 문지기만 뗍니다        → 교가 나옴
 *     · 교가.txt 없음 → 런처가 카드를 뺍니다          → 교가 안 보임
 *   가사는 어느 쪽이든 자리표시자라, 남의 학교 교가가 exe 에 담기지 않습니다.
 */
const 런처모드 = (고른학교 === '런처' || 고른학교 === 'launcher');
const 끄기 = (고른학교 === '없음' || 고른학교 === 'off' || 런처모드);
let 설정;
if (끄기) {
  설정 = {
    schoolName: '우리 학교',
    refrain: '아 빛내자 우리 학교 우리 학교',
    verses: [[
      '여기에 우리 학교 [교가]를 적어요',
      '가사를 한 줄씩 [차례]대로 적어요',
      '대괄호로 두 글자를 [감싸]면 빈칸이 돼요',
      '대괄호를 안 쓰면 [알아]서 골라 줘요',
    ]],
  };
} else {
  const 설정경로 = path.join(학교폴더, 고른학교 + '.json');
  if (!fs.existsSync(설정경로)) {
    console.error(`scripts/schools/${고른학교}.json 이 없습니다.`);
    console.error('있는 학교:', 학교목록.join(' / ') || '(없음)');
    process.exit(1);
  }
  설정 = JSON.parse(fs.readFileSync(설정경로, 'utf8'));
  if (!설정.schoolName || !Array.isArray(설정.verses) || !설정.verses.length) {
    console.error('학교 파일에 schoolName 또는 verses 가 없습니다:', 설정경로);
    process.exit(1);
  }
}

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
const 켜기 = !끄기;
// '런처' 모드에서는 카드를 켠 채로 둡니다 (위 설명 참고).
const 카드켜기 = 켜기 || 런처모드;
for (const f of 목록파일) {
  const s = fs.readFileSync(f, 'utf8');
  const 있음 = s.includes('id:"school"');
  if (카드켜기 && !있음 && s.includes('y=[{id:"sokdam"')) {
    fs.writeFileSync(f, s.replace('y=[{id:"sokdam"', 'y=[' + 카드 + '{id:"sokdam"'));
    console.log('  ✓ 목록에 교가 카드를 켰습니다');
  } else if (!카드켜기 && 있음) {
    fs.writeFileSync(f, s.replace(카드, ''));
    console.log('  ✓ 목록에서 교가 카드를 껐습니다');
  }
}

/* 후렴 한 줄이 번들 안에 그대로 박혀 있었습니다.
 * ("아 빛내자 우리 학교 서울 신답초등학교")
 * verses 배열 밖이라 위에서 갈아 끼워도 남습니다. 따로 바꿉니다. */
{
  const 새후렴 = 설정.refrain || `아 빛내자 우리 학교 ${설정.schoolName}`;
  let 바뀐수 = 0;
  for (const f of 파일들) {
    const s = fs.readFileSync(f, 'utf8');
    const m = s.match(/<span class="refrain-text">"[^"]*"<\/span>/);
    if (!m) continue;
    const 새것 = `<span class="refrain-text">"${새후렴}"</span>`;
    if (m[0] === 새것) continue;
    fs.writeFileSync(f, s.replace(m[0], 새것));
    console.log('  ✓ 후렴 교체:', 새후렴);
    바뀐수++;
  }
  if (!바뀐수) console.log('  (후렴 줄을 찾지 못했거나 이미 맞습니다)');
}

/* 목록에서 카드만 끄면 주소를 아는 사람은 그대로 들어옵니다.
 * 실제로 /song/ 에 들어가 보니 200으로 열리고 가사가 다 보였습니다.
 * 카드가 꺼져 있을 때는 화면 자체가 목록으로 돌려보내도록 문지기를 답니다. */
const 문지기표시 = 'song-guard';
const 문지기 = `<script id="${문지기표시}">
  /* 교가가 아직 설정되지 않았습니다. 주소로 직접 들어와도 목록으로 돌려보냅니다.
     scripts/set-school-song.mjs 를 실행하면 이 줄이 저절로 빠집니다. */
  location.replace('../');
</script>
`;
for (const 이름 of ['index.html', 'app.html']) {
  const p = path.join(ROOT, 'song', 이름);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const 달림 = s.includes(문지기표시);
  if (!켜기 && !달림) {
    fs.writeFileSync(p, s.replace('</head>', 문지기 + '</head>'));
    console.log(`  ✓ song/${이름} 에 문지기를 달았습니다 (주소로 들어와도 목록으로)`);
  } else if (켜기 && 달림) {
    fs.writeFileSync(p, s.replace(new RegExp(`<script id="${문지기표시}">[\\s\\S]*?<\\/script>\\n?`), ''));
    console.log(`  ✓ song/${이름} 의 문지기를 뗐습니다`);
  }
}

console.log(`\n${설정.schoolName} 교가로 바꿨습니다 · ${verses.length}절 · ${verses.reduce((n,v)=>n+v.lines.length,0)}줄`);
if (런처모드) {
  console.log('※ 런처 모드입니다 (exe 용).');
  console.log('   가사는 자리표시자, 문지기는 달림, 카드는 켜 둔 상태입니다.');
  console.log('   나머지는 exe 가 켜질 때 옆의 교가.txt 를 보고 정합니다.');
} else if (!켜기) {
  console.log('※ 지금은 꺼진 상태입니다. 목록에 교가 카드가 보이지 않고,');
  console.log('   주소로 직접 들어가도 목록으로 돌려보냅니다.');
} else if (설정._허락) {
  console.log('\n※ ' + 설정._허락);
}
console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
