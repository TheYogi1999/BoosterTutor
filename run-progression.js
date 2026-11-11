/* Run-only finishes, defeat levels and the optional post-campaign expedition. */
const FOIL_CHANCE59 = .12;
const BEST_LEVEL_KEY59 = 'booster-tutor-highest-level-v1';
state.level = 1;
state.defeatedEnemies59 = 0;
state.endless = false;
state.endlessReady59 = false;
state.finishRun59 = 1;
state.runStarted59 = false;
function readBestLevel59() {
  try {
    const saved = Number(localStorage.getItem(BEST_LEVEL_KEY59));
    if (Number.isSafeInteger(saved) && saved >= 1) return saved;
  } catch { /* The record still works for this page session without storage. */ }
  return 1;
}
state.bestLevel59 = readBestLevel59();

function syncRunProgress59() {
  $('#player-level').textContent = String(state.level);
  $('#highest-level').textContent = String(state.bestLevel59);
  $('#run-level').hidden = !state.runStarted59 || state.screen === 'start-screen';
}
function resetRunProgress59() {
  state.level = 1;
  state.defeatedEnemies59 = 0;
  state.endless = false;
  state.endlessReady59 = false;
  state.finishRun59++;
  state.runStarted59 = true;
  $('#endless-invitation').hidden = true;
  syncRunProgress59();
}
function gainDefeatLevel59() {
  state.runStarted59 = true;
  state.defeatedEnemies59++;
  state.level++;
  const previousBest = state.bestLevel59;
  state.bestLevel59 = Math.max(state.level, previousBest, readBestLevel59());
  if (state.bestLevel59 > previousBest) {
    try { localStorage.setItem(BEST_LEVEL_KEY59, String(state.bestLevel59)); } catch { /* Storage is optional. */ }
  }
  syncRunProgress59();
  const badge = $('#run-level');
  if (badge.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    badge.animate([{ color:'#fff6cf', textShadow:'0 0 16px #ffd08c' }, { color:'#ebc98e', textShadow:'none' }], { duration:700 });
  }
}

// Always copy the source card. The canonical catalog and its cached data never
// acquire a finish; a card's finish is decided only once in the current run.
function runCard59(card) {
  return { ...card, finishRun59:state.finishRun59, foil59:Math.random() < FOIL_CHANCE59 };
}
function currentRunCard59(card) {
  return card.finishRun59 === state.finishRun59 ? card : runCard59(card);
}
function isFoilCard59(card) {
  return Boolean(card?.foil59 && card.finishRun59 === state.finishRun59);
}
function copyPhysicalFinish59(copied, physical) {
  copied.finishRun59 = physical.finishRun59;
  copied.foil59 = Boolean(physical.foil59);
}
const baseFoilFace59 = cardFace;
cardFace = function(card) {
  const face = baseFoilFace59(card);
  return isFoilCard59(card) ? `<span class="foil-card-face" data-finish="foil" role="img" aria-label="${escapeHtml(card.name)}, foil" title="Foil · this run only">${face}</span>` : face;
};
const baseFoilDraft59 = renderDraft;
renderDraft = function() {
  // Preserve pack array identities after the first preparation: discovery and
  // opening animations use them, and re-renders must never reroll the finish.
  state.packs = state.packs.map(pack => pack.every(card => card.finishRun59 === state.finishRun59) ? pack : pack.map(currentRunCard59));
  return baseFoilDraft59();
};
const baseFoilShop59 = renderShop;
renderShop = function() {
  for (const offer of state.shop?.offers || []) offer.card = currentRunCard59(offer.card);
  return baseFoilShop59();
};
const baseFoilMana59 = generateStarterManaCards;
generateStarterManaCards = function(count) { return baseFoilMana59(count).map(currentRunCard59); };

function ensureEndlessStages59(node) {
  while (state.stageLocations.length < node) state.stageLocations.push(...chooseRunStages56());
}
function scaleEndlessWaves59(waves, node) {
  const depth = Math.max(1, node - ENCOUNTERS.length);
  for (const enemy of waves.flat()) {
    enemy.health = enemy.maxHealth = Math.ceil(enemy.maxHealth * (1 + depth * .16));
    enemy.power += Math.ceil(depth / 2);
    enemy.bounty += Math.floor(depth / 2);
  }
}
function renderRunEnd59(won) {
  state.endlessReady59 = Boolean(won && !state.endless && state.node >= ENCOUNTERS.length && state.playerHealth > 0);
  $('#endless-invitation').hidden = !state.endlessReady59;
  const progress = state.endless ? `ENDLESS <b>${state.node - ENCOUNTERS.length}</b>` : `RUN <b>${state.node} / ${ENCOUNTERS.length}</b>`;
  $('#run-summary').innerHTML = `<span>${progress}</span><span>LEVEL <b>${state.level}</b></span><span>DECK <b>${state.deck.length}</b></span><span>LIFE <b>${Math.max(0,state.playerHealth)}</b></span>`;
  if (state.endless && !won) {
    $('#end-eyebrow').textContent = 'ENDLESS RUN OVER';
    $('#end-message').textContent = `Your expedition reached endless fight ${state.node - ENCOUNTERS.length} and level ${state.level}.${state.playerHealth > 0 ? ' You tried to draw from an empty library.' : ''} Your highest level is saved.`;
  }
}
function continueEndless59() {
  if (state.screen !== 'end-screen' || !state.endlessReady59 || state.endless || state.battle?.phase !== 'complete' || state.playerHealth <= 0) return false;
  state.endlessReady59 = false;
  state.endless = true;
  $('#endless-invitation').hidden = true;
  offerEncounterReward59();
  return true;
}
$('#endless-button').addEventListener('click', continueEndless59);

const baseProgressScreen59 = showScreen;
showScreen = function(id) { const value=baseProgressScreen59(id); syncRunProgress59(); return value; };
window.addEventListener('storage', event => {
  if (event.key === BEST_LEVEL_KEY59) { state.bestLevel59=Math.max(state.bestLevel59,readBestLevel59()); syncRunProgress59(); }
});
syncRunProgress59();
