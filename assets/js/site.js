// Site interactions. Everything here is an enhancement: with JavaScript off,
// every page still shows all of its content.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function ready(fn) {
    if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    /* Header: solid background once the page scrolls */
    var header = $("[data-header]");
    function onScrollHeader() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 12); }
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });

    /* Scroll reveal: only for elements that start below the fold, so the first screen is always complete */
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      $$("[data-reveal]").forEach(function (el) {
        if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
          el.classList.add("will-reveal");
          io.observe(el);
        }
      });
    }

    /* Parallax on large images */
    var par = $$("[data-parallax]");
    if (!reduce && par.length) {
      var ticking = false;
      var update = function () {
        ticking = false;
        var vh = window.innerHeight;
        par.forEach(function (img) {
          var r = img.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height); // -0.5 .. 0.5
          img.style.transform = "translate3d(0," + (-p * 12 - 6).toFixed(2) + "%,0) scale(1.02)";
        });
      };
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener("resize", update);
      update();
    }

    /* Count-up for stats such as "0.46 lb" or "30M+" (text that doesn't start with a number is left alone) */
    var counters = $$("[data-count]");
    if (!reduce && counters.length && "IntersectionObserver" in window) {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          co.unobserve(e.target);
          var el = e.target, text = el.textContent.trim();
          var m = text.match(/^(\d+(?:\.\d+)?)(.*)$/);
          if (!m) return;
          var end = parseFloat(m[1]), dec = (m[1].split(".")[1] || "").length, rest = m[2], t0 = null;
          var step = function (t) {
            if (!t0) t0 = t;
            var k = Math.min(1, (t - t0) / 1400), eased = 1 - Math.pow(1 - k, 4);
            el.textContent = (end * eased).toFixed(dec) + rest;
            if (k < 1) requestAnimationFrame(step); else el.textContent = text;
          };
          requestAnimationFrame(step);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { co.observe(c); });
    }

    /* Projects index: filters + hover preview */
    var bar = $("[data-filters]");
    var rows = $$(".index-row");
    var panes = $$(".pv");
    function show(i) {
      rows.forEach(function (r) { r.classList.toggle("is-active", r.getAttribute("data-pv") === i); });
      panes.forEach(function (p) { p.hidden = p.getAttribute("data-pv") !== i; });
    }
    rows.forEach(function (r) {
      var i = r.getAttribute("data-pv");
      r.addEventListener("mouseenter", function () { show(i); });
      r.addEventListener("focusin", function () { show(i); });
    });
    if (rows.length) show(rows[0].getAttribute("data-pv"));
    if (bar) {
      var apply = function (f) {
        var btn = bar.querySelector('[data-filter="' + f + '"]') || bar.querySelector('[data-filter="all"]');
        f = btn.getAttribute("data-filter");
        $$("button", bar).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        var first = null;
        rows.forEach(function (r) {
          var hide = f !== "all" && r.getAttribute("data-category") !== f;
          r.hidden = hide;
          if (!hide && !first) first = r;
        });
        if (first) show(first.getAttribute("data-pv"));
      };
      bar.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-filter]");
        if (!b) return;
        var f = b.getAttribute("data-filter");
        apply(f);
        try { history.replaceState(null, "", f === "all" ? location.pathname : "#" + f); } catch (_) {}
      });
      if (location.hash) apply(location.hash.slice(1));
    }

    /* Lightbox for project photos */
    var dlg = $("[data-lightbox-dialog]");
    var links = $$("[data-lightbox]");
    if (dlg && links.length && typeof dlg.showModal === "function") {
      var img = $("img", dlg), cap = $("figcaption", dlg), count = $(".lb-count", dlg), cur = 0;
      var open = function (i) {
        cur = (i + links.length) % links.length;
        var a = links[cur], fig = a.closest("figure"), c = fig && $("figcaption", fig);
        img.src = a.getAttribute("href");
        img.alt = $("img", a).alt;
        cap.textContent = c ? c.textContent : "";
        count.textContent = (cur + 1) + " / " + links.length;
        if (!dlg.open) dlg.showModal();
      };
      links.forEach(function (a, i) {
        a.addEventListener("click", function (e) { e.preventDefault(); open(i); });
      });
      dlg.addEventListener("click", function (e) {
        var b = e.target.closest("[data-lb]");
        if (b) { var k = b.getAttribute("data-lb"); if (k === "close") dlg.close(); else open(cur + (k === "next" ? 1 : -1)); }
        else if (e.target === dlg) dlg.close();
      });
      dlg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") open(cur + 1);
        if (e.key === "ArrowLeft") open(cur - 1);
      });
      var x0 = null;
      dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      dlg.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1));
      });
    }

    /* Optional 3D model: loads the viewer only when asked */
    $$("[data-model-load]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var stage = btn.closest("[data-model]");
        btn.textContent = "Loading…"; btn.disabled = true;
        var mount = function () {
          var mv = document.createElement("model-viewer");
          mv.setAttribute("src", stage.getAttribute("data-model"));
          mv.setAttribute("camera-controls", "");
          mv.setAttribute("auto-rotate", "");
          mv.setAttribute("shadow-intensity", "0.6");
          mv.setAttribute("exposure", "1.1");
          mv.setAttribute("alt", "Interactive 3D model");
          stage.appendChild(mv);
          btn.hidden = true;
        };
        if (window.customElements && customElements.get("model-viewer")) return mount();
        var s = document.createElement("script");
        s.type = "module";
        s.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
        s.onload = mount;
        s.onerror = function () { btn.textContent = "3D viewer couldn't load"; };
        document.head.appendChild(s);
      });
    });
  });
})();
