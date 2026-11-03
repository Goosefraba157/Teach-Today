/* Private English passage reading. Student projection contains passage text only. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TeachTodayReadingFluency = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PERIODS = ['BOY', 'MOY', 'EOY', 'Progress monitoring'];
  function tokens(text) {
    return String(text || '').replace(/([—–])/g, '$1 ').split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word));
  }
  function score(words, last, errors, seconds) {
    if (!Number.isInteger(last) || last < -1 || last >= words.length) throw new Error('Choose the last word attempted, or No words attempted.');
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) throw new Error('A valid duration is required.');
    const attempted = last + 1;
    const misses = [...new Set(errors)].filter(i => Number.isInteger(i) && i >= 0 && i <= last);
    const correct = attempted - misses.length;
    return { attempted, errors: misses.length, correct, wcpm: Math.round(correct * 60 / seconds * 10) / 10, accuracy: attempted ? Math.round(correct / attempted * 1000) / 10 : null };
  }
  function unused(passages, records, assignments, studentId, grade) {
    const used = new Set([...records, ...assignments].filter(r => r.studentId === studentId).map(r => r.passageId));
    return passages.filter(p => p.grade === Number(grade) && !used.has(p.id));
  }
  function payload(passage) {
    if (!passage) return { mode: 'private', displayMode: 'private', groupName: 'Teach Today', privacyTitle: 'Reading', privacyMessage: 'Your teacher is preparing a passage.' };
    return { mode: 'passage', displayMode: 'passage', sourceSection: 'reading-fluency', sectionLabel: 'Reading', groupName: 'Teach Today', passageTitle: passage.title, passageText: passage.text };
  }
  function validateLibrary(value) {
    if (value?.format !== 'teach-today-fluency-library-v1' || !Array.isArray(value.passages) || !value.passages.length || value.passages.length > 120) throw new Error('Choose a Teach Today English fluency library.');
    const ids = new Set();
    return value.passages.map(p => {
      if (!/^star-por-en-g[1-6]-f\d{2}$/.test(p.id) || ids.has(p.id) || p.id !== `star-por-en-g${p.grade}-f${String(p.form).padStart(2, '0')}` || !Number.isInteger(p.grade) || p.grade < 1 || p.grade > 6 || !Number.isInteger(p.form) || p.form < 1 || p.form > 99 || typeof p.title !== 'string' || p.title.length > 180 || typeof p.text !== 'string' || p.text.length < 50 || p.text.length > 10000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.sourceImage || '') || p.sourceImage.length > 1500000) throw new Error('The library contains an invalid or duplicate passage.');
      ids.add(p.id);
      return { id: p.id, grade: p.grade, form: p.form, title: p.title, text: p.text, sourceImage: p.sourceImage, sourceHash: String(p.sourceHash || '').slice(0, 80), crossCheck: p.crossCheck === true, verified: false, sourceLabel: `POR-G${p.grade}: Form ${String(p.form).padStart(2, '0')}`, sourcePage: Number.isInteger(p.sourcePage) && p.sourcePage >= 3 && p.sourcePage <= 22 ? p.sourcePage : null };
    });
  }
  function openLibraryStore() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('teach-today-private-fluency-library-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('library');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
  async function libraryRead() {
    const db = await openLibraryStore();
    try { return await new Promise((resolve, reject) => { const tx = db.transaction('library'); const r = tx.objectStore('library').get('english'); r.onsuccess = () => resolve(r.result || []); r.onerror = () => reject(r.error); }); } finally { db.close(); }
  }
  async function libraryWrite(passages) {
    const db = await openLibraryStore();
    try { await new Promise((resolve, reject) => { const tx = db.transaction('library', 'readwrite'); tx.objectStore('library').put(passages, 'english'); tx.oncomplete = resolve; tx.onabort = tx.onerror = () => reject(tx.error || new Error('Passage library was not saved.')); }); } finally { db.close(); }
    const saved = await libraryRead();
    if (JSON.stringify(saved) !== JSON.stringify(passages)) throw new Error('Passage library verification failed.');
  }
  function install(adapter) {
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const dialog = document.createElement('dialog'); dialog.id = 'ttFluency'; dialog.className = 'rf-dialog'; dialog.setAttribute('aria-labelledby', 'rfHeading');
    dialog.innerHTML = `<header class="rf-header"><div><p>Teach Today · English</p><h1 id="rfHeading">Reading fluency</h1></div><button id="rfClose" type="button">Close</button></header>
      <div class="rf-content"><p id="rfMessage" role="status"></p><div class="rf-layout"><aside class="rf-setup"><h2>Plan a reading check</h2>
      <label>Group<select id="rfGroup"></select></label><label>Student<select id="rfStudent"></select></label>
      <div class="rf-pair"><label>Passage grade<select id="rfGrade">${[1,2,3,4,5,6].map(g=>`<option>${g}</option>`).join('')}</select></label><label>Check<select id="rfPeriod">${PERIODS.map(p=>`<option>${p}</option>`).join('')}</select></label></div>
      <label>Assessment date<input id="rfDate" type="date"></label>
      <label>Passage<select id="rfPassage"></select></label><button id="rfRandom" type="button">Choose random unused passage</button><p id="rfUse" class="rf-help"></p>
      <button id="rfAssign" type="button">Save assignment</button><p id="rfAssignment" class="rf-help"></p><label>Saved assignments<select id="rfSavedAssignment"></select></label><button id="rfLoadAssignment" type="button">Use saved assignment</button>
      <details><summary>Private passage library</summary><p>Import your prepared English library on each teaching device. Booklets stay private. This library is device-only; keep the original import file.</p><input id="rfImport" type="file" accept="application/json,.json" aria-label="Import private English passage library"><p id="rfLibraryStatus"></p><button id="rfImportConfirm" type="button" hidden>Add previewed passages</button></details>
      <details><summary>Administration & scoring</summary><p>Start at the title. Say Begin when starting the timer. Mark skipped or misread words and words not read within 3 seconds. Ignore added words; an immediate self-correction is correct (tap again to remove an error). After 3 seconds prompt the student to try the next word.</p><p>At one minute, only this teacher screen alerts. Mark the last word attempted, then tell the student to stop. Finish early only if the entire passage was completed. There is no pause during a standard check.</p><p>Raw WCPM = correct words × 60 ÷ seconds. Accuracy = correct ÷ attempted × 100. The title is included. Hyphenated words and contractions count as one word; em dashes separate words. These are local raw scores, without Star equating, percentiles, or benchmark classifications.</p><p>Keep the same passage grade when comparing growth. Random selection avoids earlier assignments and attempts; teacher-selected repeats are labeled.</p></details>
      </aside><section class="rf-work"><div class="rf-work-head"><div><h2 id="rfTitle">Choose a passage</h2><p id="rfSource" class="rf-help"></p></div><button id="rfProject" type="button">Student display</button></div>
      <details id="rfReview"><summary>Verify passage against the original</summary><div class="rf-verify"><img id="rfSourceImage" alt="Original student passage for text verification"><label>Passage title<input id="rfEditTitle" maxlength="180"></label><label>Passage text<textarea id="rfEditText" rows="15" maxlength="10000"></textarea></label><button id="rfVerify" type="button">Save checked text</button></div></details>
      <p id="rfVerification" class="rf-help"></p><div class="rf-timer"><strong id="rfClock" aria-label="Seconds remaining">1:00</strong><span id="rfTimerStatus" role="alert">Ready</span><button id="rfStart" type="button">Start 1 minute</button><button id="rfFinish" type="button" disabled>Finished whole passage early</button></div>
      <div class="rf-marking"><label><input type="radio" name="rfMarkMode" value="error" checked>Mark errors</label><label><input type="radio" name="rfMarkMode" value="last">Last word attempted</label><button id="rfZero" type="button" disabled>No words attempted</button></div>
      <p class="rf-help">Tap a word to mark an error; tap again to undo. Choose Last word attempted, then tap the endpoint. Marks stay on the teacher screen.</p>
      <article id="rfWords" class="rf-words" aria-label="Teacher scoring passage"></article><output id="rfScore" class="rf-score">Complete a timed check to calculate a score.</output>
      <label>Observations<textarea id="rfNotes" rows="2" maxlength="2000"></textarea></label><div class="rf-actions"><button id="rfSave" type="button" disabled>Save reading record</button><button id="rfReset" type="button">New attempt</button></div>
      <h2>Reading over time</h2><div class="rf-history-controls"><label>History school year<select id="rfHistoryYear"></select></label><span class="rf-help">Graph uses the selected passage grade. Table preserves all levels.</span><button id="rfExport" type="button">Export student CSV</button></div><div id="rfTrend" class="rf-trend"></div><div class="rf-table-wrap"><table><thead><tr><th>Date / check</th><th>Passage</th><th>WCPM</th><th>Accuracy</th><th>Details</th></tr></thead><tbody id="rfHistory"></tbody></table></div>
      </section></div></div>`;
    document.body.append(dialog);
    const by = id => dialog.querySelector('#'+id);
    let previousOverflow = '';
    let bank = [], pendingImport = null, passage = null, attempt = null, assignment = null, clockId = null, busy = false, projected = false, opener = null;
    const say = text => { by('rfMessage').textContent = text; };
    const state = () => adapter.getState();
    const records = () => state().readingFluencyRecords || [];
    const assignments = () => state().readingFluencyAssignments || [];
    const studentId = () => by('rfStudent').value;
    const year = () => state().activeSchoolYearId;
    const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const group = () => state().groups?.find(g => g.id === by('rfGroup').value);
    const name = () => (group()?.students || []).find(n => group().studentIds?.[n] === studentId()) || '';
    const shortName = n => { const parts=String(n).trim().split(/\s+/); return parts.length>1 ? `${parts[0]} ${parts.at(-1)[0]}.` : parts[0]; };
    const words = () => passage ? tokens(passage.title+'\n'+passage.text) : [];
    const guard = action => async () => { if(busy)return;busy=true;controls();try {await action();} catch(e) {say(e.message || 'This operation failed. Keep this screen open and retry.');} finally {busy=false;controls();} };
    async function append(collection, row) {
      const target = state(); const previous = target[collection]; target[collection] = [...(previous || []), row];
      try { await adapter.save(); } catch(e) { target[collection] = previous; throw e; }
    }
    function context() { return { studentId: studentId(), groupId: by('rfGroup').value, schoolYearId: year(), passageId: passage?.id, passageGrade: passage?.grade, period: by('rfPeriod').value, sessionDate: by('rfDate').value }; }
    function validContext(allowFuture = false) {
      if (!studentId() || !group() || !passage || !passage.verified) throw new Error('Select a student and a checked passage first.');
      const date=by('rfDate').value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (!allowFuture && date > localDay()) || !Number.isFinite(new Date(date+'T12:00:00').getTime())) throw new Error('Choose a valid date; a timed check must be dated today or earlier.');
      const y=Number(date.slice(0,4)), m=Number(date.slice(5,7));
      if (`${m>=7?y:y-1}-${m>=7?y+1:y}` !== year()) throw new Error('Assessment date must belong to the active school year.');
      return context();
    }
    function currentAssignment() { const c=context();return assignment && Object.keys(c).every(k=>assignment[k]===c[k]) ? assignment : null; }
    async function assign() {
      const c=validContext(true); if(currentAssignment())return assignment;
      assignment={...c,id:crypto.randomUUID(),createdAt:new Date().toISOString()};
      try {await append('readingFluencyAssignments',assignment);}catch(e){assignment=null;throw e;}
      by('rfAssignment').textContent='Assignment saved on this device.';say('Assignment saved.');renderAssignments();return assignment;
    }
    function controls() {
      const locked=Boolean(attempt), running=attempt?.status==='running';
      for(const id of ['rfGroup','rfStudent','rfGrade','rfPeriod','rfDate','rfPassage','rfRandom','rfAssign','rfImport','rfImportConfirm','rfVerify','rfSavedAssignment','rfLoadAssignment'])by(id).disabled=busy||locked;
      by('rfStart').disabled=busy||locked||!passage?.verified||!studentId();
      by('rfFinish').disabled=busy||!running;by('rfZero').disabled=busy||attempt?.status!=='finished';
      by('rfSave').disabled=busy||attempt?.status!=='finished'||attempt.last===null;
      by('rfProject').disabled=!passage?.verified||busy;
      by('rfReset').disabled=busy;
      by('rfClose').disabled=busy||running;
      by('rfEditTitle').disabled=busy||locked;by('rfEditText').disabled=busy||locked;
      by('rfNotes').disabled=busy||attempt?.status==='saved';
      dialog.querySelectorAll('[name="rfMarkMode"]').forEach(input=>input.disabled=busy||attempt?.status==='saved');
    }
    function fillStudents() {
      const g=group();const previous=studentId();
      by('rfStudent').innerHTML='<option value="">Choose student</option>'+(g?.students||[]).filter(n=>g.studentIds?.[n]).map(n=>`<option value="${esc(g.studentIds[n])}">${esc(shortName(n))}</option>`).join('');
      if([...by('rfStudent').options].some(o=>o.value===previous))by('rfStudent').value=previous;
      fillPassages();renderHistory();renderAssignments();
    }
    function fillPassages() {
      const previous=by('rfPassage').value;
      by('rfPassage').innerHTML='<option value="">Choose passage</option>'+bank.filter(p=>p.grade===Number(by('rfGrade').value)).map(p=>`<option value="${esc(p.id)}">${esc(p.sourceLabel)} · ${esc(p.title)}${p.verified?'':' · check text'}</option>`).join('');
      if([...by('rfPassage').options].some(o=>o.value===previous))by('rfPassage').value=previous;
      choosePassage();
    }
    function choosePassage() {
      passage=bank.find(p=>p.id===by('rfPassage').value)||null;assignment=null;by('rfAssignment').textContent='';
      by('rfTitle').textContent=passage?.title||'Choose a passage';by('rfSource').textContent=passage?`${passage.sourceLabel} · booklet PDF page ${passage.sourcePage}`:'';
      by('rfEditTitle').value=passage?.title||'';by('rfEditText').value=passage?.text||'';
      if(passage)by('rfSourceImage').src=passage.sourceImage;else by('rfSourceImage').removeAttribute('src');
      by('rfReview').hidden=!passage;by('rfReview').open=Boolean(passage&&!passage.verified);
      by('rfVerification').textContent=passage?.verified?'Text checked against the source.':passage?'Review title and every word against the original, then Save checked text.':'';
      const used=passage && [...records(),...assignments()].some(r=>r.studentId===studentId()&&r.passageId===passage.id);
      by('rfUse').textContent=used?'Previously assigned or read by this student. Earlier completed readings will be labeled as repeated passages.':passage?'No earlier assignment or reading for this student.':'';
      renderWords();controls();if(projected)adapter.project(payload(passage?.verified?passage:null));
    }
    function renderWords() {
      const titleCount=passage?tokens(passage.title).length:0;
      by('rfWords').innerHTML=words().map((w,i)=>`${i===titleCount?'<br><br>':''}<button type="button" data-rf-word="${i}" title="Word ${i+1}" aria-label="Word ${i+1}: ${esc(w)}" aria-pressed="${attempt?.errors.has(i)||false}" class="${i<titleCount?'rf-title-word ':''}${attempt?.errors.has(i)?'rf-error ':''}${attempt?.last===i?'rf-last ':''}${attempt?.last!==null&&attempt?.last!==undefined&&i>attempt.last?'rf-unread':''}">${esc(w)}</button> `).join('');
      renderScore();
    }
    function renderScore() {
      if (!attempt || attempt.last===null || !attempt.seconds) {by('rfScore').textContent='Complete a timed check and mark the last word attempted.';return;}
      const s=score(attempt.words,attempt.last,[...attempt.errors],attempt.seconds);
      by('rfScore').textContent=`${s.wcpm} raw WCPM · ${s.accuracy===null?'—':s.accuracy+'%'} accuracy · ${s.correct}/${s.attempted} correct · ${s.errors} errors · ${attempt.seconds}s`;
    }
    function tick() {
      if(attempt?.status!=='running')return;
      const remaining=Math.max(0,60-(performance.now()-attempt.startedClock)/1000);
      const n=Math.ceil(remaining);by('rfClock').textContent=`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
      if(!remaining)finish(false);
    }
    function finish(early) {
      if(attempt?.status!=='running')return;
      const elapsed=(performance.now()-attempt.startedClock)/1000;
      clearInterval(clockId);attempt.seconds=early&&elapsed<60?Math.max(.1,Math.round(elapsed*10)/10):60;
      attempt.status='finished';attempt.finishedAt=new Date().toISOString();
      if(early&&elapsed<60)attempt.last=attempt.words.length-1;
      by('rfTimerStatus').textContent=early&&elapsed<60?'Whole passage finished. Review errors and save.':'One minute is done. Mark the last word attempted.';
      by('rfTimerStatus').classList.add('rf-time-done');
      if(!early)dialog.querySelector('[name="rfMarkMode"][value="last"]').checked=true;
      renderWords();controls();
    }
    function reset() {
      clearInterval(clockId);attempt=null;assignment=null;by('rfAssignment').textContent='';by('rfNotes').value='';by('rfClock').textContent='1:00';by('rfTimerStatus').textContent='Ready';by('rfTimerStatus').classList.remove('rf-time-done');dialog.querySelector('[name="rfMarkMode"][value="error"]').checked=true;renderWords();controls();
    }
    function renderAssignments() {
      const completed=new Set(records().map(r=>r.assignmentId));
      by('rfSavedAssignment').innerHTML='<option value="">Choose saved assignment</option>'+assignments().filter(a=>a.studentId===studentId() && a.schoolYearId===year() && !completed.has(a.id)).map(a=>{const p=bank.find(p=>p.id===a.passageId);return `<option value="${esc(a.id)}">${esc(a.sessionDate)} · ${esc(a.period)} · Grade ${a.passageGrade} · ${esc(p?.title||'Import passage library')}</option>`;}).join('');
    }
    function historyRecords() {return records().filter(r=>r.studentId===studentId() && (by('rfHistoryYear').value==='all'||r.schoolYearId===by('rfHistoryYear').value)).sort((a,b)=>a.sessionDate.localeCompare(b.sessionDate)||a.createdAt.localeCompare(b.createdAt));}
    function renderHistory() {
      const selected=by('rfHistoryYear').value||year(), years=[...new Set([year(),...records().filter(r=>r.studentId===studentId()).map(r=>r.schoolYearId)])].filter(Boolean).sort().reverse();
      by('rfHistoryYear').innerHTML=years.map(y=>`<option>${esc(y)}</option>`).join('')+'<option value="all">All years</option>';by('rfHistoryYear').value=selected;
      const rows=historyRecords();
      by('rfHistory').innerHTML=rows.slice().reverse().map(r=>`<tr><td>${esc(r.sessionDate)}<br>${esc(r.period)}</td><td>Grade ${r.passageGrade} · Form ${r.form}<br>${esc(r.passageTitle)}${r.repeated?' · Repeated':''}</td><td>${r.wcpm}</td><td>${r.accuracy===null?'—':r.accuracy+'%'}</td><td><details><summary>${r.correct}/${r.attempted} · ${r.seconds}s</summary><p>${esc(r.notes)}</p><p>Missed: ${esc((r.errorIndices||[]).map(i=>`${i+1}: ${r.words[i]}`).join(', ')||'None')}</p><p>Last word: ${r.lastWordIndex<0?'No words attempted':esc(`${r.lastWordIndex+1}: ${r.words[r.lastWordIndex]}`)}</p></details></td></tr>`).join('')||'<tr><td colspan="5">No saved reading checks for this student and year.</td></tr>';
      const points=rows.filter(r=>r.passageGrade===Number(by('rfGrade').value));
      if(!points.length){by('rfTrend').textContent='Same-grade growth appears here after a reading record is saved.';return;}
      const width=Math.max(560,points.length*85),height=210,max=Math.max(20,...points.map(r=>r.wcpm)), x=i=>50+i*(width-100)/Math.max(1,points.length-1), y=v=>170-v/max*140;
      by('rfTrend').innerHTML=`<svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="Grade ${esc(by('rfGrade').value)} raw WCPM over time; exact values in the history table"><line x1="50" y1="30" x2="50" y2="170" stroke="#94a3b8"/><line x1="50" y1="170" x2="${width-30}" y2="170" stroke="#94a3b8"/><text x="4" y="30">${max}</text><text x="22" y="174">0</text><polyline fill="none" stroke="#0f766e" stroke-width="2" points="${points.map((r,i)=>`${x(i)},${y(r.wcpm)}`).join(' ')}"/>${points.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r.wcpm)}" r="5" fill="${r.period==='Progress monitoring'?'#64748b':'#0f766e'}"><title>${esc(r.sessionDate)} · ${esc(r.period)} · ${r.wcpm} raw WCPM${r.repeated?' · Repeated passage':''}</title></circle><text x="${x(i)}" y="${y(r.wcpm)-12}" text-anchor="middle">${r.wcpm}</text><text x="${x(i)}" y="193" text-anchor="middle">${esc(r.sessionDate.slice(5))}</text>`).join('')}</svg><p class="rf-help">Grade ${esc(by('rfGrade').value)} · raw WCPM · points are equally spaced by assessment; exact dates and repeated passages are in the table.</p>`;
    }
    async function open() {
      opener=document.activeElement;adapter.stopMirror();await adapter.ready?.();reset();
      bank=await libraryRead();by('rfLibraryStatus').textContent=`${bank.length} private passages on this device.`;
      by('rfGroup').innerHTML='<option value="">Choose group</option>'+(state().groups||[]).filter(g=>g.schoolYearId===year()).map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
      by('rfGroup').value=adapter.activeGroupId();by('rfDate').value=localDay();fillStudents();by('rfStudent').value=adapter.activeStudentId();choosePassage();renderHistory();say(bank.length?'':'Open Private passage library below and import your prepared English passage file to get started.');if(!bank.length)by('rfImport').closest('details').open=true;previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();
    }
    for(const id of ['ttHomeReadingFluency','ttReadingFluency'])document.getElementById(id)?.addEventListener('click',guard(open));
    by('rfGroup').onchange=fillStudents;by('rfStudent').onchange=()=>{choosePassage();renderHistory();renderAssignments();};by('rfGrade').onchange=()=>{fillPassages();renderHistory();};by('rfPassage').onchange=choosePassage;
    for(const id of ['rfPeriod','rfDate'])by(id).onchange=()=>{assignment=null;by('rfAssignment').textContent='';};
    by('rfRandom').onclick=()=>{if(!bank.length){say('Import your private English passage library first.');return;}const choices=unused(bank,records(),assignments(),studentId(),by('rfGrade').value);if(!studentId()){say('Choose a student first.');return;}if(!choices.length){say('No unused passages remain for this grade. Choose a previous passage deliberately.');return;}by('rfPassage').value=choices[Math.floor(Math.random()*choices.length)].id;choosePassage();};
    by('rfImport').onchange=guard(async()=>{const file=by('rfImport').files[0];if(!file)return;if(file.size>45000000)throw new Error('This library is too large.');pendingImport=validateLibrary(JSON.parse(await file.text()));const additions=pendingImport.filter(p=>!bank.some(b=>b.id===p.id));by('rfLibraryStatus').textContent=`Preview: ${pendingImport.length} English passages; ${additions.length} additions, ${pendingImport.length-additions.length} existing passages preserved. Grades: ${[...new Set(pendingImport.map(p=>p.grade))].sort().join(', ')}. No student records are imported.`;by('rfImportConfirm').hidden=false;});
    by('rfImportConfirm').onclick=guard(async()=>{if(!pendingImport)return;const merged=[...bank,...pendingImport.filter(p=>!bank.some(b=>b.id===p.id))];await libraryWrite(merged);bank=merged;pendingImport=null;by('rfImportConfirm').hidden=true;by('rfImport').value='';by('rfLibraryStatus').textContent=`${bank.length} passages imported and verified in device storage. Check each passage text before scoring.`;fillPassages();});
    by('rfVerify').onclick=guard(async()=>{if(!passage)return;const title=by('rfEditTitle').value.trim(),text=by('rfEditText').value.trim();if(!title||text.length<50)throw new Error('Title and full passage text are required.');const updated={...passage,title,text,verified:true,verifiedAt:new Date().toISOString()};const next=bank.map(p=>p.id===passage.id?updated:p);await libraryWrite(next);bank=next;fillPassages();say('Checked passage saved privately on this device.');});
    by('rfLoadAssignment').onclick=()=>{const a=assignments().find(a=>a.id===by('rfSavedAssignment').value&&a.studentId===studentId());if(!a)return;if(!bank.some(p=>p.id===a.passageId)){say('Import the matching private passage library on this device first.');return;}by('rfGrade').value=String(a.passageGrade);fillPassages();by('rfPassage').value=a.passageId;choosePassage();by('rfPeriod').value=a.period;by('rfDate').value=a.sessionDate;assignment=a;by('rfAssignment').textContent='Using the saved assignment.';renderHistory();controls();};
    by('rfAssign').onclick=guard(assign);
    by('rfStart').onclick=guard(async()=>{validContext();const a=await assign();attempt={id:crypto.randomUUID(),assignmentId:a.id,context:context(),words:words(),errors:new Set(),last:null,status:'running',startedAt:new Date().toISOString(),startedClock:performance.now(),seconds:0};by('rfTimerStatus').textContent='Reading · teacher timer only';say('');clockId=setInterval(tick,100);controls();});
    by('rfFinish').onclick=()=>{tick();if(attempt?.status!=='running')return;finish(true);};
    by('rfWords').onclick=event=>{const button=event.target.closest('[data-rf-word]');if(busy||!button||!attempt||!['running','finished'].includes(attempt.status))return;tick();const i=Number(button.dataset.rfWord),mode=dialog.querySelector('[name="rfMarkMode"]:checked').value;if(mode==='last')attempt.last=i;else if(attempt.errors.has(i))attempt.errors.delete(i);else attempt.errors.add(i);renderWords();controls();};
    by('rfZero').onclick=()=>{attempt.last=-1;renderWords();controls();};
    by('rfSave').onclick=guard(async()=>{if(attempt?.status!=='finished'||attempt.last===null)return;const s=score(attempt.words,attempt.last,[...attempt.errors],attempt.seconds);const row={...attempt.context,...s,id:attempt.id,assignmentId:attempt.assignmentId,type:'passage-oral-reading',scoreKind:'raw',language:'en',createdAt:new Date().toISOString(),startedAt:attempt.startedAt,finishedAt:attempt.finishedAt,seconds:attempt.seconds,form:passage.form,passageTitle:passage.title,sourceHash:passage.sourceHash,textVerifiedAt:passage.verifiedAt,words:attempt.words,lastWordIndex:attempt.last,errorIndices:[...attempt.errors].filter(i=>i<=attempt.last).sort((a,b)=>a-b),notes:by('rfNotes').value.trim(),repeated:records().some(r=>r.studentId===studentId()&&r.passageId===passage.id)};await append('readingFluencyRecords',row);attempt.status='saved';say('Reading record saved. It is included in complete classroom JSON backups.');renderHistory();renderAssignments();});
    by('rfReset').onclick=()=>{if(attempt&&attempt.status!=='saved'&&!window.confirm('Discard this unsaved reading attempt and start again?'))return;reset();};
    by('rfProject').onclick=()=>{projected=true;adapter.openDisplay(payload(passage));say('Student display shows the clean passage. Timer, marks, student identity, and scores stay here.');};
    by('rfHistoryYear').onchange=renderHistory;
    by('rfExport').onclick=()=>{const cell=v=>'"'+String(v??'').replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"';const rows=[['Date','Check','Grade','Form','Passage','Seconds','Attempted','Errors','Correct','Raw WCPM','Accuracy %','Repeated','Notes'],...historyRecords().map(r=>[r.sessionDate,r.period,r.passageGrade,r.form,r.passageTitle,r.seconds,r.attempted,r.errors,r.correct,r.wcpm,r.accuracy,r.repeated?'Yes':'No',r.notes])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`reading-fluency-${localDay()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
    function close() {if(busy||attempt?.status==='running')return;if(attempt&&attempt.status!=='saved'&&!window.confirm('Close without saving this reading attempt?'))return;clearInterval(clockId);if(projected)adapter.project(payload(null));projected=false;dialog.close();document.documentElement.style.overflow=previousOverflow;adapter.endProjection();opener?.focus();}
    by('rfClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)tick();if(document.hidden&&attempt?.status==='running'){clearInterval(clockId);attempt.status='interrupted';by('rfTimerStatus').textContent='Interrupted: teacher screen was hidden. Start a new attempt; no standard score can be saved.';controls();}});
    window.addEventListener('beforeunload',e=>{if(attempt&&attempt.status!=='saved'){e.preventDefault();e.returnValue='';}});
    return { open, stagePayload:()=>dialog.open?payload(projected&&passage?.verified?passage:null):null };
  }
  return { tokens, score, unused, payload, validateLibrary, install };
});
