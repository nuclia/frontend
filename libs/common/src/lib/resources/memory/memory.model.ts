/** Shallow, no-value info about a memory session, derived from the resource's basic field list. */
export interface MemorySessionInfo {
  fieldId: string;
  factsFieldId: string;
  /** Total number of entries recorded in this session, when known from shallow field metadata. */
  total?: number;
  pages?: number;
}

// ─── Entry content (parsed from a session message's content.text JSON) ─────────────────────

export interface MemoryContextMessage {
  author: string;
  text: string;
}

export interface MemoryEntryContent {
  text: string;
  reasoning?: string;
  context?: MemoryContextMessage[];
  /** Structured metadata is entirely topic-specific — render generically, don't assume a schema. */
  metadata?: Record<string, unknown>;
}

export interface MemoryEntry {
  id: string;
  sessionFieldId: string;
  timestamp?: string;
  content: MemoryEntryContent;
}

// ─── Fact content (parsed from a facts message's content.text JSON) ────────────────────────

export interface MemoryFactContent {
  text: string;
  reasoning?: string;
  related_entry_ids: string[];
}

export interface MemoryFact {
  id: string;
  factsFieldId: string;
  sessionFieldId: string;
  timestamp?: string;
  content: MemoryFactContent;
}
