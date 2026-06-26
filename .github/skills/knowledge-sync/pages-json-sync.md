# Chat Advice — pages.json Build & Sync Guide

This document describes how to build and maintain the `pages.json` navigation document used
by the chat advice widget. The file lives at:

- `apps/dashboard/src/assets/chat/pages.json`

**Do not write pages.json entries from memory or routing tables alone.**  
The capabilities and summaries must be derived from the actual component code.
Every entry that is written without reading the component will be wrong.

---

## When to run this

- When a new route is added to `apps/dashboard`
- When the staleness check reports routing files newer than `pages.json`:
  ```bash
  find apps/dashboard/src/app -name "*routing*" -newer apps/dashboard/src/assets/chat/pages.json
  ```
- When `knowledge-sync` detects changes in route-related files

---

## Process for each page entry

For every route leaf that needs an entry (new or update), follow these four steps in order.

---

### Step 1 — Map route to component

Read the routing module(s) to find which component renders the route:

```bash
# Dashboard top-level routes
cat apps/dashboard/src/app/app-routing.module.ts

# Lazy-loaded modules referenced from the above
cat apps/dashboard/src/app/app-routing.lazy.ts

# Common lib modules (most feature routes live here)
cat libs/common/src/lib/account/account.module.ts
cat libs/common/src/lib/metrics/metrics.module.ts
cat libs/common/src/lib/tasks-automation/tasks-automation.routes.ts
cat libs/common/src/lib/search-widget/widgets/widgets.routes.ts
cat libs/common/src/lib/knowledge-box-settings/kv-schemas/kb-settings.module.ts
cat libs/common/src/lib/resources/resources.module.ts
cat libs/common/src/lib/upload/upload-routing.module.ts
```

The component class name is the value of the `component:` field for that route path.

---

### Step 2 — Find and read the component files

Search for the component class across the codebase:

```bash
grep -r "class ComponentName" apps/ libs/ --include="*.ts" -l
```

Then read **all three** of:

1. The **TypeScript** file (`.component.ts`) — signals, services injected, public methods
2. The **HTML template** (`.component.html`) — what is rendered, what actions are available
3. Any **SCSS** file is optional (skip unless layout is ambiguous)

For lazy-loaded sub-routes (e.g. `metrics/usage-analytics`), read the component that `path` maps
to inside the lazy module, not just the parent layout component.

---

### Step 3 — Resolve i18n strings

Component templates use `| translate` pipes and `'key' | translate` expressions.
**Do not use the raw key as text** — always resolve to the English string.

```bash
# Find the i18n JSON for common lib (most strings live here)
cat libs/common/src/assets/i18n/en.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
# flatten nested keys
def flatten(d, prefix=''):
    for k, v in d.items():
        full = f'{prefix}.{k}' if prefix else k
        if isinstance(v, dict): yield from flatten(v, full)
        else: yield full, v
for k, v in flatten(data):
    print(f'{k}: {v}')
" | grep "keyword"
```

App-level i18n files:

```bash
apps/dashboard/src/assets/i18n/en.json
libs/common/src/assets/i18n/en.json
```

Key patterns to extract from templates:

- Page `<h1>` or `.page-title` element → `title` field
- Page description element (`.page-description`) → `summary` base text
- `pa-button`, `(click)=` handlers, `<a>` links → actions the user can take
- Tab or nav items (`pa-tab`, `nsi-tab`) → sub-sections to mention in capabilities
- Displayed data tables, lists, cards → what information is shown

---

### Step 4 — Write the JSON entry

Add an entry to the `pages` array in `apps/dashboard/src/assets/chat/pages.json`:

```json
{
  "id": "<kebab-case-stable-identifier>",
  "route": "/at/:account/...",
  "title": "<resolved English page title>",
  "summary": "<1–3 sentences: PURPOSE first, then what user sees/achieves. Include user-facing terminology.>",
  "capabilities": ["<user task or goal — start with a verb, use natural language>", "<another capability>"]
}
```

**Rules for good entries:**

