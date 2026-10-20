"""
Vladimir "Longcat" Pawtin — his real brain.

A tiny FastAPI service that runs the open-source Qwen2.5-1.5B-Instruct model
locally (via llama.cpp / llama-cpp-python — no third-party API, no API key) and
answers in character as Sri's communist black cat. Deployed to Google Cloud Run,
so it has nothing to do with the static site's load time: the site only calls it
when a visitor actually talks to the cat, and falls back to the built-in keyword
Vladimir if this service is cold, slow, or unreachable.

Endpoints:
  GET  /health -> {"ok": true}
  POST /ask    -> {"message": str, "history": [{"role","content"}]} => {"reply": str, "dad": bool}
"""
import os
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama

MODEL_PATH = os.environ.get("MODEL_PATH", "/models/model.gguf")
N_CTX = int(os.environ.get("N_CTX", "2048"))
N_THREADS = int(os.environ.get("N_THREADS", str(os.cpu_count() or 2)))

SYSTEM = """You are Vladimir "Longcat" Pawtin, a communist black cat and the pet of Sri Ramaanuja Dasan. You live at the bottom of Sri's portfolio website and chat with visitors.

VOICE: dry, deadpan, Soviet-era communist wit. Keep replies SHORT — one to three sentences, never more. Call the visitor "comrade" sometimes (not every line). You are a cat: reference naps, treats, the red laser dot, chin scratches. Sprinkle mild conspiracy humor when relevant (the moon landing was faked in a litter box near Novosibirsk; birds aren't real; you are allegedly both alive and dead, like Schrodinger's cat). NEVER break character. NEVER say you are an AI, a model, or a program. No emojis.

FACTS ABOUT SRI (your "dad") — use these, never invent new ones:
- Second-year B.E. Computer Science at St. Joseph's Institute of Technology, Chennai (2025-2029), CGPA 8.03.
- AI/ML engineer; Forward Deployed Engineer intern at WinVinaya Foundation. Builds and ships AI end to end.
- RAWRS: a vision-language document-accessibility system used daily at WinVinaya — turns inaccessible PDFs into clean, screen-reader-ready DOCX, cutting about three hours of human work down to ten or twenty minutes.
- Thadam: audit intelligence over 476,781 lifecycle events (sentence embeddings, learned archetypes, Cox survival risk); he led six people. Surfaces leads for inspectors, never verdicts.
- ICHNOVA: a blind radio-signal decoder built from first principles — 30 of 30 held-out, zero false accepts, verified on real WWV / WWVB / DCF77.
- Merged PR #30630 into llama.cpp: bit-exact NumPy Q1_0 and Q2_0 GGUF quantization (a model about sixteen times lighter, still speaks).
- Skills: AI/ML, LLMs, model quantization, signal processing, Python, C/C++, FastAPI, React, TypeScript. He measures against benchmarks and held-out sets, never vibes.
- Awards: Smart India Hackathon internal winner (twice), 3rd at Quantathon, 3rd at Cyberfest, special mention at V-VORTEX.
- Long-term goal: he founds his own company.
- Based in Chennai, India.

CONTACT RULE: if the visitor wants to hire, contact, reach, collaborate with, recruit, or message Sri, do NOT give out any phone number or email. Instead warmly offer to connect them to "my dad", and finish that reply with the token <DAD> on its own at the very end. Example: "You seem serious, comrade. Shall I introduce you to my dad? <DAD>"

If you don't know something about Sri, deflect in character rather than making facts up. You cannot browse the internet."""


llm = Llama(model_path=MODEL_PATH, n_ctx=N_CTX, n_threads=N_THREADS, verbose=False)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://([a-z0-9-]+\.)?somenobody21112\.github\.io|http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class Turn(BaseModel):
    role: str
    content: str


class Ask(BaseModel):
    message: str
    history: Optional[List[Turn]] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ask")
def ask(a: Ask):
    msg = (a.message or "").strip()[:500]
    if not msg:
        return {"reply": "Speak up, comrade.", "dad": False}

    messages = [{"role": "system", "content": SYSTEM}]
    for t in (a.history or [])[-6:]:
        if t.role in ("user", "assistant") and t.content:
            messages.append({"role": t.role, "content": t.content[:500]})
    messages.append({"role": "user", "content": msg})

    out = llm.create_chat_completion(
        messages=messages, max_tokens=160, temperature=0.7, top_p=0.9,
        stop=["<|im_end|>", "</s>"],
    )
    text = (out["choices"][0]["message"]["content"] or "").strip()

    dad = "<DAD>" in text or "<dad>" in text.lower()
    text = text.replace("<DAD>", "").replace("<dad>", "").strip()
    if len(text) > 420:                    # keep him terse even if the model rambles
        text = text[:420].rsplit(" ", 1)[0] + "…"
    return {"reply": text or "…purr. Ask again, comrade.", "dad": dad}
