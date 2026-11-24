# Portrait presentation, shop keywords and motion — v0.104

The title canvas now renders at its actual displayed dimensions with a capped device-pixel ratio and a uniform camera centered on the three-card fan. Portrait layouts no longer stretch the original 16:9 drawing. The existing title, menu and three Booster Tutor cards retain their layout and flip/reveal animation. Resize and reduced-motion still frames repaint the same camera. Title-card corners use proportional circular radii; hand, field, selection and flying card frames have smaller corners.

The encounter receipt’s falling cards have opaque front/back faces and an opaque falling carrier throughout the animation. Their varied speeds, depth, rotation and flips remain. Removing fractional opacity from the 3D carrier also avoids an opacity compositing group around its two-sided rendering. The fall endpoint follows the usable scene height when the screen rotates or resizes. The layer remains inert behind the readable receipt and cannot intercept Continue; reduced motion hides it.

## Run counters

Trample remains available at 15 coins. Added:

| Counter | Price | Actual behavior |
| --- | ---: | --- |
| Reach | 12 | Attack Flying monsters and block Flying attackers. |
| First strike | 19 | Deal damage in the first-strike step. |
| Double strike | 30 | Deal damage in both combat damage steps. |
| Menace | 16 | Require two blockers; lone duel monsters cannot retaliate. |
| Hexproof | 24 | Prevent enemy targeted spells; your own spells remain legal. |

The shop still draws three distinct offers per shop and keeps them on revisits. Each purchase upgrades only the chosen physical creature card for the run, with the existing foil/seal/colored keyword presentation. Canonical first/double-strike names map to the real combat flags. Persistent battlefield objects immediately see newly purchased keywords, including the Immortal mode. Mystery counters may reveal the new types and exclude redundant abilities. Costs, cancellation and stale-purchase validation retain their existing behavior.

## Motion

- One shared impact manager handles player damage, real enemy damage, actual enemy defeats, large creature entry and each new pack opening. Deaths and overlapping hits coalesce into at most one active shake per surface.
- Impacts last roughly 180–242 ms and peak at five physical pixels, or six for player damage. Amplitude compensates for battlefield scale, so phone feedback remains visible without increasing the physical limit. Impact translation never replaces the scene or drag transform. Pack feedback moves the card area, leaving the heading and Continue stationary. Repainting the same opened pack does not add another impact.
- Hover/drag hit areas keep their original positions. A separate art wrapper in each hand card sways by at most two logical pixels and ±0.28 degrees over 5.4–7.12 seconds. Physical-card identity keeps its phase through ordinary re-renders. Hover, focus, selection, dragging, arrivals and landings return the image to a neutral pose. Dialogs pause idle motion.
- Reduced motion disables shakes and idle motion. Hidden tabs pause idle cards and cancel impacts. Scene changes, blur, resizing and pointer input cancel existing impacts. Active drags and landing animations suppress new shakes. None of these effects changes rules, mana, coins, targeting, card zones or action timing.

## Verification

274 rule and regression tests passed, including ten shop-keyword cases for transactions, physical identity, replay, turn persistence, run expiry, real combat steps, Hexproof targeting and live persistent upgrades.

```sh
node --test tests/shop-keywords.test.cjs tests/finish-mystery.test.cjs tests/warleaders.test.cjs tests/legendary-cards.test.cjs tests/reviewed-cards.test.cjs tests/jester-family.test.cjs tests/immortal-first-strike.test.cjs tests/protection.test.cjs tests/sliver-hive.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/counters-poison.test.cjs
node tests/presentation-polish-browser.test.cjs
node tests/drag-motion-browser.test.cjs
node tests/title-intro-browser.test.cjs
node tests/booster-view-browser.test.cjs
node tests/fitted-stops-browser.test.cjs
```

Browser coverage includes seven title viewport sizes, three opaque-receipt sizes, real shop purchase, art-only idle motion with fixed hit areas, neutral hover, player/enemy/large-summon/pack impacts, physical phone shake amplitude, reduced-motion/hidden/scene cleanup, existing velocity drag and uniform landings, four intro layouts, fifteen booster safe-area cases and ten fitted shop/receipt sizes. Historical Mystery tests now fill the current keyword set when testing redundancy and check the original pack types by identity rather than assuming no later packs exist.
