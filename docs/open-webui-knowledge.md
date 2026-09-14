# Open WebUI — attach Knowledge (v0.11.3)

Chat models live in the **chat picker**, not Workspace → Models.

Create: Workspace → Knowledge → Create (`lab-docs`) → open it → **+** → upload.

Attach in a chat:

1. New Chat, pick **jarvis-local**
2. **+** left of the input → **Attach Knowledge** → `lab-docs`
3. Chip on the message means retrieval is on
4. Ask; look for “Retrieved N source”

Same thing: type `#` and pick the collection.

Embeddings: gpu-02 `nomic-embed-text` via `RAG_OLLAMA_BASE_URL=http://ollama-embed.inference.svc.cluster.local:11434`.
Generation: gpu-01 `jarvis`.
