(function () {
  "use strict";

  // These named tester profiles keep all of their real progress data; this only bypasses UI locks.
  const TESTER_NAMES = new Set(["maya", "jordan", "eli"]);

  function nameTokens(profile) {
    return [profile?.name, profile?.fullName]
      .filter(Boolean)
      .flatMap((value) => String(value).toLowerCase().split(/[^a-z]+/).filter(Boolean));
  }

  function isNamedTester(profile) {
    return nameTokens(profile).some((token) => TESTER_NAMES.has(token));
  }

  function hasUrlOverride(search = location.search) {
    const params = new URLSearchParams(search || "");
    return params.get("developer") === "1" || params.get("dev") === "1";
  }

  function isEnabled(profile, search = location.search) {
    return Boolean(profile?.developerMode === true || isNamedTester(profile) || hasUrlOverride(search));
  }

  window.TTStudentDeveloperAccess = {
    testerNames: [...TESTER_NAMES],
    isNamedTester,
    hasUrlOverride,
    isEnabled
  };
})();
