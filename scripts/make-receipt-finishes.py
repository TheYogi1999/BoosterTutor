"""Third finish auditions: physical card/wood textures and a short retro stamp.
Approved T4/C2 files are read only; comparison timing matches the 1.2s count.
"""
from pathlib import Path
import json,subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/audio/receipt-previews/round3';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100;rng=np.random.default_rng(8401)
def low(a,hz):return signal.sosfilt(signal.butter(2,hz,fs=RATE,output='sos'),a)
def blank(d):return np.zeros(round(d*RATE))
def read(path):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/path),'-ar',str(RATE),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
def add(a,b,at=0,gain=1):
 i=round(at*RATE);n=min(len(a)-i,len(b));a[i:i+n]+=b[:n]*gain

def texture(path,d):
 a=read(path);a=low(a,4200);a/=max(.001,np.max(np.abs(a)));return np.interp(np.linspace(0,len(a)-1,round(d*RATE)),np.arange(len(a)),a)
def encode(name,a):
 stereo=np.column_stack([a,a*.98]);assert np.isfinite(a).all() and np.max(np.abs(a))<.9
 wav=OUT/(name+'.wav');wavfile.write(wav,RATE,(stereo*32767).astype(np.int16));subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-b:a','128k',str(OUT/(name+'.mp3'))],check=True);wav.unlink()
def master(a):
 a=low(a,4800);n=round(.008*RATE);a[:n]*=np.linspace(0,1,n);a[-n:]*=np.linspace(1,0,n);a*=min(.4/max(.001,np.max(np.abs(a))),.085/max(.001,np.sqrt(np.mean(a*a))));return a
specs=[('R7','Deck Settle','A real paper shuffle, then a soft card-stack landing.',.48),('R8','Wooden Latch','A dry wooden click with a small cushioned stop.',.34),('R9','Retro Stamp','A compact low retro ka-chunk; no bell or fanfare.',.32)]
clips={};rows=[]
for code,title,description,d in specs:
 a=blank(d);t=np.arange(len(a))/RATE
 if code=='R7':
  add(a,texture('assets/audio/card-shuffle.ogg',.27),0,.19);add(a,texture('assets/audio/card-place.ogg',.18),.22,.4)
 if code=='R8':
  add(a,texture('assets/audio/death-previews/source/impactWood_light_001.ogg',.12),0,.4);add(a,texture('assets/audio/death-previews/source/impactSoft_medium_000.ogg',.16),.09,.18)
 if code=='R9':
  for at,f in [(0,196),(.075,147)]:
   length=.18;u=np.arange(round(length*RATE))/RATE;pulse=signal.square(2*np.pi*f*u,duty=.25)*np.exp(-u*28)*(1-np.exp(-u/.002));add(a,low(pulse,1800),at,.13)
  a+=low(rng.normal(size=len(a)),2500)*np.exp(-t*65)*.06
 a=master(a);name=code.lower()+'-'+title.lower().replace(' ','-');encode(name,a);clips[code]=a;rows.append(dict(code=code,title=title,description=description,seconds=d,file=name+'.mp3'))
transition=read('assets/audio/receipt-previews/round2/t4-velvet-air.mp3');coin=read('assets/audio/receipt-previews/c2-crystal-tick.mp3')
for code in ['R7','R8','R9','R0']:
 a=blank(2.55);add(a,transition,0,.8)
 for i in range(1,9):
  fraction=i/8;phase=(1.25-np.sqrt(1.5625-fraction))/.5;add(a,coin,.6+1.2*phase,.62)
 if code!='R0':add(a,clips[code],1.94,.8)
 encode('set-'+code.lower(),a)
(OUT/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
(OUT/'README.md').write_text('''# Finish auditions, round three

R7 Deck Settle uses the existing Kenney Casino Audio CC0 card-shuffle and card-place recordings.
R8 Wooden Latch uses Kenney Impact Sounds CC0 impactWood_light_001 and impactSoft_medium_000.
Pinned source fingerprints are in ../../death-previews/source/manifest.json; parent audio/SOURCES.md links the source packs.
R9 Retro Stamp is original procedural synthesis. R7 is selected and active in game (v0.85); R8 and R9 remain auditions.

Comparisons reuse the unchanged approved T4 and C2 sources at their game gains, with the actual
600ms collection lead-in and eight C2 ticks over the 1.2-second count. R0 has no additional finish.
Reproduce with python3 scripts/make-receipt-finishes.py (numpy, scipy, ffmpeg).
''')
print('Generated R7/R8/R9 and four comparisons with approved T4 + C2, including no extra finish.')
