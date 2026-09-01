/* 한자 글꼴 검사 — 브라우저 없이 돌아갑니다.
 *
 * 왜 필요한가:
 *   실제로 있었던 일입니다. 사자성어의 호환한자(U+F900~FAFF)를 보통 한자로
 *   고친 뒤 글꼴을 다시 만들지 않아, 9자가 글꼴에서 빠졌습니다.
 *   윈도우에 맑은 고딕이 있으면 대신 그려 줘서 눈으로는 잘 안 보이지만,
 *   글꼴이 덜어내진 보드에서는 네모(□)로 나옵니다.
 */
import path from 'path';
import { 퀴즈, 읽기, 있나, 확인, 알림, 제목, 마무리 } from './lib/util.mjs';

const 한자냐 = (c) => { const n = c.codePointAt(0);
  return (n >= 0x3400 && n <= 0x9fff) || (n >= 0xf900 && n <= 0xfaff); };

제목('■ 화면이 쓰는 한자 모으기');
const 쓰는것 = new Map();
for (const g of ['fourchar', 'proverb', 'environment', 'safe', 'violence', 'song']) {
  for (const 하위 of [path.join(퀴즈, g, 'assets'), path.join(퀴즈, g)]) {
    if (!있나(하위)) continue;
    for (const n of (await import('fs')).readdirSync(하위)) {
      if (!/\.(js|html)$/.test(n)) continue;
      for (const c of 읽기(path.join(하위, n))) if (한자냐(c) && !쓰는것.has(c)) 쓰는것.set(c, `${g}/${n}`);
    }
  }
}
알림(`한자 ${쓰는것.size}자`);

제목('■ 글꼴에 든 글자와 맞대어 보기');
const 목록길 = path.join(퀴즈, 'fonts', 'HanjaSubset.txt');
const 글꼴길 = path.join(퀴즈, 'fonts', 'HanjaSubset.woff2');

확인('한자 글꼴 파일이 있다 (fonts/HanjaSubset.woff2)', 있나(글꼴길));
확인('글꼴에 든 글자 목록이 있다 (fonts/HanjaSubset.txt)', 있나(목록길),
  'python3 scripts/make-hanja-font.py 를 실행하면 함께 만들어집니다');

if (있나(목록길) && 있나(글꼴길)) {
  const 있는것 = new Set([...읽기(목록길)].filter(한자냐));
  알림(`글꼴에 든 한자 ${있는것.size}자`);
  const 빠짐 = [...쓰는것.keys()].filter((c) => !있는것.has(c)).sort();
  확인(`화면이 쓰는 한자가 글꼴에 다 있다 (${쓰는것.size}자)`, 빠짐.length === 0,
    빠짐.map((c) => {
      const 짝 = [...있는것].filter((x) => x !== c && x.normalize('NFKC') === c.normalize('NFKC'));
      return `${c} U+${c.codePointAt(0).toString(16).toUpperCase()} (${쓰는것.get(c)})` +
        (짝.length ? `  ← 글꼴에는 ${짝.join(',')} 만 있음` : '');
    }).join('\n') + '\n고치는 법: python3 scripts/make-hanja-font.py');

  /* 호환한자가 데이터에 남아 있으면 안 됩니다 (글꼴과 어긋나는 원인) */
  const 호환 = [...쓰는것.keys()].filter((c) => { const n = c.codePointAt(0); return n >= 0xf900 && n <= 0xfaff; });
  확인('데이터에 호환한자(U+F900~FAFF)가 남아 있지 않다', 호환.length === 0,
    호환.map((c) => `${c} U+${c.codePointAt(0).toString(16).toUpperCase()} (${쓰는것.get(c)})`).join('\n'));
}

마무리('한자 글꼴 검사');
