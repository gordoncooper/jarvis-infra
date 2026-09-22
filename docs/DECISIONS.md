# Decisions

Append-only. Newest first. **A decision here outranks any prose in any other
doc.** If a doc contradicts a decision below, the doc is stale — fix the doc.

Each entry: what was decided, when, why, and what it supersedes. Never edit a
past entry to change its meaning; add a new one that supersedes it and mark the
old one `SUPERSEDED BY`.

Why this file exists: JARVIS has been guided by several different AI assistants,
each of which wrote confident prose describing a different product. Nothing
recorded which vision was current, so every new session picked a different one
and the build pulled apart. Decisions are now dated and ranked above prose.

Skim this index and open only the entries your task touches. Keep new entries
short — this file is authority #2, so every agent pays to read it.

| # | Decision |
| --- | --- |
| D-0038 | `jarvis-core` retired and removed; noc.lan rescued into git and Flux |
| D-0037 | `flux.status` + `backup.latest`; first RBAC grant to the orchestrator |
| D-0036 | Five capabilities the orchestrator serves itself; no RBAC widen |
| D-0035 | Conversational referents: "remember that" resolves, and stays confirm-gated |
| D-0034 | Intent classifier is promotion-only: it may name a verb, nothing else |
| D-0033 | Intent router: declared catalog + local constrained classifier; no tools for the talker |
| D-0032 | Cockpit pack is the product glass; confirm UI + pulse; Vite bastion-only |
| D-0031 | jarvis.lan four-display cockpit pack; godseye look superseded |
| D-0030 | jarvis.lan globe-as-stage (godseye); React+R3F via esbuild; classifier next |
| D-0029 | jarvis.lan Mark HUD cockpit + theme library; classifier next |
| D-0028 | Orchestrator-owned list memories; broader delete/remove forget phrases |
| D-0027 | Forget / forget-all are confirm-class (same UI as soft remember) |
| D-0026 | Memory/Hands UX: prefer-before-verb, scrub, °F, list pods |
| D-0025 | LLM memory candidate extract after heuristic miss (confirm-gated) |
| D-0024 | Memory confirm heuristics + durable session sqlite on NFS |
| D-0023 | Hands slice 2: confirm verbs recycle_pod + restart_deploy |
| D-0022 | Hands slice 1: three trusted verbs via OpenClaw constrained `/v1/verbs` |
| D-0021 | Product k8s/image names; implementation cuts start at v0.6.0 |
| D-0020 | Product code in `jarvis-app`; Python orchestrator + themed TS glass; `/v1` + SSE |
| D-0019 | v1 model roles: local talker+classifier; cloud specialist `jarvis-grok`; orchestrator picks |
| D-0018 | Product stays LAN-only for v1; no auth project until off-LAN is deliberately chosen |
| D-0017 | v1 glass scope SUPERSEDED BY D-0032 (confirm deferred / single blurb) |
| D-0016 | Product STT is orchestrator-proxied (Option Y); supersedes D-0015 call path |
| D-0015 | Whisper on gpu-02 (`small`); OpenAI transcriptions — call path superseded by D-0016 |
| D-0014 | v1 voice: glass PTT first; cluster Whisper; Piper TTS; laptop wake on same API |
| D-0013 | v1 memory: five stores; sqlite promoted on NFS; explicit remember auto-saves |
| D-0012 | Product path is glass shell + separate orchestrator; anti-smear wiring |
| D-0011 | v1 glass is LAN-default; one named cloud role allowed, with honest offline fallback |
| D-0010 | OpenClaw is break-glass + optional constrained actuator; not the product orchestrator |
| D-0009 | Third attempt builds glass before hands; NL/voice flexible, verb execution rigid |
| D-0008 | Claude/Grok deny list is irreversible-only; `kubectl apply` is shell-guarded with a `--dry-run` exception |
| D-0007 | Hard rules are enforced as deny rules and a shell guard, not prose alone |
| D-0006 | Claude Code and Grok CLI are sanctioned bastion agents; both read `AGENTS.md` |
| D-0005 | One rules file per repo: `AGENTS.md`, tracked in git |
| D-0004 | Governance docs split by lifetime: law / decisions / spec / state / history |
| D-0003 | `jarvis-core` is prior art, not the go-forward build |
| D-0002 | `jarvis.lan` is the product surface; `chat.lan` is break-glass |
| D-0001 | Goose runs on switchable backend profiles |

---

## 2026-09-21 — D-0038 — jarvis-core is retired and gone; noc.lan is rescued

**Status:** active. Executes D-0003, which called `jarvis-core` prior art in
2026-09-19 and left it in place. Gordon asked for the cleanup on 2026-09-21,
on the understanding that the repo was not in use. **It was, in one place**,
and that is the substance of this entry.

### The premise was wrong in one load-bearing way

`jarvis-core` the *workload* was genuinely dead — scaled 0/0, no Ingress, no
endpoints — and is deleted.

But `noc.lan` was live, serving, and its **entire definition lived inside
`jarvis-core`**: three source files, a Dockerfile, an install script and the
only copy of its manifest. It was applied by hand and reconciled by nothing.
VISION makes that surface load-bearing — it must render when the brain,
LiteLLM or Ollama are down — so deleting the repo would have left a running
operator surface with no definition anywhere, discoverable only at the moment
someone needed to rebuild it.

### What moved, before anything was deleted

| Thing | From | To |
| --- | --- | --- |
| noc source, Dockerfile, install script | `jarvis-core/noc`, `deploy/scripts` | `jarvis-infra/apps/jarvis-noc/` |
| noc manifest (SA, ClusterRole, Deployment, Service, Ingress) | `jarvis-core/deploy/k8s` | `cluster/clusters/jarvis/apps/jarvis-noc.yaml`, **Flux-managed** |

`kubectl diff` against the live cluster was empty before the adoption, so Flux
took ownership without changing a field; noc.lan stayed 1/1 and answering
throughout. The image is still built out of band — `imagePullPolicy: Never`
means Flux cannot pull it — so build with `install-noc.sh`, then reconcile.

`apps/jarvis-noc/` sits beside `apps/jarvis-home/`, which was already the home
for non-product app sources.

### What was deleted

- Live `Deployment` and `Service` `jarvis-core` in `apps`.
- The `~/jarvis-core` checkout.
- Every operational reference across the three repos: the "do not extend
  jarvis-core" rules, the install-script escape hatches, the stale
  `install-images.sh` cutover line, and `jarvis-core` in
  `hands.SHORT_NAMES` — where it had been a **write target** for a workload
  that no longer exists.

Both artefacts are archived on the bastion at
`~/attic/jarvis-core-repo-20260921-1728.tgz` and
`~/attic/jarvis-core-live-20260921-1728.yaml`. **That tarball is the last
local copy** once the GitHub repo is deleted, and the bastion has no off-box
backup (BACKLOG section C) — if the history matters, it wants a real home
before then.

### What stays

D-0003 and every other historical mention in this file. It is append-only, and
a decision that explains why the second attempt was abandoned does not stop
being true because the code is gone. `VISION`'s capability model no longer
cites `jarvis-core/policy.yaml` by path — the idea was carried forward, the
file was not.

---

## 2026-09-21 — D-0037 — Flux status and backup age; the orchestrator's first RBAC

**Status:** active. Adds the two capabilities D-0036 named and deferred.
Gordon asked for both on 2026-09-21.

