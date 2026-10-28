(function () {
  "use strict";

  const D = window.PORTFOLIO;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // index.html shows the GitHub-pinned projects; work.html shows the rest
  const HOME = document.body.dataset.page !== "work";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    ta.remove();
    return Promise.resolve();
  }

  /* ---------- Theme ---------- */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    store("theme", theme);
    document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "light" ? "#f6f8fb" : "#0b1020");
    if (hero) hero.refreshColors();
  }
  $("#theme-toggle").addEventListener("click", () => {
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  });

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  const menuBtn = $("#menu-toggle");
  const links = $("#nav-links");
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  menuBtn.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
  const sectionLinks = $$("a", links);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        sectionLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          revealer.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  function observeReveals(root = document) {
    $$(".reveal:not(.in)", root).forEach((el) => revealer.observe(el));
  }
  // Fallback for jumps (anchor links, restored scroll): never leave on-screen content hidden
  function revealVisible() {
    $$(".reveal:not(.in)").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
    });
  }
  window.addEventListener("load", () => setTimeout(revealVisible, 120));
  window.addEventListener("hashchange", () => setTimeout(revealVisible, 120));

  /* ---------- Hero network ---------- */
  const hero = !$("#hero-canvas") ? null : (function () {
    const canvas = $("#hero-canvas");
    const ctx = canvas.getContext("2d");
    let w, h, dpr, nodes = [], raf = null, visible = true;
    const mouse = { x: -9999, y: -9999 };
    let colA, colB, line;

    function refreshColors() {
      colA = cssVar("--accent");
      colB = cssVar("--accent-2");
      line = document.documentElement.getAttribute("data-theme") === "light" ? "15,23,42" : "148,163,184";
      if (reduceMotion) draw();
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1,
        hub: Math.random() < 0.12,
      }));
      if (reduceMotion) draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const maxD = 140;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxD) {
            ctx.strokeStyle = `rgba(${line},${(1 - d / maxD) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = colA;
          ctx.globalAlpha = (1 - md / 180) * 0.55;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      nodes.forEach((n) => {
        ctx.fillStyle = n.hub ? colA : colB;
        ctx.globalAlpha = n.hub ? 0.95 : 0.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.hub ? n.r + 1.4 : n.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function step() {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 180 && d > 1) {
          n.x += (dx / d) * 0.25;
          n.y += (dy / d) * 0.25;
        }
      });
      draw();
      raf = requestAnimationFrame(step);
    }
    function start() {
      if (reduceMotion || raf || !visible || document.hidden) return;
      raf = requestAnimationFrame(step);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = null;
    }
    refreshColors();
    resize();
    window.addEventListener("resize", () => { resize(); });
    $("#hero").addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    $("#hero").addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
    return { refreshColors };
  })();

  /* ---------- Rotator ---------- */
  (function () {
    const el = $("#rotator");
    if (!el) return;
    const lines = D.profile.taglines;
    let i = 0;
    if (reduceMotion) {
      setInterval(() => { i = (i + 1) % lines.length; el.textContent = lines[i]; }, 3200);
      return;
    }
    function type(text, n = 0) {
      el.textContent = text.slice(0, n);
      if (n < text.length) return setTimeout(() => type(text, n + 1), 42);
      setTimeout(() => erase(text, text.length), 2000);
    }
    function erase(text, n) {
      el.textContent = text.slice(0, n);
      if (n > 0) return setTimeout(() => erase(text, n - 1), 22);
      i = (i + 1) % lines.length;
      setTimeout(() => type(lines[i]), 250);
    }
    setTimeout(() => erase(lines[0], lines[0].length), 2400);
  })();

  /* ---------- Stats ---------- */
  (function () {
    const dl = $("#stats");
    if (!dl) return;
    dl.innerHTML = D.stats
      .map((s) => `<div class="stat"><dt><span data-count="${s.value}">0</span>${esc(s.suffix)}</dt><dd>${esc(s.label)}</dd></div>`)
      .join("");
    const nums = $$("[data-count]", dl);
    function run() {
      nums.forEach((n) => {
        const target = +n.dataset.count;
        if (reduceMotion) { n.textContent = target.toLocaleString(); return; }
        const t0 = performance.now(), dur = 1400;
        (function tick(t) {
          const p = Math.min(1, (t - t0) / dur);
          n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }
    new IntersectionObserver(([en], obs) => { if (en.isIntersecting) { run(); obs.disconnect(); } }, { threshold: 0.4 }).observe(dl);
  })();

  /* ---------- Journey ---------- */
  function renderTimeline(list, items) {
    list.innerHTML = items
      .map(
        (it) => `<li class="timeline__item reveal${/Present/.test(it.when) ? " is-now" : ""}">
          <div class="timeline__card">
            ${it.when ? `<div class="timeline__when">${esc(it.when)}</div>` : ""}
            <h4 class="timeline__title">${esc(it.title)}</h4>
            ${it.org ? `<div class="timeline__org">${esc(it.org)}</div>` : ""}
            ${it.points.length ? `<ul>${it.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
          </div>
        </li>`
      )
      .join("");
  }
  if ($("#work-list")) {
    renderTimeline($("#work-list"), D.work);
    renderTimeline($("#edu-list"), D.education);
  }
  if ($("#recognition")) {
    $("#recognition").innerHTML = D.recognition
      .map((r) => `<div class="recognition__item reveal"><dt>${esc(r.value)}</dt><dd><span class="recognition__label-text">${esc(r.label)}</span><span class="recognition__note">${esc(r.note)}</span></dd></div>`)
      .join("");
  }

  /* ---------- Projects ---------- */
  const catLabel = Object.fromEntries(D.categories.map((c) => [c.id, c.label]));
  const artFor = {
    ai: "linear-gradient(135deg,#0f766e,#1e3a8a)",
    data: "linear-gradient(135deg,#7c2d12,#1e3a8a)",
    ml: "linear-gradient(135deg,#4c1d95,#0f766e)",
    bi: "linear-gradient(135deg,#854d0e,#7c2d12)",
    web: "linear-gradient(135deg,#1e3a8a,#4c1d95)",
    learning: "linear-gradient(135deg,#334155,#0f766e)",
  };
  const state = { cat: "all", q: "", skill: new URLSearchParams(location.search).get("skill") };
  const grid = $("#project-grid");
  const LIST = D.projects.filter((p) => (HOME ? p.pinned : !p.pinned));
  const OTHER = D.projects.filter((p) => (HOME ? !p.pinned : p.pinned));
  const otherPage = HOME
    ? { href: "work.html", name: "Additional work" }
    : { href: "index.html", name: "the featured projects", hash: "#projects" };
  const skillLink = (s) => `${otherPage.href}?skill=${encodeURIComponent(s)}${otherPage.hash || ""}`;

  function matches(p) {
    if (state.cat !== "all" && !p.categories.includes(state.cat)) return false;
    if (state.skill && !p.tech.includes(state.skill)) return false;
    if (state.q) {
      const hay = [p.title, p.summary, p.period, ...p.tech, ...p.highlights, ...p.categories.map((c) => catLabel[c])].join(" ").toLowerCase();
      return state.q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  }

  function renderChips() {
    const chips = $("#category-chips");
    if (!chips) return;
    const counts = Object.fromEntries(D.categories.map((c) => [c.id, c.id === "all" ? LIST.length : LIST.filter((p) => p.categories.includes(c.id)).length]));
    chips.innerHTML = D.categories
      .filter((c) => counts[c.id] > 0)
      .map((c) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">${esc(c.label)}<span class="chip__n">${counts[c.id]}</span></button>`)
      .join("");
  }

  function cardHTML(p) {
    const media = p.image
      ? `<img src="${p.image}" alt="" loading="lazy" decoding="async" />`
      : `<div class="card__art" style="--art:${artFor[p.categories[0]]}"><span>${esc(p.art || p.tech.slice(0, 2).join(" + "))}</span></div>`;
    const tags = p.tech.slice(0, 4).map((t) => `<span class="tag${state.skill === t ? " is-hit" : ""}">${esc(t)}</span>`).join("");
    return `<button type="button" class="card reveal${p.featured ? " is-featured" : ""}" data-id="${p.id}" aria-label="${esc(p.title)}: open details">
      <div class="card__media">${p.featured ? '<span class="card__badge">Flagship</span>' : ""}${media}</div>
      <div class="card__body">
        <div class="card__meta"><span>${esc(catLabel[p.categories[0]])}</span><span>${esc(p.period)}</span></div>
        <h3 class="card__title">${esc(p.title)}</h3>
        <p class="card__summary">${esc(p.summary)}</p>
        <div class="tags">${tags}</div>
        <span class="card__more">Details →</span>
      </div>
    </button>`;
  }

  function renderProjects() {
    const list = LIST.filter(matches);
    grid.innerHTML = list.map(cardHTML).join("");
    const empty = $("#project-empty");
    empty.hidden = list.length > 0;
    const note = $("#filter-note");
    if (state.skill) {
      const elsewhere = OTHER.filter((p) => p.tech.includes(state.skill)).length;
      const more = elsewhere ? ` · <a href="${skillLink(state.skill)}">${elsewhere} more in ${otherPage.name} →</a>` : "";
      note.hidden = false;
      note.innerHTML = `Showing ${list.length} ${list.length === 1 ? "project here that uses" : "projects here that use"} <strong>${esc(state.skill)}</strong>${more} <button type="button" id="clear-skill">Clear</button>`;
      empty.textContent = elsewhere ? "None of the projects on this page use it; follow the link above." : "No projects match that yet.";
    } else {
      note.hidden = true;
      note.innerHTML = "";
      empty.textContent = "No projects match that yet. Try another word or clear the filter.";
    }
    observeReveals(grid);
    if (finePointer && !reduceMotion) $$(".card", grid).forEach(addTilt);
  }

  function addTilt(card) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  }

  if ($("#category-chips")) {
    $("#category-chips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.dataset.cat;
      renderChips();
      renderProjects();
    });
  }
  let searchTimer;
  if ($("#project-search")) {
    $("#project-search").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.q = e.target.value.trim().toLowerCase();
        renderProjects();
      }, 120);
    });
  }
  const moreCount = $("#more-count");
  if (moreCount) moreCount.textContent = `(${OTHER.length})`;
  $("#filter-note").addEventListener("click", (e) => {
    if (e.target.id === "clear-skill") setSkill(null);
  });
  grid.addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (c) openProject(c.dataset.id);
  });

  function setSkill(skill) {
    state.skill = skill;
    state.cat = "all";
    renderChips();
    renderProjects();
  }

  /* ---------- Dialog helpers ---------- */
  function wireDialog(dlg, onClose) {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });
    if (onClose) dlg.addEventListener("close", onClose);
  }

  /* ---------- Project modal ---------- */
  const modal = $("#project-modal");
  let lastFocus = null;
  wireDialog(modal, () => {
    if (location.hash.startsWith("#project/")) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  });

  function openProject(id) {
    const p = D.projects.find((x) => x.id === id);
    if (!p) return false;
    lastFocus = document.activeElement;
    const links = p.links
      .map((l, i) => {
        const internal = l.url.startsWith("#");
        return `<a class="btn ${i === 0 ? "btn--primary" : "btn--ghost"}" href="${esc(l.url)}"${internal ? " data-internal" : ' target="_blank" rel="noopener"'}>${esc(l.label)}${internal ? "" : " ↗"}</a>`;
      })
      .join("");
    const dive = p.deepDive ? `<button type="button" class="btn btn--ghost" data-dive="${p.deepDive}">See how it works</button>` : "";
    const gallery = p.gallery
      ? `<h4>Screens</h4><div class="modal__gallery">${p.gallery.map((g, i) => `<img src="${g}" alt="${esc(p.title)} screenshot ${i + 1}" data-gi="${i}" loading="lazy" />`).join("")}</div>`
      : "";
    $("#modal-body").innerHTML = `
      ${p.image && !p.gallery ? `<div class="modal__hero"><img src="${p.image}" alt="${esc(p.title)}" /></div>` : ""}
      <div class="modal__content">
        <div class="modal__meta">${esc(p.categories.map((c) => catLabel[c]).join(" · "))}${p.period ? " · " + esc(p.period) : ""}</div>
        <h3 class="modal__title" id="modal-title">${esc(p.title)}</h3>
        <p class="modal__summary">${esc(p.summary)}</p>
        ${p.highlights.length ? `<h4>Highlights</h4><ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${gallery}
        <h4>Built with</h4>
        <div class="tags">${p.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="modal__links">${links}${dive}</div>
      </div>`;
    modal.showModal();
    $(".modal__inner", modal).scrollTop = 0;
    history.replaceState(null, "", "#project/" + p.id);
    return true;
  }

  modal.addEventListener("click", (e) => {
    const dive = e.target.closest("[data-dive]");
    if (dive) {
      modal.close();
      if (!$("#deep-dives")) { location.href = "index.html#deep-dives"; return; }
      selectTab("tab-" + dive.dataset.dive);
      $("#deep-dives").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    const internal = e.target.closest("[data-internal]");
    if (internal) {
      e.preventDefault();
      modal.close();
      const target = $(internal.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      else location.href = "index.html" + internal.getAttribute("href");
      return;
    }
    const img = e.target.closest("[data-gi]");
    if (img) {
      const p = D.projects.find((x) => location.hash === "#project/" + x.id);
      if (p && p.gallery) openLightbox(p.gallery.map((src, i) => ({ src, cap: `${p.title} · screen ${i + 1}` })), +img.dataset.gi);
    }
  });

  /* ---------- Deep dives: tabs ---------- */
  const tabs = $$(".tab");
  function selectTab(id) {
    tabs.forEach((t) => {
      const on = t.id === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (!fraud) return;
    if (id === "tab-fraud") fraud.start();
    else fraud.stop();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t.id));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next.id);
      next.focus();
    });
  });

  /* ---------- Deep dive: job-shop ---------- */
  (function () {
    if (!$("#jobshop-flow")) return;
    const J = D.deepDives.jobshop;
    const nodes = [
      ["planner", "Planner", "web UI · CLI · MCP"],
      ["agent", "LLM agent", "hand-written loop"],
      ["tools", "Draft tools", "scratch copy only"],
      ["solver", "CP-SAT solver", "OR-Tools"],
      ["validator", "Validator + KPIs", "computed, not typed"],
      ["person", "Person approves", "single-use token"],
      ["live", "Live plan", "the only commit path"],
    ];
    const flow = $("#jobshop-flow");
    flow.innerHTML = nodes
      .map(([id, t, s], i) =>
        `<div class="flow__node${id === "person" ? " is-human" : ""}" data-node="${id}">${esc(t)}<small>${esc(s)}</small>` +
        (i < nodes.length - 1 ? `<span class="flow__arrow" data-arrow="${id}>${nodes[i + 1][0]}">→</span>` : "") +
        `</div>`)
      .join("");
    const stepsEl = $("#jobshop-steps");
    stepsEl.innerHTML = J.steps
      .map((s, i) => `<li><button type="button" class="step" data-step="${i}" aria-pressed="false">
          <span class="step__n">${i + 1}</span>
          <span><span class="step__t">${esc(s.title)}</span><span class="step__d">${esc(s.text)}</span></span>
        </button></li>`)
      .join("");
    let current = 0, timer = null, userTook = false;
    function show(i) {
      current = i;
      $$(".step", stepsEl).forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      const on = J.steps[i].nodes;
      $$(".flow__node", flow).forEach((n) => n.classList.toggle("is-on", on.includes(n.dataset.node)));
      $$(".flow__arrow", flow).forEach((a) => {
        const [x, y] = a.dataset.arrow.split(">");
        a.classList.toggle("is-on", on.includes(x) && on.includes(y));
      });
    }
    stepsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      userTook = true;
      clearInterval(timer);
      show(+b.dataset.step);
    });
    show(0);
    if (!reduceMotion) {
      new IntersectionObserver(([en]) => {
        clearInterval(timer);
        if (en.isIntersecting && !userTook) timer = setInterval(() => show((current + 1) % J.steps.length), 3600);
      }, { threshold: 0.35 }).observe(stepsEl);
    }

    const kpis = $("#jobshop-kpis");
    function renderKpis(plan) {
      kpis.innerHTML = J.kpis
        .map((k) => {
          const v = plan === "live" ? k.live : k.draft;
          const worse = plan === "draft" && k.draft !== k.live;
          return `<div class="kpi"><dt>${esc(k.label)}</dt><dd class="${worse ? "is-worse" : ""}">${esc(v)}<span class="kpi__note">${plan === "draft" ? esc(k.note) : ""}</span></dd></div>`;
        })
        .join("");
    }
    renderKpis("live");
    $$(".seg__btn").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".seg__btn").forEach((x) => {
          x.classList.toggle("is-on", x === b);
          x.setAttribute("aria-pressed", String(x === b));
        });
        renderKpis(b.dataset.plan);
      })
    );
    renderProof($("#jobshop-proof"), J.proof);
  })();

  function renderProof(dl, items) {
    dl.innerHTML = items.map((p) => `<div><dt>${esc(p.value)}</dt><dd>${esc(p.label)}</dd></div>`).join("");
  }

  /* ---------- Deep dive: fraud pipeline ---------- */
  const fraud = !$("#fraud-stages") ? null : (function () {
    const F = D.deepDives.fraud;
    const wrap = $("#fraud-stages");
    const subs = { gen: "Kafka", det: "Isolation Forest", tri: "Haiku + cache", inv: "Opus + 8 tools", rep: "case file", grd: "deterministic", hum: "interrupt()" };
    wrap.innerHTML = F.stages
      .map((s, i) => `<button type="button" class="stage${s.id === "hum" ? " stage--human" : ""}" data-stage="${i}" aria-pressed="false">${esc(s.title)}<small>${subs[s.id]}</small></button>`)
      .join("");
    const detail = $("#fraud-detail");
    function show(i) {
      $$(".stage", wrap).forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      detail.innerHTML = `<h4>${i + 1}. ${esc(F.stages[i].title)}</h4><p>${esc(F.stages[i].text)}</p>`;
    }
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-stage]");
      if (b) show(+b.dataset.stage);
    });
    show(1);
    renderProof($("#fraud-proof"), F.proof);

    const canvas = $("#fraud-canvas");
    const ctx = canvas.getContext("2d");
    // Payments flow along a track just under the stage buttons
    let dots = [], raf = null, last = 0, spawnAcc = 0, centers = [], trackY = 0;
    function measure() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rects = $$(".stage", wrap).map((b) => b.getBoundingClientRect());
      centers = rects.map((br) => ({ x: br.left - r.left + br.width / 2 }));
      trackY = Math.max(...rects.map((br) => br.bottom - r.top)) + 16;
    }
    function frame(t) {
      const dt = Math.min(50, t - (last || t));
      last = t;
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      if (centers.length) {
        const accent = cssVar("--accent"), muted = cssVar("--faint");
        const lastX = centers[centers.length - 1].x;
        ctx.strokeStyle = muted;
        ctx.globalAlpha = 0.25;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(centers[0].x, trackY);
        ctx.lineTo(lastX, trackY);
        ctx.stroke();
        ctx.setLineDash([]);
        centers.forEach((c) => {
          ctx.beginPath();
          ctx.arc(c.x, trackY, 3, 0, Math.PI * 2);
          ctx.fillStyle = muted;
          ctx.fill();
        });
        spawnAcc += dt;
        while (spawnAcc > 45) {
          spawnAcc -= 45;
          dots.push({ x: centers[0].x - 30, y: trackY + (Math.random() - 0.5) * 6, flagged: Math.random() < 0.015, stage: 0, life: 1 });
        }
        dots.forEach((d) => {
          const target = centers[Math.min(d.stage + 1, centers.length - 1)];
          if (!d.flagged && d.stage >= 1) {
            d.life -= dt / 500;
            d.y += dt * 0.02;
          } else if (!(d.flagged && d.stage >= centers.length - 1)) {
            d.x += (d.flagged ? 0.11 : 0.16) * dt;
            if (d.x >= target.x) d.stage++;
          }
          if (d.flagged && d.stage >= centers.length - 1) d.life -= dt / 1800;
          ctx.globalAlpha = Math.max(0, d.life) * (d.flagged ? 1 : 0.5);
          ctx.fillStyle = d.flagged ? accent : muted;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.flagged ? 4 : 2, 0, Math.PI * 2);
          ctx.fill();
          if (d.flagged) {
            ctx.globalAlpha *= 0.25;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
        dots = dots.filter((d) => d.life > 0 && d.x < r.width + 20);
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (reduceMotion || raf || $("#panel-fraud").hidden) return;
      measure();
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = null;
    }
    window.addEventListener("resize", () => { if (raf) measure(); });
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe($("#fraud-pipeline"));
    return { start, stop };
  })();

  /* ---------- Deep dive: complaint copilot ---------- */
  (function () {
    if (!$("#complaint-days")) return;
    const C = D.deepDives.complaint;
    const wrap = $("#complaint-days");
    wrap.innerHTML = C.days
      .map((d, i) => `<button type="button" class="day" data-day="${i}" aria-pressed="false"><b>Day ${d.day}</b><span>${esc(d.topic)}</span></button>`)
      .join("");
    const detail = $("#complaint-detail");
    function show(i) {
      const d = C.days[i];
      $$(".day", wrap).forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
      detail.innerHTML = `<h4>Day ${d.day}: ${esc(d.topic)}</h4>
        <dl><dt>Built</dt><dd>${esc(d.built)}</dd><dt>Result</dt><dd class="result">${esc(d.result)}</dd></dl>`;
    }
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("[data-day]");
      if (b) show(+b.dataset.day);
    });
    show(2);
    renderProof($("#complaint-proof"), C.proof);
  })();

  /* ---------- Dashboards gallery + lightbox ---------- */
  const shots = D.dashboards.map((title, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { src: `assets/img/dashboards/day${n}.webp`, thumb: `assets/img/dashboards/day${n}-thumb.webp`, cap: `Day ${i + 1} · ${title}`, title, day: i + 1 };
  });
  if ($("#gallery")) {
    $("#gallery").innerHTML = shots
      .map((s, i) => `<button type="button" class="shot reveal" data-shot="${i}" aria-label="View ${esc(s.title)}">
          <figure><img src="${s.thumb}" alt="${esc(s.title)} Power BI dashboard" loading="lazy" decoding="async" />
          <figcaption><b>Day ${s.day}</b>${esc(s.title)}</figcaption></figure></button>`)
      .join("");
    $("#gallery").addEventListener("click", (e) => {
      const b = e.target.closest("[data-shot]");
      if (b) openLightbox(shots, +b.dataset.shot);
    });
  }

  const lightbox = $("#lightbox");
  let lbItems = [], lbIndex = 0, lbReturn = null;
  wireDialog(lightbox, () => { if (lbReturn) lbReturn.focus(); });
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const it = lbItems[lbIndex];
    $("#lightbox-img").src = it.src;
    $("#lightbox-img").alt = it.cap;
    $("#lightbox-cap").textContent = `${it.cap}  (${lbIndex + 1} / ${lbItems.length})`;
    const many = lbItems.length > 1;
    $(".lightbox__prev").hidden = !many;
    $(".lightbox__next").hidden = !many;
  }
  function openLightbox(items, i) {
    lbItems = items;
    lbReturn = document.activeElement;
    lbShow(i);
    lightbox.showModal();
  }
  $(".lightbox__prev").addEventListener("click", () => lbShow(lbIndex - 1));
  $(".lightbox__next").addEventListener("click", () => lbShow(lbIndex + 1));
  lightbox.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
  });
  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Skills ---------- */
  (function () {
    if (!$("#skills-list")) return;
    const count = {};
    D.projects.forEach((p) => p.tech.forEach((t) => { count[t] = (count[t] || 0) + 1; }));
    $("#skills-list").innerHTML = D.skills
      .map((g) => `<div class="skill-group reveal"><h3>${esc(g.group)}</h3><div class="chips">${g.items
        .map((s) => count[s]
          ? `<button type="button" class="chip skill" data-skill="${esc(s)}" title="Show projects using ${esc(s)}">${esc(s)}<span class="chip__n">${count[s]}</span></button>`
          : `<button type="button" class="chip skill" disabled title="No public project on this page yet">${esc(s)}</button>`)
        .join("")}</div></div>`)
      .join("");
    $("#skills-list").addEventListener("click", (e) => {
      const b = e.target.closest("[data-skill]");
      if (!b) return;
      setSkill(b.dataset.skill);
      $("#projects").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  })();

  /* ---------- Contact ---------- */
  if ($("#copy-email")) $("#copy-email").addEventListener("click", () => copyText(D.profile.email).then(() => toast("Email copied")));

  /* ---------- Terminal ---------- */
  const term = (function () {
    const dlg = $("#terminal");
    const out = $("#terminal-out");
    const input = $("#terminal-input");
    const history = [];
    let hIndex = 0, booted = false;
    wireDialog(dlg);
    const sections = ["about", "journey", "projects", "deep-dives", "dashboards", "skills", "contact"];
    const ids = D.projects.map((p) => p.id);

    function print(html, cls) {
      const div = document.createElement("div");
      if (cls) div.className = cls;
      div.innerHTML = html;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }
    const commands = {
      help() {
        print(`<span class="t-dim">Commands:</span>
  <span class="t-cmd">whoami</span>           who I am
  <span class="t-cmd">ls</span>               list projects (★ = pinned on GitHub)
  <span class="t-cmd">open</span> &lt;project&gt;   open a project (Tab completes)
  <span class="t-cmd">more</span>             go to Additional work
  <span class="t-cmd">skills</span>           what I work with
  <span class="t-cmd">dashboards</span>       the 20 Power BI dashboards
  <span class="t-cmd">goto</span> &lt;section&gt;   ${sections.join(" · ")}
  <span class="t-cmd">contact</span>          how to reach me
  <span class="t-cmd">copy email</span>       copy my email address
  <span class="t-cmd">theme</span> [dark|light] switch theme
  <span class="t-cmd">clear</span> · <span class="t-cmd">exit</span>`);
      },
      whoami() {
        print(`<b>${esc(D.profile.name)}</b>, ${esc(D.profile.role)} at ThinkDigits
4+ years in AI, data and software across fintech, healthcare and manufacturing.
Based in ${esc(D.profile.location)}.`);
      },
      ls() {
        print(D.projects.map((p) => `${p.pinned ? "★" : " "} <span class="t-cmd">${p.id.padEnd(32)}</span>${esc(p.title)}`).join("\n"));
      },
      more() {
        if (!HOME) return print("you are already on Additional work", "t-dim");
        location.href = "work.html";
      },
      open(arg) {
        if (!arg) return print("usage: open &lt;project&gt;  (try: ls)", "t-err");
        const id = ids.find((x) => x === arg) || ids.find((x) => x.startsWith(arg));
        if (!id) return print(`no such project: ${esc(arg)}`, "t-err");
        dlg.close();
        openProject(id);
      },
      skills() {
        print(D.skills.map((g) => `<span class="t-cmd">${esc(g.group)}</span>\n  ${esc(g.items.join(", "))}`).join("\n"));
      },
      dashboards() {
        print(D.dashboards.map((d, i) => `<span class="t-dim">day ${String(i + 1).padStart(2, " ")}</span>  ${esc(d)}`).join("\n"));
      },
      goto(arg) {
        if (!sections.includes(arg)) return print(`usage: goto &lt;${sections.join("|")}&gt;`, "t-err");
        dlg.close();
        if (!$("#" + arg)) { location.href = "index.html#" + arg; return; }
        $("#" + arg).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      },
      contact() {
        print(`email     <a href="mailto:${D.profile.email}">${D.profile.email}</a>
linkedin  <a href="${D.profile.linkedin}" target="_blank" rel="noopener">${D.profile.linkedin}</a>
github    <a href="${D.profile.github}" target="_blank" rel="noopener">${D.profile.github}</a>`);
      },
      copy(arg) {
        if (arg !== "email") return print("usage: copy email", "t-err");
        copyText(D.profile.email).then(() => print("copied " + D.profile.email, "t-ok"));
      },
      theme(arg) {
        const next = arg === "dark" || arg === "light" ? arg : document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        setTheme(next);
        print(`theme set to ${next}`, "t-ok");
      },
      sudo() {
        print("Permission denied: in this portfolio, a person approves every change. 😉", "t-err");
      },
      clear() { out.innerHTML = ""; },
      exit() { dlg.close(); },
    };
    commands.projects = commands.ls;
    commands.about = commands.whoami;
    commands.email = () => commands.copy("email");

    $("#terminal-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      input.value = "";
      if (!raw) return;
      history.push(raw);
      hIndex = history.length;
      print(`<span class="t-cmd">$</span> ${esc(raw)}`);
      const [cmd, ...rest] = raw.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];
      if (fn) fn(rest.join(" ").toLowerCase());
      else print(`command not found: ${esc(cmd)}. Type <span class="t-cmd">help</span>.`, "t-err");
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && hIndex > 0) { input.value = history[--hIndex]; e.preventDefault(); }
      else if (e.key === "ArrowDown") { hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] || ""; e.preventDefault(); }
      else if (e.key === "Tab") {
        e.preventDefault();
        const parts = input.value.split(/\s+/);
        const pool = parts.length > 1 ? (parts[0] === "goto" ? sections : ids) : Object.keys(commands);
        const hits = pool.filter((x) => x.startsWith(parts[parts.length - 1]));
        if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(" ") + (parts.length === 1 ? " " : ""); }
        else if (hits.length > 1) print(hits.join("  "), "t-dim");
      }
    });
    function open() {
      if (dlg.open) return;
      if (!booted) {
        booted = true;
        print(`Welcome to roop@portfolio. Type <span class="t-cmd">help</span> to get started.`, "t-dim");
      }
      dlg.showModal();
      input.focus();
    }
    return { open };
  })();

  $("#terminal-open").addEventListener("click", term.open);
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === "`" && !typing && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      term.open();
    }
  });

  /* ---------- Init ---------- */
  renderChips();
  renderProjects();
  observeReveals();
  if (state.skill && HOME) setTimeout(() => $("#projects").scrollIntoView(), 50);
  $("#year").textContent = new Date().getFullYear();
  if (location.hash.startsWith("#project/")) {
    const id = location.hash.slice("#project/".length);
    setTimeout(() => openProject(id), 300);
  }
})();
