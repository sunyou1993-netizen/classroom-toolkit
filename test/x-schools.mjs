/* 학교 여러 곳에 배포할 때 서로 안 섞이는지 봅니다. (조사용)
 *
 * 배포 구조가 이렇습니다.
 *   수업도우미.exe   ← 모든 학교가 똑같은 파일 하나
 *   교가.txt         ← 학교마다 다른 파일 하나
 *
 * 확인할 것:
 *   1) exe 자체에는 어느 학교 가사도 없는가                 (저작권)
 *   2) 교가.txt 만 바꾸면 그 학교 교가가 나오는가
 *   3) A학교로 켰다가 B학교로 켜면 A학교 가사가 남지 않는가  ← 제일 중요
 *   4) 교가.txt 를 빼면 교가 카드가 사라지는가
 *
 * 두 가지를 조심해야 합니다 (제가 둘 다 처음에 헛짚었습니다).
 *   · 더블클릭용 실행은 서버를 뒤로 띄우고 본체는 곧바로 끝납니다.
 *     시험할 때는 `--serve` 로 서버 본체를 직접 띄워야 합니다.
 *   · 앞선 시험의 서버가 포트를 쥐고 있으면 엉뚱한 학교를 읽게 됩니다.
 *     `ps` 는 한글 파일 이름을 물음표로 보여 주므로 «--serve» 로 찾아 정리합니다.
 *
 * 사용법: node test/x-schools.mjs <실행파일> <교가txt폴더>
 */
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { 제목, 알림 } from './lib/util.mjs';

