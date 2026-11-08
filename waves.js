/* v0.45 — late encounters share one battlefield and library across two waves. */
function createEncounterWaves45(encounter){
 const node=ENCOUNTERS.indexOf(encounter)+1||state.node;
 if(node<3)return [createEnemyTeam(encounter)];
 const vanguard=createEnemyTeam(ENCOUNTERS[0]);
 const finalTeam=createEnemyTeam(encounter);
 return [vanguard,node===3?finalTeam.filter(enemy=>enemy.tier==='elite'):finalTeam];
}
const baseWaveIntent45=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1){
 const patternTurn=enemy.waveStartedTurn?Math.max(1,turn-enemy.waveStartedTurn+1):turn;
 return baseWaveIntent45(enemy,patternTurn);
};
function advanceEncounterWave45(battle=state.battle){
 if(!battle||state.battle!==battle||battle.phase==='complete'||battle.enemyCreatures.length||!battle.waves||battle.waveIndex>=battle.waves.length-1)return false;
 if(battle.enemyCounterWindow||battle.resolutionTask||battle.choice||battle.scry||battle.libraryOrder||battle.interruption||pendingEnemySpells38(battle).length)return false;
 const duringMain=battle.phase==='main',spawnTurn=battle.turn+(duringMain?0:1);
 const previous=battle.waves[battle.waveIndex]||[];
 if(previous.some(enemy=>enemy.health<=0))battle.creatureDiedThisTurn=true;
 cleanupAttachments(new Set(previous.map(enemy=>enemy.id)));
 battle.waveIndex++;
 battle.enemyCreatures=battle.waves[battle.waveIndex];
 for(const enemy of battle.enemyCreatures){enemy.summonedTurn=spawnTurn;enemy.summoningSick=true;enemy.waveStartedTurn=spawnTurn;}
 battle.phaseTicket=(battle.phaseTicket||0)+1;battle.priorityCallback=null;battle.deferredBeat=null;battle.activeAttackIds=null;
 battle.blockAssignments.clear();battle.selectedEnemyAttackerId=null;battle.selectedEnemyTargetId=null;
 battle.pendingAttachment=null;battle.pendingSpellTarget=null;battle.resolvingSpellTarget=null;
 battle.enemySpells=[];battle.activeEnemySpellId=null;delete battle.enemySpellsTurn;delete battle.intentsResolvedTurn;
 for(const creature of battle.creatures){creature.willAttack=false;creature.attackTargetId=null;}
 refreshPermanentEffects();
 addLog(`Wave ${battle.waveIndex} cleared. Wave ${battle.waveIndex+1} / ${battle.waves.length} arrives${battle.enemyCreatures.some(enemy=>enemy.tier==='boss')?' — the final guardian':''}.`);
 if(duringMain){renderBattle();playSfx('turn');}else beginNextPlayerTurn45(battle);
 if(battle.phase==='complete')return true;
 showToast(`Wave ${battle.waveIndex+1} / ${battle.waves.length} · ${battle.enemyCreatures.some(enemy=>enemy.tier==='boss')?'The final guardian has arrived.':'Reinforcements have arrived.'}`);
 if(typeof matchMedia==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden){
  document.getElementById('enemy-board')?.animate([{opacity:.25,filter:'brightness(1.35)'},{opacity:1,filter:'brightness(1)'}],{duration:450,easing:'ease-out'});
 }
 return true;
}
