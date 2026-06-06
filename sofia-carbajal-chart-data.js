(function () {
  const group = {
    id: "grp-c",
    name: "Allen Sofia 3.5",
    school: "Gabe P. Allen Elementary",
    time: "10:20 - 11:20",
    substep: "3.5",
    meetingDays: 5,
    readerLevel: "AB",
    pageProgress: { wordlist: 0, sentences: 0, passage: 0 },
    warmupRepeat: null,
    activeStudent: "Sofia",
    students: ["Juan", "Sofia", "Alesander", "Linda", "Joshua"],
    trouble: [],
    note: "",
    chartResults: [],
    history: []
  };

  const entries = [
    ["2025-09-02", "2-Sep", "2.5", "R", 14, 0, "tapped", ["twelfth/tweef"]],
    ["2025-09-04", "9/4/25", "2.5", "R", 14, 0, "tapped", ["stress/stres"]],
    ["2025-09-10", "10-Sep", "2.5", "R", 14, 0, "acc/tapped; O/T", ["stresses"]],
    ["2025-09-23", "9/23/25", "3.1", "R", 11, 0, "acc/labored decoding", ["dishnap/dishmip", "nutshell/sunshell", "bedbug/big bug", "catnap/camp"]],
    ["2025-10-01", "10/1/25", "3.1", "R", 12, 120, "good syl div/tapped; 2min", ["nutmeg/nut-mug", "attic/attric", "rubbish/reb ish"]],
    ["2025-10-20", "10/20/25", "3.1", "R", 14, 0, "acc", ["napkin/mapkin"]],
    ["2025-10-27", "10/27/25", "3.1", "R", 11, 0, "acc improving speed", ["limits/milit", "robin/trop", "rapid/rap", "exam/nexham"]],
    ["2025-10-30", "10/30/25", "3.1", "R", 12, 0, "still taps some syllables; 2 min", ["tennis/tennish", "catfish/caf-fish", "muf-fin/muf(s/c)"]],
    ["2025-11-03", "11/3/25", "3.1", "R", 12, 0, "still taps/struggles with suffixes", ["cobwebs (blending correctly)", "robins/troblits", "indexes/indexs"]],
    ["2025-11-06", "11/6/25", "3.1", "R", 14, 120, "acc; 2 min", ["level (blending correctly)"]],
    ["2025-11-11", "11/11/25", "3.1", "R", 14, 120, "acc; 2 min/not yet auto", ["jacket/jacket"]],
    ["2025-12-08", "12/8/25", "3.1", "R", 12, 0, "labored decoding; a bit slower; O/T", ["canyons/can-ons", "medals/me-dal", "atoms/atmos"]],
    ["2026-01-07", "1/7/26", "3.1", "R", 14, 0, "accurate; pfx are easy", ["unshut (u/i discrimination)"]],
    ["2026-02-02", "2/2/26", "3.2", "R", 12, 0, "labored decoding", ["wildcat/wildcat", "kickstand/kicksant (st blend)", "bobsled (skipped)"]],
    ["2026-02-03", "2/3/26", "3.2", "R", 14, 0, "some tapping/acc/labored decoding; O/T", ["subtrend/subtren (C. Blend)"]],
    ["2026-02-06", "2/6/26", "3.2", "R", 12, 0, "struggles with consonant blends", ["consist/conset", "constant/consand", "absent/abset"]],
    ["2026-02-13", "2/13/26", "3.2", "R", 12, 0, "labored decoding/tapped", ["distant (omit /t/)", "consist (blends /st/)", "mistrend (added a sound)"]],
    ["2026-02-13", "2/13/26", "3.2", "R", 12, 0, "labored decoding/tapped", ["exists (exist)", "handbags (added sound)", "statuses (blending)"]],
    ["2026-02-17", "2/17/26", "3.2", "N", 10, 0, "blends/tapped", ["timplet (timplet, blend)", "glisset (glist)", "contimp (contip, blends)", "clemast (kemast, blends)", "demest (dremest, added sound)"]],
    ["2026-03-03", "3/3/26", "3.3", "R", 10, 88, "syl div helps lots before read; tapped; 1:28", ["effect (effict, e/i)", "prospect", "constrict (consect)", "affect (affrect, S/C)", "extinct (extent)"]],
    ["2026-03-10", "3/10/26", "3.3", "R", 13, 0, "very acc/tapped", ["products (prodricks)", "expects (expans, S/C)"]],
    ["2026-03-23", "3/23/26", "3.4", "R", 11, 0, "omits middle syllable", ["recommend", "exhibit", "shipbottom", "lexingong"]],
    ["2026-03-30", "3/30/26", "3.4", "R", 12, 60, "labored decoding but great acc syl div; 1 min", ["midatlantic (misestablish)", "misedit (blending, omitted middle)", "disinvest (disinvent)"]]
  ];

  function recommendation(correct, seconds) {
    if (correct < 12) return "Repeat same page next lesson";
    if (seconds && seconds <= 35 && correct >= 12) return "Advance page; automaticity met";
    if (correct >= 14) return "Advance page; keep brief fluency warm-up";
    return "Advance carefully; repeat as warm-up";
  }

  function makeRecord(entry, index) {
    const [isoDay, displayDate, substep, wordType, correct, seconds, notes, wrongWords] = entry;
    const chartHalf = wordType === "N" ? "bottom" : "top";
    const total = 15;
    const wrongCount = Math.max(total - correct, 0);
    const accuracy = correct >= 12;
    const fluency = correct >= 14;
    const automaticity = accuracy && seconds > 0 && seconds <= 35;
    const wcpm = seconds ? Math.round((correct / seconds) * 60) : 0;
    return {
      id: `sofia-carbajal-chart-${isoDay}-${index + 1}`,
      date: `${isoDay}T12:00:00.000-05:00`,
      displayDate,
      group: group.name,
      groupId: group.id,
      student: "Sofia",
      substep,
      concept: wordType === "N" ? "Nonsense words" : "Real words",
      reader: Number(String(substep).split(".")[0]) || "",
      level: "AB",
      wordlistPage: "",
      chartHalf,
      correct,
      wrongCount,
      total,
      seconds,
      wcpm,
      accuracy,
      fluency,
      automaticity,
      wrongWords,
      wordRecords: wrongWords.map((word) => ({ word, section: chartHalf, correct: false, said: "" })),
      notes,
      recommendation: recommendation(correct, seconds),
      source: "WRS Wordlist Chart import"
    };
  }

  const records = entries.map(makeRecord);

  window.sofiaCarbajalChartData = { group, records };
  window.mergeSofiaCarbajalChartData = function mergeSofiaCarbajalChartData(state) {
    if (!state || typeof state !== "object") return state;
    state.masterRecords ||= [];
    state.groups ||= [];
    let sofiaGroup = state.groups.find((item) => item.id === group.id || item.name === group.name);
    if (!sofiaGroup) {
      sofiaGroup = JSON.parse(JSON.stringify(group));
      state.groups.push(sofiaGroup);
    }
    if (!state.selectedGroupId) state.selectedGroupId = group.id;
    sofiaGroup.students ||= group.students.slice();
    if (!sofiaGroup.students.includes("Sofia")) sofiaGroup.students.push("Sofia");
    sofiaGroup.activeStudent ||= "Sofia";

    const existingIds = new Set(state.masterRecords.map((record) => record.id));
    records.forEach((record) => {
      if (!existingIds.has(record.id)) state.masterRecords.push(JSON.parse(JSON.stringify(record)));
    });

    if (sofiaGroup) {
      sofiaGroup.chartResults ||= [];
      const existingResults = new Set(sofiaGroup.chartResults.map((item) => `${item.date}|${item.substep}|${item.chartHalf}|${item.correct}|${item.seconds}`));
      records.forEach((record) => {
        const key = `${record.displayDate}|${record.substep}|${record.chartHalf}|${record.correct}|${record.seconds}`;
        if (existingResults.has(key)) return;
        sofiaGroup.chartResults.push({
          date: record.displayDate,
          substep: record.substep,
          level: record.level,
          page: record.wordlistPage,
          chartHalf: record.chartHalf,
          correct: record.correct,
          wrongCount: record.wrongCount,
          seconds: record.seconds,
          wcpm: record.wcpm,
          accuracy: record.accuracy,
          fluency: record.fluency,
          automaticity: record.automaticity,
          labels: [record.accuracy && "accuracy", record.fluency && "fluency", record.automaticity && "automaticity"].filter(Boolean),
          decision: record.recommendation
        });
      });
    }
    return state;
  };
})();
