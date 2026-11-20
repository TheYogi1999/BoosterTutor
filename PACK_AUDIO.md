# Reliable pack audio — v0.93

A failed initial download left the previous HTML media element in a persistent
error state. Later openings reused that element, so its clock remained at zero
despite a running AudioContext and an enabled effects channel. Rewinding and
calling play again did not retry the resource.

Pack opening now uses the existing `assets/audio/pack-reveal.mp3` as a decoded
buffer, with a fresh one-shot Web Audio source for each opening. The file and its
level remain unchanged: gain 0.72, directly through the independent effects master.

- The clip warms on the first effects-enabled gesture and when a pack is opened.
  Failed downloads/decodes leave no stuck cache entry and get one bounded retry.
- The visible reveal starts playback. Travel stays silent; reduced motion and
  controller activation use the same path. Repeated input cannot duplicate a cue.
- Pending playback is tied to the pack array, index, screen and audio generation.
  Mute, 0% volume, hidden tabs, leaving the screen and moving to another pack cancel
  it. Re-enabling sound does not replay an obsolete opening.
- Slow loading can finish within the two-second reveal window without blocking
  gameplay. A later decode stays cached for the next opening, without stale audio.
- Active pack audio fades briefly when cancelled. Music mute/volume is independent.

The browser regression checks actual decoded audio samples, not merely a media
element's play state. It covers a failed first request followed by all six packs,
slow loading, reduced motion, controller/resume, and pending cancellation/recovery.

Validation: the dedicated pack-audio, pack-travel, independent-channel, selected
action-sound, intro-sound and rules/effects browser checks pass, along with 334
Node rule checks. The historical `tests/browser.test.cjs` passes its updated audio
checks, then stops at its unrelated `drop-ready` drag fixture (line 42); it is not
reported as a passing full-game check for this change.
