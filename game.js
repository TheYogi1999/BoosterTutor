const CARD_QUERY = 'game:paper lang:en (t:creature or t:instant or t:sorcery or t:artifact or t:enchantment) cmc<=5';
const LAND_QUERY = 'game:paper lang:en t:basic t:land';
const API_BASE = 'https://api.scryfall.com/cards/search?q=';
const CACHE_KEY = 'booster-tutor-card-pool-arena-v5';
const HAND_SIZE = 7;
const PACK_SIZE = 7;
const CACHE_TTL = 12 * 60 * 60 * 1000;
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const COLOR_NAMES = { W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' };

const FALLBACK_CARDS = [
  { id: 'demo-aegis', name: 'Aether Aegis', cmc: 2, mana_cost: '{2}', type_line: 'Enchantment', oracle_text: 'At the beginning of your turn, gain 2 shield.', image: '', art: '' },
  { id: 'demo-blade', name: 'Wayfarer Blade', cmc: 1, mana_cost: '{1}', type_line: 'Artifact — Equipment', oracle_text: 'Equipped creature gets +2/+1.', image: '', art: '' },
  { id: 'demo-aura', name: 'Wings of Aether', cmc: 2, mana_cost: '{2}', type_line: 'Enchantment — Aura', oracle_text: 'Enchanted creature gets +1/+1 and has flying.', image: '', art: '' },
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
  hideCardPreview();
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
  return Boolean(creature?.[property] || creature?.temporaryKeywords?.includes(keyword) || creature?.permanentKeywords?.includes(keyword));
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
      if (Date.now() - value.savedAt < CACHE_TTL && value.cards?.length >= 21) {
        return { cards: value.cards, lands: value.lands || [], cached: true };
      }
    } catch { /* Ignore malformed browser cache. */ }
  }

  $('#loading-message').textContent = 'Lade sieben Karten pro Pack aus der Kartendatenbank.';
  try {
    const spellPayload = await apiSearch(CARD_QUERY);
    const cards = (spellPayload.data || []).map(normalizeCard).filter(validSpell);
    const lands = [];
    if (cards.length < 21) throw new Error('The card selection is too small.');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), cards, lands })); } catch { /* Continue without browser caching. */ }
    return { cards, lands, cached: false };
  } catch (error) {
    if (cached) {
      try {
        const stale = JSON.parse(cached);
        if (stale.cards?.length) return { cards: stale.cards, lands: stale.lands || [], cached: true, warning: 'Offline: using saved cards.' };
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
  while (cards.length < PACK_SIZE * 3) cards.push(...shuffle(FALLBACK_CARDS));
  return Array.from({ length: 3 }, (_, index) => cards.slice(index * PACK_SIZE, (index + 1) * PACK_SIZE));
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
    state.activePack = 0;
    state.boosterSealed = true;
    renderDraft();
    showScreen('draft-screen');
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

function isPermanent(card) { return !isCreature(card) && /\b(?:Enchantment|Artifact)\b/i.test(card.type_line || ''); }
function isAttachment(card) { return /\b(?:Aura|Equipment)\b/i.test(card.type_line || ''); }
function isAura(card) { return /\bAura\b/i.test(card.type_line || ''); }

// This effect plan drives both execution and the rules bubble.
function cardEffects(card, creature = isCreature(card)) {
  if (card.id === 'demo-spark') return [{ kind: 'draw', amount: 1 }, { kind: 'shield', amount: 3 }];
  if (card.id === 'demo-mending') return [{ kind: 'heal', amount: 5 }];
  const text = card.oracle_text || '';
  const effects = [];
  const damage = text.match(/deals?\s+(\d+)\s+damage/i);
  const life = text.match(/you gain\s+(\d+)\s+life/i);
  const draw = text.match(/draw\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?/i);
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  const grant = text.match(/gains?\s+([^.;\n]+?)\s+until end of turn/i);
  if (damage) effects.push({ kind: 'damage', amount: Number(damage[1]) });
  if (life) effects.push({ kind: 'heal', amount: Number(life[1]) });
  if (draw) effects.push({ kind: 'draw', amount: Math.min(3, ({ a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 })[draw[1].toLowerCase()] || Number(draw[1]) || 1) });
  if (buff) effects.push({ kind: 'buff', power: Number(buff[1]), toughness: Number(buff[2]), temporary: /until end of turn/i.test(text) });
  if (grant) {
    const keywords = grant[1].match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste)\b/gi) || [];
    if (keywords.length) effects.push({ kind: 'keywords', keywords: keywords.map(value => value.toLowerCase()) });
  }
  if (/counter target/i.test(text)) effects.push({ kind: 'shield', amount: 5 });
  if (/destroy target creature|exile target creature/i.test(text)) effects.push({ kind: 'damage', amount: /exile target creature/i.test(text) ? 9 : 7 });
  if (/prevent the next|prevent all damage/i.test(text)) effects.push({ kind: 'shield', amount: 6 });
  if (/create .*token/i.test(text)) effects.push({ kind: 'token' });
  if (!effects.length && !creature) effects.push({ kind: 'damage', amount: Math.max(3, Math.ceil((card.cmc || 0) * 2 + 2)) });
  return effects;
}
function permanentEffect(card) {
  const text = card.oracle_text || '';
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  const attachment = isAttachment(card);
  const keywords = attachment ? (text.match(/(?:has|have|gains?)\s+([^.;\n]+)/i)?.[1] || '').match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste)\b/gi) || [] : [];
  return {
    power: buff ? Number(buff[1]) : attachment ? 1 : 0,
    toughness: buff ? Number(buff[2]) : attachment ? 1 : 0,
    keywords: keywords.map(value => value.toLowerCase()),
    shield: !attachment && !buff ? (card.id === 'demo-aegis' ? 2 : 1) : 0
  };
}
function signed(value) { return `${value >= 0 ? '+' : ''}${value}`; }
function effectDescriptions(card) {
  if (isPermanent(card)) {
    const effect = permanentEffect(card);
    const lines = ['Bleibt bis zum Ende dieses Kampfes auf dem Spielfeld.'];
    if (isAttachment(card)) {
      lines.push(`${isAura(card) ? 'Aura: Wähle beim Ausspielen' : 'Ausrüstung: Klicke sie an und wähle kostenlos'} eine eigene Kreatur.`);
      lines.push(`Die verbundene Kreatur erhält ${signed(effect.power)}/${signed(effect.toughness)}${effect.keywords.length ? ' und ' + effect.keywords.join(', ') : ''}.`);
      lines.push(isAura(card) ? 'Stirbt die Kreatur, geht die Aura in den Friedhof.' : 'Stirbt die Kreatur, bleibt die Ausrüstung liegen und kann neu angelegt werden.');
    } else if (effect.shield) lines.push(`Sofort und zu Beginn jedes eigenen Zuges: ${effect.shield} Schild. Schild verfällt nach dem gegnerischen Angriff.`);
    else lines.push(`Alle eigenen Kreaturen erhalten ${signed(effect.power)}/${signed(effect.toughness)}, solange diese Karte liegt.`);
    return lines;
  }
  const lines = [];
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywordLabels(creatureKeywords(card));
    lines.push(`Kreatur: ${stats.power} Angriff / ${stats.toughness} Widerstandskraft.${keywords ? ' Fähigkeiten: ' + keywords + '.' : ''}`);
    lines.push(/Artifact/.test(card.type_line) || creatureKeywords(card).haste ? 'Kann sofort angreifen.' : 'Kann ab dem nächsten Zug angreifen. Darf sofort blocken.');
  }
  for (const effect of cardEffects(card)) {
    if (effect.kind === 'damage') lines.push(`${effect.amount} Schaden am ersten lebenden Gegner. Überzähliger Schaden verfällt.`);
    if (effect.kind === 'heal') lines.push(`Heilt dich um ${effect.amount} Leben, höchstens auf 30.`);
    if (effect.kind === 'draw') lines.push(`Zieht ${effect.amount} Karte(n), bis zu ${HAND_SIZE} Handkarten.`);
    if (effect.kind === 'shield') lines.push(`Gibt ${effect.amount} Schild bis nach dem nächsten gegnerischen Angriff.`);
    if (effect.kind === 'buff') lines.push(`Stärkste eigene Kreatur: ${signed(effect.power)}/${signed(effect.toughness)}${effect.temporary ? ' bis Zugende' : ' für diesen Kampf'}. Ohne Kreatur: 3 Schild.`);
    if (effect.kind === 'keywords') lines.push(`Stärkste eigene Kreatur erhält ${effect.keywords.join(', ')} bis Zugende. Ohne Kreatur kein Effekt.`);
    if (effect.kind === 'token') lines.push('Erzeugt einen 2/2-Spielstein, wenn einer der 3 Kreaturenplätze frei ist.');
  }
  if (!isCreature(card)) lines.push('Geht nach dem Ausspielen in den Friedhof.');
  return lines;
}
function effectSummary(card) { return effectDescriptions(card).join(' '); }
function cardFace(card) {
  return card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" loading="lazy" />`
    : `<span class="printed-card"><strong>${escapeHtml(card.name)}</strong><small>${Math.ceil(card.cmc || 0)} Mana · ${escapeHtml(card.type_line)}</small><span class="printed-sigil">✦</span><span>${escapeHtml(effectSummary(card))}</span>${isCreature(card) ? `<b>${parseStats(card).power}/${parseStats(card).toughness}</b>` : ''}</span>`;
}

