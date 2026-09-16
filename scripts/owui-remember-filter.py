"""
title: JARVIS remember
description: Persist remember-intent lines to learned.md
"""
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

LEARNED = Path("/learned/learned.md")
TZ = ZoneInfo("America/Los_Angeles")
INTENT = re.compile(
    r"(?is)\b((please|i want you to|i'd like you to)\s+)?(remember(?:\s+that)?|don't forget(?:\s+that)?|save this|note this)\b"
)
RECALL = re.compile(
    r"(?is)^\s*(what|where|when|who|tell me|list|show)\b"
)
THAT = re.compile(r"(?is)remember(?:\s+that)?\s*[:\-–]?\s+(.+)$")
BAD = re.compile(r"(?i)\b(password|api[_-]?key|token|secret key)\b")

def fact_from(text: str) -> str | None:
    text = text.strip()
    if not INTENT.search(text) or RECALL.match(text):
        return None
    m = THAT.search(text)
    fact = (m.group(1).strip() if m else "")
    if (not fact) or len(fact) < 12 or re.match(r"(?i)^(a new one|this|it|something)\b", fact):
        parts = [p.strip() for p in re.split(r"[.!?\n]", text) if p.strip()]
        fact = parts[-1] if parts else fact
    fact = " ".join(fact.split())
    if len(fact) < 8 or len(fact) > 500 or BAD.search(fact):
        return None
    if INTENT.search(fact) and len(fact) < 24:
        return None
    return fact

class Filter:
    def inlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        fact = fact_from(last)
        if not fact:
            return body
        ts = datetime.now(TZ).strftime("%Y-%m-%dT%H:%M:%S%z")
        line = f"- {ts} {fact}\n"
        try:
            LEARNED.parent.mkdir(parents=True, exist_ok=True)
            if not LEARNED.exists():
                LEARNED.write_text("# JARVIS learned facts (promoted)\n\n", encoding="utf-8")
            with LEARNED.open("a", encoding="utf-8") as f:
                f.write(line)
            note = (
                f"\n\nMEMORY stored in /learned/learned.md ({ts}). "
                "Tell sir it is in learned.md (cluster-wide). Do not invent timestamps."
            )
        except Exception as e:
            note = f"\n\nMEMORY write failed ({type(e).__name__}). Use remember.sh on the bastion."
        msgs[-1]["content"] = last + note
        return body
    def outlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1]
        content = last.get("content") or ""
        if not isinstance(content, str):
            return body
        claimed = re.search(
            r"(?i)(saved|stored|written|appended|removed|deleted|remembered (your|that)|I will remember)",
            content,
        )
        if claimed and "MEMORY stored in /learned/learned.md" not in content:
            last["content"] = content + (
                "\n\nCorrection: nothing was written to learned.md this turn. "
                "Only a successful remember-filter append persists. Do not invent timestamps."
            )
        return body

