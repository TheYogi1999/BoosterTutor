const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce',ignoreHTTPSErrors:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('bt-sfx-enabled','false');localStorage.setItem('bt-music-enabled','false')});await p.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');
 const sampling=await p.evaluate(()=>{
  const original=Math.random,last=lastVeyGreeting92;let seed=92;const draws=[];
  try{Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let i=0;i<180;i++)draws.push(pickVeyGreeting92());}
  finally{Math.random=original;lastVeyGreeting92=last;}
  return{count:VEY_GREETINGS92.length,unique:new Set(VEY_GREETINGS92).size,draws,valid:draws.every(g=>VEY_GREETINGS92.includes(g))};
 });
 assert.ok(sampling.count>=20);assert.equal(sampling.unique,sampling.count);assert.equal(sampling.valid,true);assert.ok(new Set(sampling.draws).size>=20,'At least 20 greetings can actually be selected');assert.ok(sampling.draws.every((g,i)=>!i||g!==sampling.draws[i-1]),'No immediate repeats');
 await p.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.node=2;state.coins=500;state.deck=Array.from({length:24},()=>runCard59(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears')));showShop()});
 const first=await p.locator('#shopkeeper-greeting87').textContent();assert.equal(await p.evaluate(()=>document.querySelector('#shopkeeper-greeting87').textContent===`“${state.shop.greeting92}”`),true);
 await p.evaluate(()=>{renderShop();renderShop()});assert.equal(await p.locator('#shopkeeper-greeting87').textContent(),first);
 await p.locator('[data-buy-card="0"]').click();assert.equal(await p.locator('#shopkeeper-greeting87').textContent(),first,'Purchases keep the greeting');
 await p.locator('#shop-continue').click();await p.locator('#return-shop').click();assert.equal(await p.locator('#shopkeeper-greeting87').textContent(),first,'Returning to the same inventory keeps the greeting');
 await p.evaluate(()=>{state.node=3;showShop()});const second=await p.locator('#shopkeeper-greeting87').textContent();assert.notEqual(second,first,'A new trading post gets a fresh random greeting');
 await p.evaluate(()=>{state.boosterInterruption={kind:'shop'};showScreen('draft-screen');state.boosterInterruption=null;renderShop();showScreen('shop-screen')});assert.equal(await p.locator('#shopkeeper-greeting87').textContent(),second,'Pack opening does not reroll the greeting');
 // Every line, including the longest greeting, fits the merchant panel.
 assert.equal(await p.locator('.shopkeeper87').evaluate(n=>{const p=n.querySelector('#shopkeeper-greeting87'),box=n.getBoundingClientRect(),original=p.textContent;try{return VEY_GREETINGS92.every(g=>{p.textContent=`“${g}”`;const r=p.getBoundingClientRect();return r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom})}finally{p.textContent=original}}),true);
 assert.deepEqual(errors,[]);console.log(`PASS ${sampling.count} distinct English greetings, randomized selection with no consecutive repeats, stable purchases/rerenders/same-shop returns/pack openings, fresh greeting at the next trading post, all lines fit the merchant panel.`);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
