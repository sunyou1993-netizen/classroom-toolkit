AI Studio 코드 편집기에 그대로 붙여 넣을 «배열 본문» 입니다.

  arr_env.txt   환경보호   → js/main.js 의 questions: [ ... ] 를 통째로 교체
  arr_safe.txt  안전       → js/main.js 의 questions: [ ... ] 를 통째로 교체
  arr_vio.txt   학교폭력    → js/main.js 의 questions: [ ... ] 를 통째로 교체
  arr_pv.txt    속담맞추기  → js/proverbs_data.js 의 RAW_PROVERB_DATA = [ ... ] 를 교체
  arr_fc.txt    사자성어    → js/proverbs_data.js 의 RAW_IDIOMS_DATA = [ ... ] 를 교체

이 파일들은 quiz/scripts/sync-to-source.mjs 가 만드는 것과 같은 내용입니다.
소스 저장소(claix_quiz_*)를 직접 고칠 수 있으면 그 스크립트를 쓰는 편이 낫고,
AI Studio 화면에서 직접 고칠 때는 이 파일을 씁니다.
