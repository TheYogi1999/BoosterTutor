/* Click-to-use camp supplies and readable enemy combat abilities. */
function tokenActionDetails47(permanent){
 const kind=permanent?.card?.tokenKind;
 const details={
  treasure:{effect:'Add 1 floating generic mana.',cost:'Tap · sacrifice · no mana cost',action:'Sacrifice → Add 1 mana'},
  food:{effect:'Gain 3 life.',cost:'2 generic mana · tap · sacrifice',action:'Sacrifice → Gain 3 life'},
  clue:{effect:'Draw 1 card.',cost:'2 generic mana · sacrifice',action:'Sacrifice → Draw 1 card'}
 }[kind];
 return permanent?.card?.campToken?details:null;
}
function closeTokenAction47(){
 state.tokenAction47=null;
 const dialog=$('#token-action-dialog');
 if(dialog?.open)dialog.close();
}
function renderTokenAction47(){
 const action=state.tokenAction47;
 if(!action)return;
 const battle=state.battle;
 const permanent=battle?.permanents.find(unit=>unit.id===action.id);
 const details=tokenActionDetails47(permanent);
 if(action.battle!==battle||battle.phase==='complete'||!details){closeTokenAction47();return;}
 const reward=CAMP_REWARDS[permanent.card.tokenKind];
 $('#token-action-title').textContent=`${reward.name} token`;
 $('#token-action-symbol').textContent=reward.symbol;
 $('#token-action-dialog').dataset.kind=permanent.card.tokenKind;
 $('#token-action-effect').textContent=details.effect;
 $('#token-action-cost').textContent=details.cost;
 const available=canActivatePermanent(permanent,battle);
 $('#token-action-confirm').disabled=!available;
 $('#token-action-confirm').textContent=details.action;
 const cost=permanentActivationCost(permanent.card);
 $('#token-action-status').textContent=available?'This token is used up when sacrificed.':permanent.tapped&&['food','treasure'].includes(permanent.card.tokenKind)?'This token is tapped. Untap it before using it.':battle.mana<cost?`Needs ${cost} mana · ${battle.mana} available.`:'Finish the current card choices before using this token.';
}
function openTokenAction47(id){
 const battle=state.battle;
 const permanent=battle?.permanents.find(unit=>unit.id===id);
 if(!battle||battle.phase==='complete'||!tokenActionDetails47(permanent)||state.screen!=='combat-screen'||document.querySelector('dialog[open]'))return false;
 hideCardPreview();state.tokenAction47={id,battle};renderTokenAction47();
 $('#token-action-dialog').showModal();
 ($('#token-action-confirm').disabled?$('#token-action-cancel'):$('#token-action-confirm')).focus({preventScroll:true});
 return true;
}
function confirmTokenAction47(){
 const action=state.tokenAction47;
 const permanent=state.battle?.permanents.find(unit=>unit.id===action?.id);
 if(!action||action.battle!==state.battle||!tokenActionDetails47(permanent))return false;
 if(!canActivatePermanent(permanent,state.battle)){renderTokenAction47();return false;}
 closeTokenAction47();
 return activatePermanent(action.id);
}
$('#token-action-confirm').addEventListener('click',confirmTokenAction47);
$('#token-action-cancel').addEventListener('click',closeTokenAction47);
$('#token-action-dialog').addEventListener('cancel',event=>{event.preventDefault();closeTokenAction47();});
$('#token-action-dialog').addEventListener('click',event=>{if(event.target===$('#token-action-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeTokenAction47();}});
$('#token-action-dialog').addEventListener('close',()=>{if(!$('#token-action-dialog').open)state.tokenAction47=null;});

const ENEMY_KEYWORD_HELP47={
 Flying:'Only creatures with Flying or Reach can attack this enemy or block its flying attacks.',
 Lifelink:'Damage dealt by this enemy also restores that much life to it.',
 'First strike':'Deals combat damage before creatures without first strike.',
 'Double strike':'Deals damage in both the first-strike and normal combat damage steps.',
 Deathtouch:'Any combat damage this enemy deals to a creature is lethal.',
 Reach:'Can block creatures with Flying.',
 Vigilance:'Attacking does not tap this creature.',
 Haste:'Can attack on the turn it arrives.',
 Trample:'Combat damage beyond lethal blocker damage carries over.',
 Menace:'Must be blocked by at least two creatures.',
 Defender:'Cannot attack.',
 Hexproof:'Your targeted spells cannot choose this enemy.'
};
function enemyKeywordBadges47(enemy){
 const labels=creatureKeywordLabels(enemy).split(' · ').filter(Boolean);
 if(!labels.length)return '<span class="enemy-keyword-empty">No keywords</span>';
 return labels.map(label=>{
  let tone='combat',help=ENEMY_KEYWORD_HELP47[label]||label;
  if(label==='Flying'||label==='Reach')tone='evasion';
  if(label==='Lifelink')tone='life';
  if(label==='Deathtouch')tone='lethal';
  if(label==='Hexproof')tone='protection';
  if(label.startsWith('Ward')){tone='protection';help=`When your spell targets this enemy, pay ${wardCost(enemy)} extra generic mana or that spell is countered.`;}
  if(label.startsWith('Mill')){tone='magic';help=`Its Mill intention puts ${enemy.millAmount} cards from your library into your graveyard.`;}
  if(label.startsWith('Counterspell')){tone=enemyCounterReady44(enemy)?'counter-ready':'magic';help=enemyCounterReady44(enemy)?'Ready: can pay 2 mana to counter your next spell. You may respond with an instant.':state.battle?.enemyCounterUsedTurn===state.battle?.turn?'The enemy team has already used its Counterspell reaction this turn.':'Counterspell becomes ready on even-numbered turns. Costs 2 mana; once per enemy team per turn.';}
  return `<span class="enemy-keyword-badge keyword-${tone}" title="${escapeHtml(help)}">${escapeHtml(label)}</span>`;
 }).join('');
}
