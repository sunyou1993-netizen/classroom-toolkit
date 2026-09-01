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
      const s = await r.text();
      if (/페이지를 찾을 수 없|없는 페이지|Not Found|잘못된 접근/.test(s)) { 상태 = '200'; 비고 = '열리지만 "없는 페이지" 문구가 보임'; }
      else if (s.length < 400) { 비고 = '내용이 너무 짧음'; }
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
