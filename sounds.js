// Original, consistently mastered sound cues. No third-party samples.
const SFX_CUES = {"select": {"start": 0, "duration": 0.085, "file": "assets/audio/select.wav"}, "grab": {"start": 0.26, "duration": 0.14}, "cancel": {"start": 0.5, "duration": 0.2}, "shuffle": {"start": 0.8, "duration": 0.62}, "creature": {"start": 1.52, "duration": 0.62}, "cast": {"start": 2.24, "duration": 0.55}, "attach": {"start": 2.89, "duration": 0.4}, "hit": {"start": 3.39, "duration": 0.34}, "heal": {"start": 3.83, "duration": 0.65}, "block": {"start": 4.58, "duration": 0.4}, "turn": {"start": 5.08, "duration": 0.38}, "victory": {"start": 5.56, "duration": 1.1}, "defeat": {"start": 6.76, "duration": 0.85}};
const soundEngine = {
  context: null, bus: null, buffer: null, loading: null, selectBuffer: null, selectLoading: null, packSource: null, packGain: null, voices: new Set(),
  async resume() {
    this.context ||= new (window.AudioContext || window.webkitAudioContext)();
    await this.context.resume();
    if (!this.bus) {
      this.bus = this.context.createDynamicsCompressor();
      this.bus.threshold.value = -12; this.bus.knee.value = 12; this.bus.ratio.value = 4;
      this.bus.attack.value = 0.003; this.bus.release.value = 0.12;
      this.bus.connect(this.context.destination);
    }
  },
  async unlock() {
    await this.resume();
    if (!this.loading) this.loading = fetch('assets/audio/sfx-suite.mp3').then(response => {
      if (!response.ok) throw new Error('Sound asset unavailable');
      return response.arrayBuffer();
    }).then(bytes => this.context.decodeAudioData(bytes)).then(buffer => { this.buffer = buffer; return buffer; }).catch(error => { this.loading = null; throw error; });
    return this.loading;
  },
  async selection() {
    await this.resume();
    if (!this.selectLoading) this.selectLoading = fetch(SFX_CUES.select.file).then(response => {
      if (!response.ok) throw new Error('Selection sound unavailable');
      return response.arrayBuffer();
    }).then(bytes => this.context.decodeAudioData(bytes)).then(buffer => { this.selectBuffer = buffer; return buffer; }).catch(error => { this.selectLoading = null; throw error; });
    return this.selectLoading;
  },
  stop() {
    for (const voice of this.voices) { try { voice.stop(); } catch {} }
    this.voices.clear();
    const pack = document.querySelector('#booster-audio');
    if (pack) { pack.pause(); pack.currentTime = 0; }
  }
};
function playSfx(name) {
  if (!state.soundOn || !SFX_CUES[name]) return;
  (name === 'select' ? soundEngine.selection() : soundEngine.unlock()).then(buffer => {
    if (!state.soundOn) return;
    while (soundEngine.voices.size >= 8) {
      const oldest = soundEngine.voices.values().next().value;
      oldest.voiceGain?.gain.linearRampToValueAtTime(0, soundEngine.context.currentTime + 0.015);
      oldest.stop(soundEngine.context.currentTime + 0.015); soundEngine.voices.delete(oldest);
    }
    const source = soundEngine.context.createBufferSource();
    const gain = soundEngine.context.createGain();
    gain.gain.value = ({ select: 0.45, grab: 0.45, cancel: 0.4, creature: 0.4, cast: 0.35, hit: 0.38, block: 0.3, victory: 0.45 })[name] || 0.3;
    source.voiceGain = gain;
    source.buffer = buffer; source.connect(gain); gain.connect(soundEngine.bus);
    source.onended = () => soundEngine.voices.delete(source);
    soundEngine.voices.add(source);
    source.start(0, name === 'select' ? 0 : SFX_CUES[name].start, name === 'select' ? buffer.duration : SFX_CUES[name].duration);
  }).catch(() => {}); // Sound is optional; gameplay remains available.
}

