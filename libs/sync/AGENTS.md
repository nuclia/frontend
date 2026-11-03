# AGENTS.md — `libs/sync`

## Library Overview

`libs/sync` provides a complete UI + service layer for synchronising external data sources into a Nuclia KB. Supports two modes:

- **Desktop/Server** — locally-running sync-agent HTTP server (default `http://localhost:8090`)
- **Cloud** — Nuclia cloud sync API, gated by `FeaturesService.unstable.cloudSyncService`

Handles: connector gallery, create/edit/enable/disable/trigger/delete sync configs, folder browser, activity logs, server-status polling, and the "Connect" page for agentic sources (Knowledge Box, MCP server, Perplexity, Gemini Google Search, Synchronization) stored through the SDK's `kb.*AgenticSource` methods.

**Path alias:** `@nuclia/sync` · **Prefix:** `nsy` · **Nx project:** `sync`

---

## Project Structure

```
libs/sync/src/lib/
├── sync-root.component.ts   # Router shell; polls sync-server status (5 s / 60 s)
├── sync.routes.ts           # SYNC_ROUTES — lazy-loaded route tree
├── utils.ts                 # getURLParams() — OAuth redirect hash parsing
├── home-page/               # HomePageComponent is only a <router-outlet> wrapper
│   ├── synchronize/         # Default child: sync-server setup, connector tiles, sync list table
│   ├── connect/             # `/connect` child: agentic source groups (local / mcp / external), driven by SourcesService
│   └── connector/           # ConnectorComponent (`nsy-connector`) — reusable tile
├── add-source-page/         # Create/edit an agentic source (AgenticSource via SourcesService); one sub-component per type
│                            #   (nucliadb, sync, mcp, perplexity, google) extending SourceFormDirective (ControlValueAccessor)
├── add-sync-page/           # Multi-step wizard: auth → configure → folders → save
├── sync-details-page/       # View/edit existing sync; trigger, delete; activity log
│   └── sync-settings/       # Settings panel + logs-modal (paginated cloud jobs)
├── cloud-folder/            # Folder browser for cloud connectors (SharePoint, etc.)
├── configuration-form/      # Shared form: name, labels, filters, connector-specific fields
├── sync-options-form/       # Reusable sync options panel: extension filters, glob patterns, date range, labels, extract strategy
│   ├── sync-options-form.component.ts  # SyncOptionsFormComponent (standalone)
│   └── sync-options.model.ts           # SyncOptions interface, CloudSyncOptionsPayload, getCloudSyncOptionsPayload()
└── logic/
    ├── sync.service.ts      # SyncService (providedIn: 'root')
    ├── sources.service.ts   # SourcesService — agentic source definitions (feature-flagged per type) + CRUD via the current KB
    ├── models.ts            # All domain interfaces and enums
    └── connectors/
        ├── oauth.ts         # OAuthConnector (GDrive, OneDrive, ShareFile, Dropbox)
        ├── sharepoint.ts    # SharepointImpl extends OAuthConnector (certificate auth)
        ├── folder.ts        # FolderConnector (local path)
        ├── sitemap.ts       # SitemapConnector (sitemap.xml crawl)
        ├── rss.ts           # RSSConnector (RSS feed crawl)
        ├── s3.ts            # S3Impl (single class; "AWS S3 Assume Role" is the same connector, distinguished by apikey_provider)
        ├── sitefinity.ts    # SitefinityConnector (feature-flagged)
        └── confluence.ts    # ConfluenceConnector (deprecated: true — filtered from display, kept for existing syncs)
```

---

## Public API

```ts
export * from './lib/cloud-folder/cloud-folder.component'; // CloudFolderComponent (used by dashboard context-box)
export * from './lib/home-page'; // HomePageComponent, ConnectorComponent
export * from './lib/logic'; // SyncService + all models/interfaces/enums
export * from './lib/utils'; // getURLParams()
export * from './lib/sync-options-form'; // SyncOptionsFormComponent, SyncOptions, CloudSyncOptionsPayload, getCloudSyncOptionsPayload
export * from './lib/sync.routes'; // SYNC_ROUTES
```

---

## Route Tree (`SYNC_ROUTES`)

```
/                         → SyncRootComponent (server polling shell)
  /                       → HomePageComponent (router-outlet only)
    /                     → SynchronizeComponent
    /connect              → ConnectComponent
  /add/:connector         → AddSyncPageComponent (new sync)
  /add/:connector/:syncId → AddSyncPageComponent (post-OAuth resume)
  /:syncId                → SyncDetailsPageComponent (view)
  /:syncId/edit           → SyncDetailsPageComponent (edit)
  /add-source/:type       → AddSourcePageComponent (new agentic source)
  /source/:sourceId       → AddSourcePageComponent (edit agentic source)
```

Mounted under the KB's `data/sync` path by `libs/common` (`data.routes.ts` lazy-loads `SYNC_ROUTES` through `sync-lazy.ts`). `add-source-page` returns to `../../connect` after save/cancel.

---

## `SyncService` State (BehaviorSubjects)

| Subject         | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `_useCloudSync` | Whether to use cloud API vs desktop agent                                     |
| `_syncCache`    | Client-side cache of fetched sync entities                                    |
| `_cacheUpdated` | Bump signal — triggers re-fetch in subscribed components                      |
| `connectorsObs` | Observable list of available connectors (filters deprecated, feature-flagged) |

