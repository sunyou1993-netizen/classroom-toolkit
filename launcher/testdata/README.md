# 대조용 자료

`schoolsong_test.go` 가 쓰는 파일입니다.

| 파일 | 무엇 |
|---|---|
| `교가-서울신답초등학교.txt` | 보드에 넣는 교가 파일과 같은 모양 |
| `verses-node-서울신답초등학교.json` | 같은 교가를 **node 쪽**(`quiz/scripts/set-school-song.mjs`)이 만든 결과 |

## 왜 필요한가

같은 규칙(빈칸 고르기·초성·여벌 타일)이 두 곳에 있습니다.

- `quiz/scripts/set-school-song.mjs` — 저장소에 미리 넣어 둘 때
- `launcher/schoolsong.go` — exe 옆의 `교가.txt` 를 읽을 때

한쪽만 고치면 학교마다 화면이 달라집니다. 시험이 두 결과를 맞대어 봅니다.

## 다시 만들려면

```
cd quiz
node scripts/make-song-txt.mjs 서울신답초등학교
```
로 txt 를 만들고, 그 학교 교가를 넣은 뒤 `song/assets/*.js` 안의
`verses:[...]` 부분을 json 으로 저장하면 됩니다.
