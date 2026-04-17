# GMDSS VHF Radio Simulator

Open-source Progressive Web App for maritime radio training (ROC preparation).

## Prerequisites

- [Vite+](https://viteplus.dev) — `curl -fsSL https://vite.plus | bash`
- [Semgrep](https://semgrep.dev) — `brew install semgrep` or `pip install semgrep`
- [vet](https://github.com/safedep/vet) — `brew install safedep/tap/vet`

## Quick Start (QA)

One command to get the full app running locally:

```bash
vp run qa
```

This starts Docker (PostgreSQL + Redis), runs migrations, seeds content, creates a test user, and launches both API and frontend servers. See [docs/qa-setup.md](docs/qa-setup.md) for details.

## Development

```bash
# Install dependencies
vp install

# Quality check (lint + format + type-check)
vp check

# Run tests
vp run -r test

# E2E tests
./node_modules/.bin/playwright test

# Development server
vp run frontend#dev

# Build
vp run -r build
```

## AI Simulator Mode

The radio simulator supports an AI-powered voice loop where a student speaks into the radio and receives protocol-correct responses from AI station personas. This requires an OpenAI-compatible API (OpenAI, OpenRouter, or any proxy).

### Configuration

Copy `.env.example` to `.env` and set the AI variables:

```bash
# Switch from scripted to AI-powered responses
AI_PROVIDER=openai

# API endpoint — use OpenAI directly or any compatible proxy
AI_BASE_URL=https://openrouter.ai/api/v1   # OpenRouter
# AI_BASE_URL=https://api.openai.com/v1    # OpenAI direct (default if omitted)

# Your API key
AI_API_KEY=sk-or-v1-...

# Model overrides (defaults shown)
AI_STT_MODEL=whisper-1            # Speech-to-text model
AI_LLM_MODEL=gpt-4o-mini          # Chat model for station responses
AI_TTS_MODEL=tts-1                 # Text-to-speech model
```

### Provider Options

| Provider    | `AI_BASE_URL`                  | Notes                                         |
| ----------- | ------------------------------ | --------------------------------------------- |
| OpenAI      | _(omit — default)_             | Direct access to all models                   |
| OpenRouter  | `https://openrouter.ai/api/v1` | Route to any model (Claude, GPT, Llama, etc.) |
| Local proxy | `http://localhost:8080/v1`     | Any OpenAI-compatible server                  |

For OpenRouter, set `AI_LLM_MODEL` to the provider-prefixed model name (e.g. `anthropic/claude-sonnet-4-20250514`, `openai/gpt-4o-mini`).

### How It Works

With `AI_PROVIDER=mock` (default), the simulator uses pre-scripted station responses — no API calls, works offline.

With `AI_PROVIDER=openai`, the simulator runs a half-duplex voice loop:

1. Student presses PTT and speaks (or types a transmission)
2. Audio is sent to the server via WebSocket
3. Server runs: STT → deterministic rubric scoring → LLM persona response → TTS
4. Response audio plays through the radio's DSP effects chain

Scoring is always deterministic (rubric engine, not LLM). The AI only generates natural-language station responses.

### Toggling AI Mode

In the simulator UI, an "AI Mode" checkbox appears on the scenario selection screen. Students can toggle between AI-powered and scripted responses per session. If the AI connection fails mid-scenario, the simulator falls back to scripted responses automatically.

## License

AGPLv3 (code) / CC BY-SA 4.0 (content)
