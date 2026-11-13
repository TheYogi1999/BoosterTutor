/* Reviewed Jester family, self-targeted run pruning, and Vault 21 chapters. */
const VAULT65='Vault 21: House Gambit';
const JESTER_VARIANTS65=new Set(["Jester's Cap","Jester's Scepter","Jester's Sombrero",'Goblin Battle Jester','The Madcap Jester']);
const JESTER_NAMES65=new Set([...JESTER_VARIANTS65,"Demon's Jester",'Havoc Jester','Spike Jester',VAULT65]);
// Stolen enemy spells need real player-cast rules, rather than enemy-only effects.
SPELL_RULES['Lava Spike']={target:'enemy-player65',effects:[{kind:'damage',amount:3}]};
SPELL_RULES["Sovereign's Bite"]={target:'enemy-player65',effects:[{kind:'life-loss65',amount:3},{kind:'heal',amount:3}]};
const baseHouseTargets65=ruleTargetOptions;
ruleTargetOptions=function(kind,b=state.battle){return kind==='enemy-player65'?b.enemyCreatures.filter(u=>creatureAlive(u)&&!hasCreatureKeyword(u,'hexproof')).map(u=>({key:`enemy:${u.id}`,unit:u,card:u.card})):baseHouseTargets65(kind,b);};
const baseHouseEffect65=resolveReviewedEffect;
resolveReviewedEffect=function(effect,target,context={}){if(effect.kind!=='life-loss65')return baseHouseEffect65(effect,target,context);const u=choiceTargetUnit(target);if(u?.owner==='enemy'){u.health=Math.max(0,u.health-effect.amount);addLog(`${context.card?.name||'Spell'}: ${u.card.name} loses ${effect.amount} life.`);}};
for(const name of ["Jester's Cap","Jester's Scepter","Jester's Sombrero",VAULT65])REVIEWED_PERMANENTS.add(name);
for(const name of ["Demon's Jester",'Goblin Battle Jester','Havoc Jester','Spike Jester','The Madcap Jester'])SPECIAL_CREATURES.add(name);
const baseFamilyAudit65=rulesAudit;
rulesAudit=function(card){if(['Lava Spike',"Sovereign's Bite"].includes(card.name))return card.stolenUntil65!==undefined?{playable:true,adapted:true,reason:'Reviewed stolen spell; each monster is an opposing player.'}:{playable:false,reason:'Enemy repertoire only. The Madcap Jester can steal this spell for the current battle.'};return JESTER_NAMES65.has(card.name)?{playable:true,adapted:JESTER_VARIANTS65.has(card.name),reason:JESTER_VARIANTS65.has(card.name)?'Reviewed roguelike variant; see the in-game rules.':'Reviewed complete rules.'}:baseFamilyAudit65(card);};
const baseFamilyEffects65=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return JESTER_NAMES65.has(card.name)?[]:baseFamilyEffects65(card,creature);};

