/* Additional reviewed D6 cards: library search, a tapped mana artifact and host ETBs. */
SPELL_RULES['Goblin Tutor']={effects:[{kind:'die-tutor'}]};
REVIEWED_PERMANENTS.add('Jack-in-the-Mox');
for(const name of ['Adorable Kitten','Mother Kangaroo'])SPECIAL_CREATURES.add(name);

const TUTOR_TYPES51={2:'Goblin Tutor',3:'an enchantment',4:'an artifact',5:'a creature',6:'an instant or sorcery'};
function goblinTutorMatches51(card,result){
 return result===2?card.name==='Goblin Tutor':result===3?/\bEnchantment\b/.test(card.type_line):result===4?/\bArtifact\b/.test(card.type_line):result===5?isCreature(card):result===6?/\bInstant\b|\bSorcery\b/.test(card.type_line):false;
}
let visibleTutorSearch51=null;
function abortTutorSearch51(){
 const search=visibleTutorSearch51;visibleTutorSearch51=null;
 if(search){search.closed=true;if(search.battle.librarySearch===search)search.battle.librarySearch=null;}
 if($('#tutor-search-dialog')?.open)$('#tutor-search-dialog').close();
}
function beginGoblinTutorSearch51(result,resume,battle=state.battle){
 if(state.battle!==battle||battle.phase==='complete')return;
 if(result===1||result>6){addLog(`Goblin Tutor rolled ${result} and has no effect.`);return resume();}
 const eligible=battle.deck.filter(card=>goblinTutorMatches51(card,result));
 const cards=[...new Map(eligible.map(card=>[card.id||card.name,card])).values()].sort((a,b)=>(a.cmc||0)-(b.cmc||0)||a.name.localeCompare(b.name));
 if(!cards.length){battle.deck=shuffle(battle.deck);addLog('Goblin Tutor finds no matching card. Your library is shuffled.');return resume();}
 const search={id:`tutor-${state.nextPermanentId++}`,battle,result,cards,selected:null,resume,closed:false};
 visibleTutorSearch51=search;battle.librarySearch=search;
 $('#tutor-search-instruction').textContent=`Rolled ${result} · find ${TUTOR_TYPES51[result]}. Reveal it, put it into your hand, then shuffle.`;
 renderGoblinTutorSearch51();hideCardPreview();$('#tutor-search-dialog').showModal();
}
function renderGoblinTutorSearch51(){
 const search=visibleTutorSearch51;if(!search)return;
 $('#tutor-search-grid').innerHTML=search.cards.map((card,index)=>`<button type="button" class="tutor-search-card${search.selected===index?' selected':''}" data-tutor-pick="${index}" aria-pressed="${search.selected===index}"><span class="card-image-wrap">${cardFace(card)}</span><b>${escapeHtml(card.name)}</b><small>${Math.ceil(card.cmc||0)} mana · ${escapeHtml(card.type_line)}</small></button>`).join('');
 $('#tutor-search-confirm').disabled=!Number.isInteger(search.selected);
 $('#tutor-search-status').textContent=`${search.cards.length} matching card${search.cards.length===1?'':'s'} · choose one, or fail to find. Your library is shuffled either way.`;
 $('#tutor-search-confirm').dataset.searchId=search.id;$('#tutor-search-pass').dataset.searchId=search.id;
}
function chooseGoblinTutorCard51(index){
 const search=visibleTutorSearch51;
 if(!search||search.closed||search.battle!==state.battle||!search.cards[index])return false;
 search.selected=index;renderGoblinTutorSearch51();return true;
}
function finishGoblinTutorSearch51(take=true,id=visibleTutorSearch51?.id){
 const search=visibleTutorSearch51;
 if(!search||search.id!==id||search.closed||search.battle!==state.battle||search.battle.phase==='complete')return false;
 const battle=search.battle;
 if(take){
  const card=search.cards[search.selected];const index=battle.deck.indexOf(card);
  if(!card||index<0||!goblinTutorMatches51(card,search.result))return false;
  battle.deck.splice(index,1);battle.hand.push(card);addLog(`Goblin Tutor reveals ${card.name} and puts it into your hand.`);
 }else addLog('Goblin Tutor: you choose not to find a card.');
 battle.deck=shuffle(battle.deck);addLog('Your library is shuffled.');
 abortTutorSearch51();search.resume();return true;
}
$('#tutor-search-grid').addEventListener('click',event=>{const button=event.target.closest('[data-tutor-pick]');if(button)chooseGoblinTutorCard51(Number(button.dataset.tutorPick));});
$('#tutor-search-confirm').addEventListener('click',()=>finishGoblinTutorSearch51(true,$('#tutor-search-confirm').dataset.searchId));
$('#tutor-search-pass').addEventListener('click',()=>finishGoblinTutorSearch51(false,$('#tutor-search-pass').dataset.searchId));
$('#tutor-search-dialog').addEventListener('cancel',event=>{event.preventDefault();finishGoblinTutorSearch51(false);});
$('#tutor-search-dialog').addEventListener('close',()=>{if(!$('#tutor-search-dialog').open&&visibleTutorSearch51)abortTutorSearch51();});
const baseTutorScene51=showScreen;
showScreen=function(id){if(id!=='combat-screen')abortTutorSearch51();return baseTutorScene51(id);};
const baseTutorSync51=syncDiceWindow50;
syncDiceWindow50=function(){baseTutorSync51();const search=visibleTutorSearch51;if(search&&(search.battle!==state.battle||search.battle.phase==='complete'))abortTutorSearch51();};
const baseTutorEffect51=resolveDiceEffect50;
resolveDiceEffect50=function(effect,target,context,resume){
 if(effect.kind!=='die-tutor')return baseTutorEffect51(effect,target,context,resume);
 let result;
 return beginDiceRoll50(`${context.card.name}${context.isCopy?' · copy':''}`,['Search'],values=>values[0]===1||values[0]>6?'No effect.':`Search your library for ${TUTOR_TYPES51[values[0]]}.`,values=>{result=values[0];},()=>beginGoblinTutorSearch51(result,resume));
};

