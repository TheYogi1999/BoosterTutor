const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},hasTouch:true,ignoreHTTPSErrors:true,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   if(!sessionStorage.getItem('input78-seeded')){localStorage.removeItem('bt-input-settings-v1');sessionStorage.setItem('input78-seeded','yes')}
   localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','false');
   window.testPads78=[];Object.defineProperty(navigator,'getGamepads',{value:()=>testPads78});
  });
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await page.bringToFront();
  assert.equal(await page.evaluate(()=>controller.autoDetect),true);assert.equal(await page.evaluate(()=>controller.profile),'keyboard');
  await page.locator('#title-options').click();await page.locator('#controller-help-button').click();
  assert.equal(await page.locator('#input-auto-detect').isChecked(),true);assert.equal(await page.locator('#input-layout').isDisabled(),true);
  assert.deepEqual(await page.locator('#input-layout option').evaluateAll(o=>o.map(x=>x.value)),['xbox','playstation','nintendo','keyboard','touch']);
  await page.locator('#input-auto-detect').uncheck();assert.equal(await page.locator('#input-layout').isDisabled(),false);
  for(const [profile,labels] of Object.entries({xbox:['A','B','X','Y'],playstation:['✕','○','□','△'],nintendo:['A','B','Y','X']})){
   await page.locator('#input-layout').selectOption(profile);
   assert.equal(await page.locator('#controller-bindings .input-face78').count(),4);
   assert.deepEqual(await page.locator('#controller-bindings .input-face78').allTextContents(),labels);
   assert.equal(await page.locator('#controller-bindings [role="img"]').evaluateAll(a=>a.every(x=>Boolean(x.getAttribute('aria-label')))),true);
  }
  const connect=async(id,index=0,held=-1)=>{
   await page.evaluate(({id,index,held})=>{testPads78=[{index,id,connected:true,mapping:'standard',buttons:Array.from({length:17},(_,i)=>({pressed:i===held,value:i===held?1:0})),axes:[0,0,0,0]}]}, {id,index,held});
   await page.waitForFunction(index=>controller.connected&&controller.index===index,index);
   if(held<0)await page.waitForFunction(()=>controller.ready);
  };
  const down=async index=>{await page.waitForFunction(()=>controller.ready);await page.evaluate(i=>testPads78[0].buttons[i]={pressed:true,value:1},index);await page.waitForFunction(i=>controller.previous[i]===true,index)};
  const up=async index=>{await page.evaluate(i=>testPads78[0].buttons[i]={pressed:false,value:0},index);await page.waitForFunction(i=>controller.previous[i]===false,index)};
  const press=async index=>{await down(index);await up(index);await page.waitForFunction(()=>controller.ready)};
  const focus=async selector=>page.evaluate(s=>{controller.enable();controller.focus(document.querySelector(s))},selector);
  await connect('Xbox Wireless Controller');
  for(const profile of ['keyboard','touch']){
   await page.locator('#input-layout').selectOption(profile);await page.waitForFunction(()=>controller.ready);
   await press(0);assert.equal(await page.evaluate(()=>controller.active),false);assert.equal(await page.evaluate(()=>controller.profile),profile);assert.equal(await page.locator('#controller-dialog').evaluate(d=>d.open),true);
  }
  // Manual profile stays fixed despite a different connected pad and real pointer/keyboard input.
  await page.locator('#input-layout').selectOption('nintendo');await page.waitForFunction(()=>controller.ready);
  await page.keyboard.press('Shift');assert.equal(await page.evaluate(()=>controller.profile),'nintendo');
  await page.waitForFunction(()=>controller.ready);await page.evaluate(()=>testPads78[0].axes[0]=.8);await page.waitForFunction(()=>controller.active);
  await page.mouse.move(1480,840);await page.mouse.move(1500,850);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>controller.active),false,'A held stick cannot reclaim input after mouse takeover');assert.equal(await page.evaluate(()=>controller.profile),'nintendo');
  await page.evaluate(()=>testPads78[0].axes[0]=0);await page.waitForFunction(()=>controller.ready);
  await focus('#input-auto-detect');await press(1);assert.equal(await page.locator('#input-auto-detect').isChecked(),true);assert.equal(await page.locator('#input-layout').isDisabled(),true);
  // A gamepad event now auto-selects the actual Xbox layout; checkbox activates with A.
  await focus('#input-auto-detect');await press(0);assert.equal(await page.evaluate(()=>controller.profile),'xbox');assert.equal(await page.locator('#input-auto-detect').isChecked(),false);
  await focus('#input-layout');await press(0);assert.equal(await page.evaluate(()=>controller.editing),true);await press(15);
  assert.equal(await page.locator('#input-layout').inputValue(),'playstation');assert.equal(await page.evaluate(()=>controller.autoDetect),false);
  await page.reload();await page.locator('#title-options').click();await page.locator('#controller-help-button').click();
  assert.equal(await page.locator('#input-layout').inputValue(),'playstation');assert.equal(await page.locator('#input-auto-detect').isChecked(),false);
  // Auto detection responds to actual input, not mere connections, and uses Nintendo's A/B positions.
  await page.locator('#input-auto-detect').check();await connect('Nintendo Switch Pro Controller (Vendor: 057e Product: 2009)',1);
  assert.equal(await page.evaluate(()=>controller.profile),'playstation');await press(9);
  assert.equal(await page.evaluate(()=>controller.profile),'nintendo');assert.equal(await page.locator('#controller-dialog').evaluate(d=>d.open),false);
  await press(9);await focus('#input-auto-detect');await press(1);assert.equal(await page.locator('#input-auto-detect').isChecked(),false);
  await press(0);assert.equal(await page.locator('#controller-dialog').evaluate(d=>d.open),false,'Nintendo B is physical button 0');
  await press(9);await focus('#controller-close');await down(1);assert.equal(await page.locator('#controller-dialog').evaluate(d=>d.open),false,'Nintendo A is physical button 1');
  await page.waitForTimeout(350);assert.equal(await page.locator('#title-options-dialog').evaluate(d=>d.open),true,'Held confirm cannot activate the underlying option');await up(1);
  // Reconnect held buttons and both-stick drift cannot activate controls or steal pointer input.
  await page.evaluate(()=>testPads78=[]);await page.waitForFunction(()=>!controller.connected);
  await connect('DualSense Wireless Controller',2,0);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>controller.ready),false);
  await up(0);await page.waitForFunction(()=>controller.ready);assert.equal(await page.evaluate(()=>controller.profile),'nintendo','Manual override survives reconnect');
  await press(9);await page.locator('#input-auto-detect').check();await press(9);assert.equal(await page.evaluate(()=>controller.profile),'playstation');
  await page.mouse.move(1480,840);await page.mouse.move(1500,850);assert.equal(await page.evaluate(()=>controller.profile),'keyboard');assert.equal(await page.evaluate(()=>controller.active),false);
  await page.evaluate(()=>{testPads78[0].axes=[.2,0,0,.3]});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>controller.profile),'keyboard');
  await page.evaluate(()=>testPads78[0].axes=[0,0,0,0]);await page.waitForFunction(()=>controller.ready);
  await page.touchscreen.tap(1500,850);assert.equal(await page.evaluate(()=>controller.profile),'touch');
  await page.keyboard.press('Shift');assert.equal(await page.evaluate(()=>controller.profile),'keyboard');await press(9);assert.equal(await page.evaluate(()=>controller.profile),'playstation');
  // Range edit uses directions, stays focused and stops at bounds; Back leaves edit mode first.
  await page.evaluate(()=>{document.querySelector('#controller-dialog').close();document.querySelector('#music-dialog').showModal()});
  await focus('#sfx-volume');await press(0);assert.equal(await page.evaluate(()=>controller.editing),true);await press(15);assert.equal(await page.locator('#sfx-volume').inputValue(),'100');
  await press(14);assert.equal(await page.locator('#sfx-volume').inputValue(),'99');await press(12);assert.equal(await page.locator('#sfx-volume').inputValue(),'100');
  await press(1);assert.equal(await page.evaluate(()=>controller.editing),false);assert.equal(await page.locator('#music-dialog').evaluate(d=>d.open),true);await press(1);assert.equal(await page.locator('#music-dialog').evaluate(d=>d.open),false);
  await press(9);await page.locator('#input-auto-detect').uncheck();await page.locator('#input-layout').selectOption('nintendo');
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:640,height:360}]){
   await page.setViewportSize(viewport);await page.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);
   for(const selector of ['#controller-dialog','#input-layout','#input-auto-detect'])assert.equal(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}),true,selector+' '+viewport.width);
   assert.equal(await page.locator('#controller-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
   if(viewport.width===390)await page.screenshot({path:'work/input78-mobile.png'});
  }
  await page.setViewportSize({width:1600,height:900});await page.screenshot({path:'work/input78-nintendo.png'});
  assert.equal(await page.locator('.brand-version').textContent(),'v0.78');assert.deepEqual(errors,[]);
  console.log('PASS five persisted input layouts, auto default and real device switching, accessible PS/Xbox/Nintendo glyphs, Nintendo A/B mapping, manual locks, Gamepad checkbox/select/range editing, held-button/reconnect safety, drift rejection, touch/keyboard takeover and four fitted viewports.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
