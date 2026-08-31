/* 문항 출처 보고서(.docx)를 문항 파일에서 만듭니다.
 *
 *   node scripts/make-report.js      (퀴즈 폴더 루트에서)
 *
 * 숫자와 표를 손으로 적지 않고 문항 파일에서 뽑아 씁니다.
 * 문항을 고치고 다시 돌리면 보고서도 같이 맞습니다.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ExternalHyperlink, PageBreak, Footer, PageNumber, convertMillimetersToTwip,
} = require('docx');

const ROOT = process.cwd();
const 글꼴 = '맑은 고딕';
const 먹 = '1F2A26', 회 = '5C6A66', 청록 = '0F6455';
const 빨 = 'A8442F', 노 = '9A5E14', 초 = '2C7A4B';

const 본문폭 = 9638;   // A4 세로, 좌우 여백 2cm

/* ── 자료 ─────────────────────────────────────────────── */
const 읽기 = (n) => JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts', 'questions', n + '.json'), 'utf8'));
const 환경 = 읽기('environment'), 안전 = 읽기('safe'), 학폭 = 읽기('violence');
const OX전체 = [...환경, ...안전, ...학폭];

const 번들 = (폴더) => {
  const d = path.join(ROOT, 폴더, 'assets');
  const f = fs.readdirSync(d).filter((n) => n.endsWith('.js'))[0];
  return fs.readFileSync(path.join(d, f), 'utf8');
};
const 속담수 = [...번들('proverb').matchAll(/proverb:"((?:[^"\\]|\\.)*)",targets:\[/g)].length;
const 사자성어수 = [...번들('fourchar').matchAll(/idiom:"((?:[^"\\]|\\.)*)",hanja:/g)].length;
const 총문항 = 속담수 + 사자성어수 + OX전체.length;

// 출처의 이용조건을 다섯 갈래로 나눕니다(2026-08-31 확인 기준).
const 갈래 = (url) => {
  const h = new URL(url).hostname.replace(/^www\./, '');
  if (h === 'law.go.kr' || h === 'easylaw.go.kr') return 'A';
  if (h === 'korea.kr' || h === 'health.kdca.go.kr') return 'B';
  if (h === 'safekorea.go.kr') return 'C';
  if (h === 'kacpr.org' || h === 'btf.or.kr') return 'E';
  return 'D';
};
const 갈래이름 = {
  A: '법제처 — 영리 목적 포함 자유 이용 명시 (법령·훈령 조문은 저작권법 제7조 대상)',
  B: '공공누리 제4유형 확인 — 출처표시 + 상업적 이용금지 + 변경금지',
  C: '상업 목적 사용 금지를 홈페이지에 명시',
  D: '이용조건 표시 없음 · 유형 미확인',
  E: '민간 기관 · 이용허락 표시 없음',
};

function 갈래집계(목록) {
  const c = {};
  목록.forEach((x) => { const g = 갈래(x.출처); c[g] = (c[g] || 0) + 1; });
  return c;
}

// 같은 URL을 쓰는 문항을 문서 단위로 묶습니다.
function 문서묶기(목록) {
  const m = new Map();
  목록.forEach((x) => {
    if (!m.has(x.출처)) m.set(x.출처, { 기관: x.근거기관, 문서: new Set(), url: x.출처, 수: 0 });
    const v = m.get(x.출처);
    v.수++; v.문서.add(x.근거문서);
  });
  return [...m.values()].map((v) => ({ ...v, 문서: [...v.문서] }))
    .sort((a, b) => b.수 - a.수);
}

/* ── 글 조각 ──────────────────────────────────────────── */
const T = (text, o = {}) => new TextRun({
  text, font: 글꼴, size: o.size || 20, bold: o.bold, color: o.color || 먹, italics: o.italics });

const P = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? 300 },
  alignment: o.align, indent: o.indent, border: o.border,
});