const baseHostEntry51=enterDiceCreature50;
enterDiceCreature50=function(card,battle=state.battle,originalCard=null){
 if(!['Adorable Kitten','Mother Kangaroo'].includes(card.name))return baseHostEntry51(card,battle,originalCard);
 if(!battle||state.battle!==battle||battle.phase==='complete')return true;
 const castCard=originalCard||card;const task={battle,p:{card:castCard},copies:1};battle.resolutionTask=task;
 const finish=()=>finishResolution27(task);
 if(battle.creatures.length>=CREATURE_LIMIT){battle.graveyard.push(castCard);addLog(`${castCard.name} has no free creature slot.`);finish();return true;}
 const unit={id:`player-${state.nextPermanentId++}`,owner:'player',card,...(originalCard?{originalCard}:{}),...parseStats(card),...creatureKeywords(card),summonedTurn:battle.turn,summoningSick:true,tapped:false,willAttack:false,attackedThisTurn:false,attackTargetId:null};
 battle.creatures.push(unit);refreshPermanentEffects();onCreatureEntered(unit);playSfx('creature');
 const kitten=card.name==='Adorable Kitten';
 beginDiceRoll50(originalCard?`${originalCard.name} → ${card.name}`:card.name,[kitten?'Life':'Counters'],values=>kitten?`Gain ${values[0]} life.`:`Put ${values[0]} permanent +1/+1 counters on this creature.`,values=>{
  if(kitten){state.playerHealth+=values[0];playSfx('heal');}
  else if(battle.creatures.includes(unit))resolveReviewedEffect({kind:'counter',amount:values[0]},{side:'player',id:unit.id},{card:castCard});
 },finish,battle);
 return true;
};

