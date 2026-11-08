/* v0.38 — enemy spells resolve one at a time, with the normal instant window. */
Object.assign(SPELL_RULES, {
 Counterspell: {target:'opposing-spell', effects:[{kind:'counter-spell'}]},
 Cancel: {target:'opposing-spell', effects:[{kind:'counter-spell'}]},
 Negate: {target:'opposing-noncreature-spell', effects:[{kind:'counter-spell'}]},
 Dispel: {target:'opposing-instant', effects:[{kind:'counter-spell'}]},
 Dismiss: {target:'opposing-spell', effects:[{kind:'counter-spell'},{kind:'draw',amount:1}]}
});
delete MANUAL_BANS.Cancel;

function activeEnemySpell38(battle=state.battle) {
 return battle?.enemySpells?.find(spell=>spell.id===battle.activeEnemySpellId)||null;
}
function pendingEnemySpells38(battle=state.battle) {
 return battle?.enemySpells?.filter(spell=>spell.status==='pending')||[];
}
const baseSpellTargets38=ruleTargetOptions;
ruleTargetOptions=function(kind,battle=state.battle) {
 if(!kind?.startsWith('opposing-'))return baseSpellTargets38(kind,battle);
 const spell=activeEnemySpell38(battle);
 if(!spell||spell.status!=='pending')return [];
 if(kind==='opposing-instant'&&!isInstant(spell.card))return [];
 if(kind==='opposing-noncreature-spell'&&isCreature(spell.card))return [];
 return [{key:`spell:${spell.id}`,unit:spell,card:spell.card}];
};
const baseChoiceUnit38=choiceTargetUnit;
choiceTargetUnit=function(target,battle=state.battle) {
 if(target?.side==='spell')return battle.enemySpells?.find(spell=>spell.id===target.id&&spell.status==='pending')||null;
 return baseChoiceUnit38(target,battle);
};
function finishEnemySpell38(spell,status,battle=state.battle) {
 spell.status=status;
 if(!spell.recorded){(battle.enemySpellGraveyard||=[]).push(spell.card);spell.recorded=true;}
}
const baseReviewedEffect38=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}) {
 if(effect.kind!=='counter-spell')return baseReviewedEffect38(effect,target,context);
 const spell=choiceTargetUnit(target);
 if(!spell||target?.side!=='spell')return;
 finishEnemySpell38(spell,'countered');
 addLog(`${context.card?.name||'Counterspell'} counters ${spell.sourceName}'s ${spell.card.name}.`);
};
const baseCounterDescription38=effectDescriptions;
effectDescriptions=function(card) {
 const rule=SPELL_RULES[card.name];
 if(!rule?.target?.startsWith('opposing-'))return baseCounterDescription38(card);
 return [card.name==='Dispel'?'Counter the pending enemy instant. Sorceries and abilities are not legal targets.':card.name==='Negate'?'Counter the pending enemy noncreature spell.':'Counter the pending enemy spell.',
  'Cast during the enemy spell response window. A countered spell has no effect; its caster stays on the battlefield.',
  ...(card.name==='Dismiss'?['Then draw one card. Drawing from an empty library loses the run.']:[])];
};
const baseCounterSummary38=draftAbilitySummary;
draftAbilitySummary=function(card) {
 if(!SPELL_RULES[card.name]?.target?.startsWith('opposing-'))return baseCounterSummary38(card);
 return `${card.name==='Dispel'?'Counter an enemy instant':card.name==='Negate'?'Counter an enemy noncreature spell':'Counter an enemy spell'}${card.name==='Dismiss'?'. Draw 1.':'.'} Response window only.`;
};
const baseResponse38=hasInstantResponse;
hasInstantResponse=function(battle) {
 if(baseResponse38(battle))return true;
 const extra=battle.creatures.filter(creature=>canTapForMana(creature,battle)).length;
 return extra>0&&battle.hand.some(card=>(isInstant(card)||hasFlash(card))&&canCastNow(card,battle)&&battle.mana+extra>=Math.ceil(card.cmc||0));
};

