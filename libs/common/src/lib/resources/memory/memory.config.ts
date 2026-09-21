/**
 * Field id conventions for the ARAG memory feature (see `features/memory/doc.md`).
 * A "session" field holds raw entries; its facts are extracted into a separate field
 * per session, whose id is the session's field id prefixed with `da-facts-memory-c-`.
 */
export const MEMORY_SESSION_FIELD_PREFIX = '__memory__';
export const MEMORY_FACTS_FIELD_PREFIX = 'da-facts-memory-c-';
