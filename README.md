# Booster Tutor

**Booster Tutor** is a browser-based, unofficial mana roguelike demo with booster drafting, creature combat, and a boss run.

**Demo version: 0.7**

## Play

This is a static website with no build step. GitHub Pages can serve the files; the workflow in `.github/workflows/pages.yml` is ready to run manually.

For a local preview, start a static web server in the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. On startup, the game loads real card data and images from the Scryfall API. The selection is cached in the browser for 12 hours; a small set of demo cards is available offline.

## Game systems (0.7)

- Draft one card from each of three five-card boosters. Each pick adds four copies; four starting creatures make a 16-card deck. No lands are required.
- **Only generic mana:** the displayed cost is the card's total mana value. Colours never restrict casting. Printed original card images still contain their original Magic symbols.
- Start a fight with 3 mana. Refill every turn; capacity grows by 1 every two turns, up to 6. Aether Crystal adds 1 starting mana (the cap remains 6).
- Choose a permanent run relic: Aether Crystal for mana, or Ancient Ward for 4 shield at the start of each fight.
- Four encounters on a visible adventure path lead to the Shard Dragon. Life carries between fights. After each reward, rest for 10 life or study to add a utility spell.
- Draw five cards, refill your hand at the start of each turn, and recycle the graveyard when the library runs out. One free opening mulligan is available before your first action.
- Click or drag to cast. Up to three allied creatures may be in play. Click a creature to hold it back, then choose an enemy attacker and your blocker during the blocking phase.
- Flying, reach, first strike, double strike, deathtouch, haste, and lifelink have simplified combat implementations. Artifact creatures retain the prototype's immediate-attack rule.
- Card effects use the prototype's text interpretation and explicit demo effects. Unrecognized spells deal generic damage. This is **not a full Magic rules engine**; complex card text is not faithfully simulated.
- Progress lasts for the current page session. No saved runs or account are implemented.

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
