const HAND_SIZE = 7;
const PACK_SIZE = 7;
const STARTER_BOOSTER_COUNT = 6;
const COPIES_PER_DRAFT_PICK = 2;
const STARTING_MANA_CARDS = 4;
const STARTING_MANA_IN_PLAY = 2;
const STARTING_LIFE = 20;
const CARD_POOL_FILE = 'card-pool.txt';
const COLLECTION_API = 'https://api.scryfall.com/cards/collection';
const SEARCH_API = 'https://api.scryfall.com/cards/search?q=';
const CARD_CACHE_KEY = 'booster-tutor-reviewed-pool-v5';
const CARD_CACHE_TTL = 12 * 60 * 60 * 1000;
const SEEN_CARD_KEY = 'booster-tutor-seen-cards-v1';
const seenCardKeys = new Set();
const discoveryViews = new WeakMap();
const LAND_QUERY = 'game:paper lang:en t:basic t:land';
const COMBAT_KEYWORDS = ['flying','reach','lifelink','deathtouch','first strike','double strike','haste','vigilance','trample','menace','defender','hexproof'];
const SUPPORTED_KEYWORDS = [...COMBAT_KEYWORDS, 'flash', 'equip', 'enchant', 'scry'];
const AVATARS = [
  { id: 'mage', name: 'Arcane Mage', symbol: '✦' },
  { id: 'ranger', name: 'Wild Scout', symbol: '➶' },
  { id: 'guardian', name: 'Iron Guardian', symbol: '⛨' },
  { id: 'dragon', name: 'Ember Adept', symbol: '♨' }
];
const LAND_STAGES = [
  { name: 'Glacial Fortress', color: '#67b8d8', scene: 'fjord' },
  { name: 'Arid Mesa', color: '#db9861', scene: 'dunes' },
  { name: 'Temple Garden', color: '#abc482', scene: 'forest' },
  { name: 'Sunpetal Grove', color: '#d6b95f', scene: 'forest' },
  { name: 'Breeding Pool', color: '#64b8aa', scene: 'forest' },
  { name: 'Hallowed Fountain', color: '#8fbcd8', scene: 'temple' },
  { name: 'Shivan Reef', color: '#a78bc9', scene: 'fjord' },
  { name: 'Stomping Ground', color: '#d88a54', scene: 'dunes' },
  { name: 'Misty Rainforest', color: '#80b6a2', scene: 'forest' },
  { name: 'Overgrown Tomb', color: '#90a276', scene: 'forest' },
  { name: 'Valakut, the Molten Pinnacle', color: '#ed905d', scene: 'volcano' },
  { name: 'Halimar Depths', color: '#70bed0', scene: 'ocean' },
  { name: 'Crystal Vein', color: '#b49add', scene: 'crystal' },
  { name: 'Bojuka Bog', color: '#a4b97b', scene: 'marsh' }
];
// Choose scenery first so the several forest lands cannot crowd out other biomes.
function chooseRunStages56() {
  const groups = new Map();
  for (const stage of LAND_STAGES) {
    if (!groups.has(stage.scene)) groups.set(stage.scene, []);
    groups.get(stage.scene).push(stage);
  }
  return shuffle([...groups.values()]).slice(0, ENCOUNTERS.length).map(lands => shuffle(lands)[0]);
}
const FALLBACK_LANDS = BUNDLED_LANDS.map(card => ({...card, oracle_text: '{T}: Add one mana.'}));
const ENCOUNTERS = [
  { name: 'Mosswood Ambush', rank: 'SKIRMISH', location: 'THE FORGOTTEN GLADE', foeCount: 2 },
  { name: 'Rune Hunter Patrol', rank: 'ELITE', location: 'THE BROKEN PASS', foeCount: 2 },
  { name: 'Thornwild Pack', rank: 'ELITE', location: 'THE ROOT VAULT', foeCount: 3 },
  { name: 'The Shard Dragon', rank: 'BOSS', location: 'THE CROWN CHAMBER', foeCount: 2 }
];

const state = {
  pool: [],
  landPool: [],
  deck: [],
  packs: [],
  selection: new Map(),
  draftKind: 'starter',
  playerHealth: STARTING_LIFE,
  coins: 0,
  shop: null,
  node: 1,
  battle: null,
  stageLocations: [],
  selectedAvatar: 'mage',
  soundOn: true,
  toastTimer: null,
  openingTimer: null,
  nextPermanentId: 1
};

const $ = (selector) => document.querySelector(selector);
const screens = ['start-screen', 'loading-screen', 'draft-screen', 'combat-screen', 'journey-screen', 'shop-screen', 'end-screen'];

try {
  const savedAvatar = localStorage.getItem('booster-tutor-avatar');
  if (AVATARS.some(avatar => avatar.id === savedAvatar)) state.selectedAvatar = savedAvatar;
} catch { /* Avatar selection remains available without browser storage. */ }

try {
  const saved = JSON.parse(localStorage.getItem(SEEN_CARD_KEY) || '[]');
  if (Array.isArray(saved)) for (const name of saved) {
    if (typeof name === 'string' && name.trim() && name.length <= 200) seenCardKeys.add(name.trim().toLowerCase());
  }
} catch { /* Discovery tracking still works for this page session. */ }

function cardDiscoveryKey(card) { return (card.name || '').trim().toLowerCase(); }
function hasSeenCard(card) { return seenCardKeys.has(cardDiscoveryKey(card)); }
function discoveryView(cards, view = cards) {
  if (!discoveryViews.has(view)) discoveryViews.set(view, new Set(cards.filter(card => !hasSeenCard(card)).map(cardDiscoveryKey)));
  return discoveryViews.get(view);
}
function recordSeenCards(cards) {
  let changed = false;
  for (const card of cards) {
    const key = cardDiscoveryKey(card);
    if (key && !seenCardKeys.has(key)) { seenCardKeys.add(key); changed = true; }
  }
  if (changed) {
    try { localStorage.setItem(SEEN_CARD_KEY, JSON.stringify([...seenCardKeys])); } catch { /* Storage is optional. */ }
    updateDiscoveryProgress();
  }
}
function updateDiscoveryProgress() {
  const counter = $('#discovery-progress');
  if (counter) counter.textContent = String(seenCardKeys.size);
}

function renderAvatarChoices() {
  const selected = AVATARS.find(avatar => avatar.id === state.selectedAvatar) || AVATARS[0];
  document.querySelectorAll('.player-avatar, .hero-avatar').forEach(element => {
    element.dataset.avatar = selected.id;
    const symbol = element.querySelector('[data-avatar-symbol]');
    if (symbol) {
      symbol.textContent = '';
      symbol.className = `walker-portrait portrait-${selected.id}`;
    }
  });
  const choices = $('#avatar-choices');
  if (choices) choices.innerHTML = AVATARS.map(avatar => `<button type="button" class="avatar-choice${avatar.id === selected.id ? ' selected' : ''}" data-avatar-choice="${avatar.id}" aria-pressed="${avatar.id === selected.id}" aria-label="Choose ${avatar.name}">${walkerPortrait(avatar.id)}<small>${avatar.name}</small></button>`).join('');
}

function walkerPortrait(kind) {
  return `<span class="walker-portrait portrait-${kind}" aria-hidden="true"></span>`;
}

function showScreen(id) {
  if (id !== 'draft-screen') cancelBoosterTravel();
  if (id !== 'combat-screen' && typeof closeTokenAction47 === 'function') closeTokenAction47();
  if (id !== 'combat-screen' && typeof abortDiceRoll50 === 'function') abortDiceRoll50();
  state.screen = id;
  hideCardPreview();
  updatePhaseDisplay();
  $('#deck-button').disabled = !state.deck.length;
  for (const screen of screens) $('#' + screen).classList.toggle('active', screen === id);
  fitGameCanvas();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function isLand(card) { return /\bLand\b/i.test(card.type_line || ''); }
function isCreature(card) { return /\bCreature\b/i.test(card.type_line || ''); }

function hasKeywordLine(text, keyword) {
  const normalized = keyword.replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[\\n,])\\s*${normalized}(?:\\s*\\([^\\n)]*\\))?\\s*(?=[,\\n]|$)`, 'i').test(text);
}

function creatureKeywords(card) {
  const text = card.oracle_text || '';
  return {
    flying: hasKeywordLine(text, 'flying'),
    lifelink: hasKeywordLine(text, 'lifelink'),
    doubleStrike: hasKeywordLine(text, 'double strike'),
    firstStrike: hasKeywordLine(text, 'first strike'),
    deathtouch: hasKeywordLine(text, 'deathtouch'),
    reach: hasKeywordLine(text, 'reach'),
    haste: hasKeywordLine(text, 'haste'),
    vigilance: hasKeywordLine(text, 'vigilance'),
    trample: hasKeywordLine(text, 'trample'),
    menace: hasKeywordLine(text, 'menace'),
    defender: hasKeywordLine(text, 'defender'),
    hexproof: hasKeywordLine(text, 'hexproof')
  };
}

function hasCreatureKeyword(creature, keyword) {
  const property = {
    'double strike': 'doubleStrike',
    'first strike': 'firstStrike'
  }[keyword] || keyword;
  return Boolean(creature?.[property] || creature?.temporaryKeywords?.includes(keyword) || creature?.permanentKeywords?.includes(keyword));
}

function canAttackEnemy(attacker, enemy) {
  return Boolean(attacker && enemy) && (!hasCreatureKeyword(enemy, 'flying') || hasCreatureKeyword(attacker, 'flying') || hasCreatureKeyword(attacker, 'reach'));
}

function canBlockCreature(blocker, attacker) {
  if (/can't be blocked by Walls/i.test(attacker.card?.oracle_text || '') && /\bWall\b/.test(blocker.card?.type_line || '')) return false;
  return !hasCreatureKeyword(attacker, 'flying') || hasCreatureKeyword(blocker, 'flying') || hasCreatureKeyword(blocker, 'reach');
}

function creatureKeywordLabels(creature) {
  const labels = [
    ['flying', 'Flying'],
    ['lifelink', 'Lifelink'],
    ['double strike', 'Double strike'],
    ['first strike', 'First strike'],
    ['deathtouch', 'Deathtouch'],
    ['reach', 'Reach'], ['vigilance', 'Vigilance'], ['haste', 'Haste'], ['trample', 'Trample'], ['menace', 'Menace'], ['defender', 'Defender'],
    ['hexproof', 'Hexproof']
  ];
  return labels.filter(([keyword]) => hasCreatureKeyword(creature, keyword)).map(([, label]) => label).join(' · ');
}

function normalizeScryfallCard(card) {
  const face = card.card_faces?.[0] || {};
  const images = card.image_uris || face.image_uris || {};
  const original = [...BUNDLED_CARDS,...BUNDLED_LANDS].find(item=>item.name===(card.name||face.name));
  return {
    id: card.id,
    name: card.name || face.name || 'Unknown card',
    mana_cost: card.mana_cost || face.mana_cost || '',
    cmc: Number(card.cmc ?? face.cmc ?? 0),
    type_line: card.type_line || face.type_line || 'Magic card',
    oracle_text: card.oracle_text || face.oracle_text || '',
    power: card.power || face.power || '',
    toughness: card.toughness || face.toughness || '',
    color_identity: card.color_identity || [],
    keywords: card.keywords || [],
    image: original?.image || images.normal || images.large || '',
    art: original?.art || images.art_crop || '',
    uri: card.scryfall_uri || '',
    rarity: card.rarity || 'common',
    verified: true
  };
}

async function apiCollect(names) {
  const response = await fetch(COLLECTION_API, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifiers: names.map(name => ({ name })) })
  });
  if (!response.ok) throw new Error(`Scryfall collection request returned ${response.status}`);
  return response.json();
}

async function apiSearch(query) {
  const response = await fetch(`${SEARCH_API}${encodeURIComponent(query)}&order=name&unique=cards`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Scryfall search returned ${response.status}`);
  return response.json();
}

async function loadCardPool() {
  let cached = null;
  try { cached = localStorage.getItem(CARD_CACHE_KEY); } catch { /* Browser storage is optional. */ }
  if (cached) {
    try {
      const value = JSON.parse(cached);
      if (Date.now() - value.savedAt < CARD_CACHE_TTL && value.cards?.length > BUNDLED_CARDS.length && value.lands?.length >= 5) {
        const merged = new Map(value.cards.map(card=>[card.name.toLowerCase(),card]));
        for (const card of BUNDLED_CARDS) merged.set(card.name.toLowerCase(),card);
        return { cards: [...merged.values()], lands: value.lands, cached: true, missingCount: value.missingCount || 0, sourceCount: value.sourceCount || 0 };
      }
    } catch { /* Ignore a malformed card cache. */ }
  }

  try {
    $('#loading-message').textContent = 'Reading the curated list of Magic cards.';
    const poolResponse = await fetch(CARD_POOL_FILE, { headers: { Accept: 'text/plain' } });
    if (!poolResponse.ok) throw new Error(`Card list returned ${poolResponse.status}`);
    const names = [...new Set((await poolResponse.text()).split(/\r?\n/).map(name => name.trim()).filter(name => name && !name.startsWith('#')))];
    if (!names.length) throw new Error('The curated card list is empty.');
    const batches = [];
    for (let index = 0; index < names.length; index += 75) batches.push(names.slice(index, index + 75));
    const rawCards = [];
    let missingCount = 0;
    for (let index = 0; index < batches.length; index += 1) {
      $('#loading-message').textContent = `Loading cards from Scryfall · ${index + 1} / ${batches.length}`;
      const result = await apiCollect(batches[index]);
      rawCards.push(...(result.data || []));
      missingCount += (result.not_found || []).length;
      if (index < batches.length - 1) await new Promise(resolve => setTimeout(resolve, 130));
    }
    await new Promise(resolve => setTimeout(resolve, 130));
    $('#loading-message').textContent = 'Finding basic land cards for your deck.';
    const landResult = await apiSearch(LAND_QUERY);
    const scryfallCards = rawCards.map(normalizeScryfallCard).filter(card => card.name && !isLand(card));
    const merged = new Map(BUNDLED_CARDS.filter(card => !isLand(card)).map(card => [card.name.toLowerCase(), card]));
    for (const card of scryfallCards) if (!merged.has(card.name.toLowerCase())) merged.set(card.name.toLowerCase(), card);
    const cards = [...merged.values()];
    const lands = (landResult.data || []).map(normalizeScryfallCard).filter(card => /Basic Land/i.test(card.type_line));
    if (cards.length <= BUNDLED_CARDS.length || lands.length < 5) throw new Error('Scryfall returned an incomplete card pool.');
    try { localStorage.setItem(CARD_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards, lands, missingCount, sourceCount: names.length })); } catch { /* Continue without caching. */ }
    return { cards, lands, cached: false, missingCount, sourceCount: names.length };
  } catch (error) {
    if (cached) {
      try {
        const value = JSON.parse(cached);
        if (value.cards?.length && value.lands?.length) return { cards: value.cards, lands: value.lands, cached: true, missingCount: value.missingCount || 0, sourceCount: value.sourceCount || 0, warning: 'Offline: using the saved Scryfall pool.' };
      } catch { /* Fall through to the bundled cards. */ }
    }
    return { cards: BUNDLED_CARDS.filter(card => !isLand(card)).map(card => ({ ...card })), lands: FALLBACK_LANDS, cached: false, fallback: true, missingCount: 0, sourceCount: 0, warning: 'Scryfall is unavailable. The bundled demo card pool is ready offline.' };
  }
}

function ensureCardPool() {
  if (state.pool.length) return Promise.resolve({ cards: state.pool, lands: state.landPool, cached: true });
  if (!state.poolPromise) {
    state.poolPromise = loadCardPool().then(result => {
      state.pool = result.cards;
      state.landPool = result.lands;
      updateDiscoveryProgress();
      return result;
    }).finally(() => { state.poolPromise = null; });
  }
  return state.poolPromise;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function chooseRandomCards(source, count) {
  const available = shuffle(source);
  while (available.length < count) available.push(...shuffle(BUNDLED_CARDS));
  return available.slice(0, count);
}

function makeStarterPacks() {
  const cards = shuffle(state.pool);
  while (cards.length < PACK_SIZE * STARTER_BOOSTER_COUNT) cards.push(...shuffle(BUNDLED_CARDS));
  return Array.from({ length: STARTER_BOOSTER_COUNT }, (_, index) => cards.slice(index * PACK_SIZE, (index + 1) * PACK_SIZE));
}

function startNewRun() {
  if (typeof resetRunProgress59 === 'function') resetRunProgress59();
  if (typeof window.playRunStartAudio === 'function') window.playRunStartAudio();
  if (state.soundOn) soundEngine.unlock().catch(() => {});
  state.deck = [];
  state.relic = null;
  state.campTokens = [];
  state.playerHealth = STARTING_LIFE;
  state.coins = 0; state.shop = null; syncCoins();
  state.node = 1;
  state.battle = null;
  state.stageLocations = chooseRunStages56();
  state.selection.clear();
  showScreen('loading-screen');
  ensureCardPool().then(({ cards, lands, fallback, missingCount, sourceCount, warning }) => {
    state.pool = cards;
    state.landPool = lands;
    const status = $('#start-api-status span');
    status.textContent = fallback ? `${BUNDLED_CARDS.length} BUNDLED CARDS · OFFLINE` : `${cards.length} MAGIC CARDS · SCRYFALL`;
    status.style.color = fallback ? '#e5b18e' : '#b7d9c2';
    if (warning) showToast(warning);
    else if (missingCount) showToast(`${missingCount} card names could not be matched on Scryfall.`);
    if (sourceCount) $('#start-api-status').title = `${sourceCount} names in your curated card list`;
    state.packs = makeStarterPacks();
    state.draftKind = 'starter';
    state.activePack = 0;
    state.rerolledPacks = new Set();
    state.boosterSealed = true;
    renderDraft();
    showScreen('draft-screen');
  });
}

function manaCostHtml(card) {
  return `<span class="mana-chip mana-generic" title="Generic mana">${Math.ceil(card.cmc || 0)}</span>`;
}

function parseStats(card) {
  const power = Number.parseInt(card.power, 10);
  const toughness = Number.parseInt(card.toughness, 10);
  return {
    power: Number.isFinite(power) ? Math.max(0, power) : Math.max(1, Math.ceil(card.cmc / 2)),
    toughness: Number.isFinite(toughness) ? Math.max(1, toughness) : Math.max(2, card.cmc)
  };
}

const FOE_TYPES = {
  sprout: { name: 'Moss Sentinel', tier:'skirmish', health:13, power:3, pattern:['attack','guard','attack'], keywords:['reach'], bounty:10 },
  wisp: { name: 'Aether Wisp', tier:'skirmish', health:10, power:2, pattern:['buff','attack','attack'], keywords:['flying','lifelink','hexproof'], bounty:9 },
  duelist: { name:'Ember Duelist', tier:'skirmish', health:11, power:3, pattern:['attack','guard','attack','buff'], keywords:['first strike'], bounty:10 },
  boar: { name:'Ridge Boar', tier:'skirmish', health:14, power:3, pattern:['buff','attack','attack','guard'], keywords:['trample'], bounty:10 },
  sprite: { name:'Mist Sprite', tier:'skirmish', health:9, power:1, pattern:['mend','attack','attack'], keywords:['flying'], mend:3, bounty:9 },
  raider: { name:'Rune Raider', tier:'elite', health:22, power:4, pattern:['attack','buff','attack','guard'], keywords:['first strike'], bounty:15 },
  wolf: { name:'Thornwolf', tier:'elite', health:20, power:4, pattern:['attack','attack','guard'], keywords:['menace'], bounty:14 },
  stalker: { name:'Bog Stalker', tier:'elite', minNode:3, health:16, power:2, pattern:['guard','attack','attack','buff'], keywords:['deathtouch'], bounty:16 },
  bulwark: { name:'Iron Bulwark', tier:'elite', health:25, power:3, pattern:['guard','buff','attack'], keywords:['reach','first strike'], ward:1, bounty:17 },
  archivist: { name:'Rune Archivist', tier:'elite', health:17, power:2, pattern:['rune','mill','attack','guard'], keywords:[], ward:2, mill:1, runeMana:2, bounty:16 },
  vampire: { name:'Dusk Vampire', tier:'elite', health:18, power:3, pattern:['attack','attack','buff','guard'], keywords:['flying','lifelink'], ward:1, bounty:16 },
  dragon: { name:'Shard Dragon', tier:'boss', health:60, power:7, pattern:['guard','attack','buff','attack'], keywords:['flying','trample'], bounty:40 },
  tyrant: { name:'Ash Tyrant', tier:'boss', health:54, power:6, pattern:['rally','attack','attack','guard'], keywords:['trample','menace'], ward:2, bounty:42 },
  sphinx: { name:'Tide Sphinx', tier:'boss', health:52, power:5, pattern:['rune','mill','attack','mend','attack'], keywords:['flying'], ward:3, mill:2, runeMana:2, mend:4, bounty:42 }
};
function createEnemyTeam(encounter) {
  const node = ENCOUNTERS.indexOf(encounter) + 1 || state.node;
  const roster = Object.keys(FOE_TYPES);
  const early = roster.filter(kind=>FOE_TYPES[kind].tier==='skirmish');
  const elites = roster.filter(kind=>FOE_TYPES[kind].tier==='elite'&&(FOE_TYPES[kind].minNode||2)<=node);
  const lead = shuffle(elites.filter(kind=>kind!=='stalker'))[0];
  const bosses = roster.filter(kind=>FOE_TYPES[kind].tier==='boss');
  const support = shuffle(early)[0];
  const kinds = node===1?shuffle(early).slice(0,2):node===2?[lead,support]:node===3?[lead,shuffle(elites.filter(kind=>kind!==lead))[0],support]:[shuffle(bosses)[0],support];
  return (node===4?kinds:shuffle(kinds)).map(kind=>createFoe(kind,node));
}
function createFoe(kind,node=state.node){
  const template=FOE_TYPES[kind];
  if(!template)throw new Error('Unknown enemy type');
  const keywords=template.keywords.filter(keyword=>node!==1||keyword!=='hexproof');
  const card={name:template.name,type_line:'Monster',oracle_text:keywords.join(', ')};
  return {id:`enemy-${state.nextPermanentId++}`,kind,tier:template.tier,card,...creatureKeywords(card),ward:node>1?(template.ward||0):0,bounty:template.bounty,owner:'enemy',health:template.health,maxHealth:template.health,power:template.power,pattern:[...template.pattern],millAmount:template.mill||0,runeMana:template.runeMana||1,mendAmount:template.mend||3,rallyAmount:1,summonedTurn:1,summoningSick:true};
}

function enemyIntent(enemy, turn = state.battle?.turn || 1) {
  const pattern = enemy.pattern ? enemy.pattern[(turn - 1) % enemy.pattern.length] : 'attack';
  const kind = pattern === 'guard' ? 'recover' : pattern;
  if(kind==='mend')return {kind,damage:0,label:`Mend ally · ${enemy.mendAmount||3} life`,icon:'✚'};
  if(kind==='rally')return {kind,damage:0,label:`Rally · team +${enemy.rallyAmount||1} damage`,icon:'✦'};
  return { kind, damage: kind === 'attack' ? Math.max(0, enemy.power) : 0,
    label: kind === 'attack' ? `Attack · ${enemy.power} damage` : kind === 'recover' ? 'Recover · 3 life' : 'Strengthen · +1 damage', icon: kind === 'attack' ? '⚔' : kind === 'recover' ? '✚' : '✦' };
}
function resolveEnemyIntents() {
  const battle = state.battle;
  if (battle.intentsResolvedTurn === battle.turn) return;
  battle.intentsResolvedTurn = battle.turn;
  for (const enemy of battle.enemyCreatures) {
    const intent = enemyIntent(enemy);
    if (intent.kind === 'recover') {
      const recovered = Math.min(3, Math.max(0, enemy.maxHealth - enemy.health));
      enemy.health += recovered;
      if (recovered) addLog(`${enemy.card.name} recovers ${recovered} life.`);
    }
    if (intent.kind === 'buff') { enemy.power += 1; addLog(`${enemy.card.name} gains 1 damage.`); }
    if(intent.kind==='mend'){
      const ally=battle.enemyCreatures.filter(unit=>unit.health>0&&unit.health<unit.maxHealth).sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth)[0];
      if(ally){const amount=Math.min(enemy.mendAmount||3,ally.maxHealth-ally.health);ally.health+=amount;addLog(`${enemy.card.name} restores ${amount} life to ${ally.card.name}.`);}
    }
    if(intent.kind==='rally'){const amount=enemy.rallyAmount||1;for(const ally of battle.enemyCreatures)if(ally.health>0)ally.power+=amount;addLog(`${enemy.card.name} rallies its team: +${amount} damage.`);}
  }
}

