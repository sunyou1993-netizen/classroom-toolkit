/* 실행 파일을 교실에서 쓰듯 굴려 봅니다. (조사용)
 *
 * 선생님이 실제로 하는 것들:
 *   1) 아이콘을 두 번 눌렀다 (조급해서 또 누름)  → 두 개가 뜨면 안 됩니다
 *   2) 이미 켜져 있는데 또 눌렀다                → 창만 다시 열려야 합니다
 *   3) 다른 프로그램이 포트를 쓰고 있다          → 다른 포트로라도 떠야 합니다
 *   4) 껐다 다시 켰다                            → 그대로 떠야 합니다
 *   5) 교가.txt 를 고치고 다시 켰다              → 새 교가가 나와야 합니다
 *   6) 교가.txt 를 넣었는데 프로그램을 안 껐다   → 확인 파일이 뭐라고 하나
 *
 * 사용법: node test/x-run.mjs <실행파일> [교가txt]
 */
import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn, execSync } from 'child_process';
import { 제목, 알림 } from './lib/util.mjs';

const 실행파일 = process.argv[2];
const 교가txt = process.argv[3];
if (!실행파일 || !fs.existsSync(실행파일)) {
  console.log('   사용법: node test/x-run.mjs <실행파일> [교가txt]');
  process.exit(0);
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const 정리 = () => {
  try {
    execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | awk '{print $1}'", { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean)
      .forEach((pid) => { try { process.kill(+pid, 'SIGKILL'); } catch { } });
  } catch { }
};
const 서버수 = () => {
  try {
    return execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | wc -l", { encoding: 'utf8' }).trim() | 0;
  } catch { return 0; }
};
async function 열린포트() {
  const 목록 = [];
  for (let p = 43110; p <= 43130; p++) {
    try { const r = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(400) }); if (r.ok) 목록.push(p); } catch { }
  }
  return 목록;
}

const 일터 = fs.mkdtempSync('/tmp/운영-');
fs.copyFileSync(실행파일, path.join(일터, '수업도우미'));
fs.chmodSync(path.join(일터, '수업도우미'), 0o755);
if (교가txt && fs.existsSync(교가txt)) fs.copyFileSync(교가txt, path.join(일터, '교가.txt'));

