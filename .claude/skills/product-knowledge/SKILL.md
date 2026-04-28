---
name: product-knowledge
description: >
  Domain knowledge about the Nuclia / Progress Agentic RAG platform. Use this skill when
  discussing product features, platform capabilities, API behaviour, UX decisions, or how
  the platform works end-to-end. Also use when planning a new feature to validate it against
  the platform's existing capabilities and constraints before building.
---

# Product Knowledge Skill

## Purpose

Provides domain knowledge about the Nuclia / Progress Agentic RAG platform so that AI agents can make informed UI/UX decisions when building or modifying frontend pages.

**Reference files** (read for deeper knowledge):

- `references/ingestion.md` — ingestion pipeline, data types, extract/split strategies, data augmentation agents
- `references/search-and-rag.md` — /find, /ask, search features, RAG strategies, filters, REMi, prompts
- `references/agentic-rag.md` — Retrieval Agents, drivers, workflows
- `references/management.md` — KB management, security, roles, activity logs, regions
- `references/llms-and-models.md` — all supported LLMs, embedding models, OpenAI-compat API
- `references/api-specs/README.md` — the 4 API scopes, their endpoint groups, and how to check for updates
- `references/api-specs/{global,nua,nucliadb,zone}.yaml` — full OpenAPI specifications

---

## Platform Overview

**Nuclia Agentic RAG** (branded as "Progress Agentic RAG") is a RAG-as-a-Service platform. It allows users to:

1. **Ingest** data (documents, files, URLs, conversations) into **Knowledge Boxes** (KBs).
2. **Search** that data via semantic, keyword, fulltext, and graph search modes.
3. **Generate** answers using LLMs grounded in retrieved context (the RAG pipeline).
4. **Evaluate** answer quality automatically using the **REMi** model.
5. **Build agents** (Retrieval Agents) that orchestrate multi-source retrieval with workflows and drivers.

**Platform URL:** `https://rag.progress.cloud`  
**API base URL:** `https://[zone-id].rag.progress.cloud/api/v1/`  
**CDN / widgets:** `https://cdn.rag.progress.cloud/`

---

## Core Concepts

### Knowledge Box (KB)

A container for resources. Each KB has its own settings, users, roles, and activity logs. KBs are isolated. Can be **public** (anonymous search allowed) or **private** (all ops require auth). Regions: Europe or USA (chosen at creation, immutable).

### Resources

Individual items in a KB — documents, links, conversations, files. Each resource has fields (title, body, files, links, conversations) and extracted metadata (entities, summaries, paragraphs, embeddings). Resources are identified by auto-generated ID or user-defined `slug`.

### Ingestion Pipeline

Data enters via API, SDK, CLI, Dashboard upload, or **Sync Agent**. During ingestion:

- Text extracted from files (PDF, DOCX, images via OCR, audio/video via speech-to-text).
- NER extracts entities (people, places, orgs).
- Paragraphs split and embedded for semantic search.
- Optional post-processing via **data augmentation agents**: labeler, generator, Q&A generator, graph extractor.
- **Extract strategies**: custom extraction (visual LLM, AI tables for complex docs).
- **Split strategies**: custom chunking (manual delimiter or LLM-based).

### Search Endpoints

- `/find` — single merged hierarchical result set (preferred for UI).
- `/search` — multiple separate result sets (fulltext, fuzzy, semantic).
- `/ask` — streaming NDJSON: merged results + generative answer.
- `/graph*` — entity knowledge graph traversal.

**Search modes (features param):** `semantic`, `keyword`, `fulltext`, `relations`

### RAG / Ask (`/ask` endpoint)

Calls `/find` internally → collects top-k paragraphs → sends to LLM. Streams NDJSON with item types: `retrieval`, `answer`, `metadata`, `citations`, `status`, `error`, `relations`.

**Key params:**

- `top_k`: paragraphs in context (default 20)
- `rag_strategies`: `hierarchy`, `neighbouring_paragraphs`, `prequeries`, `graph_beta`, `full_resource`, `page_image`
- `prompt`: `{system, user, rephrase}` — rephrase applied **before** search; system+user applied **after**
- `citations`: `"llm_footnotes"` (BETA) or `"default"`
- `search_configuration`: use a stored named config instead of individual params
- `filter_expression`: structured filter (AND/OR/NOT over field/paragraph attributes)

### Retrieval Agents (Agentic RAG)

Advanced multi-source orchestration:

- **Drivers**: NucliaDB KBs, Google/Gemini, Perplexity (internet search), MCP servers.
- **Workflow steps**: Preprocess (Rephrase) → Retrieval (Ask/Perplexity/Google/MCP) → Generation (Summarize) → Postprocess (Validation via REMi, External Call).
- Configured at account level (not per-KB).

---

## REMi (RAG Evaluation Metrics)

Open-source fine-tuned LLM that automatically evaluates RAG quality. Runs automatically on the platform.