function isPermanent(card) { return !isCreature(card) && /\b(?:Enchantment|Artifact)\b/i.test(card.type_line || ''); }
function isAttachment(card) { return /\b(?:Aura|Equipment)\b/i.test(card.type_line || ''); }
function isAura(card) { return /\bAura\b/i.test(card.type_line || ''); }

// This effect plan drives both execution and the rules bubble.
function cardEffects(card, creature = isCreature(card)) {
  const text = card.oracle_text || '';
  const effects = [];
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  const grant = text.match(/gains?\s+([^.;\n]+?)\s+until end of turn/i);
  if (damage) effects.push({ kind: 'damage', amount: Number(damage[1]) });
  if (life) effects.push({ kind: 'heal', amount: Number(life[1]) });
  if (draw) effects.push({ kind: 'draw', amount: ({ a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[draw[1].toLowerCase()] || Number(draw[1]) || 1 });
  const counter = text.match(/put (a|one|two|three|four|\d+) \+1\/\+1 counters? on target creature/i);
  if (counter) { const amount = ({a:1,one:1,two:2,three:3,four:4})[counter[1].toLowerCase()] || Number(counter[1]) || 1; effects.push({ kind: 'buff', power: amount, toughness: amount, temporary: false }); }
  if (buff) effects.push({ kind: 'buff', power: Number(buff[1]), toughness: Number(buff[2]), temporary: /until end of turn/i.test(text) });
  if (grant) {
    const keywords = grant[1].match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste|vigilance|trample|menace|defender|hexproof)\b/gi) || [];
    if (keywords.length) effects.push({ kind: 'keywords', keywords: keywords.map(value => value.toLowerCase()) });
  }
  if (/counter target/i.test(text)) effects.push({ kind: 'cancel' });
  if (/destroy target creature/i.test(text)) effects.push({ kind: 'destroy' });
  if (/exile target creature/i.test(text)) effects.push({ kind: 'exile' });
  if (/prevent the next|prevent all damage/i.test(text) && !life) effects.push({ kind: 'heal', amount: 4 });
  if (/create .*token/i.test(text)) effects.push({ kind: 'token' });
  if (!effects.length && !creature) effects.push({ kind: 'damage', amount: Math.max(3, Math.ceil((card.cmc || 0) * 2 + 2)) });
  return effects;
}
function permanentEffect(card) {
  const text = card.oracle_text || '';
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  const attachment = isAttachment(card);
  const keywords = attachment ? (text.match(/(?:has|have|gains?)\s+([^.;\n]+)/i)?.[1] || '').match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste|vigilance|trample|menace|defender|hexproof)\b/gi) || [] : [];
  return {
    power: buff ? Number(buff[1]) : attachment ? 1 : 0,
    toughness: buff ? Number(buff[2]) : attachment ? 1 : 0,
    keywords: keywords.map(value => value.toLowerCase())
  };
}
function signed(value) { return `${value >= 0 ? '+' : ''}${value}`; }
function effectDescriptions(card) {
  if (isLand(card)) return ['Mana card: play one during your main phase; it enters untapped.', 'Mana from this card can pay any generic card cost. It untaps at the start of your next turn.'];
  if(card.name==='Fountain of Renewal')return ['At each turn start, gain 1 life.','Pay 3 generic mana and sacrifice this artifact: draw a card. This can respond during combat.'];
  if(card.name==='Omen of the Sea')return ['Flash: cast in any combat phase.','On entry: scry 2, then draw a card. Choose top/bottom and order in the scry window.','Pay 3 generic mana and sacrifice: scry 2.'];
  if(card.name==='Angelic Chorus')return ['Whenever an allied creature enters, gain life equal to its current toughness.'];
  if (isPermanent(card)) {
    const effect = permanentEffect(card);
    const lines = ['Stays on the battlefield for this encounter.'];
    if (isAttachment(card)) {
      lines.push(isAura(card) ? 'Aura: choose an allied creature when casting.' : `Equipment: pay ${equipCost(card)} generic mana to equip or move it during your main phase.`);
      lines.push(`Its host gets ${signed(effect.power)}/${signed(effect.toughness)}${effect.keywords.length ? ' and ' + effect.keywords.join(', ') : ''}.`);
      lines.push(isAura(card) ? card.name==='Rancor' ? 'If its host leaves, Rancor returns to your hand instead of staying in the graveyard.' : 'When its host leaves the battlefield, the aura goes to your graveyard.' : 'When its host leaves, the equipment stays unattached.');
    } else if (effect.power || effect.toughness) lines.push(`All allied creatures get ${signed(effect.power)}/${signed(effect.toughness)} while this card remains.`);
    else lines.push('Remains on the battlefield. No additional adapted effect is assigned to this card.');
    return lines;
  }
  const lines = [];
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywordLabels(creatureKeywords(card));
    lines.push(`Creature: ${stats.power} power / ${stats.toughness} toughness.${keywords ? ' Keywords: ' + keywords + '.' : ''}`);
    lines.push(creatureKeywords(card).defender ? 'Defender: cannot attack.' : creatureKeywords(card).haste ? 'Haste: can join this turn’s combat phase.' : 'Summoning sickness: may block now, but attacks from your next turn.');
    lines.push('Flying monsters can only be attacked by creatures with Flying or Reach.');
    lines.push('Monsters retaliate if they can block this creature. Flying, reach and menace apply. First/double strike use separate steps.');
    if(/\{T\}: Add/i.test(card.oracle_text||''))lines.push('Tap this creature to add 1 generic mana. Summoning sickness applies.');
    if(/attacks each combat if able/i.test(card.oracle_text||''))lines.push('Must attack at turn end if able. Walls cannot block it.');
  }
  for (const effect of cardEffects(card)) {
    if (effect.kind === 'damage') lines.push(`Deal ${effect.amount} damage to the selected enemy, otherwise the first enemy. Its life falls by the damage dealt.`);
    if (effect.kind === 'destroy') lines.push('Destroy the selected creature. It goes to its graveyard.');
    if (effect.kind === 'exile') lines.push('Exile the selected creature for this encounter. It cannot be recycled. Drop onto an ally to exile that ally instead.');
    if (effect.kind === 'heal') lines.push(`Gain ${effect.amount} life. There is no life cap.`);
    if (effect.kind === 'draw') lines.push(`Draw ${effect.amount} additional card(s). There is no hand-size cap.`);
    if (effect.kind === 'cancel') lines.push('Interrupt the selected monster: it cannot attack during this turn. This is the demo adaptation of a counterspell.');
    if (effect.kind === 'buff') lines.push(`Your selected ally, otherwise your strongest creature, gets ${signed(effect.power)}/${signed(effect.toughness)}${effect.temporary ? ' until end of turn (amber)' : ' for this encounter (green)'}. Requires an allied creature.`);
    if (effect.kind === 'keywords') lines.push(`Your selected ally, otherwise your strongest creature, gains ${effect.keywords.join(', ')} until end of turn.`);
    if (effect.kind === 'token') lines.push('Create a 2/2 token if one of your three creature slots is free.');
  }
  if (!isCreature(card)) lines.push(`${isInstant(card) ? 'Instant: playable in every combat phase. ' : ''}Goes to your graveyard after casting.`);
  return lines;
}

function effectSummary(card) { return effectDescriptions(card).join(' '); }
function cardFace(card) {
  return card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" draggable="false" loading="lazy" />`
    : `<span class="printed-card"><strong>${escapeHtml(card.name)}</strong><small>${Math.ceil(card.cmc || 0)} Mana · ${escapeHtml(card.type_line)}</small><span class="printed-sigil">✦</span><span>${escapeHtml(effectSummary(card))}</span>${isCreature(card) ? `<b>${parseStats(card).power}/${parseStats(card).toughness}</b>` : ''}</span>`;
}

function draftAbilitySummary(card) {
  const lines = effectDescriptions(card).filter(line => !/^(Creature:|Summoning sickness:|Haste:|Defender:|Monsters retaliate|Stays on the battlefield|Aura:|Equipment:|When its host|If its host|Goes to your graveyard)/.test(line));
  const summary = lines.join(' ');
  return summary.length > 110 ? `${summary.slice(0, 107).trimEnd()}…` : summary;
}
function cardFactsMarkup(card) {
  const keywords = displayKeywords(card).join(', ') || 'None';
  const stats = isCreature(card) ? parseStats(card) : null;
  const ability = draftAbilitySummary(card);
  return `<span class="draft-card-summary"><span class="draft-card-type">${escapeHtml(card.type_line || 'Unknown type')}</span><span><b>${Math.ceil(card.cmc || 0)} mana</b> · <span aria-label="Power and toughness">${isCreature(card)?combatStats(stats.power,stats.toughness):'—'}</span></span><span class="draft-card-keywords"><b>Keywords:</b> ${escapeHtml(keywords)}</span>${ability ? `<span class="draft-card-ability"><b>In game:</b> ${escapeHtml(ability)}</span>` : ''}</span>`;
}
function cardImageMarkup(card, isNew = false) {
  return `<span class="card-image-wrap">${cardFace(card)}${isNew ? '<span class="new-card-badge" aria-label="New card discovery">NEW</span>' : ''}</span>`;
}
function statBadge(kind, value) {
  const icons = {
    power: '<path d="m5 19 3-3m-4-2 6 6m-2-8 9-9 4-1-1 4-9 9z"/>',
    toughness: '<path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6z"/><path d="M12 7v9"/>',
    life: '<path d="M12 20 4 12C-1 6 7 1 12 7c5-6 13-1 8 5z"/>'
  };
  const label = kind === 'power' ? 'Power' : kind === 'toughness' ? 'Toughness' : 'Life';
  return `<span class="stat-badge stat-${kind}" title="${label}" aria-label="${label}: ${escapeHtml(value)}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${icons[kind]}</svg><b>${escapeHtml(value)}</b></span>`;
}
function combatStats(power, toughness) { return `<span class="combat-stats">${statBadge('power',power)}${statBadge('toughness',toughness)}</span>`; }
function makeCardMarkup(card, packIndex, cardIndex, selected, isNew = false) {
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" data-preview-owner="draft" style="--card-index:${cardIndex}" aria-pressed="${selected}">${cardImageMarkup(card, isNew)}<span class="draft-card-name">${escapeHtml(card.name)}</span>${cardFactsMarkup(card)}</button>`;
}

function selectedDraftCards() {
  const requiredPacks = state.draftKind === 'starter' ? Array.from({ length: STARTER_BOOSTER_COUNT }, (_, index) => index) : [0];
  if (state.packs.length !== requiredPacks.length || state.selection.size !== requiredPacks.length) return null;
  const cards = requiredPacks.map((packIndex) => {
    const cardIndex = state.selection.get(packIndex);
    return Number.isInteger(cardIndex) ? state.packs[packIndex]?.[cardIndex] : null;
  });
  return cards.every(Boolean) ? cards : null;
}

