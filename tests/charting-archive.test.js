const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const archive=require('../charting-archive.js'),charting=require('../charting-export.js');
function memoryStore(){
 const reports=new Map(),locks=new Map();let settings={enabled:true,startedOn:'2026-10-22'};
 return {settings:async()=>structuredClone(settings),setSettings:async s=>{settings=structuredClone(s);},
  list:async()=>[...reports.values()].map(r=>structuredClone(r)),get:async id=>structuredClone(reports.get(id)),
  add:async r=>{assert.ok(!reports.has(r.id));reports.set(r.id,structuredClone(r));},update:async r=>{reports.set(r.id,structuredClone(r));},
  claim:async(key,owner,now)=>{const lock=locks.get(key);if(lock&&lock.owner!==owner&&lock.expires>now)return false;locks.set(key,{owner,expires:now+600000});return true;},
  release:async(key,owner)=>{if(locks.get(key)?.owner===owner)locks.delete(key);},reports};
}
function fixture(){
 let clock=new Date(2026,9,23,16),count=0,offline=true,failLocal=false,state={activeSchoolYearId:'2026-2027',masterRecords:[{id:'first'}]};
 const store=memoryStore(),calls=[],generate=async(s,meta)=>{count++;return {...meta,fileName:archive.fileName(meta),attempts:s.masterRecords.length,files:[{fileName:archive.fileName(meta),bytes:new Uint8Array([s.masterRecords.length,42])}]};};
 const adapter={getState:()=>state,saveLocal:async(bytes,name,options)=>{calls.push({destination:'local',bytes:[...bytes],name,options});if(failLocal)throw new Error('Files unavailable');return {path:'Charting/'+name};},saveDrive:async(bytes,name,options)=>{calls.push({destination:'drive',bytes:[...bytes],name,options});if(offline)throw new Error('Offline');return {id:'drive-id'};}};
 const make=()=>archive.service({store,adapter,generate,now:()=>new Date(clock)});
 return {store,calls,make,get count(){return count;},set clock(v){clock=v;},set offline(v){offline=v;},set failLocal(v){failLocal=v;},state};
}
test('Friday at 4 PM uses local calendar boundaries and catch-up never invents older weekly snapshots',()=>{
 const start='2026-10-22';assert.equal(archive.dueFriday(new Date(2026,9,22,20),start),'');
 assert.equal(archive.dueFriday(new Date(2026,9,23,15,59),start),'');assert.equal(archive.dueFriday(new Date(2026,9,23,16),start),'2026-10-23');
 assert.equal(archive.dueFriday(new Date(2026,9,26,9),start),'2026-10-23');assert.equal(archive.dueFriday(new Date(2026,10,9,9),start),'2026-11-06');
 assert.equal(archive.dateKey(archive.nextFriday(new Date(2026,9,23,16))),'2026-10-30');
});
test('filenames include actual local export date and time, Friday due date, and safe bounded scope',()=>{
 const name=archive.fileName({id:'weekly-2026-10-23-2026-2027',year:'2026-2027',label:'Whole roster',kind:'weekly',dueFriday:'2026-10-23',createdAt:new Date(2026,9,26,9,8,7).toISOString()});
 assert.match(name,/Friday 2026-10-23 - 2026-10-26 09-08-07/);assert.ok(name.length+22<155);assert.doesNotMatch(name,/[:/]/);
});
test('weekly copy persists one exact snapshot, independently verifies local and retries only pending Drive after reload',async()=>{
 const f=fixture(),s=f.make(),before=JSON.stringify(f.state);await s.run();assert.equal(f.count,1);
 let [report]=await f.store.list();assert.equal(report.files[0].local.status,'verified');assert.equal(report.files[0].drive.status,'pending');
 f.state.masterRecords.push({id:'newer'});f.offline=false;f.clock=new Date(2026,9,26,9);await f.make().run();
 [report]=await f.store.list();assert.equal(f.count,1);assert.equal(report.attempts,1);assert.deepEqual([...report.files[0].bytes],[1,42]);assert.equal(report.files[0].drive.status,'verified');
 assert.equal(f.calls.filter(c=>c.destination==='local').length,1);assert.equal(f.calls.filter(c=>c.destination==='drive').length,2);
 assert.equal(f.calls[1].name,f.calls[2].name);assert.deepEqual(f.calls[1].bytes,f.calls[2].bytes);assert.equal(f.calls[1].options.interactive,false);
 assert.equal(JSON.stringify({...f.state,masterRecords:[f.state.masterRecords[0]]}),before);
});
test('manual destination retries reuse the persisted history entry after receipt readback',async()=>{
 const f=fixture(),service=f.make(),report={id:'manual',kind:'manual',createdAt:new Date().toISOString(),files:[{fileName:'same.pdf',bytes:new Uint8Array([3,4])}]};
 await service.record(report);let returned=await service.deliver(report,['drive'],true);assert.equal(returned.files[0].drive.status,'pending');
 await service.record(returned);f.offline=false;returned=await service.deliver(returned,['drive'],true);assert.equal(returned.files[0].drive.status,'verified');assert.equal((await f.store.list()).length,1);assert.deepEqual(f.calls[0].bytes,f.calls[1].bytes);
});
test('missed Friday creates a single current snapshot with honest Monday timestamp, then a new copy next Friday',async()=>{
 const f=fixture();f.clock=new Date(2026,9,26,9);f.offline=false;await f.make().run();let [r]=await f.store.list();assert.equal(r.dueFriday,'2026-10-23');assert.equal(archive.dateKey(new Date(r.createdAt)),'2026-10-26');
 f.clock=new Date(2026,9,30,16);await f.make().run();assert.equal(f.count,2);assert.equal((await f.store.list()).length,2);
});
test('Drive continues when local Files fails; retries never replace a verified Drive copy',async()=>{
 const f=fixture();f.failLocal=true;f.offline=false;await f.make().run();let [r]=await f.store.list();assert.equal(r.files[0].local.status,'pending');assert.equal(r.files[0].drive.status,'verified');
 f.failLocal=false;await f.make().run({force:true,interactive:true});[r]=await f.store.list();assert.equal(r.files[0].local.status,'verified');assert.equal(f.calls.filter(c=>c.destination==='drive').length,1);
});
test('paused schedules make no automatic saves and explicit retries finish old copies without creating another week',async()=>{
 const f=fixture(),s=f.make();await s.run();await s.enable(false);f.clock=new Date(2026,9,30,16);f.offline=false;await s.run();assert.equal(f.calls.length,2);
 await s.run({force:true,interactive:true});assert.equal(f.count,1);assert.equal(f.calls.length,3);assert.equal(f.calls[2].options.interactive,true);
});
test('automatic retries back off, generation errors remain visible across reload, and simultaneous tabs do not duplicate a week',async()=>{
 const f=fixture();await Promise.all([f.make().run(),f.make().run()]);assert.equal(f.count,1);assert.equal(f.calls.length,2);await f.make().run();assert.equal(f.calls.length,2);
 const g=fixture();let errors=0;const make=()=>archive.service({store:g.store,adapter:{getState:()=>g.state},generate:async()=>{errors++;throw new Error('Source unavailable');},now:()=>new Date(2026,9,23,16)});
 await make().run();assert.equal((await g.store.settings()).lastFailure,'Source unavailable');await make().run();assert.equal(errors,1);await make().run({force:true});assert.equal(errors,2);
});
test('multipart packaging retains every attempt, full blank-student sheets, and oversized single-student history in order',()=>{
 const rows=[{name:'Long A.',attempts:Array.from({length:50},(_,i)=>({id:i,wrongWords:i===0?Array.from({length:15},(_,j)=>'miss'+j):[]}))},{name:'Blank B.',attempts:[]},{name:'Short C.',attempts:[{id:99,wrongWords:[]}]}];
 const parts=archive.partition({rows},charting,2);assert.deepEqual(parts.flatMap(p=>p.rows.flatMap(r=>r.attempts.map(a=>a.id))),[...Array.from({length:50},(_,i)=>i),99]);
 assert.equal(parts.flatMap(p=>p.rows).filter(r=>r.name==='Blank B.').length,1);
 assert.ok(parts.every(p=>p.rows.reduce((n,r)=>n+Math.max(2,Math.ceil(charting.columns(r).length/12)),0)<=2));
});
test('bounded PDFs keep editable fields and original appearances in each numbered part',async()=>{
 const PDFLib=require('../vendor/pdf-lib.min.js'),fontkit=require('../vendor/fontkit-1.1.1.min.js');
 const resources={PDFLib,fontkit,templateBytes:fs.readFileSync('assets/wrs-charting-template.pdf'),fontBytes:fs.readFileSync('vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf'),fields:JSON.parse(fs.readFileSync('assets/wrs-charting-fields.json'))};
 const model={year:'2026-2027',rows:[{name:'Example A.',attempts:[{date:'2026-10-23',substep:'4.1',wordlistPage:20,seconds:30,level:'N',wrongWords:['target'],wordRecords:[{word:'target',correct:false,said:'response'}]}]},{name:'Example B.',attempts:[]}]};
 const files=await archive.generateFiles(model,charting,resources,2);assert.equal(files.length,2);
 for(let i=0;i<files.length;i++){const doc=await PDFLib.PDFDocument.load(files[i].bytes),fields=doc.getForm().getFields();assert.equal(doc.getPageCount(),2);assert.equal(fields.length,386);assert.equal(doc.getForm().getTextField('S1.P1.F__STUDENT NAME').getText(),model.rows[i].name);for(const field of fields)for(const widget of field.acroField.getWidgets())assert.ok(widget.getAppearances().normal);}
 assert.equal((await charting.readEarlierPdf(files[0].bytes,PDFLib))[0].wordRecords[0].said,'response');
});
test('browser folder saver rereads bytes, rejects corruption and never prompts during automatic delivery',async()=>{
 const source=fs.readFileSync('teach-today.js','utf8'),start=source.indexOf('// Report files use a separate handle'),end=source.indexOf('async function ttSaveDownloadedLessonPlanPdf',start),bytes=new Uint8Array([1,2,3]);let corrupt=false,written;
 const context=vm.createContext({Uint8Array,ttNativeDocumentAvailable:()=>false,ttIsNativeIpadShell:()=>false,ttCloudSyncPermission:async(_h,write,prompt)=>{assert.equal(write,true);assert.equal(prompt,false);return true;},ttDocumentSha256Hex:async b=>crypto.createHash('sha256').update(b).digest('hex'),window:{TeachTodayChartingArchive:{openStore:()=>({getSetting:async()=>({name:'Reports',getFileHandle:async()=>({createWritable:async()=>({write:async b=>{written=b;},close:async()=>{}}),getFile:async()=>({arrayBuffer:async()=>corrupt?new Uint8Array([9]).buffer:written.buffer})})})})}}});
 vm.runInContext(source.slice(start,end),context);assert.equal((await context.ttSaveLocalChartingPdf(bytes,'same.pdf')).path,'Reports/same.pdf');corrupt=true;await assert.rejects(context.ttSaveLocalChartingPdf(bytes,'same.pdf'),/did not match/);
});

