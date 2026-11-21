/* v0.95 — reviewed Questing Beast and The One Ring. Generic costs, real drawbacks. */
const QUESTING95='Questing Beast',RING95='The One Ring';
SPECIAL_CREATURES.add(QUESTING95);REVIEWED_PERMANENTS.add(RING95);
const baseLegendAudit95=rulesAudit;
rulesAudit=function(card){return card.name===QUESTING95?{playable:true,adapted:true,reason:'Reviewed combat abilities. Enemy portraits are creatures, not planeswalker permanents; no extra planeswalker hit is invented.'}:card.name===RING95?{playable:true,reason:'Reviewed cast-only protection, indestructibility, burden upkeep and tap-to-draw ability.'}:baseLegendAudit95(card);};
const baseLegendEffects95=cardEffects,baseLegendPermanent95=permanentEffect,baseLegendIndestructible95=indestructible88;
cardEffects=function(card,creature=isCreature(card)){return [QUESTING95,RING95].includes(card.name)?[]:baseLegendEffects95(card,creature);};
permanentEffect=function(card){return card.name===RING95?{power:0,toughness:0,keywords:[]}:baseLegendPermanent95(card);};
indestructible88=function(unit){return unit?.card?.name===RING95||baseLegendIndestructible95(unit);};

const baseQuestBlock95=canBlockCreature;
canBlockCreature=function(blocker,attacker){return !(attacker?.card?.name===QUESTING95&&blocker.power<=2)&&baseQuestBlock95(blocker,attacker);};
// Capture the Beast at the start of each simultaneous damage step, including overflow.
let combatScope95=null,ignoreDamageProtection95=0;
function beforeCombatDamageStep95(b){if(combatScope95?.battle===b)combatScope95.unpreventable=b.creatures.some(u=>u.card.name===QUESTING95&&creatureAlive(u));}
function afterCombatDamageStep95(b){if(combatScope95?.battle===b)combatScope95.unpreventable=false;}
function withCombatPrevention95(enabled,fn){if(enabled)ignoreDamageProtection95++;try{return fn();}finally{if(enabled)ignoreDamageProtection95--;}}
const baseLegendCombat95=resolveCombatDamage,baseLegendProtected95=protectedFrom90,baseQuestDamage95=dealCreatureDamage,baseQuestDirect95=damageFirstEnemy,baseQuestPoison95=poisonOverflow60;
resolveCombatDamage=function(...args){const previous=combatScope95;combatScope95={battle:state.battle,unpreventable:false};try{return baseLegendCombat95(...args);}finally{combatScope95=previous;}};
protectedFrom90=function(unit,source){return !ignoreDamageProtection95&&baseLegendProtected95(unit,source);};
dealCreatureDamage=function(source,target,side,b,...args){return withCombatPrevention95(side==='player'&&combatScope95?.battle===b&&combatScope95.unpreventable,()=>baseQuestDamage95(source,target,side,b,...args));};
damageFirstEnemy=function(...args){return withCombatPrevention95(combatScope95?.battle===state.battle&&combatScope95.unpreventable,()=>baseQuestDirect95(...args));};
poisonOverflow60=function(source,target,amount,b){return withCombatPrevention95(combatScope95?.battle===b&&combatScope95.unpreventable,()=>baseQuestPoison95(source,target,amount,b));};

