/* Small presentation effects never delay or change rules resolution. */
const prefersStill=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
// Recover unrotated viewport dimensions once. Bounding boxes include fan/tap tilt.
function cardVisualPose96(element){
 if(!element?.isConnected)return null;
 const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)return null;
 let matrix=new DOMMatrix();
 for(let parent=element;parent;parent=parent.parentElement){
  const style=getComputedStyle(parent);let local=new DOMMatrix();
  if(style.rotate!=='none')local=local.rotate(parseFloat(style.rotate)||0);
  if(style.scale!=='none'){const scale=style.scale.split(' ').map(Number);local=local.scale(scale[0],scale[1]??scale[0]);}
  if(style.transform!=='none')local=local.multiply(new DOMMatrix(style.transform));
  matrix=local.multiply(matrix);
 }
 const width=(parseFloat(getComputedStyle(element).width)||element.offsetWidth)*Math.hypot(matrix.a,matrix.b),height=width*680/488;
 if(!(width>0))return null;
 const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
 return {x,y,width,height,left:x-width/2,top:y-height/2,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI};
}
function cancelCardDragMotion96(drag){if(drag?.motion96){cancelAnimationFrame(drag.motion96.frame);drag.motion96.frame=0;}}
function updateCardDragMotion96(drag,event,ghost){
 const m=drag.motion96,now=performance.now();if(!m)return;
 if(prefersStill()){cancelCardDragMotion96(drag);m.angle=0;ghost.style.setProperty('--drag-angle96','0deg');return;}
 const scale=parseFloat(document.documentElement.style.getPropertyValue('--game-scale'))||1,dt=Math.max(8,now-m.time),blend=1-Math.exp(-dt/35);
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 m.vx+=(clamp((event.clientX-m.x)/dt/scale,-2,2)-m.vx)*blend;
 m.vy+=(clamp((event.clientY-m.y)/dt/scale,-2,2)-m.vy)*blend;
 m.x=event.clientX;m.y=event.clientY;m.time=now;
 if(m.frame)return;
 m.tick=now;
 const step=time=>{
  m.frame=0;if(pointerDrag!==drag||!ghost.isConnected||prefersStill())return;
  const elapsed=clamp(time-m.tick,1,40);m.tick=time;
  m.vx*=Math.exp(-elapsed/90);m.vy*=Math.exp(-elapsed/90);
  const target=clamp(m.vx*7+m.vy*1.5,-10,10);
  m.angle+=(target-m.angle)*(1-Math.exp(-elapsed/48));
  if(Math.abs(m.angle)<.025&&Math.abs(m.vx)+Math.abs(m.vy)<.005){m.angle=0;ghost.style.setProperty('--drag-angle96','0deg');return;}
  ghost.style.setProperty('--drag-angle96',m.angle+'deg');m.frame=requestAnimationFrame(step);
 };
 m.frame=requestAnimationFrame(step);
}
const cardLandingEffects96=new Set();
function cancelCardLandings96(){for(const entry of [...cardLandingEffects96])entry.finish(false);}
function captureCardFlight(drag,target){
 const ghost=$('#drag-ghost'),pose=cardVisualPose96(ghost);if(!pose||!drag)return null;
 return {node:ghost.cloneNode(true),pose,source:cardVisualPose96(drag.face),sourceFace:drag.face,endpoint:target?.getBoundingClientRect(),payload:{...drag.payload},battle:state.battle,existingIds:new Set([...(state.battle?.creatures||[]),...(state.battle?.permanents||[])].map(unit=>unit.id))};
}
function animateCardLanding(flight,accepted){
 if(!flight||prefersStill()||document.hidden||state.screen!=='combat-screen'||state.battle!==flight.battle)return;
 let destination=null;const battle=state.battle,payload=flight.payload;
 if(accepted&&!battle.choice){
  const newUnit=battle.creatures.find(unit=>!flight.existingIds.has(unit.id)),permanent=battle.permanents.find(unit=>!flight.existingIds.has(unit.id));
  if(newUnit)destination=document.querySelector(`[data-creature-id="${newUnit.id}"] .player-card-frame`);
  else if(permanent)destination=document.querySelector(`[data-permanent-id="${permanent.id}"] .permanent-card-frame`);
  else if(payload.kind==='equipment')destination=document.querySelector(`[data-permanent-id="${payload.id}"] .permanent-card-frame`);
 }
 const pending=battle.choice||battle.pendingAttachment||battle.enemyCounterWindow;
 if(!destination&&(!accepted||pending))destination=flight.sourceFace?.isConnected?flight.sourceFace:null;
 const consumed=accepted&&!destination&&!pending,from=flight.pose;
 let to=destination?cardVisualPose96(destination):!accepted||pending?flight.source:null;
 if(!to&&consumed&&flight.endpoint){const r=flight.endpoint;to={x:r.left+r.width/2,y:r.top+r.height/2,width:from.width*.48,height:from.height*.48,angle:0};}
 if(!to)return;
 const node=flight.node;node.removeAttribute('id');node.className='card-flight';node.removeAttribute('style');node.setAttribute('aria-hidden','true');
 Object.assign(node.style,{position:'fixed',left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});document.body.append(node);
 const scale=Math.min(to.width/from.width,to.height/from.height),dx=to.x-from.x,dy=to.y-from.y;
 const angle=from.angle+((to.angle-from.angle+540)%360-180);
 destination?.classList.add('landing-destination');
 const animation=node.animate([{transform:`translate3d(0,0,0) rotate(${from.angle}deg) scale(1)`,opacity:1},{transform:`translate3d(${dx}px,${dy}px,0) rotate(${angle}deg) scale(${scale})`,opacity:consumed?0:1}],{duration:accepted?280:220,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
 let done=false;
 const entry={destination,finish(landed){if(done)return;done=true;node.remove();destination?.classList.remove('landing-destination');animation.cancel();cardLandingEffects96.delete(entry);if(landed&&destination?.isConnected&&!prefersStill()&&state.screen==='combat-screen')destination.animate([{filter:'brightness(1.35)'},{filter:'brightness(1)'}],{duration:150});}};
 cardLandingEffects96.add(entry);animation.finished.then(()=>entry.finish(true),()=>entry.finish(false));
}
const landingCombat96=document.getElementById('combat-screen');
if(landingCombat96)new MutationObserver(()=>{
 if(!landingCombat96.classList.contains('active'))cancelCardPresentation96();
 if(pointerDrag?.active&&!pointerDrag.source.isConnected)finishDrag();
 else for(const entry of [...cardLandingEffects96])if(entry.destination&&!entry.destination.isConnected)entry.finish(false);
}).observe(landingCombat96,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
function cancelCardPresentation96(){cancelCardLandings96();if(pointerDrag)finishDrag();}
window.addEventListener('resize',cancelCardPresentation96);window.addEventListener('blur',cancelCardPresentation96);
window.visualViewport?.addEventListener('resize',cancelCardPresentation96);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelCardPresentation96();});
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{cancelCardLandings96();cancelCardDragMotion96(pointerDrag);$('#drag-ghost')?.style.setProperty('--drag-angle96','0deg');});

