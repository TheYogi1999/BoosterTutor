const HAND_SIZE = 7;
const PACK_SIZE = 7;
const ENCOUNTERS = [
  { name: 'Mosswood Ambush', rank: 'SKIRMISH', location: 'THE FORGOTTEN GLADE', foeCount: 2 },
  { name: 'Rune Hunter Patrol', rank: 'ELITE', location: 'THE BROKEN PASS', foeCount: 3 },
  { name: 'Thornwild Pack', rank: 'ELITE', location: 'THE ROOT VAULT', foeCount: 3 },
  { name: 'The Shard Dragon', rank: 'BOSS', location: 'THE CROWN CHAMBER', foeCount: 4 }
];

const state = {
  pool: [],
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
  state.screen = id;
  hideCardPreview();
  updatePhaseDisplay();
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

async function loadCardPool() {
  // Audited, normal-layout cards and original images are shipped with the game.
  return { cards: BUNDLED_CARDS.map(card => ({ ...card })) };
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
  while (cards.length < PACK_SIZE * 3) cards.push(...shuffle(BUNDLED_CARDS));
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
  loadCardPool().then(({ cards }) => {
    state.pool = cards;
    const status = $('#start-api-status span');
    status.textContent = '32 ECHTE MAGIC-KARTEN · LOKAL';
    status.style.color = '#b7d9c2';
    state.packs = makeStarterPacks();
    state.draftKind = 'starter';
    state.activePack = 0;
    state.rerolledPacks = new Set();
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

const FOE_TYPES = {
  sprout: { name: 'Mooswächter', health: 13, power: 3, pattern: ['attack', 'guard', 'attack'] },
  wisp: { name: 'Aethergeist', health: 10, power: 2, pattern: ['buff', 'attack', 'attack'] },
  raider: { name: 'Runenräuber', health: 22, power: 4, pattern: ['attack', 'buff', 'attack', 'guard'] },
  wolf: { name: 'Dornenwolf', health: 20, power: 4, pattern: ['attack', 'attack', 'guard'] },
  dragon: { name: 'Splitterdrache', health: 60, power: 7, pattern: ['guard', 'attack', 'buff', 'attack'] }
};
function createEnemyTeam(encounter) {
  const teams = [['sprout', 'wisp'], ['raider', 'sprout'], ['wolf', 'raider', 'wisp'], ['dragon', 'wisp']];
  return teams[state.node - 1].map(kind => {
    const template = FOE_TYPES[kind];
    return { id: `enemy-${state.nextPermanentId++}`, kind, card: { name: template.name, type_line: 'Monster', oracle_text: '' }, owner: 'enemy', health: template.health, maxHealth: template.health, power: template.power, toughness: template.health, shield: 0, pattern: template.pattern, summonedTurn: 0, summoningSick: false };
  });
}
function enemyIntent(enemy, turn = state.battle?.turn || 1) {
  const kind = enemy.pattern ? enemy.pattern[(turn - 1) % enemy.pattern.length] : 'attack';
  return { kind, damage: kind === 'attack' ? Math.max(0, enemy.power) : 0, shield: kind === 'guard' ? 5 : 0,
    label: kind === 'attack' ? `Angriff · ${enemy.power} Schaden` : kind === 'guard' ? 'Verteidigung · 5 Schild' : 'Stärken · +1 Angriff', icon: kind === 'attack' ? '⚔' : kind === 'guard' ? '⛨' : '✦' };
}
function resolveEnemyIntents() {
  const battle = state.battle;
  if (battle.intentsResolvedTurn === battle.turn) return;
  battle.intentsResolvedTurn = battle.turn;
  for (const enemy of battle.enemyCreatures) {
    const intent = enemyIntent(enemy);
    if (intent.kind === 'guard') { enemy.shield = intent.shield; addLog(`${enemy.card.name} erhält ${intent.shield} Schild.`); }
    if (intent.kind === 'buff') { enemy.power += 1; addLog(`${enemy.card.name} verstärkt seinen Angriff um 1.`); }
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
    shield: !attachment && !buff ? 1 : 0
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
    if (effect.kind === 'damage') lines.push(`${effect.amount} Schaden am gewählten Gegner, sonst am ersten Gegner. Schild fängt Schaden ab; Überschuss verfällt.`);
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
  return card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name)}" draggable="false" loading="lazy" />`
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
  $('#pack-reroll').disabled = state.boosterSealed || Boolean(state.rerolledPacks?.has(packIndex));
  $('#pack-reroll').textContent = state.rerolledPacks?.has(packIndex) ? '↻ Reroll verbraucht' : '↻ Pack neu würfeln · 1×';
  $('#draft-confirm').disabled = state.boosterSealed || !chosen;
  $('#draft-confirm').textContent = last ? starter ? 'DECK BAUEN →' : 'KARTE MITNEHMEN →' : 'NÄCHSTES PACK →';
  updatePhaseDisplay();
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
  const button = event.target.closest('[data-creature-id]');
  const battle = state.battle;
  if (!button || !battle || Date.now() < (state.suppressClickUntil || 0)) return;
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
  if (starter) state.deck.push(...BUNDLED_CARDS.filter(card => ['Grizzly Bears', 'Savannah Lions'].includes(card.name)).flatMap(card => [card, card]));
  state.selection.clear();
  showJourney();
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
  if (creature.owner === 'enemy' && creature.pattern) return enemyIntent(creature, turn).kind === 'attack';
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
  $('#enemy-board').innerHTML = `<div class="monster-rank">${battle.enemyCreatures.map(enemy => {
    const intent = enemyIntent(enemy);
    const selected = battle.phase === 'blocks' ? battle.selectedEnemyAttackerId === enemy.id : battle.selectedEnemyTargetId === enemy.id;
    const blocker = assignedBlockerName(battle, enemy.id);
    return `<button type="button" class="monster monster-${enemy.kind || 'sprout'}${selected ? ' selected' : ''}${blocker ? ' is-blocked' : ''}" data-enemy-attacker="${escapeHtml(enemy.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(enemy.card.name)}, ${enemy.health} Leben, ${escapeHtml(intent.label)}"><span class="monster-intent intent-${intent.kind}"><b>${intent.icon}</b> ${escapeHtml(intent.label)}</span><span class="monster-figure"><img src="assets/foes/${enemy.kind || 'sprout'}.svg" alt="" draggable="false"></span><strong>${escapeHtml(enemy.card.name)}</strong><span class="monster-health"><i style="width:${Math.max(0, enemy.health / enemy.maxHealth * 100)}%"></i><b>${enemy.health} / ${enemy.maxHealth}</b></span><small>${enemy.shield ? '⛨ ' + enemy.shield + ' Schild · ' : ''}${blocker ? 'Blockiert von ' + escapeHtml(blocker) : selected ? 'Aktuelles Ziel' : 'Klicken oder Zauber hierher ziehen'}</small></button>`;
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
  if (['player', 'permanent'].includes(element.dataset.previewOwner)) { inspectBattlefieldCard(card, element); hideCardPreview(); return; }
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
  $('#enemy-count-label').textContent = `${enemyCount} VERBLEIBEND`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)} / 30`;
  $('#player-health-fill').style.width = `${Math.max(0, state.playerHealth / 30 * 100)}%`;
  const availableMana = battle.mana;
  $('#mana-label').textContent = `${availableMana} / ${battle.maxMana}`;
  $('#enemy-art-image').src = battle.enemyArt || '';
  $('#enemy-art-image').hidden = !battle.enemyArt;
  $('#enemy-art .enemy-sprite').hidden = Boolean(battle.enemyArt);
  const resolving = ['attack', 'enemy', 'damage'].includes(battle.phase);
  $('#end-turn-button').disabled = resolving;
  $('#end-turn-button').innerHTML = battle.phase === 'blocks' ? 'BLOCKEN BESTÄTIGEN <span>✓</span>' : resolving ? 'KAMPF WIRD AUFGELÖST …' : 'ANGRIFF STARTEN <span>→</span>';
  $('#combat-action-hint').textContent = battle.pendingAttachment ? 'Wähle eine eigene Kreatur als Ziel · Abbrechen ist kostenlos.' : battle.phase === 'blocks'
    ? 'Wähle einen Angreifer, dann deinen Blocker. Du kannst Blocker auch auf Angreifer ziehen.'
    : 'Kreatur anklicken: angreifen oder zurückhalten · Hand wird auf 7 aufgefüllt.';
  if (resolving) $('#combat-action-hint').textContent = phaseInfo(battle.phase).description;
  $('#combat-action-hint').classList.toggle('blocking', battle.phase === 'blocks');
  $('#turn-label').textContent = `ZUG ${battle.turn}`;
  $('#turn-display').textContent = `Zug ${battle.turn}`;
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
  if (state.inspectedId) {
    const inspected = battle.creatures.find(item => item.id === state.inspectedId) || battle.permanents.find(item => item.id === state.inspectedId);
    if (inspected) inspectBattlefieldCard(inspected.card, { dataset: { previewId: inspected.id } });
    else { state.inspectedId = null; $('#inspector-content').innerHTML = '<div class="inspector-empty">◈<p>Fahre über eine Karte auf deinem Spielfeld.</p></div>'; }
  }
  renderDropZones();
  updatePhaseDisplay();
  requestAnimationFrame(drawCombatArrows);
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
    button.addEventListener('click', () => { if (Date.now() < (state.suppressClickUntil || 0)) return; hideCardPreview(); playCard(Number(button.dataset.handIndex), defaultTarget(battle.hand[Number(button.dataset.handIndex)])); });

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
    const attachments = battle.permanents.filter(permanent => permanent.attachedTo === creature.id);
    return `<div class="creature-group" data-host-id="${escapeHtml(creature.id)}"><div class="unit-attachments" aria-label="An ${escapeHtml(creature.card.name)} angelegte Karten">${attachments.map(permanent => permanentMarkup(permanent, true)).join('')}</div><button type="button" class="creature-token${legal ? ' can-block' : ''}${entry ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${!blocking && !waiting && !willAttack ? ' held-back' : ''}${targeting ? ' attachment-target' : ''}" data-creature-id="${escapeHtml(creature.id)}" data-preview-owner="player" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(entry) : !waiting && !willAttack}" aria-label="${escapeHtml(creature.card.name)}, ${escapeHtml(status)}" draggable="${blocking && !creature.tapped}"><span class="player-card-frame">${cardFace(creature.card)}</span><span class="field-caption"><b>${escapeHtml(creature.card.name)}</b><span>${creature.power}/${creature.toughness}${creature.damage ? ' · ' + creature.damage + ' Schaden' : ''}</span><small>${escapeHtml(status)}</small></span></button>${attachments.length ? `<span class="attachment-link" aria-label="${attachments.length} Karten angelegt">↔ ${attachments.length}</span>` : ''}</div>`;
  }).join('') : '<div class="empty-board">Spiele eine Kreatur aus deiner Hand.<br>Bis zu drei Kreaturen können hier liegen.</div>';
}
function permanentMarkup(permanent, attached = false) {
  const battle = state.battle;
  const target = battle.creatures.find(item => item.id === permanent.attachedTo);
  return `<button type="button" class="permanent-card${attached ? ' attached-permanent' : ''}${battle.pendingAttachment?.permanentId === permanent.id ? ' targeting-card' : ''}" draggable="${/Equipment/.test(permanent.card.type_line) && battle.phase === 'main'}" data-permanent-id="${escapeHtml(permanent.id)}" data-preview-owner="permanent" data-preview-id="${escapeHtml(permanent.id)}" aria-label="${escapeHtml(permanent.card.name)}${target ? ', angelegt an ' + escapeHtml(target.card.name) : ''}"><span class="permanent-card-frame">${cardFace(permanent.card)}</span><span class="field-caption"><b>${escapeHtml(permanent.card.name)}</b><small>${target ? '↔ ' + escapeHtml(target.card.name) : isAttachment(permanent.card) ? 'Klicken zum Anlegen' : 'Aktive Verzauberung / Artefakt'}</small></span></button>`;
}
function renderPermanents() {
  const battle = state.battle;
  const loose = battle.permanents.filter(permanent => !permanent.attachedTo);
  const attached = battle.permanents.length - loose.length;
  $('#permanent-count').textContent = `${attached} angelegt · ${loose.length} frei`;
  $('#permanent-row').innerHTML = loose.length ? loose.map(permanent => permanentMarkup(permanent)).join('') : `<p class="empty-permanents">${attached ? 'Angelegte Karten liegen direkt an ihren Kreaturen.' : 'Freie Verzauberungen und Ausrüstung liegen hier.'}</p>`;
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
$('#player-drop-zone').addEventListener('click', event => {
  const button = event.target.closest('[data-permanent-id]');
  const battle = state.battle;
  if (!button || battle?.phase !== 'main' || Date.now() < (state.suppressClickUntil || 0)) return;
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

function renderDropZones() { /* Delegated drag handlers also cover re-rendered cards. */ }
function dragPayloadFor(element) {
  const hand = element.closest('[data-hand-index]');
  const creature = element.closest('[data-creature-id]');
  const permanent = element.closest('[data-permanent-id]');
  if (hand && state.battle?.phase === 'main') return { kind: 'hand', index: Number(hand.dataset.handIndex), cardId: state.battle.hand[Number(hand.dataset.handIndex)]?.id };
  if (creature && state.battle?.phase === 'blocks') return { kind: 'blocker', id: creature.dataset.creatureId };
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
  if (payload.kind !== 'hand' || battle.phase !== 'main') return false;
  const card = battle.hand[payload.index];
  if (!card || (payload.cardId && card.id !== payload.cardId)) return false;
  if ((isCreature(card) || isPermanent(card)) && !onPlayer) return false;
  if (!onPlayer && !onEnemy) return false;
  if (enemy) battle.selectedEnemyTargetId = enemy.dataset.enemyAttacker;
  const allyId = ally?.dataset.creatureId;
  const beforeCount = battle.permanents.length;
  playCard(payload.index, onPlayer ? 'player' : 'enemy');
  if (isAura(card) && allyId && battle.pendingAttachment) selectAttachmentTarget(allyId);
  if (/Equipment/.test(card.type_line) && allyId && battle.permanents.length > beforeCount) {
    battle.pendingAttachment = { permanentId: battle.permanents[battle.permanents.length - 1].id };
    selectAttachmentTarget(allyId);
  }
  return true;
}
function finishDrag() {
  state.dragPayload = null;
  state.suppressClickUntil = Date.now() + 250;
  document.body.classList.remove('drag-active');
  document.querySelectorAll('.drop-ready').forEach(zone => zone.classList.remove('drop-ready'));
  $('#drag-ghost')?.remove();
}
document.addEventListener('dragstart', event => {
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
  if (!state.dragPayload || !event.target.closest('.arena-table')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.drop-ready').forEach(zone => zone.classList.remove('drop-ready'));
  event.target.closest('[data-creature-id], [data-enemy-attacker], .drop-zone')?.classList.add('drop-ready');
});
document.addEventListener('drop', event => {
  if (!state.dragPayload) return;
  event.preventDefault();
  const payload = state.dragPayload;
  if (!handleCardDrop(payload, event.target)) showToast('Ziehe Kreaturen und bleibende Karten nach links, Zauber auf ein Ziel rechts.');
  finishDrag();
});
document.addEventListener('dragend', finishDrag);
let touchDrag = null;
document.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse') return;
  const payload = dragPayloadFor(event.target);
  if (payload) touchDrag = { payload, x: event.clientX, y: event.clientY, source: event.target.closest('button'), active: false };
});
document.addEventListener('pointermove', event => {
  if (!touchDrag) return;
  if (!touchDrag.active && Math.hypot(event.clientX - touchDrag.x, event.clientY - touchDrag.y) < 9) return;
  if (!touchDrag.active) {
    touchDrag.active = true;
    state.dragPayload = touchDrag.payload;
    hideCardPreview();
    const ghost = touchDrag.source.cloneNode(true);
    ghost.id = 'drag-ghost';
    document.body.append(ghost);
    document.body.classList.add('drag-active');
  }
  event.preventDefault();
  const ghost = $('#drag-ghost');
  ghost.style.left = `${event.clientX - 55}px`;
  ghost.style.top = `${event.clientY - 75}px`;
}, { passive: false });
document.addEventListener('pointerup', event => {
  if (!touchDrag) return;
  if (touchDrag.active) {
    handleCardDrop(touchDrag.payload, document.elementFromPoint(event.clientX, event.clientY));
    finishDrag();
  }
  touchDrag = null;
});
document.addEventListener('pointercancel', () => { if (!touchDrag) return; touchDrag = null; finishDrag(); });

function drawOneExtra() {
  const battle = state.battle;
  if (battle.hand.length < HAND_SIZE) drawToHand(battle.hand.length + 1);
}

function damageFirstEnemy(amount) {
  const battle = state.battle;
  const enemy = battle?.enemyCreatures.find(creature => creature.id === battle.selectedEnemyTargetId && creature.health > 0) || battle?.enemyCreatures.find(creature => creature.health > 0);
  if (!enemy || amount <= 0) return 0;
  const blocked = Math.min(enemy.shield || 0, amount);
  enemy.shield = (enemy.shield || 0) - blocked;
  const dealt = Math.min(enemy.health, amount - blocked);
  enemy.health = Math.max(0, enemy.health - dealt);
  if (enemy.health <= 0) {
    battle.enemyCreatures = battle.enemyCreatures.filter((creature) => creature !== enemy);
    battle.enemyGraveyard.push(enemy.card);
    addLog(`${enemy.card.name} is defeated.`);
  }
  return dealt;
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
  if (isLand(card)) return showToast('Länder werden in diesem Spiel nicht benötigt.');
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
    const blocked = Math.min(target.shield || 0, amount);
    target.shield = (target.shield || 0) - blocked;
    target.health = Math.max(0, target.health - (amount - blocked));
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
  const attackers = battle.creatures.filter(creature => creatureCanAttack(creature, battle.turn) && creature.willAttack !== false && !creature.tapped);
  for (const creature of attackers) {
    creature.tapped = true;
    const hits = hasCreatureKeyword(creature, 'double strike') ? 2 : 1;
    for (let hit = 0; hit < hits; hit++) {
      const target = battle.enemyCreatures.find(enemy => enemy.id === battle.selectedEnemyTargetId) || battle.enemyCreatures[0];
      const dealt = damageFirstEnemy(Math.max(0, creature.power));
      if (dealt > 0 && target && hasCreatureKeyword(creature, 'deathtouch') && battle.enemyCreatures.includes(target)) {
        target.health = 0;
        battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy', false);
      }
      gainLifelinkLife(creature, 'player', dealt, battle);
    }
    addLog(`${creature.card.name} greift das gewählte Monster an.`);
  }
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
  battle.creatures.forEach((creature) => {
    creature.tapped = false;
    if (creatureCanAttack(creature, battle.turn)) creature.willAttack = true;
  });
  drawToHand(HAND_SIZE);
  renderBattle();
  playSound(230, 0.08);
}

function afterCombatBeat(battle, phase, callback) {
  setTimeout(() => {
    if (state.battle !== battle || battle.phase !== phase) return;
    callback();
  }, 650);
}
function finishTurn() {
  const battle = state.battle;
  if (!battle || battle.phase !== 'main') return;
  battle.mulliganAvailable = false;
  battle.pendingAttachment = null;
  battle.phase = 'attack';
  renderBattle();
  afterCombatBeat(battle, 'attack', () => {
    resolvePlayerAttacks();
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
}
function beginEnemyDamage() {
  const battle = state.battle;
  if (!battle || !['blocks', 'enemy'].includes(battle.phase)) return;
  battle.phase = 'damage';
  renderBattle();
  afterCombatBeat(battle, 'damage', resolveEnemyCombat);
}
function handleCombatAction() {
  if (state.battle?.phase === 'blocks') beginEnemyDamage();
  else if (state.battle?.phase === 'main') finishTurn();
}

function winBattle() {
  const node = state.node;
  addLog(`${state.battle.enemy.name} has been defeated.`);
  if (node >= ENCOUNTERS.length) return endRun(true);
  state.node += 1;
  state.packs = [chooseRandomCards(state.pool, PACK_SIZE)];
  state.draftKind = 'reward';
  state.activePack = 0;
  state.rerolledPacks = new Set();
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
  const audio = $('#booster-audio');
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0.72;
  audio.play().catch(() => showToast('Zum Aktivieren des Sounds einmal auf SOUND klicken.'));
}

function animateBoosterOpening() {
  const screen = $('#draft-screen');
  clearTimeout(state.openingTimer);
  screen.classList.remove('opening');
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
  if (!state.soundOn) { $('#booster-audio').pause(); $('#booster-audio').currentTime = 0; }
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
    : '<button data-camp="rest"><span>✦</span><h3>Rest</h3><p>Restore 10 life, up to 30.</p></button><button data-camp="study"><span>▣</span><h3>Study</h3><p>Divination hinzufügen: bis zu 2 Karten ziehen.</p></button>';
  $('#journey-life').textContent = `${state.playerHealth} / 30 LIFE · ${state.deck.length} CARDS`;
  showScreen('journey-screen');
}
$('#journey-options').addEventListener('click', event => {
  const choice = event.target.closest('button');
  if (!choice) return;
  if (choice.dataset.relic) state.relic = choice.dataset.relic;
  if (choice.dataset.camp === 'rest') state.playerHealth = Math.min(30, state.playerHealth + 10);
  if (choice.dataset.camp === 'study') state.deck.push(BUNDLED_CARDS.find(card => card.name === 'Divination'));
  beginBattle(state.node);
});

window.addEventListener('resize', hideCardPreview);
document.addEventListener('scroll', event => { if (!event.target.closest?.('#card-preview')) hideCardPreview(); }, true);
document.addEventListener('pointermove', positionCardPreview);

$('#graveyard-open').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });

$('#card-preview').addEventListener('pointerleave', event => { if (!previewAnchor?.contains(event.relatedTarget)) hideCardPreview(); });

$('#graveyard-pile').addEventListener('click', () => { hideCardPreview(); $('#graveyard-dialog').showModal(); });

function rerollCurrentPack() {
  const index = state.activePack || 0;
  state.rerolledPacks ||= new Set();
  if (state.boosterSealed || state.rerolledPacks.has(index)) return;
  const excluded = new Set(state.packs.flat().map(card => card.id));
  let candidates = state.pool.filter(card => !excluded.has(card.id));
  if (candidates.length < PACK_SIZE) candidates = state.pool.filter(card => !state.packs[index].some(old => old.id === card.id));
  if (candidates.length < PACK_SIZE) return showToast('Nicht genug andere Karten für einen Reroll.');
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
  $('#inspector-content').innerHTML = `<div class="inspector-card">${cardFace(card)}</div><h3>${escapeHtml(card.name)}</h3><p class="inspector-cost">${Math.ceil(card.cmc || 0)} generisches Mana${creature ? ` · Aktuell ${creature.power}/${creature.toughness}` : ''}</p><div class="inspector-rules">${effectDescriptions(card).map(line => `<p>${escapeHtml(line)}</p>`).join('')}${attached ? `<p>Verbunden mit ${escapeHtml(attached.card.name)}.</p>` : ''}</div>`;
}
function fitGameCanvas() {
  document.documentElement.style.setProperty('--game-scale', Math.min(window.innerWidth / 1600, window.innerHeight / 900));
}
window.addEventListener('resize', fitGameCanvas);
fitGameCanvas();

$('#fullscreen-button').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => showToast('Vollbild ist in diesem Browser nicht verfügbar.')); });

