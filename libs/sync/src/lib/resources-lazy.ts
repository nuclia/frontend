// Local re-export proxy so `sync.routes.ts` can lazy-load `ResourcesModule` via a same-project
// relative specifier, avoiding an `@nx/enforce-module-boundaries` "lazy-loaded library" edge to
// `@flaps/common` (which would otherwise flag the many pre-existing static imports of `@flaps/common`
// elsewhere in this lib as invalid). Mirrors the equivalent `app-routing.lazy.ts` proxy pattern
// already used at the dashboard app level for the same reason.
export { ResourcesModule } from '@flaps/common';
