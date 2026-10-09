#!/usr/bin/env bash
# Encodes the rendered frames (promo/out/frames/f%06d.jpg, from render.mjs) and
# promo/out/music.wav into:
#   promo/out/oxidize.mp4          the full 64 s film (H.264 CRF 19 capped at 10 Mb/s, slow, yuv420p; AAC 256k)
#   promo/out/oxidize-teaser.mp4   the 14.0-30.0 s cut, with a 0.5 s audio fade in and out
# Usage: promo/encode.sh [frames_dir] [out_dir]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRAMES="${1:-$ROOT/promo/out/frames}"
OUT="${2:-$ROOT/promo/out}"
MUSIC="$OUT/music.wav"
FPS=60
DURATION=64

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found" >&2
  exit 1
fi
if [[ ! -f "$FRAMES/f000000.jpg" ]]; then
  echo "no frames at $FRAMES (run: node promo/render.mjs)" >&2
  exit 1
fi

# Frames must be contiguous over the range we encode.
check_range() {
  local first="$1" count="$2"
  local missing=0
  for ((k = first; k < first + count; k++)); do
    if [[ ! -f "$(printf '%s/f%06d.jpg' "$FRAMES" "$k")" ]]; then
      missing=$((missing + 1))
      if ((missing <= 5)); then echo "missing frame $k" >&2; fi
    fi
  done
  if ((missing > 0)); then
    echo "$missing frame(s) missing in $first..$((first + count - 1))" >&2
    exit 1
  fi
}

# Color: frames are full-range JPEG; convert to BT.709 limited range for H.264.
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
COLORTAGS=(-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv)
# The film grain changes every frame, so uncapped CRF spends ~100 Mb/s on noise.
# A 10 Mb/s cap is visually identical to the source, grain included, with
# headroom for the spark bursts and whip blur; the film is about 80 MB.
# Outputs stay in promo/out/, which is gitignored.
ENC=(-c:v libx264 -preset slow -crf 19 -maxrate 10M -bufsize 20M -profile:v high -movflags +faststart)

# --- full film ---------------------------------------------------------------
check_range 0 $((FPS * DURATION))
if [[ -f "$MUSIC" ]]; then
  ffmpeg -hide_banner -loglevel error -y \
    -framerate $FPS -start_number 0 -i "$FRAMES/f%06d.jpg" \
    -i "$MUSIC" \
    -map 0:v -map 1:a -vf "$VF" "${COLORTAGS[@]}" "${ENC[@]}" \
    -c:a aac -b:a 256k -t $DURATION \
    "$OUT/oxidize.mp4"
else
  echo "warning: $MUSIC missing, encoding video only" >&2
  ffmpeg -hide_banner -loglevel error -y \
    -framerate $FPS -start_number 0 -i "$FRAMES/f%06d.jpg" \
    -vf "$VF" "${COLORTAGS[@]}" "${ENC[@]}" -an -t $DURATION \
    "$OUT/oxidize.mp4"
fi
echo "wrote $OUT/oxidize.mp4"

# Poster: the end card at 61.6 s.
cp "$(printf '%s/f%06d.jpg' "$FRAMES" $((FPS * 616 / 10)))" "$OUT/oxidize-poster.jpg"
echo "wrote $OUT/oxidize-poster.jpg"

# --- teaser: 14.0 to 30.0 s ----------------------------------------------------
T_START=14
T_END=30
FIRST=$((T_START * FPS))
COUNT=$(((T_END - T_START) * FPS))
check_range $FIRST $COUNT
TEASER_SECS=$((T_END - T_START))
if [[ -f "$MUSIC" ]]; then
  ffmpeg -hide_banner -loglevel error -y \
    -framerate $FPS -start_number $FIRST -i "$FRAMES/f%06d.jpg" \
    -ss $T_START -t $TEASER_SECS -i "$MUSIC" \
    -map 0:v -map 1:a -frames:v $COUNT \
    -vf "$VF" "${COLORTAGS[@]}" "${ENC[@]}" \
    -c:a aac -b:a 256k \
    -af "afade=t=in:st=0:d=0.5,afade=t=out:st=$((TEASER_SECS - 1)).5:d=0.5" \
    -t $TEASER_SECS \
    "$OUT/oxidize-teaser.mp4"
else
  ffmpeg -hide_banner -loglevel error -y \
    -framerate $FPS -start_number $FIRST -i "$FRAMES/f%06d.jpg" \
    -frames:v $COUNT -vf "$VF" "${COLORTAGS[@]}" "${ENC[@]}" -an \
    "$OUT/oxidize-teaser.mp4"
fi
echo "wrote $OUT/oxidize-teaser.mp4"
