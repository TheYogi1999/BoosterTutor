const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const FIXTURES = [
 {id:'fixture-aegis',name:'Shield fixture',cmc:2,type_line:'Enchantment',oracle_text:'Unrecognized static effect.'},
 {id:'fixture-blade',name:'Equipment fixture',cmc:1,type_line:'Artifact — Equipment',oracle_text:'Equipped creature gets +2/+1.\nEquip {1}'},
 {id:'fixture-aura',name:'Aura fixture',cmc:2,type_line:'Enchantment — Aura',oracle_text:'Enchanted creature gets +1/+1 and has flying.'},
 {id:'fixture-firebolt',name:'Damage fixture',cmc:1,type_line:'Instant',oracle_text:'Deals 4 damage.'},
 {id:'fixture-sentinel',name:'Creature fixture',cmc:2,type_line:'Creature — Soldier',oracle_text:'',power:'2',toughness:'3'},
 {id:'fixture-spark',name:'Draw fixture',cmc:3,type_line:'Sorcery',oracle_text:'Draw a card.'},
 {id:'fixture-wolf',name:'Wolf fixture',cmc:2,type_line:'Creature — Wolf',oracle_text:'',power:'3',toughness:'2'},
 {id:'fixture-mending',name:'Heal fixture',cmc:2,type_line:'Instant',oracle_text:'You gain 5 life.'},
 {id:'fixture-golem',name:'Golem fixture',cmc:3,type_line:'Artifact Creature — Golem',oracle_text:'',power:'3',toughness:'4'},
 {id:'fixture-vines',name:'Buff fixture',cmc:1,type_line:'Instant',oracle_text:'Target creature gets +2/+2 until end of turn.'},
 {id:'fixture-bat',name:'Bat fixture',cmc:3,type_line:'Creature — Bat',oracle_text:'Flying, lifelink',power:'2',toughness:'2'}
];
function game() {
  const elements = new Map();
  const queuedTimers = [];
  function element(key) { if (!elements.has(key)) elements.set(key, {textContent:'',innerHTML:'',style:{setProperty(){}},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},append(){},closest(){return null},isConnected:true,value:'',showModal(){this.open=true},close(){this.open=false},offsetWidth:380,offsetHeight:180,getBoundingClientRect(){return {left:200,top:500,bottom:700,width:130}}}); return elements.get(key); }
  const context = vm.createContext({document:{documentElement:{style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}}},body:{append(){}},querySelector:element,querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame(){},window:{scrollTo(){},addEventListener(){},innerWidth:1200,innerHeight:900},queuedTimers,setTimeout:callback=>{queuedTimers.push(callback);return queuedTimers.length},clearTimeout(){},console,AbortSignal,rulesAudit:()=>({playable:true,reason:'Legacy rules unit fixture'})});
  vm.runInContext('Math.random=()=>.9',context);
  vm.runInContext(fs.readFileSync('cards.js','utf8'),context);
  vm.runInContext(fs.readFileSync('sounds.js','utf8'),context);
  vm.runInContext(fs.readFileSync('game.js','utf8'),context);
  vm.runInContext(`globalThis.FIXTURES = ${JSON.stringify(FIXTURES)}`,context);
  return code => vm.runInContext(code,context);
}
test('all colour identities spend only their total generic mana value',()=>{
  const run=game();
  run("state.battle={mana:3,floatingMana:3,lands:[]};");
  for (const cost of ['{1}{W}{U}','{B}{B}{B}','{C}{C}{C}']) {
    assert.equal(run(`Boolean(paymentPlan({cmc:3,mana_cost:'${cost}'}))`),true);
    assert.equal(run(`manaCostHtml({cmc:3,mana_cost:'${cost}'}).includes('>3</span>')`),true);
  }
  assert.equal(run('paymentPlan({cmc:4})'),null);
  assert.equal(run('Boolean(paymentPlan({cmc:0}))'),true);
});
test('casting spends mana and moves a spell into the graveyard',()=>{
 const run=game();
 run("state.soundOn=false; state.playerHealth=20; state.battle={phase:'main',mana:3,floatingMana:3,lands:[],maxMana:3,hand:[FIXTURES.find(card=>card.id==='fixture-mending')],graveyard:[],creatures:[],enemyCreatures:[{}],log:[]}; renderBattle=()=>{}; playCard(0);");
 assert.equal(run('state.battle.mana'),1);assert.equal(run('state.battle.hand.length'),0);assert.equal(run('state.battle.graveyard.length'),1);assert.equal(run('state.playerHealth'),25);
});
test('mana cards provide generic mana, untap each turn and life carries across fights',()=>{
 const run=game();prepare(run);run("state.playerHealth=17;state.battle.floatingMana=0;syncMana(state.battle);state.battle.hand=[FALLBACK_LANDS[0]];playCard(0);payMana(1);state.battle.enemyCreatures.forEach(e=>{e.power=0;e.summoningSick=true;e.summonedTurn=99});resolveEnemyCombat()");
 assert.equal(run('state.battle.lands.length'),1);assert.equal(run('state.battle.mana'),1);assert.equal(run('state.playerHealth'),17);run('beginBattle(2)');assert.equal(run('state.playerHealth'),17);
});
test('flying blocking and first/double strike rules stay distinct',()=>{
 const run=game();
 assert.equal(run('canBlockCreature({}, {flying:true})'),false);
 assert.equal(run('canBlockCreature({reach:true}, {flying:true})'),true);
 assert.equal(run('dealsInCombatStep({firstStrike:true},true)'),true);
 assert.equal(run('dealsInCombatStep({firstStrike:true},false)'),false);
 assert.equal(run('dealsInCombatStep({doubleStrike:true},false)'),true);
});
test('six booster picks produce twelve cards plus four mana cards',()=>{
 const run=game();run("state.landPool=FALLBACK_LANDS;state.packs=Array.from({length:6},()=>[FIXTURES[4]]);state.selection=new Map(Array.from({length:6},(_,i)=>[i,0]));state.activePack=5;confirmDraft()");
 assert.equal(run('state.deck.length'),16);assert.equal(run('state.deck.filter(isLand).length'),4);assert.equal(run('state.battle'),null);
});
function prepare(run) {
 run(`state.soundOn=false; state.pool=FIXTURES; state.deck=Array.from({length:24},()=>FIXTURES.find(card=>card.id==='fixture-sentinel')); beginBattle(1); state.battle.enemyCreatures.forEach(enemy=>Object.assign(enemy,{flying:false,reach:false,lifelink:false,firstStrike:false,menace:false,trample:false,defender:false})); state.battle.floatingMana=20; state.battle.maxMana=20; syncMana(state.battle);state.battle.enemyCreatures.forEach(enemy=>{enemy.summoningSick=false;enemy.summonedTurn=0});`);
}
test('all starter packs contain seven cards and are opened sequentially',()=>{
 const run=game();run('state.soundOn=false;state.pool=FIXTURES;state.packs=makeStarterPacks();state.activePack=0;state.boosterSealed=true;renderDraft();');
 assert.equal(run('state.packs.length'),6);assert.equal(run('state.packs.every(pack=>pack.length===7)'),true);
 assert.equal(run("$('#draft-grid').innerHTML.includes('sealed-pack')"),true);
 run('state.boosterSealed=false;renderDraft()');
 assert.equal(run("($('#draft-grid').innerHTML.match(/class=\"draft-option/g)||[]).length"),7);
 run('state.selection.set(0,0);confirmDraft();');
 assert.equal(run('state.activePack'),1);assert.equal(run('state.boosterSealed'),true);assert.equal(run('state.deck.length'),0);
 run('state.boosterSealed=false;state.selection.set(1,0);confirmDraft();');assert.equal(run('state.activePack'),2);
 run('state.landPool=FALLBACK_LANDS;for(let i=2;i<6;i++){state.boosterSealed=false;state.selection.set(i,0);confirmDraft();}');assert.equal(run('state.deck.length'),16);
});
test('opening and mulligan draw seven while extra draws may grow beyond seven',()=>{
 const run=game();prepare(run);assert.equal(run('state.battle.hand.length'),7);
 run('freeMulligan()');assert.equal(run('state.battle.hand.length'),7);
 run('drawOneExtra()');assert.equal(run('state.battle.hand.length'),8);
 run('state.battle.hand.pop();drawOneExtra()');assert.equal(run('state.battle.hand.length'),8);
});
test('unrecognized permanent does not gain an invented shield ability',()=>{
 const run=game();prepare(run);run("state.battle.hand=[FIXTURES[0]];playCard(0)");assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('permanentEffect(FIXTURES[0]).power'),0);assert.equal(run('permanentEffect(FIXTURES[0]).shield'),undefined);
});
test('equipment attaches, can move without stacking, and survives its creature',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FIXTURES.find(card=>card.id==='fixture-sentinel'),FIXTURES.find(card=>card.id==='fixture-wolf'),FIXTURES.find(card=>card.id==='fixture-blade')];playCard(0,'player');playCard(0,'player');playCard(0);state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id};selectAttachmentTarget(state.battle.creatures[0].id);");
 assert.equal(run('state.battle.creatures[0].power'),4);assert.equal(run('state.battle.creatures[0].toughness'),4);
 run('refreshPermanentEffects();refreshPermanentEffects()');assert.equal(run('state.battle.creatures[0].power'),4);
 run('state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id};selectAttachmentTarget(state.battle.creatures[1].id)');
 assert.equal(run('state.battle.creatures[0].power'),2);assert.equal(run('state.battle.creatures[1].power'),5);
 run("state.battle.creatures[1].damage=99;state.battle.creatures=removeDeadCreatures(state.battle.creatures,'player')");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.permanents[0].attachedTo'),null);assert.equal(run('state.battle.graveyard.length'),1);
});
test('aura waits for a legal target, grants stats and flying, then dies with its host',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FIXTURES.find(card=>card.id==='fixture-aura')];playCard(0);");
 assert.equal(run('state.battle.hand.length'),1);assert.equal(run('state.battle.mana'),20);
 run("state.battle.hand.unshift(FIXTURES.find(card=>card.id==='fixture-sentinel'));playCard(0,'player');playCard(0);");
 assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.mana'),18);
 run('selectAttachmentTarget(state.battle.creatures[0].id)');
 assert.equal(run('state.battle.mana'),16);assert.equal(run('state.battle.creatures[0].power'),3);assert.equal(run("hasCreatureKeyword(state.battle.creatures[0],'flying')"),true);
 run("state.battle.creatures[0].damage=99;state.battle.creatures=removeDeadCreatures(state.battle.creatures,'player')");
 assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.graveyard.length'),2);
});
test('global enchantment modifiers apply once and include creatures cast later',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[{id:'anthem',name:'Anthem',cmc:1,type_line:'Enchantment',oracle_text:'Creatures you control get +1/+1.'},FIXTURES.find(card=>card.id==='fixture-sentinel')];playCard(0);playCard(0,'player');refreshPermanentEffects();");
 assert.equal(run('state.battle.creatures[0].power'),3);assert.equal(run('state.battle.creatures[0].toughness'),4);assert.equal(run('state.battle.permanents.length'),1);
});
test('first strike blocker kills a normal attacker before it can deal damage',()=>{
 const run=game();prepare(run);
 run("state.battle.creatures=[{id:'p',owner:'player',card:{name:'Blocker'},power:3,toughness:2,firstStrike:true}];state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Attacker'},power:5,health:3,maxHealth:3}];resolveCombatDamage(state.battle.enemyCreatures,new Map([['e',state.battle.creatures[0]]]),'enemy');");
 assert.equal(run('state.battle.creatures.length'),1);assert.equal(run('state.battle.enemyCreatures.length'),0);assert.equal(run('state.battle.creatures[0].damage||0'),0);
});
test('block assignment rejects illegal flying blocks and toggles legal assignments',()=>{
 const run=game();prepare(run);
 run("state.battle.phase='blocks';state.battle.turn=3;state.battle.creatures=[{id:'p',owner:'player',card:{name:'Guard'},power:2,toughness:3,tapped:false}];state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Flyer'},power:2,health:3,maxHealth:3,flying:true,summonedTurn:1}];assignBlocker('e','p');");
 assert.equal(run('state.battle.blockAssignments.size'),0);
 run("state.battle.creatures[0].reach=true;assignBlocker('e','p')");assert.equal(run("blockerIds(state.battle,'e').join(',')"),'p');
 run("assignBlocker('e','p')");assert.equal(run('state.battle.blockAssignments.size'),0);
});
test('rules bubble describes the implemented fallback, not unsupported original text',()=>{
 const run=game();prepare(run);
 run("globalThis.mystery={name:'Mystery',type_line:'Sorcery',cmc:2,oracle_text:'Take an extra turn.'};showCardPreview(mystery,{dataset:{previewOwner:'hand',handIndex:0},isConnected:true,setAttribute(){},removeAttribute(){},closest(){return null},getBoundingClientRect(){return {left:200,top:500,bottom:700,width:130}}});");
 assert.equal(run("$('#card-preview').innerHTML.includes('6 damage')"),true);assert.equal(run("$('#card-preview').innerHTML.includes('Take an extra turn')"),false);
 assert.equal(run("parseFloat($('#card-preview').style.top)<500"),true);
});
test('hand and battlefield markup contain complete faces without UI overlays',()=>{
 const run=game();prepare(run);run("state.battle.hand=[{name:'Real card',cmc:1,type_line:'Creature',power:'1',toughness:'1',image:'https://example.com/card.jpg'}];renderHand();playCard(0,'player');");
 assert.equal(run("$('#creature-row').innerHTML.includes('https://example.com/card.jpg')"),true);
 assert.equal(run("/hand-card-cost|card-unavailable|creature-stats/.test($('#hand-row').innerHTML+$('#creature-row').innerHTML)"),false);
});
test('mulligan cancels pending aura targets before the hand changes',()=>{
 const run=game();prepare(run);
 run("state.battle.creatures=[{id:'p',owner:'player',card:{name:'Guard'},power:2,toughness:3}];state.battle.hand=[FIXTURES.find(card=>card.id==='fixture-aura')];playCard(0);freeMulligan();selectAttachmentTarget('p');");
 assert.equal(run('state.battle.pendingAttachment'),null);assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.mana'),20);assert.equal(run('state.battle.hand.length'),7);
});
test('the shipped pool contains 100 real cards with locally available JPEGs',()=>{
 const run=game();
 assert.equal(run('BUNDLED_CARDS.length'),100);
 assert.equal(run("BUNDLED_CARDS.every(card=>card.verified && /^[a-f0-9-]{36}$/.test(card.id) && !card.id.startsWith('demo-'))"),true);
 const cards=JSON.parse(run('JSON.stringify(BUNDLED_CARDS)'));
 assert.equal(new Set(cards.map(card=>card.id)).size,100);
 for(const card of cards){assert.equal(fs.readFileSync(card.image).readUInt16BE(0),0xffd8);}
 assert.equal(cards.find(card=>card.name==='Grizzly Bears').power,'2');
});
test('reroll changes seven cards once and clears only the current selection',()=>{
 const run=game();run('state.soundOn=false;state.pool=BUNDLED_CARDS;state.packs=makeStarterPacks();state.activePack=1;state.boosterSealed=false;state.selection=new Map([[0,0],[1,2]]);globalThis.oldIds=state.packs[1].map(c=>c.id);rerollCurrentPack();');
 assert.equal(run('state.packs[1].length'),7);assert.equal(run('state.packs[1].every(card=>!oldIds.includes(card.id))'),true);assert.equal(run('state.selection.has(0)'),true);assert.equal(run('state.selection.has(1)'),false);
 const after=run('JSON.stringify(state.packs[1])');run('rerollCurrentPack()');assert.equal(run('JSON.stringify(state.packs[1])'),after);
});
test('monster recovery and strengthening resolve only once each turn',()=>{
 const run=game();prepare(run);run("state.battle.enemyCreatures=[{id:'guard',owner:'enemy',card:{name:'Guard'},health:10,maxHealth:20,power:3,pattern:['guard','buff','attack']}];state.battle.turn=1;resolveEnemyIntents();resolveEnemyIntents()");assert.equal(run('state.battle.enemyCreatures[0].health'),13);assert.equal(run('creatureCanAttack(state.battle.enemyCreatures[0],1)'),false);run('state.battle.turn=2;resolveEnemyIntents();resolveEnemyIntents()');assert.equal(run('state.battle.enemyCreatures[0].power'),4);
});
test('selected monster receives direct damage, other monsters stay unchanged',()=>{
 const run=game();prepare(run);run("state.battle.enemyCreatures[0].shield=3;state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[0].id;globalThis.hp=state.battle.enemyCreatures[0].health;globalThis.other=state.battle.enemyCreatures[1].health;damageFirstEnemy(5)");
 assert.equal(run('state.battle.enemyCreatures[0].health'),run('hp-5'));assert.equal(run('state.battle.enemyCreatures[0].shield'),3);assert.equal(run('state.battle.enemyCreatures[1].health'),run('other'));
});
test('creatures cannot be dropped on the enemy or accidentally cast as card zero',()=>{
 const run=game();prepare(run);run("state.battle.hand=[FIXTURES.find(c=>c.id==='fixture-sentinel')];globalThis.enemyTarget={closest(selector){return selector==='#enemy-drop-zone'?{}:null}};");
 assert.equal(run("handleCardDrop({kind:'hand',index:0,cardId:'wrong'},enemyTarget)"),false);
 assert.equal(run("handleCardDrop({kind:'hand',index:0},enemyTarget)"),false);assert.equal(run('state.battle.hand.length'),1);
});
test('dropping an aura onto a creature attaches and spends mana once',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FIXTURES.find(c=>c.id==='fixture-sentinel'),FIXTURES.find(c=>c.id==='fixture-aura')];playCard(0,'player');globalThis.allyId=state.battle.creatures[0].id;globalThis.allyTarget={closest(selector){if(selector==='[data-creature-id]')return {dataset:{creatureId:allyId}};if(selector==='#player-drop-zone')return {};return null}};handleCardDrop({kind:'hand',index:0,cardId:'fixture-aura'},allyTarget);");
 assert.equal(run('state.battle.mana'),16);assert.equal(run('state.battle.permanents[0].attachedTo'),run('allyId'));assert.equal(run('state.battle.hand.length'),0);
});
test('deathtouch on an allied attacker defeats a monster after damaging its health',()=>{
 const run=game();prepare(run);
 run("state.battle.turn=3;state.battle.creatures=[{id:'p',owner:'player',card:{name:'Deathtouch fixture'},power:1,toughness:2,deathtouch:true,willAttack:true,summonedTurn:1,summoningSick:false}];state.battle.phase='attack';resolvePlayerAttacks();");
 assert.equal(run('state.battle.enemyCreatures.length'),1);
});
test('combat phases prevent duplicate actions and advance through attack, enemy, block and damage',()=>{
 const run=game();prepare(run);
 run("state.battle.creatures=[{id:'guard',owner:'player',card:FIXTURES[4],power:2,toughness:5,summonedTurn:1,summoningSick:true,tapped:false}];queuedTimers.length=0;handleCombatAction();handleCombatAction();");
 assert.equal(run('state.battle.phase'),'attack');assert.equal(run('queuedTimers.length'),1);
 run('queuedTimers.shift()()');assert.equal(run('state.battle.phase'),'enemy');
 run('queuedTimers.shift()()');assert.equal(run('state.battle.phase'),'blocks');
 run('handleCombatAction();handleCombatAction()');assert.equal(run('state.battle.phase'),'damage');assert.equal(run('queuedTimers.length'),1);
 run('queuedTimers.shift()()');assert.equal(run('state.battle.phase'),'main');assert.equal(run('state.battle.turn'),2);
});
test('resolution callbacks cannot alter another run after abandonment',()=>{
 const run=game();prepare(run);run('queuedTimers.length=0;finishTurn();globalThis.old=state.battle;state.battle=null;queuedTimers.shift()()');
 assert.equal(run('old.phase'),'attack');assert.equal(run('state.battle'),null);
});
test('planned arrows reflect the selected enemy, held-back allies and legal blockers',()=>{
 const run=game();prepare(run);
 run("state.battle.turn=2;state.battle.creatures=[{id:'p',owner:'player',card:FIXTURES[4],power:2,toughness:3,summonedTurn:1,summoningSick:true,willAttack:true,tapped:false}];state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[1].id;state.battle.phase='attack';");
 assert.equal(run("combatRoutes(state.battle).find(route=>route.kind==='ally').to"),run('state.battle.enemyCreatures[1].id'));
 run('state.battle.creatures[0].willAttack=false');assert.equal(run("combatRoutes(state.battle).filter(route=>route.kind==='ally').length"),0);
 run("state.battle.turn=1;state.battle.phase='blocks';state.battle.blockAssignments.set(state.battle.enemyCreatures[0].id,'p')");
 assert.equal(run("combatRoutes(state.battle).find(route=>route.kind==='block').to"),'p');
 assert.equal(run("combatRoutes(state.battle).some(route=>route.from===state.battle.enemyCreatures[1].id)"),false);
});
test('draw effects can exceed seven and keep every card through the next refill',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=Array.from({length:7},()=>FIXTURES[4]);state.battle.deck=Array.from({length:20},()=>FIXTURES[4]);applyOracle({name:'Draw test',cmc:2,type_line:'Sorcery',oracle_text:'Draw ten cards.'});");
 assert.equal(run('state.battle.hand.length'),17);run('drawToHand(HAND_SIZE)');assert.equal(run('state.battle.hand.length'),17);
});
test('healing, lifelink and rest-style gains can exceed starting life',()=>{
 const run=game();prepare(run);run("state.playerHealth=35;applyOracle({name:'Heal',type_line:'Instant',cmc:1,oracle_text:'You gain 5 life.'});gainLifelinkLife({lifelink:true},'player',4,state.battle)");
 assert.equal(run('state.playerHealth'),44);
});
test('planned arrows stay visible in every combat phase',()=>{
 const run=game();prepare(run);run("state.battle.turn=3;state.battle.creatures=[{id:'p',owner:'player',card:FIXTURES[4],power:2,toughness:3,summonedTurn:1,willAttack:true,tapped:false}]");
 for(const phase of ['main','attack','enemy','blocks','damage']){
  run(`state.battle.phase='${phase}'`);
  assert.equal(run("combatRoutes(state.battle).some(route=>route.kind==='ally')"),true);
  assert.equal(run("combatRoutes(state.battle).some(route=>route.kind==='enemy')"),true);
 }
});
function fighter(run, stats) {
 run(`state.battle.creatures=[{id:'p',owner:'player',card:FIXTURES[4],power:3,toughness:3,summonedTurn:0,willAttack:true,tapped:false,...${JSON.stringify(stats||{})}}];`);
}
test('monsters retaliate and normal combat damage is simultaneous',()=>{
 const run=game();prepare(run);fighter(run);
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Enemy'},health:3,maxHealth:3,power:3}];state.battle.phase='attack';resolvePlayerAttacks()");
 assert.equal(run('state.battle.creatures.length'),0);assert.equal(run('state.battle.enemyCreatures.length'),0);assert.equal(run('state.battle.graveyard.length'),1);
});
test('first strike prevents retaliation when it kills the monster first',()=>{
 const run=game();prepare(run);fighter(run,{firstStrike:true});
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Enemy'},health:3,power:6}];state.battle.phase='attack';resolvePlayerAttacks()");
 assert.equal(run('state.battle.creatures.length'),1);assert.equal(run('state.battle.creatures[0].damage||0'),0);
});
test('vigilance attacks once, remains untapped, and can then block',()=>{
 const run=game();prepare(run);fighter(run,{vigilance:true,toughness:8});
 run("state.battle.enemyCreatures[0].power=1;state.battle.phase='attack';resolvePlayerAttacks();");
 assert.equal(run('state.battle.creatures[0].tapped'),false);assert.equal(run('state.battle.creatures[0].attackedThisTurn'),true);assert.equal(run('eligibleAttacker(state.battle.creatures[0],state.battle)'),false);
 run("state.battle.phase='blocks';assignBlocker(state.battle.enemyCreatures[0].id,'p')");assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[0].id).length'),1);
});
test('individual creatures use different attack targets',()=>{
 const run=game();prepare(run);
 run("state.battle.creatures=[{id:'a',owner:'player',card:FIXTURES[4],power:2,toughness:9,summonedTurn:0,willAttack:true,attackTargetId:state.battle.enemyCreatures[0].id},{id:'b',owner:'player',card:FIXTURES[4],power:4,toughness:9,summonedTurn:0,willAttack:true,attackTargetId:state.battle.enemyCreatures[1].id}];state.battle.phase='attack';resolvePlayerAttacks()");
 assert.equal(run('state.battle.enemyCreatures[0].health'),11);assert.equal(run('state.battle.enemyCreatures[1].health'),6);assert.equal(run('state.battle.creatures[0].damage'),3);assert.equal(run('state.battle.creatures[1].damage'),2);
});
test('two blockers split incoming damage once and combine their return damage',()=>{
 const run=game();prepare(run);
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Raider'},power:4,health:10}];state.battle.creatures=[{id:'a',owner:'player',card:FIXTURES[4],power:3,toughness:3},{id:'b',owner:'player',card:FIXTURES[4],power:2,toughness:2}];globalThis.result=resolveCombatDamage(state.battle.enemyCreatures,new Map([['e',state.battle.creatures.slice()]]),'enemy')");
 assert.equal(run('result.damageToPlayer'),0);assert.equal(run('state.battle.creatures.length'),1);assert.equal(run('state.battle.creatures[0].id'),'b');assert.equal(run('state.battle.creatures[0].damage'),1);assert.equal(run('state.battle.enemyCreatures[0].health'),5);
});
test('multi-block assignment is additive, toggles one blocker, and keeps each blocker unique',()=>{
 const run=game();prepare(run);run("state.battle.turn=3;state.battle.phase='blocks';state.battle.creatures=['a','b','c'].map(id=>({id,owner:'player',card:FIXTURES[4],power:2,toughness:3}));assignBlocker(state.battle.enemyCreatures[0].id,'a');assignBlocker(state.battle.enemyCreatures[0].id,'b');assignBlocker(state.battle.enemyCreatures[0].id,'c');");
 assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[0].id).length'),3);
 run("assignBlocker(state.battle.enemyCreatures[0].id,'b')");assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[0].id).join(",")'),'a,c');
 run("assignBlocker(state.battle.enemyCreatures[1].id,'a')");assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[0].id).join(",")'),'c');assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[1].id).join(",")'),'a');
});
test('exiling a creature detaches equipment, destroys its aura, and never recycles the exiled card',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FIXTURES[4],FIXTURES[2],FIXTURES[1]];playCard(0,'player');playCard(0);selectAttachmentTarget(state.battle.creatures[0].id);playCard(0);state.battle.permanents[1].attachedTo=state.battle.creatures[0].id;state.battle.resolvingSpellTarget={side:'player',id:state.battle.creatures[0].id};removeSpellTarget('exile');state.battle.deck=[];");
 assert.equal(run('state.battle.exile.length'),1);assert.equal(run('state.battle.creatures.length'),0);assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.permanents[0].attachedTo'),null);assert.equal(run('state.battle.deck.some(card=>card.id===FIXTURES[4].id)'),false);
});
test('Unmake is a genuine bundled instant with an exile effect',()=>{
 const run=game();assert.equal(run("cardEffects(BUNDLED_CARDS.find(card=>card.name==='Unmake'))[0].kind"),'exile');
});
test('instants are castable and pause priority in every combat phase; sorceries cannot',()=>{
 const run=game();prepare(run);
 for(const phase of ['main','attack','enemy','blocks','damage']){
  run(`state.battle.phase='${phase}'`);
  assert.equal(run('canCastNow(FIXTURES[3])'),true);assert.equal(run('canCastNow(FIXTURES[5])'),phase==='main');
 }
 run("state.battle.phase='attack';state.battle.hand=[FIXTURES[3]];queuedTimers.length=0;afterCombatBeat(state.battle,'attack',()=>{state.battle.phase='enemy'});");
 assert.equal(run('typeof state.battle.priorityCallback'),'function');assert.equal(run('queuedTimers.length'),0);
 run("playCard(0,'enemy');handleCombatAction()");assert.equal(run('state.battle.phase'),'enemy');
});
test('persistent and end-of-turn bonuses have separate values and expiry',()=>{
 const run=game();prepare(run);run("state.battle.hand=[FIXTURES[4],FIXTURES[1],FIXTURES[9]];playCard(0,'player');playCard(0);state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id};selectAttachmentTarget(state.battle.creatures[0].id);playCard(0);");
 assert.equal(run('creatureBonuses(state.battle.creatures[0]).permanent.power'),2);assert.equal(run('creatureBonuses(state.battle.creatures[0]).temporary.power'),2);
 run('expireTurnEffects(state.battle)');assert.equal(run('creatureBonuses(state.battle.creatures[0]).temporary.power'),0);assert.equal(run('state.battle.creatures[0].power'),4);
});
test('deck and library inspection groups copies without changing draw order',()=>{
 const run=game();prepare(run);run("state.deck=[FIXTURES[4],FIXTURES[4],FIXTURES[3]];state.battle.deck=state.deck.slice();globalThis.order=JSON.stringify(state.battle.deck);openCollection('deck')");
 assert.equal(run('state.collectionCards.length'),2);assert.equal(run('state.collectionCards.find(card=>card.id===FIXTURES[4].id).count'),2);
 run("openCollection('library')");assert.equal(run('JSON.stringify(state.battle.deck)'),run('order'));
});
test('exiling a blocker removes its assignment before incoming damage',()=>{
 const run=game();prepare(run);fighter(run,{toughness:5});
 run("state.battle.phase='blocks';assignBlocker(state.battle.enemyCreatures[0].id,'p');state.battle.resolvingSpellTarget={side:'player',id:'p'};removeSpellTarget('exile')");
 assert.equal(run('blockerIds(state.battle,state.battle.enemyCreatures[0].id).length'),0);
});
test('a declared attack does not silently retarget after its target leaves',()=>{
 const run=game();prepare(run);fighter(run,{attackTargetId:'gone'});run("state.battle.phase='attack';resolvePlayerAttacks()");
 assert.equal(run('state.battle.enemyCreatures[0].health'),13);assert.equal(run('state.battle.creatures[0].attackedThisTurn||false'),false);
});
test('Battlegrowth creates a persistent +1/+1 modifier distinct from a temporary buff',()=>{
 const run=game();prepare(run);fighter(run,{power:2,toughness:3});
 run("applyOracle(BUNDLED_CARDS.find(card=>card.name==='Battlegrowth'))");
 assert.equal(run('state.battle.creatures[0].power'),3);assert.equal(run('state.battle.creatures[0].toughness'),4);assert.equal(run('creatureBonuses(state.battle.creatures[0]).permanent.power'),1);assert.equal(run('creatureBonuses(state.battle.creatures[0]).temporary.power'),0);
});

