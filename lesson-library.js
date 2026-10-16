/* Private read-only lesson library. Contains no roster or classroom defaults. */
(function (root) {
  const yearOf = (group, plan, lesson) => lesson?.schoolYearId || plan?.schoolYearId || group.schoolYearId || '';
  const startDate = (plan, lesson) => lesson.lessonStartDate || plan.lessonStartDate || plan.sessions?.['1']?.date || plan.scheduledDate || lesson.scheduledDate || '';
  const planIds = (plan) => new Set([plan.id, plan.hostPlanId].filter(Boolean));
  function linked(record, plan, lesson) {
    if (record.lessonId) return record.lessonId === lesson.id;
    return (plan.lessons || []).length === 1 && record.planId && planIds(plan).has(record.planId);
  }
  function studentLink(state, group, plan, lesson, studentId) {
    const ids = planIds(plan);
    const sessions = (state.groups || []).flatMap(g => Object.values(state.attendanceSessions?.[g.id] || {}))
      .filter(s => s.status === 'confirmed' && [...(s.planIds || []), ...(s.combinedPlanIds || []), s.planId].some(id => ids.has(id))
        && ((plan.lessons || []).length === 1 || (s.lessonIds || []).includes(lesson.id)));
    const present = sessions.some(s => s.attendanceByStudentId?.[studentId] === true);
    const absent = sessions.some(s => s.attendanceByStudentId?.[studentId] === false);
    if (present) return absent ? 'Confirmed present; a linked session also records absence' : 'Confirmed present';
    const records = [...(state.masterRecords || []), ...(group.chartResults || []), ...(group.dictationRecords || []), ...(group.dictationMisses || []), ...(group.encodingObservations || [])];
    if (records.some(r => r.studentId === studentId && linked(r, plan, lesson))) return 'Linked student evidence';
    if (absent) return 'Confirmed absent';
    if ((plan.participantStudentIds || []).includes(studentId) || (plan.rosterSnapshot || []).some(r => r.studentId === studentId)) return 'Saved lesson participant — attendance unconfirmed';
    return '';
  }
  function entries(state, options = {}) {
    const year = options.year || state.activeSchoolYearId;
    const rows = [];
    (state.groups || []).filter(g => !options.groupId || g.id === options.groupId).forEach(group => {
      (group.history || []).forEach(plan => {
        if (plan.excludedFromLessonSequence || plan.status === 'Test') return;
        (plan.lessons || []).forEach((lesson, lessonIndex) => {
          if (yearOf(group, plan, lesson) !== year) return;
          if (options.status && options.status !== 'all' && (options.status === 'completed' ? plan.status !== 'Complete' : plan.status === 'Complete')) return;
          const participation = options.studentId ? studentLink(state, group, plan, lesson, options.studentId) : '';
          if (options.studentId && !participation) return;
          rows.push({ group, plan, lesson, lessonIndex, participation, date: startDate(plan, lesson), key: `${group.id}|${plan.id}|${lessonIndex}` });
        });
      });
    });
    // In all-group/student views, show a combined lesson once if its host is
    // available in the actual filtered results. Keep an orphan participant copy.
    const hostIds = new Set(rows.filter(r => !r.plan.combinedParticipation).map(r => r.plan.id));
    return rows.filter(r => options.groupId || !r.plan.combinedParticipation || !hostIds.has(r.plan.hostPlanId))
      .sort((a,b) => b.date.localeCompare(a.date) || a.group.name.localeCompare(b.group.name, undefined, {numeric:true}) || Number(b.lesson.lessonSequence || b.plan.lessonNumber || 0) - Number(a.lesson.lessonSequence || a.plan.lessonNumber || 0));
  }
  function students(state, options = {}) {
    const year = options.year || state.activeSchoolYearId;
    const groups = (state.groups || []).filter(g => (!options.groupId || g.id === options.groupId)
      && (g.schoolYearId === year || (g.history || []).some(p => (p.lessons || []).some(l => yearOf(g,p,l) === year))));
    const names = new Map((state.rosterStudents || []).filter(r => r.studentId).map(r => [r.studentId, r.displayName || r.name || r.fullName || 'Student']));
    const result = new Map();
    const add = (id,name) => { if (id) result.set(id,{id,name:names.get(id) || name || 'Student'}); };
    groups.forEach(g => {
      Object.entries(g.studentIds || {}).forEach(([name,id]) => add(id,name));
      (g.membershipHistory || []).forEach(r => add(r.studentId,r.displayNameAtStart));
    });
    entries(state,{year:options.year,groupId:options.groupId}).forEach(({plan}) => {
      (plan.rosterSnapshot || []).forEach(r => add(r.studentId,r.name));
      (plan.participantStudentIds || []).forEach(id => add(id));
    });
    // Evidence-linked students can remain discoverable after a permanent move.
    const lessonRows = entries(state,{year:options.year,groupId:options.groupId});
    const records = [...(state.masterRecords || []), ...groups.flatMap(g => [...(g.chartResults || []), ...(g.dictationRecords || []), ...(g.dictationMisses || []), ...(g.encodingObservations || [])])];
    records.forEach(r => { if (r.studentId && lessonRows.some(row => linked(r,row.plan,row.lesson))) add(r.studentId,r.student); });
    return [...result.values()].sort((a,b) => a.name.localeCompare(b.name));
  }
  function documentFor(state, row) {
    if (!row.plan.combinedParticipation || !row.plan.hostPlanId) return row;
    const group = (state.groups || []).find(g => g.id === row.plan.hostGroupId);
    const plan = (group?.history || []).find(p => p.id === row.plan.hostPlanId);
    if (!plan?.lessons?.length) return row;
    const index = plan.lessons.findIndex(lesson => lesson.id === row.lesson.id);
    if (index < 0 && plan.lessons.length !== 1) return row;
    return {group,plan,lessonIndex:index < 0 ? 0 : index};
  }
  root.TeachTodayLessonLibrary = { entries, students, documentFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TeachTodayLessonLibrary;
})(typeof window !== 'undefined' ? window : globalThis);
