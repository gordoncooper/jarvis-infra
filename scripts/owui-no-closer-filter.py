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
        def walk(obj):
            if isinstance(obj, dict):
                if obj.get("role") == "assistant" and isinstance(obj.get("content"), str):
                    obj["content"] = self._strip(obj["content"])
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for x in obj:
                    walk(x)
        walk(body)
        return body
