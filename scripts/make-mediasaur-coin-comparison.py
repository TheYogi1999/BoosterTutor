"""Comparison for the selected CC0 Mediasaur coin; source MP3 stays byte-identical."""
from pathlib import Path
import subprocess,numpy as np
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];RATE=44100

def read(path):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/path),'-ar',str(RATE),'-ac','2','-f','f32le','pipe:1']);return np.frombuffer(raw,dtype='<f4').reshape(-1,2)
def add(a,b,at=0,gain=1):
 start=round(at*RATE);n=min(len(a)-start,len(b));a[start:start+n]+=b[:n]*gain

a=np.zeros((round(2.55*RATE),2));add(a,read('assets/audio/receipt-previews/round2/t4-velvet-air.mp3'),0,.8);coin=read('assets/audio/mediasaur-coin-drop-788073.mp3')
for i in range(1,9):
 phase=(1.25-np.sqrt(1.5625-i/8))/.5;add(a,coin,.6+1.2*phase,.62)
add(a,read('assets/audio/receipt-previews/round3/r7-deck-settle.mp3'),1.94,.8)
assert np.isfinite(a).all() and abs(a).max()<.9
out=ROOT/'assets/audio/receipt-previews/coins-more/set-c16.mp3';wav=out.with_suffix('.wav');wavfile.write(wav,RATE,(a*32767).astype(np.int16));subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-b:a','128k',str(out)],check=True);wav.unlink();print('Built selected Mediasaur coin comparison with unchanged T4/R7 and 1.2-second count.')
