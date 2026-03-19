# Product Knowledge Skill

## Purpose
Provides domain knowledge about the Nuclia / Progress Agentic RAG platform so that AI agents can make informed UI/UX decisions when building or modifying frontend pages.

---

## Platform Overview

**Nuclia Agentic RAG** (branded as "Stashify" in some contexts) is a Retrieval-Augmented Generation platform. It allows users to:
1. **Ingest** data (documents, files, URLs, conversations) into **Knowledge Boxes** (KBs).
2. **Search** that data via semantic, keyword, fulltext, and graph search modes.
3. **Generate** answers using LLMs grounded in retrieved context (the RAG pipeline).
4. **Evaluate** answer quality automatically using the **REMi** model.
5. **Build agents** (Retrieval Agents) that orchestrate multi-source retrieval with workflows and drivers.

---

## Core Concepts

### Knowledge Box (KB)
A container for resources. Each KB has its own settings, users, roles, and activity logs. Resources inside a KB are processed (text extraction, NER, embedding) and indexed for search.

### Resources
Individual items in a KB — documents, links, conversations, files. Each resource has fields (title, body, files, links, conversations) and extracted metadata (entities, summaries, paragraphs, embeddings).

### Ingestion Pipeline
Data enters a KB via API, SDK, CLI, Dashboard upload, or **Sync Agent** (monitors external sources like Google Drive, Sharepoint, etc.). During ingestion:
- Text is extracted from files (PDF, DOCX, images via OCR, audio via transcription, video).
- NER extracts entities (people, places, orgs).
- Paragraphs are split and embedded for semantic search.
- Optional **data augmentation agents**: summary, graph extractor, question generator, labeller.

### Search (`/find` endpoint)
Retrieves matching paragraphs/resources. Modes:
- **Semantic**: vector similarity (cosine or dot product).
- **Keyword (BM25)**: term frequency ranking.
- **Fulltext**: resource-level keyword match.
- **Graph**: entity-based knowledge graph traversal.

Parameters: `features`, `filters`, `min_score` (semantic + BM25), `show`, `rephrase`, `faceted`, `security.groups`.

### RAG / Ask (`/ask` endpoint)
Internally calls `/find`, collects top-k paragraphs as context, sends to LLM for answer generation. Key parameters:
- `top_k`: number of paragraphs in context (default 20).
- `rag_strategies`: transform context before sending to LLM.
  - `hierarchy`: prepend resource title + summary to paragraph.
  - `neighbouring_paragraphs`: include before/after paragraphs.
  - `prequeries`: run additional queries to gather broader context (supports `weight` and `prefilter`).
  - `graph_beta`: knowledge graph entity search.
  - `full_resource`: include entire resource text.
  - `page_image`: include page images for multimodal models.
- `generative_model`: which LLM to use.
- `prompt`: system/user prompt templates with `{context}` and `{question}` placeholders.
- `citations`: include citation markers in the answer.
- `rephrase_prompt`: custom rephrase prompt.

### Retrieval Agents (Agentic RAG)
Advanced orchestration layer on top of basic RAG:
- **Multiple sources**: query several KBs, SQL databases, external APIs, MCP servers.
- **Workflows**: multi-step pipelines with conditional logic.
- **Drivers**: configurable LLM backends.
- Agents can be embedded via widgets or called via API.

---

## REMi (RAG Evaluation Metrics)

REMi is an open-source model that automatically evaluates RAG answer quality. It scores three dimensions on a 0–5 scale:

| Metric | What it measures |
|---|---|
| **Answer Relevance** | How well the answer addresses the user's question |
| **Context Relevance** | How pertinent the retrieved context is to the question |
| **Groundedness** | How well the answer is supported by the retrieved context |

### REMi Status Values
- `SUCCESS`: REMi was able to evaluate the answer.
- `ERROR`: Something went wrong during evaluation.
- `NO_CONTEXT`: No context was retrieved, so REMi cannot evaluate.

### Diagnostic Patterns
| Symptom | Likely cause |
|---|---|
| High context relevance, low answer relevance | LLM prompt needs tuning or different model |
| High answer relevance, low groundedness | LLM hallucinating; KB may have gaps |
| Low context relevance across the board | Search config issue (wrong mode, low min_score) |
| Many NO_CONTEXT | KB is empty or filters too restrictive |

