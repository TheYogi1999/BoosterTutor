const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  assert.equal(await p.locator('#highest-level').innerText(),'1');
  assert.equal(await p.locator('#run-level').isVisible(),false);
  await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;window.originalRandom59=Math.random;Math.random=()=>.01});
  await p.locator('#start-button').click();await p.locator('.sealed-pack').waitFor();
  assert.equal(await p.locator('#player-level').innerText(),'1');
  assert.equal(await p.locator('#run-level').isVisible(),false); // The level lives under the combat avatar.
  assert.equal(await p.evaluate(()=>state.packs.every(pack=>pack.length===7&&!pack.some(isFoilCard59))),true);
  assert.equal(await p.evaluate(()=>BUNDLED_CARDS.some(c=>c.foil59)),false);
  // One real starter draft, from the physical pack to the actual run deck.
  for(let i=0;i<6;i++){
   await p.locator('.sealed-pack').click();assert.equal(await p.locator('.draft-option .foil-card-face').count(),0);
   await p.evaluate(()=>{window.samePack59=state.packs[state.activePack];renderDraft();renderDraft()});
   assert.equal(await p.evaluate(()=>samePack59===state.packs[state.activePack]),true);
   await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();
  }
  assert.equal(await p.evaluate(()=>state.deck.length),17);
  assert.equal(await p.evaluate(()=>state.deck.some(isFoilCard59)),false);
  assert.equal(await p.evaluate(()=>state.pool.some(c=>c.foil59)),false);
  await p.locator('#journey-deck-button').click();
  assert.equal(await p.locator('.collection-card .foil-card-face').count(),0);
  await p.locator('#collection-close').click();await p.locator('[data-camp-token="treasure"]').click();
  assert.equal(await p.locator('#hand-row .foil-card-face').count(),0);
  assert.equal(await p.locator('#mana-land-row .foil-card-face').count(),0);
  // Actual casting, sacrificing, moving between zones and inspecting the foil.
  await p.evaluate(()=>{
   const b=state.battle;window.foilBear59=runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));foilBear59.runCounters60=['stats'];window.foilLotus59=runCard59(BUNDLED_CARDS.find(c=>c.name==='Black Lotus'));b.hand=[foilBear59,foilLotus59];b.floatingMana=20;
   for(const e of b.enemyCreatures){e.counterspell=false;e.ward=0;e.hexproof=false;e.health=e.maxHealth=100}renderBattle();
  });
  await p.locator('[data-hand-index="0"]').click();assert.equal(await p.locator('#creature-row .foil-card-face').count(),1);
  await p.locator('[data-hand-index="0"]').click();
  assert.equal(await p.locator('[data-permanent-id]:has(img[alt="Black Lotus"]) .foil-card-face').count(),0);
  await p.locator('[data-permanent-id]:has(img[alt="Black Lotus"])').click();await p.locator('#token-action-confirm').click();
  assert.equal(await p.evaluate(()=>state.battle.graveyard.includes(foilLotus59)),true);
  assert.equal(await p.locator('#graveyard-pile .foil-card-face').count(),0);
  await p.locator('#graveyard-button').click();assert.equal(await p.locator('#graveyard-dialog .foil-card-face').count(),0);await p.locator('#graveyard-dialog [data-close-dialog],#graveyard-close').first().click();
  await p.locator('[data-creature-id] .player-card-frame').hover();assert.equal(await p.locator('#inspector-content .foil-card-face').count(),1);
  await p.screenshot({path:'work/progression59-combat.png'});
  // A normal and a foil copy must be distinguishable in the same deck list.
  await p.evaluate(()=>{state.deck.push({...foilBear59,runCardId60:undefined,runCounters60:[]},foilBear59);openCollection('deck')});
  const mixed=await p.evaluate(()=>state.collectionCards.filter(c=>c.name==='Grizzly Bears').map(c=>({foil:isFoilCard59(c),count:c.count})));assert.equal(mixed.length,2);
  await p.locator('#collection-close').click();
  // Every shop acquisition and purchased pack keeps the finish seen before buying.
  await p.evaluate(()=>{state.node=2;state.coins=1000;showShop();window.shopCard59=state.shop.offers[0].card;Math.random=()=>.99;renderShop()});
  assert.equal(await p.locator('.shop-offer .foil-card-face').count(),0);
  await p.locator('[data-buy-card="0"]').click();assert.equal(await p.evaluate(()=>state.deck.includes(shopCard59)&&!isFoilCard59(shopCard59)),true);
  await p.locator('[data-select-pack="0"]').click();await p.locator('#shop-pack-confirm').click();
  await p.locator('.sealed-pack').click();assert.equal(await p.locator('.draft-option').count(),7);assert.equal(await p.locator('.draft-option .foil-card-face').count(),0);
  await p.evaluate(()=>{window.purchased59=state.packs[0]});await p.locator('#draft-confirm').click();assert.equal(await p.evaluate(()=>purchased59.every(c=>state.deck.includes(c)&&!isFoilCard59(c))),true);
  // Verify visible normal + foil pack layouts, before/after hover, without moving captions.
  await p.evaluate(()=>{Math.random=()=>.99;state.packs=[state.pool.slice(0,7).map(runCard59)];state.packs[0][0].runCounters60=['stats'];state.boosterInterruption=null;state.draftKind='reward';state.activePack=0;state.boosterSealed=false;state.selection=new Map();state.rerolledPacks=new Set();renderDraft();showScreen('draft-screen')});
  const caption=await p.locator('.draft-option .draft-card-name').first().boundingBox();await p.locator('.draft-option').first().hover();const hovered=await p.locator('.draft-option .draft-card-name').first().boundingBox();assert.ok(Math.abs(caption.y-hovered.y)<1);
  await p.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await p.locator('.foil-card-face').first().evaluate(e=>getComputedStyle(e,':after').animationName),'foil-sheen59');
  await p.mouse.move(800,80);await p.evaluate(()=>hideCardPreview());await p.waitForTimeout(350);
  await p.screenshot({path:'work/progression59-foil-pack.png'});
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await p.locator('.foil-card-face').first().evaluate(e=>getComputedStyle(e,':after').animationName),'none');
  // Win both real boss waves. Kills award levels once through the bounty path.
  await p.evaluate(()=>{
   state.endless=false;state.deck=[foilBear59,...Array.from({length:60},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'))),...generateStarterManaCards(4)];state.playerHealth=37;state.coins=240;state.shop=null;beginBattle(4);window.beforeLevel59=state.level;window.waveKills59=state.battle.enemyCreatures.length;
   const b=state.battle;for(const e of [...b.enemyCreatures]){damageFirstEnemy(10000,e);awardBounty(e)}winBattle();
  });
  assert.equal(await p.evaluate(()=>state.battle.waveIndex),1);assert.equal(await p.evaluate(()=>state.level-beforeLevel59),await p.evaluate(()=>waveKills59));
  await p.evaluate(()=>{for(const e of [...state.battle.enemyCreatures])damageFirstEnemy(10000,e);winBattle();window.beforeEndless59={deck:state.deck,life:state.playerHealth,coins:state.coins,level:state.level,run:state.finishRun59}});
  assert.equal(await p.locator('#endless-button').isVisible(),true);assert.match(await p.locator('#run-summary').innerText(),/LEVEL/);
  assert.equal(await p.evaluate(()=>{controller.enable();return controller.focused?.id}),'endless-button');await p.evaluate(()=>controller.release());
  const record=await p.evaluate(()=>state.bestLevel59);assert.ok(record>1);
  await p.screenshot({path:'work/progression59-victory.png'});
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:820,height:1180}]){
   await p.setViewportSize(viewport);await p.waitForTimeout(80);
   for(const id of ['#endless-button','#restart-button','#back-link']){const box=await p.locator(id).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=viewport.height+1,`${id}: ${JSON.stringify(box)}`)}
   assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),viewport.height);
  }
  await p.setViewportSize({width:1600,height:900});await p.locator('#endless-button').click();
  assert.equal(await p.evaluate(()=>state.node),5);assert.equal(await p.evaluate(()=>state.endless),true);
  assert.equal(await p.evaluate(()=>state.deck===beforeEndless59.deck&&state.playerHealth===beforeEndless59.life&&state.coins===beforeEndless59.coins&&state.level===beforeEndless59.level&&state.finishRun59===beforeEndless59.run&&isFoilCard59(foilBear59)),true);
  // Continue past an entire extra four-fight cycle. Every fight has a reward,
  // three-card shop, camp choice, fresh scenery and increasingly strong foes.
  for(let node=5;node<=10;node++){
   await p.locator('.sealed-pack').click();await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();
   assert.equal(await p.locator('[data-buy-card]').count(),3);await p.locator('#shop-continue').click();
   assert.equal(await p.locator('.path-node.current').count(),1);assert.equal(await p.locator('.path-node.current b').innerText(),await p.evaluate(()=>state.stageLocations[state.node-1].name));
   await p.locator('[data-camp-token="clue"]').click();assert.equal(await p.evaluate(()=>state.node),node);
   assert.match(await p.locator('#node-counter').innerText(),new RegExp(`∞ ${node-4}$`));
   assert.equal(await p.evaluate(()=>state.battle.waves.flat().every(e=>e.maxHealth>FOE_TYPES[e.kind].health&&e.power>FOE_TYPES[e.kind].power)),true);
   if(node===5)await p.screenshot({path:'work/progression59-endless.png'});
   if(node===10)break;
   await p.evaluate(()=>{while(state.screen==='combat-screen'){for(const e of [...state.battle.enemyCreatures])damageFirstEnemy(10000,e);winBattle()}});
   assert.equal(await p.evaluate(()=>state.screen),'draft-screen');
  }
  await p.evaluate(()=>{state.playerHealth=0;endRun(false)});assert.equal(await p.locator('#endless-invitation').isVisible(),false);assert.match(await p.locator('#run-summary').innerText(),/ENDLESS/);
  const highest=await p.evaluate(()=>state.bestLevel59);assert.ok(highest>record);
  await p.locator('#back-link').click();assert.equal(await p.locator('#highest-level').innerText(),String(highest));
  await p.reload();assert.equal(await p.locator('#highest-level').innerText(),String(highest));
  await p.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;Math.random=()=>.99});
  await p.locator('#start-button').click();await p.locator('.sealed-pack').waitFor();
  assert.equal(await p.evaluate(()=>state.level===1&&!state.endless),true);assert.equal(await p.evaluate(()=>state.packs.flat().some(isFoilCard59)),false);assert.equal(await p.evaluate(()=>state.pool.some(c=>'foil59' in c)),false);
  assert.deepEqual(errors,[]);
  console.log('PASS run-only stable foil finishes, complete six-pack draft, foil casting/hand/field/graveyard/inspector/deck, mixed finish grouping, shop cards and packs, reduced motion, fixed captions, per-kill levels, two-wave victory, optional endless continuation through fight ten, preserved deck/resources/finishes, scaling/scenery/reward/shop/camp, persisted title record and clean restart.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
