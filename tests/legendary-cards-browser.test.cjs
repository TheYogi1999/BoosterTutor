const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 fs.mkdirSync('work',{recursive:true});const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[],missing=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url())});await p.route('https://api.scryfall.com/**',r=>r.abort());
 await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
 await p.locator('#card-catalog-button').click();
 for(const name of ['Questing Beast','The One Ring']){
  await p.locator('#collection-search').fill(name);assert.equal(await p.locator('.collection-entry').count(),1);assert.match(await p.locator('.catalog-audit').innerText(),/Playable|Adapted/);await p.locator('.collection-card img').evaluate(n=>n.decode());
  assert.match(await p.locator('.collection-entry').textContent(),name==='Questing Beast'?/power 2|Power ≤2/i:/burden/i);
 }
 await p.locator('#collection-close').click();
 await p.evaluate(()=>{
  state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.deck=[...Array.from({length:40},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'))),...generateStarterManaCards(4)];beginBattle(1);
  window.b95=state.battle;b95.permanents=[];b95.creatures=[];b95.hand=['The One Ring','Questing Beast','The One Ring'].map(n=>runCard59(BUNDLED_CARDS.find(c=>c.name===n)));b95.floatingMana=40;syncMana(b95);b95.enemyCreatures=[createFoe('boar',1),createFoe('boar',1)];b95.enemyCreatures.forEach(e=>{e.power=2;e.pattern=['guard'];e.counterspell=false;e.ward=0;e.health=e.maxHealth=100});b95.waves=[b95.enemyCreatures];renderBattle();
 });
 const cast=async name=>{const index=await p.evaluate(n=>b95.hand.findIndex(c=>c.name===n),name);await p.locator(`[data-hand-index="${index}"]`).click()};
 await cast('The One Ring');assert.equal(await p.locator('#player-ring-protection95').isVisible(),true);
 const ring=()=>p.locator('[data-permanent-id]').filter({has:p.locator('img[alt="The One Ring"]')});
 const start=await p.evaluate(()=>({mana:b95.mana,library:b95.deck.length,hand:b95.hand.length}));
 await ring().click();assert.equal(await p.locator('#token-action-dialog').evaluate(n=>n.open),true);assert.match(await p.locator('#token-action-cost').innerText(),/no mana cost.*keep this artifact/i);assert.match(await p.locator('#token-action-confirm').innerText(),/Draw 1/i);
 await p.locator('#token-action-close73').click();assert.equal(await p.evaluate(()=>b95.deck.length),start.library);assert.equal(await p.evaluate(()=>b95.permanents[0].burden95),0);
 await ring().click();await p.locator('#token-action-confirm').click();assert.equal(await p.evaluate(()=>b95.deck.length),start.library-1);assert.equal(await p.evaluate(()=>b95.mana),start.mana);assert.equal(await ring().count(),1);assert.match(await p.locator('.ring-burden95').innerText(),/1/);
 await ring().click();assert.equal(await p.locator('#token-action-confirm').isDisabled(),true);await p.locator('#token-action-close73').click();
 const beastIndex=await p.evaluate(()=>b95.hand.findIndex(c=>c.name==='Questing Beast'));await p.locator(`[data-hand-index="${beastIndex}"]`).dragTo(p.locator('#creature-row'));await p.waitForFunction(()=>b95.creatures.some(u=>u.card.name==='Questing Beast'));
 assert.match(await p.locator('.keyword-strip').first().textContent(),/Deathtouch/);assert.match(await p.locator('.keyword-strip').first().textContent(),/Vigilance/);assert.match(await p.locator('.keyword-strip').first().textContent(),/Haste/);
 await p.waitForFunction(()=>Date.now()>=(state.suppressClickUntil||0));await p.locator('[data-creature-id]').first().click();assert.equal(await p.evaluate(()=>b95.creatures[0].willAttack),true,'Haste allows queuing on its entry turn');
 assert.equal(await p.evaluate(()=>canBlockCreature(b95.enemyCreatures[0],b95.creatures[0])),false);
 await p.evaluate(()=>{window.life95=state.playerHealth;beginNextPlayerTurn45(b95)});assert.equal(await p.evaluate(()=>state.playerHealth),await p.evaluate(()=>life95-1));assert.equal(await p.locator('#player-ring-protection95').isVisible(),false);
 await ring().click();assert.match(await p.locator('#token-action-confirm').innerText(),/Draw 2/i);const before=await p.evaluate(()=>b95.deck.length);await p.locator('#token-action-confirm').click();assert.equal(await p.evaluate(()=>b95.deck.length),before-2);assert.match(await p.locator('.ring-burden95').innerText(),/2/);
 // A new cast may refresh protection while you keep the old, burdened Ring.
 await p.evaluate(()=>{b95.floatingMana=20;syncMana(b95);renderBattle()});await cast('The One Ring');await p.waitForFunction(()=>visibleJesterChoice65?.title==='The One Ring · keep one');
 assert.equal(await p.locator('[data-jester-pick65]').count(),2);assert.match(await p.locator('#jester-choice-instruction').textContent(),/graveyard/);await p.locator('[data-jester-pick65]').filter({hasText:'2 burden counters'}).click();await p.locator('#jester-choice-confirm').click();await p.waitForFunction(()=>!jesterPending65(b95));
 assert.equal(await ring().count(),1);assert.equal(await p.evaluate(()=>b95.permanents[0].burden95),2);assert.equal(await p.locator('#player-ring-protection95').isVisible(),true);assert.equal(await p.evaluate(()=>b95.graveyard.filter(c=>c.name==='The One Ring').length),1);
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
  await ring().click();assert.equal(await p.locator('#token-action-dialog').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=-1&&r.left>=-1&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1}),true);await p.locator('#token-action-close73').click();
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.screenshot({path:'work/legendary95-battle.png'});
 await ring().click();await p.screenshot({path:'work/legendary95-ring.png'});await p.locator('#token-action-close73').click();
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS both verified original-print cards, real cast and Beast drag/drop/Haste, Ring battlefield click/cancel/confirm/tap/one-then-two draws, upkeep/expiry, counter badge, explicit legend choice, three fitted viewports and no missing assets or page errors.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
