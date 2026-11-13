/* Complete reviewed rules for the rescued catalog, shared by mouse and controller. */
const MANA_CREATURES66=new Map([["Avacyn's Pilgrim",1],['Birds of Paradise',1],['Gold Myr',1],['Iron Myr',1],['Silver Myr',1],['Leaden Myr',1],['Copper Myr',1],['Palladium Myr',2],['Elvish Mystic',1],['Fyndhorn Elves',1]]);
const WARDENS66=new Set(['Soul Warden',"Soul's Attendant",'Essence Warden']);
const ACTIVATED66=new Set(['Goblin Fireslinger','Goblin Snowman','Prodigal Pyromancer','Prodigal Sorcerer','Shivan Dragon','Visara the Dreadful']);
const X_SPELLS66=new Set(['Blaze','Hurricane','Earthquake']);
const REVIEWED66=new Set([...MANA_CREATURES66.keys(),...WARDENS66,...ACTIVATED66,...X_SPELLS66,'Taunting Elf','Index','Read the Bones','Flight of Fancy','Murderous Redcap','Thunderclap Wyvern','Inferno']);
const ADAPTED66=new Set(['Taunting Elf','Goblin Fireslinger','Hurricane','Earthquake','Inferno']);
for(const name of REVIEWED66)if(!X_SPELLS66.has(name)&&!['Index','Read the Bones','Flight of Fancy','Inferno'].includes(name))SPECIAL_CREATURES.add(name);
REVIEWED_PERMANENTS.add('Flight of Fancy');
SPELL_RULES.Blaze={target:'any',effects:[{kind:'x-hit66'}]};
SPELL_RULES.Hurricane={effects:[{kind:'mass-damage66',filter:'flying',variable:true}]};
SPELL_RULES.Earthquake={effects:[{kind:'mass-damage66',filter:'ground',variable:true}]};
SPELL_RULES.Inferno={effects:[{kind:'mass-damage66',amount:6}]};
SPELL_RULES.Index={effects:[{kind:'index66'}]};
SPELL_RULES['Read the Bones']={effects:[{kind:'scry-draw',scry:2,draw:2},{kind:'lose-life',amount:2}]};
const baseRescueAudit66=rulesAudit;
rulesAudit=function(card){return REVIEWED66.has(card.name)?{playable:true,adapted:ADAPTED66.has(card.name),reason:'Reviewed complete costs, targets and abilities; see in-game rules for duel adaptations.'}:baseRescueAudit66(card);};
const baseRescueEffects66=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return REVIEWED66.has(card.name)?SPELL_RULES[card.name]?.effects||[]:baseRescueEffects66(card,creature);};

// Real additional card types make Disenchant/Naturalize useful against creatures.
const ENEMY_TYPES66={sprout:'Enchantment Creature — Plant Elemental',wisp:'Enchantment Creature — Spirit',duelist:'Creature — Human Warrior',boar:'Creature — Boar',sprite:'Creature — Faerie',raider:'Creature — Human Warrior',wolf:'Creature — Wolf',stalker:'Enchantment Creature — Horror',bulwark:'Artifact Creature — Construct',archivist:'Creature — Human Wizard',vampire:'Creature — Vampire',dragon:'Artifact Creature — Dragon',tyrant:'Enchantment Creature — Giant',sphinx:'Creature — Sphinx'};
const baseTypedFoe66=createFoe;
createFoe=function(kind,node=state.node){const enemy=baseTypedFoe66(kind,node);enemy.card.type_line=FOE_TYPES[kind].type_line||ENEMY_TYPES66[kind]||'Creature — Monster';return enemy;};
const baseTypedTargets66=ruleTargetOptions;
ruleTargetOptions=function(kind,b=state.battle){
 if(kind!=='artifact-or-enchantment')return baseTypedTargets66(kind,b);
 return [...b.creatures.map(unit=>({key:`player:${unit.id}`,unit,card:unit.card})),...b.enemyCreatures.filter(u=>!hasCreatureKeyword(u,'hexproof')).map(unit=>({key:`enemy:${unit.id}`,unit,card:unit.card})),...b.permanents.map(unit=>({key:`permanent:${unit.id}`,unit,card:unit.card})),...b.lands.map(unit=>({key:`land:${unit.id}`,unit,card:unit.card}))].filter(o=>/\b(?:Artifact|Enchantment)\b/.test(o.card.type_line||''));
};

