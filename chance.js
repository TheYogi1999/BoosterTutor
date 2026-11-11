/* Reviewed chance cards. Random results are generated once, before presentation. */
SPELL_RULES['Contact Other Plane']={effects:[{kind:'d20-draw'}]};
SPELL_RULES['Fiery Gambit']={target:'creature',effects:[{kind:'fiery-gambit'}]};
for(const name of ['Hoarding Ogre','Tavern Swindler','Tavern Scoundrel'])SPECIAL_CREATURES.add(name);
for(const name of ['Squirrel-Powered Scheme',"Krark's Thumb"])REVIEWED_PERMANENTS.add(name);
const baseChanceEffects55=cardEffects;
cardEffects=function(card,creature=isCreature(card)){return ['Hoarding Ogre','Tavern Swindler','Tavern Scoundrel'].includes(card.name)?[]:baseChanceEffects55(card,creature);};
function rollD20Value55(){return Math.floor(Math.random()*20)+1;}
function rollCoinValue55(){return Math.random()<.5?0:1;}
function diceModifier55(battle=state.battle){return 2*battle.permanents.filter(p=>p.card.name==='Squirrel-Powered Scheme').length;}

// Twenty actual triangular planes, with the rolled face turned toward the viewer.
const D20_GEOMETRY55=(()=>{
 const phi=(1+Math.sqrt(5))/2,vertices=[];
 for(const a of [-1,1])for(const b of [-phi,phi])vertices.push([a,b,0],[0,a,b],[b,0,a]);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
 const faces=[];
 for(let i=0;i<12;i++)for(let j=i+1;j<12;j++)for(let k=j+1;k<12;k++){
  let a=vertices[i],b=vertices[j],c=vertices[k];
  if([sub(a,b),sub(b,c),sub(c,a)].some(edge=>Math.abs(Math.hypot(...edge)-2)>.001))continue;
  const center=a.map((v,n)=>(v+b[n]+c[n])/3);let normal=norm(cross(sub(b,a),sub(c,a)));
  if(dot(center,normal)<0){[b,c]=[c,b];normal=normal.map(v=>-v);}
  const u=norm(sub(b,a)),v=cross(normal,u),scale=30;
  const points=[a,b,c].map(p=>`${43+dot(sub(p,center),u)*scale},${43+dot(sub(p,center),v)*scale}`).join(' ');
  const matrix=[...u,0,...v,0,...normal,0,...center.map(n=>n*scale),1].map(n=>Number(n.toFixed(6))).join(',');
  faces.push({points,matrix,x:Math.atan2(normal[1],Math.hypot(normal[0],normal[2]))*180/Math.PI,y:-Math.atan2(normal[0],normal[2])*180/Math.PI});
 }
 return faces;
})();
function d20Markup55(result,label,index){
 const face=D20_GEOMETRY55[result-1];
 return `<div class="rolled-die" style="--die-x:${face.x}deg;--die-y:${face.y}deg;--die-delay:${index*140}ms"><span class="die-roll-label">${escapeHtml(label)}</span><div class="die-stage" aria-hidden="true"><div class="die-shadow"></div><div class="die-flight"><div class="die-hop"><div class="die-cube die-d20">${D20_GEOMETRY55.map((f,i)=>`<div class="d20-face" style="transform:matrix3d(${f.matrix})"><svg viewBox="0 0 86 86"><polygon points="${f.points}" fill="${i%2?'#244d69':'#356b84'}"/><text x="43" y="43">${i+1}</text></svg></div>`).join('')}</div></div></div></div><b class="die-result-value" data-die-result="${result}">?</b></div>`;
}
function coinFaceMarkup57(side) {
 const heads=side==='heads';
 const beads=Array.from({length:32},(_,i)=>{const angle=i*Math.PI/16;return `<circle cx="${(48+37*Math.cos(angle)).toFixed(2)}" cy="${(48+37*Math.sin(angle)).toFixed(2)}" r=".7"/>`;}).join('');
 const sun=`<circle cx="48" cy="43" r="12"/>${Array.from({length:12},(_,i)=>`<path d="M46 25 48 17 50 25Z" transform="rotate(${i*30} 48 43)"/>`).join('')}<circle class="coin-relief-line" cx="48" cy="43" r="8"/>`;
 const moon='<path d="M56 19a24 24 0 1 0 13 41 26 26 0 0 1-13-41Z"/><path d="m68 26 2 5 5 2-5 2-2 5-2-5-5-2 5-2zM33 20l1.3 3.7L38 25l-3.7 1.3L33 30l-1.3-3.7L28 25l3.7-1.3Z"/>';
 return `<span class="coin-face coin-${side}" aria-hidden="true"><svg class="coin-engraving" viewBox="0 0 96 96"><g class="coin-beading">${beads}</g><circle class="coin-relief-line" cx="48" cy="48" r="33.5"/><g class="coin-emblem">${heads?sun:moon}</g><text x="48" y="78">${heads?'HEADS':'TAILS'}</text></svg></span>`;
}
function coinMarkup55(result,label,index){
 const edge=Array.from({length:64},(_,i)=>{const angle=i*360/64,light=32+12*Math.cos((angle+35)*Math.PI/180);return `<span class="coin-edge" style="transform:rotateZ(${angle}deg) translateY(-47px) rotateX(90deg);--edge-metal:hsl(20 51% ${light.toFixed(1)}%)"></span>`;}).join('');
 return `<div class="rolled-die" style="--coin-y:${result?0:180}deg;--die-delay:${index*140}ms"><span class="die-roll-label">${escapeHtml(label)}</span><button type="button" class="die-stage coin-pick" data-coin-choice="${index}" aria-label="Keep coin ${index+1}" aria-pressed="false" disabled><span class="die-shadow coin-shadow"><span class="coin-shadow-ink"></span></span><span class="die-flight"><span class="die-hop"><span class="coin-body" aria-hidden="true">${edge}${coinFaceMarkup57('heads')}${coinFaceMarkup57('tails')}</span></span></span></button><b class="die-result-value" data-die-result="${result}">?</b></div>`;
}

