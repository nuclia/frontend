# API Specifications Index

The Nuclia/Progress Agentic RAG platform exposes 4 separate REST API scopes.
YAML files are stored in this directory: `.claude/skills/product-knowledge/references/api-specs/`

Version metadata is tracked in: `.claude/skills/product-knowledge/meta.json`

---

## API Scopes

### 1. `global.yaml` — Account REST API

**Base URL:** `https://api.rag.progress.cloud/api/v1/`
**Auth:** Personal Access Token (PAT) or account-level token
**Purpose:** Global account management — not per-zone or per-KB. Used primarily by `manager-v2`.

**Key routes:**

| Method | Path                                 | What it does                              |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/api/v1/accounts`                   | List all accounts (super-admin)           |
| POST   | `/api/v1/accounts`                   | Create an account                         |
| GET    | `/api/v1/account/{slug}`             | Get account details                       |
| PATCH  | `/api/v1/account/{slug}`             | Update account name/settings              |
| GET    | `/api/v1/account/{slug}/users`       | List users in account                     |
| PATCH  | `/api/v1/account/{slug}/users`       | Assign/remove user roles                  |
| POST   | `/api/v1/account/{slug}/invite`      | Send account invite by email              |
| GET    | `/api/v1/account/{slug}/usage`       | Get API usage metrics                     |
| GET    | `/api/v1/account/{slug}/permissions` | Get current user's permissions on account |
| GET    | `/api/v1/user`                       | Get authenticated user profile            |
| PATCH  | `/api/v1/user`                       | Update profile (name, preferences)        |
| GET    | `/api/v1/user/pa_tokens`             | List personal access tokens               |
| POST   | `/api/v1/user/pa_tokens`             | Create a personal access token            |
| GET    | `/api/v1/zones`                      | List available deployment zones           |

---

### 2. `nua.yaml` — Nuclia Understanding API

**Base URL:** `https://[zone-id].rag.progress.cloud/` (paths start with `/kb/`, `/account/`, `/agent/`, `/predict/`)
**Auth:** NUA API key (`Authorization: Bearer <NUA-KEY>`)
**Purpose:** ML/AI processing, knowledge box operations at the processing layer, and Retrieval Agent management.

**Key routes — Search & RAG:**

| Method   | Path                               | What it does                                 |
| -------- | ---------------------------------- | -------------------------------------------- |
| POST     | `/kb/{kbid}/ask`                   | Generative answer (NDJSON stream)            |
| GET/POST | `/kb/{kbid}/mcp`                   | MCP protocol handler for KB                  |
| POST     | `/predict/remi`                    | Run REMi evaluation on a query               |
| POST     | `/predict/rerank`                  | Rerank search results                        |
| POST     | `/predict/rephrase`                | Rephrase a user query                        |
| POST     | `/predict/sentences`               | Compute embeddings for texts                 |
| POST     | `/predict/chat`                    | Direct LLM chat (no RAG)                     |
| POST     | `/predict/compat/chat/completions` | OpenAI-compatible chat completions           |
| POST     | `/predict/compat/embeddings`       | OpenAI-compatible embeddings                 |
| GET      | `/predict/compat/models`           | List available models (OpenAI-compat format) |
| POST     | `/predict/summarize`               | Summarize documents                          |

**Key routes — Retrieval Agents:**

| Method | Path                                       | What it does                                        |
| ------ | ------------------------------------------ | --------------------------------------------------- |
| POST   | `/agent/{id}/sessions`                     | Create an agent interaction session                 |
| POST   | `/agent/{id}/session/{session}`            | Send a message to the agent (interaction)           |
| GET    | `/agent/{id}/drivers`                      | List configured drivers                             |
| POST   | `/agent/{id}/drivers`                      | Add a driver (NucliaDB KB, Google, Perplexity, MCP) |
| GET    | `/agent/{id}/workflows`                    | List workflows                                      |
| PATCH  | `/agent/{id}/workflow/{wf_id}`             | Update workflow configuration                       |
| POST   | `/agent/{id}/workflow/{wf_id}/preprocess`  | Add preprocess step (e.g. Rephrase)                 |
| POST   | `/agent/{id}/workflow/{wf_id}/generation`  | Add generation step (Summarize)                     |
| POST   | `/agent/{id}/workflow/{wf_id}/postprocess` | Add postprocess step (Validation, External Call)    |
| POST   | `/agent/{id}/prompts`                      | Add a named prompt to an agent                      |
| POST   | `/agent/{id}/audit/interactions/download`  | Request agent interaction audit download            |

**Key routes — Data Augmentation Tasks:**

| Method | Path                           | What it does                                         |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/kb/{kbid}/tasks`             | List available task types (labeler, generator, etc.) |
| POST   | `/kb/{kbid}/task/start`        | Start a data augmentation task on KB                 |
| POST   | `/kb/{kbid}/task/{id}/enable`  | Enable task to run continuously on new resources     |
| POST   | `/kb/{kbid}/task/{id}/stop`    | Stop a running task                                  |
| GET    | `/kb/{kbid}/task/{id}/inspect` | Inspect task status and config                       |

---

### 3. `nucliadb.yaml` — NucliaDB REST API

**Base URL:** `https://[zone-id].rag.progress.cloud/` (paths start with `/kb/`)
**Auth:** Service account key or user token (`X-NUCLIA-SERVICEACCOUNT`)
**Purpose:** Low-level NucliaDB operations — direct resource and field management, search. Used by `nucliadb-admin` and `@nuclia/core` SDK.

