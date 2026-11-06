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
  soundOn: false,
  audio: null,
  toastTimer: null,
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

function effectSummary(card) {
  const text = card.oracle_text || '';
  if (isLand(card)) return `Land · erzeugt ${cardColor(card)} Mana`;
  if (isCreature(card)) {
    const stats = parseStats(card);
    return `Kreatur ${stats.power}/${stats.toughness} · greift automatisch an`;
  }
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(?:a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+\+(\d+)\/\+(\+?\d+)/i);
  if (damage) return `Schaden: ${damage[1]} · direkt auf den Gegner`;
  if (life) return `Heilt ${life[1]} Leben`;
  if (draw) return 'Kartentext: zusätzliche Karte ziehen';
  if (buff) return `Stärkt eine Kreatur um +${buff[1]}/+${buff[2]}`;
  if (/counter target/i.test(text)) return 'Kontert einen gegnerischen Zauber: Schild';
  if (/create .*token/i.test(text)) return 'Erschafft einen kleinen Spielstein';
  return `Roguelike-Zauberwirkung: ${Math.max(3, card.cmc * 2 + 2)} Schaden`;
}

function makeCardMarkup(card, packIndex, cardIndex, selected) {
  const image = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} – Kartenbild" loading="lazy" />`
    : '<div class="card-fallback-art" aria-hidden="true">✦</div>';
  const stat = isCreature(card) ? ` · ${escapeHtml(card.power || '?')}/${escapeHtml(card.toughness || '?')}` : '';
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.type_line)}, ${escapeHtml(card.mana_cost || 'Land')}${selected ? ', ausgewählt' : ''}">
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
    return `<section class="booster-pack"><header><span>BOOSTER ${String(packIndex + 1).padStart(2, '0')}</span><small>${selectedIndex === undefined ? 'WÄHLE 1 KARTE' : '1 / 1 GEWÄHLT'}</small></header><div class="booster-cards">${pack.map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, selectedIndex === cardIndex)).join('')}</div></section>`;
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
  renderDraft();
  playSound(560, 0.045);
});

$('#draft-confirm').addEventListener('click', confirmDraft);

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
    landAvailable: true,
    turn: 1,
    deck: shuffle(state.deck),
    discard: [],
    hand: [],
    creatures: [],
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
  $('#enemy-intent').innerHTML = `<span class="intent-icon">⚔</span><span>Angriff geplant</span><b>${battle.enemyIntent}</b>`;
  $('#turn-label').textContent = `ZUG ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < state.node ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Kampf ${index + 1}"></i>`).join('');
  $('#discard-count').textContent = String(battle.discard.length);
  $('#library-count').textContent = String(battle.deck.length);
  $('#hand-count').textContent = `${battle.hand.length} KARTEN`;
  $('#creature-count').textContent = `${battle.creatures.length} / 3`;
  $('#battle-log').innerHTML = battle.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  renderHand();
  renderCreatures();
  renderDropZones();
}

