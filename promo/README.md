# OXIDIZE · launch film

A 64-second launch film for the course. Every pixel and every sample is made by
code in this folder, with no stock footage, samples or downloaded music. The film
is an HTML stage rendered frame by frame in headless Chromium. The score is
synthesized with numpy. Both read the same cue sheet (`timing.json`), so picture
and sound stay in sync to the sample.

- `DIRECTION.md`: the director's treatment: idea, palette, type, motion
  grammar, shot-by-shot storyboard, score plan and quality bar.
- `timing.json`: the cue sheet: 120 BPM, 64 s, 60 fps, 1920×1080, and every cue
  in seconds.
- `engine.js` + `index.html`: the stage. `renderAt(T)` is a pure function of
  time, so any frame renders the same in any order.
- `scenes/s1-…s8-*.js`: one file per 8-second section.
- `music.py`: the score, synthesized sample by sample (numpy only, deterministic).
- `fonts/`: Sofia Sans Extra Condensed, JetBrains Mono and Atkinson Hyperlegible
  Next (OFL; licenses included).

The characters, bosses and island map come from the course itself
(`site/assets/cast-art.js`, `site/assets/rustopia.js`). Every error message,
command output and count on screen was taken from a real run: `rustc`,
`cargo forge`, `projects/tool-runner`, `quests/quests.toml` and the glossary.

## Rebuild

You need Node 20+ with Playwright and Chromium, Python 3 with numpy, and
ffmpeg with libx264.

```sh
# from the repo root
python3 promo/music.py                    # -> promo/out/music.wav  (about 25 s)
node promo/render.mjs --workers 4         # -> promo/out/frames/f%06d.jpg (3840 frames)
promo/encode.sh                           # -> promo/out/oxidize.mp4, oxidize-teaser.mp4, oxidize-poster.jpg
```

`promo/out/` is gitignored: the rendered frames, film, teaser, poster and WAV are
build outputs and are never committed. Rebuild them with the three commands above.

## Preview while editing

```sh
node promo/frame.mjs 30.0 /tmp/f.png              # one frame at T = 30.0 s
node promo/sheet.mjs 24 32 16 /tmp/sheet.png      # contact sheet: 16 frames over 24–32 s
node promo/serve.mjs                              # then open promo/index.html?t=12.5
                                                  # or ?play&from=24 (plays with music.wav)
python3 promo/music.py --stems                    # per-group stems in promo/out/stems/
```

## Outputs

| File | What |
|---|---|
| `out/oxidize.mp4` | The full film: 64.0 s, 1920×1080, 60 fps, H.264 (CRF 19, capped at 10 Mb/s), AAC 256k. About 80 MB. |
| `out/oxidize-teaser.mp4` | A 16 s cut (14–30 s): the wall of errors, the forge, the borrow checker. |
| `out/oxidize-poster.jpg` | The end card at 61.6 s, for thumbnails. |
| `out/music.wav` | The score: 48 kHz, stereo, 16-bit. |
