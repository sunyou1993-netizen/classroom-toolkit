/* 교가·배포 준비 검사 — 브라우저 없이 돌아갑니다.
 *
 * 무엇을 보나:
 *   · 저장소에 특정 학교 교가가 섞여 있지 않은가 (저작권)
 *   · 학교 파일 모양이 올바른가 (빈칸으로 쓸 두 글자를 찾을 수 있는가)
 *   · 교가가 꺼져 있을 때 주소로 들어와도 막히는가
 */
import path from 'path';
import fs from 'fs';
import { 퀴즈, 루트, 읽기, 있나, 번들찾기, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

제목('■ 저장소에 남의 학교 교가가 섞여 있지 않은가');
{
  const f = 번들찾기(path.join(퀴즈, 'song'));
  const s = 읽기(f);
  const 이름 = (s.match(/schoolName:"([^"]*)"/) || [])[1];
  알림(`번들에 든 학교 이름: «${이름}»`);
  확인('저장소 번들에는 특정 학교 교가가 들어 있지 않다 (자리표시자여야 함)',
    이름 === '우리 학교',
    `지금 «${이름}» 입니다. 배포용 저장소에는 자리표시자만 있어야 합니다.\n` +
    'node scripts/set-school-song.mjs 없음  으로 되돌릴 수 있습니다.');

  const 카드 = 읽기(번들찾기(퀴즈)).includes('id:"school"');
  const 문지기 = 읽기(path.join(퀴즈, 'song', 'app.html')).includes('song-guard');
  알림(`목록의 교가 카드 ${카드 ? '켜짐' : '꺼짐'} · 주소 막이 ${문지기 ? '달림' : '뗌'}`);
  확인('교가가 자리표시자일 때는 주소로 들어와도 목록으로 돌려보낸다',
    이름 !== '우리 학교' || 문지기,
    '교가가 설정되지 않았는데 /song/ 이 그대로 열리면 자리표시자 가사가 아이에게 보입니다.');
}

제목('■ 학교 파일 모양');
{
  const d = path.join(퀴즈, 'scripts', 'schools');
  확인('학교 폴더가 있다 (scripts/schools)', 있나(d));
  if (있나(d)) {
    const 파일 = fs.readdirSync(d).filter((n) => n.endsWith('.json'));
    const 학교 = 파일.filter((n) => !n.startsWith('_'));
    알림(`학교 파일 ${학교.length}개 · 양식 ${파일.length - 학교.length}개`);
    확인('새 학교 양식이 있다 (_새학교_양식.json)', 파일.some((n) => n.startsWith('_')));

    for (const n of 학교) {
      const j = JSON.parse(읽기(path.join(d, n)));
      const 이름 = n.replace(/\.json$/, '');
      확인(`${이름}: 학교 이름과 가사가 들어 있다`,
        !!j.schoolName && Array.isArray(j.verses) && j.verses.length > 0);
      /* 줄마다 빈칸으로 쓸 두 글자를 찾을 수 있어야 합니다 */
      const 못찾음 = [];
      for (const 절 of j.verses || []) for (const 줄 of 절) {
        const m = 줄.match(/\[([^\]]{2})\]/);
        if (m) continue;
        const rs = [...줄];
        let 가능 = false;
        for (let i = 0; i < rs.length - 1; i++) if (rs[i] !== ' ' && rs[i + 1] !== ' ') { 가능 = true; break; }
        if (!가능) 못찾음.push(줄);
      }
      확인(`${이름}: 모든 줄에서 빈칸 두 글자를 만들 수 있다`, 못찾음.length === 0,
        못찾음.slice(0, 4).join('\n'));
      확인(`${이름}: 교가 사용 허락 안내가 적혀 있다`, !!j._허락,
        '가사·곡에는 작사·작곡가의 저작권이 있습니다. 파일에 확인 문구를 남겨 두세요.');
    }
  }
}

제목('■ 빌드 준비물');
{
  const 필수 = ['index.html', 'app.html', 'sw.js'];
  for (const f of 필수) 확인(`${f} 가 있다`, 있나(path.join(루트, f)));
  const 퀴즈필수 = ['index.html', 'sw.js', 'fonts/PretendardVariable.woff2', 'fonts/HanjaSubset.woff2'];
  for (const f of 퀴즈필수) 확인(`quiz/${f} 가 있다`, 있나(path.join(퀴즈, f)));
  확인('빌드 스크립트가 있다 (launcher/build.sh)', 있나(path.join(루트, 'launcher', 'build.sh')));
}

마무리('교가·배포 준비 검사');
