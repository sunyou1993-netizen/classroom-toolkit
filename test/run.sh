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

run_one() {
  local file="$1" name="$2"
  echo
  echo "════════════════════════════════════════════════════════════"
  echo "  $name"
  echo "════════════════════════════════════════════════════════════"
  local out
  out=$(node "$file" 2>&1)
  local code=$?
  echo "$out"
  if echo "$out" | grep -q "(건너뜀)"; then SKIP=$((SKIP+1));
  elif [ $code -eq 0 ]; then PASS=$((PASS+1));
  else FAIL=$((FAIL+1)); FAILED="$FAILED\n   ✗ $name"; fi
}

echo "수업도우미 검사를 시작합니다  ($(date '+%Y-%m-%d %H:%M'))"

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
if [ $SKIP -gt 0 ]; then
  echo "  ✓ 돌린 검사는 모두 통과했습니다. (건너뛴 것 $SKIP 개)"
else
  echo "  ✓ 모두 통과했습니다."
fi
