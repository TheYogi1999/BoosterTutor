# Booster Tutor — The Aether Expedition

**Version 0.9** · An unofficial browser roguelike using real Magic cards and a simplified, explicitly described ruleset.

## Play

Open https://theyogi1999.github.io/BoosterTutor/ or serve this static checkout:

```sh
python3 -m http.server 8000
```

There is no build step and no runtime dependency. The interface uses a fixed **1600 × 900** canvas scaled to fit the window, preserving the 16:9 layout. A fullscreen button is provided. Your cards stay on the left, monsters on the right, the hand at the bottom, and a large battlefield-card inspector at the far right. Very small windows scale the whole interface down; this version prioritizes desktop 16:9 play.

## Real cards and packs

- The 32-card pool in `cards.js` contains genuine, normal-layout Magic cards verified against Scryfall. Original full-card JPEGs ship in `assets/cards/`. There are no invented starter or fallback cards. Network access to Scryfall is no longer needed to play.
- Start with three packs of **seven cards**, opened individually with foil, light, particles and synthesized sound. Sound can be muted and reduced-motion settings disable animations.
- Choose one card from each pack; each choice adds four copies. Two Grizzly Bears and two Savannah Lions complete the 16-card starter deck.
- Each opened pack has one free **reroll**. It replaces all seven cards, removes that pack's selection, and preserves picks from other packs. Reward packs also contain seven cards and receive one reroll.
- Printed original Magic symbols remain on the images. **Payment uses only generic mana** equal to total mana value.

## Combat and progression

- Start with 3 mana and refill it every turn. Capacity grows by one every two turns, up to 6. Aether Crystal adds one initial mana; Ancient Ward supplies four starting shield instead.
- Draw **seven hand cards**, refill to seven each turn, and recycle the graveyard when the library runs out. One free opening mulligan is available before the first action.
- A fanned hand lifts on hover/focus. A text bubble directly above the hand card explains what it actually does in this game, its generic cost and casting availability. Battlefield cards use the separate large inspector, including their current values.
- Drag or click to play. Creatures and permanents go to the left battlefield. Drag a spell onto a monster to select its target. Drop an aura/equipment directly on an allied creature to attach it. Equipment already on the battlefield can also be dragged onto a different creature. Mouse drag and touch/pen drag use separate event lifecycles.
- Noncreature enchantments and artifacts remain for the encounter. Recognized stat bonuses affect allied creatures; other unattached permanents give 1 shield immediately and at each turn start. Attachments use recognized stat/keyword bonuses, otherwise +1/+1. Equipment can be moved for free. Auras die with their host; equipment remains.
- Monsters have independent illustrations, health, shield and visible **attack / guard / strengthen intentions**. They are not Magic-card enemies. Guard grants 5 shield; strengthen adds 1 attack. Their deterministic action cycles are shown before ending the turn.
- Allied creatures attack the selected monster. Monsters do not automatically block those attacks or retaliate. During enemy attacks, creatures held back can be assigned as blockers by dragging or clicking. Flying, reach, first strike, double strike, deathtouch, haste and lifelink have simplified implementations. Artifact creatures retain the prototype's immediate-attack rule.
- The blocking panel shows pairs, direct incoming damage after shield, auto-assignment and reset. Used spells, dead creatures and their auras enter the visible graveyard/gallery.
- Four encounters lead to the Shard Dragon. Life carries between fights. After a reward, rest for 10 life or study to add a real Divination card.
- This is **not the complete Magic rules engine**. Effect descriptions and execution share one effect plan. Unsupported spells become generic damage; permanent effects use the interpretation stated in their inspector. Run progress is held for the current page session.

## Validation

Logic tests require Node.js 20+:

```sh
node --check game.js
node --check cards.js
node --test tests/game.test.cjs
```

The browser regression requires Playwright and Chromium, plus a running static server. Set `CHROMIUM_PATH` if Chromium is elsewhere:

```sh
BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/browser.test.cjs
```

It checks seven-card packs, rerolls, image loading, the anchored hand bubble, the large inspector, native mouse drags for creatures/auras/equipment/spells/blockers, turn refill, console errors, and 1280×720 / 1920×1080 viewport boundaries. Temporary screenshots go into `work/`.

## Assets and fan project notice

Card metadata and original card images were retrieved from Scryfall, an independent card database. Images and text belong to their respective rights holders. The environmental SVG and monster illustrations are original artwork for this prototype. The project is not endorsed or sponsored by Wizards of the Coast.

The Wizards [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) has limits on the use of Wizards IP in games, including free games. This prototype does not claim permission from Wizards.

## GitHub Pages

`.github/workflows/pages.yml` publishes changes pushed to `main` automatically and can also be run manually. The published URL appears in the deployment workflow. Keep generated screenshots, analysis scripts and local browser data out of published source.
