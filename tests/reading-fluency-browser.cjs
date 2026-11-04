/* Run against a local server with Playwright installed; all records are synthetic. */
const assert=require('node:assert/strict');
const {chromium}=require(process.env.TT_PLAYWRIGHT_MODULE||'playwright');
const screenshotDir=process.env.TT_TEST_SCREENSHOT_DIR;
if(screenshotDir)require('node:fs').mkdirSync(screenshotDir,{recursive:true});
const base=process.env.TT_TEST_BASE_URL||'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.TT_TEST_BROWSER_CHANNEL||'chrome'});
 try {
  const context=await browser.newContext({viewport:{width:1365,height:1000},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/rf-harness',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><button id="ttHomeReadingFluency">Reading fluency</button>'}));
  async function boot(){
   await page.goto(base+'/rf-harness');
   await page.addStyleTag({url:base+'/reading-fluency.css'});
   await page.addScriptTag({url:base+'/reading-fluency-library.js'});
   await page.addScriptTag({url:base+'/reading-fluency.js'});
   await page.evaluate(()=>{
    const d=new Date(),y=d.getFullYear(),m=d.getMonth(),year=`${m>=6?y:y-1}-${m>=6?y+1:y}`;
    window.s=JSON.parse(localStorage.getItem('rf-synthetic-state')||'null')||{activeSchoolYearId:year,rosterStudents:[{studentId:'private-test-id',name:'Test Reader',gradeLevel:'2'}],groups:[{id:'g',name:'Synthetic group',schoolYearId:year,students:['Test Reader'],studentIds:{'Test Reader':'private-test-id'}}],sentinel:{unchanged:true}};
    window.persisted=structuredClone(s);window.failSave=false;window.delaySave=0;window.projections=[];
    const project=p=>{window.projection=p;projections.push(p);localStorage.setItem('teachToday.studentDisplayPayload.v1',JSON.stringify(p));};
    window.controller=TeachTodayReadingFluency.install({getState:()=>s,save:async()=>{const text=JSON.stringify(s);if(delaySave)await new Promise(r=>setTimeout(r,delaySave));if(failSave)throw new Error('Synthetic save failed');localStorage.setItem('rf-synthetic-state',text);persisted=JSON.parse(text);},activeGroupId:()=> 'g',activeStudentId:()=> 'private-test-id',ready:()=>{},stopMirror:()=>{},project,openDisplay:p=>{project(p);window.open('StudentDisplay.html','rf-student');},endProjection:()=>{}});
    window.offset=0;const now=performance.now.bind(performance);performance.now=()=>now()+offset;
   });
   await page.locator('#ttHomeReadingFluency').click();await page.locator('#rfPassage').selectOption('star-por-en-g2-f01');
  }
  async function durable(fn){await page.waitForFunction(fn);}
  await boot();assert.equal(await page.locator('#rfGrade').inputValue(),'2');
  const studentPromise=page.waitForEvent('popup');await page.locator('#rfProject').click();const student=await studentPromise;
  await student.waitForLoadState('domcontentloaded');await student.waitForFunction(()=>document.querySelector('.stage-fluency-pdf img')?.naturalWidth>0);
  await page.bringToFront();
  const fitWidth=await student.evaluate(()=>{render({...currentPayload,cardDisplay:{layout:'fluency-page-fit',position:'0'}});return document.querySelector('.stage-fluency-pdf img').getBoundingClientRect().width;});
  await page.locator('#rfZoomIn').click();
  await student.waitForFunction(width=>document.querySelector('.stage-fluency-pdf img').getBoundingClientRect().width>width,fitWidth);
  if(screenshotDir)await student.screenshot({path:require('node:path').join(screenshotDir,'student-zoom.png')});
  await page.locator('#rfStart').click();await page.waitForFunction(()=>!document.querySelector('#rfFinish').disabled);
  await page.locator('[data-rf-word="3"]').click();
  await page.evaluate(()=>offset+=15000);await page.waitForFunction(()=>Number(document.querySelector('#rfStudentScroll').value)>40);
  await page.locator('#rfAutoPause').click();const position=await page.locator('#rfStudentScroll').inputValue();
  await page.evaluate(()=>offset+=5000);await page.waitForTimeout(250);assert.equal(await page.locator('#rfStudentScroll').inputValue(),position);
  await page.locator('#rfAutoPause').click();await page.evaluate(()=>offset+=5000);await page.waitForFunction(p=>Number(document.querySelector('#rfStudentScroll').value)>Number(p),position);
  await page.evaluate(()=>{delaySave=120;offset+=40000;});
  await durable(()=>persisted.readingFluencyRecords?.length===1);
  let row=await page.evaluate(()=>persisted.readingFluencyRecords[0]);const id=row.id,createdAt=row.createdAt;
  assert.equal(row.assessmentStatus,'needs-endpoint');assert.equal(row.lastWordIndex,null);assert.equal(row.wcpm,null);assert.equal(row.attempted,null);assert.deepEqual(row.errorIndices,[3]);
  const stopped=await page.locator('#rfStudentScroll').inputValue();await page.waitForTimeout(300);assert.equal(await page.locator('#rfStudentScroll').inputValue(),stopped);
  await page.locator('#rfClose').click();await boot();await page.locator(`[data-rf-edit="${id}"]`).click();assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[0].assessmentStatus),'needs-endpoint');await page.locator('#rfProject').click();await page.bringToFront();await page.evaluate(()=>delaySave=120);
  // Rapid edits while writes are delayed must update one durable session in order.
  await page.locator('[data-rf-word="19"]').click();await page.locator('[name="rfMarkMode"][value="error"]').check();
  await page.locator('[data-rf-word="3"]').click();await page.locator('[data-rf-word="5"]').click();
  await page.locator('[name="rfMarkMode"][value="last"]').check();await page.locator('[data-rf-word="24"]').click();
  await page.locator('#rfNotes').fill('PRIVATE test observation');await page.locator('#rfSave').click();
  await durable(()=>persisted.readingFluencyRecords[0].wcpm===24&&persisted.readingFluencyRecords[0].notes==='PRIVATE test observation');
  row=await page.evaluate(()=>persisted.readingFluencyRecords[0]);assert.equal(row.id,id);assert.equal(row.createdAt,createdAt);assert.equal(row.accuracy,96);assert.deepEqual(row.errorIndices,[5]);assert(row.revisions.length>=2);assert.equal(new Set(row.revisions.map(r=>r.id)).size,row.revisions.length);
  assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords.length),1);
  assert(!JSON.stringify(await page.evaluate(()=>projections)).includes('PRIVATE'));
  assert(!JSON.stringify(await page.evaluate(()=>projections)).includes('private-test-id'));
  assert(!/One minute|Saved|WCPM/.test(await student.locator('body').innerText()));
  await page.locator('#rfClose').click();await boot();
  await page.locator(`[data-rf-edit="${id}"]`).click();
  await page.locator('[name="rfMarkMode"][value="error"]').check();await page.locator('[data-rf-word="5"]').click();
  await page.locator('[name="rfMarkMode"][value="last"]').check();await page.locator('[data-rf-word="19"]').click();
  await durable(()=>persisted.readingFluencyRecords[0].wcpm===20);
  page.once('dialog',d=>d.dismiss());await page.locator('#rfClear').click();assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[0].assessmentStatus),'complete');
  page.once('dialog',d=>d.accept());await page.locator('#rfClear').click();
  await durable(()=>persisted.readingFluencyRecords[0].assessmentStatus==='cleared');
  assert.equal(await page.locator('[data-rf-edit]').count(),0);assert.equal(await page.locator('#rfTrend svg').count(),0);
  await page.locator('#rfShowCleared').check();await page.locator(`[data-rf-restore="${id}"]`).click();await durable(()=>persisted.readingFluencyRecords[0].wcpm===20&&persisted.readingFluencyRecords[0].assessmentStatus==='complete');
  // Failed automatic checkpoint stays visibly retryable, without guessed scores.
  await page.locator('#rfReset').click();await page.locator('#rfStart').click();await page.waitForFunction(()=>!document.querySelector('#rfFinish').disabled);
  await page.evaluate(()=>{failSave=true;offset+=61000;});await page.waitForFunction(()=>document.querySelector('#rfAutoSave').textContent.includes('Not saved'));
  assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords.length),1);
  await page.evaluate(()=>failSave=false);await page.locator('#rfZero').click();await durable(()=>persisted.readingFluencyRecords.length===2&&persisted.readingFluencyRecords[1].wcpm===0);
  assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[1].accuracy),null);
  // A failed clear preserves the saved session and can be retried deliberately.
  await page.evaluate(()=>failSave=true);page.once('dialog',d=>d.accept());await page.locator('#rfClear').click();await page.waitForFunction(()=>document.querySelector('#rfMessage').textContent.includes('Synthetic save failed'));
  assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[1].assessmentStatus),'complete');
  await page.evaluate(()=>failSave=false);page.once('dialog',d=>d.accept());await page.locator('#rfClear').click();await durable(()=>persisted.readingFluencyRecords[1].assessmentStatus==='cleared');
  for(const size of [{width:1024,height:768},{width:834,height:1194},{width:390,height:844}]){
   await page.setViewportSize(size);const bounds=await page.locator('#ttFluency').evaluate(d=>({w:d.clientWidth,s:d.scrollWidth}));assert(bounds.s<=bounds.w+1,JSON.stringify(bounds));
  }
  await page.setViewportSize({width:1024,height:768});await page.locator('#rfStart').tap();await page.waitForFunction(()=>!document.querySelector('#rfFinish').disabled);await page.locator('[data-rf-word="10"]').tap();if(screenshotDir)await page.locator('#ttFluency').screenshot({path:require('node:path').join(screenshotDir,'teacher-ipad.png')});page.once('dialog',d=>d.accept());await page.locator('#rfClear').tap();await durable(()=>persisted.readingFluencyRecords.length===3&&persisted.readingFluencyRecords[2].assessmentStatus==='cleared');assert.deepEqual(await page.evaluate(()=>persisted.readingFluencyRecords[2].errorIndices),[10]);
  await page.locator('#rfStart').click();await page.waitForFunction(()=>!document.querySelector('#rfFinish').disabled);await page.locator('[data-rf-word="7"]').tap();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'));});await durable(()=>persisted.readingFluencyRecords.length===4);assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[3].assessmentStatus),'interrupted');assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[3].wcpm),null);assert.equal(await page.evaluate(()=>persisted.readingFluencyRecords[3].revisions.length),0);await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await page.locator('#rfNotes').fill('Background note');await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await durable(()=>persisted.readingFluencyRecords[3].notes==='Background note');
  await page.locator('#rfReset').click();await page.locator('#rfAutoScroll').uncheck();await page.locator('#rfStart').click();await page.waitForFunction(()=>!document.querySelector('#rfFinish').disabled);await page.evaluate(()=>offset+=5000);await page.waitForTimeout(250);assert.equal(Number(await page.locator('#rfStudentScroll').inputValue()),0);await page.locator('#rfAutoPause').click();await page.evaluate(()=>offset+=5000);await page.waitForFunction(()=>Number(document.querySelector('#rfStudentScroll').value)>0);page.once('dialog',d=>d.accept());await page.locator('#rfClear').click();
  assert.deepEqual(await page.evaluate(()=>persisted.sentinel),{unchanged:true});assert.deepEqual(errors,[]);
  console.log('Fluency autosave: pending endpoint, ordered edits, reload editing, clear/cancel/restore, failure retry, zero, zoom/slow-scroll pause, privacy and tablet/phone bounds pass.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
