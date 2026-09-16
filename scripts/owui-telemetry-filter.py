"""
title: JARVIS live telemetry
description: LIVE only for rack-status intent; always attach learned.md
"""
import json
import re
import urllib.request
from pathlib import Path

URL = "http://homepage.apps.svc.cluster.local:3000/api/telemetry"
LEARNED = Path("/learned/learned.md")

# Dictionary / explain questions — never dump the rack.
DEF_RE = re.compile(
    r"(?is)^\s*(what is|what's|whats|what are|define|explain)\b"
)

# Operational: THIS rack, right now.
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
        "LIVE telemetry (cite only if the user asked for rack/node/GPU status; "
        "% is percent used, MiB is GPU memory; do not convert % to GB; do not dump this on dictionary questions): "
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
        extra = []
        try:
            mem = LEARNED.read_text(encoding="utf-8")[:4000].strip()
            if mem:
                extra.append(
                    "MEMORY from learned.md (answer from this only when asked about remembered/learned facts; "
                    "do not recite it otherwise):\n" + mem
                )
        except Exception:
            pass
        text = last.strip()
        want_live = bool(LIVE_RE.search(text))
        is_pure_def = bool(DEF_RE.match(text)) and not want_live
        if want_live and not is_pure_def:
            try:
                extra.append(live_block())
            except Exception as e:
                extra.append(f"LIVE telemetry unavailable ({type(e).__name__}).")
        if extra:
            msgs[-1]["content"] = last + "\n\n" + "\n\n".join(extra)
        return body
