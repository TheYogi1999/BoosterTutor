const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  await p.waitForFunction(()=>typeof MINION_TYPES67!=='undefined');
  assert.equal(await p.locator('.brand-version').innerText(),'v0.72');
  const setup=async()=>p.evaluate(()=>{
   document.querySelectorAll('dialog[open]').forEach(d=>d.close());
   closeX66();closeCreatureAbility66();closeJesterChoice65();closeTokenAction47();abortTutorSearch51();abortDiceRoll50();abortReactionChecks52();
   state.soundOn=false;state.suppressClickUntil=0;state.playerHealth=30;state.level=14;state.runStarted59=true;state.campTokens=[];
   state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;
   state.deck=Array.from({length:60},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')));beginBattle(1);syncRunProgress59();
   const b=state.battle;b.turn=2;b.phase='main';b.floatingMana=0;
   b.lands=Array.from({length:12},(_,i)=>({id:'land'+i,card:FALLBACK_LANDS[i%5],tapped:false}));
   b.creatures=['Serra Angel','Grizzly Bears','Birds of Paradise','Goblin Fireslinger','Murderous Redcap','Shivan Dragon'].map((name,i)=>{
    const card=runCard59(BUNDLED_CARDS.find(c=>c.name===name));return{id:'unit'+i,card,owner:'player',...parseStats(card),...creatureKeywords(card),summonedTurn:0,tapped:false,willAttack:false,summoningSick:false};
   });
   b.enemyCreatures=['dragon','bulwark','goblin','goblinArsonist','rat','myr'].map(kind=>createFoe(kind,4));
   b.enemyCreatures.forEach(e=>{e.summonedTurn=0;e.summoningSick=false;e.pattern=['attack'];e.health=e.maxHealth=100;e.counterspell=false;e.ward=0;e.hexproof=false});
   b.waves=[b.enemyCreatures];b.waveIndex=0;b.entriesSeen66=new Set(b.enemyCreatures.map(e=>e.id));
   b.permanents=Array.from({length:16},(_,i)=>({id:'loose'+i,card:{...CAMP_TOKEN_CARDS.treasure,campToken:true,tokenKind:'treasure'},isToken:true}));
   b.hand=Array.from({length:10},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Shock')));syncMana(b);renderBattle();
  });
  const settleFocus=async()=>p.waitForTimeout(170);
  const outside=async()=>{await p.mouse.move(20,890);await settleFocus()};
  const background=async()=>{const r=await p.locator('.enemy-panel').boundingBox();await p.mouse.click(r.x+r.width*.55,r.y+r.height-7);await outside()};
  const arrowPoint=async()=>p.evaluate(()=>{
   const svg=document.querySelector('#combat-arrows'),m=svg.getScreenCTM(),paths=[...svg.querySelectorAll('.route-enemy .route-line')];
   for(const path of paths)for(const t of [.25,.35,.45,.55,.65,.75]){
    const v=path.getPointAtLength(path.getTotalLength()*t),screen=v.matrixTransform(m),under=document.elementFromPoint(screen.x,screen.y);
    if(!under?.closest('.arena-table')||under.closest('[data-creature-id]'))continue;
    const free=paths.filter(other=>other!==path).every(other=>Array.from({length:90},(_,i)=>other.getPointAtLength(other.getTotalLength()*i/89)).every(q=>Math.hypot(v.x-q.x,v.y-q.y)*m.a>13));
    if(free)return{x:screen.x,y:screen.y,key:path.parentElement.dataset.routeKey};
   }
   throw Error('No isolated point on a visible enemy attack arrow');
  });
  await setup();await outside();
  // The SVG never intercepts pointer input; direct stroke hover uses proximity.
  assert.equal(await p.locator('#combat-arrows').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844}]){
   await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);await p.evaluate(()=>drawCombatArrows());
   const point=await arrowPoint();await p.mouse.move(point.x,point.y);
   await p.waitForFunction(key=>document.querySelector('.arrow-focused70')?.dataset.routeKey===key,point.key);await settleFocus();
   const opacity=await p.locator('.combat-route').evaluateAll(nodes=>nodes.map(n=>({active:n.classList.contains('arrow-focused70'),opacity:+getComputedStyle(n).opacity,filter:getComputedStyle(n).filter})));
   assert.equal(opacity.filter(x=>x.active).length,1);assert.ok(opacity.find(x=>x.active).filter.includes('brightness'));
   assert.ok(opacity.filter(x=>!x.active).every(x=>x.opacity>.5&&x.opacity<.86));
  }
  await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>document.querySelector('.game-shell').getBoundingClientRect().width===1600);await outside();
  // Selected enemy emphasis survives pointer exit; own-creature hover takes temporary priority.
  await p.locator('.monster').nth(4).click();const foe=await p.evaluate(()=>state.battle.enemyCreatures[4].id);await outside();
  assert.equal(await p.locator('.arrow-focused70').evaluateAll(nodes=>nodes.every(n=>n.dataset.fromId===state.battle.enemyCreatures[4].id)),true);
  await p.locator('[data-creature-id="unit0"]').click();await p.waitForFunction(()=>document.querySelector('.arrow-focused70')?.dataset.fromId==='unit0');
  await outside();assert.equal(await p.locator('.arrow-focused70').first().getAttribute('data-from-id'),foe);
  await background();assert.equal(await p.evaluate(()=>state.battle.selectedEnemyTargetId),null);assert.equal(await p.locator('.monster.selected').count(),0);assert.equal(await p.locator('.arrow-focused70').count(),0);
  assert.equal(await p.evaluate(()=>state.battle.creatures[0].willAttack&&state.battle.creatures[0].attackTargetId===state.battle.enemyCreatures[4].id),true);
  // Pointer dragging remains actionable underneath highlighted strokes.
  const a=await p.locator('[data-creature-id="unit1"]').boundingBox(),z=await p.locator('.monster').nth(2).boundingBox();await p.mouse.move(a.x+a.width/2,a.y+20);await p.mouse.down();await p.mouse.move(z.x+z.width/2,z.y+z.height/2,{steps:20});await p.mouse.up();
  await p.waitForFunction(()=>state.battle.creatures[1].willAttack);assert.equal(await p.evaluate(()=>state.battle.creatures[1].attackTargetId===state.battle.enemyCreatures[2].id),true);
  await outside();await p.screenshot({path:'work/arrow-focus70-selected.png'});
  // A real cast draws even flying/menacing attacks to a sick, tapped Taunting Elf.
  await setup();await p.evaluate(()=>{const b=state.battle;b.creatures=[];b.permanents=[];b.hand=[runCard59(BUNDLED_CARDS.find(c=>c.name==='Taunting Elf'))];b.enemyCreatures.forEach(e=>{e.power=2;e.flying=true;e.menace=true;e.trample=false});renderBattle()});
  await p.locator('[data-hand-index="0"]').click();assert.equal(await p.locator('.keyword-strip [data-keyword="lure"]').count(),1);
  const elf=await p.evaluate(()=>state.battle.creatures[0].id);await p.evaluate(()=>{state.battle.creatures[0].tapped=true;state.battle.phase='blocks';renderBattle()});
  await p.waitForFunction(id=>document.querySelectorAll(`[data-arrow-kind="enemy"][data-to-id="${id}"]`).length===6,elf);
  assert.equal(await p.locator('[data-arrow-kind="enemy"][data-to-id="player"]').count(),0);assert.match(await p.locator('#blocking-summary').innerText(),/Lure/);assert.equal(await p.locator('#auto-block').isDisabled(),true);assert.equal(await p.locator('#end-turn-button').isEnabled(),true);
  await p.locator('[data-creature-id]').hover();await p.waitForFunction(()=>document.querySelectorAll('.arrow-focused70').length===6);await p.screenshot({path:'work/lure70-six-attackers.png'});
  await p.locator('#end-turn-button').click();await p.waitForFunction(()=>state.battle.turn===3&&state.battle.phase==='main');
  assert.equal(await p.evaluate(()=>state.playerHealth),30);assert.equal(await p.evaluate(()=>state.battle.creatures.length),0);assert.equal(await p.evaluate(()=>state.battle.graveyard.some(c=>c.name==='Taunting Elf')),true);
  await p.waitForFunction(()=>document.querySelectorAll('[data-arrow-kind="enemy"][data-to-id="player"]').length===6);
  // Removing Lure during the instant window immediately restores ordinary blocking and routes.
  await p.evaluate(()=>{const b=state.battle;b.phase='main';b.hand=[runCard59(BUNDLED_CARDS.find(c=>c.name==='Taunting Elf'))];b.floatingMana=12;syncMana(b);renderBattle()});await p.locator('[data-hand-index="0"]').click();
  const nextElf=await p.evaluate(()=>state.battle.creatures[0].id);await p.evaluate(()=>{state.battle.phase='blocks';state.battle.hand=[runCard59(BUNDLED_CARDS.find(c=>c.name==='Shock'))];renderBattle()});await p.locator('[data-hand-index="0"]').click();await p.locator(`[data-rule-pick="player:${nextElf}"]`).click();await p.locator('#rule-confirm').click();
  assert.equal(await p.evaluate(()=>activeLure70()),null);assert.equal(await p.locator('#auto-block').isEnabled(),true);await p.waitForFunction(()=>document.querySelectorAll('[data-arrow-kind="enemy"][data-to-id="player"]').length===6);
  // Background deselection during blocks preserves the declared assignment.
  await setup();await p.evaluate(()=>{state.battle.phase='blocks';state.battle.enemyCreatures.forEach(e=>e.flying=false);renderBattle()});await p.locator('.monster').nth(1).click();await p.locator('[data-creature-id="unit1"]').click();await background();
  assert.equal(await p.evaluate(()=>state.battle.selectedEnemyAttackerId),null);assert.equal(await p.evaluate(()=>blockerIds(state.battle,state.battle.enemyCreatures[1].id).includes('unit1')),true);
  await p.evaluate(()=>openCollection('catalog'));await p.locator('#collection-keyword').selectOption('lure');assert.equal(await p.locator('.collection-entry').count(),1);assert.match(await p.locator('.collection-full-rules').innerText(),/instead of you/);
  assert.deepEqual(errors,[]);console.log('PASS arrow-stroke hover and subtle dimming at three scales, selected enemy/own attack priority and restoration, click-through dragging, main/block background deselection preserving attacks/blocks, real Lure cast and six Flying/Menace attackers targeting a tapped/sick Elf, lethal combat protecting life, instant removal restoring routes/blocks, and colored Lure collection filtering.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
