const CARD_QUERY = 'game:paper lang:en (t:creature or t:instant or t:sorcery or t:artifact or t:enchantment) cmc<=5';
const LAND_QUERY = 'game:paper lang:en t:basic t:land';
const API_BASE = 'https://api.scryfall.com/cards/search?q=';
const CACHE_KEY = 'booster-tutor-card-pool-arena-v4';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const COLOR_NAMES = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };

const FALLBACK_CARDS = [
  { id: 'demo-firebolt', name: 'Firebolt Spark', mana_cost: '{R}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo effect: Deals 4 damage.', power: '', toughness: '', image: '', art: '', color_identity: ['R'], uri: '' },
  { id: 'demo-sentinel', name: 'Dawnwatch Sentinel', mana_cost: '{1}{W}', cmc: 2, type_line: 'Creature — Human Soldier', oracle_text: 'A steadfast guard from the borderlands.', power: '2', toughness: '3', image: '', art: '', color_identity: ['W'], uri: '' },
  { id: 'demo-spark', name: 'Star Shard', mana_cost: '{2}{U}', cmc: 3, type_line: 'Sorcery', oracle_text: 'Demo effect: Draw a card and gain 3 shield.', power: '', toughness: '', image: '', art: '', color_identity: ['U'], uri: '' },
  { id: 'demo-wolf', name: 'Mistywood Wolf', mana_cost: '{1}{G}', cmc: 2, type_line: 'Creature — Wolf', oracle_text: 'A swift hunter that attacks each turn.', power: '3', toughness: '2', image: '', art: '', color_identity: ['G'], uri: '' },
  { id: 'demo-mending', name: 'Soul Mending', mana_cost: '{1}{B}', cmc: 2, type_line: 'Instant', oracle_text: 'Demo effect: Restore 5 life.', power: '', toughness: '', image: '', art: '', color_identity: ['B'], uri: '' },
  { id: 'demo-golem', name: 'Basalt Golem', mana_cost: '{3}', cmc: 3, type_line: 'Artifact Creature — Golem', oracle_text: 'A lumbering machine carved from ancient stone.', power: '3', toughness: '4', image: '', art: '', color_identity: [], uri: '' },
  { id: 'demo-vines', name: 'Grasping Vines', mana_cost: '{G}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo effect: Your strongest ally gets +2/+2.', power: '', toughness: '', image: '', art: '', color_identity: ['G'], uri: '' },
  { id: 'demo-bat', name: 'Duskwing Bat', mana_cost: '{2}{B}', cmc: 3, type_line: 'Creature — Bat', oracle_text: 'Flying, lifelink', power: '2', toughness: '2', image: '', art: '', color_identity: ['B'], uri: '' }
];

const FALLBACK_LANDS = COLORS.map((color) => ({
  id: `demo-land-${color}`,
  name: COLOR_NAMES[color],
  mana_cost: '',
  cmc: 0,
  type_line: `Basic Land — ${COLOR_NAMES[color]}`,
  oracle_text: '{T}: Add one mana.',
  power: '',
  toughness: '',
  image: '',
  art: '',
  color_identity: [color],
  uri: ''
}));

const ENCOUNTERS = [
  { name: 'Mosswood Ambush', rank: 'SKIRMISH', location: 'THE FORGOTTEN GLADE', foeCount: 2 },
  { name: 'Rune Hunter Patrol', rank: 'ELITE', location: 'THE BROKEN PASS', foeCount: 3 },
  { name: 'Thornwild Pack', rank: 'ELITE', location: 'THE ROOT VAULT', foeCount: 3 },
  { name: 'The Shard Dragon', rank: 'BOSS', location: 'THE CROWN CHAMBER', foeCount: 4 }
];

const state = {
  pool: [],
  landPool: [],
  deck: [],
  packs: [],
  selection: new Map(),
  draftKind: 'starter',
  playerHealth: 30,
  node: 1,
  battle: null,
  soundOn: true,
  audio: null,
  toastTimer: null,
  openingTimer: null,
  nextPermanentId: 1
};

const $ = (selector) => document.querySelector(selector);
const screens = ['start-screen', 'loading-screen', 'draft-screen', 'combat-screen', 'journey-screen', 'end-screen'];

function showScreen(id) {
  for (const screen of screens) $('#' + screen).classList.toggle('active', screen === id);
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
    haste: hasKeywordLine(text, 'haste')
  };
}

function hasCreatureKeyword(creature, keyword) {
  const property = {
    'double strike': 'doubleStrike',
    'first strike': 'firstStrike'
  }[keyword] || keyword;
  return Boolean(creature?.[property] || creature?.temporaryKeywords?.includes(keyword));
}

function canBlockCreature(blocker, attacker) {
  return !hasCreatureKeyword(attacker, 'flying') || hasCreatureKeyword(blocker, 'flying') || hasCreatureKeyword(blocker, 'reach');
}

function creatureKeywordLabels(creature) {
  const labels = [
    ['flying', 'Flying'],
    ['lifelink', 'Lifelink'],
    ['double strike', 'Double strike'],
    ['first strike', 'First strike'],
    ['deathtouch', 'Deathtouch'],
    ['reach', 'Reach']
  ];
  return labels.filter(([keyword]) => hasCreatureKeyword(creature, keyword)).map(([, label]) => label).join(' · ');
}

function imageFor(card, size = 'normal') {
  if (card.image_uris?.[size]) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris?.[size]) return card.card_faces[0].image_uris[size];
  return '';
}

function normalizeCard(card) {
  const face = card.card_faces?.[0] || {};
  return {
    id: card.id,
    name: card.name || face.name || 'Unknown card',
    mana_cost: card.mana_cost || face.mana_cost || '',
    cmc: Number(card.cmc ?? face.cmc ?? 0),
    type_line: card.type_line || face.type_line || 'Magic card',
    oracle_text: card.oracle_text || face.oracle_text || '',
    power: card.power || face.power || '',
    toughness: card.toughness || face.toughness || '',
    image: imageFor(card, 'normal'),
    art: imageFor(card, 'art_crop'),
    color_identity: card.color_identity || [],
    uri: card.scryfall_uri || ''
  };
}

function validSpell(card) {
  return card && card.name && !isLand(card) && card.cmc <= 5 && card.cmc >= 0 ;
}

function validBasicLand(card) {
  return isLand(card) && /\bBasic\b/i.test(card.type_line) && COLORS.some((color) => cardColor(card) === color);
}

function apiSearch(query) {
  const url = API_BASE + encodeURIComponent(query) + '&order=random&unique=cards';
  return fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }).then((response) => {
    if (!response.ok) throw new Error('Card service returned ' + response.status);
    return response.json();
  });
}

