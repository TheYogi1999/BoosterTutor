const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {fixture}=require('./warleaders-fixture.cjs');
function choose(r,index=0){r(`pumpJesters65(b);pickJesterChoice65(${index});confirmJesterChoice65();pumpJesters65(b)`);}
function attack(r){r(`b.phase='attack';globalThis.finished=false;resolvePlayerAttacks(null,()=>finished=true)`);}

test('all nine are playable, independently reviewed and use local original-set images',()=>{
 const r=fixture();assert.equal(r('CARDS103.size'),9);
 for(const name of r('[...CARDS103]')){const n=JSON.stringify(name);assert.equal(r(`rulesAudit(card(${n})).playable`),true,name);assert.equal(r(`cardEffects(card(${n})).length`),0,name);assert.ok(fs.existsSync(r(`card(${n}).image`)),name);assert.equal(r(`state.pool.some(c=>c.name===${n})`),true,name);}
 for(const [name,set] of [['Primordial Ooze','leg'],['Aurelia, the Warleader','gtc'],['Gisela, Blade of Goldnight','avr'],['Adeline, Resplendent Cathar','mid'],['Roxanne, Starfall Savant','otj']])assert.equal(r(`card(${JSON.stringify(name)}).art_print.set`),set);
});
test('each actual spell enters with its printed stats, generic payment and no invented spell effects',()=>{
 for(const [name,p,t,cost] of [['Primordial Ooze',1,1,1],['Aurelia, the Warleader',3,4,6],['Aurelia, the Law Above',4,4,5],['Gisela, Blade of Goldnight',5,5,7],['Adeline, Resplendent Cathar',1,4,3],['Anzrag, the Quake-Mole',8,4,4],['Zopandrel, Hunger Dominus',4,6,7],['Roxanne, Starfall Savant',4,3,5],['Mirkwood Bats',2,3,4]]){
  const r=fixture();r(`enemy();hand(${JSON.stringify(name)});playCard(0,'player')`);assert.equal(r('b.creatures[0].power'),p,name);assert.equal(r('b.creatures[0].toughness'),t,name);assert.equal(r('b.mana'),50-cost,name);assert.equal(r('b.enemyCreatures[0].health'),100,name);
 }
});
test('printed combat keywords are accurate, including first strike versus Scryfall’s Double action tag',()=>{
 const r=fixture();r(`globalThis.a=ally('Aurelia, the Warleader');globalThis.g=ally('Gisela, Blade of Goldnight')`);
 for(const k of ['flying','vigilance','haste'])assert.equal(r(`hasCreatureKeyword(a,'${k}')`),true);
 assert.equal(r(`hasCreatureKeyword(g,'first strike')`),true);assert.equal(r(`hasCreatureKeyword(g,'double strike')`),false);assert.equal(r(`hasCreatureKeyword(ally('Zopandrel, Hunger Dominus'),'reach')`),true);
});
test('Ooze adds its counter and waits for payment BEFORE the turn draw; mana taps real lands',()=>{
 const r=fixture();r(`enemy();globalThis.o=ally('Primordial Ooze');b.floatingMana=0;b.lands=Array.from({length:3},(_,i)=>({id:'l'+i,card:FALLBACK_LANDS[0],tapped:true}));globalThis.h=b.hand.length;beginNextPlayerTurn45(b)`);
 assert.equal(r('o.power'),2);assert.equal(r('b.hand.length'),r('h'));assert.equal(r('visibleJesterChoice65.title'),'Primordial Ooze · upkeep (1 mana)');choose(r,0);
 assert.equal(r('b.hand.length'),r('h+1'));assert.equal(r('b.lands.filter(l=>l.tapped).length'),1);assert.equal(r('state.playerHealth'),30);assert.equal(r('o.tapped'),false);
});
test('Ooze decline taps and damages; Gisela prevents half rounded up and Ring prevents all damage',()=>{
 for(const protection of ['none','gisela','ring']){const r=fixture();r(`enemy();globalThis.o=ally('Primordial Ooze');resolveReviewedEffect({kind:'counter',amount:2},{side:'player',id:o.id},{card:o.card});${protection==='gisela'?"ally('Gisela, Blade of Goldnight')":''};${protection==='ring'?'b.ringProtectionUntil95=100':''};globalThis.draws=0;upkeep103(b,()=>draws++)`);choose(r,1);assert.equal(r('o.tapped'),true);assert.equal(r('o.counterPower'),3);assert.equal(r('draws'),1);assert.equal(r('state.playerHealth'),protection==='ring'?30:protection==='gisela'?29:27);}
});
test('Ooze cannot cancel or pay unaffordable upkeep; can decline instead and dies before draw if lethal',()=>{
 const r=fixture();r(`enemy();globalThis.o=ally('Primordial Ooze');b.lands=[];b.floatingMana=0;syncMana(b);state.playerHealth=1;globalThis.draws=0;upkeep103(b,()=>draws++)`);
 assert.equal(r('cancelJesterChoice65()'),false);r('pickJesterChoice65(0)');assert.equal(r('confirmJesterChoice65()'),false);choose(r,1);assert.equal(r('b.phase'),'complete');assert.equal(r('draws'),0);
});
test('Warleader untaps ALL declared attackers, grants exactly one extra combat and leaves lands/library/turn unchanged',()=>{
 const r=fixture();r(`enemy();globalThis.a=ally('Aurelia, the Warleader');globalThis.bear=ally();a.willAttack=bear.willAttack=true;b.lands=[{id:'land',card:FALLBACK_LANDS[0],tapped:true}];globalThis.library=b.deck.length;globalThis.turn=b.turn;globalThis.m=b.mana;afterCombatBeat=(b,p,fn)=>b.priorityCallback=fn;finishTurn();handleCombatAction()`);
 assert.equal(r('b.phase'),'main');assert.equal(r('b.combatOnly103'),true);assert.equal(r('a.tapped'),false);assert.equal(r('bear.tapped'),false);assert.equal(r('b.lands[0].tapped'),true);assert.equal(r('b.deck.length'),r('library'));assert.equal(r('b.turn'),r('turn'));assert.equal(r('b.mana'),r('m'));
 r(`a.willAttack=bear.willAttack=true;finishTurn();handleCombatAction()`);assert.equal(r('b.phase'),'enemy');assert.equal(r('b.extraCombats103'),0);assert.equal(r('bear.tapped'),true,'no second Warleader untap');
});
test('extra combat allows instants/Flash but no sorcery, ordinary creature, land, or equip',()=>{
 const r=fixture();r('b.extraCombats103=1;offerExtraCombat103(b)');for(const name of ['Shock','Mithril Coat'])assert.equal(r(`canCastNow(card('${name}'),b)`),true);for(const name of ['Divination','Grizzly Bears'])assert.equal(r(`canCastNow(card('${name}'),b)`),false);assert.equal(r('canCastNow(FALLBACK_LANDS[0],b)'),false);assert.equal(r(`equipCost(card('Bonesplitter'))`),null);assert.match(r(`phaseInfo('main').label`),/Extra combat/);
});
test('Law Above uses declared attackers on either side, and five attackers damage every opponent and gain three life',()=>{
 for(const side of ['player','enemy'])for(const n of [2,3,5]){
  const r=fixture();r(`globalThis.e=enemy();ally('Aurelia, the Law Above');globalThis.before=b.hand.length;${side==='player'?'declareAttackers103':'enemyAttackers103'}(Array.from({length:${n}},()=>({card:{name:'test'}})),b,()=>{})`);assert.equal(r('b.hand.length'),r(`before+${n>=3?1:0}`));assert.equal(r('state.playerHealth'),n>=5?33:30);assert.equal(r('e.health'),n>=5?97:100);
 }
});
test('Gisela changes damage, not life loss or life payments; one damage becomes zero with no deathtouch or lifelink',()=>{
 const r=fixture();r(`globalThis.g=ally('Gisela, Blade of Goldnight');globalThis.u=ally();globalThis.e=enemy();e.deathtouch=e.lifelink=true;e.power=1;hit(u,e)`);assert.equal(r('u.damage||0'),0);assert.equal(r('Boolean(u.deathtouchDamage)'),false);assert.equal(r('e.health'),96);assert.equal(r('b.creatures.includes(u)'),true);
 r(`resolveReviewedEffect({kind:'lose-life',amount:3},null,{card:card('Read the Bones')})`);assert.equal(r('state.playerHealth'),27);
 r(`resolveReviewedEffect({kind:'damage',amount:3},{side:'life'},{card:card('Shock')})`);assert.equal(r('state.playerHealth'),26);
});
test('Gisela affects combat, spell, activated ability and enemy spell damage exactly once',()=>{
 const r=fixture();r(`ally('Gisela, Blade of Goldnight');globalThis.u=ally();u.toughness=10;globalThis.e=enemy();resolveReviewedEffect({kind:'damage',amount:3},{side:'enemy',id:e.id},{card:card('Lightning Bolt')})`);assert.equal(r('e.health'),94);
 r(`dealAbility66({card:card('Goblin Fireslinger')},{side:'enemy',id:e.id},2,b)`);assert.equal(r('e.health'),90);
 r(`dealAbility66({card:card('Goblin Fireslinger')},{side:'player',id:u.id},3,b)`);assert.equal(r('u.damage'),1);
 r(`globalThis.spell={card:{name:'Shock'},status:'pending',intent:'rune',target:{side:'player',id:u.id},manaRemaining:5};resolveEnemySpell38(spell,b)`);assert.equal(r('u.damage'),2);
 r(`spell={card:{name:"Sovereign's Bite"},status:'pending',intent:'drain',target:{side:'life'},manaRemaining:5};resolveEnemySpell38(spell,b)`);assert.equal(r('state.playerHealth'),27);
});
test('Gisela snapshot covers simultaneous lethal damage, then ends before normal damage; trample assignment precedes doubling',()=>{
 const r=fixture();r(`globalThis.g=ally('Gisela, Blade of Goldnight');globalThis.a=ally();a.power=5;a.trample=true;globalThis.e=enemy();e.health=3;e.power=0;globalThis.next={...e,id:'next',health:100,maxHealth:100};b.enemyCreatures.push(next);hit(a,e)`);assert.equal(r('next.health'),96,'assign 3 to first monster and 2 overflow, then double each');
 const s=fixture();s(`globalThis.g=ally('Gisela, Blade of Goldnight');g.firstStrike=false;globalThis.a=ally();a.toughness=10;globalThis.e=enemy();e.power=10;e.reach=true;globalThis.other={...e,id:'other',power:3};b.enemyCreatures.push(other);resolveCombatDamage([g,a],new Map([[g.id,[e]],[a.id,[other]]]),'player')`);assert.equal(s('b.creatures.includes(g)'),false);assert.equal(s('a.damage'),1,'Gisela applies to all recipients of simultaneous damage');assert.equal(s('other.health'),96);
});
test('Adeline base tracks creature count without accumulating or overwriting counters/buffs',()=>{
 const r=fixture();r(`enemy();globalThis.a=ally('Adeline, Resplendent Cathar');refreshPermanentEffects();globalThis.u=ally();refreshPermanentEffects();resolveReviewedEffect({kind:'counter',amount:2},{side:'player',id:a.id},{card:a.card});resolveReviewedEffect({kind:'buff',power:3,toughness:3},{side:'player',id:a.id},{card:a.card});refreshPermanentEffects();refreshPermanentEffects()`);assert.equal(r('a.power'),7);assert.equal(r('a.toughness'),9);r('sacrificeRuleCreature(u);refreshPermanentEffects()');assert.equal(r('a.power'),6);r('expireTurnEffects(b);refreshPermanentEffects()');assert.equal(r('a.power'),3);assert.match(r(`cardFactsMarkup(a.card)`),/\*/);
});
test('Adeline triggers when she stays home; attacking Human tokens do not count as declarations or draw via Law Above',()=>{
 const r=fixture();r(`globalThis.e=enemy();b.enemyCreatures.push({...e,id:'e2'},{...e,id:'e3'});globalThis.a=ally('Adeline, Resplendent Cathar');ally('Aurelia, the Law Above');globalThis.u=ally();u.willAttack=true;globalThis.h=b.hand.length`);attack(r);
 assert.equal(r('finished'),true);assert.equal(r('b.creatures.filter(u=>u.isToken).length'),3);assert.equal(r('b.creatures.filter(u=>u.isToken&&u.tapped&&u.attackedThisTurn).length'),3);assert.equal(r('a.attackedThisTurn||false'),false);assert.equal(r('b.hand.length'),r('h'));assert.equal(r('a.power'),6);assert.equal(r('e.health'),97,'Bear and one Human attack the first monster');
});
test('Adeline never exceeds six creature slots; Bats sees only tokens actually created',()=>{
 const r=fixture();r(`globalThis.e=enemy();b.enemyCreatures.push({...e,id:'e2'},{...e,id:'e3'});ally('Adeline, Resplendent Cathar');ally('Mirkwood Bats');ally();ally();globalThis.u=ally();u.willAttack=true`);attack(r);assert.equal(r('b.creatures.length'),6);assert.equal(r('b.creatures.filter(u=>u.isToken).length'),1);assert.equal(r('e.health'),96,'one life loss plus Bear 2 plus Human 1');
});
test('Anzrag grants repeated extra combats only when actually blocked, ignoring illegal Flying blocks',()=>{
 const r=fixture();r(`globalThis.a=ally('Anzrag, the Quake-Mole');globalThis.e=enemy();globalThis.u=ally();u.tapped=true;beginCombat103(b,'player');hit(a,e)`);assert.equal(r('b.extraCombats103'),1);assert.equal(r('u.tapped'),false);r(`beginCombat103(b,'player');hit(a,e)`);assert.equal(r('b.extraCombats103'),2);
 const s=fixture();s(`globalThis.a=ally('Anzrag, the Quake-Mole');globalThis.e=enemy();e.flying=true;beginCombat103(b,'player');hit(a,e)`);assert.equal(s('b.extraCombats103||0'),0);
});
test('Anzrag ability costs seven, does not tap or need haste, and expires at cleanup',()=>{
 const r=fixture();r(`globalThis.a=ally('Anzrag, the Quake-Mole');a.summonedTurn=b.turn;a.tapped=true;state.creatureAbility66={battle:b,id:a.id};confirmCreatureAbility66()`);assert.equal(r('b.mana'),43);assert.equal(r('a.mustBlock103'),r('b.turn'));assert.equal(r('a.tapped'),true);r('expireTurnEffects(b)');assert.equal(r('a.mustBlock103'),undefined);
});
test('Zopandrel doubles each combat using snapshots; new creatures miss earlier triggers; cleanup removes only temporary bonuses',()=>{
 const r=fixture();r(`enemy();globalThis.z=ally('Zopandrel, Hunger Dominus');globalThis.u=ally();resolveReviewedEffect({kind:'counter',amount:1},{side:'player',id:u.id},{card:u.card});beginCombat103(b,'player');globalThis.late=ally();beginCombat103(b,'enemy')`);assert.equal(r('u.power'),12);assert.equal(r('u.toughness'),12);assert.equal(r('late.power'),4);assert.equal(r('z.power'),16);r('sacrificeRuleCreature(z);expireTurnEffects(b);refreshPermanentEffects()');assert.equal(r('u.power'),3);assert.equal(r('u.toughness'),3);assert.equal(r('late.power'),2);
});
test('Zopandrel doubles negative power and recomputes snapshots for additional combats',()=>{
 const r=fixture();r(`enemy();ally('Zopandrel, Hunger Dominus');globalThis.u=ally();u.power=-2;beginCombat103(b,'player');beginCombat103(b,'player')`);assert.equal(r('u.power'),-8);assert.equal(r('u.toughness'),8);r('expireTurnEffects(b)');assert.equal(r('u.power'),-2);
});
test('Zopandrel validates both sacrifices before all costs; all three Phyrexian choices work while tapped and summoning sick',()=>{
 for(const [index,mana,life] of [[0,2,0],[1,1,2],[2,0,4]]){
  const r=fixture();r(`enemy();globalThis.z=ally('Zopandrel, Hunger Dominus');z.tapped=true;z.summonedTurn=b.turn;ally();ally();state.creatureAbility66={battle:b,id:z.id};confirmCreatureAbility66()`);choose(r,index);assert.equal(r('b.mana'),50);assert.equal(r('state.playerHealth'),30);assert.equal(r('visibleJesterChoice65.options.some(o=>o.unit===z)'),false);r('pickJesterChoice65(0);pickJesterChoice65(1);confirmJesterChoice65()');assert.equal(r('b.mana'),50-mana);assert.equal(r('state.playerHealth'),30-life);assert.equal(r('b.creatures.length'),1);assert.equal(r('z.indestructibleCounters103'),1);assert.equal(r(`hasCreatureKeyword(z,'indestructible')`),true);
 }
});
test('Zopandrel can cancel without payment and cannot confirm a stale sacrifice',()=>{
 const r=fixture();r(`enemy();globalThis.z=ally('Zopandrel, Hunger Dominus');globalThis.a=ally();ally();state.creatureAbility66={battle:b,id:z.id};confirmCreatureAbility66()`);choose(r,0);r('pickJesterChoice65(0);pickJesterChoice65(1);sacrificeRuleCreature(a)');assert.equal(r('confirmJesterChoice65()'),false);assert.equal(r('b.mana'),50);assert.equal(r('state.playerHealth'),30);assert.equal(r('cancelJesterChoice65()'),true);assert.equal(r('z.indestructibleCounters103||0'),0);
});
test('Indestructible counter survives cleanup and destruction, but not exile or a new battlefield copy',()=>{
 const r=fixture();r(`enemy();globalThis.z=ally('Zopandrel, Hunger Dominus');z.indestructibleCounters103=1;z.damage=99;expireTurnEffects(b);b.creatures=removeDeadCreatures(b.creatures,'player');resolveReviewedEffect({kind:'destroy'},{side:'player',id:z.id},{card:card('Murder')})`);assert.equal(r('b.creatures.includes(z)'),true);r(`resolveReviewedEffect({kind:'exile'},{side:'player',id:z.id},{card:card('Swords to Plowshares')});globalThis.fresh=ally('Zopandrel, Hunger Dominus')`);assert.equal(r('b.creatures.includes(z)'),false);assert.equal(r(`hasCreatureKeyword(fresh,'indestructible')`),false);
});
test('Roxanne entry makes a tapped colorless Meteorite and a separate Ward-aware targeted damage trigger',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.ward=2;hand('Roxanne, Starfall Savant');playCard(0,'player');pumpJesters65(b);globalThis.p=b.permanents[0]`);assert.equal(r('p.card.name'),'Meteorite');assert.equal(r('p.tapped'),true);assert.equal(r('p.card.color_identity.length'),0);assert.equal(r('canActivatePermanent(p,b)'),false);choose(r,0);assert.match(r('visibleJesterChoice65.title'),/Ward/);choose(r,0);assert.equal(r('e.health'),98);assert.equal(r('b.mana'),43);assert.equal(r('b.permanents.includes(p)'),true);
});
test('Meteorite survives Ward countering and can tap next turn through its token action window',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.ward=2;hand('Roxanne, Starfall Savant');playCard(0,'player');pumpJesters65(b);globalThis.p=b.permanents[0]`);choose(r,0);choose(r,1);assert.equal(r('e.health'),100);r('beginNextPlayerTurn45(b)');assert.equal(r('p.tapped'),false);r('globalThis.m=b.mana;openTokenAction47(p.id)');assert.equal(r('b.mana'),r('m'));r('closeTokenAction47();activatePermanent(p.id)');assert.equal(r('b.mana'),r('m+2'));assert.equal(r('p.tapped'),true);assert.equal(r('b.permanents.includes(p)'),true);assert.equal(r('activatePermanent(p.id)'),false);
});
test('Roxanne adds one bonus for tapped Treasure, not Sol Ring or Black Lotus cards',()=>{
 const r=fixture();r(`enemy();ally('Roxanne, Starfall Savant');createTreasure55(1,b);globalThis.t=b.permanents[0];globalThis.m=b.mana;activatePermanent(t.id)`);assert.equal(r('b.mana'),r('m+2'));r(`globalThis.ring=perm('Sol Ring');globalThis.lotus=perm('Black Lotus');activatePermanent(ring.id);activatePermanent(lotus.id)`);assert.equal(r('b.mana'),r('m+7'));
});
test('Roxanne attack creates another Meteorite before her combat damage',()=>{
 const r=fixture();r(`globalThis.e=enemy();globalThis.u=ally('Roxanne, Starfall Savant');u.willAttack=true`);attack(r);assert.equal(r('finished'),false);assert.equal(r('b.permanents.length'),1);choose(r,0);assert.equal(r('finished'),true);assert.equal(r('e.health'),94);
});
test('Bats triggers once per real token creation and sacrifice; life loss ignores Gisela, Ward and protection',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.ward=99;e.protection90=['B'];ally('Gisela, Blade of Goldnight');ally('Mirkwood Bats');createTreasure55(3,b);afterJesters65(b,()=>{})`);assert.equal(r('e.health'),97);r('activatePermanent(b.permanents[0].id);afterJesters65(b,()=>{})');assert.equal(r('e.health'),96);assert.equal(r('b.permanents.length'),2);
});
test('Bats ignores destruction/exile and non-token sacrifices; two Bats see each real token separately',()=>{
 const r=fixture();r(`globalThis.e=enemy();ally('Mirkwood Bats');ally('Mirkwood Bats');createTreasure55(2,b);afterJesters65(b,()=>{});globalThis.t=b.permanents[0];resolveReviewedEffect({kind:'destroy'},{side:'permanent',id:t.id},{card:card('Disenchant')});afterJesters65(b,()=>{});globalThis.l=perm('Black Lotus');activatePermanent(l.id);afterJesters65(b,()=>{})`);assert.equal(r('e.health'),96);
});
test('Bats last-known trigger sees a creature token sacrificed simultaneously with Bats to Zopandrel',()=>{
 const r=fixture();r(`globalThis.e=enemy();globalThis.z=ally('Zopandrel, Hunger Dominus');ally('Mirkwood Bats');globalThis.t=ally();t.isToken=true;state.creatureAbility66={battle:b,id:z.id};confirmCreatureAbility66()`);choose(r,0);r('pickJesterChoice65(0);pickJesterChoice65(1);confirmJesterChoice65();pumpJesters65(b)');assert.equal(r('b.creatures.length'),1);assert.equal(r('e.health'),99);
});
test('countered new creature spells cannot create tokens or grant abilities',()=>{
 const r=fixture();r(`enemy();offerEnemyCounter44=(c,b,resume,countered)=>{countered();return true};hand('Roxanne, Starfall Savant');playCard(0,'player')`);assert.equal(r('b.creatures.length'),0);assert.equal(r('b.permanents.length'),0);assert.equal(r('b.jesterQueue65?.length||0'),0);
});
test('Roxanne never inherits the quoted tap ability printed inside her Meteorite rules',()=>{
 const r=fixture();r(`enemy();globalThis.r=ally('Roxanne, Starfall Savant');globalThis.m=b.mana`);assert.equal(r('manaCreatureAction73(r)'),false);assert.equal(r('canTapForMana(r,b)'),false);assert.equal(r('tapForMana(r.id)'),false);assert.equal(r('b.mana'),r('m'));assert.equal(r('r.tapped'),false);
});
test('Adeline immediately loses a point of base power when another creature dies in combat',()=>{
 const r=fixture();r(`globalThis.a=ally('Adeline, Resplendent Cathar');globalThis.u=ally();globalThis.e=enemy();e.power=2;refreshPermanentEffects();hit(u,e)`);assert.equal(r('b.creatures.includes(u)'),false);assert.equal(r('a.power'),1);assert.equal(r('creatureBonuses(a).permanent.power'),0);
});
test('an attacking creature whose chosen target vanished is neither declared nor tapped and cannot trigger Aurelia',()=>{
 const r=fixture();r(`enemy();globalThis.a=ally('Aurelia, the Warleader');a.attackTargetId='gone';a.willAttack=true`);attack(r);assert.equal(r('finished'),true);assert.equal(r('a.attackedThisTurn||false'),false);assert.equal(r('b.extraCombats103||0'),0);
});
test('old token triggers and extra combats cannot leak into a reinforcement wave after the last monster dies',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.health=1;globalThis.next={...e,id:'next-wave',health:100,maxHealth:100};b.waves=[b.enemyCreatures,[next]];b.waveIndex=0;ally('Mirkwood Bats');b.extraCombats103=2;createTreasure55(3,b);afterJesters65(b,()=>{})`);assert.equal(r('b.waveIndex'),1);assert.equal(r('next.health'),100);assert.equal(r('b.extraCombats103'),0);assert.equal(r('jesterPending65(b)'),false);assert.equal(r('b.jesterContinuations65.length'),0);
});
test('Ooze upkeep includes run +1/+1 counters and adding the upkeep counter cancels a -1/-1 counter first',()=>{
 const r=fixture();r(`enemy();globalThis.o=ally('Primordial Ooze');o.card={...runCard59(o.card),runCounters60:['stats','stats']};upkeep103(b,()=>{})`);assert.match(r('visibleJesterChoice65.title'),/3 mana/);
 const s=fixture();s(`enemy();globalThis.o=ally('Primordial Ooze');o.toughness+=2;o.minusCounters66=1;o.power--;o.toughness--;upkeep103(b,()=>{})`);assert.equal(s('o.minusCounters66'),0);assert.equal(s('o.counterPower'),0);assert.match(s('visibleJesterChoice65.title'),/0 mana/);
});
test('Adeline retains physical run upgrades on top of variable base power, including after later entries',()=>{
 const r=fixture();r(`enemy();globalThis.c=runCard59(card('Adeline, Resplendent Cathar'));c.runCounters60=['stats','stats'];b.hand=[c];playCard(0,'player');globalThis.a=b.creatures[0]`);assert.equal(r('a.power'),3);assert.equal(r('a.toughness'),6);r('ally();refreshPermanentEffects();refreshPermanentEffects()');assert.equal(r('a.power'),4);assert.equal(r('a.toughness'),6);assert.match(r('cardFactsMarkup(c)'),/\*/);
});
test('Human tokens are actually white for color protection; Meteorites are colorless',()=>{
 const r=fixture();r(`globalThis.e=enemy();e.protection90=['W'];ally('Adeline, Resplendent Cathar');globalThis.u=ally();u.willAttack=true`);attack(r);assert.equal(r('b.creatures.filter(u=>u.isToken).length'),1);assert.equal(r(`cardColors88(b.creatures.find(u=>u.isToken).card).join('')`),'W');assert.equal(r(`protectedFrom90(e,b.creatures.find(u=>u.isToken))`),true);assert.equal(r('e.health'),98,'only the green Bear damages this protected monster');assert.equal(r('cardColors88(TOKENS103.meteorite).length'),0);
});
