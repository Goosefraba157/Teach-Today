/* Private, read-only WRS reporting. No classroom writes, cloud reads, or defaults. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const normal = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isDemo = g => g.isDemo || g.isDemoGroup || /^(demo|sample)(?: blue)? group$/i.test(g.name || '') || g.id === 'grp-sample-blue';
  const recordDate = r => r.sessionDate || r.scheduledDate || r.date || r.displayDate || r.lessonSavedAt || r.savedAt || '';
  function day(value) {
    if (!value) return '';
    const text = String(value), iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/), us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : us ? [Number(us[3]) + (us[3].length === 2 ? 2000 : 0), Number(us[1]), Number(us[2])] : null;
    if (parts) {
      const check = new Date(parts[0], parts[1]-1, parts[2]);
      if (check.getFullYear() !== parts[0] || check.getMonth()+1 !== parts[1] || check.getDate() !== parts[2]) return '';
      return `${parts[0]}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    }
    const parsed = new Date(text);
    return Number.isFinite(parsed.getTime()) ? `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}` : '';
  }
  function yearOf(r) {
    const d = day(recordDate(r));
    if (d) { const y = Number(d.slice(0,4)) - (Number(d.slice(5,7)) < 7 ? 1 : 0); return `${y}-${y+1}`; }
    return r.schoolYearId || '';
  }
  function groups(state, year) { return (state.groups || []).filter(g => !isDemo(g) && g.schoolYearId === year); }
  function students(state, options) {
    const selected = groups(state, options.year).filter(g => !options.groupId || g.id === options.groupId);
    const profiles = new Map((state.rosterStudents || []).filter(p => p.studentId).map(p => [p.studentId,p]));
    const result = new Map();
    const add = (id,name) => {
      if (!id) return;
      const p = profiles.get(id) || {};
      result.set(id,{id,name:p.displayName || p.name || name || 'Student', aliases:[p.name,p.displayName,p.fullName,...(p.aliases || []),name].filter(Boolean)});
    };
    selected.forEach(g => {
      Object.entries(g.studentIds || {}).forEach(([name,id]) => add(id,name));
      (g.membershipHistory || []).forEach(m => {
        const start = day(m.startedOn), end = day(m.endedOn);
        if ((!start || start < `${Number(options.year.slice(0,4))+1}-07-01`) && (!end || end >= `${options.year.slice(0,4)}-07-01`)) add(m.studentId,m.displayNameAtStart);
      });
    });
    // Keep students with dated instructional evidence discoverable after moves.
    const ids = new Set(selected.map(g => g.id));
    (state.masterRecords || []).filter(r => yearOf(r) === options.year && ids.has(r.groupIdAtTime || r.groupId) && (profiles.has(r.studentId) || result.has(r.studentId))).forEach(r => add(r.studentId,r.student));
    return [...result.values()].sort((a,b) => a.name.localeCompare(b.name));
  }
  function misses(r) {
    const details = (r.wordRecords || []).filter(w => w?.word && w.correct !== true && (!r.chartHalf || !w.section || w.section === r.chartHalf)).slice();
    const targets = Array.isArray(r.wrongWords) ? r.wrongWords : details.filter(w => w.correct === false).map(w => w.word);
    return targets.map(word => {
      const i = details.findIndex(w => w.word === word), w = i < 0 ? null : details.splice(i,1)[0];
      const said = String(w?.said || '');
      return {word:String(word),said:!said.trim() || /^response not recorded$/i.test(said.trim()) ? '' : said};
    });
  }
  function signature(r) {
    return JSON.stringify([String(r.substep || ''),String(r.wordlistPage ?? ''),String(r.seconds ?? ''),misses(r).map(m => m.word.toLowerCase().trim())]);
  }
  function collect(state, options, prior = []) {
    const pool = students(state,{year:options.year,groupId:options.scope === 'roster' ? '' : options.groupId});
    const chosen = options.scope === 'student' ? pool.filter(s => s.id === options.studentId) : pool;
    if (!chosen.length) throw new Error('Choose a student or group with a saved roster in this school year.');
    const ids = new Set(chosen.map(s => s.id));
    const yearRoster = students(state,{year:options.year});
    const knownIds = new Set(yearRoster.map(s=>s.id));
    const selectedGroups = new Set(groups(state,options.year).filter(g => options.scope === 'roster' || g.id === options.groupId).map(g => g.id));
    function identity(r) {
      if (r.studentId) return r.studentId;
      const name = normal(r.student || r.studentName || r.name);
      const matches = yearRoster.filter(s => s.aliases.some(a => normal(a) === name));
      return name && matches.length === 1 ? matches[0].id : '';
    }
    let unresolved = 0;
    const attempts = [];
    (state.masterRecords || []).forEach((r,index) => {
      if (r.type === 'soundsDrill' || !(r.correct !== undefined || r.wordlistPage || r.chartHalf) || yearOf(r) !== options.year) return;
      const sid = identity(r);
      if (!sid || !ids.has(sid)) { if ((!sid || !knownIds.has(sid)) && selectedGroups.has(r.groupIdAtTime || r.groupId)) unresolved++; return; }
      attempts.push({...clone(r),_studentId:sid,_key:`record-${index}`,_day:day(recordDate(r))});
    });
    const saved = attempts.slice(); let earlier = 0, possibleDates = 0, unlinkedPrior = 0;
    for (const source of prior) {
      if (yearOf(source) !== options.year) continue;
      const sid = identity(source);
      if (!sid) { unlinkedPrior++; continue; }
      if (!ids.has(sid)) continue;
      const candidates = saved.filter(r => r._studentId === sid && signature(r) === signature(source));
      const matching = candidates.filter(r => r._day === day(recordDate(source)));
      // A prior PDF has no stable attempt ID. Collapse only an exact printed
      // match whose recorded responses are represented in the saved attempts.
      const responsesPresent = misses(source).every(m => !m.said || matching.some(r => misses(r).some(w => w.word.toLowerCase().trim() === m.word.toLowerCase().trim() && w.said.toLowerCase().trim() === m.said.toLowerCase().trim())));
      if (matching.length && responsesPresent) continue;
      if (candidates.some(r => r._day !== day(recordDate(source)))) possibleDates++;
      attempts.push({...clone(source),_studentId:sid,_key:`printed-${earlier++}`,_day:day(recordDate(source)),_printed:true});
    }
    const rows = chosen.map(s => ({...s,attempts:attempts.filter(r => r._studentId === s.id).sort((a,b) => a._day.localeCompare(b._day) || String(recordDate(a)).localeCompare(String(recordDate(b))) || a._key.localeCompare(b._key))}));
    const warnings = [];
    if (unresolved) warnings.push(`${unresolved} saved charting entry/entries could not be linked to a student; they are not included.`);
    if (unlinkedPrior) warnings.push(`${unlinkedPrior} earlier PDF entry/entries could not be linked to the selected roster; they are not included.`);
    if (possibleDates) warnings.push(`${possibleDates} earlier entry/entries have similar details on another date. Both dates are retained for review.`);
    if (earlier) warnings.push(`${earlier} earlier printed entry/entries are included as reporting evidence only. No classroom records have been restored.`);
    if (!prior.length) warnings.push('Uses charting saved on this device. Older missing entries require an earlier charting PDF.');
    const unknownDates = attempts.filter(r => !r._day).length;
    if (unknownDates) warnings.push(`${unknownDates} entry/entries have no recorded date; the saved school-year label was used.`);
    return {year:options.year,rows,attempts:attempts.length,savedAttempts:saved.length,earlierAttempts:earlier,possibleDates,warnings};
  }
  function wrap(text, width, size, font) {
    const lines=[];
    for (const paragraph of String(text).split('\n')) {
      let line='';
      for (const token of paragraph.match(/\S+|\s+/g) || []) {
        if (!token.trim()) { if (line) line+=token; continue; }
        if (font.widthOfTextAtSize(line+token,size)<=width) { line+=token; continue; }
        if (line.trim()) { lines.push(line.trimEnd()); line=''; }
        for (const char of token) {
          if (line && font.widthOfTextAtSize(line+char,size)>width) { lines.push(line); line=''; }
          line+=char;
        }
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }
  function fit(value, width, height, font, kind, detail) {
    const text = kind === 'word' ? detail.word + (detail.said ? `\n(${detail.said})` : '') : value;
    for (let size=kind === 'word' ? 9.5 : kind === 'name' ? 12 : kind === 'date' ? 7 : 6; size>=5; size-=.25) {
      const lines=wrap(text,width-3,size,font), leading=size*1.08;
      if (lines.length*leading<=height-2.5 && lines.every(line => font.widthOfTextAtSize(line,size)<=width-3+.01)) return {lines,size,leading};
    }
    throw new Error('A recorded response is too long for the unchanged chart box. Shorten the export scope and review that response; no text was dropped.');
  }
  function columns(row) {
    return row.attempts.flatMap(r => {
      const items = misses(r), count = Math.max(1,Math.ceil(items.length/12));
      return Array.from({length:count},(_,i) => ({record:r,items:items.slice(i*12,(i+1)*12),continuation:i>0}));
    });
  }
  async function generate(model, {PDFLib, fontkit, templateBytes, fontBytes, fields, shouldContinue=()=>true, onProgress=()=>{}}) {
    const P=PDFLib, doc=await P.PDFDocument.create(); doc.registerFontkit(fontkit);
    const font=await doc.embedFont(fontBytes,{subset:true}), source=await P.PDFDocument.load(templateBytes);
    const backgrounds=await doc.embedPages(source.getPages());
    const form=doc.getForm(), layout=[], studentPages=[], totalPages=model.rows.reduce((n,row)=>n+Math.max(2,Math.ceil(columns(row).length/12)),0); let pageNumber=0;
    function textField(name,value,rect,kind='word',detail={word:'',said:''}) {
      const [x,y,x2,y2]=rect,w=x2-x,h=y2-y, field=form.createTextField(name);
      if (kind==='word') field.enableMultiline();
      field.disableSpellChecking(); field.setText(value);
      field.addToPage(doc.getPage(pageNumber-1),{x,y,width:w,height:h,borderWidth:0,font,textColor:P.rgb(0,0,0)});
      const widget=field.acroField.getWidgets()[0];
      widget.getAppearanceCharacteristics()?.dict.delete(P.PDFName.of('BG'));
      const fitted=fit(value,w,h,font,kind,detail);
      field.setFontSize(fitted.size);
      field.updateAppearances(font,() => {
        let baseline=(h+fitted.lines.length*fitted.leading)/2-fitted.size;
        const lines=fitted.lines.map(line => {
          const position={encoded:font.encodeText(line),x:kind==='word' ? Math.max(1.5,(w-font.widthOfTextAtSize(line,fitted.size))/2) : 1.5,y:baseline};
          baseline-=fitted.leading; return position;
        });
        return [P.pushGraphicsState(),P.rectangle(0,0,w,h),P.clip(),P.endPath(),...P.drawTextLines(lines,{color:P.rgb(0,0,0),font:font.name,size:fitted.size,rotate:P.degrees(0),xSkew:P.degrees(0),ySkew:P.degrees(0)}),P.popGraphicsState()];
      });
      layout.push({page:pageNumber,name,value,rect,size:fitted.size,lines:fitted.lines});
    }
    for (const [studentIndex,row] of model.rows.entries()) {
      const cells=columns(row), pageCount=Math.max(2,Math.ceil(cells.length/12));
      studentPages.push({name:row.name,firstPage:pageNumber+1,lastPage:pageNumber+pageCount});
      for (let sheet=0;sheet<pageCount;sheet++) {
        if (!shouldContinue()) throw new Error('Charting view changed; the previous PDF was canceled.');
        const page=doc.addPage([792,612]); pageNumber++;
        page.drawPage(backgrounds[sheet%2]);
        // A small field tree per sheet avoids quadratic whole-roster field
        // creation while keeping every student/page field independently editable.
        const specs=fields[sheet%2], prefix=`S${studentIndex+1}.P${sheet+1}.F__`;
        for (const spec of specs) {
          const [x,y,x2,y2]=spec.rect;
          if (spec.name.startsWith('STUDENT NAME')) { textField(prefix+'STUDENT NAME',row.name,spec.rect,'name'); continue; }
          const col=Math.min(11,Math.max(0,Math.floor((x-78.48+.01)/56.52))), cell=cells[sheet*12+col], r=cell?.record;
          if (spec.type==='/Btn') {
            const mode=String(r?.level || r?.wordType || '').toUpperCase(), real=['R','AB','A','B','REAL','REAL WORDS'].includes(mode), nonsense=['N','NONSENSE','NONSENSE WORDS'].includes(mode);
            const checked=Boolean((spec.name.startsWith('R') && real) || (spec.name.startsWith('N') && nonsense));
            const box=form.createCheckBox(prefix+spec.name);box.addToPage(page,{x,y,width:x2-x,height:y2-y,borderWidth:0});
            // The approved form already draws the checkbox outline and label.
            box.updateAppearances(() => ({normal:{on:[P.setFillingRgbColor(0,0,0),P.rectangle(0,0,x2-x,y2-y),P.fill()],off:[]}}));
            if (checked) box.check(); else box.uncheck();
            continue;
          }
          const rowIndex=Number(spec.name.match(/R NRow(\d+)/)[1])-1, detail=cell?.items[rowIndex] || {word:'',said:''};
          const gray=r && !cell.continuation && (Array.isArray(r.printedGrayRows) ? r.printedGrayRows.includes(15-rowIndex) : Number.isFinite(r.correct) && 15-rowIndex<=r.correct);
          if (gray) page.pushOperators(P.pushGraphicsState(),P.setFillingRgbColor(.9,.9,.9),P.rectangle(x,y,x2-x,y2-y),P.fill(),P.popGraphicsState());
          textField(prefix+spec.name,detail.word+(detail.said ? ` (${detail.said})` : ''),spec.rect,'word',detail);
        }
        for (let col=0;col<12;col++) {
          const cell=cells[sheet*12+col],r=cell?.record,d=r?day(recordDate(r)):'',x=78.48+56.52*col;
          const date=d?`${Number(d.slice(5,7))}/${Number(d.slice(8,10))}/${d.slice(2,4)}`:'';
          let meta=r?String(r.substep || '')+(r.wordlistPage ? ` (${r.wordlistPage})` : '')+(r.seconds!==undefined && r.seconds!==null && r.seconds!=='' ? ` ${r.seconds} sec` : ''):'';
          if (cell?.continuation) meta=String(r.substep || '')+(r.wordlistPage ? ` (${r.wordlistPage})` : '')+' cont.';
          textField(prefix+`P${sheet+1}_C${col+1}_DATE`,date,[x,490,x+52.68,502.2],'date');
          textField(prefix+`P${sheet+1}_C${col+1}_SUBSTEP_PAGE`,meta,[x,476,x+52.68,488.2],'meta');
        }
        // Yield between sheets so the teacher can close a long roster export.
        onProgress(pageNumber,totalPages);
        if (typeof root.setTimeout==='function') await new Promise(resolve => root.setTimeout(resolve,0));
      }
    }
    if (!shouldContinue()) throw new Error('Charting view changed; the previous PDF was canceled.');
    doc.setTitle(`WRS Wordlist Chart - ${model.year}`); doc.setSubject('Private Section 4 charting report');
    return {bytes:await doc.save({updateFieldAppearances:false}),pages:pageNumber,studentPages,layout,fields:form.getFields().length};
  }
  async function readEarlierPdf(bytes, PDFLib) {
    if (bytes.byteLength>50*1024*1024) throw new Error('Choose a charting PDF smaller than 50 MB.');
    const P=PDFLib, doc=await P.PDFDocument.load(bytes,{updateMetadata:false});
    if (doc.getPageCount()>1000) throw new Error('Choose a charting PDF with fewer than 1,000 pages.');
    const pages=doc.getPages(), widgets=new Map(), byPage=pages.map(()=>[]);
    pages.forEach((p,i) => (p.node.Annots()?.asArray() || []).forEach(ref => widgets.set(doc.context.lookup(ref),i)));
    const fields=doc.getForm().getFields();
    if (fields.length>200000) throw new Error('This PDF contains too many fields.');
    fields.forEach(f => f.acroField.getWidgets().forEach(w => { const i=widgets.get(w.dict);if (i!==undefined) byPage[i].push({field:f,widget:w}); }));
    const entries=[];
    for (const [pageIndex,items] of byPage.entries()) {
      const nameField=items.find(i => /STUDENT NAME/.test(i.field.getName()));
      if (!nameField || typeof nameField.field.getText!=='function') continue;
      const student=nameField.field.getText() || '';
      const rectangles=[];
      const contents=pages[pageIndex].node.Contents();
      const streams=contents instanceof P.PDFArray ? contents.asArray().map(s => doc.context.lookup(s)) : contents ? [contents] : [];
      for (const stream of streams) {
        const text=new TextDecoder('latin1').decode(P.decodePDFRawStream(stream).decode());
        for (const m of text.matchAll(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+re\s+(?:f\*?|B\*?)\b/g)) rectangles.push(m.slice(1).map(Number));
      }
      for (let col=0;col<12;col++) {
        const dateField=items.find(i => new RegExp(`P\\d+_C${col+1}_DATE$`).test(i.field.getName()));
        const date=dateField?.field.getText?.(); if (!date) continue;
        if (!day(date)) throw new Error(`The earlier PDF has an unreadable date on page ${pageIndex+1}.`);
        const meta=items.find(i => new RegExp(`P\\d+_C${col+1}_SUBSTEP_PAGE$`).test(i.field.getName()))?.field.getText?.() || '';
        if (/cont(?:inued|\.)/i.test(meta)) throw new Error('This earlier PDF contains continuation columns. Use the original report or export from saved charting so attempts are not counted twice.');
        const match=meta.match(/^(\S+)(?: \(([^)]+)\))?(?: ([\d.]+) sec)?$/);
        if (!match) throw new Error(`The earlier PDF has unreadable charting details on page ${pageIndex+1}.`);
        const wordRecords=[],gray=[];let mode='';
        for (const item of items) {
          const rect=item.widget.getRectangle(), c=Math.floor((rect.x-78.48+.01)/56.52);
          if (c!==col) continue;
          const n=item.field.getName().split('__').pop(), row=n.match(/^R NRow(\d+)/);
          if (row) {
            const value=item.field.getText?.() || '', split=value.indexOf(' (');
            if (value) wordRecords.push({word:split<0?value:value.slice(0,split),said:split<0?'':value.slice(split+2).replace(/\)$/,''),correct:false,_row:Number(row[1])});
            if (rectangles.some(([x,y,w,h]) => Math.abs(x-rect.x)<.1 && Math.abs(y-rect.y)<.1 && Math.abs(w-rect.width)<.1 && Math.abs(h-rect.height)<.1)) gray.push(16-Number(row[1]));
          } else if (typeof item.field.isChecked==='function' && item.field.isChecked()) mode=n.startsWith('R')?'R':'N';
        }
        wordRecords.sort((a,b)=>a._row-b._row);
        entries.push({student,date:day(date),substep:match[1],wordlistPage:match[2] || '',seconds:match[3]===undefined?'':Number(match[3]),level:mode,
          wrongWords:wordRecords.map(w=>w.word),wordRecords,printedGrayRows:gray,sourcePage:pageIndex+1,sourceColumn:col+1});
      }
    }
    if (!entries.length) throw new Error('No dated fillable WRS charting was found. Use the previous fillable report, rather than a scan or flattened PDF.');
    return entries;
  }
  const api={day,yearOf,groups,students,misses,collect,wrap,fit,columns,generate,readEarlierPdf};
  root.TeachTodayChartingExport=api;
  if (typeof module!=='undefined' && module.exports) module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