async function loadCardPool() {
  let cached = null;
  try { cached = localStorage.getItem(CACHE_KEY); } catch { /* Storage is optional. */ }
  if (cached) {
    try {
      const value = JSON.parse(cached);
      if (Date.now() - value.savedAt < CACHE_TTL && value.cards?.length >= 15 && value.lands?.length >= 5) {
        return { cards: value.cards, lands: value.lands, cached: true };
      }
    } catch { /* Ignore malformed browser cache. */ }
  }

  $('#loading-message').textContent = 'Shuffling cards and basic lands from the card database.';
  try {
    const [spellPayload, landPayload] = await Promise.all([apiSearch(CARD_QUERY), apiSearch(LAND_QUERY)]);
    const cards = (spellPayload.data || []).map(normalizeCard).filter(validSpell);
    const lands = (landPayload.data || []).map(normalizeCard).filter(validBasicLand);
    if (cards.length < 15 || lands.length < 5) throw new Error('The card selection is too small.');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards, lands })); } catch { /* Continue without browser caching. */ }
    return { cards, lands, cached: false };
  } catch (error) {
    if (cached) {
      try {
        const stale = JSON.parse(cached);
        if (stale.cards?.length && stale.lands?.length) return { cards: stale.cards, lands: stale.lands, cached: true, warning: 'Offline: using saved cards.' };
      } catch { /* Use local demo cards below. */ }
    }
    return { cards: FALLBACK_CARDS, lands: FALLBACK_LANDS, cached: false, fallback: true, warning: 'Card service unavailable — using offline demo cards.' };
  }
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
  while (available.length < count) available.push(...shuffle(FALLBACK_CARDS));
  return available.slice(0, count);
}

function makeStarterPacks() {
  const cards = shuffle(state.pool);
  const creatures = shuffle(state.pool.filter(isCreature));
  if (creatures.length) { const i = cards.findIndex(c => c.id === creatures[0].id); cards.splice(i, 1); cards.unshift(creatures[0]); }
  while (cards.length < 15) cards.push(...shuffle(FALLBACK_CARDS));
  return [cards.slice(0, 5), cards.slice(5, 10), cards.slice(10, 15)];
}

