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
  - `CloudFolderComponent` (`libs/sync/src/lib/cloud-folder/`) — the breadcrumb-style folder
    browser panel used by every cloud connector (Drive, OneDrive, SharePoint, ShareFile) to pick
    a single folder (`allowToSelectFolders` connectors only; no "sync whole account" mode exists
    anywhere in the codebase today). This is the **tested, proven pattern Context Box will reuse
    for v1** — see "Folder picker" below.
  - `nsi-folder-tree` (`libs/sistema/src/lib/folder-tree/`) — design-system recursive,
    checkbox-driven folder tree (expand/collapse nested folders in place, indeterminate parent
    states). Considered as a richer alternative but **deferred past v1** — see "Future
    enhancement" note under "Folder picker" below.
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

1. **Entry point — single button, always opens a source-choice dropdown**
   - The button stays exactly as it is today, labeled **"Upload files"** — no split button, no
     separate default action. Clicking it **always** opens a dropdown/menu
     (`PaDropdownModule`, already used elsewhere in the app) with two choices:
     - **"From your computer"** — triggers the existing file-picker/drop behavior
       (`fileInput.click()` today).
     - **"From ShareFile"** — kicks off the OAuth + folder-picker flow below.
   - This applies everywhere the upload button exists today: the step-1 empty-state button and
     the step-3 footer "Upload files" button (`simple-kb.component.html`) both become this same
     dropdown — one consistent control, no new/second button anywhere.
   - Once a ShareFile folder is connected, "From ShareFile" in the dropdown is disabled/hidden
     (v1 is single-folder-per-KB — see "Scope boundaries").

2. **OAuth**
   - Choosing "From ShareFile" kicks off `SyncService.getOAuthUrl('sharefile_oauth')`, same
     redirect pattern as the full Sync feature, but the return path is the Context Box route
     (`/:zone/:kb/simple`), not `/:zone/:kb/sync/add/...`.
   - Needs a Context-Box-specific `PENDING_NEW_CONNECTOR`-style resume handler (or an extension
     of the existing one) so `app.component.ts` knows to redirect back into `/simple` instead of
     the sync wizard.

3. **Folder picker (modal, not a full wizard page)**
   - On OAuth return, open a `SisModalService` modal wrapping `CloudFolderComponent` bound to the
     new `ExternalConnection` — the same proven, lazy-loading, breadcrumb-navigation folder
     browser every other cloud connector already uses. No new component logic required beyond a
     thin modal wrapper (`ExternalConnection` in, selected folder out).
   - Single folder selection only (matches `allowToSelectFolders` behavior everywhere else in
     the app) — breadcrumb navigation, "Select this folder" confirm button.
   - Keep this a modal instead of the full multi-step `/sync/add` wizard — Context Box explicitly
     avoids exposing the general Sync feature's complexity (labels, filters, schedule, etc.).
   - **Future enhancement (not v1):** swap in `nsi-folder-tree`
     (`libs/sistema/src/lib/folder-tree/`) for a nicer in-place expand/collapse nested view once
     there's a real need for it. That component doesn't support lazy per-level loading today
     (needs the whole tree in memory) and is natively multi-select, so it would need (a) a
     lazy-loading enhancement (`expandRequest` output + per-node loading state, reusing the
     existing `getCloudFolders()` API) and (b) a single-select override in the host. Revisit if
     ShareFile trees prove awkward to browse breadcrumb-style, or if multi-folder selection
     becomes a real requirement.

4. **Confirm / create sync**
   - On folder confirm, call `SyncService.addCloudSync(...)` with sensible fixed defaults
     (no user-facing options form — no filters/labels/schedule UI, unlike the full Sync feature).
   - Immediately `triggerSync()` so ingestion starts right away.
   - Close the modal; newly-synced files, **plus the connected folder itself**, surface through
     the *same* resource list (`resources`, `resourceCounter`) Context Box already renders — see
     next item. No separate status chip, banner, or dedicated area anywhere in the UI.

