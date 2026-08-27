/* 툴킷을 "사이트 최상위가 아닌 하위 경로"에 올릴 수 있게 바꿔 만듭니다.
 *
 * 왜 필요한가:
 *   툴킷 안에서 글꼴·국기·아이콘을 /fonts/… , /shared/… 처럼
 *   "사이트 최상위" 기준으로 부릅니다. 그래서 그대로 올리면
 *   github.io/claix-tools/ 같은 하위 주소에서는 전부 404 입니다.
 *
 * 어떻게 하나:
 *   최상위 기준 주소 앞에 하위 경로를 붙인 사본을 새로 만듭니다.
 *   원본은 그대로 두므로 exe·웹 배포에는 영향이 없습니다.
 *
 * 사용법:  node scripts/subpath.mjs /claix-tools [내보낼폴더]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RAW = process.argv[2] || '/claix-tools';
const BASE = '/' + RAW.replace(/^\/+|\/+$/g, '');           // → "/claix-tools"
const OUT = path.resolve(process.argv[3] || path.join(ROOT, '..', '_' + BASE.slice(1)));

// 앞에 하위 경로를 붙여야 하는 최상위 기준 주소들.
// 이 목록에 없는 "/" 는 절대 건드리지 않습니다.
const PREFIXES = [
  '/fonts/', '/shared/', '/assets/', '/css/',
  '/timer/', '/pomodoro/', '/stopwatch/', '/worldclock/',
  '/paint/', '/noise/', '/picker/', '/instruments/', '/ladder/',
  '/sw.js', '/favicon.ico', '/manifest.webmanifest',
];

const SKIP_DIRS = new Set(['scripts', 'launcher', 'download', 'node_modules', '.git']);
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg']);

let files = 0, hits = 0;

function rewrite(s) {
  for (const p of PREFIXES) {
    // 따옴표·괄호 바로 뒤에 오는 경우만 바꿉니다(주소로 쓰인 자리).
    const re = new RegExp(`(["'\`(=]|\\bfrom )${p.replace(/[.]/g, '\\.')}`, 'g');
    s = s.replace(re, (m, lead) => { hits++; return lead + BASE + p; });
  }
  // 허브로 돌아가는 이동:  "/"  →  "/claix-tools/"
  s = s.replace(/(location\.href\s*=\s*)(["'])\/\2/g, (m, a, q) => { hits++; return `${a}${q}${BASE}/${q}`; });
  s = s.replace(/(location\.pathname\s*!==\s*)(["'])\/\2/g, (m, a, q) => `${a}${q}${BASE}/${q}`);
  s = s.replace(/(location\.pathname\s*!==\s*)(["'])\/index\.html\2/g, (m, a, q) => `${a}${q}${BASE}/index.html${q}`);
  // 서비스워커 범위
  s = s.replace(/scope:\s*(["'])\/\1/g, (m, q) => `scope: ${q}${BASE}/${q}`);
  return s;
}

function walk(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(from, e.name), path.join(to, e.name));
      continue;
    }
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (TEXT.has(path.extname(e.name).toLowerCase())) {
      fs.writeFileSync(dst, rewrite(fs.readFileSync(src, 'utf8')));
    } else {
      fs.copyFileSync(src, dst);
    }
    files++;
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
walk(ROOT, OUT);

// GitHub Pages 가 폴더 이름을 제멋대로 건드리지 않도록.
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`기준 경로 : ${BASE}`);
console.log(`내보낸 곳 : ${OUT}`);
console.log(`파일 ${files}개, 주소 ${hits}군데 수정`);