function startNewRun() {
  if (state.soundOn) {
    try {
      state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
      state.audio.resume().catch(() => {});
    } catch { /* Sound is optional. */ }
  }
  state.deck = [];
  state.relic = null;
  state.playerHealth = 30;
  state.node = 1;
  state.battle = null;
  state.selection.clear();
  showScreen('loading-screen');
  loadCardPool().then(({ cards, lands, cached, fallback, warning }) => {
    state.pool = cards;
    state.landPool = lands;
    const status = $('#start-api-status span');
    status.textContent = fallback ? 'OFFLINE DEMO' : cached ? 'SCRYFALL · CACHE' : 'SCRYFALL · CONNECTED';
    status.style.color = fallback ? '#f0af83' : '#78dcb5';
    if (warning) showToast(warning);
    state.packs = makeStarterPacks();
    state.draftKind = 'starter';
    renderDraft();
    showScreen('draft-screen');
    animateBoosterOpening();
    playSound(440, 0.07);
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

function createEnemyCreature(card) {
  const stats = parseStats(card);
  const bonus = Math.floor((state.node - 1) / 2);
  return {
    id: `enemy-${state.nextPermanentId++}`,
    card,
    power: stats.power + bonus,
    toughness: stats.toughness + bonus,
    owner: 'enemy',
    health: Math.max(3, stats.toughness + bonus + state.node),
    maxHealth: Math.max(3, stats.toughness + bonus + state.node),
    summoningSick: !/\bArtifact\b/i.test(card.type_line || ''),
    summonedTurn: 1,
    tapped: false,
    ...creatureKeywords(card)
  };
}

function createEnemyTeam(encounter) {
  const source = state.pool.filter(card => isCreature(card) && card.cmc <= Math.min(5, state.node + 1));
  const cards = shuffle(source.length ? source : FALLBACK_CARDS.filter(isCreature));
  while (cards.length < encounter.foeCount) cards.push(...shuffle(source.length ? source : FALLBACK_CARDS.filter(isCreature)));
  return cards.slice(0, encounter.foeCount).map(createEnemyCreature);
}

function effectSummary(card) {
  const text = card.oracle_text || '';
  if (card.id === 'demo-spark') return 'Draw 1 card · gain 3 shield';
  if (card.id === 'demo-mending') return 'Restore 5 life';
  if (isLand(card)) return 'Land · adds 1 shared mana';
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywordLabels(creatureKeywords(card));
    return `Creature ${stats.power}/${stats.toughness} · ${keywords || 'attacks each turn'}`;
  }
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(?:a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  if (damage) return `Damage: ${damage[1]} · directly to the enemy`;
  if (life) return `Restore ${life[1]} life`;
  if (draw) return 'Draw an extra card';
  if (buff) return `${/until end of turn/i.test(text) ? 'Until end of turn: ' : ''}Changes a creature by ${buff[1]}/${buff[2]}`;
  const grant = text.match(/gains?\s+([^.;\n]+?)\s+until end of turn/i);
  if (grant) return `Grants ${grant[1]} until end of turn`;
  if (/counter target/i.test(text)) return 'Counters an enemy spell: shield';
  if (/create .*token/i.test(text)) return 'Creates a small token';
  return `Roguelike spell effect: ${Math.max(3, card.cmc * 2 + 2)} damage`;
}

function makeCardMarkup(card, packIndex, cardIndex, selected) {
  const image = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} card image" loading="lazy" />`
    : '<div class="card-fallback-art" aria-hidden="true">✦</div>';
  const stat = isCreature(card) ? ` · ${escapeHtml(card.power || '?')}/${escapeHtml(card.toughness || '?')}` : '';
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" style="--card-index:${cardIndex}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.type_line)}, ${escapeHtml(String(Math.ceil(card.cmc || 0)) + ' generic mana')}${selected ? ', selected' : ''}">
    <div class="card-image-wrap">${image}<span class="card-cost card-mana-cost">${manaCostHtml(card)}</span></div>
    <span class="draft-card-name">${escapeHtml(card.name)}${stat}</span>
    <p class="draft-card-type">${escapeHtml(card.type_line)}</p>
    <div class="draft-card-effect">${escapeHtml(effectSummary(card))}</div>
  </button>`;
}

function selectedDraftCards() {
  const requiredPacks = state.draftKind === 'starter' ? [0, 1, 2] : [0];
  if (state.packs.length !== requiredPacks.length || state.selection.size !== requiredPacks.length) return null;
  const cards = requiredPacks.map((packIndex) => {
    const cardIndex = state.selection.get(packIndex);
    return Number.isInteger(cardIndex) ? state.packs[packIndex]?.[cardIndex] : null;
  });
  return cards.every(Boolean) ? cards : null;
}

function renderDraft() {
  const starter = state.draftKind === 'starter';
  const validPackIndexes = new Set(starter ? [0, 1, 2] : [0]);
  for (const [packIndex, cardIndex] of state.selection) {
    if (!validPackIndexes.has(packIndex) || !state.packs[packIndex]?.[cardIndex]) state.selection.delete(packIndex);
  }
  const picks = selectedDraftCards();
  $('#draft-step').textContent = starter ? '3 BOOSTERS · 15 CARDS' : `RUN ${String(state.node).padStart(2, '0')} / 04`;
  $('#draft-title').textContent = starter ? 'Three boosters are ready' : 'Booster reward';
  $('#draft-instruction').textContent = starter
    ? 'Choose exactly one card from each booster. Each pick adds four copies to your deck.'
    : 'Choose one card. It will add four copies to your deck.';
  $('#pack-number').textContent = starter ? '03 × 05' : String(state.node + 1).padStart(2, '0');
  $('#deck-count').textContent = String(state.deck.length + state.selection.size * 4);
  $('#draft-grid').innerHTML = state.packs.map((pack, packIndex) => {
    const selectedIndex = state.selection.get(packIndex);
    return `<section class="booster-pack" style="--pack-index:${packIndex}"><header><span>BOOSTER ${String(packIndex + 1).padStart(2, '0')}</span><small>${selectedIndex === undefined ? 'CHOOSE 1 CARD' : '1 / 1 CHOSEN'}</small></header><div class="booster-cards">${pack.map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, selectedIndex === cardIndex)).join('')}</div></section>`;
  }).join('');
  $('#selection-status').textContent = starter
    ? `Chosen: ${state.selection.size} / 3 boosters · Your starter deck will have 12 draft cards + 4 starting creatures.`
    : `Chosen: ${state.selection.size} / 1 card · +4 copies`;
  $('#draft-confirm').disabled = !picks;
  $('#draft-confirm').innerHTML = starter ? 'BUILD DECK <span>→</span>' : 'ADD CARD <span>→</span>';
}

$('#draft-grid').addEventListener('click', (event) => {
  const button = event.target.closest('.draft-option');
  if (!button) return;
  const packIndex = Number(button.dataset.packIndex);
  const cardIndex = Number(button.dataset.cardIndex);
  if (!Number.isInteger(packIndex) || !Number.isInteger(cardIndex) || !state.packs[packIndex]?.[cardIndex]) return;
  if (state.selection.get(packIndex) === cardIndex) state.selection.delete(packIndex);
  else state.selection.set(packIndex, cardIndex);
  clearTimeout(state.openingTimer);
  $('#draft-screen').classList.remove('opening');
  renderDraft();
  playSound(560, 0.045);
});

$('#draft-confirm').addEventListener('click', confirmDraft);

$('#enemy-board').addEventListener('click', (event) => {
  const button = event.target.closest('[data-enemy-attacker]');
  const battle = state.battle;
  if (!button || !battle || battle.phase !== 'blocks') return;
  const attackerId = button.dataset.enemyAttacker;
  const attacker = battle.enemyCreatures.find((creature) => creature.id === attackerId);
  if (!attacker || !creatureCanAttack(attacker, battle.turn)) return;
  battle.selectedEnemyAttackerId = battle.selectedEnemyAttackerId === attackerId ? null : attackerId;
  renderBattle();
});

$('#creature-row').addEventListener('click', (event) => {
  const button = event.target.closest('[data-creature-id]');
  const battle = state.battle;
  if (!button || !battle) return;
  const creature = battle.creatures.find((item) => item.id === button.dataset.creatureId);
  if (!creature) return;
  if (battle.phase === 'blocks') {
    if (creature.tapped) return;
    if (!battle.selectedEnemyAttackerId) return showToast('Choose an attacker on the right first.');
    return assignBlocker(battle.selectedEnemyAttackerId, creature.id);
  }
  if (battle.phase !== 'main' || !creatureCanAttack(creature, battle.turn)) return;
  creature.willAttack = creature.willAttack === false;
  addLog(creature.willAttack ? `${creature.card.name} will attack.` : `${creature.card.name} will stay back to block.`);
  renderBattle();
  playSound(creature.willAttack ? 570 : 420, 0.055);
});

$('#creature-row').addEventListener('dragstart', (event) => {
  const button = event.target.closest('[data-creature-id]');
  if (!button || state.battle?.phase !== 'blocks' || button.disabled) return event.preventDefault();
  event.dataTransfer.setData('application/x-booster-tutor-blocker', button.dataset.creatureId);
  event.dataTransfer.effectAllowed = 'move';
});

$('#enemy-board').addEventListener('dragover', (event) => {
  if (event.dataTransfer.types.includes('application/x-booster-tutor-blocker')) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    $('#enemy-board').classList.add('block-drop-ready');
  }
});

$('#enemy-board').addEventListener('dragleave', (event) => {
  if (!$('#enemy-board').contains(event.relatedTarget)) $('#enemy-board').classList.remove('block-drop-ready');
});

$('#enemy-board').addEventListener('drop', (event) => {
  const blockerId = event.dataTransfer.getData('application/x-booster-tutor-blocker');
  if (!blockerId) return;
  event.preventDefault();
  event.stopPropagation();
  $('#enemy-board').classList.remove('block-drop-ready');
  const attacker = event.target.closest('[data-enemy-attacker]');
  if (attacker) assignBlocker(attacker.dataset.enemyAttacker, blockerId);
  else showToast('Drag your creature onto an enemy attacker.');
});

function confirmDraft() {
  const starter = state.draftKind === 'starter';
  const selected = selectedDraftCards();
  if (!selected) {
    showToast(starter ? 'Choose exactly one card from each of the three boosters.' : 'Choose a card from the booster first.');
    return;
  }
  for (const card of selected) for (let i = 0; i < 4; i += 1) state.deck.push(card);
  if (starter) state.deck.push(...FALLBACK_CARDS.filter(isCreature).slice(0, 2).flatMap(card => [card, card]));
  state.selection.clear();
  showJourney();
}

function cardColor(card) {
  const line = card.type_line || '';
  const match = line.match(/Basic Land — (Plains|Island|Swamp|Mountain|Forest)/i);
  if (match) return ({ plains: 'W', island: 'U', swamp: 'B', mountain: 'R', forest: 'G' })[match[1].toLowerCase()];
  for (const color of COLORS) if ((card.color_identity || []).includes(color)) return color;
  return 'G';
}

function generateStarterLands(total) {
  const pool = state.landPool.length ? state.landPool : FALLBACK_LANDS;
  return Array.from({ length: total }, () => {
    const card = pool[Math.floor(Math.random() * pool.length)];
    return { ...card, color: cardColor(card), instanceId: `land-${state.nextPermanentId++}` };
  });
}

function beginBattle(node) {
  state.node = node;
  const enemy = ENCOUNTERS[node - 1];
  const enemyCreatures = createEnemyTeam(enemy);
  state.battle = {
    enemy,
    enemyArt: enemyCreatures[0]?.card.art || '',
    enemyCreatures,
    playerBlock: state.relic === 'ward' ? 4 : 0,
    mana: state.relic === 'crystal' ? 4 : 3,
    maxMana: state.relic === 'crystal' ? 4 : 3,
    mulliganAvailable: true,
    landAvailable: true,
    turn: 1,
    phase: 'main',
    deck: shuffle(state.deck),
    graveyard: [],
    enemyGraveyard: [],
    hand: [],
    creatures: [],
    selectedEnemyAttackerId: null,
    blockAssignments: new Map(),
    turnEffects: [],
    lands: [],
    log: []
  };
  drawToHand(5);
  addLog(`${enemy.name} confronts you with ${enemyCreatures.length} creatures. Your generic mana refills each turn. Defeat every enemy to advance.`);
  renderBattle();
  showScreen('combat-screen');
  playSound(330, 0.1);
}

function addLog(message) {
  if (!state.battle) return;
  state.battle.log.unshift(message);
  state.battle.log = state.battle.log.slice(0, 4);
}

function reshuffleGraveyard() {
  const battle = state.battle;
  if (!battle || battle.deck.length || !battle.graveyard.length) return;
  battle.deck = shuffle(battle.graveyard);
  battle.graveyard = [];
  addLog('Your graveyard was shuffled back into your library.');
}

function drawToHand(maxHand) {
  const battle = state.battle;
  if (!battle) return;
  while (battle.hand.length < maxHand) {
    reshuffleGraveyard();
    if (!battle.deck.length) break;
    battle.hand.push(battle.deck.pop());
  }
}

function freeMulligan() {
  const battle = state.battle;
  if (!battle || !battle.mulliganAvailable || battle.turn !== 1 || battle.phase !== 'main') return;
  battle.deck = shuffle([...battle.deck, ...battle.hand]);
  battle.hand = [];
  battle.mulliganAvailable = false;
  drawToHand(5);
  addLog('Free mulligan: Your opening hand was shuffled back. Draw five cards.');
  renderBattle();
  playSound(740, 0.14);
}

function paymentPlan(card) {
  return state.battle && state.battle.mana >= Math.ceil(card.cmc || 0) ? [] : null;
}

function defaultTarget(card) {
  const text = (card.oracle_text || '').toLowerCase();
  return isLand(card) || isCreature(card) || /you gain|draw |gets? \+|target creature|lifelink/i.test(text) ? 'player' : 'enemy';
}

function creatureCanAttack(creature, turn) {
  const cardHasSickness = isCreature(creature.card) && !/\bArtifact\b/i.test(creature.card.type_line || '');
  const sick = creature.summoningSick ?? cardHasSickness;
  return !sick || turn > creature.summonedTurn || hasCreatureKeyword(creature, 'haste');
}

function assignedBlockerName(battle, attackerId) {
  const blockerId = battle.blockAssignments.get(attackerId);
  return battle.creatures.find((creature) => creature.id === blockerId)?.card.name || '';
}

function renderEnemyBoard() {
  const battle = state.battle;
  if (!battle) return;
  const blocking = battle.phase === 'blocks';
  const attackers = battle.enemyCreatures.filter((creature) => creatureCanAttack(creature, battle.turn));
  const totalAttack = attackers.reduce((sum, creature) => sum + creature.power, 0);
  const units = battle.enemyCreatures.map((creature) => {
    const ready = creatureCanAttack(creature, battle.turn);
    const selected = battle.selectedEnemyAttackerId === creature.id;
    const blocker = assignedBlockerName(battle, creature.id);
    const image = creature.card.image;
    const keywords = creatureKeywordLabels(creature);
    const life = Math.max(0, creature.health);
    const lifePercent = Math.max(0, life / creature.maxHealth * 100);
    const status = blocker ? `Blocked by ${blocker}` : ready ? 'Ready to attack' : 'Summoning sick';
    return `<button type="button" class="enemy-creature${ready ? '' : ' resting'}${selected ? ' selected' : ''}" data-enemy-attacker="${escapeHtml(creature.id)}" data-preview-owner="enemy" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(creature.card.name)}, ${creature.power}/${creature.toughness}, ${life} of ${creature.maxHealth} life. Hover to inspect the card." aria-disabled="${!blocking || !ready}">
      <span class="enemy-card-frame">${image ? `<img class="enemy-creature-art" src="${escapeHtml(image)}" alt="${escapeHtml(creature.card.name)}" loading="lazy" />` : '<span class="enemy-creature-art fallback">✦</span>'}</span>
      <span class="enemy-creature-meta"><b>${escapeHtml(creature.card.name)}</b><span class="enemy-creature-stats">${creature.power}/${creature.toughness}</span>
      <span class="enemy-life-label">${life} / ${creature.maxHealth} LIFE</span><span class="enemy-life-track"><i style="width:${lifePercent}%"></i></span>
      <small class="enemy-keywords">${escapeHtml(keywords || status)}</small>${blocker ? `<small class="enemy-block-status">${escapeHtml(status)}</small>` : ''}</span>
    </button>`;
  }).join('');
  const phaseNote = blocking
    ? `Choose an attacker to block · ${totalAttack} total power`
    : `${battle.enemyCreatures.length} ${battle.enemyCreatures.length === 1 ? 'enemy' : 'enemies'} · ${totalAttack} attack power this turn`;
  $('#enemy-board').innerHTML = `<div class="enemy-creatures-row">${units || '<div class="empty-enemy-board">All enemies defeated.</div>'}</div><div class="enemy-attack-row"><span class="enemy-intent"><span class="intent-icon">⚔</span>${escapeHtml(phaseNote)}</span></div>`;
}

function renderGraveyard() {
  const graveyard = state.battle?.graveyard || [];
  $('#graveyard-count').textContent = String(graveyard.length);
  $('#graveyard-empty').hidden = graveyard.length > 0;
  $('#graveyard-grid').innerHTML = graveyard.slice().reverse().map((card, reverseIndex) => {
    const index = graveyard.length - reverseIndex - 1;
    const image = card.image
      ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
      : '<span class="graveyard-fallback">✦</span>';
    return `<button type="button" class="graveyard-card" data-preview-owner="graveyard" data-preview-index="${index}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.type_line)}. Hover to inspect.">${image}<span><b>${escapeHtml(card.name)}</b><small>${escapeHtml(card.type_line)}</small></span></button>`;
  }).join('');
}

function previewCardFor(element) {
  const battle = state.battle;
  if (!battle) return null;
  const owner = element.dataset.previewOwner;
  if (owner === 'hand') return battle.hand[Number(element.dataset.handIndex)] || null;
  if (owner === 'player') return battle.creatures.find((creature) => creature.id === element.dataset.previewId)?.card || null;
  if (owner === 'enemy') return battle.enemyCreatures.find((creature) => creature.id === element.dataset.previewId)?.card || null;
  if (owner === 'graveyard') return battle.graveyard[Number(element.dataset.previewIndex)] || null;
  return null;
}

function showCardPreview(card) {
  const preview = $('#card-preview');
  if (!card) return hideCardPreview();
  const image = card.image
    ? `<img class="card-preview-image" src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" />`
    : '<div class="card-preview-fallback">✦</div>';
  preview.innerHTML = `${image}<div class="card-preview-copy"><b>${escapeHtml(card.name)}</b><small>${escapeHtml(card.type_line || '')} · ${escapeHtml(String(Math.ceil(card.cmc || 0)) + ' generic mana')}</small><p>${escapeHtml(card.oracle_text || effectSummary(card))}</p></div>`;
  preview.hidden = false;
}

