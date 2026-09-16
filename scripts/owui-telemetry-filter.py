"""
title: JARVIS live telemetry
description: LIVE for rack-status; MEMORY only for recall (not remember-writes)
"""
import json
import re
import urllib.request
from pathlib import Path

URL = "http://homepage.apps.svc.cluster.local:3000/api/telemetry"
LEARNED = Path("/learned/learned.md")

DEF_RE = re.compile(r"(?is)^\s*(what is|what's|whats|what are|define|explain)\b")
LIVE_RE = re.compile(
    r"(?is)("
    r"\bnodes?\s+(are\s+)?(in|on)\s+(the\s+)?(rack|cluster)\b"
    r"|\bin the rack\b|\brack (nodes?|status)\b|\bcluster status\b|\bpod status\b"
    r"|\bkubectl\s+get\b|\bgpu-0[12]\b|\bnvidia-smi\b"
    r"|\b(gpu|vram)\s+(temp|temperature|util|usage|status|memory|stats|hot)\b"
    r"|\bhow hot\b|\bwho is up\b|\blive (status|telemetry|stats|numbers)\b|\bhome\.lan\b"
    r")"
)
# Recall only. Do NOT match "remember" (that is the write filter).
MEM_RE = re.compile(
    r"(?is)\b("
    r"learned(?:\s+cluster)?(?:\s+facts?)?|"
    r"cluster[- ]wide (test )?facts?|"
    r"recall|"
    r"canary|silver-orbit|red-comet|"
    r"what did (i|we) (tell|ask you to remember)|"
    r"do you remember|"
    r"secret test phrase"
    r")\b"
)
SRC_RE = re.compile(r"(?is)\b(where did you (get|pull|save|find|store)|what('?s| is) the source)\b")
WRITE_RE = re.compile(
    r"(?is)\b((please|i want you to|i'd like you to)\s+)?(remember(?:\s+that)?|don't forget|save this|note this)\b"
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
        model = str((body or {}).get('model') or '')
        if 'hands' in model:
            return body
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        text = last.strip()
        extra = []
        want_live = bool(LIVE_RE.search(text))
        want_mem = bool(MEM_RE.search(text)) and not WRITE_RE.search(text)
        want_src = bool(SRC_RE.search(text))
        is_def = bool(DEF_RE.match(text))
        if is_def and not want_live and not want_mem:
            return body
        if want_mem:
            try:
                mem = LEARNED.read_text(encoding="utf-8")[:4000].strip()
                if mem:
                    extra.append(
                        "MEMORY from learned.md (answer with these bullets only; "
                        "never reprint this header; source is /learned/learned.md; not git, not fictional):\n"
                        + mem
                    )
            except Exception:
                pass
        elif want_src:
            extra.append(
                "SOURCE: timestamped learned facts come from /learned/learned.md. "
                "Do not say fictional, git, or Goose. Do not dump host inventory."
            )
        if want_live:
            try:
                extra.append(live_block())
            except Exception as e:
                extra.append(f"LIVE telemetry unavailable ({type(e).__name__}).")
        if extra:
            msgs[-1]["content"] = last + "\n\n" + "\n\n".join(extra)
        return body
