/* v0.103 — reviewed combat legends, upkeep, Meteorites and token triggers.
 * Costs remain generic. Each monster represents one opposing player; the
 * battlefield's six-creature limit also applies to Adeline's attacking Humans.
 */
const CARDS103=new Set(['Primordial Ooze','Aurelia, the Warleader','Aurelia, the Law Above','Gisela, Blade of Goldnight','Adeline, Resplendent Cathar','Anzrag, the Quake-Mole','Zopandrel, Hunger Dominus','Roxanne, Starfall Savant','Mirkwood Bats']);
const TOKENS103={"human":{"id":"b7667345-e11b-4cad-ac4c-84eb1c5656c5","name":"Human","mana_cost":"","cmc":0.0,"type_line":"Token Creature — Human","oracle_text":"","power":"1","toughness":"1","color_identity":["W"],"keywords":[],"image":"assets/cards/b7667345-e11b-4cad-ac4c-84eb1c5656c5.jpg","art":"https://cards.scryfall.io/art_crop/front/b/7/b7667345-e11b-4cad-ac4c-84eb1c5656c5.jpg?1783925225","uri":"https://scryfall.com/card/tmid/1/human?utm_source=api","verified":true,"rarity":"common","art_print":{"id":"b7667345-e11b-4cad-ac4c-84eb1c5656c5","set":"tmid","set_name":"Innistrad: Midnight Hunt Tokens","released_at":"2021-09-24","rarity":"common","uri":"https://scryfall.com/card/tmid/1/human?utm_source=api"}},"meteorite":{"id":"00b41ca9-0bf0-41fc-af65-854e602ee007","name":"Meteorite","mana_cost":"","cmc":0.0,"type_line":"Token Artifact","oracle_text":"When Meteorite enters the battlefield, it deals 2 damage to any target.\n{T}: Add one mana of any color.","color_identity":[],"keywords":[],"image":"assets/cards/00b41ca9-0bf0-41fc-af65-854e602ee007.jpg","art":"https://cards.scryfall.io/art_crop/front/0/0/00b41ca9-0bf0-41fc-af65-854e602ee007.jpg?1783911520","uri":"https://scryfall.com/card/totj/17/meteorite?utm_source=api","verified":true,"rarity":"common","art_print":{"id":"00b41ca9-0bf0-41fc-af65-854e602ee007","set":"totj","set_name":"Outlaws of Thunder Junction Tokens","released_at":"2024-04-19","rarity":"common","uri":"https://scryfall.com/card/totj/17/meteorite?utm_source=api"},"meteorite103":true}};
TOKENS103.human.colors=['W'];TOKENS103.meteorite.colors=[];
for(const name of CARDS103)SPECIAL_CREATURES.add(name);
for(const name of ['Anzrag, the Quake-Mole','Zopandrel, Hunger Dominus'])ACTIVATED66.add(name);
const baseAudit103=rulesAudit,baseEffects103=cardEffects;
rulesAudit=function(card){return CARDS103.has(card.name)?{playable:true,adapted:['Adeline, Resplendent Cathar','Anzrag, the Quake-Mole','Aurelia, the Law Above','Mirkwood Bats'].includes(card.name),reason:'Reviewed abilities. Generic costs; each monster is an opponent; six allied creature slots. See the complete in-game rules.'}:baseAudit103(card);};
cardEffects=function(card,creature=isCreature(card)){return CARDS103.has(card.name)||card.meteorite103?[]:baseEffects103(card,creature);};
function sources103(name,b=state.battle){return(b?.creatures||[]).filter(u=>u.card.name===name&&creatureAlive(u));}

