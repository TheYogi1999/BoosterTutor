const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.route('https://api.scryfall.com/**',route=>route.abort());
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>typeof PRECONS71!=='undefined');
  await p.evaluate(()=>{state.soundOn=false;window.runAudio71=0;window.playRunStartAudio=()=>runAudio71++;window.scenes71=[];const original=showScreen;showScreen=function(id){scenes71.push(id);return original(id)}});
  assert.deepEqual(await p.locator('.title-menu button').allTextContents(),['PLAY','GAME MODES','OPTIONS','QUIT','COLLECTIONS']);
  assert.equal(await p.locator('.brand-version').innerText(),'v0.72');
  const onTitle=async()=>p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());showScreen('start-screen')});
  const open=async()=>{await p.locator('#title-game-modes').click();await p.waitForFunction(()=>document.querySelector('#game-modes-dialog').open)};
  const fits=async()=>p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  const noPageScroll=async()=>assert.equal(await p.evaluate(()=>scrollY===0&&document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
  await open();assert.equal(await p.locator('[data-precon-deck]').count(),6);assert.equal(await p.locator('#precon-begin').isDisabled(),true);
  assert.equal(await p.locator('.precon-front71>img').evaluateAll(async nodes=>{await Promise.all(nodes.map(n=>n.decode()));return nodes.every(n=>n.naturalWidth>=300)}),true);
  // Merely browsing or inspecting cannot reset resources or begin a run.
  const before=await p.evaluate(()=>({run:state.finishRun59,life:state.playerHealth,deck:state.deck.length,level:state.level}));
  await p.locator('[data-precon-deck="ember-echo"]').hover();assert.equal(await p.locator('[data-precon-deck][aria-pressed="true"]').count(),0);
  await p.locator('[data-precon-deck="ember-echo"]').click();assert.equal(await p.locator('[data-precon-deck][aria-pressed="true"]').count(),1);assert.match(await p.locator('#precon-details').innerText(),/Blue \/ Red/);
  await p.locator('[data-precon-card="Doublecast"]').click();assert.equal(await p.locator('#precon-card-dialog').evaluate(d=>d.open),true);assert.match(await p.locator('.precon-inspect-rules71').innerText(),/copy|copies/i);await p.keyboard.press('Escape');assert.equal(await p.locator('#game-modes-dialog').evaluate(d=>d.open),true);
  await p.locator('#game-modes-dialog').focus();await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>runAudio71),0);assert.equal(await p.locator('#game-modes-dialog').evaluate(d=>d.open),true);
  await p.locator('#game-modes-close').click();assert.deepEqual(await p.evaluate(()=>({run:state.finishRun59,life:state.playerHealth,deck:state.deck.length,level:state.level})),before);
  // Six boxes and both windows fit the same fixed scene on wide and portrait displays.
  for(const viewport of [{width:1600,height:900},{width:1920,height:1080},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await p.setViewportSize(viewport);await fits();await open();await p.locator('[data-precon-deck="skyward-watch"]').click();
   const bounds=await p.locator('#game-modes-dialog,.precon-choice71,#precon-begin').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}));assert.equal(bounds.every(Boolean),true);
   assert.equal(await p.locator('.precon-front71').evaluateAll(nodes=>nodes.every(n=>{const a=n.getBoundingClientRect(),b=n.closest('button').getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1})),true);
   await p.evaluate(()=>{controller.enable();controller.focus(document.querySelector('[data-precon-card="Plains"]'))});
   assert.equal(await p.locator('.precon-list71').evaluate(el=>el.scrollTop>0),true);
   await p.evaluate(()=>controller.activate());assert.equal(await p.locator('#precon-card-dialog').evaluate(d=>d.open),true);const r=await p.locator('#precon-card-dialog').boundingBox();assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1);
   await p.evaluate(()=>{controller.back();controller.back();controller.release()});assert.equal(await p.locator('#game-modes-dialog').evaluate(d=>d.open),false);await noPageScroll();
  }
  await p.setViewportSize({width:1600,height:900});await fits();await open();await p.locator('[data-precon-deck="ember-echo"]').click();await p.screenshot({path:'work/precons71-final-menu.png'});await p.locator('#game-modes-close').click();
  await p.evaluate(()=>{window.originalStarter71=makeStarterPacks;makeStarterPacks=()=>{throw Error('Precons must not create opening packs')}});
  const ids=await p.evaluate(()=>PRECONS71.map(d=>d.id));
  for(const id of ids){
   await onTitle();await open();await p.locator(`[data-precon-deck="${id}"]`).click();await p.evaluate(()=>{scenes71=[]});if(id==='ember-echo')await p.evaluate(()=>{controller.enable();controller.focus(document.getElementById('precon-begin'));controller.activate()});else await p.locator('#precon-begin').click();
   assert.deepEqual(await p.evaluate(()=>scenes71),['combat-screen']);assert.equal(await p.evaluate(()=>state.preconId71),id);assert.equal(await p.evaluate(()=>state.runMode71),'precon');
   assert.deepEqual(await p.evaluate(()=>[state.deck.length,state.battle.hand.length,state.battle.lands.length,state.battle.deck.length,state.packs.length,state.playerHealth,state.coins,state.level,state.campTokens.length]),[24,7,2,15,0,20,0,1,0]);
   assert.equal(await p.evaluate(()=>state.deck.filter(c=>c.name==='Booster Tutor').length),1);assert.equal(await p.evaluate(()=>new Set(state.deck.map(c=>c.runCardId60)).size),24);assert.equal(await p.evaluate(()=>state.deck.some(isFoilCard59)),false);assert.equal(await p.evaluate(()=>state.battle.phase),'main');
   assert.equal(await p.locator('#library-total').innerText(),'24');assert.equal(await p.locator('#library-count').innerText(),'15');await p.locator('#deck-button').click();assert.match(await p.locator('#collection-stats').innerText(),/24 cards/);await p.locator('#collection-close').click();
   await p.evaluate(()=>{window.oldRun71=state.finishRun59;window.oldCards71=state.deck;state.deck.find(c=>isCreature(c)).runCounters60.push('stats');endRun(false)});await p.locator('#restart-button').click();
   assert.equal(await p.evaluate(()=>state.preconId71),id);assert.equal(await p.evaluate(()=>state.finishRun59),await p.evaluate(()=>oldRun71+1));assert.equal(await p.evaluate(()=>state.deck.some(c=>oldCards71.includes(c)||c.runCounters60.length)),false);
  }
  assert.equal(await p.evaluate(()=>runAudio71),12);
  // Booster Tutor still interrupts the fight and returns one card, without growing the run deck.
  await p.evaluate(()=>{const b=state.battle,t=b.deck.find(c=>c.name==='Booster Tutor');if(t){b.deck=b.deck.filter(c=>c!==t);b.hand.push(t)}b.enemyCreatures.forEach(e=>e.counterspell=false);window.tutorBattle71=b;renderBattle()});
  const tutor=await p.evaluate(()=>state.battle.hand.findIndex(c=>c.name==='Booster Tutor'));await p.locator(`[data-hand-index="${tutor}"]`).click();await p.waitForFunction(()=>state.screen==='draft-screen'&&state.boosterInterruption?.kind==='tutor');await p.locator('.sealed-pack').click();await p.waitForFunction(()=>!boosterTravel&&!state.boosterSealed&&document.querySelectorAll('.draft-option').length===7);await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();
  assert.equal(await p.evaluate(()=>state.screen),'combat-screen');assert.equal(await p.evaluate(()=>state.battle===tutorBattle71),true);assert.equal(await p.evaluate(()=>state.deck.length),24);
  // Prepared runs keep the ordinary reward -> shop -> camp -> next battle loop.
  await p.evaluate(()=>{for(const e of [...state.battle.enemyCreatures])damageFirstEnemy(10000,e);winBattle()});await p.waitForFunction(()=>state.screen==='draft-screen');assert.equal(await p.evaluate(()=>state.draftKind),'reward');assert.equal(await p.evaluate(()=>state.packs.length),1);
  await p.locator('.sealed-pack').click();await p.waitForFunction(()=>!boosterTravel&&!state.boosterSealed);await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();assert.equal(await p.evaluate(()=>state.screen),'shop-screen');assert.equal(await p.evaluate(()=>state.deck.length),26);
  await p.locator('#shop-continue').click();await p.locator('[data-camp-token="food"]').click();assert.equal(await p.evaluate(()=>state.node),2);assert.equal(await p.evaluate(()=>state.deck.length),26);assert.equal(await p.evaluate(()=>state.preconId71),'skyward-watch');
  // PLAY continues to use the six-pack draft rather than the selected precon.
  await p.evaluate(()=>{makeStarterPacks=originalStarter71;endRun(false)});await p.locator('#back-link').click();await p.locator('#start-button').click();await p.waitForFunction(()=>state.screen==='draft-screen');
  assert.equal(await p.evaluate(()=>state.runMode71),'draft');assert.equal(await p.evaluate(()=>state.preconId71),null);assert.equal(await p.evaluate(()=>state.packs.length),6);assert.equal(await p.evaluate(()=>state.deck.length),0);
  assert.deepEqual(errors,[]);console.log('PASS title GAME MODES order; six real Scryfall box artworks; nonmutating preview/cancel and modal Enter safety; five fitted viewports, full boxes, scrolling card list and nested details/controller Back; all six exact 24-card immediate combat starts, seven-card hands/two physical lands, no opening packs/camp, clean same-precon restart; Booster Tutor pause/resume; reward-shop-camp progression; original six-pack PLAY.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
