#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const GROUP_ARRAY_KEYS = [
  "history",
  "chartResults",
  "encodingObservations",
  "dictationMisses",
  "markedReviewWords",
  "membershipHistory"
];
const TOP_ARRAY_KEYS = ["masterRecords", "historicalWrsReviewNotes"];
const MAP_KEYS = ["lessonDrafts", "attendanceRecords", "attendanceSessions", "attendanceActivity"];

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = canonicalize(value[key]);
    return result;
  }, {});
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

function normalizedName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function studentAliases(student) {
  return [...new Set([student?.name, student?.fullName, student?.displayName]
    .map(normalizedName)
    .filter(Boolean))];
}

function loadBackup(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    payload,
    state: payload.appState || payload,
    filePath
  };
}

function buildStudentIdMap(currentStudents, legacyStudents) {
  const mappings = [];
  const idMap = new Map();
  const ambiguous = [];
  const unmatched = [];

  (legacyStudents || []).forEach((legacyStudent) => {
    const aliases = new Set(studentAliases(legacyStudent));
    const candidates = (currentStudents || []).filter((student) => (
      studentAliases(student).some((name) => aliases.has(name))
    ));
    if (candidates.length !== 1) {
      (candidates.length ? ambiguous : unmatched).push({
        legacyStudentId: legacyStudent.studentId || "",
        displayName: legacyStudent.displayName || legacyStudent.name || "Unknown",
        candidateStudentIds: candidates.map((student) => student.studentId)
      });
      return;
    }
    const current = candidates[0];
    if (legacyStudent.studentId && current.studentId) {
      idMap.set(legacyStudent.studentId, current.studentId);
      mappings.push({
        displayName: current.displayName || current.name || legacyStudent.displayName || legacyStudent.name,
        legacyStudentId: legacyStudent.studentId,
        currentStudentId: current.studentId
      });
    }
  });

  return { idMap, mappings, ambiguous, unmatched };
}

function remapStudentIds(value, idMap) {
  if (Array.isArray(value)) return value.map((item) => remapStudentIds(item, idMap));
  if (!value || typeof value !== "object") {
    return typeof value === "string" && idMap.has(value) ? idMap.get(value) : value;
  }
  return Object.entries(value).reduce((result, [key, item]) => {
    const remappedKey = idMap.get(key) || key;
    result[remappedKey] = remapStudentIds(item, idMap);
    return result;
  }, {});
}

function dateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).trim().toLowerCase() : date.toISOString();
}

function itemIdentity(arrayKey, item) {
  if (!item || typeof item !== "object") return `value:${canonicalStringify(item)}`;
  if (item.id) return `id:${item.id}`;
  if (item.planId) return `plan:${item.planId}`;
  if (arrayKey === "chartResults") {
    return `chart:${[
      item.studentId || item.student || "",
      dateKey(item.date || item.savedAt || item.createdAt),
      item.substep || "",
      item.page || item.wordlistPage || "",
      item.chartHalf || "",
      item.correct ?? "",
      item.wrongCount ?? "",
      item.seconds ?? "",
      item.wcpm ?? "",
      canonicalStringify(item.labels || [])
    ].join("::")}`;
  }
  if (arrayKey === "markedReviewWords") {
    return `review:${[
      item.studentId || item.student || "",
      String(item.word || "").toLowerCase(),
      item.source || "",
      item.substep || "",
      dateKey(item.date || item.savedAt || item.createdAt)
    ].join("::")}`;
  }
  if (item.studentId && (item.date || item.createdAt || item.savedAt)) {
    return `record:${item.studentId}:${dateKey(item.date || item.createdAt || item.savedAt)}:${item.section || item.kind || item.type || ""}:${item.item || ""}`;
  }
  return `exact:${canonicalStringify(item)}`;
}

