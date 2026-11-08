/* Reviewed card rules. Unsupported cards stay visible in the catalog but never enter a run. */
const REVIEWED_PERMANENTS = new Set(['Holy Strength','Unholy Strength','Rancor','Bonesplitter','Short Sword','Leonin Scimitar','Trusty Machete','Glorious Anthem','Fountain of Renewal','Omen of the Sea','Angelic Chorus','Bone Saw','Greatsword','Vulshok Morningstar']);
const SPECIAL_CREATURES = new Set(['Juggernaut','Llanowar Elves','Clone']);
const SPELL_RULES = {
 'Dark Ritual':{effects:[{kind:'mana',amount:3}]},
 'Pyretic Ritual':{effects:[{kind:'mana',amount:3}]},
 'Seething Song':{effects:[{kind:'mana',amount:5}]},
 'Disenchant':{target:'artifact-or-enchantment',effects:[{kind:'destroy'}]},
 'Naturalize':{target:'artifact-or-enchantment',effects:[{kind:'destroy'}]},
 "Angel's Mercy":{effects:[{kind:'heal',amount:7}]},
 'Lightning Bolt':{target:'any',effects:[{kind:'damage',amount:3}]},
 'Shock':{target:'any',effects:[{kind:'damage',amount:2}]},
 'Lightning Strike':{target:'any',effects:[{kind:'damage',amount:3}]},
 'Revitalize':{effects:[{kind:'heal',amount:3},{kind:'draw',amount:1}]},
 'Divination':{effects:[{kind:'draw',amount:2}]},
 'Battlegrowth':{target:'creature',effects:[{kind:'counter',amount:1}]},
 'Giant Growth':{target:'creature',effects:[{kind:'buff',power:3,toughness:3,temporary:true}]},
 'Titanic Growth':{target:'creature',effects:[{kind:'buff',power:4,toughness:4,temporary:true}]},
 'Murder':{target:'creature',effects:[{kind:'destroy'}]},
 'Unmake':{target:'creature',effects:[{kind:'exile'}]},
 'Village Rites':{sacrifice:1,effects:[{kind:'draw',amount:2}]},
 "Altar's Reap":{sacrifice:1,effects:[{kind:'draw',amount:2}]},
 'Thrill of Possibility':{discard:1,effects:[{kind:'draw',amount:2}]},
 'Cathartic Reunion':{discard:2,effects:[{kind:'draw',amount:3}]},
 'Raise Dead':{target:'grave-creature',effects:[{kind:'return-hand'}]},
 'Doublecast':{effects:[{kind:'copy-next'}]},
 'Snakeskin Veil':{target:'own-creature',effects:[{kind:'counter',amount:1},{kind:'keywords',keywords:['hexproof'],temporary:true}]},
 'Hunger of the Howlpack':{target:'creature',effects:[{kind:'morbid-counter'}]},
 'Invigorating Surge':{target:'own-creature',effects:[{kind:'counter',amount:1},{kind:'double-counters'}]}
};
const MANUAL_BANS = {
 Cancel:'A true counterspell needs an opposing spell stack. Cancelling a monster attack is not its printed effect.',
 Reverberate:'Copying an opposing spell and choosing its targets is not implemented. Use Doublecast for your next own instant or sorcery.',
 Duress:'Opponents do not have a hand from which to choose a noncreature, nonland card.'
};
function rulesAudit(card){
 if(MANUAL_BANS[card.name])return{playable:false,reason:MANUAL_BANS[card.name]};
 if(isLand(card))return{playable:true,reason:'Generic mana source.'};
 if(SPELL_RULES[card.name]||REVIEWED_PERMANENTS.has(card.name)||SPECIAL_CREATURES.has(card.name))return{playable:true,reason:'Reviewed costs, targets and effects.'};
 const unknown=printedKeywords(card).filter(keyword=>!COMBAT_KEYWORDS.includes(keyword));
 if(isCreature(card)&&!unknown.length&&/^\d+$/.test(String(card.power))&&/^\d+$/.test(String(card.toughness))){
  const text=(card.oracle_text||'').replace(/\([^)]*\)/g,'').trim();
  const remaining=text.split(/[\n,]/).map(line=>line.trim().toLowerCase()).filter(Boolean).filter(line=>!COMBAT_KEYWORDS.includes(line));
  if(!remaining.length)return{playable:true,reason:'Fixed stats and supported combat keywords.'};
 }
 return{playable:false,reason:unknown.length?`Not implemented: ${unknown.join(', ')}.`:'This card has an unimplemented trigger, cost, target restriction or variable effect. No substitute damage effect is used.'};
}
function playableCards(cards){return cards.filter(card=>rulesAudit(card).playable);}
const originalLoadCardPool=loadCardPool;
loadCardPool=async function(){const result=await originalLoadCardPool();state.catalogPool=result.cards;return{...result,cards:playableCards(result.cards)};};
const originalChooseRandom=chooseRandomCards;
chooseRandomCards=function(source,count){return originalChooseRandom(playableCards(source),count).map(card=>rulesAudit(card).playable?card:playableCards(BUNDLED_CARDS)[0]);};
const originalMakeStarterPacks=makeStarterPacks;
makeStarterPacks=function(){state.pool=playableCards(state.pool);return originalMakeStarterPacks().map(pack=>pack.map(card=>rulesAudit(card).playable?card:playableCards(BUNDLED_CARDS)[0]));};
const originalShowShop=showShop;
showShop=function(){state.pool=playableCards(state.pool);if(state.shop?.offers.some(offer=>!rulesAudit(offer.card).playable))state.shop=null;return originalShowShop();};
const originalCardEffects=cardEffects;
cardEffects=function(card,creature=isCreature(card)){if(SPELL_RULES[card.name])return SPELL_RULES[card.name].effects;return rulesAudit(card).playable?originalCardEffects(card,creature):[];};
const originalCanCastNow=canCastNow;
canCastNow=function(card,battle=state.battle){
 if(!card||!originalCanCastNow(card,battle)||!rulesAudit(card).playable||battle.choice)return false;
 const rule=SPELL_RULES[card.name];
 if(rule?.discard&&battle.hand.length-1<rule.discard)return false;
 if(rule?.sacrifice&&!battle.creatures.length)return false;
 if(rule?.target&&!ruleTargetOptions(rule.target,battle).length)return false;
 if(card.name==='Clone'&&(!battle.creatures.length||battle.creatures.length>=3))return false;
 return true;
};
function ruleTargetOptions(kind,battle=state.battle){
 if(kind==='grave-creature')return battle.graveyard.map((card,index)=>({key:`grave:${index}`,card,index})).filter(item=>isCreature(item.card));
 const own=battle.creatures.map(unit=>({key:`player:${unit.id}`,unit,card:unit.card}));
 const enemies=battle.enemyCreatures.filter(unit=>!hasCreatureKeyword(unit,'hexproof')).map(unit=>({key:`enemy:${unit.id}`,unit,card:unit.card}));
 if(kind==='own-creature'||kind==='clone')return own;
 const result=[...own,...enemies];
 if(kind==='any')result.push({key:'life:player',label:'Your life',description:`${state.playerHealth} life`});
 return result;
}
function parseRuleTarget(key,battle=state.battle){
 if(key==='life:player')return{side:'life'};
 if(key.startsWith('grave:'))return{side:'grave',index:Number(key.slice(6))};
 const split=key.indexOf(':');return{side:key.slice(0,split),id:key.slice(split+1)};
}
function choiceTargetUnit(target,battle=state.battle){return target?.side==='player'?battle.creatures.find(unit=>unit.id===target.id):target?.side==='enemy'?battle.enemyCreatures.find(unit=>unit.id===target.id):null;}
const originalPlayCard=playCard;
playCard=function(index,targetSide='enemy'){
 const battle=state.battle;const card=battle?.hand[index];if(!card)return;
 if(!rulesAudit(card).playable)return showActionError(`Banned: ${rulesAudit(card).reason}`);
 if(!canCastNow(card,battle)||!paymentPlan(card))return showActionError('This card needs a legal target, payable mana and all additional costs.');
 const rule=SPELL_RULES[card.name]||(isAura(card)?{target:'creature',effects:[{kind:'aura'}]}:null);
 if(!rule&&card.name!=='Clone')return originalPlayCard(index,targetSide);
 const pending={card,index,rule:rule||{target:'clone',effects:[{kind:'clone'}]},steps:[],picks:{},selected:new Set()};
 if(pending.rule.target){
  const requested=battle.pendingSpellTarget;
  const key=requested?`${requested.side}:${requested.id}`:null;
  if(key&&ruleTargetOptions(pending.rule.target,battle).some(item=>item.key===key))pending.picks.target=[key];
  else pending.steps.push({kind:'target',count:1,title:pending.rule.target.startsWith('opposing-')?'Choose the enemy spell to counter':pending.rule.target==='grave-creature'?'Choose a creature from your graveyard':pending.rule.target==='own-creature'?'Choose a creature you control':pending.rule.target==='clone'?'Choose a creature to copy':'Choose a legal target'});
 }
 if(pending.rule.discard)pending.steps.push({kind:'discard',count:pending.rule.discard,title:`Discard ${pending.rule.discard} other card${pending.rule.discard>1?'s':''} as an additional cost`});
 if(pending.rule.sacrifice)pending.steps.push({kind:'sacrifice',count:1,title:'Sacrifice a creature you control as an additional cost'});
 battle.pendingSpellTarget=null;
 if(pending.steps.length){battle.choice=pending;renderRuleChoice();$('#rule-dialog').showModal();}
 else commitRuleSpell(pending);
};
function choiceOptions(pending){
 const battle=state.battle;const step=pending.steps[0];
 if(step.kind==='target')return ruleTargetOptions(pending.rule.target,battle);
 if(step.kind==='discard')return battle.hand.map((card,index)=>({key:String(index),card})).filter(item=>Number(item.key)!==pending.index);
 return battle.creatures.map(unit=>({key:unit.id,card:unit.card,unit}));
}
function renderRuleChoice(){
 const p=state.battle.choice;const step=p.steps[0];$('#rule-title').textContent=p.card.name;$('#rule-instruction').textContent=step.title;
 $('#rule-options').innerHTML=choiceOptions(p).map(option=>`<button type="button" data-rule-pick="${escapeHtml(option.key)}" class="${p.selected.has(option.key)?'selected':''}" aria-pressed="${p.selected.has(option.key)}">${option.card?cardFace(option.card):`<span class="rule-life">♥ ${state.playerHealth}</span>`}<b>${escapeHtml(option.card?.name||option.label)}</b>${option.unit&&typeof option.unit.power==='number'?`<small>${option.unit.power} power · ${option.unit.owner==='enemy'?option.unit.health+' life':option.unit.toughness+' toughness'}</small>`:''}${option.unit?.owner==='enemy'&&typeof wardCost==='function'&&wardCost(option.unit)?`<small class="rule-ward">Ward (${wardCost(option.unit)} mana)</small>`:''}</button>`).join('');
 $('#rule-confirm').disabled=p.selected.size!==step.count;$('#rule-confirm').textContent=p.steps.length>1?'Next choice →':'Pay costs & cast →';$('#rule-progress').textContent=`Selected ${p.selected.size} / ${step.count}. No costs are paid until every choice is confirmed.`;
}
function selectRuleChoice(key){const p=state.battle?.choice;if(!p||!choiceOptions(p).some(option=>option.key===key))return;const count=p.steps[0].count;if(p.selected.has(key))p.selected.delete(key);else{if(count===1)p.selected.clear();if(p.selected.size<count)p.selected.add(key);}renderRuleChoice();}
function confirmRuleChoice(){const p=state.battle?.choice;if(!p||p.selected.size!==p.steps[0].count)return;p.picks[p.steps.shift().kind]=[...p.selected];p.selected.clear();if(p.steps.length)return renderRuleChoice();state.battle.choice=null;$('#rule-dialog').close();commitRuleSpell(p);}
function cancelRuleChoice(){if(state.battle)state.battle.choice=null;$('#rule-dialog').close();}
function sacrificeRuleCreature(unit){
 const battle=state.battle;const index=battle.creatures.indexOf(unit);if(index<0)return false;battle.creatures.splice(index,1);if(!unit.isToken)battle.graveyard.push(unit.originalCard||unit.card);cleanupAttachments(new Set([unit.id]));battle.creatureDiedThisTurn=true;addLog(`${unit.card.name} is sacrificed.`);return true;
}
function commitRuleSpell(p){
 const battle=state.battle;if(!battle||battle.phase==='complete'||battle.hand[p.index]!==p.card||!paymentPlan(p.card))return false;
 const targetKey=p.picks.target?.[0];
 if(p.rule.target&&!ruleTargetOptions(p.rule.target,battle).some(option=>option.key===targetKey))return false;
 const discards=(p.picks.discard||[]).map(Number);const sacrifices=(p.picks.sacrifice||[]).map(id=>battle.creatures.find(unit=>unit.id===id));
 if(discards.length!==(p.rule.discard||0)||new Set(discards).size!==discards.length||discards.some(index=>index===p.index||!battle.hand[index])||sacrifices.length!==(p.rule.sacrifice||0)||sacrifices.some(unit=>!unit))return false;
 if(!payMana(p.card.cmc,battle))return false;
 const target=targetKey?parseRuleTarget(targetKey,battle):null;const copiedCreature=p.card.name==='Clone'?choiceTargetUnit(target):null;
 const graveCard=target?.side==='grave'?battle.graveyard[target.index]:null;
 const spell=isInstant(p.card)||/\bSorcery\b/.test(p.card.type_line);const copies=spell?1+(battle.copyNextSpell||0):1;if(spell)battle.copyNextSpell=0;
 const removed=new Set([p.index,...discards]);for(const index of discards)battle.graveyard.push(battle.hand[index]);battle.hand=battle.hand.filter((card,index)=>!removed.has(index));
 for(const unit of sacrifices)sacrificeRuleCreature(unit);
 if(isCreature(p.card)){
  const copied=copiedCreature?.card;if(!copied||battle.creatures.length>=3)return false;
  const stats=parseStats(copied);const unit={id:`player-${state.nextPermanentId++}`,card:{...copied},originalCard:p.card,owner:'player',...stats,...creatureKeywords(copied),summonedTurn:battle.turn,summoningSick:true,tapped:false,willAttack:false,attackedThisTurn:false};battle.creatures.push(unit);refreshPermanentEffects();onCreatureEntered(unit);
 }else if(isAura(p.card)){
  battle.permanents.push({id:`permanent-${state.nextPermanentId++}`,card:p.card,attachedTo:target.id});
 }else{
  battle.graveyard.push(p.card);
  for(let copy=0;copy<copies;copy++){
   let chosen=target;
   // Copies keep the chosen target and fizzle if an earlier copy removed it.
   if(copy&&p.rule.target&&target?.side!=='grave'&&target?.side!=='life'&&!choiceTargetUnit(target))break;
   for(const effect of p.rule.effects)resolveReviewedEffect(effect,chosen,{graveCard,isCopy:copy>0,card:p.card});
   if(battle.phase==='complete')break;
  }
  if(copies>1)addLog(`${p.card.name} resolved with ${copies-1} spell copy. Additional costs were paid once; copies kept the chosen target.`);
 }
 battle.mulliganAvailable=false;refreshPermanentEffects();battle.creatures=removeDeadCreatures(battle.creatures,'player');battle.enemyCreatures=removeDeadCreatures(battle.enemyCreatures,'enemy');
 addLog(`${p.card.name} resolves.`);playSfx('cast');if(!battle.enemyCreatures.length)return winBattle();renderBattle();return true;
}
function resolveReviewedEffect(effect,target,context={}){
 const battle=state.battle;const unit=choiceTargetUnit(target,battle);
 if(effect.kind==='damage'){
  if(target?.side==='life'){state.playerHealth-=effect.amount;if(effect.amount>0)playSfx('player-hit');if(typeof animatePlayerDamage==='function')animatePlayerDamage(effect.amount);}
  else if(unit?.owner==='enemy')damageFirstEnemy(effect.amount,unit);
  else if(unit){unit.damage=(unit.damage||0)+effect.amount;if(effect.amount>0)playSfx('player-hit');}
 }
 if(effect.kind==='heal')state.playerHealth+=effect.amount;
 if(effect.kind==='draw')for(let n=0;n<effect.amount&&battle.phase!=='complete';n++)drawOneCard();
 if(effect.kind==='copy-next')battle.copyNextSpell=(battle.copyNextSpell||0)+1;
 if(effect.kind==='return-hand'&&!context.isCopy){const index=battle.graveyard.indexOf(context.graveCard);if(index>=0)battle.hand.push(...battle.graveyard.splice(index,1));}
 if(effect.kind==='destroy'||effect.kind==='exile'){
  if(unit){battle.resolvingSpellTarget={side:target.side,id:unit.id};if(effect.kind==='destroy')battle.creatureDiedThisTurn=true;removeSpellTarget(effect.kind);}
 }
 if(['counter','morbid-counter','double-counters'].includes(effect.kind)&&unit){
  let amount=effect.kind==='morbid-counter'?(battle.creatureDiedThisTurn?3:1):effect.kind==='double-counters'?(unit.counterPower||0):effect.amount;
  unit.counterPower=(unit.counterPower||0)+amount;unit.counterToughness=(unit.counterToughness||0)+amount;unit.power+=amount;
  if(unit.owner==='enemy'){unit.health+=amount;unit.maxHealth+=amount;}else unit.toughness+=amount;
 }
 if(effect.kind==='buff'&&unit){unit.power+=effect.power;if(unit.owner==='enemy'){unit.health+=effect.toughness;unit.maxHealth+=effect.toughness;}else unit.toughness+=effect.toughness;battle.turnEffects.push({creatureId:unit.id,power:effect.power,toughness:effect.toughness,owner:unit.owner});}
 if(effect.kind==='keywords'&&unit){unit.temporaryKeywords||=[];for(const keyword of effect.keywords){unit.temporaryKeywords.push(keyword);battle.turnEffects.push({creatureId:unit.id,keyword,owner:unit.owner});}}
 if(state.playerHealth<=0)endRun(false);
}
const originalRemoveDead=removeDeadCreatures;
removeDeadCreatures=function(creatures,owner='player',clearDamage=false){
 const dead=creatures.filter(unit=>!creatureAlive(unit));if(dead.length&&state.battle)state.battle.creatureDiedThisTurn=true;
 const result=originalRemoveDead(creatures,owner,clearDamage);
 if(owner==='enemy'&&dead.length)cleanupAttachments(new Set(dead.map(unit=>unit.id)));
 if(owner==='player')for(const unit of dead.filter(unit=>unit.originalCard&&!unit.isToken)){const i=state.battle.graveyard.lastIndexOf(unit.card);if(i>=0)state.battle.graveyard[i]=unit.originalCard;}
 return result;
};
const originalRemoveSpellTarget=removeSpellTarget;
removeSpellTarget=function(kind){const battle=state.battle;const target=battle.resolvingSpellTarget;const unit=choiceTargetUnit(target,battle);if(unit&&kind==='destroy')battle.creatureDiedThisTurn=true;originalRemoveSpellTarget(kind);if(unit?.owner==='enemy')cleanupAttachments(new Set([unit.id]));if(unit?.originalCard){const zone=kind==='exile'?battle.exile:battle.graveyard;const index=zone.lastIndexOf(unit.card);if(index>=0)zone[index]=unit.originalCard;}};
const originalExpireTurnEffects=expireTurnEffects;
expireTurnEffects=function(battle){const enemyEffects=battle.turnEffects.filter(effect=>effect.owner==='enemy');battle.turnEffects=battle.turnEffects.filter(effect=>effect.owner!=='enemy');originalExpireTurnEffects(battle);for(const effect of enemyEffects){const enemy=battle.enemyCreatures.find(unit=>unit.id===effect.creatureId);if(!enemy)continue;if(effect.power!==undefined)enemy.power-=effect.power;if(effect.toughness!==undefined){enemy.maxHealth-=effect.toughness;enemy.health-=effect.toughness;}if(effect.keyword)enemy.temporaryKeywords=enemy.temporaryKeywords.filter(keyword=>keyword!==effect.keyword);}battle.copyNextSpell=0;battle.creatureDiedThisTurn=false;};
const originalEffectDescriptions=effectDescriptions;
effectDescriptions=function(card){
 const audit=rulesAudit(card);if(!audit.playable)return['BANNED — excluded from boosters, shop and new decks.',audit.reason];
 const rule=SPELL_RULES[card.name];if(!rule){if(card.name==='Clone')return['Choose a creature you control and enter as a copy of its printed characteristics, including abilities.','Does not copy counters, equipment, auras, damage or tapped status. Clone itself goes to the graveyard when the copy dies.'];return originalEffectDescriptions(card);}
 const lines=[];
 if(rule.target)lines.push(rule.target==='grave-creature'?'Choose a creature card in your graveyard.':rule.target==='own-creature'?'Choose a creature you control.':rule.target==='any'?'Choose a creature, monster or your life. Enemy Hexproof prevents targeting.':'Choose a creature or monster. Enemy Hexproof prevents targeting.');
 if(rule.discard)lines.push(`Additional cost: choose and discard ${rule.discard} other card${rule.discard>1?'s':''}. Nothing is paid if you cancel.`);
 if(rule.sacrifice)lines.push('Additional cost: choose and sacrifice one creature you control. This is not damage or destruction.');
 for(const effect of rule.effects){
  if(effect.kind==='damage')lines.push(`Deal ${effect.amount} damage to the chosen target.`);
  if(effect.kind==='heal')lines.push(`Gain ${effect.amount} life.`);
  if(effect.kind==='mana')lines.push(`Add ${effect.amount} floating generic mana. Spend it this turn; unused floating mana expires at turn end.`);
  if(effect.kind==='draw')lines.push(`Draw ${effect.amount} cards, one at a time. Drawing from an empty library loses the run.`);
  if(effect.kind==='counter')lines.push(`Put ${effect.amount} permanent +1/+1 counter on the chosen creature.`);
  if(effect.kind==='morbid-counter')lines.push('Put one +1/+1 counter on the target, or three if any creature died this turn. Sacrifice counts; exile does not.');
  if(effect.kind==='double-counters')lines.push('Double only the target’s +1/+1 counters, including the one just added. Auras, equipment and temporary bonuses do not count.');
  if(effect.kind==='buff')lines.push(`The chosen creature gets ${signed(effect.power)}/${signed(effect.toughness)} until end of turn.`);
  if(effect.kind==='keywords')lines.push(`The chosen creature gains ${effect.keywords.join(', ')} until end of turn.`);
  if(effect.kind==='copy-next')lines.push('Copy your next instant or sorcery this turn. No extra mana, discard or sacrifice is paid. Copies keep the chosen target; the effect expires at turn end.');
  if(effect.kind==='return-hand')lines.push('Return the chosen creature card from your graveyard to your hand. It is not cast.');
  if(effect.kind==='destroy')lines.push('Destroy the chosen creature. It goes to the graveyard.');
  if(effect.kind==='exile')lines.push('Exile the chosen creature for this encounter. This is not a death.');
 }
 return lines;
};
const originalCardAudit=cardAudit;
cardAudit=function(card){const result=originalCardAudit(card);return{...result,adapted:false,...rulesAudit(card)};};
$('#rule-options').addEventListener('click',event=>{const button=event.target.closest('[data-rule-pick]');if(button)selectRuleChoice(button.dataset.rulePick);});
$('#rule-confirm').addEventListener('click',confirmRuleChoice);
$('#rule-cancel').addEventListener('click',cancelRuleChoice);
$('#rule-dialog').addEventListener('cancel',event=>{event.preventDefault();cancelRuleChoice();});
const originalHasInstantResponse=hasInstantResponse;
hasInstantResponse=function(battle){return battle.hand.some(card=>(isInstant(card)||hasFlash(card))&&canCastNow(card,battle)&&paymentPlan(card))||battle.permanents.some(permanent=>canActivatePermanent(permanent,battle));};
$('#collection-rules').addEventListener('change',renderCollection);

