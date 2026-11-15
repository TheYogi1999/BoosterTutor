const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.removeItem('bt-input-settings-v1');localStorage.removeItem('bt-controller-maps-v1');localStorage.setItem('bt-music-enabled','false');localStorage.setItem('bt-sfx-enabled','false');
   const buttons=n=>Array.from({length:n},()=>({pressed:false,value:0}));
   window.vjoy81={id:'vJoy - Virtual Joystick (Vendor: 1234 Product: bead)',index:0,connected:true,mapping:'',buttons:buttons(8),axes:Array(10).fill(0)};
   window.xbox81={id:'HID-compliant game controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',index:1,connected:true,mapping:'standard',buttons:buttons(17),axes:[.006088349736781851,-.009079118028534339,-.01390096894789039,-.011673151750972721]};
   window.nintendo81={id:'Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2009)',index:2,connected:true,mapping:'standard',buttons:buttons(18),axes:[0,0,0,0]};
   window.pads81=[vjoy81,xbox81,nintendo81];Object.defineProperty(navigator,'getGamepads',{value:()=>pads81});
  });
  await page.goto(process.env.BOOSTERTUTOR_URL||'http://127.0.0.1:8000/');await page.bringToFront();
  await page.waitForFunction(()=>controller.index===1&&controller.ready);assert.equal(await page.evaluate(()=>controllerDevices80.raw.id),await page.evaluate(()=>xbox81.id),'Idle vJoy at index zero cannot capture startup');
  await page.evaluate(()=>{state.soundOn=false;state.pool=playableCards(BUNDLED_CARDS);state.catalogPool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS});
  const button=async(name,index,down)=>page.evaluate(({name,index,down})=>{window[name].buttons[index]={pressed:down,value:down?1:0}}, {name,index,down});
  await button('xbox81',0,true);await page.waitForFunction(()=>state.screen==='draft-screen');await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>state.boosterSealed),true);assert.equal(await page.evaluate(()=>controller.profile),'xbox');await button('xbox81',0,false);await page.waitForFunction(()=>controller.previous[0]===false);
  // Small real Xbox resting jitter and an unmapped virtual button never steal focus.
  await page.evaluate(()=>{xbox81.axes[0]=.02;vjoy81.buttons[0]={pressed:true,value:1}});await page.waitForTimeout(130);assert.equal(await page.evaluate(()=>controller.index),1);await button('vjoy81',0,false);
  // Nintendo's first press transfers ownership and glyphs, but is consumed until release.
  await button('nintendo81',1,true);await page.waitForFunction(()=>controller.index===2&&controller.profile==='nintendo');await page.waitForTimeout(130);assert.equal(await page.evaluate(()=>state.boosterSealed),true);assert.equal(await page.evaluate(()=>controller.ready),false);await button('nintendo81',1,false);await page.waitForFunction(()=>controller.ready);
  await button('nintendo81',1,true);await page.waitForFunction(()=>!state.boosterSealed&&!boosterTravel);await button('nintendo81',1,false);await page.waitForFunction(()=>controller.previous[1]===false);
  assert.equal(await page.locator('#draft-confirm .input-action-hint79').textContent(),'X');assert.equal(await page.locator('#pack-reroll .input-action-hint79').textContent(),'ZR');
  // Switch back with the right trigger; holding it cannot accidentally reroll on transfer.
  await button('xbox81',7,true);await page.waitForFunction(()=>controller.index===1&&controller.profile==='xbox');await page.waitForTimeout(130);assert.equal(await page.evaluate(()=>state.rerolledPacks.size),0);await button('xbox81',7,false);await page.waitForFunction(()=>controller.ready);
  await button('xbox81',7,true);await page.waitForFunction(()=>state.rerolledPacks.has(0));await button('xbox81',7,false);await page.waitForFunction(()=>controller.previous[7]===false);
  // The diagnostic dropdown defaults to Automatic and follows real input from any device.
  await page.locator('#options-button').click();await page.locator('#controller-help-button').click();await page.locator('#controller-test-open').click();
  assert.equal(await page.locator('#controller-test-device').inputValue(),'auto');assert.equal(await page.locator('#controller-test-device option').count(),4);
  await button('nintendo81',3,true);await page.waitForFunction(()=>controllerDevices80.raw.index===2);await button('nintendo81',3,false);
  await page.waitForFunction(()=>document.querySelector('#controller-test-activity').textContent.includes('B3'));await page.waitForTimeout(140);assert.equal(await page.locator('#controller-test-dialog').evaluate(d=>d.open),true);assert.ok((await page.locator('#controller-test-activity').textContent()).includes('B3'),'Released tap remains visible');
  await page.locator('#controller-test-device').selectOption('2');await button('xbox81',2,true);await page.waitForTimeout(130);assert.equal(await page.evaluate(()=>controllerDevices80.raw.index),2,'Manual test selection stays pinned');await button('xbox81',2,false);
  const report=await page.evaluate(()=>JSON.parse(controllerDevices80.report()));assert.equal(report.deviceSelection,'manual test selection');assert.equal(report.connectedDevices.length,3);
  const joy=report.connectedDevices.find(p=>p.index===0),xb=report.connectedDevices.find(p=>p.index===1),nin=report.connectedDevices.find(p=>p.index===2);
  assert.equal(joy.virtual,true);assert.equal(xb.virtual,false);assert.ok(xb.inputEvents>0);assert.ok(nin.inputEvents>0);assert.deepEqual(nin.lastInput.buttons,[3]);assert.equal(nin.buttons[3].value,0);assert.equal(nin.lastInput.rawButtons[3].value,1);
  await page.locator('#controller-test-device').selectOption('auto');await button('xbox81',5,true);await page.waitForFunction(()=>controllerDevices80.raw.index===1);await button('xbox81',5,false);
  // A drifting/held inactive stick cannot repeatedly take over; deliberate movement can.
  await page.evaluate(()=>nintendo81.axes[0]=.8);await page.waitForFunction(()=>controllerDevices80.raw.index===2);await button('xbox81',4,true);await page.waitForFunction(()=>controllerDevices80.raw.index===1);await button('xbox81',4,false);await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>controllerDevices80.raw.index),1);
  await page.evaluate(()=>nintendo81.axes[0]=0);await page.waitForTimeout(50);await page.evaluate(()=>nintendo81.axes[0]=-.9);await page.waitForFunction(()=>controllerDevices80.raw.index===2);await page.evaluate(()=>nintendo81.axes[0]=0);
  // Explicit vJoy inspection is allowed but cannot become a permanent gameplay lock.
  await page.locator('#controller-test-device').selectOption('0');await page.waitForFunction(()=>controllerDevices80.raw.index===0);await page.locator('#controller-test-close').click();await page.waitForFunction(()=>controller.index!==0&&controllerDevices80.preferred===null);
  await page.locator('#controller-close').click();await page.locator('#title-options-close').click();await page.waitForFunction(()=>controller.ready);
  // A later device keeps its own neutral gate and unplugging the active pad chooses a usable one.
  await page.evaluate(()=>{nintendo81.connected=false;pads81=[vjoy81,xbox81]});await page.waitForFunction(()=>controller.index===1&&controller.ready);
  await page.evaluate(()=>{nintendo81.connected=true;nintendo81.buttons[1]={pressed:true,value:1};pads81=[vjoy81,xbox81,nintendo81]});await page.waitForFunction(()=>controller.index===2);assert.equal(await page.evaluate(()=>controller.ready),false);await button('nintendo81',1,false);await page.waitForFunction(()=>controller.ready);
  await page.evaluate(()=>{nintendo81.connected=false;pads81=[vjoy81,xbox81]});await page.waitForFunction(()=>controller.index===1&&controller.ready);
  await page.locator('#options-button').click();await page.locator('#controller-help-button').click();await page.locator('#controller-test-open').click();await page.screenshot({path:'work/controllers81-multiple.png'});
  assert.deepEqual(errors,[]);console.log('PASS exact vJoy/Xbox/Nintendo report fixture, usable startup selection, Xbox first action, last-input handoff, held/reconnect safety, drift/virtual rejection, controller glyphs, auto/manual test selection, retained taps and all-device diagnostic history.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
