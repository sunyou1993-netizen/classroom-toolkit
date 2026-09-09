/* 첫 화면(허브) 목록에 «카드» 를 덧붙입니다 — 원본은 한 글자도 안 건드립니다.
 *
 * ── 왜 이게 필요했나 ──────────────────────────────────────────────
 *
 * 첫 화면에는 도구 카드가 아홉 개 있습니다.
 *   타이머 · 뽀모도로 · 스톱워치 · 세계시간 · 그림판 · 소음측정기 ·
 *   발표자 선정 · 피아노 · 사다리
 *
 * **퀴즈로 가는 길이 없습니다.** 확인해 봤더니 첫 화면 어디에도 quiz 라는
 * 글자조차 없습니다. 선생님이 퀴즈를 쓰려면 주소를 직접 쳐야 합니다.
 * 교실 보드는 주소창이 없는 전체화면이라, 사실상 못 씁니다.
 *
 * ── 원본을 안 건드리고 어떻게 붙이나 ──────────────────────────────
 *
 * 첫 화면은 이렇게 생겼습니다(직접 열어서 확인했습니다).
 *
 *   <div class="cards-grid">                     ← 카드를 담는 곳
 *     <div class="school-card" onclick="openTool('timer')">
 *       <div class="icon-circle"><img ...></div>
 *       <h3>타이머</h3>
 *       <p>원하는 시간을 설정하고<br>카운트다운을 시작해요.</p>
 *     </div>
 *     … 아홉 개 …
 *   </div>
 *
 * 그래서 이렇게 합니다.
 *   ① 이미 있는 카드 하나를 **그대로 복제**합니다
 *   ② 복제본의 그림·제목·설명·눌렀을 때 갈 곳만 바꿉니다
 *   ③ 담는 곳 맨 뒤에 붙입니다
 *
 * **복제**가 핵심입니다. 새로 만들지 않고 있는 것을 베끼기 때문에,
 * AI Studio 가 카드 디자인을 바꿔도 우리 카드가 저절로 따라갑니다.
 * 색·모서리·그림자·글자 크기를 우리가 하나도 안 정합니다.
 *
 * 원본 파일(assets/*.js, *.css)은 열지도 않습니다.
 * 이 스크립트가 하는 일은 화면 맨 아래에 <script> 한 덩어리를 넣는 것뿐이고,
 * 되돌리려면 그 덩어리만 지우면 됩니다.
 *
 * ── 카드를 더 넣고 싶으면 ────────────────────────────────────────
 *
 * 아래 「넣을카드」 목록에 한 줄 더 적고 이 스크립트를 다시 돌리면 됩니다.
 *
 * 사용법: node scripts/add-nav-card.mjs        (수업도우미 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'nav-extra-cards';

/* ─────────────────────────────────────────────────────────────
   여기만 고치시면 됩니다.
     이름   : 카드에 크게 나올 글자
     설명   : 그 아래 작은 글자 (<br> 로 줄을 바꿉니다)
     그림   : 그림 문자 하나, 또는 이미지 주소('./quiz/image7.webp' 처럼)
     주소   : 눌렀을 때 갈 곳
     켜기   : false 로 두면 안 나옵니다 (지우지 않고 잠깐 꺼 둘 때)
   ───────────────────────────────────────────────────────────── */
const 넣을카드 = [
  {
    이름: '퀴즈',
    설명: '환경·안전·학교폭력·속담<br>사자성어·교가를 풀어요.',
    그림: '✏️',
    주소: './quiz/',
    켜기: true,
  },
  {
    /* 보드가 제대로 도는지 보는 점검 화면입니다.
       학교 선생님한테는 보일 이유가 없으므로 꺼 둡니다.
       보드 앞에서 확인할 때만 true 로 바꿔서 한 판 만들어 쓰세요.
       (그냥 주소로 …/board-check/ 를 열어도 됩니다) */
    이름: '보드 점검',
    설명: '보드가 제대로 도는지<br>10분 만에 확인해요.',
    그림: '🔎',
    주소: './board-check/',
    켜기: false,
  },
];

const 쓸것 = 넣을카드.filter((x) => x.켜기);

