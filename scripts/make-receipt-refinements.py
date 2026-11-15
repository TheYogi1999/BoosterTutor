"""Second transition/finish auditions. Original synthesis; approved C2 is read only."""
from pathlib import Path
import json,subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/audio/receipt-previews/round2';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100;rng=np.random.default_rng(8301)
def filt(a,hz,kind='lowpass'):return signal.sosfilt(signal.butter(2,hz,fs=RATE,btype=kind,output='sos'),a)
def blank(d):return np.zeros(round(d*RATE))
def impact(d,freqs,decay=18):
 t=np.arange(round(d*RATE))/RATE;a=blank(d)
 for f,g in freqs:a+=g*np.sin(2*np.pi*f*t)*np.exp(-decay*t)
 return a*(1-np.exp(-t/.002))
def add(a,b,at=0,gain=1):
 i=round(at*RATE);n=min(len(a)-i,len(b));a[i:i+n]+=b[:n]*gain

def save(name,a):
 a=filt(a,6500);fade=min(len(a)//3,round(.012*RATE));a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
 a*=min(.38/max(.0001,np.max(np.abs(a))),.07/max(.0001,np.sqrt(np.mean(a*a))))
 stereo=np.column_stack([a,a*.98]);wav=OUT/(name+'.wav');wavfile.write(wav,RATE,(stereo*32767).astype(np.int16))
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-b:a','128k',str(OUT/(name+'.mp3'))],check=True);wav.unlink();return a
specs=[('T4','Transition','Velvet','Velvet Air','A soft, wide air movement with no whistle or musical slide.',.38),('T5','Transition','Ember','Ember Pulse','A low cinematic breath with a small, rounded impact.',.44),('T6','Transition','Glass','Glass Fold','Two delicate glass textures over a very light airy sweep.',.46),('R4','Result finish','Velvet','Coin Stack','Three quiet, irregular metal contacts settling into place.',.62),('R5','Result finish','Ember','Warm Landing','A deep felt impact with a short, warm wooden resonance.',.68),('R6','Result finish','Glass','Tiny Bell','One delicate bell with a soft trailing echo; no chord or jingle.',.56)]
clips={};manifest=[]
for code,group,family,title,description,d in specs:
 a=blank(d);t=np.arange(len(a))/RATE;noise=rng.normal(size=len(a))
 if code=='T4':a=filt(filt(noise,200,'highpass'),1700)*np.sin(np.pi*t/d)**2*.65
 if code=='T5':a=filt(noise,650)*np.sin(np.pi*t/d)**2*.25+impact(d,[(95,.25),(153,.1)],13)
 if code=='T6':
  a=filt(filt(noise,1200,'highpass'),3600)*np.sin(np.pi*t/d)**3*.08
  add(a,impact(.28,[(1050,.07),(1651,.04)],22),.04);add(a,impact(.28,[(1350,.06),(2133,.03)],24),.16)
 if code=='R4':
  for at,f,g in [(0,1230,.14),(.13,1520,.10),(.24,1170,.06)]:add(a,impact(.3,[(f,g),(f*1.42,g*.3)],24),at)
  a+=filt(noise,1000)*np.exp(-t*35)*.06
 if code=='R5':a=impact(d,[(110,.34),(220,.13),(389,.05)],12)+filt(noise,1400)*np.exp(-t*45)*.12
 if code=='R6':
  a=impact(d,[(1320,.12),(2118,.035),(2960,.012)],9);add(a,impact(.35,[(1320,.025),(2118,.007)],12),.18)
 name=code.lower()+'-'+title.lower().replace(' ','-');clips[code]=save(name,a);manifest.append(dict(code=code,group=group,family=family,title=title,description=description,seconds=d,file=name+'.mp3'))
coin=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/'assets/audio/receipt-previews/c2-crystal-tick.mp3'),'-ar',str(RATE),'-ac','1','-f','f32le','pipe:1']),dtype='<f4')
for n in [4,5,6]:
 a=blank(2.65);add(a,clips['T'+str(n)])
 for i in range(6):add(a,coin,.55+i*.22,.62)
 add(a,clips['R'+str(n)],1.98);save('set-'+str(n),a)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'README.md').write_text('''# Refined receipt auditions

T4–T6 and R4–R6 are original procedural sound designs made for Booster Tutor.
Reproduce with `python3 scripts/make-receipt-refinements.py` (numpy, scipy, ffmpeg).
No third-party recording is used in the new transition or finish clips.
The comparison sequences reuse the approved C2 Crystal Tick from the parent directory,
without modifying that source asset. All clips are auditions; only C2 is active in game.
''')
print('Created six new auditions and three C2 comparisons; approved C2 unchanged.')
