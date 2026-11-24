const {test}=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./warleaders-fixture.cjs');
for(const kind of ['trample','reach','first strike','double strike','menace','hexproof']){
 test(`${kind}: buy once for a physical card, keep it across zones and respect the run boundary`,()=>{
  const r=fixture();r(`shop([${JSON.stringify(kind)}]);globalThis.physical=state.deck[0];globalThis.other=state.deck[1];globalThis.money=state.coins;purchase(0,0)`);
  assert.equal(r(`activeRunCounters60(physical).includes(${JSON.stringify(kind)})`),true);assert.equal(r(`state.coins`),r(`money-RUN_COUNTERS60[${JSON.stringify(kind)}].price`));assert.equal(r('activeRunCounters60(other).length'),0);assert.equal(r(`canReceiveRunCounter60(physical,${JSON.stringify(kind)})`),false);
  r(`state.screen='combat-screen';b.phase='main';b.hand=[physical];playCard(0,'player');globalThis.u=b.creatures[0]`);assert.equal(r(`hasCreatureKeyword(u,${JSON.stringify(kind)})`),true);
  r(`sacrificeRuleCreature(u);b.hand=[b.graveyard.pop()];playCard(0,'player');globalThis.returned=b.creatures[0]`);assert.equal(r(`hasCreatureKeyword(returned,${JSON.stringify(kind)})`),true);assert.equal(r('activeRunCounters60(returned.card).length'),1);
  r('resetRunProgress59()');assert.equal(r('activeRunCounters60(physical).length'),0);
 });
}
test('purchased first strike kills before retaliation; purchased double strike deals two real damage steps',()=>{
 for(const [kind,health,power,expected] of [['first strike',2,10,0],['double strike',100,0,96]]){
  const r=fixture();r(`shop([${JSON.stringify(kind)}]);purchase(0,0);globalThis.c=state.deck[0];state.screen='combat-screen';b.phase='main';b.hand=[c];playCard(0,'player');globalThis.u=b.creatures[0];globalThis.e=enemy();e.health=${health};e.power=${power};hit(u,e)`);assert.equal(r('u.damage||0'),0);assert.equal(r('b.creatures.includes(u)'),true);assert.equal(r('e.health'),expected);
 }
});
test('new keywords immediately affect existing persistent creatures, without re-entering the battlefield',()=>{
 const r=fixture();r(`shop(['reach']);globalThis.c=state.deck[0];globalThis.u={id:'persistent',owner:'player',card:c,power:2,toughness:2};b.creatures=[u];globalThis.e=enemy();e.flying=true`);assert.equal(r('canAttackEnemy(u,e)'),false);r('purchase(0,0)');assert.equal(r('canAttackEnemy(u,e)'),true);assert.equal(r('canBlockCreature(u,e)'),true);
});
test('Hexproof counters forbid enemy spell targets while your own buffs remain legal',()=>{
 const r=fixture();r(`shop(['hexproof']);purchase(0,0);globalThis.c=state.deck[0];state.screen='combat-screen';b.phase='main';b.hand=[c];playCard(0,'player');globalThis.u=b.creatures[0];globalThis.s={status:'pending',intent:'rune',card:{name:'Shock'},target:{side:'player',id:u.id},manaRemaining:10};resolveEnemySpell38(s,b)`);assert.equal(r('s.status'),'fizzled');assert.equal(r('u.damage||0'),0);assert.equal(r(`ruleTargetOptions('own-creature',b).some(o=>o.unit===u)`),true);
});
test('shop still offers three distinct random counters, including the five newly implemented types',()=>{
 const r=fixture();r('shop();state.shop.counters60=null;renderCounterOffers60()');assert.equal(r('state.shop.counters60.length'),3);assert.equal(r('new Set(state.shop.counters60.map(c=>c.kind)).size'),3);for(const k of ['reach','first strike','double strike','menace','hexproof'])assert.ok(r(`RUN_COUNTERS60[${JSON.stringify(k)}].price`)>0);
});
