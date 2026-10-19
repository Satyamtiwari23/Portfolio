/* =========================================================
   DEBUG THE PORTFOLIO  (v3: every run is unique)

   - 15 bug spots live on the page. Each run picks 5 of them at random.
   - The 6th bug hides inside one of the TERMINAL's replies (help, about,
     skills, projects, contact or resume). Which one changes every run.
     Visitors just click the terminal buttons and watch for a 🐛.
   - Inside a run, bugs are seeded: reloading the page keeps them in the
     same place. A new run gets a new seed, so the exact letter, chip,
     garbled text and note are different every time.
   - Tips / jokes never repeat until all of them have been shown once.
   - Best time is saved; ranks come from wins + speed.
   - The free-chat reward is unlocked on the FIRST win only.

   Everything is injected from JS, so removing this one <script>
   tag gives you back the original portfolio.
   Console helpers:  DebugGame.status()  DebugGame.playAgain()  DebugGame.reset()
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIG
  --------------------------------------------------------- */
  const CONFIG = {
    storageKey: 'dbgGame.v3',
    siteUrl: 'https://satyamtiwari23.github.io/Portfolio/',
    enableKonami: true,

    // Speedrun clock: time between the first and last bug. Each gap between
    // two bugs is capped, so leaving the tab open doesn't inflate the time.
    gapCapMs: 120000,

    // Principal Debugger needs 3+ wins AND a best time at or under this.
    principalMaxMs: 120000,

    vault: {
      title: 'Vault unlocked',
      // ✏️ EDIT: reward for the FIRST win only. Change it to whatever you actually want to offer.
      message: 'You debugged the whole portfolio. As a thank-you: a free 15-minute chat about your project, resume or LaTeX formatting. Mention the code below when you message me.',
      code: 'BUGFREE-2026',
      replayTitle: 'Build passing, again',
      replayMessage: 'The vault reward unlocks once, on your first win. Replays earn rank and speed records.',
      claimLabel: 'Claim reward',
      shareLabel: 'Share',
      againLabel: 'Play again',
      prefill: (time, code) =>
        `Hi Satyam! I fixed all the bugs in your portfolio (${time}) and unlocked the vault. Code: ${code}`
    }
  };

  const RUN_SIZE = 5; // random page bugs per run (+1 in the terminal = 6)

  // Terminal replies that can hide the 6th bug (all have a clickable button under the terminal).
  const TERM_CMDS = ['help', 'about', 'skills', 'projects', 'contact', 'resume'];

  const RANKS = ['Intern Debugger', 'Junior Debugger', 'Senior Debugger', 'Principal Debugger'];

  // Shown one at a time when a bug is squashed. Never repeats until all have been seen.
  const REWARDS = [
    '🧠 The first computer "bug" was a real moth found in Harvard\'s Mark II in 1947.',
    '💡 JS tip: user?.name ?? "Guest" handles missing values in one line.',
    '😄 Why do programmers prefer dark mode? Because light attracts bugs.',
    '📚 DSA tip: say the brute-force solution out loud first, then optimise it.',
    '⚙️ This portfolio runs on plain HTML/CSS/JS, with Node, Express and MongoDB behind the reviews.',
    '😄 A SQL query walks into a bar, sees two tables and asks: "Can I join you?"',
    '💡 Git tip: git switch - takes you back to the previous branch.',
    '🎨 CSS tip: aspect-ratio: 16 / 9 replaces the old padding-top hack.',
    '🦆 Explain your bug out loud to a rubber duck. It works more often than it should.',
    '🐍 Python tip: enumerate(items, start=1) saves you a manual counter.',
    '📄 LaTeX tip: \\usepackage{microtype} quietly improves spacing across the whole document.',
    '😄 There are 10 types of people: those who understand binary and those who don\'t.',
    '💡 Console tip: console.table(array) prints objects as a readable table.',
    '😅 "It works on my machine." Famous last words.',
    '💡 JS tip: [...new Set(arr)] removes duplicates from an array.',
    '💡 Git tip: git stash saves your messy work so you can switch branches safely.',
    '🎨 CSS tip: gap works in flexbox too, so you can skip the margin hacks.',
    '🐍 Python tip: f"{value:.2f}" formats a number to 2 decimals.',
    '📚 Big-O tip: a hash map lookup is O(1) on average, which is why it fixes so many slow loops.',
    '🌐 The first website went live in 1991.',
    '😄 Why did the developer go broke? He used up all his cache.',
    '📄 LaTeX tip: put \\label right after \\caption so cross-references point at the right figure.',
    '♿ HTML tip: a <button> is keyboard-accessible for free. A clickable <div> is not.',
    '⌨️ Shortcut: Ctrl+Shift+P (Cmd+Shift+P on Mac) opens the command palette in VS Code.',
    '☕ Java tip: use StringBuilder instead of += when you build strings in a loop.',
    '😄 A bug is just a feature with no documentation.',
    '🔍 Debugging tip: change one thing at a time, or you never learn what fixed it.',
    '🐍 Python tip: use "with open(...)" so files always close, even when something crashes.',
    '💡 JS tip: === avoids the surprises of == type coercion.',
    '🐍 Python is named after Monty Python, not the snake.',
    '😄 To understand recursion, you must first understand recursion.',
    '🎨 CSS tip: clamp(1rem, 2.5vw, 2rem) gives fluid font sizes without media queries.',
    '🍃 MongoDB tip: an index on the field you filter by can turn a slow query into an instant one.',
    '💡 Git tip: git commit --amend fixes your last commit message before you push.'
  ];

  const FOOTER_NOTES = [
    '<!-- TODO: fix this bug -->',
    '// TODO: remove before launch',
    '/* FIXME: why does this work? */',
    '# HACK: do not touch',
    '<!-- who wrote this?? -->',
    '// TODO: delete this later (never)'
  ];

  const TERMINAL_NOTES = [
    '// FIXME: terminal leaks bugs',
    '$ git blame --who-did-this',
    '// TODO: add more easter eggs',
    '# temporary fix, will clean up later'
  ];

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const htmlEl = document.documentElement;

  const fmt = ms => {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };

  /* ---------------------------------------------------------
     SEEDED RANDOM  (same seed -> same bugs after a page reload)
  --------------------------------------------------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const shuffle = (arr, rng) => {
    const rand = rng || Math.random;
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  const pickFrom = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  /* ---------------------------------------------------------
     BUG BUILDERS   (mount(rng) -> the clickable element, or null)
  --------------------------------------------------------- */
  // Glitch ONE random letter inside the text of the matching elements.
  function randomLetter(selector, rng) {
    const cands = [];
    document.querySelectorAll(selector).forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (n.parentElement && n.parentElement.closest('.dbg-bug')) continue;
        const re = /[A-Za-z]{6,}/g;
        let m;
        while ((m = re.exec(n.nodeValue))) cands.push({ node: n, index: m.index, word: m[0] });
      }
    });
    if (!cands.length) return null;

    const c = pickFrom(cands, rng);
    // skip the first and last letter of the word, so it reads naturally
    const pos = c.index + 1 + Math.floor(rng() * (c.word.length - 2));
    const text = c.node.nodeValue;

    const span = document.createElement('span');
    span.className = 'dbg-letter';
    span.textContent = text[pos];

    const parent = c.node.parentNode;
    const after = document.createTextNode(text.slice(pos + 1));
    c.node.nodeValue = text.slice(0, pos);
    parent.insertBefore(span, c.node.nextSibling);
    parent.insertBefore(after, span.nextSibling);
    return span;
  }

  // A small 🐛 pinned inside a container.
  function iconIn(container, extraClass) {
    if (!container) return null;
    // Only make the host `relative` if it isn't positioned already (keeps sticky cards sticky).
    if (getComputedStyle(container).position === 'static') container.classList.add('dbg-host');
    const el = document.createElement('span');
    el.className = 'dbg-icon' + (extraClass ? ' ' + extraClass : '');
    el.textContent = '🐛';
    container.appendChild(el);
    return el;
  }

  function appendText(host, className, text, tag) {
    if (!host) return null;
    const el = document.createElement(tag || 'span');
    el.className = className;
    el.textContent = text;
    host.appendChild(el);
    return el;
  }

  const LOOKALIKE = { a: '@', e: '3', i: '!', o: '0', s: '$', l: '1', t: '7', b: '8', g: '9' };

  // "Problem Solving" -> something like "Pr0blem $olving", different each run.
  function garble(text, rng) {
    const chars = [...text];
    const spots = shuffle(
      chars.map((c, i) => (LOOKALIKE[c.toLowerCase()] ? i : -1)).filter(i => i >= 0),
      rng
    );
    if (!spots.length) return text + ' ?!';
    const count = Math.min(spots.length, 2 + Math.floor(rng() * 2));
    for (let k = 0; k < count; k++) chars[spots[k]] = LOOKALIKE[chars[spots[k]].toLowerCase()];
    return chars.join('');
  }

  const letterBug = (id, section, selector, where) => ({
    id, section, mode: 'restore',
    hint: `A letter in the ${where} glitches every few seconds. Read closely.`,
    mount(rng) { return randomLetter(selector, rng); }
  });

  const iconBug = (id, section, hint, getHost, extraClass) => ({
    id, section, hint, mode: 'remove',
    mount() { return iconIn(getHost(), extraClass); }
  });

  const chipBug = (id, hint) => ({
    id, section: 'Skills', hint, mode: 'restore',
    mount(rng) {
      const chips = [...document.querySelectorAll('#skills .skill-tag')]
        .filter(c => !c.dataset.orig && c.textContent.trim().length >= 3);
      if (!chips.length) return null;
      const chip = pickFrom(chips, rng);
      const original = chip.textContent;
      chip.dataset.orig = original;
      chip.dataset.garbled = garble(original.trim(), rng);
      chip.textContent = chip.dataset.garbled;
      chip.classList.add('dbg-garbled');
      return chip;
    },
    restore(el) { el.textContent = el.dataset.orig; },
    setVisible(el, on) { el.textContent = on ? el.dataset.garbled : el.dataset.orig; }
  });

  /* ---------------------------------------------------------
     THE POOL: 15 spots on the page
  --------------------------------------------------------- */
  const POOL = [
    letterBug('about-letter', 'About', '#about .about-text p', 'About text'),
    letterBug('projects-letter', 'Projects', '#projects .section-title', '"Featured Projects" heading'),
    letterBug('skills-letter', 'Skills', '#skills .section-title', 'Skills heading'),
    letterBug('reviews-letter', 'Reviews', '#Reviews .section-title', 'Reviews heading'),
    letterBug('contact-letter', 'Contact', '#contact .contact-info p', 'Get In Touch text'),
    letterBug('terminal-letter', 'Terminal', '#terminal .term-sub', 'line under "Ask Me Anything"'),

    iconBug('project-icon-a', 'Projects',
      'The first project card has an uninvited guest in its top corner.',
      () => { const c = document.querySelector('#projects .project-card'); return c && c.querySelector('.project-info'); },
      'dbg-icon-tr'),

    iconBug('project-icon-b', 'Projects',
      'Look at the image of the last project card.',
      () => { const c = document.querySelectorAll('#projects .project-card'); const l = c[c.length - 1]; return l && l.querySelector('.project-image'); }),

    chipBug('skills-chip-a', 'One of the skill chips looks corrupted. Check all the cards.'),
    chipBug('skills-chip-b', 'Another skill chip looks corrupted. Check all the cards.'),

    {
      id: 'reviews-dot', section: 'Reviews', mode: 'remove',
      hint: 'Under the reviews, there is a dot that does not belong.',
      mount() { return appendText($('.reviews-verification-note'), 'dbg-dot', '●'); }
    },

    iconBug('reviews-form-icon', 'Reviews',
      'The "Leave a Review" card has a bug in its corner.',
      () => $('.review-form-card'),
      'dbg-icon-tr'),

    {
      id: 'footer-todo', section: 'Footer', mode: 'remove',
      hint: 'Someone left a forgotten note in the footer.',
      mount(rng) { return appendText($('footer'), 'dbg-code', pickFrom(FOOTER_NOTES, rng)); }
    },

    {
      id: 'terminal-todo', section: 'Terminal', mode: 'remove',
      hint: 'The "Ask Me Anything" heading has a forgotten note under it.',
      mount(rng) { return appendText($('#terminal .section-header'), 'dbg-code', pickFrom(TERMINAL_NOTES, rng)); }
    },

    iconBug('nav-icon', 'Navbar',
      'The hardest one: look closely at the logo in the navbar.',
      () => $('.logo-badge'),
      'dbg-icon-nav')
  ];

  // The 6th bug hides in a terminal reply (terminal.js draws it; Konami works too).
  const SECRET = {
    id: 'secret', section: 'Terminal', mode: 'none',
    hint: 'Not on the page itself. Open the terminal, press its buttons (help, about, skills...) and watch the replies for a 🐛.',
    mount() { return null; }
  };

  const BY_ID = {};
  POOL.concat([SECRET]).forEach(b => { BY_ID[b.id] = b; });

  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */
  const blank = () => ({
    run: null,          // ids of this run's page bugs
    seed: 0,            // makes this run's bugs unique, and stable across reloads
    termCmd: 'help',    // which terminal reply hides the 6th bug
    found: [],          // ids found in this run
    elapsed: 0,
    last: null,
    end: null,
    hidden: false,
    hinted: false,
    seen: [],           // tips already shown (so they never repeat)
    wins: 0,
    best: null,         // fastest win, in ms
    newBest: false,     // did the latest win set a record?
    promotedTo: null,   // rank name if the latest win promoted you
    announce: false     // show a "new run" toast after Play again
  });

  function newRun(prevRun, prevTerm) {
    const ids = POOL.map(b => b.id);
    let pick = shuffle(ids).slice(0, RUN_SIZE);
    for (let i = 0; i < 20; i++) {
      const overlap = prevRun ? pick.filter(x => prevRun.includes(x)).length : 0;
      if (overlap <= 2) break; // make replays feel fresh
      pick = shuffle(ids).slice(0, RUN_SIZE);
    }
    const cmds = TERM_CMDS.filter(c => c !== prevTerm);
    return {
      run: pick,
      seed: Math.floor(Math.random() * 4294967296),
      termCmd: pickFrom(cmds, Math.random)
    };
  }

  function load() {
    let s = blank();
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (saved && typeof saved === 'object') s = Object.assign(s, saved);
    } catch (e) { /* storage blocked or corrupt: start fresh */ }

    const runOk = Array.isArray(s.run) && s.run.length > 0 &&
      s.run.every(id => BY_ID[id] && id !== 'secret') &&
      typeof s.seed === 'number' && TERM_CMDS.includes(s.termCmd);

    if (!runOk) {
      Object.assign(s, newRun(null, null));
      s.found = [];
      s.elapsed = 0;
      s.last = null;
      s.end = null;
    }
    s.found = (Array.isArray(s.found) ? s.found : []).filter(id => s.run.includes(id) || id === 'secret');
    s.seen = Array.isArray(s.seen) ? s.seen.filter(i => Number.isInteger(i) && i >= 0 && i < REWARDS.length) : [];
    return s;
  }

  function save() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const state = load();
  save(); // persist a brand-new run right away, so a reload doesn't reshuffle the bugs

  /* ---------------------------------------------------------
     MOUNT THIS RUN'S BUGS
     Each bug gets its own seeded random, so it lands in the same spot
     after a reload. If a spot can't be found, a spare one is swapped in.
  --------------------------------------------------------- */
  const els = {};
  const rngFor = id => mulberry32((state.seed ^ hashStr(id)) >>> 0);

  (function mountRun() {
    const failed = [];
    state.run.forEach(id => {
      const el = BY_ID[id].mount(rngFor(id));
      if (el) els[id] = el; else failed.push(id);
    });

    if (failed.length) {
      const spare = shuffle(POOL.map(b => b.id).filter(id => !state.run.includes(id)));
      failed.forEach(fid => {
        while (spare.length) {
          const nid = spare.shift();
          const el = BY_ID[nid].mount(rngFor(nid));
          if (el) {
            state.run[state.run.indexOf(fid)] = nid;
            els[nid] = el;
            break;
          }
        }
      });
      state.run = state.run.filter(id => els[id]);
      state.found = state.found.filter(id => state.run.includes(id) || id === 'secret');
      save();
    }
  })();

  const SLOTS = state.run.concat(['secret']); // slot numbers: 1..n, secret is always last
  const TOTAL = SLOTS.length;

  /* ---------------------------------------------------------
     RANKS + CLOCK
  --------------------------------------------------------- */
  function rankIndex(wins, best) {
    if (wins >= 3 && best && best <= CONFIG.principalMaxMs) return 3;
    if (wins >= 2) return 2;
    if (wins >= 1) return 1;
    return 0;
  }

  function nextRankHint() {
    const r = rankIndex(state.wins, state.best);
    if (r === 0) return 'Fix every bug to become a Junior Debugger.';
    if (r === 1) return 'Win once more to become a Senior Debugger.';
    if (r === 2) {
      return state.wins >= 3
        ? `Finish a run in under ${fmt(CONFIG.principalMaxMs)} to become a Principal Debugger.`
        : `Win ${3 - state.wins} more time(s), with one run under ${fmt(CONFIG.principalMaxMs)}, to become a Principal Debugger.`;
    }
    return 'Top rank reached. Beat your best time.';
  }

  function liveMs() {
    const running = state.last && !state.end ? Math.min(Date.now() - state.last, CONFIG.gapCapMs) : 0;
    return state.elapsed + running;
  }

  /* ---------------------------------------------------------
     TOAST
  --------------------------------------------------------- */
  let toastEl = null;
  let toastTimer = null;

  function toast(title, bodyText, action) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'dbg-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = '';

    const t = document.createElement('div');
    t.className = 'dbg-toast-title';
    t.textContent = title;
    toastEl.appendChild(t);

    if (bodyText) {
      const b = document.createElement('div');
      b.className = 'dbg-toast-body';
      b.textContent = bodyText;
      toastEl.appendChild(b);
    }

    if (action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.run();
        toastEl.classList.remove('dbg-show');
      });
      toastEl.appendChild(btn);
    }

    toastEl.classList.add('dbg-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('dbg-show'), action ? 7000 : 4800);
  }

  // Never repeats until every tip has been shown once (saved across visits).
  function nextReward() {
    let pool = REWARDS.map((_, i) => i).filter(i => !state.seen.includes(i));
    if (!pool.length) {
      state.seen = [];
      pool = REWARDS.map((_, i) => i);
    }
    const i = pool[Math.floor(Math.random() * pool.length)];
    state.seen.push(i);
    save();
    return REWARDS[i];
  }

  /* ---------------------------------------------------------
     HUD
  --------------------------------------------------------- */
  const hudWrap = document.createElement('div');
  hudWrap.innerHTML = `
    <div class="dbg-hud" hidden>
      <div class="dbg-panel" hidden>
        <div class="dbg-panel-head"></div>
        <div class="dbg-slots"></div>
        <p class="dbg-hint" aria-live="polite">Tap a locked slot for a hint.</p>
        <p class="dbg-best"></p>
        <button type="button" class="dbg-link" data-act="hide">Hide game</button>
      </div>
      <button type="button" class="dbg-pill" aria-expanded="false" aria-label="Bug hunt progress">
        <span aria-hidden="true">🐛</span>
        <span class="dbg-count"></span>
        <span class="dbg-timer" aria-hidden="true"></span>
        <span class="dbg-bar" aria-hidden="true"><i></i></span>
      </button>
    </div>
    <button type="button" class="dbg-ghost" hidden>🐛 Show game</button>`;
  while (hudWrap.firstChild) document.body.appendChild(hudWrap.firstChild);

  const hud = $('.dbg-hud');
  const panel = $('.dbg-panel', hud);
  const panelHead = $('.dbg-panel-head', hud);
  const pill = $('.dbg-pill', hud);
  const countEl = $('.dbg-count', hud);
  const timerEl = $('.dbg-timer', hud);
  const barFill = $('.dbg-bar i', hud);
  const slotsEl = $('.dbg-slots', hud);
  const hintEl = $('.dbg-hint', hud);
  const bestEl = $('.dbg-best', hud);
  const ghost = $('.dbg-ghost');

  let hudWasVisible = false;
  let tick = null;

  function stopTick() {
    if (tick) { clearInterval(tick); tick = null; }
  }

  function startTick() {
    if (tick) return;
    tick = setInterval(() => {
      if (state.end || state.hidden || state.found.length === 0 || state.found.length >= TOTAL) {
        stopTick();
        return;
      }
      timerEl.textContent = fmt(liveMs());
    }, 1000);
  }

  function renderHUD() {
    const n = state.found.length;
    const done = n >= TOTAL;
    const visible = !state.hidden && n > 0;

    if (visible && !hudWasVisible) {
      hud.classList.add('dbg-enter');
      setTimeout(() => hud.classList.remove('dbg-enter'), 600);
    }
    hudWasVisible = visible;

    hud.hidden = !visible;
    ghost.hidden = !state.hidden;
    htmlEl.classList.toggle('dbg-hidden', state.hidden);

    countEl.textContent = done ? '🔓 Vault' : n + '/' + TOTAL;
    timerEl.hidden = done;
    timerEl.textContent = fmt(liveMs());
    barFill.style.width = (n / TOTAL) * 100 + '%';
    pill.classList.toggle('dbg-complete', done);

    panelHead.textContent = RANKS[rankIndex(state.wins, state.best)];
    bestEl.textContent = state.best ? 'Best time: ' + fmt(state.best) : 'No best time yet. Beat the clock!';

    slotsEl.textContent = '';
    SLOTS.forEach((id, i) => {
      const bug = BY_ID[id];
      const found = state.found.includes(id);
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'dbg-slot' + (found ? ' dbg-slot-found' : '');
      s.textContent = found ? '✓' : String(i + 1);
      s.setAttribute('aria-label', found ? `Bug ${i + 1} fixed, ${bug.section}` : `Bug ${i + 1} not found yet, show hint`);
      s.addEventListener('click', () => {
        hintEl.textContent = found
          ? `Bug #${i + 1} fixed in ${bug.section}.`
          : `Bug #${i + 1} · ${bug.hint}`;
      });
      slotsEl.appendChild(s);
    });

    if (visible && !done && !state.end) startTick(); else stopTick();
  }

  pill.addEventListener('click', e => {
    e.stopPropagation();
    if (state.found.length >= TOTAL) { openVault(); return; }
    const open = panel.hidden;
    panel.hidden = !open;
    pill.setAttribute('aria-expanded', String(open));
  });

  panel.addEventListener('click', e => e.stopPropagation());

  document.addEventListener('click', () => {
    if (!panel.hidden) {
      panel.hidden = true;
      pill.setAttribute('aria-expanded', 'false');
    }
  });

  $('[data-act="hide"]', hud).addEventListener('click', () => {
    panel.hidden = true;
    setHidden(true);
  });

  ghost.addEventListener('click', () => setHidden(false));

  /* ---------------------------------------------------------
     SHOW / HIDE THE GAME
  --------------------------------------------------------- */
  function setHidden(flag) {
    state.hidden = !!flag;
    save();
    SLOTS.forEach(id => {
      const bug = BY_ID[id];
      const el = els[id];
      if (el && bug.setVisible && !state.found.includes(id)) bug.setVisible(el, !state.hidden);
    });
    renderHUD();
  }

  /* ---------------------------------------------------------
     SQUASH
  --------------------------------------------------------- */
  function applyFixed(bug, el, instant) {
    if (!el) return;
    el.removeAttribute('role');
    el.removeAttribute('tabindex');
    el.removeAttribute('aria-label');

    if (bug.mode === 'remove') {
      el.setAttribute('aria-hidden', 'true');
      if (instant || REDUCED) { el.remove(); return; }
      el.classList.add('dbg-pop');
      setTimeout(() => el.remove(), 360);
    } else {
      if (bug.restore) bug.restore(el);
      el.classList.add('dbg-fixed');
      if (!instant) {
        el.classList.add('dbg-flash');
        setTimeout(() => el.classList.remove('dbg-flash'), 950);
      }
    }
  }

  // Accepts a bug id, or a slot number (the last slot is always the terminal bug).
  function resolveId(x) {
    if (x === 'secret' || x === TOTAL) return 'secret';
    if (typeof x === 'number' && x >= 1 && x < TOTAL) return SLOTS[x - 1];
    return x;
  }

  function squash(raw) {
    const id = resolveId(raw);
    if (!SLOTS.includes(id) || state.found.includes(id)) return false;

    const now = Date.now();
    if (state.last) state.elapsed += Math.min(now - state.last, CONFIG.gapCapMs);
    state.last = now;
    state.found.push(id);
    save();

    applyFixed(BY_ID[id], els[id], false);
    renderHUD();

    const n = state.found.length;
    if (n >= TOTAL) {
      setTimeout(win, 700);
    } else {
      toast(`🐛 Bug #${SLOTS.indexOf(id) + 1} squashed (${n}/${TOTAL})`, nextReward());
    }
    return true;
  }

  /* ---------------------------------------------------------
     ATTACH HANDLERS  (fixed bugs from earlier visits are restored instantly)
  --------------------------------------------------------- */
  state.run.forEach(id => {
    const bug = BY_ID[id];
    const el = els[id];
    el.classList.add('dbg-bug');

    if (state.found.includes(id)) {
      applyFixed(bug, el, true);
      return;
    }

    if (state.hidden && bug.setVisible) bug.setVisible(el, false);

    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Hidden bug. Activate to squash it.');

    const fire = e => {
      // Bugs can sit inside links and cards: never let the click reach them.
      e.preventDefault();
      e.stopPropagation();
      if (state.hidden) return;
      squash(id);
    };

    el.addEventListener('click', fire);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') fire(e);
    });
  });

  /* ---------------------------------------------------------
     WIN: "BUILD PASSING" -> confetti -> vault
  --------------------------------------------------------- */
  function win() {
    if (!state.end) {
      state.end = Date.now();
      state.wins += 1;

      const before = rankIndex(state.wins - 1, state.best);
      state.newBest = !state.best || state.elapsed < state.best;
      if (state.newBest) state.best = state.elapsed;
      const after = rankIndex(state.wins, state.best);
      state.promotedTo = after > before ? RANKS[after] : null;
      save();
    }
    renderHUD();
    showBuild(() => {
      confetti();
      openVault();
    });
  }

  function showBuild(done) {
    const ov = document.createElement('div');
    ov.className = 'dbg-overlay';
    ov.setAttribute('role', 'status');
    const pre = document.createElement('div');
    pre.className = 'dbg-build';
    ov.appendChild(pre);
    document.body.appendChild(ov);

    const lines = [
      ['> npm run build', ''],
      ['> compiling portfolio...', ''],
      ['✔ ' + TOTAL + ' bugs fixed', ''],
      ['BUILD PASSING ✅', 'dbg-pass']
    ];
    let i = 0;
    (function next() {
      if (i < lines.length) {
        const d = document.createElement('div');
        d.textContent = lines[i][0];
        if (lines[i][1]) d.className = lines[i][1];
        pre.appendChild(d);
        i++;
        setTimeout(next, REDUCED ? 60 : 450);
      } else {
        setTimeout(() => { ov.remove(); done(); }, REDUCED ? 200 : 1000);
      }
    })();
  }

  /* ---------------------------------------------------------
     PLAY AGAIN: new seed + new random set, clock reset, best time + rank kept
  --------------------------------------------------------- */
  function playAgain() {
    Object.assign(state, newRun(state.run, state.termCmd));
    state.found = [];
    state.elapsed = 0;
    state.last = null;
    state.end = null;
    state.newBest = false;
    state.promotedTo = null;
    state.announce = true;
    save();
    location.reload(); // simplest way to get a clean page with the new bugs mounted
  }

  /* ---------------------------------------------------------
     VAULT MODAL
  --------------------------------------------------------- */
  let modal = null;
  let lastFocus = null;

  function openVault() {
    if (modal) return;
    lastFocus = document.activeElement;
    const v = CONFIG.vault;
    const first = state.wins === 1; // reward only on the first win
    const time = fmt(state.elapsed);
    const rank = RANKS[rankIndex(state.wins, state.best)];

    modal = document.createElement('div');
    modal.className = 'dbg-modal';
    modal.innerHTML = `
      <div class="dbg-modal-card" role="dialog" aria-modal="true" aria-labelledby="dbgVaultTitle">
        <button type="button" class="dbg-close" aria-label="Close">×</button>
        <div class="dbg-vault-icon" aria-hidden="true">🔓</div>
        <h3 id="dbgVaultTitle"></h3>
        <p class="dbg-time">Cracked in <b></b></p>
        <p class="dbg-badge"></p>
        <p class="dbg-rank-line"></p>
        <p class="dbg-msg"></p>
        <p class="dbg-next"></p>
        <div class="dbg-vault-code" hidden></div>
        <div class="dbg-modal-actions">
          <button type="button" class="dbg-btn" data-act="claim" hidden></button>
          <button type="button" class="dbg-btn dbg-secondary" data-act="share"></button>
          <button type="button" class="dbg-btn dbg-secondary" data-act="again"></button>
        </div>
      </div>`;

    // textContent for all copy: nothing from config is parsed as HTML
    $('#dbgVaultTitle', modal).textContent = first ? v.title : v.replayTitle;
    $('.dbg-time b', modal).textContent = time;
    $('.dbg-badge', modal).textContent = state.newBest && state.wins > 1
      ? '🏆 New personal best!'
      : 'Personal best: ' + fmt(state.best || state.elapsed);
    $('.dbg-rank-line', modal).textContent = 'Rank: ' + rank + (state.promotedTo ? ' · Promoted! 🎉' : '');
    $('.dbg-msg', modal).textContent = first ? v.message : v.replayMessage;
    $('.dbg-next', modal).textContent = nextRankHint();
    $('[data-act="share"]', modal).textContent = v.shareLabel;
    $('[data-act="again"]', modal).textContent = v.againLabel;

    if (first) {
      const code = $('.dbg-vault-code', modal);
      code.textContent = v.code;
      code.hidden = false;
      const claim = $('[data-act="claim"]', modal);
      claim.textContent = v.claimLabel;
      claim.hidden = false;
      claim.addEventListener('click', () => {
        closeVault();
        const c = document.getElementById('contact');
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const ta = $('#contact-form textarea[name="message"]');
          if (ta && !ta.value.trim()) ta.value = v.prefill(time, v.code);
        }, 500);
      });
    }

    document.body.appendChild(modal);
    $('.dbg-close', modal).focus();

    modal.addEventListener('click', e => { if (e.target === modal) closeVault(); });
    $('.dbg-close', modal).addEventListener('click', closeVault);
    $('[data-act="share"]', modal).addEventListener('click', () => share(time, rank));
    $('[data-act="again"]', modal).addEventListener('click', playAgain);

    document.addEventListener('keydown', modalKeys);
  }

  function closeVault() {
    if (!modal) return;
    modal.remove();
    modal = null;
    document.removeEventListener('keydown', modalKeys);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function modalKeys(e) {
    if (!modal) return;
    if (e.key === 'Escape') { closeVault(); return; }
    if (e.key === 'Tab') {
      // tiny focus trap
      const f = [...modal.querySelectorAll('button')].filter(b => !b.hidden);
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function share(time, rank) {
    const text = `I just debugged Satyam Tiwari's portfolio in ${time} and made ${rank} 🐛✅ Can you beat it?`;
    const url = CONFIG.siteUrl;
    const wa = () => window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');

    if (navigator.share) {
      navigator.share({ title: 'Debug the Portfolio', text, url }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + ' ' + url)
        .then(() => toast('Copied to clipboard', 'Paste it anywhere to share.'))
        .catch(wa);
    } else {
      wa();
    }
  }

  /* ---------------------------------------------------------
     CONFETTI  (small canvas, ~2.5s, skipped for reduced motion)
  --------------------------------------------------------- */
  function confetti() {
    if (REDUCED) return;
    const c = document.createElement('canvas');
    c.className = 'dbg-confetti';
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const colors = ['#60a5fa', '#22c55e', '#f59e0b', '#f472b6', '#a78bfa'];

    const parts = Array.from({ length: 140 }, () => ({
      x: c.width / 2,
      y: c.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 6 + 4,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4
    }));

    const t0 = performance.now();
    (function frame(t) {
      const age = t - t0;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(p => {
        p.vy += 0.38;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - age / 2500);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (age < 2500) requestAnimationFrame(frame);
      else c.remove();
    })(t0);
  }

  /* ---------------------------------------------------------
     KONAMI CODE  ↑ ↑ ↓ ↓ ← → ← → B A
     Hidden bonus: matrix theme for 6s + it also counts as the terminal bug.
  --------------------------------------------------------- */
  if (CONFIG.enableKonami) {
    const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let pos = 0;

    document.addEventListener('keydown', e => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const k = (e.key || '').toLowerCase();
      if (k === SEQ[pos]) {
        pos++;
        if (pos === SEQ.length) { pos = 0; konami(); }
      } else {
        pos = k === SEQ[0] ? 1 : 0;
      }
    });

    function konami() {
      htmlEl.classList.add('dbg-matrix');
      setTimeout(() => htmlEl.classList.remove('dbg-matrix'), 6000);
      if (!state.found.includes('secret')) {
        squash('secret');
        if (state.found.length < TOTAL) return; // squash() already toasted
      }
      toast('🎮 Achievement unlocked', 'You know the classics.');
    }
  }

  /* ---------------------------------------------------------
     DISCOVERY + NEW-RUN MESSAGES
  --------------------------------------------------------- */
  if (state.announce) {
    state.announce = false;
    save();
    setTimeout(() => {
      toast(
        'New run: ' + TOTAL + ' fresh bugs 🐛',
        state.best ? 'Your best time is ' + fmt(state.best) + '. Beat it?' : 'Find them all as fast as you can.'
      );
    }, 700);
  }

  const projectsSection = document.getElementById('projects');
  if (projectsSection && 'IntersectionObserver' in window && !state.hinted && state.found.length === 0 && !state.hidden && state.wins === 0) {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      state.hinted = true;
      save();
      toast(
        'Psst... ' + TOTAL + ' bugs are hiding on this page 🐛',
        'Find them all to unlock a vault.',
        { label: 'Not now', run: () => setHidden(true) }
      );
    }, { threshold: 0.2 });
    io.observe(projectsSection);
  }

  /* ---------------------------------------------------------
     PUBLIC API  (used by terminal.js and handy for testing)
  --------------------------------------------------------- */
  window.DebugGame = {
    squash,
    setHidden,
    playAgain,
    open: openVault,

    // Which terminal reply should show the hidden bug right now? (null = none)
    terminalBug() {
      if (state.hidden || state.found.includes('secret')) return null;
      return state.termCmd;
    },

    status() {
      return {
        total: TOTAL,
        found: state.found.slice(),
        hidden: state.hidden,
        complete: state.found.length >= TOTAL,
        wins: state.wins,
        rank: RANKS[rankIndex(state.wins, state.best)],
        best: state.best ? fmt(state.best) : null,
        bugs: SLOTS.map((id, i) => ({
          id: i + 1,
          section: BY_ID[id].section,
          hint: BY_ID[id].hint,
          found: state.found.includes(id)
        }))
      };
    },

    // wipes EVERYTHING, including best time, wins and rank (for testing)
    reset() {
      try { localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* ignore */ }
      location.reload();
    }
  };

  renderHUD();
})();