function appendArrayAdditions(target, source, arrayKey, conflicts = [], pathPrefix = arrayKey) {
  const existing = new Map((target || []).map((item) => [itemIdentity(arrayKey, item), item]));
  const additions = [];
  (source || []).forEach((item) => {
    const identity = itemIdentity(arrayKey, item);
    if (existing.has(identity)) {
      if (canonicalStringify(existing.get(identity)) !== canonicalStringify(item)) {
        conflicts.push(`${pathPrefix}.${identity}`);
      }
      return;
    }
    existing.set(identity, item);
    additions.push(clone(item));
    target.push(clone(item));
  });
  return additions;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergePatchObjects(target, patch) {
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (isPlainObject(target[key]) && isPlainObject(value)) {
      mergePatchObjects(target[key], value);
    } else {
      target[key] = clone(value);
    }
  });
  return target;
}

function addMissingObjectValues(target, source, output, conflicts, pathParts) {
  if (!isPlainObject(source)) return 0;
  let count = 0;
  Object.entries(source).forEach(([key, incoming]) => {
    const currentPath = [...pathParts, key];
    if (!(key in target)) {
      target[key] = clone(incoming);
      output[key] = clone(incoming);
      count += 1;
      return;
    }
    if (isPlainObject(target[key]) && isPlainObject(incoming)) {
      const nested = {};
      const nestedCount = addMissingObjectValues(target[key], incoming, nested, conflicts, currentPath);
      if (nestedCount) output[key] = nested;
      count += nestedCount;
      return;
    }
    if (canonicalStringify(target[key]) !== canonicalStringify(incoming)) {
      conflicts.push(currentPath.join("."));
    }
  });
  return count;
}

function recoverySourceState(source, currentState) {
  if (source.payload.kind !== "TeachTodayLegacyStudentProfileArchive") {
    return { state: clone(source.state), mapping: null };
  }
  const mapping = buildStudentIdMap(currentState.rosterStudents || [], source.state.rosterStudents || []);
  return { state: remapStudentIds(source.state, mapping.idMap), mapping };
}

