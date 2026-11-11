const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await require('./enemy-check-fixture.cjs')(page);
  const setup=async(names,mana=8)=>page.evaluate(({names,mana})=>{
   state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;
   state.deck=Array(40).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));beginBattle(3);
   const b=state.battle;b.turn=2;b.floatingMana=0;
   b.lands=Array.from({length:mana},(_,i)=>({id:'land-'+i,card:FALLBACK_LANDS[i%5],tapped:false}));
   b.enemyCreatures=['archivist','boar'].map(kind=>{const e=createFoe(kind,3);e.ward=0;e.health=e.maxHealth=50;return e});
   b.waves=[b.enemyCreatures];b.waveIndex=0;b.hand=names.map(name=>BUNDLED_CARDS.find(c=>c.name===name));
   window.beforeDeck=b.deck.length;syncMana(b);renderBattle();
  },{names,mana});
  const shortcut=page.locator('[data-enemy-counter-response]');
  const pass=page.locator('[data-pass-enemy-spell]');
  await setup(['Divination','Counterspell']);
  await page.locator('[data-hand-index="0"]').click();
  assert.match(await page.locator('#enemy-spell-panel').innerText(),/YOUR RESPONSE/);
  assert.match(await shortcut.innerText(),/Cast Counterspell · 2 mana/i);
  assert.match(await pass.innerText(),/Let it resolve/i);
  assert.ok((await page.locator('[data-hand-index="0"]').getAttribute('class')).includes('instant-response'));
  await page.waitForTimeout(1100);
  assert.equal(await page.evaluate(()=>state.battle.deck.length===beforeDeck),true,'original draw spell stays paused');
  await shortcut.click();
  assert.equal(await page.locator('#rule-dialog').evaluate(el=>el.open),false,'shortcut selects the announced spell directly');
  assert.equal(await page.evaluate(()=>state.battle.enemyCounterWindow.spell.status),'countered');
  assert.equal(await page.locator('.mana-land.tapped').count(),5,'both spells pay their normal mana once');
  assert.equal(await page.evaluate(()=>castEnemyCounterResponse46(0,activeEnemySpell38().id,'Counterspell')),false,'repeated shortcut is harmless');
  assert.match(await pass.innerText(),/Resolve your spell/i);
  await pass.click();
  assert.equal(await page.evaluate(()=>state.battle.hand.length),2);
  assert.equal(await page.evaluate(()=>state.battle.deck.length),await page.evaluate(()=>beforeDeck-2));
  assert.equal(await page.locator('.mana-land.tapped').count(),5);
  assert.equal(await page.evaluate(()=>state.battle.enemyCounterWindow),null);

  await setup(['Divination','Counterspell'],3);
  await page.locator('[data-hand-index="0"]').click();
  assert.equal(await shortcut.isDisabled(),true);
  assert.match(await page.locator('.enemy-spell-status').innerText(),/2 mana needed/);
  assert.equal(await page.evaluate(()=>castEnemyCounterResponse46(0,activeEnemySpell38().id,'Counterspell')),false);
  await pass.click();
  assert.equal(await page.evaluate(()=>state.battle.hand[0].name),'Counterspell');
  assert.equal(await page.evaluate(()=>state.battle.deck.length===beforeDeck),true,'passing allows the enemy to counter the original spell');

  // A cheap counter can protect a targeted instant; the original Ward still costs mana.
  await setup(['Shock','Counterspell','Dispel']);
  await page.evaluate(()=>{state.battle.enemyCreatures[0].ward=2;renderBattle()});
  await page.locator('[data-hand-index="0"]').click();
  await page.locator('[data-rule-pick^="enemy:"]').first().click();await page.locator('#rule-confirm').click();
  assert.match(await shortcut.innerText(),/Cast Dispel · 1 mana/i);
  assert.equal(await page.evaluate(()=>castEnemyCounterResponse46(0,'stale-spell','Counterspell')),false);
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(150);
   const bounds=await page.locator('#enemy-spell-panel,.enemy-reaction-actions button,.monster,.hand-panel').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
   for(const r of bounds)assert.ok(r.left>=-1&&r.right<=viewport.width+1&&r.top>=-1&&r.bottom<=viewport.height+1,JSON.stringify({viewport,r}));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false);
   const panel=await page.locator('#enemy-spell-panel').boundingBox();
   const buttons=await page.locator('.enemy-reaction-actions button').all();
   for(const button of buttons){const r=await button.boundingBox();assert.ok(r.x>=panel.x-1&&r.x+r.width<=panel.x+panel.width+1&&r.y>=panel.y-1&&r.y+r.height<=panel.y+panel.height+1,'response controls fit in their panel');}
  }
  await page.setViewportSize({width:1600,height:900});await page.waitForTimeout(150);
  await page.screenshot({path:'work/counter-response46.png'});
  await shortcut.click();await pass.click();
  assert.equal(await page.locator('#ward-dialog').evaluate(el=>el.open),true);
  await page.locator('#ward-pay').click();
  assert.equal(await page.evaluate(()=>state.battle.enemyCreatures[0].health),48);
  assert.equal(await page.locator('.mana-land.tapped').count(),4);
  assert.deepEqual(errors,[]);
  console.log('PASS direct Counterspell response, held priority, main-phase instant glow, exact payments, original spell resumption, insufficient mana, cheaper Dispel, stale actions, Ward and four bounded layouts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