// A separate card-choice window keeps paid triggers distinct from unpaid abilities.
let visibleJesterChoice65=null;
function closeJesterChoice65(){
 const q=visibleJesterChoice65;visibleJesterChoice65=null;
 if(q){q.closed=true;if(q.battle.jesterChoice65===q)q.battle.jesterChoice65=null;if(q.battle.resolutionTask===q.marker)q.battle.resolutionTask=q.savedTask||null;}
 if($('#jester-choice-dialog')?.open)$('#jester-choice-dialog').close();return q;
}
function openJesterChoice65(config){
 const b=config.battle||state.battle;if(!b||b!==state.battle||b.phase==='complete'||visibleJesterChoice65)return false;
 const q={...config,battle:b,run:state.finishRun59,id:`jester-choice-${state.nextPermanentId++}`,selected:new Set(),min:config.min??1,max:config.max??1,closed:false,savedTask:b.resolutionTask,marker:{jesterChoice:true}};
 visibleJesterChoice65=q;b.jesterChoice65=q;b.resolutionTask=q.marker;hideCardPreview();renderJesterChoice65();$('#jester-choice-dialog').showModal();return true;
}
function renderJesterChoice65(){
 const q=visibleJesterChoice65;if(!q)return;
 $('#jester-choice-title').textContent=q.title;$('#jester-choice-instruction').textContent=q.instruction;
 $('#jester-choice-grid').innerHTML=q.options.map((o,i)=>`<button type="button" id="${q.id}-pick-${i}" class="tutor-search-card${q.selected.has(i)?' selected':''}" data-jester-pick65="${i}" aria-pressed="${q.selected.has(i)}">${o.card?`<span class="card-image-wrap">${cardFace(o.card)}</span>`:''}<b>${escapeHtml(o.label||o.card?.name||'Continue')}</b><small>${escapeHtml(o.note||'')}</small></button>`).join('');
 $('#jester-choice-status').textContent=`${q.selected.size} selected · ${q.min===q.max?`choose ${q.max}`:`choose up to ${q.max}`}${q.cancel?' · cancel pays nothing':''}`;
 $('#jester-choice-confirm').textContent=q.confirm||'Confirm →';$('#jester-choice-confirm').disabled=q.selected.size<q.min||q.selected.size>q.max;$('#jester-choice-confirm').dataset.choiceId=q.id;
 $('#jester-choice-cancel').hidden=!q.cancel;$('#jester-choice-cancel').textContent='Cancel · pay nothing';
}
function pickJesterChoice65(index){
 const q=visibleJesterChoice65;if(!q||q.closed||q.battle!==state.battle||!q.options[index])return false;
 if(q.selected.has(index))q.selected.delete(index);else{if(q.max===1)q.selected.clear();if(q.selected.size<q.max)q.selected.add(index);}renderJesterChoice65();return true;
}
function confirmJesterChoice65(id=visibleJesterChoice65?.id){
 const q=visibleJesterChoice65;if(!q||q.closed||q.id!==id||q.battle!==state.battle||q.run!==state.finishRun59||q.battle.phase==='complete'||q.selected.size<q.min||q.selected.size>q.max)return false;
 const selected=[...q.selected].map(i=>q.options[i]);
 if(q.validate&&!q.validate(selected)){showActionError('The source, choices or costs changed. Nothing was paid.');return false;}
 closeJesterChoice65();q.accept(selected);return true;
}
function cancelJesterChoice65(){const q=visibleJesterChoice65;if(!q)return false;if(!q.cancel){showActionError('Resolve this paid ability before continuing.');return false;}closeJesterChoice65();if(q.battle===state.battle&&q.run===state.finishRun59)q.cancel();return true;}
$('#jester-choice-grid').addEventListener('click',e=>{const button=e.target.closest('[data-jester-pick65]');if(button)pickJesterChoice65(Number(button.dataset.jesterPick65));});
$('#jester-choice-confirm').addEventListener('click',()=>confirmJesterChoice65($('#jester-choice-confirm').dataset.choiceId));
$('#jester-choice-cancel').addEventListener('click',cancelJesterChoice65);
$('#jester-choice-dialog').addEventListener('cancel',e=>{e.preventDefault();cancelJesterChoice65();});

function jesterPending65(b){return Boolean(b&&(b.jesterResolving65||b.jesterChoice65||b.jesterQueue65?.length));}
function queueJester65(b,job){if(!b||b!==state.battle||b.phase==='complete')return;(b.jesterQueue65||=[]).push(job);scheduleJesters65(b);}
function scheduleJesters65(b=state.battle){if(!b||b.jesterTimer65)return;b.jesterTimer65=true;setTimeout(()=>{b.jesterTimer65=false;pumpJesters65(b);},0);}
document.addEventListener('close',()=>scheduleJesters65(),true);
function afterJesters65(b,fn){if(!jesterPending65(b))return fn();(b.jesterContinuations65||=[]).push(fn);pumpJesters65(b);}
function pumpJesters65(b=state.battle){
 if(!b||b!==state.battle||b.phase==='complete'||b.jesterResolving65||b.resolutionTask||b.choice||b.scry||b.libraryOrder||b.interruption||b.diceRoll||b.enemyCastCheck||b.wardCastWarning||document.querySelector('dialog[open]'))return false;
 const job=b.jesterQueue65?.shift();if(!job){const waiting=b.jesterContinuations65?.splice(0)||[];for(const fn of waiting)fn();return false;}
 b.jesterResolving65=true;const marker={jesterTrigger:true};b.resolutionTask=marker;let completed=false;
 const done=()=>{if(completed||state.battle!==b)return;completed=true;if(b.resolutionTask===marker)b.resolutionTask=null;b.jesterResolving65=false;refreshPermanentEffects();b.creatures=removeDeadCreatures(b.creatures,'player');b.enemyCreatures=removeDeadCreatures(b.enemyCreatures,'enemy');if(b.phase==='complete')return;if(!b.enemyCreatures.length)return winBattle();renderBattle();pumpJesters65(b);};
 job(done);return true;
}
const baseFamilyTiming65=canCastNow;
canCastNow=function(card,b=state.battle){return Boolean(card&&!jesterPending65(b)&&!(card.stolenUntil65!==undefined&&card.stolenUntil65<b?.turn)&&baseFamilyTiming65(card,b));};
const baseFamilyBeat65=afterCombatBeat;
afterCombatBeat=function(b,phase,fn){if(jesterPending65(b))return afterJesters65(b,()=>baseFamilyBeat65(b,phase,fn));return baseFamilyBeat65(b,phase,fn);};
const baseFamilyAction65=handleCombatAction;
handleCombatAction=function(){if(jesterPending65(state.battle)){pumpJesters65();return;}return baseFamilyAction65();};
const baseFamilyScene65=showScreen;
showScreen=function(id){if(id!=='combat-screen'){closeJesterChoice65();const b=state.battle;if(b&&!b.interruption){b.jesterQueue65=[];b.jesterContinuations65=[];b.jesterResolving65=false;}}return baseFamilyScene65(id);};

