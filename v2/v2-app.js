(function () {
  "use strict";

  const V2 = window.TeachTodayV2;
  const SELECTED_STUDENT_KEY = "teachToday.v2.selectedStudentId";

  function byId(id) {
    return document.getElementById(id);
  }

  function values(record) {
    return Object.values(record || {});
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatStatus(value) {
    return String(value || "notStarted")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());
  }

  function formatDate(value) {
    if (!value) return "Not set";
    return String(value).slice(0, 10);
  }

  function metric(label, value, tone) {
    return `
      <article class="v2-metric ${tone ? `v2-metric-${tone}` : ""}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `;
  }

  function statusPill(status) {
    return `<span class="v2-pill">${escapeHtml(formatStatus(status))}</span>`;
  }

  function activityLabel(type) {
    const labels = {
      soundReview: "Sound review",
      wordReading: "Word reading",
      wordCards: "Word cards",
      spelling: "Spelling",
      dictation: "Dictation",
      sentenceReading: "Sentence reading",
      passageReading: "Passage reading",
      comprehension: "Comprehension",
      custom: "Custom"
    };
    return labels[type] || formatStatus(type || "custom");
  }

  function deliveryLabel(mode) {
    const labels = {
      "teacher-led": "Teacher led",
      "student-independent": "Student practice",
      "teacher-reviewed": "Teacher review"
    };
    return labels[mode] || formatStatus(mode || "teacher-led");
  }

  function teacherSourceNote(value) {
    const text = String(value || "").trim();
    if (!text || /mvp|placeholder/i.test(text)) return "Demo or teacher-created item";
    return text;
  }

  function yesNoBadge(value, yesText, noText) {
    return `<span class="v2-soft-badge ${value ? "is-on" : "is-off"}">${escapeHtml(value ? yesText : noText)}</span>`;
  }

  function developerInfo(content) {
    return `
      <details class="v2-dev-info">
        <summary>Developer Info</summary>
        <div>${content}</div>
      </details>
    `;
  }

  function checked(value) {
    return value ? "checked" : "";
  }

  function selected(value, current) {
    return value === current ? "selected" : "";
  }

  function currentLessonId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) return id;
    const state = V2.loadState();
    return values(state.lessonPlans)[0]?.id || "";
  }

  function studentAvatar(student) {
    const initials = (student.nickname || student.displayName || "ST").slice(0, 2).toUpperCase();
    return `<span class="v2-avatar" aria-hidden="true">${escapeHtml(initials)}</span>`;
  }

  function renderHome(root) {
    const state = V2.loadState();
    root.innerHTML = `
      <section class="v2-hero">
        <div>
          <p class="v2-eyebrow">Teach Today</p>
          <h1>Lesson Engine</h1>
          <p>A teacher-controlled workspace for planning structured lessons, assigning student practice, and reviewing evidence.</p>
        </div>
        <div class="v2-home-actions">
          <a class="v2-button v2-button-primary" href="./teacher/">Open Teacher</a>
          <a class="v2-button" href="./student/">Open Student</a>
        </div>
      </section>

      <section class="v2-summary-grid" aria-label="V2 state summary">
        ${metric("Students", values(state.students).length)}
        ${metric("Groups", values(state.groups).length)}
        ${metric("Lessons", values(state.lessonPlans).length)}
        ${metric("Assignments", values(state.assignments).length)}
      </section>

      ${developerInfo(`
        <p>Local-only prototype storage is active for this build.</p>
        <p><code>${escapeHtml(V2.STORAGE_KEY)}</code></p>
      `)}
    `;
  }

  function lessonPlanRows(state) {
    const plans = values(state.lessonPlans).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if (!plans.length) {
      return `<div class="v2-empty">No lesson plans yet.</div>`;
    }
    return plans.map((plan) => {
      const evidenceCount = V2.getEvidenceForLessonPlan(plan.id).length;
      return `
        <article class="v2-lesson-card">
          <div class="v2-card-main">
            <div class="v2-card-title">${escapeHtml(plan.title)}</div>
            <div class="v2-card-meta">Step ${escapeHtml(plan.step)} | Substep ${escapeHtml(plan.substep)} | ${escapeHtml(formatDate(plan.lessonDate))}</div>
            <div class="v2-card-chips">
              <span>${escapeHtml((plan.parts || []).length)} parts</span>
              <span>${escapeHtml((plan.assignments || []).length)} assigned</span>
              <span>${evidenceCount} evidence</span>
            </div>
          </div>
          <div class="v2-card-actions">
            ${statusPill(plan.status)}
            <a class="v2-button v2-button-small" href="lesson.html?id=${encodeURIComponent(plan.id)}">Open</a>
            <button class="v2-button v2-button-small" type="button" data-assign-lesson="${escapeHtml(plan.id)}">Assign</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function studentRows(state) {
    return values(state.students).map((student) => {
      const mastery = values(state.masteryStatuses).find((status) => (
        status.studentId === student.id && status.step === student.currentStep && status.substep === student.currentSubstep
      ));
      const assignments = V2.getAssignmentsForStudent(student.id);
      return `
        <tr>
          <td>
            <span class="v2-person-cell">${studentAvatar(student)}<span>${escapeHtml(student.displayName)}</span></span>
          </td>
          <td>${escapeHtml(student.nickname)}</td>
          <td>Step ${escapeHtml(student.currentStep)} / ${escapeHtml(student.currentSubstep)}</td>
          <td>${assignments.length}</td>
          <td>${statusPill(mastery?.status || "notStarted")}</td>
        </tr>
      `;
    }).join("");
  }

  function templatePartList(template) {
    return (template?.partBlueprints || []).map((part) => `
      <li>
        <strong>Part ${escapeHtml(part.partNumber)}: ${escapeHtml(part.name)}</strong>
        <span>${escapeHtml((part.skillTypes || []).join(", "))}</span>
      </li>
    `).join("");
  }

  function masterySummaryForLesson(state, lesson) {
    const statuses = (lesson.studentIds || [])
      .map((studentId) => values(state.masteryStatuses).find((status) => (
        status.studentId === studentId && status.step === lesson.step && status.substep === lesson.substep
      )))
      .filter(Boolean);
    if (!statuses.length) return "No mastery status yet";
    const counts = statuses.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, count]) => `${formatStatus(key)}: ${count}`).join(" | ");
  }

  function renderTeacher(root) {
    const state = V2.loadState();
    const template = state.lessonTemplates[V2.MVP_TEMPLATE_ID] || values(state.lessonTemplates)[0];
    const group = state.groups[V2.DEMO_GROUP_ID] || values(state.groups)[0];
    const evidenceCount = values(state.evidenceRecords).length;
    const reviewCount = values(state.teacherReviewItems).filter((item) => item.status === "pending").length;

    root.innerHTML = `
      <section class="v2-page-heading">
        <div>
          <p class="v2-eyebrow">Teacher workspace</p>
          <h1>Lesson Control Center</h1>
          <p>Plan the lesson, assign connected practice, and keep mastery decisions teacher-led.</p>
        </div>
        <div class="v2-heading-actions">
          <span class="v2-pill">Teacher controlled</span>
          <span class="v2-pill">Evidence first</span>
        </div>
      </section>

      <section class="v2-summary-grid" aria-label="Teacher dashboard summary">
        ${metric("Groups", values(state.groups).length)}
        ${metric("Students", values(state.students).length)}
        ${metric("Lessons", values(state.lessonPlans).length)}
        ${metric("Assignments", values(state.assignments).length)}
        ${metric("Evidence", evidenceCount)}
        ${metric("Reviews", reviewCount)}
      </section>

      <section class="v2-grid-two">
        <div class="v2-panel">
          <div class="v2-section-heading">
            <div>
              <p class="v2-eyebrow">Quick plan</p>
              <h2>Create a Step 3.1 Lesson</h2>
            </div>
            <span class="v2-pill">Draft</span>
          </div>
          <form id="v2LessonForm" class="v2-form">
            <label>
              Lesson title
              <input id="v2LessonTitle" type="text" value="${escapeHtml("Step 3.1 Lesson")}" autocomplete="off">
            </label>
            <label>
              Group
              <select id="v2LessonGroup">
                ${values(state.groups).map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === group?.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <label>
              Lesson date
              <input id="v2LessonDate" type="date" value="${new Date().toISOString().slice(0, 10)}">
            </label>
            <button class="v2-button v2-button-primary" type="submit">Create Lesson</button>
          </form>
          <div class="v2-template-preview">
            <p class="v2-muted">Starts with editable reading, word card, spelling, dictation, and reading/retell parts.</p>
            <ol class="v2-part-list">${templatePartList(template)}</ol>
          </div>
        </div>

        <div class="v2-panel">
          <div class="v2-section-heading">
            <div>
              <p class="v2-eyebrow">Roster</p>
              <h2>${escapeHtml(group?.name || "Demo group")}</h2>
            </div>
            <span class="v2-pill">Step ${escapeHtml(group?.currentStep || "3")} / ${escapeHtml(group?.currentSubstep || "3.1")}</span>
          </div>
          <div class="v2-table-wrap">
            <table class="v2-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Nickname</th>
                  <th>Placement</th>
                  <th>Assignments</th>
                  <th>Mastery</th>
                </tr>
              </thead>
              <tbody>${studentRows(state)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="v2-panel">
        <div class="v2-section-heading">
          <div>
            <p class="v2-eyebrow">Lessons</p>
            <h2>Saved Lessons</h2>
          </div>
          <span class="v2-pill">${values(state.lessonPlans).length} total</span>
        </div>
        <div class="v2-list">${lessonPlanRows(state)}</div>
      </section>

      <section class="v2-panel">
        <div class="v2-section-heading">
          <div>
            <p class="v2-eyebrow">Assignments</p>
            <h2>Current Assignments</h2>
          </div>
          <span class="v2-pill">${values(state.assignments).length} total</span>
        </div>
        ${assignmentList(state)}
      </section>

      ${developerInfo(`
        <p>Storage key: <code>${escapeHtml(V2.STORAGE_KEY)}</code></p>
        <p>Schema: <code>${escapeHtml(V2.SCHEMA_VERSION)}</code></p>
      `)}

      <div id="v2Toast" class="v2-toast" role="status" aria-live="polite"></div>
    `;

    bindTeacherEvents(root);
  }

  function assignmentList(state) {
    const assignments = values(state.assignments).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (!assignments.length) return `<div class="v2-empty">No assignments yet. Create a lesson, then assign it to one student or the group.</div>`;
    return `
      <div class="v2-list">
        ${assignments.map((assignment) => {
          const student = state.students[assignment.studentId];
          const lesson = state.lessonPlans[assignment.lessonId];
          return `
            <article class="v2-list-card">
              <div>
                <div class="v2-card-title">${escapeHtml(lesson?.title || "Lesson")}</div>
                <div class="v2-card-meta">${escapeHtml(student?.nickname || "Student")} | Step ${escapeHtml(assignment.step)} / ${escapeHtml(assignment.substep)}</div>
                <div class="v2-card-chips">
                  <span>${escapeHtml((assignment.activityIds || []).length)} activities</span>
                  <span>${escapeHtml(formatDate(assignment.assignedAt || assignment.createdAt))}</span>
                </div>
              </div>
              <div class="v2-card-actions">${statusPill(assignment.status)}</div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function showToast(message) {
    const toast = byId("v2Toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("active");
    window.setTimeout(() => toast.classList.remove("active"), 2400);
  }

  function bindTeacherEvents(root) {
    const form = byId("v2LessonForm");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const state = V2.loadState();
      const groupId = byId("v2LessonGroup")?.value || V2.DEMO_GROUP_ID;
      const group = state.groups[groupId];
      const lesson = V2.createLessonPlan({
        templateId: V2.MVP_TEMPLATE_ID,
        teacherId: V2.DEMO_TEACHER_ID,
        groupId,
        studentIds: group?.studentIds || [],
        title: byId("v2LessonTitle")?.value || "Step 3.1 Lesson",
        lessonDate: byId("v2LessonDate")?.value || new Date().toISOString().slice(0, 10)
      });
      renderTeacher(root);
      showToast(`Saved ${lesson.title}`);
    });

    root.querySelectorAll("[data-assign-lesson]").forEach((button) => {
      button.addEventListener("click", () => {
        const lessonId = button.getAttribute("data-assign-lesson");
        const state = V2.loadState();
        const lesson = state.lessonPlans[lessonId];
        const created = V2.createAssignment({
          lessonId,
          groupId: lesson?.groupId,
          studentIds: lesson?.studentIds || [],
          createdBy: lesson?.teacherId || V2.DEMO_TEACHER_ID
        });
        const count = Array.isArray(created) ? created.length : 1;
        renderTeacher(root);
        showToast(`${count} assignment${count === 1 ? "" : "s"} ready for students`);
      });
    });
  }

  function renderTeacherLesson(root) {
    const state = V2.loadState();
    const lessonId = currentLessonId();
    const lesson = V2.getLessonPlanById(lessonId);
    if (!lesson) {
      root.innerHTML = `
        <section class="v2-panel">
          <div class="v2-section-heading">
            <div>
              <p class="v2-eyebrow">Lesson detail</p>
              <h1>Lesson not found</h1>
            </div>
            <a class="v2-button" href="./">Back to Teacher</a>
          </div>
          <p class="v2-muted">Create a V2 lesson plan from the teacher dashboard first.</p>
        </section>
      `;
      return;
    }

    const assignments = V2.getAssignmentsByLessonPlan(lesson.id);
    const evidence = V2.getEvidenceForLessonPlan(lesson.id);
    const group = state.groups[lesson.groupId] || values(state.groups)[0];

    root.innerHTML = `
      <section class="v2-page-heading">
        <div>
          <p class="v2-eyebrow">Lesson planner</p>
          <h1>${escapeHtml(lesson.title)}</h1>
          <p>Adjust the lesson flow, choose what students will practice, then assign when ready.</p>
        </div>
        <div class="v2-heading-actions">
          ${statusPill(lesson.status)}
        </div>
      </section>

      <section class="v2-sticky-actions" aria-label="Lesson actions">
        <a class="v2-button" href="./">Back to Lessons</a>
        <button class="v2-button v2-button-primary" type="button" data-save-lesson>Save Lesson</button>
        <button class="v2-button" type="button" data-assign-selected>Assign Lesson</button>
      </section>

      <section class="v2-summary-grid" aria-label="Lesson detail summary">
        ${metric("Step", lesson.step)}
        ${metric("Substep", lesson.substep)}
        ${metric("Parts", (lesson.parts || []).length)}
        ${metric("Assignments", assignments.length)}
        ${metric("Evidence", evidence.length)}
        ${metric("Mastery", masterySummaryForLesson(state, lesson))}
      </section>

      <section class="v2-grid-two">
        <div class="v2-panel">
          <div class="v2-section-heading">
            <div>
              <p class="v2-eyebrow">Plan</p>
              <h2>Lesson Setup</h2>
            </div>
            <span class="v2-pill">${escapeHtml(group?.name || "Group")}</span>
          </div>
          <form id="v2LessonDetailForm" class="v2-form">
            <label>
              Lesson title
              <input data-lesson-title type="text" value="${escapeHtml(lesson.title)}" autocomplete="off">
            </label>
            <div class="v2-form-grid">
              <label>
                Step
                <input data-lesson-step type="text" value="${escapeHtml(lesson.step)}">
              </label>
              <label>
                Substep
                <input data-lesson-substep type="text" value="${escapeHtml(lesson.substep)}">
              </label>
            </div>
            <label>
              Lesson focus
              <textarea data-lesson-focus rows="3">${escapeHtml(lesson.lessonFocus || "")}</textarea>
            </label>
            <label>
              Target group
              <select data-lesson-group>
                ${values(state.groups).map((item) => `<option value="${escapeHtml(item.id)}" ${selected(item.id, lesson.groupId)}>${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <label>
              Teacher notes
              <textarea data-lesson-notes rows="3">${escapeHtml(lesson.teacherNotes || "")}</textarea>
            </label>
          </form>
        </div>

        <div class="v2-panel">
          <div class="v2-section-heading">
            <div>
              <p class="v2-eyebrow">Assign</p>
              <h2>Send To Students</h2>
            </div>
            <span class="v2-pill">${assignments.length} assigned</span>
          </div>
          <div class="v2-form">
            <label>
              Due date optional
              <input data-assignment-due type="date">
            </label>
            <fieldset class="v2-fieldset">
              <legend>Students</legend>
              ${(group?.studentIds || lesson.studentIds || []).map((studentId) => {
                const student = state.students[studentId];
                if (!student) return "";
                return `
                  <label class="v2-check-row">
                    <input type="checkbox" data-assign-student value="${escapeHtml(student.id)}" checked>
                    <span>${studentAvatar(student)} ${escapeHtml(student.nickname)}</span>
                  </label>
                `;
              }).join("")}
            </fieldset>
            <div class="v2-button-row">
              <button class="v2-button v2-button-primary" type="button" data-assign-selected>Assign Selected</button>
              <button class="v2-button" type="button" data-assign-group>Assign Whole Group</button>
            </div>
          </div>
          <div class="v2-list v2-assignment-mini-list">${lessonAssignmentMiniList(state, assignments)}</div>
        </div>
      </section>

      <section class="v2-panel">
        <div class="v2-section-heading">
          <div>
            <p class="v2-eyebrow">Lesson flow</p>
            <h2>Parts And Practice</h2>
          </div>
          <button class="v2-button" type="button" data-add-part>Add Lesson Part</button>
        </div>
        <div id="v2LessonParts" class="v2-part-editor-list">
          ${(lesson.parts || []).map((part, index) => lessonPartEditor(part, index)).join("")}
        </div>
      </section>

      ${developerInfo(`
        <p>Lesson id: <code>${escapeHtml(lesson.id)}</code></p>
        <p>Storage key: <code>${escapeHtml(V2.STORAGE_KEY)}</code></p>
      `)}

      <div id="v2Toast" class="v2-toast" role="status" aria-live="polite"></div>
    `;

    bindLessonDetailEvents(root, lesson.id);
  }

  function lessonAssignmentMiniList(state, assignments) {
    if (!assignments.length) return `<div class="v2-empty">No assignments generated yet.</div>`;
    return assignments.map((assignment) => {
      const student = state.students[assignment.studentId];
      return `
        <article class="v2-mini-card">
          <span>${escapeHtml(student?.nickname || "Student")}</span>
          <strong>${escapeHtml((assignment.activityConfigs || assignment.activities || []).length)} activities</strong>
          ${statusPill(assignment.status)}
        </article>
      `;
    }).join("");
  }

  function activityOptions(current) {
    return V2.ACTIVITY_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${selected(type, current)}>${escapeHtml(activityLabel(type))}</option>`).join("");
  }

  function deliveryOptions(current) {
    return V2.DELIVERY_MODES.map((mode) => `<option value="${escapeHtml(mode)}" ${selected(mode, current)}>${escapeHtml(deliveryLabel(mode))}</option>`).join("");
  }

  function lessonPartEditor(part, index) {
    return `
      <details class="v2-part-card" data-part-card data-part-id="${escapeHtml(part.id)}" ${index === 0 ? "open" : ""}>
        <summary class="v2-part-summary">
          <div class="v2-part-number">Part ${escapeHtml(index + 1)}</div>
          <div class="v2-part-summary-main">
            <h3>${escapeHtml(part.name || "Lesson Part")}</h3>
            <div class="v2-card-chips">
              <span>${escapeHtml(part.skillType || (part.skillTypes || [])[0] || "Practice")}</span>
              <span>${escapeHtml(activityLabel(part.activityType || "custom"))}</span>
              <span>${escapeHtml((part.items || []).length)} items</span>
            </div>
          </div>
          <div class="v2-part-summary-badges">
            ${yesNoBadge(Boolean(part.reviewRequired), "Review", "No review")}
            ${yesNoBadge(part.masteryImpact !== false, "Mastery", "Practice only")}
          </div>
        </summary>

        <div class="v2-part-editor">
          <div class="v2-part-toolbar">
            <div class="v2-muted">Edit only what changes for this lesson.</div>
            <div class="v2-card-actions">
              <button class="v2-icon-button" type="button" data-move-part="up" aria-label="Move part up">Up</button>
              <button class="v2-icon-button" type="button" data-move-part="down" aria-label="Move part down">Down</button>
              <button class="v2-button v2-button-small v2-button-danger" type="button" data-remove-part>Remove</button>
            </div>
          </div>

          <div class="v2-form-grid">
            <label>
              Part number
              <input data-part-number type="number" min="1" value="${escapeHtml(part.partNumber || index + 1)}">
            </label>
            <label>
              Part name
              <input data-part-name type="text" value="${escapeHtml(part.name || "")}">
            </label>
            <label>
              Skill focus
              <input data-part-skill type="text" value="${escapeHtml(part.skillType || (part.skillTypes || [])[0] || "")}">
            </label>
            <label>
              Activity type
              <select data-part-activity>${activityOptions(part.activityType || "custom")}</select>
            </label>
            <label>
              Delivery
              <select data-part-delivery>${deliveryOptions(part.deliveryMode || "teacher-led")}</select>
            </label>
          </div>

          <label class="v2-wide-label">
            Teacher prompt
            <textarea data-part-instructions rows="3">${escapeHtml(part.instructions || part.prompt || "")}</textarea>
          </label>

          <div class="v2-checkbox-grid">
            <label class="v2-check-row">
              <input data-part-mastery type="checkbox" ${checked(part.masteryImpact !== false)}>
              <span>Can support mastery</span>
            </label>
            <label class="v2-check-row">
              <input data-part-review type="checkbox" ${checked(Boolean(part.reviewRequired))}>
              <span>Teacher review needed</span>
            </label>
          </div>

          <div class="v2-item-editor">
            <div class="v2-section-heading">
              <div>
                <p class="v2-eyebrow">Practice items</p>
                <h4>${escapeHtml((part.items || []).length)} items</h4>
              </div>
              <button class="v2-button v2-button-small" type="button" data-add-item>Add Item</button>
            </div>
            <div class="v2-item-list">
              ${(part.items || []).map((item) => lessonItemEditor(item)).join("") || `<div class="v2-empty">No items yet.</div>`}
            </div>
          </div>
        </div>
      </details>
    `;
  }

  function lessonItemEditor(item) {
    return `
      <div class="v2-item-row" data-item-row data-item-id="${escapeHtml(item.id)}">
        <div class="v2-item-topline">
          <div>
            <strong>${escapeHtml(item.text || "New item")}</strong>
            <span>${escapeHtml(item.itemType || item.type || "word")}</span>
          </div>
          <button class="v2-button v2-button-small v2-button-danger" type="button" data-remove-item>Remove</button>
        </div>
        <div class="v2-form-grid v2-item-quick-grid">
          <label>
            Item text
            <input data-item-text type="text" value="${escapeHtml(item.text || "")}">
          </label>
          <label>
            Expected answer
            <input data-item-answer type="text" value="${escapeHtml(item.expectedAnswer || "")}">
          </label>
          <label>
            Item type
            <input data-item-type type="text" value="${escapeHtml(item.itemType || item.type || "word")}">
          </label>
        </div>
        <details class="v2-advanced-fields">
          <summary>More item details</summary>
          <div class="v2-form-grid v2-item-grid">
            <label>
              Skill tag
              <input data-item-skill type="text" value="${escapeHtml(item.skillTag || "")}">
            </label>
            <label>
              Concept tag
              <input data-item-concept type="text" value="${escapeHtml(item.conceptTag || item.wordPattern || "")}">
            </label>
            <label>
              Difficulty
              <input data-item-difficulty type="text" value="${escapeHtml(item.difficulty || "practice")}">
            </label>
          </div>
          <label class="v2-wide-label">
            Source note
            <input data-item-source type="text" value="${escapeHtml(teacherSourceNote(item.sourceNote))}">
          </label>
          <div class="v2-item-actions">
            <label class="v2-check-row">
              <input data-item-mastery type="checkbox" ${checked(item.masteryImpact !== false)}>
              <span>Can support mastery</span>
            </label>
          </div>
        </details>
      </div>
    `;
  }

  function collectLessonFromForm(root, lessonId) {
    const existing = V2.getLessonPlanById(lessonId);
    const parts = [...root.querySelectorAll("[data-part-card]")].map((card, index) => {
      const skillType = card.querySelector("[data-part-skill]")?.value.trim() || "practice";
      const items = [...card.querySelectorAll("[data-item-row]")].map((row) => ({
        id: row.dataset.itemId,
        text: row.querySelector("[data-item-text]")?.value.trim() || "",
        displayText: row.querySelector("[data-item-text]")?.value.trim() || "",
        expectedAnswer: row.querySelector("[data-item-answer]")?.value.trim() || "",
        itemType: row.querySelector("[data-item-type]")?.value.trim() || "word",
        type: row.querySelector("[data-item-type]")?.value.trim() || "word",
        skillTag: row.querySelector("[data-item-skill]")?.value.trim() || skillType,
        conceptTag: row.querySelector("[data-item-concept]")?.value.trim() || "",
        wordPattern: row.querySelector("[data-item-concept]")?.value.trim() || "",
        difficulty: row.querySelector("[data-item-difficulty]")?.value.trim() || "practice",
        sourceNote: row.querySelector("[data-item-source]")?.value.trim() || "Teacher-created item",
        masteryImpact: Boolean(row.querySelector("[data-item-mastery]")?.checked)
      }));
      return {
        id: card.dataset.partId,
        partNumber: Number(card.querySelector("[data-part-number]")?.value || index + 1),
        name: card.querySelector("[data-part-name]")?.value.trim() || "",
        skillType,
        skillTypes: [skillType],
        activityType: card.querySelector("[data-part-activity]")?.value || "custom",
        deliveryMode: card.querySelector("[data-part-delivery]")?.value || "teacher-led",
        instructions: card.querySelector("[data-part-instructions]")?.value.trim() || "",
        prompt: card.querySelector("[data-part-instructions]")?.value.trim() || "",
        masteryImpact: Boolean(card.querySelector("[data-part-mastery]")?.checked),
        reviewRequired: Boolean(card.querySelector("[data-part-review]")?.checked),
        studentAssignable: true,
        items
      };
    });

    return {
      ...existing,
      id: lessonId,
      title: root.querySelector("[data-lesson-title]")?.value.trim() || "",
      step: root.querySelector("[data-lesson-step]")?.value.trim() || "",
      substep: root.querySelector("[data-lesson-substep]")?.value.trim() || "",
      lessonFocus: root.querySelector("[data-lesson-focus]")?.value.trim() || "",
      groupId: root.querySelector("[data-lesson-group]")?.value || existing.groupId,
      teacherNotes: root.querySelector("[data-lesson-notes]")?.value.trim() || "",
      parts
    };
  }

  function saveLessonDetail(root, lessonId) {
    const lesson = collectLessonFromForm(root, lessonId);
    const saved = V2.saveLessonPlan(lesson);
    renderTeacherLesson(root);
    showToast(`Saved ${saved.title}`);
    return saved;
  }

  function bindLessonDetailEvents(root, lessonId) {
    root.querySelector("[data-save-lesson]")?.addEventListener("click", () => {
      try {
        saveLessonDetail(root, lessonId);
      } catch (error) {
        showToast(error.message);
      }
    });

    root.querySelector("[data-add-part]")?.addEventListener("click", () => {
      try {
        saveLessonDetail(root, lessonId);
        V2.addLessonPart(lessonId, {
          name: "New Lesson Part",
          skillType: "practice",
          activityType: "custom",
          deliveryMode: "teacher-led",
          instructions: "Teacher-created part.",
          masteryImpact: false,
          reviewRequired: false,
          items: []
        });
        renderTeacherLesson(root);
        showToast("Added lesson part");
      } catch (error) {
        showToast(error.message);
      }
    });

    root.querySelectorAll("[data-part-card]").forEach((card) => {
      const partId = card.dataset.partId;
      card.querySelector("[data-remove-part]")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        V2.removeLessonPart(lessonId, partId);
        renderTeacherLesson(root);
        showToast("Removed lesson part");
      });
      card.querySelectorAll("[data-move-part]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          V2.reorderLessonParts(lessonId, partId, button.dataset.movePart);
          renderTeacherLesson(root);
        });
      });
      card.querySelector("[data-add-item]")?.addEventListener("click", () => {
        try {
          saveLessonDetail(root, lessonId);
          V2.addLessonItem(lessonId, partId, {
            text: "new item",
            expectedAnswer: "new item",
            itemType: "word",
            skillTag: "practice",
            conceptTag: "teacher-created",
            difficulty: "practice",
            sourceNote: "Teacher-created item",
            masteryImpact: true
          });
          renderTeacherLesson(root);
          showToast("Added lesson item");
        } catch (error) {
          showToast(error.message);
        }
      });
      card.querySelectorAll("[data-remove-item]").forEach((button) => {
        button.addEventListener("click", () => {
          const row = button.closest("[data-item-row]");
          V2.removeLessonItem(lessonId, partId, row?.dataset.itemId || "");
          renderTeacherLesson(root);
          showToast("Removed lesson item");
        });
      });
    });

    root.querySelectorAll("[data-assign-selected]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const dueDate = root.querySelector("[data-assignment-due]")?.value || "";
          const studentIds = [...root.querySelectorAll("[data-assign-student]:checked")].map((input) => input.value);
          const saved = saveLessonDetail(root, lessonId);
          if (!studentIds.length) throw new Error("Select at least one student.");
          const created = V2.assignLessonPlanToStudents({
            lessonPlanId: saved.id,
            groupId: saved.groupId,
            studentIds,
            dueDate,
            createdBy: saved.teacherId
          });
          const count = Array.isArray(created) ? created.length : 1;
          renderTeacherLesson(root);
          showToast(`Assigned to ${count} student${count === 1 ? "" : "s"}`);
        } catch (error) {
          showToast(error.message);
        }
      });
    });

    root.querySelectorAll("[data-assign-group]").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const dueDate = root.querySelector("[data-assignment-due]")?.value || "";
          const saved = saveLessonDetail(root, lessonId);
          const state = V2.loadState();
          const group = state.groups[saved.groupId];
          const created = V2.assignLessonPlanToStudents({
            lessonPlanId: saved.id,
            groupId: saved.groupId,
            studentIds: group?.studentIds || saved.studentIds || [],
            dueDate,
            createdBy: saved.teacherId
          });
          const count = Array.isArray(created) ? created.length : 1;
          renderTeacherLesson(root);
          showToast(`Assigned whole group (${count})`);
        } catch (error) {
          showToast(error.message);
        }
      });
    });
  }

  function renderStudent(root) {
    const state = V2.loadState();
    const students = values(state.students);
    const savedId = localStorage.getItem(SELECTED_STUDENT_KEY);
    const selected = state.students[savedId] || students[0];
    if (!selected) {
      root.innerHTML = `<section class="v2-panel"><h1>Student shell</h1><p class="v2-muted">No demo students are available.</p></section>`;
      return;
    }
    localStorage.setItem(SELECTED_STUDENT_KEY, selected.id);
    const assignments = V2.getAssignmentsForStudent(selected.id);

    root.innerHTML = `
      <section class="v2-student-banner">
        <div class="v2-student-id">
          ${studentAvatar(selected)}
          <div>
            <p class="v2-eyebrow">Student mode</p>
            <h1>${escapeHtml(selected.nickname)}</h1>
            <p>Step ${escapeHtml(selected.currentStep)} | Substep ${escapeHtml(selected.currentSubstep)}</p>
          </div>
        </div>
        <label class="v2-select-inline">
          Demo profile
          <select id="v2StudentSelect">
            ${students.map((student) => `<option value="${escapeHtml(student.id)}" ${student.id === selected.id ? "selected" : ""}>${escapeHtml(student.nickname)} - ${escapeHtml(student.avatarId)}</option>`).join("")}
          </select>
        </label>
      </section>

      <section class="v2-panel">
        <div class="v2-section-heading">
          <div>
            <p class="v2-eyebrow">Assignments</p>
            <h2>Quest Queue</h2>
          </div>
          <span class="v2-pill">${assignments.length} ready</span>
        </div>
        ${studentAssignmentCards(state, selected, assignments)}
      </section>
    `;

    byId("v2StudentSelect")?.addEventListener("change", (event) => {
      localStorage.setItem(SELECTED_STUDENT_KEY, event.target.value);
      renderStudent(root);
    });
  }

  function studentAssignmentCards(state, student, assignments) {
    if (!assignments.length) {
      return `<div class="v2-empty">No assignments yet for ${escapeHtml(student.nickname)}.</div>`;
    }
    return `
      <div class="v2-quest-list">
        ${assignments.map((assignment) => {
          const lesson = state.lessonPlans[assignment.lessonId];
          return `
            <article class="v2-quest-card">
              <div>
                <div class="v2-card-title">${escapeHtml(lesson?.title || "Lesson")}</div>
                <div class="v2-card-meta">Step ${escapeHtml(assignment.step)} | Substep ${escapeHtml(assignment.substep)}</div>
              </div>
              <ul class="v2-activity-list">
                ${(assignment.activityConfigs || assignment.activities || []).map((activity) => `
                  <li>
                    <span>${escapeHtml(activity.title)}</span>
                    <small>${escapeHtml(activity.type)} | ${escapeHtml(formatStatus(activity.deliveryMode))}</small>
                  </li>
                `).join("")}
              </ul>
              <div class="v2-card-actions">${statusPill(assignment.status)}</div>
            </article>
          `;
        }).join("")}
      </div>
    `;
  }

  function render() {
    const root = byId("v2App");
    if (!root || !V2) return;
    const view = document.body.dataset.v2View || "home";
    if (view === "teacher") renderTeacher(root);
    else if (view === "teacherLesson") renderTeacherLesson(root);
    else if (view === "student") renderStudent(root);
    else renderHome(root);
  }

  document.addEventListener("DOMContentLoaded", render);
})();