const 넣을것 = `<script id="${표시}">
/* 첫 화면 목록에 카드를 덧붙입니다 (scripts/add-nav-card.mjs).
 *
 * 원본은 한 글자도 안 건드립니다. 이미 있는 카드를 «복제» 해서
 * 그림·글자·갈 곳만 바꿔 붙이므로, 카드 디자인이 바뀌면 저절로 따라갑니다.
 * 되돌리려면 이 <script> 덩어리만 지우면 됩니다. */
(function () {
  var 카드들 = ${JSON.stringify(쓸것.map((x) => ({ 이름: x.이름, 설명: x.설명, 그림: x.그림, 주소: x.주소 })), null, 2).replace(/\n/g, '\n  ')};
  if (!카드들.length) return;

  var 붙였음 = false;

  function 붙이기() {
    if (붙였음) return true;
    var 담는곳 = document.querySelector('.cards-grid');
    if (!담는곳) return false;
    var 본보기 = 담는곳.querySelector('.school-card');
    if (!본보기) return false;                       /* 카드가 아직 안 그려졌습니다 */

    카드들.forEach(function (것) {
      /* 같은 카드를 두 번 붙이지 않습니다 */
      if (담는곳.querySelector('[data-덧붙인카드="' + 것.이름 + '"]')) return;

      var 새것 = 본보기.cloneNode(true);
      새것.setAttribute('data-덧붙인카드', 것.이름);
      새것.removeAttribute('onclick');
      새것.onclick = null;

      /* 그림 — 이미지 주소면 그대로, 아니면 그림 문자로 */
      var 그림칸 = 새것.querySelector('img');
      if (그림칸) {
        if (/[\\/.]/.test(것.그림)) {
          그림칸.setAttribute('src', 것.그림);
          그림칸.setAttribute('alt', 것.이름);
        } else {
          /* 그림 문자는 <img> 로 못 넣으므로, 같은 자리에 글자로 넣습니다.
             크기는 원래 그림이 차지하던 만큼 그대로 씁니다. */
          var 상자 = 그림칸.getBoundingClientRect();
          var 글자 = document.createElement('span');
          글자.textContent = 것.그림;
          글자.setAttribute('aria-hidden', 'true');
          글자.style.cssText = 'display:flex;align-items:center;justify-content:center;'
            + 'width:' + (상자.width || 138) + 'px;height:' + (상자.height || 138) + 'px;'
            + 'font-size:' + Math.round((상자.height || 138) * 0.62) + 'px;line-height:1;';
          그림칸.parentNode.replaceChild(글자, 그림칸);
        }
      }

      var 제목 = 새것.querySelector('h3');
      if (제목) 제목.textContent = 것.이름;
      var 설명 = 새것.querySelector('p');
      if (설명) 설명.innerHTML = 것.설명;

      /* 눌렀을 때 — 원본이 쓰는 이동 방법을 그대로 씁니다.
         (없으면 평범하게 주소를 바꿉니다) */
      function 가기() {
        try {
          if (typeof window.goToService === 'function') { window.goToService(것.주소); return; }
        } catch (e) {}
        window.location.href = 것.주소;
      }
      새것.addEventListener('click', 가기);

      /* 원본 카드는 그냥 <div> 라 키보드로는 갈 수 없습니다.
         우리가 붙이는 카드만이라도 키보드·화면읽기로 쓸 수 있게 해 둡니다.
         (원본은 건드리지 않습니다) */
      새것.setAttribute('role', 'button');
      새것.setAttribute('tabindex', '0');
      새것.setAttribute('aria-label', 것.이름 + ' 열기');
      새것.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); 가기(); }
      });

      담는곳.appendChild(새것);
    });

    붙였음 = true;
    return true;
  }

  /* 첫 화면은 자바스크립트로 나중에 그려집니다. 그려질 때까지 기다립니다. */
  if (!붙이기()) {
    var 지켜보기 = new MutationObserver(function () { if (붙이기()) 지켜보기.disconnect(); });
    지켜보기.observe(document.documentElement, { childList: true, subtree: true });
    /* 혹시 못 찾아도 15초 뒤에는 지켜보기를 그만둡니다(괜히 계속 돌지 않게) */
    setTimeout(function () { 지켜보기.disconnect(); }, 15000);
  }
})();
</script>
`;

/* 첫 화면(허브)에만 넣습니다. 도구 화면들에는 카드 목록이 없습니다. */
const ROOT = process.cwd();
const 대상 = path.join(ROOT, 'app.html');

if (!fs.existsSync(대상)) {
  console.error('✗ app.html 이 없습니다. 수업도우미 폴더에서 실행해 주세요.');
  process.exit(1);
}
let s = fs.readFileSync(대상, 'utf8');

/* 이미 넣어 둔 것이 있으면 통째로 갈아 끼웁니다(목록을 고쳤을 수 있으므로) */
const 옛것 = new RegExp(`<script id="${표시}">[\\s\\S]*?</script>\\n?`);
const 있었나 = 옛것.test(s);
if (있었나) s = s.replace(옛것, '');

const i = s.lastIndexOf('</body>');
if (i < 0) { console.error('✗ </body> 를 찾지 못했습니다'); process.exit(1); }
fs.writeFileSync(대상, s.slice(0, i) + 넣을것 + s.slice(i));

console.log(`  ${있었나 ? '갈아 끼움' : '넣음'}: app.html`);
console.log(`  덧붙일 카드 ${쓸것.length}개 — ${쓸것.map((x) => x.이름).join(', ') || '(없음)'}`);
const 끈것 = 넣을카드.filter((x) => !x.켜기);
if (끈것.length) console.log(`  꺼 둔 카드 ${끈것.length}개 — ${끈것.map((x) => x.이름).join(', ')}`);
console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
