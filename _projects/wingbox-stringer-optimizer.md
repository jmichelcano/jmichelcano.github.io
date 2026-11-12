---
title: Wingbox Stringer Optimizer
summary: For the WSU x Airbus AE 525 Wingbox Challenge, I wrote a MATLAB program that tested more than 30 million random stringer layouts to find the stiffest one. Our 0.46 lb balsa and basswood wingbox placed 4th of 18 teams.
category: school
status: complete
featured: 3
date: 2025-12-07
role: Primary programmer; proposed the MATLAB search approach; drafted the cross-section drawing
team: 4-person team (Group 9)
timeframe: Fall 2025 · AE 525
tools: [MATLAB, Fusion 360, SkyCiv, Balsa & basswood, Wood glue]
cover: team-wingbox.jpg
hero: cross-section-drawing.jpg
hero_style: drawing        # shows a white-background drawing as light lines on dark
hero_alt: Engineering drawing of the wingbox cross-section showing the front and rear spars, curved top skin, bottom skin, and four stringers on each skin.

highlights:
  - value: "4th"
    label: Of 18 teams, with the second-highest design score
  - value: "0.46 lb"
    label: Final weight, against a 1.00 lb limit
  - value: "19.70 lbf"
    label: Measured failure load (26.08 lbf predicted)
  - value: "30M+"
    label: Random stringer layouts evaluated

videos:
  - file: optimizer-run.mp4
    poster: optimizer-run-poster.jpg
    loop: true
    caption: My MATLAB program running, plotting each candidate stringer layout on the cross-section as it searches.
  - file: load-test.mp4
    poster: load-test-poster.jpg
    caption: Load test in the Flight Structures Lab. The root is potted and clamped, and the tip load P bends the box upward.

gallery:
  - file: team-wingbox.jpg
    caption: Group 9 with the finished wingbox before testing.
  - file: cross-section-drawing.jpg
    caption: Final cross-section. Four stringers on each skin, placed by the optimizer.
  - file: rib-layout.jpg
    caption: Fusion 360 model. 17 ribs, spaced 1.5 in at the fixed end and opening to 4 in toward the free end.
  - file: 01-materials-weighed.jpg
    caption: Every skin, spar, stringer, and rib weighed before assembly.
  - file: 02-rib-on-scale.jpg
    caption: A single lightened rib at 0.00285 lb.
  - file: 03-gluing-in-jig.jpg
    caption: Ribs and spars glued up in a clamped jig, with the skins and stringers laid out next to it.
  - file: 04-clamped-overnight.jpg
    caption: Bottom skin bonded under weighted boards and clamps.
  - file: 05-rib-skeleton.jpg
    caption: The rib and spar skeleton before the top skin went on.
  - file: 06-skinned-box.jpg
    caption: Skinned and labeled, with the four top stringers on the outside of the skin.
  - file: load-cases.jpg
    caption: The three required load cases. A 2 lb dead load Q at the trailing edge, plus a tip load P of 0 lbf, 20 lbf, and the maximum the box can carry.
  - file: skyciv-check.jpg
    caption: Moments of inertia checked independently in SkyCiv, for the curved top-skin arc and the full section.
  - file: 07-results-board.jpg
    caption: Predicted (blue) and measured (red) results for every team. Group 9 is the last row on the left.
  - file: results-chart.jpg
    caption: Final total scores for all 18 groups. Group 9 scored 223.32, fourth overall.
---

## The challenge

AE 525's wingbox contest, sponsored by Airbus: design and build the lightest semi-monocoque cantilevered wingbox that can handle bending and torsion. The box had a 47 in active length, had to weigh under 1.00 lb, and had to carry a 2 lb dead load plus at least 20 lbf at the tip before being loaded to failure. The materials were balsa and basswood. Eighteen teams were scored on design, measured performance, how well their predictions matched the test, and the written report.

## Finding the stringer layout

The scoring rubric favored exactly **8 stringers** and as few ribs as possible, and it penalized stacked or adjacent stringers. With the count fixed, the question was where to put them.

I proposed solving it by brute force in MATLAB and wrote the program. It placed the 8 stringers at random positions on the top and bottom skins, computed the section properties, and calculated tip deflection for each layout. After more than 30 million random layouts, we kept the one with the lowest deflection *w*. It splits the stringers four on top and four on the bottom, which raised bending stiffness without adding material.

The team then built three more programs on that layout:

- **Bending stress** in the skins and stringers, which set rib placement against skin buckling.
- **Angle of twist** *θ* under the offset dead load.
- **Predicted failure load**, checking every skin and stringer at the fixed end, where the bending moment is highest.

We modeled the section in Fusion 360 and checked the moments of inertia in SkyCiv.

## Building it

We weighed every part before assembly, glued the ribs and spars in a clamped jig, then bonded the skins and stringers. The finished box weighed 0.46 lb: 0.31 lb of wood plus 0.15 lb of glue.

## Result

We placed **4th of 18 teams** with a total score of 223.32, and earned the **second-highest design score** in the class (136.11).

| Measurement | Predicted | Measured |
|---|---|---|
| Tip deflection, Q = 2 lb only | −0.41 in | −0.63 in |
| Tip deflection, Q + P | 3.70 in | 5.76 in |
| Failure load P | 26.08 lbf | 19.70 lbf |

The box failed at 19.70 lbf, 25% below our prediction and just short of the 20 lbf target, and it deflected more than we predicted. Our analysis assumed perfect bonds between the skins, spars, and stringers and ignored glue and part imperfections. The test showed how much those assumptions matter in a glued wood structure. Next time I would build and test a short section early to measure real joint stiffness, and use it to calibrate the model.
