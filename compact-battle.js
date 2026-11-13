/* Six visible creature positions per side and compact, direct battlefield controls. */
const MINION_TYPES67={
 goblin:{name:'Scrap Goblin',tier:'minion',health:5,power:1,pattern:['attack','attack','guard'],keywords:[],bounty:4,type_line:'Creature — Goblin Scout'},
 goblinArsonist:{name:'Cinder Goblin',tier:'minion',health:6,power:1,pattern:['attack','scorch','attack'],keywords:[],bounty:5,type_line:'Creature — Goblin Shaman'},
 goblinSneak:{name:'Tunnel Goblin',tier:'minion',health:4,power:2,pattern:['attack','guard','attack'],keywords:['menace'],bounty:4,type_line:'Creature — Goblin Rogue'},
 rat:{name:'Sewer Rat',tier:'minion',health:4,power:1,pattern:['attack','attack','guard'],keywords:[],bounty:3,type_line:'Creature — Rat'},
 saproling:{name:'Sporeling',tier:'minion',health:5,power:1,pattern:['guard','attack','attack'],keywords:[],bounty:3,type_line:'Creature — Saproling'},
 myr:{name:'Myr Scavenger',tier:'minion',health:6,power:1,pattern:['guard','attack','attack'],keywords:[],bounty:4,type_line:'Artifact Creature — Myr'}
};
Object.assign(FOE_TYPES,MINION_TYPES67);
const baseSmallFoe67=createFoe;
createFoe=function(kind,node=state.node){const enemy=baseSmallFoe67(kind,node);enemy.small67=Boolean(MINION_TYPES67[kind]);return enemy;};
const baseSmallTeam67=createEnemyTeam;
createEnemyTeam=function(encounter){
 const team=baseSmallTeam67(encounter),node=ENCOUNTERS.indexOf(encounter)+1||state.node;
 const available=node===1?['goblin','rat','saproling','myr']:Object.keys(MINION_TYPES67);
 const count=Math.min(CREATURE_LIMIT-team.length,node===1?1:node===2?2:node===3?3:4);
 return [...team,...shuffle(available).slice(0,count).map(kind=>createFoe(kind,node))].slice(0,CREATURE_LIMIT);
};

function creatureChips67(unit){
 const labels=creatureKeywordLabels(unit).split(' · ').filter(Boolean);
 if(hasFlash(unit.card)&&!labels.includes('Flash'))labels.push('Flash');
 if(unit.card.name==='Murderous Redcap')labels.push('Persist');
 const visible=labels.slice(0,3),hidden=labels.slice(3);
 return visible.map(keywordTag61).join(' ')+(hidden.length?` <span class="keyword-tag61 keyword-steel61 keyword-more67" title="${escapeHtml(hidden.join(' · '))}" aria-label="More keywords: ${escapeHtml(hidden.join(', '))}">+${hidden.length}</span>`:'');
}
const baseCompactCreatures67=renderCreatures;
renderCreatures=function(){
 baseCompactCreatures67();const b=state.battle,row=$('#creature-row');row.style.setProperty('--unit-count',String(Math.max(1,b.creatures.length)));
 const empty=row.querySelector('.empty-board');if(empty)empty.remove();
 for(const u of b.creatures){
  const host=row.querySelector(`[data-host-id="${u.id}"]`);if(!host)continue;
  const strip=host.querySelector('.keyword-strip');if(strip){strip.innerHTML=creatureChips67(u);strip.title=creatureKeywordLabels(u);strip.classList.toggle('is-empty',!strip.innerHTML);}
  const mana=host.querySelector('[data-unit-mana]');if(mana){mana.textContent=`+${manaAmount66(u.card)}`;mana.setAttribute('aria-label',`Tap ${u.card.name} for ${manaAmount66(u.card)} generic mana`);}
  const controls=host.querySelector('.unit-controls');if(controls)controls.classList.toggle('no-actions67',!controls.children.length);
  const ability=host.querySelector('[data-creature-ability66]');if(ability)ability.id=`creature-ability-${u.id}`;
 }
 for(let i=b.creatures.length;i<CREATURE_LIMIT;i++)row.insertAdjacentHTML('beforeend',`<div class="creature-slot-empty67" aria-hidden="true"><span>${['I','II','III','IV','V','VI'][i]}</span></div>`);
 row.setAttribute('aria-label',`Your creatures, ${b.creatures.length} of ${CREATURE_LIMIT} slots. Choose an enemy, then click or drag a creature to attack.`);
};
function enemyTypeMarkup67(enemy){
 const parts=enemy.card.type_line.split(' — '),types=parts[0],subtypes=parts[1]||'';
 return `<span class="enemy-type67" title="${escapeHtml(enemy.card.type_line)}"><span>${escapeHtml(types)}</span><small>${escapeHtml(subtypes)}</small></span>`;
}
const baseCompactFoes67=renderEnemyBoard;
renderEnemyBoard=function(){
 baseCompactFoes67();const b=state.battle,rank=$('#enemy-board .monster-rank');if(!rank)return;
 rank.style.setProperty('--foe-columns',String(Math.max(3,Math.min(CREATURE_LIMIT,b.enemyCreatures.length))));rank.classList.toggle('dense-foes67',b.enemyCreatures.length>4);
 for(const enemy of b.enemyCreatures){
  const node=rank.querySelector(`[data-enemy-attacker="${enemy.id}"]`);if(!node)continue;node.classList.toggle('small-enemy67',Boolean(enemy.small67));
  node.querySelector('.enemy-type66')?.remove();node.querySelector('strong')?.insertAdjacentHTML('afterend',enemyTypeMarkup67(enemy));
 }
 $('#enemy-board-label').textContent=`${b.enemyCreatures.length} / ${CREATURE_LIMIT} SLOTS`;
};
const baseCompactBattle67=renderBattle;
renderBattle=function(){const result=baseCompactBattle67();const b=state.battle;if(!b)return result;if(b.phase==='main')$('#combat-action-hint').textContent='Choose an enemy, then click or drag a creature to attack. Click a queued creature again to withdraw.';return result;};
// Buttons and dropdowns are replaced by battlefield selection, including withdrawal.
$('#creature-row').addEventListener('click',event=>{const node=event.target.closest('[data-creature-id]'),b=state.battle;if(!node||b?.phase!=='attack'||Date.now()<(state.suppressClickUntil||0))return;const unit=b.creatures.find(u=>u.id===node.dataset.creatureId);if(unit?.willAttack)withdrawAttack(unit.id);});
const baseCompactQueue67=queueCreatureAttack;
queueCreatureAttack=function(id,targetId=null){const b=state.battle,u=b?.creatures.find(x=>x.id===id);if(!targetId&&b?.selectedEnemyTargetId&&u&&b.enemyCreatures.some(e=>e.id===b.selectedEnemyTargetId&&canAttackEnemy(u,e)))targetId=b.selectedEnemyTargetId;return baseCompactQueue67(id,targetId);};
