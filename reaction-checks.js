/* Enemy spell permission checks and an unpaid warning for unaffordable Ward. */
const ENEMY_CAST_MIN52=4;
let visibleEnemyCheck52=null;
let visibleWardCast52=null;
function releaseReactionBeat52(battle){
 if(state.battle!==battle||battle.phase==='complete'||battle.resolutionTask||battle.diceRoll||battle.enemyCounterWindow||battle.choice||battle.scry||battle.libraryOrder||battle.interruption)return;
 if(battle.deferredBeat){const resume=battle.deferredBeat;battle.deferredBeat=null;afterCombatBeat(battle,battle.phase,resume);}
}
function enemyCastCheck52(source,spellName,battle,onResult){
 if(state.battle!==battle||battle.phase==='complete'||battle.enemyCastCheck||battle.diceRoll)return false;
 const marker={enemyCheck:true};
 const check={id:`enemy-check-${state.nextPermanentId++}`,battle,marker,savedResolution:battle.resolutionTask,source,spellName,closed:false};
 visibleEnemyCheck52=check;battle.enemyCastCheck=check;battle.resolutionTask=marker;
 let result;
 const started=beginDiceRoll50(`${source.card.name} · ${spellName}`,['Cast · 4+'],values=>values[0]>=ENEMY_CAST_MIN52?`Rolled ${values[0]}: ${spellName} may be cast.`:`Rolled ${values[0]}: ${spellName} fails this attempt.`,values=>{result=values[0];},()=>{
  if(check.closed||visibleEnemyCheck52!==check||state.battle!==battle||battle.phase==='complete'||battle.enemyCastCheck!==check)return;
  check.closed=true;visibleEnemyCheck52=null;battle.enemyCastCheck=null;
  if(battle.resolutionTask===marker)battle.resolutionTask=check.savedResolution||null;
  const success=result>=ENEMY_CAST_MIN52&&battle.enemyCreatures.includes(source)&&source.health>0;
  addLog(`${source.card.name} rolls ${result} for ${spellName}: ${success?'allowed':'failed'} (4–6 required).`);
  onResult(success,result);releaseReactionBeat52(battle);
 },battle,{owner:'enemy',instruction:'Roll 4–6 to cast. On 1–3 this attempt fails.'});
 if(!started){check.closed=true;visibleEnemyCheck52=null;battle.enemyCastCheck=null;battle.resolutionTask=check.savedResolution||null;}
 return started;
}
function requestEnemyCounterRoll52(card,battle,resume,countered,source){
 battle.enemyCounterUsedTurn=battle.turn;
 return enemyCastCheck52(source,'Counterspell',battle,success=>{
  if(success)castEnemyCounter44(card,battle,resume,countered,source);
  else {battle.enemyCounterFailedTurn=battle.turn;addLog(`${card.name} continues: the enemy could not cast Counterspell.`);resume();}
 });
}
function requestEnemySpellRoll52(spell,battle,resume){
 if(spell.status!=='awaiting-roll'||state.battle!==battle||battle.phase!=='enemy')return false;
 const source=battle.enemyCreatures.find(enemy=>enemy.id===spell.sourceId&&enemy.health>0);
 if(!source){spell.status='failed';addLog(`${spell.sourceName} cannot cast ${spell.card.name}: its source has left the battlefield.`);resume();return true;}
 return enemyCastCheck52(source,spell.card.name,battle,success=>{
  if(success){spell.status='pending';battle.activeEnemySpellId=spell.id;addLog(`${spell.sourceName} casts ${spell.card.name}. You may respond with an instant.`);}
  else {spell.status='failed';addLog(`${spell.sourceName}'s ${spell.card.name} is not cast.`);}
  resume();
 });
}
const baseCheckIntent52=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1){const intent=baseCheckIntent52(enemy,turn);return ['rune','scorch','drain'].includes(intent.kind)?{...intent,label:`${intent.label} · 4+ D6`}:intent;};

