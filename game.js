const CARD_QUERY = 'game:paper (t:creature or t:instant or t:sorcery or t:artifact or t:enchantment) cmc<=5';
const LAND_QUERY = 'game:paper t:basic t:land';
const API_BASE = 'https://api.scryfall.com/cards/search?q=';
const CACHE_KEY = 'booster-tutor-card-pool-arena-v2';
const CACHE_TTL = 12 * 60 * 60 * 1000;
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const COLOR_NAMES = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };

const FALLBACK_CARDS = [
  { id: 'demo-firebolt', name: 'Glutfunke', mana_cost: '{R}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo-Effekt: Verursacht 4 Schaden.', power: '', toughness: '', image: '', art: '', color_identity: ['R'], uri: '' },
  { id: 'demo-sentinel', name: 'Dämmerwacht', mana_cost: '{1}{W}', cmc: 2, type_line: 'Creature — Human Soldier', oracle_text: 'Eine standhafte Wache aus dem Grenzland.', power: '2', toughness: '3', image: '', art: '', color_identity: ['W'], uri: '' },
  { id: 'demo-spark', name: 'Sternensplitter', mana_cost: '{2}{U}', cmc: 3, type_line: 'Sorcery', oracle_text: 'Demo-Effekt: Ziehe eine Karte und erhalte 3 Schild.', power: '', toughness: '', image: '', art: '', color_identity: ['U'], uri: '' },
  { id: 'demo-wolf', name: 'Nebelwald-Wolf', mana_cost: '{1}{G}', cmc: 2, type_line: 'Creature — Wolf', oracle_text: 'Ein schneller Jäger, der jede Runde angreift.', power: '3', toughness: '2', image: '', art: '', color_identity: ['G'], uri: '' },
  { id: 'demo-mending', name: 'Seelenflicken', mana_cost: '{1}{B}', cmc: 2, type_line: 'Instant', oracle_text: 'Demo-Effekt: Stelle 5 Leben wieder her.', power: '', toughness: '', image: '', art: '', color_identity: ['B'], uri: '' },
  { id: 'demo-golem', name: 'Basaltgolem', mana_cost: '{3}', cmc: 3, type_line: 'Artifact Creature — Golem', oracle_text: 'Eine schwerfällige Maschine aus altem Stein.', power: '3', toughness: '4', image: '', art: '', color_identity: [], uri: '' },
  { id: 'demo-vines', name: 'Wurzelgriff', mana_cost: '{G}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo-Effekt: Dein stärkster Verbündeter erhält +2/+2.', power: '', toughness: '', image: '', art: '', color_identity: ['G'], uri: '' },
  { id: 'demo-bat', name: 'Abenddämmer-Fledermaus', mana_cost: '{2}{B}', cmc: 3, type_line: 'Creature — Bat', oracle_text: 'Flying, lifelink', power: '2', toughness: '2', image: '', art: '', color_identity: ['B'], uri: '' }
];

const FALLBACK_LANDS = COLORS.map((color) => ({
  id: `demo-land-${color}`,
  name: COLOR_NAMES[color],
  mana_cost: '',
  cmc: 0,
  type_line: `Basic Land — ${COLOR_NAMES[color]}`,
  oracle_text: `{T}: Add {${color}}.`,
  power: '',
  toughness: '',
  image: '',
  art: '',
  color_identity: [color],
  uri: ''
}));

const ENCOUNTERS = [
  { name: 'Moosgoblin', rank: 'GEGENSPIELER', location: 'DIE VERGESSENE LICHTUNG', health: 22, attack: 4, sprite: '♟' },
  { name: 'Runenjägerin', rank: 'ELITE', location: 'DER ZERBROCHENE PASS', health: 30, attack: 5, sprite: '♜' },
  { name: 'Dornenhydra', rank: 'ELITE', location: 'DAS WURZELGEWÖLBE', health: 38, attack: 6, sprite: '♞' },
  { name: 'Splitterdrache', rank: 'BOSS', location: 'DIE KRONENKAMMER', health: 48, attack: 8, sprite: '♛' }
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
const screens = ['start-screen', 'loading-screen', 'draft-screen', 'combat-screen', 'end-screen'];

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
    ['flying', 'Flug'],
    ['lifelink', 'Lebensverknüpfung'],
    ['double strike', 'Doppelschlag'],
    ['first strike', 'Erstschlag'],
    ['deathtouch', 'Todesberührung'],
    ['reach', 'Reichweite']
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
    name: card.name || face.name || 'Unbekannte Karte',
    mana_cost: card.mana_cost || face.mana_cost || '',
    cmc: Number(card.cmc ?? face.cmc ?? 0),
    type_line: card.type_line || face.type_line || 'Magic-Karte',
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
  return card && card.name && !isLand(card) && card.cmc <= 5 && card.cmc >= 0 && !/\{C\}/i.test(card.mana_cost || '');
}

function validBasicLand(card) {
  return isLand(card) && /\bBasic\b/i.test(card.type_line) && COLORS.some((color) => cardColor(card) === color);
}

