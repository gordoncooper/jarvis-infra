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
    def inlet(self, body, __user__=None):
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
