/* 화면 비율이 안 맞을 때 생기는 양옆 여백 색을 정합니다.
 *
 * 사이니지(1080x1920)와 실제 창의 비율이 다르면 위아래나 좌우에 여백이 생깁니다.
 * 그 여백을 각 도구가 실제로 쓰는 배경색으로 채우면 여백이 보이지 않습니다.
 *
 * 각 도구를 1080x1920 으로 그려서 왼쪽 가장자리 색을 위·가운데·아래에서 뽑아
 * scripts/letterbox.json 에 저장합니다. frame-apps.mjs 가 그 값을 씁니다.
 *
 * 이 스크립트는 Playwright 가 필요합니다(개발용). 없으면 건너뛰어도 되고,
 * 그때는 frame-apps.mjs 가 기본 색을 씁니다.
 *
 * 사용법: node scripts/letterbox.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const HERE = path.join(ROOT, 'scripts');
const DIRS = ['.', 'timer', 'pomodoro', 'stopwatch', 'worldclock',
              'paint', 'noise', 'picker', 'instruments', 'ladder'];

const require = createRequire(process.env.PW_REQUIRE_FROM || (ROOT + '/'));
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.log('playwright 가 없어 건너뜁니다 — 기본 여백색을 씁니다.');
  process.exit(0);
}

const MT = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2',
  '.json':'application/json', '.ico':'image/x-icon',
  '.webmanifest':'application/manifest+json', '.mp3':'audio/mpeg', '.wav':'audio/wav' };

const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': MT[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(s);
});
await new Promise(r => srv.listen(4655, r));

const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] }
                                          : { args: ['--no-sandbox'] });
const out = {};

for (const d of DIRS) {
  const url = `http://127.0.0.1:4655/${d === '.' ? '' : d + '/'}app.html`;
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(700);
    const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 8, height: 1920 } });
    const { PNG } = require('pngjs');
    const png = PNG.sync.read(buf);
    const at = y => {
      const i = (png.width * Math.min(y, png.height - 1) + 2) << 2;
      return '#' + [png.data[i], png.data[i+1], png.data[i+2]]
        .map(v => v.toString(16).padStart(2, '0')).join('');
    };
    out[d] = [at(2), at(960), at(1917)];
    console.log(`${(d === '.' ? '허브' : d).padEnd(12)} ${out[d].join('  ')}`);
  } catch (e) {
    console.log(`${d}: 실패 — 기본색 사용`);
  }
  await page.close();
}

await browser.close();
srv.close();
fs.writeFileSync(path.join(HERE, 'letterbox.json'), JSON.stringify(out, null, 2) + '\n');
console.log('\nscripts/letterbox.json 저장 완료');
