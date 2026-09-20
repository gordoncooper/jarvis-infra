#!/usr/bin/env python3
"""Laptop hey_jarvis → jarvis.lan orchestrator (D-0014). Run on the laptop, not bastion."""
from __future__ import annotations

import argparse
import re
import sys
import time
import wave
from io import BytesIO
from pathlib import Path

ENV_PATH = Path.home() / ".config/jarvis-wake/env"
SESSION_PATH = Path.home() / ".config/jarvis-wake/session"
RATE = 16000
CHUNK = 1280
WAKE_THR = 0.6
WAKE_HITS = 3
SILENCE_SEC = 0.85
MAX_UTTER = 8.0
MIN_UTTER = 0.40


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


def load_env(path: Path) -> dict:
    d: dict[str, str] = {}
    if not path.is_file():
        raise SystemExit(f"missing {path} — see docs/INTERACT.md (ORCH_URL=https://jarvis.lan)")
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        d[k.strip()] = v.strip().strip('"')
    if d.get("OWUI_URL") and not d.get("ORCH_URL"):
        raise SystemExit(
            f"{path} still has OWUI_* — product wake uses ORCH_URL=https://jarvis.lan (D-0014)"
        )
    if not d.get("ORCH_URL"):
        raise SystemExit(f"{path} missing ORCH_URL")
    return d


class Orch:
    """Glass front door → orchestrator /v1 (D-0012 / D-0014 / D-0016)."""

    def __init__(self, url: str, session_id: str | None = None):
        import requests

        self.base = url.rstrip("/")
        self.session_id = (session_id or "").strip() or None
        self.s = requests.Session()
        self.s.headers["Accept"] = "application/json"
        self.s.verify = False
        try:
            requests.packages.urllib3.disable_warnings()  # type: ignore
        except Exception:
            pass

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
    path = Path("/tmp/jarvis-wake-reply").with_suffix(suffix)
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


def load_wake():
    import requests
    from openwakeword.model import Model

    cache = Path.home() / ".cache/jarvis-wake/models"
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


def main():
    ap = argparse.ArgumentParser(description="hey_jarvis laptop listener → jarvis.lan")
    ap.add_argument("--env", default=str(ENV_PATH))
    ap.add_argument("--list-devices", action="store_true")
    ap.add_argument("--commands", action="store_true")
    args = ap.parse_args()
    if args.commands:
        print(cmd_help())
        return

    import numpy as np
    import requests
    import sounddevice as sd

    if args.list_devices:
        print(sd.query_devices())
        return

    cfg = load_env(Path(args.env))
    sid = (cfg.get("SESSION_ID") or "").strip()
    if not sid and SESSION_PATH.is_file():
        sid = SESSION_PATH.read_text(encoding="utf-8").strip()
    api = Orch(cfg["ORCH_URL"], sid or None)
    try:
        api.ensure_session()
    except Exception as e:
        raise SystemExit(f"cannot reach orchestrator at {cfg['ORCH_URL']}: {e}") from e
    assert api.session_id
    save_session(api.session_id)

    print(
        f"mic default={sd.query_devices(kind='input')['name']!r}  "
        f"orch={cfg['ORCH_URL']}  session={api.session_id[:8]}…"
    )
    print("headphones recommended (Piper can retrigger the wake word)")
    print("listening for hey_jarvis  Ctrl-C to stop")
    print(cmd_help())

    paused = False
    mute_tts = False
    last_reply = ""
    last_audio = b""
    oww = load_wake()
    hits = 0

    with sd.InputStream(samplerate=RATE, channels=1, dtype="int16", blocksize=CHUNK) as stream:
        while True:
            frame, _ = stream.read(CHUNK)
            pcm = np.squeeze(frame)
            scores = oww.predict(pcm)
            score = 0.0
            if isinstance(scores, dict):
                for k, v in scores.items():
                    if "jarvis" in str(k).lower():
                        try:
                            score = max(score, float(v))
                        except Exception:
                            pass
            if score == 0.0 and isinstance(scores, dict):
                try:
                    score = float(next(iter(scores.values())))
                except Exception:
                    score = 0.0
            if score >= WAKE_THR:
                hits += 1
            else:
                hits = 0
            if hits < WAKE_HITS:
                continue
            hits = 0
            oww.reset()
            print("WAKE")
            beep()
            uttered = []
            silent = 0.0
            t0 = time.time()
            peak = 1.0
            while time.time() - t0 < MAX_UTTER:
                frame, _ = stream.read(CHUNK)
                chunk = np.squeeze(frame)
                uttered.append(chunk)
                rms = float(np.sqrt(np.mean(chunk.astype(np.float64) ** 2)))
                peak = max(peak, rms)
                floor = max(400.0, 0.22 * peak)
                dt = CHUNK / RATE
                if rms < floor:
                    silent += dt
                    if silent >= SILENCE_SEC and (time.time() - t0) >= MIN_UTTER:
                        break
                else:
                    silent = 0.0
            audio = np.concatenate(uttered) if uttered else np.zeros(1, dtype=np.int16)
            dur = audio.size / RATE
            if dur < MIN_UTTER:
                print("too short, ignore")
                continue
            print(f"utt {dur:.1f}s → STT")
            try:
                text = api.stt(wav_bytes(audio))
            except Exception as e:
                print("STT error", e)
                continue
            print("heard:", text)
            if not text:
                continue
            cmd = match_cmd(text)

            def say_local(msg: str, *, force: bool = False):
                nonlocal last_audio
                print("local:", msg)
                if mute_tts and not force and cmd not in ("unmute_tts", "status", "stop"):
                    return
                try:
                    last_audio = api.speak(msg)
                    play_audio(last_audio)
                except Exception as e:
                    print("TTS error", e)

            if cmd == "stop":
                say_local("Standing down.", force=True)
                raise SystemExit(0)
            if cmd == "pause":
                paused = True
                say_local("Standing by.")
                time.sleep(0.4)
                oww.reset()
                continue
            if cmd == "resume":
                paused = False
                say_local("Listening.")
                time.sleep(0.4)
                oww.reset()
                continue
            if cmd == "repeat":
                if last_audio:
                    print("repeat last")
                    play_audio(last_audio)
                elif last_reply:
                    say_local(last_reply)
                else:
                    say_local("Nothing to repeat.")
                time.sleep(0.4)
                oww.reset()
                continue
            if cmd == "mute_tts":
                mute_tts = True
                print("local: replies muted")
                time.sleep(0.3)
                oww.reset()
                continue
            if cmd == "unmute_tts":
                mute_tts = False
                say_local("Speaking again.")
                time.sleep(0.4)
                oww.reset()
                continue
            if cmd == "status":
                say_local("Standing by." if paused else "Listening for hey jarvis.")
                time.sleep(0.4)
                oww.reset()
                continue
            if paused:
                say_local("Standing by. Say resume.")
                time.sleep(0.4)
                oww.reset()
                continue

            try:
                reply = api.turn_text(text)
            except Exception as e:
                print("turn error", e)
                continue
            save_session(api.session_id or "")
            last_reply = reply or ""
            print("jarvis:", last_reply[:240])
            if last_reply and not mute_tts:
                try:
                    last_audio = api.speak(last_reply)
                    play_audio(last_audio)
                except Exception as e:
                    print("TTS error", e)
            elif mute_tts:
                print("tts muted")
            time.sleep(1.2)
            oww.reset()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped")
