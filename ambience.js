/* Background score stays separate from short effects and honours the master switch. */
(() => {
  const audio = new Audio('assets/audio/bards-tale.mp3');
  audio.id = 'background-music';
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;
  document.body.append(audio);
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const stored = Number(read('bt-music-volume', '35'));
  let volume = Number.isFinite(stored) ? Math.max(0, Math.min(100, stored)) : 35;
  let enabled = read('bt-music-enabled', 'true') !== 'false';
  let unlocked = false, fade = 0, generation = 0, failed = false;
  const dialog = document.getElementById('music-dialog');
  const slider = document.getElementById('music-volume');
  const toggle = document.getElementById('music-toggle');
  const wanted = () => unlocked && enabled && volume > 0 && state.soundOn && !document.hidden;
  function render() {
    slider.value = volume;
    document.getElementById('music-volume-value').value = `${volume}%`;
    toggle.textContent = enabled ? 'Music on' : 'Music off';
    toggle.setAttribute('aria-pressed', String(enabled));
    document.getElementById('music-status').textContent = !state.soundOn ? 'All audio is muted by SOUND OFF.' : !enabled || !volume ? 'Background music is muted.' : failed ? 'Music could not start. Click Music on to try again.' : !unlocked ? 'Music begins after your first click or key press.' : 'The Bard’s Tale · Medieval chiptune';
  }
  function stop() {
    generation++;
    cancelAnimationFrame(fade);
    audio.pause();
    audio.volume = 0;
  }
  function fadeTo(target) {
    cancelAnimationFrame(fade);
    const from = audio.volume, start = performance.now();
    const frame = now => {
      if (!wanted()) { stop(); return; }
      const t = Math.min(1, (now - start) / 1400);
      audio.volume = from + (target - from) * t;
      if (t < 1) fade = requestAnimationFrame(frame);
    };
    fade = requestAnimationFrame(frame);
  }
  function sync() {
    render();
    if (!wanted()) { stop(); return; }
    const token = ++generation;
    // Call play synchronously inside the user gesture; guard its asynchronous result.
    audio.play().then(() => {
      if (token !== generation) return;
      if (!wanted()) { stop(); return; }
      failed = false;
      fadeTo(volume / 100 * .65);
      render();
    }).catch(() => {
      if (token !== generation) return;
      failed = true;
      render();
    });
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(100, Math.round(value)));
    save('bt-music-volume', volume);
    sync();
  }
  function unlock(event) {
    if (!event.isTrusted || (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey))) return;
    if (unlocked && !failed) return;
    unlocked = true;
    sync();
  }
  document.addEventListener('pointerdown', unlock, {passive:true});
  document.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('ambience-paused', document.hidden);
    sync();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  document.getElementById('music-settings').addEventListener('click', () => { render(); dialog.showModal(); });
  document.getElementById('music-close').addEventListener('click', () => dialog.close());
  toggle.addEventListener('click', () => { enabled = !enabled; failed = false; save('bt-music-enabled', enabled); sync(); });
  slider.addEventListener('input', () => setVolume(Number(slider.value)));
  document.getElementById('music-quieter').addEventListener('click', () => setVolume(volume - 5));
  document.getElementById('music-louder').addEventListener('click', () => setVolume(volume + 5));
  document.getElementById('sound-toggle').addEventListener('click', sync);
  const stopEffects = soundEngine.stop.bind(soundEngine);
  soundEngine.stop = function () { stopEffects(); stop(); };
  audio.addEventListener('error', () => { failed = true; render(); });
  render();

  // Canvas artwork is decorative, never captures input, and sleeps outside the title.
  const stage = document.querySelector('#start-screen .title-stage');
  const canvas = document.getElementById('title-vortex');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const back = new Image();
  back.src = 'assets/mtg-card-back.jpg';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const startScreen = document.getElementById('start-screen');
  let frame = 0, elapsed = 0, previous = 0, lastDraw = 0;
  let pointerX = 0, pointerY = 0;
  const width = 1544, height = 580;
  canvas.width = width; canvas.height = height;
  function paint(time) {
    const intro = motion.matches ? 1 : Math.min(1, time / 1.8);
    const reveal = 1 - Math.pow(1 - intro, 3);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    // Keep the action column clear even at the outer edge of the storm.
    ctx.beginPath();ctx.rect(750, 0, width - 750, height);ctx.clip();
    const cx = 1130 + pointerX * 12, cy = 264 + pointerY * 9;
    const glow = ctx.createRadialGradient(cx,cy,4,cx,cy,350);
    glow.addColorStop(0,'#fff1b044');glow.addColorStop(.17,'#e0b36a33');glow.addColorStop(.56,'#4da7b020');glow.addColorStop(1,'#19404800');
    ctx.fillStyle=glow;ctx.fillRect(750,0,794,height);
    ctx.globalAlpha = reveal;
    // Luminous spiral threads flow behind the physical cards.
    for(let arm=0;arm<3;arm++) {
      ctx.beginPath();
      for(let i=0;i<=180;i++) {
        const a=i/180*Math.PI*5 + arm*Math.PI*2/3 + time*.12;
        const r=18+i/180*365;
        const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*.64;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=arm===1?'#7fd9e72b':'#f5c47825';ctx.lineWidth=1.2;ctx.stroke();
    }
    const cards=[];
    for(let i=0;i<60;i++) {
      // Each card travels continuously down the same spiral into the eye.
      const p=((i/60-time*.025)%1+1)%1;
      const angle=p*Math.PI*6 + time*.08 + Math.sin(i*7.13)*.08;
      const r=28+Math.pow(p,.85)*335 + Math.sin(i*3.7)*10;
      const x=cx+Math.cos(angle)*r, y=cy+Math.sin(angle)*r*.60;
      const size=(19+Math.pow(p,1.8)*70)*(.85+.3*(Math.sin(i*5.3)*.5+.5));
      cards.push({x,y,size,angle:angle+Math.sin(i*3.19)*.75,p});
    }
    cards.sort((a,b)=>a.size-b.size);
    if(back.complete && back.naturalWidth) for(const c of cards) {
      ctx.save();
      ctx.translate(cx+(c.x-cx)*(.6+.4*reveal),cy+(c.y-cy)*(.6+.4*reveal));
      ctx.rotate(c.angle+Math.PI/2);
      ctx.scale(.76+.24*Math.cos(c.angle*.6),1);
      ctx.globalAlpha=reveal*Math.min(1,c.p*10)*(.6+.4*c.p);
      ctx.shadowColor=c.p>.7?'#e6b06c66':'#6fbed544';ctx.shadowBlur=c.p>.7?12:5;
      const w=c.size,h=w*1.397;
      ctx.drawImage(back,-w/2,-h/2,w,h);
      ctx.shadowBlur=0;ctx.strokeStyle='#f5cd8e44';ctx.lineWidth=.7;
      ctx.strokeRect(-w/2,-h/2,w,h);
      ctx.restore();
    }
    // Small motes reinforce the direction without a flashing light.
    for(let i=0;i<30;i++) {
      const a=i*2.399+time*.13,r=50+(i*53%340);
      ctx.globalAlpha=reveal*(.2+.3*Math.sin(i+time*.5)**2);
      ctx.fillStyle=i%3?'#edc891':'#91cddd';ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.66,i%4===0?1.6:1,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function tick(now) {
    frame=0;
    if(document.hidden || !startScreen.classList.contains('active') || motion.matches)return;
    if(previous)elapsed+=Math.min(.08,(now-previous)/1000);
    previous=now;
    if(now-lastDraw>30){paint(elapsed);lastDraw=now;}
    frame=requestAnimationFrame(tick);
  }
  function syncVortex() {
    cancelAnimationFrame(frame);frame=0;previous=0;
    if(document.hidden || !startScreen.classList.contains('active'))return;
    if(motion.matches)paint(0);else frame=requestAnimationFrame(tick);
  }
  back.addEventListener('load',syncVortex);
  new MutationObserver(syncVortex).observe(startScreen,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',syncVortex);
  motion.addEventListener('change',syncVortex);
  stage.addEventListener('pointermove',event=>{
    if(motion.matches || event.pointerType==='touch')return;
    const rect=stage.getBoundingClientRect();
    pointerX=(event.clientX-rect.left)/rect.width-.5;
    pointerY=(event.clientY-rect.top)/rect.height-.5;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
  syncVortex();
})();
