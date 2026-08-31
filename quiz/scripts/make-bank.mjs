/* 문항집 페이지를 문항 파일에서 만듭니다 — 238문항 전체와 각 문항의 출처.
 *
 *   node scripts/make-bank.mjs
 *
 * 근거표(문항근거.html)가 "어느 문서에서 왔나"를 문서 단위로 보여준다면,
 * 이 문항집은 "문항 하나하나가 무엇이고 어디서 왔나"를 문항 단위로 보여줍니다.
 */
import fs from 'fs';
import path from 'path';

const 문항폴더 = path.join(process.cwd(), 'scripts', 'questions');
const 대상 = path.join(process.cwd(), '문항집.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const 분야 = [
  { 파일: 'environment', 이름: '환경', 부제: '분리배출 · 자원순환 · 기후', 키: 'env' },
  { 파일: 'safe', 이름: '안전', 부제: '교통 · 화재 · 응급처치 · 재난', 키: 'safe' },
  { 파일: 'violence', 이름: '학교폭력', 부제: '예방 · 신고 · 회복', 키: 'vio' },
];

let 총 = 0, O총 = 0;
const 기관집계 = {};
const 구역 = [];

for (const d of 분야) {
  const 목록 = JSON.parse(fs.readFileSync(path.join(문항폴더, d.파일 + '.json'), 'utf8'));
  총 += 목록.length;
  O총 += 목록.filter((x) => x.ans === 'O').length;
  목록.forEach((x) => { 기관집계[x.근거기관] = (기관집계[x.근거기관] || 0) + 1; });

  // 영역 순서는 파일에 나온 순서를 그대로 씁니다(교실에서 가르치는 순서).
  const 영역순 = [];
  for (const x of 목록) if (!영역순.includes(x.영역)) 영역순.push(x.영역);

  const 묶음 = 영역순.map((영역) => {
    const 안 = 목록.filter((x) => x.영역 === 영역);
    const 행 = 안.map((x) => `          <li class="q" data-ans="${x.ans}" data-find="${esc([x.q, x.exp, x.영역, x.근거기관, x.근거문서].join(' ').toLowerCase())}">
            <span class="no">${x.id}</span>
            <span class="ans ans-${x.ans === 'O' ? 'o' : 'x'}" aria-label="정답 ${x.ans === 'O' ? '맞아요' : '틀려요'}">${x.ans}</span>
            <div class="body">
              <p class="ask">${esc(x.q)}</p>
              <p class="exp">${esc(x.exp)}</p>
              <p class="src"><span class="org">${esc(x.근거기관)}</span><a href="${esc(x.출처)}" target="_blank" rel="noopener">${esc(x.근거문서)}</a></p>
            </div>
          </li>`).join('\n');
    return `        <section class="area">
          <h3 class="area-name">${esc(영역)} <span class="area-n">${안.length}</span></h3>
          <ol class="qs">
${행}
          </ol>
        </section>`;
  }).join('\n');

  구역.push(`  <section class="dom" id="${d.키}" data-dom="${d.키}">
      <header class="dom-head">
        <h2>${d.이름}</h2>
        <p class="dom-sub">${d.부제}</p>
        <p class="dom-n"><b>${목록.length}</b><span>문항</span></p>
      </header>
${묶음}
    </section>`);
}

const 기관줄 = Object.entries(기관집계).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `<li>${esc(k)}<b>${v}</b></li>`).join('');

