/* Prepared starter decks; opening this menu never changes the active run. */
const PRECON_COLORS71={W:{name:'White',hex:'#e7dbb4'},U:{name:'Blue',hex:'#69bdec'},B:{name:'Black',hex:'#b398c9'},R:{name:'Red',hex:'#ee8b65'},G:{name:'Green',hex:'#8ac89a'}};
const PRECONS71=[
 {id:'ember-echo',name:'Ember & Echo',theme:'Spellslinger',colors:['U','R'],hero:'Prodigal Pyromancer',description:'Small spellcasters, careful card draw and copied burn. Keep mana open and answer at the right moment.',lands:[['Island',4],['Mountain',3]],cards:[['Prodigal Pyromancer',2],['Wind Drake',2],['Goblin Fireslinger',2],['Prodigal Sorcerer',1],['Shock',2],['Lightning Strike',1],['Doublecast',1],['Brainstorm',1],['Opt',1],['Divination',1],['Negate',1],['Thrill of Possibility',1]]},
 {id:'relic-bloom',name:'Relic & Bloom',theme:'Equipment & Auras',colors:['W','G'],hero:'Fencing Ace',description:'Build a modest creature into your champion. Mix equipment, auras and protection; keep an eye on equip costs.',lands:[['Plains',4],['Forest',3]],cards:[['Fencing Ace',1],['Youthful Knight',2],['Savannah Lions',2],["Healer's Hawk",1],['Canopy Spider',1],['Abbey Griffin',1],['Short Sword',1],['Leonin Scimitar',1],['Vulshok Morningstar',1],['Holy Strength',1],['Rancor',1],['Snakeskin Veil',1],['Disenchant',1],['Revitalize',1]]},
 {id:'twilight-vigil',name:'Twilight Vigil',theme:'Lifegain & Recovery',colors:['W','B'],hero:'Vampire Nighthawk',description:'Trade patiently, recover life and bring a fallen ally back. One Nighthawk leads a humble supporting cast.',lands:[['Plains',4],['Swamp',3]],cards:[['Vampire Nighthawk',1],["Healer's Hawk",2],['Walking Corpse',2],['Soul Warden',1],['Youthful Knight',1],['Dune Beetle',1],['Revitalize',1],['Fountain of Renewal',1],['Murder',1],['Raise Dead',1],['Read the Bones',1],['Unholy Strength',1],['Disenchant',1],["Altar's Reap",1]]},
 {id:'venom-thorns',name:'Venom & Thorns',theme:'Poison & Deathtouch',colors:['B','G'],hero:'Thornweald Archer',description:'Reach, careful trades and a small poison package. Protect your fragile specialists rather than rushing every attack.',lands:[['Forest',4],['Swamp',3]],cards:[['Thornweald Archer',1],['Deadly Recluse',1],['Canopy Spider',1],['Plague Stinger',1],['Grizzly Bears',2],['Walking Corpse',1],['Dune Beetle',1],['Battlegrowth',1],['Giant Growth',1],['Hunger of the Howlpack',1],['Raise Dead',1],['Village Rites',1],['Infectious Inquiry',1],['Naturalize',1],['Murder',1]]},
 {id:'wildfire-stampede',name:'Wildfire Stampede',theme:'Creatures & Combat Tricks',colors:['R','G'],hero:"Garruk's Companion",description:'Honest creatures, a little haste and timely combat tricks. Grow into a single Baloth instead of starting with giant finishers.',lands:[['Forest',4],['Mountain',3]],cards:[["Garruk's Companion",1],['Raging Goblin',2],['Goblin Piker',2],['Grizzly Bears',2],['Centaur Courser',1],['Rumbling Baloth',1],['Giant Growth',2],['Lightning Strike',1],['Shock',1],['Titanic Growth',1],['Naturalize',1],['Thrill of Possibility',1]]},
 {id:'skyward-watch',name:'Skyward Watch',theme:'Flying & Vigilance',colors:['W','U'],hero:'Thunderclap Wyvern',description:'Build a small flying formation and defend with vigilance. Your single Wyvern strengthens creatures that already have Flying.',lands:[['Island',4],['Plains',3]],cards:[['Thunderclap Wyvern',1],['Wind Drake',2],["Healer's Hawk",2],['Abbey Griffin',1],['Armored Griffin',1],['Veteran Cavalier',1],['Coral Merfolk',1],['Opt',1],['Divination',1],['Negate',1],['Dispel',1],['Revitalize',1],['Flight of Fancy',1],["Iona's Judgment",1]]}
];
let selectedPrecon71=null;
let startingPrecon71=false;
function preconDefinition71(id){return PRECONS71.find(deck=>deck.id===id)||null;}
function preconContents71(id){
 const deck=preconDefinition71(id);if(!deck)throw Error('Unknown starter deck.');
 const find=name=>{const card=[...BUNDLED_CARDS,...FALLBACK_LANDS].find(c=>c.name===name);if(!card)throw Error(`Missing starter card: ${name}`);return card;};
 const entries=[...deck.cards,['Booster Tutor',1],...deck.lands].map(([name,count])=>({card:find(name),count}));
 if(entries.reduce((n,e)=>n+e.count,0)!==24||deck.cards.reduce((n,e)=>n+e[1],0)!==16||deck.lands.reduce((n,e)=>n+e[1],0)!==7)throw Error('Starter decks must contain exactly 24 cards.');
 for(const {card,count} of entries)if(!Number.isInteger(count)||count<1||(!isLand(card)&&(count>2||!rulesAudit(card).playable)))throw Error(`Invalid starter entry: ${card.name}`);
 return entries;
}
function mintPrecon71(id){
 return preconContents71(id).flatMap(({card,count})=>Array.from({length:count},()=>{
  const copy=runCard59(card);if(isLand(card)){copy.runMana=true;copy.instanceId=`run-mana-${state.nextPermanentId++}`;}return copy;
 }));
}
function preconColors71(deck){return deck.colors.map(key=>`<span class="precon-color71" style="--gem:${PRECON_COLORS71[key].hex}" title="${PRECON_COLORS71[key].name}">${key}</span>`).join('');}
function renderPreconDetails71(){
 const deck=preconDefinition71(selectedPrecon71),panel=$('#precon-details');$('#precon-begin').disabled=!deck;
 if(!deck){panel.innerHTML='<div class="precon-empty71"><span aria-hidden="true">✧</span><h3>A ready-made beginning</h3><p>Choose a deck box to inspect all 24 cards.</p><small>Seven mana cards · one Booster Tutor<br>Go straight into the first encounter.</small></div>';return;}
 const entries=preconContents71(deck.id),creatures=entries.filter(e=>isCreature(e.card)).reduce((n,e)=>n+e.count,0),hero=BUNDLED_CARDS.find(c=>c.name===deck.hero);
 panel.innerHTML=`<div class="precon-detail-title71"><span class="eyebrow">${escapeHtml(deck.theme)}</span><h3>${escapeHtml(deck.name)}</h3><div>${preconColors71(deck)}<span>${deck.colors.map(c=>PRECON_COLORS71[c].name).join(' / ')}</span></div></div><p class="precon-description71">${escapeHtml(deck.description)}</p><div class="precon-counts71"><b>24 cards</b><span>${creatures} creatures · ${17-creatures} other spells · 7 lands</span></div><div class="precon-list71" aria-label="Starting deck contents">${['Creatures','Spells','Mana'].map(group=>{const rows=entries.filter(e=>group==='Mana'?isLand(e.card):group==='Creatures'?isCreature(e.card):!isLand(e.card)&&!isCreature(e.card));return `<section><h4>${group}</h4>${rows.map(({card,count})=>`<button type="button" data-precon-card="${escapeHtml(card.name)}" aria-label="Inspect ${escapeHtml(card.name)}, ${count} ${count===1?'copy':'copies'}"><b>${count}</b><span>${escapeHtml(card.name)}</span><small>${isLand(card)?'◆':Math.ceil(card.cmc||0)}</small></button>`).join('')}</section>`;}).join('')}</div><a class="precon-art-credit71" href="${escapeHtml(hero.art_print?.uri||hero.uri)}" target="_blank" rel="noreferrer">Cover art: ${escapeHtml(hero.name)} · Scryfall ↗</a>`;
 $('#precon-begin').textContent=`BEGIN RUN →`;
}
function selectPrecon71(id){
 if(!preconDefinition71(id)||startingPrecon71)return false;selectedPrecon71=id;
 document.querySelectorAll('[data-precon-deck]').forEach(button=>{const selected=button.dataset.preconDeck===id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 renderPreconDetails71();return true;
}
function onPreconTitle71(){return (!state.screen||state.screen==='start-screen')&&$('#start-screen').classList.contains('active');}
function openGameModes71(){
 if(!onPreconTitle71()||document.querySelector('dialog[open]'))return false;
 $('#precon-grid').innerHTML=PRECONS71.map(deck=>`<button type="button" class="precon-choice71${selectedPrecon71===deck.id?' selected':''}" data-precon-deck="${deck.id}" aria-pressed="${selectedPrecon71===deck.id}" style="--deck-a:${PRECON_COLORS71[deck.colors[0]].hex};--deck-b:${PRECON_COLORS71[deck.colors[1]].hex}" aria-label="${escapeHtml(deck.name)}, ${escapeHtml(deck.theme)}, ${deck.colors.map(c=>PRECON_COLORS71[c].name).join(' and ')}, 24 cards, led by ${escapeHtml(deck.hero)}"><span class="precon-box71" aria-hidden="true"><span class="precon-lid71"></span><span class="precon-spine71"></span><span class="precon-front71"><img src="assets/precons/${deck.id}.jpg" alt="" draggable="false"><span class="precon-cover-mark71">BOOSTER TUTOR</span><span class="precon-cover-title71">${escapeHtml(deck.hero)}</span><span class="precon-box-colors71">${preconColors71(deck)}</span></span></span><span class="precon-choice-label71"><b>${escapeHtml(deck.name)}</b><small>${escapeHtml(deck.theme)} <span>24 cards</span></small></span></button>`).join('');
 renderPreconDetails71();$('#game-modes-dialog').showModal();return true;
}
function inspectPreconCard71(name){
 const deck=preconDefinition71(selectedPrecon71),entry=deck&&preconContents71(deck.id).find(e=>e.card.name===name);if(!entry)return;
 const card=entry.card;$('#precon-card-content').innerHTML=`<div class="precon-inspect-art71">${cardFace(card)}</div><div class="precon-inspect-copy71"><span class="eyebrow">STARTER DECK · ${entry.count} ${entry.count===1?'COPY':'COPIES'}</span><h2>${escapeHtml(card.name)}</h2><p>${escapeHtml(card.type_line)} · ${isLand(card)?'Generic mana':`${Math.ceil(card.cmc||0)} generic mana`}</p>${isCreature(card)?combatStats(card.power,card.toughness):''}<div class="precon-inspect-rules71">${effectDescriptions(card).map(line=>`<p>${escapeHtml(line)}</p>`).join('')}</div></div>`;$('#precon-card-dialog').showModal();
}
function startPrecon71(id,restart=false){
 if(startingPrecon71||!preconDefinition71(id)||!(restart?state.screen==='end-screen':$('#game-modes-dialog').open&&onPreconTitle71()))return false;
 try{preconContents71(id);}catch(error){showActionError(error.message);return false;}
 startingPrecon71=true;
 try{
  $('#precon-card-dialog').close();$('#game-modes-dialog').close();
  prepareNewRun71('precon');state.preconId71=id;
  state.pool=playableCards(BUNDLED_CARDS);state.landPool=FALLBACK_LANDS;
  state.deck=mintPrecon71(id);recordSeenCards(state.deck.filter(c=>!isLand(c)));beginBattle(1);
  addLog(`${preconDefinition71(id).name} · prepared 24-card starter. No opening draft.`);
  return true;
 }finally{startingPrecon71=false;}
}
$('#title-game-modes').addEventListener('click',openGameModes71);
$('#game-modes-close').addEventListener('click',()=>$('#game-modes-dialog').close());
$('#precon-begin').addEventListener('click',()=>startPrecon71(selectedPrecon71));
$('#precon-grid').addEventListener('click',event=>{const button=event.target.closest('[data-precon-deck]');if(button)selectPrecon71(button.dataset.preconDeck);});
$('#precon-details').addEventListener('click',event=>{const button=event.target.closest('[data-precon-card]');if(button)inspectPreconCard71(button.dataset.preconCard);});
$('#precon-card-close').addEventListener('click',()=>$('#precon-card-dialog').close());
$('#game-modes-dialog').addEventListener('click',event=>{if(event.target===$('#game-modes-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
