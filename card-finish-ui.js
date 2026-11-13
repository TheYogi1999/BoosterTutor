/* Run upgrades are the sole source of foil, and their marks stay on the art. */
const baseMarkedFace61=cardFace;
cardFace=function(card){
 const face=baseMarkedFace61(card),counters=activeRunCounters60(card);
 if(!counters.length)return face;
 const label=`${counters.length} run counter${counters.length===1?'':'s'}: ${runCounterLabels60(card).join(', ')}`;
 const stats=runStatCount60(card);
 const marks=`<span class="card-run-counters61" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="counter-medallion61"><svg class="counter-sigil63" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path class="sigil-wax63" d="M20 2 25 6 32 5 33 12 39 17 35 23 36 30 29 32 24 39 18 35 11 37 8 30 1 25 5 18 3 11 10 8 14 1Z"/><circle class="sigil-ring63" cx="20" cy="20" r="14"/><circle class="sigil-inner63" cx="20" cy="20" r="10.5"/><path class="sigil-star63" d="m20 8 10.4 18H9.6Zm0 24L9.6 14h20.8Z"/><path class="sigil-runes63" d="M20 3v4m0 26v4M3 20h4m26 0h4M8 8l3 3m18 18 3 3M8 32l3-3m18-18 3-3"/></svg><b>${counters.length}</b></span>${stats?`<span class="card-stat-counter61">+${stats}/+${stats}</span>`:''}</span>`;
 return face.replace(/<\/span>$/,`${marks}</span>`);
};
const KEYWORD_TONES61={flying:'sky',reach:'green',lifelink:'rose',deathtouch:'violet',toxic:'poison',infect:'poison',trample:'orange',vigilance:'blue',haste:'amber','first strike':'gold','double strike':'gold',defender:'steel',hexproof:'teal',ward:'teal',menace:'red',flash:'gold',scry:'sky',equip:'steel',enchant:'violet',lure:'amber'};
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
 return escapeHtml(text).replace(/\b(double strike|first strike|flying|reach|lifelink|deathtouch|toxic(?:\s+\d+)?|infect|trample|vigilance|haste|defender|hexproof|ward|menace|flash|scry|equip|enchant|lure)\b/gi,label=>{
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
