/* Session-only charting export controls. The adapter owns existing app services. */
(function (root) {
  'use strict';
  let assets;
  async function dependencies() {
    if (!assets) assets=(async () => {
      if (!root.fontkit) await new Promise((resolve,reject) => {
        const script=document.createElement('script');script.src='vendor/fontkit-1.1.1.min.js';
        script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('The charting font helper is unavailable. Reopen online once to cache it.'));};document.head.append(script);
      });
      const get=async (url,json=false) => {const r=await fetch(url);if(!r.ok)throw new Error('The blank charting form is unavailable. Reopen online once to cache it.');return json?r.json():r.arrayBuffer();};
      const [templateBytes,fontBytes,fields]=await Promise.all([get('assets/wrs-charting-template.pdf'),get('vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf'),get('assets/wrs-charting-fields.json',true)]);
      return {PDFLib:root.PDFLib,fontkit:root.fontkit,templateBytes,fontBytes,fields};
    })().catch(error=>{assets=null;throw error;});
    return assets;
  }
  function install(adapter) {
    const api=root.TeachTodayChartingExport, by=id=>document.getElementById(id), panel=by('ttChartingExportPanel');
    if (!panel || panel.dataset.installed) return;panel.dataset.installed='true';
    let serial=0,prior=[],artifact=null,viewer=null,returnFocus=null,busy=false,reconnect=false;
    const viewKey='teachToday.chartingCentral.view';
    const remembered=()=>{try{return JSON.parse(localStorage.getItem(viewKey)||'null');}catch(_){return null;}};
    const remember=()=>{try{localStorage.setItem(viewKey,JSON.stringify(options()));}catch(_){/* View preferences never block reporting. */}};
    const selectOptions=(element,items,value) => {
      element.replaceChildren(...items.map(({id,name})=>{const option=document.createElement('option');option.value=id;option.textContent=name;return option;}));
      if (items.some(o=>o.id===value))element.value=value;
    };
    const options=()=>({year:by('ttChartingYear').value,scope:by('ttChartingScope').value,groupId:by('ttChartingGroup').value,studentId:by('ttChartingStudent').value});
    function controls() {
      ['ttChartingYear','ttChartingScope','ttChartingGroup','ttChartingStudent','ttChartingPriorFile','ttChartingPriorClear','ttChartingCreate'].forEach(id=>by(id).disabled=busy);
      ['ttChartingDrive','ttChartingDownload','ttChartingOpen'].forEach(id=>by(id).disabled=busy || !artifact || artifact.saving);
    }
    function preview() {
      if (!viewer) viewer=new root.TeachTodayLessonPdfPreview({viewport:by('ttChartingPdfViewport'),canvas:by('ttChartingPdfCanvas'),message:by('ttChartingPdfMessage'),
        onPageChange:({page,total,busy:rendering})=>{
          by('ttChartingPdfPage').textContent=total?`Page ${page} of ${total}`:'No PDF created';
          by('ttChartingPrevious').disabled=rendering || page<=1;by('ttChartingNext').disabled=rendering || !total || page>=total;
          if(!rendering&&total)by('ttChartingPdfCanvas').setAttribute('aria-label',`Charting page ${page} of ${total}`);
          const student=artifact?.studentPages?.find(s=>page>=s.firstPage&&page<=s.lastPage);
          if(student)by('ttChartingJump').value=String(student.firstPage);
        }});
      return viewer;
    }
    function invalidate() {
      serial++;artifact=null;reconnect=false;by('ttChartingDrive').textContent='Save to Google Drive';
      by('ttChartingJumpLabel').hidden=true;
      by('ttChartingDelivery').textContent='';preview().clear('Choose a scope, then create the charting PDF.');controls();
    }
    function summary() {
      try {
        const model=api.collect(adapter.getState(),options(),prior);
        by('ttChartingSummary').textContent=`${model.rows.length} student(s) · ${model.savedAttempts} saved attempt(s)${model.earlierAttempts?` + ${model.earlierAttempts} earlier printed entry/entries`:''} · ${model.year}.`;
        by('ttChartingWarnings').textContent=model.warnings.join(' ');
      } catch(error) {by('ttChartingSummary').textContent=error.message;by('ttChartingWarnings').textContent='';}
    }
    function pickers(resetGroup=false,resetStudent=false,preferred=null) {
      const state=adapter.getState(),o=options(),g=api.groups(state,o.year);
      selectOptions(by('ttChartingGroup'),g.map(g=>({id:g.id,name:g.name})),preferred?.groupId || (resetGroup?adapter.activeGroupId():o.groupId));
      const people=api.students(state,{year:o.year,groupId:by('ttChartingGroup').value});
      selectOptions(by('ttChartingStudent'),people,preferred?.studentId || (resetStudent?'':o.studentId));
      by('ttChartingGroupLabel').hidden=o.scope==='roster';by('ttChartingStudentLabel').hidden=o.scope!=='student';
      remember();invalidate();summary();void create();
    }
    function open() {
      returnFocus=document.activeElement;adapter.stopMirror();
      const state=adapter.getState(),last=remembered(),year=state.activeSchoolYearId || `${new Date().getFullYear()}-${new Date().getFullYear()+1}`;
      const years=[...new Set([year,...(state.schoolYears || []).map(y=>y.id),...(state.groups || []).map(g=>g.schoolYearId)])].filter(Boolean).sort().reverse();
      selectOptions(by('ttChartingYear'),years.map(id=>({id,name:id})),last?.year || year);
      by('ttChartingScope').value=['student','group','roster'].includes(last?.scope)?last.scope:'student';panel.hidden=false;document.body.style.overflow='hidden';
      pickers(true,true,last || {groupId:adapter.activeGroupId(),studentId:adapter.activeStudentId?.() || ''});by('ttChartingClose').focus();
    }
    function close() {
      serial++;panel.hidden=true;busy=false;prior=[];by('ttChartingPriorFile').value='';by('ttChartingPriorStatus').textContent='No earlier PDF selected.';
      artifact=null;viewer?.clear();document.body.style.overflow='';returnFocus?.focus();
    }
    ['ttHomeChartingExport','ttChartingExportRecords'].forEach(id=>by(id)?.addEventListener('click',open));
    by('ttChartingClose').addEventListener('click',close);
    by('ttChartingExportMenu').addEventListener('click',()=>{by('ttChartingExportActions').open=true;by('ttChartingExportActions').scrollIntoView({block:'nearest'});by('ttChartingDrive').focus();});
    panel.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key==='Tab'){
        const all=[...panel.querySelectorAll('button,select,input,a[href]')].filter(e=>!e.disabled&&e.getClientRects().length),first=all[0],last=all.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
    by('ttChartingYear').addEventListener('change',()=>pickers(true,true));
    by('ttChartingScope').addEventListener('change',()=>pickers());
    by('ttChartingGroup').addEventListener('change',()=>pickers(false,true));
    by('ttChartingStudent').addEventListener('change',()=>{remember();invalidate();summary();void create();});
    by('ttChartingPriorClear').addEventListener('click',()=>{prior=[];by('ttChartingPriorFile').value='';by('ttChartingPriorStatus').textContent='No earlier PDF selected.';invalidate();summary();void create();});
    by('ttChartingPriorFile').addEventListener('change',async()=>{
      const file=by('ttChartingPriorFile').files[0];invalidate();prior=[];summary();if(!file)return;
      const request=serial;busy=true;controls();by('ttChartingPriorStatus').textContent='Reading earlier charting…';
      try {
        if(file.size>50*1024*1024)throw new Error('Choose a charting PDF smaller than 50 MB.');
        const entries=await api.readEarlierPdf(new Uint8Array(await file.arrayBuffer()),root.PDFLib);
        if(request!==serial)return;prior=entries;by('ttChartingPriorStatus').textContent=`${file.name} · ${entries.length} printed entries. Used only for this export; classroom records are unchanged.`;summary();
      } catch(error){if(request===serial){by('ttChartingPriorFile').value='';by('ttChartingPriorStatus').textContent=error.message;}}
      finally {if(request===serial){busy=false;controls();void create();}}
    });
    async function create() {
      invalidate();const request=serial;busy=true;controls();by('ttChartingDelivery').textContent='Creating the fillable charting PDF…';
      try {
        const state=JSON.parse(JSON.stringify(adapter.getState())),o=options(),model=api.collect(state,o,prior);
        const result=await api.generate(model,{...await dependencies(),shouldContinue:()=>request===serial,onProgress:(page,total)=>{if(request===serial)by('ttChartingDelivery').textContent=`Preparing charting pages: ${page} of ${total}…`;}});if(request!==serial)return;
        const scope=o.scope==='roster'?'Whole roster':o.scope==='student'?model.rows[0].name:api.groups(state,o.year).find(g=>g.id===o.groupId)?.name || 'Group';
        const clean=value=>String(value).replace(/[^a-z0-9 ._()-]+/gi,'-').slice(0,40);
        const stamp=new Date().toISOString().replace(/[:.]/g,'-'),identity=root.crypto.randomUUID?.().slice(0,8) || Math.random().toString(16).slice(2,10);
        artifact={bytes:result.bytes,studentPages:result.studentPages,fileName:`WRS Charting - ${clean(o.year)} - ${clean(scope)} - ${stamp} - ${identity}.pdf`};
        selectOptions(by('ttChartingJump'),result.studentPages.map(s=>({id:String(s.firstPage),name:s.name})),String(result.studentPages[0].firstPage));
        by('ttChartingJumpLabel').hidden=result.studentPages.length<=1;
        by('ttChartingSummary').textContent=`${model.rows.length} student(s) · ${model.attempts} charting entries · ${result.pages} pages · ${model.year}.`;
        by('ttChartingWarnings').textContent=model.warnings.join(' ');by('ttChartingDelivery').textContent='PDF created. Choose Save to Google Drive, Download PDF, or Open / Print PDF.';
        const rendered=await preview().load(result.bytes);if(request!==serial)return;
        if(!rendered)by('ttChartingDelivery').textContent='PDF created. The inline preview could not load; Download PDF or Open / Print PDF is available.';
      } catch(error){if(request===serial)by('ttChartingDelivery').textContent=`The PDF was not created. ${error.message}`;}
      finally{if(request===serial){busy=false;controls();}}
    }
    by('ttChartingCreate').addEventListener('click',create);
    by('ttChartingDrive').addEventListener('click',async()=>{
      const file=artifact;if(!file||file.saving||file.driveSaved)return;
      file.saving=true;controls();by('ttChartingDelivery').textContent='Saving to Google Drive and verifying the PDF…';
      try {
        if(reconnect)await adapter.reconnectDrive();
        const saved=await adapter.saveDrive(file.bytes,file.fileName);file.driveSaved=true;
        if(artifact!==file)return;
        by('ttChartingDelivery').textContent=`Verified in Google Drive: Teach Today Backups/Charting/${file.fileName}`;
        if(saved.webViewLink){const link=document.createElement('a');link.textContent=' Open saved PDF';link.href=saved.webViewLink;link.target='_blank';link.rel='noopener';by('ttChartingDelivery').append(link);}
        by('ttChartingDrive').textContent='Saved to Google Drive';
      }catch(error){if(artifact===file){reconnect=true;by('ttChartingDrive').textContent='Reconnect Drive & retry';by('ttChartingDelivery').textContent=`Google Drive was not verified. ${error.message} The created PDF is still available to download.`;}}
      finally{file.saving=false;if(artifact===file){controls();by('ttChartingDrive').disabled=Boolean(file.driveSaved);}}
    });
    by('ttChartingDownload').addEventListener('click',async()=>{
      const file=artifact;if(!file)return;
      try {
        if(adapter.saveLocal){const result=await adapter.saveLocal(file.bytes,file.fileName);if(result){if(artifact===file)by('ttChartingDelivery').textContent=`Saved to iPad Files: ${result.path}`;return;}}
        const url=URL.createObjectURL(new Blob([file.bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download=file.fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
      }catch(error){if(artifact===file)by('ttChartingDelivery').textContent=`The PDF could not be saved on this device. ${error.message} Save to Google Drive or use Open / Print PDF.`;}
    });
    by('ttChartingOpen').addEventListener('click',()=>{if(artifact)adapter.openPdf(artifact.bytes,artifact.fileName);});
    by('ttChartingPrevious').addEventListener('click',()=>preview().goTo(preview().page-1));
    by('ttChartingNext').addEventListener('click',()=>preview().goTo(preview().page+1));
    by('ttChartingFit').addEventListener('change',()=>preview().setView({fit:by('ttChartingFit').value}));
    by('ttChartingJump').addEventListener('change',()=>preview().goTo(Number(by('ttChartingJump').value)));
  }
  root.TeachTodayChartingExportUI={install};
})(window);