| Verb | Class | Backend |
| --- | --- | --- |
| `flux.status` | trusted | Kubernetes API, read-only, orchestrator SA |
| `backup.latest` | trusted | status document on NFS, published by the backup job |

### flux.status — a real RBAC grant, deliberately tiny

Flux exports no metrics Prometheus is scraping, so unlike D-0036 this needs
the Kubernetes API. The grant is one ClusterRole in
`cluster/clusters/jarvis/apps/jarvis-orchestrator-rbac.yaml`: **get and list
on `kustomizations` and `gitrepositories` in `flux-system`.** No write verb,
no other API group, no pods, no secrets.

The `jarvis-orchestrator` ServiceAccount had **no RBAC at all** before this.
That is what makes the grant auditable — the file is the complete list of what
the product brain may see. Verified after applying: the two reads return `yes`
and `delete secrets`, `delete pods` and the status subresource return `no`.

`app/kube.py` is a read-only client with an allowlist of two paths. A caller
passes a *name*, not a URL, and an unknown name raises. A test asserts the
module contains no `post`, `put`, `patch` or `delete`.

**Why not OpenClaw**, which already has broad cluster read: "is the house in
sync?" is asked when something is wrong, and OpenClaw is the component most
likely to be wrong — its pod holds a `hostPort` that races on restart and it
has its own run of entries in LESSONS. A status read that depends on the
flakiest component is not a status read. Same reasoning as D-0036.

### backup.latest — the producer publishes, the consumer reads

`/cluster/nfs/backups` is `0750 root` and **stays that way**. Rather than
loosen it so a service can stat it, `backup-jarvis.sh` now writes a small
status document onto the NFS share the orchestrator already mounts, and the
verb reads that and nothing else. Answering "when did the last backup run?"
costs no access to the archives.

The seeded file carries the backup directory's own mtime, not the time it was
seeded, and is marked `seeded: true`. Claiming a backup finished just now
would be exactly the invented freshness this repo forbids.

If the file is absent the verb says so, and says that absence is **not** the
same as knowing there has been no backup.

### The gate had a blind spot, now closed

`test_router.py` can only score the deterministic pass — unit tests have no
model — so the classifier could violate the same three gates with nothing
failing. It did: with sixteen capabilities to choose from it began answering
*"tell me about flux"* with Flux status, a plain-chat regression invisible to
CI. Two changes:

1. The classifier prompt now says explicitly that *"tell me about X"* and
   *"what is X"* are chat even when X is flux, a pod or a GPU. Fixed it
   without another rule.
2. `app/score_router.py` **exits non-zero on any gate violation**, so the
   in-pod run is a check rather than a report. Run it after any change to the
   manifest or the prompt: every capability added gives the model more to
   over-trigger on.

**Measured:** deterministic floor 52 → **56**; with the classifier 61 → **66
of 78**; all gates zero.

### A verbless verdict is no longer thrown away

Driving the live host turned up the original disease returning: *"anything
broken?"* reached the talker, which replied *"the last health check indicated
everything was running smoothly"* — about a cluster it cannot see and a check
that never happened.

Not a timeout. The classifier returned **capability with no verb at 0.80** —
it knew the question was about the lab and could not say which capability.
D-0034 made verbless verdicts non-actionable deliberately, because acting on
them produced false denials, so the signal was discarded.

It stays non-actionable for *routing*: it cannot trigger a verb or a refusal.
But when the classifier is confident a turn is about the lab and names
nothing, the talker now receives an explicit instruction for that turn — you
could not check, say so, do not describe the cluster, do not refer to an
earlier check. Discarding the signal entirely is what let the invention
through.

The prompt also now names `cluster.health` for vague "is the lab well"
phrasings, which fixed *anything broken?*, *everything green?* and *all
good?*. *"What's going on with the house?"* still reaches the talker — the
classifier calls it chat — and is recorded as a fixture miss.

---

## 2026-09-21 — D-0036 — Five capabilities the orchestrator serves itself

