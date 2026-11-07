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
  $('#deck-button').disabled = !state.deck.length;
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
    haste: hasKeywordLine(text, 'haste'),
    vigilance: hasKeywordLine(text, 'vigilance')
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
    ['reach', 'Reach'], ['vigilance', 'Vigilance'], ['haste', 'Haste']
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
  if (state.soundOn) soundEngine.unlock().catch(() => {});
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
    status.textContent = '32 REAL MAGIC CARDS · OFFLINE READY';
    status.style.color = '#b7d9c2';
    state.packs = makeStarterPacks();
    state.draftKind = 'starter';
    state.activePack = 0;
    state.rerolledPacks = new Set();
    state.boosterSealed = true;
    renderDraft();
    showScreen('draft-screen');
    playSfx('shuffle');
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
  sprout: { name: 'Moss Sentinel', health: 13, power: 3, pattern: ['attack', 'guard', 'attack'] },
  wisp: { name: 'Aether Wisp', health: 10, power: 2, pattern: ['buff', 'attack', 'attack'] },
  raider: { name: 'Rune Raider', health: 22, power: 4, pattern: ['attack', 'buff', 'attack', 'guard'] },
  wolf: { name: 'Thornwolf', health: 20, power: 4, pattern: ['attack', 'attack', 'guard'] },
  dragon: { name: 'Shard Dragon', health: 60, power: 7, pattern: ['guard', 'attack', 'buff', 'attack'] }
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
    label: kind === 'attack' ? `Attack · ${enemy.power} damage` : kind === 'guard' ? 'Guard · 5 shield' : 'Strengthen · +1 power', icon: kind === 'attack' ? '⚔' : kind === 'guard' ? '⛨' : '✦' };
}
function resolveEnemyIntents() {
  const battle = state.battle;
  if (battle.intentsResolvedTurn === battle.turn) return;
  battle.intentsResolvedTurn = battle.turn;
  for (const enemy of battle.enemyCreatures) {
    const intent = enemyIntent(enemy);
    if (intent.kind === 'guard') { enemy.shield = intent.shield; addLog(`${enemy.card.name} gains ${intent.shield} shield.`); }
    if (intent.kind === 'buff') { enemy.power += 1; addLog(`${enemy.card.name} gains 1 power.`); }
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
    const keywords = grant[1].match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste|vigilance)\b/gi) || [];
    if (keywords.length) effects.push({ kind: 'keywords', keywords: keywords.map(value => value.toLowerCase()) });
  }
  if (/counter target/i.test(text)) effects.push({ kind: 'shield', amount: 5 });
  if (/destroy target creature/i.test(text)) effects.push({ kind: 'destroy' });
  if (/exile target creature/i.test(text)) effects.push({ kind: 'exile' });
  if (/prevent the next|prevent all damage/i.test(text)) effects.push({ kind: 'shield', amount: 6 });
  if (/create .*token/i.test(text)) effects.push({ kind: 'token' });
  if (!effects.length && !creature) effects.push({ kind: 'damage', amount: Math.max(3, Math.ceil((card.cmc || 0) * 2 + 2)) });
  return effects;
}
function permanentEffect(card) {
  const text = card.oracle_text || '';
  const buff = text.match(/gets?\s+([+-]\d+)\/([+-]\d+)/i);
  const attachment = isAttachment(card);
  const keywords = attachment ? (text.match(/(?:has|have|gains?)\s+([^.;\n]+)/i)?.[1] || '').match(/\b(?:flying|lifelink|double strike|first strike|deathtouch|reach|haste|vigilance)\b/gi) || [] : [];
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
    const lines = ['Stays on the battlefield for this encounter.'];
    if (isAttachment(card)) {
      lines.push(isAura(card) ? 'Aura: choose an allied creature when casting.' : 'Equipment: click or drag it onto an allied creature; re-equipping is free.');
      lines.push(`Its host gets ${signed(effect.power)}/${signed(effect.toughness)}${effect.keywords.length ? ' and ' + effect.keywords.join(', ') : ''}.`);
      lines.push(isAura(card) ? 'When its host leaves the battlefield, the aura goes to your graveyard.' : 'When its host leaves, the equipment stays unattached.');
    } else if (effect.shield) lines.push(`Gain ${effect.shield} shield on entry and at each turn start. Shield expires after enemy damage.`);
    else lines.push(`All allied creatures get ${signed(effect.power)}/${signed(effect.toughness)} while this card remains.`);
    return lines;
  }
  const lines = [];
  if (isCreature(card)) {
    const stats = parseStats(card);
    const keywords = creatureKeywordLabels(creatureKeywords(card));
    lines.push(`Creature: ${stats.power} power / ${stats.toughness} toughness.${keywords ? ' Keywords: ' + keywords + '.' : ''}`);
    lines.push(creatureKeywords(card).haste ? 'Haste: may attack immediately.' : 'Summoning sickness: may block now, but attacks from your next turn.');
    lines.push('Attacking a monster also deals its power back to this creature. First strike and double strike use separate steps.');
  }
  for (const effect of cardEffects(card)) {
    if (effect.kind === 'damage') lines.push(`Deal ${effect.amount} damage to the selected enemy, otherwise the first enemy. Shield absorbs damage; excess is lost.`);
    if (effect.kind === 'destroy') lines.push('Destroy the selected creature. It goes to its graveyard.');
    if (effect.kind === 'exile') lines.push('Exile the selected creature for this encounter. It cannot be recycled. Drop onto an ally to exile that ally instead.');
    if (effect.kind === 'heal') lines.push(`Gain ${effect.amount} life. There is no life cap.`);
    if (effect.kind === 'draw') lines.push(`Draw ${effect.amount} additional card(s). There is no hand-size cap.`);
    if (effect.kind === 'shield') lines.push(`Gain ${effect.amount} shield until enemy damage finishes.`);
    if (effect.kind === 'buff') lines.push(`Your selected ally, otherwise your strongest creature, gets ${signed(effect.power)}/${signed(effect.toughness)}${effect.temporary ? ' until end of turn (amber)' : ' for this encounter (green)'}. With no creature, gain 3 shield.`);
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

function makeCardMarkup(card, packIndex, cardIndex, selected) {
  return `<button type="button" class="draft-option${selected ? ' selected' : ''}" data-pack-index="${packIndex}" data-card-index="${cardIndex}" data-preview-owner="draft" style="--card-index:${cardIndex}" aria-pressed="${selected}" aria-label="${escapeHtml(card.name)}, ${Math.ceil(card.cmc || 0)} generic mana${selected ? ', selected' : ''}"><span class="card-image-wrap">${cardFace(card)}</span><span class="draft-card-name">${escapeHtml(card.name)}</span></button>`;
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
  $('#draft-step').textContent = starter ? `PACK ${packIndex + 1} OF 3` : 'REWARD';
  $('#draft-title').textContent = state.boosterSealed ? 'Your next booster' : 'Which card joins your journey?';
  $('#draft-instruction').textContent = state.boosterSealed ? 'Open the pack to reveal seven cards.' : 'Choose one of seven cards. Receive four copies. Hover a card to read its actual game effect.';
  $('#pack-number').textContent = `${packIndex + 1} / ${starter ? 3 : 1}`;
  $('#deck-count').textContent = String(state.deck.length + state.selection.size * 4);
  $('#draft-grid').innerHTML = state.boosterSealed
    ? `<div class="pack-stage"><div class="pack-particles" aria-hidden="true">✦ · ✧ · ✦</div><button class="sealed-pack" data-open-pack="true" aria-label="Booster ${packIndex + 1} open"><span class="pack-foil"></span><span class="pack-logo">BOOSTER<br><b>TUTOR</b></span><span class="pack-emblem">✦</span><span class="pack-caption">AETHER EXPEDITION</span><span class="pack-card-count">7 CARDS</span></button><p>Click to open</p></div>`
    : `<div class="reveal-sparks" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--spark-angle:${index * 20}deg;--spark-distance:${110 + index % 4 * 60}px"></i>`).join('')}</div><section class="booster-pack"><header><span>BOOSTER ${packIndex + 1}</span><small>${chosen ? '1 CARD SELECTED' : 'CHOOSE 1 OF 7'}</small></header><div class="booster-cards">${state.packs[packIndex].map((card, cardIndex) => makeCardMarkup(card, packIndex, cardIndex, state.selection.get(packIndex) === cardIndex)).join('')}</div></section>`;
  $('#selection-status').textContent = state.boosterSealed ? 'One pack at a time.' : chosen ? 'Your card is selected.' : 'The tooltip shows costs and actual in-game effects.';
  $('#pack-reroll').disabled = state.boosterSealed || Boolean(state.rerolledPacks?.has(packIndex));
  $('#pack-reroll').textContent = state.rerolledPacks?.has(packIndex) ? '↻ Reroll used' : '↻ Reroll pack · 1×';
  $('#draft-confirm').disabled = state.boosterSealed || !chosen;
  $('#draft-confirm').textContent = last ? starter ? 'BUILD DECK →' : 'TAKE CARD →' : 'NEXT PACK →';
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
  playSfx('select');
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
  const attackButton = event.target.closest('[data-unit-attack]');
  if (attackButton) return attackWithCreature(attackButton.dataset.unitAttack);
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
  if (battle.phase !== 'main' || !eligibleAttacker(creature, battle)) return;
  creature.willAttack = !creature.willAttack;
  if (creature.willAttack && !creature.attackTargetId) creature.attackTargetId = battle.selectedEnemyTargetId || battle.enemyCreatures[0]?.id;
  addLog(creature.willAttack ? `${creature.card.name} will attack.` : `${creature.card.name} will stay back to block.`);
  renderBattle();
  playSfx('select');
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
  drawToHand(HAND_SIZE);
  addLog(`${enemy.name} confronts you with ${enemyCreatures.length} creatures. Your generic mana refills each turn. Defeat every enemy to advance.`);
  renderBattle();
  showScreen('combat-screen');
  playSfx('turn');
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
  playSfx('shuffle');
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
    const intent = enemyIntent(enemy);
    const selected = battle.phase === 'blocks' ? battle.selectedEnemyAttackerId === enemy.id : battle.selectedEnemyTargetId === enemy.id;
    const blocker = assignedBlockerName(battle, enemy.id);
    return `<button type="button" class="monster monster-${enemy.kind || 'sprout'}${selected ? ' selected' : ''}${blocker ? ' is-blocked' : ''}" data-enemy-attacker="${escapeHtml(enemy.id)}" aria-pressed="${selected}" aria-label="${escapeHtml(enemy.card.name)}, ${enemy.health} life, ${escapeHtml(intent.label)}"><span class="monster-intent intent-${intent.kind}"><b>${intent.icon}</b> ${escapeHtml(intent.label)}</span><span class="monster-figure"><img src="assets/foes/${enemy.kind || 'sprout'}.svg" alt="" draggable="false"></span><strong>${escapeHtml(enemy.card.name)}</strong><span class="monster-life" aria-label="${enemy.health} life">♥ <b>${enemy.health}</b>${enemy.shield ? `<span>⛨ ${enemy.shield}</span>` : ''}</span><small>${blocker ? 'Blocked by ' + escapeHtml(blocker) : selected ? 'Selected target' : ''}</small></button>`;
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
  if (owner === 'collection') return state.collectionCards?.[Number(element.dataset.collectionIndex)] || null;
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
  if (element.dataset.previewOwner === 'draft' && $('#draft-screen').classList.contains('opening') && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return hideCardPreview();
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
    ? [`Enemy: ${creature.power} attack · ${creature.health} life.`, `Attack ${creatureCanAttack(creature, battle.turn) ? 'this turn' : 'from next turn'}.`, creatureKeywordLabels(creature) || 'No special combat keywords.']
    : effectDescriptions(card);
  if (creature?.owner === 'player') lines.unshift(`Current: ${creature.power}/${creature.toughness} · ${creature.damage || 0} Damage · ${creature.tapped ? 'tapped; cannot block' : 'may block'}.`);
  if (permanent) lines.push(attached ? `Attached to: ${attached}.` : isAttachment(card) ? 'Not attached.' : 'Active on the battlefield.');
  if (element.dataset.previewOwner === 'hand') lines.push(!canCastNow(card, battle) ? 'Only instants can be cast outside the main phase.' : battle.mana < cost ? `Need ${cost - battle.mana} more mana.` : isCreature(card) && battle.creatures.length >= 3 ? 'All three creature slots are occupied.' : isAura(card) && !battle.creatures.length ? 'Requires an allied creature.' : 'Click or drag to cast.');
  const keywordInfo = { flying:'Flying: only flying or reach can block it.', reach:'Reach: can block flying attackers.', lifelink:'Lifelink: combat damage restores life.', deathtouch:'Deathtouch: any unprevented combat damage is lethal to creatures.', 'first strike':'First strike: deals damage before the normal step.', 'double strike':'Double strike: deals damage in both steps.', haste:'Haste: may attack immediately.', vigilance:'Vigilance: attacking does not tap this creature; it may still block.' };
  const activeKeywords = creature ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creature, keyword)) : isCreature(card) ? Object.keys(keywordInfo).filter(keyword => hasCreatureKeyword(creatureKeywords(card), keyword)) : [];
  preview.innerHTML = `<div class="bubble-header"><b>${escapeHtml(card.name)}</b><strong>${cost} Mana</strong></div><div class="bubble-type">${escapeHtml(card.type_line)} · generic costs only</div><ul>${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>${activeKeywords.length ? `<div class="bubble-keywords">${activeKeywords.map(keyword => escapeHtml(keywordInfo[keyword])).join('<br>')}</div>` : ''}`;
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
  if (battle.phase === 'main') for (const creature of battle.creatures) { if (creature.attackTargetId && !battle.enemyCreatures.some(enemy => enemy.id === creature.attackTargetId)) { creature.attackTargetId = null; creature.willAttack = false; } }
  const enemy = battle.enemy;
  $('#shield-label').textContent = `${battle.playerBlock} shield`;
  $('#node-counter').textContent = String(state.node).padStart(2, '0');
  $('#location-name').textContent = enemy.location;
  $('#enemy-rank').textContent = enemy.rank;
  $('#enemy-name').textContent = enemy.name;
  const enemyCount = battle.enemyCreatures.length;
  $('#enemy-count-label').textContent = `${enemyCount} REMAINING`;
  $('#player-health-label').textContent = `${Math.max(0, state.playerHealth)}`;
  const availableMana = battle.mana;
  $('#mana-label').textContent = `${availableMana} / ${battle.maxMana}`;
  $('#enemy-art-image').src = battle.enemyArt || '';
  $('#enemy-art-image').hidden = !battle.enemyArt;
  $('#enemy-art .enemy-sprite').hidden = Boolean(battle.enemyArt);
  const resolving = ['attack', 'enemy', 'damage'].includes(battle.phase);
  $('#end-turn-button').disabled = resolving && !battle.priorityCallback;
  $('#end-turn-button').innerHTML = battle.priorityCallback ? 'CONTINUE <span>→</span>' : battle.phase === 'blocks' ? 'CONFIRM BLOCKS <span>✓</span>' : resolving ? 'RESOLVING COMBAT …' : 'END TURN <span>→</span>';
  $('#combat-action-hint').textContent = battle.pendingAttachment ? 'Choose an allied creature. Cancelling is free.' : battle.phase === 'blocks'
    ? 'Choose an attacker, then add blockers. You can drag blockers onto attackers.'
    : 'Click a creature to queue it, choose its target, or use Attack now.';
  if (battle.priorityCallback) $('#combat-action-hint').textContent = 'Response window: cast an instant, then Continue.';
  else if (resolving) $('#combat-action-hint').textContent = phaseInfo(battle.phase).description;
  $('#combat-action-hint').classList.toggle('blocking', battle.phase === 'blocks');
  $('#turn-label').textContent = `TURN ${battle.turn}`;
  $('#turn-display').textContent = `Turn ${battle.turn}`;
  $('#progress-pips').innerHTML = ENCOUNTERS.map((_, index) => `<i class="${index < state.node ? 'done ' : ''}${index === 3 ? 'boss' : ''}" aria-label="Fight ${index + 1}"></i>`).join('');
  $('#graveyard-count').textContent = String(battle.graveyard.length);
  $('#library-count').textContent = String(battle.deck.length);
  $('#library-button').classList.toggle('is-empty', !battle.deck.length);
  $('#library-button').setAttribute('aria-label', `Library, ${battle.deck.length} cards. Inspect sorted contents without revealing draw order.`);
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
  requestAnimationFrame(drawCombatArrows);
}

function renderHand() {
  const battle = state.battle;
  const center = (battle.hand.length - 1) / 2;
  const spacing = Math.min(87, 820 / Math.max(1, battle.hand.length - 1));
  $('#hand-row').style.setProperty('--hand-step', `${spacing}px`);
  $('#hand-row').innerHTML = battle.hand.map((card, index) => {
    const position = index - center;
    const canPay = Boolean(paymentPlan(card));
    const selected = battle.pendingAttachment?.handIndex === index;
    return `<button type="button" class="hand-card${!canCastNow(card, battle) ? ' timing-unavailable' : ''}${isInstant(card) && battle.phase !== 'main' ? ' instant-response' : ''}${!canPay ? ' insufficient-mana' : ''}${selected ? ' targeting-card' : ''}" style="--fan-angle:${position * Math.min(4, 16 / Math.max(1, battle.hand.length - 1))}deg;--fan-lift:${Math.pow(position / Math.max(1, center), 2) * 12}px;--fan-index:${index}" data-hand-index="${index}" data-preview-owner="hand" draggable="${canCastNow(card, battle)}" aria-label="${escapeHtml(card.name)}, ${Math.ceil(card.cmc || 0)} Mana" aria-pressed="${selected}">${cardFace(card)}</button>`;
  }).join('');
  $('#hand-row').querySelectorAll('.hand-card').forEach(button => {
    button.addEventListener('click', () => { if (Date.now() < (state.suppressClickUntil || 0)) return; hideCardPreview(); playCard(Number(button.dataset.handIndex), defaultTarget(battle.hand[Number(button.dataset.handIndex)])); });

  });
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
    const sick = !creatureCanAttack(creature, battle.turn);
    const assignment = [...battle.blockAssignments.keys()].find(id => blockerIds(battle, id).includes(creature.id));
    const attacker = battle.enemyCreatures.find(item => item.id === assignment);
    const selected = battle.enemyCreatures.find(item => item.id === battle.selectedEnemyAttackerId);
    const blocking = battle.phase === 'blocks';
    const legal = blocking && !creature.tapped && (!selected || canBlockCreature(creature, selected));
    const canAttack = eligibleAttacker(creature, battle);
    const target = attackTarget(battle, creature);
    const status = battle.pendingAttachment ? 'Choose as attachment target' : creature.tapped ? 'Tapped' : blocking ? attacker ? `Blocking ${attacker.card.name}` : legal ? 'Click to add as blocker' : 'Cannot block this attacker' : sick ? 'Summoning sickness · may block' : creature.attackedThisTurn ? hasCreatureKeyword(creature, 'vigilance') ? 'Attacked · vigilance · may block' : 'Already attacked' : creature.willAttack ? `Queued → ${target?.card.name || 'choose target'}` : 'Ready · click to queue attack';
    const attachments = battle.permanents.filter(permanent => permanent.attachedTo === creature.id);
    return `<div class="creature-group${sick ? ' is-summoning-sick' : ''}${creature.tapped ? ' is-tapped' : ''}" data-host-id="${escapeHtml(creature.id)}"><div class="unit-attachments" aria-label="Cards attached to ${escapeHtml(creature.card.name)}">${attachments.map(permanent => permanentMarkup(permanent, true)).join('')}</div><button type="button" class="creature-token${legal ? ' can-block' : ''}${assignment ? ' assigned-blocker' : ''}${creature.tapped ? ' tapped' : ''}${creature.willAttack ? ' attack-queued' : ''}${battle.pendingAttachment ? ' attachment-target' : ''}" data-creature-id="${escapeHtml(creature.id)}" data-preview-owner="player" data-preview-id="${escapeHtml(creature.id)}" aria-pressed="${blocking ? Boolean(assignment) : Boolean(creature.willAttack)}" aria-label="${escapeHtml(creature.card.name)}, ${escapeHtml(status)}" draggable="${(blocking && !creature.tapped) || (battle.phase === 'main' && canAttack)}"><span class="player-card-frame">${cardFace(creature.card)}</span><span class="field-caption"><b>${escapeHtml(creature.card.name)}</b><span>${creature.power}/${creature.toughness}${creature.damage ? ` · ${creature.damage} damage` : ''}</span>${bonusMarkup(creature)}<small>${escapeHtml(status)}</small></span></button>${attachments.length ? `<span class="attachment-link" aria-label="${attachments.length} attached cards">↔ ${attachments.length}</span>` : ''}<div class="unit-controls"><select data-unit-target="${creature.id}" aria-label="Attack target for ${escapeHtml(creature.card.name)}" ${battle.phase !== 'main' || !canAttack ? 'disabled' : ''}>${battle.enemyCreatures.map(enemy => `<option value="${enemy.id}" ${target?.id === enemy.id ? 'selected' : ''}>${escapeHtml(enemy.card.name)}</option>`).join('')}</select><button data-unit-attack="${creature.id}" ${battle.phase !== 'main' || !canAttack ? 'disabled' : ''} aria-label="Attack now with ${escapeHtml(creature.card.name)}">Attack now</button></div></div>`;
  }).join('') : '<div class="empty-board">Play a creature from your hand.<br>You have three creature slots.</div>';
}

function permanentMarkup(permanent, attached = false) {
  const battle = state.battle;
  const target = battle.creatures.find(item => item.id === permanent.attachedTo);
  return `<button type="button" class="permanent-card${attached ? ' attached-permanent' : ''}${battle.pendingAttachment?.permanentId === permanent.id ? ' targeting-card' : ''}" draggable="${/Equipment/.test(permanent.card.type_line) && battle.phase === 'main'}" data-permanent-id="${escapeHtml(permanent.id)}" data-preview-owner="permanent" data-preview-id="${escapeHtml(permanent.id)}" aria-label="${escapeHtml(permanent.card.name)}${target ? ', attached to ' + escapeHtml(target.card.name) : ''}"><span class="permanent-card-frame">${cardFace(permanent.card)}</span><span class="field-caption"><b>${escapeHtml(permanent.card.name)}</b><small>${target ? '↔ ' + escapeHtml(target.card.name) : isAttachment(permanent.card) ? 'Click to equip' : 'Active enchantment / artifact'}</small></span></button>`;
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
  const unblocked = attackers.filter(creature => !blockerIds(battle, creature.id).length);
  const damage = unblocked.reduce((sum, creature) => sum + Math.max(0, creature.power) * (hasCreatureKeyword(creature, 'double strike') ? 2 : 1), 0);
  $('#blocking-summary').textContent = `${attackers.length - unblocked.length}/${attackers.length} attacks blocked · ${Math.max(0, damage - battle.playerBlock)} direct damage after shield. Multiple blockers are allowed; click order sets damage order.`;
  $('#blocking-pairs').innerHTML = attackers.map(attacker => {
    const names = blockerIds(battle, attacker.id).map(id => battle.creatures.find(creature => creature.id === id)?.card.name).filter(Boolean);
    return `<button type="button" data-block-attacker="${attacker.id}" class="block-pair${names.length ? ' paired' : ''}${battle.selectedEnemyAttackerId === attacker.id ? ' selected' : ''}" aria-pressed="${battle.selectedEnemyAttackerId === attacker.id}"><b>${escapeHtml(attacker.card.name)}</b><span>${names.length ? names.map((name, index) => `${index + 1}. ${escapeHtml(name)}`).join('<br>') : 'Choose blockers →'}</span></button>`;
  }).join('');
}

$('#player-drop-zone').addEventListener('click', event => {
  const button = event.target.closest('[data-permanent-id]');
  const battle = state.battle;
  if (!button || battle?.phase !== 'main' || Date.now() < (state.suppressClickUntil || 0)) return;
  const permanent = battle.permanents.find(item => item.id === button.dataset.permanentId);
  if (!permanent || !/Equipment/.test(permanent.card.type_line)) return;
  if (!battle.creatures.length) return showToast('Play a creature first.');
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
  battle.blockAssignments = new Map([...assignments].map(([attackerId, blocker]) => [attackerId, [blocker.id]]));
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
    creature.attackTargetId = enemy.dataset.enemyAttacker; attackWithCreature(creature.id); return true;
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
  if ((isCreature(card) || isPermanent(card)) && !onPlayer) return false;
  if (!onPlayer && !onEnemy) return false;
  if (enemy) battle.selectedEnemyTargetId = enemy.dataset.enemyAttacker;
  const allyId = ally?.dataset.creatureId;
  battle.pendingSpellTarget = allyId ? { side: 'player', id: allyId } : enemy ? { side: 'enemy', id: enemy.dataset.enemyAttacker } : null;
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
  if (payload.kind === 'attacker') return battle.phase === 'main' && Boolean(enemy) && eligibleAttacker(battle.creatures.find(item => item.id === payload.id), battle);
  if (payload.kind === 'blocker') {
    const unit = battle.creatures.find(item => item.id === payload.id && !item.tapped);
    const attacker = battle.enemyCreatures.find(item => item.id === enemy?.dataset.enemyAttacker);
    return battle.phase === 'blocks' && Boolean(unit && attacker && creatureCanAttack(attacker, battle.turn) && canBlockCreature(unit, attacker));
  }
  if (payload.kind === 'equipment') return battle.phase === 'main' && Boolean(own && ally);
  const card = battle.hand[payload.index];
  if (!card || !canCastNow(card, battle) || !paymentPlan(card)) return false;
  if (isCreature(card)) return Boolean(own) && battle.creatures.length < 3;
  if (isAura(card)) return Boolean(own && ally);
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
  else playSfx('cancel');
  finishDrag();
});
document.addEventListener('dragend', () => { if (!pointerDrag) finishDrag(); });
document.addEventListener('pointerdown', event => {
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
    const image = pointerDrag.face.querySelector('img, .printed-card');
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
  if (dropFeedback(pointerDrag.payload, target)) handleCardDrop(pointerDrag.payload, target);
  else playSfx('cancel');
  finishDrag();
});
document.addEventListener('pointercancel', () => { if (pointerDrag) finishDrag(); });
window.addEventListener('blur', () => { if (pointerDrag) finishDrag(); });

function drawOneExtra() {
  const battle = state.battle;
  drawToHand(battle.hand.length + 1);
}

function damageFirstEnemy(amount) {
  const battle = state.battle;
  const enemy = battle?.enemyCreatures.find(creature => creature.id === battle.selectedEnemyTargetId && creature.health > 0) || battle?.enemyCreatures.find(creature => creature.health > 0);
  if (!enemy || amount <= 0) return 0;
  const blocked = Math.min(enemy.shield || 0, amount);
  enemy.shield = (enemy.shield || 0) - blocked;
  const dealt = Math.min(enemy.health, amount - blocked);
  enemy.health = Math.max(0, enemy.health - dealt);
  if (dealt > 0) playSfx('hit');
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
    if (effect.kind === 'exile' || effect.kind === 'destroy') removeSpellTarget(effect.kind);
    if (effect.kind === 'heal') { state.playerHealth += effect.amount; playSfx('heal'); }
    if (effect.kind === 'draw') for (let i = 0; i < effect.amount; i++) drawOneExtra();
    if (effect.kind === 'shield') battle.playerBlock += effect.amount;
    if (effect.kind === 'buff' || effect.kind === 'keywords') {
      const target = (battle.resolvingSpellTarget?.side === 'player' ? battle.creatures.find(creature => creature.id === battle.resolvingSpellTarget.id) : null) || battle.creatures.slice().sort((a, b) => b.power - a.power)[0];
      if (!target) { if (effect.kind === 'buff') battle.playerBlock += 3; continue; }
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
    if (!paymentPlan(card)) return showToast('Not enough generic mana.');
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
  playSfx('attach');
  renderBattle();
}

function playCard(index, targetSide = 'enemy') {
  const battle = state.battle;
  const card = battle?.hand[index];
  if (!card) return;
  if (!canCastNow(card, battle)) return showToast('Only instants can be cast outside your main phase.');
  if (isAura(card)) {
    if (!battle.creatures.length) return showToast('This aura requires an allied creature.');
    if (!paymentPlan(card)) return showToast('Not enough generic mana.');
    battle.pendingAttachment = { handIndex: index };
    renderBattle();
    return;
  }
  battle.pendingAttachment = null;
  battle.resolvingSpellTarget = battle.pendingSpellTarget || null;
  battle.pendingSpellTarget = null;
  if (isLand(card)) return showToast('This game does not require lands.');
  if (isCreature(card) && battle.creatures.length >= 3) return showToast('Your creature board is full.');
  if (targetSide === 'enemy' && isCreature(card)) return showToast('Creatures enter your battlefield. Drag one to the left side.');
  const payment = paymentPlan(card);
  if (!payment) return showToast('Not enough generic mana for this card.');
  battle.mulliganAvailable = false;
  battle.mana -= Math.ceil(card.cmc || 0);
  battle.hand.splice(index, 1);
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
    applyOracle(card, true);
  } else if (isPermanent(card)) {
    battle.permanents.push({ id: `permanent-${state.nextPermanentId++}`, card, attachedTo: null });
    battle.playerBlock += permanentEffect(card).shield;
    refreshPermanentEffects();
    addLog(`${card.name} stays on the battlefield.`);
  } else {
    battle.graveyard.push(card);
    applyOracle(card, false);
  }
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
  if (controller === 'player') state.playerHealth += amount;
  else creature.health = (creature.health || 0) + amount;
}

function dealCreatureDamage(source, target, controller, battle, amount = Math.max(0, source.power || 0)) {
  if (amount <= 0) return;
  let dealt = amount;
  if (target.owner === 'enemy') {
    const absorbed = Math.min(target.shield || 0, amount);
    target.shield = (target.shield || 0) - absorbed;
    dealt = Math.max(0, amount - absorbed);
    target.health = Math.max(0, target.health - dealt);
    if (dealt > 0 && hasCreatureKeyword(source, 'deathtouch')) target.health = 0;
  } else {
    target.damage = (target.damage || 0) + amount;
    if (hasCreatureKeyword(source, 'deathtouch')) target.deathtouchDamage = true;
  }
  gainLifelinkLife(source, controller, dealt, battle);
  if (dealt) playSfx('hit');
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
    for (const attacker of attackers) {
      if (!creatureAlive(attacker)) continue;
      const original = assignments.get(attacker.id);
      const group = Array.isArray(original) ? original : original ? [original] : [];
      const blockers = group.filter(blocker => creatureAlive(blocker) && (attackingSide === 'player' || canBlockCreature(blocker, attacker)));
      if (!group.length) {
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
          const lethal = hasCreatureKeyword(attacker, 'deathtouch') ? 1 : blocker.owner === 'enemy' ? Math.max(0, blocker.health + (blocker.shield || 0)) : Math.max(0, blocker.toughness - (blocker.damage || 0));
          const amount = index === blockers.length - 1 ? remaining : Math.min(remaining, lethal);
          if (amount > 0) exchanges.push({ source: attacker, target: blocker, controller: attackingSide, amount });
          remaining -= amount;
        });
      }
      for (const blocker of blockers) {
        if (dealsInCombatStep(blocker, firstStep)) exchanges.push({ source: blocker, target: attacker, controller: attackingSide === 'player' ? 'enemy' : 'player', amount: Math.max(0, blocker.power) });
      }
    }
    // Eligibility is captured before applying the step: normal damage is simultaneous.
    for (const exchange of exchanges) dealCreatureDamage(exchange.source, exchange.target, exchange.controller, battle, exchange.amount);
    battle.creatures = removeDeadCreatures(battle.creatures, 'player', false);
    battle.enemyCreatures = removeDeadCreatures(battle.enemyCreatures, 'enemy', false);
  }
  return { damageToPlayer, damageToOpponent, enemyLifelinkEvents };
}
function attackTarget(battle, creature) {
  if (creature.attackTargetId) return battle.enemyCreatures.find(enemy => enemy.id === creature.attackTargetId) || null;
  return battle.enemyCreatures.find(enemy => enemy.id === battle.selectedEnemyTargetId) || battle.enemyCreatures[0];
}
function eligibleAttacker(creature, battle) {
  return Boolean(creature) && creatureCanAttack(creature, battle.turn) && !creature.tapped && !creature.attackedThisTurn;
}
function resolvePlayerAttacks(onlyIds = null) {
  const battle = state.battle;
  const attackers = battle.creatures.filter(creature => eligibleAttacker(creature, battle) && (onlyIds ? onlyIds.includes(creature.id) : creature.willAttack === true));
  for (const creature of attackers) {
    if (!creatureAlive(creature)) continue;
    const target = attackTarget(battle, creature);
    if (!target) { creature.willAttack = false; continue; }
    creature.attackedThisTurn = true;
    creature.willAttack = false;
    creature.tapped = !hasCreatureKeyword(creature, 'vigilance');
    addLog(`${creature.card.name} attacks ${target.card.name}; the monster retaliates.`);
    resolveCombatDamage([creature], new Map([[creature.id, [target]]]), 'player');
  }
}
function attackWithCreature(creatureId) {
  const battle = state.battle;
  const creature = battle?.creatures.find(item => item.id === creatureId);
  if (!battle || battle.phase !== 'main' || !creature || !eligibleAttacker(creature, battle)) return;
  battle.pendingAttachment = null;
  battle.mulliganAvailable = false;
  battle.phase = 'attack';
  battle.activeAttackIds = [creatureId];
  renderBattle();
  afterCombatBeat(battle, 'attack', () => {
    resolvePlayerAttacks([creatureId]);
    battle.activeAttackIds = null;
    if (!battle.enemyCreatures.length) return winBattle();
    battle.phase = 'main';
    renderBattle();
  });
}
function assignBlocker(attackerId, blockerId) {
  const battle = state.battle;
  if (!battle || battle.phase !== 'blocks') return;
  const attacker = battle.enemyCreatures.find(creature => creature.id === attackerId && creatureCanAttack(creature, battle.turn));
  const blocker = battle.creatures.find(creature => creature.id === blockerId && !creature.tapped);
  if (!attacker || !blocker) return;
  if (!canBlockCreature(blocker, attacker)) return showToast('Flying attackers require flying or reach to block.');
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
  return Boolean(battle && (battle.phase === 'main' || (isInstant(card) && ['attack', 'enemy', 'blocks', 'damage'].includes(battle.phase))));
}
function hasInstantResponse(battle) { return battle.hand.some(card => isInstant(card) && battle.mana >= Math.ceil(card.cmc || 0)); }
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
    const blockers = blockerIds(battle, attacker.id).map(id => battle.creatures.find(creature => creature.id === id && !creature.tapped)).filter(blocker => blocker && canBlockCreature(blocker, attacker));
    if (blockers.length) assignments.set(attacker.id, blockers);
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

  battle.creatures.forEach(creature => { creature.damage = 0; creature.deathtouchDamage = false; });
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
    creature.willAttack = false;
    creature.attackedThisTurn = false;
  });
  drawToHand(HAND_SIZE);
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
  if (state.battle?.priorityCallback) { const callback = state.battle.priorityCallback; state.battle.priorityCallback = null; callback(); return; }
  if (state.battle?.phase === 'blocks') beginEnemyDamage();
  else if (state.battle?.phase === 'main') finishTurn();
}

function winBattle() {
  state.battle.phase = 'complete'; state.battle.priorityCallback = null; state.battle.phaseTicket = (state.battle.phaseTicket || 0) + 1;
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
  playSfx('victory');
}

function endRun(won) {
  if (state.battle) { state.battle.phase = 'complete'; state.battle.priorityCallback = null; }
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
  playSfx(won ? 'victory' : 'defeat');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function playBoosterOpeningSound() {
  if (!state.soundOn) return;
  const audio = $('#booster-audio');
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0.72;
  audio.play().catch(() => showToast('Click SOUND once to enable audio.'));
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
  if (event.key === 'Enter' && $('#start-screen').classList.contains('active')) startNewRun();
});

function showJourney() {
  const first = state.node === 1;
  $('#journey-title').textContent = first ? 'Choose your relic' : 'A moment by the fire';
  $('#journey-description').textContent = first ? 'One relic. A different way to play. Your choice lasts for this run.' : 'Life carries between encounters. Prepare before you continue.';
  $('#journey-path').innerHTML = ENCOUNTERS.map((encounter, index) => `<div class="path-node ${index + 1 === state.node ? 'current' : index + 1 < state.node ? 'complete' : ''}"><span>${index + 1 < state.node ? '✓' : index === 3 ? '♜' : '⚔'}</span><small>${encounter.rank}</small><b>${encounter.name}</b></div>`).join('');
  $('#journey-options').innerHTML = first
    ? '<button data-relic="crystal"><span>◈</span><h3>Aether Crystal</h3><p>+1 generic mana every turn.</p></button><button data-relic="ward"><span>⛨</span><h3>Ancient Ward</h3><p>Begin each battle with 4 shield.</p></button>'
    : '<button data-camp="rest"><span>✦</span><h3>Rest</h3><p>Restore 10 life. No life cap.</p></button><button data-camp="study"><span>▣</span><h3>Study</h3><p>Add Divination: draw two cards.</p></button>';
  $('#journey-life').textContent = `${state.playerHealth} LIFE · ${state.deck.length} CARDS`;
  showScreen('journey-screen');
}
$('#journey-options').addEventListener('click', event => {
  const choice = event.target.closest('button');
  if (!choice) return;
  if (choice.dataset.relic) state.relic = choice.dataset.relic;
  if (choice.dataset.camp === 'rest') state.playerHealth += 10;
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
  if (candidates.length < PACK_SIZE) return showToast('Not enough different cards to reroll.');
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
  $('#inspector-content').innerHTML = `<div class="inspector-card">${cardFace(card)}</div><h3>${escapeHtml(card.name)}</h3><p class="inspector-cost">${Math.ceil(card.cmc || 0)} generic mana${creature ? ` · Current ${creature.power}/${creature.toughness}` : ''}</p><div class="inspector-rules">${effectDescriptions(card).map(line => `<p>${escapeHtml(line)}</p>`).join('')}${attached ? `<p>Attached to ${escapeHtml(attached.card.name)}.</p>` : ''}</div>`;
}
function fitGameCanvas() {
  document.documentElement.style.setProperty('--game-scale', Math.min(window.innerWidth / 1600, window.innerHeight / 900));
}
window.addEventListener('resize', fitGameCanvas);
fitGameCanvas();

$('#fullscreen-button').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => showToast('Fullscreen is unavailable in this browser.')); });

const COMBAT_PHASES = [
  { id: 'main', label: 'Main phase', description: 'Queue attackers, choose individual targets, or use Attack now. Instants can respond in every phase.' },
  { id: 'attack', label: 'Your attack', description: 'Your creatures fight their targets. Monsters retaliate.' },
  { id: 'enemy', label: 'Enemy action', description: 'Monsters guard, strengthen, or prepare their attacks.' },
  { id: 'blocks', label: 'Block', description: 'Assign one or more blockers. Selection order is damage order.' },
  { id: 'damage', label: 'Damage', description: 'Enemy attacks and blocks resolve damage simultaneously.' }
];
function phaseInfo(id) { return COMBAT_PHASES.find(phase => phase.id === id) || COMBAT_PHASES[0]; }
function updatePhaseDisplay() {
  const screen = state.screen || 'start-screen';
  const labels = { 'start-screen': 'START', 'loading-screen': 'PREPARING DECK', 'draft-screen': state.boosterSealed ? 'OPEN BOOSTER' : 'PICK A CARD', 'journey-screen': state.node === 1 ? 'CHOOSE RELIC' : 'CAMP', 'end-screen': 'RUN COMPLETE' };
  const phase = phaseInfo(state.battle?.phase);
  $('.arrow-legend').dataset.phase = phase.id;
  $('#global-phase').textContent = screen === 'combat-screen' ? phase.label.toUpperCase() : labels[screen] || 'EXPEDITION';
  if (!state.battle) return;
  $('#phase-strip').innerHTML = COMBAT_PHASES.map((item, index) => `<li class="${phase.id === item.id ? 'current' : ''}" ${phase.id === item.id ? 'aria-current="step"' : ''} data-phase="${item.id}"><span>${index + 1}</span>${item.label}</li>`).join('');
  $('#phase-status').textContent = state.battle?.priorityCallback ? 'You have priority: cast an instant, then Continue.' : phase.description;
}
function combatRoutes(battle) {
  const routes = [];
  for (const creature of battle.creatures) {
    const active = battle.phase === 'attack' && battle.activeAttackIds?.includes(creature.id);
    if (!eligibleAttacker(creature, battle) || (!creature.willAttack && !active)) continue;
    const target = attackTarget(battle, creature);
    if (target) routes.push({ kind: 'ally', from: creature.id, to: target.id, damage: Math.max(0, creature.power) * (hasCreatureKeyword(creature, 'double strike') ? 2 : 1) });
  }
  for (const enemy of battle.enemyCreatures) {
    if (!creatureCanAttack(enemy, battle.turn)) continue;
    const ids = blockerIds(battle, enemy.id);
    const blockers = ids.map(id => battle.creatures.find(creature => creature.id === id && !creature.tapped)).filter(Boolean);
    if (!blockers.length) routes.push({ kind: 'enemy', from: enemy.id, to: 'player', damage: Math.max(0, enemy.power) * (hasCreatureKeyword(enemy, 'double strike') ? 2 : 1) });
    else {
      let remaining = Math.max(0, enemy.power);
      blockers.forEach((blocker, index) => {
        const amount = index === blockers.length - 1 ? remaining : Math.min(remaining, Math.max(0, blocker.toughness - (blocker.damage || 0)));
        routes.push({ kind: 'block', from: enemy.id, to: blocker.id, damage: amount }); remaining -= amount;
      });
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
  const sx = width / rect.width;
  const sy = height / rect.height;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const center = (element, edge) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { x: ((edge === 'right' ? box.right : box.left + box.width / 2) - rect.left) * sx, y: ((edge === 'top' ? box.top - 4 : edge === 'bottom' ? box.bottom + 7 : box.top + box.height / 2) - rect.top) * sy };
  };
  const paths = combatRoutes(battle).map((route, index) => {
    const fromElement = route.kind === 'ally' ? document.querySelector(`[data-creature-id="${route.from}"] .player-card-frame`) : document.querySelector(`[data-enemy-attacker="${route.from}"] .monster-figure`);
    const toElement = route.to === 'player' ? $('#player-health-label') : route.kind === 'ally' ? document.querySelector(`[data-enemy-attacker="${route.to}"] .monster-figure`) : document.querySelector(`[data-creature-id="${route.to}"] .player-card-frame`);
    const from = center(fromElement, 'top');
    const to = center(toElement, route.to === 'player' ? 'bottom' : 'top');
    if (!from || !to) return '';
    const lift = 30 + index % 3 * 12;
    const c1 = { x: from.x + (route.kind === 'ally' ? 50 : -70), y: Math.max(32, from.y - lift) };
    const c2 = route.to === 'player' ? { x: to.x + 60, y: to.y + 18 } : { x: to.x + (route.kind === 'ally' ? -70 : 80), y: Math.max(32, to.y - lift) };
    const label = { x: (from.x + 3 * c1.x + 3 * c2.x + to.x) / 8, y: (from.y + 3 * c1.y + 3 * c2.y + to.y) / 8 };
    const units = [...battle.creatures, ...battle.enemyCreatures];
    const fromName = units.find(unit => unit.id === route.from)?.card.name || '';
    const toName = route.to === 'player' ? 'Your life' : units.find(unit => unit.id === route.to)?.card.name || '';
    const title = `${fromName} → ${toName}: ${route.damage} ${route.kind === 'block' ? 'blocked attack' : 'attack'}`;
    return `<g class="combat-route route-${route.kind}" data-arrow-kind="${route.kind}" data-from-id="${escapeHtml(route.from)}" data-to-id="${escapeHtml(route.to)}"><title>${escapeHtml(title)}</title><path d="M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}" marker-end="url(#arrow-${route.kind})"/><g transform="translate(${label.x},${label.y})"><rect x="-14" y="-10" width="28" height="20" rx="10"/><text text-anchor="middle" dominant-baseline="central">${route.damage}</text></g></g>`;
  }).join('');
  svg.innerHTML = `<defs>${['ally', 'enemy', 'block'].map(kind => `<marker id="arrow-${kind}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="arrowhead-${kind}" d="M 1 1 L 9 5 L 1 9 Z"/></marker>`).join('')}</defs>${paths}`;
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
  creature.attackTargetId = input.value; creature.willAttack = true; renderBattle();
});

function openCollection(kind = 'deck') {
  const battle = state.battle;
  if (state.screen === 'combat-screen' && ['attack', 'enemy', 'damage'].includes(battle?.phase) && !battle.priorityCallback) return;
  state.collectionKind = kind;
  $('#collection-search').value = '';
  $('#collection-title').textContent = kind === 'library' ? 'Your library' : kind === 'exile' ? 'Exile' : 'Your run deck';
  $('#collection-kind').textContent = kind.toUpperCase();
  $('#collection-note').textContent = kind === 'library' ? 'Remaining cards, grouped and sorted. Draw order stays hidden.' : kind === 'exile' ? 'Exiled cards and monsters cannot return through graveyard recycling. Exile lasts for this encounter.' : 'Every card in your run deck, including cards currently in other zones. Inspect this between encounters or turns.';
  renderCollection(); hideCardPreview(); $('#collection-dialog').showModal();
}
function renderCollection() {
  const kind = state.collectionKind;
  const cards = kind === 'library' ? state.battle?.deck || [] : kind === 'exile' ? [...(state.battle?.exile || []), ...(state.battle?.enemyExile || [])] : state.deck;
  const groups = new Map();
  for (const card of cards) {
    const key = card.id || card.name;
    if (groups.has(key)) groups.get(key).count += 1; else groups.set(key, { ...card, count: 1 });
  }
  const query = $('#collection-search').value.trim().toLowerCase();
  state.collectionCards = [...groups.values()].filter(card => `${card.name} ${card.type_line}`.toLowerCase().includes(query)).sort((a, b) => (a.cmc || 0) - (b.cmc || 0) || a.name.localeCompare(b.name));
  const average = cards.length ? cards.reduce((sum, card) => sum + (card.cmc || 0), 0) / cards.length : 0;
  $('#collection-stats').textContent = `${cards.length} cards · ${groups.size} unique · average mana ${average.toFixed(1)}`;
  $('#collection-grid').innerHTML = state.collectionCards.length ? state.collectionCards.map((card, index) => card.enemyKind ? `<div class="collection-monster"><img src="assets/foes/${card.enemyKind}.svg" alt="${escapeHtml(card.name)}"><b>${escapeHtml(card.name)}</b><span>Exiled monster</span></div>` : `<button class="collection-card" data-preview-owner="collection" data-collection-index="${index}" aria-label="${card.count} copies of ${escapeHtml(card.name)}">${cardFace(card)}<span><b>${escapeHtml(card.name)}</b><strong>×${card.count}</strong></span></button>`).join('') : '<p class="collection-empty">No cards in this zone.</p>';
}
$('#deck-button').addEventListener('click', () => openCollection('deck'));
$('#journey-deck-button').addEventListener('click', () => openCollection('deck'));
$('#library-button').addEventListener('click', () => openCollection('library'));
$('#exile-button').addEventListener('click', () => openCollection('exile'));
$('#collection-search').addEventListener('input', renderCollection);
$('#collection-close').addEventListener('click', () => { hideCardPreview(); $('#collection-dialog').close(); });
$('#collection-dialog').addEventListener('click', event => { if (event.target === $('#collection-dialog')) { hideCardPreview(); $('#collection-dialog').close(); } });
