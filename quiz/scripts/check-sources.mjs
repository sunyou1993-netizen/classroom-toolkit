/* 문항이 달고 있는 출처 주소가 아직 살아 있는지 확인합니다.
 *
 * 왜 필요한가:
 *   문항 238개가 정부 문서 주소를 달고 있습니다. 정부 사이트는 개편하면서
 *   주소가 자주 죽고, 지침 자체가 바뀌기도 합니다(분리배출 지침이 바뀌어
 *   문항 35개를 고친 적이 있습니다). 죽은 주소를 보고서에 그대로 두면
 *   "근거를 확인할 수 없다"가 됩니다.
 *
 * 언제 돌리나: 반년에 한 번, 그리고 보고서를 내기 전에.
 * 사용법: node scripts/check-sources.mjs
 *
 * ※ 두 가지를 조심하세요.
 *   1) 정부 사이트는 로봇을 막아 두는 곳이 많아, 사람이 열면 되는데도 403 이
 *      나옵니다. 그래서 '죽었다'가 아니라 '확인 필요' 로 적습니다.
 *   2) 회사·학교 망에서 바깥 접속이 막혀 있으면 **전부** 실패로 나옵니다.
 *      결과가 전부 403/실패면 주소가 죽은 게 아니라 망이 막힌 것입니다.
 *      그래서 아래에서 먼저 바깥 접속이 되는지 확인합니다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 주소들 = new Map();
for (const f of ['environment', 'safe', 'violence']) {
  const p = path.join(ROOT, 'scripts', 'questions', `${f}.json`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const L = Array.isArray(j) ? j : Object.values(j).find(Array.isArray);
  for (const q of L) {
    if (!주소들.has(q.출처)) 주소들.set(q.출처, { 문항수: 0, 기관: q.근거기관, 예: q.q.slice(0, 30) });
    주소들.get(q.출처).문항수++;
  }
}

/* 먼저 바깥 접속 자체가 되는지 봅니다.
   안 되면 아래 결과가 전부 '실패' 로 나와 오해하기 쉽습니다. */
{
  let 됨 = false;
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch('https://example.com', { signal: c.signal });
    clearTimeout(t);
    됨 = r.ok;
  } catch { /* 못 나감 */ }
  if (!됨) {
    console.error('✗ 이 컴퓨터에서 바깥 인터넷으로 나가지 못합니다.');
    console.error('  (example.com 도 열리지 않습니다)');
    console.error('  이 상태로는 출처 주소가 살았는지 알 수 없습니다.');
    console.error('  바깥이 열리는 곳에서 다시 돌려 주세요.');
    process.exit(2);
  }
  console.log('바깥 접속 확인 ✓\n');
}


/* ── 주소마다 «그 문서라면 반드시 들어 있어야 할 낱말» ───────────────
 *
 * 왜 이게 필요한가 (17차에 크게 데었습니다):
 *   정부 사이트 주소는 **죽지 않고 살아 있으면서 다른 문서를 보여 줍니다.**
 *   정책브리핑은 그날의 다른 기사를, 국민안전24는 category 를 무시하고 지진 요령을,
 *   게시판 주소는 세션에 따라 엉뚱한 게시글을 돌려줬습니다. 전부 200 OK 입니다.
 *   그래서 «열리나?» 만 보면 문항 43개가 잘못된 근거를 달고 있어도 통과합니다.
 *
 *   여기 적은 낱말이 받아 온 글에 하나도 없으면 «다른 문서» 로 봅니다.
 *   새 출처를 넣을 때는 여기에도 한 줄 넣어 주세요. 안 넣으면 «표시어 없음» 으로 나옵니다.
 */
