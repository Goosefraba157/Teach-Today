/* Run with a local preview server and Playwright. Outputs curriculum only. */
const { chromium } = require(process.env.TT_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page = await browser.newPage();
    await page.goto((process.env.TT_TEST_BASE_URL || 'http://127.0.0.1:8765') + '/PrefixPosters.html');
    await page.locator('.prefix-card').last().waitFor();
    fs.mkdirSync('assets/posters', {recursive:true});
    await page.pdf({path:'assets/posters/prefix-review.pdf',preferCSSPageSize:true,printBackground:true});
    console.log('Built full prefix review PDF (27 cards).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