function chooseCoin55(index){
 const job=visibleDiceRoll50;
 if(!job||job.kind!=='coin'||!job.ready||job.closed||state.battle!==job.battle||!Number.isInteger(index)||index<0||index>=job.rawResults.length)return false;
 job.selected=index;job.summary=job.summarize([job.rawResults[index]]);
 $('#dice-tray').querySelectorAll('[data-coin-choice]').forEach(el=>{const chosen=Number(el.dataset.coinChoice)===index;el.setAttribute('aria-pressed',String(chosen));el.closest('.rolled-die').classList.toggle('coin-ignored',!chosen);});
 $('#dice-status').textContent=`${job.rawResults[index]?'HEADS · WIN':'TAILS · LOSE'}${job.rawResults.length>1?` · coin ${index+1} kept`:''}`;
 $('#dice-outcome').textContent=job.summary;$('#dice-continue').disabled=false;return true;
}
function beginCoinFlip55(source,summary,onResult,battle=state.battle){
 const thumbs=battle.permanents.filter(p=>p.card.name==="Krark's Thumb").length;
 // Legendary rule permits one Thumb, so one flip is replaced by exactly two.
 return beginDiceRoll50(source,thumbs?['Coin 1','Coin 2']:['Coin'],summary,values=>{
  const win=Boolean(values[0]);
  if(win){const count=battle.creatures.filter(c=>c.card.name==='Tavern Scoundrel'&&creatureAlive(c)).length;createTreasure55(count*2,battle);if(count)addLog(`Tavern Scoundrel: ${count*2} Treasure created for winning a coin flip.`);}
  onResult(win);
 },null,battle,{kind:'coin',instruction:thumbs?'Krark’s Thumb: choose one of the two results. Heads wins.':'Heads wins. Tails loses.'});
}
function createTreasure55(count,battle=state.battle){
 for(let n=0;n<count;n++)battle.permanents.push({id:`treasure-${state.nextPermanentId++}`,card:{...CAMP_TOKEN_CARDS.treasure,campToken:true,battleToken:true,tokenKind:'treasure'},isToken:true,attachedTo:null});
}

