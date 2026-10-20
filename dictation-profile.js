/* Read-only Section 8 projection. No classroom record is created by this view. */
(function (root) {
  'use strict';
  const categories = [
    { key: 'real', label: 'Real words', name: 'real words', standard: 5 },
    { key: 'nonsense', label: 'Nonsense words', name: 'nonsense words', standard: 3 },
    { key: 'hfw', label: 'HFW from phrases', name: 'hfw from phrase' },
    { key: 'sounds', label: 'Sounds', name: 'sounds', standard: 5 },
    { key: 'elements', label: 'Word elements', name: 'word elements' }
  ];
  const normalized = value => String(value ?? '').trim().toLocaleLowerCase();
  const categoryName = value => normalized(value).replace(/^\d+\s*/, '');
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const unique = values => [...new Map(values.filter(Boolean).map(value => [normalized(value), String(value)])).values()];
  function day(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  const observedDay = record => day(record.date || record.savedAt || record.createdAt || record.sessionDate);
  const assessmentDay = record => day(record.sessionDate || record.date || record.savedAt || record.scheduledDate);
  const dateText = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not recorded';
  function sameStudent(a, b) {
    if (a.studentId && b.studentId) return a.studentId === b.studentId;
    const left = normalized(a.student || a.studentName || a.name), right = normalized(b.student || b.studentName || b.name);
    return Boolean(left && right && left === right);
  }
  function sameLesson(a, b) {
    if (a.lessonId && b.lessonId) return a.lessonId === b.lessonId;
    if (!a.planId || a.planId !== b.planId) return false;
    const plan = (a._group?.history || b._group?.history || []).find(plan => plan.id === a.planId);
    if (a.lessonId || b.lessonId) return Boolean(plan && plan.lessons?.length === 1
      && plan.lessons[0].id === (a.lessonId || b.lessonId));
    return !plan || (plan.lessons || []).length <= 1;
  }
  const isMiss = record => Boolean(record.item) && (record.observationKind === 'missed-item' || record.observationCode === 'Miss' || record.note === 'encoding miss' || (!record.observationKind && !record.observationCode));
  const written = record => typeof record?.writtenResponse === 'string' ? record.writtenResponse : '';
  function score(assessment, category, observations = []) {
    const categoryKey = Object.keys(assessment.categories || {}).find(key => categoryName(key) === categoryName(category));
    const items = assessment.categories?.[categoryKey];
    if (!Array.isArray(items) || !items.length || assessment.assessmentStatus && assessment.assessmentStatus !== 'assessed') return null;
    if (Array.isArray(assessment.assessedCategories) && !assessment.assessedCategories.some(key => categoryName(key) === categoryName(categoryKey))) return null;
    // A repeated target cannot be assigned to one occurrence by an item-only miss.
    if (new Set(items.map(normalized)).size !== items.length) return null;
    const marks = observations.filter(mark => mark.section === 'section8' && sameStudent(mark, assessment)
      && sameLesson(mark, assessment) && categoryName(mark.category) === categoryName(categoryKey) && isMiss(mark));
    const stored = assessment.missesByCategory?.[categoryKey];
    const misses = new Set((Array.isArray(stored) ? stored : marks.map(mark => mark.item)).map(normalized));
    const words = items.map(item => {
      const target = String(item), missed = misses.has(normalized(target));
      const mark = marks.find(mark => normalized(mark.item) === normalized(target) && written(mark));
      return { target, correct: !missed, response: missed ? written(mark) : '' };
    });
    return { total: words.length, correct: words.filter(word => word.correct).length, words };
  }
  function rows({ assessments = [], observations = [] } = {}) {
    const marks = observations.filter(mark => mark.section === 'section8');
    const groups = new Map();
    marks.forEach(mark => {
      const date = observedDay(mark);
      const identity = mark.lessonId ? `lesson:${mark.lessonId}` : mark.planId ? `plan:${mark.planId}` : `group:${mark._group?.id || mark.groupIdAtTime || ''}`;
      const key = JSON.stringify([date, identity]);
      if (!groups.has(key)) groups.set(key, { key, date, observations: [], assessments: [] });
      groups.get(key).observations.push(mark);
    });
    const seen = new Set();
    assessments.forEach(assessment => {
      const identity = assessment.id || JSON.stringify([assessment.studentId || assessment.student, assessment.lessonId, assessment.planId, assessment.date, assessment.categories]);
      if (seen.has(identity)) return;
      seen.add(identity);
      const linked = marks.filter(mark => sameStudent(mark, assessment) && sameLesson(mark, assessment));
      const dates = unique(linked.map(observedDay));
      const historical = assessment.source === 'verified-historical-section8-checkpoint-v1';
      // Project an imported plan-date label onto its sole recorded evidence day;
      // keep both dates visible in details. Never rewrite the source snapshot.
      const date = historical && dates.length === 1 ? dates[0] : assessmentDay(assessment);
      const matches = [...groups.values()].filter(row => row.date === date && row.observations.some(mark => sameStudent(mark, assessment) && sameLesson(mark, assessment)));
      const row = matches.length === 1 && !matches[0].assessments.length ? matches[0]
        : { key: `assessment:${identity}`, date, observations: [], assessments: [] };
      row.assessments.push(assessment);
      row.snapshotDate = assessmentDay(assessment);
      row.historical = historical;
      row.linkedDates = dates;
      groups.set(row.key, row);
    });
    return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
  }
  function model(input, key = 'real') {
    const category = categories.find(category => category.key === key) || categories[0];
    const entries = rows(input).map(row => {
      const assessment = row.assessments[0];
      const result = assessment ? score(assessment, category.name, input.observations) : null;
      const marks = row.observations.filter(mark => categoryName(mark.category) === category.name && isMiss(mark));
      const words = result?.words || unique(marks.map(mark => mark.item)).map(target => ({ target, correct: false, response: written(marks.find(mark => normalized(mark.item) === normalized(target) && written(mark))) }));
      const other = unique(row.observations.map(mark => categories.find(category => category.name === categoryName(mark.category))?.label || (isMiss(mark) ? categoryName(mark.category) : '')).filter(Boolean));
      const status = words.length ? 'Misses saved · total unconfirmed' : other.length ? `${other.join(', ')} observations` : 'Teacher observations saved';
      return { ...row, assessment, score: result, words, status };
    });
    const scored = entries.filter(entry => entry.score);
    const total = scored.reduce((n, entry) => n + entry.score.total, 0);
    const correct = scored.reduce((n, entry) => n + entry.score.correct, 0);
    const percent = !category.standard || scored.some(entry => entry.score.total !== category.standard);
    const maximum = percent ? 100 : category.standard;
    // Grow every axis interval uniformly, so short bars still fit their words.
    const plotHeight = Math.max(360, ...scored.filter(entry => entry.score.correct > 0).map(entry => {
      const ratio = percent ? entry.score.correct / entry.score.total : entry.score.correct / maximum;
      const lines = entry.words.reduce((n, word) => n + Math.max(1, Math.ceil((word.target.length + word.response.length + 3) / 14)), 0);
      return Math.ceil((lines * 29 + 24) / ratio);
    }));
    const frequency = new Map();
    const counted = new Set();
    // Count underlying observation dates, not mirrored observations/snapshots twice.
    (input.observations || []).filter(mark => mark.section === 'section8' && categoryName(mark.category) === category.name && isMiss(mark)).forEach(mark => {
      const id = JSON.stringify([observedDay(mark), normalized(mark.item)]);
      if (!counted.has(id)) { counted.add(id); frequency.set(normalized(mark.item), (frequency.get(normalized(mark.item)) || 0) + 1); }
    });
    scored.forEach(entry => entry.words.filter(word => !word.correct).forEach(word => {
      const linked = (input.observations || []).some(mark => sameStudent(mark, entry.assessment) && sameLesson(mark, entry.assessment) && categoryName(mark.category) === category.name && normalized(mark.item) === normalized(word.target) && isMiss(mark));
      const id = JSON.stringify([entry.date, normalized(word.target)]);
      if (!linked && !counted.has(id)) { counted.add(id); frequency.set(normalized(word.target), (frequency.get(normalized(word.target)) || 0) + 1); }
    }));
    const tagDates = new Map();
    (input.observations || []).filter(mark => mark.section === 'section8' && !isMiss(mark) && (mark.observationCode || mark.note)).forEach(mark => {
      const label = mark.observationCode || mark.note;
      if (!tagDates.has(label)) tagDates.set(label, new Set());
      tagDates.get(label).add(observedDay(mark));
    });
    return { category, entries, scored, total, correct, latest: scored.at(-1), dates: new Set(entries.map(entry => entry.date)).size,
      percent, maximum, plotHeight, recurring: [...frequency].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]),
      tags: [...tagDates].map(([label, dates]) => ({ label, count: dates.size })) };
  }

  const scoreText = value => value ? `${value.correct}/${value.total} · ${Math.round(value.correct / value.total * 100)}%` : '—';
  const wordsHtml = words => words.map(word => `<span class="dp-word"><span class="dp-target">${escape(word.target)}</span>${word.correct
    ? '<span class="dp-correct" aria-label="correct">✓</span>'
    : word.response ? `<span class="dp-arrow">→</span><span class="dp-response">${escape(word.response)}</span>` : '<span class="dp-response" aria-label="missed">×</span>'}</span>`).join('');
  function lessonLabel(entry) {
    const record = entry.assessment || entry.observations[0] || {};
    const plan = (record._group?.history || []).find(plan => plan.id === record.planId);
    const lesson = plan?.lessons?.find(lesson => lesson.id === record.lessonId);
    const number = record.lessonNumber || plan?.lessonNumber || lesson?.lessonSequence;
    return `${number ? `Lesson ${number}` : 'Lesson link not recorded'}${record.substep ? ` · Substep ${record.substep}` : ''}`;
  }
  function detailsHtml(entry, input) {
    if (!entry) return '';
    const linked = (input.observations || []).filter(mark => mark.section === 'section8' && (entry.observations.includes(mark)
      || entry.assessment && sameStudent(mark, entry.assessment) && sameLesson(mark, entry.assessment)));
    return `<h3>${escape(dateText(entry.date))} · ${escape(lessonLabel(entry))}</h3>
      <p>${entry.score ? `${escape(scoreText(entry.score))} · saved assessment` : escape(entry.status)}${entry.historical ? ' · historical checkpoint snapshot' : ''}</p>
      ${entry.snapshotDate && entry.historical ? `<p class="dp-note">Snapshot date label: ${escape(dateText(entry.snapshotDate))}. Recorded evidence dates: ${escape(entry.linkedDates.map(dateText).join(', ') || 'not recorded')}.</p>` : ''}
      <div class="dp-detail-words">${wordsHtml(entry.words)}</div>
      ${entry.words.some(word => !word.correct && !word.response) ? '<p class="dp-note">A missed target was saved; the student’s written response was not recorded.</p>' : ''}
      ${entry.assessment && !Array.isArray(entry.assessment.assessedCategories) ? '<p class="dp-note">Earlier saved snapshot: category-by-category confirmation was not recorded. Existing saved item lists and scores are retained.</p>' : ''}
      ${linked.length ? `<div class="table-wrap"><table><thead><tr><th>Recorded date</th><th>Category / type</th><th>Saved item or note</th></tr></thead><tbody>${linked.map(mark => `<tr><td>${escape(dateText(observedDay(mark)))}</td><td>${escape(mark.category || mark.observationCode || 'Observation')}</td><td>${escape(mark.item || mark.note || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="dp-note">No separate item observations are linked to this assessment.</p>'}`;
  }
  const states = new WeakMap();
  function render(element, input) {
    if (!element) return;
    let state = states.get(element);
    if (!state) {
      state = { key: 'real', view: 'summary', selected: '', scope: '' };
      states.set(element, state);
      element.addEventListener('change', event => {
        if (!event.target.matches('[data-dp-category]')) return;
        state.key = event.target.value; state.selected = ''; render(element, state.input);
        element.querySelector('[data-dp-category]').focus();
      });
      element.addEventListener('click', event => {
        if (event.target.closest('[data-dp-picker]')) { state.input.onChooseStudent?.(); return; }
        if (event.target.closest('[data-dp-notes]')) { state.input.onShowObservations?.(); return; }
        const view = event.target.closest('[data-dp-view]');
        if (view) { state.view = view.dataset.dpView; render(element, state.input); return; }
        const check = event.target.closest('[data-dp-check]');
        if (check) {
          state.selected = state.selected === check.dataset.dpCheck ? '' : check.dataset.dpCheck;
          const scroll = element.querySelector('.dp-scroll')?.scrollLeft || 0;
          render(element, state.input);
          element.querySelector('.dp-scroll').scrollLeft = scroll;
          [...element.querySelectorAll('[data-dp-check]')].find(button => button.dataset.dpCheck === check.dataset.dpCheck)?.focus({ preventScroll: true });
        }
      });
    }
    if (state.scope !== input.scope) { state.scope = input.scope; state.selected = ''; }
    state.input = input;
    const data = model(input, state.key), label = data.category.label;
    const selected = data.entries.find(entry => entry.key === state.selected);
    const axes = data.percent ? [100, 75, 50, 25, 0] : Array.from({ length: data.maximum + 1 }, (_, i) => data.maximum - i);
    element.innerHTML = `<div class="dp-heading"><div><span class="section-kicker">Progress monitoring</span><h2>Section 8 · Dictation</h2></div><button type="button" class="dp-picker" data-dp-picker>Change student / group</button></div>
      <div class="dp-controls"><div class="dp-view"><button type="button" data-dp-view="summary" aria-pressed="${state.view === 'summary'}">Progress summary</button><button type="button" data-dp-view="history" aria-pressed="${state.view === 'history'}">History</button></div>
      <label class="dp-category">Evidence category<select data-dp-category>${categories.map(category => `<option value="${category.key}" ${category.key === state.key ? 'selected' : ''}>${category.label}</option>`).join('')}</select></label></div>
      <div class="dp-metrics"><div><span>Latest scored check</span><strong>${escape(scoreText(data.latest?.score))}</strong><small>${escape(data.latest ? dateText(data.latest.date) : 'No verified total saved')}</small></div><div><span>Across ${data.scored.length} scored checks</span><strong>${data.total ? escape(scoreText(data)) : '—'}</strong><small>Only saved assessed item lists</small></div><div><span>Saved evidence</span><strong>${data.dates} dates</strong><small>${data.entries.filter(entry => !entry.score).length} entries without a ${escape(label.toLowerCase())} score</small></div></div>
      <div class="dp-chart" ${state.view !== 'summary' ? 'hidden' : ''}><h3>${escape(label)} progress</h3><p>${data.percent ? 'Accuracy · actual correct/total shown on each bar' : `Items correct out of ${data.maximum}`} · oldest to newest</p><div class="dp-legend"><span class="dp-target">Target word</span> <span>→</span> <span class="dp-response">Written response, when recorded</span><span class="dp-correct">✓ Correct</span><span class="dp-response">× Missed</span></div>
      ${data.entries.length ? `<div class="dp-scroll" tabindex="0" aria-label="${escape(label)} checks; scroll horizontally for all dates"><div class="dp-plot" style="--dp-height:${data.plotHeight}px;--dp-count:${data.entries.length}"><div class="dp-axis">${axes.map(value => `<span style="top:${(1 - value / data.maximum) * 100}%">${value}${data.percent ? '%' : ''}</span>`).join('')}</div><div class="dp-columns">
        ${data.entries.map(entry => {
          const ratio = entry.score ? data.percent ? entry.score.correct / entry.score.total : entry.score.correct / data.maximum : 0;
          const size = entry.score ? Math.round(ratio * data.plotHeight) : 0;
          return `<div class="dp-column"><button type="button" class="dp-check ${entry.score ? 'dp-assessed' : 'dp-unscored'} ${entry.score?.correct === 0 ? 'dp-zero' : ''}" data-dp-check="${escape(entry.key)}" aria-expanded="${entry.key === state.selected}" aria-label="${escape(`${dateText(entry.date)}, ${entry.score ? scoreText(entry.score) : entry.status}`)}" style="--dp-bar-height:${size}px">
            ${entry.score ? `<span class="dp-bar"><span class="dp-value">${entry.score.correct}/${entry.score.total}${data.percent ? ` · ${Math.round(ratio * 100)}%` : ''}</span><span class="dp-words">${wordsHtml(entry.words)}</span></span>`
            : `<span class="dp-observation"><strong>—</strong><span>${escape(entry.status)}</span>${wordsHtml(entry.words)}<small>No ${escape(label.toLowerCase())} score</small></span>`}</button><button type="button" class="dp-date" data-dp-check="${escape(entry.key)}" aria-expanded="${entry.key === state.selected}">${escape(dateText(entry.date))}</button></div>`;
        }).join('')}</div></div></div>` : '<p class="table-empty">No Section 8 records for this student and school year yet. Saved observations and confirmed assessments will appear here.</p>'}
      <p class="dp-note">Tap a bar or date for its full saved evidence. Scroll sideways for earlier or later checks. Unconfirmed totals are not zero scores.</p>
      ${data.entries.some(entry => entry.assessment && !Array.isArray(entry.assessment.assessedCategories)) ? '<p class="dp-note">Earlier snapshots retain their saved scores; they did not record category-by-category confirmation.</p>' : ''}
      ${data.recurring.length ? `<div class="dp-recurring"><strong>Recurring saved misses</strong> ${data.recurring.map(([word, count]) => `<span>${escape(word)} · ${count} recorded dates</span>`).join('')}</div>` : ''}</div>
      <div class="dp-history" ${state.view !== 'history' ? 'hidden' : ''}><h3>${escape(label)} history</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Lesson</th><th>Score</th><th>Saved items / evidence</th></tr></thead><tbody>${data.entries.slice().reverse().map(entry => `<tr><td><button type="button" class="dp-history-date" data-dp-check="${escape(entry.key)}" aria-expanded="${entry.key === state.selected}">${escape(dateText(entry.date))}</button></td><td>${escape(lessonLabel(entry))}</td><td>${escape(entry.score ? scoreText(entry.score) : 'Total unconfirmed')}</td><td><div class="dp-detail-words">${wordsHtml(entry.words)}</div>${entry.score ? '' : escape(entry.status)}</td></tr>`).join('') || '<tr><td colspan="4">No Section 8 evidence saved.</td></tr>'}</tbody></table></div></div>
      ${data.tags.length ? `<div class="dp-teacher-notes"><strong>Saved teacher observations</strong>${data.tags.map(tag => `<span>${escape(tag.label)} · ${tag.count} recorded dates</span>`).join('')}<button type="button" data-dp-notes>View supporting entries</button></div>` : ''}
      <section class="dp-details" aria-label="Selected saved check" ${selected ? '' : 'hidden'}>${detailsHtml(selected, input)}</section>`;
  }
  const api = { categories, day, observedDay, sameStudent, sameLesson, score, rows, model, render };
  root.TeachTodayDictationProfile = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