const HOUSE_SPELLS65=['Shock','Lava Spike',"Sovereign's Bite",'Counterspell'];
function houseBans65(){if(!state.jesterBans65||state.jesterBanRun65!==state.finishRun59){state.jesterBanRun65=state.finishRun59;state.jesterBans65=new Set();}return state.jesterBans65;}
function houseCards65(){return HOUSE_SPELLS65.filter(name=>!houseBans65().has(name)).map(name=>[...BUNDLED_CARDS,...BUNDLED_ENEMY_SPELLS].find(c=>c.name===name)).filter(Boolean);}
const baseHouseIntent65=enemyIntent;
enemyIntent=function(enemy,turn=state.battle?.turn||1){const intent=baseHouseIntent65(enemy,turn),name={rune:'Shock',scorch:'Lava Spike',drain:"Sovereign's Bite"}[intent.kind];return name&&houseBans65().has(name)?{kind:'guard',damage:0,label:`${name} sealed · guard`,icon:'◈'}:intent;};
const baseHouseCounter65=enemyCounterReady44;
enemyCounterReady44=function(enemy,b=state.battle){return !houseBans65().has('Counterspell')&&baseHouseCounter65(enemy,b);};
const baseFamilyKeywords65=creatureKeywordLabels;
creatureKeywordLabels=function(unit){let text=baseFamilyKeywords65(unit);if(unit?.counterspell&&houseBans65().has('Counterspell'))text=text.replace(/Counterspell[^·]*/,'Counterspell sealed this run ');return [text,unit?.card?.name==="Demon's Jester"?(unit.hellbentPower65?'Hellbent · +2/+1':'Hellbent · empty hand: +2/+1'):'',unit?.owner==='enemy'&&unit.noRetaliation65===state.battle?.turn?'Cannot retaliate this turn':''].filter(Boolean).join(' · ');};