let visibleChanceChoice55=null;
function closeChanceChoice55(){
 const choice=visibleChanceChoice55;visibleChanceChoice55=null;
 if(choice){choice.closed=true;if(choice.battle.chanceChoice===choice)choice.battle.chanceChoice=null;if(choice.battle.resolutionTask===choice.marker)choice.battle.resolutionTask=choice.savedTask||null;}
 if($('#chance-choice-dialog')?.open)$('#chance-choice-dialog').close();return choice;
}
function openChanceChoice55(title,text,options,accept,cancel,battle=state.battle){
 if(state.battle!==battle||battle.phase==='complete'||visibleChanceChoice55)return false;
 const marker={chanceChoice:true};const choice={id:`choice-${state.nextPermanentId++}`,battle,phase:battle.phase,options,accept,cancel,marker,savedTask:battle.resolutionTask,selected:null,closed:false};
 visibleChanceChoice55=choice;battle.chanceChoice=choice;battle.resolutionTask=marker;
 $('#chance-choice-title').textContent=title;$('#chance-choice-text').textContent=text;
 $('#chance-choice-options').innerHTML=options.map((option,i)=>`<button type="button" data-chance-choice="${i}" aria-pressed="false">${option.card?`<span class="chance-card">${cardFace(option.card)}</span>`:''}<b>${escapeHtml(option.label||option.card.name)}</b>${option.detail?`<small>${escapeHtml(option.detail)}</small>`:''}</button>`).join('');
 $('#chance-choice-dialog').dataset.cards=String(options.some(o=>o.card));$('#chance-choice-confirm').hidden=!options.some(o=>o.card);$('#chance-choice-confirm').disabled=true;
 $('#chance-choice-cancel').textContent=cancel?'Cancel':'Stop & collect';hideCardPreview();renderBattle();$('#chance-choice-dialog').showModal();return true;
}
function acceptChanceChoice55(index){
 const choice=visibleChanceChoice55;
 if(!choice||choice.closed||state.battle!==choice.battle||choice.battle.phase!==choice.phase||!choice.options[index])return false;
 const option=choice.options[index];closeChanceChoice55();choice.accept(option);return true;
}
$('#chance-choice-options').addEventListener('click',event=>{
 const button=event.target.closest('[data-chance-choice]'),choice=visibleChanceChoice55;if(!button||!choice)return;
 const index=Number(button.dataset.chanceChoice);if(!choice.options[index])return;
 if(!choice.options[index].card)return acceptChanceChoice55(index);
 choice.selected=index;$('#chance-choice-options').querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));$('#chance-choice-confirm').disabled=false;
});
$('#chance-choice-confirm').addEventListener('click',()=>{if(visibleChanceChoice55?.selected!==null)acceptChanceChoice55(visibleChanceChoice55?.selected);});
function cancelChanceChoice55(){const choice=closeChanceChoice55();if(!choice||state.battle!==choice.battle||choice.battle.phase==='complete'||choice.battle.phase!==choice.phase)return;if(choice.cancel)choice.cancel();else choice.accept(choice.options[0]);}
$('#chance-choice-cancel').addEventListener('click',cancelChanceChoice55);
$('#chance-choice-dialog').addEventListener('cancel',event=>{event.preventDefault();cancelChanceChoice55();});
$('#chance-choice-dialog').addEventListener('close',()=>{if(!$('#chance-choice-dialog').open&&visibleChanceChoice55)cancelChanceChoice55();});
const baseChanceScene55=showScreen;
showScreen=function(id){if(id!=='combat-screen')closeChanceChoice55();return baseChanceScene55(id);};
const baseChanceSync55=syncDiceWindow50;
syncDiceWindow50=function(){baseChanceSync55();const choice=visibleChanceChoice55;if(choice&&(state.battle!==choice.battle||choice.battle.phase==='complete'))closeChanceChoice55();};

