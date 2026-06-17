---
name: session-context
description: >
  Session context template for the orchestrator in the Nuclia frontend monorepo.
  The orchestrator copies and fills this template at the start of every non-trivial session,
  then updates it after each delegation round. This is the only persistent memory across turns.
---

<!--
  SESSION CONTEXT TEMPLATE
  ─────────────────────────
  The orchestrator fills this in at the START of every non-trivial session.
  Copy this block into your working response and keep it updated throughout.
  This is the only persistent memory across turns — maintain it accurately.
-->

---

## Session Context

**Started:** <!-- e.g. 2026-03-05 -->
**User goal:** <!-- One-sentence description of what the user wants to achieve end-to-end -->
**Target project(s):** <!-- dashboard | rao | manager-v2 | nucliadb-admin | sdk-core | common | core | sistema | user | sync | search-widget | rao-widget | NEW -->
**Definition of done:** <!-- What does "finished" look like? Files created, tests passing, feature visible? -->

---

## Plan

Agents to invoke, in order (check off as each completes):

- [ ] <!-- agent-name → what specifically it will do -->
- [ ] <!-- agent-name → what specifically it will do -->

Parallel pairs (can run simultaneously):

- <!-- agent-name + agent-name (reason: independent outputs) --> — or "none"

---

## Discovered Facts

<!-- Fill as agents report back. These are things found in the codebase that affect decisions. -->
<!-- Example: "ResourceService.getResources() returns Observable<Resource[]>" -->

- ***

## Locked Decisions

<!-- Once written here, do NOT revisit without explicit user instruction. -->
<!-- Example: "Target project is dashboard (user confirmed)" -->
<!-- Example: "New i18n key: resources.list.empty" -->

- ***

## Files Read (context only)

<!-- Files read to understand the codebase, not modified. -->

- ***

## Files Modified

<!-- Files created or changed this session. One line per file with a short description. -->
<!-- Example: "apps/dashboard/src/app/.../resource-list.component.ts — created" -->

- ***

## Open Blockers

<!-- Anything that stopped or could stop progress. Include the agent that surfaced it. -->
<!-- Example: "[test-writer] nx test dashboard failing — missing HttpClientTestingModule" -->

- ***

  <!-- END SESSION CONTEXT -->