// Replacement effects apply AFTER assignment, once per recipient, before
// lifelink/infect/deathtouch. Snapshot Gisela for the entire simultaneous step.
let giselaStep103=null;
function damageAmount103(amount,target,b=state.battle){
 amount=Math.max(0,amount||0);const n=giselaStep103?.battle===b?giselaStep103.count:sources103('Gisela, Blade of Goldnight',b).length;
 if(target?.owner==='enemy')return amount*Math.pow(2,n);
 for(let i=0;i<n;i++)amount=Math.floor(amount/2);
 return amount;
}
const baseBeforeStep103=beforeCombatDamageStep95,baseAfterStep103=afterCombatDamageStep95,basePlayerDamage103=playerDamageAmount95;
beforeCombatDamageStep95=function(b){baseBeforeStep103(b);giselaStep103={battle:b,count:sources103('Gisela, Blade of Goldnight',b).length};};
afterCombatDamageStep95=function(b){baseAfterStep103(b);if(giselaStep103?.battle===b)giselaStep103=null;};
playerDamageAmount95=function(amount,b=state.battle){return basePlayerDamage103(damageAmount103(amount,null,b),b);};
const baseCombat103=resolveCombatDamage;
resolveCombatDamage=function(attackers,assignments,side='player',...rest){
 const b=state.battle,previous=giselaStep103;
 if(side==='player')for(const u of attackers){
  const group=assignments.get(u.id),blockers=(Array.isArray(group)?group:group?[group]:[]).filter(e=>creatureAlive(e)&&canAttackEnemy(u,e)&&canBlockCreature(e,u)&&!hasCreatureKeyword(u,'menace')&&e.noRetaliation65!==b.turn);
  if(u.card.name==='Anzrag, the Quake-Mole'&&creatureAlive(u)&&blockers.length&&u.blockedCombat103!==(b.combatSerial103||0)){
   u.blockedCombat103=b.combatSerial103||0;untapTeam103(b);b.extraCombats103=(b.extraCombats103||0)+1;
   addLog('Anzrag became blocked: untap your creatures; gain an additional combat after this one.');
  }
 }
 try{return baseCombat103(attackers,assignments,side,...rest);}finally{giselaStep103=previous;}
};

// Adeline has a characteristic-defining base power. Subtract/reapply just
// that contribution so counters, auras, run upgrades and temporary buffs stay.
const baseStats103=parseStats,baseRefresh103=refreshPermanentEffects;
parseStats=function(card){return card.name==='Adeline, Resplendent Cathar'?baseStats103({...card,power:'0',toughness:'4'}):baseStats103(card);};
refreshPermanentEffects=function(){
 const b=state.battle;if(b)for(const u of b.creatures)if(u.card.name==='Adeline, Resplendent Cathar'){u.power-=u.adelinePower103||0;u.adelinePower103=0;}
 const result=baseRefresh103();
 if(b)for(const u of b.creatures)if(u.card.name==='Adeline, Resplendent Cathar'){u.adelinePower103=b.creatures.length;u.power+=u.adelinePower103;}
 return result;
};

// Explicit creation/sacrifice events. Restoring persistent battlefield zones,
// destroying, exiling and the legend rule are deliberately not sacrifice events.
let sacrificeSources103=null;
function tokenEvent103(token,b,sources=sacrificeSources103||sources103('Mirkwood Bats',b)){
 if(!token?.isToken)return;const opponents=new Set(b.enemyCreatures.map(e=>e.id));
 for(const source of sources)queueJester65(b,done=>{
  for(const enemy of b.enemyCreatures.filter(e=>opponents.has(e.id)))enemy.health=Math.max(0,enemy.health-1);
  addLog(`${source.card.name}: each opponent loses 1 life (token created or sacrificed).`);playSfx('enemy-hit');done();
 });
}
function tokenCreated103(token,b){tokenEvent103(token,b,sources103('Mirkwood Bats',b));}
function tokenWitnesses103(b){return(sacrificeSources103||sources103('Mirkwood Bats',b)).map(snapshotSource66);}
function tokenSacrificed103(token,b,witnesses=null){tokenEvent103(token,b,witnesses||sacrificeSources103||sources103('Mirkwood Bats',b));}
function artifactTokenMana103(token,b){
 if(!token?.isToken||!/Artifact/.test(token.card.type_line))return;
 const n=sources103('Roxanne, Starfall Savant',b).length;if(n){addFloatingMana58(n,b);addLog(`Roxanne: +${n} floating generic mana from tapping an artifact token for mana.`);}
}

