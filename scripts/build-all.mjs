#!/usr/bin/env node
/*
 * 수업도우미 툴킷 — 전체 다시 만들기
 *
 * AI Studio 에서 앱을 고친 뒤 이 스크립트를 한 번 돌리면
 *   ① GitHub 원본 저장소 10개를 최신으로 내려받고
 *   ② 오프라인 패치(scripts/patches/*.patch)를 자동으로 입히고
 *   ③ 각각 빌드해서
 *   ④ 이 폴더(툴킷)에 그대로 갈아끼운 뒤
 *   ⑤ 손으로 넣은 고침(키오스크 잠금·글꼴·대비·안내 …)을 다시 입히고
 *   ⑥ 빠진 고침이 없는지 대조한 뒤
 *   ⑦ 서비스워커(sw.js)까지 새로 만듭니다.
 *
 * ⑤⑥ 이 중요합니다. 앱을 새로 빌드하면 «빌드 결과물 위에 덧붙인 고침» 이
 * 전부 없어지는데, 화면은 멀쩡히 열려서 아무도 모르기 때문입니다.
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

// ── 손으로 넣은 고침을 다시 입힙니다 ─────────────────────────────
//
// 여기가 없으면 «다시 가져오기» 가 곧 «고쳤던 것 전부 날리기» 가 됩니다.
// 위에서 앱을 새로 빌드해 갈아끼웠기 때문에, 빌드 결과물 위에 덧붙였던
// 것(키오스크 잠금·글꼴·글자 대비·동작 줄이기·파일 끌어놓기 막기·
// 새 판 반영·하얀 화면 안내 …)이 전부 없어진 상태입니다.
//
// 실제로 확인했습니다: 이 줄이 없을 때 타이머 화면 하나에서만
// 일곱 개가 사라졌고, 화면에는 초록색으로 «전부 완료» 라고 떴습니다.
//
// apply-fixes.mjs 가 마지막에 sw.js 까지 다시 만듭니다.
console.log('\n■ 손으로 넣은 고침 다시 입히는 중…');
try {
  execFileSync(process.execPath, [path.join(HERE, 'apply-fixes.mjs')], { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  // 대개 «AI Studio 가 그 부분을 고쳐서, 고침이 붙을 자리를 못 찾은» 경우입니다.
  // 어느 고침인지는 바로 위에 ✗ 와 함께 이름으로 나옵니다.
  console.log(RED('\n고침을 다시 입히지 못했습니다. 이대로 올리면 고치기 전 화면이 나갑니다.'));
  console.log('위 ✗ 표시가 붙은 고침 이름을 그대로 알려 주세요.');
  process.exit(1);
}

// 정말 다 붙었는지 대조합니다. 하나라도 빠지면 여기서 걸립니다.
console.log('\n■ 고침이 다 붙었는지 대조하는 중…');
try {
  execFileSync(process.execPath, [path.join(HERE, 'check-fixes.mjs')], { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  console.log(RED('\n고침이 빠진 채로 만들어졌습니다. 이대로 올리면 안 됩니다.'));
  process.exit(1);
}

if (failed.length) {
  console.log(RED(`\n일부 실패: ${failed.join(', ')} — 위 메시지를 클로드에게 그대로 보여주세요.`));
  process.exit(1);
}
console.log(GRN('\n전부 완료. 이제 "1. 깃허브에 올리기" 를 실행하면 배포됩니다.'));
