/* Presentation follows committed game state; coin awards and card zones stay synchronous. */
const encounterPresentation82={active:null,animations:new Set(),countFrame:0,dialogAnimations:new WeakMap(),motion:matchMedia('(prefers-reduced-motion: reduce)'),
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
  return sources.filter(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth&&node.querySelector('img')}).slice(0,30).map(node=>({node:node.cloneNode(true),rect:node.getBoundingClientRect()}));
 },
 collectCards(cards){
  if(this.still())return;
  const target=document.querySelector('#results-screen.active #results-bounty82')?.getBoundingClientRect();
  const x=target?target.left+target.width/2:innerWidth*.5,y=target?target.top+target.height/2:innerHeight*.46;
  cards.forEach(({node,rect},i)=>{
   for(const part of [node,...node.querySelectorAll('*')]){part.removeAttribute('id');part.removeAttribute('tabindex');part.classList.remove('controller-focus','controller-editing','zone-arriving');for(const attr of [...part.attributes])if(attr.name.startsWith('data-'))part.removeAttribute(attr.name);}
   node.classList.add('encounter-card-flight82');node.setAttribute('aria-hidden','true');node.inert=true;
   Object.assign(node.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',padding:'0',pointerEvents:'none'});document.body.append(node);
   const dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2,tilt=(i%2?1:-1)*(9+i%4*3);
   this.track(node,[{transform:'translate3d(0,0,0) scale(1)',opacity:1},{transform:`translate3d(${dx*.32}px,${dy*.32-24}px,0) rotate(${tilt}deg) scale(.92)`,opacity:1,offset:.32},{transform:`translate3d(${dx}px,${dy}px,0) rotate(${tilt*2}deg) scale(.07)`,opacity:0}],{duration:300,delay:Math.min(84,i*6),easing:'cubic-bezier(.3,.7,.25,1)',fill:'both'},()=>node.remove());
  });
 },
 updateCount(progress){
  const r=this.active;if(!r)return;const lerp=(a,b)=>Math.round(a+(b-a)*progress);
  for(const [id,text] of [['results-bounty82','+'+lerp(0,r.coins)],['results-wallet82',String(lerp(r.walletBefore,r.wallet))],['results-level82',String(lerp(r.levelBefore,r.level))]]){const node=document.getElementById(id);if(node.textContent!==text)node.textContent=text;}
  document.querySelector('#results-screen').classList.toggle('counted82',progress===1);
 },
 finishCount(){cancelAnimationFrame(this.countFrame);this.countFrame=0;this.updateCount(1);},
 count(){
  this.finishCount();if(!this.active)return;if(this.still())return;
  this.updateCount(0);const started=performance.now(),receipt=this.active;
  const tick=now=>{if(this.active!==receipt)return;const t=Math.min(1,Math.max(0,(now-started-80)/620));this.updateCount(1-Math.pow(1-t,3));if(t<1)this.countFrame=requestAnimationFrame(tick);else this.countFrame=0;};
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
  showScreen('results-screen');playEncounterVictory82();this.count();document.querySelector('#results-continue').focus({preventScroll:true});return true;
 },
 continue(){
  const receipt=this.active;if(!receipt||receipt.consumed||state.screen!=='results-screen'||state.battle!==receipt.battle)return false;
  receipt.consumed=true;this.finishCount();this.active=null;return receipt.route();
 }
};
function beginEncounterPresentation82(battle){const ledger={wallet:encounterPresentation82.number(state.coins),level:encounterPresentation82.number(state.level,1),kills:[],presented:false,victoryPlayed:false};battle.receipt82=ledger;return ledger;}
function playEncounterVictory82(){const ledger=state.battle?.receipt82;if(ledger?.victoryPlayed)return;if(ledger)ledger.victoryPlayed=true;playSfx('victory');}
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
 if(old!==id){ui.track(document.getElementById(id),[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:180,easing:'cubic-bezier(.2,.7,.25,1)'});ui.collectCards(cards);}
 if(id==='results-screen')document.querySelector('#global-phase').textContent='RESULTS';return result;
};
const baseDialogPresentation82=HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal=function(...args){const open=this.open,result=baseDialogPresentation82.apply(this,args);if(!open){encounterPresentation82.dialogAnimations.get(this)?.cancel();const a=encounterPresentation82.track(this,[{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:140,easing:'ease-out'});if(a)encounterPresentation82.dialogAnimations.set(this,a);}return result;};
document.querySelector('#results-continue').addEventListener('click',()=>encounterPresentation82.continue());
function settlePresentation82(){encounterPresentation82.cancelMotion();encounterPresentation82.finishCount();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)settlePresentation82()});encounterPresentation82.motion.addEventListener('change',settlePresentation82);
window.addEventListener('resize',()=>encounterPresentation82.cancelMotion());