const originalRefreshPermanents=refreshPermanentEffects;
refreshPermanentEffects=function(){
 originalRefreshPermanents();const battle=state.battle;if(!battle)return;
 for(const enemy of battle.enemyCreatures){
  const oldP=enemy.auraPower||0,oldT=enemy.auraToughness||0;const damage=enemy.maxHealth-enemy.health;
  enemy.power-=oldP;enemy.maxHealth-=oldT;enemy.auraPower=0;enemy.auraToughness=0;enemy.permanentKeywords=[];
  for(const permanent of battle.permanents.filter(item=>item.attachedTo===enemy.id)){const effect=permanentEffect(permanent.card);enemy.auraPower+=effect.power;enemy.auraToughness+=effect.toughness;enemy.permanentKeywords.push(...effect.keywords);}
  enemy.power+=enemy.auraPower;enemy.maxHealth+=enemy.auraToughness;enemy.health=Math.max(0,enemy.maxHealth-damage);
 }
};
const originalDraftAbilitySummary=draftAbilitySummary;
draftAbilitySummary=function(card){
 const rule=SPELL_RULES[card.name];if(!rule)return card.name==='Clone'?'Enters as a copy of a creature’s printed stats and abilities. Counters and attachments are not copied.':originalDraftAbilitySummary(card);
 const parts=[];if(rule.discard)parts.push(`Discard ${rule.discard} other card${rule.discard>1?'s':''} as a cost.`);if(rule.sacrifice)parts.push('Sacrifice an ally as a cost.');
 if(rule.target==='own-creature')parts.push('Target: your creature.');
 for(const effect of rule.effects){
  if(effect.kind==='damage')parts.push(`Deal ${effect.amount} damage to a chosen target.`);
  if(effect.kind==='draw')parts.push(`Draw ${effect.amount}.`);
  if(effect.kind==='heal')parts.push(`Gain ${effect.amount} life.`);
  if(effect.kind==='counter')parts.push(`Put ${effect.amount} +1/+1 counter on the target.`);
  if(effect.kind==='morbid-counter')parts.push('+1/+1 counter; three instead if a creature died this turn.');
  if(effect.kind==='double-counters')parts.push('Then double its +1/+1 counters.');
  if(effect.kind==='buff')parts.push(`${signed(effect.power)}/${signed(effect.toughness)} until end of turn.`);
  if(effect.kind==='keywords')parts.push(`${effect.keywords.join(', ')} until end of turn.`);
  if(effect.kind==='copy-next')parts.push('Copy your next instant or sorcery this turn. No extra costs.');
  if(effect.kind==='destroy')parts.push('Destroy a chosen creature.');
  if(effect.kind==='exile')parts.push('Exile a chosen creature.');
  if(effect.kind==='return-hand')parts.push('Return a creature card from your graveyard to your hand.');
 }
 return parts.join(' ');
};
