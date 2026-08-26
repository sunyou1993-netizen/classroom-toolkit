/* sw.js 재생성 — 툴킷 파일을 수정한 뒤 반드시 한 번 실행하세요.
   사용법:  node scripts/make-sw.mjs        (툴킷 루트에서) */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.cwd();
// 캐시에서 제외 — 앱 실행에 쓰이지 않거나 정적 호스팅이 서빙하지 않는 파일.
// 하나라도 404가 나면 cache.addAll 전체가 실패하므로 반드시 걸러야 합니다.
const SKIP_NAMES = new Set(['sw.js', 'README.md', 'LICENSE', '.gitattributes', '.gitignore', '.DS_Store']);
const SKIP_EXT = new Set(['.map', '.md']);
const SKIP_DIRS = new Set(['scripts', '.git', 'node_modules']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (!SKIP_NAMES.has(e.name) && !SKIP_EXT.has(path.extname(e.name))) {
      out.push(path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/'));
    }
  }
  return out;
}

const files = walk(ROOT).sort().map(f => './' + f);
const h = crypto.createHash('sha256');
for (const f of files) { h.update(f); h.update(fs.readFileSync(f.slice(2))); }
const version = 'suup-doumi-' + h.digest('hex').slice(0, 12);

const tpl = fs.readFileSync(path.join(ROOT, 'scripts/sw-template.js'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'sw.js'),
  tpl.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(files, null, 2)));

console.log(`sw.js 갱신 완료 — 파일 ${files.length}개, 버전 ${version}`);
