/* Charting preview and private export history. Classroom records remain read-only. */
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
    const archiveApi=root.TeachTodayChartingArchive,store=archiveApi.openStore(root.indexedDB);
    let historyLimit=10,historySerial=0,archiveError='',historyTimer;
    const scheduler=archiveApi.service({store,adapter,generate:buildWeekly,changed:error=>{
      archiveError=error || '';clearTimeout(historyTimer);historyTimer=setTimeout(()=>void renderHistory(),80);
    }});
    const viewKey='teachToday.chartingCentral.view';
    const when=value=>value?new Date(value).toLocaleString():'';
    async function buildWeekly(state,meta) {
      const model=api.collect(state,{year:meta.year,scope:'roster'});
      if(!model.rows.length)throw new Error('No saved roster is available for the active school year.');
      const parts=await archiveApi.generateFiles(model,api,await dependencies());
      return reportFrom(meta,model,parts,state);
    }
    function reportFrom(meta,model,parts,state) {
      const name=archiveApi.fileName(meta);
      return {...meta,fileName:name,students:model.rows.length,attempts:model.attempts,earlierAttempts:model.earlierAttempts,
        warnings:model.warnings,sourceSavedAt:state.lastSavedAt || '',pages:parts.reduce((sum,f)=>sum+f.pages,0),
        files:parts.map((part,i)=>({...part,fileName:parts.length>1?name.replace(/\.pdf$/i,` - part ${i+1} of ${parts.length}.pdf`):name}))};
    }
    async function persist(file) {
      if(!file.report) {
        file.meta.snapshotAt=file.meta.createdAt;file.meta.createdAt=new Date().toISOString();file.fileName=archiveApi.fileName(file.meta);
        const parts=file.bytes.length<=14500000?[{bytes:file.bytes,pages:file.pages}]:await archiveApi.generateFiles(file.model,api,await dependencies());
        file.report=reportFrom(file.meta,file.model,parts,file.source);
      }
      await scheduler.record(file.report);return file.report;
    }
    function download(file) {
      const url=URL.createObjectURL(new Blob([file.bytes],{type:'application/pdf'})),link=document.createElement('a');
      link.href=url;link.download=file.fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    async function renderHistory() {
      const request=++historySerial;
      try {
        const [reports,settings]=await Promise.all([store.list(),scheduler.settings()]);if(request!==historySerial)return;
        by('ttChartingWeeklyEnabled').checked=settings.enabled;
        const weekly=reports.filter(r=>r.kind==='weekly'),latest=weekly[0];
        const pending=weekly.reduce((sum,r)=>sum+r.files.filter(f=>f.local?.status!=='verified'||f.drive?.status!=='verified').length,0);
        by('ttChartingWeeklyStatus').textContent=(archiveError || settings.lastFailure)?`Weekly copy needs attention: ${archiveError || settings.lastFailure}`:
          `${settings.enabled?'On · Fridays at 4 PM (device time).':'Paused.'} ${latest?`Latest weekly copy: ${when(latest.createdAt)}. `:''}${pending?`${pending} file(s) need a destination save. `:latest?'Latest copy verified locally and in Drive. ':''}${settings.enabled?`Next Friday: ${archiveApi.nextFriday(new Date()).toLocaleDateString()}.`:''}`;
        const list=by('ttChartingHistoryList');list.replaceChildren();
        if(!reports.length){const p=document.createElement('p');p.textContent='No exports recorded on this device yet. History starts with this update.';list.append(p);}
        for(const report of reports.slice(0,historyLimit)) {
          const item=document.createElement('details'),title=document.createElement('summary');
          title.textContent=`${report.kind==='weekly'?'Weekly · ':''}${report.label} · ${when(report.createdAt)}`;item.append(title);
          const p=document.createElement('p');p.textContent=`${report.year} · ${report.students} student(s) · ${report.attempts} entries · ${report.pages} pages.${report.dueFriday?` Due Friday ${report.dueFriday}; created ${when(report.createdAt)} from the saved records then available.`:''}${report.snapshotAt&&report.snapshotAt!==report.createdAt?` Snapshot prepared ${when(report.snapshotAt)}.`:''}${report.earlierAttempts?` Includes ${report.earlierAttempts} earlier printed entries.`:''}`;item.append(p);
          if(report.openRequestedAt || report.previewDownloadRequestedAt){const action=document.createElement('p');action.textContent=`${report.openRequestedAt?`Open / Print requested ${when(report.openRequestedAt)}. `:''}${report.previewDownloadRequestedAt?`Full PDF download requested ${when(report.previewDownloadRequestedAt)}. `:''}Printing and browser downloads are not confirmed deliveries.`;item.append(action);}
          if(report.warnings?.length){const warning=document.createElement('p');warning.textContent=report.warnings.join(' ');item.append(warning);}
          report.files.forEach((file,index)=>{
            const name=document.createElement('p');name.className='charting-history-filename';name.textContent=file.fileName;item.append(name);
            for(const [key,label] of [['local','Local copy'],['drive','Google Drive']]) {
              const receipt=file[key],status=document.createElement('p');
              status.textContent=receipt?.status==='verified'?`${label}: verified ${when(receipt.verifiedAt)}${receipt.path?` · ${receipt.path}`:''}`:
                `${label}: ${receipt?.status==='saving'?'save in progress or interrupted':receipt?.error || 'not saved'}${receipt?.attemptedAt?` · tried ${when(receipt.attemptedAt)}`:''}`;item.append(status);
            }
            if(file.downloadRequestedAt){const p=document.createElement('p');p.textContent=`Download requested ${when(file.downloadRequestedAt)}; browser save is not verified.`;item.append(p);}
            const open=document.createElement('button');open.type='button';open.textContent=report.files.length>1?`Open / Print part ${index+1}`:'Open / Print saved PDF';
            open.onclick=async()=>{open.disabled=true;try{const stored=await store.get(report.id);await scheduler.note(report.id,'openRequestedAt');adapter.openPdf(stored.files[index].bytes,file.fileName);}catch(error){by('ttChartingHistoryMessage').textContent=error.message;}finally{open.disabled=false;}};item.append(open);
            if(!adapter.isNative?.()){
              const button=document.createElement('button');button.type='button';button.textContent='Download saved PDF';button.onclick=async()=>{
                button.disabled=true;try{const stored=await store.get(report.id);download(stored.files[index]);await scheduler.note(report.id,'downloadRequestedAt',index);await renderHistory();}catch(error){by('ttChartingHistoryMessage').textContent=error.message;}finally{button.disabled=false;}
              };item.append(button);
            }
          });
          const incomplete=report.files.some(f=>f.local?.status!=='verified'||f.drive?.status!=='verified');
          if(incomplete){const retry=document.createElement('button');retry.type='button';retry.textContent='Retry pending saves';retry.onclick=async()=>{retry.disabled=true;try{await scheduler.deliver(await store.get(report.id),['local','drive'],true);await renderHistory();}catch(error){by('ttChartingHistoryMessage').textContent=error.message;retry.disabled=false;}};item.append(retry);}
          list.append(item);
        }
        by('ttChartingHistoryMore').hidden=reports.length<=historyLimit;
      }catch(error){by('ttChartingHistoryMessage').textContent=`Export history is unavailable. ${error.message}`;}
    }
    by('ttChartingHistoryMore').onclick=()=>{historyLimit+=10;void renderHistory();};
    by('ttChartingWeeklyEnabled').onchange=async()=>{try{await scheduler.enable(by('ttChartingWeeklyEnabled').checked);await renderHistory();}catch(error){by('ttChartingHistoryMessage').textContent=error.message;}};
    by('ttChartingWeeklyRetry').onclick=async()=>{const button=by('ttChartingWeeklyRetry');button.disabled=true;try{await scheduler.run({force:true,interactive:true});await renderHistory();}finally{button.disabled=false;}};
    by('ttChartingLocalFolder').hidden=!adapter.connectLocalFolder || Boolean(adapter.isNative?.());
    by('ttChartingLocalFolder').onclick=async()=>{try{await adapter.connectLocalFolder(store);by('ttChartingHistoryMessage').textContent='Local charting folder connected. Retrying pending weekly copies…';await scheduler.run({force:true});await renderHistory();}catch(error){by('ttChartingHistoryMessage').textContent=error.message;}};
    const checkWeekly=()=>{if(document.visibilityState!=='hidden')void scheduler.run();};
    setTimeout(checkWeekly,12000);setInterval(checkWeekly,60000);
    root.addEventListener('online',()=>void scheduler.run({force:true}));root.addEventListener('pageshow',checkWeekly);
    document.addEventListener('visibilitychange',checkWeekly);
    let savedTimer;root.addEventListener('teachTodayStateSaved',()=>{clearTimeout(savedTimer);savedTimer=setTimeout(checkWeekly,15000);});
    void renderHistory();
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
      by('ttChartingDownload').textContent=adapter.isNative?.()?'Save to iPad Files':'Download / Save PDF';
      const state=adapter.getState(),last=remembered(),year=state.activeSchoolYearId || `${new Date().getFullYear()}-${new Date().getFullYear()+1}`;
      const years=[...new Set([year,...(state.schoolYears || []).map(y=>y.id),...(state.groups || []).map(g=>g.schoolYearId)])].filter(Boolean).sort().reverse();
      selectOptions(by('ttChartingYear'),years.map(id=>({id,name:id})),last?.year || year);
      by('ttChartingScope').value=['student','group','roster'].includes(last?.scope)?last.scope:'student';panel.hidden=false;document.body.style.overflow='hidden';
      pickers(true,true,last || {groupId:adapter.activeGroupId(),studentId:adapter.activeStudentId?.() || ''});void renderHistory();by('ttChartingClose').focus();
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
        const meta={id:root.crypto.randomUUID?.() || `export-${Date.now()}-${Math.random().toString(16).slice(2)}`,kind:'manual',year:o.year,scope:o.scope,label:scope,createdAt:new Date().toISOString()};
        artifact={bytes:result.bytes,studentPages:result.studentPages,pages:result.pages,model,meta,source:{lastSavedAt:state.lastSavedAt},fileName:archiveApi.fileName(meta)};
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
        const report=await scheduler.deliver(await persist(file),['drive'],true);
        file.report=report || file.report;file.driveSaved=file.report.files.every(f=>f.drive?.status==='verified');
        if(artifact!==file)return;
        if(!file.driveSaved)throw new Error(file.report.files.find(f=>f.drive?.status!=='verified')?.drive?.error || 'Another save is in progress. Retry shortly.');
        by('ttChartingDelivery').textContent=`Verified in Google Drive: Teach Today Backups/Charting/${file.report.files.map(f=>f.fileName).join('; ')}`;
        by('ttChartingDrive').textContent='Saved to Google Drive';
      }catch(error){if(artifact===file){reconnect=true;by('ttChartingDrive').textContent='Reconnect Drive & retry';by('ttChartingDelivery').textContent=`Google Drive was not verified. ${error.message} The created PDF is still available to download.`;}}
      finally{file.saving=false;if(artifact===file){controls();by('ttChartingDrive').disabled=Boolean(file.driveSaved);}void renderHistory();}
    });
    by('ttChartingDownload').addEventListener('click',async()=>{
      const file=artifact;if(!file||file.saving)return;file.saving=true;controls();
      try {
        let report=await persist(file);
        if(adapter.isNative?.() || await adapter.hasLocalFolder?.(store)) {
          report=await scheduler.deliver(report,['local'],true) || report;file.report=report;
          const pending=report.files.find(f=>f.local?.status!=='verified');if(pending)throw new Error(pending.local?.error || 'Another save is in progress. Retry shortly.');
          if(artifact===file)by('ttChartingDelivery').textContent=`${adapter.isNative?.()?'Saved to iPad Files':'Verified in local folder'}: ${report.files.map(f=>f.local.path).join('; ')}`;
        } else {
          download(file);await scheduler.note(report.id,'previewDownloadRequestedAt');
          if(report.files.length===1)await scheduler.note(report.id,'downloadRequestedAt',0);if(artifact===file)by('ttChartingDelivery').textContent='Download requested. Your browser controls the save location; local saving is not verified.';
        }
      }catch(error){if(artifact===file)by('ttChartingDelivery').textContent=`The PDF could not be saved on this device. ${error.message} Save to Google Drive or use Open / Print PDF.`;}
      finally{file.saving=false;if(artifact===file)controls();void renderHistory();}
    });
    by('ttChartingOpen').addEventListener('click',async()=>{
      const file=artifact;if(!file||file.saving)return;file.saving=true;controls();
      try{const report=await persist(file);await scheduler.note(report.id,'openRequestedAt');adapter.openPdf(file.bytes,file.fileName);}catch(error){by('ttChartingDelivery').textContent=`Export history could not be saved. ${error.message}`;}finally{file.saving=false;if(artifact===file)controls();void renderHistory();}
    });
    by('ttChartingPrevious').addEventListener('click',()=>preview().goTo(preview().page-1));
    by('ttChartingNext').addEventListener('click',()=>preview().goTo(preview().page+1));
    by('ttChartingFit').addEventListener('change',()=>preview().setView({fit:by('ttChartingFit').value}));
    by('ttChartingJump').addEventListener('change',()=>preview().goTo(Number(by('ttChartingJump').value)));
  }
  root.TeachTodayChartingExportUI={install};
})(window);
