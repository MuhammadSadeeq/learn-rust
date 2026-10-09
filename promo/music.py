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

def silence(n=N):
    return np.zeros(n, dtype=np.float64)


def tvec(n):
    return np.arange(n, dtype=np.float64) / SR


def rng(tag):
    """Deterministic generator per voice: seeded by SEED plus a stable tag hash."""
    h = 0
    for ch in tag:
        h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return np.random.default_rng((SEED ^ h) & 0xFFFFFFFF)


def place(buf, sig, t0, gain=1.0):
    """Add sig into buf starting at time t0 (seconds). Clips to buffer bounds."""
    i0 = t2i(t0)
    if i0 >= len(buf) or i0 + len(sig) <= 0:
        return buf
    s0 = 0
    if i0 < 0:
        s0 = -i0
        i0 = 0
    n = min(len(sig) - s0, len(buf) - i0)
    buf[i0:i0 + n] += gain * sig[s0:s0 + n]
    return buf


def env_adsr(n, a, d, s, r, hold=None):
    """Simple ADSR over n samples. a/d/r in seconds, s is sustain level 0..1.
    Every edge is a raised-cosine-ish ramp so there are no clicks. The release
    always ends at zero."""
    if hold is None:
        hold = n / SR
    out = np.zeros(n)
    na = max(1, int(a * SR))
    nd = max(1, int(d * SR))
    nr = max(1, int(r * SR))
    nh = int(hold * SR)
    i = 0
    # attack: 0 -> 1
    m = min(na, n)
    if m > 0:
        out[:m] = 0.5 - 0.5 * np.cos(np.pi * np.arange(m) / na)
    i = m
    # decay: 1 -> s, up to end of hold
    m2 = max(0, min(nd, nh - i, n - i))
    if m2 > 0:
        x = np.arange(m2) / nd
        out[i:i + m2] = s + (1 - s) * np.exp(-5.0 * x)
    i += max(0, min(nd, nh - (i if i < nh else i)))
    i = max(i, min(nh, n))
    # sustain until hold end
    if i < n and i < nh:
        out[i:min(nh, n)] = s
    # release from current level to zero, starting at hold end
    rs = max(0, min(nh, n))
    lvl = out[rs - 1] if rs > 0 else 0.0
    m3 = min(nr, n - rs)
    if m3 > 0:
        x = np.arange(m3) / nr
        out[rs:rs + m3] = lvl * (0.5 + 0.5 * np.cos(np.pi * x))
    # tail-safety: force the last 2 ms to zero
    fz = min(n, int(0.002 * SR))
    out[n - fz:] *= np.linspace(1, 0, fz) if fz > 0 else 1
    return out


def fade_edges(sig, fi=0.004, fo=0.004):
    """Short raised-cosine fades at both ends so no voice starts or stops with a click."""
    n = len(sig)
    a = min(int(fi * SR), n // 2)
    b = min(int(fo * SR), n // 2)
    if a > 0:
        sig[:a] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(a) / a)
    if b > 0:
        sig[n - b:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(b) / b)
    return sig


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

def onepole_lp(x, fc):
    """Time-varying-safe one-pole low-pass. fc may be scalar or per-sample array."""
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape)
    a = 1.0 - np.exp(-2.0 * np.pi * np.clip(fc, 1, SR * 0.45) / SR)
    y = np.empty_like(x)
    acc = 0.0
    # vectorised via scipy-free loop in blocks is slow; use recursive form via lfilter emulation
    return _ssm_lp(x, a)


def _ssm_lp(x, a):
    """Exact one-pole y[n] = y[n-1] + a[n]*(x[n]-y[n-1]) computed with a
    block-wise linear recurrence. For a constant a this is a plain IIR and is
    evaluated by repeated doubling; for varying a we fall back to chunks."""
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
    """y[n] = (1-b) y[n-1] + a x[n] with b = 1-a... implemented as
    y[n] = p*y[n-1] + a*x[n], p = 1-a, using a blocked closed form so it stays
    fast in numpy: y = sum_k p^(n-k) a x[k]."""
    p = 1.0 - a
    n = len(x)
    if n == 0:
        return x.copy()
    B = 2048
    y = np.empty(n)
    state = y0
    k = np.arange(B)
    pw = p ** (k + 1)
    # within block: y[j] = p^(j+1) state + sum_{k<=j} p^(j-k) a x[k]
    inv = p ** (-k) if p > 1e-12 else None
    for s in range(0, n, B):
        xb = x[s:s + B]
        m = len(xb)
        if p < 1e-9:
            yb = a * xb
            yb = yb.copy()
            yb[0] += 0.0
        else:
            # convolve with the geometric kernel h[j] = a p^j via FFT
            h = a * (p ** np.arange(m))
            L = 1
            while L < 2 * m:
                L <<= 1
            yb = np.fft.irfft(np.fft.rfft(xb, L) * np.fft.rfft(h, L), L)[:m]
            yb = yb + state * (p ** (np.arange(m) + 1))
        y[s:s + m] = yb
        state = yb[-1]
    return y


