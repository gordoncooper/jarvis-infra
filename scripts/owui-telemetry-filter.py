"""
title: JARVIS live telemetry
description: Prepend compact homepage telemetry when the user asks about the rack
"""
import json
import urllib.request

URL = "http://homepage.apps.svc.cluster.local:3000/api/telemetry"
KEYS = ("node", "kubectl", "gpu", "vram", "pod", "cluster", "rack", "status", "nvidia", "who is up")

class Filter:
    def inlet(self, body, __user__=None):
        msgs = body.get("messages") or []
        if not msgs:
            return body
        last = msgs[-1].get("content") or ""
        if not isinstance(last, str):
            return body
        blob = last.lower()
        if not any(k in blob for k in KEYS):
            return body
        try:
            raw = urllib.request.urlopen(URL, timeout=3).read()
            t = json.loads(raw)
        except Exception as e:
            msgs[-1]["content"] = last + f"\n\nLIVE telemetry unavailable ({type(e).__name__}). Use https://home.lan/status."
            return body
        nodes = []
        for n in t.get("nodes") or []:
            nid = n.get("id") or n.get("name") or "?"
            nodes.append(f"{nid} cpu={n.get('cpuPct','?')} ram={n.get('ramPct','?')}")
        gpus = []
        for g in t.get("gpus") or []:
            gpus.append(f"{g.get('id', g.get('node','gpu'))} {g.get('memUsed', g.get('usedMi', '?'))}/{g.get('memTotal', g.get('totalMi', '?'))} MiB")
        block = (
            "\n\nLIVE telemetry (cite only this; do not invent hosts): "
            f"k3s={t.get('k3s')} fluxOk={t.get('fluxOk')} nfsOk={t.get('nfsOk')} etcdOk={t.get('etcdOk')} "
            f"nodes=[{'; '.join(nodes[:8])}] gpus=[{'; '.join(gpus[:4])}]"
        )
        msgs[-1]["content"] = last + block
        return body
