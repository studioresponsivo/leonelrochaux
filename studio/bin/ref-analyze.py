#!/usr/bin/env python3
"""Análise de referência de vídeo (sem libs além de numpy/cv2/ffmpeg).
Uso: analyze.py <video> <outdir> [--start S] [--end E] [--fps F] [--cols C] [--rows R]
Saída em <outdir>:
  sheet-NN.png   folhas de contato (F quadros/s, tempo absoluto em cada quadro)
  cuts.tsv       cortes secos detectados (tempo, score ffmpeg scene)
  motion.tsv     energia de movimento por frame (tempo, energia 0-255) + picos ("batidas") marcados
  onsets.tsv     onsets de áudio (tempo, força, centróide Hz, duração ms, classe)
  spectro.png    espectrograma 0-8 kHz com régua de tempo
  summary.txt    estatísticas (cortes, batidas, onsets por 10 s, classes)
"""
import sys, os, subprocess, argparse, math
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out')
ap.add_argument('--start', type=float, default=0.0); ap.add_argument('--end', type=float, default=None)
ap.add_argument('--fps', type=float, default=2.0); ap.add_argument('--cols', type=int, default=8); ap.add_argument('--rows', type=int, default=6)
ap.add_argument('--tile', type=int, default=0, help='largura do tile (0 = automático)')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
ROOT = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(ROOT, '..', 'assets', 'fonts-marca', 'articulat-700.woff2')

def sh(cmd, **kw):
    return subprocess.run(cmd, shell=True, check=True, capture_output=True, **kw)

# --- metadados
pr = sh(f'ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of csv=p=0 "{a.video}"').stdout.decode().split('\n')
W = H = 0; FPS = 30.0; DUR = 0.0
for l in pr:
    p = l.split(',')
    if p[0] == 'video':
        W, H = int(p[1]), int(p[2]); n, d = p[3].split('/'); FPS = float(n) / float(d)
    elif len(p) == 1 and p[0]:
        try: DUR = float(p[0])
        except: pass
start = a.start; end = a.end if a.end is not None else DUR; seg = end - start
land = W >= H
tile = a.tile or (240 if land else 150)

# --- folhas de contato
ts = f"%{{eif\\:t+{start}\\:d}}.%{{eif\\:mod((t+{start})*10\\,10)\\:d}}"
vf = (f"fps={a.fps},scale={tile}:-2,drawtext=fontfile='{FONT}':text='{ts}':x=5:y=5:fontsize={max(14, tile//12)}:"
      f"fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=3,tile={a.cols}x{a.rows}:padding=2:margin=2:color=0x202020")
sh(f'ffmpeg -v error -y -ss {start} -to {end} -i "{a.video}" -vf "{vf}" -vsync vfr "{a.out}/sheet-%02d.png"')
# nota: -ss depois de -i → t começa em 0 no segmento; o offset é somado no drawtext

# --- cortes (scene score) em resolução baixa
res = sh(f'ffmpeg -v info -y -ss {start} -to {end} -i "{a.video}" -vf "scale=320:-2,select=gt(scene\\,0.22),showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | cut -d: -f2')
cut_t = [start + float(x) for x in res.stdout.decode().split() if x]
# scores
res2 = sh(f'ffmpeg -v info -y -ss {start} -to {end} -i "{a.video}" -vf "scale=320:-2,select=gt(scene\\,0.22),metadata=print" -f null - 2>&1 | grep -o "scene_score=[0-9.]*" | cut -d= -f2')
scores = [float(x) for x in res2.stdout.decode().split() if x]
with open(f'{a.out}/cuts.tsv', 'w') as f:
    f.write('t\tscore\n')
    for t, s in zip(cut_t, scores + [0] * (len(cut_t) - len(scores))): f.write(f'{t:.3f}\t{s:.2f}\n')

# --- energia de movimento (frame diff em 160 px cinza)
gw, gh = 160, max(2, int(round(160 * H / W / 2)) * 2)
raw = sh(f'ffmpeg -v error -ss {start} -to {end} -i "{a.video}" -vf "scale={gw}:{gh}" -pix_fmt gray -f rawvideo -', ).stdout
nfr = len(raw) // (gw * gh)
fr = np.frombuffer(raw[:nfr * gw * gh], dtype=np.uint8).reshape(nfr, gh, gw).astype(np.float32)
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))  # nfr-1
mt = start + (np.arange(1, nfr) / FPS)
med = np.median(diff) + 1e-6
# picos: máximos locais acima de 1.6× mediana e ≥ 4, espaçados ≥ 0.25 s
peaks = []
win = max(1, int(FPS * 0.25))
for i in range(len(diff)):
    lo, hi = max(0, i - win), min(len(diff), i + win + 1)
    if diff[i] >= 1.6 * med and diff[i] >= 4 and diff[i] == diff[lo:hi].max():
        peaks.append(i)
with open(f'{a.out}/motion.tsv', 'w') as f:
    f.write('t\tenergy\tpeak\n')
    pk = set(peaks)
    for i in range(len(diff)):
        if i % max(1, int(FPS / 10)) == 0 or i in pk:
            f.write(f'{mt[i]:.3f}\t{diff[i]:.1f}\t{"*" if i in pk else ""}\n')

# --- áudio: onsets por fluxo espectral
SR = 22050
try:
    au = sh(f'ffmpeg -v error -ss {start} -to {end} -i "{a.video}" -vn -ac 1 -ar {SR} -f f32le -').stdout
    y = np.frombuffer(au, dtype=np.float32)
except subprocess.CalledProcessError:
    y = np.zeros(1, dtype=np.float32)
