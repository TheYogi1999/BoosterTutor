const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function preparePack(page, indices=[0,1,2,3,4,5,6]){
  await page.evaluate(indices=>{
    state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;
    state.packs=[indices.map(i=>BUNDLED_CARDS[i])];state.activePack=0;state.draftKind='reward';state.boosterSealed=true;
    state.rerolledPacks=new Set();state.selection.clear();renderDraft();showScreen('draft-screen');
    document.querySelector('#draft-screen').getAnimations().forEach(a=>a.finish());
  },indices);
}
(async()=>{
  fs.mkdirSync('work',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:900},hasTouch:true,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    await page.evaluate(()=>{state.soundOn=false;state.pool=BUNDLED_CARDS;openCollection('catalog');});
    assert.equal(await page.locator('#collection-grid [data-discovery-status="seen"]').count(),0);
    assert.equal(await page.locator('#collection-grid [data-discovery-status="unseen"]').count(),81);
    assert.equal(await page.locator('#collection-dialog .new-card-badge').count(),0,'pool only shows status');
    await page.locator('#collection-search').fill('Grizzly');
    assert.equal(await page.evaluate(()=>seenCardKeys.size),0,'browsing the pool does not discover its contents');
    await page.locator('#collection-close').click();

    await preparePack(page);assert.equal(await page.evaluate(()=>seenCardKeys.size),0,'sealed packs do not count');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('.sealed-pack').click({force:true});
    await page.evaluate(()=>boosterTravel.animation.pause());
    assert.equal(await page.evaluate(()=>seenCardKeys.size),0,'hidden cards in transit do not count');
    await page.evaluate(()=>showScreen('start-screen'));
    assert.equal(await page.evaluate(()=>seenCardKeys.size),0,'abandoned opening does not count');
    await page.emulateMedia({reducedMotion:'reduce'});await preparePack(page);
    await page.locator('.sealed-pack').click();
    assert.equal(await page.locator('#draft-grid .new-card-badge').count(),7);
    assert.equal(await page.evaluate(()=>seenCardKeys.size),7);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SEEN_CARD_KEY)).length),7);
    await page.locator('.draft-option').first().click();
    assert.equal(await page.locator('#draft-grid .new-card-badge').count(),7,'NEW survives selection/rerender within the first view');
    const draftFacts=await page.locator('.draft-card-summary').first().innerHTML();
    const draftSize=await page.locator('.card-image-wrap').first().boundingBox();
    await page.evaluate(()=>openCollection('catalog'));
    await page.locator('#collection-seen').selectOption('seen');
    assert.equal(await page.locator('.collection-entry').count(),7);
    await page.locator('#collection-search').fill('Grizzly');
    assert.equal(await page.locator('.collection-entry').count(),1,'discovery and text filters combine');
    await page.locator('#collection-search').fill('');
    await page.locator('#collection-seen').selectOption('unseen');
    assert.equal(await page.locator('.collection-entry').count(),74);
    assert.equal(await page.locator('#collection-dialog .new-card-badge').count(),0);
    await page.locator('#collection-close').click();

    await page.evaluate(()=>{
      state.node=2;state.coins=100;state.shop={node:2,offers:[0,10,11].map(i=>({card:BUNDLED_CARDS[i],price:shopPrice(BUNDLED_CARDS[i]),sold:false}))};showShop();
    });
    assert.equal(await page.locator('.shop-offer').count(),3);
    assert.equal(await page.locator('#shop-grid .new-card-badge').count(),2,'seen pack cards are not NEW in shop');
    assert.equal(await page.locator('.shop-offer .draft-card-summary').first().innerHTML(),draftFacts,'shop and booster share the same card facts');
    const shopSize=await page.locator('.shop-card-face .card-image-wrap').first().boundingBox();
    assert.ok(Math.abs(shopSize.width-draftSize.width)<1&&Math.abs(shopSize.height-draftSize.height)<1,'shop and booster faces have the same size');
    const before=await page.evaluate(()=>({coins:state.coins,deck:state.deck.length,price:state.shop.offers[1].price}));
    await page.locator('[data-buy-card="1"]').click();
    assert.deepEqual(await page.evaluate(()=>({coins:state.coins,deck:state.deck.length})),{coins:before.coins-before.price,deck:before.deck+1});
    assert.equal(await page.locator('[data-buy-card="1"]').isDisabled(),true);
    assert.equal(await page.locator('#shop-grid .new-card-badge').count(),2,'buying keeps NEW for this shop visit');
    await page.evaluate(()=>{showJourney();showShop();});
    assert.equal(await page.locator('#shop-grid .new-card-badge').count(),0,'returning to shop does not show stale NEW labels');
    assert.equal(await page.evaluate(()=>seenCardKeys.size),9);

    await page.reload();
    assert.equal(await page.locator('#discovery-progress').innerText(),'9','discoveries persist across reloads');
    await page.evaluate(()=>{state.pool=BUNDLED_CARDS;state.soundOn=false;openCollection('catalog');});
    assert.equal(await page.locator('[data-discovery-status="seen"]').count(),9);
    await page.locator('#collection-close').click();
    await preparePack(page,[0,20,21,22,23,24,25]);
    await page.evaluate(()=>{state.packs[0][0]={...state.packs[0][0],id:'another-printing-of-the-same-card'};});
    await page.locator('.sealed-pack').click();
    assert.equal(await page.locator('#draft-grid .new-card-badge').count(),6,'another printing of a seen card is still seen');
    assert.equal(await page.evaluate(()=>seenCardKeys.size),15);
    await page.evaluate(()=>startNewRun());await page.waitForSelector('.sealed-pack');
    assert.equal(await page.evaluate(()=>seenCardKeys.size),15,'starting a run preserves discoveries');

    for(const viewport of [{width:1600,height:900},{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(200);
      await page.evaluate(()=>showScreen('start-screen'));
      const home=await page.evaluate(()=>{
        const frame=document.querySelector('.title-stage').getBoundingClientRect();
        return{frame:frame.toJSON(),controls:[...document.querySelectorAll('#start-button,#card-catalog-button,.avatar-choice,.hero-discoveries')].map(e=>e.getBoundingClientRect().toJSON()),shell:document.querySelector('.game-shell').getBoundingClientRect().toJSON()};
      });
      assert.ok(Math.abs(home.shell.width/home.shell.height-16/9)<.002);
      for(const r of home.controls)assert.ok(r.left>=home.frame.left&&r.right<=home.frame.right&&r.top>=home.frame.top&&r.bottom<=home.frame.bottom,'home controls stay in the hero');
      await page.evaluate(()=>{state.node=2;state.coins=100;state.shop={node:2,offers:['Fountain of Renewal','Omen of the Sea','Vampire Nighthawk'].map(n=>{const card=BUNDLED_CARDS.find(c=>c.name===n);return{card,price:shopPrice(card),sold:false}})};showShop();});
      assert.ok(await page.evaluate(()=>{
        const footer=document.querySelector('.shop-footer').getBoundingClientRect();
        return [...document.querySelectorAll('.shop-offer')].every(e=>e.getBoundingClientRect().bottom<footer.top);
      }),'shop offers stay above the footer');
      assert.equal(await page.evaluate(()=>scrollY),0);
    }
    await page.screenshot({path:'work/shop-discovery-mobile.png'});
    assert.deepEqual(errors,[]);

    // Disabled/malformed storage must not break opening or session tracking.
    const privateContext=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'reduce'});
    await privateContext.addInitScript(()=>{
      const read=Storage.prototype.getItem;
      Storage.prototype.getItem=function(key){return key==='booster-tutor-seen-cards-v1'?'{invalid':read.call(this,key)};
      Storage.prototype.setItem=function(){throw new Error('Storage disabled')};
    });
    const privatePage=await privateContext.newPage();const privateErrors=[];privatePage.on('pageerror',e=>privateErrors.push(e.message));
    await privatePage.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    await preparePack(privatePage);await privatePage.locator('.sealed-pack').click();
    assert.equal(await privatePage.evaluate(()=>seenCardKeys.size),7);
    assert.equal(await privatePage.locator('.new-card-badge').count(),7);
    assert.deepEqual(privateErrors,[]);await privateContext.close();
    console.log('Passed: shared shop/pack presentation, NEW only on first views, catalog status/filtering, no discovery from sealed/cancelled packs, persistence/printing identity, safe storage fallback, purchases, and home/shop bounds in four viewports.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