test('bounties are paid once for damage, combat and exile; a new run resets coins',()=>{
 const run=game();prepare(run);
 run('state.coins=0;globalThis.victim=state.battle.enemyCreatures[0];victim.health=1;damageFirstEnemy(2,victim);awardBounty(victim)');
 assert.equal(run('state.coins'),10);
 run("state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[0].id;removeSpellTarget('exile')");assert.equal(run('state.coins'),19);
 run('startNewRun()');assert.equal(run('state.coins'),0);
});
test('shop has three distinct fixed offers, purchases one copy and guards the balance',()=>{
 const run=game();prepare(run);run('state.pool=BUNDLED_CARDS;state.node=2;state.coins=100;showShop();globalThis.offers=state.shop.offers.map(offer=>offer.card.id).join();globalThis.before=state.deck.length;globalThis.price=state.shop.offers[0].price;buyShopCard(0)');
 assert.equal(run('state.shop.offers.length'),3);assert.equal(run('new Set(state.shop.offers.map(offer=>offer.card.id)).size'),3);assert.equal(run('state.deck.length-before'),1);assert.equal(run('state.coins'),run('100-price'));assert.equal(run('buyShopCard(0)'),false);
 run('showJourney();showShop()');assert.equal(run('state.shop.offers.map(offer=>offer.card.id).join()'),run('offers'));assert.equal(run('state.shop.offers[0].sold'),true);
 run('state.coins=0');assert.equal(run('buyShopCard(1)'),false);assert.equal(run('state.deck.length-before'),1);
});
test('printed equip costs are paid on attachment and moving, with no partial unaffordable move',()=>{
 const run=game();prepare(run);run("state.battle.hand=[FIXTURES[4],FIXTURES[6],FIXTURES[1]];playCard(0,'player');playCard(0,'player');playCard(0);state.battle.floatingMana=2;syncMana(state.battle);globalThis.equip=()=>{state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id}};equip();selectAttachmentTarget(state.battle.creatures[0].id)");
 assert.equal(run('state.battle.mana'),1);run('equip();selectAttachmentTarget(state.battle.creatures[1].id)');assert.equal(run('state.battle.mana'),0);
 run('equip();selectAttachmentTarget(state.battle.creatures[0].id)');assert.equal(run('state.battle.permanents[0].attachedTo'),run('state.battle.creatures[1].id'));
 assert.equal(run("equipCost(BUNDLED_CARDS.find(card=>card.name==='Bonesplitter'))"),1);assert.equal(run("equipCost(BUNDLED_CARDS.find(card=>card.name==='Short Sword'))"),1);
 run("state.battle.floatingMana=5;syncMana(state.battle);state.battle.phase='blocks';equip();selectAttachmentTarget(state.battle.creatures[0].id)");assert.equal(run('state.battle.mana'),5);
});
test('all expanded cards retain verified source metadata',()=>{
 const run=game();assert.equal(run('BUNDLED_CARDS.every(card=>cardAudit(card).dataVerified)'),true);
 for(const name of ['Fencing Ace','Typhoid Rats','Healer\'s Hawk','Deadly Recluse','Wall of Wood','Boggart Brute','Colossal Dreadmaw','Skyhunter Skirmisher'])assert.equal(run(`Boolean(BUNDLED_CARDS.find(card=>card.name===${JSON.stringify(name)}))`),true);
 assert.equal(run("Boolean(BUNDLED_CARDS.find(card=>card.name==='Cancel'))"),true);
});
test('enemy archetypes carry real combat keywords and show them in the arena',()=>{
 const run=game();prepare(run);run('state.node=4;state.battle.enemyCreatures=createEnemyTeam(4)');assert.equal(run('state.battle.enemyCreatures[0].flying'),true);assert.equal(run('state.battle.enemyCreatures[0].trample'),true);assert.equal(run('state.battle.enemyCreatures[1].lifelink'),true);
});
test('trample assigns lethal to a blocker and spills only the excess to the player',()=>{
 const run=game();prepare(run);run("globalThis.a={id:'trampler',owner:'enemy',card:FIXTURES[4],power:7,health:20,maxHealth:20,trample:true};globalThis.b={id:'blocker',owner:'player',card:FIXTURES[4],power:2,toughness:3,damage:0};state.battle.enemyCreatures=[a];state.battle.creatures=[b];globalThis.result=resolveCombatDamage([a],new Map([[a.id,[b]]]),'enemy')");assert.equal(run('result.damageToPlayer'),4);assert.equal(run('state.battle.creatures.length'),0);assert.equal(run('a.health'),18);
});
test('menace requires two blockers; defender cannot attack; flying restricts retaliation',()=>{
 const run=game();prepare(run);run("globalThis.a={id:'menace',owner:'enemy',card:FIXTURES[4],power:3,health:20,maxHealth:20,menace:true};globalThis.b={id:'b',owner:'player',card:FIXTURES[4],power:1,toughness:4};globalThis.c={...b,id:'c'};state.battle.enemyCreatures=[a];state.battle.creatures=[b,c];state.battle.blockAssignments=new Map([[a.id,[b.id]]])");assert.equal(run('hasInvalidMenaceBlock(state.battle)'),true);assert.equal(run('legalBlockers(state.battle,a).length'),0);
 run('state.battle.blockAssignments.set(a.id,[b.id,c.id])');assert.equal(run('legalBlockers(state.battle,a).length'),2);
 assert.equal(run("creatureCanAttack({card:FIXTURES[4],defender:true,summonedTurn:0},2)"),false);
 run("b.flying=true;b.power=2;b.damage=0;resolveCombatDamage([b],new Map([[b.id,[a]]]),'player')");assert.equal(run('b.damage'),0);assert.equal(run('a.health'),18);
});
test('Rancor returns to hand and Llanowar Elves taps for generic mana only when ready',()=>{
 const run=game();prepare(run);run("state.battle.hand=[BUNDLED_CARDS.find(card=>card.name==='Llanowar Elves')];playCard(0,'player');globalThis.elf=state.battle.creatures[0];state.battle.permanents=[{id:'r',card:BUNDLED_CARDS.find(card=>card.name==='Rancor'),attachedTo:elf.id}]");assert.equal(run('tapForMana(elf.id)'),false);
 run('state.battle.turn+=1;globalThis.mana=state.battle.mana;tapForMana(elf.id)');assert.equal(run('state.battle.mana-mana'),1);assert.equal(run('tapForMana(elf.id)'),false);
 run('cleanupAttachments(new Set([elf.id]))');assert.equal(run("state.battle.hand.some(card=>card.name==='Rancor')"),true);assert.equal(run('state.battle.permanents.length'),0);
});
test('Omen has flash and scries before drawing; Fountain sacrifices to draw; Chorus gains toughness',()=>{
 const run=game();prepare(run);run("state.battle.phase='blocks';state.battle.deck=[FIXTURES[0],FIXTURES[1],FIXTURES[2]];state.battle.hand=[BUNDLED_CARDS.find(card=>card.name==='Omen of the Sea')];playCard(0)");assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.scry.cards[0].card.id'),FIXTURES[2].id);
 run('state.battle.scry.cards[0].bottom=true;finishScry()');assert.equal(run('state.battle.hand[0].id'),FIXTURES[1].id);assert.equal(run('state.battle.deck[0].id'),FIXTURES[2].id);
 run("state.battle.phase='main';state.battle.hand=[BUNDLED_CARDS.find(card=>card.name==='Fountain of Renewal'),BUNDLED_CARDS.find(card=>card.name==='Angelic Chorus'),FIXTURES[4]];playCard(0);globalThis.life=state.playerHealth;playCard(0);playCard(0,'player')");assert.equal(run('state.playerHealth-life'),3);
 run("globalThis.fountain=state.battle.permanents.find(item=>item.card.name==='Fountain of Renewal');globalThis.before=state.battle.hand.length;activatePermanent(fountain.id)");assert.equal(run('state.battle.hand.length-before'),1);assert.equal(run("state.battle.graveyard.some(card=>card.name==='Fountain of Renewal')"),true);
});
test('catalog filters combine keyword, type, mana, colour and search',()=>{
 const run=game();run("openCollection('catalog');$('#collection-type').value='Creature';$('#collection-keyword').value='flying';$('#collection-color').value='W';$('#collection-mana').value='1';renderCollection()");assert.equal(run('state.collectionCards.length'),1);assert.equal(run('state.collectionCards[0].name'),"Healer's Hawk");run("$('#collection-search').value='goblin';renderCollection()");assert.equal(run('state.collectionCards.length'),0);
});

test('deathtouch trample assigns one lethal damage and spills the rest',()=>{
 const run=game();prepare(run);run("globalThis.a={id:'a',owner:'player',card:FIXTURES[4],power:5,toughness:5,deathtouch:true,trample:true};globalThis.b={id:'b',owner:'enemy',card:FIXTURES[4],power:0,health:10,maxHealth:10,shield:2};globalThis.c={...b,id:'c',shield:0};state.battle.creatures=[a];state.battle.enemyCreatures=[b,c];resolveCombatDamage([a],new Map([[a.id,[b]]]),'player')");assert.equal(run('b.health'),0);assert.equal(run('state.battle.enemyCreatures.includes(b)'),false);assert.equal(run('c.health'),6);
});