function makeCardMarkup(card, packIndex, cardIndex, selected) {
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" data-preview-owner="draft" style="--card-index:${cardIndex}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${Math.ceil(card.cmc || 0)} generisches Mana${selected ? ', ausgewählt' : ''}"><span class="card-image-wrap">${cardFace(card)}</span><span class="draft-card-name">${escapeHtml(card.name)}</span></button>`;
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
  const packIndex = state.activePack || 0;
  const chosen = state.selection.has(packIndex);
  const last = !starter || packIndex === 2;
  $('#draft-step').textContent = starter ? `PACK ${packIndex + 1} VON 3` : 'BELOHNUNG';
  $('#draft-title').textContent = state.boosterSealed ? 'Dein nächster Booster' : 'Welche Karte reist mit dir?';
  $('#draft-instruction').textContent = state.boosterSealed ? 'Öffne das Pack und entdecke sieben Karten.' : 'Wähle eine von sieben Karten. Du erhältst vier Exemplare. Fahre über eine Karte, um ihre Spielwirkung zu lesen.';
  $('#pack-number').textContent = `${packIndex + 1} / ${starter ? 3 : 1}`;
  $('#deck-count').textContent = String(state.deck.length + state.selection.size * 4);
  $('#draft-grid').innerHTML = state.boosterSealed
    ? `<div class="pack-stage"><div class="pack-particles" aria-hidden="true">✦ · ✧ · ✦</div><button class="sealed-pack" data-open-pack="true" aria-label="Booster ${packIndex + 1} öffnen"><span class="pack-foil"></span><span class="pack-logo">BOOSTER<br><b>TUTOR</b></span><span class="pack-emblem">✦</span><span class="pack-caption">AETHER EXPEDITION</span><span class="pack-card-count">7 KARTEN</span></button><p>Klicken zum Öffnen</p></div>`
    : `<div class="reveal-sparks" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--spark-angle:${index * 20}deg;--spark-distance:${110 + index % 4 * 60}px"></i>`).join('')}</div><section class="booster-pack"><header><span>BOOSTER ${packIndex + 1}</span><small>${chosen ? '1 KARTE GEWÄHLT' : 'WÄHLE 1 VON 7'}</small></header><div class="booster-cards">${state.packs[packIndex].map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, state.selection.get(packIndex) === cardIndex)).join('')}</div></section>`;
  $('#selection-status').textContent = state.boosterSealed ? 'Ein Pack nach dem anderen.' : chosen ? 'Deine Karte ist ausgewählt.' : 'Kosten und tatsächliche Effekte stehen in der Infoblase.';
  $('#draft-confirm').disabled = state.boosterSealed || !chosen;
  $('#draft-confirm').textContent = last ? starter ? 'DECK BAUEN →' : 'KARTE MITNEHMEN →' : 'NÄCHSTES PACK →';
}

$('#draft-grid').addEventListener('click', (event) => {
  if (event.target.closest('[data-open-pack]')) {
    if (!state.boosterSealed) return;
    state.boosterSealed = false;
    renderDraft();
    animateBoosterOpening();
    return;
  }
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
  if (battle.pendingAttachment) return selectAttachmentTarget(creature.id);
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
  if (starter && (state.activePack || 0) < 2) {
    if (!state.selection.has(state.activePack || 0)) return;
    state.activePack = (state.activePack || 0) + 1;
    state.boosterSealed = true;
    hideCardPreview();
    renderDraft();
    return;
  }
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
    permanents: [],
    pendingAttachment: null,
    selectedEnemyAttackerId: null,
    blockAssignments: new Map(),
    turnEffects: [],
    lands: [],
    log: []
  };
  drawToHand(HAND_SIZE);
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
  battle.pendingAttachment = null;
  battle.mulliganAvailable = false;
  drawToHand(HAND_SIZE);
  addLog('Free mulligan: Your opening hand was shuffled back. Draw seven cards.');
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
  const blocking = battle.phase === 'blocks';
  $('#enemy-board').innerHTML = `<div class="enemy-creatures-row">${battle.enemyCreatures.map(creature => {
    const ready = creatureCanAttack(creature, battle.turn);
    const selected = battle.selectedEnemyAttackerId === creature.id;
    const blocker = assignedBlockerName(battle, creature.id);
    return `<button type="button" class="enemy-creature${selected ? ' selected' : ''}${blocker ? ' is-blocked' : ''}" data-enemy-attacker="${escapeHtml(creature.id)}" data-preview-owner="enemy" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(creature.card.name)}, ${creature.power} Angriff, ${creature.health} Leben${blocker ? ', geblockt von ' + escapeHtml(blocker) : ''}"><span class="enemy-card-frame">${cardFace(creature.card)}</span><span class="field-caption"><b>${escapeHtml(creature.card.name)}</b><span>${creature.power} Angriff · ${creature.health}/${creature.maxHealth} Leben</span><small>${blocker ? `↔ ${escapeHtml(blocker)}` : ready ? blocking ? '⚔ Angreifer auswählen' : 'Bereit zum Angriff' : 'Wartet einen Zug'}</small></span></button>`;
  }).join('')}</div>`;
}

function renderGraveyard() {
  const graveyard = state.battle?.graveyard || [];
  $('#graveyard-count').textContent = String(graveyard.length);
  $('#graveyard-empty').hidden = graveyard.length > 0;
  const markup = (card, index) => `<button type="button" class="graveyard-card" data-preview-owner="graveyard" data-preview-index="${index}" aria-label="${escapeHtml(card.name)} im Friedhof">${cardFace(card)}</button>`;
  $('#graveyard-grid').innerHTML = graveyard.map(markup).reverse().join('');
  $('#graveyard-pile').innerHTML = graveyard.length ? markup(graveyard[graveyard.length - 1], graveyard.length - 1) : '<span class="empty-graveyard">✧<small>Noch keine Karten</small></span>';
  $('#graveyard-zone-count').textContent = String(graveyard.length);
}
function previewCardFor(element) {
  const owner = element.dataset.previewOwner;
  if (owner === 'draft') return state.packs[Number(element.dataset.packIndex)]?.[Number(element.dataset.cardIndex)] || null;
  const battle = state.battle;
  if (!battle) return null;
  if (owner === 'hand') return battle.hand[Number(element.dataset.handIndex)] || null;
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
  const preview = $('#card-preview');
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
    ? [`Gegner: ${creature.power} Angriff · ${creature.health}/${creature.maxHealth} Leben.`, `Angriff ${creatureCanAttack(creature, battle.turn) ? 'in diesem Zug' : 'ab dem nächsten Zug'}.`, creatureKeywordLabels(creature) || 'Keine besonderen Kampffähigkeiten.']
    : effectDescriptions(card);
  if (creature?.owner === 'player') lines.unshift(`Aktuell: ${creature.power}/${creature.toughness} · ${creature.damage || 0} Schaden · ${creature.tapped ? 'hat angegriffen, kann nicht blocken' : 'kann blocken'}.`);
  if (permanent) lines.push(attached ? `Verbunden mit: ${attached}.` : isAttachment(card) ? 'Noch nicht angelegt.' : 'Aktiv auf dem Spielfeld.');
  if (element.dataset.previewOwner === 'hand') lines.push(battle.phase !== 'main' ? 'In der Blockphase nicht spielbar.' : battle.mana < cost ? `Noch ${cost - battle.mana} Mana nötig.` : isCreature(card) && battle.creatures.length >= 3 ? 'Alle 3 Kreaturenplätze sind belegt.' : isAura(card) && !battle.creatures.length ? 'Benötigt eine eigene Kreatur.' : 'Klicken oder ziehen zum Ausspielen.');
  const keywordInfo = { flying:'Fliegend: nur durch Fliegend oder Reichweite blockbar.', reach:'Reichweite: kann fliegende Kreaturen blocken.', lifelink:'Lebensverknüpfung: Kampfschaden heilt den Besitzer.', deathtouch:'Todesberührung: jeder Kampfschaden ist für Kreaturen tödlich.', 'first strike':'Erstschlag: Schaden vor dem normalen Kampfschritt.', 'double strike':'Doppelschlag: Schaden in beiden Kampfschritten.', haste:'Eile: kann sofort angreifen.' };
  const activeKeywords = creature ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creature, keyword)) : isCreature(card) ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creatureKeywords(card), keyword)) : [];
  preview.innerHTML = `<div class="bubble-header"><b>${escapeHtml(card.name)}</b><strong>${cost} Mana</strong></div><div class="bubble-type">${escapeHtml(card.type_line)} · nur generische Kosten</div><ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>${activeKeywords.length ? `<div class="bubble-keywords">${activeKeywords.map(keyword => escapeHtml(keywordInfo[keyword])).join('<br>')}</div>` : ''}`;
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

function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  hideCardPreview();
  const enemy = battle.enemy;
  $('#shield-label').textContent = `${battle.playerBlock} Schild`;
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
  $('#end-turn-button').innerHTML = battle.phase === 'blocks' ? 'BLOCKEN BESTÄTIGEN <span>✓</span>' : 'ZUG BEENDEN <span>→</span>';
  $('#combat-action-hint').textContent = battle.pendingAttachment ? 'Wähle eine eigene Kreatur als Ziel · Abbrechen ist kostenlos.' : battle.phase === 'blocks'
    ? 'Wähle einen Angreifer, dann deinen Blocker. Du kannst Blocker auch auf Angreifer ziehen.'
    : 'Kreatur anklicken: angreifen oder zurückhalten · Hand wird auf 7 aufgefüllt.';
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
  renderPermanents();
  renderBlocking();
  renderDropZones();
}

function renderHand() {
  const battle = state.battle;
  const center = (battle.hand.length - 1) / 2;
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const position = index - center;
    const canPay = Boolean(paymentPlan(card));
    const selected = battle.pendingAttachment?.handIndex === index;
    return `<button type="button" class="hand-card${!canPay ? ' insufficient-mana' : ''}${selected ? ' targeting-card' : ''}" style="--fan-angle:${position * 4}deg;--fan-lift:${position * position * 3}px;--fan-index:${index}" data-hand-index="${index}" data-preview-owner="hand" draggable="${battle.phase === 'main'}" aria-label="${escapeHtml(card.name)}, ${Math.ceil(card.cmc || 0)} Mana" aria-pressed="${selected}">${cardFace(card)}</button>`;
  }).join('');
  $('#hand-row').querySelectorAll('.hand-card').forEach(button => {
    button.addEventListener('click', () => { hideCardPreview(); playCard(Number(button.dataset.handIndex), defaultTarget(battle.hand[Number(button.dataset.handIndex)])); });
    button.addEventListener('dragstart', event => {
      if (battle.phase !== 'main') return event.preventDefault();
      hideCardPreview();
      event.dataTransfer.setData('text/plain', button.dataset.handIndex);
      event.dataTransfer.effectAllowed = 'move';
    });
  });
}
function renderCreatures() {
  const battle = state.battle;
  $('#creature-row').innerHTML = battle.creatures.length ? battle.creatures.map(creature => {
    const waiting = !creatureCanAttack(creature, battle.turn);
    const entry = [...battle.blockAssignments.entries()].find(([, id]) => id === creature.id);
    const attacker = battle.enemyCreatures.find(item => item.id === entry?.[0]);
    const selectedAttacker = battle.enemyCreatures.find(item => item.id === battle.selectedEnemyAttackerId);
    const blocking = battle.phase === 'blocks';
    const legal = blocking && !creature.tapped && (!selectedAttacker || canBlockCreature(creature, selectedAttacker));
    const willAttack = !waiting && creature.willAttack !== false;
    const targeting = Boolean(battle.pendingAttachment);
    const status = targeting ? '✦ Als Ziel auswählen' : blocking ? attacker ? `↔ Blockt ${attacker.card.name}` : creature.tapped ? 'Hat angegriffen' : legal ? 'Zum Blocken auswählen' : 'Kann diesen Angriff nicht blocken' : waiting ? 'Wartet · kann blocken' : willAttack ? '⚔ Greift an · klicken zum Zurückhalten' : '⛨ Bleibt zum Blocken zurück';
    return `<button type="button" class="creature-token${legal ? ' can-block' : ''}${entry ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${!blocking && !waiting && !willAttack ? ' held-back' : ''}${targeting ? ' attachment-target' : ''}" data-creature-id="${escapeHtml(creature.id)}" data-preview-owner="player" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(entry) : !waiting && !willAttack}" aria-label="${escapeHtml(creature.card.name)}, ${escapeHtml(status)}" draggable="${blocking && !creature.tapped}"><span class="player-card-frame">${cardFace(creature.card)}</span><span class="field-caption"><b>${escapeHtml(creature.card.name)}</b><span>${creature.power}/${creature.toughness}${creature.damage ? ' · ' + creature.damage + ' Schaden' : ''}</span><small>${escapeHtml(status)}</small></span></button>`;
  }).join('') : '<div class="empty-board">Spiele eine Kreatur aus deiner Hand.<br>Bis zu drei Kreaturen können hier liegen.</div>';
}
function renderPermanents() {
  const battle = state.battle;
  $('#permanent-count').textContent = String(battle.permanents.length);
  $('#permanent-row').innerHTML = battle.permanents.length ? battle.permanents.map(permanent => {
    const target = battle.creatures.find(item => item.id === permanent.attachedTo);
    return `<button type="button" class="permanent-card${battle.pendingAttachment?.permanentId === permanent.id ? ' targeting-card' : ''}" data-permanent-id="${escapeHtml(permanent.id)}" data-preview-owner="permanent" data-preview-id="${escapeHtml(permanent.id)}" aria-label="${escapeHtml(permanent.card.name)}${target ? ', angelegt an ' + escapeHtml(target.card.name) : ''}"><span class="permanent-card-frame">${cardFace(permanent.card)}</span><span class="field-caption"><b>${escapeHtml(permanent.card.name)}</b><small>${target ? '↔ ' + escapeHtml(target.card.name) : isAttachment(permanent.card) ? 'Klicken zum Anlegen' : 'Aktive Verzauberung / Artefakt'}</small></span></button>`;
  }).join('') : '<p class="empty-permanents">Verzauberungen, Auren und Ausrüstungen bleiben hier sichtbar.</p>';
  $('#attachment-cancel').hidden = !battle.pendingAttachment;
}
function renderBlocking() {
  const battle = state.battle;
  const blocking = battle.phase === 'blocks';
  $('#blocking-panel').hidden = !blocking;
  $('#combat-screen').classList.toggle('is-blocking', blocking);
  if (!blocking) return;
  const attackers = battle.enemyCreatures.filter(creature => creatureCanAttack(creature, battle.turn));
  const unblocked = attackers.filter(creature => !battle.blockAssignments.has(creature.id));
  const damage = unblocked.reduce((sum, creature) => sum + Math.max(0, creature.power) * (hasCreatureKeyword(creature, 'double strike') ? 2 : 1), 0);
  $('#blocking-summary').textContent = `${battle.blockAssignments.size} von ${attackers.length} Angriffen geblockt · ${Math.max(0, damage - battle.playerBlock)} direkter Schaden nach ${battle.playerBlock} Schild`;
  $('#blocking-pairs').innerHTML = attackers.map(attacker => {
    const blocker = battle.creatures.find(creature => creature.id === battle.blockAssignments.get(attacker.id));
    return `<button type="button" data-block-attacker="${escapeHtml(attacker.id)}" class="block-pair${blocker ? ' paired' : ''}${battle.selectedEnemyAttackerId === attacker.id ? ' selected' : ''}" aria-pressed="${battle.selectedEnemyAttackerId === attacker.id}"><b>${escapeHtml(attacker.card.name)}</b><span>${blocker ? '⛨ ' + escapeHtml(blocker.card.name) : '→ Blocker wählen'}</span></button>`;
  }).join('');
}
$('#permanent-row').addEventListener('click', event => {
  const button = event.target.closest('[data-permanent-id]');
  const battle = state.battle;
  if (!button || battle?.phase !== 'main') return;
  const permanent = battle.permanents.find(item => item.id === button.dataset.permanentId);
  if (!permanent || !/Equipment/.test(permanent.card.type_line)) return;
  if (!battle.creatures.length) return showToast('Spiele zuerst eine Kreatur aus.');
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
  const assignments = chooseEnemyBlocks(battle.enemyCreatures.filter(creature => creatureCanAttack(creature, battle.turn)), battle.creatures.filter(creature => !creature.tapped));
  battle.blockAssignments = new Map([...assignments].map(([attackerId, blocker]) => [attackerId, blocker.id]));
  battle.selectedEnemyAttackerId = null;
  renderBattle();
});
$('#clear-blocks').addEventListener('click', () => {
  if (state.battle?.phase !== 'blocks') return;
  state.battle.blockAssignments.clear();
  state.battle.selectedEnemyAttackerId = null;
  renderBattle();
});

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
      if (event.dataTransfer.types.includes('application/x-booster-tutor-blocker')) return;
      const rawIndex = event.dataTransfer.getData('text/plain');
      if (!/^\d+$/.test(rawIndex)) return;
      const index = Number(rawIndex);
      const side = zone.dataset.side || (zone.dataset.zone ? 'player' : 'enemy');
      playCard(index, side);
    });
  });
}