### REMi in the Dashboard
- **Metrics page** (route: `remi-analytics`): Shows health status distribution, performance evolution over time, and "missing knowledge" (questions where retrieval failed).
- **Usage Analytics page** (route: `usage`): Table of individual queries with question, answer, status, and REMi score — allows drilling into specific interactions.

---

## Activity Logs & Monitoring

The platform tracks every `/ask` and `/find` call. Each log entry (`ActivityLogItem`) contains:

### Field Groups

| Group | Fields | Description |
|---|---|---|
| **Query Details** | `question`, `answer`, `user_request`, `filter`, `client_type`, `user_id`, `id`, `date` | What was asked and by whom |
| **Retrieval** | `retrieval_time`, `resources_count`, `vectorset`, `min_score_bm25`, `min_score_semantic`, `retrieval_rephrased_question`, `result_per_page` | How search performed |
| **Generative / LLM** | `model`, `generative_answer_time`, `generative_answer_first_chunk_time`, `generative_reasoning_first_chunk_time`, `reasoning` | LLM response details |
| **REMi Score** | `remi_scores` (answer_relevance, context_relevance, groundedness), `status` | Quality evaluation |
| **Feedback** | `feedback_good`, `feedback_comment`, `feedback_good_all`, `feedback_good_any` | User thumbs up/down |
| **RAG Strategies** | `rag_strategies_names`, `rag_strategies` | Which strategies were used |
| **Tokens & Cost** | `nuclia_tokens` | Token consumption |
| **Performance** | `total_duration` | End-to-end latency |
| **Processing** | `resource_id`, `audit_metadata` | Internal processing info |
| **Security** | `security_groups` | Access control context |

### Dashboard Activity Pages

| Page | Route | Content |
|---|---|---|
| Usage Analytics | `activity/usage` | Per-query table (question, answer, status, REMi score) from `/remi/query` API |
| Cost & Tokens | `activity/tokens` | Token consumption per query |
| Processing | `activity/resources` | Resource processing status |
| Searches | `activity/searches` | Search-only activity |
| REMi Analytics | `activity/remi-analytics` | Aggregate REMi metrics (charts, health, missing knowledge) |

---

## Account & KB Management

### Account Level
- **Consumption / Budget**: Monitor and cap API usage.
- **Project Settings**: Configure global defaults.
- **SSO**: SAML/OIDC integration.
- **User Roles**: Owner, Member.

### KB Level
- **Settings**: LLM model, semantic model, vectorset, anonymization.
- **Resources**: CRUD, bulk operations, search.
- **Roles**: Manager, Writer, Reader.
- **Activity Logs**: Per-KB monitoring.
- **Labels / Entities**: Classification and NER management.
- **Sync Sources**: External data source connectors.

---

## SDK & API

- **REST API**: OpenAPI specs at `global`, `nua`, `nucliadb`, `zone` scopes.
- **Python SDK**: `nuclia` package — API wrapper + CLI.
- **JS/TS SDK** (`@nuclia/core`): Used by this frontend monorepo. Key classes:
  - `Nuclia`: root client.
  - `KnowledgeBox` (`kb`): KB operations.
  - `ActivityMonitor` (`kb.activityMonitor`): activity log queries.
  - `RetrievalAgent`: agent configuration and invocation.

---

## Guidelines for UI/UX Decisions

1. **Group related fields**: When displaying activity log details, group fields by the categories above (Query Details, Retrieval, REMi, etc.) rather than showing a flat list.
2. **Expandable large text**: Question, Answer, and Reasoning fields can be very long — always use accordions/expanders.
3. **REMi scores are the quality signal**: Prominently display answer_relevance, context_relevance, groundedness. Use color coding (green ≥ 4, yellow 2-3, red ≤ 1).
4. **Status matters**: SUCCESS/ERROR/NO_CONTEXT should be visually distinct (badge/chip with color).
5. **Performance metrics**: retrieval_time, generative_answer_time, total_duration are useful for debugging latency.
6. **Missing knowledge**: When context_relevance is low or status is NO_CONTEXT, highlight this as a "knowledge gap" — the KB needs more content.
7. **Feedback correlation**: Show user feedback alongside REMi scores to validate automated evaluation.
