---
name: i18n-patterns
description: >
  Internationalisation patterns for the Nuclia frontend monorepo — covering ngx-translate usage
  in Angular components and services, the BabelEdit .babel project file workflow for adding/
  renaming/deleting translation keys, flat JSON key conventions, interpolation syntax, the
  Pastanaga Angular translation bridge, and the independent i18n system inside search-widget
  (Svelte 5). Activate this skill ANY TIME a task involves adding, renaming, or deleting a
  translation key, adding a new locale file, using the translate pipe, calling TranslateService,
  wiring up i18n in a new component or lib, or when the user mentions BabelEdit. Do not wait
  to be asked about "i18n" specifically — if a template string is being hardcoded that should be
  translatable, this skill applies.
---

# i18n Patterns — Nuclia Frontend Monorepo

Translations cover 4 locales: **en, es, fr, ca**. These are the only supported locales —
`STFUtils.supportedLanguages()` returns exactly this set. When in doubt, match existing code.

---

## Non-Negotiable Rules

1. **When adding new translation keys programmatically, only add them to `en.json`.**
   Never touch `fr.json`, `ca.json`, or `es.json` — the user handles those manually via
   BabelEdit. BabelEdit detects blank/missing keys, so adding only to `en.json` makes it
   easy for the user to fill in the other locales. Manual JSON edits to non-English files
   are allowed only for fixing a typo in a single locale's value.
2. **Keys are flat dot-notation strings.** The JSON files use a flat structure with namespaced
   keys like `"account.delete_account": "Delete account"`. Never introduce nested JSON objects.
3. **Every user-visible string must be translatable.** Do not hardcode English text in templates
   or components — use the `translate` pipe or `TranslateService.instant()`.
4. **Toast and modal messages must use i18n keys**, not raw strings. See error-handling skill
   for the `SisToastService` pattern.
5. **The search-widget has its own independent i18n system** (not ngx-translate). Do not mix
   the two approaches.

---

## BabelEdit Workflow — Adding or Changing a Key

Each library that owns translation files has a `.babel` project file at its root:

| Library | Project file |
|---------|-------------|
| `libs/common` | `libs/common/common.babel` |
| `libs/search-widget` | `libs/search-widget/widget.babel` |
| `libs/sync` | `libs/sync/sync.babel` |
| `libs/user` | `libs/user/user.babel` |

> Apps (`dashboard`, `rao`, `manager-v2`, `nucliadb-admin`) do not own translation files —
> they aggregate translations from the libs above.

**To add a new key (agent / programmatic workflow):**
1. Add the key and English value to the library's `en.json` file only.
2. **Do not touch** `fr.json`, `ca.json`, or `es.json` — the user fills those in via BabelEdit.
3. BabelEdit will detect the missing key in other locales and prompt the user to translate it.

