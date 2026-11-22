const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  fs.mkdirSync('work',{recursive:true});
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});
  await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
  const report=await p.evaluate(()=>{
   state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.runMode71='draft';
   const matches=(card,id)=>{
    const line=card.type_line,keys=card.keywords.map(k=>k.toLowerCase());
    const types={equipment:'Equipment',creature:'Creature',instant:'Instant',artifact:'Artifact',enchantment:'Enchantment',aura:'Aura',sorcery:'Sorcery',legendary:'Legendary'};
    if(types[id])return line.split(/\s+/).includes(types[id]);
    if(id==='mythic')return ['mythic','rare','uncommon'].includes(card.rarity);
    if(!line.includes('Creature'))return false;
    return id==='flying'?keys.includes('flying'):id==='venom'?keys.some(k=>['deathtouch','infect','toxic'].includes(k)):keys.some(k=>['first strike','double strike'].includes(k));
   };
   const types=SHOP_PACK_TYPES.map(type=>{
    const packs=Array.from({length:8},()=>buildShopPack(type.id));
    return {id:type.id,pool:packCandidates(type.id).length,valid:packs.every(pack=>pack?.length===7&&new Set(pack.map(c=>c.name)).size===7&&pack.every(c=>matches(c,type.id))&&(type.id!=='mythic'||pack.some(c=>c.rarity==='mythic')))};
   });
   const precons=PRECONS71.map(deck=>{
    state.runMode71='precon';state.preconId71=deck.id;
    return {id:deck.id,valid:SHOP_PACK_TYPES.every(type=>{const pool=packCandidates(type.id);return pool.every(card=>card.color_identity.every(c=>deck.colors.includes(c)))&&(pool.length>=7?buildShopPack(type.id)?.every(card=>matches(card,type.id)):buildShopPack(type.id)===null)})};
   });
   state.runMode71='draft';state.preconId71=null;
   return {types,precons,unknown:buildShopPack('unknown')};
  });
  assert.equal(report.types.length,12);assert.equal(report.unknown,null);
  for(const type of report.types){assert.ok(type.pool>=7,type.id);assert.ok(type.valid,type.id+' must contain seven distinct cards matching its advertised contents')}
  for(const deck of report.precons)assert.ok(deck.valid,deck.id+' packs respect color identity and never pad a small pool with unrelated cards');
  const variety=await p.evaluate(()=>{
   state.deck=Array.from({length:30},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')));state.node=2;state.coins=5000;showShop();
   const seen=new Set();let stable=true,distinct=true;
   for(let n=0;n<60;n++){
    delete state.shop.packs;state.shop.selectedPack=null;renderShop();const offers=state.shop.packs,ids=offers.map(o=>o.type);ids.forEach(id=>seen.add(id));
    distinct&&=offers.length===2&&new Set(ids).size===2;renderShop();stable&&=state.shop.packs===offers;
   }
   return {seen:[...seen],stable,distinct};
  });
  assert.equal(variety.seen.length,12);assert.ok(variety.stable);assert.ok(variety.distinct);
  // Buy every new category through the actual one-click selection + confirmation UI.
  for(const id of report.types.slice(4).map(t=>t.id)){
   await p.evaluate(id=>{state.shop.packs=[{type:id,sold:false},{type:'creature',sold:false}];state.shop.selectedPack=null;renderShop()},id);
   const before=await p.evaluate(()=>({coins:state.coins,deck:state.deck.length,price:SHOP_PACK_TYPES.find(t=>t.id===state.shop.packs[0].type).price}));
   await p.locator('[data-select-pack="0"]').click();assert.equal(await p.evaluate(()=>state.coins),before.coins);
   await p.locator('#shop-pack-confirm').click();assert.equal(await p.evaluate(()=>state.coins),before.coins-before.price);
   assert.equal(await p.locator('.sealed-pack').getAttribute('data-pack-type'),id);
   assert.notEqual((await p.locator('.sealed-pack').evaluate(n=>getComputedStyle(n).getPropertyValue('--pack-color'))).trim(),'');
   await p.locator('[data-open-pack]').click({force:true});assert.equal(await p.locator('.draft-option').count(),7);
   await p.locator('#draft-confirm').click();assert.equal(await p.evaluate(()=>state.screen),'shop-screen');assert.equal(await p.evaluate(()=>state.deck.length),before.deck+7);
   assert.equal(await p.locator('[data-select-pack="0"]').isDisabled(),true);
  }
  await p.evaluate(()=>{state.shop.packs=[{type:'venom',sold:false},{type:'legendary',sold:false}];state.shop.counters60=['toxic','stats','mystery'].map(kind=>({kind,sold:false}));renderShop()});
  assert.equal(await p.locator('[data-counter-kind="toxic"] svg').count(),1);
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844}]){
   await p.setViewportSize(viewport);await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
   assert.equal(await p.locator('#shop-pack').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1}),true);
  }
  await p.setViewportSize({width:1600,height:900});await p.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600)<1);await p.screenshot({path:'work/shop-variety94.png'});
  // All 50 portraits retain proportional atlas crops and share four gently rounded corners.
  const portraits=await p.evaluate(()=>{
   beginBattle(1);const b=state.battle,result=[];
   for(const kind of Object.keys(FOE_TYPES)){
    b.enemyCreatures=[createFoe(kind,3)];renderBattle();const n=document.querySelector('#enemy-board .walker-portrait'),s=getComputedStyle(n);
    result.push({kind,corners:[s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomRightRadius,s.borderBottomLeftRadius],mask:s.maskImage,width:n.offsetWidth,height:n.offsetHeight});
   }
   b.enemyCreatures=['dragon','thornstag','rootmaw','gravebell','sunbondsliver','prismaticsliver'].map(k=>createFoe(k,3));renderBattle();return result;
  });
  for(const portrait of portraits){assert.deepEqual(portrait.corners,['6px','6px','6px','6px'],portrait.kind);assert.equal(portrait.mask,'none');assert.ok(portrait.width>0&&portrait.width<=104);assert.ok(portrait.height>0&&portrait.height<=130);assert.ok(Math.abs(portrait.width-portrait.height*.8)<=1,JSON.stringify(portrait))}
  await p.screenshot({path:'work/portraits94.png'});assert.deepEqual(errors,[]);
  console.log('PASS 12 truthful seven-card pack categories, six color-restricted precons, two distinct stable random offers, eight real pack purchases/returns, Toxic vector icon, fitted shop and all 50 portrait frames.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
