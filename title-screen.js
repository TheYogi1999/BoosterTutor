/* Title composition adapted from the user's supplied canvas example. */
(() => {
  const screen = document.getElementById('start-screen');
  const shell = document.getElementById('game-shell');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...screen.querySelectorAll('.hero-card')];
  const options = document.getElementById('title-options-dialog');
  document.getElementById('title-options').addEventListener('click', () => options.showModal());
  document.getElementById('title-options-close').addEventListener('click', () => options.close());
  for (const [button, target] of [['title-audio','music-settings'], ['title-fullscreen','fullscreen-button'], ['title-controls','controller-help-button']]) {
    document.getElementById(button).addEventListener('click', () => document.getElementById(target).click());
  }
  const exit = document.getElementById('title-exit-dialog');
  let restoreSound = false;
  document.getElementById('title-quit').addEventListener('click', () => {
    restoreSound = state.soundOn;
    if (state.soundOn) document.getElementById('sound-toggle').click();
    soundEngine.stop();
    exit.showModal();
  });
  function returnToTitle() {
    exit.close();
    if (restoreSound && !state.soundOn) document.getElementById('sound-toggle').click();
  }
  document.getElementById('title-return').addEventListener('click', returnToTitle);
  exit.addEventListener('cancel', event => { event.preventDefault(); returnToTitle(); });

  const canvas = document.getElementById('title-atmosphere');
  const ctx = canvas.getContext('2d');
  canvas.width = 1600; canvas.height = 900;
  const back = new Image(); back.src = 'assets/mtg-card-back.jpg';
  const flyers = Array.from({length:24}, (_, i) => ({
    angle: i * 2.399, distance:1.1 + (i * .137 % .6), delay:i*.045,
    duration:1.5+(i*.11%.65), spin:Math.sin(i*7.1)*6
  }));
  let frame=0, previous=0, time=0, lastPaint=0, animations=[];
  let wasActive=false, hiddenAt=0;
  function paint(t) {
    if (!ctx) return;
    if (!document.hidden && screen.classList.contains('active') && !motion.matches) {
      cards.forEach((card,i) => { if (time > 1.05 + i * .18) card.classList.add('is-revealed'); });
    }
    // Transparent intro layer over the same expedition artwork as the booster screen.
    ctx.clearRect(0,0,1600,900);
    if(!motion.matches && t<4.2 && back.complete && back.naturalWidth) {
      flyers.forEach((c,i)=>{
        const p=Math.max(0,Math.min(1,(t-c.delay)/c.duration));
        if(p<=0||p>=1)return;
        const ease=1-Math.pow(1-p,3),orbit=c.angle+(1-ease)*1.3;
        const slot=i/(flyers.length-1)-.5;
        const x=1130+slot*480+Math.cos(orbit)*1900*c.distance*(1-ease);
        const y=430+slot*slot*130+Math.sin(orbit)*1900*c.distance*(1-ease);
        ctx.save();ctx.translate(x,y);ctx.rotate(slot*.9+c.spin*(1-ease));
        ctx.scale(Math.cos(p*Math.PI*2)*.55+.6,1);
        ctx.globalAlpha=Math.min(1,p*6)*(1-Math.pow(p,3))*.65;
        ctx.drawImage(back,-44,-62,88,124);ctx.restore();
      });
    }
  }
  function tick(now) {
    frame=0;
    if(document.hidden || !screen.classList.contains('active') || motion.matches)return;
    if(previous)time+=Math.min(.08,(now-previous)/1000);
    previous=now;
    if(now-lastPaint>45){paint(time);lastPaint=now;}
    if(time<4.2)frame=requestAnimationFrame(tick);
  }
  function intro() {
    animations.forEach(animation=>animation.cancel()); animations=[];
    cards.forEach((card,i)=>{
      card.classList.remove('is-peeking');
      card.classList.toggle('is-revealed',motion.matches);
      if(motion.matches)return;
      const angle=[-17,0,17][i];
      const animation=card.animate([
        {transform:`translate(${[640,220,680][i]}px,${[-500,700,460][i]}px) rotate(${angle+220*(i%2?-1:1)}deg) scale(.5)`,opacity:0},
        {opacity:1,offset:.3},
        {transform:`translate(0,0) rotate(${angle}deg) scale(1)`,opacity:1}
      ],{duration:1900,delay:i*180,easing:'cubic-bezier(.16,.75,.25,1)',fill:'backwards'});
      animations.push(animation);
    });
  }
  function sync() {
    const active=screen.classList.contains('active');
    shell.classList.toggle('title-menu-active',active);
    cancelAnimationFrame(frame);frame=0;previous=0;
    if(!active) {animations.forEach(a=>a.cancel());wasActive=false;return;}
    if(document.hidden) {hiddenAt=performance.now();animations.forEach(a=>a.pause());return;}
    if(!wasActive) {time=0;intro();wasActive=true;}
    else if(hiddenAt) {animations.forEach(a=>{if(a.playState==='paused')a.play();});hiddenAt=0;}
    if(motion.matches){cards.forEach(c=>c.classList.add('is-revealed'));paint(0);}
    else frame=requestAnimationFrame(tick);
  }
  cards.forEach(card=>{
    card.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!motion.matches&&time>2.5)card.classList.add('is-peeking');});
    card.addEventListener('pointerleave',()=>card.classList.remove('is-peeking'));
  });
  new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',()=>{wasActive=false;sync();});
  back.addEventListener('load',()=>{if(motion.matches)paint(0);});
  sync();
})();
