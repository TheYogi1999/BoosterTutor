"""New receipt coin auditions; approved T4, C2 and R7 source files are read only."""
from pathlib import Path
import json,subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/audio/receipt-previews/coins';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100;rng=np.random.default_rng(8501)
def low(a,hz):return signal.sosfilt(signal.butter(2,hz,fs=RATE,output='sos'),a,axis=0)
def read(path):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/path),'-ar',str(RATE),'-ac','2','-f','f32le','pipe:1']);return np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
def blank(d):return np.zeros((round(d*RATE),2))
def add(a,b,at=0,gain=1):
 start=round(at*RATE);n=min(len(a)-start,len(b));a[start:start+n]+=b[:n]*gain

def texture(path,d):
 source=read(path).mean(axis=1);source/=max(.001,np.max(np.abs(source)));a=np.zeros(round(d*RATE));a[:min(len(a),len(source))]=source[:len(a)];return a

def encode(name,a):
 assert np.isfinite(a).all() and np.max(np.abs(a))<.9
 wav=OUT/(name+'.wav');wavfile.write(wav,RATE,(a*32767).astype(np.int16));subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-b:a','128k',str(OUT/(name+'.mp3'))],check=True);wav.unlink()
def master(a):
 a=low(a,5000);fade=round(.006*RATE);a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
 a*=min(.5/max(.001,np.max(np.abs(a))),.11/max(.001,np.sqrt(np.mean(a*a))));return np.column_stack([a,a*.98])
rows=[];clips={}
specs=[('C4','Copper Tick','A warm metal contact with a short, muted ring.',.105),('C5','Chip Tap','A dry wooden tap, like a small casino chip.',.09),('C6','Soft Pixel','A low, rounded retro pulse with a soft edge.',.085),('C7','Felt Click','A cushioned, low click without a metallic ring.',.08)]
for code,title,description,d in specs:
 t=np.arange(round(d*RATE))/RATE
 if code=='C4':a=low(texture('assets/audio/death-previews/source/impactMetal_medium_000.ogg',d),3000)*np.exp(-t*28)
 if code=='C5':a=low(texture('assets/audio/death-previews/source/impactWood_light_001.ogg',d),2800)*np.exp(-t*35)
 if code=='C6':
  phase=2*np.pi*np.cumsum(np.linspace(620,580,len(t)))/RATE;a=(np.sin(phase)+.12*signal.sawtooth(phase,width=.5))*np.exp(-t*43)*(1-np.exp(-t/.002))
 if code=='C7':a=low(texture('assets/audio/death-previews/source/impactSoft_medium_000.ogg',d),1100)*np.exp(-t*38)+low(rng.normal(size=len(t)),1400)*np.exp(-t*70)*.025
 a=master(a);name=code.lower()+'-'+title.lower().replace(' ','-');encode(name,a);clips[code]=a;rows.append(dict(code=code,title=title,description=description,seconds=d,file=name+'.mp3'))
transition=read('assets/audio/receipt-previews/round2/t4-velvet-air.mp3');finish=read('assets/audio/receipt-previews/round3/r7-deck-settle.mp3');clips['C2']=read('assets/audio/receipt-previews/c2-crystal-tick.mp3')
for code in ['C2','C4','C5','C6','C7']:
 a=blank(2.55);add(a,transition,0,.8)
 for i in range(1,9):
  progress=i/8;phase=(1.25-np.sqrt(1.5625-progress))/.5;add(a,clips[code],.6+1.2*phase,.62)
 add(a,finish,1.94,.8);encode('set-'+code.lower(),a)
(OUT/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
(OUT/'README.md').write_text('''# Coin auditions

C4 Copper Tick: Kenney Impact Sounds CC0, impactMetal_medium_000.
C5 Chip Tap: Kenney Impact Sounds CC0, impactWood_light_001.
C6 Soft Pixel: original procedural synthesis.
C7 Felt Click: Kenney Impact Sounds CC0, impactSoft_medium_000, plus original filtered noise.
These are sound designs, not recordings of actual coins. The pinned source fingerprints are
in ../../death-previews/source/manifest.json; audio/SOURCES.md links the original packs.

Each comparison preserves the approved T4/R7 stereo sources at their actual game gains,
with eight coin ticks over the 1.2-second count after the 600ms card-collection lead-in.
C2 was the in-game coin cue through v0.86. v0.87 selects Mediasaur sound 788073. C4–C7 remain auditions.
No approved source asset is modified by this generator.
Reproduce with python3 scripts/make-coin-auditions.py (numpy, scipy, ffmpeg).
''')
print('Generated C4–C7 and five T4/1.2-second count/R7 comparisons, including current C2.')
