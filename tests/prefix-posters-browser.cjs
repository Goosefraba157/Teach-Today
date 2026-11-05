/* Fresh browser contexts only; never uses live teacher records. */
const assert = require('node:assert/strict');
const {chromium} = require(process.env.TT_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TT_TEST_BASE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context = await browser.newContext({serviceWorkers:'block',viewport:{width:1024,height:768},hasTouch:true});
    const page = await context.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(base+'/TeachToday.html?stage=1&native=ipad',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof ttPrefixPosters !== 'undefined' && ttPrefixPosters);
    await page.evaluate(()=>{document.querySelector('.teach-flow').hidden=false;document.body.classList.remove('home-mode');ttLesson={...ttLesson,substep:'5.5'};window.posterStateBefore=JSON.stringify(appState);document.querySelector('[data-prefix-posters]').click();});
    assert.equal(await page.locator('.prefix-dialog .prefix-card').count(),27);
    await page.locator('#prefixThrough').selectOption('3.2-first');
    assert.equal(await page.locator('.prefix-dialog .prefix-card').count(),12);
    const popup = page.waitForEvent('popup');
    await page.locator('#prefixProject').click();
    const student = await popup;
    await student.waitForFunction(()=>document.querySelectorAll('.prefix-card').length===12);
    await page.locator('#prefixThrough').selectOption('5.5');
    await student.waitForFunction(()=>document.querySelectorAll('.prefix-card').length===27);
    for(const size of [{width:1920,height:1080},{width:1280,height:720},{width:834,height:1194}]) {
      await student.setViewportSize(size);
      assert(await student.evaluate(()=>[...document.querySelectorAll('.prefix-card')].at(-1).getBoundingClientRect().bottom <= innerHeight), 'all cards fit Stage');
    }
    await student.waitForTimeout(150);
    await student.screenshot({path:'tmp/prefix-posters/stage.png'});
    assert(await page.evaluate(()=>JSON.stringify(appState)===posterStateBefore),'poster controls must not alter classroom data');
    await page.locator('#prefixClose').click();
    await page.waitForFunction(()=>ttPrefixPosters.stagePayload()===null);
    assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-prefix-posters')),true);
    await page.evaluate(()=>document.querySelectorAll('[data-prefix-posters]')[1].click());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.prefix-dialog').evaluate(el=>el.open),false);
    await page.goto(base+'/PrefixPosters.html');
    for(const width of [390,834,1280]) {
      await page.setViewportSize({width,height:1000});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
      assert(await page.evaluate(()=>[...document.querySelectorAll('.prefix-card')].every(el=>el.scrollWidth<=el.clientWidth+2)), 'card contents fit');
    }
    await page.screenshot({path:'tmp/prefix-posters/sheet.png',fullPage:true});
    assert.deepEqual(errors,[]);
    console.log('Prefix browser checks pass: both section launches, cumulative filtering, Stage sync/fit, classroom-data immutability, focus/Escape and phone/tablet/desktop bounds.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