const COMBAT_PHASES = [
  { id: 'main', label: 'Karten spielen', description: 'Spiele Karten aus und wähle, welche Kreaturen angreifen.' },
  { id: 'attack', label: 'Dein Angriff', description: 'Deine angreifenden Kreaturen treffen ihre angezeigten Ziele.' },
  { id: 'enemy', label: 'Gegneraktion', description: 'Die Gegner verstärken oder schützen sich und bereiten ihre Angriffe vor.' },
  { id: 'blocks', label: 'Blocken', description: 'Weise den Angreifern eigene Blocker zu oder lasse Angriffe durch.' },
  { id: 'damage', label: 'Schaden', description: 'Die gegnerischen Angriffe und Blocks werden aufgelöst.' }
];
function phaseInfo(id) { return COMBAT_PHASES.find(phase => phase.id === id) || COMBAT_PHASES[0]; }
function updatePhaseDisplay() {
  const screen = state.screen || 'start-screen';
  const labels = { 'start-screen': 'START', 'loading-screen': 'DECK VORBEREITEN', 'draft-screen': state.boosterSealed ? 'BOOSTER ÖFFNEN' : 'KARTE WÄHLEN', 'journey-screen': state.node === 1 ? 'RELIKT WÄHLEN' : 'RAST', 'end-screen': 'RUN BEENDET' };
  const phase = phaseInfo(state.battle?.phase);
  $('#global-phase').textContent = screen === 'combat-screen' ? phase.label.toUpperCase() : labels[screen] || 'EXPEDITION';
  if (!state.battle) return;
  $('#phase-strip').innerHTML = COMBAT_PHASES.map((item, index) => `<li class="${phase.id === item.id ? 'current' : ''}" ${phase.id === item.id ? 'aria-current="step"' : ''} data-phase="${item.id}"><span>${index + 1}</span>${item.label}</li>`).join('');
  $('#phase-status').textContent = phase.description;
}
function combatRoutes(battle) {
  const routes = [];
  const target = battle.enemyCreatures.find(enemy => enemy.id === battle.selectedEnemyTargetId) || battle.enemyCreatures[0];
  if (target && ['main', 'attack'].includes(battle.phase)) {
    for (const creature of battle.creatures) {
      if (creatureCanAttack(creature, battle.turn) && creature.willAttack !== false && !creature.tapped) routes.push({ kind: 'ally', from: creature.id, to: target.id, damage: Math.max(0, creature.power) * (hasCreatureKeyword(creature, 'double strike') ? 2 : 1) });
    }
  }
  for (const enemy of battle.enemyCreatures) {
    if (!creatureCanAttack(enemy, battle.turn)) continue;
    const blockerId = ['blocks', 'damage'].includes(battle.phase) ? battle.blockAssignments.get(enemy.id) : null;
    const blocker = battle.creatures.find(creature => creature.id === blockerId && !creature.tapped);
    routes.push({ kind: blocker ? 'block' : 'enemy', from: enemy.id, to: blocker?.id || 'player', damage: Math.max(0, enemy.power) * (hasCreatureKeyword(enemy, 'double strike') ? 2 : 1) });
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
  const sx = width / rect.width;
  const sy = height / rect.height;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const center = (element, edge) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: ((edge === 'right' ? box.right : box.left + box.width / 2) - rect.left) * sx, y: ((edge === 'top' ? box.top - 4 : box.top + box.height / 2) - rect.top) * sy };
  };
  const paths = combatRoutes(battle).map((route, index) => {
    const fromElement = route.kind === 'ally' ? document.querySelector(`[data-creature-id="${route.from}"] .player-card-frame`) : document.querySelector(`[data-enemy-attacker="${route.from}"] .monster-figure`);
    const toElement = route.to === 'player' ? $('#player-health-label') : route.kind === 'ally' ? document.querySelector(`[data-enemy-attacker="${route.to}"] .monster-figure`) : document.querySelector(`[data-creature-id="${route.to}"] .player-card-frame`);
    const from = center(fromElement, 'top');
    const to = center(toElement, route.to === 'player' ? 'right' : 'top');
    if (!from || !to) return '';
    const lift = 30 + index % 3 * 12;
    const c1 = { x: from.x + (route.kind === 'ally' ? 50 : -70), y: Math.max(32, from.y - lift) };
    const c2 = { x: to.x + (route.kind === 'ally' ? -70 : 80), y: Math.max(32, to.y - lift) };
    const label = { x: (from.x + 3 * c1.x + 3 * c2.x + to.x) / 8, y: (from.y + 3 * c1.y + 3 * c2.y + to.y) / 8 };
    const units = [...battle.creatures, ...battle.enemyCreatures];
    const fromName = units.find(unit => unit.id === route.from)?.card.name || '';
    const toName = route.to === 'player' ? 'Deine Lebenspunkte' : units.find(unit => unit.id === route.to)?.card.name || '';
    const title = `${fromName} → ${toName}: ${route.damage} ${route.kind === 'block' ? 'geblockter Angriff' : 'Angriff'}`;
    return `<g class="combat-route route-${route.kind}" data-arrow-kind="${route.kind}" data-from-id="${escapeHtml(route.from)}" data-to-id="${escapeHtml(route.to)}"><title>${escapeHtml(title)}</title><path d="M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}" marker-end="url(#arrow-${route.kind})"/><g transform="translate(${label.x},${label.y})"><rect x="-14" y="-10" width="28" height="20" rx="10"/><text text-anchor="middle" dominant-baseline="central">${route.damage}</text></g></g>`;
  }).join('');
  svg.innerHTML = `<defs>${['ally', 'enemy', 'block'].map(kind => `<marker id="arrow-${kind}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="arrowhead-${kind}" d="M 1 1 L 9 5 L 1 9 Z"/></marker>`).join('')}</defs>${paths}`;
}
window.addEventListener('resize', () => requestAnimationFrame(drawCombatArrows));