function renderDraft() {
  if (state.boosterSealed) cancelBoosterTravel();
  const starter = state.draftKind === 'starter';
  const packIndex = state.activePack || 0;
  const chosen = state.selection.has(packIndex);
  const last = !starter || packIndex === STARTER_BOOSTER_COUNT - 1;
  const pack = state.packs[packIndex];
  const packType=state.boosterInterruption?.packType || (state.boosterInterruption?.kind==='tutor'?'tutor':'standard');
  $('#draft-screen').dataset.packType=packType;
  const newCards = state.boosterSealed ? new Set() : discoveryView(pack);
  if (!state.boosterSealed && !boosterTravel) recordSeenCards(pack);
  $('#draft-step').textContent = starter ? `PACK ${packIndex + 1} OF ${STARTER_BOOSTER_COUNT}` : 'REWARD';
  $('#draft-title').textContent = state.boosterSealed ? 'Your next booster' : 'Which card joins your journey?';
  $('#draft-instruction').textContent = state.boosterSealed ? 'Seven cards. One choice.' : `Choose one card · ${COPIES_PER_DRAFT_PICK} copies for your deck.`;
  $('#pack-number').textContent = `${packIndex + 1} / ${starter ? STARTER_BOOSTER_COUNT : 1}`;
  $('#deck-count').textContent = String(state.deck.length + state.selection.size * COPIES_PER_DRAFT_PICK);
  $('#draft-grid').innerHTML = state.boosterSealed
    ? `<div class="pack-stage"><div class="pack-particles" aria-hidden="true">✦ · ✧ · ✦</div><button class="sealed-pack" data-pack-type="${packType}" data-open-pack="true" aria-label="Booster ${packIndex + 1} open"><span class="pack-shine-window" aria-hidden="true"><span class="pack-foil"></span></span><span class="pack-seal pack-seal-top" aria-hidden="true"></span><span class="pack-seal pack-seal-bottom" aria-hidden="true"></span><span class="pack-logo">BOOSTER<br><b>TUTOR</b></span><span class="pack-emblem">✦</span><span class="pack-caption">${state.boosterInterruption?.packName ? escapeHtml(state.boosterInterruption.packName.toUpperCase()) : 'AETHER EXPEDITION'}</span><span class="pack-card-count">7 CARDS</span></button><p>Booster ${packIndex + 1} of ${starter ? STARTER_BOOSTER_COUNT : 1} · click to open</p></div>`
    : `<div class="reveal-sparks" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--spark-angle:${index * 20}deg;--spark-distance:${110 + index % 4 * 60}px"></i>`).join('')}</div><section class="booster-pack"><header><span>BOOSTER ${packIndex + 1}</span><small>${chosen ? '1 CARD SELECTED' : 'CHOOSE 1 OF 7'}</small></header><div class="booster-cards">${pack.map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, state.selection.get(packIndex) === cardIndex, newCards.has(cardDiscoveryKey(card)))).join('')}</div></section>`;
  $('#selection-status').textContent = state.boosterSealed ? 'One pack at a time.' : chosen ? 'Your card is selected.' : 'Choose a card to continue.';
  $('#pack-reroll').disabled = state.boosterSealed || Boolean(state.rerolledPacks?.has(packIndex));
  $('#pack-reroll').textContent = state.rerolledPacks?.has(packIndex) ? '↻ Reroll used' : '↻ Reroll pack · 1×';
  $('#draft-confirm').disabled = state.boosterSealed || !chosen;
  $('#draft-confirm').textContent = last ? starter ? 'BUILD DECK →' : 'TAKE CARD →' : 'NEXT PACK →';
  updatePhaseDisplay();
}

$('#draft-grid').addEventListener('click', (event) => {
  if (event.target.closest('[data-open-pack]')) {
    openCurrentBooster();
    return;
  }
  const button = event.target.closest('.draft-option');
  if (!button || (boosterTravel && !boosterTravel.revealed) || state.boosterInterruption?.kind==='shop') return;
  const packIndex = Number(button.dataset.packIndex);
  const cardIndex = Number(button.dataset.cardIndex);
  if (!Number.isInteger(packIndex) || !Number.isInteger(cardIndex) || !state.packs[packIndex]?.[cardIndex]) return;
  state.selection.set(packIndex, cardIndex);
  // Keep the clicked DOM node stable; repeated clicks never undo the pick.
  if (!boosterTravel) {clearTimeout(state.openingTimer);$('#draft-screen').classList.remove('opening');}
  syncDraftSelection();
  playSfx('select');
});

function syncDraftSelection(){
 const index=state.activePack||0, chosen=state.selection.get(index);
 document.querySelectorAll('.draft-option').forEach(button=>{const picked=Number(button.dataset.packIndex)===index&&Number(button.dataset.cardIndex)===chosen;button.classList.toggle('selected',picked);button.setAttribute('aria-pressed',String(picked));});
 const heading=document.querySelector('.booster-pack header small');if(heading)heading.textContent=state.boosterInterruption?.kind==='shop'?'ALL 7 CARDS':Number.isInteger(chosen)?'1 CARD SELECTED':'CHOOSE 1 OF 7';
 $('#deck-count').textContent=String(state.boosterInterruption?state.deck.length:state.deck.length+state.selection.size*COPIES_PER_DRAFT_PICK+(state.draftKind==='starter'?STARTING_MANA_CARDS+1:0));
 $('#draft-confirm').disabled=state.boosterSealed||Boolean(boosterTravel)||!Number.isInteger(chosen);
 $('#selection-status').textContent=Number.isInteger(chosen)?'Selected · confirm to continue.':'Choose one card.';
 if(typeof syncBoosterConfirm27==='function')syncBoosterConfirm27();
}

$('#draft-confirm').addEventListener('click', confirmDraft);

$('#enemy-board').addEventListener('click', (event) => {
  const button = event.target.closest('[data-enemy-attacker]');
  const battle = state.battle;
  if (!button || !battle) return;
  if (battle.phase === 'main') { battle.selectedEnemyTargetId = button.dataset.enemyAttacker; renderBattle(); return; }
  if (battle.phase !== 'blocks') return;
  const attackerId = button.dataset.enemyAttacker;
  const attacker = battle.enemyCreatures.find((creature) => creature.id === attackerId);
  if (!attacker || !creatureCanAttack(attacker, battle.turn)) return;
  battle.selectedEnemyAttackerId = battle.selectedEnemyAttackerId === attackerId ? null : attackerId;
  renderBattle();
});

$('#creature-row').addEventListener('click', (event) => {
  const withdrawButton = event.target.closest('[data-unit-withdraw]');
  if (withdrawButton) return withdrawAttack(withdrawButton.dataset.unitWithdraw);
  const attackButton = event.target.closest('[data-unit-attack]');
  if (attackButton) return queueCreatureAttack(attackButton.dataset.unitAttack);
  const button = event.target.closest('[data-creature-id]');
  const battle = state.battle;
  if (!button || !battle || Date.now() < (state.suppressClickUntil || 0)) return;
  const creature = battle.creatures.find((item) => item.id === button.dataset.creatureId);
  if (!creature) return;
  if (battle.pendingAttachment) return selectAttachmentTarget(creature.id);
  if (battle.phase === 'blocks') {
    if (battle.enemyCounterWindow) return showActionError('Finish the spell response before assigning blockers.');
    if (creature.tapped) return showActionError('Tapped creatures cannot block.');
    if (!battle.selectedEnemyAttackerId) return showActionError('Choose an attacker on the right first.');
    return assignBlocker(battle.selectedEnemyAttackerId, creature.id);
  }
  if (battle.phase !== 'main') return;
  if (battle.enemyCounterWindow) return showActionError('Finish the spell response before queuing attacks.');
  if (!eligibleAttacker(creature, battle)) return showActionError(hasCreatureKeyword(creature,'defender') ? 'Defender creatures cannot attack.' : creature.tapped ? 'Tapped creatures cannot attack.' : creature.attackedThisTurn ? 'This creature already attacked.' : 'Summoning sickness: this creature cannot attack yet.');
  if (/attacks each combat if able/i.test(creature.card.oracle_text||'')) return showActionError('This creature must attack if able. Choose its target or use Queue attack.');
  if (creature.willAttack) withdrawAttack(creature.id);
  else queueCreatureAttack(creature.id);
});


function confirmDraft() {
  if (boosterTravel) return;
  const starter = state.draftKind === 'starter';
  if (starter && (state.activePack || 0) < STARTER_BOOSTER_COUNT - 1) {
    if (!state.selection.has(state.activePack || 0)) return;
    state.activePack = (state.activePack || 0) + 1;
    state.boosterSealed = true;
    hideCardPreview();
    renderDraft();
    return;
  }
  const selected = selectedDraftCards();
  if (!selected) {
    showActionError(starter ? `Choose exactly one card from each of the ${STARTER_BOOSTER_COUNT} boosters.` : 'Choose a card from the booster first.');
    return;
  }
  for (const card of selected) for (let i = 0; i < COPIES_PER_DRAFT_PICK; i += 1) state.deck.push(typeof physicalRunCopy60 === 'function' ? physicalRunCopy60(card) : card);
  if (starter) state.deck.push(...generateStarterManaCards(STARTING_MANA_CARDS));
  state.selection.clear();
  if (starter) showJourney(); else showShop();
}

function beginBattle(node) {
  state.node = node;
  if (state.endless && typeof ensureEndlessStages59 === 'function') ensureEndlessStages59(node);
  const enemy = ENCOUNTERS[state.endless ? (node - 1) % ENCOUNTERS.length : node - 1];
  const stage = state.stageLocations[node - 1] || LAND_STAGES[(node - 1) % LAND_STAGES.length];
  const waves = typeof createEncounterWaves45 === 'function' ? createEncounterWaves45(enemy) : [createEnemyTeam(enemy)];
  if (state.endless && typeof scaleEndlessWaves59 === 'function') scaleEndlessWaves59(waves, node);
  const enemyCreatures = waves[0];
  const shuffledDeck = shuffle(state.deck);
  const startingManaCards = shuffledDeck.filter(card => card.runMana).slice(0, STARTING_MANA_IN_PLAY);
  const startingManaIds = new Set(startingManaCards.map(card => card.instanceId));
  state.battle = {
    enemy: state.endless ? { ...enemy, rank: `ENDLESS ${node - ENCOUNTERS.length} · ${enemy.rank}` } : enemy,
    stage,
    enemyArt: enemyCreatures[0]?.card.art || '',
    bossName: waves.flat().find(enemy=>enemy.tier==='boss')?.card.name || null,
    waves,
    waveIndex: 0,
    enemyCreatures,
    mana: STARTING_MANA_IN_PLAY,
    maxMana: STARTING_MANA_IN_PLAY,
    floatingMana: 0,
    lands: startingManaCards.map(card => ({ id: `mana-${state.nextPermanentId++}`, card, tapped: false })),
    landAvailable: true,
    mulliganAvailable: true,
    openingHandSize: HAND_SIZE,
    turn: 1,
    phase: 'main',
    deck: shuffledDeck.filter(card => !startingManaIds.has(card.instanceId)),
    graveyard: [],
    enemyGraveyard: [],
    exile: [],
    enemyExile: [],
    selectedPlayerAttackerId: null,
    hand: [],
    creatures: [],
    permanents: [],
    pendingAttachment: null,
    selectedEnemyAttackerId: null,
    blockAssignments: new Map(),
    turnEffects: [],
    log: []
  };
  if (typeof deployCampTokens === 'function') deployCampTokens(state.battle);
  drawToHand(state.battle.openingHandSize);
  if (state.battle.phase === 'complete') return;
  syncMana(state.battle);
  addLog(`An encounter in ${stage.name}: ${enemyCreatures.length} creatures${waves.length>1?` · Wave 1 / ${waves.length}`:''}. You begin with ${STARTING_MANA_IN_PLAY} mana in play.`);
  renderBattle();
  showScreen('combat-screen');
  playSfx('turn');
}

function generateStarterManaCards(count) {
  const pool = state.landPool.length ? state.landPool : FALLBACK_LANDS;
  return Array.from({ length: count }, () => {
    const card = pool[Math.floor(Math.random() * pool.length)];
    return { ...card, runMana: true, instanceId: `run-mana-${state.nextPermanentId++}` };
  });
}

function addLog(message) {
  if (!state.battle) return;
  state.battle.log.unshift(message);
  state.battle.log = state.battle.log.slice(0, 4);
}

function drawToHand(maxHand) {
  const battle = state.battle;
  if (!battle || battle.phase === 'complete') return;
  while (battle.hand.length < maxHand) {
    if (!battle.deck.length) {
      addLog('You tried to draw from an empty library.');
      endRun(false, 'empty-library');
      return;
    }
    const drawn = battle.deck.pop();
    battle.hand.push(drawn);
    if (typeof queueDrawSound === 'function') queueDrawSound(battle);
    if (typeof queueHandDraw === 'function') queueHandDraw(drawn, battle.hand.length - 1, battle);
  }
}

function drawOneCard() {
  const battle = state.battle;
  if (!battle || battle.phase === 'complete') return;
  drawToHand(battle.hand.length + 1);
}

function freeMulligan() {
  const battle = state.battle;
  if (!battle || !battle.mulliganAvailable || battle.turn !== 1 || battle.phase !== 'main') return;
  battle.deck = shuffle([...battle.deck, ...battle.hand]);
  battle.hand = [];
  battle.pendingAttachment = null;
  battle.mulliganAvailable = false;
  drawToHand(battle.openingHandSize || HAND_SIZE);
  if (battle.phase === 'complete') return;
  addLog(`Free mulligan: Your opening hand was shuffled back. Draw ${battle.openingHandSize || HAND_SIZE} cards.`);
  renderBattle();
  playSfx('shuffle');
}

function syncMana(battle = state.battle) {
  if (!battle) return;
  battle.floatingMana ||= 0;
  battle.mana = battle.lands.filter(land => !land.tapped).length + battle.floatingMana;
  battle.maxMana = battle.lands.length;
}

function addFloatingMana58(amount, battle = state.battle) {
  if (!battle) return;
  battle.floatingMana = (battle.floatingMana || 0) + amount;
  syncMana(battle);
}

function payMana(amount, battle = state.battle) {
  const cost = Math.max(0, Math.ceil(amount || 0));
  if (!battle) return false;
  syncMana(battle);
  if (battle.mana < cost) return false;
  let remaining = cost;
  const floating = Math.min(remaining, battle.floatingMana);
  battle.floatingMana -= floating;
  remaining -= floating;
  const lands = battle.lands.filter(land => !land.tapped).slice(0, remaining);
  if (lands.length < remaining) return false;
  lands.forEach(land => { land.tapped = true; });
  syncMana(battle);
  return true;
}

function paymentPlan(card, battle = state.battle) {
  if (!battle) return null;
  if (isLand(card)) return battle.phase === 'main' && battle.landAvailable ? [] : null;
  syncMana(battle);
  return battle.mana >= Math.ceil(card.cmc || 0) ? [] : null;
}

function renderManaLands() {
  const battle = state.battle;
  if (!battle) return;
  const lands = battle.lands.map(land => `<button type="button" class="mana-land${land.tapped ? ' tapped' : ''}" data-preview-owner="mana" data-preview-id="${escapeHtml(land.id)}" aria-label="${escapeHtml(land.card.name)}, ${land.tapped ? 'tapped' : 'untapped'} mana card">${cardFace(land.card)}</button>`).join('');
  $('#mana-land-row').innerHTML = `${lands}<span class="mana-land-meta"><b id="land-count">${battle.lands.length}</b><small id="land-status">${battle.landAvailable ? 'Land drop ready' : 'Played this turn'}</small></span>`;
}

function defaultTarget(card) {
  const text = (card.oracle_text || '').toLowerCase();
  return isLand(card) || isCreature(card) || /you gain|draw |gets? \+|target creature|lifelink/i.test(text) ? 'player' : 'enemy';
}

function creatureCanAttack(creature, turn) {
  if (hasCreatureKeyword(creature, 'defender')) return false;
  if (creature.owner === 'enemy' && creature.pattern) {
    if (creature.attackCancelledTurn === turn) return false;
    const sick = Boolean(creature.summoningSick ?? isCreature(creature.card)) && turn <= creature.summonedTurn && !hasCreatureKeyword(creature, 'haste');
    return !sick && enemyIntent(creature, turn).kind === 'attack';
  }
  const cardHasSickness = isCreature(creature.card);
  const sick = creature.summoningSick ?? cardHasSickness;
  return !sick || turn > creature.summonedTurn || hasCreatureKeyword(creature, 'haste');
}

function assignedBlockerName(battle, attackerId) {
  return blockerIds(battle, attackerId).map(id => battle.creatures.find(creature => creature.id === id)?.card.name).filter(Boolean).join(' + ');
}

function renderEnemyBoard() {
  const battle = state.battle;
  $('#enemy-board').innerHTML = `<div class="monster-rank">${battle.enemyCreatures.map(enemy => {
    const rawIntent = enemyIntent(enemy);
    const recovering = rawIntent.kind === 'attack' && isSummoningSick(enemy, battle.turn);
    const intent = recovering && rawIntent.kind === 'attack' ? { ...rawIntent, label: 'Summoning sick · no attack', icon: '⌛', kind: 'rest' } : rawIntent;
    const selected = battle.phase === 'blocks' ? battle.selectedEnemyAttackerId === enemy.id : battle.selectedEnemyTargetId === enemy.id;
    const blocker = assignedBlockerName(battle, enemy.id);
    const keywords = creatureKeywordLabels(enemy);
    const keywordMarkup = typeof enemyKeywordBadges47 === 'function' ? enemyKeywordBadges47(enemy) : escapeHtml(keywords || 'No keywords');
    const healthPercent = Math.max(0, Math.min(100, enemy.health / enemy.maxHealth * 100));
    return `<button type="button" class="monster monster-${enemy.kind || 'sprout'}${selected ? ' selected' : ''}${legalBlockers(battle,enemy).length ? ' is-blocked' : ''}" data-enemy-attacker="${escapeHtml(enemy.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(enemy.card.name)}, ${enemy.health} of ${enemy.maxHealth} life, ${escapeHtml(intent.label)}, ${escapeHtml(keywords || 'No keywords')}"><span class="monster-intent intent-${intent.kind}"><b>${intent.icon}</b> ${escapeHtml(intent.label)}</span><span class="monster-figure">${walkerPortrait(enemy.kind || 'sprout')}</span><strong>${escapeHtml(enemy.card.name)}</strong><span class="monster-life" aria-label="${enemy.health} of ${enemy.maxHealth} life">♥ <b>${enemy.health}</b><span class="monster-bounty" title="Bounty on defeat">◈ ${enemy.bounty ?? 8}</span></span><span class="monster-health-track" role="meter" aria-label="${escapeHtml(enemy.card.name)} life" aria-valuemin="0" aria-valuemax="${enemy.maxHealth}" aria-valuenow="${enemy.health}"><i style="width:${healthPercent}%"></i></span><span class="monster-keywords">${keywordMarkup}</span><small>${blocker ? (legalBlockers(battle,enemy).length ? 'Blocked by ' : 'Needs two blockers · ') + escapeHtml(blocker) : selected ? 'Selected target' : recovering ? 'Summoning sick' : ''}</small></button>`;
  }).join('')}</div>`;
}

function renderGraveyard() {
  const graveyard = state.battle?.graveyard || [];
  $('#graveyard-count').textContent = String(graveyard.length);
  $('#graveyard-empty').hidden = graveyard.length > 0;
  const markup = (card, index) => `<button type="button" class="graveyard-card" data-preview-owner="graveyard" data-preview-index="${index}" aria-label="${escapeHtml(card.name)} in your graveyard">${cardFace(card)}</button>`;
  $('#graveyard-grid').innerHTML = graveyard.map(markup).reverse().join('');
  $('#graveyard-pile').innerHTML = graveyard.length ? markup(graveyard[graveyard.length - 1], graveyard.length - 1) : '<span class="empty-graveyard">✧<small>No cards yet</small></span>';
  $('#graveyard-zone-count').textContent = String(graveyard.length);
}
function previewCardFor(element) {
  const owner = element.dataset.previewOwner;
  if (owner === 'shop') return state.shop?.offers[Number(element.dataset.offerIndex)]?.card || null;
  if (owner === 'collection') return state.collectionCards?.[Number(element.dataset.collectionIndex)] || null;
  if (owner === 'draft') return state.packs[Number(element.dataset.packIndex)]?.[Number(element.dataset.cardIndex)] || null;
  const battle = state.battle;
  if (!battle) return null;
  if (owner === 'hand') return battle.hand[Number(element.dataset.handIndex)] || null;
  if (owner === 'mana') return battle.lands.find(land => land.id === element.dataset.previewId)?.card || null;
  if (owner === 'player') return battle.creatures.find(creature => creature.id === element.dataset.previewId)?.card || null;
  if (owner === 'enemy') return battle.enemyCreatures.find(creature => creature.id === element.dataset.previewId)?.card || null;
  if (owner === 'permanent') return battle.permanents.find(permanent => permanent.id === element.dataset.previewId)?.card || null;
  if (owner === 'graveyard') return battle.graveyard[Number(element.dataset.previewIndex)] || null;
  return null;
}
let previewAnchor = null;
function positionCardPreview() {
  if (!previewAnchor?.isConnected) return;
  const preview = $('#card-preview');
  if (preview.hidden) return;
  const rect = previewAnchor.getBoundingClientRect();
  const width = preview.offsetWidth;
  const spaceAbove = Math.max(0, rect.top - 26);
  const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 26);
  const useAbove = spaceAbove >= Math.min(preview.scrollHeight || preview.offsetHeight, 220) || spaceAbove >= spaceBelow;
  preview.style.maxHeight = `${Math.max(120, useAbove ? spaceAbove : spaceBelow)}px`;
  const height = preview.offsetHeight;
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
  const above = rect.top - height - 14;
  const top = useAbove ? Math.max(12, above) : Math.max(12, Math.min(window.innerHeight - height - 12, rect.bottom + 14));
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
}
function showCardPreview(card, element) {
  if (!card || !element) return hideCardPreview();
  if (element.dataset.previewOwner === 'draft' && $('#draft-screen').classList.contains('opening') && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return hideCardPreview();
  if (['player', 'permanent'].includes(element.dataset.previewOwner) && !document.documentElement.classList.contains('portrait-combat')) { inspectBattlefieldCard(card, element); hideCardPreview(); return; }
  const preview = $('#card-preview');
  preview.dataset.mode = element.dataset.previewOwner;
  (element.closest('dialog') || document.body).append(preview);
  if (previewAnchor && previewAnchor !== element) previewAnchor.removeAttribute('aria-describedby');
  previewAnchor = element;
  element.setAttribute('aria-describedby', 'card-preview');
  const battle = state.battle;
  const creature = element.dataset.previewOwner === 'enemy' ? battle?.enemyCreatures.find(item => item.id === element.dataset.previewId) : element.dataset.previewOwner === 'player' ? battle?.creatures.find(item => item.id === element.dataset.previewId) : null;
  const permanent = element.dataset.previewOwner === 'permanent' ? battle?.permanents.find(item => item.id === element.dataset.previewId) : null;
  const attached = permanent?.attachedTo ? battle.creatures.find(item => item.id === permanent.attachedTo)?.card.name : null;
  const cost = Math.ceil(card.cmc || 0);
  const lines = element.dataset.previewOwner === 'enemy'
    ? [`Enemy: ${creature.power} damage · ${creature.health} life.`, `Attack ${creatureCanAttack(creature, battle.turn) ? 'this turn' : 'from next turn'}.`, creatureKeywordLabels(creature) || 'No special combat keywords.']
    : effectDescriptions(card);
  if (creature?.owner === 'player') lines.unshift(`Current: ${creature.power}/${creature.toughness} · ${creature.damage || 0} Damage · ${creature.tapped ? 'tapped; cannot block' : 'may block'}.`);
  if (permanent) lines.push(attached ? `Attached to: ${attached}.` : isAttachment(card) ? 'Not attached.' : 'Active on the battlefield.');
  if (element.dataset.previewOwner === 'hand') lines.push(isLand(card) ? battle.landAvailable && battle.phase === 'main' ? 'Play this mana card during your main phase. It enters untapped and adds one generic mana.' : 'You already played a mana card this turn, or it is not your main phase.' : !canCastNow(card, battle) ? battle.enemyCounterWindow ? 'A spell is pending. Cast an instant or continue to resolve it.' : (typeof SPELL_RULES !== 'undefined' && SPELL_RULES[card.name]?.target?.startsWith('opposing-') ? 'Needs a legal pending enemy spell. Wait for its response window.' : 'Only instants can be cast outside the main phase.') : battle.mana < cost ? `Need ${cost - battle.mana} more mana.` : isCreature(card) && battle.creatures.length >= 3 && !(typeof replacesLegend58 === 'function' && replacesLegend58(card,battle)) ? 'All three creature slots are occupied.' : isAura(card) && !battle.creatures.length ? 'Requires an allied creature.' : 'Click or drag to cast.');
  const keywordInfo = { trample:'Trample: excess damage gets through blockers; in your duels it reaches the next monster.', menace:'Menace: needs at least two blockers; a lone monster cannot retaliate against it.', defender:'Defender: cannot attack.', flying:'Flying: can attack flying monsters; only flying or reach can block it.', reach:'Reach: can attack flying monsters and block flying attackers.', lifelink:'Lifelink: combat damage restores life.', deathtouch:'Deathtouch: any unprevented combat damage is lethal to creatures.', 'first strike':'First strike: deals damage before the normal step.', 'double strike':'Double strike: deals damage in both steps.', haste:'Haste: can join this turn’s combat phase.', vigilance:'Vigilance: attacking does not tap this creature; it may still block.' };
  const activeKeywords = creature ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creature, keyword)) : isCreature(card) ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creatureKeywords(card), keyword)) : [];
  preview.innerHTML = `<div class="bubble-header"><b>${escapeHtml(card.name)}</b><strong>${cost} Mana</strong></div><div class="bubble-type">${escapeHtml(card.type_line)} · generic costs only</div><ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>${activeKeywords.length ? `<div class="bubble-keywords">${activeKeywords.map(keyword => escapeHtml(keywordInfo[keyword])).join('<br>')}</div>` : ''}`;
  if (permanent && !card.campToken && permanentActivationCost(card) !== null) preview.innerHTML += `<button class="quiet-button" data-activate-permanent="${escapeHtml(permanent.id)}" ${canActivatePermanent(permanent, battle) ? '' : 'disabled'}>${escapeHtml(permanentActivationLabel51(permanent))}</button>`;
  preview.hidden = false;
  positionCardPreview();
  requestAnimationFrame(positionCardPreview);
  setTimeout(positionCardPreview, 220);
}
function hideCardPreview() {
  $('#card-preview').hidden = true;
  if (previewAnchor) previewAnchor.removeAttribute('aria-describedby');
  previewAnchor = null;
}

function libraryCardCount49(battle = state.battle) {
  return (battle?.deck.length || 0) + (battle?.scry?.cards.length || 0);
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  syncMana(battle);
  hideCardPreview();
  if (battle.phase === 'main') for (const creature of battle.creatures) { if (creature.attackTargetId && !battle.enemyCreatures.some(enemy => enemy.id === creature.attackTargetId && canAttackEnemy(creature,enemy))) { creature.attackTargetId = null; creature.willAttack = false; } }
  const enemy = battle.enemy;
  $('#node-counter').textContent = state.endless ? `∞ ${state.node - ENCOUNTERS.length}` : String(state.node).padStart(2, '0');
  const stage = battle.stage || LAND_STAGES[(state.node - 1) % LAND_STAGES.length];
  $('.arena-table').style.setProperty('--stage-accent', stage.color);
  const waveCount=battle.waves?.length||1;
  const waveRank=waveCount>1&&battle.waveIndex<waveCount-1?'VANGUARD':enemy.rank;
  const waveLabel=waveCount>1?`${waveRank} · WAVE ${battle.waveIndex+1} / ${waveCount}`:enemy.rank;
  if($('#enemy-rank').textContent!==waveLabel)$('#enemy-rank').textContent=waveLabel;
  $('#enemy-name').textContent = stage.name;
  const enemyCount = battle.enemyCreatures.length;
  $('#enemy-count-label').textContent = `${enemyCount} REMAINING`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)}`;
  const availableMana = battle.lands.filter(land => !land.tapped).length;
  $('#mana-label').textContent = `${availableMana} / ${battle.lands.length}`;
  $('#floating-mana').hidden = !battle.floatingMana;
  $('#floating-mana-count').textContent = `+${battle.floatingMana}`;
  const manaInfo = `Mana cards: ${availableMana} / ${battle.lands.length} · Floating: ${battle.floatingMana} · Total available: ${battle.mana}`;
  $('.mana-display').setAttribute('aria-label', manaInfo);
  $('.mana-display').title = manaInfo;
  $('#floating-mana').title = `${battle.floatingMana} floating generic mana · Total available: ${battle.mana} · Spent first; expires at turn end.`;
  renderManaLands();
  $('#enemy-art-image').src = battle.enemyArt || '';
  $('#enemy-art-image').hidden = !battle.enemyArt;
  $('#enemy-art .enemy-sprite').hidden = Boolean(battle.enemyArt);
  const resolving = ['attack', 'enemy', 'damage'].includes(battle.phase);
  $('#end-turn-button').disabled = (resolving && !battle.priorityCallback) || (battle.phase==='blocks' && hasInvalidMenaceBlock(battle));
  $('#end-turn-button').innerHTML = battle.priorityCallback ? 'CONTINUE <span>→</span>' : battle.phase === 'blocks' ? 'CONFIRM BLOCKS <span>✓</span>' : resolving ? 'RESOLVING COMBAT …' : 'START COMBAT <span>→</span>';
  $('#combat-action-hint').textContent = battle.pendingAttachment ? 'Choose an allied creature. Cancelling is free.' : battle.phase === 'blocks'
    ? 'Choose an attacker, then add blockers. You can drag blockers onto attackers.'
    : 'Play one mana card each turn. Queue attacks, then choose Start combat. Withdraw cancels a queued attack.';
  if (battle.priorityCallback) $('#combat-action-hint').textContent = 'Response window: cast an instant, then Continue.';
  else if (resolving) $('#combat-action-hint').textContent = phaseInfo(battle.phase).description;
  $('#combat-action-hint').classList.toggle('blocking', battle.phase === 'blocks');
  syncCoins();
  $('#turn-label').textContent = `TURN ${battle.turn}`;
  $('#turn-display').textContent = `Turn ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < (state.endless ? (state.node - 1) % ENCOUNTERS.length + 1 : state.node) ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Fight ${index + 1}"></i>`).join('');
  $('#graveyard-count').textContent = String(battle.graveyard.length);
  const remainingCards = libraryCardCount49(battle);
  $('#library-count').textContent = String(remainingCards);
  $('#library-total').textContent = String(state.deck.length);
  $('#library-button').classList.toggle('is-empty', !battle.deck.length);
  $('#library-button').setAttribute('aria-label', `Library, ${remainingCards} cards remaining / ${state.deck.length} cards in your run deck. Inspect sorted contents without revealing draw order.`);
  $('#library-button').title = `${remainingCards} remaining in library / ${state.deck.length} cards in your run deck`;
  $('#deck-button').setAttribute('aria-label', `Inspect your run deck: ${state.deck.length} cards total, ${remainingCards} remaining in library`);
  $('#hand-count').textContent = `${battle.hand.length} CARDS`;
  $('#mulligan-button').disabled = !battle.mulliganAvailable || battle.phase !== 'main';
  $('#mulligan-button').innerHTML = battle.mulliganAvailable ? 'FREE MULLIGAN <span>↻</span>' : 'MULLIGAN USED';
  $('#creature-count').textContent = `${battle.creatures.length} / 3`;
  $('#battle-log').innerHTML = battle.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  renderEnemyBoard();
  renderHand();
  renderCreatures();
  renderGraveyard();
  renderPermanents();
  renderBlocking();
  $('#exile-count').textContent = String((battle.exile?.length || 0) + (battle.enemyExile?.length || 0));
  $('#deck-button').disabled = resolving && !battle.priorityCallback;
  $('#library-button').disabled = resolving && !battle.priorityCallback;
  $('#exile-button').disabled = resolving && !battle.priorityCallback;
  if (state.inspectedId) {
    const inspected = battle.creatures.find(item => item.id === state.inspectedId) || battle.permanents.find(item => item.id === state.inspectedId);
    if (inspected) inspectBattlefieldCard(inspected.card, { dataset: { previewId: inspected.id } });
    else { state.inspectedId = null; $('#inspector-content').innerHTML = '<div class="inspector-empty">◈<p>Hover a battlefield card to inspect it.</p></div>'; }
  }
  renderDropZones();
  updatePhaseDisplay();
  if (typeof renderEnemySpells38 === 'function') renderEnemySpells38();
  if (typeof renderTokenAction47 === 'function') renderTokenAction47();
  if (typeof syncDiceWindow50 === 'function') syncDiceWindow50();
  requestAnimationFrame(drawCombatArrows);
}

