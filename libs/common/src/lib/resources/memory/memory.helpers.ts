import { ConversationField, ConversationFieldPages, Message, Resource } from '@nuclia/core';
import { MEMORY_FACTS_FIELD_PREFIX, MEMORY_SESSION_FIELD_PREFIX } from './memory.config';
import { MemoryEntry, MemoryEntryContent, MemoryFact, MemoryFactContent, MemorySessionInfo } from './memory.model';

export function isMemorySessionFieldId(fieldId: string): boolean {
  return fieldId.startsWith(MEMORY_SESSION_FIELD_PREFIX);
}

export function isMemoryFactsFieldId(fieldId: string): boolean {
  return fieldId.startsWith(MEMORY_FACTS_FIELD_PREFIX);
}

/** Any conversation field belonging to the memory feature (session or facts). */
export function isMemoryFieldId(fieldId: string): boolean {
  return isMemorySessionFieldId(fieldId) || isMemoryFactsFieldId(fieldId);
}

/** Derives a session's facts-field id from its own field id. */
export function factsFieldIdFromSessionFieldId(sessionFieldId: string): string {
  return `${MEMORY_FACTS_FIELD_PREFIX}${sessionFieldId}`;
}

/** Derives a facts field's source session field id by stripping the facts prefix. */
export function sessionFieldIdFromFactsFieldId(factsFieldId: string): string {
  return factsFieldId.slice(MEMORY_FACTS_FIELD_PREFIX.length);
}

/** A resource is a "memory resource" if it has at least one session-prefixed conversation field (no explicit flag exists). */
export function isMemoryResource(resource: Pick<Resource, 'data'>): boolean {
  const conversationFieldIds = Object.keys(resource.data?.conversations || {});
  return conversationFieldIds.some((fieldId) => isMemorySessionFieldId(fieldId));
}

export function getMemorySessionInfos(resource: Pick<Resource, 'data'>): MemorySessionInfo[] {
  const conversations = resource.data?.conversations || {};
  return Object.entries(conversations)
    .filter(([fieldId]) => isMemorySessionFieldId(fieldId))
    .map(([fieldId, field]) => {
      const pages = getConversationFieldPages(field?.value);
      return {
        fieldId,
        factsFieldId: factsFieldIdFromSessionFieldId(fieldId),
        total: pages?.total,
        pages: pages?.pages,
      };
    });
}

function getConversationFieldPages(
  value: ConversationField | ConversationFieldPages | undefined,
): ConversationFieldPages | undefined {
  if (!value) return undefined;
  // Shallow resource loads only ever populate the metadata shape (pages/size/total), never messages.
  return 'messages' in value ? undefined : value;
}

/** Extracts the messages from a per-field GET response (which does include values, unlike shallow resource loads). */
export function getConversationMessages(value: ConversationField | ConversationFieldPages | undefined): Message[] {
  return value && 'messages' in value ? value.messages || [] : [];
}

/** Safely parses a session entry message into a `MemoryEntry`, or null if malformed. */
export function parseMemoryEntry(message: Message, sessionFieldId: string): MemoryEntry | null {
  const content = safeJsonParse<MemoryEntryContent>(message.content?.text);
  if (!content || typeof content.text !== 'string') return null;
  return {
    id: message.ident,
    sessionFieldId,
    timestamp: message.timestamp,
    content,
  };
}

/** Safely parses a facts message into a `MemoryFact`, or null if malformed. */
export function parseMemoryFact(message: Message, factsFieldId: string): MemoryFact | null {
  const content = safeJsonParse<MemoryFactContent>(message.content?.text);
  if (!content || typeof content.text !== 'string') return null;
  return {
    id: message.ident,
    factsFieldId,
    sessionFieldId: sessionFieldIdFromFactsFieldId(factsFieldId),
    timestamp: message.timestamp,
    content: {
      ...content,
      related_entry_ids: Array.isArray(content.related_entry_ids) ? content.related_entry_ids : [],
    },
  };
}

function safeJsonParse<T>(text: string | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
