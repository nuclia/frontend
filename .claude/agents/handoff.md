# Agent Handoff Format

A **handoff block** is passed from one agent to the next whenever work is sequential and the
receiving agent needs context it cannot discover on its own. The orchestrator generates handoff
blocks — agents do not write them for themselves.

---

## When to generate a handoff block

Generate one whenever:
- Agent A's output is an **input** to Agent B (not just background context).
- The receiving agent is about to touch files or make decisions that depend on specific choices
  Agent A made (class names, method signatures, translation keys, file paths).
- A specialist is being handed work mid-task and would otherwise have to re-read all prior turns
  to understand what's already done.

Do NOT generate one when:
- Delegating the very first agent in a session (use the session context instead).
- The task is a clean parallel assignment with no shared state (give each agent its own brief).
- The receiving agent is `quality-inspector` — it reads the diff directly, not a handoff.

---

## Format

```
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM : <agent-name>
TO   : <agent-name>
RE   : <one-line description of this work fragment>

── COMPLETED ────────────────────────────────────────────────────
<Bulleted list of everything the FROM agent produced. Include full
file paths and a one-sentence description of what each file contains.>

── ASSUMPTIONS MADE ─────────────────────────────────────────────
<Decisions the FROM agent made that the TO agent must not contradict.
List only things that affect the TO agent's work.>

── INPUTS AVAILABLE ─────────────────────────────────────────────
<File paths or inline code the TO agent should read before starting.
For short snippets (< 30 lines), paste inline. For longer code, give the path.>

── YOUR TASK ────────────────────────────────────────────────────
<Numbered list of exactly what the TO agent must produce.
Be specific: file names, exports, behaviours to cover.>

── CONSTRAINTS ──────────────────────────────────────────────────
<Hard rules the TO agent must respect. Include project name
(determines test runner, design tokens, routes), Angular patterns
(OnPush, standalone), and any "do not touch" boundaries.>

── DEFINITION OF DONE ───────────────────────────────────────────
<How to verify this fragment is complete. Prefer a runnable command,
e.g. "nx test dashboard passes" or "component renders in Storybook".>

━━━ END HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Worked example — ui-builder → test-writer

```
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM : ui-builder
TO   : test-writer
RE   : Unit tests for ResourceListComponent

── COMPLETED ────────────────────────────────────────────────────
- apps/dashboard/src/app/features/resources/resource-list/
    resource-list.component.ts   — standalone OnPush component, injects ResourceService
    resource-list.component.html — @for loop over resources$, empty-state block
    resource-list.component.scss — uses $nsi-space-md token
- libs/common/src/assets/i18n/en.json — added key "resources.list.empty"

── ASSUMPTIONS MADE ─────────────────────────────────────────────
- ResourceService.getResources() returns Observable<Resource[]>
- Error state is handled by the service (toast shown there); component renders empty list on error
- Selector: nsi-resource-list

── INPUTS AVAILABLE ─────────────────────────────────────────────
// resource-list.component.ts
@Component({
  selector: 'nsi-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrl: './resource-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent {
  private resourceService = inject(ResourceService);
  resources = toSignal(this.resourceService.getResources(), { initialValue: [] });
}

── YOUR TASK ────────────────────────────────────────────────────
1. Create resource-list.component.spec.ts alongside the component file.
2. Cover three cases: renders items when resources$ emits a list, renders
   empty-state block when list is empty, calls getResources() on init.
3. Mock ResourceService with MockProvider — do not instantiate it.

── CONSTRAINTS ──────────────────────────────────────────────────
- Project: dashboard → use Jest stack (jest-preset-angular), not Vitest.
- Component is OnPush — call fixture.detectChanges() after every signal/state change.
- Do NOT test ResourceService internals here.
- Import ResourceService from @flaps/common, not a relative path.

── DEFINITION OF DONE ───────────────────────────────────────────
All three tests pass with: nx test dashboard --testFile=resource-list.component.spec.ts

━━━ END HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Worked example — api-integrator → ui-builder

```
━━━ HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM : api-integrator
TO   : ui-builder
RE   : ResourceListComponent consuming ResourceService

── COMPLETED ────────────────────────────────────────────────────
- libs/core/src/lib/services/resource.service.ts
    getResources(): Observable<Resource[]>  — wraps KnowledgeBox.listResources()
    deleteResource(id: string): Observable<void>  — wraps KnowledgeBox.deleteResource()
    Error toasts already handled inside the service (i18n keys: resources.load.error, resources.delete.error)

── ASSUMPTIONS MADE ─────────────────────────────────────────────
- ResourceService is provided in root (providedIn: 'root')
- getResources() never throws — errors are caught inside, tap logs, toast shown, returns EMPTY
- deleteResource() returns Observable<void>; subscribe with no next handler, error handled inside
- Resource interface: { id: string; title: string; createdAt: string }

── INPUTS AVAILABLE ─────────────────────────────────────────────
libs/core/src/lib/services/resource.service.ts  (read the full file)

── YOUR TASK ────────────────────────────────────────────────────
1. Create ResourceListComponent in apps/dashboard under features/resources/resource-list/.
2. Display the list using an @for loop with track by id.
3. Add a delete button per row that calls resourceService.deleteResource(id) and subscribes.
4. Show an empty-state block (use nsi-empty-state) when the list is empty.
5. All user-visible strings must use the translate pipe with new i18n keys.

── CONSTRAINTS ──────────────────────────────────────────────────
- Inject ResourceService with inject() — no constructor injection.
- Use toSignal() to bridge the observable to the template — no async pipe.
- Do not write any catchError inside the component — the service already handles errors.
- OnPush required. Standalone. No standalone: true written explicitly (Angular 19+ default).

── DEFINITION OF DONE ───────────────────────────────────────────
Component renders in nx serve dashboard with no console errors.

━━━ END HANDOFF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Handoff anti-patterns

| Anti-pattern | Why it breaks |
|---|---|
| Omitting "Assumptions Made" | Receiving agent contradicts a file path or class name, producing inconsistent code |
| Pasting 200-line files inline | Bloats context; use a file path reference instead |
| Writing "see previous messages" | Stateless sessions have no previous messages — always be explicit |
| Skipping "Definition of Done" | Agent doesn't know when to stop; may over-engineer or under-deliver |
| Sending a handoff to `quality-inspector` | It reads the diff; it doesn't need a handoff |
