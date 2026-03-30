# Search & RAG Reference

_Source: `../docs/docs/rag/`_

---

## Search Endpoints

| Endpoint  | Returns                                                     | Notes                    |
| --------- | ----------------------------------------------------------- | ------------------------ |
| `/search` | Multiple result sets (fulltext, fuzzy, semantic separately) | Raw multi-mode results   |
| `/find`   | Single merged hierarchical result set                       | Preferred for UI display |
| `/ask`    | Streaming: merged results + generative answer               | NDJSON stream            |
| `/graph*` | Paths, nodes, relations from knowledge graph                | Different params         |

---

## Query Syntax

- `Little Prince` — matches both words
- `"Little Prince"` — exact phrase
- `Little Prince -sheep` — exclude word

---

## Search Features (modes)

| Feature value | Mode              | What it searches                |
| ------------- | ----------------- | ------------------------------- |
| `fulltext`    | Full-text search  | All resource texts + attributes |
| `keyword`     | Fuzzy BM25 search | Text block content              |
| `semantic`    | Vector similarity | Embeddings of all texts         |
| `relations`   | Graph search      | Entity knowledge graph          |

Combine: `features=semantic&features=keyword`

---

## Minimum Score Filtering

```json
{
  "query": "...",
  "min_score": {
    "bm25": 4.0,
    "semantic": 1.2
  }
}
```

| Semantic Model              | Similarity fn | Default min score |
| --------------------------- | ------------- | ----------------- |
| `en-2024-04-24`             | Cosine        | 0.47              |
| `multilingual-2023-08-16`   | Dot product   | 0.7               |
| `multilingual-2024-05-06`   | Dot product   | 0.4               |
| `Open AI small`             | Cosine        | 0.5               |
| `Google multilingual Gecko` | Cosine        | 0.55              |

---

## Filter Expressions (`filter_expression`)

Applied to all search endpoints. POST body (not query param — POST recommended).

```json
{
  "field": <field-filter-expr>,
  "paragraph": <paragraph-filter-expr>,
  "operator": "and" | "or"
}
```

### Boolean operators

- `{"and": [<expr>, <expr>]}` — all must match
- `{"or": [<expr>, <expr>]}` — at least one must match
- `{"not": <expr>}` — must not match

### Field filters (`prop` values)

| prop              | Description               | Example                                                        |
| ----------------- | ------------------------- | -------------------------------------------------------------- |
| `resource`        | By resource id or slug    | `{"prop":"resource","slug":"my-slug"}`                         |
| `field`           | By field type/name        | `{"prop":"field","type":"text"}`                               |
| `keyword`         | Contains word             | `{"prop":"keyword","word":"umbrella"}`                         |
| `created`         | Creation date range       | `{"prop":"created","since":"2021-03-05T02:00:00"}`             |
| `modified`        | Modification date range   | `{"prop":"modified","until":"2021-05-15T02:00:00"}`            |
| `origin_tag`      | Origin tag                | `{"prop":"origin_tag","tag":"word"}`                           |
| `origin_metadata` | Origin metadata key/value | `{"prop":"origin_metadata","field":"agent","value":"crawler"}` |
| `origin_path`     | Path prefix match         | `{"prop":"origin_path","prefix":"Users/JohnDoe"}`              |
| `origin_source`   | Origin source ID          | —                                                              |
| `language`        | Primary language          | `{"prop":"language","language":"en"}`                          |
| `label`           | Resource label            | `{"prop":"label","labelset":"severity","label":"high"}`        |
| `entity`          | Named entity              | `{"prop":"entity","subtype":"CITY","value":"Paris"}`           |
| `status`          | Processing status         | —                                                              |
| `security`        | Access group              | —                                                              |

### Paragraph filters (`prop` values)

- `kind`: paragraph type — `OCR`, `INCEPTION`, `DESCRIPTION`, `ANNOTATED_TEXT`, `TITLE`, `SUMMARY`, `CONVERSATION`
- `label`: paragraph-level label

---

## Facets

Use `faceted` parameter for aggregate counts:

- `/origin.tags`, `/classification.labels/{labelset}/{label}`, `/icon`
- `/metadata.status`, `/entities/{type}/{id}`, `/metadata.language`
- `/origin.metadata`, `origin.path`

---

## RAG Strategies (`rag_strategies` in `/ask`)

