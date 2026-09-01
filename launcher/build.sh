#!/usr/bin/env bash
# 수업도우미 실행 파일 만들기 (윈도우 exe / 맥 실행파일)
#
# 왜 이 스크립트가 있나:
#   README 에 적힌 rsync 를 손으로 치면 빠뜨리기 쉽고, 저장소에 쌓인 문서 파일
#   (보고서 pdf·docx, 문항집 xlsx·html)까지 exe 안에 딸려 들어갑니다.
#   지금 그 문서들만 2MB 가 넘습니다. exe 는 20MB 를 넘지 않는 게 좋습니다.
#
# 쓰는 법 — 저장소 루트에서:
#   bash launcher/build.sh            (윈도우 exe)
#   bash launcher/build.sh mac        (맥 실행파일)
#   bash launcher/build.sh both
#
# (변수 이름을 영어로 쓴 이유: bash 는 한글 변수 이름을 받지 못합니다.
#  설명은 한글로 달아 두었습니다.)
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)    # launcher 폴더
ROOT=$(cd "$HERE/.." && pwd)                          # 저장소 루트
TARGET=${1:-windows}

echo "■ 1) 화면 파일을 launcher/toolkit/ 으로 모읍니다"
rm -rf "$HERE/toolkit"
mkdir -p "$HERE/toolkit"

# 화면에 필요한 것만 담습니다. 아래 목록에 없는 것은 exe 에 들어가지 않습니다.
# (rsync 가 없는 곳에서도 되도록 tar 로 옮깁니다. 맥·리눅스 어디서나 됩니다.)
( cd "$ROOT" && tar cf - \
    --exclude='./launcher' \
    --exclude='scripts' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='download' \
    --exclude='*.command' \
    --exclude='README.md' \
    --exclude='./수업도우미' --exclude='./수업도우미.exe' --exclude='*.exe' \
    --exclude='*.xlsx' --exclude='*.docx' --exclude='*.pdf' \
    --exclude='문항집.html' --exclude='문항근거.html' --exclude='문항근거.md' \
    . ) | ( cd "$HERE/toolkit" && tar xf - )

# 저번에 만든 실행 파일이 다시 담기면 exe 가 두 배로 불어납니다(22MB → 43MB).
# 위 --exclude 로 막았지만, 이름이 바뀌어도 걸리도록 여기서 한 번 더 확인합니다.
BIG=$(find "$HERE/toolkit" -type f -size +5M 2>/dev/null)
if [ -n "$BIG" ]; then
  echo "   ✗ 5MB 가 넘는 파일이 들어갔습니다. 실행 파일이 섞인 것 같습니다:"
  echo "$BIG" | sed 's|^|     |'
  echo "   → 멈춥니다"; exit 1
fi

NFILES=$(find "$HERE/toolkit" -type f | wc -l | tr -d ' ')
NQUIZ=$(find "$HERE/toolkit/quiz" -type f 2>/dev/null | wc -l | tr -d ' ')
SIZE=$(du -sh "$HERE/toolkit" | cut -f1)
echo "   파일 $NFILES 개 (그중 퀴즈 $NQUIZ 개) · $SIZE"

# 꼭 있어야 하는 것들이 실제로 들어갔는지 확인합니다.
MISSING=0
for f in index.html app.html sw.js \
         quiz/index.html quiz/sw.js \
         quiz/fonts/PretendardVariable.woff2 \
         quiz/fonts/HanjaSubset.woff2 ; do
  if [ ! -f "$HERE/toolkit/$f" ]; then echo "   ✗ 빠짐: $f"; MISSING=1; fi
done
if [ "$MISSING" = "1" ]; then echo "   → 빠진 파일이 있어 멈춥니다"; exit 1; fi
echo "   ✓ 꼭 필요한 파일 모두 있음 (한자 글꼴 포함)"

echo
echo "■ 1-2) 교가를 exe 밖으로 빼기"
# 교가는 학교마다 다르고 가사에 저작권이 있어, exe 안에 넣지 않습니다.
# exe 옆의 '교가.txt' 를 켜질 때 읽습니다(launcher/schoolsong.go 참고).
# 여기서는 exe 에 들어갈 사본만 자리표시자로 바꿉니다. 저장소 원본은 그대로입니다.
QUIZ="$HERE/toolkit/quiz"
[ -d "$QUIZ" ] || QUIZ="$HERE/toolkit"          # 퀴즈가 루트에 바로 있는 구성도 대비
SETSONG="$ROOT/quiz/scripts/set-school-song.mjs"
[ -f "$SETSONG" ] || SETSONG="$ROOT/scripts/set-school-song.mjs"
if [ ! -f "$SETSONG" ]; then
  echo "   ✗ set-school-song.mjs 를 찾지 못했습니다"; exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "   ✗ node 가 없어 교가를 뺄 수 없습니다."
  echo "     이대로 만들면 남의 학교 교가가 exe 에 담길 수 있어 멈춥니다."
  echo "     https://nodejs.org 에서 node 를 설치한 뒤 다시 실행해 주세요."
  exit 1
