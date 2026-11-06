const API_URL = 'https://api.scryfall.com/cards/search?q=' + encodeURIComponent('game:paper (t:creature or t:instant or t:sorcery or t:artifact or t:enchantment) cmc<=4') + '&order=random&unique=cards';
const CACHE_KEY = 'booster-tutor-card-pool-v1';
const CACHE_TTL = 12 * 60 * 60 * 1000;

const FALLBACK_CARDS = [
  { id: 'demo-firebolt', name: 'Glutfunke', mana_cost: '{R}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo-Effekt: Verursacht 4 Schaden.', power: '', toughness: '', image: '', color_identity: ['R'], uri: '' },
  { id: 'demo-sentinel', name: 'Dämmerwacht', mana_cost: '{1}{W}', cmc: 2, type_line: 'Creature — Human Soldier', oracle_text: 'Eine standhafte Wache aus dem Grenzland.', power: '2', toughness: '3', image: '', color_identity: ['W'], uri: '' },
  { id: 'demo-spark', name: 'Sternensplitter', mana_cost: '{2}{U}', cmc: 3, type_line: 'Sorcery', oracle_text: 'Demo-Effekt: Ziehe eine Karte und erhalte 3 Schild.', power: '', toughness: '', image: '', color_identity: ['U'], uri: '' },
  { id: 'demo-wolf', name: 'Nebelwald-Wolf', mana_cost: '{1}{G}', cmc: 2, type_line: 'Creature — Wolf', oracle_text: 'Ein schneller Jäger, der jede Runde angreift.', power: '3', toughness: '2', image: '', color_identity: ['G'], uri: '' },
  { id: 'demo-mending', name: 'Seelenflicken', mana_cost: '{1}{B}', cmc: 2, type_line: 'Instant', oracle_text: 'Demo-Effekt: Stelle 5 Leben wieder her.', power: '', toughness: '', image: '', color_identity: ['B'], uri: '' },
  { id: 'demo-golem', name: 'Basaltgolem', mana_cost: '{3}', cmc: 3, type_line: 'Artifact Creature — Golem', oracle_text: 'Eine schwerfällige Maschine aus altem Stein.', power: '3', toughness: '4', image: '', color_identity: [], uri: '' },
  { id: 'demo-vines', name: 'Wurzelgriff', mana_cost: '{G}', cmc: 1, type_line: 'Instant', oracle_text: 'Demo-Effekt: Dein stärkster Verbündeter erhält +2/+2.', power: '', toughness: '', image: '', color_identity: ['G'], uri: '' },
  { id: 'demo-bat', name: 'Abenddämmer-Fledermaus', mana_cost: '{2}{B}', cmc: 3, type_line: 'Creature — Bat', oracle_text: 'Flying, lifelink', power: '2', toughness: '2', image: '', color_identity: ['B'], uri: '' }
];

const ENCOUNTERS = [
  { name: 'Moosgoblin', rank: 'GEGENSPIELER', location: 'DIE VERGESSENE LICHTUNG', health: 22, attack: 4, sprite: '♟' },
  { name: 'Runenjägerin', rank: 'ELITE', location: 'DER ZERBROCHENE PASS', health: 30, attack: 5, sprite: '♜' },
  { name: 'Dornenhydra', rank: 'ELITE', location: 'DAS WURZELGEWÖLBE', health: 38, attack: 6, sprite: '♞' },
  { name: 'Splitterdrache', rank: 'BOSS', location: 'DIE KRONENKAMMER', health: 48, attack: 8, sprite: '♛' }
];

const state = {
  pool: [],
  deck: [],
  selection: new Set(),
  pack: [],
  draftKind: 'starter',
  playerHealth: 30,
  node: 1,
  battle: null,
  logs: [],
  soundOn: false,
  audio: null,
  toastTimer: null
};

const $ = (selector) => document.querySelector(selector);
const screens = ['start-screen', 'loading-screen', 'draft-screen', 'combat-screen', 'end-screen'];