const baseMoxCost51=permanentActivationCost;
permanentActivationCost=function(card){return card.name==='Jack-in-the-Mox'?0:baseMoxCost51(card);};
const baseMoxLabel51=permanentActivationLabel51;
permanentActivationLabel51=function(permanent){return permanent.card.name==='Jack-in-the-Mox'?permanent.tapped?'Tapped · untaps next turn':'Tap · roll a D6':baseMoxLabel51(permanent);};
const baseMoxAvailable51=canActivatePermanent;
canActivatePermanent=function(permanent,battle=state.battle){
 if(permanent?.card.name!=='Jack-in-the-Mox')return baseMoxAvailable51(permanent,battle);
 return Boolean(battle&&battle.permanents.includes(permanent)&&!permanent.tapped&&!battle.resolutionTask&&!battle.choice&&!battle.scry&&!battle.libraryOrder&&!battle.interruption&&!battle.diceRoll&&['main','attack','enemy','blocks','damage'].includes(battle.phase));
};
const baseMoxActivate51=activatePermanent;
activatePermanent=function(id){
 const battle=state.battle;const permanent=battle?.permanents.find(unit=>unit.id===id);
 if(permanent?.card.name!=='Jack-in-the-Mox')return baseMoxActivate51(id);
 if(!canActivatePermanent(permanent,battle))return false;
 permanent.tapped=true;battle.mulliganAvailable=false;
 const task={battle,p:{card:permanent.card},copies:1};battle.resolutionTask=task;hideCardPreview();
 return beginDiceRoll50(permanent.card.name,['Mana'],values=>values[0]===1?'Sacrifice this Mox and lose 5 life.':values[0]<=6?'Add 1 floating generic mana. The Mox stays tapped.':'No listed result. The Mox stays tapped.',values=>{
  if(values[0]===1){battle.permanents=battle.permanents.filter(p=>p!==permanent);battle.graveyard.push(permanent.card);if(typeof notifySacrifice65==='function')notifySacrifice65(battle);state.playerHealth-=5;playSfx('player-hit');if(typeof animatePlayerDamage==='function')animatePlayerDamage(5);if(state.playerHealth<=0){battle.resolutionTask=null;endRun(false);}}
  else if(values[0]<=6){addFloatingMana58(1,battle);}
 },()=>finishResolution27(task),battle);
};
const baseMoreDiceDescription51=effectDescriptions;
effectDescriptions=function(card){
 if(card.name==='Goblin Tutor')return ['Roll a D6. 1: no effect. 2: find Goblin Tutor. 3: find an enchantment. 4: find an artifact. 5: find a creature. 6: find an instant or sorcery.','Search only your remaining library. Reveal the chosen card, put it into your hand, then shuffle. You may fail to find. This is not a draw.','Each spell copy rolls and searches separately.'];
 if(card.name==='Jack-in-the-Mox')return ['Tap: roll a D6. 1: sacrifice this Mox and lose 5 life. 2–6: add 1 floating generic mana.','Untaps next turn. This ability is not a spell.'];
 if(card.name==='Adorable Kitten')return ['When this creature enters, roll a D6. Gain life equal to the result.','It enters as a 1/1 before its life-gain ability resolves. A Clone copying it triggers a fresh roll.'];
 if(card.name==='Mother Kangaroo')return ['When this creature enters, roll a D6. Put that many permanent +1/+1 counters on this creature.','It enters as a 1/1 before the counters are added. These are counters, not a temporary bonus. A Clone copies its printed characteristics and rolls again.'];
 return baseMoreDiceDescription51(card);
};
const baseMoreDiceSummary51=draftAbilitySummary;
draftAbilitySummary=function(card){return {'Goblin Tutor':'Roll a D6: search your library for the indicated card type, reveal it, then shuffle.','Jack-in-the-Mox':'Tap, roll a D6: 2–6 add 1 mana; 1 sacrifices this Mox and loses 5 life.','Adorable Kitten':'On entry, roll a D6 and gain that much life.','Mother Kangaroo':'On entry, roll a D6 and add that many permanent +1/+1 counters.'}[card.name]||baseMoreDiceSummary51(card);};
