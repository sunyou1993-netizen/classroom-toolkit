#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo ""
echo "  수업도우미 툴킷 — 앱 10개 다시 가져오기"
echo ""
echo "  AI Studio 에서 앱을 고치고 GitHub 에 저장한 뒤 이걸 실행하면,"
echo "  원본 저장소 10개를 최신으로 받아와 오프라인 패치를 자동으로 입히고"
echo "  전부 다시 빌드해서 이 폴더에 갈아끼웁니다. (2~3분 정도 걸려요)"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  ❌ node 가 설치되어 있지 않습니다."
  echo "     https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행해 주세요."
  echo ""
  read -n 1 -s -r -p "  아무 키나 누르면 종료합니다..."
  exit 1
fi

node "scripts/build-all.mjs"
CODE=$?

echo ""
if [ $CODE -eq 0 ]; then
  echo "  ✅ 다시 만들기 완료!"
  echo "  이어서 \"1. 깃허브에 올리기\" 를 실행하면 배포됩니다."
else
  echo "  ❌ 일부 실패 (코드 $CODE) — 위 메시지를 클로드에게 그대로 보여주세요."
fi
echo ""
read -n 1 -s -r -p "  아무 키나 누르면 종료합니다..."
echo ""
