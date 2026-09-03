/* 퀴즈 첫화면의 카드를 키보드로도 고를 수 있게 합니다.
 *
 * 무엇이 문제였나:
 *   화면마다 «Tab 으로 옮겨 다닐 수 있는 곳» 이 몇 개인지 세어 봤습니다.
 *
 *     수업도우미 첫화면   74개   ✓
 *     그림판             27개   ✓
 *     사다리             31개   ✓
 *     타이머             15개   ✓
 *     퀴즈 첫화면          0개   ✗   ← 여기
 *
 *   퀴즈 5개 카드가 전부 그냥 <div> 였습니다.
 *   단추도 아니고 링크도 아니어서, 키보드로는 **어느 퀴즈에도 들어갈 수 없습니다.**
 *   화면 읽어주는 기능을 쓰는 아이에게도 «누를 수 있는 것» 으로 안 읽힙니다.
 *   그냥 글자로 읽고 지나갑니다.
 *
 * 언제 문제가 되나:
 *   · 보드 터치가 안 될 때 (선생님이 키보드를 붙여 씁니다)
 *   · 시각장애가 있는 아이가 화면 읽어주기로 쓸 때
 *   · 손을 쓰기 어려워 보조 기기를 쓰는 아이
 *
 *   수업도우미 쪽은 다 되는데 퀴즈만 안 되는 것이라, 맞춰 두는 것이 맞습니다.
 *
 * 어떻게 고쳤나:
 *   카드에 «이건 누르는 것» 이라는 표시(role=button)와 Tab 순서(tabindex=0)를 주고,
 *   Enter·스페이스로도 눌리게 합니다. 보이는 모습은 하나도 바뀌지 않습니다.
 *   원래 코드는 건드리지 않고, 화면이 뜬 뒤에 덧붙이는 방식입니다.
 *
 * 사용법: node scripts/fix-card-keyboard.mjs      (퀴즈 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'card-keyboard';

const 넣을것 = `<script id="${표시}">
/* 퀴즈 카드를 키보드로도 고를 수 있게 합니다 (scripts/fix-card-keyboard.mjs).
   카드가 그냥 <div> 라서 Tab 으로 갈 수 있는 곳이 0개였습니다.
   보이는 모습은 그대로이고, 키보드와 화면 읽어주기에서만 달라집니다. */
(function () {
  function 손보기() {
    var 카드 = document.querySelectorAll('.quiz-card');
    for (var i = 0; i < 카드.length; i++) {
      var c = 카드[i];
      if (c.dataset.키보드) continue;
      c.dataset.키보드 = '1';
      if (!c.getAttribute('role')) c.setAttribute('role', 'button');
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
      /* 화면 읽어주기가 «무엇을 누르는 것인지» 말할 수 있게 이름을 줍니다 */
      if (!c.getAttribute('aria-label')) {
        var 제목 = c.querySelector('.card-title');
        if (제목 && 제목.innerText) c.setAttribute('aria-label', 제목.innerText.trim() + ' 퀴즈 시작');
      }
      c.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          this.click();
        }
      });
    }
  }
  손보기();
  /* 카드가 나중에 그려지는 경우까지 (화면이 다시 그려져도 유지됩니다) */
  if (window.MutationObserver) {
    new MutationObserver(손보기).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
</script>
`;

const ROOT = process.cwd();
const 대상 = [path.join(ROOT, 'app.html')];

let 넣음 = 0, 이미 = 0;
for (const p of 대상) {
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(표시)) { 이미++; continue; }
  const i = s.lastIndexOf('</body>');
  if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </body> 가 없어 건너뜁니다`); continue; }
  fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
  console.log(`  ✓ ${path.relative(ROOT, p)}`);
  넣음++;
}

if (!넣음 && !이미) { console.error('✗ 퀴즈 첫화면(app.html)을 찾지 못했습니다.'); process.exit(1); }
console.log(`\n${넣음}개에 넣음 · ${이미}개는 이미 되어 있었음`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