function showScreen(id) {
  for (const screen of screens) $(('#' + screen)).classList.toggle('active', screen === id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function imageFor(card) {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
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
    image: imageFor(card),
    color_identity: card.color_identity || [],
    uri: card.scryfall_uri || ''
  };
}

function validCard(card) {
  return card && card.name && !/\bLand\b/i.test(card.type_line) && card.cmc <= 4 && card.cmc >= 0;
}

async function loadCardPool() {
  let cached = null;
  try { cached = localStorage.getItem(CACHE_KEY); } catch { /* Storage is optional. */ }
  if (cached) {
    try {
      const value = JSON.parse(cached);
      if (Date.now() - value.savedAt < CACHE_TTL && Array.isArray(value.cards) && value.cards.length >= 8) {
        return { cards: value.cards, cached: true };
      }
    } catch { /* Ignore malformed browser cache. */ }
  }

  $('#loading-message').textContent = 'Rufe eine kleine Auswahl echter Karten ab.';
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Kartendienst antwortet mit ' + response.status);
    const payload = await response.json();
    const cards = (payload.data || []).map(normalizeCard).filter(validCard);
    if (cards.length < 8) throw new Error('Die Kartenauswahl ist zu klein.');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards })); } catch { /* Continue without browser caching. */ }
    return { cards, cached: false };
  } catch (error) {
    if (cached) {
      try {
        const stale = JSON.parse(cached);
        if (Array.isArray(stale.cards) && stale.cards.length) return { cards: stale.cards, cached: true, warning: 'Offline: gespeicherte Kartenauswahl wird genutzt.' };
      } catch { /* Use local demo cards below. */ }
    }
    return { cards: FALLBACK_CARDS, cached: false, fallback: true, warning: 'Kartendienst nicht erreichbar – Offline-Demo-Karten werden verwendet.' };
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

function startNewRun() {
  state.deck = [];
  state.playerHealth = 30;
  state.node = 1;
  state.battle = null;
  state.selection.clear();
  showScreen('loading-screen');
  loadCardPool().then(({ cards, cached, fallback, warning }) => {
    state.pool = cards;
    const status = $('#start-api-status span');
    status.textContent = fallback ? 'OFFLINE-DEMO' : cached ? 'SCRYFALL · CACHE' : 'SCRYFALL · VERBUNDEN';
    status.style.color = fallback ? '#f0af83' : '#78dcb5';
    if (warning) showToast(warning);
    state.pack = chooseRandomCards(state.pool, 5);
    state.draftKind = 'starter';
    renderDraft();
    showScreen('draft-screen');
    playSound(440, 0.07);
  });
}

function makeCardMarkup(card, index, selected) {
  const image = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)} – Kartenbild" loading="lazy" />`
    : '<div class="card-fallback-art" aria-hidden="true">✦</div>';
  const stat = /\bCreature\b/i.test(card.type_line) ? ` · ${escapeHtml(card.power || '?')}/${escapeHtml(card.toughness || '?')}` : '';
  const action = effectSummary(card);
  return `<button class="draft-option${selected ? ' selected' : ''}" data-card-index="${index}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${escapeHtml(card.type_line)}, Manawert ${card.cmc}${selected ? ', ausgewählt' : ''}">
    <div class="card-image-wrap">${image}<span class="card-cost">${escapeHtml(card.cmc)}</span></div>
    <span class="draft-card-name">${escapeHtml(card.name)}${stat}</span>
    <p class="draft-card-type">${escapeHtml(card.type_line)}</p>
    <div class="draft-card-effect">${escapeHtml(action)}</div>
  </button>`;
}

