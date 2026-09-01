/* 화면이 쓰는 한자가 글꼴에 다 들어 있는지 확인합니다.
 *
 * 왜 필요한가:
 *   실제로 이런 일이 있었습니다. 사자성어의 호환한자(U+F900~FAFF, 두음법칙 때문에
 *   따로 있는 글자들)를 보통 한자로 고친 뒤 글꼴을 다시 만들지 않아서,
 *   글꼴에는 옛 글자만 있고 데이터는 새 글자를 쓰는 상태가 되었습니다.
 *
 *     데이터: 樂 U+6A02 (보통 한자)      글꼴: 樂 U+F914 (호환한자)
 *
 *   이게 왜 잘 안 보이냐면, 윈도우에 맑은 고딕이 깔려 있으면 그걸로 대신
 *   그려 주기 때문입니다. 화면에는 나오는데 그 몇 글자만 서체가 다릅니다.
 *   글꼴이 덜어내진 보드(Windows 10 IoT)에서는 네모(□)로 나옵니다.
 *   브라우저로 확인해도 대체 글꼴에 가려져 잡히지 않습니다.
 *
 *   그래서 눈이 아니라 글자 코드로 맞대어 봅니다.
 *
 * 사용법: node scripts/check-hanja-font.mjs      (퀴즈 폴더에서)
 *   빠진 글자가 있으면 1번으로 끝납니다(빌드가 멈춥니다).
 *   고치는 법: python3 scripts/make-hanja-font.py
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const 한자냐 = (c) => {
  const n = c.codePointAt(0);
  return (n >= 0x3400 && n <= 0x9fff) || (n >= 0xf900 && n <= 0xfaff);
};

/* ── 1. 화면 파일이 쓰는 한자를 모두 모읍니다 ── */
const 쓰는것 = new Map(); // 글자 → 어느 파일에서
function 훑기(폴더) {
  const d = path.join(ROOT, 폴더);
  if (!fs.existsSync(d)) return;
  for (const n of fs.readdirSync(d)) {
    if (!n.endsWith('.js') && !n.endsWith('.html')) continue;
    const s = fs.readFileSync(path.join(d, n), 'utf8');
    for (const c of s) if (한자냐(c) && !쓰는것.has(c)) 쓰는것.set(c, `${폴더}/${n}`);
  }
}
for (const g of ['fourchar', 'proverb', 'environment', 'safe', 'violence', 'song']) {
  훑기(`${g}/assets`);
  훑기(g);
}
훑기('assets');
훑기('.');

/* ── 2. 글꼴에 든 글자 목록을 읽습니다 ── */
const 목록길 = path.join(ROOT, 'fonts', 'HanjaSubset.txt');
if (!fs.existsSync(목록길)) {
  console.error('✗ fonts/HanjaSubset.txt 가 없습니다.');
  console.error('  python3 scripts/make-hanja-font.py 를 실행하면 글꼴과 함께 만들어집니다.');
  process.exit(1);
}
const 있는것 = new Set([...fs.readFileSync(목록길, 'utf8')].filter(한자냐));

/* 글꼴 파일 자체도 있는지 */
const 글꼴길 = path.join(ROOT, 'fonts', 'HanjaSubset.woff2');
if (!fs.existsSync(글꼴길)) {
  console.error('✗ fonts/HanjaSubset.woff2 가 없습니다.');
  process.exit(1);
}

/* ── 3. 맞대어 봅니다 ── */
const 빠짐 = [...쓰는것.keys()].filter((c) => !있는것.has(c)).sort();

console.log(`화면이 쓰는 한자  ${쓰는것.size}자`);
console.log(`글꼴에 든 한자    ${있는것.size}자`);
console.log(`글꼴 파일          ${(fs.statSync(글꼴길).size / 1024).toFixed(0)}KB`);

if (!빠짐.length) {
  console.log('\n✓ 빠진 글자 없음');
  process.exit(0);
}

console.error(`\n✗ 글꼴에 없는 글자 ${빠짐.length}자`);
for (const c of 빠짐) {
  const 짝 = [...있는것].filter((x) => x.normalize('NFKC') === c.normalize('NFKC') && x !== c);
  console.error(
    `   ${c} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}` +
      `  (${쓰는것.get(c)})` +
      (짝.length ? `  ← 글꼴에는 ${짝.map((x) => `${x} U+${x.codePointAt(0).toString(16).toUpperCase()}`).join(', ')} 만 있음` : '')
  );
}
console.error('\n이 글자들은 보드에서 네모(□)로 나오거나, 그 글자만 서체가 달라 보입니다.');
console.error('고치는 법:  python3 scripts/make-hanja-font.py');
process.exit(1);
