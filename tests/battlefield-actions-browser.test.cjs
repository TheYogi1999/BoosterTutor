const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const touch of [false,true]){
   const p=await browser.newPage({viewport:{width:1600,height:900},hasTouch:touch,reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await p.route('https://api.scryfall.com/**',r=>r.abort());await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await p.waitForFunction(()=>typeof hasCreatureAction73==='function');
   const press=async(selector)=>touch?p.locator(selector).tap():p.locator(selector).click();
   const setup=async(name,creature=false)=>p.evaluate(({name,creature})=>{
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());closeTokenAction47();closeCreatureAbility66();
    state.soundOn=false;state.runMode71='draft';state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.campTokens=[];state.deck=[...Array(40).fill(BUNDLED_CARDS[0]),...generateStarterManaCards(4)];beginBattle(1);
    const b=state.battle,card=BUNDLED_CARDS.find(c=>c.name===name);b.hand=[];b.floatingMana=10;syncMana(b);state.playerHealth=30;
    if(creature)b.creatures=[{id:'action73',owner:'player',card,...parseStats(card),...creatureKeywords(card),summonedTurn:0,summoningSick:false,tapped:false,willAttack:false}];
    else b.permanents=[{id:'action73',card,tapped:false,attachedTo:null}];
    renderBattle();
   },{name,creature});
   const snapshot=()=>p.evaluate(()=>JSON.stringify({life:state.playerHealth,mana:state.battle.mana,float:state.battle.floatingMana,perms:state.battle.permanents.map(u=>[u.id,u.tapped]),creatures:state.battle.creatures.map(u=>[u.id,u.tapped]),graves:state.battle.graveyard.length,hand:state.battle.hand.length}));
   for(const name of ['Black Lotus','Sol Ring','Jack-in-the-Mox','Fountain of Renewal','Omen of the Sea',"Jester's Mask","Jester's Cap","Jester's Scepter","Jester's Sombrero",'Short Sword','Glorious Anthem']){
    await setup(name);const before=await snapshot();await press('[data-permanent-id="action73"] img');
    assert.equal(await p.locator('#token-action-dialog').evaluate(d=>d.open),true,name);assert.equal(await p.locator('#token-action-title').innerText(),name);if(name==='Black Lotus'&&!touch)await p.screenshot({path:'work/actions73-lotus.png'});assert.equal(await snapshot(),before,name);
    assert.equal(await p.locator('#inspector-content [data-activate-permanent],#card-preview [data-activate-permanent]').count(),0);
    await press('#token-action-close73');assert.equal(await p.locator('#token-action-dialog').evaluate(d=>d.open),false);assert.equal(await snapshot(),before);
   }
   for(const [name,gain,sacrificed] of [['Black Lotus',3,true],['Sol Ring',2,false]]){
    await setup(name);await press('[data-permanent-id="action73"] img');await press('#token-action-confirm');assert.equal(await p.evaluate(()=>state.battle.floatingMana),10+gain);assert.equal(await p.evaluate(()=>state.battle.permanents.length),sacrificed?0:1);assert.equal(await p.evaluate(()=>confirmTokenAction47()),false);
    if(!sacrificed){assert.equal(await p.evaluate(()=>state.battle.permanents[0].tapped),true);await press('[data-permanent-id="action73"] img');assert.equal(await p.locator('#token-action-confirm').isDisabled(),true);await press('#token-action-cancel');}
   }
   for(const [name,gain] of [['Llanowar Elves',1],['Palladium Myr',2],['Birds of Paradise',1]]){
    await setup(name,true);const before=await snapshot();await press('[data-unit-mana="action73"]');assert.equal(await p.locator('#creature-ability-dialog').evaluate(d=>d.open),true);assert.equal(await snapshot(),before);await press('#creature-ability-close73');assert.equal(await snapshot(),before);await press('[data-unit-mana="action73"]');await press('#creature-ability-confirm');assert.equal(await p.evaluate(()=>state.battle.floatingMana),10+gain);assert.equal(await p.evaluate(()=>state.battle.creatures[0].tapped),true);
   }
   await setup('Tavern Swindler',true);await p.evaluate(()=>{rollCoinValue55=()=>1});const beforeCoin=await snapshot();await press('[data-activate-coin="action73"]');assert.equal(await snapshot(),beforeCoin);await press('#creature-ability-close73');assert.equal(await snapshot(),beforeCoin);await press('[data-activate-coin="action73"]');await press('#creature-ability-confirm');assert.equal(await p.evaluate(()=>state.playerHealth),27);await p.locator('#dice-continue').waitFor({state:'visible'});await press('#dice-continue');assert.equal(await p.evaluate(()=>state.playerHealth),33);
   await setup('Tavern Scoundrel',true);const beforeSacrifice=await snapshot();await press('[data-activate-coin="action73"]');await press('#creature-ability-confirm');assert.equal(await p.locator('#chance-choice-dialog').evaluate(d=>d.open),true);assert.equal(await snapshot(),beforeSacrifice);await press('#chance-choice-cancel');assert.equal(await snapshot(),beforeSacrifice);
   // Stale sources and unavailable abilities remain unpaid.
   await setup('Palladium Myr',true);await p.evaluate(()=>{state.battle.creatures[0].summonedTurn=state.battle.turn;state.battle.creatures[0].summoningSick=true;renderBattle()});await press('[data-unit-mana="action73"]');assert.equal(await p.locator('#creature-ability-confirm').isDisabled(),true);await press('#creature-ability-cancel');
   await setup('Black Lotus');await press('[data-permanent-id="action73"] img');await p.evaluate(()=>state.battle.permanents=[]);assert.equal(await p.evaluate(()=>confirmTokenAction47()),false);assert.equal(await p.evaluate(()=>state.battle.floatingMana),10);await p.evaluate(()=>closeTokenAction47());
   // Close marks share exact, font-independent center coordinates.
   await p.evaluate(()=>{showScreen('start-screen');openGameModes71()});const crosses=await p.locator('#game-modes-close').evaluate(el=>{const s=getComputedStyle(el),a=getComputedStyle(el,'::before'),b=getComputedStyle(el,'::after');return {width:el.clientWidth,height:el.clientHeight,left:parseFloat(a.left),top:parseFloat(a.top),font:s.fontSize,otherLeft:b.left,otherTop:b.top}});assert.ok(Math.abs(crosses.left-crosses.width/2)<.6);assert.ok(Math.abs(crosses.top-crosses.height/2)<.6);assert.equal(crosses.font,'0px');assert.equal(crosses.otherLeft,crosses.left+'px');assert.equal(crosses.otherTop,crosses.top+'px');await press('#game-modes-close');
   await setup('Black Lotus');await press('[data-permanent-id="action73"] img');
   for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844}]){await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);assert.equal(await p.locator('#token-action-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}),true);}
   assert.deepEqual(errors,[]);await p.close();
  }
  console.log('PASS mouse and real touch: image taps open unpaid windows for Lotus/Ring/Mox/Jesters/enchantments/equipment; confirmation pays exactly once; no inspector actions; mana creatures and coin abilities confirm in their own window; canceled/stale/sick sources pay nothing; centered CSS close marks; three fitted viewports.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
