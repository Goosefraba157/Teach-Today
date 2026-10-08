/* Public district dates; private day reasons are supplied by the app at runtime. */
(function (root) {
  const source = "https://resources.finalsite.net/images/v1781797574/dallasisdorg/gujbdfv7mcxncagtw6bi/District-Calendar.pdf";
  const events = [
    ["2026-07-04", "2026-07-04", "Independence Day"],
    ["2026-08-03", "2026-08-06", "Staff Development"],
    ["2026-08-07", "2026-08-07", "Teacher Workday"],
    ["2026-08-10", "2026-08-10", "Teacher Workday"],
    ["2026-09-07", "2026-09-07", "Labor Day"],
    ["2026-10-08", "2026-10-09", "Fall Break"],
    ["2026-10-12", "2026-10-12", "Staff Development"],
    ["2026-11-03", "2026-11-03", "Staff Development"],
    ["2026-11-23", "2026-11-27", "Thanksgiving Break"],
    ["2026-12-21", "2027-01-04", "Winter Break"],
    ["2027-01-05", "2027-01-05", "Staff Development"],
    ["2027-01-18", "2027-01-18", "Martin Luther King Jr. Day"],
    ["2027-02-15", "2027-02-15", "Presidents Day"],
    ["2027-03-15", "2027-03-19", "Spring Break"],
    ["2027-03-26", "2027-03-26", "District Holiday"],
    ["2027-05-27", "2027-05-27", "Teacher Workday"],
    ["2027-05-31", "2027-05-31", "Memorial Day"],
    ["2027-06-19", "2027-06-19", "Juneteenth"]
  ];
  const reasons = ["DI unavailable", "Staff development", "Campus assessment (SMC)", "Weather closure", "School activity"];
  function district(date, year) {
    if (year !== "2026-2027") return null;
    const event = events.find(([start, end]) => date >= start && date <= end);
    if (event) return { label: event[2], blackout: true };
    if (["2027-03-29", "2027-04-19"].includes(date)) return { label: "Weather makeup day", blackout: false };
    return null;
  }
  function groups(state, year) {
    return (state.groups || []).filter((g) => g.schoolYearId === year && !g.isDemo && !g.isDemoGroup && !/^(demo|sample)\b/i.test(g.name || ""));
  }
  function resolved(state, group, date) {
    const session = state.attendanceSessions?.[group.id]?.[date];
    return ["confirmed", "no-session"].includes(session?.status) || Boolean(group.attendanceDayReasons?.[date]?.reason);
  }
  function review(state, year, date, today) {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const eligible = year === "2026-2027" && date >= "2026-08-11" && date <= "2027-05-26"
      && date < today && weekday >= 1 && weekday <= 4 && !district(date, year)?.blackout;
    const expected = groups(state, year).filter((g) => {
      const history = g.membershipHistory || [];
      return history.length ? history.some((m) => (!m.startedOn || m.startedOn <= date) && (!m.endedOn || m.endedOn >= date)) : (g.students || []).length > 0;
    });
    const missing = eligible ? expected.filter((g) => !resolved(state, g, date)) : [];
    return { eligible, expected: expected.length, resolved: expected.length - missing.length, missing };
  }
  function reasonChange(group, session, date, reason, note, students, at) {
    if (session?.status === "confirmed" || session?.status === "no-session") return null;
    const previous = group.attendanceDayReasons?.[date];
    return { date, reason, note, students, updatedAt: at,
      audit: [...(previous?.audit || []), { at, reason, note, previousReason: previous?.reason || "", previousNote: previous?.note || "" }] };
  }
  const api = { source, events, reasons, district, groups, resolved, review, reasonChange };
  root.TeachTodayAttendanceCalendar = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
