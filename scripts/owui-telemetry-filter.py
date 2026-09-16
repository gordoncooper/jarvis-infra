"""
title: JARVIS live telemetry
description: LIVE for rack-status; MEMORY only for recall; never on dictionary questions
"""
import json
import re
import urllib.request
from pathlib import Path

URL = "http://homepage.apps.svc.cluster.local:3000/api/telemetry"
LEARNED = Path("/learned/learned.md")

DEF_RE = re.compile(
    r"(?is)^\s*(what is|what's|whats|what are|define|explain)\b"
)
LIVE_RE = re.compile(
    r"(?is)("
    r"\bnodes?\s+(are\s+)?(in|on)\s+(the\s+)?(rack|cluster)\b"
    r"|\bin the rack\b"
    r"|\brack (nodes?|status)\b"
    r"|\bcluster status\b"
    r"|\bpod status\b"
    r"|\bkubectl\s+get\b"
    r"|\bgpu-0[12]\b"
    r"|\bnvidia-smi\b"
    r"|\b(gpu|vram)\s+(temp|temperature|util|usage|status|memory|stats|hot)\b"
    r"|\bhow hot\b"
    r"|\bwho is up\b"
    r"|\blive (status|telemetry|stats|numbers)\b"
    r"|\bhome\.lan\b"
    r")"
)
MEM_RE = re.compile(
    r"(?is)\b(remember(?:\s+that)?|learned(?:\s+fact)?|canary|"
    r"cluster[- ]wide (test )?fact|secret test phrase|"
    r"what did (i|we) (tell|ask you to remember)|"
    r"do you remember|silver-orbit|red-comet|told you to remember)\b"
)

def _pct(v):
    try:
        return f"{float(v):.1f}%"
    except (TypeError, ValueError):
        return "?"

def live_block():
    t = json.loads(urllib.request.urlopen(URL, timeout=3).read())
    nodes = []
    for n in t.get("nodes") or []:
        nodes.append(
            f"{n.get('id','?')} {'ready' if n.get('ready') else 'NOT ready'} "
            f"cpuPct={_pct(n.get('cpuPct'))} ramPct={_pct(n.get('ramPct'))} diskPct={_pct(n.get('diskPct'))}"
        )
    gpus = []
    for g in t.get("gpus") or []:
        gpus.append(
            f"{g.get('id','gpu')} tempC={g.get('tempC','?')} utilPct={_pct(g.get('utilPct'))} "
            f"vram={g.get('vramUsedMiB','?')}/{g.get('vramTotalMiB','?')} MiB"
        )
    return (
        "LIVE telemetry (cite only these fields; % is percent used, MiB is GPU memory): "
        f"source={t.get('source')} k3s={t.get('k3s')} fluxOk={t.get('fluxOk')} nfsOk={t.get('nfsOk')} etcdOk={t.get('etcdOk')} "
        f"nodes=[{'; '.join(nodes)}] gpus=[{'; '.join(gpus)}]"
    )

class Filter:
    def inlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        text = last.strip()
        extra = []
        want_live = bool(LIVE_RE.search(text))
        want_mem = bool(MEM_RE.search(text))
        is_def = bool(DEF_RE.match(text))
        # Dictionary with no rack/recall intent: inject nothing.
        if is_def and not want_live and not want_mem:
            return body
        if want_mem:
            try:
                mem = LEARNED.read_text(encoding="utf-8")[:4000].strip()
                if mem:
                    extra.append("MEMORY from learned.md (this is the answer if they asked a learned/remembered fact):\n" + mem)
            except Exception:
                pass
        if want_live:
            try:
                extra.append(live_block())
            except Exception as e:
                extra.append(f"LIVE telemetry unavailable ({type(e).__name__}).")
        if extra:
            msgs[-1]["content"] = last + "\n\n" + "\n\n".join(extra)
        return body