function renderHand() {
  const battle = state.battle;
  const center = (battle.hand.length - 1) / 2;
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const position = index - center;
    const canPay = Boolean(paymentPlan(card));
    const selected = battle.pendingAttachment?.handIndex === index;
    return `<button type="button" class="hand-card${!canCastNow(card, battle) ? ' timing-unavailable' : ''}${(isInstant(card) || hasFlash(card)) && (battle.phase !== 'main' || battle.enemyCounterWindow) && canCastNow(card,battle) ? ' instant-response' : ''}${!canPay ? ' insufficient-mana' : ''}${selected ? ' targeting-card' : ''}" style="--fan-angle:${position * Math.min(4, 16 / Math.max(1, battle.hand.length - 1))}deg;--fan-lift:${Math.pow(position / Math.max(1, center), 2) * 12}px;--fan-index:${index}" data-hand-index="${index}" data-preview-owner="hand" draggable="${canCastNow(card, battle)}" aria-label="${escapeHtml(card.name)}, ${Math.ceil(card.cmc || 0)} Mana" aria-pressed="${selected}">${cardFace(card)}</button>`;
  }).join('');
  fitHand();
  $('#hand-row').querySelectorAll('.hand-card').forEach(button => {
    button.addEventListener('click', () => { if (Date.now() < (state.suppressClickUntil || 0)) return; hideCardPreview(); playCard(Number(button.dataset.handIndex), defaultTarget(battle.hand[Number(button.dataset.handIndex)])); });

  });
}
function fitHand() {
  const row = $('#hand-row');
  const cards = row.querySelectorAll('.hand-card');
  const cardWidth = cards[0]?.offsetWidth || 96;
  const available = Math.max(0, (row.clientWidth || 940) - cardWidth - 64);
  row.style.setProperty('--hand-step', `${Math.min(87, available / Math.max(1, cards.length - 1))}px`);
}
function creatureBonuses(creature, battle = state.battle) {
  const base = parseStats(creature.card);
  const temporary = (battle.turnEffects || []).filter(effect => effect.creatureId === creature.id).reduce((sum, effect) => ({ power: sum.power + (effect.power || 0), toughness: sum.toughness + (effect.toughness || 0) }), { power: 0, toughness: 0 });
  return { permanent: { power: creature.power - base.power - temporary.power, toughness: creature.toughness - base.toughness - temporary.toughness }, temporary };
}
function bonusMarkup(creature) {
  const bonus = creatureBonuses(creature);
  return `<span class="stat-modifiers">${['permanent', 'temporary'].map(kind => bonus[kind].power || bonus[kind].toughness ? `<span class="stat-${kind}" title="${kind === 'permanent' ? 'Persistent: counters, auras and equipment' : 'Until end of turn'}">${signed(bonus[kind].power)}/${signed(bonus[kind].toughness)} ${kind === 'permanent' ? 'perm' : 'EOT'}</span>` : '').join('')}</span>`;
}
function renderCreatures() {
  const battle = state.battle;
  $('#creature-row').innerHTML = battle.creatures.length ? battle.creatures.map(creature => {
    const sick = isSummoningSick(creature, battle.turn);
    const assignment = [...battle.blockAssignments.keys()].find(id => blockerIds(battle, id).includes(creature.id));
    const attacker = battle.enemyCreatures.find(item => item.id === assignment);
    const selected = battle.enemyCreatures.find(item => item.id === battle.selectedEnemyAttackerId);
    const blocking = battle.phase === 'blocks';
    const legal = blocking && !creature.tapped && (!selected || canBlockCreature(creature, selected));
    const target = attackTarget(battle, creature);
    const canAttack = eligibleAttacker(creature, battle) && Boolean(target);
    const mustAttack = /attacks each combat if able/i.test(creature.card.oracle_text || '');
    const canWithdraw = !mustAttack && creature.willAttack && (battle.phase === 'main' || (battle.phase === 'attack' && battle.activeAttackIds?.includes(creature.id)));
    const status = hasCreatureKeyword(creature, 'defender') ? 'Defender · cannot attack' : battle.pendingAttachment ? 'Choose as attachment target' : creature.tapped ? 'Tapped' : blocking ? attacker ? `Blocking ${attacker.card.name}` : legal ? 'Click to add as blocker' : 'Cannot block this attacker' : sick ? 'Summoning sickness · may block' : creature.attackedThisTurn ? hasCreatureKeyword(creature, 'vigilance') ? 'Attacked · vigilance · may block' : 'Already attacked' : creature.willAttack ? `${battle.phase === 'attack' ? 'Attacking' : 'Queued'} → ${target?.card.name || 'choose target'}` : !target ? 'Flying enemies require Flying or Reach' : mustAttack ? 'Must attack if able' : 'Ready · click to queue attack';
    const attachments = battle.permanents.filter(permanent => permanent.attachedTo === creature.id);
    return `<div class="creature-group${sick ? ' is-summoning-sick' : ''}${creature.tapped ? ' is-tapped' : ''}" data-host-id="${escapeHtml(creature.id)}"><div class="unit-attachments" aria-label="Cards attached to ${escapeHtml(creature.card.name)}">${attachments.map(permanent => permanentMarkup(permanent, true)).join('')}</div><button type="button" class="creature-token${legal ? ' can-block' : ''}${assignment ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${creature.willAttack ? ' attack-queued' : ''}${battle.pendingAttachment ? ' attachment-target' : ''}" data-creature-id="${escapeHtml(creature.id)}" data-preview-owner="player" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(assignment) : Boolean(creature.willAttack)}" aria-label="${escapeHtml(creature.card.name)}, ${escapeHtml(status)}" draggable="${(blocking && !creature.tapped) || (battle.phase === 'main' && canAttack)}"><span class="player-card-frame">${cardFace(creature.card)}</span><span class="field-caption"><b>${escapeHtml(creature.card.name)}</b>${combatStats(creature.power,creature.toughness)}${creature.damage?`<span class="damage-mark">${creature.damage} damage</span>`:''}<span class="keyword-strip" title="${escapeHtml(creatureKeywordLabels(creature))}">${escapeHtml(creatureKeywordLabels(creature))}</span>${bonusMarkup(creature)}<small>${escapeHtml(status)}</small></span></button>${attachments.length ? `<span class="attachment-link" aria-label="${attachments.length} attached cards">↔ ${attachments.length}</span>` : ''}<div class="unit-controls${/\{T\}: Add/i.test(creature.card.oracle_text||'')?' has-mana-ability':''}"><select data-unit-target="${creature.id}" aria-label="Attack target for ${escapeHtml(creature.card.name)}" ${battle.phase !== 'main' || !canAttack ? 'disabled' : ''}>${battle.enemyCreatures.map(enemy => `<option value="${enemy.id}" ${target?.id === enemy.id ? 'selected' : ''} ${canAttackEnemy(creature,enemy)?'':'disabled'}>${escapeHtml(enemy.card.name)}${canAttackEnemy(creature,enemy)?'':' · needs Flying or Reach'}</option>`).join('')}</select>${canWithdraw ? `<button data-unit-withdraw="${escapeHtml(creature.id)}" aria-label="Withdraw ${escapeHtml(creature.card.name)} from this attack">Withdraw</button>` : `<button data-unit-attack="${creature.id}" ${battle.phase !== 'main' || !canAttack ? 'disabled' : ''} aria-label="Queue an attack with ${escapeHtml(creature.card.name)}">Queue attack</button>`}${/\{T\}: Add/i.test(creature.card.oracle_text||'')?`<button data-unit-mana="${creature.id}" ${canTapForMana(creature,battle)?'':'disabled'} aria-label="Tap ${escapeHtml(creature.card.name)} for one generic mana">+1 mana</button>`:''}</div></div>`;
  }).join('') : '<div class="empty-board">Play a creature from your hand.<br>You have three creature slots.</div>';
}

function permanentMarkup(permanent, attached = false) {
  const battle = state.battle;
  const target = battle.creatures.find(item => item.id === permanent.attachedTo);
  return `<button type="button" class="permanent-card${permanent.tapped ? ' permanent-tapped' : ''}${attached ? ' attached-permanent' : ''}${battle.pendingAttachment?.permanentId === permanent.id ? ' targeting-card' : ''}" draggable="${/Equipment/.test(permanent.card.type_line) && battle.phase === 'main'}" data-permanent-id="${escapeHtml(permanent.id)}" data-preview-owner="permanent" data-preview-id="${escapeHtml(permanent.id)}" ${permanent.card.campToken ? `data-camp-token-kind="${permanent.card.tokenKind}" aria-haspopup="dialog" title="Click to use this token"` : ''} aria-label="${escapeHtml(permanent.card.name)}${target ? ', attached to ' + escapeHtml(target.card.name) : ''}"><span class="permanent-card-frame">${cardFace(permanent.card)}</span><span class="field-caption"><b>${escapeHtml(permanent.card.name)}</b><small>${target ? '↔ ' + escapeHtml(target.card.name) : permanent.card.campToken ? 'Click to use' : ['Black Lotus','Sol Ring'].includes(permanent.card.name) ? permanentActivationLabel51(permanent) : permanent.card.name==='Jack-in-the-Mox' ? permanent.tapped?'Tapped · untap next turn':'Click · tap · roll a D6' : isAttachment(permanent.card) ? `Equip ${equipCost(permanent.card)} mana` : 'Active enchantment / artifact'}</small></span></button>`;
}
function renderPermanents() {
  const battle = state.battle;
  const loose = battle.permanents.filter(permanent => !permanent.attachedTo);
  const attached = battle.permanents.length - loose.length;
  $('#permanent-count').textContent = `${attached} attached · ${loose.length} free`;
  $('#permanent-row').innerHTML = loose.length ? loose.map(permanent => permanentMarkup(permanent)).join('') : `<p class="empty-permanents">${attached ? 'Attached cards sit beside their hosts.' : 'Unattached permanents live here.'}</p>`;
  $('#attachment-cancel').hidden = !battle.pendingAttachment;
}

function renderBlocking() {
  const battle = state.battle;
  $('#blocking-panel').hidden = battle.phase !== 'blocks';
  $('#combat-screen').classList.toggle('is-blocking', battle.phase === 'blocks');
  if (battle.phase !== 'blocks') return;
  const attackers = battle.enemyCreatures.filter(creature => creatureCanAttack(creature, battle.turn));
  const unblocked = attackers.filter(creature => !legalBlockers(battle, creature).length);
  const damage = attackers.reduce((sum,creature)=>sum+incomingThreat(creature,legalBlockers(battle,creature)),0);
  $('#blocking-summary').textContent = `${attackers.length - unblocked.length}/${attackers.length} attacks blocked · ${damage} maximum direct damage. Block order matters; menace needs two blockers.`;
  $('#blocking-pairs').innerHTML = attackers.map(attacker => {
    const names = blockerIds(battle, attacker.id).map(id => battle.creatures.find(creature => creature.id === id)?.card.name).filter(Boolean);
    return `<button type="button" data-block-attacker="${attacker.id}" class="block-pair${names.length ? ' paired' : ''}${battle.selectedEnemyAttackerId === attacker.id ? ' selected' : ''}" aria-pressed="${battle.selectedEnemyAttackerId === attacker.id}"><b>${escapeHtml(attacker.card.name)}</b><span>${names.length ? names.map((name, index) => `${index + 1}. ${escapeHtml(name)}`).join('<br>') : 'Choose blockers →'}</span></button>`;
  }).join('');
}

$('#player-drop-zone').addEventListener('click', event => {
  const button = event.target.closest('[data-permanent-id]');
  const battle = state.battle;
  if (!button || !battle || Date.now() < (state.suppressClickUntil || 0)) return;
  const permanent = battle.permanents.find(item => item.id === button.dataset.permanentId);
  if (!permanent) return;
  if (typeof openPermanentAction60 === 'function') { openPermanentAction60(permanent.id); return; }
  if (permanent.card.campToken && typeof openTokenAction47 === 'function') { openTokenAction47(permanent.id); return; }
  if (permanent.card.name === 'Black Lotus' && typeof openTokenAction47 === 'function') { openTokenAction47(permanent.id); return; }
  if (['Jack-in-the-Mox','Sol Ring'].includes(permanent.card.name) && canActivatePermanent(permanent, battle)) { activatePermanent(permanent.id); return; }
  if (!/Equipment/.test(permanent.card.type_line)) { inspectBattlefieldCard(permanent.card, {dataset:{previewId:permanent.id}}); return; }
  if (battle.phase !== 'main') return;
  if (!battle.creatures.length) return showActionError('Play a creature first.');
  battle.pendingAttachment = { permanentId: permanent.id };
  renderBattle();
});
$('#attachment-cancel').addEventListener('click', () => { state.battle.pendingAttachment = null; renderBattle(); });
$('#blocking-pairs').addEventListener('click', event => {
  const button = event.target.closest('[data-block-attacker]');
  if (!button || state.battle?.phase !== 'blocks') return;
  state.battle.selectedEnemyAttackerId = button.dataset.blockAttacker;
  renderBattle();
});
$('#auto-block').addEventListener('click', () => {
  const battle = state.battle;
  if (battle?.phase !== 'blocks') return;
  battle.blockAssignments = suggestBlocks(battle);
  battle.selectedEnemyAttackerId = null;
  renderBattle();
});
$('#clear-blocks').addEventListener('click', () => {
  if (state.battle?.phase !== 'blocks') return;
  state.battle.blockAssignments.clear();
  state.battle.selectedEnemyAttackerId = null;
  renderBattle();
});

