# Combat planning, route choices and deck composition — v0.106

## Combat preview

Use **Preview** on the battlefield, press **V**, or hover/focus one of your creatures. The small pointer preview does not intercept clicks or dragging; the full dialog also works with touch and controller navigation. During Main/Your attack the dialog uses queued attackers; during Block/Damage it uses the current blocker assignments. Hovering an individual attacker previews its attack against the selected legal target.

The preview reports damage per creature/monster, deaths, Persist returns, remaining enemy life, your resulting life, Lifelink gains, attacking tokens, attack draws and additional combats. It runs the existing combat resolver, including First/Double strike, simultaneous damage, Deathtouch, Trample, protection, Indestructible, Lure and replacement/prevention effects such as Gisela, Questing Beast and The One Ring. Ward shows its cost and current affordability; attacks never pay Ward. An invalid Flying target or incomplete Menace block receives an explanation.

This is a forecast of the current assignments with no additional spells or activated abilities. Random attack triggers and unresolved optional/target choices are explicitly marked as estimates. The preview never chooses targets or dice outcomes for the player. Draws consume only a shadow Library count and never expose the next card's identity; an empty-Library attack draw is flagged. Pending spells, choices and rolls must finish before a forecast can run.

Implementation: a synchronous deep copy preserves data aliases, arrays, Maps and Sets while excluding DOM objects. The real rules run against the copy with audio, rendering, reward/storage paths, timers and animation hooks muted. Deterministic queued triggers settle on the copy. State references, function bindings, timers and gameplay RNG are restored in `finally`, including early exits. Browser tests check actual lethal previews against live DOM, storage and real card identities. A stale attack whose explicit target becomes illegal is now withdrawn before declaration without tapping or retargeting it.

## Route choices

After choosing the usual camp supply, select a route and confirm with **Continue** at the upper right. Prepared decks enter the route screen directly without opening starter boosters. Three paths are available:

| Path | Encounter |
| --- | --- |
| Guarded road | Normal enemies and bounty |
| Elite patrol | Every wave gets +25% maximum life, +1 power and 50% more kill bounty, rounded up |
| Event | Review a trade or leave freely, then face the normal encounter |

Events cycle by encounter number:

| Event | Choices |
| --- | --- |
| Bloodstained altar | Offer 4 life for 12 coins, only if at least 1 life remains; or leave |
| Wandering runesmith | Pay 8 coins for a +1/+1 run counter on one chosen physical creature copy; or leave |
| Forgotten cache | Pay 6 coins for two Treasure, take one free Food, or leave |

Browsing and selecting do not spend resources. Confirmation rechecks the run, encounter, ticket, balance and selected physical card, then records the committed route once. Double/stale confirmation cannot repeat a trade or create another camp supply. A guardian is never skipped, including on event paths. Actual enemy bounty drives the existing receipt, coins and shop loop.

Immortal Expedition preserves the same battlefield, attachments, hand, Library, graveyard and exile across camp and route selection. Existing run-counter synchronization upgrades an on-field creature once, and newly acquired supplies deploy normally. Future reinforcement waves receive elite modifiers once per enemy.

## Compact deck overview

The route screen and **Deck/Library** windows show total physical cards, creatures, instants/sorceries, other nonland permanents, mana cards, average nonland cost and an eight-bucket generic mana curve (0 through 6, then 7+). Mana cards are excluded from the curve/average; X uses its base cost. Filtering the card list does not change whole-zone totals or reveal Library order.

Deck/Library filters fold behind a **Filters** button while search stays visible. Only the card list scrolls. The new screens fit desktop, phone landscape and portrait; the short-landscape forge keeps composition counts and the target selector visible, with the full curve available in Review deck. Controller Continue shows the selected Xbox/PlayStation/Nintendo glyph.

## Title rain

After the existing vortex finishes, each MTG-backed rain card starts fully above the title's visible top edge. Positive staggered delays and backwards fill hold delayed cards offscreen. Entry distance accounts for card dimensions and perspective; resizing updates that clearance. Cards descend and flip at their existing varied speeds and depth layers without fading/popping into arbitrary onscreen positions. Receipt rain retains its already flowing start. Reduced motion, hidden-tab pause, title re-entry and early Play cleanup retain their existing behavior.

## Validation

```sh
node --test $(rg --files tests -g '*.test.cjs' | rg -v 'browser')
node tests/tactics-browser.test.cjs
node tests/warleaders-browser.test.cjs
node tests/depth-scenes-browser.test.cjs
node tests/title-intro-browser.test.cjs
node tests/fitted-stops-browser.test.cjs
```

The complete nonbrowser run passes **577 tests**, including 24 new tactical/route/profile cases. Historical bundled-card counts were updated to the existing 238-card catalog, retaining each fixture's deliberately limited rule-module coverage. Browser coverage includes nonmutating lethal previews, actual hover/V/dialog navigation, composition/curve and filtering, seven fitted viewports down to 568×320 and 320×568, forge target selection, three controller layouts, elite combat, persistent Immortal upgrades, a prepared-deck start and the real reward/shop/camp/route loop. Existing regressions cover nine combat legends, intro/rain cleanup and depth ordering, and ten no-scroll shop/receipt layouts.
