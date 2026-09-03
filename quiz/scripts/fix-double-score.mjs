/* 답을 고른 뒤에도 O/X 단추가 계속 눌리던 문제를 막습니다.
 *
 * 무엇이 문제였나:
 *   O 나 X 를 누르면 바로 채점이 되고 해설이 나옵니다. 그런데 **그 뒤에도
 *   O/X 단추가 그대로 살아 있어서**, 한 번 더 누르면 점수가 10점 더 오릅니다.
 *
 *   실제로 재 봤습니다. 1번 문제에서 정답 단추를 5번 누르고
 *   나머지 9문제는 한 번씩만 눌렀습니다.
 *
 *     환경     100점 이어야 하는데  →  140점 · "10문제 중 14문제 정답"
 *     안전     100점 이어야 하는데  →  140점 · "10문제 중 14문제 정답"
 *     학교폭력  100점 이어야 하는데  →  160점 · "10문제 중 16문제 정답"
 *
 *   문제 수보다 맞힌 개수가 많아지는, 있을 수 없는 결과가 화면에 나옵니다.
 *   게다가 만점 축하(🏆)는 «100점일 때» 만 뜨도록 되어 있어서,
 *   점수가 넘치면 오히려 은메달(🥈)이 나옵니다. 다 맞힌 아이가 손해를 봅니다.
 *
 * 언제 일어나나:
 *   아이들은 신나면 연타합니다. 특히 학교폭력 퀴즈는 마지막에 결과가
 *   4.2초 걸리는데, 그동안 화면이 그대로라 «안 눌렸나?» 하고 또 누릅니다.
 *   교실에서 아주 쉽게 일어납니다.
 *
 * 어떻게 고쳤나:
 *   한 문제에 한 번만 답할 수 있게 잠급니다.
 *   · O 나 X 를 누르면 → 그 문제에서는 더 이상 O/X 가 안 눌립니다
 *   · «다음 문제» 를 누르면 → 다시 풀립니다
 *   · «다시 풀어보기» 를 누르면 → 다시 풀립니다
 *
 *   원래 코드는 건드리지 않고, 누르는 것을 앞에서 가로채는 방식입니다.
 *   답을 누르면 곧바로 해설이 나오므로, 답을 바꿀 이유도 원래 없습니다.
 *
 * 사용법: node scripts/fix-double-score.mjs      (퀴즈 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'answer-once';

const 넣을것 = `<script id="${표시}">
/* 한 문제에 한 번만 답하게 합니다 (scripts/fix-double-score.mjs).
   답한 뒤에도 O/X 가 눌려서, 누를 때마다 10점씩 더 오르던 문제를 막습니다.
   («10문제 중 14문제 정답» 같은 결과가 나왔습니다)
   원래 코드는 그대로 두고, 누르는 것을 앞에서 가로채기만 합니다. */
(function () {
  /* «단추를 눌렀나» 가 아니라 «지금 이 문제에 답했나» 로 잠급니다.
     «다음 문제» 를 눌렀는지로 풀면, 마지막 문제의 «결과 보기» 에서도 풀려 버립니다.
     (학교폭력 퀴즈는 결과가 4.2초 걸려서, 그 사이에 또 눌리면 점수가 오릅니다) */
  var 답한문제 = null;

  function 지금문제() {
    var t = (document.body && document.body.innerText || '').replace(/\\s+/g, ' ');
    var 번호 = t.match(/문제\\s*(\\d+)\\s*\\/\\s*(\\d+)/);
    var 문장 = t.match(/"([^"]{6,})"/);
    return (번호 ? 번호[0] : '?') + '|' + (문장 ? 문장[1].slice(0, 40) : '?');
  }

  window.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    var id = b.id || '';

    /* 처음부터 다시 풀면 잠금을 완전히 풉니다 */
    if (/다시|처음|목록/.test(b.innerText || '')) { 답한문제 = null; return; }

    if (id !== 'btn-choice-o' && id !== 'btn-choice-x') return;

    var 이번 = 지금문제();
    if (답한문제 === 이번) {          /* 이미 답한 그 문제 — 두 번째부터는 막습니다 */
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    답한문제 = 이번;                  /* 첫 답은 그대로 통과시킵니다 */
  }, true);                           /* true = 원래 처리기보다 먼저 받습니다 */
})();
</script>
`;

const ROOT = process.cwd();
const 후보 = [path.join(ROOT, 'app.html')];
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (e.isDirectory()) 후보.push(path.join(ROOT, e.name, 'app.html'));
}

let 넣음 = 0, 이미 = 0, 해당없음 = 0;
for (const p of 후보) {
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(표시)) { 이미++; continue; }

  /* O/X 퀴즈인 화면에만 넣습니다 (속담·사자성어는 O/X 가 아닙니다) */
  const 폴더 = path.dirname(p);
  const 자산 = path.join(폴더, 'assets');
  let OX퀴즈인가 = false;
  if (fs.existsSync(자산)) {
    for (const f of fs.readdirSync(자산).filter((n) => n.endsWith('.js'))) {
      if (fs.readFileSync(path.join(자산, f), 'utf8').includes('btn-choice-o')) { OX퀴즈인가 = true; break; }
    }
  }
  if (!OX퀴즈인가) { 해당없음++; continue; }

  const i = s.lastIndexOf('</body>');
  if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </body> 가 없어 건너뜁니다`); continue; }
  fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
  console.log(`  ✓ ${path.relative(ROOT, p)}`);
  넣음++;
}

if (!넣음 && !이미) { console.error('✗ O/X 퀴즈 화면을 찾지 못했습니다.'); process.exit(1); }
console.log(`\n${넣음}개에 넣음 · ${이미}개는 이미 되어 있었음 · ${해당없음}개는 O/X 퀴즈가 아님`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