function runCount66(card){return typeof runStatCount60==='function'?runStatCount60(card):0;}
function snapshotSource66(u){return {...u,permanentKeywords:[...(u.permanentKeywords||[])],temporaryKeywords:[...(u.temporaryKeywords||[])]};}
function dealAbility66(source,target,amount,b=state.battle){
 amount=Math.max(0,amount);const u=choiceTargetUnit(target,b);if(!amount)return;
 if(target.side==='life'){state.playerHealth-=amount;playSfx('player-hit');if(typeof animatePlayerDamage==='function')animatePlayerDamage(amount);}
 else if(u?.owner==='enemy'){u.health=Math.max(0,u.health-amount);if(hasCreatureKeyword(source,'deathtouch'))u.health=0;playSfx('enemy-hit');if(typeof showEnemyHit==='function'&&typeof enemyHitBox==='function')showEnemyHit(u,amount,enemyHitBox(u));}
 else if(u){u.damage=(u.damage||0)+amount;if(hasCreatureKeyword(source,'deathtouch'))u.deathtouchDamage=true;playSfx('player-hit');}
 gainLifelinkLife(source,'player',amount,b);
}
function settleReviewed66(b=state.battle){
 if(!b||b!==state.battle)return;
 for(let i=0;i<4;i++){const n=b.creatures.length+b.enemyCreatures.length;refreshPermanentEffects();b.creatures=removeDeadCreatures(b.creatures,'player');b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');if(n===b.creatures.length+b.enemyCreatures.length)break;}
 if(state.playerHealth<=0&&b.phase!=='complete')endRun(false);
}
function announceEntry66(unit,b=state.battle){
 if(!b||b!==state.battle)return;b.entriesSeen66||=new Set();if(b.entriesSeen66.has(unit.id))return;b.entriesSeen66.add(unit.id);
 for(const source of b.creatures.filter(u=>u!==unit&&creatureAlive(u)&&WARDENS66.has(u.card.name))){
  const optional=source.card.name==="Soul's Attendant";
  queueJester65(b,done=>{const gain=()=>{state.playerHealth++;addLog(`${source.card.name}: another creature entered. Gain 1 life.`);playSfx('heal');done();};if(!optional)return gain();openJesterChoice65({battle:b,title:source.card.name,instruction:'Another creature entered. You may gain 1 life.',options:[{label:'Gain 1 life',gain:true},{label:'Decline',gain:false}],accept:options=>options[0].gain?gain():done()});});
 }
}
function cancelOppositeCounters66(u){
 let cancel=Math.min(u.minusCounters66||0,u.counterPower||0);if(cancel){u.minusCounters66-=cancel;u.counterPower-=cancel;u.counterToughness-=cancel;}
 cancel=Math.min(u.minusCounters66||0,Math.max(0,runCount66(u.card)-(u.cancelledRunCounters66||0)));if(cancel){u.minusCounters66-=cancel;u.cancelledRunCounters66=(u.cancelledRunCounters66||0)+cancel;}
}
const baseRescueEntry66=onCreatureEntered;
onCreatureEntered=function(unit){
 const b=state.battle,waiting=b?.persistEntry66,physical=unit.originalCard||unit.card;
 if(waiting&&(physical===waiting.physical||physical.runCardId60&&physical.runCardId60===waiting.physical.runCardId60)){
  if(unit.rolledBase&&!unit.runStatsApplied60){const n=runCount66(unit.card);unit.power+=n;unit.toughness+=n;unit.runStatsApplied60=true;}
  unit.minusCounters66=1;unit.power--;unit.toughness--;cancelOppositeCounters66(unit);waiting.entered=true;
 }
 baseRescueEntry66(unit);announceEntry66(unit,b);
 if(unit.card.name==='Murderous Redcap'){
  queueJester65(b,done=>openJesterChoice65({battle:b,title:'Murderous Redcap · enters',instruction:'Choose any target. Damage equals its power when this trigger resolves (last known power if it left). Hexproof and Ward apply.',options:jesterTargetOptions65(b),accept:options=>withJesterWard65(b,options[0].target,unit.card.name,()=>{const source=b.creatures.includes(unit)?unit:unit.lastKnown66||snapshotSource66(unit);dealAbility66(source,options[0].target,source.power,b);},done)}));
 }
};
const baseRescueRefresh66=refreshPermanentEffects;
refreshPermanentEffects=function(){
 const b=state.battle;if(!b)return baseRescueRefresh66();
 for(const u of b.creatures){u.power-=u.wyvernPower66||0;u.toughness-=u.wyvernToughness66||0;u.wyvernPower66=u.wyvernToughness66=0;}
 baseRescueRefresh66();
 const wyverns=b.creatures.filter(u=>u.card.name==='Thunderclap Wyvern');
 for(const u of b.creatures)if(hasCreatureKeyword(u,'flying')){const n=wyverns.filter(w=>w!==u).length;u.power+=n;u.toughness+=n;u.wyvernPower66=u.wyvernToughness66=n;}
 for(const p of b.permanents)if(p.card.name==='Flight of Fancy'&&!p.fancyEntered66){p.fancyEntered66=true;queueJester65(b,done=>{for(let n=0;n<2&&b.phase!=='complete';n++)drawOneCard();done();});}
};
const baseFancyEffect66=permanentEffect;
permanentEffect=function(card){const result=baseFancyEffect66(card);return card.name==='Flight of Fancy'?{power:0,toughness:0,keywords:['flying']}:result;};
const baseCounterResolve66=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const u=choiceTargetUnit(target,state.battle);
 if(effect.kind==='double-counters'&&u){const n=(u.counterPower||0)+Math.max(0,runCount66(u.card)-(u.cancelledRunCounters66||0));baseCounterResolve66({kind:'counter',amount:n},target,context);cancelOppositeCounters66(u);return;}
 const result=baseCounterResolve66(effect,target,context);if(u&&['counter','morbid-counter'].includes(effect.kind))cancelOppositeCounters66(u);return result;
};

