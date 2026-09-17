"""
title: JARVIS route prefix
author: jarvis
version: 0.4.33
description: local:/hands:/code:/grok: at start of the user message overrides the router.
"""
import re
from typing import Optional

_RX = re.compile(r"^(?:/(local|hands|code|grok)\b|(local|hands|code|grok)\s*:)\s*", re.I)
_MAP = {
    "local": "jarvis-local",
    "hands": "jarvis-hands",
    "code": "jarvis-grok-code",
    "grok": "jarvis-grok",
}

class Filter:
    def inlet(self, body: dict, __user__: Optional[dict] = None) -> dict:
        msgs = body.get("messages") or []
        for m in reversed(msgs):
            if m.get("role") != "user":
                continue
            c = m.get("content")
            if not isinstance(c, str):
                break
            mo = _RX.match(c.lstrip())
            if not mo:
                break
            key = (mo.group(1) or mo.group(2) or "").lower()
            dest = _MAP.get(key)
            if not dest:
                break
            body["model"] = dest
            m["content"] = c.lstrip()[mo.end() :]
            break
        return body
