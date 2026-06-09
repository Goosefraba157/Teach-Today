/**
 * Teach Today — Login screen & onboarding tour
 * Shows a welcome/login screen on first visit, then a short guided tour.
 */
(function () {
  'use strict';

  const LOGIN_DONE_KEY = 'teachToday.loginDone';
  const TOUR_DONE_KEY  = 'teachToday.tourDone';

  const STEPS = [
    {
      icon: '📚',
      title: 'Welcome to Teach Today!',
      body: 'This app generates Wilson Reading System lessons in seconds and keeps student records as you teach. Here\'s a quick tour to get you started.'
    },
    {
      icon: '👥',
      title: 'Start with a Group',
      body: 'A <strong>Group</strong> is a teaching group — like "Blue Group" or "Red Group." Each group has its own students, substep, and lesson history. Tap <strong>Home</strong> in the header to create your first group.'
    },
    {
      icon: '🪜',
      title: 'Substeps Drive Everything',
      body: 'Each group has a current <strong>substep</strong> (like 1.1, 2.3, or 7.2). The app automatically loads the right sounds, word lists, dictation, and passages for that substep — no manual lookup needed.'
    },
    {
      icon: '▶️',
      title: 'Build a Lesson & Teach',
      body: 'From <strong>Home</strong>, select a group → tap <strong>Build lesson</strong> → tap <strong>Start teaching</strong>. Walk through all 10 lesson sections. When you\'re done, hit <strong>Wrap Up</strong> to save records.'
    }
  ];

  let currentStep = 0;

  /* ── Initialise after DOM is ready ───────────────────────── */
  function init() {
    setupLoginScreen();
    setupTour();
  }

  /* ── Login screen ─────────────────────────────────────────── */
  function setupLoginScreen() {
    const screen   = document.getElementById('ttLoginScreen');
    const btnSignIn    = document.getElementById('ttLoginSignIn');
    const btnContinue  = document.getElementById('ttLoginContinue');
    const userBadge    = document.getElementById('ttFirebaseUserBadge');

    if (!screen) return;

    // Hide immediately if already visited before
    if (localStorage.getItem(LOGIN_DONE_KEY)) {
      screen.classList.add('tt-hidden');
      return;
    }

    // "Sign in with Google" — dismiss screen then trigger Firebase flow
    btnSignIn?.addEventListener('click', () => {
      dismissLogin(screen);
      // Delegate to the existing Firebase sign-in button in the header
      setTimeout(() => document.getElementById('ttFirebaseSignIn')?.click(), 350);
    });

    // "Continue without signing in" — just dismiss
    btnContinue?.addEventListener('click', () => dismissLogin(screen));

    // Auto-dismiss if Firebase restores a signed-in session
    if (userBadge) {
      const obs = new MutationObserver(() => {
        if (!userBadge.hidden && !screen.classList.contains('tt-hidden')) {
          dismissLogin(screen);
        }
      });
      obs.observe(userBadge, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  function dismissLogin(screen) {
    screen.classList.add('tt-hidden');
    localStorage.setItem(LOGIN_DONE_KEY, '1');
    // Offer the tour if never seen
    if (!localStorage.getItem(TOUR_DONE_KEY)) {
      setTimeout(showTour, 420);
    }
  }

  /* ── Onboarding tour ──────────────────────────────────────── */
  function setupTour() {
    const closeBtn = document.getElementById('ttOnboardingClose');
    const skipBtn  = document.getElementById('ttOnboardingSkip');
    const nextBtn  = document.getElementById('ttOnboardingNext');

    closeBtn?.addEventListener('click', dismissTour);
    skipBtn?.addEventListener('click',  dismissTour);
    nextBtn?.addEventListener('click',  advanceStep);

    // Close on backdrop click
    const overlay = document.getElementById('ttOnboarding');
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('tt-onboarding-backdrop')) {
        dismissTour();
      }
    });

    // Keyboard: Escape closes, Right arrow advances
    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('ttOnboarding');
      if (!overlay || overlay.hasAttribute('hidden')) return;
      if (e.key === 'Escape')      dismissTour();
      if (e.key === 'ArrowRight')  advanceStep();
    });
  }

  function showTour() {
    currentStep = 0;
    renderStep();
    const el = document.getElementById('ttOnboarding');
    if (el) el.removeAttribute('hidden');
  }

  function renderStep() {
    const step = STEPS[currentStep];
    if (!step) { dismissTour(); return; }

    const icon  = document.getElementById('ttOnboardingIcon');
    const title = document.getElementById('ttOnboardingTitle');
    const body  = document.getElementById('ttOnboardingBody');
    const dots  = document.getElementById('ttOnboardingDots');
    const next  = document.getElementById('ttOnboardingNext');

    if (icon)  icon.textContent = step.icon;
    if (title) title.textContent = step.title;
    if (body)  body.innerHTML   = step.body;

    if (dots) {
      dots.innerHTML = STEPS.map((_, i) =>
        `<span class="tt-onboarding-dot${i === currentStep ? ' active' : ''}"></span>`
      ).join('');
    }

    if (next) {
      next.textContent = currentStep === STEPS.length - 1 ? '✓ Got it!' : 'Next →';
    }
  }

  function advanceStep() {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderStep();
    } else {
      dismissTour();
    }
  }

  function dismissTour() {
    const el = document.getElementById('ttOnboarding');
    if (el) el.setAttribute('hidden', '');
    localStorage.setItem(TOUR_DONE_KEY, '1');
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
