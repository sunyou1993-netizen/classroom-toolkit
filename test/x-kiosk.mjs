/* 아이가 수업 화면 밖으로 빠져나갈 수 있는가. (조사용)
 *
 * 왜:
 *   교실 앞 65인치 보드입니다. 쉬는 시간에 아이들이 이것저것 눌러 봅니다.
 *   화면 밖으로 나가서 보드 바탕화면이나 다른 사이트에 가 버리면,
 *   다음 수업 시작할 때 선생님이 다시 맞춰 놓아야 합니다.
 *
 * 무엇을 보나:
 *   1) 바깥으로 나가는 링크가 있는가 (있으면 그게 탈출구입니다)
 *   2) 새 창을 여는 링크(target=_blank)가 있는가
 *   3) 파일을 화면에 끌어다 놓으면 그 파일이 열리는가  ← 브라우저 기본 동작
 *   4) 글자를 길게 눌러 선택·복사할 수 있는가 (아이들이 잘 합니다)
 *   5) 오른쪽 클릭(길게 누르기) 메뉴가 뜨는가
 */
import { 서버띄우기, 브라우저열기, 브라우저없음안내, 제목, 알림 } from './lib/util.mjs';

const 화면들 = [
  ['수업도우미 첫화면', '/index.html'], ['타이머', '/timer/'], ['그림판', '/paint/'],
  ['소음측정기', '/noise/'], ['발표자 선정', '/picker/'], ['피아노', '/instruments/'],
  ['사다리', '/ladder/'], ['세계시간', '/worldclock/'],
  ['퀴즈 첫화면', '/quiz/index.html'], ['환경 퀴즈', '/quiz/environment/'],
  ['속담', '/quiz/proverb/'], ['사자성어', '/quiz/fourchar/'],
];

const br = await 브라우저열기();
if (!br) { 브라우저없음안내(); process.exit(0); }
const 서버 = await 서버띄우기(47440);

제목('■ 화면 밖으로 나갈 구멍이 있나');
console.log('');
console.log('   화면                바깥링크  새창  끌어놓기  글자선택  우클릭');
console.log('   ' + '─'.repeat(64));

const 모음 = [];
for (const [이름, 길] of 화면들) {
  const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 } });
  const page = await ctx.newPage();
  await page.goto(서버.주소 + 길, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1800);
  const f = page.frames().length > 1 ? page.frames()[1] : page.mainFrame();

  const r = await f.evaluate(() => {
    const 여기 = location.origin;
    const a = [...document.querySelectorAll('a[href]')];
    const 바깥 = a.filter((x) => {
      const h = x.href;
      return h && !h.startsWith(여기) && !h.startsWith('javascript:') && !h.startsWith('#');
    }).map((x) => x.href.slice(0, 60));
    const 새창 = a.filter((x) => x.target === '_blank').map((x) => x.href.slice(0, 60));

    /* 글자 선택을 막아 두었나 */
    const cs = getComputedStyle(document.body);
    const 선택막힘 = (cs.userSelect === 'none' || cs.webkitUserSelect === 'none');

    /* 끌어다 놓기·우클릭을 막는 코드가 붙어 있나 (겉으로는 알 수 없어 흔적을 봅니다) */
    const 본문 = document.documentElement.outerHTML;
    const 끌기막음 = /ondrop|'drop'|"drop"|dragover/.test(본문);
    const 우클릭막음 = /contextmenu/.test(본문);
    return { 바깥, 새창, 선택막힘, 끌기막음, 우클릭막음 };
  });

  /* 실제로 파일을 끌어다 놓아 봅니다 — 브라우저는 기본으로 그 파일을 엽니다 */
  const 주소전 = page.url();
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(['테스트'], '아무파일.txt', { type: 'text/plain' }));
    for (const 종류 of ['dragenter', 'dragover', 'drop']) {
      document.body.dispatchEvent(new DragEvent(종류, { dataTransfer: dt, bubbles: true, cancelable: true }));
    }
  }).catch(() => {});
  await page.waitForTimeout(1200);
  const 끌어놓기위험 = page.url() !== 주소전;

  const 칸 = (x) => (x ? ' ✗ ' : ' ✓ ');
  console.log(`   ${이름.padEnd(18)}${String(r.바깥.length).padStart(6)}${String(r.새창.length).padStart(7)}`
    + `${칸(끌어놓기위험).padStart(9)}${칸(!r.선택막힘).padStart(9)}${칸(!r.우클릭막음).padStart(8)}`);
  모음.push({ 이름, ...r, 끌어놓기위험 });
  await ctx.close();
}

console.log('');
알림('✗ = 아이가 빠져나갈 수 있는 구멍, ✓ = 막혀 있음');

const 바깥있는곳 = 모음.filter((x) => x.바깥.length);
const 새창있는곳 = 모음.filter((x) => x.새창.length);
const 선택되는곳 = 모음.filter((x) => !x.선택막힘);
const 우클릭되는곳 = 모음.filter((x) => !x.우클릭막음);
const 끌기위험 = 모음.filter((x) => x.끌어놓기위험);

console.log('');
console.log(`   ${바깥있는곳.length ? '✗' : '✓'} 바깥으로 나가는 링크: ${바깥있는곳.length ? 바깥있는곳.map((x) => `${x.이름}(${x.바깥[0]})`).join(', ') : '없음'}`);
console.log(`   ${새창있는곳.length ? '✗' : '✓'} 새 창을 여는 링크: ${새창있는곳.length ? 새창있는곳.map((x) => x.이름).join(', ') : '없음'}`);
console.log(`   ${끌기위험.length ? '✗' : '✓'} 파일을 끌어다 놓으면 그 파일이 열림: ${끌기위험.length ? 끌기위험.map((x) => x.이름).join(', ') : '없음 (이 시험에서는)'}`);
console.log(`   ${선택되는곳.length ? '⚠' : '✓'} 글자 선택이 되는 화면: ${선택되는곳.length}개 ${선택되는곳.length ? '(' + 선택되는곳.map((x) => x.이름).join(', ') + ')' : ''}`);
console.log(`   ${우클릭되는곳.length ? '⚠' : '✓'} 우클릭(길게 누르기) 메뉴를 막지 않은 화면: ${우클릭되는곳.length}개`);

서버.닫기(); await br.close();
