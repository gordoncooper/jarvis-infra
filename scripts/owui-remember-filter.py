"""
title: JARVIS remember
description: Append 'remember that …' lines to learned.md (cluster-wide memory)
"""
import re
from datetime import datetime, timezone
from pathlib import Path

LEARNED = Path("/learned/learned.md")
PAT = re.compile(
    r"(?is)^\s*(?:please\s+)?(?:jarvis,?\s+)?(remember(?:\s+that)?|don't forget(?:\s+that)?)\s*[:\-–]?\s+(.+)$"
)

class Filter:
    def inlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        m = PAT.match(last.strip())
        if not m:
            return body
        fact = " ".join(m.group(2).split()).strip()
        if not fact or len(fact) > 500:
            return body
        ts = datetime.now().astimezone().strftime("%Y-%m-%dT%H:%M:%S%z")
        line = f"- {ts} {fact}\n"
        try:
            LEARNED.parent.mkdir(parents=True, exist_ok=True)
            if not LEARNED.exists():
                LEARNED.write_text("# JARVIS learned facts\n\n", encoding="utf-8")
            with LEARNED.open("a", encoding="utf-8") as f:
                f.write(line)
            note = f"\n\nMEMORY stored in learned.md ({ts}). Repeat this fact if asked; do not send sir to Goose for it."
        except Exception as e:
            note = f"\n\nMEMORY write failed ({type(e).__name__}). Use remember.sh on the bastion."
        msgs[-1]["content"] = last + note
        return body
