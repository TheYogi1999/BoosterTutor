# Enemy defeat sound auditions

Nine manually played sketches: S1–S3 small, M1–M3 medium, L1–L3 large. Family 1 is physical, 2 arcane and 3 retro. `set-1.mp3` through `set-3.mp3` compare small → medium → large with 450 ms gaps. The player selected **S3, M3 and L3** for gameplay in v0.77. The remaining variants and sets stay available as auditions. Choosing codes on the preview page does not change game settings.

## Recording sources

The bundled, unmodified OGG recordings in `source/` are from **Kenney Impact Sounds**, Creative Commons **CC0**. The author page identifies the pack and license: <https://kenney.nl/assets/impact-sounds>. Files were obtained from its public mirror at <https://github.com/Mcamento8/open-game-sfx-index/tree/34bbe8b525b5ceff3804915ea745532af11f6055/audio/impact-sounds>; the mirror's source index also links to the author pack. SHA-256 fingerprints are in `source/manifest.json`.

Selected recordings: `impactSoft_medium_000`, `impactSoft_heavy_001`, `impactWood_light_001`, `impactWood_heavy_000`, `impactPunch_medium_001`, `impactPunch_heavy_000`, `impactMetal_medium_000`, `impactGlass_light_001`. They are layered, pitched, filtered and faded with original deterministic tones/noise. No audio is extracted from reference games, film or branded intros.

## Reproduction and mastering

Run `python3 scripts/make-death-auditions.py` from the repository with numpy, scipy and ffmpeg installed. Source mixes are 44.1 kHz stereo. Samples use bounded peaks, short fades and restrained high frequencies; large variants carry more low-frequency weight and a longer tail. Target integrated loudness is -23 LUFS for small, -22 for medium and -21 for large, with a -3 dB true-peak ceiling, encoded as 128 kbps stereo MP3. Matching-set demos preserve these relative levels.

The responsive audition page has exclusive manual playback, its own preview volume, keyboard-accessible size tabs, saved selection codes and a clipboard fallback. Choosing a code does not apply it to the game.
