/* 문항집 페이지를 만듭니다 — 게임 6개, 문항 전체와 각 문항의 출처.
 *
 *   node scripts/make-bank.mjs      (퀴즈 폴더 루트에서)
 *
 * 근거표(문항근거.html)가 "어느 문서에서 왔나"를 문서 단위로 보여준다면,
 * 이 문항집은 "게임마다 어떤 문항이 있고 어디서 왔나"를 문항 단위로 보여줍니다.
 *
 * 문항 자료를 읽는 곳:
 *   O/X 세 게임 → scripts/questions/*.json  (출처가 문항마다 붙어 있습니다)
 *   속담·사자성어 → 각 게임의 번들에서 직접 뽑아옵니다 (원본 콘텐츠라 기관 출처가 없습니다)
 *   교가 → scripts/school-song.json 과 목록에 카드가 켜져 있는지
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 대상 = path.join(ROOT, '문항집.html');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

const 번들 = (폴더) => {
  const d = path.join(ROOT, 폴더, 'assets');
  if (!fs.existsSync(d)) return '';
  const f = fs.readdirSync(d).filter((n) => n.endsWith('.js'))[0];
  return f ? fs.readFileSync(path.join(d, f), 'utf8') : '';
};

/* ── 자료 모으기 ─────────────────────────────────────────── */

const OX = ['environment', 'safe', 'violence'].map((n) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'questions', n + '.json'), 'utf8')));

const 속담 = [...번들('proverb').matchAll(
  /proverb:"((?:[^"\\]|\\.)*)",targets:\[([^\]]*)\],meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)"/g)]
  .map((m) => ({
    본문: JSON.parse('"' + m[1] + '"'),
    빈칸: m[2].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean),
    뜻: JSON.parse('"' + m[3] + '"'),
    갈래: m[4],
  }));

const 사자성어 = [...번들('fourchar').matchAll(
  /idiom:"((?:[^"\\]|\\.)*)",hanja:"([^"]*)",meaning:"((?:[^"\\]|\\.)*)",category:"([^"]*)",targets:\[([^\]]*)\]/g)]
  .map((m) => ({
    본문: JSON.parse('"' + m[1] + '"'),
    한자: m[2],
    뜻: JSON.parse('"' + m[3] + '"'),
    갈래: m[4],
    빈칸: m[5].split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean),
  }));

// 교가는 학교마다 다릅니다. 목록에 카드가 켜져 있는지까지 봅니다.
const 교가켜짐 = fs.readdirSync(path.join(ROOT, 'assets')).filter((n) => n.endsWith('.js'))
  .some((n) => fs.readFileSync(path.join(ROOT, 'assets', n), 'utf8').includes('id:"school"'));
