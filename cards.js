// Verified real Magic cards from Scryfall. Bundled images keep the starter and offline pool authentic.
const BUNDLED_CARDS = [
  {
    "id": "409f9b88-f03e-40b6-9883-68c14c37c0de",
    "name": "Grizzly Bears",
    "mana_cost": "{1}{G}",
    "cmc": 2.0,
    "type_line": "Creature — Bear",
    "oracle_text": "",
    "power": "2",
    "toughness": "2",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/4/0/409f9b88-f03e-40b6-9883-68c14c37c0de.jpg?1783943001",
    "uri": "https://scryfall.com/card/10e/268/grizzly-bears?utm_source=api",
    "verified": true
  },
  {
    "id": "9c9ac1bc-cdf3-4fa6-8319-a7ea164e9e47",
    "name": "Savannah Lions",
    "mana_cost": "{W}",
    "cmc": 1.0,
    "type_line": "Creature — Cat",
    "oracle_text": "",
    "power": "2",
    "toughness": "1",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/9c9ac1bc-cdf3-4fa6-8319-a7ea164e9e47.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/9/c/9c9ac1bc-cdf3-4fa6-8319-a7ea164e9e47.jpg?1783909083",
    "uri": "https://scryfall.com/card/fdn/146/savannah-lions?utm_source=api",
    "verified": true
  },
  {
    "id": "5e227a63-abea-494e-9d66-6ff0a3da14ca",
    "name": "Wind Drake",
    "mana_cost": "{2}{U}",
    "cmc": 3.0,
    "type_line": "Creature — Drake",
    "oracle_text": "Flying",
    "power": "2",
    "toughness": "2",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/5e227a63-abea-494e-9d66-6ff0a3da14ca.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/5/e/5e227a63-abea-494e-9d66-6ff0a3da14ca.jpg?1783937211",
    "uri": "https://scryfall.com/card/kld/70/wind-drake?utm_source=api",
    "verified": true
  },
  {
    "id": "213c9202-b6f4-43ab-b57f-b97a1da5e263",
    "name": "Giant Spider",
    "mana_cost": "{3}{G}",
    "cmc": 4.0,
    "type_line": "Creature — Spider",
    "oracle_text": "Reach (This creature can block creatures with flying.)",
    "power": "2",
    "toughness": "4",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/213c9202-b6f4-43ab-b57f-b97a1da5e263.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/2/1/213c9202-b6f4-43ab-b57f-b97a1da5e263.jpg?1783918443",
    "uri": "https://scryfall.com/card/dmr/163/giant-spider?utm_source=api",
    "verified": true
  },
  {
    "id": "7aff07f9-9528-4149-9af0-f4e3c66c9dc5",
    "name": "Vampire Nighthawk",
    "mana_cost": "{1}{B}{B}",
    "cmc": 3.0,
    "type_line": "Creature — Vampire Shaman",
    "oracle_text": "Flying\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
    "power": "2",
    "toughness": "3",
    "color_identity": [
      "B"
    ],
    "image": "assets/cards/7aff07f9-9528-4149-9af0-f4e3c66c9dc5.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/7/a/7aff07f9-9528-4149-9af0-f4e3c66c9dc5.jpg?1787562825",
    "uri": "https://scryfall.com/card/fdn/757/vampire-nighthawk?utm_source=api",
    "verified": true
  },
  {
    "id": "305078a5-ac18-4721-bba2-3434eba5b1cf",
    "name": "Ornithopter",
    "mana_cost": "{0}",
    "cmc": 0.0,
    "type_line": "Artifact Creature — Thopter",
    "oracle_text": "Flying",
    "power": "0",
    "toughness": "2",
    "color_identity": [],
    "image": "assets/cards/305078a5-ac18-4721-bba2-3434eba5b1cf.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/3/0/305078a5-ac18-4721-bba2-3434eba5b1cf.jpg?1783918410",
    "uri": "https://scryfall.com/card/dmr/233/ornithopter?utm_source=api",
    "verified": true
  },
  {
    "id": "f4468fff-cd6f-428c-b7a0-ff89f5bbea2e",
    "name": "Juggernaut",
    "mana_cost": "{4}",
    "cmc": 4.0,
    "type_line": "Artifact Creature — Juggernaut",
    "oracle_text": "This creature attacks each combat if able.\nThis creature can't be blocked by Walls.",
    "power": "5",
    "toughness": "3",
    "color_identity": [],
    "image": "assets/cards/f4468fff-cd6f-428c-b7a0-ff89f5bbea2e.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/f/4/f4468fff-cd6f-428c-b7a0-ff89f5bbea2e.jpg?1783909048",
    "uri": "https://scryfall.com/card/fdn/255/juggernaut?utm_source=api",
    "verified": true
  },
  {
    "id": "6a0b230b-d391-4998-a3f7-7b158a0ec2cd",
    "name": "Llanowar Elves",
    "mana_cost": "{G}",
    "cmc": 1.0,
    "type_line": "Creature — Elf Druid",
    "oracle_text": "{T}: Add {G}.",
    "power": "1",
    "toughness": "1",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/6/a/6a0b230b-d391-4998-a3f7-7b158a0ec2cd.jpg?1783909057",
    "uri": "https://scryfall.com/card/fdn/227/llanowar-elves?utm_source=api",
    "verified": true
  },
  {
    "id": "e8b67ee8-3189-4426-8b1a-b540267768fd",
    "name": "Centaur Courser",
    "mana_cost": "{2}{G}",
    "cmc": 3.0,
    "type_line": "Creature — Centaur Warrior",
    "oracle_text": "",
    "power": "3",
    "toughness": "3",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/e8b67ee8-3189-4426-8b1a-b540267768fd.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/e/8/e8b67ee8-3189-4426-8b1a-b540267768fd.jpg?1783932966",
    "uri": "https://scryfall.com/card/m20/168/centaur-courser?utm_source=api",
    "verified": true
  },
  {
    "id": "b8c5e74c-96e7-4a1f-93b7-14d776fe4b2d",
    "name": "Serra Angel",
    "mana_cost": "{3}{W}{W}",
    "cmc": 5.0,
    "type_line": "Creature — Angel",
    "oracle_text": "Flying\nVigilance (Attacking doesn't cause this creature to tap.)",
    "power": "4",
    "toughness": "4",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/b8c5e74c-96e7-4a1f-93b7-14d776fe4b2d.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/b/8/b8c5e74c-96e7-4a1f-93b7-14d776fe4b2d.jpg?1787563091",
    "uri": "https://scryfall.com/card/fdn/740/serra-angel?utm_source=api",
    "verified": true
  },
  {
    "id": "7673784e-db4b-43a1-8d55-1bb9fc1e284f",
    "name": "Lightning Bolt",
    "mana_cost": "{R}",
    "cmc": 1.0,
    "type_line": "Instant",
    "oracle_text": "Lightning Bolt deals 3 damage to any target.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "R"
    ],
    "image": "assets/cards/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/7/6/7673784e-db4b-43a1-8d55-1bb9fc1e284f.jpg?1783903008",
    "uri": "https://scryfall.com/card/msc/806/lightning-bolt?utm_source=api",
    "verified": true
  },
  {
    "id": "b23900fb-efe9-43ab-9f67-4545dd01fb9c",
    "name": "Shock",
    "mana_cost": "{R}",
    "cmc": 1.0,
    "type_line": "Instant",
    "oracle_text": "Shock deals 2 damage to any target.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "R"
    ],
    "image": "assets/cards/b23900fb-efe9-43ab-9f67-4545dd01fb9c.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/b/2/b23900fb-efe9-43ab-9f67-4545dd01fb9c.jpg?1783903007",
    "uri": "https://scryfall.com/card/msc/809/shock?utm_source=api",
    "verified": true
  },
  {
    "id": "88b13bc0-da54-4c3b-917c-7c8345a329f5",
    "name": "Lightning Strike",
    "mana_cost": "{1}{R}",
    "cmc": 2.0,
    "type_line": "Instant",
    "oracle_text": "Lightning Strike deals 3 damage to any target.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "R"
    ],
    "image": "assets/cards/88b13bc0-da54-4c3b-917c-7c8345a329f5.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/8/8/88b13bc0-da54-4c3b-917c-7c8345a329f5.jpg?1783902927",
    "uri": "https://scryfall.com/card/msh/142/lightning-strike?utm_source=api",
    "verified": true
  },
  {
    "id": "a5ae9732-9332-4f53-8608-52ecea32c5d2",
    "name": "Revitalize",
    "mana_cost": "{1}{W}",
    "cmc": 2.0,
    "type_line": "Instant",
    "oracle_text": "You gain 3 life.\nDraw a card.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/a5ae9732-9332-4f53-8608-52ecea32c5d2.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/a/5/a5ae9732-9332-4f53-8608-52ecea32c5d2.jpg?1783908793",
    "uri": "https://scryfall.com/card/j25/244/revitalize?utm_source=api",
    "verified": true
  },
  {
    "id": "cb3b35b8-f321-46d8-a441-6b9a6efa9021",
    "name": "Divination",
    "mana_cost": "{2}{U}",
    "cmc": 3.0,
    "type_line": "Sorcery",
    "oracle_text": "Draw two cards.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/cb3b35b8-f321-46d8-a441-6b9a6efa9021.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/c/b/cb3b35b8-f321-46d8-a441-6b9a6efa9021.jpg?1783934590",
    "uri": "https://scryfall.com/card/m19/51/divination?utm_source=api",
    "verified": true
  },
  {
    "id": "bbc99a51-1501-4525-a3cc-f48249b64bed",
    "name": "Opt",
    "mana_cost": "{U}",
    "cmc": 1.0,
    "type_line": "Instant",
    "oracle_text": "Scry 1. (Look at the top card of your library. You may put that card on the bottom.)\nDraw a card.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/bbc99a51-1501-4525-a3cc-f48249b64bed.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/b/b/bbc99a51-1501-4525-a3cc-f48249b64bed.jpg?1783907102",
    "uri": "https://scryfall.com/card/tdc/158/opt?utm_source=api",
    "verified": true
  },
  {
    "id": "fd1f95bf-48ea-455a-8a6c-0249b11c8900",
    "name": "Giant Growth",
    "mana_cost": "{G}",
    "cmc": 1.0,
    "type_line": "Instant",
    "oracle_text": "Target creature gets +3/+3 until end of turn.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/fd1f95bf-48ea-455a-8a6c-0249b11c8900.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/f/d/fd1f95bf-48ea-455a-8a6c-0249b11c8900.jpg?1783902918",
    "uri": "https://scryfall.com/card/msh/167/giant-growth?utm_source=api",
    "verified": true
  },
  {
    "id": "46917de3-5e98-4dd6-8950-fc10338515df",
    "name": "Titanic Growth",
    "mana_cost": "{1}{G}",
    "cmc": 2.0,
    "type_line": "Instant",
    "oracle_text": "Target creature gets +4/+4 until end of turn.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/46917de3-5e98-4dd6-8950-fc10338515df.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/4/6/46917de3-5e98-4dd6-8950-fc10338515df.jpg?1783915076",
    "uri": "https://scryfall.com/card/woe/191/titanic-growth?utm_source=api",
    "verified": true
  },
  {
    "id": "1f29d9e4-3100-43cb-9723-7d5c23f89b12",
    "name": "Murder",
    "mana_cost": "{1}{B}{B}",
    "cmc": 3.0,
    "type_line": "Instant",
    "oracle_text": "Destroy target creature.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "B"
    ],
    "image": "assets/cards/1f29d9e4-3100-43cb-9723-7d5c23f89b12.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/1/f/1f29d9e4-3100-43cb-9723-7d5c23f89b12.jpg?1783908723",
    "uri": "https://scryfall.com/card/j25/467/murder?utm_source=api",
    "verified": true
  },
  {
    "id": "475bff39-220a-4490-9c2e-d311e306a6db",
    "name": "Cancel",
    "mana_cost": "{1}{U}{U}",
    "cmc": 3.0,
    "type_line": "Instant",
    "oracle_text": "Counter target spell.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/475bff39-220a-4490-9c2e-d311e306a6db.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/4/7/475bff39-220a-4490-9c2e-d311e306a6db.jpg?1783908966",
    "uri": "https://scryfall.com/card/fdn/505/cancel?utm_source=api",
    "verified": true
  },
  {
    "id": "c57ee875-5ce7-4c47-841c-9639d622fe00",
    "name": "Negate",
    "mana_cost": "{1}{U}",
    "cmc": 2.0,
    "type_line": "Instant",
    "oracle_text": "Counter target noncreature spell.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/c57ee875-5ce7-4c47-841c-9639d622fe00.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/c/5/c57ee875-5ce7-4c47-841c-9639d622fe00.jpg?1793111882",
    "uri": "https://scryfall.com/card/trc/439/negate?utm_source=api",
    "verified": true
  },
  {
    "id": "ac0987b8-755e-42f1-bd6d-1401fecd4171",
    "name": "Holy Strength",
    "mana_cost": "{W}",
    "cmc": 1.0,
    "type_line": "Enchantment — Aura",
    "oracle_text": "Enchant creature\nEnchanted creature gets +1/+2.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/ac0987b8-755e-42f1-bd6d-1401fecd4171.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/a/c/ac0987b8-755e-42f1-bd6d-1401fecd4171.jpg?1783941836",
    "uri": "https://scryfall.com/card/m11/16/holy-strength?utm_source=api",
    "verified": true
  },
  {
    "id": "f42c9574-2f09-4cb0-80cb-10fb8c592e6f",
    "name": "Unholy Strength",
    "mana_cost": "{B}",
    "cmc": 1.0,
    "type_line": "Enchantment — Aura",
    "oracle_text": "Enchant creature\nEnchanted creature gets +2/+1.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "B"
    ],
    "image": "assets/cards/f42c9574-2f09-4cb0-80cb-10fb8c592e6f.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/f/4/f42c9574-2f09-4cb0-80cb-10fb8c592e6f.jpg?1783938778",
    "uri": "https://scryfall.com/card/dvd/47/unholy-strength?utm_source=api",
    "verified": true
  },
  {
    "id": "86d6b411-4a31-4bfc-8dd6-e19f553bb29b",
    "name": "Rancor",
    "mana_cost": "{G}",
    "cmc": 1.0,
    "type_line": "Enchantment — Aura",
    "oracle_text": "Enchant creature\nEnchanted creature gets +2/+0 and has trample.\nWhen this Aura is put into a graveyard from the battlefield, return it to its owner's hand.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "G"
    ],
    "image": "assets/cards/86d6b411-4a31-4bfc-8dd6-e19f553bb29b.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/8/6/86d6b411-4a31-4bfc-8dd6-e19f553bb29b.jpg?1783921864",
    "uri": "https://scryfall.com/card/2x2/156/rancor?utm_source=api",
    "verified": true
  },
  {
    "id": "690972a8-72df-4050-a353-16e45589167c",
    "name": "Bonesplitter",
    "mana_cost": "{1}",
    "cmc": 1.0,
    "type_line": "Artifact — Equipment",
    "oracle_text": "Equipped creature gets +2/+0.\nEquip {1}",
    "power": "",
    "toughness": "",
    "color_identity": [],
    "image": "assets/cards/690972a8-72df-4050-a353-16e45589167c.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/6/9/690972a8-72df-4050-a353-16e45589167c.jpg?1783928693",
    "uri": "https://scryfall.com/card/cmr/458/bonesplitter?utm_source=api",
    "verified": true
  },
  {
    "id": "973c166e-3e93-4ed5-b4c5-84dc158a8e4f",
    "name": "Short Sword",
    "mana_cost": "{1}",
    "cmc": 1.0,
    "type_line": "Artifact — Equipment",
    "oracle_text": "Equipped creature gets +1/+1.\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)",
    "power": "",
    "toughness": "",
    "color_identity": [],
    "image": "assets/cards/973c166e-3e93-4ed5-b4c5-84dc158a8e4f.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/9/7/973c166e-3e93-4ed5-b4c5-84dc158a8e4f.jpg?1783930656",
    "uri": "https://scryfall.com/card/m21/236/short-sword?utm_source=api",
    "verified": true
  },
  {
    "id": "8554c2a8-d3cc-4ae9-a8ae-34815cf299db",
    "name": "Leonin Scimitar",
    "mana_cost": "{1}",
    "cmc": 1.0,
    "type_line": "Artifact — Equipment",
    "oracle_text": "Equipped creature gets +1/+1.\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)",
    "power": "",
    "toughness": "",
    "color_identity": [],
    "image": "assets/cards/8554c2a8-d3cc-4ae9-a8ae-34815cf299db.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/8/5/8554c2a8-d3cc-4ae9-a8ae-34815cf299db.jpg?1783908821",
    "uri": "https://scryfall.com/card/j25/152/leonin-scimitar?utm_source=api",
    "verified": true
  },
  {
    "id": "86c9838e-aa72-49fc-bae2-f880bcbc9313",
    "name": "Trusty Machete",
    "mana_cost": "{1}",
    "cmc": 1.0,
    "type_line": "Artifact — Equipment",
    "oracle_text": "Equipped creature gets +2/+1.\nEquip {2}",
    "power": "",
    "toughness": "",
    "color_identity": [],
    "image": "assets/cards/86c9838e-aa72-49fc-bae2-f880bcbc9313.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/8/6/86c9838e-aa72-49fc-bae2-f880bcbc9313.jpg?1783942125",
    "uri": "https://scryfall.com/card/zen/209/trusty-machete?utm_source=api",
    "verified": true
  },
  {
    "id": "17d154d3-7ae5-43ff-9978-d974285e2c89",
    "name": "Glorious Anthem",
    "mana_cost": "{1}{W}{W}",
    "cmc": 3.0,
    "type_line": "Enchantment",
    "oracle_text": "Creatures you control get +1/+1.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/17d154d3-7ae5-43ff-9978-d974285e2c89.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/1/7/17d154d3-7ae5-43ff-9978-d974285e2c89.jpg?1783930741",
    "uri": "https://scryfall.com/card/m21/21/glorious-anthem?utm_source=api",
    "verified": true
  },
  {
    "id": "26894980-8961-4479-85dd-5f01c899718b",
    "name": "Fountain of Renewal",
    "mana_cost": "{1}",
    "cmc": 1.0,
    "type_line": "Artifact",
    "oracle_text": "At the beginning of your upkeep, you gain 1 life.\n{3}, Sacrifice this artifact: Draw a card.",
    "power": "",
    "toughness": "",
    "color_identity": [],
    "image": "assets/cards/26894980-8961-4479-85dd-5f01c899718b.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/2/6/26894980-8961-4479-85dd-5f01c899718b.jpg?1783934511",
    "uri": "https://scryfall.com/card/m19/235/fountain-of-renewal?utm_source=api",
    "verified": true
  },
  {
    "id": "e7175448-d126-4402-96db-5392f95138b4",
    "name": "Omen of the Sea",
    "mana_cost": "{1}{U}",
    "cmc": 2.0,
    "type_line": "Enchantment",
    "oracle_text": "Flash (You may cast this spell any time you could cast an instant.)\nWhen this enchantment enters, scry 2, then draw a card.\n{2}{U}, Sacrifice this enchantment: Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
    "power": "",
    "toughness": "",
    "color_identity": [
      "U"
    ],
    "image": "assets/cards/e7175448-d126-4402-96db-5392f95138b4.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/e/7/e7175448-d126-4402-96db-5392f95138b4.jpg?1783908763",
    "uri": "https://scryfall.com/card/j25/336/omen-of-the-sea?utm_source=api",
    "verified": true
  },
  {
    "id": "d9e966cb-bb42-49d8-b351-114619b31497",
    "name": "Angelic Chorus",
    "mana_cost": "{3}{W}{W}",
    "cmc": 5.0,
    "type_line": "Enchantment",
    "oracle_text": "Whenever a creature you control enters, you gain life equal to its toughness.",
    "power": "",
    "toughness": "",
    "color_identity": [
      "W"
    ],
    "image": "assets/cards/d9e966cb-bb42-49d8-b351-114619b31497.jpg",
    "art": "https://cards.scryfall.io/art_crop/front/d/9/d9e966cb-bb42-49d8-b351-114619b31497.jpg?1783934847",
    "uri": "https://scryfall.com/card/bbd/87/angelic-chorus?utm_source=api",
    "verified": true
  }
];