function apiSearch(query) {
  const url = API_BASE + encodeURIComponent(query) + '&order=random&unique=cards';
  return fetch(url, { headers: { Accept: 'application/json' } }).then((response) => {
    if (!response.ok) throw new Error('Kartendienst antwortet mit ' + response.status);
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

  $('#loading-message').textContent = 'Mische Karten und Basisländer aus der Kartendatenbank.';
  try {
    const [spellPayload, landPayload] = await Promise.all([apiSearch(CARD_QUERY), apiSearch(LAND_QUERY)]);
    const cards = (spellPayload.data || []).map(normalizeCard).filter(validSpell);
    const lands = (landPayload.data || []).map(normalizeCard).filter(validBasicLand);
    if (cards.length < 15 || lands.length < 5) throw new Error('Die Kartenauswahl ist zu klein.');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards, lands })); } catch { /* Continue without browser caching. */ }
    return { cards, lands, cached: false };
  } catch (error) {
    if (cached) {
      try {
        const stale = JSON.parse(cached);
        if (stale.cards?.length && stale.lands?.length) return { cards: stale.cards, lands: stale.lands, cached: true, warning: 'Offline: gespeicherte Karten werden verwendet.' };
      } catch { /* Use local demo cards below. */ }
    }
    return { cards: FALLBACK_CARDS, lands: FALLBACK_LANDS, cached: false, fallback: true, warning: 'Kartendienst nicht erreichbar – Offline-Demo-Karten werden verwendet.' };
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
  state.playerHealth = 30;
  state.node = 1;
  state.battle = null;
  state.selection.clear();
  showScreen('loading-screen');
  loadCardPool().then(({ cards, lands, cached, fallback, warning }) => {
    state.pool = cards;
    state.landPool = lands;
    const status = $('#start-api-status span');
    status.textContent = fallback ? 'OFFLINE-DEMO' : cached ? 'SCRYFALL · CACHE' : 'SCRYFALL · VERBUNDEN';
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
  if (isLand(card)) return '<span class="mana-chip land-chip">LAND</span>';
  const symbols = (card.mana_cost || '').match(/\{([^}]+)\}/g) || [];
  if (!symbols.length) return `<span class="mana-chip">${Math.ceil(card.cmc || 0)}</span>`;
  return symbols.map((symbol) => {
    const value = symbol.slice(1, -1).replace('/', ' / ');
    const color = COLORS.find((item) => value.includes(item)) || 'generic';
    return `<span class="mana-chip mana-${color.toLowerCase()}">${escapeHtml(value)}</span>`;
  }).join('');
}

function parseStats(card) {
  const power = Number.parseInt(card.power, 10);
  const toughness = Number.parseInt(card.toughness, 10);
  return {
    power: Number.isFinite(power) ? Math.max(1, power) : Math.max(1, Math.ceil(card.cmc / 2)),
    toughness: Number.isFinite(toughness) ? Math.max(1, toughness) : Math.max(2, card.cmc)
  };
}

function createEnemyCreature(battle) {
  const card = chooseRandomCards(state.pool.filter(isCreature), 1)[0];
  const stats = parseStats(card);
  const bonus = Math.floor((state.node - 1) / 2);
  return {
    id: `enemy-${state.nextPermanentId++}`,
    card,
    power: stats.power + bonus,
    toughness: stats.toughness + bonus,
    summonedTurn: battle.turn,
    ...creatureKeywords(card)
  };
}

function summonEnemyCreature() {
  const battle = state.battle;
  if (!battle || battle.enemyCreatures.length >= 3) return;
  const creature = createEnemyCreature(battle);
  battle.enemyCreatures.push(creature);
  addLog(`${battle.enemy.name} spielt ${creature.card.name} (${creature.power}/${creature.toughness}).`);
}

function effectSummary(card) {
  const text = card.oracle_text || '';
  if (isLand(card)) return `Land · erzeugt ${cardColor(card)} Mana`;
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywordLabels(creatureKeywords(card));
    return `Kreatur ${stats.power}/${stats.toughness} · ${keywords || 'greift an'}`;
  }
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(?:a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  if (damage) return `Schaden: ${damage[1]} · direkt auf den Gegner`;
  if (life) return `Heilt ${life[1]} Leben`;
  if (draw) return 'Kartentext: zusätzliche Karte ziehen';
  if (buff) return `${/until end of turn/i.test(text) ? 'Bis Zugende: ' : ''}Ändert eine Kreatur um ${buff[1]}/${buff[2]}`;
  const grant = text.match(/gains?\s+([^.;\n]+?)\s+until end of turn/i);
  if (grant) return `Verleiht ${grant[1]} bis Zugende`;
  if (/counter target/i.test(text)) return 'Kontert einen gegnerischen Zauber: Schild';
  if (/create .*token/i.test(text)) return 'Erschafft einen kleinen Spielstein';
  return `Roguelike-Zauberwirkung: ${Math.max(3, card.cmc * 2 + 2)} Schaden`;
}

function makeCardMarkup(card, packIndex, cardIndex, selected) {
  const image = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} – Kartenbild" loading="lazy" />`
    : '<div class="card-fallback-art" aria-hidden="true">✦</div>';
  const stat = isCreature(card) ? ` · ${escapeHtml(card.power || '?')}/${escapeHtml(card.toughness || '?')}` : '';
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" style="--card-index:${cardIndex}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.type_line)}, ${escapeHtml(card.mana_cost || 'Land')}${selected ? ', ausgewählt' : ''}">
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
  $('#draft-step').textContent = starter ? '3 BOOSTER · 15 KARTEN' : `RUN ${String(state.node).padStart(2, '0')} / 04`;
  $('#draft-title').textContent = starter ? 'Drei Booster liegen bereit' : 'Booster-Beute';
  $('#draft-instruction').textContent = starter
    ? 'Wähle aus jedem Booster genau eine Karte. Jede Auswahl kommt viermal ins Deck.'
    : 'Wähle eine Karte. Sie kommt viermal in dein Deck.';
  $('#pack-number').textContent = starter ? '03 × 05' : String(state.node + 1).padStart(2, '0');
  $('#deck-count').textContent = String(state.deck.length + state.selection.size * 4);
  $('#draft-grid').innerHTML = state.packs.map((pack, packIndex) => {
    const selectedIndex = state.selection.get(packIndex);
    return `<section class="booster-pack" style="--pack-index:${packIndex}"><header><span>BOOSTER ${String(packIndex + 1).padStart(2, '0')}</span><small>${selectedIndex === undefined ? 'WÄHLE 1 KARTE' : '1 / 1 GEWÄHLT'}</small></header><div class="booster-cards">${pack.map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, selectedIndex === cardIndex)).join('')}</div></section>`;
  }).join('');
  $('#selection-status').textContent = starter
    ? `Gewählt: ${state.selection.size} / 3 Booster · Startdeck enthält danach 12 Draftkarten + 10 Länder.`
    : `Gewählt: ${state.selection.size} / 1 Karte · +4 Kopien`;
  $('#draft-confirm').disabled = !picks;
  $('#draft-confirm').innerHTML = starter ? 'DECK BAUEN <span>→</span>' : 'KARTE HINZUFÜGEN <span>→</span>';
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
    if (!battle.selectedEnemyAttackerId) return showToast('Wähle zuerst rechts einen Angreifer aus.');
    return assignBlocker(battle.selectedEnemyAttackerId, creature.id);
  }
  if (battle.phase !== 'main' || !creatureCanAttack(creature, battle.turn)) return;
  creature.willAttack = creature.willAttack === false;
  addLog(creature.willAttack ? `${creature.card.name} wird angreifen.` : `${creature.card.name} bleibt zum Blocken bereit.`);
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
  else showToast('Ziehe deine Kreatur direkt auf einen gegnerischen Angreifer.');
});

