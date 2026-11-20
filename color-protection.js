/* v0.90 — source-aware color protection. Identity never substitutes for actual color. */
const COLOR_NAMES90={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'};
const PROTECTION_CREATURES90=new Set(['White Knight','Black Knight','Silver Knight','Paladin en-Vec','Voice of Law','Voice of Grace','Voice of Duty','Voice of Reason']);
const WARDS90={'Black Ward':'B','Blue Ward':'U','Red Ward':'R','Green Ward':'G'};
const CARDS90=new Set([...PROTECTION_CREATURES90,...Object.keys(WARDS90),'Gods Willing','Stave Off']);
for(const name of PROTECTION_CREATURES90)SPECIAL_CREATURES.add(name);
for(const name of Object.keys(WARDS90))REVIEWED_PERMANENTS.add(name);
SPELL_RULES['Gods Willing']={target:'own-creature',effects:[{kind:'choose-protection90'},{kind:'scry-draw',scry:1,draw:0}]};
SPELL_RULES['Stave Off']={target:'creature',effects:[{kind:'choose-protection90'}]};
function printedProtection90(card){
 const found=[];for(const m of (card?.oracle_text||'').matchAll(/protection from ([^.\n(]+)/gi))for(const [color,name] of Object.entries(COLOR_NAMES90))if(new RegExp('\\b'+name+'\\b','i').test(m[1]))found.push(color);
 return [...new Set(found)];
}
function protectionColors90(unit){
 if(!unit)return[];
 const printed=isCreature(unit.card||{})?printedProtection90(unit.card):[];
 return [...new Set([...printed,...(unit.protection90||[]),...(unit.permanentProtection90||[]),...(unit.temporaryKeywords||[]).filter(k=>k.startsWith('protection-')).map(k=>k.slice(-1))])];
}
function protectedFrom90(unit,source){const card=source?.card||source;return Boolean(card&&protectionColors90(unit).some(c=>cardColors88(card).includes(c)));}
let protectionSource90=null;
function withProtectionSource90(source,fn){const old=protectionSource90;protectionSource90=source?.card||source;try{return fn();}finally{protectionSource90=old;}}
function sourceCard90(source){return typeof source==='string'?[...BUNDLED_CARDS,...BUNDLED_ENEMY_SPELLS].find(c=>c.name===source):source?.card||source;}

const baseProtectionTiming90=canCastNow,baseProtectionPlay90=playCard,baseProtectionCommit90=commitRuleSpell,baseProtectionChoices90=choiceOptions;
canCastNow=function(card,b=state.battle){return withProtectionSource90(card,()=>baseProtectionTiming90(card,b)&&(!isAura(card)||ruleTargetOptions('creature',b).length>0));};
playCard=function(index,side='enemy'){return withProtectionSource90(state.battle?.hand[index],()=>baseProtectionPlay90(index,side));};
commitRuleSpell=function(p){return withProtectionSource90(p.card,()=>baseProtectionCommit90(p));};
choiceOptions=function(p){return withProtectionSource90(p.card,()=>baseProtectionChoices90(p));};
const baseProtectionTargets90=ruleTargetOptions;
ruleTargetOptions=function(kind,b=state.battle,source=protectionSource90||b?.choice?.card||b?.resolutionTask?.p?.card){
 const options=baseProtectionTargets90(kind,b);return kind==='clone'||!source?options:options.filter(o=>!o.unit||!protectedFrom90(o.unit,source));
};
const baseProtectionAdvance90=advanceResolution27;
advanceResolution27=function(task){
 const b=task?.battle,p=task?.p,u=choiceTargetUnit(task?.target,b);
 if(b===state.battle&&task.effect===0&&task.copy<task.copies&&p?.rule.target&&p.rule.target!=='clone'&&u&&protectedFrom90(u,p.card)){
  addLog(`${p.card.name}: protection makes its target illegal. This copy has no effect.`);
  if(isAura(p.card))b.graveyard.push(p.card);task.copy++;task.effect=0;task.wardPaid=false;return advanceResolution27(task);
 }
 return withProtectionSource90(p?.card,()=>baseProtectionAdvance90(task));
};
const baseProtectionDamage90=dealCreatureDamage;
dealCreatureDamage=function(source,target,side,b,amount=Math.max(0,source.power||0),events=null){if(protectedFrom90(target,source))return;return baseProtectionDamage90(source,target,side,b,amount,events);};
const baseProtectionAbilityDamage90=dealAbility66;
dealAbility66=function(source,target,amount,b=state.battle){if(protectedFrom90(choiceTargetUnit(target,b),source))return;return withProtectionSource90(source,()=>baseProtectionAbilityDamage90(source,target,amount,b));};
const baseProtectionDirectDamage90=damageFirstEnemy;
damageFirstEnemy=function(amount,explicit=null,source=protectionSource90){
 const b=state.battle,u=explicit||(b?.resolvingSpellTarget?.side==='enemy'?choiceTargetUnit(b.resolvingSpellTarget,b):null)||b?.enemyCreatures.find(e=>e.id===b.selectedEnemyTargetId&&e.health>0&&!hasCreatureKeyword(e,'hexproof'))||b?.enemyCreatures.find(e=>e.health>0&&!hasCreatureKeyword(e,'hexproof'));
 if(protectedFrom90(u,source))return 0;return baseProtectionDirectDamage90(amount,explicit);
};
const baseProtectionOverflow90=poisonOverflow60;
poisonOverflow60=function(source,target,amount,b){return protectedFrom90(target,source)?0:baseProtectionOverflow90(source,target,amount,b);};
const baseProtectionBlock90=canBlockCreature;
canBlockCreature=function(blocker,attacker){return !protectedFrom90(attacker,blocker)&&baseProtectionBlock90(blocker,attacker);};
const baseProtectionEffect90=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){
 const source=context.card||protectionSource90,u=choiceTargetUnit(target,state.battle);
 const targeted=source&&(SPELL_RULES[source.name]?.target||isAura(source));
 if(u&&protectedFrom90(u,source)&&(effect.kind==='damage'||targeted))return;
 return withProtectionSource90(source,()=>baseProtectionEffect90(effect,target,context));
};
const baseProtectionAbilityTargets90=abilityTargets66;
abilityTargets66=function(u,b=state.battle){return withProtectionSource90(u,()=>baseProtectionAbilityTargets90(u,b));};
const baseProtectionJesterTargets90=jesterTargetOptions65;
jesterTargetOptions65=function(b,enemiesOnly=false,source=protectionSource90){return baseProtectionJesterTargets90(b,enemiesOnly).filter(o=>!protectedFrom90(choiceTargetUnit(o.target,b),source));};
const baseProtectionJesterWard90=withJesterWard65;
withJesterWard65=function(b,target,source,effect,done){
 const card=sourceCard90(source);if(protectedFrom90(choiceTargetUnit(target,b),card))return done();
 return baseProtectionJesterWard90(b,target,source,u=>{if(!protectedFrom90(u,card))withProtectionSource90(card,()=>effect(u));},done);
};
const baseProtectionEnemySpell90=resolveEnemySpell38;
resolveEnemySpell38=function(spell,b=state.battle){
 if(spell?.status==='pending'&&spell.target?.side==='player'&&protectedFrom90(choiceTargetUnit(spell.target,b),spell.card)){
  finishEnemySpell38(spell,'fizzled',b);addLog(`${spell.card.name}: protection makes the target illegal.`);return;
 }
 return baseProtectionEnemySpell90(spell,b);
};

// Colored Auras and Equipment cannot stay attached to a creature protected from them.
const baseProtectionPermanent90=permanentEffect,baseProtectionEffects90=cardEffects;
permanentEffect=function(card){return WARDS90[card.name]?{power:0,toughness:0,keywords:[]}:baseProtectionPermanent90(card);};
cardEffects=function(card,creature=isCreature(card)){return PROTECTION_CREATURES90.has(card.name)||WARDS90[card.name]?[]:baseProtectionEffects90(card,creature);};
const baseProtectionRefresh90=refreshPermanentEffects;
refreshPermanentEffects=function(){
 const b=state.battle;if(!b)return baseProtectionRefresh90();
 for(let pass=0;pass<3;pass++){
  const units=[...b.creatures,...b.enemyCreatures];for(const u of units)u.permanentProtection90=(b.permanents||[]).filter(p=>p.attachedTo===u.id&&WARDS90[p.card.name]).map(p=>WARDS90[p.card.name]);
  const illegal=(b.permanents||[]).filter(p=>p.attachedTo&&protectedFrom90(units.find(u=>u.id===p.attachedTo),p.card));
  if(!illegal.length)break;
  for(const p of illegal){if(isAura(p.card)){b.permanents=b.permanents.filter(x=>x!==p);if(p.card.name==='Rancor')b.hand.push(p.card);else b.graveyard.push(p.originalCard||p.card);}else p.attachedTo=null;}
 }
 return baseProtectionRefresh90();
};
const baseProtectionAttach90=selectAttachmentTarget;
selectAttachmentTarget=function(id){const b=state.battle,p=b?.pendingAttachment,card=p?.handIndex!==undefined?b.hand[p.handIndex]:b?.permanents.find(x=>x.id===p?.permanentId)?.card,u=b?.creatures.find(u=>u.id===id);if(protectedFrom90(u,card))return showActionError('Protection prevents this attachment. No mana was paid.');return baseProtectionAttach90(id);};
const baseProtectionAsync90=resolveDiceEffect50;
resolveDiceEffect50=function(effect,target,context,resume){
 if(effect.kind!=='choose-protection90')return baseProtectionAsync90(effect,target,context,resume);
 const b=state.battle,u=choiceTargetUnit(target,b);if(!u){resume();return true;}
 openJesterChoice65({battle:b,title:`${context.card.name} · choose a color`,instruction:'Protection until end of turn: prevent damage, targeting, blocking and attachments from the chosen color. Colorless sources are unaffected.',options:Object.entries(COLOR_NAMES90).map(([color,label])=>({color,label,note:`Protection from ${label.toLowerCase()}`})),accept:chosen=>{
  const keyword='protection-'+chosen[0].color;(u.temporaryKeywords||=[]).push(keyword);b.turnEffects.push({creatureId:u.id,owner:u.owner,keyword});refreshPermanentEffects();resume();
 }});return true;
};
const baseProtectionExpire90=expireTurnEffects;
expireTurnEffects=function(b){for(const effect of b.turnEffects||[])if(effect.keyword?.startsWith('protection-')){const u=b.enemyCreatures.find(u=>u.id===effect.creatureId),index=u?.temporaryKeywords?.indexOf(effect.keyword);if(index>=0)u.temporaryKeywords.splice(index,1);}return baseProtectionExpire90(b);};
const baseProtectionLabels90=creatureKeywordLabels;
creatureKeywordLabels=function(u){const colors=protectionColors90(u);return [colors.length?`Protection (${colors.map(c=>COLOR_NAMES90[c]).join(' / ')})`:'',baseProtectionLabels90(u)].filter(Boolean).join(' · ');};
const baseProtectionDisplay90=displayKeywords;
displayKeywords=function(card){const labels=baseProtectionDisplay90(card).filter(k=>!/^protection$/i.test(k)),colors=printedProtection90(card);return colors.length?[...labels,`Protection (${colors.map(c=>COLOR_NAMES90[c]).join(' / ')})`]:labels;};
if(typeof KEYWORD_TONES61!=='undefined')KEYWORD_TONES61.protection='gold';
const baseProtectionText90=typeof keywordText61==='function'?keywordText61:escapeHtml;
keywordText61=function(text){return baseProtectionText90(text).replace(/\bProtection(?:\s+from)?(?:\s*\([^)]*\))?/gi,label=>`<span class="keyword-word61 keyword-gold61" data-keyword="protection">${label}</span>`);};
const baseProtectionDescriptions90=effectDescriptions,baseProtectionSummary90=draftAbilitySummary;
const PROTECTION_RULE90='Protection prevents damage, targeting, blocking and Aura/Equipment attachments from sources of those actual colors. Color identity alone does not count. Untargeted destroy/exile, sacrifice and toughness 0 still work.';
const baseProtectionBadges90=enemyKeywordBadges47;
enemyKeywordBadges47=function(u){const label=creatureKeywordLabels(u).split(' · ').find(k=>k.startsWith('Protection ('));return label?baseProtectionBadges90(u).replace(`<span class="enemy-keyword-badge keyword-combat" title="${escapeHtml(label)}">`,`<span class="enemy-keyword-badge keyword-protection" data-keyword="protection" title="${escapeHtml(PROTECTION_RULE90)}">`):baseProtectionBadges90(u);};
effectDescriptions=function(card){
 if(WARDS90[card.name])return[`Enchant creature: grants protection from ${COLOR_NAMES90[WARDS90[card.name]].toLowerCase()}. No power/toughness bonus.`,PROTECTION_RULE90];
 if(card.name==='Gods Willing'||card.name==='Stave Off')return[`${card.name==='Gods Willing'?'Choose a creature you control':'Choose any creature'}. Choose a color as the spell resolves; it gains protection from that color until end of turn.${card.name==='Gods Willing'?' Then scry 1.':''}`,PROTECTION_RULE90];
 const lines=baseProtectionDescriptions90(card);return PROTECTION_CREATURES90.has(card.name)?[...lines,`Protection from ${printedProtection90(card).map(c=>COLOR_NAMES90[c]).join(' / ')}.`,PROTECTION_RULE90]:lines;
};
draftAbilitySummary=function(card){return CARDS90.has(card.name)?WARDS90[card.name]?`Enchant creature: protection from ${COLOR_NAMES90[WARDS90[card.name]]}.`:PROTECTION_CREATURES90.has(card.name)?displayKeywords(card).join(' · '):`Choose a color: protection until end of turn.${card.name==='Gods Willing'?' Scry 1.':''}`:baseProtectionSummary90(card);};
for(const key of ['pool','catalogPool'])if(state[key]?.length)state[key]=[...new Map([...state[key],...BUNDLED_CARDS.filter(c=>CARDS90.has(c.name))].map(c=>[c.name,c])).values()].filter(c=>key==='catalogPool'||rulesAudit(c).playable&&c.name!=='Booster Tutor');
