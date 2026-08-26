/* 각 도구를 1080x1920 사이니지 화면 그대로 보여주기 위한 처리.
 *
 * 왜 필요한가:
 *   9개 앱은 모두 1080x1920 세로 사이니지 기준으로 만들어져 있고,
 *   내부에서 100vh / h-screen 같은 "화면 전체" 단위를 씁니다.
 *   창 크기가 다르면 그 단위가 창 크기를 따라가면서 레이아웃이 어긋납니다.
 *
 * 어떻게 해결하나:
 *   실제 앱을 index.html -> app.html 로 옮기고,
 *   새 index.html 이 app.html 을 정확히 1080x1920 짜리 프레임에 담아
 *   창 크기에 맞춰 같은 비율로 축소해 보여줍니다.
 *   프레임 안에서는 화면이 진짜 1080x1920 이므로 vh/vw 가 전부 제대로 계산됩니다.
 *
 * 사용법: node scripts/frame-apps.mjs   (툴킷 루트에서)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const W = 1080, H = 1920;
const LETTERBOX = '#E4EBF5';   // 남는 여백 색

const DIRS = ['.', 'timer', 'pomodoro', 'stopwatch', 'worldclock',
              'paint', 'noise', 'picker', 'instruments', 'ladder'];

// 창 제목. 앱 자체 제목이 영어 기본값인 경우가 있어 여기서 정해 줍니다.
const TITLES = {
  '.': '수업도우미', timer: '타이머', pomodoro: '뽀모도로 타이머', stopwatch: '스톱워치',
  worldclock: '세계시간', paint: '그림판(판서)', noise: '소음측정기',
  picker: '발표자 선정', instruments: '피아노 연주', ladder: '사다리 타기',
};

function framePage(title, appPath) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<link rel="icon" href="/favicon.ico">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#006CFF">
<style>
  html, body { margin:0; padding:0; height:100%; overflow:hidden; background:${LETTERBOX}; }
  #stage { position:absolute; top:0; left:0; width:${W}px; height:${H}px;
           transform-origin:top left; border:0; display:block; background:${LETTERBOX}; }
</style>
</head>
<body>
<iframe id="stage" src="${appPath}" title="${title}"
        allow="microphone; camera; autoplay; fullscreen; clipboard-write"></iframe>
<script>
  var APP = ${JSON.stringify(appPath.replace('./', ''))};
  var f = document.getElementById('stage');
  function fit() {
    var s = Math.min(window.innerWidth / ${W}, window.innerHeight / ${H});
    f.style.transform = 'scale(' + s + ')';
    f.style.left = ((window.innerWidth  - ${W} * s) / 2) + 'px';
    f.style.top  = ((window.innerHeight - ${H} * s) / 2) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  // 닫기 동작이 앱마다 제각각(허브로 이동 / window.close() / history.back())이라
  // 어떤 방식이든 전부 허브로 모아 줍니다.
  function goHub() {
    if (location.pathname !== '/' && location.pathname !== '/index.html') location.href = '/';
  }
  f.addEventListener('load', function () {
    try {
      var w = f.contentWindow;
      var u = w.location;
      // 앱이 프레임 안에서 다른 곳으로 갔다면 창 전체를 그리로 옮깁니다.
      if (!u.pathname.endsWith(APP)) { window.location.href = u.href; return; }
      w.close = goHub;                       // 창 닫기 시도 → 허브
      var back = w.history.back.bind(w.history);
      w.history.back = function () {         // 뒤로가기 시도 → 갈 곳 없으면 허브
        if (w.history.length > 1) back(); else goHub();
      };
    } catch (e) {}
  });
  window.addEventListener('message', function (e) {   // 닫기 신호를 보내는 앱도 있습니다
    var d = e.data;
    if (d === 'close' || (d && d.type === 'close')) goHub();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
    });
  }
</script>
</body>
</html>
`;
}

let done = 0;
for (const d of DIRS) {
  const dir = path.join(ROOT, d);
  const index = path.join(dir, 'index.html');
  const app = path.join(dir, 'app.html');
  if (!fs.existsSync(index)) { console.warn('건너뜀(없음):', d); continue; }

  // 이미 처리된 폴더는 app.html 을 원본으로 삼아 프레임만 다시 만듭니다.
  const html = fs.readFileSync(fs.existsSync(app) ? app : index, 'utf8');
  const title = TITLES[d] || (html.match(/<title>([^<]*)<\/title>/i) || [, '수업도우미'])[1].trim();
  fs.writeFileSync(app, html);
  fs.writeFileSync(index, framePage(title, './app.html'));
  console.log(`${(d === '.' ? '허브' : d).padEnd(12)} → app.html + 프레임  (${title})`);
  done++;
}
console.log(`\n${done}개 처리 완료`);
