# Booster Tutor

**Booster Tutor** is a browser-based, unofficial mana roguelike demo with booster drafting, creature combat, and a boss run.

**Demo version: 0.6**

## Play

This is a static website with no build step. GitHub Pages can serve the files; the workflow in `.github/workflows/pages.yml` is ready to run manually.

For a local preview, start a static web server in the project folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. On startup, the game loads real card data and images from the Scryfall API. The selection is cached in the browser for 12 hours; a small set of demo cards is available offline.

## Game systems

- Start with three boosters of five cards each. Choose one card from every booster; each pick adds four copies to your deck.
- Your starter deck also contains ten basic lands. Play up to one land per turn. Every land adds one shared mana, and any land can pay any card's total mana value. Colored symbols remain visible on cards but do not restrict payment.
- Draw five cards at the start of a fight and automatically refill to five cards after each turn. If your library runs out, your graveyard is shuffled back in.
- Before your first action in each fight, you can take one free mulligan and draw five new cards.
- Play creatures by dragging them onto your battlefield or clicking them in your hand. Creatures attack at the end of your turn unless you click one to hold it back. Held-back creatures can block enemy attackers. Click an enemy attacker, then click one of your creatures to block it; you can also drag your blocker onto an attacker.
- Each encounter starts with a team of creature-card enemies. They do not draw or cast cards. Every enemy has its own life bar and can be defeated by combat or spell damage. Enemies with summoning sickness wait until the next turn before attacking; haste can attack immediately. Artifact creatures are exempt from summoning sickness in this prototype.
- Creatures that die go to your graveyard. Spells go there after you cast them. Open the Graveyard button to inspect the pile.
- Flying can only be blocked by flying or reach. First strike and double strike use separate damage steps; deathtouch destroys creatures, and lifelink restores life. Recognized “until end of turn” effects expire after combat.
- The booster opening has a card reveal animation and synthesized sound. You can turn sound off in the top bar.
- Your life resets to 30 before every fight.
- Some card text is interpreted through patterns for damage, healing, card draw, creature buffs, counterspells, and tokens. Unrecognized spell effects use a simple mana-based damage effect. This is a roguelike interpretation, not a complete Magic rules simulation.
- After each encounter, choose a card as a reward. The fourth fight is the boss.

## Card data, images, and fan project notice

Card data and images are loaded from Scryfall at runtime; they are not stored in this repository. Scryfall is an independent card database, not the official Wizards of the Coast website. Card images and text belong to their respective rights holders. This project is not endorsed or sponsored by Wizards of the Coast.

The Wizards [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) has limits on the use of Wizards IP in games, including free games. Review the policy before distributing the demo publicly; this project does not claim permission from Wizards.

## GitHub Pages

1. In the repository settings under **Pages**, select **GitHub Actions** as the build source if it is not already selected.
2. Push changes to `main` or manually run the workflow under **Actions → Deploy GitHub Pages → Run workflow**.
3. The published URL is shown in the workflow run under **Deploy**.
