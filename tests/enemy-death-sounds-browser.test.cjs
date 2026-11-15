const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','true');localStorage.setItem('bt-sfx-volume','100');
   window.deathEvents77=[];const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){if(this.cueName?.startsWith('enemy-death-'))deathEvents77.push({name:this.cueName,duration:this.buffer.duration,gain:this.voiceGain.gain.value});return start.apply(this,args)};
  });
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await page.mouse.click(760,800);
  await page.evaluate(async()=>{
   await soundEngine.resume();await Promise.all(selectedActionCues.map(name=>recordedSoundBuffer(RECORDED_SFX[name][0])));
   state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.deck=Array(40).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));beginBattle(1);soundEngine.stop();deathEvents77=[];
   window.freshEnemy77=kind=>{soundEngine.stop();deathEvents77=[];const b=state.battle;b.phase='main';b.resolvingSpellTarget=null;b.enemyCounterWindow=null;window.victim77=createFoe(kind,1);b.enemyCreatures=[victim77,createFoe('bulwark',1)];b.creatures=[];return victim77};
  });
  const expected={goblin:'small',goblinArsonist:'small',goblinSneak:'small',rat:'small',saproling:'small',myr:'small',wisp:'small',sprite:'small',sprout:'medium',duelist:'medium',boar:'medium',raider:'medium',wolf:'medium',stalker:'medium',bulwark:'medium',archivist:'medium',vampire:'medium',dragon:'large',tyrant:'large',sphinx:'large'};
  for(const [kind,size] of Object.entries(expected)){
   await page.evaluate(kind=>{freshEnemy77(kind);victim77.health=victim77.maxHealth=1000;window.beforeCoins77=state.coins;window.beforeLevel77=state.level;damageFirstEnemy(1000,victim77);renderBattle();awardBounty(victim77);renderBattle()},kind);
   await page.waitForFunction(()=>deathEvents77.length===1);
   const [event]=await page.evaluate(()=>deathEvents77);assert.equal(event.name,'enemy-death-'+size,kind);
   assert.ok(event.duration>({small:.4,medium:.7,large:1.2}[size])&&event.duration<({small:.7,medium:1.1,large:1.7}[size]));
   assert.ok(Math.abs(event.gain-.85)<.00001);assert.equal(await page.evaluate(()=>state.coins-beforeCoins77),await page.evaluate(()=>victim77.bounty));assert.equal(await page.evaluate(()=>state.level-beforeLevel77),1);
  }
  // Nonlethal hits, living state checks and player creature deaths never count as enemy defeats.
  await page.evaluate(()=>{freshEnemy77('goblin');damageFirstEnemy(1,victim77);state.battle.enemyCreatures=removeDeadCreatures(state.battle.enemyCreatures,'enemy');const card=BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears');state.battle.creatures=[{id:'own-dead77',owner:'player',card,power:2,toughness:2,damage:2}];state.battle.creatures=removeDeadCreatures(state.battle.creatures,'player');renderBattle()});
  await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>deathEvents77.length),0);
  // Combat deaths, ten poison, destroy and exile all reach the single defeat hook.
  for(const route of ['combat','poison','destroy','exile']){
   await page.evaluate(route=>{
    freshEnemy77('duelist');const b=state.battle;
    if(route==='combat'){const card=BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears');const ally={id:'striker77',owner:'player',card,power:30,toughness:30,firstStrike:true,summonedTurn:0};b.creatures=[ally];victim77.firstStrike=false;resolveCombatDamage([ally],new Map([[ally.id,[victim77]]]),'player');}
    else if(route==='poison'){addPoison60(victim77,10,b);b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');}
    else{b.resolvingSpellTarget={side:'enemy',id:victim77.id};removeSpellTarget(route);}
    awardBounty(victim77);renderBattle();
   },route);
   await page.waitForFunction(()=>deathEvents77.length===1);assert.equal(await page.evaluate(()=>deathEvents77[0].name),'enemy-death-medium',route);
  }
  // Six simultaneous minion deaths produce six voices, with no size-wide cooldown losing events.
  await page.evaluate(()=>{freshEnemy77('goblin');const b=state.battle;b.enemyCreatures=['goblin','goblinSneak','rat','myr','saproling','goblinArsonist'].map(kind=>createFoe(kind,1));b.enemyCreatures.forEach(e=>e.health=0);b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');renderBattle()});
  await page.waitForFunction(()=>deathEvents77.length===6);assert.equal(await page.evaluate(()=>deathEvents77.every(e=>e.name==='enemy-death-small')),true);
  for(const mode of ['mute','zero','hidden','pending']){
   await page.evaluate(mode=>{
    freshEnemy77('goblin');setEffectsPreferences75(true,40);
    if(mode==='mute')setEffectsPreferences75(false,40);
    if(mode==='zero')setEffectsPreferences75(true,0);
    if(mode==='hidden'){Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}
    damageFirstEnemy(100,victim77);
    if(mode==='pending')setEffectsPreferences75(false,40);
   },mode);
   await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>deathEvents77.length),0,mode);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});setEffectsPreferences75(true,40)});
  }
  await page.evaluate(()=>{freshEnemy77('dragon');damageFirstEnemy(1000,victim77)});await page.waitForFunction(()=>deathEvents77.length===1);
  assert.ok(Math.abs(await page.evaluate(()=>soundEngine.effectsGain.gain.value)-.4)<.00001);assert.equal(await page.locator('#background-music').evaluate(a=>a.paused),true);
  await page.evaluate(()=>setEffectsPreferences75(false,40));assert.equal(await page.evaluate(()=>soundEngine.voices.size),0);
  // The final enemy's cue survives the immediate reward-screen transition.
  await page.evaluate(()=>{setEffectsPreferences75(true,40);freshEnemy77('dragon');state.battle.enemyCreatures=[victim77];damageFirstEnemy(1000,victim77);winBattle();if(state.screen==='results-screen')encounterPresentation82.continue()});
  await page.waitForFunction(()=>deathEvents77.length===1);assert.equal(await page.evaluate(()=>state.screen),'draft-screen');assert.equal(await page.evaluate(()=>deathEvents77[0].name),'enemy-death-large');
  assert.match(await page.locator('.brand-version').textContent(),/^v\d+\.\d+$/);assert.deepEqual(errors,[]);
  console.log('PASS all 20 enemy kinds and scaled health, one defeat cue/bounty/level, nonlethal and own-death silence, combat/poison/destroy/exile, six simultaneous defeats, mute/volume/hidden/pending cleanup and final-enemy reward transition.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
