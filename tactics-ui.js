/* v0.106 — compact information and choices, fitted to the current viewport. */
function deckProfileMarkup106(cards){
 const p=deckProfile106(cards),max=Math.max(1,...p.curve);
 return `<div class="deck-totals106"><b>${p.total} cards</b><span>${p.creatures} creatures</span><span>${p.spells} instants/sorceries</span><span>${p.permanents} other permanents</span><span>${p.mana} mana cards</span><span>Avg. cost ${p.average.toFixed(1)}</span></div><div class="mana-curve106" role="img" aria-label="Mana curve excluding mana cards: ${p.curve.map((n,i)=>(i===7?'7+':i)+' mana: '+n).join(', ')}">${p.curve.map((n,i)=>`<span title="${i===7?'7+':i} generic mana · ${n} cards"><b>${n}</b><i style="--curve-height106:${n/max*100}%"></i><small>${i===7?'7+':i}</small></span>`).join('')}</div>`;
}
function forecastMarkup106(f){
 if(!f.available)return `<p class="forecast-empty106">${escapeHtml(f.reason)}</p>`;
 const rows=f.rows.filter(r=>r.damage||r.dead||r.created||r.poison);
 return `<p class="forecast-assumption106">${f.uncertain?'Estimate · unresolved trigger choices are listed below.':'Current board · no further spells or abilities assumed.'}</p><div class="forecast-totals106"><b>Your life ${f.playerBefore} → ${f.playerAfter}</b><span>Lifelink +${f.playerGain} life</span>${f.enemyGain?`<span>Enemy lifelink +${f.enemyGain}</span>`:''}${f.draws?`<span>Draw ${f.draws}</span>`:''}${f.extraCombats?`<span>+${f.extraCombats} combat</span>`:''}</div><div class="forecast-rows106">${rows.map(r=>`<div class="${r.dead?'forecast-lethal106':''}"><span>${escapeHtml(r.name)}${r.created?' · enters':''}</span><b>${r.damage} damage${r.poison?' · +'+r.poison+' poison':''}</b><small>${r.returned?'Dies · returns with Persist':r.dead?r.owner==='enemy'?'Defeated':'Dies':r.owner==='enemy'?r.remaining+' life left':'Survives'}</small></div>`).join('')||'<p>No damage with the current assignments.</p>'}</div>${f.ward?`<p class="forecast-ward106">Ward (${escapeHtml(f.ward)}) · ${f.wardAffordable?'affordable now':'not affordable now'}. Attacks do not pay Ward; targeting spells/abilities do.</p>`:''}${[...f.notes,...f.triggers].slice(0,6).map(s=>`<p class="forecast-note106">${escapeHtml(s)}</p>`).join('')}`;
}
(()=>{
 const route=document.createElement('section');route.id='route-screen';route.className='screen';
 route.innerHTML='<header class="route-heading106"><div><span class="eyebrow" id="route-location106"></span><h2 id="route-title106">Choose your path</h2><p id="route-note106"></p></div><button id="route-begin106" class="primary-button" disabled>BEGIN ENCOUNTER →</button></header><div class="route-tools106"><span id="route-wallet106"></span><button class="quiet-button" id="route-deck106">Review deck</button><button class="quiet-button" id="route-back106" hidden>Back to paths</button></div><div id="route-choices106"></div><select id="route-target106" aria-label="Creature to upgrade" hidden></select><aside id="route-profile106" aria-label="Your deck summary"></aside>';
 $('#app').append(route);screens.push('route-screen');
 $('#route-choices106').addEventListener('click',e=>{const button=e.target.closest('[data-route-choice106]');if(!button||!validRoute106(Number(button.dataset.ticket106)))return;state.routePending106.selected=button.dataset.routeChoice106;renderRoute106();});
 $('#route-target106').addEventListener('change',()=>{const p=state.routePending106;$('#route-begin106').disabled=!p?.selected||(p.selected==='rune'&&!$('#route-target106').value);});
 $('#route-back106').addEventListener('click',()=>{if(!validRoute106())return;state.routePending106.event=false;state.routePending106.selected=null;renderRoute106();});
 $('#route-begin106').addEventListener('click',()=>{if(!validRoute106())return;const p=state.routePending106;if(p.selected==='event'&&!p.event){p.event=true;p.selected=null;renderRoute106();return;}commitRoute106(p.id,p.selected,$('#route-target106').value);});
 $('#route-deck106').addEventListener('click',()=>openCollection('deck'));
 const profile=document.createElement('section');profile.id='deck-profile106';profile.setAttribute('aria-label','Deck composition and mana curve');$('#collection-note').after(profile);
 const filterTools=$('#collection-dialog .collection-tools'),filterPanel=document.createElement('div'),filterButton=document.createElement('button');filterPanel.className='collection-filter-panel106';filterButton.id='collection-filter-toggle106';filterButton.type='button';filterButton.className='quiet-button';filterButton.textContent='Filters';filterButton.setAttribute('aria-expanded','false');filterButton.setAttribute('aria-controls','collection-filter-panel106');filterPanel.id='collection-filter-panel106';
 for(const select of [...filterTools.querySelectorAll('select')])filterPanel.append(select);
 filterTools.insertBefore(filterButton,$('#collection-stats'));filterTools.append(filterPanel);
 filterButton.addEventListener('click',()=>{const open=$('#collection-dialog').classList.toggle('filters-open106');filterButton.setAttribute('aria-expanded',String(open));});
 const baseCollection=renderCollection;
 renderCollection=function(){const value=baseCollection(),kind=state.collectionKind;profile.hidden=!['deck','library'].includes(kind);if(!profile.hidden)profile.innerHTML=deckProfileMarkup106(kind==='library'?state.battle?.deck||[]:state.deck);return value;};
 const modal=document.createElement('dialog');modal.id='combat-preview-dialog106';modal.setAttribute('aria-labelledby','combat-preview-title106');modal.innerHTML='<header><div><span class="eyebrow">PLAN YOUR COMBAT</span><h2 id="combat-preview-title106">Combat preview</h2></div><button class="graveyard-close" id="combat-preview-close106" aria-label="Close combat preview">×</button></header><div id="combat-preview-body106"></div>';
 document.body.append(modal);
 const button=document.createElement('button');button.id='combat-preview-open106';button.className='quiet-button';button.textContent='Preview';button.title='Combat preview (V)';button.setAttribute('aria-haspopup','dialog');$('.battle-system97').prepend(button);
 function updateDialog(){if(modal.open)$('#combat-preview-body106').innerHTML=forecastMarkup106(forecastCombat106());}
 button.addEventListener('click',()=>{if(document.querySelector('dialog[open]'))return;$('#combat-preview-body106').innerHTML=forecastMarkup106(forecastCombat106());modal.showModal();});
 $('#combat-preview-close106').addEventListener('click',()=>modal.close());
 const popup=document.createElement('aside');popup.id='combat-preview-popover106';popup.hidden=true;popup.setAttribute('aria-live','polite');document.body.append(popup);let anchor=null;
 function hide(){popup.hidden=true;anchor=null;}
 function peek(node){
  if(state.screen!=='combat-screen'||document.querySelector('dialog[open]')||pointerDrag?.active)return;
  const b=state.battle,u=b?.creatures.find(u=>u.id===node.dataset.creatureId);if(!u)return;
  const f=forecastCombat106(['blocks','damage'].includes(b.phase)?{}:{unitId:u.id,targetId:b.selectedEnemyTargetId});
  anchor=node;popup.innerHTML=`<b class="forecast-caption106">${['blocks','damage'].includes(b.phase)?'Current blocks':'Selected attack'} · V for full preview</b>`+forecastMarkup106(f);popup.hidden=false;
  const r=node.getBoundingClientRect(),a=safeGameViewport102(),box=popup.getBoundingClientRect();let x=r.right+12,y=r.top;
  if(x+box.width>a.left+a.width-8)x=r.left-box.width-12;if(x<a.left+8){x=a.left+8;y=r.bottom+8;}
  popup.style.left=Math.max(a.left+8,Math.min(x,a.left+a.width-box.width-8))+'px';popup.style.top=Math.max(a.top+8,Math.min(y,a.top+a.height-box.height-8))+'px';
 }
 $('#creature-row').addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const node=e.target.closest('[data-creature-id]');if(node&&node!==e.relatedTarget?.closest?.('[data-creature-id]'))peek(node);});
 $('#creature-row').addEventListener('pointerout',e=>{if(anchor&&!anchor.contains(e.relatedTarget))hide();});
 $('#creature-row').addEventListener('focusin',e=>{const node=e.target.closest('[data-creature-id]');if(node)peek(node);});
 document.addEventListener('pointerdown',hide,{capture:true,passive:true});window.addEventListener('resize',hide);
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()!=='v'||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea')||state.screen!=='combat-screen'||document.querySelector('dialog[open]'))return;e.preventDefault();button.click();});
 const baseBattle=renderBattle;
 renderBattle=function(){const value=baseBattle();hide();updateDialog();return value;};
 const baseScreen=showScreen;
 showScreen=function(id){hide();if(id!=='combat-screen'&&modal.open)modal.close();return baseScreen(id);};
 const baseAdvance=controller.advance.bind(controller),baseHints=controller.buttonHints.bind(controller);
 controller.advance=function(){if(state.screen==='route-screen'&&!this.modal()){const b=$('#route-begin106');if(!b.disabled)b.click();this.dirty=true;return;}return baseAdvance();};
 controller.buttonHints=function(){baseHints();const b=$('#route-begin106'),layout=INPUT_LAYOUTS78[this.profile],old=b.querySelector('.input-action-hint79');if(!this.gamepadProfile()){old?.remove();return;}const signature=this.profile+':advance';if(old?.dataset.binding===signature)return;old?.remove();const hint=document.createElement('span');hint.className='input-action-hint79';hint.dataset.binding=signature;hint.innerHTML=glyph78(layout.advance[0],this.profile);b.append(hint);};
})();
