# Shop variety and portrait framing — v0.94

Enemy illustrations use a six-pixel radius on all four corners, without the old
arched top or fading mask. This applies to the battlefield, collection and enemy
choice windows; atlas coordinates, aspect ratios and portrait sizes are preserved.

Toxic's shop counter uses an inline green poison-vial SVG, avoiding platform-dependent
emoji rendering. Its name, cost and combat behavior are unchanged.

The shop randomly offers two different pack types per inventory. Eight categories
join Mythic, Equipment, Instant and Creature: Artifact, Enchantment, Aura, Sorcery,
Legendary, Skyborne (Flying), Venom (Deathtouch/Infect/Toxic), and First Strike
(including Double Strike). Each pack has seven distinct matching reviewed cards,
a type-specific foil palette, and the existing select-then-confirm purchase flow.
Offers remain stable during purchases, rerenders and returns from pack openings.
Precons filter candidates by their own color identities before checking eligibility;
small pools are omitted instead of padded with unrelated cards. Unknown pack IDs
return no candidates. The existing Mythic guarantee remains in place.

Validation: the variety browser regression checks all twelve categories, six
precons, sixty shop inventories, eight full new-category purchase/open/return flows,
three fitted viewports, the SVG icon and all fifty enemy frames. Existing precon
color and Sliver presentation browser regressions also pass. The historical
counters/poison browser test completes counter purchases and poison combat but
stops at an obsolete expectation of draft-screen immediately after victory, which
now opens results-screen; it is not counted as a passing full test.
