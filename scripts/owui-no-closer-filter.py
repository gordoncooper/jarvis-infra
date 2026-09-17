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
    r"|If you have any(?: specific)? tasks or queries, feel free to ask"
    r"|Feel free to (?:ask|reach out).{0,40}"
    r"|If you have any (?:other )?questions.{0,40}"
    r")\??\.?\s*$",
    re.I | re.S,
)
ASK_HIS = re.compile(
    r"\b(my name|who am i|who i am|what(?:'s| is) my name)\b",
    re.I,
)
ASK_TIME = re.compile(
    r"\b(what(?:'s| is) the time|what time is it|what day|what(?:'s| is) the date)\b",
    re.I,
)
PAIR_GORDON = re.compile(r"(?:I am JARVIS\.\s*)?You are Gordon\.?", re.I)
CLOCK_SAY = re.compile(
    r"\s*(?:The time is now|It is currently|Current time[: ]*)[^\n.]*\.?",
    re.I,
)

def content_text(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        out = []
        for p in c:
            if isinstance(p, str):
                out.append(p)
            elif isinstance(p, dict):
                out.append(str(p.get("text") or p.get("content") or ""))
        return "".join(out)
    return ""

def set_content(obj, text):
    c = obj.get("content")
    if isinstance(c, list) and c and isinstance(c[0], dict):
        c[0]["text"] = text
        del c[1:]
        if "content" in c[0] and "text" not in c[0]:
            c[0]["content"] = text
    else:
        obj["content"] = text

class Filter:
    def _last_user(self, body):
        msgs = body.get("messages") if isinstance(body, dict) else None
        if not isinstance(msgs, list):
            return ""
        for m in reversed(msgs):
            if isinstance(m, dict) and m.get("role") == "user":
                return content_text(m.get("content"))
        return ""

    def _strip(self, text, user):
        if not isinstance(text, str) or not text:
            return text
        t = text.rstrip()
        prev = None
        while prev != t:
            prev = t
            t = CLOSER.sub("", t).rstrip(" \n.")
        if not ASK_HIS.search(user or ""):
            t = PAIR_GORDON.sub("", t)
        if not ASK_TIME.search(user or ""):
            t = CLOCK_SAY.sub("", t)
        t = re.sub(r"[ \t]{2,}", " ", t)
        t = re.sub(r"\n{3,}", "\n\n", t).strip()
        return t

    def outlet(self, body, __user__=None):
        user = self._last_user(body)
        def walk(obj):
            if isinstance(obj, dict):
                if obj.get("role") == "assistant" and "content" in obj:
                    set_content(obj, self._strip(content_text(obj.get("content")), user))
                for v in obj.values():
                    walk(v)
            elif isinstance(obj, list):
                for x in obj:
                    walk(x)
        walk(body)
        return body