function canActivateCoin55(unit,battle=state.battle){
 if(!battle||!unit||!battle.creatures.includes(unit)||!['Tavern Swindler','Tavern Scoundrel'].includes(unit.card.name)||unit.tapped||isSummoningSick(unit,battle.turn)||!creatureAlive(unit)||battle.resolutionTask||battle.choice||battle.scry||battle.libraryOrder||battle.interruption||battle.diceRoll||battle.chanceChoice||!['main','attack','enemy','blocks','damage'].includes(battle.phase))return false;
 syncMana(battle);
 return unit.card.name==='Tavern Swindler'?state.playerHealth>=3:battle.mana>=1&&coinSacrificeOptions55(unit,battle).length>0;
}
function coinSacrificeOptions55(source,battle){
 return [...battle.creatures.filter(c=>c!==source).map(unit=>({key:`player:${unit.id}`,card:unit.card})),...battle.permanents.map(unit=>({key:`permanent:${unit.id}`,card:unit.card})),...battle.lands.map(unit=>({key:`land:${unit.id}`,card:unit.card}))];
}
function sacrificePermanent55(key,battle){
 const target=parseRuleTarget(key),unit=choiceTargetUnit(target,battle);if(!unit)return false;
 if(target.side==='player')return sacrificeRuleCreature(unit);
 const zone=target.side==='land'?battle.lands:battle.permanents;const index=zone.indexOf(unit);if(index<0)return false;zone.splice(index,1);
 if(!unit.isToken&&!unit.card.campToken)battle.graveyard.push(unit.originalCard||unit.card);
 syncCampTokens(battle);refreshPermanentEffects();syncMana(battle);addLog(`${unit.card.name} is sacrificed.`);return true;
}
function activateCoin55(id){
 const battle=state.battle,unit=battle?.creatures.find(c=>c.id===id);if(!canActivateCoin55(unit,battle))return false;
 const swindler=unit.card.name==='Tavern Swindler';
 const paid=key=>{
  if(state.battle!==battle||!canActivateCoin55(unit,battle))return false;
  if(!swindler&&(!coinSacrificeOptions55(unit,battle).some(o=>o.key===key)||!payMana(1,battle)))return false;
  unit.tapped=true;battle.mulliganAvailable=false;
  for(const [enemy] of battle.blockAssignments){const keep=blockerIds(battle,enemy).filter(item=>item!==unit.id);if(keep.length)battle.blockAssignments.set(enemy,keep);else battle.blockAssignments.delete(enemy);}
  if(swindler){state.playerHealth-=3;if(state.playerHealth<=0){endRun(false);return true;}}
  else sacrificePermanent55(key,battle);
  const task={battle,p:{card:unit.card},copies:1};battle.resolutionTask=task;
  beginCoinFlip55(unit.card.name,values=>values[0]?swindler?'Win: gain 6 life.':'Win: your Scoundrels create Treasure.':'Lose: no reward. Costs stay paid.',win=>{
   if(swindler&&win){state.playerHealth+=6;playSfx('heal');}finishResolution27(task);
  },battle);return true;
 };
 if(swindler)return paid();
 return openChanceChoice55(unit.card.name,'Choose another permanent to sacrifice. Confirming pays 1 mana, taps this creature and sacrifices the chosen card. Cancel pays nothing.',coinSacrificeOptions55(unit,battle),option=>{if(!paid(option.key)){showToast('The source or costs changed. Choose again.');renderBattle();}},()=>{renderBattle();releaseReactionBeat52(battle);},battle);
}
$('#creature-row').addEventListener('click',event=>{const button=event.target.closest('[data-activate-coin]');if(button)activateCoin55(button.dataset.activateCoin);});
$('#inspector-content').addEventListener('click',event=>{const button=event.target.closest('[data-activate-coin]');if(button)activateCoin55(button.dataset.activateCoin);});
function coinAbilityLabel55(unit){return unit.card.name==='Tavern Swindler'?'Tap · pay 3 life · flip':'Pay 1 · tap · sacrifice another permanent · flip';}
const baseChanceCreatures55=renderCreatures;
renderCreatures=function(){baseChanceCreatures55();const battle=state.battle;for(const unit of battle.creatures.filter(c=>['Tavern Swindler','Tavern Scoundrel'].includes(c.card.name))){const controls=document.querySelector(`[data-host-id="${unit.id}"] .unit-controls`);if(!controls)continue;controls.classList.add('has-coin-ability');const attack=controls.querySelector('[data-unit-attack]');if(attack)attack.textContent='Attack';controls.insertAdjacentHTML('beforeend',`<button type="button" data-activate-coin="${unit.id}" title="${coinAbilityLabel55(unit)}" aria-label="${unit.card.name}: ${coinAbilityLabel55(unit)}" ${canActivateCoin55(unit,battle)?'':'disabled'}>Flip</button>`);}};
const baseChanceInspect55=inspectBattlefieldCard;
inspectBattlefieldCard=function(card,element){baseChanceInspect55(card,element);const unit=state.battle?.creatures.find(c=>c.id===element?.dataset?.previewId);if(unit&&['Tavern Swindler','Tavern Scoundrel'].includes(unit.card.name))$('#inspector-content .inspector-rules').insertAdjacentHTML('beforeend',`<button class="quiet-button" data-activate-coin="${unit.id}" ${canActivateCoin55(unit)?'':'disabled'}>${coinAbilityLabel55(unit)}</button>`);};
const baseChanceResponses55=hasInstantResponse;
hasInstantResponse=function(battle){return baseChanceResponses55(battle)||battle.creatures.some(unit=>canActivateCoin55(unit,battle));};

