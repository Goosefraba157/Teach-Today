(async function () {
  "use strict";
  const bootstrapScript = document.currentScript;
  const defaultScripts = [
    "app.js?v=20260910-stage-drive-1",
    "sync-safety.js?v=20260828-roster-membership-2",
    "section9-passage-companions.js?v=section9-companion-7",
    "developer-access.js",
    "teach-today.js?v=20260910-native-route-1",
    "pwa-register.js",
    "onboarding.js?v=lesson-assistant-3",
    "add-group.js?v=20260828-roster-membership-2"
  ];
  const scripts = bootstrapScript?.dataset.scripts
    ? bootstrapScript.dataset.scripts.split("|").filter(Boolean)
    : defaultScripts;
  function showFailure(error) {
    const notice = document.createElement("div");
    notice.setAttribute("role", "alert");
    notice.style.cssText = "position:fixed;top:8px;left:8px;right:8px;z-index:2147483647;padding:16px;background:#fff1f2;color:#881337;border:2px solid #be123c;border-radius:12px;font:600 16px/1.4 system-ui;";
    notice.textContent = `Teach Today could not safely open its Stage database. Do not clear app data or reinstall Stage. ${error?.message || error}`;
    document.body.appendChild(notice);
  }
  try {
    await window.TeachTodayStageStorage.prepareBoot();
    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Required app file did not load: ${src}`));
        document.body.appendChild(script);
      });
    }
  } catch (error) {
    showFailure(error);
  }
})();
