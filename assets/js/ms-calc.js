// Interactive fastener margin-of-safety example (14 CFR 25.561 / 25.625).
// Illustrative only: allowables come from simple material values, not published tables.
(function () {
  "use strict";
  var root = document.querySelector("[data-calc]");
  if (!root) return;

  var FF = 1.15;              // fitting factor, 14 CFR 25.625
  var FSU = 75000;            // psi, AN alloy-steel bolt shear ultimate (illustrative)
  var FTU = 125000;           // psi, bolt tensile ultimate (illustrative)
  var FBRU = 131000;          // psi, 2024-T3 sheet bearing ultimate at e/D = 2.0 (assumed)
  var BOLTS = {
    AN3: { d: 0.190, as: 0.0200, name: "AN3" },  // #10-32 UNF tensile stress area
    AN4: { d: 0.250, as: 0.0364, name: "AN4" }   // 1/4-28 UNF tensile stress area
  };
  var CASES = [
    { id: "fwd",  name: "Forward",  g: 9.0, kind: "lateral", axis: "x" },
    { id: "aft",  name: "Rearward", g: 1.5, kind: "lateral", axis: "x" },
    { id: "side", name: "Sideward", g: 3.0, kind: "lateral", axis: "y" },
    { id: "up",   name: "Upward",   g: 3.0, kind: "up" },
    { id: "down", name: "Downward", g: 6.0, kind: "down" }
  ];

  var $ = function (s) { return root.querySelector(s); };
  var inputs = { w: $("#c-w"), h: $("#c-h"), lx: $("#c-lx"), ly: $("#c-ly"), k: $("#c-k"), d: $("#c-d"), t: $("#c-t") };
  var selected = "fwd";

  function fmt(x, dp) { return x.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function ms(x) { return (x >= 0 ? "+" : "") + fmt(x, 2); }

  function read() {
    return {
      W: +inputs.w.value, h: +inputs.h.value, Lx: +inputs.lx.value, Ly: +inputs.ly.value,
      k: +inputs.k.value, bolt: BOLTS[inputs.d.value], t: +inputs.t.value
    };
  }

  function solve(p) {
    var n = 2 * p.k;
    var d = p.bolt.d;
    var boltShear = FSU * Math.PI * d * d / 4;
    var bearing = FBRU * d * p.t;
    var Ps = Math.min(boltShear, bearing);
    var Pt = FTU * p.bolt.as;
    // Pattern: 2 rows at x = ±Lx/2, k fasteners per row spread evenly across Ly.
    var sumX2 = n * Math.pow(p.Lx / 2, 2);
    var ys = [];
    for (var i = 0; i < p.k; i++) ys.push(-p.Ly / 2 + i * p.Ly / (p.k - 1));
    var sumY2 = 0; ys.forEach(function (y) { sumY2 += 2 * y * y; });

    var rows = CASES.map(function (c) {
      var F = c.g * p.W, V = 0, T = 0, M = 0, c_ = 0, sum = 0;
      if (c.kind === "lateral") {
        V = F / n; M = F * p.h;
        if (c.axis === "x") { c_ = p.Lx / 2; sum = sumX2; } else { c_ = p.Ly / 2; sum = sumY2; }
        T = M * c_ / sum;
      } else if (c.kind === "up") {
        T = F / n;
      }
      var Vd = V * FF, Td = T * FF, MS = null, check = "";
      if (c.kind === "down") { check = "Bears on floor"; }
      else if (V > 0 && T > 0) {
        var Rs = Vd / Ps, Rt = Td / Pt;
        MS = 1 / Math.sqrt(Rs * Rs + Rt * Rt) - 1; check = "Shear + tension";
      } else if (T > 0) { MS = Pt / Td - 1; check = "Tension"; }
      else { MS = Ps / Vd - 1; check = "Shear"; }
      return { c: c, F: F, V: V, T: T, M: M, cmax: c_, sum: sum, Vd: Vd, Td: Td, MS: MS, check: check };
    });
    return { n: n, Ps: Ps, Pt: Pt, boltShear: boltShear, bearing: bearing, sumX2: sumX2, sumY2: sumY2, rows: rows };
  }

  function renderTable(r) {
    var minRow = null;
    r.rows.forEach(function (x) { if (x.MS !== null && (!minRow || x.MS < minRow.MS)) minRow = x; });
    var html = r.rows.map(function (x) {
      var cls = x.c.id === selected ? " is-selected" : "";
      var msCell = x.MS === null ? '<span class="ms-na">n/a</span>'
        : '<span class="ms ' + (x.MS >= 0 ? "ms-ok" : "ms-bad") + '">' + ms(x.MS) + "</span>";
      return '<tr class="calc-tr' + cls + '" data-case="' + x.c.id + '" tabindex="0">' +
        "<td>" + x.c.name + " " + fmt(x.c.g, 1) + "g" + (minRow && x === minRow ? ' <span class="gov">governs</span>' : "") + "</td>" +
        "<td>" + fmt(x.F, 0) + " lb</td>" +
        "<td>" + (x.V ? fmt(x.V, 1) + " lb" : "–") + "</td>" +
        "<td>" + (x.T ? fmt(x.T, 1) + " lb" : "–") + "</td>" +
        "<td>" + x.check + "</td><td>" + msCell + "</td></tr>";
    }).join("");
    $("[data-rows]").innerHTML = html;
    var min = $("[data-min]");
    min.textContent = ms(minRow.MS);
    min.className = "calc-min-value " + (minRow.MS >= 0 ? "ms-ok" : "ms-bad");
    $("[data-min-note]").textContent = minRow.MS >= 0
      ? "Governed by the " + minRow.c.name.toLowerCase() + " " + fmt(minRow.c.g, 1) + "g case. Positive margin, so the installation passes."
      : "Negative margin in the " + minRow.c.name.toLowerCase() + " case. Add fasteners, spread them out, or use a thicker sheet.";
  }

  function renderWork(p, r) {
    var x = r.rows.filter(function (y) { return y.c.id === selected; })[0];
    var lines = [];
    lines.push("<p><strong>" + x.c.name + " " + fmt(x.c.g, 1) + "g</strong>, with n = " + r.n + " " + p.bolt.name + " fasteners in " + fmt(p.t, 3) + " in sheet.</p>");
    lines.push('<ol class="work-steps">');
    lines.push("<li>Inertia load: F = " + fmt(x.c.g, 1) + " × " + fmt(p.W, 0) + " lb = <b>" + fmt(x.F, 0) + " lb</b></li>");
    if (x.c.kind === "down") {
      lines.push("<li>The item pushes straight down onto the floor structure through the bracket base. The fasteners carry no load in this case. The floor and bracket in bearing would be checked separately.</li>");
    } else {
      if (x.c.kind === "lateral") {
        var axis = x.c.axis === "x" ? "x" : "y";
        lines.push("<li>Shear per fastener: V = F / n = " + fmt(x.F, 0) + " / " + r.n + " = <b>" + fmt(x.V, 1) + " lb</b></li>");
        lines.push("<li>Overturning moment: M = F × h = " + fmt(x.F, 0) + " × " + fmt(p.h, 1) + " = <b>" + fmt(x.M, 0) + " in·lb</b></li>");
        lines.push("<li>Tension in the outer fasteners: T = M · c / Σc² = " + fmt(x.M, 0) + " × " + fmt(x.cmax, 2) + " / " + fmt(x.sum, 2) + " = <b>" + fmt(x.T, 1) + " lb</b> (c measured in " + axis + ")</li>");
      } else {
        lines.push("<li>Direct tension per fastener: T = F / n = " + fmt(x.F, 0) + " / " + r.n + " = <b>" + fmt(x.T, 1) + " lb</b></li>");
      }
      lines.push("<li>Design loads with the 1.15 fitting factor: " +
        (x.V ? "V<sub>d</sub> = " + fmt(x.Vd, 1) + " lb, " : "") + "T<sub>d</sub> = " + fmt(x.Td, 1) + " lb</li>");
      lines.push("<li>Allowables per fastener: shear P<sub>s</sub> = min(bolt shear " + fmt(r.boltShear, 0) + " lb, sheet bearing " + fmt(r.bearing, 0) + " lb) = <b>" + fmt(r.Ps, 0) + " lb</b>" +
        (r.bearing < r.boltShear ? " (sheet bearing governs)" : " (bolt shear governs)") + "; tension P<sub>t</sub> = <b>" + fmt(r.Pt, 0) + " lb</b></li>");
      if (x.V && x.T) {
        var Rs = x.Vd / r.Ps, Rt = x.Td / r.Pt;
        lines.push("<li>Interaction: R<sub>s</sub> = " + fmt(Rs, 3) + ", R<sub>t</sub> = " + fmt(Rt, 3) + ", so MS = 1 / √(R<sub>s</sub>² + R<sub>t</sub>²) − 1 = <b class=\"" + (x.MS >= 0 ? "ms-ok" : "ms-bad") + "\">" + ms(x.MS) + "</b></li>");
      } else {
        lines.push("<li>MS = P<sub>t</sub> / T<sub>d</sub> − 1 = <b class=\"" + (x.MS >= 0 ? "ms-ok" : "ms-bad") + "\">" + ms(x.MS) + "</b></li>");
      }
    }
    lines.push("</ol>");
    $("[data-work]").innerHTML = lines.join("");
  }

  // ── Diagram ──────────────────────────────────────────
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text != null) e.textContent = text;
    return e;
  }
  function arrow(g, x1, y1, x2, y2, cls) {
    g.appendChild(el("line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": cls, "marker-end": "url(#ah-" + cls + ")" }));
  }

  function renderSvg(p, r) {
    var g = root.querySelector("[data-svg]");
    while (g.firstChild) g.removeChild(g.firstChild);
    var x = r.rows.filter(function (y) { return y.c.id === selected; })[0];
    var endView = x.c.id === "side";
    var span = endView ? p.Ly : p.Lx;

    var defs = el("defs", {});
    ["load", "react"].forEach(function (c) {
      var m = el("marker", { id: "ah-" + c, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      m.appendChild(el("path", { d: "M0,0 L10,5 L0,10 z", "class": "ah-" + c }));
      defs.appendChild(m);
    });
    g.appendChild(defs);

    // Geometry (inches): tray flange spans the fastener pattern plus edge margin;
    // the unit sits between the fastener rows; its CG is at height h.
    var edge = 0.75;
    var flangeHalf = span / 2 + edge;
    var unitHalf = Math.max(span / 2 - 0.55, 0.9);
    var unitH = Math.max(p.h * 1.6, p.h + 2);
    var legH = Math.min(1.5, unitH * 0.4);
    var floorY = 218, cx = 270;
    var s = Math.min(330 / (2 * flangeHalf), 158 / (unitH + 0.3), 26);
    var plateT = 5;
    var baseY = floorY - plateT;
    var X = function (u) { return cx + u * s; };
    var Y = function (z) { return baseY - z * s; };

    // floor structure
    g.appendChild(el("rect", { x: 40, y: floorY, width: 440, height: 14, "class": "sv-floor" }));
    for (var hx = 44; hx < 480; hx += 14) g.appendChild(el("line", { x1: hx, y1: floorY + 14, x2: hx - 10, y2: floorY + 26, "class": "sv-hatch" }));
    g.appendChild(el("text", { x: 44, y: floorY + 42, "class": "sv-label" }, "Floor structure"));

    // tray: base flange + upturned angle legs hugging the unit
    g.appendChild(el("rect", { x: X(-flangeHalf), y: baseY, width: 2 * flangeHalf * s, height: plateT, "class": "sv-plate" }));
    [-1, 1].forEach(function (sd) {
      var lx = sd < 0 ? X(-unitHalf) - 4 : X(unitHalf);
      g.appendChild(el("rect", { x: lx, y: Y(legH), width: 4, height: legH * s, "class": "sv-plate" }));
    });

    // the unit
    var ux = X(-unitHalf), uy = Y(unitH), uw = 2 * unitHalf * s, uh = unitH * s;
    g.appendChild(el("rect", { x: ux, y: uy, width: uw, height: uh, rx: 5, "class": "sv-item" }));
    var slots = Math.min(5, Math.floor(uh / 14));
    for (var i = 0; i < slots; i++) {
      g.appendChild(el("line", { x1: ux + uw * 0.22, y1: uy + 12 + i * 6, x2: ux + uw * 0.78, y2: uy + 12 + i * 6, "class": "sv-detail" }));
    }
    if (endView) {
      g.appendChild(el("rect", { x: ux + uw * 0.18, y: uy + uh * 0.42, width: uw * 0.64, height: uh * 0.2, rx: 2, "class": "sv-screen" }));
    } else {
      g.appendChild(el("rect", { x: ux - 6, y: uy + uh * 0.35, width: 6, height: uh * 0.22, rx: 2, "class": "sv-detail-fill" })); // front handle
      g.appendChild(el("rect", { x: ux + uw, y: uy + uh * 0.55, width: 7, height: 12, "class": "sv-detail-fill" }));          // aft connector
    }
    g.appendChild(el("text", { x: 40, y: 46, "class": "sv-label" }, endView ? "End view, looking forward" : "Side view, nose left"));

    // fasteners through the flange
    var pos = [];
    if (endView) { for (var k = 0; k < p.k; k++) pos.push(-p.Ly / 2 + k * p.Ly / (p.k - 1)); }
    else pos = [-p.Lx / 2, p.Lx / 2];
    pos.forEach(function (u) {
      var px = X(u), tension = false;
      if (x.c.id === "fwd") tension = u > 0;
      if (x.c.id === "aft") tension = u < 0;
      if (x.c.id === "side") tension = u < -1e-9;
      if (x.c.id === "up") tension = true;
      g.appendChild(el("rect", { x: px - 5, y: baseY - 4, width: 10, height: 4, "class": tension ? "sv-bolt sv-bolt-t" : "sv-bolt" }));
      g.appendChild(el("rect", { x: px - 2.5, y: baseY, width: 5, height: plateT + 18, "class": tension ? "sv-bolt sv-bolt-t" : "sv-bolt" }));
      if (tension) arrow(g, px, floorY + 34, px, floorY + 58, "react");
    });

    // CG + h dimension
    var cgY = Y(p.h);
    g.appendChild(el("circle", { cx: cx, cy: cgY, r: 6, "class": "sv-cg" }));
    g.appendChild(el("text", { x: cx - 10, y: cgY + 20, "text-anchor": "end", "class": "sv-label" }, "CG"));
    var dimX = X(flangeHalf) + 18;
    g.appendChild(el("line", { x1: dimX, y1: cgY, x2: dimX, y2: baseY, "class": "sv-dim" }));
    g.appendChild(el("line", { x1: cx, y1: cgY, x2: dimX + 4, y2: cgY, "class": "sv-ext" }));
    g.appendChild(el("text", { x: dimX + 6, y: (cgY + baseY) / 2 + 4, "class": "sv-label" }, "h = " + fmt(p.h, 1) + " in"));
    var dY = floorY + 84, a = X(pos[0]), b = X(pos[pos.length - 1]);
    g.appendChild(el("line", { x1: a, y1: dY, x2: b, y2: dY, "class": "sv-dim" }));
    [a, b].forEach(function (q) { g.appendChild(el("line", { x1: q, y1: dY - 5, x2: q, y2: dY + 5, "class": "sv-dim" })); });
    g.appendChild(el("text", { x: (a + b) / 2, y: dY - 8, "text-anchor": "middle", "class": "sv-label" }, (endView ? "Ly = " : "Lx = ") + fmt(span, 1) + " in"));

    // load arrow
    var L = 80, label = fmt(x.c.g, 1) + "g · W = " + fmt(x.F, 0) + " lb";
    if (x.c.id === "fwd") { arrow(g, cx - 10, cgY, cx - 10 - L, cgY, "load"); g.appendChild(el("text", { x: cx - 14, y: cgY - 12, "text-anchor": "end", "class": "sv-load-t" }, label)); }
    if (x.c.id === "aft" || x.c.id === "side") { arrow(g, cx + 10, cgY, cx + 10 + L, cgY, "load"); g.appendChild(el("text", { x: cx + 14, y: cgY - 12, "class": "sv-load-t" }, label)); }
    if (x.c.id === "up") { arrow(g, cx, cgY - 10, cx, Math.max(cgY - 10 - L, 16), "load"); g.appendChild(el("text", { x: cx + 12, y: Math.max(cgY - 40, 30), "class": "sv-load-t" }, label)); }
    if (x.c.id === "down") { arrow(g, cx, cgY + 10, cx, Math.min(cgY + 10 + L, baseY - 8), "load"); g.appendChild(el("text", { x: cx - 14, y: cgY + 52, "text-anchor": "end", "class": "sv-load-t" }, label)); }

    g.appendChild(el("rect", { x: 40, y: 18, width: 10, height: 10, "class": "sv-bolt sv-bolt-t" }));
    g.appendChild(el("text", { x: 56, y: 27, "class": "sv-label" }, "Fasteners in tension"));
  }

  function renderNarrative(p, r) {
    var x = r.rows.filter(function (y) { return y.c.id === selected; })[0];
    var n = r.n, bolt = p.bolt.name, dir = x.c.name.toLowerCase();
    var out = "Under the " + fmt(x.c.g, 1) + "g " + dir + " emergency-landing condition of 14 CFR 25.561, the " + fmt(p.W, 0) +
      " lb unit produces a " + fmt(x.F, 0) + " lb inertia load at its CG, " + fmt(p.h, 1) + " in above the floor. ";
    if (x.c.kind === "down") {
      out += "The load passes from the unit into the tray and bears directly on the floor structure through the tray base. The " + n + " " + bolt +
        " fasteners carry no load in this condition. The tray and floor would be checked in bearing separately.";
    } else if (x.c.kind === "up") {
      out += "The load passes from the unit into the tray and is reacted as direct tension shared equally by all " + n + " " + bolt +
        " fasteners, " + fmt(x.T, 1) + " lb each.";
    } else {
      var side = x.c.id === "fwd" ? "aft row of fasteners" : x.c.id === "aft" ? "forward row of fasteners" : "fasteners along the left edge";
      out += "The load passes from the unit into the tray and is reacted in shear by all " + n + " " + bolt + " fasteners, " + fmt(x.V, 1) +
        " lb each. Because the CG sits above the floor, the load also creates a " + fmt(x.M, 0) +
        " in·lb overturning moment. The " + side + " reacts it in tension, " + fmt(x.T, 1) +
        " lb on the most heavily loaded fastener, while the opposite edge of the tray bears on the floor.";
    }
    if (x.MS !== null) {
      var gov = r.bearing < r.boltShear ? " Sheet bearing governs the shear allowable." : "";
      out += " With the 1.15 fitting factor of 25.625, the critical fastener " + (x.V && x.T ? "sees combined shear and tension and " : "") +
        "has a margin of safety of <b class=\"" + (x.MS >= 0 ? "ms-ok" : "ms-bad") + "\">" + ms(x.MS) + "</b>." +
        (x.V ? gov : "") +
        (x.MS >= 0 ? " The installation is adequate for this condition." : " The installation is not adequate for this condition and needs more fasteners, a wider pattern, or thicker sheet.");
    }
    root.querySelector("[data-narrative]").innerHTML = out;
  }

  function update() {
    var p = read();
    $("#o-w").textContent = fmt(p.W, 0) + " lb";
    $("#o-h").textContent = fmt(p.h, 1) + " in";
    $("#o-lx").textContent = fmt(p.Lx, 1) + " in";
    $("#o-ly").textContent = fmt(p.Ly, 1) + " in";
    var r = solve(p);
    renderTable(r); renderWork(p, r); renderSvg(p, r); renderNarrative(p, r);
  }

  function select(id) {
    selected = id;
    root.querySelectorAll("[role=tab]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-case") === id)); });
    update();
  }

  Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener("input", update); });
  root.querySelector(".calc-tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-case]"); if (b) select(b.getAttribute("data-case"));
  });
  root.querySelector("[data-rows]").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-case]"); if (tr) select(tr.getAttribute("data-case"));
  });
  root.querySelector("[data-rows]").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var tr = e.target.closest("tr[data-case]"); if (tr) { e.preventDefault(); select(tr.getAttribute("data-case")); }
  });
  update();
})();
