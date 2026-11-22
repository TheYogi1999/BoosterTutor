# Compact booster view and safe device area — v0.102

Landscape booster choices always use seven columns, including phone landscape
widths that previously fell into the two/four-column media queries. Card artwork
retains its printed aspect ratio. Its uniform maximum height reserves room for
names and visible facts instead of stretching or cropping the cards. Short
landscape views show compact mana, power/toughness and colored keyword facts;
complete type and adapted effects remain available through hover, holding the
card, right click, keyboard I/Context Menu or controller Inspect. Inspection does
not choose or take the card. Moving a hold cancels it, and release cannot make an
unintended selection. Ordinary single-click choice plus confirmation is retained.

One compact heading contains pack progress, the existing journey title, actual
copy/destination instructions, deck count, Reroll and confirmation. The repeated
pack ribbon, lower action row and booster footer are hidden. Reroll uses a short
label with a full accessible description and retains its one-use state. The
original button nodes and controller-specific hints remain in place. The shared
top bar is 32px, or 26px in short landscape views; draft actions are 32px.

The foil pack is one 208×364 design. Logo, emblem, caption, crimp seals, border and
idle sheen live inside a single uniformly scaled art group. A matching physical
button frame keeps opening-flight measurements consistent. Existing pack colors,
foil shimmer, card-slot burst, reveal sound and one-pack-at-a-time progression
remain intact. Fit measurements include stage padding, caption and breathing
space, and run after the screen becomes visible as well as on resizing.

The viewport opts into viewport-fit=cover, then consumes safe-area-inset values
exactly once through the shared camera. Native scenes and the adaptive combat
camera use the remaining rectangle, including visualViewport size and offset.
Primary actions and centered windows stay inside that area rather than underneath
the status bar, cutout or home indicator. Inspector bounds use the same area.
Existing camp and shop layouts keep their fixed-view behavior.

Browser validation covers 15 viewport/inset combinations, including 568×320,
667×375 and 844×390 landscape, notched portrait/landscape margins, and a smaller
offset visible viewport. It checks seven complete card images on one row, original
card proportions, uniformly scaled pack components, actual pick/confirm, protected
Continue through shop/camp/combat/receipt, native touch holding without selection,
keyboard inspection and Xbox/PlayStation/Nintendo reroll/advance hints. Insets are
simulated in Chromium; no physical-phone hardware verification is implied.