function familyPermanentReady65(p,b=state.battle){return Boolean(b&&b===state.battle&&b.permanents.includes(p)&&!p.tapped&&!permanentActionBusy60(b)&&!b.librarySearch&&!jesterPending65(b)&&b.mana>=2&&['main','attack','enemy','blocks','damage'].includes(b.phase));}
const baseFamilyCost65=permanentActivationCost;
permanentActivationCost=function(card){return ["Jester's Cap","Jester's Scepter","Jester's Sombrero"].includes(card.name)?2:baseFamilyCost65(card);};
const baseFamilyAvailable65=canActivatePermanent;
canActivatePermanent=function(p,b=state.battle){
 if(!p)return false;
 if(p.card.name==="Jester's Cap")return familyPermanentReady65(p,b)&&b.deck.length>0;
 if(p.card.name==="Jester's Sombrero")return familyPermanentReady65(p,b)&&houseCards65().length>0;
 if(p.card.name==="Jester's Scepter"){const spell=activeEnemySpell38(b);return familyPermanentReady65(p,b)&&spell?.status==='pending'&&p.imprints65?.some(c=>b.exile.includes(c)&&c.name===spell.card.name);}
 return !jesterPending65(b)&&baseFamilyAvailable65(p,b);
};
function sacrificeFamily65(p,b){const sources=havocSources65(b);p.tapped=true;b.permanents=b.permanents.filter(u=>u!==p);b.graveyard.push(p.card);b.mulliganAvailable=false;notifySacrifice65(b,sources);}
function beginCap65(p,b){
 const cards=[...b.deck].sort((a,c)=>(a.cmc||0)-(c.cmc||0)||a.name.localeCompare(c.name)),count=Math.min(3,cards.length);
 return openJesterChoice65({battle:b,title:"Jester's Cap · target: YOU",instruction:`Choose ${count} physical card${count===1?'':'s'} from your remaining library. Pay 2 mana, tap and sacrifice the Cap to exile them and permanently remove those copies from this run. Other copies stay. Then shuffle.`,options:cards.map(card=>({card,note:state.deck.some(c=>c.runCardId60&&c.runCardId60===card.runCardId60)?'Removed from the entire run':'Temporary card · removed from this battle'})),min:count,max:count,confirm:`Pay 2 · remove ${count} from run`,cancel:()=>renderBattle(),validate:selected=>b.permanents.includes(p)&&!p.tapped&&b.mana>=2&&selected.every(o=>b.deck.includes(o.card)),accept:selected=>{
  if(!payMana(2,b))return;sacrificeFamily65(p,b);
  const removed=new Set(selected.map(o=>o.card)),ids=new Set(selected.map(o=>o.card.runCardId60).filter(Boolean));
  b.deck=shuffle(b.deck.filter(c=>!removed.has(c)));state.deck=state.deck.filter(c=>!removed.has(c)&&!ids.has(c.runCardId60));
  for(const card of removed){b.exile.push(card);(b.runRemoved65||=[]).push(card);}
  addLog(`Jester's Cap targets YOU: ${[...removed].map(c=>c.name).join(', ')} are exiled and removed from this run. Your library is shuffled.`);refreshPermanentEffects();renderBattle();
 }});
}
function beginSombrero65(p,b){
 const cards=houseCards65(),count=Math.min(3,cards.length);
 return openJesterChoice65({battle:b,title:"Jester's Sombrero · House Reserve variant",instruction:`Opponents have no sideboard. Choose ${count} enemy spell name${count===1?'':'s'} to seal for the rest of this run. Future foes cannot cast them. Spells already cast are unaffected.`,options:cards.map(card=>({card,note:'Seal this enemy spell for the run'})),min:count,max:count,confirm:'Pay 2 · sacrifice · seal spells',cancel:()=>renderBattle(),validate:selected=>b.permanents.includes(p)&&!p.tapped&&b.mana>=2&&selected.every(o=>!houseBans65().has(o.card.name)),accept:selected=>{
  if(!payMana(2,b))return;sacrificeFamily65(p,b);for(const o of selected)houseBans65().add(o.card.name);addLog(`House Reserve: ${selected.map(o=>o.card.name).join(', ')} cannot be cast by future enemies this run.`);refreshPermanentEffects();renderBattle();
 }});
}
const baseFamilyActivate65=activatePermanent;
activatePermanent=function(id){
 const b=state.battle,p=b?.permanents.find(u=>u.id===id);if(!p)return false;
 if(["Jester's Cap","Jester's Sombrero","Jester's Scepter"].includes(p.card.name)){
  if(!canActivatePermanent(p,b))return false;if(p.card.name==="Jester's Cap")return beginCap65(p,b);if(p.card.name==="Jester's Sombrero")return beginSombrero65(p,b);
  const spell=activeEnemySpell38(b),card=p.imprints65.find(c=>b.exile.includes(c)&&c.name===spell.card.name);if(!card||!payMana(2,b))return false;
  p.tapped=true;p.imprints65=p.imprints65.filter(c=>c!==card);b.exile=b.exile.filter(c=>c!==card);b.graveyard.push(card);finishEnemySpell38(spell,'countered',b);b.mulliganAvailable=false;addLog(`Jester's Scepter spends its ${card.name} imprint and counters ${spell.sourceName}'s ${spell.card.name}.`);renderBattle();return true;
 }
 const sources=havocSources65(b),result=baseFamilyActivate65(id);if(result&&p.card.name!=='Sol Ring'&&p.card.name!=='Jack-in-the-Mox'&&!b.permanents.includes(p))notifySacrifice65(b,sources);return result;
};
const baseFamilyLabel65=permanentActivationLabel51;
permanentActivationLabel51=function(p){return ["Jester's Cap","Jester's Sombrero"].includes(p.card.name)?'Pay 2 · tap · sacrifice':p.card.name==="Jester's Scepter"?'Pay 2 · tap · spend matching imprint':baseFamilyLabel65(p);};
const baseFamilyDetails65=tokenActionDetails47;
tokenActionDetails47=function(p){
 if(p?.card.name==="Jester's Cap")return {effect:'Target: YOU. Choose three physical cards from your remaining library (or all if fewer). Exile them and remove those copies from your run deck, then shuffle. Your other copies keep their upgrades. Choose cards before paying.',cost:'2 generic mana · tap · sacrifice',action:'Choose cards to remove →'};
 if(p?.card.name==="Jester's Sombrero")return {effect:'House Reserve variant: choose three enemy spell names (or all remaining). Seal them for the rest of this run. Already-cast spells are unaffected. Choose before paying.',cost:'2 generic mana · tap · sacrifice',action:'Choose enemy spells →'};
 if(p?.card.name==="Jester's Scepter")return {effect:`Target: YOU. On entry, exile the top five cards of your library (or all remaining). Pay 2, tap and put an exiled card into your graveyard to counter a pending enemy spell with the same name. This does not remove cards from your run deck. Exiled cards: ${(p.imprints65||[]).map(c=>c.name).join(' · ')||'none'}.`,cost:'2 generic mana · tap · spend one matching exiled card',action:'Counter the matching spell'};
 if(p?.card.name===VAULT65)return {effect:effectDescriptions(p.card).join(' ')+` Current chapter: ${p.lore65||1} / 3.`,cost:'Saga chapters trigger automatically',action:'No activated ability'};
 return baseFamilyDetails65(p);
};
const baseFamilyOpen65=openTokenAction47;
openTokenAction47=function(id){if(jesterPending65(state.battle)){pumpJesters65();return false;}return baseFamilyOpen65(id);};
const baseFamilyWindow65=renderTokenAction47;
renderTokenAction47=function(){baseFamilyWindow65();const b=state.battle,p=b?.permanents.find(u=>u.id===state.tokenAction47?.id);if(!p)return;if(p.card.name==="Jester's Cap"&&!b.deck.length)$('#token-action-status').textContent='Your library is empty. There are no cards to remove.';if(p.card.name==="Jester's Scepter"&&!canActivatePermanent(p,b))$('#token-action-status').textContent=p.tapped?'Tapped. Untaps next turn.':'Requires 2 mana and a pending enemy spell matching one of these imprints.';};