// Persist is a graveyard trigger, never a paid creature spell or an exile return.
function eligiblePersist66(u){return u&&u.card.name==='Murderous Redcap'&&!(u.minusCounters66>0)&&!u.persistQueued66&&!u.isToken;}
function persistReturn66(unit,b,done,copied=null){
 const physical=unit.originalCard||unit.card,index=b.graveyard.indexOf(physical);if(index<0||b.creatures.length>=CREATURE_LIMIT){addLog('Persist: the card left the graveyard or there is no free creature slot.');return done();}
 b.graveyard.splice(index,1);const card=copied?{...copied}:physical;if(copied)copyPhysicalFinish59(card,physical);
 const waiting={physical,done,entered:false};b.persistEntry66=waiting;
 if(typeof enterDiceCreature50==='function'&&enterDiceCreature50(card,b,copied?physical:null))return;
 const u={id:`player-${state.nextPermanentId++}`,owner:'player',card,...(copied?{originalCard:physical}:{}),...parseStats(card),...creatureKeywords(card),summonedTurn:b.turn,summoningSick:true,tapped:false,willAttack:false,attackedThisTurn:false};
 b.creatures.push(u);onCreatureEntered(u);b.persistEntry66=null;refreshPermanentEffects();addLog(`${physical.name} returns with a -1/-1 counter (Persist).`);done();
}
function queuePersist66(unit,b){
 const physical=unit.originalCard||unit.card;if(!b.graveyard.includes(physical))return;
 queueJester65(b,done=>{
  if(physical.name!=='Clone')return persistReturn66(unit,b,done);
  const options=b.creatures.map(u=>({card:u.card}));openJesterChoice65({battle:b,title:'Clone · Persist',instruction:'Clone returns with a -1/-1 counter. Choose a creature to copy, or return without copying as a 0/0 (it will die).',options,min:0,max:1,accept:selected=>{
   if(selected.length)return persistReturn66(unit,b,done,selected[0].card);
   const index=b.graveyard.indexOf(physical);if(index>=0){b.graveyard.splice(index,1);const u={id:`player-${state.nextPermanentId++}`,owner:'player',card:{...physical,power:'0',toughness:'0'},originalCard:physical,power:runCount66(physical),toughness:runCount66(physical),summonedTurn:b.turn,summoningSick:true};b.persistEntry66={physical,done};b.creatures.push(u);onCreatureEntered(u);b.persistEntry66=null;if(!creatureAlive(u)){b.creatures=b.creatures.filter(x=>x!==u);b.graveyard.push(physical);}}done();
  }});
 });
}
const baseRescueDead66=removeDeadCreatures;
removeDeadCreatures=function(creatures,owner='player',clearDamage=false){
 const b=state.battle,dead=owner==='player'?creatures.filter(u=>!creatureAlive(u)||u.toughness<=0):[];
 for(const u of dead)u.lastKnown66=snapshotSource66(u);
 const persist=dead.filter(eligiblePersist66);for(const u of persist)u.persistQueued66=true;
 const result=baseRescueDead66(creatures,owner,clearDamage);for(const u of persist)queuePersist66(u,b);return result;
};
const baseRescueSac66=sacrificeRuleCreature;
sacrificeRuleCreature=function(unit){const b=state.battle,ready=eligiblePersist66(unit);unit.lastKnown66=snapshotSource66(unit);const result=baseRescueSac66(unit);if(result&&ready){unit.persistQueued66=true;queuePersist66(unit,b);}return result;};
const baseRescueRemove66=removeSpellTarget;
removeSpellTarget=function(kind){const b=state.battle,u=b?.resolvingSpellTarget?.side==='player'?b.creatures.find(u=>u.id===b.resolvingSpellTarget.id):null,ready=kind==='destroy'&&eligiblePersist66(u);if(u)u.lastKnown66=snapshotSource66(u);const result=baseRescueRemove66(kind);if(ready){u.persistQueued66=true;queuePersist66(u,b);}return result;};
const baseRescueFinish66=finishResolution27;
finishResolution27=function(task){
 const b=task.battle,waiting=b?.persistEntry66;
 if(task.p?.card?.xBaseCmc66!==undefined)task.p.card.cmc=task.p.card.xBaseCmc66;
 if(waiting&&waiting.entered)b.persistEntry66=null;const result=baseRescueFinish66(task);if(waiting?.entered)waiting.done();return result;
};

