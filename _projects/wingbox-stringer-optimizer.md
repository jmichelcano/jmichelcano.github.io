---
title: Wingbox Stringer Optimizer
summary: For the WSU x Airbus AE 525 Wingbox Challenge, I wrote a MATLAB program that tested more than 30 million random stringer layouts to find the stiffest one. Our 0.46 lb wingbox predicted a 26.08 lbf failure load against a 20 lbf requirement.
category: school
status: complete
featured: 4
date: 2025-12-07
role: Wrote the stringer-placement program; drafted the cross-section drawing   # CONFIRM
team: 3-person team (Group 9)
timeframe: Fall 2025 · AE 525
tools: [MATLAB, Fusion 360, SkyCiv]
cover: rib-layout.jpg
hero: cross-section-drawing.jpg
hero_style: drawing        # shows a white-background drawing as light lines on dark
hero_alt: Engineering drawing of the wingbox cross-section showing the front and rear spars, curved top skin, bottom skin, and four stringers on each skin.

highlights:
  - value: "0.46 lb"
    label: Final weight, against a 1.00 lb limit
  - value: "26.08 lbf"
    label: Predicted failure load, against a 20 lbf minimum
  - value: "30M+"
    label: Random stringer layouts evaluated

gallery:
  - file: cross-section-drawing.jpg
    caption: Final cross-section. Four stringers on each skin, placed by the optimizer.
  - file: rib-layout.jpg
    caption: Fusion 360 model. 17 ribs, spaced 1.5 in at the fixed end and opening to 4 in toward the free end.
  - file: load-cases.jpg
    caption: The three required load cases. A 2 lb dead load Q at the trailing edge, plus a tip load P of 0 lbf, 20 lbf, and the maximum the box can carry.
  - file: skyciv-check.jpg
    caption: Moments of inertia checked independently in SkyCiv, for the curved top-skin arc and the full section.
---

## The challenge

AE 525's wingbox challenge, run with Airbus: design and build the lightest semi-monocoque cantilevered wingbox that can handle bending and torsion. The box had to weigh under 1.00 lb, carry a 2 lb dead load plus at least 20 lbf at the tip, and then be loaded to failure. The materials were balsa and basswood.

## Finding the stringer layout

The scoring rubric favored exactly **8 stringers** and as few ribs as possible, and it penalized stacked or adjacent stringers. With the count fixed, the question was where to put them.

I wrote a MATLAB program that placed the 8 stringers at random positions on the top and bottom skins, computed the section properties, and calculated tip deflection for each layout. After more than 30 million random layouts, we kept the one with the lowest deflection *w*. It splits the stringers four on top and four on the bottom, which raised bending stiffness without adding material.

The team then built three more programs on that layout:

- **Bending stress** in the skins and stringers, which set rib placement against skin buckling.
- **Angle of twist** *θ* under the offset dead load.
- **Predicted failure load**, checking every skin and stringer at the fixed end, where the bending moment is highest.

We modeled the section in Fusion 360 and checked the moments of inertia in SkyCiv.

## Result

| Load case (Q = 2 lb) | Tip deflection *w* | Twist *θ* |
|---|---|---|
| P = 0 | −0.41 in | 0.2° |
| P = 20 lbf | 3.70 in | 2.4° |
| P = 26.08 lbf (predicted failure) | 4.95 in | 3.1° |

- **Weight:** 0.46 lb assembled, under the 1.00 lb limit. That is 0.31 lb of parts plus 0.15 lb of adhesive.
- **Predicted failure:** 26.08 lbf, when a top-skin basswood stringer reaches its compression limit.
- **Ribs:** 17, packed tighter near the fixed end to resist skin buckling and spaced wider toward the tip to save weight.

<!-- TODO: if the box was tested to failure, add the actual failure load and how it compared with the 26.08 lbf prediction. -->
