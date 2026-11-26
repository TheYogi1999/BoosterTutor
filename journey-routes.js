/* v0.106 — commit one path per encounter, after supplies; never skip a boss. */
let routeTicket106=0;
function routeStore106(){if(state.routes106?.run!==state.finishRun59)state.routes106={run:state.finishRun59,history:[]};return state.routes106;}
function routeEvent106(node){return ['altar','forge','cache'][(node-1)%3];}
function chooseRoute106(node){
 if(node!==state.node||!state.deck.length)return false;
 const store=routeStore106();if(store.history.some(h=>h.node===node))return false;
 ensurePhysicalDeck60();state.routePending106={id:++routeTicket106,run:state.finishRun59,node,origin:state.screen,selected:null,event:false};
 showScreen('route-screen');renderRoute106();return true;
}
function validRoute106(ticket=state.routePending106?.id){const p=state.routePending106;return Boolean(p&&p.id===ticket&&p.run===state.finishRun59&&p.node===state.node&&state.screen==='route-screen'&&!routeStore106().history.some(h=>h.node===p.node));}
function routeEventOptions106(p=state.routePending106){
 if(!p)return[];const type=routeEvent106(p.node);
 return type==='altar'?[{id:'blood',title:'Offer 4 life',text:'Gain 12 coins. Then face the normal encounter.',enabled:state.playerHealth>4},{id:'leave',title:'Leave the altar',text:'Keep your life and face the normal encounter.',enabled:true}]:type==='forge'?[{id:'rune',title:'Pay 8 coins · add a +1/+1 run counter',text:'Choose one creature below. Only this copy is upgraded, with its foil seal.',enabled:state.coins>=8&&state.deck.some(isCreature)},{id:'leave',title:'Leave the forge',text:'Keep your cards and coins. Face the normal encounter.',enabled:true}]:[{id:'treasures',title:'Pay 6 coins · take 2 Treasure',text:'Carry two extra Treasure tokens into the encounter.',enabled:state.coins>=6},{id:'food',title:'Take 1 Food',text:'A free Food token for the road. Then face the normal encounter.',enabled:true},{id:'leave',title:'Leave the cache',text:'Continue without taking supplies.',enabled:true}];
}
function commitRoute106(ticket,choice,cardId=null){
 if(!validRoute106(ticket))return false;const p=state.routePending106;
 if(p.event){
  const option=routeEventOptions106(p).find(o=>o.id===choice&&o.enabled);if(!option)return false;
  if(choice==='blood'){state.playerHealth-=4;state.coins+=12;}
  if(choice==='rune'){const card=state.deck.find(c=>c.runCardId60===cardId&&isCreature(c));if(!card||state.coins<8)return false;state.coins-=8;(card.runCounters60||=[]).push('stats');}
  if(choice==='treasures'||choice==='food'){if(choice==='treasures')state.coins-=6;for(let i=0;i<(choice==='treasures'?2:1);i++)(state.campTokens||=[]).push({id:`supply-${state.nextPermanentId++}`,kind:choice==='food'?'food':'treasure'});}
 }else if(!['normal','elite'].includes(choice))return false;
 const record={node:p.node,type:p.event?'event':choice,event:p.event?choice:null};routeStore106().history.push(record);state.routePending106=null;
 // The persistent Immortal resumer expects its camp origin. No camp choice is
 // run again, and no second supply token can be collected through this step.
 state.screen=p.origin;const value=beginBattle(p.node),b=state.battle;
 if(b&&b.phase!=='complete'){
  b.route106=record;
  if(choice==='elite'&&!p.event){
   for(const wave of b.waves||[b.enemyCreatures])for(const e of wave)if(!e.eliteRoute106){e.eliteRoute106=true;const damage=e.maxHealth-e.health;e.maxHealth=Math.ceil(e.maxHealth*1.25);e.health=Math.max(1,e.maxHealth-damage);e.power+=1;e.bounty=Math.ceil((e.bounty??8)*1.5);}
   b.enemy={...b.enemy,rank:'ELITE ROUTE · +50% BOUNTY'};
  }
  renderBattle();
 }
 return value===false?false:true;
}
function renderRoute106(){
 const p=state.routePending106;if(!p)return;const stage=state.stageLocations[p.node-1]||LAND_STAGES[(p.node-1)%LAND_STAGES.length],boss=!state.endless&&p.node===ENCOUNTERS.length;
 $('#route-location106').textContent=`${stage.name} · ${state.runMode71==='immortal'?'Wave':'Encounter'} ${p.node}`;
 $('#route-title106').textContent=p.event?{altar:'The bloodstained altar',forge:'The wandering runesmith',cache:'A forgotten supply cache'}[routeEvent106(p.node)]:'Choose your path';
 $('#route-note106').textContent=p.event?'Review the trade before committing. Leaving costs nothing.':boss?'Every path leads to the guardian. Choose your preparation and risk.':'Choose a normal fight, stronger enemies for more coins, or an event before the fight.';
 const choices=p.event?routeEventOptions106(p):[{id:'normal',title:boss?'Face the guardian':'The guarded road',text:'Normal encounter · normal bounty. Keep your current deck and supplies.',enabled:true},{id:'elite',title:boss?'Empowered guardian':'Elite patrol',text:'All waves: +25% enemy life, +1 power. Defeated enemies award 50% more coins.',enabled:true},{id:'event',title:{altar:'Bloodstained altar',forge:'Wandering runesmith',cache:'Forgotten cache'}[routeEvent106(p.node)],text:'Choose a trade or leave freely, then fight the normal encounter. No encounter is skipped.',enabled:true}];
 $('#route-choices106').style.setProperty('--route-columns106',choices.length);
 $('#route-choices106').innerHTML=choices.map((o,i)=>`<button type="button" class="route-choice106${p.selected===o.id?' selected':''}" data-route-choice106="${o.id}" data-ticket106="${p.id}" aria-pressed="${p.selected===o.id}" ${o.enabled?'':'disabled'}><span class="route-emblem106" aria-hidden="true">${p.event?'✦':['⚔','♜','◇'][i]}</span><strong>${escapeHtml(o.title)}</strong><span>${escapeHtml(o.text)}</span></button>`).join('');
 const target=$('#route-target106'),old=target.value;target.hidden=!p.event||routeEvent106(p.node)!=='forge';
 if(!target.hidden){target.innerHTML='<option value="">Choose a creature to upgrade</option>'+state.deck.filter(isCreature).map(c=>`<option value="${escapeHtml(c.runCardId60)}">${escapeHtml(c.name)}${runCounterLabels60(c).length?' · '+escapeHtml(runCounterLabels60(c).join(', ')):''}</option>`).join('');target.value=state.deck.some(c=>c.runCardId60===old)?old:'';}
 $('#route-back106').hidden=!p.event;
 $('#route-begin106').disabled=!p.selected||(p.event&&p.selected==='rune'&&!target.value);
 $('#route-begin106').textContent=p.selected==='event'&&!p.event?'VIEW EVENT →':p.event?'CONFIRM →':'CONTINUE →';
 $('#route-wallet106').textContent=`${state.playerHealth} life · ${state.coins||0} coins`;
 $('#route-profile106').innerHTML=deckProfileMarkup106(state.deck);
 if(typeof controller!=='undefined'){controller.dirty=true;controller.buttonHints();}
}