function hideCardPreview() {
  $('#card-preview').hidden = true;
  $('#card-preview').replaceChildren();
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  $('#node-counter').textContent = String(state.node).padStart(2, '0');
  $('#location-name').textContent = enemy.location;
  $('#enemy-rank').textContent = enemy.rank;
  $('#enemy-name').textContent = enemy.name;
  const enemyCount = battle.enemyCreatures.length;
  $('#enemy-count-label').textContent = `${enemyCount} ${enemyCount === 1 ? 'ENEMY REMAINS' : 'ENEMIES REMAIN'}`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)} / 30`;
  $('#player-health-fill').style.width = `${Math.max(0, state.playerHealth / 30 * 100)}%`;
  const availableMana = battle.mana;
  $('#mana-label').textContent = `${availableMana} / ${battle.maxMana}`;
  $('#land-status').textContent = 'Generic · refills every turn';
  $('#land-count').textContent = `${battle.lands.length}`;
  $('#land-row').innerHTML = battle.lands.length ? battle.lands.map((land) => {
    const image = land.card.image ? `<img src="${escapeHtml(land.card.image)}" alt="${escapeHtml(land.card.name)}" loading="lazy" />` : `<span class="land-color land-${land.color.toLowerCase()}">◆</span>`;
    return `<div class="land-permanent${land.tapped ? ' tapped' : ''}" title="${escapeHtml(land.card.name)} · adds 1 shared mana">${image}<small>+1</small></div>`;
  }).join('') : '<div class="empty-land-zone">Drag a land from your hand here to add mana.</div>';
  $('#enemy-art-image').src = battle.enemyArt || '';
  $('#enemy-art-image').hidden = !battle.enemyArt;
  $('#enemy-art .enemy-sprite').hidden = Boolean(battle.enemyArt);
  $('#end-turn-button').innerHTML = battle.phase === 'blocks' ? 'CONFIRM BLOCKS <span>✓</span>' : 'END TURN <span>→</span>';
  $('#combat-action-hint').textContent = battle.phase === 'blocks'
    ? 'Blocking: choose an attacker on the right, then click or drag one of your creatures onto it.'
    : 'Click a creature to hold it back · your deck automatically refills to five cards.';
  $('#combat-action-hint').classList.toggle('blocking', battle.phase === 'blocks');
  $('#turn-label').textContent = `TURN ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < state.node ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Fight ${index + 1}"></i>`).join('');
  $('#graveyard-count').textContent = String(battle.graveyard.length);
  $('#library-count').textContent = String(battle.deck.length);
  $('#hand-count').textContent = `${battle.hand.length} CARDS`;
  $('#mulligan-button').disabled = !battle.mulliganAvailable || battle.phase !== 'main';
  $('#mulligan-button').innerHTML = battle.mulliganAvailable ? 'FREE MULLIGAN <span>↻</span>' : 'MULLIGAN USED';
  $('#creature-count').textContent = `${battle.creatures.length} / 3`;
  $('#battle-log').innerHTML = battle.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  renderEnemyBoard();
  renderHand();
  renderCreatures();
  renderGraveyard();
  renderDropZones();
}

