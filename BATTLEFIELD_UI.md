# Unified battlefield — v0.97

Combat uses one continuous table instead of a fixed right-side inspector, utility
column and separate hand panel. Cards and text are larger. The global brand/audio
bar and footer are hidden during combat; existing Audio and Options buttons move
beside Abandon Run and return to their original locations outside combat. Options
also retains confirmed access to the title screen. Phase/run progress stays in the
single on-field toolbar. Continue remains anchored at the lower right, including
controller-specific button hints.

The fanned hand floats over the table. Library/Deck and Graveyard/Exile are physical
piles on the same table, retaining counts, inspection and existing zone animations.
Mulligan stays beside the hand. Six complete creature slots remain on each side;
free permanents scroll horizontally without moving the page. Combat fits the
actual display aspect ratio rather than always shrinking a 1600×900 letterbox.
Landscape keeps your formation left and enemies right; tall displays place enemies
above your formation. Menus, drafting, shop and camp retain their existing canvas.

Hold a card for 440ms to open a floating details window. Moving more than eight
pixels cancels the hold so dragging stays immediate. Release after inspection
cannot cast, tap or select the source card. Short clicks retain their ordinary
play/ability actions. Right click, keyboard I/Context Menu and the controller's
Inspect button open the same window; Escape/Back closes it. The window uses
readable physical-screen pixels with scrollable rules, current unit stats/keywords,
attachments and Ring burden counts. Enemy inspection uses its custom portrait,
not a fabricated card image. Live rerenders rebind the source; removed cards close
the window. Screen changes and hidden tabs cancel pending holds and inspections.

Hand hover hints remain available, with pointer events disabled throughout their
subtree so they cannot block battlefield clicks. Preview descriptions are copied
before appending contextual hints, avoiding mutation of shared card rule arrays.
Generic combat dialogs fit their measured dimensions within the viewport; artifact
ability dialogs and the new inspector remain readable without canvas scaling.
The nonmodal on-field dice layer retains its own coordinates, uses a throw distance
matched to the wider table, and locks/restores the relocated piles and Continue. Controller zone
navigation explicitly includes the relocated system controls and on-field piles.

Validation: seven aspect ratios (1600×900, 1280×800, 1366×768, 1024×768,
2560×1080, 820×1180 and 390×844), six units per side, fifteen hand cards and free
permanents, no page scrolling or clipped controls, native mouse/touch holds versus
short clicks and drags, keyboard/controller inspection, live stat/portrait refresh,
readable popup bounds, pile inspection and restored camp chrome. Existing drag,
zone-flight, legendary-card, six-precon and pack-audio browser checks also pass.
