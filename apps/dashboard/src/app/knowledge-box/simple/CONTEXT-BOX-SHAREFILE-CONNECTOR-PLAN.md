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

1. **Entry point — two places, not one**
   - **Empty state (step 1):** the primary "Upload files" button becomes a **split
     button / dropdown** — default click action stays "Upload files"; the dropdown chevron
     reveals **"Connect ShareFile"** as a secondary option. (Matches `PaDropdownModule`, already
     used elsewhere in `apps/dashboard`/`libs/common` for this exact pattern — no new primitive
     needed.) Keeps upload as the dominant, one-click action while making the connector
     discoverable without adding a second competing full-size button.
   - **Populated state (step 3, resources already exist):** the same "Connect ShareFile" action
     must also be reachable from here — a first-time user may add a handful of files manually
     before deciding to connect an external folder later. Today the step-3 footer only has
     "Upload files" and "Get the MCP URL" (`simple-kb.component.html`); add "Connect ShareFile"
     there too (as a footer action, or folded into the same split-button/dropdown pattern as
     step 1 for consistency). Do not make it empty-state-only.
   - Once a ShareFile folder is connected, this entry point is replaced by the connected-source
     status chip described below (no point offering "Connect ShareFile" again while already
     connected — see "Scope boundaries," single-folder-per-KB for v1).

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
     - a **"Disconnect ShareFile"** action — see "Disconnect vs. delete" below for why this needs
       its own explicit label rather than reusing the resource table's "Delete" button/icon.
   - This makes the external dependency visible instead of files silently reappearing/updating
     with no attribution.

6. **Source identifier in the resource table ("Type" column)**
   - `ResourceTableComponent` (`apps/dashboard/src/app/knowledge-box/simple/resource-table/`)
     currently renders the "Type" column purely from file type: `row.icon | mimeIcon` (a
     `pa-icon`) plus the `row.extension` text (e.g. `.pdf`). This only communicates *file
     format*, not *where the file came from*.
   - Add a small ShareFile badge/icon next to the existing mime icon for any row whose resource
     originated from the ShareFile sync, so a user scanning the table can tell "this one came
     from ShareFile" at a glance — the same way they can already tell "this one's a PDF."
   - Technical hook: `Origin.source_id` (`libs/sdk-core/src/lib/db/resource/resource.models.ts`)
     is already set to the originating sync config id for resources created via a sync (used
     today for attribution in `libs/common/src/lib/resources/resource-list/resource-list.service.ts`
     and the metrics/activity pages). `TableRow` (`resource-table.component.ts`) would need a new
     `sourceConnector?: 'sharefile'` field derived by comparing `resource.origin?.source_id`
     against the KB's connected ShareFile sync id (held in the new `SimpleKBService` connected-source
     state from item 5 above). No backend change needed — this is purely a frontend
     lookup/annotation using data that already exists on the resource.
   - Manually-uploaded files and files from any other future connector simply don't get this
     badge, so it degrades gracefully if/when more connectors are added later.

7. **Disconnect vs. delete — distinct language required**
   - Concern raised: reusing the existing per-resource "Delete" button/icon
     (`resource-table.component.html`, `deleteResource()`) for the "disconnect this ShareFile
     folder" action would be misleading — a user could reasonably read "Delete" as "delete my
     ShareFile account/files," not "stop syncing this folder into Context Box." These are
     different actions with different blast radii (per-file removal vs. severing an external
     connection) and must not share the same icon/label.
   - Resolution: the disconnect action lives **only** on the connected-source status chip (item 5),
     labeled explicitly **"Disconnect ShareFile"** (not "Delete," not a bare trash icon) and,
     per the existing repo pattern (`SisModalService.openConfirm(...)`, see
     `sync-details-page.component.ts` → `deleteSync()`), should confirm via a modal whose copy
     makes the effect explicit, e.g.: *"This will stop syncing files from ShareFile. Files
     already added to this Content Box will not be deleted."* — mirroring the "Open questions"
     item below on whether previously-synced resources are removed (recommended: they are not).
   - The per-resource row "Delete" action in the table is unaffected and continues to only
     delete that individual resource, regardless of its source.

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
  - Convert the step-1 "Upload files" button into a split button / `PaDropdownModule` menu
    exposing "Connect ShareFile" as a secondary option.
  - Add the same "Connect ShareFile" entry point to the step-3 footer (alongside "Upload files"
    / "Get the MCP URL"), so it's reachable after resources already exist, not just empty state.
  - Add the connected-folder status chip (sync now / change folder / disconnect) near the
    resource list header once a ShareFile source is connected; hide both entry points while
    connected (v1 is single-folder-per-KB).
- `apps/dashboard/src/app/knowledge-box/simple/simple-kb/simple-kb.service.ts`
  - New methods/state: `connectShareFile()`, `getConnectedSource()`, `disconnectSource()`,
    wrapping the relevant `SyncService` calls; expose an observable for "is a source connected"
    + "last sync status" for the status chip, plus the connected sync's id (needed by the
    resource-table badge lookup below).
- New small component: `simple-kb/sharefile-folder-modal/` (or reuse `CloudFolderComponent`
  directly inside a `SisModalService.openModal()` call) — thin wrapper providing the
  `ExternalConnection` input and emitting the selected folder.
- `apps/dashboard/src/app/knowledge-box/simple/resource-table/resource-table.component.ts/.html`
  - Extend `TableRow` with a `sourceConnector?: 'sharefile'` field, computed by comparing each
    resource's `origin?.source_id` against the KB's connected ShareFile sync id
    (`SimpleKBService`).
  - In the "Type" column template, render a small ShareFile badge/icon alongside the existing
    `row.icon | mimeIcon` icon when `row.sourceConnector === 'sharefile'` — same visual pattern
    as the file-type icon, just a second small icon/badge, not a replacement.
  - No change to the existing per-row "Delete" button/behavior — it stays file-scoped only.
- `apps/dashboard/src/app/app.component.ts`
  - Extend `redirectToSyncCreation()` (or add a parallel handler) to resume into `/simple`
    when the pending connector context indicates a Context Box origin, not a Sync-page origin.
- `libs/sync` — likely **no changes needed**; only consumed via its existing public API
  (`SyncService`, `CloudFolderComponent`, connector definitions). If a Context-Box-specific
  entry point needs a narrower/simplified variant of `addCloudSync` defaults, prefer adding an
  optional parameter to existing service methods over forking logic.
- i18n: new keys under the `simple.` namespace (e.g. `simple.connect-sharefile`,
  `simple.sharefile.connected-folder`, `simple.sharefile.sync-now`,
  `simple.sharefile.change-folder`, `simple.sharefile.disconnect-action`,
  `simple.sharefile.disconnect-confirm-title`, `simple.sharefile.disconnect-confirm-description`,
  `simple.column.type.sharefile-badge-tooltip`) added to
  `libs/common/src/assets/i18n/{en,es,fr,ca}.json`. Note the deliberate `disconnect-action`
  naming (not reusing `simple.delete`) to keep the two actions visually and linguistically
  distinct in the codebase as well as the UI — see "Disconnect vs. delete" above.

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
