/* Observe zone presentation; logical card moves and combat never wait for a flight. */
const cardZoneEffects = (() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const draws = new WeakMap(), graveMoves = new WeakMap();
  const flights = new Set();
  const combat = document.getElementById('combat-screen');
  let snapshot = null, frame = 0, generation = 0, hit = null, drawSequence = 0;
  const rect = element => {
    if (!element?.isConnected) return null;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 ? box : null;
  };
  const visible = () => !document.hidden && combat.classList.contains('active');
  function clearFlights() {
    generation++;
    for (const entry of [...flights]) entry.finish();
    document.querySelectorAll('.zone-arriving').forEach(node => node.classList.remove('zone-arriving'));
  }
  function added(before, after) {
    const counts = new Map();
    before.forEach(card => counts.set(card,(counts.get(card)||0)+1));
    return after.filter(card => {
      const n=counts.get(card)||0;
      if(n){counts.set(card,n-1);return false;}
      return true;
    });
  }
  function collectSources(old, battle) {
    if (!old) return [];
    const alive = new Set([...battle.creatures,...battle.permanents].map(unit=>unit.id));
    const units = old.units.filter(unit=>!alive.has(unit.id)).map(unit=>({card:unit.card,originalCard:unit.originalCard,box:rect(document.querySelector(`[data-creature-id="${unit.id}"] .player-card-frame,[data-permanent-id="${unit.id}"] .permanent-card-frame`))}));
    const justDrawn=(draws.get(battle)||[]).filter(event=>event.sequence>old.drawSequence).map(event=>event.card);
    const removed = added(battle.hand,[...old.hand,...justDrawn]);
    const hand = [];
    old.hand.forEach((card,index)=>{const n=removed.indexOf(card);if(n<0)return;removed.splice(n,1);hand.push({card,box:rect(document.querySelector(`[data-hand-index="${index}"]`))});});
    return [...units,...hand];
  }
  function fly(card, source, destination, kind, delay, flip = false) {
    const target = rect(destination);
    if (!source || !target || motion.matches || !visible()) return;
    const node = document.createElement('div');
    node.className = `zone-flight zone-flight-${kind}`;
    node.setAttribute('aria-hidden','true');
    node.innerHTML = `<div class="zone-flight-turn"><div class="zone-flight-front">${cardFace(card)}</div><div class="zone-flight-back"><img src="assets/mtg-card-back.jpg" alt="" draggable="false"></div></div>`;
    node.querySelectorAll('img').forEach(img => {img.loading='eager';});
    Object.assign(node.style,{left:source.left+'px',top:source.top+'px',width:source.width+'px',height:source.height+'px'});
    document.body.append(node);
    const scale = parseFloat(document.documentElement.style.getPropertyValue('--game-scale')) || 1;
    const width = destination.offsetWidth*scale || target.width;
    const height = destination.offsetHeight*scale || target.height;
    const transform = getComputedStyle(destination).transform;
    const matrix = new DOMMatrixReadOnly(transform==='none'?undefined:transform);
    const angle = Math.atan2(matrix.b,matrix.a)*180/Math.PI;
    const dx=target.left+target.width/2-source.left-source.width/2;
    const dy=target.top+target.height/2-source.top-source.height/2;
    const sx=width/source.width, sy=height/source.height;
    const arc=Math.min(65*scale,Math.hypot(dx,dy)*.15);
    const duration=kind==='draw'?520:460;
    const frames=[
      {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1},
      {transform:`translate(${dx*.55}px,${dy*.55-arc}px) rotate(${kind==='draw'?-8:10}deg) scale(${1+(sx-1)*.55},${1+(sy-1)*.55})`,opacity:1,offset:.55},
      {transform:`translate(${dx}px,${dy}px) rotate(${angle}deg) scale(${sx},${sy})`,opacity:1}
    ];
    if (kind==='draw') destination.classList.add('zone-arriving');
    const animation=node.animate(frames,{duration,delay,easing:'cubic-bezier(.22,.65,.3,1)',fill:'both'});
    const turn=node.querySelector('.zone-flight-turn');
    const flipAnimation=flip?turn.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(0deg)',offset:.68},{transform:'rotateY(0deg)'}],{duration,delay,fill:'both',easing:'ease-in-out'}):null;
    let done=false;
    const entry={destination,finish(){
      if(done)return;done=true;
      destination.classList.remove('zone-arriving');node.remove();
      animation.cancel();flipAnimation?.cancel();flights.delete(entry);
    }};
    flights.add(entry);
    animation.finished.then(()=>{
      entry.finish();
      if(kind==='graveyard'&&destination.isConnected&&visible()&&!motion.matches)destination.animate([{filter:'brightness(1.6)'},{filter:'brightness(1)'}],{duration:200});
    }).catch(()=>entry.finish());
  }
  function schedule(battle) {
    cancelAnimationFrame(frame);
    const token=generation;
    frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{
      frame=0;
      const incoming=draws.get(battle)||[],outgoing=graveMoves.get(battle)||[];
      draws.delete(battle);graveMoves.delete(battle);
      if(token!==generation||state.battle!==battle||!visible()||motion.matches){clearFlights();return;}
      const library=rect(document.querySelector('#library-button .library-stack'));
      const destinations=new Set();
      incoming.forEach((event,i)=>{
        let index=event.index;
        if(battle.hand[index]!==event.card||destinations.has(index))index=battle.hand.findIndex((card,n)=>card===event.card&&!destinations.has(n));
        if(index<0)return;destinations.add(index);
        const destination=document.querySelector(`[data-hand-index="${index}"]`);
        fly(event.card,library,destination,'draw',i*Math.min(85,500/Math.max(1,incoming.length-1)),true);
      });
      const grave=document.querySelector('#graveyard-pile .graveyard-card');
      outgoing.forEach((event,i)=>fly(event.card,event.box||library,grave,'graveyard',i*Math.min(65,400/Math.max(1,outgoing.length-1)),event.fromLibrary));
    });});
  }
  const baseRender = renderBattle;
  renderBattle = function () {
    const battle=state.battle;
    const old=snapshot?.battle===battle?snapshot:null;
    const sources=battle?collectSources(old,battle):[];
    const arrivals=old?added(old.graveyard,battle.graveyard):[];
    const library=rect(document.querySelector('#library-button .library-stack'));
    const jobs=arrivals.map(card=>{
      const source=sources.findIndex(item=>(item.card===card||item.originalCard===card)&&item.box);
      if(source>=0)return {card,box:sources.splice(source,1)[0].box,fromLibrary:false};
      return {card,box:library,fromLibrary:true};
    });
    clearFlights();
    baseRender();
    if(!battle){snapshot=null;return;}
    snapshot={battle,drawSequence,hand:[...battle.hand],graveyard:[...battle.graveyard],units:[...battle.creatures,...battle.permanents].map(unit=>({id:unit.id,card:unit.card,originalCard:unit.originalCard}))};
    if(jobs.length)graveMoves.set(battle,[...(graveMoves.get(battle)||[]),...jobs]);
    if(!motion.matches&&!document.hidden)for(const event of draws.get(battle)||[]){if(battle.hand[event.index]===event.card)document.querySelector(`[data-hand-index="${event.index}"]`)?.classList.add('zone-arriving');}
    if(draws.has(battle)||graveMoves.has(battle))schedule(battle);
  };
  const baseLanding=animateCardLanding;
  animateCardLanding=function(flight,accepted){
    if(accepted&&flight?.payload?.kind==='hand'&&(graveMoves.get(state.battle)||[]).some(event=>event.card.id===flight.payload.cardId))return;
    return baseLanding(flight,accepted);
  };
  function clearHit() {
    if(!hit)return;
    const previous=hit;hit=null;
    previous.animation?.cancel();previous.avatarAnimation?.cancel();
    previous.node.remove();previous.avatar.classList.remove('avatar-hit-active');
  }
  function damage(amount) {
    if(amount<=0||!visible())return;
    clearHit();
    const avatar=document.getElementById('player-avatar'),box=rect(avatar);
    if(!box)return;
    const node=document.createElement('div');node.className='player-hit-number';node.setAttribute('aria-hidden','true');node.textContent=`−${amount}`;
    const scale=parseFloat(document.documentElement.style.getPropertyValue('--game-scale'))||1;
    node.style.fontSize=(27*scale)+'px';
    node.style.left=(box.left+box.width/2)+'px';node.style.top=(box.top+box.height*.25)+'px';
    document.body.append(node);avatar.classList.add('avatar-hit-active');
    const still=motion.matches;
    const animation=node.animate(still?[{opacity:1},{opacity:0}]:[{opacity:0,translate:`0 ${6*scale}px`},{opacity:1,translate:`0 ${-4*scale}px`,offset:.2},{opacity:0,translate:`0 ${-28*scale}px`}],{duration:still?250:700,easing:'ease-out',fill:'both'});
    const avatarAnimation=still?null:avatar.animate([{filter:'brightness(1.7) sepia(.6)',translate:'0 0'},{filter:'brightness(1.35)',translate:'-3px 0',offset:.2},{translate:'3px 0',offset:.45},{filter:'brightness(1)',translate:'0 0'}],{duration:330,easing:'ease-out'});
    const current={node,avatar,animation,avatarAnimation};hit=current;
    animation.finished.then(()=>{if(hit===current)clearHit();}).catch(()=>{});
  }
  function cancel() {
    cancelAnimationFrame(frame);frame=0;clearFlights();clearHit();
    if(state.battle){draws.delete(state.battle);graveMoves.delete(state.battle);}
  }
  new MutationObserver(()=>{if(!combat.classList.contains('active'))cancel();}).observe(combat,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  motion.addEventListener('change',cancel);
  window.addEventListener('resize',cancel);
  window.visualViewport?.addEventListener('resize',cancel);
  document.addEventListener('pointerdown',event=>{
    const card=event.target.closest?.('.hand-card');
    if(card)for(const flight of [...flights])if(flight.destination===card)flight.finish();
  },{capture:true,passive:true});
  return {draw(card,index,battle){if(motion.matches||document.hidden)return;draws.set(battle,[...(draws.get(battle)||[]),{card,index,sequence:++drawSequence}]);},damage};
})();
function queueHandDraw(card,index,battle){cardZoneEffects.draw(card,index,battle);}
function animatePlayerDamage(amount){cardZoneEffects.damage(amount);}
