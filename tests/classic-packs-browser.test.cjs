const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 const art=await p.evaluate(()=>({bears:BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'),lands:BUNDLED_LANDS,tokens:Object.values(CAMP_TOKEN_CARDS)}));assert.equal(art.bears.art_print.set,'lea');assert.ok(art.lands.every(c=>c.art_print.set==='lea'));assert.ok(art.tokens.every(c=>c.art_print.released_at));
 assert.equal(await p.locator('.hero-card img').first().getAttribute('src'),art.bears.image);
 await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.deck=Array.from({length:30},()=>BUNDLED_CARDS[0]);state.node=2;state.coins=100;showShop();state.shop.packs=[{type:'equipment',sold:false},{type:'mythic',sold:false}];renderShop()});
 assert.equal(await p.locator('#shop-pack-confirm').isDisabled(),true);
 await p.click('[data-select-pack="0"]');assert.equal(await p.locator('[data-select-pack="0"]').getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>state.coins),100);assert.equal(await p.locator('#shop-pack-confirm').isEnabled(),true);
 await p.click('[data-select-pack="0"]');assert.equal(await p.locator('[data-select-pack="0"]').getAttribute('aria-pressed'),'true');
 await p.click('#shop-pack-confirm');assert.equal(await p.evaluate(()=>state.coins),73);assert.equal(await p.locator('.sealed-pack').getAttribute('data-pack-type'),'equipment');
 const silver=await p.locator('.sealed-pack').evaluate(e=>getComputedStyle(e).getPropertyValue('--pack-color'));assert.equal(silver.trim(),'#d5e1ed');
 await p.locator('[data-open-pack]').click({force:true});await p.waitForFunction(()=>!boosterTravel);await p.click('#draft-confirm');
 await p.click('[data-select-pack="1"]');await p.click('#shop-pack-confirm');assert.equal(await p.locator('.sealed-pack').getAttribute('data-pack-type'),'mythic');assert.ok((await p.locator('.sealed-pack').evaluate(e=>getComputedStyle(e).boxShadow)).includes('255, 70, 57'));
 await p.locator('[data-open-pack]').click({force:true});await p.waitForFunction(()=>!boosterTravel);await p.click('#draft-confirm');
 // Actual opening + first click during the reveal, without forcing a double click.
 await p.evaluate(()=>{state.packs=makeStarterPacks();state.draftKind='starter';state.activePack=0;state.selection=new Map();state.boosterSealed=true;renderDraft();showScreen('draft-screen')});
 await p.locator('[data-open-pack]').click({force:true});await p.waitForFunction(()=>boosterTravel?.revealed===true);
 await p.locator('.draft-option').nth(2).click({force:true});await p.waitForFunction(()=>!boosterTravel);
 assert.equal(await p.locator('.draft-option').nth(2).getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#draft-confirm').isEnabled(),true);
 await p.locator('.draft-option').nth(2).click();assert.equal(await p.locator('.draft-option').nth(2).getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>state.activePack),0);
 await p.click('#draft-confirm');assert.equal(await p.evaluate(()=>state.activePack),1);
 assert.deepEqual(errors,[]);console.log('PASS oldest title/basic-land/token art, pack colours, one-click selection and separate purchase/card confirmation');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