| Metric                | What it measures                           | Score range |
| --------------------- | ------------------------------------------ | ----------- |
| **Answer Relevance**  | How well the answer addresses the question | 0–5         |
| **Context Relevance** | How pertinent retrieved context is         | 0–5         |
| **Groundedness**      | How well answer is grounded in context     | 0–5         |

### REMi Status Values

- `SUCCESS`: Evaluation completed.
- `ERROR`: Evaluation failed.
- `NO_CONTEXT`: No context retrieved — cannot evaluate.

### Diagnostic Patterns

| Symptom                                         | Diagnosis                              | Fix                               |
| ----------------------------------------------- | -------------------------------------- | --------------------------------- |
| High context rel, low answer rel + groundedness | LLM generating evasive answers         | Try different LLM                 |
| High answer rel, low context rel + groundedness | LLM hallucinating (KB missing content) | Add content; adjust search        |
| High groundedness, low answer + context rel     | LLM generating unrelated answers       | Improve search config / min_score |
| Many NO_CONTEXT                                 | KB empty or filters too restrictive    | Add content or relax filters      |

---

## Activity Logs & Monitoring

Every `/ask` and `/find` call is logged. `ActivityLogItem` field groups:

| Group                | Key fields                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Query Details**    | `question`, `answer`, `user_request`, `filter`, `client_type`, `user_id`, `id`, `date`                                                      |
| **Retrieval**        | `retrieval_time`, `resources_count`, `vectorset`, `min_score_bm25`, `min_score_semantic`, `retrieval_rephrased_question`, `result_per_page` |
| **Generative / LLM** | `model`, `generative_answer_time`, `generative_answer_first_chunk_time`, `generative_reasoning_first_chunk_time`, `reasoning`               |
| **REMi Score**       | `remi_scores` (answer_relevance, context_relevance, groundedness), `status`                                                                 |
| **Feedback**         | `feedback_good`, `feedback_comment`, `feedback_good_all`, `feedback_good_any`                                                               |
| **RAG Strategies**   | `rag_strategies_names`, `rag_strategies`                                                                                                    |
| **Tokens & Cost**    | `nuclia_tokens`                                                                                                                             |
| **Performance**      | `total_duration`                                                                                                                            |
| **Processing**       | `resource_id`, `audit_metadata`                                                                                                             |
| **Security**         | `security_groups`                                                                                                                           |

### Dashboard Activity Pages

| Page            | Route                     | Content                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------- |
| Usage Analytics | `activity/usage`          | Per-query table: question, answer, status, REMi score      |
| Cost & Tokens   | `activity/tokens`         | Token consumption per query                                |
| Processing      | `activity/resources`      | Resource processing status                                 |
| Searches        | `activity/searches`       | Search-only activity                                       |
| REMi Analytics  | `activity/remi-analytics` | Aggregate REMi charts, health, missing knowledge questions |

---

## Account & KB Management

### Account Level

- **Consumption / Budget**: Monitor and cap API usage.
- **SSO**: SAML/OIDC integration.
- **User Roles**: Owner (full admin), Member (usage only).

### KB Level

- **Settings**: LLM model, semantic model, vectorset, anonymization, labels, entities.
- **Resources**: CRUD, bulk operations, search.
- **Roles**: Manager > Writer > Reader (cumulative).
- **API Keys**: Member / Contributor / Owner (cumulative).
- **Activity Logs**: Per-KB download (CSV).
- **Sync Sources**: External data source connectors (Google Drive, SharePoint, etc.).
- **Backup/Restore**: Enterprise feature.

---

## API Scopes

Four OpenAPI specification scopes, stored in `references/api-specs/`. See `references/api-specs/README.md` for full details.

| Scope        | File            | Base URL                    | Purpose                                              |
| ------------ | --------------- | --------------------------- | ---------------------------------------------------- |
| **global**   | `global.yaml`   | `api.rag.progress.cloud`    | Account management: users, invites, PATs, zones      |
| **nua**      | `nua.yaml`      | `[zone].rag.progress.cloud` | ML/AI: search, predict, models, agents, processing   |
| **nucliadb** | `nucliadb.yaml` | `[zone].rag.progress.cloud` | NucliaDB: resources, fields, search, strategies      |
| **zone**     | `zone.yaml`     | `[zone].rag.progress.cloud` | Zone: KB settings, API keys, sync, backups, activity |

---

## SDK & API (Frontend)

**JS/TS SDK** (`@nuclia/core`) used by this monorepo:

- `Nuclia`: root client — `new Nuclia({ knowledgebox, zone, apiKey })`
- `KnowledgeBox` (`kb`): KB operations — search, ask, resources, settings
- `ActivityMonitor` (`kb.activityMonitor`): activity log queries
- `RetrievalAgent`: agent configuration and invocation

**OpenAI-Compatible API:** `https://[zone-id].rag.progress.cloud/api/v1/predict/compat`  
Auth: `Authorization: Bearer <NUA-KEY>`. Supports chat completions, models list, embeddings.

