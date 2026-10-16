(function () {
  "use strict";

  var BRAND = window.__BRAND__ || { whatsapp: { ventas: "528715222154" } };
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn("[zuno] " + name, e); }
  }

  /* ---------- Splash (double safety net) ---------- */
  function ready() { body.classList.add("is-ready"); }
  window.addEventListener("load", function () { setTimeout(ready, 350); });
  setTimeout(ready, 2200);

  /* ---------- Split hero letters ---------- */
  safe("split", function () {
    var els = document.querySelectorAll("[data-split]");
    Array.prototype.forEach.call(els, function (el) {
      if (el.dataset.done) return;
      var txt = el.textContent;
      el.textContent = "";
      txt.split("").forEach(function (c, i) {
        var s = document.createElement("span");
        s.className = "ch";
        s.style.setProperty("--i", i);
        s.textContent = c;
        el.appendChild(s);
      });
      el.dataset.done = "1";
    });
  });

  /* ---------- Reveal on scroll ---------- */
  safe("reveal", function () {
    var items = document.querySelectorAll(".reveal");
    // stagger siblings
    Array.prototype.forEach.call(items, function (el) {
      var p = el.parentElement, idx = 0, sib = p ? p.children : [];
      for (var i = 0; i < sib.length; i++) { if (sib[i] === el) break; if (sib[i].classList.contains("reveal")) idx++; }
      el.style.setProperty("--d", Math.min(idx, 6) * 90 + "ms");
    });
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
    // safety net: never leave content hidden
    setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("is-in");
      });
    }, 2500);
  });

  /* ---------- Nav state, progress, active link, process fill ---------- */
  safe("scroll", function () {
    var nav = document.querySelector(".nav");
    var bar = document.querySelector(".progress span");
    var wa = document.querySelector(".wa-float");
    var proc = document.querySelector(".process");
    var steps = document.querySelectorAll(".step");
    var links = document.querySelectorAll(".nav__links a");
    var sections = Array.prototype.map.call(links, function (a) { return document.querySelector(a.getAttribute("href")); });
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var h = doc.scrollHeight - window.innerHeight;
      nav.classList.toggle("is-scrolled", y > 30);
      if (bar) bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
      if (wa) wa.classList.toggle("is-on", y > window.innerHeight * 0.7);

      var current = -1;
      sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
      Array.prototype.forEach.call(links, function (a, i) { a.classList.toggle("is-active", i === current); });

      if (proc) {
        var r = proc.getBoundingClientRect();
        var f = Math.max(0, Math.min(1, (window.innerHeight * 0.75 - r.top) / (r.height + window.innerHeight * 0.2)));
        proc.style.setProperty("--fill", f.toFixed(3));
        Array.prototype.forEach.call(steps, function (st, i) {
          st.classList.toggle("is-in-step", false);
          if (st.getBoundingClientRect().top < window.innerHeight * 0.72) st.classList.add("is-in");
        });
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Mobile menu ---------- */
  safe("menu", function () {
    var nav = document.querySelector(".nav");
    var btn = document.querySelector(".nav__toggle");
    var drawer = document.querySelector(".drawer");
    if (!btn || !drawer) return;
    function set(open) {
      body.classList.toggle("menu-open", open);
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
    }
    btn.addEventListener("click", function () { set(!body.classList.contains("menu-open")); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  });

  /* ---------- Pointer: aura, spotlight cards, tilt, magnetic ---------- */
  var pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.35, active: false };

  safe("pointer", function () {
    var raf = null;
    window.addEventListener("pointermove", function (e) {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        doc.style.setProperty("--mx", pointer.x + "px");
        doc.style.setProperty("--my", pointer.y + "px");
      });
    }, { passive: true });
    document.addEventListener("pointerleave", function () { pointer.active = false; });

    // Spotlight on cards
    Array.prototype.forEach.call(document.querySelectorAll("[data-spot]"), function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--sx", (e.clientX - r.left) + "px");
        el.style.setProperty("--sy", (e.clientY - r.top) + "px");
      });
    });

    if (!fine) return;

    // Hero emblem tilt follows mouse across the whole hero
    var emblem = document.querySelector("[data-tilt]");
    var hero = document.querySelector(".hero");
    if (emblem && hero) {
      hero.addEventListener("pointermove", function (e) {
        var r = emblem.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        var dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        emblem.style.setProperty("--ry", (dx * 30).toFixed(2) + "deg");
        emblem.style.setProperty("--rx", (-dy * 30).toFixed(2) + "deg");
      });
      hero.addEventListener("pointerleave", function () {
        emblem.style.setProperty("--ry", "0deg"); emblem.style.setProperty("--rx", "0deg");
      });
    }

    // Member cards tilt
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt-card]"), function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (px * 7).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-py * 7).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); });
    });

    // Magnetic buttons
    Array.prototype.forEach.call(document.querySelectorAll(".magnetic"), function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  });

  /* ---------- Living background: reactive dot field ---------- */
  safe("field", function () {
    var canvas = document.getElementById("field");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var W = 0, H = 0, gap = 34, pts = [], t = 0, running = true;
    var ripples = [];
    var smooth = { x: pointer.x, y: pointer.y };

    function build() {
      W = window.innerWidth; H = window.innerHeight;
      gap = W < 640 ? 28 : 34;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      var cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
      var ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = ox + c * gap, y = oy + r * gap;
          pts.push({ bx: x, by: y, x: x, y: y, vx: 0, vy: 0 });
        }
      }
    }

    window.addEventListener("resize", function () { build(); });
    window.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a,button,input,textarea,label")) return;
      ripples.push({ x: e.clientX, y: e.clientY, r: 0 });
    });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });

    var R = 180; // influence radius
    var speed = reduce ? 0.35 : 1;

    function frame() {
      if (!running) return;
      t += 0.006 * speed;
      // when no mouse (touch / idle), let a slow "ghost" wander
      var tx = pointer.active ? pointer.x : W * (0.5 + 0.32 * Math.cos(t * 1.3));
      var ty = pointer.active ? pointer.y : H * (0.45 + 0.25 * Math.sin(t * 1.9));
      smooth.x += (tx - smooth.x) * 0.12;
      smooth.y += (ty - smooth.y) * 0.12;

      ctx.clearRect(0, 0, W, H);
      var mx = smooth.x, my = smooth.y;

      for (var k = ripples.length - 1; k >= 0; k--) { ripples[k].r += 9 * speed; if (ripples[k].r > Math.max(W, H)) ripples.splice(k, 1); }

      var near = [];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx = p.x - mx, dy = p.y - my;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var fx = 0, fy = 0, glow = 0;

        if (d < R) {
          var f = (1 - d / R);
          fx += (dx / d) * f * f * 26;
          fy += (dy / d) * f * f * 26;
          glow = f;
          if (d < R * 0.85) near.push(p);
        }
        for (var q = 0; q < ripples.length; q++) {
          var rp = ripples[q];
          var rdx = p.bx - rp.x, rdy = p.by - rp.y;
          var rd = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
          var band = 1 - Math.abs(rd - rp.r) / 60;
          if (band > 0) {
            var fade = Math.max(0, 1 - rp.r / 900);
            fx += (rdx / rd) * band * 14 * fade; fy += (rdy / rd) * band * 14 * fade;
            glow = Math.max(glow, band * fade);
          }
        }

        // breathing wave across the grid
        var wave = Math.sin(p.bx * 0.012 + t * 3) * Math.cos(p.by * 0.014 - t * 2.2);
        var tx2 = p.bx + fx, ty2 = p.by + fy + wave * 2.2;

        p.vx += (tx2 - p.x) * 0.08; p.vy += (ty2 - p.y) * 0.08;
        p.vx *= 0.78; p.vy *= 0.78;
        p.x += p.vx; p.y += p.vy;

        var base = 0.07 + (wave + 1) * 0.035;
        var a = Math.min(1, base + glow * 0.85);
        var size = 1 + glow * 1.6;
        if (glow > 0.02) {
          // jade near the core, amber at the edge
          var mix = glow;
          var rr = Math.round(242 + (62 - 242) * mix), gg = Math.round(180 + (230 - 180) * mix), bb = Math.round(90 + (166 - 90) * mix);
          ctx.fillStyle = "rgba(" + rr + "," + gg + "," + bb + "," + a.toFixed(3) + ")";
        } else {
          ctx.fillStyle = "rgba(210,225,220," + a.toFixed(3) + ")";
        }
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      // constellation lines from the cursor
      if (near.length && (pointer.active || !fine)) {
        ctx.lineWidth = 1;
        for (var n = 0; n < near.length; n += 2) {
          var np = near[n];
          var ndx = np.x - mx, ndy = np.y - my;
          var nd = Math.sqrt(ndx * ndx + ndy * ndy);
          var al = (1 - nd / (R * 0.85)) * 0.28;
          ctx.strokeStyle = "rgba(62,230,166," + al.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(np.x, np.y); ctx.stroke();
        }
      }
      requestAnimationFrame(frame);
    }

    build();
    requestAnimationFrame(frame);
  });

  /* ---------- Quote form → WhatsApp (ventas) ---------- */
  safe("form", function () {
    var form = document.getElementById("quote");
    if (!form) return;
    var err = form.querySelector(".form__error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = form.nombre.value.trim();
      if (!nombre) {
        err.hidden = false; form.nombre.focus(); return;
      }
      err.hidden = true;
      var negocio = form.negocio.value.trim();
      var tipoEl = form.querySelector('input[name="tipo"]:checked');
      var tipo = tipoEl ? tipoEl.value : "Página web";
      var msg = form.mensaje.value.trim();
      var lines = [
        "Hola ZUNO 👋 Quiero cotizar una página web.",
        "",
        "• Nombre: " + nombre
      ];
      if (negocio) lines.push("• Negocio: " + negocio);
      lines.push("• Necesito: " + tipo);
      if (msg) lines.push("• Detalles: " + msg);
      var url = "https://wa.me/" + BRAND.whatsapp.ventas + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
    form.nombre.addEventListener("input", function () { if (form.nombre.value.trim()) err.hidden = true; });
  });

  /* ---------- Pending profile links ---------- */
  safe("pending", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-pending]"), function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); });
    });
  });

  safe("year", function () {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  });
})();
