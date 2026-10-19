/* Sri Ramaanuja Dasan — portfolio
   Progressive enhancement. Nothing stays hidden without JS:
   the loader and image clips are gated behind html.js, and this
   script always ends with everything visible. */
/* theme toggle — dark (default) <-> light, persisted; pre-set in <head> to avoid flash */
(function () {
  var root = document.documentElement, btn = document.getElementById("themeBtn");
  function light() { return root.getAttribute("data-theme") === "light"; }
  function sync() { if (btn) { btn.setAttribute("aria-pressed", light() ? "true" : "false"); btn.setAttribute("aria-label", light() ? "Switch to dark theme" : "Switch to light theme"); } }
  sync();
  if (btn) btn.addEventListener("click", function () {
    if (light()) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", "light");
    try { localStorage.setItem("theme", light() ? "light" : "dark"); } catch (e) {}
    sync();
    window.dispatchEvent(new Event("themechange"));
  });
})();

(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  var G = window.gsap;
  var ST = window.ScrollTrigger;
  var loader = document.getElementById("loader");
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function showImages() {
    document.querySelectorAll(".loader__img, .hero__fig img").forEach(function (im) {
      im.style.clipPath = "inset(0 0 0 0)";
    });
  }

  /* ---- no GSAP / reduced motion: reveal statically ---- */
  if (!G || reduce) {
    showImages();
    if (loader) loader.parentNode.removeChild(loader);
    initLenis(); // harmless if it bails
    initCursor();
    initShell();
    initTerminalType();
    initField();
    return;
  }

  G.registerPlugin(ST);
  initShell();
  initField();

  /* ================= LENIS smooth scroll ================= */
  var lenis = null;
  function initLenis() {
    if (typeof window.Lenis === "undefined" || reduce) return;
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    if (ST) lenis.on("scroll", ST.update);
    G.ticker.add(function (time) { lenis.raf(time * 1000); });
    G.ticker.lagSmoothing(0);
    // anchor links through Lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var t = document.querySelector(a.getAttribute("href"));
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); }
      });
    });
  }

  /* ================= LOADER sequence ================= */
  var numEl = document.getElementById("loaderNum");
  var fillEl = document.getElementById("loaderFill");
  var counter = { v: 0 };

  var tl = G.timeline();
  tl.to(counter, { v: 100, duration: 1.6, ease: "power2.inOut",
      onUpdate: function () { if (numEl) numEl.textContent = Math.round(counter.v); } }, 0)
    .to(fillEl, { width: "100%", duration: 1.6, ease: "power2.inOut" }, 0)
    .to(".loader__img", { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "power3.out" }, 0.25)
    .to(".loader__meta, .loader__bar, .loader__count, .loader__frame",
        { opacity: 0, duration: 0.5, ease: "power2.in" }, 1.75)
    .to(loader, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, 1.95)
    .add(startHero, 2.2)
    .set(loader, { display: "none" });

  function startHero() {
    var h = G.timeline({ defaults: { ease: "power4.out" } });
    h.from(".hero__title .w", { yPercent: 118, duration: 1.1, stagger: 0.09 })
      .from(".eyebrow span, .hero__index", { y: 14, opacity: 0, duration: 0.6, stagger: 0.05 }, "-=0.7")
      .to(".hero__fig img", { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 1.2, ease: "power3.out" }, "-=0.8")
      .from(".hero__fig figcaption", { opacity: 0, duration: 0.6 }, "-=0.4")
      .from(".hero__say > *", { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.9")
      .add(function () { if (ST) ST.refresh(); });
  }

  initLenis();

  /* ================= scroll reveals ================= */
  G.utils.toArray("[data-reveal]").forEach(function (el) {
    G.from(el, { y: 44, opacity: 0, duration: 1.0, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  /* section-head titles: line reveal */
  G.utils.toArray(".sec-head__title, .about__h, .contact__big .w").forEach(function (el) {
    G.from(el, { yPercent: 18, opacity: 0, duration: 1.0, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ================= count-up ================= */
  G.utils.toArray(".stat__num").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    var o = { v: 0 };
    G.to(o, { v: target, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
      onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString("en-US") + suffix; } });
  });

  /* ================= hero image parallax ================= */
  G.to(".hero__fig img", { yPercent: -8, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ================= custom cursor ================= */
  function initCursor() {
    if (!fine || reduce) return;
    document.body.classList.add("has-cursor");
    var cur = document.querySelector(".cursor");
    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; });
    (window.gsap ? window.gsap.ticker.add : requestAnimationFrame)(tick);
    function tick() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      if (!window.gsap) requestAnimationFrame(tick);
    }
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      var view = el.getAttribute("data-cursor") === "view";
      el.addEventListener("mouseenter", function () {
        cur.classList.add(view ? "is-view" : "is-hover"); });
      el.addEventListener("mouseleave", function () {
        cur.classList.remove("is-view", "is-hover"); });
    });
  }
  initCursor();

  /* ================= code terminal typewriter ================= */
  initTerminalType();
  function initTerminalType() {
    var code = document.getElementById("termCode");
    if (!code) return;
    // tokens: [text, class] — class c=comment, k=keyword, s=string, ""=plain
    var toks = [
      ["$ cat how_i_work.py\n", "c"],
      ["def ", "k"], ["ship", ""], ["(idea):\n    ", ""],
      ["spec = ", ""], ["benchmark", ""], ["(idea)      ", ""], ["# measure, don't guess\n    ", "c"],
      ["while not ", "k"], ["spec.passes():\n        ", ""],
      ["build(); test(); review()\n    ", ""],
      ["return ", "k"], ["reversible", ""], ["(spec)     ", ""], ["# keep it undoable\n", "c"],
      ["\n# → ", "c"], ["RAWRS · Thadam · ICHNOVA · llama.cpp#30630", "s"]
    ];
    if (reduce) {
      toks.forEach(function (t) {
        var s = document.createElement("span"); if (t[1]) s.className = t[1];
        s.textContent = t[0]; code.appendChild(s);
      });
      return;
    }
    var ti = 0, ci = 0, span = null;
    var run = { started: false };
    function step() {
      if (ti >= toks.length) return;
      var t = toks[ti];
      if (ci === 0) { span = document.createElement("span"); if (t[1]) span.className = t[1]; code.appendChild(span); }
      span.textContent += t[0][ci];
      ci++;
      if (ci >= t[0].length) { ti++; ci = 0; }
      var ch = t[0][ci - 1];
      setTimeout(step, ch === "\n" ? 180 : 15 + Math.random() * 25);
    }
    // start when scrolled into view
    if (ST) {
      ST.create({ trigger: ".term", start: "top 80%", once: true,
        onEnter: function () { if (!run.started) { run.started = true; step(); } } });
    } else { step(); }
  }

  /* band parallax */
  G.to(".band__fig img", { yPercent: -12, ease: "none",
    scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: true } });

  addEventListener("load", function () { if (ST) ST.refresh(); });

  /* ================= interactive shell ================= */
  function initShell() {
    var screen = document.getElementById("cliScreen");
    var form = document.getElementById("cliForm");
    var input = document.getElementById("cliInput");
    var cli = document.getElementById("cli");
    if (!screen || !form || !input) return;
    var hist = [], hi = -1;

    function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function pad(s, n) { s = String(s); return s.length >= n ? s : s + new Array(n - s.length + 1).join(" "); }
    function out(html, cls) { var d = document.createElement("pre"); d.className = "row" + (cls ? " " + cls : ""); d.innerHTML = html; screen.appendChild(d); screen.scrollTop = screen.scrollHeight; }
    function prompt(cmd) { out('<span class="mut">visitor@srd:~$</span> <span class="cmd">' + esc(cmd) + "</span>"); }

    var projects = {
      rawrs: ["RAWRS", "vision-language document accessibility · daily at WinVinaya", "https://github.com/winvinayainfosystemsindia/RAWRS---V1"],
      thadam: ["Thadam", "audit intelligence over 476,781 lifecycle events", "https://github.com/SomeNobody21112/Thadam"],
      ichnova: ["ICHNOVA", "blind radio-signal decoder, 30/30 held-out", "https://github.com/SomeNobody21112/ICHNOVA"],
      llama: ["llama.cpp #30630", "merged NumPy Q1_0/Q2_0 GGUF quantization", "https://github.com/ggml-org/llama.cpp/pull/30630"]
    };
    function go(url) { try { window.open(url, "_blank", "noopener"); } catch (e) {} }

    function neofetch() {
      var art = ["   ____  ____  ____", "  / ___||  _ \\|  _ \\", "  \\___ \\| |_) | | | |", "   ___) |  _ <| |_| |", "  |____/|_| \\_\\____/"];
      var info = ["visitor@srd", "-----------", "host: St. Joseph's Inst. of Tech", "role: AI / ML Engineer", "shell: zsh", "editor: VS Code · nvim", "stack: Python · TS · FastAPI · React", "merged: llama.cpp #30630", "uptime: 2nd year — shipping daily"];
      var n = Math.max(art.length, info.length), rows = [];
      for (var i = 0; i < n; i++) rows.push('<span class="asc">' + esc(pad(art[i] || "", 24)) + '</span><span class="mut">' + esc(info[i] || "") + "</span>");
      return rows.join("\n");
    }

    var commands = {
      help: function () {
        return ['<span class="hd">commands</span>',
          '  <span class="cmd">whoami</span>     who I am',
          '  <span class="cmd">about</span>      the longer version',
          '  <span class="cmd">ls</span>         list projects',
          '  <span class="cmd">open</span> &lt;x&gt;   open one (rawrs · thadam · ichnova · llama)',
          '  <span class="cmd">skills</span>     the toolkit',
          '  <span class="cmd">contact</span>    where to find me',
          '  <span class="cmd">neofetch</span>   system info',
          '  <span class="cmd">clear</span>      clear the screen'].join("\n");
      },
      whoami: function () { return "sri ramaanuja dasan — 2nd-yr CSE, Chennai. builds &amp; ships AI end to end."; },
      about: function () { return "I build AI that reaches real users — a tool used daily at WinVinaya, a hackathon-grade audit engine, a signal decoder from first principles. I measure against benchmarks and keep systems reviewable and reversible. Long game: found my own company."; },
      ls: function () { return Object.keys(projects).map(function (k) { var p = projects[k]; return '<span class="cmd">' + pad(k, 10) + '</span><span class="mut">' + esc(p[1]) + "</span>"; }).join("\n"); },
      open: function (a) {
        if (!a) return "usage: open &lt;rawrs|thadam|ichnova|llama&gt;";
        var p = projects[a.toLowerCase()];
        if (!p) return "not found: " + esc(a) + " — try: " + Object.keys(projects).join(", ");
        go(p[2]); return 'opening <a href="' + p[2] + '" target="_blank" rel="noopener">' + esc(p[0]) + "</a> …";
      },
      skills: function () {
        return ['<span class="mut">ml   </span> Qwen2.5-VL · embeddings · anomaly/survival · GGUF quant',
          '<span class="mut">lang </span> Python · TypeScript · React · FastAPI',
          '<span class="mut">ops  </span> Docker · CI · pytest · git'].join("\n");
      },
      contact: function () {
        return ['email    <a href="mailto:sriramaanujadasan2007@gmail.com">sriramaanujadasan2007@gmail.com</a>',
          'phone    <a href="tel:+917305289070">+91 73052 89070</a>',
          'github   <a href="https://github.com/SomeNobody21112" target="_blank" rel="noopener">@SomeNobody21112</a>',
          'linkedin <a href="https://linkedin.com/in/sri-ramaanuja-dasan" target="_blank" rel="noopener">in/sri-ramaanuja-dasan</a>',
          'site     <a href="https://somenobody21112.github.io" target="_blank" rel="noopener">somenobody21112.github.io</a>'].join("\n");
      },
      email: function () { go("mailto:sriramaanujadasan2007@gmail.com"); return 'opening mail to <a href="mailto:sriramaanujadasan2007@gmail.com">sriramaanujadasan2007@gmail.com</a> …'; },
      call: function () { return 'phone <a href="tel:+917305289070">+91 73052 89070</a>'; },
      github: function () { go("https://github.com/SomeNobody21112"); return "opening GitHub …"; },
      linkedin: function () { go("https://linkedin.com/in/sri-ramaanuja-dasan"); return "opening LinkedIn …"; },
      neofetch: function () { return neofetch(); },
      echo: function (a) { return esc(a || ""); },
      date: function () { return esc(new Date().toString()); },
      sudo: function () { return "nice try. this incident will be reported. 🙂"; },
      history: function () { return hist.length ? hist.map(function (h, i) { return "  " + (i + 1) + "  " + esc(h); }).join("\n") : "(empty)"; },
      clear: function () { screen.innerHTML = ""; return null; }
    };
    commands.projects = commands.ls;
    commands.man = commands.help;

    function run(line) {
      prompt(line);
      var parts = line.trim().split(/\s+/);
      var name = (parts.shift() || "").toLowerCase();
      if (!name) return;
      hist.push(line); hi = hist.length;
      var fn = commands[name];
      if (!fn) { out('command not found: ' + esc(name) + ' — type <span class="cmd">help</span>'); return; }
      var r = fn(parts.join(" "));
      if (r != null) out(r);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; run(v); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi] || ""; } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi] || ""; } else { hi = hist.length; input.value = ""; } }
      else if (e.key === "Tab") {
        e.preventDefault();
        var pre = input.value.trim().toLowerCase();
        if (pre) { var m = Object.keys(commands).filter(function (k) { return k.indexOf(pre) === 0; }); if (m.length === 1) input.value = m[0] + " "; }
      }
    });
    if (cli) cli.addEventListener("click", function (e) { if (e.target.tagName !== "A") input.focus(); });

    out('<span class="mut"># srd.sh — interactive shell. type </span><span class="cmd">help</span><span class="mut"> to begin.</span>');
  }

  /* ================= ambient flow field (section) ================= */
  function initField() {
    var cv = document.getElementById("fieldCanvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(1.6, window.devicePixelRatio || 1);
    var sec = document.getElementById("field");
    var W = 0, H = 0;
    // colors follow the theme: dark backdrop + light particles, or light backdrop + dark particles
    function colors() {
      var lt = document.documentElement.getAttribute("data-theme") === "light";
      return lt
        ? { base: "#e7e4db", fade: "rgba(231,228,219,.11)", dot: "rgba(22,19,15,.17)", stat: "rgba(22,19,15,.12)" }
        : { base: "#060606", fade: "rgba(6,6,6,.072)",       dot: "rgba(236,233,227,.16)", stat: "rgba(236,233,227,.14)" };
    }
    var col = colors();
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.max(1, Math.floor(W * dpr)); cv.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = col.base; ctx.fillRect(0, 0, W, H);
    }
    size();
    window.addEventListener("themechange", function () { col = colors(); size(); });
    // layered-sine pseudo-noise field (cheap, no library)
    function ang(x, y, t) { return (Math.sin(x * 0.0016 + t * 0.0003) + Math.cos(y * 0.0015 - t * 0.00024) + Math.sin((x + y) * 0.0009 + t * 0.0004)) * 1.7; }

    if (reduce) { // static etched field, no animation
      ctx.strokeStyle = col.stat; ctx.lineWidth = 1;
      for (var i = 0; i < 2200; i++) { var x = Math.random() * W, y = Math.random() * H, a = ang(x, y, 0); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); ctx.stroke(); }
      return;
    }

    var mouse = { x: -1e4, y: -1e4 };
    if (sec) {
      sec.addEventListener("mousemove", function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      sec.addEventListener("mouseleave", function () { mouse.x = mouse.y = -1e4; });
    }
    var n = Math.min(1100, Math.floor(W * H / 1600)), ps = [];
    for (var k = 0; k < n; k++) ps.push({ x: Math.random() * W, y: Math.random() * H, life: Math.random() * 180 | 0 });
    var t = 0, raf = 0, running = false;
    function frame() {
      if (!running) return;
      t++;
      ctx.fillStyle = col.fade; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i], px = p.x, py = p.y, a = ang(p.x, p.y, t);
        var vx = Math.cos(a) * 1.1, vy = Math.sin(a) * 1.1;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, near = d2 < 16000;
        if (near) { var d = Math.sqrt(d2) || 1, f = (1 - d / 126) * 2.6; vx += dx / d * f; vy += dy / d * f; }
        p.x += vx; p.y += vy; p.life--;
        if (p.life < 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; p.life = 60 + (Math.random() * 160 | 0); continue; }
        ctx.strokeStyle = near ? "rgba(229,36,58,.55)" : col.dot;
        ctx.lineWidth = near ? 1.3 : 0.8;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; frame(); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    if ("IntersectionObserver" in window && sec) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.02 }).observe(sec);
    } else { start(); }
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 200); });
  }
})();
