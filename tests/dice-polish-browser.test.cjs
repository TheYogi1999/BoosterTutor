const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, ignoreHTTPSErrors: true, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.BOOSTERTUTOR_URL || 'http://127.0.0.1:8000/');
    await page.evaluate(() => {
      state.soundOn = false;
      state.pool = playableCards(BUNDLED_CARDS);
      state.landPool = FALLBACK_LANDS;
      state.campTokens = [];
      state.deck = Array(40).fill(BUNDLED_CARDS.find(card => card.name === 'Grizzly Bears'));
      beginBattle(1);
      state.battle.hand = [BUNDLED_CARDS.find(card => card.name === 'Jack-in-the-Mox')];
      rollD6Value50 = () => 6;
      renderBattle();
    });
    assert.equal(await page.locator('#phase-strip [data-phase="main"]').textContent(), '1Main phase + declare attackers');
    assert.equal(await page.locator('#global-phase').innerText(), 'MAIN PHASE + DECLARE ATTACKERS');
    await page.locator('[data-hand-index="0"]').click();
    const life = await page.evaluate(() => state.playerHealth);
    const mana = await page.evaluate(() => state.battle.floatingMana);
    const mox = page.locator('.permanent-card');
    await mox.click();
    assert.equal(await page.locator('#dice-roll-dialog').evaluate(el => el.open), true);
    assert.equal(await mox.evaluate(el => el.classList.contains('permanent-tapped')), true);
    assert.equal(await page.evaluate(() => state.battle.diceHistory?.length || 0), 0);

    // Sample the actual browser animation transforms at 60 Hz. Forward momentum
    // must not stop/reverse at a bounce; the floor shadow follows the same path.
    const motion = await page.evaluate(() => {
      const flight = document.querySelector('.die-flight');
      const hop = document.querySelector('.die-hop');
      const shadow = document.querySelector('.die-shadow');
      const cube = document.querySelector('.die-cube');
      const animations = [flight, hop, shadow, cube].flatMap(el => el.getAnimations());
      animations.forEach(animation => animation.pause());
      const matrix = el => new DOMMatrix(getComputedStyle(el).transform);
      const frames = [];
      for (let t = 0; t < 1800; t += 1000 / 60) {
        animations.forEach(animation => { animation.currentTime = t; });
        frames.push({ x: matrix(flight).m41, y: matrix(hop).m42, shadow: matrix(shadow).m41 });
      }
      animations.forEach(animation => { animation.currentTime = 1799.9; });
      const end = [...matrix(cube).toFloat64Array()];
      animations.forEach(animation => { animation.currentTime = 0; animation.play(); });
      return { frames, end };
    });
    const steps = motion.frames.slice(1).map((frame, i) => frame.x - motion.frames[i].x);
    assert.ok(steps.every(step => step > 0), 'horizontal motion keeps advancing through every bounce');
    assert.ok(steps.slice(1).every((step, i) => Math.abs(step - steps[i]) < 6), 'no abrupt horizontal speed changes');
    assert.ok(motion.frames.every(frame => Math.abs(frame.x - frame.shadow) < .1), 'shadow tracks forward momentum');
    assert.ok(motion.frames.some(frame => frame.y > 5) && motion.frames.some(frame => frame.y < -30), 'die falls and rebounds');
    assert.equal(await page.evaluate(() => settleDiceRoll50()), false, 'cannot apply an airborne die');
    await page.waitForFunction(() => state.battle.diceRoll?.ready);
    const landed = await page.locator('.die-cube').evaluate(el => [...new DOMMatrix(getComputedStyle(el).transform).toFloat64Array()]);
    assert.ok(landed.every((value, i) => Math.abs(value - motion.end[i]) < .002), 'rotation reaches its final pose without snapping');
    await page.locator('#dice-continue').click();
    assert.equal(await page.evaluate(() => state.battle.floatingMana), mana + 1);
    assert.equal(await page.evaluate(() => state.playerHealth), life);
    await mox.click();
    assert.equal(await page.locator('#dice-roll-dialog').evaluate(el => el.open), false, 'tapped Mox cannot roll twice');
    assert.equal(await page.locator('#inspector-content [data-activate-permanent]').isDisabled(), true);

    // The direct card action also works with controller confirmation after untap.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
      beginNextPlayerTurn45();
      rollD6Value50 = () => 1;
      controller.enable();
      controller.focus(document.querySelector('.permanent-card'));
      controller.activate();
    });
    assert.equal(await page.evaluate(() => state.battle.diceRoll?.ready), true);
    await page.locator('#dice-continue').click();
    assert.equal(await mox.count(), 0);
    assert.equal(await page.evaluate(() => state.playerHealth), life - 5);
    assert.equal(await page.evaluate(() => state.battle.graveyard.at(-1).name), 'Jack-in-the-Mox');

    for (const viewport of [{ width: 1600, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(viewport);
      await page.waitForFunction(() => Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--game-scale')) - Math.min(innerWidth / 1600, innerHeight / 900)) < .0001);
      const rows = await page.locator('.combat-topline,.phase-strip,.arrow-legend,#quit-button').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()));
      const strip = rows[1], legend = rows[2];
      assert.ok(strip.right <= legend.left + 1, 'expanded phase label stays clear of the arrows legend');
      for (const rect of rows) assert.ok(rect.left >= -1 && rect.right <= viewport.width + 1, 'top controls stay onscreen');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1), false);
    }
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.screenshot({ path: 'work/dice-polish54.png' });
    assert.deepEqual(errors, []);
    console.log('PASS smooth continuous throw/shadow, no landing rotation snap, direct Mox click, tap guard, mana/life/sacrifice outcomes, controller activation, renamed phase and four fitted layouts.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
