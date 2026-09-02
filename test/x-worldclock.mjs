/* 세계시간이 실제 시각과 맞는가. (조사용)
 *
 * 왜:
 *   세계시간은 아이들이 "지금 뉴욕은 몇 시야?" 를 배우는 화면입니다.
 *   틀린 시각을 가르치면 그대로 외웁니다.
 *
 *   가장 흔한 실수는 **서머타임(일광절약시간)** 입니다.
 *   시차를 숫자로 박아 두면(뉴욕 = 한국 −14시간) 여름에는 한 시간 틀립니다.
 *   3월~11월 사이 미국·유럽은 시계를 한 시간 앞당깁니다.
 *
 * 어떻게 확인하나:
 *   브라우저에 들어 있는 표준 시간대 자료(IANA)로 계산한 값과 화면을 견줍니다.
 *   이 자료는 나라가 규칙을 바꾸면 브라우저 업데이트로 따라갑니다.
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47450);

const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, timezoneId: 'Asia/Seoul' });
const page = await ctx.newPage();
await page.goto(서버.주소 + '/worldclock/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const f = page.frames()[1];

제목('■ 세계시간이 실제 시각과 맞는가');
알림('브라우저에 들어 있는 표준 시간대 자료로 계산한 값과 견줍니다');

/* 화면에 있는 도시와 시각을 통째로 읽습니다 */
const 글 = await f.evaluate(() => document.body.innerText.replace(/ /g, ' '));
const 줄들 = 글.split('\n').map((x) => x.trim()).filter(Boolean);

/* 도시 이름 → 표준 시간대 이름 */
const 시간대 = {
  '서울': 'Asia/Seoul', '한국': 'Asia/Seoul', '도쿄': 'Asia/Tokyo', '일본': 'Asia/Tokyo',
  '베이징': 'Asia/Shanghai', '중국': 'Asia/Shanghai', '상하이': 'Asia/Shanghai',
  '뉴욕': 'America/New_York', '미국': 'America/New_York', '워싱턴': 'America/New_York',
  '로스앤젤레스': 'America/Los_Angeles', 'LA': 'America/Los_Angeles',
  '런던': 'Europe/London', '영국': 'Europe/London',
  '파리': 'Europe/Paris', '프랑스': 'Europe/Paris', '베를린': 'Europe/Berlin', '독일': 'Europe/Berlin',
  '모스크바': 'Europe/Moscow', '러시아': 'Europe/Moscow',
  '시드니': 'Australia/Sydney', '호주': 'Australia/Sydney',
  '두바이': 'Asia/Dubai', '인도': 'Asia/Kolkata', '뉴델리': 'Asia/Kolkata',
  '방콕': 'Asia/Bangkok', '태국': 'Asia/Bangkok', '싱가포르': 'Asia/Singapore',
  '하와이': 'Pacific/Honolulu', '브라질': 'America/Sao_Paulo', '상파울루': 'America/Sao_Paulo',
  '카이로': 'Africa/Cairo', '이집트': 'Africa/Cairo', '멕시코': 'America/Mexico_City',
};

console.log('');
console.log('   도시           화면    실제    차이');
console.log('   ' + '─'.repeat(42));

const 나온것 = [];
for (let i = 0; i < 줄들.length; i++) {
  const 줄 = 줄들[i];
  for (const 도시 of Object.keys(시간대)) {
    if (!줄.includes(도시)) continue;
    /* 같은 줄이나 다음 두 줄에서 시:분 을 찾습니다 */
    const 뭉치 = [줄, 줄들[i + 1] || '', 줄들[i + 2] || ''].join(' ');
    const m = 뭉치.match(/(\d{1,2}):(\d{2})/);
    if (!m) continue;
    if (나온것.some((x) => x.도시 === 도시)) continue;
    나온것.push({ 도시, 시: +m[1], 분: +m[2], 오후: /오후|PM/i.test(뭉치), 오전: /오전|AM/i.test(뭉치) });
    break;
  }
}

if (!나온것.length) {
  console.log('   (도시와 시각을 읽지 못했습니다 — 화면 글을 아래에 그대로 남깁니다)');
  console.log('   ' + 글.replace(/\s+/g, ' ').slice(0, 400));
} else {
  let 틀린것 = 0;
  for (const x of 나온것) {
    const tz = 시간대[x.도시];
    const 실제 = new Intl.DateTimeFormat('ko-KR', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date());
    const [실시, 실분] = 실제.split(':').map(Number);

    /* 화면이 12시간제면 오전/오후를 붙여 24시간으로 바꿉니다 */
    let 화면시 = x.시;
    if (x.오후 && 화면시 < 12) 화면시 += 12;
    if (x.오전 && 화면시 === 12) 화면시 = 0;

    const 화면분계 = 화면시 * 60 + x.분;
    const 실제분계 = 실시 * 60 + 실분;
    let 차 = 화면분계 - 실제분계;
    if (차 > 720) 차 -= 1440; if (차 < -720) 차 += 1440;

    const 맞나 = Math.abs(차) <= 2;      // 2분까지는 화면 갱신 시차로 봅니다
    if (!맞나) 틀린것++;
    console.log(`   ${x.도시.padEnd(12)} ${String(화면시).padStart(2, '0')}:${String(x.분).padStart(2, '0')}   ${실제}   ${(차 === 0 ? '같음' : (차 > 0 ? '+' : '') + 차 + '분')}  ${맞나 ? '✓' : '✗'}`);
  }
  console.log('');
  if (틀린것) console.log(`   ✗ ${틀린것}개 도시의 시각이 실제와 다릅니다 (서머타임을 안 따라갔을 수 있습니다)`);
  else console.log(`   ✓ ${나온것.length}개 도시 모두 실제 시각과 맞습니다 (서머타임 포함)`);
}

/* 지금이 서머타임 기간인 곳이 있는지도 알려 줍니다 — 없으면 이 검사가 헐거워집니다.
   1월과 견주면 남반구(시드니 등)가 거꾸로 걸리므로, 1년 중 가장 작은 시차(=표준시)와
   지금을 견줍니다. */
const 서머중 = [];
const 시차재기 = (tz, d) => {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).format(d);
  const m = (s.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/) || []);
  return m[1] ? (+m[1]) * 60 + (m[1].startsWith('-') ? -(+(m[2] || 0)) : +(m[2] || 0)) : 0;
};
for (const [도시, tz] of Object.entries(시간대)) {
  const 해 = new Date().getUTCFullYear();
  let 표준 = Infinity;
  for (let 달 = 0; 달 < 12; 달++) 표준 = Math.min(표준, 시차재기(tz, new Date(Date.UTC(해, 달, 15))));
  if (시차재기(tz, new Date()) > 표준 && !서머중.includes(도시)) 서머중.push(도시);
}
console.log('');
알림(서머중.length
  ? `지금 서머타임 중인 곳: ${[...new Set(서머중)].join(', ')} — 이 검사가 의미가 있습니다`
  : '지금은 서머타임 기간인 곳이 없습니다 — 여름·겨울에 한 번씩 다시 돌려 보세요');

await page.screenshot({ path: '/tmp/worldclock.png' });
서버.닫기(); await br.close();
