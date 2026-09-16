"""
title: JARVIS live telemetry
description: Clock + learned.md on inlet; route tag on outlet.
"""
from datetime import datetime
from pathlib import Path
import json

LEARNED = Path("/learned/learned.md")
DEBUG = Path("/tmp/jarvis-route.txt")


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
    if "ollama/jarvis" in s or "jarvis-local" in s or s.endswith("/jarvis"):
        return "local"
    if "jarvis-grok" in s:
        return "grok"
    return None


TAG = {"hands": "⟦H⟧", "local": "⟦L⟧", "code": "⟦C⟧", "grok": "⟦G⟧"}


def _dbg(msg: str):
    try:
        DEBUG.write_text(msg[:2000])
    except Exception:
        pass


class Filter:
    def inlet(self, body, __user__=None, **kwargs):
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

    def outlet(self, body, __user__=None, **kwargs):
        if not isinstance(body, dict):
            return body
        blob = " ".join(
            [
                str(body.get("model") or ""),
                str(body.get("id") or ""),
                str((body.get("choices") or [{}])[0].get("model") or "")
                if isinstance(body.get("choices"), list) and body.get("choices")
                else "",
            ]
        )
        kind = classify(blob)
        _dbg("keys=" + ",".join(map(str, body.keys())) + " blob=" + blob[:300] + " kind=" + str(kind))
        if not kind:
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
