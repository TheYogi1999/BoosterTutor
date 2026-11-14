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
  await setup();
  const atlas=await p.evaluate(async()=>{const i=new Image();i.src='assets/portraits/enemies-v68.webp';await i.decode();return{i:i.naturalWidth,h:i.naturalHeight}});assert.equal(atlas.i,atlas.h);assert.ok(atlas.i>=1000);
  assert.equal(await p.locator('#graveyard-open').count(),0);
  await p.evaluate(()=>{const b=state.battle;b.lands=Array.from({length:24},(_,i)=>({id:'land'+i,card:FALLBACK_LANDS[i%5],tapped:i%3===0}));b.floatingMana=12;syncMana(b);renderBattle();drawCombatArrows()});
  for(const viewport of [{width:1600,height:900},{width:1920,height:1080},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);await p.evaluate(()=>drawCombatArrows());
   const a=await p.evaluate(()=>{
    const r=e=>e.getBoundingClientRect(),q=s=>document.querySelector(s),avatar=r(q('#player-avatar')),points=[...document.querySelectorAll('[data-player-attack-anchor]')].map(r),life=r(q('.side-identity')),mana=r(q('.mana-display')),lands=q('#mana-land-row');
    const arrows=[...document.querySelectorAll('[data-arrow-kind="enemy"][data-to-id="player"]')],svg=q('#combat-arrows'),matrix=svg.getScreenCTM();
    const destinations=arrows.map(g=>{const c=g.querySelector('.route-target'),pt=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(matrix),slot=state.battle.playerAttackAnchors68.get(g.dataset.fromId),box=r(q(`[data-player-attack-anchor="${slot}"]`));return Math.abs(pt.x-box.x-box.width/2)<.1&&Math.abs(pt.y-box.y-box.height/2)<.1});
    const paths=arrows.map(g=>g.querySelector('.route-line'));
    const smooth=paths.every(path=>/^M [-\d.]+ [-\d.]+ C [-\d., ]+$/.test(path.getAttribute('d')));
    const uniqueCurves=new Set(paths.map(p=>p.getAttribute('d'))).size===arrows.length;
    const samples=paths.map(path=>Array.from({length:45},(_,i)=>path.getPointAtLength(path.getTotalLength()*(.12+i*.76/44))));
    let longestSharedRun=0;
    for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){let run=0;for(const a of samples[i]){const nearby=samples[j].some(b=>Math.hypot(a.x-b.x,a.y-b.y)<10);run=nearby?run+1:0;longestSharedRun=Math.max(longestSharedRun,run)}}
    const portraits=[...document.querySelectorAll('#enemy-board .walker-portrait')].map(r);
    return{square:Math.abs(avatar.width/avatar.height-1)<.01,xs:new Set(points.map(x=>Math.round(x.x*10))).size,ys:new Set(points.map(x=>Math.round(x.y*10))).size,invisible:getComputedStyle(q('.player-attack-anchors68')).opacity==='0',pointsClear:points.every(x=>x.x>life.right+avatar.width/7.2&&x.x>mana.right),arrows:arrows.length,endpoints:destinations.every(Boolean),smooth,uniqueCurves,separateBows:longestSharedRun<23,equalPortraits:portraits.every(x=>Math.abs(x.width-portraits[0].width)<.1&&Math.abs(x.height-portraits[0].height)<.1&&Math.abs(x.width/x.height-.8)<.01),twoLandRows:getComputedStyle(lands).gridTemplateRows.split(' ').length===2,landOverflow:lands.scrollWidth>lands.clientWidth,noPageScroll:document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1};
   });
   for(const [k,v] of Object.entries(a))assert.equal(v,k==='xs'?3:k==='ys'?2:k==='arrows'?6:true,`${viewport.width}: ${k}`);
   await p.evaluate(()=>{controller.enable();controller.focus(document.querySelector('[data-preview-id="land23"]'))});
   assert.equal(await p.locator('#mana-land-row').evaluate(el=>{const a=el.getBoundingClientRect(),c=el.querySelector('[data-preview-id="land23"]').getBoundingClientRect();return el.scrollLeft>0&&c.left>=a.left-1&&c.right<=a.right+1&&c.bottom<=a.bottom+1}),true);
  }
  await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>document.querySelector('.game-shell').getBoundingClientRect().width===1600);
  // Smaller formations keep flowing paths too; rerendering never rerolls their bows.
  for(const count of [1,2,3,4,5,6]){
   await setup();await p.evaluate(count=>{const b=state.battle;b.enemyCreatures=b.enemyCreatures.slice(0,count);b.waves=[b.enemyCreatures];renderBattle();drawCombatArrows()},count);
   const before=await p.locator('[data-arrow-kind="enemy"] .route-line').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')));
   assert.equal(before.length,count);assert.equal(before.every(d=>/^M [-\d.]+ [-\d.]+ C [-\d., ]+$/.test(d)),true);
   await p.evaluate(()=>{renderBattle();drawCombatArrows()});
   assert.deepEqual(await p.locator('[data-arrow-kind="enemy"] .route-line').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d'))),before);
  }
  // Every kind uses its own original generated atlas tile, at equal dimensions.
  for(let offset=0;offset<20;offset+=6){await p.evaluate(offset=>{const b=state.battle;b.enemyCreatures=Object.keys(FOE_TYPES).slice(offset,offset+6).map(k=>createFoe(k,4));b.waves=[b.enemyCreatures];renderBattle()},offset);assert.equal(await p.locator('.monster-figure .walker-portrait').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).backgroundImage.includes('enemies-v68.webp')&&n.getBoundingClientRect().width===80&&n.getBoundingClientRect().height===100)),true);}
  // Power is a live sword stat beside life, not just an intention label.
  await setup();await p.evaluate(()=>{const e=state.battle.enemyCreatures[2];e.power=9;e.health=47;renderBattle()});
  assert.equal(await p.locator('.monster').nth(2).locator('.stat-power b').innerText(),'9');assert.equal(await p.locator('.monster').nth(2).locator('.stat-life b').innerText(),'47');
  assert.equal(await p.locator('.monster-life').evaluateAll(nodes=>nodes.every(n=>{const a=n.querySelector('.stat-power').getBoundingClientRect(),b=n.querySelector('.stat-life').getBoundingClientRect();return Math.abs(a.top-b.top)<1&&a.right<=b.left})),true);
  await p.evaluate(()=>{const b=state.battle;b.creatures=[];b.permanents=[];b.hand=['Grizzly Bears','Birds of Paradise','Thunderclap Wyvern'].map(n=>runCard59(BUNDLED_CARDS.find(c=>c.name===n)));renderBattle()});
  for(let i=0;i<3;i++)await p.locator('[data-hand-index="0"]').click();
  assert.deepEqual(await p.evaluate(()=>state.battle.creatures.map(u=>[u.card.name,hasCreatureKeyword(u,'flying'),u.power,u.toughness])),[['Grizzly Bears',false,2,2],['Birds of Paradise',true,1,2],['Thunderclap Wyvern',true,2,3]]);
  await p.locator('[data-creature-id]').last().hover();assert.match(await p.locator('#inspector-content').innerText(),/Does not grant Flying/);
  await p.locator('#graveyard-button').click();assert.equal(await p.locator('#graveyard-dialog').evaluate(d=>d.open),true);await p.locator('#graveyard-close').click();
  await setup();await p.evaluate(()=>drawCombatArrows());await p.screenshot({path:'work/portrait-hud69-final.png'});
  assert.deepEqual(errors,[]);console.log('PASS v0.72: square avatar; invisible 2x3 attack anchors with six exact unique endpoints and separate smooth cubic bows; two-row 24-land scroll and controller reveal; five viewports; 20 generated equal-size portrait tiles; live sword power beside life; correct actual Wyvern cast with no Flying grant; graveyard button without duplicate link.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
