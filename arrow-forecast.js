/* v0.109 — use the real dry run for arrow damage, retaliation and lethal risk. */
let arrowForecastCache109=null;
const arrowDescriptions109=new WeakMap();
function arrowForecasts109(b,routes){
 const key=JSON.stringify([b.turn,b.phase,b.phaseTicket,b.combatSerial103,b.combatOnly103,b.extraCombats103,b.ringProtectionUntil95,state.playerHealth,b.mana,b.selectedEnemyTargetId,b.activeAttackIds,b.creatures,b.enemyCreatures,b.permanents,b.turnEffects,[...b.blockAssignments],b.deck.length,b.hand.length,Boolean(b.resolutionTask||b.choice||b.scry||b.libraryOrder||b.interruption||b.diceRoll||b.enemyCounterWindow||b.enemyCastCheck||b.wardTask||jesterPending65(b)),routes.map(g=>g.dataset.routeKey)]);
 if(arrowForecastCache109?.battle===b&&arrowForecastCache109.key===key)return arrowForecastCache109;
 const outgoing=routes.some(g=>g.dataset.arrowKind==='ally')&&['main','attack'].includes(b.phase)?forecastCombat106():null;
 const incoming=routes.some(g=>g.dataset.arrowKind!=='ally')?forecastCombat106({mode:'blocks'}):null;
 return arrowForecastCache109={battle:b,key,outgoing,incoming};
}
function arrowOutcome109(group,cache,b){
 const ally=group.dataset.arrowKind==='ally',from=group.dataset.fromId,to=group.dataset.toId,target=to==='player'?'life':to;
 const f=ally?cache.outgoing:cache.incoming,intent=!ally&&!['blocks','damage'].includes(b.phase);
 if(!f?.available)return{lines:['…',b.phase==='enemy'?'Resolving':'Preview pending'],detail:f?.reason||'This attack is outside the current combat step.',pending:true};
 const hits=f.events.filter(e=>e.source===from&&e.target===target),back=f.events.filter(e=>e.source===to&&e.target===from),row=f.rows.find(r=>r.id===to),source=f.rows.find(r=>r.id===from);
 const damage=hits.reduce((n,e)=>n+e.damage,0),poison=hits.reduce((n,e)=>n+(e.poison||0),0),retaliation=back.reduce((n,e)=>n+e.damage,0),returnPoison=back.reduce((n,e)=>n+(e.poison||0),0),estimate=f.uncertain?'~':'';
 const dealt=poison?damage?`${damage} dmg +${poison} poison`:`${poison} poison`:`${damage} ${ally?'dealt':to==='player'?'to you':'hit'}`;
 const returnedHit=returnPoison?retaliation?`${retaliation} dmg +${returnPoison} poison back`:`${returnPoison} poison back`:`${retaliation} back`;
 const sourceDies=Boolean(source?.dead),targetDies=Boolean(row?.dead),lethal=to==='player'&&f.playerAfter<=0;
 const death=(dead,returned,own)=>!dead?'':returned?' · returns':f.uncertain?' · RISK':own?' · DIES':' · KO';
 const lines=intent?[`${estimate}${damage}${poison?' +'+poison+' poison':''} intent`]:ally?[estimate+dealt+death(targetDies,row?.returned,false),estimate+returnedHit+death(sourceDies,source?.returned,true)]:to==='player'?[estimate+dealt,lethal?(f.uncertain?'LETHAL RISK':'LETHAL TOTAL'):'after blocks']:[estimate+dealt+death(targetDies,row?.returned,true),estimate+returnedHit+death(sourceDies,source?.returned,false)];
 const unit=id=>[...b.creatures,...b.enemyCreatures].find(u=>u.id===id)?.card.name||'Your life';
 const detail=`${unit(from)} → ${unit(to)}: ${damage} damage${poison?', '+poison+' poison counters':''}; ${retaliation} retaliation damage${returnPoison?', '+returnPoison+' poison counters':''}.${targetDies?' '+unit(to)+(row.returned?' dies and returns.':' is defeated.') : ''}${sourceDies?' '+unit(from)+(source.returned?' dies and returns.':' dies.') : ''}${lethal?' Combined enemy attacks would defeat you.':''}${intent?' Enemy intent on the current board, before your attacks or spells.':f.uncertain?' Estimate: unresolved choices may change this result.':' Current assignments, with no further spells or abilities.'}`;
 return{lines,detail,pending:false,intent,uncertain:f.uncertain,lethal:!intent&&(ally?sourceDies:targetDies||lethal),poison};
}
function arrowWarning109(node,row,uncertain){
 const warning=row?.dead;
 if(warning){
  if(!arrowDescriptions109.has(node))arrowDescriptions109.set(node,node.getAttribute('aria-description'));
  node.dataset.combatDanger109=row.returned?'returns':uncertain?'risk':'dies';
  const original=arrowDescriptions109.get(node),text=row.returned?'Combat forecast: dies, then returns with Persist.':uncertain?'Combat forecast: at risk; unresolved choices may change the result.':'Combat forecast: dies with the current assignments.';
  node.setAttribute('aria-description',(original?original+' ':'')+text);
 }else if(node.dataset.combatDanger109){
  delete node.dataset.combatDanger109;const original=arrowDescriptions109.get(node);
  if(original===null||original===undefined)node.removeAttribute('aria-description');else node.setAttribute('aria-description',original);
  arrowDescriptions109.delete(node);
 }
}
function decorateCombatArrows109(svg,b){
 const routes=[...svg.querySelectorAll('.combat-route')],cache=arrowForecasts109(b,routes),active=['blocks','damage'].includes(b.phase)?cache.incoming:cache.outgoing;
 for(const node of document.querySelectorAll('#creature-row .creature-token[data-creature-id]'))arrowWarning109(node,active?.available?active.rows.find(r=>r.id===node.dataset.creatureId):null,active?.uncertain);
 const health=$('#player-health-label');health.toggleAttribute('data-combat-lethal109',Boolean(['blocks','damage'].includes(b.phase)&&cache.incoming?.available&&cache.incoming.playerAfter<=0));
 let layer=svg.querySelector('.forecast-label-layer109');
 if(!routes.length){layer?.replaceChildren();return;}
 if(!layer){layer=document.createElementNS('http://www.w3.org/2000/svg','g');layer.setAttribute('class','forecast-label-layer109');layer.setAttribute('aria-hidden','true');svg.append(layer);}
 const labels=new Map([...layer.children].map(n=>[n.dataset.routeKey,n])),retained=new Set();
 const rect=svg.getBoundingClientRect(),width=svg.clientWidth,height=svg.clientHeight,screenScale=rect.width/width,scale=Math.min(2.8,Math.max(1,1/screenScale)),placed=[];
 const obstacles=[...document.querySelectorAll('.creature-token,.monster,.player-side-header,.enemy-side-header,.combat-topline,.library-zone,.battle-piles98,.hand-panel')].map(n=>{const r=n.getBoundingClientRect();return{x:(r.left-rect.left)/screenScale,y:(r.top-rect.top)/screenScale,w:r.width/screenScale,h:r.height/screenScale};});
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 for(const group of routes){
  const outcome=arrowOutcome109(group,cache,b),badge=group.querySelector('.route-damage')||labels.get(group.dataset.routeKey),path=group.querySelector('.route-line');if(!badge||!path)continue;
  if(badge.parentElement!==layer)layer.append(badge);
  badge.dataset.routeKey=group.dataset.routeKey;badge.dataset.labelKind109=group.dataset.arrowKind;badge.dataset.fromId109=group.dataset.fromId;badge.dataset.toId109=group.dataset.toId;retained.add(group.dataset.routeKey);
  group.dataset.forecast109='true';group.classList.toggle('forecast-intent109',Boolean(outcome.intent));group.classList.toggle('forecast-lethal109',Boolean(outcome.lethal));group.classList.toggle('forecast-pending109',Boolean(outcome.pending));group.classList.toggle('forecast-poison109',Boolean(outcome.poison));
  badge.setAttribute('class',`route-damage forecast-label109 route-${group.dataset.arrowKind}${outcome.intent?' forecast-intent109':''}${outcome.lethal?' forecast-lethal109':''}${outcome.pending?' forecast-pending109':''}${outcome.poison?' forecast-poison109':''}`);
  const title=group.querySelector('title');title.textContent=outcome.detail;group.setAttribute('aria-label',outcome.detail);
  const w=Math.min(220,Math.max(70,...outcome.lines.map(s=>s.length*6+16))),h=outcome.lines.length===1?22:34;
  if(!badge.querySelector('.forecast-line109'))badge.innerHTML='<rect rx="7"/><text class="forecast-line109" text-anchor="middle" dominant-baseline="central"></text><text class="forecast-back109" text-anchor="middle" dominant-baseline="central"></text>';
  const box=badge.querySelector('rect');box.setAttribute('x',-w/2);box.setAttribute('y',-h/2);box.setAttribute('width',w);box.setAttribute('height',h);
  badge.querySelector('.forecast-line109').textContent=outcome.lines[0];badge.querySelector('.forecast-line109').setAttribute('y',outcome.lines.length===1?'0':'-7');badge.querySelector('.forecast-back109').textContent=outcome.lines[1]||'';badge.querySelector('.forecast-back109').setAttribute('y','7');
  const length=path.getTotalLength();let best=null;
  for(const t of [.5,.4,.6,.3,.7,.2,.8,.1,.9]){
   const point=path.getPointAtLength(length*t),x=Math.max(w*scale/2+8,Math.min(width-w*scale/2-8,point.x)),y=Math.max(h*scale/2+8,Math.min(height-h*scale/2-8,point.y)),box={x:x-w*scale/2,y:y-h*scale/2,w:w*scale,h:h*scale};
   const score=placed.reduce((n,r)=>n+overlap(box,r)*10,0)+obstacles.reduce((n,r)=>n+overlap(box,r),0)+Math.abs(t-.5)*500;
   if(!best||score<best.score)best={x,y,box,score};
  }
  badge.setAttribute('transform',`translate(${best.x.toFixed(2)},${best.y.toFixed(2)}) scale(${scale.toFixed(3)})`);placed.push(best.box);
 }
 for(const [key,label] of labels)if(!retained.has(key))label.remove();
 if(svg.lastElementChild!==layer)svg.append(layer);
 syncForecastFocus109(svg);
}
function syncForecastFocus109(svg=$('#combat-arrows')){
 const focused=new Set([...svg.querySelectorAll('.combat-route.arrow-focused70')].map(g=>g.dataset.routeKey)),active=svg.classList.contains('has-arrow-focus70');
 for(const label of svg.querySelectorAll('.forecast-label109')){label.classList.toggle('forecast-label-dim109',active&&!focused.has(label.dataset.routeKey));label.classList.toggle('forecast-label-focus109',focused.has(label.dataset.routeKey));}
}
const baseForecastFocus109=refreshArrowFocus70;
refreshArrowFocus70=function(){const result=baseForecastFocus109();syncForecastFocus109();return result;};
const baseArrowRender109=renderBattle;
renderBattle=function(){arrowForecastCache109=null;return baseArrowRender109();};