function renderHand() {
  const battle = state.battle;
  if (!battle) return;
  const fanCenter = (battle.hand.length - 1) / 2;
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const image = card.image
      ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
      : '<div class="hand-fallback" aria-hidden="true">✦</div>';
    const isPlayableLand = isLand(card) && battle.landAvailable;
    const canPay = isLand(card) ? isPlayableLand : Boolean(paymentPlan(card));
    const boardFull = isCreature(card) && battle.creatures.length >= 3;
    const blocked = !canPay || boardFull;
    const fanPosition = index - fanCenter;
    const fanStyle = `--fan-angle:${fanPosition * 2.3}deg;--fan-lift:${Math.abs(fanPosition) * 4}px;--fan-index:${index}`;
    return `<button class="hand-card${isLand(card) ? ' land-in-hand' : ''}${battle.phase === 'blocks' ? ' paused' : ''}" style="${fanStyle}" data-hand-index="${index}" data-preview-owner="hand" draggable="${battle.phase === 'main'}" ${battle.phase === 'blocks' ? 'disabled' : ''} title="${escapeHtml(card.name)} · ${escapeHtml(String(Math.ceil(card.cmc || 0)) + ' generic mana')}${blocked ? ' · not currently playable' : ''}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(String(Math.ceil(card.cmc || 0)) + ' generic mana')}, drag and drop to play">
      ${image}<span class="hand-card-cost">${manaCostHtml(card)}</span><span class="hand-card-name">${escapeHtml(card.name)}</span>${blocked ? '<span class="card-unavailable">–</span>' : ''}
    </button>`;
  }).join('');
  $('#hand-row').querySelectorAll('.hand-card').forEach((button) => {
    button.addEventListener('click', () => playCard(Number(button.dataset.handIndex), defaultTarget(battle.hand[Number(button.dataset.handIndex)])));
    button.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', button.dataset.handIndex);
      event.dataTransfer.effectAllowed = 'move';
      button.classList.add('dragging');
    });
    button.addEventListener('dragend', () => button.classList.remove('dragging'));
  });
}

function renderCreatures() {
  const battle = state.battle;
  const creatures = battle.creatures;
  if (!creatures.length) {
    $('#creature-row').innerHTML = '<div class="empty-board">Drag creatures here or play one from your hand.</div>';
    return;
  }
  $('#creature-row').innerHTML = creatures.map((creature) => {
    const image = creature.card.image ? `<img class="player-card-image" src="${escapeHtml(creature.card.image)}" alt="${escapeHtml(creature.card.name)}" loading="lazy" />` : '<span class="creature-symbol">✦</span>';
    const waiting = !creatureCanAttack(creature, battle.turn);
    const assignment = [...battle.blockAssignments.entries()].find(([, blockerId]) => blockerId === creature.id);
    const assignedAttacker = battle.enemyCreatures.find((item) => item.id === assignment?.[0])?.card.name;
    const selectedAttacker = battle.enemyCreatures.find((item) => item.id === battle.selectedEnemyAttackerId);
    const legalBlocker = !selectedAttacker || canBlockCreature(creature, selectedAttacker);
    const selected = battle.phase === 'blocks' && battle.selectedEnemyAttackerId && !creature.tapped && legalBlocker;
    const blocking = battle.phase === 'blocks';
    const willAttack = !waiting && creature.willAttack !== false;
    const keywords = creatureKeywordLabels(creature);
    const status = blocking
      ? assignment ? `Blocking ${escapeHtml(assignedAttacker || 'enemy')}` : creature.tapped ? 'Already attacked' : 'Choose as blocker'
      : waiting ? 'Summoning sick · waits until next turn' : willAttack ? 'Attacks at end of turn' : 'Held back to block';
    const damage = Math.max(0, creature.damage || 0);
    return `<button type="button" class="creature-token${blocking && !creature.tapped ? ' can-block' : ''}${selected ? ' blocker-target' : ''}${assignment ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${!blocking && !waiting && !willAttack ? ' held-back' : ''}" data-creature-id="${escapeHtml(creature.id)}" data-preview-owner="player" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(assignment) : !waiting && !willAttack}" draggable="${blocking && !creature.tapped}" title="${escapeHtml(creature.card.name)} · ${creature.power}/${creature.toughness}${assignedAttacker ? ` · blocking ${escapeHtml(assignedAttacker)}` : ''}">
      <span class="player-card-frame">${image}<b class="creature-stats">${creature.power}/${creature.toughness}</b></span><span class="creature-meta"><b>${escapeHtml(creature.card.name)}</b>${keywords ? `<small class="creature-keywords">${escapeHtml(keywords)}</small>` : ''}<small class="${waiting ? 'summoning-sick' : ''}">${status}</small>${damage ? `<small class="creature-damage">${damage} damage marked</small>` : ''}</span>
    </button>`;
  }).join('');
}

