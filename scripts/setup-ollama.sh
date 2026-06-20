#!/usr/bin/env bash
# Pull free Ollama models for WA Drive Vietnamese Academy
set -euo pipefail

echo "🧬 Setting up free Ollama models..."
echo ""

if ! command -v ollama &>/dev/null; then
  echo "Ollama not installed. Install from: https://ollama.com/download"
  echo "  macOS: brew install ollama"
  exit 1
fi

# Start Ollama if not running
if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "Starting Ollama..."
  ollama serve &
  sleep 3
fi

echo "Pulling qwen2.5:7b (best free Vietnamese LLM)..."
ollama pull qwen2.5:7b

echo "Pulling nomic-embed-text (free embeddings)..."
ollama pull nomic-embed-text

echo ""
echo "✅ Ready! Models installed:"
ollama list
echo ""
echo "Start the app: pnpm dev"
