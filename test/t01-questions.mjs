/* 문항 데이터 검사 — 브라우저 없이 돌아갑니다.
 *
 * 무엇을 보나:
 *   · 원본(JSON)과 화면에 나가는 것(번들)이 문항 하나하나 똑같은가
 *     — 정답이 하나라도 뒤집혀 있으면 아이들이 반대로 배웁니다
 *   · 빠진 칸, 중복된 문항, 출처 없는 문항이 있는가
 *   · 정답과 해설이 서로 어긋나지 않는가 (정답 O인데 해설이 "틀려요"로 시작 등)
 */
import { 원본문항, 번들문항, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

const 갈래들 = [['환경', 'environment'], ['안전', 'safe'], ['학교폭력', 'violence']];
let 합계 = 0;

for (const [이름, 폴더] of 갈래들) {
  제목(`■ ${이름}`);
  const 원본 = 원본문항(폴더);
  const 번들 = 번들문항(폴더);
  합계 += 원본.length;
  알림(`원본 ${원본.length}문항 · 화면 번들 ${번들.length}문항`);

  확인(`${이름}: 원본과 번들의 문항 수가 같다`, 원본.length === 번들.length,
    `원본 ${원본.length} / 번들 ${번들.length}`);

  /* 필수 칸 */
  const 빈칸 = [];
  for (const q of 원본) {
    for (const k of ['id', 'q', 'ans', 'exp', '근거기관', '출처']) {
      if (q[k] === undefined || q[k] === null || q[k] === '') 빈칸.push(`#${q.id} ${k}`);
    }
    if (q.출처 && !/^https?:\/\//.test(q.출처)) 빈칸.push(`#${q.id} 출처가 주소 형식이 아님`);
  }
  확인(`${이름}: 빠진 칸이 없다`, 빈칸.length === 0, 빈칸.slice(0, 8).join('\n'));

  /* id 중복 · 문장 중복 */
  const ids = 원본.map((q) => q.id);
  확인(`${이름}: 문항 번호가 겹치지 않는다`, new Set(ids).size === ids.length);
  const 문장 = 원본.map((q) => q.q.replace(/\s+/g, ''));
  const 겹침 = [...new Set(문장.filter((x, i) => 문장.indexOf(x) !== i))];
  확인(`${이름}: 같은 문장이 두 번 들어가지 않았다`, 겹침.length === 0,
    겹침.slice(0, 5).map((x) => x.slice(0, 40)).join('\n'));

  /* 원본 ↔ 번들 한 문항씩 */
  const 맵 = new Map(번들.map((b) => [b.id, b]));
  const 어긋남 = [];
  for (const o of 원본) {
    const b = 맵.get(o.id);
    const 원답 = (o.ans === true || o.ans === 'O') ? 'O' : 'X';
    if (!b) { 어긋남.push(`#${o.id} 번들에 없음 — ${o.q.slice(0, 34)}`); continue; }
    if (b.q.replace(/\s+/g, '') !== o.q.replace(/\s+/g, ''))
      어긋남.push(`#${o.id} 문장 다름\n원본: ${o.q}\n번들: ${b.q}`);
    if (b.ans !== 원답)
      어긋남.push(`#${o.id} ★정답 다름★ 원본 ${원답} / 번들 ${b.ans} — ${o.q.slice(0, 40)}`);
    if (b.exp.replace(/\s+/g, '') !== o.exp.replace(/\s+/g, ''))
      어긋남.push(`#${o.id} 해설 다름 — ${o.q.slice(0, 30)}`);
  }
  확인(`${이름}: 원본과 번들이 문항마다 똑같다 (${원본.length}문항)`, 어긋남.length === 0,
    어긋남.slice(0, 6).join('\n'));

  /* 정답과 해설이 서로 맞나 */
  const 엇갈림 = 번들.filter((b) =>
    (b.ans === 'O' && /^\s*틀려요/.test(b.exp)) || (b.ans === 'X' && /^\s*맞아요/.test(b.exp)));
  확인(`${이름}: 정답과 해설의 첫마디가 어긋나지 않는다`, 엇갈림.length === 0,
    엇갈림.slice(0, 5).map((b) => `#${b.id} 정답 ${b.ans} 인데 «${b.exp.slice(0, 18)}» — ${b.q.slice(0, 30)}`).join('\n'));

  /* O/X 균형 (한쪽으로 심하게 쏠리면 찍어도 맞습니다) */
  const o = 번들.filter((b) => b.ans === 'O').length;
  const 비율 = o / 번들.length;
  알림(`정답 O ${o}개 / X ${번들.length - o}개 (${(비율 * 100).toFixed(0)}%)`);
  확인(`${이름}: O와 X가 한쪽으로 심하게 쏠리지 않았다 (35~65%)`, 비율 >= 0.35 && 비율 <= 0.65);
}

제목('■ 합계');
알림(`문항 ${합계}개를 검사했습니다`);
마무리('문항 데이터 검사');