function resolveAttackTrigger55(unit,battle,resume){
 if(unit.card.name!=='Hoarding Ogre')return false;
 const saved=battle.resolutionTask,marker={ogreAttack:true};battle.resolutionTask=marker;
 let result;return beginDiceRoll50('Hoarding Ogre · attack',['Treasure'],values=>`Create ${treasureResult55(values[0])} Treasure token${treasureResult55(values[0])===1?'':'s'}.`,values=>{result=values[0];},()=>{
  createTreasure55(treasureResult55(result),battle);if(battle.resolutionTask===marker)battle.resolutionTask=saved;resume();
 },battle,{sides:20});
}
function treasureResult55(result){return result>=1&&result<=9?1:result>=10&&result<=19?2:result===20?3:0;}
const baseChanceEffect55=resolveDiceEffect50;
resolveDiceEffect50=function(effect,target,context,resume){
 const battle=state.battle;
 if(effect.kind==='d20-draw'){
  let result;return beginDiceRoll50(`${context.card.name}${context.isCopy?' · copy':''}`,['Insight'],values=>values[0]>20?'No listed result: no effect.':values[0]===20?'Scry 3, then draw 3 cards.':values[0]>=10?'Scry 2, then draw 2 cards.':'Draw 2 cards.',values=>{result=values[0];},()=>{
   if(result>20)return resume();
   if(result<10){for(let n=0;n<2&&battle.phase!=='complete';n++)drawOneCard();if(battle.phase!=='complete')resume();return;}
   battle.scryContinuation=resume;beginScry(result===20?3:2,result===20?3:2);if(!battle.scry){battle.scryContinuation=null;if(battle.phase!=='complete')resume();}
  },battle,{sides:20});
 }
 if(effect.kind==='fiery-gambit'){
  let wins=0;const source=`Fiery Gambit${context.isCopy?' · copy':''}`;
  const collect=()=>{
   if(state.battle!==battle||battle.phase==='complete')return;
   if(wins>=1)resolveReviewedEffect({kind:'damage',amount:3},target,context);
   if(wins>=2)for(const enemy of [...battle.enemyCreatures])damageFirstEnemy(6,enemy);
   if(wins>=3){for(let n=0;n<9&&battle.phase!=='complete';n++)drawOneCard();if(battle.phase!=='complete'){battle.lands.forEach(land=>{land.tapped=false;});syncMana(battle);}}
   if(battle.phase!=='complete')resume();
  };
  const flip=()=>beginCoinFlip55(source,values=>values[0]?`Win ${wins+1}. Choose whether to collect or risk another flip.`:'Lose: Fiery Gambit has no effect. Coin-flip triggers still happen.',win=>{
   if(!win)return resume();wins++;
   openChanceChoice55(source,`${wins} win${wins===1?'':'s'} · collect ${wins>=3?'3 target damage + 6 damage to every monster + draw 9 + untap all mana cards':wins===2?'3 target damage + 6 damage to every monster':'3 damage to the chosen creature'}. A lost flip erases these rewards. Treasure already created stays.`,[{key:'stop',label:'Stop & collect'},{key:'again',label:'Flip again',detail:wins>=3?'Rewards are already at maximum. Another flip only adds risk.':'Risk the rewards for a higher tier.'}],option=>option.key==='stop'?collect():flip(),null,battle);
  },battle);
  flip();return true;
 }
 return baseChanceEffect55(effect,target,context,resume);
};

