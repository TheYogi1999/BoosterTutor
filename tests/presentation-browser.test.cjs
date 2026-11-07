// Against a local static server: tests portraits, reveal styling and continuous arrows.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('work',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    await page.evaluate(async()=>{const image=new Image();image.src='assets/portraits/walkers.webp';await image.decode();if(image.width<900||image.height<900)throw Error('Portrait sheet is too small');});
    assert.equal(await page.locator('.avatar-choice .walker-portrait').count(),4);
    assert.equal(new Set(await page.locator('.avatar-choice .walker-portrait').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundPosition))).size,4);
    assert.ok(await page.locator('.avatar-choice .walker-portrait').evaluateAll(els=>els.every(el=>getComputedStyle(el).backgroundSize==='300% 300%')));
    await page.locator('[data-avatar-choice="dragon"]').click();
    await page.reload();
    assert.equal(await page.locator('[data-avatar-choice="dragon"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.hero-avatar .walker-portrait').evaluate(el=>getComputedStyle(el).backgroundPosition),'0% 50%');
    await page.evaluate(()=>{
      state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;
      state.deck=[...BUNDLED_CARDS,...generateStarterManaCards(4)];beginBattle(3);state.battle.turn=3;state.battle.floatingMana=30;
      state.battle.hand=['Serra Angel','Grizzly Bears','Llanowar Elves'].map(n=>BUNDLED_CARDS.find(c=>c.name===n));
      for(let i=0;i<3;i++)playCard(0,'player');
      state.battle.creatures.forEach(c=>{c.summonedTurn=1;c.willAttack=true;});
      state.battle.enemyCreatures.forEach(e=>{e.summonedTurn=1;e.pattern=['attack'];});
      state.battle.hand=BUNDLED_CARDS.slice(0,7);renderBattle();
    });
    await page.waitForTimeout(200);
    await page.screenshot({path:'work/walker-routes.png'});
    await page.evaluate(()=>Promise.all([...document.querySelectorAll('.route-line')].map(line=>line.getAnimations()[0].ready)));
    assert.equal(await page.locator('.monster-figure .walker-portrait').count(),3);
    assert.equal(await page.locator('.player-avatar .walker-portrait').evaluate(el=>getComputedStyle(el).backgroundPosition),'0% 50%');
    // Capture an existing route and its Animation object, then redraw and change
    // an unrelated route. Neither its timeline nor its curve may restart/jump.
    await page.evaluate(()=>{
      window.keptRoute=document.querySelectorAll('.route-ally')[1];
      window.keptLine=keptRoute.querySelector('.route-line');
      window.keptAnimation=keptLine.getAnimations()[0];
      window.keptTime=keptAnimation.currentTime;
      window.keptCurve=keptLine.getAttribute('d');
      state.battle.creatures[0].willAttack=false;
      renderBattle();for(let i=0;i<10;i++)drawCombatArrows();
    });
    await page.waitForTimeout(120);
    assert.ok(await page.evaluate(()=>keptLine.isConnected && keptLine.getAnimations()[0]===keptAnimation && keptAnimation.currentTime>keptTime),'rerenders keep the same arrow animation running');
    assert.ok(await page.evaluate(()=>keptLine.getAttribute('d')===keptCurve),'unrelated routes do not move a retained curve');
    const loops=await page.locator('.route-line').evaluateAll(lines=>lines.map(line=>{
      const style=getComputedStyle(line),animation=line.getAnimations()[0];
      const frames=animation.effect.getKeyframes();
      return{period:style.strokeDasharray.split(/[ ,]+/).reduce((sum,n)=>sum+parseFloat(n),0),distance:Math.abs(parseFloat(frames.at(-1).strokeDashoffset)-parseFloat(frames[0].strokeDashoffset)),cap:style.strokeLinecap};
    }));
    for(const loop of loops){assert.equal(loop.cap,'round');assert.ok(Math.abs(loop.distance/loop.period-Math.round(loop.distance/loop.period))<0.0001,'dash loop ends exactly where the next begins');}
    assert.ok(await page.locator('marker path').evaluateAll(paths=>paths.every(p=>p.getAttribute('d').includes('Q'))),'tips have curved corners');
    assert.ok(await page.locator('.arrowhead-glow').evaluateAll(paths=>paths.every(p=>getComputedStyle(p).filter!=='none')),'arrow tips glow');
    for(const viewport of [{width:768,height:1024},{width:820,height:1180},{width:1024,height:1366}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(250);
      for(const phase of ['main','blocks']){
        await page.evaluate(phase=>{state.battle.phase=phase;renderBattle();},phase);await page.waitForTimeout(100);
        const pictures=await page.locator('.player-card-frame,.monster-figure .walker-portrait').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));
        for(const picture of pictures)assert.ok(picture.width>=30&&picture.height>=40&&picture.bottom<=viewport.height,`card faces and busts remain visible: ${JSON.stringify(picture)}`);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight===innerHeight));
      }
    }
    await page.screenshot({path:'work/walker-presentation-ipad.png'});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.ok(await page.locator('.route-line').evaluateAll(lines=>lines.every(line=>getComputedStyle(line).animationName==='none')));
    await page.evaluate(()=>{state.packs=makeStarterPacks();state.activePack=0;state.boosterSealed=true;state.draftKind='starter';renderDraft();showScreen('draft-screen');});
    assert.ok((await page.locator('.sealed-pack').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('rgb(127, 58, 33)'));
    await page.locator('.sealed-pack').click();
    assert.equal(await page.locator('.draft-option').count(),7);
    assert.deepEqual(errors,[]);
    console.log('Passed: four persistent avatar busts, opponent portraits, tablet card visibility, stable keyed arrow timelines/geometry, seamless dash cycles, rounded glowing tips, orange packs and reduced motion.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