function drawOneExtra() {
  const battle = state.battle;
  if (battle.hand.length < HAND_SIZE) drawToHand(battle.hand.length + 1);
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
  for (const effect of cardEffects(card, creature)) {
    if (effect.kind === 'damage') damageFirstEnemy(effect.amount);
    if (effect.kind === 'heal') state.playerHealth = Math.min(30, state.playerHealth + effect.amount);
    if (effect.kind === 'draw') for (let i = 0; i < effect.amount; i++) drawOneExtra();
    if (effect.kind === 'shield') battle.playerBlock += effect.amount;
    if (effect.kind === 'buff' || effect.kind === 'keywords') {
      const target = battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
      if (!target) { if (effect.kind === 'buff') battle.playerBlock += 3; continue; }
      if (effect.kind === 'buff') {
        target.power += effect.power;
        target.toughness += effect.toughness;
        if (effect.temporary) battle.turnEffects.push({ creatureId: target.id, power: effect.power, toughness: effect.toughness });
      } else {
        target.temporaryKeywords ||= [];
        for (const keyword of effect.keywords) {
          target.temporaryKeywords.push(keyword);
          battle.turnEffects.push({ creatureId: target.id, keyword });
        }
      }
    }
    if (effect.kind === 'token' && battle.creatures.length < 3) {
      battle.creatures.push({ id: `player-${state.nextPermanentId++}`, owner: 'player', card: { id: 'token', name: 'Aether-Spielstein', cmc: 0, type_line: 'Creature — Token', power: '2', toughness: '2', oracle_text: '', image: '' }, power: 2, toughness: 2, summonedTurn: battle.turn, summoningSick: true, isToken: true, willAttack: false, tapped: false });
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
  battle.permanents = (battle.permanents || []).filter(permanent => {
    if (!deadIds.has(permanent.attachedTo)) return true;
    if (isAura(permanent.card)) { battle.graveyard.push(permanent.card); return false; }
    permanent.attachedTo = null;
    return true;
  });
}
function selectAttachmentTarget(creatureId) {
  const battle = state.battle;
  const pending = battle?.pendingAttachment;
  if (!pending || battle.phase !== 'main') return;
  const creature = battle.creatures.find(item => item.id === creatureId);
  if (!creature) return;
  if (pending.handIndex !== undefined) {
    const card = battle.hand[pending.handIndex];
    if (!card || !isAura(card)) { battle.pendingAttachment = null; renderBattle(); return; }
    if (!paymentPlan(card)) return showToast('Nicht genug generisches Mana.');
    battle.mana -= Math.ceil(card.cmc || 0);
    battle.hand.splice(pending.handIndex, 1);
    battle.permanents.push({ id: `permanent-${state.nextPermanentId++}`, card, attachedTo: creatureId });
    battle.mulliganAvailable = false;
  } else {
    const permanent = battle.permanents.find(item => item.id === pending.permanentId);
    if (!permanent) return;
    permanent.attachedTo = creatureId;
  }
  battle.pendingAttachment = null;
  refreshPermanentEffects();
  battle.creatures = removeDeadCreatures(battle.creatures, 'player');
  renderBattle();
}

function playCard(index, targetSide = 'enemy') {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card) return;
  if (battle.phase !== 'main') return showToast('In der Blockphase kannst du keine Karten ausspielen.');
  if (isAura(card)) {
    if (!battle.creatures.length) return showToast('Für diese Aura brauchst du eine eigene Kreatur.');
    if (!paymentPlan(card)) return showToast('Nicht genug generisches Mana.');
    battle.pendingAttachment = { handIndex: index };
    renderBattle();
    return;
  }
  battle.pendingAttachment = null;
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
    refreshPermanentEffects();
    applyOracle(card, true);
  } else if (isPermanent(card)) {
    battle.permanents.push({ id: `permanent-${state.nextPermanentId++}`, card, attachedTo: null });
    battle.playerBlock += permanentEffect(card).shield;
    refreshPermanentEffects();
    addLog(`${card.name} bleibt auf dem Spielfeld.`);
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
  const deadIds = new Set();
  for (const creature of creatures) {
    const dead = owner === 'enemy'
      ? creature.health <= 0
      : (creature.damage || 0) >= creature.toughness || creature.deathtouchDamage;
    if (dead) {
      deadIds.add(creature.id);
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
      if (!creatureAlive(attacker)) continue;
      const blocker = assignments.get(attacker.id);
      if (!blocker) {
        if (!dealsInCombatStep(attacker, firstStep)) continue;
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
  battle.playerBlock = (battle.permanents || []).reduce((sum, permanent) => sum + permanentEffect(permanent.card).shield, 0);
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
  drawToHand(HAND_SIZE);
  renderBattle();
  playSound(230, 0.08);
}

function finishTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== 'main') return;
  battle.mulliganAvailable = false;
  battle.pendingAttachment = null;
  hideCardPreview();
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
  state.packs = [chooseRandomCards(state.pool, PACK_SIZE)];
  state.draftKind = 'reward';
  state.activePack = 0;
  state.boosterSealed = true;
  state.selection.clear();
  renderDraft();
  showScreen('draft-screen');
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
    state.audio.resume().catch(() => {});
    const context = state.audio;
    const start = context.currentTime + 0.025;
    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.45), context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, start);
    filter.frequency.exponentialRampToValueAtTime(5000, start + 0.15);
    filter.frequency.exponentialRampToValueAtTime(250, start + 0.45);
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.0001, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.055, start + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(context.destination);
    noise.start(start); noise.stop(start + 0.45);
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
$('#graveyard-close').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').close(); });
$('#graveyard-dialog').addEventListener('click', (event) => {
  if (event.target === $('#graveyard-dialog')) { hideCardPreview(); $('#graveyard-dialog').close(); }
});
document.addEventListener('pointerover', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget)) showCardPreview(previewCardFor(element), element);
});
document.addEventListener('pointerout', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element && !element.contains(event.relatedTarget) && !event.relatedTarget?.closest('#card-preview')) hideCardPreview();
});
document.addEventListener('focusin', (event) => {
  const element = event.target.closest('[data-preview-owner]');
  if (element) showCardPreview(previewCardFor(element), element);
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
  if (event.key === 'Escape') { hideCardPreview(); if (state.battle?.pendingAttachment) { state.battle.pendingAttachment = null; renderBattle(); } }
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
  if (choice.dataset.camp === 'study') state.deck.push(FALLBACK_CARDS.find(card => card.id === 'demo-spark'));
  beginBattle(state.node);
});

window.addEventListener('resize', hideCardPreview);
document.addEventListener('scroll', event => { if (!event.target.closest?.('#card-preview')) hideCardPreview(); }, true);
document.addEventListener('pointermove', positionCardPreview);

$('#graveyard-open').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });

$('#card-preview').addEventListener('pointerleave', event => { if (!previewAnchor?.contains(event.relatedTarget)) hideCardPreview(); });

$('#graveyard-pile').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });
