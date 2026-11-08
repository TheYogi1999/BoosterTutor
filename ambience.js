/* Background score stays separate from short effects and honours the master switch. */
(() => {
  const audio = new Audio('assets/audio/bards-tale.mp3');
  audio.id = 'background-music';
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;
  document.body.append(audio);
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch {} };
  const stored = Number(read('bt-music-volume', '35'));
  let volume = Number.isFinite(stored) ? Math.max(0, Math.min(100, stored)) : 35;
  let enabled = read('bt-music-enabled', 'true') !== 'false';
  let unlocked = false, fade = 0, generation = 0, failed = false;
  const dialog = document.getElementById('music-dialog');
  const slider = document.getElementById('music-volume');
  const toggle = document.getElementById('music-toggle');
  const wanted = () => unlocked && enabled && volume > 0 && state.soundOn && !document.hidden;
  function render() {
    slider.value = volume;
    document.getElementById('music-volume-value').value = `${volume}%`;
    toggle.textContent = enabled ? 'Music on' : 'Music off';
    toggle.setAttribute('aria-pressed', String(enabled));
    document.getElementById('music-status').textContent = !state.soundOn ? 'All audio is muted by SOUND OFF.' : !enabled || !volume ? 'Background music is muted.' : failed ? 'Music could not start. Click Music on to try again.' : !unlocked ? 'Music begins after your first click or key press.' : 'The Bard’s Tale · Medieval chiptune';
  }
  function stop() {
    generation++;
    cancelAnimationFrame(fade);
    audio.pause();
    audio.volume = 0;
  }
  function fadeTo(target) {
    cancelAnimationFrame(fade);
    const from = audio.volume, start = performance.now();
    const frame = now => {
      if (!wanted()) { stop(); return; }
      const t = Math.max(0, Math.min(1, (now - start) / 1400));
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t));
      if (t < 1) fade = requestAnimationFrame(frame);
    };
    fade = requestAnimationFrame(frame);
  }
  function sync() {
    render();
    if (!wanted()) { stop(); return; }
    const token = ++generation;
    // Call play synchronously inside the user gesture; guard its asynchronous result.
    audio.play().then(() => {
      if (token !== generation) return;
      if (!wanted()) { stop(); return; }
      failed = false;
      fadeTo(volume / 100 * .65);
      render();
    }).catch(() => {
      if (token !== generation) return;
      failed = true;
      render();
    });
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(100, Math.round(value)));
    save('bt-music-volume', volume);
    sync();
  }
  function unlock(event) {
    if (!event.isTrusted || (event.type === 'keydown' && (event.repeat || event.ctrlKey || event.metaKey || event.altKey))) return;
    if (unlocked && !failed) return;
    unlocked = true;
    sync();
  }
  document.addEventListener('pointerdown', unlock, {passive:true});
  document.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('ambience-paused', document.hidden);
    sync();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  document.getElementById('music-settings').addEventListener('click', () => { render(); dialog.showModal(); });
  document.getElementById('music-close').addEventListener('click', () => dialog.close());
  toggle.addEventListener('click', () => { enabled = !enabled; failed = false; save('bt-music-enabled', enabled); sync(); });
  slider.addEventListener('input', () => setVolume(Number(slider.value)));
  document.getElementById('music-quieter').addEventListener('click', () => setVolume(volume - 5));
  document.getElementById('music-louder').addEventListener('click', () => setVolume(volume + 5));
  document.getElementById('sound-toggle').addEventListener('click', sync);
  const stopEffects = soundEngine.stop.bind(soundEngine);
  soundEngine.stop = function () { stopEffects(); stop(); };
  audio.addEventListener('error', () => { failed = true; render(); });
  render();

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
})();
