/* 엑셀에 넣을 자료를 문항 파일과 게임 번들에서 뽑아 JSON 하나로 모읍니다.
 * (엑셀은 파이썬으로 만듭니다 — make-xlsx.py)
 *
 *   node scripts/make-xlsx.mjs      (퀴즈 폴더 루트에서)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const 번들 = (폴더) => {
  const d = path.join(ROOT, 폴더, 'assets');
  if (!fs.existsSync(d)) return '';
  const f = fs.readdirSync(d).filter((n) => n.endsWith('.js'))[0];
  return f ? fs.readFileSync(path.join(d, f), 'utf8') : '';
};

const OX = {};
for (const [키, 파일] of [['환경', 'environment'], ['안전', 'safe'], ['학교폭력', 'violence']]) {
  OX[키] = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'questions', 파일 + '.json'), 'utf8'))
    .map((x) => ({
      번호: x.id, 카테고리: x.영역, 문항: x.q, 정답: x.ans, 해설: x.exp,
      근거기관: x.근거기관, 근거문서: x.근거문서, 출처URL: x.출처,
    }));
}

const 속담 = [...번들('proverb').matchAll(
  /proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\],meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)"/g)]
  .map((m, i) => {
    const 빈칸 = m[2].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean);
    return {
      번호: i + 1, 카테고리: m[4], 속담: JSON.parse('"' + m[1] + '"'),
      빈칸1: 빈칸[0] || '', 빈칸2: 빈칸[1] || '', 뜻: JSON.parse('"' + m[3] + '"'),
      출처: '없음 — 앱에 원래 들어 있던 콘텐츠',
    };
  });

const 사자성어 = [...번들('fourchar').matchAll(
  /idiom:"((?:[^"\\]|\\.)*)",hanja:"([^"]*)",meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)",targets:\[([^\]]*)\]/g)]
  .map((m, i) => {
    const 빈칸 = m[5].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean);
    return {
      번호: i + 1, 카테고리: m[4], 사자성어: JSON.parse('"' + m[1] + '"'), 한자: m[2],
      빈칸1: 빈칸[0] || '', 빈칸2: 빈칸[1] || '', 뜻: JSON.parse('"' + m[3] + '"'),
      출처: '없음 — 앱에 원래 들어 있던 콘텐츠',
    };
  });

// 교가
const 교가켜짐 = fs.readdirSync(path.join(ROOT, 'assets')).filter((n) => n.endsWith('.js'))
  .some((n) => fs.readFileSync(path.join(ROOT, 'assets', n), 'utf8').includes('id:"school"'));
const 교가설정 = fs.existsSync(path.join(ROOT, 'scripts', 'school-song.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'school-song.json'), 'utf8')) : null;

// 기관 집계 (O/X 세 게임)
const 기관 = {};
Object.values(OX).flat().forEach((x) => { 기관[x.근거기관] = (기관[x.근거기관] || 0) + 1; });

const 묶음 = {
  만든날: new Date().toISOString().slice(0, 10),
  속담, 사자성어, 환경: OX['환경'], 안전: OX['안전'], 학교폭력: OX['학교폭력'],
  교가: {
    켜짐: 교가켜짐,
    학교: 교가설정 ? 교가설정.schoolName : '',
    절: 교가설정 ? 교가설정.verses.length : 0,
    줄: 교가설정 ? 교가설정.verses.reduce((n, v) => n + v.length, 0) : 0,
  },
  기관: Object.entries(기관).sort((a, b) => b[1] - a[1]),
};

fs.writeFileSync(path.join(ROOT, 'scripts', '_xlsx-data.json'), JSON.stringify(묶음, null, 1));
console.log('자료 모음 완료 —',
  `속담 ${속담.length} · 사자성어 ${사자성어.length} · 환경 ${OX['환경'].length} · 안전 ${OX['안전'].length} · 학교폭력 ${OX['학교폭력'].length}`);