**Status:** active. First capabilities added since D-0022 / D-0023. Gordon
delegated the naming on 2026-09-21 ("create a reasonable suite of verbs you
think would be appropriate"); the BACKLOG rule that RBAC widens only after he
names verbs is **unchanged and untouched** — none of these widen anything.

| Verb | Class | Backend | Answers |
| --- | --- | --- | --- |
| `pods.list` | trusted | Prometheus (kube-state-metrics) | where the pods are, what is unhappy |
| `storage.free` | trusted | Prometheus (node-exporter) | disk headroom per node |
| `weather.now` | trusted | open-meteo, already wired | the weather where the house is |
| `time.now` | trusted | orchestrator clock | the time and date |
| `deploy.version` | trusted | own version + glass `build.json` | which build is running |

**No shim verb, no RBAC change, nothing to recycle.** The obvious route was new
OpenClaw verbs, which means editing the shim ConfigMap and recycling OpenClaw
around the `hostPort` race. It was not needed: kube-state-metrics and
node-exporter are already in Prometheus, which the orchestrator already reads
for `/v1/pulse` (D-0012 permits exactly that), and open-meteo and the glass
build manifest were already wired.

That is not only convenience. **These keep answering when Hands is down** —
the half of the rack most likely to be sick when Gordon asks whether anything
is broken. VISION's third property, earned rather than asserted.

**All five are reads, and all trusted.** Nothing here has a blast radius. A
capability that needs a confirm belongs behind Hands with a Role, and
`test_capabilities.py` asserts no self-served capability is confirm-class.

**`pods.list` does not read out 41 pod names** — unreadable on the wall and
unlistenable over Piper. Counts per namespace, the names of anything not
Running, and the worst restart count.

**Deterministic rules shipped with them**, narrow ones. Without a rule, *"how
much disk is left?"* would reach the talker whenever the classifier is off or
unreachable, where before D-0036 it got an honest refusal. **The degraded path
is not allowed to get less honest.** The classifier covers the phrasings the
rules miss with no router change, because it reads the manifest (D-0034).

**Consequence, enforced by test:** `disk`, `storage`, `space`, `version` and
`deployed` left `router._UNSERVED_SUBJECT`, because a subject a capability now
owns must not also be refused. *"did the last deploy succeed?"* stays
unsupported — that is Flux reconcile state, which nothing serves.

**Measured:** deterministic floor 42 → **52**; with the classifier 47/64 →
**61 of 74**; all four gates at zero.

### Named but not built, and why

- **`logs.tail`** — `openclaw-recycle` *already* grants `pods/log` in the four
  namespaces, so this needs no RBAC change either. It is deferred anyway:
  permission is not the same as wisdom. Logs carry env dumps and tokens, and a
  verb that reads them aloud on a wall display is a secret-exposure surface
  that deserves its own decision, with redaction and a line cap designed in.
- **`flux.status`** — needs read access into `flux-system`, which the Roles
  deliberately exclude. A genuine RBAC decision, not a patch.
- **`backup.latest`** — the backend is unconfirmed; nobody has checked what
  filesystem the orchestrator can actually see. Do not name a verb whose
  backend has not been proven.
- **`files.list`** — has no defined subject. *"What files are in the
  directory?"* does not say which directory, and an allowlisted root has to be
  named before this can be a capability at all.

---

## 2026-09-21 — D-0035 — "that" resolves against the previous turn

**Status:** active. Completes D-0033 slice 4; the intent-router work is done.

`remember that`, `scratch that`, `delete that last one` and `that's wrong,
remove it` carry no fact of their own. Slice 0 stopped them storing the
literal word `"that"`; this resolves them.

**Referent store.** A per-session dict beside pending, on the same NFS sqlite
(D-0024), holding `last_user_text`, `last_candidate`, `last_fact_text` and
`last_verb`. Durable because a session outlives the pod and "remember that"
after a restart must not quietly mean something else. `last_candidate` is
cleared by any turn that found nothing, so the phrase cannot reach back
several exchanges.

**Still confirm-gated.** Resolving a referent is an inference about what
Gordon meant, and D-0013 says an inference is never written on its own. Every
resolution produces the ordinary Confirm/Cancel, never a silent write.

**"remember that" answers a pending remember.** While a remember confirm is
open it counts as yes. Without it the turn fell through to *"Still waiting:
… say yes or cancel"* — JARVIS offering to remember something and then
refusing to accept the answer, which is most of what "clumsy" meant.

**Extractor fix, required for the above.** The D-0025 prompt ended "Refuse …
questions", which swallowed the phrasing actually used: *"did you know I like
black coffee?"* is a question in form and a disclosure in content, so nothing
was extracted and "remember that" had nothing to point at. It now separates
"asks for information" (still refused) from "states a fact" (extracted). The
same change stopped it returning bare fragments like `{"fact":"Sarah"}` for
*"my wife's name is Sarah"*.

**Referent phrases are matched, not classified.** A closed set of four
phrasings, none of which means anything else. The classifier cannot serve them
— it names verbs and does not extract the target (D-0034).

**Deterministic floor 39 → 42 of 64.**

---

## 2026-09-21 — D-0034 — The intent classifier may name a verb, and nothing else

**Status:** active. Completes D-0033 slice 3 and **amends** the disposition
D-0033 predicted for the slice 2 refusal rule.

`jarvis-local` now classifies any utterance the deterministic pass could not
place, and may promote it to a declared verb. `ROUTER_CLASSIFIER=on`.

**Shadow mode earned its keep.** The first run said turning the classifier on
would be a **wash — 39/64 either way** — and showed precisely why. The 7B is
good at naming a verb: it got *anything broken?*, *did anything break
overnight?*, *is everything ok in the rack?*, *what are the lab urls?* and
*kill the whisper pod, it's wedged*, none of which any regex was going to
catch. It is bad at the capability/chat boundary when no verb fits: it called
*take a look at the flux error logs*, *is flux in sync?* and *what's the
latest backup of the cluster?* ordinary chat, demoting six honest refusals
back into hallucinations, and answered *everything green?* with
capability/no-verb, which would have denied a `cluster.health` question
outright.

**So the classifier is promotion-only.** It may name a verb from the manifest.
It may not demote a refusal to chat, and it may not invent a refusal. Each
side keeps what it is good at: `router.is_house_request` owns "nothing serves
this subject", which is a fact about the manifest rather than a guess, and the
model owns "which verb did he mean", which no list of patterns was going to
cover. Re-measured: **39 → 47 of 64**, all three gates at zero, and all eight
answers it changed were correct.

`memory.remember` / `memory.forget` are not promotable — both need a fact
extracted from the utterance, which the classifier does not produce, so naming
one would open a confirm prompt with nothing in it.

**Amendment to D-0033.** That entry said the slice 2 rule would either become
a prefilter or be deleted, and "does not survive as a parallel router". The
measurement says otherwise, so the rule **stays**, as the authority on
unserved subjects and as the entire refusal path when the model is
unreachable. It is not a parallel router: it cannot name a verb, and the
classifier cannot overrule it except by naming one. The D-0033 constraint
that still holds is the one that matters — **do not extend it with patterns.**

**Still no tools for the talker.** `classify.parse_verdict` rejects any name
outside the manifest, so an invented `cluster.nuke`, or a "verb" of
`kubectl delete ns apps`, becomes nothing. Writes need a higher confidence
floor than reads (0.8 vs 0.6) and remain confirm-gated under D-0023.

**Cost.** One extra local call, ~1.0–1.5 s, only on turns the deterministic
pass could not place; a turn that matches a verb pays nothing. A timeout or a
malformed reply degrades to exactly slice 2 behaviour. No cloud hop: routing
is on the critical path of every turn and must survive the house being sick.

**Found on the way, fixed:** `hands.SHORT_NAMES` had drifted from the cluster
— `piper` listed under `inference` when it runs in `apps`, `whisper` where the
Deployment is `jarvis-whisper`, and `jarvis-home` / `speaches` /
`openedai-speech` / `nvidia-gpu-exporter` no longer Deployments at all. These
are **write** targets, so a wrong row is a confirm prompt offering to restart
something that is not there. Corrected against the live cluster; verify with
`for ns in apps inference agents monitoring; do kubectl -n $ns get deploy; done`.

---

## 2026-09-21 — D-0033 — Intent router: declared catalog + local constrained classifier

**Status:** active. Executes the escape hatch D-0022 left open — *"ingress
regex on the orchestrator for v1; may add LLM classify later without changing
the verb boundary"* — and closes the VISION principle *"intelligence in the
router, not regex on English."* Changes no verb, no RBAC, no model pin.

**Why now.** Measured on live `jarvis.lan` (v0.6.26) on 2026-09-21 against 89
utterances: **36 of them were capability requests that reached the toolless
talker**, which answered anyway — *"the last update I recall was from
yesterday"* about a cluster it cannot see. The leak runs both ways: `what is a
GPU?` returned GPU temperatures, because the `cluster.gpus` regex matches the
bare word. Capability recall 26/64; 3 plain-chat utterances stolen by a verb.

**The talker still gets no tools.** No `tools` array, no tool-call parsing, no
`supports_function_calling` flip. A separate non-streaming classify call
returns a JSON **label**; the orchestrator validates it against a declared
manifest and refuses anything not in it. Execution is unchanged — OpenClaw shim
`POST /v1/verbs`, same trust classes, same confirm gate, same audit row.

**Manifest** (`orchestrator/app/capabilities.py`) is the one source for the
router prompt, the talker's capability statement, the execute path, and the
`meta.capabilities` verb. It covers the memory verbs too — `memory.py` is a
second regex router and half the failures are there. `hands.CATALOG` is derived
from it, so the set JARVIS offers cannot drift from the set he can run.

**Order of resolution:** deterministic match → classifier → honest refusal →
talker. A capability-shaped utterance with no matching verb **never reaches the
talker**; it is answered from the manifest. That rule alone removes every
hallucination measured above, and it shipped before the classifier (slice 2,
v0.6.29).

**The slice 2 refusal trigger is a stopgap, and it expires.** Deciding
"capability I lack" vs "small talk" needs the classifier's verdict, which does
not exist until slice 3, so slice 2 does it with a rule on sentence shape
(`router.is_house_request`) — an imperative or a reference to state that only
exists here and now, minus anything conceptual. This is a rule on English,
i.e. the thing this decision exists to remove, so it carries three
constraints:

1. **Refuse only a subject nothing owns.** Not "looks like an instruction" —
   the first cut tried that and told Gordon "that is not something I can do"
   in answer to *show me all your saved facts and memories*, while offering
   two lines later to read back everything he had asked it to remember. A
   refusal that contradicts its own capability list is worse than the
   hallucination it replaced. The rule now requires a subject no capability
   covers (logs, backups, disk, files, Flux state, image versions); when a
   capability lands for one, its word leaves that list in the same commit.
   Vocabulary alone cannot make the call either — 11 of the 25 plain-chat
   fixture utterances mention pods, flux, nodes or GPUs.
2. **Do not extend it with more patterns.** Adding a phrase to catch one more
   miss is the treadmill (`BACKLOG` §G bans exactly this shape). Record the
   miss in the fixture and let slice 3 take it.
3. **It dies at slice 3.** It then either becomes the cheap prefilter deciding
   whether to *spend* a classify call on an utterance, or it is deleted
   outright. It does not survive as a parallel router.

**Routing decisions stay on local compute.** `jarvis-local` on the rack's own
GPU — the D-0019 Classifier role, unchanged. Routing is on the critical path of
every turn and must survive the house being sick (VISION: *"it stays up when it
is sick"*). Escalation if the 7B is not accurate enough, in order: tighter
rubric → constrained JSON decoding → a second **local** model → drop the
classifier and keep the honest refusal. Moving the Classifier role to
`jarvis-grok` is a separate decision, never a fallback.

**Gate.** A committed utterance fixture scored by the orchestrator test
suite, which `scripts/install-images.sh` runs before it builds — a failing
gate stops the ship. Three assertions, all absolute counts rather than rates
(a rate over the mixed set climbs when you add negatives, which lets a gate
rot while looking healthier):

| Assertion | Recorded |
| --- | --- |
| plain chat captured by a capability | **0** (was 3 before slice 1) |
| ordinary questions answered with a refusal | **0** |
| requests JARVIS *can* serve, refused | **0** |
| capability passes | **≥ 39** of 64 |

The recorded pass count moved 26 → 25 → 28 → 39; the first two moves were
corrections rather than progress, and every reason is written into
`test_router.py` so the number stays auditable. The third assertion exists
because its absence let v0.6.29 ship a rule that refused three things JARVIS
could do.

**Rollout.** `ROUTER_CLASSIFIER=off|shadow|on`. Shadow logs the classifier
beside the regex decision against real traffic before it can affect a turn.

**Referents.** Per-session `last_candidate` / `last_memory_write_id` /
`last_verb` resolve "remember that" and "delete that last one". Resolving a
referent is a model inference about what Gordon meant, so it stays
confirm-gated under D-0013 — it does not become an auto-save.

**No new verbs.** Gordon's examples (Flux logs, backups, directory listings)
illustrated the class of thing wanted, not a request; he confirmed on
2026-09-21 that more command skills come later. `openclaw-recycle` RBAC is
untouched. `meta.capabilities` reads the manifest and nothing else.

**Unchanged:** D-0019 model pins; D-0022 / D-0023 verb catalog and classes;
LiteLLM `keyword_tier_rules` and the `classifier_type: llm` BACKLOG ticket,
which are the **break-glass chat.lan** path and not this.

How it ended up working: `jarvis-app` `docs/ARCHITECTURE.md` — *How a turn
is routed*. The slice tracker this entry originally pointed at was deleted
when the last slice landed, as it said it would be; D-0034 and D-0035 carry
what it measured.

---

## 2026-09-20 — D-0032 — Cockpit pack is the product glass

**Status:** active. Supersedes the *scope* of D-0017 (confirm UI deferred;
single briefing_blurb) and the *default look* of D-0029 / D-0030.

- Default theme: `cockpit` (four slideable displays: Login, Earth, CMD, NOC).
- Archived themes: `godseye`, `mark-hud`, `archive-gold` — rebuildable, not served.
- Confirm UI ships in glass (CMD Channel + Earth toast). Hands/memory confirms stay orchestrator-owned.
- Briefing on `/v1/session` may be structured (`overnight`, `lab`, `agenda`, `today`, `focus`) with `briefing_blurb` as fallback.
- `/v1/pulse` is an orchestrator read model for Earth chips + NOC. Glass does not scrape noc.lan, home.lan, or Prometheus.
- Production bundle remains esbuild → static nginx. Vite is allowed as a bastion-only dev server for glass. motion, SVG topology, and uPlot/canvas are allowed.
- jarvis.lan may host the NOC *display*. noc.lan / home.lan remain independent operator surfaces and are not the product chrome.

---

## 2026-09-20 — D-0031 — jarvis.lan four-display cockpit

**Status:** active for four-display layout. SUPERSEDES D-0030 look-and-feel.
Default pack and glass chrome scope clarified by D-0032. Theme-pack library
still stands. Product pack is `cockpit` only; `godseye` and `mark-hud` are
archived themes, rebuildable, not default.

Product pack: `cockpit`. Four horizontal slides: Login (literal splash JPG +
stub Enter) → Earth Stage (`jarvis.jpg`) → AM Briefing CMD → Topology NOC.
Arrow keys / drag between panels. Real `/health` + session turns/PTT/confirm
on Stage/Cmd/Noc cmd bars; pulse via orchestrator `/v1/pulse` (D-0032) — no
noc.lan scrape (D-0012).

`godseye`, `mark-hud`, and `archive-gold` stay rebuildable. Pin
`JARVIS_THEME=cockpit`. React+R3F via esbuild remains the production packer;
Vite as bastion-only glass dev server allowed (D-0032). Earth may use WebGL;
NOC uses SVG.

**Next product-logic priority:** LiteLLM `classifier_type: llm` (BACKLOG A).

---

## 2026-09-20 — D-0030 — jarvis.lan globe-as-stage; React+R3F via esbuild

**Status:** look-and-feel SUPERSEDED BY D-0031. esbuild React+R3F allowance and
theme-pack library still stand.

jarvis.lan is a **stage**: a WebGL globe you look through, with docked
holographic chrome (ribbon, dossier chip, floating channel, arc meters,
ticker, CMD). Not a three-column form. Empty channel reveals Earth.

Product pack: `godseye`. `mark-hud` is archived (rebuildable 3-column).
`archive-gold` stays rebuildable. Pin `JARVIS_THEME` as today.

Glass may use **React + three + R3F + drei + motion**, bundled by **esbuild
to static nginx**. Vite, Tailwind, Recharts, and a port-8080 preview remain
out. IBM Plex via fontsource (LAN). Tokens: canvas `#07090b`, hair `#1c252e`,
steel `#8b9aaa`, ink `#e7eef4`, accent `#5eead4`, `--accent-dim` as OKLCH so
teal does not blow out. Widgets read real `/health` + turn/confirm/PTT — no
fake telemetry, no noc.lan scrape (D-0012).

**Next product-logic priority:** LiteLLM `classifier_type: llm` (BACKLOG A).

---

## 2026-09-20 — D-0029 — jarvis.lan Mark HUD cockpit + theme library

**Status:** look-and-feel SUPERSEDED BY D-0031 (was D-0030). Theme library still active.

jarvis.lan is a **cockpit** (rail, stages, meters, console over a dark grid),
not a centered chat column. Glass `src/` is theme-agnostic. Packs live in
`jarvis-app/glass/themes/<name>/`. Pin `JARVIS_THEME` in `jarvis-app/VERSION`
(product pack was `mark-hud`; D-0030 moves product to `godseye`). Rebuild/swap
is pack CSS → `npm run build` → glass image tag → Flux. `archive-gold` keeps
the previous look rebuildable.

Mark HUD tokens: canvas `#07090b`, panels `#0c1014` / `#10151b`, hair `#1c252e`,
steel `#8b9aaa`, text `#e7eef4`, accent `#5eead4` only on LIVE/selected/meters.
IBM Plex Sans + Mono. Radius 2–4px. Motion 160ms ease-out.

**home.lan** stays until a later deprecation cut (noc.lan after that).
**Next product priority:** SUPERSEDED BY D-0030 (classifier still next after
the globe HUD ships).

---

## 2026-09-20 — D-0028 — List memories + natural delete phrasing

**Status:** active. Extends D-0027.

`list memories` / `what do you remember` returns promoted sqlite facts from the
orchestrator (trusted read) — the talker must not invent a memory inventory.
`delete/remove the memory about …` and `remove my preference for …` are
forget-class (confirm-gated). Duplicate explicit/soft remembers reply
“Already noted” instead of inserting again. Forget/dedup matching is
stricter so multi-token queries do not half-overlap on a shared word.

---

## 2026-09-20 — D-0027 — Forget is confirm-class

**Status:** active. Tightens D-0013 / D-0024.

Durable **deletes** use the same Confirm/Cancel path as soft remembers and
Hands confirm verbs. `forget …` / `stop remembering …` preview matching facts
(and may list several); `forget everything` / `clear my memory` previews all
active promoted facts. Yes tombstones the previewed set; cancel writes nothing.

Explicit **remember that…** stays auto (named constructive ingress, D-0013).
Soft preference/identity writes stay confirm (D-0024). Classification:

| Action | Class |
| --- | --- |
| Explicit remember | trusted (auto) |
| Soft remember / LLM extract propose | confirm |
| Forget / forget-all | confirm |

---

## 2026-09-20 — D-0026 — Memory / Hands UX fixes

**Status:** active. Tightens D-0024 / D-0025 after jarvis.lan smoke.

- Heuristic preference candidates run **before** Hands verbs so “I prefer GPU
  temps in Fahrenheit” proposes memory instead of firing `cluster.gpus`.
  Heuristic hits return the Confirm ask immediately (no talker round-trip).
- Talker claims of “I will remember” / forged `### User:` lines are scrubbed
  before the Confirm ask on LLM-extract proposes; glass applies final
  `reply_text` after stream.
- GPU formatting honors newest Celsius/Fahrenheit preference in promoted memory.
- Forget replies name the removed fact(s), not a bare count.
- `list pods` / smart-apostrophe `how’s the cluster` → `cluster.health`;
  `restart the orchestrator` resolves via short-name alias.

---

## 2026-09-20 — D-0025 — LLM memory candidate extract

**Status:** active. Extends D-0024.

After talker turns, if heuristic candidates miss and the utterance is eligible
(not short, not lab/metrics, not yes/cancel), the orchestrator calls
`jarvis-local` non-stream JSON extract (`{"fact":…|null}`). Still **confirm-
gated** — never auto-writes. Timeout/failure → no propose. Heuristics remain
the fast path.

---

## 2026-09-20 — D-0024 — Memory confirm + session durability

**Status:** active. Completes deferred D-0013 / D-0017 confirm UI for
non-explicit facts, and the allowed session-on-NFS enhancement.

**Memory confirm:** heuristic candidates (preference / identity phrases without
“remember that…”) propose a one-line fact; glass Confirm/Cancel or wake
`yes`/`cancel` writes promoted sqlite. Explicit remember/forget still auto-run.
Secrets refused. No LLM extractor in this cut.

**Session durability:** `sessions.sqlite` beside `promoted.sqlite` on the
existing `/mnt/nfs/jarvis` hostPath. Messages + pending (hands|memory) survive
orchestrator restart. Glass keeps `session_id` in localStorage.

---

## 2026-09-20 — D-0023 — Hands slice 2: confirm-class recycle verbs

**Status:** active. Extends D-0022 with Gordon-named **confirm** verbs.

| Verb | Class | Args | Backend |
| --- | --- | --- | --- |
| `apps.recycle_pod` | confirm | `namespace`, `name` | `k8s.js delete-pod` |
| `apps.restart_deploy` | confirm | `namespace`, `name` | `k8s.js restart-deploy` |

Namespaces allowlisted only: `apps`, `inference`, `agents`, `monitoring`
(existing `openclaw-recycle` Roles — **no RBAC widen**).

**Path:** match → session pending (90s) → glass Confirm/Cancel or wake/typed
`yes`/`cancel` → shim `POST /v1/verbs` with `confirmed:true` → audit.
Shim refuses write verbs without `confirmed`.

Trusted read verbs from D-0022 unchanged.

---

## 2026-09-20 — D-0022 — Hands slice 1: three trusted verbs

**Status:** active. Names the first product verbs under D-0009 / D-0010.
Confirm/recycle verbs: see D-0023.

Gordon confirmed the catalog. **Trusted** (auto-run, no confirm UI):

| Verb | Backend |
| --- | --- |
| `cluster.health` | OpenClaw skill helpers `k8s.js nodes` + `pods` |
| `cluster.gpus` | Prometheus helpers for GPU temp + memory |
| `lab.map` | Static product URL map + live node list |

**Path:** glass/wake → orchestrator heuristic match → OpenClaw shim
`POST /v1/verbs` with `{verb}` (not free-form agent chat) → audit row → reply.
No RBAC widen. Confirm-class recycle verbs: D-0023.

**Classifier:** ingress regex on the orchestrator for v1; may add LLM classify
later without changing the verb boundary.

---

## 2026-09-19 — D-0021 — Product names; build cuts start at v0.6.0

**Status:** active.

**Tagging:** `v0.5.2` is the planning-freeze snapshot across `jarvis-infra`,
`cluster`, `jarvis-app`, and `jarvis-core`. **Implementation / slice work
starts at `v0.6.0`** — create that tag when slice 1 lands, not before. Never
retag (law).

**Kubernetes (product path, namespace `apps`):**

| Kind | Name |
| --- | --- |
| Deployment + Service | `jarvis-glass` |
| Deployment + Service | `jarvis-orchestrator` |
| Ingress Host | `jarvis.lan` → **glass only** |
| Orchestrator exposure | ClusterIP (and/or mesh-internal); not a public Host |

Glass talks to orchestrator in-cluster (D-0012). Do not put LiteLLM/OWUI/OpenClaw
on the Ingress for the product path.

**Images** (built from `jarvis-app`, independent of homepage `IMAGE` in infra
`VERSION`):

| Image | Role |
| --- | --- |
| `docker.io/library/jarvis-glass` | Static themed UI |
| `docker.io/library/jarvis-orchestrator` | Brain / `/v1` API |

Product image tags live in a `VERSION` (or equivalent) **in `jarvis-app`**,
sourced by build scripts — do not retype pins into prose. Infra `VERSION`
keeps rack/`jarvis-home` pins.

**Later (not slice 1):** `jarvis-whisper` on gpu-02 (D-0015/D-0016). Themes are
assets/packs under `jarvis-app`, not separate Deployments.

**Cutover:** new glass+orchestrator replace the `jarvis-core` stub on
`jarvis.lan` (D-0017). Leave `noc.lan` alone.

---

## 2026-09-19 — D-0020 — jarvis-app product repo; orchestrator + themed glass; `/v1` API

**Status:** active. Pins implementation home and v1 API shape under D-0012 / D-0017.

**Repos / layers**

| Layer | Repo | Origin |
| --- | --- | --- |
| Metal, law, scripts, SOPS, discover | `jarvis-infra` | GitHub |
| Flux YAML only | `cluster` | Gitea |
| Prior art (read-only) | `jarvis-core` | GitHub |
| **Product: orchestrator, glass, themes** | **`jarvis-app`** (new) | GitHub |

Factory apps JARVIS builds later get **their own repos** (or a products org). Their
Flux manifests still land in `cluster`. Do not put factory output into
`jarvis-infra` metal or into `jarvis-app` unless deliberately promoted to product.

**Runtime:** two Deployments — **glass** and **orchestrator** (D-0012). Flux
YAML in `cluster`; images built from `jarvis-app`.

**Languages:** Python orchestrator (FastAPI/Starlette or equivalent). Glass is
TypeScript compiled to **static** assets (not a Vite/App Builder greenfield).
Orchestrator is **theme-agnostic**. Look-and-feel is a **theme pack** in
`jarvis-app`; swap theme via commit → image/ConfigMap → Flux restart. A theme
library is allowed; rich dynamic visuals may grow inside themes later without
moving policy into the glass.

**API (v1):** versioned under `/v1/`. Minimum: `GET /health`, `GET /v1/session`,
`POST /v1/turns` (text or multipart audio per D-0016), TTS fetch as needed.
**SSE** for reply streaming is in scope for v1. Further endpoints may be added
under `/v1/` or a later `/v2/` without breaking clients. Glass sends no model
ids (D-0019).

**Out:** product source in `cluster`; evolving `jarvis-core` as the app home;
smearing LiteLLM/OWUI as the product API.

---

## 2026-09-19 — D-0019 — v1 model role pins

**Status:** active. Pins VISION open question 3 / D-0011 for the product path.

The **orchestrator** selects the model id per turn. The glass never shows a
model picker and never passes LiteLLM aliases. Product traffic does **not** use
the `jarvis` complexity auto-router or `keyword_tier_rules` as the daily driver.

| Role | LiteLLM id | When |
| --- | --- | --- |
| Talker | `jarvis-local` (Ollama 7B) | Default conversation |
| Classifier | `jarvis-local` | Short classify prompts (remember vs chat, etc.) |
| Cloud specialist | `jarvis-grok` (`grok-4-fast`) | The one named cloud hop (D-0011) |
| Embed | `jarvis-embed` | Optional memory projection only |
| Coder | deferred | Not required for v1 glass; see note below |
| Hands | not product | `jarvis-hands` / OpenClaw remain break-glass (D-0010) |

**Offline:** if `jarvis-grok` is unreachable, stay on `jarvis-local` and say so.
If local inference is down, degraded banner (D-0017) — no silent cloud-only
talker.

**Coder (deferred) means a product role**, not the bastion workshop. When hands
land, “coder” is an orchestrator-selectable model (likely `jarvis-grok-code`)
for house tasks spoken through `jarvis.lan` (e.g. draft a Flux diff the verb
path may apply). It is **not** Claude Code / Grok CLI / Cursor / Goose — those
stay **operator workshop** agents on the bastion (and guidance in D-0007).
Building JARVIS and being JARVIS stay separate.

---

## 2026-09-19 — D-0018 — Product is LAN-only for v1; auth waits for off-LAN

**Status:** active. Answers VISION open question 6 for v1.

`jarvis.lan`, the orchestrator, Whisper, and Piper stay **on the LAN**. No
product off-LAN exposure in v1. No auth/OIDC/SSO project for the glass while
that is true — LAN trust.

**Before** any product surface is reachable outside the LAN, stop and record a
new decision for auth and exposure. Silent tunnel / DNS / Traefik tweaks that
publish the product do not count as “later.”

**Deferred options (known, not chosen):** Gordon has a Dynu domain and a
personal Tailscale account. Either may be considered when off-LAN is
deliberately on the table; neither is a v1 dependency or a default. Prefer the
option that earns its ops cost when that session comes.

Break-glass (`chat.lan`, `agent.lan`, etc.) unchanged and still not the product
path (D-0002).

---

## 2026-09-19 — D-0017 — v1 glass scope

**Status:** scope SUPERSEDED BY D-0032 (confirm UI + structured briefing +
cockpit chrome). First-cut replace-stub / PTT / no-model-picker still stand.

**Surface:** `jarvis.lan` is a **new** glass shell + **new** orchestrator. They
**replace** the live `jarvis-core` stub on that Host. Do not evolve the stub in
place (D-0003). `noc.lan` and break-glass hosts stay independent.

**First viewport:** greeting + short briefing blurb + conversation thread (and
input / PTT). Not a NOC, not a widget wall, no model picker.

**v1 done bar** (Gordon on `jarvis.lan` only):

1. Feels like JARVIS (not OWUI, not NOC)
2. Typed conversation with persona; no model picker
3. Session survives glass restart (D-0013)
4. Explicit remember / forget per D-0013 auto path
5. PTT once → orchestrator → Whisper (D-0016) → text reply; Piper when TTS up
6. Honest degraded state if orchestrator or LLM is down

**Memory UI:** explicit “remember that…” / “forget…” auto-save; non-explicit
preference/identity candidates use Confirm/Cancel (D-0024).

**v1 extras kept:** degraded banner that does not depend on the talker; clean
cutover of `jarvis.lan` ingress to the new glass.

**Out of v1 glass:** hands/verbs, laptop wake as a gate, confirm cards, second
voice, off-LAN auth, mini-NOC chrome, extending `jarvis-core`.

---

## 2026-09-19 — D-0016 — Product STT is orchestrator-proxied (Option Y)

**Status:** active. SUPERSEDES D-0015’s call-path choice (Option X).

Glass and laptop send **audio to the orchestrator**; the orchestrator calls
Whisper on gpu-02 and continues the turn with text. Clients do not hold a
product Whisper URL or STT credential. Whisper remains internal LAN infra
(Service + NetworkPolicy), OpenAI-compatible, digest-pinned, model `small`,
request/response — all as in D-0015.

**Why switch:** stronger anti-smear / one front door (D-0012), one product
credential story, Whisper stays a dumb engine. On this LAN the extra hop is
not the dominant voice latency (Whisper + talker + TTS are); Option X’s
responsiveness edge was theoretical for lab scale.

Laptop wake and glass PTT both use this path once they speak to the
orchestrator API (D-0014).

---

## 2026-09-19 — D-0015 — Whisper service shape (v1)

**Status:** SUPERSEDED BY D-0016 for call path. Placement, model, and API pins
below still stand.

**Placement:** dedicated Whisper Deployment on **gpu-02** (CUDA). Do not put STT on
gpu-01 (chat VRAM) or bury it inside OWUI / the orchestrator pod. Embedding on
gpu-02 stays; STT is not a second chat model (VISION non-goal still holds).

**Model:** pin **`small`** for v1 (better punctuation/accuracy than today’s OWUI
`base`, still modest next to nomic-embed). Shrink only if measured pressure on
embed/VRAM demands it.

**API:** OpenAI-compatible `POST /v1/audio/transcriptions`, **request/response
only** (no streaming partials in v1). Image **digest-pinned** (no `:latest`).

**Product call path:** SUPERSEDED BY D-0016 (Option Y — orchestrator proxies
audio). Was Option X (clients → Whisper → text → orchestrator).

**Not required for v1:** an explicit concurrency-cap rule (lab scale; GPU-bound
STT). Add later if abuse or queueing shows up.

**Latency note:** on this LAN the dominant voice delay is Whisper inference +
talker (+ TTS), not an extra in-cluster hop.

---

## 2026-09-19 — D-0014 — v1 voice stack

**Status:** active. Answers VISION open question 5 for v1.

Voice is **ingress and egress**, not a second brain. Typed and spoken turns both
become text to the orchestrator (D-0012). Messy STT is expected; verb/memory
boundaries stay as in D-0009 / D-0013.

**Primary daily path (v1):** push-to-talk / Call-like mic on `jarvis.lan` first.
**Laptop wake** (`hey jarvis` via openWakeWord / `jarvis-wake.py`) ships as soon
as it can call the **same orchestrator API** — not a parallel OWUI path. Stock
wake phrase only; no custom wake model and no always-on cluster room mic in v1.

**STT:** cluster Whisper is the product source of truth. Glass and laptop are
clients. Browser Web Speech may fallback; OWUI’s embedded Whisper is break-glass
only, not product SoT.

**TTS:** Piper on-cluster remains the product speaker; keep the GB mapping
(`alloy` → en_GB-northern_english_male-medium) as the default JARVIS voice. A
**second** voice may be added later; do not make Kokoro / browser Web API the
product voice.

**API discipline:** orchestrator returns reply text and may attach or authorize
a TTS audio reference so clients do not each re-wire Piper. Shared cluster STT
serves both glass upload and laptop transport.

**Transport rules (keep):** laptop/glass listeners do not special-case questions
or inject live telemetry. Local UX commands (stop / pause / mute / repeat /
status) stay on the client after STT and are not chat turns or verbs.

**Degraded:** if Piper or Whisper is down, glass still shows text and says so.
`chat.lan` voice remains break-glass when the product path is sick.

**v1 extras kept:** shared cluster STT; orchestrator-owned TTS contract; glass
PTT before chasing perfect wake.

**Out for v1:** always-on room mics, cloud STT/TTS as primary, duplex phone-call
barge-in as a requirement, custom wake training.

---

## 2026-09-19 — D-0013 — v1 memory doctrine

**Status:** active. Answers VISION open question 4 for v1.

Five kinds of “memory,” one source each. Live cluster truth is **not** a memory
store — it is queried, never persisted as fact.

| Store | SoT | Writer |
| --- | --- | --- |
| Persona | git (`docs/persona.txt`) | Human in git |
| Briefing (stable world) | git (`docs/briefing.md`) | Human in git |
| Promoted | sqlite on NFS under `/cluster/nfs/jarvis/` | Orchestrator only |
| Session | orchestrator-local (survives **glass** restart) | Orchestrator |
| Live | kubectl / metrics / tools | Nobody as “memory” |

**Promoted:** sqlite rows (id, timestamp, text, source turn, tombstone). Forget is
first-class (soft-delete + audit line). Embeddings, if used, are a rebuildable
**projection** of sqlite — not a second source of truth.

**Remember / forget ingress:** clearly marked phrases (“remember that…”,
“forget…”, and close variants after STT cleanup) may **auto-save** /
tombstone. Any other candidate fact is shown in the glass and requires
**confirm** before write. Normalized one-line facts; model inference alone is
never stored.

**Git boundary:** product “remember” **never** writes git. Promote-to-briefing
is a later explicit path, not v1. Keep today’s git briefing vs NFS promoted
split.

**Session durability (v1+):** survive glass restart. Surviving orchestrator
restart via session sqlite on NFS is **shipped** (D-0024).

**Never written:** secrets, tokens, key material, raw vault contents, live
metric snapshots-as-facts, unconfirmed model inferences, OpenClaw private
dreams as product memory.

**Product path:** glass reads/writes memory only via the orchestrator (D-0012).
OWUI filters + hostPath `learned.md` remain break-glass / legacy until migrated;
they are not the product SoT.

**v1 extras kept on purpose:** confirm UI for non-explicit remembers; forget +
audit; session that outlives the glass process.

---

## 2026-09-19 — D-0012 — Glass shell + separate orchestrator; no smeared product path

**Status:** active. Answers VISION open question 2 for deployment shape.

The product path is **split**: a glass shell on `jarvis.lan`, and a **separate
orchestrator** service. The orchestrator owns routing, session state,
confirmations, the audit log, and (when hands land) verb dispatch.

**Anti-smear:** the glass (and later voice client) talks **only** to the
orchestrator. No direct product wiring from the glass to LiteLLM, Open WebUI,
or OpenClaw. Those remain backends the orchestrator may call, or break-glass
surfaces outside the product path.

`noc.lan` stays independent of the brain (D-0002). `chat.lan` and `agent.lan`
remain break-glass and are not the product conversation path.

Supersedes: any design that routes `jarvis.lan` through OWUI filters, LiteLLM
aliases, or OpenClaw as the daily driver (the shape VISION called out as
smeared).

---

## 2026-09-19 — D-0011 — v1 glass is LAN-default; one named cloud role may hop

**Status:** active. Answers VISION open question 3 for v1.

Classifier and talker for `jarvis.lan` default to on-LAN models (Ollama via
LiteLLM). One **named** cloud role is allowed from day one (e.g. hard reasoning
or a later coder path), summoned deliberately — not the married primary brain.
When that role or the internet is unavailable, the glass degrades honestly and
keeps serving on LAN. Cloud-only as the primary talker is refused for v1.

Does not settle which exact model fills the cloud role; that is a later pin.
Operator/break-glass paths (`chat.lan` prefixes, Goose `xai`) stay as they are.

---

## 2026-09-19 — D-0010 — OpenClaw is not the product orchestrator

**Status:** active. Answers VISION open question 1 for the actuator side.

OpenClaw stays on `agent.lan` as **break-glass** and may later execute
**declared** product verbs as a constrained backend (verb name + args, not
free-form agent chat). It does **not** own the product glass, routing,
confirmations, session state, audit log, or verb registry — those live in the
third-attempt orchestrator.

Do not replace OpenClaw in this planning pass. Do not widen its RBAC unless
Gordon names the verbs. Revisit replacement only if it keeps fighting verb
discipline after the glass is real.

---

## 2026-09-19 — D-0009 — Glass before hands; flexible ingress, rigid verbs

**Status:** active. Sequences the third attempt (D-0003).

Build and establish `jarvis.lan` as the calm product surface **before** investing
in the hands path. When hands land, ship a real verb catalog (`trusted` /
`confirm` / `refuse`), not a toy read-only stub — flexible enough for daily use,
including voice (messy STT, missing punctuation).

Split that matters: natural language and voice are flexible at **ingress**;
execution is rigid at the **boundary** (named verb + args + class + audit). The
model maps messy speech onto declared verbs; it never invents verbs.

Supersedes: any implication that a thin read-only hands spike precedes glass.

---

## 2026-09-19 — D-0008 — Prefix deny rules cannot express “except dry-run”

**Status:** active. Narrows D-0007.

`.claude/settings.json` prefix rules match `kubectl apply --dry-run` the same as
a real apply, so they blocked a read-only check. `kubectl replace` is
Flux-recoverable, same as patch.

Claude/Grok deny is now only irreversible ops (PVC/PV/namespace delete,
force-push, `git tag -f`, key material). `kubectl apply` lives only in
`~/.agent-guard.sh`, which lets `--dry-run` through.

---

## 2026-09-19 — D-0007 — Hard rules are enforced, and aimed at what cannot be undone

**Status:** active

Prose is advisory: asked cold, an agent that had not loaded `AGENTS.md` asserted
GitHub was Flux's origin (D-0006). The hard rules are therefore enforced in two
layers that do not need the model to cooperate.

- **`.claude/settings.json`** — committed at each repo root, plus a user-scope
  copy so the rules hold outside a repo too. Claude Code reads it natively and
  Grok through Claude compatibility, so one file covers both. This is
  *enforcement config, not a rules file*: D-0005 does not apply, and it is not a
  second bible. Do not delete it as duplication.
- **`~/.agent-guard.sh`** — sourced from `~/.bashrc`, replaces the Goose-only
  guard. Wraps `kubectl`, `k3s` and `git` beneath whatever permission system the
  agent uses. Fires on `GOOSE_TERMINAL`, `CLAUDECODE`, `GROK_AGENT` or
  `CURSOR_AGENT`; inert in a human shell.

**What is guarded is what cannot be undone.** `patch`, `edit`, `scale` and
ordinary deletes are deliberately left alone — Flux reconciles them within a
minute, and blocking routine debugging is how a guard earns itself a
`--dangerously-skip-permissions` habit, after which nothing is protected.
Blocked instead: `kubectl apply`/`replace` (named in law, and how drift starts),
deleting a PVC, PV or namespace, `git push --force`, `git tag -f`, and reads of
key material. `--force-with-lease` is deliberately left available: it is the
safe variant, and blocking it was a false positive worth fixing rather than
tolerating. `learned.md` is gitignored in all three repos rather than merely
forbidden in prose.

Two hatches, kept separate so running an install script does not also unlock
data deletion: `AGENT_ALLOW_APPLY=1` for the documented `install-*.sh`
exception, and `AGENT_ALLOW_DESTROY=1` for PVC/PV/namespace deletion.

Neither layer is a security boundary — `sudo kubectl` and a direct binary path
both step around the shell guard. They stop a confident agent, not an attacker.

### Which agent to use — guidance, not law

Ignore this per task when it does not fit; it is a cost and capability note, not
a ruling. Cursor for architecture, decisions and cross-repo work, with Gordon in
the loop. Claude Code for bulk implementation, since it is subscription-billed
and a long run costs the same as a short one. Grok CLI for short edits and
headless scripted checks, since it is metered per token. Goose for on-node work
over SSH and cheap loops, being the only one with passwordless SSH to all six
nodes and a free `llm-lan` profile.

`AGENTS.md` and `DECISIONS.md` still change only in a session Gordon is
watching. Law should not drift as a side effect of an implementation loop.

---

## 2026-09-19 — D-0006 — Claude Code and Grok CLI are sanctioned bastion agents

**Status:** active

Both run on the bastion as `agent` and both read repo `AGENTS.md`, so D-0005
holds across all four agents. Two non-obvious conditions make that true:

- **Claude Code** reads `AGENTS.md` only when a repo has no `CLAUDE.md`. None
  has one. **Never add a `CLAUDE.md`** — it silently outranks `AGENTS.md`.
- **Grok CLI** loads instructions only in a *trusted* folder; all three are
  granted. Untrusted, it loads nothing and answers from pretraining without
  saying so — it claimed GitHub was Flux's origin. Check `grok inspect`, never
  the model's own account of its context.

Grok is pinned to `grok-4.6` in `~/.grok/config.toml`; the shipped default was
non-reasoning and failed the same question. Metered on `XAI_API_KEY`, the key
Goose's `xai` profile also uses (D-0001).

---

## 2026-09-19 — D-0005 — One rules file per repo: `AGENTS.md`, tracked in git

**Status:** active

Three repos had three conventions: `jarvis-infra` carried both `AGENTS.md` and
`.cursor/rules/jarvis.mdc` (which restated it), `cluster` had only `AGENTS.md`,
and `jarvis-core` had only an untracked `.cursor/rules/rules.mdc`.

Decided: **`AGENTS.md` at the repo root is the only rules file, and it is always
tracked in git.** The `.mdc` files are deleted.

Two reasons, the second being the practical one:

- A `.mdc` that restates `AGENTS.md` is a second bible in miniature, and both
  were being injected into the same session — the exact duplication D-0004 exists
  to stop.
- `.mdc` is Cursor-only. **Goose reads `AGENTS.md`** (it ships in
  `CONTEXT_FILE_NAMES` by default) and cannot see `.mdc` at all. With Goose
  holding a shell and passwordless SSH to every node, repo rules it cannot read
  are worse than useless. One file that every agent reads beats one file per tool.

Untracked rules are also per-clone rules: an agent on another machine silently
gets no guidance. If it governs behaviour, it is versioned.

---

## 2026-09-19 — D-0004 — Governance docs restructured around law / spec / state / history

**Status:** active

The doc set had grown to roughly 2,500 lines that mixed permanent constraints
("never retag", "Gitea is Flux origin") with expiring status ("frozen glass is
lifted", "this slice", version pins, dated handover notes). An agent could not
tell which lines were binding.

Docs are now separated by lifetime:

| Kind | Lives in | Changes |
| --- | --- | --- |
| Law — constraints that outlive any design | `AGENTS.md` | rarely, by decision |
| Decisions — dated, ranked above prose | `docs/DECISIONS.md` | append-only |
| Spec — what we intend to build | `docs/VISION.md` | per re-architecture |
| State — what is true right now | the live cluster, via discover scripts | constantly |
| History — footguns already paid for | `docs/LESSONS.md` | append-only |
| Tickets | `docs/BACKLOG.md` | constantly |

No doc asserts live state. State comes from `kubectl` and the discover scripts.

Supersedes: the practice of `PLAN.md` and `COPILOT.md` each acting as a
self-declared source of truth.

---

## 2026-09-19 — D-0003 — jarvis-core is prior art, not the go-forward build

**Status:** active

`jarvis-core` was the second attempt at the JARVIS brain (`policy.yaml`, the
HUD/LAYOUT specs, the noc slice). Its *thinking* is worth keeping — the verb
model with trusted/confirm/refuse classes, and the split between a calm product
surface and a dense NOC. Its *implementation* is not the foundation we build on.

Gordon's call: plan a clean third attempt rather than force the existing code
forward. `jarvis-core` is therefore read-only reference material. Do not extend
it, and do not treat `jarvis-core/policy.yaml` or `docs/HUD.md` as binding
contracts on the next build — they are inputs to the design, at the same rank
as any other proposal.

What survives untouched: the metal, k3s, Flux, Gitea, and the inference stack.
The rebuild is the brain and the glass, not the rack.

Supersedes: D-0002's implication that jarvis-core was the vehicle for the new
product surface.

---

## 2026-09-19 — D-0002 — jarvis.lan is the product surface; chat.lan is break-glass

**Status:** active

Two docs asserted opposite products. `docs/PLAN.md` said "chat.lan is the
glass"; `jarvis-core/docs/HUD.md` said jarvis.lan is the product and chat.lan
is break-glass. Both were read as authoritative by different sessions.

Decided: **jarvis.lan is the product surface.** Open WebUI at chat.lan is
break-glass, kept ugly and unthemed. `home.lan` retires into `noc.lan`, which
is the operator/NOC surface and must render even when the brain is down.

This matches what is already live: `jarvis.lan` and `noc.lan` both serve today.

Supersedes: "chat.lan is the glass" everywhere it appears.

---

## 2026-09-19 — D-0001 — Goose runs on switchable backend profiles

**Status:** active

Goose on the bastion was hardwired to LiteLLM at `llm.lan` by a single config
plus a `GOOSE_MODEL` export in `~/.bashrc`, and re-running the installer
clobbered whatever was active.

Decided: two profiles, `llm-lan` (free, on-LAN) and `xai` (metered, direct to
api.x.ai on `grok-build-0.1`), switched with `goose-backend`. Both pin their
model in-profile; no `GOOSE_MODEL` env export, because an env var outranks the
profile and silently defeats the switch.

Goose must never run on `jarvis-local` — the 7B invents shell output.
