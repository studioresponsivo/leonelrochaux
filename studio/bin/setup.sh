#!/usr/bin/env bash
# Prepara o ambiente (idempotente): Chrome do HyperFrames, modelo de transcrição Parakeet, OpenCV.
set -uo pipefail
ok() { echo "✓ $1"; }

npx -y hyperframes browser ensure >/dev/null 2>&1 && ok "chrome" || echo "✗ chrome (rode: npx hyperframes browser ensure)"

M="$HOME/.cache/hyperframes/parakeet/parakeet-tdt-0.6b-v3-int8"
if [ ! -s "$M/encoder.int8.onnx" ]; then
  mkdir -p "$M"
  B="https://huggingface.co/csukuangfj/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/resolve/2bda32ec70b097a55adaa07d9a7173915b43cc78"
  for f in encoder.int8.onnx decoder.int8.onnx joiner.int8.onnx tokens.txt; do curl -sS -L -o "$M/$f" "$B/$f"; done
fi
(cd /tmp && npx -y hyperframes models install parakeet >/dev/null 2>&1) && ok "parakeet" || echo "✗ parakeet (rede: libere huggingface.co e us.aws.cdn.hf.co)"

python3 -c "import cv2; cv2.CascadeClassifier" 2>/dev/null || pip install -q "opencv-python-headless<5" >/dev/null 2>&1
python3 -c "import cv2; cv2.CascadeClassifier" 2>/dev/null && ok "opencv" || echo "✗ opencv"