| Field          | Rule                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`           | Stable kebab-case. Prefix with context: `account-`, `kb-`, `agent-`. Never change after first use.                                                                                                                 |
| `route`        | Full path from root. Keep params as `:placeholders`.                                                                                                                                                               |
| `title`        | Exactly the resolved English string shown as the page heading.                                                                                                                                                     |
| `summary`      | **Purpose-first**: start with what the user _achieves_ here, not what UI elements exist. Include synonyms and user-facing terminology (e.g. "answer history", "invite team members", "cloud sync"). 1–3 sentences. |
| `capabilities` | User tasks and goals derived from the template — what the user _does_, not what button labels say.                                                                                                                 |

**Summary quality checklist — before writing:**

1. Does it say what the user _achieves_ (not just what's rendered)?
2. Does it include terminology a user might use when asking a question? (e.g. "answer history", "billing", "embed widget", "change language")
3. Would an AI reading only this entry understand when to recommend this page?
4. Is it free of purely technical descriptions ("this page lists X with Y controls")?

**Bad vs good summary examples:**

| ❌ Bad (UI mechanics)                                                                                      | ✅ Good (purpose + user terminology)                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "This page lists search activity logs with totals, column controls, filters, exports, and row drill-down." | "View the history of search queries and AI-generated answers for a Knowledge Box. Useful for auditing past interactions and reviewing specific answers." |
| "This page lists saved agent sessions with search, date filters, pagination, and delete actions."          | "Browse past conversation sessions with a Retrieval Agent. Each session contains the full history of questions and AI-generated answers."                |
| "This page manages the external sources available to the current retrieval agent."                         | "Manage the knowledge sources (data connections) that the agent uses when answering questions."                                                          |

---

## Example: Deriving an entry from source

**Route:** `/at/:account/manage/home` → `AccountHomeComponent`

**Read template** (`libs/common/src/lib/account/account-home/account-home.component.html`):

- `{{ 'account.consumption' | translate }}` → resolve → `"Consumption"`
- `{{ 'account.consumption-description' | translate }}` → `"Consumption based on your activity."`
- `<app-nuclia-tokens>` component → shows token usage widget with period selector
- `@for (kb of kbs)` → list of KBs with click-to-navigate
- `totalQueries` → shows counts for last 30 days, last 12 months, since creation

**Correct entry:**

```json
{
  "id": "account-home",
  "route": "/at/:account/manage/home",
  "title": "Consumption",
  "summary": "Overview of your account's consumption: token usage and total query counts across all Knowledge Boxes.",
  "capabilities": [
    "View token consumption based on activity, with period selector",
    "See the list of Knowledge Boxes and navigate directly to one",
    "View total query counts for the last 30 days, 12 months, and since account creation"
  ]
}
```

**What was wrong in the manually written version:**

```json
{
  "id": "account-home",
  "route": "/at/:account/manage/home",
  "title": "Account Home",
  "summary": "Overview of your account...",
  "capabilities": ["Create a new Knowledge Box", "Switch between KBs and Agents"]
}
```

---

## Batch update workflow

When many pages need updating at once (e.g. after a large routing change):

```bash
# 1. List all route → component pairs for dashboard
grep -A2 "path:" apps/dashboard/src/app/app-routing.module.ts | grep -v "^--$"

# 2. For lazy-loaded entries, list their children too
grep -A2 "path:" libs/common/src/lib/metrics/metrics.module.ts

# 3. For each component that changed or is new, read its template:
find libs/common/src/lib/<feature> -name "*.component.html" | xargs grep -l "page-title\|page-description\|pa-button"