**To add a new key (BabelEdit manual workflow):**
1. Open the library's `.babel` file in BabelEdit (File → Open).
2. Click **+** to add a new key. BabelEdit adds it to all 4 locale files simultaneously.
3. Fill in the English value; add translations or leave others blank (they'll fall back to `en`).
4. Save — BabelEdit writes all 4 JSON files.

**To rename a key:**
- Use BabelEdit's rename function. Do not manually rename in JSON and then search-replace
  in TypeScript — BabelEdit does both in one step (it can scan usages in source files).

**To delete a key:**
- Use BabelEdit's delete function. It removes the key from all locale files and warns about
  remaining code usages.

---

## Key Naming Conventions

Keys follow `namespace.description` or `namespace.sub-namespace.description`:

```
"account.delete_account"        → "Delete account"
"account.delete.error"          → "Error when deleting the account"
"upload.toast.blocked"          → "Upload blocked"
"answer.error.llm_error"        → "An error occurred"
"kb.resource.edit.title"        → "Edit resource"
```

Rules:
- Use **snake_case** for the segments (not camelCase, not kebab-case).
- The first segment is the **feature area** (`account`, `kb`, `upload`, `answer`, `agent`, etc.).
- Keep key names self-documenting — someone reading only the key should understand its context.
- For error messages that appear in toasts, suffix the namespace with `.toast.error` or
  `.error.{specific_case}`.

**Interpolation** uses `{{` double curly braces `}}`:
```json
"account.days_left": "{{days}} days left",
"account.delete_account_warning": "Are you sure you want to delete user {{ username }}?"
```
Spaces inside `{{` `}}` are optional but consistent — pick a style and keep it.

---

## Angular — Using Translations

### In templates (preferred)

```html
<!-- Simple key -->
<span>{{ 'account.delete_account' | translate }}</span>

<!-- With interpolation params -->
<span>{{ 'account.days_left' | translate: { days: daysLeft() } }}</span>

<!-- On an attribute -->
<button [title]="'kb.save' | translate">...</button>

<!-- innerHTML for keys with <strong> or HTML tags -->
<p [innerHTML]="'account.invite-collaborators.set-password' | translate: { email: userEmail() }"></p>
```

The component must import `TranslateModule`:
```ts
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [TranslateModule, ...],
})
```

### Imperative (in services or component logic)

```ts
import { TranslateService } from '@ngx-translate/core';

private translate = inject(TranslateService);

// Synchronous — use when you know the translations are already loaded
const label = this.translate.instant('kb.resource.edit.title');

// Async — use when the component may load before translations are ready
this.translate.get('account.days_left', { days: 5 }).subscribe(msg => ...);
```

Prefer `instant()` inside `computed()` signals or `catchError` callbacks; prefer `get()`
only when translating very early on before the language is loaded.

---

## Pastanaga Angular Bridge

The bridge between ngx-translate and Pastanaga's own translation service is wired **once**
at app root in each app's `AppComponent`:

```ts
private ngxTranslate = inject(TranslateService);
private paTranslate  = inject(PaTranslateService);  // from @guillotinaweb/pastanaga-angular

constructor() {
  this.ngxTranslate.onLangChange
    .pipe(takeUntil(this.unsubscribeAll))
    .subscribe((event) =>
      this.paTranslate.initTranslationsAndUse(event.lang, event.translations)
    );
}
```

**Do not replicate this bridge in components or services.** It is already set up and propagates
automatically. `pa-*` components will receive translations as soon as `ngxTranslate` changes.

---

## search-widget (Svelte 5) — Independent i18n

The `search-widget` lib has its **own translation system** completely separate from ngx-translate.
Translation files live in `libs/search-widget/public/i18n/{locale}.json` and are managed via
`libs/search-widget/widget.babel`.

**API:**
```ts
import { _, translateInstant } from '@nuclia/widget';   // from libs/search-widget/src/core/i18n.ts

// In Svelte templates or stores:
_('answer.error.llm_error')           // reactive translation (subscribes to lang changes)
translateInstant('entities.person')   // synchronous, non-reactive
```

**In Svelte templates:**
```svelte
<script>
  import { _ } from '$lib/core/i18n';
</script>
<p>{$_('answer.error.llm_error')}</p>
```

Keys in `widget.babel` follow the same flat dot-notation as Angular libs. Use BabelEdit
(`libs/search-widget/widget.babel`) to add keys.

---

## rao-widget (React 19)

The `rao-widget` does not have a dedicated i18n system. User-visible strings are either:
- Hardcoded English (acceptable for the widget's narrow use case)
- Delegated to the consuming app via props

If internationalising rao-widget strings, follow the `search-widget` pattern (custom store +
JSON files) rather than pulling in ngx-translate.

---

## Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| Adding a key to all 4 locale files at once (programmatically) | Only add to `en.json` — the user fills other locales via BabelEdit |
| Hardcoding English text in a template | Use `'key' \| translate` pipe |
| Passing raw strings to `SisToastService.error()` | Use i18n key: `toaster.error('upload.toast.blocked')` |
| Using nested JSON keys `{ "account": { "title": "..." } }` | Use flat dot-notation: `"account.title"` |
| Using `$localize` (Angular's native i18n) | This project uses ngx-translate — do not mix |
| Calling `TranslateService` in search-widget | Use `_()` / `translateInstant()` from `core/i18n.ts` |
