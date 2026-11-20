const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.bringToFront();
 await p.evaluate(()=>{
  state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;window.card90=n=>BUNDLED_CARDS.find(c=>c.name===n);
  window.reset90=()=>{showScreen('start-screen');state.runMode71='draft';state.immortal76=null;state.endless=false;state.playerHealth=30;state.coins=500;state.deck=Array.from({length:45},()=>physicalRunCopy60(card90('Grizzly Bears')));state.deck.push(...generateStarterManaCards(4));beginBattle(1);const b=state.battle;b.turn=5;b.phase='main';b.creatures=[];b.permanents=[];b.hand=[];b.graveyard=[];b.exile=[];b.enemyCreatures=[createFoe('boar',1)];b.waves=[b.enemyCreatures];b.floatingMana=30;syncMana(b);renderBattle();return b};
  window.ally90=(name,id=name)=>{const card=physicalRunCopy60(card90(name)),u={id,owner:'player',card,...parseStats(card),...creatureKeywords(card),summonedTurn:0,summoningSick:false};state.battle.creatures.push(u);return u};reset90();
 });
 assert.equal(await p.evaluate(()=>BUNDLED_CARDS.length),227);assert.equal(await p.evaluate(()=>playableCards(BUNDLED_CARDS).length),224);assert.equal(await p.evaluate(()=>Object.keys(FOE_TYPES).length),50);
 // A real instant cast and mandatory controller-operated color choice, followed by Scry 1.
 await p.evaluate(()=>{ally90('Grizzly Bears','bear');state.battle.hand=[physicalRunCopy60(card90('Gods Willing'))];renderBattle()});
 const mana=await p.evaluate(()=>state.battle.mana);await p.locator('[data-hand-index="0"]').click();await p.locator('[data-rule-pick="player:bear"]').click();await p.locator('#rule-confirm').click();await p.waitForFunction(()=>visibleJesterChoice65?.options.length===5);
 assert.equal(await p.evaluate(()=>state.battle.mana),mana-1);await p.keyboard.press('Escape');assert.equal(await p.locator('#jester-choice-dialog').evaluate(n=>n.open),true);
 await p.evaluate(()=>{controller.enable();controller.reconcile();controller.focus(document.querySelector('[data-jester-pick65="3"]'));controller.activate();controller.focus(document.querySelector('#jester-choice-confirm'));controller.activate()});
 await p.waitForFunction(()=>Boolean(state.battle.scry));await p.locator('#scry-confirm').click();assert.equal(await p.evaluate(()=>protectedFrom90(state.battle.creatures[0],card90('Lightning Bolt'))),true);
 assert.match(await p.locator('.keyword-strip').first().textContent(),/Protection \(Red\)/);
 // A protected target is absent from the real spell choice, without spending any mana.
 await p.evaluate(()=>{state.battle.hand=[physicalRunCopy60(card90('Lightning Bolt'))];renderBattle()});await p.locator('[data-hand-index="0"]').click();assert.equal(await p.locator('[data-rule-pick="player:bear"]').count(),0);await p.locator('#rule-cancel').click();
 // All new portraits and identities render together; shared Sliver abilities are visible.
 await p.evaluate(()=>{reset90();state.battle.enemyCreatures=Object.keys(FOES90).map(k=>createFoe(k,3));renderBattle()});
 assert.equal(await p.locator('#enemy-board .monster').count(),6);assert.equal(await p.locator('#enemy-board .enemy-identity90').count(),6);
 assert.equal(await p.locator('#enemy-board .walker-portrait').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).backgroundImage.includes('enemies-v90.webp'))),true);
 assert.equal(await p.locator('#enemy-board .walker-portrait').evaluateAll(ns=>new Set(ns.map(n=>getComputedStyle(n).backgroundPosition)).size),6);
 assert.match(await p.locator('[data-enemy-attacker]').filter({hasText:'Bladecrest Sliver'}).textContent(),/Flying/);
 assert.equal(await p.locator('#enemy-board .monster-keywords').evaluateAll(ns=>ns.every(n=>n.scrollHeight<=n.clientHeight+1)),true,'All shared Sliver keywords fit visibly');
 await p.screenshot({path:'work/foes90-battle.png'});
 await p.evaluate(()=>{for(let i=0;i<6;i++)ally90('Grizzly Bears','blocker-'+i);state.battle.phase='blocks';renderBattle()});
 assert.equal(await p.locator('#blocking-panel').evaluate(n=>{if(!n.getClientRects().length)return true;const r=n.getBoundingClientRect();return r.bottom<=document.querySelector('.battlefield').getBoundingClientRect().bottom+1&&[...document.querySelectorAll('#enemy-board .monster-keywords')].every(k=>k.getBoundingClientRect().bottom<=r.top+1)}),true,'Expanded keyword rows do not overlap blocking controls');
 await p.evaluate(()=>{state.battle.enemyCreatures=['dragon','tyrant','sphinx','cinderhydra','abyssleviathan'].map(k=>createFoe(k,4));renderBattle()});assert.equal(await p.locator('#enemy-board [data-keyword="protection"]').count(),5);
 // Custom merchant sits on the left, with reachable three-card / two-pack / three-counter offers.
 await p.evaluate(()=>{state.node=2;showShop();state.shop.offers=['Paladin en-Vec','Gods Willing','Green Ward'].map(name=>({card:runCard59(card90(name)),price:10,sold:false}));state.shop.packs=[{type:'creature',sold:false},{type:'instant',sold:false}];state.shop.counters60=[{kind:'stats',sold:false},{kind:'flying',sold:false},{kind:'mystery',sold:false}];renderShop()});
 assert.equal(await p.locator('[data-buy-card]').count(),3);assert.equal(await p.locator('[data-select-pack]').count(),2);assert.equal(await p.locator('[data-buy-counter]').count(),3);
 assert.match(await p.locator('.shopkeeper-portrait87').evaluate(n=>getComputedStyle(n).backgroundImage),/vey-v91\.webp/);
 assert.equal(await p.locator('.shopkeeper87').evaluate(n=>n.getBoundingClientRect().right<=document.querySelector('#shop-grid').getBoundingClientRect().left),true);
 const greeting=await p.locator('#shopkeeper-greeting87').textContent();
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  for(const selector of ['.shopkeeper87','.shop-wallet','#shop-grid','#shop-pack','.shop-counters','#shop-continue'])assert.equal(await p.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}),true,selector+' fits');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.screenshot({path:'work/shop90-final.png'});
 const coins=await p.evaluate(()=>state.coins),deck=await p.evaluate(()=>state.deck.length);await p.locator('[data-buy-card="0"]').click();assert.equal(await p.evaluate(()=>state.coins),coins-10);assert.equal(await p.evaluate(()=>state.deck.length),deck+1);assert.equal(await p.locator('[data-buy-card="0"]').textContent(),'SOLD');assert.equal(await p.locator('#shopkeeper-greeting87').textContent(),greeting);
 await p.locator('[data-buy-counter="0"]').click();await p.locator('[data-counter-pick]').first().click();await p.locator('#counter-shop-confirm').click();assert.equal(await p.evaluate(()=>state.deck[0].runCounters60.includes('stats')),true);
 await p.locator('[data-select-pack="0"]').click();assert.equal(await p.locator('[data-select-pack="0"]').getAttribute('aria-pressed'),'true');const before=await p.evaluate(()=>state.deck.length);await p.locator('#shop-pack-confirm').click();await p.waitForFunction(()=>state.screen==='draft-screen');await p.locator('.sealed-pack').click();await p.locator('#draft-confirm').click();await p.waitForFunction(()=>state.screen==='shop-screen');assert.equal(await p.evaluate(()=>state.deck.length),before+7);
 await p.locator('#shop-continue').click();assert.equal(await p.evaluate(()=>state.screen),'journey-screen');assert.deepEqual(errors,[]);
 console.log('PASS custom left-side Vey shop, three cards/two packs/three counters, purchases and seven-card pack return, four fitted viewports, real Gods Willing color choice/controller/Scry/expiry targeting, six new portraits, 50 color identities, Sliver sharing and five boss protection badges.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
