/* ==========================================================================
   ZUNO Clima — comportamiento
   IIFE clásico, sin dependencias. Todo el contenido ya está en el HTML;
   este archivo solo lo enriquece. Cada módulo va envuelto en safe().
   ========================================================================== */
(function () {
  "use strict";

  var B = window.__BRAND__ || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn("[" + name + "]", e); } }

  var mxn = function (n, dec) {
    return Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 });
  };
  var num = function (n, d) { return Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits: d || 0 }); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg, ms) {
    var t = $(".toast"); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 4200);
  }

  /* ---------------- WhatsApp ---------------- */
  var waNumber = String(B.whatsapp || "").replace(/\D/g, "");
  if (waNumber.length === 10) waNumber = "52" + waNumber;
  var hasWa = waNumber.length >= 12;
  function waUrl(text) { return "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text || B.waMensaje || ""); }
  function openWa(text) {
    if (!hasWa) { toast("Demostración: falta configurar el número de WhatsApp del negocio en config.js."); return; }
    window.open(waUrl(text), "_blank", "noopener");
  }

  function initWhatsApp() {
    $$("[data-wa]").forEach(function (a) {
      var text = a.getAttribute("data-wa") || B.waMensaje;
      if (hasWa) {
        a.href = waUrl(text);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else {
        a.addEventListener("click", function (e) { e.preventDefault(); openWa(text); });
      }
    });
    // Envío de comprobante (depende del paquete elegido)
    $$("[data-wa-pay]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        openWa("Hola, les envío mi comprobante de transferencia por: " + (selectedPkg().nombre) + " (" + mxn(selectedPkg().precio, true) + ")");
      });
    });
  }

  /* ---------------- datos del negocio en la página ---------------- */
  function initBrandData() {
    var ciudadCorta = String(B.ciudad || "Torreón").split(",")[0];
    $$("[data-ciudad]").forEach(function (el) { el.textContent = ciudadCorta; });
    if (B.zona) $$("[data-zona]").forEach(function (el) { el.textContent = B.zona; });
    if (B.horario) $$("[data-horario]").forEach(function (el) { el.textContent = B.horario; });
    if (B.email) {
      $$("[data-email]").forEach(function (el) { el.textContent = B.email; });
      $$("[data-email-link]").forEach(function (a) { a.href = "mailto:" + B.email; });
    } else {
      $$("[data-email-link]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); toast("Demostración: falta configurar el correo del negocio."); }); });
    }
    if (B.telefonoVisible) $$("[data-phone-text]").forEach(function (el) { el.textContent = B.telefonoVisible; });
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    var s = B.spei || {};
    $$("[data-spei]").forEach(function (el) { var k = el.getAttribute("data-spei"); if (s[k]) el.textContent = s[k]; });
  }

  /* ---------------- navegación ---------------- */
  function initNav() {
    var nav = $(".nav"), bar = $(".progress span"), toggle = $(".nav__toggle"), menu = $("#menu-movil");
    var ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("is-scrolled", y > 20);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.setProperty("--p", h > 0 ? Math.min(1, y / h) : 0);
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    function setMenu(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      toggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
      menu.hidden = !open;
      nav.classList.toggle("menu-open", open);
    }
    toggle.addEventListener("click", function () { setMenu(menu.hidden); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

    if ("IntersectionObserver" in window) {
      var links = $$(".nav__links a");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle("is-current", l.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      links.forEach(function (l) { var t = $(l.getAttribute("href")); if (t) io.observe(t); });
    }
  }

  /* ---------------- aparición al hacer scroll ---------------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    // escalonado dentro de grupos
    $$(".bento, .perks, .gallery, .steps, .quotes, .faq").forEach(function (g) {
      $$(".reveal", g).forEach(function (el, i) { el.style.setProperty("--rd", (i * 0.08) + "s"); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    // red de seguridad: nada se queda invisible
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 6000);
  }

  /* ---------------- hero ---------------- */
  function initHeroTitle() {
    var h = $("[data-split]"); if (!h || reduceMotion) return;
    var i = 0;
    function wrap(node, parent) {
      var words = node.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      words.forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
        var o = document.createElement("span"); o.className = "w";
        var inner = document.createElement("span"); inner.textContent = w; inner.style.setProperty("--d", i++);
        o.appendChild(inner); frag.appendChild(o);
      });
      parent.replaceChild(frag, node);
    }
    $$("*", h).concat([h]).forEach(function (el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (n) { if (n.nodeType === 3 && n.textContent.trim()) wrap(n, el); });
    });
    h.classList.add("is-split");
  }

  function initTemp() {
    var el = $("[data-temp]"); if (!el || reduceMotion) return;
    var from = 41, to = 23, dur = 2800, start = null;
    el.textContent = from + "°";
    setTimeout(function () {
      requestAnimationFrame(function step(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * e) + "°";
        if (p < 1) requestAnimationFrame(step);
      });
    }, 1000);
  }

  // Partículas de aire frío que salen del minisplit de la foto
  function initAir() {
    var canvas = $(".hero__air"); if (!canvas || reduceMotion || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), hero = $(".hero"), media = $(".hero__media");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [], running = false, raf;
    // coordenadas de la rejilla del minisplit dentro de cada imagen (px de la imagen)
    var IMG = {
      desk: { w: 1600, h: 900, x1: 450, x2: 740, y: 168, px: 0.30, py: 0.5 },
      mob: { w: 720, h: 900, x1: 410, x2: 700, y: 168, px: 0.5, py: 0.3 }
    };
    var map;
    function layout() {
      var r = media.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var m = window.matchMedia("(max-width: 860px)").matches ? IMG.mob : IMG.desk;
      var s = Math.max(W / m.w, H / m.h), dw = m.w * s, dh = m.h * s;
      var ox = (W - dw) * m.px, oy = (H - dh) * m.py;
      map = { x1: ox + m.x1 * s, x2: ox + m.x2 * s, y: oy + m.y * s, s: s };
    }
    function spawn() {
      return {
        x: map.x1 + Math.random() * (map.x2 - map.x1), y: map.y + Math.random() * 6,
        vx: (-0.15 - Math.random() * 0.35) * map.s * 1.4, vy: (0.55 + Math.random() * 0.6) * map.s * 1.4,
        life: 0, max: 140 + Math.random() * 110, r: (1 + Math.random() * 2.2) * Math.max(0.7, map.s)
      };
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      if (parts.length < 70) parts.push(spawn());
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vx *= 0.995;
        var k = p.life / p.max, a = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
        if (p.life >= p.max) { parts[i] = spawn(); continue; }
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, "rgba(220,240,255," + (0.55 * a) + ")");
        g.addColorStop(1, "rgba(160,210,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    layout();
    window.addEventListener("resize", function () { layout(); parts = []; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    } else start();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* ---------------- tarjetas con foco de luz ---------------- */
  function initSpotlight() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    $$(".svc").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------------- antes / después ---------------- */
  function initCompare() {
    $$(".compare").forEach(function (c) {
      var r = $(".compare__range", c);
      function set(v) { c.style.setProperty("--pos", v + "%"); }
      r.addEventListener("input", function () { set(r.value); });
      set(r.value);
      // pequeña invitación a deslizar
      if (!reduceMotion && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting) return; io.disconnect();
          var t0 = null;
          requestAnimationFrame(function step(t) {
            if (!t0) t0 = t;
            var p = (t - t0) / 1600; if (p > 1) { set(50); r.value = 50; return; }
            var v = 50 + Math.sin(p * Math.PI * 2) * 18; set(v); r.value = v;
            requestAnimationFrame(step);
          });
        }, { threshold: 0.5 });
        io.observe(c);
      }
    });
  }

  /* ======================================================================
     CALCULADORA INTELIGENTE
     ====================================================================== */
  var calcState = { reader: null, study: null };

  function initCalc() {
    var root = $("[data-calc]"); if (!root) return;
    var C = B.calc || {};
    var step = 1;
    var panels = $$("[data-step]", root), dots = $$("[data-step-dot]", root);

    function go(n) {
      step = n;
      panels.forEach(function (p) { var on = +p.getAttribute("data-step") === n; p.hidden = !on; p.classList.toggle("is-active", on); });
      dots.forEach(function (d) {
        var k = +d.getAttribute("data-step-dot");
        d.classList.toggle("is-active", k === n); d.classList.toggle("is-done", k < n);
      });
      var top = root.getBoundingClientRect().top + window.scrollY - 90;
      if (Math.abs(window.scrollY - top) > 200) window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
    $$("[data-next]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        if (step === 2 && !validRoom()) return;
        go(step + 1);
      });
    });
    $$("[data-prev]", root).forEach(function (b) { b.addEventListener("click", function () { go(step - 1); }); });

    function val(k) {
      var el = $('[data-k="' + k + '"]:checked', root) || $('[data-k="' + k + '"]', root);
      return el ? el.value : "";
    }
    function n(k) { var v = parseFloat(String(val(k)).replace(/,/g, "")); return isFinite(v) ? v : NaN; }

    function validRoom() {
      var err = $("[data-error]", $('[data-step="2"]', root));
      var L = n("largo"), A = n("ancho"), h = n("horas"), p = n("personas"), m = n("meses");
      var msg = "";
      if (!(L >= 1 && L <= 40) || !(A >= 1 && A <= 40)) msg = "Revisa las medidas: largo y ancho entre 1 y 40 metros.";
      else if (!(h >= 1 && h <= 24)) msg = "Las horas de uso al día deben estar entre 1 y 24.";
      else if (!(p >= 1 && p <= 40)) msg = "Indica cuántas personas usan el espacio (1 a 40).";
      else if (!(m >= 1 && m <= 12)) msg = "Los meses de calor deben estar entre 1 y 12.";
      err.hidden = !msg; err.textContent = msg;
      return !msg;
    }

    /* --- lectura del recibo con IA --- */
    var fileInput = $("[data-file]", root), drop = $("[data-drop]", root), reader = $("[data-reader]", root);
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove("is-over"); }); });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

    function readerUI(kind, html) {
      reader.hidden = false;
      reader.className = "reader" + (kind ? " reader--" + kind : "");
      reader.innerHTML = html;
    }
    var REASONS = {
      sin_clave: "La lectura con IA se está configurando. Escribe los datos a la derecha; toma 20 segundos.",
      tamano: "El archivo pesa más de 10 MB. Prueba con una foto más ligera o una captura.",
      tipo: "Ese formato no se puede leer. Sube una foto (JPG, PNG, HEIC) o un PDF.",
      rate_min: "Has subido varios archivos seguidos. Espera un minuto y vuelve a intentar.",
      rate_day: "Llegaste al límite de lecturas de hoy. Escribe los datos a mano, por favor.",
      rate_global: "La lectura con IA está muy solicitada ahora. Escribe los datos a mano, por favor.",
      no_recibo: "No parece un recibo de luz de la CFE. Revisa el archivo o escribe los datos a mano."
    };

    function shrink(file) {
      return new Promise(function (resolve) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024 || !window.createImageBitmap) return resolve(file);
        createImageBitmap(file).then(function (bmp) {
          var max = 2200, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
          var cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
          cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
          cv.toBlob(function (b) { resolve(b && b.size < file.size ? new File([b], "recibo.jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
        })["catch"](function () { resolve(file); });
      });
    }

    function handleFile(file) {
      if (file.size > 10 * 1024 * 1024) { readerUI("warn", "<p>" + REASONS.tamano + "</p>"); return; }
      if (!/^image\//.test(file.type) && file.type !== "application/pdf" && !/\.(heic|heif|pdf)$/i.test(file.name)) { readerUI("warn", "<p>" + REASONS.tipo + "</p>"); return; }
      readerUI("", '<div class="reader__head"><span class="spinner"></span> Leyendo «' + esc(file.name.slice(0, 40)) + '» con IA…</div><div class="scan"></div><p>Extraemos solo consumo, tarifa e importe. Tu recibo no se guarda.</p>');
      shrink(file).then(function (f) {
        var fd = new FormData(); fd.append("recibo", f, f.name || "recibo");
        return fetch("lector-recibo.php", { method: "POST", body: fd, credentials: "same-origin" });
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d || !d.ok) {
          readerUI("warn", '<div class="reader__head"><svg class="i"><use href="#i-file"/></svg> No pudimos leerlo automáticamente</div><p>' + (REASONS[d && d.reason] || "No pude leer el recibo con claridad. Prueba con una foto más nítida o escribe los datos a la derecha.") + "</p>");
          return;
        }
        var x = d.data || {};
        calcState.reader = x;
        fill("tarifa", x.tarifa); fill("kwh", x.consumo_kwh_periodo); fill("dias", x.dias_periodo); fill("total", x.total_pagar);
        var dash = function (v, suf) { return v == null || v === "" ? "—" : esc(v) + (suf || ""); };
        readerUI("ok", '<div class="reader__head"><svg class="i"><use href="#i-check"/></svg> Recibo leído con IA · revisa los datos</div>' +
          "<dl><dt>Tarifa</dt><dd>" + dash(x.tarifa) + "</dd>" +
          "<dt>Consumo</dt><dd>" + (x.consumo_kwh_periodo != null ? num(x.consumo_kwh_periodo) + " kWh" : "—") + (x.dias_periodo ? " en " + esc(x.dias_periodo) + " días" : "") + "</dd>" +
          "<dt>Total a pagar</dt><dd>" + (x.total_pagar != null ? mxn(x.total_pagar, true) : "—") + "</dd>" +
          "<dt>Periodo</dt><dd>" + dash(x.periodo_texto) + "</dd></dl>" +
          "<p>Si algo no coincide con tu recibo, corrígelo a la derecha.</p>");
      })["catch"](function () {
        readerUI("warn", '<div class="reader__head"><svg class="i"><use href="#i-file"/></svg> No pudimos leerlo ahora</div><p>' + REASONS.sin_clave + "</p>");
      });
    }
    function fill(k, v) {
      if (v == null || v === "") return;
      var el = $('[data-k="' + k + '"]', root); if (!el) return;
      if (el.tagName === "SELECT") {
        var opt = $$("option", el).filter(function (o) { return o.value.toUpperCase() === String(v).toUpperCase(); })[0];
        if (!opt) return; el.value = opt.value;
      } else el.value = Math.round(Number(v) * 100) / 100;
      el.classList.add("is-filled");
    }

    /* --- cálculo --- */
    function compute() {
      var L = n("largo"), A = n("ancho"), alto = n("alto") || 2.6;
      var area = L * A;
      var sol = val("sol") || "parcial", espacio = val("espacio") || "recamara";
      var personas = n("personas") || 1, horas = n("horas"), meses = n("meses");
      var base = area * (C.btuPorM2 || 600) * Math.max(0.85, alto / 2.6);
      var extraP = Math.max(0, personas - 2) * (C.btuPorPersonaExtra || 500);
      var carga = (base + extraP) * ((C.factorSol || {})[sol] || 1) * ((C.factorEspacio || {})[espacio] || 1);

      var eq = (C.equipos || []).slice().sort(function (a, b) { return a.btu - b.btu; });
      var pick = null, unidades = 1;
      for (var i = 0; i < eq.length; i++) { if (eq[i].btu >= carga * 0.95) { pick = eq[i]; break; } }
      if (!pick) { // espacios muy grandes: varios equipos de 2 toneladas
        pick = eq.filter(function (e) { return e.btu === 24000; })[0] || eq[eq.length - 1];
        unidades = Math.ceil(carga / pick.btu);
      }
      var btuTotal = pick.btu * unidades;

      // tarifa y precio por kWh
      var tarifa = (val("tarifa") || "").toUpperCase();
      var kwh = n("kwh"), dias = n("dias") || 60, total = n("total");
      var kwhMes = kwh > 0 ? kwh / dias * 30.4 : NaN;
      var pagoMes = total > 0 ? total / dias * 30.4 : NaN;
      var promedio = kwh > 0 && total > 0 ? total / kwh : NaN;
      var P = C.precioKwh || {};
      var ref = tarifa === "DAC" ? P.DAC : (tarifa === "PDBT" || espacio === "negocio" && !tarifa) ? P.negocio : P.residencial;
      var precio = isFinite(promedio) ? Math.max(promedio, ref) : ref;

      var dias_uso = meses * 30.4, carga_f = C.factorCarga || 0.75;
      var kwhConv = btuTotal * carga_f * horas * dias_uso / (C.eficienciaConvencional || 11) / 1000;
      var kwhInv = btuTotal * carga_f * horas * dias_uso / (C.eficienciaInverter || 19) / 1000;
      var costoConv = kwhConv * precio, costoInv = kwhInv * precio, ahorro = costoConv - costoInv;
      var premium = (C.premiumInverter || 3500) * unidades;
      var recupera = ahorro > 0 ? premium / ahorro : NaN;

      var limite = (C.limiteDAC || {})[tarifa];
      var dacRiesgo = false;
      if (limite && isFinite(kwhMes)) {
        var promedioConConv = kwhMes + (kwhConv / 12);
        dacRiesgo = promedioConConv > limite * 0.9;
      }

      return {
        area: area, carga: carga, pick: pick, unidades: unidades, btuTotal: btuTotal,
        tarifa: tarifa, kwhMes: kwhMes, pagoMes: pagoMes, precio: precio, usaRecibo: isFinite(promedio),
        kwhConv: kwhConv, kwhInv: kwhInv, costoConv: costoConv, costoInv: costoInv, ahorro: ahorro,
        meses: meses, horas: horas, recupera: recupera, dacRiesgo: dacRiesgo, limite: limite,
        inst: [pick.instalacion[0] * unidades, pick.instalacion[1] * unidades],
        equipo: [pick.equipo[0] * unidades, pick.equipo[1] * unidades],
        sol: sol, espacio: espacio, personas: personas
      };
    }

    function tonLabel(r) {
      return (r.unidades > 1 ? r.unidades + " equipos de " : "") + r.pick.ton + (r.pick.ton === "1" ? " tonelada" : " toneladas");
    }

    function renderStudy(r, saved) {
      var box = $("[data-study]", root);
      var maxK = Math.max(r.kwhConv, 1);
      var msg = "Hola, hice el estudio en su página. Me recomienda " + tonLabel(r) + " (" + num(r.btuTotal) + " BTU) para un espacio de " + num(r.area, 1) +
        " m². Ahorro estimado con inverter: " + mxn(r.ahorro) + " al año. Quiero agendar mi visita técnica gratis.";
      box.innerHTML =
        (saved ? '<p class="study__saved"><svg class="i"><use href="#i-check"/></svg> Guardamos tu estudio; un asesor puede darte seguimiento.</p>' : "") +
        '<div class="study__top">' +
          '<div class="kpi kpi--main"><span class="kpi__label">Te recomendamos</span><span class="kpi__val">' + tonLabel(r) + '</span><span class="kpi__sub">' + num(r.btuTotal) + " BTU · carga estimada " + num(Math.round(r.carga / 100) * 100) + " BTU</span></div>" +
          '<div class="kpi kpi--save"><span class="kpi__label">Ahorro al año con inverter</span><span class="kpi__val" data-count="' + Math.round(r.ahorro) + '">' + mxn(r.ahorro) + '</span><span class="kpi__sub">frente a un equipo convencional · ~' + mxn(r.ahorro / r.meses) + " por mes de calor</span></div>" +
          '<div class="kpi"><span class="kpi__label">Instalación orientativa</span><span class="kpi__val" style="font-size:1.6rem">' + mxn(r.inst[0]) + " – " + mxn(r.inst[1]) + '</span><span class="kpi__sub">Equipo inverter aprox. ' + mxn(r.equipo[0]) + " – " + mxn(r.equipo[1]) + "</span></div>" +
        "</div>" +
        '<div class="study__cols">' +
          '<div class="box"><h4>Consumo de tu minisplit por temporada</h4><div class="bars">' +
            '<div class="bars__row"><span>Convencional</span><div class="bars__track"><i style="--w:100%"></i><em>' + num(r.kwhConv) + " kWh · " + mxn(r.costoConv) + "</em></div></div>" +
            '<div class="bars__row bars__row--inv"><span><b>Inverter</b></span><div class="bars__track"><i style="--w:' + Math.max(8, r.kwhInv / maxK * 100).toFixed(1) + '%"></i><em>' + num(r.kwhInv) + " kWh · " + mxn(r.costoInv) + "</em></div></div>" +
          "</div>" +
          '<p class="muted small" style="margin:12px 0 0">Uso: ' + num(r.horas) + " h/día durante " + num(r.meses) + " meses · precio usado: " + mxn(r.precio, true) + "/kWh" + (r.usaRecibo ? " (según tu recibo)" : " (valor típico)") + ".</p>" +
          (isFinite(r.recupera) ? '<p class="muted small" style="margin:8px 0 0">La diferencia de precio de un inverter (~' + mxn((B.calc || {}).premiumInverter * r.unidades) + ") se recupera en aprox. <b>" + (r.recupera < 1 ? "menos de 1 temporada" : num(r.recupera, 1) + " temporadas") + "</b>.</p>" : "") +
          "</div>" +
          '<div class="box"><h4>Tus datos</h4><ul class="rows">' +
            "<li><span>Espacio</span><b>" + num(r.area, 1) + " m² · " + esc({ recamara: "recámara", sala: "sala/comedor", negocio: "oficina/negocio", cocina: "cocina" }[r.espacio]) + "</b></li>" +
            "<li><span>Sol directo</span><b>" + esc({ no: "casi nada", parcial: "parte del día", directo: "varias horas" }[r.sol]) + "</b></li>" +
            "<li><span>Personas</span><b>" + num(r.personas) + "</b></li>" +
            "<li><span>Tarifa CFE</span><b>" + (r.tarifa || "—") + "</b></li>" +
            "<li><span>Consumo actual</span><b>" + (isFinite(r.kwhMes) ? num(r.kwhMes) + " kWh/mes" : "—") + "</b></li>" +
            "<li><span>Pago actual</span><b>" + (isFinite(r.pagoMes) ? mxn(r.pagoMes) + "/mes" : "—") + "</b></li>" +
          "</ul>" +
          (r.dacRiesgo ? '<div class="alert"><b>Ojo con la tarifa DAC:</b> con un equipo convencional tu consumo promedio podría acercarse al límite de ' + num(r.limite) + " kWh/mes de tu tarifa. Un inverter te ayuda a mantenerte abajo.</div>" : "") +
          "</div>" +
        "</div>" +
        '<details class="study__assume"><summary>Supuestos de este estudio (estimación orientativa)</summary><ul>' +
          "<li>Carga térmica base de " + ((B.calc || {}).btuPorM2 || 600) + " BTU/m² para clima cálido, ajustada por altura de techo, sol, tipo de espacio y personas.</li>" +
          "<li>Eficiencia típica: convencional " + ((B.calc || {}).eficienciaConvencional || 11) + " BTU/Wh vs inverter " + ((B.calc || {}).eficienciaInverter || 19) + " BTU/Wh, trabajando en promedio al " + Math.round(((B.calc || {}).factorCarga || 0.75) * 100) + "% de su capacidad.</li>" +
          "<li>Precio por kWh: el mayor entre tu promedio del recibo y el precio marginal típico de tu tarifa (los kWh extra suelen cobrarse en el escalón más caro).</li>" +
          "<li>Los precios de instalación y equipo son rangos de referencia; el precio final depende de la marca, la distancia entre unidades, la altura y la instalación eléctrica.</li>" +
          "<li>No es una cotización formal ni garantiza un ahorro. Un técnico confirma la capacidad en la visita.</li>" +
        "</ul></details>" +
        '<div class="study__ctas">' +
          '<a class="btn btn--wa btn--lg" href="#contacto" data-study-wa><svg class="i"><use href="#i-wa"/></svg> Agendar visita gratis</a>' +
          '<a class="btn btn--primary btn--lg" href="#pagos" data-study-pay>Apartar con anticipo</a>' +
          '<button class="btn btn--ghost" type="button" data-restart>Calcular otro cuarto</button>' +
        "</div>";
      $("[data-study-wa]", box).addEventListener("click", function (e) { e.preventDefault(); openWa(msg); });
      $("[data-study-pay]", box).addEventListener("click", function () { selectPkg("anticipo"); });
      $("[data-restart]", box).addEventListener("click", function () { go(2); });
      // contador animado del ahorro
      var c = $("[data-count]", box);
      if (c && !reduceMotion) {
        var target = +c.getAttribute("data-count"), t0 = null;
        requestAnimationFrame(function stepC(t) {
          if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
          c.textContent = mxn(target * e); if (p < 1) requestAnimationFrame(stepC);
        });
      }
    }

    /* --- captura del contacto y estudio --- */
    var gate = $("[data-gate]", root), gErr = $("[data-gate-error]", root);
    gate.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = gate.nombre.value.trim(), email = gate.email.value.trim(), tel = gate.telefono.value.replace(/\D/g, "");
      var msg = "";
      $$("input", gate).forEach(function (i) { i.removeAttribute("aria-invalid"); });
      if (!email && !tel) { msg = "Escribe tu correo o tu WhatsApp para ver el estudio."; gate.email.setAttribute("aria-invalid", "true"); }
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg = "Revisa tu correo, parece incompleto."; gate.email.setAttribute("aria-invalid", "true"); }
      else if (tel && !(tel.length === 10 || (tel.length === 12 && tel.indexOf("52") === 0))) { msg = "El WhatsApp debe tener 10 dígitos."; gate.telefono.setAttribute("aria-invalid", "true"); }
      else if (!gate.consent.checked) msg = "Necesitamos tu autorización para contactarte.";
      gErr.hidden = !msg; gErr.textContent = msg;
      if (msg) return;

      var r = compute(); calcState.study = r;
      var btn = $('button[type="submit"]', gate); btn.disabled = true; btn.firstChild.textContent = "Preparando tu estudio… ";
      var payload = {
        nombre: nombre, email: email, telefono: tel, consent: true, origen: "calculadora",
        calc: {
          toneladas: tonLabel(r), btu: r.btuTotal, area_m2: Math.round(r.area * 10) / 10, sol: r.sol, espacio: r.espacio,
          personas: r.personas, horas: r.horas, meses: r.meses, tarifa: r.tarifa, kwh_mes: isFinite(r.kwhMes) ? Math.round(r.kwhMes) : null,
          pago_mes: isFinite(r.pagoMes) ? Math.round(r.pagoMes) : null, ahorro_anual: Math.round(r.ahorro),
          instalacion: r.inst.join("-"), equipo: r.equipo.join("-"), recibo_ia: !!calcState.reader
        }
      };
      var done = function (saved) { btn.disabled = false; btn.firstChild.textContent = "Ver mi estudio "; renderStudy(r, saved); go(4); };
      fetch("lead.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "same-origin" })
        .then(function (res) { return res.json(); })
        .then(function (d) { done(!!(d && d.ok)); })
        ["catch"](function () { done(false); });
    });
  }

  /* ======================================================================
     PAGOS
     ====================================================================== */
  function selectedPkg() {
    var p = $(".pkg.is-selected") || $(".pkg");
    return { id: p.getAttribute("data-pkg"), precio: +p.getAttribute("data-precio"), nombre: p.getAttribute("data-nombre") };
  }
  function selectPkg(id) {
    $$(".pkg").forEach(function (p) {
      var on = p.getAttribute("data-pkg") === id;
      p.classList.toggle("is-selected", on); p.setAttribute("aria-checked", on ? "true" : "false");
    });
    var s = selectedPkg();
    $$("[data-pay-name]").forEach(function (el) { el.textContent = s.nombre; });
    $$("[data-pay-amount]").forEach(function (el) { el.textContent = mxn(s.precio, true) + " MXN"; });
  }

  function initPay() {
    // Paquete de $1 para probar cobros: solo aparece con ?prueba=1 en la dirección
    if (/[?&]prueba=1\b/.test(location.search)) {
      $$("[data-test]").forEach(function (p) { p.hidden = false; });
      selectPkg("prueba");
    }
    var pkgs = $$(".pkg").filter(function (p) { return !p.hidden; }); if (!pkgs.length) return;
    pkgs.forEach(function (p, i) {
      p.addEventListener("click", function () { selectPkg(p.getAttribute("data-pkg")); });
      p.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!d) return; e.preventDefault();
        var nx = pkgs[(i + d + pkgs.length) % pkgs.length]; nx.focus(); selectPkg(nx.getAttribute("data-pkg"));
      });
    });
    selectPkg(selectedPkg().id);

    // pestañas accesibles
    var tabs = $$(".tab");
    function activate(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1;
        $("#" + x.getAttribute("aria-controls")).hidden = !on;
      });
      if (t.id === "tb-pp") initPayPal();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
        var nx = tabs[(i + d + tabs.length) % tabs.length]; nx.focus(); activate(nx);
      });
    });

    // Mercado Pago (el precio lo decide el servidor)
    var mpBtn = $("[data-mp]"), mpMsg = $("[data-mp-msg]");
    mpBtn.addEventListener("click", function () {
      var label = mpBtn.innerHTML;
      mpBtn.disabled = true; mpBtn.textContent = "Abriendo pago seguro…"; mpMsg.hidden = true;
      fetch("pago.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ producto: selectedPkg().id }), credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.ok && d.url) { location.href = d.url; } else { throw d; } })
        ["catch"](function (d) {
          mpBtn.disabled = false; mpBtn.innerHTML = label;
          mpMsg.textContent = (d && d.msg) || "El pago con Mercado Pago aún no está activo en esta demostración. Puedes pagar por transferencia o escribirnos por WhatsApp.";
          mpMsg.hidden = false;
        });
    });

    // Copiar CLABE
    $$("[data-copy]").forEach(function (b) {
      b.addEventListener("click", function () {
        var el = $(b.getAttribute("data-copy")); var text = el.textContent.trim();
        var ok = function () { toast("CLABE copiada: " + text); };
        var fallback = function () {
          var range = document.createRange(); range.selectNodeContents(el);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
          try { document.execCommand("copy"); ok(); } catch (e) { toast("Mantén presionada la CLABE para copiarla."); }
        };
        try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
      });
    });
  }

  var ppLoaded = false;
  function initPayPal() {
    var box = $("#paypal-buttons"), msg = $("[data-pp-msg]");
    if (ppLoaded) return; ppLoaded = true;
    if (!B.paypalClientId) {
      msg.textContent = "PayPal se activa en cuanto el negocio conecte su cuenta PayPal Business. Mientras, paga con Mercado Pago o por transferencia.";
      msg.hidden = false; return;
    }
    box.innerHTML = '<div class="reader__head"><span class="spinner"></span> Cargando PayPal…</div>';
    var s = document.createElement("script");
    s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(B.paypalClientId) + "&currency=MXN&locale=es_MX";
    s.onload = function () {
      safe(function () {
        box.innerHTML = "";
        window.paypal.Buttons({
          style: { color: "blue", shape: "pill", label: "pay" },
          createOrder: function (d, actions) {
            var p = selectedPkg();
            return actions.order.create({ purchase_units: [{ description: p.nombre, amount: { currency_code: "MXN", value: p.precio.toFixed(2) } }] });
          },
          onApprove: function (d, actions) { return actions.order.capture().then(function () { location.href = "gracias.html"; }); },
          onError: function () { msg.textContent = "No se pudo completar el pago con PayPal. Intenta de nuevo o usa otro método."; msg.hidden = false; }
        }).render(box);
      }, "paypal");
    };
    s.onerror = function () { box.innerHTML = ""; msg.textContent = "PayPal no está disponible ahora. Usa otro método o escríbenos por WhatsApp."; msg.hidden = false; };
    document.head.appendChild(s);
  }

  /* ---------------- formulario de contacto → WhatsApp ---------------- */
  function initContact() {
    var f = $("[data-contact]"); if (!f) return;
    var err = $("[data-contact-error]", f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var miss = [];
      ["nombre", "servicio", "inmueble", "colonia"].forEach(function (k) {
        var el = f[k], bad = !el.value.trim();
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) miss.push($('label[for="' + el.id + '"]', f).textContent.replace(" *", ""));
      });
      err.hidden = !miss.length;
      if (miss.length) { err.textContent = "Completa: " + miss.join(", ") + "."; f[["nombre", "servicio", "inmueble", "colonia"].filter(function (k) { return !f[k].value.trim(); })[0]].focus(); return; }
      var text = "Hola, vi su página y quiero una cotización.\n" +
        "• Nombre: " + f.nombre.value.trim() + "\n" +
        "• Servicio: " + f.servicio.value + "\n" +
        "• Inmueble: " + f.inmueble.value + "\n" +
        "• Colonia/zona: " + f.colonia.value.trim() +
        (f.mensaje.value.trim() ? "\n• Detalles: " + f.mensaje.value.trim() : "");
      openWa(text);
    });
  }

  /* ======================================================================
     ASISTENTE DE IA
     ====================================================================== */
  function initChat() {
    var panel = $("#chat"); if (!panel) return;
    var log = $("[data-chat-log]", panel), form = $("[data-chat-form]", panel), input = $("#chat-input"), chips = $("[data-chat-chips]", panel);
    var fab = $(".chat-fab"), history = [], busy = false;

    function open() {
      panel.hidden = false; document.body.classList.add("chat-open"); fab.setAttribute("aria-expanded", "true");
      setTimeout(function () { if (window.matchMedia("(hover: hover)").matches) input.focus(); }, 60);
    }
    function close() { panel.hidden = true; document.body.classList.remove("chat-open"); fab.setAttribute("aria-expanded", "false"); fab.focus(); }
    $$("[data-open-chat]").forEach(function (b) { b.addEventListener("click", function () { panel.hidden ? open() : close(); }); });
    $("[data-close-chat]", panel).addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });

    function format(text) {
      var h = esc(text);
      h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, "$1<i>$2</i>");
      h = h.replace(/#(calculadora|pagos|contacto|servicios|preguntas)\b/g, '<a href="#$1">#$1</a>');
      var lines = h.split(/\n/), out = [], list = false;
      lines.forEach(function (l) {
        var m = l.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)$/);
        if (m) { if (!list) { out.push("<ul>"); list = true; } out.push("<li>" + m[1] + "</li>"); return; }
        if (list) { out.push("</ul>"); list = false; }
        if (l.trim()) out.push("<p>" + l + "</p>");
      });
      if (list) out.push("</ul>");
      return out.join("");
    }
    function add(role, text, html) {
      var d = document.createElement("div"); d.className = "msg msg--" + (role === "user" ? "me" : "bot");
      if (html) d.innerHTML = html; else if (role === "user") d.textContent = text; else d.innerHTML = format(text);
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      $$("a[href^='#']", d).forEach(function (a) { a.addEventListener("click", function () { if (window.innerWidth < 640) close(); }); });
      return d;
    }
    function send(text) {
      text = (text || "").trim(); if (!text || busy) return;
      busy = true; chips.hidden = true;
      add("user", text); input.value = "";
      var typing = add("bot", "", "<i></i><i></i><i></i>"); typing.classList.add("msg--typing");
      $('button[type="submit"]', form).disabled = true;
      fetch("asistente-ia.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: history.slice(-8) }), credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.reply) throw 0;
          typing.remove(); add("bot", d.reply);
          history.push({ role: "user", text: text }, { role: "model", text: d.reply });
        })
        ["catch"](function () {
          typing.remove();
          add("bot", "", "<p>Ahora mismo no puedo responder. Mientras tanto puedes usar la <a href=\"#calculadora\">calculadora</a> o escribirnos y te atiende una persona.</p>");
        })
        .then(function () { busy = false; $('button[type="submit"]', form).disabled = false; });
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    $$("button", chips).forEach(function (b) { b.addEventListener("click", function () { send(b.textContent); }); });
  }

  /* ---------------- arranque ---------------- */
  function boot() {
    safe(initBrandData, "brand");
    safe(initWhatsApp, "whatsapp");
    safe(initNav, "nav");
    safe(initHeroTitle, "hero-title");
    safe(initReveal, "reveal");
    safe(initTemp, "temp");
    safe(initAir, "air");
    safe(initSpotlight, "spotlight");
    safe(initCompare, "compare");
    safe(initCalc, "calc");
    safe(initPay, "pay");
    safe(initContact, "contact");
    safe(initChat, "chat");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
