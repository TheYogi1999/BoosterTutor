const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(storage=new Map(),blocked=false){
 const nodes=new Map(),timers=[];
 function el(key){if(!nodes.has(key))nodes.set(key,{textContent:'',innerHTML:'',value:'',dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},querySelectorAll(){return[]},querySelector(){return el('child')},setAttribute(){},removeAttribute(){},show(){this.open=true},showModal(){this.open=true},close(){this.open=false},focus(){},getBoundingClientRect(){return{left:0,top:0,width:150,height:210}},isConnected:true});return nodes.get(key);}
 const c=vm.createContext({console,document:{querySelector:s=>s==='dialog[open]'?[...nodes.values()].find(n=>n.open)||null:el(s),querySelectorAll:()=>[],documentElement:el('html'),body:el('body'),addEventListener(){}},window:{innerWidth:1600,innerHeight:900,addEventListener(){},scrollTo(){}},requestAnimationFrame(){},setTimeout(fn){timers.push(fn);return timers.length},clearTimeout(){},AbortSignal,localStorage:{getItem(key){if(blocked)throw Error('No storage');return storage.get(key)??null},setItem(key,value){if(blocked)throw Error('No storage');storage.set(key,value)}},matchMedia:()=>({matches:true})});
 for(const path of ['cards.js','sounds.js','game.js','rules.js','expansion.js','expedition-rewards.js','enemy-spells.js','enemy-counters.js','waves.js','dice.js','dice-cards.js','reaction-checks.js','chance.js','battle-details.js','relics.js','run-progression.js','run-counters.js','poison.js','permanent-actions.js','card-finish-ui.js','jesters.js','jester-family.js','reviewed-cards.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
 const run=code=>vm.runInContext(code,c);
 run(`state.soundOn=false;renderBattle=()=>{};globalThis.card=name=>BUNDLED_CARDS.find(c=>c.name===name);state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.campTokens=[];state.deck=Array(60).fill(card('Grizzly Bears'));beginBattle(1);globalThis.b=state.battle;b.floatingMana=50;syncMana(b);state.playerHealth=30;b.creatures=[];b.hand=[];b.permanents=[];b.enemyCreatures.forEach(e=>{e.health=e.maxHealth=100;e.ward=0;e.counterspell=false;e.hexproof=false;e.power=1;e.flying=false;e.summonedTurn=0;for(const keyword of COMBAT_KEYWORDS)e[keyword]=false;e.firstStrike=false;e.doubleStrike=false;e.card={...e.card,oracle_text:'',keywords:[]}});globalThis.hand=(...names)=>b.hand=names.map(card);globalThis.ally=(name='Grizzly Bears')=>{const u={id:'ally-'+state.nextPermanentId++,owner:'player',card:card(name),...parseStats(card(name)),...creatureKeywords(card(name)),summonedTurn:0,summoningSick:false,tapped:false,willAttack:false};b.creatures.push(u);return u};globalThis.perm=name=>{const p={id:'p-'+state.nextPermanentId++,card:card(name),attachedTo:null};b.permanents.push(p);return p};globalThis.coins=(...values)=>{globalThis.coinValues=values;rollCoinValue55=()=>{if(!coinValues.length)throw Error('Unexpected coin');return coinValues.shift()}};globalThis.d20=(...values)=>{globalThis.d20Values=values;rollD20Value55=()=>{if(!d20Values.length)throw Error('Unexpected D20');return d20Values.shift()}};globalThis.settle=()=>settleDiceRoll50(b.diceRoll.id);globalThis.pick=key=>{selectRuleChoice(key);confirmRuleChoice()};globalThis.gambit=()=>{hand('Fiery Gambit');playCard(0);pick('enemy:'+b.enemyCreatures[0].id)};`);
 return run;
}
test('fresh run cards are never randomly foil and never consume finish RNG',()=>{
 const r=fixture();r(`Math.random=()=>{throw Error('Random finish');};globalThis.a=runCard59(card('Grizzly Bears'));globalThis.n=runCard59(card('Sol Ring'))`);assert.equal(r('isFoilCard59(a)'),false);assert.equal(r('isFoilCard59(n)'),false);assert.equal(r("'runCounters60' in card('Grizzly Bears')"),false);
});
test('an upgraded physical copy is foil with visible counter marks, while the other copy stays normal',()=>{
 const r=fixture();r(`globalThis.a=runCard59(card('Grizzly Bears'));globalThis.bear=physicalRunCopy60(a);a.runCounters60.push('stats','flying')`);assert.equal(r('isFoilCard59(a)'),true);assert.equal(r('isFoilCard59(bear)'),false);assert.match(r('cardFace(a)'),/card-run-counters61/);assert.match(r('cardFace(a)'),/2 run counters/);assert.match(r('cardFace(a)'),/data-finish="foil"/);assert.doesNotMatch(r('cardFace(bear)'),/data-finish/);
});
test('unmodified packs and rerolls remain nonfoil without mutating their catalog sources',()=>{
 const r=fixture();r(`state.packs=[state.pool.slice(0,7)];state.activePack=0;state.boosterSealed=true;state.draftKind='reward';renderDraft();globalThis.pack=state.packs[0];renderDraft();state.boosterSealed=false;renderDraft()`);assert.equal(r('pack===state.packs[0]'),true);assert.equal(r('pack.some(isFoilCard59)'),false);r(`state.rerolledPacks=new Set();rerollCurrentPack()`);assert.equal(r('state.packs[0].some(isFoilCard59)'),false);assert.equal(r('state.pool.some(c=>c.runCounters60)'),false);
});
test('drafted copies, mana and the starter Booster Tutor begin without foil',()=>{
 const r=fixture();r(`state.packs=Array.from({length:6},()=>state.pool.slice(0,7));state.draftKind='starter';state.activePack=5;state.selection=new Map(Array.from({length:6},(_,i)=>[i,0]));state.boosterSealed=false;renderDraft();state.deck=[];confirmDraft()`);assert.equal(r('state.deck.length'),17);assert.equal(r('state.deck.some(isFoilCard59)'),false);assert.equal(r("state.deck.filter(c=>c.name==='Booster Tutor').length"),1);
});
test('shop offers and purchased packs are nonfoil until upgraded',()=>{
 const r=fixture();r(`state.node=2;state.coins=100;showShop();globalThis.offered=state.shop.offers[0].card;buyShopCard(0)`);assert.equal(r('state.deck.at(-1)===offered'),true);assert.equal(r('isFoilCard59(offered)'),false);r(`state.shop.packs=[{type:'creature',sold:false}];buyShopPack34(0);globalThis.opened=state.packs[0];state.boosterSealed=false;confirmDraft()`);assert.equal(r('opened.every(c=>state.deck.includes(c)&&!isFoilCard59(c))'),true);
});
test('Booster Tutor puts an unmodified nonfoil booster card into the same battle hand',()=>{
 const r=fixture();r(`globalThis.same=b;beginBoosterInterruption27('tutor');globalThis.pulled=state.packs[0][0];state.boosterSealed=false;state.selection.set(0,0);confirmDraft()`);assert.equal(r('state.battle===same'),true);assert.equal(r('b.hand.at(-1)===pulled'),true);assert.equal(r('isFoilCard59(pulled)'),false);
});
test('Clone foil and counter marks follow its physical run upgrades rather than its target',()=>{
 for(const foil of [true,false]){const r=fixture();r(`globalThis.u=ally();u.card=runCard59(u.card);u.card.runCounters60=${foil?"[]":"['stats']"};globalThis.physical=runCard59(card('Clone'));physical.runCounters60=${foil?"['stats']":"[]"};b.hand=[physical];playCard(0);pick('player:'+u.id);globalThis.copy=b.creatures.find(c=>c.originalCard===physical)`);assert.equal(r('isFoilCard59(copy.card)'),foil);r(`sacrificeRuleCreature(copy)`);assert.equal(r('isFoilCard59(physical)'),foil);}
});
test('run reset removes foil and marks from old upgrades and ignores obsolete random foil flags',()=>{
 const r=fixture();r(`globalThis.c=runCard59(card('Grizzly Bears'));c.runCounters60=['stats'];globalThis.legacy={...c,runCounters60:[],foil59:true}`);assert.equal(r('isFoilCard59(legacy)'),false);r('resetRunProgress59()');assert.equal(r('isFoilCard59(c)'),false);assert.doesNotMatch(r('cardFace(c)'),/card-run-counters61/);
});
test('combat kills, direct spell kills and exile award exactly one level per enemy',()=>{
 const r=fixture();r(`globalThis.e=b.enemyCreatures[0];const before=state.level;damageFirstEnemy(100,e);globalThis.once=state.level;awardBounty(e);awardBounty(e)`);assert.equal(r('state.level'),2);assert.equal(r('once'),2);
 r(`globalThis.e2=b.enemyCreatures[0];b.resolvingSpellTarget={side:'enemy',id:e2.id};removeSpellTarget('exile')`);assert.equal(r('state.level'),3);assert.equal(r('state.defeatedEnemies59'),2);assert.equal(r("$('#player-level').textContent"),'3');
 r(`awardBounty(ally());awardBounty(null)`);assert.equal(r('state.level'),3);
});
test('highest level persists on title and across reloads while a new run starts at level one',()=>{
 const storage=new Map();const r=fixture(storage);r(`gainDefeatLevel59();gainDefeatLevel59();showScreen('start-screen')`);assert.equal(r("$('#highest-level').textContent"),'3');assert.equal(r("$('#run-level').hidden"),true);assert.equal(storage.get('booster-tutor-highest-level-v1'),'3');
 r(`state.endless=true;state.endlessReady59=true;resetRunProgress59()`);assert.equal(r('state.level'),1);assert.equal(r('state.endless'),false);assert.equal(r('state.bestLevel59'),3);assert.equal(r('state.defeatedEnemies59'),0);assert.equal(fixture(storage)('state.bestLevel59'),3);
});
test('blocked and malformed record storage do not stop progression',()=>{
 const r=fixture(new Map(),true);r(`gainDefeatLevel59();resetRunProgress59()`);assert.equal(r('state.bestLevel59'),2);assert.equal(r('state.level'),1);
 for(const value of ['bad','0','-4','Infinity','1.4','99999999999999999999'])assert.equal(fixture(new Map([['booster-tutor-highest-level-v1',value]]))('state.bestLevel59'),1);
});
test('endless mode is available only after campaign victory and cannot be entered twice',()=>{
 const r=fixture();assert.equal(r('continueEndless59()'),false);r(`state.node=4;endRun(false)`);assert.equal(r("$('#endless-invitation').hidden"),true);assert.equal(r('continueEndless59()'),false);
 r(`endRun(true);globalThis.deck=state.deck;globalThis.life=state.playerHealth;globalThis.money=state.coins;globalThis.level=state.level`);assert.equal(r("$('#endless-invitation').hidden"),false);assert.equal(r('continueEndless59()'),true);assert.equal(r('state.endless'),true);assert.equal(r('state.node'),5);assert.equal(r('state.screen'),'draft-screen');assert.equal(r('state.packs[0].length'),7);assert.equal(r('continueEndless59()'),false);assert.equal(r('state.node'),5);assert.equal(r('state.deck===deck&&state.playerHealth===life&&state.coins===money&&state.level===level'),true);
});
test('endless encounters cycle all four templates, scale both waves, and keep rewarding beyond fight eight',()=>{
 const r=fixture();r(`state.endless=true;state.node=5;state.stageLocations=[];beginBattle(5);globalThis.first=state.battle;globalThis.enemy=first.enemyCreatures[0];globalThis.template=FOE_TYPES[enemy.kind]`);assert.equal(r('first.enemy.rank'),'ENDLESS 1 · SKIRMISH');assert.equal(r('enemy.maxHealth'),r('Math.ceil(template.health*1.16)'));assert.equal(r('enemy.power'),r('template.power+1'));assert.equal(r('first.waves.length'),1);assert.equal(r('state.stageLocations.length'),8);
 for(const node of [6,7,8,9,12,100]){r(`beginBattle(${node})`);assert.equal(r('state.battle.waves.length'),[3,0].includes(node%4)?2:1);assert.equal(r('state.battle.waves.flat().every(e=>e.maxHealth>FOE_TYPES[e.kind].health&&e.power>FOE_TYPES[e.kind].power)'),true);assert.ok(r('state.stageLocations.length')>=node);r(`state.battle.enemyCreatures=[];state.battle.waveIndex=state.battle.waves.length-1;winBattle()`);assert.equal(r('state.screen'),'draft-screen');assert.equal(r('state.node'),node+1);assert.equal(r('state.packs[0].length'),7);}
});
test('endless loss has a finite summary, preserves record and offers a clean new run',()=>{
 const r=fixture();r(`state.endless=true;state.node=11;state.level=28;state.bestLevel59=28;state.playerHealth=0;endRun(false)`);assert.equal(r('state.endlessReady59'),false);assert.match(r("$('#run-summary').innerHTML"),/ENDLESS <b>7/);assert.match(r("$('#run-summary').innerHTML"),/LEVEL <b>28/);assert.equal(r("$('#end-eyebrow').textContent"),'ENDLESS RUN OVER');assert.equal(r('continueEndless59()'),false);r(`resetRunProgress59()`);assert.equal(r('state.endless'),false);assert.equal(r('state.level'),1);assert.equal(r('state.bestLevel59'),28);
});
test('a lower-level run in another tab cannot overwrite a higher saved record',()=>{
 const storage=new Map();const r=fixture(storage);storage.set('booster-tutor-highest-level-v1','45');r('gainDefeatLevel59()');assert.equal(r('state.level'),2);assert.equal(r('state.bestLevel59'),45);assert.equal(storage.get('booster-tutor-highest-level-v1'),'45');
});
