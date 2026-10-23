const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const PDFLib=require('../vendor/pdf-lib.min.js');
const fontkit=require('../vendor/fontkit-1.1.1.min.js');
const api=require('../charting-export.js');
const resources={PDFLib,fontkit,templateBytes:fs.readFileSync('assets/wrs-charting-template.pdf'),fontBytes:fs.readFileSync('vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf'),fields:JSON.parse(fs.readFileSync('assets/wrs-charting-fields.json'))};
function state() {return {activeSchoolYearId:'2026-2027',groups:[{id:'g',name:'Group 1',schoolYearId:'2026-2027',studentIds:{'Example A.':'a'},membershipHistory:[{studentId:'b',displayNameAtStart:'Example B.',startedOn:'2026-08-01',endedOn:'2026-09-01'}]},{id:'other',name:'Group 2',schoolYearId:'2026-2027',studentIds:{'Example B.':'b'}},{id:'demo',name:'Demo Group',schoolYearId:'2026-2027',studentIds:{Test:'test'}}],rosterStudents:[{studentId:'a',displayName:'Example A.',aliases:['Earlier A.']},{studentId:'b',displayName:'Example B.'}],masterRecords:[]};}
const record=(id='r',extra={})=>({id,studentId:'a',student:'Example A.',groupId:'g',date:'2026-10-21',schoolYearId:'2026-2027',substep:'4.1',wordlistPage:20,seconds:44,correct:13,total:15,level:'N',chartHalf:'bottom',wrongWords:['gruth','missing'],wordRecords:[{word:'gruth',section:'top',correct:false,said:'DO NOT BORROW'},{word:'gruth',section:'bottom',correct:false,said:'grüth'},{word:'missing',section:'bottom',correct:false,said:''}],...extra});
const options={year:'2026-2027',scope:'roster'};

