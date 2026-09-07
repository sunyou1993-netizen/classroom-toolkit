/* 새 판을 깔았을 때 «한 번 더 열어야 새 화면이 나오는» 것을 없앱니다.
 *
 * 무엇이 문제였나 (test/x-swupdate.mjs 로 실제로 재현했습니다):
 *
 *   이 프로그램은 인터넷이 없어도 되도록 화면을 브라우저 안에 통째로
 *   저장해 둡니다(오프라인 캐시). 저장해 둔 것을 «먼저» 보여 주기 때문에
 *   새 판을 깔아도 첫 번째로 열 때는 옛 화면이 나옵니다.
 *
 *     A판을 쓰다가 B판을 깔고 →  1번째로 열면: 여전히 A판 화면 ✗
 *                              2번째로 열면: B판 화면 ✓
 *
 *   학교에서는 이렇게 됩니다.
 *     · 새 판을 보내고 «업데이트했습니다» 라고 알립니다
 *     · 선생님이 열어 보면 고쳐 달라고 한 것이 그대로입니다
 *     · «안 고쳐졌는데요?» 연락이 옵니다. 사실은 한 번 더 열면 됐습니다.
 *
 *   7차에서 고친 것(빌드 때 판 번호 다시 찍기)은 exe 쪽 이야기였고,
 *   이것은 브라우저 쪽에 남아 있던 같은 종류의 문제입니다.
 *
 * 어떻게 고쳤나:
 *   새 저장본이 «자리를 넘겨받는 순간»(controllerchange)에 화면을 한 번만
 *   새로 고칩니다. 그러면 첫 번째로 열었을 때 바로 새 화면이 나옵니다.
 *
 *   수업 중에 화면이 갑자기 새로고침되면 그리던 그림이 날아갑니다.
 *   그래서 «화면을 연 지 8초 안» 일 때만 새로고침합니다.
 *   업데이트 직후 처음 열 때는 반드시 그 안에 들어오고,
 *   수업이 한창일 때는 절대 걸리지 않습니다.
 *
 *   새로고침한 뒤에는 이미 새 저장본이 자리를 잡고 있어서
 *   controllerchange 가 다시 일어나지 않습니다. 그래서 되풀이되지 않습니다.
 *   그래도 만약을 위해 한 번 했으면 다시 안 하도록 표시를 남깁니다.
 *
 * 사용법: node scripts/fix-sw-update.mjs                    (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-sw-update.mjs     (퀴즈까지)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'sw-update-once';

const 넣을것 = `<script id="${표시}">
/* 새 판을 깔았을 때 첫 번째로 열어도 새 화면이 나오게 합니다 (scripts/fix-sw-update.mjs).
   오프라인 저장본이 자리를 넘겨받는 순간, 화면을 연 지 얼마 안 됐을 때만 한 번 새로고침합니다.
   (수업 중에 그리던 그림이 날아가지 않도록 8초 제한을 둡니다) */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var 했음 = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (했음) return;
    했음 = true;
    if (performance.now() > 8000) return;   // 수업 중이면 건드리지 않습니다
    location.reload();
  });
})();
</script>
`;

const 뿌리들 = [process.cwd()];
if (process.env.BASE) 뿌리들.push(process.env.BASE);

let 넣음 = 0, 이미 = 0, 건너뜀 = 0;
for (const ROOT of 뿌리들) {
  const 후보 = [];
  const 담기 = (d) => { 후보.push(path.join(d, 'index.html'), path.join(d, 'app.html')); };
  담기(ROOT);
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) if (e.isDirectory()) 담기(path.join(ROOT, e.name));

  for (const p of 후보) {
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    /* 오프라인 저장본을 등록하는 화면에만 넣습니다. 안 하는 화면에는 쓸모가 없습니다. */
    if (!s.includes('serviceWorker.register')) { 건너뜀++; continue; }
    if (s.includes(표시)) { 이미++; continue; }
    const i = s.lastIndexOf('</body>');
    if (i < 0) { console.log(`  · ${path.relative(ROOT, p)} — </body> 가 없어 건너뜁니다`); continue; }
    fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
    console.log(`  ✓ ${path.relative(ROOT, p)}`);
    넣음++;
  }
}
console.log(`\n${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음 · ${건너뜀}개는 오프라인 저장본을 안 써서 건너뜀`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