function renderHand() {
  const battle = state.battle;
  if (!battle) return;
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const image = card.image
      ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
      : '<div class="hand-fallback" aria-hidden="true">✦</div>';
    const isPlayableLand = isLand(card) && battle.landAvailable;
    const canPay = isLand(card) ? isPlayableLand : Boolean(paymentPlan(card));
    const boardFull = isCreature(card) && battle.creatures.length >= 3;
    const blocked = !canPay || boardFull;
    return `<button class="hand-card${isLand(card) ? ' land-in-hand' : ''}" data-hand-index="${index}" data-side="${defaultTarget(card)}" data-effect="${escapeHtml(card.oracle_text || effectSummary(card))}" draggable="true" title="${escapeHtml(card.name)} · ${escapeHtml(card.mana_cost || 'Land')}${blocked ? ' · aktuell nicht spielbar' : ''}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.mana_cost || 'Land')}, per Drag-and-drop spielen">
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
  const creatures = state.battle.creatures;
  if (!creatures.length) {
    $('#creature-row').innerHTML = '<div class="empty-board">Kreaturen hier ablegen oder eine Karte ausspielen.</div>';
    return;
  }
  $('#creature-row').innerHTML = creatures.map((creature) => {
    const image = creature.card.image ? `<img src="${escapeHtml(creature.card.image)}" alt="${escapeHtml(creature.card.name)}" loading="lazy" />` : '<span class="creature-symbol">✦</span>';
    const waiting = state.battle.turn <= creature.summonedTurn && !creature.haste;
    return `<div class="creature-token" title="${escapeHtml(creature.card.name)} · ${creature.power}/${creature.toughness}">${image}<div class="creature-meta"><b>${escapeHtml(creature.card.name)}</b><small class="${waiting ? 'summoning-sick' : ''}">${waiting ? 'Erschöpfung · wartet auf Zug 2' : 'Angriff bereit'}</small></div><b class="creature-stats">${creature.power}/${creature.toughness}</b></div>`;
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
  const buff = text.match(/gets?\s+\+(\d+)\/(\+?\d+)/i);
  if (buff) {
    const target = battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
    if (target) {
      target.power += Number(buff[1]);
      target.toughness += Number(buff[2].replace('+', ''));
      addLog(`${card.name}: ${target.card.name} wird stärker.`);
    } else {
      battle.playerBlock += 3;
      addLog(`${card.name}: Kein Ziel im Spiel – du erhältst 3 Schild.`);
    }
    recognized = true;
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
    battle.creatures.push({ card: { ...card, name: `${card.name} (Spielstein)`, image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, haste: false, lifelink: false, deathtouch: false });
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
  if (isLand(card)) {
    if (!battle.landAvailable) return showToast('Du hast in diesem Zug bereits ein Land gespielt.');
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
  payment.forEach((land) => { land.tapped = true; });
  battle.hand.splice(index, 1);
  battle.discard.push(card);
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = card.oracle_text || '';
    battle.creatures.push({
      card,
      power: stats.power,
      toughness: stats.toughness,
      summonedTurn: battle.turn,
      haste: /\bhaste\b/i.test(keywords),
      lifelink: /\blifelink\b/i.test(keywords),
      deathtouch: /\bdeathtouch\b/i.test(keywords)
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

function finishTurn() {
  const battle = state.battle;
  if (!battle) return;
  const attackers = battle.creatures.filter((creature) => battle.turn > creature.summonedTurn || creature.haste);
  const totalDamage = attackers.reduce((sum, creature) => sum + creature.power, 0);
  for (const creature of attackers) {
    battle.enemyHealth -= creature.deathtouch ? Math.max(1, battle.enemyHealth) : creature.power;
    if (creature.lifelink) state.playerHealth = Math.min(30, state.playerHealth + creature.power);
  }
  if (attackers.length) addLog(`Deine Kreaturen greifen gemeinsam für ${totalDamage} Schaden an.`);
  else addLog('Keine Kreatur kann in diesem Zug angreifen.');
  if (battle.enemyHealth <= 0) return winBattle();

  const incoming = Math.max(0, battle.enemyIntent - battle.playerBlock);
  state.playerHealth -= incoming;
  if (battle.playerBlock) addLog(`Du fängst ${Math.min(battle.playerBlock, battle.enemyIntent)} Schaden mit Schild ab.`);
  if (incoming > 0) addLog(`${battle.enemy.name} trifft dich für ${incoming} Schaden.`);
  if (state.playerHealth <= 0) return endRun(false);

  battle.playerBlock = 0;
  battle.turn += 1;
  battle.landAvailable = true;
  battle.lands.forEach((land) => { land.tapped = false; });
  battle.enemyIntent = battle.enemy.attack + Math.floor((battle.turn - 1) / 2);
  drawToHand(5);
  renderBattle();
  playSound(230, 0.08);
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

$('#start-button').addEventListener('click', startNewRun);
$('#restart-button').addEventListener('click', startNewRun);
$('#end-turn-button').addEventListener('click', finishTurn);
$('#sound-toggle').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  $('#sound-toggle span').textContent = state.soundOn ? 'TON AN' : 'TON AUS';
  if (state.soundOn) playSound(600, 0.08);
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
