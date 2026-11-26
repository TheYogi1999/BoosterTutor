# Additional avatars and consistent scene depth — v0.105

## Avatar roster

Added four cosmetic player choices from the existing original `assets/portraits/walkers.webp` illustration sheet:

| Name | Saved ID | Sheet position |
| --- | --- | --- |
| Grove Sage | `sage` | middle row, middle column |
| Astral Seer | `seer` | middle row, right column |
| Rune Knight | `runeknight` | bottom row, left column |
| Wild Shaman | `shaman` | bottom row, middle column |

There are now eight unique player portraits. Existing avatar IDs and saved selections remain valid. New IDs are registered in the initial roster before reading localStorage, so they survive page reloads and work on the battlefield. The choice has no stat or gameplay effect. Options retains a responsive grid with large touch targets, including short phones and the battle settings window. It uses the existing artwork without adding image downloads.

## Vortex alignment and title rain

The title camera uses the fan’s rendered bounding rectangle relative to the canvas. This includes its CSS `translateY(-50%)`, which `offsetTop` omitted; the old calculation displaced the vortex below the visible cards on landscape layouts. A point at 50% of fan width and 44% of height centers the effect on the visible three-card group. Projection stays uniform, with the existing capped device-pixel ratio.

The MTG-backed card rain begins after 3.25 seconds of visible intro time, after the vortex cards and reveal shine finish. It stays in a separate inert layer below the atmosphere canvas, three-card fan and menu. Title cards have MTG backs on both faces, a darkened image treatment and a smaller size on narrow screens. Resizing adjusts their dimensions without restarting their fall/flip phases. It never delays Play or any menu action.

Hidden tabs pause the existing rain; returning resumes it. Leaving the title or restarting the intro removes it. Reduced motion removes the title rain and displays the existing still composition. Both the media-change handler and render-loop guard perform cleanup. Leaving the title clears the complete canvas backing surface, including ultrawide and high-DPI dimensions.

## One depth model for falling cards

`card-rain.js` supplies both title and receipt layers. Each of twelve cards gets a unique, shuffled depth stratum. A single normalized depth drives:

- nominal width: 64–112 pixels before the title’s responsive scale;
- Z: −300 to +40, under the common 1200-pixel scene perspective;
- paint layer: 1–12, farthest first;
- a generally faster fall for nearer cards, with varied 12–22 second loops.

Widths and Z grow together, so projected width `width / (1 - Z / 1200)` also grows. Cards are appended in far-to-near DOM order and receive explicit matching z-index values. Large foreground cards therefore occlude the smaller distant cards; independent random widths can no longer invert the intended perspective. Flip orientation still changes an individual card’s apparent width naturally without changing its depth layer.

Front/back faces remain opaque and retain 3D flips, edge thickness, drift and shine. Receipt fronts still use artwork from the run deck. The rain stays behind the receipt UI and cannot intercept Continue. The fall endpoint follows usable scene height. Seeded decorative randomness never consumes gameplay `Math.random`.

## Validation

```sh
node --test tests/card-rain.test.cjs
node tests/depth-scenes-browser.test.cjs
node tests/title-intro-browser.test.cjs
node tests/fitted-stops-browser.test.cjs
```

Four mathematical property tests cover 200 seeds and three scales, including 7,200 card profiles, unique depth strata, strictly ordered widths/Z/projected sizes/layers, bounded animation timing, shuffled horizontal placement and independence from gameplay randomness.

The new browser flow covers vortex placement at seven viewport sizes; rain gating and layering; MTG backs; portrait resizing; hidden/reduced-motion/re-entry cleanup; all eight portrait choices; saved selection and actual battle use; settings touch targets; receipt ordering at three sizes; and an independent `elementsFromPoint` check that twelve overlapping cards really paint from largest/nearest to smallest/farthest. Existing intro checks cover early menu actions, four layouts, pause/resume and canvas cleanup. Ten fitted-stop cases verify no-scroll shop/receipt layouts and usable Continue.
