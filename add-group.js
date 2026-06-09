/**
 * Teach Today — New Group modal
 * Exposes window.ttOpenNewGroupModal() called by teach-today.js when
 * the user clicks the "+" card on the Home screen.
 *
 * NOTE: scopeMap and appState are declared with const/let in app.js so
 * they are NOT window properties. Reference them as bare globals.
 * createGroup, saveState, render, ttRenderHomeScreen are function
 * declarations so they ARE accessible as window properties (used via
 * direct name here for consistency).
 */
/* global scopeMap, appState, createGroup, saveState, render, ttRenderHomeScreen */
(function () {
  'use strict';

  let pendingStudents = [];

  /* ── Public API ───────────────────────────────────────── */
  window.ttOpenNewGroupModal = function () {
    const modal = document.getElementById('ttNewGroupModal');
    if (!modal) return;

    // Reset state
    pendingStudents = [];
    document.getElementById('ttNgName').value = '';
    document.getElementById('ttNgTime').value = '';
    document.getElementById('ttNgNewStudent').value = '';
    document.getElementById('ttNgName').style.borderColor = '';

    populateSubstepSelect();
    populateRosterSelect();
    renderStudentTags();

    modal.removeAttribute('hidden');
    setTimeout(() => document.getElementById('ttNgName')?.focus(), 60);
  };

  /* ── Substep select ───────────────────────────────────── */
  function populateSubstepSelect() {
    const sel = document.getElementById('ttNgSubstep');
    if (!sel) return;
    // scopeMap is a global const — not a window property
    if (typeof scopeMap === 'undefined' || !scopeMap.length) {
      sel.innerHTML = '<option value="1.1">1.1</option>';
      return;
    }
    sel.innerHTML = scopeMap
      .map(s => `<option value="${esc(s.id)}">${esc(s.id)}${s.title ? ' — ' + esc(s.title) : ''}</option>`)
      .join('');
  }

  /* ── Roster select ────────────────────────────────────── */
  function populateRosterSelect() {
    const sel    = document.getElementById('ttNgRoster');
    const addBtn = document.getElementById('ttNgAddFromRoster');
    if (!sel) return;

    // appState is a global let — not a window property
    const rosterRaw = (typeof appState !== 'undefined' ? appState.rosterStudents : null) || [];
    const roster = rosterRaw
      .map(s => (typeof s === 'string' ? s : s.name) || '')
      .filter(n => n && !pendingStudents.includes(n))
      .sort((a, b) => a.localeCompare(b));

    if (roster.length === 0) {
      sel.innerHTML = '<option value="">No roster students yet</option>';
      sel.disabled  = true;
      if (addBtn) addBtn.disabled = true;
    } else {
      sel.innerHTML = roster.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
      sel.disabled  = false;
      if (addBtn) addBtn.disabled = false;
    }
  }

  /* ── Student chips ────────────────────────────────────── */
  function renderStudentTags() {
    const container = document.getElementById('ttNgStudentTags');
    if (!container) return;

    if (pendingStudents.length === 0) {
      container.innerHTML = '<span style="font-size:13px;color:#94a3b8;font-style:italic;">No students added yet — you can add them now or later.</span>';
      return;
    }

    container.innerHTML = pendingStudents
      .map(name =>
        `<span class="tt-ng-student-tag">
          ${esc(name)}
          <button type="button" data-remove="${esc(name)}" aria-label="Remove ${esc(name)}">×</button>
        </span>`
      )
      .join('');

    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingStudents = pendingStudents.filter(n => n !== btn.dataset.remove);
        renderStudentTags();
        populateRosterSelect();
      });
    });
  }

  function addStudent(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (pendingStudents.some(n => n.toLowerCase() === trimmed.toLowerCase())) return;
    pendingStudents.push(trimmed);
    renderStudentTags();
    populateRosterSelect();
  }

  /* ── Create group ─────────────────────────────────────── */
  function handleCreate() {
    const nameInput = document.getElementById('ttNgName');
    const name = nameInput?.value.trim();

    if (!name) {
      nameInput.style.borderColor = '#ef4444';
      nameInput.focus();
      return;
    }

    if (typeof createGroup !== 'function' || typeof appState === 'undefined' || typeof saveState !== 'function') {
      alert('App not ready yet — please try again in a moment.');
      return;
    }

    const time    = document.getElementById('ttNgTime')?.value.trim() || '';
    const substep = document.getElementById('ttNgSubstep')?.value || '1.1';
    const level   = document.getElementById('ttNgLevel')?.value || 'AB';

    const group       = createGroup(name);
    group.time        = time;
    group.substep     = substep;
    group.readerLevel = level;

    // Add students; register new ones in the master roster
    appState.rosterStudents = appState.rosterStudents || [];
    pendingStudents.forEach(studentName => {
      group.students.push(studentName);
      const inRoster = appState.rosterStudents.some(
        s => (typeof s === 'string' ? s : s.name || '').toLowerCase() === studentName.toLowerCase()
      );
      if (!inRoster) {
        appState.rosterStudents.push({ name: studentName, school: name });
      }
    });

    if (group.students.length > 0) group.activeStudent = group.students[0];

    appState.groups = appState.groups || [];
    appState.groups.push(group);
    appState.selectedGroupId = group.id;
    saveState();

    // Re-render
    if (typeof render === 'function') render();
    if (typeof ttRenderHomeScreen === 'function') ttRenderHomeScreen();

    closeModal();

    // Scroll new card into view
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-home-group="' + group.id + '"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  /* ── Modal close ──────────────────────────────────────── */
  function closeModal() {
    const modal = document.getElementById('ttNewGroupModal');
    if (modal) modal.setAttribute('hidden', '');
    pendingStudents = [];
  }

  /* ── Event wiring ─────────────────────────────────────── */
  function init() {
    const modal = document.getElementById('ttNewGroupModal');
    if (!modal) return;

    document.getElementById('ttNewGroupClose')?.addEventListener('click', closeModal);
    document.getElementById('ttNewGroupCancel')?.addEventListener('click', closeModal);
    document.getElementById('ttNewGroupCreate')?.addEventListener('click', handleCreate);

    // Backdrop click
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.classList.contains('tt-modal-backdrop')) closeModal();
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (!modal.hasAttribute('hidden') && e.key === 'Escape') closeModal();
    });

    // Add from roster button
    document.getElementById('ttNgAddFromRoster')?.addEventListener('click', () => {
      const sel = document.getElementById('ttNgRoster');
      if (sel?.value && !sel.disabled) addStudent(sel.value);
    });

    // Add new student button
    document.getElementById('ttNgAddNew')?.addEventListener('click', () => {
      const input = document.getElementById('ttNgNewStudent');
      if (input?.value.trim()) {
        addStudent(input.value);
        input.value = '';
        input.focus();
      }
    });

    // Enter in new-student field triggers add
    document.getElementById('ttNgNewStudent')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ttNgAddNew')?.click(); }
    });

    // Enter in name or time field submits the form
    ['ttNgName', 'ttNgTime'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
      });
      document.getElementById(id)?.addEventListener('input', () => {
        document.getElementById(id).style.borderColor = '';
      });
    });
  }

  /* ── HTML escape ──────────────────────────────────────── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
