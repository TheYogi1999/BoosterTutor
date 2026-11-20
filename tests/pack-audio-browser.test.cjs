const{chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const base=process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/';
 async function pageFor(reduced='reduce',route){
  const p=await browser.newPage({viewport:{width:1600,height:900},reducedMotion:reduced,ignoreHTTPSErrors:true});p.errors93=[];p.on('pageerror',e=>p.errors93.push(e.message));if(route)await p.route('**/assets/audio/pack-reveal.mp3',route);
  await p.addInitScript(()=>{
   localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','true');localStorage.setItem('bt-sfx-volume','100');window.packSignals93=[];
   const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
   AudioBufferSourceNode.prototype.start=function(...args){
    const result=start.apply(this,args);if(this.cueName!=='pack-open')return result;
    const entry={at:performance.now(),index:state.activePack||0,reveal:document.querySelector('#draft-screen').classList.contains('opening'),channels:this.buffer.numberOfChannels,duration:this.buffer.duration,peak:0,stopped:false};packSignals93.push(entry);this.testSignal93=entry;
    const analyser=this.context.createAnalyser();analyser.fftSize=512;this.voiceGain.connect(analyser);const samples=new Float32Array(analyser.fftSize);let ended=false;
    const sample=()=>{if(ended)return;analyser.getFloatTimeDomainData(samples);entry.peak=Math.max(entry.peak,Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length));requestAnimationFrame(sample);};requestAnimationFrame(sample);
    this.addEventListener('ended',()=>{ended=true;this.voiceGain.disconnect(analyser);},{once:true});return result;
   };
   AudioBufferSourceNode.prototype.stop=function(...args){if(this.testSignal93)this.testSignal93.stopped=true;return stop.apply(this,args);};
  });
  await p.goto(base);await p.bringToFront();await prepare(p);return p;
 }
 async function prepare(p){await p.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;state.packs=makeStarterPacks();state.activePack=0;state.draftKind='starter';state.boosterSealed=true;state.rerolledPacks=new Set();state.selection.clear();renderDraft();showScreen('draft-screen');document.querySelector('#draft-screen').getAnimations().forEach(a=>a.finish());});}
 const open=p=>p.locator('.sealed-pack').click({force:true});
 const signal=(p,n)=>p.waitForFunction(n=>packSignals93.length===n&&packSignals93[n-1].peak>.0001,n,{timeout:5000});
 const decoded=p=>p.evaluate(()=>recordedSoundBuffer(RECORDED_SFX['pack-open'][0]).then(b=>b.duration));
 async function next(p){await p.waitForFunction(()=>!boosterTravel);await p.locator('.draft-option').first().click();await p.locator('#draft-confirm').click();}

 // Reproduce a failed first download, then require real decoded samples in all six packs.
 let attempts=0;const p=await pageFor('no-preference',r=>++attempts===1?r.fulfill({status:503,headers:{'Cache-Control':'no-store'},body:'temporary audio failure'}):r.continue());
 for(let i=0;i<6;i++){
  await open(p);await signal(p,i+1);assert.equal(await p.evaluate(i=>packSignals93[i].index,i),i);assert.equal(await p.evaluate(i=>packSignals93[i].reveal,i),true,'Audio starts at the reveal, never during travel');
  await p.evaluate(()=>{openCurrentBooster();playBoosterOpeningSound()});assert.equal(await p.evaluate(()=>packSignals93.length),i+1,'Duplicate input cannot start a second voice');if(i<5)await next(p);
 }
 assert.equal(attempts,2,'First failure retries once, then all packs reuse the decoded clip');assert.equal(await p.evaluate(()=>packSignals93.every(s=>s.channels===1&&s.duration>1&&s.duration<3)),true);
 await p.evaluate(()=>showScreen('start-screen'));assert.equal(await p.evaluate(()=>packAudio93.voice),null);assert.equal(await p.evaluate(()=>[...soundEngine.voices].some(s=>s.cueName==='pack-open')),false);assert.deepEqual(p.errors93,[]);await p.close();

 // Reduced-motion, controller activation and a suspended audio context all use fresh voices.
 const r=await pageFor();await open(r);await signal(r,1);assert.equal(await r.locator('.draft-option').count(),7);assert.equal(await r.evaluate(()=>boosterTravel),null);await next(r);
 await r.evaluate(async()=>{await soundEngine.context.suspend();controller.enable();controller.focus(document.querySelector('.sealed-pack'));controller.activate();controller.release()});await signal(r,2);assert.equal(await r.evaluate(()=>soundEngine.context.state),'running');assert.equal(await r.locator('#background-music').evaluate(a=>a.paused),true,'Muted music does not mute the pack');assert.deepEqual(r.errors93,[]);await r.close();

 // A cold clip that takes longer than the ordinary SFX deadline still plays in its opening.
 let release;const gate=new Promise(resolve=>release=resolve);const slow=await pageFor('reduce',async route=>{await gate;await route.continue()});
 await open(slow);await slow.waitForFunction(()=>packAudio93.pending?.requested);await slow.waitForTimeout(1300);assert.equal(await slow.evaluate(()=>packSignals93.length),0);release();await signal(slow,1);assert.deepEqual(slow.errors93,[]);await slow.close();

 // Pending decodes cannot leak after cancellation, even if sound is re-enabled later.
 for(const reason of ['mute','hidden','exit','next-pack']){
  let release,attempts=0;const gate=new Promise(resolve=>release=resolve),q=await pageFor('reduce',async route=>{attempts++;await gate;await route.continue()});
  await open(q);await q.waitForFunction(()=>packAudio93.pending?.requested);
  if(reason==='mute')await q.evaluate(()=>setEffectsPreferences75(false));
  if(reason==='hidden')await q.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  if(reason==='exit')await q.evaluate(()=>showScreen('start-screen'));
  if(reason==='next-pack')await next(q);
  release();assert.ok(await decoded(q)>1);await q.waitForTimeout(40);assert.equal(await q.evaluate(()=>packSignals93.length),0,reason+' cancels the pending cue');
  if(reason==='mute'){await q.evaluate(()=>setEffectsPreferences75(true));await q.waitForTimeout(40);assert.equal(await q.evaluate(()=>packSignals93.length),0,'Unmuting does not replay an old opening');}
  if(reason==='hidden')await q.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  if(reason!=='next-pack')await prepare(q);await open(q);await signal(q,1);assert.equal(attempts,1,'The completed decode is reused after '+reason);assert.deepEqual(q.errors93,[]);await q.close();
 }
 console.log('PASS actual decoded audio samples for six sequential packs after a failed first download, cached retry recovery, reveal synchronization, duplicate suppression, reduced motion, controller/resume, delayed cold loading, independent music, and silent cancellation on mute/hidden/exit/next pack with no stale replay.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