test('scope uses historical membership, follows student identity across groups, and excludes demo',()=>{
 const s=state();s.masterRecords=[record(),record('moved',{studentId:'b',student:'Example B.',groupId:'other'}),record('demo',{studentId:'test',groupId:'demo'})];const before=JSON.stringify(s);
 assert.equal(api.collect(s,options).attempts,2);
 assert.equal(api.collect(s,{...options,scope:'group',groupId:'g'}).attempts,2);
 assert.equal(api.collect(s,{...options,scope:'student',groupId:'g',studentId:'b'}).attempts,1);
 assert.equal(JSON.stringify(s),before);
});
test('actual school-year dates take precedence, invalid dates are not shifted, and unlinked evidence is disclosed',()=>{
 const s=state();s.masterRecords=[record('june',{date:'2026-06-30',schoolYearId:'2026-2027'}),record('july',{date:'2026-07-01',schoolYearId:'2025-2026'}),record('unknown',{studentId:'unresolved'}),record('sounds',{type:'soundsDrill'})];
 const result=api.collect(s,options);assert.equal(result.attempts,1);assert.equal(result.rows[0].attempts[0].id,'july');assert.match(result.warnings.join(' '),/could not be linked/);
 assert.equal(api.day('2026-02-30'),'');assert.equal(api.day('10/21/26'),'2026-10-21');
});
test('missing responses print only their target, repeated misses pair in order, and only the scored half is used',()=>{
 const r=record();r.wrongWords=['gruth','gruth','missing'];r.wordRecords.push({word:'gruth',section:'bottom',correct:false,said:'grīth'});
 assert.deepEqual(api.misses(r),[{word:'gruth',said:'grüth'},{word:'gruth',said:'grīth'},{word:'missing',said:''}]);
 r.wordRecords[2].said='Response not recorded';assert.equal(api.misses(r)[2].said,'');
});
test('earlier PDF entries merge only as read-only reporting evidence and uncertain dates remain visible',()=>{
 const s=state();s.masterRecords=[record()];const old=[{...record(),studentId:undefined,student:'Earlier A.'},{...record(),studentId:undefined,student:'Earlier A.',date:'2026-08-26',printedGrayRows:[13,12]}];
 const before=JSON.stringify({s,old}), result=api.collect(s,options,old);
 assert.equal(result.attempts,2);assert.equal(result.savedAttempts,1);assert.equal(result.earlierAttempts,1);assert.equal(result.possibleDates,1);assert.match(result.warnings.join(' '),/Both dates are retained/);assert.equal(JSON.stringify({s,old}),before);
});
test('an older transcription is retained if none of the matching saved attempts contains it',()=>{
 const s=state();s.masterRecords=[record('r',{wordRecords:[]})];const old=[record('old',{studentId:undefined})];
 assert.equal(api.collect(s,options,old).earlierAttempts,1);
 s.masterRecords.push(record());assert.equal(api.collect(s,options,old).earlierAttempts,0);
});
test('a prior whole-roster report quietly filters other students and never guesses an ambiguous name',()=>{
 const s=state(),prior=[record('old',{studentId:undefined,student:'Example B.'})];
 const result=api.collect(s,{...options,scope:'student',groupId:'g',studentId:'a'},prior);
 assert.equal(result.earlierAttempts,0);assert.doesNotMatch(result.warnings.join(' '),/could not be linked/);
 s.rosterStudents.forEach(p=>p.aliases=['Same first name']);
 const ambiguous=api.collect(s,{...options,scope:'student',groupId:'g',studentId:'a'},[record('old',{studentId:undefined,student:'Same first name'})]);
 assert.equal(ambiguous.earlierAttempts,0);assert.match(ambiguous.warnings.join(' '),/could not be linked/);
});
test('full history paginates beyond 24 attempts and error overflow continues without dropping targets',async()=>{
 const s=state();s.masterRecords=Array.from({length:25},(_,i)=>record(`r${i}`));s.masterRecords[0].wrongWords=Array.from({length:15},(_,i)=>`target${i}`);s.masterRecords[0].correct=0;
 const model=api.collect(s,{...options,scope:'student',groupId:'g',studentId:'a'}), pdf=await api.generate(model,resources), doc=await PDFLib.PDFDocument.load(pdf.bytes);
 assert.equal(pdf.pages,3);assert.equal(pdf.fields,3*193);
 const values=doc.getForm().getFields().filter(f=>typeof f.getText==='function').map(f=>f.getText());
 for(let i=0;i<15;i++)assert.ok(values.includes(`target${i}`));assert.ok(values.some(v=>v?.includes('cont.')));
 assert.equal(model.attempts,25);
});
test('editable form values, widget appearances, Unicode, exact geometry, and prior-PDF round trip agree',async()=>{
 const s=state();s.masterRecords=[record('real',{level:'AB'}),record('nonsense',{date:'2026-10-22',wordRecords:[{word:'gruth',section:'bottom',correct:false,said:'grüth ē ī'}]})];
 const model=api.collect(s,{...options,scope:'student',groupId:'g',studentId:'a'}), pdf=await api.generate(model,resources), doc=await PDFLib.PDFDocument.load(pdf.bytes), fields=doc.getForm();
 assert.equal(pdf.pages,2);assert.equal(fields.getFields().length,386);
 assert.equal(fields.getTextField('S1.P1.F__R NRow1_2').getText(),'gruth (grüth ē ī)');
 assert.equal(fields.getTextField('S1.P1.F__R NRow2_2').getText(),'missing');
 assert.equal(fields.getCheckBox('S1.P1.F__R').isChecked(),true);assert.equal(fields.getCheckBox('S1.P1.F__N').isChecked(),false);
 assert.equal(fields.getCheckBox('S1.P1.F__R_2').isChecked(),false);assert.equal(fields.getCheckBox('S1.P1.F__N_2').isChecked(),true);
 for(const f of fields.getFields())for(const w of f.acroField.getWidgets())assert.ok(w.getAppearances().normal);
 const w=fields.getTextField('S1.P1.F__R NRow1_2').acroField.getWidgets()[0].getRectangle();assert.ok(Math.abs(w.x-135)<.001);assert.ok(Math.abs(w.width-52.68)<.001);
 assert.ok(pdf.layout.every(v=>v.lines.length*v.size*1.08<=v.rect[3]-v.rect[1]-2.5+.001));
 const earlier=await api.readEarlierPdf(pdf.bytes,PDFLib);assert.equal(earlier.length,2);assert.equal(earlier[0].level,'R');assert.equal(earlier[1].level,'N');assert.equal(earlier[1].wordRecords[0].said,'grüth ē ī');assert.ok(earlier[1].printedGrayRows.includes(13));assert.equal(api.collect(s,options,earlier).earlierAttempts,0);
});
test('Drive saver uses Charting, verifies bytes, and rejects corrupt readback without classroom writes',async()=>{
 const source=fs.readFileSync('teach-today.js','utf8'),start=source.indexOf('async function ttSaveDriveChartingPdf'),end=source.indexOf('async function ttSaveDownloadedLessonPlanPdf',start);let corrupt=false;const folders=[];
 const bytes=new Uint8Array([1,2,3]),context=vm.createContext({Blob,Uint8Array,encodeURIComponent,ttEnsureDrivePermission:async()=>true,ttIndependentDriveFolderName:'Teach Today Backups',ttDriveNamedFolder:async name=>{folders.push(name);return name;},ttDriveUpsertBackup:async()=>({id:'file'}),ttDriveHeaders:()=>({}),ttDocumentSha256Hex:async data=>crypto.createHash('sha256').update(data).digest('hex'),fetch:async()=>({ok:true,arrayBuffer:async()=>corrupt?new Uint8Array([9]).buffer:bytes.buffer})});
 vm.runInContext(source.slice(start,end),context);assert.equal((await context.ttSaveDriveChartingPdf(bytes,'same.pdf')).id,'file');assert.deepEqual(folders,['Teach Today Backups','Charting']);corrupt=true;await assert.rejects(context.ttSaveDriveChartingPdf(bytes,'same.pdf'),/did not match/);
});
test('closing or changing the charting view cancels the remaining sheets',async()=>{
 const s=state();s.masterRecords=[record()];const model=api.collect(s,options);let active=true,count=0;
 await assert.rejects(api.generate(model,{...resources,shouldContinue:()=>active,onProgress:()=>{count++;active=false;}}),/canceled/);
 assert.equal(count,1);
});
