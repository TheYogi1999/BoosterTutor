/* v0.89 — eight original enemies, using the existing intent and combat rules. */
const FOES89={
 emberimp:{name:'Emberwing Imp',tier:'skirmish',health:7,power:1,pattern:['attack','attack','guard'],keywords:['flying','haste'],bounty:7,type_line:'Creature — Imp',colors:['R']},
 miretoad:{name:'Mirefang Toad',tier:'skirmish',health:10,power:1,pattern:['guard','attack','attack','buff'],keywords:['deathtouch'],bounty:10,type_line:'Creature — Frog',colors:['B','G']},
 copperscarab:{name:'Copperback Scarab',tier:'elite',minNode:2,health:22,power:3,pattern:['guard','attack','buff','attack'],keywords:['reach'],ward:1,bounty:17,type_line:'Artifact Creature — Insect',colors:[]},
 dawncentaur:{name:'Dawnmane Cavalier',tier:'elite',minNode:2,health:18,power:3,pattern:['attack','mend','attack','guard'],keywords:['first strike','lifelink'],mend:3,bounty:17,type_line:'Creature — Centaur Knight',colors:['W','G']},
 cinderphoenix:{name:'Cinderveil Phoenix',tier:'elite',minNode:3,health:16,power:4,pattern:['attack','scorch','guard','attack'],keywords:['flying','haste'],bounty:18,type_line:'Creature — Phoenix',colors:['R']},
 thornstag:{name:'Thorncrown Stag',tier:'skirmish',health:13,power:3,pattern:['buff','attack','guard','attack'],keywords:['reach','trample'],bounty:11,type_line:'Creature — Elk',colors:['G']},
 moonmyconid:{name:'Mooncap Myconid',tier:'elite',minNode:3,health:18,power:2,pattern:['mill','mend','attack','rune'],keywords:[],ward:1,mill:1,mend:3,runeMana:2,bounty:18,type_line:'Enchantment Creature — Fungus Shaman',colors:['U','G']},
 abyssleviathan:{name:'Abyssal Leviathan',tier:'boss',health:66,power:6,pattern:['guard','attack','rally','attack','buff'],keywords:['trample'],ward:2,bounty:46,type_line:'Legendary Creature — Leviathan',colors:['U']}
};
// The shared roster feeds normal encounters, late waves, Precons and Immortal runs.
// createFoe already reads type, color, keywords, Ward and spell intents from each template.
Object.assign(FOE_TYPES,FOES89);
