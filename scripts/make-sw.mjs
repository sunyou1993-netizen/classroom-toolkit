/* sw.js 재생성 — 툴킷 파일을 수정한 뒤 반드시 한 번 실행하세요.
   사용법:  node scripts/make-sw.mjs        (툴킷 루트에서) */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = process.cwd();
// 캐시에서 제외 — 앱 실행에 쓰이지 않거나 정적 호스팅이 서빙하지 않는 파일.
// 하나라도 404가 나면 cache.addAll 전체가 실패하므로 반드시 걸러야 합니다.
const SKIP_NAMES = new Set(['sw.js', 'README.md', 'LICENSE', '.gitattributes', '.gitignore', '.DS_Store']);
const SKIP_EXT = new Set(['.map', '.md', '.exe', '.command']);
// test/ 는 검사 도구입니다. 학교 보드에 나갈 이유가 없고, 미리 받아 두면
// 캐시만 불어납니다. (안 걸렀더니 파일이 150개 → 170개가 됐습니다)
//
// quiz/ 를 빼는 이유:
//   퀴즈는 자기만의 sw.js 를 따로 갖고 있고, 퀴즈 화면은 그쪽이 맡습니다.
//   여기서도 담으면 같은 파일을 보드에 두 벌씩 저장하게 됩니다(600개가 넘습니다).
//   지금 만들어져 있는 sw.js 에도 퀴즈는 안 들어 있습니다. 이 줄은 그 상태를
//   지키기 위한 것입니다 — 안 넣어 두면 다음에 이 스크립트를 돌리는 사람이
//   저도 모르게 캐시를 두 배로 만들게 됩니다.
const SKIP_DIRS = new Set(['scripts', 'launcher', 'download', 'test', 'quiz', '.git', 'node_modules']);

// «화면에 쓰이는 것만» 통과시킵니다 (막을 것을 이름으로 적는 방식이 아닙니다).
//
// 왜 바꿨나 — 8차 검수에서 실제로 이렇게 되어 있었습니다:
//   퀴즈의 오프라인 목록에 검수 문서 다섯 개가 들어가 있었습니다.
//     간단교육_퀴즈_문항집.xlsx (93KB) · 문항집.html (425KB, 정답이 다 들어 있습니다)
//     문항근거.html · 문항출처검토보고.docx · 문항출처검토보고.pdf
//   웹으로 올려 쓰면 보드마다 이것들을 받아 두게 됩니다. 정답표까지요.
//   게다가 이 중 **하나라도 없으면 오프라인 저장이 통째로 실패합니다**
//   (cache.addAll 은 하나만 404 나도 전부 취소됩니다).
//   실행 파일에는 이 문서들이 안 들어가므로, 실제로 그 상태였습니다.
//
// 그래서 build.sh 와 같은 방식으로 바꿉니다 — 아는 종류만 통과.
const KNOWN_EXT = new Set([
  '.html', '.js', '.css', '.svg', '.png', '.webp', '.jpg', '.jpeg', '.gif',
  '.woff2', '.woff', '.ico', '.webmanifest', '.txt', '.json', '.mp3', '.wav', '.m4a',
]);

// html 중에서 «화면» 은 index.html 과 app.html 뿐입니다.
// 그 밖의 html 은 사람이 읽는 문서입니다(문항집.html 처럼).
function 화면파일인가(이름) {
  const 확장 = path.extname(이름).toLowerCase();
  if (!KNOWN_EXT.has(확장)) return false;
  if (확장 === '.html' && 이름 !== 'index.html' && 이름 !== 'app.html') return false;
  return true;
}

// 폴더를 심볼릭 링크로 걸어 둔 작업 환경도 있습니다.
// 그때 e.isDirectory() 는 false 라서, 폴더를 파일인 줄 알고 읽다가 멈춥니다.
function 폴더인가(dir, e) {
  if (e.isDirectory()) return true;
  if (!e.isSymbolicLink()) return false;
  try { return fs.statSync(path.join(dir, e.name)).isDirectory(); } catch { return false; }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (폴더인가(dir, e)) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), out);
    } else if (!SKIP_NAMES.has(e.name) && !SKIP_EXT.has(path.extname(e.name)) && 화면파일인가(e.name)) {
      out.push(path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/'));
    }
  }
  return out;
}

const files = walk(ROOT).sort().map(f => './' + f);
const h = crypto.createHash('sha256');
h.update(fs.readFileSync(path.join(ROOT, 'scripts/sw-template.js')));   // 캐시 코드가 바뀌어도 버전이 올라가도록
for (const f of files) { h.update(f); h.update(fs.readFileSync(f.slice(2))); }
const NAME = process.env.SW_NAME || 'suup-doumi';
const version = NAME + '-' + h.digest('hex').slice(0, 12);

const tpl = fs.readFileSync(path.join(ROOT, 'scripts/sw-template.js'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'sw.js'),
  tpl.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(files, null, 2)));

console.log(`sw.js 갱신 완료 — 파일 ${files.length}개, 버전 ${version}`);
