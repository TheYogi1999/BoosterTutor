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
playSfx=function(name){
 if(!state.soundOn)return;const entry=RECORDED_SFX[name];if(!entry)return originalPlaySfx(name);
 const [path,level]=entry;const now=Date.now();if(name==='select'&&now-lastRecordedCue<65)return;lastRecordedCue=now;
 const audioEpoch=soundEngine.epoch||0;
 soundEngine.resume().then(async()=>{let loading=recordedBuffers.get(path);if(!loading){loading=fetch(path).then(response=>{if(!response.ok)throw Error('Audio unavailable');return response.arrayBuffer();}).then(bytes=>soundEngine.context.decodeAudioData(bytes));recordedBuffers.set(path,loading);}const buffer=await loading;if(!state.soundOn||(soundEngine.epoch||0)!==audioEpoch)return;const source=soundEngine.context.createBufferSource();const gain=soundEngine.context.createGain();gain.gain.value=level;source.buffer=buffer;source.connect(gain);gain.connect(soundEngine.bus);source.voiceGain=gain;soundEngine.voices.add(source);source.onended=()=>soundEngine.voices.delete(source);source.start();}).catch(()=>{});
};
const originalStopSounds=soundEngine.stop.bind(soundEngine);soundEngine.stop=function(){this.epoch=(this.epoch||0)+1;originalStopSounds();};
