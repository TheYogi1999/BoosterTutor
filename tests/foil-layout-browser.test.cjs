const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
 await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;Math.random=()=>.01;resetRunProgress59();window.card59=name=>{const card=runCard59(BUNDLED_CARDS.find(c=>c.name===name));if(isCreature(card))card.runCounters60=['stats'];return card};state.deck=[...Array.from({length:50},()=>card59('Grizzly Bears')),...generateStarterManaCards(4)];beginBattle(1);const b=state.battle;b.hand=Array.from({length:15},()=>card59('Grizzly Bears'));b.floatingMana=50;b.enemyCreatures.forEach(e=>{e.counterspell=false;e.ward=0;e.hexproof=false});b.permanents=[{id:'ring',card:card59('Sol Ring'),attachedTo:null},{id:'sword',card:card59('Short Sword'),attachedTo:'bear'}];const card=card59('Grizzly Bears');b.creatures=[{id:'bear',card,owner:'player',...parseStats(card),...creatureKeywords(card),summonedTurn:0,summoningSick:false,tapped:false,willAttack:false}];b.graveyard=[card59('Black Lotus'),card59('Shock')];renderBattle()});
 const fitted=async(selector)=>{
  const checks=await p.locator(selector).evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {tag:el.className,top:r.top,left:r.left,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight}}));
  for(const r of checks)assert.ok(r.top>=-1&&r.left>=-1&&r.bottom<=r.h+1&&r.right<=r.w+1,JSON.stringify(r));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),await p.evaluate(()=>innerHeight));
 };
 const imageBounds=async()=>{const rows=await p.locator('.screen.active .foil-card-face:visible,dialog[open] .foil-card-face:visible').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),i=e.querySelector('img').getBoundingClientRect();return {parent:e.parentElement.className,w:r.width,h:r.height,iw:i.width,ih:i.height}}));for(const r of rows){assert.ok(r.w>0&&r.h>0,JSON.stringify(r));assert.ok(Math.abs(r.w-r.iw)<1&&Math.abs(r.h-r.ih)<1,JSON.stringify(r))}};
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await p.setViewportSize(viewport);
  await p.waitForFunction(()=>{const r=document.querySelector('.game-shell').getBoundingClientRect();return r.width<=innerWidth+1&&r.height<=innerHeight+1});
  await fitted('.arena-table,.hand-card,.player-card-frame,.permanent-card-frame,#run-level,.mana-land,.turn-footer button');await imageBounds();
  await p.locator('#graveyard-open').click();await fitted('#graveyard-dialog');await imageBounds();await p.locator('#graveyard-close').click();
  await p.locator('#deck-button').click();await fitted('#collection-dialog');await imageBounds();await p.locator('#collection-close').click();
  await p.evaluate(()=>{beginScry(2)});await fitted('#scry-dialog');await imageBounds();await p.locator('#scry-confirm').click();
  await p.evaluate(()=>{beginLibraryOrder27(2,()=>{})});await fitted('#library-order-dialog');await imageBounds();await p.locator('[data-library-pick="0"]').click();await p.locator('[data-library-pick="1"]').click();await p.locator('#library-order-confirm').click();
  await p.evaluate(()=>{state.battle.hand=[card59('Giant Growth')];renderBattle();playCard(0)});await fitted('#rule-dialog');await imageBounds();await p.locator('#rule-cancel').click();
  // Foil survives grabbing and is included in the landing animation clone.
  await p.evaluate(()=>{state.battle.hand=Array.from({length:15},()=>card59('Grizzly Bears'));renderBattle()});
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.emulateMedia({reducedMotion:'no-preference'});
 await p.locator('[data-hand-index="14"]').hover();await p.waitForTimeout(200);
 const start=await p.locator('[data-hand-index="14"]').boundingBox();await p.mouse.move(start.x+start.width/2,start.y+start.height/2);await p.mouse.down();await p.mouse.move(450,430,{steps:8});assert.equal(await p.locator('#drag-ghost .foil-card-face').count(),1);await p.mouse.up();await p.waitForTimeout(350);
 await p.evaluate(()=>{for(const e of state.battle.enemyCreatures)e.health=e.maxHealth=100;state.battle.hand=[card59('Shock')];renderBattle();hideCardPreview()});
 await p.screenshot({path:'work/progression59-foil-field.png'});
 await p.evaluate(()=>{showScreen('start-screen')});await p.waitForTimeout(3200);await fitted('#highest-level,#start-button,#card-catalog-button');await p.screenshot({path:'work/progression59-title.png'});
 assert.deepEqual(errors,[]);console.log('PASS foil image bounds and four fitted viewports with fifteen-card hand, artifacts/attachments/mana, graveyard, collection, scry, library ordering and target dialog; real foil drag ghost and landing; no page scrolling.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
