const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const FIXTURES = [
 {id:'fixture-aegis',name:'Shield fixture',cmc:2,type_line:'Enchantment',oracle_text:'Unrecognized static effect.'},
 {id:'fixture-blade',name:'Equipment fixture',cmc:1,type_line:'Artifact — Equipment',oracle_text:'Equipped creature gets +2/+1.'},
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
  function element(key) { if (!elements.has(key)) elements.set(key, {textContent:'',innerHTML:'',style:{},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},append(){},closest(){return null},isConnected:true,offsetWidth:380,offsetHeight:180,getBoundingClientRect(){return {left:200,top:500,bottom:700,width:130}}}); return elements.get(key); }
  const context = vm.createContext({document:{documentElement:{style:{setProperty(){}}},body:{append(){}},querySelector:element,querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame(){},window:{scrollTo(){},addEventListener(){},innerWidth:1200,innerHeight:900},queuedTimers,setTimeout:callback=>{queuedTimers.push(callback);return queuedTimers.length},clearTimeout(){},console,AbortSignal});
  vm.runInContext(fs.readFileSync('cards.js','utf8'),context);
  vm.runInContext(fs.readFileSync('game.js','utf8'),context);
  vm.runInContext(`globalThis.FIXTURES = ${JSON.stringify(FIXTURES)}`,context);
  return code => vm.runInContext(code,context);
}
test('all colour identities spend only their total generic mana value',()=>{
  const run=game();
  run("state.battle={mana:3};");
  for (const cost of ['{1}{W}{U}','{B}{B}{B}','{C}{C}{C}']) {
    assert.equal(run(`Boolean(paymentPlan({cmc:3,mana_cost:'${cost}'}))`),true);
    assert.equal(run(`manaCostHtml({cmc:3,mana_cost:'${cost}'}).includes('>3</span>')`),true);
  }
  assert.equal(run('paymentPlan({cmc:4})'),null);
  assert.equal(run('Boolean(paymentPlan({cmc:0}))'),true);
});
test('casting spends mana and moves a spell into the graveyard',()=>{
 const run=game();
 run("state.soundOn=false; state.playerHealth=20; state.battle={phase:'main',mana:3,maxMana:3,hand:[FIXTURES.find(card=>card.id==='fixture-mending')],graveyard:[],creatures:[],enemyCreatures:[{}],log:[]}; renderBattle=()=>{}; playCard(0);");
 assert.equal(run('state.battle.mana'),1);assert.equal(run('state.battle.hand.length'),0);assert.equal(run('state.battle.graveyard.length'),1);assert.equal(run('state.playerHealth'),25);
});
test('mana refills and grows, while health persists between fights',()=>{
 const run=game();
 run("state.soundOn=false; state.pool=FIXTURES; state.deck=FIXTURES; state.playerHealth=17; beginBattle(1);");
 assert.equal(run('state.playerHealth'),17);assert.equal(run('state.battle.mana'),3);
 run('state.battle.enemyCreatures=[]; winBattle=()=>{};');
 // Use harmless summoning-sick enemies to exercise full turn rollover.
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:FIXTURES.find(card=>card.id==='fixture-sentinel'),power:0,health:10,maxHealth:10,summoningSick:true,summonedTurn:99}]; state.battle.mana=0; resolveEnemyCombat();");
 assert.equal(run('state.battle.mana'),3);
 run('resolveEnemyCombat()');assert.equal(run('state.battle.mana'),4);
 run("state.relic='crystal'; beginBattle(2)");assert.equal(run('state.battle.mana'),4);assert.equal(run('state.playerHealth'),17);
});
test('flying blocking and first/double strike rules stay distinct',()=>{
 const run=game();
 assert.equal(run('canBlockCreature({}, {flying:true})'),false);
 assert.equal(run('canBlockCreature({reach:true}, {flying:true})'),true);
 assert.equal(run('dealsInCombatStep({firstStrike:true},true)'),true);
 assert.equal(run('dealsInCombatStep({firstStrike:true},false)'),false);
 assert.equal(run('dealsInCombatStep({doubleStrike:true},false)'),true);
});
test('starter draft produces a land-free 16-card deck before relic selection',()=>{
 const run=game();run("state.packs=[[FIXTURES[0]],[FIXTURES.find(card=>card.id==='fixture-sentinel')],[FIXTURES[2]]];state.selection=new Map([[0,0],[1,0],[2,0]]);state.activePack=2;confirmDraft();");
 assert.equal(run('state.deck.length'),16);assert.equal(run('state.deck.some(isLand)'),false);assert.equal(run('state.battle'),null);
});
function prepare(run) {
 run(`state.soundOn=false; state.pool=FIXTURES; state.deck=Array.from({length:24},()=>FIXTURES.find(card=>card.id==='fixture-sentinel')); beginBattle(1); state.battle.mana=20; state.battle.maxMana=20;`);
}
test('all starter packs contain seven cards and are opened sequentially',()=>{
 const run=game();run('state.soundOn=false;state.pool=FIXTURES;state.packs=makeStarterPacks();state.activePack=0;state.boosterSealed=true;renderDraft();');
 assert.equal(run('state.packs.length'),3);assert.equal(run('state.packs.every(pack=>pack.length===7)'),true);
 assert.equal(run("$('#draft-grid').innerHTML.includes('sealed-pack')"),true);
 run('state.boosterSealed=false;renderDraft()');
 assert.equal(run("($('#draft-grid').innerHTML.match(/class=\"draft-option/g)||[]).length"),7);
 run('state.selection.set(0,0);confirmDraft();');
 assert.equal(run('state.activePack'),1);assert.equal(run('state.boosterSealed'),true);assert.equal(run('state.deck.length'),0);
 run('state.boosterSealed=false;state.selection.set(1,0);confirmDraft();');assert.equal(run('state.activePack'),2);
 run('state.boosterSealed=false;state.selection.set(2,0);confirmDraft();');assert.equal(run('state.deck.length'),16);
});
test('opening and mulligan both draw seven, with a seven-card ceiling',()=>{
 const run=game();prepare(run);assert.equal(run('state.battle.hand.length'),7);
 run('freeMulligan()');assert.equal(run('state.battle.hand.length'),7);
 run('drawOneExtra()');assert.equal(run('state.battle.hand.length'),7);
 run('state.battle.hand.pop();drawOneExtra()');assert.equal(run('state.battle.hand.length'),7);
});
test('enchantment remains on board and its shield renews each turn',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FIXTURES.find(card=>card.id==='fixture-aegis')];playCard(0);");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.graveyard.length'),0);assert.equal(run('state.battle.playerBlock'),1);
 run("state.battle.enemyCreatures.forEach(c=>{c.summoningSick=true;c.summonedTurn=99});resolveEnemyCombat();");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.playerBlock'),1);
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
 assert.equal(run('state.battle.creatures.length'),1);assert.equal(run('state.battle.enemyCreatures.length'),0);assert.equal(run('state.battle.creatures[0].damage'),0);
});
test('block assignment rejects illegal flying blocks and toggles legal assignments',()=>{
 const run=game();prepare(run);
 run("state.battle.phase='blocks';state.battle.turn=3;state.battle.creatures=[{id:'p',owner:'player',card:{name:'Guard'},power:2,toughness:3,tapped:false}];state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:{name:'Flyer'},power:2,health:3,maxHealth:3,flying:true,summonedTurn:1}];assignBlocker('e','p');");
 assert.equal(run('state.battle.blockAssignments.size'),0);
 run("state.battle.creatures[0].reach=true;assignBlocker('e','p')");assert.equal(run("state.battle.blockAssignments.get('e')"),'p');
 run("assignBlocker('e','p')");assert.equal(run('state.battle.blockAssignments.size'),0);
});
test('rules bubble describes the implemented fallback, not unsupported original text',()=>{
 const run=game();prepare(run);
 run("globalThis.mystery={name:'Mystery',type_line:'Sorcery',cmc:2,oracle_text:'Take an extra turn.'};showCardPreview(mystery,{dataset:{previewOwner:'hand',handIndex:0},isConnected:true,setAttribute(){},removeAttribute(){},closest(){return null},getBoundingClientRect(){return {left:200,top:500,bottom:700,width:130}}});");
 assert.equal(run("$('#card-preview').innerHTML.includes('6 Schaden')"),true);assert.equal(run("$('#card-preview').innerHTML.includes('Take an extra turn')"),false);
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
test('the shipped pool contains 32 real cards with locally available JPEGs',()=>{
 const run=game();
 assert.equal(run('BUNDLED_CARDS.length'),32);
 assert.equal(run("BUNDLED_CARDS.every(card=>card.verified && /^[a-f0-9-]{36}$/.test(card.id) && !card.id.startsWith('demo-'))"),true);
 const cards=JSON.parse(run('JSON.stringify(BUNDLED_CARDS)'));
 assert.equal(new Set(cards.map(card=>card.id)).size,32);
 for(const card of cards){assert.equal(fs.readFileSync(card.image).readUInt16BE(0),0xffd8);}
 assert.equal(cards.find(card=>card.name==='Grizzly Bears').power,'2');
});
test('reroll changes seven cards once and clears only the current selection',()=>{
 const run=game();run('state.soundOn=false;state.pool=BUNDLED_CARDS;state.packs=makeStarterPacks();state.activePack=1;state.boosterSealed=false;state.selection=new Map([[0,0],[1,2]]);globalThis.oldIds=state.packs[1].map(c=>c.id);rerollCurrentPack();');
 assert.equal(run('state.packs[1].length'),7);assert.equal(run('state.packs[1].every(card=>!oldIds.includes(card.id))'),true);assert.equal(run('state.selection.has(0)'),true);assert.equal(run('state.selection.has(1)'),false);
 const after=run('JSON.stringify(state.packs[1])');run('rerollCurrentPack()');assert.equal(run('JSON.stringify(state.packs[1])'),after);
});
test('monster intentions control attacks and resolve guard/buff only once',()=>{
 const run=game();prepare(run);
 run("state.battle.enemyCreatures=[{id:'guard',owner:'enemy',card:{name:'Guard'},health:20,maxHealth:20,power:3,pattern:['guard','buff','attack']}];state.battle.turn=1;resolveEnemyIntents();resolveEnemyIntents();");
 assert.equal(run('state.battle.enemyCreatures[0].shield'),5);assert.equal(run('creatureCanAttack(state.battle.enemyCreatures[0],1)'),false);
 run('state.battle.turn=2;resolveEnemyIntents();resolveEnemyIntents()');assert.equal(run('state.battle.enemyCreatures[0].power'),4);
 assert.equal(run('enemyIntent(state.battle.enemyCreatures[0],3).damage'),4);
});
test('selected monster receives damage after shield, other monsters stay unchanged',()=>{
 const run=game();prepare(run);run("state.battle.enemyCreatures[0].shield=3;state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[0].id;globalThis.hp=state.battle.enemyCreatures[0].health;globalThis.other=state.battle.enemyCreatures[1].health;damageFirstEnemy(5)");
 assert.equal(run('state.battle.enemyCreatures[0].health'),run('hp-2'));assert.equal(run('state.battle.enemyCreatures[0].shield'),0);assert.equal(run('state.battle.enemyCreatures[1].health'),run('other'));
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
 run("state.battle.turn=3;state.battle.creatures=[{id:'p',owner:'player',card:{name:'Deathtouch fixture'},power:1,toughness:2,deathtouch:true,willAttack:true,summonedTurn:1,summoningSick:false}];resolvePlayerAttacks();");
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
 run("state.battle.turn=2;state.battle.creatures=[{id:'p',owner:'player',card:FIXTURES[4],power:2,toughness:3,summonedTurn:1,summoningSick:true,willAttack:true,tapped:false}];state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[1].id;");
 assert.equal(run("combatRoutes(state.battle).find(route=>route.kind==='ally').to"),run('state.battle.enemyCreatures[1].id'));
 run('state.battle.creatures[0].willAttack=false');assert.equal(run("combatRoutes(state.battle).filter(route=>route.kind==='ally').length"),0);
 run("state.battle.turn=1;state.battle.phase='blocks';state.battle.blockAssignments.set(state.battle.enemyCreatures[0].id,'p')");
 assert.equal(run("combatRoutes(state.battle).find(route=>route.kind==='block').to"),'p');
 assert.equal(run("combatRoutes(state.battle).some(route=>route.from===state.battle.enemyCreatures[1].id)"),false);
});