function vaultChapter65(p,chapter,b){
 p.lore65=chapter;queueJester65(b,done=>{
  if(chapter<3){
   const draw=()=>{if(b.phase!=='complete')drawOneCard();addLog(`${VAULT65} · chapter ${chapter}: discard, then draw.`);done();};
   if(!b.hand.length)return draw();
   return openJesterChoice65({battle:b,title:`${VAULT65} · chapter ${chapter}`,instruction:'Choose one card to discard, then draw one card. This chapter has already triggered.',options:b.hand.map(card=>({card})),accept:selected=>{const card=selected[0].card,i=b.hand.indexOf(card);if(i>=0)b.graveyard.push(...b.hand.splice(i,1));draw();}});
  }
  const reveal=selected=>{const cards=selected.map(o=>o.card),counts=new Map();for(const c of cards)counts.set(Math.ceil(c.cmc||0),(counts.get(Math.ceil(c.cmc||0))||0)+1);const n=cards.filter(c=>counts.get(Math.ceil(c.cmc||0))>=2).length;createTreasure55(n,b);addLog(`${VAULT65} · chapter III: reveal ${cards.length}; ${n} cards share a mana value. Create ${n} Treasure.`);if(b.permanents.includes(p))sacrificeFamily65(p,b);done();};
  const options=b.hand.filter(c=>!isLand(c)).map(card=>({card,note:`Mana value ${Math.ceil(card.cmc||0)}`}));
  if(!options.length)return reveal([]);
  return openJesterChoice65({battle:b,title:`${VAULT65} · chapter III`,instruction:'Reveal up to five nonland hand cards. Each revealed card with a mana-value partner creates one Treasure. A pair makes 2; a triple makes 3. Then sacrifice this Saga.',options,min:0,max:Math.min(5,options.length),confirm:'Reveal selected · create Treasure',accept:reveal});
 });
}
const baseFamilyRefresh65=refreshPermanentEffects;
refreshPermanentEffects=function(){
 const b=state.battle;if(!b)return baseFamilyRefresh65();
 for(const u of b.creatures){u.power-=u.hellbentPower65||0;u.toughness-=u.hellbentToughness65||0;u.hellbentPower65=u.hellbentToughness65=0;}
 baseFamilyRefresh65();
 for(const u of b.creatures)if(u.card.name==="Demon's Jester"&&!b.hand.length){u.power+=2;u.toughness+=1;u.hellbentPower65=2;u.hellbentToughness65=1;}
 for(const p of b.permanents){
  if(p.card.name===VAULT65&&!p.lore65)vaultChapter65(p,1,b);
  if(p.card.name==="Jester's Scepter"&&!p.imprints65){p.imprints65=b.deck.splice(Math.max(0,b.deck.length-5)).reverse();b.exile.push(...p.imprints65);addLog(`Jester's Scepter targets YOU and exiles the top ${p.imprints65.length} library cards. Click it to review them. Your run deck is unchanged.`);}
 }
};
const baseHellbentState65=refreshPermanentEffects;
refreshPermanentEffects=function(){baseHellbentState65();const b=state.battle;if(!b)return;const dead=b.creatures.filter(u=>u.card.name==="Demon's Jester"&&!creatureAlive(u));if(dead.length){b.creatures=b.creatures.filter(u=>!dead.includes(u));removeDeadCreatures(dead,'player');}};
const baseFamilyTurn65=beginNextPlayerTurn45;
beginNextPlayerTurn45=function(b=state.battle){const turn=b?.turn;if(b===state.battle&&b.phase!=='complete')expireStolen65(b,b.turn+1);const result=baseFamilyTurn65(b);if(b!==state.battle||b?.phase==='complete'||b.turn===turn)return result;for(const p of [...b.permanents])if(p.card.name===VAULT65&&p.lore65&&p.lore65<3)vaultChapter65(p,p.lore65+1,b);renderBattle();return result;};