function renderDropZones() {
  document.querySelectorAll('.drop-zone').forEach((zone) => {
    if (zone.dataset.dropBound === 'true') return;
    zone.dataset.dropBound = 'true';
    zone.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      zone.classList.add('drop-ready');
    });
    zone.addEventListener('dragleave', (event) => {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove('drop-ready');
    });
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('drop-ready');
      const index = Number(event.dataTransfer.getData('text/plain'));
      const side = zone.dataset.side || (zone.dataset.zone ? 'player' : 'enemy');
      playCard(index, side);
    });
  });
}

function drawOneExtra() {
  const battle = state.battle;
  if (battle.hand.length < 7) drawToHand(battle.hand.length + 1);
}

function damageFirstEnemy(amount) {
  const battle = state.battle;
  const enemy = battle?.enemyCreatures.find((creature) => creature.health > 0);
  if (!enemy || amount <= 0) return 0;
  enemy.health = Math.max(0, enemy.health - amount);
  if (enemy.health <= 0) {
    battle.enemyCreatures = battle.enemyCreatures.filter((creature) => creature !== enemy);
    battle.enemyGraveyard.push(enemy.card);
    addLog(`${enemy.card.name} is defeated.`);
  }
  return amount;
}

function applyOracle(card, creature = false) {
  const battle = state.battle;
  const text = card.oracle_text || '';
  let recognized = false;
  if (card.id === 'demo-spark') { drawOneExtra(); battle.playerBlock += 3; return; }
  if (card.id === 'demo-mending') { state.playerHealth = Math.min(30, state.playerHealth + 5); return; }
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  if (damage) {
    const amount = Number(damage[1]);
    damageFirstEnemy(amount);
    addLog(`${card.name}: ${amount} damage to the nearest enemy.`);
    recognized = true;
  }
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  if (life) {
    const amount = Number(life[1]);
    state.playerHealth = Math.min(30, state.playerHealth + amount);
    addLog(`${card.name}: You gain ${amount} life.`);
    recognized = true;
  }
  const draw = text.match(/draw\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  if (draw) {
    const count = ({ a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[draw[1].toLowerCase()] || Number(draw[1]) || 1;
    for (let i = 0; i < Math.min(count, 3); i += 1) drawOneExtra();
    addLog(`${card.name}: You draw ${Math.min(count, 3)} card${count > 1 ? 's' : ''}.`);
    recognized = true;
  }
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  if (buff) {
    const target = battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
    if (target) {
      const power = Number(buff[1]);
      const toughness = Number(buff[2]);
      target.power += power;
      target.toughness += toughness;
      if (/until end of turn/i.test(text)) battle.turnEffects.push({ creatureId: target.id, power, toughness });
      const powerText = `${power >= 0 ? '+' : ''}${power}`;
      const toughnessText = `${toughness >= 0 ? '+' : ''}${toughness}`;
      addLog(`${card.name}: ${target.card.name} gets ${powerText}/${toughnessText}${/until end of turn/i.test(text) ? ' until end of turn' : ''}.`);
      battle.creatures = removeDeadCreatures(battle.creatures, 'player');
    } else {
      battle.playerBlock += 3;
      addLog(`${card.name}: No creature to target — gain 3 shield.`);
    }
    recognized = true;
  }
  const keywordGrant = text.match(/gains?\s+([^.;\n]+?)\s+until end of turn/i);
  if (keywordGrant) {
    const keywords = keywordGrant[1].match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste)\b/gi) || [];
    const target = battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
    if (target && keywords.length) {
      target.temporaryKeywords ||= [];
      for (const keyword of keywords.map((item) => item.toLowerCase())) {
        target.temporaryKeywords.push(keyword);
        battle.turnEffects.push({ creatureId: target.id, keyword });
      }
      addLog(`${card.name}: ${target.card.name} gains ${keywords.join(', ')} until end of turn.`);
      recognized = true;
    }
  }
  if (/counter target/i.test(text)) {
    battle.playerBlock += 5;
    addLog(`${card.name}: Interpreted as 5 shield.`);
    recognized = true;
  }
  if (/destroy target creature|exile target creature/i.test(text)) {
    const amount = /exile target creature/i.test(text) ? 9 : 7;
    damageFirstEnemy(amount);
    addLog(`${card.name}: Deals ${amount} damage to the nearest enemy.`);
    recognized = true;
  }
  if (/prevent the next|prevent all damage/i.test(text)) {
    battle.playerBlock += 6;
    addLog(`${card.name}: You gain 6 shield.`);
    recognized = true;
  }
  if (/create .*token/i.test(text) && battle.creatures.length < 3) {
    battle.creatures.push({ id: `player-${state.nextPermanentId++}`, owner: 'player', card: { ...card, name: `${card.name} Token`, image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, summoningSick: true, isToken: true, willAttack: false, tapped: false });
    addLog(`${card.name}: A 2/2 token enters the battlefield.`);
    recognized = true;
  }
  if (!recognized && !creature) {
    const amount = Math.max(3, Math.ceil(card.cmc * 2 + 2));
    damageFirstEnemy(amount);
    addLog(`${card.name}: Simplified spell effect — ${amount} damage.`);
  }
}

function playCard(index, targetSide = 'enemy') {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card) return;
  if (battle.phase !== 'main') return showToast('You cannot play cards during the blocking phase.');
  if (isLand(card)) {
    if (!battle.landAvailable) return showToast('You have already played a land this turn.');
    battle.mulliganAvailable = false;
    const permanent = { card, color: cardColor(card), tapped: false, instanceId: card.instanceId || `land-${state.nextPermanentId++}` };
    battle.lands.push(permanent);
    battle.hand.splice(index, 1);
    battle.landAvailable = false;
    addLog(`${card.name} enters the battlefield and adds 1 shared mana.`);
    playSound(520, 0.08);
    renderBattle();
    return;
  }
  if (isCreature(card) && battle.creatures.length >= 3) return showToast('Your creature board is full.');
  if (targetSide === 'enemy' && isCreature(card)) return showToast('Creatures enter your battlefield. Drag one to the left side.');
  const payment = paymentPlan(card);
  if (!payment) return showToast('Not enough generic mana. End your turn to refill it.');
  battle.mulliganAvailable = false;
  battle.mana -= Math.ceil(card.cmc || 0);
  battle.hand.splice(index, 1);
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywords(card);
    const summoningSick = !/\bArtifact\b/i.test(card.type_line || '');
    battle.creatures.push({
      id: `player-${state.nextPermanentId++}`,
      owner: 'player',
      card,
      power: stats.power,
      toughness: stats.toughness,
      summonedTurn: battle.turn,
      summoningSick,
      ...keywords,
      willAttack: keywords.haste || !summoningSick,
      tapped: false
    });
    addLog(`${card.name} enters as a ${stats.power}/${stats.toughness} creature${summoningSick && !keywords.haste ? ' with summoning sickness' : ''}.`);
    applyOracle(card, true);
  } else {
    battle.graveyard.push(card);
    applyOracle(card, false);
  }
  playSound(680 - Math.min(5, card.cmc) * 60, 0.065);
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

function removeDeadCreatures(creatures, owner = 'player', clearDamage = true) {
  const battle = state.battle;
  const survivors = [];
  for (const creature of creatures) {
    const dead = owner === 'enemy'
      ? creature.health <= 0
      : (creature.damage || 0) >= creature.toughness || creature.deathtouchDamage;
    if (dead) {
      addLog(`${creature.card.name} is destroyed and goes to the ${owner === 'player' ? 'graveyard' : 'enemy graveyard'}.`);
      if (owner === 'player' && !creature.isToken) battle.graveyard.push(creature.card);
      else if (owner === 'enemy') battle.enemyGraveyard.push(creature.card);
      continue;
    }
    if (owner === 'player' && clearDamage) {
      creature.damage = 0;
      creature.deathtouchDamage = false;
    }
    survivors.push(creature);
  }
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
  if (controller === 'player') state.playerHealth = Math.min(30, state.playerHealth + amount);
  else creature.health = Math.min(creature.maxHealth || creature.toughness, (creature.health || 0) + amount);
}

function dealCreatureDamage(source, target, controller, battle) {
  const amount = Math.max(0, source.power || 0);
  if (!amount) return;
  if (target.owner === 'enemy') {
    target.health = Math.max(0, target.health - amount);
    if (hasCreatureKeyword(source, 'deathtouch')) target.health = 0;
  } else {
    target.damage = (target.damage || 0) + amount;
    if (hasCreatureKeyword(source, 'deathtouch')) target.deathtouchDamage = true;
  }
  gainLifelinkLife(source, controller, amount, battle);
}

function resolveCombatDamage(attackers, assignments, attackingSide) {
  const battle = state.battle;
  let damageToPlayer = 0;
  let damageToOpponent = 0;
  const enemyLifelinkEvents = [];
  const damageStep = (firstStep) => {
    for (const attacker of attackers) {
      if (!creatureAlive(attacker) || !dealsInCombatStep(attacker, firstStep)) continue;
      const blocker = assignments.get(attacker.id);
      if (!blocker) {
        if (attackingSide === 'player') {
          damageToOpponent += damageFirstEnemy(attacker.power);
          gainLifelinkLife(attacker, 'player', attacker.power, battle);
        } else {
          damageToPlayer += attacker.power;
          if (hasCreatureKeyword(attacker, 'lifelink')) enemyLifelinkEvents.push({ creature: attacker, damage: attacker.power });
        }
        continue;
      }
      if (!creatureAlive(blocker) || !canBlockCreature(blocker, attacker)) continue;
      const attackerAliveAtStep = creatureAlive(attacker);
      const blockerAliveAtStep = creatureAlive(blocker);
      if (attackerAliveAtStep && dealsInCombatStep(attacker, firstStep)) dealCreatureDamage(attacker, blocker, attackingSide, battle);
      if (blockerAliveAtStep && dealsInCombatStep(blocker, firstStep)) dealCreatureDamage(blocker, attacker, attackingSide === 'player' ? 'enemy' : 'player', battle);
    }
  };

  damageStep(true);
  battle.creatures = removeDeadCreatures(battle.creatures, 'player', false);
  battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy', false);
  damageStep(false);
  battle.creatures = removeDeadCreatures(battle.creatures, 'player', true);
  battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy', false);
  return { damageToPlayer, damageToOpponent, enemyLifelinkEvents };
}

function resolvePlayerAttacks() {
  const battle = state.battle;
  const attackers = battle.creatures.filter((creature) => creatureCanAttack(creature, battle.turn) && creature.willAttack !== false && !creature.tapped);
  if (!attackers.length) {
    addLog('Your creatures hold their ground.');
    return;
  }
  attackers.forEach((creature) => { creature.tapped = true; });
  const assignments = chooseEnemyBlocks(attackers, battle.enemyCreatures);
  for (const [attackerId, blocker] of assignments) {
    const attacker = attackers.find((creature) => creature.id === attackerId);
    if (attacker) addLog(`${blocker.card.name} blocks ${attacker.card.name}.`);
  }
  const { damageToOpponent } = resolveCombatDamage(attackers, assignments, 'player');
  if (damageToOpponent) addLog(`Your unblocked creatures deal ${damageToOpponent} damage to the enemy team.`);
}

function assignBlocker(attackerId, blockerId) {
  const battle = state.battle;
  if (!battle || battle.phase !== 'blocks') return;
  const attacker = battle.enemyCreatures.find((creature) => creature.id === attackerId && creatureCanAttack(creature, battle.turn));
  const blocker = battle.creatures.find((creature) => creature.id === blockerId && !creature.tapped);
  if (!attacker || !blocker) return;
  if (!canBlockCreature(blocker, attacker)) return showToast('Flying attackers can only be blocked by flying creatures or creatures with reach.');
  if (battle.blockAssignments.get(attackerId) === blockerId) {
    battle.blockAssignments.delete(attackerId);
    addLog(`${blocker.card.name} is no longer blocking.`);
  } else {
    for (const [assignedAttacker, assignedBlocker] of battle.blockAssignments) {
      if (assignedBlocker === blockerId) battle.blockAssignments.delete(assignedAttacker);
    }
    battle.blockAssignments.set(attackerId, blockerId);
    addLog(`${blocker.card.name} blocks ${attacker.card.name}.`);
  }
  battle.selectedEnemyAttackerId = null;
  renderBattle();
  playSound(490, 0.055);
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
  for (const [attackerId, blockerId] of battle.blockAssignments) {
    const blocker = battle.creatures.find((creature) => creature.id === blockerId && !creature.tapped);
    if (blocker && attackers.some((attacker) => attacker.id === attackerId)) assignments.set(attackerId, blocker);
  }
  for (const [attackerId, blocker] of assignments) {
    const attacker = attackers.find((creature) => creature.id === attackerId);
    if (attacker) addLog(`${blocker.card.name} blocks ${attacker.card.name}.`);
  }
  const { damageToPlayer, enemyLifelinkEvents } = resolveCombatDamage(attackers, assignments, 'enemy');
  const prevented = Math.min(battle.playerBlock, damageToPlayer);
  let shieldRemaining = prevented;
  for (const event of enemyLifelinkEvents) {
    const preventedFromThisHit = Math.min(shieldRemaining, event.damage);
    shieldRemaining -= preventedFromThisHit;
    gainLifelinkLife(event.creature, 'enemy', event.damage - preventedFromThisHit, battle);
  }
  const incoming = Math.max(0, damageToPlayer - prevented);
  if (prevented) addLog(`Your shield absorbs ${prevented} damage.`);
  if (incoming) {
    state.playerHealth -= incoming;
    addLog(`${incoming} damage gets through to you.`);
  } else if (!prevented && attackers.length) {
    addLog('All enemy attacks were blocked.');
  }
  if (state.playerHealth <= 0) return endRun(false);
  if (!battle.enemyCreatures.length) return winBattle();

  expireTurnEffects(battle);
  battle.creatures = removeDeadCreatures(battle.creatures, 'player');
  battle.playerBlock = 0;
  battle.turn += 1;
  battle.maxMana = Math.min(6, 3 + Math.floor((battle.turn - 1) / 2) + (state.relic === 'crystal' ? 1 : 0));
  battle.mana = battle.maxMana;
  battle.phase = 'main';
  battle.blockAssignments.clear();
  battle.selectedEnemyAttackerId = null;
  battle.landAvailable = true;
  battle.lands.forEach((land) => { land.tapped = false; });
  battle.creatures.forEach((creature) => {
    creature.tapped = false;
    if (creatureCanAttack(creature, battle.turn)) creature.willAttack = true;
  });
  drawToHand(5);
  renderBattle();
  playSound(230, 0.08);
}

function finishTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== 'main') return;
  battle.mulliganAvailable = false;
  resolvePlayerAttacks();
  if (!battle.enemyCreatures.length) return winBattle();
  const enemyAttackers = battle.enemyCreatures.filter((creature) => creatureCanAttack(creature, battle.turn));
  if (enemyAttackers.length && battle.creatures.some((creature) => !creature.tapped)) {
    battle.phase = 'blocks';
    battle.blockAssignments.clear();
    battle.selectedEnemyAttackerId = null;
    addLog('The enemies attack. Assign blockers or confirm without blocking.');
    renderBattle();
    playSound(340, 0.1);
    return;
  }
  resolveEnemyCombat();
}

