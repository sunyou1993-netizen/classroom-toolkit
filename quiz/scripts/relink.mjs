/* 퀴즈들이 서로를 부르던 "바깥 주소"를 같은 사이트 안의 폴더 경로로 바꿉니다.
 *
 * 왜 필요한가:
 *   퀴즈 7개가 각각 다른 주소에 배포되어 있었고, 목록은 그 주소들을 직접 불렀습니다.
 *   배포본이 두 벌 생기면 "목록에서 누른 퀴즈"와 "내가 고친 퀴즈"가 달라집니다.
 *   한 사이트 안의 폴더로 합치고 경로로만 이동하면 그 일이 구조적으로 없어집니다.
 *
 * 사용법: node scripts/relink.mjs   (퀴즈 폴더 루트에서)
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// 바깥 주소 → 폴더 이름. 긴 것부터 바꿔야 violence-tk3m 이 violence 로 잘리지 않습니다.
const MAP = [
  ['claix-quiz-song-9e5x', 'song'],
  ['claix-quiz-song-v79u', 'song'],
  ['claix-quiz-proverb-hob5', 'proverb'],
  ['claix-quiz-proverb-xz8i', 'proverb'],
  ['claix-quiz-proverb-6gzv', 'fourchar'],   // 이름은 proverb 지만 내용은 사자성어입니다
  ['claix-quiz-fourcharcter', 'fourchar'],
  ['claix-quiz-environment-dec3', 'environment'],
  ['claix-quiz-environment-kpad', 'environment'],
  ['claix-quiz-safe-75ef', 'safe'],
  ['claix-quiz-safe-2x5s', 'safe'],
  ['claix-quiz-violence-tk3m', 'violence'],
  ['claix-quiz-violence', 'violence'],
  ['claix-quiz-list6-bp67', ''],             // 목록
].sort((a, b) => b[0].length - a[0].length);

const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest']);
const SKIP = new Set(['scripts', 'node_modules', '.git']);

const rel = (depth, folder) => {
  const up = depth ? '../'.repeat(depth) : './';
  return folder ? up + folder + '/' : up;
};

let files = 0, hits = 0;

function walk(dir, depth) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(path.join(dir, e.name), depth + 1);
      continue;
    }
    if (!TEXT.has(path.extname(e.name).toLowerCase())) continue;
    const p = path.join(dir, e.name);
    // JS 안의 상대주소는 "그 JS 파일" 이 아니라 "그것을 불러온 문서" 기준으로 풀립니다.
    // 번들은 항상 <폴더>/assets/ 에 있고 문서는 <폴더>/app.html 이므로 한 단계 위로 봅니다.
    const d = (path.extname(e.name).toLowerCase() === '.js' && path.basename(dir) === 'assets')
      ? Math.max(0, depth - 1) : depth;
    let s = fs.readFileSync(p, 'utf8');
    const before = s;

    // 바깥 주소용 preconnect / prefetch 태그는 통째로 제거
    s = s.replace(/\s*<link[^>]*rel="(?:preconnect|dns-prefetch|prefetch)"[^>]*claix-quiz[^>]*>/g, '');

    for (const [host, folder] of MAP) {
      for (const scheme of [`https://${host}.vercel.app`, `http://${host}.vercel.app`]) {
        if (s.includes(scheme)) {
          s = s.split(scheme + '/').join(rel(d, folder));
          s = s.split(scheme).join(rel(d, folder));
          hits++;
        }
      }
    }
    if (s !== before) {
      fs.writeFileSync(p, s);
      files++;
      console.log('  ' + path.relative(ROOT, p));
    }
  }
}

walk(ROOT, 0);
console.log(`\n파일 ${files}개, 주소 ${hits}군데 수정`);

// 남은 바깥 주소 확인
const left = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) scan(path.join(dir, e.name)); continue; }
    if (!TEXT.has(path.extname(e.name).toLowerCase())) continue;
    const s = fs.readFileSync(path.join(dir, e.name), 'utf8');
    for (const m of new Set(s.match(/https?:\/\/[a-z0-9.\-]*claix-quiz[a-z0-9.\-]*/g) || [])) {
      left.push(path.relative(ROOT, path.join(dir, e.name)) + ' → ' + m);
    }
  }
})(ROOT);
console.log('남은 바깥 주소:', left.length ? left : '없음');

/* ── 2단계: 최상위 기준(/image1.png) 자산 경로를 폴더 기준으로 ──────────
 * 퀴즈들이 이미지를 "/그림.png" 처럼 사이트 최상위 기준으로 부릅니다.
 * 폴더 안으로 들어오면 그 경로가 어긋나므로, 같은 폴더에 실제로 그 파일이
 * 있는 경우에만 "./그림.png" 로 바꿔 줍니다.
 */
const ASSET = /\.(png|jpe?g|svg|gif|webp|mp3|wav|woff2?)$/i;

function fixAssets(dir) {
  const own = new Set(fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && ASSET.test(e.name)).map(e => e.name));
  // assets/ 안의 파일도 같은 폴더 기준입니다
  const sub = path.join(dir, 'assets');
  const ownSub = fs.existsSync(sub)
    ? new Set(fs.readdirSync(sub).filter(n => ASSET.test(n))) : new Set();

  let changed = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!['.html', '.js', '.css'].includes(ext)) continue;
    const p = path.join(dir, e.name);
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    s = s.replace(/(["'`(])\/([^"'`)\/]+\.(?:png|jpe?g|svg|gif|webp|mp3|wav))/gi,
      (m, q, file) => own.has(decodeURIComponent(file)) ? q + './' + file : m);
    s = s.replace(/(["'`(])\/assets\/([^"'`)\/]+)/gi,
      (m, q, file) => ownSub.has(decodeURIComponent(file)) ? q + './assets/' + file : m);
    if (s !== before) { fs.writeFileSync(p, s); changed++; }
  }
  // assets/ 안의 js·css 도 같은 규칙 (문서 기준이라 ../ 가 아니라 ./ 입니다)
  if (fs.existsSync(sub)) {
    for (const n of fs.readdirSync(sub)) {
      if (!/\.(js|css)$/i.test(n)) continue;
      const p = path.join(sub, n);
      let s = fs.readFileSync(p, 'utf8');
      const before = s;
      if (n.endsWith('.js')) {
        // JS 안의 상대경로는 문서(app.html) 기준으로 풀립니다
        s = s.replace(/(["'`(])\/([^"'`)\/]+\.(?:png|jpe?g|svg|gif|webp|mp3|wav))/gi,
          (m, q, file) => own.has(decodeURIComponent(file)) ? q + './' + file : m);
      } else {
        // CSS 안의 url() 은 css 파일 기준이라 한 단계 위로
        s = s.replace(/(url\(["']?)\/([^"')\/]+\.(?:png|jpe?g|svg|gif|webp|woff2?))/gi,
          (m, q, file) => own.has(decodeURIComponent(file)) ? q + '../' + file : m);
      }
      if (s !== before) { fs.writeFileSync(p, s); changed++; }
    }
  }
  return changed;
}

console.log('\n■ 자산 경로 폴더 기준으로');
let a = 0;
for (const d of ['.', 'song', 'proverb', 'fourchar', 'environment', 'safe', 'violence']) {
  const n = fixAssets(path.join(ROOT, d));
  if (n) console.log(`  ${d.padEnd(12)} 파일 ${n}개`);
  a += n;
}
console.log(a ? `총 ${a}개 파일 수정` : '  바꿀 것 없음');
