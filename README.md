## Battlefield ability windows and centered close buttons (v0.73)

Tap **Black Lotus, Sol Ring or any other permanent card on the battlefield** to open its own unpaid ability window, just like Treasure/Food/Clue tokens. The shared route also covers Jack-in-the-Mox, the Jester artifacts, activated enchantments and equipment. The inspector and hover details now explain cards without direct activation buttons. Opening, canceling or closing a window never pays a cost; confirmation rechecks the current source and costs.

**Mana creatures and Tavern coin abilities** now use the creature ability window too. Their battlefield `+mana` / `Ability` controls open the window; confirmation performs the tap/mana action or starts the separate sacrifice chooser. Summoning sickness, tapped sources, unavailable resources, cancellation and stale sources remain protected. Ordinary creature-card clicks still declare attacks or blocks.

Both ability windows have a close button. Every circular **×** close mark is drawn at its geometric center with CSS rather than relying on a font baseline. Accessible button labels and native dialog/keyboard/controller cancellation are retained.

Validation: **430 rule tests**; mouse and real touch tests for Lotus, Ring, Mox, Jester artifacts, enchantments, equipment, mana creatures and coin abilities; unpaid cancellation, exact one-time payment, stale/sick sources, no inspector activation controls, centered close marks and three fitted viewports. Existing relic/mana/combat, reviewed-card and coin/controller browser suites also pass.

```sh
node tests/battlefield-actions-browser.test.cjs
node tests/relics-browser.test.cjs
node tests/reviewed-cards-browser.test.cjs
node tests/chance-browser.test.cjs
```

## Deck boxes, deck-color boosters and Niv-Mizzet (v0.72)

