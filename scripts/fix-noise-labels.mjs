/* 소음측정기: 마이크가 꺼져 있을 때 화면이 서로 다른 말을 하던 것을 맞춥니다.
 *
 * 무엇이 문제였나:
 *   마이크 권한이 없으면 화면에 예시 숫자가 나옵니다. 그건 이미 노란 띠로
 *   "마이크가 꺼져 있어 예시 숫자가 보이고 있어요" 하고 알려 주고 있었습니다.
 *   그런데 같은 화면에서
 *     · 아래 큰 버튼은  «측정 중»
 *     · 그래프 제목은   «실시간 음파»
 *   라고 말하고 있었습니다. 화면에서 제일 크고 눈에 띄는 두 곳이 반대로
 *   말하니, 선생님이 노란 띠를 못 보면 "지금 37dB 이니 조용하구나" 하고
 *   그대로 믿게 됩니다. 교실에서 아이들에게 보여 주는 숫자라 그러면 안 됩니다.
 *
 * 어떻게 고쳤나:
 *   글자만 바꿉니다. 기능·배치·색은 건드리지 않습니다.
 *     마이크 켜짐 → «측정 중»      «실시간 음파»
 *     마이크 꺼짐 → «예시 보는 중»  «예시 음파»
 *
 * 사용법: node scripts/fix-noise-labels.mjs      (수업도우미 폴더에서)
 *   여러 번 돌려도 같은 결과입니다.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 표시 = 'noise-sample-labels'; // 이미 고쳤는지 알아보는 표시

const 붙일코드 = `
/* ── 마이크가 꺼져 있을 때 글자 맞추기 (${표시}) ──────────────
   노란 띠는 "예시 숫자"라고 하는데 큰 버튼은 "측정 중"이라고 하면
   선생님이 예시 숫자를 실제 측정값으로 믿게 됩니다. 글자만 맞춥니다. */
function syncSampleLabels() {
  const 진짜 = (typeof isRealMic !== 'undefined' && isRealMic) &&
               (typeof isPlaying !== 'undefined' && isPlaying);

  // 아래 큰 버튼
  const btn = document.getElementById('toggle-btn');
  if (btn && btn.getAttribute('data-playing') === 'true') {
    const s = btn.querySelector('span');
    if (s) {
      const 새글 = 진짜 ? '측정 중' : '예시 보는 중';
      if (s.textContent !== 새글) s.textContent = 새글;
    }
  }
  // 그래프 제목
  const t = document.getElementById('wave-title');
  if (t) {
    const 새글 = 진짜 ? '실시간 음파' : '예시 음파';
    if (t.textContent !== 새글) t.textContent = 새글;
  }
}
`;

/* ── 1) app.js 에 함수 넣고, 상태가 바뀔 때마다 부르게 합니다 ── */
{
  const p = path.join(ROOT, 'noise', 'app.js');
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes(표시)) {
    console.log('  (app.js 는 이미 고쳐져 있습니다)');
  } else {
    // updateMicNotice 안에서 같이 부르게 합니다.
    const 자리 = s.indexOf("function updateMicNotice() {");
    if (자리 < 0) { console.error('✗ updateMicNotice 를 찾지 못했습니다'); process.exit(1); }
    s = s.slice(0, 자리) + 붙일코드 + '\n' + s.slice(자리);
    s = s.replace(
      "  const on = isRealMic && isPlaying;\n  el.style.display = on ? 'none' : 'flex';",
      "  const on = isRealMic && isPlaying;\n  el.style.display = on ? 'none' : 'flex';\n  syncSampleLabels();"
    );
    // 버튼을 새로 그린 직후에도 한 번 더 맞춥니다.
    // (버튼 innerHTML 을 통째로 바꾸면 위에서 고친 글자가 도로 '측정 중' 이 됩니다)
    const 개수 = (s.match(/if \(toggleRipple2\) toggleRipple2\.className = "absolute inset-x-0 inset-y-1 bg-\[#02b3c2\]\/25 animate-ripple-2 pointer-events-none";/g) || []).length;
    s = s.replace(
      'if (toggleRipple2) toggleRipple2.className = "absolute inset-x-0 inset-y-1 bg-[#02b3c2]/25 animate-ripple-2 pointer-events-none";',
      'if (toggleRipple2) toggleRipple2.className = "absolute inset-x-0 inset-y-1 bg-[#02b3c2]/25 animate-ripple-2 pointer-events-none";\n      syncSampleLabels();'
    );
    if (!s.includes('syncSampleLabels();')) { console.error('✗ 부르는 자리를 넣지 못했습니다'); process.exit(1); }
    fs.writeFileSync(p, s);
    console.log(`  ✓ noise/app.js — 함수 넣고 ${개수 ? '버튼 다시 그릴 때' : ''} 부르게 함`);
  }
}

/* ── 2) app.html: 그래프 제목에 id 를 달아 둡니다 ── */
{
  const p = path.join(ROOT, 'noise', 'app.html');
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('id="wave-title"')) {
    console.log('  (app.html 은 이미 고쳐져 있습니다)');
  } else {
    const 옛 = '<span style="font-size: 34px;" class="font-extrabold text-slate-800 tracking-tight leading-none">실시간 음파</span>';
    if (!s.includes(옛)) { console.error('✗ 그래프 제목을 찾지 못했습니다'); process.exit(1); }
    s = s.replace(옛, '<span id="wave-title" style="font-size: 34px;" class="font-extrabold text-slate-800 tracking-tight leading-none">실시간 음파</span>');
    fs.writeFileSync(p, s);
    console.log('  ✓ noise/app.html — 그래프 제목에 id 달음');
  }
}

console.log('\n이어서 node scripts/make-sw.mjs 를 실행해 주세요.');