// Krark's Thumb is legendary: a new copy replaces the previous one in this adaptation.
const baseChancePaid55=resolvePaidCard44;
resolvePaidCard44=function(card,battle=state.battle){
 if(card.name==="Krark's Thumb")for(const old of battle.permanents.filter(p=>p.card.name===card.name)){battle.permanents=battle.permanents.filter(p=>p!==old);battle.graveyard.push(old.card);addLog('Legendary rule: keep the newly cast Krark’s Thumb.');}
 return baseChancePaid55(card,battle);
};
const CHANCE_RULES55={
 'Hoarding Ogre':['Whenever it actually attacks, roll a D20 before combat damage. 1–9: create 1 Treasure; 10–19: 2; exactly 20: 3.','Each Treasure can be tapped and sacrificed for 1 floating generic mana. Tokens made in combat last for this encounter.'],
 'Contact Other Plane':['Roll a D20. 1–9: draw 2. 10–19: scry 2, then draw 2. Exactly 20: scry 3, then draw 3.','Each spell copy rolls and finishes its own scry/draw sequence.'],
 'Squirrel-Powered Scheme':['Each copy increases every die you roll by 2. This affects D6 and D20 results, including each of the two Elvish Impersonators rolls.','The die shows its natural face; the result shows the added bonus. Enemy dice and coin flips are unaffected. Results outside a card’s printed table have no effect.'],
 'Tavern Swindler':['Tap and pay 3 life: flip a coin. Heads wins and gains 6 life; tails gives no reward.','Summoning sickness prevents activation. Paying your last 3 life loses the run before the flip. Costs are never refunded.'],
 'Tavern Scoundrel':['Whenever you win a coin flip, each Scoundrel you control creates 2 Treasure. Ignored flips do not count.','Pay 1 generic mana, tap and sacrifice another permanent you control: flip a coin. Choose the sacrifice before paying. Cancel is free. Summoning sickness prevents activation.'],
 "Krark's Thumb":['Whenever you would flip one coin, flip two instead. Choose one result to keep; ignore the other. Heads wins.','Legendary: casting another copy keeps the new one and puts your previous Thumb into your graveyard.'],
 'Fiery Gambit':['Choose a creature or monster. Flip until you lose or choose to stop. After every win, choose Stop & collect or Flip again. A loss gives no spell rewards.','1+ wins: deal 3 damage to the chosen creature. 2+ wins: also deal 6 damage to every living monster (the adaptation of “each opponent”). 3+ wins: also draw 9 cards and untap every mana card you control.','Rewards accumulate but apply only when you stop. Extra wins beyond three add no new spell rewards. Scoundrel Treasure from won flips is kept even if a later flip loses. Copies start again at zero wins. Counterspell and Ward happen before flipping.']
};
const baseChanceDescriptions55=effectDescriptions;
effectDescriptions=function(card){if(card.battleToken)return [CAMP_REWARDS[card.tokenKind].description,'A token created in combat. It lasts for this encounter and disappears when sacrificed.'];return CHANCE_RULES55[card.name]||baseChanceDescriptions55(card);};
const baseChanceSummary55=draftAbilitySummary;
draftAbilitySummary=function(card){return {'Hoarding Ogre':'Attack: roll D20, create 1–3 Treasure.','Contact Other Plane':'Roll D20: draw 2; higher rolls add scry, a 20 draws 3.','Squirrel-Powered Scheme':'+2 to every die you roll. Results may exceed the printed table.','Tavern Swindler':'Tap, pay 3 life, flip: win to gain 6 life.','Tavern Scoundrel':'Won flips create 2 Treasure. Pay 1, tap, sacrifice another permanent to flip.',"Krark's Thumb":'Flip twice, keep one result. Legendary artifact.','Fiery Gambit':'Flip again or collect: damage, then more damage, then draw 9 + untap.'}[card.name]||baseChanceSummary55(card);};

const baseChanceSfx55=playSfx;
playSfx=function(name){
 if(name!=='coin-land')return baseChanceSfx55(name);
 if(!state.soundOn||document.hidden)return;
 const epoch=soundEngine.epoch||0;
 soundEngine.resume().then(()=>{if(!state.soundOn||document.hidden||(soundEngine.epoch||0)!==epoch)return;const ctx=soundEngine.context,t=ctx.currentTime;for(const [frequency,volume] of [[1320,.018],[2180,.009],[3490,.004]]){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.003);gain.gain.exponentialRampToValueAtTime(.00001,t+.16);oscillator.connect(gain);gain.connect(soundEngine.bus);soundEngine.voices.add(oscillator);oscillator.onended=()=>soundEngine.voices.delete(oscillator);oscillator.start(t);oscillator.stop(t+.18);}}).catch(()=>{});
};