function buildPreview(currentSource, recoverySources) {
  const currentState = clone(currentSource.state);
  const currentGroupIds = new Set((currentState.groups || []).map((group) => group.id));
  const groupById = new Map((currentState.groups || []).map((group) => [group.id, group]));
  const additions = {
    topLevel: Object.fromEntries(TOP_ARRAY_KEYS.map((key) => [key, []])),
    groups: {},
    maps: Object.fromEntries(MAP_KEYS.map((key) => [key, {}])),
    unresolvedGroups: []
  };
  const report = {
    generatedAt: new Date().toISOString(),
    base: {
      file: path.basename(currentSource.filePath),
      exportedAt: currentSource.payload.exportedAt || null,
      sourceRevisionId: currentSource.payload.source?.revisionId || null
    },
    sources: [],
    totals: { additions: 0, conflictsPreserved: 0, skippedUnknownGroups: 0 },
    warnings: [
      "Preview only: no app, browser, Firebase, or iPad data was changed.",
      "Conflicting current values are preserved; this package contains additions only.",
      "Before any cloud write, preserve the current Firebase main payload as a new immutable recovery revision and verify that its pointer has not changed."
    ]
  };

  recoverySources.forEach((source) => {
    const normalized = recoverySourceState(source, currentState);
    const sourceState = normalized.state;
    const sourceReport = {
      file: path.basename(source.filePath),
      exportedAt: source.payload.exportedAt || null,
      studentIdMappings: normalized.mapping?.mappings || [],
      ambiguousStudents: normalized.mapping?.ambiguous || [],
      unmatchedStudents: normalized.mapping?.unmatched || [],
      additions: {},
      conflictsPreserved: [],
      skippedUnknownGroups: []
    };

    TOP_ARRAY_KEYS.forEach((arrayKey) => {
      currentState[arrayKey] ||= [];
      const newItems = appendArrayAdditions(
        currentState[arrayKey],
        sourceState[arrayKey] || [],
        arrayKey,
        sourceReport.conflictsPreserved,
        arrayKey
      );
      additions.topLevel[arrayKey].push(...newItems);
      sourceReport.additions[arrayKey] = newItems.length;
      report.totals.additions += newItems.length;
    });

    (sourceState.groups || []).forEach((sourceGroup) => {
      if (!currentGroupIds.has(sourceGroup.id)) {
        const hasRecoverableData = GROUP_ARRAY_KEYS.some((key) => (sourceGroup[key] || []).length);
        if (hasRecoverableData) {
          sourceReport.skippedUnknownGroups.push({ groupId: sourceGroup.id, name: sourceGroup.name || "Unknown group" });
          report.totals.skippedUnknownGroups += 1;
          additions.unresolvedGroups.push({
            groupId: sourceGroup.id,
            name: sourceGroup.name || "Unknown group",
            sourceFile: path.basename(source.filePath),
            arrays: Object.fromEntries(GROUP_ARRAY_KEYS
              .filter((key) => (sourceGroup[key] || []).length)
              .map((key) => [key, clone(sourceGroup[key])]))
          });
        }
        return;
      }
      const currentGroup = groupById.get(sourceGroup.id);
      GROUP_ARRAY_KEYS.forEach((arrayKey) => {
        currentGroup[arrayKey] ||= [];
        const newItems = appendArrayAdditions(
          currentGroup[arrayKey],
          sourceGroup[arrayKey] || [],
          arrayKey,
          sourceReport.conflictsPreserved,
          `groups.${sourceGroup.id}.${arrayKey}`
        );
        if (!newItems.length) return;
        additions.groups[sourceGroup.id] ||= { groupId: sourceGroup.id, name: currentGroup.name || sourceGroup.name, arrays: {} };
        additions.groups[sourceGroup.id].arrays[arrayKey] ||= [];
        additions.groups[sourceGroup.id].arrays[arrayKey].push(...newItems);
        sourceReport.additions[`groups.${sourceGroup.id}.${arrayKey}`] = newItems.length;
        report.totals.additions += newItems.length;
      });
    });

    MAP_KEYS.forEach((mapKey) => {
      currentState[mapKey] ||= {};
      const mapAdditions = {};
      const count = addMissingObjectValues(
        currentState[mapKey],
        sourceState[mapKey] || {},
        mapAdditions,
        sourceReport.conflictsPreserved,
        [mapKey]
      );
      if (count) mergePatchObjects(additions.maps[mapKey], mapAdditions);
      sourceReport.additions[mapKey] = count;
      report.totals.additions += count;
    });

    sourceReport.conflictsPreserved = [...new Set(sourceReport.conflictsPreserved)];
    report.totals.conflictsPreserved += sourceReport.conflictsPreserved.length;
    report.sources.push(sourceReport);
  });

  Object.keys(additions.groups).forEach((groupId) => {
    if (!Object.keys(additions.groups[groupId].arrays).length) delete additions.groups[groupId];
  });
  Object.keys(additions.maps).forEach((key) => {
    if (!Object.keys(additions.maps[key]).length) delete additions.maps[key];
  });
  Object.keys(additions.topLevel).forEach((key) => {
    if (!additions.topLevel[key].length) delete additions.topLevel[key];
  });

  return {
    kind: "TeachTodayAdditiveRecoveryPreview",
    version: 1,
    ...report,
    additions
  };
}

function main(argv) {
  if (argv.length < 4) {
    console.error("Usage: node scripts/build-additive-recovery-preview.js CURRENT.json SOURCE.json [SOURCE.json ...] OUTPUT.json");
    process.exitCode = 1;
    return;
  }
  const outputPath = argv[argv.length - 1];
  const currentPath = argv[0];
  const sourcePaths = argv.slice(1, -1);
  const preview = buildPreview(loadBackup(currentPath), sourcePaths.map(loadBackup));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(preview, null, 2)}\n`);
  console.log(JSON.stringify({
    output: outputPath,
    base: preview.base,
    totals: preview.totals,
    sources: preview.sources.map((source) => ({
      file: source.file,
      studentIdMappings: source.studentIdMappings.length,
      ambiguousStudents: source.ambiguousStudents.length,
      unmatchedStudents: source.unmatchedStudents.length,
      additions: Object.values(source.additions).reduce((sum, value) => sum + value, 0),
      conflictsPreserved: source.conflictsPreserved.length,
      skippedUnknownGroups: source.skippedUnknownGroups.length
    }))
  }, null, 2));
}

if (require.main === module) main(process.argv.slice(2));

module.exports = {
  buildPreview,
  buildStudentIdMap,
  itemIdentity,
  remapStudentIds
};
