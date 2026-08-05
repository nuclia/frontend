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

| Driver type    | Source                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NucliaDB**   | One of your Agentic RAG Knowledge Boxes; auto-creates API key if same region                                                                           |
| **Google**     | Gemini via Google API or Vertex AI                                                                                                                     |
| **Perplexity** | Internet search via Perplexity API                                                                                                                     |
| **MCP server** | Any MCP server via endpoint URL + auth; supports **OAuth 2** — the driver handles the authorization flow automatically for MCP servers that require it |
| **SQL**        | Any relational database via connection URI (PostgreSQL, MySQL, etc.)                                                                                   |
| **Snowflake**  | Snowflake database (account + user + warehouse + database; password or PEM key)                                                                        |

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
- **SQL** _(beta)_: Natural-language queries over a relational database (via SQL driver). Configurable: conversion model, dynamic table selection, `include_tables`/`ignore_tables`, sample rows, index info, retry count.
- **Snowflake** _(beta)_: Natural-language queries over Snowflake (via Snowflake driver). Works like SQL agent with Snowflake-specific dialect guidance; supports `max_result_rows`, schema override, dynamic table selection.
- **Pandas** _(beta)_: Queries over a `.csv` dataframe. Configurable: conversion model, sample rows, retry count.
- **Smart Agent**: Orchestrates multiple agents dynamically. Plans the answer — picks the most appropriate sources, splits the question into sub-questions, evaluates relevancy, and iterates autonomously. Selects and invokes functions exposed by registered agents based on capabilities and task requirements. Configurable: planning mode (`reactive` — decides step-by-step, faster; or `plan_execute` — plans all steps upfront, slower but more accurate for complex questions), models for planning/execution phases (a fast model is recommended for context validation when _Prune context_ is enabled; a more powerful model for planning/execution), registered agents list (each needs an extensive description so the Smart Agent knows when to use it, plus the proper function per source type — MCP agents don't need one since functions are provided dynamically by the MCP server), extra rules. Supports **chat mode**: enable _Session history_ on the Smart Agent so it accounts for prior conversation when planning, and enable _Conversational_ mode on the paired Summarize agent so answers don't repeat previously provided information.

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

## Deployment

A Retrieval Agent can be deployed in three ways:

- **Ready-to-use widget**: Create it under _Widgets_ in the left menu (_Create widget_); customize appearance, then embed the generated snippet. Easiest option, provides a chat UI out of the box.
- **Custom frontend**: Full control over UI/UX. Call the agent directly via the Websocket API, or use the JavaScript SDK to simplify integration.
- **MCP**: The agent is reachable as an MCP endpoint for integration with broader AI-based systems (e.g. Claude Cowork, Copilot). The endpoint URL is shown on the agent's home page in the dashboard.

---

## Key Differences vs Basic RAG

- Basic `/ask` = single KB, single retrieval pass, single LLM generation.
- Retrieval Agent = multi-source, dynamic routing, conditional logic, multi-step.
- Retrieval Agents are configured at the **account level**, not per-KB.
- The Retrieval Agent `Validation` postprocess step uses REMi automatically.
