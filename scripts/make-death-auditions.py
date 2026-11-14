"""Build nine manual enemy-defeat auditions. Requires numpy, scipy and ffmpeg.

Kenney CC0 impact recordings are bundled in death-previews/source; all additional
layers are deterministic original synthesis. This does not modify game audio.
"""
from pathlib import Path
import json
import subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio/death-previews'
RATE = 44100
RNG = np.random.default_rng(7619)


def filtered(x, low=None, high=None):
    if low and high:
        sos = signal.butter(3, [low, high], fs=RATE, btype='bandpass', output='sos')
    else:
        sos = signal.butter(3, low or high, fs=RATE, btype='highpass' if low else 'lowpass', output='sos')
    return signal.sosfilt(sos, x)


def sample(name, pitch=1, high=4200):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(OUT/'source'/(name+'.ogg')), '-ar', str(RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    x = np.frombuffer(raw, np.float32).astype(float)
    x = np.interp(np.arange(0, len(x), pitch), np.arange(len(x)), x)
    x = filtered(x, 45, high)
    x /= max(.001, np.max(np.abs(x)))
    return x


def add(dst, src, at=0, level=1):
    pos = int(at*RATE)
    count = min(len(src), len(dst)-pos)
    if count > 0:
        dst[pos:pos+count] += level*src[:count]


def fall(seconds, start, end, decay, shape='sine'):
    t = np.arange(int(seconds*RATE))/RATE
    freq = end+(start-end)*np.exp(-t/max(.03, seconds/3))
    phase = 2*np.pi*np.cumsum(freq)/RATE
    wave = np.sin(phase)+.24*np.sin(phase*2)+.08*np.sin(phase*3)
    if shape == 'retro':
        wave = .65*wave+.35*(2/np.pi)*np.arcsin(np.sin(phase))
    return wave*(1-np.exp(-t/0.006))*np.exp(-decay*t)


def air(seconds, cutoff, decay):
    t = np.arange(int(seconds*RATE))/RATE
    x = filtered(RNG.normal(size=len(t)), 90, cutoff)
    x /= max(.001, np.max(np.abs(x)))
    return x*(1-np.exp(-t/.014))*np.exp(-decay*t)


def stereo(x, width):
    x = filtered(x, 38, 6200)
    left, right = x.copy(), x.copy()
    # A short, low-pass room, with no long tail obscuring the next action.
    soft = filtered(x, high=2400)
    for delay, gain in [(0.023, .15*width), (0.047, .10*width), (0.091, .055*width)]:
        n = int(delay*RATE)
        left[n:] += soft[:-n]*gain
        n += int(.008*RATE)
        right[n:] += soft[:-n]*gain
    y = np.column_stack([left, right])
    n = min(int(.006*RATE), len(y))
    y[:n] *= np.linspace(0, 1, n)[:, None]
    n = min(int(.09*RATE), len(y))
    y[-n:] *= np.linspace(1, 0, n)[:, None]
    y /= max(.001, np.max(np.abs(y))) / .70
    return y


SIZES = [('S', 'Small', [.56, .68, .52]), ('M', 'Medium', [.98, 1.12, .86]), ('L', 'Large', [1.58, 1.82, 1.44])]
TITLES = {
    'S': ['Quick Fall', 'Fading Spark', 'Retro Drop'],
    'M': ['Armor Collapse', 'Soul Dissolve', 'Retro Defeat'],
    'L': ['Heavy Collapse', 'Aether Implosion', 'Retro Colossus'],
}
DESCRIPTIONS = {
    'S': ['A small, dry body fall with a light equipment rattle.', 'A soft magical puff with falling crystal overtones.', 'A short, rounded descending pulse with a physical landing.'],
    'M': ['A weightier body impact with a restrained armor rattle.', 'A soft impact dissolving into a low magical resonance.', 'A warm descending electronic hit and a short settling tail.'],
    'L': ['A heavy landing, a second settling impact and low rumble.', 'A deep magical collapse with a fading, airy crystal tail.', 'A bass-heavy descending defeat cue with audible upper harmonics.'],
}

OUT.mkdir(parents=True, exist_ok=True)
manifest = []
for index, (code, size, lengths) in enumerate(SIZES):
    for family, seconds in enumerate(lengths, 1):
        y = np.zeros(int(seconds*RATE))
        if family == 1:
            body = ['impactSoft_medium_000', 'impactSoft_heavy_001', 'impactPunch_heavy_000'][index]
            add(y, sample(body, [1.05, .95, .74][index]), .008, .82)
            add(y, sample('impactWood_light_001' if index == 0 else 'impactWood_heavy_000', [1.12, .9, .72][index]), .04, .25)
            add(y, sample('impactMetal_medium_000', [1.3, 1, .7][index], 3200), .1, [.025, .10, .12][index])
            if index == 2:
                add(y, fall(1.1, 88, 39, 4), .04, .22)
                add(y, sample('impactPunch_medium_001', .8, 2300), .27, .17)
                add(y, air(1.3, 210, 3.9), .09, .20)
        elif family == 2:
            add(y, sample('impactSoft_medium_000' if index == 0 else 'impactSoft_heavy_001', [1.1, .88, .7][index]), .01, .62)
            add(y, sample('impactGlass_light_001', [1.1, .8, .58][index], 4100), .035, [.18, .13, .1][index])
            add(y, fall(seconds*.85, [740, 430, 175][index], [250, 120, 43][index], [7.5, 4.5, 3.3][index]), .025, [.16, .22, .30][index])
            add(y, air(seconds*.88, [2800, 2100, 1300][index], [7.5, 4.8, 3.2][index]), .02, [.11, .16, .22][index])
            if index == 2:
                add(y, fall(1.35, 610, 320, 4), .16, .045)
                add(y, sample('impactWood_heavy_000', .72, 1800), .055, .21)
        else:
            add(y, sample('impactPunch_medium_001' if index < 2 else 'impactPunch_heavy_000', [1.12, .9, .69][index], 2800), .01, .50)
            add(y, fall(seconds*.9, [510, 340, 180][index], [110, 65, 37][index], [9, 5.3, 3.7][index], 'retro'), .008, [.30, .34, .40][index])
            add(y, air(seconds*.75, [1900, 1600, 900][index], [12, 7, 4.5][index]), .02, .07)
        name = code.lower()+str(family)+'-'+TITLES[code][family-1].lower().replace(' ', '-')
        wav = OUT/(name+'.wav')
        wavfile.write(wav, RATE, np.int16(stereo(y, [.55, .85, 1][index])*32767))
        mp3 = OUT/(name+'.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-af', f'loudnorm=I={-23+index}:TP=-3:LRA=6', '-ar', str(RATE), '-ac', '2', '-b:a', '128k', str(mp3)], check=True)
        wav.unlink()
        manifest.append({'code':code+str(family), 'group':code, 'size':size, 'family':family, 'title':TITLES[code][family-1], 'description':DESCRIPTIONS[code][family-1], 'seconds':seconds, 'file':mp3.name})
        print(code+str(family), mp3.name, seconds, flush=True)

# Same-size cues retain their mastered levels in these small → medium → large comparisons.
for family in [1, 2, 3]:
    parts = []
    for entry in [m for m in manifest if m['family'] == family]:
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(OUT/entry['file']), '-ar', str(RATE), '-ac', '2', '-f', 'f32le', 'pipe:1'])
        parts.extend([np.frombuffer(raw, np.float32).reshape(-1, 2), np.zeros((int(.45*RATE), 2))])
    wav = OUT/'comparison.wav'
    wavfile.write(wav, RATE, np.int16(np.clip(np.concatenate(parts), -.95, .95)*32767))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-b:a', '128k', str(OUT/f'set-{family}.mp3')], check=True)
    wav.unlink()
(OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