const 교가설정 = fs.existsSync(path.join(ROOT, 'scripts', 'school-song.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'school-song.json'), 'utf8')) : null;
const 교가줄수 = 교가설정 ? 교가설정.verses.reduce((n, v) => n + v.length, 0) : 0;

/* ── 빈칸 표시 ─────────────────────────────────────────────
 * 빈칸으로 뚫는 글자를 문장 안에서 찾아 표시합니다.
 * 빈칸 글자는 문장에 한 번만 나오도록 이미 맞춰져 있으므로 첫 번째 것만 칠합니다. */
function 빈칸표시(본문, 빈칸) {
  const 칠할곳 = new Set();
  for (const ch of 빈칸) {
    const i = 본문.indexOf(ch);
    if (i >= 0 && !칠할곳.has(i)) 칠할곳.add(i);
  }
  return [...본문].map((ch, i) =>
    칠할곳.has(i) ? `<b class="blank">${esc(ch)}</b>` : esc(ch)).join('');
}

/* ── 게임 정의 ─────────────────────────────────────────── */

const 게임 = [
  {
    키: 'pro', 이름: '속담', 부제: '빈칸에 들어갈 글자를 골라 속담을 완성해요',
    수: 속담.length, 형: '빈칸',
    출처: '개발사 원본 콘텐츠 · 기관 출처 없음',
    출처설명: `퀴즈 앱에 원래 들어 있던 콘텐츠입니다. 기관 자료에서 가져온 것이 아니라 <b>출처를 적을 수 없습니다</b>.
      2026년 8월 검수에서 표준 표기와 다른 속담 9건, 뜻풀이 2건을 고쳤고,
      장애인 비하 표현이 들어간 속담 2건을 다른 속담으로 바꿨습니다.`,
    묶음: 그룹만들기(속담, (x) => x.갈래, (x, i) => 속담행(x, i)),
  },
  {
    키: 'idi', 이름: '사자성어', 부제: '빈칸에 들어갈 글자를 골라 사자성어를 완성해요',
    수: 사자성어.length, 형: '빈칸',
    출처: '개발사 원본 콘텐츠 · 기관 출처 없음',
    출처설명: `퀴즈 앱에 원래 들어 있던 콘텐츠입니다. 기관 자료에서 가져온 것이 아니라 <b>출처를 적을 수 없습니다</b>.
      2026년 8월 검수에서 뜻풀이가 어렵거나 부정확한 7건을 초등학생이 읽을 수 있게 고쳤습니다.`,
    묶음: 그룹만들기(사자성어, (x) => x.갈래, (x, i) => 사자성어행(x, i)),
  },
  {
    키: 'env', 이름: '환경', 부제: '분리배출 · 자원순환 · 기후', 수: OX[0].length, 형: 'OX',
    출처: '기후에너지환경부 · 기상청 등',
    묶음: 그룹만들기(OX[0], (x) => x.영역, OX행),
  },
  {
    키: 'safe', 이름: '안전', 부제: '교통 · 화재 · 응급처치 · 재난', 수: OX[1].length, 형: 'OX',
    출처: '행정안전부 · 법제처 · 질병관리청 등',
    묶음: 그룹만들기(OX[1], (x) => x.영역, OX행),
  },
  {
    키: 'vio', 이름: '학교폭력', 부제: '예방 · 신고 · 회복', 수: OX[2].length, 형: 'OX',
    출처: '법제처 · 교육부 등',
    묶음: 그룹만들기(OX[2], (x) => x.영역, OX행),
  },
  {
    키: 'song', 이름: '교가', 부제: '우리 학교 노래의 빈칸을 채워요',
    수: 교가켜짐 ? 교가줄수 : 0, 형: '학교별',
    출처: '학교마다 다름',
    묶음: `        <div class="song-note">
          <p><b>교가는 학교마다 다릅니다.</b> 그래서 다른 게임처럼 정해진 문항이 없습니다.
            배포하는 학교의 교가를 넣어야 카드가 켜지고, 넣기 전에는 목록에 보이지 않습니다.</p>
          <p class="song-now">지금 상태 — ${교가켜짐
            ? `<b>켜짐</b> · ${esc(교가설정 ? 교가설정.schoolName : '')} · ${교가줄수}줄`
            : '<b>꺼짐</b> · 아직 학교 교가를 넣지 않아 목록에 나오지 않습니다'}</p>
          <p class="song-how">넣는 법 — <code>quiz/scripts/school-song.json</code> 에 학교 이름과 가사를 적고,
            <code>node scripts/set-school-song.mjs</code> 와 <code>node scripts/make-sw.mjs</code> 를 실행합니다.
            대괄호로 감싼 두 글자가 빈칸이 되고, 안 쓰면 줄마다 알아서 고릅니다.</p>
        </div>`,
  },
];

/* ── 행 만들기 ─────────────────────────────────────────── */

function 찾기글(...조각) { return esc(조각.filter(Boolean).join(' ').toLowerCase()); }

function OX행(x) {
  return `          <li class="q ox" data-ans="${x.ans}" data-find="${찾기글(x.q, x.exp, x.영역, x.근거기관, x.근거문서)}">
            <span class="no">${x.id}</span>
            <span class="ans ans-${x.ans === 'O' ? 'o' : 'x'}">${x.ans}</span>
            <div class="body">
              <p class="ask">${esc(x.q)}</p>
              <p class="exp">${esc(x.exp)}</p>
              <p class="src"><span class="org">${esc(x.근거기관)}</span><a href="${esc(x.출처)}" target="_blank" rel="noopener">${esc(x.근거문서)}</a></p>
            </div>
          </li>`;
}

function 속담행(x, i) {
  return `          <li class="q fill" data-find="${찾기글(x.본문, x.뜻, x.갈래)}">
            <span class="no">${i + 1}</span>
            <div class="body">
              <p class="ask">${빈칸표시(x.본문, x.빈칸)}</p>
              <p class="exp">${esc(x.뜻)}</p>
            </div>
          </li>`;
}

function 사자성어행(x, i) {
  return `          <li class="q fill" data-find="${찾기글(x.본문, x.한자, x.뜻, x.갈래)}">
            <span class="no">${i + 1}</span>
            <div class="body">
              <p class="ask">${빈칸표시(x.본문, x.빈칸)} <span class="hanja">${esc(x.한자)}</span></p>
              <p class="exp">${esc(x.뜻)}</p>
            </div>
          </li>`;
}

function 그룹만들기(목록, 갈래뽑기, 행만들기) {
  const 순서 = [];
  목록.forEach((x) => { const g = 갈래뽑기(x); if (!순서.includes(g)) 순서.push(g); });
  return 순서.map((g) => {
    const 안 = [];
    목록.forEach((x, i) => { if (갈래뽑기(x) === g) 안.push(행만들기(x, i)); });
    return `        <section class="area">
          <h3 class="area-name">${esc(g)} <span class="area-n">${안.length}</span></h3>
          <ol class="qs">
${안.join('\n')}
          </ol>
        </section>`;
  }).join('\n');
}

/* ── 페이지 ─────────────────────────────────────────────── */

const 총문항 = 게임.reduce((n, g) => n + g.수, 0);
const O총 = OX.flat().filter((x) => x.ans === 'O').length;
const X총 = OX.flat().length - O총;

const 기관집계 = {};
OX.flat().forEach((x) => { 기관집계[x.근거기관] = (기관집계[x.근거기관] || 0) + 1; });
const 기관줄 = Object.entries(기관집계).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `<li>${esc(k)}<b>${v}</b></li>`).join('');

const 구역 = 게임.map((g) => `  <section class="game" id="${g.키}" data-game="${g.키}">
      <header class="game-head">
        <h2>${g.이름}</h2>
        <p class="game-sub">${g.부제}</p>
        <p class="game-n">${g.수 ? `<b>${g.수}</b><span>${g.형 === '학교별' ? '줄' : '문항'}</span>` : '<span class="off">꺼짐</span>'}</p>
      </header>
      <p class="game-src"><span class="tag">${g.형}</span>${g.출처설명 || esc(g.출처)}</p>
${g.묶음}
    </section>`).join('\n\n');

const 칩 = 게임.map((g) =>
  `<button class="chip" data-game="${g.키}" data-ox="${g.형 === 'OX' ? 1 : 0}" aria-pressed="false">${g.이름}<span class="n">${g.수 || '–'}</span></button>`).join('');

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
    --pro:#8A4B7C;  --pro-bg:#F2E9F0;
    --idi:#1F6F8B;  --idi-bg:#E4EFF3;
    --env:#2C7A4B;  --env-bg:#E8F2EC;
    --safe:#9A5E14; --safe-bg:#F6EEE2;
    --vio:#3A55A0;  --vio-bg:#E9EDF7;
    --song:#5B6B66; --song-bg:#EAEFED;
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
      --pro:#CD97C0;  --pro-bg:#251A23;
      --idi:#79BBD3;  --idi-bg:#12222A;
      --env:#6FCB92;  --env-bg:#152519;
      --safe:#D9A45E; --safe-bg:#241D12;
      --vio:#8AA3E6;  --vio-bg:#151B2A;
      --song:#9FB0AA; --song-bg:#1B2422;
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
    --pro:#CD97C0;  --pro-bg:#251A23;
    --idi:#79BBD3;  --idi-bg:#12222A;
    --env:#6FCB92;  --env-bg:#152519;
    --safe:#D9A45E; --safe-bg:#241D12;
    --vio:#8AA3E6;  --vio-bg:#151B2A;
    --song:#9FB0AA; --song-bg:#1B2422;
    --shadow:0 1px 2px rgba(0,0,0,.3);
  }

  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--ground); color:var(--ink);
    font-family:"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
    font-weight:400; line-height:1.65; -webkit-font-smoothing:antialiased;
  }
  .wrap { max-width:54rem; margin:0 auto; padding:clamp(1.8rem,5vw,4rem) clamp(1rem,4vw,2.2rem) 5rem; }

  .eyebrow { font-family:"IBM Plex Mono",monospace; font-size:.7rem; font-weight:600;
             letter-spacing:.16em; color:var(--accent); margin:0 0 .8rem; }
  h1 { font-family:"Nanum Myeongjo",serif; font-weight:800;
       font-size:clamp(1.8rem,4.6vw,2.7rem); line-height:1.25; letter-spacing:-.01em;
       margin:0 0 .9rem; text-wrap:balance; }
  .lede { margin:0; max-width:36em; color:var(--muted); font-size:1rem; }

  /* ── 게임 한눈에 ── */
  /* 여섯 칸이 한 줄에 들어가고, 좁아지면 셋 → 둘로 접힙니다.
     칸마다 테두리를 줘서 마지막 줄이 비어도 빈 회색이 남지 않습니다. */
  .cards { display:grid; grid-template-columns:repeat(6,1fr); gap:.5rem; margin:1.9rem 0 0; }
  .card { background:var(--surface); padding:.8rem .85rem; text-decoration:none; color:inherit;
          border:1px solid var(--line); border-top:3px solid var(--gc);
          border-radius:.4rem; display:block; }
  .card:hover, .card:focus-visible { background:var(--raise); border-color:var(--gc); }
  .card[data-g="pro"]  { --gc:var(--pro); }
  .card[data-g="idi"]  { --gc:var(--idi); }
  .card[data-g="env"]  { --gc:var(--env); }
  .card[data-g="safe"] { --gc:var(--safe); }
  .card[data-g="vio"]  { --gc:var(--vio); }
  .card[data-g="song"] { --gc:var(--song); }
  .card-name { display:block; font-size:.95rem; font-weight:600; color:var(--gc); }
  .card-n { display:block; font-family:"IBM Plex Mono",monospace; font-size:1.3rem;
            font-weight:600; font-variant-numeric:tabular-nums; line-height:1.3; }
  .card-n small { font-family:inherit; font-size:.75rem; font-weight:400; color:var(--muted); margin-left:.2rem; }
  .card-form { display:block; font-size:.72rem; color:var(--faint); }

  .meta { margin:1.1rem 0 0; padding:1.05rem 1.2rem; background:var(--surface);
          border:1px solid var(--line); border-radius:.5rem; }
  .meta h2 { margin:0 0 .3rem; font-size:.8rem; font-weight:600; color:var(--ink); }
  .meta .why { margin:0 0 .7rem; font-size:.8rem; color:var(--muted); }
  .orgs { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; gap:.4rem .5rem; }
  .orgs li { font-size:.78rem; color:var(--muted); background:var(--ground);
             border:1px solid var(--line-soft); border-radius:.3rem; padding:.2rem .5rem;
             display:inline-flex; align-items:baseline; gap:.4rem; }
  .orgs b { font-family:"IBM Plex Mono",monospace; font-variant-numeric:tabular-nums;
            color:var(--accent); font-size:.8rem; }

  /* ── 고르기 줄 ── */
  .bar { position:sticky; top:0; z-index:20; margin:2rem 0 0;
         background:var(--ground); padding:.9rem 0 .8rem; border-bottom:1px solid var(--line); }
  .bar-in { display:flex; flex-wrap:wrap; gap:.6rem; align-items:center; }
  .search { flex:1 1 13rem; min-width:0; font:inherit; font-size:.92rem; color:var(--ink);
            background:var(--surface); border:1px solid var(--line);
            border-radius:.4rem; padding:.5rem .75rem; }
  .search::placeholder { color:var(--faint); }
  .search:focus-visible { outline:2px solid var(--accent); outline-offset:1px; border-color:var(--accent); }
  .chips { display:flex; flex-wrap:wrap; gap:.35rem; }
  .chip { font:inherit; font-size:.82rem; font-weight:500; color:var(--muted);
          background:var(--surface); border:1px solid var(--line);
          border-radius:2rem; padding:.34rem .8rem; cursor:pointer;
          transition:background .12s, color .12s, border-color .12s; }
  .chip:hover { border-color:var(--accent); color:var(--ink); }
  .chip:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .chip[aria-pressed="true"] { background:var(--accent); border-color:var(--accent); color:var(--ground); }
  .chip .n { font-family:"IBM Plex Mono",monospace; font-variant-numeric:tabular-nums;
             font-size:.76rem; opacity:.75; margin-left:.35rem; }
  #oxgroup[hidden] { display:none; }
  .found { margin:.6rem 0 0; font-size:.8rem; color:var(--faint); font-variant-numeric:tabular-nums; }

  /* ── 게임 ── */
  .game { margin-top:3rem; scroll-margin-top:6.5rem; }
  .game[data-game="pro"]  { --gc:var(--pro);  --gbg:var(--pro-bg); }
  .game[data-game="idi"]  { --gc:var(--idi);  --gbg:var(--idi-bg); }
  .game[data-game="env"]  { --gc:var(--env);  --gbg:var(--env-bg); }
  .game[data-game="safe"] { --gc:var(--safe); --gbg:var(--safe-bg); }
  .game[data-game="vio"]  { --gc:var(--vio);  --gbg:var(--vio-bg); }
  .game[data-game="song"] { --gc:var(--song); --gbg:var(--song-bg); }
  .game-head { display:flex; align-items:baseline; gap:.9rem; flex-wrap:wrap;
               padding-bottom:.7rem; border-bottom:2px solid var(--gc); }
  .game-head h2 { font-family:"Nanum Myeongjo",serif; font-weight:700; font-size:1.55rem;
                  margin:0; color:var(--gc); letter-spacing:-.01em; }
  .game-sub { margin:0; flex:1; font-size:.82rem; color:var(--muted); }
  .game-n { margin:0; white-space:nowrap; }
  .game-n b { font-family:"IBM Plex Mono",monospace; font-size:1.25rem; font-weight:600;
              font-variant-numeric:tabular-nums; color:var(--ink); }
  .game-n span { font-size:.8rem; color:var(--muted); margin-left:.2rem; }
  .game-n .off { color:var(--faint); font-size:.85rem; }
  .game-src { margin:.75rem 0 0; font-size:.8rem; color:var(--muted); line-height:1.6; }
  .game-src .tag { display:inline-block; margin-right:.5rem; padding:.1rem .4rem;
                   background:var(--gbg); color:var(--gc); border-radius:.25rem;
                   font-size:.72rem; font-weight:600; }
  .game-src b { color:var(--ink); font-weight:600; }

  .area { margin-top:1.8rem; }
  .area-name { margin:0 0 .7rem; font-size:.86rem; font-weight:600; color:var(--gc);
               display:flex; align-items:center; gap:.5rem; }
  .area-n { font-family:"IBM Plex Mono",monospace; font-size:.72rem; font-weight:600;
            font-variant-numeric:tabular-nums;
            background:var(--gbg); color:var(--gc); border-radius:.25rem; padding:.05rem .35rem; }

  /* ── 문항 ── */
  .qs { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:1px;
        background:var(--line); border:1px solid var(--line);
        border-radius:.45rem; overflow:hidden; box-shadow:var(--shadow); }
  .q { display:grid; gap:.7rem; background:var(--surface); padding:.85rem 1rem; align-items:start; }
  .q.ox   { grid-template-columns:2.1rem 1.7rem 1fr; }
  .q.fill { grid-template-columns:2.1rem 1fr; }
  .q:nth-child(even) { background:var(--raise); }
  .no { font-family:"IBM Plex Mono",monospace; font-size:.78rem; font-weight:500;
        font-variant-numeric:tabular-nums; color:var(--faint); text-align:right; padding-top:.22rem; }
  .ans { font-size:.88rem; font-weight:600; letter-spacing:.02em;
         width:1.7rem; height:1.7rem; border-radius:.3rem;
         display:inline-flex; align-items:center; justify-content:center; }
  .ans-o { background:var(--yes-bg); color:var(--yes); }
  .ans-x { background:var(--no-bg);  color:var(--no); }
  .body { min-width:0; }
  .ask { margin:0; font-size:.98rem; line-height:1.55; }
  .ask .blank { font-weight:600; color:var(--gc);
                background:var(--gbg); border-radius:.2rem; padding:.02em .18em; }
  .hanja { margin-left:.4rem; font-size:.86rem; color:var(--faint); font-weight:400; }
  .exp { margin:.28rem 0 0; font-size:.87rem; color:var(--muted); line-height:1.5; }
  .src { margin:.45rem 0 0; font-size:.75rem; line-height:1.5; color:var(--faint); }
  .src .org { display:inline-block; margin-right:.45rem; color:var(--gc); font-weight:500; }
  .src a { color:var(--faint); text-decoration:none; border-bottom:1px solid var(--line); }
  .src a:hover, .src a:focus-visible { color:var(--gc); border-bottom-color:var(--gc); }
  a:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:2px; }

  .song-note { margin-top:1.4rem; padding:1.15rem 1.3rem; background:var(--surface);
               border:1px solid var(--line); border-left:3px solid var(--song); border-radius:.4rem; }
  .song-note p { margin:0; font-size:.9rem; color:var(--muted); line-height:1.65; }
  .song-note p + p { margin-top:.65rem; }
  .song-note b { color:var(--ink); }
  .song-now, .song-how { font-size:.85rem; }

  .q[hidden], .area[hidden], .game[hidden] { display:none !important; }
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
  @media (max-width:46rem) { .cards { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:32rem) {
    .cards { grid-template-columns:repeat(2,1fr); }
    .q.ox { grid-template-columns:1.6rem 1.5rem 1fr; gap:.55rem; }
    .q.fill { grid-template-columns:1.6rem 1fr; gap:.55rem; }
    .q { padding:.75rem .7rem; }
    .ans { width:1.5rem; height:1.5rem; font-size:.8rem; }
    .bar { padding:.7rem 0 .65rem; }
  }
</style>

<div class="wrap">
  <p class="eyebrow">수업도우미 · 간단교육 퀴즈</p>
  <h1>간단교육 퀴즈 문항집</h1>
  <p class="lede">교실 화면에 나가는 게임 6개와 그 안의 문항 ${총문항}개 전체입니다.
    O/X 게임은 문항마다 어느 기관의 어느 문서에서 왔는지를 함께 적었고,
    속담·사자성어는 출처가 없다는 것까지 그대로 밝혔습니다.</p>

  <nav class="cards" aria-label="게임 바로가기">
${게임.map((g) => `    <a class="card" data-g="${g.키}" href="#${g.키}">
      <span class="card-name">${g.이름}</span>
      <span class="card-n">${g.수 || '–'}<small>${g.수 ? (g.형 === '학교별' ? '줄' : '문항') : '꺼짐'}</small></span>
      <span class="card-form">${g.형 === 'OX' ? 'O/X 고르기' : g.형 === '빈칸' ? '빈칸 채우기' : '학교마다 다름'}</span>
    </a>`).join('\n')}
  </nav>

  <div class="meta">
    <h2>O/X 세 게임의 근거 기관 ${Object.keys(기관집계).length}곳</h2>
    <p class="why">환경 · 안전 · 학교폭력 ${OX.flat().length}문항이 근거로 삼은 기관입니다.
      속담과 사자성어는 기관 자료가 아니라 앱에 원래 들어 있던 콘텐츠라 여기 없습니다.</p>
    <ul class="orgs">${기관줄}</ul>
  </div>

  <div class="bar">
    <div class="bar-in">
      <input class="search" id="find" type="search" placeholder="문항·뜻·기관으로 찾기" aria-label="문항 찾기">
      <div class="chips" role="group" aria-label="게임 고르기">
        <button class="chip" data-game="all" data-ox="1" aria-pressed="true">전체<span class="n">${총문항}</span></button>
        ${칩}
      </div>
      <div class="chips" id="oxgroup" role="group" aria-label="정답으로 고르기">
        <button class="chip" data-ans="O" aria-pressed="false">O만<span class="n">${O총}</span></button>
        <button class="chip" data-ans="X" aria-pressed="false">X만<span class="n">${X총}</span></button>
      </div>
    </div>
    <p class="found" id="found" role="status">${총문항}문항</p>
  </div>

${구역}

  <p class="empty" id="empty" hidden>찾는 문항이 없습니다. 다른 낱말로 찾아보세요.</p>

  <div class="tail">
    <h2>이 문항들에 대해</h2>
    <p><b>환경 · 안전 · 학교폭력</b>(${OX.flat().length}문항)은 위 기관의 공식 자료를 근거로 새로 썼습니다.
      기관 문장을 그대로 옮긴 곳은 없습니다. 2026년 8월에 전 문항과 인용 URL 전부를 다시 열어 대조했고,
      사실이 틀린 문항 1건과 근거가 맞지 않는 문항 3건을 지우거나 고쳤습니다.</p>
    <p><b>속담 · 사자성어</b>(${속담.length + 사자성어.length}문항)는 퀴즈 앱에 원래 들어 있던 콘텐츠입니다.
      기관 출처가 없으므로 근거로 내세울 수 없습니다. 대신 표기·뜻풀이를 검수해 18건을 고쳤고,
      답이 문제 안에 그대로 보이던 빈칸 32곳을 다른 글자로 바꿨습니다.</p>
    <p><b>교가</b>는 학교마다 다르므로 정해진 문항이 없습니다. 학교 교가를 넣기 전에는 목록에 나오지 않습니다.</p>
    <p>문항을 고친 뒤 <code>node scripts/install-questions.mjs</code>, <code>node scripts/make-sw.mjs</code>,
      <code>node scripts/make-bank.mjs</code>, <code>node scripts/make-sources.mjs</code> 를 차례로 실행하면
      화면과 이 문서가 함께 갱신됩니다.</p>
    <p><b>다음에 확인할 것</b> — 학교폭력예방법이 2027년 1월 1일에 개정 시행됩니다.
      2026년 12월 안에 학교폭력 문항의 조문 근거를 한 번 더 확인해 주세요.</p>
  </div>
</div>

<script>
(function () {
  var 게임들 = Array.prototype.slice.call(document.querySelectorAll('.game'));
  var 찾기칸 = document.getElementById('find');
  var 세는곳 = document.getElementById('found');
  var 빈칸 = document.getElementById('empty');
  var OX묶음 = document.getElementById('oxgroup');
  var 게임칩 = Array.prototype.slice.call(document.querySelectorAll('.chip[data-game]'));
  var 정답칩 = Array.prototype.slice.call(document.querySelectorAll('.chip[data-ans]'));
  var 고른게임 = 'all', 고른정답 = null, 낱말 = '';

  function 다시그리기() {
    var 보인수 = 0;
    게임들.forEach(function (sec) {
      var 키 = sec.getAttribute('data-game');
      var 게임보임 = (고른게임 === 'all' || 고른게임 === 키);
      var 게임안수 = 0;
      Array.prototype.forEach.call(sec.querySelectorAll('.area'), function (a) {
        var 영역안수 = 0;
        Array.prototype.forEach.call(a.querySelectorAll('.q'), function (q) {
          var 정답 = q.getAttribute('data-ans');
          var 맞음 = 게임보임 &&
            (!고른정답 || 정답 === 고른정답) &&
            (!낱말 || q.getAttribute('data-find').indexOf(낱말) >= 0);
          q.hidden = !맞음;
          if (맞음) { 영역안수++; 게임안수++; 보인수++; }
        });
        a.hidden = 영역안수 === 0;
      });
      // 교가처럼 문항 목록이 없는 게임은 낱말/정답으로 거르지 않을 때만 보여 줍니다.
      var 목록없음 = sec.querySelectorAll('.q').length === 0;
      sec.hidden = 목록없음 ? !(게임보임 && !낱말 && !고른정답) : 게임안수 === 0;
    });
    세는곳.textContent = 보인수 + '문항';
    빈칸.hidden = 보인수 > 0 || 게임들.some(function (s) { return !s.hidden; });
  }

  찾기칸.addEventListener('input', function () {
    낱말 = 찾기칸.value.trim().toLowerCase();
    다시그리기();
  });

  게임칩.forEach(function (c) {
    c.addEventListener('click', function () {
      고른게임 = c.getAttribute('data-game');
      게임칩.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      // O/X 가 없는 게임을 골랐으면 정답 거르기는 감추고 해제합니다.
      var OX있음 = c.getAttribute('data-ox') === '1';
      OX묶음.hidden = !OX있음;
      if (!OX있음 && 고른정답) {
        고른정답 = null;
        정답칩.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      }
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
console.log('문항집.html 만듦');
게임.forEach((g) => console.log(`  ${g.이름.padEnd(6)} ${String(g.수 || '-').padStart(4)} ${g.형}`));
console.log(`  ─────────────────\n  합계   ${총문항}  (O/X 중 O ${O총} : X ${X총})`);
