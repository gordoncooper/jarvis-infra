#!/usr/bin/env python3
"""Laptop hey_jarvis → jarvis.lan orchestrator (D-0014). Run on the laptop, not bastion."""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import wave
from io import BytesIO
from pathlib import Path

# Prefer CPU for openWakeWord / onnxruntime (LESSONS: CUDA warning is noise).
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["ORT_EXECUTION_PROVIDERS"] = "CPUExecutionProvider"

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
    # The lab has a real CA (scripts/install-lan-ca.sh). Verify by default and
    # let someone who has not installed it opt out, rather than shipping
    # verification off for everyone.
    "VERIFY_TLS": "1",
    # Speak each sentence as it arrives instead of waiting for the whole reply
    # (what glass does since v0.6.52). OFF by default: it is the one path that
    # cannot be tested without a speaker, so turning it on is a deliberate act
    # at the machine. `--selftest` exercises it headlessly first.
    "STREAM_REPLY": "0",
    # After a reply that asks a question ("Shall I remember…? Say yes or
    # cancel") listen this long without needing the wake word again.
    "FOLLOWUP_SEC": "12.0",
    # Speech loud enough to count as the answer during a follow-up window.
    "FOLLOWUP_RMS": "600",
    "MIC_DEVICE": "",  # empty = system default; else index or substring of name
    "SESSION_ID": "",
}

RATE = 16000
CHUNK = 1280

