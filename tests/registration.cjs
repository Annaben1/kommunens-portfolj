// Run with Node.js and Playwright installed: node tests/registration.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
(async () => {
  const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'));
  const server = http.createServer((req, res) => {res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(html);});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath: process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox']});
    const page = await browser.newPage();
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    const url=`http://127.0.0.1:${server.address().port}`;
    await page.goto(url);
    assert.equal(await page.locator('.item-name').count(),3);
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('.item-name').count(),3);
    async function fill(name) {
      for (const [id,value] of Object.entries({namn:name,avdelning:'Omsorg',ansvarig:'Testägare',mal:'Kortare väntetid',nulage:'Manuell hantering',forvantadNytta:'Mer tid för invånare'})) await page.locator('#'+id).fill(value);
    }
    await fill('   ');
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('.item-name').count(),3);
    const name='<img src=x onerror="window.injected=true">';
    await fill(name);
    await page.locator('#searchInput').fill('ingen träff');
    await page.locator('#statusFilter').selectOption('Avslutad');
    await page.locator('#kategoriFilter').selectOption('Miljö');
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('.item-name').count(),4);
    assert.equal(await page.locator('.item-name').first().textContent(),name);
    assert.equal(await page.locator('#list img').count(),0);
    assert.equal(await page.locator('#aktiva').textContent(),'3');
    assert.equal(await page.locator('#namn').inputValue(),'');
    assert.match(await page.locator('#feedback').textContent(),/har sparats/);
    await page.reload();
    assert.equal(await page.locator('.item-name').count(),4);
    for(const q of ['Testägare','Kortare väntetid','Manuell hantering','Mer tid för invånare']) {
      await page.locator('#searchInput').fill(q);
      assert.equal(await page.locator('.item-name').count(),1);
    }
    await page.locator('#searchInput').fill('');
    await page.locator('#statusFilter').selectOption('Avslutad');
    assert.equal(await page.locator('.item-name').count(),1);
    await page.locator('#statusFilter').selectOption('Alla');
    await page.locator('#kategoriFilter').selectOption('Miljö');
    assert.equal(await page.locator('.item-name').count(),1);
    await page.locator('#kategoriFilter').selectOption('Alla');
    const downloadPromise=page.waitForEvent('download');await page.locator('#exportBtn').click();
    const csv=fs.readFileSync(await (await downloadPromise).path(),'utf8');
    assert.match(csv,/Förväntad nytta/);assert.match(csv,/Mer tid för invånare/);
    await page.locator('.delete-btn').first().click();
    assert.equal(await page.locator('.item-name').count(),3);
    await page.reload();assert.equal(await page.locator('.item-name').count(),3);
    await fill('Sparfel');
    await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('QuotaExceededError');};});
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('#namn').inputValue(),'Sparfel');
    assert.equal(await page.locator('.item-name').count(),3);
    assert.match(await page.locator('#feedback').textContent(),/Kunde inte spara/);
    await page.reload();
    await page.evaluate(()=>localStorage.setItem('kommunInitiativData','broken JSON'));
    await page.reload();
    assert.match(await page.locator('#feedback').textContent(),/kunde inte läsas/);
    await fill('Skriv inte över');await page.locator('button[type=submit]').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('kommunInitiativData')),'broken JSON');
    await page.evaluate(()=>localStorage.setItem('kommunInitiativData','[]'));
    await page.reload();assert.equal(await page.locator('.item-name').count(),0);
    await fill('Datumtest');await page.locator('summary').click();
    await page.locator('#startDatum').fill('2026-10-25');await page.locator('#slutDatum').fill('2026-10-24');
    await page.locator('button[type=submit]').click();assert.equal(await page.locator('.item-name').count(),0);
    await page.locator('#slutDatum').fill('2026-10-26');await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('.item-name').count(),1);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    page.on('dialog',dialog=>dialog.accept());await page.locator('#resetBtn').click();await page.reload();
    assert.equal(await page.locator('.item-name').count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: registration, validation, persistence, legacy data, search, filters, summaries, CSV, HTML escaping, deletion, reset, storage errors, dates and mobile overflow.');
  } finally {await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
