# Questing Beast and The One Ring — v0.95

Both cards are reviewed mythics in the normal pool, shop and matching specialised
packs, with four generic mana as their casting cost. Precon identity filters still
apply. There are 229 bundled cards and 226 ordinary playable pool cards.

Questing Beast is a 4/4 with Vigilance, Deathtouch and Haste. Creatures with current
power 2 or less cannot block it, meaning they cannot retaliate against its attacks
in these duels. Its battlefield presence makes all your creatures' combat damage
unpreventable, including damage otherwise prevented by color protection. This is
captured per simultaneous damage step: dying in first strike does not erase the
same step's effect, and does end it for the following step. The override never
changes targeting/blocking protection or noncombat damage. Enemy portraits are
creatures, so the printed planeswalker trigger has no legal target here and adds
no extra monster hit. The existing creature legend rule keeps the newly entered
copy, as stated in its in-game description.

The One Ring itself is indestructible; it does not grant that ability to creatures.
Its cast-only entry grants the player protection from everything until their next
turn, independent of whether the artifact stays. It prevents combat damage,
Trample overflow and spell/ability damage, and disallows targeting the player
(including self-targeting). Enemy casting avoids a protected player, and pending
spells recheck legality. Creatures remain vulnerable, and untargeted life loss,
burden upkeep, and losing for an empty Library are unaffected.

Click the battlefield Ring to open the existing unpaid card-ability window. Confirm
to tap, add a burden counter, then draw once per counter. It costs no mana and is
not sacrificed. At the next upkeep, after untapping and before the normal draw,
lose life equal to the Ring's burden; lethal upkeep prevents that draw. A battlefield
badge and ability window show the count. Burden belongs to that permanent, never
the physical library card. The legend choice shows burden/tapped status and lets
the player keep either Ring. The new cast grants protection even if discarded under
the legend rule. Each real draw triggers Niv-Mizzet separately and uses the existing
card-draw animation/audio path.

Sources and earliest ordinary English paper images:
- Questing Beast, Throne of Eldraine #171 (2019-10-04): https://scryfall.com/card/eld/171/questing-beast
- The One Ring, The Lord of the Rings #246 (2023-06-23): https://scryfall.com/card/ltr/246/the-one-ring

Validation includes 334 existing Node rule checks plus 20 new card-specific cases,
real browser casting/dragging, battlefield activation/cancel/tap, one-then-two
card draws, upkeep/expiry, mandatory legend choice, local image decoding and three
fitted viewport sizes. Existing precon and shop-variety browser suites also pass.
