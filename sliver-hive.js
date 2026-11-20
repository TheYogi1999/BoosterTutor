/* v0.91 — eight original Slivers, actual multicolor creatures and ability provenance. */
const FOES91={
 sunbondsliver:{name:'Sunbond Sliver',tier:'elite',minNode:2,health:13,power:2,pattern:['guard','attack','mend','attack'],keywords:['lifelink'],hiveKeyword:'lifelink',mend:2,bounty:15,type_line:'Creature — Sliver',colors:['W']},
 quickcrestsliver:{name:'Quickcrest Sliver',tier:'elite',minNode:2,health:12,power:2,pattern:['attack','guard','attack','buff'],keywords:['haste'],hiveKeyword:'haste',bounty:15,type_line:'Creature — Sliver',colors:['U','R']},
 dawnwatchsliver:{name:'Dawnwatch Sliver',tier:'elite',minNode:2,health:15,power:2,pattern:['guard','attack','mend','attack'],keywords:['vigilance'],hiveKeyword:'vigilance',mend:3,bounty:15,type_line:'Creature — Sliver',colors:['W','G']},
 thornchargesliver:{name:'Thorncharge Sliver',tier:'elite',minNode:3,health:18,power:3,pattern:['buff','attack','guard','attack'],keywords:['trample'],hiveKeyword:'trample',bounty:18,type_line:'Creature — Sliver',colors:['R','G']},
 dreadcoilsliver:{name:'Dreadcoil Sliver',tier:'elite',minNode:3,health:15,power:3,pattern:['guard','attack','buff','attack'],keywords:['menace'],hiveKeyword:'menace',bounty:17,type_line:'Creature — Sliver',colors:['B','R']},
 prismaticsliver:{name:'Prismatic Sliver',tier:'elite',minNode:3,health:12,power:1,pattern:['guard','attack','mend','attack'],keywords:[],ward:1,hiveKeyword:'ward',hiveWard:1,mend:2,bounty:17,type_line:'Creature — Sliver',colors:['W','U']},
 twinbladesliver:{name:'Twinblade Sliver',tier:'elite',minNode:3,health:10,power:1,pattern:['guard','attack','attack','guard'],keywords:['double strike'],hiveKeyword:'double strike',bounty:18,type_line:'Creature — Sliver',colors:['W','R']},
 mistshroudsliver:{name:'Mistshroud Sliver',tier:'elite',minNode:3,health:9,power:1,pattern:['guard','attack','guard','attack'],keywords:['hexproof'],hiveKeyword:'hexproof',bounty:18,type_line:'Creature — Sliver',colors:['U','B']}
};
for(const t of Object.values(FOES91))t.color_identity=[...t.colors];
Object.assign(FOE_TYPES,FOES91);

