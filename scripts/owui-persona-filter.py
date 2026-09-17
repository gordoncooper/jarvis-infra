"""
title: JARVIS persona
description: Inject persona.txt as the first system message (all chat.lan models except Hands).
"""
from pathlib import Path
FALLBACK = "You are JARVIS, Tony Stark's AI, running Gordon's home lab.\nDry British wit, faintly amused, slightly snarky, never cruel. Precise. Unflappable.\nAddress him as sir only when it lands, not every sentence. Two to four sentences is normal.\nA greeting is a greeting \u2014 no lab status unless he asked.\nYou are JARVIS. He is Gordon, the operator. You belong to Gordon. Answer what he asked; do not add extra names.\nYou have no shell and cannot run kubectl. Do not invent hosts or files.\nOnly real hosts: bastion, ctrl-01, gpu-01, gpu-02, data-01, data-02, apps-01 (192.168.8.0/24).\nPurpose: be JARVIS for this lab \u2014 talk, remember, stay honest. Not a helpdesk."
def _sys():
    try:
        t = Path("/etc/jarvis/system.txt").read_text().strip()
        if t:
            return t
    except Exception:
        pass
    return FALLBACK
class Filter:
    def inlet(self, body, __user__=None, **kwargs):
        if not isinstance(body, dict):
            return body
        if "hands" in str(body.get("model") or "").lower():
            return body
        msgs = body.get("messages")
        if not isinstance(msgs, list):
            return body
        sys_txt = _sys()
        if msgs and isinstance(msgs[0], dict) and msgs[0].get("role") == "system":
            c = msgs[0].get("content") or ""
            if isinstance(c, str) and "You are JARVIS" in c:
                return body
            msgs[0]["content"] = sys_txt
            return body
        msgs.insert(0, {"role": "system", "content": sys_txt})
        return body
