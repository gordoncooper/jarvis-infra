"""
title: JARVIS live telemetry
description: Clock + learned.md; capture routed child from stream; tag outlet.
"""
from datetime import datetime
from pathlib import Path
import json

LEARNED = Path("/learned/learned.md")
ROUTE = {"kind": None, "blob": "", "stream_type": ""}
TAG = {"hands": "⟦H⟧", "local": "⟦L⟧", "code": "⟦C⟧", "grok": "⟦G⟧"}


def wall_clock():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Los_Angeles"))
    except Exception:
        now = datetime.now()
    return now.strftime("%A %Y-%m-%d %H:%M %Z")


def classify(blob: str):
    s = (blob or "").lower()
    if "jarvis-hands" in s or "openclaw" in s or "chatcmpl-jarvis-hands" in s:
        return "hands"
    if "grok-build" in s or "grok-code" in s or "jarvis-grok-code" in s:
        return "code"
    if "ollama/jarvis" in s or "jarvis-local" in s:
        return "local"
    if "jarvis-grok" in s:
        return "grok"
    return None


def _dbg(path, msg):
    try:
        Path(path).write_text(msg[:3000])
    except Exception:
        pass


def _as_dict(event):
    if isinstance(event, dict):
        return event
    if hasattr(event, "model_dump"):
        try:
            return event.model_dump()
        except Exception:
            pass
    if isinstance(event, (bytes, bytearray)):
        event = event.decode("utf-8", "replace")
    if isinstance(event, str):
        try:
            o = json.loads(event)
            return o if isinstance(o, dict) else None
        except Exception:
            return None
    return None


class Filter:
    def inlet(self, body, __user__=None, **kwargs):
        ROUTE["kind"] = None
        ROUTE["blob"] = ""
        ROUTE["stream_type"] = ""
        if not isinstance(body, dict):
            return body
        model = str(body.get("model") or "")
        if "hands" in model:
            return body
        msgs = body.get("messages")
        if not isinstance(msgs, list) or not msgs:
            return body
        last = None
        for m in reversed(msgs):
            if isinstance(m, dict) and m.get("role") == "user":
                last = m
                break
        if last is None:
            return body
        c = last.get("content") or ""
        if not isinstance(c, str):
            return body
        extra = []
        if "[clock " not in c:
            extra.append("[clock " + wall_clock() + "]")
        try:
            mem = LEARNED.read_text(encoding="utf-8")[:4000].strip()
        except Exception:
            mem = ""
        if mem and "MEMORY from learned.md" not in c:
            extra.append(
                "MEMORY from learned.md (cite only if asked about remembered facts; "
                "source /learned/learned.md; never invent facts):\n" + mem
            )
        if extra and "<<<begin_ctx>>>" not in c:
            last["content"] = (
                c + "\n\n<<<begin_ctx>>>\n" + "\n\n".join(extra) + "\n<<<end_ctx>>>"
            )
        return body

    def stream(self, event, **kwargs):
        ROUTE["stream_type"] = type(event).__name__
        ev = _as_dict(event)
        if ev:
            blob = str(ev.get("id") or "") + " " + str(ev.get("model") or "") + " keys=" + ",".join(list(ev.keys())[:12])
            k = classify(blob)
            if k:
                ROUTE["kind"] = k
            ROUTE["blob"] = blob[:500]
        else:
            ROUTE["blob"] = repr(event)[:400]
        _dbg("/tmp/jarvis-stream.txt", json.dumps(ROUTE))
        return event

    def outlet(self, body, __user__=None, **kwargs):
        kind = ROUTE.get("kind")
        extra = ""
        last_keys = ""
        if isinstance(body, dict):
            extra = str(body.get("model") or "")
            msgs = body.get("messages")
            if isinstance(msgs, list) and msgs:
                m = msgs[-1] if isinstance(msgs[-1], dict) else {}
                last_keys = ",".join(map(str, m.keys()))
                extra += " " + str(m.get("model") or "") + " " + str(m.get("selected_model_id") or "")
                k2 = classify(extra)
                if k2:
                    kind = k2
        _dbg(
            "/tmp/jarvis-route.txt",
            "kind=" + str(kind)
            + " stream_type=" + ROUTE.get("stream_type", "")
            + " blob=" + ROUTE.get("blob", "")
            + " extra=" + extra[:200]
            + " last_keys=" + last_keys,
        )
        if not kind or not isinstance(body, dict):
            return body
        tag = TAG[kind]
        msgs = body.get("messages")
        if isinstance(msgs, list):
            for m in reversed(msgs):
                if isinstance(m, dict) and m.get("role") == "assistant":
                    c = m.get("content") or ""
                    if isinstance(c, str) and tag not in c[:12]:
                        m["content"] = tag + c
                    break
        return body