5. **Connected folder shown as a resource-table entry — no separate status area**
   - Per explicit direction: do **not** add a standalone chip/banner/status area for "you're
     connected to ShareFile." Instead, the connected folder itself appears as **one row in the
     existing resource table** (`ResourceTableComponent`), styled/labeled like a resource (e.g.
     File column shows the ShareFile folder path, Type column shows the ShareFile badge/icon
     from item 6 below instead of a mime icon).
   - That row's "Delete" action (same column/button every other row uses — no new button, no new
     icon, no separate label) is how the user disconnects it. Clicking it opens the **same**
     confirm modal pattern already used for per-resource deletion
     (`SisModalService.openConfirm(...)`), but with copy specific to this row that explains nothing
     is deleted, only disconnected — see item 7.
   - No "Sync now" / "Change folder" actions in v1 — keeps this to exactly what was asked for:
     the connection behaves like any other row in the table, with Confirm/Cancel on removal.

6. **Source identifier in the resource table ("Type" column)**
   - `ResourceTableComponent` (`apps/dashboard/src/app/knowledge-box/simple/resource-table/`)
     currently renders the "Type" column purely from file type: `row.icon | mimeIcon` (a
     `pa-icon`) plus the `row.extension` text (e.g. `.pdf`). This only communicates *file
     format*, not *where the file came from*.
   - Add a small ShareFile badge/icon next to the existing mime icon for any row whose resource
     originated from the ShareFile sync, so a user scanning the table can tell "this one came
     from ShareFile" at a glance — the same way they can already tell "this one's a PDF." The
     synthetic "connected folder" row from item 5 uses this same badge as its only Type icon
     (no mime icon, since it isn't a file).
   - Technical hook: `Origin.source_id` (`libs/sdk-core/src/lib/db/resource/resource.models.ts`)
     is already set to the originating sync config id for resources created via a sync (used
     today for attribution in `libs/common/src/lib/resources/resource-list/resource-list.service.ts`
     and the metrics/activity pages). `TableRow` (`resource-table.component.ts`) would need a new
     `sourceConnector?: 'sharefile'` field derived by comparing `resource.origin?.source_id`
     against the KB's connected ShareFile sync id (held in `SimpleKBService`). No backend change
     needed — this is purely a frontend lookup/annotation using data that already exists.
   - Manually-uploaded files and files from any other future connector simply don't get this
     badge, so it degrades gracefully if/when more connectors are added later.

7. **Disconnect vs. delete — same action, disambiguated by the confirm modal's copy only**
   - Per explicit direction: **no separate label, icon, or UI area** for disconnecting — the
     connected-folder row (item 5) uses the exact same "Delete" button every other resource row
     uses. The distinction between "delete a file" and "disconnect ShareFile" is communicated
     entirely through the **confirm modal text**, not through different buttons/UI.
   - When the deleted row is the connected-folder row, the confirm modal
     (`SisModalService.openConfirm(...)`, same pattern as `sync-details-page.component.ts` →
     `deleteSync()`) shows Content-Box-specific copy instead of the generic per-file delete copy,
     e.g.: *"Disconnect ShareFile? Nothing will be deleted — your files stay in this Content Box.
     Only the connection to ShareFile is removed."* with **Confirm** / **Cancel** buttons.
   - Confirm → calls the disconnect/delete-sync flow (removing the sync config; ingested
     resources remain, per "Open questions" below) and removes that row from the table.
     Cancel → closes the modal, no change.
   - Regular per-file delete rows keep their existing generic confirm copy — only the
     connected-folder row's modal instance needs the different copy.

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
  - Keep "Upload files" as a single button in both step 1 and the step-3 footer; wrap it in a
    `PaDropdownModule` menu that always opens on click, offering "From your computer" (existing
    `fileInput.click()` behavior) and "From ShareFile" (new OAuth + folder-picker flow). No
    second button, no split-button default-action pattern.
  - Disable/hide "From ShareFile" in the dropdown once a folder is already connected (v1 is
    single-folder-per-KB).
- `apps/dashboard/src/app/knowledge-box/simple/simple-kb/simple-kb.service.ts`
  - New methods/state: `connectShareFile()`, `getConnectedSource()`, `disconnectSource()`,
    wrapping the relevant `SyncService` calls; expose the connected sync's id (needed by the
    resource-table badge lookup below) and whether a source is currently connected (to
    enable/disable "From ShareFile" in the dropdown).
