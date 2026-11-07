# Booster Tutor — The Aether Expedition

**Version 0.14** · A free, unofficial browser roguelike demo with genuine Magic cards and an explicitly adapted ruleset.

Play: https://theyogi1999.github.io/BoosterTutor/

## Run locally

```sh
python3 -m http.server 8000
```

No build step or runtime dependencies. The English interface uses a fixed 1600×900 canvas scaled to the window. Compact top/bottom bars leave more room for the arena: your cards left, monsters right, a large inspector at the edge, and a physical Library pile beside your hand. Fullscreen is available. Small windows scale the whole table down; desktop 16:9 is the primary target.

## Draft, deck and card zones

- The curated list in `card-pool.txt` contains 389 Magic card names. At the start of a run, the game resolves the list through Scryfall and loads card text, mana values, keywords and original images. The verified bundled cards remain available as the offline fallback.
- Open six packs individually, with seven cards each. Pick one card per pack and receive two copies of each pick. Four basic mana cards complete the 16-card starter deck; there are no extra starter creatures.
- Each opened pack has one free reroll. It replaces seven cards and clears only that pack's selection. Reward packs also contain seven cards.
- The global Deck button and the camp's **Review your deck** button show grouped copies, mana statistics and a card search. Deck inspection works between encounters and turns.
- The Library is a physical face-down stack to the right of the hand. Click it to inspect remaining cards grouped and sorted; upcoming draw order is not exposed.
- Used spells, dead creatures and their auras enter the graveyard. When the library is empty, the graveyard is shuffled back in. Exiled cards never join that recycle. Exile lasts for the encounter; your run deck is restored for the next encounter.
- Unmake exiles a selected monster; dragging it directly onto an allied creature exiles that ally. Its auras go to the graveyard and its equipment remains unattached. The Exile viewer displays both cards and banished monsters.

## Coins, shop and verified catalog

- Every defeated or exiled monster pays its displayed bounty once. Coins persist through the run and reset with a new run.
- After a reward pack, visit a shop with exactly three distinct cards. Each offer sells one extra copy for your run deck; sold offers stay sold when returning from camp. Prices are 6 + 3 × mana value. You can leave without buying.
- The start screen opens the curated card catalog, with name/text search, type, mana, printed keyword and colour filters. Cards link to their Scryfall source. The catalog and boosters use the same dynamically loaded pool.
- Printed keywords in this pool have explicit support: flying, reach, lifelink, deathtouch, first/double strike, haste, vigilance, trample, menace, defender, flash, enchant, equip and scry. Monsters can have combat keywords, shown under their intentions.
- Scry opens an ordered top-card chooser: keep cards on top, move them to the bottom, or swap their order. Omen scries before its draw and can be sacrificed for 3 mana to scry again. Fountain of Renewal gains life each upkeep and can be sacrificed for 3 mana to draw. Angelic Chorus gains life equal to an entering creature’s toughness; Llanowar Elves taps for generic mana after sickness ends. Rancor returns to hand when its host leaves. Juggernaut must attack when able and cannot be blocked by Walls.
- Data verification means source metadata and original images match Scryfall. Combat remains an adapted monster-duel ruleset; Cancel is explicitly marked as an adapted counterspell that grants shield, without a full stack.

## Mana, hand and life

- Only generic mana is required: pay the card's total mana value. Printed images retain their original symbols.
- The starter deck contains four basic mana cards. Two begin untapped on the battlefield and two stay in the draw pile. Draw mana cards, then play one during your main phase; it enters untapped, taps to pay generic costs, and untaps at the start of your next turn. There is no automatic mana refill or colour requirement.
- Start each run at 20 life. Life carries between encounters. Aether Crystal adds one floating mana at the start of each later turn; Ancient Ward grants 4 shield at the start of each battle.
- Draw seven opening cards and refill to at least seven each turn. Extra draws may grow the hand beyond seven without discarding excess. The fan adapts to its actual size. A free opening mulligan is available before your first action.
- Healing, resting and lifelink can raise life above 20. Life displays use numbers, not bars. Each enemy has its own life total and bar.

## Individual attacks and retaliation