---

## Domain Glossary

| Term                        | Definition                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Knowledge Box (KB)**      | Primary data container; isolated from other KBs                                                 |
| **Resource**                | Any data item in a KB (doc, image, video, audio, web page, conversation)                        |
| **Field**                   | Sub-unit of a resource (title, body, file, link, conversation)                                  |
| **Paragraph**               | Indexed text chunk extracted from a field                                                       |
| **Vectorset**               | A set of embeddings computed with a specific semantic model; a KB can have multiple             |
| **NUA Key**                 | API key for the Nuclia Understanding API (predict/LLM endpoints)                                |
| **Service Account Key**     | API key for KB access (Member/Contributor/Owner roles)                                          |
| **Sync Agent**              | Dashboard component that monitors external sources for new files                                |
| **Extract Strategy**        | Reusable config for how to extract text from documents (visual, AI tables)                      |
| **Split Strategy**          | Reusable config for how to chunk text (manual delimiter, LLM-based)                             |
| **Data Augmentation Agent** | Post-ingestion agent that enriches resources (labeler, generator, Q&A, graph extractor)         |
| **Retrieval Agent**         | Multi-source RAG orchestration with drivers + workflow                                          |
| **Driver**                  | Connector to an information source within a Retrieval Agent (NucliaDB, Google, Perplexity, MCP) |
| **REMi**                    | RAG Evaluation Metrics — open-source model scoring answer/context relevance and groundedness    |
| **Prompt Lab**              | Dashboard tool for testing prompts across LLMs (KB → Advanced → Prompt Lab)                     |
| **Search Configuration**    | Named stored set of search/RAG parameters for reuse                                             |

---

## Guidelines for UI/UX Decisions

1. **Group activity log fields** by category (Query Details, Retrieval, REMi, etc.) — never flat list.
2. **Expandable large text**: Question, Answer, Reasoning fields can be very long — always use accordions/expanders.
3. **REMi score color coding**: green ≥ 4, yellow 2–3, red ≤ 1. Display all three dimensions (answer_relevance, context_relevance, groundedness).
4. **Status badges**: SUCCESS/ERROR/NO_CONTEXT — visually distinct badge/chip with color.
5. **Performance metrics**: retrieval_time, generative_answer_time, total_duration are for latency debugging.
6. **Knowledge gap indicator**: When context_relevance is low OR status is NO_CONTEXT → highlight as "knowledge gap" (KB needs more content).
7. **Feedback correlation**: Show user feedback (thumbs up/down) alongside REMi scores.
8. **Private KB widget warning**: Never display raw API keys in public-facing UI; guide users to use a proxy pattern.
9. **Streaming answers**: `/ask` returns NDJSON stream — display answer progressively as chunks arrive.
10. **Prompt placement matters**: Rephrase prompt affects retrieval (show in search config); system/user prompts affect generation (show in LLM config).
11. **Region lock**: KB data region cannot be changed after creation — show clearly in creation flow.
12. **Role hierarchy**: Manager > Writer > Reader (KB), Owner > Member (account), Owner > Contributor > Member (API keys) — display as hierarchy, not flat list.
13. **Vectorset migration**: A KB can have multiple vectorsets — show all active vectorsets in settings; highlight "default" one.
14. **Citations UI**: If `citations: "llm_footnotes"`, render Markdown footnote syntax. If `citations: "default"`, highlight answer spans with source links.

---

## Keeping This Skill Up-to-Date

This skill was last updated from:

- **Docs repo:** `../docs` at commit `922725ef1f896d24374b72ac49b0785a0822d833`
- **API specs:** Downloaded `2026-03-26` — ETags and versions stored in `meta.json`

### Detecting stale docs

The docs repo is expected at `../docs` (sibling directory). **If it does not exist, skip this step.**

```bash
if [ -d "../docs" ]; then
  cd ../docs && git fetch && git log 922725ef..origin/main --oneline
else
  echo "docs repo not found at ../docs — skipping"
fi
```

If output is non-empty → new docs commits exist. Compare with `meta.json`'s `docs_repo.last_commit`.

### Detecting stale API specs

```bash
curl -sI "https://cdn.rag.progress.cloud/api/global/v1/api.yaml" | grep -i etag
```

Compare output with `meta.json`'s `api_specs.global.etag`. If different → re-download.

### Update procedure

1. Pull latest docs (if repo exists): `[ -d "../docs" ] && cd ../docs && git pull`
2. Re-read changed files and update the affected `references/*.md` files.
3. Re-download changed API specs: `curl -o references/api-specs/{name}.yaml "https://cdn.rag.progress.cloud/api/{name}/v1/api.yaml"`
4. Update `meta.json` with new commit hash, ETags, and `updated_at` timestamps.
5. Update this SKILL.md if platform concepts changed.

> If the docs repo is not present at `../docs`, steps 1–2 are skipped. API spec updates (steps 3–5) always apply.
