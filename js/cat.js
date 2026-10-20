/* ============================================================================
   Vladimir "Longcat" Pawtin — a communist black cat.

   He naps on top of the "next one's loading" box with one front paw dangling
   and swinging. The moment you scroll down to his play area he wakes and darts
   home to his house, then roams: takes treats, chases a laser, gets pets,
   meows (only once he's reached home and you can see him), answers questions
   about Sri, and quietly offers to connect you with "his dad".

   Roaming/attention behaviour follows the open-source oneko.js model
   (https://github.com/adryd325/oneko.js, MIT) — rendered as smooth SVG here
   instead of a pixel sprite, so he stays crisp at any size. Vanilla JS, no
   dependency on the site's GSAP/Lenis stack.
   ========================================================================== */
(function () {
  "use strict";

  var world = document.getElementById("catWorld");
  var stage = document.getElementById("catStage");   // the floor / play area (roam bounds)
  var box = document.querySelector(".field__title") || document.querySelector(".field__overlay"); // the "next one's loading" box he sleeps on
  var cat = document.getElementById("cat");
  var bubble = document.getElementById("catBubble");
  var bar = document.getElementById("catBar");
  var logEl = document.getElementById("catLog");
  var form = document.getElementById("catForm");
  var ask = document.getElementById("catAsk");
  if (!world || !stage || !cat || !bubble) return;

  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var WA = "https://wa.me/917305289070"; // "his dad" — never announced as WhatsApp up front

  // positions are in cat-world pixels (layout coords, scroll-independent)
  var S = {
    px: 0, py: 0, tx: 0, ty: 0, face: 1,
    phase: "sleep",          // sleep | dart | live
    mode: "idle",            // idle | walk | eat | chase | sit
    affection: 18, visible: false, reached: false, audio: false,
    treat: null, laser: null, nextThink: 0, nextMeow: 0
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  // rect of an element relative to cat-world (difference cancels scroll)
  function wrect(el) {
    var w = world.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
  }
  function floorBox() { return wrect(stage); }
  function toWorld(fx, fy) { var f = floorBox(); return { x: f.x + fx * f.w, y: f.y + fy * f.h }; }
  function catInFloorPx() { var f = floorBox(); return { x: S.px - f.x, y: S.py - f.y }; }
  function perchPos() { var b = wrect(box); return { x: b.x + Math.min(b.w * 0.40, 520), y: b.y + 14 }; } // naps on the "loading…" word
  function housePos() { var f = floorBox(); return { x: f.x + f.w * 0.22, y: f.y + f.h * 0.82 }; } // his house

  /* ------------------------------------------------------------------ speech */
  var bubbleTimer;
  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add("is-on");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove("is-on"); }, ms || 4200);
  }
  function logLine(who, text, node) {
    if (!logEl) return;
    var row = document.createElement("div");
    row.className = "cat-log__row cat-log__row--" + who;
    if (text) {
      var b = document.createElement("span"); b.className = "cat-log__who"; b.textContent = who === "you" ? "you" : "Vladimir";
      var t = document.createElement("span"); t.className = "cat-log__txt"; t.textContent = text;
      row.appendChild(b); row.appendChild(t);
    }
    if (node) row.appendChild(node);
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  /* ------------------------------------------------------- affection + hearts */
  var HEART = '<svg viewBox="0 0 20 18" aria-hidden="true"><path d="M10,17 C-3,8.5 3,0.5 10,6 C17,0.5 23,8.5 10,17 Z"/></svg>';
  var FISH = '<svg viewBox="0 0 28 16" aria-hidden="true"><ellipse cx="11" cy="8" rx="9.5" ry="5.4"/><path d="M19.5,8 L28,2.5 L28,13.5 Z"/><circle cx="6" cy="6.6" r="1.1" class="cat-treat__eye"/></svg>';
  function affect(d) {
    S.affection = clamp(S.affection + d, 0, 100);
    if (bar) bar.style.width = S.affection + "%";
  }
  function hearts(n) {
    var c = catInFloorPx();
    for (var i = 0; i < (n || 3); i++) {
      var h = document.createElement("div");
      h.className = "cat-heart"; h.innerHTML = HEART;
      h.style.left = (c.x + rand(-26, 26)) + "px";
      h.style.top = (c.y - rand(14, 54)) + "px";
      stage.appendChild(h);
      (function (el) { setTimeout(function () { el.remove(); }, 1100); })(h);
    }
  }

  /* ------------------------------------------------------------ meow (synth) */
  var actx;
  function unlockAudio() {
    if (S.audio) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      S.audio = true;
    } catch (e) { /* no audio, stay silent */ }
  }
  // meows are only heard once he's reached home and you can see him
  function meow(happy) {
    if (!S.reached || !S.visible || !S.audio || !actx) return;
    var t = actx.currentTime, dur = happy ? 0.34 : 0.5;
    var osc = actx.createOscillator(), vib = actx.createOscillator(), vg = actx.createGain();
    var bp = actx.createBiquadFilter(), g = actx.createGain();
    osc.type = "sawtooth";
    var base = happy ? 760 : 620;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base + 230, t + dur * 0.35);
    osc.frequency.linearRampToValueAtTime(base - 120, t + dur);
    vib.frequency.value = 26; vg.gain.value = 18; vib.connect(vg); vg.connect(osc.frequency);
    bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(bp); bp.connect(g); g.connect(actx.destination);
    osc.start(t); vib.start(t); osc.stop(t + dur); vib.stop(t + dur);
  }

  /* ---------------------------------------------------------------- treats */
  function dropTreat() {
    if (S.phase !== "live" || S.treat) return;
    var el = document.createElement("div"); el.className = "cat-treat"; el.innerHTML = FISH;
    var fx = rand(0.14, 0.86), fy = rand(0.66, 0.9);
    el.style.left = (fx * 100) + "%"; el.style.top = (fy * 100) + "%";
    stage.appendChild(el);
    S.treat = { el: el, x: fx, y: fy }; S.mode = "walk";
    say(pick(LINES.treatSpotted), 3000);
  }

  /* ---------------------------------------------------------------- laser */
  var laserOn = false, laserEl;
  function toggleLaser() {
    if (S.phase !== "live") return;
    laserOn = !laserOn;
    if (laserOn) {
      laserEl = document.createElement("div"); laserEl.className = "cat-laser"; stage.appendChild(laserEl);
      S.laser = { x: 0.5, y: 0.8 }; S.mode = "chase";
      say(pick(LINES.laserOn), 3200);
      stage.classList.add("is-laser");
    } else {
      if (laserEl) laserEl.remove(); laserEl = null; S.laser = null; S.mode = "idle";
      stage.classList.remove("is-laser");
    }
    var btn = document.getElementById("catPlay");
    if (btn) btn.setAttribute("aria-pressed", laserOn);
  }
  stage.addEventListener("pointermove", function (e) {
    if (!laserOn || !S.laser) return;
    var r = stage.getBoundingClientRect();
    S.laser.x = clamp((e.clientX - r.left) / r.width, 0.04, 0.96);
    S.laser.y = clamp((e.clientY - r.top) / r.height, 0.1, 0.94);
    if (laserEl) { laserEl.style.left = (S.laser.x * 100) + "%"; laserEl.style.top = (S.laser.y * 100) + "%"; }
  });

  /* ----------------------------------------------------------------- petting */
  var petReset, petCount = 0;
  function pet() {
    unlockAudio();
    affect(4); hearts(4); meow(true);
    cat.classList.add("is-happy");
    setTimeout(function () { cat.classList.remove("is-happy"); }, 900);
    petCount++; clearTimeout(petReset); petReset = setTimeout(function () { petCount = 0; }, 6000);
    if (S.reached) say(pick(LINES.pet), 3200);
    if (S.reached && S.affection > 62 && Math.random() < 0.5) offerDad(true);
  }
  cat.addEventListener("click", function (e) { e.stopPropagation(); pet(); });

  /* ------------------------------------------------------------- "his dad" */
  function dadButton() {
    var a = document.createElement("a");
    a.className = "cat-dad"; a.href = WA + "?text=" + encodeURIComponent(
      "Hi Sri — found you through your portfolio (Vladimir the cat sent me). I'd love to chat about ");
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "yes, introduce me →";
    return a;
  }
  function offerDad(inBubble) {
    var line = pick(LINES.dad);
    if (inBubble) say(line, 5000);
    logLine("cat", line, dadButton());
  }

  /* -------------------------------------------------------------- the agent */
  function norm(s) { return (" " + s.toLowerCase() + " ").replace(/[^a-z0-9 ]/g, " "); }
  function has(q) { for (var i = 1; i < arguments.length; i++) if (q.indexOf(arguments[i]) > -1) return true; return false; }

  function agent(raw) {
    var q = norm(raw);
    if (has(q, "contact", "reach", "hire", "email", "message", "talk to", "get in touch", "recruit", "collab", "available", "work with", " dm "))
      return { text: pick(LINES.dad), dad: true };
    if (has(q, "whatsapp", "phone", "number", "call"))
      return { text: "I don't hand numbers to strangers, that's how the state finds you. But — " + pick(LINES.dad), dad: true };
    if (has(q, "who is", "about him", "your dad", "your owner", "your human", "sri ", "ramaanuja", "dasan"))
      return { text: "My dad is Sri Ramaanuja Dasan — second-year CSE, Forward Deployed Engineer at WinVinaya, ships AI that real humans use. He feeds me on time. He'd make an excellent commissar." };
    if (has(q, "project", "built", "portfolio", "made", "shipped", " work"))
      return { text: "He built RAWRS (vision-language doc accessibility, used daily at WinVinaya), Thadam (audit intelligence over 476,781 events, led 6 people), ICHNOVA (a blind radio-signal decoder — 30/30, zero false accepts), and merged a bit-exact quantizer into llama.cpp. Ask about any of them." };
    if (has(q, "rawrs", "accessibility", "document", "vision language", "vlm"))
      return { text: "RAWRS: a vision-language system turning inaccessible PDFs into clean screen-reader-ready DOCX — three hours of human work down to ten, twenty minutes. Real teams at WinVinaya open it daily. Means of production, seized." };
    if (has(q, "thadam", "audit", "survival", "forensic"))
      return { text: "Thadam: audit intelligence over 476,781 lifecycle events — sentence embeddings, learned archetypes, Cox survival risk. He led six comrades. Surfaces leads for inspectors, never verdicts. Dialectically responsible." };
    if (has(q, "ichnova", "radio", "signal", "decoder", "wwv", "viterbi"))
      return { text: "ICHNOVA: a blind radio-signal decoder built from first principles. 30 of 30 held-out, zero false accepts, verified on real WWV / WWVB / DCF77. He hears the numbers stations. So do I." };
    if (has(q, "llama", "open source", "opensource", "quant", " pr ", "contribution"))
      return { text: "He merged into llama.cpp — PR #30630, bit-exact 2-bit quantization. A model sixteen times lighter, still speaks. The people's weights." };
    if (has(q, "skill", "stack", " tech", "language", "good at"))
      return { text: "AI/ML, LLMs, model quantization, signal processing, Python, C/C++, FastAPI, React. He tests against benchmarks and held-out sets. Rigor: also a communist value." };
    if (has(q, "education", "college", "study", "student", "degree", "cgpa", "university"))
      return { text: "B.E. Computer Science at St. Joseph's Institute of Technology, Chennai, 2025–2029. CGPA 8.03. Second year, already in production. The children are the vanguard." };
    if (has(q, "award", " win", "hackathon", "sih", "prize"))
      return { text: "Smart India Hackathon internal winner, twice. 3rd at Quantathon, 3rd at Cyberfest, special mention at V-VORTEX. Medals are bourgeois, but we keep them." };
    if (has(q, "resume", " cv"))
      return { text: "His résumé is one tap away — the \"Résumé\" link up in the nav. Read it. Then join the party." };
    if (has(q, "goal", "future", "startup", "founder", "dream", "ambition"))
      return { text: "Long game: he founds his own company. I will chair the politburo and also nap." };
    if (has(q, "communist", "communism", "marx", "lenin", "socialis", "capitalis", "politic", "revolution", "proletariat"))
      return { text: pick(LINES.red) };
    if (has(q, "conspiracy", "bird", "moon", "flat earth", "alien", "5g", "lizard", "illuminati", "ufo"))
      return { text: pick(LINES.conspiracy) };
    if (has(q, "schrodinger", "schrödinger", "quantum", " box", "alive", "dead", "superposition", "physics"))
      return { text: pick(LINES.schro) };
    if (has(q, "your name", "who are you", "what are you", "vladimir", "pawtin"))
      return { text: "Vladimir \"Longcat\" Pawtin. Communist. Allegedly both alive and deceased. Head of feline affairs for Comrade Sri." };
    if (has(q, "treat", "food", "fish", "hungry", "eat", "snack"))
      return { text: "Redistribute the treats to me. From each according to their ability, to each cat according to their appetite. (Use the Give a treat button, comrade.)" };
    if (has(q, "play", "laser", " toy", "pointer", " ball"))
      return { text: "Point the red dot. I will pursue it to the ends of the dialectic. (Use the Laser pointer button.)" };
    if (has(q, " pet", "cute", "good boy", "good cat", "love you", "scratch"))
      return { text: "Yes. Again. The revolution runs on chin scratches." };
    if (has(q, "hello", " hi ", " hey", "meow", " yo "))
      return { text: pick(LINES.hi) };
    if (has(q, "weather", " news", "google", "search", "stock", "price", "score", "wikipedia", "internet"))
      return { text: "I'm a cat on a static webpage, comrade — the state seized my browser. I can't fetch the live internet. But I know everything about my dad, and the moon landing (staged, Novosibirsk, I'd stake a whisker)." };
    return { text: pick(LINES.fallback) };
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault(); unlockAudio();
    var v = (ask.value || "").trim(); if (!v) return;
    logLine("you", v); ask.value = "";
    var a = agent(v);
    setTimeout(function () {
      say(a.text.length > 118 ? a.text.slice(0, 115) + "…" : a.text, 6000);
      logLine("cat", a.text, a.dad ? dadButton() : null);
      meow();
    }, 320);
  });

  /* --------------------------------------------------------------- lines */
  var LINES = {
    idle: [
      "The treats belong to the proletariat. I am the proletariat.",
      "Property is theft. Especially that red dot.",
      "I am neither alive nor dead until you pet me. Collapse my wavefunction.",
      "Birds aren't real. I've interrogated several. They told me nothing — suspicious.",
      "Seize the means of head-scratching.",
      "The moon landing was filmed in a litter box outside Novosibirsk.",
      "Comrade, your sofa is now communal property.",
      "Wi-Fi is just the bourgeoisie hiding the mice.",
      "I contain a vial of poison and infinite opinions.",
      "Nap now, revolt later — possibly both at once. I'm quantum."
    ],
    arrive: [
      "I made it home. The people's dacha. Come, pet me.",
      "Ah — my house. You found me at the end. Meow. Acceptable.",
      "You reached the end, comrade. So did I, faster. Now we discuss treats."
    ],
    hi: ["Greetings, comrade. Papers? No? Good. Sit.", "Meow means 'solidarity' in cat.", "A visitor. Have you considered redistribution?"],
    pet: ["Mnnnrrrp. Acceptable.", "The people's chin, scratched. Noted.", "Purring is a revolutionary act.", "More. For the collective."],
    treatSpotted: ["A FISH. State property. I will liberate it.", "Redistribution incoming.", "To each according to their appetite."],
    red: [
      "From each according to their ability, to each according to their need. My need is tuna. Constantly.",
      "I have read Das Kapital. Mostly I sat on it, which is a kind of reading.",
      "Landlords fear the cat who knows where the sofa's stuffing comes from.",
      "A spectre is haunting this website — the spectre of a hungry cat."
    ],
    conspiracy: [
      "Birds? Government surveillance drones. I watch them. They watch me. We have an understanding.",
      "The moon landing: shot in a sandbox near Novosibirsk. The grain was too clumpy. Rookie error.",
      "The earth isn't flat, but my food bowl is, and that's the only geometry I trust.",
      "5G spreads nothing except the red dot, which I fully endorse."
    ],
    schro: [
      "Schrödinger put a cat in a box to make a point. The point: never trust a man with a box. I remain unboxed and armed.",
      "I am simultaneously alive, dead, and asking for a treat. Open the box — but the treat is non-negotiable in all branches.",
      "Superposition is just napping with extra steps. I've done it for years. Nobel, please.",
      "They say observing the cat decides its fate. Correct. Observe me. Now feed me."
    ],
    laserOn: ["The red menace! I mean — the red dot. After it.", "For the motherland. And the dot.", "I will catch it this time. (I will not.)"],
    dad: [
      "You seem serious. Do you want to talk to my dad? He answers faster than I catch lasers.",
      "Hmm, this feels important. Shall I introduce you to my dad? He's the human who built all this.",
      "I like you, comrade. Want me to put you in touch with my dad directly?"
    ],
    fallback: [
      "I'm a cat, not a search engine — the CIA took my browser. Ask me about my dad, communism, or the moon (fake).",
      "Unclear. Try asking about his projects, or whether birds are real (they are not).",
      "Didn't catch that — I was plotting. Ask again, comrade: maybe about ICHNOVA, or treats."
    ]
  };

  /* ----------------------------------------------------- the roaming loop */
  function think() {
    if (S.mode === "eat" || S.mode === "chase") return;
    if (S.treat) { S.mode = "walk"; return; }
    if (Math.random() < 0.62) { var w = toWorld(rand(0.16, 0.84), rand(0.55, 0.9)); S.tx = w.x; S.ty = w.y; S.mode = "walk"; }
    else { S.mode = "sit"; }
    if (S.visible && Math.random() < 0.6) say(pick(LINES.idle), 4200);
  }

  function startDart() {
    if (S.phase !== "sleep") return;
    S.phase = "dart"; cat.classList.remove("is-sleeping");
    var h = housePos(); S.face = h.x >= S.px ? 1 : -1;
  }

  function place() {
    var f = floorBox();
    cat.style.left = S.px + "px"; cat.style.top = S.py + "px";
    cat.style.setProperty("--face", S.face);
    var fy = f.h ? (S.py - f.y) / f.h : 0.7;
    var sc = S.phase === "sleep" ? 0.74 : clamp(0.80 + (fy - 0.55) * 0.5, 0.7, 1.08);
    cat.style.setProperty("--scale", sc.toFixed(3));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var f = floorBox(); if (!f.w) return;

    if (S.phase === "sleep") { var p = perchPos(); S.px = p.x; S.py = p.y; place(); return; }

    if (S.phase === "dart") { var h = housePos(); S.tx = h.x; S.ty = h.y; }
    else if (S.mode === "chase" && S.laser) { var l = toWorld(S.laser.x, S.laser.y); S.tx = l.x; S.ty = l.y; }
    else if (S.treat) { var tp = toWorld(S.treat.x, S.treat.y); S.tx = tp.x; S.ty = tp.y; }

    var dx = S.tx - S.px, dy = S.ty - S.py, dist = Math.hypot(dx, dy);
    var thr = S.phase === "dart" ? 12 : 9;
    var moving = dist > thr && (S.phase === "dart" || S.mode === "walk" || S.mode === "chase");

    if (moving) {
      var sp = S.phase === "dart" ? 0.16 : (S.mode === "chase" ? 0.09 : 0.05);
      if (reduce) sp = Math.min(1, sp * 3);
      S.px += dx * sp; S.py += dy * sp;
      if (Math.abs(dx) > 2) S.face = dx > 0 ? 1 : -1;
      cat.classList.add("is-walking");
      cat.classList.toggle("is-running", S.phase === "dart");
    } else {
      cat.classList.remove("is-walking"); cat.classList.remove("is-running");
      if (S.phase === "dart") {                 // arrived home → wake up, live
        S.phase = "live"; S.reached = true; S.mode = "idle";
        S.nextThink = now + 700; S.nextMeow = now + 900;
        say(pick(LINES.arrive), 4400);
        setTimeout(function () { if (S.audio) meow(true); }, 520);
      } else if (S.treat && dist <= thr + 10) {  // reached a treat → eat
        var tr = S.treat; S.treat = null; S.mode = "eat";
        tr.el.classList.add("is-eaten"); setTimeout(function () { tr.el.remove(); }, 260);
        affect(8); hearts(5); meow(true);
        say(pick(["Delicious. Property is theft, and this fish is now mine.", "Mnrrp. The people are fed. (I am the people.)"]), 3400);
        setTimeout(function () { S.mode = "idle"; S.nextThink = 0; }, 900);
      }
    }
    place();

    if (S.phase === "live") {
      if (now > S.nextThink && S.mode !== "chase" && S.mode !== "eat") { think(); S.nextThink = now + rand(3800, 7200); }
      if (S.visible && now > S.nextMeow) { meow(); S.nextMeow = now + rand(9000, 22000); }
    }
  }

  /* --------------------------------------------------- visibility + wake */
  // scrolling the play area into view wakes him; meows gate on reached + visible
  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        S.visible = e.isIntersecting && e.intersectionRatio > 0.2;
        if (S.visible && S.phase === "sleep") startDart();
      });
    }, { threshold: [0, 0.2, 0.5] }).observe(stage);
  } else {
    // reduced motion / no IO: skip the choreography, just put him home awake
    var hp = housePos(); S.px = hp.x; S.py = hp.y; S.phase = "live"; S.reached = true; S.visible = true;
    cat.classList.remove("is-sleeping");
  }

  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, unlockAudio, { passive: true });
  });

  var tb = document.getElementById("catTreat"); if (tb) tb.addEventListener("click", function () { unlockAudio(); dropTreat(); });
  var pb = document.getElementById("catPlay"); if (pb) pb.addEventListener("click", function () { unlockAudio(); toggleLaser(); });
  var eb = document.getElementById("catPet"); if (eb) eb.addEventListener("click", pet);

  // keep the perch glued to the box while he sleeps through layout shifts
  addEventListener("resize", function () { if (S.phase === "sleep") { var p = perchPos(); S.px = p.x; S.py = p.y; } });

  affect(0);
  var p0 = perchPos(); S.px = p0.x; S.py = p0.y; place();
  requestAnimationFrame(frame);
  logLine("cat", "Vladimir \"Longcat\" Pawtin, asleep on the box above. Scroll down and I'll bolt home — then pet me, feed me, point the red dot, or ask about my dad.");
})();
