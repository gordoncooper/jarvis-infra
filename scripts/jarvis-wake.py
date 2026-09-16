#!/usr/bin/env python3
"""Laptop hey_jarvis → chat.lan Voice chat. Run on the laptop, not bastion."""
from __future__ import annotations

import argparse, json, os, ssl, struct, sys, time, uuid, wave
from io import BytesIO
from pathlib import Path

import numpy as np
import requests
import sounddevice as sd

ENV_PATH = Path.home() / ".config/jarvis-wake/env"
TITLE = "Voice"
RATE = 16000
CHUNK = 1280
WAKE_KEY = "hey_jarvis"
WAKE_THR = 0.6
WAKE_HITS = 3
SILENCE_SEC = 0.85
MAX_UTTER = 8.0
MIN_UTTER = 0.40
RMS_SILENCE = 0  # adaptive


def load_env(path: Path) -> dict:
    d = {}
    if not path.is_file():
        raise SystemExit(f"missing {path} — scp from bastion ~/.config/jarvis-wake/env")
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        d[k.strip()] = v.strip().strip('"')
    for k in ("OWUI_URL", "OWUI_TOKEN"):
        if not d.get(k):
            raise SystemExit(f"{path} missing {k}")
    return d


class OWUI:
    def __init__(self, url: str, token: str):
        self.base = url.rstrip("/")
        self.s = requests.Session()
        self.s.headers["Authorization"] = "Bearer " + token
        self.s.headers["Accept"] = "application/json"
        self.s.verify = False
        try:
            requests.packages.urllib3.disable_warnings()  # type: ignore
        except Exception:
            pass

    def _parse(self, r: requests.Response):
        r.raise_for_status()
        if not r.content:
            return None
        try:
            return r.json()
        except Exception:
            return r.content

    def get(self, path):
        return self._parse(self.s.get(self.base + path, timeout=30))

    def post(self, path, **kw):
        return self._parse(self.s.post(self.base + path, timeout=120, **kw))

    def _chats(self, path):
        body = self.get(path)
        if isinstance(body, list):
            return body
        if isinstance(body, dict):
            for k in ("items", "chats", "data"):
                if isinstance(body.get(k), list):
                    return body[k]
        return []

    def find_voice(self, chat_id: str | None):
        cid = (chat_id or "").strip()
        if cid:
            return cid
        items = self._chats("/api/v1/chats/") + self._chats("/api/v1/chats/pinned")
        titles = []
        for c in items:
            if not isinstance(c, dict):
                continue
            ch = c.get("chat") if isinstance(c.get("chat"), dict) else c
            title = str(ch.get("title") or c.get("title") or "")
            titles.append(title)
            if title.strip() == TITLE and c.get("id"):
                return c["id"]
        print("chat titles:", titles[:20], file=sys.stderr)
        raise SystemExit("Voice chat not found — run ensure-voice-chat.sh on bastion")

    def transcribe(self, wav: bytes) -> str:
        files = {"file": ("utt.wav", wav, "audio/wav")}
        last = None
        for path in ("/api/v1/audio/transcriptions", "/api/audio/transcriptions"):
            try:
                r = self.s.post(self.base + path, files=files, timeout=120)
                last = r
                if r.status_code == 200:
                    j = r.json()
                    return (j.get("text") or j.get("transcript") or "").strip()
            except Exception as e:
                last = e
        raise SystemExit(f"STT failed: {last}")

    def complete(self, chat_id: str, model: str, text: str) -> str:
        now = int(time.time())
        uid = str(uuid.uuid4())
        aid = str(uuid.uuid4())
        chat = self.get(f"/api/v1/chats/{chat_id}")
        blob = chat.get("chat") if isinstance(chat, dict) and isinstance(chat.get("chat"), dict) else (chat or {})
        hist = blob.get("history") or {"messages": {}, "currentId": None}
        msgs = hist.get("messages") or {}
        user = {
            "id": uid, "role": "user", "content": text, "timestamp": now,
            "models": [model], "childrenIds": [aid],
        }
        asst = {
            "id": aid, "role": "assistant", "content": "", "parentId": uid,
            "childrenIds": [], "model": model, "modelName": model,
            "modelIdx": 0, "done": False, "timestamp": now + 1,
        }
        msgs[uid] = user
        msgs[aid] = asst
        hist["messages"] = msgs
        hist["currentId"] = aid
        blob["history"] = hist
        blob["models"] = [model]
        blob["title"] = blob.get("title") or TITLE
        lin = blob.get("messages")
        if isinstance(lin, list):
            lin.append(user)
            blob["messages"] = lin
        self.post(f"/api/v1/chats/{chat_id}", json={"chat": blob})
        body = {
            "model": model,
            "chat_id": chat_id,
            "id": aid,
            "messages": [{"role": "user", "content": text}],
            "stream": False,
            "background_tasks": {"title_generation": False, "follow_up_generation": False, "tags_generation": False},
        }
        r = self.s.post(self.base + "/api/chat/completions", json=body, timeout=180)
        r.raise_for_status()
        data = r.json()
        out = ""
        if isinstance(data, dict):
            ch0 = (data.get("choices") or [{}])[0]
            out = ((ch0.get("message") or {}).get("content")) or data.get("content") or ""
            if not out and isinstance(data.get("response"), str):
                out = data["response"]
        out = (out or "").strip()
        asst["content"] = out
        asst["done"] = True
        msgs[aid] = asst
        hist["currentId"] = aid
        blob["history"] = hist
        self.post(f"/api/v1/chats/{chat_id}", json={"chat": blob})
        return out

    def speak(self, text: str) -> bytes:
        r = self.s.post(
            self.base + "/api/v1/audio/speech",
            json={"input": text, "model": "tts-1", "voice": "alloy"},
            timeout=60,
        )
        if r.status_code != 200:
            r = self.s.post(
                self.base + "/api/audio/speech",
                json={"input": text, "model": "tts-1", "voice": "alloy"},
                timeout=60,
            )
        r.raise_for_status()
        return r.content


