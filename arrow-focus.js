/* Hit-test arrow strokes without making the SVG intercept card clicks or drags. */
let arrowPointer70 = null;
let arrowFrame70 = 0;
const arrowSamples70 = new WeakMap();

function arrowDistance70(point, a, b) {
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
}
function arrowHover70() {
  if(!arrowPointer70||state.screen!=='combat-screen'||state.dragPayload||document.querySelector('dialog[open]'))return null;
  const {x,y}=arrowPointer70,target=document.elementFromPoint(x,y);
  if(!target?.closest('.arena-table'))return null;
  const unit=target.closest('[data-creature-id]');
  if(unit)return {kind:'unit',id:unit.dataset.creatureId,side:'player'};
  const svg=$('#combat-arrows'),matrix=svg.getScreenCTM();if(!matrix)return null;
  const point=new DOMPoint(x,y).matrixTransform(matrix.inverse());
  const threshold=7/Math.hypot(matrix.a,matrix.b);
  let nearest=null,best=threshold;
  for(const group of [...svg.querySelectorAll('.combat-route')].reverse()){
    const path=group.querySelector('.route-line'),d=path.getAttribute('d');
    let cached=arrowSamples70.get(path);
    if(!cached||cached.d!==d){const length=path.getTotalLength();cached={d,points:Array.from({length:65},(_,i)=>path.getPointAtLength(length*i/64))};arrowSamples70.set(path,cached);}
    for(let i=1;i<cached.points.length;i++){
      const distance=arrowDistance70(point,cached.points[i-1],cached.points[i]);
      if(distance<best){best=distance;nearest={kind:'route',key:group.dataset.routeKey};}
    }
  }
  return nearest;
}
function refreshArrowFocus70() {
  const svg=$('#combat-arrows'),b=state.battle,groups=[...svg.querySelectorAll('.combat-route')];
  let focus=arrowHover70();
  const selected=b&&(b.phase==='blocks'?b.selectedEnemyAttackerId:b.selectedEnemyTargetId);
  if(!focus&&selected&&b.enemyCreatures.some(e=>e.id===selected))focus={kind:'unit',id:selected,side:'enemy'};
  if(state.screen!=='combat-screen'||document.querySelector('dialog[open]'))focus=null;
  const outgoing=focus?.kind==='unit'&&focus.side==='player'&&groups.some(g=>g.dataset.fromId===focus.id&&g.dataset.arrowKind==='ally');
  const matches=g=>Boolean(focus&&(focus.kind==='route'?g.dataset.routeKey===focus.key:g.dataset.fromId===focus.id||(!outgoing&&focus.side==='player'&&g.dataset.toId===focus.id)));
  const active=groups.some(matches);svg.classList.toggle('has-arrow-focus70',active);
  for(const group of groups)group.classList.toggle('arrow-focused70',active&&matches(group));
}
document.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch')return;
  arrowPointer70={x:event.clientX,y:event.clientY};
  if(!arrowFrame70)arrowFrame70=requestAnimationFrame(()=>{arrowFrame70=0;refreshArrowFocus70();});
},{passive:true});
document.addEventListener('pointerout',event=>{if(!event.relatedTarget){arrowPointer70=null;refreshArrowFocus70();}});
window.addEventListener('blur',()=>{arrowPointer70=null;refreshArrowFocus70();});
$('.arena-table').addEventListener('click',event=>{
  const b=state.battle;
  if(!b||Date.now()<(state.suppressClickUntil||0)||event.target.closest('button,a,input,select,textarea,dialog'))return;
  if(!b.selectedEnemyTargetId&&!b.selectedEnemyAttackerId)return;
  b.selectedEnemyTargetId=null;b.selectedEnemyAttackerId=null;renderBattle();
});
const baseArrowScreen70=showScreen;
showScreen=function(id){arrowPointer70=null;return baseArrowScreen70(id);};
