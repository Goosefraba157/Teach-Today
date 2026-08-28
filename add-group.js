/**
 * Teach Today — New Group modal
 * Exposes create/edit group modals used by the Home screen.
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
  let pendingStudentIds = new Map();
  let pendingMoves = new Set();
  let pendingRenames = [];
  let editingStudentName = '';
  let editingGroupId = null;

  /* ── Public API ───────────────────────────────────────── */
  window.ttOpenNewGroupModal = function () {
    const modal = document.getElementById('ttNewGroupModal');
    if (!modal) return;

    editingGroupId = null;
    pendingStudents = [];
    pendingStudentIds = new Map();
    pendingMoves = new Set();
    pendingRenames = [];
    editingStudentName = '';
    document.getElementById('ttNgName').value = '';
    document.getElementById('ttNgTime').value = '';
    document.getElementById('ttNgNewStudent').value = '';
    document.getElementById('ttNgName').style.borderColor = '';

    populateSubstepSelect();
    document.getElementById('ttNgSubstep').value = '1.1';
    document.getElementById('ttNgLevel').value = 'AB';
    setModalMode(false);
    populateRosterSelect();
    renderStudentTags();

    modal.removeAttribute('hidden');
    setTimeout(() => document.getElementById('ttNgName')?.focus(), 60);
  };

  window.ttOpenEditGroupModal = function (groupId) {
    const modal = document.getElementById('ttNewGroupModal');
    const group = (typeof appState !== 'undefined' ? appState.groups : []).find(item => item.id === groupId);
    if (!modal || !group || group.schoolYearId !== appState.activeSchoolYearId) return;

    editingGroupId = group.id;
    pendingStudents = [...(group.students || [])];
    pendingStudentIds = new Map(pendingStudents.map(name => [name, studentIdForName(name, group)]));
    pendingMoves = new Set();
    pendingRenames = [];
    editingStudentName = '';
    document.getElementById('ttNgName').value = group.name || '';
    document.getElementById('ttNgTime').value = group.time || '';
    document.getElementById('ttNgNewStudent').value = '';
    document.getElementById('ttNgName').style.borderColor = '';
    populateSubstepSelect();
    document.getElementById('ttNgSubstep').value = group.substep || '1.1';
    document.getElementById('ttNgLevel').value = group.readerLevel || 'AB';
    setModalMode(true);
    populateRosterSelect();
    renderStudentTags();
    modal.removeAttribute('hidden');
    setTimeout(() => document.getElementById('ttNgName')?.focus(), 60);
  };

  function setModalMode(isEditing) {
    const dialog = document.querySelector('#ttNewGroupModal .tt-modal-card');
    const title = document.getElementById('ttNewGroupTitle');
    const submit = document.getElementById('ttNewGroupCreate');
    if (dialog) dialog.setAttribute('aria-label', isEditing ? 'Edit group' : 'Create a new group');
    if (title) title.textContent = isEditing ? 'Edit Group' : 'Create a New Group';
    if (submit) submit.textContent = isEditing ? 'Save Changes' : 'Create Group →';
  }

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
      .map(s => typeof s === 'string' ? { name: s } : s)
      .filter(student => student.name && !pendingStudents.some(name => name.toLowerCase() === student.name.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (roster.length === 0) {
      sel.innerHTML = '<option value="">No roster students yet</option>';
      sel.disabled  = true;
      if (addBtn) addBtn.disabled = true;
    } else {
      sel.innerHTML = roster.map(student => {
        const groups = currentGroupsForStudent(student.studentId, student.name)
          .filter(group => group.id !== editingGroupId)
          .map(group => group.name);
        const where = groups.length ? ` — ${groups.join(', ')}` : '';
        return `<option value="${esc(student.studentId || student.name)}" data-name="${esc(student.name)}">${esc(student.name + where)}</option>`;
      }).join('');
      sel.disabled  = false;
      if (addBtn) addBtn.disabled = false;
    }
    updateMoveButton();
  }

  /* ── Student chips ────────────────────────────────────── */
  function renderStudentTags() {
    const container = document.getElementById('ttNgStudentTags');
    if (!container) return;

    if (pendingStudents.length === 0) {
      container.innerHTML = '<span style="font-size:13px;color:#94a3b8;font-style:italic;">No students added yet — you can add them now or later.</span>';
      renderMembershipHistory();
      return;
    }

    container.innerHTML = pendingStudents
      .map(name => editingStudentName === name
        ? `<span class="tt-ng-student-tag editing">
          <input class="tt-ng-rename-input" data-rename-input="${esc(name)}" value="${esc(name)}" aria-label="New display name for ${esc(name)}">
          <button type="button" class="tt-ng-rename-save" data-rename-save="${esc(name)}">Save</button>
          <button type="button" data-rename-cancel="${esc(name)}" aria-label="Cancel name edit">×</button>
        </span>`
        :
        `<span class="tt-ng-student-tag">
          <span>${esc(name)}</span>
          <button type="button" class="tt-ng-rename" data-rename="${esc(name)}" aria-label="Edit ${esc(name)}'s display name" title="Edit display name">✎</button>
          <button type="button" data-remove="${esc(name)}" aria-label="Remove ${esc(name)}">×</button>
        </span>`
      )
      .join('');

    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentId = pendingStudentIds.get(btn.dataset.remove);
        pendingStudents = pendingStudents.filter(n => n !== btn.dataset.remove);
        pendingStudentIds.delete(btn.dataset.remove);
        if (studentId) pendingMoves.delete(studentId);
        renderStudentTags();
        populateRosterSelect();
      });
    });
    container.querySelectorAll('[data-rename]').forEach(btn => {
      btn.addEventListener('click', () => editStudentName(btn.dataset.rename));
    });
    container.querySelectorAll('[data-rename-save]').forEach(btn => {
      btn.addEventListener('click', () => commitStudentName(btn.dataset.renameSave));
    });
    container.querySelectorAll('[data-rename-cancel]').forEach(btn => {
      btn.addEventListener('click', () => { editingStudentName = ''; renderStudentTags(); });
    });
    container.querySelectorAll('[data-rename-input]').forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); commitStudentName(input.dataset.renameInput); }
        if (event.key === 'Escape') { event.preventDefault(); editingStudentName = ''; renderStudentTags(); }
      });
    });
    if (editingStudentName) setTimeout(() => container.querySelector('[data-rename-input]')?.focus(), 0);
    renderMembershipHistory();
  }

  function renderMembershipHistory() {
    document.getElementById('ttNgMembershipHistory')?.remove();
    if (!editingGroupId) return;
    const group = (appState.groups || []).find(item => item.id === editingGroupId);
    const ended = (group?.membershipHistory || []).filter(entry => entry.endedOn).slice().reverse();
    if (!ended.length) return;
    const details = document.createElement('details');
    details.id = 'ttNgMembershipHistory';
    details.className = 'tt-ng-membership-history';
    details.innerHTML = `<summary>Past membership (${ended.length})</summary><div>${ended.map(entry => {
      const profile = rosterProfileById(entry.studentId);
      const name = profile?.name || entry.displayNameAtStart || 'Student';
      const start = entry.approximateStart ? 'Before tracking' : entry.startedOn || 'Earlier';
      return `<p><strong>${esc(name)}</strong><span>${esc(start)} – ${esc(entry.endedOn)}</span></p>`;
    }).join('')}</div>`;
    document.getElementById('ttNgStudentTags')?.insertAdjacentElement('afterend', details);
  }

  function addStudent(name, studentId = '') {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (pendingStudents.some(n => n.toLowerCase() === trimmed.toLowerCase())) return;
    pendingStudents.push(trimmed);
    pendingStudentIds.set(trimmed, studentId || studentIdForName(trimmed));
    renderStudentTags();
    populateRosterSelect();
  }

  function editStudentName(oldName) {
    editingStudentName = oldName;
    renderStudentTags();
  }

  function commitStudentName(oldName) {
    const nextName = String(document.querySelector(`[data-rename-input="${cssEscape(oldName)}"]`)?.value || '').trim();
    if (!nextName || nextName === oldName) {
      editingStudentName = '';
      renderStudentTags();
      return;
    }
    if (pendingStudents.some(name => name !== oldName && name.toLowerCase() === nextName.toLowerCase())) {
      alert('That display name is already in this group.');
      return;
    }
    const studentId = pendingStudentIds.get(oldName) || studentIdForName(oldName);
    const duplicate = rosterProfileByName(nextName);
    if (duplicate && duplicate.studentId !== studentId) {
      alert('That display name belongs to another student. Choose a different name.');
      return;
    }
    pendingStudents = pendingStudents.map(name => name === oldName ? nextName : name);
    pendingStudentIds.delete(oldName);
    pendingStudentIds.set(nextName, studentId);
    if (studentId) pendingRenames.push({ studentId, oldName, nextName });
    editingStudentName = '';
    renderStudentTags();
    populateRosterSelect();
  }

  /* ── Create or update group ───────────────────────────── */
  function handleSave() {
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

    const typedStudent = document.getElementById('ttNgNewStudent')?.value.trim() || '';
    if (typedStudent) addStudent(typedStudent);

    const time    = document.getElementById('ttNgTime')?.value.trim() || '';
    const substep = document.getElementById('ttNgSubstep')?.value || '1.1';
    const level   = document.getElementById('ttNgLevel')?.value || 'AB';

    const existingGroup = editingGroupId
      ? appState.groups.find(item => item.id === editingGroupId)
      : null;
    const group = existingGroup || createGroup(name);
    const previousStudents = [...(group.students || [])];
    const previousStudentIds = previousStudents.map(studentName => studentIdForName(studentName, group)).filter(Boolean);

    pendingRenames.forEach(change => renameRosterProfile(change.studentId, change.nextName, change.oldName));
    group.name        = name;
    group.time        = time;
    group.substep     = substep;
    group.readerLevel = level;
    group.students    = [];

    // Add students; register new ones in the master roster
    appState.rosterStudents = appState.rosterStudents || [];
    const nextStudentIds = [];
    pendingStudents.forEach(studentName => {
      const profile = ensureRosterProfile(studentName, pendingStudentIds.get(studentName), name);
      group.students.push(profile.name);
      pendingStudentIds.set(profile.name, profile.studentId);
      nextStudentIds.push(profile.studentId);
    });

    group.studentIds = Object.fromEntries(group.students.map(studentName => [studentName, pendingStudentIds.get(studentName)]).filter(([, id]) => id));
    updateMembershipHistory(group, previousStudentIds, nextStudentIds, 'group edit');

    pendingMoves.forEach(studentId => {
      appState.groups
        .filter(other => other.id !== group.id && other.schoolYearId === group.schoolYearId)
        .forEach(other => {
          const priorIds = (other.students || []).map(studentName => studentIdForName(studentName, other)).filter(Boolean);
          if (!priorIds.includes(studentId)) return;
          other.students = (other.students || []).filter(studentName => studentIdForName(studentName, other) !== studentId);
          other.studentIds = Object.fromEntries(Object.entries(other.studentIds || {}).filter(([, id]) => id !== studentId));
          if (!other.students.includes(other.activeStudent)) other.activeStudent = other.students[0] || '';
          updateMembershipHistory(other, priorIds, priorIds.filter(id => id !== studentId), `moved permanently to ${group.id}`);
        });
    });
    if (!group.activeStudent || !group.students.includes(group.activeStudent)) {
      group.activeStudent = group.students[0] || '';
    }

    if (!existingGroup) {
      appState.groups = appState.groups || [];
      appState.groups.push(group);
    }
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
    pendingStudentIds = new Map();
    pendingMoves = new Set();
    pendingRenames = [];
    editingStudentName = '';
    editingGroupId = null;
  }

  /* ── Event wiring ─────────────────────────────────────── */
  function init() {
    const modal = document.getElementById('ttNewGroupModal');
    if (!modal) return;

    document.getElementById('ttNewGroupClose')?.addEventListener('click', closeModal);
    document.getElementById('ttNewGroupCancel')?.addEventListener('click', closeModal);
    document.getElementById('ttNewGroupCreate')?.addEventListener('click', handleSave);

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
      const option = sel?.selectedOptions?.[0];
      if (sel?.value && !sel.disabled) addStudent(option?.dataset.name || option?.textContent || '', rosterProfileById(sel.value)?.studentId || '');
    });

    document.getElementById('ttNgMoveFromRoster')?.addEventListener('click', () => {
      const sel = document.getElementById('ttNgRoster');
      const option = sel?.selectedOptions?.[0];
      if (!sel?.value || sel.disabled) return;
      const profile = rosterProfileById(sel.value) || rosterProfileByName(option?.dataset.name || '');
      const studentName = profile?.name || option?.dataset.name || '';
      if (!studentName) return;
      addStudent(studentName, profile?.studentId || '');
      if (profile?.studentId) pendingMoves.add(profile.studentId);
      renderStudentTags();
    });

    document.getElementById('ttNgRoster')?.addEventListener('change', updateMoveButton);

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
        if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
      });
      document.getElementById(id)?.addEventListener('input', () => {
        document.getElementById(id).style.borderColor = '';
      });
    });
  }

  function rosterProfileById(studentId) {
    return (appState.rosterStudents || []).map(value => typeof value === 'string' ? { name: value } : value)
      .find(student => student.studentId === studentId) || null;
  }

  function rosterProfileByName(name) {
    const normalized = String(name || '').trim().toLowerCase();
    return (appState.rosterStudents || []).map(value => typeof value === 'string' ? { name: value } : value)
      .find(student => [student.name, student.displayName, student.fullName, ...(student.aliases || [])].filter(Boolean).some(value => String(value).trim().toLowerCase() === normalized)) || null;
  }

  function studentIdForName(name, group = null) {
    return group?.studentIds?.[name] || rosterProfileByName(name)?.studentId || '';
  }

  function currentGroupsForStudent(studentId, name = '') {
    return (appState.groups || []).filter(group => group.schoolYearId === appState.activeSchoolYearId
      && (group.students || []).some(studentName => studentId
        ? studentIdForName(studentName, group) === studentId
        : studentName.toLowerCase() === String(name).toLowerCase()));
  }

  function ensureRosterProfile(name, studentId = '', school = '') {
    let profile = (studentId && rosterProfileById(studentId)) || rosterProfileByName(name);
    if (profile) return profile;
    profile = {
      name,
      fullName: name,
      displayName: name,
      studentId: typeof privateRandomId === 'function' ? privateRandomId('stu') : `stu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      school,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    appState.rosterStudents.push(profile);
    return profile;
  }

  function renameRosterProfile(studentId, nextName, fallbackOldName = '') {
    const profile = rosterProfileById(studentId) || rosterProfileByName(fallbackOldName);
    if (!profile) return;
    const oldName = profile.name || fallbackOldName;
    profile.aliases = [...new Set([...(profile.aliases || []), oldName].filter(Boolean))];
    (appState.masterRecords || []).forEach(record => {
      if (!record.studentId && [record.student, record.studentName].some(name => String(name || '').trim().toLowerCase() === oldName.toLowerCase())) {
        record.studentId = studentId;
      }
    });
    (appState.groups || []).forEach(group => {
      ['dictationMisses', 'encodingObservations', 'markedReviewWords'].forEach(key => {
        (group[key] || []).forEach(record => {
          if (!record.studentId && String(record.student || '').trim().toLowerCase() === oldName.toLowerCase()) record.studentId = studentId;
        });
      });
    });
    profile.name = nextName;
    profile.displayName = nextName;
    if (!profile.fullName || profile.fullName === oldName) profile.fullName = nextName;
    (appState.groups || []).forEach(group => {
      const oldKeys = Object.entries(group.studentIds || {}).filter(([, id]) => id === studentId).map(([name]) => name);
      group.students = (group.students || []).map(name => oldKeys.includes(name) || name === oldName ? nextName : name);
      oldKeys.forEach(name => delete group.studentIds[name]);
      if (group.students.includes(nextName)) group.studentIds[nextName] = studentId;
      if (group.activeStudent === oldName || oldKeys.includes(group.activeStudent)) group.activeStudent = nextName;
    });
    appState.studentNameChanges ||= [];
    appState.studentNameChanges.push({ id: `name-change-${Date.now()}-${Math.random().toString(36).slice(2)}`, studentId, from: oldName, to: nextName, changedAt: new Date().toISOString() });
  }

  function updateMembershipHistory(group, beforeIds, afterIds, reason) {
    const today = new Date().toISOString().slice(0, 10);
    const before = new Set(beforeIds.filter(Boolean));
    const after = new Set(afterIds.filter(Boolean));
    group.membershipHistory = Array.isArray(group.membershipHistory) ? group.membershipHistory : [];
    before.forEach(studentId => {
      if (after.has(studentId)) return;
      const active = group.membershipHistory.slice().reverse().find(entry => entry.studentId === studentId && !entry.endedOn);
      if (active) {
        active.endedOn = today;
        active.endReason = reason;
      }
    });
    after.forEach(studentId => {
      if (before.has(studentId)) return;
      const profile = rosterProfileById(studentId);
      group.membershipHistory.push({
        id: typeof privateRandomId === 'function' ? privateRandomId('membership') : `membership_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        studentId,
        displayNameAtStart: profile?.name || 'Student',
        startedOn: today,
        reason
      });
    });
  }

  function updateMoveButton() {
    const button = document.getElementById('ttNgMoveFromRoster');
    const select = document.getElementById('ttNgRoster');
    if (!button || !select) return;
    const option = select.selectedOptions?.[0];
    const profile = rosterProfileById(select.value) || rosterProfileByName(option?.dataset.name || '');
    const groups = profile ? currentGroupsForStudent(profile.studentId, profile.name).filter(group => group.id !== editingGroupId) : [];
    button.hidden = !groups.length;
    button.disabled = !groups.length;
    button.textContent = groups.length ? `Move here from ${groups.map(group => group.name).join(', ')}` : 'Move here permanently';
  }

  /* ── HTML escape ──────────────────────────────────────── */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cssEscape(value) {
    if (globalThis.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
