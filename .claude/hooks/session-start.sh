#!/bin/bash
# Prepara o ambiente de edição (Chrome do HyperFrames, modelo de transcrição Parakeet, OpenCV) em sessões na nuvem.
set -euo pipefail
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi
"$CLAUDE_PROJECT_DIR/studio/bin/setup.sh"
