/* ============================================================================
   Vladimir "Longcat" Pawtin — a communist black cat that roams his play area,
   takes treats, chases a laser, gets pets, meows (only once you've reached him),
   answers questions about Sri, and quietly offers to connect you with "his dad".

   Roaming/attention behaviour follows the open-source oneko.js model
   (https://github.com/adryd325/oneko.js, MIT) — the cat is rendered as smooth
   SVG here instead of a pixel sprite, so it stays crisp at any size.
   Self-contained, vanilla JS, no dependency on the site's GSAP/Lenis stack.
   ========================================================================== */
(function () {
  "use strict";

  var stage = document.getElementById("catStage");
  var cat = document.getElementById("cat");
  var bubble = document.getElementById("catBubble");
  var bar = document.getElementById("catBar");
  var logEl = document.getElementById("catLog");
  var form = document.getElementById("catForm");
  var ask = document.getElementById("catAsk");
  if (!stage || !cat || !bubble) return;

  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var WA = "https://wa.me/917305289070"; // "his dad" — never announced as WhatsApp up front

  // ---- state (positions are 0..1 fractions of the stage) ----
  var S = {
    x: 0.5, y: 0.62, tx: 0.5, ty: 0.62, face: 1,
    mode: "idle",            // idle | walk | eat | chase | sit
    affection: 18, visible: false, audio: false,
    treat: null, laser: null, nextThink: 0, nextMeow: 0
  };

  function stageSize() { var r = stage.getBoundingClientRect(); return { w: r.width, h: r.height }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

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
  function affect(d) {
    S.affection = clamp(S.affection + d, 0, 100);
    if (bar) bar.style.width = S.affection + "%";
  }
  function hearts(n) {
    var sz = stageSize(), px = S.x * sz.w, py = S.y * sz.h;
    for (var i = 0; i < (n || 3); i++) {
      var h = document.createElement("div");
      h.className = "cat-heart"; h.textContent = Math.random() < 0.25 ? "★" : "♥";
      h.style.left = (px + rand(-26, 26)) + "px";
      h.style.top = (py - rand(20, 60)) + "px";
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
  // a cat-ish meow: pitch glides up then down through a band-pass, with vibrato
  function meow(happy) {
    if (!S.visible || !S.audio || !actx) return;
    var t = actx.currentTime, dur = happy ? 0.34 : 0.5;
    var osc = actx.createOscillator(), vib = actx.createOscillator(), vg = actx.createGain();
    var bp = actx.createBiquadFilter(), g = actx.createGain();
    osc.type = "sawtooth";
    var base = happy ? 760 : 620;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base + 230, t + dur * 0.35);
    osc.frequency.linearRampToValueAtTime(base - 120, t + dur);
    vib.frequency.value = 26; vg.gain.value = 18; vib.connect(vg); vg.connect(osc.frequency); // vibrato
    bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(bp); bp.connect(g); g.connect(actx.destination);
    osc.start(t); vib.start(t); osc.stop(t + dur); vib.stop(t + dur);
  }

  /* ---------------------------------------------------------------- treats */
  function dropTreat() {
    if (S.treat) return;
    var el = document.createElement("div"); el.className = "cat-treat"; el.textContent = "🐟";
    var fx = rand(0.12, 0.88), fy = rand(0.68, 0.9);
    el.style.left = (fx * 100) + "%"; el.style.top = (fy * 100) + "%";
    stage.appendChild(el);
    S.treat = { el: el, x: fx, y: fy };
    S.tx = fx; S.ty = fy; S.mode = "walk";
    say(pick(LINES.treatSpotted), 3000);
  }

  /* ---------------------------------------------------------------- laser */
  var laserOn = false, laserEl;
  function toggleLaser() {
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
    S.laser.x = clamp((e.clientX - r.left) / r.width, 0.03, 0.97);
    S.laser.y = clamp((e.clientY - r.top) / r.height, 0.1, 0.95);
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
    say(pick(LINES.pet), 3200);
    // after enough love, Vladimir offers to connect you with "his dad"
    if (S.affection > 62 && Math.random() < 0.5) offerDad(true);
  }
  cat.addEventListener("click", function (e) { e.stopPropagation(); pet(); });

  /* ------------------------------------------------------------- "his dad" */
  function dadButton() {
    var a = document.createElement("a");
    a.className = "cat-dad"; a.href = WA + "?text=" + encodeURIComponent(
      "Hi Sri — found you through your portfolio (Vladimir the cat sent me). I'd love to chat about ");
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "🐾 yes, introduce me →";
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
    // --- intent to reach / hire / contact Sri → offer "his dad" (never "whatsapp") ---
    if (has(q, "contact", "reach", "hire", "email", "message", "talk to", "get in touch", "recruit", "collab", "available", "work with", " dm "))
      return { text: pick(LINES.dad), dad: true };
    if (has(q, "whatsapp", "phone", "number", "call"))
      return { text: "I don't hand numbers to strangers, that's how the state finds you. But — " + pick(LINES.dad), dad: true };
    // --- about Sri ---
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
    // --- Vladimir's politics ---
    if (has(q, "communist", "communism", "marx", "lenin", "socialis", "capitalis", "politic", "revolution", "proletariat"))
      return { text: pick(LINES.red) };
    // --- conspiracies, for fun ---
    if (has(q, "conspiracy", "bird", "moon", "flat earth", "alien", "5g", "lizard", "illuminati", "ufo"))
      return { text: pick(LINES.conspiracy) };
    // --- schrödinger ---
    if (has(q, "schrodinger", "schrödinger", "quantum", " box", "alive", "dead", "superposition", "physics"))
      return { text: pick(LINES.schro) };
    if (has(q, "your name", "who are you", "what are you", "vladimir", "pawtin"))
      return { text: "Vladimir \"Longcat\" Pawtin. Communist. Allegedly both alive and deceased. Head of feline affairs for Comrade Sri." };
    if (has(q, "treat", "food", "fish", "hungry", "eat", "snack"))
      return { text: "Redistribute the treats to me. From each according to their ability, to each cat according to their appetite. (The 🐟 button, comrade.)" };
    if (has(q, "play", "laser", " toy", "pointer", " ball"))
      return { text: "Point the red dot. I will pursue it to the ends of the dialectic. (The 🔴 button.)" };
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
    if (S.treat) { S.tx = S.treat.x; S.ty = S.treat.y; S.mode = "walk"; return; }
    if (Math.random() < 0.55) { S.tx = rand(0.12, 0.88); S.ty = rand(0.58, 0.9); S.mode = "walk"; }
    else { S.mode = "sit"; }
    if (S.visible && Math.random() < 0.6) say(pick(LINES.idle), 4200);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var sz = stageSize(); if (!sz.w) return;

    if (S.mode === "chase" && S.laser) { S.tx = S.laser.x; S.ty = S.laser.y; }

    var dx = S.tx - S.x, dy = S.ty - S.y, dist = Math.hypot(dx, dy);
    var moving = dist > 0.012 && (S.mode === "walk" || S.mode === "chase");

    if (moving) {
      var sp = (S.mode === "chase" ? 0.05 : 0.02) * (reduce ? 2.5 : 1);
      S.x += dx * sp; S.y += dy * sp;
      if (Math.abs(dx) > 0.003) S.face = dx > 0 ? 1 : -1;
      cat.classList.add("is-walking");
    } else {
      cat.classList.remove("is-walking");
      if (S.treat && dist <= 0.035) {
        var tr = S.treat; S.treat = null; S.mode = "eat";
        tr.el.classList.add("is-eaten"); setTimeout(function () { tr.el.remove(); }, 260);
        affect(8); hearts(5); meow(true);
        say(pick(["Delicious. Property is theft, and this fish is now mine.", "Mnrrp. The people are fed. (I am the people.)"]), 3400);
        setTimeout(function () { S.mode = "idle"; S.nextThink = 0; }, 900);
      }
    }

    cat.style.left = (S.x * sz.w) + "px";
    cat.style.top = (S.y * sz.h) + "px";
    cat.style.setProperty("--face", S.face);
    cat.style.setProperty("--scale", (0.82 + (S.y - 0.55) * 0.5).toFixed(3)); // lower = nearer = bigger

    if (S.visible) {
      if (now > S.nextThink && S.mode !== "chase" && S.mode !== "eat") { think(); S.nextThink = now + rand(3800, 7200); }
      if (now > S.nextMeow) { meow(); S.nextMeow = now + rand(9000, 22000); }
    }
  }

  /* --------------------------------------------------- visibility + audio */
  // meows are only heard once the visitor reaches the end and actually sees him
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var nowVisible = e.isIntersecting && e.intersectionRatio > 0.35;
        if (nowVisible && !S.visible) {
          S.visible = true;
          S.nextMeow = performance.now() + 900; S.nextThink = performance.now() + 1500;
          setTimeout(function () { if (S.audio) meow(); say("You made it to the end, comrade. I knew you would. Meow.", 4600); }, 700);
        } else if (!nowVisible) { S.visible = false; }
      });
    }, { threshold: [0, 0.35, 0.6] }).observe(stage);
  } else { S.visible = true; }

  // browsers need a gesture before audio — unlock on the visitor's first interaction
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, unlockAudio, { passive: true });
  });

  var tb = document.getElementById("catTreat"); if (tb) tb.addEventListener("click", function () { unlockAudio(); dropTreat(); });
  var pb = document.getElementById("catPlay"); if (pb) pb.addEventListener("click", function () { unlockAudio(); toggleLaser(); });
  var eb = document.getElementById("catPet"); if (eb) eb.addEventListener("click", pet);

  affect(0);
  requestAnimationFrame(frame);
  logLine("cat", "Vladimir \"Longcat\" Pawtin, reporting. Pet me, feed me, point the red dot — or ask me about my dad. Papers optional.");
})();
