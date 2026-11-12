---
title: Certification Structures Example
summary: An interactive Part 25 emergency-landing check for an invented cabin installation, built the same way I write structural substantiation at JBDA. Change the inputs and the margins of safety update live.
category: work
status: complete
featured: 4
date: 2026-11-12
role: Author. Illustrative example, not client work
team: Solo
timeframe: "2026"
tools: [14 CFR 25.561, 14 CFR 25.625, Hand calculations, JavaScript]
cover: cover.jpg
hero_alt: Side-view diagram of an equipment unit on a bracket, with the forward 9g load arrow and the fasteners in tension highlighted.
scripts: [/assets/js/ms-calc.js]

highlights:
  - value: "5"
    label: Emergency-landing load cases from §25.561
  - value: "1.15"
    label: Fitting factor from §25.625
  - value: "MS ≥ 0"
    label: Every fastener, every load case
---

## Why this page exists

At J.B. Dwerlkotte Associates I write structural substantiation for FAA certification of business jet and turboprop modifications. That work belongs to the firm and its customers, so none of it appears here.

This page shows the same kind of analysis on an **invented installation**: a cabin equipment unit on a bracket, fastened to the floor structure. Every number is either made up or comes from public sources. It is **not client work** and not a certified design.

## Try it

<div class="calc" data-calc markdown="0">
  <div class="calc-inputs" role="group" aria-label="Installation inputs">
    <label class="calc-field"><span>Item weight, W</span><span class="calc-row"><input type="range" id="c-w" min="2" max="120" step="1" value="60"><output for="c-w" id="o-w">60 lb</output></span></label>
    <label class="calc-field"><span>CG height above the mounting surface, h</span><span class="calc-row"><input type="range" id="c-h" min="1" max="18" step="0.5" value="10"><output for="c-h" id="o-h">10 in</output></span></label>
    <label class="calc-field"><span>Fore–aft spacing between fastener rows, L<sub>x</sub></span><span class="calc-row"><input type="range" id="c-lx" min="2" max="14" step="0.5" value="3"><output for="c-lx" id="o-lx">3 in</output></span></label>
    <label class="calc-field"><span>Side-to-side spread of each row, L<sub>y</sub></span><span class="calc-row"><input type="range" id="c-ly" min="2" max="14" step="0.5" value="6"><output for="c-ly" id="o-ly">6 in</output></span></label>
    <div class="calc-selects">
      <label class="calc-field"><span>Fasteners per row</span><select id="c-k"><option value="2" selected>2 (4 total)</option><option value="3">3 (6 total)</option><option value="4">4 (8 total)</option></select></label>
      <label class="calc-field"><span>Fastener</span><select id="c-d"><option value="AN3" selected>AN3 (3/16 in)</option><option value="AN4">AN4 (1/4 in)</option></select></label>
      <label class="calc-field"><span>Sheet thickness, t</span><select id="c-t"><option value="0.032">0.032 in</option><option value="0.040" selected>0.040 in</option><option value="0.050">0.050 in</option><option value="0.063">0.063 in</option><option value="0.080">0.080 in</option></select></label>
    </div>
  </div>

  <div class="calc-figure">
    <div class="calc-tabs" role="tablist" aria-label="Load case shown in the diagram">
      <button type="button" role="tab" data-case="fwd" aria-selected="true">Forward 9.0g</button>
      <button type="button" role="tab" data-case="aft" aria-selected="false">Rearward 1.5g</button>
      <button type="button" role="tab" data-case="side" aria-selected="false">Sideward 3.0g</button>
      <button type="button" role="tab" data-case="up" aria-selected="false">Upward 3.0g</button>
      <button type="button" role="tab" data-case="down" aria-selected="false">Downward 6.0g</button>
    </div>
    <svg class="calc-svg" viewBox="0 0 520 320" role="img" aria-labelledby="calc-svg-title"><title id="calc-svg-title">Diagram of the installation under the selected load case</title><g data-svg></g></svg>
  </div>

  <div class="calc-results" aria-live="polite">
    <div class="calc-min">
      <p class="calc-min-label mono">Minimum margin of safety</p>
      <p class="calc-min-value" data-min>+0.00</p>
      <p class="calc-min-note" data-min-note>Governing case</p>
    </div>
    <div class="calc-table-wrap">
      <table class="calc-table">
        <thead><tr><th>Load case</th><th>Inertia load</th><th>Shear / fastener</th><th>Tension / fastener</th><th>Check</th><th>MS</th></tr></thead>
        <tbody data-rows></tbody>
      </table>
    </div>
  </div>

  <details class="calc-work" open>
    <summary>Show the work for the selected case</summary>
    <div data-work></div>
  </details>
</div>

## How the numbers work

1. **Loads.** 14 CFR 25.561 requires items of mass in the cabin to stay attached under emergency-landing ultimate inertia loads, applied one direction at a time: 9.0g forward, 1.5g rearward, 3.0g sideward, 3.0g upward, and 6.0g downward. Each load acts at the item's CG.
2. **Load path.** The inertia load goes from the CG, through the bracket, into the fasteners, and then into the floor structure. A load parallel to the floor puts every fastener in **shear**. Because the CG sits a height *h* above the floor, the same load also tries to tip the item over. That overturning moment puts the fasteners on one side in **tension**.
3. **Fastener loads.** Shear is shared equally: *V = F / n*. Tension from overturning uses the centroid method: *T = M · c / Σc²*, where *c* is each fastener's distance from the pattern's center. Upward load is direct tension, *T = F / n*. Downward load bears on the floor and doesn't load the fasteners.
4. **Factors.** Each fastener load is multiplied by the **1.15 fitting factor** from 14 CFR 25.625. The §25.561 loads are already ultimate, so no extra 1.5 factor applies.
5. **Margins of safety.** *MS = allowable ÷ design load − 1*. When a fastener sees both shear and tension, the check uses the interaction *R<sub>s</sub>² + R<sub>t</sub>² ≤ 1*, so *MS = 1 / √(R<sub>s</sub>² + R<sub>t</sub>²) − 1*. Every case has to come out at **MS ≥ 0**.

### Allowables used here

These are **illustrative**, so the math stays visible:

- **Bolt shear:** *F<sub>su</sub> × shank area*, with *F<sub>su</sub>* = 75 ksi for AN alloy-steel bolts.
- **Sheet bearing:** *F<sub>bru</sub> × d × t*, with an assumed *F<sub>bru</sub>* = 131 ksi for 2024-T3 sheet at an edge distance of 2*d*. The lower of bolt shear and sheet bearing governs.
- **Bolt tension:** *F<sub>tu</sub> × thread stress area*, with *F<sub>tu</sub>* = 125 ksi.

A real substantiation takes these from the published fastener specification and MMPDS for the actual material, thickness, and edge distance.

## What a real report also covers

This example checks only the fasteners. A real substantiation also checks:

- the bracket itself
- the floor beam or structure it attaches to
- fastener pull-through in thin sheet
- prying
- edge distance and spacing
- installation requirements

It also includes a written load-path narrative for each of those checks, and the DER reviews the whole report.