function createMeteorite103(b){
 const token={id:`meteorite-${state.nextPermanentId++}`,card:TOKENS103.meteorite,isToken:true,tapped:true,attachedTo:null};
 b.permanents.push(token);tokenCreated103(token,b);addLog('Roxanne creates a tapped Meteorite. Its separate entry trigger deals 2 damage.');
 const source={card:token.card,owner:'player',power:0};
 queueJester65(b,done=>{
  const options=jesterTargetOptions65(b,false,source);if(!options.length)return done();
  openJesterChoice65({battle:b,title:'Meteorite · entry trigger',instruction:'Deal 2 damage to any legal target. Ward is paid separately; the Meteorite enters tapped and stays on the battlefield.',options,accept:chosen=>withJesterWard65(b,chosen[0].target,token.card,()=>dealAbility66(source,chosen[0].target,2,b),done)});
 });
 return token;
}
// The quoted tap ability belongs to the METEORITE, never to Roxanne.
const baseManaCreature103=manaCreatureAction73,baseCanTap103=canTapForMana;
manaCreatureAction73=function(u){return u?.card?.name!=='Roxanne, Starfall Savant'&&baseManaCreature103(u);};
canTapForMana=function(u,b=state.battle){return u?.card?.name!=='Roxanne, Starfall Savant'&&baseCanTap103(u,b);};
const baseEntry103=onCreatureEntered;
onCreatureEntered=function(u){const b=state.battle,result=baseEntry103(u);refreshPermanentEffects();if(u.card.name==='Roxanne, Starfall Savant'&&b.creatures.includes(u))createMeteorite103(b);return result;};
const baseCost103=permanentActivationCost,baseReady103=canActivatePermanent,baseActivate103=activatePermanent,baseDetails103=tokenActionDetails47,baseLabel103=permanentActivationLabel51;
permanentActivationCost=function(card){return card.meteorite103?0:baseCost103(card);};
permanentActivationLabel51=function(p){return p.card.meteorite103?p.tapped?'Tapped · untaps next turn':'Tap · add 1 mana':baseLabel103(p);};
canActivatePermanent=function(p,b=state.battle){return p?.card.meteorite103?Boolean(b&&b===state.battle&&b.permanents.includes(p)&&!p.tapped&&!permanentActionBusy60(b)&&!jesterPending65(b)&&!b.librarySearch&&['main','attack','enemy','blocks','damage'].includes(b.phase)):baseReady103(p,b);};
activatePermanent=function(id){
 const b=state.battle,p=b?.permanents.find(p=>p.id===id);if(!p?.card.meteorite103)return baseActivate103(id);
 if(!canActivatePermanent(p,b))return false;p.tapped=true;b.mulliganAvailable=false;addFloatingMana58(1,b);artifactTokenMana103(p,b);addLog('Meteorite: add 1 floating generic mana. The token stays in play.');renderBattle();playSfx('select');return true;
};
tokenActionDetails47=function(p){return p?.card.meteorite103?{effect:'Tap to add 1 floating generic mana. Roxanne adds 1 extra while she remains in play. This token is not sacrificed.',cost:'Tap · no mana cost',action:p.tapped?'Tapped · untaps next turn':'Tap → Add mana'}:baseDetails103(p);};

