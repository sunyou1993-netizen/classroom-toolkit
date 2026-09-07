/* 운영 검수 4 — 보드가 «말없이 아무 일도 안 하는» 경우들. (조사용)
 *
 * 학교에서 가장 막막한 연락은 «눌렀는데 아무 일도 안 일어나요» 입니다.
 * 그때 무엇이 남는지, 원인을 알 방법이 있는지를 봅니다.
 *
 *   ① 옆 반 보드나 선생님 폰에서 이 보드에 접속되나 (되면 안 됩니다)
 *   ② 다른 프로그램이 포트를 잡고 «대답을 안 할» 때 — 얼마나 기다리나
 *   ③ 조급해서 네 번 눌렀을 때 서버가 네 개 뜨나
 *   ④ 확인 파일에 화면 주소와 브라우저가 적히나
 *
 * 쓰는 법: node test/x-ops4.mjs <실행파일>
 */
import fs from 'fs';
import os from 'os';
import net from 'net';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { 제목, 알림 } from './lib/util.mjs';

const 실행파일 = process.argv[2];
if (!실행파일 || !fs.existsSync(실행파일)) {
  console.log('   사용법: node test/x-ops4.mjs <실행파일>');
  process.exit(0);
}
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const 정리 = () => {
  try {
    execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | awk '{print $1}'", { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).forEach((pid) => { try { process.kill(+pid, 'SIGKILL'); } catch { } });
  } catch { }
};
const 서버수 = () => {
  try { return execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | wc -l", { encoding: 'utf8' }).trim() | 0; }
  catch { return 0; }
};
async function 살아있는포트() {
  const 목록 = [];
  for (let p = 43110; p <= 43130; p++) {
    try { const r = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(400) }); if (r.ok) 목록.push(p); } catch { }
  }
  return 목록;
}

const 일터 = fs.mkdtempSync(path.join(os.tmpdir(), '운영4-'));
fs.copyFileSync(실행파일, path.join(일터, '수업도우미'));
fs.chmodSync(path.join(일터, '수업도우미'), 0o755);
fs.copyFileSync('/root/work/launcher/testdata/교가-서울신답초등학교.txt', path.join(일터, '교가.txt'));
const 더블클릭 = () => spawn(path.join(일터, '수업도우미'), [],
  { cwd: 일터, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });

정리(); await 잠깐(800);

/* ── ① 다른 기기에서 접속되나 ── */
제목('■ ① 옆 반 보드나 선생님 폰에서 이 보드에 접속되나');
알림('학교 와이파이는 대개 한 망입니다. 열려 있으면 누구나 들어올 수 있습니다');
더블클릭(); await 잠깐(4500);
const 포트 = (await 살아있는포트())[0];
console.log('');
console.log(`   떠 있는 포트: ${포트 || '(없음)'}`);
/* 이 컴퓨터가 가진 «바깥에서 보이는» 주소들 */
const 바깥주소 = Object.values(os.networkInterfaces()).flat()
  .filter((x) => x && x.family === 'IPv4' && !x.internal).map((x) => x.address);
console.log(`   이 기기의 바깥 주소: ${바깥주소.join(', ') || '(없음)'}`);
let 밖에서열림 = 0;
for (const 주소 of 바깥주소) {
  try {
    const r = await fetch(`http://${주소}:${포트}/`, { signal: AbortSignal.timeout(1200) });
    console.log(`     http://${주소}:${포트}/  →  ${r.status} ✗ 열립니다`);
    밖에서열림++;
  } catch (e) {
    console.log(`     http://${주소}:${포트}/  →  막힘 ✓ (${String(e.message).slice(0, 40)})`);
  }
}
/* 실제로 무엇에 귀를 열고 있는지도 함께 봅니다 */
let 귀 = '';
try { 귀 = execSync(`ss -ltn 2>/dev/null | grep ':${포트}' || netstat -ltn 2>/dev/null | grep ':${포트}'`, { encoding: 'utf8' }).trim(); } catch { }
if (귀) console.log(`   귀를 연 주소: ${귀.split('\n')[0].replace(/\s+/g, ' ')}`);
console.log(`   ${밖에서열림 === 0 ? '✓ 이 보드 안에서만 열립니다 (127.0.0.1 전용)' : `✗ 바깥에서 ${밖에서열림}곳 열립니다`}`);

/* ── ④ 확인 파일에 주소와 브라우저가 적히나 ── */
제목('■ ② 확인 파일에 «화면 주소» 와 «어떤 브라우저로 열었는지» 가 적히나');
알림('«눌렀는데 아무 일도 안 일어나요» 연락이 왔을 때 이 두 줄로 갈립니다');
const 확인 = fs.readFileSync(path.join(일터, '교가-확인.txt'), 'utf8');
console.log('');
확인.trim().split('\n').forEach((l) => console.log(`     │ ${l}`));
const 주소있나 = /화면 주소: http:\/\/127\.0\.0\.1:\d+\//.test(확인);
const 브라우저있나 = /화면을 연 브라우저|기본 브라우저|열지 못했습니다/.test(확인);
console.log(`   ${주소있나 && 브라우저있나 ? '✓ 주소와 브라우저가 다 적힙니다' : `✗ 빠졌습니다 (주소 ${주소있나} · 브라우저 ${브라우저있나})`}`);

/* ── ② 대답 없는 프로그램이 포트를 다 잡고 있을 때 ── */
제목('■ ③ 다른 프로그램이 21개 포트를 잡고 «대답을 안 할» 때');
알림('연결은 받아 주는데 답이 없는 상태입니다. 프로그램은 포트마다 0.25초씩 기다립니다');
정리(); await 잠깐(1000);
const 먹통 = [];
for (let p = 43110; p <= 43130; p++) {
  const s = net.createServer(() => { /* 받아만 놓고 아무 답도 안 합니다 */ });
  await new Promise((res) => { s.once('error', res); s.listen(p, '127.0.0.1', res); });
  먹통.push(s);
}
const 잰시작 = Date.now();
const p1 = 더블클릭();
await new Promise((r) => p1.once('exit', r));
const 걸린시간 = Date.now() - 잰시작;
await 잠깐(3000);
console.log('');
console.log(`   더블클릭한 뒤 «다음 동작으로 넘어가기» 까지: ${(걸린시간 / 1000).toFixed(1)}초`);
console.log(`   서버 ${서버수()}개 · 열린 포트: ${(await 살아있는포트()).join(', ') || '(43110~43130 밖)'}`);
console.log(`   ${걸린시간 < 8000 ? '✓ 오래 매달리지 않습니다' : '✗ 너무 오래 걸립니다 — 선생님이 여러 번 누르게 됩니다'}`);
for (const s of 먹통) s.close();
await 잠깐(600);

/* ── ③ 조급해서 네 번 눌렀을 때 ── */
제목('■ ④ 조급해서 네 번 연달아 눌렀을 때');
알림('아무 반응이 없어 보이면 선생님은 여러 번 누릅니다');
정리(); await 잠깐(1200);
for (let i = 0; i < 4; i++) { 더블클릭(); await 잠깐(250); }
await 잠깐(6000);
const 끝포트 = await 살아있는포트();
console.log('');
console.log(`   서버 ${서버수()}개 · 열린 포트: ${끝포트.join(', ') || '없음'}`);
console.log(`   ${서버수() === 1 && 끝포트.length === 1 ? '✓ 네 번 눌러도 하나만 뜹니다' : `⚠ 서버 ${서버수()}개 · 포트 ${끝포트.length}개 — 확인 필요`}`);

정리(); await 잠깐(400);
fs.rmSync(일터, { recursive: true, force: true });
console.log('');
