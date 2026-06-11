(function () {
  const RETURN_KEY = "teachToday.returnSpot.v1";
  const RESTORE_KEY = "teachToday.restoreSpot.v1";
  const SAME_ORIGIN_PROTOCOLS = new Set(["http:", "https:", "file:"]);

  function scriptBaseUrl() {
    const script = document.currentScript || Array.from(document.scripts).find((item) => /app-nav\.js(?:\?|$)/.test(item.src));
    return script ? new URL("./", script.src) : new URL("./", location.href);
  }

  const APP_BASE = scriptBaseUrl();

  function sameAppUrl(url) {
    if (!SAME_ORIGIN_PROTOCOLS.has(url.protocol)) return false;
    if (url.origin !== location.origin) return false;
    return url.href.startsWith(APP_BASE.href);
  }

  function currentSpot() {
    return {
      url: location.href,
      x: Math.round(window.scrollX || 0),
      y: Math.round(window.scrollY || 0),
      title: document.title || "",
      at: Date.now()
    };
  }

  function rememberSpot() {
    try {
      sessionStorage.setItem(RETURN_KEY, JSON.stringify(currentSpot()));
    } catch (_) {}
  }

  function readSpot(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null");
    } catch (_) {
      return null;
    }
  }

  function normalizeUrl(value) {
    try {
      return new URL(value, location.href);
    } catch (_) {
      return null;
    }
  }

  function samePage(a, b) {
    return a && b && a.origin === b.origin && a.pathname === b.pathname && a.search === b.search && a.hash === b.hash;
  }

  function fallbackUrl() {
    const path = location.pathname;
    if (/\/Games\/(?!index\.html$)/.test(path)) return new URL("Games/index.html", APP_BASE).href;
    if (/\/(?:PdfViewer|ReferencePdfs)\.html$/.test(path)) return new URL("ReferencePdfs.html", APP_BASE).href;
    return new URL("TeachToday.html", APP_BASE).href;
  }

  function restoreIfNeeded() {
    const spot = readSpot(RESTORE_KEY);
    if (!spot?.url) return;
    const spotUrl = normalizeUrl(spot.url);
    const here = normalizeUrl(location.href);
    if (!samePage(spotUrl, here)) return;
    try {
      sessionStorage.removeItem(RESTORE_KEY);
    } catch (_) {}
    requestAnimationFrame(() => {
      window.scrollTo({ left: Number(spot.x) || 0, top: Number(spot.y) || 0, behavior: "auto" });
    });
  }

  function goBack() {
    const stored = readSpot(RETURN_KEY);
    if (stored?.url) {
      try {
        sessionStorage.setItem(RESTORE_KEY, JSON.stringify(stored));
      } catch (_) {}
    }
    const referrer = normalizeUrl(document.referrer);
    if (referrer && sameAppUrl(referrer) && history.length > 1) {
      history.back();
      return;
    }
    if (stored?.url) {
      location.href = stored.url;
      return;
    }
    location.href = fallbackUrl();
  }

  function shouldRememberLink(anchor) {
    const href = anchor?.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = normalizeUrl(href);
    return !!url && sameAppUrl(url);
  }

  function installClickMemory() {
    document.addEventListener("click", (event) => {
      const backButton = event.target.closest?.("[data-tt-app-back]");
      if (backButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        goBack();
        return;
      }
      const anchor = event.target.closest?.("a[href]");
      if (anchor && shouldRememberLink(anchor)) rememberSpot();
      const navigatingButton = event.target.closest?.("button, [role='button']");
      if (navigatingButton && !backButton) rememberSpot();
    }, true);
  }

  function installBackButton() {
    if (!document.querySelector(".tt-app-home")) {
      const home = document.createElement("a");
      home.className = "tt-app-home";
      home.href = new URL("TeachToday.html", APP_BASE).href;
      home.setAttribute("aria-label", "Go to Teach Today Home");
      home.innerHTML = `<img src="${new URL("assets/morrocoy-logo.png", APP_BASE).href}" alt="">`;
      if (document.body.dataset.appSurface === "game") home.classList.add("tt-game-home");
      document.body.appendChild(home);
    }

    if (!document.querySelector(".tt-app-back")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tt-app-back";
      button.dataset.ttAppBack = "true";
      button.setAttribute("aria-label", "Go back");
      button.innerHTML = `<span class="tt-app-back-icon" aria-hidden="true">‹</span><span>Back</span>`;
      if (document.body.dataset.appSurface === "game") button.classList.add("tt-game-back");
      document.body.appendChild(button);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    restoreIfNeeded();
    installClickMemory();
    installBackButton();
  });
})();
