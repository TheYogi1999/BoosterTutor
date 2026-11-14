const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},ignoreHTTPSErrors:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  const base=process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/';
  await page.goto(new URL('death-sounds.html',base).href);
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('bt-sfx-volume','42');localStorage.setItem('bt-music-enabled','false')});await page.reload();
  assert.equal(await page.locator('[data-option]').count(),9);
  assert.equal(await page.locator('audio').evaluateAll(a=>a.length===10&&a.every(c=>c.paused&&!c.autoplay&&c.preload==='none')),true);
  assert.equal(await page.locator('#copy-choices').isDisabled(),true);
  for(const group of ['S','M','L']){
   await page.locator(`[data-group="${group}"]`).click();assert.equal(await page.locator('[role="tabpanel"]:visible').count(),1);
   for(const n of [1,2,3]){
    const code=group+n;await page.locator(`[data-option="${code}"] audio`).click({position:{x:18,y:20}});
    await page.waitForFunction(code=>document.querySelector(`[data-option="${code}"] audio`).currentTime>.015,code);
    assert.ok(await page.locator(`[data-option="${code}"] audio`).evaluate(a=>Number.isFinite(a.duration)&&a.duration>.4&&a.duration<2));
    assert.equal(await page.locator('audio').evaluateAll(a=>a.filter(c=>!c.paused).length),1);
   }
   await page.locator(`[data-choice="${group}2"]`).click();await page.locator(`[data-choice="${group}3"]`).click();await page.locator(`[data-choice="${group}3"]`).click();
   assert.equal(await page.locator(`#group-${group} [aria-pressed="true"]`).count(),1);
  }
  assert.equal(await page.locator('#choices-text').inputValue(),'S3, M3, L3');assert.equal(await page.locator('#copy-choices').isDisabled(),false);
  for(const set of [1,2,3]){
   await page.locator(`[data-set="${set}"]`).click();await page.waitForFunction(()=>document.querySelector('#set-preview').currentTime>.015);
   assert.ok(await page.locator('#set-preview').evaluate(a=>a.duration>4&&a.duration<5.2));
   assert.ok((await page.locator('#set-preview').getAttribute('src')).endsWith(`set-${set}.mp3`));
   assert.equal(await page.locator('audio').evaluateAll(a=>a.filter(c=>!c.paused).length),1);
  }
  await page.evaluate(()=>{for(const i of [1,2,3])document.querySelector(`[data-set="${i}"]`).click()});
  await page.waitForFunction(()=>document.querySelector('#set-preview').currentTime>.015);
  assert.ok((await page.locator('#now-playing').textContent()).startsWith('Retro'));
  await page.locator('[data-group="S"]').click();assert.equal(await page.locator('audio').evaluateAll(a=>a.every(c=>c.paused&&c.currentTime===0)),true);
  await page.locator('[data-set="1"]').click();await page.waitForFunction(()=>document.querySelector('#set-preview').currentTime>.015);
  await page.locator('[data-option="S1"] audio').click({position:{x:18,y:20}});await page.waitForFunction(()=>document.querySelector('[data-option="S1"] audio').currentTime>.015);
  assert.equal(await page.locator('#set-preview').evaluate(a=>a.paused&&a.currentTime===0),true);
  for(const value of ['35','0']){await page.locator('#preview-volume').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},value);assert.equal(await page.locator('audio').evaluateAll((a,value)=>a.every(c=>Math.abs(c.volume-Number(value)/100)<.001),value),true)}
  await page.locator('[data-group="S"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-group="M"]').getAttribute('aria-selected'),'true');await page.keyboard.press('End');assert.equal(await page.locator('[data-group="L"]').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('[data-group="S"]').getAttribute('aria-selected'),'true');
  await page.reload();assert.equal(await page.locator('#choices-text').inputValue(),'S3, M3, L3');
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('bt-sfx-volume'),localStorage.getItem('bt-music-enabled')]),['42','false']);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('test fallback'))},configurable:true}));await page.locator('#copy-choices').click();
  assert.ok((await page.locator('#copy-status').textContent()).includes('Copy the selected codes'));assert.equal(await page.locator('#choices-text').evaluate(el=>el.selectionEnd-el.selectionStart),10);
  for(const viewport of [{width:1280,height:720},{width:390,height:844}]){await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)}
  await page.setViewportSize({width:1280,height:720});await page.locator('[data-group="S"]').click();await page.screenshot({path:'work/death77-previews.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS nine native audio previews, three sets, exclusive playback, race-safe set changes, independent volume, keyboard tabs, saved choices, clipboard fallback and mobile layout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
