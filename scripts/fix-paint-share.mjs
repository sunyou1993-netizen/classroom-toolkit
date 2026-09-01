/* 그림판 '공유' 창에서 교실 보드에서 쓸 수 없는 두 가지를 감춥니다.
 *
 * 무엇이 문제였나 — 공유 창에 세 가지가 있습니다.
 *
 *   ① 이미지 파일(PNG)로 다운로드   → 잘 됩니다. 그대로 둡니다.
 *
 *   ② 스튜디오 링크 공유 복사        → 눌러 보면 클립보드에 이것이 들어갑니다.
 *        http://127.0.0.1:43110/paint/app.html
 *      127.0.0.1 은 '이 기기 자신'이라는 뜻입니다. 다른 사람에게 보내면
 *      그 사람 기기의 자기 자신을 가리켜 아무것도 열리지 않습니다.
 *      ('스튜디오'라는 말도 개발 도구(AI Studio) 시절에 남은 이름입니다.)
 *
 *   ③ 기기 연동 간편 QR 코드         → 눌러 보면 QR 처럼 생긴 그림이 나오고
 *      "카메라로 QR을 비춰 연결하세요" 라고 적혀 있습니다.
 *      그런데 그건 QR 코드가 아니라 **점무늬 그림**입니다.
 *      코드에 이렇게 되어 있습니다:
 *        bg-[radial-gradient(#000_18%,transparent_18%)] + 검은 네모 3개 + 파란 원
 *      진짜 QR 을 만드는 코드가 없습니다. 휴대폰을 비춰도 아무 일도 안 생깁니다.
 *      선생님이 아이들 앞에서 시도하면 안 되는 화면입니다.
 *
 * 어떻게 고쳤나:
 *   개발사가 만든 번들(assets/*.js)은 건드리지 않습니다.
 *   app.html 에 작은 스크립트를 붙여, 공유 창이 열릴 때 ②·③ 단추만 감춥니다.
 *   ① 다운로드는 그대로 남아, 선생님이 판서를 PNG 로 저장할 수 있습니다.
 *   (저장 파일 이름은 원래 코드가 «판서_보드_내보내기_….png» 로 잘 지어 줍니다.)
 *
 * 사용법: node scripts/fix-paint-share.mjs      (수업도우미 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 표시 = 'paint-share-trim';

const 스크립트 = `<script id="${표시}">
/* 공유 창에서 교실 보드에서 못 쓰는 단추를 감춥니다. (scripts/fix-paint-share.mjs)
   · "스튜디오 링크 공유 복사" — 127.0.0.1 주소라 남에게 보내도 안 열립니다
   · "기기 연동 간편 QR 코드"  — 진짜 QR 이 아니라 점무늬 그림입니다
   PNG 다운로드는 그대로 둡니다. */
(function () {
  var 감출말 = ['스튜디오 링크', '링크 주소 복사', 'QR 코드'];
  function 정리() {
    var bs = document.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (b.dataset.hiddenByToolkit) continue;
      var t = (b.textContent || '').trim();
      for (var j = 0; j < 감출말.length; j++) {
        if (t.indexOf(감출말[j]) >= 0) {
          b.dataset.hiddenByToolkit = '1';
          b.style.display = 'none';
          break;
        }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', 정리);
  else 정리();
  new MutationObserver(정리).observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
`;

const p = path.join(ROOT, 'paint', 'app.html');
if (!fs.existsSync(p)) { console.error('✗ paint/app.html 이 없습니다'); process.exit(1); }
let s = fs.readFileSync(p, 'utf8');

if (s.includes(표시)) {
  console.log('  (이미 고쳐져 있습니다)');
} else {
  const i = s.lastIndexOf('</body>');
  if (i < 0) { console.error('✗ </body> 를 찾지 못했습니다'); process.exit(1); }
  s = s.slice(0, i) + 스크립트 + s.slice(i);
  fs.writeFileSync(p, s);
  console.log('  ✓ paint/app.html 에 감추기 스크립트를 붙였습니다');
}

console.log('\n남는 것: «이미지 파일(PNG)로 다운로드» 하나 (이건 잘 됩니다)');
console.log('이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