function wardCastInfo52(p,battle,target){
 if(target?.side!=='enemy')return null;
 const unit=choiceTargetUnit(target,battle);const ward=wardCost(unit);
 if(!unit||!ward)return null;
 syncMana(battle);
 const cost=Math.ceil(p.card.cmc||0);const copies=(isInstant(p.card)||/\bSorcery\b/.test(p.card.type_line))?1+(battle.copyNextSpell||0):1;
 const after=Math.max(0,battle.mana-cost);const required=ward*copies;
 return {unit,ward,cost,copies,after,required,available:battle.mana,signature:JSON.stringify([p.card.id||p.card.name,p.index,unit.id,ward,cost,copies,battle.mana])};
}
function confirmWardCasting52(p,battle,target){
 const info=wardCastInfo52(p,battle,target);
 if(!info||info.after>=info.required||p.wardAccepted52===info.signature)return false;
 if(battle.wardCastWarning)return true;
 const marker={wardWarning:true};
 const warning={battle,p,target,info,phase:battle.phase,marker,savedResolution:battle.resolutionTask,closed:false};
 visibleWardCast52=warning;battle.wardCastWarning=warning;battle.resolutionTask=marker;
 $('#ward-cast-title').textContent=`${p.card.name} → ${info.unit.card.name}`;
 $('#ward-cast-costs').textContent=`Spell: ${info.cost} mana · Ward: ${info.ward} mana${info.copies>1?` × ${info.copies} resolutions`:''}`;
 $('#ward-cast-mana').textContent=`Available now: ${info.available} · After casting: ${info.after} · Ward needed: ${info.required}`;
 const payable=Math.min(info.copies,Math.floor(info.after/info.ward));
 $('#ward-cast-description').textContent=payable===0?'You currently cannot pay Ward after casting. Ward will counter the spell unless you can supply the extra mana. Cast anyway?':`You can currently pay Ward for only ${payable} of ${info.copies} resolutions. Unpaid resolutions are countered by Ward. Cast anyway?`;
 hideCardPreview();renderBattle();$('#ward-cast-dialog').showModal();$('#ward-cast-cancel').focus?.({preventScroll:true});
 return true;
}
function clearWardCast52(){
 const warning=visibleWardCast52;visibleWardCast52=null;
 if(warning){warning.closed=true;if(warning.battle.wardCastWarning===warning)warning.battle.wardCastWarning=null;if(warning.battle.resolutionTask===warning.marker)warning.battle.resolutionTask=warning.savedResolution||null;}
 if($('#ward-cast-dialog')?.open)$('#ward-cast-dialog').close();
 return warning;
}
function answerWardCasting52(cast){
 const warning=visibleWardCast52;
 if(!warning||warning.closed||warning.battle!==state.battle||warning.battle.phase==='complete')return false;
 const battle=warning.battle;clearWardCast52();
 if(!cast){renderBattle();releaseReactionBeat52(battle);showToast('Casting canceled. No costs paid.');return true;}
 if(battle.phase!==warning.phase||battle.hand[warning.p.index]!==warning.p.card||!canCastNow(warning.p.card,battle)){
  renderBattle();releaseReactionBeat52(battle);showToast('The spell or target changed. Choose again.');return false;
 }
 warning.p.wardAccepted52=warning.info.signature;
 const value=commitRuleSpell(warning.p);releaseReactionBeat52(battle);return value;
}
$('#ward-cast-cancel').addEventListener('click',()=>answerWardCasting52(false));
$('#ward-cast-confirm').addEventListener('click',()=>answerWardCasting52(true));
$('#ward-cast-dialog').addEventListener('cancel',event=>{event.preventDefault();answerWardCasting52(false);});
$('#ward-cast-dialog').addEventListener('close',()=>{if(!$('#ward-cast-dialog').open&&visibleWardCast52)clearWardCast52();});
function abortReactionChecks52(){
 clearWardCast52();const check=visibleEnemyCheck52;visibleEnemyCheck52=null;
 if(check){check.closed=true;if(check.battle.enemyCastCheck===check)check.battle.enemyCastCheck=null;if(check.battle.resolutionTask===check.marker)check.battle.resolutionTask=check.savedResolution||null;}
}
const baseCheckScene52=showScreen;
showScreen=function(id){if(id!=='combat-screen')abortReactionChecks52();return baseCheckScene52(id);};
const baseCheckSync52=syncDiceWindow50;
syncDiceWindow50=function(){baseCheckSync52();if((visibleEnemyCheck52&&(visibleEnemyCheck52.battle!==state.battle||state.battle.phase==='complete'))||(visibleWardCast52&&(visibleWardCast52.battle!==state.battle||state.battle.phase==='complete')))abortReactionChecks52();};
