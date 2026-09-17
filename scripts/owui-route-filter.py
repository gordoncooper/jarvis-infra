"""
title: JARVIS route prefix
author: jarvis
version: 0.4.33
description: Start-of-message local:/hands:/code:/grok: overrides the router. code/grok skip OWUI RAG.
"""
import re
from typing import Any, Optional, Tuple

_RX = re.compile(r"^(?:/(local|hands|code|grok)\b|(local|hands|code|grok)\s*:)\s*", re.I)
_MAP = {
    "local": "jarvis-local",
    "hands": "jarvis-hands",
    "code": "jarvis-grok-code",
    "grok": "jarvis-grok",
}
_NO_RAG = {"jarvis-grok-code", "jarvis-grok"}


def _text(content: Any) -> Tuple[Optional[str], Any]:
    if isinstance(content, str):
        return content, "str"
    if isinstance(content, list):
        for i, p in enumerate(content):
            if isinstance(p, str):
                return p, ("list-str", i)
            if isinstance(p, dict) and isinstance(p.get("text"), str):
                return p["text"], ("list-dict", i)
    return None, None


def _set_text(m: dict, kind: Any, new: str) -> None:
    if kind == "str":
        m["content"] = new
        return
    c = m.get("content")
    if kind[0] == "list-str":
        c[kind[1]] = new
    else:
        c[kind[1]]["text"] = new


def _strip_rag(body: dict) -> None:
    body["files"] = []
    if "tool_ids" in body:
        body["tool_ids"] = []
    feat = body.get("features")
    if isinstance(feat, dict):
        for k in list(feat):
            lk = k.lower()
            if "search" in lk or "knowledge" in lk or "rag" in lk:
                feat[k] = False
    md = body.get("metadata")
    if isinstance(md, dict):
        md["files"] = []


class Filter:
    def inlet(self, body: dict, __user__: Optional[dict] = None) -> dict:
        msgs = body.get("messages") or []
        for m in reversed(msgs):
            if m.get("role") != "user":
                continue
            raw, kind = _text(m.get("content"))
            if raw is None:
                break
            mo = _RX.match(raw.lstrip())
            if not mo:
                break
            dest = _MAP.get((mo.group(1) or mo.group(2) or "").lower())
            if not dest:
                break
            body["model"] = dest
            _set_text(m, kind, raw.lstrip()[mo.end() :])
            if dest in _NO_RAG:
                _strip_rag(body)
            break
        return body
