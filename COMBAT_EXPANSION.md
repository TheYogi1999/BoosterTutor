# Combat expansion v0.88

Adds 28 real Magic cards: 16 creatures focused on Deathtouch, Flying, Reach and
First strike; 8 destroy spells, 3 exile spells, and Mithril Coat. All use current
Scryfall Oracle rules and local original English artwork. Beta Elvish Archers
is used instead of Alpha's misprinted 1/2 image to match its correct 2/1 stats.
See assets/cards/SOURCES.md and ORIGINAL_PRINTS.md for individual print references.

Mithril Coat costs 3 generic mana, has Flash and is itself indestructible. Its
entry trigger attaches freely to a legendary creature you control, with an
explicit choice when several are available. Without one it enters unattached.
Equip 3 can move it to any own creature in Main phase. The legendary rule lets
the player choose which Coat to keep. Damage is still marked: losing the Coat
can immediately kill a creature with lethal damage. Exile, sacrifice and zero
toughness remain effective. Opponents cannot gain Indestructible in this release.

Removal respects card colors (not color identity), artifact/enchantment types,
Flying, current power/toughness, Hexproof and Ward, including rechecking targets
on resolution. Monster toughness corresponds to maximum life. Colors are shown
beside enemy subtypes, and all costs remain generic mana.

Eight original illustrated enemy archetypes add venomous, aerial, first-striking,
artifact, enchantment, support, mill/spell and Hydra encounters. They participate
in normal enemy selection, late encounter waves, Precon and Immortal/Endless
scaling. Each side keeps its six slots. New artwork and atlas layout are documented
in assets/portraits/ENEMIES-v88.md.

Main implementation: combat-expansion.js and combat-expansion.css. Regression
coverage includes actual casting, paid Equip and free entry attachment, Flash,
legend rule, protection loss, lethal/deathtouch damage, first-strike retaliation,
lifelink, exile/sacrifice, exact removal restrictions and post-Ward fizzling.