- New small component: `simple-kb/sharefile-folder-modal/` wrapping `CloudFolderComponent`
  inside a `SisModalService.openModal()` call — thin wrapper providing the `ExternalConnection`
  input and emitting the selected folder. No changes needed to `CloudFolderComponent` itself.
- `apps/dashboard/src/app/knowledge-box/simple/resource-table/resource-table.component.ts/.html`
  - Extend `TableRow` with a `sourceConnector?: 'sharefile'` field, computed by comparing each
    resource's `origin?.source_id` against the KB's connected ShareFile sync id
    (`SimpleKBService`).
  - Add the connected folder itself as a synthetic row (not a real `Resource`) merged into the
    same `rows` observable that already combines `resources` + `visibleUploads` — same table,
    same columns, no separate area.
  - In the "Type" column template, render the ShareFile badge/icon: alongside the existing
    `row.icon | mimeIcon` icon for real ShareFile-sourced files, or as the sole icon for the
    synthetic connected-folder row (which has no mime type).
  - `deleteResource()` (or a new shared handler covering both real resources and the synthetic
    row) branches on row type only to pick the confirm-modal copy — everything else (button,
    icon, column, position) is identical between a normal delete and a disconnect.
- `apps/dashboard/src/app/app.component.ts`
  - Extend `redirectToSyncCreation()` (or add a parallel handler) to resume into `/simple`
    when the pending connector context indicates a Context Box origin, not a Sync-page origin.
- `libs/sistema/src/lib/folder-tree/` — **no changes for v1.** `nsi-folder-tree` is not used in
  v1 (see "Future enhancement" note under "Folder picker" above). If revisited later, it would
  need a lazy-loading enhancement (expand-request event + per-node loading state) and a
  single-select override, scoped as its own follow-up piece of work.
- `libs/sync` — likely **no changes needed**; only consumed via its existing public API
  (`SyncService`, `CloudFolderComponent`, connector definitions). If a Context-Box-specific
  entry point needs a narrower/simplified variant of `addCloudSync` defaults, prefer adding an
  optional parameter to existing service methods over forking logic.
- i18n: new keys under the `simple.` namespace (e.g. `simple.upload-from-computer`,
  `simple.connect-sharefile`, `simple.sharefile.folder-row-label`,
  `simple.sharefile.disconnect-confirm-title`, `simple.sharefile.disconnect-confirm-description`,
  `simple.column.type.sharefile-badge-tooltip`) added to
  `libs/common/src/assets/i18n/{en,es,fr,ca}.json`. No separate "disconnect" action key is
  needed for the button/icon itself (it reuses `simple.delete`) — only the confirm modal's
  title/description differ when the row being removed is the connected-folder row.

---

## Open questions to resolve before implementation

1. **Re-sync cost/cadence** — ShareFile always does a full folder re-scan (no incremental
   delta support), and v1 has no manual "Sync now" control (per the "no extra area" direction
   in item 5). Does re-sync happen on a fixed schedule, on next KB visit, or only when the user
   disconnects/reconnects the folder? Needs a product decision before implementation — affects
   both reprocessing cost and how "fresh" users should expect their ShareFile files to be.
2. **Multi-folder / multi-source** — confirmed out of scope for v1, but confirm with product
   this is an acceptable long-term constraint or just a phased rollout decision.
3. **Permissions model** — does every KB collaborator see/trigger the ShareFile sync, or only
   the admin/contrib role that connected it originally? (`SimpleKBComponent` already
   distinguishes admin/contrib vs. reader via `SimplePageComponent.isReader`.)
4. **Disconnect behavior** — confirm whether disconnecting should leave previously-synced
   resources in the KB (recommended) or offer to delete them too.
