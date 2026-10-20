# Vladimir's brain — Qwen2.5-1.5B-Instruct on llama.cpp, for Google Cloud Run.
FROM python:3.11-slim

# build-essential + cmake in case llama-cpp-python has to compile; wget to fetch the model.
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential cmake wget ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the open-source model into the image so cold starts don't download ~1GB at runtime.
# Qwen2.5-1.5B-Instruct, Q4_K_M quant (~1.1GB).
RUN mkdir -p /models && \
    wget -q "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true" \
      -O /models/model.gguf && \
    test -s /models/model.gguf

COPY main.py .

ENV MODEL_PATH=/models/model.gguf
ENV PORT=8080
# Cloud Run sets $PORT; honor it.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
