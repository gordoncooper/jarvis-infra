"""
title: JARVIS no closer
id: jarvis_no_closer
"""
import re

CLOSER = re.compile(
    r"(?:^|\n)\s*(?:"
    r"How can I (?:assist|help) you(?: today)?(?:,?\s+Gordon)?"
    r"|What can I (?:help|assist) you with(?: today)?"
    r"|How may I be of service"
    r"|How can I be more helpful"
    r"|Is there anything (?:else|particular|specific).{0,80}"
    r"|What specifically are you curious about.{0,80}"
    r"|Let me know if you need anything"
    r")\??\s*$",
    re.I | re.S,
)
ASK_HIS = re.compile(
    r"\b(my name|who am i|who i am|what(?:'s| is) my name)\b",
    re.I,
)
PAIR_GORDON = re.compile(
    r"(?:\s*I am JARVIS\.)?\s*You are Gordon\.?",
    re.I,
)

class Filter:
    def _last_user(self, body):
        msgs = body.get("messages") if isinstance(body, dict) else None
        if not isinstance(msgs, list):
            return ""
        for m in reversed(msgs):
            if isinstance(m, dict) and m.get("role") == "user":
                c = m.get("content") or ""
                return c if isinstance(c, str) else ""
        return ""

    def _strip(self, text, user):
        if not isinstance(text, str) or not text:
            return text
        t = text.rstrip()
        prev = None
        while prev != t:
            prev = t
            t = CLOSER.sub("", t).rstrip()
        if not ASK_HIS.search(user or ""):
            t = PAIR_GORDON.sub("", t)
            t = re.sub(r"  +", " ", t)
            t = re.sub(r"\n{3,}", "\n\n", t).strip()
        return t

    def outlet(self, body, __user__=None):
        user = self._last_user(body)
        def walk(obj):
            if isinstance(obj, dict):
                if obj.get("role") == "assistant" and isinstance(obj.get("content"), str):
                    obj["content"] = self._strip(obj["content"], user)
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for x in obj:
                    walk(x)
        walk(body)
        return body
