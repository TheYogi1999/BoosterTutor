// Run against a local static server: BOOSTERTUTOR_URL=http://127.0.0.1:8000 node tests/browser.test.cjs
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
require('node:fs').mkdirSync('work',{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];const missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))missing.push(r.url())});
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
 await page.locator('#start-button').click();await page.locator('.sealed-pack').click();await page.waitForTimeout(1400);
 assert.equal(await page.locator('.draft-option').count(),7);
 assert.ok(await page.locator('#booster-audio').evaluate(audio=>audio.duration>2 && audio.currentTime>0 && !audio.paused),'opening uses the real stereo audio asset');
 await page.locator('#sound-toggle').click();
 assert.ok(await page.locator('#booster-audio').evaluate(audio=>audio.paused&&audio.currentTime===0),'mute immediately stops the pack sound');
 const before=await page.locator('.draft-option img').evaluateAll(images=>images.map(i=>i.getAttribute('src')));
 await page.locator('.draft-option').first().click();await page.locator('#pack-reroll').click();await page.waitForTimeout(1400);
 assert.equal(await page.locator('.draft-option').count(),7);assert.equal(await page.locator('.draft-option.selected').count(),0);assert.equal(await page.locator('#pack-reroll').isDisabled(),true);
 const after=await page.locator('.draft-option img').evaluateAll(images=>images.map(i=>i.getAttribute('src')));assert.ok(after.every(src=>!before.includes(src)));
 assert.ok(await page.locator('.draft-option img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
 await page.evaluate(()=>{
  state.soundOn=false;state.pool=BUNDLED_CARDS;state.relic='crystal';state.deck=Array.from({length:24},(_,i)=>BUNDLED_CARDS[i%BUNDLED_CARDS.length]);beginBattle(1);
  state.battle.hand=['Grizzly Bears','Holy Strength','Bonesplitter','Lightning Bolt','Divination','Short Sword','Savannah Lions'].map(name=>BUNDLED_CARDS.find(c=>c.name===name));state.battle.mana=6;state.battle.maxMana=6;renderBattle();
 });
 await page.waitForTimeout(350);
 const hand=()=>page.locator('[data-hand-index="0"]');
 await hand().hover();await page.waitForTimeout(250);
 assert.equal(await page.locator('#card-preview').isVisible(),true);
 const bubble=await page.locator('#card-preview').boundingBox();const card=await hand().boundingBox();assert.ok(bubble.y+bubble.height<=card.y+2,'hand bubble must sit above its card');
 await page.screenshot({path:'work/hand-hover09.png'});
 await hand().dragTo(page.locator('#creature-row'));
 assert.equal(await page.locator('.creature-token').count(),1,'native hand drag must cast a creature');
 assert.equal(await page.evaluate(()=>state.battle.mana),4);
 await hand().dragTo(page.locator('.creature-token'));
 assert.equal(await page.locator('.permanent-card').count(),1,'aura drops must attach');
 await hand().dragTo(page.locator('.creature-token'));
 assert.equal(await page.locator('.permanent-card').count(),2,'equipment drops must cast and attach');
 assert.equal(await page.locator('.creature-group .attached-permanent').count(),2,'attached cards sit with their host');
 assert.equal(await page.locator('#permanent-row .permanent-card').count(),0,'attached cards leave the free permanent zone');
 assert.equal(await page.evaluate(()=>state.battle.creatures[0].power),5);assert.equal(await page.evaluate(()=>state.battle.creatures[0].toughness),4);
 await hand().dragTo(page.locator('.monster').first());
 assert.equal(await page.evaluate(()=>state.battle.enemyCreatures[0].health),10,'spell drag must hit the selected monster');
 await page.locator('.creature-token').hover();await page.waitForTimeout(100);
 assert.equal(await page.locator('#inspector-content .inspector-card img').count(),1);
 assert.ok(await page.locator('#inspector-content').innerText().then(t=>t.includes('Grizzly Bears')&&t.includes('5/4')));
 await page.mouse.move(30,95);await page.screenshot({path:'work/combat-played09.png'});
 await page.locator('#end-turn-button').click();
 assert.equal(await page.evaluate(()=>state.battle.phase),'attack');
 assert.equal(await page.locator('#end-turn-button').isDisabled(),true);
 assert.equal(await page.locator('#phase-strip [aria-current="step"]').getAttribute('data-phase'),'attack');
 await page.waitForFunction(()=>state.battle.phase==='blocks');
 await page.locator('.creature-token').dragTo(page.locator('.monster').first());
 assert.equal(await page.evaluate(()=>state.battle.blockAssignments.size),1,'native creature drag must assign a blocker');
 await page.waitForFunction(()=>document.querySelectorAll('[data-arrow-kind="block"]').length===1);
 assert.equal(await page.locator('[data-arrow-kind="block"]').getAttribute('data-to-id'),await page.evaluate(()=>state.battle.creatures[0].id));
 await page.screenshot({path:'work/blocking09.png'});
 await page.locator('#end-turn-button').click();
 assert.equal(await page.evaluate(()=>state.battle.phase),'damage');
 await page.waitForFunction(()=>state.battle.turn===2);
 assert.equal(await page.evaluate(()=>state.battle.turn),2);assert.equal(await page.evaluate(()=>state.playerHealth),30);assert.equal(await page.locator('.hand-card').count(),7);
 await page.waitForFunction(()=>document.querySelectorAll('[data-arrow-kind="ally"]').length===1);
 const lionIndex=await page.evaluate(()=>state.battle.hand.findIndex(card=>card.name==='Savannah Lions'));
 assert.ok(lionIndex>=0);
 await page.locator(`[data-hand-index="${lionIndex}"]`).dragTo(page.locator('#creature-row'));
 const blade=page.locator('.attached-permanent').filter({has:page.locator('img[alt="Bonesplitter"]')});
 await blade.dragTo(page.locator('.creature-token').nth(1));
 assert.equal(await page.locator('.creature-group').nth(0).locator('.attached-permanent').count(),1);
 assert.equal(await page.locator('.creature-group').nth(1).locator('.attached-permanent').count(),1);
 assert.equal(await page.evaluate(()=>state.battle.creatures[0].power),3);
 assert.equal(await page.evaluate(()=>state.battle.creatures[1].power),4);
 for(const [width,height] of [[1280,720],[1920,1080]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const positions=await page.locator('#player-drop-zone,#enemy-drop-zone,.hand-panel,.card-inspector,#end-turn-button').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
  assert.ok(positions[0].x<positions[1].x,'player stays left of monsters');
  for(const r of positions){assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,'all primary zones fit the viewport')}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('Browser checks passed: seven-card pack, reroll, real card images, anchored hand bubble, large inspector, native creature/aura/equipment/spell/blocker drags, attached card grouping, phase transitions, route arrows, real pack audio/muting, turn refill, 1280×720 and 1920×1080 layout.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
