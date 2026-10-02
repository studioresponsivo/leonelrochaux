# Transcreve áudio longo em blocos ≤ 14 min cortados em pausas (contorna bug do Parakeet > 15 min).
# Uso: transcribe.py <source.mp4> <workdir>  → <workdir>/transcript.json
import json, os, re, subprocess, sys
src, W = sys.argv[1], sys.argv[2]
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src]).decode())
# pausas (centro de cada silêncio ≥ 0,35 s)
log = subprocess.run(["ffmpeg", "-i", src, "-vn", "-af", "silencedetect=n=-35dB:d=0.35", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
mids = [(a + b) / 2 for a, b in zip(starts, ends)]
CH = 840.0
cuts, pos = [0.0], 0.0
while dur - pos > CH:
    target = pos + CH
    cand = [m for m in mids if pos + 600 < m <= target]
    pos = max(cand) if cand else target
    cuts.append(pos)
cuts.append(dur)
words = []
for i in range(len(cuts) - 1):
    a, b = cuts[i], cuts[i + 1]
    d = os.path.join(W, f"tx{i}")
    os.makedirs(d, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-t", str(b - a), "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-y", os.path.join(d, "a.wav")], check=True)
    r = subprocess.run("npx -y hyperframes transcribe a.wav --engine parakeet --language pt --dir .", shell=True, cwd=d, capture_output=True, text=True)
    f = os.path.join(d, "transcript.json")
    if not os.path.exists(f):
        sys.exit("✗ transcrição falhou no bloco %d: %s" % (i, (r.stdout + r.stderr)[-300:]))
    for w in json.load(open(f)):
        words.append({"text": w["text"], "start": round(w["start"] + a, 3), "end": round(w["end"] + a, 3)})
    subprocess.run(["rm", "-rf", d])
json.dump(words, open(os.path.join(W, "transcript.json"), "w"))
print(f"• {len(cuts) - 1} bloco(s), {len(words)} palavras")
