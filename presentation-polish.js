/* v0.104 — bounded visual feedback; no rule delays or state/currency changes. */
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),active=new Map();
 const still=()=>motion.matches||document.hidden;
 function cancel(){for(const [node,job] of active){job.animation.cancel();node.classList.remove('screen-impact104');}active.clear();}
 window.screenImpact104=function(kind,amount=1){
  if(still()||pointerDrag?.active||cardLandingEffects96.size)return false;
  const pack=kind==='pack',combat=state.screen==='combat-screen';
  if(pack?state.screen!=='draft-screen':!combat)return false;
  const node=document.querySelector(pack?'#draft-grid':'#combat-screen .arena-table');if(!node)return false;
  const factor=kind==='player'?1.15:kind==='defeat'?1.35:kind==='pack'?1.1:.65;
  const amplitude=Math.min(kind==='player'?6:5,Math.max(1,Math.sqrt(Math.max(0,amount))*factor));
  const old=active.get(node);if(old&&old.amplitude>=amplitude)return false;
  const start=getComputedStyle(node).translate;old?.animation.cancel();
  const scale=pack?1:Math.max(.1,parseFloat(document.documentElement.style.getPropertyValue('--game-scale'))||1),distance=amplitude/scale;
  const points=[[0,0],[-1,.28],[.72,-.22],[-.44,.14],[.23,-.08],[-.08,.02],[0,0]];
  const frames=points.map(([x,y],i)=>({translate:i===0&&start!=='none'?start:`${x*distance}px ${y*distance}px`}));
  const animation=node.animate(frames,{duration:170+amplitude*12,easing:'linear'}),job={animation,amplitude};
  active.set(node,job);node.classList.add('screen-impact104');
  const finish=()=>{if(active.get(node)===job){active.delete(node);node.classList.remove('screen-impact104');}};
  animation.finished.then(finish,finish);return true;
 };
 const baseHit=showEnemyHit;
 showEnemyHit=function(enemy,amount,box,poison=false){const result=baseHit(enemy,amount,box,poison);if(box&&amount>0&&!poison)screenImpact104('enemy',amount);return result;};
 const baseBounty=awardBounty;
 awardBounty=function(enemy){const paid=enemy?.bountyClaimed,result=baseBounty(enemy);if(enemy?.owner==='enemy'&&!paid&&enemy.bountyClaimed)screenImpact104('defeat',enemy.tier==='boss'?16:enemy.tier==='minion'?3:7);return result;};
 const baseResolve=resolvePaidCard44;
 resolvePaidCard44=function(card,b=state.battle){
  const ids=new Set((b?.creatures||[]).map(u=>u.id)),result=baseResolve(card,b);
  if(b===state.battle){const weight=Math.max(0,...b.creatures.filter(u=>!ids.has(u.id)).map(u=>Math.max(card.cmc||0,u.power||0,(u.toughness||0)*.75)));if(weight>=5)screenImpact104('summon',weight);}
  return result;
 };
 const basePack=playBoosterOpeningSound,opened=new WeakMap();
 playBoosterOpeningSound=function(...args){
  const result=basePack(...args),packs=state.packs,index=state.activePack||0;
  if(Array.isArray(packs)){if(!opened.has(packs))opened.set(packs,new Set());const seen=opened.get(packs);if(!seen.has(index)){seen.add(index);screenImpact104('pack',10);}}
  return result;
 };
 // Preserve each physical card's phase through re-renders and index changes.
 const phases=new WeakMap();let next=0;
 const baseHand=renderHand;
 renderHand=function(){
  const result=baseHand(),b=state.battle;if(!b)return result;
  for(const node of document.querySelectorAll('#hand-row .hand-card')){
   const card=b.hand[Number(node.dataset.handIndex)];if(!card)continue;
   if(!phases.has(card)){const i=next++;phases.set(card,{duration:5.4+(i%5)*.43,phase:(i*.79)%5.4});}
   const {duration,phase}=phases.get(card),body=document.createElement('span');body.className='hand-sway104';body.setAttribute('aria-hidden','true');
   body.style.setProperty('--sway-duration104',duration+'s');body.style.setProperty('--sway-delay104',-((performance.now()/1000+phase)%duration)+'s');
   body.append(...node.childNodes);node.append(body);
  }
  return result;
 };
 const baseScreen=showScreen;
 showScreen=function(id){if(id!==state.screen)cancel();return baseScreen(id);};
 function visibility(){document.documentElement.classList.toggle('motion-paused104',document.hidden);if(still())cancel();}
 document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',visibility);
 window.addEventListener('resize',cancel);window.addEventListener('blur',cancel);
 window.visualViewport?.addEventListener('resize',cancel);
 document.addEventListener('pointerdown',cancel,{capture:true,passive:true});
 window.presentationPolish104={cancel,active};visibility();
})();
