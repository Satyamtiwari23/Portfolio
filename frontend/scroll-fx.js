/* =========================================================
   SCROLL EFFECTS
   1 reveal   2 stagger   3 underline draw (CSS)   4 progress bar   5 active nav link

   Load this script LAST (after terminal.js), because it animates the
   terminal window that terminal.js builds.
   Nothing here touches the hero section.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG
  --------------------------------------------------------- */
  const small = window.matchMedia('(max-width: 768px)').matches;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CONFIG = {
    distance: small ? '16px' : '24px', // how far things travel up while appearing
    stagger: small ? 60 : 90,          // ms between items that appear together
    maxDelay: 450,                     // never make anyone wait longer than this
    holdMs: 1100,                      // after this, the temporary classes are removed
    headerHoldMs: 1700                 // headers also draw their underline, so they need longer
  };

  // What to reveal. `hold` overrides how long an element keeps its temporary classes.
  const TARGETS = [
    { sel: '.section-header', hold: CONFIG.headerHoldMs },
    { sel: '.profile-image' },
    { sel: '.about-text > p, .about-text .achievement' },
    { sel: '.term-window' },
    { sel: '.projects-grid > *' },
    { sel: '.skill-card' },
    { sel: '.review-form-card' },
    { sel: '.contact-info > p, .contact-item, .social-links' },
    { sel: '.contact-form' }
  ];

  /* =========================================================
     1 + 2 · REVEAL ON SCROLL, WITH STAGGER
     Elements that become visible in the same moment (a row of
     cards, a list of paragraphs) appear one after another.
  ========================================================= */
  let io = null;

  function cleanup(el) {
    el.classList.remove('sfx-pre', 'sfx-in');
    el.style.removeProperty('--sfx-delay');
    el.style.removeProperty('--sfx-y');
  }

  function reveal(el, delay) {
    el.style.setProperty('--sfx-delay', delay + 'ms');
    el.classList.add('sfx-in');
    const hold = parseInt(el.dataset.sfxHold, 10) || CONFIG.holdMs;
    setTimeout(() => cleanup(el), hold + delay + 100);
  }

  function register(el, hold) {
    if (el.dataset.sfx) return; // already handled
    el.dataset.sfx = '1';
    if (hold) el.dataset.sfxHold = String(hold);
    el.style.setProperty('--sfx-y', CONFIG.distance);
    el.classList.add('sfx-pre');
    io.observe(el);
  }

  if (!REDUCED && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => (a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

      visible.forEach((entry, i) => {
        reveal(entry.target, Math.min(i * CONFIG.stagger, CONFIG.maxDelay));
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    // set the hidden state BEFORE turning the effect on, so nothing flashes
    TARGETS.forEach(t => {
      document.querySelectorAll(t.sel).forEach(el => register(el, t.hold));
    });
    document.documentElement.classList.add('sfx-ready');

    // Review cards are added later by script.js (after the API answers), so watch the list.
    const list = document.getElementById('reviewsList');
    if (list) {
      const pick = () => list.querySelectorAll('.review-card').forEach(el => register(el));
      new MutationObserver(pick).observe(list, { childList: true });
      pick();
    }
  }

  /* =========================================================
     4 + 5 · SCROLL PROGRESS BAR  and  ACTIVE NAV LINK
     (both are plain indicators, so they stay on even when the
     visitor prefers reduced motion)
  ========================================================= */
  const nav = document.querySelector('nav');
  let bar = null;
  if (nav) {
    bar = document.createElement('div');
    bar.className = 'sfx-progress';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
  }

  // Which nav link belongs to which section. The terminal has no nav link,
  // so while you are in it, "About" stays highlighted.
  const SECTION_TO_LINK = {
    about: 'about',
    terminal: 'about',
    projects: 'projects',
    skills: 'skills',
    Reviews: 'Reviews',
    contact: 'contact'
  };

  const sections = Object.keys(SECTION_TO_LINK)
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];

  function update() {
    // progress bar
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }

    // active link: the last section whose top has passed 35% of the screen height
    let current = null;
    const line = window.innerHeight * 0.35;
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= line) current = SECTION_TO_LINK[s.id];
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = 'contact'; // very bottom of the page
    }

    links.forEach(a => {
      const on = current !== null && a.getAttribute('href') === '#' + current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  // one animation frame per scroll burst keeps this cheap
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  update();
})();