// Tap mana stays generic, including colored producers and Palladium Myr's two mana.
function manaAmount66(card){return MANA_CREATURES66.get(card.name)||1;}
const baseManaReady66=canTapForMana;
canTapForMana=function(u,b=state.battle){return Boolean(!jesterPending65(b)&&!b?.resolutionTask&&!b?.choice&&!b?.scry&&!b?.libraryOrder&&baseManaReady66(u,b));};
const baseManaTap66=tapForMana;
tapForMana=function(id){
 const b=state.battle,u=b?.creatures.find(x=>x.id===id);if(!canTapForMana(u,b))return false;
 const blocked=[...b.blockAssignments].filter(([key,ids])=>blockerIds(b,key).includes(id)).map(([key])=>key);
 const result=baseManaTap66(id);if(!result)return result;const extra=manaAmount66(u.card)-1;if(extra)addFloatingMana58(extra,b);
 if(blocked.length){u.blockLockedTurn66=b.turn;for(const key of blocked){const ids=blockerIds(b,key);if(!ids.includes(id))b.blockAssignments.set(key,[...ids,id]);}}
 renderBattle();return true;
};
const baseLockedBlockers66=legalBlockers;
legalBlockers=function(b,attacker){const units=blockerIds(b,attacker.id).map(id=>b.creatures.find(u=>u.id===id)).filter(u=>u&&(!u.tapped||u.blockLockedTurn66===b.turn)&&canBlockCreature(u,attacker));return hasCreatureKeyword(attacker,'menace')&&units.length<2?[]:units;};

function creatureAbilityReady66(u,b=state.battle,ownChoice=false){
 if(!u||!b||b!==state.battle||!b.creatures.includes(u)||!creatureAlive(u)||!ACTIVATED66.has(u.card.name)||b.phase==='complete')return false;
 if(!ownChoice&&(jesterPending65(b)||permanentActionBusy60(b)||b.librarySearch))return false;
 if(u.card.name==='Shivan Dragon')return b.mana>=1;
 if(u.tapped||isSummoningSick(u,b.turn))return false;
 return abilityTargets66(u,b).length>0;
}
function abilityTargets66(u,b=state.battle){
 const all=jesterTargetOptions65(b);
 if(u.card.name==='Visara the Dreadful')return all.filter(o=>o.target.side!=='life');
 if(u.card.name==='Goblin Fireslinger')return all.filter(o=>o.target.side!=='player');
 if(u.card.name==='Goblin Snowman'){const ids=[...b.blockAssignments].filter(([key])=>blockerIds(b,key).includes(u.id)).map(([key])=>key);return ['blocks','damage'].includes(b.phase)?all.filter(o=>o.target.side==='enemy'&&ids.includes(o.target.id)):[];}
 return all;
}
function closeCreatureAbility66(){state.creatureAbility66=null;if($('#creature-ability-dialog').open)$('#creature-ability-dialog').close();}
function openCreatureAbility66(id){const b=state.battle,u=b?.creatures.find(x=>x.id===id);if(!u||!ACTIVATED66.has(u.card.name)||document.querySelector('dialog[open]')||jesterPending65(b))return false;state.creatureAbility66={battle:b,id};renderCreatureAbility66();$('#creature-ability-dialog').showModal();return true;}
function renderCreatureAbility66(){
 const a=state.creatureAbility66,b=state.battle,u=b?.creatures.find(x=>x.id===a?.id);if(!a)return;if(a.battle!==b||!u||b.phase==='complete')return closeCreatureAbility66();
 $('#creature-ability-title').textContent=u.card.name;$('#creature-ability-rules').textContent=effectDescriptions(u.card).join(' ');
 $('#creature-ability-cost').textContent=u.card.name==='Shivan Dragon'?'1 generic mana · no tap cost':'Tap · no mana cost (target Ward is paid separately)';
 $('#creature-ability-status').textContent=creatureAbilityReady66(u,b)?'Choose targets before paying. Cancel spends nothing.':u.card.name==='Shivan Dragon'?'Needs 1 available mana.':u.tapped?'Tapped · untaps next turn':isSummoningSick(u,b.turn)?'Summoning sickness · needs Haste or your next turn.':'No legal target in this phase.';
 $('#creature-ability-confirm').disabled=!creatureAbilityReady66(u,b);$('#creature-ability-confirm').textContent=u.card.name==='Shivan Dragon'?'+1/+0 until end of turn':'Choose target →';
}
function confirmCreatureAbility66(){
 const a=state.creatureAbility66,b=state.battle,u=b?.creatures.find(x=>x.id===a?.id);if(!a||a.battle!==b||!creatureAbilityReady66(u,b))return false;closeCreatureAbility66();
 if(u.card.name==='Shivan Dragon'){if(!payMana(1,b))return false;resolveReviewedEffect({kind:'buff',power:1,toughness:0},{side:'player',id:u.id},{card:u.card});b.mulliganAvailable=false;renderBattle();return true;}
 return openJesterChoice65({battle:b,title:`${u.card.name} · activated ability`,instruction:'Choose a legal target. Confirming taps the source. Ward may then require mana; an ability countered by Ward leaves the source tapped.',options:abilityTargets66(u,b),cancel:()=>renderBattle(),validate:chosen=>creatureAbilityReady66(u,b,true)&&abilityTargets66(u,b).some(o=>o.target.side===chosen[0].target.side&&o.target.id===chosen[0].target.id),accept:chosen=>{
  u.tapped=true;b.mulliganAvailable=false;const target=chosen[0].target,source=snapshotSource66(u);
  if(u.card.name==='Goblin Snowman'){u.blockLockedTurn66=b.turn;u.snowBlockingTurn66=b.turn;}
  queueJester65(b,done=>withJesterWard65(b,target,u.card.name,()=>{if(u.card.name==='Visara the Dreadful'){b.resolvingSpellTarget=target;removeSpellTarget('destroy');}else dealAbility66(b.creatures.includes(u)?u:source,target,1,b);},done));renderBattle();
 }});
}
$('#creature-ability-confirm').addEventListener('click',confirmCreatureAbility66);$('#creature-ability-cancel').addEventListener('click',closeCreatureAbility66);$('#creature-ability-dialog').addEventListener('cancel',e=>{e.preventDefault();closeCreatureAbility66();});
$('#creature-row').addEventListener('click',e=>{const button=e.target.closest('[data-creature-ability66]');if(button)openCreatureAbility66(button.dataset.creatureAbility66);});
const baseRescueResponses66=hasInstantResponse;
hasInstantResponse=function(b){if(baseRescueResponses66(b))return true;const mana=b.mana+b.creatures.filter(u=>canTapForMana(u,b)).reduce((n,u)=>n+manaAmount66(u.card),0);return b.creatures.some(u=>creatureAbilityReady66(u,b)||(u.card.name==='Shivan Dragon'&&creatureAlive(u)&&mana>=1&&!permanentActionBusy60(b)&&!jesterPending65(b)))||b.hand.some(c=>(isInstant(c)||hasFlash(c))&&canCastNow(c,b)&&mana>=Math.ceil(c.cmc||0));};

