/* Gamble follows its printed sequence. Jester's Mask uses a Masquerade variant. */
SPELL_RULES.Gamble={effects:[{kind:'gamble64'}]};
REVIEWED_PERMANENTS.add("Jester's Mask");
const baseJesterAudit64=rulesAudit;
rulesAudit=function(card){return card.name==="Jester's Mask"?{playable:true,adapted:true,reason:'Masquerade variant: an explicitly adapted, reviewed hand transformation.'}:baseJesterAudit64(card);};
const baseJesterEffects64=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return card.name==="Jester's Mask"?[]:baseJesterEffects64(card,creature);};

function discardGamble64(battle){
 if(!battle.hand.length){addLog('Gamble: no card in hand to discard.');return null;}
 const index=Math.floor(Math.random()*battle.hand.length),[card]=battle.hand.splice(index,1);
 battle.graveyard.push(card);addLog(`Gamble randomly discards ${card.name}.`);return card;
}
function finishGambleSequence64(battle,resume){
 if(state.battle!==battle||battle.phase==='complete')return false;
 discardGamble64(battle);
 battle.deck=shuffle(battle.deck);addLog('Gamble: your library is shuffled after the random discard.');
 resume();return true;
}
function beginGambleSearch64(context,resume,battle=state.battle){
 if(!battle||state.battle!==battle||battle.phase==='complete')return false;
 if(!battle.deck.length){addLog('Gamble: your library is empty. No card is found.');return finishGambleSequence64(battle,resume);}
 // Keep individual physical copies, including different purchased counters.
 const cards=[...battle.deck].sort((a,b)=>(a.cmc||0)-(b.cmc||0)||a.name.localeCompare(b.name));
 const search={id:`gamble-${state.nextPermanentId++}`,kind64:'gamble',battle,cards,selected:null,resume,closed:false,isCopy:context.isCopy};
 visibleTutorSearch51=search;battle.librarySearch=search;
 renderBattle();renderGoblinTutorSearch51();hideCardPreview();$('#tutor-search-dialog').showModal();return true;
}
const baseGambleSearchRender64=renderGoblinTutorSearch51;
renderGoblinTutorSearch51=function(){
 baseGambleSearchRender64();const search=visibleTutorSearch51;if(!search)return;
 const gamble=search.kind64==='gamble';
 $('#tutor-search-title').textContent=gamble?`Gamble${search.isCopy?' · spell copy':''}`:'Goblin Tutor';
 $('#tutor-search-pass').hidden=gamble;
 $('#tutor-search-confirm').textContent=gamble?'Take card · then random discard →':'Reveal & put into hand →';
 if(gamble){
  $('#tutor-search-instruction').textContent='Search your remaining library for one card. Put it into your hand, discard one hand card at random, then shuffle. The card you find can be the one you lose.';
  $('#tutor-search-status').textContent=`${search.cards.length} physical card${search.cards.length===1?'':'s'} · a nonempty unrestricted search must find a card. The spell is already paid.`;
 }
};
const baseGambleSearchFinish64=finishGoblinTutorSearch51;
finishGoblinTutorSearch51=function(take=true,id=visibleTutorSearch51?.id){
 const search=visibleTutorSearch51;
 if(search?.kind64!=='gamble')return baseGambleSearchFinish64(take,id);
 if(search.id!==id||search.closed||search.battle!==state.battle||search.battle.phase==='complete')return false;
 if(!take){showActionError('Gamble has resolved: choose a card from the nonempty library, then confirm.');return false;}
 const card=search.cards[search.selected],index=search.battle.deck.indexOf(card);if(!card||index<0)return false;
 const battle=search.battle,resume=search.resume;
 battle.deck.splice(index,1);battle.hand.push(card);addLog(`Gamble puts ${card.name} into your hand.`);
 abortTutorSearch51();
 return finishGambleSequence64(battle,resume);
};
const baseGambleAsync64=resolveDiceEffect50;
resolveDiceEffect50=function(effect,target,context,resume){if(effect.kind!=='gamble64')return baseGambleAsync64(effect,target,context,resume);beginGambleSearch64(context,resume);return true;};

