const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 assert.equal(await page.locator('.title-card-back img').count(),3);assert.equal(await page.locator('.title-reveal-shine').count(),3);
 // Menu actions work during the entrance rather than waiting for a cutscene.
 await page.locator('#title-options').click({force:true});assert.equal(await page.locator('#title-options-dialog').evaluate(el=>el.open),true);await page.keyboard.press('Escape');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 const paused=await page.locator('#title-atmosphere').evaluate(el=>el.toDataURL());await page.waitForTimeout(180);assert.equal(await page.locator('#title-atmosphere').evaluate(el=>el.toDataURL()),paused);
 assert.equal(await page.locator('.hero-card').first().evaluate(el=>el.getAnimations().some(a=>a.playState==='running')),false);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});await page.waitForTimeout(220);assert.notEqual(await page.locator('#title-atmosphere').evaluate(el=>el.toDataURL()),paused);
 await page.waitForFunction(()=>document.querySelector('#start-screen').dataset.titlePhase==='ready');
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(60);
  const bounds=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1,rects:[...document.querySelectorAll('.title-menu button,.hero-card,#game-title,#music-settings,#sound-toggle')].map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}})}));
  assert.equal(bounds.scroll,false);for(const r of bounds.rects)assert.ok(r.left>=-1&&r.right<=viewport.width+1&&r.top>=-1&&r.bottom<=viewport.height+1,JSON.stringify({viewport,r}));
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('.hero-card.is-revealed').count(),3);const still=await page.locator('#title-atmosphere').evaluate(el=>el.toDataURL());await page.waitForTimeout(160);assert.equal(await page.locator('#title-atmosphere').evaluate(el=>el.toDataURL()),still);assert.equal(await page.locator('.hero-card-stack').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 // Leaving in the middle cancels the entrance; returning starts it afresh.
 await page.setViewportSize({width:1600,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.soundOn=false});await page.locator('#start-button').click({force:true});await page.waitForFunction(()=>state.screen==='draft-screen');
 assert.equal(await page.locator('#title-atmosphere').evaluate(el=>el.getContext('2d').getImageData(0,0,el.width,el.height).data.every(value=>value===0)),true);
 await page.evaluate(()=>showScreen('start-screen'));await page.waitForFunction(()=>document.querySelector('#start-screen').dataset.titlePhase==='opening');await page.waitForFunction(()=>document.querySelectorAll('.hero-card.is-revealed').length===3);
 assert.deepEqual(errors,[]);console.log('PASS menu actions during entrance, real MTG backs, hidden-tab pause/resume, four bounded layouts, reduced motion, early Play cleanup and title re-entry.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
