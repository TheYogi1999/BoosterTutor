/* v0.106 — synchronous dry run of the real combat rules, on isolated data.
 * Never advances the run, pays costs, reveals draw order or executes choices.
 */
function cloneForecastData106(value,seen=new WeakMap()){
 if(value===null||typeof value!=='object')return value;
 if(typeof Node!=='undefined'&&value instanceof Node)return null;
 if(seen.has(value))return seen.get(value);
 if(value instanceof Map){const copy=new Map();seen.set(value,copy);for(const [k,v] of value)copy.set(cloneForecastData106(k,seen),cloneForecastData106(v,seen));return copy;}
 if(value instanceof Set){const copy=new Set();seen.set(value,copy);for(const v of value)copy.add(cloneForecastData106(v,seen));return copy;}
 const copy=Array.isArray(value)?[]:{};seen.set(value,copy);
 for(const key of Object.keys(value))copy[key]=cloneForecastData106(value[key],seen);
 return copy;
}
let forecasting106=false;
function forecastCombat106({mode=null,unitId=null,targetId=null}={}){
 const original=state.battle;
 if(forecasting106||!original||original.phase==='complete')return{available:false,reason:'No active combat.'};
 if(original.resolutionTask||original.choice||original.scry||original.libraryOrder||original.interruption||original.diceRoll||original.enemyCounterWindow||original.enemyCastCheck||original.wardTask||jesterPending65(original))return{available:false,reason:'Finish the pending spell, roll or choice first.'};
 if(original.phase==='enemy')return{available:false,reason:'Enemy actions are resolving. Preview your blocks after the response window.'};
 mode||=['blocks','damage'].includes(original.phase)?'blocks':'queued';
 const saved={...state},bindings=new Map(),random=Math.random,notes=[],events=[],jobs=[];
 let playerGain=0,enemyGain=0,draws=0,result,abilityTarget=null;const triggers=[];
 const shadow=cloneForecastData106(state),b=shadow.battle;
 const before=[...b.creatures,...b.enemyCreatures].map(u=>({id:u.id,name:u.card.name,owner:u.owner,health:u.health,damage:u.damage||0,poison:u.poison60||0,card:u.originalCard||u.card}));
 const life=state.playerHealth,extra=b.extraCombats103||0;
 const replace=(name,fn)=>{if(typeof globalThis[name]==='function'){bindings.set(name,globalThis[name]);globalThis[name]=fn;}};
 const note=text=>{if(!notes.includes(text))notes.push(text);};
 const settle=()=>{settleReviewed66(b);if(!b.enemyCreatures.length){b.phase='complete';jobs.length=0;}};
 const flush=()=>{let count=0;while(jobs.length&&b.phase!=='complete'){if(++count>120)throw Error('Too many simultaneous triggers to preview.');jobs.shift()(()=>settle());}};
 forecasting106=true;
 try{
  for(const key of Object.keys(state))delete state[key];Object.assign(state,shadow);
  for(const name of ['playSfx','showEnemyHit','animatePlayerDamage','screenImpact104','showToast','renderBattle','renderHand','syncCoins','addLog','recordSeenCards','updateDiscoveryProgress','scheduleJesters65','pumpJesters65','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame'])replace(name,()=>0);
  replace('enemyHitBox',()=>null);replace('awardBounty',()=>0);
  replace('addLog',message=>{if(!/^First strike damage/.test(message)&&!triggers.includes(message))triggers.push(message);});
  replace('queueJester65',(_battle,job)=>jobs.push(job));
  const entry=onCreatureEntered;
  replace('onCreatureEntered',u=>{if(!before.some(v=>v.id===u.id))before.push({id:u.id,name:u.card.name,owner:u.owner,health:u.health,damage:u.damage||0,poison:u.poison60||0,card:u.originalCard||u.card,created:true});return entry(u);});
  replace('openJesterChoice65',q=>{note(`${q.title}: a target or optional choice can change this result.`);return false;});
  replace('drawOneCard',()=>{draws++;if(!b.deck.length){note('The attack would draw from an empty Library and lose the run.');b.phase='complete';return;}b.deck.pop();b.hand.push({name:'Unrevealed draw',type_line:'Unknown',cmc:0});});
  replace('endRun',()=>{b.phase='complete';});replace('winBattle',()=>{b.phase='complete';jobs.length=0;});
  const deal=dealCreatureDamage,link=gainLifelinkLife,direct=damageFirstEnemy,ability=dealAbility66;
  replace('dealAbility66',(source,target,amount,battle)=>{const previous=abilityTarget;abilityTarget=target?.side==='life'?'life':target?.id;try{return ability(source,target,amount,battle);}finally{abilityTarget=previous;}});
  replace('dealCreatureDamage',(source,target,side,battle,amount,links=null)=>{
   const collector=links||[],start=collector.length;deal(source,target,side,battle,amount,collector);
   for(const event of collector.slice(start)){events.push({source:source.id,target:target.id,damage:event.damage,infect:Boolean(source.infect)});if(!links)gainLifelinkLife(source,side,event.damage,battle);}
  });
  replace('gainLifelinkLife',(source,side,amount,battle)=>{if(abilityTarget&&amount>0)events.push({source:source.id,target:abilityTarget,damage:amount});const before=side==='player'?state.playerHealth:source.health;const value=link(source,side,amount,battle),gain=Math.max(0,(side==='player'?state.playerHealth:source.health)-before);if(side==='player')playerGain+=gain;else enemyGain+=gain;return value;});
  replace('damageFirstEnemy',(amount,explicit=null,source=null)=>{const target=explicit||attackTarget(b,source||{}),value=direct(amount,explicit,source);if(value&&target)events.push({source:source?.id,target:target.id,damage:value,infect:false});return value;});
  Math.random=()=>{throw Error('A random attack outcome must be resolved first.');};
  if(mode==='blocks'){
   if(hasInvalidMenaceBlock(b))return{available:false,reason:'Menace needs two blockers. Add another blocker or remove the invalid assignment.'};
   const attackers=b.enemyCreatures.filter(u=>creatureCanAttack(u,b.turn)),assignments=new Map();
   for(const enemy of attackers){const blockers=enemyDefenders70(b,enemy);if(blockers.length)assignments.set(enemy.id,blockers);}
   resolveCombatDamage(attackers,assignments,'enemy',step=>{state.playerHealth-=step.damageToPlayer;for(const event of step.enemyLifelinkEvents)gainLifelinkLife(event.creature,'enemy',event.damage,b);if(step.damageToPlayer)events.push({target:'life',damage:step.damageToPlayer});if(state.playerHealth<=0)b.phase='complete';});flush();
  }else{
   if(b.phase==='main')beginCombat103(b,'player');
   const candidate=unitId?b.creatures.find(u=>u.id===unitId):null;
   if(unitId&&(!candidate||!eligibleAttacker(candidate,b)))return{available:false,reason:candidate?.tapped?'This creature is tapped.':'This creature cannot attack now.'};
   if(candidate&&targetId)candidate.attackTargetId=targetId;
   if(candidate&&targetId&&b.enemyCreatures.some(e=>e.id===targetId&&!canAttackEnemy(candidate,e)))return{available:false,reason:'Flying monsters require an attacker with Flying or Reach.'};
   const attackers=b.creatures.filter(u=>(unitId?u===candidate:u.willAttack||/attacks each combat if able/i.test(u.card.oracle_text||''))&&eligibleAttacker(u,b)&&attackTarget(b,u));
   if(!attackers.length)return{available:false,reason:'Queue an attacker and choose a legal enemy, or assign blockers.'};
   for(const u of attackers){u.attackedThisTurn=true;u.willAttack=false;u.tapped=!hasCreatureKeyword(u,'vigilance');}
   declareAttackers103(attackers,b,()=>{});flush();
   for(const u of attackers){
    if(b.phase==='complete')break;if(!b.creatures.includes(u)||!creatureAlive(u))continue;
    const enemy=attackTarget(b,u);if(!enemy)continue;
    if(u.card.name==="Syr Alin, the Lion's Claw")resolveAttackTrigger55(u,b,()=>{});
    if(['Hoarding Ogre','The Madcap Jester'].includes(u.card.name))note(`${u.card.name}: its random attack trigger is not assumed.`);
    resolveCombatDamage([u],new Map([[u.id,playerDefenders66(u,enemy,b)]]),'player');flush();
   }
  }
  const all=[...b.creatures,...b.enemyCreatures];
  const rows=before.map(u=>{const after=all.find(v=>v.id===u.id),returned=!after&&all.some(v=>(v.originalCard||v.card)===u.card);return{id:u.id,name:u.name,owner:u.owner,created:Boolean(u.created),dead:!after,returned,damage:events.filter(e=>e.target===u.id).reduce((n,e)=>n+e.damage,0),poison:Math.max(0,(after?.poison60||0)-u.poison),remaining:after?u.owner==='enemy'?after.health:Math.max(0,after.toughness-(after.damage||0)):0};});
  const requested=original.creatures.find(u=>unitId?u.id===unitId:u.willAttack);
  const wardTarget=original.enemyCreatures.find(e=>e.id===(targetId||requested?.attackTargetId||original.selectedEnemyTargetId));
  result={available:true,mode,rows,events,triggers,playerBefore:life,playerAfter:state.playerHealth,playerGain,enemyGain,draws,extraCombats:Math.max(0,(b.extraCombats103||0)-extra),notes,uncertain:notes.length>0,ward:wardTarget?wardCostText(wardTarget):'',wardAffordable:wardTarget?original.mana>=wardCost(wardTarget):true};
 }catch(error){result={available:false,reason:error.message||'This combat contains an unresolved choice.'};}
 finally{
  Math.random=random;for(const [name,fn] of bindings)globalThis[name]=fn;
  for(const key of Object.keys(state))delete state[key];Object.assign(state,saved);forecasting106=false;
 }
 return result;
}
function deckProfile106(cards){
 const result={total:cards.length,mana:0,creatures:0,spells:0,permanents:0,curve:Array(8).fill(0),average:0};let cost=0;
 for(const card of cards){if(isLand(card)){result.mana++;continue;}const mv=Math.max(0,Math.ceil(card.xBaseCmc66??card.cmc??0));cost+=mv;result.curve[Math.min(7,mv)]++;if(isCreature(card))result.creatures++;else if(/\b(?:Instant|Sorcery)\b/i.test(card.type_line||''))result.spells++;else result.permanents++;}
 result.average=result.total>result.mana?cost/(result.total-result.mana):0;return result;
}
