const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){
 const nodes=new Map(),timers=[];
 function el(key){if(!nodes.has(key))nodes.set(key,{textContent:'',innerHTML:'',value:'',dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},querySelector(){return el('child')},setAttribute(){},removeAttribute(){},show(){this.open=true},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return{left:0,top:0,width:150,height:210}},isConnected:true});return nodes.get(key);}
 const c=vm.createContext({console,document:{querySelector:s=>s==='dialog[open]'?[...nodes.values()].find(n=>n.open)||null:el(s),querySelectorAll:()=>[],documentElement:el('html'),body:el('body'),addEventListener(){}},window:{innerWidth:1600,innerHeight:900,addEventListener(){},scrollTo(){}},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},AbortSignal,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true})});
 for(const path of ['cards.js','sounds.js','game.js','rules.js','expansion.js','expedition-rewards.js','enemy-spells.js','enemy-counters.js','waves.js','dice.js','dice-cards.js','reaction-checks.js','chance.js','battle-details.js','relics.js','run-progression.js','run-counters.js','poison.js','permanent-actions.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
 const run=code=>vm.runInContext(code,c);
 run(`state.soundOn=false;renderBattle=()=>{};globalThis.card=name=>BUNDLED_CARDS.find(c=>c.name===name);state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.campTokens=[];state.deck=Array(60).fill(card('Grizzly Bears'));beginBattle(1);globalThis.b=state.battle;b.floatingMana=50;syncMana(b);state.playerHealth=30;b.creatures=[];b.hand=[];b.permanents=[];b.enemyCreatures.forEach(e=>{e.health=e.maxHealth=100;e.ward=0;e.counterspell=false;e.hexproof=false;e.power=1;e.flying=false;e.summonedTurn=0;for(const keyword of COMBAT_KEYWORDS)e[keyword]=false;e.firstStrike=false;e.doubleStrike=false;e.card={...e.card,oracle_text:'',keywords:[]}});globalThis.hand=(...names)=>b.hand=names.map(card);globalThis.ally=(name='Grizzly Bears')=>{const u={id:'ally-'+state.nextPermanentId++,owner:'player',card:card(name),...parseStats(card(name)),...creatureKeywords(card(name)),summonedTurn:0,summoningSick:false,tapped:false,willAttack:false};b.creatures.push(u);return u};globalThis.perm=name=>{const p={id:'p-'+state.nextPermanentId++,card:card(name),attachedTo:null};b.permanents.push(p);return p};globalThis.coins=(...values)=>{globalThis.coinValues=values;rollCoinValue55=()=>{if(!coinValues.length)throw Error('Unexpected coin');return coinValues.shift()}};globalThis.d20=(...values)=>{globalThis.d20Values=values;rollD20Value55=()=>{if(!d20Values.length)throw Error('Unexpected D20');return d20Values.shift()}};globalThis.settle=()=>settleDiceRoll50(b.diceRoll.id);globalThis.pick=key=>{selectRuleChoice(key);confirmRuleChoice()};globalThis.gambit=()=>{hand('Fiery Gambit');playCard(0);pick('enemy:'+b.enemyCreatures[0].id)};`);
 run(`globalThis.mint=name=>runCard59(card(name));globalThis.shop=(kinds=['stats','flying','toxic'])=>{state.node=2;state.coins=500;state.deck=[mint('Grizzly Bears'),mint('Grizzly Bears'),mint('Plague Myr')];showShop();state.shop.counters60=kinds.map(kind=>({kind,sold:false}));renderShop();return state.deck};globalThis.purchase=(index,cardIndex=0)=>{openCounterShop60(index);state.counterPurchase60.selected=state.deck[cardIndex].runCardId60;return confirmCounterShop60()};globalThis.enemy=()=>{const e=b.enemyCreatures[0];b.enemyCreatures=[e];b.waves=[b.enemyCreatures];b.waveIndex=0;e.health=e.maxHealth=100;e.power=0;e.firstStrike=e.doubleStrike=e.lifelink=e.deathtouch=e.flying=e.hexproof=false;e.ward=0;e.summonedTurn=0;e.summoningSick=false;return e};globalThis.hit=(u,e,side='player')=>resolveCombatDamage([side==='player'?u:e],new Map([[side==='player'?u.id:e.id,[side==='player'?e:u]]]),side);`);
 return run;
}
test('starter drafted copies have distinct physical IDs with independent counter arrays',()=>{
 const r=fixture();r(`Math.random=()=>0;state.packs=Array.from({length:6},()=>state.pool.slice(0,7));state.draftKind='starter';state.activePack=5;state.selection=new Map(Array.from({length:6},(_,i)=>[i,0]));state.boosterSealed=false;renderDraft();state.deck=[];confirmDraft()`);assert.equal(r('state.deck.length'),17);assert.equal(r('new Set(state.deck.map(c=>c.runCardId60)).size'),17);assert.equal(r('state.deck.some(isFoilCard59)'),false);r(`state.deck[0].runCounters60.push('stats')`);assert.equal(r('runStatCount60(state.deck[1])'),0);assert.equal(r("'runCounters60' in card('Grizzly Bears')"),false);
});
test('a shop counter is charged once and changes only the selected physical copy',()=>{
 const r=fixture();r(`shop();globalThis.other=state.deck[0];globalThis.selected=state.deck[1];globalThis.money=state.coins;purchase(0,1);confirmCounterShop60()`);assert.equal(r('state.coins'),r('money-15'));assert.equal(r('parseStats(selected).power'),3);assert.equal(r('parseStats(other).power'),2);assert.equal(r('state.shop.counters60[0].sold'),true);assert.equal(r("card('Grizzly Bears').power"),'2');
});
test('counter selection cancellation, insufficient coins, removed cards and stale shops never charge',()=>{
 for(const event of ['closeCounterShop60()','state.coins=0','state.deck=[]','state.shop={...state.shop}','state.node=3','resetRunProgress59()']){
  const r=fixture();r(`shop();openCounterShop60(0);state.counterPurchase60.selected=state.deck[0].runCardId60;globalThis.chosen=state.deck[0];${event};globalThis.money=state.coins;confirmCounterShop60()`);assert.equal(r('state.coins'),r('money'),event);assert.equal(r('chosen.runCounters60.length'),0,event);
 }
});
test('shop offers contain three different counter types and remain stable on revisits',()=>{
 const r=fixture();r(`state.node=2;state.coins=500;showShop();globalThis.offers=state.shop.counters60;showJourney();showShop()`);assert.equal(r('state.shop.counters60===offers'),true);assert.equal(r('offers.length'),3);assert.equal(r('new Set(offers.map(o=>o.kind)).size'),3);
});
test('redundant keyword targets are disabled, while stats and Toxic can stack',()=>{
 const r=fixture();assert.equal(r("canReceiveRunCounter60(mint('Serra Angel'),'flying')"),false);r(`shop(['flying','stats','toxic']);purchase(0);globalThis.c=state.deck[0]`);assert.equal(r("canReceiveRunCounter60(c,'flying')"),false);r(`c.runCounters60.push('stats','stats','toxic','toxic')`);assert.equal(r('parseStats(c).power'),4);assert.equal(r('creatureKeywords(c).toxic'),2);
});
test('every purchased keyword works on entry and persists through cleanup and another encounter',()=>{
 for(const kind of ['lifelink','flying','deathtouch','trample','vigilance','haste']){
  const r=fixture();r(`shop([${JSON.stringify(kind)}]);purchase(0);globalThis.c=state.deck[0];state.deck.push(...Array(30).fill(card('Grizzly Bears')));beginBattle(2);globalThis.b=state.battle;b.enemyCreatures.forEach(e=>{e.counterspell=false;e.ward=0;e.hexproof=false});b.hand=[c];b.floatingMana=10;syncMana(b);playCard(0,'player');globalThis.u=b.creatures[0];expireTurnEffects(b);refreshPermanentEffects()`);assert.equal(r(`hasCreatureKeyword(u,${JSON.stringify(kind)})`),true,kind);r(`beginBattle(3)`);assert.equal(r(`hasCreatureKeyword(creatureKeywords(c),${JSON.stringify(kind)})`),true,kind);
 }
});
test('run +1/+1 is visible as persistent bonus and is not lost with temporary bonuses',()=>{
 const r=fixture();r(`shop();purchase(0);const c=state.deck[0];b.hand=[c];playCard(0,'player');globalThis.u=b.creatures[0];resolveReviewedEffect({kind:'buff',power:3,toughness:3,temporary:true},{side:'player',id:u.id})`);assert.equal(r('u.power'),6);assert.equal(r('creatureBonuses(u).permanent.power'),1);assert.equal(r('creatureBonuses(u).temporary.power'),3);r('expireTurnEffects(b);refreshPermanentEffects()');assert.equal(r('u.power'),3);assert.equal(r('u.toughness'),3);
});
test('death, Raise Dead and replay keep one physical card and all its run counters',()=>{
 const r=fixture();r(`shop();purchase(0);globalThis.c=state.deck[0];b.hand=[c];playCard(0,'player');sacrificeRuleCreature(b.creatures[0]);hand('Raise Dead');playCard(0);pick('grave:0');playCard(0,'player')`);assert.equal(r('b.creatures[0].card===c'),true);assert.equal(r('b.creatures[0].power'),3);assert.equal(r('runStatCount60(c)'),1);
});
test('Clone keeps its own purchased counters and does not copy target counters',()=>{
 const r=fixture();r(`globalThis.u=ally();u.card=mint('Grizzly Bears');u.card.runCounters60=['stats','stats','deathtouch'];u.power=u.toughness=4;globalThis.c=mint('Clone');c.runCounters60=['stats','flying'];b.hand=[c];playCard(0);pick('player:'+u.id);globalThis.clone=b.creatures.find(c=>c.originalCard)`);assert.equal(r('clone.power'),3);assert.equal(r('clone.toughness'),3);assert.equal(r('clone.flying'),true);assert.equal(r('clone.deathtouch'),false);assert.equal(r('clone.card.runCardId60===c.runCardId60'),true);
});
test('deck grouping separates different purchased counters and a new run clears their effects',()=>{
 const r=fixture();r(`shop();purchase(0);globalThis.old=state.deck[0];openCollection('deck')`);assert.equal(r('state.collectionCards.filter(c=>c.name===\'Grizzly Bears\').length'),2);r(`resetRunProgress59()`);assert.equal(r('parseStats(old).power'),2);assert.equal(r('runCounterLabels60(old).length'),0);
});
test('Infect deals poison instead of life damage, with simultaneous retaliation and lifelink',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.power=1;globalThis.u=ally('Glistener Elf');u.power=3;u.lifelink=true;hit(u,e)`);assert.equal(r('e.health'),100);assert.equal(r('e.poison60'),3);assert.equal(r('state.playerHealth'),33);assert.equal(r('b.creatures.length'),0);
});
test('ten poison defeats an enemy exactly once and grants one bounty and one level',()=>{
 const r=fixture();r(`globalThis.e=enemy();globalThis.u=ally('Glistener Elf');u.power=5;u.doubleStrike=true;hit(u,e);awardBounty(e);globalThis.before=state.coins;awardBounty(e)`);assert.equal(r('e.poison60'),10);assert.equal(r('b.enemyCreatures.length'),0);assert.equal(r('b.enemyGraveyard.length'),1);assert.equal(r('state.level'),2);assert.equal(r('state.coins'),r('before'));
});
test('Toxic is additional damage, stacks, triggers on both strikes and retaliation, and never on zero',()=>{
 for(const side of ['player','enemy']){const r=fixture();r(`globalThis.e=enemy();e.power=0;globalThis.u=ally();u.toxic=2;u.power=2;u.doubleStrike=true;hit(u,e,${JSON.stringify(side)})`);assert.equal(r('e.health'),96,side);assert.equal(r('e.poison60'),4,side);}
 const r=fixture();r(`globalThis.e=enemy();globalThis.u=ally();u.toxic=2;u.power=0;hit(u,e)`);assert.equal(r('e.poison60||0'),0);
});
test('Infect and Toxic combine and Deathtouch remains lethal',()=>{
 const r=fixture();r(`globalThis.e=enemy();globalThis.u=ally('Glistener Elf');u.toxic=1;u.power=2;hit(u,e)`);assert.equal(r('e.poison60'),3);assert.equal(r('e.health'),100);
 const s=fixture();s(`globalThis.e=enemy();globalThis.u=ally('Glistener Elf');u.deathtouch=true;hit(u,e)`);assert.equal(s('b.enemyCreatures.length'),0);
});
test('Infect Trample assigns poison-lethal damage then carries poison to the next foe',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.poison60=8;globalThis.next=createFoe('boar',1);next.health=next.maxHealth=100;next.power=0;b.enemyCreatures.push(next);globalThis.u=ally('Glistener Elf');u.power=5;u.trample=true;u.lifelink=true;hit(u,e)`);assert.equal(r('e.poison60'),10);assert.equal(r('next.poison60'),3);assert.equal(r('next.health'),100);assert.equal(r('state.playerHealth'),35);assert.equal(r('b.enemyCreatures.length'),1);
});
test('Plague Myr mana ability respects summoning sickness, Haste and tapping',()=>{
 const r=fixture();r(`globalThis.u=ally('Plague Myr');u.summonedTurn=b.turn;u.summoningSick=true`);assert.equal(r('canTapForMana(u,b)'),false);r('u.haste=true;globalThis.m=b.mana;tapForMana(u.id)');assert.equal(r('b.mana'),r('m+1'));assert.equal(r('u.tapped'),true);assert.equal(r('canTapForMana(u,b)'),false);
});
test('Prologue gives every current opponent poison through Ward/Hexproof and then draws',()=>{
 const r=fixture();r(`b.enemyCreatures.forEach(e=>{e.hexproof=true;e.ward=8});globalThis.old=b.deck.length;globalThis.m=b.mana;hand('Prologue to Phyresis');playCard(0)`);assert.equal(r('b.enemyCreatures.every(e=>e.poison60===1)'),true);assert.equal(r('b.deck.length'),r('old-1'));assert.equal(r('b.mana'),r('m-2'));assert.equal(r('b.hand.length'),1);
});
test('copied poison spells poison and draw once per resolution without spilling into a new wave',()=>{
 const r=fixture();r(`b.enemyCreatures.forEach(e=>e.poison60=9);globalThis.next=[createFoe('boar',1)];b.waves=[b.enemyCreatures,next];b.waveIndex=0;b.copyNextSpell=1;globalThis.old=b.deck.length;hand('Prologue to Phyresis');playCard(0)`);assert.equal(r('b.deck.length'),r('old-2'));assert.equal(r('b.waveIndex'),1);assert.equal(r('b.enemyCreatures===next'),true);assert.equal(r('next[0].poison60||0'),0);
});
test('Infectious Inquiry draws two, loses two life, and poisons; lethal loss stops later poison',()=>{
 const r=fixture();r(`globalThis.old=b.deck.length;hand('Infectious Inquiry');playCard(0)`);assert.equal(r('b.deck.length'),r('old-2'));assert.equal(r('state.playerHealth'),28);assert.equal(r('b.enemyCreatures.every(e=>e.poison60===1)'),true);
 const s=fixture();s(`state.playerHealth=2;hand('Infectious Inquiry');playCard(0)`);assert.equal(s('b.phase'),'complete');assert.equal(s('b.enemyCreatures.some(e=>e.poison60)'),false);
});
test('poison survives recovery and turn cleanup; new encounter enemies begin at zero',()=>{
 const r=fixture();r(`globalThis.e=enemy();addPoison60(e,4);e.pattern=['guard'];e.health=50;resolveEnemyIntents();expireTurnEffects(b)`);assert.equal(r('e.poison60'),4);assert.equal(r('e.health'),53);r('beginBattle(2)');assert.equal(r('state.battle.enemyCreatures.some(e=>e.poison60)'),false);
});
test('all six original poison cards are reviewed, locally illustrated and eligible for packs',()=>{
 const r=fixture();for(const name of ['Glistener Elf','Plague Stinger','Plague Myr','Bilious Skulldweller','Prologue to Phyresis','Infectious Inquiry']){assert.equal(r(`rulesAudit(card(${JSON.stringify(name)})).playable`),true,name);assert.equal(fs.readFileSync(r(`card(${JSON.stringify(name)}).image`)).readUInt16BE(0),0xffd8);assert.ok(r(`effectDescriptions(card(${JSON.stringify(name)})).length`)>1)}assert.equal(r('BUNDLED_CARDS.length'),136);assert.equal(r('playableCards(BUNDLED_CARDS).length'),133);
});
test('tapping Sol Ring opens an unpaid action window and confirmation activates once',()=>{
 const r=fixture();r(`globalThis.p=perm('Sol Ring');globalThis.m=b.mana;openPermanentAction60(p.id)`);assert.equal(r('b.mana'),r('m'));assert.equal(r('p.tapped||false'),false);assert.match(r("$('#token-action-cost').textContent"),/Tap/);r('confirmTokenAction47();confirmTokenAction47()');assert.equal(r('b.mana'),r('m+2'));assert.equal(r('p.tapped'),true);
});
test('Fountain exposes passive and activated text without paying on open or cancel',()=>{
 const r=fixture();r(`globalThis.p=perm('Fountain of Renewal');globalThis.m=b.mana;globalThis.n=b.hand.length;openPermanentAction60(p.id)`);assert.match(r("$('#token-action-effect').textContent"),/gain 1 life/i);assert.match(r("$('#token-action-effect').textContent"),/draw a card/i);r('closeTokenAction47()');assert.equal(r('b.mana'),r('m'));r('openPermanentAction60(p.id);confirmTokenAction47()');assert.equal(r('b.mana'),r('m-3'));assert.equal(r('b.hand.length'),r('n+1'));assert.equal(r('b.permanents.includes(p)'),false);
});
test('passive artifacts have no activation button and Equipment can move through the same window',()=>{
 const r=fixture();r(`globalThis.p=perm("Krark's Thumb");openPermanentAction60(p.id)`);assert.equal(r("$('#token-action-confirm').hidden"),true);r(`closeTokenAction47();globalThis.u=ally();globalThis.eq=perm('Short Sword');globalThis.m=b.mana;openPermanentAction60(eq.id);$('#permanent-equip-target60').value=u.id;equipFromPermanentAction60()`);assert.equal(r('eq.attachedTo===u.id'),true);assert.equal(r('b.mana'),r('m-1'));assert.equal(r('u.power'),3);
});
test('stale, busy and tapped permanent windows never activate or equip',()=>{
 const r=fixture();r(`globalThis.p=perm('Sol Ring');openPermanentAction60(p.id);globalThis.m=b.mana;b.diceRoll={};confirmTokenAction47()`);assert.equal(r('b.mana'),r('m'));assert.equal(r('p.tapped||false'),false);r(`b.diceRoll=null;closeTokenAction47();openPermanentAction60(p.id);beginBattle(2);confirmTokenAction47()`);assert.equal(r('p.tapped||false'),false);
});
test('run +1/+1 counters also apply once above a rolled base, including their visible bonus',()=>{
 const r=fixture();r(`globalThis.c=mint('Elvish Impersonators');c.runCounters60=['stats','stats'];b.hand=[c];rollD6Value50=()=>3;playCard(0,'player');settleDiceRoll50();globalThis.u=b.creatures[0];refreshPermanentEffects();onCreatureEntered(u)`);assert.equal(r('u.power'),5);assert.equal(r('u.toughness'),5);assert.equal(r('creatureBonuses(u).permanent.power'),2);assert.equal(r('creatureBonuses(u).permanent.toughness'),2);
});
test('doubling +1/+1 counters includes purchased counters without creating permanent run upgrades',()=>{
 const r=fixture();r(`globalThis.c=mint('Grizzly Bears');c.runCounters60=['stats'];b.hand=[c];playCard(0,'player');globalThis.u=b.creatures[0];resolveReviewedEffect({kind:'counter',amount:1},{side:'player',id:u.id});resolveReviewedEffect({kind:'double-counters'},{side:'player',id:u.id})`);assert.equal(r('u.power'),6);assert.equal(r('u.counterPower'),3);assert.equal(r('runStatCount60(c)'),1);assert.equal(r('parseStats(c).power'),3);
});
