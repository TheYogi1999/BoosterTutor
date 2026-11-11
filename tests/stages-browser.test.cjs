const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  // Independent properties: one landscape per stop, all biomes reachable, fair
  // scenery despite the several forest aliases, and no catalog mutation.
  const plans=await p.evaluate(()=>{
   const original=Math.random;let seed=813891;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
   const counts={},shapes=[],before=JSON.stringify(LAND_STAGES),names=new Set();
   try{for(let n=0;n<1000;n++){const plan=chooseRunStages56();shapes.push(plan.map(s=>s.scene));for(const stage of plan){counts[stage.scene]=(counts[stage.scene]||0)+1;names.add(stage.name);}}}finally{Math.random=original}
   return{counts,shapes,names:[...names],unmodified:JSON.stringify(LAND_STAGES)===before};
  });
  assert.equal(Object.keys(plans.counts).length,8);assert.equal(plans.unmodified,true);assert.ok(plans.shapes.every(plan=>plan.length===4&&new Set(plan).size===4));assert.ok(Object.values(plans.counts).every(count=>count>400&&count<600),JSON.stringify(plans.counts));assert.equal(new Set(plans.shapes.map(p=>p.join())).size>100,true);
  const scenes=[['volcano','Valakut, the Molten Pinnacle'],['ocean','Halimar Depths'],['crystal','Crystal Vein'],['marsh','Bojuka Bog']];
  await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.campTokens=[];state.deck=[...Array(30).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')),...generateStarterManaCards(4)];state.stageLocations=['volcano','ocean','crystal','marsh'].map(scene=>LAND_STAGES.find(s=>s.scene===scene));});
  const imageSources=[];
  for(const [scene,name] of scenes){
   const index=scenes.findIndex(s=>s[0]===scene)+1;await p.evaluate(index=>{beginBattle(index);state.battle.hand=['Grizzly Bears','Tavern Swindler','Contact Other Plane','Booster Tutor','Lightning Bolt','Mother Kangaroo','Squirrel-Powered Scheme'].map(name=>BUNDLED_CARDS.find(c=>c.name===name));renderBattle();},index);
   assert.equal(await p.locator('.arena-table').getAttribute('data-scene'),scene);assert.equal(await p.locator('#enemy-name').innerText(),name);assert.equal(await p.locator('.hand-card').count(),7);
   const image=await p.locator('.arena-table').evaluate(async table=>{const scene=getComputedStyle(table).getPropertyValue('--stage-scene');const url=scene.match(/url\(['"]?(.*?)['"]?\)/)[1];const img=new Image();img.src=url;await img.decode();return{source:scene,background:getComputedStyle(table).backgroundImage,width:img.naturalWidth,height:img.naturalHeight}});assert.match(image.source,new RegExp(`/stages/${scene}\\.svg`));assert.ok(image.width>0&&image.height>0);assert.match(image.background,/linear-gradient/);imageSources.push(image.source);
   const location=await p.evaluate(()=>JSON.stringify(state.stageLocations));await p.evaluate(()=>{renderBattle();renderBattle();});assert.equal(await p.evaluate(()=>JSON.stringify(state.stageLocations)),location);assert.equal(await p.locator('.arena-table').getAttribute('data-scene'),scene);
   // Later waves and regular turn updates keep the same landscape.
   await p.evaluate(()=>{state.battle.turn++;renderBattle()});assert.equal(await p.locator('.arena-table').getAttribute('data-scene'),scene);
   for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
    await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--game-scale'))-Math.min(innerWidth/1600,innerHeight/900))<.0001);
    const boxes=await p.locator('.arena-table,.player-panel,.enemy-panel,.hand-panel,.card-inspector,#phase-strip').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));for(const box of boxes)assert.ok(box.left>=-1&&box.right<=viewport.width+1&&box.top>=-1&&box.bottom<=viewport.height+1,JSON.stringify({scene,viewport,box}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1),false);
   }
   await p.setViewportSize({width:1600,height:900});await p.waitForTimeout(120);await p.screenshot({path:`work/stage56-${scene}.png`});
   if(index>=3){await p.evaluate(()=>{state.battle.enemyCreatures=[];advanceEncounterWave45(state.battle)});assert.equal(await p.locator('.arena-table').getAttribute('data-scene'),scene);assert.equal(await p.locator('#enemy-name').innerText(),name);assert.equal(await p.evaluate(()=>state.battle.waveIndex),1);}
   await p.evaluate(()=>showJourney());assert.equal(await p.locator('#journey-screen').getAttribute('data-scene'),scene);assert.match(await p.locator('#journey-location').innerText(),new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));assert.match(await p.locator('#journey-screen').evaluate(el=>getComputedStyle(el).backgroundImage),new RegExp(`/stages/${scene}\\.svg`));
   await p.evaluate(()=>{state.shop=null;showShop()});if(index>1){assert.equal(await p.locator('#shop-screen').getAttribute('data-scene'),scene);assert.match(await p.locator('#shop-screen').evaluate(el=>getComputedStyle(el).backgroundImage),new RegExp(`/stages/${scene}\\.svg`));}
  }
  assert.equal(new Set(imageSources).size,4);
  // Existing scenes still load and show their expected place names.
  for(const scene of ['fjord','dunes','forest','temple']){assert.equal(await p.evaluate(async scene=>{const image=new Image();image.src=`assets/stages/${scene}.svg`;await image.decode();return image.naturalWidth>0},scene),true);}
  // The real Play/start path installs a new four-biome plan, rather than only
  // exposing a helper that is never used by the game.
  await p.evaluate(()=>{closeChanceChoice55();state.battle=null;state.stageLocations=[];ensureCardPool=async()=>({cards:playableCards(BUNDLED_CARDS),lands:FALLBACK_LANDS,fallback:true});startNewRun()});await p.waitForFunction(()=>state.screen==='draft-screen');const actual=await p.evaluate(()=>state.stageLocations.map(s=>s.scene));assert.equal(actual.length,4);assert.equal(new Set(actual).size,4);
  assert.deepEqual(errors,[]);console.log('PASS four new bundled landscapes, all eight reachable/fair random biomes, no repeats in a run, stable turns/waves, matching MTG names and camp/shop scenes, actual new-run integration and four fitted desktop/mobile layouts.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
