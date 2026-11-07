# Booster Tutor

**Booster Tutor** is a browser-based, unofficial mana roguelike demo with booster drafting, creature combat, and a boss run.

**Demo version: 0.8**

## Play

This is a static website with no build step. GitHub Pages can serve the files; the workflow in `.github/workflows/pages.yml` is ready to run manually.

For a local preview, start a static web server in the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. On startup, the game loads real card data and images from the Scryfall API. The selection is cached in the browser for 12 hours; a small set of demo cards is available offline.

## Game systems (0.8)

- Draft one card from each of three seven-card boosters. Each pick adds four copies; four starting creatures make a 16-card deck. No lands are required.
- **Only generic mana:** the displayed cost is the card's total mana value. Colours never restrict casting. Printed original card images still contain their original Magic symbols.
- Start a fight with 3 mana. Refill every turn; capacity grows by 1 every two turns, up to 6. Aether Crystal adds 1 starting mana (the cap remains 6).
- Choose a permanent run relic: Aether Crystal for mana, or Ancient Ward for 4 shield at the start of each fight.
- Four encounters on a visible adventure path lead to the Shard Dragon. Life carries between fights. After each reward, rest for 10 life or study to add a utility spell.
- Draw seven cards, refill your hand at the start of each turn, and recycle the graveyard when the library runs out. One free opening mulligan is available before your first action.
- Click or drag to cast. Up to three allied creatures may be in play. Click a creature to hold it back, then choose an enemy attacker and your blocker during the blocking phase.
- Flying, reach, first strike, double strike, deathtouch, haste, and lifelink have simplified combat implementations. Artifact creatures retain the prototype's immediate-attack rule.
- Card effects use the prototype's text interpretation and explicit demo effects. Unrecognized spells deal generic damage. This is **not a full Magic rules engine**; complex card text is not faithfully simulated.
- Progress lasts for the current page session. No saved runs or account are implemented.

## Table and card interactions (0.8)

- Packs open **one at a time**. Click a sealed foil pack for a light burst, particles, a staggered seven-card reveal and synthesized opening sound. Choose one card, then continue to the next pack. Sound can be muted; reduced-motion preferences disable the animations.
- The hand fans seven full card faces into an arc. Hover or keyboard focus lifts a card and opens a readable text bubble above it (or below when space is limited). Added cost/status overlays are removed. The bubble can be scrolled when needed.
- Bubbles describe the implemented roguelike effect, generic cost, current creature values, keyword meanings, attachment target and casting availability. Spell descriptions and execution share one effect plan. Original printed card images remain unchanged.
- All creatures, enchantments, equipment and auras show complete card faces with status outside the card. The site uses a new card-fan wordmark and larger interface typography.
- Noncreature artifacts and enchantments stay on the battlefield for the current encounter. Recognized static stat bonuses affect your creatures; other unattached permanents give 1 shield on entry and at each turn start (the demo Aether Aegis gives 2). The rules bubble states this interpretation.
- Auras require an allied creature target before mana is spent. Equipment enters unattached; click it and an allied creature to attach or move it for free. Recognized stat/keyword bonuses apply while attached; otherwise attachments grant +1/+1. Auras die with their host; equipment remains and can be reassigned.
- A visible graveyard pile opens into a full-card gallery. Used spells, dead creatures and their auras go there. The existing graveyard recycle rule remains.
- The blocking panel shows attacker/blocker pairs and predicted unblocked damage after shield, plus auto-assignment and reset controls. Dragging and click-to-assign are supported. First-strike blockers now act in the first damage step against normal attackers.

## Validation

Requires Node.js 20+ for tests, no runtime dependencies:

```sh
node --check game.js
node --test tests/game.test.cjs
```

Tests cover generic mana across colours, spell spending, mana growth, persistent life, relic mana, combat keywords, and the land-free starter draft. Browser and visual QA must be performed separately.

## Card data, images, and fan project notice

Card data and images are loaded from Scryfall at runtime; they are not stored in this repository. Scryfall is an independent card database, not the official Wizards of the Coast website. Card images and text belong to their respective rights holders. This project is not endorsed or sponsored by Wizards of the Coast.

The Wizards [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) has limits on the use of Wizards IP in games, including free games. Review the policy before distributing the demo publicly; this project does not claim permission from Wizards.

## GitHub Pages

1. In the repository settings under **Pages**, select **GitHub Actions** as the build source if it is not already selected.
2. Push changes to `main` or manually run the workflow under **Actions → Deploy GitHub Pages → Run workflow**.
3. The published URL is shown in the workflow run under **Deploy**.
