# Context Box — ShareFile Folder Connector Plan

## Goal

Let Context Box (the frictionless `/simple` KB experience) ingest files directly from a
Progress ShareFile folder, in addition to the existing drag-and-drop / file-picker upload,
reusing the ShareFile connector and folder-browsing UI that already exist in `libs/sync`.

---

## Background (what already exists — do not rebuild)

- `libs/sync` already ships a full ShareFile connector:
  - `SyncService.connectors.sharefile` (`libs/sync/src/lib/logic/sync.service.ts`) — OAuth
    provider `sharefile_oauth`, `cloud: true`.
  - `OAuthConnector` (`libs/sync/src/lib/logic/connectors/oauth.ts`) — for `sharefile`:
    `allowToSelectFolders = true`, `canSyncLastChanges = false` (confirmed with product: this
    does **not** block re-syncing — ShareFile syncs do pick up folder changes, just always as a
    full re-scan rather than an incremental delta; see "Open questions" below for the cost angle).
  - `CloudFolderComponent` (`libs/sync/src/lib/cloud-folder/`) — the folder browser modal/panel
    used by every cloud connector (Drive, OneDrive, SharePoint, ShareFile) to pick a single
    folder (`allowToSelectFolders` connectors only; no "sync whole account" mode exists anywhere
    in the codebase today).
  - `SyncService.getOAuthUrl()`, `addExternalConnection()`, `getExternalConnection()`,
    `getCloudFolders()`, `addCloudSync()`, `triggerSync()` — all the service methods needed to
    drive auth + folder browse + sync creation.
  - OAuth redirect resume flow via `PENDING_NEW_CONNECTOR` localStorage key, handled today in
    `apps/dashboard/src/app/app.component.ts` (`redirectToSyncCreation()`) and
    `AddSyncPageComponent.ngOnInit()`.
- Context Box today (`apps/dashboard/src/app/knowledge-box/simple/simple-kb/`):
  - `SimpleKBComponent` step 1 is a plain dropzone (`stfFileDrop` + hidden file input) —
    **no connector UI of any kind**.
  - `SimpleKBService.uploadFiles()` / `resources` / `resourceCounter` — existing upload +
    resource list plumbing that any newly-ingested ShareFile documents should flow through,
    so they show up in the same "processed / in queue / failed" counters and resource table
    Context Box already has.
  - No concept today of "this KB has a connected external source" — would be new state.

---

## Proposed UX flow

1. **Entry point — step 1 (empty state), next to the dropzone**
   - Add a secondary, low-emphasis action: **"Connect ShareFile"** (icon + text link/button,
     not competing visually with the primary "Upload files" CTA — upload stays primary since
     that's Context Box's core interaction model).
   - Only shown when no ShareFile connection exists yet for this KB.

2. **OAuth**
   - Clicking it kicks off `SyncService.getOAuthUrl('sharefile_oauth')`, same redirect pattern
     as the full Sync feature, but the return path is the Context Box route
     (`/:zone/:kb/simple`), not `/:zone/:kb/sync/add/...`.
   - Needs a Context-Box-specific `PENDING_NEW_CONNECTOR`-style resume handler (or an extension
     of the existing one) so `app.component.ts` knows to redirect back into `/simple` instead of
     the sync wizard.

3. **Folder picker (modal, not a full wizard page)**
   - On OAuth return, open a `SisModalService` modal wrapping `CloudFolderComponent` bound to the
     new `ExternalConnection`.
   - Single folder selection only (matches `allowToSelectFolders` behavior everywhere else in
     the app) — breadcrumb navigation, "Select this folder" confirm button.
   - Keep this a modal instead of the full multi-step `/sync/add` wizard — Context Box explicitly
     avoids exposing the general Sync feature's complexity (labels, filters, schedule, etc.).

