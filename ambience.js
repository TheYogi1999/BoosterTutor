/* Independent music and effect channels; short intro/Play cues belong to effects. */
(() => {
  const audio = new Audio('assets/audio/bards-tale.mp3');
  audio.id='background-music';audio.loop=true;audio.preload='none';audio.volume=0;
  const intro = new Audio('assets/audio/intro-previews/c-aether-awakening.mp3');
  intro.id='title-intro-audio';intro.preload='auto';
  const playSound = new Audio('assets/audio/intro-previews/b-velvet-shuffle.mp3');
  playSound.id='play-start-audio';playSound.preload='auto';
  document.body.append(audio,intro,playSound);applyEffectsVolume75();
  const title=document.getElementById('start-screen');
  const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
  const save=(key,value)=>{try{localStorage.setItem(key,String(value));}catch{}};
  const stored=Number(read('bt-music-volume','35'));
  let volume=Number.isFinite(stored)?Math.max(0,Math.min(100,stored)):35;
  let enabled=read('bt-music-enabled','true')!=='false';
  let unlocked=false,fade=0,generation=0,failed=false,sessionPaused=false;
  let introDone=false,introStarted=false,introState='pending',introVersion=0;
  let playVersion=0,holdMusicForPlay=false;
  const dialog=document.getElementById('music-dialog'),slider=document.getElementById('music-volume'),toggle=document.getElementById('music-toggle');
  const effectsWanted=()=>effectsAudible75()&&!sessionPaused&&!document.hidden;
  const wanted=()=>unlocked&&introDone&&!holdMusicForPlay&&enabled&&volume>0&&!sessionPaused&&!document.hidden;
  function render(){
    slider.value=volume;document.getElementById('music-volume-value').value=volume+'%';
    toggle.textContent=enabled?'Music on':'Music off';toggle.setAttribute('aria-pressed',String(enabled));
    toggle.setAttribute('aria-label',enabled?'Mute music':'Unmute music');
    document.getElementById('music-status').textContent=!enabled||!volume?'Background music is muted.'
      :sessionPaused?'Audio is paused.':!introDone?introState==='playing'?'Music follows the intro.':'Music starts after your first click.'
      :holdMusicForPlay?'Music follows the Play sound.':failed?'Music could not start. Toggle Music on to retry.'
      :!unlocked?'Music starts after your first click.':'The Bard’s Tale · Medieval chiptune';
  }
  function stopMusic(){generation++;cancelAnimationFrame(fade);audio.pause();audio.volume=0;}
  function pauseIntro(){if(introDone)return;introVersion++;intro.pause();introState=intro.currentTime>0?'paused':'pending';}
  function finishIntro(){introVersion++;intro.pause();introDone=true;introState='done';}
  function stopPlaySound(){playVersion++;playSound.pause();playSound.currentTime=0;holdMusicForPlay=false;}
  function stopAll(){stopMusic();pauseIntro();stopPlaySound();render();}
  function fadeTo(target){
    cancelAnimationFrame(fade);const from=audio.volume,start=performance.now();
    const frame=now=>{if(!wanted()){stopMusic();return;}const t=Math.max(0,Math.min(1,(now-start)/1400));audio.volume=Math.max(0,Math.min(1,from+(target-from)*t));if(t<1)fade=requestAnimationFrame(frame);};
    fade=requestAnimationFrame(frame);
  }
  function syncMusic(){
    render();if(!wanted()){stopMusic();return;}
    if(!audio.paused)return;
    const token=++generation;
    audio.play().then(()=>{if(token!==generation)return;if(!wanted()){stopMusic();return;}failed=false;fadeTo(volume/100*.65);render();}).catch(()=>{if(token!==generation)return;failed=true;render();});
  }
  function playIntro(fromGesture=false){
    if(introDone||!effectsWanted()||!title.classList.contains('active'))return;
    if((introState==='playing'&&!intro.paused)||(introState==='starting'&&!fromGesture))return;
    const token=++introVersion;introState='starting';applyEffectsVolume75();
    intro.play().then(()=>{
      if(token!==introVersion||!effectsWanted()){if(!effectsWanted())intro.pause();return;}
      unlocked=true;introState='playing';
      if(!introStarted){introStarted=true;document.dispatchEvent(new CustomEvent('booster:title-intro-start'));}
      render();
    }).catch(error=>{
      if(token!==introVersion)return;
      if(error.name==='NotAllowedError'){introState='pending';render();return;}
      finishIntro();syncMusic();
    });
  }
  function sync(fromGesture=false){
    if(sessionPaused||document.hidden){stopAll();return;}
    applyEffectsVolume75();
    if(!effectsWanted()){if(!introDone)finishIntro();stopPlaySound();}
    if(!introDone&&title.classList.contains('active')){stopMusic();playIntro(fromGesture);render();return;}
    if(!introDone)finishIntro();syncMusic();
  }
  function setVolume(value){
    if(!Number.isFinite(value))return;volume=Math.max(0,Math.min(100,Math.round(value)));save('bt-music-volume',volume);
    if(wanted()&&!audio.paused){cancelAnimationFrame(fade);generation++;audio.volume=volume/100*.65;render();return;}
    sync(true);
  }
  function unlock(event){
    if(!event.isTrusted||(event.type==='keydown'&&(event.repeat||event.ctrlKey||event.metaKey||event.altKey)))return;
    if(unlocked&&!failed&&introDone)return;unlocked=true;
    if(event.target.closest?.('#start-button,#restart-button')){render();return;}sync(true);
  }
  window.playRunStartAudio=function(){
    const duringIntro=!introDone;finishIntro();unlocked=true;stopPlaySound();
    if(!effectsWanted()){sync();return;}
    holdMusicForPlay=duringIntro;applyEffectsVolume75();const token=++playVersion;playSound.currentTime=0;
    playSound.play().catch(()=>{if(token!==playVersion)return;holdMusicForPlay=false;sync();});syncMusic();
  };
  window.pauseGameAudio75=function(){sessionPaused=true;soundEngine.stop();stopAll();};
  window.resumeGameAudio75=function(){sessionPaused=false;sync(true);};
  intro.addEventListener('ended',()=>{finishIntro();sync();});
  intro.addEventListener('error',()=>{finishIntro();sync();});
  playSound.addEventListener('ended',()=>{holdMusicForPlay=false;sync();});
  playSound.addEventListener('error',()=>{holdMusicForPlay=false;sync();});
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('ambience-paused',document.hidden);if(document.hidden)stopAll();else sync();});
  window.addEventListener('pagehide',()=>{soundEngine.stop();stopAll();});window.addEventListener('pageshow',()=>sync());
  document.getElementById('music-settings').addEventListener('click',()=>{render();renderEffectsControls75();dialog.showModal();});
  document.getElementById('music-close').addEventListener('click',()=>dialog.close());
  toggle.addEventListener('click',()=>{enabled=!enabled;failed=false;save('bt-music-enabled',enabled);sync(true);});
  slider.addEventListener('input',()=>setVolume(Number(slider.value)));
  document.getElementById('music-quieter').addEventListener('click',()=>setVolume(volume-5));
  document.getElementById('music-louder').addEventListener('click',()=>setVolume(volume+5));
  document.addEventListener('booster:effects-settings',()=>sync(true));
  audio.addEventListener('error',()=>{failed=true;render();});
  new MutationObserver(()=>{if(!title.classList.contains('active')&&!introDone){finishIntro();sync();}}).observe(title,{attributes:true,attributeFilter:['class']});
  sync();


  const stage = document.querySelector('#start-screen .title-stage');
  const stack = stage.querySelector('.hero-card-stack');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let pointerFrame = 0;
  stage.addEventListener('pointermove', event => {
    if (motion.matches || !document.getElementById('start-screen').classList.contains('active') || event.pointerType === 'touch') return;
    const rect = stage.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      stack.style.setProperty('--tilt-x', `${(x - .5) * 16}deg`);
      stack.style.setProperty('--tilt-y', `${(.5 - y) * 12}deg`);
      stack.style.setProperty('--light-x', `${x * 100}%`);
      stack.style.setProperty('--light-y', `${y * 100}%`);
    });
  }, {passive:true});
  stage.addEventListener('pointerleave', () => { cancelAnimationFrame(pointerFrame); stack.removeAttribute('style'); });
  // Delegation also covers newly rendered starter, shop and Booster Tutor packs.
  let packFrame = 0, activePack = null;
  const packProperties = ['--pack-tilt-x', '--pack-tilt-y', '--pack-light-x', '--pack-light-y'];
  function resetPack() {
    cancelAnimationFrame(packFrame);
    if (activePack) packProperties.forEach(property => activePack.style.removeProperty(property));
    activePack = null;
  }
  document.addEventListener('pointermove', event => {
    if (motion.matches || event.pointerType === 'touch') return;
    const packStage = event.target.closest?.('.pack-stage');
    const pack = packStage?.querySelector('.sealed-pack:not(.pack-opening-flight)');
    if (!pack || pack.disabled) { resetPack(); return; }
    if (activePack !== pack) { resetPack(); activePack = pack; }
    // Offset coordinates stay stable while the wrapper itself tilts and breathes.
    const rect = packStage.getBoundingClientRect();
    const scale = rect.width / packStage.offsetWidth;
    const x = Math.max(0, Math.min(1, ((event.clientX - rect.left) / scale - pack.offsetLeft) / pack.offsetWidth));
    const y = Math.max(0, Math.min(1, ((event.clientY - rect.top) / scale - pack.offsetTop) / pack.offsetHeight));
    cancelAnimationFrame(packFrame);
    packFrame = requestAnimationFrame(() => {
      if (!pack.isConnected || pack.classList.contains('pack-opening-flight')) return;
      pack.style.setProperty('--pack-tilt-x', `${(x - .5) * 16}deg`);
      pack.style.setProperty('--pack-tilt-y', `${(.5 - y) * 12}deg`);
      pack.style.setProperty('--pack-light-x', `${x * 100}%`);
      pack.style.setProperty('--pack-light-y', `${y * 100}%`);
    });
  }, {passive:true});
  document.addEventListener('pointerout', event => {
    if (activePack && !event.relatedTarget?.closest?.('.pack-stage')) resetPack();
  }, {passive:true});
  motion.addEventListener('change', resetPack);
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetPack(); });
})();
