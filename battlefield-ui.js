/* v0.97 — one battlefield, adaptive combat canvas, explicit long-press inspection. */
const battlefieldUI97=(()=>{
 const root=document.documentElement,combat=$('#combat-screen'),field=combat.querySelector('.arena-table');
 const toolbar=combat.querySelector('.combat-topline'),hand=combat.querySelector('.hand-panel'),library=hand.querySelector('.library-zone');
 const utility=combat.querySelector('.battle-utility-stack'),grave=utility.querySelector('.table-graveyard'),actions=utility.querySelector('.combat-actions-panel');
 field.prepend(toolbar);field.append(hand,library,grave,actions);utility.remove();
 const system=document.createElement('div');system.className='battle-system97';toolbar.append(system);system.append($('#quit-button'));
 const controls=['options-button','music-settings'].map(id=>{const node=$('#'+id),marker=document.createComment('home-'+id);node.before(marker);return{node,marker};});
 // Matching physical zones, with an actual Exile pile beside Library and Graveyard.
 const piles=document.createElement('div');piles.className='battle-piles98';field.append(piles);piles.append(library,grave);toolbar.append(actions);
 library.classList.add('battle-pile98');grave.classList.add('battle-pile98');
 const graveCount=$('#graveyard-count'),exileCount=$('#exile-count'),exileButton=$('#exile-button');
 $('#graveyard-button').replaceChildren(document.createTextNode('Graveyard'));exileButton.replaceChildren(document.createTextNode('Exile'));
 const graveCaption=document.createElement('div');graveCaption.className='pile-count98';graveCaption.append(graveCount);graveCaption.insertAdjacentHTML('beforeend','<small>cards</small>');grave.append(graveCaption);
 const exile=document.createElement('section');exile.className='exile-zone98 battle-pile98';exile.setAttribute('aria-label','Exile');
 const exileHeading=document.createElement('div');exileHeading.className='pile-heading98';exileHeading.append(exileButton);
 const exileFace=document.createElement('button');exileFace.type='button';exileFace.id='exile-pile98';exileFace.className='pile-face98';exileFace.setAttribute('aria-label','Inspect exiled cards');exileFace.addEventListener('click',()=>exileButton.click());
 const exileCaption=document.createElement('div');exileCaption.className='pile-count98';exileCaption.append(exileCount);exileCaption.insertAdjacentHTML('beforeend','<small>cards</small>');exile.append(exileHeading,exileFace,exileCaption);piles.append(exile);
 const stack=library.querySelector('.library-stack'),layers=document.createElement('span'),emptyDeck=document.createElement('span');layers.className='library-depth98';layers.setAttribute('aria-hidden','true');emptyDeck.className='pile-empty98';emptyDeck.setAttribute('aria-hidden','true');emptyDeck.textContent='◇';stack.prepend(layers);stack.append(emptyDeck);
 let pileSignature98='';
 function renderPiles98(b=state.battle){
  if(!b)return;const count=libraryCardCount49(b),depth=count>1?24*(1-Math.exp(-(count-1)/55)):0,layerCount=Math.min(14,Math.ceil(Math.max(0,count-1)/5));
  library.dataset.remaining98=String(count);stack.style.setProperty('--deck-depth98',depth.toFixed(3)+'px');stack.style.setProperty('--deck-side98',(depth*.12).toFixed(3)+'px');$('#library-button').classList.toggle('is-empty',count===0);
  if(layers.childElementCount!==layerCount)layers.innerHTML=Array.from({length:layerCount},(_,i)=>`<i style="--sheet98:${(i+1)/Math.max(1,layerCount)}"></i>`).join('');
  const cards=[...(b.exile||[]),...(b.enemyExile||[])],card=cards.at(-1),signature=card?`${card.id}:${card.enemyKind||''}:${isFoilCard59(card)}:${runCounterKey60(card)}`:'empty';
  if(signature!==pileSignature98){pileSignature98=signature;exileFace.innerHTML=card?card.enemyKind?`<span class="exile-foe98 collection-monster">${walkerPortrait(card.enemyKind)}</span>`:cardFace(card):'<span class="pile-empty98" aria-hidden="true">✧</span>';}
  exileFace.setAttribute('aria-label',`Inspect Exile · ${cards.length} cards${card?', top: '+card.name:''}`);exileFace.disabled=exileButton.disabled;
 }
 const oldInspector=combat.querySelector('.card-inspector'),content=$('#inspector-content');oldInspector.remove();
 const inspector=document.createElement('dialog');inspector.id='card-inspect-dialog97';inspector.className='floating-card-inspector97';inspector.setAttribute('aria-labelledby','card-inspect-name97');
 inspector.innerHTML='<header><div><span class="eyebrow">CARD DETAILS</span><h2 id="card-inspect-name97"></h2></div><button id="card-inspect-close97" class="graveyard-close" aria-label="Close card details">×</button></header>';
 inspector.append(content);document.body.append(inspector);
 let held=null,inspection=null,eatClickUntil=0;
 function cancelHold(){if(held)clearTimeout(held.timer);held=null;}
 function closeInspect(){inspection=null;state.inspectedId=null;if(inspector.open)inspector.close();}
 function unitFor(element,b=state.battle){const id=element?.dataset.previewId||element?.dataset.enemyAttacker;return b&&[...b.creatures,...b.enemyCreatures,...b.permanents,...b.lands].find(u=>u.id===id);}
 function placeInspector(){
  if(!inspector.open)return;const box=inspector.getBoundingClientRect(),anchor=inspection?.element?.getBoundingClientRect();
  const area=typeof safeGameViewport102==='function'?safeGameViewport102():{left:0,top:0,width:innerWidth,height:innerHeight},margin=12,right=area.left+area.width,bottom=area.top+area.height;let x=area.left+(area.width-box.width)/2,y=area.top+(area.height-box.height)/2;
  if(anchor&&area.width>780){x=anchor.right+18;if(x+box.width>right-margin)x=anchor.left-box.width-18;if(x<area.left+margin)x=area.left+(area.width-box.width)/2;y=anchor.top+anchor.height/2-box.height/2;}
  inspector.style.setProperty('left',Math.max(area.left+margin,Math.min(right-box.width-margin,x))+'px','important');inspector.style.setProperty('top',Math.max(area.top+margin,Math.min(bottom-box.height-margin,y))+'px','important');
 }
 function fillInspector(card,element){
  const b=state.battle,u=unitFor(element),enemy=u?.owner==='enemy',permanent=b?.permanents.includes(u),attached=permanent?b.creatures.find(c=>c.id===u.attachedTo):null;
  $('#card-inspect-name97').textContent=card.name;
  const portrait=enemy?(element?.isConnected?element.querySelector('.walker-portrait'):null)||document.querySelector(`[data-enemy-attacker="${u.id}"] .walker-portrait`):null;
  let art=cardFace(card);
  if(portrait){const s=getComputedStyle(portrait);art=`<div class="inspect-foe97" role="img" aria-label="${escapeHtml(card.name)}" style="background-image:${escapeHtml(s.backgroundImage)};background-size:${escapeHtml(s.backgroundSize)};background-position:${escapeHtml(s.backgroundPosition)}"></div>`;}
  const keywords=u&&isCreature(card)?creatureKeywordLabels(u):displayKeywords(card).join(' · ');
  const status=u&&isCreature(card)?`${u.power} power · ${enemy?u.health+' life':u.toughness+' toughness'}${u.damage?' · '+u.damage+' damage':''}${u.tapped?' · tapped':''}`:'';
  const cost=enemy?'ENEMY':Math.ceil(card.cmc||0)+' generic mana';
  const lines=enemy?[enemyIntent(u,b.turn).label,...effectDescriptions(card)]:[...effectDescriptions(card)];
  if(permanent&&u.card.name==='The One Ring')lines.unshift(`${u.burden95||0} burden counters · ${u.tapped?'tapped':'untapped'}.`);
  if(attached)lines.unshift('Attached to '+attached.card.name+'.');
  content.innerHTML=`<div class="inspect-art97">${art}</div><div class="inspect-copy97"><p class="inspect-meta97">${escapeHtml(cost)} · ${escapeHtml(card.type_line||'')}</p>${status?`<p class="inspect-live97">${escapeHtml(status)}</p>`:''}${keywords?`<p class="inspect-keywords97">${keywordText61(keywords)}</p>`:''}<div class="inspect-rules97" tabindex="0" aria-label="Card rules and effects">${lines.map(line=>`<p>${keywordText61(line)}</p>`).join('')}</div></div>`;
 }
 function openInspect(card,element){
  if(!card||!element||state.screen!=='combat-screen'||document.hidden||document.querySelector('dialog[open]'))return false;
  hideCardPreview();if(pointerDrag)finishDrag();
  inspection={card,element,battle:state.battle,owner:element.dataset.previewOwner,id:element.dataset.previewId};state.inspectedId=null;
  fillInspector(card,element);inspector.showModal();placeInspector();$('#card-inspect-close97').focus({preventScroll:true});return true;
 }
 function fitDialog(dialog){if(state.screen!=='combat-screen'||dialog===inspector||dialog.id==='dice-roll-dialog'||dialog.classList.contains('token-action-dialog'))return;const area=typeof safeGameViewport102==='function'?safeGameViewport102():{width:innerWidth,height:innerHeight},scale=Math.min(1,(area.width-24)/(dialog.offsetWidth||1120),(area.height-24)/(dialog.offsetHeight||720));dialog.style.setProperty('--battle-dialog-scale97',String(scale));}
 const baseModal97=HTMLDialogElement.prototype.showModal;
 HTMLDialogElement.prototype.showModal=function(...args){const result=baseModal97.apply(this,args);fitDialog(this);return result;};
 function sync(){
  const active=state.screen==='combat-screen';root.classList.toggle('battle-ui97',active);
  for(const {node,marker} of controls)if(active){if(node.parentElement!==system)system.prepend(node);}else if(node.previousSibling!==marker)marker.after(node);
  const home=$('#battle-title-return97');if(home)home.hidden=!active;
  if(!active){cancelHold();closeInspect();}
 }
 const baseFit=fitGameCanvas;
 fitGameCanvas=function(){
  baseFit();sync();if(state.screen!=='combat-screen'){root.classList.remove('battle-tall97','battle-compact98');return;}
  const viewport=window.visualViewport,use=viewport&&Math.abs(viewport.scale-1)<.01,safe=typeof safeGameViewport102==='function'?safeGameViewport102():null,w=safe?.width??(use?viewport.width:innerWidth),h=safe?.height??(use?viewport.height:innerHeight),ratio=w/h,tall=ratio<.85;
  if(safe){root.style.setProperty('--game-center-x',safe.left+w/2+'px');root.style.setProperty('--game-center-y',safe.top+h/2+'px');root.style.setProperty('--usable-width102',w+'px');root.style.setProperty('--usable-height102',h+'px');}
  const width=tall?880:Math.max(1200,ratio*900),height=tall?Math.max(1280,880/ratio):width/ratio;
  root.classList.toggle('battle-tall97',tall);root.classList.toggle('battle-compact98',!tall&&width<1450);root.style.setProperty('--battle-width97',width+'px');root.style.setProperty('--battle-height97',height+'px');
  root.style.setProperty('--game-scale',Math.min(w/width,h/height));field.style.setProperty('--throw-distance97',(field.clientWidth/2+420)+'px');root.style.setProperty('--battle-dialog-scale97',Math.min((w-20)/1120,(h-20)/720));
  requestAnimationFrame(()=>{fitHand();drawCombatArrows();for(const dialog of document.querySelectorAll('dialog[open]'))fitDialog(dialog);placeInspector();});
 };
 const baseFitHand=fitHand;
 fitHand=function(){if(state.screen!=='combat-screen')return baseFitHand();const row=$('#hand-row'),cards=row.querySelectorAll('.hand-card'),width=cards[0]?.offsetWidth||140;row.style.setProperty('--hand-step',Math.min(104,Math.max(12,(row.clientWidth-width-12)/Math.max(1,cards.length-1)))+'px');};
 const basePreview=showCardPreview,baseInspect=inspectBattlefieldCard;
 showCardPreview=function(card,element){if(state.screen==='combat-screen'&&(inspector.open||element?.dataset.previewOwner!=='hand')){hideCardPreview();return;}return basePreview(card,element);};
 inspectBattlefieldCard=function(card,element){if(state.screen!=='combat-screen')return baseInspect(card,element);state.inspectedId=null;if(inspector.open&&inspection?.id===element?.dataset.previewId)fillInspector(card,inspection.element);};
 const baseBattle=renderBattle;
 renderBattle=function(){const result=baseBattle();renderPiles98();for(const node of combat.querySelectorAll('[data-enemy-attacker]')){node.dataset.previewOwner='enemy';node.dataset.previewId=node.dataset.enemyAttacker;}fitHand();if(inspector.open&&inspection){const u=unitFor(inspection.element),handIndex=inspection.owner==='hand'?state.battle.hand.indexOf(inspection.card):-1;if(inspection.battle!==state.battle||(inspection.id&&!u)||(inspection.owner==='hand'&&handIndex<0))closeInspect();else{const current=inspection.id?combat.querySelector(`[data-preview-id="${inspection.id}"][data-preview-owner="${inspection.owner}"]`):handIndex>=0?combat.querySelector(`[data-hand-index="${handIndex}"]`):null;if(current)inspection.element=current;fillInspector(u?.card||inspection.card,inspection.element);}}return result;};
 const baseScreen=showScreen;
 showScreen=function(id){if(id!=='combat-screen'){cancelHold();closeInspect();}const result=baseScreen(id);fitGameCanvas();return result;};
 const baseDiceLock97=lockDiceBattlefield53;
 lockDiceBattlefield53=function(job){baseDiceLock97(job);for(const node of field.querySelectorAll('.library-zone,.combat-actions-panel,.exile-zone98'))if(!job.lockedUI.some(entry=>entry.node===node)){job.lockedUI.push({node,inert:node.inert});node.inert=true;}};
 const baseControllerZone=controller.zone.bind(controller);
 controller.zone=function(element){if(element?.closest('.battle-system97'))return'system';if(element?.closest('.library-zone,.table-graveyard,.exile-zone98,.combat-actions-panel,.hand-heading'))return'actions';return baseControllerZone(element);};
 const baseControllerInspect=controller.inspect.bind(controller);
 controller.inspect=function(){this.reconcile();const element=this.focused;if(state.screen!=='combat-screen')return baseControllerInspect();if(element?.dataset.enemyAttacker){element.dataset.previewOwner='enemy';element.dataset.previewId=element.dataset.enemyAttacker;}const card=element?.dataset.previewOwner?previewCardFor(element):null;if(card)openInspect(card,element);};
 $('#card-inspect-close97').addEventListener('click',closeInspect);
 inspector.addEventListener('cancel',event=>{event.preventDefault();closeInspect();});
 inspector.addEventListener('close',()=>{inspection=null;state.inspectedId=null;controller.dirty=true;controller.reconcile();});
 inspector.addEventListener('click',event=>{const r=inspector.getBoundingClientRect();if(event.target===inspector&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))closeInspect();});
 document.addEventListener('pointerdown',event=>{
  eatClickUntil=0;
  if(event.button!==0||state.screen!=='combat-screen'||event.target.closest('dialog'))return;
  cancelHold();const element=event.target.closest('[data-preview-owner]'),card=element?previewCardFor(element):null;if(!card)return;
  const press={element,card,pointer:event.pointerId,x:event.clientX,y:event.clientY,battle:state.battle,opened:false,timer:0};held=press;
  press.timer=setTimeout(()=>{if(held!==press||!element.isConnected||press.battle!==state.battle||pointerDrag?.active)return;press.opened=openInspect(card,element);if(press.opened)state.suppressClickUntil=Date.now()+800;},440);
 },true);
 document.addEventListener('pointermove',event=>{if(held&&!held.opened&&Math.hypot(event.clientX-held.x,event.clientY-held.y)>8)cancelHold();},true);
 document.addEventListener('pointerup',event=>{if(!held||event.pointerId!==held.pointer)return;const opened=held.opened;cancelHold();if(opened){eatClickUntil=Date.now()+180;state.suppressClickUntil=Date.now()+40;event.preventDefault();event.stopImmediatePropagation();}},true);
 document.addEventListener('pointercancel',cancelHold,true);
 document.addEventListener('click',event=>{if(Date.now()<eatClickUntil){event.preventDefault();event.stopImmediatePropagation();eatClickUntil=0;}},true);
 document.addEventListener('contextmenu',event=>{const element=event.target.closest('[data-preview-owner]');if(state.screen==='combat-screen'&&element&&!event.target.closest('dialog')){event.preventDefault();cancelHold();openInspect(previewCardFor(element),element);}});
 document.addEventListener('keydown',event=>{if(event.code==='Escape')cancelHold();if(state.screen==='combat-screen'&&(event.code==='KeyI'||event.key==='ContextMenu'||event.shiftKey&&event.key==='F10')&&!event.target.matches('input,textarea,select')){const element=document.activeElement?.closest('[data-preview-owner]');if(element){event.preventDefault();openInspect(previewCardFor(element),element);}}});
 window.addEventListener('resize',()=>{cancelHold();fitGameCanvas();});window.visualViewport?.addEventListener('resize',fitGameCanvas);window.addEventListener('blur',cancelHold);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelHold();closeInspect();}});
 $('#graveyard-pile').addEventListener('click',()=>$('#graveyard-button').click());
 const home=document.createElement('button');home.id='battle-title-return97';home.className='quiet-button';home.textContent='Title screen';home.hidden=true;$('#title-options-dialog .title-option-actions').append(home);
 home.addEventListener('click',()=>{$('#title-options-dialog').close();$('#brand-home').click();});
 sync();fitGameCanvas();return{openInspect,closeInspect,cancelHold};
})();
