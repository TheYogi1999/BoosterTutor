/* v0.101 — fixed-view trading post and encounter receipt. */
(()=>{
 const shop=$('#shop-screen'),results=$('#results-screen');shop.classList.add('fit-stop101');results.classList.add('fit-stop101');
 const tabs=document.createElement('nav');tabs.className='shop-tabs101';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Shop departments');
 const panels={cards:$('#shop-grid'),packs:$('#shop-pack'),counters:shop.querySelector('.shop-counters')};
 panels.counters.id='shop-counters101';
 for(const [key,label] of [['cards','Cards'],['packs','Packs'],['counters','Counters']]){const b=document.createElement('button');b.type='button';b.id='shop-tab-'+key+'101';b.dataset.shopTab101=key;b.setAttribute('role','tab');b.setAttribute('aria-controls',panels[key].id);b.textContent=label;tabs.append(b);}
 shop.append(tabs);let selected='cards',inventory=null,statusTimer=0;
 const status=document.createElement('p');status.className='shop-status101';status.setAttribute('role','status');status.setAttribute('aria-live','polite');shop.querySelector('.shopkeeper-copy90').append(status);
 function sync(){
  const compact=matchMedia('(max-width:1100px), (max-height:820px)').matches;
  document.documentElement.classList.toggle('fitted-stop-active101',['shop-screen','results-screen'].includes(state.screen));
  $('#toast').setAttribute('aria-hidden',String(['shop-screen','results-screen'].includes(state.screen)));
  shop.classList.toggle('shop-paged101',compact);tabs.hidden=!compact;
  for(const [key,panel] of Object.entries(panels)){
   panel.hidden=compact&&selected!==key;panel.setAttribute('role',compact?'tabpanel':'region');
   if(compact)panel.setAttribute('aria-labelledby','shop-tab-'+key+'101');else panel.removeAttribute('aria-labelledby');
  }
  for(const tab of tabs.children){const active=tab.dataset.shopTab101===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  if(typeof controller!=='undefined')controller.dirty=true;
 }
 function select(key,focus=false){if(!panels[key])return;selected=key;hideCardPreview();sync();if(focus)$('#shop-tab-'+key+'101').focus({preventScroll:true});}
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-shop-tab101]');if(b)select(b.dataset.shopTab101);});
 tabs.addEventListener('keydown',e=>{const keys=Object.keys(panels),i=keys.indexOf(selected);let next;if(e.key==='ArrowRight')next=keys[(i+1)%keys.length];if(e.key==='ArrowLeft')next=keys[(i+keys.length-1)%keys.length];if(e.key==='Home')next=keys[0];if(e.key==='End')next=keys.at(-1);if(next){e.preventDefault();select(next,true);}});
 const details=document.createElement('dialog');details.id='shop-card-dialog101';details.className='shop-card-dialog101';details.setAttribute('aria-labelledby','shop-card-title101');
 details.innerHTML='<header><span class="eyebrow">CARD DETAILS</span><button type="button" class="graveyard-close" aria-label="Close card details">×</button></header><div class="shop-detail-body101"></div>';document.body.append(details);
 function inspect(index){
  const card=state.shop?.offers[index]?.card;if(state.screen!=='shop-screen'||!card||document.querySelector('dialog[open]'))return;
  hideCardPreview();const stats=isCreature(card)?parseStats(card):null;
  details.querySelector('.shop-detail-body101').innerHTML=`<div class="shop-detail-art101">${cardFace(card)}</div><div><h2 id="shop-card-title101">${escapeHtml(card.name)}</h2><p>${escapeHtml(card.type_line)} · ${Math.ceil(card.cmc||0)} generic mana</p>${stats?combatStats(stats.power,stats.toughness):''}<div class="shop-detail-rules101">${effectDescriptions(card).map(line=>`<p>${keywordText61(line)}</p>`).join('')}</div></div>`;
  details.showModal();details.querySelector('button').focus({preventScroll:true});
 }
 details.querySelector('button').addEventListener('click',()=>details.close());
 details.addEventListener('click',e=>{if(e.target===details){const r=details.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)details.close();}});
 $('#shop-grid').addEventListener('click',e=>{const face=e.target.closest('.shop-card-face'),button=e.target.closest('[data-shop-details101]');if(face||button)inspect(Number(face?.dataset.offerIndex??button.dataset.shopDetails101));});
 $('#shop-grid').addEventListener('keydown',e=>{const face=e.target.closest('.shop-card-face');if(face&&['Enter',' '].includes(e.key)){e.preventDefault();inspect(Number(face.dataset.offerIndex));}});
 const baseShop=renderShop;
 renderShop=function(){
  const result=baseShop();if(state.shop!==inventory){inventory=state.shop;selected='cards';}
  for(const [index,offer] of [...$('#shop-grid').children].entries()){
   const face=offer.querySelector('.shop-card-face');face.setAttribute('role','button');
   const actions=document.createElement('div');actions.className='shop-card-actions101';
   const button=document.createElement('button');button.type='button';button.className='quiet-button';button.dataset.shopDetails101=String(index);button.textContent='Details';button.setAttribute('aria-label','Inspect '+state.shop.offers[index].card.name);
   actions.append(button,offer.querySelector('[data-buy-card]'));offer.append(actions);
  }
  sync();return result;
 };
 const measure=document.createElement('canvas').getContext('2d');
 function fitReceiptNumbers(){
  if(state.screen!=='results-screen'||!measure)return;
  const bounty=$('#results-bounty82'),base=parseFloat(getComputedStyle(bounty).getPropertyValue('--receipt-base101'))||100;
  measure.font=base+'px Georgia';const width=measure.measureText(bounty.textContent).width;
  bounty.style.fontSize=Math.min(base,base*bounty.clientWidth/Math.max(1,width))+'px';
  for(const strong of results.querySelectorAll('.results-stat-pair82 strong')){
   const base=parseFloat(getComputedStyle(strong).getPropertyValue('--receipt-stat-base101'))||30,small=strong.querySelector('small'),b=strong.querySelector('b');
   measure.font=base+'px '+getComputedStyle(strong).fontFamily;
   const need=measure.measureText(small.textContent).width*.56+measure.measureText(' → ').width+measure.measureText(b.textContent).width+8,factor=Math.min(1,strong.clientWidth/Math.max(1,need));
   strong.style.fontSize=base*factor+'px';small.style.fontSize=base*.56*factor+'px';
  }
 }
 const values=new MutationObserver(fitReceiptNumbers);for(const id of ['results-bounty82','results-wallet82','results-level82','results-wallet-before82','results-level-before82'])values.observe($('#'+id),{childList:true,characterData:true,subtree:true});
 new ResizeObserver(fitReceiptNumbers).observe(results);
 const baseToast=showToast;
 showToast=function(message){const result=baseToast(message);if(state.screen==='shop-screen'){status.textContent=message;shop.classList.add('shop-has-status101');clearTimeout(statusTimer);statusTimer=setTimeout(()=>shop.classList.remove('shop-has-status101'),3000);}return result;};
 const baseScreen=showScreen;
 showScreen=function(id){
  if(id!==state.screen){clearTimeout(statusTimer);shop.classList.remove('shop-has-status101');clearTimeout(state.toastTimer);$('#toast').classList.remove('visible');}
  if(id!=='shop-screen'&&details.open)details.close();const result=baseScreen(id);sync();fitReceiptNumbers();return result;
 };
 window.addEventListener('resize',sync);window.visualViewport?.addEventListener('resize',sync);sync();
})();