function havocSources65(b){return (b?.creatures||[]).filter(u=>u.card.name==='Havoc Jester').map(u=>({...u,permanentKeywords:[...(u.permanentKeywords||[])],temporaryKeywords:[...(u.temporaryKeywords||[])]}));}
function jesterTargetOptions65(b,enemiesOnly=false){return [...b.enemyCreatures.filter(u=>creatureAlive(u)&&!hasCreatureKeyword(u,'hexproof')).map(u=>({card:u.card,target:{side:'enemy',id:u.id},note:`Enemy · ${u.health} life${wardCost(u)?` · Ward (${wardCost(u)} mana)`:''}`})),...(!enemiesOnly?[...b.creatures.filter(creatureAlive).map(u=>({card:u.card,target:{side:'player',id:u.id},note:'Your creature'})),{label:'Your life',note:`You · ${state.playerHealth} life`,target:{side:'life'}}]:[])];}
function withJesterWard65(b,target,source,effect,done){
 const unit=choiceTargetUnit(target,b);if(target.side!=='life'&&(!unit||unit.owner==='enemy'&&hasCreatureKeyword(unit,'hexproof')))return done();
 const cost=unit?.owner==='enemy'?wardCost(unit):0;
 const resolve=()=>{effect(unit);done();};if(!cost)return resolve();
 openJesterChoice65({battle:b,title:`${source} · Ward (${cost} mana)`,instruction:`Pay ${cost} generic mana or this triggered ability is countered. This is an ability, not a spell.`,options:[...(b.mana>=cost?[{label:`Pay ${cost} mana`,pay:true}]:[]),{label:'Let the ability be countered',pay:false}],accept:selected=>{if(selected[0].pay&&payMana(cost,b))resolve();else{addLog(`${source}'s ability is countered by Ward.`);done();}}});
}
function notifySacrifice65(b,sources=havocSources65(b)){
 for(const source of sources)queueJester65(b,done=>openJesterChoice65({battle:b,title:'Havoc Jester · sacrifice trigger',instruction:'A permanent was sacrificed. Choose any creature or your life for 1 damage. Enemy Hexproof and Ward apply.',options:jesterTargetOptions65(b),accept:selected=>withJesterWard65(b,selected[0].target,'Havoc Jester',unit=>{
  if(selected[0].target.side==='life'){state.playerHealth-=1;playSfx('player-hit');if(typeof animatePlayerDamage==='function')animatePlayerDamage(1);}else if(unit?.owner==='enemy')damageFirstEnemy(1,unit);else if(unit)unit.damage=(unit.damage||0)+1;
  if(unit&&hasCreatureKeyword(source,'deathtouch')){unit.deathtouchDamage=true;if(unit.owner==='enemy')unit.health=0;}gainLifelinkLife(source,'player',1,b);if(state.playerHealth<=0)endRun(false);
 },done)}));
}
const baseFamilySacrifice65=sacrificeRuleCreature;
sacrificeRuleCreature=function(unit){const b=state.battle,sources=havocSources65(b),result=baseFamilySacrifice65(unit);if(result)notifySacrifice65(b,sources);return result;};
const baseFamilyPermanentSac65=sacrificePermanent55;
sacrificePermanent55=function(key,b){const sources=havocSources65(b),result=baseFamilyPermanentSac65(key,b);if(result&&!key.startsWith('player:'))notifySacrifice65(b,sources);return result;};
function onPlayerSpellCast65(card,b){
 if(!/\{[^}]*R[^}]*\}/.test(card.mana_cost||''))return;
 for(const source of b.creatures.filter(u=>u.card.name==='Goblin Battle Jester'))queueJester65(b,done=>{const options=jesterTargetOptions65(b,true);if(!options.length)return done();openJesterChoice65({battle:b,title:'Goblin Battle Jester · red spell',instruction:'Roguelike variant: choose an enemy that cannot retaliate against your attacks this turn. Hexproof and Ward apply. Triggers when you cast a red spell, even if that spell is countered.',options,accept:selected=>withJesterWard65(b,selected[0].target,source.card.name,unit=>{unit.noRetaliation65=b.turn;addLog(`${unit.card.name} cannot retaliate against your attacks this turn.`);},done)});});
}
const baseFamilyCombat65=resolveCombatDamage;
resolveCombatDamage=function(attackers,assignments,side='player'){
 const b=state.battle,muted=side==='player'?b.enemyCreatures.filter(u=>u.noRetaliation65===b.turn).map(u=>({u,power:u.power})):[];for(const {u} of muted)u.power=0;
 try{return baseFamilyCombat65(attackers,assignments,side);}finally{for(const {u,power} of muted)u.power=power;}
};
const baseFamilyAttack65=resolveAttackTrigger55;
resolveAttackTrigger55=function(unit,b,resume){
 if(unit.card.name!=='The Madcap Jester')return baseFamilyAttack65(unit,b,resume);
 const pool=houseCards65();if(!pool.length){addLog('The Madcap Jester: the house reserve is sealed.');return false;}
 const card={...runCard59(pool[Math.floor(Math.random()*pool.length)]),stolenUntil65:b.turn+1};b.hand.push(card);addLog(`The Madcap Jester · House Theft variant: steal ${card.name}. You may cast it from hand until the end of turn ${card.stolenUntil65}. Normal generic mana costs apply.`);refreshPermanentEffects();renderBattle();resume();return true;
};
function expireStolen65(b,turn=b.turn){for(const zone of ['hand','deck']){const expired=b[zone].filter(c=>c.stolenUntil65!==undefined&&c.stolenUntil65<turn);if(!expired.length)continue;b[zone]=b[zone].filter(c=>!expired.includes(c));b.exile.push(...expired);addLog(`${expired.map(c=>c.name).join(', ')}: stolen-card permission expired; exiled.`);}}
const baseFamilyBattleRender65=renderBattle;
renderBattle=function(){const b=state.battle;if(b)expireStolen65(b);if(b?.creatures.some(u=>u.card.name==="Demon's Jester"&&Boolean(u.hellbentPower65)!==!b.hand.length)){refreshPermanentEffects();b.creatures=removeDeadCreatures(b.creatures,'player');}const result=baseFamilyBattleRender65();if(b&&visibleJesterChoice65&&(visibleJesterChoice65.battle!==b||b.phase==='complete'))closeJesterChoice65();scheduleJesters65(b);return result;};
const baseFamilyCaption65=permanentMarkup;
permanentMarkup=function(p,attached=false){let html=baseFamilyCaption65(p,attached);const caption=p.card.name===VAULT65?`Chapter ${['','I','II','III'][p.lore65||1]} / III · click for rules`:p.card.name==="Jester's Scepter"?`${p.imprints65?.length||0} imprints · click to counter`:p.card.name==="Jester's Cap"?'Target yourself · prune your run':p.card.name==="Jester's Sombrero"?'Seal enemy spells for this run':null;return caption?html.replace('Active enchantment / artifact',caption):html;};
const baseFamilyDescriptions65=effectDescriptions;
effectDescriptions=function(card){
 const rules={
  "Jester's Cap":['Self-target / run-removal variant. Cast for 4 generic mana. Pay 2, tap and sacrifice: target YOU. Choose three physical cards from your remaining library, or all if fewer.','Exile the chosen cards and permanently remove those physical copies from your run deck, then shuffle. Other copies and their run counters are unchanged. Temporary cards can be exiled but were never part of the run deck.','Choose cards before paying; cancel is free. Removed cards never return in later encounters or Endless.'],
  "Jester's Scepter":['Self-target version: on entry, exile the top five cards of YOUR remaining library face down, or all remaining cards if fewer. You may look at them by clicking the Scepter or opening exile. This is not drawing and does not remove cards from your run deck.','Pay 2 generic mana, tap and put one card exiled with this Scepter into your graveyard: counter the pending enemy spell with that exact name. Works against enemy Counterspell too.','Each activation spends one physical exiled card, keeping its run upgrades. The Scepter untaps normally next turn. No matching pending spell means no activation. Casting the artifact is counterable; activating it is not a spell.'],
  "Jester's Sombrero":['House Reserve variant: opponents have no sideboard. Pay 2 generic mana, tap and sacrifice: choose three enemy spell names, or all remaining names.','Seal those names for the rest of this run, including future encounters and Endless. Future casts and enemy Counterspell attempts are prevented. Spells already cast are unaffected. A new run clears all seals.','Choose names before paying. Cancel is free.'],
  [VAULT65]:['Saga. Cast for 2 generic mana. Chapter I triggers on entry; chapters II and III follow your normal draw at the start of your next two turns.','I and II: choose and discard a hand card, then draw one. With an empty hand, still draw. An empty library loses the run normally.','III: reveal up to five nonland hand cards. For each revealed card sharing a mana value with another revealed card, create one Treasure. Two equal values make 2 Treasure; three equal values make 3. Cards stay in hand. Then sacrifice the Saga.','Each Saga tracks its own chapters and choices. Copies, entry, triggers and sacrifices do not modify your persistent run deck.'],
  "Demon's Jester":['Flying. Hellbent: gets +2/+1 while your hand is empty (4/3 instead of 2/2).','The bonus updates when hand size changes and stacks with normal counters, auras and equipment. Losing the toughness bonus can cause lethal marked damage.'],
  'Spike Jester':['A 3/1 with Haste for 2 generic mana. Can attack on the turn it enters.'],
  'Goblin Battle Jester':['Retaliation variant: whenever you cast a red spell, choose an enemy that cannot retaliate against your attacks this turn.','Red is determined by the printed mana cost; payment still uses generic mana. The trigger happens on casting, even if the spell is countered. Enemy Hexproof and Ward apply. The enemy can still attack in its own turn.'],
  'Havoc Jester':['Whenever you sacrifice a permanent, this creature deals 1 damage to a creature or your life. Choose a target for each trigger.','Includes Treasure, Food, Clue, Lotus, Mask, Cap, Sombrero, Saga and sacrificed creatures, including this Jester itself. Multiple Jesters trigger separately. Destruction, exile, discard and the legend rule are not sacrifices.','Triggers wait for current choices or rolls to finish. Enemy Hexproof and Ward apply. Abilities cannot be stopped by enemy Counterspell.'],
  'The Madcap Jester':['House Theft variant: opponents have no library. Whenever this creature actually attacks, take one random unsealed enemy-repertoire spell into your hand.','You may cast the stolen spell until the end of your next turn, paying its normal generic mana cost and choosing targets normally. Uncast stolen cards are then exiled. This permission follows a card returned to the library or graveyard too.','Stolen cards last only for this battle and do not enter your run deck. Queuing or withdrawing an attack does not steal.']
  ,'Lava Spike':['Deal 3 damage to one enemy opponent. Cannot target your creatures. Normal mana, Ward and Counterspell rules apply.']
  ,"Sovereign's Bite":['One enemy opponent loses 3 life, then you gain 3 life. Life loss is not damage. Normal mana, Ward and Counterspell rules apply.']
 };
 const lines=rules[card.name]?[...rules[card.name]]:baseFamilyDescriptions65(card);
 if(rules[card.name]&&card.conjuredByMask64)lines.push('Conjured by Jester’s Mask for this battle only. Not added to your run deck.');
 if(card.stolenUntil65!==undefined)lines.push(`Stolen until the end of turn ${card.stolenUntil65}; costs normal generic mana. Not added to your run deck.`);
 return lines;
};
const baseFamilySummary65=draftAbilitySummary;
draftAbilitySummary=function(card){return {"Jester's Cap":'Pay 2, tap, sacrifice: exile 3 library cards and remove them from your run.',"Jester's Scepter":'Exile your top 5. Pay 2, tap, spend a match: counter an enemy spell.',"Jester's Sombrero":'Pay 2, tap, sacrifice: seal 3 enemy spell names for this run.',[VAULT65]:'Saga I/II: discard, draw. III: reveal matching mana values for Treasure.',"Demon's Jester":'Flying. Empty hand: +2/+1.','Spike Jester':'Haste.','Goblin Battle Jester':'Cast a red spell: one enemy cannot retaliate this turn.','Havoc Jester':'Sacrifice a permanent: choose a target for 1 damage.','The Madcap Jester':'Attack: steal an enemy spell to cast through your next turn.'}[card.name]||baseFamilySummary65(card);};
const baseFamilyCatalog65=collectionEntryMarkup;
collectionEntryMarkup=function(card,index,kind){const html=baseFamilyCatalog65(card,index,kind);return kind==='catalog'&&JESTER_VARIANTS65.has(card.name)?html.replace('Playable · reviewed rules','Playable · roguelike variant'):html;};
