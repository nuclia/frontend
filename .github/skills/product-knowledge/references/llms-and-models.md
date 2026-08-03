# LLMs, Embedding Models & API Reference

_Source: `../docs/docs/rag/llms.md`, `rag/advanced/models.md`, `develop/openai_compat.md`_

---

## Generative LLMs Available

> **Note:** `docs/rag/llms.md` was restructured (per-provider model lists are now templated from live API data at publish time rather than hardcoded in the docs source), so the exact per-provider lists below should be treated as a snapshot — cross-check against `GET .../predict/compat/models` for the authoritative live list. New models confirmed via the docs changelog have been added below.

### OpenAI

- GPT-4, GPT-4o, GPT-4o Mini, o1, o3, o3 Mini, o4 Mini
- GPT-4.1, GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat, GPT-5.5
- **GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna** (`chatgpt-5.6-sol`, `chatgpt-5.6-terra`, `chatgpt-5.6-luna`)
- OpenAI API Compatible Model (BYOM)

### OpenAI via Azure

- GPT-4o, GPT-4o Mini, o1, o3, o3 Mini, o4 Mini, GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat, GPT-5.5
- **GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna** (`chatgpt-azure-5.6-sol`, `chatgpt-azure-5.6-terra`, `chatgpt-azure-5.6-luna`)
- Azure GPT OSS 120B

### Anthropic (direct)

- Claude 4 Sonnet, Claude 4 Opus, Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.6 Sonnet, Claude 4.6 Opus, Claude 4.7 Opus
- **Claude Opus 4.8, Claude Sonnet 5, Claude Fable 5** (added 2026-07-14; exact compat model IDs not yet published in docs — confirm via `/models`)

### Anthropic via GCP (Vertex AI)

- Claude 3.5 Sonnet v2, Claude 3.7 Sonnet, Claude 4.5 Sonnet, Claude 4.6 Opus, Claude 4.7 Opus

### Anthropic via AWS Bedrock

- Claude 3.7 Sonnet, Claude 4 Sonnet, Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.6 Sonnet, Claude 4 Opus, Claude 4.1 Opus, Claude 4.6 Opus

### Gemini via GCP

- Gemini Flash 2.0 Lite, Flash 2.0, Flash 2.5 Lite, Flash 2.5, Pro 2.5, Gemini 3.1 Flash Lite
- **Gemini 3.5 Flash** (`gemini-3.5-flash`, added 2026-06-26)

### GLM via GCP

- GLM-5 (Global) — _could not verify still listed: docs page grouping changed to per-cloud-provider tags; confirm via `/models`_

### Hugging Face

- Custom HF endpoint model — _could not verify still listed as its own docs section; confirm via `/models`_

### Llama

- Llama 4 Maverick (BETA), Llama 4 Scout (BETA), Vertex Llama 3.2 90B (BETA) — docs now group these under a "Vertex AI - GCP" heading rather than "Llama"

### Mistral via Azure

- Mistral Large 2

### Deepseek via Azure

- Deepseek R1

---

## Bring Your Own LLM (BYOL)

For using your own API keys with cloud providers:

| Provider                  | Documentation path                                   |
| ------------------------- | ---------------------------------------------------- |
| Azure OpenAI              | `rag/advanced/connect-your-own-azure-openai-acct.md` |
| AWS Bedrock (assume role) | `rag/advanced/byok-aws-berock-assume-role.md`        |
| Vertex AI                 | `rag/advanced/connect-vertex-ai-acct.md`             |
| Gemini                    | `rag/advanced/connect-gemini-keys.md`                |
| Anthropic                 | `rag/advanced/bring-your-own-anthropic-acct.md`      |

---

## Embedding / Semantic Models

| Model                       | Dimensions | Similarity | Max tokens | Matryoshka | Multilingual | External |
| --------------------------- | ---------- | ---------- | ---------- | ---------- | ------------ | -------- |
| `en-2024-04-24`             | 768        | DOT        | 2048       | No         | No           | No       |
| `multilingual-2023-08-16`   | 1024       | DOT        | 512        | No         | Yes          | No       |
| `multilingual-2024-05-06`   | 1024       | DOT        | 2048       | No         | Yes          | No       |
| `multilingual-2024-10-07`   | 1024       | DOT        | 2048       | No         | Yes          | No       |
| `Open AI 3 small`           | 1536       | COSINE     | 8192       | Yes        | Yes          | Yes      |
| `Open AI 3 large`           | 3072       | COSINE     | 8192       | Yes        | Yes          | Yes      |
| `Google multilingual Gecko` | 768        | COSINE     | 3072       | Yes        | Yes          | Yes      |
| `Google Gemini 2`           | 3072       | COSINE     | 8192       | Yes        | Yes          | Yes      |
| `Hugging Face`              | N/A        | N/A        | N/A        | N/A        | N/A          | Yes      |

