/* Small presentation effects never delay or change rules resolution. */
const prefersStill=()=>Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
function captureCardFlight(drag,target){
 const ghost=$('#drag-ghost');if(!ghost||!drag)return null;
 const rect=ghost.getBoundingClientRect();const source=drag.source?.getBoundingClientRect();const endpoint=target?.getBoundingClientRect();
 return{node:ghost.cloneNode(true),rect,source,endpoint,payload:{...drag.payload},battle:state.battle,existingIds:new Set([...(state.battle?.creatures||[]),...(state.battle?.permanents||[])].map(unit=>unit.id))};
}
function animateCardLanding(flight,accepted){
 if(!flight||prefersStill())return;
 let destination=null;const battle=state.battle;const payload=flight.payload;
 if(accepted&&battle===flight.battle&&!battle.choice){
  const newUnit=battle.creatures.find(unit=>!flight.existingIds.has(unit.id));const permanent=battle.permanents.find(unit=>!flight.existingIds.has(unit.id));
  if(newUnit)destination=document.querySelector(`[data-creature-id="${newUnit.id}"] .player-card-frame`);
  else if(permanent)destination=document.querySelector(`[data-permanent-id="${permanent.id}"] .permanent-card-frame`);
  else if(payload.kind==='equipment')destination=document.querySelector(`[data-permanent-id="${payload.id}"] .permanent-card-frame`);
 }
 const box=destination?.getBoundingClientRect()||(accepted&&!battle?.choice?flight.endpoint:flight.source);if(!box)return;
 const node=flight.node;node.removeAttribute('id');node.className='card-flight';node.removeAttribute('style');Object.assign(node.style,{position:'fixed',left:flight.rect.left+'px',top:flight.rect.top+'px',width:flight.rect.width+'px',height:flight.rect.height+'px'});document.body.append(node);
 const consumed=accepted&&!destination&&!battle?.choice;
 const targetWidth=destination?box.width:consumed?flight.rect.width*.48:box.width;
 const targetHeight=destination?box.height:consumed?flight.rect.height*.48:box.height;
 const dx=box.left+box.width/2-(flight.rect.left+flight.rect.width/2);const dy=box.top+box.height/2-(flight.rect.top+flight.rect.height/2);
 destination?.classList.add('landing-destination');
 const animation=node.animate([{transform:'translate(0,0) rotate(-2deg) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(${targetWidth/flight.rect.width},${targetHeight/flight.rect.height})`,opacity:consumed?0:1}],{duration:accepted?280:220,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
 animation.finished.catch(()=>{}).finally(()=>{node.remove();destination?.classList.remove('landing-destination');if(destination?.isConnected&&!prefersStill())destination.animate([{filter:'brightness(1.5)',transform:'scale(.98)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:180});});
}
function showEnemyHit(enemy,amount,box){
 if(!enemy||amount<=0||!box||!document.createElement)return;
 const fx=document.createElement('div');fx.className='enemy-hit-fx';fx.setAttribute('aria-hidden','true');fx.style.left=`${box.left+box.width/2}px`;fx.style.top=`${box.top+box.height*.35}px`;fx.innerHTML=`<i></i><b>−${amount}</b>`;document.body.append(fx);
 const still=prefersStill();const animation=fx.animate(still?[{opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-10%) scale(.7)'},{opacity:1,transform:'translate(-50%,-45%) scale(1.15)',offset:.2},{opacity:0,transform:'translate(-50%,-100%) scale(1)'}],{duration:still?180:650,easing:'ease-out'});animation.finished.catch(()=>{}).finally(()=>fx.remove());
 state.hitUntil||=new Map();state.hitUntil.set(enemy.id,Date.now()+420);
}
function enemyHitBox(enemy){return document.querySelector(`[data-enemy-attacker="${enemy.id}"] .monster-figure`)?.getBoundingClientRect();}
const originalDamageFirst=damageFirstEnemy;
damageFirstEnemy=function(amount,explicitTarget=null){const b=state.battle;const enemy=explicitTarget||(b?.resolvingSpellTarget?.side==='enemy'?b.enemyCreatures.find(unit=>unit.id===b.resolvingSpellTarget.id):null)||b?.enemyCreatures.find(unit=>unit.id===b.selectedEnemyTargetId&&!hasCreatureKeyword(unit,'hexproof'))||b?.enemyCreatures.find(unit=>!hasCreatureKeyword(unit,'hexproof'));const box=enemy&&enemyHitBox(enemy);const dealt=originalDamageFirst(amount,explicitTarget);if(dealt)showEnemyHit(enemy,dealt,box);return dealt;};
const originalDealCreatureDamage=dealCreatureDamage;
dealCreatureDamage=function(source,target,controller,battle,amount=Math.max(0,source.power||0)){const box=target.owner==='enemy'?enemyHitBox(target):null;const before=target.health;originalDealCreatureDamage(source,target,controller,battle,amount);if(box)showEnemyHit(target,Math.max(0,before-target.health),box);};
const originalRenderBattle=renderBattle;
renderBattle=function(){originalRenderBattle();const battle=state.battle;if(!battle)return;const table=$('.arena-table');const country=battle.stage?.country||'Iceland';const scene=['Morocco','Kenya','India'].includes(country)?'dunes':['Brazil','Japan','Peru','New Zealand'].includes(country)?'forest':country==='Greece'?'temple':'fjord';table.style.setProperty('--stage-scene',`url('assets/stages/${scene}.svg')`);table.dataset.scene=scene;for(const [id,until] of state.hitUntil||[]){if(until<Date.now())continue;const figure=document.querySelector(`[data-enemy-attacker="${id}"] .monster-figure`);if(figure&&!prefersStill()&&figure.animate)figure.animate([{filter:'brightness(2) sepia(.5)',transform:'translateX(-4px)'},{filter:'brightness(1.3)',transform:'translateX(4px)',offset:.35},{filter:'brightness(1)',transform:'translateX(0)'}],{duration:260});}const count=battle.copyNextSpell||0;const hint=$('#copy-spell-status');if(hint){hint.hidden=!count;hint.textContent=`✦ Next spell ×${count+1} · this turn`;}};
