const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.bringToFront();
  await p.evaluate(()=>{
   state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;
   window.reset89=()=>{
    showScreen('start-screen');state.runMode71='draft';state.immortal76=null;state.endless=false;state.playerHealth=30;
    state.deck=Array.from({length:45},()=>physicalRunCopy60(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')));state.deck.push(...generateStarterManaCards(4));
    beginBattle(1);const b=state.battle;b.turn=5;b.phase='main';b.creatures=[];b.permanents=[];b.hand=[];b.enemyCreatures=[];b.waves=[b.enemyCreatures];return b;
   };
   window.ally89=name=>{const card=BUNDLED_CARDS.find(c=>c.name===name),u={id:'ally-'+state.nextPermanentId++,owner:'player',card,...parseStats(card),...creatureKeywords(card),summonedTurn:0,summoningSick:false};state.battle.creatures.push(u);return u};
   reset89();
  });
  assert.equal(await p.evaluate(()=>Object.keys(FOES89).length),8);assert.equal(await p.evaluate(()=>Object.keys(FOE_TYPES).length),36);
  // A seeded sample exercises real encounters and late-wave generation, without flaky random reachability.
  const encounters=await p.evaluate(()=>{
   const random=Math.random;let seed=89;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   const seen=new Set(),early=new Set();let max=0;
   try{for(let i=0;i<120;i++)for(const encounter of ENCOUNTERS){
    const node=ENCOUNTERS.indexOf(encounter)+1;
    for(const team of createEncounterWaves45(encounter)){
     max=Math.max(max,team.length);for(const u of team){seen.add(u.kind);if(node===1)early.add(u.kind);}
    }
   }}finally{Math.random=random;}
   return{missing:Object.keys(FOES89).filter(k=>!seen.has(k)),early:[...early],max};
  });
  assert.deepEqual(encounters.missing,[]);assert.equal(encounters.max,6);
  for(const k of ['copperscarab','dawncentaur','cinderphoenix','moonmyconid','abyssleviathan'])assert.ok(!encounters.early.includes(k),'Late enemies do not enter opening encounters');
  assert.equal(await p.evaluate(()=>Object.keys(FOE_TYPES).every(k=>!hasCreatureKeyword({...createFoe(k,4),indestructible:true,temporaryKeywords:['indestructible']},'indestructible'))),true);
  // Flying, Reach and Haste use the real attack legality checks, including on the entry turn.
  assert.deepEqual(await p.evaluate(()=>{
   const b=reset89(),imp=createFoe('emberimp',1),toad=createFoe('miretoad',1);b.turn=1;b.enemyCreatures=[imp,toad];
   const bear=ally89('Grizzly Bears'),spider=ally89('Giant Spider'),bird=ally89('Wind Drake');
   return[creatureCanAttack(imp,1),creatureCanAttack(toad,1),canAttackEnemy(bear,imp),canAttackEnemy(spider,imp),canAttackEnemy(bird,imp)];
  }),[true,false,false,true,true]);
  // First strike removes a normal striker before retaliation; Lifelink restores the actual damage dealt.
  assert.deepEqual(await p.evaluate(()=>{
   const b=reset89(),u=ally89('Grizzly Bears'),e=createFoe('dawncentaur',2);b.enemyCreatures=[e];e.health=10;
   resolveCombatDamage([u],new Map([[u.id,[e]]]),'player');return[b.creatures.length,e.health];
  }),[0,13]);
  assert.equal(await p.evaluate(()=>{
   const b=reset89(),u=ally89('Grizzly Bears'),e=createFoe('miretoad',1);b.enemyCreatures=[e];
   resolveCombatDamage([u],new Map([[u.id,[e]]]),'player');return b.creatures.length;
  }),0,'One deathtouch damage kills a 2-toughness creature');
  // Real colors and permanent types continue to govern restricted removal.
  const targets=await p.evaluate(()=>{
   const b=reset89();b.enemyCreatures=Object.keys(FOES89).map(k=>createFoe(k,4));const out={};
   for(const name of ['Doom Blade','Go for the Throat','Plummet','Revoke Existence'])out[name]=ruleTargetOptions(SPELL_RULES[name].target,b).map(o=>o.unit.kind);
   return out;
  });
  assert.ok(!targets['Doom Blade'].includes('miretoad'));assert.ok(targets['Doom Blade'].includes('copperscarab'));
  assert.ok(!targets['Go for the Throat'].includes('copperscarab'));assert.deepEqual(targets.Plummet.sort(),['cinderphoenix','emberimp']);
  assert.deepEqual(targets['Revoke Existence'].sort(),['copperscarab','moonmyconid']);
  assert.deepEqual(await p.evaluate(()=>['copperscarab','moonmyconid','abyssleviathan'].map(k=>wardCost(createFoe(k,4)))),[1,1,2]);
  // Mill moves the physical top card to the graveyard once; healing is capped at maximum life.
  assert.deepEqual(await p.evaluate(()=>{
   const b=reset89(),e=createFoe('moonmyconid',3);b.enemyCreatures=[e];b.turn=1;const n=b.deck.length,c=b.deck.at(-1),g=b.graveyard.length;
   resolveEnemyIntents();resolveEnemyIntents();const result=[b.deck.length===n-1,b.graveyard.length===g+1,b.graveyard.at(-1)===c];
   e.health=e.maxHealth-1;b.turn=2;resolveEnemyIntents();result.push(e.health===e.maxHealth);return result;
  }),[true,true,true,true]);
  // Existing D6 spell checks and counter-response machinery also receive the new casters.
  assert.deepEqual(await p.evaluate(()=>{
   const b=reset89();b.enemyCreatures=[createFoe('cinderphoenix',3)];b.turn=2;prepareEnemySpells38(b);
   const a=b.enemySpells.map(s=>[s.card.name,s.status]);delete b.enemySpellsTurn;b.enemyCreatures=[createFoe('moonmyconid',3)];b.turn=4;prepareEnemySpells38(b);
   return[a,b.enemySpells.map(s=>[s.card.name,s.status])];
  }),[[['Lava Spike','awaiting-roll']],[['Shock','awaiting-roll']]]);
  // Inspect all eight artwork cells, portrait size parity, labels and enemy spell intents.
  const cells=new Set();
  for(const kind of ['emberimp','miretoad','copperscarab','dawncentaur','cinderphoenix','thornstag','moonmyconid','abyssleviathan']){
   const result=await p.evaluate(kind=>{const b=reset89();b.enemyCreatures=[createFoe(kind,4)];renderBattle();const n=document.querySelector('.monster .walker-portrait'),s=getComputedStyle(n);return{art:s.backgroundImage,cell:s.backgroundPosition,keywords:document.querySelector('.monster-keywords').textContent,type:document.querySelector('.enemy-type67').getAttribute('aria-label')};},kind);
   assert.match(result.art,/enemies-v89\.webp/);cells.add(result.cell);
   if(kind==='copperscarab')assert.match(result.type,/Artifact Creature.*Colorless/);
   if(kind==='moonmyconid')assert.match(result.type,/Enchantment Creature.*Blue.*Green/);
   if(['copperscarab','moonmyconid','abyssleviathan'].includes(kind))assert.match(result.keywords,/Ward \([12] mana\)/);
  }
  assert.equal(cells.size,8);
  await p.evaluate(()=>{reset89();state.battle.enemyCreatures=Object.keys(FOES89).slice(0,6).map(k=>createFoe(k,4));renderBattle()});
  await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  assert.equal(await p.locator('.monster .walker-portrait').evaluateAll(ns=>new Set(ns.map(n=>[getComputedStyle(n).width,getComputedStyle(n).height].join('/'))).size),1);
  await p.screenshot({path:'work/enemy-roster89-battle.png'});
  for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS eight new enemies, 36 total; seeded real encounters and waves; six slots; Haste/Flying/Reach, First Strike/Lifelink, Deathtouch, real restricted removal, Ward, physical Mill/healing, D6 spell attempts, all eight original portraits, equal sizes, desktop/tablet/mobile, no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
