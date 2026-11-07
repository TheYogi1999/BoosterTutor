// Run against a local static server; no external card API is required.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function assertVisibleBoard(page) {
  const result = await page.evaluate(() => {
    const bounds = [...document.querySelectorAll('.topbar,.combat-topline,.arena-table,.player-panel,.enemy-panel,.monster,.creature-token,.unit-controls,.hand-panel,.hand-card,.library-pile,.turn-footer button,.mana-land,.permanent-row .permanent-card')]
      .filter(el => el.getClientRects().length).map(el => {
        const r = el.getBoundingClientRect();
        return { name: el.className, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
    const footer = document.querySelector('.turn-footer').getBoundingClientRect();
    const permanentHeader = document.querySelector('#permanent-row').previousElementSibling.getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, bounds,
      handClear: [...document.querySelectorAll('.hand-card')].every(el => el.getBoundingClientRect().bottom <= footer.top + 1),
      controlsClear: [...document.querySelectorAll('.unit-controls')].every(el => el.getBoundingClientRect().bottom <= permanentHeader.top + 1),
      rows: [...document.querySelectorAll('.hand-row,.creature-row,.monster-rank,.mana-land-row,.permanent-row')].map(el => ({name:el.className, width:el.clientWidth, scroll:el.scrollWidth})) };
  });
  for (const r of result.bounds) assert.ok(r.left >= -1 && r.top >= -1 && r.right <= result.width + 1 && r.bottom <= result.height + 1, JSON.stringify(r));
  assert.equal(result.scrollWidth, result.width, 'document does not scroll horizontally');
  assert.equal(result.scrollHeight, result.height, 'document does not scroll vertically');
  for (const r of result.rows) assert.ok(r.scroll <= r.width + 1, `all cards fit in ${JSON.stringify(r)}`);
  assert.ok(result.handClear, 'hand stays above the action buttons');
  assert.ok(result.controlsClear, 'creature actions stay above the permanent row');
}

(async () => {
  fs.mkdirSync('work', {recursive:true});
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true, reducedMotion:'reduce' });
    const errors=[];page.on('pageerror', error=>errors.push(error.message));
    await page.route('https://api.scryfall.com/**', route=>route.abort());
    await page.goto(process.env.BOOSTERTUTOR_URL || 'http://127.0.0.1:8000/');
    // Draft includes noncreatures, several keywords, no keywords and printed */* stats.
    await page.evaluate(() => {
      state.soundOn=false;state.pool=BUNDLED_CARDS;state.packs=makeStarterPacks();state.draftKind='starter';state.activePack=0;state.boosterSealed=true;
      state.packs[0]=['Grizzly Bears','Vampire Nighthawk','Lightning Bolt','Bonesplitter','Holy Strength','Divination','Savannah Lions'].map(name=>BUNDLED_CARDS.find(card=>card.name===name));
      state.packs[0][6]={...state.packs[0][6],name:'<Test & card>',power:'*',toughness:'1+*',keywords:['Flying','Vigilance']};
      renderDraft();showScreen('draft-screen');
    });
    await page.locator('.sealed-pack').tap();
    assert.equal(await page.locator('.draft-card-summary').count(),7);
    assert.match(await page.locator('.draft-option').nth(0).innerText(),/Creature — Bear[\s\S]*P\/T 2\/2[\s\S]*Keywords: None/);
    assert.match(await page.locator('.draft-option').nth(1).innerText(),/deathtouch, flying, lifelink/);
    assert.match(await page.locator('.draft-option').nth(2).innerText(),/Instant[\s\S]*P\/T —[\s\S]*Deal 3 damage/);
    assert.match(await page.locator('.draft-option').nth(6).innerText(),/<Test & card>[\s\S]*P\/T \*\/1\+\*/);
    await page.locator('.draft-option').first().tap();
    assert.equal(await page.locator('.draft-option').first().getAttribute('aria-pressed'),'true');
    await page.locator('#pack-reroll').tap();
    assert.equal(await page.locator('.draft-card-summary').count(),7);
    assert.equal(await page.locator('.draft-option.selected').count(),0);
    await page.screenshot({path:'work/mobile-booster.png',fullPage:true});
    await page.setViewportSize({width:1600,height:900});
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(()=>{
      const footer=document.querySelector('.draft-footer').getBoundingClientRect();
      const grid=document.querySelector('.draft-grid').getBoundingClientRect();
      return grid.bottom <= footer.top && [...document.querySelectorAll('.draft-card-summary')].every(el=>el.getBoundingClientRect().bottom <= grid.bottom);
    }), 'desktop booster facts stay above the confirmation controls');


    for (const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[1024,1366],[844,390],[667,375],[1280,720],[1600,900]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(() => {
        state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;state.deck=Array.from({length:50},(_,i)=>BUNDLED_CARDS[i%BUNDLED_CARDS.length]);state.deck.push(...generateStarterManaCards(4));state.relic='crystal';beginBattle(3);state.battle.enemyCreatures.push({...state.battle.enemyCreatures[0],id:'extra-layout-foe'});
        state.battle.floatingMana=40;
        state.battle.hand=['Grizzly Bears','Savannah Lions','Llanowar Elves','Fountain of Renewal','Bonesplitter'].map(name=>BUNDLED_CARDS.find(c=>c.name===name));
        for(let i=0;i<5;i++)playCard(0,'player');
        state.battle.hand=Array.from({length:15},(_,i)=>BUNDLED_CARDS[i%BUNDLED_CARDS.length]);
        renderBattle();
      });
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.creature-token').count(),3);
      assert.equal(await page.locator('.monster').count(),4);
      try { await assertVisibleBoard(page); } catch (error) { await page.screenshot({path:'work/layout-failure.png'});console.log(await page.locator('.unit-controls,#permanent-row').evaluateAll(els=>els.map(e=>({name:e.className,r:e.getBoundingClientRect().toJSON()}))));error.message=`${width}×${height}: ${error.message}`; throw error; }
      for (const phase of ['attack','enemy','blocks','damage']) {
        await page.evaluate(phase=>{state.battle.phase=phase;state.battle.turn=2;state.battle.enemyCreatures.forEach(e=>{e.pattern=['attack'];e.summonedTurn=0});renderBattle()},phase);
        await page.waitForTimeout(50);
        await assertVisibleBoard(page);
      }
      if(width===390) await page.screenshot({path:'work/mobile-battlefield.png'});
    }
    // Resize an existing battle, including all 15 hand cards, without rebuilding it.
    for (const viewport of [{width:390,height:844},{width:844,height:390},{width:390,height:700}]) {
      await page.setViewportSize(viewport);await page.waitForTimeout(250);await assertVisibleBoard(page);
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{state.battle.phase='blocks';renderBattle()});
    await page.locator('.monster').first().tap();
    await page.locator('.creature-token').first().tap();
    assert.equal(await page.evaluate(()=>[...state.battle.blockAssignments.values()].flat().length),1,'touch assigns a blocker');
    await page.locator('#clear-blocks').tap();
    assert.equal(await page.evaluate(()=>state.battle.blockAssignments.size),0);
    await page.locator('#auto-block').tap();
    assert.ok(await page.evaluate(()=>state.battle.blockAssignments.size)>0);
    await page.evaluate(()=>{state.battle.phase='main';state.battle.floatingMana=10;renderBattle()});
    const fountain=page.locator('#permanent-row .permanent-card').filter({has:page.locator('img[alt="Fountain of Renewal"]')});
    await fountain.tap();
    await page.locator('#card-preview [data-activate-permanent]').tap();
    assert.equal(await page.evaluate(()=>state.battle.permanents.some(p=>p.card.name==='Fountain of Renewal')),false,'portrait preview activates a permanent');
    // Returning to drafting restores the normal mobile page layout and reward summaries.
    await page.evaluate(()=>{state.battle.phase='main';state.node=1;winBattle()});
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('responsive-game')),true);
    await page.locator('.sealed-pack').tap();
    assert.equal(await page.locator('.draft-card-summary').count(),7);
    assert.deepEqual(errors,[]);
    console.log('Passed: booster summaries, selection/reroll/rewards, 10 viewports, 5 combat phases, 15-card hands, resize/rotation, touch blocking, and no board scrolling or overlaps.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