function confirmDraft() {
  const starter = state.draftKind === 'starter';
  const selected = selectedDraftCards();
  if (!selected) {
    showToast(starter ? 'Wähle genau eine Karte aus jedem der drei Booster.' : 'Wähle zuerst eine Karte aus dem Booster.');
    return;
  }
  const copies = 4;
  for (const card of selected) for (let i = 0; i < copies; i += 1) state.deck.push(card);
  if (starter) state.deck.push(...generateStarterLands(selected, 10));
  state.selection.clear();
  if (starter) beginBattle(1);
  else beginBattle(state.node);
}

function cardColor(card) {
  const line = card.type_line || '';
  const match = line.match(/Basic Land — (Plains|Island|Swamp|Mountain|Forest)/i);
  if (match) return ({ plains: 'W', island: 'U', swamp: 'B', mountain: 'R', forest: 'G' })[match[1].toLowerCase()];
  for (const color of COLORS) if ((card.color_identity || []).includes(color)) return color;
  return 'G';
}

function landForColor(color) {
  const typeName = COLOR_NAMES[color] || 'Forest';
  return state.landPool.find((card) => (card.type_line || '').toLowerCase().includes(typeName.toLowerCase())) || FALLBACK_LANDS.find((card) => cardColor(card) === color) || FALLBACK_LANDS[4];
}

function generateStarterLands(cards, total) {
  const weights = Object.fromEntries(COLORS.map((color) => [color, 0]));
  for (const card of cards) {
    const symbols = (card.mana_cost || '').match(/\{([^}]+)\}/g) || [];
    for (const raw of symbols) {
      const token = raw.slice(1, -1).toUpperCase();
      for (const color of COLORS) if (token.includes(color)) weights[color] += 1;
    }
    if (!symbols.length) for (const color of card.color_identity || []) weights[color] += 1;
  }
  if (!Object.values(weights).some(Boolean)) weights.G = 1;
  const active = COLORS.filter((color) => weights[color] > 0);
  const counts = Object.fromEntries(COLORS.map((color) => [color, 0]));
  active.forEach((color) => { counts[color] = 1; });
  let remaining = Math.max(0, total - active.length);
  const sum = active.reduce((result, color) => result + weights[color], 0);
  const shares = active.map((color) => {
    const exact = remaining * weights[color] / sum;
    const whole = Math.floor(exact);
    counts[color] += whole;
    return { color, remainder: exact - whole };
  });
  let allocated = Object.values(counts).reduce((a, b) => a + b, 0);
  shares.sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; allocated < total; index += 1, allocated += 1) counts[shares[index % shares.length].color] += 1;
  return COLORS.flatMap((color) => Array.from({ length: counts[color] }, () => ({ ...landForColor(color), instanceId: `land-${state.nextPermanentId++}` })));
}

function beginBattle(node) {
  state.node = node;
  state.playerHealth = 30;
  const enemy = ENCOUNTERS[node - 1];
  const creatures = state.pool.filter(isCreature);
  const enemyCard = creatures[Math.floor(Math.random() * Math.max(1, creatures.length))];
  state.battle = {
    enemy,
    enemyArt: enemyCard?.art || '',
    enemyHealth: enemy.health,
    enemyMaxHealth: enemy.health,
    enemyIntent: enemy.attack,
    playerBlock: 0,
    mulliganAvailable: true,
    landAvailable: true,
    turn: 1,
    phase: 'main',
    deck: shuffle(state.deck),
    discard: [],
    hand: [],
    creatures: [],
    enemyCreatures: [],
    selectedEnemyAttackerId: null,
    blockAssignments: new Map(),
    turnEffects: [],
    lands: [],
    log: []
  };
  drawToHand(5);
  addLog(`Du stellst dich ${enemy.name} entgegen. Spiele ein Land aus deiner Hand, um Mana zu erzeugen.`);
  renderBattle();
  showScreen('combat-screen');
  playSound(330, 0.1);
}

