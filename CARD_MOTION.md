# Card motion and player impact — v0.96

Dragged cards retain their printed 488:680 ratio, with a deeper two-layer shadow
and a small uniform lift. The visual card face is measured instead of its rotated
bounding box or surrounding controls. A capped, frame-smoothed tilt follows pointer
velocity in logical canvas units and decays back to neutral after movement stops.
The grip point stays at the pointer; position is never eased behind input. Foil
faces and their run-counter seals stay on the held card.

Landing recovers the card's unrotated viewport size and current angle, then uses
one uniform scale for its entire 280ms journey (220ms for rejected drops). The
same rule applies to Library/hand/graveyard flights. Their images use contain,
not fill. The old combination of rotated bounding sizes plus independent X/Y
scales stretched cards. Landing gleams now change brightness only, preserving
existing fan/tap transforms. Rejected cards return to their source without costs.
Logical casting and card moves remain immediate.

Player damage adds one short, decaying 200–260ms shake to the combat screen.
Strength depends on damage and is capped at six logical pixels. It leaves the
outer fitted canvas transform alone. Repeated hits replace, rather than stack,
the shake. Reduced motion keeps the damage number and disables tilt, flights and
shake. Prevented damage (including The One Ring) never starts impact feedback.

Drag frames, landing overlays, hidden destinations and hit motion clean up on
completion, cancelled pointer actions, Escape, lost focus, scene exit, hidden tabs,
resizing and motion-preference changes. Replaced destination nodes cannot leave
a ghost or a permanently invisible card.

Validation: real pointer input tests both tilt directions and settling, foil/counter
preservation, accepted/rejected drops, creature/artifact placement, matrix-based
uniform scale throughout landing, two canvas scales, immediate costs/zones, short
nonstacking actual-damage shake, Ring prevention, reduced motion and cancellation.
Existing zone/draw/graveyard and legendary-card browser checks also pass.
