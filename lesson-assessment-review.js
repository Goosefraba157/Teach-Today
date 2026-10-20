/* New Section 8 scores require an explicit review. Existing evidence is read-only. */
(function (root) {
  const sameLesson = (record, lesson, plan) => record.lessonId && lesson?.id
    ? record.lessonId === lesson.id
    : Boolean(plan?.id && record.planId === plan.id && (!Array.isArray(plan.lessons) || plan.lessons.length <= 1));
  const sameStudent = (record, entry) => record.studentId && entry.studentId
    ? record.studentId === entry.studentId
    : Boolean(entry.name) && record.student === entry.name;
  const observationsForGroup = group => (group?.encodingObservations || []).concat((group?.dictationMisses || [])
    .map(record => ({ ...record, section: record.section || 'section8', observationKind: 'missed-item' })));

  function model({ group, lesson, plan, entries = [], session } = {}) {
    const assessments = group?.dictationAssessments || [];
    const observations = observationsForGroup(group);
    const used = lesson?.completedSections?.section8 === 'done'
      || lesson?.sectionProgress?.section8?.state === 'inprogress'
      || observations.some(record => record.section === 'section8' && sameLesson(record, lesson, plan));
    const seen = new Set();
    const rows = entries.filter(entry => {
      if (!entry.studentId || seen.has(entry.studentId)) return false;
      seen.add(entry.studentId);
      return true;
    }).map(entry => {
      const attendance = session?.status === 'confirmed'
        ? session.attendanceByStudentId?.[entry.studentId] ?? session.attendance?.[entry.name]
        : undefined;
      const existing = assessments.some(record => sameLesson(record, lesson, plan) && sameStudent(record, entry));
      return { ...entry, existing, absent: attendance === false, present: attendance === true,
        checked: existing || attendance === true, disabled: existing || attendance === false };
    });
    const reviewedAt = lesson?.section8Review?.at || '';
    const laterActivity = observations.some(record => record.section === 'section8'
      && sameLesson(record, lesson, plan) && record.date > reviewedAt);
    return { needed: Boolean(used && (!reviewedAt || laterActivity) && rows.some(row => !row.existing)), rows };
  }

  function apply({ group, lesson, plan, entries, session, categories, selectedIds = [], assessedCategoriesByStudent, sessionDate, at = new Date().toISOString() }) {
    const review = model({ group, lesson, plan, entries, session });
    const selected = new Set(selectedIds);
    const observations = observationsForGroup(group);
    const records = [];
    review.rows.filter(row => selected.has(row.studentId) && !row.absent && !row.existing).forEach(row => {
      const detachedCategories = JSON.parse(JSON.stringify(categories || {}));
      const assessedCategories = Object.keys(detachedCategories).filter(category => detachedCategories[category].length
        && (!assessedCategoriesByStudent || (assessedCategoriesByStudent[row.studentId] || []).includes(category)));
      if (!assessedCategories.length) return;
      const missesByCategory = {};
      Object.entries(detachedCategories).forEach(([category, items]) => {
        const allowed = new Set(items.map(item => String(item).toLocaleLowerCase()));
        missesByCategory[category] = [...new Set(observations
          .filter(record => record.section === 'section8' && sameLesson(record, lesson, plan)
            && sameStudent(record, row) && record.category === category && record.item
            && (record.observationKind === 'missed-item' || record.note === 'encoding miss' || !record.observationKind)
            && allowed.has(String(record.item).toLocaleLowerCase()))
          .map(record => record.item))];
      });
      records.push({ id: `dictation-assessment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: at, sessionDate: session?.status === 'confirmed' ? sessionDate || '' : '', student: row.name, studentId: row.studentId,
        schoolYearId: group.schoolYearId || '', groupIdAtTime: group.id,
        lessonId: lesson.id, planId: plan.id, lessonNumber: plan.lessonNumber || 0,
        substep: lesson.substep || group.substep, categories: detachedCategories, missesByCategory, assessedCategories,
        assessmentStatus: 'assessed', assessmentSource: 'lesson-finish-review' });
    });
    if (records.length) {
      group.dictationAssessments ||= [];
      group.dictationAssessments.push(...records);
    }
    lesson.section8Review = { at, assessedStudentIds: review.rows
      .filter(row => row.existing || records.some(record => record.studentId === row.studentId)).map(row => row.studentId) };
    return records.length;
  }

  const api = { model, apply, sameLesson, sameStudent };
  root.TeachTodayAssessmentReview = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
