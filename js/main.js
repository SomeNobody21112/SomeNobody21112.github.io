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
  var scrollVel = 0;
  var MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
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
    initWork();
    initAscii();
    initQuant();
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
    lenis.on("scroll", function (e) { scrollVel = e.velocity || 0; });
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

  /* section-head titles: masked wipe-up (Obys-style) */
  G.utils.toArray(".sec-head__title, .about__h").forEach(function (el) {
    var mask = document.createElement("div"); mask.className = "mask-line";
    el.parentNode.insertBefore(mask, el); mask.appendChild(el);
    G.set(el, { yPercent: 116 });
    G.to(el, { yPercent: 0, duration: 1.15, ease: "power4.out",
      scrollTrigger: { trigger: mask, start: "top 90%" } });
  });
  G.utils.toArray(".contact__big .w").forEach(function (el) {
    G.from(el, { yPercent: 118, duration: 1.1, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 92%" } });
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
  initWork();
  initAscii();
  initQuant();
  initObys();

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
        ? { base: "#e7e4db", fade: "rgba(231,228,219,.085)", dot: "rgba(14,12,9,.4)", stat: "rgba(14,12,9,.32)" }
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
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, near = d2 < 22000;
        if (near) { var d = Math.sqrt(d2) || 1, f = (1 - d / 148) * 2.6; vx += dx / d * f; vy += dy / d * f; }
        p.x += vx; p.y += vy; p.life--;
        if (p.life < 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; p.life = 60 + (Math.random() * 160 | 0); continue; }
        ctx.strokeStyle = near ? "rgba(255,38,52,.95)" : col.dot;
        ctx.lineWidth = near ? 1.8 : 0.8;
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

  /* ================= work — horizontal gallery ================= */
  function initWork() {
    var sec = document.querySelector(".work"),
        track = document.getElementById("workTrack"),
        vp = document.getElementById("workViewport");
    if (!sec || !track || !vp) return;
    if (!G || !ST || reduce || !matchMedia("(min-width:760px)").matches) {
      sec.classList.add("work--native");
      return;
    }
    var amount = function () { return Math.max(0, track.scrollWidth - vp.offsetWidth); };
    G.to(track, { x: function () { return -amount(); }, ease: "none",
      scrollTrigger: { trigger: sec, start: "top top",
        end: function () { return "+=" + (amount() * 1.7 + 1); },
        pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
  }

  /* ================= Obys motion: velocity weight + card skew ================= */
  function initObys() {
    if (!G || reduce) return;
    var root = document.documentElement;
    var cards = G.utils.toArray(".work-card");
    var setSkew = cards.map(function (c) { return G.quickSetter(c, "skewX", "deg"); });
    if (!lenis) { // native fallback velocity
      var last = pageYOffset, lt = performance.now();
      addEventListener("scroll", function () {
        var y = pageYOffset, now = performance.now(), dt = Math.max(16, now - lt);
        scrollVel = (y - last) / dt * 16; last = y; lt = now;
      }, { passive: true });
    }
    var kw = 300, skew = 0;
    G.ticker.add(function () {
      var v = scrollVel, av = Math.min(Math.abs(v), 45);
      kw += (300 + Math.min(av * 4.2, 165) - kw) * 0.1;
      root.style.setProperty("--kw", kw.toFixed(0));
      var ts = Math.max(-4.5, Math.min(4.5, v * 0.05));
      skew += (ts - skew) * 0.12;
      for (var i = 0; i < setSkew.length; i++) setSkew[i](skew);
    });
  }

  /* ================= interactive ASCII portrait ================= */
  function initAscii() {
    var cv = document.getElementById("asciiCanvas"),
        stage = document.getElementById("asciiStage"),
        src = document.getElementById("asciiSrc");
    if (!cv || !cv.getContext || !stage || !src) return;
    var ctx = cv.getContext("2d");
    var ramp = " .:-=+*#%@";
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cols = 0, rows = 0, cw = 0, ch = 0, data = null, W = 0, H = 0, ready = false;
    var mouse = { x: -1e4, y: -1e4, on: false };

    function lum(i) { return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255; }
    function sample() {
      if (!src.naturalWidth) return false;
      var oc = document.createElement("canvas"); oc.width = cols; oc.height = rows;
      var o = oc.getContext("2d");
      var ir = src.naturalWidth / src.naturalHeight, gr = cols / rows, sw, sh, sx, sy;
      if (ir > gr) { sh = src.naturalHeight; sw = sh * gr; sx = (src.naturalWidth - sw) / 2; sy = 0; }
      else { sw = src.naturalWidth; sh = sw / gr; sx = 0; sy = (src.naturalHeight - sh) / 2; }
      o.drawImage(src, sx, sy, sw, sh, 0, 0, cols, rows);
      data = o.getImageData(0, 0, cols, rows).data; return true;
    }
    function size() {
      var r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      if (!W || !H) return;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cell = W < 420 ? 5.4 : 6.2;
      cols = Math.max(36, Math.floor(W / cell));
      rows = Math.max(44, Math.floor(H / (cell * 1.32)));
      cw = W / cols; ch = H / rows;
      ready = sample();
    }
    var frame = 0, raf = 0, running = false;
    function render(full) {
      if (!ready && !sample()) return;
      var lt = document.documentElement.getAttribute("data-theme") === "light";
      ctx.fillStyle = lt ? "#e7e4db" : "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = "top"; ctx.textAlign = "left";
      ctx.font = "700 " + (ch * 1.05).toFixed(1) + "px " + MONO;
      var iR = lt ? 20 : 236, iG = lt ? 17 : 233, iB = lt ? 13 : 227;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var v = lum((y * cols + x) * 4); if (lt) v = 1 - v;
          v = Math.pow(v, 0.92); // gentle lift so shadowed face cells still read
          var cx = x * cw, cy = y * ch, near = 0;
          if (mouse.on) { var dx = cx - mouse.x, dy = cy - mouse.y, d = Math.sqrt(dx * dx + dy * dy); near = d < 160 ? 1 - d / 160 : 0; }
          var shim = full ? 0 : 0.018 * Math.sin(x * 0.55 + y * 0.5 + frame * 0.05);
          var L = Math.min(1, Math.max(0, v + shim * (1 - near)));
          var idx = Math.round(L * (ramp.length - 1));
          if (near > 0) idx = Math.min(ramp.length - 1, idx + Math.round(near * 2.2));
          if (idx <= 0 && near <= 0) continue;
          var a = 0.3 + 0.66 * L;
          if (near > 0) {
            a = Math.min(1, a + near * 0.5);
            var rr = Math.round(iR + (255 - iR) * near), gg = Math.round(iG + (40 - iG) * near * 0.9), bb = Math.round(iB + (52 - iB) * near * 0.9);
            ctx.fillStyle = "rgba(" + rr + "," + gg + "," + bb + "," + a.toFixed(3) + ")";
          } else ctx.fillStyle = "rgba(" + iR + "," + iG + "," + iB + "," + a.toFixed(3) + ")";
          ctx.fillText(ramp[idx], cx, cy);
        }
      }
    }
    function loop() { if (!running) return; frame++; render(false); raf = requestAnimationFrame(loop); }
    function start() { if (!running && ready) { running = true; loop(); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    stage.addEventListener("mousemove", function (e) { var r = stage.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true; });
    stage.addEventListener("mouseleave", function () { mouse.on = false; });
    window.addEventListener("themechange", function () { if (!running) render(true); });
    function boot() {
      size();
      if (reduce) { render(true); return; }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { en.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.05 }).observe(stage);
      } else start();
    }
    if (src.complete && src.naturalWidth) boot(); else src.addEventListener("load", boot);
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (reduce || !running) render(true); }, 200); });
  }


  /* ================= live quantization (float32 -> 2-bit, watch) ================= */
  function initQuant() {
    var stage = document.getElementById("quantStage"),
        cv = document.getElementById("quantCv");
    if (!stage || !cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, C = 0, R = 0;
    var RED = "rgba(255,40,52,";

    function size() {
      var r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      if (!W || !H) return;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      C = W < 560 ? 18 : 30;                 // weight columns
      R = Math.max(9, Math.round(C * (H / W) * 0.92)); // keep cells ~square
    }

    // smooth pseudo-random weight field in [0,1]
    function field(c, r, t) {
      return 0.5 + 0.5 * (
        0.55 * Math.sin(c * 0.55 + r * 0.33 + t * 0.6) +
        0.30 * Math.sin(c * 0.21 - r * 0.47 + t * 0.9 + 1.7) +
        0.15 * Math.sin((c + r) * 0.4 - t * 0.5)
      );
    }
    function pad2(n) { n = (n & 3).toString(2); return n.length < 2 ? "0" + n : n; }

    function draw(t) {
      var padX = Math.max(18, W * 0.055), padTop = H * 0.16, padBot = H * 0.14;
      var gw = W - padX * 2, gh = H - padTop - padBot;
      var cwid = gw / C, chei = gh / R;
      // quantization front sweeps top->bottom, wraps; fractional edge row is mid-collapse
      var period = R + 4, pos = (t * 0.9) % period, scale = 0.26 + 0.14 * Math.abs(Math.sin(t * 0.35));

      ctx.fillStyle = "#060606"; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var lf = "600 " + Math.max(7, Math.min(13, chei * 0.3)).toFixed(0) + "px " + MONO;

      for (var r = 0; r < R; r++) {
        var edge = pos - r;                 // >1 fully quantized, 0..1 collapsing, <0 still float
        var q = edge >= 1 ? 1 : (edge <= 0 ? 0 : edge); // collapse amount for this row
        var vy = padTop + r * chei;
        for (var c = 0; c < C; c++) {
          var vx = padX + c * cwid;
          var v = field(c, r, t);
          var level = Math.round(v * 3);            // 0..3  (2-bit)
          var qv = level / 3;                        // snapped value
          var shade = v + (qv - v) * q;              // lerp float -> snapped
          var g = Math.round(20 + shade * 214);
          ctx.fillStyle = "rgb(" + g + "," + g + "," + g + ")";
          var gap = q > 0.5 ? 1.4 : 0.4;             // crisp blocks once quantized
          ctx.fillRect(vx + gap, vy + gap, cwid - gap * 2, chei - gap * 2);
          if (q >= 1) {
            ctx.fillStyle = (g > 140 ? "rgba(6,6,6,.55)" : "rgba(236,233,227,.4)");
            ctx.font = lf; ctx.fillText(pad2(level), vx + cwid / 2, vy + chei / 2);
          }
        }
      }
      // red scan line at the collapsing front
      if (pos >= 0 && pos < R + 1) {
        var fy = padTop + Math.min(R, pos) * chei;
        ctx.strokeStyle = RED + ".92)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padX, fy); ctx.lineTo(padX + gw, fy); ctx.stroke();
        ctx.fillStyle = RED + ".08)"; ctx.fillRect(padX, fy, gw, Math.min(chei * 1.1, gh));
      }
      // top readout
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = RED + ".95)"; ctx.font = "600 11px " + MONO;
      var done = Math.max(0, Math.min(R, Math.floor(pos)));
      ctx.fillText("quantizing  row " + done + "/" + R + "   ·   block scale " + scale.toFixed(3), padX, padTop - H * 0.055);
      // legend: four levels
      ctx.fillStyle = "rgba(236,233,227,.4)"; ctx.font = "500 11px " + MONO;
      ctx.fillText("float32", padX, H - padBot * 0.42);
      var lab = ["00", "01", "10", "11"], lx = padX + gw - 4 * 26;
      for (var k = 0; k < 4; k++) {
        var lg = Math.round(20 + (k / 3) * 214);
        ctx.fillStyle = "rgb(" + lg + "," + lg + "," + lg + ")";
        ctx.fillRect(lx + k * 26, H - padBot * 0.62, 18, 12);
        ctx.fillStyle = "rgba(236,233,227,.5)"; ctx.font = "500 9px " + MONO;
        ctx.fillText(lab[k], lx + k * 26 + 2, H - padBot * 0.18);
        ctx.font = "500 11px " + MONO;
      }
    }

    var raf = 0, running = false;
    function loop(now) { if (!running) return; draw(now * 0.001 * 2.2); raf = requestAnimationFrame(loop); }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size();
    if (reduce) { draw(3.2); }              // one static mid-sweep frame
    else if ("IntersectionObserver" in window) { new IntersectionObserver(function (en) { en.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.05 }).observe(stage); }
    else start();
    window.addEventListener("themechange", function () { if (!running) draw(3.2); });
    var rt2; addEventListener("resize", function () { clearTimeout(rt2); rt2 = setTimeout(function () { size(); if (reduce) draw(3.2); }, 200); });
  }
})();