function playerProtected95(b=state.battle){return Boolean(b&&b===state.battle&&(b.ringProtectionUntil95||0)>b.turn);}
function playerDamageAmount95(amount,b=state.battle){return playerProtected95(b)?0:amount;}
function expireRingProtection95(b){if(b.ringProtectionUntil95&&b.turn>=b.ringProtectionUntil95){delete b.ringProtectionUntil95;addLog('The One Ring: your protection from everything ends.');}}
// Protection belongs to the player and survives the Ring leaving the battlefield.
let castRing95=null;
const baseLegendResolve95=resolvePaidCard44;
resolvePaidCard44=function(card,b=state.battle){const previous=castRing95;castRing95=card.name===RING95?{card,battle:b}:null;try{return baseLegendResolve95(card,b);}finally{castRing95=previous;}};
function ringLegendRule95(b,done){
 const rings=b.permanents.filter(p=>p.card.name===RING95);
 if(rings.length<2)return done();
 openJesterChoice65({battle:b,title:'The One Ring · keep one',instruction:'Legend rule: choose one Ring to keep. The other goes to your graveyard, even though it is indestructible.',options:rings.map(p=>({card:p.card,ring95:p,note:`${p.burden95||0} burden counters · ${p.tapped?'tapped':'untapped'}`})),accept:chosen=>{
  const keep=chosen[0].ring95,removed=b.permanents.filter(p=>p.card.name===RING95&&p!==keep);b.permanents=b.permanents.filter(p=>!removed.includes(p));b.graveyard.push(...removed.map(p=>p.originalCard||p.card));refreshPermanentEffects();done();
 }});
}
const baseLegendRefresh95=refreshPermanentEffects;
refreshPermanentEffects=function(){
 const b=state.battle,fresh=(b?.permanents||[]).filter(p=>p.card.name===RING95&&!p.ringEntered95);
 for(const p of fresh){
  p.ringEntered95=true;p.burden95=0;
  if(castRing95?.battle===b&&castRing95.card===p.card){b.ringProtectionUntil95=b.turn+1;addLog('The One Ring was cast: protection from everything until your next turn.');}
 }
 const result=baseLegendRefresh95();
 if(fresh.length&&b.permanents.filter(p=>p.card.name===RING95).length>1)queueJester65(b,done=>ringLegendRule95(b,done));
 return result;
};
// Called after untap, before the normal draw. Burden is life loss, never damage.
function playerUpkeep95(b){
 for(const p of b.permanents.filter(p=>p.card.name===RING95)){
  const loss=p.burden95||0;if(!loss)continue;
  state.playerHealth-=loss;addLog(`The One Ring: lose ${loss} life from ${loss} burden counter${loss===1?'':'s'}.`);
  if(state.playerHealth<=0){endRun(false);return;}
 }
}
const baseRingCost95=permanentActivationCost,baseRingLabel95=permanentActivationLabel51,baseRingReady95=canActivatePermanent,baseRingActivate95=activatePermanent;
permanentActivationCost=function(card){return card.name===RING95?0:baseRingCost95(card);};
permanentActivationLabel51=function(p){return p.card.name===RING95?p.tapped?'Tapped · untaps next turn':`Tap · +1 burden · draw ${(p.burden95||0)+1}`:baseRingLabel95(p);};
canActivatePermanent=function(p,b=state.battle){return p?.card.name===RING95?Boolean(b&&b===state.battle&&b.permanents.includes(p)&&!p.tapped&&!permanentActionBusy60(b)&&!jesterPending65(b)&&!b.librarySearch&&!coatChoice88&&['main','attack','enemy','blocks','damage'].includes(b.phase)):baseRingReady95(p,b);};
activatePermanent=function(id){
 const b=state.battle,p=b?.permanents.find(p=>p.id===id);if(p?.card.name!==RING95)return baseRingActivate95(id);
 if(!canActivatePermanent(p,b))return false;
 p.tapped=true;p.burden95=(p.burden95||0)+1;b.mulliganAvailable=false;
 addLog(`The One Ring: ${p.burden95} burden · draw ${p.burden95} card${p.burden95===1?'':'s'}.`);
 for(let i=0;i<p.burden95&&b===state.battle&&b.phase!=='complete';i++)drawOneCard();
 if(b.phase!=='complete'){renderBattle();playSfx('select');}return true;
};
const baseRingDetails95=tokenActionDetails47,baseRingWindow95=renderTokenAction47;
tokenActionDetails47=function(p){return p?.card.name===RING95?{effect:`${p.burden95||0} burden counters. Add one, then draw ${(p.burden95||0)+1} card${p.burden95?'s':''}. At your next upkeep, lose life equal to the burden counters on this Ring.`,cost:'Tap · no mana cost · keep this artifact',action:`Tap → Draw ${(p.burden95||0)+1}`} :baseRingDetails95(p);};
renderTokenAction47=function(){baseRingWindow95();const b=state.battle,p=b?.permanents.find(p=>p.id===state.tokenAction47?.id);if(p?.card.name===RING95){$('#token-action-symbol').textContent='◉';$('#token-action-status').textContent=p.tapped?'Tapped. Untaps next turn; burden counters remain.':canActivatePermanent(p,b)?'Nothing happens until you confirm. The Ring stays on the battlefield.':'Finish the pending choice before activating.';}};
// All targeting of the protected player is illegal, including your own spells/abilities.
const baseRingTargets95=ruleTargetOptions,baseRingJesterTargets95=jesterTargetOptions65,baseRingWard95=withJesterWard65;
ruleTargetOptions=function(...args){const b=args[1]||state.battle;return baseRingTargets95(...args).filter(o=>!playerProtected95(b)||o.key!=='life:player');};
jesterTargetOptions65=function(b,...args){return baseRingJesterTargets95(b,...args).filter(o=>!playerProtected95(b)||o.target?.side!=='life');};
withJesterWard65=function(b,target,source,effect,done){if(target?.side==='life'&&playerProtected95(b))return done();return baseRingWard95(b,target,source,effect,done);};
const baseRingAdvance95=advanceResolution27;
advanceResolution27=function(task){
 const b=task?.battle;
 if(b===state.battle&&task.effect===0&&task.copy<task.copies&&task.p?.rule.target&&task.target?.side==='life'&&playerProtected95(b)){
  addLog(`${task.p.card.name}: protection makes its target illegal.`);task.copy++;task.effect=0;task.wardPaid=false;return advanceResolution27(task);
 }
 return baseRingAdvance95(task);
};
const baseRingEnemySpell95=resolveEnemySpell38,baseRingAbility95=dealAbility66;
resolveEnemySpell38=function(spell,b=state.battle){if(spell?.status==='pending'&&spell.target?.side==='life'&&playerProtected95(b)){finishEnemySpell38(spell,'fizzled',b);addLog(`${spell.card.name}: The One Ring protects you from being targeted.`);return;}return baseRingEnemySpell95(spell,b);};
dealAbility66=function(source,target,amount,b=state.battle){if(target?.side==='life'&&playerProtected95(b))return;return baseRingAbility95(source,target,amount,b);};