const 글 = (text, o = {}) => P(T(text, o), o);

const H1 = (text) => new Paragraph({
  children: [T(text, { size: 28, bold: true, color: 청록 })],
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 청록, space: 6 } },
});

const H2 = (text) => new Paragraph({
  children: [T(text, { size: 23, bold: true, color: 먹 })],
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
});

const 점 = (text, o = {}) => new Paragraph({
  children: [T('· ', { color: 회 }), ...(Array.isArray(text) ? text : [T(text, o)])],
  spacing: { after: 90, line: 300 },
  indent: { left: 200, hanging: 200 },
});

/* ── 표 ───────────────────────────────────────────────── */
const 칸 = (내용, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: 70, bottom: 70, left: 110, right: 110 },
  verticalAlign: 'top',
  children: Array.isArray(내용) ? 내용 : [내용],
});

const 표테두리 = {
  top: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
  left: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
  right: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'DDE4E0' },
};

function 표(열폭, 머리, 줄들, 머리색) {
  const 머리줄 = new TableRow({
    tableHeader: true,
    children: 머리.map((t, i) => 칸(
      P(T(t, { bold: true, color: 'FFFFFF', size: 18 }), { after: 0 }),
      열폭[i], { fill: 머리색 || 청록 })),
  });
  // 칸에 들어오는 것은 세 가지입니다: 글자 / 문단 하나 / 문단 여러 개.
  const 칸내용 = (c) => {
    if (Array.isArray(c)) return c;
    if (c instanceof Paragraph) return [c];
    return [P(T(String(c), { size: 18 }), { after: 0 })];
  };
  const 본문줄 = 줄들.map((줄, ri) => new TableRow({
    children: 줄.map((c, i) => 칸(칸내용(c), 열폭[i], { fill: ri % 2 ? 'F7F9F8' : undefined })),
  }));
  return new Table({
    columnWidths: 열폭,
    width: { size: 본문폭, type: WidthType.DXA },
    borders: 표테두리,
    rows: [머리줄, ...본문줄],
  });
}

const 링크 = (글자, url) => new ExternalHyperlink({
  link: url,
  children: [new TextRun({ text: 글자, font: 글꼴, size: 18, color: '1155CC', underline: {} })],
});

/* ── 게임별 출처 절 ───────────────────────────────────── */
function OX절(제목, 목록, 색) {
  const 문서들 = 문서묶기(목록);
  const c = 갈래집계(목록);
  const 갈래줄 = ['A', 'B', 'C', 'D', 'E'].filter((k) => c[k])
    .map((k) => `${k} ${c[k]}문항`).join('  ·  ');

  const 줄들 = 문서들.map((d) => [
    String(d.수),
    d.기관,
    new Paragraph({
      children: [링크(d.문서[0], d.url)],
      spacing: { after: d.문서.length > 1 ? 60 : 0, line: 260 },
    }),
    갈래(d.url),
  ]);
  // 한 URL 안에서 조문이 여러 개인 경우 아래에 덧붙입니다.
  문서들.forEach((d, i) => {
    if (d.문서.length > 1) {
      줄들[i][2] = [
        new Paragraph({ children: [링크(d.문서[0], d.url)], spacing: { after: 60, line: 260 } }),
        ...d.문서.slice(1).map((t) => new Paragraph({
          children: [T('  ' + t, { size: 16, color: 회 })], spacing: { after: 40, line: 240 } })),
      ];
    }
  });

  return [
    H2(`${제목} — ${목록.length}문항`),
    글(`근거 문서 ${문서들.length}건 · 근거 기관 ${new Set(목록.map((x) => x.근거기관)).size}곳 · ` +
       `정답 O ${목록.filter((x) => x.ans === 'O').length} : X ${목록.filter((x) => x.ans === 'X').length}`,
       { size: 18, color: 회 }),
    글('이용조건 갈래  ' + 갈래줄, { size: 18, color: 회, after: 160 }),
    표([700, 2100, 6238, 600], ['문항', '근거 기관', '근거 문서 (누르면 원문으로)', '갈래'], 줄들, 색),
    글('', { after: 80 }),
  ];
}

