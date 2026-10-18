/* =========================================================
   TERMINAL "ASK ME ANYTHING"
   Needs: <div id="terminalRoot"></div> in index.html
   Load AFTER debug-game.js (the `debug` command talks to it,
   but the terminal also works fine without it).
   ========================================================= */
(function () {
  'use strict';

  const root = document.getElementById('terminalRoot');
  if (!root) return;

  /* ---------------------------------------------------------
     CONTENT  (edit freely, this is the only place you need to)
  --------------------------------------------------------- */
  const DATA = {
    email: 'sttiwari9211@gmail.com',
    linkedin: 'https://www.linkedin.com/in/satyam-tiwari-8s5a4t3y8a7m4104/',
    github: 'https://github.com/satyamtiwari23',
    resumeSWE: 'Resume/Satyam_Tiwari_SWE.pdf',
    resumeAIML: 'Resume/Satyam_Tiwari_AIML.pdf',

    about: [
      'B.Tech Information Technology student (AKTU) focused on software and web development.',
      'I like turning ideas into clean, usable applications, and I am learning practical AI on the side.',
      'Open to internships, entry-level roles and collaborations.'
    ],

    skills: [
      ['Languages', 'C, C++, Python, Java, JavaScript, HTML/CSS'],
      ['Frontend', 'HTML5, CSS3, JavaScript, Responsive Design'],
      ['Backend', 'Node.js, Express.js, REST API, Java, Python'],
      ['Database', 'MongoDB, MySQL'],
      ['Core', 'DSA, OOP, AI Fundamentals, Problem Solving'],
      ['Tools', 'Git & GitHub, VS Code, Figma, Cursor, Excel, Canva']
    ],

    projects: [
      {
        name: 'CyberShield Hub',
        desc: 'Cybersecurity toolkit: phishing URL, QR and email detection plus an LLM-based assistant (in progress)',
        url: 'https://satyamtiwari23.github.io/CyberSheild_Hub/index.html'
      },
      {
        name: 'ResumeIQ',
        desc: 'Resume analyzer with NLP parsing, ML role prediction and ATS scoring',
        url: 'https://satyamtiwari23.github.io/ai-resume-screening-system/'
      },
      {
        name: 'PDFnest',
        desc: 'Full-stack PDF toolkit with JWT auth and MongoDB Atlas',
        url: 'https://satyamtiwari23.github.io/pdf_generator/'
      },
      {
        name: 'PortfolioPro',
        desc: 'This site: Node, Express and MongoDB behind the client reviews',
        url: 'https://satyamtiwari23.github.io/Portfolio/'
      }
    ],

    experience: [
      ['Freelance', 'LaTeX / Overleaf developer: academic document and paper formatting'],
      ['Freelance', 'Python tutor for beginners']
    ]
  };

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */
  const PROMPT = 'visitor@satyam:~$';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => (REDUCED ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));

  const esc = s => String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text || esc(href)}</a>`;
  const key = t => `<span class="t-key">${esc(t)}</span>`;
  const dim = t => `<span class="t-dim">${esc(t)}</span>`;
  const ok = t => `<span class="t-ok">${esc(t)}</span>`;
  const err = t => `<span class="t-err">${esc(t)}</span>`;
  const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));

  /* ---------------------------------------------------------
     DOM
  --------------------------------------------------------- */
  const CHIPS = ['help', 'about', 'skills', 'projects', 'contact', 'resume', 'hire'];

  root.innerHTML = `
    <div class="term-window" id="termWindow">
      <div class="term-bar">
        <span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="term-title">satyam@portfolio: ~</span>
      </div>
      <div class="term-body" id="termBody">
        <div class="term-out" role="log" aria-live="polite" aria-label="Terminal output"></div>
        <label class="term-inputline">
          <span class="t-prompt">${PROMPT}</span>
          <input class="term-input" type="text" aria-label="Terminal input"
                 autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
        </label>
      </div>
      <div class="term-chips" role="group" aria-label="Quick commands">
        ${CHIPS.map(c => `<button type="button" class="term-chip" data-cmd="${c}">${c}</button>`).join('')}
      </div>
    </div>`;

  const win = root.querySelector('#termWindow');
  const body = root.querySelector('#termBody');
  const out = root.querySelector('.term-out');
  const input = root.querySelector('.term-input');

  const scrollDown = () => { body.scrollTop = body.scrollHeight; };

  function addLine(html) {
    const d = document.createElement('div');
    d.className = 'term-line';
    d.innerHTML = html === '' ? '&nbsp;' : html;
    out.appendChild(d);
    scrollDown();
    return d;
  }

  async function print(lines) {
    for (const l of lines) {
      addLine(l);
      await sleep(26);
    }
  }

  /* ---------------------------------------------------------
     COMMANDS   (each returns an array of lines, HTML allowed)
  --------------------------------------------------------- */
  const VISIBLE = ['help', 'about', 'skills', 'projects', 'experience', 'contact', 'resume', 'hire', 'theme', 'debug', 'whoami', 'clear'];

  const COMMANDS = {
    help() {
      const rows = [
        ['help', 'show this list'],
        ['about', 'a short intro'],
        ['skills', 'what I work with'],
        ['projects', 'things I have built'],
        ['experience', 'freelance work'],
        ['contact', 'email, LinkedIn, GitHub'],
        ['resume', 'download my resume'],
        ['hire', 'take me to the contact form'],
        ['theme', 'switch light / dark'],
        ['debug', 'bug hunt progress'],
        ['clear', 'clean the screen']
      ];
      return [
        dim('Available commands:'),
        ...rows.map(([c, d]) => `  ${key(pad(c, 12))} ${esc(d)}`),
        '',
        dim('Tip: Tab autocompletes, ↑ / ↓ browse history.')
      ];
    },

    about() {
      return DATA.about.map(esc);
    },

    whoami() {
      return ['A curious developer who debugs for fun.'];
    },

    skills() {
      return DATA.skills.map(([k, v]) => `${key(pad(k, 10))} ${esc(v)}`);
    },

    projects() {
      const lines = [];
      DATA.projects.forEach(p => {
        lines.push(`${ok('▸')} ${key(p.name)}`);
        lines.push(`  ${esc(p.desc)}`);
        lines.push(`  ${link(p.url)}`);
        lines.push('');
      });
      lines.push(dim('More on GitHub: ') + link(DATA.github));
      return lines;
    },

    experience() {
      return DATA.experience.map(([k, v]) => `${key(pad(k, 10))} ${esc(v)}`);
    },

    contact() {
      return [
        `${key(pad('email', 10))} ${link('mailto:' + DATA.email, esc(DATA.email))}`,
        `${key(pad('linkedin', 10))} ${link(DATA.linkedin)}`,
        `${key(pad('github', 10))} ${link(DATA.github)}`
      ];
    },

    resume() {
      return [
        `${key(pad('SWE', 8))} ${link(DATA.resumeSWE, 'Satyam_Tiwari_SWE.pdf')}`,
        `${key(pad('AI/ML', 8))} ${link(DATA.resumeAIML, 'Satyam_Tiwari_AIML.pdf')}`
      ];
    },

    hire() {
      setTimeout(() => {
        const c = document.getElementById('contact');
        if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 900);
      return [ok('Great decision 😄'), dim('Taking you to the contact form...')];
    },

    theme() {
      const btn = document.getElementById('themeToggle');
      if (btn) btn.click();
      return [dim('Theme switched.')];
    },

    debug(args) {
      const g = window.DebugGame;
      if (!g) return [err('Bug hunt is not loaded on this page.')];
      const flag = args[0];

      if (flag === '--secret') {
        return g.squash(6)
          ? [ok('✔ Bug #6 squashed. Nice find.')]
          : [dim('Bug #6 is already fixed.')];
      }
      if (flag === 'off') { g.setHidden(true); return [dim('Game hidden. Type "debug on" to bring it back.')]; }
      if (flag === 'on') { g.setHidden(false); return [ok('Game visible again.')]; }
      if (flag === 'stats') {
        const s = g.status();
        return [
          `${key(pad('Rank', 8))} ${esc(s.rank)}`,
          `${key(pad('Wins', 8))} ${s.wins}`,
          `${key(pad('Best', 8))} ${esc(s.best || 'none yet')}`
        ];
      }
      if (flag === 'new') {
        g.playAgain();
        return [dim('Starting a fresh run with new bugs...')];
      }
      if (flag === 'vault') {
        if (g.status().complete) { g.open(); return [ok('Opening the vault...')]; }
        return [dim('The vault is still locked. Fix all 6 bugs first.')];
      }

      const s = g.status();
      const lines = [`Bugs fixed: ${key(s.found.length + '/' + s.total)}`];
      s.bugs.forEach(b => {
        lines.push(b.found
          ? `  ${ok('✔')} #${b.id} ${esc(b.section)}`
          : `  ${dim('○')} #${b.id} ${dim(b.hint)}`);
      });
      if (s.complete) lines.push('', ok('Build passing.') + ' ' + dim('Type "debug vault" to reopen the vault.'));
      return lines;
    },

    /* ---- easter eggs (not listed in help) ---- */
    sudo(args) {
      if (args.join(' ') === 'hire me') {
        return [ok('Access granted.')].concat(COMMANDS.hire());
      }
      return [err('Permission denied.') + ' Nice try 😄'];
    },

    rm() {
      return [err('Nice try.') + ' This portfolio has backups and a git history.'];
    },

    ls() {
      return ['about/  projects/  skills/  reviews/  contact/  secrets.txt'];
    },

    cat(args) {
      if (args[0] === 'secrets.txt') return ['Nothing to see here.', dim('...or is there? Try "debug".')];
      return [err('cat: ' + (args[0] || '') + ': No such file or directory')];
    },

    exit() {
      return ['There is no escape. Try "hire" instead 😄'];
    }
  };

  /* ---------------------------------------------------------
     "Did you mean ...?"
  --------------------------------------------------------- */
  function distance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return dp[a.length][b.length];
  }

  function suggest(cmd) {
    let best = null;
    let bestScore = 3;
    VISIBLE.forEach(v => {
      const d = v.startsWith(cmd) ? 0 : distance(cmd, v);
      if (d < bestScore) { bestScore = d; best = v; }
    });
    return best;
  }

  /* ---------------------------------------------------------
     RUNNER
  --------------------------------------------------------- */
  const history = [];
  let histIdx = 0;
  let busy = false;

  async function run(raw) {
    busy = true;
    const line = raw.trim();

    const echo = addLine(`<span class="t-prompt">${PROMPT}</span> <span class="t-cmd"></span>`);
    echo.querySelector('.t-cmd').textContent = line; // user text is never parsed as HTML

    if (line && history[history.length - 1] !== line) history.push(line);
    histIdx = history.length;
    input.value = '';

    const norm = line.toLowerCase().replace(/\s+/g, ' ');
    const [cmd, ...args] = norm.split(' ');

    try {
      if (!norm) {
        /* empty enter: just a new prompt */
      } else if (cmd === 'clear' || cmd === 'cls') {
        out.innerHTML = '';
      } else if (Object.prototype.hasOwnProperty.call(COMMANDS, cmd)) {
        await print(COMMANDS[cmd](args));
      } else {
        const lines = [err('command not found: ') + esc(cmd) + dim(". Type 'help'.")];
        const s = suggest(cmd);
        if (s) lines.push(dim('Did you mean ') + key(s) + dim('?'));
        await print(lines);
      }
    } catch (e) {
      await print([err('Something broke in that command. Try again.')]);
      console.error(e);
    }

    busy = false;
    scrollDown();
  }

  async function typeAndRun(cmd) {
    if (busy) return;
    busy = true;
    input.value = '';
    for (const ch of cmd) {
      input.value += ch;
      await sleep(35);
    }
    await sleep(120);
    run(input.value);
  }

  /* ---------------------------------------------------------
     EVENTS
  --------------------------------------------------------- */
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (busy) return;
      run(input.value);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
      else { histIdx = history.length; input.value = ''; }
      return;
    }

    if (e.key === 'Tab') {
      const v = input.value.trim().toLowerCase();
      if (!v || v.includes(' ')) return; // let Tab move focus normally
      e.preventDefault();
      const matches = VISIBLE.filter(c => c.startsWith(v));
      if (matches.length === 1) {
        input.value = matches[0];
      } else if (matches.length > 1) {
        addLine(matches.map(m => key(m)).join('   '));
      }
      return;
    }

    if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  root.querySelectorAll('.term-chip').forEach(btn => {
    btn.addEventListener('click', () => typeAndRun(btn.dataset.cmd));
  });

  // Click anywhere in the terminal to focus (desktop only: on phones this would pop the keyboard open)
  if (window.matchMedia('(hover: hover)').matches) {
    body.addEventListener('click', () => {
      if (!String(window.getSelection())) input.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------
     INTRO  (plays once, when the terminal scrolls into view.
     No auto-focus, otherwise the page would jump here on load.)
  --------------------------------------------------------- */
  async function intro() {
    busy = true;
    const el = addLine('');
    const text = "Welcome! Type 'help' to see what I can do.";
    for (const ch of text) {
      el.textContent += ch;
      await sleep(22);
    }
    addLine(dim('Try ') + key('skills') + dim(', ') + key('projects') + dim(' or ') + key('hire') + dim('.'));
    busy = false;
  }

  let introPlayed = false;
  const playIntro = () => { if (!introPlayed) { introPlayed = true; intro(); } };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { io.disconnect(); playIntro(); }
    }, { threshold: 0.35 });
    io.observe(win);
  } else {
    playIntro();
  }
})();