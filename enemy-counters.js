/* v0.44 — a visible, bounded enemy reaction to a paid player spell. */
const baseCreateFoe44=createFoe;
createFoe=function(kind,node=state.node){
 const enemy=baseCreateFoe44(kind,node);
 enemy.counterspell=node>=3&&['archivist','sphinx'].includes(kind);
 return enemy;
};
function enemyCounterReady44(enemy,battle=state.battle){
 return Boolean(battle&&enemy?.counterspell&&enemy.health>0&&battle.turn>=2&&battle.turn%2===0&&battle.enemyCounterUsedTurn!==battle.turn);
}
const baseEnemyKeywords44=creatureKeywordLabels;
creatureKeywordLabels=function(unit){
 const label=baseEnemyKeywords44(unit);if(!unit?.counterspell)return label;
 const extra=enemyCounterReady44(unit)?'Counterspell (2 mana)':state.battle?.enemyCounterUsedTurn===state.battle?.turn?'Counterspell spent':'Counterspell next turn';
 return [label,extra].filter(Boolean).join(' · ');
};
const baseCounterTiming44=canCastNow;
canCastNow=function(card,battle=state.battle){
 if(battle?.enemyCounterWindow&&!(isInstant(card)||hasFlash(card)))return false;
 return baseCounterTiming44(card,battle);
};
function enemyCounterBusy44(battle){
 return Boolean(battle.resolutionTask||battle.choice||battle.scry||battle.libraryOrder||battle.interruption);
}
function offerEnemyCounter44(card,battle,resume,countered){
 if(state.battle!==battle||battle.phase==='complete'||battle.enemyCounterWindow||isLand(card))return false;
 const source=battle.enemyCreatures.find(enemy=>enemyCounterReady44(enemy,battle));
 if(!source)return false;
 const counterCard=BUNDLED_CARDS.find(card=>card.name==='Counterspell');
 const spell={id:`enemy-spell-${state.nextPermanentId++}`,owner:'enemy',card:counterCard,sourceId:source.id,sourceName:source.card.name,target:{side:'player-spell',card},status:'pending',intent:'counterspell',manaPaid:2,manaRemaining:0};
 const window={battle,spell,card,resume,countered,savedResolution:battle.resolutionTask,savedPriority:battle.priorityCallback,savedActive:battle.activeEnemySpellId,closed:false};
 battle.enemyCounterUsedTurn=battle.turn;source.counterManaPaidTurn=battle.turn;
 (battle.enemySpells||=[]).push(spell);battle.activeEnemySpellId=spell.id;
 battle.resolutionTask=null;battle.enemyCounterWindow=window;
 battle.priorityCallback=()=>settleEnemyCounter44(battle);
 addLog(`${source.card.name} pays 2 mana and casts Counterspell, targeting your ${card.name}. Respond with an instant or continue.`);
 renderBattle();return true;
}
function settleEnemyCounter44(battle=state.battle){
 const window=battle?.enemyCounterWindow;
 if(!window||window.closed||state.battle!==battle||battle.phase==='complete'||enemyCounterBusy44(battle))return false;
 window.closed=true;
 const succeeds=window.spell.status==='pending';
 if(succeeds){finishEnemySpell38(window.spell,'resolved',battle);addLog(`${window.spell.sourceName}'s Counterspell counters ${window.card.name}. Its costs stay paid.`);playSfx('cast');}
 else addLog(`The enemy Counterspell was stopped. ${window.card.name} continues resolving.`);
 battle.enemyCounterWindow=null;battle.resolutionTask=window.savedResolution||null;
 battle.activeEnemySpellId=window.savedActive||null;battle.priorityCallback=window.savedPriority||null;
 if(succeeds)window.countered();else window.resume();
 return true;
}
