"""
title: JARVIS live telemetry
description: Prepend compact homepage telemetry when the user asks about the rack
"""
import json
import urllib.request

URL = "http://homepage.apps.svc.cluster.local:3000/api/telemetry"
KEYS = ("kubectl", "gpu", "vram", "nvidia", "who is up", "cluster status", "pod status", "the rack", "nodes in")
SKIP = ("remember", "learned fact", "learned.md")

def _pct(v):
    try:
        return f"{float(v):.1f}%"
    except (TypeError, ValueError):
        return "?"

class Filter:
    def inlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        low = last.lower()
        if any(s in low for s in SKIP):
            return body
        if not any(k in low for k in KEYS):
            return body
        try:
            t = json.loads(urllib.request.urlopen(URL, timeout=3).read())
        except Exception as e:
            msgs[-1]["content"] = last + f"\n\nLIVE telemetry unavailable ({type(e).__name__}). Use https://home.lan/status."
            return body
        nodes = []
        for n in t.get("nodes") or []:
            nid = n.get("id") or "?"
            ready = "ready" if n.get("ready") else "NOT ready"
            nodes.append(
                f"{nid} {ready} cpuPct={_pct(n.get('cpuPct'))} ramPct={_pct(n.get('ramPct'))} diskPct={_pct(n.get('diskPct'))}"
            )
        gpus = []
        for g in t.get("gpus") or []:
            gpus.append(
                f"{g.get('id','gpu')} tempC={g.get('tempC','?')} utilPct={_pct(g.get('utilPct'))} "
                f"vram={g.get('vramUsedMiB','?')}/{g.get('vramTotalMiB','?')} MiB"
            )
        block = (
            "\n\nLIVE telemetry (cite only these fields; % is percent used, MiB is GPU memory; do not convert % to GB): "
            f"source={t.get('source')} k3s={t.get('k3s')} fluxOk={t.get('fluxOk')} nfsOk={t.get('nfsOk')} etcdOk={t.get('etcdOk')} "
            f"nodes=[{'; '.join(nodes)}] gpus=[{'; '.join(gpus)}]"
        )
        msgs[-1]["content"] = last + block
        return body