function renderDropZones() { /* Delegated drag handlers also cover re-rendered cards. */ }
function dragPayloadFor(element) {
  const hand = element.closest('[data-hand-index]');
  const creature = element.closest('[data-creature-id]');
  const permanent = element.closest('[data-permanent-id]');
  if (hand && canCastNow(state.battle.hand[Number(hand.dataset.handIndex)])) return { kind: 'hand', index: Number(hand.dataset.handIndex), cardId: state.battle.hand[Number(hand.dataset.handIndex)]?.id };
  if (creature && state.battle?.phase === 'main' && eligibleAttacker(state.battle.creatures.find(item => item.id === creature.dataset.creatureId), state.battle)) return { kind: 'attacker', id: creature.dataset.creatureId };
  if (creature && state.battle?.phase === 'blocks' && state.battle.creatures.some(item => item.id === creature.dataset.creatureId && !item.tapped)) return { kind: 'blocker', id: creature.dataset.creatureId };
  if (permanent && state.battle?.phase === 'main') {
    const item = state.battle.permanents.find(item => item.id === permanent.dataset.permanentId);
    if (item && /Equipment/.test(item.card.type_line)) return { kind: 'equipment', id: item.id };
  }
  return null;
}
function handleCardDrop(payload, target) {
  const battle = state.battle;
  if (!battle || !payload || !target) return false;
  const enemy = target.closest('[data-enemy-attacker]');
  const host = target.closest('[data-host-id]');
  const ally = target.closest('[data-creature-id]') || (host ? { dataset: { creatureId: host.dataset.hostId } } : null);
  const onPlayer = Boolean(target.closest('#player-drop-zone'));
  const onEnemy = Boolean(target.closest('#enemy-drop-zone'));
  if (payload.kind === 'attacker') {
    const creature = battle.creatures.find(item => item.id === payload.id);
    if (!enemy || battle.phase !== 'main' || !creature || !eligibleAttacker(creature, battle)) return false;
    return queueCreatureAttack(creature.id, enemy.dataset.enemyAttacker);
  }
  if (payload.kind === 'blocker') {
    if (!enemy || battle.phase !== 'blocks') return false;
    assignBlocker(enemy.dataset.enemyAttacker, payload.id);
    return true;
  }
  if (payload.kind === 'equipment') {
    if (!ally || battle.phase !== 'main') return false;
    battle.pendingAttachment = { permanentId: payload.id };
    selectAttachmentTarget(ally.dataset.creatureId);
    return true;
  }
  if (payload.kind !== 'hand') return false;
  const card = battle.hand[payload.index];
  if (!card || !canCastNow(card, battle) || (payload.cardId && card.id !== payload.cardId)) return false;
  if (isLand(card) && !onPlayer) return false;
  if ((isCreature(card) || isPermanent(card)) && !onPlayer) return false;
  if (!onPlayer && !onEnemy) return false;
  if (enemy) battle.selectedEnemyTargetId = enemy.dataset.enemyAttacker;
  const allyId = ally?.dataset.creatureId;
  battle.pendingSpellTarget = allyId ? { side: 'player', id: allyId } : enemy ? { side: 'enemy', id: enemy.dataset.enemyAttacker } : null;
  if (/Equipment/.test(card.type_line) && allyId && battle.mana < Math.ceil(card.cmc || 0) + (equipCost(card) ?? Infinity)) return false;
  const beforeCount = battle.permanents.length;
  playCard(payload.index, onPlayer ? 'player' : 'enemy');
  if (isAura(card) && allyId && battle.pendingAttachment) selectAttachmentTarget(allyId);
  if (/Equipment/.test(card.type_line) && allyId && battle.permanents.length > beforeCount) {
    battle.pendingAttachment = { permanentId: battle.permanents[battle.permanents.length - 1].id };
    selectAttachmentTarget(allyId);
  }
  return true;
}
let pointerDrag = null;
let dragClickGuard = null;
function dropFeedback(payload, target) {
  const battle = state.battle;
  if (!battle || !payload || !target) return false;
  const own = target.closest('#player-drop-zone');
  const enemy = target.closest('[data-enemy-attacker]');
  const ally = target.closest('[data-creature-id], [data-host-id]');
  if (payload.kind === 'attacker') {
    const creature = battle.creatures.find(item => item.id === payload.id);
    const targetEnemy = battle.enemyCreatures.find(item => item.id === enemy?.dataset.enemyAttacker);
    return battle.phase === 'main' && eligibleAttacker(creature, battle) && canAttackEnemy(creature, targetEnemy);
  }
  if (payload.kind === 'blocker') {
    const unit = battle.creatures.find(item => item.id === payload.id && !item.tapped);
    const attacker = battle.enemyCreatures.find(item => item.id === enemy?.dataset.enemyAttacker);
    return battle.phase === 'blocks' && Boolean(unit && attacker && creatureCanAttack(attacker, battle.turn) && canBlockCreature(unit, attacker));
  }
  if (payload.kind === 'equipment') return battle.phase === 'main' && Boolean(own && ally);
  const card = battle.hand[payload.index];
  if (!card || !canCastNow(card, battle) || !paymentPlan(card)) return false;
  if (isLand(card)) return Boolean(own);
  if (isCreature(card)) return Boolean(own) && (battle.creatures.length < 3 || (typeof replacesLegend58 === 'function' && replacesLegend58(card,battle)));
  if (isAura(card)) return Boolean(own && ally);
  if (/Equipment/.test(card.type_line) && ally) return Boolean(own) && battle.mana >= Math.ceil(card.cmc || 0) + (equipCost(card) ?? Infinity);
  if (isPermanent(card)) return Boolean(own);
  return Boolean(own || target.closest('#enemy-drop-zone'));
}
function updateDragFeedback(payload, target) {
  document.querySelectorAll('.drop-ready, .drop-invalid').forEach(zone => zone.classList.remove('drop-ready', 'drop-invalid'));
  const zone = target?.closest('[data-creature-id], [data-enemy-attacker], .drop-zone');
  const allowed = dropFeedback(payload, target);
  if (zone) zone.classList.add(allowed ? 'drop-ready' : 'drop-invalid');
  const ghost = $('#drag-ghost');
  if (ghost) { ghost.classList.toggle('valid-drop', allowed); ghost.classList.toggle('invalid-drop', Boolean(zone) && !allowed); }
}
function finishDrag() {
  if (pointerDrag?.source) {
    dragClickGuard = pointerDrag.source;
    pointerDrag.source.classList.remove('is-grabbed');
    try { pointerDrag.source.releasePointerCapture(pointerDrag.pointerId); } catch {}
  }
  pointerDrag = null;
  state.dragPayload = null;
  state.suppressClickUntil = Date.now() + 300;
  document.body.classList.remove('drag-active');
  document.querySelectorAll('.drop-ready, .drop-invalid, .drop-possible').forEach(zone => zone.classList.remove('drop-ready', 'drop-invalid', 'drop-possible'));
  $('#drag-ghost')?.remove();
}
// Native drag remains a fallback for browser/assistive drag APIs.
document.addEventListener('dragstart', event => {
  if (pointerDrag) { event.preventDefault(); return; }
  const payload = dragPayloadFor(event.target);
  if (!payload) return;
  state.dragPayload = payload;
  hideCardPreview();
  event.dataTransfer.setData('application/x-boostertutor', JSON.stringify(payload));
  event.dataTransfer.setData('text/plain', JSON.stringify(payload));
  event.dataTransfer.effectAllowed = 'move';
  document.body.classList.add('drag-active');
});
document.addEventListener('dragover', event => {
  if (!state.dragPayload) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = dropFeedback(state.dragPayload, event.target) ? 'move' : 'none';
  updateDragFeedback(state.dragPayload, event.target);
});
document.addEventListener('drop', event => {
  if (!state.dragPayload) return;
  event.preventDefault();
  const allowed = dropFeedback(state.dragPayload, event.target);
  if (allowed) handleCardDrop(state.dragPayload, event.target);
  else playSfx('invalid');
  finishDrag();
});
document.addEventListener('dragend', () => { if (!pointerDrag) finishDrag(); });
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('[data-preview-owner], #card-preview')) hideCardPreview();
  if (event.button !== 0 || pointerDrag) return;
  dragClickGuard = null;
  const payload = dragPayloadFor(event.target);
  const source = event.target.closest('button');
  if (!payload || !source) return;
  const face = source.querySelector('.player-card-frame, .permanent-card-frame') || source;
  const box = face.getBoundingClientRect();
  pointerDrag = { payload, source, face, pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: Math.max(0, Math.min(box.width, event.clientX - box.left)), offsetY: Math.max(0, Math.min(box.height, event.clientY - box.top)), width: box.width, height: box.height, active: false };
  source.setPointerCapture(event.pointerId);
});
document.addEventListener('pointermove', event => {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  if (!pointerDrag.active && Math.hypot(event.clientX - pointerDrag.x, event.clientY - pointerDrag.y) < 7) return;
  if (!pointerDrag.active) {
    pointerDrag.active = true;
    state.dragPayload = pointerDrag.payload;
    hideCardPreview();
    pointerDrag.source.style.setProperty('--grabbed-transform', getComputedStyle(pointerDrag.source).transform);
    pointerDrag.source.classList.add('is-grabbed');
    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost'; ghost.className = 'drag-card';
    const image = pointerDrag.face.querySelector('.foil-card-face') || pointerDrag.face.querySelector('img, .printed-card');
    if (image) ghost.append(image.cloneNode(true));
    ghost.style.setProperty('--drag-width', `${pointerDrag.width}px`);
    ghost.style.setProperty('--drag-height', `${pointerDrag.height}px`);
    document.body.append(ghost);
    document.body.classList.add('drag-active');
    document.querySelectorAll('.drop-zone').forEach(zone => { if (dropFeedback(state.dragPayload, zone)) zone.classList.add('drop-possible'); });
    playSfx('grab');
  }
  event.preventDefault();
  const ghost = $('#drag-ghost');
  ghost.style.left = `${event.clientX - pointerDrag.offsetX}px`;
  ghost.style.top = `${event.clientY - pointerDrag.offsetY}px`;
  updateDragFeedback(pointerDrag.payload, document.elementFromPoint(event.clientX, event.clientY));
}, { passive: false });
document.addEventListener('pointerup', event => {
  if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
  if (!pointerDrag.active) { pointerDrag = null; return; }
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const flight = captureCardFlight(pointerDrag, target);
  const accepted = dropFeedback(pointerDrag.payload, target) && handleCardDrop(pointerDrag.payload, target);
  if (!accepted) playSfx('invalid');
  finishDrag();
  animateCardLanding(flight, accepted);
});
document.addEventListener('pointercancel', () => { if (pointerDrag) finishDrag(); });
window.addEventListener('blur', () => { if (pointerDrag) finishDrag(); });

function drawOneExtra() {
  const battle = state.battle;
  drawToHand(battle.hand.length + 1);
}

function damageFirstEnemy(amount, explicitTarget = null) {
  const battle = state.battle;
  const spellTarget = battle?.resolvingSpellTarget?.side === 'enemy' ? battle.enemyCreatures.find(creature => creature.id === battle.resolvingSpellTarget.id) : null;
  const selectedTarget = battle?.enemyCreatures.find(creature => creature.id === battle.selectedEnemyTargetId && creature.health > 0 && !hasCreatureKeyword(creature, 'hexproof'));
  const enemy = explicitTarget || spellTarget || selectedTarget || battle?.enemyCreatures.find(creature => creature.health > 0 && !hasCreatureKeyword(creature, 'hexproof'));
  if (!enemy || amount <= 0) return 0;
  const dealt = Math.min(enemy.health, amount);
  enemy.health = Math.max(0, enemy.health - dealt);
  if (dealt > 0) playSfx('enemy-hit');
  if (enemy.health <= 0) {
    battle.enemyCreatures = battle.enemyCreatures.filter((creature) => creature !== enemy);
    battle.enemyGraveyard.push(enemy.card);
    awardBounty(enemy);
    addLog(`${enemy.card.name} is defeated.`);
  }
  return dealt;
}

function applyOracle(card, creature = false) {
  const battle = state.battle;
  for (const effect of cardEffects(card, creature)) {
    if (effect.kind === 'damage') damageFirstEnemy(effect.amount);
    if (effect.kind === 'cancel') {
      const target = (battle.resolvingSpellTarget?.side === 'enemy' ? battle.enemyCreatures.find(enemy => enemy.id === battle.resolvingSpellTarget.id) : null)
        || battle.enemyCreatures.find(enemy => enemy.id === battle.selectedEnemyTargetId && !hasCreatureKeyword(enemy, 'hexproof'))
        || battle.enemyCreatures.find(enemy => !hasCreatureKeyword(enemy, 'hexproof'));
      if (target) {
        target.attackCancelledTurn = battle.turn;
        addLog(`${target.card.name}'s attack is interrupted this turn.`);
      }
    }
    if (effect.kind === 'exile' || effect.kind === 'destroy') removeSpellTarget(effect.kind);
    if (effect.kind === 'heal') { state.playerHealth += effect.amount; playSfx('heal'); }
    if (effect.kind === 'draw') for (let i = 0; i < effect.amount; i++) { drawOneExtra(); if (battle.phase === 'complete') return; }
    if (effect.kind === 'buff' || effect.kind === 'keywords') {
      const target = (battle.resolvingSpellTarget?.side === 'player' ? battle.creatures.find(creature => creature.id === battle.resolvingSpellTarget.id) : null) || battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
      if (!target) continue;
      if (effect.kind === 'buff') {
        target.power += effect.power;
        target.toughness += effect.toughness;
        if (effect.temporary) battle.turnEffects.push({ creatureId: target.id, power: effect.power, toughness: effect.toughness });
        else { target.counterPower = (target.counterPower || 0) + effect.power; target.counterToughness = (target.counterToughness || 0) + effect.toughness; }
      } else {
        target.temporaryKeywords ||= [];
        for (const keyword of effect.keywords) {
          target.temporaryKeywords.push(keyword);
          battle.turnEffects.push({ creatureId: target.id, keyword });
        }
      }
    }
    if (effect.kind === 'token' && battle.creatures.length < 3) {
      battle.creatures.push({ id: `player-${state.nextPermanentId++}`, owner: 'player', card: { id: 'token', name: 'Aether Token', cmc: 0, type_line: 'Creature — Token', power: '2', toughness: '2', oracle_text: '', image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, summoningSick: true, isToken: true, willAttack: false, tapped: false });
      refreshPermanentEffects(); onCreatureEntered(battle.creatures[battle.creatures.length-1]);
    }
  }
  refreshPermanentEffects();
  battle.creatures = removeDeadCreatures(battle.creatures, 'player');
  addLog(`${card.name}: ${effectSummary(card)}`);
}
function refreshPermanentEffects() {
  const battle = state.battle;
  if (!battle) return;
  for (const creature of battle.creatures) {
    creature.power -= creature.permanentPower || 0;
    creature.toughness -= creature.permanentToughness || 0;
    creature.permanentPower = 0;
    creature.permanentToughness = 0;
    creature.permanentKeywords = [];
    for (const permanent of battle.permanents || []) {
      if (isAttachment(permanent.card) && permanent.attachedTo !== creature.id) continue;
      const effect = permanentEffect(permanent.card);
      creature.permanentPower += effect.power;
      creature.permanentToughness += effect.toughness;
      creature.permanentKeywords.push(...effect.keywords);
    }
    creature.power += creature.permanentPower;
    creature.toughness += creature.permanentToughness;
  }
}
function cleanupAttachments(deadIds) {
  const battle = state.battle;
  for (const [attackerId] of battle.blockAssignments || []) {
    const kept = blockerIds(battle, attackerId).filter(id => !deadIds.has(id));
    if (kept.length) battle.blockAssignments.set(attackerId, kept); else battle.blockAssignments.delete(attackerId);
  }
  battle.permanents = (battle.permanents || []).filter(permanent => {
    if (!deadIds.has(permanent.attachedTo)) return true;
    if (isAura(permanent.card)) {
      if (permanent.card.name === 'Rancor') battle.hand.push(permanent.card); else battle.graveyard.push(permanent.card);
      return false;
    }
    permanent.attachedTo = null;
    return true;
  });
}
function selectAttachmentTarget(creatureId) {
  const battle = state.battle;
  const pending = battle?.pendingAttachment;
  if (battle?.enemyCounterWindow) return showActionError('Equip only when no spell is pending.');
  if (!pending || battle.phase !== 'main') return;
  const creature = battle.creatures.find(item => item.id === creatureId);
  if (!creature) return;
  if (pending.handIndex !== undefined) {
    const card = battle.hand[pending.handIndex];
    if (!card || !isAura(card)) { battle.pendingAttachment = null; renderBattle(); return; }
    if (!paymentPlan(card) || !payMana(card.cmc, battle)) return showActionError('Not enough generic mana.');
    battle.hand.splice(pending.handIndex, 1);
    battle.permanents.push({ id: `permanent-${state.nextPermanentId++}`, card, attachedTo: creatureId });
    battle.mulliganAvailable = false;
  } else {
    const permanent = battle.permanents.find(item => item.id === pending.permanentId);
    if (!permanent) return;
    if (permanent.attachedTo === creatureId) { battle.pendingAttachment = null; renderBattle(); return; }
    const cost = equipCost(permanent.card);
    if (cost === null || battle.mana < cost || !payMana(cost, battle)) return showActionError(`Equipping requires ${cost ?? '?'} generic mana.`);
    battle.mulliganAvailable = false;
    permanent.attachedTo = creatureId;
  }
  battle.pendingAttachment = null;
  refreshPermanentEffects();
  battle.creatures = removeDeadCreatures(battle.creatures, 'player');
  playSfx('attach');
  renderBattle();
}

function playCard(index, targetSide = 'enemy') {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card) return;
  if (!canCastNow(card, battle)) return showActionError(isLand(card) ? 'You may play one mana card during your main phase.' : 'Only instants can be cast outside your main phase.');
  if (isAura(card)) {
    if (!battle.creatures.length) return showActionError('This aura requires an allied creature.');
    if (!paymentPlan(card)) return showActionError('Not enough generic mana.');
    battle.pendingAttachment = { handIndex: index };
    renderBattle();
    return;
  }
  battle.pendingAttachment = null;
  battle.resolvingSpellTarget = battle.pendingSpellTarget || null;
  battle.pendingSpellTarget = null;
  if (isLand(card)) {
    if (!battle.landAvailable || battle.phase !== 'main') return showActionError('You may play one mana card during your main phase.');
    battle.mulliganAvailable = false;
    battle.hand.splice(index, 1);
    battle.lands.push({ id: `mana-${state.nextPermanentId++}`, card, tapped: false });
    battle.maxMana += 1;
    battle.landAvailable = false;
    syncMana(battle);
    addLog(`${card.name} enters untapped and adds one generic mana.`);
    renderBattle();
    playSfx('select');
    return;
  }
  if (isCreature(card) && battle.creatures.length >= 3 && !(typeof replacesLegend58 === 'function' && replacesLegend58(card, battle))) return showActionError('Your creature board is full.');
  if (targetSide === 'enemy' && isCreature(card)) return showActionError('Creatures enter your battlefield. Drag one to the left side.');
  const payment = paymentPlan(card);
  if (!payment) return showActionError('Not enough generic mana for this card.');
  const targetsEnemy = !isPermanent(card) && cardEffects(card, isCreature(card)).some(effect => ['damage', 'cancel', 'destroy', 'exile'].includes(effect.kind));
  if (targetsEnemy) {
    const requestedId = battle.pendingSpellTarget?.side === 'enemy' ? battle.pendingSpellTarget.id : battle.selectedEnemyTargetId;
    const enemyTarget = battle.enemyCreatures.find(enemy => enemy.id === requestedId) || battle.enemyCreatures.find(enemy => !hasCreatureKeyword(enemy, 'hexproof'));
    if (!enemyTarget) return showActionError('Every monster has Hexproof. These effects cannot target them.');
    if (hasCreatureKeyword(enemyTarget, 'hexproof')) return showActionError(`${enemyTarget.card.name} has Hexproof and cannot be targeted by your spells.`);
    battle.resolvingSpellTarget = { side: 'enemy', id: enemyTarget.id };
  }
  battle.mulliganAvailable = false;
  if (!payMana(card.cmc, battle)) return showActionError('Not enough generic mana for this card.');
  battle.hand.splice(index, 1);
  const resolve=()=>resolvePaidCard44(card,battle);
  const countered=()=>{battle.graveyard.push(card);if(!battle.enemyCreatures.length)return winBattle();renderBattle();};
  if(typeof offerEnemyCounter44==='function'&&offerEnemyCounter44(card,battle,resolve,countered))return;
  resolve();
}
function resolvePaidCard44(card,battle=state.battle){
  if(state.battle!==battle||battle.phase==='complete')return;
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywords(card);
    const summoningSick = true;
    battle.creatures.push({
      id: `player-${state.nextPermanentId++}`,
      owner: 'player',
      card,
      power: stats.power,
      toughness: stats.toughness,
      summonedTurn: battle.turn,
      summoningSick,
      ...keywords,
      willAttack: false,
      attackedThisTurn: false,
      attackTargetId: null,
      tapped: false
    });
    addLog(`${card.name} enters as a ${stats.power}/${stats.toughness} creature${summoningSick && !keywords.haste ? ' with summoning sickness' : ''}.`);
    refreshPermanentEffects();
    onCreatureEntered(battle.creatures[battle.creatures.length - 1]);
    applyOracle(card, true);
  } else if (isPermanent(card)) {
    battle.permanents.push({ id: `permanent-${state.nextPermanentId++}`, card, attachedTo: null });
    if (card.name === 'Omen of the Sea') beginScry(2, 1);
    refreshPermanentEffects();
    addLog(`${card.name} stays on the battlefield.`);
  } else {
    battle.graveyard.push(card);
    applyOracle(card, false);
  }
  if (battle.phase === 'complete') return;
  playSfx(isCreature(card) ? 'creature' : isPermanent(card) ? 'attach' : 'cast');
  if (!battle.enemyCreatures.length) return winBattle();
  renderBattle();
}

function chooseEnemyBlocks(attackers, blockers) {
  const pending = [...attackers].sort((a, b) => b.power - a.power);
  const assignments = new Map();
  const orderedBlockers = [...blockers].sort((a, b) => b.power - a.power);
  for (const blocker of orderedBlockers) {
    if (!pending.length) break;
    const legalTargets = pending.filter((attacker) => canBlockCreature(blocker, attacker));
    if (!legalTargets.length) continue;
    const lethalTarget = legalTargets.find((attacker) => hasCreatureKeyword(blocker, 'deathtouch') || attacker.power <= blocker.power);
    const attacker = lethalTarget || legalTargets[legalTargets.length - 1];
    pending.splice(pending.indexOf(attacker), 1);
    assignments.set(attacker.id, blocker);
  }
  return assignments;
}

function removeDeadCreatures(creatures, owner = 'player', clearDamage = false) {
  const battle = state.battle;
  const survivors = [];
  const deadIds = new Set();
  for (const creature of creatures) {
    const dead = owner === 'enemy'
      ? creature.health <= 0
      : creature.toughness <= 0 || (creature.damage || 0) >= creature.toughness || creature.deathtouchDamage;
    if (dead) {
      deadIds.add(creature.id);
      addLog(`${creature.card.name} is destroyed and goes to the ${owner === 'player' ? 'graveyard' : 'enemy graveyard'}.`);
      if (owner === 'player' && !creature.isToken) battle.graveyard.push(creature.card);
      else if (owner === 'enemy') { battle.enemyGraveyard.push(creature.card); awardBounty(creature); }
      continue;
    }
    if (owner === 'player' && clearDamage) {
      creature.damage = 0;
      creature.deathtouchDamage = false;
    }
    survivors.push(creature);
  }
  if (owner === 'player' && deadIds.size) cleanupAttachments(deadIds);
  return survivors;
}

function creatureAlive(creature) {
  if (!creature) return false;
  if (creature.owner === 'enemy') return creature.health > 0;
  return !creature.deathtouchDamage && (creature.damage || 0) < creature.toughness;
}

function dealsInCombatStep(creature, firstStep) {
  const firstStrike = hasCreatureKeyword(creature, 'first strike') || hasCreatureKeyword(creature, 'double strike');
  return firstStep ? firstStrike : !firstStrike || hasCreatureKeyword(creature, 'double strike');
}

function gainLifelinkLife(creature, controller, amount, battle) {
  if (amount <= 0 || !hasCreatureKeyword(creature, 'lifelink')) return;
  if (controller === 'player') state.playerHealth += amount;
  else if (creature.health > 0) creature.health += amount;
}