// Blocking Snowman prevents combat damage only; its activated ping is noncombat.
const baseSnowDamage66=dealCreatureDamage;
dealCreatureDamage=function(source,target,side,b,amount,events){if(source.snowBlockingTurn66===b.turn||target.snowBlockingTurn66===b.turn)return;return baseSnowDamage66(source,target,side,b,amount,events);};
function playerDefenders66(unit,target,b){
 if(unit.card.name!=='Taunting Elf')return [target];
 const foes=b.enemyCreatures.filter(e=>creatureAlive(e)&&canAttackEnemy(unit,e)&&canBlockCreature(e,unit)&&e.noRetaliation65!==b.turn&&(e.luredTurn66!==b.turn||e.luredBy66===unit.id));
 for(const e of foes){e.luredTurn66=b.turn;e.luredBy66=unit.id;}return foes.length?foes:[target];
}
const baseRescueCombat66=resolveCombatDamage;
resolveCombatDamage=function(attackers,assignments,side='player'){
 const b=state.battle;
 if(side==='enemy')for(const attacker of attackers){const group=assignments.get(attacker.id),units=Array.isArray(group)?group:group?[group]:[];for(const u of units)if(u.card.name==='Goblin Snowman')u.snowBlockingTurn66=b.turn;}
 const muted=side==='player'?b.enemyCreatures.filter(e=>e.luredTurn66===b.turn&&!attackers.some(u=>u.id===e.luredBy66)).map(u=>[u,u.power]):[];for(const [u] of muted)u.power=0;
 try{return baseRescueCombat66(attackers,assignments,side);}finally{for(const [u,power] of muted)u.power=power;}
};

