# 수업도우미 단독 실행 프로그램 (윈도우)

툴킷 전체를 exe 파일 하나에 넣고, 실행하면 `127.0.0.1` 의 빈 포트로 스스로에게
서빙한 뒤 Edge 를 앱 모드(주소창 없는 창)로 띄웁니다.
설치·인터넷·외부 서버가 필요 없고, 창을 닫으면 서버도 함께 종료됩니다.

AI보드 앱(`claix_aiboard`) 소스에 접근할 수 없는 동안 쓰는 방식입니다.
나중에 앱 안으로 옮길 때는 여기 `main.go` 의 정적 서버 부분을 Dart 로 옮기고
(기획서의 `shelf` 예시) 웹뷰가 그 주소를 열면 됩니다. 툴킷 폴더는 그대로 씁니다.

## 빌드

Go 1.21 이상이면 됩니다. 윈도우 PC 없이 리눅스·맥에서 그대로 만들 수 있습니다.
**저장소 루트에서 한 줄이면 됩니다.**

```bash
bash launcher/build.sh          # 윈도우 exe
bash launcher/build.sh mac      # 맥 실행파일
bash launcher/build.sh both     # 둘 다
```

이 스크립트가 하는 일:

1. 저장소의 화면 파일을 `launcher/toolkit/` 으로 모읍니다
   (`scripts/`, `download/`, 보고서 pdf·docx, 문항집 xlsx·html 은 뺍니다 —
   손으로 복사하면 이 문서들까지 exe 안에 들어가 2MB 넘게 불어납니다)
2. **꼭 필요한 파일이 다 들어갔는지 확인하고**, 하나라도 없으면 멈춥니다
   (특히 `quiz/fonts/HanjaSubset.woff2` — 이게 빠지면 사자성어 한자가 네모로 나옵니다)
3. **교가를 exe 밖으로 뺍니다** (아래 「학교마다 다른 교가」 참고).
   어느 학교 교가도 exe 에 담기지 않았는지 확인하고, 남아 있으면 멈춥니다
4. PNG 용량을 줄입니다(`pyoxipng` 가 있을 때만)
5. 실행 파일을 저장소 루트에 만듭니다

`launcher/toolkit/` 는 빌드할 때 만들어지는 복사본이라 저장소에 넣지 않습니다
(`.gitignore` 에 있습니다). 그래서 **빌드 전에 이 스크립트를 꼭 돌려야 합니다.**

3번 때문에 `node` 가 필요합니다. 없으면 스크립트가 멈춥니다 —
그냥 넘어가면 남의 학교 교가가 exe 에 담길 수 있기 때문입니다.

## 학교마다 다른 교가

교가는 학교마다 다르고, 가사와 곡에는 **작사·작곡가의 저작권**이 있습니다.
A학교에 배포한 프로그램에 B학교 교가가 들어 있으면 안 됩니다.

그래서 **교가는 exe 안에 넣지 않습니다.** exe 는 모든 학교가 똑같은 것을 쓰고,
교가만 exe 옆에 놓인 글 파일 하나로 정합니다.

```
보드의 폴더
├─ 수업도우미.exe      ← 모든 학교가 같은 파일
└─ 교가.txt            ← 학교마다 다른 파일
```

- `교가.txt` **있음** → 그 학교 교가로 교가 퀴즈가 나옵니다
- `교가.txt` **없음** → 교가 퀴즈가 목록에서 사라지고, 주소로 들어가도 돌려보냅니다

프로그램은 켤 때 이 파일을 읽어 **화면으로 내보낼 때만** 갈아 끼웁니다.
exe 파일 자체는 건드리지 않습니다. 그래서 교가를 바꾸려면 이 글 파일만 고치고
프로그램을 껐다 켜면 됩니다. 새 exe 를 만들 필요가 없습니다.

### 교가.txt 만들기

저장소에 학교별 파일을 두고, 거기서 뽑아 씁니다.

```bash
cd quiz
node scripts/make-song-txt.mjs                    # 어떤 학교가 있는지 보기
node scripts/make-song-txt.mjs 서울신답초등학교     # 한 곳
node scripts/make-song-txt.mjs 전체                # 있는 학교 전부
```

`quiz/scripts/out/교가-○○초등학교.txt` 가 생깁니다. 보드에 넣을 때 이름을
`교가.txt` 로 바꾸면 됩니다.

새 학교는 `quiz/scripts/schools/_새학교_양식.json` 을 복사해서 만듭니다.

### 선생님이 직접 고칠 때

프로그램은 자기 옆에 이런 파일들을 만들어 둡니다.

| 파일 | 무엇 |
|---|---|
| `교가-예시.txt` | 처음 켤 때 자동으로 생깁니다. 이름을 `교가.txt` 로 바꾸고 고치면 됩니다 |
| `교가-확인.txt` | **잘 됐는지 알려 주는 파일.** 켤 때마다 다시 씁니다 |

