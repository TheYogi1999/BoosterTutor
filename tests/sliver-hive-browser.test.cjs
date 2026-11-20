const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.bringToFront();
 await p.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.deck=Array.from({length:45},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')));state.deck.push(...generateStarterManaCards(4));beginBattle(3);state.battle.turn=5;state.battle.phase='main';state.battle.creatures=[];state.battle.hand=[];window.setHive91=kinds=>{state.battle.enemyCreatures=kinds.map(k=>createFoe(k,3));state.battle.waves=[state.battle.enemyCreatures];renderBattle()};setHive91(['galesliver','quickcrestsliver','prismaticsliver']);});
 assert.equal(await p.evaluate(()=>Object.keys(FOE_TYPES).length),50);
 const ids=await p.evaluate(()=>Object.fromEntries(state.battle.enemyCreatures.map(u=>[u.kind,u.id])));
 const incoming=p.locator(`[data-enemy-attacker="${ids.galesliver}"] [data-hive-keyword91="haste"] [data-hive-link91="receive"]`);
 assert.equal(await incoming.count(),1);assert.match(await incoming.getAttribute('title'),/Receives Haste from Quickcrest Sliver/);
 assert.match(await p.locator(`[data-enemy-attacker="${ids.quickcrestsliver}"] .hive-roles91 [data-hive-link91="give"]`).getAttribute('title'),/Grants Haste to.*Galecrest Sliver.*Prismatic Sliver/);
 await incoming.hover();assert.equal(await p.locator(`[data-enemy-attacker="${ids.quickcrestsliver}"]`).evaluate(n=>n.classList.contains('hive-source91')),true);assert.equal(await p.locator(`[data-enemy-attacker="${ids.galesliver}"]`).evaluate(n=>n.classList.contains('hive-recipient91')),true);
 assert.equal(await p.evaluate(()=>state.battle.selectedEnemyTargetId||null),null,'Hovering a source marker does not select an attack target');await p.mouse.move(20,20);assert.equal(await p.locator('.hive-source91,.hive-recipient91').count(),0);
 await p.locator(`[data-enemy-attacker="${ids.quickcrestsliver}"]`).click();assert.equal(await p.evaluate(()=>state.battle.selectedEnemyTargetId),ids.quickcrestsliver);
 await p.evaluate(()=>{renderBattle();renderBattle();renderBattle()});assert.equal(await p.locator('.hive-legend91').count(),1);assert.equal(await p.locator('.hive-roles91').count(),3);assert.equal(await p.locator('#enemy-board .enemy-identity90').count(),3);
 await p.evaluate(id=>{const b=state.battle;b.enemyCreatures.find(u=>u.id===id).health=0;b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');renderBattle()},ids.quickcrestsliver);
 assert.equal(await p.locator('[data-hive-keyword91="haste"]').count(),0);assert.equal(await p.locator(`[data-hive-related91~="${ids.quickcrestsliver}"]`).count(),0);assert.equal(await p.evaluate(()=>wardCost(state.battle.enemyCreatures.find(u=>u.kind==='galesliver'))),1);
 const cells=new Set();let pips=0;
 for(const kind of await p.evaluate(()=>Object.keys(FOES91))){
  await p.evaluate(k=>setHive91([k]),kind);
  const info=await p.locator('#enemy-board .monster').evaluate(n=>({image:getComputedStyle(n.querySelector('.walker-portrait')).backgroundImage,cell:getComputedStyle(n.querySelector('.walker-portrait')).backgroundPosition,pips:n.querySelectorAll('.enemy-identity90 .mana-symbol72').length,multi:!!n.querySelector('.is-multicolor91'),native:n.querySelector('.monster-keywords .enemy-keyword-badge').textContent,grant:!!n.querySelector('.monster-keywords .enemy-keyword-badge [data-hive-link91="give"]')}));
  assert.match(info.image,/slivers-v91\.webp/);cells.add(info.cell);pips+=info.pips;assert.equal(info.multi,kind!=='sunbondsliver');assert.equal(info.grant,true,'The native granted ability remains first and visible');
 }
 assert.equal(cells.size,8);assert.equal(pips,15);
 await p.evaluate(()=>setHive91(['quickcrestsliver','sunbondsliver','dawnwatchsliver','thornchargesliver','prismaticsliver','twinbladesliver']));
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  assert.equal(await p.locator('.hive-roles91').evaluateAll(ns=>ns.every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.screenshot({path:'work/hive91-final.png'});
 // Unseen cards get complete molten NEW labels above the face, with no clipping ancestor.
 await p.evaluate(()=>{state.node=2;state.coins=500;state.shop=null;showShop();state.shop.offers=['White Knight','Gods Willing','Green Ward'].map(name=>({card:runCard59(BUNDLED_CARDS.find(c=>c.name===name)),price:10,sold:false}));state.shopDiscoveryView={};seenCardKeys.clear();renderShop()});
 assert.equal(await p.locator('#shop-grid .new-card-badge').count(),3);assert.match(await p.locator('.shopkeeper-portrait87').evaluate(n=>getComputedStyle(n).backgroundImage),/vey-v91\.webp/);
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  assert.equal(await p.locator('#shop-grid .new-card-badge').evaluateAll(ns=>ns.every(n=>{
   const r=n.getBoundingClientRect(),offer=n.closest('.shop-offer').getBoundingClientRect(),face=n.closest('.shop-card-face').getBoundingClientRect();
   if(r.top<offer.top-1||r.left<offer.left-1||r.right>offer.right+1||r.bottom>face.top+1)return false;
   for(let a=n.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))return false;if(/hidden|clip|auto|scroll/.test(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))return false;}
   return r.top>=0&&r.right<=innerWidth+1;
  })),true,'All NEW text is visible above the card with room inside the offer');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.screenshot({path:'work/shop91-final.png'});
 assert.deepEqual(errors,[]);console.log('PASS eight new portrait cells, 50 foes, seven actual multicolor Slivers/15 mana pips, native ability first, source/recipient symbols and hover links, removal/rerender cleanup, controller-safe enemy selection, edited merchant, three unclipped NEW labels above cards in four viewports; no page errors or page scrolling.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
