"""
title: JARVIS no closer
id: jarvis_no_closer
"""
import re

CLOSER = re.compile(
    r"(?:^|\n)\s*(?:"
    r"How can I (?:assist|help) you(?: today)?"
    r"|What can I (?:help|assist) you with(?: today)?"
    r"|How may I be of service"
    r"|How can I be more helpful"
    r"|Is there anything (?:else|particular|specific).{0,80}"
    r"|Let me know if you need anything"
    r")\??\s*$",
    re.I | re.S,
)

class Filter:
    def _strip(self, text):
        if not isinstance(text, str) or not text:
            return text
        t = text.rstrip()
        prev = None
        while prev != t:
            prev = t
            t = CLOSER.sub("", t).rstrip()
        return t

    def outlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1]
        if (last.get("role") or "") == "assistant":
            last["content"] = self._strip(last.get("content"))
        return body
