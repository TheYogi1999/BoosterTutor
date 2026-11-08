/* Title composition adapted from the user's supplied canvas example. */
(() => {
  const screen = document.getElementById('start-screen');
  const shell = document.getElementById('game-shell');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...screen.querySelectorAll('.hero-card')];
  const options = document.getElementById('title-options-dialog');
  for (const id of ['title-options','options-button']) document.getElementById(id).addEventListener('click', () => options.showModal());
  document.getElementById('title-options-close').addEventListener('click', () => options.close());
  for (const [button, target] of [['title-audio','music-settings']]) {
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
  const center = {x:1155,y:438};
  const noise = n => {const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const flyers = Array.from({length:30}, (_,i) => ({
    angle:i*2.39996,delay:noise(i+8)*.48,duration:1.65+noise(i+20)*.65,
    size:48+noise(i+31)*38,spin:noise(i+72)*2-1
  }));
  const motes = Array.from({length:58}, (_,i) => ({
    x:680+noise(i+100)*880,y:noise(i+200)*900,speed:8+noise(i+300)*15,
    phase:noise(i+400)*Math.PI*2,size:.6+noise(i+500)*1.5
  }));
  const spark = document.createElement('canvas');spark.width=40;spark.height=40;
  const sparkContext=spark.getContext('2d');
  if(sparkContext){const glow=sparkContext.createRadialGradient(20,20,0,20,20,20);glow.addColorStop(0,'#fff2c4');glow.addColorStop(.12,'#fbd28cbb');glow.addColorStop(.4,'#e7a34e33');glow.addColorStop(1,'#e7a34e00');sparkContext.fillStyle=glow;sparkContext.fillRect(0,0,40,40);}
  let frame=0, previous=0, time=0, lastPaint=0, animations=[];
  let wasActive=false, hiddenAt=0;
  const revealAt=[1.42,1.14,1.68];
  const tutorPrints=[
    {edition:'unh/51',image:'assets/cards/c3a5b25e-c5af-417e-8675-162ab18ac2b1.jpg'},
    {edition:'und/33',image:'assets/cards/0a5718db-e67d-468a-95ba-11a08fcf9fea.jpg'},
    {edition:'pal04/11',image:'assets/cards/cae082e5-f757-4e7e-9d8c-7d916adf3308.jpg'}
  ];
  function phase(value){if(screen.dataset.titlePhase!==value)screen.dataset.titlePhase=value;}
  function paint(t) {
    const still=motion.matches;
    if(!document.hidden&&screen.classList.contains('active')&&!still){
      cards.forEach((card,i)=>{if(t>=revealAt[i])card.classList.add('is-revealed');});
      phase(t<1.14?'opening':t<3.25?'revealing':'ready');
    }
    if(!ctx)return;
    const burst=still?0:Math.exp(-Math.pow((t-1.35)/.42,2));
    const arrive=still?1:Math.min(1,t/.65);
    ctx.clearRect(0,0,1600,900);
    ctx.save();ctx.globalCompositeOperation='screen';
    // All light originates behind the cards, in the same logical 16:9 coordinates.
    const aura=ctx.createRadialGradient(center.x,center.y,20,center.x,center.y,530);
    aura.addColorStop(0,`rgba(255,215,144,${(.08+burst*.4)*arrive})`);
    aura.addColorStop(.4,`rgba(211,141,66,${(.055+burst*.22)*arrive})`);
    aura.addColorStop(1,'rgba(170,111,50,0)');
    ctx.fillStyle=aura;ctx.fillRect(580,0,1020,900);
    // Fine orbital arcs and a few etched diamonds frame the fan without covering it.
    for(let ring=0;ring<3;ring++){
      ctx.save();ctx.translate(center.x,center.y);ctx.rotate(-.25+ring*.38);
      ctx.scale(1,.72+ring*.035);
      ctx.strokeStyle=`rgba(225,183,112,${(.12+burst*.23)*arrive/(1+ring*.3)})`;
      ctx.lineWidth=ring===1?.8:1.3;
      const radius=282+ring*60;
      const rotation=still?0:t*(ring%2?-.09:.065);
      for(let arc=0;arc<3;arc++){
        ctx.beginPath();const start=rotation+arc*Math.PI*2/3+ring*.5;
        ctx.arc(0,0,radius,start,start+1.32);ctx.stroke();
      }
      if(ring===1)for(let mark=0;mark<12;mark++){
        const angle=mark*Math.PI/6+rotation;
        ctx.save();ctx.translate(Math.cos(angle)*radius,Math.sin(angle)*radius);ctx.rotate(angle+Math.PI/4);
        ctx.strokeRect(-2.5,-2.5,5,5);ctx.restore();
      }
      ctx.restore();
    }
    // One soft expanding wave, followed by a quiet field of warm embers.
    if(!still&&t>.85&&t<2.6){
      const p=(t-.85)/1.75;
      ctx.save();ctx.translate(center.x,center.y);ctx.scale(1,.76);
      ctx.strokeStyle=`rgba(255,217,154,${Math.sin(p*Math.PI)*.28})`;ctx.lineWidth=2*(1-p)+.4;
      ctx.beginPath();ctx.arc(0,0,85+p*450,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    for(const mote of motes){
      const y=still?mote.y:(mote.y-t*mote.speed+1800)%900;
      const x=mote.x+(still?0:Math.sin(t*.25+mote.phase)*16);
      const alpha=(.15+(still?.2:(Math.sin(t*.7+mote.phase)+1)*.15))*arrive;
      ctx.globalAlpha=alpha;const size=mote.size*10;
      ctx.drawImage(spark,x-size/2,y-size/2,size,size);
    }
    ctx.globalAlpha=1;
    if(burst>.02){
      ctx.save();ctx.translate(center.x,center.y);ctx.rotate(-.25);
      const rays=ctx.createRadialGradient(0,0,90,0,0,520);rays.addColorStop(0,'#ffe8b100');rays.addColorStop(.4,`rgba(255,208,122,${burst*.12})`);rays.addColorStop(1,'#e9ab5300');ctx.fillStyle=rays;
      for(let ray=0;ray<8;ray++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(70,-2);ctx.lineTo(520,-16);ctx.lineTo(520,16);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    if(!still&&t<3&&back.complete&&back.naturalWidth){
      ctx.globalCompositeOperation='source-over';
      for(const flyer of flyers){
        const p=(t-flyer.delay)/flyer.duration;if(p<=0||p>=1)continue;
        const radius=70+Math.pow(1-p,1.65)*1450;
        const angle=flyer.angle+p*Math.PI*1.45;
        const x=center.x+Math.cos(angle)*radius;
        const y=center.y+Math.sin(angle)*radius*.67;
        const leftFade=Math.max(0,Math.min(1,(x-640)/200));
        const fade=Math.min(1,p*7)*Math.pow(1-p,.7)*leftFade*.78;
        if(fade<=0)continue;
        // Short luminous trails follow each actual MTG card back.
        ctx.save();ctx.globalAlpha=fade*.55;ctx.strokeStyle='#e6b875';ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(x,y);
        ctx.lineTo(x+Math.sin(angle)*42*(1-p),y-Math.cos(angle)*28*(1-p));ctx.stroke();ctx.restore();
        ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2+flyer.spin*(1-p));
        const flip=.22+Math.abs(Math.cos(p*Math.PI*2+flyer.angle))*.78;
        ctx.scale(flip,1);ctx.globalAlpha=fade;
        const width=flyer.size*(.65+.35*(1-p));
        ctx.drawImage(back,-width/2,-width*.697,width,width*1.394);ctx.restore();
      }
    }
    ctx.restore();
  }
  function tick(now) {
    frame=0;
    if(document.hidden||!screen.classList.contains('active')||motion.matches)return;
    if(previous)time+=Math.min(.08,(now-previous)/1000);
    previous=now;
    if(now-lastPaint>(time<3.4?32:60)){paint(time);lastPaint=now;}
    if(ctx||time<3.4)frame=requestAnimationFrame(tick);
  }
  function animate(element,keyframes,options){
    if(!element)return;
    animations.push(element.animate(keyframes,{fill:'backwards',...options}));
  }
  function intro() {
    animations.forEach(animation=>animation.cancel());animations=[];
    phase(motion.matches?'ready':'opening');
    const prints=shuffle(tutorPrints);
    cards.forEach((card,i)=>{card.dataset.titlePrint=prints[i].edition;card.querySelector('.hero-card-face img').src=prints[i].image;});
    cards.forEach((card,i)=>{
      card.classList.remove('is-peeking');card.classList.toggle('is-revealed',motion.matches);
      if(motion.matches)return;
      const angle=[-17,0,17][i],x=[225,17,-181][i],y=[-42,40,-42][i];
      animate(card,[
        {transform:`translate(${x}px,${y}px) rotate(${angle+65}deg) rotateY(36deg) scale(.22)`,opacity:0},
        {transform:`translate(${x*.8}px,${y*.8}px) rotate(${angle+28}deg) rotateY(-12deg) scale(.58)`,opacity:.9,offset:.3},
        {transform:`translate(${-12+i*12}px,-18px) rotate(${angle-3+i*3}deg) rotateY(0deg) scale(1.035)`,opacity:1,offset:.78},
        {transform:`translate(0,0) rotate(${angle}deg) rotateY(0deg) scale(1)`,opacity:1}
      ],{duration:2050,delay:[380,220,550][i],easing:'cubic-bezier(.2,.7,.22,1)'});
      animate(card.querySelector('.title-reveal-shine'),[
        {transform:'translateX(-140%) skewX(-18deg)',opacity:0},
        {opacity:.75,offset:.35},
        {transform:'translateX(180%) skewX(-18deg)',opacity:0}
      ],{duration:1200,delay:revealAt[i]*1000+280,easing:'ease-in-out'});
    });
    if(motion.matches)return;
    animate(screen.querySelector('#game-title'),[
      {opacity:.15,transform:'translateY(24px)',filter:'blur(6px)'},
      {opacity:1,transform:'translateY(0)',filter:'blur(0)'}
    ],{duration:1400,delay:160,easing:'cubic-bezier(.16,.8,.25,1)'});
    animate(screen.querySelector('.title-copy .eyebrow'),[{opacity:0,letterSpacing:'9px'},{opacity:1,letterSpacing:'5px'}],{duration:1500,delay:250,easing:'ease-out'});
    screen.querySelectorAll('.title-menu button').forEach((button,i)=>animate(button,[
      {opacity:.35,transform:'translateX(-12px)'},{opacity:1,transform:'translateX(0)'}
    ],{duration:800,delay:550+i*100,easing:'ease-out'}));
  }
  function sync() {
    const active=screen.classList.contains('active');
    shell.classList.toggle('title-menu-active',active);
    cancelAnimationFrame(frame);frame=0;previous=0;
    if(!active){animations.forEach(a=>a.cancel());wasActive=false;hiddenAt=0;ctx?.clearRect(0,0,1600,900);return;}
    if(document.hidden){hiddenAt=performance.now();animations.forEach(a=>{if(a.playState==='running')a.pause();});return;}
    if(!wasActive){time=0;lastPaint=0;intro();wasActive=true;}
    else if(hiddenAt){animations.forEach(a=>{if(a.playState==='paused')a.play();});hiddenAt=0;}
    if(motion.matches){cards.forEach(c=>c.classList.add('is-revealed'));phase('ready');paint(0);}
    else frame=requestAnimationFrame(tick);
  }
  cards.forEach(card=>{
    card.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!motion.matches&&time>3.1)card.classList.add('is-peeking');});
    card.addEventListener('pointerleave',()=>card.classList.remove('is-peeking'));
  });
  new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('booster:title-intro-start',()=>{if(screen.classList.contains('active')){wasActive=false;sync();}});
  motion.addEventListener('change',()=>{wasActive=false;sync();});
  back.addEventListener('load',()=>{if(motion.matches)paint(0);});
  sync();
})();
