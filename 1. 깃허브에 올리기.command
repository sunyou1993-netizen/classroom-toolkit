#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo ""
echo "  수업도우미 → GitHub 업로드"
echo "  저장소: https://github.com/sunyou1993-netizen/classroom-toolkit"
echo ""
echo "  GitHub 로그인 창이 뜨면 승인해 주세요."
echo "  (사용자 이름을 물으면 sunyou1993-netizen 입력,"
echo "   비밀번호를 물으면 GitHub 비밀번호가 아니라 Personal Access Token 이 필요합니다.)"
echo ""

git push -u origin main
CODE=$?

echo ""
if [ $CODE -eq 0 ]; then
  echo "  ✅ 업로드 완료!"
  echo "  https://github.com/sunyou1993-netizen/classroom-toolkit"
else
  echo "  ❌ 업로드 실패 (코드 $CODE)"
  echo "  위 메시지를 클로드에게 그대로 보여주세요."
fi
echo ""
echo "  이 창은 닫으셔도 됩니다."
read -n 1 -s -r -p "  아무 키나 누르면 종료합니다..."
echo ""
