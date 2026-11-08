const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 await page.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.deck=[...Array.from({length:25},()=>BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')),...generateStarterManaCards(4)];state.stageLocations=[LAND_STAGES[1],LAND_STAGES[2],LAND_STAGES[4],LAND_STAGES[0]];beginBattle(1)});
 assert.equal(await page.locator('#enemy-name').textContent(),'Arid Mesa');assert.equal(await page.locator('#location-name').count(),0);
 assert.equal(await page.locator('.arena-table').getAttribute('data-scene'),'dunes');
 assert.equal(await page.locator('.monster').first().evaluate(e=>getComputedStyle(e).cursor),'pointer');
 await page.evaluate(()=>{state.battle.selectedEnemyTargetId=state.battle.enemyCreatures[0].id;renderBattle()});
 assert.equal(await page.locator('.monster.selected').first().evaluate(e=>getComputedStyle(e,'::after').content),'none');
 const first=await page.locator('.arena-table').evaluate(e=>getComputedStyle(e).backgroundImage);
 await page.evaluate(()=>renderBattle());assert.equal(await page.locator('#enemy-name').textContent(),'Arid Mesa','Land stays fixed during a battle');
 await page.click('#options-button');
 for(const selector of ['#fullscreen-button','#controller-help-button','.options-credits a'])assert.equal(await page.locator(selector).first().isVisible(),true);
 assert.equal(await page.locator('.site-footer a').count(),0);
 await page.click('#controller-help-button');assert.equal(await page.locator('#controller-dialog').evaluate(e=>e.open),true);await page.click('#controller-close');await page.click('#title-options-close');
 assert.equal(await page.locator('#fullscreen-button').isVisible(),false);
 await page.click('#deck-button');assert.equal(await page.locator('#collection-dialog').evaluate(e=>e.open),true);await page.click('#collection-close');
 await page.click('#library-button');assert.equal(await page.locator('#collection-dialog').evaluate(e=>e.open),true);await page.click('#collection-close');
 const sound=await page.locator('#sound-toggle').evaluate(e=>({height:e.getBoundingClientRect().height,border:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize}));
 const music=await page.locator('#music-settings').evaluate(e=>({height:e.getBoundingClientRect().height,border:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontSize}));assert.deepEqual(sound,music);
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:820,height:1180}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  assert.ok(await page.locator('.mana-display').evaluate(e=>getComputedStyle(e).borderTopWidth==='0px'));
  const m=await page.locator('.mana-display').boundingBox(),l=await page.locator('.mana-land').first().boundingBox();assert.ok(m.x+m.width<l.x,'Mana total precedes its lands');
  const d=await page.locator('#deck-button').boundingBox(),h=await page.locator('.library-zone-heading .library-label').boundingBox();assert.ok(Math.abs(d.y-h.y)<15&&d.x>h.x,'Deck is next to Library');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
 }
 await page.evaluate(()=>beginBattle(2));assert.equal(await page.locator('#enemy-name').textContent(),'Temple Garden');assert.equal(await page.locator('.arena-table').getAttribute('data-scene'),'forest');assert.notEqual(await page.locator('.arena-table').evaluate(e=>getComputedStyle(e).backgroundImage),first);
 await page.evaluate(()=>showJourney());assert.deepEqual(await page.locator('.path-node b').allTextContents(),['Arid Mesa','Temple Garden','Breeding Pool','Glacial Fortress']);
 assert.deepEqual(errors,[]);console.log('PASS options, credits, deck/library access, shared audio style, mana placement, stable MTG lands and matching scene colours across viewports');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
