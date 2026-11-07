# Booster Tutor — The Aether Expedition

**Version 0.24** · A free, unofficial browser roguelike demo with genuine Magic cards and an explicitly adapted ruleset.

Play: https://theyogi1999.github.io/BoosterTutor/

## Run locally

```sh
python3 -m http.server 8000
```

No build step or runtime dependencies. Every scene uses the same 1600×900 (16:9) canvas: home, loading, sealed/open boosters, camp, shop, combat and the end screen. One uniform scale fits the entire frame inside the visible browser area, including phones and iPads in portrait orientation; spare space becomes letterboxing. Deck, graveyard, scry and confirmation dialogs also use 16:9 frames. Scenes do not scroll; longer dialog content can scroll inside its frame. Fullscreen is available.

## Draft, deck and card zones

- The curated list in `card-pool.txt` contains 389 Magic card names. At the start of a run, the game resolves the list through Scryfall and loads card text, mana values, keywords and original images. The verified bundled cards remain available as the offline fallback.
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
- Data verification means source metadata and original images match Scryfall. Combat remains an adapted monster-duel ruleset; Cancel interrupts a monster's attack for the turn instead of using a full spell stack.

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