function dealCreatureDamage(source, target, controller, battle, amount = Math.max(0, source.power || 0), lifelinkEvents = null) {
  if (amount <= 0) return;
  let dealt = amount;
  if (target.owner === 'enemy') {
    const infect = typeof combatPoison60 === 'function' && combatPoison60(source, target, dealt, battle);
    if (!infect) target.health = Math.max(0, target.health - dealt);
    if (dealt > 0 && hasCreatureKeyword(source, 'deathtouch')) target.health = 0;
  } else {
    target.damage = (target.damage || 0) + amount;
    if (hasCreatureKeyword(source, 'deathtouch')) target.deathtouchDamage = true;
  }
  if (lifelinkEvents) lifelinkEvents.push({ creature: source, controller, damage: dealt });
  else gainLifelinkLife(source, controller, dealt, battle);
  if (dealt) playSfx(target.owner === 'enemy' ? 'enemy-hit' : 'player-hit');
}
function blockerIds(battle, attackerId) {
  const value = battle.blockAssignments.get(attackerId);
  return Array.isArray(value) ? value : value ? [value] : [];
}
function resolveCombatDamage(attackers, assignments, attackingSide) {
  const battle = state.battle;
  let damageToPlayer = 0;
  let damageToOpponent = 0;
  const enemyLifelinkEvents = [];
  for (const firstStep of [true, false]) {
    const exchanges = [];
    const overflow = [];
    for (const attacker of attackers) {
      if (!creatureAlive(attacker)) continue;
      const original = assignments.get(attacker.id);
      const assignedGroup = Array.isArray(original) ? original : original ? [original] : [];
      const group = attackingSide === 'player' ? assignedGroup.filter(enemy => canAttackEnemy(attacker, enemy)) : assignedGroup;
      if (attackingSide === 'player' && !group.length) continue;
      let blockers = group.filter(blocker => creatureAlive(blocker) && (attackingSide === 'player' || canBlockCreature(blocker, attacker)));
      const menaceUnblocked = attackingSide === 'enemy' && hasCreatureKeyword(attacker,'menace') && group.length < 2;
      if (menaceUnblocked) blockers = [];
      if (!group.length || menaceUnblocked) {
        if (!dealsInCombatStep(attacker, firstStep)) continue;
        if (attackingSide === 'enemy') {
          const amount = Math.max(0, attacker.power);
          damageToPlayer += amount;
          if (hasCreatureKeyword(attacker, 'lifelink')) enemyLifelinkEvents.push({ creature: attacker, damage: amount });
        } else damageToOpponent += damageFirstEnemy(Math.max(0, attacker.power));
        continue;
      }
      if (dealsInCombatStep(attacker, firstStep)) {
        let remaining = Math.max(0, attacker.power);
        blockers.forEach((blocker, index) => {
          const lethal = hasCreatureKeyword(attacker, 'deathtouch') ? 1 : blocker.owner === 'enemy' ? (typeof lethalToEnemy60 === 'function' ? lethalToEnemy60(attacker, blocker) : Math.max(0, blocker.health)) : Math.max(0, blocker.toughness - (blocker.damage || 0));
          const amount = index === blockers.length - 1 && !hasCreatureKeyword(attacker, 'trample') ? remaining : Math.min(remaining, lethal);
          if (amount > 0) exchanges.push({ source: attacker, target: blocker, controller: attackingSide, amount });
          remaining -= amount;
        });
        if (remaining > 0 && hasCreatureKeyword(attacker, 'trample')) overflow.push({ source: attacker, amount: remaining, side: attackingSide, blockedIds:group.map(unit=>unit.id) });
      }
      for (const blocker of blockers) {
        if (dealsInCombatStep(blocker, firstStep) && (attackingSide !== 'player' || (canBlockCreature(blocker,attacker) && !hasCreatureKeyword(attacker,'menace')))) exchanges.push({ source: blocker, target: attacker, controller: attackingSide === 'player' ? 'enemy' : 'player', amount: Math.max(0, blocker.power) });
      }
    }
    // Eligibility is captured before applying the step: normal damage is simultaneous.
    const stepLifelinkEvents = [];
    for (const exchange of exchanges) dealCreatureDamage(exchange.source, exchange.target, exchange.controller, battle, exchange.amount, stepLifelinkEvents);
    // Finish all simultaneous damage before enemy self-healing. Lethal damage
    // cannot be healed away; player lifegain still happens if its source dies.
    for (const event of stepLifelinkEvents) gainLifelinkLife(event.creature, event.controller, event.damage, battle);
    battle.creatures = removeDeadCreatures(battle.creatures, 'player', false);
    battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy', false);
    for (const hit of overflow) {
      if (hit.side === 'enemy') { damageToPlayer += hit.amount; if (hasCreatureKeyword(hit.source, 'lifelink')) enemyLifelinkEvents.push({creature:hit.source,damage:hit.amount}); }
      else { const next = battle.enemyCreatures.find(enemy=>!hit.blockedIds.includes(enemy.id) && canAttackEnemy(hit.source,enemy)); const dealt = next ? (typeof poisonOverflow60 === 'function' && (hit.source.infect || hit.source.toxic) ? poisonOverflow60(hit.source, next, hit.amount, battle) : damageFirstEnemy(hit.amount,next)) : 0; damageToOpponent += dealt; gainLifelinkLife(hit.source,'player',dealt,battle); }
    }
  }
  return { damageToPlayer, damageToOpponent, enemyLifelinkEvents };
}
function attackTarget(battle, creature) {
  if (creature.attackTargetId) return battle.enemyCreatures.find(enemy => enemy.id === creature.attackTargetId && canAttackEnemy(creature,enemy)) || null;
  return battle.enemyCreatures.find(enemy => enemy.id === battle.selectedEnemyTargetId && canAttackEnemy(creature,enemy)) || battle.enemyCreatures.find(enemy => canAttackEnemy(creature,enemy)) || null;
}
function eligibleAttacker(creature, battle) {
  return Boolean(creature) && creatureCanAttack(creature, battle.turn) && !creature.tapped && !creature.attackedThisTurn;
}
function resolvePlayerAttacks(onlyIds = null, onComplete = null) {
  const battle = state.battle;
  if (!battle || battle.phase !== 'attack' || battle.diceRoll || battle.attackResolution55) return;
  const attackers = battle.creatures.filter(creature => eligibleAttacker(creature, battle) && creature.willAttack === true && (!onlyIds || onlyIds.includes(creature.id)));
  battle.attackResolution55 = true;
  let index = 0;
  const next = () => {
    if (state.battle !== battle || battle.phase !== 'attack') { battle.attackResolution55 = false; return; }
    const creature = attackers[index++];
    if (!creature) { battle.attackResolution55 = false; onComplete?.(); return; }
    if (!battle.creatures.includes(creature) || !creatureAlive(creature)) return next();
    const target = attackTarget(battle, creature);
    if (!target) { creature.willAttack = false; return next(); }
    creature.attackedThisTurn = true;
    creature.willAttack = false;
    creature.tapped = !hasCreatureKeyword(creature, 'vigilance');
    addLog(`${creature.card.name} attacks ${target.card.name}; the monster retaliates.`);
    const fight = () => {
      if (state.battle !== battle || battle.phase !== 'attack') return;
      if (battle.creatures.includes(creature) && creatureAlive(creature) && battle.enemyCreatures.includes(target) && creatureAlive(target)) resolveCombatDamage([creature], new Map([[creature.id, [target]]]), 'player');
      next();
    };
    if (typeof resolveAttackTrigger55 === 'function' && resolveAttackTrigger55(creature, battle, fight)) return;
    fight();
  };
  next();
}

function withdrawAttack(creatureId) {
  const battle = state.battle;
  const creature = battle?.creatures.find(item => item.id === creatureId);
  if (!battle || !creature || /attacks each combat if able/i.test(creature.card.oracle_text || '')) return;
  if (battle.phase === 'main' && creature.willAttack) {
    creature.willAttack = false;
    addLog(`${creature.card.name} is withdrawn from the attack.`);
    renderBattle();
    return;
  }
  if (battle.phase !== 'attack' || !battle.activeAttackIds?.includes(creatureId)) return;
  creature.willAttack = false;
  battle.activeAttackIds = battle.activeAttackIds.filter(id => id !== creatureId);
  addLog(`${creature.card.name} is withdrawn before damage.`);
  renderBattle();
}
function queueCreatureAttack(creatureId, targetId = null) {
  const battle = state.battle;
  const creature = battle?.creatures.find(item => item.id === creatureId);
  if (battle?.enemyCounterWindow) { showActionError('Finish the spell response before queuing attacks.'); return false; }
  if (!battle || battle.phase !== 'main' || !creature || !eligibleAttacker(creature, battle)) return false;
  const target = targetId ? battle.enemyCreatures.find(enemy => enemy.id === targetId && canAttackEnemy(creature,enemy)) : attackTarget(battle, creature);
  if (!target) { showActionError('Flying enemies can only be attacked by creatures with Flying or Reach.'); return false; }
  battle.pendingAttachment = null;
  battle.mulliganAvailable = false;
  creature.attackTargetId = target.id;
  creature.willAttack = true;
  addLog(`${creature.card.name} is queued to attack ${target.card.name} in Your attack.`);
  renderBattle();
  playSfx('select');
  return true;
}
function assignBlocker(attackerId, blockerId) {
  const battle = state.battle;
  if (!battle || battle.phase !== 'blocks') return;
  const attacker = battle.enemyCreatures.find(creature => creature.id === attackerId && creatureCanAttack(creature, battle.turn));
  const blocker = battle.creatures.find(creature => creature.id === blockerId && !creature.tapped);
  if (!attacker || !blocker) return;
  if (!canBlockCreature(blocker, attacker)) return showActionError('Flying attackers require flying or reach to block.');
  const already = blockerIds(battle, attackerId).includes(blockerId);
  for (const [id] of battle.blockAssignments) {
    const ids = blockerIds(battle, id).filter(item => item !== blockerId);
    if (ids.length) battle.blockAssignments.set(id, ids); else battle.blockAssignments.delete(id);
  }
  if (!already) battle.blockAssignments.set(attackerId, [...blockerIds(battle, attackerId), blockerId]);
  battle.selectedEnemyAttackerId = attackerId;
  renderBattle();
  playSfx('block');
}
function isInstant(card) { return /\bInstant\b/i.test(card?.type_line || ''); }
function canCastNow(card, battle = state.battle) {
  if (!battle) return false;
  if (isLand(card)) return battle.phase === 'main' && battle.landAvailable;
  return battle.phase === 'main' || ((isInstant(card) || hasFlash(card)) && ['attack', 'enemy', 'blocks', 'damage'].includes(battle.phase));
}
function hasInstantResponse(battle) {
  const extra = battle.creatures.filter(creature => canTapForMana(creature, battle)).length;
  return battle.hand.some(card => (isInstant(card) || hasFlash(card)) && battle.mana + extra >= Math.ceil(card.cmc || 0)) || battle.permanents.some(permanent => canActivatePermanent(permanent, battle));
}
function removeSpellTarget(kind) {
  const battle = state.battle;
  const own = battle.resolvingSpellTarget?.side === 'player';
  const unit = own ? battle.creatures.find(item => item.id === battle.resolvingSpellTarget.id) : battle.enemyCreatures.find(item => item.id === (battle.resolvingSpellTarget?.id || battle.selectedEnemyTargetId)) || battle.enemyCreatures[0];
  if (!unit) return;
  if (own) {
    battle.creatures = battle.creatures.filter(item => item !== unit);
    if (!unit.isToken) (kind === 'exile' ? (battle.exile ||= []) : battle.graveyard).push(unit.card);
    cleanupAttachments(new Set([unit.id]));
  } else {
    battle.enemyCreatures = battle.enemyCreatures.filter(item => item !== unit);
    (kind === 'exile' ? (battle.enemyExile ||= []) : battle.enemyGraveyard).push({ ...unit.card, enemyKind: unit.kind });
    awardBounty(unit);
  }
  addLog(`${unit.card.name} ${kind === 'exile' ? 'is exiled for this encounter' : 'is destroyed'}.`);
}

function expireTurnEffects(battle) {
  if (!battle.turnEffects.length) return;
  for (const effect of battle.turnEffects) {
    const creature = battle.creatures.find((item) => item.id === effect.creatureId);
    if (!creature) continue;
    if (effect.power !== undefined) creature.power -= effect.power;
    if (effect.toughness !== undefined) creature.toughness -= effect.toughness;
    if (effect.keyword && creature.temporaryKeywords) {
      const index = creature.temporaryKeywords.indexOf(effect.keyword);
      if (index >= 0) creature.temporaryKeywords.splice(index, 1);
    }
  }
  battle.turnEffects = [];
  addLog('Effects that last until end of turn wear off.');
}

function resolveEnemyCombat() {
  const battle = state.battle;
  if (!battle) return;
  const attackers = battle.enemyCreatures.filter((creature) => creatureCanAttack(creature, battle.turn));
  const assignments = new Map();
  for (const attacker of attackers) {
    const blockers = legalBlockers(battle, attacker);
    if (blockers.length) assignments.set(attacker.id, blockers);
  }
  const { damageToPlayer, enemyLifelinkEvents } = resolveCombatDamage(attackers, assignments, 'enemy');
  for (const event of enemyLifelinkEvents) gainLifelinkLife(event.creature, 'enemy', event.damage, battle);
  const incoming = damageToPlayer;
  if (incoming) {
    state.playerHealth -= incoming;
    playSfx('player-hit');
    if (typeof animatePlayerDamage === 'function') animatePlayerDamage(incoming);
    addLog(`${incoming} damage gets through to you.`);
  } else if (attackers.length) {
    addLog('All enemy attacks were blocked.');
  }
  if (state.playerHealth <= 0) return endRun(false);
  if (!battle.enemyCreatures.length) return winBattle();

  beginNextPlayerTurn45(battle);
}

function beginNextPlayerTurn45(battle = state.battle) {
  if (!battle || state.battle !== battle || battle.phase === 'complete') return;
  battle.creatures.forEach(creature => { creature.damage = 0; creature.deathtouchDamage = false; });
  expireTurnEffects(battle);
  battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy');
  if (!battle.enemyCreatures.length) return winBattle();
  battle.creatures = removeDeadCreatures(battle.creatures, 'player');
  battle.turn += 1;
  battle.lands.forEach(land => { land.tapped = false; });
  battle.permanents.forEach(permanent => { permanent.tapped = false; });
  battle.floatingMana = 0;
  battle.maxMana = battle.lands.length + battle.floatingMana;
  battle.landAvailable = true;
  syncMana(battle);
  battle.phase = 'main';
  battle.blockAssignments.clear();
  battle.selectedEnemyAttackerId = null;
  battle.creatures.forEach((creature) => {
    creature.tapped = false;
    creature.willAttack = false;
    creature.attackedThisTurn = false;
  });
  for (const permanent of battle.permanents) if (permanent.card.name === 'Fountain of Renewal') state.playerHealth += 1;
  drawOneCard();
  if (battle.phase === 'complete') return;
  renderBattle();
  playSfx('turn');
}

function afterCombatBeat(battle, phase, callback) {
  battle.priorityCallback = null;
  const ticket = battle.phaseTicket = (battle.phaseTicket || 0) + 1;
  if (hasInstantResponse(battle)) {
    battle.priorityCallback = callback;
    renderBattle();
    return;
  }
  setTimeout(() => {
    if (state.battle !== battle || battle.phase !== phase || battle.phaseTicket !== ticket) return;
    callback();
  }, 650);
}

function finishTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== 'main' || battle.enemyCounterWindow || battle.diceRoll || battle.wardCastWarning || battle.enemyCastCheck) return;
  battle.mulliganAvailable = false;
  battle.pendingAttachment = null;
  for (const creature of battle.creatures) { if (/attacks each combat if able/i.test(creature.card.oracle_text || '') && eligibleAttacker(creature, battle) && attackTarget(battle,creature)) creature.willAttack = true; }
  battle.phase = 'attack';
  battle.activeAttackIds = battle.creatures.filter(creature => creature.willAttack && eligibleAttacker(creature, battle) && attackTarget(battle,creature)).map(creature => creature.id);
  renderBattle();
  afterCombatBeat(battle, 'attack', () => {
    resolvePlayerAttacks(null, () => {
      battle.activeAttackIds = null;
      if (!battle.enemyCreatures.length) return winBattle();
      battle.phase = 'enemy';
      resolveEnemyIntents();
      renderBattle();
      afterCombatBeat(battle, 'enemy', () => {
        const attackers = battle.enemyCreatures.filter(creature => creatureCanAttack(creature, battle.turn));
        if (attackers.length && battle.creatures.some(creature => !creature.tapped)) {
          battle.phase = 'blocks';
          battle.blockAssignments.clear();
          battle.selectedEnemyAttackerId = null;
          renderBattle();
          return;
        }
        beginEnemyDamage();
      });
    });
  });
}
function beginEnemyDamage() {
  const battle = state.battle;
  if (!battle || !['blocks', 'enemy'].includes(battle.phase)) return;
  if(hasInvalidMenaceBlock(battle))return showActionError('Menace requires at least two blockers. Add another blocker or remove the assignment.');
  battle.phase = 'damage';
  renderBattle();
  afterCombatBeat(battle, 'damage', resolveEnemyCombat);
}
function handleCombatAction() {
  if (state.battle?.diceRoll || state.battle?.wardCastWarning || state.battle?.enemyCastCheck) return;
  if (state.battle?.enemyCounterWindow && typeof enemyCounterBusy44 === 'function' && enemyCounterBusy44(state.battle)) return;
  if (state.battle?.priorityCallback) { const callback = state.battle.priorityCallback; state.battle.priorityCallback = null; callback(); return; }
  if (state.battle?.phase === 'blocks') beginEnemyDamage();
  else if (state.battle?.phase === 'main') finishTurn();
}

function winBattle() {
  const battle=state.battle;
  if(!battle||battle.phase==='complete')return;
  if(battle.enemyCreatures.length){renderBattle();return;}
  if (state.battle.enemyCounterWindow) { renderBattle(); return; }
  if (typeof pendingEnemySpells38 === 'function' && pendingEnemySpells38(state.battle).length) { renderBattle(); return; }
  if(battle.resolutionTask||battle.choice||battle.scry||battle.libraryOrder||battle.interruption){renderBattle();return;}
  if(typeof advanceEncounterWave45==='function'&&advanceEncounterWave45(battle))return;
  state.battle.phase = 'complete'; state.battle.priorityCallback = null; state.battle.phaseTicket = (state.battle.phaseTicket || 0) + 1;
  const node = state.node;
  addLog(`Encounter in ${state.battle.stage?.name || 'the Aether'} cleared.`);
  if (node >= ENCOUNTERS.length && !state.endless) return endRun(true);
  offerEncounterReward59();
}

function offerEncounterReward59() {
  state.node += 1;
  if (state.endless && typeof ensureEndlessStages59 === 'function') ensureEndlessStages59(state.node);
  state.packs = [chooseRandomCards(state.pool, PACK_SIZE)];
  state.draftKind = 'reward';
  state.activePack = 0;
  state.rerolledPacks = new Set();
  state.boosterSealed = true;
  state.selection.clear();
  renderDraft();
  showScreen('draft-screen');
  showToast(`Encounter in ${state.battle.stage?.name || 'the Aether'} cleared. Choose a reward, then rest.`);
  playSfx('victory');
}

function endRun(won, reason = null) {
  if (state.battle) { state.battle.phase = 'complete'; state.battle.priorityCallback = null; }
  const end = $('#end-screen');
  end.dataset.result = won ? 'win' : 'loss';
  $('#end-emblem').textContent = won ? '✦' : '×';
  $('#end-eyebrow').textContent = won ? 'CAMPAIGN COMPLETE' : 'RUN OVER';
  $('#end-title').textContent = won ? 'The mana path is yours.' : 'The path ends here.';
  $('#end-message').textContent = won
    ? `You defeated ${state.battle?.bossName || 'the final guardian'} and completed the run. Your booster deck came through.`
    : reason === 'empty-library' ? 'You tried to draw from an empty library. Your expedition ends here.' : `You fell in fight ${state.node}. Adjust your draft and try again.`;
  $('#run-summary').innerHTML = `<span>RUN <b>${state.node} / 4</b></span><span>DECK <b>${state.deck.length}</b></span><span>LIFE <b>${Math.max(0, state.playerHealth)}</b></span>`;
  if (typeof renderRunEnd59 === 'function') renderRunEnd59(won);
  showScreen('end-screen');
  playSfx(won ? 'victory' : 'defeat');
}

