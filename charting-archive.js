/* Private report archive. Independent of classroom storage and Firebase. */
(function (root) {
  'use strict';
  const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function dueFriday(now, startedOn) {
    const friday=new Date(now.getFullYear(),now.getMonth(),now.getDate(),16);
    friday.setDate(friday.getDate()-((friday.getDay()+2)%7));
    if (friday>now) friday.setDate(friday.getDate()-7);
    return dateKey(friday)>=startedOn ? dateKey(friday) : '';
  }
  function nextFriday(now) {
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),16);
    d.setDate(d.getDate()+((5-d.getDay()+7)%7));if(d<=now)d.setDate(d.getDate()+7);return d;
  }
  function fileName({year,label,createdAt,kind,dueFriday:due,id}) {
    const clean=(v,n)=>String(v).replace(/[^a-z0-9 ._()-]+/gi,'-').slice(0,n);
    const d=new Date(createdAt), stamp=`${dateKey(d)} ${String(d.getHours()).padStart(2,'0')}-${String(d.getMinutes()).padStart(2,'0')}-${String(d.getSeconds()).padStart(2,'0')}`;
    return `WRS Charting - ${clean(year,12)} - ${clean(label,32)} - ${kind==='weekly'?`Friday ${due} - `:''}${stamp} - ${clean(id.slice(-8),8)}.pdf`;
  }
  const metadata = report => ({...report, files:report.files.map(({bytes,...file})=>file)});
  function openStore(indexedDB) {
    let dbPromise;
    async function db() {
      if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
        const r=indexedDB.open('teachTodayChartingArchive.v1',1);
        r.onupgradeneeded=()=>['reports','files','settings'].forEach(s=>r.result.createObjectStore(s));
        r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();dbPromise=null;};resolve(r.result);};
        r.onerror=()=>{dbPromise=null;reject(r.error);};
      });return dbPromise;
    }
    async function transaction(names,mode,work) {
      const database=await db();return new Promise((resolve,reject)=>{
        const tx=database.transaction(names,mode);let result;
        tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error || new Error('The charting history could not be saved on this device.'));
        try{work(tx,value=>{result=value;});}catch(error){tx.abort();reject(error);}
      });
    }
    const read=(store,key)=>transaction([store],'readonly',(tx,done)=>{const r=tx.objectStore(store).get(key);r.onsuccess=()=>done(r.result);});
    return {
      settings:()=>read('settings','weekly'),
      setSettings:value=>transaction(['settings'],'readwrite',tx=>tx.objectStore('settings').put(value,'weekly')),
      list:()=>transaction(['reports'],'readonly',(tx,done)=>{const r=tx.objectStore('reports').getAll();r.onsuccess=()=>done(r.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));}),
      async get(id) {const report=await read('reports',id);if(!report)return null;for(let i=0;i<report.files.length;i++)report.files[i].bytes=await read('files',`${id}:${i}`);return report;},
      add:report=>transaction(['reports','files'],'readwrite',tx=>{
        tx.objectStore('reports').add(metadata(report),report.id);
        report.files.forEach((f,i)=>tx.objectStore('files').add(f.bytes,`${report.id}:${i}`));
      }),
      update:report=>transaction(['reports'],'readwrite',tx=>tx.objectStore('reports').put(metadata(report),report.id)),
      claim:(name,owner,now)=>transaction(['settings'],'readwrite',(tx,done)=>{
        const s=tx.objectStore('settings'),r=s.get(name);r.onsuccess=()=>{
          if(r.result?.expires>now && r.result.owner!==owner){done(false);return;}
          s.put({owner,expires:now+600000},name);done(true);
        };
      }),
      release:(name,owner)=>transaction(['settings'],'readwrite',tx=>{const s=tx.objectStore('settings'),r=s.get(name);r.onsuccess=()=>{if(r.result?.owner===owner)s.delete(name);};}),
      getSetting:key=>read('settings',key),
      setSetting:(key,value)=>transaction(['settings'],'readwrite',tx=>tx.objectStore('settings').put(value,key))
    };
  }
  // Rebuild bounded parts directly from evidence so every part keeps its own
  // editable form tree. Copying PDF pages alone would lose AcroForm membership.
  function partition(model, api, maxPages=60) {
    const rows=[];
    for(const row of model.rows) {
      if(Math.max(2,Math.ceil(api.columns(row).length/12))<=maxPages){rows.push(row);continue;}
      let attempts=[],count=0;
      for(const attempt of row.attempts) {
        const n=api.columns({attempts:[attempt]}).length;
        if(n>maxPages*12)throw new Error('One charting attempt exceeds the report part limit. No entries were dropped.');
        if(count+n>maxPages*12){rows.push({...row,attempts});attempts=[];count=0;}
        attempts.push(attempt);count+=n;
      }
      if(attempts.length)rows.push({...row,attempts});
    }
    const models=[];let batch=[],pages=0;
    for(const row of rows){const n=Math.max(2,Math.ceil(api.columns(row).length/12));if(batch.length&&pages+n>maxPages){models.push({...model,rows:batch});batch=[];pages=0;}batch.push(row);pages+=n;}
    if(batch.length)models.push({...model,rows:batch});return models;
  }
  async function generateFiles(model, api, resources, maxPages=60, maxBytes=14500000) {
    const files=[];
    for(const part of partition(model,api,maxPages)) {
      const result=await api.generate(part,resources);
      if(result.bytes.length<=maxBytes)files.push({bytes:result.bytes,pages:result.pages});
      else {
        if(maxPages<=2)throw new Error('A charting sheet exceeds the local file limit. No entries were dropped.');
        files.push(...await generateFiles(part,api,resources,Math.max(2,Math.floor(maxPages/2)),maxBytes));
      }
    }
    return files;
  }
  function service({store,adapter,generate,now=()=>new Date(),changed=()=>{}}) {
    const owner=root.crypto?.randomUUID?.() || `report-${Math.random()}`,iso=()=>now().toISOString(),held=new Set();let running=null;
    async function locked(name,job) {
      if(held.has(name))return;held.add(name);
      try{if(!await store.claim(name,owner,now().getTime())){held.delete(name);return;}}catch(error){held.delete(name);throw error;}
      const heartbeat=setInterval(()=>store.claim(name,owner,now().getTime()).catch(()=>{}),30000);
      try{return await job();}finally{clearInterval(heartbeat);held.delete(name);await store.release(name,owner);}
    }
    async function settings() {
      let s=await store.settings();if(!s){s={enabled:true,startedOn:dateKey(now())};await store.setSettings(s);}return s;
    }
    async function record(report) {
      if(!report.archived){if(!await store.get(report.id))await store.add(report);report.archived=true;changed();}return report;
    }
    async function deliver(report, destinations=['local','drive'], interactive=false) {
      return locked(`delivery:${report.id}`,async()=>{
        // Re-read destination receipts, including a different tab's saves.
        const saved=await store.get(report.id);if(saved)report=saved;
        for(const destination of destinations) {
          for(const file of report.files) {
            if(file[destination]?.status==='verified')continue;
            file[destination]={...file[destination],status:'saving',attemptedAt:iso(),error:''};await store.update(report);changed();
            try {
              const result=await adapter[destination==='local'?'saveLocal':'saveDrive'](file.bytes,file.fileName,{interactive});
              if(!result)throw new Error(destination==='local'?'Choose a local charting folder, or use Stage on the iPad.':'Connect Google Drive to finish this copy.');
              file[destination]={status:'verified',attemptedAt:file[destination].attemptedAt,verifiedAt:iso(),path:result.path || '',id:result.id || '',webViewLink:result.webViewLink || ''};
            }catch(error){file[destination]={status:'pending',attemptedAt:iso(),error:error.message};}
            await store.update(report);changed();
          }
        }
        return report;
      });
    }
    async function announce(report) {
      if(!report)return;
      const local=report.files.filter(f=>f.local?.status==='verified').length,drive=report.files.filter(f=>f.drive?.status==='verified').length;
      const signature=`${report.id}:${local}:${drive}`,s=await settings();if(s.lastNotice===signature)return;
      await store.setSettings({...s,lastNotice:signature});
      adapter.notify?.(`Friday charting copy: local ${local}/${report.files.length}, Drive ${drive}/${report.files.length} verified.${local<report.files.length || drive<report.files.length?' Open Charting Central to finish pending saves.':''}`,local===report.files.length&&drive===report.files.length?'success':'warning');
    }
    async function run(options={}) {
      if(running)return running;
      running=locked('weekly-run',async()=>{
        const s=await settings();if(!s.enabled&&!options.force)return;
        // Pending exact snapshots survive reloads/offline; never regenerate them.
        const reports=await store.list(),retryAfter=15*60*1000;
        const pending=reports.filter(r=>r.kind==='weekly'&&r.files.some(f=>['local','drive'].some(k=>f[k]?.status!=='verified'&&(options.force || !f[k]?.attemptedAt || now()-new Date(f[k].attemptedAt)>=retryAfter))));
        for(const r of pending)await announce(await deliver(await store.get(r.id),['local','drive'],Boolean(options.interactive)));
        const due=dueFriday(now(),s.startedOn);if(!s.enabled||!due)return;
        if(!options.force&&s.lastFailure&&s.lastAttemptFriday===due&&now()-new Date(s.lastAttemptAt)<retryAfter)return;
        const year=adapter.getState().activeSchoolYearId;
        if(!year)throw new Error('Choose the active school year before the weekly charting export.');
        const id=`weekly-${due}-${year}`;if(reports.some(r=>r.id===id))return;
        await adapter.ready?.();const state=JSON.parse(JSON.stringify(adapter.getState()));
        if(state.activeSchoolYearId!==year)return;
        await store.setSettings({...await settings(),lastAttemptAt:iso(),lastAttemptFriday:due,lastFailure:''});changed();
        try {
          const report=await generate(state,{id,kind:'weekly',dueFriday:due,createdAt:iso(),year,scope:'roster',label:'Whole roster'});
          await record(report);await store.setSettings({...await settings(),lastFailure:''});
          await announce(await deliver(report,['local','drive'],Boolean(options.interactive)));
        }catch(error){await store.setSettings({...await settings(),lastFailure:error.message});throw error;}
      }).catch(error=>{changed(error.message);adapter.notify?.(`Weekly charting copy needs attention. ${error.message}`, 'warning');}).finally(()=>{running=null;});return running;
    }
    async function note(id,key,index) {
      return locked(`delivery:${id}`,async()=>{const report=await store.get(id);if(index===undefined)report[key]=iso();else report.files[index][key]=iso();await store.update(report);changed();return report;});
    }
    return {settings,record,deliver,run,note,async enable(enabled){const s=await settings();await store.setSettings({...s,enabled});changed();if(enabled)return run();}};
  }
  const api={dateKey,dueFriday,nextFriday,fileName,openStore,partition,generateFiles,service};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.TeachTodayChartingArchive=api;
})(typeof window!=='undefined'?window:globalThis);
