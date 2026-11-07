const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('work',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
    // Exercise fixed random inputs instead of relying on chance for coverage.
    const samples=await page.evaluate(()=>{
      const original=Math.random,result=[];
      try{
        for(const value of [.01,.26,.51,.76,.99]){
          Math.random=()=>value;
          for(let node=1;node<=4;node++){
            state.node=node;
            const team=createEnemyTeam(ENCOUNTERS[node-1]);
            result.push({node,declaredCount:ENCOUNTERS[node-1].foeCount,team:team.map(e=>({id:e.id,kind:e.kind,hexproof:hasCreatureKeyword(e,'hexproof'),text:e.card.oracle_text,health:e.health,power:e.power}))});
          }
        }
      }finally{Math.random=original;}
      return{samples:result,wispKeywords:FOE_TYPES.wisp.keywords};
    });
    const sizes=[2,2,3,2];
    const allowed=[['sprout','wisp'],['raider','sprout','wisp'],['wolf','raider','sprout','wisp'],['dragon','sprout','wisp']];
    const allIds=[];
    for(const sample of samples.samples){
      assert.equal(sample.team.length,sizes[sample.node-1]);
      assert.equal(sample.declaredCount,sample.team.length);
      assert.ok(sample.team.every(e=>allowed[sample.node-1].includes(e.kind)&&e.health>0&&e.power>0));
      allIds.push(...sample.team.map(e=>e.id));
      if(sample.node===1){
        assert.ok(sample.team.some(e=>e.kind==='sprout'),'opening always includes a grounded opponent');
        assert.ok(sample.team.every(e=>!e.hexproof&&!/hexproof/i.test(e.text)),'opening opponents never have Hexproof');
      }
      if(sample.node===2)assert.equal(sample.team.filter(e=>e.kind==='raider').length,1);
      if(sample.node===3){assert.equal(sample.team.filter(e=>e.kind==='raider').length,1);assert.equal(sample.team.filter(e=>e.kind==='wolf').length,1);}
      if(sample.node===4)assert.equal(sample.team[0].kind,'dragon','the final boss remains guaranteed');
      if(sample.node>1)for(const wisp of sample.team.filter(e=>e.kind==='wisp'))assert.ok(wisp.hexproof,'later wisps retain their printed keyword');
    }
    assert.equal(new Set(allIds).size,allIds.length);
    assert.ok(samples.wispKeywords.includes('hexproof'),'intro changes do not mutate the global foe template');
    for(let node=1;node<=4;node++)assert.ok(new Set(samples.samples.filter(s=>s.node===node).map(s=>s.team.map(e=>e.kind).sort().join(','))).size>=2,'each encounter has multiple compositions');

    // The opening wisp really accepts targeted damage, and remains the same
    // opponent through rerenders. A later wisp still rejects the same spell.
    for(const node of [1,2]){
      const result=await page.evaluate(node=>{
        state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;
        state.deck=[...BUNDLED_CARDS,...generateStarterManaCards(4)];
        const original=Math.random;try{Math.random=()=>.99;beginBattle(node);}finally{Math.random=original;}
        const wisp=state.battle.enemyCreatures.find(e=>e.kind==='wisp');
        state.battle.floatingMana=5;state.battle.hand=[BUNDLED_CARDS.find(c=>c.name==='Lightning Bolt')];
        state.battle.selectedEnemyTargetId=wisp.id;renderBattle();
        const ids=state.battle.enemyCreatures.map(e=>e.id);playCard(0,'enemy');renderBattle();
        return{health:wisp.health,remaining:state.battle.hand.length,ids,after:state.battle.enemyCreatures.map(e=>e.id),keywords:document.querySelector(`[data-enemy-attacker="${wisp.id}"] .monster-keywords`).textContent};
      },node);
      assert.deepEqual(result.after,result.ids,'rendering never rerolls a live encounter');
      assert.equal(result.health,node===1?7:10);
      assert.equal(result.remaining,node===1?0:1);
      assert.equal(/hexproof/i.test(result.keywords),node>1);
    }
    for(const viewport of [{width:1600,height:900},{width:820,height:1180}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(200);
      await page.evaluate(()=>{state.packs=makeStarterPacks();state.activePack=0;state.boosterSealed=false;state.draftKind='starter';state.selection.clear();renderDraft();showScreen('draft-screen');});
      const frames=await page.locator('.card-image-wrap').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
      assert.equal(frames.length,7);
      for(const frame of frames)assert.ok(Math.abs(frame.w/frame.h-488/680)<.003,'frame has the same portrait ratio as the card');
      await page.locator('.draft-option').first().click();
      assert.equal(await page.locator('.draft-option.selected').evaluate(el=>getComputedStyle(el).borderTopColor),'rgba(0, 0, 0, 0)','selection does not draw a wide frame around the whole text column');
      assert.notEqual(await page.locator('.draft-option.selected .card-image-wrap').evaluate(el=>getComputedStyle(el).outlineStyle),'none','selection frame stays on the actual card face');
    }
    await page.screenshot({path:'work/portrait-booster-frames.png'});
    assert.deepEqual(errors,[]);
    console.log('Passed: portrait-sized booster frames, image-only selection, varied stage-safe rosters, no opening Hexproof, targetable opening wisps, preserved later Hexproof, stable live encounters and guaranteed boss.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
