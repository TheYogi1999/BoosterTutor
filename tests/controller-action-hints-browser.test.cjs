const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.removeItem('bt-input-settings-v1');localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','false');
   window.testPad79={index:0,id:'Xbox Wireless Controller',connected:true,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0,0,0]};
   Object.defineProperty(navigator,'getGamepads',{value:()=>[testPad79]});
  });
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await page.bringToFront();await page.waitForFunction(()=>controller.connected&&controller.ready);
  await page.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.catalogPool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;state.soundOn=false});
  const down=async i=>{await page.waitForFunction(()=>controller.ready);await page.evaluate(i=>testPad79.buttons[i]={pressed:true,value:1},i);await page.waitForFunction(i=>controller.previous[i]===true,i)};
  const up=async i=>{await page.evaluate(i=>testPad79.buttons[i]={pressed:false,value:0},i);await page.waitForFunction(i=>controller.previous[i]===false,i)};
  const press=async i=>{await down(i);await up(i)};
  const focus=async selector=>page.evaluate(s=>{controller.enable();controller.focus(document.querySelector(s))},selector);
  const badge=async(id,label,profile)=>{
   const locator=page.locator('#'+id+' > .input-action-hint79');await locator.waitFor({state:'attached'});assert.equal(await locator.count(),1);assert.equal(await locator.textContent(),label);
   assert.equal(await locator.locator('.input-'+profile).count(),1);assert.ok(await locator.locator('[role="img"]').getAttribute('aria-label'));
  };
  for(const [profile,id,confirm,advance,reroll] of [['xbox','Xbox Wireless Controller',0,'Y','RT'],['playstation','DualSense Wireless Controller',0,'△','R2'],['nintendo','Nintendo Switch Pro Controller (057e)',1,'X','ZR']]){
   await page.evaluate(id=>{
    testPad79.id=id;state.node=1;state.deck=[];state.boosterInterruption=null;state.draftKind='starter';state.packs=Array.from({length:6},()=>chooseRandomCards(state.pool,7));state.activePack=0;state.selection=new Map();state.rerolledPacks=new Set();state.boosterSealed=true;renderDraft();showScreen('draft-screen');
   },id);
   await page.waitForFunction(id=>controller.id===id&&controller.ready,id);
   // The trigger itself can wake automatic detection, but a sealed pack cannot reroll.
   await press(7);assert.equal(await page.evaluate(()=>controller.profile),profile);assert.equal(await page.evaluate(()=>state.rerolledPacks.size),0);
   await badge('pack-reroll',reroll,profile);await badge('draft-confirm',advance,profile);
   await focus('[data-open-pack]');await press(confirm);await page.waitForFunction(()=>!state.boosterSealed&&!boosterTravel);
   await focus('.draft-option');await press(confirm);assert.equal(await page.evaluate(()=>state.selection.get(0)),0);
   assert.ok((await page.locator('#draft-confirm').textContent()).includes('NEXT PACK'));await badge('draft-confirm',advance,profile);
   const before=await page.evaluate(()=>state.packs[0].map(c=>c.id).join(','));
   await press(9);await press(7);assert.equal(await page.evaluate(()=>state.packs[0].map(c=>c.id).join(',')),before,'Reroll is blocked by an open modal');await press(9);
   await down(7);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>state.rerolledPacks.size),1);assert.equal(await page.evaluate(()=>state.selection.size),0);await up(7);
   const after=await page.evaluate(()=>state.packs[0].map(c=>c.id).join(','));assert.notEqual(after,before);assert.equal(await page.locator('#pack-reroll').isDisabled(),true);
   await badge('pack-reroll',reroll,profile);await press(7);assert.equal(await page.evaluate(()=>state.packs[0].map(c=>c.id).join(',')),after,'Used reroll never fires twice');
   await focus('.draft-option');await press(confirm);await down(3);await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>state.activePack),1);assert.equal(await page.evaluate(()=>state.boosterSealed),true);await up(3);await badge('draft-confirm',advance,profile);
   await page.evaluate(()=>{state.activePack=5;state.boosterSealed=false;state.selection.set(5,0);renderDraft();renderDraft()});await badge('draft-confirm',advance,profile);assert.ok((await page.locator('#draft-confirm').textContent()).includes('BUILD DECK'));
   await page.evaluate(()=>{state.draftKind='reward';state.activePack=0;state.packs=[state.packs[0]];state.selection=new Map([[0,0]]);renderDraft()});await badge('draft-confirm',advance,profile);assert.ok((await page.locator('#draft-confirm').textContent()).includes('TAKE CARD'));
   await page.evaluate(()=>{document.querySelector('#draft-confirm').textContent='ADD TO HAND & RESUME →'});await badge('draft-confirm',advance,profile);
   // Real combat button rendering replaces innerHTML; the response action remains one-shot.
   await page.evaluate(()=>{state.deck=Array(40).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));beginBattle(1);window.advances79=0;state.battle.phase='attack';state.battle.priorityCallback=()=>{advances79++;state.battle.phase='blocks';renderBattle()};renderBattle()});
   await badge('end-turn-button',advance,profile);assert.ok((await page.locator('#end-turn-button').textContent()).includes('CONTINUE'));
   await down(3);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>advances79),1);await up(3);await badge('end-turn-button',advance,profile);assert.ok((await page.locator('#end-turn-button').textContent()).includes('CONFIRM BLOCKS'));
   await page.evaluate(()=>{state.battle.phase='attack';state.battle.priorityCallback=null;renderBattle()});await badge('end-turn-button',advance,profile);assert.equal(await page.locator('#end-turn-button').isDisabled(),true);await press(3);assert.equal(await page.evaluate(()=>advances79),1);
   await page.evaluate(()=>{state.battle.phase='main';renderBattle()});await badge('end-turn-button',advance,profile);assert.ok((await page.locator('#end-turn-button').textContent()).includes('START COMBAT'));
   await press(7);assert.equal(await page.evaluate(()=>state.rerolledPacks.size),1,'Trigger never rerolls a hidden pack from combat');
   await page.evaluate(()=>{renderBattle();renderBattle();renderBattle()});await badge('end-turn-button',advance,profile);
  }
  // Manual overrides and non-controller input keep the buttons in sync immediately.
  await page.evaluate(()=>{controller.setAutomatic(false);controller.setProfile('playstation')});await badge('end-turn-button','△','playstation');await badge('pack-reroll','R2','playstation');
  for(const profile of ['keyboard','touch']){await page.evaluate(p=>controller.setProfile(p),profile);assert.equal(await page.locator('.input-action-hint79').count(),0)}
  await page.evaluate(()=>{controller.setProfile('xbox');state.node=2;state.shop=null;showShop()});await page.locator('#shop-continue').waitFor();await badge('shop-continue','Y','xbox');
  await page.evaluate(()=>{showScreen('combat-screen');state.battle.phase='blocks';renderBattle()});
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
   assert.equal(await page.locator('#end-turn-button').evaluate(b=>{const r=b.getBoundingClientRect(),g=b.querySelector('.input-action-hint79').getBoundingClientRect();return g.left>=r.left&&g.right<=r.right&&g.top>=r.top&&g.bottom<=r.bottom&&b.scrollWidth<=b.clientWidth+1}),true,'Combat glyph fits '+viewport.width);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
  }
  await page.setViewportSize({width:1600,height:900});await page.screenshot({path:'work/action79-combat.png'});
  await page.evaluate(()=>{state.draftKind='starter';state.activePack=0;state.packs=Array.from({length:6},()=>chooseRandomCards(state.pool,7));state.selection=new Map([[0,0]]);state.rerolledPacks=new Set();state.boosterSealed=false;renderDraft();showScreen('draft-screen')});
  await badge('draft-confirm','Y','xbox');await badge('pack-reroll','RT','xbox');await page.screenshot({path:'work/action79-packs.png'});
  assert.deepEqual(errors,[]);console.log('PASS on-button Xbox/PS/Nintendo Continue/Reroll glyphs, automatic trigger detection, actual one-use rerolls, sealed/modal/combat guards, held-button safety, all draft/combat captions, repeated renders, manual/non-controller layouts and fitted combat buttons.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