Precon boxes now have a single aligned front/top/right silhouette, large creature art, real mana symbols and a dark gold-bordered name plaque. The symbols use the **same Mana font glyphs, palette and canvas renderer as [MagicEditor](https://github.com/TheYogi1999/MagicEditor)**. The renderer, pinned font, pre-rendered local symbols and font license are bundled; see [credits](assets/mana/SOURCES.md). No runtime CDN is needed.

During a prepared run, **victory boosters, their rerolls, Booster Tutor and every specialised shop pack** contain only reviewed cards whose entire color identity fits the chosen deck, plus colorless cards. All packs still contain seven cards. Generated basic mana cards also match. Shop packs retain their creature/instant/equipment/mythic selection rules and show both deck colors. The underlying catalog and ordinary PLAY stay unrestricted; changing modes clears the pack theme.

**Ember & Echo** now includes one **Niv-Mizzet, the Firemind**, replacing one Pyromancer. Its Guildpact art is the cover and the oldest regular English card image. Flying, the legendary rule, tap-to-draw and one separately targeted damage trigger per actual card draw are implemented. Triggers wait for the current spell to finish, including Brainstorm's two returned cards. Searches, Booster Tutor, conjures and graveyard returns are not draws. Hexproof, Ward, summoning sickness, Haste, lifelink/deathtouch upgrades and empty-library loss apply. This six-mana champion is the only exception to the starter curve cap; the list remains 24 cards with no fast-mana relics.

Validation for v0.72: **426 rule tests** plus full browser flows for all six colored starters, all booster sources/rerolls, shop purchases, exact deck counts, Niv's tap/draw/target UI and return to unrestricted PLAY. The existing precon browser test also covers five viewport sizes, controllers, all six starts/restarts and progression.

```sh
node --test tests/precons.test.cjs
node tests/precon-colors-browser.test.cjs
node tests/precons-browser.test.cjs
```

## Prepared starter decks and Game Modes (v0.71)

**GAME MODES** sits directly below **PLAY** on the title menu. Its initial tab, **PRECONSTRUCTED DECKS**, offers six physical deck-box designs with the lead creature's Scryfall art crop and a two-color finish. Choose a box to inspect its entire list, open any card's full image and in-game explanation, then explicitly choose **Begin Run**. Browsing, changing the selection, inspecting cards, Escape and controller Back cannot change a run or spend resources.

| Starter | Theme | Colors | Cover creature |
| --- | --- | --- | --- |
| Ember & Echo | Spellslinger | Blue / Red | Niv-Mizzet, the Firemind |
| Relic & Bloom | Equipment & Auras | White / Green | Fencing Ace |
| Twilight Vigil | Lifegain & Recovery | White / Black | Vampire Nighthawk |
| Venom & Thorns | Poison & Deathtouch | Black / Green | Thornweald Archer |
| Wildfire Stampede | Creatures & Combat Tricks | Red / Green | Garruk's Companion |
| Skyward Watch | Flying & Vigilance | White / Blue | Thunderclap Wyvern |

Each prepared starter has **exactly 24 physical cards: sixteen themed cards, seven mana cards and one Booster Tutor**. It uses existing reviewed cards, mostly commons/uncommons, no Lotus/Ring/Mox, no more than two copies of any themed card, and a modest curve capped at five mana, apart from the single six-mana Niv-Mizzet. Colors describe the theme and the selected basic-land artwork; all costs remain generic. The shared Booster Tutor is the usual exception to the deck's color identity. Cover illustrations use the pool's oldest regular English paper printings, bundled locally with [artist and Scryfall credits](assets/precons/SOURCES.md).

Beginning a prepared run resets life to 20, coins to zero, level to one and the run's purchased upgrades, supplies and seals, while preserving the highest-level record. It **skips the initial booster draft and camp** and enters encounter one directly with two of its seven mana cards in play, seven cards in hand and fifteen in the library. Physical IDs and run upgrades remain independent for every copy. The deck is not given extra free relics or camp tokens.

Booster Tutor still interrupts a fight to open a booster, and normal victory rewards, shop offers, camp supplies and Endless remain available. **Restart** repeats the selected prepared starter with fresh cards; returning to the title and selecting **PLAY** starts the ordinary six-pack draft. The standard draft and prepared runs share the same reset and audio path. Enter on a non-button inside a modal cannot accidentally start the default draft.

Validation: **414 rule tests**, real starts and restarts for all six recipes, exact deck/hand/library/mana counts, Tutor interruption/resumption, reward → shop → camp progression, original PLAY, title animation/menu, controller selection/card review/Back/start, and five fixed-canvas viewport sizes without page scrolling. Both new windows keep card text and long deck lists in their own scroll areas.

```sh
node --test tests/precons.test.cjs
node tests/precons-browser.test.cjs
```

## Defensive Lure and combat-arrow focus (v0.70)

**Lure is a defensive duel adaptation.** Every attacking enemy attacks the first living friendly creature with Lure instead of the player. Taunting Elf and a Clone copying it have Lure, with an amber keyword chip in hand/booster/shop facts, on the battlefield and in the collection. The collection can filter Lure. This replaces Taunting Elf's previous offensive forced-defender/retaliation suppression adaptation.

Lure works while tapped or summoning sick; Flying, Menace, Hexproof and Ward do not stop this attack redirection. It overrides manual blocks while present. Attackers choose one Lure target together for that combat, and damage remains simultaneous within each strike step. The Lure creature retaliates against the first surviving attacker **once per damage step**, rather than multiplying its power for every attacker. First strike, double strike, Lifelink, Deathtouch, lethal damage and Trample retain their combat behavior. Trample may still reach the player. Removing Lure before damage restores ordinary attacks and saved legal blocks; subsequent combats use the next living Lure creature, if any. Enemy spells keep their own targets.

Incoming arrows, their damage previews and the defence panel use the same forced target as actual combat. Block controls cannot override Lure. Sick enemies and enemies with nonattack intentions do not gain an attack from Lure.

Hovering an arrow brightens its line/glow and gently dims the other routes. Clicking an enemy keeps its outgoing attack routes highlighted. Hovering your own creature temporarily emphasizes its outgoing attack; a creature without a queued attack highlights incoming routes involving it. Leaving the hover restores the selected enemy's emphasis. Guarding enemies without a route do not dim every arrow.

The SVG stays transparent to pointer input. Hover uses proximity to the displayed curve, so card clicks and pointer dragging still work underneath arrows. Clicking empty battlefield background clears enemy selection in all combat phases while preserving queued attacks and block assignments. Mouse hover is not synthesized for touch; tapped enemy selection still works.

Validation: 406 rule tests, real six-attacker Lure combat, tapped/sick and Flying/Menace redirection, instant removal, Trample/first-strike/retaliation limits, arrow hover at three scales, selected-enemy and owned-creature priority, background deselection, click-through drag/drop, collection filtering, controller input and cache upgrades.

```sh
node --test tests/lure-focus.test.cjs
node tests/lure-focus-browser.test.cjs
```

## Free-flowing enemy attack arrows (v0.69)

Incoming attacks now follow individual, smoothly bowed cubic curves directly to the six invisible player-side targets. The previous shared passage and turns around the HUD are removed. Cards, lands and HUD elements are allowed beneath the arrows; pointer input still passes through the noninteractive arrow layer.

Each enemy gets a preferred bow. A small deterministic search spreads nearby curves and discourages long shared sections, while allowing occasional crossings when necessary. Upper and lower target rows favor different bends. Repeated rendering at the same geometry keeps the same paths, and surviving enemies keep their assigned target points. Attack targets, displayed damage, blocking, Trample and combat rules are unchanged. The glow and moving dashes follow the new curves.

Verified in a real browser at five viewport sizes, with one through six enemies: smooth cubic-only paths, six distinct exact endpoints, no long shared routes in the full formation, deterministic rerendering, and working card/controller interactions.

```sh
node tests/portrait-hud-browser.test.cjs
node tests/compact-battle-browser.test.cjs
```

## Portraits and incoming-attack layout (v0.68)

All twenty enemy archetypes now use a cohesive, original generated portrait atlas. Every battlefield portrait is the same **80×100 (4:5)** size, including Goblins, rats, Saprolings and Myr; the smaller archetypes keep their ordinary stats and abilities. The atlas is bundled as a 566 KiB WebP at its original resolution. [Portrait provenance and tile order](assets/portraits/ENEMIES-v68.md) accompany the asset. Enemy **Power (sword)** and **Life (heart)** appear side by side, with the coin bounty below, and update with live combat stats.

The player's existing square illustration now displays in a **72×72** frame without stretching. A two-row, three-column grid of invisible visual anchors sits to the right, leaving space for life, coins and mana. Each enemy's incoming life-damage arrow has its own endpoint; survivors keep their points when another foe dies, and later waves reuse free points. Arrow routing and damage labels avoid the player HUD and physical lands. Endpoints are calculated in the SVG's own coordinates, including at scaled viewport sizes. These anchors are purely visual: life damage, blockers and Trample use the existing combat rules.

Mana lands use two physical rows, preserve full card faces and tapped rotation, and scroll locally when more cards are present. Mouse, touch and controller scrolling stay inside the land area. The duplicate **View graveyard** link is removed; the physical pile and **Graveyard** button still open the graveyard.

Thunderclap Wyvern's reviewed rules are unchanged: it has Flash/Flying and gives **other creatures you control that already have Flying +1/+1**. It does **not** grant Flying. Its explanation now says this explicitly. Regression checks cover a ground Grizzly Bears, a natural flyer, and a ground creature gaining/losing Flying through a separate Aura.

Validation: 395 rule tests; a dedicated real-browser test for six exact endpoints, HUD clearance, portrait sizes for all twenty kinds, land scrolling/controller access, actual Wyvern casts and the remaining graveyard control across five viewport sizes; compact combat, controller, reviewed-card and cache-upgrade regressions.

```sh
node tests/portrait-hud-browser.test.cjs
node tests/compact-battle-browser.test.cjs
```

## Compact six-slot battlefield (v0.67)

The current game version now appears directly beside **BOOSTER TUTOR** in the header. The duplicate header phase label is hidden; the five-step combat strip remains. Level sits below the player avatar, Mulligan below **Your Hand**, and Graveyard/Exile beside the physical graveyard on the right. A separate panel underneath contains **Start Combat**, **Continue** or **Confirm Blocks** as appropriate.

Both sides support **six creatures**. The limit is enforced before ordinary casts, Clone choices and entry dice; token creation and Persist use the same limit. A seventh creature cannot consume a casting cost. A replacement legendary creature still works on a full field. Complete player card images, mana, loose permanents, the library and the large side inspector fit the fixed 1600×900 canvas. Loose permanents keep their contained horizontal scrollbar.

Redundant Queue Attack, Withdraw and target-dropdown controls are removed. Choose an enemy and then click an eligible creature to queue it; click the creature again to withdraw. Dragging directly onto an enemy chooses that target. Attack-response withdrawal, Flying/Reach restrictions, forced attackers and direct multiblocking remain enforced. Mana and activated-creature buttons stay available, and controller selection uses the same actions. Live player keywords use colored chips, including acquired abilities and Ward amounts; extra keywords are available through the count tooltip and inspector. Enemy types/subtypes now occupy separate aligned rows below their names.

Six small enemy archetypes join encounter teams and the last two encounters' waves: **Scrap Goblin, Cinder Goblin, Tunnel Goblin, Sewer Rat, Sporeling and Myr Scavenger**. Their smaller portraits use bundled Magic artwork credited in [MINIONS.md](assets/portraits/MINIONS.md). They retain ordinary summoning sickness, damage, type filtering, bounty and level rules. Tunnel Goblin has Menace; Cinder Goblin's Lava Spike uses the visible enemy permission die and normal counterspell response. Encounter teams grow from three to six bodies without exceeding six positions.

Validation includes 392 rule tests, real pointer casting/attacks and direct withdrawal, creature abilities, physical Ward payment, six-way multiblocking, controller input, collection and permanent scrolling, minion image decoding, and geometry at 1600×900, 1920×1080, 1280×720 and two portrait viewports without page scrolling.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs tests/finish-mystery.test.cjs tests/jesters.test.cjs tests/jester-family.test.cjs tests/reviewed-cards.test.cjs tests/compact-battle.test.cjs
node tests/compact-battle-browser.test.cjs
node tests/reviewed-cards-browser.test.cjs
node tests/flying-ward-browser.test.cjs
node tests/controller-browser.test.cjs
```

## Reviewed-card rescue, scrolling permanents and enemy types (v0.66)

**29 more original Magic cards** are reviewed and bundled with their oldest regular English paper images. The catalog now has **177 bundled / 174 ordinary-pack eligible cards**. Unsupported cards remain banned; admission uses explicit rules rather than fallback damage or keyword guessing.

The requested additions are Soul Warden, Taunting Elf, Blaze, Avacyn's Pilgrim, Birds of Paradise, Goblin Fireslinger, Index, Gold Myr, Iron Myr, Read the Bones, Flight of Fancy, Goblin Snowman, Murderous Redcap, Thunderclap Wyvern, Shivan Dragon, Visara the Dreadful and Inferno. Shared mechanics also admit Soul's Attendant, Essence Warden, Elvish Mystic, Fyndhorn Elves, Silver Myr, Leaden Myr, Copper Myr, Palladium Myr, Prodigal Pyromancer, Prodigal Sorcerer, Hurricane and Earthquake. Full English in-game explanations and explicit duel adaptations appear in the collection, booster facts and card previews.

- **Entry and static abilities:** Wardens see other creatures on either side, tokens, Persist returns and new enemy waves; Attendant can decline its gain. Flight of Fancy grants only Flying and draws two on entry, with no invented stat bonus. It may enchant any creature. Thunderclap Wyvern has Flash/Flying and continuously boosts other friendly flyers, including Aura/run-granted Flying; multiple Wyverns boost one another, never themselves. Removing an Aura or lord recomputes bonuses and checks lethal damage.
- **Mana and activated creatures:** all colored producers use the shared generic pool; Palladium Myr makes two floating mana. Tap abilities obey summoning sickness, Haste, untapping and stale-source checks. Declared blocks remain when a blocker taps for mana or Snowman's ping. The new Ability button opens an unpaid rules/cost window for Fireslinger, the two Prodigals, Snowman, Shivan and Visara. Choose legal targets before tapping, then handle enemy Ward; Hexproof excludes targets. These are abilities, so enemy Counterspell cannot stop them. Shivan costs one mana per +1/+0 activation, requires no tap, can stack immediately or while tapped, and expires separately from permanent counters. Visara destroys any chosen creature without regeneration. Fireslinger targets an enemy opponent or your life, not your creatures; Prodigals can target any creature or your life. Damage abilities use their source's Lifelink/Deathtouch.
- **Lure and Snowman:** Taunting Elf uses a declared duel adaptation: every eligible foe joins its actual combat and becomes occupied for that combat, allowing allies attacking afterward to avoid its retaliation. Normal Flying/Reach restrictions remain. Queueing/withdrawing does not lure. Snowman prevents combat damage both to and from itself after it blocks, but not noncombat damage or Trample spilling past it. Its tapped activation can hit only the attacker it currently blocks, without removing the block.
- **X and library manipulation:** Blaze, Hurricane and Earthquake choose any payable whole-number X, including zero, before targets/costs; cancel is free. Ward is extra, copied spells retain X and printed mana value is restored outside the stack. Blaze deals X to a chosen target. Hurricane/Earthquake filter Flying/nonflying creatures on both sides and also damage your life; each monster counts once in the duel adaptation. Index orders up to five physical top cards with first selected drawn next, without drawing or shuffling; copies order separately. Scry windows now reorder both kept/bottom groups with Earlier/Later. Read the Bones scries two, draws two and then loses two life, stopping normally on library loss.
- **Persist:** Redcap chooses any target and uses its power at resolution or last known power after leaving. Death/sacrifice/destruction can return the same physical card with a battlefield -1/-1 counter and a new entry trigger; exile cannot. Opposing +1/+1 and -1/-1 counters cancel, including the battlefield use of run upgrades, while the permanent run card remains unchanged. A returned Clone chooses a new copy, rerolls dice creatures when appropriate, and receives its -1/-1 counter before entry abilities. A full six-creature field leaves the persisted card in the graveyard. Inferno applies six damage to each creature and your life before processing deaths; the player can still lose the run.

Loose enchantments, artifacts, tokens and unattached equipment share a **single horizontally scrolling row**, with fixed complete card images and a visible scrollbar. Wheel/trackpad, touch and controller scrolling stay contained in that row; offscreen cards remain actionable and no page scrolling is introduced. Fourteen spare logical pixels are used for the strip, preserving the 1600×900 canvas and the other battlefield zones.

Enemies now have actual type lines and subtypes displayed on their portraits and in previews. Examples are Iron Bulwark (**Artifact Creature — Construct**), Shard Dragon (**Artifact Creature — Dragon**), Aether Wisp (**Enchantment Creature — Spirit**) and Moss Sentinel (**Enchantment Creature — Plant Elemental**). Naturalize and Disenchant now choose only real artifacts/enchantments, including those creature bodies, loose permanents and matching mana cards. Ordinary creatures are not legal targets; Hexproof, Ward, death/exile, attachments and once-only bounty rules still apply.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs tests/finish-mystery.test.cjs tests/jesters.test.cjs tests/jester-family.test.cjs tests/reviewed-cards.test.cjs
node tests/reviewed-cards-browser.test.cjs
```

## All Jesters, self-targeted Cap and Vault 21 (v0.65)

The nine additions use their oldest regular English paper images, bundled locally: **Jester's Cap (Ice Age)**, **Jester's Scepter**, **Jester's Sombrero**, **Demon's Jester**, **Goblin Battle Jester**, **Havoc Jester**, **Spike Jester**, **The Madcap Jester**, and **Vault 21: House Gambit**. Together with the existing Jester's Mask, this covers every card returned by Scryfall's Jester name search. The bundled catalog is now **147 cards / 144 ordinary-pack eligible cards**. Every addition has full English in-game rules; explicit roguelike variants are labelled in the collection.

**Jester's Cap targets YOU.** Cast for four generic mana; click its battlefield card, choose three physical cards from the remaining library (all if fewer), then confirm **two mana, tap and sacrifice**. The chosen copies are exiled and permanently removed from the run deck, including later encounters and Endless. Other copies and their upgrades stay. Cancel, incomplete selection, stale sources and repeated confirmations cannot spend mana. The library shuffles after removal. Temporary library cards can be exiled but were never part of the run deck.

**Jester's Scepter** also targets your own library, following its printed player-target option. On entry, exile the top five physical library cards (all if fewer), preserving their upgrades. This is not drawing and does not change the persistent run deck. Its action window lists the exiled cards. During an enemy spell response, pay two generic mana, tap and put one linked exiled card into your graveyard to counter a spell with that exact name. This can counter an enemy Counterspell even with no counterspell in hand. Each Scepter has its own linked cards and untaps normally; countering its cast prevents entry and exile.

**Jester's Sombrero — House Reserve variant:** opponents have no sideboard. Pay two mana, tap and sacrifice to seal three enemy spell names (all remaining if fewer) for the rest of the run. Choose from Shock, Lava Spike, Sovereign's Bite and Counterspell before paying. Seals prevent future enemy casts and permission rolls, including in later waves and Endless; spells already cast are unaffected. A new run clears all seals.

**Vault 21: House Gambit** is a two-mana Saga. Chapter I triggers on entry; chapters II and III trigger after the normal draw on the next two turns. I/II require choosing a discard, then draw one; an empty hand still draws and an empty library loses normally. III reveals up to five nonland cards, creates one Treasure for each revealed card with a mana-value partner, then sacrifices the Saga. Pairs make two Treasure, triples three, and unmatched values make none. Revealed cards remain in hand. Each Saga tracks its own chapters; already-triggered chapters still resolve if their source leaves.

The five creatures implement these rules:

- **Demon's Jester:** Flying and continuous Hellbent (+2/+1 while the hand is empty), including lethal marked damage when the toughness bonus is lost.
- **Spike Jester:** a 3/1 with real Haste for two generic mana.
- **Goblin Battle Jester — Retaliation variant:** casting a printed red spell lets you choose an enemy that cannot retaliate against your attacks this turn. Generic payment does not change spell color. The trigger survives a countered spell; Hexproof and Ward apply. The enemy still attacks normally on its own turn.
- **Havoc Jester:** each sacrificed permanent triggers one targeted point of damage per Jester, including tokens, Lotus, Mask, Cap, Sombrero, the Saga, failed Mox rolls and sacrificed creatures (including Havoc itself). Death, exile, discard and legend replacement are not sacrifices. Targets, Ward, Hexproof, source Deathtouch and Lifelink are respected. Life loss and simultaneous Lifelink are applied before checking for defeat.
- **The Madcap Jester — House Theft variant:** an actual attack steals a random unsealed enemy-repertoire spell into hand, usable through the next turn for its normal generic cost. Queueing/withdrawing does not steal. Uncast cards expire into exile; returning a stolen card to another zone does not extend its permission. Stolen cards never enter the run deck. Enemy-only Lava Spike and Sovereign's Bite have reviewed monster-targeted casting rules when stolen and stay excluded from ordinary packs.

Triggered choices queue behind current rolls, spell resolutions and card windows, hold combat progression, and cannot apply across scenes or battles. The new card-choice window uses an internally scrolling grid, explicit unpaid cancellation where appropriate, stable physical-copy selection for controller input, and the existing fixed 16:9 canvas.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs tests/finish-mystery.test.cjs tests/jesters.test.cjs tests/jester-family.test.cjs
node tests/jester-family-browser.test.cjs
```

## Gamble and Jester's Mask: Masquerade (v0.64)

Two reviewed cards bring the catalog to **138 bundled / 135 ordinary-pack eligible cards**, with local images of their original English paper printings: Ice Age Jester's Mask and Urza's Saga Gamble. They can appear in ordinary boosters, matching themed packs, the shop and the searchable collection.

**Gamble** costs one generic mana. Search your remaining library for any one physical card, put it into your hand, discard a hand card uniformly at random, then shuffle. The found card keeps its run upgrades and can itself be discarded. The unrestricted search cannot fail to find when the library is nonempty. An empty library still performs the discard step; searching is not drawing. Countering the spell prevents all effects. Each copied spell performs a complete, separate sequence before play resumes. The library window supports mouse, keyboard and controller and keeps scrolling inside its grid.

**Jester's Mask** intentionally uses a **Masquerade variant**, described explicitly in the collection and in-game rules. Cast for five generic mana; it enters tapped. After untapping normally next turn, click its battlefield card to review and confirm **one generic mana, tap and sacrifice**. Discard the entire hand and conjure the same number of random, reviewed nonland cards for this battle only. At least one replacement costs no more than two and is affordable with the mana left after activation; an empty hand cannot activate. New cards have independent physical IDs, no purchased upgrades and a battle-only provenance note. Discarded originals retain their upgrades in the graveyard and run deck. Conjuring does not draw from the library or modify the persistent run deck. The unpaid window permits canceling without spending anything, and repeated/stale activation cannot charge again.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs tests/finish-mystery.test.cjs tests/jesters.test.cjs
node tests/jesters-browser.test.cjs
```

## Lotus activation and arcane counter seals (v0.63)

Black Lotus and camp tokens now take the same explicit card-click route into the token action window. Lotus has a visible click-to-use caption and permanent cards announce that they open a dialog. Opening or canceling the Lotus window spends nothing; confirmation taps and sacrifices the real card to add three floating generic mana once. Mouse, native touch and controller actions were checked against the same window.

The modification medallion is now an engraved arcane seal: a dark violet stamped outline, nested gold/blue rings, a six-point sigil, glowing runes and a central total-counter count. Rune light gently pulses with motion enabled and stays still under reduced motion. The existing green stat marker remains a single accumulated total, so two purchased +1/+1 counters show **+2/+2**. The seal and stat marker follow the same physical run card and do not intercept dragging or tapping.

## Upgrade foil, visible counters and Mystery shop (v0.61)

Random foil finishes are removed. Only a card with active, purchased **run counters** is foil; obsolete random-finish flags are ignored. The same physical copy keeps its foil and visible marks through hand, battlefield, graveyard, exile, searches, Clone's physical-copy rules and later encounters. The card image carries a small gold medallion with its total run-counter count plus a +N/+N marker for stat upgrades. Other copies and the canonical catalog remain unchanged. Starting a new run removes both the finish and its marks. The marks do not intercept clicks or drag/drop.

The counter pool now includes **Mystery (14 coins)**, still with three distinct offers per shop. Its result is generated only after the selected card, current shop/run and payment have been validated at confirmation. Browsing, selecting, canceling and rerendering never roll or reveal the result. Mystery chooses a legal ordinary counter: existing non-stacking abilities are excluded, while +1/+1 and Toxic can stack. Payment and application happen once, then a reveal window shows the actual counter and upgraded physical card. Closing that window does not reroll or refund the completed purchase.

Shop prices are modestly lower. Single cards cost `5 + ceil(CMC × 2.5)` coins. Mythic/Equipment/Instant/Creature packs cost **38/23/20/20**. Guaranteed +1/+1/Lifelink/Flying/Deathtouch/Toxic/Trample/Vigilance/Haste counters cost **15/20/18/24/18/15/17/15**.

Booster instructions and counts now use the actual pack and acquisition flow: starter/reward drafts give two copies of one chosen card to the deck; Booster Tutor gives one chosen card to the hand; bought packs add one copy of every card. Headers, sealed-pack counts, confirm buttons and interruption messages follow the same contract, including a nonstandard pack size. Colored keyword tags appear in booster and shop summaries and the hand's hover preview; keyword words in ability explanations and counter labels use the same colors. No keyword labels cover printed card rules.

D6 faces are opaque white squares with zero corner radius. Their faces meet at closed cube edges; black pip dots remain round. Flight, bounce, result selection, D20 geometry and coin behavior remain unchanged.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs tests/finish-mystery.test.cjs
node tests/finish-mystery-browser.test.cjs
```

## Run counter shop, poison and permanent actions (v0.60)

Foil has a more saturated pink/gold/green/cyan/blue/violet prism and brighter colored highlights. The finish remains run-only and confined to the card image; rules text and captions stay unaffected. Reduced-motion finishes remain still.

Each shop offers **three different random run counters**, alongside its three single cards and two booster types. Counter offers are generated once per shop, are single-use, and do not reroll on revisits. Choices are +1/+1 (18 coins), Lifelink (24), Flying (22), Deathtouch (28), Toxic 1 (22), Trample (18), Vigilance (20), and Haste (18). Opening an offer is free: choose one physical creature-card copy, review its existing modifiers, then confirm payment. Cancel, stale dialogs, removed targets and insufficient funds cannot charge coins. Existing printed/owned keyword abilities cannot be bought redundantly; +1/+1 and Toxic can stack across shops.

Drafted copies now have independent physical card IDs and modifier arrays. A purchased counter changes only the selected copy, including when two copies have the same name and image. Its improvements follow the real card through drawing, casting, death, exile, returning from the graveyard and subsequent encounters, including Endless. They expire when a new run starts and never modify the canonical catalog/cache. A Clone keeps its own physical counters/finish and does not copy another card's purchased counters. Actual stats, abilities, previews and deck entries show the improvements; different modifier combinations are grouped separately. Purchased stat counters are included when Invigorating Surge doubles +1/+1 counters; the extra spell-created counters last for the encounter and do not become further run upgrades. Rolled-base creatures also receive their purchased stat bonuses once on entry. The poison shop counter grants **Toxic 1**, rather than putting poison on the player's card as a penalty.

Six original English paper printings bring the catalog to **136 bundled / 133 ordinary-pack eligible cards**: Glistener Elf (NPH), Plague Stinger (SOM), Plague Myr (MBS), Bilious Skulldweller (ONE), Prologue to Phyresis (ONE), and Infectious Inquiry (ONE). All have reviewed effects and local original-print images.

Poison uses the game's monster-duel adaptation: every monster is an individual opponent and loses at **ten poison counters**, with bounty and level awarded once. Poison is visible on the monster, remains through turns/healing, and does not carry into a new monster or wave. **Infect** converts combat damage into that many poison counters instead of reducing monster life; it still counts as damage for Lifelink and Deathtouch. Infect with Trample assigns poison-lethal damage before carrying excess damage to the next legal foe. **Toxic N** adds N poison counters per positive combat hit in addition to normal damage, including first/double strike and retaliation. Infect and Toxic can combine. Plague Myr taps for generic mana and respects summoning sickness/Haste. Prologue gives every foe in the current wave one poison then draws one; Inquiry draws two, loses two life, then poisons current foes. Both are untargeted (no Ward/Hexproof payment), remain counterable, obey spell-copy sequencing, and stop if a previous effect ends the run. Infect hits and poison spells use a green poison feedback effect.

Tapping any permanent card now opens the same unpaid abilities window as camp tokens. Sol Ring and Jack-in-the-Mox require explicit confirmation before tapping/adding mana/rolling. Fountain of Renewal and Omen of the Sea show both passive/entry rules and sacrifice actions/costs. Passive cards display their rules without an activation button. Equipment has a creature selector and an explicit Equip/Move action, with the real generic equip cost and main-phase restriction. The existing drag/drop and inspector actions remain usable. Busy, stale or tapped sources cannot activate through the window. Keyboard, touch and controller use the same actions.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs tests/counters-poison.test.cjs
node tests/counters-poison-browser.test.cjs
```

## Foil finishes, player levels and Endless (v0.59)

Cards offered in boosters and the single-card shop have a **12% independent chance** to be foil. A finish is rolled once before its reveal, on a run-specific copy of the card; re-rendering or hovering never rerolls it. The selected finish follows the card through hand, battlefield, attachments, mana, graveyard, exile, searches, scry, deck views and card movement. Both copies of a drafted pick keep the finish shown in that booster. Purchased packs and Booster Tutor use the same rule. Starter mana and the single starter Booster Tutor can also be foil. The catalog/cache is never modified, finishes are not saved between runs, and a fresh run rolls new finishes. A Clone keeps its own physical finish rather than copying its target's finish. Normal and foil copies are grouped separately in run deck/library lists. Foil is cosmetic, with a prism tint and a moving sheen limited to the card image; reduced motion uses a still finish.

The player starts at **level 1** and gains **one level per defeated enemy**, through the existing once-only bounty path (combat, damage spells, destruction and exile). Waves do not reset the level. The current level appears at the top of every run screen and in the final summary. The highest level is saved locally on this browser and displayed beneath the title menu, including after a reload; a lower-level run in another tab cannot overwrite a higher record. Storage failure never blocks playing. Levels do not grant automatic combat bonuses.

Beating the campaign's final wave still shows its victory screen. **Enter Endless** optionally continues the same run: deck, life, coins, camp supplies, level and foil finishes remain. The final boss now supplies a normal reward booster before the next shop and camp. Endless cycles the four encounter templates and their existing one/two-wave structure without ending at subsequent bosses. Every new cycle draws four distinct scenery types. At endless fight `d`, enemy life is multiplied by `1 + 0.16d` (rounded up), attack gains `ceil(d/2)`, and bounty gains `floor(d/2)`. Each victory offers another booster, shop and camp. Death or an empty library ends the expedition, preserving the level record; a new run clears Endless and starts at level 1.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/progression.test.cjs
node tests/progression-browser.test.cjs
node tests/foil-layout-browser.test.cjs
```

# Booster Tutor — The Aether Expedition

## Lifelink fixes, shared mana and iconic cards (v0.58)

Enemy lifelink healing now waits until every simultaneous damage assignment in that combat damage step has been applied. A lethally damaged or deathtouched monster cannot heal itself back to life. Surviving monsters still heal by their damage dealt, and player creatures still gain life for their controller even when they die in the same exchange. First strike and double strike keep their separate damage steps: healing in an earlier surviving first-strike step may legitimately let a monster survive later damage. The enemy self-healing interpretation remains the existing monster-duel adaptation of lifelink.

Jack-in-the-Mox and Treasure were checked in both activation orders: each adds exactly one floating generic mana, with no duplication. These sources, Black Lotus and Sol Ring share one pool. Floating mana is spent before tapping mana cards and expires at turn end; it does not increase the number of permanent mana cards. The floating badge now explicitly shows **+N**, and the mana tooltip/accessibility label states the land supply, floating pool and total available mana.

Five additions bring the bundled catalog to **130 cards / 127 ordinary-pack eligible cards**, using the oldest English paper images (Alpha Lotus and Ring, CHK Isamaru, DOM Yargle, ELD Syr Alin):

- **Black Lotus:** costs zero; tap and sacrifice to add three floating generic mana. Clicking its physical card opens an explicit artifact confirmation. Cancel pays nothing. The real Lotus card goes to the graveyard, and a stale/repeated activation cannot add more mana.
- **Sol Ring:** costs one; tap to add two floating generic mana. Can activate on entry, then untaps normally on the next turn. Its activation and the Lotus’s activation are abilities, so they do not invoke enemy Counterspell; casting the artifacts is still counterable.
- **Isamaru, Hound of Konda:** one generic mana for a legendary 2/2.
- **Yargle, Glutton of Urborg:** five generic mana for a legendary 9/3.
- **Syr Alin, the Lion’s Claw:** five generic mana for a legendary 4/4 with first strike. Actual attacks give every other allied creature +1/+1 until end of turn, before combat damage. Entry or queuing an attack gives no bonus. The granted bonuses remain if Syr Alin dies and expire normally.

The creature legendary-rule adaptation keeps a newly entered copy and moves the previous creature with the same name to the graveyard, including when Clone copies a legend. Auras follow their leave rules and Equipment remains unattached. A direct copy of the same legend can replace it on a full six-creature battlefield by click or drag. Krark’s Thumb retains its existing equivalent legendary rule. All additions expose their reviewed rules in the collection, booster facts and card previews; the new artifact actions work with controller input.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs tests/relics.test.cjs
node tests/relics-browser.test.cjs
```

## Solid copper coin flips (v0.57)

The battlefield coin is now a solid copper cylinder with two engraved sun/moon faces, beaded rims and 64 reeded edge facets around a visible 12px wall. Both heads and tails use warm copper with struck highlights and fine surface texture. The resting pose is tilted so the thickness remains visible; focus and selection outlines follow the coin rather than its larger input area.

A separate 2.25-second coin trajectory rises, falls into a firm first impact and makes two small heavy rebounds. Four end-over-end rotations visibly alternate the actual front and reverse faces, then settle with a short rocking motion. A height-sensitive ground shadow changes with the fall and landing. Natural heads/tails results remain immutable, and confirmation waits for the complete flight and rocking animation, including the staggered second coin from Krark’s Thumb. Reduced motion immediately shows the same correct solid coin. D6/D20 motion and all card rules remain unchanged.

```sh
node tests/copper-coin-browser.test.cjs
```

## More expedition backgrounds (v0.56)

Four new original SVG landscapes join the existing fjord, dunes, forest and temple: **volcanic mountains** at Valakut, the Molten Pinnacle; **ocean cliffs** at Halimar Depths; a **crystal cavern** at Crystal Vein; and a **moonlit marsh** at Bojuka Bog. Layered silhouettes, lava streams, water reflections, crystal facets and mist sit behind the existing battlefield shading so cards and text remain legible.

Each new run randomly chooses four distinct landscape types, then an MTG land within each selected type. All eight landscape types have an equal opportunity to be selected; the multiple forest land names no longer bias the scenery. The chosen locations remain stable through turns and encounter waves. Camps and shops inherit their location’s scene and accent. Existing runs retain their current locations. The backgrounds are bundled vector assets and need no external image service.

```sh
node tests/stages-browser.test.cjs
```

## D20s and coin-flip cards (v0.55)

Seven more rules-reviewed cards bring the bundled catalog to **125 cards**, with **122 eligible for ordinary boosters and shops**. Their images use the original English paper printings: AFR Hoarding Ogre / Contact Other Plane, UST Squirrel-Powered Scheme, RTR Tavern Swindler, MH2 Tavern Scoundrel and MRD Krark’s Thumb / Fiery Gambit.

- **Hoarding Ogre:** when it actually attacks, roll a visible twenty-sided die before damage. Results 1–9 create one Treasure; 10–19 create two; exactly 20 creates three. Multiple Ogres resolve their separate rolls before their respective fights and the next combat phase. Queuing an attack does not trigger it.
- **Contact Other Plane:** roll a D20. 1–9 draw two; 10–19 scry two then draw two; exactly 20 scry three then draw three. Copied spells finish their own roll, scry and draw in order. Empty-library draws retain the existing loss rule.
- **Squirrel-Powered Scheme:** each copy adds two to every player die, including both Elvish Impersonators rolls. Natural faces and modified totals are shown separately. Enemy checks and coins are unaffected. Unlisted modified results have no table effect: a 7/8 does not produce Mox mana or a Goblin Tutor search, and a 21/22 does not qualify as a D20 table’s exact 20.
- **Tavern Swindler:** tap and pay three life before flipping. Heads wins and gains six life. Summoning sickness prevents activation; paying the last three life ends the run before flipping.
- **Tavern Scoundrel:** every won, kept coin result creates two Treasure per Scoundrel. Its activation explicitly chooses another controlled permanent, then pays one generic mana, taps and sacrifices that choice. Creatures, artifacts, enchantments, tokens and mana cards are supported. Cancel is free, stale choices cannot pay, and sacrificed tokens do not become graveyard cards.
- **Krark’s Thumb:** flip two visible coins, explicitly choose one result and ignore the other before continuing. Ignored flips do not trigger Scoundrel. The legendary-rule adaptation retains the newly cast Thumb and puts the previous one into the graveyard.
- **Fiery Gambit:** choose a legal creature target and resolve Counterspell/Ward before flipping. After each win, choose to collect or flip again. A loss erases spell rewards, but keeps Scoundrel Treasure already created. Collecting at one or more wins deals three to the target; two or more also deals six to every living monster (the explicit adaptation of “each opponent”); three or more also draws nine and untaps all mana cards. Copies restart at zero wins. Further wins beyond three do not add another spell-reward tier.

D20s use twenty triangular 3D faces. Gold HEADS / silver TAILS coins fly, spin and land on the battlefield with a short metallic cue through the shared mute-aware audio bus. Reduced motion immediately reveals results. Coin decisions, sacrifice choices, battlefield Flip buttons and inspection actions support mouse, keyboard and controller. New rules are visible in collection filters, card previews, boosters and shops. Combat-created Treasure uses the existing click-to-sacrifice window and lasts for the current encounter; it does not add permanent camp inventory or run-deck cards.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs tests/chance.test.cjs
node tests/chance-browser.test.cjs
```

## Smoother dice and direct Mox activation (v0.54)

Dice now use one continuous decelerating horizontal path, independent diminishing bounces and a consistent rotation transform. The floor shadow follows the same forward movement. The final animated pose matches the resting pose, and results wait for the flight, bounce and rotation to finish. Reduced motion remains immediate.

Clicking an untapped Jack-in-the-Mox on the battlefield now directly taps it and starts its D6 ability, including with controller confirmation. A tapped Mox instead opens its inspection with the activation disabled. The inspector activation remains available. Results still add one floating generic mana on 2–6, or sacrifice the Mox and lose five life on 1. Normal turn untapping is unchanged.

The first combat step is now named **Main phase + declare attackers** in both phase displays. The longer label fits the fixed viewport layout. Validation includes 199 rules tests, existing dice/enemy/controller/layout browser suites and a new browser regression checking actual animation transforms, final-pose continuity and direct Mox interaction.

```sh
node tests/dice-polish-browser.test.cjs
```

## Battlefield dice (v0.53)

Dice now fly onto the battlefield instead of opening a separate modal. Player dice enter from the left and enemy dice from the right, tumble, bounce and settle near the center with moving shadows. Two dice arrive with a short stagger. The field stays visible without a dimmed or blurred backdrop.

Each result is still generated exactly once. Results become available after the actual animation completes; click the landed dice or Continue to apply them. Keyboard and controller confirmation remain supported. Battlefield controls stay locked until completion and are restored on continuation, interruption or a new battle. Sequential copied spells retain their separate rolls, and stale animation callbacks cannot apply an old result. Reduced-motion mode shows the result immediately.

Validation: 199 rules tests plus browser checks for on-field positioning, left/right entry, central landing, input restoration, copied spells, enemy checks, controller use, reduced motion and fitted desktop/mobile layouts.

```sh
node tests/field-dice-browser.test.cjs
```

## Library expansion and boosters (v0.27)

The bundled source catalog contains **81 real cards**: 77 eligible for ordinary packs/shops, three banned stack/hand-dependent cards, and Booster Tutor as a start-deck-only card. The online curated list remains audited by the same rules. The collection now shows full in-game rules beside each card, with expandable printed Oracle text; only the outer list scrolls. Type, mana, keyword (including Ward), colour, discovery and ban filters remain available.

- **Brainstorm:** draw three, then select any two cards from your current hand and return them in a chosen order. The first selected is the next draw. This is not discard. Mandatory return choices cannot be cancelled after the spell has resolved. Copies complete their own draw/return sequence one at a time.
- **Opt / Preordain / Serum Visions:** scry and draw in printed order, with the existing top/bottom chooser. Quick Study, Concentrate and Harmonize add simple draw options. Five more vigilance creatures and four numeric-Ward creatures join the pool. Su-Chi Cave Guard’s death trigger adds eight generic mana through the rest of the current turn; exile does not trigger it.
- **Exile:** Scour from Existence targets any permanent, including a mana card; Iona’s Judgment and Angelic Edict target a creature or enchantment; Final Judgment exiles every creature without targeting. Ward and Hexproof do not stop a nontargeted sweep. Attachments and Clone source identities follow their existing leave rules.
- **Ward:** after the casting and additional costs are paid, an opposing targeted Ward creature asks for its extra generic-mana payment. Declining counters that spell resolution, without a refund. Every spell copy triggers Ward separately. Own spells, combat, Mill and nontargeted effects do not trigger it. Elites and the boss may have Ward. Rune Raider also has a targeted two-damage Rune bolt with one mana available for Ward; allied Ward can counter it.
- **Enemy-only Mill:** wisps can put the top two library cards (three in the boss encounter) into your graveyard. Mill resolves once per enemy action and never goes into a player pack. Milling an empty library alone does not lose the run; a later failed draw does. Opponents have no artificial library or player Mill cards.
- **Booster Tutor:** every completed starter deck contains exactly one copy, making the starter deck 17 cards including its four mana cards. It pauses the current encounter and response window, opens a seven-card pack, puts one chosen card into your current hand, then resumes the same battle. The other six cards stay outside this game; the selected card is not permanently added to the run deck. Doublecast opens two sequential packs. Booster Tutor is excluded from ordinary packs and shop offers.
- **Shop booster:** alongside the three single-card offers, each camp sells one sealed pack for 30 coins. All seven revealed cards (six nonlands and one mana card) join the run deck, once, with no extra selection cost. Sold status persists when returning from camp. Tutor packs also include one mana-card option. The regular six-pack starter draft is unchanged.

Card choices, Ward payments, mandatory library ordering and interrupted packs work with controller focus. An automatic combat continuation cannot run through a card-choice or booster interruption.

```sh
node --test tests/game.test.cjs tests/rules.test.cjs
node tests/expansion-browser.test.cjs
node tests/controller-browser.test.cjs
node tests/rules-effects-browser.test.cjs
node tests/pack-scroll-browser.test.cjs
```

## Controller support (v0.26)

Xbox, PlayStation and other controllers with standard Gamepad API mapping can operate the menus, boosters, shops, card choices and combat. Connect the controller and press a button; release held inputs before confirming. Open **Controls** or Menu / Options for the in-game guide.

- D-pad / left stick: move the gold focus.
- A / Cross: select or activate. On a filter or attack-target selector, toggle edit mode; directions change the option immediately.
- B / Circle: finish selector editing, close a dialog, or cancel unpaid card choices.
- X / Square: inspect the highlighted card or opponent.
- Y / Triangle: continue the current combat phase, confirm a chosen draft card, or leave the shop. This shortcut never submits a modal cost choice.
- LB/RB or L1/R1: switch between hand, battlefield, opponents, action buttons and other UI zones.
- View / Share: open the run deck. Menu / Options: controller help. Right stick: scroll card lists.

Blocking and equipping use the existing click controls: choose an attacker then your blockers; choose equipment then its host. Focus survives UI re-renders. Confirm buttons use press edges, while directions repeat after a short delay; stick deadzones ignore minor drift. Disconnecting, losing window focus, or reconnecting with a held button cannot submit a game action. Mouse or keyboard input immediately takes over. The game uses standard browser mapping; browser sound/fullscreen restrictions may require an initial mouse click.

Controller regression checks use simulated Gamepad API snapshots in Chromium, including held buttons, modal costs, target editing, combat, disconnection and reconnect. Hardware models have not been individually tested.

```sh
node tests/controller-browser.test.cjs
```


## Version 0.25: reviewed cards and presentation

The source catalog now includes 60 bundled real cards. Only rules-reviewed cards can enter new boosters, shops and decks (57 in the offline pool). The larger Scryfall list is audited on load: supported fixed-stat keyword creatures remain eligible; unimplemented triggers, costs and keywords are excluded. The catalog’s **Ban list** filter shows the exact reason. Cancel and Reverberate require a spell stack, and Duress requires an opponent hand; they are banned instead of being replaced by unrelated effects.

Explicit choices now cover discard, sacrifice and targets. Village Rites / Altar’s Reap sacrifice a chosen creature; Thrill of Possibility / Cathartic Reunion discard chosen other cards. Costs are paid atomically after confirmation and not refunded after resolution. Cancelling pays nothing. Raise Dead selects a creature card in the graveyard. Snakeskin Veil restricts its target to your creatures; Hunger of the Howlpack checks whether a creature died this turn; Invigorating Surge doubles only actual +1/+1 counters. Auras may also target a legal monster and detach when it leaves.

Doublecast copies the next instant or sorcery this turn without another mana or additional-cost payment. Copies keep the chosen target; they fizzle if it is gone, and the effect expires at cleanup. Clone copies a chosen allied creature’s printed characteristics, not its counters, equipment, damage or tapped state; Clone itself returns to the graveyard when the copy dies. This remains a monster-duel adaptation, without a complete opposing spell stack or enemy Magic creature cards.

Recorded CC0 card Foley and a real packet-opening recording replace prominent synthetic effects; source details are in [assets/audio/SOURCES.md](assets/audio/SOURCES.md). Orange-white booster flares, centered NEW badges and glowing art frames accompany the reveal. Successful drags travel into their actual destination, cancelled drags return, and enemy hits flash and show floating damage. Reduced-motion settings shorten or disable movement. Four atmospheric stage scenes vary with the selected country. Existing portraits, avatar selection, six-booster draft, manual generic mana cards and fixed viewport layout remain in place.

Current checks:

```sh
node --test tests/game.test.cjs tests/rules.test.cjs
node tests/rules-effects-browser.test.cjs
```

The earlier UI test scripts describe older releases; use the reviewed-rules suite for the new target and cost dialogs.


**Version 0.27** · A free, unofficial browser roguelike demo with genuine Magic cards and an explicitly adapted ruleset.

Play: https://theyogi1999.github.io/BoosterTutor/

## Run locally

```sh
python3 -m http.server 8000
```

No build step or runtime dependencies. Every scene uses the same 1600×900 (16:9) canvas: home, loading, sealed/open boosters, camp, shop, combat and the end screen. One uniform scale fits the entire frame inside the visible browser area, including phones and iPads in portrait orientation; spare space becomes letterboxing. Deck, graveyard, scry and confirmation dialogs also use 16:9 frames. Scenes do not scroll; longer dialog content can scroll inside its frame. Fullscreen is available.

## Draft, deck and card zones

- The curated list in `card-pool.txt` contains a larger list of Magic card names. At the start of a run, the game resolves the list through Scryfall and loads card text, mana values, keywords and original images. The verified bundled cards remain available as the offline fallback.
- Open six packs individually, with seven cards each. Pick one card per pack and receive two copies of each pick. Four basic mana cards complete the 16-card starter deck; there are no extra starter creatures.
- Each opened pack has one free reroll. It replaces seven cards and clears only that pack's selection. Reward packs also contain seven cards.
- Every booster card shows its type, mana value, printed power/toughness, keywords and a short in-game ability summary below its image. Noncreatures show a dash for power/toughness; full effect details remain available in the card preview.
- Booster image frames keep the printed card's 488:680 portrait ratio. Selection and keyboard-focus outlines follow the card image instead of the wider summary column.
- The global Deck button and the camp's **Review your deck** button show grouped copies, mana statistics and a card search. Deck inspection works between encounters and turns.
- The Library is a physical face-down stack to the right of the hand. Click it to inspect remaining cards grouped and sorted; upcoming draw order is not exposed.
- Used spells, dead creatures and their auras enter the graveyard. The graveyard does not recycle into the library: if you try to draw while it is empty, the run ends. Exile lasts for the encounter; your run deck is restored for the next encounter.
- Unmake exiles a selected monster; dragging it directly onto an allied creature exiles that ally. Its auras go to the graveyard and its equipment remains unattached. The Exile viewer displays both cards and banished monsters.

## Coins, shop and verified catalog

- Every defeated or exiled monster pays its displayed bounty once. Coins persist through the run and reset with a new run.
- After a reward pack, visit a shop with exactly three distinct cards. Each offer sells one extra copy for your run deck; sold offers stay sold when returning from camp. Prices are 6 + 3 × mana value. You can leave without buying.
- Shop offers use the same portrait image size and type, mana, power/toughness, keywords and short ability summary as booster cards.
- The start screen opens the curated card catalog, with name/text search, type, mana, printed keyword and colour filters. Cards link to their Scryfall source. The catalog and boosters use the same dynamically loaded pool.
- From v0.24, cards first revealed in a booster or displayed in a shop show **NEW** for that view. Discoveries persist in browser storage across runs and reloads, and different printings of the same card share one status. Sealed packs and openings cancelled before arrival do not mark cards as seen. If storage is unavailable, tracking works for the current page session.
- The card pool shows **Seen / Not seen** status and a discovery filter, without NEW badges. Browsing the pool does not mark its contents as seen. The redesigned title screen groups the main actions and avatar picker beside the card display and includes a persistent discovery count, all inside the same 16:9 frame.
- Printed keywords in this pool have explicit support: flying, reach, lifelink, deathtouch, first/double strike, haste, vigilance, trample, menace, defender, hexproof, flash, enchant, equip and scry. Monsters can have combat keywords, shown under their intentions. Hexproof monsters cannot be targeted by player spells, but can still be attacked or blocked in combat.
- Scry opens an ordered top-card chooser: keep cards on top, move them to the bottom, or swap their order. Omen scries before its draw and can be sacrificed for 3 mana to scry again. Fountain of Renewal gains life each upkeep and can be sacrificed for 3 mana to draw. Angelic Chorus gains life equal to an entering creature’s toughness; Llanowar Elves taps for generic mana after sickness ends. Rancor returns to hand when its host leaves. Juggernaut must attack when able and cannot be blocked by Walls.
- Data verification means source metadata and original images match Scryfall. Combat remains an adapted monster-duel ruleset; Cancel is banned because opposing spells and a complete stack are not modeled.

## Mana, hand and life

- Only generic mana is required: pay the card's total mana value. Printed images retain their original symbols.
- The starter deck contains four basic mana cards. Two begin untapped on the battlefield and two stay in the draw pile. Draw mana cards, then play one during your main phase; it enters untapped, taps to pay generic costs, and untaps at the start of your next turn. The mana display shows available mana against this turn’s total capacity; the capacity stays steady as you spend mana. There is no automatic mana refill or colour requirement.
- Start each run at 20 life. Life carries between encounters. Aether Crystal adds one floating mana at the start of each later turn; Wayfinder’s Lens gives one extra opening card in each battle.
- Draw seven opening cards, then draw one card at the start of each turn. Extra draw effects add their stated number of cards. The fan adapts to its actual size. A free opening mulligan is available before your first action.
- Healing, resting and lifelink can raise life above 20. Life displays use numbers, not bars. Each enemy has its own life total and bar, plus damage output; enemies have no toughness stat. The game has no shield or damage-absorption mechanic.

## Individual attacks and retaliation

- Every creature has its own target selector and **Queue attack** button. Clicking the button, clicking a ready creature, or dragging it onto a monster only queues its attack during Main phase. **Start combat** enters **Your attack**, where queued attacks resolve after the priority window or visible beat. Selecting or dragging an attacker does not deal damage, tap it or start an individual combat. Each queued creature keeps its chosen target.
- Monsters deal their power back when legally able to block the attacking creature. Flying/reach and menace apply to retaliation. Normal damage in each duel is simultaneous. First strike may kill before retaliation; double strike uses two damage steps. Damage marked on allied creatures persists until turn cleanup.
- A creature attacks at most once per turn. Attacking normally taps it. **Vigilance** leaves it untapped, so it can still block, but does not grant another attack.
- Every creature, including artifact creatures and monsters, has summoning sickness unless it has haste. New creatures appear grey and may block immediately. Haste lets a creature join the current turn's combat phase. Tapped creature faces rotate sideways; vigilance attackers stay upright.
- Planned attack arrows remain visible throughout combat. Each allied arrow uses that creature's own target. Enemy routes point at your life or the assigned blockers. Animated, glowing SVG routes with endpoint markers do not intercept clicks or drops.

## Blocking and instant responses

- Multiple allied creatures may block one monster. Select an attacker, then click or drag any number of untapped legal blockers onto it. Click a selected blocker again to remove it; assigning it elsewhere moves it. A blocker belongs to one attack only.
- Selection order is damage-assignment order. The attacker assigns lethal damage to earlier blockers and any remaining damage to the last. All surviving blockers return their damage together. Trample assigns lethal damage to blockers and sends excess damage to your life; allied trample spills past a defeated target to another monster. Menace requires at least two blockers. Flying requires flying or reach to block.
- **Instants can be cast in every combat phase**, provided their mana cost can be paid. Flash cards, including Omen of the Sea, are also playable in these windows. Other cards remain restricted to the main phase.
- Before attack, enemy action and damage resolution, a payable instant opens an explicit priority window. Cast any responses you want, then choose **Continue**. Without a payable instant, the phase advances after a short visible beat. There is no full Magic stack/counterspell engine.
- An instant that removes a target or blocker updates assignments before damage. Attacks do not silently redirect to another monster if a declared target leaves. Timers from abandoned runs cannot affect a new run.

## Permanents, modifiers and controls

- Noncreature artifacts/enchantments stay for the encounter. Recognized static bonuses affect allied creatures; unknown permanent effects are described as not implemented.
- Auras choose an allied host when cast. Equipment pays its printed Equip cost in generic mana each time it is attached or moved, during your main phase. Casting and equipping are separate costs; dragging equipment directly from your hand onto a creature pays both. Attached cards sit physically beside their host in an overlapping rail; equipment can be dragged to another host. The free permanent zone holds unattached equipment and global enchantments.
- **Green** stat chips show persistent modifiers, including counters, equipment and auras. **Amber EOT** chips show temporary bonuses. Total power/toughness reflects both; temporary bonuses expire at cleanup.
- Hand tooltips show actual implemented effects and casting availability above the hovered card. Battlefield cards retain the large side inspector. Mouse/touch/pen dragging holds the card at the grabbed point; legal zones highlight and Escape cancels without spending mana.
- Selection uses a dedicated 85 ms bright UI tick (`assets/audio/select.wav`), replacing the percussion-like sprite slice. Other original stereo sound cues use the shared decoded sprite, category levels, compression, a voice cap and short fades. A mastered booster Foley plays with seven staggered reveal glints. Muting stops all sounds; reduced-motion settings disable reveal glints.
- Four selectable player portraits and five opponent portraits use original painted fantasy spellcaster busts, cropped to head and upper torso. The shared WebP portrait sheet is about 407 KB. Booster foil, sparks and reveal light use a warm orange palette. Sealed boosters gently float up and down with a slight breathing pulse. On opening, the pack moves to the first card slot before tearing open; sound and sparks begin at that slot after arrival. Selection and reroll wait until the move finishes. Reduced-motion settings skip the travel and breathing effects.
- Attack arrows have rounded, glowing tips and a steady light trail. Each animated dash loop advances by one exact dash period. Existing SVG routes retain their nodes and animation timelines through redraws; adding or removing another route does not shift their curve. Reduced-motion settings keep static routes.

## Progression and limits

Four encounters lead to the Shard Dragon. Each run draws four distinct stages from ten country regions; the battlefield receives a subtle color tint for its location. Choose one of four planeswalker avatars on the start screen; your selection is saved in the browser. After rewards and the card shop, rest for 10 life or study to add a Divination. Run progress lasts for the current page session. The 16:9 frame rescales when rotating a phone or resizing the browser, and the hand fan adjusts to its logical row width. Queued or winding-up attacks can be withdrawn before they resolve. Withdrawing all attackers during Your attack continues the normal combat phases; it does not return to Main phase. The side inspector provides card details and permanent activation controls in every orientation.

Enemy groups vary their support opponent and, outside the boss fight, their positions. Encounter sizes stay at 2, 2, 3 and 2; later stages retain their elite enemies and the final Shard Dragon is guaranteed. The first fight always includes a grounded Moss Sentinel, draws only from the introductory opponents, and never gives an opponent Hexproof. Aether Wisps can appear in that first fight without Hexproof; later wisps keep it. A live encounter is generated once and does not reroll on turns or redraws.

This is **not a full Magic rules engine**. Effect descriptions and execution share the same effect plan, but unrecognized spells and permanents are banned from new runs until their rules are supported. Instants do not implement the complete Magic stack, protection rules are not simulated, and monster combat is an adapted duel system. This is a free, non-commercial fan demo for entertainment; it is not affiliated with or endorsed by Wizards of the Coast.

## Validation

Requires Node.js 20+ for logic checks:

```sh
node --check cards.js
node --check sounds.js
node --check game.js
node --test tests/game.test.cjs
```

Browser checks require Playwright, Chromium and a running static server. `CHROMIUM_PATH` selects a different Chromium executable:

```sh
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/advanced-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/market-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/mobile-browser.test.cjs
node tests/release-cache-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/presentation-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/turn-layout-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/pack-travel-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/roster-frames-browser.test.cjs
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/discovery-shop-browser.test.cjs
```

The suites cover pointer drags, cancellation, large hands, uncapped healing, packs/rerolls, audio, layout bounds, English UI, card-zone inspection, individual attacks, retaliation, vigilance, priority windows, multi-blocks, exile and modifier expiry. The mobile suite runs without the external card API and checks booster facts, ten viewport sizes, all combat phases, a 15-card hand, rotation and touch blocking. The self-contained release-cache suite uses a real HTTP cache, upgrades a previous scrolling release, plays through all six boosters into combat, and checks iPad sizes and a simulated Safari visible viewport with browser bars. Temporary screenshots go into ignored `work/`.

## Assets and publication

Card metadata and original images were retrieved from [Scryfall](https://scryfall.com). The Library uses the original Magic card back supplied by Scryfall. Card images/text belong to their respective rights holders. Environmental SVGs, audio and the AI-generated spellcaster portrait art are original assets for this prototype. The portrait characters are original designs, not official Magic planeswalker portraits. The project is not endorsed by Wizards of the Coast and does not claim permission under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).

`.github/workflows/pages.yml` publishes changes pushed to `main` automatically, and can also be run manually.

For a release, update the displayed version, README version, and every JavaScript/CSS `?v=` URL in `index.html` together. Versioned asset URLs prevent a newly loaded page from reusing a cached script or stylesheet from an older release. Changing only the page URL does not invalidate its cached assets. Every scene follows the visible viewport (including browser bars), keeps its 16:9 aspect ratio and fixes the page body in place.


### v0.34 — supplies and specialised shop packs

The shop keeps three single cards and offers two randomly selected, distinct pack types per camp: Mythic (45 coins), Equipment (27), Instant (24), or Creature (24). Each seven-card pack can be bought once; the same offers and sold states remain when returning from camp. Type packs contain seven unique cards of that type. Mythic packs guarantee one actual Mythic printing and six rare/uncommon cards.

The 100-card verified catalog adds 10 vanilla creatures, three Equipment and six spells, including Dark Ritual, Pyretic Ritual, Seething Song, Disenchant, Naturalize and Angel’s Mercy. All costs and produced mana remain generic. Floating mana is shown as a gold ✦, is spent before untapped mana cards and expires at turn end.

Camp supplies replace passive mana/hand-size bonuses and direct Rest/Study rewards. Choose one Treasure, Food or Clue token. Unspent tokens enter subsequent battlefields and carry until consumed or destroyed. Treasure: tap/sacrifice for one floating mana; Food: pay two, tap/sacrifice for three life; Clue: pay two and sacrifice to draw one. Tokens never enter the run deck or persist in graveyards/exile. Artwork sources: [assets/cards/SOURCES.md](assets/cards/SOURCES.md).


### v0.35 — original artwork and deliberate pack selection

Card art uses the oldest available regular English paper printing, with promo artwork as a fallback. The art print is tracked separately from the verified rules/rarity print; this preserves premium-pack guarantees while using classic artwork. The same policy covers the five basic lands and Treasure/Food/Clue tokens. The title fan uses Alpha Grizzly Bears, Serra Angel and Lightning Bolt. Sources: [Original print manifest](assets/cards/ORIGINAL_PRINTS.md).

Shop packs are selected with one click, then bought with a separate confirmation action. Selecting the same offer again does not deselect it or spend coins. Revealed-card choices likewise stay selected until confirmed. Equipment wrappers are silver, Mythic red with a glow, Instant blue, Creature green and Booster Tutor violet; the type colours carry through the opening effect.


### v0.36 — more enemy encounters

Fourteen enemy archetypes now include Ember Duelist, Ridge Boar, Mist Sprite, Bog Stalker, Iron Bulwark, Rune Archivist, Dusk Vampire, Ash Tyrant and Tide Sphinx. Teams draw distinct enemies from tier-appropriate pools; the opening encounter has no elites, bosses, Hexproof or Deathtouch. The four encounter sizes remain 2 / 2 / 3 / 2. The final fight randomly selects Shard Dragon, Ash Tyrant or Tide Sphinx.

Mend restores the weakest injured living ally, capped at maximum life. Rally grants the living enemy team +1 power. Neither intent also attacks. Ward, Rune bolt, Mill, healing and buffs resolve once per turn and retain the existing instant-response windows. New original portraits share one cached nine-cell atlas.


### v0.37 — flying opponents and visible Ward payments

Flying monsters can only be attacked by creatures with Flying or Reach. This game rule applies to click/target controls, drag feedback and drops, mandatory attacks, combat damage and trample overflow. Temporary and attached keyword grants count. Invalid targets are disabled; an attack that becomes illegal before damage is cancelled without tapping or silently changing targets.

Ward now refreshes the battlefield while its payment dialog is open, including between copied spell resolutions. Casting costs and extra Ward costs immediately show the actual tapped mana cards and remaining floating mana. Floating mana is still spent first; insufficient or declined Ward payments never tap additional lands.


### v0.38 — Coins under life and enemy counterspell windows

The combat wallet is labelled Coins and sits directly below life; the topbar wallet is hidden during combat. Both displays update immediately when bounties or purchases change the run balance.

Rune casters now cast **Shock**. Later Ember Duelists can cast **Lava Spike**, and Dusk Vampires cast **Sovereign’s Bite**. Each spell locks its target when cast, is independent of its caster, resolves once, and gets a separate response window before its effect. Opposing targeted spells still respect allied Hexproof and generic Ward. Normal attacks, Mill, Mend and Rally remain abilities rather than spells.

Four new verified player cards use their oldest regular English paper artwork: **Counterspell**, **Negate**, **Dispel** and **Dismiss**. **Cancel** is now reviewed and playable too. Dispel targets only instants; Negate targets only noncreature spells; Dismiss draws one after countering. The player catalog has 104 cards, with 101 in the normal pool, two banned cards and the start-only Booster Tutor. Enemy-only sorceries stay outside the player pool. Cached collections merge new bundled cards so existing players receive the additions.


### v0.39 — cinematic title entrance

A warm summoning light, orbital arcs and a spiral of genuine MTG card backs introduce the three classic cards. The fan opens in depth, each card flips and receives a brief golden sheen, and the large title and menu arrive in staggered steps. After roughly three seconds the scene settles into restrained embers, slow arcs and the existing foil/parallax effect over the shared expedition background.

Play, Options, Quit, Collections and audio controls remain available during the entrance. Canvas work pauses when the tab is hidden or another scene opens; returning to the title replays the entrance. Reduced motion shows the complete front-facing fan immediately with a static atmosphere.


### v0.39.1 — Booster Tutor on the title screen

Booster Tutor takes the central position in the three-card title fan, using its original Unhinged artwork (2004). The card-back entrance, flip and golden reveal remain intact.


### v0.40 — randomized Booster Tutor title prints and audio auditions

The three-card title fan now shows only Booster Tutor: **Unhinged #51, Unsanctioned #33 and Arena League 2004 #11**, shuffled into new positions on title entry. These are the three available English paper printings; the Arena and UND prints share an illustration. Gameplay uses the user-selected **UND #33** artwork instead of the normal oldest-print preference. No additional card copies or rules enter the player pool.

[Intro sound previews](intro-sounds.html) offers three original audio sketches: Arcane Bloom, Velvet Shuffle and Aether Awakening. Preview playback is manual and exclusive. A sound will be selected before any is connected to the title animation. Music and existing game effects are unchanged.


### v0.41 — selected intro and Play sounds

**C · Aether Awakening** plays once on title entry, then **The Bard’s Tale** starts and loops at the saved music volume. If a browser requires user activation, the first click or key starts C and replays the visual entrance in sync. **B · Velvet Shuffle** plays immediately when starting or restarting a run, replacing the previous delayed start jingle. Pressing Play during C skips it, plays B, then starts the score; an already-playing score continues beneath B. Gameplay never waits for audio.

The master switch mutes all three channels; the Music setting controls only the score. Hidden tabs pause C and the score and stop the short Play cue. Returning resumes paused audio without restarting C, and returning to the title later does not replay its sound. Errors or blocked media cannot prevent Play.


### v0.42 — card and combat sound auditions

[Battle sound previews](action-sounds.html) provides three alternatives for each of four actions: drawing a card (D1–D3), an invalid action (X1–X3), hitting an enemy (E1–E3) and receiving player damage (P1–P3). The three families are tactile, magical and restrained retro sounds. Draw previews also include a seven-card sequence at 160 ms intervals.

Preview playback is manual and exclusive, with category tabs, a shared volume slider and one preference per category. Copy the four selected codes to choose them in chat. These are auditions; the active game cues are not replaced until selection. The selected C title intro, B Play cue and music sequence stay active.


### v0.43 — selected card and combat effects

The user's selected **D1 / X3 / E3 / P3** set is active: actual library-to-hand draws use Paper Slide, rejected actions use Retro Denied, enemy damage uses Retro Impact and damage to the player or allied creatures uses Retro Damage. Zero/countered hits and informational/success toasts stay silent. Graveyard returns, tutoring and Mill are not library draws.

Opening and multi-card draws are staggered at 160 ms for ordinary batches, independently of visual/reduced-motion settings. Larger bursts are compressed into a bounded audio window with gain compensation and a 24-voice ceiling. Short per-cue cooldowns merge simultaneous hits and prevent rejection spam. Buffers warm after a user gesture. Master mute, hidden tabs and leaving combat cancel queued draw effects; stale loads cannot replay a draw after the scene changes. The C → music sequence and B Play cue remain active.


### v0.44 — enemy Counterspell reactions

Rune Archivist and Tide Sphinx can hold **Counterspell (2 mana)** from encounter three onward. They are ready on even-numbered turns; a visible label shows ready, spent or next-turn status. The entire enemy team gets at most one such reaction per turn, and casting spends the caster’s reserved two mana. Mana cards and activated abilities are not spells.

The enemy responds after a player spell’s casting/additional costs are paid but before it enters or resolves. A reaction panel shows the enemy Counterspell and its target. The player can respond with instants, including their own counterspell or Booster Tutor, then continue. If stopped, the original spell resumes without another mana payment; otherwise one spell/copy is countered and its costs remain paid. Creatures, Equipment, Auras and Clone are supported. Killing the caster does not remove a Counterspell already pending. Original target restrictions and Ward still apply when the saved spell resumes.

The current combat phase and earlier spell window are restored after the reaction. The block-assignment panel temporarily yields its space to the reaction panel while retaining its assignments. Opening fights and encounter-two casters never gain this reaction.


### v0.45 — two waves in the last two fights

Encounters one and two remain single-wave fights. Encounters three and four have two waves: a smaller skirmish vanguard, followed by two elites in fight three or the boss and its support in fight four. The boss appears only in the last wave. The enemy header shows **WAVE 1 / 2** and **WAVE 2 / 2**, with a brief arrival fade/toast.

One battle object, life total, library, hand, player battlefield, Equipment/Auras, tokens, graveyards and exile carry across waves. Defeated enemies keep their normal coin bounties. Clearing during main phase preserves remaining mana, land drop, turn effects and attack usage; clearing in combat performs the normal turn cleanup once, untaps, and draws one card for the next turn. Incoming enemies start their own intention pattern and have arrival-turn summoning sickness. Old attack/block targets and combat callbacks are cleared.

Pending spells, Counterspell responses and all spell copies finish before a wave can advance. No reward booster, shop/camp transition or campaign victory occurs until the last wave is defeated. The library never refills at a transition, and a failed mandatory draw can still end the run.


### v0.46 — counter the enemy Counterspell

Enemy Counterspell reactions now explicitly show **YOUR RESPONSE** and a **Cast Counterspell · 2 mana** shortcut when that card is in hand (or another supported counterspell, using the cheapest payable option). The shortcut targets the pending enemy Counterspell and uses normal casting/payment rules; an unaffordable counter shows its required mana and cannot be cast. Instants glow in the hand during a reaction in main phase as well as during combat.

The original paid spell waits until the player continues. Countering the reaction changes the action to **Resolve your spell**; passing without countering is labelled **Let it resolve**. Normal hand casting and other instant responses remain available. Stale response controls cannot target a different spell or spend mana twice.

### v0.47 — click-to-use tokens and enemy keyword badges

Click a Treasure, Food or Clue token on the battlefield to open its action window. The window shows its effect, full activation costs (including tapping/sacrifice), and an explicit **Sacrifice** action. **Keep token**, Escape, backdrop clicks and controller Back cancel without paying. Token activation moved out of the hover/side inspector. The normal payment and single-use rules still apply; insufficient mana, tapped tokens and unfinished card choices disable activation. Availability refreshes with the battlefield, and a removed token or scene change closes its stale window.

Enemies now show larger, high-contrast colored keyword badges under their portraits, with explanations on hover. Ward keeps its numeric mana cost, Mill stays visible, and ready Counterspell reactions have a gold badge. Spent/next-turn Counterspell status updates as before. The fixed 16:9 battlefield reserves room for the badges above block/spell response controls.

### v0.48 — five-color mana icon

The shared mana display uses the requested five-color wheel instead of the diamond. The image is bundled locally, keeps its transparent background, and is displayed at 24 × 24 without changing mana/payment rules. The floating-mana indicator remains distinct. Matching image source: [MTG Wiki, 5Colors.png](https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/c/c8/5Colors.png).

### v0.49 — library progress and eight Reach creatures

The physical library displays **remaining / total run-deck cards** with a short label. The full deck/library review repeats this progress while in combat. The total includes cards in hand, on the battlefield, in graveyard or exile; drawing and enemy Mill reduce the remaining count, while Brainstorm can return cards to it. Cards temporarily inspected with Scry still count as library cards. Camp tokens and temporary Booster Tutor picks do not enlarge the permanent run deck.

The reviewed pool adds Canopy Spider, Grappler Spider, Thornweald Archer, Kessig Recluse, Rib Cage Spider, Sporecap Spider, Mammoth Spider and Archweaver: **112 bundled cards, 109 ordinary playable cards**, including **11 Reach creatures**. Each uses its oldest regular English paper printing and a bundled card image. Printed costs and stats are unchanged; Reach, Deathtouch and Trample use the existing combat rules. They are available in boosters, Creature packs, shops and the filtered collection.

Silver-border candidates reviewed for a future expansion (not in this release): Growth Spurt (D6 temporary boost), Elvish Impersonators (two D6 determine base stats), Goblin Tutor (D6 chooses the searched card type), and Jack-in-the-Mox (risky die-based mana artifact, adapted to the shared generic pool). Their complete rules need implementation before they can enter the verified pool.

### v0.50 — visible animated dice and the first two silver-border spells

Growth Spurt and Elvish Impersonators join the verified pool, using their original English Unglued images. Growth Spurt rolls one D6 for a temporary +X/+X bonus; Elvish Impersonators rolls two independent D6 for its base power and toughness as it enters. A Clone copying Elvish Impersonators rolls its own fresh values. The pool contains **114 bundled cards / 111 ordinary playable cards**.

A 3D ivory-and-gold die visibly tumbles and settles on the actual rules result. Power and Toughness dice are labelled separately. Numerical results and the effect remain on screen until **Continue**; results are generated once per die and cannot be rerolled by reopening or rendering. Reduced-motion mode shows the same result without spinning. Escape/controller Back waits during a roll, then continues with that result once settled.

Casting costs, target choices, enemy Counterspell and Ward resolve before dice are rolled. A countered spell does not roll. Each Growth Spurt copy rolls separately and uses its original target; the bonus expires normally and is not a permanent counter. Combat timers and further casting wait until the dice result is applied. Stale timers, repeated confirmations and abandoned scenes cannot apply an old result. Elvish Impersonators enters once with summoning sickness; enter-the-battlefield life gain uses the rolled toughness.

### v0.51 — four more dice cards

Goblin Tutor, Jack-in-the-Mox, Adorable Kitten and Mother Kangaroo join the verified pool with their oldest regular English paper images. The pool now has **118 bundled cards / 115 ordinary playable cards**. All four use the existing visible D6 animation and retain their actual rolled result.

Goblin Tutor rolls before opening a filtered, sorted library search: 1 does nothing; 2 finds Goblin Tutor; 3 an enchantment; 4 an artifact; 5 a creature; 6 an instant or sorcery. Reveal one matching card and put it into your hand, then shuffle. You may fail to find; no eligible cards also causes a shuffle. Searching is not drawing. Copies roll and search separately, costs are paid once, and the combat/Counterspell continuation waits until the search is finished. The window supports mouse, keyboard and controller, scrolls internally, and closes safely on scene changes.

Jack-in-the-Mox casts as an artifact spell. Its activated ability pays tapping before rolling and cannot be countered as a spell: 1 sacrifices the Mox and loses 5 life; 2–6 produce one floating generic mana under the shared-mana rules. A surviving Mox remains visibly tapped until the next ordinary turn untaps permanents. Adorable Kitten enters as a 1/1, then rolls for life gain. Mother Kangaroo enters as a 1/1, then rolls for that many permanent +1/+1 counters. A Clone copying either Host creature enters with printed base stats and triggers its own roll; it does not copy old counters. Countering the creature spell prevents entry and its trigger.

### v0.52 — enemy spell permission dice and prepaid Ward warning

Before an enemy can cast Counterspell, Shock, Lava Spike or Sovereign's Bite, it visibly rolls a D6: **4–6 permits the cast; 1–3 fails**. The enemy and intended spell are named, with the required threshold shown during the animation. Successful casts retain the player's normal instant/counterspell response window. Failed attempts do not create spells, spend casting mana, deal damage or enter the spell graveyard. Counterspell keeps its existing even-turn readiness and one team attempt per turn; a failed roll consumes that attempt and is labelled **Counterspell failed**. Other scheduled spells check independently and sequentially. A source that leaves before its check cannot cast; a spell already cast remains independent of its source. Normal attacks, Mill and other nonspell abilities do not need this check.

Selecting a Ward target now prompts **before any casting costs are paid** when available mana after the spell cannot pay its Ward cost. The warning shows spell cost, Ward cost, available/remaining mana and the total for spell copies. **Cancel · pay nothing** keeps the card, mana, discard/sacrifice costs and Doublecast use intact; it also preserves the enemy's counter attempt. **Cast anyway** commits the normal costs once, then proceeds through enemy checks and the existing Ward payment decision. The same gate covers clicks, controller choices and pointer dragging. Changed costs/targets require a fresh decision; stale confirmations cannot spend resources. Check and warning windows hold combat continuations, fit the fixed game canvas, and close safely on scene changes.

Existing response/payment browser suites use a fixture that fixes enemy checks to success and acknowledges only those checks; dedicated reaction tests exercise visible animations, all success/failure branches, unpaid Ward cancellation, physical mana, drag-and-drop and controller Back.
