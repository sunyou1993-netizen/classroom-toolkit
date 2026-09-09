/* 손으로 넣은 고침을 «한 번에 다시» 입힙니다.
 *
 * ── 왜 이 파일이 있어야 하나 (실제로 확인한 일입니다) ───────────────────
 *
 * 이 저장소가 굴러가는 방식은 이렇습니다.
 *   AI Studio 가 만든 앱 10개를 받아다 빌드하고, 그 «결과물» 위에
 *   우리가 고칠 것들을 한 겹 덧붙입니다. 원본은 건드리지 않습니다.
 *
 * 그런데 「0. 앱 다시 가져오기」를 누르면 앱을 새로 받아 새로 빌드하므로,
 * 덧붙였던 것이 **전부 없어집니다.** 그리고 아무도 그 사실을 알려 주지 않습니다.
 * 화면에는 초록색으로 «전부 완료» 라고 뜹니다.
 *
 * 실제로 타이머 화면 하나로 재현해 봤습니다. 다시 가져오기 뒤:
 *   키오스크 잠금 · 글꼴 · 글자 대비 · 동작 줄이기 · 파일 끌어놓기 막기 ·
 *   새 판 반영 · 하얀 화면 안내  →  일곱 개가 전부 사라졌습니다.
 *
 * 17개 화면이 다 그렇습니다. 학교에 그대로 나가면
 * «분명히 고쳤는데 왜 원래대로예요?» 가 됩니다.
 *
 * 그래서 다시 가져오기 마지막에 이 파일이 자동으로 돌아갑니다.
 * 손으로 돌려도 됩니다 — 여러 번 돌려도 결과는 같습니다.
 *
 * 사용법:  node scripts/apply-fixes.mjs        (수업도우미 폴더에서)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const QUIZ = path.join(ROOT, 'quiz');
const 퀴즈있나 = fs.existsSync(path.join(QUIZ, 'index.html'));

const 초록 = (s) => `\x1b[32m${s}\x1b[0m`;
const 빨강 = (s) => `\x1b[31m${s}\x1b[0m`;
const 흐리게 = (s) => `\x1b[2m${s}\x1b[0m`;

/* 무엇을 다시 입히는가.
 *
 *   자리   : 어느 폴더에서 돌리는가
 *   BASE   : 있으면 그 폴더까지 한 번에 처리하는 스크립트입니다(퀴즈까지)
 */
const 목록 = [
  // ── 두 곳(수업도우미·퀴즈)을 한 번에 처리하는 것들 ──
  { 이름: '화면 확대 막기', 파일: 'fix-viewport.mjs', 자리: ROOT, base: 퀴즈있나 },
  { 이름: '연한 글자 진하게', 파일: 'fix-contrast.mjs', 자리: ROOT, base: 퀴즈있나 },
  { 이름: '동작 줄이기 설정 따르기', 파일: 'fix-reduced-motion.mjs', 자리: ROOT, base: 퀴즈있나 },
  { 이름: '파일 끌어놓기 막기', 파일: 'fix-drop-guard.mjs', 자리: ROOT, base: 퀴즈있나 },
  { 이름: '하얀 화면 대신 안내', 파일: 'fix-blank-guard.mjs', 자리: ROOT, base: 퀴즈있나 },
  { 이름: '새 판을 한 번에 반영', 파일: 'fix-sw-update.mjs', 자리: ROOT, base: 퀴즈있나 },

  // ── 수업도우미 쪽만 ──
  { 이름: '키오스크 잠금', 파일: 'kiosk-guard.mjs', 자리: ROOT },
  { 이름: '글꼴 심기', 파일: 'font-pretendard.mjs', 자리: ROOT },
  { 이름: '소음측정기 문구', 파일: 'fix-noise-labels.mjs', 자리: ROOT },
  { 이름: '그림판 내보내기 이름', 파일: 'fix-paint-share.mjs', 자리: ROOT },
  { 이름: '사다리 공정하게', 파일: 'fix-ladder-fairness.mjs', 자리: ROOT },
  { 이름: '첫 화면에 퀴즈 카드', 파일: 'add-nav-card.mjs', 자리: ROOT },

  // ── 퀴즈 쪽만 ──
  { 이름: '퀴즈 키오스크 잠금', 파일: 'kiosk-guard.mjs', 자리: QUIZ, 퀴즈: true },
  { 이름: '퀴즈 글꼴 심기', 파일: 'font-pretendard.mjs', 자리: QUIZ, 퀴즈: true },
  { 이름: '퀴즈 첫화면 키보드', 파일: 'fix-card-keyboard.mjs', 자리: QUIZ, 퀴즈: true },
  { 이름: '한 문제에 한 번만 답하기', 파일: 'fix-double-score.mjs', 자리: QUIZ, 퀴즈: true },
  { 이름: '퀴즈 첫화면 별 반짝임', 파일: 'fix-star-glow.mjs', 자리: QUIZ, 퀴즈: true },
  { 이름: '퀴즈 오프라인 등록', 파일: 'fix-quiz-offline.mjs', 자리: QUIZ, 퀴즈: true },
];

