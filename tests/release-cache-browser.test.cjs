// Self-contained HTTP-cache regression: an iPad-sized browser must not reuse
// versionless JavaScript/CSS from the old scrolling release after an upgrade.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, devices } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const version = html.match(/\bv(\d+\.\d+)\s*·/)[1];
  const sources = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)].map(match => match[1]);
  assert.ok(sources.length > 0);
  for (const source of sources) assert.match(new URL(source, 'http://localhost').searchParams.get('v') || '', /^\d+\.\d+(?:\.\d+)?$/, `${source} must have a cache version`);
  assert.ok(sources.includes(`game.js?v=${version}`), 'changed game code matches the displayed release');
  assert.ok(sources.includes(`waves.js?v=${version}`), 'wave code matches the displayed release');

  let upgraded = false;
  const requests = [];
  // This fixture represents the previous release's scrollable mobile canvas.
  const legacyFit = `function fitGameCanvas() {
    document.documentElement.style.setProperty('--game-scale', 1);
    document.documentElement.classList.add('responsive-game');
  }`;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    requests.push(req.url);
    let data = fs.readFileSync(file);
    if (name === 'index.html' && !upgraded) data = Buffer.from(html.replace(/\?v=[^\"]+/g, '').replace(`v${version}`, 'v0.16'));
    if (name === 'game.js' && !upgraded) data = Buffer.from(data.toString().replace(/function fitGameCanvas\(\) \{[\s\S]*?\n\}/, legacyFit));
    res.setHeader('Cache-Control', name === 'index.html' ? 'no-store' : 'public, max-age=3600');
    const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
    res.setHeader('Content-Type', types[path.extname(name)] || 'application/octet-stream');
    res.end(data);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    // Do not use page.route here: Playwright routing disables the HTTP cache.
    const page = await browser.newPage({...devices['iPad (gen 7)'], viewport:{width:820,height:1180}, reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(() => {
      state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;
      state.deck=[...BUNDLED_CARDS,...generateStarterManaCards(4)];beginBattle(1);
    });
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight > innerHeight), 'fixture reproduces the old scrolling battlefield');

    upgraded = true;
    requests.length = 0;
    await page.goto(`${base}/?v=${version}`);
    await page.evaluate(()=>{state.soundOn=false;state.pool=BUNDLED_CARDS;state.landPool=FALLBACK_LANDS;});
    await page.locator('#start-button').tap();
    for (let pack=0;pack<6;pack++) {
      await page.locator('.sealed-pack').tap();
      await page.locator('.draft-option').first().tap();
      await page.locator('#draft-confirm').tap();
    }
    await page.locator('[data-camp-token="treasure"]').tap();
    await page.waitForSelector('#combat-screen.active');
    for (const source of sources) assert.ok(requests.includes(`/${source}`), `${source} was fetched instead of reusing the old cache`);

    for (const viewport of [{width:768,height:1024},{width:820,height:1180},{width:1024,height:1366},{width:1180,height:820}]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      const layout = await page.evaluate(() => ({
        height:innerHeight,width:innerWidth,pageHeight:document.documentElement.scrollHeight,pageWidth:document.documentElement.scrollWidth,
        bounds:[...document.querySelectorAll('.arena-table,.monster,.hand-card,.mana-land,.turn-footer button')].map(el=>el.getBoundingClientRect().toJSON())
      }));
      assert.equal(layout.pageHeight,layout.height,'iPad combat page fits vertically');
      assert.equal(layout.pageWidth,layout.width,'iPad combat page fits horizontally');
      for(const r of layout.bounds) assert.ok(r.top>=-1 && r.left>=-1 && r.bottom<=layout.height+1 && r.right<=layout.width+1,JSON.stringify(r));
      await page.evaluate(()=>window.scrollTo(0,500));
      await page.mouse.wheel(0,500);
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(()=>scrollY),0,'the battlefield does not move when scrolling');
    }
    // Model Safari browser bars reducing the visible area while the layout
    // viewport retains its larger height. Bounds use the independent fixture.
    await page.setViewportSize({width:820,height:1180});
    await page.waitForTimeout(250);
    await page.evaluate(()=>{
      const viewport=window.visualViewport;
      Object.defineProperties(viewport,{
        width:{configurable:true,get:()=>820},height:{configurable:true,get:()=>1060},
        offsetTop:{configurable:true,get:()=>20},offsetLeft:{configurable:true,get:()=>0},
        scale:{configurable:true,get:()=>0.9999999}
      });
      viewport.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(100);
    const visibleBounds=await page.locator('.game-shell').boundingBox();
    assert.ok(visibleBounds.y>=19 && visibleBounds.y+visibleBounds.height<=1081,'canvas stays inside Safari visible viewport, including browser bar offset');
    await page.evaluate(()=>{
      for(const key of ['width','height','offsetTop','offsetLeft','scale']) delete visualViewport[key];
      state.node=1;state.battle.waves=[[]];state.battle.waveIndex=0;state.battle.enemyCreatures=[];winBattle();
    });
    await page.setViewportSize({width:390,height:844});
    await page.locator('.sealed-pack').tap();
    await page.evaluate(()=>scrollTo(0,500));
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).position),'fixed','draft keeps the same fixed scene frame');
    assert.equal(await page.evaluate(()=>scrollY),0,'draft remains fitted without page scrolling');
    assert.deepEqual(errors,[]);
    console.log('Passed: real browser cache upgrade, fresh versioned assets, full six-pack touch flow, four iPad viewports, visible browser area, no combat scrolling, and fitted booster screens.');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exit(1)});
