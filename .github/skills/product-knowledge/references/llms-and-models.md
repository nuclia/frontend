# LLMs, Embedding Models & API Reference

_Source: `../docs/docs/rag/llms.md`, `rag/advanced/models.md`, `develop/openai_compat.md`_

---

## Generative LLMs Available

### OpenAI

- GPT-4, GPT-4o, GPT-4o Mini, o1, o3, o3 Mini, o4 Mini
- GPT-4.1, GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat, GPT-5.5
- OpenAI API Compatible Model (BYOM)

### OpenAI via Azure

- GPT-4o, GPT-4o Mini, o1, o3, o3 Mini, o4 Mini, GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat, GPT-5.5
- Azure GPT OSS 120B

### Anthropic (direct)

- Claude 4 Sonnet, Claude 4 Opus, Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.6 Sonnet, Claude 4.6 Opus, Claude 4.7 Opus

### Anthropic via GCP (Vertex AI)

- Claude 3.5 Sonnet v2, Claude 3.7 Sonnet, Claude 4.5 Sonnet, Claude 4.6 Opus, Claude 4.7 Opus

### Anthropic via AWS Bedrock

- Claude 3.7 Sonnet, Claude 4 Sonnet, Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.6 Sonnet, Claude 4 Opus, Claude 4.1 Opus, Claude 4.6 Opus

### Gemini via GCP

- Gemini Flash 2.0 Lite, Flash 2.0, Flash 2.5 Lite, Flash 2.5, Pro 2.5, Gemini 3.1 Flash Lite

### GLM via GCP

- GLM-5 (Global)

### Hugging Face

- Custom HF endpoint model

### Llama

- Llama 4 Maverick (BETA), Llama 4 Scout (BETA), Vertex Llama 3.2 90B (BETA)

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

| Model                     | Dimensions   | Max tokens   | Multilingual                      | External         |
| ------------------------- | ------------ | ------------ | --------------------------------- | ---------------- |
| `en-2024-04-24`           | 768          | 2048         | No                                | No               |
| `multilingual-2024-05-06` | 1024         | 2048         | Yes (high + low resource)         | No               |
| `multilingual-2023-08-16` | 1024         | 512          | Yes (best for low-resource/Asian) | No               |
| `Open AI small`           | 1536         | 8192         | No                                | No               |
| `Open AI large`           | 3072         | 8192         | No                                | Yes (extra cost) |
| `Google Gecko`            | 768          | 3072         | Yes                               | Yes (extra cost) |
| `Hugging Face`            | Configurable | Configurable | Depends                           | Yes              |

**Matryoshka support:** OpenAI small/large and Google Gecko support Matryoshka dimensions (allows reducing vector size post-training).

**Similarity functions:**

- **Cosine:** Range -1 to 1 (typically 0–1). Models: `en-2024-04-24`, OpenAI, Gecko.
- **Dot product:** Any real number. Models: multilingual variants.

### Choosing an embedding model

- English only → `en-2024-04-24`
- Multilingual (common languages) → `multilingual-2024-05-06`
- Low-resource or Asian languages → `multilingual-2023-08-16`
- Higher quality, OK with external cost → OpenAI large or Google Gecko

### Vectorsets

- A KB can have **multiple vectorsets** (multiple embedding models).
- Enables migration between models or A/B testing.
- The `/ask` endpoint handles multi-vectorset queries automatically.

---

## OpenAI-Compatible API

Nuclia exposes an OpenAI-compatible endpoint, allowing drop-in replacement for OpenAI/OpenRouter tooling.

**Base URL:** `https://[zone-id].rag.progress.cloud/api/v1/predict/compat`
**Auth:** `Authorization: Bearer <NUA KEY>`

**Supported endpoints:**

- `POST .../chat/completions`
- `GET .../models`
- `POST .../embeddings`

### Available model identifiers (for `model` field)

```
claude-4-opus, claude-4-sonnet, claude-4-5-sonnet, claude-4-5-haiku
gcp-claude-3-7-sonnet, gcp-claude-4-5-sonnet, gcp-claude-4-5-haiku
aws-claude-3-7-sonnet, aws-claude-4-sonnet, aws-claude-4-opus, aws-claude-4-5-sonnet, aws-claude-4-5-haiku
gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
gemini-3.1-pro
chatgpt4, chatgpt4o, chatgpt4o-mini, chatgpt-o1, chatgpt-o3, chatgpt-o3-mini, chatgpt-o4-mini
chatgpt-4.1, chatgpt-5, chatgpt-5-mini, chatgpt-5-nano, chatgpt-5-chat
chatgpt-azure-4o, chatgpt-azure-4o-mini, chatgpt-azure-o3-mini, chatgpt-azure-5 variants
azure-deepseek-r1, azure-gpt-oss-120b
```

---

## Prompt Lab

Dashboard location: KB → Advanced → **Prompt Lab**

Use it to:

- Test different system/user/rephrase prompts
- Compare results across all supported LLMs
- Experiment before locking a configuration