# 4. Resolve the translate keys in bulk:
grep -oh "'[a-z._-]*' | translate" libs/common/src/lib/<feature>/*.html \
  | sed "s/' | translate//" | sed "s/'//" \
  | while read key; do
      val=$(python3 -c "import json; d=json.load(open('libs/common/src/assets/i18n/en.json')); print(d.get('$key','NOT FOUND'))")
      echo "$key → $val"
    done
```

---

## Staleness map (addition to the knowledge-sync staleness table)

| Changed path                                        | Documentation to update                                                                | Priority |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| `apps/dashboard/src/app/*routing*`                  | `apps/dashboard/src/assets/chat/pages.json`                                            | HIGH     |
| `libs/common/src/lib/<feature>/**/*.component.html` | Check if feature maps to a pages.json entry; update `summary` and `capabilities` if so | MEDIUM   |
| `libs/common/src/lib/<feature>/**/*.component.ts`   | Same as above — check for new public actions                                           | LOW      |

---

## Quick reference: route → component → file location

| Route segment                              | Component                                       | File                                             |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------ |
| `/at/:account/manage/home`                 | `AccountHomeComponent`                          | `libs/common/src/lib/account/account-home/`      |
| `/at/:account/manage/settings`             | `AccountManageComponent`                        | `libs/common/src/lib/account/account-manage/`    |
| `/at/:account/manage/kbs`                  | `AccountKbsComponent`                           | `libs/common/src/lib/account/account-kbs/`       |
| `/at/:account/manage/arag`                 | `AccountAragComponent`                          | `libs/common/src/lib/account/account-arag/`      |
| `/at/:account/manage/users`                | `AccountUsersComponent`                         | `libs/common/src/lib/account/account-users/`     |
| `/at/:account/manage/models`               | `AccountModelsComponent`                        | `libs/common/src/lib/account/account-models/`    |
| `/at/:account/manage/nua`                  | `AccountNUAComponent`                           | `libs/common/src/lib/account/account-nua/`       |
| `/at/:account/manage/billing`              | `BillingComponent`                              | `libs/common/src/lib/account/billing/`           |
| `/:zone/:kb` (home)                        | `KnowledgeBoxHomeComponent`                     | `apps/dashboard/src/app/knowledge-box/`          |
| `/:zone/:kb/upload`                        | `UploadDataComponent`                           | `libs/common/src/lib/upload/`                    |
| `/:zone/:kb/resources`                     | `ResourcesComponent`                            | `libs/common/src/lib/resources/`                 |
| `/:zone/:kb/search`                        | `SearchPageComponent`                           | `libs/common/src/lib/search/`                    |
| `/:zone/:kb/sync`                          | (SYNC_ROUTES)                                   | `libs/sync/src/lib/`                             |
| `/:zone/:kb/entities`                      | (EntitiesModule)                                | `libs/common/src/lib/entities/`                  |
| `/:zone/:kb/label-sets`                    | (LabelSetsModule)                               | `libs/core/src/lib/label-sets/`                  |
| `/:zone/:kb/ai-models`                     | `AiModelsComponent`                             | `libs/common/src/lib/ai-models/`                 |
| `/:zone/:kb/widgets`                       | `WidgetsComponent`                              | `libs/common/src/lib/search-widget/widgets/`     |
| `/:zone/:kb/manage/general`                | `KnowledgeBoxSettingsComponent`                 | `libs/common/src/lib/knowledge-box-settings/`    |
| `/:zone/:kb/metrics/usage-analytics`       | `UsageAnalyticsPageComponent`                   | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/metrics/search-activity`       | `SearchActivityPageComponent`                   | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/metrics/resource-activity`     | `ResourceActivityPageComponent`                 | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/metrics/tokens-and-time-usage` | `CostTokenUsagePageComponent`                   | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/metrics/remi-analytics`        | `RemiAnalyticsPageComponent`                    | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/metrics/user-feedback`         | `UserFeedbackPageComponent`                     | `libs/common/src/lib/metrics/`                   |
| `/:zone/:kb/rag-lab`                       | `RagLabPageComponent`                           | `libs/common/src/lib/rag-lab/`                   |
| `/:zone/:kb/tasks`                         | `TasksAutomationComponent`                      | `libs/common/src/lib/tasks-automation/`          |
| `/:zone/arag/:agent/workflows`             | `WorkflowsComponent` / `WorkflowsListComponent` | `libs/common/src/lib/retrieval-agent/workflows/` |
| `/:zone/arag/:agent/sessions`              | `SessionsComponent`                             | `libs/common/src/lib/retrieval-agent/sessions/`  |
| `/:zone/arag/:agent/sources`               | `DriversPageComponent`                          | `libs/common/src/lib/retrieval-agent/drivers/`   |
| `/:zone/arag/:agent/search`                | `SearchPageComponent`                           | `libs/common/src/lib/search/`                    |
| `/:zone/arag/:agent/widgets`               | (WIDGETS_ROUTES)                                | `libs/common/src/lib/search-widget/widgets/`     |
| `/:zone/arag/:agent/manage`                | `KnowledgeBoxSettingsComponent`                 | `libs/common/src/lib/knowledge-box-settings/`    |
| `/:zone/arag/:agent/activity`              | `AgentActivityComponent`                        | `libs/common/src/lib/retrieval-agent/activity/`  |
| `/:zone/arag/:agent/ai-models`             | `AiModelsComponent`                             | `libs/common/src/lib/ai-models/`                 |