function settleBattlefield103(b){settleReviewed66(b);}
function untapTeam103(b){for(const u of b.creatures)u.tapped=false;}
function beginCombat103(b,side){
 refreshPermanentEffects();
 b.combatSerial103=(b.combatSerial103||0)+1;
 if(side==='player')for(const u of b.creatures)u.attackedThisTurn=false;
 for(const source of sources103('Zopandrel, Hunger Dominus',b)){
  // Snapshot each recipient separately for this trigger; the next trigger
  // reads its already doubled values. Negative power is doubled as printed.
  const stats=b.creatures.map(u=>({u,power:u.power,toughness:u.toughness}));
  for(const {u,power,toughness} of stats)resolveReviewedEffect({kind:'buff',power,toughness},{side:'player',id:u.id},{card:source.card});
  addLog('Zopandrel: double each of your creatures’ power and toughness until end of turn.');
 }
}
function lawAbove103(attackers,b){
 const n=attackers.length;if(n<3)return;
 for(const source of sources103('Aurelia, the Law Above',b)){
  const snapshot=snapshotSource66(source);
  queueJester65(b,done=>{drawOneCard();addLog('Aurelia, the Law Above: three or more declared attackers — draw a card.');done();});
  if(n>=5)queueJester65(b,done=>{
   for(const e of [...b.enemyCreatures])dealAbility66(snapshot,{side:'enemy',id:e.id},3,b);
   state.playerHealth+=3;addLog('Aurelia, the Law Above: five or more declared attackers — 3 damage to every opponent; gain 3 life.');done();
  });
 }
}
function declareAttackers103(attackers,b,done){
 const declared=[...attackers];lawAbove103(declared,b);
 for(const u of declared){
  if(u.card.name==='Aurelia, the Warleader'&&u.warleaderTurn103!==b.turn){
   u.warleaderTurn103=b.turn;queueJester65(b,next=>{untapTeam103(b);b.extraCombats103=(b.extraCombats103||0)+1;addLog('Aurelia: first attack this turn — untap your creatures; an additional combat follows.');next();});
  }
  if(u.card.name==='Roxanne, Starfall Savant')queueJester65(b,next=>{createMeteorite103(b);next();});
 }
 if(declared.length)for(const source of sources103('Adeline, Resplendent Cathar',b))queueJester65(b,next=>{
  let count=0;
  for(const e of b.enemyCreatures){
   if(b.creatures.length>=CREATURE_LIMIT)break;
   const u={id:`human-${state.nextPermanentId++}`,owner:'player',card:TOKENS103.human,power:1,toughness:1,isToken:true,summonedTurn:b.turn,summoningSick:true,tapped:true,attackedThisTurn:true,willAttack:false,attackTargetId:e.id};
   b.creatures.push(u);onCreatureEntered(u);tokenCreated103(u,b);attackers.push(u);count++;
  }
  addLog(`Adeline: ${count} tapped and attacking Human token${count===1?'':'s'} (one per monster, limited to six creature slots). Tokens are not declared attackers.`);next();
 });
 afterJesters65(b,done);
}
function enemyAttackers103(attackers,b,done){lawAbove103(attackers,b);afterJesters65(b,done);}
function offerExtraCombat103(b){
 if(!(b.extraCombats103>0)){b.combatOnly103=false;return false;}
 b.extraCombats103--;b.combatOnly103=true;b.phase='main';b.priorityCallback=null;b.phaseTicket=(b.phaseTicket||0)+1;
 for(const u of b.creatures){u.attackedThisTurn=false;u.willAttack=false;}
 addLog('Additional combat: choose attackers. No main phase, draw, land play, land untap or mana refill.');renderBattle();return true;
}
const baseWin103=winBattle;
winBattle=function(){
 const b=state.battle;
 if(b&&!b.enemyCreatures.length&&!b.resolutionTask&&!b.choice&&!b.scry&&!b.libraryOrder&&!b.interruption&&!b.enemyCounterWindow&&!(typeof pendingEnemySpells38==='function'&&pendingEnemySpells38(b).length)){
  // Reinforcements belong to a new wave. Old token/attack triggers must not
  // hit the new opponents or leave an obsolete attack continuation running.
  b.jesterQueue65=[];b.jesterContinuations65=[];b.attackResolution55=false;b.extraCombats103=0;b.combatOnly103=false;
 }
 return baseWin103();
};
const baseCast103=canCastNow,baseEquip103=equipCost,baseExpire103=expireTurnEffects;
canCastNow=function(card,b=state.battle){return(!b?.combatOnly103||isInstant(card)||hasFlash(card))&&baseCast103(card,b);};
// Equipment is sorcery-speed even though the declaration UI reuses main's controls.
equipCost=function(card){return state.battle?.combatOnly103?null:baseEquip103(card);};
expireTurnEffects=function(b){b.extraCombats103=0;b.combatOnly103=false;for(const u of b.creatures)delete u.mustBlock103;return baseExpire103(b);};

function upkeep103(b,draw){
 for(const u of sources103('Primordial Ooze',b))queueJester65(b,done=>{
  if(!b.creatures.includes(u))return done();
  resolveReviewedEffect({kind:'counter',amount:1},{side:'player',id:u.id},{card:u.card});
  const x=Math.max(0,u.counterPower||0)+Math.max(0,runCount66(u.card)-(u.cancelledRunCounters66||0));
  openJesterChoice65({battle:b,title:`Primordial Ooze · upkeep (${x} mana)`,instruction:`A +1/+1 counter was added. Pay ${x} generic mana, or tap this Ooze and it deals ${x} damage to you. Your normal draw follows this choice.`,options:[{label:`Pay ${x} mana`,pay:true,note:`${b.mana} available · lands are tapped by the payment`},{label:`Decline · take ${x} damage`,pay:false}],validate:chosen=>!chosen[0].pay||b.mana>=x,accept:chosen=>{
   if(chosen[0].pay){if(!payMana(x,b))return;addLog(`Primordial Ooze: paid ${x} mana.`);}else{if(b.creatures.includes(u))u.tapped=true;dealAbility66(snapshotSource66(u),{side:'life'},x,b);addLog(`Primordial Ooze: declined upkeep; tap it and deal ${x} damage to you.`);}
   if(state.playerHealth<=0)endRun(false);done();
  }});
 });
 afterJesters65(b,draw);
}

