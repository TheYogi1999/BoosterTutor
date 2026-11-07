const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function game() {
  const elements = new Map();
  function element(key) { if (!elements.has(key)) elements.set(key, {textContent:'',innerHTML:'',style:{},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},append(){},closest(){return null},isConnected:true,offsetWidth:380,offsetHeight:180,getBoundingClientRect(){return {left:200,top:500,bottom:700,width:130}}}); return elements.get(key); }
  const context = vm.createContext({document:{body:{append(){}},querySelector:element,querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame(){},window:{scrollTo(){},addEventListener(){},innerWidth:1200,innerHeight:900},setTimeout:()=>0,clearTimeout(){},console,AbortSignal});
  vm.runInContext(fs.readFileSync('game.js','utf8'),context);
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
 run("state.soundOn=false; state.playerHealth=20; state.battle={phase:'main',mana:3,maxMana:3,hand:[FALLBACK_CARDS.find(card=>card.id==='demo-mending')],graveyard:[],creatures:[],enemyCreatures:[{}],log:[]}; renderBattle=()=>{}; playCard(0);");
 assert.equal(run('state.battle.mana'),1);assert.equal(run('state.battle.hand.length'),0);assert.equal(run('state.battle.graveyard.length'),1);assert.equal(run('state.playerHealth'),25);
});
test('mana refills and grows, while health persists between fights',()=>{
 const run=game();
 run("state.soundOn=false; state.pool=FALLBACK_CARDS; state.deck=FALLBACK_CARDS; state.playerHealth=17; beginBattle(1);");
 assert.equal(run('state.playerHealth'),17);assert.equal(run('state.battle.mana'),3);
 run('state.battle.enemyCreatures=[]; winBattle=()=>{};');
 // Use harmless summoning-sick enemies to exercise full turn rollover.
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:FALLBACK_CARDS.find(card=>card.id==='demo-sentinel'),power:0,health:10,maxHealth:10,summoningSick:true,summonedTurn:99}]; state.battle.mana=0; resolveEnemyCombat();");
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
 const run=game();run("state.packs=[[FALLBACK_CARDS[0]],[FALLBACK_CARDS.find(card=>card.id==='demo-sentinel')],[FALLBACK_CARDS[2]]];state.selection=new Map([[0,0],[1,0],[2,0]]);state.activePack=2;confirmDraft();");
 assert.equal(run('state.deck.length'),16);assert.equal(run('state.deck.some(isLand)'),false);assert.equal(run('state.battle'),null);
});
function prepare(run) {
 run(`state.soundOn=false; state.pool=FALLBACK_CARDS; state.deck=Array.from({length:24},()=>FALLBACK_CARDS.find(card=>card.id==='demo-sentinel')); beginBattle(1); state.battle.mana=20; state.battle.maxMana=20;`);
}
test('all starter packs contain seven cards and are opened sequentially',()=>{
 const run=game();run('state.soundOn=false;state.pool=FALLBACK_CARDS;state.packs=makeStarterPacks();state.activePack=0;state.boosterSealed=true;renderDraft();');
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
 run("state.battle.hand=[FALLBACK_CARDS.find(card=>card.id==='demo-aegis')];playCard(0);");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.graveyard.length'),0);assert.equal(run('state.battle.playerBlock'),2);
 run("state.battle.enemyCreatures.forEach(c=>{c.summoningSick=true;c.summonedTurn=99});resolveEnemyCombat();");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.playerBlock'),2);
});
test('equipment attaches, can move without stacking, and survives its creature',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FALLBACK_CARDS.find(card=>card.id==='demo-sentinel'),FALLBACK_CARDS.find(card=>card.id==='demo-wolf'),FALLBACK_CARDS.find(card=>card.id==='demo-blade')];playCard(0,'player');playCard(0,'player');playCard(0);state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id};selectAttachmentTarget(state.battle.creatures[0].id);");
 assert.equal(run('state.battle.creatures[0].power'),4);assert.equal(run('state.battle.creatures[0].toughness'),4);
 run('refreshPermanentEffects();refreshPermanentEffects()');assert.equal(run('state.battle.creatures[0].power'),4);
 run('state.battle.pendingAttachment={permanentId:state.battle.permanents[0].id};selectAttachmentTarget(state.battle.creatures[1].id)');
 assert.equal(run('state.battle.creatures[0].power'),2);assert.equal(run('state.battle.creatures[1].power'),5);
 run("state.battle.creatures[1].damage=99;state.battle.creatures=removeDeadCreatures(state.battle.creatures,'player')");
 assert.equal(run('state.battle.permanents.length'),1);assert.equal(run('state.battle.permanents[0].attachedTo'),null);assert.equal(run('state.battle.graveyard.length'),1);
});
test('aura waits for a legal target, grants stats and flying, then dies with its host',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[FALLBACK_CARDS.find(card=>card.id==='demo-aura')];playCard(0);");
 assert.equal(run('state.battle.hand.length'),1);assert.equal(run('state.battle.mana'),20);
 run("state.battle.hand.unshift(FALLBACK_CARDS.find(card=>card.id==='demo-sentinel'));playCard(0,'player');playCard(0);");
 assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.mana'),18);
 run('selectAttachmentTarget(state.battle.creatures[0].id)');
 assert.equal(run('state.battle.mana'),16);assert.equal(run('state.battle.creatures[0].power'),3);assert.equal(run("hasCreatureKeyword(state.battle.creatures[0],'flying')"),true);
 run("state.battle.creatures[0].damage=99;state.battle.creatures=removeDeadCreatures(state.battle.creatures,'player')");
 assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.graveyard.length'),2);
});
test('global enchantment modifiers apply once and include creatures cast later',()=>{
 const run=game();prepare(run);
 run("state.battle.hand=[{id:'anthem',name:'Anthem',cmc:1,type_line:'Enchantment',oracle_text:'Creatures you control get +1/+1.'},FALLBACK_CARDS.find(card=>card.id==='demo-sentinel')];playCard(0);playCard(0,'player');refreshPermanentEffects();");
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
 run("state.battle.creatures=[{id:'p',owner:'player',card:{name:'Guard'},power:2,toughness:3}];state.battle.hand=[FALLBACK_CARDS.find(card=>card.id==='demo-aura')];playCard(0);freeMulligan();selectAttachmentTarget('p');");
 assert.equal(run('state.battle.pendingAttachment'),null);assert.equal(run('state.battle.permanents.length'),0);assert.equal(run('state.battle.mana'),20);assert.equal(run('state.battle.hand.length'),7);
});
