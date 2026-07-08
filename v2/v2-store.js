(function () {
  "use strict";

  const STORAGE_KEY = "teachToday.v2.state";
  const SCHEMA_VERSION = "v2.0.0";
  const MVP_TEMPLATE_ID = "template_step_3_1_mvp";
  const DEMO_TEACHER_ID = "teacher_demo_001";
  const DEMO_GROUP_ID = "group_step31_demo";
  const ACTIVITY_TYPES = [
    "soundReview",
    "wordReading",
    "wordCards",
    "spelling",
    "dictation",
    "sentenceReading",
    "passageReading",
    "comprehension",
    "custom"
  ];
  const DELIVERY_MODES = ["teacher-led", "student-independent", "teacher-reviewed"];
  const LEGACY_ACTIVITY_TYPE_MAP = {
    syllableScoop: "wordReading",
    wordCardRead: "wordCards",
    tileBuild: "spelling",
    typedDictation: "dictation",
    passageReadRecord: "passageReading"
  };
  const COLLECTIONS = [
    "teachers",
    "groups",
    "students",
    "curriculum",
    "lessonTemplates",
    "lessonPlans",
    "assignments",
    "studentAttempts",
    "evidenceRecords",
    "teacherReviewItems",
    "masteryStatuses",
    "masteryDecisions"
  ];

  function nowIso() {
    return new Date().toISOString();
  }

  function todayIsoDate() {
    return nowIso().slice(0, 10);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function objectValues(record) {
    return Object.values(record || {});
  }

  function makeId(prefix) {
    const random = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${Date.now().toString(36)}_${random}`;
  }

  function masteryStatusId(studentId, step, substep) {
    return `mastery_${studentId}_${String(step).replace(/\W+/g, "_")}_${String(substep).replace(/\W+/g, "_")}`;
  }

  function buildLessonItems() {
    return {
      item_step31_word_001: {
        id: "item_step31_word_001",
        type: "word",
        text: "sample",
        displayText: "sample",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder item",
        itemType: "word",
        skillTag: "syllableDivision",
        conceptTag: "multisyllabic-placeholder",
        difficulty: "intro",
        expectedAnswer: "sample",
        wordPattern: "multisyllabic-placeholder",
        decodingTarget: "read and divide a two-syllable word",
        encodingTarget: "",
        expectedMarking: ["scoop"],
        masteryImpact: true,
        reviewTag: "current"
      },
      item_step31_word_002: {
        id: "item_step31_word_002",
        type: "word",
        text: "sunlit",
        displayText: "sunlit",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder item",
        itemType: "word",
        skillTag: "syllableDivision",
        conceptTag: "compound-placeholder",
        difficulty: "intro",
        expectedAnswer: "sunlit",
        wordPattern: "compound-placeholder",
        decodingTarget: "read by syllable parts",
        encodingTarget: "",
        expectedMarking: ["scoop"],
        masteryImpact: true,
        reviewTag: "current"
      },
      item_step31_word_003: {
        id: "item_step31_word_003",
        type: "word",
        text: "unlock",
        displayText: "unlock",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder item",
        itemType: "word",
        skillTag: "prefixReview",
        conceptTag: "prefix-placeholder",
        difficulty: "review",
        expectedAnswer: "unlock",
        wordPattern: "prefix-placeholder",
        decodingTarget: "identify prefix and base",
        encodingTarget: "spell known parts",
        expectedMarking: ["prefix", "base"],
        masteryImpact: true,
        reviewTag: "review"
      },
      item_step31_dictation_001: {
        id: "item_step31_dictation_001",
        type: "dictationWord",
        text: "magnet",
        displayText: "magnet",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder item",
        itemType: "dictationWord",
        skillTag: "encoding",
        conceptTag: "multisyllabic-placeholder",
        difficulty: "intro",
        expectedAnswer: "magnet",
        wordPattern: "multisyllabic-placeholder",
        decodingTarget: "",
        encodingTarget: "type the dictated word",
        expectedMarking: ["scoop"],
        masteryImpact: true,
        reviewTag: "current"
      },
      item_step31_sentence_001: {
        id: "item_step31_sentence_001",
        type: "sentence",
        text: "The class can solve the problem.",
        displayText: "The class can solve the problem.",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder sentence",
        itemType: "sentence",
        skillTag: "sentenceReading",
        conceptTag: "controlled-sentence-placeholder",
        difficulty: "transfer",
        expectedAnswer: "The class can solve the problem.",
        wordPattern: "controlled-sentence-placeholder",
        decodingTarget: "read sentence for accuracy and phrasing",
        encodingTarget: "sentence dictation placeholder",
        expectedMarking: ["phrase"],
        masteryImpact: true,
        reviewTag: "transfer"
      },
      item_step31_passage_001: {
        id: "item_step31_passage_001",
        type: "passageRef",
        text: "step31-passage-placeholder",
        displayText: "Step 3.1 passage placeholder",
        sourceRef: "mvp-placeholder",
        sourceNote: "MVP placeholder passage reference",
        itemType: "passageRef",
        skillTag: "passageReading",
        conceptTag: "connected-text-placeholder",
        difficulty: "transfer",
        expectedAnswer: "",
        wordPattern: "connected-text-placeholder",
        decodingTarget: "read controlled text and retell",
        encodingTarget: "",
        expectedMarking: ["scoop", "phrase"],
        masteryImpact: false,
        reviewTag: "transfer"
      }
    };
  }

  function buildTemplateParts(items) {
    return [
      {
        id: "part_1",
        partNumber: 1,
        name: "Sound Review",
        skillTypes: ["soundSymbol", "review"],
        teacherMode: "guided",
        deliveryMode: "teacher-led",
        studentAssignable: false,
        estimatedMinutes: 3,
        activityType: "soundReview",
        suggestedActivityType: "soundReview",
        instructions: "Teacher-led placeholder sound review.",
        masteryImpact: false,
        reviewRequired: false,
        items: []
      },
      {
        id: "part_2",
        partNumber: 2,
        name: "Multisyllabic Word Reading",
        skillTypes: ["decoding", "syllableDivision", "wordMarking"],
        teacherMode: "guided",
        deliveryMode: "student-independent",
        studentAssignable: true,
        estimatedMinutes: 8,
        activityType: "wordReading",
        suggestedActivityType: "wordReading",
        instructions: "Read each placeholder word and show the syllable split.",
        masteryImpact: true,
        reviewRequired: true,
        items: [items.item_step31_word_001, items.item_step31_word_002, items.item_step31_word_003]
      },
      {
        id: "part_3",
        partNumber: 3,
        name: "Word Cards",
        skillTypes: ["wordCards", "automaticity"],
        teacherMode: "guided",
        deliveryMode: "student-independent",
        studentAssignable: true,
        estimatedMinutes: 4,
        activityType: "wordCards",
        suggestedActivityType: "wordCardRead",
        instructions: "Practice current and review word cards.",
        masteryImpact: true,
        reviewRequired: false,
        items: [items.item_step31_word_001, items.item_step31_word_002, items.item_step31_word_003]
      },
      {
        id: "part_7",
        partNumber: 7,
        name: "Word Building",
        skillTypes: ["encoding", "wordBuilding"],
        teacherMode: "guided",
        deliveryMode: "teacher-reviewed",
        studentAssignable: true,
        estimatedMinutes: 6,
        activityType: "spelling",
        suggestedActivityType: "spelling",
        instructions: "Build placeholder words from parts, then check with the teacher.",
        masteryImpact: true,
        reviewRequired: true,
        items: [items.item_step31_word_003, items.item_step31_dictation_001]
      },
      {
        id: "part_8",
        partNumber: 8,
        name: "Typed Dictation",
        skillTypes: ["encoding", "dictation", "proofreading"],
        teacherMode: "guided",
        deliveryMode: "teacher-reviewed",
        studentAssignable: true,
        estimatedMinutes: 8,
        activityType: "dictation",
        suggestedActivityType: "dictation",
        instructions: "Type dictated placeholder words or sentences.",
        masteryImpact: true,
        reviewRequired: true,
        items: [items.item_step31_dictation_001, items.item_step31_sentence_001]
      },
      {
        id: "part_9",
        partNumber: 9,
        name: "Reading And Retell",
        skillTypes: ["fluency", "comprehension"],
        teacherMode: "guided",
        deliveryMode: "teacher-reviewed",
        studentAssignable: true,
        estimatedMinutes: 10,
        activityType: "passageReading",
        suggestedActivityType: "passageReading",
        instructions: "Read placeholder connected text and prepare a brief retell.",
        masteryImpact: false,
        reviewRequired: true,
        items: [items.item_step31_passage_001]
      }
    ];
  }

  function normalizeLessonItem(item, index = 0) {
    const base = item && typeof item === "object" ? item : {};
    const text = String(base.text ?? base.displayText ?? "").trim();
    return {
      id: base.id || makeId("item"),
      type: base.type || base.itemType || "word",
      itemType: base.itemType || base.type || "word",
      text,
      displayText: String(base.displayText ?? text),
      expectedAnswer: String(base.expectedAnswer ?? text),
      skillTag: base.skillTag || base.reviewTag || "practice",
      wordPattern: base.wordPattern || base.conceptTag || "",
      conceptTag: base.conceptTag || base.wordPattern || "",
      difficulty: base.difficulty || (index < 2 ? "intro" : "practice"),
      sourceRef: base.sourceRef || "mvp-placeholder",
      sourceNote: base.sourceNote || "Teacher-created or MVP placeholder item",
      decodingTarget: base.decodingTarget || "",
      encodingTarget: base.encodingTarget || "",
      expectedMarking: Array.isArray(base.expectedMarking) ? base.expectedMarking : [],
      masteryImpact: base.masteryImpact !== false,
      reviewTag: base.reviewTag || "current"
    };
  }

  function normalizeLessonPart(part, index = 0) {
    const base = part && typeof part === "object" ? part : {};
    const partNumber = Number(base.partNumber || index + 1);
    const rawActivityType = base.activityType || base.suggestedActivityType || "custom";
    const mappedActivityType = LEGACY_ACTIVITY_TYPE_MAP[rawActivityType] || rawActivityType;
    const activityType = ACTIVITY_TYPES.includes(mappedActivityType) ? mappedActivityType : "custom";
    const deliveryMode = DELIVERY_MODES.includes(base.deliveryMode) ? base.deliveryMode : "teacher-led";
    const skillTypes = Array.isArray(base.skillTypes) && base.skillTypes.length
      ? base.skillTypes
      : [base.skillType || activityType || "practice"];
    return {
      id: base.id || makeId("part"),
      partNumber,
      name: String(base.name || `Lesson Part ${partNumber}`).trim(),
      skillTypes,
      skillType: base.skillType || skillTypes[0] || "practice",
      activityType,
      suggestedActivityType: base.suggestedActivityType || activityType,
      teacherMode: base.teacherMode || "guided",
      deliveryMode,
      studentAssignable: base.studentAssignable !== false,
      estimatedMinutes: Number(base.estimatedMinutes || 5),
      instructions: String(base.instructions || base.prompt || "").trim(),
      prompt: String(base.prompt || base.instructions || "").trim(),
      masteryImpact: base.masteryImpact !== false,
      reviewRequired: Boolean(base.reviewRequired || deliveryMode === "teacher-reviewed"),
      items: (base.items || []).map((item, itemIndex) => normalizeLessonItem(item, itemIndex))
    };
  }

  function normalizeLessonPlan(plan) {
    const clean = plan && typeof plan === "object" ? plan : {};
    return {
      ...clean,
      title: String(clean.title || "Untitled V2 lesson").trim(),
      step: String(clean.step || "3"),
      substep: String(clean.substep || "3.1"),
      lessonFocus: String(clean.lessonFocus || clean.title || "MVP lesson focus").trim(),
      parts: (clean.parts || []).map((part, index) => normalizeLessonPart(part, index))
    };
  }

  function normalizeLessonTemplate(template) {
    const clean = template && typeof template === "object" ? template : {};
    return {
      ...clean,
      partBlueprints: (clean.partBlueprints || []).map((part, index) => normalizeLessonPart(part, index))
    };
  }

  function validateLessonPlan(plan) {
    const errors = [];
    if (!String(plan?.title || "").trim()) errors.push("Lesson title is required.");
    if (!String(plan?.step || "").trim()) errors.push("Step is required.");
    if (!String(plan?.substep || "").trim()) errors.push("Substep is required.");
    if (!Array.isArray(plan?.parts) || !plan.parts.length) errors.push("At least one lesson part is required.");
    (plan?.parts || []).forEach((part, index) => {
      if (!String(part.name || "").trim()) errors.push(`Part ${index + 1} needs a name.`);
      if (!String(part.activityType || "").trim()) errors.push(`Part ${index + 1} needs an activity type.`);
    });
    return { ok: errors.length === 0, errors };
  }

  function seedState() {
    const createdAt = nowIso();
    const items = buildLessonItems();
    const parts = buildTemplateParts(items);
    const students = {
      student_demo_001: {
        id: "student_demo_001",
        legalName: "Demo Learner 1",
        displayName: "Demo Learner 1",
        nickname: "Nova",
        avatarId: "avatar-compass-01",
        currentStep: "3",
        currentSubstep: "3.1",
        groupIds: [DEMO_GROUP_ID],
        active: true,
        createdAt
      },
      student_demo_002: {
        id: "student_demo_002",
        legalName: "Demo Learner 2",
        displayName: "Demo Learner 2",
        nickname: "Kai",
        avatarId: "avatar-spark-01",
        currentStep: "3",
        currentSubstep: "3.1",
        groupIds: [DEMO_GROUP_ID],
        active: true,
        createdAt
      },
      student_demo_003: {
        id: "student_demo_003",
        legalName: "Demo Learner 3",
        displayName: "Demo Learner 3",
        nickname: "Mira",
        avatarId: "avatar-orbit-01",
        currentStep: "3",
        currentSubstep: "3.1",
        groupIds: [DEMO_GROUP_ID],
        active: true,
        createdAt
      }
    };

    const lessonPlan = {
      id: "lesson_seed_step31_draft",
      templateId: MVP_TEMPLATE_ID,
      teacherId: DEMO_TEACHER_ID,
      groupId: DEMO_GROUP_ID,
      studentIds: Object.keys(students),
      step: "3",
      substep: "3.1",
      title: "Step 3.1 MVP Draft Lesson",
      lessonDate: todayIsoDate(),
      status: "draft",
      parts: clone(parts),
      assignments: [],
      teacherNotes: "Seed draft for the V2 Lesson Engine MVP.",
      createdAt,
      updatedAt: createdAt
    };

    const masteryStatuses = {};
    Object.keys(students).forEach((studentId) => {
      const id = masteryStatusId(studentId, "3", "3.1");
      masteryStatuses[id] = {
        id,
        studentId,
        step: "3",
        substep: "3.1",
        status: "inProgress",
        evidenceSummary: {
          decodingAttempts: 0,
          encodingAttempts: 0,
          reviewedEvidence: 0
        },
        missingEvidence: ["decoding", "encoding", "teacherReview"],
        updatedAt: createdAt
      };
    });

    return {
      schemaVersion: SCHEMA_VERSION,
      meta: {
        product: "Teach Today V2 Lesson Engine MVP",
        storageKey: STORAGE_KEY,
        seededAt: createdAt,
        updatedAt: createdAt
      },
      teachers: {
        [DEMO_TEACHER_ID]: {
          id: DEMO_TEACHER_ID,
          displayName: "Demo Teacher",
          email: "",
          role: "teacher",
          tenantId: "tenant_demo",
          settings: {
            defaultStep: "3",
            defaultSubstep: "3.1"
          }
        }
      },
      groups: {
        [DEMO_GROUP_ID]: {
          id: DEMO_GROUP_ID,
          name: "Step 3.1 Demo Group",
          studentIds: Object.keys(students),
          currentStep: "3",
          currentSubstep: "3.1",
          readerLevel: "MVP",
          notes: "Demo group for the V2 local data spine."
        }
      },
      students,
      curriculum: {
        curriculum_step_3_1: {
          id: "curriculum_step_3_1",
          stepId: "3",
          substepId: "3.1",
          title: "Step 3.1 Multisyllabic Practice",
          phase: "mvp",
          skillTypes: ["decoding", "encoding", "syllableDivision", "wordCards", "dictation", "fluency", "comprehension"],
          targets: [
            "read multisyllabic placeholder words",
            "build words from parts",
            "type dictated placeholder words",
            "read connected placeholder text"
          ],
          reviewPrerequisites: ["sound review", "closed syllable review", "word element review"],
          sourceSets: ["mvp-placeholder"]
        }
      },
      lessonTemplates: {
        [MVP_TEMPLATE_ID]: {
          id: MVP_TEMPLATE_ID,
          step: "3",
          substep: "3.1",
          title: "Step 3.1 Lesson Engine MVP Template",
          lessonType: "verticalSlice",
          partBlueprints: parts,
          defaultActivities: ["syllableScoop", "wordCardRead", "tileBuild", "typedDictation", "passageReadRecord"],
          masteryTargets: ["decodingEvidence", "encodingEvidence", "teacherReview"]
        }
      },
      lessonPlans: {
        [lessonPlan.id]: lessonPlan
      },
      assignments: {},
      studentAttempts: {},
      evidenceRecords: {},
      teacherReviewItems: {},
      masteryStatuses,
      masteryDecisions: {},
      syncQueue: []
    };
  }

  function normalizeState(raw) {
    const state = raw && typeof raw === "object" ? raw : seedState();
    state.schemaVersion = state.schemaVersion || SCHEMA_VERSION;
    state.meta = state.meta || {};
    state.meta.storageKey = STORAGE_KEY;
    state.meta.updatedAt = state.meta.updatedAt || nowIso();
    COLLECTIONS.forEach((collection) => {
      if (!state[collection] || typeof state[collection] !== "object") state[collection] = {};
    });
    Object.keys(state.lessonTemplates).forEach((templateId) => {
      state.lessonTemplates[templateId] = normalizeLessonTemplate(state.lessonTemplates[templateId]);
    });
    Object.keys(state.lessonPlans).forEach((lessonId) => {
      state.lessonPlans[lessonId] = normalizeLessonPlan(state.lessonPlans[lessonId]);
    });
    if (!Array.isArray(state.syncQueue)) state.syncQueue = [];
    return state;
  }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("Teach Today V2 state could not be read. A fresh demo state was created.", error);
      return seedState();
    }
  }

  function saveState(state) {
    const clean = normalizeState(state);
    clean.meta.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent("teachTodayV2StateChanged", { detail: { state: clone(clean) } }));
    return clean;
  }

  function loadState() {
    const state = readState();
    saveState(state);
    return clone(state);
  }

  function mutateState(mutator) {
    const state = readState();
    const result = mutator(state);
    saveState(state);
    return result;
  }

  function firstId(record) {
    return Object.keys(record || {})[0] || "";
  }

  function getLessonTemplate(state, templateId) {
    return state.lessonTemplates[templateId] || state.lessonTemplates[MVP_TEMPLATE_ID] || objectValues(state.lessonTemplates)[0] || null;
  }

  function getLessonPlanById(lessonPlanId) {
    const state = loadState();
    const lesson = state.lessonPlans[lessonPlanId] || null;
    return lesson ? clone(lesson) : null;
  }

  function createLessonPlan(input) {
    const options = input || {};
    return mutateState((state) => {
      const template = getLessonTemplate(state, options.templateId);
      if (!template) throw new Error("No V2 lesson template is available.");
      const groupId = options.groupId || DEMO_GROUP_ID;
      const group = state.groups[groupId] || objectValues(state.groups)[0] || null;
      const teacherId = options.teacherId || DEMO_TEACHER_ID || firstId(state.teachers);
      const studentIds = options.studentIds || (group ? group.studentIds : []);
      const createdAt = nowIso();
      const lessonId = options.id || makeId("lesson");
      const lesson = {
        id: lessonId,
        templateId: template.id,
        teacherId,
        groupId: group ? group.id : "",
        studentIds: [...studentIds],
        step: options.step || template.step,
        substep: options.substep || template.substep,
        title: options.title || `${template.title} ${todayIsoDate()}`,
        lessonDate: options.lessonDate || todayIsoDate(),
        status: options.status || "draft",
        lessonFocus: options.lessonFocus || template.title || "MVP lesson focus",
        parts: clone(options.parts || template.partBlueprints || []).map((part, index) => normalizeLessonPart(part, index)),
        assignments: [],
        teacherNotes: options.teacherNotes || "",
        createdAt,
        updatedAt: createdAt
      };
      state.lessonPlans[lesson.id] = lesson;
      return clone(lesson);
    });
  }

  function updateLessonPlan(lessonId, updates) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonId}`);
      const next = {
        ...lesson,
        ...(updates || {}),
        id: lesson.id,
        updatedAt: nowIso()
      };
      state.lessonPlans[lessonId] = normalizeLessonPlan(next);
      return clone(next);
    });
  }

  function saveLessonPlan(lessonPlan) {
    return mutateState((state) => {
      if (!lessonPlan?.id || !state.lessonPlans[lessonPlan.id]) throw new Error("Lesson plan not found.");
      const merged = {
        ...state.lessonPlans[lessonPlan.id],
        ...lessonPlan,
        updatedAt: nowIso()
      };
      const validation = validateLessonPlan(merged);
      if (!validation.ok) throw new Error(validation.errors.join(" "));
      const clean = normalizeLessonPlan(merged);
      state.lessonPlans[clean.id] = clean;
      return clone(clean);
    });
  }

  function buildActivityConfigsForLesson(lesson) {
    return (lesson.parts || [])
      .filter((part) => part.studentAssignable)
      .map((part) => ({
        id: `${lesson.id}_${part.id}_${part.suggestedActivityType || "activity"}`,
        lessonPlanId: lesson.id,
        lessonPartId: part.id,
        lessonPart: part.partNumber,
        partName: part.name,
        type: part.activityType || part.suggestedActivityType || "custom",
        activityType: part.activityType || part.suggestedActivityType || "custom",
        title: part.name,
        skillType: part.skillType || (part.skillTypes || [])[0] || "practice",
        skillTypes: part.skillTypes || [],
        deliveryMode: part.deliveryMode || "teacher-led",
        instructions: part.instructions || "",
        prompt: part.prompt || "",
        masteryImpact: part.masteryImpact !== false,
        reviewRequired: Boolean(part.reviewRequired),
        itemIds: (part.items || []).map((item) => item.id),
        items: clone(part.items || [])
      }));
  }

  function createAssignment(input) {
    const options = input || {};
    const lessonPlanId = options.lessonPlanId || options.lessonId;
    const result = assignLessonPlanToStudents({
      lessonPlanId,
      groupId: options.groupId,
      studentIds: options.studentIds || (options.studentId ? [options.studentId] : null),
      dueDate: options.dueDate || "",
      createdBy: options.createdBy,
      masteryImpact: options.masteryImpact,
      preventDuplicates: options.preventDuplicates
    });
    return Array.isArray(result) && result.length === 1 ? result[0] : result;
  }

  function assignLessonPlanToStudents(input) {
    const options = input || {};
    return mutateState((state) => {
      const lesson = state.lessonPlans[options.lessonPlanId || options.lessonId];
      if (!lesson) throw new Error(`Lesson plan not found: ${options.lessonPlanId || options.lessonId}`);
      const validation = validateLessonPlan(lesson);
      if (!validation.ok) throw new Error(validation.errors.join(" "));
      const group = state.groups[options.groupId || lesson.groupId] || null;
      const studentIds = options.studentIds || (options.studentId ? [options.studentId] : lesson.studentIds || group?.studentIds || []);
      const created = [];
      studentIds.forEach((studentId) => {
        if (!state.students[studentId]) return;
        const existing = objectValues(state.assignments).find((assignment) => (
          (assignment.lessonPlanId === lesson.id || assignment.lessonId === lesson.id) && assignment.studentId === studentId && assignment.status !== "archived"
        ));
        if (existing && options.preventDuplicates !== false) {
          existing.activityConfigs = buildActivityConfigsForLesson(lesson);
          existing.activities = clone(existing.activityConfigs);
          existing.activityIds = existing.activityConfigs.map((activity) => activity.id);
          existing.updatedAt = nowIso();
          created.push(existing);
          return;
        }
        const createdAt = nowIso();
        const activityConfigs = buildActivityConfigsForLesson(lesson);
        const assignment = {
          id: makeId("assignment"),
          lessonPlanId: lesson.id,
          lessonId: lesson.id,
          studentId,
          groupId: group ? group.id : lesson.groupId,
          status: "assigned",
          assignedAt: createdAt,
          dueDate: options.dueDate || "",
          activityIds: activityConfigs.map((activity) => activity.id),
          activityConfigs,
          activities: clone(activityConfigs),
          step: lesson.step,
          substep: lesson.substep,
          masteryImpact: options.masteryImpact || "eligibleAfterReview",
          createdBy: options.createdBy || lesson.teacherId,
          createdAt,
          updatedAt: createdAt
        };
        state.assignments[assignment.id] = assignment;
        lesson.assignments = [...new Set([...(lesson.assignments || []), assignment.id])];
        lesson.status = lesson.status === "draft" ? "assigned" : lesson.status;
        lesson.updatedAt = createdAt;
        created.push(assignment);
      });
      return clone(created.length === 1 ? created[0] : created);
    });
  }

  function addLessonPart(lessonPlanId, part) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const nextPart = normalizeLessonPart({
        ...part,
        partNumber: part?.partNumber || (lesson.parts || []).length + 1
      }, (lesson.parts || []).length);
      lesson.parts = [...(lesson.parts || []), nextPart];
      lesson.updatedAt = nowIso();
      return clone(nextPart);
    });
  }

  function updateLessonPart(lessonPlanId, partId, updates) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const index = (lesson.parts || []).findIndex((part) => part.id === partId);
      if (index < 0) throw new Error(`Lesson part not found: ${partId}`);
      lesson.parts[index] = normalizeLessonPart({ ...lesson.parts[index], ...(updates || {}), id: partId }, index);
      lesson.updatedAt = nowIso();
      return clone(lesson.parts[index]);
    });
  }

  function removeLessonPart(lessonPlanId, partId) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      if ((lesson.parts || []).length <= 1) throw new Error("A lesson plan needs at least one part.");
      lesson.parts = (lesson.parts || []).filter((part) => part.id !== partId).map((part, index) => ({
        ...part,
        partNumber: index + 1
      }));
      lesson.updatedAt = nowIso();
      return clone(lesson);
    });
  }

  function reorderLessonParts(lessonPlanId, partId, directionOrIndex) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const parts = [...(lesson.parts || [])];
      const currentIndex = parts.findIndex((part) => part.id === partId);
      if (currentIndex < 0) throw new Error(`Lesson part not found: ${partId}`);
      let nextIndex = Number(directionOrIndex);
      if (directionOrIndex === "up") nextIndex = currentIndex - 1;
      if (directionOrIndex === "down") nextIndex = currentIndex + 1;
      nextIndex = Math.max(0, Math.min(parts.length - 1, nextIndex));
      const [part] = parts.splice(currentIndex, 1);
      parts.splice(nextIndex, 0, part);
      lesson.parts = parts.map((item, index) => ({ ...item, partNumber: index + 1 }));
      lesson.updatedAt = nowIso();
      return clone(lesson.parts);
    });
  }

  function addLessonItem(lessonPlanId, partId, item) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const part = (lesson.parts || []).find((entry) => entry.id === partId);
      if (!part) throw new Error(`Lesson part not found: ${partId}`);
      const nextItem = normalizeLessonItem(item, (part.items || []).length);
      part.items = [...(part.items || []), nextItem];
      lesson.updatedAt = nowIso();
      return clone(nextItem);
    });
  }

  function updateLessonItem(lessonPlanId, partId, itemId, updates) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const part = (lesson.parts || []).find((entry) => entry.id === partId);
      if (!part) throw new Error(`Lesson part not found: ${partId}`);
      const index = (part.items || []).findIndex((item) => item.id === itemId);
      if (index < 0) throw new Error(`Lesson item not found: ${itemId}`);
      part.items[index] = normalizeLessonItem({ ...part.items[index], ...(updates || {}), id: itemId }, index);
      lesson.updatedAt = nowIso();
      return clone(part.items[index]);
    });
  }

  function removeLessonItem(lessonPlanId, partId, itemId) {
    return mutateState((state) => {
      const lesson = state.lessonPlans[lessonPlanId];
      if (!lesson) throw new Error(`Lesson plan not found: ${lessonPlanId}`);
      const part = (lesson.parts || []).find((entry) => entry.id === partId);
      if (!part) throw new Error(`Lesson part not found: ${partId}`);
      part.items = (part.items || []).filter((item) => item.id !== itemId);
      lesson.updatedAt = nowIso();
      return clone(part);
    });
  }

  function recordStudentAttempt(input) {
    const options = input || {};
    return mutateState((state) => {
      const assignment = state.assignments[options.assignmentId];
      if (!assignment) throw new Error(`Assignment not found: ${options.assignmentId}`);
      const createdAt = nowIso();
      const attempt = {
        id: options.id || makeId("attempt"),
        assignmentId: assignment.id,
        studentId: options.studentId || assignment.studentId,
        activityId: options.activityId || "",
        itemId: options.itemId || "",
        response: options.response || {},
        correct: typeof options.correct === "boolean" ? options.correct : null,
        attemptCount: options.attemptCount || 1,
        timeMs: options.timeMs || 0,
        hintsUsed: options.hintsUsed || 0,
        errorTypes: options.errorTypes || [],
        createdAt
      };
      state.studentAttempts[attempt.id] = attempt;
      return clone(attempt);
    });
  }

  function createEvidenceRecord(input) {
    const options = input || {};
    return mutateState((state) => {
      const attempt = options.attemptId ? state.studentAttempts[options.attemptId] : null;
      const assignment = attempt ? state.assignments[attempt.assignmentId] : state.assignments[options.assignmentId];
      const lesson = assignment ? state.lessonPlans[assignment.lessonId] : state.lessonPlans[options.lessonId];
      if (!lesson) throw new Error("Evidence record needs a lesson or assignment connection.");
      const correct = typeof options.correct === "boolean" ? options.correct : attempt?.correct;
      const createdAt = nowIso();
      const evidence = {
        id: options.id || makeId("evidence"),
        attemptId: attempt ? attempt.id : options.attemptId || "",
        assignmentId: assignment ? assignment.id : options.assignmentId || "",
        lessonId: lesson.id,
        studentId: options.studentId || attempt?.studentId || assignment?.studentId || "",
        step: options.step || lesson.step,
        substep: options.substep || lesson.substep,
        skillType: options.skillType || options.activityType || "practice",
        accuracy: typeof correct === "boolean" ? (correct ? 1 : 0) : null,
        correct: typeof correct === "boolean" ? correct : null,
        errorTypes: options.errorTypes || attempt?.errorTypes || [],
        teacherReviewStatus: options.teacherReviewStatus || "pending",
        masteryImpact: options.masteryImpact || assignment?.masteryImpact || "eligibleAfterReview",
        createdAt,
        updatedAt: createdAt
      };
      state.evidenceRecords[evidence.id] = evidence;
      return clone(evidence);
    });
  }

  function createTeacherReviewItem(input) {
    const options = input || {};
    return mutateState((state) => {
      const evidenceRecordIds = options.evidenceRecordIds || (options.evidenceRecordId ? [options.evidenceRecordId] : []);
      const firstEvidence = state.evidenceRecords[evidenceRecordIds[0]] || null;
      const createdAt = nowIso();
      const reviewItem = {
        id: options.id || makeId("review"),
        studentId: options.studentId || firstEvidence?.studentId || "",
        lessonId: options.lessonId || firstEvidence?.lessonId || "",
        evidenceRecordIds,
        reviewType: options.reviewType || "evidence",
        status: options.status || "pending",
        teacherDecision: options.teacherDecision || "",
        notes: options.notes || "",
        createdAt,
        updatedAt: createdAt
      };
      state.teacherReviewItems[reviewItem.id] = reviewItem;
      return clone(reviewItem);
    });
  }

  function updateMasteryStatus(input) {
    const options = input || {};
    if (!options.studentId || !options.step || !options.substep) {
      throw new Error("Mastery status requires studentId, step, and substep.");
    }
    return mutateState((state) => {
      const id = options.id || masteryStatusId(options.studentId, options.step, options.substep);
      const current = state.masteryStatuses[id] || {
        id,
        studentId: options.studentId,
        step: options.step,
        substep: options.substep,
        status: "notStarted",
        evidenceSummary: {},
        missingEvidence: []
      };
      const next = {
        ...current,
        ...options,
        id,
        updatedAt: nowIso()
      };
      state.masteryStatuses[id] = next;
      return clone(next);
    });
  }

  function getAssignmentsForStudent(studentId) {
    const state = loadState();
    return objectValues(state.assignments)
      .filter((assignment) => assignment.studentId === studentId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function getAssignmentsByLessonPlan(lessonPlanId) {
    const state = loadState();
    return objectValues(state.assignments)
      .filter((assignment) => assignment.lessonPlanId === lessonPlanId || assignment.lessonId === lessonPlanId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function getEvidenceForLessonPlan(lessonId) {
    const state = loadState();
    return objectValues(state.evidenceRecords)
      .filter((evidence) => evidence.lessonId === lessonId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function getStudentLessonHistory(studentId) {
    const state = loadState();
    const assignments = objectValues(state.assignments).filter((assignment) => assignment.studentId === studentId);
    return assignments.map((assignment) => {
      const lesson = state.lessonPlans[assignment.lessonId] || null;
      const attempts = objectValues(state.studentAttempts).filter((attempt) => attempt.assignmentId === assignment.id);
      const evidence = objectValues(state.evidenceRecords).filter((record) => record.assignmentId === assignment.id);
      return {
        assignment,
        lesson,
        attempts,
        evidence,
        masteryStatus: objectValues(state.masteryStatuses).find((status) => (
          status.studentId === studentId && status.step === assignment.step && status.substep === assignment.substep
        )) || null
      };
    }).sort((a, b) => String(b.assignment.createdAt).localeCompare(String(a.assignment.createdAt)));
  }

  function resetDemoState() {
    const state = seedState();
    saveState(state);
    return clone(state);
  }

  window.TeachTodayV2 = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    MVP_TEMPLATE_ID,
    DEMO_TEACHER_ID,
    DEMO_GROUP_ID,
    loadState,
    saveState,
    resetDemoState,
    ACTIVITY_TYPES,
    DELIVERY_MODES,
    validateLessonPlan,
    getLessonPlanById,
    createLessonPlan,
    updateLessonPlan,
    saveLessonPlan,
    addLessonPart,
    updateLessonPart,
    removeLessonPart,
    reorderLessonParts,
    addLessonItem,
    updateLessonItem,
    removeLessonItem,
    createAssignment,
    assignLessonPlanToStudents,
    recordStudentAttempt,
    createEvidenceRecord,
    createTeacherReviewItem,
    updateMasteryStatus,
    getStudentLessonHistory,
    getAssignmentsByLessonPlan,
    getAssignmentsForStudent,
    getEvidenceForLessonPlan,
    makeId,
    clone
  };
})();
