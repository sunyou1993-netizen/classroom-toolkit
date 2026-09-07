/* 화면 파일 하나를 못 읽었을 때, 하얀 화면 대신 «무슨 일인지» 를 보여 줍니다.
 *
 * 무엇이 문제였나 (test/x-ops5.mjs 로 재현했습니다):
 *
 *   화면을 그리는 파일(js) 하나를 못 읽게 하고 타이머를 열어 봤습니다.
 *     · 글자 0자, 단추 0개 — **완전히 하얀 화면**
 *     · 아무 설명도 없음
 *
 *   학교에서 이런 일은 «USB 로 폴더째 옮기다 하나가 안 따라온» 경우에 생깁니다.
 *   선생님은 하얀 화면만 보고 «고장났어요» 라고 하실 수밖에 없습니다.
 *   어느 파일이 문제인지는 개발자 도구를 열어야만 알 수 있습니다.
 *
 *   (실행 파일로 쓰면 화면이 exe 안에 다 들어 있어서 이 일은 거의 안 납니다.
 *    폴더째 복사해서 쓰거나 웹으로 올려 쓸 때를 위한 대비입니다.)
 *
 * 어떻게 고쳤나:
 *   화면을 그리는 파일을 못 읽으면 브라우저가 그 사실을 알려 줍니다(error 이벤트).
 *   그 순간에만 짧은 안내를 띄웁니다. 잘 열릴 때는 아무 일도 하지 않습니다.
 *   느린 보드에서 잘못 뜨는 일이 없도록, «시간이 지났는데 비어 있으면» 같은
 *   짐작이 아니라 «파일을 못 읽었다» 는 분명한 신호일 때만 띄웁니다.
 *
 * 사용법: node scripts/fix-blank-guard.mjs                    (수업도우미 폴더에서)
 *         BASE=/경로/quiz node scripts/fix-blank-guard.mjs     (퀴즈까지)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const 표시 = 'blank-guard';

const 넣을것 = `<script id="${표시}">
/* 화면 파일을 못 읽었을 때만 안내를 띄웁니다 (scripts/fix-blank-guard.mjs).
   그냥 두면 하얀 화면만 남아서, 선생님이 원인을 알 방법이 없습니다. */
(function () {
  var 띄웠음 = false;
  window.addEventListener('error', function (e) {
    var el = e && e.target;
    if (!el || !el.tagName) return;                 /* 자바스크립트 오류는 여기서 다루지 않습니다 */
    if (el.tagName.toLowerCase() !== 'script') return;  /* 그림·글꼴이 빠진 것으로는 안 띄웁니다 */
    if (띄웠음) return;
    띄웠음 = true;
    var 파일 = '';
    try { 파일 = (el.src || '').split('/').pop(); } catch (err) {}
    var 상자 = document.createElement('div');
    상자.setAttribute('role', 'alert');
    상자.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;' +
      'align-items:center;justify-content:center;background:#fff;color:#1F2937;' +
      'font-family:Pretendard,system-ui,-apple-system,sans-serif;padding:6vmin;text-align:center;';
    상자.innerHTML =
      '<div style="max-width:34em">' +
      '<div style="font-size:6vmin;margin-bottom:.6em">화면을 불러오지 못했습니다</div>' +
      '<div style="font-size:3.4vmin;line-height:1.8;color:#4B5563">' +
      '프로그램을 껐다가 다시 켜 주세요.<br>' +
      '그래도 같으면 수업도우미 폴더를 다시 복사해 주세요.' +
      '</div>' +
      (파일 ? '<div style="margin-top:1.6em;font-size:2.6vmin;color:#9CA3AF">못 읽은 파일: ' +
        파일.replace(/[<>&]/g, '') + '</div>' : '') +
      '</div>';
    if (document.body) document.body.appendChild(상자);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(상자); });
  }, true);
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
    /* 화면을 그리는 파일을 부르는 곳에만 넣습니다 */
    if (!/<script[^>]+src=/.test(s)) { 건너뜀++; continue; }
    if (s.includes(표시)) { 이미++; continue; }
    /* 안내를 «먼저» 달아 두어야, 그 뒤에 실패하는 파일을 잡을 수 있습니다 */
    const i = s.search(/<script[^>]+src=/);
    if (i < 0) { 건너뜀++; continue; }
    fs.writeFileSync(p, s.slice(0, i) + 넣을것 + s.slice(i));
    console.log(`  ✓ ${path.relative(ROOT, p)}`);
    넣음++;
  }
}
console.log(`\n${넣음}개 화면에 넣음 · ${이미}개는 이미 되어 있었음 · ${건너뜀}개는 부르는 파일이 없어 건너뜀`);
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
