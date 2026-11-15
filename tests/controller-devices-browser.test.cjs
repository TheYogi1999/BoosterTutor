const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   if(!sessionStorage.getItem('device80-seeded')){for(const key of ['bt-input-settings-v1','bt-controller-maps-v1'])localStorage.removeItem(key);sessionStorage.setItem('device80-seeded','yes')}
   localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','false');
   window.mode80=sessionStorage.getItem('device80-reload')?'raw':'empty';
   window.centers80=[0,0,1,-1,0,0,0,0,0,1.285714];
   window.pad80={index:0,id:'Pro Controller (Vendor: 057e Product: 2009)',connected:true,mapping:'',buttons:Array.from({length:18},()=>({pressed:false,value:0})),axes:[...centers80]};
   window.standard80={index:1,id:'Xbox virtual controller',connected:true,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0,0,0]};
   window.readPads80=()=>{if(mode80==='blocked')throw new DOMException('Blocked test','SecurityError');return mode80==='empty'?[]:mode80==='multi'?[standard80,pad80]:[pad80]};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:readPads80});
  });
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await page.bringToFront();
  const open=async()=>{await page.locator('#title-options').click();await page.locator('#controller-help-button').click();await page.locator('#controller-test-open').click()};
  await open();await page.waitForFunction(()=>document.querySelector('#controller-test-status').textContent.includes('No controller exposed'));
  assert.equal(await page.locator('#controller-setup-start').isDisabled(),true);
  await page.evaluate(()=>Object.defineProperty(navigator,'getGamepads',{configurable:true,value:undefined}));await page.waitForFunction(()=>document.querySelector('#controller-test-status').textContent.includes('does not expose'));
  await page.evaluate(()=>{mode80='blocked';Object.defineProperty(navigator,'getGamepads',{configurable:true,value:readPads80})});await page.waitForFunction(()=>document.querySelector('#controller-test-status').textContent.includes('blocked'));
  await page.evaluate(()=>mode80='raw');await page.waitForFunction(()=>controller.connected&&controllerDevices80.raw?.id===pad80.id);await page.waitForFunction(()=>document.querySelector('#controller-test-status').textContent.includes('not standard'));
  assert.equal(await page.locator('#controller-setup-layout').inputValue(),'nintendo');assert.equal(await page.locator('#controller-setup-start').isDisabled(),false);
  await page.evaluate(()=>pad80.buttons[2]={pressed:true,value:1});await page.waitForFunction(()=>document.querySelector('#controller-test-values').textContent.includes('B2: 1.00'));
  assert.equal(await page.locator('#controller-test-dialog').evaluate(d=>d.open),true);assert.equal(await page.evaluate(()=>controller.active),false);
  await page.evaluate(()=>pad80.buttons[2]={pressed:false,value:0});
  const start=async()=>{await page.locator('#controller-setup-start').click();await page.waitForFunction(()=>controllerDevices80.calibration&&!controllerDevices80.calibration.waiting)};
  await start();assert.equal(await page.locator('#controller-setup-cancel').isVisible(),true);await page.locator('#controller-setup-cancel').click();assert.equal(await page.evaluate(()=>controllerDevices80.configs.size),0);
  await start();
  // A held control across a hidden-tab interval cannot be learned until released.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});pad80.buttons[2]={pressed:true,value:1}});await page.waitForTimeout(150);
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>controllerDevices80.calibration.step),0);
  await page.evaluate(()=>pad80.buttons[2]={pressed:false,value:0});await page.waitForFunction(()=>!controllerDevices80.calibration.waiting);
  const inputs=[['button',2],['button',3],['button',0],['button',1],['button',4],['button',5],['button',9],['button',10],['button',11],['axis',9,-1],['axis',9,.142857],['axis',9,.714286],['axis',9,-.428571],['axis',0,1],['axis',1,1],['axis',4,1],['axis',5,1]];
  const signal=async(input,on)=>page.evaluate(({input,on})=>{const [kind,index,value]=input;if(kind==='button')pad80.buttons[index]={pressed:on,value:on?1:0};else pad80.axes[index]=on?value:centers80[index]}, {input,on});
  for(let step=0;step<inputs.length;step++){
   await page.waitForFunction(step=>controllerDevices80.calibration?.step===step&&!controllerDevices80.calibration.waiting,step);
   if(step===1){await signal(inputs[0],true);await page.waitForFunction(()=>controllerDevices80.notice.includes('already assigned'));assert.equal(await page.evaluate(()=>controllerDevices80.calibration.step),1);await signal(inputs[0],false)}
   await signal(inputs[step],true);await page.waitForFunction(step=>controllerDevices80.calibration?.step===step+1,step);
   if(step===0){await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>controllerDevices80.calibration.step),1,'Held A cannot fill Back')}
   if(step===inputs.length-1){await page.waitForTimeout(150);assert.notEqual(await page.evaluate(()=>controllerDevices80.calibration),null,'Save waits for release')}
   await signal(inputs[step],false);
  }
  await page.waitForFunction(()=>!controllerDevices80.calibration&&controllerDevices80.configs.size===1);assert.equal(await page.evaluate(()=>controller.profile),'nintendo');
  assert.deepEqual(await page.evaluate(()=>controllerDevices80.normalize(pad80).axes),[0,0,0,0]);assert.equal(await page.evaluate(()=>pad80.axes[2]),1,'Idle legacy trigger axes remain raw');
  await page.waitForFunction(()=>document.querySelector('#controller-test-status').textContent.includes('Ready to test'));
  // Even mapped buttons only update the readout inside the diagnostic window.
  await signal(inputs[1],true);await page.waitForTimeout(100);assert.equal(await page.locator('#controller-test-dialog').evaluate(d=>d.open),true);await signal(inputs[1],false);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('fallback test'))}}));await page.locator('#controller-test-copy').click();
  await page.waitForFunction(()=>!document.querySelector('#controller-test-report').hidden);const report=JSON.parse(await page.locator('#controller-test-report').inputValue());assert.equal(report.device.mapping,'');assert.equal(report.device.customSetup,true);assert.equal(report.device.buttons.length,18);assert.equal(report.device.axes.length,10);assert.equal(report.testMode,true);
  // Choosing among raw and virtual devices targets the selected physical pad.
  await page.evaluate(()=>mode80='multi');await page.waitForFunction(()=>document.querySelector('#controller-test-device').options.length===3);await page.locator('#controller-test-device').selectOption('1');await page.waitForFunction(()=>controllerDevices80.raw?.index===1&&document.querySelector('#controller-test-info').textContent.includes('Standard'));
  await page.locator('#controller-test-device').selectOption('auto');
  await page.evaluate(()=>standard80.buttons[0]={pressed:true,value:1});await page.waitForFunction(()=>controllerDevices80.raw?.index===1);await page.evaluate(()=>standard80.buttons[0]={pressed:false,value:0});
  await signal(inputs[12],true);await page.waitForFunction(()=>controllerDevices80.raw?.index===0);assert.deepEqual(await page.evaluate(()=>controllerDevices80.observations.get(controllerDevices80.identity(pad80)).last.axes),[9]);await signal(inputs[12],false);
  await page.locator('#controller-test-close').click();await page.locator('#controller-close').click();await page.locator('#title-options-close').click();await page.waitForFunction(()=>controller.ready);
  await page.evaluate(()=>{state.pool=playableCards(BUNDLED_CARDS);state.catalogPool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;state.soundOn=false});
  const pressRaw=async(input)=>{await page.waitForFunction(()=>controller.ready);await signal(input,true);await page.waitForFunction(()=>{const pad=controllerDevices80.normalize(pad80);return pad&&pad.buttons.some((b,i)=>b.pressed&&controller.previous[i])});await signal(input,false);await page.waitForFunction(()=>controller.previous.length>0&&controller.previous.every(p=>!p))};
  // Physical Nintendo A is raw button 2 here; it must start and open packs correctly.
  await signal(inputs[0],true);await page.waitForFunction(()=>state.screen==='draft-screen');await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>state.boosterSealed),true);await signal(inputs[0],false);await page.waitForTimeout(80);
  await pressRaw(inputs[0]);await page.waitForFunction(()=>!state.boosterSealed&&!boosterTravel);
  await pressRaw(inputs[12]);assert.equal(await page.locator('.draft-option.controller-focus').getAttribute('data-card-index'),'1');
  await pressRaw(inputs[0]);assert.equal(await page.evaluate(()=>state.selection.get(0)),1);
  await pressRaw(inputs[6]);assert.equal(await page.evaluate(()=>state.rerolledPacks.has(0)),true);assert.equal(await page.locator('#pack-reroll .input-action-hint79').textContent(),'ZR');
  await page.evaluate(()=>{controller.focus(document.querySelector('.draft-option'))});await pressRaw(inputs[0]);await pressRaw(inputs[3]);assert.equal(await page.evaluate(()=>state.activePack),1);
  await page.evaluate(()=>{openCollection('catalog');controller.focus(document.querySelector('.collection-card'))});await signal(['axis',5,.9],true);await page.waitForFunction(()=>document.querySelector('#collection-grid').scrollTop>30);await signal(['axis',5,.9],false);await pressRaw(inputs[1]);
  // Held reconnect and reload reuse the mapping without firing a stale A press.
  await page.evaluate(()=>mode80='empty');await page.waitForFunction(()=>!controller.connected);await signal(inputs[0],true);await page.evaluate(()=>{pad80.index=3;mode80='raw'});await page.waitForFunction(()=>controller.connected);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>controller.ready),false);assert.equal(await page.evaluate(()=>state.boosterSealed),true);await signal(inputs[0],false);await page.waitForFunction(()=>controller.ready);
  await page.evaluate(()=>sessionStorage.setItem('device80-reload','yes'));await page.reload();await page.waitForFunction(()=>controllerDevices80.configs.size===1&&controller.ready);await open();await page.waitForFunction(()=>document.querySelector('#controller-test-info').textContent.includes('custom setup saved'));
  // Cancelling a replacement or disconnecting never discards a working mapping.
  await start();await page.locator('#controller-setup-cancel').click();assert.equal(await page.evaluate(()=>controllerDevices80.configs.size),1);await start();await page.evaluate(()=>mode80='empty');await page.waitForFunction(()=>!controllerDevices80.calibration);assert.equal(await page.evaluate(()=>controllerDevices80.configs.size),1);await page.evaluate(()=>mode80='raw');await page.waitForFunction(()=>controllerDevices80.raw);
  for(const viewport of [{width:1600,height:900},{width:1280,height:720},{width:390,height:844},{width:640,height:360}]){
   await page.setViewportSize(viewport);await page.waitForFunction(()=>Math.abs(document.querySelector('.game-shell').getBoundingClientRect().width-1600*Math.min(innerWidth/1600,innerHeight/900))<1);await page.locator('#controller-test-dialog').evaluate(d=>d.scrollTop=0);for(const selector of ['#controller-test-dialog','#controller-test-device','#controller-setup-layout'])assert.equal(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}),true,selector+' '+viewport.width);
   assert.equal(await page.locator('#controller-test-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.documentElement.scrollHeight<=innerHeight+1),true);
   if(viewport.width===390)await page.screenshot({path:'work/controller80-mobile.png'});
  }
  await page.setViewportSize({width:1600,height:900});await page.screenshot({path:'work/controller80-diagnostics.png'});
  await page.locator('#controller-setup-reset').click();await page.waitForFunction(()=>controllerDevices80.configs.size===0);assert.equal(await page.evaluate(()=>controllerDevices80.normalize(pad80)),null);
  await start();
  for(let step=0;step<13;step++){await page.waitForFunction(step=>controllerDevices80.calibration?.step===step&&!controllerDevices80.calibration.waiting,step);await signal(inputs[step],true);await page.waitForFunction(step=>controllerDevices80.calibration?.step===step+1,step);await signal(inputs[step],false)}
  await page.locator('#controller-setup-skip').click();await page.waitForFunction(()=>!controllerDevices80.calibration&&controllerDevices80.configs.size===1);assert.deepEqual(await page.evaluate(()=>controllerDevices80.normalize(pad80).axes),[0,0,0,0]);
  assert.deepEqual(errors,[]);console.log('PASS missing/blocked/empty/raw API states, live readout, safe diagnostic input, Nintendo raw buttons and hat/stick learning, duplicates/held/hidden guards, atomic cancel/save/reset, real draft/reroll/continue, right-stick scroll, device selection, report fallback, persisted reconnect/reload and four fitted viewports.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
