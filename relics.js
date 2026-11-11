/* Reviewed iconic mana artifacts and legendary creatures. Costs remain generic. */
for(const name of ['Black Lotus','Sol Ring'])REVIEWED_PERMANENTS.add(name);
SPECIAL_CREATURES.add("Syr Alin, the Lion's Claw");
const RELIC_MANA58={'Black Lotus':3,'Sol Ring':2};
const baseRelicEffects58=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return card.name in RELIC_MANA58||card.name==="Syr Alin, the Lion's Claw"?[]:baseRelicEffects58(card,creature);};
const baseRelicCost58=permanentActivationCost;
permanentActivationCost=function(card){return card.name in RELIC_MANA58?0:baseRelicCost58(card);};
const baseRelicLabel58=permanentActivationLabel51;
permanentActivationLabel51=function(permanent){
 if(!(permanent.card.name in RELIC_MANA58))return baseRelicLabel58(permanent);
 return permanent.tapped?'Tapped · untaps next turn':permanent.card.name==='Black Lotus'?'Tap · sacrifice · add 3 mana':'Tap · add 2 mana';
};
const baseRelicAvailable58=canActivatePermanent;
canActivatePermanent=function(permanent,battle=state.battle){
 if(!(permanent?.card.name in RELIC_MANA58))return baseRelicAvailable58(permanent,battle);
 return Boolean(battle&&state.battle===battle&&battle.permanents.includes(permanent)&&!permanent.tapped&&!battle.resolutionTask&&!battle.choice&&!battle.scry&&!battle.libraryOrder&&!battle.interruption&&!battle.diceRoll&&['main','attack','enemy','blocks','damage'].includes(battle.phase));
};
const baseRelicActivate58=activatePermanent;
activatePermanent=function(id){
 const battle=state.battle,permanent=battle?.permanents.find(p=>p.id===id);
 if(!(permanent?.card.name in RELIC_MANA58))return baseRelicActivate58(id);
 if(!canActivatePermanent(permanent,battle))return false;
 permanent.tapped=true;battle.mulliganAvailable=false;
 const amount=RELIC_MANA58[permanent.card.name];
 if(permanent.card.name==='Black Lotus'){battle.permanents=battle.permanents.filter(p=>p!==permanent);battle.graveyard.push(permanent.card);}
 addFloatingMana58(amount,battle);
 addLog(`${permanent.card.name}: add ${amount} floating generic mana. ${battle.mana} mana available in total.`);
 hideCardPreview();renderBattle();playSfx('select');return true;
};
const baseRelicTokenDetails58=tokenActionDetails47;
tokenActionDetails47=function(permanent){return permanent?.card.name==='Black Lotus'?{effect:'Add 3 floating generic mana.',cost:'Tap · sacrifice · no mana cost',action:'Sacrifice → Add 3 mana'}:baseRelicTokenDetails58(permanent);};
function replacesLegend58(card,battle=state.battle){return Boolean(battle&&isCreature(card)&&/\bLegendary\b/.test(card.type_line)&&battle.creatures.some(unit=>unit.card.name===card.name));}
const baseLegendEntry58=onCreatureEntered;
onCreatureEntered=function(creature){
 const battle=state.battle;
 if(battle&&/\bLegendary\b/.test(creature.card.type_line)){
  const previous=battle.creatures.filter(unit=>unit!==creature&&unit.card.name===creature.card.name);
  for(const old of previous){battle.creatures=battle.creatures.filter(unit=>unit!==old);if(!old.isToken)battle.graveyard.push(old.originalCard||old.card);cleanupAttachments(new Set([old.id]));battle.creatureDiedThisTurn=true;addLog(`Legendary rule: keep the newly entered ${creature.card.name}; the previous copy goes to the graveyard.`);}
  if(previous.length)refreshPermanentEffects();
 }
 return baseLegendEntry58(creature);
};
const baseLegendAttack58=resolveAttackTrigger55;
resolveAttackTrigger55=function(unit,battle,resume){
 if(unit.card.name!=="Syr Alin, the Lion's Claw")return baseLegendAttack58(unit,battle,resume);
 for(const ally of battle.creatures.filter(creature=>creature!==unit&&creatureAlive(creature)))resolveReviewedEffect({kind:'buff',power:1,toughness:1,temporary:true},{side:'player',id:ally.id},{card:unit.card});
 addLog('Syr Alin: other creatures you control get +1/+1 until end of turn.');return false;
};
const RELIC_RULES58={
 'Black Lotus':['Tap and sacrifice this artifact: add 3 floating generic mana. Click the card to review and confirm the sacrifice.','This is an activated mana ability, not a spell. The Lotus goes to your graveyard and cannot be used again. Floating mana is spent first and expires at turn end.'],
 'Sol Ring':['Tap: add 2 floating generic mana. Click the card to activate it.','It can activate on the turn it enters, but only once before untapping. Untaps at the start of your next turn. This is an ability, not a spell.'],
 'Isamaru, Hound of Konda':['A 2/2 legendary creature for 1 generic mana. No additional abilities.'],
 'Yargle, Glutton of Urborg':['A 9/3 legendary creature for 5 generic mana. No additional abilities.'],
 "Syr Alin, the Lion's Claw":['A 4/4 legendary creature with first strike for 5 generic mana.','Whenever it actually attacks, other creatures you control get +1/+1 until end of turn, before combat damage. Syr Alin does not buff itself. The bonuses remain if Syr Alin dies and expire at cleanup.']
};
const baseRelicDescriptions58=effectDescriptions;
effectDescriptions=function(card){const lines=RELIC_RULES58[card.name];if(!lines)return baseRelicDescriptions58(card);return /\bLegendary\b/.test(card.type_line)?[...lines,'Legendary rule adaptation: a newly entered copy replaces your previous creature with the same name. The old card goes to the graveyard; its auras detach and equipment remains. A Clone copying it follows the same rule.']:lines;};
const baseRelicSummary58=draftAbilitySummary;
draftAbilitySummary=function(card){return {'Black Lotus':'Tap, sacrifice: add 3 floating generic mana.','Sol Ring':'Tap: add 2 floating generic mana.',"Syr Alin, the Lion's Claw":'First strike. Attacking gives your other creatures +1/+1 this turn.','Isamaru, Hound of Konda':'Legendary 2/2. No additional abilities.','Yargle, Glutton of Urborg':'Legendary 9/3. No additional abilities.'}[card.name]||baseRelicSummary58(card);};