function handleCombatAction() {
  if (state.battle?.phase === 'blocks') resolveEnemyCombat();
  else finishTurn();
}

function winBattle() {
  const node = state.node;
  addLog(`${state.battle.enemy.name} has been defeated.`);
  if (node >= ENCOUNTERS.length) return endRun(true);
  state.node += 1;
  state.packs = [chooseRandomCards(state.pool, 5)];
  state.draftKind = 'reward';
  state.selection.clear();
  renderDraft();
  showScreen('draft-screen');
  animateBoosterOpening();
  showToast(`${state.battle.enemy.name} defeated. Choose a reward, then rest before the next encounter.`);
  playSound(760, 0.16);
}

function endRun(won) {
  const end = $('#end-screen');
  end.dataset.result = won ? 'win' : 'loss';
  $('#end-emblem').textContent = won ? '✦' : '×';
  $('#end-eyebrow').textContent = won ? 'CAMPAIGN COMPLETE' : 'RUN OVER';
  $('#end-title').textContent = won ? 'The mana path is yours.' : 'The path ends here.';
  $('#end-message').textContent = won
    ? 'You defeated the Shard Dragon and completed the run. Your booster deck came through.'
    : `You fell in fight ${state.node}. Adjust your draft and try again.`;
  $('#run-summary').innerHTML = `<span>RUN <b>${state.node} / 4</b></span><span>DECK <b>${state.deck.length}</b></span><span>LIFE <b>${Math.max(0, state.playerHealth)}</b></span>`;
  showScreen('end-screen');
  playSound(won ? 880 : 145, 0.18);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function playSound(frequency, duration) {
  if (!state.soundOn) return;
  try {
    state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, state.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start();
    oscillator.stop(state.audio.currentTime + duration);
  } catch { /* Sound is optional. */ }
}

function playBoosterOpeningSound() {
  if (!state.soundOn) return;
  try {
    state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const context = state.audio;
    const start = context.currentTime + 0.025;
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + index * 0.095;
      oscillator.type = index === 4 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency * 0.72, noteStart);
      oscillator.frequency.exponentialRampToValueAtTime(frequency, noteStart + 0.12);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(index === 4 ? 0.045 : 0.026, noteStart + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.34);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.36);
    });
  } catch { /* Sound is optional. */ }
}

