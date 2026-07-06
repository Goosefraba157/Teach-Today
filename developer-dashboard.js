(function () {
  "use strict";

  const access = window.TTDeveloperAccess;
  const sections = Array.isArray(window.TT_DEVELOPER_MENU) ? window.TT_DEVELOPER_MENU : [];

  const dom = {
    gate: document.getElementById("devAccessGate"),
    dashboard: document.getElementById("devDashboard"),
    code: document.getElementById("developerCode"),
    unlock: document.getElementById("unlockDevMode"),
    error: document.getElementById("accessError"),
    session: document.getElementById("sessionLabel"),
    lock: document.getElementById("lockDevMode"),
    search: document.getElementById("menuSearch"),
    filters: document.getElementById("menuFilters"),
    menu: document.getElementById("developerMenu"),
    empty: document.getElementById("emptyResults")
  };

  let activeFilter = "all";
  let searchTerm = "";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function withDeveloperParam(href) {
    try {
      return access?.appendDeveloperParams ? access.appendDeveloperParams(href) : new URL(href, location.href).href;
    } catch (_) {
      return href;
    }
  }

  function sectionMatches(section) {
    return activeFilter === "all" || section.id === activeFilter;
  }

  function itemMatches(item, section) {
    if (!searchTerm) return true;
    const haystack = [section.title, section.description, item.title, item.description, item.status, item.href]
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchTerm);
  }

  function renderFilters() {
    const filters = [{ id: "all", title: "All" }, ...sections.map((section) => ({ id: section.id, title: section.title }))];
    dom.filters.innerHTML = filters.map((filter) => `
      <button class="filter-button${filter.id === activeFilter ? " active" : ""}" type="button" data-filter="${escapeHtml(filter.id)}">
        ${escapeHtml(filter.title)}
      </button>
    `).join("");
    dom.filters.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";
        render();
      });
    });
  }

  function renderMenu() {
    let visibleItems = 0;
    dom.menu.innerHTML = sections.map((section) => {
      const items = (section.items || []).filter((item) => sectionMatches(section) && itemMatches(item, section));
      visibleItems += items.length;
      const cards = items.map((item) => {
        const href = withDeveloperParam(item.href);
        return `
          <article class="dev-card">
            <div class="card-top">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="status-pill" data-status="${escapeHtml(item.status || "Core")}">${escapeHtml(item.status || "Core")}</span>
            </div>
            <p>${escapeHtml(item.description)}</p>
            <div class="card-actions">
              <a class="open-link" href="${escapeHtml(href)}">Open</a>
              <button class="copy-link" type="button" data-copy-link="${escapeHtml(href)}" title="Copy link" aria-label="Copy ${escapeHtml(item.title)} link">Copy</button>
            </div>
          </article>
        `;
      }).join("");
      return `
        <section class="menu-section" data-section="${escapeHtml(section.id)}"${items.length ? "" : " hidden"}>
          <div class="section-head">
            <div>
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.description)}</p>
            </div>
            <span class="section-count">${items.length} ${items.length === 1 ? "entry" : "entries"}</span>
          </div>
          <div class="card-grid">${cards}</div>
        </section>
      `;
    }).join("");

    dom.empty.hidden = visibleItems > 0;
    dom.menu.querySelectorAll("[data-copy-link]").forEach((button) => {
      button.addEventListener("click", async () => {
        const link = button.dataset.copyLink || "";
        try {
          await navigator.clipboard.writeText(link);
          button.textContent = "Done";
          setTimeout(() => { button.textContent = "Copy"; }, 1100);
        } catch (_) {
          button.textContent = "Nope";
          setTimeout(() => { button.textContent = "Copy"; }, 1100);
        }
      });
    });
  }

  function render() {
    if (!access?.isEnabled?.()) {
      dom.gate.hidden = false;
      dom.dashboard.hidden = true;
      dom.code?.focus();
      return;
    }

    dom.gate.hidden = true;
    dom.dashboard.hidden = false;
    dom.session.textContent = `Creator mode: ${access.stateLabel()}`;
    renderFilters();
    renderMenu();
  }

  function unlock() {
    const result = access?.unlockWithCode?.(dom.code.value);
    if (!result) {
      dom.error.textContent = "That code does not unlock creator mode.";
      return;
    }
    dom.error.textContent = "";
    dom.code.value = "";
    render();
  }

  dom.unlock.addEventListener("click", unlock);
  dom.code.addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlock();
  });
  dom.lock.addEventListener("click", () => {
    access?.lock?.();
    render();
  });
  dom.search.addEventListener("input", () => {
    searchTerm = dom.search.value.trim().toLowerCase();
    renderMenu();
  });

  render();
})();
