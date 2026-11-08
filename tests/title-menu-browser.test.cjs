const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 assert.deepEqual(await page.locator('.title-menu button').allTextContents(),['PLAY ›','OPTIONS','QUIT','COLLECTIONS']);
 assert.equal(await page.locator('#fullscreen-button').isVisible(),false);
 assert.equal(await page.locator('#music-settings').isVisible(),true);
 await page.waitForFunction(()=>document.querySelectorAll('.hero-card.is-revealed').length===3);
 assert.equal(await page.locator('.title-card-back img').count(),3);
 assert.ok(await page.locator('.title-card-back img').first().evaluate(e=>e.complete&&e.naturalWidth>0));
 const before=await page.locator('#title-atmosphere').evaluate(c=>c.toDataURL());
 await page.waitForTimeout(150);
 assert.notEqual(await page.locator('#title-atmosphere').evaluate(c=>c.toDataURL()),before);
 await page.waitForTimeout(1600);
 await page.hover('.hero-card:nth-child(2)');
 await page.waitForFunction(()=>document.querySelectorAll('.hero-card.is-peeking').length>0);
 await page.mouse.move(100,100);
 await page.click('#title-options');
 await page.click('[data-avatar-choice="ranger"]');
 assert.equal(await page.evaluate(()=>state.selectedAvatar),'ranger');
 await page.click('#title-audio');assert.equal(await page.locator('#music-dialog').evaluate(e=>e.open),true);
 await page.click('#music-close');assert.equal(await page.locator('#title-options-dialog').evaluate(e=>e.open),true);
 await page.click('#title-controls');assert.equal(await page.locator('#controller-dialog').evaluate(e=>e.open),true);
 await page.click('#controller-close');await page.click('#title-options-close');
 await page.click('#title-quit');assert.equal(await page.evaluate(()=>state.soundOn),false);
 assert.equal(await page.locator('#background-music').evaluate(a=>a.paused),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>state.soundOn),true);
 await page.click('#sound-toggle');
 await page.click('#title-quit');await page.click('#title-return');assert.equal(await page.evaluate(()=>state.soundOn),false,'Quit preserves an existing mute');
 await page.click('#card-catalog-button');assert.equal(await page.locator('#collection-dialog').evaluate(e=>e.open),true);
 await page.keyboard.press('Escape');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);
 const still=await page.locator('#title-atmosphere').evaluate(c=>c.toDataURL());
 await page.waitForTimeout(120);assert.equal(await page.locator('#title-atmosphere').evaluate(c=>c.toDataURL()),still);
 assert.equal(await page.locator('.hero-card').first().evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 await page.route('https://api.scryfall.com/**',r=>r.abort());
 await page.click('#start-button');
 await page.waitForFunction(()=>document.getElementById('draft-screen').classList.contains('active'));
 assert.equal(await page.locator('#game-shell').evaluate(e=>e.classList.contains('title-menu-active')),false);
 assert.equal(await page.locator('#fullscreen-button').isVisible(),true);
 await page.evaluate(()=>showScreen('start-screen'));await page.waitForTimeout(100);
 assert.equal(await page.locator('#game-shell').evaluate(e=>e.classList.contains('title-menu-active')),true);
 for(const viewport of [{width:1280,height:720},{width:820,height:1180}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  assert.equal(await page.locator('#start-button').isVisible(),true);
 }
 assert.deepEqual(errors,[]);console.log('PASS title menu, intro, real MTG back, hover flip, options/avatar/audio/controller, quit/mute, collection, reduced motion and play transition');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
