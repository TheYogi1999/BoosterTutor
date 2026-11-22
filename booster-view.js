/* v0.102 — one landscape row, compact controls and an intact foil wrapper. */
(()=>{
 const draft=$('#draft-screen'),heading=draft.querySelector('.screen-heading'),copy=heading.firstElementChild,actions=heading.querySelector('.scene-actions99');
 const meta=document.createElement('div');meta.className='draft-meta102';meta.append($('#draft-instruction'),draft.querySelector('.deck-counter'));copy.append(meta);actions.prepend($('#pack-reroll'));
 function labels(){const used=Boolean(state.rerolledPacks?.has(state.activePack||0)),button=$('#pack-reroll'),badge=button.querySelector('.input-action-hint79');button.replaceChildren(document.createTextNode(used?'Rerolled':'↻ Reroll'));if(badge)button.append(badge);button.setAttribute('aria-label',used?'Pack reroll already used':'Reroll this pack · one reroll available');}
 function fitCards(){
  if(state.screen!=='draft-screen'||!matchMedia('(orientation:landscape)').matches)return;
  const row=draft.querySelector('.booster-cards');if(!row)return;
  const s=getComputedStyle(row),space=$('#draft-grid').clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);let height=190*680/488;
  for(const card of row.querySelectorAll('.draft-option')){
   const summary=card.querySelector('.draft-card-summary'),cost=summary?.children[1]?.querySelector('b');
   if(cost){cost.classList.add('mana-mini102');cost.dataset.manaValue=Math.ceil(previewCardFor(card)?.cmc||0);cost.setAttribute('aria-label',cost.dataset.manaValue+' generic mana');}
   height=Math.min(height,space-card.querySelector('.draft-card-name').offsetHeight-(summary?.offsetHeight||0)-2*(parseFloat(getComputedStyle(card).rowGap)||0)-6);
  }
  draft.style.setProperty('--draft-art102',Math.max(24,height)+'px');
 }
 const baseDraft=renderDraft;renderDraft=function(){const result=baseDraft();labels();fitCards();return result;};
 new ResizeObserver(fitCards).observe($('#draft-grid'));window.addEventListener('resize',fitCards);document.fonts?.ready.then(fitCards);
 const dialog=document.createElement('dialog');dialog.id='booster-card-dialog102';dialog.setAttribute('aria-labelledby','booster-card-title102');dialog.innerHTML='<header><span class="eyebrow">CARD DETAILS</span><button type="button" class="graveyard-close" aria-label="Close card details">×</button></header><div class="booster-detail-body102"></div>';document.body.append(dialog);
 let press=null,suppress=false;
 function cancel(){if(press)clearTimeout(press.timer);press=null;}
 function inspect(element){
  const card=element&&previewCardFor(element);if(!card||state.screen!=='draft-screen'||boosterTravel||document.querySelector('dialog[open]'))return;
  hideCardPreview();const stats=isCreature(card)?parseStats(card):null;
  dialog.querySelector('.booster-detail-body102').innerHTML=`<div class="booster-detail-art102">${cardFace(card)}</div><div><h2 id="booster-card-title102">${escapeHtml(card.name)}</h2><p>${escapeHtml(card.type_line)} · ${Math.ceil(card.cmc||0)} generic mana</p>${stats?combatStats(stats.power,stats.toughness):''}<div class="booster-detail-rules102">${effectDescriptions(card).map(line=>`<p>${keywordText61(line)}</p>`).join('')}</div></div>`;
  dialog.showModal();dialog.querySelector('button').focus({preventScroll:true});
 }
 draft.addEventListener('pointerdown',event=>{suppress=false;cancel();const element=event.target.closest('.draft-option');if(!element||event.button!==0||boosterTravel)return;press={element,x:event.clientX,y:event.clientY,timer:setTimeout(()=>{if(press?.element===element){suppress=true;inspect(element);cancel();}},440)};},true);
 document.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>8)cancel();},true);
 document.addEventListener('pointerup',cancel,true);document.addEventListener('pointercancel',cancel,true);
 draft.addEventListener('click',event=>{if(suppress&&event.detail>0&&event.target.closest('.draft-option')){suppress=false;event.preventDefault();event.stopImmediatePropagation();}},true);
 draft.addEventListener('contextmenu',event=>{const card=event.target.closest('.draft-option');if(card){event.preventDefault();cancel();inspect(card);}});
 draft.addEventListener('keydown',event=>{if(event.code==='KeyI'||event.key==='ContextMenu'){const card=event.target.closest('.draft-option');if(card){event.preventDefault();cancel();inspect(card);}}});
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 const baseInspect=controller.inspect.bind(controller);controller.inspect=function(){if(state.screen==='draft-screen'){this.reconcile();const card=this.focused?.closest('.draft-option');if(card){cancel();inspect(card);return;}}return baseInspect();};
 const baseScreen=showScreen;showScreen=function(id){cancel();suppress=false;if(id!=='draft-screen'&&dialog.open)dialog.close();document.documentElement.classList.toggle('booster-view102',id==='draft-screen');const result=baseScreen(id);fitCards();return result;};
 window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();if(dialog.open)dialog.close();}});
 labels();fitGameCanvas();
})();