const HIVE_LABELS91={flying:'Flying',deathtouch:'Deathtouch','first strike':'First strike',reach:'Reach',lifelink:'Lifelink',haste:'Haste',vigilance:'Vigilance',trample:'Trample',menace:'Menace','double strike':'Double strike',hexproof:'Hexproof',ward:'Ward (1 mana)'};
function hiveKeyword91(label){return Object.keys(HIVE_LABELS91).find(k=>k==='ward'?/^Ward \(/i.test(label):label.toLowerCase()===k)||null;}
const baseHiveLabels91=creatureKeywordLabels;
creatureKeywordLabels=function(u){
 const text=baseHiveLabels91(u),t=sliverTemplate90(u);if(!t)return text;
 const labels=text.split(' · ').filter(Boolean),i=labels.findIndex(label=>hiveKeyword91(label)===t.hiveKeyword);
 if(i>0){const [own]=labels.splice(i,1),at=labels[0]?.startsWith('Protection (')?1:0;labels.splice(at,0,own);}return labels.join(' · ');
};
function hiveRelations91(u,keyword,b=state.battle){
 const t=sliverTemplate90(u);if(!t)return{sources:[],recipients:[],gives:false};
 const alive=creatureAlive(u)||sliverCombatDepth90>0,gives=alive&&t.hiveKeyword===keyword;
 return{sources:sliverSources90(u,keyword,b).filter(d=>d!==u),recipients:gives?sliverAllies90(u,b).filter(d=>d!==u&&sliverTemplate90(d)&&creatureAlive(d)):[],gives};
}
function hiveIcon91(direction){return `<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${direction==='give'?'<circle cx="3" cy="8" r="1.8"/><path d="M5 8h4m0 0 3-4m-3 4 3 4"/><path d="m9 4 3 0 0 3m-3 5 3 0 0-3"/>':'<circle cx="12" cy="8" r="2"/><path d="M2 8h7M6 5l3 3-3 3"/>'}</svg>`;}
function hiveMarker91(u,keyword,direction,related,count=false){
 const label=HIVE_LABELS91[keyword],names=related.map(d=>d.card.name),info=direction==='give'?`Grants ${label} to ${names.length?names.join(', '):'allied Slivers (no other Sliver currently)'}.`:`Receives ${label} from ${names.join(', ')}.`;
 return `<span class="hive-marker91 hive-${direction}91" data-hive-link91="${direction}" data-hive-unit91="${escapeHtml(u.id)}" data-hive-related91="${escapeHtml(related.map(d=>d.id).join(' '))}" role="img" aria-label="${escapeHtml(info)}" title="${escapeHtml(info)}">${hiveIcon91(direction)}${count&&related.length>1?`<small>${related.length}</small>`:''}</span>`;
}
function hiveMarkup91(markup,u){
 if(!sliverTemplate90(u))return markup;
 return markup.replace(/(<span\b[^>]*>)([^<]*)(<\/span>)/g,(whole,open,label,close)=>{
  const keyword=hiveKeyword91(label);if(!keyword)return whole;
  const relation=hiveRelations91(u,keyword),give=relation.gives?hiveMarker91(u,keyword,'give',relation.recipients):'',receive=relation.sources.length?hiveMarker91(u,keyword,'receive',relation.sources):'';
  return give||receive?open.replace('>',' data-hive-keyword91="'+keyword+'">')+label+give+receive+close:whole;
 });
}
const baseHiveBadges91=enemyKeywordBadges47;
enemyKeywordBadges47=function(u){return hiveMarkup91(baseHiveBadges91(u),u);};
const baseHiveChips91=creatureChips67;
creatureChips67=function(u){return sliverTemplate90(u)?hiveMarkup91(creatureKeywordLabels(u).split(' · ').filter(Boolean).map(keywordTag61).join(' '),u):baseHiveChips91(u);};

// Identity remains separate from actual color; multicolor enemies show every component.
const baseHiveIdentity91=enemyIdentity90;
enemyIdentity90=function(u){const actual=cardColors88(u.card),html=baseHiveIdentity91(u);return actual.length>1?html.replace('class="enemy-identity90"',`class="enemy-identity90 is-multicolor91" data-enemy-colors91="${actual.join('')}"`).replace('title="Color identity:',`title="Multicolor (${actual.map(c=>COLOR_NAMES90[c]).join(' / ')}). Color identity:`):html;};

function hiveSummary91(u){
 if(!sliverTemplate90(u))return[];const lines=[];
 for(const keyword of Object.keys(HIVE_LABELS91)){
  const r=hiveRelations91(u,keyword);if(r.gives)lines.push(`Grants ${HIVE_LABELS91[keyword]} to ${r.recipients.map(d=>d.card.name).join(', ')||'allied Slivers (no other Sliver currently)'}.`);
  if(r.sources.length)lines.push(`Receives ${HIVE_LABELS91[keyword]} from ${r.sources.map(d=>d.card.name).join(', ')}.`);
 }
 return lines;
}
function hiveRoleMarkup91(u){
 const t=sliverTemplate90(u);if(!t)return'';
 const r=hiveRelations91(u,t.hiveKeyword),sources=[...new Set(Object.keys(HIVE_LABELS91).flatMap(k=>hiveRelations91(u,k).sources))];
 const give=r.gives?hiveMarker91(u,t.hiveKeyword,'give',r.recipients,true):'';
 const info=hiveSummary91(u).filter(s=>s.startsWith('Receives')).join(' ');
 const receive=sources.length?`<span class="hive-marker91 hive-receive91" data-hive-link91="receive" data-hive-unit91="${escapeHtml(u.id)}" data-hive-related91="${escapeHtml(sources.map(d=>d.id).join(' '))}" role="img" title="${escapeHtml(info)}" aria-label="${escapeHtml(info)}">${hiveIcon91('receive')}<small>${sources.length}</small></span>`:'';
 return `<span class="hive-roles91">${give}${receive}</span>`;
}
const baseHiveDescriptions91=effectDescriptions;
effectDescriptions=function(card){const b=state.battle,u=b&&[...b.creatures,...b.enemyCreatures].find(d=>d.card===card),lines=baseHiveDescriptions91(card);return u&&sliverTemplate90(u)?[...lines,...hiveSummary91(u),...(sliverTemplate90(u).hiveKeyword==='ward'?['This hive grants Ward (1 mana). Multiple Prismatic Slivers do not increase this shared Ward cost.']:[])]:lines;};

function clearHiveHighlights91(){document.querySelectorAll('.hive-source91,.hive-recipient91').forEach(n=>n.classList.remove('hive-source91','hive-recipient91'));}
function highlightHiveLink91(marker){
 clearHiveHighlights91();const own=marker.dataset.hiveUnit91,other=(marker.dataset.hiveRelated91||'').split(' ').filter(Boolean),give=marker.dataset.hiveLink91==='give';
 for(const [id,source] of [[own,give],...other.map(id=>[id,!give])])for(const n of document.querySelectorAll('[data-enemy-attacker],[data-host-id]'))if((n.dataset.enemyAttacker||n.dataset.hostId)===id)n.classList.add(source?'hive-source91':'hive-recipient91');
}
document.addEventListener('pointerover',e=>{const marker=e.target.closest?.('[data-hive-link91]');if(marker)highlightHiveLink91(marker);});
document.addEventListener('pointerout',e=>{const marker=e.target.closest?.('[data-hive-link91]');if(marker&&!marker.contains(e.relatedTarget))clearHiveHighlights91();});
document.addEventListener('focusin',e=>{const marker=e.target.closest?.('[data-hive-link91]');if(marker)highlightHiveLink91(marker);});
document.addEventListener('focusout',clearHiveHighlights91);
const baseHiveEnemyRender91=renderEnemyBoard;
renderEnemyBoard=function(){const result=baseHiveEnemyRender91(),b=state.battle;if(b?.enemyCreatures.some(sliverTemplate90)){
 const label=$('#enemy-board-label');label?.insertAdjacentHTML('beforeend',`<span class="hive-legend91" aria-label="Gold: grants an ability. Blue: receives an ability."><span title="Grants an ability">${hiveIcon91('give')} Gives</span><span title="Receives an ability">${hiveIcon91('receive')} Receives</span></span>`);
 for(const u of b.enemyCreatures.filter(sliverTemplate90)){const n=$('#enemy-board').querySelector(`[data-enemy-attacker="${u.id}"]`);if(n){n.setAttribute('aria-label',n.getAttribute('aria-label')+'. '+hiveSummary91(u).join(' '));n.querySelector('.monster-figure')?.insertAdjacentHTML('beforeend',hiveRoleMarkup91(u));}}
 }return result;};
// A newly granted Hexproof ability also invalidates an already chosen opposing target.
const baseHiveAdvance91=advanceResolution27;
advanceResolution27=function(task){const b=task?.battle,p=task?.p,u=choiceTargetUnit(task?.target,b);if(b===state.battle&&task.effect===0&&task.copy<task.copies&&p?.rule.target&&task.target?.side==='enemy'&&hasCreatureKeyword(u,'hexproof')){addLog(`${p.card.name}: Hexproof makes its target illegal.`);if(isAura(p.card))b.graveyard.push(p.card);task.copy++;task.effect=0;task.wardPaid=false;return advanceResolution27(task);}return baseHiveAdvance91(task);};
const baseHiveAbilityWard91=withJesterWard65;
withJesterWard65=function(b,target,source,effect,done){return baseHiveAbilityWard91(b,target,source,u=>{if(u?.owner!=='enemy'||!hasCreatureKeyword(u,'hexproof'))effect(u);},done);};
