/* 학교에서 실제로 일어나는 «운영» 상황들. (조사용)
 *
 * 지금까지는 «잘 깔았을 때» 를 봤습니다. 여기서는 어긋나는 경우를 봅니다.
 *   1) 바탕화면 바로가기로 켰을 때        — 작업 폴더가 달라도 교가를 찾나
 *   2) 압축을 풀다 한글 이름이 깨졌을 때  — school-song.txt 로도 되나
 *   3) 파일 이름이 «수업도우미(1).exe» 로 바뀌었을 때
 *   4) 폴더가 읽기 전용일 때              — 확인 파일을 못 써도 도나
 *   5) 교가.txt 를 메모장에서 열어 둔 채  — 잠긴 파일을 읽나
 *   6) 교가.txt 를 윈도우 메모장 기본(UTF-16)으로 저장했을 때
 *   7) 교가.txt 에 BOM 이 붙었을 때
 *   8) 보드가 갑자기 꺼져 프로세스가 남았을 때 — 다시 켜면 정리되나
 *   9) 켤 때마다 찌꺼기 파일이 쌓이나
 *
 * 사용법: node test/x-ops.mjs <실행파일> <교가txt>
 */
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { 제목, 알림 } from './lib/util.mjs';

const 실행파일 = process.argv[2];
const 교가원본 = process.argv[3];
const 새판 = process.argv[4];   // 있으면 «다음 학기 업데이트» 까지 시험합니다
if (!실행파일 || !fs.existsSync(실행파일)) {
  console.log('   사용법: node test/x-ops.mjs <실행파일> <교가txt>');
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

/* 프로그램을 띄우고, 옆에 남는 «교가-확인.txt» 를 읽어 옵니다.
   확인 파일이 곧 «프로그램이 무엇을 읽었는가» 의 답입니다. */
async function 켜기({ 폴더, 실행이름 = '수업도우미', 인수 = ['--serve'], 작업폴더 = null }) {
  정리(); await 잠깐(500);
  const p = spawn(path.join(폴더, 실행이름), 인수, {
    cwd: 작업폴더 || 폴더,
    env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' },
    stdio: 'ignore', detached: true,
  });
  let 주소 = null;
  for (let i = 0; i < 25 && !주소; i++) {
    await 잠깐(300);
    for (let 포트 = 43110; 포트 <= 43130; 포트++) {
      try { const r = await fetch(`http://127.0.0.1:${포트}/`, { signal: AbortSignal.timeout(300) }); if (r.ok) { 주소 = 포트; break; } } catch { }
    }
  }
  const 확인 = path.join(폴더, '교가-확인.txt');
  const 글 = fs.existsSync(확인) ? fs.readFileSync(확인, 'utf8') : '';
  const 학교 = (글.match(/교가를 읽었습니다 — (.+?) ·/) || [])[1] || null;
  const 문제 = (글.match(/(교가\.txt[^\n]*|school-song[^\n]*|.*너무 큽니다[^\n]*|.*읽지 못했[^\n]*)/) || [])[1] || null;
  try { process.kill(-p.pid, 'SIGKILL'); } catch { }
  정리();
  return { 주소, 학교, 문제, 확인있나: !!글, 글 };
}

function 새폴더(교가내용 = null, 이름 = '교가.txt') {
  const d = fs.mkdtempSync('/tmp/운영-');
  fs.copyFileSync(실행파일, path.join(d, '수업도우미'));
  fs.chmodSync(path.join(d, '수업도우미'), 0o755);
  if (교가내용 !== null) fs.writeFileSync(path.join(d, 이름), 교가내용);
  return d;
}

const 교가글 = 교가원본 && fs.existsSync(교가원본) ? fs.readFileSync(교가원본, 'utf8') : null;
if (!교가글) { console.log('   교가.txt 를 알려 주세요'); process.exit(0); }
const 원래학교 = (교가글.match(/^학교이름:\s*(.+)$/m) || [])[1] || '(모름)';

제목('■ 학교에서 실제로 일어나는 운영 상황');
알림(`기준 교가: ${원래학교}`);
console.log('');

/* ── ① 바탕화면 바로가기 (작업 폴더가 다름) ── */
{
  const d = 새폴더(교가글);
  const 딴데 = fs.mkdtempSync('/tmp/딴데-');
  const r = await 켜기({ 폴더: d, 작업폴더: 딴데 });
  console.log('   ① 바탕화면 바로가기로 켰을 때 (작업 폴더가 딴 곳)');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ exe 옆의 교가를 제대로 찾습니다' : '✗ 교가를 못 찾습니다'}`);
  fs.rmSync(d, { recursive: true, force: true }); fs.rmSync(딴데, { recursive: true, force: true });
}

/* ── ② 압축 풀 때 한글 이름이 깨진 경우 ── */
{
  const d = 새폴더(교가글, 'school-song.txt');
  const r = await 켜기({ 폴더: d });
  console.log('   ② 한글 파일 이름이 깨져 «school-song.txt» 로 있을 때');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ 영어 이름으로도 읽습니다' : '✗ 못 읽습니다'}`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ③ 실행 파일 이름이 바뀐 경우 ── */
{
  const d = 새폴더(교가글);
  fs.renameSync(path.join(d, '수업도우미'), path.join(d, '수업도우미(1)'));
  const r = await 켜기({ 폴더: d, 실행이름: '수업도우미(1)' });
  console.log('   ③ 파일 이름이 «수업도우미(1)» 로 바뀌었을 때 (복사본)');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ 이름이 바뀌어도 됩니다' : '✗ 안 됩니다'}`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ④ 폴더가 읽기 전용일 때 ── */
{
  const d = 새폴더(교가글);
  fs.chmodSync(d, 0o555);
  const r = await 켜기({ 폴더: d });
  console.log('   ④ 폴더가 읽기 전용일 때 (USB·공용 폴더)');
  console.log(`      프로그램이 떴나: ${r.주소 ? '✓ 포트 ' + r.주소 : '✗ 못 뜸'}`);
  console.log(`      확인 파일을 못 써도 도나: ${r.주소 ? '✓ 돕니다' : '✗'} (확인 파일: ${r.확인있나 ? '썼음' : '못 씀 — 당연합니다'})`);
  fs.chmodSync(d, 0o755); fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑤ 윈도우 메모장 기본 저장(UTF-16) ── */
{
  const d = 새폴더(null);
  fs.writeFileSync(path.join(d, '교가.txt'), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(교가글, 'utf16le')]));
  const r = await 켜기({ 폴더: d });
  console.log('   ⑤ 메모장에서 «유니코드(UTF-16)» 로 저장했을 때');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ 읽습니다' : '✗ 못 읽습니다 — ' + (r.문제 || '')}`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑥ UTF-8 인데 BOM 이 붙은 경우 ── */
{
  const d = 새폴더(null);
  fs.writeFileSync(path.join(d, '교가.txt'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(교가글, 'utf8')]));
  const r = await 켜기({ 폴더: d });
  console.log('   ⑥ UTF-8 인데 앞에 BOM 이 붙었을 때 (메모장이 자주 붙입니다)');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ 읽습니다' : '✗ 못 읽습니다'}`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑦ 줄바꿈이 윈도우식(CRLF)일 때 ── */
{
  const d = 새폴더(교가글.replace(/\n/g, '\r\n'));
  const r = await 켜기({ 폴더: d });
  console.log('   ⑦ 줄바꿈이 윈도우식(CRLF)일 때');
  console.log(`      읽은 학교: ${r.학교 || '(못읽음)'}  ${r.학교 === 원래학교 ? '✓ 읽습니다' : '✗ 못 읽습니다'}`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑧ 보드가 갑자기 꺼져 프로세스가 남았을 때 ── */
{
  const d = 새폴더(교가글);
  /* 하나 띄워 놓고 «갑자기 꺼진 것처럼» 그대로 둔 채, 또 켭니다 */
  const 첫 = spawn(path.join(d, '수업도우미'), ['--serve'],
    { cwd: d, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
  await 잠깐(4000);
  const 전개수 = 서버수();
  /* 더블클릭(인수 없이) — 이때 예전 것을 정리해야 합니다 */
  const 둘 = spawn(path.join(d, '수업도우미'), [],
    { cwd: d, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
  await 잠깐(6000);
  const 후개수 = 서버수();
  console.log('   ⑧ 예전 것이 떠 있는 채로 또 켰을 때');
  console.log(`      전: 서버 ${전개수}개 → 후: 서버 ${후개수}개  ${후개수 <= 1 ? '✓ 하나로 정리됩니다' : '✗ ' + 후개수 + '개가 쌓입니다'}`);
  try { process.kill(-첫.pid, 'SIGKILL'); } catch { }
  try { process.kill(-둘.pid, 'SIGKILL'); } catch { }
  정리(); await 잠깐(500);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑨ 켤 때마다 파일이 쌓이나 ── */
{
  const d = 새폴더(교가글);
  const 세기 = () => fs.readdirSync(d).length;
  await 켜기({ 폴더: d }); const a = 세기();
  await 켜기({ 폴더: d }); const b = 세기();
  await 켜기({ 폴더: d }); const c = 세기();
  console.log('   ⑨ 세 번 켰을 때 옆에 쌓이는 파일');
  console.log(`      ${a}개 → ${b}개 → ${c}개  ${a === c ? '✓ 안 쌓입니다' : '✗ 켤 때마다 늘어납니다'}`);
  console.log(`      (${fs.readdirSync(d).filter((f) => f !== '수업도우미').join(', ')})`);
  fs.rmSync(d, { recursive: true, force: true });
}

/* ── ⑩ 다음 학기 업데이트 (새 판을 받았을 때) ── */
if (새판 && fs.existsSync(새판)) {
  console.log('   ⑩ 다음 학기 새 판을 받았을 때');
  const 옛 = 새폴더(교가글);
  const 새 = fs.mkdtempSync('/tmp/새판-');
  fs.copyFileSync(새판, path.join(새, '수업도우미'));
  fs.chmodSync(path.join(새, '수업도우미'), 0o755);
  fs.writeFileSync(path.join(새, '교가.txt'), 교가글);

  /* 옛 판이 켜져 있는 채로 새 판을 더블클릭 — 학교에서 실제로 이렇게 됩니다 */
  정리(); await 잠깐(500);
  const a = spawn(path.join(옛, '수업도우미'), ['--serve'],
    { cwd: 옛, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
  await 잠깐(4500);
  /* 새 판은 «옛 것에게 비켜 달라 → 기다림 → 스스로 다시 띄움» 순서라
     시간이 걸립니다. 넉넉히 여러 번 훑습니다. */
  const 포트찾기 = async (몇번 = 1) => {
    for (let i = 0; i < 몇번; i++) {
      for (let 포트 = 43110; 포트 <= 43130; 포트++) {
        try { const r = await fetch(`http://127.0.0.1:${포트}/`, { signal: AbortSignal.timeout(400) }); if (r.ok) return 포트; } catch { }
      }
      await 잠깐(1000);
    }
    return null;
  };
  const p1 = await 포트찾기(10);
  const 옛버전 = p1 ? await (await fetch(`http://127.0.0.1:${p1}/__suup-doumi`)).text() : '?';

  const b = spawn(path.join(새, '수업도우미'), [],
    { cwd: 새, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
  await 잠깐(3000);
  const p2 = await 포트찾기(20);
  const 새버전 = p2 ? await (await fetch(`http://127.0.0.1:${p2}/__suup-doumi`)).text() : '?';
  await 잠깐(1500);

  console.log(`      옛 판 번호: ${옛버전.trim()}`);
  console.log(`      더블클릭 뒤: ${새버전.trim()}`);
  console.log(`      ${새버전 === '?' ? '⚠ 새 판이 안 떴습니다 (더 기다려야 할 수 있습니다)' : 옛버전.trim() !== 새버전.trim() ? '✓ 새 판으로 바뀌었습니다' : '✗ 옛 판이 그대로입니다 — 조용히 업데이트가 안 됩니다'}`);
  console.log(`      서버 개수: ${서버수()}개  ${서버수() <= 1 ? '✓' : '✗ 두 개가 떴습니다'}`);
  const 확인 = path.join(새, '교가-확인.txt');
  const 학교 = fs.existsSync(확인) ? (fs.readFileSync(확인, 'utf8').match(/읽었습니다 — (.+?) ·/) || [])[1] : null;
  console.log(`      교가는 그대로인가: ${학교 === 원래학교 ? '✓ ' + 학교 : '· ' + (학교 || '확인 못 함')}`);
  try { process.kill(-a.pid, 'SIGKILL'); } catch { }
  try { process.kill(-b.pid, 'SIGKILL'); } catch { }
  정리();
  fs.rmSync(옛, { recursive: true, force: true }); fs.rmSync(새, { recursive: true, force: true });
}

정리();
console.log('');