- Every creature has its own target selector and **Attack now** button. Drag a ready creature onto a monster to attack immediately, or click its card to queue it for the global End turn action.
- Monsters deal their power back when legally able to block the attacking creature. Flying/reach and menace apply to retaliation. Normal damage in each duel is simultaneous. First strike may kill before retaliation; double strike uses two damage steps. Damage marked on allied creatures persists until turn cleanup.
- A creature attacks at most once per turn. Attacking normally taps it. **Vigilance** leaves it untapped, so it can still block, but does not grant another attack.
- Every creature, including artifact creatures and monsters, has summoning sickness unless it has haste. New creatures appear grey and may block immediately. Haste lets a creature join the current turn's combat phase. Tapped creature faces rotate sideways; vigilance attackers stay upright.
- Planned attack arrows remain visible throughout combat. Each allied arrow uses that creature's own target. Enemy routes point at your life or the assigned blockers. Animated, glowing SVG routes do not intercept clicks or drops.

## Blocking and instant responses

- Multiple allied creatures may block one monster. Select an attacker, then click or drag any number of untapped legal blockers onto it. Click a selected blocker again to remove it; assigning it elsewhere moves it. A blocker belongs to one attack only.
- Selection order is damage-assignment order. The attacker assigns lethal damage to earlier blockers and any remaining damage to the last. All surviving blockers return their damage together. Trample assigns lethal damage to blockers and sends excess damage to your life; allied trample spills past a defeated target to another monster. Menace requires at least two blockers. Flying requires flying or reach to block.
- **Instants can be cast in every combat phase**, provided their mana cost can be paid. Flash cards, including Omen of the Sea, are also playable in these windows. Other cards remain restricted to the main phase.
- Before attack, enemy action and damage resolution, a payable instant opens an explicit priority window. Cast any responses you want, then choose **Continue**. Without a payable instant, the phase advances after a short visible beat. There is no full Magic stack/counterspell engine.
- An instant that removes a target or blocker updates assignments before damage. Attacks do not silently redirect to another monster if a declared target leaves. Timers from abandoned runs cannot affect a new run.

## Permanents, modifiers and controls

- Noncreature artifacts/enchantments stay for the encounter. Recognized static bonuses affect allied creatures; other unattached permanents grant 1 shield on entry and at each turn start, as stated in the inspector.
- Auras choose an allied host when cast. Equipment pays its printed Equip cost in generic mana each time it is attached or moved, during your main phase. Casting and equipping are separate costs; dragging equipment directly from your hand onto a creature pays both. Attached cards sit physically beside their host in an overlapping rail; equipment can be dragged to another host. The free permanent zone holds unattached equipment and global enchantments.
- **Green** stat chips show persistent modifiers, including counters, equipment and auras. **Amber EOT** chips show temporary bonuses. Total power/toughness reflects both; temporary bonuses expire at cleanup.
- Hand tooltips show actual implemented effects and casting availability above the hovered card. Battlefield cards retain the large side inspector. Mouse/touch/pen dragging holds the card at the grabbed point; legal zones highlight and Escape cancels without spending mana.
- Thirteen original stereo sound cues use a shared decoded sprite, category levels, compression, a voice cap and short fades. A mastered booster Foley plays with seven staggered reveal glints. Muting stops all sounds; reduced-motion settings disable reveal glints.

## Progression and limits

Four encounters lead to the Shard Dragon. Each run draws four distinct stages from ten country regions; the battlefield receives a subtle color tint for its location. Choose one of four planeswalker avatars on the start screen; your selection is saved in the browser. After rewards and the card shop, rest for 10 life or study to add a Divination. Run progress lasts for the current page session.

This is **not a full Magic rules engine**. Effect descriptions and execution share the same effect plan, but unrecognized spells and permanents use the stated roguelike interpretations. Instants do not implement the complete Magic stack, protection rules are not simulated, and monster combat is an adapted duel system. This is a free, non-commercial fan demo for entertainment; it is not affiliated with or endorsed by Wizards of the Coast.

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
```

The suites cover pointer drags, cancellation, large hands, uncapped healing, packs/rerolls, audio, layout bounds, English UI, card-zone inspection, individual attacks, retaliation, vigilance, priority windows, multi-blocks, exile and modifier expiry. Temporary screenshots go into ignored `work/`.

## Assets and publication

Card metadata and original images were retrieved from [Scryfall](https://scryfall.com). The Library uses the original Magic card back supplied by Scryfall. Card images/text belong to their respective rights holders. Environmental SVGs, monster illustrations, and audio are original assets for this prototype. The project is not endorsed by Wizards of the Coast and does not claim permission under the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).

`.github/workflows/pages.yml` publishes changes pushed to `main` automatically, and can also be run manually.
