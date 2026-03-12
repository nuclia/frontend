# AGENTS.md — `libs/sync`

## Library Overview

`libs/sync` provides a complete UI + service layer for synchronising external data sources into a Nuclia KB. Supports two modes:
- **Desktop/Server** — locally-running sync-agent HTTP server (default `http://localhost:8090`)
- **Cloud** — Nuclia cloud sync API, gated by `FeaturesService.unstable.cloudSyncService`

Handles: connector gallery, create/edit/enable/disable/trigger/delete sync configs, folder browser, activity logs, server-status polling.

**Path alias:** `@nuclia/sync` · **Prefix:** `nsy` · **Nx project:** `sync`

---

## Project Structure

```
libs/sync/src/lib/
├── sync-root.component.ts   # Router shell; polls sync-server status (5 s / 60 s)
├── sync.routes.ts           # SYNC_ROUTES — lazy-loaded route tree
├── utils.ts                 # getURLParams() — OAuth redirect hash parsing
├── home-page/               # Connector gallery + sync list table
├── add-sync-page/           # Multi-step wizard: auth → configure → folders → save
├── sync-details-page/       # View/edit existing sync; trigger, delete; activity log
│   └── sync-settings/       # Settings panel + logs-modal (paginated cloud jobs)
├── cloud-folder/            # Folder browser for cloud connectors (SharePoint, etc.)
├── configuration-form/      # Shared form: name, labels, filters, connector-specific fields
└── logic/
    ├── sync.service.ts      # SyncService (providedIn: 'root')
    ├── models.ts            # All domain interfaces and enums
    └── connectors/
        ├── oauth.ts         # OAuthConnector (GDrive, OneDrive, ShareFile, Dropbox)
        ├── sharepoint.ts    # SharepointImpl extends OAuthConnector (certificate auth)
        ├── folder.ts        # FolderConnector (local path)
        ├── sitemap.ts       # SitemapConnector (sitemap.xml crawl)
        ├── rss.ts           # RSSConnector (RSS feed crawl)
        └── sitefinity.ts    # SitefinityConnector (feature-flagged)
```

---

## Public API

```ts
export * from './lib/home-page';   // HomePageComponent, ConnectorComponent
export * from './lib/logic';        // SyncService + all models/interfaces/enums
export * from './lib/utils';        // getURLParams()
// SYNC_ROUTES is NOT exported from barrel; apps import directly for lazy loading
```

---

## Route Tree (`SYNC_ROUTES`)

```
/                         → SyncRootComponent (server polling shell)
  /                       → HomePageComponent
  /add/:connector         → AddSyncPageComponent (new sync)
  /add/:connector/:syncId → AddSyncPageComponent (post-OAuth resume)
  /:syncId                → SyncDetailsPageComponent (view)
  /:syncId/edit           → SyncDetailsPageComponent (edit)
```

Apps use: `loadChildren: () => import('../../../../libs/sync/src/lib/sync.routes').then(m => m.SYNC_ROUTES)`

---

## `SyncService` State (BehaviorSubjects)

| Subject | Description |
|---|---|
| `_useCloudSync` | Whether to use cloud API vs desktop agent |
| `_syncCache` | Client-side cache of fetched sync entities |
| `_cacheUpdated` | Bump signal — triggers re-fetch in subscribed components |
| `connectors$` | Observable list of available connectors (filters deprecated, feature-flagged) |

**localStorage keys** (non-obvious — must stay in sync across files):
- `PENDING_NEW_CONNECTOR` — used by both `libs/sync` and `apps/dashboard/app.component` to resume OAuth flows after redirect. Changing this key requires updating both locations.

---

## `IConnector` Interface (minimum impl)

Each connector must implement:
- `getParameters()` — returns `ConnectorParameters` for the config form
- `handleOAuth(params)` → `Observable<void>` — handles OAuth redirect
- `authenticate(params)` → `Observable<ExternalConnectionCredentials>` — returns credentials
- `browse(options)` → `Observable<SearchResults>` — folder browser (cloud connectors)

---

## How Apps Use This Library

```ts
// apps/dashboard and apps/nucliadb-admin
{ path: 'sync', loadChildren: () => import('../../../../libs/sync/src/lib/sync.routes').then(m => m.SYNC_ROUTES) }
```

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
3. **Cloud vs desktop branching** — every service method checks `this._useCloudSync.getValue()`. When adding new operations, always handle both paths.
4. **Deprecated connectors** — `connectorsObs` filters `deprecated: true` from display; existing syncs continue to work.
5. **Feature-flagged connector** — `sitefinity` filtered unless `features.unstable.sitefinityConnector`.
6. **`PENDING_NEW_CONNECTOR` localStorage key** — stays in sync with `apps/dashboard/app.component` to resume OAuth flows after redirect.
7. **Server polling** — `SyncRootComponent` uses dual-rate timer: 5 s when server down, skips 12 ticks when up (effectively ~60 s). Logic resets `count` on each actual poll.
8. **Standalone components only** — no NgModules in this library.
9. **Translation key namespace** — all i18n keys prefixed `sync.` (e.g., `sync.add-page.title`).
10. **Sync ID generation** — `{kbId}-{slugified-title}-{random5chars}`, finalised only when `addSync`/`addCloudSync` is called.