function showEnemyHit(enemy,amount,box,poison=false){
 if(!enemy||amount<=0||!box||!document.createElement)return;
 const fx=document.createElement('div');fx.className=`enemy-hit-fx${poison?' poison-hit60':''}`;fx.setAttribute('aria-hidden','true');fx.style.left=`${box.left+box.width/2}px`;fx.style.top=`${box.top+box.height*.35}px`;fx.innerHTML=`<i></i><b>${poison?'☣ +':'−'}${amount}</b>`;document.body.append(fx);
 const still=prefersStill();const animation=fx.animate(still?[{opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-10%) scale(.7)'},{opacity:1,transform:'translate(-50%,-45%) scale(1.15)',offset:.2},{opacity:0,transform:'translate(-50%,-100%) scale(1)'}],{duration:still?180:650,easing:'ease-out'});animation.finished.catch(()=>{}).finally(()=>fx.remove());
 state.hitUntil||=new Map();state.hitUntil.set(enemy.id,Date.now()+420);
}
function enemyHitBox(enemy){return document.querySelector(`[data-enemy-attacker="${enemy.id}"] .monster-figure`)?.getBoundingClientRect();}
const originalDamageFirst=damageFirstEnemy;
damageFirstEnemy=function(amount,explicitTarget=null){const b=state.battle;const enemy=explicitTarget||(b?.resolvingSpellTarget?.side==='enemy'?b.enemyCreatures.find(unit=>unit.id===b.resolvingSpellTarget.id):null)||b?.enemyCreatures.find(unit=>unit.id===b.selectedEnemyTargetId&&!hasCreatureKeyword(unit,'hexproof'))||b?.enemyCreatures.find(unit=>!hasCreatureKeyword(unit,'hexproof'));const box=enemy&&enemyHitBox(enemy);const dealt=originalDamageFirst(amount,explicitTarget);if(dealt)showEnemyHit(enemy,dealt,box);return dealt;};
const originalDealCreatureDamage=dealCreatureDamage;
dealCreatureDamage=function(source,target,controller,battle,amount=Math.max(0,source.power||0),lifelinkEvents=null){const box=target.owner==='enemy'?enemyHitBox(target):null;const before=target.health;originalDealCreatureDamage(source,target,controller,battle,amount,lifelinkEvents);if(box&&!source.infect)showEnemyHit(target,Math.max(0,before-target.health),box);};
const originalRenderBattle=renderBattle;
renderBattle=function(){originalRenderBattle();const battle=state.battle;if(!battle)return;const table=$('.arena-table');const scene=battle.stage?.scene||'fjord';table.style.setProperty('--stage-scene',`url('assets/stages/${scene}.svg?v=0.56')`);table.dataset.scene=scene;for(const [id,until] of state.hitUntil||[]){if(until<Date.now())continue;const figure=document.querySelector(`[data-enemy-attacker="${id}"] .monster-figure`);if(figure&&!prefersStill()&&figure.animate)figure.animate([{filter:'brightness(2) sepia(.5)',transform:'translateX(-4px)'},{filter:'brightness(1.3)',transform:'translateX(4px)',offset:.35},{filter:'brightness(1)',transform:'translateX(0)'}],{duration:260});}const count=battle.copyNextSpell||0;const hint=$('#copy-spell-status');if(hint){hint.hidden=!count;hint.textContent=`✦ Next spell ×${count+1} · this turn`;}};
