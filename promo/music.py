#!/usr/bin/env python3
"""OXIDIZE launch film: the score, synthesized sample by sample.

Writes promo/out/music.wav (48 kHz, stereo, 16-bit, exactly 64.0 s).
Deterministic: every noise source comes from a seeded generator.
No samples, no downloads, no external instruments. numpy only.

Usage:
    python3 promo/music.py            # writes promo/out/music.wav
    python3 promo/music.py --stems    # also writes promo/out/stems/*.wav
"""
import argparse
import json
import os
import sys
import time

import numpy as np

SR = 48000
DUR = 64.0
N = int(round(DUR * SR))          # 3_072_000 samples, exactly 64.0 s
HERE = os.path.dirname(os.path.abspath(__file__))
TIMING = os.path.join(HERE, "timing.json")
OUT_DIR = os.path.join(HERE, "out")
STEM_DIR = os.path.join(OUT_DIR, "stems")
SEED = 20260610

BPM = 120.0
BEAT = 60.0 / BPM                 # 0.5 s
BAR = 4 * BEAT                    # 2.0 s

with open(TIMING, "r", encoding="utf-8") as fh:
    CUE = json.load(fh)
C = CUE["cues"]


def t2i(t):
    """Seconds -> sample index (nearest)."""
    return int(round(float(t) * SR))


# ---------------------------------------------------------------- basics


def tvec(n):
    return np.arange(n, dtype=np.float64) / SR


def rng(tag):
    """Deterministic generator per voice: seeded by SEED plus a stable tag hash."""
    h = 0
    for ch in tag:
        h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return np.random.default_rng((SEED ^ h) & 0xFFFFFFFF)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
        "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10,
        "B": 11}


def nm(name):
    """'A4' -> midi 69, 'Bb2' -> 46, 'F#5' -> 78."""
    if name[1] in "#b":
        pc, octv = name[:2], int(name[2:])
    else:
        pc, octv = name[:1], int(name[1:])
    return NOTE[pc] + 12 * (octv + 1)


def hz(name):
    return midi_hz(nm(name))


# ---------------------------------------------------------------- filters


def _ssm_lp(x, a):
    """Time-varying one-pole: 512-sample chunks use the chunk-mean coefficient,
    and the filter state is carried across chunks, so the output is continuous."""
    a = np.broadcast_to(np.asarray(a, dtype=np.float64), x.shape)
    if np.ptp(a) < 1e-12:
        return _iir1_const(x, float(a[0]))
    # varying coefficient: process in chunks of constant-ish a
    y = np.empty_like(x)
    chunk = 512
    acc = 0.0
    for s in range(0, len(x), chunk):
        e = min(len(x), s + chunk)
        aa = float(np.mean(a[s:e]))
        seg = _iir1_const(x[s:e], aa, y0=acc)
        y[s:e] = seg
        acc = seg[-1]
    return y


def _iir1_const(x, a, y0=0.0):
    """Exact one-pole y[n] = (1-a) y[n-1] + a x[n], evaluated block by block.
    Each block is a convolution with the geometric kernel a(1-a)^j (via FFT),
    plus the carried state decayed by (1-a)^(j+1)."""
    p = 1.0 - a
    n = len(x)
    B = 2048
    y = np.empty(n)
    state = y0
    if n == 0:
        return y
    for s in range(0, n, B):
        xb = x[s:s + B]
        m = len(xb)
        j = np.arange(m)
        h = a * p ** j
        L = 1
        while L < 2 * m:
            L <<= 1
        yb = np.fft.irfft(np.fft.rfft(xb, L) * np.fft.rfft(h, L), L)[:m]
        yb = yb + state * p ** (j + 1)
        y[s:s + m] = yb
        state = yb[-1]
    return y


# ---------------------------------------------------------------- stereo helpers

def pan_mono(x, pan):
    """Constant-power pan. pan in -1..1 (left..right). Returns (2, n)."""
    th = (pan + 1) * np.pi / 4
    return np.vstack([np.cos(th) * x, np.sin(th) * x])


def add_stereo(dst, src, t0, gain=1.0):
    """Add a (2,n) or (n,) signal into a (2,N) buffer at t0."""
    if src.ndim == 1:
        src = np.vstack([src, src])
    i0 = t2i(t0)
    if i0 >= dst.shape[1]:
        return dst
    s0 = 0
    if i0 < 0:
        s0 = -i0
        i0 = 0
    n = min(src.shape[1] - s0, dst.shape[1] - i0)
    if n <= 0:
        return dst
    dst[:, i0:i0 + n] += gain * src[:, s0:s0 + n]
    return dst


def fft_convolve(x, h):
    """Linear convolution by FFT, returns same length as x (tail kept via separate pass)."""
    n = len(x) + len(h) - 1
    L = 1
    while L < n:
        L <<= 1
    return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(h, L), L)[:n]


def make_ir(seconds=2.2, decay=3.2, seed_tag="verb"):
    """Synthetic stereo impulse response: exponentially decaying noise, slightly
    decorrelated L/R, with a short pre-delay and a soft high-frequency roll-off
    so the tail stays warm."""
    g = rng(seed_tag)
    n = int(seconds * SR)
    t = tvec(n)
    env = np.exp(-decay * t / seconds * 2.0)
    l = g.standard_normal(n) * env
    r = g.standard_normal(n) * env
    # warm: one-pole low-pass that gets darker with time
    l = _iir1_const(l, 0.35)
    r = _iir1_const(r, 0.35)
    pre = int(0.012 * SR)
    l = np.concatenate([np.zeros(pre), l])[:n]
    r = np.concatenate([np.zeros(pre), r])[:n]
    # normalise energy: the wet level is set by the mix, not by IR amplitude
    k = 1.0 / np.sqrt(np.sum(l * l) + np.sum(r * r)) * 2.0
    return np.vstack([l * k, r * k])


def reverb(stereo_in, ir):
    """Stereo convolution reverb via FFT. stereo_in is (2,n); ir is (2,m)."""
    out_l = fft_convolve(stereo_in[0], ir[0])
    out_r = fft_convolve(stereo_in[1], ir[1])
    return np.vstack([out_l, out_r])[:, :stereo_in.shape[1]]


# ---------------------------------------------------------------- soft clip / norm


# ---------------------------------------------------------------- noise and filters

_NZ = [0]


def nz(n):
    """Seeded white noise. Call order is fixed, so the same script always gives the same noise."""
    _NZ[0] += 1
    return np.random.default_rng(SEED * 7919 + _NZ[0]).standard_normal(n)


def lp1(x, fc):
    """One-pole low-pass. fc scalar (Hz) or a per-sample array (sweeps)."""
    fca = np.asarray(fc, dtype=np.float64)
    if fca.ndim == 0:
        a = 1.0 - np.exp(-2.0 * np.pi * min(float(fca), SR * 0.45) / SR)
        return _iir1_const(x, a)
    a = 1.0 - np.exp(-2.0 * np.pi * np.clip(fca, 10.0, SR * 0.45) / SR)
    return _ssm_lp(x, a)


def hp1(x, fc):
    return x - lp1(x, fc)


