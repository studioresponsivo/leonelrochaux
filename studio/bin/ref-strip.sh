#!/usr/bin/env bash
# Tira quadro a quadro: strip.sh <video> <t0 em s> <n quadros> <saida.png> [largura do tile=200] [passo de quadros=1]
# Ex.: strip.sh motion/pl-02.mp4 12.4 16 out/strip-12.4.png 220  → 16 quadros consecutivos a partir de 12,4 s, em 2 linhas de 8
set -euo pipefail
V="$1"; T0="$2"; N="$3"; OUT="$4"; TW="${5:-200}"; STEP="${6:-1}"
FONT="$(cd "$(dirname "$0")/.." && pwd)/assets/fonts-marca/articulat-700.woff2"
COLS=8; ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -ss "$T0" -i "$V" -frames:v $((N * STEP)) \
  -vf "select=not(mod(n\,$STEP)),scale=$TW:-2,drawtext=fontfile='$FONT':text='%{eif\:t+$T0\:d}.%{eif\:mod((t+$T0)*100\,100)\:d}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.55,tile=${COLS}x${ROWS}:padding=2:margin=2:color=0x202020" \
  -vsync vfr -frames:v 1 "$OUT"
echo "$OUT"
