const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  await p.waitForFunction(()=>typeof MINION_TYPES67!=='undefined');
  assert.equal(await p.locator('.brand-version').innerText(),'v0.70');
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
  const fits=()=>p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
  const drag=async(source,target)=>{
   const a=await p.locator(source).boundingBox(),z=await p.locator(target).boundingBox();
   await p.mouse.move(a.x+a.width/2,a.y+Math.min(30,a.height/2));await p.mouse.down();
   await p.mouse.move(z.x+z.width/2,z.y+z.height/2,{steps:20});await p.mouse.up();
   await p.waitForFunction(()=>!document.querySelector('#drag-ghost'));await p.waitForTimeout(180);
  };
  await setup();
  for(const viewport of [{width:1600,height:900},{width:1920,height:1080},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await p.setViewportSize(viewport);await fits();
   const geometry=await p.evaluate(()=>{
    const r=s=>document.querySelector(s).getBoundingClientRect(),inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
    const cards=[...document.querySelectorAll('#creature-row .player-card-frame')],types=[...document.querySelectorAll('.enemy-type67')];
    return{
     noPageScroll:document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1&&scrollY===0,
     cardsFit:cards.every(c=>inside(c.getBoundingClientRect(),r('#creature-row'))),
     typeRowsClear:types.every(t=>{const m=t.closest('.monster');return t.getBoundingClientRect().top>=m.querySelector('strong').getBoundingClientRect().bottom-1&&t.getBoundingClientRect().bottom<=m.querySelector('.monster-life').getBoundingClientRect().top+1}),
     levelBelowAvatar:r('#run-level').top>=r('#player-avatar').bottom,
     mulliganBelowTitle:r('#mulligan-button').top>=r('.hand-title-group>div').bottom,
     actionBelowGraveyard:r('.combat-actions-panel').top>=r('.table-graveyard').bottom,
     zonesInRightColumn:inside(r('#graveyard-button'),r('.battle-utility-stack'))&&inside(r('#exile-button'),r('.battle-utility-stack'))&&inside(r('#end-turn-button'),r('.battle-utility-stack')),
     manaBeforeCreatures:r('.mana-display').bottom<r('#creature-row').top,
     rowColumns:getComputedStyle(document.getElementById('creature-row')).gridTemplateColumns.split(' ').length,
     foes:document.querySelectorAll('#enemy-board .monster').length,
     noAttackControls:!document.querySelector('[data-unit-target],[data-unit-attack],[data-unit-withdraw]'),
     colored:document.querySelectorAll('#creature-row .keyword-tag61').length>=4
    };
   });
   for(const [key,value] of Object.entries(geometry))assert.equal(value,key==='rowColumns'||key==='foes'?6:true,`${viewport.width} ${key}`);
  }
  await p.setViewportSize({width:1600,height:900});await fits();
  // New art is local, decodes correctly, and all enemy portraits share the same dimensions.
  assert.equal(await p.evaluate(async()=>{for(const kind of Object.keys(MINION_TYPES67)){const img=new Image();img.src=`assets/portraits/${kind}.jpg`;await img.decode();if(img.naturalWidth<100)return false}return true}),true);
  assert.equal(await p.evaluate(()=>Math.abs(document.querySelector('.small-enemy67 .walker-portrait').getBoundingClientRect().height-document.querySelector('.monster:not(.small-enemy67) .walker-portrait').getBoundingClientRect().height)<.1),true);
  // Enemy selection + creature click queues, another click withdraws, and retargeting uses the new selection.
  await p.locator('.monster').nth(2).click();await p.locator('[data-creature-id="unit1"]').click();
  assert.equal(await p.evaluate(()=>state.battle.creatures[1].attackTargetId===state.battle.enemyCreatures[2].id&&state.battle.creatures[1].willAttack),true);
  await p.locator('[data-creature-id="unit1"]').click();assert.equal(await p.evaluate(()=>state.battle.creatures[1].willAttack),false);
  await p.locator('.monster').nth(4).click();await p.locator('[data-creature-id="unit1"]').click();
  assert.equal(await p.evaluate(()=>state.battle.creatures[1].attackTargetId===state.battle.enemyCreatures[4].id),true);
  await p.locator('[data-creature-id="unit1"]').click();
  // Pointer attacks and a real hand-to-field cast still work with the narrower slots.
  await drag('[data-creature-id="unit1"]','.monster:nth-child(3)');assert.equal(await p.evaluate(()=>state.battle.creatures[1].willAttack),true);
  await p.evaluate(()=>{state.battle.creatures.pop();state.battle.hand=[runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'))];renderBattle()});
  assert.equal(await p.locator('.creature-slot-empty67').count(),1);
  await drag('[data-hand-index="0"]','#player-drop-zone');assert.equal(await p.evaluate(()=>state.battle.creatures.length),6);
  assert.equal(await p.locator('.creature-slot-empty67').count(),0);
  // Mana and creature ability controls stay available; mana tapping cannot also queue an attack.
  await p.locator('[data-unit-mana="unit2"]').click();assert.equal(await p.evaluate(()=>state.battle.floatingMana),1);assert.equal(await p.evaluate(()=>state.battle.creatures[2].willAttack),false);
  await p.locator('[data-creature-ability66="unit3"]').click();assert.equal(await p.locator('#creature-ability-dialog').evaluate(d=>d.open),true);
  await p.locator('#creature-ability-cancel').click();
  // Attached cards remain selectable, even beneath a rotated host and in a long stack.
  await p.evaluate(()=>{const b=state.battle;b.creatures[0].tapped=true;b.permanents.push(...Array.from({length:6},(_,i)=>({id:'attached'+i,card:runCard59(BUNDLED_CARDS.find(c=>c.name==='Short Sword')),attachedTo:b.creatures[0].id})));refreshPermanentEffects();renderBattle();controller.enable();controller.focus(document.querySelector('[data-permanent-id="attached5"]'))});
  assert.equal(await p.locator('.unit-attachments').first().evaluate(el=>el.scrollTop>0),true);
  await p.locator('[data-permanent-id="attached5"]').click();assert.equal(await p.locator('#token-action-dialog').evaluate(d=>d.open),true);await p.locator('#token-action-cancel').click();
  // Phase progression lives at lower right. An instant in hand holds the attack response window.
  await setup();await p.locator('.monster').nth(2).click();await p.locator('[data-creature-id="unit1"]').click();await p.locator('#end-turn-button').click();
  await p.waitForFunction(()=>state.battle.phase==='attack'&&state.battle.priorityCallback);
  await p.locator('[data-creature-id="unit1"]').click();assert.equal(await p.evaluate(()=>state.battle.activeAttackIds.includes('unit1')),false);
  // Six attack/block rows fit; multiple blockers are selected directly and may be removed.
  await setup();await p.evaluate(()=>{state.battle.phase='blocks';state.battle.enemyCreatures.forEach(e=>{e.flying=false;e.menace=false});renderBattle()});
  assert.equal(await p.locator('[data-block-attacker]').count(),6);
  await p.locator('.monster').nth(2).click();await p.locator('[data-creature-id="unit0"]').click();await p.locator('[data-creature-id="unit1"]').click();
  assert.equal(await p.evaluate(()=>blockerIds(state.battle,state.battle.enemyCreatures[2].id).length),2);
  await p.locator('[data-creature-id="unit1"]').click();assert.equal(await p.evaluate(()=>blockerIds(state.battle,state.battle.enemyCreatures[2].id).length),1);
  assert.equal(await p.evaluate(()=>{const r=document.querySelector('#blocking-panel').getBoundingClientRect();return [...document.querySelectorAll('.block-pair')].every(e=>e.getBoundingClientRect().bottom<=r.bottom+1)}),true);
  await p.screenshot({path:'work/compact67-blocks.png'});
  await p.evaluate(()=>{const b=state.battle;b.blockAssignments=new Map([[b.enemyCreatures[2].id,b.creatures.map(u=>u.id)]]);renderBattle()});
  assert.equal(await p.evaluate(()=>{const r=document.querySelector('#blocking-panel').getBoundingClientRect();return [...document.querySelectorAll('.block-pair')].every(e=>e.getBoundingClientRect().bottom<=r.bottom+1)}),true,'six blockers in one assignment stay contained');
  // Graveyard and Exile buttons still open their corresponding collections from the right.
  await p.evaluate(()=>{const b=state.battle;b.graveyard=[BUNDLED_CARDS.find(c=>c.name==='Shock')];b.exile=[BUNDLED_CARDS.find(c=>c.name==='Murder')];renderBattle()});
  await p.locator('#graveyard-button').click();assert.equal(await p.locator('#graveyard-dialog').evaluate(d=>d.open),true);await p.evaluate(()=>document.querySelector('#graveyard-dialog').close());
  await p.locator('#exile-button').click();assert.equal(await p.locator('#collection-dialog').evaluate(d=>d.open),true);assert.match(await p.locator('#collection-title').innerText(),/Exile/);await p.evaluate(()=>document.querySelector('#collection-dialog').close());
  // Controller zones include the relocated action controls.
  await p.evaluate(()=>{controller.enable();controller.focus(document.getElementById('end-turn-button'))});assert.equal(await p.evaluate(()=>controller.zone(controller.focused)),'actions');
  await setup();await p.screenshot({path:'work/compact67-final.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS v0.70 brand; compact zone/level/Mulligan placement; six whole cards and six enemy/type rows; five viewport sizes without page scrolling; six local minion images; direct targeting/withdrawal, real pointer attack and hand casting; sixth slot; mana/ability controls; attack response; six-way multiblocking; graveyard/exile; relocated controller actions.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
