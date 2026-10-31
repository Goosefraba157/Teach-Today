/* Presentation only: receives already-rendered cards; never splits or saves words. */
(function (scope) {
  'use strict';
  const KEY = 'teachToday.cardMotion.v1';
  const states = new WeakMap();
  let preference = 'classic';
  try { if (scope.localStorage?.getItem(KEY) === 'animated') preference = 'animated'; } catch (_) {}
  // Single-stroke lowercase models, in writing order. Coordinates share a baseline.
  const strokes = {
    a: ['M40 40 C32 27 10 32 10 52 C10 77 37 78 40 55', 'M40 34 L40 73'],
    b: ['M10 12 L10 73', 'M10 43 C30 23 43 37 43 53 C43 75 23 81 10 66'],
    c: ['M42 39 C25 22 9 37 9 54 C9 73 28 82 42 67'],
    d: ['M40 40 C25 25 10 36 10 54 C10 75 30 81 40 62', 'M40 12 L40 73'],
    e: ['M10 51 L42 51 C43 29 13 27 10 50 C6 74 28 82 43 66'],
    f: ['M35 15 C18 7 17 24 17 38 L17 73', 'M6 37 L35 37'],
    g: ['M40 40 C23 26 10 37 10 54 C10 76 30 79 40 61', 'M40 34 L40 82 C40 103 17 103 10 91'],
    h: ['M10 12 L10 73', 'M10 45 C22 25 40 30 40 48 L40 73'],
    i: ['M25 35 L25 73', 'M25 18 L25 19'],
    j: ['M31 35 L31 85 C31 101 12 103 7 91', 'M31 18 L31 19'],
    k: ['M10 12 L10 73', 'M41 34 L11 57', 'M24 47 L43 73'],
    l: ['M25 12 L25 73'],
    m: ['M6 34 L6 73', 'M6 45 C13 28 25 29 25 46 L25 73', 'M25 45 C34 27 46 31 46 47 L46 73'],
    n: ['M10 34 L10 73', 'M10 45 C23 26 41 31 41 48 L41 73'],
    o: ['M27 33 C4 32 4 75 27 75 C50 75 50 33 27 33'],
    p: ['M10 34 L10 100', 'M10 44 C28 25 43 37 43 54 C43 76 23 80 10 65'],
    q: ['M40 41 C23 25 9 37 9 54 C9 75 28 80 40 62', 'M40 34 L40 100'],
    r: ['M12 34 L12 73', 'M12 46 C20 30 31 29 41 37'],
    s: ['M41 38 C25 26 9 34 11 45 C13 54 40 51 41 63 C42 78 19 81 9 69'],
    t: ['M23 15 L23 62 C23 76 33 78 41 69', 'M8 36 L40 36'],
    u: ['M10 34 L10 60 C10 80 31 78 40 62', 'M40 34 L40 73'],
    v: ['M7 34 L26 74 L45 34'],
    w: ['M4 34 L14 74 L26 44 L38 74 L49 34'],
    x: ['M9 34 L43 74', 'M43 34 L9 74'],
    y: ['M8 34 L26 73', 'M44 34 L18 98'],
    z: ['M9 35 L42 35 L9 73 L43 73'],
    '-': ['M9 52 L40 52'],
    "'": ['M26 15 L22 28']
  };
  function reduced() { return Boolean(scope.matchMedia?.('(prefers-reduced-motion: reduce)').matches); }
  function style() { return preference; }
  function setStyle(value) {
    preference = value === 'animated' ? 'animated' : 'classic';
    try { scope.localStorage?.setItem(KEY, preference); } catch (_) {}
  }
  function clear(root) {
    if (!root) return;
    const state = states.get(root);
    state?.animations.forEach(animation => animation.cancel());
    root.querySelectorAll('.tt-card-ink').forEach(svg => svg.remove());
    root.querySelectorAll('.tt-card-written').forEach(card => card.classList.remove('tt-card-written'));
    root.classList.remove('tt-physical-cards');
    states.delete(root);
  }
  function writtenText(card) {
    let text = card.textContent;
    if (card.classList.contains('prefix')) text += '-';
    if (card.classList.contains('suffix')) text = '-' + text;
    return text;
  }
  function write(card, text, delay, elapsed, animations, still) {
    if (!text || text.length > 40 || [...text].some(letter => !strokes[letter])) return 0;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = card.ownerDocument.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'tt-card-ink');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const paths = [];
    let advance = 0;
    [...text].forEach(letter => {
      const narrow = letter === "i" || letter === "l";
      const origin = advance - (narrow ? 12 : 0);
      advance += narrow ? 28 : 54;
      strokes[letter].forEach(d => {
        const path = card.ownerDocument.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        path.setAttribute('transform', `translate(${origin} 0)`);
        path.setAttribute('pathLength', '1');
        svg.appendChild(path);
        paths.push(path);
      });
    });
    svg.setAttribute('viewBox', `0 0 ${advance} 110`);
    card.appendChild(svg);
    card.classList.add('tt-card-written');
    const duration = Math.min(1100, Math.max(280, text.length * 145));
    if (!still) paths.forEach((path, index) => {
      animations.push(path.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }], {
        duration: duration / paths.length, delay: delay + index * duration / paths.length - elapsed, fill: 'both', easing: 'linear'
      }));
    });
    return duration;
  }
  function apply(root, options = {}) {
    if (!root) return;
    clear(root);
    if (!options.animated) return;
    const cards = [...root.querySelectorAll('.build-card, .stage-build-card')];
    if (!cards.length) return;
    // Unsupported/old browsers retain their fully readable original cards.
    if (typeof cards[0].animate !== 'function') return;
    const startedAt = Number(options.startedAt) || Date.now();
    const still = options.still || reduced();
    const elapsed = Math.max(0, Date.now() - startedAt);
    const animations = [];
    states.set(root, { startedAt, still, animations });
    root.classList.add('tt-physical-cards');
    let delay = 0;
    try {
      cards.forEach(card => {
        if (!still) animations.push(card.animate([
          { opacity: 0, transform: 'translate(-26px, -42px) rotate(-5deg) scale(1.035)', boxShadow: '0 18px 22px rgba(15,23,42,.19)' },
          { opacity: 1, transform: 'translate(0, -4px) rotate(.6deg)', offset: .78 },
          { opacity: 1, transform: 'translate(0, 0) rotate(0)', boxShadow: '0 3px 5px rgba(15,23,42,.16)' }
        ], { duration: 370, delay: delay - elapsed, fill: 'both', easing: 'cubic-bezier(.2,.65,.3,1)' }));
        const isWritten = ['syllable', 'latin', 'prefix', 'suffix'].some(type => card.classList.contains(type));
        const writing = isWritten ? write(card, writtenText(card), delay + 360, elapsed, animations, still) : 0;
        delay += 430 + writing;
      });
      // Completed animations have a static final state; retain no ticking timers.
    } catch (_) { clear(root); }
  }
  function snapshot(root) {
    const state = root && states.get(root);
    return state ? { layout: 'physical-cards', variant: state.still ? 'still' : String(state.startedAt) } : {};
  }
  const api = { style, setStyle, apply, clear, snapshot };
  scope.TTCardMotion = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
