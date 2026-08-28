/* 사이트를 "어느 폴더에 두어도" 동작하게 만듭니다.
 *
 * 왜 필요한가:
 *   지금까지는 주소의 맨 위(예: https://example.com/)에 두어야만 동작했습니다.
 *   /fonts/... , /shared/... , /manifest.webmanifest 처럼 "맨 위 기준" 주소를
 *   쓰고 있었기 때문입니다. AI보드가 이미 쓰고 있는
 *   https://tekern.github.io/claix-tools/ 처럼 폴더 안에 들어가면 전부 어긋납니다.
 *
 * 무엇을 하나:
 *   맨 위 기준 주소를 "지금 문서 기준" 주소로 바꿉니다.
 *   - 허브(맨 위 폴더)  : /fonts/... -> ./fonts/...
 *   - 도구 폴더(한 단계): /fonts/... -> ../fonts/...
 *   - CSS 안(assets/)   : css 파일 기준이라 한 단계 더 위로
 *   - JS 안(assets/)    : 상대주소는 "그 JS 파일"이 아니라 "불러온 문서" 기준이라
 *                         도구 폴더 기준으로 계산합니다.
 *
 * 여러 번 실행해도 안전합니다(이미 바뀐 것은 건드리지 않습니다).
 * 사용법: node scripts/relativize.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TOOLS = ['timer', 'pomodoro', 'stopwatch', 'worldclock', 'paint',
               'noise', 'picker', 'instruments', 'ladder'];

// 맨 위에 실제로 있는 것들만 바꿉니다(다른 "/..." 문자열은 손대지 않습니다)
const TOP = ['fonts/', 'shared/', 'assets/', 'manifest.webmanifest', 'favicon.ico', 'sw.js'];

let 바뀐파일 = 0, 바뀐곳 = 0;

function 고치기(file, up) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;

  for (const t of TOP) {
    // "…="/fonts/…"  ·  url(/fonts/…)  ·  "/shared/…"  등 따옴표·괄호 바로 뒤의 것만
    const re = new RegExp('([("\'`])/(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'g');
    s = s.replace(re, (m, q, rest) => { 바뀐곳++; return q + up + rest; });
  }
  // 닫기 동작: 맨 위로 가던 것을 "이 사이트의 맨 위"로
  s = s.split('location.href="/"').join(`location.href="${up || './'}"`);
  s = s.split("location.href='/'").join(`location.href='${up || './'}'`);

  if (s !== before) { fs.writeFileSync(file, s); 바뀐파일++; console.log('  ' + path.relative(ROOT, file)); }
}

function 폴더처리(dir, upForDoc) {
  // 문서(html)와 그 옆 파일들
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    if (!/\.(html|js|css|webmanifest)$/i.test(e.name)) continue;
    고치기(path.join(dir, e.name), upForDoc);
  }
  // assets/ 안
  const a = path.join(dir, 'assets');
  if (!fs.existsSync(a)) return;
  for (const n of fs.readdirSync(a)) {
    const f = path.join(a, n);
    if (/\.css$/i.test(n)) 고치기(f, upForDoc + '../');   // css 는 css 파일 기준
    else if (/\.js$/i.test(n)) 고치기(f, upForDoc);        // js 는 문서 기준
  }
}

console.log('■ 허브(맨 위 폴더)');
폴더처리(ROOT, './');
for (const t of TOOLS) {
  const d = path.join(ROOT, t);
  if (!fs.existsSync(d)) { console.warn('  없음:', t); continue; }
  console.log('■ ' + t);
  폴더처리(d, '../');
}
console.log(`\n파일 ${바뀐파일}개 · 주소 ${바뀐곳}군데를 "폴더 어디에 두어도 되는" 형태로 바꿨습니다`);
