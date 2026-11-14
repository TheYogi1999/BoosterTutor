const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[],missing=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url())});await p.route('https://api.scryfall.com/**',r=>r.abort());
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>typeof activePrecon72==='function');await p.evaluate(()=>state.soundOn=false);
  assert.equal(await p.locator('.brand-version').innerText(),'v0.73');await p.locator('#title-game-modes').click();
  await p.locator('[data-precon-deck="ember-echo"]').click();assert.match(await p.locator('#precon-details').innerText(),/Niv-Mizzet, the Firemind/);
  assert.match(await p.locator('[data-precon-deck="ember-echo"] .precon-front71>img').getAttribute('src'),/ember-echo-niv/);
  assert.equal(await p.locator('.precon-box-colors71 .mana-symbol72').count(),12);
  assert.equal(await p.locator('.mana-symbol72').evaluateAll(async ns=>{await Promise.all(ns.map(n=>n.decode()));return ns.every(n=>n.naturalWidth===100&&n.alt.length>2)}),true);
  assert.equal(await p.locator('.precon-box71').evaluateAll(ns=>ns.every(n=>{const front=n.querySelector('.precon-front71').getBoundingClientRect(),side=n.querySelector('.precon-spine71').getBoundingClientRect(),top=n.querySelector('.precon-lid71').getBoundingClientRect();return Math.abs(front.right-side.left)<1&&Math.abs(front.top-top.bottom)<1&&Math.abs(front.bottom-side.bottom)<1})),true);
  await p.screenshot({path:'work/precons72-menu.png'});await p.locator('#game-modes-close').click();
  const openPack=async()=>{await p.locator('.sealed-pack').click();await p.waitForFunction(()=>!boosterTravel&&!state.boosterSealed&&document.querySelectorAll('.draft-option').length===7)};
  const matches=async()=>{assert.equal(await p.evaluate(()=>state.packs[0].length===7&&state.packs[0].every(preconAllows72)),true);assert.equal(await p.locator('.sealed-pack .mana-symbol72').count(),2);assert.equal(await p.locator('.sealed-pack').getAttribute('data-precon-colors'),await p.evaluate(()=>activePrecon72().colors.join('')));};
  for(const id of await p.evaluate(()=>PRECONS71.map(d=>d.id))){
   await p.evaluate(id=>{state.screen='end-screen';startPrecon71(id,true);state.coins=500;window.preconBattle72=state.battle;beginBoosterInterruption27('tutor',()=>{})},id);
   await matches();if(id==='ember-echo')await p.screenshot({path:'work/precons72-tutor.png'});await openPack();assert.equal(await p.evaluate(()=>state.packs[0].every(preconAllows72)),true);await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();assert.equal(await p.evaluate(()=>state.battle===preconBattle72&&state.screen==='combat-screen'),true);
   await p.evaluate(()=>{state.battle.enemyCreatures=[];winBattle()});await p.waitForFunction(()=>state.screen==='draft-screen');await matches();await openPack();await p.locator('#pack-reroll').click();await p.waitForFunction(()=>!boosterTravel);assert.equal(await p.evaluate(()=>state.packs[0].every(preconAllows72)),true);await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();await p.waitForFunction(()=>state.screen==='shop-screen');
   assert.equal(await p.locator('[data-select-pack]').count(),2);assert.equal(await p.locator('.shop-pack-emblem .mana-symbol72').count(),4);
   assert.equal(await p.evaluate(()=>state.shop.packs.every(o=>buildShopPack(o.type)?.every(preconAllows72))),true);
   await p.locator('[data-select-pack]').first().click();await p.locator('#shop-pack-confirm').click();await p.waitForFunction(()=>state.boosterInterruption?.kind==='shop');await matches();await openPack();assert.equal(await p.evaluate(()=>state.packs[0].every(preconAllows72)),true);await p.locator('#draft-confirm').click();assert.equal(await p.evaluate(()=>state.deck.length),33);
  }
  // Niv's actual UI pays a tap, draws, then opens a distinct targeted trigger.
  await p.evaluate(()=>{state.screen='end-screen';startPrecon71('ember-echo',true);const b=state.battle;b.hand=[BUNDLED_CARDS.find(c=>c.name==='Niv-Mizzet, the Firemind')];b.enemyCreatures.forEach(e=>{e.counterspell=false;e.ward=0;e.hexproof=false;e.card={...e.card,oracle_text:'',keywords:[]}});b.floatingMana=6;syncMana(b);playCard(0,'player');window.niv72=b.creatures[0];niv72.summonedTurn=0;window.life72=b.enemyCreatures[0].health;window.hand72=b.hand.length;renderBattle();openCreatureAbility66(niv72.id)});
  assert.match(await p.locator('#creature-ability-cost').innerText(),/draw one card/);assert.equal(await p.locator('#creature-ability-confirm').innerText(),'TAP & DRAW →');await p.locator('#creature-ability-confirm').click();await p.waitForFunction(()=>document.querySelector('#jester-choice-dialog').open);assert.equal(await p.evaluate(()=>niv72.tapped&&state.battle.hand.length===hand72+1),true);assert.match(await p.locator('#jester-choice-title').innerText(),/Niv-Mizzet/);await p.locator('[data-jester-pick65="0"]').click();await p.locator('#jester-choice-confirm').click();assert.equal(await p.evaluate(()=>state.battle.enemyCreatures[0].health),await p.evaluate(()=>life72-1));
  // Standard PLAY restores unrestricted card/land choices and the normal wrapper.
  await p.evaluate(()=>{endRun(false);showScreen('start-screen')});await p.locator('#start-button').click();await p.waitForFunction(()=>state.screen==='draft-screen');
  assert.equal(await p.evaluate(()=>state.runMode71),'draft');assert.equal(await p.evaluate(()=>state.pool.length),174);assert.equal(await p.evaluate(()=>state.landPool.length),5);assert.equal(await p.locator('.sealed-pack').getAttribute('data-precon-colors'),null);assert.equal(await p.evaluate(()=>chooseRandomCards([BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')],1)[0].name),'Grizzly Bears');assert.equal(await p.evaluate(()=>state.packs.length),6);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS coherent box corners; Niv Scryfall cover; 12 real MagicEditor mana glyphs; all six precons: seven on-color Tutor/reward/reroll/shop cards, two purchasable pack types, themed covers, resume/purchase; Niv tap/draw/damage UI; standard PLAY restores all colors with no stale pack theme; no page errors or missing assets.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