/* 더블클릭한 것처럼 (인수 없이) 실행합니다 */
function 더블클릭() {
  return spawn(path.join(일터, '수업도우미'), [],
    { cwd: 일터, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
}

정리(); await 잠깐(800);

제목('■ 실행 파일을 교실에서 쓰듯');
알림('«더블클릭» 은 서버를 뒤로 띄우고 본체는 곧바로 끝나는 방식입니다');

/* ── 1) 아이콘을 두 번 빠르게 눌렀다 ── */
console.log('');
console.log('   ── ① 아이콘을 두 번 빠르게 눌렀을 때 ──');
더블클릭(); await 잠깐(300); 더블클릭();
await 잠깐(5000);
let 포트 = await 열린포트();
console.log(`     떠 있는 서버: ${서버수()}개 · 열린 포트: ${포트.join(', ') || '없음'}`);
console.log(`     ${서버수() === 1 ? '✓ 하나만 떴습니다' : 서버수() === 0 ? '✗ 하나도 안 떴습니다' : '✗ 여러 개가 떴습니다'}`);

/* ── 2) 이미 켜져 있는데 또 눌렀다 ── */
console.log('');
console.log('   ── ② 이미 켜져 있는데 또 눌렀을 때 ──');
const 전포트 = (await 열린포트())[0];
더블클릭(); await 잠깐(4000);
포트 = await 열린포트();
console.log(`     서버 ${서버수()}개 · 포트 ${포트.join(', ') || '없음'} (전에는 ${전포트})`);
console.log(`     ${서버수() === 1 && 포트[0] === 전포트 ? '✓ 새로 뜨지 않고 그대로 (창만 다시 엽니다)' : '⚠ 확인 필요'}`);

/* ── 3) 다른 프로그램이 포트를 쓰고 있을 때 ── */
console.log('');
console.log('   ── ③ 다른 프로그램이 포트를 여러 개 잡고 있을 때 ──');
정리(); await 잠깐(1000);
const 막은것 = [];
for (let p = 43110; p <= 43125; p++) {
  const s = net.createServer(() => { });
  await new Promise((res) => { s.once('error', res); s.listen(p, '127.0.0.1', res); });
  막은것.push(s);
}
알림(`43110~43125 를 다른 프로그램이 쓰고 있다고 치고 막았습니다 (16개)`);
더블클릭(); await 잠깐(5000);
포트 = await 열린포트();
console.log(`     서버 ${서버수()}개 · 남은 포트에서 열림: ${포트.join(', ') || '(43110~43130 밖)'}`);
console.log(`     ${서버수() >= 1 ? '✓ 막힌 포트를 피해 떴습니다' : '✗ 못 떴습니다'}`);
for (const s of 막은것) s.close();
await 잠깐(500);

/* ── 4) 껐다 다시 켜기 ── */
console.log('');
console.log('   ── ④ 껐다 다시 켰을 때 ──');
정리(); await 잠깐(1200);
console.log(`     끈 뒤 서버 ${서버수()}개 · 포트 ${(await 열린포트()).join(', ') || '없음'}`);
더블클릭(); await 잠깐(5000);
포트 = await 열린포트();
console.log(`     다시 켠 뒤 서버 ${서버수()}개 · 포트 ${포트.join(', ') || '없음'}`);
console.log(`     ${서버수() === 1 && 포트.length ? '✓ 그대로 다시 떴습니다' : '✗ 문제 있음'}`);

/* ── 5) 교가.txt 를 바꾸고 다시 켜기 ── */
if (교가txt) {
  console.log('');
  console.log('   ── ⑤ 교가.txt 를 고치고 다시 켰을 때 ──');
  const 확인 = path.join(일터, '교가-확인.txt');
  const 전학교 = fs.existsSync(확인) ? (fs.readFileSync(확인, 'utf8').match(/읽었습니다 — (.+?) ·/) || [])[1] : '(없음)';
  /* 학교 이름만 바꿔 봅니다 */
  const 원본 = fs.readFileSync(path.join(일터, '교가.txt'), 'utf8');
  fs.writeFileSync(path.join(일터, '교가.txt'), 원본.replace(/^학교이름:.*$/m, '학교이름: 바뀐이름초등학교'));
  정리(); await 잠깐(1000);
  더블클릭(); await 잠깐(5000);
  const 후학교 = fs.existsSync(확인) ? (fs.readFileSync(확인, 'utf8').match(/읽었습니다 — (.+?) ·/) || [])[1] : '(없음)';
  console.log(`     고치기 전: ${전학교}  →  고친 뒤: ${후학교}`);
  console.log(`     ${후학교 === '바뀐이름초등학교' ? '✓ 새 교가를 읽었습니다' : '✗ 예전 것이 그대로입니다'}`);

  /* ── 6) 프로그램을 켠 채로 교가.txt 를 바꾸면 ── */
  console.log('');
  console.log('   ── ⑥ 켜 둔 채로 교가.txt 를 바꾸면 (선생님이 흔히 하는 실수) ──');
  fs.writeFileSync(path.join(일터, '교가.txt'), 원본.replace(/^학교이름:.*$/m, '학교이름: 또바뀐초등학교'));
  await 잠깐(2500);
  const 지금 = fs.existsSync(확인) ? (fs.readFileSync(확인, 'utf8').match(/읽었습니다 — (.+?) ·/) || [])[1] : '(없음)';
  console.log(`     확인 파일은 아직: ${지금}`);
  console.log(`     ${지금 === '바뀐이름초등학교' ? '· 껐다 켜야 반영됩니다 (안내문에 그렇게 적혀 있습니다)' : '· ' + 지금}`);
}

/* ── 남기는 파일 ── */
console.log('');
console.log('   ── 실행하면 옆에 생기는 파일 ──');
for (const f of fs.readdirSync(일터)) {
  if (f === '수업도우미') continue;
  console.log(`     ${f}  (${fs.statSync(path.join(일터, f)).size} 바이트)`);
}

정리(); await 잠깐(500);
fs.rmSync(일터, { recursive: true, force: true });
console.log('');
