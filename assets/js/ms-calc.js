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

    var floorY = 218, cx = 270;
    var boxW = span + 1.5, boxH = Math.max(2 * p.h, 1);
    var s = Math.min(300 / boxW, 160 / (boxH + 0.4), 40);
    var halfW = boxW * s / 2, plateT = 6;
    var boxTop = floorY - plateT - boxH * s;

    // floor structure
    g.appendChild(el("rect", { x: 40, y: floorY, width: 440, height: 14, "class": "sv-floor" }));
    for (var hx = 44; hx < 480; hx += 14) g.appendChild(el("line", { x1: hx, y1: floorY + 14, x2: hx - 10, y2: floorY + 26, "class": "sv-hatch" }));
    g.appendChild(el("text", { x: 44, y: floorY + 42, "class": "sv-label" }, "Floor structure"));
    // bracket base + item
    g.appendChild(el("rect", { x: cx - halfW - 0.4 * s, y: floorY - plateT, width: 2 * halfW + 0.8 * s, height: plateT, "class": "sv-plate" }));
    g.appendChild(el("rect", { x: cx - halfW, y: boxTop, width: 2 * halfW, height: boxH * s, "class": "sv-item" }));
    g.appendChild(el("text", { x: 40, y: 46, "class": "sv-label" }, endView ? "End view, looking forward" : "Side view, nose left"));

    // fasteners
    var pos = [];
    if (endView) { for (var i = 0; i < p.k; i++) pos.push(-p.Ly / 2 + i * p.Ly / (p.k - 1)); }
    else pos = [-p.Lx / 2, p.Lx / 2];
    pos.forEach(function (u) {
      var px = cx + u * s;
      var tension = false;
      if (x.c.id === "fwd") tension = u > 0;       // load toward the nose: aft row pulls
      if (x.c.id === "aft") tension = u < 0;
      if (x.c.id === "side") tension = u < -1e-9;  // load to the right: left side pulls
      if (x.c.id === "up") tension = true;
      g.appendChild(el("rect", { x: px - 3, y: floorY - plateT - 6, width: 6, height: plateT + 22, "class": tension ? "sv-bolt sv-bolt-t" : "sv-bolt" }));
      if (tension) arrow(g, px, floorY + 34, px, floorY + 58, "react");
    });

    // CG + h dimension
    var cgY = floorY - plateT - p.h * s;
    g.appendChild(el("circle", { cx: cx, cy: cgY, r: 6, "class": "sv-cg" }));
    g.appendChild(el("text", { x: cx - 10, y: cgY + 20, "text-anchor": "end", "class": "sv-label" }, "CG"));
    var dimX = cx + halfW + 22;
    g.appendChild(el("line", { x1: dimX, y1: cgY, x2: dimX, y2: floorY - plateT, "class": "sv-dim" }));
    g.appendChild(el("line", { x1: cx, y1: cgY, x2: dimX + 4, y2: cgY, "class": "sv-ext" }));
    g.appendChild(el("text", { x: dimX + 6, y: (cgY + floorY) / 2, "class": "sv-label" }, "h = " + fmt(p.h, 1) + " in"));
    // span dimension
    var dY = floorY + 84, a = cx + pos[0] * s, b = cx + pos[pos.length - 1] * s;
    g.appendChild(el("line", { x1: a, y1: dY, x2: b, y2: dY, "class": "sv-dim" }));
    g.appendChild(el("text", { x: (a + b) / 2, y: dY - 6, "text-anchor": "middle", "class": "sv-label" }, (endView ? "Ly = " : "Lx = ") + fmt(span, 1) + " in"));

    // load arrow
    var L = 80, label = fmt(x.c.g, 1) + "g · W = " + fmt(x.F, 0) + " lb";
    if (x.c.id === "fwd") { arrow(g, cx - 10, cgY, cx - 10 - L, cgY, "load"); g.appendChild(el("text", { x: cx - 14, y: cgY - 12, "text-anchor": "end", "class": "sv-load-t" }, label)); }
    if (x.c.id === "aft" || x.c.id === "side") { arrow(g, cx + 10, cgY, cx + 10 + L, cgY, "load"); g.appendChild(el("text", { x: cx + 14, y: cgY - 12, "class": "sv-load-t" }, label)); }
    if (x.c.id === "up") { arrow(g, cx, cgY - 10, cx, Math.max(cgY - 10 - L, 16), "load"); g.appendChild(el("text", { x: cx + 12, y: Math.max(cgY - 40, 30), "class": "sv-load-t" }, label)); }
    if (x.c.id === "down") { arrow(g, cx, cgY + 10, cx, Math.min(cgY + 10 + L, floorY - 14), "load"); g.appendChild(el("text", { x: cx - 14, y: cgY + 52, "text-anchor": "end", "class": "sv-load-t" }, label)); }

    // legend
    g.appendChild(el("rect", { x: 40, y: 18, width: 10, height: 10, "class": "sv-bolt sv-bolt-t" }));
    g.appendChild(el("text", { x: 56, y: 27, "class": "sv-label" }, "Fasteners in tension"));
  }

  function update() {
    var p = read();
    $("#o-w").textContent = fmt(p.W, 0) + " lb";
    $("#o-h").textContent = fmt(p.h, 1) + " in";
    $("#o-lx").textContent = fmt(p.Lx, 1) + " in";
    $("#o-ly").textContent = fmt(p.Ly, 1) + " in";
    var r = solve(p);
    renderTable(r); renderWork(p, r); renderSvg(p, r);
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
