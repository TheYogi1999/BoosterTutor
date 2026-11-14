/* A normal six-pack draft followed by endless waves with a persistent battlefield. */
const ELIXIR76='Elixir of Immortality';
let selectedGameMode76='precons';
function immortalMode76(){return state.runMode71==='immortal'&&state.immortal76;}
function seedImmortalRun76(){
 const card=BUNDLED_CARDS.find(card=>card.name===ELIXIR76);
 if(!card)throw Error('The Immortal Expedition requires Elixir of Immortality.');
 const field=runCard59(card),library=runCard59(card);state.deck.push(field,library);
 state.immortal76={field,library,battle:null,owned:new Set()};recordSeenCards([card]);
}
function prepareImmortalOpening76(b){
 const mode=immortalMode76();if(!mode||mode.battle)return;
 mode.battle=b;mode.owned=new Set(state.deck.map(card=>card.runCardId60));
 b.deck=b.deck.filter(card=>card!==mode.field&&card!==mode.library);
 b.permanents.push({id:`immortal-elixir-${state.nextPermanentId++}`,card:mode.field,tapped:false,attachedTo:null});
 b.reservedElixir76=mode.library;b.immortalWave76=1;
 b.enemy={...b.enemy,rank:'WAVE 1 · ∞'};
}
function finishImmortalOpening76(b){
 if(!b.reservedElixir76)return;
 b.deck=shuffle([...b.deck,b.reservedElixir76]);delete b.reservedElixir76;
}
function finishImmortalWave76(b){
 if(!immortalMode76()||b!==state.battle||b.phase==='complete'||b.enemyCreatures.length)return false;
 b.phase='complete';b.intermission76=true;b.priorityCallback=null;b.phaseTicket=(b.phaseTicket||0)+1;
 b.attackResolution55=false;b.activeAttackIds=null;
  b.runStatBaseline76=new Map(b.creatures.map(unit=>[unit.id,runStatCount60(unit.card)]));
 addLog(`Wave ${b.immortalWave76} cleared. Your battlefield and card zones carry into the next wave.`);
 ensureEndlessStages59(state.node+1);offerEncounterReward59();return true;
}
function resumeImmortalWave76(node){
 const mode=immortalMode76(),b=mode?.battle;
 if(!b||b!==state.battle||!b.intermission76||state.playerHealth<=0||node!==state.node||state.screen!=='journey-screen')return false;
 ensureEndlessStages59(node);
 const encounter=ENCOUNTERS[(node-1)%ENCOUNTERS.length],team=createEnemyTeam(encounter);
 if(node>ENCOUNTERS.length)scaleEndlessWaves59([team],node);
 const added=state.deck.filter(card=>!mode.owned.has(card.runCardId60));
 for(const card of added)mode.owned.add(card.runCardId60);
 if(added.length)b.deck=shuffle([...b.deck,...added]);
  for(const unit of b.creatures){
   if(unit.originalCard)unit.card.runCounters60=[...activeRunCounters60(unit.originalCard)];
   const change=runStatCount60(unit.card)-(b.runStatBaseline76?.get(unit.id)||0);unit.power+=change;unit.toughness+=change;
   for(const kind of activeRunCounters60(unit.card))if(!['stats','toxic'].includes(kind))unit[kind]=true;
   if(typeof cancelOppositeCounters66==='function')cancelOppositeCounters66(unit);
  }
 b.enemy={...encounter,rank:`WAVE ${node} · ∞`};b.stage=state.stageLocations[node-1];
 b.enemyCreatures=team;b.waves=[team];b.waveIndex=0;b.immortalWave76=node;b.intermission76=false;
 for(const enemy of team){enemy.summonedTurn=b.turn+1;enemy.summoningSick=true;enemy.waveStartedTurn=b.turn+1;}
 b.phase='main';b.phaseTicket=(b.phaseTicket||0)+1;b.priorityCallback=null;b.deferredBeat=null;b.activeAttackIds=null;b.attackResolution55=false;
 b.blockAssignments.clear();b.selectedEnemyAttackerId=null;b.selectedEnemyTargetId=null;b.pendingAttachment=null;b.pendingSpellTarget=null;b.resolvingSpellTarget=null;
 b.enemySpells=[];b.activeEnemySpellId=null;delete b.enemySpellsTurn;delete b.intentsResolvedTurn;delete b.enemyCounterUsedTurn;
 b.mulliganAvailable=false;deployCampTokens(b);refreshPermanentEffects();
 // This is a new turn in the same battle: untap, clean up temporary effects and draw one.
 beginNextPlayerTurn45(b);
 if(b.phase==='complete')return false;
 addLog(`Wave ${node}: ${added.length} new run cards shuffled into your remaining Library.`);
 showScreen('combat-screen');renderBattle();return true;
}
const baseImmortalBattle76=beginBattle;
beginBattle=function(node){const mode=immortalMode76();if(mode?.battle)return resumeImmortalWave76(node);return baseImmortalBattle76(node);};
const baseImmortalJourney76=showJourney;
showJourney=function(){
 if(immortalMode76())ensureEndlessStages59(state.node+ENCOUNTERS.length-1);
 const result=baseImmortalJourney76();if(!immortalMode76())return result;
 $('#journey-location').textContent=`${(state.stageLocations[state.node-1]||LAND_STAGES[0]).name} · WAVE ${state.node} / ∞`;
 $('#journey-description').textContent=state.node===1?'Choose one supply token, then begin with two bonus Elixirs.':'Choose one supply token. Your battlefield and card zones continue; new cards join your remaining Library.';
 const first=Math.floor((state.node-1)/ENCOUNTERS.length)*ENCOUNTERS.length;
 $('#journey-path').innerHTML=ENCOUNTERS.map((encounter,i)=>`<div class="path-node ${first+i+1===state.node?'current':first+i+1<state.node?'complete':''}"><span>${first+i+1<state.node?'✓':'∞'}</span><small>WAVE ${first+i+1}</small><b>${escapeHtml(state.stageLocations[first+i].name)}</b></div>`).join('');return result;
};
const baseImmortalEnd76=renderRunEnd59;
renderRunEnd59=function(won){
 baseImmortalEnd76(won);if(!immortalMode76())return;
 state.endlessReady59=false;$('#endless-invitation').hidden=true;
 $('#end-eyebrow').textContent='IMMORTAL EXPEDITION OVER';
 $('#run-summary').innerHTML=`<span>WAVE <b>${state.node} / ∞</b></span><span>LEVEL <b>${state.level}</b></span><span>DECK <b>${state.deck.length}</b></span><span>LIFE <b>${Math.max(0,state.playerHealth)}</b></span>`;
 $('#end-message').textContent=`You reached wave ${state.node} and level ${state.level}.${state.playerHealth>0?' Your Library ran out of cards.':''} Your highest level is saved.`;
};
function selectGameMode76(mode){
 selectedGameMode76=mode==='immortal'?'immortal':'precons';const immortal=selectedGameMode76==='immortal';
 $('#precon-workspace').hidden=immortal;$('#immortal-workspace76').hidden=!immortal;
 $('#precon-mode-tab').setAttribute('aria-selected',String(!immortal));$('#immortal-mode-tab76').setAttribute('aria-selected',String(immortal));
 $('#game-modes-heading').textContent=immortal?'How long can your expedition endure?':'Which deck begins your journey?';
 $('#precon-begin').disabled=immortal?false:!preconDefinition71(selectedPrecon71);$('#precon-begin').textContent=immortal?'BEGIN IMMORTAL RUN →':'BEGIN RUN →';
 $('#game-modes-description76').innerHTML=immortal?'Normal six-pack draft · two bonus Elixirs<br>Endless waves · rewards, shop and camp · persistent battlefield':'24 cards · 7 mana cards · 1 Booster Tutor<br>Generic mana · no opening draft · normal rewards after combat';
 if(immortal){const card=BUNDLED_CARDS.find(c=>c.name===ELIXIR76);$('#immortal-card76').innerHTML=cardFace(card);}
}
function startImmortalRun76(){
 if(!onPreconTitle71()||!$('#game-modes-dialog').open||selectedGameMode76!=='immortal')return false;
 $('#game-modes-dialog').close();startNewRun({runMode76:'immortal'});return true;
}
$('#precon-mode-tab').addEventListener('click',()=>selectGameMode76('precons'));
$('#immortal-mode-tab76').addEventListener('click',()=>selectGameMode76('immortal'));
$('#immortal-card76').addEventListener('click',()=>{
 const card=BUNDLED_CARDS.find(card=>card.name===ELIXIR76);
 $('#precon-card-content').innerHTML=`<div class="precon-inspect-art71">${cardFace(card)}</div><div class="precon-inspect-copy71"><span class="eyebrow">IMMORTAL EXPEDITION · TWO BONUS COPIES</span><h2>${ELIXIR76}</h2><p>Artifact · 1 generic mana</p><div class="precon-inspect-rules71">${effectDescriptions(card).map(line=>`<p>${escapeHtml(line)}</p>`).join('')}</div></div>`;$('#precon-card-dialog').showModal();
});
