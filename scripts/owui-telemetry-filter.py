"""
title: JARVIS live telemetry
description: Always-on clock only. No LIVE dump. No learned.md attach (RAG + remember).
"""
from datetime import datetime

def wall_clock():
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Los_Angeles"))
    except Exception:
        now = datetime.now()
    return now.strftime("%A %Y-%m-%d %H:%M %Z")

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
        if "[clock " in c or "<<<begin_ctx>>>" in c:
            return body
        last["content"] = c + "\n\n<<<begin_ctx>>>\n[clock " + wall_clock() + "]\n<<<end_ctx>>>"
        return body
