#!/usr/bin/env bash
# 수업도우미 검사 — 무언가 고친 뒤에 이 한 줄만 돌리면 됩니다.
#
#   bash test/run.sh
#
# 브라우저가 없어도 되는 검사(문항 데이터·한자 글꼴·사다리 등)는 언제나 돌아갑니다.
# 화면을 실제로 열어 보는 검사는 브라우저(Playwright)가 있을 때만 돌아가고,
# 없으면 건너뛰면서 준비하는 법을 알려 줍니다.
#
# (변수 이름을 영어로 쓴 이유: bash 는 한글 변수 이름을 받지 못합니다)
set -uo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ node 가 없습니다. https://nodejs.org 에서 설치해 주세요."
  exit 1
fi

PASS=0; FAIL=0; SKIP=0
FAILED=""

FLAKY=""

# 검사 하나를 돌립니다.
#
# 실패하면 «한 번만» 다시 돌려 봅니다. 왜냐하면:
#   브라우저를 여는 검사가 여럿 겹치면 가끔 한 개가 시간 안에 안 열립니다.
#   실제로 두 번 겪었는데(6번·8번), 따로 돌리면 둘 다 전부 통과했습니다.
#   이런 «흔들리는 실패» 를 그대로 두면 «또 그거겠지» 하고 진짜 실패까지
#   흘려보내게 됩니다. 그게 더 위험합니다.
#
# 다만 조용히 넘기지는 않습니다. 다시 돌려서 통과하면 «흔들렸다» 고
# 마무리에 남깁니다. 두 번 다 실패하면 그냥 실패입니다.
run_one() {
  local file="$1" name="$2"
  echo
  echo "════════════════════════════════════════════════════════════"
  echo "  $name"
  echo "════════════════════════════════════════════════════════════"
  local out code
  out=$(node "$file" 2>&1); code=$?
  echo "$out"
  if echo "$out" | grep -q "(건너뜀)"; then SKIP=$((SKIP+1)); return; fi
  if [ $code -eq 0 ]; then PASS=$((PASS+1)); return; fi

  echo
  echo "   … 실패했습니다. 흔들린 것인지 보려고 한 번만 다시 돌립니다."
  sleep 3
  out=$(node "$file" 2>&1); code=$?
  if [ $code -eq 0 ]; then
    echo "   ⚠ 다시 돌리니 통과했습니다 — 흔들리는 검사입니다(문제는 아닙니다)."
    PASS=$((PASS+1)); FLAKY="$FLAKY\n   ⚠ $name (처음엔 실패, 다시 돌리니 통과)"
  else
    echo "$out"
    FAIL=$((FAIL+1)); FAILED="$FAILED\n   ✗ $name"
  fi
}

echo "수업도우미 검사를 시작합니다  ($(date '+%Y-%m-%d %H:%M'))"

# 0번으로 두는 이유: 손으로 넣은 고침이 빠져 있으면 아래 검사들이 «통과» 해도
# 학교에 나가는 것은 고치기 전 화면입니다. 그래서 제일 먼저 봅니다.
run_one "$ROOT/scripts/check-fixes.mjs" "0. 손으로 넣은 고침이 다 붙어 있는가"

run_one "$HERE/t01-questions.mjs"      "1. 문항 데이터 (원본과 화면이 같은가)"
run_one "$HERE/t02-hanja-font.mjs"     "2. 한자 글꼴 (빠진 글자가 없는가)"
run_one "$HERE/t03-proverb-idiom.mjs"  "3. 속담·사자성어 데이터"
run_one "$HERE/t04-song-and-build.mjs" "4. 교가·배포 준비"
run_one "$HERE/t05-ladder.mjs"         "5. 사다리 공정성"
run_one "$HERE/t06-screens.mjs"        "6. 화면 열어 보기            [브라우저]"
run_one "$HERE/t07-quiz-play.mjs"      "7. 퀴즈 풀어 보기            [브라우저]"
run_one "$HERE/t08-accessibility.mjs"  "8. 접근성 (대비·움직임·색)    [브라우저]"

# 실행 파일(Go) 검사는 go 가 있을 때만
echo
echo "════════════════════════════════════════════════════════════"
echo "  9. 실행 파일 만드는 코드 (Go)"
echo "════════════════════════════════════════════════════════════"
if command -v go >/dev/null 2>&1; then
  if (cd "$ROOT/launcher" && go test ./... 2>&1); then PASS=$((PASS+1));
  else FAIL=$((FAIL+1)); FAILED="$FAILED\n   ✗ 9. 실행 파일 만드는 코드 (Go)"; fi
else
  echo "   (건너뜀) go 가 없습니다. https://go.dev 에서 설치하면 이 검사도 돌아갑니다."
  SKIP=$((SKIP+1))
fi

# ── 저장소가 너무 무거워지지 않았는지 (조용한 알림) ──────────────
#
# 실행 파일(19MB)이 판마다 저장소 기록에 쌓입니다. 지금은 문제가 아닙니다
# (깃허브 권장 최대는 10GB). 다만 아무도 안 보고 있으면 어느 날 갑자기
# «올리기가 왜 이렇게 느려요?» 가 되므로, 넘칠 때만 한 줄 알려 줍니다.
if [ -d "$ROOT/.git" ]; then
  GITMB=$(du -sm "$ROOT/.git" 2>/dev/null | cut -f1)
  if [ -n "${GITMB:-}" ] && [ "$GITMB" -ge 2000 ]; then
    echo
    echo "  ⚠ 저장소 기록이 ${GITMB}MB 입니다 (깃허브 권장 최대 10GB)."
    echo "    실행 파일이 판마다 쌓여서 그렇습니다. 올리기가 느려지면"
    echo "    «실행 파일을 저장소 대신 깃허브 릴리스로 옮기기» 를 클로드에게 물어보세요."
  fi
fi

echo
echo "════════════════════════════════════════════════════════════"
echo "  마무리"
echo "════════════════════════════════════════════════════════════"
echo "  통과 $PASS · 실패 $FAIL · 건너뜀 $SKIP"
if [ $FAIL -gt 0 ]; then
  echo -e "$FAILED"
  echo
  echo "  ✗ 고쳐야 할 것이 있습니다. 위에서 ✗ 표시를 찾아보세요."
  exit 1
fi
if [ -n "$FLAKY" ]; then
  echo -e "$FLAKY"
  echo "     (두 번째에 통과한 것입니다. 화면을 여는 검사가 여럿 겹치면 가끔 이럽니다)"
fi
if [ $SKIP -gt 0 ]; then
  echo "  ✓ 돌린 검사는 모두 통과했습니다. (건너뛴 것 $SKIP 개)"
else
  echo "  ✓ 모두 통과했습니다."
fi