const baseMaskRefresh64=refreshPermanentEffects;
refreshPermanentEffects=function(){
 for(const p of state.battle?.permanents||[])if(p.card.name==="Jester's Mask"&&!p.maskEntered64){p.maskEntered64=true;p.tapped=true;}
 return baseMaskRefresh64();
};
const baseMaskCost64=permanentActivationCost;
permanentActivationCost=function(card){return card.name==="Jester's Mask"?1:baseMaskCost64(card);};
const baseMaskLabel64=permanentActivationLabel51;
permanentActivationLabel51=function(p){return p.card.name==="Jester's Mask"?p.tapped?'Tapped · untaps next turn':'Pay 1 · tap · sacrifice · Masquerade':baseMaskLabel64(p);};
const baseMaskAvailable64=canActivatePermanent;
canActivatePermanent=function(p,battle=state.battle){
 if(p?.card.name!=="Jester's Mask")return baseMaskAvailable64(p,battle);
 return Boolean(battle&&battle===state.battle&&battle.permanents.includes(p)&&p.maskEntered64&&!p.tapped&&battle.hand.length&&!permanentActionBusy60(battle)&&!battle.librarySearch&&battle.mana>=1&&['main','attack','enemy','blocks','damage'].includes(battle.phase));
};
function masqueradeCards64(discarded,budget){
 if(!discarded.length)return [];
 const source=state.pool.length?state.pool:BUNDLED_CARDS;
 const pool=[...new Map(playableCards(source).filter(c=>!isLand(c)).map(c=>[c.name,c])).values()];
 const oldNames=new Set(discarded.map(c=>c.name));
 const different=pool.filter(c=>!oldNames.has(c.name));
 const available=different.length?different:pool;
 let cheap=available.filter(c=>Math.ceil(c.cmc||0)<=budget);
 if(!cheap.length)cheap=playableCards(BUNDLED_CARDS).filter(c=>!isLand(c)&&Math.ceil(c.cmc||0)<=budget);
 if(!available.length||!cheap.length)return null;
 const first=cheap[Math.floor(Math.random()*cheap.length)],chosen=[first];
 let rest=shuffle(available.filter(c=>c.name!==first.name));
 while(chosen.length<discarded.length){if(!rest.length)rest=shuffle(available);chosen.push(rest.pop());}
 return shuffle(chosen).map(card=>({...runCard59(card),conjuredByMask64:true}));
}
function animateMasquerade64(battle){
 if(state.battle!==battle||state.screen!=='combat-screen'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 document.querySelectorAll('.hand-card').forEach((card,i)=>card.animate?.([{opacity:.15,filter:'brightness(1.8) hue-rotate(100deg)'},{opacity:1,filter:'none'}],{duration:480,delay:Math.min(i*45,400),easing:'ease-out'}));
}
const baseMaskActivate64=activatePermanent;
activatePermanent=function(id){
 const b=state.battle,p=b?.permanents.find(unit=>unit.id===id);
 if(p?.card.name!=="Jester's Mask")return baseMaskActivate64(id);
 if(!canActivatePermanent(p,b))return false;
 const budget=Math.min(2,Math.max(0,b.mana-1)),discarded=[...b.hand],replacements=masqueradeCards64(discarded,budget);
 if(!replacements||!payMana(1,b))return false;
 p.tapped=true;b.permanents=b.permanents.filter(unit=>unit!==p);b.graveyard.push(p.card,...discarded);b.hand=replacements;b.mulliganAvailable=false;
 addLog(`Masquerade! ${discarded.length} hand card${discarded.length===1?'':'s'} become ${replacements.length} random nonland surprises. One costs ${budget} mana or less. These conjured cards last for this battle only.`);
 refreshPermanentEffects();renderBattle();animateMasquerade64(b);playSfx('draw');return true;
};
const baseMaskDetails64=tokenActionDetails47;
tokenActionDetails47=function(p){return p?.card.name==="Jester's Mask"?{effect:'Masquerade variant: discard your hand and conjure the same number of random, reviewed nonland cards for this battle. One costs at most 2 mana and is affordable after paying. Your run deck is unchanged.',cost:'1 generic mana · tap · sacrifice',action:'Masquerade my hand'}:baseMaskDetails64(p);};
const baseMaskWindow64=renderTokenAction47;
renderTokenAction47=function(){baseMaskWindow64();const p=state.battle?.permanents.find(unit=>unit.id===state.tokenAction47?.id);if(p?.card.name==="Jester's Mask"&&!state.battle.hand.length)$('#token-action-status').textContent='Your hand is empty. Keep the Mask until you have cards to disguise.';};

const baseJesterDescriptions64=effectDescriptions;
effectDescriptions=function(card){
 if(card.conjuredByMask64)return [...effectDescriptions({...card,conjuredByMask64:false}),'Conjured by Jester\'s Mask for this battle only. Not added to your run deck.'];
 if(card.name==='Gamble')return ['Search your remaining library for any one physical card and put it into your hand. Then discard one hand card uniformly at random, then shuffle the library.','The found card can be discarded. With an empty hand before searching, you necessarily discard the found card. Search is not a draw, and an empty library still permits the discard step.','A nonempty unrestricted search must find a card; you cannot cancel after paying. Countered Gamble does not search or discard. Each spell copy resolves the whole sequence separately.'];
 if(card.name==="Jester's Mask")return ['Masquerade variant: this game replaces the printed opponent-hand ability with a trick on your own hand.','Costs 5 generic mana and enters tapped. Untaps at the start of your next turn.','Pay 1 generic mana, tap and sacrifice: discard your hand, then conjure the same number of random reviewed nonland cards for this battle only. Requires at least one card in hand.','One surprise costs at most 2 and is affordable with your remaining mana after payment. Other cards are random; different names from the discarded cards are preferred. This is not drawing and does not consume library cards.','The real Mask and discarded hand cards go to the graveyard with their run upgrades intact. The run deck, library, creatures, lands, coins and life are unchanged except for paying the one-mana activation.'];
 return baseJesterDescriptions64(card);
};
const baseJesterSummary64=draftAbilitySummary;
draftAbilitySummary=function(card){return card.name==='Gamble'?'Find any library card, randomly discard a hand card, then shuffle.':card.name==="Jester's Mask"?'Enters tapped. Pay 1, tap, sacrifice: turn your hand into random battle-only spells.':baseJesterSummary64(card);};
const baseJesterCatalog64=collectionEntryMarkup;
collectionEntryMarkup=function(card,index,kind){const html=baseJesterCatalog64(card,index,kind);return card.name==="Jester's Mask"&&kind==='catalog'?html.replace('Playable · reviewed rules','Playable · Masquerade variant'):html;};
