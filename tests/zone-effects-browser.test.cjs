const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 await page.evaluate(()=>{state.soundOn=false;state.deck=Array.from({length:35},()=>BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));beginBattle(1)});
 await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-draw').length===7);
 assert.equal(await page.evaluate(()=>state.battle.hand.length),7);assert.equal(await page.evaluate(()=>state.battle.deck.length),28);
 assert.equal(await page.locator('.zone-arriving').count(),7);
 const travel=await page.locator('.zone-flight-draw').first().evaluate(e=>{const a=e.getAnimations()[0];return a.effect.getKeyframes().map(f=>f.transform)});assert.notEqual(travel[0],travel.at(-1));
 assert.equal(await page.locator('.zone-flight-back img').first().getAttribute('src'),'assets/mtg-card-back.jpg');
 await page.waitForFunction(()=>!document.querySelector('.zone-flight,.zone-arriving'));
 await page.click('#mulligan-button');
 await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-draw').length===7);
 await page.waitForFunction(()=>!document.querySelector('.zone-flight,.zone-arriving'));
 // Drawing duplicate references still produces one flight per real draw.
 await page.evaluate(()=>{drawOneCard();drawOneCard();renderBattle()});
 await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-draw').length===2);
 assert.equal(await page.evaluate(()=>state.battle.hand.length),9);
 await page.waitForFunction(()=>!document.querySelector('.zone-flight'));
 // A normal spell both draws cards and physically goes from hand to graveyard.
 await page.evaluate(()=>{state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Divination')];state.battle.floatingMana=30;syncMana(state.battle);renderBattle()});
 await page.click('[data-hand-index="0"]');
 await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-draw').length===2&&document.querySelectorAll('.zone-flight-graveyard').length===1);
 assert.equal(await page.evaluate(()=>state.battle.graveyard.at(-1).name),'Divination');
 await page.waitForFunction(()=>!document.querySelector('.zone-flight,.zone-arriving'));
 // Discard costs animate from hand even when the newly drawn copies share an object.
 await page.evaluate(()=>{state.battle.hand=['Thrill of Possibility','Grizzly Bears'].map(n=>BUNDLED_CARDS.find(c=>c.name===n));state.battle.floatingMana=30;syncMana(state.battle);renderBattle();playCard(0)});
 await page.locator('[data-rule-pick]').first().click();await page.click('#rule-confirm');
 await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-graveyard').length===2&&document.querySelectorAll('.zone-flight-draw').length===2);
 await page.waitForFunction(()=>!document.querySelector('.zone-flight,.zone-arriving'));
 // Creature death uses the old battlefield position, not the library.
 await page.evaluate(()=>{state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')];state.battle.floatingMana=30;syncMana(state.battle);renderBattle();playCard(0,'player')});
 const board=await page.locator('.player-card-frame').first().boundingBox();
 await page.evaluate(()=>{const b=state.battle;b.creatures[0].damage=100;b.creatures=removeDeadCreatures(b.creatures,'player');renderBattle()});
 await page.waitForFunction(()=>document.querySelector('.zone-flight-graveyard'));
 const source=await page.locator('.zone-flight-graveyard').first().evaluate(e=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top)}));assert.ok(Math.abs(source.x-board.x)<2&&Math.abs(source.y-board.y)<2);
 await page.waitForFunction(()=>!document.querySelector('.zone-flight'));
 // Mill goes from library to graveyard, even if an identical card is in hand.
 await page.evaluate(()=>{millLibrary27(2);renderBattle()});await page.waitForFunction(()=>document.querySelectorAll('.zone-flight-graveyard').length===2);
 await page.waitForFunction(()=>!document.querySelector('.zone-flight'));
 // Real combat damage triggers feedback and advances the game immediately.
 const life=await page.evaluate(()=>state.playerHealth);
 await page.evaluate(()=>{const b=state.battle;b.creatures=[];b.enemyCreatures=[{...b.enemyCreatures[0],pattern:null,summoningSick:false,power:3,lifelink:false,summonedTurn:0,health:50,maxHealth:50}];b.turn=2;b.phase='damage';b.blockAssignments.clear();resolveEnemyCombat()});
 assert.equal(await page.evaluate(()=>state.playerHealth),life-3);
 assert.equal(await page.locator('.player-hit-number').textContent(),'−3');assert.ok(await page.locator('#player-avatar').evaluate(e=>e.classList.contains('avatar-hit-active')));
 assert.equal(await page.evaluate(()=>state.battle.phase),'main');
 await page.waitForFunction(()=>!document.querySelector('.player-hit-number,.zone-flight'));
 // Self-targeted spells use the same hit effect.
 await page.evaluate(()=>{state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Shock')];state.battle.floatingMana=20;syncMana(state.battle);renderBattle();playCard(0)});
 await page.click('[data-rule-pick="life:player"]');await page.click('#rule-confirm');
 assert.equal(await page.locator('.player-hit-number').textContent(),'−2');
 await page.waitForFunction(()=>!document.querySelector('.zone-flight,.player-hit-number'));
 // Scene changes and reduced motion cannot leave ghosts or invisible cards.
 await page.evaluate(()=>{drawOneCard();renderBattle()});await page.waitForFunction(()=>document.querySelector('.zone-flight-draw'));
 await page.evaluate(()=>{state.node=2;showJourney()});await page.waitForFunction(()=>!document.querySelector('.zone-flight,.zone-arriving'));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{showScreen('combat-screen');drawOneCard();renderBattle()});await page.waitForTimeout(100);
 assert.equal(await page.locator('.zone-flight,.zone-arriving').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS opening deal, duplicate draws, spell/creature/mill graveyard flights, combat/self damage, interruption cleanup and reduced motion');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
