#!/usr/bin/env python3
"""Laptop hey_jarvis → jarvis.lan orchestrator (D-0014). Run on the laptop, not bastion."""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
import wave
from io import BytesIO
from pathlib import Path

# Prefer CPU for openWakeWord / onnxruntime (LESSONS: CUDA warning is noise).
os.environ.setdefault("ORT_EXECUTION_PROVIDERS", "CPUExecutionProvider")
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")

ENV_PATH = Path.home() / ".config/jarvis-wake/env"
SESSION_PATH = Path.home() / ".config/jarvis-wake/session"
CACHE_DIR = Path.home() / ".cache/jarvis-wake"
DEFAULTS = {
    "ORCH_URL": "https://jarvis.lan",
    "WAKE_THR": "0.6",
    "WAKE_HITS": "3",
    "SILENCE_SEC": "0.85",
    "MIN_UTTER": "0.40",
    "MAX_UTTER": "8.0",
    "COOLDOWN_SEC": "2.0",
    "VERIFY_TLS": "0",
    "MIC_DEVICE": "",  # empty = system default; else index or substring of name
    "SESSION_ID": "",
}

RATE = 16000
CHUNK = 1280

# Drop before /v1/turns (STT noise / truncated wake tail).
_JUNK = frozenset(
    {
        "a",
        "ah",
        "eh",
        "hm",
        "hmm",
        "huh",
        "i",
        "mm",
        "oh",
        "ok",
        "okay",
        "the",
        "uh",
        "um",
        "er",
        "you",
        "yeah",
        "yep",
        "yes",
        "hey",
    }
)
_WAKE_PREFIX = re.compile(
    r"^\s*(?:hey[, ]+)?jarvis[,.! ]*",
    re.IGNORECASE,
)


def norm_cmd(s: str) -> str:
    s = (s or "").lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# Local only. Never sent to the orchestrator.
COMMANDS = {
    "stop": (
        "go away",
        "go away now",
        "you can go away",
        "you can go away now",
        "that will be all",
        "that'll be all",
        "that is all",
        "thats all",
        "that's all",
        "jarvis stop",
        "stop listening",
        "good night",
        "goodnight",
        "dismissed",
        "you are dismissed",
        "youre dismissed",
        "power down",
        "stand down",
    ),
    "pause": ("pause", "stand by", "standby", "hold on"),
    "resume": ("resume", "im back", "i m back", "listen up", "carry on", "continue listening"),
    "repeat": ("repeat", "say that again", "repeat that", "what did you say"),
    "mute_tts": ("mute replies", "text only", "dont speak", "do not speak"),
    "unmute_tts": ("unmute replies", "speak again", "you can talk"),
    "status": ("status", "are you listening"),
}


def match_cmd(text: str) -> str | None:
    n = norm_cmd(text)
    if not n:
        return None
    padded = f" {n} "
    for kind, phrases in COMMANDS.items():
        for ph in phrases:
            if n == ph or padded.find(f" {ph} ") >= 0:
                return kind
    return None


def cmd_help() -> str:
    lines = ["listener commands (not sent to JARVIS):"]
    for k, v in COMMANDS.items():
        lines.append(f"  {k:10}  {', '.join(v[:4])}")
    return "\n".join(lines)


def load_env(path: Path) -> dict[str, str]:
    d = dict(DEFAULTS)
    seen: set[str] = set()
    if not path.is_file():
        raise SystemExit(f"missing {path} — copy scripts/jarvis-wake.env.example (see INTERACT.md)")
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        key = k.strip()
        d[key] = v.strip().strip('"')
        seen.add(key)
    if "OWUI_URL" in seen and "ORCH_URL" not in seen:
        raise SystemExit(
            f"{path} still has OWUI_* only — set ORCH_URL=https://jarvis.lan (D-0014)"
        )
    if not d.get("ORCH_URL"):
        raise SystemExit(f"{path} missing ORCH_URL")
    return d


def env_float(cfg: dict[str, str], key: str) -> float:
    try:
        return float(cfg[key])
    except (KeyError, ValueError) as e:
        raise SystemExit(f"env {key} must be a number (got {cfg.get(key)!r})") from e