function renderDraft() {
  const starter = state.draftKind === 'starter';
  const needed = starter ? 2 : 1;
  $('#draft-step').textContent = starter ? 'STARTDECK' : `RUN ${String(state.node).padStart(2, '0')} / 04`;
  $('#draft-title').textContent = starter ? 'Dein erstes Booster' : 'Beute aus dem Booster';
  $('#draft-instruction').textContent = starter ? 'Wähle 2 Karten. Jede kommt dreimal in dein Startdeck.' : 'Wähle 1 Karte. Sie kommt zweimal in dein Deck.';
  $('#pack-number').textContent = starter ? '01' : String(state.node + 1).padStart(2, '0');
  $('#deck-count').textContent = String(state.deck.length);
  $('#draft-grid').innerHTML = state.pack.map((card, index) => makeCardMarkup(card, index, state.selection.has(index))).join('');
  $('#selection-status').textContent = `Ausgewählt: ${state.selection.size} / ${needed}`;
  $('#draft-confirm').disabled = state.selection.size !== needed;
  $('#draft-confirm').innerHTML = starter ? 'KARTEN INS DECK <span>→</span>' : 'KARTE HINZUFÜGEN <span>→</span>';
  $('#draft-grid').querySelectorAll('.draft-option').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.cardIndex);
      if (state.selection.has(index)) state.selection.delete(index);
      else if (state.selection.size < needed) state.selection.add(index);
      else showToast(`Für dieses Pack kannst du ${needed} Karte${needed > 1 ? 'n' : ''} wählen.`);
      renderDraft();
      playSound(560, 0.045);
    });
  });
  $('#draft-confirm').onclick = confirmDraft;
}

function confirmDraft() {
  const selected = [...state.selection].map((index) => state.pack[index]).filter(Boolean);
  const copies = state.draftKind === 'starter' ? 3 : 2;
  for (const card of selected) for (let i = 0; i < copies; i += 1) state.deck.push(card);
  state.selection.clear();
  if (state.draftKind === 'starter') beginBattle(1);
  else beginBattle(state.node);
}

function beginBattle(node) {
  state.node = node;
  const enemy = ENCOUNTERS[node - 1];
  const battleDeck = shuffle(state.deck);
  state.battle = {
    enemy,
    enemyHealth: enemy.health,
    enemyMaxHealth: enemy.health,
    enemyBlock: 0,
    enemyIntent: enemy.attack,
    playerBlock: 0,
    manaMax: 1,
    mana: 1,
    landAvailable: true,
    turn: 1,
    deck: battleDeck,
    discard: [],
    hand: [],
    creatures: [],
    log: []
  };
  drawToHand(5);
  addLog(`Du stellst dich ${enemy.name} entgegen. Spiele ein Land, um dein Mana zu erhöhen.`);
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
  if (!state.battle || state.battle.deck.length || !state.battle.discard.length) return;
  state.battle.deck = shuffle(state.battle.discard);
  state.battle.discard = [];
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
  if (/\bCreature\b/i.test(card.type_line)) {
    const stats = parseStats(card);
    return `Kreatur ${stats.power}/${stats.toughness} · greift automatisch an`;
  }
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(?:a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+\+(\d+)\/\+(\d+)/i);
  if (damage) return `Schaden: ${damage[1]} · direkt auf den Gegner`;
  if (life) return `Heilt ${life[1]} Leben`;
  if (draw) return 'Kartentext: zusätzliche Karte ziehen';
  if (buff) return `Stärkt eine Kreatur um +${buff[1]}/+${buff[2]}`;
  if (/counter target/i.test(text)) return 'Kontert einen gegnerischen Zauber: Schild';
  if (/create .*token/i.test(text)) return 'Erschafft einen kleinen Spielstein';
  return `Zauberwirkung im Run: ${Math.max(3, card.cmc * 2 + 2)} Schaden`;
}

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  const enemy = battle.enemy;
  $('#node-counter').textContent = String(state.node).padStart(2, '0');
  $('#location-name').textContent = enemy.location;
  $('#enemy-rank').textContent = enemy.rank;
  $('#enemy-name').textContent = enemy.name;
  $('#enemy-art .enemy-sprite').textContent = enemy.sprite;
  $('#enemy-health-label').textContent = `${Math.max(0, battle.enemyHealth)} / ${battle.enemyMaxHealth}`;
  $('#enemy-health-fill').style.width = `${Math.max(0, battle.enemyHealth / battle.enemyMaxHealth * 100)}%`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)} / 30`;
  $('#player-health-fill').style.width = `${Math.max(0, state.playerHealth / 30 * 100)}%`;
  $('#mana-label').textContent = `${battle.mana} / ${battle.manaMax}`;
  $('#land-button').disabled = !battle.landAvailable || battle.manaMax >= 6;
  $('#land-status').textContent = battle.manaMax >= 6 ? 'MAXIMUM' : battle.landAvailable ? 'VERFÜGBAR' : 'GEBRAUCHT';
  $('#land-button').title = 'Einmal pro Zug ein Land spielen. Erhöht dein maximales Mana und füllt 1 Mana auf.';
  $('#enemy-intent').innerHTML = `<span class="intent-icon">⚔</span><span>Angriff geplant</span><b>${battle.enemyIntent}</b>`;
  $('#turn-label').textContent = `ZUG ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < state.node ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Kampf ${index + 1}"></i>`).join('');
  $('#discard-count').textContent = String(battle.discard.length);
  $('#hand-count').textContent = `${battle.hand.length} KARTEN`;
  $('#creature-count').textContent = `${battle.creatures.length} / 3`;
  $('#battle-log').innerHTML = battle.log.slice(0, 3).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
  $('#end-turn-button').disabled = false;
  renderHand();
  renderCreatures();
}

