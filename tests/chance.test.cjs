const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){
 const nodes=new Map(),timers=[];
 function el(key){if(!nodes.has(key))nodes.set(key,{textContent:'',innerHTML:'',value:'',dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},querySelector(){return el('child')},setAttribute(){},removeAttribute(){},show(){this.open=true},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return{left:0,top:0,width:150,height:210}},isConnected:true});return nodes.get(key);}
 const c=vm.createContext({console,document:{querySelector:el,querySelectorAll:()=>[],documentElement:el('html'),body:el('body'),addEventListener(){}},window:{innerWidth:1600,innerHeight:900,addEventListener(){},scrollTo(){}},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},AbortSignal,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true})});
 for(const path of ['cards.js','sounds.js','game.js','rules.js','expansion.js','expedition-rewards.js','enemy-spells.js','enemy-counters.js','waves.js','dice.js','dice-cards.js','reaction-checks.js','chance.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
 const run=code=>vm.runInContext(code,c);
 run(`state.soundOn=false;renderBattle=()=>{};globalThis.card=name=>BUNDLED_CARDS.find(c=>c.name===name);state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.campTokens=[];state.deck=Array(60).fill(card('Grizzly Bears'));beginBattle(1);globalThis.b=state.battle;b.floatingMana=50;syncMana(b);state.playerHealth=30;b.creatures=[];b.hand=[];b.permanents=[];b.enemyCreatures.forEach(e=>{e.health=e.maxHealth=100;e.ward=0;e.counterspell=false;e.hexproof=false;e.power=1;e.flying=false;e.summonedTurn=0;for(const keyword of COMBAT_KEYWORDS)e[keyword]=false;e.card={...e.card,oracle_text:'',keywords:[]}});globalThis.hand=(...names)=>b.hand=names.map(card);globalThis.ally=(name='Grizzly Bears')=>{const u={id:'ally-'+state.nextPermanentId++,owner:'player',card:card(name),...parseStats(card(name)),...creatureKeywords(card(name)),summonedTurn:0,summoningSick:false,tapped:false,willAttack:false};b.creatures.push(u);return u};globalThis.perm=name=>{const p={id:'p-'+state.nextPermanentId++,card:card(name),attachedTo:null};b.permanents.push(p);return p};globalThis.coins=(...values)=>{globalThis.coinValues=values;rollCoinValue55=()=>{if(!coinValues.length)throw Error('Unexpected coin');return coinValues.shift()}};globalThis.d20=(...values)=>{globalThis.d20Values=values;rollD20Value55=()=>{if(!d20Values.length)throw Error('Unexpected D20');return d20Values.shift()}};globalThis.settle=()=>settleDiceRoll50(b.diceRoll.id);globalThis.pick=key=>{selectRuleChoice(key);confirmRuleChoice()};globalThis.gambit=()=>{hand('Fiery Gambit');playCard(0);pick('enemy:'+b.enemyCreatures[0].id)};`);
 return run;
}
test('all seven real chance cards are reviewed; creature abilities never fire on entry',()=>{
 const r=fixture();for(const name of ['Hoarding Ogre','Contact Other Plane','Squirrel-Powered Scheme','Tavern Swindler','Tavern Scoundrel',"Krark's Thumb",'Fiery Gambit'])assert.equal(r(`rulesAudit(card(${JSON.stringify(name)})).playable`),true);
 r(`hand('Hoarding Ogre','Tavern Swindler','Tavern Scoundrel');playCard(0,'player');playCard(0,'player');playCard(0,'player')`);assert.equal(r('state.playerHealth'),30);assert.equal(r('b.creatures.length'),3);assert.equal(r('b.permanents.length'),0);assert.equal(r('b.diceRoll||null'),null);assert.equal(r('D20_GEOMETRY55.length'),20);
});
for(const value of [1,9,10,19,20])test(`Contact Other Plane ${value} applies exactly its scry/draw row`,()=>{
 const r=fixture();r(`d20(${value});hand('Contact Other Plane');globalThis.size=b.deck.length;playCard(0)`);assert.equal(r('b.hand.length'),0);assert.equal(r('b.diceRoll.sides'),20);r('settle()');if(value>=10){assert.equal(r('b.scry.cards.length'),value===20?3:2);assert.equal(r('b.hand.length'),0);r('finishScry()');}assert.equal(r('b.hand.length'),value===20?3:2);assert.equal(r('b.resolutionTask'),null);
});
test('Scheme stacks for each own die, keeps natural faces, and never changes enemy checks',()=>{
 const r=fixture();r(`perm('Squirrel-Powered Scheme');perm('Squirrel-Powered Scheme');rollD6Value50=()=>6;ally();hand('Growth Spurt');playCard(0);pick('player:'+b.creatures[0].id)`);assert.equal(r('b.diceRoll.results[0]'),10);assert.equal(r('b.diceRoll.rawResults[0]'),6);r('settle()');assert.equal(r('b.creatures[0].power'),12);
 r(`beginDiceRoll50('Enemy',['Cast'],()=>'',()=>{},null,b,{owner:'enemy'})`);assert.equal(r('b.diceRoll.results[0]'),6);assert.equal(r('b.diceRoll.modifier'),0);
});
test('modified rolls above printed table have no listed effect for D6 and D20',()=>{
 const r=fixture();r(`perm('Squirrel-Powered Scheme');d20(20);hand('Contact Other Plane');playCard(0);settle()`);assert.equal(r('b.hand.length'),0);assert.equal(r('b.scry||null'),null);
 r(`rollD6Value50=()=>6;globalThis.mox=perm('Jack-in-the-Mox');globalThis.m=b.floatingMana;activatePermanent(mox.id);settle()`);assert.equal(r('b.floatingMana'),r('m'));assert.equal(r('mox.tapped'),true);
 r(`hand('Goblin Tutor');playCard(0);settle()`);assert.equal(r('b.librarySearch||null'),null);assert.equal(r('b.resolutionTask'),null);
});
for(const win of [0,1])test(`Swindler pays before flipping, result ${win}, and cannot activate tapped`,()=>{
 const r=fixture();r(`globalThis.u=ally('Tavern Swindler');coins(${win});activateCoin55(u.id)`);assert.equal(r('state.playerHealth'),27);assert.equal(r('u.tapped'),true);assert.equal(r('activateCoin55(u.id)'),false);r('settle()');assert.equal(r('state.playerHealth'),win?33:27);assert.equal(r('b.resolutionTask'),null);
});
test('Swindler respects sickness and loses immediately when paying the last three life',()=>{
 const r=fixture();r(`globalThis.u=ally('Tavern Swindler');u.summoningSick=true;u.summonedTurn=b.turn`);assert.equal(r('canActivateCoin55(u)'),false);r('u.summoningSick=false;state.playerHealth=3;activateCoin55(u.id)');assert.equal(r('state.playerHealth'),0);assert.equal(r('b.phase'),'complete');assert.equal(r('b.diceRoll||null'),null);
});
test('Thumb requires choosing a result; ignored flips never trigger Scoundrel',()=>{
 const r=fixture();r(`perm("Krark's Thumb");ally('Tavern Scoundrel');coins(0,1);globalThis.out=null;beginCoinFlip55('test',()=>'',win=>out=win,b)`);assert.equal(r('b.diceRoll.rawResults.length'),2);assert.equal(r('settle()'),false);r('chooseCoin55(0);settle()');assert.equal(r('out'),false);assert.equal(r("b.permanents.filter(p=>p.card.battleToken).length"),0);
 r(`coins(0,1);beginCoinFlip55('test',()=>'',win=>out=win,b);chooseCoin55(1);settle()`);assert.equal(r('out'),true);assert.equal(r("b.permanents.filter(p=>p.card.battleToken).length"),2);
});
test('Scoundrel cost picker cancels freely and pays one mana, tap and another permanent once',()=>{
 const r=fixture();r(`globalThis.u=ally('Tavern Scoundrel');globalThis.food={id:'food',card:{...CAMP_TOKEN_CARDS.food,campToken:true,tokenKind:'food'},isToken:true};b.permanents.push(food);globalThis.m=b.mana;activateCoin55(u.id);cancelChanceChoice55()`);assert.equal(r('b.mana'),r('m'));assert.equal(r('u.tapped'),false);assert.equal(r('b.permanents.includes(food)'),true);
 r(`coins(1);activateCoin55(u.id);acceptChanceChoice55(visibleChanceChoice55.options.findIndex(o=>o.key==='permanent:food'))`);assert.equal(r('b.mana'),r('m-1'));assert.equal(r('u.tapped'),true);assert.equal(r('b.permanents.includes(food)'),false);assert.equal(r('b.graveyard.some(c=>c.campToken)'),false);r('settle()');assert.equal(r('b.permanents.filter(p=>p.card.battleToken).length'),2);
});
test('Scoundrel can sacrifice a chosen creature or a mana card and updates their zones',()=>{
 for(const land of [false,true]){const r=fixture();r(`globalThis.u=ally('Tavern Scoundrel');globalThis.v=ally();b.lands=[{id:'land-cost',card:FALLBACK_LANDS[0],tapped:false}];coins(0);activateCoin55(u.id);acceptChanceChoice55(visibleChanceChoice55.options.findIndex(o=>o.key===${land?"'land:land-cost'":"'player:'+v.id"}));settle()`);assert.equal(r('b.graveyard.length'),1);assert.equal(r(land?'b.lands.length':'b.creatures.length'),land?0:1);}
});
test('stale Scoundrel costs cannot tap or spend after the selected permanent disappears',()=>{
 const r=fixture();r(`globalThis.u=ally('Tavern Scoundrel');globalThis.v=ally();globalThis.m=b.mana;activateCoin55(u.id);globalThis.index=visibleChanceChoice55.options.findIndex(o=>o.key==='player:'+v.id);b.creatures=b.creatures.filter(c=>c!==v);acceptChanceChoice55(index)`);assert.equal(r('b.mana'),r('m'));assert.equal(r('u.tapped'),false);assert.equal(r('b.diceRoll||null'),null);assert.equal(r('b.resolutionTask'),null);
});
for(const wins of [1,2,3])test(`Fiery Gambit collects cumulative rewards only after stopping at ${wins} wins`,()=>{
 const r=fixture();r(`coins(${Array(wins).fill(1).join(',')});globalThis.enemy=b.enemyCreatures[0];b.lands=[{id:'l',card:FALLBACK_LANDS[0],tapped:true}];gambit()`);
 for(let n=1;n<=wins;n++){r('settle()');assert.equal(r('enemy.health'),100);assert.equal(r('b.hand.length'),0);r(`acceptChanceChoice55(${n===wins?0:1})`);}
 assert.equal(r('enemy.health'),wins>=2?91:97);assert.equal(r('b.hand.length'),wins>=3?9:0);assert.equal(r('b.lands[0].tapped'),wins<3);assert.equal(r('b.resolutionTask'),null);
});
test('Fiery Gambit losing after a win erases spell rewards but keeps Scoundrel Treasure',()=>{
 const r=fixture();r(`ally('Tavern Scoundrel');coins(1,0);gambit();settle();acceptChanceChoice55(1);settle()`);assert.equal(r('b.enemyCreatures[0].health'),100);assert.equal(r('b.permanents.filter(p=>p.card.battleToken).length'),2);assert.equal(r('b.hand.length'),0);assert.equal(r('b.resolutionTask'),null);
});
test('copied Gambits restart at zero and copied Contact spells finish separate scry sequences',()=>{
 const r=fixture();r(`coins(1,0);hand('Doublecast','Fiery Gambit');playCard(0);playCard(0);pick('enemy:'+b.enemyCreatures[0].id);settle();acceptChanceChoice55(0)`);assert.equal(r('b.enemyCreatures[0].health'),97);assert.equal(r('b.diceRoll.kind'),'coin');r('settle()');assert.equal(r('b.enemyCreatures[0].health'),97);assert.equal(r('b.resolutionTask'),null);
 r(`d20(10,20);hand('Doublecast','Contact Other Plane');playCard(0);playCard(0);settle();finishScry()`);assert.equal(r('b.hand.length'),2);assert.equal(r('b.diceRoll.results[0]'),20);r('settle();finishScry()');assert.equal(r('b.hand.length'),5);assert.equal(r('b.resolutionTask'),null);
});
for(const value of [1,10,20])test(`Ogre roll ${value} pauses attack damage, pays Treasure, then resumes combat once`,()=>{
 const r=fixture();r(`globalThis.u=ally('Hoarding Ogre');u.willAttack=true;u.attackTargetId=b.enemyCreatures[0].id;b.phase='attack';d20(${value});globalThis.done=0;resolvePlayerAttacks(null,()=>done++);resolvePlayerAttacks(null,()=>done++)`);assert.equal(r('b.enemyCreatures[0].health'),100);assert.equal(r('done'),0);assert.equal(r('u.tapped'),true);r('settle()');assert.equal(r('b.enemyCreatures[0].health'),97);assert.equal(r('done'),1);assert.equal(r('b.permanents.filter(p=>p.card.battleToken).length'),value===1?1:value===10?2:3);assert.equal(r('b.resolutionTask||null'),null);
});
test('combat-created tokens do not inflate run inventory and can be consumed normally',()=>{
 const r=fixture();r('createTreasure55(2,b);activatePermanent(b.permanents[0].id)');assert.equal(r('b.permanents.length'),1);assert.equal(r('b.floatingMana'),51);assert.equal(r('state.campTokens.length'),0);assert.equal(r('b.graveyard.some(c=>c.campToken)'),false);
});
test('a stopped scene or new battle rejects old coin and choice continuations',()=>{
 const r=fixture();r(`coins(1);gambit();settle();globalThis.old=visibleChanceChoice55;showScreen('start-screen')`);assert.equal(r('visibleChanceChoice55'),null);assert.equal(r('acceptChanceChoice55(0)'),false);assert.equal(r('b.enemyCreatures[0].health'),100);
 const s=fixture();s(`globalThis.u=ally('Tavern Swindler');coins(1);activateCoin55(u.id);globalThis.id=b.diceRoll.id;beginBattle(1)`);assert.equal(s('settleDiceRoll50(id)'),false);assert.equal(s('state.playerHealth'),27);
});
test('Scheme modifies both independent creature rolls and stops applying after sacrifice',()=>{
 const r=fixture();r(`globalThis.scheme=perm('Squirrel-Powered Scheme');globalThis.values=[1,6];rollD6Value50=()=>values.shift();hand('Elvish Impersonators');playCard(0,'player')`);assert.equal(r('b.diceRoll.results.join()'),'3,8');r('settle()');assert.equal(r('b.creatures[0].power'),3);assert.equal(r('b.creatures[0].toughness'),8);r("sacrificePermanent55('permanent:'+scheme.id,b)");assert.equal(r('diceModifier55(b)'),0);
});
test('two attacking Ogres complete two separate rolls before the attack continuation',()=>{
 const r=fixture();r(`ally('Hoarding Ogre');ally('Hoarding Ogre');b.creatures.forEach(c=>{c.willAttack=true;c.attackTargetId=b.enemyCreatures[0].id});b.phase='attack';d20(20,10);globalThis.done=0;resolvePlayerAttacks(null,()=>done++)`);r('settle()');assert.equal(r('done'),0);assert.equal(r('b.permanents.length'),3);assert.equal(r('b.enemyCreatures[0].health'),97);r('settle()');assert.equal(r('done'),1);assert.equal(r('b.permanents.length'),5);assert.equal(r('b.enemyCreatures[0].health'),94);
});
test('Gambit pays Ward before flipping and declining it never consumes a coin',()=>{
 const r=fixture();r(`b.enemyCreatures[0].ward=2;coins(1);gambit()`);assert.equal(r('b.diceRoll||null'),null);assert.equal(r('coinValues.length'),1);r('answerWard27(false)');assert.equal(r('b.resolutionTask'),null);assert.equal(r('coinValues.length'),1);
});
test('sacrificing the Thumb as Scoundrel cost removes its replacement before flipping',()=>{
 const r=fixture();r(`globalThis.u=ally('Tavern Scoundrel');globalThis.thumb=perm("Krark's Thumb");coins(1);activateCoin55(u.id);acceptChanceChoice55(visibleChanceChoice55.options.findIndex(o=>o.key==='permanent:'+thumb.id))`);assert.equal(r('b.diceRoll.rawResults.length'),1);r('settle()');assert.equal(r('b.permanents.length'),2);
});
test('a copied Gambit fizzles if the first resolution removes its only target',()=>{
 const r=fixture();r(`b.enemyCreatures=b.enemyCreatures.slice(0,1);b.enemyCreatures[0].health=3;coins(1);hand('Doublecast','Fiery Gambit');playCard(0);playCard(0);pick('enemy:'+b.enemyCreatures[0].id);settle();acceptChanceChoice55(0)`);assert.equal(r('coinValues.length'),0);assert.equal(r('b.diceHistory.filter(h=>h.kind===\'coin\').length'),1);assert.equal(r('b.phase'),'complete');
});