def env_int(cfg: dict[str, str], key: str) -> int:
    try:
        return int(float(cfg[key]))
    except (KeyError, ValueError) as e:
        raise SystemExit(f"env {key} must be an integer (got {cfg.get(key)!r})") from e


def env_bool(cfg: dict[str, str], key: str) -> bool:
    return str(cfg.get(key, "0")).strip().lower() in ("1", "true", "yes", "on")


def strip_wake_prefix(text: str) -> str:
    return _WAKE_PREFIX.sub("", text or "", count=1).strip()


def is_junk_transcript(text: str) -> bool:
    n = norm_cmd(text)
    if not n:
        return True
    tokens = n.split()
    if len(tokens) == 1 and tokens[0] in _JUNK:
        return True
    if len(n) < 2:
        return True
    return False


def with_retry(label: str, fn, *, tries: int = 2, delay: float = 0.6):
    last: Exception | None = None
    for i in range(tries):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001
            last = e
            transient = False
            msg = str(e).lower()
            if "timeout" in msg or "timed out" in msg:
                transient = True
            code = getattr(getattr(e, "response", None), "status_code", None)
            if code in (502, 503, 504):
                transient = True
            # requests ConnectionError / ReadTimeout
            ename = type(e).__name__
            if ename in ("ConnectionError", "ReadTimeout", "ConnectTimeout", "ChunkedEncodingError"):
                transient = True
            if i + 1 < tries and transient:
                print(f"{label} retry ({ename}: {e})", file=sys.stderr)
                time.sleep(delay)
                continue
            raise
    assert last is not None
    raise last


class Orch:
    """Glass front door → orchestrator /v1 (D-0012 / D-0014 / D-0016)."""

    def __init__(self, url: str, session_id: str | None = None, *, verify_tls: bool = False):
        import requests

        self.base = url.rstrip("/")
        self.session_id = (session_id or "").strip() or None
        self.s = requests.Session()
        self.s.headers["Accept"] = "application/json"
        self.s.verify = verify_tls
        if not verify_tls:
            try:
                requests.packages.urllib3.disable_warnings()  # type: ignore
            except Exception:
                pass

    def health(self) -> dict:
        r = self.s.get(self.base + "/health", timeout=10)
        r.raise_for_status()
        return r.json()

    def ensure_session(self) -> str:
        headers = {}
        if self.session_id:
            headers["X-Session-Id"] = self.session_id
        r = self.s.get(self.base + "/v1/session", headers=headers, timeout=30)
        r.raise_for_status()
        sid = r.json().get("session_id")
        if not sid:
            raise RuntimeError("no session_id")
        self.session_id = sid
        return sid

    def stt(self, wav: bytes) -> str:
        files = {"audio": ("utt.wav", wav, "audio/wav")}
        r = self.s.post(self.base + "/v1/stt", files=files, timeout=120)
        r.raise_for_status()
        return (r.json().get("transcript") or "").strip()

    def turn_text(self, text: str) -> str:
        assert self.session_id
        headers = {
            "X-Session-Id": self.session_id,
            "Content-Type": "application/json",
        }
        r = self.s.post(
            self.base + "/v1/turns",
            headers=headers,
            json={"text": text, "session_id": self.session_id},
            timeout=180,
        )
        r.raise_for_status()
        body = r.json()
        if body.get("session_id"):
            self.session_id = body["session_id"]
        return (body.get("reply_text") or "").strip()

    def speak(self, text: str) -> bytes:
        r = self.s.post(self.base + "/v1/tts", json={"text": text}, timeout=60)
        r.raise_for_status()
        return r.content


def wav_bytes(pcm) -> bytes:
    import numpy as np

    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(np.asarray(pcm, dtype=np.int16).tobytes())
    return buf.getvalue()


def beep():
    import numpy as np
    import sounddevice as sd

    t = np.linspace(0, 0.12, int(RATE * 0.12), False)
    tone = (0.18 * np.sin(2 * np.pi * 880 * t) * 32767).astype(np.int16)
    sd.play(tone, RATE)
    sd.wait()