/* 문항 «내용» 을 고치는 스크립트들은 여기서 돌리지 않습니다.
 * (fix-blanks · fix-proverbs · fix-found-issues · content-fixes · install-questions …)
 * 화면에 덧붙이는 것과 달리 자료 자체를 바꾸는 것이라, 언제 돌려야 하는지가
 * 다르고 두 번 돌리면 안 되는 것도 있습니다. 퀴즈 문항을 새로 받아 왔다면
 * 그때는 사람이 판단해서 돌려야 합니다. QA.md 에 적어 두었습니다. */

console.log('■ 손으로 넣은 고침을 다시 입힙니다');
console.log(흐리게('  (여러 번 돌려도 결과는 같습니다. 이미 되어 있으면 그냥 넘어갑니다)'));
console.log('');

let 성공 = 0;
const 실패 = [];
for (const 것 of 목록) {
  if (것.퀴즈 && !퀴즈있나) continue;
  const 스크립트 = path.join(것.자리, 'scripts', 것.파일);
  if (!fs.existsSync(스크립트)) {
    console.log(`  ${빨강('✗')} ${것.이름.padEnd(20)} ${흐리게('스크립트가 없습니다: ' + path.relative(ROOT, 스크립트))}`);
    실패.push(것.이름);
    continue;
  }
  try {
    const env = { ...process.env };
    if (것.base) env.BASE = QUIZ; else delete env.BASE;
    const 결과 = execFileSync(process.execPath, [스크립트], {
      cwd: 것.자리, env, encoding: 'utf8', stdio: 'pipe', maxBuffer: 16 * 1024 * 1024,
    });
    /* 스크립트가 마지막에 남기는 «몇 개 넣었는지» 한 줄만 보여 줍니다 */
    const 요약 = 결과.trim().split('\n').filter((l) => /개|완료|넣음|고침/.test(l)).pop() || '';
    console.log(`  ${초록('✓')} ${것.이름.padEnd(20)} ${흐리게(요약.trim().slice(0, 70))}`);
    성공++;
  } catch (e) {
    console.log(`  ${빨강('✗')} ${것.이름.padEnd(20)} ${흐리게(String(e.stderr || e.message).trim().split('\n').pop())}`);
    실패.push(것.이름);
  }
}

/* 화면을 건드렸으니 오프라인 목록도 다시 만들어야 합니다.
 * 이걸 빠뜨리면 «고쳤는데 보드에서는 옛 화면» 이 됩니다. */
console.log('');
console.log('■ 오프라인 저장 목록 다시 만들기');
for (const [곳, 있나] of [[ROOT, true], [QUIZ, 퀴즈있나]]) {
  if (!있나) continue;
  const s = path.join(곳, 'scripts', 'make-sw.mjs');
  if (!fs.existsSync(s)) continue;
  try {
    const out = execFileSync(process.execPath, [s], { cwd: 곳, encoding: 'utf8', stdio: 'pipe' });
    console.log(`  ${초록('✓')} ${(곳 === ROOT ? '수업도우미' : '퀴즈').padEnd(20)} ${흐리게(out.trim())}`);
  } catch (e) {
    console.log(`  ${빨강('✗')} ${(곳 === ROOT ? '수업도우미' : '퀴즈').padEnd(20)} ${흐리게(String(e.stderr || e.message).trim())}`);
    실패.push('오프라인 목록');
  }
}

console.log('');
if (실패.length) {
  console.log(빨강(`${성공}개는 됐지만 ${실패.length}개가 안 됐습니다: ${실패.join(', ')}`));
  console.log('위 메시지를 그대로 알려 주세요.');
  process.exit(1);
}
console.log(초록(`${성공}개 고침을 모두 다시 입혔습니다.`));
console.log(흐리게('이어서 node scripts/check-fixes.mjs 로 빠진 것이 없는지 확인할 수 있습니다.'));