function animateBoosterOpening() {
  const screen = $('#draft-screen');
  clearTimeout(state.openingTimer);
  screen.classList.remove('opening');
  void screen.offsetWidth;
  screen.classList.add('opening');
  state.openingTimer = setTimeout(() => screen.classList.remove('opening'), 1350);
  playBoosterOpeningSound();
}

$('#graveyard-button').addEventListener('click', () => $('#graveyard-dialog').showModal());
$('#graveyard-close').addEventListener('click', () => $('#graveyard-dialog').close());
$('#graveyard-dialog').addEventListener('click', (event) => {
  if (event.target === $('#graveyard-dialog')) $('#graveyard-dialog').close();
});
document.addEventListener('pointerover', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget)) showCardPreview(previewCardFor(element));
});
document.addEventListener('pointerout', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget)) hideCardPreview();
});
document.addEventListener('focusin', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element) showCardPreview(previewCardFor(element));
});
document.addEventListener('focusout', (event) => {
  if (!event.relatedTarget?.closest('[data-preview-owner]')) hideCardPreview();
});
$('#start-button').addEventListener('click', startNewRun);
$('#restart-button').addEventListener('click', startNewRun);
$('#end-turn-button').addEventListener('click', handleCombatAction);
$('#mulligan-button').addEventListener('click', freeMulligan);
$('#sound-toggle').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  $('#sound-toggle span').textContent = state.soundOn ? 'SOUND ON' : 'SOUND OFF';
  $('#sound-toggle').setAttribute('aria-label', state.soundOn ? 'Turn sound off' : 'Turn sound on');
  $('#sound-toggle').title = state.soundOn ? 'Turn sound off' : 'Turn sound on';
  if (state.soundOn) {
    try { state.audio ||= new (window.AudioContext || window.webkitAudioContext)(); state.audio.resume().catch(() => {}); } catch { /* Sound is optional. */ }
    playSound(600, 0.08);
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
  if (event.key === 'Enter' && $('#start-screen').classList.contains('active')) startNewRun();
});

function showJourney() {
  const first = state.node === 1;
  $('#journey-title').textContent = first ? 'Choose your relic' : 'A moment by the fire';
  $('#journey-description').textContent = first ? 'One relic. A different way to play. Your choice lasts for this run.' : 'Life carries between encounters. Prepare before you continue.';
  $('#journey-path').innerHTML = ENCOUNTERS.map((encounter, index) => `<div class="path-node ${index + 1 === state.node ? 'current' : index + 1 < state.node ? 'complete' : ''}"><span>${index + 1 < state.node ? '✓' : index === 3 ? '♜' : '⚔'}</span><small>${encounter.rank}</small><b>${encounter.name}</b></div>`).join('');
  $('#journey-options').innerHTML = first
    ? '<button data-relic="crystal"><span>◈</span><h3>Aether Crystal</h3><p>+1 generic mana every turn.</p></button><button data-relic="ward"><span>⛨</span><h3>Ancient Ward</h3><p>Begin each battle with 4 shield.</p></button>'
    : '<button data-camp="rest"><span>✦</span><h3>Rest</h3><p>Restore 10 life, up to 30.</p></button><button data-camp="study"><span>▣</span><h3>Study</h3><p>Add a Star Shard: draw a card and gain 3 shield.</p></button>';
  $('#journey-life').textContent = `${state.playerHealth} / 30 LIFE · ${state.deck.length} CARDS`;
  showScreen('journey-screen');
}
$('#journey-options').addEventListener('click', event => {
  const choice = event.target.closest('button');
  if (!choice) return;
  if (choice.dataset.relic) state.relic = choice.dataset.relic;
  if (choice.dataset.camp === 'rest') state.playerHealth = Math.min(30, state.playerHealth + 10);
  if (choice.dataset.camp === 'study') state.deck.push(FALLBACK_CARDS[2]);
  beginBattle(state.node);
});
