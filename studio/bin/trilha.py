#!/usr/bin/env python3
"""Trilha de tensão sintética (drone + pulso + riser) para ganchos do canal EA FC.
Uso: studio/bin/trilha.py <saida.wav> --len 66 [--pulse 34.7] [--build 49] [--rise 60] [--end 65.1] [--seed 7]
Sem amostras externas: tudo gerado em numpy. Volume final no roteiro ("music": {"volume": 0.14})."""
import argparse, math, wave, struct
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("out"); ap.add_argument("--len", type=float, default=66); ap.add_argument("--pulse", type=float, default=None)
ap.add_argument("--build", type=float, default=None); ap.add_argument("--rise", type=float, default=None); ap.add_argument("--end", type=float, default=None)
ap.add_argument("--seed", type=int, default=7); ap.add_argument("--root", type=float, default=55.0)
a = ap.parse_args()
SR = 48000; N = int(a.len * SR); t = np.arange(N) / SR
rng = np.random.default_rng(a.seed)
end = a.end if a.end is not None else a.len

def env_ramp(t0, dur):  # 0 → 1 a partir de t0 em dur s (suave)
    x = np.clip((t - t0) / max(dur, 1e-3), 0, 1); return x * x * (3 - 2 * x)
def lowpass(x, fc):  # 1-polo
    al = math.exp(-2 * math.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = al * acc + (1 - al) * x[i]; y[i] = acc
    return y
def bandpass_noise(n, lo, hi):
    spec = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0; return np.fft.irfft(spec, n)

# ── drone: fundamental + quinta + oitava, dois osciladores detunados por canal ──
def drone(det):
    out = np.zeros(N)
    for mult, amp in ((1, 1.0), (1.5, 0.35), (2, 0.25), (3, 0.08)):
        f = a.root * mult + det * mult
        ph = 2 * math.pi * f * t + 0.6 * np.sin(2 * math.pi * 0.07 * t + mult)
        out += amp * (np.sin(ph) + 0.35 * np.sign(np.sin(ph)) * 0.5)  # leve saturação
    return out
L = drone(+0.35); R = drone(-0.35)
L = lowpass(L, 220); R = lowpass(R, 220)
lfo = 0.72 + 0.28 * np.sin(2 * math.pi * 0.09 * t)
dr = 0.5 + 0.5 * env_ramp(0, 3)  # entra em 3 s
if a.pulse is not None: dr = dr + 0.35 * env_ramp(a.pulse, 4)
L *= lfo * dr; R *= lfo * dr

# ── pad aéreo (ruído filtrado), cresce no build ──
pad = bandpass_noise(N, 600, 2400) * 0.05 * (0.4 + (env_ramp(a.build, 6) if a.build is not None else 0))
pad = lowpass(pad, 3000)

# ── pulso tipo batimento ("lub-dub") a partir de --pulse, dobra no build ──
pulse = np.zeros(N)
def hit(at, amp, f0=62, f1=38, dec=0.32):
    i0 = int(at * SR); n = int(0.5 * SR)
    if i0 >= N: return
    tt = np.arange(min(n, N - i0)) / SR
    f = f1 + (f0 - f1) * np.exp(-tt / 0.06)
    ph = 2 * math.pi * np.cumsum(f) / SR
    pulse[i0:i0 + len(tt)] += amp * np.sin(ph) * np.exp(-tt / dec) * (1 - np.exp(-tt / 0.004))
if a.pulse is not None:
    period = 0.75
    tt0 = a.pulse
    while tt0 < end:
        fast = a.build is not None and tt0 >= a.build
        amp = 0.5 * min(1, (tt0 - a.pulse) / 3 + 0.25)
        hit(tt0, amp); hit(tt0 + 0.17, amp * 0.6)
        if fast: hit(tt0 + period / 2, amp * 0.8)
        tt0 += period

# ── riser: ruído com passa-banda subindo + seno glissando, de --rise até end ──
riser = np.zeros(N)
if a.rise is not None and a.rise < end:
    i0, i1 = int(a.rise * SR), int(end * SR); n = i1 - i0
    tt = np.arange(n) / n
    noise = rng.standard_normal(n)
    # filtro "abrindo": mistura de ruído passa-baixa variável (aproximação por crossfade entre 3 bandas)
    b1 = np.fft.irfft(np.where(np.fft.rfftfreq(n, 1 / SR) < 500, np.fft.rfft(noise), 0), n)
    b2 = np.fft.irfft(np.where(np.fft.rfftfreq(n, 1 / SR) < 2500, np.fft.rfft(noise), 0), n)
    b3 = np.fft.irfft(np.where(np.fft.rfftfreq(n, 1 / SR) < 9000, np.fft.rfft(noise), 0), n)
    nz = b1 * (1 - tt) ** 2 + b2 * 2 * tt * (1 - tt) + b3 * tt ** 2
    gl = np.sin(2 * math.pi * np.cumsum(a.root * 2 * (1 + 3 * tt ** 2)) / SR)
    riser[i0:i1] = (0.18 * nz / (np.abs(nz).max() + 1e-9) + 0.12 * gl) * tt ** 1.6
    # golpe final
    hit(end - 0.06, 0.9, f0=70, f1=34, dec=0.5)

mix_l = L * 0.55 + pad + pulse * 0.9 + riser
mix_r = R * 0.55 + pad * 0.9 + pulse * 0.9 + riser
# fade final curto (o vídeo segue para o episódio)
tail = env_ramp(end + 0.35, 0.3); mix_l *= (1 - tail); mix_r *= (1 - tail)
peak = max(np.abs(mix_l).max(), np.abs(mix_r).max()) + 1e-9
k = 10 ** (-3 / 20) / peak
data = np.stack([mix_l * k, mix_r * k], axis=1)
with wave.open(a.out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(data, -1, 1) * 32767).astype("<i2").tobytes())
rms = 20 * math.log10(np.sqrt(np.mean(data ** 2)) + 1e-9)
print(f"• {a.out}: {a.len:.1f}s, pico -3 dBFS, RMS {rms:.1f} dBFS, pulso@{a.pulse} build@{a.build} rise@{a.rise}→{end}")
