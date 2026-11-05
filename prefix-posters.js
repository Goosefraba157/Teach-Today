/* Curriculum only: shared teacher, printable sheet and sanitized Stage renderer. */
(function (root) {
  "use strict";
  const groups = [
    { id: "3.1", title: "3.1 · Closed-syllable prefixes", cards: [
      ["mid", "middle", "midship"], ["mis", "wrong, negative", "miscall"], ["trans", "across", "transact"],
      ["tran", "across", "transit"], ["non", "not", "nonstop"], ["un", "not, opposite", "unlock"]
    ] },
    { id: "3.2-first", title: "3.2 · First set", cards: [
      ["dis", "not, apart", "distrust"], ["en", "within, on, cause to be", "enfold"], ["em", "within, on, cause to be", "embed"],
      ["in", "in, into, not", "inland"], ["im", "in, into, not", "imprint"], ["sub", "under", "subplot"]
    ] },
    { id: "3.2", title: "3.2 · Second set", cards: [
      ["ab", "from, away", "abrupt"], ["abs", "from, away", "absent"], ["ad", "to, toward, at", "admit"], ["con", "with, together", "confess"],
      ["com", "with, together", "command"], ["ex", "out of", "exit"], ["ob", "against", "obstruct"]
    ] },
    { id: "4.2", title: "4.2 · Vowel-consonant-e prefix", cards: [["fore", "front", "forecast"]] },
    { id: "5.1", title: "5.1 · Open-syllable prefixes", cards: [
      ["co", "with, together", "cohost"], ["de", "down, away from", "defrost"], ["e", "out of", "eject"],
      ["pre", "before", "pretest"], ["pro", "for, forth", "progress"], ["re", "back, again", "remake"]
    ] },
    { id: "5.5", title: "5.5 · Open-syllable prefix", cards: [["a", "on, in, to", "awake"]] }
  ];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
  function selected(through) {
    const index = groups.findIndex(g => g.id === through);
    return index < 0 ? [] : groups.slice(0, index + 1);
  }
  function defaultThrough(substep) {
    const value = String(substep || "").split(".").map(Number);
    if (value.length !== 2 || value.some(n => !Number.isFinite(n))) return "none";
    return groups.filter(g => { const [a,b] = g.id.split(".").map(Number); return a < value[0] || (a === value[0] && b <= value[1]); }).at(-1)?.id || "none";
  }
  function render(through = "5.5") {
    const list = selected(through);
    return `<article class="prefix-sheet"><header class="prefix-sheet-heading"><h1>Prefixes</h1><p>${list.length ? `Review through ${esc(through === "3.2-first" ? "3.2 · first set" : through)}` : "Choose a review set above"}</p></header>${list.map(g => `<section class="prefix-group"><h2>${esc(g.title)}</h2><div class="prefix-grid">${g.cards.map(([prefix, meaning, word]) => `<article class="prefix-card"><small class="prefix-substep">${esc(g.id.split("-")[0])}</small><strong class="prefix-main">${esc(prefix)}-</strong><div class="prefix-detail"><span>${esc(meaning)}</span><span class="prefix-example"><span class="prefix-circle">${esc(prefix)}</span>${esc(word.slice(prefix.length))}</span></div></article>`).join("")}</div></section>`).join("")}</article>`;
  }
  function options() {
    return `<option value="none">Choose prefixes…</option>` + groups.map(g => `<option value="${g.id}">Through ${esc(g.id === "3.2-first" ? "3.2 · first set" : g.id === "3.2" ? "3.2 · both sets" : g.id)}</option>`).join("");
  }
  function payload(through) {
    return { mode: "cards", displayMode: "cards", groupName: "Teach Today", sourceSection: "section2", cardDisplay: { kind: "prefix-poster", key: `prefix-poster:${through}`, variant: through } };
  }
  function install(hooks) {
    let active = false, through = "none", returnFocus;
    const dialog = document.createElement("dialog");
    dialog.className = "prefix-dialog";
    dialog.setAttribute("aria-label", "Prefix review poster");
    dialog.innerHTML = `<div class="prefix-toolbar"><label>Review prefixes <select id="prefixThrough">${options()}</select></label><button type="button" id="prefixProject">Show on Student Stage</button><button type="button" id="prefixPrint">Print this sheet</button><a href="assets/posters/prefix-review.pdf" target="_blank" rel="noopener">Full one-page PDF</a><button type="button" id="prefixClose">Close</button></div><div class="prefix-preview"></div>`;
    document.body.append(dialog);
    const select = dialog.querySelector("select"), preview = dialog.querySelector(".prefix-preview");
    function update() {
      through = select.value; preview.innerHTML = render(through);
      ["prefixProject", "prefixPrint"].forEach(id => dialog.querySelector(`#${id}`).disabled = !selected(through).length);
      if (active) hooks.sync();
    }
    function close() { dialog.close(); }
    dialog.addEventListener("close", () => { const wasActive = active; active = false; if (wasActive) hooks.sync(); returnFocus?.focus(); });
    dialog.querySelector("#prefixClose").addEventListener("click", close);
    select.addEventListener("change", update);
    dialog.querySelector("#prefixProject").addEventListener("click", () => { active = true; hooks.project(payload(through)); });
    dialog.querySelector("#prefixPrint").addEventListener("click", () => window.open(`PrefixPosters.html?through=${encodeURIComponent(through)}`, "_blank"));
    document.querySelectorAll("[data-prefix-posters]").forEach(button => button.addEventListener("click", () => {
      returnFocus = button; select.value = defaultThrough(hooks.substep()); update(); dialog.showModal();
    }));
    return { stagePayload: () => active ? payload(through) : null };
  }
  root.TeachTodayPrefixPosters = { groups, selected, defaultThrough, render, options, payload, install };
  if (typeof module !== "undefined" && module.exports) module.exports = root.TeachTodayPrefixPosters;
  if (typeof document !== "undefined" && document.body?.dataset.prefixSheet !== undefined) {
    const select = document.querySelector("#prefixThrough");
    select.innerHTML = options();
    const requested = new URLSearchParams(location.search).get("through") || "5.5";
    select.value = selected(requested).length ? requested : "5.5";
    const update = () => document.querySelector("#prefixSheet").innerHTML = render(select.value);
    select.addEventListener("change", update); update();
    document.querySelector("#prefixPrint").addEventListener("click", () => window.print());
  }
})(typeof window !== "undefined" ? window : globalThis);
