// End-to-end test in headless Chromium: node test/browser.cjs <in.pdf> <out.pdf>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [inp, outp] = process.argv.slice(2);
  const tmp = path.join(__dirname, '../dist/index.html');

  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + tmp);
  const t0 = Date.now();
  await page.setInputFiles('#file', inp);
  await page.waitForSelector('#view-done:not([hidden]), #view-error:not([hidden])', { timeout: 600000 });
  if (await page.isVisible('#view-error')) {
    console.log('ERROR VIEW:', await page.textContent('#error-msg'));
  } else {
    console.log('saving', await page.textContent('#done-saving'), '|', await page.textContent('#done-detail'));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#save')]);
    await dl.saveAs(outp);
    console.log('download', dl.suggestedFilename(), fs.statSync(outp).size, 'bytes', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  }
  if (errors.length) console.log('console errors:', errors);
  await browser.close();
})();
