/* Raw Gamepad diagnostics and learned mappings. Device reports stay in this browser. */
const controllerDevices80={
 pads:[],raw:null,error:'',available:true,preferred:null,calibration:null,lastDraw:0,lastMarkup:'',notice:'',
 key(pad){return JSON.stringify([pad.id,pad.mapping||'',pad.buttons.length,pad.axes.length]);},
 configs:new Map(),
 poll(){
  this.error='';this.available=typeof navigator.getGamepads==='function';
  try{this.pads=this.available?[...navigator.getGamepads()].filter(p=>p?.connected):[];}
  catch(error){this.error=error.name==='SecurityError'?'Controller access is blocked by the browser or page permissions.':`Controller API error: ${error.message}`;this.pads=[];}
  return this.pads;
 },
 choose(index){const pad=this.pads.find(p=>p.index===index);if(!pad)return;this.cancel('');this.preferred=index;controller.release();controller.index=null;this.raw=pad;this.lastDraw=0;},
 profile(pad){return pad?(this.configs.get(this.key(pad))?.profile||detectedPadLayout78(pad.id)):'xbox';},
 normalize(pad){
  const config=this.configs.get(this.key(pad));
  if(!config)return pad.mapping==='standard'?pad:null;
  const pressed=Array(17).fill(false);
  for(const [target,signal] of Object.entries(config.buttons)){
   pressed[target]=signal.kind==='button'?Boolean(pad.buttons[signal.index]?.pressed||pad.buttons[signal.index]?.value>.55):Math.abs((pad.axes[signal.index]??Infinity)-signal.value)<.18&&Math.abs(signal.value-signal.center)>.35;
  }
  const axes=Array(4).fill(0);
  for(const [target,axis] of Object.entries(config.axes||{})){const value=(pad.axes[axis.index]-axis.center)*axis.sign/axis.range;axes[target]=Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;}
  return {id:pad.id,index:pad.index,connected:true,mapping:'standard',buttons:pressed.map(down=>({pressed:down,value:down?1:0})),axes};
 },
 valid(config,pad){
  if(!config||config.version!==1||!['xbox','playstation','nintendo'].includes(config.profile)||!config.buttons||!config.axes)return false;
  const targets=[0,1,2,3,4,5,7,8,9,12,13,14,15],signals=new Set();if(Object.keys(config.buttons).some(key=>!targets.includes(Number(key))))return false;
  for(const target of targets){
   const s=config.buttons[target];if(!s||!Number.isInteger(s.index)||s.index<0)return false;
   if(s.kind==='button'){if(s.index>=pad.buttons.length)return false;}
   else if(s.kind!=='axis'||s.index>=pad.axes.length||![s.value,s.center].every(Number.isFinite)||Math.abs(s.value-s.center)<=.35)return false;
   const key=`${s.kind}:${s.index}:${s.kind==='axis'?Math.round(s.value*10):''}`;if(signals.has(key))return false;signals.add(key);
  }
  for(const [target,a] of Object.entries(config.axes))if(!['0','1','2','3'].includes(target)||!Number.isInteger(a.index)||a.index<0||a.index>=pad.axes.length||![a.center,a.sign,a.range].every(Number.isFinite)||![-1,1].includes(a.sign)||a.range<.4)return false;
  return true;
 },
 saved:{},
 load(pad){const key=this.key(pad);if(!this.configs.has(key)&&Object.hasOwn(this.saved,key)&&this.valid(this.saved[key],pad))this.configs.set(key,this.saved[key]);},
 save(){try{localStorage.setItem('bt-controller-maps-v1',JSON.stringify({...this.saved,...Object.fromEntries(this.configs)}));return true;}catch{return false;}},
 steps(profile){
  const p=INPUT_LAYOUTS78[profile];
  return [[p.confirm[1],`Press ${p.confirm[0]} · Select`],[p.back[1],`Press ${p.back[0]} · Back`],[2,`Press ${p.inspect[0]} · Details`],[3,`Press ${p.advance[0]} · Continue`],[4,`Press ${p.left} · Previous zone`],[5,`Press ${p.right} · Next zone`],[7,`Press ${p.reroll[0]} · Reroll`],[8,`Press ${p.deck} · Deck`],[9,`Press ${p.help} · Controls`],[12,'D-pad up'],[13,'D-pad down'],[14,'D-pad left'],[15,'D-pad right'],['axis0','Push the LEFT stick right'],['axis1','Push the LEFT stick down'],['axis2','Push the RIGHT stick right'],['axis3','Push the RIGHT stick down']];
 },
 begin(){
  const pad=this.raw;if(!pad)return;
  const choice=document.querySelector('#controller-setup-layout').value;
  const profile=['xbox','playstation','nintendo'].includes(choice)?choice:this.profile(pad);
  this.calibration={key:this.key(pad),profile,steps:this.steps(profile),step:0,waiting:true,centers:[...pad.axes],buttons:{},axes:{},candidate:'',since:0,neutralSince:0};
  document.querySelector('#controller-test-report').hidden=true;
  this.notice='';controller.release();this.lastDraw=0;
 },
 cancel(message='Setup cancelled; your previous mapping is unchanged.'){if(!this.calibration)return;this.calibration=null;this.notice=message;controller.release();this.lastDraw=0;},
 finish(){
  const c=this.calibration,pad=this.raw;if(!c||!pad||this.key(pad)!==c.key)return;
  const config={version:1,profile:c.profile,buttons:c.buttons,axes:c.axes};if(!this.valid(config,pad))return this.cancel('Setup could not be saved. Please start again.');
  this.configs.set(c.key,config);this.saved[c.key]=config;const saved=this.save();this.calibration=null;this.notice=saved?'Setup saved. Release controls, then use your controller.':'Setup is active for this page; browser storage is unavailable.';controller.setProfile(c.profile);controller.release();this.lastDraw=0;
 },
 learn(pad,now){
  const c=this.calibration;if(!c)return;
  if(this.key(pad)!==c.key)return this.cancel('Controller changed. Start setup again for this device.');
  if(!document.querySelector('#controller-test-dialog').open)return this.cancel();
  if(document.hidden||!document.hasFocus()){c.waiting=true;c.candidate='';c.neutralSince=0;return;}
  const down=pad.buttons.map(b=>Boolean(b.pressed||b.value>.55));
  const neutral=!down.some(Boolean)&&pad.axes.every((v,i)=>Math.abs(v-c.centers[i])<.2);
  if(c.waiting){
   if(neutral){if(!c.neutralSince)c.neutralSince=now;if(now-c.neutralSince>=80){c.waiting=false;c.neutralSince=0;if(c.step>=c.steps.length)return this.finish();}}
   else c.neutralSince=0;
   return;
  }
  if(c.step>=c.steps.length)return this.finish();
  const target=c.steps[c.step][0],stick=String(target).startsWith('axis');
  let candidate=null;
  if(!stick){const index=down.indexOf(true);if(index>=0)candidate={kind:'button',index};}
  if(!candidate){const axes=pad.axes.map((v,index)=>({index,value:v,delta:v-c.centers[index]})).filter(a=>Math.abs(a.delta)>(stick?.6:.4)).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));const a=axes[0];if(a)candidate=stick?{index:a.index,center:c.centers[a.index],sign:Math.sign(a.delta),range:Math.abs(a.delta)}:{kind:'axis',index:a.index,value:a.value,center:c.centers[a.index]};}
  if(!candidate){c.candidate='';return;}
  const signature=candidate.kind==='button'?`button:${candidate.index}`:stick?`stick:${candidate.index}:${candidate.sign}`:`axis:${candidate.index}:${Math.round(candidate.value*10)}`;if(c.candidate!==signature){c.candidate=signature;c.since=now;return;}
  if(now-c.since<80)return;
  if(!stick&&Object.values(c.buttons).some(s=>s.kind===candidate.kind&&s.index===candidate.index&&(s.kind==='button'||Math.abs(s.value-candidate.value)<.18))){this.notice='That control is already assigned. Use the requested control.';return;}
  if(stick&&Object.values(c.axes).some(a=>a.index===candidate.index)){this.notice='That stick axis is already assigned. Move the requested axis.';return;}
  if(stick)c.axes[String(target).slice(4)]=candidate;else c.buttons[target]=candidate;
  c.step++;c.waiting=true;c.candidate='';c.neutralSince=0;this.notice='';this.lastDraw=0;
 },
 sample(pad,now){
  this.raw=pad||null;if(pad)this.load(pad);if(this.calibration){if(pad)this.learn(pad,now);else this.cancel('Setup stopped after a disconnect. Your previous mapping is unchanged.');}
  const dialog=document.querySelector('#controller-test-dialog');if(!dialog.open)return;
  if(now-this.lastDraw<100)return;this.lastDraw=now;this.render();
 },
 status(){
  if(!this.available)return 'This browser does not expose the Gamepad API. Try this page in Edge or Chrome.';
  if(this.error)return this.error;
  if(!this.raw)return 'No controller exposed yet. Click the game, then press a controller button. Pairing in Windows alone is not enough.';
  if(this.calibration)return document.hidden||!document.hasFocus()?'Setup paused. Click this window, then release all controls.':'Setup in progress · game actions are paused.';
  if(!this.normalize(this.raw))return 'Controller detected, but its button layout is not standard. Use Set up buttons below.';
  if(document.hidden||!document.hasFocus())return 'Controller detected. Click this page to give the game focus.';
  if(!controller.autoDetect&&!controller.gamepadProfile())return `Controller detected, but input is locked to ${INPUT_LAYOUTS78[controller.profile].name}. Enable automatic detection or choose a controller layout.`;
  if(document.querySelector('#controller-test-dialog').open)return 'Ready to test · buttons and sticks update the readout without triggering game actions.';
  if(!controller.ready)return 'Controller detected. Release every button and center both sticks to enable input.';
  return 'Ready · press a button or move a stick. The raw values below should respond.';
 },
 render(){
  const pad=this.raw,select=document.querySelector('#controller-test-device');
  const options=this.pads.map(p=>[p.index,p.id]),signature=JSON.stringify(options);
  if(select.dataset.devices!==signature){select.replaceChildren(...options.map(([index,id])=>new Option(`${index+1} · ${id}`,index)));select.dataset.devices=signature;}
  if(pad)select.value=String(pad.index);select.disabled=!this.pads.length||Boolean(this.calibration);
  const layout=document.querySelector('#controller-setup-layout'),key=pad?this.key(pad):'';
  if(layout.dataset.device!==key){layout.value=controller.gamepadProfile()&&!controller.autoDetect?controller.profile:this.profile(pad);layout.dataset.device=key;}
  layout.disabled=!pad||Boolean(this.calibration);
  const text=this.status(),status=document.querySelector('#controller-test-status');if(status.textContent!==text)status.textContent=text;
  const info=pad?`${pad.mapping==='standard'?'Standard layout':'Unmapped layout'} · ${pad.buttons.length} buttons · ${pad.axes.length} axes${this.configs.has(this.key(pad))?' · custom setup saved':''}`:'Windows + Bluetooth: test the controller in Win+R → joy.cpl → Properties.';
  document.querySelector('#controller-test-info').textContent=info;
  document.querySelector('#controller-setup-start').disabled=!pad||Boolean(this.calibration);
  document.querySelector('#controller-setup-reset').disabled=!pad||!this.configs.has(this.key(pad))||Boolean(this.calibration);
  const raw=pad?pad.buttons.map((b,i)=>`B${i}: ${b.value.toFixed(2)}${b.pressed?' ●':''}`).join('  ')+'\n'+pad.axes.map((v,i)=>`Axis ${i}: ${v.toFixed(2)}`).join('  '):'Press a controller button after connecting.';
  const values=document.querySelector('#controller-test-values');if(values.textContent!==raw)values.textContent=raw;
  const c=this.calibration,setup=document.querySelector('#controller-setup-progress');setup.hidden=!c;
  values.hidden=Boolean(c);
  if(c){document.querySelector('#controller-setup-step').textContent=`${Math.min(c.step+1,c.steps.length)} / ${c.steps.length} · ${INPUT_LAYOUTS78[c.profile].name}`;document.querySelector('#controller-setup-prompt').textContent=c.waiting?'Release controls and center both sticks…':c.steps[c.step]?.[1]||'Finishing…';document.querySelector('#controller-setup-skip').hidden=c.step<13;}
  document.querySelector('#controller-test-notice').textContent=this.notice;
 },
 report(){
  const p=this.raw;return JSON.stringify({game:document.querySelector('.brand-version').textContent,browser:navigator.userAgent,apiAvailable:this.available,apiError:this.error,focused:document.hasFocus(),inputProfile:controller.profile,automatic:controller.autoDetect,ready:controller.ready,testMode:document.querySelector('#controller-test-dialog').open,status:this.status(),setupNotice:this.notice,device:p?{id:p.id,index:p.index,mapping:p.mapping,buttons:p.buttons.map(b=>({pressed:b.pressed,value:b.value})),axes:[...p.axes],customSetup:this.configs.has(this.key(p)),learnedMapping:this.configs.get(this.key(p))||null}:null},null,2);
 },
 initialize(){
  try{this.saved=JSON.parse(localStorage.getItem('bt-controller-maps-v1')||'{}')||{};}catch{}
  const dialog=document.querySelector('#controller-test-dialog');
  document.querySelector('#controller-test-open').addEventListener('click',()=>{dialog.showModal();this.poll();this.raw=this.pads.find(p=>p.index===controller.index)||this.pads[0]||null;this.render();});
  document.querySelector('#controller-test-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>this.cancel());
  document.querySelector('#controller-test-device').addEventListener('change',e=>this.choose(Number(e.target.value)));
  document.querySelector('#controller-setup-start').addEventListener('click',()=>this.begin());document.querySelector('#controller-setup-cancel').addEventListener('click',()=>this.cancel());
  document.querySelector('#controller-setup-skip').addEventListener('click',()=>{if(this.calibration?.step>=13){this.calibration.step=this.calibration.steps.length;this.calibration.waiting=true;}});
  document.querySelector('#controller-setup-reset').addEventListener('click',()=>{if(!this.raw)return;const key=this.key(this.raw);this.configs.delete(key);delete this.saved[key];const saved=this.save();this.notice=saved?'Custom setup removed. Standard controllers use their browser layout.':'Setup removed for this page; browser storage is unavailable.';controller.release();this.lastDraw=0;});
  document.querySelector('#controller-test-copy').addEventListener('click',async()=>{const field=document.querySelector('#controller-test-report');field.value=this.report();try{await navigator.clipboard.writeText(field.value);this.notice='Diagnostic report copied. Paste it in chat.';}catch{field.hidden=false;field.focus();field.select();this.notice='Copy the selected diagnostic report and paste it in chat.';}this.lastDraw=0;});
 }
};