# Drop before /v1/turns (STT noise / truncated wake tail).
# Affirm/cancel for Hands confirm are NOT junk — see _CONFIRM_FORWARD.
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
        "hey",
    }
)
# Exact tokens always forwarded (orchestrator no-ops if nothing pending).
_CONFIRM_FORWARD = frozenset(
    {
        "yes",
        "yep",
        "yeah",
        "confirm",
        "cancel",
        "no",
        "nope",
        "ok",
        "okay",
        "stop",
        "abort",
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
# Single-token phrases match the whole utterance only (so "stop the music" stays a turn).
COMMANDS = {
    "stop": (
        "stop",
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
            if " " not in ph:
                if n == ph:
                    return kind
            elif n == ph or padded.find(f" {ph} ") >= 0:
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
    # Hands confirm replies must reach the orchestrator (D-0023).
    if len(tokens) == 1 and tokens[0] in _CONFIRM_FORWARD:
        return False
    if n in ("do it", "go ahead", "never mind"):
        return False
    if len(tokens) == 1 and tokens[0] in _JUNK:
        return True
    if len(n) < 2:
        return True
    return False


# Abbreviations whose dot does not end a sentence.
_ABBREV = re.compile(r"(?:^|\s)(?:e\.g|i\.e|etc|vs|approx|no|fig|dr|mr|mrs|st)\.$", re.I)


def split_sentences(buf: str) -> tuple[list[str], str]:
    """Split a growing reply into speakable sentences.

    Returns (complete_sentences, remainder). The remainder is whatever is not
    yet known to be a whole sentence and must stay buffered.

    The awkward cases are the ones that matter, because Piper reads the result
    aloud: `192.168.8.11` and `v0.6.40` must not become four sentences, and
    "e.g." must not end one. Same problem glass solved in core/speech.ts.
    """
    out: list[str] = []
    start = 0
    i = 0
    n = len(buf)
    while i < n:
        ch = buf[i]
        if ch == "\n":
            piece = buf[start:i].strip()
            if piece:
                out.append(piece)
            start = i + 1
        elif ch in ".!?":
            nxt = buf[i + 1] if i + 1 < n else ""
            prev = buf[i - 1] if i else ""
            # 192.168.8.11 / v0.6.40 / 3.5 — a dot between digits is not an end.
            if ch == "." and prev.isdigit() and nxt.isdigit():
                i += 1
                continue
            # Needs whitespace (or end of buffer) after it to be a boundary.
            if nxt and not nxt.isspace():
                i += 1
                continue
            candidate = buf[start : i + 1]
            if ch == "." and _ABBREV.search(candidate):
                i += 1
                continue
            piece = candidate.strip()
            if piece:
                out.append(piece)
            start = i + 1
        i += 1
    return out, buf[start:]


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

    def turn_text(self, text: str) -> dict:
        """Blocking turn. Returns the whole payload, not just the words.

        `confirm` drives the follow-up window and `route` says which capability
        answered — both are things the listener used to throw away.
        """
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
        body["reply_text"] = (body.get("reply_text") or "").strip()
        return body

    def turn_stream(self, text: str):
        """Streamed turn, yielding ("sentence", str) then ("done", payload).

        Same shape glass uses: sentences are emitted as tokens arrive so the
        first can be spoken while the rest is still being written. On a long
        reply that is the difference between two seconds of silence and
        fifteen.

        Any SSE failure raises, and the caller falls back to turn_text.
        """
        assert self.session_id
        headers = {
            "X-Session-Id": self.session_id,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        buf = ""
        payload: dict = {}
        with self.s.post(
            self.base + "/v1/turns",
            headers=headers,
            json={"text": text, "session_id": self.session_id},
            stream=True,
            timeout=180,
        ) as r:
            r.raise_for_status()
            event = ""
            for raw in r.iter_lines(decode_unicode=True):
                if raw is None:
                    continue
                line = raw.rstrip("\r")
                if line.startswith("event:"):
                    event = line[6:].strip()
                    continue
                if not line.startswith("data:"):
                    continue
                try:
                    data = json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    continue
                if event == "token":
                    buf += data.get("text") or ""
                    ready, buf = split_sentences(buf)
                    for piece in ready:
                        yield "sentence", piece
                elif event == "error":
                    raise RuntimeError(data.get("message") or "stream error")
                elif event == "done":
                    payload = data
        tail = buf.strip()
        if tail:
            yield "sentence", tail
        if payload.get("session_id"):
            self.session_id = payload["session_id"]
        payload["reply_text"] = (payload.get("reply_text") or "").strip()
        yield "done", payload

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
    import warnings

    import requests
    from openwakeword.model import Model

    warnings.filterwarnings(
        "ignore",
        message=".*CUDAExecutionProvider.*",
        category=UserWarning,
    )

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
    # Prefer onnx + explicit paths; openWakeWord may still probe CUDA — warning filtered above.
    try:
        return Model(
            wakeword_model_paths=[jarvis],
            melspec_onnx_model_path=melspec,
            embedding_onnx_model_path=embed,
            inference_framework="onnx",
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
        save_session(api.session_id)
    except Exception as e:
        print(f"orchestrator unreachable: {e}")
        return 1
    print("doctor: OK")
    return 0


def speak_streamed(api, text, *, synth, play, log=print) -> dict:
    """Speak a reply sentence by sentence, rendering ahead of playback.

    A worker renders the next clip while the current one is playing. Doing it
    the obvious way instead — render, play, render, play — leaves a
    render-length silence between every sentence; glass shipped that bug once
    and `jarvis-app/docs/ARCHITECTURE.md` records the fix, so this does not
    repeat it.

    `synth` and `play` are injected so the ordering can be tested without a
    speaker. Returns the done payload.
    """
    import queue
    import threading

    clips: "queue.Queue" = queue.Queue(maxsize=2)
    payload: dict = {}
    spoken: list[str] = []
    failure: list[BaseException] = []

    def render() -> None:
        try:
            for kind, item in api.turn_stream(text):
                if kind == "sentence":
                    spoken.append(item)
                    clips.put((item, synth(item)))
                else:
                    payload.update(item)
        except BaseException as e:  # noqa: BLE001 — handed to the caller
            failure.append(e)
        finally:
            clips.put(None)

    worker = threading.Thread(target=render, name="tts-render", daemon=True)
    worker.start()
    while True:
        item = clips.get()
        if item is None:
            break
        sentence, clip = item
        log(f"  say: {sentence[:70]}")
        play(clip)
    worker.join(timeout=5)
    if failure:
        raise failure[0]
    if not payload.get("reply_text"):
        payload["reply_text"] = " ".join(spoken)
    return payload


SELFTEST_UTTERANCES = [
    "what time is it?",
    "anything broken?",
    "why is the sky blue?",
]


def run_selftest(cfg: dict[str, str]) -> int:
    """Exercise the reply path end to end without a microphone or speaker.

    Everything between "the words arrived" and "audio comes out" is testable
    headlessly, and it is the half most likely to be wrong: SSE framing,
    sentence splitting, and how soon the first clip could start playing. Run
    it from anywhere that can reach the orchestrator.

    Prints time-to-first-sentence against total, which is the whole argument
    for streaming; TTS is timed for the first sentence only so the number
    means "how long before Gordon hears something".
    """
    verify_tls = env_bool(cfg, "VERIFY_TLS")
    api = Orch(cfg["ORCH_URL"], None, verify_tls=verify_tls)
    print(f"orch={cfg['ORCH_URL']} verify_tls={verify_tls}")
    try:
        h = with_retry("health", api.health)
    except Exception as e:
        print(f"FAIL: cannot reach orchestrator: {e}")
        return 1
    print(f"health: {h.get('version')} degraded={h.get('degraded')} "
          f"llm={h.get('llm')} stt={h.get('stt')} tts={h.get('tts')}")
    with_retry("session", api.ensure_session)
    print(f"session: {api.session_id}")

    bad = 0
    for text in SELFTEST_UTTERANCES:
        print(f"\n> {text}")
        # --- blocking, the default path
        t0 = time.time()
        try:
            body = api.turn_text(text)
            blocking = time.time() - t0
            print(f"  blocking : reply in {blocking:5.1f}s  route={body.get('route')}")
        except Exception as e:
            print(f"  blocking : FAIL {type(e).__name__}: {e}")
            bad += 1
            continue
        # --- streamed
        t0 = time.time()
        first = None
        sentences = []
        payload = {}
        try:
            for kind, item in api.turn_stream(text):
                if kind == "sentence":
                    if first is None:
                        first = time.time() - t0
                    sentences.append(item)
                else:
                    payload = item
            total = time.time() - t0
        except Exception as e:
            print(f"  streamed : FAIL {type(e).__name__}: {e}")
            bad += 1
            continue
        print(f"  streamed : first sentence in {first:5.1f}s, "
              f"{len(sentences)} sentence(s), done in {total:5.1f}s")
        joined = " ".join(sentences)
        said = (payload.get("reply_text") or "").strip()
        if said and joined.replace(" ", "") != said.replace(" ", "").replace("\n", ""):
            print("  WARN: spoken text differs from reply_text")
            print(f"        spoken: {joined[:90]!r}")
            print(f"        reply : {said[:90]!r}")
        # --- how soon could audio actually start
        if sentences:
            t0 = time.time()
            try:
                clip = api.speak(sentences[0])
                tts_first = time.time() - t0
                print(f"  tts      : first sentence {len(clip)} bytes in {tts_first:4.1f}s")
                print(f"  => first audio at ~{first + tts_first:4.1f}s streamed "
                      f"vs ~{blocking + tts_first:4.1f}s blocking")
            except Exception as e:
                print(f"  tts      : FAIL {type(e).__name__}: {e}")
                bad += 1
        if payload.get("confirm"):
            print(f"  confirm  : pending -> follow-up window would open")
    print("\nselftest:", "OK" if not bad else f"{bad} failure(s)")
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description="hey_jarvis laptop listener → jarvis.lan")
    ap.add_argument("--env", default=str(ENV_PATH))
    ap.add_argument("--list-devices", action="store_true")
    ap.add_argument("--commands", action="store_true")
    ap.add_argument("--doctor", action="store_true", help="check mic, models, /health")
    ap.add_argument(
        "--selftest",
        action="store_true",
        help="exercise the reply path against the orchestrator; no mic or speaker",
    )
    args = ap.parse_args()
    if args.commands:
        print(cmd_help())
        return

    cfg = load_env(Path(args.env))
    # Before the audio imports on purpose: the selftest exists to be runnable
    # where there is no microphone, such as the bastion.
    if args.selftest:
        raise SystemExit(run_selftest(cfg))

    import numpy as np
    import sounddevice as sd

    if args.list_devices:
        print(sd.query_devices())
        return

    if args.doctor:
        raise SystemExit(run_doctor(cfg))

    wake_thr = env_float(cfg, "WAKE_THR")
    wake_hits = env_int(cfg, "WAKE_HITS")
    silence_sec = env_float(cfg, "SILENCE_SEC")
    min_utter = env_float(cfg, "MIN_UTTER")
    max_utter = env_float(cfg, "MAX_UTTER")
    cooldown_sec = env_float(cfg, "COOLDOWN_SEC")
    followup_sec = env_float(cfg, "FOLLOWUP_SEC")
    followup_rms = env_float(cfg, "FOLLOWUP_RMS")
    stream_reply = env_bool(cfg, "STREAM_REPLY")
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
    print(
        f"reply mode: {'streamed sentence-by-sentence' if stream_reply else 'whole reply then speak'}"
        f"  follow-up {followup_sec:.0f}s"
    )
    print("listening for hey_jarvis  Ctrl-C to stop")
    print(cmd_help())

    paused = False
    mute_tts = False
    last_reply = ""
    last_audio = b""
    ignore_until = 0.0
    # Something is waiting on a yes/cancel, so the next thing said is probably
    # the answer. Listen for it without making Gordon say the wake word again.
    confirm_pending = False
    followup_until = 0.0
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
            seed: list = []
            if now < followup_until:
                # Waiting on an answer: any speech counts, no wake word.
                rms = float(np.sqrt(np.mean(pcm.astype(np.float64) ** 2)))
                if rms < followup_rms:
                    continue
                print("FOLLOW-UP")
                followup_until = 0.0
                seed = [pcm]  # keep the frame that already has the first word
            else:
                if followup_until:
                    followup_until = 0.0
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
            uttered = list(seed)
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
            # A pending confirm changes what "stop" means. Cancelling the
            # action and quitting the listener are different intents sharing
            # one word; with something awaiting an answer, the orchestrator
            # should get it.
            if confirm_pending and cmd in ("stop",):
                cmd = None

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

            body: dict = {}
            spoke_already = False
            if stream_reply and not mute_tts:
                try:
                    def _synth(sentence: str) -> bytes:
                        return with_retry("TTS", lambda: api.speak(sentence))

                    def _play(clip: bytes) -> None:
                        nonlocal last_audio
                        last_audio = clip
                        play_audio(clip)

                    body = speak_streamed(api, text, synth=_synth, play=_play)
                    spoke_already = True
                except Exception as e:
                    # Never lose the turn to a streaming problem.
                    print("stream failed, falling back to whole reply:", e)
            if not body:
                try:
                    body = with_retry("turn", lambda t=text: api.turn_text(t))
                except Exception as e:
                    print("turn error", e)
                    ignore_until = time.time() + cooldown_sec
                    continue
            save_session(api.session_id or "")
            reply = (body.get("reply_text") or "").strip()
            last_reply = reply
            route = body.get("route") or "-"
            print(f"jarvis[{route}]:", last_reply[:240])
            if reply and not mute_tts and not spoke_already:
                try:
                    last_audio = with_retry("TTS", lambda: api.speak(reply))
                    play_audio(last_audio)
                except Exception as e:
                    print("TTS error", e)
            elif mute_tts:
                print("tts muted")
            confirm_pending = bool(body.get("confirm"))
            if confirm_pending:
                summary = (body.get("confirm") or {}).get("summary") or ""
                print(f"awaiting yes/cancel: {summary}  ({followup_sec:.0f}s, no wake word needed)")
                followup_until = time.time() + cooldown_sec + followup_sec
            ignore_until = time.time() + cooldown_sec
            oww.reset()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped")