// Recorded card Foley and a short acoustic jingle replace the prominent synthetic cues.
const RECORDED_SFX={select:['assets/audio/card-place.ogg',.23],grab:['assets/audio/card-slide.ogg',.2],attach:['assets/audio/card-place.ogg',.3],cast:['assets/audio/card-fan.ogg',.32],creature:['assets/audio/card-fan.ogg',.36],shuffle:['assets/audio/card-shuffle.ogg',.28],intro:['assets/audio/expedition-start.mp3',.48]};
RECORDED_SFX.turn=['assets/audio/card-place.ogg',.17];
RECORDED_SFX.block=['assets/audio/card-place.ogg',.25];
const recordedBuffers=new Map();const originalPlaySfx=playSfx;let lastRecordedCue=0;
Object.assign(RECORDED_SFX,{
 draw:['assets/audio/action-previews/d1-paper-slide.mp3',.7],
 invalid:['assets/audio/action-previews/x3-retro-denied.mp3',.75],
 'enemy-hit':['assets/audio/action-previews/e3-retro-impact.mp3',.85],
 'player-hit':['assets/audio/action-previews/p3-retro-damage.mp3',.85]
});
const selectedActionCues=['draw','invalid','enemy-hit','player-hit'];
const cueCooldowns={invalid:180,'enemy-hit':65,'player-hit':65};
const lastActionCue=new Map();
function recordedSoundBuffer(path){
 let loading=recordedBuffers.get(path);
 if(!loading){
  loading=fetch(path).then(response=>{if(!response.ok)throw Error('Audio unavailable');return response.arrayBuffer();}).then(bytes=>soundEngine.context.decodeAudioData(bytes)).catch(error=>{recordedBuffers.delete(path);throw error;});
  recordedBuffers.set(path,loading);
 }
 return loading;
}
function startRecordedVoice(name,buffer,when=null,scale=1){
 while(soundEngine.voices.size>=24){
  const oldest=soundEngine.voices.values().next().value;
  try{oldest.voiceGain?.gain.setTargetAtTime(0,soundEngine.context.currentTime,.008);oldest.stop(soundEngine.context.currentTime+.025);}catch{}
  soundEngine.voices.delete(oldest);
 }
 const source=soundEngine.context.createBufferSource(),gain=soundEngine.context.createGain();
 gain.gain.value=RECORDED_SFX[name][1]*scale;source.buffer=buffer;
 source.connect(gain);gain.connect(soundEngine.bus);source.voiceGain=gain;source.cueName=name;
 source.scheduledAt=when??soundEngine.context.currentTime;
 soundEngine.voices.add(source);source.onended=()=>soundEngine.voices.delete(source);source.start(source.scheduledAt);
 return source;
}
playSfx=function(name){
 if(!state.soundOn||document.hidden)return;
 const entry=RECORDED_SFX[name];if(!entry)return originalPlaySfx(name);
 const now=Date.now();
 if(cueCooldowns[name]){if(now-(lastActionCue.get(name)||0)<cueCooldowns[name])return;lastActionCue.set(name,now);}
 if(name==='select'&&now-lastRecordedCue<65)return;lastRecordedCue=now;
 const epoch=soundEngine.epoch||0;
 soundEngine.resume().then(async()=>{
  const buffer=await recordedSoundBuffer(entry[0]);
  if(!state.soundOn||document.hidden||(soundEngine.epoch||0)!==epoch||Date.now()-now>1200)return;
  startRecordedVoice(name,buffer);
 }).catch(()=>{});
};

// Actual library draws queue independently of the visual/reduced-motion effects.
let drawSoundTimer=0,drawSoundGeneration=0,drawSoundTail=new WeakMap();
const pendingDrawSounds=new Map();
function queueDrawSound(battle){
 if(!state.soundOn||document.hidden||state.battle!==battle||battle.phase==='complete')return;
 pendingDrawSounds.set(battle,Math.min(24,(pendingDrawSounds.get(battle)||0)+1));
 if(!drawSoundTimer)drawSoundTimer=setTimeout(flushDrawSounds,0);
}
function flushDrawSounds(){
 drawSoundTimer=0;
 const batches=[...pendingDrawSounds];pendingDrawSounds.clear();
 const generation=drawSoundGeneration,epoch=soundEngine.epoch||0;
 soundEngine.resume().then(async()=>{
  const buffer=await recordedSoundBuffer(RECORDED_SFX.draw[0]);
  if(!state.soundOn||document.hidden||generation!==drawSoundGeneration||(soundEngine.epoch||0)!==epoch)return;
  for(const [battle,count] of batches){
   if(state.battle!==battle||state.screen!=='combat-screen'||battle.phase==='complete')continue;
   const now=soundEngine.context.currentTime;
   const start=Math.max(now+.008,Math.min(drawSoundTail.get(battle)||0,now+.45));
   const gap=Math.min(.16,1.2/Math.max(1,count-1));
   const overlap=Math.max(2,Math.ceil(buffer.duration/gap)),scale=Math.min(1,Math.sqrt(2/overlap));
   for(let i=0;i<count;i++)startRecordedVoice('draw',buffer,start+i*gap,scale);
   drawSoundTail.set(battle,start+count*gap);
  }
 }).catch(()=>{});
}
function cancelDrawSounds(){
 drawSoundGeneration++;clearTimeout(drawSoundTimer);drawSoundTimer=0;pendingDrawSounds.clear();drawSoundTail=new WeakMap();
 for(const voice of [...soundEngine.voices])if(voice.cueName==='draw'){try{voice.stop();}catch{}soundEngine.voices.delete(voice);}
}
const originalStopSounds=soundEngine.stop.bind(soundEngine);
soundEngine.stop=function(){this.epoch=(this.epoch||0)+1;cancelDrawSounds();lastActionCue.clear();originalStopSounds();};
let actionsWarmed=false;
function warmActionSounds(event){
 if(!event.isTrusted||!state.soundOn||document.hidden||actionsWarmed)return;
 actionsWarmed=true;
 soundEngine.resume().then(()=>Promise.allSettled(selectedActionCues.map(name=>recordedSoundBuffer(RECORDED_SFX[name][0])))).catch(()=>{actionsWarmed=false;});
}
document.addEventListener('pointerdown',warmActionSounds,{passive:true});
document.addEventListener('keydown',warmActionSounds);
document.addEventListener('visibilitychange',()=>{if(document.hidden)soundEngine.stop();});
if(typeof MutationObserver!=='undefined'){
 const combat=document.getElementById('combat-screen');
 if(combat)new MutationObserver(()=>{if(!combat.classList.contains('active'))cancelDrawSounds();}).observe(combat,{attributes:true,attributeFilter:['class']});
}
