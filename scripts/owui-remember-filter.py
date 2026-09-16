"""
title: JARVIS remember
description: Append-only remember; skip duplicates; never delete
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
RECALL = re.compile(r"(?is)^\s*(what|where|when|who|tell me|list|show|recall|pull)\b")
NOWRITE = re.compile(r"(?is)\b(remove|delete|duplicate|consolidat|erase|forget that)\b")
THAT = re.compile(r"(?is)remember(?:\s+that)?\s*[:\-–]?\s+(.+)$")
BAD = re.compile(r"(?i)\b(password|api[_-]?key|token|secret key)\b")
CLAIM_WRITE = re.compile(
    r"(?i)(MEMORY stored|saved|stored in .learned|appended|I will remember|remembered your)"
)
CLAIM_DEL = re.compile(r"(?i)(removed|deleted|erased|consolidat\w+ .*(fact|entr))" )

def _norm(s):
    s = re.sub(r"^- \S+\s+", "", s).strip().lower()
    return re.sub(r"\s+", " ", s)

def fact_from(text):
    text = text.strip()
    if not INTENT.search(text) or RECALL.match(text) or NOWRITE.search(text):
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

def existing_payloads():
    if not LEARNED.exists():
        return set()
    out = set()
    for line in LEARNED.read_text(encoding="utf-8").splitlines():
        if line.startswith("- "):
            out.add(_norm(line))
    return out

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
        if _norm("- x " + fact) in existing_payloads():
            msgs[-1]["content"] = last + (
                "\n\nMEMORY already in learned.md (duplicate not appended). "
                "Tell sir it was already stored. Do not invent a new timestamp."
            )
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
                "One short confirmation. Do not reprint the whole file. Do not invent timestamps."
            )
        except Exception as e:
            note = f"\n\nMEMORY write failed ({type(e).__name__}). Use remember.sh on the bastion."
        msgs[-1]["content"] = last + note
        return body

    def outlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        user_blob = " ".join(
            (m.get("content") or "") for m in msgs if m.get("role") == "user"
        )
        wrote = "MEMORY stored in /learned/learned.md" in user_blob
        last = msgs[-1]
        content = last.get("content") or ""
        if not isinstance(content, str):
            return body
        extra = []
        if CLAIM_DEL.search(content):
            extra.append(
                "Correction: learned.md is append-only from chat. Nothing was deleted."
            )
        if CLAIM_WRITE.search(content) and not wrote and "MEMORY already in learned.md" not in user_blob:
            extra.append(
                "Correction: nothing new was written to learned.md this turn. Do not invent receipts."
            )
        if extra:
            last["content"] = content + "\n\n" + " ".join(extra)
        return body
