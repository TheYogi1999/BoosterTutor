const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function game() {
  const elements = new Map();
  function element(key) { if (!elements.has(key)) elements.set(key, {textContent:'',innerHTML:'',style:{},dataset:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},querySelectorAll(){return []},setAttribute(){}}); return elements.get(key); }
  const context = vm.createContext({document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},window:{scrollTo(){}},setTimeout:()=>0,clearTimeout(){},console,AbortSignal});
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
 run("state.soundOn=false; state.playerHealth=20; state.battle={phase:'main',mana:3,maxMana:3,hand:[FALLBACK_CARDS[4]],graveyard:[],creatures:[],enemyCreatures:[{}],log:[]}; renderBattle=()=>{}; playCard(0);");
 assert.equal(run('state.battle.mana'),1);assert.equal(run('state.battle.hand.length'),0);assert.equal(run('state.battle.graveyard.length'),1);assert.equal(run('state.playerHealth'),25);
});
test('mana refills and grows, while health persists between fights',()=>{
 const run=game();
 run("state.soundOn=false; state.pool=FALLBACK_CARDS; state.deck=FALLBACK_CARDS; state.playerHealth=17; beginBattle(1);");
 assert.equal(run('state.playerHealth'),17);assert.equal(run('state.battle.mana'),3);
 run('state.battle.enemyCreatures=[]; winBattle=()=>{};');
 // Use harmless summoning-sick enemies to exercise full turn rollover.
 run("state.battle.enemyCreatures=[{id:'e',owner:'enemy',card:FALLBACK_CARDS[1],power:0,health:10,maxHealth:10,summoningSick:true,summonedTurn:99}]; state.battle.mana=0; resolveEnemyCombat();");
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
 const run=game();run("state.packs=[[FALLBACK_CARDS[0]],[FALLBACK_CARDS[1]],[FALLBACK_CARDS[2]]];state.selection=new Map([[0,0],[1,0],[2,0]]);confirmDraft();");
 assert.equal(run('state.deck.length'),16);assert.equal(run('state.deck.some(isLand)'),false);assert.equal(run('state.battle'),null);
});