// Variable mana is chosen before targets and payment; copies retain the chosen X.
let visibleX66=null;
function closeX66(){const q=visibleX66;visibleX66=null;if(q&&q.b.resolutionTask===q.marker)q.b.resolutionTask=q.saved||null;if($('#x-cost-dialog').open)$('#x-cost-dialog').close();return q;}
function renderX66(){const q=visibleX66;if(!q)return;const x=Number($('#x-cost-value').value),valid=Number.isSafeInteger(x)&&x>=0&&x<=Math.max(0,q.b.mana-q.base);$('#x-cost-title').textContent=q.card.name;$('#x-cost-value').max=String(Math.max(0,q.b.mana-q.base));$('#x-cost-status').textContent=valid?`X = ${x} · total ${q.base+x} generic mana · ${q.b.mana} available`:'Choose a whole number within your available mana.';$('#x-cost-confirm').disabled=!valid;}
function beginX66(index,side){const b=state.battle,card=b.hand[index];if(!canCastNow(card,b)||!paymentPlan(card,b)||document.querySelector('dialog[open]'))return false;const q={b,card,index,side,base:card.cmc,saved:b.resolutionTask,marker:{xChoice66:true},run:state.finishRun59};visibleX66=q;b.resolutionTask=q.marker;$('#x-cost-value').value='0';renderX66();$('#x-cost-dialog').showModal();return true;}
function confirmX66(){const q=visibleX66;if(!q||q.b!==state.battle||q.run!==state.finishRun59||q.b.hand[q.index]!==q.card)return false;const x=Number($('#x-cost-value').value);if(!Number.isSafeInteger(x)||x<0||q.base+x>q.b.mana)return false;closeX66();q.b.hand[q.index]={...q.card,cmc:q.base+x,xValue66:x,xBaseCmc66:q.base,xOriginal66:q.card};playCard(q.index,q.side);return true;}
$('#x-cost-value').addEventListener('input',renderX66);$('#x-cost-confirm').addEventListener('click',confirmX66);$('#x-cost-cancel').addEventListener('click',()=>{closeX66();renderBattle();});$('#x-cost-dialog').addEventListener('cancel',e=>{e.preventDefault();closeX66();renderBattle();});
for(const [id,delta] of [['x-cost-less',-1],['x-cost-more',1]])$('#'+id).addEventListener('click',()=>{const q=visibleX66;if(!q)return;$('#x-cost-value').value=String(Math.min(q.b.mana-q.base,Math.max(0,Number($('#x-cost-value').value)+delta)));renderX66();});
const baseRescuePlay66=playCard;
playCard=function(index,side='enemy'){const card=state.battle?.hand[index];if(card&&X_SPELLS66.has(card.name)&&card.xValue66===undefined)return beginX66(index,side);return baseRescuePlay66(index,side);};
const baseRescueCancel66=cancelRuleChoice;
cancelRuleChoice=function(){const b=state.battle,card=b?.choice?.card;const result=baseRescueCancel66();if(card?.xOriginal66){const i=b.hand.indexOf(card);if(i>=0)b.hand[i]=card.xOriginal66;}return result;};
if(typeof answerWardCasting52==='function'){
const baseXWardCancel66=answerWardCasting52;
answerWardCasting52=function(cast){const b=state.battle,card=b?.wardCastWarning?.p.card,result=baseXWardCancel66(cast);if(!cast&&card?.xOriginal66){const i=b.hand.indexOf(card);if(i>=0)b.hand[i]=card.xOriginal66;renderBattle();}return result;};
}
const baseRescueAsync66=resolveDiceEffect50;
resolveDiceEffect50=function(effect,target,context,resume){
 const b=state.battle,source={card:context.card,...creatureKeywords(context.card)};
 if(effect.kind==='x-hit66'){dealAbility66(source,target,context.card.xValue66||0,b);settleReviewed66(b);resume();return true;}
 if(effect.kind==='mass-damage66'){
  const amount=effect.variable?context.card.xValue66||0:effect.amount;
  for(const u of [...b.creatures,...b.enemyCreatures])if(!effect.filter||(effect.filter==='flying')===hasCreatureKeyword(u,'flying'))dealAbility66(source,{side:u.owner==='enemy'?'enemy':'player',id:u.id},amount,b);
  state.playerHealth-=amount;if(amount){playSfx('player-hit');if(typeof animatePlayerDamage==='function')animatePlayerDamage(amount);}settleReviewed66(b);if(b.phase!=='complete')resume();return true;
 }
 if(effect.kind==='index66'){
  const count=Math.min(5,b.deck.length);if(!count){resume();return true;}const cards=b.deck.slice(-count).reverse();
  openJesterChoice65({battle:b,title:'Index · order the top five',instruction:'Select every card in the order you want to draw them. First chosen = next draw. Click a selected card to undo that position. This is not drawing or shuffling.',options:cards.map(card=>({card})),min:count,max:count,accept:selected=>{b.deck.splice(b.deck.length-count,count,...selected.map(o=>o.card).reverse());addLog(`Index orders ${count} top library cards without drawing.`);resume();}});return true;
 }
 return baseRescueAsync66(effect,target,context,resume);
};

// Scry can reorder both the kept and bottom groups, not merely choose a group.
const baseRescueScry66=renderScry;
renderScry=function(){baseRescueScry66();const scry=state.battle?.scry;if(!scry)return;$('#scry-grid').querySelectorAll('[data-scry-index]').forEach(button=>{const i=Number(button.dataset.scryIndex),entry=scry.cards[i],group=scry.cards.map((e,n)=>({e,n})).filter(o=>o.e.bottom===entry.bottom),pos=group.findIndex(o=>o.n===i);const wrapper=document.createElement('div');wrapper.className='scry-slot66';button.replaceWith(wrapper);wrapper.append(button);wrapper.insertAdjacentHTML('beforeend',`<div class="scry-order66"><button type="button" data-scry-move66="${i}" data-step="-1" ${pos===0?'disabled':''} aria-label="Move ${escapeHtml(entry.card.name)} earlier">← Earlier</button><span>${entry.bottom?'Bottom':'Top'} ${pos+1}</span><button type="button" data-scry-move66="${i}" data-step="1" ${pos===group.length-1?'disabled':''} aria-label="Move ${escapeHtml(entry.card.name)} later">Later →</button></div>`);});};
$('#scry-grid').addEventListener('click',e=>{const button=e.target.closest('[data-scry-move66]'),s=state.battle?.scry;if(!button||!s)return;const i=Number(button.dataset.scryMove66),indices=s.cards.map((entry,n)=>({entry,n})).filter(o=>o.entry.bottom===s.cards[i].bottom).map(o=>o.n),j=indices[indices.indexOf(i)+Number(button.dataset.step)];if(j===undefined)return;[s.cards[i],s.cards[j]]=[s.cards[j],s.cards[i]];renderScry();});

