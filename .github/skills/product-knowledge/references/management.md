# KB Management & Security Reference

_Source: `../docs/docs/management/`_

---

## Knowledge Box (KB) Overview

A **Knowledge Box** is the primary data container in Agentic RAG. KBs are isolated from each other. A KB can be **public** or **private**.

---

## Access Control

### Account-level roles

| Role       | Permissions                                 |
| ---------- | ------------------------------------------- |
| **Owner**  | Full admin: manage users, billing, settings |
| **Member** | Use the system; no admin access             |

### KB-level roles (cumulative — each can do everything below it)

| Role        | Permissions                               |
| ----------- | ----------------------------------------- |
| **Manager** | Full KB control: content, users, settings |
| **Writer**  | Add/modify content                        |
| **Reader**  | Read-only search access                   |

### API key types (also cumulative)

| API key role    | Allowed operations                     |
| --------------- | -------------------------------------- |
| **Member**      | Read: GET resources, search, find, ask |
| **Contributor** | Write: create resources, set labels    |
| **Owner**       | Admin: change settings, add users      |

---

## Public vs Private KB

### Public KB

- All content visible to everyone (anonymous users can search).
- Only authorized users can write or change settings.
- `/search` requires no `Authorization` header.
- Write/admin endpoints require `Authorization` token (API key or SAML user token).
- Enable via: Dashboard → KB Settings → **Publish** button.

### Private KB

- All endpoints require `X-NUCLIA-SERVICEACCOUNT` header.
- No granular content-level ACL within a KB — all authorized users see all content.
- Use `security.access_groups` on resources for **filtering** (not enforcement — intersection semantics).

### Using the widget on a private KB

- **Direct access:** Add `apikey` (Member key), `state="PRIVATE"`, `account`, `kbslug` attributes. ⚠️ Never publish on public website — key visible in HTML.
- **Behind a proxy:** Inject `X-NUCLIA-SERVICEACCOUNT` at proxy level; use `backend` + `proxy="true"` widget attributes.

---

## Security Architecture

| Layer                     | Details                             |
| ------------------------- | ----------------------------------- |
| **Encryption at rest**    | AES-256                             |
| **Encryption in transit** | TLS                                 |
| **RBAC**                  | Account-level + KB-level roles      |
| **Compliance**            | GDPR, SOC 2, ISO 27001              |
| **Audits**                | Regular third-party security audits |

---

## Activity Logs

Activity logs track all events in a KB:

| Event type                           | Logged |
| ------------------------------------ | ------ |
| Resources processed, created, edited | ✓      |
| Questions asked + generative answers | ✓      |
| Search queries                       | ✓      |
| User feedback (thumbs up/down)       | ✓      |
| Token usage per event                | ✓      |

Each entry includes timestamp + triggering user.

**Access:** KB → Advanced menu → Activity Log → Download CSV (current month).

### Important token notes

- Token availability has a **few-minute delay** (async collection).
- `/ask` metadata response shows only **generative model** tokens; activity logs include **all** costs (embeddings, etc.).
- Minor discrepancies with dashboard account page are normal.

---

## KB Settings

Configurable per-KB:

- **LLM model**: Default generative model for `/ask`
- **Semantic model**: Embedding model (vectorset)
- **Vectorsets**: Multiple embedding models per KB (for migration / A/B)
- **Anonymization**: PII scrubbing during ingestion
- **Labels / Entities**: Classification labelsets, NER entity types
- **Sync Sources**: External connector configuration
- **API Keys**: Create Member/Contributor/Owner keys
- **Users**: Manage KB-level role assignments

---

## Backup (Enterprise)

Enterprise accounts can create Backup/Restore for Knowledge Boxes. Managed from the Dashboard or API.

---

## Authentication Methods

| Method                                            | Use case                                 |
| ------------------------------------------------- | ---------------------------------------- |
| API key (`X-NUCLIA-SERVICEACCOUNT: Bearer <key>`) | Service-to-service, widgets              |
| User token (SAML flow)                            | End-user SSO login                       |
| NUA key                                           | Predict/LLM endpoints, OpenAI compat     |
| OIDC / SAML SSO                                   | Enterprise identity provider integration |

---

## Data Regions

Two regions available (chosen at KB creation, cannot change):

- **Europe**
- **USA**

Data residency is locked to the chosen region.

---

## Public IP Addresses

If your firewall restricts network traffic, allowlist these IPs. Grouped by region, split into two categories:

- **Inbound** — addresses Agentic RAG receives requests on; allowlist if you restrict outbound traffic from your own infrastructure (e.g. calling the APIs).
- **Outbound** — source addresses Agentic RAG uses when connecting to your systems (webhooks, sync agents, other integrations); allowlist if you restrict inbound traffic to your infrastructure.

Machine-readable lists (may change over time — fetch periodically): [JSON](https://cdn.rag.progress.cloud/ip-addresses.json) | [YAML](https://cdn.rag.progress.cloud/ip-addresses.yaml).

| Region              | Inbound                                                     | Outbound                                                                        |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Europe (GCP)        | `34.111.1.187/32`, `136.68.112.29/32`                       | `35.204.65.155/32`, `34.91.38.151/32`, `35.204.139.129/32`, `35.204.108.221/32` |
| Australia (AWS)     | `54.253.224.44/32`, `3.25.20.9/32`, `52.64.202.159/32`      | `15.135.151.213/32`, `3.24.144.83/32`, `3.24.81.206/32`                         |
| Europe (AWS)        | `63.182.151.234/32`, `35.159.36.135/32`, `52.57.40.91/32`   | `63.179.23.139/32`, `3.78.13.149/32`, `3.66.123.24/32`                          |
| Israel (AWS)        | `51.84.176.167/32`, `16.164.50.185/32`, `16.164.85.69/32`   | `51.17.150.97/32`, `51.84.112.203/32`, `51.17.212.226/32`                       |
| United States (AWS) | `18.225.228.199/32`, `18.119.145.185/32`, `3.21.239.244/32` | `3.137.28.168/32`, `18.225.104.91/32`, `16.59.115.61/32`                        |

**Private connectivity:** For AWS-hosted regions, private access via AWS PrivateLink (endpoint service) is available instead of over the public internet — not self-service, contact your account manager.

Note: Australia/Israel/US-AWS here are infrastructure/processing zones for network egress purposes — distinct from the two **data-residency** regions (Europe / USA) a KB is created in (see Data Regions above).