function showActionError(message) {
  playSfx('invalid');
  return showToast(message);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function primeBoosterOpeningSound() {
  if (!state.soundOn) return;
  // Start the media element silently in the tap gesture. Safari can then keep
  // playing it when the visible tear happens after the travel animation.
  const audio = $('#booster-audio');
  const context = soundEngine.context ||= new (window.AudioContext || window.webkitAudioContext)();
  context.resume().catch(() => {});
  if (!soundEngine.packGain) {
    soundEngine.packSource = context.createMediaElementSource(audio);
    soundEngine.packGain = context.createGain();
    soundEngine.packSource.connect(soundEngine.packGain);
    soundEngine.packGain.connect(context.destination);
  }
  soundEngine.packGain.gain.value = 0;
  audio.currentTime = 0;
  audio.volume = 0.72;
  audio.play().catch(() => {});
}

function playBoosterOpeningSound() {
  if (!state.soundOn) return;
  const audio = $('#booster-audio');
  if (soundEngine.packGain) soundEngine.packGain.gain.value = 1;
  audio.currentTime = 0;
  audio.volume = 0.72;
  audio.play().catch(() => showToast('Click SOUND once to enable audio.'));
}

let boosterTravel = null;
function cancelBoosterTravel() {
  if (!boosterTravel) return;
  const travel = boosterTravel;
  boosterTravel = null;
  travel.animation?.cancel();
  if (soundEngine.packGain) {
    $('#booster-audio').pause();
    $('#booster-audio').currentTime = 0;
  }
  travel.pack.remove();
  $('#draft-screen').classList.remove('pack-travelling');
  $('#draft-grid').removeAttribute('aria-busy');
}

async function openCurrentBooster() {
  if (!state.boosterSealed || boosterTravel) return;
  const pack = $('#draft-grid .sealed-pack');
  if (!pack) return;
  const source = pack.getBoundingClientRect();
  const packWidth = pack.offsetWidth;
  const packHeight = pack.offsetHeight;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const style = getComputedStyle(pack);
  const transform = style.transform;
  const pulse = parseFloat(style.scale) || 1;
  state.boosterSealed = false;
  if (reduced || !pack.animate) {
    renderDraft();
    animateBoosterOpening();
    return;
  }
  const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
  const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  try { primeBoosterOpeningSound(); } catch { /* Audio is optional. */ }
  const travel = { pack, cards: state.packs[state.activePack || 0], index: state.activePack || 0, revealed: false };
  boosterTravel = travel;
  const screen = $('#draft-screen');
  screen.classList.add('pack-travelling');
  renderDraft();
  const grid = $('#draft-grid');
  const rect = grid.getBoundingClientRect();
  const target = $('#draft-grid .card-image-wrap').getBoundingClientRect();
  const scale = grid.clientWidth / rect.width;
  const from = { x: (source.left + source.width / 2 - rect.left) * scale, y: (source.top + source.height / 2 - rect.top) * scale };
  const to = { x: (target.left + target.width / 2 - rect.left) * scale, y: (target.top + target.height / 2 - rect.top) * scale };
  const endScale = Math.min(target.width * scale / packWidth, target.height * scale / packHeight);
  const pose = (point, tilt, size) => `translate(${point.x - packWidth / 2}px,${point.y - packHeight / 2}px) rotate(${tilt}deg) scale(${size})`;
  const landed = pose(to, 0, endScale);
  pack.classList.add('pack-opening-flight');
  pack.disabled = true;
  pack.setAttribute('aria-hidden', 'true');
  pack.removeAttribute('data-open-pack');
  pack.style.transform = landed;
  grid.append(pack);
  grid.setAttribute('aria-busy', 'true');
  $('#pack-reroll').disabled = true;
  $('#draft-confirm').disabled = true;
  $('#selection-status').textContent = 'Moving your booster into place…';
  const current = () => boosterTravel === travel && state.screen === 'draft-screen' && state.packs[travel.index] === travel.cards;
  const reveal = () => {
    if (!current() || travel.revealed) return;
    travel.revealed = true;
    screen.classList.remove('pack-travelling');
    animateBoosterOpening();
  };
  try {
    travel.animation = pack.animate([
      { transform: pose(from, angle, pulse) },
      { transform: landed }
    ], { duration: 460, easing: 'cubic-bezier(.22,.75,.24,1)', fill: 'forwards' });
    await travel.animation.finished;
    if (!current()) return;
    travel.animation.cancel();
    // Sound, sparks and card reveals start only after the pack has arrived.
    reveal();
    pack.classList.add('is-unsealing');
    travel.animation = pack.animate([
      { opacity: 1, transform: landed, filter: 'brightness(1)' },
      { opacity: 0, transform: pose(to, 0, endScale * 1.12), filter: 'brightness(1.8)' }
    ], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    await travel.animation.finished;
  } catch {
    reveal(); // A cancelled/unsupported effect must never block card selection.
  } finally {
    if (boosterTravel === travel) {
      boosterTravel = null;
      travel.animation?.cancel();
      pack.remove();
      screen.classList.remove('pack-travelling');
      grid.removeAttribute('aria-busy');
      if (state.screen === 'draft-screen') {
        $('#pack-reroll').disabled = Boolean(state.rerolledPacks?.has(travel.index));
        syncDraftSelection();
      }
    }
  }
}

function animateBoosterOpening() {
  recordSeenCards(state.packs[state.activePack || 0]);
  const screen = $('#draft-screen');
  clearTimeout(state.openingTimer);
  screen.classList.remove('opening');
  const grid = $('#draft-grid');
  const card = $('#draft-grid .card-image-wrap');
  if (card) {
    const rect = grid.getBoundingClientRect();
    const target = card.getBoundingClientRect();
    const scale = grid.clientWidth / rect.width;
    grid.style.setProperty('--pack-open-x', `${(target.left + target.width / 2 - rect.left) * scale}px`);
    grid.style.setProperty('--pack-open-y', `${(target.top + target.height / 2 - rect.top) * scale}px`);
  }
  void screen.offsetWidth;
  screen.classList.add('opening');
  state.openingTimer = setTimeout(() => screen.classList.remove('opening'), 1800);
  playBoosterOpeningSound();
}

$('#graveyard-button').addEventListener('click', () => $('#graveyard-dialog').showModal());
$('#graveyard-close').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').close(); });
$('#graveyard-dialog').addEventListener('click', (event) => {
  if (event.target === $('#graveyard-dialog')) { hideCardPreview(); $('#graveyard-dialog').close(); }
});
document.addEventListener('pointerover', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget)) showCardPreview(previewCardFor(element), element);
});
document.addEventListener('pointerout', (event) => {
  if (event.pointerType === 'touch') return;
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget) && !event.relatedTarget?.closest('#card-preview')) hideCardPreview();
});
document.addEventListener('focusin', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element) showCardPreview(previewCardFor(element), element);
});
document.addEventListener('focusout', (event) => {
  if (!event.relatedTarget?.closest('[data-preview-owner], #card-preview')) hideCardPreview();
});
$('#start-button').addEventListener('click', startNewRun);
$('#restart-button').addEventListener('click', startNewRun);
$('#avatar-choices').addEventListener('click', event => {
  const button = event.target.closest('[data-avatar-choice]');
  const avatar = AVATARS.find(item => item.id === button?.dataset.avatarChoice);
  if (!avatar) return;
  state.selectedAvatar = avatar.id;
  try { localStorage.setItem('booster-tutor-avatar', avatar.id); } catch { /* Keep the selection for this page session. */ }
  renderAvatarChoices();
  playSfx('select');
});
renderAvatarChoices();
updateDiscoveryProgress();
$('#end-turn-button').addEventListener('click', handleCombatAction);
$('#mulligan-button').addEventListener('click', freeMulligan);
$('#sound-toggle').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  if (!state.soundOn) soundEngine.stop();
  $('#sound-toggle span').textContent = state.soundOn ? 'SOUND ON' : 'SOUND OFF';
  $('#sound-toggle').setAttribute('aria-label', state.soundOn ? 'Turn sound off' : 'Turn sound on');
  $('#sound-toggle').title = state.soundOn ? 'Turn sound off' : 'Turn sound on';
  if (state.soundOn) {
    soundEngine.unlock().catch(() => {});
    playSfx('select');
  }
});
$('#quit-button').addEventListener('click', () => $('#quit-dialog').showModal());
$('#quit-cancel').addEventListener('click', () => $('#quit-dialog').close());
$('#quit-confirm').addEventListener('click', () => {
  $('#quit-dialog').close();
  state.battle = null;
  showScreen('start-screen');
});
$('#back-link').addEventListener('click', (event) => {
  event.preventDefault();
  showScreen('start-screen');
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { if (pointerDrag) { finishDrag(); playSfx('cancel'); } hideCardPreview(); if (state.battle?.pendingAttachment) { state.battle.pendingAttachment = null; renderBattle(); } }
  if (event.key === 'Enter' && $('#start-screen').classList.contains('active') && !event.target.closest('button, a, input, select, textarea')) startNewRun();
});

function styleTravelStop(screenId, labelId, kind) {
  const stage = state.stageLocations[state.node - 1] || LAND_STAGES[(state.node - 1) % LAND_STAGES.length];
  const screen = $('#' + screenId);
  screen.dataset.scene = stage.scene;
  screen.style.setProperty('--stage-accent', stage.color);
  screen.style.setProperty('--stage-scene', `url('assets/stages/${stage.scene}.svg?v=0.56')`);
  $('#' + labelId).textContent = `${stage.name} · ${kind}`;
}

function showJourney() {
  const first = state.node === 1;
  styleTravelStop('journey-screen', 'journey-location', first ? 'Expedition' : 'Camp');
  $('#journey-title').textContent = first ? 'Choose your supplies' : 'A moment by the fire';
  $('#journey-description').textContent = 'Choose one token. It stays with you until spent.';
  const pathStart = state.endless ? Math.floor((state.node - 1) / ENCOUNTERS.length) * ENCOUNTERS.length : 0;
  $('#journey-path').innerHTML = ENCOUNTERS.map((encounter, index) => `<div class="path-node ${pathStart + index + 1 === state.node ? 'current' : pathStart + index + 1 < state.node ? 'complete' : ''}"><span>${pathStart + index + 1 < state.node ? '✓' : index === 3 ? '♜' : '⚔'}</span><small>${state.endless ? '∞ · ' : ''}${encounter.rank}</small><b>${escapeHtml((state.stageLocations[pathStart + index] || LAND_STAGES[index]).name)}</b></div>`).join('');
  $('#journey-options').innerHTML = typeof campRewardMarkup === 'function' ? campRewardMarkup() : '';
  $('#journey-life').textContent = `${state.playerHealth} LIFE · ${state.deck.length} CARDS · ${state.coins || 0} COINS`;
  $('#return-shop').hidden = first;
  syncCoins();
  showScreen('journey-screen');
}
$('#journey-options').addEventListener('click', event => {
  const choice = event.target.closest('button');
  if (!choice) return;
  if (!choice.dataset.campToken || typeof grantCampToken !== 'function' || !grantCampToken(choice.dataset.campToken)) return;
  beginBattle(state.node);
});

window.addEventListener('resize', hideCardPreview);
document.addEventListener('scroll', event => { if (!event.target.closest?.('#card-preview')) hideCardPreview(); }, true);
document.addEventListener('pointermove', positionCardPreview);

$('#graveyard-open').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });

$('#card-preview').addEventListener('pointerleave', event => { if (event.pointerType !== 'touch' && !previewAnchor?.contains(event.relatedTarget)) hideCardPreview(); });

$('#graveyard-pile').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });

function rerollCurrentPack() {
  if (boosterTravel) return;
  const index = state.activePack || 0;
  state.rerolledPacks ||= new Set();
  if (state.boosterSealed || state.rerolledPacks.has(index)) return;
  const excluded = new Set(state.packs.flat().map(card => card.id));
  let candidates = state.pool.filter(card => !excluded.has(card.id));
  if (candidates.length < PACK_SIZE) candidates = state.pool.filter(card => !state.packs[index].some(old => old.id === card.id));
  if (candidates.length < PACK_SIZE) return showActionError('Not enough different cards to reroll.');
  state.packs[index] = shuffle(candidates).slice(0, PACK_SIZE);
  state.selection.delete(index);
  state.rerolledPacks.add(index);
  hideCardPreview();
  renderDraft();
  animateBoosterOpening();
}
$('#pack-reroll').addEventListener('click', rerollCurrentPack);

function inspectBattlefieldCard(card, element) {
  state.inspectedId = element.dataset.previewId;
  const battle = state.battle;
  const creature = battle?.creatures.find(item => item.id === element.dataset.previewId);
  const permanent = battle?.permanents.find(item => item.id === element.dataset.previewId);
  const attached = battle?.creatures.find(item => item.id === permanent?.attachedTo);
  $('#inspector-content').innerHTML = `<div class="inspector-card">${cardFace(card)}</div><h3>${escapeHtml(card.name)}</h3><p class="inspector-cost">${Math.ceil(card.cmc || 0)} generic mana${creature ? ` · Current ${creature.power}/${creature.toughness}` : ''}</p><div class="inspector-rules">${effectDescriptions(card).map(line => `<p>${escapeHtml(line)}</p>`).join('')}${card.campToken ? '<p>Click this token on the battlefield to use it.</p>' : ''}${attached ? `<p>Attached to ${escapeHtml(attached.card.name)}.</p>` : ''}${permanent && !card.campToken && permanentActivationCost(permanent.card)!==null ? `<button class="quiet-button" data-activate-permanent="${permanent.id}" ${canActivatePermanent(permanent,battle)?'':'disabled'}>${escapeHtml(permanentActivationLabel51(permanent))}</button>`:''}</div>`;
}
function fitGameCanvas() {
  const root = document.documentElement;
  const combat = state.screen === 'combat-screen';
  const viewport = window.visualViewport;
  // Safari can report a slightly rounded scale at normal zoom. Its visible
  // viewport can also be shorter than the layout viewport while bars are open.
  const useVisibleViewport = viewport && Math.abs(viewport.scale - 1) < 0.01;
  const width = useVisibleViewport ? viewport.width : window.innerWidth;
  const height = useVisibleViewport ? viewport.height : window.innerHeight;
  const scale = Math.min(width / 1600, height / 900);
  root.style.setProperty('--game-scale', scale);
  root.style.setProperty('--game-center-x', `${(useVisibleViewport ? viewport.offsetLeft : 0) + width / 2}px`);
  root.style.setProperty('--game-center-y', `${(useVisibleViewport ? viewport.offsetTop : 0) + height / 2}px`);
  root.classList.add('fixed-game');
  root.classList.remove('responsive-game', 'portrait-combat');
  root.classList.toggle('combat-game', combat);
  if (combat) requestAnimationFrame(() => { fitHand(); drawCombatArrows(); });
}
window.addEventListener('resize', fitGameCanvas);
window.visualViewport?.addEventListener('resize', fitGameCanvas);
window.visualViewport?.addEventListener('scroll', fitGameCanvas);
fitGameCanvas();

$('#fullscreen-button').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => showToast('Fullscreen is unavailable in this browser.')); });

const COMBAT_PHASES = [
  { id: 'main', label: 'Main phase + declare attackers', description: 'Choose targets and queue attackers. Start combat moves to Your attack; no attack damage is dealt in Main phase.' },
  { id: 'attack', label: 'Your attack', description: 'Your creatures fight their targets. Monsters retaliate.' },
  { id: 'enemy', label: 'Enemy action', description: 'Monsters guard, strengthen, or prepare their attacks.' },
  { id: 'blocks', label: 'Block', description: 'Assign one or more blockers. Selection order is damage order.' },
  { id: 'damage', label: 'Damage', description: 'Enemy attacks and blocks resolve damage simultaneously.' }
];
function phaseInfo(id) { return COMBAT_PHASES.find(phase => phase.id === id) || COMBAT_PHASES[0]; }
function updatePhaseDisplay() {
  const screen = state.screen || 'start-screen';
  const labels = { 'start-screen': 'START', 'loading-screen': 'PREPARING DECK', 'draft-screen': state.boosterSealed ? 'OPEN BOOSTER' : 'PICK A CARD', 'journey-screen': state.node === 1 ? 'CHOOSE SUPPLIES' : 'CAMP', 'shop-screen': 'CARD SHOP', 'end-screen': 'RUN COMPLETE' };
  const phase = phaseInfo(state.battle?.phase);
  $('.arrow-legend').dataset.phase = phase.id;
  $('#global-phase').textContent = screen === 'combat-screen' ? phase.label.toUpperCase() : labels[screen] || 'EXPEDITION';
  if (!state.battle) return;
  $('#phase-strip').innerHTML = COMBAT_PHASES.map((item, index) => `<li class="${phase.id === item.id ? 'current' : ''}" ${phase.id === item.id ? 'aria-current="step"' : ''} data-phase="${item.id}"><span>${index + 1}</span>${item.label}</li>`).join('');
  $('#phase-status').textContent = state.battle?.phase==='blocks' && hasInvalidMenaceBlock(state.battle) ? 'Menace requires two blockers: add another or clear the assignment.' : state.battle?.priorityCallback ? 'You have priority: cast an instant, then Continue.' : phase.description;
}
function combatRoutes(battle) {
  const routes = [];
  for (const creature of battle.creatures) {
    const active = battle.phase === 'attack' && battle.activeAttackIds?.includes(creature.id);
    if (!eligibleAttacker(creature, battle) || (!creature.willAttack && !active && !/attacks each combat if able/i.test(creature.card.oracle_text||''))) continue;
    const target = attackTarget(battle, creature);
    if (target) routes.push({ kind: 'ally', from: creature.id, to: target.id, damage: Math.max(0, creature.power) * (hasCreatureKeyword(creature, 'double strike') ? 2 : 1) });
  }
  for (const enemy of battle.enemyCreatures) {
    if (!creatureCanAttack(enemy, battle.turn)) continue;
    const ids = blockerIds(battle, enemy.id);
    const blockers = legalBlockers(battle, enemy);
    if (!blockers.length) routes.push({ kind: 'enemy', from: enemy.id, to: 'player', damage: Math.max(0, enemy.power) * (hasCreatureKeyword(enemy, 'double strike') ? 2 : 1) });
    else {
      let remaining = Math.max(0, enemy.power);
      blockers.forEach((blocker, index) => {
        const amount = index === blockers.length - 1 && !hasCreatureKeyword(enemy,'trample') ? remaining : Math.min(remaining, hasCreatureKeyword(enemy,'deathtouch')?1:Math.max(0, blocker.toughness - (blocker.damage || 0)));
        routes.push({ kind: 'block', from: enemy.id, to: blocker.id, damage: amount }); remaining -= amount;
      });
      if(remaining>0 && hasCreatureKeyword(enemy,'trample'))routes.push({kind:'enemy',from:enemy.id,to:'player',damage:remaining});
    }
  }
  return routes;
}

function drawCombatArrows() {
  const arena = $('.arena-table');
  const svg = $('#combat-arrows');
  const battle = state.battle;
  if (!battle || !$('#combat-screen').classList.contains('active')) { svg.innerHTML = ''; return; }
  const rect = arena.getBoundingClientRect();
  const width = arena.clientWidth;
  const height = arena.clientHeight;
  if (!width || !height || !rect.width || !rect.height) return;
  const sx = width / rect.width;
  const sy = height / rect.height;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const center = (element, edge) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: ((edge === 'right' ? box.right : box.left + box.width / 2) - rect.left) * sx, y: ((edge === 'top' ? box.top - 4 : edge === 'bottom' ? box.bottom + 7 : box.top + box.height / 2) - rect.top) * sy };
  };
  if (!svg.querySelector('defs')) svg.innerHTML = combatArrowDefinitions();
  const existing = new Map([...svg.querySelectorAll('.combat-route')].map(group => [group.dataset.routeKey, group]));
  const retained = new Set();
  const round = value => Math.round(value * 100) / 100;
  const set = (element, name, value) => {
    const next = String(value);
    if (element.getAttribute(name) !== next) element.setAttribute(name, next);
  };
  for (const route of combatRoutes(battle)) {
    const key = `${route.kind}:${route.from}:${route.to}`;
    const fromElement = route.kind === 'ally' ? document.querySelector(`[data-creature-id="${route.from}"] .player-card-frame`) : document.querySelector(`[data-enemy-attacker="${route.from}"] .monster-figure`);
    const toElement = route.to === 'player' ? $('#player-health-label') : route.kind === 'ally' ? document.querySelector(`[data-enemy-attacker="${route.to}"] .monster-figure`) : document.querySelector(`[data-creature-id="${route.to}"] .player-card-frame`);
    const from = center(fromElement, 'top');
    const to = center(toElement, route.to === 'player' ? 'bottom' : 'top');
    if (!from || !to) continue;
    // A route keeps its curve when another route is added or removed.
    const lane = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    const lift = 38 + lane * 16;
    const c1 = { x: from.x + (route.kind === 'ally' ? 72 : -86), y: Math.max(30, from.y - lift) };
    const c2 = route.to === 'player' ? { x: to.x + 72, y: to.y + 18 } : { x: to.x + (route.kind === 'ally' ? -88 : 96), y: Math.max(30, to.y - lift) };
    const label = { x: (from.x + 3 * c1.x + 3 * c2.x + to.x) / 8, y: (from.y + 3 * c1.y + 3 * c2.y + to.y) / 8 };
    const units = [...battle.creatures, ...battle.enemyCreatures];
    const fromName = units.find(unit => unit.id === route.from)?.card.name || '';
    const toName = route.to === 'player' ? 'Your life' : units.find(unit => unit.id === route.to)?.card.name || '';
    const title = `${fromName} → ${toName}: ${route.damage} ${route.kind === 'block' ? 'blocked attack' : 'attack'}`;
    const curve = `M ${round(from.x)} ${round(from.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(to.x)} ${round(to.y)}`;
    let group = existing.get(key);
    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', `combat-route route-${route.kind}`);
      Object.assign(group.dataset, { routeKey: key, arrowKind: route.kind, fromId: route.from, toId: route.to });
      group.innerHTML = `<title></title><path class="route-glow"/><path class="route-track"/><circle class="route-target" r="6"/><path class="route-line" marker-end="url(#arrow-${route.kind})"/><circle class="route-source" r="4"/><g class="route-damage"><rect x="-20" y="-12" width="40" height="24" rx="12"/><text text-anchor="middle" dominant-baseline="central"></text></g>`;
      svg.append(group);
    }
    group.querySelector('title').textContent = title;
    group.querySelector('text').textContent = route.damage;
    for (const path of group.querySelectorAll('path')) set(path, 'd', curve);
    for (const [selector, point] of [['.route-source', from], ['.route-target', to]]) {
      const circle = group.querySelector(selector);
      set(circle, 'cx', round(point.x));
      set(circle, 'cy', round(point.y));
    }
    set(group.querySelector('.route-damage'), 'transform', `translate(${round(label.x)},${round(label.y)})`);
    retained.add(key);
  }
  for (const [key, group] of existing) if (!retained.has(key)) group.remove();
}

