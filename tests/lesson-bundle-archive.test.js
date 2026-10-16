const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const PDFLib = require('../vendor/pdf-lib.min.js');
const source = fs.readFileSync('teach-today.js', 'utf8');
const start = source.indexOf('async function ttPrepareLessonBundleFiles');
const end = source.indexOf('async function ttSaveLessonBundleFromViewer', start);
function fixture({native=true, connected=true, localSave, driveSave}={}) {
  const calls={local:[],drive:[]};let enabled=connected;
  const c=vm.createContext({Date,Promise,Math,Array,Uint8Array,window:{PDFLib},crypto:crypto.webcrypto,
    ttIsNativeIpadShell:()=>native,ttIndependentBackupEnabledKey:'enabled',
    localStorage:{getItem:()=>enabled?'true':'false'},
    ttDocumentSha256Hex:async bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),
    ttFriendlyDriveError:e=>e.message,
    ttSaveNativeLessonPlanPdf:async (...args)=>{calls.local.push(args);return localSave?localSave(...args):{path:`Lesson Plans/${args[4]}/${args[3]}/${args[2]}`};},
    ttSaveDriveLessonPlanPdf:async (...args)=>{calls.drive.push(args);return driveSave?driveSave(...args):{id:'verified-drive-file'};}
  });
  vm.runInContext(source.slice(start,end),c);
  const record={groupFolder:'All Groups',files:[{bytes:new Uint8Array([1,2,3]),fileName:'2026-2027 - All Groups - latest - unique.pdf'}]};
  return {c,calls,record,connect:()=>{enabled=true;}};
}

test('bundle writes matching bytes and filenames to native Downloaded and Drive independently',async()=>{
  let release;const drivePending=new Promise(r=>{release=r;});
  const f=fixture({driveSave:()=>drivePending});const messages=[];
  const saving=f.c.ttSaveLessonBundleArchive(f.record,text=>messages.push(text));
  assert.equal(f.c.ttSaveLessonBundleArchive(f.record),saving);
  await new Promise(setImmediate);
  assert.equal(f.record.files[0].local.status,'saved');assert.equal(f.record.files[0].drive.status,'saving');
  assert.equal(f.calls.local[0][3],'Downloaded');assert.equal(f.calls.local[0][4],'All Groups');
  assert.equal(f.calls.drive[0][2],'Downloaded');assert.equal(f.calls.drive[0][3],'All Groups');
  assert.deepEqual(f.calls.local[0][0],f.calls.drive[0][0]);assert.equal(f.calls.local[0][2],f.calls.drive[0][1]);
  release({id:'drive'});await saving;
  assert.match(messages.at(-1),/On My iPad\/Teach Today Stage\/Lesson Plans\/All Groups\/Downloaded/);
  assert.match(messages.at(-1),/Teach Today Backups\/Lesson Plans\/All Groups\/Downloaded/);
});

test('Drive failure preserves the native copy and retry writes only the missing destination',async()=>{
  let fail=true;const f=fixture({driveSave:()=>{if(fail)throw Error('Synthetic offline');return {id:'drive'};}});
  await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.record.files[0].local.status,'saved');assert.equal(f.record.files[0].drive.status,'failed');
  assert.match(f.c.ttLessonBundleSaveStatus(f.record),/NOT SAVED: Synthetic offline/);
  fail=false;await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.calls.local.length,1);assert.equal(f.calls.drive.length,2);
  assert.equal(f.calls.drive[0][1],f.calls.drive[1][1]);assert.equal(f.record.files[0].drive.status,'saved');
});

test('native failure does not prevent Drive saving and is not reported as local success',async()=>{
  const f=fixture({localSave:()=>{throw Error('Synthetic Files failure');}});
  await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.record.files[0].drive.status,'saved');assert.equal(f.record.files[0].local.status,'failed');
  assert.match(f.c.ttLessonBundleSaveStatus(f.record),/iPad Files: 0\/1 file\(s\) saved/);
});

test('a disconnected Drive is explicit, and connecting retries the original stable file',async()=>{
  const f=fixture({connected:false});await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.calls.drive.length,0);assert.equal(f.record.files[0].local.status,'saved');
  assert.match(f.c.ttLessonBundleSaveStatus(f.record),/Connect Google Drive backup/);
  f.connect();await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.calls.local.length,1);assert.equal(f.calls.drive.length,1);
});

