const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.deck=[...Array.from({length:35},()=>BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')),...generateStarterManaCards(4)];state.node=1;state.campTokens=[];showJourney()});
 assert.equal(await p.locator('[data-camp-token]').count(),3);assert.equal(await p.locator('[data-relic],[data-camp]').count(),0);
 await p.click('[data-camp-token="treasure"]');await p.waitForFunction(()=>!document.querySelector('.zone-flight'));
 assert.equal(await p.evaluate(()=>state.battle.hand.length),7);
 await p.click('[data-camp-token-kind="treasure"]');await p.click('#inspector-content [data-activate-permanent]');
 assert.equal(await p.locator('#floating-mana-count').textContent(),'1');assert.equal(await p.locator('#floating-mana').isVisible(),true);
 assert.equal(await p.evaluate(()=>state.campTokens.length),0);assert.equal(await p.evaluate(()=>state.battle.lands.length),2);
 await p.evaluate(()=>{state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Dark Ritual')];renderBattle()});await p.click('[data-hand-index="0"]');
 assert.equal(await p.evaluate(()=>state.battle.floatingMana),3,'Ritual pays with the Treasure mana and adds three');
 assert.equal(await p.locator('#floating-mana-count').textContent(),'3');
 await p.evaluate(()=>{state.node=2;state.coins=200;state.shop=null;showShop()});assert.equal(await p.locator('[data-select-pack]').count(),2);assert.equal(await p.locator('.shop-offer').count(),3);
 const types=await p.locator('[data-pack-type]').evaluateAll(es=>es.map(e=>e.dataset.packType));await p.click('#shop-continue');await p.click('#return-shop');assert.deepEqual(await p.locator('[data-pack-type]').evaluateAll(es=>es.map(e=>e.dataset.packType)),types);
 // Force each advertised type into an existing offer to exercise the entire opening flow.
 for(const type of ['mythic','equipment','instant','creature']){
  await p.evaluate(type=>{state.shop.packs=[{type,sold:false},{type:type==='instant'?'creature':'instant',sold:false}];state.coins=200;renderShop();window.deckBefore=state.deck.length},type);
  await p.click('[data-select-pack="0"]');assert.equal(await p.evaluate(()=>state.screen),'shop-screen');await p.click('#shop-pack-confirm');await p.locator('[data-open-pack]').click({force:true});await p.waitForFunction(()=>!boosterTravel&&!document.querySelector('#draft-confirm').disabled);
  assert.equal(await p.locator('.draft-option').count(),7);
  assert.ok(await p.evaluate(type=>type==='mythic'?state.packs[0].some(c=>c.rarity==='mythic'):state.packs[0].every(c=>type==='equipment'?/Equipment/.test(c.type_line):type==='creature'?isCreature(c):isInstant(c)),type));
  await p.click('#draft-confirm');assert.equal(await p.evaluate(()=>state.deck.length-deckBefore),7);assert.equal(await p.locator('[data-select-pack="0"]').isDisabled(),true);
 }
 await p.click('#shop-continue');await p.click('[data-camp-token="clue"]');await p.waitForFunction(()=>!document.querySelector('.zone-flight'));
 const count=await p.evaluate(()=>state.battle.hand.length);await p.click('[data-camp-token-kind="clue"]');await p.click('#inspector-content [data-activate-permanent]');assert.equal(await p.evaluate(()=>state.battle.hand.length),count+1);
 assert.equal(await p.evaluate(()=>state.campTokens.length),0);assert.equal(await p.evaluate(()=>state.battle.graveyard.some(c=>c.campToken)),false);
 await p.evaluate(()=>{state.node=3;showJourney()});await p.click('[data-camp-token="food"]');await p.waitForFunction(()=>!document.querySelector('.zone-flight'));
 const life=await p.evaluate(()=>state.playerHealth);await p.click('[data-camp-token-kind="food"]');await p.click('#inspector-content [data-activate-permanent]');assert.equal(await p.evaluate(()=>state.playerHealth),life+3);
 await p.evaluate(()=>{state.node=3;state.shop=null;state.coins=200;showShop()});
 for(const size of[{width:1600,height:900},{width:820,height:1180},{width:1280,height:720}]){await p.setViewportSize(size);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);assert.ok(await p.evaluate(()=>{const top=document.querySelector('.shop-footer').getBoundingClientRect().top;return [...document.querySelectorAll('.shop-booster-offer')].every(e=>e.getBoundingClientRect().bottom<=top)}));}
 assert.deepEqual(errors,[]);console.log('PASS four booster types, two stable offers, purchase/open/sold flow, Treasure/Dark Ritual floating mana, Clue/Food costs and viewport bounds');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
