/* Home navigation only: no classroom state, lesson, attendance or cloud writes. */
(function (root) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  const preferenceKey = 'teachToday.homeSidebar.v1';
  const soundKey = 'teachToday.homeTurtleSound.v1';
  const frameCount = 9;
  function pose(progress) {
    const value = (1 - clamp(progress)) * (frameCount - 1);
    const first = Math.floor(value);
    return { first, second: Math.min(frameCount - 1, first + 1), mix: value - first };
  }
  function releaseTarget(start, current, delta, dragged) {
    if (!dragged) return start < .5 ? 1 : 0;
    if (Math.abs(delta) < 6) return start;
    return current >= .5 ? 1 : 0;
  }
  root.TeachTodayHomeSidebar = { pose, releaseTarget, clamp };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TeachTodayHomeSidebar;
  if (!root.document) return;

  function init() {
    const home = document.getElementById('ttHomeScreen');
    const panel = home?.querySelector('.home-sidebar');
    const handle = document.getElementById('ttHomeTurtle');
    const canvas = handle?.querySelector('canvas');
    if (!home || !panel || !canvas || handle.dataset.bound) return;
    handle.dataset.bound = 'true';
    // Decorative local calendar only: no attendance event or classroom storage write.
    const day = document.getElementById('ttHomeAttendanceDay');
    if (day) {
      const refreshDay = () => { day.textContent = String(new Date().getDate()); };
      refreshDay();
      root.setInterval(refreshDay, 60000);
      root.addEventListener('focus', refreshDay);
      document.addEventListener('visibilitychange', refreshDay);
    }
    const ctx = canvas.getContext('2d');
    const narrow = matchMedia('(max-width: 600px)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let saved;
    let sound = false;
    try { saved = localStorage.getItem(preferenceKey); sound = localStorage.getItem(soundKey) === 'true'; } catch (_) {}
    let progress = saved === 'closed' ? 0 : saved === 'open' ? 1 : narrow.matches ? 0 : 1;
    let settled = progress;
    let frame = 0;
    let drag = null;
    let suppressClick = false;
    let audio;
    const sprite = new Image();
    sprite.src = 'assets/home-turtle/roll.webp';
    const soundControl = document.getElementById('ttHomeTurtleSound');
    if (soundControl) soundControl.checked = sound;

    function draw() {
      if (!ctx || !sprite.complete || !sprite.naturalWidth) return;
      const cell = sprite.naturalWidth / 3;
      const p = pose(reduced.matches ? settled : progress);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const [index, alpha] of [[p.first, 1 - p.mix], [p.second, p.mix]]) {
        if (!alpha) continue;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, (index % 3) * cell, Math.floor(index / 3) * cell, cell, cell, 0, 0, canvas.width, canvas.height);
      }
      ctx.globalAlpha = 1;
    }
    function render() {
      home.style.setProperty('--home-sidebar-progress', String(progress));
      const open = progress > .001;
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
      // On phones the drawer overlays content; keep covered controls out of Tab order.
      for (const child of home.children) {
        if (![panel, handle, document.getElementById('ttHomeSidebarBackdrop')].includes(child)) child.inert = narrow.matches && open;
      }
      home.classList.toggle('home-sidebar-closed', progress < .001);
      handle.setAttribute('aria-expanded', String(settled === 1));
      handle.setAttribute('aria-label', settled ? 'Close menu. Drag turtle left to close.' : 'Open menu. Drag turtle right to open.');
      handle.title = settled ? 'Close menu · drag left' : 'Open menu · drag right';
      document.getElementById('ttHomeNavToggle')?.setAttribute('aria-expanded', String(settled === 1));
      draw();
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; }
    function settle(target, { persist = true, animate = true } = {}) {
      stop();
      settled = target;
      if (target === 0 && panel.contains(document.activeElement)) handle.focus({ preventScroll: true });
      if (persist) try { localStorage.setItem(preferenceKey, target ? 'open' : 'closed'); } catch (_) {}
      const from = progress;
      const start = performance.now();
      const duration = reduced.matches || !animate ? 0 : 240;
      function step(now) {
        const t = duration ? clamp((now - start) / duration) : 1;
        progress = from + (target - from) * (1 - Math.pow(1 - t, 3));
        if (t === 1) progress = target;
        render();
        if (t < 1) frame = requestAnimationFrame(step); else frame = 0;
      }
      frame = requestAnimationFrame(step);
    }
    function giggle() {
      if (!reduced.matches) {
        handle.classList.remove('turtle-giggle');
        void handle.offsetWidth;
        handle.classList.add('turtle-giggle');
      }
      if (!sound) return;
      try {
        audio ||= new (root.AudioContext || root.webkitAudioContext)();
        if (audio.state === 'suspended') audio.resume().catch(() => {});
        // Short, quiet, synthesized chuckle effect; never uses the microphone.
        for (let n = 0; n < 3; n++) {
          const at = audio.currentTime + n * .09;
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580 + n * 45, at);
          osc.frequency.exponentialRampToValueAtTime(380 + n * 25, at + .065);
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(.035, at + .012);
          gain.gain.exponentialRampToValueAtTime(.001, at + .075);
          osc.connect(gain); gain.connect(audio.destination);
          osc.start(at); osc.stop(at + .08);
        }
      } catch (_) { /* Silent animation remains available if audio is unavailable. */ }
    }
    function width() { return panel.getBoundingClientRect().width || 210; }
    handle.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      stop();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: progress, delta: 0, dragged: false, width: width() };
      suppressClick = false;
      handle.setPointerCapture(event.pointerId);
      home.classList.add('home-sidebar-dragging');
      giggle();
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      drag.delta = event.clientX - drag.x;
      if (Math.abs(drag.delta) > 6) drag.dragged = true;
      if (!drag.dragged) return;
      progress = clamp(drag.start + drag.delta / drag.width);
      render();
    });
    function end(event, cancelled = false) {
      if (!drag || event.pointerId !== drag.id) return;
      const prior = drag;
      drag = null;
      suppressClick = true;
      home.classList.remove('home-sidebar-dragging');
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      settle(cancelled ? settled : releaseTarget(prior.start, progress, prior.delta, prior.dragged), { persist: !cancelled });
    }
    handle.addEventListener('pointerup', event => end(event));
    handle.addEventListener('pointercancel', event => end(event, true));
    handle.addEventListener('lostpointercapture', event => end(event, true));
    handle.addEventListener('click', event => {
      if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
      if (event.detail === 0) giggle();
      settle(settled ? 0 : 1);
    });
    handle.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); giggle(); settle(event.key === 'ArrowRight' ? 1 : 0);
      }
    });
    document.getElementById('ttHomeNavToggle')?.addEventListener('click', () => settle(settled ? 0 : 1));
    document.getElementById('ttHomeSidebarClose')?.addEventListener('click', () => settle(0));
    document.getElementById('ttHomeSidebarBackdrop')?.addEventListener('click', () => settle(0));
    panel.addEventListener('click', event => {
      if (!narrow.matches || !event.target.closest) return;
      const action = event.target.closest('a, button');
      if (action && action.getAttribute('aria-haspopup') !== 'menu') settle(0);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !home.hidden && narrow.matches && settled && !document.querySelector('dialog[open]')) settle(0);
    });
    soundControl?.addEventListener('change', () => {
      sound = soundControl.checked;
      try { localStorage.setItem(soundKey, String(sound)); } catch (_) {}
      if (sound) giggle();
    });
    root.addEventListener('resize', () => {
      if (drag) { drag = null; home.classList.remove('home-sidebar-dragging'); }
      settle(settled, { persist: false, animate: false });
    });
    sprite.onload = () => { if (ctx) handle.classList.add("turtle-art-ready"); draw(); };
    home.classList.add('home-sidebar-ready');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
