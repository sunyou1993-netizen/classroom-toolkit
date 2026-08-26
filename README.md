# 수업도우미 (Classroom Helper) — 오프라인 빌드

인터넷·서버 없이 동작하는 수업도우미 전체 묶음입니다.
이 폴더 하나가 전부이며, 정적 파일만 들어 있습니다.

## 앱을 고쳤을 때 — 다시 만들기

AI Studio 에서 앱을 고치고 GitHub 에 저장했다면, 이 폴더에서:

1. `0. 앱 다시 가져오기` 더블클릭 (2~3분)
   → 원본 저장소 10개를 최신으로 받아 오프라인 패치를 자동으로 입히고, 빌드해서 이 폴더에 갈아끼웁니다.
2. GitHub Desktop 에서 Commit → Push origin
   → 1분쯤 뒤 배포 주소에 반영됩니다.

터미널을 쓰신다면 1번 대신 `node scripts/build-all.mjs` 로 같은 일이 됩니다.
특정 앱만 다시 만들려면 `node scripts/build-all.mjs ladder stopwatch` 처럼 뒤에 이름을 붙이세요.

오프라인 패치의 실제 내용은 `scripts/patches/*.patch` 에 들어 있고,
어떤 저장소가 어느 폴더로 들어가는지는 `scripts/apps.json` 에 적혀 있습니다.

## 구성

```
index.html          허브 (도구 9개 목록)
timer/              타이머
pomodoro/           뽀모도로 타이머
stopwatch/          스톱워치
worldclock/         세계시간
paint/              그림판(판서)
noise/              소음측정기
picker/             발표자 선정
instruments/        피아노 연주
ladder/             사다리

fonts/              Pretendard 등 웹폰트 (로컬)
shared/             세계지도 SVG, 국기 66종, 아이콘, 앱 아이콘
manifest.webmanifest / sw.js   오프라인 캐시용
```

## 여는 방법

`file://` 로는 열리지 않습니다. 브라우저 보안 정책상 ES 모듈이 차단되기 때문입니다.
**이 폴더를 HTTP 루트로 서빙**해야 합니다.

- 테스트: `npx serve .` 또는 `python3 -m http.server 8000`
- AI보드 앱(Flutter): 앱 안에서 `127.0.0.1` 루프백으로 이 폴더를 서빙하고 웹뷰로 엽니다.
- 웹 배포: 이 폴더를 사이트 루트로 올리면 됩니다.

## 외부 의존성

없습니다. 확인 방법:

```
grep -rE "https?://" --include=*.js --include=*.css --include=*.html . | grep -v w3.org
```

CDN 폰트, 지도 타일, 국기 이미지, 아이콘 라이브러리를 전부 로컬 파일로 바꿨습니다.

## 오프라인 캐시

`sw.js` 가 139개 파일을 전부 미리 받아둡니다.
브라우저에서 한 번 열면 그 뒤로는 서버가 꺼져도 동작합니다.
파일을 수정한 뒤에는 `scripts/make-sw.mjs` 를 다시 돌려 `sw.js` 를 갱신해야 합니다.
