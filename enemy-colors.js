/* v0.90 — six original creatures, shared Sliver abilities and visible color identity. */
const FOES90={
 rootmaw:{name:'Rootmaw Troll',tier:'elite',minNode:2,health:25,power:4,pattern:['guard','attack','mend','attack'],keywords:['reach','trample'],mend:4,bounty:19,type_line:'Creature — Troll',colors:['G']},
 gravebell:{name:'Gravebell Zombie',tier:'skirmish',health:12,power:2,pattern:['attack','guard','buff','attack'],keywords:['menace'],bounty:10,type_line:'Creature — Zombie Soldier',colors:['B']},
 galesliver:{name:'Galecrest Sliver',tier:'elite',minNode:2,health:12,power:2,pattern:['guard','attack','attack'],keywords:['flying'],hiveKeyword:'flying',bounty:14,type_line:'Creature — Sliver',colors:['U']},
 venomsliver:{name:'Venomspine Sliver',tier:'elite',minNode:3,health:10,power:1,pattern:['guard','attack','buff','attack'],keywords:['deathtouch'],hiveKeyword:'deathtouch',bounty:15,type_line:'Creature — Sliver',colors:['G']},
 bladesliver:{name:'Bladecrest Sliver',tier:'elite',minNode:2,health:12,power:2,pattern:['attack','guard','attack','buff'],keywords:['first strike'],hiveKeyword:'first strike',bounty:14,type_line:'Creature — Sliver',colors:['R']},
 websliver:{name:'Webtendril Sliver',tier:'elite',minNode:2,health:14,power:2,pattern:['guard','attack','mend','attack'],keywords:['reach'],hiveKeyword:'reach',mend:2,bounty:14,type_line:'Creature — Sliver',colors:['G']}
};
Object.assign(FOE_TYPES,FOES90);
const ARTIFACT_IDENTITIES90={bulwark:['W'],dragon:['U','R'],myr:['U'],runegolem:['U'],copperscarab:['G']};
for(const [kind,t] of Object.entries(FOE_TYPES))t.color_identity=[...(t.color_identity?.length?t.color_identity:t.colors?.length?t.colors:FOE_COLORS88[kind]?.length?FOE_COLORS88[kind]:ARTIFACT_IDENTITIES90[kind]||['G'])];
const BOSS_PROTECTION90={dragon:['R'],tyrant:['W','R'],sphinx:['B'],cinderhydra:['U','G'],abyssleviathan:['U']};
const baseColorFoe90=createFoe;
createFoe=function(kind,node=state.node){
 const u=baseColorFoe90(kind,node),t=FOE_TYPES[kind];u.card.color_identity=[...t.color_identity];u.card.enemyKind=kind;
 u.protection90=t.tier==='boss'?[...(BOSS_PROTECTION90[kind]||[])]:[];
 if(u.protection90.length)u.card.oracle_text+='\nProtection from '+u.protection90.map(c=>COLOR_NAMES90[c].toLowerCase()).join(' and from ');
 if(t.hiveKeyword)u.card.oracle_text+=`\nAll allied Sliver creatures have ${t.hiveKeyword}.`;
 return u;
};
let sliverCombatDepth90=0;
const baseSliverCombat90=resolveCombatDamage;
resolveCombatDamage=function(...args){sliverCombatDepth90++;try{return baseSliverCombat90(...args);}finally{sliverCombatDepth90--;}};
const baseSliverKeyword90=hasCreatureKeyword;
const SHARED_SLIVER_KEYWORDS90=new Set(['flying','deathtouch','first strike','reach','lifelink','haste','vigilance','trample','menace','double strike','hexproof']);
function sliverTemplate90(u){return /\bSliver\b/.test(u?.card?.type_line||'')?FOE_TYPES[u.kind||u.card.enemyKind]:null;}
function sliverAllies90(u,b=state.battle){return !u||!b||!['player','enemy'].includes(u.owner)?[]:u.owner==='enemy'?b.enemyCreatures:b.creatures;}
function sliverSources90(u,keyword,b=state.battle){
 if(!sliverTemplate90(u))return[];
 return sliverAllies90(u,b).filter(d=>(creatureAlive(d)||sliverCombatDepth90>0)&&sliverTemplate90(d)?.hiveKeyword===keyword);
}
hasCreatureKeyword=function(u,keyword){
 if(baseSliverKeyword90(u,keyword))return true;
 return SHARED_SLIVER_KEYWORDS90.has(keyword)&&sliverSources90(u,keyword).length>0;
};
const baseSliverWard90=wardCost;
wardCost=function(u){return Math.max(baseSliverWard90(u),...sliverSources90(u,'ward').map(d=>sliverTemplate90(d).hiveWard||1));};
const baseSliverTeam90=createEnemyTeam;
createEnemyTeam=function(encounter){
 const team=baseSliverTeam90(encounter),node=ENCOUNTERS.indexOf(encounter)+1||state.node;
 if(node<2||!team.some(u=>/\bSliver\b/.test(u.card.type_line)))return team;
 const kinds=Object.keys(FOE_TYPES).filter(k=>FOE_TYPES[k].hiveKeyword&&(FOE_TYPES[k].minNode||2)<=node&&!team.some(u=>u.kind===k));
 const replace=team.findIndex(u=>u.tier==='minion');if(kinds.length&&replace>=0)team[replace]=createFoe(shuffle(kinds)[0],node);
 return team;
};
function enemyIdentity90(u){return `<span class="enemy-identity90" title="Color identity: ${u.card.color_identity.map(c=>COLOR_NAMES90[c]).join(' / ')}" aria-label="Color identity: ${u.card.color_identity.map(c=>COLOR_NAMES90[c]).join(', ')}">${u.card.color_identity.map(manaSymbol72).join('')}</span>`;}
const baseColorFoeRender90=renderEnemyBoard;
renderEnemyBoard=function(){const result=baseColorFoeRender90();for(const u of state.battle?.enemyCreatures||[]){const n=$('#enemy-board').querySelector(`[data-enemy-attacker="${u.id}"] .monster-figure`);n?.insertAdjacentHTML('beforeend',enemyIdentity90(u));}return result;};
const baseColorEnemyChoice90=enemyChoiceMarkup74;
enemyChoiceMarkup74=function(u){return baseColorEnemyChoice90(u).replace('</span><span class="enemy-choice-name74">',enemyIdentity90(u)+'</span><span class="enemy-choice-name74">');};
const baseColorEnemyDescriptions90=effectDescriptions;
effectDescriptions=function(card){
 const kind=card.enemyKind,t=FOE_TYPES[kind];if(!t)return baseColorEnemyDescriptions90(card);
 return [`${t.name} · ${card.type_line}.`,`Color identity: ${t.color_identity.map(c=>COLOR_NAMES90[c]).join(' / ')}. Actual color: ${cardColors88(card).map(c=>COLOR_NAMES90[c]).join(' / ')||'Colorless'}.`,...(BOSS_PROTECTION90[kind]?[`Protection from ${BOSS_PROTECTION90[kind].map(c=>COLOR_NAMES90[c]).join(' / ')}.`,PROTECTION_RULE90]:[]),...(t.hiveKeyword?[`All allied Slivers share ${t.hiveKeyword} while this Sliver remains alive. Removing it removes this shared ability; each Sliver keeps its own printed ability.`]:[]),...baseColorEnemyDescriptions90(card)];
};