**localStorage keys** (non-obvious — must stay in sync across files):

- `PENDING_NEW_CONNECTOR` — used by both `libs/sync` and `apps/dashboard/app.component` to resume OAuth flows after redirect. Changing this key requires updating both locations.

---

## `IConnector` Interface (minimum impl)

Each connector class in `logic/connectors/` implements:

- `getParametersSections()` → `Observable<Section[]>` — form sections/fields for the config UI
- `getParametersValues()` → `ConnectorParameters` — current parameter values (e.g. read from localStorage)
- `getStaticFolders()` → `SyncItem[]` — static root folders, if any (most connectors return `[]`)
- `handleParameters?(params)` — optional: persist parameters after form submit (e.g. store an OAuth/API token)
- `getLink?(resource)` → `Observable<{ uri; extra_headers }>` — optional: resolve a direct link to a synced resource

OAuth handling and cloud-folder browsing are **not** part of `IConnector` — they live on `SyncService`
(`addExternalConnection()`, `getCloudFolders()`) and on `AddSyncPageComponent` / `CloudFolderComponent`.

---

## How Apps Use This Library

`libs/common` data routes mount `SYNC_ROUTES` (path `sync`); `apps/dashboard` context-box also imports `SyncService`, `ISyncEntity` and `CloudFolderComponent` directly (ShareFile folder selection).

`SyncService` is `providedIn: 'root'` — no module registration. i18n: `assets/i18n/` is copied to apps during build; register the path in `TranslateLoader` config.

---

## Run Commands

```bash
nx test sync
nx lint sync
# No build target — consumed as TypeScript source via @nuclia/sync alias
```

---

## Important Conventions

1. **Connector ID** — canonical key for all lookups, cache keys, route params. `connector.name` in `ISyncEntity` stores this ID (e.g., `'gdrive'`, `'sharepoint'`).
2. **`cacheUpdated` as invalidation signal** — subscribe to `cacheUpdated` before calling `getSync`/`getSyncsForKB`:
   ```ts
   combineLatest([this.syncService.cacheUpdated, ...])
     .pipe(switchMap(() => this.syncService.getSyncsForKB(...)))
   ```
3. **Cloud vs desktop branching** — most service methods check `this._useCloudSync.getValue()` and branch internally. **Exception:** `updateSync()` is desktop-only (HTTP patch to the sync-agent); cloud updates go through the separate `updateCloudSync(syncId, updates, originalSync)` method — callers (e.g. `sync-details-page`) must branch on `sync.isCloud` themselves to pick the right one. `updateCloudSync`'s private `buildCloudPatchPayload()` explicitly sends `null` for fields that were cleared (empty array/undefined) but had a value in `originalSync` — omitting a field is not the same as clearing it.
4. **Deprecated connectors** — `connectorsObs` filters `deprecated: true` from display; existing syncs continue to work.
5. **Feature flags** — `sitefinity` is filtered from `connectorsObs` unless `unstable.sitefinityConnector`. In `SynchronizeComponent`, `sharepoint` and `onedrive-me` need `unstable.cloudSyncSharepoint`, and `s3` is shown only when the KB zone's `cloud_provider` is `AWS`. Agentic source types in `SourcesService` are gated by `unstable.syncSource` / `mcpSource` / `perplexitySource` / `googleSource` (`nucliadb` is always available). Connectors with `cloud: true` list under the Cloud sync option; the rest under desktop/server.
6. **S3 Assume Role connector** — there is a single `S3Impl` class (`s3.ts`); the "assume role" variant is the same connector registered with `apikey_provider: 'aws_s3_assume_role'`, not a separate implementation. `configuration-form.component.ts` shows an IAM policy modal (`AssumeRoleModalComponent`, imported from `@flaps/core`) to guide users through the bucket policy setup when that provider is used.
7. **`PENDING_NEW_CONNECTOR` localStorage key** — stays in sync with `apps/dashboard/app.component` to resume OAuth flows after redirect.
8. **Server polling** — `SyncRootComponent` uses dual-rate timer: 5 s when server down, skips 12 ticks when up (effectively ~60 s). Logic resets `count` on each actual poll.
9. **Standalone components only** — no NgModules in this library (standalone is the Angular default; components carry no `standalone` flag). Templates import `TranslatePipe`, not `TranslateModule`.
10. **Translation key namespace** — all i18n keys prefixed `sync.` (e.g., `sync.add-page.title`).
11. **Sync ID generation** — `{kbId}-{slugified-title}-{random5chars}`, finalised only when `addSync`/`addCloudSync` is called.
12. **Synchronize/Connect navigation lives outside this lib** — `HomePageComponent` has no tabs; links to `sync/connect` come from `libs/common` (`data-page` and the agentic search configuration).
13. **Edit-folders menu entry is desktop-only** — in the sync list menu, "Edit folders" shows only when `connector.allowToSelectFolders` and cloud sync is off.
14. **OAuth folder section** — `OAuthConnector` (`oauth.ts`) renders optional `drive_name` (display) and required `drive_id` text fields; `allowToSelectFolders` is true for `gdrive`, `sharefile`, `dropbox` (and `onedrive-me`), and `canSyncLastChanges` is false for `sharefile`.
15. **Shared imports** — `ColoredLabel`, `AssumeRoleModalComponent`, `HintComponent`, `ResourceHandlingBannerComponent` and `ExtractionSelectComponent` come from `@flaps/core` (not `@flaps/common`).
