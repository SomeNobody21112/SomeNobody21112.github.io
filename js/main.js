/* Sri Ramaanuja Dasan — portfolio interactions
   Progressive enhancement: if GSAP or JS fails, the page is
   already fully visible and usable. Nothing starts hidden in CSS. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- intro counter ---------- */
  var intro = document.getElementById("intro");
  function finishIntro() {
    if (!intro) return;
    if (hasGSAP && !reduce) {
      window.gsap.to(intro, { yPercent: -100, duration: 0.8, ease: "power4.inOut",
        onComplete: function () { intro.style.display = "none"; }, delay: 0.15 });
    } else {
      intro.style.display = "none";
    }
    intro.classList.add("is-done");
    startHero();
  }
  if (reduce || !intro) {
    if (intro) intro.style.display = "none";
    startHero();
  } else {
    var numEl = document.getElementById("introNum");
    var n = { v: 0 };
    if (hasGSAP) {
      window.gsap.to(n, { v: 100, duration: 1.15, ease: "power2.inOut",
        onUpdate: function () { numEl.textContent = Math.round(n.v); },
        onComplete: finishIntro });
    } else {
      var t = setInterval(function () {
        n.v += 7; if (n.v >= 100) { n.v = 100; clearInterval(t); finishIntro(); }
        numEl.textContent = Math.round(n.v);
      }, 60);
    }
  }

  /* ---------- hero entrance ---------- */
  function startHero() {
    if (!hasGSAP || reduce) return;
    var tl = window.gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__title .word", { yPercent: 115, duration: 1.0, stagger: 0.08 })
      .from(".hero__eyebrow span", { y: 16, opacity: 0, duration: 0.6, stagger: 0.07 }, "-=0.7")
      .from(".hero__role, .hero__thesis", { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.6")
      .from(".hero__cta .btn", { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.5");
  }

  if (!hasGSAP) return; // enhancements below need GSAP

  /* ---------- scroll reveals ---------- */
  window.gsap.registerPlugin(window.ScrollTrigger);
  if (!reduce) {
    window.gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      window.gsap.from(el, {
        y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    /* word reveal for the contact headline */
    window.gsap.utils.toArray(".contact__big .word").forEach(function (w) {
      window.gsap.from(w, {
        yPercent: 115, duration: 1, ease: "power4.out",
        scrollTrigger: { trigger: ".contact__big", start: "top 80%" }
      });
    });
  }

  /* ---------- count-up stats ---------- */
  window.gsap.utils.toArray(".stat__num").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (reduce) { el.textContent = fmt(target) + suffix; return; }
    var obj = { v: 0 };
    window.gsap.to(obj, {
      v: target, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: function () { el.textContent = fmt(Math.round(obj.v)) + suffix; }
    });
  });
  function fmt(x) { return x.toLocaleString("en-US"); }

  /* ---------- blobs subtle parallax ---------- */
  if (!reduce) {
    window.gsap.to(".blob--1", { yPercent: 18, ease: "none",
      scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 } });
    window.gsap.to(".blob--2", { yPercent: -16, ease: "none",
      scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 1 } });
  }

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    document.body.classList.add("has-cursor");
    var cur = document.querySelector(".cursor");
    var dot = cur.querySelector(".cursor__dot");
    var ring = cur.querySelector(".cursor__ring");
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY;
      window.gsap.set(dot, { x: mx, y: my }); });
    window.gsap.ticker.add(function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      window.gsap.set(ring, { x: rx, y: ry });
    });
    document.querySelectorAll("a, button, [data-tilt], [data-magnetic]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        window.gsap.to(el, { x: x * 0.35, y: y * 0.4, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () {
        window.gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------- card tilt + glow spotlight ---------- */
  document.querySelectorAll("[data-tilt]").forEach(function (card) {
    var glow = card.querySelector(".card__glow");
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      if (glow) { glow.style.setProperty("--mx", (px * 100) + "%");
                  glow.style.setProperty("--my", (py * 100) + "%"); }
      if (fine && !reduce) {
        window.gsap.to(card, { rotateY: (px - 0.5) * 7, rotateX: (0.5 - py) * 7,
          transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      }
    });
    card.addEventListener("mouseleave", function () {
      window.gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "power3.out" });
    });
  });

  /* keep ScrollTrigger honest after fonts/layout settle */
  window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
})();
