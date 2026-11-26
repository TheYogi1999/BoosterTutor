/* v0.108 — complete card choices and compact portrait phase labels. */
(()=>{
 const shopDialog=$('#counter-shop-dialog'),shopStatus=$('#counter-shop-status');
 shopDialog.classList.add('upgrade-picker108');$('#counter-shop-grid').classList.add('upgrade-grid108');
 shopDialog.querySelector('footer').prepend(shopStatus);
 const baseOpenCounter=openCounterShop60;
 openCounterShop60=function(index){const result=baseOpenCounter(index);if(result){$('#counter-shop-grid').scrollTop=0;$('#counter-shop-grid').scrollLeft=0;}return result;};

 const picker=document.createElement('dialog');picker.id='route-upgrade-dialog108';picker.className='upgrade-picker108';
 picker.setAttribute('aria-labelledby','route-upgrade-title108');picker.setAttribute('aria-describedby','route-upgrade-note108');
 picker.innerHTML='<header><div><span class="eyebrow">ONE PHYSICAL COPY</span><h2 id="route-upgrade-title108">Choose a creature</h2></div><button type="button" id="route-upgrade-close108" class="graveyard-close" aria-label="Close creature selection">×</button></header><p id="route-upgrade-note108">Choose the copy to receive +1/+1. Pay 8 coins only when you confirm the encounter.</p><div id="route-upgrade-grid108" class="upgrade-grid108"></div><footer><p id="route-upgrade-status108" role="status">Select a card to return to the runesmith.</p><button type="button" class="quiet-button" id="route-upgrade-cancel108">Cancel</button></footer>';
 document.body.append(picker);
 const choose=document.createElement('button');choose.id='route-upgrade-pick108';choose.type='button';choose.hidden=true;choose.setAttribute('aria-haspopup','dialog');$('#route-target106').after(choose);
 let context=null;
 const valid=()=>Boolean(context&&validRoute106(context.ticket)&&state.routePending106.event&&state.routePending106.selected==='rune'&&routeEvent106(state.node)==='forge');
 function close(){if(picker.open)picker.close();context=null;}
 choose.addEventListener('click',()=>{
  const p=state.routePending106;if(!validRoute106()||!p.event||p.selected!=='rune'||routeEvent106(p.node)!=='forge'||document.querySelector('dialog[open]'))return;
  context={ticket:p.id};const cards=state.deck.filter(isCreature),counts=new Map(),copies=new Map();
  for(const card of cards)counts.set(card.name,(counts.get(card.name)||0)+1);
  $('#route-upgrade-grid108').innerHTML=cards.map(card=>{
   const number=(copies.get(card.name)||0)+1;copies.set(card.name,number);const stats=parseStats(card),labels=runCounterLabels60(card).join(', '),selected=$('#route-target106').value===card.runCardId60;
   return `<button type="button" data-upgrade-pick108="${escapeHtml(card.runCardId60)}" data-ticket108="${p.id}" aria-label="${escapeHtml(card.name)} · copy ${number} of ${counts.get(card.name)}${labels?' · '+escapeHtml(labels):''}" aria-pressed="${selected}" class="${selected?'selected':''}" title="${escapeHtml(card.name)}${labels?' · '+escapeHtml(labels):''}"><span class="counter-card-face">${cardFace(card)}</span><b>${escapeHtml(card.name)}</b><small>Copy ${number}/${counts.get(card.name)} · ${stats.power}/${stats.toughness}</small>${runCounterMarkup60(card)}</button>`;
  }).join('');
  hideCardPreview();picker.showModal();$('#route-upgrade-grid108').scrollTop=0;$('#route-upgrade-grid108').scrollLeft=0;controller.dirty=true;
 });
 $('#route-upgrade-grid108').addEventListener('click',event=>{
  const button=event.target.closest('[data-upgrade-pick108]');if(!button||!valid()||Number(button.dataset.ticket108)!==context.ticket)return;
  const card=state.deck.find(c=>c.runCardId60===button.dataset.upgradePick108&&isCreature(c));if(!card)return;
  $('#route-target106').value=card.runCardId60;close();renderRoute106();choose.focus({preventScroll:true});
 });
 for(const id of ['route-upgrade-close108','route-upgrade-cancel108'])$('#'+id).addEventListener('click',close);
 picker.addEventListener('cancel',()=>{context=null;});picker.addEventListener('close',()=>{if(!picker.open)context=null;});
 const baseRoute=renderRoute106;
 renderRoute106=function(){
  const result=baseRoute(),p=state.routePending106,target=$('#route-target106');target.hidden=true;
  choose.hidden=!(p?.event&&p.selected==='rune'&&routeEvent106(p.node)==='forge');
  const card=state.deck.find(c=>c.runCardId60===target.value&&isCreature(c));
  choose.innerHTML=card?`<span class="route-chosen-art108">${cardFace(card)}</span><span><b>${escapeHtml(card.name)}</b><small>${parseStats(card).power}/${parseStats(card).toughness} · selected copy · change</small></span>`:'<span><b>Choose a creature card</b><small>View the cards in your deck</small></span>';
  if(picker.open&&!valid())close();controller.dirty=true;return result;
 };
 const baseScreen=showScreen;
 showScreen=function(id){if(id!=='route-screen')close();return baseScreen(id);};

 function phaseLabels(){
  const extra=Boolean(state.battle?.combatOnly103),short={main:extra?'Extra':'Main',attack:'Attack',enemy:'Enemy',blocks:'Block',damage:'Damage'};
  for(const step of document.querySelectorAll('#phase-strip [data-phase]')){
   const info=phaseInfo(step.dataset.phase),label=extra&&info.id==='main'?'Extra combat · declare attackers':info.label;
   if(!step.querySelector('.phase-short108')||step.dataset.label108!==label){
    const number=extra&&info.id==='main'?'+':COMBAT_PHASES.findIndex(p=>p.id===info.id)+1;
    step.innerHTML=`<span>${number}</span><b class="phase-full108">${escapeHtml(label)}</b><b class="phase-short108" aria-hidden="true">${short[info.id]}</b>`;
    step.dataset.label108=label;step.title=label+' · '+info.description;step.setAttribute('aria-label',label+' · '+info.description);
   }
  }
 }
 const basePhase=updatePhaseDisplay;
 updatePhaseDisplay=function(){const result=basePhase();phaseLabels();return result;};
 const baseBattle=renderBattle;
 renderBattle=function(){const result=baseBattle();phaseLabels();return result;};
})();
