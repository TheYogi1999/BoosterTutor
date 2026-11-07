const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function sealed(page){
  await page.evaluate(()=>{
    state.soundOn=false;state.pool=BUNDLED_CARDS;state.packs=makeStarterPacks();state.draftKind='starter';
    state.activePack=0;state.boosterSealed=true;state.rerolledPacks=new Set();state.selection.clear();
    renderDraft();showScreen('draft-screen');
    document.querySelector('#draft-screen').getAnimations().forEach(animation=>animation.finish());
    window.openingSounds=0;
    playBoosterOpeningSound=()=>{
      openingSounds++;
      window.arrival=document.querySelector('.pack-opening-flight')?.getBoundingClientRect().toJSON();
    };
  });
}
(async()=>{
  fs.mkdirSync('work',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:900},hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    await page.evaluate(()=>{window.realPackSound=playBoosterOpeningSound;});
    for(const viewport of [{width:1600,height:900},{width:820,height:1180}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(200);await sealed(page);
      const before=await page.locator('.sealed-pack').boundingBox();
      await page.locator('.sealed-pack').click({force:true});
      await page.evaluate(()=>boosterTravel.animation.pause());
      assert.equal(await page.locator('#draft-grid').getAttribute('aria-busy'),'true');
      const target=await page.locator('.card-image-wrap').first().boundingBox();
      assert.equal(await page.locator('.draft-option').first().isVisible(),false,'cards wait while pack moves');
      assert.equal(await page.locator('#pack-reroll').isDisabled(),true);
      assert.equal(await page.evaluate(()=>openingSounds),0,'opening sound does not play at the original center');
      const packIds=await page.evaluate(()=>JSON.stringify(state.packs[0].map(c=>c.id)));
      await page.evaluate(()=>{openCurrentBooster();rerollCurrentPack();confirmDraft();});
      assert.equal(await page.evaluate(()=>JSON.stringify(state.packs[0].map(c=>c.id))),packIds,'repeated input cannot replace or advance a travelling pack');
      await page.evaluate(()=>{boosterTravel.animation.currentTime=140;});
      const during=await page.locator('.pack-opening-flight').boundingBox();
      assert.ok(during.x<before.x-10&&during.x>target.x-10,'pack travels left toward the first card');
      await page.evaluate(()=>boosterTravel.animation.play());
      await page.waitForFunction(()=>openingSounds===1);
      const arrival=await page.evaluate(()=>window.arrival);
      assert.ok(Math.abs(arrival.x+arrival.width/2-target.x-target.width/2)<1,'pack opens at the center of the first card slot');
      assert.ok(Math.abs(arrival.y+arrival.height/2-target.y-target.height/2)<1,'pack opens at the card slot height');
      assert.equal(await page.locator('#draft-screen').evaluate(el=>el.classList.contains('opening')),true);
      await page.waitForFunction(()=>!document.querySelector('#draft-grid').hasAttribute('aria-busy'));
      assert.equal(await page.locator('.pack-opening-flight').count(),0);
      assert.equal(await page.locator('.draft-option').count(),7);
      assert.equal(await page.locator('#pack-reroll').isDisabled(),false);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('.draft-option').first().click();
      assert.equal(await page.locator('.draft-option.selected').count(),1);
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    // An abandoned transition cannot reveal cards or play audio on another screen.
    await sealed(page);await page.locator('.sealed-pack').click({force:true});
    await page.evaluate(()=>{boosterTravel.animation.pause();showScreen('start-screen');});
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(()=>state.screen),'start-screen');
    assert.equal(await page.evaluate(()=>openingSounds),0);
    assert.equal(await page.locator('.pack-opening-flight').count(),0);
    assert.equal(await page.locator('#draft-grid').getAttribute('aria-busy'),null);
    // Motion preference retains the immediate, usable pack-opening path.
    await page.emulateMedia({reducedMotion:'reduce'});await sealed(page);
    await page.locator('.sealed-pack').click();
    assert.equal(await page.locator('.pack-opening-flight').count(),0);
    assert.equal(await page.locator('.draft-option').first().isVisible(),true);
    assert.equal(await page.evaluate(()=>openingSounds),1);
    // The actual HTML audio is unlocked silently during the tap, then rewound
    // and made audible only when the pack arrives (also works with Safari's
    // gesture requirement). This check uses the real decoded media element.
    await page.emulateMedia({reducedMotion:'no-preference'});await sealed(page);
    await page.evaluate(()=>{state.soundOn=true;playBoosterOpeningSound=realPackSound;});
    await page.locator('.sealed-pack').click({force:true});
    await page.evaluate(()=>boosterTravel.animation.pause());
    await page.waitForFunction(()=>soundEngine.packGain && !document.querySelector('#booster-audio').paused);
    assert.equal(await page.evaluate(()=>soundEngine.packGain.gain.value),0,'travel audio stays silent');
    await page.evaluate(()=>boosterTravel.animation.play());
    await page.waitForFunction(()=>boosterTravel?.revealed);
    assert.equal(await page.evaluate(()=>soundEngine.packGain.gain.value),1,'opening is audible at the first slot');
    assert.equal(await page.locator('#booster-audio').evaluate(el=>el.paused),false);
    await page.waitForFunction(()=>!boosterTravel);
    await page.evaluate(()=>soundEngine.stop());
    assert.deepEqual(errors,[]);
    console.log('Passed: pack travels to the first card on desktop/iPad, reveals/sound wait for arrival, duplicate input is blocked, cancellation is safe and reduced motion opens immediately.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