const html = `<title>간단교육 퀴즈 문항집</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=Nanum+Myeongjo:wght@700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">
<style>
  :root {
    --ground:#F3F6F4; --surface:#FFFFFF; --raise:#FBFCFB;
    --ink:#16211E; --muted:#5C6A66; --faint:#869590;
    --line:#DDE4E0; --line-soft:#EBEFED;
    --accent:#0F6455;
    --yes:#2C7A4B; --yes-bg:#E8F2EC;
    --no:#A8442F;  --no-bg:#F7EAE6;
    --env:#2C7A4B; --env-bg:#E8F2EC;
    --safe:#9A5E14; --safe-bg:#F6EEE2;
    --vio:#3A55A0;  --vio-bg:#E9EDF7;
    --shadow:0 1px 2px rgba(22,33,30,.05);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground:#0C1311; --surface:#141D1A; --raise:#182320;
      --ink:#E6EDEA; --muted:#93A39D; --faint:#6E7E79;
      --line:#25312D; --line-soft:#1C2724;
      --accent:#54C2A6;
      --yes:#6FCB92; --yes-bg:#152519;
      --no:#E08974;  --no-bg:#2A1913;
      --env:#6FCB92; --env-bg:#152519;
      --safe:#D9A45E; --safe-bg:#241D12;
      --vio:#8AA3E6;  --vio-bg:#151B2A;
      --shadow:0 1px 2px rgba(0,0,0,.3);
    }
  }
  :root[data-theme="dark"] {
    --ground:#0C1311; --surface:#141D1A; --raise:#182320;
    --ink:#E6EDEA; --muted:#93A39D; --faint:#6E7E79;
    --line:#25312D; --line-soft:#1C2724;
    --accent:#54C2A6;
    --yes:#6FCB92; --yes-bg:#152519;
    --no:#E08974;  --no-bg:#2A1913;
    --env:#6FCB92; --env-bg:#152519;
    --safe:#D9A45E; --safe-bg:#241D12;
    --vio:#8AA3E6;  --vio-bg:#151B2A;
    --shadow:0 1px 2px rgba(0,0,0,.3);
  }

  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--ground); color:var(--ink);
    font-family:"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
    font-weight:400; line-height:1.65; -webkit-font-smoothing:antialiased;
  }
  .wrap { max-width:54rem; margin:0 auto; padding:clamp(1.8rem,5vw,4rem) clamp(1rem,4vw,2.2rem) 5rem; }

  /* ── 머리 ── */
  .eyebrow {
    font-family:"IBM Plex Mono",monospace; font-size:.7rem; font-weight:600;
    letter-spacing:.16em; color:var(--accent); margin:0 0 .8rem;
  }
  h1 {
    font-family:"Nanum Myeongjo",serif; font-weight:800;
    font-size:clamp(1.8rem,4.6vw,2.7rem); line-height:1.25; letter-spacing:-.01em;
    margin:0 0 .9rem; text-wrap:balance;
  }
  .lede { margin:0; max-width:36em; color:var(--muted); font-size:1rem; }

  .meta { margin:1.8rem 0 0; padding:1.05rem 1.2rem; background:var(--surface);
          border:1px solid var(--line); border-radius:.5rem; }
  .meta h2 { margin:0 0 .7rem; font-size:.8rem; font-weight:600; color:var(--muted);
             letter-spacing:.02em; }
  .orgs { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:.4rem .5rem; }
  .orgs li {
    font-size:.78rem; color:var(--muted); background:var(--ground);
    border:1px solid var(--line-soft); border-radius:.3rem; padding:.2rem .5rem;
    display:inline-flex; align-items:baseline; gap:.4rem;
  }
  .orgs b { font-family:"IBM Plex Mono",monospace; font-variant-numeric:tabular-nums;
            color:var(--accent); font-size:.8rem; }

  /* ── 고르기 줄 ── */
  .bar {
    position:sticky; top:0; z-index:20; margin:2rem 0 0;
    background:var(--ground); padding:.9rem 0 .8rem;
    border-bottom:1px solid var(--line);
  }
  .bar-in { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; }
  .search {
    flex:1 1 14rem; min-width:0;
    font:inherit; font-size:.92rem; color:var(--ink);
    background:var(--surface); border:1px solid var(--line);
    border-radius:.4rem; padding:.5rem .75rem;
  }
  .search::placeholder { color:var(--faint); }
  .search:focus-visible { outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent); }
  .chips { display:flex; flex-wrap:wrap; gap:.35rem; }
  .chip {
    font:inherit; font-size:.82rem; font-weight:500; color:var(--muted);
    background:var(--surface); border:1px solid var(--line);
    border-radius:2rem; padding:.34rem .8rem; cursor:pointer;
    transition:background .12s, color .12s, border-color .12s;
  }
  .chip:hover { border-color:var(--accent); color:var(--ink); }
  .chip:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .chip[aria-pressed="true"] { background:var(--accent); border-color:var(--accent); color:var(--ground); }
  .chip .n { font-family:"IBM Plex Mono",monospace; font-variant-numeric:tabular-nums;
             font-size:.76rem; opacity:.75; margin-left:.35rem; }
  .found { margin:.6rem 0 0; font-size:.8rem; color:var(--faint);
           font-variant-numeric:tabular-nums; }

  /* ── 분야 ── */
  .dom { margin-top:3rem; }
  .dom[data-dom="env"]  { --dc:var(--env);  --dcbg:var(--env-bg); }
  .dom[data-dom="safe"] { --dc:var(--safe); --dcbg:var(--safe-bg); }
  .dom[data-dom="vio"]  { --dc:var(--vio);  --dcbg:var(--vio-bg); }
  .dom-head {
    display:flex; align-items:baseline; gap:.9rem; flex-wrap:wrap;
    padding-bottom:.7rem; border-bottom:2px solid var(--dc);
  }
  .dom-head h2 {
    font-family:"Nanum Myeongjo",serif; font-weight:700; font-size:1.55rem;
    margin:0; color:var(--dc); letter-spacing:-.01em;
  }
  .dom-sub { margin:0; flex:1; font-size:.82rem; color:var(--muted); }
  .dom-n { margin:0; white-space:nowrap; }
  .dom-n b { font-family:"IBM Plex Mono",monospace; font-size:1.25rem; font-weight:600;
             font-variant-numeric:tabular-nums; color:var(--ink); }
  .dom-n span { font-size:.8rem; color:var(--muted); margin-left:.2rem; }

  /* ── 영역 ── */
  .area { margin-top:1.9rem; }
  .area-name {
    margin:0 0 .7rem; font-size:.86rem; font-weight:600; color:var(--dc);
    display:flex; align-items:center; gap:.5rem;
  }
  .area-n {
    font-family:"IBM Plex Mono",monospace; font-size:.72rem; font-weight:600;
    font-variant-numeric:tabular-nums;
    background:var(--dcbg); color:var(--dc); border-radius:.25rem; padding:.05rem .35rem;
  }

  /* ── 문항 ── */
  .qs { list-style:none; margin:0; padding:0;
        display:flex; flex-direction:column; gap:1px;
        background:var(--line); border:1px solid var(--line);
        border-radius:.45rem; overflow:hidden; box-shadow:var(--shadow); }
  .q { display:grid; grid-template-columns:2.1rem 1.7rem 1fr; gap:.7rem;
       background:var(--surface); padding:.85rem 1rem; align-items:start; }
  .q:nth-child(even) { background:var(--raise); }
  .no { font-family:"IBM Plex Mono",monospace; font-size:.78rem; font-weight:500;
        font-variant-numeric:tabular-nums; color:var(--faint); text-align:right;
        padding-top:.22rem; }
  .ans {
    /* O 와 X 는 글자입니다. 고정폭 숫자체로 두면 O 가 0 처럼 보입니다. */
    font-size:.88rem; font-weight:600; letter-spacing:.02em;
    width:1.7rem; height:1.7rem; border-radius:.3rem;
    display:inline-flex; align-items:center; justify-content:center;
  }
  .ans-o { background:var(--yes-bg); color:var(--yes); }
  .ans-x { background:var(--no-bg);  color:var(--no); }
  .body { min-width:0; }
  .ask { margin:0; font-size:.98rem; line-height:1.55; }
  .exp { margin:.28rem 0 0; font-size:.87rem; color:var(--muted); line-height:1.5; }
  .src { margin:.45rem 0 0; font-size:.75rem; line-height:1.5; color:var(--faint); }
  .src .org {
    display:inline-block; margin-right:.45rem;
    color:var(--dc); font-weight:500;
  }
  .src a { color:var(--faint); text-decoration:none; border-bottom:1px solid var(--line); }
  .src a:hover, .src a:focus-visible { color:var(--dc); border-bottom-color:var(--dc); }
  a:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:2px; }

  .q[hidden], .area[hidden], .dom[hidden] { display:none !important; }

  .empty { margin:3rem 0; padding:2rem 1.2rem; text-align:center;
           background:var(--surface); border:1px dashed var(--line); border-radius:.5rem;
           color:var(--muted); font-size:.92rem; }

  .tail { margin-top:3.4rem; padding-top:1.8rem; border-top:1px solid var(--line); }
  .tail h2 { font-family:"Nanum Myeongjo",serif; font-weight:700; font-size:1.15rem; margin:0 0 .8rem; }
  .tail p { margin:0; max-width:40em; color:var(--muted); font-size:.88rem; }
  .tail p + p { margin-top:.6rem; }
  .tail code { font-family:"IBM Plex Mono",monospace; font-size:.85em;
               background:var(--line-soft); padding:.1em .38em; border-radius:.25em; color:var(--ink); }

  @media (prefers-reduced-motion:reduce) { * { transition:none !important; animation:none !important; } }
  @media (max-width:32rem) {
    .q { grid-template-columns:1.6rem 1.5rem 1fr; gap:.55rem; padding:.75rem .7rem; }
    .ans { width:1.5rem; height:1.5rem; font-size:.8rem; }
    .bar { padding:.7rem 0 .65rem; }
  }
</style>

<div class="wrap">
  <p class="eyebrow">수업도우미 · 간단교육 퀴즈</p>
  <h1>간단교육 퀴즈 문항집</h1>
  <p class="lede">교실 화면에 나가는 O/X 문항 ${총}개 전체입니다. 문항마다 정답, 해설,
    그리고 그 내용이 어느 기관의 어느 문서에서 왔는지를 함께 적었습니다.
    문서 이름을 누르면 그 원문으로 바로 갑니다.</p>

  <div class="meta">
    <h2>근거 기관 ${Object.keys(기관집계).length}곳</h2>
    <ul class="orgs">${기관줄}</ul>
  </div>

  <div class="bar">
    <div class="bar-in">
      <input class="search" id="find" type="search" placeholder="문항·해설·기관으로 찾기" aria-label="문항 찾기">
      <div class="chips" role="group" aria-label="분야 고르기">
        <button class="chip" data-dom="all" aria-pressed="true">전체<span class="n">${총}</span></button>
        <button class="chip" data-dom="env" aria-pressed="false">환경<span class="n">81</span></button>
        <button class="chip" data-dom="safe" aria-pressed="false">안전<span class="n">85</span></button>
        <button class="chip" data-dom="vio" aria-pressed="false">학교폭력<span class="n">72</span></button>
      </div>
      <div class="chips" role="group" aria-label="정답으로 고르기">
        <button class="chip" data-ans="O" aria-pressed="false">O만<span class="n">${O총}</span></button>
        <button class="chip" data-ans="X" aria-pressed="false">X만<span class="n">${총 - O총}</span></button>
      </div>
    </div>
    <p class="found" id="found" role="status">${총}문항</p>
  </div>

${구역.join('\n\n')}

  <p class="empty" id="empty" hidden>찾는 문항이 없습니다. 다른 낱말로 찾아보세요.</p>

  <div class="tail">
    <h2>이 문항들에 대해</h2>
    <p>모든 문항은 위 기관의 공식 자료를 근거로 <b>새로 썼습니다</b>. 기관 문장을 그대로 옮긴 곳은 없습니다.
      공공누리 제1유형(상업적 이용 허용)으로 공개된 자료가 없어, 기준과 수치만 근거로 삼고
      문항과 해설은 초등학생 눈높이로 다시 썼습니다.</p>
    <p>2026년 8월에 ${총}문항 전체와 인용 URL 전부를 다시 열어 대조했습니다.
      사실이 틀린 문항 1건과 근거가 맞지 않는 문항 3건을 찾아 지우거나 고쳤고,
      대신할 근거를 찾지 못한 문항은 고치지 않고 뺐습니다. 자세한 기록은 근거 자료 문서에 있습니다.</p>
    <p>문항은 저장소의 <code>quiz/scripts/questions/</code> 폴더에 분야별 파일로 들어 있습니다.
      고친 뒤 <code>node scripts/install-questions.mjs</code>, <code>node scripts/make-sw.mjs</code>,
      <code>node scripts/make-sources.mjs</code> 를 차례로 실행하면 화면과 문서가 함께 갱신됩니다.</p>
    <p><b>다음에 확인할 것</b> — 학교폭력예방법이 2027년 1월 1일에 개정 시행됩니다.
      2026년 12월 안에 학교폭력 문항의 조문 근거를 한 번 더 확인해 주세요.</p>
  </div>
</div>

<script>
(function () {
  var 문항 = Array.prototype.slice.call(document.querySelectorAll('.q'));
  var 영역들 = Array.prototype.slice.call(document.querySelectorAll('.area'));
  var 분야들 = Array.prototype.slice.call(document.querySelectorAll('.dom'));
  var 찾기칸 = document.getElementById('find');
  var 세는곳 = document.getElementById('found');
  var 빈칸 = document.getElementById('empty');
  var 분야칩 = Array.prototype.slice.call(document.querySelectorAll('.chip[data-dom]'));
  var 정답칩 = Array.prototype.slice.call(document.querySelectorAll('.chip[data-ans]'));
  var 고른분야 = 'all', 고른정답 = null, 낱말 = '';

  function 다시그리기() {
    var 보인수 = 0;
    분야들.forEach(function (d) {
      var 분야키 = d.getAttribute('data-dom');
      var 분야보임 = (고른분야 === 'all' || 고른분야 === 분야키);
      var 분야안수 = 0;
      Array.prototype.forEach.call(d.querySelectorAll('.area'), function (a) {
        var 영역안수 = 0;
        Array.prototype.forEach.call(a.querySelectorAll('.q'), function (q) {
          var 맞음 = 분야보임 &&
            (!고른정답 || q.getAttribute('data-ans') === 고른정답) &&
            (!낱말 || q.getAttribute('data-find').indexOf(낱말) >= 0);
          q.hidden = !맞음;
          if (맞음) { 영역안수++; 분야안수++; 보인수++; }
        });
        a.hidden = 영역안수 === 0;
      });
      d.hidden = 분야안수 === 0;
    });
    세는곳.textContent = 보인수 + '문항';
    빈칸.hidden = 보인수 > 0;
  }

  찾기칸.addEventListener('input', function () {
    낱말 = 찾기칸.value.trim().toLowerCase();
    다시그리기();
  });

  분야칩.forEach(function (c) {
    c.addEventListener('click', function () {
      고른분야 = c.getAttribute('data-dom');
      분야칩.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      다시그리기();
    });
  });

  정답칩.forEach(function (c) {
    c.addEventListener('click', function () {
      var 값 = c.getAttribute('data-ans');
      고른정답 = (고른정답 === 값) ? null : 값;          // 한 번 더 누르면 해제
      정답칩.forEach(function (o) {
        o.setAttribute('aria-pressed', String(o.getAttribute('data-ans') === 고른정답));
      });
      다시그리기();
    });
  });
})();
</script>
`;

fs.writeFileSync(대상, html);
console.log(`문항집.html 만듦 — ${총}문항 (O ${O총} : X ${총 - O총}) · 기관 ${Object.keys(기관집계).length}곳`);