fi
( cd "$QUIZ" && node "$SETSONG" 런처 ) | sed 's/^/   /'

# 정말 빠졌는지 확인합니다. 학교 이름이 남아 있으면 멈춥니다.
LEFT=$(grep -ao 'schoolName:"[^"]*"' "$QUIZ"/song/assets/*.js 2>/dev/null | head -1)
case "$LEFT" in
  *'"우리 학교"'*) echo "   ✓ exe 안에는 어느 학교 교가도 들어가지 않습니다" ;;
  *) echo "   ✗ 교가가 남아 있습니다: $LEFT"; echo "   → 멈춥니다"; exit 1 ;;
esac
if grep -qa 'id:"school"' "$QUIZ"/assets/*.js 2>/dev/null; then
  echo "   ✓ 교가 카드는 켜 둠 (교가.txt 가 없으면 프로그램이 알아서 뺍니다)"
else
  echo "   ✗ 교가 카드가 없습니다. 이러면 교가.txt 를 넣어도 안 보입니다"; exit 1
fi

echo
echo "■ 1-3) 한자 글꼴에 빠진 글자가 없는지"
# 사자성어의 한자를 고치고 글꼴을 다시 만들지 않으면, 그 글자만 보드에서
# 네모(□)로 나오거나 서체가 달라 보입니다. 눈으로는 잡히지 않아 글자 코드로 봅니다.
CHECKHANJA="$ROOT/quiz/scripts/check-hanja-font.mjs"
[ -f "$CHECKHANJA" ] || CHECKHANJA="$ROOT/scripts/check-hanja-font.mjs"
if [ -f "$CHECKHANJA" ]; then
  ( cd "$QUIZ" && node "$CHECKHANJA" ) | sed 's/^/   /' || {
    echo "   → 멈춥니다. python3 scripts/make-hanja-font.py 로 글꼴을 다시 만드세요"; exit 1; }
else
  echo "   (검사 스크립트가 없어 건너뜁니다)"
fi

echo
echo "■ 2) 그림 파일 용량 줄이기 (pyoxipng 가 있을 때만)"
if python3 -c "import oxipng" 2>/dev/null; then
  python3 - "$HERE/toolkit" <<'PY'
import oxipng, glob, os, sys
d = sys.argv[1]
before = after = 0
skipped = []
for f in glob.glob(os.path.join(d, '**', '*.png'), recursive=True):
    # 확장자만 .png 이고 실제로는 다른 형식인 파일이 있습니다
    # (instruments/assets/piano_bear_mascot.png 는 사실 JPEG 입니다).
    # 그런 파일에 손대면 오류가 나므로 건너뜁니다.
    with open(f, 'rb') as fh:
        if fh.read(8) != b'\x89PNG\r\n\x1a\n':
            skipped.append(os.path.relpath(f, d)); continue
    size = os.path.getsize(f)
    try:
        oxipng.optimize(f, level=4, strip=oxipng.StripChunks.safe())
    except Exception as e:
        skipped.append(os.path.relpath(f, d) + f' ({e})'); continue
    before += size; after += os.path.getsize(f)
print(f'   PNG {before/1e6:.1f}MB → {after/1e6:.1f}MB')
for x in skipped:
    print(f'   · 건너뜀(PNG 가 아님): {x}')
PY
else
  echo "   (없어서 건너뜁니다. 줄이려면: pip install pyoxipng --break-system-packages)"
fi

echo
echo "■ 3) 실행 파일 만들기"
cd "$HERE"
build_one() {
  local goos=$1 goarch=$2 name=$3 flags=$4
  GOOS=$goos GOARCH=$goarch CGO_ENABLED=0 \
    go build -trimpath -ldflags "$flags" -o "$ROOT/$name" .
  echo "   ✓ $name  $(du -h "$ROOT/$name" | cut -f1)"
}
case "$TARGET" in
  windows) build_one windows amd64 "수업도우미.exe" "-s -w -H=windowsgui" ;;
  mac)     build_one darwin  arm64 "수업도우미"      "-s -w" ;;
  both)    build_one windows amd64 "수업도우미.exe" "-s -w -H=windowsgui"
           build_one darwin  arm64 "수업도우미"      "-s -w" ;;
  *) echo "   쓰는 법: bash launcher/build.sh [windows|mac|both]"; exit 1 ;;
esac

echo
echo "다 됐습니다. 저장소 루트에 생긴 파일을 보드로 옮기면 됩니다."
echo "(20MB 를 넘으면 위의 '그림 파일 용량 줄이기'를 먼저 돌려 보세요)"
