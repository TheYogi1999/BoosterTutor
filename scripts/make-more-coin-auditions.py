"""Eight additional counter sounds; source chips are pinned Kenney Casino Audio CC0."""
from pathlib import Path
import json,subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/audio/receipt-previews/coins-more';RATE=44100;rng=np.random.default_rng(8601)
def low(a,hz):return signal.sosfilt(signal.butter(2,hz,fs=RATE,output='sos'),a,axis=0)
def read(path):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/path),'-ar',str(RATE),'-ac','2','-f','f32le','pipe:1']);return np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
def add(a,b,at=0,gain=1):
 start=round(at*RATE);n=min(len(a)-start,len(b));a[start:start+n]+=b[:n]*gain

def chip(name,d):
 a=read(OUT/'source'/name).mean(axis=1);peaks=np.flatnonzero(abs(a)>max(.0001,abs(a).max()*.03));start=max(0,int(peaks[0])-round(.004*RATE));a=a[start:start+round(d*RATE)];return np.pad(a,(0,max(0,round(d*RATE)-len(a))))
def master(a):
 a=low(a,5200);n=round(.005*RATE);a[:n]*=np.linspace(0,1,n);a[-n:]*=np.linspace(1,0,n);a*=min(.5/max(.001,abs(a).max()),.11/max(.001,np.sqrt(np.mean(a*a))));return np.column_stack([a,a*.98])
def encode(name,a):
 assert np.isfinite(a).all() and .005<abs(a).max()<.9
 p=OUT/(name+'.wav');wavfile.write(p,RATE,(a*32767).astype(np.int16));subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-b:a','128k',str(OUT/(name+'.mp3'))],check=True);p.unlink()
rows=[];clips={}
specs=[
 ('C8','Single Chip','A light, clean chip landing. Real chip recording, trimmed.','recorded',.11,'chip-lay-1.ogg'),
 ('C9','Warm Chip','A softer chip contact with a warmer body. Real chip recording.','recorded',.105,'chip-lay-3.ogg'),
 ('C10','Chip Pair','Two chips touching, with a short bright clack. Real chip recording.','recorded',.13,'chips-collide-1.ogg'),
 ('C11','Stack Tick','A compact chip-stack contact. Real chip recording, trimmed.','recorded',.14,'chips-stack-2.ogg'),
 ('C12','Arcade Dot','A quick, clear arcade pulse without a long tail.','retro',.075,None),
 ('C13','Low Blip','A lower, rounded counting pulse.','retro',.09,None),
 ('C14','Wooden Bead','A dry percussive tick with a small wooden resonance.','designed',.10,None),
 ('C15','Soft Cash Tick','A soft click with a tiny low thump; almost no ring.','designed',.095,None)]
for code,title,desc,family,d,source in specs:
 t=np.arange(round(d*RATE))/RATE
 if source:a=chip(source,d)
 elif code=='C12':a=np.sin(2*np.pi*1040*t)*np.exp(-t*55)*(1-np.exp(-t/.002))
 elif code=='C13':a=(np.sin(2*np.pi*392*t)+.12*signal.sawtooth(2*np.pi*392*t,width=.5))*np.exp(-t*45)*(1-np.exp(-t/.003))
 elif code=='C14':a=(np.sin(2*np.pi*880*t)*.7+np.sin(2*np.pi*1340*t)*.22)*np.exp(-t*65)*(1-np.exp(-t/.002))
 else:a=low(rng.normal(size=len(t)),2300)*np.exp(-t*85)*.25+np.sin(2*np.pi*190*t)*np.exp(-t*65)*.15
 a=master(a);name=code.lower()+'-'+title.lower().replace(' ','-');encode(name,a);clips[code]=a;rows.append(dict(code=code,title=title,description=desc,family=family,seconds=d,file=name+'.mp3',source=source or 'Original synthesis'))
transition=read('assets/audio/receipt-previews/round2/t4-velvet-air.mp3');finish=read('assets/audio/receipt-previews/round3/r7-deck-settle.mp3')
for code,audio in clips.items():
 a=np.zeros((round(2.55*RATE),2));add(a,transition,0,.8)
 for i in range(1,9):
  phase=(1.25-np.sqrt(1.5625-i/8))/.5;add(a,audio,.6+1.2*phase,.62)
 add(a,finish,1.94,.8);encode('set-'+code.lower(),a)
(OUT/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
(OUT/'README.md').write_text('''# More coin/counter auditions

C8–C11 use real poker-chip recordings from **Kenney Casino Audio 1.1 (CC0)**:
https://kenney.nl/assets/casino-audio
Original archive: https://opengameart.org/sites/default/files/kenney_casino-audio.zip
Source page: https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips
The four unmodified recordings, original License.txt, archive SHA-256 and individual
fingerprints are included in source/. These are chips, not recordings of metal coins.
Auditions are trimmed, faded and normalized; no source pitch changes are applied.
C12–C15 are original procedural sound designs.

Every comparison uses approved T4 and R7 at game gains with the 1.2-second count.
C2 remains the in-game coin sound until a replacement is selected in chat.
Reproduce: python3 scripts/make-more-coin-auditions.py (numpy, scipy, ffmpeg).
For your own search: https://freesound.org/search/?q=coin and https://bigsoundbank.com/
''')
print('Generated C8–C15: four real chip recordings and four original sound designs, each with T4/R7 comparison.')
