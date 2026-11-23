# Combat legends and token engines — v0.103

Nine additional real MTG cards are available in ordinary matching packs, shop card offers and the searchable collection. All costs use the existing generic mana system. Card rules use the fetched Scryfall Oracle text and rulings; local art uses the original English expansion printing (Gisela uses Avacyn Restored, rather than a later alternate illustration or preview promo).

## Cards and printed art

- [Primordial Ooze](https://scryfall.com/card/5ed/261/primordial-ooze?utm_source=api) — Legends, 1994-06-01; art print `a46e47e1-8639-48f7-94c4-5f9e9666839a`.
- [Aurelia, the Warleader](https://scryfall.com/card/fdn/651/aurelia-the-warleader?utm_source=api) — Gatecrash, 2013-02-01; art print `4ec18e35-05e4-4bfc-b32b-c3e71c95a71d`.
- [Aurelia, the Law Above](https://scryfall.com/card/mkm/188/aurelia-the-law-above?utm_source=api) — Murders at Karlov Manor, 2024-02-09; art print `8f80c6e7-e9f9-4ca6-87f7-a52c96079e4a`.
- [Gisela, Blade of Goldnight](https://scryfall.com/card/mkc/211/gisela-blade-of-goldnight?utm_source=api) — Avacyn Restored, 2012-05-04; art print `7208fcb8-83e6-44ce-af9a-ca1566825018`.
- [Adeline, Resplendent Cathar](https://scryfall.com/card/tdc/108/adeline-resplendent-cathar?utm_source=api) — Innistrad: Midnight Hunt, 2021-09-24; art print `18092f68-b96e-4084-9eba-b240d2195d81`.
- [Anzrag, the Quake-Mole](https://scryfall.com/card/mkm/186/anzrag-the-quake-mole?utm_source=api) — Murders at Karlov Manor, 2024-02-09; art print `70e9d8b8-4b32-4414-b32f-1f47523239c5`.
- [Zopandrel, Hunger Dominus](https://scryfall.com/card/one/195/zopandrel-hunger-dominus?utm_source=api) — Phyrexia: All Will Be One, 2023-02-10; art print `fb419d9d-e06f-48c8-a4f8-a57f9be39e50`.
- [Roxanne, Starfall Savant](https://scryfall.com/card/otj/228/roxanne-starfall-savant?utm_source=api) — Outlaws of Thunder Junction, 2024-04-19; art print `11fbe52f-febd-49fc-8391-28d3efe9c3eb`.
- [Mirkwood Bats](https://scryfall.com/card/ltr/95/mirkwood-bats?utm_source=api) — The Lord of the Rings: Tales of Middle-earth, 2023-06-23; art print `15f035df-784a-4dc8-b7f5-77139a4e6e99`.

Meteorite art: [Outlaws of Thunder Junction token](https://scryfall.com/card/totj/17/meteorite?utm_source=api). Human art: [Innistrad: Midnight Hunt token](https://scryfall.com/card/tmid/1/human?utm_source=api). Card images/data retain the project’s Scryfall/Wizards attribution and Fan Content Policy links.

## Rules and deliberate game adaptations

- **Primordial Ooze:** upkeep counter, then mandatory pay-or-decline choice before the normal draw. Real generic payment taps mana sources. Counts battle and run +1/+1 counters after opposite-counter cancellation. Declining taps the Ooze even if damage is prevented. Damage uses prevention/replacement and lifelink; it is not a life payment. Forced attacks use the existing legal-attacker rule.
- **Aurelia, the Warleader:** first attack of this battlefield object each turn untaps the entire team AFTER all attackers have been declared/tapped, then grants an additional combat. The existing attack-selection controls are reused with an explicit Extra combat label. Only instants/Flash can be cast there: no new main phase, land play/equip, draw, mana reset or land untap. A different newly entered Aurelia has its own first-attack record.
- **Aurelia, the Law Above:** either side’s actual declaration of three attackers draws one; five also deals three to every current monster and gains three life. Entering already attacking does not count. Triggers do not disappear when an attacker dies.
- **Gisela:** doubles damage to monsters; prevents half rounded up to you/allied permanents. Changes damage after assignment, including trample, before infect/deathtouch/lifelink. Captured per simultaneous combat damage step so her dying in that step does not prematurely remove the replacement. Does not change life loss or life paid. Scryfall’s Double action tag is not displayed as a combat keyword.
- **Adeline:** dynamic base power counts all allied creatures, including herself, while keeping counters/auras/run upgrades and temporary bonuses separate. Every declared attack creates a tapped and attacking 1/1 white Human per monster, up to the existing six allied slots. Each monster represents one opposing player. The game’s Flying/Reach duel restrictions still apply. Humans do not trigger attack abilities or increase the declaration count.
- **Anzrag:** a genuinely legal block untaps the team and grants an additional combat once for that block group. Can trigger again in subsequent combats. Pay seven, without tapping, to require a legal block this turn; monsters already retaliate whenever legally able, so this activation is normally redundant in the current duel model. Cannot override Flying, protection, Menace or other restrictions. No invented damage or extra target is added.
- **Zopandrel:** each player/enemy/additional combat adds a snapshot of every current allied creature’s power/toughness until end of turn. Successive combats stack and cleanup removes these bonuses. Creatures entering later miss earlier triggers. Its battlefield Ability button offers 2 mana, 1 mana + 2 life, or 4 life, then EXACTLY two other creatures to sacrifice. Revalidates all costs and sources before payment. Cancel is free; no tapping or summoning-sickness restriction. Indestructible counter stays on that battlefield object and has its own visible badge; it does not become a run upgrade or grant foil to the deck card.
- **Roxanne:** entry/attack creates a tapped colorless Meteorite with a separate Ward/protection-aware 2-damage choice. Meteorites stay in play and have a click-to-open tap-for-mana window, untapping normally. Tapping an artifact TOKEN for mana adds one extra generic mana per Roxanne; Treasure qualifies, ordinary Lotus/Sol Ring/Mox cards do not. Roxanne herself never gains the tap ability quoted inside her Meteorite description.
- **Mirkwood Bats:** actual token creation and token sacrifice generate separate one-life-loss triggers per token/per Bats, against all monster opponents. Works with Treasure/Food/Clue/Meteorite/creature tokens. Life loss ignores prevention, protection and Gisela. Destruction, death, exile, legend replacement and restoring persisted zones are not sacrifice/creation events. Simultaneous sacrifices capture Bats before paying the group of costs.
- Defeating the final monster clears obsolete queued attack/token continuations before another reinforcement wave or reward screen, preventing old effects from hitting newly spawned opponents. The existing generic rules/choice queue, six-slot limit, enemy targeting rules, source-aware color protection, Ward payments and legend rule remain in use.

## Validation

**256 rule/regression tests passed**, including 37 new integration tests. The new browser flow, existing Ring/Questing Beast browser checks and all 15 booster viewport/inset cases passed without missing assets or page errors.

```sh
node --test tests/warleaders.test.cjs tests/legendary-cards.test.cjs tests/reviewed-cards.test.cjs tests/jester-family.test.cjs tests/immortal-first-strike.test.cjs tests/protection.test.cjs tests/sliver-hive.test.cjs tests/chance.test.cjs tests/relics.test.cjs tests/counters-poison.test.cjs
node tests/warleaders-browser.test.cjs
node tests/booster-view-browser.test.cjs
```

The new rule suite covers actual paid/countered spells, all nine abilities, combat timing, damage assignment/replacement, deaths, extra-combat restrictions, upkeep payment/draw order, run counters, sacrifice transactions and stale choices, Phyrexian payment variants, token identity, Meteorite Ward/mana, inheritance of quoted rules, and reinforcement cleanup. Browser checks exercise collection/search/art, real battlefield action windows, payment and sacrifice confirmations, the extra-combat controls, and upkeep choices on desktop/landscape-phone/portrait-phone viewports. Historical pool-size assertions in five older suites now check name uniqueness while keeping their named-card behavior checks, so future additions do not invalidate unrelated tests.
