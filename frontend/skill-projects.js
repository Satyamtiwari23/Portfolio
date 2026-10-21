/* =========================================================
   SKILL -> RELATED PROJECTS

   Hover (or tap / keyboard-focus) a skill chip and a popover lists the
   projects that use that skill. A small number on the chip says how many.

   Everything is derived from the project cards already on your page
   (title, tags, picture, live link), so when you add a project or a
   tag, the skills update by themselves. Skills that no project mentions
   (for example DSA or MySQL) simply stay plain chips: nothing is invented.

   Load after debug-game.js (the bug game rewrites one chip's text,
   and this script reads that chip's original text from data-orig).
   ========================================================= */
(function () {
    'use strict';

    const skillsRoot = document.getElementById('skills');
    const projectsRoot = document.getElementById('projects');
    if (!skillsRoot || !projectsRoot) return;

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CAN_HOVER = window.matchMedia('(hover: hover)').matches;

    // "Node.js" -> "nodejs", "REST API" -> "restapi"
    const norm = s => String(s).toLowerCase().replace(/[^a-z0-9+#]/g, '');

    /* ---------------------------------------------------------
       CONFIG (the only part you may want to edit)
    --------------------------------------------------------- */

    // A skill chip normally matches a project tag with the same name.
    // List the ones that are written differently on your page.
    const ALIASES = {
        html5: ['html5', 'html'],
        css3: ['css3', 'css'],
        restapis: ['restapi'],
        responsivedesign: ['responsiveui'],
        mongodb: ['mongodb', 'mongodbatlas'],
        scikitlearn: ['scikitlearn'],
        svm: ['customsvmmodel'],
        nlp: ['spacynlp'],
        spacy: ['spacynlp'],
        llmintegration: ['llmgroq']
    };

    // Skills a project really uses but does not list as a tag.
    // Format: normalized skill name -> project names. Delete a line to remove a claim.
    const MANUAL = {
        dommanipulation: ['PortfolioPro'],
        fetchapi: ['PortfolioPro']
    };

    /* ---------------------------------------------------------
       READ THE PROJECTS FROM THE PAGE
    --------------------------------------------------------- */
    const projects = [...projectsRoot.querySelectorAll('.project-card')].map(card => {
        const titleEl = card.querySelector('.project-title');
        const raw = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
        const parts = raw.split(/\s[–—-]\s/);
        const name = (parts[0] || raw).trim();

        let sub = parts.slice(1).join(' – ').replace(/\s*\(in progress\)/i, '').trim();
        if (!sub) {
            const d = card.querySelector('.project-description');
            sub = d ? d.textContent.replace(/\s+/g, ' ').trim() : '';
        }

        const img = card.querySelector('.project-image img');
        const link = card.closest('a.project-link');

        return {
            card,
            name,
            sub,
            inProgress: /\(in progress\)/i.test(raw),
            imgSrc: img ? img.getAttribute('src') : '',
            live: link ? link.href : '',
            tags: [...card.querySelectorAll('.tag')].map(t => t.textContent.trim())
        };
    }).filter(p => p.name);

    if (!projects.length) return;

    function matchesFor(skill) {
        const key = norm(skill);
        const wanted = ALIASES[key] || [key];
        const manual = (MANUAL[key] || []).map(norm);
        const out = [];

        projects.forEach(p => {
            const tag = p.tags.find(t => wanted.includes(norm(t)));
            if (tag) out.push({ p, via: norm(tag) === key ? '' : 'Tag: ' + tag });
            else if (manual.includes(norm(p.name))) out.push({ p, via: 'Used in its source code' });
        });
        return out;
    }

    /* ---------------------------------------------------------
       POPOVER  (lives on <body>, position: fixed, so it is never
       clipped by a card and never affected by the 3D tilt)
    --------------------------------------------------------- */
    const ICON_LIVE = '<svg class="sp-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    const ICON_JUMP = '<svg class="sp-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';

    let pop = null;
    let current = null;
    let closeTimer = null;
    let skipFocusOpen = false;

    function ensurePop() {
        if (pop) return;
        pop = document.createElement('div');
        pop.className = 'sp-pop';
        pop.hidden = true;
        pop.setAttribute('role', 'region');
        document.body.appendChild(pop);
        pop.addEventListener('mouseenter', () => clearTimeout(closeTimer));
        pop.addEventListener('mouseleave', scheduleClose);
    }

    function scheduleClose() {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 220); // time to cross the small gap into the popover
    }

    function close() {
        clearTimeout(closeTimer);
        if (!pop || pop.hidden) return;
        pop.hidden = true;
        if (current) current.classList.remove('sp-active');
        current = null;
    }

    function jump(p) {
        close();
        p.card.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
        p.card.classList.add('sp-flash');
        setTimeout(() => p.card.classList.remove('sp-flash'), 1900);
    }

    function buildRow(m) {
        const p = m.p;
        const el = document.createElement(p.live ? 'a' : 'button');
        el.className = 'sp-row';

        if (p.live) {
            el.href = p.live;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
            el.title = 'Open live demo';
            el.addEventListener('click', close);
        } else {
            el.type = 'button';
            el.title = 'Show in Projects';
            el.addEventListener('click', () => jump(p));
        }

        const thumb = document.createElement('div');
        thumb.className = 'sp-thumb';
        if (p.imgSrc) {
            const img = document.createElement('img');
            img.src = p.imgSrc;
            img.alt = '';
            img.loading = 'lazy';
            thumb.appendChild(img);
        }

        const text = document.createElement('div');
        text.className = 'sp-text';

        const name = document.createElement('div');
        name.className = 'sp-name';
        name.appendChild(document.createTextNode(p.name));
        if (p.inProgress) {
            const badge = document.createElement('span');
            badge.className = 'sp-badge';
            badge.textContent = 'In progress';
            name.appendChild(badge);
        }
        text.appendChild(name);

        if (p.sub) {
            const sub = document.createElement('div');
            sub.className = 'sp-sub';
            sub.textContent = p.sub;
            text.appendChild(sub);
        }

        if (m.via) {
            const via = document.createElement('div');
            via.className = 'sp-via';
            via.textContent = m.via;
            text.appendChild(via);
        }

        el.appendChild(thumb);
        el.appendChild(text);
        el.insertAdjacentHTML('beforeend', p.live ? ICON_LIVE : ICON_JUMP);
        return el;
    }

    function place(chip) {
        const r = chip.getBoundingClientRect();
        const pw = pop.offsetWidth;
        const ph = pop.offsetHeight;
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;

        const left = Math.min(Math.max(8, r.left), Math.max(8, vw - pw - 8));
        let top = r.bottom + 8;
        if (top + ph > vh - 8 && r.top - ph - 8 > 8) top = r.top - ph - 8; // flip above if there is no room below

        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
    }

    const info = new WeakMap();

    // Only allow related-project interaction after the bug is fixed
    const interactive = chip =>
        info.has(chip) &&
        (!chip.classList.contains('dbg-garbled') ||
            chip.classList.contains('dbg-fixed'));



    function open(chip) {
        if (!interactive(chip)) return;
        ensurePop();
        clearTimeout(closeTimer);

        if (current && current !== chip) current.classList.remove('sp-active');
        current = chip;
        chip.classList.add('sp-active');

        const d = info.get(chip);
        pop.textContent = '';
        pop.setAttribute('aria-label', 'Projects using ' + d.name);

        const head = document.createElement('p');
        head.className = 'sp-head';
        const strong = document.createElement('strong');
        strong.textContent = d.name;
        head.appendChild(strong);
        head.appendChild(document.createTextNode(
            ' is used in ' + d.matches.length + (d.matches.length === 1 ? ' project' : ' projects')
        ));
        pop.appendChild(head);

        d.matches.forEach(m => pop.appendChild(buildRow(m)));

        pop.hidden = false;
        place(chip);
    }

    /* ---------------------------------------------------------
       WIRE UP THE CHIPS
    --------------------------------------------------------- */
    skillsRoot.querySelectorAll('.skill-tag').forEach(chip => {
        const name = (chip.dataset.orig || chip.textContent).trim();
        const matches = matchesFor(name);
        if (!matches.length) return; // no project mentions it: stays a plain chip

        info.set(chip, { name, matches });
        chip.dataset.sp = String(matches.length);

        // don't override the role/label the bug game gave to a chip that is still a bug
        if (!chip.classList.contains('dbg-bug')) {
            chip.tabIndex = 0;
            chip.setAttribute('role', 'button');
            chip.setAttribute('aria-haspopup', 'true');
            chip.setAttribute('aria-label', name + ', used in ' + matches.length + (matches.length === 1 ? ' project' : ' projects'));
        }

        chip.addEventListener('mouseenter', () => {
            if (CAN_HOVER) open(chip);
        });

        chip.addEventListener('mouseleave', () => {
            if (CAN_HOVER) scheduleClose();
        });

        chip.addEventListener('pointerdown', () => {
            if (!CAN_HOVER) open(chip);
        });
        chip.addEventListener('focus', () => { if (!skipFocusOpen) open(chip); });

        chip.addEventListener('click', () => {
            if (!interactive(chip)) return;
            if (!CAN_HOVER && current === chip && pop && !pop.hidden) close(); // touch: second tap closes
            else open(chip);
        });

        chip.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && interactive(chip)) {
                e.preventDefault();
                open(chip);
                const first = pop.querySelector('.sp-row');
                if (first) first.focus(); // let keyboard users reach the links
            }
        });
    });

    /* ---------------------------------------------------------
       CLOSING
    --------------------------------------------------------- */
    document.addEventListener('pointerdown', e => {
        if (!pop || pop.hidden) return;
        const t = e.target;
        if (t instanceof Element && (pop.contains(t) || t.closest('#skills [data-sp]'))) return;
        close();
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !pop || pop.hidden) return;
        const chip = current;
        close();
        if (chip && chip.focus) {
            // focusing the chip must not re-open the popover we just closed
            skipFocusOpen = true;
            chip.focus({ preventScroll: true });
            skipFocusOpen = false;
        }
    });

    // the popover is position: fixed, so any scroll or resize would leave it behind
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
})();