/* Presentation follows committed game state; coin awards and card zones stay synchronous. */
const encounterPresentation82={active:null,animations:new Set(),countFrame:0,coinGeneration:0,coinPlayedAt:-Infinity,coinVoices:new Set(),finishGeneration85:0,finishTimer85:0,finishVoice85:null,dialogAnimations:new WeakMap(),motion:matchMedia('(prefers-reduced-motion: reduce)'),
 number(value,fallback=0){return Number.isFinite(value)?Math.trunc(value):fallback;},
 still(){return this.motion.matches||document.hidden;},
 track(node,frames,options,finish){
  if(this.still()||!node?.animate){finish?.();return null;}
  const animation=node.animate(frames,options);this.animations.add(animation);
  const done=()=>{this.animations.delete(animation);finish?.();};animation.finished.then(done,done);return animation;
 },
 cancelMotion(){for(const animation of this.animations)animation.cancel();this.animations.clear();document.querySelectorAll('.encounter-card-flight82').forEach(node=>node.remove());},
 captureCards(){
  if(this.still())return[];
  const selectors=['#library-button .library-stack','#graveyard-pile .graveyard-card','.mana-land','.player-card-frame','.permanent-card-frame','.hand-card'];
  const sources=[...new Set(selectors.flatMap(selector=>[...document.querySelectorAll('#combat-screen '+selector)]))];
  return sources.flatMap(node=>{
   const image=node.querySelector('img');if(!image)return[];
   const rect=image.getBoundingClientRect();if(!rect.width||!rect.height||rect.bottom<=0||rect.right<=0||rect.top>=innerHeight||rect.left>=innerWidth)return[];
   // Bounding rectangles already contain fan/tap rotation. Recover the image's
   // unrotated viewport size, including the fixed-canvas scale, only once.
   let matrix=new DOMMatrix();
   for(let parent=image;parent;parent=parent.parentElement){
    const style=getComputedStyle(parent);let local=new DOMMatrix();
    if(style.rotate!=='none')local=local.rotate(parseFloat(style.rotate)||0);
    if(style.scale!=='none'){const scales=style.scale.split(' ').map(Number);local=local.scale(scales[0],scales[1]??scales[0]);}
    if(style.transform!=='none')local=local.multiply(new DOMMatrix(style.transform));
    matrix=local.multiply(matrix);
   }
   const style=getComputedStyle(image),width=parseFloat(style.width)*Math.hypot(matrix.a,matrix.b),height=parseFloat(style.height)*Math.hypot(matrix.c,matrix.d);
   if(!(width>0&&height>0))return[];
   return[{src:image.currentSrc||image.src,x:rect.left+rect.width/2,y:rect.top+rect.height/2,width,height,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI}];
  }).slice(0,30);
 },
 collectCards(cards){
  if(this.still())return;
  const target=document.querySelector('#results-screen.active #results-bounty82')?.getBoundingClientRect();
  const x=target?target.left+target.width/2:innerWidth*.5,y=target?target.top+target.height/2:innerHeight*.46;
  cards.forEach((card,i)=>{
   // Never copy gameplay classes or descendants into the unscaled body overlay.
   const node=document.createElement('img');node.src=card.src;node.alt='';node.draggable=false;node.className='encounter-card-flight82';node.setAttribute('aria-hidden','true');node.inert=true;
   Object.assign(node.style,{left:(card.x-card.width/2)+'px',top:(card.y-card.height/2)+'px',width:card.width+'px',height:card.height+'px'});document.body.append(node);
   const dx=x-card.x,dy=y-card.y,tilt=(i%2?1:-1)*(7+i%4*2);
   this.track(node,[{transform:`translate3d(0,0,0) rotate(${card.angle}deg) scale(1)`,opacity:1},{transform:`translate3d(${dx*.15}px,${dy*.15-18}px,0) rotate(${card.angle+tilt}deg) scale(.96)`,opacity:1,offset:.3},{transform:`translate3d(${dx}px,${dy}px,0) rotate(${card.angle+tilt*2}deg) scale(.07)`,opacity:0}],{duration:820,delay:Math.min(140,i*12),easing:'cubic-bezier(.35,.05,.25,1)',fill:'both'},()=>node.remove());
  });
 },
 stopCoinSounds(){
  this.coinGeneration++;this.coinPlayedAt=-Infinity;for(const voice of this.coinVoices){try{voice.voiceGain.gain.setTargetAtTime(0,soundEngine.context.currentTime,.006);voice.stop(soundEngine.context.currentTime+.025);}catch{}}
  this.coinVoices.clear();
 },
 coinTick(receipt){
  if(!effectsAudible75()||this.still())return;
  const generation=this.coinGeneration,epoch=soundEngine.epoch||0,started=performance.now();
  soundEngine.resume().then(()=>recordedSoundBuffer(RECORDED_SFX['receipt-coin'][0])).then(buffer=>{
   if(this.active!==receipt||receipt.consumed||generation!==this.coinGeneration||(soundEngine.epoch||0)!==epoch||!effectsAudible75()||this.still()||performance.now()-started>180||performance.now()-this.coinPlayedAt<100)return;
   this.coinPlayedAt=performance.now();const voice=startRecordedVoice('receipt-coin',buffer);this.coinVoices.add(voice);voice.addEventListener('ended',()=>this.coinVoices.delete(voice),{once:true});
  }).catch(()=>{});
 },
 stopFinishSound85(){
  this.finishGeneration85++;clearTimeout(this.finishTimer85);this.finishTimer85=0;
  if(this.finishVoice85){try{this.finishVoice85.voiceGain.gain.setTargetAtTime(0,soundEngine.context.currentTime,.006);this.finishVoice85.stop(soundEngine.context.currentTime+.025);}catch{}this.finishVoice85=null;}
 },
 queueFinishSound85(receipt,delay=140){
  if(!receipt||receipt.finishQueued85||receipt.battle.receipt82?.victoryPlayed)return;
  receipt.finishQueued85=true;receipt.battle.receipt82.victoryPlayed=true;
  if(!effectsAudible75()||document.hidden||receipt.consumed)return;
  const generation=this.finishGeneration85,epoch=soundEngine.epoch||0,started=performance.now();
  this.finishTimer85=setTimeout(()=>{
   this.finishTimer85=0;
   soundEngine.resume().then(()=>recordedSoundBuffer(RECORDED_SFX['receipt-finish'][0])).then(buffer=>{
    if(this.active!==receipt||receipt.consumed||state.screen!=='results-screen'||state.battle!==receipt.battle||generation!==this.finishGeneration85||(soundEngine.epoch||0)!==epoch||!effectsAudible75()||document.hidden||performance.now()-started>delay+250)return;
    const voice=startRecordedVoice('receipt-finish',buffer);this.finishVoice85=voice;
    voice.addEventListener('ended',()=>{if(this.finishVoice85===voice)this.finishVoice85=null;},{once:true});
   }).catch(()=>{});
  },delay);
 },
 stopRain86(){document.querySelector('.results-rain86')?.remove();},
 startRain86(){
  if(state.screen!=='results-screen'||this.still()||document.querySelector('.results-rain86'))return;
  const screen=document.querySelector('#results-screen'),seed=(state.node||1)*31+(state.battle?.turn||1)*17;
  const rain=createCardRain105({kind:'results',seed,art:state.deck.filter(card=>card.image)});
  screen.prepend(rain);
 },
 updateCount(progress){
  const r=this.active;if(!r)return;const lerp=(a,b)=>Math.round(a+(b-a)*progress);
  for(const [id,text] of [['results-bounty82','+'+lerp(0,r.coins)],['results-wallet82',String(lerp(r.walletBefore,r.wallet))],['results-level82',String(lerp(r.levelBefore,r.level))]]){const node=document.getElementById(id);if(node.textContent!==text)node.textContent=text;}
  document.querySelector('#results-screen').classList.toggle('counted82',progress===1);
 },
 finishCount(){cancelAnimationFrame(this.countFrame);this.countFrame=0;this.stopCoinSounds();this.stopFinishSound85();this.updateCount(1);},
 count(){
  this.finishCount();if(!this.active)return;if(this.still()){if(!document.hidden)this.queueFinishSound85(this.active,0);return;}
  this.updateCount(0);const started=performance.now(),receipt=this.active,steps=Math.min(8,Math.max(0,receipt.coins));let lastStep=0;
  const tick=now=>{
   if(this.active!==receipt)return;
   const t=Math.min(1,Math.max(0,(now-started-600)/1200)),progress=t*(1.25-.25*t),step=Math.floor(progress*steps);
   this.updateCount(progress);if(step>lastStep){lastStep=step;this.coinTick(receipt);}
   if(t<1)this.countFrame=requestAnimationFrame(tick);else{this.countFrame=0;this.queueFinishSound85(receipt);}
  };
  this.countFrame=requestAnimationFrame(tick);
 },
 present(battle,route){
  const ledger=battle.receipt82||beginEncounterPresentation82(battle);if(ledger.presented||this.active)return false;
  ledger.presented=true;
  const groups=new Map();for(const kill of ledger.kills){const item=groups.get(kill.name)||{name:kill.name,count:0,coins:0};item.count++;item.coins+=kill.coins;groups.set(kill.name,item);}
  let rows=[...groups.values()];if(rows.length>6){const rest=rows.slice(5);rows=[...rows.slice(0,5),{name:'Other foes',count:rest.reduce((s,r)=>s+r.count,0),coins:rest.reduce((s,r)=>s+r.coins,0)}];}
  this.active={battle,route,coins:ledger.kills.reduce((sum,k)=>sum+k.coins,0),walletBefore:ledger.wallet,wallet:this.number(state.coins),levelBefore:ledger.level,level:this.number(state.level,1),consumed:false};
  document.querySelector('#results-stage82').textContent=battle.stage?.name||'The Aether';
  document.querySelector('#results-run82').textContent=immortalMode76()?`IMMORTAL · WAVE ${battle.immortalWave76||state.node}`:`${state.endless?'ENDLESS':'ENCOUNTER'} ${state.node}`;
  document.querySelector('#results-defeated82').textContent=String(ledger.kills.length);
  document.querySelector('#results-turns82').textContent=String(battle.turn);
  document.querySelector('#results-wallet-before82').textContent=String(ledger.wallet);
  document.querySelector('#results-level-before82').textContent=String(ledger.level);
  document.querySelector('#results-deck82').textContent=String(state.deck.length);
  document.querySelector('#results-breakdown82').innerHTML=rows.length?rows.map((row,i)=>`<div class="result-bounty-row82" style="--row:${i}"><span>${escapeHtml(row.name)}${row.count>1?` <small>×${row.count}</small>`:''}</span><b>+${row.coins} <small>◈</small></b></div>`).join(''):'<div class="result-bounty-row82"><span>Encounter cleared</span><b>+0 <small>◈</small></b></div>';
  showScreen('results-screen');this.count();document.querySelector('#results-continue').focus({preventScroll:true});return true;
 },
 continue(){
  const receipt=this.active;if(!receipt||receipt.consumed||state.screen!=='results-screen'||state.battle!==receipt.battle)return false;
  receipt.consumed=true;this.finishCount();this.active=null;return receipt.route();
 }
};
function beginEncounterPresentation82(battle){const ledger={wallet:encounterPresentation82.number(state.coins),level:encounterPresentation82.number(state.level,1),kills:[],presented:false,victoryPlayed:false};battle.receipt82=ledger;return ledger;}
function playEncounterVictory82(){const ledger=state.battle?.receipt82;if(ledger?.presented||ledger?.victoryPlayed)return;if(ledger)ledger.victoryPlayed=true;playSfx('receipt-finish');}
const baseBountyPresentation82=awardBounty;
awardBounty=function(enemy){const b=state.battle,ledger=b?(b.receipt82||beginEncounterPresentation82(b)):null,claimed=Boolean(enemy?.bountyClaimed);const amount=baseBountyPresentation82(enemy);if(ledger&&enemy?.owner==='enemy'&&!claimed&&enemy.bountyClaimed)ledger.kills.push({name:enemy.card?.name||'Enemy',coins:encounterPresentation82.number(amount)});return amount;};
const baseRewardPresentation82=offerEncounterReward59;
offerEncounterReward59=function(){const b=state.battle;if(encounterPresentation82.active?.battle===b)return;if(b?.phase==='complete'&&!b.receipt82?.presented&&state.screen==='combat-screen'&&encounterPresentation82.present(b,()=>baseRewardPresentation82()))return;return baseRewardPresentation82();};
const baseEndPresentation82=endRun;
endRun=function(won,reason=null){const b=state.battle;if(won&&encounterPresentation82.active?.battle===b)return;if(won&&b&&!b.receipt82?.presented&&state.screen==='combat-screen'){b.phase='complete';b.priorityCallback=null;if(encounterPresentation82.present(b,()=>baseEndPresentation82(won,reason)))return;}return baseEndPresentation82(won,reason);};
screens.push('results-screen');
const baseScreenPresentation82=showScreen;
showScreen=function(id){
 const ui=encounterPresentation82,old=state.screen;
 const cards=old==='combat-screen'&&id!==old&&state.battle?.phase==='complete'?ui.captureCards():[];
 ui.cancelMotion();if(old==='results-screen'&&id!==old&&ui.active){ui.finishCount();ui.active=null;}
 const result=baseScreenPresentation82(id);
 if(old!==id){playTransitionSound84(()=>state.screen===id);ui.track(document.getElementById(id),[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:180,easing:'cubic-bezier(.2,.7,.25,1)'});ui.collectCards(cards);}
 if(id==='results-screen'){document.querySelector('#global-phase').textContent='RESULTS';ui.startRain86();}else ui.stopRain86();return result;
};
const baseDialogPresentation82=HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal=function(...args){const open=this.open,result=baseDialogPresentation82.apply(this,args);if(!open){playTransitionSound84(()=>this.open);encounterPresentation82.dialogAnimations.get(this)?.cancel();const a=encounterPresentation82.track(this,[{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:140,easing:'ease-out'});if(a)encounterPresentation82.dialogAnimations.set(this,a);}return result;};
document.querySelector('#results-continue').addEventListener('click',()=>encounterPresentation82.continue());
function settlePresentation82(){encounterPresentation82.cancelMotion();encounterPresentation82.finishCount();encounterPresentation82.stopRain86();if(!encounterPresentation82.still())encounterPresentation82.startRain86();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)settlePresentation82();else encounterPresentation82.startRain86();});encounterPresentation82.motion.addEventListener('change',settlePresentation82);
window.addEventListener('resize',()=>encounterPresentation82.cancelMotion());
