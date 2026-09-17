"""
title: JARVIS live telemetry
description: No-op inlet. Clock/LIVE/learned are not injected (7B recites them).
"""
class Filter:
    def inlet(self, body, __user__=None, **kwargs):
        return body