// Tap the creature to open its unpaid ability window, like mana creatures.
function activated103(u){return ['Anzrag, the Quake-Mole','Zopandrel, Hunger Dominus'].includes(u?.card?.name);}
const baseAction103=hasCreatureAction73,baseAbilityReady103=creatureAbilityReady66,baseAbilityRender103=renderCreatureAbility66,baseAbilityConfirm103=confirmCreatureAbility66,baseKeyword103=hasCreatureKeyword;
hasCreatureAction73=function(u){return activated103(u)||baseAction103(u);};
hasCreatureKeyword=function(u,key){return key==='indestructible'&&u?.indestructibleCounters103>0||baseKeyword103(u,key);};
function paymentOptions103(b){return[{label:'Pay 2 mana',mana:2,life:0},{label:'Pay 1 mana + 2 life',mana:1,life:2},{label:'Pay 4 life',mana:0,life:4}].filter(o=>b.mana>=o.mana&&state.playerHealth>=o.life);}
creatureAbilityReady66=function(u,b=state.battle,ownChoice=false){
 if(!activated103(u))return baseAbilityReady103(u,b,ownChoice);
 if(!b||b!==state.battle||!b.creatures.includes(u)||!creatureAlive(u)||b.phase==='complete'||!ownChoice&&(permanentActionBusy60(b)||jesterPending65(b)||b.librarySearch))return false;
 return u.card.name==='Anzrag, the Quake-Mole'?b.mana>=7:b.creatures.filter(c=>c!==u&&creatureAlive(c)).length>=2&&paymentOptions103(b).length>0;
};
renderCreatureAbility66=function(){
 baseAbilityRender103();const b=state.battle,u=b?.creatures.find(c=>c.id===state.creatureAbility66?.id);if(!activated103(u))return;
 const anzrag=u.card.name==='Anzrag, the Quake-Mole',ready=creatureAbilityReady66(u,b);
 $('#creature-ability-cost').textContent=anzrag?'7 generic mana · no tap cost':'2 Phyrexian mana: 2 mana / 1 mana + 2 life / 4 life · sacrifice two OTHER creatures · no tap cost';
 $('#creature-ability-confirm').textContent=anzrag?'Pay 7 → Require a block':'Choose payment & two sacrifices →';$('#creature-ability-confirm').disabled=!ready;
 $('#creature-ability-status').textContent=ready?anzrag?'Able monsters must block Anzrag this turn. Monsters already retaliate whenever legally able; Flying, protection and other restrictions still apply.':'Nothing is paid until both other creatures are chosen and confirmed. Sacrifice ignores Indestructible. The counter stays on this battlefield Zopandrel.':anzrag?'Needs 7 available mana.':'Needs two other creatures and an affordable mana/life payment. Finish pending choices first.';
};
confirmCreatureAbility66=function(){
 const b=state.battle,u=b?.creatures.find(c=>c.id===state.creatureAbility66?.id);if(!activated103(u))return baseAbilityConfirm103();if(!creatureAbilityReady66(u,b))return false;closeCreatureAbility66();
 if(u.card.name==='Anzrag, the Quake-Mole'){if(!payMana(7,b))return false;u.mustBlock103=b.turn;b.mulliganAvailable=false;addLog('Anzrag must be blocked this turn if able. Monsters already retaliate when a block is legal.');renderBattle();return true;}
 return openJesterChoice65({battle:b,title:'Zopandrel · Phyrexian payment',instruction:'Choose a payment. Next choose two OTHER creatures to sacrifice. Nothing is paid yet; cancel is free.',options:paymentOptions103(b),cancel:()=>renderBattle(),accept:chosen=>{
  const cost=chosen[0];openJesterChoice65({battle:b,title:'Zopandrel · sacrifice two other creatures',instruction:`${cost.label}; sacrifice exactly two OTHER creatures. Confirm pays all costs and puts an Indestructible counter on Zopandrel.`,options:b.creatures.filter(c=>c!==u).map(c=>({card:c.card,unit:c,note:c.isToken?'Creature token · sacrifice':'Creature · goes to your graveyard'})),min:2,max:2,cancel:()=>renderBattle(),validate:picks=>creatureAbilityReady66(u,b,true)&&b.mana>=cost.mana&&state.playerHealth>=cost.life&&picks.length===2&&new Set(picks.map(p=>p.unit)).size===2&&picks.every(p=>p.unit!==u&&b.creatures.includes(p.unit)),accept:picks=>{
   if(!payMana(cost.mana,b))return;state.playerHealth-=cost.life;
   const previous=sacrificeSources103;sacrificeSources103=sources103('Mirkwood Bats',b).map(snapshotSource66);
   try{for(const p of picks)sacrificeRuleCreature(p.unit);}finally{sacrificeSources103=previous;}
   u.indestructibleCounters103=(u.indestructibleCounters103||0)+1;b.mulliganAvailable=false;addLog('Zopandrel: costs paid; gain an Indestructible counter.');settleReviewed66(b);if(state.playerHealth<=0)endRun(false);if(b.phase!=='complete'){renderBattle();pumpJesters65(b);}
  }});
 }});
};
const baseResponse103=hasInstantResponse;
hasInstantResponse=function(b){return baseResponse103(b)||b.creatures.some(u=>activated103(u)&&creatureAbilityReady66(u,b));};
const baseCreatureBonuses103=creatureBonuses,baseFacts103=cardFactsMarkup;
creatureBonuses=function(u,...args){const result=baseCreatureBonuses103(u,...args);if(u.card.name==='Adeline, Resplendent Cathar')result.permanent.power-=u.adelinePower103||0;return result;};
cardFactsMarkup=function(card){const html=baseFacts103(card);const stats=parseStats(card);return card.name==='Adeline, Resplendent Cathar'?html.replace(combatStats(stats.power,stats.toughness),combatStats('*',stats.toughness)):html;};
const baseBonus103=bonusMarkup,basePhase103=phaseInfo,baseBattleRender103=renderBattle;
bonusMarkup=function(u){return baseBonus103(u)+(u.indestructibleCounters103?`<span class="stat-permanent indestructible-counter103" title="Indestructible counter · stays on this battlefield creature">◆ Indestructible${u.indestructibleCounters103>1?' ×'+u.indestructibleCounters103:''}</span>`:'');};
phaseInfo=function(id){return id==='main'&&state.battle?.combatOnly103?{id:'main',label:'Extra combat · declare attackers',description:'Choose attackers for the extra combat. Instants and Flash are allowed. No new main phase, draw, land play or mana refill.'}:basePhase103(id);};
renderBattle=function(){const result=baseBattleRender103();if(state.battle?.combatOnly103&&state.battle.phase==='main'){$('#end-turn-button').innerHTML='START EXTRA COMBAT <span>→</span>';$('#combat-action-hint').textContent=phaseInfo('main').description;const step=$('#phase-strip').querySelector('[data-phase="main"]');if(step)step.innerHTML='<span>+</span>Extra combat · declare attackers';}return result;};