const baseEnemyTeam38=createEnemyTeam;
createEnemyTeam=function(encounter) {
 const team=baseEnemyTeam38(encounter);
 const node=ENCOUNTERS.indexOf(encounter)+1||state.node;
 for(const enemy of team) {
  if(node>1&&enemy.kind==='duelist')enemy.pattern=['attack','scorch','attack','buff'];
  if(enemy.kind==='vampire')enemy.pattern=['attack','attack','drain','guard'];
 }
 return team;
};
const baseEnemyIntent38=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1) {
 const kind=enemy.pattern?.[(turn-1)%enemy.pattern.length];
 if(kind==='rune')return {kind,damage:0,label:'Cast Shock · 2 damage',icon:'✦'};
 if(kind==='scorch')return {kind,damage:0,label:'Cast Lava Spike · 3 damage',icon:'✦'};
 if(kind==='drain')return {kind,damage:0,label:"Cast Sovereign's Bite",icon:'✦'};
 return baseEnemyIntent38(enemy,turn);
};
function prepareEnemySpells38(battle) {
 if(battle.enemySpellsTurn===battle.turn)return;
 battle.enemySpellsTurn=battle.turn;
 battle.enemySpells=[];battle.activeEnemySpellId=null;
 for(const enemy of battle.enemyCreatures.filter(unit=>unit.health>0)) {
  const intent=enemyIntent(enemy,battle.turn).kind;
  if(!['rune','scorch','drain'].includes(intent))continue;
  const name=intent==='rune'?'Shock':intent==='scorch'?'Lava Spike':"Sovereign's Bite";
  const card=[...BUNDLED_CARDS,...BUNDLED_ENEMY_SPELLS].find(card=>card.name===name);
  const ally=intent==='rune'?battle.creatures.filter(unit=>!hasCreatureKeyword(unit,'hexproof')).sort((a,b)=>b.power-a.power)[0]:null;
  const target=ally?{side:'player',id:ally.id}:{side:'life'};
  const spell={id:`enemy-spell-${state.nextPermanentId++}`,owner:'enemy',card,sourceId:enemy.id,sourceName:enemy.card.name,target,status:'pending',intent,manaRemaining:enemy.runeMana||1};
  battle.enemySpells.push(spell);
  addLog(`${enemy.card.name} casts ${name}, targeting ${ally?.card.name||'your life'}.`);
 }
 // No legal response means no user decision is needed. Keep direct rules calls deterministic.
 while(pendingEnemySpells38(battle).length) {
  const spell=pendingEnemySpells38(battle)[0];battle.activeEnemySpellId=spell.id;
  if(hasInstantResponse(battle))return;
  resolveEnemySpell38(spell,battle);
  if(battle.phase==='complete')return;
 }
 battle.activeEnemySpellId=null;
}
function resolveEnemySpell38(spell,battle=state.battle) {
 if(!spell||spell.status!=='pending'||state.battle!==battle||battle.phase==='complete')return;
 const target=spell.target.side==='player'?battle.creatures.find(unit=>unit.id===spell.target.id):null;
 if(spell.target.side==='player'&&(!target||hasCreatureKeyword(target,'hexproof'))) {
  finishEnemySpell38(spell,'fizzled',battle);addLog(`${spell.card.name} has no legal target and does not resolve.`);return;
 }
 const ward=target?wardCost(target):0;
 if(ward>spell.manaRemaining) {
  finishEnemySpell38(spell,'countered',battle);addLog(`${target.card.name}'s Ward (${ward} mana) counters ${spell.sourceName}'s ${spell.card.name} (only ${spell.manaRemaining} mana available).`);return;
 }
 spell.manaRemaining-=ward;
 // Mark first: repeats, stale callbacks and source removal cannot apply the effect twice.
 finishEnemySpell38(spell,'resolved',battle);
 const amount=spell.intent==='rune'?2:3;
 if(target) {
  target.damage=(target.damage||0)+amount;
  addLog(`${spell.sourceName}'s ${spell.card.name} deals ${amount} damage to ${target.card.name}${ward?` after paying Ward ${ward}`:''}.`);
  battle.creatures=removeDeadCreatures(battle.creatures,'player');
 } else {
  state.playerHealth=Math.max(0,state.playerHealth-amount);
  if(typeof animatePlayerDamage==='function')animatePlayerDamage(amount);
  addLog(`${spell.card.name}: you ${spell.intent==='drain'?'lose':'take'} ${amount} life.`);
  if(spell.intent==='drain') {
   const source=battle.enemyCreatures.find(enemy=>enemy.id===spell.sourceId);
   if(source)source.health+=3;
  }
  if(state.playerHealth<=0)endRun(false);
 }
}

const baseEnemyBeat38=afterCombatBeat;
afterCombatBeat=function(battle,phase,callback) {
 if(phase!=='enemy'||!pendingEnemySpells38(battle).length)return baseEnemyBeat38(battle,phase,callback);
 return enemySpellWindow38(battle,callback);
};
function enemySpellWindow38(battle,continuation) {
 if(state.battle!==battle||battle.phase!=='enemy')return;
 const spell=pendingEnemySpells38(battle)[0];
 if(!spell) {
  battle.activeEnemySpellId=null;
  if(!battle.enemyCreatures.length)return winBattle();
  return baseEnemyBeat38(battle,'enemy',continuation);
 }
 battle.activeEnemySpellId=spell.id;
 baseEnemyBeat38(battle,'enemy',()=>{
  resolveEnemySpell38(spell,battle);
  if(state.battle!==battle||battle.phase!=='enemy')return;
  enemySpellWindow38(battle,continuation);
 });
}

function renderEnemySpells38() {
 const b=state.battle;const panel=$('#enemy-spell-panel');const spell=activeEnemySpell38(b);
 panel.hidden=!spell||b.phase!=='enemy';
 if(panel.hidden){panel.innerHTML='';return;}
 const target=spell.target.side==='player'?b.creatures.find(unit=>unit.id===spell.target.id)?.card.name||'departed creature':'your life';
 const index=b.enemySpells.indexOf(spell)+1;
 panel.innerHTML=`<div class="enemy-spell-copy"><span>ENEMY SPELL · ${index} / ${b.enemySpells.length}</span><strong>${escapeHtml(spell.card.name)} <small>${escapeHtml(spell.card.type_line)}</small></strong><p>${escapeHtml(spell.sourceName)} → ${escapeHtml(target)}</p><p class="enemy-spell-status">${spell.status==='countered'?'COUNTERED · no effect':spell.intent==='rune'?'2 damage · cast an instant or pass':spell.intent==='drain'?'You lose 3 life; caster gains 3 · respond or pass':'3 damage to you · cast an instant or pass'}</p></div><button class="quiet-button" data-pass-enemy-spell ${!b.priorityCallback||b.resolutionTask?'disabled':''}>${spell.status==='countered'?'Continue':'Resolve spell'} →</button>`;
 $('#phase-status').textContent=spell.status==='countered'?`${spell.card.name} was countered. Continue when ready.`:`${spell.sourceName} casts ${spell.card.name}. Cast an instant, or continue to let it resolve.`;
 $('#combat-action-hint').textContent='Enemy spell response: counter the spell, protect its target, or continue.';
}
$('#enemy-spell-panel').addEventListener('click',event=>{if(event.target.closest('[data-pass-enemy-spell]')&&!state.battle?.resolutionTask)handleCombatAction();});