N, HOP = 1024, 256
if len(y) > N * 2:
    nfrm = 1 + (len(y) - N) // HOP
    idx = np.arange(N)[None, :] + HOP * np.arange(nfrm)[:, None]
    frames = y[idx] * np.hanning(N)[None, :]
    S = np.abs(np.fft.rfft(frames, axis=1))  # nfrm × 513
    freqs = np.fft.rfftfreq(N, 1 / SR)
    logS = np.log1p(S * 100)
    flux = np.maximum(0, np.diff(logS, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    # suavização leve
    k = np.ones(3) / 3; fl = np.convolve(flux, k, mode='same')
    ft = start + np.arange(nfrm) * HOP / SR
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    cent = (S * freqs[None, :]).sum(axis=1) / (S.sum(axis=1) + 1e-9)
    # limiar adaptativo: média + 2.2 desvios numa janela de ±1 s
    w = int(SR / HOP)
    ons = []
    minsp = int(0.08 * SR / HOP)
    last = -minsp
    for i in range(1, nfrm - 1):
        lo, hi = max(0, i - w), min(nfrm, i + w)
        loc = fl[lo:hi]; thr = loc.mean() + 2.2 * loc.std() + 0.5
        if fl[i] > thr and fl[i] >= fl[i - 1] and fl[i] >= fl[i + 1] and i - last >= minsp:
            # duração: até o RMS cair 12 dB abaixo do pico pós-onset (máx 1,5 s)
            pk = db[i:i + int(0.05 * SR / HOP) + 1].max()
            j = i
            while j < nfrm - 1 and db[j] > pk - 12 and (j - i) * HOP / SR < 1.5: j += 1
            dur = (j - i) * HOP / SR
            c = float(cent[i:i + 4].mean())
            if dur < 0.09 and c > 2500: cls = 'click'
            elif c < 900 and dur >= 0.12: cls = 'impact'
            elif dur >= 0.18: cls = 'whoosh'
            else: cls = 'tick'
            ons.append((ft[i], float(fl[i]), c, dur * 1000, cls, float(db[i:i+4].max())))
            last = i
    with open(f'{a.out}/onsets.tsv', 'w') as f:
        f.write('t\tstrength\tcentroid_hz\tdur_ms\tclass\tpeak_db\n')
        for o in ons: f.write(f'{o[0]:.3f}\t{o[1]:.1f}\t{o[2]:.0f}\t{o[3]:.0f}\t{o[4]}\t{o[5]:.1f}\n')
    # espectrograma 0–8 kHz
    import cv2
    maxb = int(8000 / (SR / N)) + 1
    spec = logS[:, :maxb].T  # bins × frames
    spec = (spec - spec.min()) / (spec.max() - spec.min() + 1e-9)
    img = (255 * spec[::-1]).astype(np.uint8)
    Wimg = int(min(4000, max(1200, seg * 40)))
    img = cv2.resize(img, (Wimg, 260), interpolation=cv2.INTER_AREA)
    img = cv2.applyColorMap(img, cv2.COLORMAP_INFERNO)
    canvas = np.zeros((300, Wimg, 3), np.uint8)
    canvas[:260] = img
    step = 1 if seg <= 40 else (5 if seg <= 200 else 10)
    for s in range(0, int(seg) + 1, step):
        x = int(s / seg * (Wimg - 1))
        cv2.line(canvas, (x, 255), (x, 275), (255, 255, 255), 1)
        cv2.putText(canvas, f'{start + s:.0f}', (x + 2, 292), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    for o in ons:
        x = int((o[0] - start) / seg * (Wimg - 1)); cv2.line(canvas, (x, 0), (x, 8), (0, 255, 0), 1)
    cv2.imwrite(f'{a.out}/spectro.png', canvas)
else:
    ons = []
    open(f'{a.out}/onsets.tsv', 'w').write('t\tstrength\tcentroid_hz\tdur_ms\tclass\tpeak_db\n')

# --- resumo
ints = np.diff(cut_t) if len(cut_t) > 1 else np.array([])
pt = [mt[i] for i in peaks]
pints = np.diff(pt) if len(pt) > 1 else np.array([])
from collections import Counter
cc = Counter(o[4] for o in ons)
with open(f'{a.out}/summary.txt', 'w') as f:
    f.write(f'video={a.video} {W}x{H} {FPS:.2f}fps segmento={start:.1f}-{end:.1f}s ({seg:.1f}s)\n')
    f.write(f'cortes secos: {len(cut_t)} (um a cada {seg/max(1,len(cut_t)):.1f}s); intervalos mediana={np.median(ints) if len(ints) else 0:.2f}s min={ints.min() if len(ints) else 0:.2f}s max={ints.max() if len(ints) else 0:.2f}s\n')
    f.write(f'tempos dos cortes: ' + ' '.join(f'{t:.1f}' for t in cut_t) + '\n')
    f.write(f'batidas de movimento: {len(pt)} ({len(pt)/max(1,seg)*10:.1f} por 10 s); intervalo mediano={np.median(pints) if len(pints) else 0:.2f}s\n')
    f.write(f'onsets de áudio: {len(ons)} ({len(ons)/max(1,seg)*10:.1f} por 10 s); classes={dict(cc)}\n')
    f.write(f'onsets fortes (top 25): ' + ' '.join(f'{o[0]:.1f}{o[4][0]}' for o in sorted(ons, key=lambda o: -o[1])[:25]) + '\n')
    f.write(f'folhas: {sorted(x for x in os.listdir(a.out) if x.startswith("sheet"))}\n')
print(open(f'{a.out}/summary.txt').read())
