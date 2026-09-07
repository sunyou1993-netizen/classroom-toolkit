/* 운영 검수 3 — 선생님이 «교가.txt» 를 만들면서 실제로 하는 실수들. (조사용)
 *
 * 왜 이것을 보나:
 *   교가.txt 는 학교마다 선생님이 직접 만듭니다. 개발자가 아닌 분이,
 *   윈도우 메모장으로, 탐색기에서 이름을 바꿔서 만듭니다.
 *   여기서 어긋나면 «교가 퀴즈가 안 보여요» 라는 전화가 학교마다 옵니다.
 *
 * 보는 것:
 *   ① 메모장에서 «ANSI» 로 저장했을 때        (예전 메모장의 기본값입니다)
 *   ② 메모장에서 «유니코드(UTF-16)» 로 저장했을 때
 *   ③ 메모장에서 «UTF-8 (BOM)» 로 저장했을 때 (윈도우 메모장의 기본값)
 *   ④ 확장자 숨김 탓에 «교가.txt.txt» 가 됐을 때  ← 가장 흔한 실수입니다
 *   ⑤ 폴더 이름에 한글·공백·괄호가 섞여 있을 때
 *   ⑥ 폴더 이름에 # 나 % 가 들어 있을 때
 *   ⑦ 교가.txt 를 아예 안 넣었을 때 무엇을 남겨 주는가
 *
 * 쓰는 법: node test/x-ops3.mjs <실행파일>
 */
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { 제목, 알림 } from './lib/util.mjs';

const 실행파일 = process.argv[2];
if (!실행파일 || !fs.existsSync(실행파일)) {
  console.log('   사용법: node test/x-ops3.mjs <실행파일>');
  process.exit(0);
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
const 정리 = () => {
  try {
    execSync("ps -eo pid,args | grep -- '--serve' | grep -v grep | awk '{print $1}'", { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean).forEach((pid) => { try { process.kill(+pid, 'SIGKILL'); } catch { } });
  } catch { }
};
async function 살아있는주소() {
  for (let p = 43110; p <= 43130; p++) {
    try {
      const r = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(500) });
      if (r.ok) return `http://127.0.0.1:${p}`;
    } catch { }
  }
  return null;
}
/* 화면으로 나가는 교가를 실제로 읽어 옵니다 (확인 파일만 믿지 않습니다) */
async function 화면속교가(주소) {
  try {
    const 목록 = await (await fetch(주소 + '/quiz/song/app.html')).text();
    /* app.html 은 './assets/index-XXXX.js' 처럼 상대 경로로 적혀 있습니다 */
    const 자산 = [...목록.matchAll(/assets\/[A-Za-z0-9._-]+\.js/g)].map((m) => m[0]);
    if (!자산.length) return '(app.html 에서 자산을 못 찾음)';
    for (const a of new Set(자산)) {
      const js = await (await fetch(주소 + '/quiz/song/' + a)).text();
      const m = js.match(/schoolName:"((?:[^"\\]|\\.)*)"/);
      if (m) return JSON.parse(`"${m[1]}"`);
    }
  } catch (e) { return '(못 읽음: ' + e.message.slice(0, 30) + ')'; }
  return '(schoolName 을 못 찾음)';
}

const 예시교가 = [
  '학교이름: 한빛초등학교',
  '후렴: 아 빛나라 우리 한빛 영원하여라',
  '',
  '1절',
  '푸른 산 [맑은] 물이 감도는 곳에',
  '배움의 [터전]을 굳게 세우고',
].join('\n');

/* 원하는 인코딩으로 파일을 씁니다. 못 만들면 null 을 돌려줍니다. */
function 인코딩저장(경로, 글, 방식) {
  try {
    if (방식 === 'utf8') { fs.writeFileSync(경로, 글, 'utf8'); return true; }
    if (방식 === 'utf8bom') { fs.writeFileSync(경로, Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(글, 'utf8')])); return true; }
    if (방식 === 'utf16le') { fs.writeFileSync(경로, Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(글, 'utf16le')])); return true; }
    if (방식 === 'cp949') {
      const b = execSync('iconv -f UTF-8 -t CP949', { input: Buffer.from(글, 'utf8'), maxBuffer: 1 << 20 });
      fs.writeFileSync(경로, b); return true;
    }
  } catch { return false; }
  return false;
}

