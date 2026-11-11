// Home-page hero: a to-scale wireframe of the AE 525 wingbox (Group 9, Fall 2025).
// Dimensions in inches, from the cross-section drawing and rib table.
// Requires three.js r128 (loaded before this file). Fails quietly without WebGL.
(function () {
  "use strict";
  function start() {
    var canvas = document.querySelector("[data-wingbox]");
    if (!canvas || !window.THREE) return;
    var THREE = window.THREE;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

    /* ── Cross-section (chordwise y, vertical z) ── */
    var FRONT_H = 1.04, REAR_H = 0.71, CHORD = 3.625, R = 10.02;
    // Top skin: circular arc of radius R from the front-spar top to the rear-spar top, bulging upward.
    var ax = 0, az = FRONT_H, bx = CHORD, bz = REAR_H;
    var mx = (ax + bx) / 2, mz = (az + bz) / 2;
    var dx = bx - ax, dz = bz - az, c = Math.hypot(dx, dz);
    var nx = -dz / c, nz = dx / c;                 // unit normal pointing up
    var h = Math.sqrt(R * R - (c / 2) * (c / 2));
    var cx = mx - nx * h, cz = mz - nz * h;        // arc centre below the chord
    var a0 = Math.atan2(az - cz, ax - cx), a1 = Math.atan2(bz - cz, bx - cx);
    function topZ(y) { return cz + Math.sqrt(R * R - (y - cx) * (y - cx)); }

    var section = [[0, 0], [0, FRONT_H]];
    var ARC_N = 28;
    for (var i = 1; i < ARC_N; i++) {
      var a = a0 + (a1 - a0) * (i / ARC_N);
      section.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]);
    }
    section.push([CHORD, REAR_H], [CHORD, 0]);

    /* Rib stations from the fixed end: 6 @ 1.5, 4 @ 2, 1 @ 2.5, 1 @ 3.5, 5 @ 4 */
    var spacing = [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2, 2, 2, 2, 2.5, 3.5, 4, 4, 4, 4, 4];
    var ribs = [], s = 0;
    spacing.forEach(function (d) { s += d; ribs.push(s); });
    var SPAN = s; // 43 in

    var group = new THREE.Group();
    scene.add(group);

    var white = new THREE.Color("#eef1f3"), orange = new THREE.Color("#ff4f00");
    function mat(color, opacity) { return new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }); }
    // three.js: x = span, y = vertical, z = chordwise
    function loop(x, material) {
      var pts = section.map(function (p) { return new THREE.Vector3(x, p[1], p[0]); });
      return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), material);
    }
    function line(y, z, material, x0, x1) {
      var g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0 || 0, y, z), new THREE.Vector3(x1 || SPAN, y, z)]);
      return new THREE.Line(g, material);
    }

    // End sections
    group.add(loop(0, mat(white, 0.95)));
    group.add(loop(SPAN, mat(white, 0.7)));

    // Ribs, drawn in from root to tip on load
    var ribMats = [];
    ribs.slice(0, -1).forEach(function (x) {
      var m = mat(orange, reduce ? 0.85 : 0);
      ribMats.push(m);
      group.add(loop(x, m));
    });

    // Spar caps / skin corners
    var edge = mat(white, 0.55);
    [[0, 0], [FRONT_H, 0], [REAR_H, CHORD], [0, CHORD]].forEach(function (p) { group.add(line(p[0], p[1], edge)); });
    // Faint skin lines along the arc
    var skin = mat(white, 0.12);
    for (var k = 4; k < section.length - 3; k += 4) group.add(line(section[k][1], section[k][0], skin));
    for (var b = 0.5; b < CHORD; b += 0.75) group.add(line(0, b, skin));

    // Stringers: 4 under the top skin, 4 on the bottom skin (positions from the front spar)
    var str = mat(white, 0.8);
    [0.4, 0.78, 1.06, 1.31].forEach(function (y) { group.add(line(topZ(y) - 0.07, y, str)); });
    [0.24, 0.68, 1.01, 1.44].forEach(function (y) { group.add(line(0.07, y, str)); });

    // Fixed-end mount marker
    var mount = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 4.4), new THREE.MeshBasicMaterial({ color: orange, transparent: true, opacity: 0.18 }));
    mount.position.set(-0.1, 0.5, CHORD / 2);
    group.add(mount);

    // Centre the beam
    group.position.set(-SPAN * 0.42, -0.5, -CHORD / 2);

    /* Camera framing */
    var target = new THREE.Vector3(0, 0, 0);
    var base = { r: 34, theta: -0.72, phi: 1.12 };
    var pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
    function resize() {
      var w = canvas.clientWidth, hgt = canvas.clientHeight;
      if (!w || !hgt) return;
      renderer.setSize(w, hgt, false);
      camera.aspect = w / hgt;
      // Narrow screens: pull back so the full span stays in view
      base.r = w < 720 ? 52 : 34;
      // Wide screens: slide the model right so it sits beside the headline, not behind the paragraph
      if (w >= 900) camera.setViewOffset(w, hgt, -w * 0.2, -hgt * 0.04, w, hgt);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    window.addEventListener("pointermove", function (e) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !reduce) requestAnimationFrame(frame); }).observe(canvas);
    }

    var t0 = performance.now();
    function place(t) {
      eased.x += (pointer.x - eased.x) * 0.04;
      eased.y += (pointer.y - eased.y) * 0.04;
      var drift = reduce ? 0 : Math.sin(t / 6000) * 0.12;
      var th = base.theta + drift + eased.x * 0.22;
      var ph = base.phi - eased.y * 0.1;
      camera.position.set(
        base.r * Math.sin(ph) * Math.sin(th) + 6,
        base.r * Math.cos(ph),
        base.r * Math.sin(ph) * Math.cos(th)
      );
      camera.lookAt(target.x + 6, target.y - 2.5, target.z);
    }
    function frame(now) {
      var t = now - t0;
      ribMats.forEach(function (m, i) {
        var k = Math.min(1, Math.max(0, (t - 300 - i * 70) / 500));
        m.opacity = 0.85 * k;
      });
      place(t);
      renderer.render(scene, camera);
      if (visible && !reduce) requestAnimationFrame(frame);
    }
    if (reduce) { place(0); renderer.render(scene, camera); }
    else requestAnimationFrame(frame);
  }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
