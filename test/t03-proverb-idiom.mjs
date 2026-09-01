/* 속담·사자성어 데이터 검사 — 브라우저 없이 돌아갑니다. */
import path from 'path';
import { 퀴즈, 읽기, 번들찾기, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

제목('■ 속담');
{
  const f = 번들찾기(path.join(퀴즈, 'proverb'));
  const s = 읽기(f);
  const L = [...s.matchAll(/proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\],meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)"/g)]
    .map((m) => ({ p: JSON.parse(`"${m[1]}"`), t: m[2].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean),
                   m: JSON.parse(`"${m[3]}"`), c: m[4] }));
  알림(`속담 ${L.length}개`);
  확인('속담이 100개 넘게 있다', L.length >= 100, `지금 ${L.length}개`);

  const 빈칸탈 = L.filter((x) => x.t.length !== 2 || x.t.some((c) => !x.p.includes(c)));
  확인('빈칸 두 글자가 모두 속담 안에 실제로 있다', 빈칸탈.length === 0,
    빈칸탈.slice(0, 6).map((x) => `«${x.p}» 빈칸 ${x.t.join(',')}`).join('\n'));

  확인('뜻풀이가 비어 있지 않다', L.every((x) => x.m && x.m.length >= 6));
  확인('갈래가 비어 있지 않다', L.every((x) => x.c));

  const 줄이기 = (x) => x.replace(/ /g, '').replace(/[은는이가을를에게로도의만]/g, '');
  const 통 = {}; L.forEach((x) => { (통[줄이기(x.p)] = 통[줄이기(x.p)] || []).push(x.p); });
  const 겹침 = Object.values(통).filter((v) => v.length > 1);
  확인('같은 속담이 두 번 들어가지 않았다 (조사만 다른 것 포함)', 겹침.length === 0,
    겹침.map((v) => v.join('  ↔  ')).join('\n'));
}

제목('■ 사자성어');
{
  const f = 번들찾기(path.join(퀴즈, 'fourchar'));
  const s = 읽기(f);
  const L = [...s.matchAll(/idiom:"([^"]*)",hanja:"([^"]*)",meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)",targets:\[([^\]]*)\]/g)]
    .map((m) => ({ n: m[1], h: m[2], m: JSON.parse(`"${m[3]}"`), c: m[4],
                   t: m[5].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean) }));
  알림(`사자성어 ${L.length}개`);
  확인('사자성어가 100개 넘게 있다', L.length >= 100, `지금 ${L.length}개`);

  const 넉자아님 = L.filter((x) => [...x.h].length !== 4 || [...x.n].length !== 4);
  확인('한글도 한자도 네 글자다', 넉자아님.length === 0,
    넉자아님.slice(0, 6).map((x) => `${x.n} «${x.h}» (${[...x.h].length}자)`).join('\n'));

  const 빈칸탈 = L.filter((x) => x.t.length !== 2 || x.t.some((c) => !x.n.includes(c)));
  확인('빈칸 두 글자가 모두 사자성어 안에 있다', 빈칸탈.length === 0,
    빈칸탈.slice(0, 6).map((x) => `${x.n} 빈칸 ${x.t.join(',')}`).join('\n'));

  확인('뜻풀이가 비어 있지 않다', L.every((x) => x.m && x.m.length >= 6));
  const 이름들 = L.map((x) => x.n);
  확인('같은 사자성어가 두 번 들어가지 않았다', new Set(이름들).size === 이름들.length,
    [...new Set(이름들.filter((x, i) => 이름들.indexOf(x) !== i))].join(', '));
  const 한자들 = L.map((x) => x.h);
  확인('같은 한자 표기가 두 번 들어가지 않았다', new Set(한자들).size === 한자들.length,
    [...new Set(한자들.filter((x, i) => 한자들.indexOf(x) !== i))].join(', '));
}

마무리('속담·사자성어 검사');