function addLog(message) {
  if (!state.battle) return;
  state.battle.log.unshift(message);
  state.battle.log = state.battle.log.slice(0, 4);
}

function reshuffleDiscard() {
  const battle = state.battle;
  if (!battle || battle.deck.length || !battle.discard.length) return;
  battle.deck = shuffle(battle.discard);
  battle.discard = [];
  addLog('Dein Friedhof wird neu gemischt und kommt als Bibliothek zurück.');
}

function drawToHand(maxHand) {
  const battle = state.battle;
  if (!battle) return;
  while (battle.hand.length < maxHand) {
    reshuffleDiscard();
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
  addLog('Kostenloser Mulligan: Deine Starthand wurde neu gemischt. Du ziehst wieder fünf Karten.');
  renderBattle();
  playSound(740, 0.14);
}

function manaTokens(card) {
  const matches = (card.mana_cost || '').match(/\{([^}]+)\}/g) || [];
  return matches.map((match) => match.slice(1, -1).toUpperCase());
}

function paymentPlan(card) {
  const battle = state.battle;
  const available = battle.lands.filter((land) => !land.tapped);
  const tokens = manaTokens(card);
  let generic = 0;
  const fixed = [];
  const hybrid = [];
  if (!tokens.length && !isLand(card)) generic = Math.ceil(card.cmc || 0);
  for (const token of tokens) {
    if (/^\d+$/.test(token)) generic += Number(token);
    else if (token === 'X') generic += 1;
    else if (COLORS.includes(token)) fixed.push(token);
    else if (token.includes('/')) {
      const choices = token.split('/').filter((value) => COLORS.includes(value));
      if (choices.length) hybrid.push(choices);
      else if (/^2\//.test(token)) generic += 2;
    } else if (token === 'C') fixed.push('C');
    else generic += 1;
  }
  const selected = [];
  const remaining = [...available];
  for (const color of fixed) {
    const index = remaining.findIndex((land) => land.color === color);
    if (index < 0) return null;
    selected.push(remaining[index]);
    remaining.splice(index, 1);
  }
  for (const options of hybrid) {
    const index = remaining.findIndex((land) => options.includes(land.color));
    if (index < 0) return null;
    selected.push(remaining[index]);
    remaining.splice(index, 1);
  }
  if (remaining.length < generic) return null;
  selected.push(...remaining.slice(0, generic));
  return selected;
}

function defaultTarget(card) {
  const text = (card.oracle_text || '').toLowerCase();
  return isLand(card) || isCreature(card) || /you gain|draw |gets? \+|target creature|lifelink/i.test(text) ? 'player' : 'enemy';
}

function creatureCanAttack(creature, turn) {
  return turn > creature.summonedTurn || hasCreatureKeyword(creature, 'haste');
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
  const totalAttack = battle.enemyIntent + attackers.reduce((sum, creature) => sum + creature.power, 0);
  const units = battle.enemyCreatures.map((creature) => {
    const ready = creatureCanAttack(creature, battle.turn);
    const selected = battle.selectedEnemyAttackerId === creature.id;
    const blocker = assignedBlockerName(battle, creature.id);
    const image = creature.card.art || creature.card.image;
    const keywords = creatureKeywordLabels(creature);
    return `<button type="button" class="enemy-creature${ready ? '' : ' resting'}${selected ? ' selected' : ''}" data-enemy-attacker="${escapeHtml(creature.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(creature.card.name)}, ${creature.power}/${creature.toughness}${blocker ? `, geblockt von ${escapeHtml(blocker)}` : ''}" ${blocking && ready ? '' : 'disabled'}>
      ${image ? `<img class="enemy-creature-art" src="${escapeHtml(image)}" alt="" loading="lazy" />` : '<span class="enemy-creature-art fallback">✦</span>'}
      <b>${escapeHtml(creature.card.name)}</b><span class="enemy-creature-stats">${creature.power}/${creature.toughness}</span>
      <small class="enemy-keywords">${escapeHtml(keywords || (ready ? 'Angriff bereit' : 'Beschworen · wartet'))}</small>
      ${blocker ? `<small class="enemy-block-status">Blocker: ${escapeHtml(blocker)}</small>` : ''}
    </button>`;
  }).join('');
  const selectedBoss = battle.selectedEnemyAttackerId === 'boss';
  const bossBlocker = assignedBlockerName(battle, 'boss');
  const bossIntent = blocking
    ? `<button type="button" class="enemy-intent boss-attacker${selectedBoss ? ' selected' : ''}" data-enemy-attacker="boss" aria-pressed="${selectedBoss}"><span class="intent-icon">⚔</span><span>${escapeHtml(battle.enemy.name)}</span><b>${battle.enemyIntent}</b><small>${bossBlocker ? `Blocker: ${escapeHtml(bossBlocker)}` : 'Angreifer wählen'}</small></button>`
    : `<div class="enemy-intent"><span class="intent-icon">⚔</span><span>Angriff geplant</span><b>${totalAttack}</b></div>`;
  $('#enemy-board').innerHTML = `<div class="enemy-creatures-row">${units || '<div class="empty-enemy-board">Der Gegner bereitet Kreaturen vor.</div>'}</div><div class="enemy-attack-row">${bossIntent}${blocking ? `<small class="block-total">Angriff insgesamt: ${totalAttack}</small>` : ''}</div>`;
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  $('#node-counter').textContent = String(state.node).padStart(2, '0');
  $('#location-name').textContent = enemy.location;
  $('#enemy-rank').textContent = enemy.rank;
  $('#enemy-name').textContent = enemy.name;
  $('#enemy-health-label').textContent = `${Math.max(0, battle.enemyHealth)} / ${battle.enemyMaxHealth}`;
  $('#enemy-health-fill').style.width = `${Math.max(0, battle.enemyHealth / battle.enemyMaxHealth * 100)}%`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)} / 30`;
  $('#player-health-fill').style.width = `${Math.max(0, state.playerHealth / 30 * 100)}%`;
  const availableMana = battle.lands.filter((land) => !land.tapped).length;
  $('#mana-label').textContent = `${availableMana} / ${battle.lands.length}`;
  $('#land-status').textContent = battle.landAvailable ? 'Land pro Zug verfügbar' : 'Land bereits gespielt';
  $('#land-count').textContent = `${battle.lands.length}`;
  $('#land-row').innerHTML = battle.lands.length ? battle.lands.map((land) => {
    const image = land.card.image ? `<img src="${escapeHtml(land.card.image)}" alt="${escapeHtml(land.card.name)}" loading="lazy" />` : `<span class="land-color land-${land.color.toLowerCase()}">${land.color}</span>`;
    return `<div class="land-permanent${land.tapped ? ' tapped' : ''}" title="${escapeHtml(land.card.name)} · ${land.color} Mana">${image}<small>${land.color}</small></div>`;
  }).join('') : '<div class="empty-land-zone">Länder aus der Hand hier ablegen, um Mana zu erzeugen.</div>';
  $('#enemy-art-image').src = battle.enemyArt || '';
  $('#enemy-art-image').hidden = !battle.enemyArt;
  $('#enemy-art .enemy-sprite').hidden = Boolean(battle.enemyArt);
  $('#end-turn-button').innerHTML = battle.phase === 'blocks' ? 'BLOCKER BESTÄTIGEN <span>✓</span>' : 'ZUG BEENDEN <span>→</span>';
  $('#combat-action-hint').textContent = battle.phase === 'blocks'
    ? 'Blockphase: Angreifer rechts wählen, dann deine blockende Kreatur links anklicken oder herüberziehen.'
    : 'Klicke Kreaturen zum Zurückhalten · dein Deck zieht automatisch auf fünf Karten nach.';
  $('#combat-action-hint').classList.toggle('blocking', battle.phase === 'blocks');
  $('#turn-label').textContent = `ZUG ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < state.node ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Kampf ${index + 1}"></i>`).join('');
  $('#discard-count').textContent = String(battle.discard.length);
  $('#library-count').textContent = String(battle.deck.length);
  $('#hand-count').textContent = `${battle.hand.length} KARTEN`;
  $('#mulligan-button').disabled = !battle.mulliganAvailable || battle.phase !== 'main';
  $('#mulligan-button').innerHTML = battle.mulliganAvailable ? 'KOSTENLOSER MULLIGAN <span>↻</span>' : 'MULLIGAN GENUTZT';
  $('#creature-count').textContent = `${battle.creatures.length} / 3`;
  $('#battle-log').innerHTML = battle.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  renderEnemyBoard();
  renderHand();
  renderCreatures();
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
    return `<button class="hand-card${isLand(card) ? ' land-in-hand' : ''}${battle.phase === 'blocks' ? ' paused' : ''}" style="${fanStyle}" data-hand-index="${index}" data-side="${defaultTarget(card)}" data-effect="${escapeHtml(card.oracle_text || effectSummary(card))}" draggable="${battle.phase === 'main'}" ${battle.phase === 'blocks' ? 'disabled' : ''} title="${escapeHtml(card.name)} · ${escapeHtml(card.mana_cost || 'Land')}${blocked ? ' · aktuell nicht spielbar' : ''}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.mana_cost || 'Land')}, per Drag-and-drop spielen">
      ${image}<span class="hand-card-cost">${manaCostHtml(card)}</span><span class="hand-card-name">${escapeHtml(card.name)}</span>${blocked ? '<span class="card-unavailable">–</span>' : ''}
    </button>`;
  }).join('');
  $('#hand-row').querySelectorAll('.hand-card').forEach((button) => {
    button.addEventListener('click', () => playCard(Number(button.dataset.handIndex), button.dataset.side));
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
    $('#creature-row').innerHTML = '<div class="empty-board">Kreaturen hier ablegen oder eine Karte ausspielen.</div>';
    return;
  }
  $('#creature-row').innerHTML = creatures.map((creature) => {
    const image = creature.card.image ? `<img src="${escapeHtml(creature.card.image)}" alt="${escapeHtml(creature.card.name)}" loading="lazy" />` : '<span class="creature-symbol">✦</span>';
    const waiting = !creatureCanAttack(creature, battle.turn);
    const assignment = [...battle.blockAssignments.entries()].find(([, blockerId]) => blockerId === creature.id);
    const assignedAttacker = assignment?.[0] === 'boss' ? battle.enemy.name : battle.enemyCreatures.find((item) => item.id === assignment?.[0])?.card.name;
    const selectedAttacker = battle.enemyCreatures.find((item) => item.id === battle.selectedEnemyAttackerId);
    const legalBlocker = !selectedAttacker || canBlockCreature(creature, selectedAttacker);
    const selected = battle.phase === 'blocks' && battle.selectedEnemyAttackerId && !creature.tapped && legalBlocker;
    const blocking = battle.phase === 'blocks';
    const willAttack = !waiting && creature.willAttack !== false;
    const keywords = creatureKeywordLabels(creature);
    const status = blocking
      ? assignment ? `Blockt ${escapeHtml(assignedAttacker)}` : creature.tapped ? 'Hat angegriffen' : 'Als Blocker wählen'
      : waiting ? 'Erschöpfung · wartet auf Zug 2' : willAttack ? 'Greift beim Zugende an' : 'Bleibt zum Blocken';
    return `<button type="button" class="creature-token${blocking && !creature.tapped ? ' can-block' : ''}${selected ? ' blocker-target' : ''}${assignment ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${!blocking && !waiting && !willAttack ? ' held-back' : ''}" data-creature-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(assignment) : !waiting && !willAttack}" draggable="${blocking && !creature.tapped}" ${blocking && creature.tapped ? 'disabled' : ''} title="${escapeHtml(creature.card.name)} · ${creature.power}/${creature.toughness}${assignedAttacker ? ` · blockt ${escapeHtml(assignedAttacker)}` : ''}">
      ${image}<span class="creature-meta"><b>${escapeHtml(creature.card.name)}</b>${keywords ? `<small class="creature-keywords">${escapeHtml(keywords)}</small>` : ''}<small class="${waiting ? 'summoning-sick' : ''}">${status}</small></span><b class="creature-stats">${creature.power}/${creature.toughness}</b>
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

function applyOracle(card, creature = false) {
  const battle = state.battle;
  const text = card.oracle_text || '';
  let recognized = false;
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  if (damage) {
    const amount = Number(damage[1]);
    battle.enemyHealth -= amount;
    addLog(`${card.name}: ${amount} Schaden am Gegner.`);
    recognized = true;
  }
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  if (life) {
    const amount = Number(life[1]);
    state.playerHealth = Math.min(30, state.playerHealth + amount);
    addLog(`${card.name}: Du erhältst ${amount} Leben.`);
    recognized = true;
  }
  const draw = text.match(/draw\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  if (draw) {
    const count = ({ a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[draw[1].toLowerCase()] || Number(draw[1]) || 1;
    for (let i = 0; i < Math.min(count, 3); i += 1) drawOneExtra();
    addLog(`${card.name}: Du ziehst ${Math.min(count, 3)} Karte${count > 1 ? 'n' : ''}.`);
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
      addLog(`${card.name}: ${target.card.name} erhält ${powerText}/${toughnessText}${/until end of turn/i.test(text) ? ' bis Zugende' : ''}.`);
      battle.creatures = removeDeadCreatures(battle.creatures);
    } else {
      battle.playerBlock += 3;
      addLog(`${card.name}: Kein Ziel im Spiel – du erhältst 3 Schild.`);
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
      addLog(`${card.name}: ${target.card.name} erhält ${keywords.join(', ')} bis Zugende.`);
      recognized = true;
    }
  }
  if (/counter target/i.test(text)) {
    battle.playerBlock += 5;
    addLog(`${card.name}: Der Zauber wird als 5 Schild interpretiert.`);
    recognized = true;
  }
  if (/destroy target creature|exile target creature/i.test(text)) {
    const amount = /exile target creature/i.test(text) ? 9 : 7;
    battle.enemyHealth -= amount;
    addLog(`${card.name}: Der Gegnertreffer wird als ${amount} Schaden umgesetzt.`);
    recognized = true;
  }
  if (/prevent the next|prevent all damage/i.test(text)) {
    battle.playerBlock += 6;
    addLog(`${card.name}: Du erhältst 6 Schild.`);
    recognized = true;
  }
  if (/create .*token/i.test(text) && battle.creatures.length < 3) {
    battle.creatures.push({ id: `player-${state.nextPermanentId++}`, card: { ...card, name: `${card.name} (Spielstein)`, image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, willAttack: false, tapped: false });
    addLog(`${card.name}: Ein 2/2-Spielstein kommt ins Spiel.`);
    recognized = true;
  }
  if (!recognized && !creature) {
    const amount = Math.max(3, Math.ceil(card.cmc * 2 + 2));
    battle.enemyHealth -= amount;
    addLog(`${card.name}: vereinfachter Zaubereffekt – ${amount} Schaden.`);
  }
}

function playCard(index, targetSide = 'enemy') {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card) return;
  if (battle.phase !== 'main') return showToast('Spielen ist während der Blockphase pausiert.');
  if (isLand(card)) {
    if (!battle.landAvailable) return showToast('Du hast in diesem Zug bereits ein Land gespielt.');
    battle.mulliganAvailable = false;
    const permanent = { card, color: cardColor(card), tapped: false, instanceId: card.instanceId || `land-${state.nextPermanentId++}` };
    battle.lands.push(permanent);
    battle.hand.splice(index, 1);
    battle.landAvailable = false;
    addLog(`${card.name} kommt ins Spiel und erzeugt ${permanent.color} Mana.`);
    playSound(520, 0.08);
    renderBattle();
    return;
  }
  if (isCreature(card) && battle.creatures.length >= 3) return showToast('Dein Kreaturenfeld ist voll.');
  if (targetSide === 'enemy' && isCreature(card)) return showToast('Kreaturen kommen auf dein Feld. Ziehe sie nach links.');
  const payment = paymentPlan(card);
  if (!payment) return showToast('Deine ungetappten Länder reichen für diese Manakosten nicht aus.');
  battle.mulliganAvailable = false;
  payment.forEach((land) => { land.tapped = true; });
  battle.hand.splice(index, 1);
  battle.discard.push(card);
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywords(card);
    battle.creatures.push({
      id: `player-${state.nextPermanentId++}`,
      card,
      power: stats.power,
      toughness: stats.toughness,
      summonedTurn: battle.turn,
      ...keywords,
      willAttack: keywords.haste,
      tapped: false
    });
    addLog(`${card.name} kommt als ${stats.power}/${stats.toughness}-Kreatur ins Spiel.`);
    applyOracle(card, true);
  } else {
    applyOracle(card, false);
  }
  playSound(680 - Math.min(5, card.cmc) * 60, 0.065);
  if (battle.enemyHealth <= 0) return winBattle();
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

function removeDeadCreatures(creatures, clearDamage = true) {
  const survivors = [];
  for (const creature of creatures) {
    if ((creature.damage || 0) >= creature.toughness || creature.deathtouchDamage) {
      addLog(`${creature.card.name} wird zerstört.`);
      continue;
    }
    if (clearDamage) {
      creature.damage = 0;
      creature.deathtouchDamage = false;
    }
    survivors.push(creature);
  }
  return survivors;
}

function creatureAlive(creature) {
  return Boolean(creature) && (creature.isBoss || (!creature.deathtouchDamage && (creature.damage || 0) < creature.toughness));
}

function dealsInCombatStep(creature, firstStep) {
  const firstStrike = hasCreatureKeyword(creature, 'first strike') || hasCreatureKeyword(creature, 'double strike');
  return firstStep ? firstStrike : !firstStrike || hasCreatureKeyword(creature, 'double strike');
}

function gainLifelinkLife(creature, controller, amount, battle) {
  if (amount <= 0 || !hasCreatureKeyword(creature, 'lifelink')) return;
  if (controller === 'player') state.playerHealth = Math.min(30, state.playerHealth + amount);
  else battle.enemyHealth = Math.min(battle.enemyMaxHealth, battle.enemyHealth + amount);
}

function dealCreatureDamage(source, target, controller, battle) {
  const amount = Math.max(0, source.power || 0);
  if (!amount) return;
  if (target.isBoss) battle.enemyHealth -= amount;
  else {
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
          battle.enemyHealth -= attacker.power;
          damageToOpponent += attacker.power;
          gainLifelinkLife(attacker, 'player', attacker.power, battle);
        } else {
          damageToPlayer += attacker.power;
          if (hasCreatureKeyword(attacker, 'lifelink')) enemyLifelinkEvents.push(attacker.power);
        }
        continue;
      }
      if (!creatureAlive(blocker) || !canBlockCreature(blocker, attacker)) continue;
      const attackerAliveAtStep = creatureAlive(attacker);
      const blockerAliveAtStep = creatureAlive(blocker);
      if (attackerAliveAtStep && dealsInCombatStep(attacker, firstStep)) {
        dealCreatureDamage(attacker, blocker, attackingSide, battle);
      }
      if (blockerAliveAtStep && dealsInCombatStep(blocker, firstStep)) {
        dealCreatureDamage(blocker, attacker, attackingSide === 'player' ? 'enemy' : 'player', battle);
      }
    }
  };

  damageStep(true);
  battle.creatures = removeDeadCreatures(battle.creatures, false);
  battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, false);
  damageStep(false);
  battle.creatures = removeDeadCreatures(battle.creatures, true);
  battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, true);
  return { damageToPlayer, damageToOpponent, enemyLifelinkEvents };
}

function resolvePlayerAttacks() {
  const battle = state.battle;
  const attackers = battle.creatures.filter((creature) => creatureCanAttack(creature, battle.turn) && creature.willAttack !== false && !creature.tapped);
  if (!attackers.length) {
    addLog('Deine Kreaturen halten die Stellung.');
    return;
  }
  attackers.forEach((creature) => { creature.tapped = true; });
  const assignments = chooseEnemyBlocks(attackers, battle.enemyCreatures);
  for (const [attackerId, blocker] of assignments) {
    const attacker = attackers.find((creature) => creature.id === attackerId);
    if (attacker) addLog(`${blocker.card.name} blockt ${attacker.card.name}.`);
  }
  const { damageToOpponent: damageToEnemy } = resolveCombatDamage(attackers, assignments, 'player');
  if (damageToEnemy) addLog(`Ungeblockter Angriff: ${damageToEnemy} Schaden am Gegner.`);
}

function assignBlocker(attackerId, blockerId) {
  const battle = state.battle;
  if (!battle || battle.phase !== 'blocks') return;
  const attacker = attackerId === 'boss'
    ? { id: 'boss', card: { name: battle.enemy.name } }
    : battle.enemyCreatures.find((creature) => creature.id === attackerId && creatureCanAttack(creature, battle.turn));
  const blocker = battle.creatures.find((creature) => creature.id === blockerId && !creature.tapped);
  if (!attacker || !blocker) return;
  if (!canBlockCreature(blocker, attacker)) return showToast('Fliegende Angreifer können nur von fliegenden Kreaturen oder Kreaturen mit Reichweite geblockt werden.');
  if (battle.blockAssignments.get(attackerId) === blockerId) {
    battle.blockAssignments.delete(attackerId);
    addLog(`${blocker.card.name} blockt nicht mehr.`);
  } else {
    for (const [assignedAttacker, assignedBlocker] of battle.blockAssignments) {
      if (assignedBlocker === blockerId) battle.blockAssignments.delete(assignedAttacker);
    }
    battle.blockAssignments.set(attackerId, blockerId);
    addLog(`${blocker.card.name} blockt ${attacker.card.name}.`);
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
  addLog('Effekte „bis zum Ende des Zuges“ laufen aus.');
}

function resolveEnemyCombat() {
  const battle = state.battle;
  if (!battle) return;
  const attackers = [
    { id: 'boss', card: { name: battle.enemy.name }, power: battle.enemyIntent, isBoss: true },
    ...battle.enemyCreatures.filter((creature) => creatureCanAttack(creature, battle.turn))
  ];
  const assignments = new Map();
  for (const [attackerId, blockerId] of battle.blockAssignments) {
    const blocker = battle.creatures.find((creature) => creature.id === blockerId && !creature.tapped);
    if (blocker) assignments.set(attackerId, blocker);
  }
  for (const [attackerId, blocker] of assignments) {
    const attacker = attackers.find((creature) => creature.id === attackerId);
    if (attacker) addLog(`${blocker.card.name} blockt ${attacker.card.name}.`);
  }
  const { damageToPlayer, enemyLifelinkEvents } = resolveCombatDamage(attackers, assignments, 'enemy');
  const prevented = Math.min(battle.playerBlock, damageToPlayer);
  let shieldRemaining = prevented;
  for (const lifelinkDamage of enemyLifelinkEvents) {
    const preventedFromThisHit = Math.min(shieldRemaining, lifelinkDamage);
    shieldRemaining -= preventedFromThisHit;
    gainLifelinkLife({ lifelink: true }, 'enemy', lifelinkDamage - preventedFromThisHit, battle);
  }
  const incoming = Math.max(0, damageToPlayer - prevented);
  if (prevented) addLog(`Dein Schild fängt ${prevented} Schaden ab.`);
  if (incoming) {
    state.playerHealth -= incoming;
    addLog(`${battle.enemy.name} und seine Kreaturen treffen dich für ${incoming} Schaden.`);
  } else if (!prevented) {
    addLog('Alle gegnerischen Angriffe wurden geblockt.');
  }
  if (battle.enemyHealth <= 0) return winBattle();
  if (state.playerHealth <= 0) return endRun(false);

  battle.playerBlock = 0;
  if (battle.turn % 2 === 1 && battle.enemyCreatures.length < 3) summonEnemyCreature();
  battle.turn += 1;
  battle.phase = 'main';
  battle.blockAssignments.clear();
  battle.selectedEnemyAttackerId = null;
  battle.landAvailable = true;
  battle.lands.forEach((land) => { land.tapped = false; });
  battle.creatures.forEach((creature) => {
    creature.tapped = false;
    if (creatureCanAttack(creature, battle.turn)) creature.willAttack = true;
  });
  battle.enemyIntent = battle.enemy.attack + Math.floor((battle.turn - 1) / 2);
  drawToHand(5);
  renderBattle();
  playSound(230, 0.08);
}

function finishTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== 'main') return;
  battle.mulliganAvailable = false;
  resolvePlayerAttacks();
  if (battle.enemyHealth <= 0) return winBattle();
  expireTurnEffects(battle);
  if (battle.creatures.some((creature) => !creature.tapped)) {
    battle.phase = 'blocks';
    battle.blockAssignments.clear();
    battle.selectedEnemyAttackerId = null;
    addLog('Der Gegner greift an. Weise deinen Kreaturen Blocker zu oder bestätige ohne Blocker.');
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
  addLog(`${state.battle.enemy.name} ist besiegt!`);
  if (node >= ENCOUNTERS.length) return endRun(true);
  state.node += 1;
  state.packs = [chooseRandomCards(state.pool, 5)];
  state.draftKind = 'reward';
  state.selection.clear();
  renderDraft();
  showScreen('draft-screen');
  animateBoosterOpening();
  showToast(`${state.battle.enemy.name} besiegt. Vor dem nächsten Kampf startest du wieder mit 30 Leben.`);
  playSound(760, 0.16);
}

function endRun(won) {
  const end = $('#end-screen');
  end.dataset.result = won ? 'win' : 'loss';
  $('#end-emblem').textContent = won ? '✦' : '×';
  $('#end-eyebrow').textContent = won ? 'KAMPAGNE ABGESCHLOSSEN' : 'RUN BEENDET';
  $('#end-title').textContent = won ? 'Der Mana-Pfad ist deiner.' : 'Der Pfad endet hier.';
  $('#end-message').textContent = won
    ? 'Du hast den Splitterdrachen besiegt und den Run gemeistert. Dein Booster-Deck hat sich bewährt.'
    : `Du bist in Kampf ${state.node} gefallen. Passe deinen Draft an und versuche es erneut.`;
  $('#run-summary').innerHTML = `<span>RUN <b>${state.node} / 4</b></span><span>DECK <b>${state.deck.length}</b></span><span>LEBEN <b>${Math.max(0, state.playerHealth)}</b></span>`;
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
    oscillator.type = 'square';
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

$('#start-button').addEventListener('click', startNewRun);
$('#restart-button').addEventListener('click', startNewRun);
$('#end-turn-button').addEventListener('click', handleCombatAction);
$('#mulligan-button').addEventListener('click', freeMulligan);
$('#sound-toggle').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  $('#sound-toggle span').textContent = state.soundOn ? 'TON AN' : 'TON AUS';
  $('#sound-toggle').setAttribute('aria-label', state.soundOn ? 'Ton ausschalten' : 'Ton einschalten');
  $('#sound-toggle').title = state.soundOn ? 'Ton ausschalten' : 'Ton einschalten';
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