const 확인어 = [
  ['law.go.kr/LSW/admRulInfoP', ['재활용가능자원의 분리수거']],
  ['csmSeq=1408&ccfNo=1', ['학교폭력']],
  ['csmSeq=1408&ccfNo=2', ['예방교육']],
  ['csmSeq=1408&ccfNo=3', ['신고']],
  ['csmSeq=1408&ccfNo=4', ['조치', '자체해결']],
  ['csmSeq=1452', ['분리배출']],
  ['csmSeq=690&ccfNo=1&cciNo=1&cnpClsNo=3', ['보호구역']],
  ['csmSeq=690&ccfNo=1&cciNo=1&cnpClsNo=1', ['보행']],
  ['csmSeq=690&ccfNo=1&cciNo=2', ['탑승', '통학버스']],
  ['csmSeq=690&ccfNo=1&cciNo=3', ['자전거']],
  ['csmSeq=690&ccfNo=2', ['가정']],
  ['csmSeq=690&ccfNo=4&cciNo=1', ['물놀이']],
  ['csmSeq=690&ccfNo=4&cciNo=2', ['놀이시설']],
  ['csmSeq=690&ccfNo=5', ['화재']],
  ['csmSeq=293', ['명예훼손']],
  ['boardId=875840', ['분리배출']],
  ['boardId=1398800', ['재활용품']],
  ['BBS_202502140257008950', ['사안처리']],
  ['4e4fd915-99e8-43d0-b763-3b0bfea0b50b', ['실태조사']],
  ['cpoint.or.kr', ['탄소중립포인트']],
  ['emergency_eq2', ['지진']],
  ['kacpr.org', ['심폐소생술']],
  ['safety-guide/typhoon', ['태풍']],
  ['safety-guide/heatwave', ['폭염']],
  ['safety-guide/coldwave', ['한파']],
  ['chd/sub/a06/fire_2', ['소화기']],
  ['chd/sub/a06/fire/', ['화재']],
  ['chd/sub/a06/summer', ['물놀이']],
  ['chd/sub/a06/road', ['교통']],
  ['chd/sub/a06/play_2', ['놀이기구']],
  ['chd/sub/a06/play/', ['자전거', '놀이']],
  ['chd/sub/a06/rescue_3', ['심폐소생술']],
  ['chd/sub/a06/rescue/', ['구급']],
  ['newsId=148874146', ['식중독']],
  ['newsId=148959320', ['식중독']],
  ['newsId=148926855', ['교통안전']],
  ['newsId=148954485', ['교통안전']],
  ['newsId=148764941', ['어울림']],
  ['gonggam.korea.kr', ['디지털 성폭력']],
  ['dong.daegu.kr/portal/contents.do?mid=0405130200', ['음식물']],
  ['dong.daegu.kr/portal/contents.do?mid=0405130700', ['페트병']],
  ['dgs.go.kr/portal/contents.do', ['음식물']],
  ['buk.daegu.kr', ['음식물']],
  ['junggu.seoul.kr', ['폐의약품']],
  ['energy.or.kr/front/board/View3', ['난방']],
  ['eep.energy.or.kr/more/knowhow4', ['에어컨']],
  ['eep.energy.or.kr/business_introduction', ['효율등급', '에너지소비효율']],
  ['ggenergy.or.kr', ['에너지절약', '에너지 절약']],
  ['gihoo.or.kr/menu.es?mid=a30101010000', ['온실']],
  ['gihoo.or.kr/menu.es?mid=a30101030000', ['기후변화']],
  ['gihoo.or.kr/menu.es?mid=a30106000000', ['기후변화']],
  ['num=1194622', ['이상기후']],
  ['num=1194641', ['이산화탄소']],
  ['health.kdca.go.kr/healthinfo/biz/health/ccvdInfo', ['심폐소생술']],
  ['cntnts_sn=6584', ['화상']],
  ['wee.go.kr', ['Wee']],
  ['kmcc.go.kr', ['사이버폭력']],
  ['btf.or.kr', ['상담']],
];
const 있어야할낱말 = (u) => {
  for (const [조각, 낱말] of 확인어) if (u.includes(조각)) return 낱말;
  return null;
};

const 결과 = [];
for (const [u, v] of 주소들) {
  let 상태 = '?', 비고 = '';
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    let r = await fetch(u, { method: 'GET', redirect: 'follow', signal: c.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
                 'accept-language': 'ko-KR,ko;q=0.9' } });
    clearTimeout(t);
    상태 = String(r.status);
    if (r.status === 200) {
      const 본문 = await r.text();
      if (/페이지를 찾을 수 없|없는 페이지|Not Found|잘못된 접근/.test(본문)) { 비고 = '열리지만 "없는 페이지" 문구가 보임'; }
      else if (본문.length < 400) { 비고 = '내용이 너무 짧음'; }
      else {
        const 낱말 = 있어야할낱말(u);
        if (!낱말) 비고 = '표시어 없음 — check-sources.mjs 의 확인어 표에 한 줄 넣어 주세요';
        else if (!낱말.some((w) => 본문.includes(w)))
          비고 = `열리기는 하는데 «${낱말[0]}» 이 안 보입니다 — 다른 문서일 수 있습니다`;
      }
    }
  } catch (e) {
    상태 = '실패';
    비고 = String(e.cause?.code || e.name || e).slice(0, 40);
  }
  결과.push({ u, ...v, 상태, 비고 });
}

const 좋음 = 결과.filter((r) => r.상태 === '200' && !r.비고);
const 확인 = 결과.filter((r) => !(r.상태 === '200' && !r.비고));
console.log(`■ 출처 주소 ${결과.length}개`);
console.log(`   잘 열림      ${좋음.length}개`);
console.log(`   확인 필요    ${확인.length}개`);
if (확인.length) {
  console.log('');
  for (const r of 확인.sort((a, b) => b.문항수 - a.문항수)) {
    console.log(`   [${r.상태}] ${r.기관}  · 문항 ${r.문항수}개  ${r.비고}`);
    console.log(`         ${r.u}`);
    console.log(`         예: ${r.예}`);
  }
  console.log('\n   ※ 정부 사이트는 로봇을 막아 두는 곳이 많습니다.');
  console.log('      403·실패로 나와도 브라우저로 열면 되는 경우가 많으니 직접 확인해 주세요.');
}
fs.writeFileSync(path.join(ROOT, 'scripts', 'out', '출처확인.json'),
  JSON.stringify(결과, null, 2), 'utf8');
console.log('\n   자세한 결과: scripts/out/출처확인.json');