function renderHand() {
  const battle = state.battle;
  if (!battle) return;
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const image = card.image
      ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
      : '<div class="hand-fallback" aria-hidden="true">✦</div>';
    const tooCostly = card.cmc > battle.mana;
    const fullBoard = /\bCreature\b/i.test(card.type_line) && battle.creatures.length >= 3;
    return `<button class="hand-card" data-hand-index="${index}" data-effect="${escapeHtml(card.oracle_text || effectSummary(card))}" title="${escapeHtml(card.name)} · ${card.cmc} Mana${tooCostly ? ' · zu wenig Mana' : ''}" ${tooCostly || fullBoard ? 'disabled' : ''} aria-label="${escapeHtml(card.name)}, ${card.cmc} Mana, ${tooCostly ? 'zu wenig Mana' : 'ausspielen'}">
      ${image}<span class="hand-cost">${escapeHtml(card.cmc)}</span><span class="hand-card-name">${escapeHtml(card.name)}</span>
    </button>`;
  }).join('');
  $('#hand-row').querySelectorAll('.hand-card:not(:disabled)').forEach((button) => button.addEventListener('click', () => playCard(Number(button.dataset.handIndex))));
}

function renderCreatures() {
  const creatures = state.battle.creatures;
  if (!creatures.length) {
    $('#creature-row').innerHTML = '<div class="empty-board">Noch keine Kreaturen im Spiel.</div>';
    return;
  }
  $('#creature-row').innerHTML = creatures.map((creature) => {
    const image = creature.card.image ? `<img src="${escapeHtml(creature.card.image)}" alt="" loading="lazy" />` : '<span class="creature-symbol">✦</span>';
    const waiting = state.battle.turn <= creature.summonedTurn && !creature.haste;
    return `<div class="creature-token">${image}<div class="creature-meta"><b>${escapeHtml(creature.card.name)}</b><small class="${waiting ? 'summoning-sick' : ''}">${waiting ? 'Erschöpfung · wartet auf Zug 2' : 'Angriff bereit'}</small></div><b class="creature-stats">${creature.power}/${creature.toughness}</b></div>`;
  }).join('');
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
    const token = { card: { ...card, name: `${card.name} (Spielstein)`, image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, haste: false, lifelink: false, deathtouch: false };
    battle.creatures.push(token);
    addLog(`${card.name}: Ein 2/2-Spielstein kommt ins Spiel.`);
    recognized = true;
  }
  if (!recognized && !creature) {
    const amount = Math.max(3, card.cmc * 2 + 2);
    battle.enemyHealth -= amount;
    addLog(`${card.name}: vereinfachter Zaubereffekt – ${amount} Schaden.`);
  }
}

