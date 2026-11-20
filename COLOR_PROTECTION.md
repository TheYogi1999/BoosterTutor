# Color protection and Vey's trading post — v0.90

## Protection

Protection checks a source's **actual colors**, not color identity or the colors of
mana it produces. Devoid and explicitly colorless artifacts remain colorless. A
multicolor source is stopped if any actual color matches a protected color.

- Damage is prevented, including untargeted damage, Deathtouch, Infect and Toxic.
  Prevented damage does not generate Lifelink life.
- Matching spells and abilities cannot target the protected permanent, including
  its controller's own spells. Paid spells recheck protection before resolution;
  an illegal target fizzles without refunding costs.
- A protected attacker cannot be blocked by a creature of the protected color.
  A protected creature may itself block a matching attacker and prevent its damage.
- Matching Auras go to the graveyard (Rancor returns to hand); matching Equipment
  becomes unattached. Global nonattachment effects continue to apply.
- Untargeted destroy/exile, sacrifice, life loss and toughness 0 are not prevented.
  Poison counters given directly by a spell are not damage.

Player attacks still use the game's creature-to-monster duels: a creature can attack
a monster protected from its color, but deals no damage to that monster. This does
not give the monster Indestructible. Existing Flying/Reach restrictions remain.

Gods Willing targets your creature, asks for a color after payment, then scries 1.
Stave Off may target either side. Both last until end of turn and use the existing
mandatory choice UI, including controller support. Ward remains a separate payment.

## Added real cards

White Knight, Black Knight, Silver Knight, Paladin en-Vec, Voice of Law, Voice of
Grace, Voice of Duty, Voice of Reason; Black Ward, Blue Ward, Red Ward, Green Ward;
Gods Willing and Stave Off. All use current Oracle rules and the oldest available
English paper artwork. The four Wards grant no power/toughness bonus.

## Enemies

Six new enemies bring the roster to 42: Rootmaw Troll, Gravebell Zombie, Galecrest
Sliver, Venomspine Sliver, Bladecrest Sliver and Webtendril Sliver. Slivers share
Flying, Deathtouch, First strike and Reach respectively with allied Slivers; removing
a donor removes its grant. Damage within a step remains simultaneous. Sliver-led
elite encounters replace one minion with a different eligible Sliver, keeping six slots.

All enemies have an explicit color identity shown with the existing MagicEditor
mana symbols. Colorless artifact foes retain empty actual colors and gain an
affiliation identity: Iron Bulwark W, Shard Dragon UR, Myr Scavenger U, Runebound
Colossus U and Copperback Scarab G. These identities do not change generic costs
or protection/removal legality.

Boss protection is fixed and visible: Shard Dragon R; Ash Tyrant W/R; Tide Sphinx B;
Cindercrest Hydra U/G; Abyssal Leviathan U. The two-color wards do not cover an entire shipped two-color Precon. No enemy receives Indestructible.

## Shop

Vey's original portrait occupies the left panel. The right side keeps three card
offers, two pack offers, three run-counter offers and the wallet. Purchases, pack
confirmation, seven-card pack opening, return to shop and continue to camp use
the existing game actions. The 1600 × 900 canvas and separate music/SFX settings
remain. Card descriptions can scroll within their offer when needed; the page does not.

Original art provenance: [assets/portraits/ENEMIES-v90.md](assets/portraits/ENEMIES-v90.md).