4. **Confirm / create sync**
   - On folder confirm, call `SyncService.addCloudSync(...)` with sensible fixed defaults
     (no user-facing options form — no filters/labels/schedule UI, unlike the full Sync feature).
   - Immediately `triggerSync()` so ingestion starts right away.
   - Close the modal; newly-synced files should surface through the *same* resource list /
     counters (`resources`, `resourceCounter`) Context Box already renders — no separate
     "synced files" table.

5. **Persistent status once connected**
   - Show a small chip/indicator near the resource list header, e.g.
     `Synced from ShareFile: /Marketing/Assets`, with:
     - a manual "Sync now" action (maps to `SyncService.triggerSync()`),
     - a "Change folder" action (re-opens the `CloudFolderComponent` modal),
     - a "Disconnect" action (deletes the sync config; existing ingested resources stay in the KB).
   - This makes the external dependency visible instead of files silently reappearing/updating
     with no attribution.

---

## Scope boundaries (explicitly out of scope for v1)

- No support for connecting more than one ShareFile folder per Context Box.
- No exposure of the general sync options form (extension filters, glob patterns, date range,
  extract strategy) — Context Box gets fixed sensible defaults only.
- No other connectors (Drive, SharePoint, Dropbox, etc.) in Context Box for v1 — ShareFile only,
  per this request. The design should stay connector-agnostic enough that adding another later
  is mostly "pick from a small list" rather than a rebuild, but only ShareFile ships now.
- No changes to the full `/sync` feature itself — this is purely a Context-Box-side entry point
  reusing existing sync primitives.

---

## Implementation sketch (files likely touched)

- `apps/dashboard/src/app/knowledge-box/simple/simple-kb/simple-kb.component.ts/.html/.scss`
  - Add "Connect ShareFile" entry point + connected-folder status chip to step 1 / header area.
- `apps/dashboard/src/app/knowledge-box/simple/simple-kb/simple-kb.service.ts`
  - New methods/state: `connectShareFile()`, `getConnectedSource()`, `disconnectSource()`,
    wrapping the relevant `SyncService` calls; expose an observable for "is a source connected"
    + "last sync status" for the status chip.
- New small component: `simple-kb/sharefile-folder-modal/` (or reuse `CloudFolderComponent`
  directly inside a `SisModalService.openModal()` call) — thin wrapper providing the
  `ExternalConnection` input and emitting the selected folder.
- `apps/dashboard/src/app/app.component.ts`
  - Extend `redirectToSyncCreation()` (or add a parallel handler) to resume into `/simple`
    when the pending connector context indicates a Context Box origin, not a Sync-page origin.
- `libs/sync` — likely **no changes needed**; only consumed via its existing public API
  (`SyncService`, `CloudFolderComponent`, connector definitions). If a Context-Box-specific
  entry point needs a narrower/simplified variant of `addCloudSync` defaults, prefer adding an
  optional parameter to existing service methods over forking logic.
- i18n: new keys under the `simple.` namespace (e.g. `simple.connect-sharefile`,
  `simple.sharefile.connected-folder`, `simple.sharefile.sync-now`,
  `simple.sharefile.change-folder`, `simple.sharefile.disconnect`) added to
  `libs/common/src/assets/i18n/{en,es,fr,ca}.json`.

---

## Open questions to resolve before implementation

1. **Re-sync cost/cadence** — ShareFile always does a full folder re-scan (no incremental
   delta support). Do we auto-trigger on a schedule, or manual-only ("Sync now" button)?
   Recommend manual-only for v1 to avoid surprise reprocessing costs, revisit once usage data
   exists.
2. **Multi-folder / multi-source** — confirmed out of scope for v1, but confirm with product
   this is an acceptable long-term constraint or just a phased rollout decision.
3. **Permissions model** — does every KB collaborator see/trigger the ShareFile sync, or only
   the admin/contrib role that connected it originally? (`SimpleKBComponent` already
   distinguishes admin/contrib vs. reader via `SimplePageComponent.isReader`.)
4. **Disconnect behavior** — confirm whether disconnecting should leave previously-synced
   resources in the KB (recommended) or offer to delete them too.