const baseRescueCreatures66=renderCreatures;
renderCreatures=function(){baseRescueCreatures66();const b=state.battle;for(const u of b.creatures){const host=document.querySelector(`[data-host-id="${u.id}"]`),controls=host?.querySelector('.unit-controls');if(!controls)continue;if(ACTIVATED66.has(u.card.name)){controls.classList.add('has-reviewed-ability66');controls.insertAdjacentHTML('beforeend',`<button type="button" data-creature-ability66="${u.id}" aria-haspopup="dialog" aria-label="${escapeHtml(u.card.name)} abilities">Ability</button>`);}if(MANA_CREATURES66.has(u.card.name)){const button=controls.querySelector('[data-unit-mana]');if(button)button.textContent=`+${manaAmount66(u.card)}`;}}};
const baseTypedBoard66=renderEnemyBoard;
renderEnemyBoard=function(){baseTypedBoard66();for(const enemy of state.battle.enemyCreatures){const figure=document.querySelector(`[data-enemy-attacker="${enemy.id}"] .monster-figure`);figure?.insertAdjacentHTML('beforeend',`<span class="enemy-type66" title="${escapeHtml(enemy.card.type_line)}">${escapeHtml(enemy.card.type_line)}</span>`);}};
const baseRescueBonus66=bonusMarkup;
bonusMarkup=function(u){return baseRescueBonus66(u)+(u.minusCounters66?`<span class="minus-counter66">−${u.minusCounters66}/−${u.minusCounters66} counter</span>`:'');};
const baseRescueBattle66=renderBattle;
renderBattle=function(){const b=state.battle;if(b){for(const unit of [...b.creatures,...b.enemyCreatures])announceEntry66(unit,b);settleReviewed66(b);}const result=baseRescueBattle66();renderCreatureAbility66();if(visibleX66&&(visibleX66.b!==state.battle||state.battle.phase==='complete'))closeX66();return result;};
const baseRescueScene66=showScreen;
showScreen=function(id){if(id!=='combat-screen'){closeX66();closeCreatureAbility66();}return baseRescueScene66(id);};
const baseRescueChoiceRender66=renderJesterChoice65;
renderJesterChoice65=function(){baseRescueChoiceRender66();const q=visibleJesterChoice65;if(!q)return;const eyebrow=$('#jester-choice-dialog .eyebrow');if(eyebrow)eyebrow.textContent=/Jester|Masquerade|Vault 21/.test(q.title)?'JESTER’S TABLE':'CARD RULES';if(q.title==='Index · order the top five')$('#jester-choice-status').textContent=`Next draws: ${[...q.selected].map(i=>q.options[i].card.name).join(' → ')||'choose the next card first'}`;};
const REVIEW_DESCRIPTIONS66={
 'Soul Warden':['Whenever another creature enters, gain 1 life. Includes your creatures, tokens, Persist returns, enemy arrivals and new waves; does not trigger for itself.'],
 "Soul's Attendant":['Whenever another creature enters, you may gain 1 life. Choose gain or decline for each entry. Includes enemies, tokens and Persist; not itself.'],
 'Essence Warden':['Whenever another creature enters, gain 1 life. Includes enemies and new waves, your creatures, tokens and Persist returns; not itself.'],
 'Taunting Elf':['Lure adaptation for individual duels: when its attack resolves, all enemies able to block it join that combat and retaliate. Flying/Reach restrictions still apply.','Each forced defender is occupied by this Elf for the rest of this combat; allies attacking afterward avoid its retaliation. Queuing or withdrawing does not trigger Lure.'],
 'Blaze':['Choose X before choosing a target. Pay X + 1 generic mana: deal X damage to any creature or your life. X may be zero.','Cancel before casting pays nothing. Target Ward is additional; spell copies keep the same X and target. Printed mana value outside the stack is 1.'],
 'Index':['Look at up to five top library cards and put them back in any order. Choose every card in the order you want to draw it; first selected is the next draw.','No draw, discard or shuffle occurs. An empty library is safe. Spell copies perform separate orderings.'],
 'Read the Bones':['Scry 2, then draw 2, then lose 2 life. Choose top/bottom and reorder either group with Earlier/Later.','Drawing from an empty library loses the run before later effects. A countered spell does not scry, draw or lose life. Each copy resolves separately.'],
 'Flight of Fancy':['Enchant any creature. That creature has Flying while this Aura remains attached. When the Aura enters, draw 2.','The entry trigger still resolves if the Aura later leaves. The Aura goes to the graveyard when its host leaves. Countered casts do not attach or draw.'],
 'Goblin Fireslinger':['Tap: deal 1 damage to a player (an enemy monster or your life). Cannot target your creatures.','Duel target adaptation: monsters represent opposing players. Choose before tapping. Enemy Hexproof and Ward apply. Summoning sickness requires Haste or a later turn.'],
 'Prodigal Pyromancer':['Tap: deal 1 damage to any creature or your life. Choose before tapping. Enemy Hexproof and Ward apply. Summoning sickness requires Haste or a later turn.'],
 'Prodigal Sorcerer':['Tap: deal 1 damage to any creature or your life. Choose before tapping. Enemy Hexproof and Ward apply. Summoning sickness requires Haste or a later turn.'],
 'Goblin Snowman':['Whenever it blocks, prevent all combat damage dealt to and by it for this turn. Does not prevent noncombat damage or Trample spilling past it.','Tap: deal 1 noncombat damage to a creature it is currently blocking. Tapping after blocking does not remove its block. Enemy Ward/Hexproof and summoning sickness apply.'],
 'Murderous Redcap':['When it enters, choose any creature or your life. Deal damage equal to its power when the trigger resolves (last known power if it left). Enemy Hexproof and Ward apply.','Persist: when it dies without a -1/-1 counter, return the same physical card with a -1/-1 counter and trigger entry again. Exile is not death. The counter lasts for this encounter; run upgrades remain.','Opposing +1/+1 and -1/-1 counters cancel on the battlefield. A Clone that had Persist returns as Clone and chooses a new copy. A full six-creature field prevents return and leaves the card in the graveyard.'],
 'Thunderclap Wyvern':['Flash and Flying. Can be cast during response windows. Other creatures you control with Flying get +1/+1 while it stays on the battlefield.','Includes creatures given Flying by an Aura or run counter. Multiple Wyverns boost one another; a Wyvern does not boost itself. This is a static bonus, not a counter.'],
 'Shivan Dragon':['Flying. Pay 1 generic mana: this creature gets +1/+0 until end of turn. No tap cost.','May activate multiple times, while tapped or on its entry turn. The bonus expires at the next normal turn cleanup and is separate from permanent counters.'],
 'Visara the Dreadful':['Flying. Tap: destroy target creature; it cannot be regenerated. Choose an enemy or your creature before tapping.','Summoning sickness applies. Enemy Hexproof and Ward apply. The ability is not a spell and cannot be stopped by enemy Counterspell. Destroyed Redcaps can trigger Persist.'],
 'Inferno':['Instant: deal 6 simultaneous damage to every creature on both sides and 6 to your life. Each monster is hit once in the duel adaptation.','Untargeted: ignores Hexproof and Ward. Creature deaths and Persist are checked after all damage. Your death ends the run; a countered spell does nothing.'],
 'Hurricane':['Choose X; pay X + 1 generic mana. Deal X damage to all Flying creatures on both sides and to your life.','Duel adaptation: enemy monsters count once as creatures, filtered by Flying. Untargeted: Hexproof and Ward do not prevent it. Copies use the same X.'],
 'Earthquake':['Choose X; pay X + 1 generic mana. Deal X damage to all creatures without Flying on both sides and to your life.','Duel adaptation: enemy monsters count once as creatures, filtered by Flying. Untargeted: Hexproof and Ward do not prevent it. Copies use the same X.']
};
const baseRescueDescriptions66=effectDescriptions;
effectDescriptions=function(card){
 let lines=MANA_CREATURES66.has(card.name)?[`${hasKeywordLine(card.oracle_text||'','flying')?'Flying. ':''}Tap: add ${manaAmount66(card)} floating generic mana. Printed colored production becomes generic mana in this game.`,'Summoning sickness requires Haste or your next turn. Floating mana is spent first and expires normally. Tapping after declaring a block keeps that block.']:REVIEW_DESCRIPTIONS66[card.name];
 if(!lines)return baseRescueDescriptions66(card);lines=[...lines];const counters=typeof runCounterLabels60==='function'?runCounterLabels60(card):[];if(counters.length)lines.push(`Run counters on this copy: ${counters.join(' · ')}.`);if(card.conjuredByMask64)lines.push('Conjured for this battle by Jester’s Mask; not added to your run deck.');return lines;
};
const baseRescueSummary66=draftAbilitySummary;
draftAbilitySummary=function(card){if(MANA_CREATURES66.has(card.name))return `Tap: add ${manaAmount66(card)} generic mana.`;return {'Soul Warden':'Another creature enters: gain 1 life.',"Soul's Attendant":'Another creature enters: you may gain 1 life.','Essence Warden':'Another creature enters: gain 1 life.','Taunting Elf':'Lure: all eligible foes join its duel.','Blaze':'Pay X + 1: deal X to any target.','Index':'Reorder the top five library cards.','Read the Bones':'Scry 2, draw 2, lose 2 life.','Flight of Fancy':'Aura: Flying. On entry: draw 2.','Goblin Fireslinger':'Tap: 1 damage to an enemy or your life.','Goblin Snowman':'Safe combat blocks. Tap: ping the attacker it blocks.','Murderous Redcap':'On entry: damage equal to power. Persist.','Thunderclap Wyvern':'Flash, Flying. Other friendly flyers get +1/+1.','Shivan Dragon':'Flying. Pay 1: +1/+0 this turn.','Visara the Dreadful':'Flying. Tap: destroy a creature.','Inferno':'6 damage to all creatures and your life.','Hurricane':'X damage to flyers and your life.','Earthquake':'X damage to nonflyers and your life.','Prodigal Pyromancer':'Tap: 1 damage to any target.','Prodigal Sorcerer':'Tap: 1 damage to any target.'}[card.name]||baseRescueSummary66(card);};
const baseRescueCatalog66=collectionEntryMarkup;
collectionEntryMarkup=function(card,index,kind){const html=baseRescueCatalog66(card,index,kind);return kind==='catalog'&&ADAPTED66.has(card.name)?html.replace('Playable · reviewed rules','Playable · duel adaptation'):html;};
$('#permanent-row').addEventListener('wheel',event=>{const row=event.currentTarget;if(row.scrollWidth<=row.clientWidth||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;const step=event.deltaMode===1?16:event.deltaMode===2?row.clientWidth:1;row.scrollLeft+=event.deltaY*step;event.preventDefault();},{passive:false});
