"""Original short transition/count/reward auditions; numpy, scipy and ffmpeg."""
from pathlib import Path
import json, subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/receipt-previews';OUT.mkdir(parents=True,exist_ok=True)
RATE=44100;RNG=np.random.default_rng(8201)
def low(x,hz):return signal.sosfilt(signal.butter(3,hz,fs=RATE,output='sos'),x)
def tone(seconds,start,end,decay=12):
 t=np.arange(int(seconds*RATE))/RATE;phase=2*np.pi*np.cumsum(np.linspace(start,end,len(t)))/RATE
 return (np.sin(phase)+.16*np.sin(phase*2))*np.exp(-t*decay)*(1-np.exp(-t/.003))
def foley(path,seconds):
 a=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/path),'-ar',str(RATE),'-ac','1','-f','f32le','pipe:1']),dtype='<f4').astype(float)
 a=low(a,4000);a/=max(.001,np.max(np.abs(a)));return np.interp(np.linspace(0,len(a)-1,int(seconds*RATE)),np.arange(len(a)),a)
def add(a,b,offset=0,level=1):
 pos=int(offset*RATE);n=min(len(b),len(a)-pos)
 if n>0:a[pos:pos+n]+=b[:n]*level
def mastered(name,a):
 a=low(a,5200);n=min(len(a),int(.009*RATE));a[:n]*=np.linspace(0,1,n);a[-n:]*=np.linspace(1,0,n);a/=max(.001,np.max(np.abs(a)))/.6
 stereo=np.column_stack([a,np.roll(a,80)*.97]);stereo[:80,1]=a[:80]*.97
 wav=OUT/(name+'.wav');wavfile.write(wav,RATE,(stereo*32767).astype(np.int16))
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-24:TP=-4:LRA=5','-ar',str(RATE),'-ac','2','-b:a','128k',str(OUT/(name+'.mp3'))],check=True);wav.unlink()
 return stereo
specs=[
 ('T1','Transition','Foley','Silk Sweep','A short, soft card-fan sweep.',.20),('T2','Transition','Arcane','Aether Slip','Air and a brief falling magical tone.',.22),('T3','Transition','Retro','Quick Zip','A rounded electronic slide with a clean stop.',.16),
 ('C1','Coin count','Foley','Small Coin','A restrained metal tick with a warm body.',.11),('C2','Coin count','Arcane','Crystal Tick','A light, soft crystal plink.',.12),('C3','Coin count','Retro','Warm Blip','A rounded, brief counting pulse.',.095),
 ('R1','Result','Foley','Coin Settle','A compact landing with a gentle metallic tail.',.34),('R2','Result','Arcane','Golden Seal','A short magical chord with a warm finish.',.43),('R3','Result','Retro','Reward Lock','A quick ascending retro resolution.',.33)]
clips={};manifest=[]
for code,group,family,title,description,seconds in specs:
 a=np.zeros(int(seconds*RATE));n=len(a);t=np.arange(n)/RATE
 if code=='T1':a=foley(Path('assets/audio/card-fan.ogg'),seconds)*np.sin(np.linspace(0,np.pi,n))*.7
 if code=='T2':a=low(RNG.normal(size=n),2100)*np.sin(np.linspace(0,np.pi,n))*.11+tone(seconds,680,340,16)*.26
 if code=='T3':a=tone(seconds,520,170,17)*.7
 if code=='C1':a=foley(Path('assets/audio/death-previews/source/impactMetal_medium_000.ogg'),seconds)*np.exp(-t*30)*.3+tone(seconds,1450,1380,38)*.4
 if code=='C2':a=tone(seconds,1800,1720,38)*.42+tone(seconds,2400,2360,44)*.13
 if code=='C3':a=tone(seconds,920,1080,39)*.7
 if code=='R1':a=foley(Path('assets/audio/card-place.ogg'),seconds)*.45+tone(seconds,420,340,20)*.36
 if code=='R2':
  for freq in [330,415.3,494]:add(a,tone(seconds,freq,freq,9),0,.24)
 if code=='R3':
  for i,freq in enumerate([392,494,587]):add(a,tone(.17,freq,freq,24),i*.065,.44)
 name=code.lower()+'-'+title.lower().replace(' ','-');clips[code]=mastered(name,a)
 manifest.append(dict(code=code,group=group,family=family,title=title,description=description,seconds=seconds,file=name+'.mp3'))
for family in [1,2,3]:
 parts=[clips['T'+str(family)],np.zeros((int(.12*RATE),2))]
 for i in range(6):parts.extend([clips['C'+str(family)]*(.80+i*.035),np.zeros((int(.022*RATE),2))])
 parts.extend([np.zeros((int(.06*RATE),2)),clips['R'+str(family)]])
 a=np.concatenate(parts);wav=OUT/f'set-{family}.wav';wavfile.write(wav,RATE,(a*32767).astype(np.int16))
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-24:TP=-4:LRA=5','-ar',str(RATE),'-ac','2','-b:a','128k',str(OUT/f'set-{family}.mp3')],check=True);wav.unlink()
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Built nine receipt auditions and three transition / six-tick / finish comparisons.')
