// Regenerates the social preview image and touch icon in web/public/ (dev only, needs playwright).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const font = (f) => fs.readFileSync(path.join(__dirname, '../node_modules/@fontsource/shantell-sans/files/' + f)).toString('base64');
const css = `
@font-face{font-family:S;font-weight:400;src:url(data:font/woff2;base64,${font('shantell-sans-latin-400-normal.woff2')})}
@font-face{font-family:S;font-weight:800;src:url(data:font/woff2;base64,${font('shantell-sans-latin-800-normal.woff2')})}
*{box-sizing:border-box;margin:0}
body{background:#f3ead9;font-family:S;color:#2a2520}
.hl{background:linear-gradient(transparent 58%,#ffe36e 58%,#ffe36e 92%,transparent 92%)}
.sheet{position:absolute;background:#fffaf0;background-image:radial-gradient(#d9cbb0 1.6px,transparent 2px);background-size:24px 24px;background-position:12px 12px;border-radius:5px;box-shadow:0 2px 0 rgba(80,60,30,.06),0 18px 40px -18px rgba(80,60,30,.45)}
.tape{position:absolute;width:120px;height:34px;background:rgba(222,205,168,.8);border-radius:2px}
`;
const pen = (w, color = '#2c57c9') => `<svg width="${w}" height="${w}" viewBox="0 0 32 32" fill="none"><path d="M4 20c4-9 7-12 9-10s-3 9 0 9 6-12 9-11 1 8 6 8" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const og = `<style>${css}</style>
<div style="position:relative;width:1200px;height:630px;overflow:hidden">
  <div style="position:absolute;left:80px;top:64px;display:flex;align-items:center;gap:12px;font-weight:800;font-size:34px">${pen(42)}ShrinkNotes</div>
  <div style="position:absolute;left:80px;top:150px;width:640px;display:flex;flex-direction:column;gap:26px">
    <div style="font-weight:800;font-size:76px;line-height:1.04;letter-spacing:-1px">Compress your <span class="hl">GoodNotes</span>&nbsp;PDF.</div>
    <div style="font-size:30px;color:#7a6d5d">Handwriting stays sharp.<br>Nothing is uploaded.</div>
  </div>
  <div class="sheet" style="left:770px;top:150px;width:360px;height:330px;transform:rotate(-2.5deg)">
    <div class="tape" style="left:24px;top:-16px;transform:rotate(-7deg)"></div>
    <div class="tape" style="right:24px;top:-16px;transform:rotate(6deg)"></div>
    <div style="position:absolute;left:34px;top:88px;font-weight:400;font-size:44px;color:#7a6d5d;text-decoration:line-through;text-decoration-color:#2c57c9;text-decoration-thickness:4px">116.3 MB</div>
    <div style="position:absolute;left:34px;top:150px;font-weight:800;font-size:64px">9.8 MB</div>
    <div style="position:absolute;left:34px;top:240px;font-size:30px"><span class="hl">92% smaller</span></div>
  </div>
</div>`;

const icon = `<style>${css}</style>
<div style="width:180px;height:180px;background:#fffaf0;display:grid;place-items:center;background-image:radial-gradient(#d9cbb0 1.4px,transparent 1.8px);background-size:18px 18px;background-position:9px 9px">${pen(132)}</div>`;

(async () => {
  const out = path.join(__dirname, '../web/public');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(og); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(out, 'og.png') });
  await p.setViewportSize({ width: 180, height: 180 });
  await p.setContent(icon);
  await p.screenshot({ path: path.join(out, 'apple-touch-icon.png') });
  await b.close();
  console.log('wrote web/public/og.png and apple-touch-icon.png');
})();
