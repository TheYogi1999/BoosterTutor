const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
 const setup=async()=>p.evaluate(()=>{
  state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;
  state.deck=[...Array(40).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')),...generateStarterManaCards(4)];
  state.campTokens=['treasure','food','clue'].map(kind=>({id:kind,kind}));beginBattle(3);state.playerHealth=39;
  const b=state.battle;b.turn=2;b.enemyCreatures=['sphinx','vampire','bulwark'].map(kind=>createFoe(kind,4));b.waves=[b.enemyCreatures];b.waveIndex=0;b.hand=[];renderBattle();
 });
 const open=async kind=>{await p.locator(`[data-camp-token-kind="${kind}"]`).click();assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),true)};
 const confirm=p.locator('#token-action-confirm');
 await setup();await open('food');
 assert.match(await p.locator('#token-action-effect').innerText(),/Gain 3 life/);
 assert.match(await p.locator('#token-action-cost').innerText(),/2 generic mana · tap · sacrifice/);
 assert.equal(await p.locator('#inspector-content [data-activate-permanent]').count(),0);
 assert.equal(await p.evaluate(()=>state.playerHealth),39);assert.equal(await p.evaluate(()=>state.campTokens.length),3);
 await p.locator('#token-action-cancel').click();assert.equal(await p.evaluate(()=>state.campTokens.length),3);
 await open('clue');await p.keyboard.press('Escape');assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),false);assert.equal(await p.evaluate(()=>state.campTokens.length),3);
 await open('treasure');assert.match(await confirm.innerText(),/Sacrifice.*Add 1 mana/i);await confirm.click();
 assert.equal(await p.evaluate(()=>state.battle.floatingMana),1);assert.equal(await p.evaluate(()=>state.campTokens.length),2);
 assert.equal(await p.evaluate(()=>confirmTokenAction47()),false,'repeating a stale confirmation cannot consume a second token');
 await open('food');await confirm.click();assert.equal(await p.evaluate(()=>state.playerHealth),42);
 assert.equal(await p.locator('.mana-land.tapped').count(),1);assert.equal(await p.evaluate(()=>state.battle.floatingMana),0);
 await p.evaluate(()=>{state.battle.lands.forEach(l=>l.tapped=true);renderBattle()});await open('clue');
 assert.equal(await confirm.isDisabled(),true);assert.match(await p.locator('#token-action-status').innerText(),/Needs 2 mana · 0 available/);
 assert.equal(await p.evaluate(()=>confirmTokenAction47()),false);assert.equal(await p.evaluate(()=>state.campTokens.length),1);
 await p.evaluate(()=>{state.battle.lands.forEach(l=>l.tapped=false);renderBattle()});assert.equal(await confirm.isEnabled(),true);
 const count=await p.evaluate(()=>state.battle.hand.length);await confirm.click();assert.equal(await p.evaluate(()=>state.battle.hand.length),count+1);
 assert.equal(await p.locator('.mana-land.tapped').count(),2);assert.equal(await p.evaluate(()=>state.campTokens.length),0);
 assert.equal(await p.evaluate(()=>state.battle.graveyard.some(c=>c.campToken)),false);

 // Every real enemy archetype exposes its current labels and costs as readable badges.
 await setup();
 const results=await p.evaluate(()=>Object.keys(FOE_TYPES).map(kind=>{
  const e=createFoe(kind,4);const holder=document.createElement('span');holder.innerHTML=enemyKeywordBadges47(e);
  return{kind,expected:creatureKeywordLabels(e).split(' · ').filter(Boolean),actual:[...holder.querySelectorAll('.enemy-keyword-badge')].map(el=>el.textContent),tips:[...holder.querySelectorAll('.enemy-keyword-badge')].map(el=>el.title)};
 }));
 for(const row of results){assert.deepEqual(row.actual,row.expected,row.kind);assert.ok(row.tips.every(t=>t.length>15),row.kind)}
 assert.match(await p.locator('.monster-sphinx .keyword-protection').innerText(),/Ward \(3 mana\)/);
 assert.match(await p.locator('.monster-sphinx .keyword-counter-ready').innerText(),/Counterspell \(2 mana\)/);
 await p.evaluate(()=>{state.battle.enemyCounterUsedTurn=2;renderBattle()});assert.equal(await p.locator('.keyword-counter-ready').count(),0);assert.match(await p.locator('.monster-sphinx .monster-keywords').innerText(),/Counterspell spent/);
 for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);
  const layout=await p.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1,panels:[...document.querySelectorAll('.monster-keywords')].map(el=>{
   const r=el.getBoundingClientRect(),monster=el.closest('.monster').getBoundingClientRect(),next=el.nextElementSibling.getBoundingClientRect();
   return{fits:el.scrollHeight<=el.clientHeight+1,bottom:r.bottom,nextTop:next.top,monsterBottom:monster.bottom,badges:[...el.children].map(c=>{const b=c.getBoundingClientRect();return{left:b.left,right:b.right,top:b.top,bottom:b.bottom}})};
  })}));
  assert.equal(layout.scroll,false);for(const row of layout.panels){assert.ok(row.fits,JSON.stringify({viewport,row}));assert.ok(row.bottom<=row.nextTop+1,JSON.stringify({viewport,row}));for(const r of row.badges)assert.ok(r.left>=-1&&r.right<=viewport.width+1&&r.top>=-1&&r.bottom<=row.monsterBottom+1,JSON.stringify({viewport,row}));}
  await open('food');const bounds=await p.locator('#token-action-dialog,#token-action-confirm,#token-action-cancel').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));for(const r of bounds)assert.ok(r.left>=-1&&r.right<=viewport.width+1&&r.top>=-1&&r.bottom<=viewport.height+1,JSON.stringify({viewport,r}));await p.locator('#token-action-cancel').click();
 }
 await p.setViewportSize({width:1600,height:900});await p.waitForTimeout(150);await p.screenshot({path:'work/enemy-badges47.png'});await open('treasure');await p.screenshot({path:'work/token-action47.png'});
 // Gamepad back cancels without paying, and token removal/scene changes close stale windows.
 await p.evaluate(()=>controller.back());assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),false);
 await open('clue');await p.evaluate(()=>{const b=state.battle;b.permanents=b.permanents.filter(x=>x.card.tokenKind!=='clue');renderBattle()});assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),false);assert.equal(await p.evaluate(()=>confirmTokenAction47()),false);
 await open('food');await p.evaluate(()=>showJourney());assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),false);
 await setup();await p.evaluate(()=>{state.battle.permanents.find(x=>x.card.tokenKind==='food').tapped=true;renderBattle()});await open('food');assert.equal(await confirm.isDisabled(),true);assert.match(await p.locator('#token-action-status').innerText(),/is tapped/);await p.keyboard.press('Escape');
 await p.evaluate(()=>{state.battle.deck=[];renderBattle()});await open('clue');await confirm.click();assert.equal(await p.evaluate(()=>state.screen),'end-screen');assert.equal(await p.locator('#token-action-dialog').evaluate(el=>el.open),false);
 assert.deepEqual(errors,[]);console.log('PASS click-to-use Treasure/Food/Clue, explicit costs/effects, cancellation/Escape/controller back, exact payment and single use, dynamic availability, stale windows, empty library, all foe badges/readiness and four visible layouts.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