test('browser Drive backup does not claim an unavailable iPad folder was saved',async()=>{
  const f=fixture({native:false});await f.c.ttSaveLessonBundleArchive(f.record);
  assert.equal(f.calls.local.length,0);assert.equal(f.record.files[0].local.status,'unavailable');
  assert.equal(f.record.files[0].drive.status,'saved');
});

test('large bundles split below the file limit without dropping or reordering pages',async()=>{
  const f=fixture();const pdf=await PDFLib.PDFDocument.create();
  for(let i=0;i<12;i++){
    const page=pdf.addPage([600+i,792]);
    page.drawText(Array.from({length:500},(_,j)=>String.fromCharCode(33+(i*17+j*7)%90)).join(''));
  }
  const bytes=await pdf.save();
  const one=await PDFLib.PDFDocument.create();const [page]=await one.copyPages(pdf,[0]);one.addPage(page);
  const limit=(await one.save()).length+300;
  const result=await f.c.ttPrepareLessonBundleFiles(bytes,'bundle.pdf',[3,6,9],limit);
  assert.ok(result.length>1);const widths=[];
  for(const [i,file] of result.entries()){
    assert.ok(file.bytes.length<=limit);assert.match(file.fileName,new RegExp(`part ${i+1} of ${result.length}\\.pdf$`));
    const part=await PDFLib.PDFDocument.load(file.bytes);widths.push(...part.getPages().map(p=>p.getWidth()));
  }
  assert.deepEqual(widths,Array.from({length:12},(_,i)=>600+i));
});

test('export names are safe, unique, scoped, and fit the native filename limit',()=>{
  const f=fixture();const names=Array.from({length:20},()=>f.c.ttLessonBundleArchiveName('Group / strange: name','2026-2027','both'));
  assert.equal(new Set(names).size,20);assert.ok(names.every(n=>n.length<155&&/^[a-z0-9 ._()-]+\.pdf$/i.test(n)));
  const swift=fs.readFileSync('ios/TeachTodayStageProof/App/TeacherWebViewController.swift','utf8');
  assert.match(swift,/\["Planned", "Completed", "Downloaded"\]\.contains\(stage\)/);
  assert.match(swift,/data\.count <= 15_000_000/);
});

test('print bundles auto-save and Stage download never falls through to a blob download',()=>{
  const print=source.slice(source.indexOf('async function ttPrintAllLessonPlans'),source.indexOf('function ttRenderSavedLessons'));
  assert.match(print,/groupId \? ttLessonPlanGroupFolderName\(group\) : "All Groups"/);
  assert.match(print,/await ttSaveLessonBundleFromViewer\(\)/);
  const handler=source.slice(source.indexOf('ttById("ttExportViewerDownload")?.addEventListener'),source.indexOf('ttById("ttWrapJump")?.addEventListener'));
  assert.match(handler,/_bundleArchive && ttIsNativeIpadShell\(\)\) \{\s*await ttSaveLessonBundleFromViewer\(overlay\);\s*return;/);
});

test('concurrent PDF and JSON saves share one Drive folder lookup/create',async()=>{
  let release;const queried=new Promise(resolve=>{release=resolve;});let queries=0,creates=0;const cache=new Map();
  const c=vm.createContext({Promise,Map,localStorage:{getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)},
    ttDriveQueryValue:x=>x,ttDriveRequest:async()=>{queries++;await queried;return {files:[]};},
    ttDriveCreateMetadata:async()=>{creates++;return {id:'one-folder'};}
  });
  const start=source.indexOf('const ttDriveNamedFolderRequests');
  const end=source.indexOf('async function ttDriveUpsertBackup',start);
  vm.runInContext(source.slice(start,end),c);
  const a=c.ttDriveNamedFolder('Lesson Plans','root');const b=c.ttDriveNamedFolder('Lesson Plans','root');
  assert.equal(a,b);release();assert.deepEqual(await Promise.all([a,b]),['one-folder','one-folder']);
  assert.equal(queries,1);assert.equal(creates,1);
  assert.equal(await c.ttDriveNamedFolder('Lesson Plans','root'),'one-folder');assert.equal(queries,1);
});
