#!/usr/bin/env bash
# Baixa um arquivo do Drive (conta hello@). Uso: eafc/bin/dl.sh <id-ou-link> <destino>
set -uo pipefail
ID=$(echo "$1" | sed -E 's#.*/d/([^/?]+).*#\1#; s#.*[?&]id=([^&]+).*#\1#'); OUT="$2"
[ -s "$OUT" ] && { echo "já existe: $OUT"; exit 0; }
mkdir -p "$(dirname "$OUT")"
for i in 1 2 3 4; do
  curl -sS -L --retry 2 -o "$OUT" "https://drive.usercontent.google.com/download?id=$ID&export=download&confirm=t" && [ -s "$OUT" ] && break
  sleep $((2**i))
done
if head -c 300 "$OUT" | grep -qi '<html'; then echo "✗ veio HTML em vez de arquivo: $OUT"; rm -f "$OUT"; exit 1; fi
echo "• $OUT ($(du -h "$OUT" | cut -f1))"
