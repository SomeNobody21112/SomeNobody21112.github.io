# Vladimir's brain (Cloud Run)

An open-source LLM (**Qwen2.5-1.5B-Instruct**, running on llama.cpp — no third-party
API, no API key) that answers in character as Vladimir, Sri's communist black cat.
It runs on **Google Cloud Run**, completely separate from the static portfolio, so
it never affects page load. The site calls it only when a visitor talks to the cat,
and falls back to the built-in keyword Vladimir whenever this service is cold, slow,
or unreachable — so the site is never broken by the brain being down.

## Deploy (one command)

You need the [gcloud CLI](https://cloud.google.com/sdk/docs/install) and a GCP project
with billing enabled. From this `server/` folder:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

gcloud run deploy vladimir-brain \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 4Gi --cpu 4 \
  --min-instances 0 --max-instances 2 \
  --timeout 120 --concurrency 4
```

> In Claude Code you can run these by typing `! gcloud ...` so the output lands in the chat.

Cloud Build bakes the ~1.1 GB model into the image (first build ~5–10 min). When it
finishes it prints a **Service URL** like `https://vladimir-brain-xxxxx-el.a.run.app`.

## Wire it to the site

Open `js/cat.js`, find the line near the top:

```js
var BRAIN_URL = ""; // paste your Cloud Run URL here
```

Paste your Service URL (no trailing slash), commit, push. Done — Vladimir now thinks.
Leaving it `""` keeps the instant keyword Vladimir and changes nothing.

## Notes / tuning

- **`--min-instances 0`** (default here) = free when idle, but a cold request loads
  the model first (~10–25 s). Set **`--min-instances 1`** for instant replies (costs
  a few $/month to keep one instance warm).
- CPU inference of a 1.5B model is a few seconds/reply on `--cpu 4`. The site waits up
  to 28 s, then falls back to keyword Vladimir.
- CORS is locked to `somenobody21112.github.io` and localhost (see `main.py`). If you
  move domains, update `allow_origin_regex` there.
- Want it faster? Cloud Run GPU: add `--gpu 1 --gpu-type nvidia-l4 --no-cpu-throttling`
  (needs the GPU allowlist; costs more).

## Test locally (optional)

```bash
pip install -r requirements.txt
# put a qwen2.5-1.5b-instruct-q4_k_m.gguf somewhere, then:
MODEL_PATH=/path/to/model.gguf uvicorn main:app --port 8080
curl -s localhost:8080/ask -H 'content-type: application/json' \
  -d '{"message":"who is sri?"}'
```

Model: [Qwen2.5-1.5B-Instruct-GGUF](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF) (Apache-2.0).
