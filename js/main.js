/* Sri Ramaanuja Dasan — portfolio
   Progressive enhancement. Nothing stays hidden without JS:
   the loader and image clips are gated behind html.js, and this
   script always ends with everything visible. */
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
    return;
  }

  G.registerPlugin(ST);

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

  addEventListener("load", function () { if (ST) ST.refresh(); });
})();