| Strategy                  | What it does                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `hierarchy`               | Prepends resource title + summary to each paragraph                                       |
| `neighbouring_paragraphs` | Includes paragraphs before/after matched paragraph                                        |
| `prequeries`              | Runs additional queries first to build broader context; supports `weight` and `prefilter` |
| `graph_beta`              | Entity-based knowledge graph search for additional context                                |
| `full_resource`           | Includes entire resource text (not just matching paragraph)                               |
| `page_image`              | Includes page images (for multimodal LLMs)                                                |

---

## `/ask` Endpoint Details

- Returns **NDJSON stream** (newline-delimited JSON).
- Add `x-synchronous: true` header for non-streaming (testing only — slower).
- Key `top_k`: number of paragraphs passed to LLM (default 20).

### Stream item types

- `retrieval` — search results (same as /find)
- `answer` — generative answer text chunks
- `metadata` — tokens consumed, timing
- `citations` — which paragraphs were used in which parts of answer
- `status` — `success` or `error`
- `error` — error message
- `relations` — entity relations mentioned in query

### Citation modes

- `citations: "llm_footnotes"` (BETA) — Markdown footnote syntax inline; `block-AA` style IDs; mapping via `footnote_to_context`
- `citations: "default"` — Mapping of paragraph IDs to answer spans

---

## Prompts

Three prompt types, all customizable:

| Prompt     | When applied      | Purpose                                                 |
| ---------- | ----------------- | ------------------------------------------------------- |
| `rephrase` | **Before** search | Improves retrieval quality; guides search direction     |
| `system`   | After retrieval   | Sets LLM behavior/persona                               |
| `user`     | After retrieval   | Template with `{context}` and `{question}` placeholders |

**Critical:** Put topic/domain constraints in `rephrase` (before search), not in `user` (after search is already done).

Set at KB level (dashboard) or per-query:

```json
{
  "prompt": {
    "system": "You are a submarine biology expert.",
    "user": "Given this context: {context}. Answer {question} concisely.",
    "rephrase": "Focus on South Pacific marine life."
  }
}
```

---

## Stored Search Configurations

Save reusable parameter sets as named configurations:

```
POST /api/v1/kb/{kbid}/search_configurations/{config_name}
{
  "kind": "ask",  // or "find"
  "config": { ... all /ask parameters ... }
}
```

Use by name: `{"query": "...", "search_configuration": "my_search_config"}` — no need to repeat individual params.

Useful for: centralizing config, A/B testing, switching strategies per client.

---

## REMi (RAG Evaluation Metrics)

Open-source fine-tuned LLM that evaluates RAG quality. Runs automatically on Agentic RAG.

| Metric                | Measures                                | Score range |
| --------------------- | --------------------------------------- | ----------- |
| **Answer Relevance**  | How well answer addresses the question  | 0–5         |
| **Context Relevance** | How pertinent retrieved context is      | 0–5         |
| **Groundedness**      | How well answer is supported by context | 0–5         |

### REMi status

- `SUCCESS`: Evaluation completed
- `ERROR`: Evaluation failed
- `NO_CONTEXT`: No context retrieved — cannot evaluate

### Diagnostic patterns

| Symptom                                         | Diagnosis                                | Fix                                      |
| ----------------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| High context rel, low answer rel + groundedness | LLM generating evasive answers           | Try different LLM                        |
| High answer rel, low context rel + groundedness | LLM hallucinating (unverifiable answers) | Check KB content; adjust search strategy |
| High groundedness, low answer rel + context rel | LLM answering based on wrong context     | Improve search config / min_score        |
| Many NO_CONTEXT                                 | KB empty or filters too restrictive      | Add content or relax filters             |

### Dashboard pages

| Page                   | Route                     | What it shows                                                                |
| ---------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| KB Home                | —                         | Health status widget (7-day REMi summary)                                    |
| RAG Evaluation Metrics | `activity/remi-analytics` | Evolution charts; questions without answers; low-context-relevance questions |
| Usage Analytics        | `activity/usage`          | Per-query table with REMi scores                                             |

---

## Score Ranking & Reranking

- Results are initially ranked by combined BM25 + semantic score.
- Reranking can be applied to reorder results using more expensive cross-encoder models.
- Configure via search endpoint parameters.

---

## Search Performance Tips

- Use `min_score` to cut low-quality results early.
- Use `filter_expression` to scope searches and reduce result set size.
- `neighbouring_paragraphs` strategy improves answer quality for dense docs at cost of more tokens.
- `prequeries` with `weight` allows blending multiple retrieval passes.
- Use `search_configuration` names instead of sending full params every time.
