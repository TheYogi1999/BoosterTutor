/* Run upgrades are the sole source of foil, and their marks stay on the art. */
const baseMarkedFace61=cardFace;
cardFace=function(card){
 const face=baseMarkedFace61(card),counters=activeRunCounters60(card);
 if(!counters.length)return face;
 const label=`${counters.length} run counter${counters.length===1?'':'s'}: ${runCounterLabels60(card).join(', ')}`;
 const stats=runStatCount60(card);
 const marks=`<span class="card-run-counters61" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="counter-medallion61"><span aria-hidden="true">✦</span><b>${counters.length}</b></span>${stats?`<span class="card-stat-counter61">+${stats}/+${stats}</span>`:''}</span>`;
 return face.replace(/<\/span>$/,`${marks}</span>`);
};
const KEYWORD_TONES61={flying:'sky',reach:'green',lifelink:'rose',deathtouch:'violet',toxic:'poison',infect:'poison',trample:'orange',vigilance:'blue',haste:'amber','first strike':'gold','double strike':'gold',defender:'steel',hexproof:'teal',ward:'teal',menace:'red',flash:'gold',scry:'sky',equip:'steel',enchant:'violet'};
function keywordKey61(label){return Object.keys(KEYWORD_TONES61).find(key=>label.toLowerCase()===key||label.toLowerCase().startsWith(key+' ')||label.toLowerCase().startsWith(key+'('))||'';}
function keywordTag61(label){const key=keywordKey61(label);return `<span class="keyword-tag61 keyword-${KEYWORD_TONES61[key]||'steel'}61" data-keyword="${escapeHtml(key)}">${escapeHtml(label)}</span>`;}
function keywordChips61(card){
 const labels=new Map();
 for(let label of displayKeywords(card)){
  const key=keywordKey61(label);
  if(key==='toxic')label=`Toxic ${creatureKeywords(card).toxic||1}`;
  else label=label.replace(/\b\w/g,letter=>letter.toUpperCase());
  labels.set(key||label,label);
 }
 return labels.size?[...labels.values()].map(keywordTag61).join(' '):'<span class="keyword-none61">None</span>';
}
function keywordText61(text){
 return escapeHtml(text).replace(/\b(double strike|first strike|flying|reach|lifelink|deathtouch|toxic(?:\s+\d+)?|infect|trample|vigilance|haste|defender|hexproof|ward|menace|flash|scry|equip|enchant)\b/gi,label=>{
  const key=keywordKey61(label);return `<span class="keyword-word61 keyword-${KEYWORD_TONES61[key]||'steel'}61" data-keyword="${escapeHtml(key)}">${label}</span>`;
 });
}
function closeCounterReveal61(){const dialog=$('#counter-reveal-dialog');if(dialog.open)dialog.close();state.counterReveal61=null;}
function showCounterReveal61(card,kind){
 const type=RUN_COUNTERS60[kind];state.counterReveal61={card,kind};
 $('#counter-reveal-title').innerHTML=keywordTag61(type.name);
 $('#counter-reveal-card').innerHTML=cardFace(card);
 $('#counter-reveal-description').textContent=`${card.name} gained ${type.name}. ${type.description} Only this copy is upgraded.`;
 $('#counter-reveal-dialog').showModal();$('#counter-reveal-close').focus({preventScroll:true});
}
$('#counter-reveal-close').addEventListener('click',closeCounterReveal61);
$('#counter-reveal-dialog').addEventListener('cancel',event=>{event.preventDefault();closeCounterReveal61();});
$('#counter-reveal-dialog').addEventListener('close',()=>{state.counterReveal61=null;});
const baseRevealScreen61=showScreen;
showScreen=function(id){if(id!=='shop-screen')closeCounterReveal61();return baseRevealScreen61(id);};
