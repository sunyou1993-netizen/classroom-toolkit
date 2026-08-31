/* 검증 반영 2차 — 중복으로 답이 새는 문항과 O/X 치우침을 바로잡습니다.
 *
 * (1) 안전 4번이 안전 2번과 같은 사실의 앞뒤 형태가 되어, 두 문제가 서로 답을
 *     알려 주는 상태였습니다. 같은 페이지에 실제로 적혀 있는 다른 사실로 바꿉니다.
 * (2) 학교폭력이 O 44 : X 28 로 치우쳐, 아이가 "모르면 O"를 찍으면 유리했습니다.
 *     내용은 그대로 두고 다섯 문항의 묻는 방향만 뒤집습니다.
 *
 * 사용법: node scripts/verify-fixes2.mjs
 */
import fs from 'fs';
import path from 'path';

const 폴더 = path.join(process.cwd(), 'scripts', 'questions');
const 읽기 = (n) => JSON.parse(fs.readFileSync(path.join(폴더, n + '.json'), 'utf8'));
const 쓰기 = (n, v) => fs.writeFileSync(path.join(폴더, n + '.json'), JSON.stringify(v, null, 1) + '\n');

/* ── 안전 4번 ── */
{
  const s = 읽기('safe');
  const x = s.find((y) => y.id === 4);
  // 법제처 '어린이 보행사고 예방을 위한 안전수칙' 원문 확인:
  // "횡단보도, 지하도, 육교나 그 밖의 도로 횡단시설이 설치되어 있는 도로에서
  //  그 곳으로 횡단해야" (도로교통법 제10조제2항)
  Object.assign(x, {
    q: '가까이에 횡단보도나 육교가 있으면 그곳으로 건너야 해요.',
    ans: 'O',
    exp: '맞아요! 횡단보도, 지하도, 육교가 있으면 반드시 그곳으로 건너요.',
    근거기관: '법제처(찾기쉬운 생활법령정보)',
    근거문서: '어린이 생활안전 > 교통안전 > 어린이 보행안전 > 어린이 보행사고 예방을 위한 안전수칙 (도로교통법 제10조제2항)',
    출처: 'https://www.easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=690&ccfNo=1&cciNo=1&cnpClsNo=1',
  });
  쓰기('safe', s);
  console.log('  안전 4번 → 2번과 겹치지 않는 사실(횡단시설로 건너기)로 바꿈');
}

/* ── 학교폭력 O/X 균형 ── */
{
  const v = 읽기('violence');
  const 뒤집기 = {
    42: { q: '사이버폭력을 당하면 그 화면을 바로 지우는 것이 좋아요.', ans: 'X',
          exp: '틀려요! 화면을 저장해 두어야 나중에 도움을 받을 수 있어요.' },
    43: { q: '인터넷에 한번 퍼진 글이나 영상은 지워 달라고 할 수 없어요.', ans: 'X',
          exp: '틀려요! 지워 달라고 요청하고 도움을 받을 수 있어요.' },
    56: { q: '아직 학교폭력이 일어나지 않았으면 미리 알릴 수 없어요.', ans: 'X',
          exp: '틀려요! 그런 일이 준비되는 것을 알게 되어도 바로 알릴 수 있어요.' },
    66: { q: '학교폭력을 다루는 사람은 관련된 학생 이야기를 남에게 말해도 돼요.', ans: 'X',
          exp: '틀려요! 알게 된 개인정보나 사실을 함부로 말하면 안 돼요.' },
    69: { q: '피해를 입은 학생은 학교에서 아무런 보호도 받을 수 없어요.', ans: 'X',
          exp: '틀려요! 상담, 치료, 요양 같은 보호 조치를 받을 수 있어요.' },
  };
  for (const [id, 새것] of Object.entries(뒤집기)) {
    const x = v.find((y) => y.id === +id);
    if (!x) throw new Error('없음 ' + id);
    Object.assign(x, 새것);   // 근거기관·근거문서·출처는 그대로 둡니다
    console.log(`  학교폭력 ${id}번 O → X 형태로 뒤집음`);
  }
  쓰기('violence', v);
}

for (const n of ['environment', 'safe', 'violence']) {
  const a = 읽기(n);
  const o = a.filter((x) => x.ans === 'O').length;
  console.log(`\n${n}: ${a.length}문항  O ${o} : X ${a.length - o}`);
}
