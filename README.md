# Booster Tutor — The Aether Expedition

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