Default min-score thresholds: `en-2024-04-24` 0.47, `multilingual-2023-08-16` 0.7, `multilingual-2024-05-06`/`multilingual-2024-10-07` 0.4, `Open AI 3 small/large` 0.5, `Google multilingual Gecko`/`Google Gemini 2` 0.55.

**Matryoshka support:** OpenAI 3 small/large, Google Gecko, and Google Gemini 2 support Matryoshka dimensions (allows reducing vector size post-training).

**Similarity functions:**

- **DOT (dot product):** Any real number. Models: `en-2024-04-24`, all `multilingual-*` variants.
- **COSINE:** Range -1 to 1 (typically 0–1). Models: OpenAI 3 small/large, Google Gecko, Google Gemini 2.
- Renamed since last sync: `Open AI small`/`Open AI large` are now `Open AI 3 small`/`Open AI 3 large`, and both are now marked `Multilingual: Yes` / `External: Yes` (previously documented as `No`/mixed — corrected against the current docs source).

### Choosing an embedding model

- English only → `en-2024-04-24`
- Multilingual (common languages) → `multilingual-2024-05-06` or the newer `multilingual-2024-10-07`
- Low-resource or Asian languages → `multilingual-2023-08-16`
- Higher quality, OK with external cost → OpenAI 3 large, Google Gecko, or Google Gemini 2

### Vectorsets

- A KB can have **multiple vectorsets** (multiple embedding models).
- Enables migration between models or A/B testing.
- The `/ask` endpoint handles multi-vectorset queries automatically.

---

## OpenAI-Compatible API

Nuclia exposes an OpenAI-compatible endpoint, allowing drop-in replacement for OpenAI/OpenRouter tooling.

**Base URL:** `https://[zone-id].dp.progress.cloud/api/v1/predict/compat`
**Auth:** `Authorization: Bearer <NUA KEY>`

**Supported endpoints:**

- `POST .../chat/completions`
- `GET .../models`
- `POST .../embeddings`

**GitHub Copilot CLI:** Supported as a BYOK provider — set `COPILOT_PROVIDER_BASE_URL` to the base URL above, `COPILOT_PROVIDER_BEARER_TOKEN` to your NUA key, and `COPILOT_MODEL` to a model ID enabled for that key (must support streaming + tool calling). List available models with `GET .../models`.

### Available model identifiers (for `model` field)

> **Note:** As of the latest docs sync, the docs no longer publish a static ID list — call `GET .../models` for the authoritative live list per NUA key/region. The list below is the last known-accurate static snapshot, plus new IDs confirmed via the changelog; treat as a starting point, not a guarantee.

```
claude-4-opus, claude-4-sonnet, claude-4-5-sonnet, claude-4-5-haiku, claude-4-7-opus
gcp-claude-3-7-sonnet, gcp-claude-4-5-sonnet, gcp-claude-4-5-haiku, gcp-claude-4-7-opus
aws-claude-3-7-sonnet, aws-claude-4-sonnet, aws-claude-4-opus, aws-claude-4-1-opus, aws-claude-4-5-sonnet, aws-claude-4-5-haiku
gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-flash-image
gemini-3.1-pro, gemini-3.1-flash-lite, gemini-3-pro-image, gemini-3.5-flash
chatgpt4, chatgpt4o, chatgpt4o-mini, chatgpt-o1, chatgpt-o3, chatgpt-o3-mini, chatgpt-o4-mini
chatgpt-4.1, chatgpt-5, chatgpt-5-mini, chatgpt-5-nano, chatgpt-5-chat, chatgpt-5.5
chatgpt-5.6-sol, chatgpt-5.6-terra, chatgpt-5.6-luna
chatgpt-azure-4o, chatgpt-azure-4o-mini, chatgpt-azure-o1, chatgpt-azure-o3-mini, chatgpt-azure-o3, chatgpt-azure-o4-mini
chatgpt-azure-5, chatgpt-azure-5-mini, chatgpt-azure-5-nano, chatgpt-azure-5-chat, chatgpt-azure-5.5
chatgpt-azure-5.6-sol, chatgpt-azure-5.6-terra, chatgpt-azure-5.6-luna
azure-deepseek-r1, azure-gpt-oss-120b, gcp-glm-5
```

---

## Prompt Lab

Dashboard location: KB → Advanced → **Prompt Lab**

Use it to:

- Test different system/user/rephrase prompts
- Compare results across all supported LLMs
- Experiment before locking a configuration