def play_audio(data: bytes):
    import numpy as np
    import sounddevice as sd
    from shutil import which
    import subprocess

    suffix = ".wav" if data[:4] == b"RIFF" else ".mp3"
    path = CACHE_DIR / f"reply{suffix}"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)

    for cmd in (
        ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", str(path)],
        ["mpv", "--really-quiet", str(path)],
        ["paplay", str(path)],
    ):
        if which(cmd[0]):
            subprocess.run(cmd, check=False)
            return
    if suffix == ".wav":
        with wave.open(str(path), "rb") as w:
            pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
            sd.play(pcm, w.getframerate())
            sd.wait()
            return
    print("no ffplay/mpv/paplay — install ffmpeg", file=sys.stderr)


def resolve_mic(mic_spec: str):
    """Return sounddevice device arg: None (default), int index, or raise."""
    import sounddevice as sd

    spec = (mic_spec or "").strip()
    if not spec:
        return None
    if re.fullmatch(r"\d+", spec):
        return int(spec)
    devices = sd.query_devices()
    low = spec.lower()
    for i, d in enumerate(devices):
        if d.get("max_input_channels", 0) <= 0:
            continue
        name = str(d.get("name") or "")
        if low in name.lower():
            return i
    raise SystemExit(f"MIC_DEVICE={spec!r} matched no input device — try --list-devices")


def load_wake():
    import requests
    from openwakeword.model import Model

    cache = CACHE_DIR / "models"
    cache.mkdir(parents=True, exist_ok=True)
    base = "https://github.com/dscripka/openWakeWord/releases/download/v0.5.1/"
    files = {
        "hey_jarvis_v0.1.onnx": base + "hey_jarvis_v0.1.onnx",
        "melspectrogram.onnx": base + "melspectrogram.onnx",
        "embedding_model.onnx": base + "embedding_model.onnx",
    }
    for name, url in files.items():
        dest = cache / name
        if dest.exists() and dest.stat().st_size > 10000:
            continue
        print("download", name)
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        dest.write_bytes(r.content)
        print("saved", dest, dest.stat().st_size)
    jarvis = str(cache / "hey_jarvis_v0.1.onnx")
    melspec = str(cache / "melspectrogram.onnx")
    embed = str(cache / "embedding_model.onnx")
    try:
        return Model(
            wakeword_model_paths=[jarvis],
            melspec_onnx_model_path=melspec,
            embedding_onnx_model_path=embed,
        )
    except TypeError:
        try:
            return Model(wakeword_models=[jarvis], inference_framework="onnx")
        except TypeError:
            return Model(wakeword_model_paths=[jarvis])


def save_session(sid: str) -> None:
    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    SESSION_PATH.write_text(sid + "\n", encoding="utf-8")
    SESSION_PATH.chmod(0o600)


def wake_score(scores) -> float:
    score = 0.0
    if not isinstance(scores, dict):
        return score
    for k, v in scores.items():
        if "jarvis" in str(k).lower():
            try:
                score = max(score, float(v))
            except Exception:
                pass
    if score == 0.0:
        try:
            score = float(next(iter(scores.values())))
        except Exception:
            score = 0.0
    return score


def run_doctor(cfg: dict[str, str]) -> int:
    import sounddevice as sd

    print("=== jarvis-wake doctor ===")
    print(f"env file:     {ENV_PATH}  exists={ENV_PATH.is_file()}")
    print(f"ORCH_URL:     {cfg['ORCH_URL']}")
    print(f"VERIFY_TLS:   {env_bool(cfg, 'VERIFY_TLS')}")
    print(
        f"wake knobs:   thr={cfg['WAKE_THR']} hits={cfg['WAKE_HITS']} "
        f"silence={cfg['SILENCE_SEC']}s min={cfg['MIN_UTTER']}s "
        f"max={cfg['MAX_UTTER']}s cooldown={cfg['COOLDOWN_SEC']}s"
    )
    print(f"MIC_DEVICE:   {cfg.get('MIC_DEVICE') or '(default)'}")
    models = CACHE_DIR / "models"
    for name in ("hey_jarvis_v0.1.onnx", "melspectrogram.onnx", "embedding_model.onnx"):
        p = models / name
        ok = p.is_file() and p.stat().st_size > 10000
        print(f"model {name}: {'ok' if ok else 'MISSING'}  {p}")
    print("--- input devices ---")
    try:
        print(sd.query_devices())
        mic = resolve_mic(cfg.get("MIC_DEVICE") or "")
        if mic is None:
            info = sd.query_devices(kind="input")
            print(f"resolved mic: default → {info.get('name')!r}")
        else:
            print(f"resolved mic: index {mic} → {sd.query_devices(mic).get('name')!r}")
    except Exception as e:
        print(f"mic error: {e}")
        return 1
    api = Orch(cfg["ORCH_URL"], verify_tls=env_bool(cfg, "VERIFY_TLS"))
    try:
        h = with_retry("health", api.health)
        print(
            f"health: ok={h.get('ok')} degraded={h.get('degraded')} "
            f"llm={h.get('llm')} stt={h.get('stt')} tts={h.get('tts')} "
            f"version={h.get('version')}"
        )
        if not h.get("ok"):
            return 1
        for flag in ("llm", "stt", "tts"):
            if h.get(flag) is False:
                print(f"WARN: {flag} unavailable — listening will be degraded")
        api.ensure_session()
        print(f"session: {api.session_id}")
    except Exception as e:
        print(f"orchestrator unreachable: {e}")
        return 1
    print("doctor: OK")
    return 0