const RULES103={
 'Primordial Ooze':['1/1 · must attack each combat if able.','At your upkeep, before the normal draw: put a +1/+1 counter on it, then choose to pay generic mana equal to ALL its +1/+1 counters, including run counters.','Declining taps the Ooze and it deals that much damage to you. This is damage: prevention, Gisela and Lifelink apply. Tapping still happens if damage is prevented.'],
 'Aurelia, the Warleader':['3/4 · Flying, Vigilance, Haste.','The FIRST time this Aurelia attacks each turn, untap all your creatures and add a combat after this one. All attackers tap before this trigger resolves.','Choose attackers again in the extra-combat screen. No new main phase, card draw, land play, land untap or mana refill. A second attack by the same Aurelia does not trigger again.'],
 'Aurelia, the Law Above':['4/4 · Flying, Vigilance, Haste.','Whenever either side declares at least three attackers, draw a card. Five or more also deals 3 damage to EACH monster and gains you 3 life.','Counts declared attackers, not Humans entering already attacking. These triggers remain even if an attacker dies. Each monster is one opposing player in this roguelike.'],
 'Gisela, Blade of Goldnight':['5/5 · Flying, First strike.','Damage to monsters is doubled. Prevent half of damage to you and your creatures, rounded UP: 3 becomes 1; 1 becomes 0.','Applies to combat, spells and abilities from any source. Trample is assigned before doubling. Lifelink uses the damage actually dealt. Life loss and life payments are not damage.'],
 'Adeline, Resplendent Cathar':['*/4 · Vigilance. Base power equals the number of creatures you control, including herself. Counters and other bonuses apply on top.','Whenever you declare an attack, even without Adeline attacking, create one tapped 1/1 white Human attacking each monster, while your six creature slots have room.','This is the multiplayer trigger adapted to monster opponents and the six-slot battlefield. Tokens are already attacking; they do not count for “three/five attackers” or trigger attack abilities. The game’s Flying/Reach duel restrictions still apply to Humans.'],
 'Anzrag, the Quake-Mole':['8/4. When it becomes blocked, untap all your creatures and add a combat after this one. It can trigger again in each additional combat.','Click its battlefield card: pay 7 generic mana to require a legal block each combat this turn. No tap cost.','Monsters already retaliate whenever legally able. This requirement never overrides Flying, protection, Menace or other blocking restrictions. An unblocked duel does not grant a combat.'],
 'Zopandrel, Hunger Dominus':['4/6 · Reach. At the start of BOTH your combat and enemy combat, double the current power and toughness of your creatures until end of turn. Additional combats double them again.','Each doubling is a separate temporary bonus that stays even if Zopandrel leaves. It wears off at cleanup. Creatures entering later miss earlier doublings.','Click its battlefield card: choose 2 mana, 1 mana + 2 life, or 4 life; then sacrifice exactly two OTHER creatures to put an Indestructible counter on Zopandrel. No tapping; summoning sickness does not stop this.','Canceling spends nothing. Exile, sacrifice and toughness 0 still remove Indestructible creatures. This counter stays on the battlefield object, not the run-deck card.'],
 'Roxanne, Starfall Savant':['4/3. Whenever she enters or attacks, create a tapped, colorless Meteorite artifact token.','Each Meteorite entry has a separate trigger: choose any legal target for 2 damage. Ward and protection apply. The token stays even if the trigger is countered by Ward.','Click an UNTAPPED Meteorite to add 1 floating generic mana. It stays in play. It untaps next turn.','Whenever you tap an artifact TOKEN for mana, Roxanne adds 1 extra generic mana. Works with Treasure and Meteorite; ordinary Sol Ring, Mox and Black Lotus cards are not tokens.'],
 'Mirkwood Bats':['2/3 · Flying. Whenever you CREATE or SACRIFICE a token, each monster loses 1 life. Each actual token triggers each Bats separately.','Works with creature tokens, Treasure, Food, Clues and Meteorites. Creating three tokens causes three life-loss triggers per Bats.','This is life loss: Gisela, protection and damage prevention do not change it. A token being destroyed, dying, exiled or carried into a persistent battle is not a sacrifice or new creation.']
};
const basePrinted103=printedKeywords;
printedKeywords=function(card){return CARDS103.has(card.name)?basePrinted103(card).filter(k=>k!=='double'):basePrinted103(card);};
const baseDescription103=effectDescriptions,baseSummary103=draftAbilitySummary;
effectDescriptions=function(card){return card.meteorite103?['Colorless artifact token. Enters tapped; its separate entry trigger deals 2 damage to a chosen legal target.','Tap: add 1 floating generic mana. Roxanne adds 1 extra if she is in play. This does not sacrifice the token.']:RULES103[card.name]||baseDescription103(card);};
draftAbilitySummary=function(card){return RULES103[card.name]?RULES103[card.name].slice(0,2).join(' '):baseSummary103(card);};
for(const key of ['pool','catalogPool'])if(state[key]?.length)state[key]=[...new Map([...state[key],...BUNDLED_CARDS.filter(c=>CARDS103.has(c.name))].map(c=>[c.name,c])).values()].filter(c=>key==='catalogPool'||rulesAudit(c).playable&&c.name!=='Booster Tutor');
