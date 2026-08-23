(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TeachTodaySyncSafety = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEVICE_STATE_KEYS = [
    "selectedGroupId",
    "activeSchoolYearId",
    "openLessonTabs",
    "lessonScrollPositions"
  ];

  const ENTITY_ARRAY_KEYS = new Set([
    "groups",
    "masterRecords",
    "rosterStudents",
    "schoolYears",
    "history",
    "chartResults",
    "dictationMisses",
    "encodingObservations",
    "revisions"
  ]);

  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
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

  function equal(left, right) {
    return canonicalStringify(left) === canonicalStringify(right);
  }

  function signature(value) {
    const text = canonicalStringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${text.length}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function sharedState(state) {
    const shared = clone(state || {}) || {};
    DEVICE_STATE_KEYS.forEach((key) => delete shared[key]);
    delete shared.lastSavedAt;
    (shared.groups || []).forEach((group) => delete group.activeStudent);
    return shared;
  }

  function applySharedState(localState, incomingSharedState) {
    const local = clone(localState || {}) || {};
    const result = clone(incomingSharedState || {}) || {};
    DEVICE_STATE_KEYS.forEach((key) => {
      if (local[key] !== undefined) result[key] = local[key];
    });
    const localGroups = new Map((local.groups || []).map((group) => [group.id, group]));
    (result.groups || []).forEach((group) => {
      const localGroup = localGroups.get(group.id);
      if (localGroup?.activeStudent && (group.students || []).includes(localGroup.activeStudent)) {
        group.activeStudent = localGroup.activeStudent;
      } else if (!group.activeStudent) {
        group.activeStudent = group.students?.[0] || "";
      }
    });
    if (!(result.groups || []).some((group) => group.id === result.selectedGroupId)) {
      result.selectedGroupId = result.groups?.[0]?.id || "";
    }
    if (!(result.schoolYears || []).some((year) => year.id === result.activeSchoolYearId)) {
      result.activeSchoolYearId = result.schoolYears?.find((year) => year.status === "active")?.id
        || result.schoolYears?.[0]?.id
        || "";
    }
    return result;
  }

  function itemIdentity(arrayKey, item, index) {
    if (!item || typeof item !== "object") return null;
    if (arrayKey === "rosterStudents" && item.studentId) return `student:${item.studentId}`;
    if (item.id) return `id:${item.id}`;
    if (item.planId) return `plan:${item.planId}`;
    if (item.studentId && (item.date || item.createdAt || item.savedAt)) {
      return `record:${item.studentId}:${item.date || item.createdAt || item.savedAt}:${item.section || item.kind || item.type || ""}`;
    }
    if (arrayKey === "schoolYears" && item.id) return `year:${item.id}`;
    return item._syncIdentity ? `sync:${item._syncIdentity}` : null;
  }

  function mergePrimitiveArray(base, local, remote) {
    const baseKeys = new Set((base || []).map(canonicalStringify));
    const localKeys = new Set((local || []).map(canonicalStringify));
    const remoteKeys = new Set((remote || []).map(canonicalStringify));
    const values = new Map();
    [...(remote || []), ...(local || []), ...(base || [])].forEach((item) => values.set(canonicalStringify(item), item));
    const resultKeys = [];
    values.forEach((item, key) => {
      const was = baseKeys.has(key);
      const inLocal = localKeys.has(key);
      const inRemote = remoteKeys.has(key);
      const keep = inLocal === inRemote ? inLocal : (inLocal !== was ? inLocal : inRemote);
      if (keep) resultKeys.push(key);
    });
    return resultKeys.map((key) => clone(values.get(key)));
  }

  function mergeEntityArray(base, local, remote, path, conflicts) {
    const arrayKey = path[path.length - 1] || "";
    const maps = [base || [], local || [], remote || []].map((items) => {
      const map = new Map();
      items.forEach((item, index) => {
        const identity = itemIdentity(arrayKey, item, index);
        if (identity) map.set(identity, item);
      });
      return map;
    });
    if ([base || [], local || [], remote || []].some((items, listIndex) => maps[listIndex].size !== items.length)) {
      return mergePrimitiveArray(base, local, remote);
    }
    const order = [];
    [...(remote || []), ...(local || []), ...(base || [])].forEach((item, index) => {
      const identity = itemIdentity(arrayKey, item, index);
      if (identity && !order.includes(identity)) order.push(identity);
    });
    return order.flatMap((identity) => {
      const merged = mergeValue(maps[0].get(identity), maps[1].get(identity), maps[2].get(identity), [...path, identity], conflicts);
      return merged === undefined ? [] : [merged];
    });
  }

  function mergeValue(base, local, remote, path, conflicts) {
    if (equal(local, remote)) return clone(local);
    if (equal(local, base)) return clone(remote);
    if (equal(remote, base)) return clone(local);

    if (Array.isArray(local) && Array.isArray(remote)) {
      const arrayKey = path[path.length - 1] || "";
      return ENTITY_ARRAY_KEYS.has(arrayKey)
        ? mergeEntityArray(Array.isArray(base) ? base : [], local, remote, path, conflicts)
        : mergePrimitiveArray(Array.isArray(base) ? base : [], local, remote);
    }

    const localObject = local && typeof local === "object" && !Array.isArray(local);
    const remoteObject = remote && typeof remote === "object" && !Array.isArray(remote);
    const baseObject = base && typeof base === "object" && !Array.isArray(base);
    if (localObject && remoteObject) {
      const keys = new Set([
        ...Object.keys(baseObject ? base : {}),
        ...Object.keys(local),
        ...Object.keys(remote)
      ]);
      const result = {};
      keys.forEach((key) => {
        const merged = mergeValue(baseObject ? base[key] : undefined, local[key], remote[key], [...path, key], conflicts);
        if (merged !== undefined) result[key] = merged;
      });
      return result;
    }

    conflicts.push(path.join("."));
    return clone(remote);
  }

  function mergePayloads(basePayload, localPayload, remotePayload) {
    const conflicts = [];
    const base = basePayload || {};
    const local = localPayload || {};
    const remote = remotePayload || {};
    const appState = mergeValue(base.appState || {}, local.appState || {}, remote.appState || {}, ["appState"], conflicts);
    const section2CardOverrides = mergeValue(
      base.section2CardOverrides || {},
      local.section2CardOverrides || {},
      remote.section2CardOverrides || {},
      ["section2CardOverrides"],
      conflicts
    );
    return { appState, section2CardOverrides, conflicts: [...new Set(conflicts)] };
  }

  return {
    DEVICE_STATE_KEYS,
    applySharedState,
    canonicalStringify,
    clone,
    equal,
    mergePayloads,
    sharedState,
    signature
  };
});