const baseRingMarkup95=permanentMarkup,baseRingBattle95=renderBattle;
permanentMarkup=function(p,...args){const html=baseRingMarkup95(p,...args);return p.card.name===RING95?html.replace('</button>',`<span class="ring-burden95" title="${p.burden95||0} burden counters · life lost each upkeep" aria-label="${p.burden95||0} burden counters">◉ ${p.burden95||0}</span></button>`):html;};
renderBattle=function(){const result=baseRingBattle95();const badge=$('#player-ring-protection95');if(badge)badge.hidden=!playerProtected95();return result;};
const DESCRIPTIONS95={
 [QUESTING95]:['4/4 for 4 generic mana. Vigilance, Deathtouch and Haste.','Creatures with power 2 or less cannot block it. In these duels, those monsters cannot retaliate against its attacks; larger monsters still can.','While Questing Beast is on your battlefield, combat damage from all your creatures cannot be prevented, including by color protection. Protection still prevents matching targeting and blocking.','The printed planeswalker trigger needs an actual planeswalker permanent. Enemy portraits are creatures, so it does not create an extra hit in this game.','Legend rule: the newly entered Questing Beast replaces your previous copy.'],
 [RING95]:['Legendary artifact · 4 generic mana · Indestructible. Does not grant Indestructible to your creatures.','Only when you cast it: gain protection from everything until your next turn. Prevent damage to you and targeting you, including your own targeted effects. Your creatures are not protected.','Tap: put one burden counter on this Ring, then draw one card per burden counter on it. No mana cost. Activate from its battlefield card in any response phase; tapping limits it to once until untapped.','At the beginning of your upkeep, lose one life per burden counter on this Ring, before your normal draw. This is life loss, so protection cannot stop it. Drawing from an empty Library loses the run.','Burden stays on this battlefield Ring. A new copy enters with zero counters. You choose which Ring to keep under the legend rule; a newly cast Ring grants protection even if you keep the old one.','Protection lasts until your next turn even if the Ring leaves. Exile, sacrifice and the legend rule can still remove the Ring.']
};
const baseLegendDescription95=effectDescriptions,baseLegendSummary95=draftAbilitySummary;
effectDescriptions=function(card){return DESCRIPTIONS95[card.name]||baseLegendDescription95(card);};
draftAbilitySummary=function(card){return card.name===QUESTING95?'Vigilance · Deathtouch · Haste. Power ≤2 cannot retaliate. Your creatures’ combat damage cannot be prevented.':card.name===RING95?'Indestructible. Cast: protection until next turn. Tap: +1 burden, draw that many. Upkeep: lose that much life.':baseLegendSummary95(card);};
for(const key of ['pool','catalogPool'])if(state[key]?.length)state[key]=[...new Map([...state[key],...BUNDLED_CARDS.filter(c=>[QUESTING95,RING95].includes(c.name))].map(c=>[c.name,c])).values()].filter(c=>key==='catalogPool'||rulesAudit(c).playable&&c.name!=='Booster Tutor');
