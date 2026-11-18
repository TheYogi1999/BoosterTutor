# Coin auditions

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