test('weekly Drive saver refreshes an expired token once without opening automatic consent',async()=>{
 const source=fs.readFileSync('teach-today.js','utf8'),start=source.indexOf('async function ttSaveDriveChartingPdf'),end=source.indexOf('// Report files use a separate handle',start),bytes=new Uint8Array([3,4]),permissions=[];let saves=0;
 const context=vm.createContext({Blob,Uint8Array,encodeURIComponent,ttDriveAccessToken:'expired',ttEnsureDrivePermission:async o=>{permissions.push(o.interactive);return true;},ttIndependentDriveFolderName:'Teach Today Backups',ttDriveNamedFolder:async name=>name,ttDriveUpsertBackup:async(_folder,name)=>{assert.equal(name,'same.pdf');if(saves++===0)throw new Error('Drive request failed (401)');return {id:'file'};},ttDriveHeaders:()=>({}),ttDocumentSha256Hex:async b=>crypto.createHash('sha256').update(b).digest('hex'),fetch:async()=>({ok:true,arrayBuffer:async()=>bytes.buffer})});
 vm.runInContext(source.slice(start,end),context);assert.equal((await context.ttSaveDriveChartingPdf(bytes,'same.pdf',{interactive:false})).id,'file');assert.equal(context.ttDriveAccessToken,'');assert.deepEqual(permissions,[false,false]);assert.equal(saves,2);
});
