"""사자성어에 쓰이는 한자만 담은 작은 글꼴을 만듭니다.

왜 필요한가:
  제품에 담아 보내는 글꼴은 Pretendard 하나인데, Pretendard에는 한자가
  한 글자도 없습니다(글리프 14,336자 중 한자 0자). 그래서 지금은 한자가
  전부 보드 윈도우에 깔린 글꼴에 기대고 있습니다.
  보드는 Windows 10 IoT라 글꼴이 덜어내져 있을 수 있고, 그러면 사자성어
  144문항의 한자가 모두 네모(□)로 나옵니다.

어떻게:
  Noto Sans CJK KR(SIL 오픈폰트 라이선스, 상업적 이용 가능)에서
  실제로 쓰는 한자만 뽑아 작은 woff2 파일을 만듭니다.
  전체 글꼴은 수십 MB지만, 쓰는 글자만 남기면 100KB 안쪽입니다.

사용법: python3 scripts/make-hanja-font.py
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.getcwd()
번들폴더 = os.path.join(ROOT, "fourchar", "assets")
낼곳 = os.path.join(ROOT, "fonts", "HanjaSubset.woff2")

# ── 1. 실제로 쓰는 한자를 모읍니다 ──────────────────────────
글자 = set()
for p in glob.glob(os.path.join(번들폴더, "*.js")):
    s = open(p, encoding="utf-8").read()
    for m in re.finditer(r'hanja:"([^"]*)"', s):
        글자 |= set(m.group(1))

# 다른 게임에도 한자가 있으면 함께 담습니다(지금은 없지만 나중을 위해).
for 폴더 in ("proverb", "environment", "safe", "violence", "song", "assets"):
    d = os.path.join(ROOT, 폴더, "assets") if 폴더 != "assets" else os.path.join(ROOT, "assets")
    for p in glob.glob(os.path.join(d, "*.js")):
        s = open(p, encoding="utf-8").read()
        글자 |= {c for c in s if 0x4E00 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF}

# 호환 한자가 섞여 있어도 둘 다 담아 둡니다(정규화 전 파일도 깨지지 않게).
글자 = {c for c in 글자 if 0x4E00 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF}
print(f"쓰는 한자 {len(글자)}자")

# ── 2. 밑바탕 글꼴 찾기 ────────────────────────────────────
후보 = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]
밑바탕 = next((p for p in 후보 if os.path.exists(p)), None)
if not 밑바탕:
    found = glob.glob("/usr/share/fonts/**/NotoSansCJK*.ttc", recursive=True)
    밑바탕 = found[0] if found else None
if not 밑바탕:
    print("✗ Noto Sans CJK 를 찾지 못했습니다.", file=sys.stderr)
    sys.exit(1)
print("밑바탕:", 밑바탕)

# Noto Sans CJK 는 여러 지역 글꼴이 한 파일에 든 묶음(ttc)입니다.
# 한국어(KR)가 몇 번째인지 찾습니다.
from fontTools.ttLib import TTCollection  # noqa: E402

ttc = TTCollection(밑바탕, lazy=True)
번호 = 0
for i, f in enumerate(ttc.fonts):
    이름 = f["name"].getDebugName(1) or ""
    if "KR" in 이름 or "Korean" in 이름:
        번호 = i
        print(f"  한국어 글꼴: [{i}] {이름}")
        break

# ── 3. 쓰는 글자만 남기기 ─────────────────────────────────
os.makedirs(os.path.dirname(낼곳), exist_ok=True)
subprocess.run([
    sys.executable, "-m", "fontTools.subset", 밑바탕,
    f"--font-number={번호}",
    "--unicodes=" + ",".join(f"U+{ord(c):04X}" for c in sorted(글자)),
    "--flavor=woff2",
    "--output-file=" + 낼곳,
    "--name-IDs=1,2,3,4,6",
    "--desubroutinize",
    "--no-hinting",
], check=True)

크기 = os.path.getsize(낼곳)
print(f"만듦: {os.path.relpath(낼곳, ROOT)}  {크기 / 1024:.0f}KB")

# ── 4. 제대로 들어갔는지 확인 ─────────────────────────────
from fontTools.ttLib import TTFont  # noqa: E402

t = TTFont(낼곳)
cmap = set()
for tb in t["cmap"].tables:
    cmap |= set(tb.cmap.keys())
없음 = [c for c in sorted(글자) if ord(c) not in cmap]
print(f"확인: {len(글자) - len(없음)}/{len(글자)}자 들어감", "✓" if not 없음 else "✗ 빠짐: " + " ".join(없음))
if 없음:
    sys.exit(1)

# ── 5. 글꼴에 든 글자 목록을 옆에 남깁니다 ─────────────────
#
# 왜 필요한가:
#   실제로 이런 일이 있었습니다. 사자성어의 호환한자(U+F900~FAFF)를
#   보통 한자로 고친 뒤 이 스크립트를 다시 돌리지 않아서, 글꼴에는
#   옛 글자만 있고 데이터는 새 글자를 쓰는 상태가 되었습니다.
#   화면에서는 윈도우에 깔린 다른 글꼴로 대신 그려져 눈에 잘 안 띄지만,
#   그 9자만 서체가 달라 보이고, 글꼴이 덜어내진 보드에서는 네모로 나옵니다.
#
#   woff2 를 열어 보려면 파이썬과 fontTools 가 필요해서, 빌드할 때마다
#   확인하기 어렵습니다. 그래서 글꼴에 든 글자를 글 파일로 옆에 적어 둡니다.
#   scripts/check-hanja-font.mjs 가 이 목록과 데이터를 맞대어 봅니다.
목록길 = os.path.join(os.path.dirname(낼곳), "HanjaSubset.txt")
with open(목록길, "w", encoding="utf-8") as fh:
    fh.write("".join(chr(c) for c in sorted(cmap) if 0x3400 <= c <= 0xFAFF))
print(f"글자 목록도 남김: {os.path.relpath(목록길, ROOT)}")