def wav_bytes(pcm: np.ndarray) -> bytes:
    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(np.asarray(pcm, dtype=np.int16).tobytes())
    return buf.getvalue()


def beep():
    t = np.linspace(0, 0.12, int(RATE * 0.12), False)
    tone = (0.18 * np.sin(2 * np.pi * 880 * t) * 32767).astype(np.int16)
    sd.play(tone, RATE)
    sd.wait()


def play_mp3(data: bytes):
    p = Path("/tmp/jarvis-wake-reply.mp3")
    p.write_bytes(data)
    for cmd in (
        ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", str(p)],
        ["mpv", "--really-quiet", str(p)],
        ["paplay", str(p)],
    ):
        from shutil import which
        if which(cmd[0]):
            import subprocess
            subprocess.run(cmd, check=False)
            return
    print("no ffplay/mpv/paplay — reply is in the Voice chat only", file=sys.stderr)


def load_wake():
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


def main():
    ap = argparse.ArgumentParser(description="hey_jarvis laptop listener")
    ap.add_argument("--env", default=str(ENV_PATH))
    ap.add_argument("--list-devices", action="store_true")
    args = ap.parse_args()
    if args.list_devices:
        print(sd.query_devices())
        return
    cfg = load_env(Path(args.env))
    api = OWUI(cfg["OWUI_URL"], cfg["OWUI_TOKEN"])
    chat_id = api.find_voice(cfg.get("CHAT_ID") or None)
    model = cfg.get("MODEL") or "jarvis"
    print(f"mic default={sd.query_devices(kind='input')['name']!r}  chat={chat_id}  model={model}  env_chat_id={bool((cfg.get('CHAT_ID') or '').strip())}")
    print("headphones recommended (Piper can retrigger the wake word)")
    print("listening for hey_jarvis  Ctrl-C to stop")
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
                text = api.transcribe(wav_bytes(audio))
            except Exception as e:
                print("STT error", e)
                continue
            print("heard:", text)
            if not text:
                continue
            if __import__("re").search(
                r"\b(date|today|time|clock|day of the week|what day)\b", text, __import__("re").I
            ):
                now = time.strftime("%A %Y-%m-%d %H:%M %Z")
                text = text + f"\n[laptop clock: {now}]"
                print("clock inject", now)
            try:
                reply = api.complete(chat_id, model, text)
            except Exception as e:
                print("chat error", e)
                continue
            print("jarvis:", (reply or "")[:240])
            if reply:
                try:
                    play_mp3(api.speak(reply))
                except Exception as e:
                    print("TTS error", e)
            time.sleep(1.2)
            oww.reset()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped")
