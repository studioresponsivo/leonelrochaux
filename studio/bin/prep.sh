#!/usr/bin/env bash
# Baixa e transcreve um vídeo. Uso: studio/bin/prep.sh <link do Drive | id | arquivo local> <slug>
# Saída: work/<slug>/{source.mp4, transcript.json, transcript.txt}
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$1"; SLUG="$2"; W="$ROOT/work/$SLUG"
mkdir -p "$W"
"$ROOT/studio/bin/setup.sh" >/dev/null

if [ ! -s "$W/source.mp4" ]; then
  if [ -f "$SRC" ]; then cp "$SRC" "$W/source.mp4"
  else
    ID=$(echo "$SRC" | sed -E 's#.*/d/([^/?]+).*#\1#; s#.*[?&]id=([^&]+).*#\1#')
    curl -sS -L -o "$W/source.mp4" "https://drive.usercontent.google.com/download?id=$ID&export=download&confirm=t"
  fi
fi

if [ ! -s "$W/transcript.json" ]; then
  python3 "$ROOT/studio/bin/transcribe.py" "$W/source.mp4" "$W" || exit 1
fi

# transcrição compacta: uma linha por frase com o tempo de início (é o que o Claude lê)
node -e '
const w=JSON.parse(require("fs").readFileSync(process.argv[1]+"/transcript.json","utf8"));
let s="",st=null;const o=[];
const ts=x=>{const m=Math.floor(x/60);return m+":"+(x%60).toFixed(1).padStart(4,"0")+" ("+x.toFixed(1)+")"};
for(const x of w){if(st===null)st=x.start;s+=x.text+" ";if((/[.?!]$/.test(x.text)&&s.length>50)||s.length>170){o.push(ts(st)+" "+s.trim());s="";st=null}}
if(s)o.push(ts(st)+" "+s.trim());
require("fs").writeFileSync(process.argv[1]+"/transcript.txt",o.join("\n")+"\n");
' "$W"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/source.mp4")
RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$W/source.mp4")
echo "• $SLUG: ${DUR%.*}s, $RES, $(node -e 'console.log(require(process.argv[1]).length)' "$W/transcript.json") palavras → work/$SLUG/transcript.txt"