function playCard(index) {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card || card.cmc > battle.mana) return;
  const isCreature = /\bCreature\b/i.test(card.type_line);
  if (isCreature && battle.creatures.length >= 3) {
    showToast('Dein Kreaturenfeld ist voll.');
    return;
  }
  battle.mana -= card.cmc;
  battle.hand.splice(index, 1);
  battle.discard.push(card);
  if (isCreature) {
    const stats = parseStats(card);
    const keywords = card.oracle_text || '';
    const creature = {
      card,
      power: stats.power,
      toughness: stats.toughness,
      summonedTurn: battle.turn,
      haste: /\bhaste\b/i.test(keywords),
      lifelink: /\blifelink\b/i.test(keywords),
      deathtouch: /\bdeathtouch\b/i.test(keywords)
    };
    battle.creatures.push(creature);
    addLog(`${card.name} kommt als ${creature.power}/${creature.toughness}-Kreatur ins Spiel.`);
    applyOracle(card, true);
  } else {
    applyOracle(card, false);
  }
  playSound(680 - card.cmc * 60, 0.065);
  if (battle.enemyHealth <= 0) return winBattle();
  renderBattle();
}

function playLand() {
  const battle = state.battle;
  if (!battle || !battle.landAvailable || battle.manaMax >= 6) return;
  battle.landAvailable = false;
  battle.manaMax += 1;
  battle.mana += 1;
  addLog(`Du spielst ein Land. Dein maximales Mana steigt auf ${battle.manaMax}.`);
  playSound(520, 0.08);
  renderBattle();
}

function finishTurn() {
  const battle = state.battle;
  if (!battle) return;
  const attackers = battle.creatures.filter((creature) => battle.turn > creature.summonedTurn || creature.haste);
  let totalDamage = 0;
  for (const creature of attackers) {
    const damage = creature.deathtouch ? Math.max(1, battle.enemyHealth) : creature.power;
    battle.enemyHealth -= damage;
    totalDamage += damage;
    if (creature.lifelink) state.playerHealth = Math.min(30, state.playerHealth + damage);
  }
  if (attackers.length) addLog(`Deine Kreaturen greifen gemeinsam für ${totalDamage} Schaden an.`);
  else addLog('Keine Kreatur kann in diesem Zug angreifen.');
  if (battle.enemyHealth <= 0) return winBattle();

  const incoming = Math.max(0, battle.enemyIntent - battle.playerBlock);
  state.playerHealth -= incoming;
  if (battle.playerBlock) addLog(`Du fängst ${Math.min(battle.playerBlock, battle.enemyIntent)} Schaden mit Schild ab.`);
  if (incoming > 0) addLog(`${battle.enemy.name} trifft dich für ${incoming} Schaden.`);
  else addLog(`Der Angriff von ${battle.enemy.name} richtet keinen Schaden an.`);
  battle.playerBlock = 0;
  if (state.playerHealth <= 0) return endRun(false);

  battle.turn += 1;
  battle.landAvailable = true;
  battle.mana = battle.manaMax;
  battle.enemyIntent = battle.enemy.attack + Math.floor((battle.turn - 1) / 2);
  drawToHand(5);
  renderBattle();
  playSound(230, 0.08);
}

function winBattle() {
  const node = state.node;
  addLog(`${state.battle.enemy.name} ist besiegt!`);
  if (node >= ENCOUNTERS.length) {
    endRun(true);
    return;
  }
  state.playerHealth = Math.min(30, state.playerHealth + 5);
  state.node += 1;
  state.pack = chooseRandomCards(state.pool, 5);
  state.draftKind = 'reward';
  state.selection.clear();
  $('#draft-title').textContent = 'Booster-Beute';
  renderDraft();
  showScreen('draft-screen');
  showToast(`${state.battle.enemy.name} besiegt · 5 Leben regeneriert.`);
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
  } catch { /* Sound is an optional retro detail. */ }
}

$('#start-button').addEventListener('click', startNewRun);
$('#restart-button').addEventListener('click', startNewRun);
$('#land-button').addEventListener('click', playLand);
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