function combatArrowDefinitions() {
  const gradients = {
    ally: '<linearGradient id="arrow-gradient-ally"><stop stop-color="#fff0b8"/><stop offset=".55" stop-color="#f0c36d"/><stop offset="1" stop-color="#ffe9a8"/></linearGradient>',
    enemy: '<linearGradient id="arrow-gradient-enemy"><stop stop-color="#ffd2bb"/><stop offset=".5" stop-color="#e77969"/><stop offset="1" stop-color="#ffb299"/></linearGradient>',
    block: '<linearGradient id="arrow-gradient-block"><stop stop-color="#d3fff2"/><stop offset=".5" stop-color="#70d6c2"/><stop offset="1" stop-color="#bbfff0"/></linearGradient>'
  };
  const tip = 'M2.8 1.5 L10.2 5 Q12 6 10.2 7 L2.8 10.5 Q1 11.3 1.5 9.3 L2.4 6 L1.5 2.7 Q1 0.7 2.8 1.5 Z';
  const markers = ['ally', 'enemy', 'block'].map(kind => `<marker id="arrow-${kind}" viewBox="0 0 12 12" refX="10.5" refY="6" markerWidth="20" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto" overflow="visible"><path class="arrowhead-${kind} arrowhead-glow" d="${tip}"/><path class="arrowhead-${kind}" d="${tip}"/></marker>`).join('');
  return `<defs>${Object.values(gradients).join('')}<filter id="arrow-soft-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter>${markers}</defs>`;
}
window.addEventListener('resize', () => requestAnimationFrame(drawCombatArrows));

document.addEventListener('click', event => {
  if (!dragClickGuard) return;
  const source = dragClickGuard; dragClickGuard = null;
  if (event.detail && (event.target === source || source.contains(event.target))) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);

$('#creature-row').addEventListener('change', event => {
  const input = event.target.closest('[data-unit-target]');
  const battle = state.battle;
  if (!input || battle?.phase !== 'main') return;
  const creature = battle.creatures.find(item => item.id === input.dataset.unitTarget);
  if (!creature || !eligibleAttacker(creature, battle)) return;
  queueCreatureAttack(creature.id, input.value);
});

function openCollection(kind = 'deck') {
  const battle = state.battle;
  if (state.screen === 'combat-screen' && ['attack', 'enemy', 'damage'].includes(battle?.phase) && !battle.priorityCallback) return;
  state.collectionKind = kind;
  $('#collection-search').value = '';
  for(const id of ['collection-type','collection-mana','collection-keyword','collection-color','collection-seen','collection-rules']) $('#'+id).value='';
  $('#collection-seen').hidden = kind !== 'catalog';
  $('#collection-rules').hidden = kind !== 'catalog';
  $('#collection-dialog').dataset.kind = kind;
  $('#collection-title').textContent = kind === 'catalog' ? 'Verified card collection' : kind === 'library' ? 'Your library' : kind === 'exile' ? 'Exile' : 'Your run deck';
  $('#collection-kind').textContent = kind.toUpperCase();
  $('#collection-note').textContent = kind === 'catalog' ? 'Reviewed rules only enter boosters and shops. Choose Ban list to see unsupported cards and their reasons.' : kind === 'library' ? 'Remaining cards, grouped and sorted. Draw order stays hidden.' : kind === 'exile' ? 'Exiled cards and monsters are removed for this encounter.' : 'Every card in your run deck, including cards currently in other zones. Inspect this between encounters or turns.';
  renderCollection(); hideCardPreview(); $('#collection-dialog').showModal();
}
function renderCollection() {
  hideCardPreview();
  const kind = state.collectionKind;
  const cards = kind === 'catalog' ? (state.catalogPool || (state.pool.length ? state.pool : BUNDLED_CARDS)) : kind === 'library' ? state.battle?.deck || [] : kind === 'exile' ? [...(state.battle?.exile || []), ...(state.battle?.enemyExile || [])] : state.deck;
  const groups = new Map();
  for (const card of cards) {
    const key = `${card.id || card.name}:${typeof isFoilCard59 === 'function' && isFoilCard59(card) ? 'foil' : 'regular'}:${typeof runCounterKey60 === 'function' ? runCounterKey60(card) : ''}`;
    if (groups.has(key)) groups.get(key).count += 1; else groups.set(key, { ...card, count: 1 });
  }
  const query = $('#collection-search').value.trim().toLowerCase();
  const seenFilter = kind === 'catalog' ? $('#collection-seen').value : '';
  state.collectionCards = [...groups.values()].filter(card => matchesCardFilters(card,query) && (kind!=='catalog'||!$('#collection-rules').value||rulesAudit(card).playable===($('#collection-rules').value==='playable')) && (!seenFilter || hasSeenCard(card) === (seenFilter === 'seen'))).sort((a, b) => (a.cmc || 0) - (b.cmc || 0) || a.name.localeCompare(b.name));
  const average = cards.length ? cards.reduce((sum, card) => sum + (card.cmc || 0), 0) / cards.length : 0;
  const seenCount = [...groups.values()].filter(hasSeenCard).length;
  const deckProgress = state.screen === 'combat-screen' && ['deck', 'library'].includes(kind) ? ` · Library ${libraryCardCount49()} / ${state.deck.length}` : '';
  $('#collection-stats').textContent = `${cards.length} cards · ${state.collectionCards.length} shown${kind === 'catalog' ? ` · ${seenCount} seen` : ''}${deckProgress} · average mana ${average.toFixed(1)}`;
  $('#collection-grid').innerHTML = state.collectionCards.length ? state.collectionCards.map((card, index) => collectionEntryMarkup(card, index, kind)).join('') : '<p class="collection-empty">No cards in this zone.</p>';
}
function collectionEntryMarkup(card, index, kind) {
  if (card.enemyKind) return `<div class="collection-monster">${walkerPortrait(card.enemyKind)}<b>${escapeHtml(card.name)}</b><span>Exiled monster</span></div>`;
  const seen = hasSeenCard(card);
  const catalog = kind === 'catalog' ? `<p class="catalog-discovery ${seen ? 'is-seen' : 'is-unseen'}" data-discovery-status="${seen ? 'seen' : 'unseen'}">${seen ? '✓ Seen' : '◌ Not seen'}</p><p class="catalog-keywords">${escapeHtml(displayKeywords(card).join(' · ') || 'No printed keywords')}</p><p class="catalog-audit">${rulesAudit(card).playable?'Playable · reviewed rules':`BANNED · ${escapeHtml(rulesAudit(card).reason)}`}</p><a class="catalog-source" href="${escapeHtml(card.uri)}" target="_blank" rel="noreferrer">Scryfall ↗</a>` : '';
  return `<article class="collection-entry"><button class="collection-card" data-preview-owner="collection" data-collection-index="${index}" aria-label="${card.count} copies of ${escapeHtml(card.name)}">${cardFace(card)}<span><b>${escapeHtml(card.name)}</b><strong>×${card.count}</strong></span></button>${catalog}</article>`;
}
$('#deck-button').addEventListener('click', () => openCollection('deck'));
$('#journey-deck-button').addEventListener('click', () => openCollection('deck'));
$('#library-button').addEventListener('click', () => openCollection('library'));
$('#exile-button').addEventListener('click', () => openCollection('exile'));
$('#collection-search').addEventListener('input', renderCollection);
$('#collection-close').addEventListener('click', () => { hideCardPreview(); $('#collection-dialog').close(); });
$('#collection-dialog').addEventListener('click', event => { if (event.target === $('#collection-dialog')) { hideCardPreview(); $('#collection-dialog').close(); } });

function hasFlash(card) { return hasKeywordLine(card.oracle_text || '', 'flash'); }
function isSummoningSick(creature, turn) { return Boolean(creature.summoningSick ?? isCreature(creature.card)) && turn <= creature.summonedTurn && !hasCreatureKeyword(creature,'haste'); }
function equipCost(card) {
  const match = (card.oracle_text || '').match(/(?:^|\n)Equip\s+((?:\{[^}]+\})+)/i);
  if (!match) return null;
  return [...match[1].matchAll(/\{([^}]+)\}/g)].reduce((sum, symbol) => sum + (/^\d+$/.test(symbol[1]) ? Number(symbol[1]) : 1), 0);
}
function legalBlockers(battle, attacker) {
  const blockers = blockerIds(battle,attacker.id).map(id=>battle.creatures.find(creature=>creature.id===id && !creature.tapped)).filter(creature=>creature && canBlockCreature(creature,attacker));
  return hasCreatureKeyword(attacker,'menace') && blockers.length < 2 ? [] : blockers;
}
function incomingThreat(attacker, blockers) {
  const hits = hasCreatureKeyword(attacker,'double strike') ? 2 : 1;
  if (!blockers.length) return Math.max(0,attacker.power) * hits;
  if (!hasCreatureKeyword(attacker,'trample')) return 0;
  let capacity = blockers.reduce((sum,blocker)=>sum + (hasCreatureKeyword(attacker,'deathtouch') ? 1 : Math.max(0,blocker.toughness-(blocker.damage||0))),0);
  let threat = 0;
  for(let hit=0;hit<hits;hit++){ threat += Math.max(0,attacker.power-capacity); capacity=Math.max(0,capacity-attacker.power); }
  return threat;
}
function syncCoins() { $('#coin-count').textContent=String(state.coins||0); $('#shop-coins').textContent=String(state.coins||0); $('#battle-coin-count').textContent=String(state.coins||0); }
function awardBounty(enemy) {
  if (!enemy || enemy.owner !== 'enemy' || enemy.bountyClaimed) return 0;
  enemy.bountyClaimed=true;
  if (typeof gainDefeatLevel59 === 'function') gainDefeatLevel59();
  const amount=enemy.bounty ?? 8;
  state.coins=(state.coins||0)+amount;syncCoins();addLog(`${enemy.card.name} defeated · +${amount} coins.`);
  return amount;
}
function shopPrice(card) { return 6+Math.ceil(card.cmc||0)*3; }
function showShop() {
  if(state.node<=1) return showJourney();
  if(!state.shop || state.shop.node!==state.node){
    let candidates=shuffle(state.pool.length?state.pool:BUNDLED_CARDS);
    const affordable=candidates.find(card=>shopPrice(card)<=(state.coins||0));
    const offers=affordable?[affordable,...candidates.filter(card=>card.id!==affordable.id).slice(0,2)]:candidates.slice(0,3);
    state.shop={node:state.node,offers:offers.map(card=>({card,price:shopPrice(card),sold:false}))};
  }
  state.shopDiscoveryView = {};
  renderShop();showScreen('shop-screen');
}
function renderShop(){
  syncCoins();
  styleTravelStop('shop-screen', 'shop-location', 'Trading post');
  const cards = state.shop.offers.map(offer => offer.card);
  const newCards = discoveryView(cards, state.shopDiscoveryView ||= {});
  recordSeenCards(cards);
  $('#shop-grid').innerHTML=state.shop.offers.map((offer,index)=>`<article class="shop-offer${offer.sold?' sold':''}"><div class="shop-card-face" data-preview-owner="shop" data-offer-index="${index}" tabindex="0" aria-label="Inspect ${escapeHtml(offer.card.name)}">${cardImageMarkup(offer.card, newCards.has(cardDiscoveryKey(offer.card)))}</div><h3 class="draft-card-name">${escapeHtml(offer.card.name)}</h3>${cardFactsMarkup(offer.card)}<button class="primary-button" data-buy-card="${index}" ${offer.sold||(state.coins||0)<offer.price?'disabled':''}>${offer.sold?'SOLD':`Buy · ${offer.price} coins`}</button></article>`).join('');
}
function buyShopCard(index){
  if(state.screen!=='shop-screen')return false;
  const offer=state.shop?.offers[index];
  if(!offer||offer.sold||(state.coins||0)<offer.price)return false;
  offer.sold=true;state.coins-=offer.price;state.deck.push(offer.card);renderShop();playSfx('select');
  showToast(`${offer.card.name} added to your run deck.`);return true;
}
$('#shop-grid').addEventListener('click',event=>{const button=event.target.closest('[data-buy-card]');if(button)buyShopCard(Number(button.dataset.buyCard));});
$('#shop-continue').addEventListener('click',showJourney);
$('#return-shop').addEventListener('click',showShop);

function canTapForMana(creature,battle=state.battle){return Boolean(battle && creature && /\{T\}: Add/i.test(creature.card.oracle_text||'') && !creature.tapped && !isSummoningSick(creature,battle.turn) && ['main','attack','enemy','blocks','damage'].includes(battle.phase));}
function tapForMana(id){const battle=state.battle;const creature=battle?.creatures.find(item=>item.id===id);if(!canTapForMana(creature,battle))return false;creature.tapped=true;for(const [id] of battle.blockAssignments){const keep=blockerIds(battle,id).filter(item=>item!==creature.id);if(keep.length)battle.blockAssignments.set(id,keep);else battle.blockAssignments.delete(id);}battle.floatingMana=(battle.floatingMana||0)+1;battle.maxMana+=1;syncMana(battle);battle.mulliganAvailable=false;renderBattle();playSfx('select');return true;}
function permanentActivationCost(card){return card.name==='Fountain of Renewal'?3:card.name==='Omen of the Sea'?3:null;}
function permanentActivationLabel51(permanent){const card=permanent.card;return `Pay ${permanentActivationCost(card)} · sacrifice · ${typeof permanentActionLabel==='function'?permanentActionLabel(card):card.name==='Fountain of Renewal'?'draw 1':'scry 2'}`;}
function canActivatePermanent(permanent,battle=state.battle){const cost=permanentActivationCost(permanent.card);return Boolean(battle && cost!==null && battle.mana>=cost && ['main','attack','enemy','blocks','damage'].includes(battle.phase));}
function activatePermanent(id){
 const battle=state.battle;const permanent=battle?.permanents.find(item=>item.id===id);if(!permanent||!canActivatePermanent(permanent,battle))return false;
 battle.mulliganAvailable=false;if(!payMana(permanentActivationCost(permanent.card),battle))return false;battle.permanents=battle.permanents.filter(item=>item!==permanent);battle.graveyard.push(permanent.card);
 if(permanent.card.name==='Fountain of Renewal')drawOneExtra();else beginScry(2,0);
 renderBattle();playSfx('cast');return true;
}
function onCreatureEntered(creature){if(!creature)return;const count=state.battle.permanents.filter(permanent=>permanent.card.name==='Angelic Chorus').length;if(count){state.playerHealth+=Math.max(0,creature.toughness)*count;playSfx('heal');}}
function beginScry(count,drawAfter=0){
 const battle=state.battle;const top=battle.deck.splice(Math.max(0,battle.deck.length-count)).reverse();
 if(!top.length){for(let n=0;n<drawAfter;n++)drawOneExtra();return;}
 battle.scry={cards:top.map(card=>({card,bottom:false})),drawAfter};renderScry();$('#scry-dialog').showModal();
}
function renderScry(){const scry=state.battle.scry;$('#scry-grid').innerHTML=scry.cards.map((entry,index)=>`<button data-scry-index="${index}" aria-pressed="${entry.bottom}" class="${entry.bottom?'to-bottom':''}">${cardFace(entry.card)}<b>${entry.bottom?'Move to bottom':'Keep on top'}</b></button>`).join('');}
function finishScry(){
 const battle=state.battle;const scry=battle?.scry;if(!scry)return;
 const bottom=scry.cards.filter(entry=>entry.bottom).map(entry=>entry.card);const top=scry.cards.filter(entry=>!entry.bottom).map(entry=>entry.card);
 battle.deck.unshift(...bottom.reverse());battle.deck.push(...top.reverse());battle.scry=null;
 $('#scry-dialog').close();for(let n=0;n<scry.drawAfter;n++)drawOneExtra();renderBattle();
}
$('#scry-grid').addEventListener('click',event=>{const button=event.target.closest('[data-scry-index]');if(!button||!state.battle?.scry)return;const entry=state.battle.scry.cards[Number(button.dataset.scryIndex)];entry.bottom=!entry.bottom;renderScry();});
$('#scry-confirm').addEventListener('click',finishScry);
$('#scry-dialog').addEventListener('cancel',event=>{event.preventDefault();finishScry();});
$('#creature-row').addEventListener('click',event=>{const button=event.target.closest('[data-unit-mana]');if(button)tapForMana(button.dataset.unitMana);});
$('#inspector-content').addEventListener('click',event=>{const button=event.target.closest('[data-activate-permanent]');if(button)activatePermanent(button.dataset.activatePermanent);});
$('#card-preview').addEventListener('click',event=>{const button=event.target.closest('[data-activate-permanent]');if(button){hideCardPreview();activatePermanent(button.dataset.activatePermanent);}});

function printedKeywords(card){return (card.keywords || [...COMBAT_KEYWORDS.filter(keyword=>hasKeywordLine(card.oracle_text||'',keyword)),...(hasFlash(card)?['flash']:[])]).map(keyword=>keyword.toLowerCase());}
function wardCostText(value){
 if(Number(value?.ward)>0)return `${Number(value.ward)} mana`;
 const card=value?.card||value;
 const raw=(card?.oracle_text||'').match(/\bWard\s*(?:[—–-]\s*)?([^\n(]+)/i)?.[1]?.trim().replace(/\.$/,'')||'';
 const mana=raw.match(/^((?:\{[^}]+\})+)/)?.[1];
 if(mana)return `${mana.replace(/[{}]/g,'')} mana`;
 const life=raw.match(/^Pay (\d+) life$/i);if(life)return `${life[1]} life`;
 const discard=raw.match(/^Discard (a|an|one|two|three|\d+) cards?$/i);
 if(discard){const n=Number(discard[1])||({a:1,an:1,one:1,two:2,three:3}[discard[1].toLowerCase()]);return `discard ${n} card${n===1?'':'s'}`;}
 return raw.replace(/^Pay /i,'').replace(/^Sacrifice (?:a|an) /i,'sac. 1 ').replace(/^Sacrifice /i,'sac. ');
}
function displayKeywords(card){
 const cost=wardCostText(card);
 return printedKeywords(card).map(keyword=>keyword==='ward'&&cost?`Ward (${cost})`:keyword);
}

function cardAudit(card){const unknown=printedKeywords(card).filter(keyword=>!SUPPORTED_KEYWORDS.includes(keyword));return{dataVerified:Boolean(card.verified),unknown,adapted:card.name==='Cancel'};}
function matchesCardFilters(card,query=''){
 const type=$('#collection-type').value;const mana=$('#collection-mana').value;const keyword=$('#collection-keyword').value;const color=$('#collection-color').value;
 return `${card.name} ${card.type_line} ${card.oracle_text||''}`.toLowerCase().includes(query) && (!type||(card.type_line||'').includes(type)) && (!mana||Math.ceil(card.cmc||0)===Number(mana)) && (!keyword||printedKeywords(card).includes(keyword)) && (!color||(color==='C'?!(card.color_identity||[]).length:(card.color_identity||[]).includes(color)));
}
$('#card-catalog-button').addEventListener('click',()=>{
  openCollection('catalog');
  if (state.pool.length) return;
  $('#collection-note').textContent='Loading the curated card list and Scryfall card details…';
  ensureCardPool().then(result=>{
    renderCollection();
    $('#collection-note').textContent=result.warning||'Card names, mana costs, rules text and images are loaded from Scryfall for this curated list.';
  });
});
for(const id of ['collection-type','collection-mana','collection-keyword','collection-color','collection-seen','collection-rules'])$('#'+id).addEventListener('change',renderCollection);
$('#scry-swap').addEventListener('click',()=>{if(state.battle?.scry){state.battle.scry.cards.reverse();renderScry();}});

function hasInvalidMenaceBlock(battle){return battle.enemyCreatures.some(enemy=>hasCreatureKeyword(enemy,'menace') && blockerIds(battle,enemy.id).filter(id=>battle.creatures.some(creature=>creature.id===id&&!creature.tapped)).length===1);}
function suggestBlocks(battle){
 const assignments=new Map();const available=battle.creatures.filter(creature=>!creature.tapped).sort((a,b)=>b.toughness-a.toughness);
 for(const attacker of battle.enemyCreatures.filter(creature=>creatureCanAttack(creature,battle.turn)).sort((a,b)=>b.power-a.power)){
  const legal=available.filter(blocker=>canBlockCreature(blocker,attacker));const needed=hasCreatureKeyword(attacker,'menace')?2:1;
  if(legal.length<needed)continue;const selected=legal.slice(0,needed);assignments.set(attacker.id,selected.map(creature=>creature.id));for(const creature of selected)available.splice(available.indexOf(creature),1);
 }
 return assignments;
}
