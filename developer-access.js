(function () {
  "use strict";

  const STORAGE_KEY = "teachToday.developerAccess.v1";
  const CUSTOM_CODE_KEY = "teachToday.developerAccessCode.v1";
  const DEFAULT_CODES = ["CREATOR", "TT-CREATOR", "TEACH-TODAY"];
  const QUERY_KEYS = ["developer", "dev", "creator", "master"];

  function normalizeCode(value) {
    return String(value || "").trim().toUpperCase();
  }

  function accessCodes() {
    const custom = localStorage.getItem(CUSTOM_CODE_KEY);
    if (custom && normalizeCode(custom)) return [normalizeCode(custom)];
    return DEFAULT_CODES;
  }

  function readStoredAccess() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.enabled !== true) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function writeStoredAccess(details = {}) {
    const payload = {
      enabled: true,
      method: details.method || "code",
      label: details.label || "Creator",
      unlockedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function clearStoredAccess() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function verifyCode(value) {
    const clean = normalizeCode(value);
    return clean.length > 0 && accessCodes().includes(clean);
  }

  function queryRequestsDeveloper(search = location.search) {
    const params = new URLSearchParams(search || "");
    return QUERY_KEYS.some((key) => {
      const value = params.get(key);
      return value === "1" || value === "true" || value === "yes";
    });
  }

  function unlockWithCode(value) {
    if (!verifyCode(value)) return null;
    return writeStoredAccess({ method: "code", label: "Creator" });
  }

  function isEnabled() {
    return Boolean(readStoredAccess());
  }

  function stateLabel() {
    const saved = readStoredAccess();
    if (!saved) return "Locked";
    return saved.label || "Creator";
  }

  function appendDeveloperParams(href) {
    const url = new URL(href, location.href);
    url.searchParams.set("developer", "1");
    return url.href;
  }

  window.TTDeveloperAccess = {
    storageKey: STORAGE_KEY,
    customCodeKey: CUSTOM_CODE_KEY,
    queryRequestsDeveloper,
    verifyCode,
    unlockWithCode,
    unlock: writeStoredAccess,
    lock: clearStoredAccess,
    isEnabled,
    stateLabel,
    appendDeveloperParams
  };
})();
