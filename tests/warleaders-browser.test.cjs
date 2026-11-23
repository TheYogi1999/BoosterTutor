const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[],missing=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url())});
  await p.route('https://api.scryfall.com/**',r=>r.abort());
  await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  await p.locator('#card-catalog-button').click();
  for(const name of ['Primordial Ooze','Aurelia, the Warleader','Aurelia, the Law Above','Gisela, Blade of Goldnight','Adeline, Resplendent Cathar','Anzrag, the Quake-Mole','Zopandrel, Hunger Dominus','Roxanne, Starfall Savant','Mirkwood Bats']){
   await p.locator('#collection-search').fill(name);assert.equal(await p.locator('.collection-entry').count(),1,name);assert.match(await p.locator('.catalog-audit').innerText(),/Playable|Adapted/,name);await p.locator('.collection-card img').evaluate(n=>n.decode());
  }
  await p.locator('#collection-close').click();
  await p.evaluate(()=>{
   state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.deck=[...Array.from({length:50},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'))),...generateStarterManaCards(4)];beginBattle(1);
   window.b103=state.battle;window.card103=n=>BUNDLED_CARDS.find(c=>c.name===n);
   b103.creatures=[];b103.permanents=[];b103.hand=['Roxanne, Starfall Savant','Mirkwood Bats','Zopandrel, Hunger Dominus','Grizzly Bears','Grizzly Bears','Aurelia, the Warleader'].map(n=>runCard59(card103(n)));b103.floatingMana=100;syncMana(b103);
   b103.enemyCreatures=[createFoe('boar',1)];b103.enemyCreatures.forEach(e=>{e.power=0;e.pattern=['attack'];e.counterspell=false;e.ward=0;e.reach=true;e.health=e.maxHealth=500});b103.waves=[b103.enemyCreatures];renderBattle();
  });
  const cast=async name=>{const i=await p.evaluate(n=>b103.hand.findIndex(c=>c.name===n),name);assert.ok(i>=0,name);await p.locator(`[data-hand-index="${i}"]`).click()};
  const pick=async index=>{await p.locator(`[data-jester-pick65="${index}"]`).click();await p.locator('#jester-choice-confirm').click()};
  const settle=()=>p.waitForFunction(()=>!jesterPending65(b103)&&!b103.resolutionTask);
  await cast('Roxanne, Starfall Savant');await p.waitForFunction(()=>visibleJesterChoice65?.title==='Meteorite · entry trigger');await pick(0);await settle();assert.equal(await p.evaluate(()=>b103.enemyCreatures[0].health),498);
  const meteorite=()=>p.locator('.permanent-card').filter({hasText:'Meteorite'}).first();
  await meteorite().click();assert.equal(await p.locator('#token-action-confirm').isDisabled(),true);assert.match(await p.locator('#token-action-effect').textContent(),/not sacrificed/i);await p.locator('#token-action-close73').click();
  assert.equal(await p.locator('[data-host-id]').filter({hasText:'Roxanne, Starfall Savant'}).locator('[data-unit-mana]').count(),0);
  await cast('Mirkwood Bats');await p.evaluate(()=>beginNextPlayerTurn45(b103));
  const mana=await p.evaluate(()=>b103.mana);await meteorite().click();await p.locator('#token-action-confirm').click();assert.equal(await p.evaluate(()=>b103.mana),mana+2);assert.equal(await meteorite().count(),1);
  await p.evaluate(()=>{b103.floatingMana=100;syncMana(b103);renderBattle()});
  await cast('Zopandrel, Hunger Dominus');await cast('Grizzly Bears');await cast('Grizzly Bears');
  const zop=()=>p.locator('[data-host-id]').filter({hasText:'Zopandrel, Hunger Dominus'});
  await zop().getByRole('button',{name:'Zopandrel, Hunger Dominus abilities',exact:true}).click();
  const before=await p.evaluate(()=>({mana:b103.mana,life:state.playerHealth}));assert.match(await p.locator('#creature-ability-cost').textContent(),/Phyrexian/);await p.locator('#creature-ability-confirm').click();
  assert.equal(await p.evaluate(()=>b103.mana),before.mana);await pick(1);
  const bears=p.locator('[data-jester-pick65]').filter({hasText:'Grizzly Bears'});await bears.nth(0).click();await bears.nth(1).click();await p.locator('#jester-choice-confirm').click();await settle();
  assert.equal(await p.evaluate(()=>b103.mana),before.mana-1);assert.equal(await p.evaluate(()=>state.playerHealth),before.life-2);assert.match(await zop().locator('.indestructible-counter103').innerText(),/Indestructible/);
  await cast('Aurelia, the Warleader');
  await p.waitForFunction(()=>Date.now()>=(state.suppressClickUntil||0));
  await p.locator('.creature-token').filter({hasText:'Roxanne, Starfall Savant'}).click();await p.locator('.creature-token').filter({hasText:'Aurelia, the Warleader'}).click();
  const turn=await p.evaluate(()=>({turn:b103.turn,library:b103.deck.length,mana:b103.mana}));
  await p.locator('#end-turn-button').click();await p.waitForFunction(()=>b103.phase==='attack'&&Boolean(b103.priorityCallback));await p.locator('#end-turn-button').click();
  await p.waitForFunction(()=>visibleJesterChoice65?.title==='Meteorite · entry trigger');await pick(0);await p.waitForFunction(()=>b103.combatOnly103&&b103.phase==='main');
  assert.match(await p.locator('#end-turn-button').innerText(),/START EXTRA COMBAT/);assert.match(await p.locator('#phase-strip [data-phase="main"]').innerText(),/Extra combat/);
  assert.deepEqual(await p.evaluate(()=>({turn:b103.turn,library:b103.deck.length,mana:b103.mana})),turn);
  assert.equal(await p.evaluate(()=>b103.creatures.find(u=>u.card.name==='Roxanne, Starfall Savant').tapped),false);
  assert.equal(await p.evaluate(()=>canCastNow(card103('Grizzly Bears'),b103)),false);
  fs.mkdirSync('work/cards103',{recursive:true});await p.screenshot({path:'work/cards103/extra-combat.png'});
  // Real upkeep window must stop the normal draw and remain usable on phones.
  await p.evaluate(()=>{b103.creatures=[];b103.permanents=[];b103.extraCombats103=0;b103.combatOnly103=false;const c=card103('Primordial Ooze'),u={id:'ooze103',owner:'player',card:c,...parseStats(c),...creatureKeywords(c),summonedTurn:0};b103.creatures.push(u);b103.turnEffects=[];window.library103=b103.deck.length;beginNextPlayerTurn45(b103)});
  await p.waitForFunction(()=>visibleJesterChoice65?.title.startsWith('Primordial Ooze'));assert.equal(await p.evaluate(()=>b103.deck.length),await p.evaluate(()=>library103));
  for(const viewport of [{width:1600,height:900},{width:844,height:390},{width:390,height:844}]){
   await p.setViewportSize(viewport);await p.waitForFunction(()=>{const r=document.querySelector('#jester-choice-confirm').getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1},{},{timeout:3000}).catch(async e=>{console.log(await p.locator('#jester-choice-confirm').evaluate(n=>({button:n.getBoundingClientRect().toJSON(),dialog:n.closest('dialog').getBoundingClientRect().toJSON(),scale:n.closest('dialog').style.cssText,viewport:[innerWidth,innerHeight]})));await p.screenshot({path:'work/cards103/upkeep-fit-failure.png'});throw e});
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
   assert.equal(await p.locator('#jester-choice-confirm').evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}),true,JSON.stringify(viewport));
  }
  await pick(1);await settle();assert.equal(await p.evaluate(()=>b103.deck.length),await p.evaluate(()=>library103-1));assert.equal(await p.evaluate(()=>b103.creatures[0].tapped),true);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS nine searchable playable cards and images, actual Roxanne cast/target, tapped Meteorite click/confirm/mana, Phyrexian sacrifice UI/counter, additional combat with no draw/refill, blocking upkeep and three fitted viewport sizes; no page errors or missing assets.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