/* ── 본문 ─────────────────────────────────────────────── */
const 오늘 = new Date().toISOString().slice(0, 10).replace(/-/g, '. ') + '.';
const OX기관 = {};
OX전체.forEach((x) => { OX기관[x.근거기관] = (OX기관[x.근거기관] || 0) + 1; });
const 전체갈래 = 갈래집계(OX전체);
const 전체문서수 = new Set(OX전체.map((x) => x.출처)).size;

const 아이들 = [
  // 표지 블록
  new Paragraph({
    children: [T('내부 보고', { size: 18, bold: true, color: 청록 })],
    spacing: { after: 100 },
  }),
  new Paragraph({
    children: [T('간단교육 퀴즈 문항 출처 검토', { size: 40, bold: true, color: 먹 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [T('수업도우미 · CLAIX AI보드 학교 배포용', { size: 22, color: 회 })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    children: [T(`${오늘}  ·  작성 김선유`, { size: 18, color: 회 })],
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'DDE4E0', space: 10 } },
  }),

  // 1. 요약
  H1('1. 요약'),
  글('교실 화면에 나가는 게임 6개, 문항 ' + 총문항 + '개의 출처를 전수 확인했습니다. ' +
     '결론부터 말씀드리면, 출처를 댈 수 있는 문항과 댈 수 없는 문항이 반씩입니다.', { after: 160 }),

  표([2600, 1300, 2200, 3538],
    ['게임', '문항', '형태', '출처'],
    [
      ['속담', String(속담수), '빈칸 채우기', [P(T('없음 — 앱 원본 콘텐츠', { size: 18, bold: true, color: 빨 }), { after: 0 })]],
      ['사자성어', String(사자성어수), '빈칸 채우기', [P(T('없음 — 앱 원본 콘텐츠', { size: 18, bold: true, color: 빨 }), { after: 0 })]],
      ['환경', String(환경.length), 'O/X 고르기', '기후에너지환경부 · 기상청 등'],
      ['안전', String(안전.length), 'O/X 고르기', '행정안전부 · 법제처 · 질병관리청 등'],
      ['학교폭력', String(학폭.length), 'O/X 고르기', '법제처 · 교육부 등'],
      ['교가', '—', '학교마다 다름', '배포 학교가 직접 넣음 (현재 꺼짐)'],
      [[P(T('합계', { size: 18, bold: true }), { after: 0 })],
       [P(T(String(총문항), { size: 18, bold: true }), { after: 0 })], '', ''],
    ]),
  글('', { after: 200 }),

  H2('핵심 세 가지'),
  점([T('출처를 댈 수 있는 문항은 ', { bold: false }),
      T(`${OX전체.length}개(${Math.round(OX전체.length / 총문항 * 100)}%)`, { bold: true }),
      T('입니다. 환경 · 안전 · 학교폭력이 여기 해당하며, 근거 기관 ' +
        `${Object.keys(OX기관).length}곳 · 근거 문서 ${전체문서수}건에서 나왔습니다. ` +
        '전부 정부 부처 · 법제처 · 법정 공공기관이고, 블로그 · 언론 · 학원 자료는 한 건도 없습니다.')]),
  점([T('출처를 댈 수 없는 문항이 ', { bold: false }),
      T(`${속담수 + 사자성어수}개(${Math.round((속담수 + 사자성어수) / 총문항 * 100)}%)`, { bold: true, color: 빨 }),
      T(' 있습니다. 속담과 사자성어는 개발사가 앱에 넣어 둔 콘텐츠로, 어느 기관 자료에서 왔는지 확인할 방법이 없습니다. ' +
        '교육청이 근거를 물으면 내놓을 것이 없는 부분입니다. 이 보고서에서 가장 먼저 판단이 필요한 항목입니다.')]),
  점([T('사실 검증은 마쳤습니다. ', { bold: true }),
      T(`2026년 8월에 ${OX전체.length}문항 전부와 인용 URL ${전체문서수}건을 실제로 열어 대조했고, ` +
        '사실이 틀린 문항 1건과 근거가 맞지 않는 문항 3건을 찾아 지우거나 고쳤습니다. 자세한 내용은 4장에 있습니다.')]),

  글('', { after: 200 }),
  new Paragraph({ children: [new PageBreak()] }),

  // 2. 게임별 출처
  H1('2. 게임별 출처'),

  H2(`속담 — ${속담수}문항  ·  출처 없음`),
  글('퀴즈 앱에 원래 들어 있던 콘텐츠입니다. 기관 자료에서 가져온 것이 아니어서 ' +
     '출처를 적을 수 없습니다.', { after: 120 }),
  점('2026년 8월 검수에서 표준 표기와 다른 속담 9건, 뜻풀이 2건을 고쳤습니다.'),
  점('장애인 비하 표현이 들어간 속담 2건(‘꿀 먹은 벙어리’ 등)을 다른 속담으로 바꿨습니다.'),
  점('답이 문제 안에 그대로 보이던 빈칸을 다른 글자로 바꿨습니다(속담·사자성어 합쳐 32곳).'),
  글('속담 자체는 오래전부터 전해 내려온 것이라 특정인의 저작물이 아닙니다. ' +
     '문제는 저작권이 아니라 “어느 기관이 검증한 내용인가”를 답할 수 없다는 점입니다.',
     { color: 회, size: 18, before: 60 }),

  H2(`사자성어 — ${사자성어수}문항  ·  출처 없음`),
  글('속담과 같습니다. 앱 원본 콘텐츠이며 기관 출처가 없습니다.', { after: 120 }),
  점('2026년 8월 검수에서 뜻풀이가 어렵거나 부정확한 7건을 초등학생이 읽을 수 있게 고쳤습니다.'),
  글('뜻풀이는 사전을 옮긴 것이 아니라 새로 쓴 문장이지만, 어느 사전을 기준으로 했는지 ' +
     '기록이 없습니다.', { color: 회, size: 18, before: 60 }),
];

아이들.push(...OX절('환경', 환경, 초));
아이들.push(...OX절('안전', 안전, 노));
아이들.push(...OX절('학교폭력', 학폭, '3A55A0'));

아이들.push(
  H2('교가 — 학교마다 다름'),
  글('정해진 문항이 없습니다. 배포하는 학교의 교가를 넣어야 카드가 켜지고, ' +
     '넣기 전에는 퀴즈 목록에 나오지 않습니다. 현재는 꺼져 있습니다.', { after: 120 }),
  점('앱에는 원래 특정 학교(서울신답초등학교)의 교가가 들어 있었습니다. ' +
     '그대로 배포하면 다른 학교 아이들에게 남의 학교 교가를 가르치게 되므로 목록에서 뺐습니다.'),
  점('학교 교가는 그 학교가 저작권을 관리하거나 작사·작곡가에게 있습니다. ' +
     '배포 학교가 직접 넣게 한 것은 이 문제도 함께 피하기 위한 것입니다.'),

  new Paragraph({ children: [new PageBreak()] }),

  // 3. 저작권 검토
  H1('3. 저작권 검토'),
  글('공공기관 자료도 저작물입니다. 각 출처의 이용조건을 2026년 8월 31일에 홈페이지에서 직접 확인했습니다.',
     { after: 160 }),

  H2('출처별 이용조건'),
  표([700, 6738, 2200],
    ['갈래', '이용조건 (2026. 8. 31. 확인)', '해당 문항'],
    ['A', 'B', 'C', 'D', 'E'].map((k) => [
      [P(T(k, { size: 18, bold: true }), { after: 0 })],
      [P(T(갈래이름[k], { size: 18 }), { after: 0 })],
      [P(T(`${전체갈래[k] || 0}문항`, { size: 18 }), { after: 0 })],
    ])),
  글('', { after: 160 }),

  점([T('가장 안전한 것은 A(법제처) ', { bold: true }),
      T(`${전체갈래.A}문항입니다. `),
      T('국가법령정보센터와 찾기쉬운 생활법령정보는 홈페이지에 “영리 목적의 이용을 포함하여 자유로운 활용이 보장됩니다”라고 ' +
        '명시하고 있습니다. 또한 법령 · 훈령 조문 자체는 저작권법 제7조에 따라 보호받지 못하는 저작물입니다.')]),
  점([T('가장 조심해야 할 것은 C ', { bold: true, color: 빨 }),
      T(`${전체갈래.C}문항입니다. `),
      T('국민안전24(옛 국민재난안전포털) 홈페이지 하단에 “국민안전24에서 제공하는 자료는 공익목적으로만 사용해야하며 ' +
        '상업목적으로 사용할 경우 저작권을 침해합니다”라고 적혀 있습니다. 공공누리보다 더 분명한 금지 문구입니다.')]),
  점([T(`B ${전체갈래.B}문항은 공공누리 제4유형입니다. `),
      T('정책브리핑과 질병관리청 국가건강정보포털에서 확인했습니다. 제4유형은 상업적 이용과 변경을 모두 금지합니다.')]),
  점([T(`D ${전체갈래.D}문항은 이용조건 표시를 찾지 못했습니다. `),
      T('행정안전부 · 교육부 · 기상청 · 식약처 등입니다. 공공누리 마크가 이미지로 붙어 있어 확인이 안 됐을 수 있으므로, ' +
        '유상 판매를 결정하시면 이 부분은 브라우저로 한 번 더 봐야 합니다.')]),
  점([T(`E ${전체갈래.E}문항은 민간 기관(대한심폐소생협회 · 푸른나무재단)입니다. `),
      T('이용허락 표시가 없어 원문 사용은 개별 허락이 필요합니다.')]),

  H2('우리가 취한 방식'),
  글('상업적 이용이 허용되는 출처(공공누리 제1유형 또는 제3유형)는 한 곳도 확인되지 않았습니다. ' +
     '그래서 처음부터 다음 방식을 택했습니다.', { after: 120 }),
  점([T('기관 문장을 그대로 옮긴 문항은 ', {}), T('0건', { bold: true }),
      T('입니다. 기준과 수치 같은 사실만 근거로 삼고, 문항과 해설은 모두 초등학생 눈높이로 새로 썼습니다.')]),
  점('저작권법은 표현을 보호하고 사실이나 아이디어는 보호하지 않습니다(아이디어 · 표현 이분법). ' +
     '“심정지 후 4분”, “페트병은 라벨을 떼고 배출” 같은 사실 자체는 저작물이 아닙니다.'),
  점('이미지는 기관 자료에서 한 장도 가져오지 않았습니다.'),

  H2('남아 있는 저작권 위험'),
  점([T('목록의 순서까지 따라 하면 편집저작물 침해가 될 수 있습니다. ', { bold: true }),
      T('“분리배출 4가지 기준”, “심폐소생술 순서” 같은 항목은 배열을 그대로 베끼지 않았는지 한 번 더 볼 여지가 있습니다.')]),
  점([T('제품에 영리성이 있는지부터 정해야 합니다. ', { bold: true }),
      T('무상 배포라면 B · C 갈래도 부담이 크게 줄어듭니다. 유상 판매라면 C 갈래 ' +
        `${전체갈래.C}문항(국민안전24)은 행정안전부에 이용 문의를 하거나 다른 출처로 바꾸는 것이 안전합니다.`)]),
  점('저작권법 제7조 조문은 문화체육관광부 안내 페이지에서 확인했습니다. ' +
     '보고 자리에서 인용하실 계획이면 국가법령정보센터 원문으로 한 번 대조해 주세요.'),

  new Paragraph({ children: [new PageBreak()] }),

  // 4. 검증 기록
  H1('4. 검증 기록'),
  글('문항을 만든 것과 별개로, 2026년 8월에 인용한 문서를 처음부터 다시 열어 대조했습니다. ' +
     `${OX전체.length}문항 전부, 인용 URL 전부를 실제로 열어 “그 문서에 그 내용이 있는지”를 확인했습니다.`,
     { after: 160 }),

  표([2600, 7038],
    ['찾은 것', '조치'],
    [
      [[P(T('사실이 틀린 문항 1건', { size: 18, bold: true, color: 빨 }), { after: 0 })],
       '학교폭력 “따돌림은 상대가 고통을 느끼게 만드는 모든 행위”. 법(학교폭력예방법 제2조제1호의2)의 ' +
       '따돌림 정의에 있는 세 요건(2명 이상 · 지속적 반복적 · 신체적 심리적 공격)이 빠져 사실이 틀렸고, ' +
       '같은 퀴즈의 다른 문항과 어긋났습니다. → 삭제'],
      ['근거가 맞지 않는 문항 3건',
       '① 학교폭력 “사실이라도 명예훼손” — 인용한 디지털 성범죄 페이지에 그 내용이 없어 ' +
       '청소년 인터넷 명예훼손(정보통신망법 제70조제1항) 페이지로 교체. ' +
       '② 학교폭력 “웃으며 구경만 하는 것도” — 사안처리 가이드북에 없는 내용이고 대신할 기관 문서를 못 찾아 삭제. ' +
       '③ 안전 “횡단보도에서 손들기” — 인용한 법제처 페이지에 없어, 같은 페이지에 실제로 적힌 내용으로 교체.'],
      ['낡은 링크 35건',
       '환경 문항이 걸고 있던 분리배출 지침 링크가 2022년 옛 판이었습니다. ' +
       '→ 현행(기후에너지환경부훈령 제18호, 2026. 1. 1. 시행)으로 교체하고 기관명도 맞춤'],
      ['불안정한 링크 23건',
       '세션이 끊기면 첫 화면으로 튕기던 찾기쉬운 생활법령정보 링크. → 바로 열리는 주소로 교체'],
      ['O/X 치우침',
       '학교폭력이 O 44 : X 28로 치우쳐 “모르면 O”를 찍으면 유리했습니다. ' +
       '→ 근거가 그대로 뒷받침하는 다섯 문항의 방향을 뒤집어 O 39 : X 33으로 맞춤'],
    ]),
  글('', { after: 160 }),

  H2('검증에서 지적됐지만 고치지 않은 것 2건'),
  글('원문을 직접 열어 확인한 결과 원래가 맞아 그대로 두었습니다.', { after: 100 }),
  점('환경 “2000년 이후 연 2.5ppm” — 기상청 보도자료 원문이 그렇게 적고 있습니다.'),
  점('푸른나무재단 링크 — 정상적으로 열리고 상담전화 1588-9128이 그대로 실려 있습니다.'),

  new Paragraph({ children: [new PageBreak()] }),

  // 5. 남은 위험과 제안
  H1('5. 남은 위험과 조치 제안'),

  표([600, 3200, 5838],
    ['', '위험', '제안'],
    [
      [[P(T('1', { size: 18, bold: true }), { after: 0 })],
       [P(T(`속담 · 사자성어 ${속담수 + 사자성어수}문항에 출처가 없음`, { size: 18, bold: true, color: 빨 }), { after: 0 })],
       '전체 문항의 절반이 넘습니다. 교육청이 근거를 요구하면 답할 수 없습니다. ' +
       '세 가지 길이 있습니다. (가) 국립국어원 표준국어대사전을 기준으로 표기와 뜻풀이를 전수 대조하고 ' +
       '그 사실을 출처로 기록한다. (나) 두 게임을 근거 있는 콘텐츠로 다시 만든다. ' +
       '(다) 지금 상태로 두되 “출처 없음”을 문서에 명시하고 학교에 그대로 알린다. ' +
       '(가)를 권합니다. 대사전은 국가기관 자료이고 대조 작업은 자동화할 수 있습니다.'],
      [[P(T('2', { size: 18, bold: true }), { after: 0 })],
       '학교폭력예방법이 2027. 1. 1. 개정 시행',
       `학교폭력 ${학폭.length}문항의 조문 근거가 바뀔 수 있습니다. ` +
       '2026년 12월 안에 한 번 더 확인해야 합니다. 담당자를 지금 정해 두는 것이 좋습니다.'],
      [[P(T('3', { size: 18, bold: true }), { after: 0 })],
       '국민안전24 자료의 상업 이용 금지',
       `안전 ${전체갈래.C}문항이 여기서 나왔습니다. 문장은 새로 썼으므로 현재로선 문제가 없다고 보지만, ` +
       '제품을 유상 판매하기로 하면 행정안전부에 이용 문의를 하거나 다른 출처로 바꾸는 것이 안전합니다.'],
      [[P(T('4', { size: 18, bold: true }), { after: 0 })],
       '실태조사를 근거로 한 문항',
       '“언어폭력이 가장 많다” 같은 문항은 해마다 새 조사가 나오면 순위가 바뀔 수 있습니다. ' +
       '해설에 조사 연도를 넣어 두었지만, 새 조사가 나오면 확인이 필요합니다.'],
      [[P(T('5', { size: 18, bold: true }), { after: 0 })],
       '이용조건 미확인 출처 ' + 전체갈래.D + '문항',
       '공공누리 마크가 이미지로 붙어 있어 확인되지 않았을 수 있습니다. ' +
       '유상 판매를 결정하시면 행정안전부 · 교육부 · 기상청 · 식약처 페이지를 브라우저로 한 번 더 봐야 합니다.'],
    ]),
  글('', { after: 200 }),

  H2('함께 보실 자료'),
  점('문항집 엑셀 — 게임마다 시트 하나, 510문항 전체와 문항별 출처 (간단교육_퀴즈_문항집.xlsx)'),
  점('문항집 웹페이지 — 게임별로 나누고 찾기 · 거르기가 되는 화면'),
  점('문항 근거 자료 — 근거 문서 단위로 정리한 표'),
  점('저장소 quiz/scripts/questions/ — 문항 원자료(JSON). 문항마다 근거기관 · 근거문서 · 출처 URL이 붙어 있습니다.'),
);

/* ── 문서 ─────────────────────────────────────────────── */
const doc = new Document({
  creator: '김선유',
  title: '간단교육 퀴즈 문항 출처 검토',
  description: '수업도우미 · CLAIX AI보드 학교 배포용 문항 출처 및 저작권 검토 보고',
  styles: {
    default: {
      document: { run: { font: 글꼴, size: 20, color: 먹 }, paragraph: { spacing: { line: 300 } } },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
        margin: {
          top: convertMillimetersToTwip(22), bottom: convertMillimetersToTwip(20),
          left: convertMillimetersToTwip(20), right: convertMillimetersToTwip(20),
        },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            children: ['간단교육 퀴즈 문항 출처 검토  ·  ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
            font: 글꼴, size: 16, color: 회,
          })],
        })],
      }),
    },
    children: 아이들,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const 경로 = path.join(ROOT, '문항출처검토보고.docx');
  fs.writeFileSync(경로, buf);
  console.log('만듦:', 경로,
    `— 게임 6개 · ${총문항}문항 · 근거문서 ${전체문서수}건`);
});
