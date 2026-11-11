/* One immutable rules result per die; animation never generates new outcomes. */
SPELL_RULES['Growth Spurt']={target:'creature',effects:[{kind:'die-buff'}]};
SPECIAL_CREATURES.add('Elvish Impersonators');
let visibleDiceRoll50=null;
function rollD6Value50(){return Math.floor(Math.random()*6)+1;}
function dieCubeMarkup50(result,label,index){
 const pips={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 const angles={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};
 const [x,y]=angles[result];
 return `<div class="rolled-die" style="--die-x:${x}deg;--die-y:${y}deg;--die-delay:${index*140}ms"><span class="die-roll-label">${escapeHtml(label)}</span><div class="die-stage" aria-hidden="true"><div class="die-shadow"></div><div class="die-flight"><div class="die-cube">${[1,2,3,4,5,6].map(face=>`<div class="die-face die-face-${face}">${Array.from({length:9},(_,i)=>`<i class="${pips[face].includes(i+1)?'die-pip':'die-pip-empty'}"></i>`).join('')}</div>`).join('')}</div></div></div><b class="die-result-value" data-die-result="${result}">?</b></div>`;
}
function lockDiceBattlefield53(job){
 job.lockedUI=[...document.querySelectorAll('#combat-screen .arena-side,#combat-screen .combat-topline,#combat-screen .hand-panel,#combat-screen .card-inspector,#combat-screen .table-graveyard')].map(node=>({node,inert:node.inert}));
 for(const entry of job.lockedUI)entry.node.inert=true;
 document.querySelector('.arena-table')?.classList.add('has-table-dice');
}
function closeDiceDisplay53(job){
 const dialog=$('#dice-roll-dialog');if(dialog?.open)dialog.close();
 for(const entry of job?.lockedUI||[])entry.node.inert=entry.inert;
 document.querySelector('.arena-table')?.classList.remove('has-table-dice');
}
function abortDiceRoll50(){
 const job=visibleDiceRoll50;
 visibleDiceRoll50=null;
 if(job){job.closed=true;clearTimeout(job.timer);if(job.battle.diceRoll===job)job.battle.diceRoll=null;}
 closeDiceDisplay53(job);
}
function syncDiceWindow50(){
 const job=visibleDiceRoll50;
 if(job&&(job.battle!==state.battle||job.battle.phase==='complete'||state.screen!=='combat-screen'))abortDiceRoll50();
}
function beginDiceRoll50(source,labels,summary,apply,resume,battle=state.battle,options={}){
 if(!battle||state.battle!==battle||battle.phase==='complete'||battle.diceRoll)return false;
 const results=Object.freeze(labels.map(()=>rollD6Value50()));
 const job={id:`roll-${state.nextPermanentId++}`,source,labels:[...labels],results,battle,apply,resume,summary:summary(results),ready:false,closed:false};
 visibleDiceRoll50=job;battle.diceRoll=job;
 hideCardPreview();
 renderBattle();
 $('#dice-card-name').textContent=source;
 $('#dice-roll-heading').textContent=options.owner==='enemy'?'ENEMY CAST CHECK · D6':'DICE ROLL · D6';
 $('#dice-roll-dialog').dataset.owner=options.owner||'player';
 $('#dice-roll-dialog').classList.remove('dice-settled');
 $('#dice-tray').innerHTML=results.map((result,i)=>dieCubeMarkup50(result,labels[i],i)).join('');
 $('#dice-status').textContent=labels.length===1?'Rolling one six-sided die…':'Rolling two six-sided dice…';
 $('#dice-outcome').textContent=options.instruction||'The result will be applied when you continue.';
 $('#dice-continue').disabled=true;$('#dice-continue').dataset.rollId=job.id;
 lockDiceBattlefield53(job);
 $('#dice-roll-dialog').show();
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced)finishDiceAnimation50(job.id);
 else {
  // Wait for real motion, including a delayed first paint, before exposing the result.
  $('#dice-tray').getBoundingClientRect();
  const motions=[...$('#dice-tray').querySelectorAll('.die-flight,.die-cube')].flatMap(el=>el.getAnimations?.()||[]);
  if(motions.length)Promise.all(motions.map(animation=>animation.finished.catch(()=>{}))).then(()=>finishDiceAnimation50(job.id));
  else job.timer=setTimeout(()=>finishDiceAnimation50(job.id),1650+(labels.length-1)*140);
 }
 return true;
}
function finishDiceAnimation50(id){
 const job=visibleDiceRoll50;
 if(!job||job.id!==id||job.closed||job.ready||job.battle!==state.battle||job.battle.phase==='complete')return false;
 job.ready=true;clearTimeout(job.timer);
 $('#dice-roll-dialog').classList.add('dice-settled');
 $('#dice-tray').querySelectorAll('[data-die-result]').forEach(el=>{el.textContent=el.dataset.dieResult;});
 $('#dice-status').textContent=job.labels.map((label,i)=>`${label}: ${job.results[i]}`).join(' · ');
 $('#dice-outcome').textContent=job.summary;
 $('#dice-continue').disabled=false;
 if(!document.querySelector('dialog[open]:not(#dice-roll-dialog)'))$('#dice-continue').focus?.({preventScroll:true});
 playSfx('select');
 return true;
}
function settleDiceRoll50(id=visibleDiceRoll50?.id){
 const job=visibleDiceRoll50;
 if(!job||job.id!==id||job.closed||!job.ready||job.battle!==state.battle||job.battle.phase==='complete')return false;
 job.closed=true;clearTimeout(job.timer);visibleDiceRoll50=null;job.battle.diceRoll=null;
 closeDiceDisplay53(job);
 (job.battle.diceHistory||=[]).push({source:job.source,labels:[...job.labels],results:[...job.results],summary:job.summary});
 addLog(`${job.source} · ${job.labels.map((label,i)=>`${label} ${job.results[i]}`).join(' · ')}. ${job.summary}`);
 job.apply(job.results);
 if(state.battle===job.battle&&job.battle.phase!=='complete')job.resume?.();
 return true;
}
$('#dice-continue').addEventListener('click',()=>settleDiceRoll50($('#dice-continue').dataset.rollId));
$('#dice-tray').addEventListener('click',()=>{if(visibleDiceRoll50?.ready)settleDiceRoll50(visibleDiceRoll50.id);});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||event.defaultPrevented||!visibleDiceRoll50||document.querySelector('dialog[open]:not(#dice-roll-dialog)'))return;
 event.preventDefault();$('#dice-roll-dialog').dispatchEvent(new Event('cancel',{cancelable:true}));
});
$('#dice-roll-dialog').addEventListener('cancel',event=>{
 event.preventDefault();const job=visibleDiceRoll50;
 if(job?.ready)settleDiceRoll50(job.id);else showToast('Let the dice settle, then continue.');
});
$('#dice-roll-dialog').addEventListener('close',()=>{if(!$('#dice-roll-dialog').open&&visibleDiceRoll50)abortDiceRoll50();});

