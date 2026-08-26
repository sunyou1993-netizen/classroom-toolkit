#!/usr/bin/env node
/*
 * 수업도우미 툴킷 — 전체 다시 만들기
 *
 * AI Studio 에서 앱을 고친 뒤 이 스크립트를 한 번 돌리면
 *   ① GitHub 원본 저장소 10개를 최신으로 내려받고
 *   ② 오프라인 패치(scripts/patches/*.patch)를 자동으로 입히고
 *   ③ 각각 빌드해서
 *   ④ 이 폴더(툴킷)에 그대로 갈아끼운 뒤
 *   ⑤ 서비스워커(sw.js)까지 새로 만듭니다.
 *
 * 실행:  node scripts/build-all.mjs
 * 필요:  git, node 18+, 인터넷 연결
 *
 * 패치가 안 맞으면(=AI Studio 가 그 줄을 건드린 경우) 그 앱만 빨간 글씨로
 * 알려주고 나머지는 계속 진행합니다. 그럴 땐 그 앱만 손보면 됩니다.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');            // 툴킷 폴더
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'apps.json'), 'utf8'));
const WORK = process.env.TOOLKIT_WORKDIR || path.join(os.tmpdir(), 'suup-doumi-build');

const RED = s => `\x1b[31m${s}\x1b[0m`;
const GRN = s => `\x1b[32m${s}\x1b[0m`;
const DIM = s => `\x1b[2m${s}\x1b[0m`;

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function fetchRepo(repo) {
  const dir = path.join(WORK, repo);
  const url = `https://github.com/${CFG.owner}/${repo}.git`;
  if (fs.existsSync(path.join(dir, '.git'))) {
    run('git', ['fetch', '--depth', '1', 'origin'], dir);
    const head = run('git', ['rev-parse', 'origin/HEAD'], dir).trim().length
      ? 'origin/HEAD' : 'origin/main';
    run('git', ['reset', '--hard', head], dir);
    run('git', ['clean', '-fdx', '-e', 'node_modules'], dir);
  } else {
    fs.mkdirSync(WORK, { recursive: true });
    run('git', ['clone', '--depth', '1', url, dir], WORK);
  }
  return dir;
}

function applyPatch(dir, repo) {
  const p = path.join(HERE, 'patches', `${repo}.patch`);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) return;
  try {
    run('git', ['apply', '--whitespace=nowarn', p], dir);
  } catch (e) {
    // 3-way 로 한 번 더 (윗줄 아랫줄이 조금 바뀐 경우까지는 붙습니다)
    run('git', ['apply', '--3way', '--whitespace=nowarn', p], dir);
  }
}

function applyAssets(dir, app) {
  for (const [from, to] of app.copies || []) {
    fs.mkdirSync(path.join(dir, path.dirname(to)), { recursive: true });
    fs.copyFileSync(path.join(dir, from), path.join(dir, to));
  }
  for (const [from, to] of app.moves || []) {
    fs.mkdirSync(path.join(dir, path.dirname(to)), { recursive: true });
    fs.renameSync(path.join(dir, from), path.join(dir, to));
  }
}

function build(dir) {
  if (!fs.existsSync(path.join(dir, 'node_modules'))) {
    run('npm', ['install', '--no-audit', '--no-fund', '--silent'], dir);
  }
  run('npx', ['vite', 'build'], dir);
}

function copyDist(dir, out) {
  const from = path.join(dir, 'dist');
  const to = out === '.' ? ROOT : path.join(ROOT, out);
  if (out !== '.') fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

// 허브로 돌아가는 절대 URL → 루트 상대경로 (툴킷은 한 폴더 안에 다 들어있음)
function rewriteHubUrl(out) {
  const base = out === '.' ? ROOT : path.join(ROOT, out);
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(f);
    return /\.(js|css|html)$/.test(e.name) ? [f] : [];
  });
  for (const f of walk(base)) {
    const s = fs.readFileSync(f, 'utf8');
    if (s.includes(CFG.hubUrl)) fs.writeFileSync(f, s.split(CFG.hubUrl).join('/'));
  }
}

// 오프라인 캐시 등록 스크립트를 index.html 마다 넣어줍니다.
const SW_BLOCK = `
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#006CFF">
  <script>
    // 오프라인 캐시 등록 — 한 번 열어두면 인터넷 없이도 동작합니다.
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
      });
    }
  </script>
`;
function injectSw(out) {
  const f = out === '.' ? path.join(ROOT, 'index.html') : path.join(ROOT, out, 'index.html');
  if (!fs.existsSync(f)) return;
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('serviceWorker')) return;
  fs.writeFileSync(f, s.replace('</head>', SW_BLOCK + '</head>'));
}

// ────────────────────────────────────────────────────────────
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const targets = only.length ? CFG.apps.filter(a => only.includes(a.out) || only.includes(a.repo)) : CFG.apps;
if (!targets.length) {
  console.error(RED(`대상을 못 찾았습니다: ${only.join(', ')}`));
  process.exit(1);
}

const failed = [];
for (const app of targets) {
  process.stdout.write(`■ ${app.name.padEnd(7)} ${DIM(app.repo)} … `);
  try {
    const dir = fetchRepo(app.repo);
    applyPatch(dir, app.repo);
    applyAssets(dir, app);
    build(dir);
    copyDist(dir, app.out);
    rewriteHubUrl(app.out);
    injectSw(app.out);
    console.log(GRN('완료'));
  } catch (e) {
    console.log(RED('실패'));
    console.log(DIM('    ' + String(e.stderr || e.message).trim().split('\n').slice(-4).join('\n    ')));
    failed.push(app.name);
  }
}

// 빌드 결과에 중복으로 딸려오는 파일(같은 그림이 두 벌) 정리
const PRUNE = ['worldclock/travel.png', 'picker/image2342.png', 'picker/image33.png'];
for (const f of PRUNE) fs.rmSync(path.join(ROOT, f), { force: true });

console.log('\n■ 화면 맞춤 프레임 씌우는 중…');
execFileSync(process.execPath, [path.join(HERE, 'frame-apps.mjs')], { cwd: ROOT, stdio: 'inherit' });

console.log('\n■ 서비스워커 다시 만드는 중…');
execFileSync(process.execPath, [path.join(HERE, 'make-sw.mjs')], { cwd: ROOT, stdio: 'inherit' });

if (failed.length) {
  console.log(RED(`\n일부 실패: ${failed.join(', ')} — 위 메시지를 클로드에게 그대로 보여주세요.`));
  process.exit(1);
}
console.log(GRN('\n전부 완료. 이제 "1. 깃허브에 올리기" 를 실행하면 배포됩니다.'));
