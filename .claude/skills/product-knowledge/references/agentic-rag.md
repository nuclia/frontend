# Agentic RAG (Retrieval Agents) Reference

_Source: `../docs/docs/agentic/`_

---

## What is a Retrieval Agent?

A **Retrieval Agent** is an advanced RAG orchestration layer that goes beyond a single Knowledge Box:

| Feature        | Basic KB RAG      | Retrieval Agent                                               |
| -------------- | ----------------- | ------------------------------------------------------------- |
| Sources        | Single KB         | Multiple KBs, SQL, internet, MCP servers                      |
| Query handling | Direct search     | Analyse question, split into sub-questions, route dynamically |
| Logic          | None              | Conditional branching, multi-step pipelines                   |
| Deployment     | Widget / API call | Widget / API call                                             |

**Location in dashboard:** Account → _Retrieval Agents_ in left menu → Create retrieval agent.

---

## Core Components

### Drivers

A driver exposes a specific information source to the agent. The driver's **name and description** matter — the agent uses them to decide which source is relevant for a given query.

| Driver type    | Source                                                                       |
| -------------- | ---------------------------------------------------------------------------- |
| **NucliaDB**   | One of your Agentic RAG Knowledge Boxes; auto-creates API key if same region |
| **Google**     | Gemini via Google API or Vertex AI                                           |
| **Perplexity** | Internet search via Perplexity API                                           |
| **MCP server** | Any MCP server via endpoint URL + auth                                       |

### Workflow

Structured 4-step pipeline:

```
Preprocess → Retrieval context → Generation → Postprocess
```

#### 1. Preprocess

- **Rephrase**: Rewrites the user question for better retrieval. Can reference a KB for relevant context; configurable rules.

#### 2. Retrieval Context

- **Ask**: Queries one or more NucliaDB KBs (via NucliaDB drivers) with full search + RAG parameters.
- **Perplexity**: Internet search via Perplexity driver.
- **Google**: Gemini search via Google driver.
- **MCP**: Calls tools on configured MCP servers.

#### 3. Generation

- **Summarize**: Takes all retrieved content and generates an answer to the user question.

#### 4. Postprocess

- **Validation**: Runs REMi to assess answer quality.
- **External Call**: HTTP call to any external endpoint (webhooks, downstream triggers).

---

## Configuration Flow

1. Create the agent (gives it a name/description).
2. Add **Drivers** (each pointing at a source with credentials).
3. Configure the **Workflow** (chain steps, select drivers, set parameters).
4. Optionally configure embedding via widget or API.

---

## Key Differences vs Basic RAG

- Basic `/ask` = single KB, single retrieval pass, single LLM generation.
- Retrieval Agent = multi-source, dynamic routing, conditional logic, multi-step.
- Retrieval Agents are configured at the **account level**, not per-KB.
- The Retrieval Agent `Validation` postprocess step uses REMi automatically.