function resolveDiceEffect50(effect,target,context,resume){
 if(effect.kind!=='die-buff')return false;
 const battle=state.battle;
 const source=`${context.card.name}${context.isCopy?' · copy':''}`;
 return beginDiceRoll50(source,['Bonus'],values=>`+${values[0]}/+${values[0]} until end of turn.`,values=>{
  if(choiceTargetUnit(target,battle))resolveReviewedEffect({kind:'buff',power:values[0],toughness:values[0],temporary:true},target,context);
  else addLog(`${context.card.name}: the target is gone; the bonus has no effect.`);
 },resume,battle);
}
function enterDiceCreature50(card,battle=state.battle,originalCard=null){
 if(card.name!=='Elvish Impersonators')return false;
 if(!battle||state.battle!==battle||battle.phase==='complete')return true;
 const castCard=originalCard||card;
 const task={battle,p:{card:castCard},copies:1};battle.resolutionTask=task;
 const finish=()=>finishResolution27(task);
 if(battle.creatures.length>=3){battle.graveyard.push(castCard);addLog(`${castCard.name} has no free creature slot.`);finish();return true;}
 beginDiceRoll50(originalCard?`${originalCard.name} → ${card.name}`:card.name,['Power','Toughness'],values=>`Enters as a ${values[0]}/${values[1]} creature.`,values=>{
  const unit={id:`player-${state.nextPermanentId++}`,owner:'player',card,...(originalCard?{originalCard}:{}),power:values[0],toughness:values[1],rolledBase:{power:values[0],toughness:values[1]},...creatureKeywords(card),summonedTurn:battle.turn,summoningSick:true,tapped:false,willAttack:false,attackedThisTurn:false,attackTargetId:null};
  battle.creatures.push(unit);refreshPermanentEffects();onCreatureEntered(unit);playSfx('creature');
 },finish,battle);
 return true;
}
const basePaidDice50=resolvePaidCard44;
resolvePaidCard44=function(card,battle=state.battle){if(enterDiceCreature50(card,battle))return;return basePaidDice50(card,battle);};
const baseDiceCast50=canCastNow;
canCastNow=function(card,battle=state.battle){return !battle?.diceRoll&&baseDiceCast50(card,battle);};
const baseDiceCounterBusy50=enemyCounterBusy44;
enemyCounterBusy44=function(battle){return Boolean(battle?.diceRoll)||baseDiceCounterBusy50(battle);};
const baseDiceDescriptions50=effectDescriptions;
effectDescriptions=function(card){
 if(card.name==='Growth Spurt')return ['Choose a creature. Roll one six-sided die.','It gets +X/+X until end of turn, where X is that result. This is a temporary bonus, not +1/+1 counters.','Each spell copy rolls its own die. Counterspell and Ward resolve before rolling.'];
 if(card.name==='Elvish Impersonators')return ['As this creature enters, roll two six-sided dice.','The first result is its base power; the second is its base toughness. These values last while it remains on the battlefield.','A Clone copying it rolls again. It enters with normal summoning sickness.'];
 return baseDiceDescriptions50(card);
};
const baseDiceSummary50=draftAbilitySummary;
draftAbilitySummary=function(card){
 if(card.name==='Growth Spurt')return 'Roll a D6: target creature gets +X/+X until end of turn.';
 if(card.name==='Elvish Impersonators')return 'Roll 2 D6 on entry: first = power, second = toughness.';
 return baseDiceSummary50(card);
};