**Key routes — KB & Search:**

| Method   | Path                       | What it does                                                   |
| -------- | -------------------------- | -------------------------------------------------------------- |
| GET      | `/kb/{kbid}`               | Get KB metadata                                                |
| GET      | `/kb/s/{slug}`             | Get KB by slug                                                 |
| POST     | `/kb/{kbid}/ask`           | Generative answer (NDJSON stream)                              |
| GET/POST | `/kb/{kbid}/find`          | Search with merged hierarchical results (preferred for UI)     |
| GET/POST | `/kb/{kbid}/search`        | Search with separate result sets (fulltext, keyword, semantic) |
| GET      | `/kb/{kbid}/suggest`       | Typeahead / auto-complete suggestions                          |
| POST     | `/kb/{kbid}/graph`         | Graph search (entities + relations)                            |
| POST     | `/kb/{kbid}/summarize`     | Summarize a set of documents                                   |
| GET/POST | `/kb/{kbid}/catalog`       | List resources (paginated, filterable — no vector search)      |
| GET      | `/kb/{kbid}/counters`      | KB stats (resource count, processing status)                   |
| POST     | `/kb/{kbid}/feedback`      | Submit user feedback (thumbs up/down)                          |
| GET      | `/kb/{kbid}/notifications` | SSE stream for real-time processing events                     |

**Key routes — Resources:**

| Method | Path                                   | What it does                                          |
| ------ | -------------------------------------- | ----------------------------------------------------- |
| GET    | `/kb/{kbid}/resources`                 | List all resources (paginated)                        |
| POST   | `/kb/{kbid}/resources`                 | Create a new resource                                 |
| GET    | `/kb/{kbid}/resource/{rid}`            | Get full resource with all fields                     |
| PATCH  | `/kb/{kbid}/resource/{rid}`            | Update resource metadata/fields                       |
| DELETE | `/kb/{kbid}/resource/{rid}`            | Delete a resource                                     |
| POST   | `/kb/{kbid}/resource/{rid}/reprocess`  | Re-run processing pipeline on resource                |
| POST   | `/kb/{kbid}/resource/{rid}/reindex`    | Re-index a resource (after config change)             |
| POST   | `/kb/{kbid}/resource/{rid}/run-agents` | Run data augmentation agents on a specific resource   |
| POST   | `/kb/{kbid}/resource/{rid}/ask`        | Ask a question scoped to a single resource            |
| GET    | `/kb/{kbid}/slug/{rslug}`              | Get resource by slug (stable user-defined identifier) |
| PATCH  | `/kb/{kbid}/slug/{rslug}`              | Update resource by slug                               |
| DELETE | `/kb/{kbid}/slug/{rslug}`              | Delete resource by slug                               |
| POST   | `/kb/{kbid}/upload`                    | Upload binary file directly (non-resumable)           |
| POST   | `/kb/{kbid}/tusupload`                 | Create TUS resumable upload session                   |

**Key routes — KB Services:**

| Method       | Path                                      | What it does                                             |
| ------------ | ----------------------------------------- | -------------------------------------------------------- |
| GET/PATCH    | `/kb/{kbid}/configuration`                | KB model configuration (LLM, embedding model, vectorset) |
| GET          | `/kb/{kbid}/labelsets`                    | List all label sets                                      |
| POST/DELETE  | `/kb/{kbid}/labelset/{ls}`                | Create/delete a label set                                |
| GET          | `/kb/{kbid}/entitiesgroups`               | List all entity groups (NER types)                       |
| PUT/DELETE   | `/kb/{kbid}/custom-synonyms`              | Set/delete custom search synonyms                        |
| GET/POST     | `/kb/{kbid}/search_configurations`        | List / create stored named search configurations         |
| PATCH/DELETE | `/kb/{kbid}/search_configurations/{name}` | Update / delete a named search config                    |
| GET          | `/kb/{kbid}/generative_providers`         | List available LLMs for this KB                          |
| POST         | `/kb/{kbid}/predict/{endpoint}`           | Proxy to NUA Predict API in KB context                   |
| GET/POST     | `/kb/{kbid}/extract_strategies`           | List / create extract strategies                         |
| GET/POST     | `/kb/{kbid}/split_strategies`             | List / create split strategies                           |

---

### 4. `zone.yaml` — Knowledge Box & Zone REST API

**Base URL:** `https://[zone-id].rag.progress.cloud/api/v1/`
**Auth:** Account token or API key
**Purpose:** Zone-level KB management: creating KBs, assigning users, API keys, sync, backups, activity logs, REMi analytics. Used by `dashboard`.

**Key routes — KB Management:**

