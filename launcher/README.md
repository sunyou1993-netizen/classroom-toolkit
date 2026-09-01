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
3. PNG 용량을 줄입니다(`pyoxipng` 가 있을 때만)
4. 실행 파일을 저장소 루트에 만듭니다

`launcher/toolkit/` 는 빌드할 때 만들어지는 복사본이라 저장소에 넣지 않습니다
(`.gitignore` 에 있습니다). 그래서 **빌드 전에 이 스크립트를 꼭 돌려야 합니다.**

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
| `browser_windows.go` | Edge·Chrome 을 앱 모드로 실행 (윈도우 전용) |
| `browser_other.go` | 리눅스·맥에서는 서버만 (테스트용) |

## 알아둘 점

- **MIME 타입을 직접 지정합니다.** 윈도우는 레지스트리 설정에 따라 `.js` 를
  `text/plain` 으로 돌려주는 경우가 있고, 그러면 ES 모듈이 통째로 차단됩니다.
- **`--user-data-dir` 로 전용 프로필을 씁니다.** 그래야 이 창이 독립 프로세스가 되어
  창을 닫는 시점을 알 수 있습니다(= 서버 종료).
- **`loopbackIPv4` 에만 바인딩합니다.** 같은 교실 네트워크의 다른 기기에서
  접근할 수 없고, 윈도우 방화벽 경고도 뜨지 않습니다.
- **코드 서명이 없습니다.** 처음 실행할 때 SmartScreen 경고가 뜹니다.
  정식 배포 시 회사 인증서로 서명하면 사라집니다.

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
