/* Lesson progress only. This helper never creates student or attendance evidence. */
(function (root) {
  const sectionIds = Object.freeze([
    'section1', 'section2', 'section3', 'section4', 'section5',
    'section1b', 'section2b', 'section6', 'section7', 'section8',
    'section9', 'section10'
  ]);
  const validSections = new Set(sectionIds);
  const terminalStatuses = new Set(['complete', 'incomplete', 'test']);
  const objectMap = value => value && typeof value === 'object' && !Array.isArray(value);

  function canTrack({ group, lesson, plan, activeSchoolYearId, homeMode } = {}) {
    if (homeMode || !group?.id || !lesson?.id || !plan?.id || !activeSchoolYearId) return false;
    if (group.schoolYearId !== activeSchoolYearId) return false;
    if ([plan.schoolYearId, lesson.schoolYearId].some(year => year && year !== activeSchoolYearId)) return false;
    if (plan.source !== 'TeachToday' || plan.excludedFromLessonSequence || plan.readOnly || plan.combinedParticipation) return false;
    if (terminalStatuses.has(String(plan.status || '').trim().toLowerCase())) return false;
    if (group.activeLessonPlanId && group.activeLessonPlanId !== plan.id) return false;
    if (lesson.savedPlanId !== plan.id || !(plan.lessons || []).some(saved => saved?.id === lesson.id)) return false;
    if ([plan.groupIdAtTime, plan.hostGroupId].some(id => id && id !== group.id)) return false;
    return (group.history || []).some(saved => saved?.id === plan.id
      && (saved.lessons || []).some(item => item?.id === lesson.id));
  }

  function status(lesson, sectionId) {
    const legacy = lesson?.completedSections?.[sectionId];
    // Existing completion remains the compatibility authority; reading never
    // backfills metadata or changes a historical lesson.
    if (legacy === 'done' || legacy === 'skipped') return legacy;
    return lesson?.sectionProgress?.[sectionId]?.state === 'inprogress' ? 'inprogress' : 'unmarked';
  }

  function timestamp(at) {
    const date = at === undefined ? new Date() : new Date(at);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function mark(lesson, sectionId, { source, at, manual = false, state = 'done' } = {}) {
    if (!objectMap(lesson) || !validSections.has(sectionId)) return false;
    const next = state === null || state === 'unmarked' ? 'unmarked' : state;
    if (!['done', 'skipped', 'unmarked'].includes(next)) return false;
    const prior = lesson.sectionProgress?.[sectionId] || {};
    const current = status(lesson, sectionId);
    if (!manual && (current === 'skipped' || (prior.manualOverride && prior.state === 'unmarked'))) return false;
    if (current === next && (next !== 'unmarked' || !manual || prior.manualOverride)) return false;
    const now = timestamp(at);
    if (!now) return false;

    const entry = { state: next, source: String(source || (manual ? 'manual' : 'next')) };
    if (prior.startedAt) entry.startedAt = prior.startedAt;
    if (next === 'done') {
      entry.startedAt ||= now;
      entry.completedAt = now;
    }
    if (manual) entry.manualOverride = true;
    if (!objectMap(lesson.sectionProgress)) lesson.sectionProgress = {};
    lesson.sectionProgress[sectionId] = entry;
    if (next === 'unmarked') {
      if (objectMap(lesson.completedSections)) delete lesson.completedSections[sectionId];
    } else {
      if (!objectMap(lesson.completedSections)) lesson.completedSections = {};
      lesson.completedSections[sectionId] = next;
    }
    return true;
  }

  function activity(lesson, sectionId, { at } = {}) {
    if (!objectMap(lesson) || !validSections.has(sectionId)) return false;
    if (status(lesson, sectionId) !== 'unmarked' || lesson.sectionProgress?.[sectionId]?.manualOverride) return false;
    const now = timestamp(at);
    if (!now) return false;
    if (!objectMap(lesson.sectionProgress)) lesson.sectionProgress = {};
    lesson.sectionProgress[sectionId] = { state: 'inprogress', source: 'activity', startedAt: now };
    return true;
  }

  function summary(lesson) {
    const result = { statuses: {}, done: [], skipped: [], inprogress: [], unmarked: [] };
    sectionIds.forEach(id => {
      const state = status(lesson, id);
      result.statuses[id] = state;
      result[state].push(id);
    });
    return result;
  }

  root.TeachTodayLessonProgress = { canTrack, mark, activity, summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TeachTodayLessonProgress;
})(typeof window !== 'undefined' ? window : globalThis);
