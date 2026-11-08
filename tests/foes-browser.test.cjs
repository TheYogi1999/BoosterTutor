const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000');
 await page.evaluate(()=>{state.soundOn=false;state.deck=Array(35).fill(BUNDLED_CARDS.find(c=>c.name==='Grizzly Bears'));beginBattle(3)});
 const imageSize=await page.evaluate(()=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth);image.onerror=reject;image.src='assets/portraits/foes.webp?v=0.36'}));assert.equal(imageSize,1254);
 const cells=new Set();
 for(const kind of ['duelist','boar','sprite','stalker','bulwark','archivist','vampire','tyrant','sphinx']){
  const result=await page.evaluate(kind=>{const b=state.battle;b.enemyCreatures=[createFoe(kind,4)];b.turn=1;renderBattle();const portrait=document.querySelector('.monster .walker-portrait'),s=getComputedStyle(portrait);return {art:s.backgroundImage,cell:s.backgroundPosition,keywords:document.querySelector('.monster-keywords').textContent,intent:document.querySelector('.monster-intent').textContent}},kind);
  assert.match(result.art,/foes\.webp/);cells.add(result.cell);if(['bulwark','archivist','vampire','tyrant','sphinx'].includes(kind))assert.match(result.keywords,/Ward \(\d mana\)/);
  if(kind==='sprite')assert.match(result.intent,/Mend ally/);if(kind==='tyrant')assert.match(result.intent,/Rally/);if(['archivist','sphinx'].includes(kind))assert.match(result.intent,/Cast Shock/);
 }
 assert.equal(cells.size,9);
 await page.evaluate(()=>{const b=state.battle;b.enemyCreatures=['bulwark','archivist','vampire'].map(kind=>createFoe(kind,3));renderBattle()});
 for(const viewport of [{width:1600,height:900},{width:390,height:844},{width:820,height:1180}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);
  const measurements=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1,rows:[...document.querySelectorAll('.monster-keywords')].map(el=>{const r=el.getBoundingClientRect(),next=el.nextElementSibling.getBoundingClientRect();return {fits:el.scrollHeight<=el.clientHeight+1,bottom:r.bottom,nextTop:next.top,nextVisible:!!el.nextElementSibling.getClientRects().length}})}));
  assert.equal(measurements.scroll,false);for(const row of measurements.rows){assert.ok(row.fits,JSON.stringify({viewport,row}));if(row.nextVisible)assert.ok(row.bottom<=row.nextTop+1,JSON.stringify({viewport,row}));}
 }
 await page.setViewportSize({width:1600,height:900});
 await page.evaluate(()=>{const b=state.battle;b.enemyCreatures=['tyrant','sprite'].map(kind=>createFoe(kind,4));renderBattle()});await page.screenshot({path:'work/new-foes36.png'});
 assert.deepEqual(errors,[]);console.log('PASS all nine enemy portraits, unique atlas cells, visible Ward costs and special intents, three-member keyword layout at desktop/mobile/tablet, no page overflow.');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
