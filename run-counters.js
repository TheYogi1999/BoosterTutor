/* A purchased counter belongs to one physical creature card, for this run. */
const RUN_COUNTERS60 = {
 stats:{name:'+1/+1',price:15,symbol:'↑',description:'Permanently +1 power and +1 toughness this run.'},
 lifelink:{name:'Lifelink',price:20,symbol:'♥',description:'Its damage restores that much life to you.'},
 flying:{name:'Flying',price:18,symbol:'↟',description:'Can attack flying foes; evades ground blockers.'},
 deathtouch:{name:'Deathtouch',price:24,symbol:'◆',description:'Any combat damage it deals to a monster is lethal.'},
 toxic:{name:'Toxic 1',price:18,symbol:'☣',description:'Combat damage also gives the hit monster 1 poison counter.'},
 trample:{name:'Trample',price:15,symbol:'➶',description:'Excess combat damage reaches another legal monster.'},
 vigilance:{name:'Vigilance',price:17,symbol:'◇',description:'Attacking does not tap this creature.'},
 mystery:{name:'Mystery',price:14,symbol:'?',description:'A random run counter. Revealed only when applied.'},
 haste:{name:'Haste',price:15,symbol:'ϟ',description:'Can attack and tap for mana on its first turn.'}
};
state.nextRunCard60 = 1;
function activeRunCounters60(card) { return card?.finishRun59===state.finishRun59 ? card.runCounters60||[] : []; }
function physicalRunCopy60(card) {
 return {...card,runCardId60:`run-${state.finishRun59}-card-${state.nextRunCard60++}`,runCounters60:[...activeRunCounters60(card)]};
}
const baseMintCard60=runCard59;
runCard59=function(card){const copy=baseMintCard60(card);copy.runCounters60=[];return physicalRunCopy60(copy);};
const basePhysicalFinish60=copyPhysicalFinish59;
copyPhysicalFinish59=function(copied,physical){basePhysicalFinish60(copied,physical);copied.runCardId60=physical.runCardId60;copied.runCounters60=[...activeRunCounters60(physical)];};
function runCounterKey60(card){return [...activeRunCounters60(card)].sort().join(',');}
function runStatCount60(card){return activeRunCounters60(card).filter(kind=>kind==='stats').length;}
function runCounterLabels60(card){
 const counters=activeRunCounters60(card),stats=runStatCount60(card),toxic=counters.filter(kind=>kind==='toxic').length;
 return [...(stats?[`+${stats}/+${stats}`]:[]),...new Set(counters.filter(kind=>!['stats','toxic'].includes(kind)).map(kind=>RUN_COUNTERS60[kind].name)),...(toxic?[`Toxic ${toxic}`]:[])];
}
function runCounterMarkup60(card){const labels=runCounterLabels60(card);return labels.length?`<span class="run-counter-tags" title="Counters on this copy until this run ends">${labels.map(label=>`<span>${typeof keywordText61==='function'?keywordText61(label):escapeHtml(label)}</span>`).join('')}</span>`:'';}
const baseRunStats60=parseStats;
parseStats=function(card){const stats=baseRunStats60(card),n=runStatCount60(card);return {power:stats.power+n,toughness:stats.toughness+n};};
const baseRunKeywords60=creatureKeywords;
creatureKeywords=function(card){const result=baseRunKeywords60(card);for(const kind of activeRunCounters60(card))if(!['stats','toxic'].includes(kind))result[kind]=true;return result;};
const baseRunDisplay60=displayKeywords;
displayKeywords=function(card){return [...new Set([...baseRunDisplay60(card),...runCounterLabels60(card).filter(label=>!label.startsWith('+'))])];};
const baseRunFacts60=cardFactsMarkup;
cardFactsMarkup=function(card){return baseRunFacts60(card)+runCounterMarkup60(card);};
const baseRunDescription60=effectDescriptions;
effectDescriptions=function(card){const labels=runCounterLabels60(card);return [...baseRunDescription60(card),...(labels.length?[`Run counters on this copy: ${labels.join(' · ')}. These stay through every encounter and zone change until this run ends.`]:[])];};
const baseRunEntryMarkup60=collectionEntryMarkup;
collectionEntryMarkup=function(card,index,kind){const html=baseRunEntryMarkup60(card,index,kind);return kind==='catalog'?html:html.replace('</article>',`${runCounterMarkup60(card)}</article>`);};
const baseRunBonuses60=creatureBonuses;
creatureBonuses=function(creature,battle=state.battle){
 const bonuses=baseRunBonuses60(creature,battle),n=runStatCount60(creature.card);
 if(creature.rolledBase){bonuses.permanent.power=creature.power-creature.rolledBase.power-bonuses.temporary.power;bonuses.permanent.toughness=creature.toughness-creature.rolledBase.toughness-bonuses.temporary.toughness;}
 else{bonuses.permanent.power+=n;bonuses.permanent.toughness+=n;}
 return bonuses;
};
const baseRunCounterEntry60=onCreatureEntered;
onCreatureEntered=function(unit){
 // Elvish Impersonators sets its base directly from dice, bypassing parseStats.
 if(unit.rolledBase&&!unit.runStatsApplied60){const n=runStatCount60(unit.card);unit.power+=n;unit.toughness+=n;unit.runStatsApplied60=true;}
 return baseRunCounterEntry60(unit);
};
const baseRunCounterEffect60=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const unit=effect.kind==='double-counters'?choiceTargetUnit(target,state.battle):null;
 const runCounters=unit?runStatCount60(unit.card):0;
 const result=baseRunCounterEffect60(effect,target,context);
 // Doubling counts the purchased counters too; the newly created counters
 // belong to this battlefield object, rather than upgrading the run card.
 if(runCounters)baseRunCounterEffect60({kind:'counter',amount:runCounters},target,context);
 return result;
};
const baseRunFilters60=matchesCardFilters;
matchesCardFilters=function(card,query=''){const keywords=activeRunCounters60(card).filter(kind=>kind!=='stats');return baseRunFilters60(keywords.length?{...card,keywords:[...new Set([...printedKeywords(card),...keywords])]}:card,query);};
function ensurePhysicalDeck60(){
 const seen=new Set();
 state.deck.forEach((card,index)=>{
  if(!card.runCardId60||card.finishRun59!==state.finishRun59)state.deck[index]=runCard59(card);
  else if(seen.has(card.runCardId60))state.deck[index]=physicalRunCopy60(card);
  seen.add(state.deck[index].runCardId60);
 });
}
function canReceiveRunCounter60(card,kind){
 if(!card||!RUN_COUNTERS60[kind]||!isCreature(card))return false;
 return ['stats','toxic','mystery'].includes(kind)||!hasCreatureKeyword(creatureKeywords(card),kind);
}
function counterShopTargets60(kind){return state.deck.filter(card=>canReceiveRunCounter60(card,kind));}
function resolveMysteryCounter61(card){
 const choices=Object.keys(RUN_COUNTERS60).filter(kind=>kind!=='mystery'&&canReceiveRunCounter60(card,kind));
 return choices.length?choices[Math.floor(Math.random()*choices.length)]:null;
}
function renderCounterOffers60(){
 const shop=state.shop;if(!shop)return;
 if(!shop.counters60)shop.counters60=shuffle(Object.keys(RUN_COUNTERS60)).slice(0,3).map(kind=>({kind,sold:false}));
 $('#shop-counter-grid').innerHTML=shop.counters60.map((offer,index)=>{
  const type=RUN_COUNTERS60[offer.kind],legal=counterShopTargets60(offer.kind).length>0;
  return `<article class="counter-offer${offer.sold?' sold':''}"><span class="counter-icon" aria-hidden="true">${type.symbol}</span><div><b>${typeof keywordText61==='function'?keywordText61(type.name):type.name}</b><small>${type.description}</small></div><button type="button" class="quiet-button" data-buy-counter="${index}" ${offer.sold||!legal||(state.coins||0)<type.price?'disabled':''}>${offer.sold?'SOLD':!legal?'No target':`${type.price} coins`}</button></article>`;
 }).join('');
}
const baseCounterShop60=renderShop;
renderShop=function(){ensurePhysicalDeck60();const result=baseCounterShop60();renderCounterOffers60();return result;};
function closeCounterShop60(){state.counterPurchase60=null;const dialog=$('#counter-shop-dialog');if(dialog.open)dialog.close();}
function openCounterShop60(index){
 const shop=state.shop,offer=shop?.counters60?.[index],type=RUN_COUNTERS60[offer?.kind];
 if(state.screen!=='shop-screen'||!type||offer.sold||(state.coins||0)<type.price||document.querySelector('dialog[open]')||state.boosterInterruption)return false;
 ensurePhysicalDeck60();if(!counterShopTargets60(offer.kind).length)return false;
 state.counterPurchase60={shop,offer,index,selected:null,run:state.finishRun59};
 hideCardPreview();renderCounterShop60();$('#counter-shop-dialog').showModal();return true;
}
function validCounterPurchase60(){const p=state.counterPurchase60;return Boolean(p&&p.shop===state.shop&&p.shop.node===state.node&&p.shop.counters60[p.index]===p.offer&&!p.offer.sold&&p.run===state.finishRun59&&state.screen==='shop-screen');}
function renderCounterShop60(){
 if(!validCounterPurchase60()){closeCounterShop60();return;}
 const p=state.counterPurchase60,type=RUN_COUNTERS60[p.offer.kind],cards=state.deck.filter(isCreature),counts=new Map(),copies=new Map();
 cards.forEach(card=>counts.set(card.name,(counts.get(card.name)||0)+1));
 $('#counter-shop-title').textContent=`${type.name} counter · ${type.price} coins`;
 $('#counter-shop-note').textContent=`${type.description} Choose exactly one physical copy. Your other copies stay unchanged.`;
 $('#counter-shop-grid').innerHTML=cards.map(card=>{
  const number=(copies.get(card.name)||0)+1;copies.set(card.name,number);const legal=canReceiveRunCounter60(card,p.offer.kind),stats=parseStats(card);
  return `<button type="button" data-counter-pick="${escapeHtml(card.runCardId60)}" aria-pressed="${p.selected===card.runCardId60}" ${legal?'':'disabled'} class="${p.selected===card.runCardId60?'selected':''}"><span class="counter-card-face">${cardFace(card)}</span><b>${escapeHtml(card.name)}</b><small>Copy ${number} / ${counts.get(card.name)} · ${stats.power}/${stats.toughness}${isFoilCard59(card)?' · Foil':''}</small>${runCounterMarkup60(card)}${legal?'':'<small>Already has this ability</small>'}</button>`;
 }).join('');
 const selected=state.deck.find(card=>card.runCardId60===p.selected),affordable=(state.coins||0)>=type.price;
 $('#counter-shop-confirm').disabled=!affordable||!canReceiveRunCounter60(selected,p.offer.kind);
 $('#counter-shop-confirm').textContent=`Apply ${type.name} · ${type.price} coins`;
 $('#counter-shop-status').textContent=!affordable?'Not enough coins.':selected?`${selected.name}: only this copy gains the counter.`:'Choose a card. Nothing is charged until you confirm.';
}
function confirmCounterShop60(){
 if(!validCounterPurchase60()){closeCounterShop60();return false;}
 const p=state.counterPurchase60,type=RUN_COUNTERS60[p.offer.kind],card=state.deck.find(card=>card.runCardId60===p.selected);
 if((state.coins||0)<type.price||!canReceiveRunCounter60(card,p.offer.kind)){renderCounterShop60();return false;}
 const kind=p.offer.kind==='mystery'?resolveMysteryCounter61(card):p.offer.kind;
 if(!kind)return false;
 p.offer.sold=true;p.offer.appliedKind61=kind;state.coins-=type.price;(card.runCounters60||=[]).push(kind);
 const mystery=p.offer.kind==='mystery';
 closeCounterShop60();renderShop();playSfx('select');
 if(mystery)showCounterReveal61(card,kind);else showToast(`${type.name} added to one copy of ${card.name} for this run.`);return true;
}
$('#shop-counter-grid').addEventListener('click',event=>{const button=event.target.closest('[data-buy-counter]');if(button)openCounterShop60(Number(button.dataset.buyCounter));});
$('#counter-shop-grid').addEventListener('click',event=>{const button=event.target.closest('[data-counter-pick]'),p=state.counterPurchase60;if(!button||!validCounterPurchase60())return;const card=state.deck.find(card=>card.runCardId60===button.dataset.counterPick);if(!canReceiveRunCounter60(card,p.offer.kind))return;p.selected=card.runCardId60;renderCounterShop60();});
$('#counter-shop-confirm').addEventListener('click',confirmCounterShop60);
for(const id of ['counter-shop-close','counter-shop-cancel'])$('#'+id).addEventListener('click',closeCounterShop60);
$('#counter-shop-dialog').addEventListener('cancel',event=>{event.preventDefault();closeCounterShop60();});
$('#counter-shop-dialog').addEventListener('close',()=>{if(!$('#counter-shop-dialog').open)state.counterPurchase60=null;});
const baseCounterScreen60=showScreen;
showScreen=function(id){if(id!=='shop-screen')closeCounterShop60();return baseCounterScreen60(id);};