def drive(x, k):
    """Tanh waveshaper, normalised so a unit input stays near unit output."""
    return np.tanh(k * x) / np.tanh(k)


# ---------------------------------------------------------------- oscillators

def _blep(ph, dt):
    """polyBLEP residual for a saw discontinuity at phase 0. dt is the per-sample phase increment."""
    dt = np.broadcast_to(dt, ph.shape)
    c = np.zeros_like(ph)
    m = ph < dt
    t = ph[m] / dt[m]
    c[m] = t + t - t * t - 1.0
    m = ph > 1.0 - dt
    t = (ph[m] - 1.0) / dt[m]
    c[m] = t * t + t + t + 1.0
    return c


def _phase(freq, n, ph0=0.0):
    inc = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,)) / SR
    ph = np.mod(np.cumsum(inc) + ph0, 1.0)
    return ph, inc


def saw(freq, n, ph0=0.0):
    """Band-limited saw (polyBLEP). freq may be scalar or per-sample."""
    ph, inc = _phase(freq, n, ph0)
    return 2.0 * ph - 1.0 - _blep(ph, inc)


def square(freq, n, ph0=0.0):
    """Band-limited square: difference of two phase-shifted polyBLEP saws."""
    ph, inc = _phase(freq, n, ph0)
    ph2 = np.mod(ph + 0.5, 1.0)
    s2 = 2.0 * ph2 - 1.0 - _blep(ph2, inc)
    s1 = 2.0 * ph - 1.0 - _blep(ph, inc)
    return s2 - s1


def sine_f(freq, n, ph0=0.0):
    """Sine with per-sample frequency; phase is the running integral of frequency."""
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2.0 * np.pi * np.cumsum(f) / SR + ph0)


def sweep(f0, f1, tau, n):
    """Exponential glide from f0 to f1 with time constant tau (seconds)."""
    t = tvec(n)
    return f1 + (f0 - f1) * np.exp(-t / tau)


# ---------------------------------------------------------------- envelopes

def env_ad(n, a, tau):
    """Raised-cosine attack over a seconds, then exponential decay with time constant tau."""
    t = tvec(n)
    r = 0.5 - 0.5 * np.cos(np.pi * np.minimum(t / a, 1.0))
    return r * np.exp(-t / tau)


def env_pad(n, att, rel):
    """Held envelope: raised-cosine attack, sustain at 1, raised-cosine release ending at n."""
    t = tvec(n)
    ra = 0.5 - 0.5 * np.cos(np.pi * np.minimum(t / att, 1.0))
    tr = (n / SR) - t
    rr = 0.5 - 0.5 * np.cos(np.pi * np.clip(tr / rel, 0.0, 1.0))
    return ra * rr


