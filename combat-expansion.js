/* Reviewed v0.88: restricted removal, player indestructibility and Mithril Coat. */
const CARDS88=new Set(['Sedge Scorpion','Giant Scorpion','Daggerback Basilisk','Ambush Viper','Snapping Drake','Fighting Drake','Sunspire Griffin','Sungrace Pegasus','Hitchclaw Recluse','Giant Mantis','Blightwidow','Skysnare Spider','Knight of Meadowgrain','Elvish Archers','Benalish Knight','Boros Recruit','Doom Blade','Go for the Throat','Plummet','Smite the Monstrous','Destroy Evil','Broken Wings','Infernal Grasp','Vanquish the Weak','Final Reward','Oblivion Strike','Revoke Existence','Mithril Coat']);
for(const name of ['Ambush Viper','Benalish Knight','Blightwidow'])SPECIAL_CREATURES.add(name);
REVIEWED_PERMANENTS.add('Mithril Coat');
Object.assign(SPELL_RULES,{
 'Doom Blade':{target:'nonblack88',effects:[{kind:'destroy'}]},
 'Go for the Throat':{target:'nonartifact88',effects:[{kind:'destroy'}]},
 'Plummet':{target:'flying88',effects:[{kind:'destroy'}]},
 'Smite the Monstrous':{target:'power4up88',effects:[{kind:'destroy'}]},
 'Destroy Evil':{target:'evil88',effects:[{kind:'destroy'}]},
 'Broken Wings':{target:'wings88',effects:[{kind:'destroy'}]},
 'Infernal Grasp':{target:'creature',effects:[{kind:'destroy'},{kind:'lose-life',amount:2}]},
 'Vanquish the Weak':{target:'power3down88',effects:[{kind:'destroy'}]},
 'Final Reward':{target:'creature',effects:[{kind:'exile'}]},
 'Oblivion Strike':{target:'creature',effects:[{kind:'exile'}]},
 'Revoke Existence':{target:'artifact-or-enchantment',effects:[{kind:'exile'}]}
});
function cardColors88(card){if(Array.isArray(card.colors))return card.colors;if(card.color_indicator)return card.color_indicator;if(/\bDevoid\b/i.test(card.oracle_text||''))return[];return [...new Set((card.mana_cost||'').match(/[WUBRG]/g)||[])];}
const baseTargets88=ruleTargetOptions;
ruleTargetOptions=function(kind,b=state.battle){
 if(!['nonblack88','nonartifact88','flying88','power4up88','power3down88','evil88','wings88'].includes(kind))return baseTargets88(kind,b);
 return baseTargets88('permanent',b).filter(o=>{
  const creature=isCreature(o.card),text=o.card.type_line||'',u=o.unit;
  if(kind==='nonblack88')return creature&&!cardColors88(o.card).includes('B');
  if(kind==='nonartifact88')return creature&&!/\bArtifact\b/.test(text);
  if(kind==='flying88')return creature&&hasCreatureKeyword(u,'flying');
  if(kind==='power4up88')return creature&&u.power>=4;
  if(kind==='power3down88')return creature&&u.power<=3;
  if(kind==='evil88')return /\bEnchantment\b/.test(text)||(creature&&(u.owner==='enemy'?u.maxHealth:u.toughness)>=4);
  return /\b(?:Artifact|Enchantment)\b/.test(text)||(creature&&hasCreatureKeyword(u,'flying'));
 });
};
// Protection never makes a destroy target illegal: the spell resolves but cannot destroy it.
const baseHasKeyword88=hasCreatureKeyword;
hasCreatureKeyword=function(unit,keyword){return keyword==='indestructible'&&unit?.owner==='enemy'?false:baseHasKeyword88(unit,keyword);};
function indestructible88(unit){return Boolean(unit&&unit.owner!=='enemy'&&(hasCreatureKeyword(unit,'indestructible')||(!isCreature(unit.card)&&unit.card.name==='Mithril Coat')));}
const baseResolve88=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const unit=choiceTargetUnit(target,state.battle);
 if(effect.kind==='destroy'&&indestructible88(unit)){addLog(`${unit.card.name} is indestructible. Destruction has no effect.`);return;}
 const result=baseResolve88(effect,target,context);
 if(['destroy','exile'].includes(effect.kind))settleReviewed66();
 return result;
};
const baseRemoveTarget88=removeSpellTarget;
removeSpellTarget=function(kind){const unit=choiceTargetUnit(state.battle?.resolvingSpellTarget,state.battle);if(kind==='destroy'&&indestructible88(unit)){addLog(`${unit.card.name} is indestructible.`);return;}return baseRemoveTarget88(kind);};
// Recheck all printed restrictions on resolution, including copies and post-Ward continuations.
const baseAdvance88=advanceResolution27;
advanceResolution27=function(task){
 const b=task?.battle,p=task?.p;
 if(b===state.battle&&task.effect===0&&task.copy<task.copies&&CARDS88.has(p?.card?.name)&&p.rule.target&&task.target&&!ruleTargetOptions(p.rule.target,b).some(o=>o.key===p.picks.target?.[0])){
  addLog(`${p.card.name}: the target is no longer legal. This copy has no effect.`);task.copy++;task.effect=0;task.wardPaid=false;return advanceResolution27(task);
 }
 return baseAdvance88(task);
};
const baseMithrilEffect88=permanentEffect;
permanentEffect=function(card){return card.name==='Mithril Coat'?{power:0,toughness:0,keywords:['indestructible']}:baseMithrilEffect88(card);};
const baseEffects88=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return card.name==='Mithril Coat'||['Ambush Viper','Benalish Knight','Blightwidow'].includes(card.name)?[]:baseEffects88(card,creature);};
let coatChoice88=null;
function chooseCoat88(b,title,instruction,units,accept){
 if(state.battle!==b||b.phase==='complete')return;
 if(units.length===1)return accept(units[0]);
 coatChoice88={battle:b,units,accept,selected:null};
 $('#coat-title88').textContent=title;$('#coat-instruction88').textContent=instruction;$('#coat-confirm88').disabled=true;
 $('#coat-options88').innerHTML=units.map(u=>`<button type="button" data-coat-pick88="${escapeHtml(u.id)}" aria-pressed="false">${cardFace(u.card)}<b>${escapeHtml(u.card.name)}</b><small>${u.attachedTo?`Attached to ${escapeHtml(b.creatures.find(c=>c.id===u.attachedTo)?.card.name||'a creature')}`:isCreature(u.card)?`${u.power} / ${u.toughness}`:'Unattached'}</small></button>`).join('');
 $('#coat-dialog88').showModal();
}
function selectCoat88(id){const c=coatChoice88;if(!c||!c.units.some(u=>u.id===id))return;c.selected=id;for(const n of $('#coat-options88').querySelectorAll('[data-coat-pick88]')){const selected=n.dataset.coatPick88===id;n.classList.toggle('selected',selected);n.setAttribute('aria-pressed',String(selected));}$('#coat-confirm88').disabled=false;}
function confirmCoat88(){const c=coatChoice88,u=c?.units.find(u=>u.id===c.selected);if(!c||!u||c.battle!==state.battle)return;coatChoice88=null;$('#coat-dialog88').close();c.accept(u);}
function mithrilEntry88(coat,b,done){
 if(state.battle!==b||!b.permanents.includes(coat))return done();
 const attach=()=>{
  if(!b.permanents.includes(coat))return done();
  const legal=b.creatures.filter(u=>/\bLegendary\b/.test(u.card.type_line));
  if(!legal.length){addLog('Mithril Coat enters unattached: no legendary creature is available.');return done();}
  chooseCoat88(b,'Choose a legendary creature','Attach Mithril Coat to a legendary creature you control. This costs no additional mana.',legal,u=>{
   if(b.creatures.includes(u)&&b.permanents.includes(coat)){coat.attachedTo=u.id;refreshPermanentEffects();addLog(`Mithril Coat attaches to ${u.card.name} for free.`);}done();
  });
 };
 const coats=b.permanents.filter(p=>p.card.name==='Mithril Coat');
 if(coats.length<2)return attach();
 chooseCoat88(b,'Keep one Mithril Coat','Legend rule: choose the Coat to keep. The others go to the graveyard, even though they are indestructible.',coats,keep=>{
  const others=b.permanents.filter(p=>p.card.name==='Mithril Coat'&&p!==keep);b.permanents=b.permanents.filter(p=>!others.includes(p));for(const p of others)b.graveyard.push(p.originalCard||p.card);
  refreshPermanentEffects();settleReviewed66(b);attach();
 });
}
const baseRefresh88=refreshPermanentEffects;
refreshPermanentEffects=function(){
 const result=baseRefresh88(),b=state.battle;if(!b)return result;
 for(const coat of b.permanents.filter(p=>p.card.name==='Mithril Coat'&&!p.coatEntered88)){coat.coatEntered88=true;queueJester65(b,done=>mithrilEntry88(coat,b,done));}
 return result;
};
$('#coat-options88').addEventListener('click',event=>{const n=event.target.closest('[data-coat-pick88]');if(n)selectCoat88(n.dataset.coatPick88);});
$('#coat-confirm88').addEventListener('click',confirmCoat88);
$('#coat-dialog88').addEventListener('cancel',event=>event.preventDefault());
const baseCoatScene88=showScreen;
showScreen=function(id){if(id!=='combat-screen'&&coatChoice88){coatChoice88=null;$('#coat-dialog88').close();}return baseCoatScene88(id);};
// Casting Coat via drag-and-drop never prepays Equip. The entry trigger chooses its host.
const baseDropFeedback88=dropFeedback,baseCardDrop88=handleCardDrop;
dropFeedback=function(payload,target){const b=state.battle,card=payload?.kind==='hand'?b?.hand[payload.index]:null;return card?.name==='Mithril Coat'?Boolean(target?.closest('#player-drop-zone')&&canCastNow(card,b)&&paymentPlan(card)):baseDropFeedback88(payload,target);};
handleCardDrop=function(payload,target){const b=state.battle,card=payload?.kind==='hand'?b?.hand[payload.index]:null;if(card?.name!=='Mithril Coat')return baseCardDrop88(payload,target);if(!dropFeedback(payload,target)||(payload.cardId&&payload.cardId!==card.id))return false;playCard(payload.index,'player');return true;};
const DESCRIPTIONS88={
 'Doom Blade':['Destroy target nonblack creature.','Color comes from the card’s colors, not its color identity. Enemy color labels show which monsters are black.'],
 'Go for the Throat':['Destroy target nonartifact creature. Artifact creatures are not legal targets.'],
 'Plummet':['Destroy target creature with Flying. Ground creatures are not legal targets.'],
 'Smite the Monstrous':['Destroy target creature with power 4 or greater. Current power includes counters and temporary bonuses.'],
 'Destroy Evil':['Choose a creature with toughness 4 or greater, or an enchantment. Destroy it.','For monsters, toughness is their maximum life.'],
 'Broken Wings':['Destroy target artifact, enchantment, or creature with Flying.'],
 'Vanquish the Weak':['Destroy target creature with power 3 or less. Current power includes counters and temporary bonuses.'],
 'Infernal Grasp':['Destroy target creature, then lose 2 life.','You still lose life if the legal target is indestructible; if the target becomes illegal, the whole spell has no effect.'],
 'Final Reward':['Exile target creature. This is an instant and can be cast during combat.'],
 'Oblivion Strike':['Exile target creature. Cast during your main phase.'],
 'Revoke Existence':['Exile target artifact or enchantment. Artifact and enchantment creatures are legal targets.'],
 'Mithril Coat':['Flash: cast for 3 generic mana whenever you have instant priority. Mithril Coat itself is indestructible.','When it enters, attach it for free to a legendary creature you control. With no legal legendary creature it stays unattached.','Equip 3: during Main phase, attach or move it to any creature you control. It grants Indestructible and no power/toughness bonus.','Indestructible stops destruction from lethal damage, Deathtouch and destroy effects. It does not stop exile, sacrifice, or toughness 0. Damage is still dealt and Lifelink still gains life.','Legend rule: choose one Mithril Coat to keep if you control more than one.']
};
const baseDescriptions88=effectDescriptions;
effectDescriptions=function(card){return DESCRIPTIONS88[card.name]||baseDescriptions88(card);};
const baseSummary88=draftAbilitySummary;
draftAbilitySummary=function(card){return DESCRIPTIONS88[card.name]?card.name==='Mithril Coat'?'Flash. Free entry attachment to a legendary ally; Equip 3. Gives Indestructible.':DESCRIPTIONS88[card.name][0]:baseSummary88(card);};

