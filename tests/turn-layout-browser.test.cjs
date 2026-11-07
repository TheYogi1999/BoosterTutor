const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
async function fitted(page, selector='.game-shell'){
  const bounds=await page.locator(selector).boundingBox();
  const viewport=page.viewportSize();
  assert.ok(Math.abs(bounds.width/bounds.height-16/9)<.002,`${selector} is 16:9`);
  assert.ok(bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1,`${selector} fits the viewport`);
  assert.equal(await page.evaluate(()=>scrollY),0);
}
async function battleFixture(page){
  await page.evaluate(()=>{
    state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;
    state.deck=[...BUNDLED_CARDS,...generateStarterManaCards(4)];beginBattle(1);
    state.battle.turn=3;state.battle.floatingMana=30;
    state.battle.hand=['Grizzly Bears','Savannah Lions'].map(n=>BUNDLED_CARDS.find(c=>c.name===n));
    playCard(0,'player');playCard(0,'player');state.battle.creatures.forEach(c=>{c.summonedTurn=1});
    state.battle.enemyCreatures.forEach(e=>{e.power=0;e.health=40;e.maxHealth=40;e.summonedTurn=1;e.pattern=['attack']});
    state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Revitalize')];renderBattle();
  });
}
(async()=>{
  fs.mkdirSync('work',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:900},hasTouch:true,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    // Selection uses its own decoded sample, rather than the old sprite slice.
    await page.locator('[data-avatar-choice="ranger"]').click();
    await page.waitForFunction(()=>soundEngine.selectBuffer);
    assert.ok(await page.evaluate(()=>soundEngine.selectBuffer.duration>.075&&soundEngine.selectBuffer.duration<.1));
    await page.evaluate(()=>{
      window.selectedBuffers=[];const add=soundEngine.voices.add.bind(soundEngine.voices);
      soundEngine.voices.add=source=>{selectedBuffers.push(source.buffer);return add(source)};
    });
    await page.locator('[data-avatar-choice="guardian"]').click();
    await page.waitForFunction(()=>selectedBuffers.length>0);
    assert.ok(await page.evaluate(()=>selectedBuffers.at(-1)===soundEngine.selectBuffer));
    await page.locator('#sound-toggle').click();
    const mutedCount=await page.evaluate(()=>selectedBuffers.length);
    await page.locator('[data-avatar-choice="mage"]').click();await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>selectedBuffers.length),mutedCount,'mute suppresses selection audio');

    await battleFixture(page);
    const ids=await page.evaluate(()=>state.battle.creatures.map(c=>c.id));
    const enemies=await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.id));
    await page.locator(`[data-unit-attack="${ids[0]}"]`).click();
    assert.equal(await page.evaluate(()=>state.battle.phase),'main');
    await page.locator(`[data-creature-id="${ids[1]}"]`).dragTo(page.locator(`[data-enemy-attacker="${enemies[1]}"]`));
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(()=>state.battle.phase),'main','queueing or dragging never starts combat');
    assert.deepEqual(await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.health)),[40,40]);
    assert.ok(await page.evaluate(()=>state.battle.creatures.every(c=>c.willAttack&&!c.tapped&&!c.attackedThisTurn)));
    // Even an accidental direct resolver call cannot deal damage in Main phase.
    await page.evaluate(()=>resolvePlayerAttacks());
    assert.deepEqual(await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.health)),[40,40]);
    await page.locator('#end-turn-button').click();
    assert.equal(await page.evaluate(()=>state.battle.phase),'attack');
    assert.equal(await page.locator('#phase-strip [aria-current="step"]').getAttribute('data-phase'),'attack');
    assert.deepEqual(await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.health)),[40,40],'priority window is before damage');
    await page.locator('#end-turn-button').click();
    assert.equal(await page.evaluate(()=>state.battle.phase),'enemy');
    assert.deepEqual(await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.health)),[38,38],'each queued creature hits its own chosen target in Your attack');
    assert.ok(await page.evaluate(()=>state.battle.creatures.every(c=>c.attackedThisTurn)));

    await battleFixture(page);
    await page.evaluate(()=>{state.battle.creatures.forEach(c=>queueCreatureAttack(c.id));finishTurn();state.battle.creatures.forEach(c=>withdrawAttack(c.id));});
    assert.equal(await page.evaluate(()=>state.battle.phase),'attack','withdrawing all attackers does not return to Main phase');
    await page.locator('#end-turn-button').click();
    assert.equal(await page.evaluate(()=>state.battle.phase),'enemy');
    assert.deepEqual(await page.evaluate(()=>state.battle.enemyCreatures.map(e=>e.health)),[40,40]);

    // Home, loading, sealed/open packs, camp, shop, combat and the end screen
    // share the same frame on wide displays and portrait phones/tablets.
    for(const viewport of [{width:1600,height:900},{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(200);
      for(const scene of ['start-screen','loading-screen','draft-screen','journey-screen','shop-screen','combat-screen','end-screen']){
        await page.evaluate(scene=>{
          if(scene==='draft-screen'){state.packs=makeStarterPacks();state.draftKind='starter';state.activePack=0;state.boosterSealed=true;renderDraft();}
          if(scene==='journey-screen'){state.node=1;showJourney();}
          if(scene==='shop-screen'){state.node=2;showShop();}
          showScreen(scene);
        },scene);
        await fitted(page);
        if(scene==='draft-screen'){await page.locator('.sealed-pack').click();await fitted(page);}
      }
      await page.evaluate(()=>showScreen('combat-screen'));
      for(const dialog of ['graveyard-dialog','collection-dialog','scry-dialog','quit-dialog']){
        await page.evaluate(id=>document.getElementById(id).showModal(),dialog);
        await fitted(page,`#${dialog}`);
        await page.evaluate(id=>document.getElementById(id).close(),dialog);
      }
    }
    await page.screenshot({path:'work/widescreen-phone.png'});
    assert.deepEqual(errors,[]);
    console.log('Passed: main-phase queue button/drag, attack-phase-only damage, per-creature targets, withdrawal, dedicated selection audio/mute, and 16:9 fitting for all scenes and dialogs.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