교가가 안 나오면 `교가-확인.txt` 를 열어 보면 이유가 적혀 있습니다.
가장 흔한 실수는 **인코딩**입니다 — 메모장에서 「다른 이름으로 저장」을 누르고
아래쪽 `인코딩` 을 **UTF-8** 로 바꿔 저장해야 합니다.
(옛 ANSI/완성형으로 저장하면 못 읽고, 그때는 교가를 숨긴 채 안내만 남깁니다.)

### 규칙이 두 곳에 있습니다 — 시험으로 묶어 두었습니다

빈칸 고르기·초성·여벌 타일 규칙이 두 군데에 있습니다.

- `quiz/scripts/set-school-song.mjs` — 저장소에 미리 넣어 둘 때
- `launcher/schoolsong.go` — exe 가 `교가.txt` 를 읽을 때

한쪽만 고치면 학교마다 화면이 달라집니다. `go test ./...` 가 두 결과를
글자 하나까지 맞대어 보므로, 한쪽만 고치면 시험이 깨집니다.

### 알아둘 점

- 지금 exe 는 약 **22MB** 입니다. 담긴 PNG 가 7.7MB 라 더 줄이기 어렵습니다.
- `instruments/assets/piano_bear_mascot.png` 는 **확장자만 .png 이고 실제로는 JPEG** 입니다.
  어느 화면에서도 쓰지 않는 파일이라 그대로 두었습니다(548KB).
- 어느 화면에서도 부르지 않는 그림이 7개(약 1MB) 있습니다. 지워도 되지만
  개발사 원본이라 손대지 않았습니다.


### 용량 줄이기(선택)

exe 는 20MB 를 넘지 않는 게 좋습니다. 그림 품질은 그대로 두고 파일만 줄입니다.

```bash
pip install pyoxipng --break-system-packages
python3 -c "
import oxipng, glob
for f in glob.glob('launcher/toolkit/**/*.png', recursive=True):
    oxipng.optimize(f, level=4, strip=oxipng.StripChunks.safe())
"
```

## 파일

| 파일 | 역할 |
|---|---|
| `main.go` | 내장 파일 서빙, 포트 잡기, 브라우저 종료까지 대기 |
| `schoolsong.go` | exe 옆 `교가.txt` 를 읽어 교가 부분만 갈아 끼우기 |
| `schoolsong_test.go` | 위 규칙이 node 스크립트와 같은 결과를 내는지 대조 |
| `browser_windows.go` | Edge·Chrome 을 앱 모드로 실행 (윈도우 전용) |
| `browser_darwin.go` | 맥에서 앱 모드로 실행 |
| `browser_other.go` | 리눅스에서는 서버만 (테스트용) |

## 알아둘 점

- **MIME 타입을 직접 지정합니다.** 윈도우는 레지스트리 설정에 따라 `.js` 를
  `text/plain` 으로 돌려주는 경우가 있고, 그러면 ES 모듈이 통째로 차단됩니다.
- **`--user-data-dir` 로 전용 프로필을 씁니다.** 그래야 이 창이 독립 프로세스가 되어
  창을 닫는 시점을 알 수 있습니다(= 서버 종료).
- **`loopbackIPv4` 에만 바인딩합니다.** 같은 교실 네트워크의 다른 기기에서
  접근할 수 없고, 윈도우 방화벽 경고도 뜨지 않습니다.
- **코드 서명이 없습니다.** 처음 실행할 때 SmartScreen 경고가 뜹니다.
  정식 배포 시 회사 인증서로 서명하면 사라집니다.
- **퀴즈의 오프라인 캐시(`quiz/sw.js`)도 껐습니다.** exe 안에서는 파일이 이미
  전부 들어 있어 캐시가 필요 없고, 켜 두면 `교가.txt` 를 고쳐도 브라우저가
  담아 둔 예전 교가를 계속 보여 줍니다(exe 가 그대로면 브라우저 프로필도
  그대로라 캐시가 저절로 비워지지 않습니다).

## 아이콘

로고 원본은 `logo.svg` 입니다. `icotool.py` 로 아래 세 가지를 만듭니다.

| 결과물 | 쓰이는 곳 |
|---|---|
| `rsrc_windows_amd64.syso` | 윈도우 exe 아이콘 (같은 폴더에 두면 `go build` 가 자동으로 넣습니다) |
| `AppIcon.icns` | 맥 앱 아이콘 (`수업도우미.app/Contents/Resources/`) |
| `favicon.ico` | 웹 툴킷 파비콘 (저장소 루트) |

```bash
for s in 16 24 32 48 64 128 192 256 512 1024; do rsvg-convert -w $s -h $s logo.svg -o png-bg-$s.png; done
python3 -c "
from PIL import Image; import icotool
imgs=[Image.open(f'png-bg-{s}.png').convert('RGBA') for s in (16,24,32,48,64,128,256)]
open('favicon.ico','wb').write(icotool.build_ico(imgs))
open('rsrc_windows_amd64.syso','wb').write(icotool.build_syso(imgs))
"
```