// Color and type identities support real removal restrictions without mana costs on monsters.
const FOES88={
 venomfang:{name:'Venomfang Adder',tier:'elite',minNode:2,health:12,power:1,pattern:['guard','attack','buff','attack'],keywords:['deathtouch'],bounty:13,type_line:'Creature — Snake',colors:['G']},
 boneblade:{name:'Ossuary Duelist',tier:'skirmish',health:10,power:2,pattern:['attack','guard','buff','attack'],keywords:['first strike'],bounty:9,type_line:'Enchantment Creature — Skeleton Warrior',colors:['B']},
 gloomwing:{name:'Gloomwing Bat',tier:'skirmish',health:8,power:2,pattern:['attack','attack','guard'],keywords:['flying','lifelink'],bounty:8,type_line:'Creature — Bat',colors:['B']},
 silkweaver:{name:'Broodweb Weaver',tier:'elite',minNode:2,health:20,power:3,pattern:['guard','attack','mend','attack'],keywords:['reach','deathtouch'],mend:2,bounty:17,type_line:'Enchantment Creature — Spider',colors:['G']},
 stormtalon:{name:'Stormtalon Raptor',tier:'elite',minNode:2,health:18,power:4,pattern:['attack','buff','guard','attack'],keywords:['flying','first strike'],bounty:17,type_line:'Creature — Bird',colors:['W','U']},
 runegolem:{name:'Runebound Colossus',tier:'elite',minNode:3,health:28,power:4,pattern:['guard','rally','attack','attack'],keywords:['reach'],ward:2,bounty:19,type_line:'Artifact Creature — Construct',colors:[]},
 graveoracle:{name:'Grave-Tide Oracle',tier:'elite',minNode:3,health:16,power:2,pattern:['mill','rune','attack','mend'],keywords:['flying'],ward:1,mill:2,runeMana:3,mend:3,bounty:18,type_line:'Creature — Spirit Wizard',colors:['U','B']},
 cinderhydra:{name:'Cindercrest Hydra',tier:'boss',health:64,power:6,pattern:['buff','attack','rally','attack','guard'],keywords:['reach','trample'],ward:1,bounty:46,type_line:'Legendary Creature — Hydra',colors:['R','G']}
};
Object.assign(FOE_TYPES,FOES88);
const FOE_COLORS88={sprout:['G'],wisp:['U'],duelist:['R'],boar:['G'],sprite:['U'],raider:['R'],wolf:['G'],stalker:['B','G'],bulwark:[],archivist:['U'],vampire:['B'],dragon:[],tyrant:['B','R'],sphinx:['W','U'],goblin:['R'],goblinArsonist:['R'],goblinSneak:['R'],rat:['B'],saproling:['G'],myr:[]};
const baseFoe88=createFoe;
createFoe=function(kind,node=state.node){const u=baseFoe88(kind,node);u.card.colors=[...(FOE_TYPES[kind].colors||FOE_COLORS88[kind]||[])];u.card.color_identity=[...u.card.colors];u.indestructible=false;return u;};
const baseEnemyType88=typeof enemyTypeMarkup67==='function'?enemyTypeMarkup67:null;
if(baseEnemyType88)enemyTypeMarkup67=function(enemy){const colors=cardColors88(enemy.card),names={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'},label=colors.length?colors.map(c=>names[c]).join(' / '):'Colorless';return baseEnemyType88(enemy).replace('<small>',`<small>${escapeHtml(label)} · `).replace(`title="${escapeHtml(enemy.card.type_line)}"`,`title="${escapeHtml(enemy.card.type_line+' · '+label)}"`).replace('<span class="enemy-type67"',`<span aria-label="${escapeHtml(enemy.card.type_line+' · '+label)}" class="enemy-type67"`);};
// Existing cached catalogs gain the reviewed additions; Booster Tutor keeps its special run rule.
for(const key of ['pool','catalogPool'])if(state[key]?.length)state[key]=[...new Map([...state[key],...BUNDLED_CARDS.filter(c=>CARDS88.has(c.name))].map(c=>[c.name,c])).values()].filter(c=>key==='catalogPool'||rulesAudit(c).playable&&c.name!=='Booster Tutor');