def fade_edges(sig, fi=0.004, fo=0.004):
    """Raised-cosine fades at both ends, so no voice starts or stops with a click."""
    n = len(sig)
    a = min(int(fi * SR), n // 2)
    b = min(int(fo * SR), n // 2)
    if a > 0:
        sig[:a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    if b > 0:
        sig[n - b:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(b) / b)
    return sig


# ---------------------------------------------------------------- percussion and impacts

def v_kick(amp=1.0):
    n = int(0.5 * SR)
    t = tvec(n)
    f = 46.0 + 120.0 * np.exp(-t / 0.028)
    body = drive(np.sin(2.0 * np.pi * np.cumsum(f) / SR), 1.4)
    click = lp1(hp1(nz(n), 3000.0), 9000.0) * np.exp(-t / 0.0025) * 0.35
    y = amp * (body * env_ad(n, 0.0012, 0.12) + click)
    return fade_edges(y, 0.0005, 0.01)


def v_snare(amp=1.0, body_f=190.0, noise_amt=0.55, dur=0.24, tau=0.11):
    n = int(dur * SR)
    t = tvec(n)
    f = body_f * (1.0 + 0.5 * np.exp(-t / 0.02))
    body = np.sin(2.0 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.0008, 0.07)
    rattle = lp1(hp1(nz(n), 1500.0), 9000.0) * env_ad(n, 0.0006, tau)
    return fade_edges(amp * (0.6 * body + noise_amt * rattle), 0.0005, 0.006)


def v_clap(amp=1.0):
    n = int(0.3 * SR)
    t = tvec(n)
    x = lp1(hp1(nz(n), 900.0), 2600.0)
    env = np.zeros(n)
    for dt in (0.0, 0.009, 0.019, 0.031):
        env += np.where(t >= dt, np.exp(-np.clip(t - dt, 0, None) / 0.006), 0.0)
    env += np.where(t >= 0.031, 0.7 * np.exp(-np.clip(t - 0.031, 0, None) / 0.12), 0.0)
    return fade_edges(amp * 0.8 * x * env, 0.0005, 0.01)


def v_hat(amp=0.3, open_=False):
    dur = 0.22 if open_ else 0.05
    n = int(dur * SR)
    t = tvec(n)
    x = lp1(hp1(hp1(nz(n), 6500.0), 6500.0), 13000.0)
    env = np.exp(-t / (0.07 if open_ else 0.018)) * (1.0 - np.exp(-t / 0.0008))
    return fade_edges(amp * x * env, 0.0003, 0.003)


def v_tom(f0=110.0, amp=1.0, dur=0.45, tau=0.2):
    n = int(dur * SR)
    t = tvec(n)
    f = f0 * (1.0 + 0.35 * np.exp(-t / 0.035))
    body = drive(np.sin(2.0 * np.pi * np.cumsum(f) / SR), 1.2)
    return fade_edges(amp * body * env_ad(n, 0.002, tau), 0.0005, 0.01)


def v_sub_drop(f0=90.0, f1=34.0, amp=1.0, dur=0.9, tau=0.25):
    n = int(dur * SR)
    f = sweep(f0, f1, tau, n)
    return fade_edges(amp * sine_f(f, n) * env_ad(n, 0.004, 0.45), 0.001, 0.01)


def v_boom(amp=1.0, dur=1.1):
    """Sine sweep 120 -> 38 Hz, the boom under the anvil."""
    n = int(dur * SR)
    f = sweep(120.0, 38.0, 0.18, n)
    body = drive(sine_f(f, n), 1.3)
    return fade_edges(amp * body * env_ad(n, 0.003, 0.28), 0.001, 0.01)


ANVIL_PARTIALS = ((1.00, 1.00, 0.55), (2.76, 0.55, 0.30), (5.40, 0.30, 0.16), (8.93, 0.16, 0.08))


def v_anvil(amp=1.0, f0=330.0):
    """Anvil strike: inharmonic partials at 1, 2.76, 5.40, 8.93 x f0, fast decays, plus a noise click."""
    n = int(1.4 * SR)
    t = tvec(n)
    y = np.zeros(n)
    for ratio, a, tau in ANVIL_PARTIALS:
        y += a * np.sin(2.0 * np.pi * f0 * ratio * t) * np.exp(-t / tau)
    y *= np.minimum(1.0, t / 0.0008)
    click = lp1(hp1(nz(n), 1500.0), 6500.0) * np.exp(-t / 0.003) * 0.7
    return fade_edges(amp * (y + click), 0.0002, 0.01)


def v_crash(amp=1.0, dur=3.2, tau=0.9):
    """Filtered noise crash with a long tail that darkens as it decays."""
    n = int(dur * SR)
    t = tvec(n)
    x = hp1(nz(n), 1200.0)
    x = lp1(x, 3000.0 + 9000.0 * np.exp(-t / 0.6))
    env = (1.0 - np.exp(-t / 0.004)) * np.exp(-t / tau)
    return fade_edges(amp * 0.6 * x * env, 0.001, 0.02)


def v_whoosh(dur, rise=True, lo=300.0, hi=8000.0, amp=1.0):
    """Filtered-noise sweep. rise: the band opens and the level swells into the end."""
    n = int(dur * SR)
    t = tvec(n)
    u = np.clip(t / dur, 0.0, 1.0)
    if not rise:
        u = 1.0 - u
    fc = lo * (hi / lo) ** u
    x = lp1(hp1(nz(n), 200.0), fc)
    level = u ** 1.8
    return fade_edges(amp * 0.9 * x * level, 0.002, 0.008)


def v_riser(dur, amp=1.0, f0=200.0, f1=4000.0, lo=300.0, hi=7000.0):
    """Riser: a saw sweeping f0 -> f1 (exponential) plus opening noise, both growing."""
    n = int(dur * SR)
    t = tvec(n)
    u = np.clip(t / dur, 0.0, 1.0)
    fq = f0 * (f1 / f0) ** u
    s = lp1(saw(fq, n), 1.5 * fq)
    noise = lp1(hp1(nz(n), 400.0), lo * (hi / lo) ** u)
    return fade_edges(amp * (0.35 * s * u ** 1.6 + 0.8 * noise * u ** 1.8), 0.003, 0.004)


def v_click(f=2400.0, amp=1.0):
    n = int(0.012 * SR)
    t = tvec(n)
    y = np.sin(2.0 * np.pi * f * t) * np.exp(-t / 0.0025)
    y += lp1(hp1(nz(n), 3000.0), 9000.0) * np.exp(-t / 0.0012) * 0.5
    return fade_edges(amp * y, 0.0003, 0.002)


def v_typeclick(amp=0.22):
    n = int(0.03 * SR)
    t = tvec(n)
    y = lp1(hp1(nz(n), 2000.0), 9000.0) * np.exp(-t / 0.003)
    return fade_edges(amp * y, 0.0002, 0.002)


def v_error_stab(amp=1.0, dur=0.3):
    """Dissonant low cluster D2 + Eb2 + Ab2, saw, low-passed with a closing filter."""
    n = int(dur * SR)
    t = tvec(n)
    y = sum(saw(midi_hz(m), n) for m in (38, 39, 44)) / 3.0
    y = lp1(y, 300.0 + 2200.0 * np.exp(-t / 0.08))
    return fade_edges(amp * drive(y, 2.0) * env_ad(n, 0.001, 0.12), 0.0005, 0.01)


def v_error_card(f, amp=1.0, dur=0.16):
    """Short distorted stab for one error card."""
    n = int(dur * SR)
    t = tvec(n)
    y = drive(saw(f, n), 4.0)
    y = lp1(y, 3200.0)
    return fade_edges(amp * y * env_ad(n, 0.001, 0.05), 0.0005, 0.01)


def v_buzz(amp=1.0, dur=0.26):
    n = int(dur * SR)
    t = tvec(n)
    y = drive(saw(85.0, n) + 0.8 * square(88.0, n), 3.0)
    y = lp1(y, 1400.0)
    return fade_edges(amp * 0.6 * y * env_ad(n, 0.003, 0.12), 0.001, 0.01)


def v_swell(amp=1.0, dur=0.4):
    """Reversed reverb swell. A dark noise burst with a decaying tail, reversed, so it grows into the hit."""
    n = int(dur * SR)
    t = tvec(n)
    x = lp1(nz(n), 1600.0) * np.exp(-t / 0.11)
    y = x[::-1].copy()
    return fade_edges(amp * y, 0.02, 0.002)


# ---------------------------------------------------------------- tonal voices

def v_drone(f, t0, t1, amp=1.0):
    """Sub drone: sine with a faint 2nd harmonic, low-passed, slowly breathing."""
    n = int((t1 - t0) * SR)
    t = tvec(n)
    y = np.sin(2.0 * np.pi * f * t) + 0.12 * np.sin(4.0 * np.pi * f * t)
    breath = 0.85 + 0.15 * np.sin(2.0 * np.pi * 0.11 * t)
    y = lp1(y * breath, 180.0)
    return amp * y * env_pad(n, 1.2, 0.4)


def v_bass(f, dur, amp=1.0, cut=380.0, square_mode=False):
    """Bass note: saw (or square) low-passed, plus a sub sine. Mono by design."""
    n = int(dur * SR)
    osc = square(f, n) if square_mode else saw(f, n)
    y = 0.6 * lp1(osc, cut) + 0.8 * np.sin(2.0 * np.pi * f * tvec(n))
    return fade_edges(amp * y * env_pad(n, 0.003, 0.03), 0.0005, 0.01)


def v_pluck(f, dur=0.5, amp=1.0):
    """Arp pluck: saw/square blend with a fast-closing filter and a short decay."""
    n = int(dur * SR)
    t = tvec(n)
    x = 0.5 * (saw(f, n) + square(f, n))
    x = lp1(x, 900.0 + 3800.0 * np.exp(-t / 0.05))
    return fade_edges(amp * x * env_ad(n, 0.0015, 0.12), 0.0005, 0.01)


def v_glass(f, amp=1.0, dur=2.4, f_from=None, glide_tau=0.12):
    """Glass pluck: a sine with a bright inharmonic partial and a fast partial. f_from gives a falling glide."""
    n = int(dur * SR)
    t = tvec(n)
    fq = f if f_from is None else f + (f_from - f) * np.exp(-t / glide_tau)
    ph = 2.0 * np.pi * np.cumsum(fq) / SR
    y = np.sin(ph) + 0.32 * np.sin(2.01 * ph) * np.exp(-t / 0.6) + 0.1 * np.sin(3.99 * ph) * np.exp(-t / 0.22)
    return fade_edges(amp * y * env_ad(n, 0.002, 1.1), 0.001, 0.01)


def v_bell(f, amp=1.0, dur=2.0, idx=2.5, tau=0.8):
    """FM bell: carrier f, modulator at 3.5 f with a decaying index (the bell's strike)."""
    n = int(dur * SR)
    t = tvec(n)
    I = idx * np.exp(-t / 0.35) + 0.15
    ph = 2.0 * np.pi * f * t + I * np.sin(2.0 * np.pi * 3.5 * f * t)
    y = np.sin(ph) + 0.25 * np.sin(2.0 * np.pi * 2.0 * f * t) * np.exp(-t / 0.3)
    return fade_edges(amp * y * env_ad(n, 0.0015, tau), 0.001, 0.02)


def v_chime(f, amp=1.0, dur=0.9, tau=0.35):
    n = int(dur * SR)
    t = tvec(n)
    y = np.sin(2.0 * np.pi * f * t) + 0.25 * np.sin(2.0 * np.pi * 2.0 * f * t) * np.exp(-t / 0.2)
    return fade_edges(amp * y * env_ad(n, 0.002, tau), 0.001, 0.01)


def v_blip(f, f_end=None, amp=1.0, dur=0.09, tau=0.03):
    n = int(dur * SR)
    fq = f if f_end is None else sweep(f, f_end, 0.02, n)
    return fade_edges(amp * sine_f(fq, n) * env_ad(n, 0.0015, tau), 0.0005, 0.005)


def v_tick(amp=0.2, f=3000.0):
    n = int(0.02 * SR)
    t = tvec(n)
    return fade_edges(amp * np.sin(2.0 * np.pi * f * t) * env_ad(n, 0.0003, 0.004), 0.0002, 0.002)


def v_lead(f, dur, amp=1.0):
    """Warm lead: saw plus square, light vibrato that fades in, low-passed."""
    n = int(dur * SR)
    t = tvec(n)
    vib = 1.0 + 0.006 * np.sin(2.0 * np.pi * 5.5 * t) * np.minimum(1.0, t / 0.4)
    fq = f * vib
    x = 0.6 * saw(fq, n) + 0.4 * square(fq, n)
    x = lp1(x, 2600.0)
    return fade_edges(amp * x * env_pad(n, 0.03, 0.09), 0.002, 0.01)


def v_stab(midis, dur=1.5, amp=1.0):
    """Brass-like stab: saw stack with a filter envelope that opens and closes."""
    n = int(dur * SR)
    t = tvec(n)
    y = sum(saw(midi_hz(m), n) for m in midis) / len(midis)
    y = lp1(y, 350.0 + 2600.0 * np.exp(-t / 0.18))
    return fade_edges(amp * drive(y, 1.5) * env_pad(n, 0.015, 0.5), 0.002, 0.01)


def v_supersaw(f, n, cutoff, amp=1.0, spread=0.75, seed=0):
    """Seven detuned polyBLEP saws, panned across the field and low-passed per channel.
    Returns (2, n). cutoff may be a scalar or a per-sample array."""
    g = np.random.default_rng(SEED * 31 + seed)
    cents = (-14.0, -8.0, -3.0, 0.0, 3.0, 8.0, 14.0)
    pans = np.linspace(-spread, spread, 7)
    L = np.zeros(n)
    R = np.zeros(n)
    for c, p in zip(cents, pans):
        s = saw(f * 2.0 ** (c / 1200.0), n, ph0=g.random())
        th = (p + 1.0) * np.pi / 4.0
        L += np.cos(th) * s
        R += np.sin(th) * s
    L = lp1(L, cutoff)
    R = lp1(R, cutoff)
    return amp * np.vstack([L, R]) / 7.0


def v_rev_cymbal(dur=0.25):
    """Reversed cymbal: a noise decay played backwards, so it swells into the cut it lands on."""
    n = int(dur * SR)
    t = tvec(n)
    x = lp1(hp1(nz(n), 2500.0), 10000.0) * np.exp(-t / 0.08)
    return fade_edges(0.45 * x[::-1].copy(), 0.01, 0.002)


def roll_times(t0, t1, i0=0.25, i1=0.0625):
    """Snare-roll onsets whose spacing shrinks exponentially from i0 (8ths) to i1 (32nds)."""
    out = []
    t = t0
    while t < t1 - 1e-9:
        out.append(t)
        frac = (t - t0) / (t1 - t0)
        t += i0 * (i1 / i0) ** frac
    return out


# ---------------------------------------------------------------- score plan (from timing.json)

def bar_t(b):
    """Bar number b (1-based) starts at 2*(b-1) seconds, per the cue sheet."""
    return (b - 1) * BAR


VOICING = {"Dm": [50, 53, 57, 62], "Bb": [46, 50, 53, 58], "F": [53, 57, 60, 65],
           "C": [48, 52, 55, 60], "D": [38, 50, 54, 57, 62, 66, 69, 74]}
ROOT = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "D": 38}
PENT = [0, 3, 5, 7, 10]          # D minor pentatonic


def chord_at(b):
    """Dm | Bb | F | C loop, with the lift Bb | C | F | Dm in bars 25-28 and the
    Picardy finale Bb | C | D | D in bars 29-32."""
    if 25 <= b <= 28:
        return ["Bb", "C", "F", "Dm"][b - 25]
    if 29 <= b <= 32:
        return ["Bb", "C", "D", "D"][b - 29]
    return ["Dm", "Bb", "F", "C"][(b - 1) % 4]


def kick_times():
    """Every kick onset in the film (also used as the side-chain trigger list)."""
    ks = []
    ks += [16.0]                                           # impact kick
    ks += [18.0 + 0.5 * k for k in range(0, 44)]          # 18.0 .. 39.5 four-on-floor
    ks += [40.0, 41.5]                                    # half-time bar 21
    ks += [42.0 + 0.5 * k for k in range(0, 9)]           # 42.0 .. 46.0
    ks += [48.0 + 0.5 * k for k in range(0, 16)]          # 48.0 .. 55.5
    ks += [56.0, 57.0]                                    # sparse tense groove
    return sorted(set(round(t, 6) for t in ks))


def clap_times():
    """Claps on beats 2 and 4 from bar 10, skipping bar 21 (half-time, clap on beat 3 at 41.0)."""
    ts = []
    for b in list(range(10, 24)) + list(range(25, 29)):
        if b == 21:
            continue
        ts += [bar_t(b) + 0.5, bar_t(b) + 1.5]
    ts += [41.0]
    return sorted(ts)


def hat_times(t_from, t_to, step=0.25):
    """8th-note hat grid with a slight swing on the offbeats."""
    ts = []
    t = t_from
    k = 0
    while t < t_to - 1e-9:
        ts.append(t + (0.012 if k % 2 else 0.0))
        t += step
        k += 1
    return ts


class Group:
    """One instrument group: a dry bus and a send bus (to the shared reverb)."""

    def __init__(self, name, send=0.0, delay=False, gated=True, duck=False):
        self.name = name
        self.send_amt = send
        self.delay = delay
        self.gated = gated
        self.duck = duck
        self.dry = np.zeros((2, N))
        self.snd = np.zeros((2, N))
        self.voices = []          # (start_s, end_s) of every placed voice, for the onset map

    def mono(self, sig, t0, gain=1.0, pan=0.0, send=None):
        self.voices.append((round(float(t0), 6), round(float(t0) + len(sig) / SR, 6)))
        st = pan_mono(sig, pan) * gain
        add_stereo(self.dry, st, t0, 1.0)
        s = self.send_amt if send is None else send
        if s > 0:
            add_stereo(self.snd, st, t0, s)

    def stereo(self, st, t0, gain=1.0, send=None):
        self.voices.append((round(float(t0), 6), round(float(t0) + st.shape[1] / SR, 6)))
        st = st * gain
        add_stereo(self.dry, st, t0, 1.0)
        s = self.send_amt if send is None else send
        if s > 0:
            add_stereo(self.snd, st, t0, s)


def duck_curve(hits, depth=0.6, rel=0.12, att=0.004):
    """Side-chain gain (1 at rest, dips by depth on each kick): -8 dB with a 120 ms release.
    Built from the kick onset list, so it is sample-exact and costs no filter pass."""
    h = np.asarray(hits, dtype=np.float64)
    t = tvec(N)
    idx = np.searchsorted(h, t, side="right") - 1
    valid = idx >= 0
    dt = np.maximum(t - h[np.clip(idx, 0, None)], 0.0)
    shape = (1.0 - np.exp(-dt / att)) * np.exp(-dt / rel)
    shape = np.where(valid, shape, 0.0)
    return 1.0 - depth * shape


def pingpong(st, d=0.375, fb=0.42):
    """Ping-pong delay: left feeds right and right feeds left, one dotted 8th apart.
    Computed in blocks of length d, so every block only reads finished earlier blocks."""
    D = int(round(d * SR))
    xL, xR = st[0], st[1]
    yL = xL.copy()
    yR = xR.copy()
    for s in range(D, N, D):
        e = min(N, s + D)
        yL[s:e] = xL[s:e] + fb * yR[s - D:e - D]
        yR[s:e] = xR[s:e] + fb * yL[s - D:e - D]
    return np.vstack([yL, yR])


def breath_gate(st):
    """Total silence from @breath (15.5) to @impact (16.0), with smooth edges.
    A 3 ms raised-cosine fade out before 15.5 and a 3 ms rise that ends exactly on 16.0,
    so the impact's first sample is never touched and nothing splatters into the band above 20 kHz."""
    i0 = t2i(C["breath"])
    i1 = t2i(C["impact"])
    f = int(0.003 * SR)
    mask = np.ones(st.shape[1])
    mask[i0 - f:i0] = 0.5 + 0.5 * np.cos(np.pi * np.arange(f) / f)
    mask[i0:i1 - f] = 0.0
    mask[i1 - f:i1] = 0.5 - 0.5 * np.cos(np.pi * np.arange(f) / f)
    return st * mask[None, :]


def finish(g, duck=None, ir=None, wet_level=0.9):
    dry = g.dry
    snd = g.snd
    if duck is not None:
        dry = dry * duck
        snd = snd * duck
    if g.delay and np.any(snd):
        snd = pingpong(snd)
    wet = np.zeros((2, N))
    if np.any(snd):
        wet = reverb(snd, ir) * wet_level
    out = dry + wet
    if g.gated:
        breath_gate(out)
    return out


# ---------------------------------------------------------------- composition

def chord_pad(ch, n, cut, seed):
    """Supersaw chord: 7 detuned saws per note, low-passed, slow attack. Returns (2, n)."""
    st = np.zeros((2, n))
    for i, m in enumerate(VOICING[ch]):
        st += v_supersaw(midi_hz(m), n, cut, amp=1.0, spread=0.75, seed=seed * 10 + i)
    return st * env_pad(n, 0.35, 0.25)


def compose():
    """Place every voice on the cue sheet. Every time below is read from timing.json."""
    gD = Group("drone", send=0.0)
    gB = Group("bass", send=0.0, duck=True)
    gR = Group("drums", send=0.12)
    gP = Group("pads", send=0.35, duck=True)
    gA = Group("arp", send=0.30)
    gG = Group("plucks", send=0.60, delay=True)
    gL = Group("lead", send=0.30)
    gE = Group("bells", send=0.50)
    gI = Group("impact", send=0.35)
    gF = Group("fx", send=0.35)
    gX = Group("breath", send=0.0, gated=False)

    # shared, precomputed voices (each is deterministic, so reuse is exact)
    KICK = v_kick(1.0)
    CLAP = v_clap(1.0)
    HAT = v_hat(1.0)
    SN = v_snare(1.0)
    SN_SMALL = v_snare(0.6, dur=0.12, tau=0.06)
    SN_BIG = v_snare(1.0, body_f=170.0, noise_amt=0.9, dur=0.3, tau=0.15)
    ANVIL = v_anvil(1.0)
    ANVIL_SM = v_anvil(0.35, f0=660.0)
    BOOM = v_boom(1.0)
    BOOM_SH = v_boom(0.7, dur=0.6)
    CRASH = v_crash(1.0)
    ERR_STAB = v_error_stab(1.0, 0.3)
    CARD_A = v_error_card(hz("D3"))
    CARD_B = v_error_card(hz("G#3"))
    BUZZ = v_buzz(1.0)
    SWELL = v_swell(1.0, 0.4)
    TOM_LOW = v_tom(62.0, amp=1.0, dur=0.7, tau=0.25)
    SUB_DROP = v_sub_drop(90.0, 34.0, amp=1.0)
    PULSE = v_bass(hz("D2"), 0.22, amp=1.0, cut=420.0, square_mode=True)
    REV = v_rev_cymbal(0.25)
    TICK = v_click(f=1800.0, amp=1.0)
    TYPE = v_typeclick(0.22)
    BASS_CACHE = {}
    PLUCK_CACHE = {}

    def bass_note(root, dur=0.22):
        key = (root, dur)
        if key not in BASS_CACHE:
            BASS_CACHE[key] = v_bass(midi_hz(root), dur, amp=1.0, cut=380.0)
        return BASS_CACHE[key]

    def pluck(m):
        if m not in PLUCK_CACHE:
            PLUCK_CACHE[m] = v_pluck(midi_hz(m), dur=0.3, amp=1.0)
        return PLUCK_CACHE[m]

    KS = kick_times()
    DUCK = duck_curve(KS)

    # ---- S1 INVISIBLE (0-8): drone, clock ticks, glass motif, error stab
    gD.mono(v_drone(hz("D1"), 0.0, 16.0, amp=0.55), 0.0, gain=0.5)
    for k, t in enumerate(hat_times(0.0, 8.0)):
        gR.mono(HAT, t, gain=0.12, pan=0.25 if k % 2 else -0.25)
    motif = [(0.75, "A4", -0.45), (2.0, "D5", 0.45), (3.0, "F5", -0.25),
             (4.5, "E5", 0.30), (6.0, "A4", -0.40)]
    for t, note, pan in motif:
        gG.mono(v_glass(hz(note), amp=1.0, dur=2.6), t, gain=0.25, pan=pan)
    gF.mono(ERR_STAB, C["errorFlash"], gain=0.8)

    # ---- S2 THE WALL (8-16): pulse bass grows, error cards, word hits, riser, snare roll
    for k in range(32):
        t = 8.0 + 0.25 * k
        gB.mono(PULSE, t, gain=0.35 * (0.25 + 0.75 * (t - 8.0) / 8.0))
    for k, t in enumerate(hat_times(8.0, 16.0)):
        gR.mono(HAT, t, gain=0.12, pan=0.25 if k % 2 else -0.25)
    for i, t in enumerate(C["errorCards"]):
        gF.mono(CARD_A if i % 2 == 0 else CARD_B, t, gain=0.55, pan=-0.8 if i % 2 == 0 else 0.8)
    for t in C["wordHits"]:
        gR.mono(TOM_LOW, t, gain=0.9)
        gD.mono(SUB_DROP, t, gain=0.5)
        gF.mono(SWELL, t - 0.4, gain=0.35)
    gF.mono(v_riser(3.5, amp=1.0), C["riserStart"], gain=0.8)
    roll = roll_times(14.0, C["breath"])
    for i, tr in enumerate(roll):
        frac = (tr - 14.0) / 1.5
        gR.mono(SN_SMALL, tr, gain=0.35 + 0.65 * frac)

    # ---- breath: total silence 15.5-16.0, except the reversed swell that ends on 16.0
    gX.mono(SWELL, C["impact"] - 0.4, gain=0.12)

    # ---- S3 IGNITION (16-24): the impact, then pads, groove, bass, sparkles, zoom riser
    gI.mono(ANVIL, C["impact"], gain=1.0)
    gI.mono(BOOM, C["impact"], gain=0.9)
    gI.mono(CRASH, C["impact"], gain=0.6)
    gR.mono(KICK, C["impact"], gain=0.8)
    for b in range(9, 33):
        ch = chord_at(b)
        t0 = bar_t(b)
        n = int(round((BAR + 0.25) * SR))
        cut = 2500.0
        if 56.0 <= t0 < 58.0:
            cut = 600.0                                  # pads filtered down, 56-58
        if ch == "D":
            cut = 20000.0                                # unfiltered finale chord
        if b == 27:                                      # filter sweep up into pullOut (52-54)
            u = np.clip(tvec(n) / BAR, 0.0, 1.0)
            cut = 400.0 * (6000.0 / 400.0) ** u
        pad = chord_pad(ch, n, cut, seed=b)
        gP.stereo(pad, t0, gain=(0.14 if ch == "D" else 0.2))
    for t in KS:
        if abs(t - C["impact"]) < 1e-6:
            continue
        gR.mono(KICK, t, gain=0.5)
    for k, t in enumerate(hat_times(18.0, 48.0)):
        if 44.0 <= t < 46.0:
            continue                                     # 16th-note hats take over in the boss bars
        gR.mono(HAT, t, gain=0.24, pan=0.25 if k % 2 else -0.25)
    for b in range(10, 29):
        root = ROOT[chord_at(b)]
        for k in range(8):
            gB.mono(bass_note(root), bar_t(b) + 0.25 * k, gain=0.35)
    for b in range(29, 31):
        root = ROOT[chord_at(b)]
        for k in range(2):
            gB.mono(bass_note(root, 0.4), bar_t(b) + 1.0 * k, gain=0.3)
    gB.mono(bass_note(ROOT["D"], 4.0), 60.0, gain=0.35)
    for t in clap_times():
        if t >= 48.0 and t < 56.0:
            gR.mono(CLAP, t, gain=0.3)
        elif t < 48.0 or t >= 56.0:
            gR.mono(CLAP, t, gain=0.5)
    for t in C["oxiHops"]:
        gE.mono(v_chime(hz("D6") if t < 19.0 else hz("G6"), amp=1.0, dur=0.9, tau=0.3), t, gain=0.5,
                pan=-0.5 if t < 19.0 else 0.5)
    gF.mono(v_whoosh(2.0, rise=True, lo=200.0, hi=6000.0), C["zoomStart"], gain=0.8)

    # ---- S4 OWNERSHIP (24-32): pluck arp, pops, refs, stamp, wipe whoosh
    arp_bars = list(range(13, 21)) + [22, 23] + list(range(25, 29))
    for b in arp_bars:
        ch = chord_at(b)
        tones = [m + 12 for m in VOICING[ch][:4]]
        g = 0.16 if b <= 20 or b in (22, 23) else 0.12
        for k in range(16):
            m = tones[[0, 1, 2, 3, 2, 1][k % 6]]
            gA.mono(pluck(m), bar_t(b) + 0.125 * k, gain=g, pan=-0.7 if k % 2 == 0 else 0.7)
    for t, pan in [(C["crabA"], -0.5), (C["leash"], 0.0), (C["leashPass"], 0.25), (C["ghost"], -0.35)]:
        gE.mono(v_blip(520.0, f_end=300.0, amp=0.8, dur=0.12, tau=0.05), t, gain=0.45, pan=pan)
    for t, pan in zip(C["refs"], (0.45, 0.6, 0.75)):
        gE.mono(v_blip(880.0, amp=0.8, dur=0.09, tau=0.03), t, gain=0.4, pan=pan)
    gI.mono(ANVIL, C["stamp"], gain=0.8)
    gI.mono(BOOM_SH, C["stamp"], gain=0.5)
    gR.mono(SN_BIG, C["stamp"], gain=0.8)
    gF.mono(v_whoosh(0.5, rise=True, lo=250.0, hi=9000.0), C["wipe"], gain=0.7)

    # ---- S5 MONTAGE (32-40): reverse cymbals and ticks on each cut, accents per vignette
    for c in C["montageCuts"]:
        gF.mono(REV, c - 0.25, gain=0.6)
        gI.mono(ANVIL_SM, c, gain=0.5)
    for i, m in enumerate([62, 65, 69, 74, 77, 81]):
        gG.mono(v_glass(midi_hz(m), amp=1.0, dur=1.6), 33.0 + 0.07 * i, gain=0.22,
                pan=-0.6 + 0.24 * i)
    gG.mono(v_glass(hz("A4"), amp=1.0, dur=1.8, f_from=hz("A5"), glide_tau=0.12), 35.0, gain=0.3)
    for i, t in enumerate((36.5, 37.0, 37.5)):
        gF.mono(TICK, t, gain=0.6, pan=-0.3 if i % 2 == 0 else 0.3)
    for t in (38.5, 39.0, 39.5):
        gE.mono(v_bell(hz("D6"), amp=1.0, dur=2.0), t, gain=0.4)
    gF.mono(v_whoosh(0.5, rise=True, lo=400.0, hi=10000.0), C["whip"], gain=0.85)

    # ---- S6 REAL COMPILER (40-48): half-time, typing clicks, error buzz, pass chime, boss, KO
    for k in range(12):
        gF.mono(TYPE, C["forgeCmd"] + 0.06 * k, gain=0.6, pan=-0.2 + 0.4 * (k % 3) / 2)
    gF.mono(BUZZ, C["forgeFail"], gain=0.6)
    gF.mono(v_whoosh(0.3, rise=True, lo=300.0, hi=3000.0), C["forgeFix"], gain=0.6)
    gE.mono(v_blip(1174.66, f_end=1760.0, amp=0.7, dur=0.08, tau=0.03), C["forgeFix"] + 0.3, gain=0.35)
    for i, f in enumerate([hz("F5"), hz("A5"), hz("C6"), hz("F6")]):
        gE.mono(v_bell(f, amp=0.9, dur=1.6, idx=1.6, tau=1.0), C["forgePass"] + 0.075 * i,
                gain=0.45 if i < 3 else 0.4, pan=-0.3 + 0.2 * i)
    for t in C["forgeHops"]:
        gE.mono(v_blip(hz("E5"), f_end=hz("A5"), amp=0.8, dur=0.09, tau=0.035), t, gain=0.4)
    for k in range(16):
        gR.mono(HAT, C["boss"] + 0.125 * k, gain=0.22, pan=0.25 if k % 2 else -0.25)
    for t in (44.0, 45.0, 46.0):
        gR.mono(v_tom(hz("D3"), amp=0.8, dur=0.4, tau=0.2), t, gain=0.6)
    for k, t in enumerate(C["bossHits"]):
        gR.mono(SN, t, gain=0.6)
        gR.mono(v_tom(midi_hz(50 + k), amp=1.0, dur=0.3, tau=0.12), t, gain=0.5)
    gI.mono(ANVIL, C["ko"], gain=0.9)
    gI.mono(v_crash(1.0, dur=3.2, tau=1.0), C["ko"], gain=0.6)
    gL.mono(v_stab([38, 50, 57, 62], dur=1.5, amp=1.0), C["ko"], gain=0.25)
    gF.mono(v_riser(1.5, amp=1.0, f0=200.0, f1=2000.0), C["ko"], gain=0.5)

    # ---- S7 JOURNEY (48-56): lead hook, stones, counters
    hook = [69, 72, 74, 77, 76, 74, 72, 69]
    for i in range(12):
        t = 50.0 + 0.5 * i
        if t < 56.0:
            gL.mono(v_lead(midi_hz(hook[i % 8]), 0.48, amp=1.0), t, gain=0.25, pan=0.0)
    for k, t in enumerate(C["stones"]):
        note = 50 + 12 * (k // 5) + PENT[k % 5]
        gE.mono(v_chime(midi_hz(note), amp=0.8, dur=0.5, tau=0.14), t, gain=0.35,
                pan=-0.7 + 1.4 * k / 20.0)
    for f, t in zip((hz("F5"), hz("A5"), hz("C6")), C["counters"]):
        gE.mono(v_chime(f, amp=1.0, dur=1.2, tau=0.5), t, gain=0.4)

    # ---- S8 SHIP IT (56-64): sparse tense groove, data ticks, riser and roll, D major finale
    for k, t in enumerate(hat_times(56.0, 58.0, step=0.5)):
        gR.mono(HAT, t, gain=0.14, pan=0.25 if k % 2 else -0.25)
    for t in np.arange(C["streamStart"], C["streamEnd"], 0.0625):
        f = (2800.0, 3600.0, 4400.0)[int(round(t * 16)) % 3]
        gF.mono(v_tick(amp=0.6, f=f), float(t), gain=0.5, pan=0.4 if int(round(t * 16)) % 2 else -0.4)
    gF.mono(v_riser(2.0, amp=1.0, f0=150.0, f1=6000.0, lo=300.0, hi=9000.0), C["collapse"], gain=0.9)
    for tr in roll_times(58.0, 59.95):
        frac = (tr - 58.0) / 1.95
        gR.mono(SN_SMALL, tr, gain=0.3 + 0.6 * frac)
    gI.mono(ANVIL, C["finalHit"], gain=1.0)
    gI.mono(v_crash(1.0, dur=3.2, tau=1.2), C["finalHit"], gain=0.7)
    gI.mono(BOOM, C["finalHit"], gain=0.9)

    groups = [gD, gB, gR, gP, gA, gG, gL, gE, gI, gF, gX]
    return groups, DUCK


# ---------------------------------------------------------------- master, measure, write

TARGET_PEAK = 10.0 ** (-1.05 / 20.0)       # -1.05 dBFS: peak never above -1 dBFS after dither
DRIVE_IN = 1.25                            # pre-clip drive for the soft clipper


def brickwall(x, f_lo=19000.0, f_hi=20000.0):
    """Exact frequency-domain low-pass: unity to 19 kHz, raised-cosine to zero at 20 kHz.
    Padded to a power of two, so the circular wrap cannot reach the signal."""
    n = x.shape[1]
    L = 1 << int(np.ceil(np.log2(2 * n)))
    f = np.fft.rfftfreq(L, 1.0 / SR)
    g = np.where(f <= f_lo, 1.0, np.where(f >= f_hi, 0.0,
                 0.5 + 0.5 * np.cos(np.pi * (f - f_lo) / (f_hi - f_lo))))
    g = g * (1.0 - np.exp(-(f / 6.0) ** 2))      # kill DC and sub-6 Hz drift exactly
    X = np.fft.rfft(x, L, axis=1)
    return np.fft.irfft(X * g[None, :], L, axis=1)[:, :n]


def master_linear(mix):
    """Gentle low cut below ~25 Hz (two cascaded one-poles), then the master fade to silence at 64.0."""
    x = mix.copy()
    for _ in range(2):
        x = x - np.vstack([lp1(x[0], 25.0), lp1(x[1], 25.0)])
    f0 = t2i(C["fadeOut"][0])
    L = N - f0
    env = np.ones(N)
    env[f0:] = 0.5 + 0.5 * np.cos(np.pi * np.arange(L) / L)
    return x * env


def write_wav_float(path, st):
    """32-bit float stereo WAV (format 3), used for the stems so nothing clips."""
    import struct
    data = np.ascontiguousarray(st.T.astype("<f4")).tobytes()
    fmt = struct.pack("<HHIIHH", 3, 2, SR, SR * 2 * 4, 2 * 4, 32)
    with open(path, "wb") as fh:
        fh.write(b"RIFF" + struct.pack("<I", 36 + len(data)) + b"WAVE")
        fh.write(b"fmt " + struct.pack("<I", len(fmt)) + fmt)
        fh.write(b"data" + struct.pack("<I", len(data)) + data)


def write_wav(path, st):
    """16-bit PCM stereo WAV with TPDF dither (seeded), using only the standard library."""
    import wave
    g = np.random.default_rng(SEED + 99)
    d = (g.random((2, st.shape[1])) - g.random((2, st.shape[1]))) / 32768.0
    q = np.clip(np.round(st * 32767.0 + d * 32767.0), -32768, 32767).astype("<i2")
    inter = np.empty((st.shape[1], 2), dtype="<i2")
    inter[:, 0] = q[0]
    inter[:, 1] = q[1]
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(inter.tobytes())


def db(x):
    return 20.0 * np.log10(max(float(x), 1e-12))


def section_rms(mono):
    rows = []
    for name in ("s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"):
        a, b = CUE["sections"][name]
        seg = mono[t2i(a):t2i(b)]
        rows.append((name, a, b, db(np.sqrt(np.mean(seg * seg))), db(np.max(np.abs(seg)))))
    return rows


def spectrum_check(mono):
    """Mean power spectrum over the whole track (Hann windows). Returns (dc, hf_frac, top_hz)."""
    dc = float(np.mean(mono))
    W, H = 4096, 2048
    win = np.hanning(W)
    nfr = (len(mono) - W) // H
    idx = np.arange(W)[None, :] + H * np.arange(nfr)[:, None]
    frames = mono[idx] * win[None, :]
    P = np.mean(np.abs(np.fft.rfft(frames, axis=1)) ** 2, axis=0)
    f = np.fft.rfftfreq(W, 1.0 / SR)
    total = np.sum(P[1:])
    hf = np.sum(P[f >= 20000.0]) / total
    level = 10 * np.log10(P / P.max() + 1e-20)
    above = f[level > -90.0]
    top = float(above.max()) if len(above) else 0.0
    return dc, hf, top, f, P


def spectrogram_image(mono, path, groups_marks):
    """Waveform on top, log spectrogram below (0-12 kHz), with cue markers. Written with PIL."""
    from PIL import Image, ImageDraw
    W, H = 1600, 900
    img = Image.new("RGB", (W, H), (11, 13, 16))
    dr = ImageDraw.Draw(img)
    # waveform: min/max per pixel column
    top_h = 300
    per = len(mono) / W
    for x in range(W):
        a = int(x * per)
        b = int((x + 1) * per)
        seg = mono[a:b]
        if len(seg) == 0:
            continue
        lo, hi = float(seg.min()), float(seg.max())
        y0 = top_h // 2 - int(hi * (top_h // 2 - 8))
        y1 = top_h // 2 - int(lo * (top_h // 2 - 8))
        dr.line([(x, y0), (x, max(y1, y0 + 1))], fill=(232, 89, 12))
    # spectrogram
    Wn, Hn = 2048, 1024
    win = np.hanning(Wn)
    nfr = (len(mono) - Wn) // Hn
    S = np.empty((nfr, Wn // 2 + 1), dtype=np.float32)
    for i in range(0, nfr, 512):
        j = min(nfr, i + 512)
        idx = np.arange(Wn)[None, :] + Hn * np.arange(i, j)[:, None]
        S[i:j] = 20 * np.log10(np.abs(np.fft.rfft(mono[idx] * win[None, :], axis=1)) + 1e-7)
    fmax = 12000.0
    kmax = int(fmax / (SR / Wn))
    S = S[:, :kmax]
    S = np.clip((S + 100.0) / 80.0, 0, 1)   # -100..-20 dB visible range
    stops = np.array([[0, 0, 0], [60, 20, 60], [200, 70, 20], [255, 140, 60], [255, 230, 190]], float)
    pos = np.linspace(0, 1, len(stops))
    rgb = np.stack([np.interp(S, pos, stops[:, c]) for c in range(3)], axis=-1).astype(np.uint8)
    spec_img = Image.fromarray(np.transpose(rgb, (1, 0, 2))[::-1]).resize((W, H - top_h - 40))
    img.paste(spec_img, (0, top_h + 40))
    # cue markers
    for t, label in groups_marks:
        x = int(t / DUR * W)
        dr.line([(x, 0), (x, H)], fill=(60, 200, 120), width=1)
        dr.text((x + 3, 4), label, fill=(60, 200, 120))
    dr.text((8, top_h + 12), "spectrogram 0-12 kHz (dB)", fill=(255, 244, 227))
    dr.text((8, 4), "waveform, 64 s, -1 dBFS ceiling", fill=(255, 244, 227))
    img.save(path)


def main():
    ap = argparse.ArgumentParser(description="Synthesize the OXIDIZE launch-film score.")
    ap.add_argument("--stems", action="store_true", help="also write each instrument group to out/stems/")
    ap.add_argument("--no-plot", action="store_true", help="skip the analysis PNG")
    args = ap.parse_args()
    t0 = time.time()
    os.makedirs(OUT_DIR, exist_ok=True)

    groups, DUCK = compose()
    onset_map = {g.name: g.voices for g in groups}
    with open(os.path.join(OUT_DIR, "music_onsets.json"), "w", encoding="utf-8") as fh:
        json.dump({"sample_rate": SR, "voices_s": onset_map}, fh, indent=0)
    ir = make_ir(2.2, 3.2, seed_tag="verb")
    outs = {}
    for g in groups:
        outs[g.name] = finish(g, duck=DUCK if g.duck else None, ir=ir)
    mix = np.zeros((2, N))
    for name, o in outs.items():
        if name != "breath":
            mix += o
    lin_main = master_linear(mix)
    lin_sw = master_linear(outs["breath"])
    # The main mix is gated after the clipper and brick-wall, so the breath is exactly silent,
    # then the reversed swell (the only sound in 15.5-16.0) is added back ungated.
    drv = breath_gate(brickwall(np.tanh(DRIVE_IN * lin_main))) + brickwall(np.tanh(DRIVE_IN * lin_sw))
    peak_drv = float(np.max(np.abs(drv)))
    scale = TARGET_PEAK / peak_drv
    master = drv * scale
    write_wav(os.path.join(OUT_DIR, "music.wav"), master)

    if args.stems:
        os.makedirs(STEM_DIR, exist_ok=True)
        lin_k = DRIVE_IN * scale          # stems are linear: they sum to the pre-clip mix at master gain
        for name, o in outs.items():
            s = master_linear_stem(o)
            if name != "breath":
                s = breath_gate(s)
            write_wav_float(os.path.join(STEM_DIR, f"{name}.wav"), s * lin_k)

    mono = master.mean(axis=0)
    print(f"[music] rendered {N} samples ({N / SR:.3f} s) in {time.time() - t0:.1f} s")
    print(f"[music] peak {db(np.max(np.abs(master))):.2f} dBFS, L/R peak "
          f"{db(np.max(np.abs(master[0]))):.2f} / {db(np.max(np.abs(master[1]))):.2f} dBFS")
    print("[music] RMS per section (mono):")
    for name, a, b, r, p in section_rms(mono):
        print(f"    {name} {a:5.1f}-{b:5.1f}s   RMS {r:7.2f} dBFS   peak {p:7.2f} dBFS")
    br = mono[t2i(C["breath"]):t2i(C["impact"])]
    print(f"[music] breath 15.5-16.0 s: RMS {db(np.sqrt(np.mean(br * br))):.2f} dBFS, "
          f"peak {db(np.max(np.abs(br))):.2f} dBFS")
    dc, hf, top, f, P = spectrum_check(mono)
    print(f"[music] DC mean {dc:.2e}; energy above 20 kHz {10 * np.log10(hf + 1e-20):.1f} dB; "
          f"highest bin above -90 dB rel. peak: {top:.0f} Hz")
    d = np.abs(np.diff(master, axis=1))
    print(f"[music] max sample-to-sample step {d.max():.4f} (L/R {d[0].max():.4f} / {d[1].max():.4f})")
    if not args.no_plot:
        marks = [(C["impact"], "IMPACT 16.0"), (C["stamp"], "E0502 30.0"),
                 (C["ko"], "K.O. 46.5"), (C["finalHit"], "FINAL D 60.0")]
        spectrogram_image(mono, os.path.join(OUT_DIR, "music_analysis.png"), marks)
        print(f"[music] wrote {os.path.join(OUT_DIR, 'music_analysis.png')}")
    print(f"[music] wrote {os.path.join(OUT_DIR, 'music.wav')} in {time.time() - t0:.1f} s total")


def master_linear_stem(o):
    """Stems carry the same low cut and fade as the master, but not the clipper."""
    return master_linear(o)


if __name__ == "__main__":
    main()
