/* All permanent cards share the explicit, unpaid action window used by tokens. */
function openPermanentAction60(id){return openTokenAction47(id);}
const basePermanentDetails60=tokenActionDetails47;
tokenActionDetails47=function(permanent){
 const existing=basePermanentDetails60(permanent);if(existing)return existing;
 if(!permanent)return null;
 const card=permanent.card,cost=permanentActivationCost(card),equipment=/Equipment/.test(card.type_line);
 const costs=card.name==='Sol Ring'?'Tap · no mana cost':card.name==='Jack-in-the-Mox'?'Tap · roll a D6 · no mana cost':cost!==null?`${cost} generic mana · sacrifice`:equipment?`Equip: ${equipCost(card)} generic mana`:'Passive ability · no activation cost';
 return {effect:effectDescriptions(card).join(' '),cost:costs,action:cost!==null?permanentActivationLabel51(permanent):'No activated ability'};
};
function permanentActionBusy60(b){return Boolean(!b||b.phase==='complete'||b.resolutionTask||b.choice||b.scry||b.libraryOrder||b.interruption||b.diceRoll||b.wardCastWarning||b.enemyCastCheck);}
const basePermanentAvailable60=canActivatePermanent;
canActivatePermanent=function(permanent,battle=state.battle){return Boolean(!permanentActionBusy60(battle)&&state.battle===battle&&battle.permanents.includes(permanent)&&basePermanentAvailable60(permanent,battle));};
const basePermanentWindow60=renderTokenAction47;
renderTokenAction47=function(){
 basePermanentWindow60();const action=state.tokenAction47,b=state.battle,p=b?.permanents.find(unit=>unit.id===action?.id);
 const extra=$('#permanent-options60');extra.hidden=true;
 if(!p)return;
 const token=p.card.campToken,lotus=p.card.name==='Black Lotus',cost=permanentActivationCost(p.card),equipment=/Equipment/.test(p.card.type_line);
 $('#token-action-confirm').hidden=cost===null;
 if(!token&&!lotus){
  $('#token-action-heading').textContent='CARD ABILITIES';$('#token-action-cancel').textContent='Close';$('#token-action-dialog').dataset.kind='permanent';
  $('#token-action-status').textContent=cost===null?equipment?'Choose a creature to attach this equipment to.':'This ability is always active while the card remains on the battlefield.':p.tapped?'Tapped. Untaps at the start of your next turn.':canActivatePermanent(p,b)?'Nothing is paid until you confirm an action.':permanentActionBusy60(b)?'Finish the pending card choices before activating.':`Needs ${cost} mana · ${b.mana} available.`;
 }
 if(equipment){
  extra.hidden=false;
  const select=$('#permanent-equip-target60'),previous=select.value;
  select.innerHTML=b.creatures.map(unit=>`<option value="${escapeHtml(unit.id)}" ${unit.id===p.attachedTo?'disabled':''}>${escapeHtml(unit.card.name)}${unit.id===p.attachedTo?' · currently attached':''}</option>`).join('');
  const legal=b.creatures.filter(unit=>unit.id!==p.attachedTo);
  select.value=legal.some(unit=>unit.id===previous)?previous:legal[0]?.id||'';
  const equip=equipCost(p.card),available=!permanentActionBusy60(b)&&b.phase==='main'&&!b.enemyCounterWindow&&legal.length>0&&equip!==null&&b.mana>=equip;
  $('#permanent-equip60').disabled=!available;$('#permanent-equip60').textContent=`${p.attachedTo?'Move':'Equip'} · ${equip} mana`;
  if(b.phase!=='main')$('#token-action-status').textContent='Equipment can be moved only in your main phase, when no spell is pending.';
  else if(!legal.length)$('#token-action-status').textContent='Play another creature to have an eligible attachment target.';
 }
};
function equipFromPermanentAction60(){
 const action=state.tokenAction47,b=state.battle,p=b?.permanents.find(unit=>unit.id===action?.id),target=$('#permanent-equip-target60').value;
 if(!action||action.battle!==b||!p||!/Equipment/.test(p.card.type_line)||permanentActionBusy60(b)||b.phase!=='main'||b.enemyCounterWindow||!b.creatures.some(unit=>unit.id===target)||p.attachedTo===target||equipCost(p.card)===null||b.mana<equipCost(p.card))return renderTokenAction47();
 closeTokenAction47();b.pendingAttachment={permanentId:p.id};selectAttachmentTarget(target);
}
$('#permanent-equip60').addEventListener('click',equipFromPermanentAction60);
