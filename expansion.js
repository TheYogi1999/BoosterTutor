/* v0.27 — complete collection rules, library choices, Ward and interrupting boosters. */
SUPPORTED_KEYWORDS.push('ward');
Object.assign(SPELL_RULES,{
 Brainstorm:{effects:[{kind:'brainstorm'}]},Opt:{effects:[{kind:'scry-draw',scry:1,draw:1}]},Preordain:{effects:[{kind:'scry-draw',scry:2,draw:1}]},
 'Serum Visions':{effects:[{kind:'draw-scry',draw:1,scry:2}]},'Quick Study':{effects:[{kind:'draw',amount:2}]},Concentrate:{effects:[{kind:'draw',amount:3}]},Harmonize:{effects:[{kind:'draw',amount:3}]},
 'Scour from Existence':{target:'permanent',effects:[{kind:'exile'}]},"Iona's Judgment":{target:'creature-or-enchantment',effects:[{kind:'exile'}]},'Angelic Edict':{target:'creature-or-enchantment',effects:[{kind:'exile'}]},
 'Final Judgment':{effects:[{kind:'exile-all-creatures'}]},'Booster Tutor':{effects:[{kind:'booster-tutor'}]}
});
const baseRulesAudit27=rulesAudit;
function wardCost(unit){return Number(unit?.ward)||Number((unit?.card?.oracle_text||'').match(/\bWard\s*\{(\d+)\}/i)?.[1])||0;}
rulesAudit=function(card){
 if(/\bmills?\b/i.test(card.oracle_text||'')||(card.keywords||[]).some(keyword=>keyword.toLowerCase()==='mill'))return{playable:false,reason:'Mill is an enemy ability in this game. Player mill cards are excluded because opponents do not have a library.'};
 if((card.keywords||[]).includes('Ward')||/\bWard\b/.test(card.oracle_text||'')){
  if(!/\bWard\s*\{\d+\}/i.test(card.oracle_text||''))return{playable:false,reason:'Only generic-mana Ward is implemented; this card has a different Ward cost.'};
  const stripped={...card,keywords:(card.keywords||[]).filter(k=>k.toLowerCase()!=='ward'),oracle_text:(card.oracle_text||'').replace(/\bWard\s*\{\d+\}(?:\s*\([^)]*\))?/gi,'').trim().replace(/,\s*$/,'')};
  const audit=baseRulesAudit27(stripped);return audit.playable?{playable:true,reason:'Reviewed numeric Ward and supported combat abilities.'}:audit;
 }
 return baseRulesAudit27(card);
};
const basePlayable27=playableCards;
playableCards=function(cards){return basePlayable27(cards).filter(card=>card.name!=='Booster Tutor');};
const baseCreatureKeywords27=creatureKeywords;
creatureKeywords=function(card){return{...baseCreatureKeywords27(card),ward:Number((card.oracle_text||'').match(/\bWard\s*\{(\d+)\}/i)?.[1])||0};};
const baseKeywordLabels27=creatureKeywordLabels;
creatureKeywordLabels=function(unit){return[baseKeywordLabels27(unit),wardCost(unit)?`Ward (${wardCost(unit)} mana)`:'',unit?.owner==='enemy'&&unit.millAmount?`Mill ${unit.millAmount}`:''].filter(Boolean).join(' · ');};
const baseTargetOptions27=ruleTargetOptions;
ruleTargetOptions=function(kind,battle=state.battle){
 const creatures=baseTargetOptions27(kind,battle);
 if(!['permanent','creature-or-enchantment'].includes(kind))return creatures;
 const permanents=battle.permanents.filter(p=>kind==='permanent'||/Enchantment/.test(p.card.type_line)).map(p=>({key:`permanent:${p.id}`,card:p.card,unit:p}));
 const lands=kind==='permanent'?(battle.lands||[]).map(p=>({key:`land:${p.id}`,card:p.card,unit:p})):[];
 return[...creatures,...permanents,...lands];
};
const baseChoiceUnit27=choiceTargetUnit;
choiceTargetUnit=function(target,battle=state.battle){if(target?.side==='permanent')return battle.permanents.find(p=>p.id===target.id);if(target?.side==='land')return battle.lands.find(p=>p.id===target.id);return baseChoiceUnit27(target,battle);};
const baseCanCast27=canCastNow;
canCastNow=function(card,battle=state.battle){return Boolean(battle&&!battle.resolutionTask&&!battle.libraryOrder&&!battle.interruption&&baseCanCast27(card,battle));};
const baseBeat27=afterCombatBeat;
afterCombatBeat=function(battle,phase,callback){const resume=()=>{if(battle.resolutionTask||battle.libraryOrder||battle.interruption||battle.enemyCounterWindow){battle.deferredBeat=resume;return;}callback();};return baseBeat27(battle,phase,resume);};
function finishResolution27(task){
 const b=task.battle;if(state.battle!==b)return;
 b.resolutionTask=null;b.wardTask=null;b.mulliganAvailable=false;refreshPermanentEffects();b.creatures=removeDeadCreatures(b.creatures,'player');b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');
 if(b.phase==='complete')return;
 addLog(`${task.p.card.name} finishes resolving${task.copies>1?` (${task.copies} spell resolutions)`:''}.`);playSfx('cast');
 if(b.enemyCounterWindow){renderBattle();return;}
 if(!b.enemyCreatures.length)return winBattle();renderBattle();
 if(b.deferredBeat){const resume=b.deferredBeat;b.deferredBeat=null;afterCombatBeat(b,b.phase,resume);}
}
function advanceResolution27(task){
 const b=task.battle;if(state.battle!==b||b.phase==='complete'){if(state.battle===b)b.resolutionTask=null;return;}
 if(task.copy>=task.copies)return finishResolution27(task);
 const p=task.p;const target=task.target;const unit=choiceTargetUnit(target,b);
 if(p.rule.target){const valid=target.side==='grave'?b.graveyard.includes(task.graveCard):target.side==='life'||Boolean(unit);if(!valid){addLog(`${p.card.name}: the target is gone; this resolution has no effect.`);if(isAura(p.card))b.graveyard.push(p.card);task.copy++;task.effect=0;task.wardPaid=false;return advanceResolution27(task);}}
 if(!task.enemyCounterChecked&&task.effect===0){
  task.enemyCounterChecked=true;
  const resume=()=>advanceResolution27(task);
  const countered=()=>{if(isAura(p.card))b.graveyard.push(p.card);task.copy++;task.effect=0;task.wardPaid=false;advanceResolution27(task);};
  if(typeof offerEnemyCounter44==='function'&&offerEnemyCounter44(p.card,b,resume,countered))return;
 }
 const ward=unit?.owner==='enemy'?wardCost(unit):0;
 if(ward&&!task.wardPaid){renderBattle();b.wardTask=task;$('#ward-title').textContent=`${unit.card.name} · Ward (${ward} mana)`;$('#ward-description').textContent=`Pay ${ward} extra generic mana or ${p.card.name}${task.copies>1?' (this spell copy)':''} is countered. Casting and additional costs have already been paid.`;$('#ward-pay').textContent=`Pay ${ward} mana →`;$('#ward-pay').disabled=!paymentPlan({cmc:ward});$('#ward-progress').textContent=`Resolution ${task.copy+1} of ${task.copies} · ${b.mana} mana available`;$('#ward-dialog').showModal();return;}
 b.wardTask=null;
 if(isAura(p.card)){b.permanents.push({id:`permanent-${state.nextPermanentId++}`,card:p.card,attachedTo:target.id});task.copy++;return advanceResolution27(task);}
 while(task.effect<p.rule.effects.length){const effect=p.rule.effects[task.effect++];const resume=()=>advanceResolution27(task);
  if(effect.kind==='brainstorm'){for(let n=0;n<3&&b.phase!=='complete';n++)drawOneCard();if(b.phase==='complete')return finishResolution27(task);return beginLibraryOrder27(2,resume);}
  if(effect.kind==='scry-draw'||effect.kind==='draw-scry'){
   if(effect.kind==='draw-scry')for(let n=0;n<effect.draw&&b.phase!=='complete';n++)drawOneCard();if(b.phase==='complete')return finishResolution27(task);
   b.scryContinuation=resume;beginScry(effect.scry,effect.kind==='scry-draw'?effect.draw:0);if(!b.scry){b.scryContinuation=null;continue;}return;
  }
  if(effect.kind==='booster-tutor')return beginBoosterInterruption27('tutor',resume);
  if(typeof resolveDiceEffect50==='function'&&resolveDiceEffect50(effect,target,{card:p.card,isCopy:task.copy>0},resume))return;
  resolveReviewedEffect(effect,target,{graveCard:task.graveCard,isCopy:task.copy>0,card:p.card});
  if(b.phase==='complete')return finishResolution27(task);
 }
 task.copy++;task.effect=0;task.wardPaid=false;advanceResolution27(task);
}
commitRuleSpell=function(p){
 const b=state.battle;if(!b||b.phase==='complete'||b.hand[p.index]!==p.card||!paymentPlan(p.card)||b.resolutionTask)return false;
 const key=p.picks.target?.[0];if(p.rule.target&&!ruleTargetOptions(p.rule.target,b).some(option=>option.key===key))return false;
 const discards=(p.picks.discard||[]).map(Number);const sacrificed=(p.picks.sacrifice||[]).map(id=>b.creatures.find(unit=>unit.id===id));
 if(discards.length!==(p.rule.discard||0)||new Set(discards).size!==discards.length||discards.some(i=>i===p.index||!b.hand[i])||sacrificed.length!==(p.rule.sacrifice||0)||sacrificed.some(unit=>!unit))return false;
 const target=key?parseRuleTarget(key):null;const clone=p.card.name==='Clone'?choiceTargetUnit(target):null;const graveCard=target?.side==='grave'?b.graveyard[target.index]:null;
 if(p.card.name==='Clone'&&(!clone||b.creatures.length>=3))return false;
 if(typeof confirmWardCasting52==='function'&&confirmWardCasting52(p,b,target))return false;
 if(!payMana(p.card.cmc,b))return false;
 const spell=isInstant(p.card)||/\bSorcery\b/.test(p.card.type_line);const copies=spell?1+(b.copyNextSpell||0):1;if(spell)b.copyNextSpell=0;
 for(const i of discards)b.graveyard.push(b.hand[i]);const removed=new Set([p.index,...discards]);b.hand=b.hand.filter((card,i)=>!removed.has(i));for(const unit of sacrificed)sacrificeRuleCreature(unit);
 if(typeof onPlayerSpellCast65==='function')onPlayerSpellCast65(p.card,b);
 if(clone){
  const resolve=()=>{
   const chosen=choiceTargetUnit(target,b);
   if(chosen){
    const card={...chosen.card};
    if(typeof copyPhysicalFinish59==='function')copyPhysicalFinish59(card,p.card);
    if(typeof enterDiceCreature50==='function'&&enterDiceCreature50(card,b,p.card))return;
    const unit={id:`player-${state.nextPermanentId++}`,card,originalCard:p.card,owner:'player',...parseStats(card),...creatureKeywords(card),summonedTurn:b.turn,summoningSick:true,tapped:false,willAttack:false,attackedThisTurn:false};b.creatures.push(unit);refreshPermanentEffects();onCreatureEntered(unit);
   }else b.graveyard.push(p.card);
   return finishResolution27({battle:b,p,copies:1});
  };
  const countered=()=>{b.graveyard.push(p.card);finishResolution27({battle:b,p,copies:1});};
  if(typeof offerEnemyCounter44==='function'&&offerEnemyCounter44(p.card,b,resolve,countered))return true;
  return resolve();
 }
 if(!isAura(p.card))b.graveyard.push(p.card);
 const task={battle:b,p,target,graveCard,copies,copy:0,effect:0,wardPaid:false};b.resolutionTask=task;b.mulliganAvailable=false;advanceResolution27(task);return true;
};
function answerWard27(pay){const b=state.battle;const task=b?.wardTask;if(!task)return;const cost=wardCost(choiceTargetUnit(task.target,b));if(pay&&!payMana(cost,b))return;$('#ward-dialog').close();b.wardTask=null;if(pay){task.wardPaid=true;renderBattle();}else{addLog(`${task.p.card.name} is countered by Ward; its casting costs stay paid.`);if(isAura(task.p.card))b.graveyard.push(task.p.card);task.copy++;task.effect=0;task.wardPaid=false;}advanceResolution27(task);}
$('#ward-pay').addEventListener('click',()=>answerWard27(true));$('#ward-decline').addEventListener('click',()=>answerWard27(false));$('#ward-dialog').addEventListener('cancel',event=>{event.preventDefault();answerWard27(false);});
function beginLibraryOrder27(count,resume){const b=state.battle;const need=Math.min(count,b.hand.length);if(!need)return resume();b.libraryOrder={count:need,selected:[],resume};renderLibraryOrder27();$('#library-order-dialog').showModal();}
function renderLibraryOrder27(){const order=state.battle.libraryOrder;$('#library-order-grid').innerHTML=state.battle.hand.map((card,i)=>`<button data-library-pick="${i}" class="${order.selected.includes(i)?'selected':''}" aria-pressed="${order.selected.includes(i)}">${cardFace(card)}<b>${escapeHtml(card.name)}</b><small>${order.selected.includes(i)?`Position ${order.selected.indexOf(i)+1} from the top`:'Keep in hand'}</small></button>`).join('');$('#library-order-confirm').disabled=order.selected.length!==order.count;$('#library-order-status').textContent=`Choose ${order.count} cards. First chosen = next card drawn. ${order.selected.length}/${order.count} selected.`;}
function pickLibraryOrder27(index){const order=state.battle?.libraryOrder;if(!order||!state.battle.hand[index])return;if(order.selected.includes(index))order.selected=order.selected.filter(i=>i!==index);else if(order.selected.length<order.count)order.selected.push(index);renderLibraryOrder27();}
function finishLibraryOrder27(){const b=state.battle;const order=b?.libraryOrder;if(!order||order.selected.length!==order.count)return;const cards=order.selected.map(i=>b.hand[i]);const selected=new Set(order.selected);b.hand=b.hand.filter((card,i)=>!selected.has(i));b.deck.push(...cards.reverse());b.libraryOrder=null;$('#library-order-dialog').close();renderBattle();order.resume();}
$('#library-order-grid').addEventListener('click',event=>{const button=event.target.closest('[data-library-pick]');if(button)pickLibraryOrder27(Number(button.dataset.libraryPick));});$('#library-order-confirm').addEventListener('click',finishLibraryOrder27);$('#library-order-dialog').addEventListener('cancel',event=>{event.preventDefault();showActionError('Brainstorm has resolved. Choose the cards to return, then confirm.');});
const baseFinishScry27=finishScry;
finishScry=function(){const b=state.battle;const resume=b?.scryContinuation;if(b)b.scryContinuation=null;baseFinishScry27();if(resume)resume();};
// Existing listener captured the old function; add a continuation after its synchronous work.
$('#scry-confirm').addEventListener('click',()=>{const b=state.battle;if(!b?.scry&&b?.scryContinuation){const resume=b.scryContinuation;b.scryContinuation=null;resume();}});
$('#scry-dialog').addEventListener('cancel',()=>{const b=state.battle;if(!b?.scry&&b?.scryContinuation){const resume=b.scryContinuation;b.scryContinuation=null;resume();}});
const baseResolveEffect27=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const b=state.battle;
 if(effect.kind==='exile-all-creatures'){const targets=[...b.creatures.map(unit=>({side:'player',id:unit.id})),...b.enemyCreatures.map(unit=>({side:'enemy',id:unit.id}))];for(const victim of targets)baseResolveEffect27({kind:'exile'},victim,context);return;}
 if(effect.kind==='exile'&&['permanent','land'].includes(target?.side)){
  const zone=target.side==='land'?b.lands:b.permanents;const index=zone.findIndex(p=>p.id===target.id);if(index<0)return;const [permanent]=zone.splice(index,1);b.exile.push(permanent.card);if(target.side==='land'){b.maxMana=Math.max(0,b.maxMana-1);syncMana(b);}refreshPermanentEffects();addLog(`${permanent.card.name} is exiled.`);return;
 }
 return baseResolveEffect27(effect,target,context);
};
const DRAFT_FIELDS27=['packs','selection','draftKind','activePack','rerolledPacks','boosterSealed'];
function beginBoosterInterruption27(kind,resume=null,contents=null,packName=null,packType=null){
 if(state.boosterInterruption)return false;
 const saved=Object.fromEntries(DRAFT_FIELDS27.map(key=>[key,state[key]]));const battle=state.battle;
 state.boosterInterruption={kind,saved,resume,battle,screen:state.screen,packName,packType};if(kind==='tutor')battle.interruption=true;
 state.packs=[contents || shuffle([...chooseRandomCards(state.pool.length?state.pool:BUNDLED_CARDS,PACK_SIZE-1),generateStarterManaCards(1)[0]])];state.selection=new Map();state.draftKind=kind;state.activePack=0;state.rerolledPacks=new Set([0]);state.boosterSealed=true;
 renderDraft();showScreen('draft-screen');return true;
}
const baseRenderDraft27=renderDraft;
renderDraft=function(){baseRenderDraft27();const flow=state.boosterInterruption;if(!flow){if(state.draftKind==='starter'){$('#deck-count').textContent=String(state.deck.length+state.selection.size*COPIES_PER_DRAFT_PICK+STARTING_MANA_CARDS+1);$('#selection-status').textContent='Starter bonus: 4 mana cards + 1 Booster Tutor.';}return;}const tutor=flow.kind==='tutor';$('#draft-step').textContent=tutor?'BOOSTER TUTOR · BATTLE PAUSED':flow.packName||'PURCHASED BOOSTER';$('#draft-title').textContent=state.boosterSealed?'Open your booster':tutor?'Choose one card for your hand':`Your ${draftAward61().count} new cards`;$('#draft-instruction').textContent=draftInstruction61();$('#pack-number').textContent='1 / 1';$('#pack-reroll').disabled=true;$('#pack-reroll').textContent='No reroll for this pack';$('#draft-confirm').textContent=tutor?'ADD TO HAND & RESUME →':`ADD ALL ${draftAward61().count} & RETURN TO SHOP →`;$('#draft-confirm').disabled=state.boosterSealed||Boolean(boosterTravel)||(tutor&&!state.selection.has(0));$('#selection-status').textContent=state.boosterSealed?'Open the booster to continue.':tutor?`The other ${draftAward61().count-1} cards stay outside this game.`:`${draftAward61().count} cards · one copy each · already paid`;if(!tutor){const heading=document.querySelector('.booster-pack header small');if(heading)heading.textContent=draftChoiceLabel61();}};
const baseConfirmDraft27=confirmDraft;
confirmDraft=function(){const flow=state.boosterInterruption;if(!flow){const starter=state.draftKind==='starter'&&state.activePack===STARTER_BOOSTER_COUNT-1&&Boolean(selectedDraftCards());const value=baseConfirmDraft27();if(starter){const tutor=BUNDLED_CARDS.find(card=>card.name==='Booster Tutor');state.deck=state.deck.filter(card=>card.name!=='Booster Tutor');state.deck.push(typeof runCard59==='function'?runCard59(tutor):tutor);if(state.screen==='journey-screen')showJourney();}return value;}
 if(state.screen!=='draft-screen'||state.boosterSealed||boosterTravel)return false;
 const cards=state.packs[0];if(flow.kind==='tutor'){const index=state.selection.get(0);if(!Number.isInteger(index)||!cards[index]||state.battle!==flow.battle)return false;flow.battle.hand.push(cards[index]);addLog(`Booster Tutor puts ${cards[index].name} into your hand.`);}else state.deck.push(...cards);
 for(const key of DRAFT_FIELDS27)state[key]=flow.saved[key];state.boosterInterruption=null;
 if(flow.kind==='tutor'){flow.battle.interruption=false;showScreen('combat-screen');renderBattle();flow.resume?.();}else{renderShop();showScreen('shop-screen');}return true;
};
// The original listener captured confirmDraft; route it through the interrupt-aware entry point.
$('#draft-confirm').removeEventListener('click',baseConfirmDraft27);$('#draft-confirm').addEventListener('click',confirmDraft);
const baseEnemyTeam27=createEnemyTeam;
createEnemyTeam=function(encounter){const team=baseEnemyTeam27(encounter);const node=ENCOUNTERS.indexOf(encounter)+1||state.node;for(const enemy of team){enemy.ward=Math.max(enemy.ward||0,node>=2?(enemy.kind==='dragon'?3:['raider','wolf'].includes(enemy.kind)?node>=3?2:1:0):0);if(enemy.ward)enemy.card={...enemy.card,oracle_text:enemy.card.oracle_text+`\nWard {${enemy.ward}}`};if(enemy.kind==='wisp'){enemy.pattern=['buff','mill','attack'];enemy.millAmount=node>=4?3:2;}}return team;};
const baseEnemyIntent27=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1){if(enemy.pattern?.[(turn-1)%enemy.pattern.length]==='mill')return{kind:'mill',damage:0,mill:enemy.millAmount||2,label:`Mill · ${enemy.millAmount||2} cards`,icon:'▤'};return baseEnemyIntent27(enemy,turn);};
function millLibrary27(count){const b=state.battle;const cards=b.deck.splice(Math.max(0,b.deck.length-count)).reverse();b.graveyard.push(...cards);return cards.length;}
const baseEnemyIntents27=resolveEnemyIntents;
resolveEnemyIntents=function(){const b=state.battle;if(b.intentsResolvedTurn===b.turn)return;const milling=b.enemyCreatures.filter(enemy=>enemyIntent(enemy).kind==='mill');baseEnemyIntents27();for(const enemy of milling){const moved=millLibrary27(enemy.millAmount||2);addLog(`${enemy.card.name} mills ${moved} cards from your library into your graveyard.`);}};
const baseDescriptions27=effectDescriptions;
effectDescriptions=function(card){
 if(card.name==='Booster Tutor')return['Open a seven-card booster and pause the current fight. Choose one card and put one copy into your hand.','Resume the same phase and response window. The unchosen cards stay outside the game. This does not add a card permanently to your run deck.','Exactly one Booster Tutor is included in every starting deck. It is not offered in ordinary packs or shops.'];
 if(card.name==='Brainstorm')return['Draw three cards, then choose two cards from your hand to put on top of your library in any order.','The first card you select will be drawn next. You may return cards that were already in your hand. This is not discarding.'];
 if(['Opt','Preordain','Serum Visions'].includes(card.name))return card.name==='Serum Visions'?['Draw one card, then scry 2. Choose which cards stay on top, their order, and which go to the bottom.']:[`Scry ${card.name==='Opt'?1:2}, then draw one card. Choose top or bottom before drawing.`];
 if(card.name==='Final Judgment')return['Exile every creature on both sides. This does not target, so Ward and Hexproof do not apply.','Equipment remains unattached. Auras leave with their hosts; Rancor returns to your hand. Exile is not a creature death.'];
 if(['Scour from Existence',"Iona's Judgment",'Angelic Edict'].includes(card.name))return[card.name==='Scour from Existence'?'Choose any permanent: creature, monster, enchantment, artifact or mana card.':'Choose a creature, monster or enchantment.', 'Exile the chosen permanent for this encounter. Enemy Hexproof prevents targeting; Ward requires a separate payment.'];
 const lines=baseDescriptions27(card);const ward=wardCost({card});if(ward&&rulesAudit(card).playable)lines.push(`Ward (${ward} mana): opposing targeted spells/abilities are countered unless their controller pays ${ward} extra mana.`);return lines;
};
const baseSummary27=draftAbilitySummary;
draftAbilitySummary=function(card){if(card.name==='Brainstorm')return'Draw 3, then put 2 cards from your hand on top in your chosen order.';if(card.name==='Booster Tutor')return'Pause the battle; open 7 cards, put 1 in hand, then resume.';if(['Opt','Preordain'].includes(card.name))return`Scry ${card.name==='Opt'?1:2}, then draw 1.`;if(card.name==='Serum Visions')return'Draw 1, then scry 2.';if(card.name==='Final Judgment')return'Exile all creatures on both sides. Does not target.';if(['Scour from Existence',"Iona's Judgment",'Angelic Edict'].includes(card.name))return card.name==='Scour from Existence'?'Exile any chosen permanent.':'Exile a chosen creature or enchantment.';return baseSummary27(card);};
collectionEntryMarkup=function(card,index,kind){if(card.enemyKind)return`<div class="collection-monster">${walkerPortrait(card.enemyKind)}<b>${escapeHtml(card.name)}</b><span>Exiled monster</span></div>`;const audit=rulesAudit(card);const seen=hasSeenCard(card);return`<article class="collection-entry"><button class="collection-card" data-preview-owner="collection" data-collection-index="${index}" aria-label="${card.count} copies of ${escapeHtml(card.name)}">${cardFace(card)}<span><b>${escapeHtml(card.name)}</b><strong>×${card.count}</strong></span></button><div class="collection-copy"><p class="collection-type">${escapeHtml(card.type_line)} · ${Math.ceil(card.cmc||0)} mana</p>${isCreature(card)?combatStats(card.power,card.toughness):''}<p class="catalog-keywords">${escapeHtml(displayKeywords(card).join(' · ')||'No printed keywords')}</p><p class="collection-rules-label">IN THIS GAME</p><ul class="collection-full-rules">${effectDescriptions(card).map(line=>`<li>${escapeHtml(line)}</li>`).join('')}</ul>${kind==='catalog'?`<p class="catalog-discovery ${seen?'is-seen':'is-unseen'}" data-discovery-status="${seen?'seen':'unseen'}">${seen?'✓ Seen':'◌ Not seen'}</p><p class="catalog-audit ${audit.playable?'':'catalog-banned'}">${audit.playable?card.name==='Booster Tutor'?'Start-deck card · one copy':'Playable · reviewed rules':'BANNED · '+escapeHtml(audit.reason)}</p>`:''}<details class="collection-printed"><summary>Printed rules</summary><p>${escapeHtml(card.oracle_text||'No rules text.')}</p></details>${kind==='catalog'?`<a class="catalog-source" href="${escapeHtml(card.uri)}" target="_blank" rel="noreferrer">Scryfall ↗</a>`:''}</div></article>`;};
function syncBoosterConfirm27(){const flow=state.boosterInterruption;if(!flow||state.screen!=='draft-screen')return;$('#draft-confirm').disabled=state.boosterSealed||Boolean(boosterTravel)||(flow.kind==='tutor'&&!state.selection.has(0));$('#pack-reroll').disabled=true;$('#selection-status').textContent=flow.kind==='shop'?`${draftAward61().count} cards · one copy each · already paid`:state.selection.has(0)?'Selected · confirm to resume the battle.':'Choose one card for your hand, then resume the battle.';}
const baseChooseCards27=chooseRandomCards;
chooseRandomCards=function(source,count){const cards=baseChooseCards27(source,count);const fallback=playableCards(BUNDLED_CARDS);return cards.map(card=>card.name==='Booster Tutor'?fallback[Math.floor(Math.random()*fallback.length)]:card);};
const baseStarterPacks27=makeStarterPacks;
makeStarterPacks=function(){return baseStarterPacks27().map(pack=>pack.map(card=>card.name==='Booster Tutor'?playableCards(BUNDLED_CARDS)[0]:card));};
const baseShowShop27=showShop;
showShop=function(){state.pool=playableCards(state.pool.length?state.pool:BUNDLED_CARDS);return baseShowShop27();};
// Su-Chi's death mana is a printed trigger, not an entry or exile effect.
SPECIAL_CREATURES.add('Su-Chi Cave Guard');
function suChiDeathMana27(unit,owner='player'){if(owner!=='player'||unit.card.name!=='Su-Chi Cave Guard'||unit.deathManaPaid27)return;unit.deathManaPaid27=true;const b=state.battle;b.floatingMana=(b.floatingMana||0)+8;syncMana(b);addLog('Su-Chi Cave Guard dies: add 8 generic mana until end of turn.');}
const baseDead27=removeDeadCreatures;
removeDeadCreatures=function(creatures,owner='player',clearDamage=false){const dead=creatures.filter(unit=>!creatureAlive(unit));const result=baseDead27(creatures,owner,clearDamage);for(const unit of dead)suChiDeathMana27(unit,owner);return result;};
const baseSacrifice27=sacrificeRuleCreature;
sacrificeRuleCreature=function(unit){const result=baseSacrifice27(unit);if(result)suChiDeathMana27(unit);return result;};
const baseSpellRemove27=removeSpellTarget;
removeSpellTarget=function(kind){const unit=choiceTargetUnit(state.battle.resolvingSpellTarget);const result=baseSpellRemove27(kind);if(kind==='destroy'&&unit)suChiDeathMana27(unit,unit.owner);return result;};
const sourceDescriptions27=effectDescriptions;
effectDescriptions=function(card){const lines=sourceDescriptions27(card);if(card.name==='Su-Chi Cave Guard')lines.push('When this creature dies, add 8 generic mana. It stays available through the remaining phases of this turn, then expires at cleanup.');return lines;};
const sourceSummary27=draftAbilitySummary;
draftAbilitySummary=function(card){return card.name==='Su-Chi Cave Guard'?'Dies: add 8 generic mana until end of turn.':sourceSummary27(card);};
// A targeted elite ability gives allied Ward a real purpose; combat and Mill never trigger it.
const sourceEnemyTeam27=createEnemyTeam;
createEnemyTeam=function(encounter){const team=sourceEnemyTeam27(encounter);for(const enemy of team)if(enemy.kind==='raider'){enemy.pattern=['attack','rune','attack','recover'];enemy.runeMana=1;}return team;};
const sourceIntent27=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1){if(enemy.pattern?.[(turn-1)%enemy.pattern.length]==='rune')return{kind:'rune',damage:0,label:'Rune bolt · 2 damage',icon:'✦'};return sourceIntent27(enemy,turn);};
const sourceIntents27=resolveEnemyIntents;
resolveEnemyIntents=function(){const b=state.battle;if(b.intentsResolvedTurn===b.turn)return;sourceIntents27();prepareEnemySpells38(b);};
const baseStartRun27=startNewRun;
startNewRun=function(){state.boosterInterruption=null;const b=state.battle;if(b){b.resolutionTask=null;b.wardTask=null;b.libraryOrder=null;b.interruption=false;b.deferredBeat=null;b.scryContinuation=null;}for(const id of ['ward-dialog','library-order-dialog']){const dialog=$('#'+id);if(dialog.open)dialog.close();}return baseStartRun27();};
for(const id of ['start-button','restart-button']){$('#'+id).removeEventListener('click',baseStartRun27);$('#'+id).addEventListener('click',startNewRun);}