def biquad_coeffs(kind, fc, q=0.707, gain_db=0.0):
    """RBJ cookbook biquad coefficients, returned normalised (b0,b1,b2,a1,a2)."""
    w0 = 2 * np.pi * min(fc, SR * 0.45) / SR
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    A = 10 ** (gain_db / 40)
    if kind == "lp":
        b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
    elif kind == "hp":
        b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
    elif kind == "bp":
        b0 = alpha; b1 = 0.0; b2 = -alpha
        a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha
    elif kind == "peak":
        b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A
        a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A
    else:
        raise ValueError(kind)
    return np.array([b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0])


def biquad(x, coeffs):
    """Direct-form I biquad over a whole signal. Block-recursive via FFT is not
    exact for IIR feedback, so we run a lean python loop over 48 kHz samples in
    numba-free numpy with a 2nd-order recurrence vectorised over blocks of
    the feed-forward part and a short serial pass for the feedback."""
    b0, b1, b2, a1, a2 = coeffs
    n = len(x)
    # feed-forward first (vectorised), then serial feedback through a 2-pole recursion
    ff = b0 * x
    ff[1:] += b1 * x[:-1]
    ff[2:] += b2 * x[:-2]
    y = np.empty(n)
    y1 = y2 = 0.0
    fl = ff.tolist()
    out = [0.0] * n
    for i in range(n):
        v = fl[i] - a1 * y1 - a2 * y2
        out[i] = v
        y2 = y1
        y1 = v
    y[:] = out
    return y


def svf_lp_hp(x, fc, q=0.707):
    """Chamberlin/TPT-like state variable filter. Returns (lp, bp, hp).
    Serial in time; used only on short voices, so the python loop cost is fine."""
    f = 2 * np.sin(np.pi * min(fc, SR * 0.45) / SR)
    qq = 1.0 / q
    lp = np.empty_like(x); bp = np.empty_like(x); hp = np.empty_like(x)
    lo = bnd = 0.0
    xl = x.tolist()
    LP, BP, HP = [0.0] * len(xl), [0.0] * len(xl), [0.0] * len(xl)
    for i, v in enumerate(xl):
        hpv = v - lo - qq * bnd
        bnd += f * hpv
        lo += f * bnd
        LP[i] = lo; BP[i] = bnd; HP[i] = hpv
    lp[:] = LP; bp[:] = BP; hp[:] = HP
    return lp, bp, hp


def env_follow(x, attack=0.001, release=0.1):
    """Peak envelope follower (for side-chain detection). Vectorised by chunks."""
    a_att = np.exp(-1.0 / (attack * SR))
    a_rel = np.exp(-1.0 / (release * SR))
    ax = np.abs(x).tolist()
    out = [0.0] * len(ax)
    e = 0.0
    for i, v in enumerate(ax):
        if v > e:
            e = a_att * e + (1 - a_att) * v
        else:
            e = a_rel * e + (1 - a_rel) * v
        out[i] = e
    return np.array(out)


# ---------------------------------------------------------------- stereo helpers

def pan_mono(x, pan):
    """Constant-power pan. pan in -1..1 (left..right). Returns (2, n)."""
    th = (pan + 1) * np.pi / 4
    return np.vstack([np.cos(th) * x, np.sin(th) * x])


def stereo_from(l, r):
    return np.vstack([l, r])


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


def delay_line(x, delay_s, fb, n_out=None):
    """Feedback delay for a mono signal, implemented as a blocked recursion
    (delay >> block size keeps it exact, so we use the sample-accurate loop on
    the tail only). Returns the wet signal of length len(x)."""
    d = int(round(delay_s * SR))
    n = len(x) if n_out is None else n_out
    buf = np.zeros(n + d * 40)
    buf[:len(x)] = x
    # y[n] = x[n] + fb * y[n-d]; iterate in blocks of d (exact because d >= block)
    out = np.zeros(n + d * 40)
    out[:len(x)] = x
    for s in range(d, len(out), d):
        e = min(len(out), s + d)
        out[s:e] += fb * out[s - d:e - d]
    return out[:n]


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

def soft_clip(x, drive=1.0):
    return np.tanh(drive * x) / np.tanh(drive)


def dc_block(x, fc=20.0):
    """Gentle high-pass to remove DC and sub-rumble below ~25 Hz."""
    cf = biquad_coeffs("hp", fc, q=0.707)
    return biquad(x, cf)