const 실행파일 = process.argv[2];
const txt폴더 = process.argv[3];
if (!실행파일 || !fs.existsSync(실행파일) || !txt폴더 || !fs.existsSync(txt폴더)) {
  console.log('   사용법: node test/x-schools.mjs <실행파일> <교가txt폴더>');
  process.exit(0);
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

/* 떠 있는 서버를 전부 정리합니다 */
function 정리() {
  try {
    const 목록 = execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | awk '{print $1}'",
      { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    for (const pid of 목록) { try { process.kill(+pid, 'SIGKILL'); } catch { } }
  } catch { }
}

/* 교가.txt 의 앞부분은 «이 파일을 …에 두세요» 같은 안내문입니다.
   그 부분을 가사로 세면 안 됩니다. 실제 가사 줄만 뽑습니다. */
/* «푸른»·«종이» 같은 흔한 낱말은 24MB 프로그램 안에 얼마든지 있습니다
   («종이» 는 그림판 탭 이름이기도 합니다). 그래서 낱말 하나가 아니라
   **가사 한 줄 통째로** 찾습니다. 그 줄이 들어 있으면 진짜 새어 든 것입니다. */
function 가사줄(txt) {
  return txt.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !/^(학교이름|후렴|\d*절)\s*:/.test(l))
    .map((l) => l.replace(/[\[\]]/g, ''))
    .filter((l) => l.replace(/\s/g, '').length >= 8);
}

const 일터 = fs.mkdtempSync('/tmp/학교-');
fs.copyFileSync(실행파일, path.join(일터, '수업도우미'));
fs.chmodSync(path.join(일터, '수업도우미'), 0o755);

async function 켜고읽기(교가파일) {
  정리(); await 잠깐(600);
  for (const f of ['교가.txt', '교가-확인.txt', '교가-예시.txt']) {
    const p = path.join(일터, f); if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (교가파일) fs.copyFileSync(교가파일, path.join(일터, '교가.txt'));

  const p = spawn(path.join(일터, '수업도우미'), ['--serve'],
    { cwd: 일터, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });

  /* 포트를 찾습니다 (이 시험에서는 떠 있는 서버가 하나뿐이라 안전합니다) */
  let 주소 = null;
  for (let i = 0; i < 40 && !주소; i++) {
    await 잠깐(300);
    for (let 포트 = 43110; 포트 <= 43130; 포트++) {
      try {
        const r = await fetch(`http://127.0.0.1:${포트}/`, { signal: AbortSignal.timeout(400) });
        if (r.ok) { 주소 = `http://127.0.0.1:${포트}`; break; }
      } catch { }
    }
  }

  const 결과 = { 주소, 확인파일: '', 교가번들: '', 목록: '', 교가화면: '' };
  const 확인 = path.join(일터, '교가-확인.txt');
  if (fs.existsSync(확인)) 결과.확인파일 = fs.readFileSync(확인, 'utf8');
  if (주소) {
    try {
      /* /quiz/song/ 은 겉틀(iframe)이라 번들 주소가 없습니다.
         속 화면인 app.html 을 봐야 합니다 (제가 처음에 겉틀만 봤습니다). */
      결과.교가화면 = await (await fetch(주소 + '/quiz/song/index.html')).text();
      const 속 = await (await fetch(주소 + '/quiz/song/app.html')).text();
      const m = 속.match(/assets\/[A-Za-z0-9_.-]+\.js/);
      if (m) 결과.교가번들 = await (await fetch(주소 + '/quiz/song/' + m[0])).text();
      결과.목록 = await (await fetch(주소 + '/quiz/app.html')).text();
    } catch (e) { 결과.오류 = String(e).slice(0, 70); }
  }
  try { process.kill(-p.pid, 'SIGKILL'); } catch { }
  정리(); await 잠깐(600);
  return 결과;
}

const 학교들 = fs.readdirSync(txt폴더).filter((n) => n.startsWith('교가-') && n.endsWith('.txt'))
  .map((n) => ({ 이름: n.replace(/^교가-|\.txt$/g, ''), 경로: path.join(txt폴더, n) }));

제목('■ 학교 여러 곳 — 같은 실행 파일에 교가.txt 만 바꿔 끼우기');
알림(`실행 파일 하나: ${path.basename(실행파일)} (${(fs.statSync(실행파일).size / 1048576).toFixed(0)}MB)`);
알림(`시험할 학교 ${학교들.length}곳: ${학교들.map((x) => x.이름).join(', ')}`);

/* ① exe 자체에 가사가 있나 */
const exe내용 = fs.readFileSync(실행파일);
console.log('');
console.log('   ── ① 실행 파일 자체에 학교 가사가 들어 있나 (저작권) ──');
let exe오염 = 0;
for (const s of 학교들) {
  const 줄들 = 가사줄(fs.readFileSync(s.경로, 'utf8'));
  const 걸린것 = 줄들.filter((w) => exe내용.includes(Buffer.from(w, 'utf8')));
  if (걸린것.length) exe오염++;
  console.log(`     ${s.이름.padEnd(16)} ${걸린것.length ? '✗ «' + 걸린것[0].slice(0, 24) + '…» 가 들어 있음' : `✓ 없음 (가사 ${줄들.length}줄 대조)`}`);
}

/* ②③ 학교를 바꿔 끼우며 */
console.log('');
console.log('   ── ②③ 교가.txt 를 바꿔 끼우며 켜 보기 ──');
console.log('   학교               확인파일이 말하는 학교   화면에 나온 학교      남의 학교가 섞였나');
console.log('   ' + '─'.repeat(78));
const 결과들 = [];
for (const s of 학교들) {
  const r = await 켜고읽기(s.경로);
  const 확인학교 = (r.확인파일.match(/교가를 읽었습니다 — (.+?) ·/) || [])[1] || '(못읽음)';
  const 화면학교 = (r.교가번들.match(/schoolName:"([^"]+)"/) || [])[1] || '(못읽음)';
  const 섞임 = [];
  for (const 남 of 학교들) {
    if (남.이름 === s.이름) continue;
    const 낱말 = 가사줄(fs.readFileSync(남.경로, 'utf8'));
    const 걸림 = 낱말.find((w) => r.교가번들.includes(w));
    if (걸림) 섞임.push(`${남.이름}의 «${걸림}»`);
  }
  const 맞나 = 확인학교 === s.이름 && 화면학교 === s.이름;
  console.log(`   ${s.이름.padEnd(17)} ${확인학교.padEnd(22)} ${화면학교.padEnd(20)} ${섞임.length ? '✗ ' + 섞임.join(', ') : '✓ 안 섞임'} ${맞나 ? '' : ' ✗'}`);
  결과들.push({ 학교: s.이름, 확인학교, 화면학교, 섞임 });
}

/* ④ 교가.txt 를 빼면 */
console.log('');
console.log('   ── ④ 교가.txt 를 빼면 ──');
const 없을때 = await 켜고읽기(null);
console.log(`     퀴즈 목록에 교가 카드: ${/교가/.test(없을때.목록) ? '✗ 아직 보임' : '✓ 사라짐'}`);
console.log(`     교가 주소로 곧장 들어가면: ${/location\.replace|song-guard/.test(없을때.교가화면) ? '✓ 목록으로 되돌림' : '⚠ 되돌리는 코드를 못 찾음'}`);
console.log(`     확인 파일: ${(없을때.확인파일.match(/교가[^\n]*/) || ['(없음)'])[0]}`);

console.log('');
const 문제 = 결과들.filter((r) => r.섞임.length || r.확인학교 !== r.학교 || r.화면학교 !== r.학교);
console.log(`   ${exe오염 ? `✗ 실행 파일 안에 학교 가사가 있습니다 (${exe오염}곳)` : '✓ 실행 파일 안에는 어느 학교 가사도 없습니다'}`);
console.log(`   ${문제.length ? `✗ 학교가 섞이거나 잘못 나온 경우 ${문제.length}건` : `✓ ${학교들.length}곳 모두 자기 교가만 나왔습니다`}`);

fs.rmSync(일터, { recursive: true, force: true });
정리();
