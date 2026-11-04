/* English passage reading. Student projection contains only curriculum and view controls. */
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
  function sessionMetrics(words, last, errors, seconds, status) {
    return status === 'complete' && last !== null ? score(words, last, errors, seconds)
      : { attempted: null, errors: null, correct: null, wcpm: null, accuracy: null };
  }
  function revisionFor(row) {
    return { id: crypto.randomUUID(), at: row.updatedAt || row.createdAt, assessmentStatus: row.assessmentStatus || 'complete', lastWordIndex: row.lastWordIndex,
      errorIndices: [...(row.errorIndices || [])], notes: row.notes || '', seconds: row.seconds, attempted: row.attempted, errors: row.errors, correct: row.correct, wcpm: row.wcpm, accuracy: row.accuracy, clearedAt: row.clearedAt || null };
  }
  function completeRecord(row) { return row.assessmentStatus !== 'cleared' && row.assessmentStatus !== 'needs-endpoint' && row.assessmentStatus !== 'interrupted' && Number.isFinite(row.wcpm); }
  function unused(passages, records, assignments, studentId, grade) {
    const used = new Set([...records, ...assignments].filter(r => r.studentId === studentId).map(r => r.passageId));
    return passages.filter(p => p.grade === Number(grade) && !used.has(p.id));
  }
  function payload(passage, view = {}) {
    if (!passage) return { mode: 'private', displayMode: 'private', groupName: 'Teach Today', privacyTitle: 'Reading', privacyMessage: 'Your teacher is preparing a passage.' };
    return { mode: 'passage', displayMode: 'passage', sourceSection: 'reading-fluency', sectionLabel: 'Reading', groupName: 'Teach Today', passageTitle: passage.title, passageText: passage.text, ...(passage.builtin ? { passagePdf: { passageId: passage.id }, cardDisplay: { layout: view.fit === 'zoom' ? 'fluency-zoom' : view.fit === 'readable' ? 'fluency-readable' : 'fluency-page-fit', variant: String(Math.max(1,Math.min(2,Number(view.zoom)||1.75))), position: String(Math.max(0, Math.min(1, Number(view.scroll) || 0))) } } : {}) };
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
  function gradeNumber(value) {
    const match = String(value ?? '').trim().match(/^(?:(?:grade|gr)\.?\s*)?([1-9]|1[0-2])(?:st|nd|rd|th)?$/i);
    return match ? Number(match[1]) : null;
  }
  function builtinPassages() { return globalThis.TeachTodayFluencyLibrary?.passages || []; }
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
      <label>Group<select id="rfGroup"></select></label><label>Student<select id="rfStudent"></select></label><div class="rf-pair"><label>Student grade<select id="rfStudentGrade"><option value="">Not assigned</option><option value="K">K</option>${Array.from({length:12},(_,i)=>`<option>${i+1}</option>`).join('')}</select></label><button id="rfSaveGrade" type="button">Save student grade</button></div><p id="rfGradeNote" class="rf-help"></p>
      <div class="rf-pair"><label>Passage grade<select id="rfGrade">${[1,2,3,4,5,6].map(g=>`<option>${g}</option>`).join('')}</select></label><label>Check<select id="rfPeriod">${PERIODS.map(p=>`<option>${p}</option>`).join('')}</select></label></div>
      <label>Assessment date<input id="rfDate" type="date"></label>
      <label>Passage<select id="rfPassage"></select></label><button id="rfRandom" type="button">Choose random unused passage</button><p id="rfUse" class="rf-help"></p>
      <button id="rfAssign" type="button">Save assignment</button><p id="rfAssignment" class="rf-help"></p><label>Saved assignments<select id="rfSavedAssignment"></select></label><button id="rfLoadAssignment" type="button">Use saved assignment</button>
      <p class="rf-help" id="rfLibraryStatus">English passage booklets · Grades 1–6 · built in</p>
      <details><summary>Administration & scoring</summary><p>Start at the title. Say Begin when starting the timer. Mark skipped or misread words and words not read within 3 seconds. Ignore added words; an immediate self-correction is correct (tap again to remove an error). After 3 seconds prompt the student to try the next word.</p><p>At one minute, only this teacher screen alerts. The session saves immediately; mark the last word attempted to calculate the score, then tell the student to stop. Corrections save automatically. Finish early only if the entire passage was completed. There is no pause during a standard check.</p><p>Raw WCPM = correct words × 60 ÷ seconds. Accuracy = correct ÷ attempted × 100. The title is included. Hyphenated words and contractions count as one word; em dashes separate words. These are local raw scores, without Star equating, percentiles, or benchmark classifications.</p><p>Keep the same passage grade when comparing growth. Random selection avoids earlier assignments and attempts; teacher-selected repeats are labeled.</p></details>
      </aside><section class="rf-work"><div class="rf-work-head"><div><h2 id="rfTitle">Choose a passage</h2><p id="rfSource" class="rf-help"></p></div><button id="rfProject" type="button">Student display</button></div>
      <details id="rfReview"><summary>Compare teacher text with the original page</summary><div class="rf-verify"><img id="rfSourceImage" alt="Original student passage for text verification"><label>Passage title<input id="rfEditTitle" maxlength="180"></label><label>Passage text<textarea id="rfEditText" rows="15" maxlength="10000"></textarea></label><button id="rfVerify" type="button">Save checked text</button></div></details>
      <p id="rfVerification" class="rf-help"></p><div class="rf-timer"><strong id="rfClock" aria-label="Seconds remaining">1:00</strong><span id="rfTimerStatus" role="alert">Ready</span><button id="rfStart" type="button">Start 1 minute</button><button id="rfFinish" type="button" disabled>Finished whole passage early</button><div class="rf-student-dock"><div class="rf-zoom-row"><strong>Student zoom</strong><button id="rfZoomOut" type="button" aria-label="Make the student page smaller">− Smaller</button><output id="rfZoomLabel">Larger</output><button id="rfZoomIn" type="button" aria-label="Make the student page larger">+ Larger</button><button id="rfAutoPause" type="button">Pause scroll</button></div><div class="rf-scroll-row"><button id="rfStudentUp" type="button">↑ Back a little</button><button id="rfStudentDown" type="button">↓ Ahead a little</button><button id="rfStudentTop" type="button">Page top</button><label class="rf-inline"><input id="rfAutoScroll" type="checkbox" checked>Slow scroll on start</label></div><details class="rf-student-options"><summary>More student page controls</summary><div class="rf-student-view"><label>Student page size<select id="rfStudentFit"><option value="zoom" selected>Zoomed reading</option><option value="page">Full PDF page</option><option value="readable">Page width</option></select></label><label>Scroll pace<select id="rfScrollSpeed"><option value="0.2">Very slow</option><option value="0.35">Slow</option><option value="0.5">Steady</option></select></label></div><label>Scroll student page<input id="rfStudentScroll" type="range" min="0" max="1000" step="0.1" value="0" aria-label="Scroll student PDF passage"></label></details></div></div>
      <div class="rf-marking"><label><input type="radio" name="rfMarkMode" value="error" checked>Mark errors</label><label><input type="radio" name="rfMarkMode" value="last">Last word attempted</label><button id="rfZero" type="button" disabled>No words attempted</button></div>
      <p class="rf-help">Tap a word to mark an error; tap again to undo. Choose Last word attempted, then tap the endpoint. Marks stay on the teacher screen.</p>
      <article id="rfWords" class="rf-words" aria-label="Teacher scoring passage"></article><output id="rfScore" class="rf-score">Complete a timed check to calculate a score.</output>
      <label>Observations<textarea id="rfNotes" rows="2" maxlength="2000"></textarea></label><div class="rf-actions"><button id="rfSave" type="button" disabled>Save changes</button><button id="rfClear" type="button" disabled>Clear session…</button><button id="rfReset" type="button">New attempt</button><span id="rfAutoSave" role="status"></span></div>
      <h2>Reading over time</h2><div class="rf-history-controls"><label>History school year<select id="rfHistoryYear"></select></label><span class="rf-help">Graph uses the selected passage grade. Table preserves all levels.</span><button id="rfExport" type="button">Export student CSV</button></div><label class="rf-inline"><input id="rfShowCleared" type="checkbox">Show cleared sessions</label><div id="rfTrend" class="rf-trend"></div><div class="rf-table-wrap"><table><thead><tr><th>Date / check</th><th>Passage</th><th>WCPM</th><th>Accuracy</th><th>Details</th></tr></thead><tbody id="rfHistory"></tbody></table></div>
      </section></div></div>`;
    document.body.append(dialog);
    if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)dialog.querySelector('#rfAutoScroll').checked=false;
    const by = id => dialog.querySelector('#'+id);
    let previousOverflow = '';
    let saveQueue=Promise.resolve(), saveDebounce=null, zoom=1.75, autoMotion=null, lastProjection=0;
    let bank = [], passage = null, attempt = null, assignment = null, clockId = null, busy = false, projected = false, opener = null;
    const say = text => { by('rfMessage').textContent = text; };
    const state = () => adapter.getState();
    const records = () => state().readingFluencyRecords || [];
    const assignments = () => state().readingFluencyAssignments || [];
    const studentId = () => by('rfStudent').value;
    const year = () => state().activeSchoolYearId;
    const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const group = () => state().groups?.find(g => g.id === by('rfGroup').value);
    const student = () => (state().rosterStudents || []).find(s => s.studentId === studentId());
    const studentView = () => ({ fit: by('rfStudentFit').value, scroll: Number(by('rfStudentScroll').value)/1000, zoom });
    const studentPayload = () => payload(projected && passage?.verified ? passage : null, studentView());
    function syncProjection() { if (projected) adapter.project(studentPayload()); }
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
      for(const id of ['rfGroup','rfStudent','rfGrade','rfPeriod','rfDate','rfPassage','rfRandom','rfAssign','rfVerify','rfSavedAssignment','rfLoadAssignment','rfStudentGrade','rfSaveGrade'])by(id).disabled=busy||locked;
      by('rfStart').disabled=busy||locked||!passage?.verified||!studentId();
      by('rfFinish').disabled=busy||!running;by('rfZero').disabled=busy||attempt?.status!=='finished';
      by('rfSave').disabled=busy||!attempt||attempt.status==='running';
      by('rfClear').disabled=busy||!attempt;
      by('rfZoomOut').disabled=busy||zoom<=1;by('rfZoomIn').disabled=busy||zoom>=2;by('rfAutoPause').disabled=busy||!running;
      by('rfHistory').querySelectorAll('button').forEach(button=>button.disabled=busy||running);
      by('rfProject').disabled=!passage?.verified||busy;
      by('rfReset').disabled=busy;
      by('rfClose').disabled=busy||running;
      by('rfEditTitle').disabled=busy||locked;by('rfEditText').disabled=busy||locked;
      by('rfNotes').disabled=busy;
      dialog.querySelectorAll('[name="rfMarkMode"]').forEach(input=>input.disabled=busy);
    }
    function fillStudents() {
      const g=group();const previous=studentId();
      by('rfStudent').innerHTML='<option value="">Choose student</option>'+(g?.students||[]).filter(n=>g.studentIds?.[n]).map(n=>`<option value="${esc(g.studentIds[n])}">${esc(shortName(n))}</option>`).join('');
      if([...by('rfStudent').options].some(o=>o.value===previous))by('rfStudent').value=previous;
      useStudentGrade();renderHistory();renderAssignments();
    }
    function useStudentGrade() {
      const actual = student()?.gradeLevel;
      by('rfStudentGrade').value = String(actual ?? '').toUpperCase() === 'K' ? 'K' : String(gradeNumber(actual) || '');
      const level = gradeNumber(actual);
      if (level && level <= 6) by('rfGrade').value=String(level);
      else by('rfGrade').value='1';
      by('rfGradeNote').textContent=level&&level<=6 ? `Using this student's Grade ${level} passages. You can choose another passage grade when needed.` : actual ? `Student grade: ${actual}. Choose a passage level from Grades 1–6.` : 'This student has no grade assigned. Set it here, or choose a passage grade for this check.';
      fillPassages();
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
      if(passage)by('rfSourceImage').src=passage.imagePath || passage.sourceImage;else by('rfSourceImage').removeAttribute('src');
      by('rfReview').hidden=!passage;by('rfReview').open=false;
      by('rfVerification').textContent=passage?'The student sees the original PDF page. The session saves automatically when time ends. You can keep correcting the words and endpoint afterward.':'';
      const used=passage && [...records(),...assignments()].some(r=>r.studentId===studentId()&&r.passageId===passage.id);
      by('rfUse').textContent=used?'Previously assigned or read by this student. Earlier completed readings will be labeled as repeated passages.':passage?'No earlier assignment or reading for this student.':'';
      by('rfStudentScroll').value='0';renderWords();controls();syncProjection();
    }
    function renderWords() {
      const titleCount=attempt?tokens(attempt.source.passageTitle).length:passage?tokens(passage.title).length:0;
      by('rfWords').innerHTML=(attempt?.words || words()).map((w,i)=>`${i===titleCount?'<br><br>':''}<button type="button" data-rf-word="${i}" title="Word ${i+1}" aria-label="Word ${i+1}: ${esc(w)}" aria-pressed="${attempt?.errors.has(i)||false}" class="${i<titleCount?'rf-title-word ':''}${attempt?.errors.has(i)?'rf-error ':''}${attempt?.last===i?'rf-last ':''}${attempt?.last!==null&&attempt?.last!==undefined&&i>attempt.last?'rf-unread':''}">${esc(w)}</button> `).join('');
      renderScore();
    }
    function renderScore() {
      if (!attempt || attempt.last===null || !attempt.seconds || attempt.status==='interrupted') {by('rfScore').textContent=attempt?.status==='finished'?'Choose the last word attempted to calculate the saved session’s score.':attempt?.status==='interrupted'?'Interrupted session retained without a standard score.':'Complete a timed check and mark the last word attempted.';return;}
      const s=score(attempt.words,attempt.last,[...attempt.errors],attempt.seconds);
      by('rfScore').textContent=`${s.wcpm} raw WCPM · ${s.accuracy===null?'—':s.accuracy+'%'} accuracy · ${s.correct}/${s.attempted} correct · ${s.errors} errors · ${attempt.seconds}s`;
    }
    function tick() {
      if(attempt?.status!=='running')return;
      const remaining=Math.max(0,60-(performance.now()-attempt.startedClock)/1000);
      const n=Math.ceil(remaining);by('rfClock').textContent=`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
      moveStudentPage();
      if(!remaining)finish(false);
    }
    function finish(early) {
      if(attempt?.status!=='running')return;
      const elapsed=(performance.now()-attempt.startedClock)/1000;
      clearInterval(clockId);stopMotion();attempt.seconds=early&&elapsed<60?Math.max(.1,Math.round(elapsed*10)/10):60;
      attempt.status='finished';attempt.finishedAt=new Date().toISOString();
      attempt.last=early&&elapsed<60?attempt.words.length-1:null;
      by('rfTimerStatus').textContent=early&&elapsed<60?'Whole passage finished. Saving session automatically.':'One minute is done. Saving session; choose the last word attempted.';
      by('rfTimerStatus').classList.add('rf-time-done');
      if(!early)dialog.querySelector('[name="rfMarkMode"][value="last"]').checked=true;
      attempt.version=(attempt.version||0)+1;renderWords();controls();queueSave();
    }
    function reset() {
      clearInterval(clockId);clearTimeout(saveDebounce);stopMotion();attempt=null;assignment=null;by('rfAutoSave').textContent='';by('rfAssignment').textContent='';by('rfNotes').value='';by('rfDate').value=localDay();by('rfTitle').textContent=passage?.title||'Choose a passage';by('rfClock').textContent='1:00';by('rfTimerStatus').textContent='Ready';by('rfTimerStatus').classList.remove('rf-time-done');dialog.querySelector('[name="rfMarkMode"][value="error"]').checked=true;renderWords();controls();
    }
    function snapshotAttempt(statusOverride) {
      const status=statusOverride || (attempt.status==='interrupted'?'interrupted':attempt.last===null?'needs-endpoint':'complete');
      return {...attempt.context,...sessionMetrics(attempt.words,attempt.last,[...attempt.errors],attempt.seconds,status),id:attempt.id,assignmentId:attempt.assignmentId,
        type:'passage-oral-reading',scoreKind:'raw',language:'en',createdAt:attempt.createdAt||attempt.finishedAt,startedAt:attempt.startedAt,finishedAt:attempt.finishedAt,
        seconds:attempt.seconds,...attempt.source,words:[...attempt.words],lastWordIndex:attempt.last,errorIndices:[...attempt.errors].sort((a,b)=>a-b),notes:by('rfNotes').value.trim(),assessmentStatus:status,
        repeated:records().some(r=>r.id!==attempt.id&&r.studentId===attempt.context.studentId&&r.passageId===attempt.context.passageId&&completeRecord(r)),updatedAt:new Date().toISOString(),...(status==='cleared'?{clearedAt:new Date().toISOString(),clearedFromStatus:attempt.status==='interrupted'?'interrupted':attempt.last===null?'needs-endpoint':'complete'}:{}),};
    }
    function writeRow(row) {
      const task=saveQueue.catch(()=>{}).then(async()=>{
        const target=state(), old=target.readingFluencyRecords||[], previous=old.find(r=>r.id===row.id);
        const updated={...previous,...row,revisions:previous?[...(previous.revisions||[]),revisionFor(previous)]:[]};
        const written=previous?old.map(r=>r.id===row.id?updated:r):[...old,updated];target.readingFluencyRecords=written;
        try{await adapter.save();}catch(error){if(target.readingFluencyRecords===written)target.readingFluencyRecords=old;else if(target.readingFluencyRecords?.find(r=>r.id===row.id)===updated)target.readingFluencyRecords=target.readingFluencyRecords.flatMap(r=>r===updated?(previous?[previous]:[]):[r]);throw error;}
        return updated;
      });
      saveQueue=task;saveQueue.catch(()=>{});return task;
    }
    function persistCurrent(statusOverride) {
      clearTimeout(saveDebounce);
      if(!attempt||attempt.status==='running')return Promise.resolve();
      const current=attempt,version=current.version||0,row=snapshotAttempt(statusOverride),key=`${version}:${row.assessmentStatus}`;
      if(current.pendingKey===key)return current.pendingSave;
      current.pendingKey=key;
      by('rfAutoSave').textContent='Saving session…';
      const task=writeRow(row).then(saved=>{
        current.persisted=true;current.savedVersion=version;current.createdAt=saved.createdAt;
        if(attempt!==current)return;
        if(current.saveError&&by('rfMessage').textContent===current.saveError){say('Session saved. Corrections save automatically.');delete current.saveError;}
        if((current.version||0)===version&&current.status==='finished')by('rfTimerStatus').textContent=saved.assessmentStatus==='needs-endpoint'?'Session saved. Choose the last word attempted.':'Session saved. You can keep correcting it.';
        by('rfAutoSave').textContent=(current.version||0)===version?(saved.assessmentStatus==='needs-endpoint'?'Saved · last word needed':saved.assessmentStatus==='interrupted'?'Saved · interrupted':'Saved automatically'):'Saving corrections…';
        renderHistory();renderAssignments();
      }).catch(error=>{
        if(attempt===current){
          by('rfAutoSave').textContent='Not saved · retry Save changes';
          current.saveError=error.message||'Session could not save. Keep this screen open and retry.';say(current.saveError);
          if(current.status==='finished')by('rfTimerStatus').textContent='Session not saved. Retry Save changes.';
        }
        throw error;
      }).finally(()=>{if(current.pendingKey===key){delete current.pendingKey;delete current.pendingSave;}});
      current.pendingSave=task;return task;
    }
    function queueSave() { persistCurrent().catch(()=>{}); }
    function changed(delay=0) {
      if(!attempt)return;attempt.version=(attempt.version||0)+1;
      if(attempt.status==='running')return;
      clearTimeout(saveDebounce);if(delay)saveDebounce=setTimeout(queueSave,delay);else queueSave();
    }
    async function flushAttempt() {
      clearTimeout(saveDebounce);await saveQueue.catch(()=>{});
      if(attempt&&attempt.status!=='running'&&(!attempt.persisted || attempt.savedVersion!==(attempt.version||0)))await persistCurrent();
    }
    async function loadRecord(id) {
      if(attempt?.status==='running')throw new Error('Finish or clear the running session first.');
      await flushAttempt();const row=records().find(r=>r.id===id&&r.studentId===studentId()&&r.assessmentStatus!=='cleared');
      if(!row)return;const source=bank.find(p=>p.id===row.passageId);if(!source)throw new Error('This passage is unavailable. Reopen online.');
      reset();by('rfGrade').value=String(row.passageGrade);fillPassages();by('rfPassage').value=row.passageId;choosePassage();by('rfDate').value=row.sessionDate;by('rfPeriod').value=row.period;
      const ctx={};for(const key of ['studentId','groupId','schoolYearId','passageId','passageGrade','period','sessionDate'])ctx[key]=row[key];
      const meta={};for(const key of ['form','passageTitle','sourceHash','textVerifiedAt'])meta[key]=row[key];
      attempt={id:row.id,assignmentId:row.assignmentId,context:ctx,words:[...row.words],source:meta,errors:new Set(row.errorIndices||[]),last:row.lastWordIndex??null,status:row.assessmentStatus==='interrupted'?'interrupted':'finished',startedAt:row.startedAt,finishedAt:row.finishedAt,createdAt:row.createdAt,seconds:row.seconds,persisted:true,version:0,savedVersion:0};
      dialog.querySelector(`[name="rfMarkMode"][value="${row.lastWordIndex===null?'last':'error'}"]`).checked=true;
      by('rfTitle').textContent=row.passageTitle;by('rfNotes').value=row.notes||'';by('rfAutoSave').textContent='Saved session · edits save automatically';by('rfTimerStatus').textContent='Review saved session';by('rfClock').textContent=`${row.seconds}s`;renderWords();controls();say('Editing this saved session. Corrections save automatically.');
      by('rfWords').scrollIntoView({block:'start'});
    }
    async function clearSession(id) {
      if(!window.confirm('Clear this reading session? It will be removed from active history and the growth graph. A private recovery copy will be retained.'))return;
      if(attempt?.id===id){
        clearInterval(clockId);stopMotion();
        if(attempt.status==='running'){attempt.seconds=Math.min(60,Math.max(.1,(performance.now()-attempt.startedClock)/1000));attempt.finishedAt=new Date().toISOString();attempt.status='interrupted';}
        await saveQueue.catch(()=>{});await persistCurrent('cleared');reset();
      }else{
        await flushAttempt();const row=records().find(r=>r.id===id&&r.studentId===studentId());if(!row)return;
        await writeRow({...row,...sessionMetrics(row.words,row.lastWordIndex,row.errorIndices||[],row.seconds,'cleared'),clearedFromStatus:row.assessmentStatus||'complete',assessmentStatus:'cleared',clearedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      }
      renderHistory();renderAssignments();say('Session cleared. Use Show cleared sessions to review or restore it.');
    }
    function startMotion() {
      autoMotion=attempt?.status==='running'&&by('rfAutoScroll').checked?{at:performance.now(),position:Number(by('rfStudentScroll').value)/1000}:null;
      by('rfAutoPause').textContent=autoMotion?'Pause scroll':'Resume scroll';
    }
    function stopMotion() {autoMotion=null;by('rfAutoPause').textContent='Resume scroll';}
    function moveStudentPage() {
      if(!autoMotion||attempt?.status!=='running')return;
      const now=performance.now();if(now-lastProjection<200)return;lastProjection=now;
      by('rfStudentScroll').value=String(Math.min(1,autoMotion.position+(now-autoMotion.at)/60000*Number(by('rfScrollSpeed').value))*1000);syncProjection();
    }
    function setZoom(value) {
      zoom=Math.max(1,Math.min(2,value));by('rfStudentFit').value='zoom';
      by('rfZoomLabel').textContent=zoom<=1?'Fit':zoom<=1.25?'Medium':zoom<=1.5?'Large':zoom<=1.75?'Larger':'Largest';syncProjection();controls();
    }
    function manualScroll(value) {stopMotion();by('rfStudentScroll').value=String(Math.max(0,Math.min(1000,value)));syncProjection();}
    function renderAssignments() {
      const completed=new Set(records().map(r=>r.assignmentId));
      by('rfSavedAssignment').innerHTML='<option value="">Choose saved assignment</option>'+assignments().filter(a=>a.studentId===studentId() && a.schoolYearId===year() && !completed.has(a.id)).map(a=>{const p=bank.find(p=>p.id===a.passageId);return `<option value="${esc(a.id)}">${esc(a.sessionDate)} · ${esc(a.period)} · Grade ${a.passageGrade} · ${esc(p?.title||'Passage unavailable')}</option>`;}).join('');
    }
    function historyRecords() {return records().filter(r=>(r.assessmentStatus!=='cleared'||by('rfShowCleared').checked)&&r.studentId===studentId() && (by('rfHistoryYear').value==='all'||r.schoolYearId===by('rfHistoryYear').value)).sort((a,b)=>a.sessionDate.localeCompare(b.sessionDate)||a.createdAt.localeCompare(b.createdAt));}
    function renderHistory() {
      const selected=by('rfHistoryYear').value||year(), years=[...new Set([year(),...records().filter(r=>r.studentId===studentId()).map(r=>r.schoolYearId)])].filter(Boolean).sort().reverse();
      by('rfHistoryYear').innerHTML=years.map(y=>`<option>${esc(y)}</option>`).join('')+'<option value="all">All years</option>';by('rfHistoryYear').value=selected;
      const rows=historyRecords();
      by('rfHistory').innerHTML=rows.slice().reverse().map(r=>`<tr><td>${esc(r.sessionDate)}<br>${esc(r.period)}</td><td>Grade ${r.passageGrade} · Form ${r.form}<br>${esc(r.passageTitle)}${r.repeated?' · Repeated':''}</td><td>${completeRecord(r)?r.wcpm:r.assessmentStatus==='cleared'?'Cleared':r.assessmentStatus==='interrupted'?'Interrupted':'Last word needed'}</td><td>${r.accuracy===null||!completeRecord(r)?'—':r.accuracy+'%'}</td><td><details><summary>${r.attempted===null?'Awaiting endpoint':r.correct+'/'+r.attempted} · ${r.seconds}s</summary><p>${esc(r.notes)}</p><p>Missed: ${esc((r.errorIndices||[]).map(i=>`${i+1}: ${r.words[i]}`).join(', ')||'None')}</p><p>Last word: ${r.lastWordIndex===null?'Last word needed':r.lastWordIndex<0?'No words attempted':esc(`${r.lastWordIndex+1}: ${r.words[r.lastWordIndex]}`)}</p><p>${(r.revisions||[]).length} earlier saved versions retained.</p></details>${r.assessmentStatus==='cleared'?`<button type="button" data-rf-restore="${esc(r.id)}">Restore session</button>`:`<button type="button" data-rf-edit="${esc(r.id)}">Edit session</button> <button type="button" data-rf-clear="${esc(r.id)}">Clear…</button>`}</td></tr>`).join('')||'<tr><td colspan="5">No saved reading checks for this student and year.</td></tr>';
      const points=rows.filter(r=>completeRecord(r)&&r.passageGrade===Number(by('rfGrade').value));
      by('rfHistory').querySelectorAll('button').forEach(button=>button.disabled=busy||attempt?.status==='running');
      if(!points.length){by('rfTrend').textContent='Same-grade growth appears here after a reading record is saved.';return;}
      const width=Math.max(560,points.length*85),height=210,max=Math.max(20,...points.map(r=>r.wcpm)), x=i=>50+i*(width-100)/Math.max(1,points.length-1), y=v=>170-v/max*140;
      by('rfTrend').innerHTML=`<svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" role="img" aria-label="Grade ${esc(by('rfGrade').value)} raw WCPM over time; exact values in the history table"><line x1="50" y1="30" x2="50" y2="170" stroke="#94a3b8"/><line x1="50" y1="170" x2="${width-30}" y2="170" stroke="#94a3b8"/><text x="4" y="30">${max}</text><text x="22" y="174">0</text><polyline fill="none" stroke="#0f766e" stroke-width="2" points="${points.map((r,i)=>`${x(i)},${y(r.wcpm)}`).join(' ')}"/>${points.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r.wcpm)}" r="5" fill="${r.period==='Progress monitoring'?'#64748b':'#0f766e'}"><title>${esc(r.sessionDate)} · ${esc(r.period)} · ${r.wcpm} raw WCPM${r.repeated?' · Repeated passage':''}</title></circle><text x="${x(i)}" y="${y(r.wcpm)-12}" text-anchor="middle">${r.wcpm}</text><text x="${x(i)}" y="193" text-anchor="middle">${esc(r.sessionDate.slice(5))}</text>`).join('')}</svg><p class="rf-help">Grade ${esc(by('rfGrade').value)} · raw WCPM · points are equally spaced by assessment; exact dates and repeated passages are in the table.</p>`;
    }
    async function open() {
      opener=document.activeElement;adapter.stopMirror();await adapter.ready?.();reset();
      const saved=await libraryRead().catch(()=>[]);bank=builtinPassages().map(p=>{const edit=saved.find(s=>s.id===p.id&&s.editOverride);return edit?{...p,title:edit.title,text:edit.text,verifiedAt:edit.verifiedAt}:p;});if(!bank.length)throw new Error('The built-in passage library did not load. Reopen the app online once.');by('rfLibraryStatus').textContent=`${bank.length} built-in English passages · 20 per grade · ready to read`;
      by('rfGroup').innerHTML='<option value="">Choose group</option>'+(state().groups||[]).filter(g=>g.schoolYearId===year()).map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
      by('rfGroup').value=adapter.activeGroupId();by('rfDate').value=localDay();fillStudents();by('rfStudent').value=adapter.activeStudentId();useStudentGrade();renderHistory();renderAssignments();say('Choose a passage, open Student display, then start the timer.');previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();
    }
    for(const id of ['ttHomeReadingFluency','ttReadingFluency'])document.getElementById(id)?.addEventListener('click',guard(open));
    by('rfGroup').onchange=fillStudents;by('rfStudent').onchange=()=>{useStudentGrade();renderHistory();renderAssignments();};by('rfGrade').onchange=()=>{fillPassages();renderHistory();};by('rfPassage').onchange=choosePassage;
    for(const id of ['rfPeriod','rfDate'])by(id).onchange=()=>{assignment=null;by('rfAssignment').textContent='';};
    by('rfRandom').onclick=()=>{if(!bank.length){say('The built-in passage library is unavailable. Reopen online.');return;}const choices=unused(bank,records(),assignments(),studentId(),by('rfGrade').value);if(!studentId()){say('Choose a student first.');return;}if(!choices.length){say('No unused passages remain for this grade. Choose a previous passage deliberately.');return;}by('rfPassage').value=choices[Math.floor(Math.random()*choices.length)].id;choosePassage();};
    by('rfVerify').onclick=guard(async()=>{if(!passage)return;const title=by('rfEditTitle').value.trim(),text=by('rfEditText').value.trim();if(!title||text.length<50)throw new Error('Title and full passage text are required.');const updated={...passage,title,text,verified:true,verifiedAt:new Date().toISOString(),editOverride:true};const next=bank.map(p=>p.id===passage.id?updated:p);await libraryWrite(next);bank=next;fillPassages();say('Teacher text correction saved on this device. The original student page is preserved.');});
    by('rfLoadAssignment').onclick=()=>{const a=assignments().find(a=>a.id===by('rfSavedAssignment').value&&a.studentId===studentId());if(!a)return;if(!bank.some(p=>p.id===a.passageId)){say('The assigned passage is unavailable. Reopen the app online.');return;}by('rfGrade').value=String(a.passageGrade);fillPassages();by('rfPassage').value=a.passageId;choosePassage();by('rfPeriod').value=a.period;by('rfDate').value=a.sessionDate;assignment=a;by('rfAssignment').textContent='Using the saved assignment.';renderHistory();controls();};
    by('rfAssign').onclick=guard(assign);
    by('rfStart').onclick=guard(async()=>{validContext();const a=await assign();attempt={id:crypto.randomUUID(),assignmentId:a.id,context:context(),words:words(),errors:new Set(),last:null,status:'running',startedAt:new Date().toISOString(),startedClock:performance.now(),seconds:0,version:0,source:{form:passage.form,passageTitle:passage.title,sourceHash:passage.sourceHash,textVerifiedAt:passage.verifiedAt}};by('rfStudentScroll').value='0';if(by('rfAutoScroll').checked)by('rfStudentFit').value='zoom';startMotion();syncProjection();by('rfTimerStatus').textContent='Reading · teacher timer only';say('');clockId=setInterval(tick,100);controls();});
    by('rfFinish').onclick=()=>{tick();if(attempt?.status!=='running')return;finish(true);};
    by('rfWords').onclick=event=>{const button=event.target.closest('[data-rf-word]');if(busy||!button||!attempt||!['running','finished'].includes(attempt.status))return;tick();const i=Number(button.dataset.rfWord),mode=dialog.querySelector('[name="rfMarkMode"]:checked').value;if(mode==='last')attempt.last=i;else if(attempt.errors.has(i))attempt.errors.delete(i);else attempt.errors.add(i);renderWords();controls();changed();};
    by('rfZero').onclick=()=>{attempt.last=-1;renderWords();controls();changed();};
    by('rfSave').onclick=guard(async()=>{await flushAttempt();say('Session saved. You can continue editing it.');});
    by('rfNotes').oninput=()=>changed(500);
    by('rfReset').onclick=guard(async()=>{if(attempt?.status==='running'){say('Finish or clear the running session first.');return;}await flushAttempt();reset();});
    by('rfClear').onclick=guard(()=>clearSession(attempt?.id));
    by('rfHistory').onclick=event=>{const edit=event.target.closest('[data-rf-edit]'),clear=event.target.closest('[data-rf-clear]'),restore=event.target.closest('[data-rf-restore]');
      if(edit)guard(()=>loadRecord(edit.dataset.rfEdit))();
      else if(clear)guard(()=>clearSession(clear.dataset.rfClear))();
      else if(restore)guard(async()=>{await flushAttempt();const row=records().find(r=>r.id===restore.dataset.rfRestore&&r.studentId===studentId());if(!row)return;const status=row.lastWordIndex===null?'needs-endpoint':'complete';const previous=(row.revisions||[]).at(-1);const restored=(row.clearedFromStatus||previous?.assessmentStatus)==='interrupted'?'interrupted':status;await writeRow({...row,...sessionMetrics(row.words,row.lastWordIndex,row.errorIndices||[],row.seconds,restored),assessmentStatus:restored,clearedAt:null,updatedAt:new Date().toISOString()});renderHistory();say('Session restored.');})();
    };
    by('rfShowCleared').onchange=renderHistory;
    by('rfProject').onclick=()=>{projected=true;adapter.openDisplay(studentPayload());say('Student display shows the original PDF page. Use Student page size and Scroll student page to control it. Timer and marks stay here.');};
    by('rfStudentFit').onchange=()=>{stopMotion();by('rfStudentScroll').value='0';syncProjection();};
    by('rfStudentScroll').oninput=()=>manualScroll(Number(by('rfStudentScroll').value));
    by('rfStudentTop').onclick=()=>manualScroll(0);
    by('rfStudentUp').onclick=()=>manualScroll(Number(by('rfStudentScroll').value)-70);
    by('rfStudentDown').onclick=()=>manualScroll(Number(by('rfStudentScroll').value)+70);
    by('rfZoomOut').onclick=()=>setZoom(zoom-.25);by('rfZoomIn').onclick=()=>setZoom(zoom+.25);
    by('rfAutoPause').onclick=()=>{if(autoMotion)stopMotion();else startMotion();};
    by('rfAutoScroll').onchange=()=>{if(by('rfAutoScroll').checked)startMotion();else stopMotion();};
    by('rfScrollSpeed').onchange=()=>{if(autoMotion)startMotion();};
    by('rfSaveGrade').onclick=guard(async()=>{const row=student();if(!row)throw new Error('Choose a student with a roster record first.');const value=by('rfStudentGrade').value;if(!value)throw new Error('Choose the student grade first.');const before=row.gradeLevel;row.gradeLevel=value;try{await adapter.save();}catch(e){if(before===undefined)delete row.gradeLevel;else row.gradeLevel=before;throw e;}useStudentGrade();renderHistory();say('Student grade saved. Passage choices now follow that grade.');});
    by('rfHistoryYear').onchange=renderHistory;
    by('rfExport').onclick=()=>{const cell=v=>'"'+String(v??'').replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"';const rows=[['Date','Check','Grade','Form','Passage','Seconds','Attempted','Errors','Correct','Raw WCPM','Accuracy %','Repeated','Notes','Session status'],...historyRecords().map(r=>[r.sessionDate,r.period,r.passageGrade,r.form,r.passageTitle,r.seconds,r.attempted,r.errors,r.correct,r.wcpm,r.accuracy,r.repeated?'Yes':'No',r.notes,r.assessmentStatus||'complete'])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`reading-fluency-${localDay()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
    async function close() {if(attempt?.status==='running')return;await flushAttempt();clearInterval(clockId);stopMotion();if(projected)adapter.project(payload(null));projected=false;dialog.close();document.documentElement.style.overflow=previousOverflow;adapter.endProjection();opener?.focus();}
    by('rfClose').onclick=guard(close);dialog.addEventListener('cancel',e=>{e.preventDefault();guard(close)();});
    function preserveOnHide() {
      if(!attempt)return;tick();
      if(attempt.status==='running'){
        clearInterval(clockId);stopMotion();attempt.seconds=Math.min(60,Math.max(.1,(performance.now()-attempt.startedClock)/1000));attempt.finishedAt=new Date().toISOString();attempt.status='interrupted';changed();
        by('rfTimerStatus').textContent='Interrupted: teacher screen was hidden. Start a new attempt; no standard score can be saved.';controls();
      }else if(!attempt.persisted||attempt.savedVersion!==(attempt.version||0)){clearTimeout(saveDebounce);queueSave();}
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)preserveOnHide();});
    window.addEventListener('pagehide',preserveOnHide);
    window.addEventListener('beforeunload',e=>{if(attempt&&(attempt.status==='running'||!attempt.persisted||attempt.savedVersion!==(attempt.version||0))){e.preventDefault();e.returnValue='';}});
    return { open, stagePayload:()=>dialog.open?studentPayload():null };
  }
  return { tokens, score, sessionMetrics, revisionFor, completeRecord, unused, payload, gradeNumber, validateLibrary, install };
});