def main():
    ap = argparse.ArgumentParser(description="hey_jarvis laptop listener → jarvis.lan")
    ap.add_argument("--env", default=str(ENV_PATH))
    ap.add_argument("--list-devices", action="store_true")
    ap.add_argument("--commands", action="store_true")
    ap.add_argument("--doctor", action="store_true", help="check mic, models, /health")
    args = ap.parse_args()
    if args.commands:
        print(cmd_help())
        return

    import numpy as np
    import sounddevice as sd

    if args.list_devices:
        print(sd.query_devices())
        return

    cfg = load_env(Path(args.env))
    if args.doctor:
        raise SystemExit(run_doctor(cfg))

    wake_thr = env_float(cfg, "WAKE_THR")
    wake_hits = env_int(cfg, "WAKE_HITS")
    silence_sec = env_float(cfg, "SILENCE_SEC")
    min_utter = env_float(cfg, "MIN_UTTER")
    max_utter = env_float(cfg, "MAX_UTTER")
    cooldown_sec = env_float(cfg, "COOLDOWN_SEC")
    verify_tls = env_bool(cfg, "VERIFY_TLS")
    mic_dev = resolve_mic(cfg.get("MIC_DEVICE") or "")

    sid = (cfg.get("SESSION_ID") or "").strip()
    if not sid and SESSION_PATH.is_file():
        sid = SESSION_PATH.read_text(encoding="utf-8").strip()
    api = Orch(cfg["ORCH_URL"], sid or None, verify_tls=verify_tls)

    try:
        health = with_retry("health", api.health)
    except Exception as e:
        raise SystemExit(f"cannot reach orchestrator at {cfg['ORCH_URL']}: {e}") from e
    if health.get("stt") is False or health.get("tts") is False or health.get("llm") is False:
        print(
            f"WARN: health degraded llm={health.get('llm')} "
            f"stt={health.get('stt')} tts={health.get('tts')} "
            f"reason={health.get('reason')}",
            file=sys.stderr,
        )
        if health.get("stt") is False:
            raise SystemExit("STT unavailable — fix Whisper before listening")

    try:
        with_retry("session", api.ensure_session)
    except Exception as e:
        raise SystemExit(f"session failed: {e}") from e
    assert api.session_id
    save_session(api.session_id)

    mic_name = (
        sd.query_devices(mic_dev)["name"]
        if mic_dev is not None
        else sd.query_devices(kind="input")["name"]
    )
    print(
        f"mic={mic_name!r}  orch={cfg['ORCH_URL']}  "
        f"session={api.session_id[:8]}…  "
        f"thr={wake_thr} hits={wake_hits} cooldown={cooldown_sec}s"
    )
    print("headphones recommended (Piper can retrigger the wake word)")
    print("listening for hey_jarvis  Ctrl-C to stop")
    print(cmd_help())

    paused = False
    mute_tts = False
    last_reply = ""
    last_audio = b""
    ignore_until = 0.0
    oww = load_wake()
    hits = 0

    stream_kw: dict = {
        "samplerate": RATE,
        "channels": 1,
        "dtype": "int16",
        "blocksize": CHUNK,
    }
    if mic_dev is not None:
        stream_kw["device"] = mic_dev

    with sd.InputStream(**stream_kw) as stream:
        while True:
            frame, _ = stream.read(CHUNK)
            pcm = np.squeeze(frame)
            now = time.time()
            if now < ignore_until:
                hits = 0
                continue
            scores = oww.predict(pcm)
            score = wake_score(scores)
            if score >= wake_thr:
                hits += 1
            else:
                hits = 0
            if hits < wake_hits:
                continue
            hits = 0
            oww.reset()
            print("WAKE")
            beep()
            ignore_until = time.time() + cooldown_sec
            uttered = []
            silent = 0.0
            t0 = time.time()
            peak = 1.0
            while time.time() - t0 < max_utter:
                frame, _ = stream.read(CHUNK)
                chunk = np.squeeze(frame)
                uttered.append(chunk)
                rms = float(np.sqrt(np.mean(chunk.astype(np.float64) ** 2)))
                peak = max(peak, rms)
                floor = max(400.0, 0.22 * peak)
                dt = CHUNK / RATE
                if rms < floor:
                    silent += dt
                    if silent >= silence_sec and (time.time() - t0) >= min_utter:
                        break
                else:
                    silent = 0.0
            audio = np.concatenate(uttered) if uttered else np.zeros(1, dtype=np.int16)
            dur = audio.size / RATE
            if dur < min_utter:
                print("too short, ignore")
                ignore_until = time.time() + cooldown_sec
                continue
            print(f"utt {dur:.1f}s → STT")
            try:
                text = with_retry("STT", lambda: api.stt(wav_bytes(audio)))
            except Exception as e:
                print("STT error", e)
                ignore_until = time.time() + cooldown_sec
                continue
            text = strip_wake_prefix(text)
            print("heard:", text)
            if not text or is_junk_transcript(text):
                print("junk/empty transcript, ignore")
                ignore_until = time.time() + cooldown_sec
                continue
            cmd = match_cmd(text)

            def say_local(msg: str, *, force: bool = False):
                nonlocal last_audio, ignore_until
                print("local:", msg)
                if mute_tts and not force and cmd not in ("unmute_tts", "status", "stop"):
                    return
                try:
                    last_audio = with_retry("TTS", lambda: api.speak(msg))
                    play_audio(last_audio)
                except Exception as e:
                    print("TTS error", e)
                ignore_until = time.time() + cooldown_sec

            if cmd == "stop":
                say_local("Standing down.", force=True)
                raise SystemExit(0)
            if cmd == "pause":
                paused = True
                say_local("Standing by.")
                oww.reset()
                continue
            if cmd == "resume":
                paused = False
                say_local("Listening.")
                oww.reset()
                continue
            if cmd == "repeat":
                if last_audio:
                    print("repeat last")
                    play_audio(last_audio)
                    ignore_until = time.time() + cooldown_sec
                elif last_reply:
                    say_local(last_reply)
                else:
                    say_local("Nothing to repeat.")
                oww.reset()
                continue
            if cmd == "mute_tts":
                mute_tts = True
                print("local: replies muted")
                ignore_until = time.time() + cooldown_sec
                oww.reset()
                continue
            if cmd == "unmute_tts":
                mute_tts = False
                say_local("Speaking again.")
                oww.reset()
                continue
            if cmd == "status":
                say_local("Standing by." if paused else "Listening for hey jarvis.")
                oww.reset()
                continue
            if paused:
                say_local("Standing by. Say resume.")
                oww.reset()
                continue

            try:
                reply = with_retry("turn", lambda t=text: api.turn_text(t))
            except Exception as e:
                print("turn error", e)
                ignore_until = time.time() + cooldown_sec
                continue
            save_session(api.session_id or "")
            last_reply = reply or ""
            print("jarvis:", last_reply[:240])
            if last_reply and not mute_tts:
                try:
                    last_audio = with_retry("TTS", lambda: api.speak(last_reply))
                    play_audio(last_audio)
                except Exception as e:
                    print("TTS error", e)
            elif mute_tts:
                print("tts muted")
            ignore_until = time.time() + cooldown_sec
            oww.reset()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped")
