"""
title: JARVIS live telemetry
description: Always-on clock + learned.md. No LIVE dump. No intent regex.
"""
from datetime import datetime
from pathlib import Path

LEARNED = Path("/learned/learned.md")


def wall_clock():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Los_Angeles"))
    except Exception:
        now = datetime.now()
    return now.strftime("%A %Y-%m-%d %H:%M %Z")


class Filter:

    def stream(self, event, **kwargs):
        """Stamp an invisible route marker into the first content delta."""
        if not isinstance(event, dict):
            return event
        eid = str(event.get("id") or "")
        model = str(event.get("model") or "")
        blob = eid + " " + model
        kind = None
        if "jarvis-hands" in blob or model == "openclaw" or "chatcmpl-jarvis-hands" in blob:
            kind = "hands"
        elif "grok-build" in blob or "grok-code" in blob or "jarvis-grok-code" in blob:
            kind = "code"
        elif "ollama" in blob or model.endswith("/jarvis") or "jarvis-local" in blob:
            kind = "local"
        elif "jarvis-grok" in blob:
            kind = "grok"
        if not kind:
            return event
        bits = {"local": "000", "hands": "001", "code": "011", "grok": "010"}[kind]
        mark = "\u2060" + "".join("\u200b" if b == "0" else "\u200c" for b in bits) + "\u2060"
        try:
            ch = (event.get("choices") or [{}])[0]
            delta = ch.get("delta") or {}
            if "content" in delta and not getattr(self, "_jarvis_marked", False):
                delta["content"] = mark + (delta.get("content") or "")
                ch["delta"] = delta
                event["choices"] = [ch] + (event.get("choices") or [])[1:]
                self._jarvis_marked = True
            elif "message" in ch and not getattr(self, "_jarvis_marked", False):
                msg = ch["message"]
                if isinstance(msg, dict) and "content" in msg:
                    msg["content"] = mark + (msg.get("content") or "")
                    self._jarvis_marked = True
        except Exception:
            pass
        em = kwargs.get("__event_emitter__")
        if em and not getattr(self, "_jarvis_emitted", False):
            label = {"local": "LOCAL  ollama/jarvis", "hands": "HANDS  jarvis-hands",
                     "code": "GROK-CODE", "grok": "GROK"}.get(kind, kind)
            try:
                em({"type": "status", "data": {"description": "ROUTED · " + label, "done": False}})
                self._jarvis_emitted = True
            except Exception:
                pass
        return event

    def inlet(self, body, __user__=None):
        self._jarvis_marked = False
        self._jarvis_emitted = False
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
