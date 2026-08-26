"""아이콘(.ico) 과 윈도우 리소스(.syso) 를 손으로 만드는 도구."""
import struct, io
from PIL import Image


def dib_bytes(im):
    """32비트 BMP(DIB) — 아이콘 안에 들어가는 형식. AND 마스크까지 붙입니다."""
    w, h = im.size
    px = im.load()
    # XOR: BGRA, 아래에서 위로
    xor = bytearray()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            r, g, b, a = px[x, y]
            xor += bytes((b, g, r, a))
    # AND 마스크: 1bpp, 행마다 4바이트 정렬
    row = ((w + 31) // 32) * 4
    andm = bytearray()
    for y in range(h - 1, -1, -1):
        bits = bytearray(row)
        for x in range(w):
            if px[x, y][3] == 0:
                bits[x // 8] |= 0x80 >> (x % 8)
        andm += bits
    hdr = struct.pack('<IiiHHIIiiII', 40, w, h * 2, 1, 32, 0, len(xor), 0, 0, 0, 0)
    return bytes(hdr + xor + andm)


def png_bytes(im):
    b = io.BytesIO()
    im.save(b, format='PNG')
    return b.getvalue()


def entries_for(images):
    """[(Image, payload_bytes, is_png)] — 256 이상은 PNG, 나머지는 DIB."""
    out = []
    for im in images:
        use_png = im.width >= 256
        out.append((im, png_bytes(im) if use_png else dib_bytes(im), use_png))
    return out


def build_ico(images):
    ents = entries_for(images)
    n = len(ents)
    header = struct.pack('<HHH', 0, 1, n)
    dir_size = 6 + 16 * n
    off = dir_size
    dirs, blobs = b'', b''
    for im, data, _ in ents:
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        dirs += struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(data), off)
        blobs += data
        off += len(data)
    return header + dirs + blobs


def build_syso(images, first_id=1, group_id=1):
    """윈도우 실행 파일에 아이콘을 심는 COFF 오브젝트(.syso)를 만듭니다."""
    ents = entries_for(images)
    n = len(ents)

    # ── .rsrc$02 : 실제 아이콘 데이터 + 그룹 아이콘 ──────────────
    data_blobs, offsets = b'', []
    for im, d, _ in ents:
        offsets.append(len(data_blobs))
        data_blobs += d
        if len(data_blobs) % 4:                     # 4바이트 정렬
            data_blobs += b'\x00' * (4 - len(data_blobs) % 4)

    grp = struct.pack('<HHH', 0, 1, n)
    for i, (im, d, _) in enumerate(ents):
        w = 0 if im.width >= 256 else im.width
        h = 0 if im.height >= 256 else im.height
        grp += struct.pack('<BBBBHHIH', w, h, 0, 0, 1, 32, len(d), first_id + i)
    grp_off = len(data_blobs)
    data_blobs += grp
    if len(data_blobs) % 4:
        data_blobs += b'\x00' * (4 - len(data_blobs) % 4)

    # ── .rsrc$01 : 자원 디렉터리 트리 ────────────────────────────
    RT_ICON, RT_GROUP_ICON = 3, 14
    DIR, ENT, DATA = 16, 8, 16
    # 배치: 루트 → 타입 디렉터리 2개 → 이름 디렉터리 (n+1)개 → 데이터 엔트리 (n+1)개
    root = DIR + 2 * ENT
    type_icon = root
    type_grp = type_icon + DIR + n * ENT
    name_start = type_grp + DIR + 1 * ENT
    name_size = DIR + ENT
    data_start = name_start + (n + 1) * name_size

    buf = bytearray()
    def d_hdr(named, ids):
        return struct.pack('<IIHHHH', 0, 0, 0, 0, named, ids)

    buf += d_hdr(0, 2)
    buf += struct.pack('<II', RT_ICON, 0x80000000 | type_icon)
    buf += struct.pack('<II', RT_GROUP_ICON, 0x80000000 | type_grp)

    buf += d_hdr(0, n)
    for i in range(n):
        buf += struct.pack('<II', first_id + i, 0x80000000 | (name_start + i * name_size))

    buf += d_hdr(0, 1)
    buf += struct.pack('<II', group_id, 0x80000000 | (name_start + n * name_size))

    relocs = []
    for i in range(n + 1):
        buf += d_hdr(0, 1)
        buf += struct.pack('<II', 0x409, data_start + i * DATA)   # 언어: 한국어 대신 기본(0x409)
    for i in range(n + 1):
        payload_off = offsets[i] if i < n else grp_off
        size = len(ents[i][1]) if i < n else len(grp)
        relocs.append(len(buf))                                   # OffsetToData 위치 = 재배치 대상
        buf += struct.pack('<IIII', payload_off, size, 0, 0)

    rsrc01 = bytes(buf)
    rsrc02 = data_blobs

    # ── COFF 오브젝트 조립 ──────────────────────────────────────
    SECHDR, RELOC, SYM = 40, 10, 18
    off_s1 = 20 + 2 * SECHDR
    off_s2 = off_s1 + len(rsrc01)
    off_rel = off_s2 + len(rsrc02)
    off_sym = off_rel + len(relocs) * RELOC

    out = bytearray()
    out += struct.pack('<HHIIIHH', 0x8664, 2, 0, off_sym, 1, 0, 0)

    FLAGS = 0x40 | 0x40000000 | 0x00300000   # 초기화 데이터 | 읽기 | 4바이트 정렬
    out += struct.pack('<8sIIIIIIHHI', b'.rsrc$01', 0, 0, len(rsrc01), off_s1,
                       off_rel, 0, len(relocs), 0, FLAGS)
    out += struct.pack('<8sIIIIIIHHI', b'.rsrc$02', 0, 0, len(rsrc02), off_s2,
                       0, 0, 0, 0, FLAGS)
    out += rsrc01
    out += rsrc02
    for r in relocs:
        out += struct.pack('<IIH', r, 0, 3)      # 심볼 0 = .rsrc$02, AMD64_ADDR32NB
    out += struct.pack('<8sIhHBB', b'.rsrc$02', 0, 2, 0, 3, 0)   # 정적 심볼
    out += struct.pack('<I', 4)                  # 빈 문자열 테이블
    return bytes(out)