| Method | Path                                               | What it does                                           |
| ------ | -------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/api/v1/account/{id}/kbs`                         | List all KBs in account                                |
| POST   | `/api/v1/account/{id}/kbs`                         | Create a new KB (sets name, region)                    |
| GET    | `/api/v1/account/{id}/kb/{kb_id}`                  | Get KB details (title, region, status, public/private) |
| PATCH  | `/api/v1/account/{id}/kb/{kb_id}`                  | Update KB settings (name, publish/unpublish)           |
| DELETE | `/api/v1/account/{id}/kb/{kb_id}`                  | Delete a KB                                            |
| GET    | `/api/v1/account/{id}/kb/{kb_id}/users`            | List KB users with their roles                         |
| PATCH  | `/api/v1/account/{id}/kb/{kb_id}/users`            | Update KB user roles (Manager/Writer/Reader)           |
| POST   | `/api/v1/account/{id}/kb/{kb_id}/invite`           | Invite a user to a KB by email                         |
| GET    | `/api/v1/account/{id}/kb/{kb_id}/permissions`      | Get current user's KB permissions                      |
| POST   | `/api/v1/account/{id}/kb/{kb_id}/ephemeral_tokens` | Create short-lived access token                        |

**Key routes — API Keys (Service Accounts):**

| Method | Path                                               | What it does                                      |
| ------ | -------------------------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/account/{id}/kb/{kb_id}/service_accounts` | List all service accounts for KB                  |
| POST   | `/api/v1/account/{id}/kb/{kb_id}/service_accounts` | Create service account (Member/Contributor/Owner) |
| POST   | `.../service_account/{sa_id}/keys`                 | Generate a new key for a service account          |
| DELETE | `.../service_account/{sa_id}`                      | Delete a service account                          |
| DELETE | `.../service_account/{sa_id}/key/{key_id}`         | Delete a specific key                             |

**Key routes — NUA Keys:**

| Method | Path                               | What it does              |
| ------ | ---------------------------------- | ------------------------- |
| GET    | `/api/v1/account/{id}/nua_clients` | List NUA keys for account |
| POST   | `/api/v1/account/{id}/nua_clients` | Create a NUA key          |
| PUT    | `.../nua_client/{client_id}/key`   | Regenerate NUA key secret |

**Key routes — Activity & REMi:**

| Method | Path                                             | What it does                                                           |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------- |
| POST   | `/api/v1/kb/{kb_id}/activity/{event_type}/query` | Query activity logs (event_type: SEARCH, ASK, VISITED, etc.)           |
| POST   | `.../query/download`                             | Request async download of activity log as CSV                          |
| GET    | `/api/v1/kb/{kb_id}/activity/metrics`            | Aggregated usage metrics                                               |
| GET    | `/api/v1/kb/{kb_uuid}/remi/scores`               | Aggregated REMi scores over a time range                               |
| POST   | `/api/v1/kb/{kb_uuid}/remi/query`                | Query RAG requests filtered/sorted by REMi scores                      |
| GET    | `/api/v1/kb/{kb_uuid}/remi/events/{event_id}`    | Get single RAG request with full REMi context and retrieved paragraphs |

**Key routes — Sync:**

| Method | Path                              | What it does                                       |
| ------ | --------------------------------- | -------------------------------------------------- |
| GET    | `/api/v1/kb/{kb_id}/sync_configs` | List sync source configurations                    |
| POST   | `/api/v1/kb/{kb_id}/sync_configs` | Add a sync config (Google Drive, SharePoint, etc.) |
| POST   | `.../sync_config/{id}/sync`       | Trigger a manual sync immediately                  |
| GET    | `.../sync_config/{id}/jobs`       | List sync job history and status                   |
| POST   | `.../sync_config/{id}/authorize`  | Get OAuth2 authorization URL for connector         |

**Key routes — Backups (Enterprise):**

| Method | Path                             | What it does               |
| ------ | -------------------------------- | -------------------------- |
| GET    | `/api/v1/account/{id}/backups`   | List KB backups            |
| POST   | `/api/v1/account/{id}/backups`   | Create a KB backup         |
| POST   | `.../backup/{backup_id}/restore` | Restore a KB from a backup |
| DELETE | `.../backup/{backup_id}`         | Delete a backup            |

---

## Checking for Updates

To detect if the downloaded specs are stale, compare against `meta.json`:

```bash
# Check current ETag for a spec
curl -sI "https://cdn.rag.progress.cloud/api/global/v1/api.yaml" | grep -i etag

# Compare with stored ETag in meta.json
python3 -c "import json; d=json.load(open('.claude/skills/product-knowledge/meta.json')); print(d['api_specs']['global']['etag'])"
```

If ETags differ, re-download:

```bash
curl -o .claude/skills/product-knowledge/references/api-specs/global.yaml \
  "https://cdn.rag.progress.cloud/api/global/v1/api.yaml"
# Update meta.json with new ETag and updated_at timestamp
```

## Checking for Docs Repo Updates

```bash
cd ../docs && git fetch && git log HEAD..origin/main --oneline
```

If new commits exist, compare with `meta.json`'s `docs_repo.last_commit` and update the reference files accordingly.