/* 한 상황을 통째로 굴려 봅니다 */
async function 굴리기({ 이름, 폴더이름 = '보드', 파일이름 = '교가.txt', 방식 = 'utf8', 글 = 예시교가, 안넣기 = false }) {
  정리(); await 잠깐(700);
  const 바탕 = fs.mkdtempSync('/tmp/운영3-');
  const 일터 = path.join(바탕, 폴더이름);
  fs.mkdirSync(일터, { recursive: true });
  fs.copyFileSync(실행파일, path.join(일터, '수업도우미'));
  fs.chmodSync(path.join(일터, '수업도우미'), 0o755);

  let 만듦 = true;
  if (!안넣기) {
    만듦 = 인코딩저장(path.join(일터, 파일이름), 글, 방식);
    if (!만듦) {
      console.log(`\n   ── ${이름} ──`);
      console.log('     (건너뜀) 이 인코딩으로 파일을 만들 수 없는 환경입니다');
      fs.rmSync(바탕, { recursive: true, force: true });
      return;
    }
  }

  spawn(path.join(일터, '수업도우미'), [],
    { cwd: 일터, env: { ...process.env, BROWSER: '/bin/true', DISPLAY: '' }, stdio: 'ignore', detached: true });
  await 잠깐(4500);

  const 주소 = await 살아있는주소();
  const 확인경로 = path.join(일터, '교가-확인.txt');
  const 확인 = fs.existsSync(확인경로) ? fs.readFileSync(확인경로, 'utf8').trim() : '(확인 파일이 없습니다)';
  const 화면 = 주소 ? await 화면속교가(주소) : '(서버가 안 떴습니다)';
  const 옆파일 = fs.readdirSync(일터).filter((f) => f !== '수업도우미');

  console.log('');
  console.log(`   ── ${이름} ──`);
  console.log(`     폴더: ${폴더이름}/${안넣기 ? ' (교가 파일 없음)' : '  파일: ' + 파일이름 + ' (' + 방식 + ')'}`);
  console.log(`     프로그램이 떴나: ${주소 ? '떴습니다 ' + 주소 : '✗ 안 떴습니다'}`);
  console.log(`     화면으로 나가는 학교 이름: ${화면}`);
  console.log(`     옆에 생긴 파일: ${옆파일.join(', ')}`);
  console.log('     교가-확인.txt:');
  확인.split('\n').forEach((l) => console.log(`       │ ${l}`));

  정리(); await 잠깐(400);
  fs.rmSync(바탕, { recursive: true, force: true });
  return { 화면, 확인, 주소 };
}

정리(); await 잠깐(500);

제목('■ 선생님이 교가.txt 를 만들 때 흔한 상황들');
알림('«우리 학교» 라고 나오면 교가 퀴즈가 숨겨진 것이고, 학교 이름이 나오면 켜진 것입니다');

const 결과 = {};
결과.기본 = await 굴리기({ 이름: '① 제대로 UTF-8 로 저장 (기준)', 방식: 'utf8' });
결과.bom = await 굴리기({ 이름: '② 메모장 기본값 — UTF-8 (BOM 붙음)', 방식: 'utf8bom' });
결과.u16 = await 굴리기({ 이름: '③ 메모장에서 «유니코드» 선택 — UTF-16', 방식: 'utf16le' });
결과.ansi = await 굴리기({ 이름: '④ 메모장에서 «ANSI» 선택 — 한글 윈도우의 CP949', 방식: 'cp949' });
결과.두번 = await 굴리기({ 이름: '⑤ 확장자 숨김 탓에 «교가.txt.txt» 가 됨', 파일이름: '교가.txt.txt' });
결과.대문자 = await 굴리기({ 이름: '⑥ 이름이 «교가.TXT» 로 됨', 파일이름: '교가.TXT' });
결과.한글폴더 = await 굴리기({ 이름: '⑦ 폴더 이름에 한글·공백·괄호', 폴더이름: '2학년 3반 보드 (교실)' });
결과.기호폴더 = await 굴리기({ 이름: '⑧ 폴더 이름에 # 과 %', 폴더이름: '수업#자료 100%' });
결과.없음 = await 굴리기({ 이름: '⑨ 교가.txt 를 아예 안 넣음', 안넣기: true });

제목('■ 한 줄 정리');
const 켜짐 = (r) => r && r.화면 && r.화면 !== '우리 학교' && !r.화면.startsWith('(');
for (const [키, 이름] of [
  ['기본', 'UTF-8'], ['bom', 'UTF-8(BOM)'], ['u16', 'UTF-16'], ['ansi', 'ANSI(CP949)'],
  ['두번', '교가.txt.txt'], ['대문자', '교가.TXT'], ['한글폴더', '한글 폴더'], ['기호폴더', '# % 폴더'], ['없음', '파일 없음'],
]) {
  const r = 결과[키];
  const 상태 = !r ? '건너뜀' : 켜짐(r) ? `켜짐 (${r.화면})` : '숨겨짐';
  console.log(`   ${이름.padEnd(14)} ${상태}`);
}
console.log('');
