/* Read-only EdPlan reporting. No student names or identifiers are bundled. */
(function (root) {
  function build(state, skills, options = {}) {
    const year = options.year || state.activeSchoolYearId;
    const start = options.start || `${String(year).slice(0, 4)}-07-01`;
    const end = options.end || `${Number(String(year).slice(0, 4)) + 1}-06-30`;
    const validDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T12:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };
    if (!validDate(start) || !validDate(end) || start > end) throw new Error("Choose a valid start and end date.");
    const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
    const groups = (state.groups || []).filter((group) => group.schoolYearId === year && !group.isDemo && !group.isDemoGroup && !/^(demo|sample)\b/i.test(group.name || ""));
    const profiles = state.rosterStudents || [];
    const students = new Map(), days = new Map();
    const resolve = (group, name, id = "") => {
      const matches = profiles.filter((row) => [row.name, row.fullName, row.displayName, ...(row.aliases || [])].some((alias) => alias && normalize(alias) === normalize(name)));
      id ||= group.studentIds?.[name] || (matches.length === 1 ? matches[0].studentId : "") || "";
      const profile = id ? profiles.find((row) => row.studentId === id) : null;
      name = profile?.name || profile?.fullName || profile?.displayName || name || "Student";
      const key = id || `group:${group.id}:name:${normalize(name)}`;
      if (!students.has(key)) students.set(key, { key, name, group: group.name || "Group", orderKey: id || `name:${String(name).toLowerCase().replace(/[^a-z]/g, "")}` });
      return key;
    };
    let records = 0, missingLinks = 0, unconfirmed = 0;
    groups.forEach((group) => {
      (group.students || []).forEach((name) => resolve(group, name));
      Object.entries(state.attendanceSessions?.[group.id] || {}).forEach(([date, session]) => {
        if (!validDate(date) || date < start || date > end) return;
        if (session.status !== "confirmed") { if (session.status !== "no-session") unconfirmed++; return; }
        const planIds = [...new Set([...(session.planIds || []), ...(session.combinedPlanIds || [])])];
        const plans = planIds.map((id) => (group.history || []).find((plan) => plan.id === id));
        const substeps = [...new Set(plans.filter(Boolean).map((plan) => plan.lessons?.[0]?.substep || plan.substep).filter(Boolean))];
        const incomplete = !plans.length || plans.some((plan) => !plan || !(plan.lessons?.[0]?.substep || plan.substep));
        const descriptions = substeps.map((substep) => {
          const skill = (skills || []).find((item) => item.id === substep);
          return `${substep} - ${skill ? [skill.title, skill.target].filter(Boolean).join(": ") : "Description unavailable"}`;
        });
        if (incomplete) descriptions.push("Present — substep not linked");
        const byId = session.attendanceByStudentId || {};
        const entries = new Map();
        Object.entries(session.attendance || {}).forEach(([name, value]) => {
          const key = resolve(group, name);
          entries.set(key, Object.prototype.hasOwnProperty.call(byId, key) ? byId[key] : value);
        });
        Object.entries(byId).forEach(([id, value]) => {
          const name = Object.entries(group.studentIds || {}).find(([, studentId]) => studentId === id)?.[0];
          const profile = profiles.find((row) => row.studentId === id);
          if (!name && !profile && !students.has(id)) throw new Error("A saved attendance student has no display name. Review attendance before exporting.");
          entries.set(resolve(group, name || students.get(id)?.name, id), value);
        });
        entries.forEach((present, key) => {
          if (present !== true && present !== false) return;
          if (!days.has(date)) days.set(date, new Map());
          const cells = days.get(date);
          if (!cells.has(key)) cells.set(key, new Set());
          cells.get(key).add(present ? descriptions.join("; ") : "Absent");
          records++;
          if (present && incomplete) missingLinks++;
        });
      });
    });
    const ordered = [...students.values()];
    const order = options.order || [];
    ordered.sort((a, b) => {
      const ai = order.indexOf(a.orderKey), bi = order.indexOf(b.orderKey);
      return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi);
    });
    const names = new Map();
    ordered.forEach((student) => names.set(student.name, (names.get(student.name) || 0) + 1));
    const usedHeaders = new Map();
    const rows = [["Date", ...ordered.map((student) => {
      const label = names.get(student.name) > 1 ? `${student.name} (${student.group})` : student.name;
      const count = (usedHeaders.get(label) || 0) + 1;
      usedHeaders.set(label, count);
      return count > 1 ? `${label} #${count}` : label;
    })]];
    [...days.keys()].sort().forEach((date) => {
      rows.push([`${date.slice(5, 7)}/${date.slice(8, 10)}/${date.slice(0, 4)}`, ...ordered.map((student) => {
        const values = [...(days.get(date).get(student.key) || [])];
        if (values.length > 1 && values.includes("Absent")) return `Review attendance: ${values.join(" | ")}`;
        return values.join("; ");
      })]);
    });
    const csv = rows.map((row) => row.map((value) => {
      const text = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
      return `"${text.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    return { csv, rows, students: ordered.length, dates: days.size, records, missingLinks, unconfirmed, start, end };
  }
  root.TeachTodayAttendanceExport = { build };
  if (typeof module !== "undefined") module.exports = { build };
})(typeof window !== "undefined" ? window : globalThis);
