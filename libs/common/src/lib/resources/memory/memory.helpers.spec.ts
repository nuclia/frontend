import { ConversationField, ConversationFieldPages, Message, Resource } from '@nuclia/core';
import {
  factsFieldIdFromSessionFieldId,
  getConversationMessages,
  getMemorySessionInfos,
  isMemoryFactsFieldId,
  isMemoryFieldId,
  isMemoryResource,
  isMemorySessionFieldId,
  parseMemoryEntry,
  parseMemoryFact,
  sessionFieldIdFromFactsFieldId,
} from './memory.helpers';
import { MEMORY_FACTS_FIELD_PREFIX, MEMORY_SESSION_FIELD_PREFIX } from './memory.config';

function message(text: string, overrides: Partial<Message> = {}): Message {
  return {
    ident: 'm1',
    content: { text },
    timestamp: '2024-05-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('Memory helpers', () => {
  describe('field id conventions', () => {
    it('should identify session and facts field ids', () => {
      expect(isMemorySessionFieldId(`${MEMORY_SESSION_FIELD_PREFIX}s1`)).toBe(true);
      expect(isMemorySessionFieldId('regular-field')).toBe(false);
      expect(isMemoryFactsFieldId(`${MEMORY_FACTS_FIELD_PREFIX}s1`)).toBe(true);
      expect(isMemoryFactsFieldId('regular-field')).toBe(false);
      expect(isMemoryFieldId(`${MEMORY_SESSION_FIELD_PREFIX}s1`)).toBe(true);
      expect(isMemoryFieldId(`${MEMORY_FACTS_FIELD_PREFIX}s1`)).toBe(true);
      expect(isMemoryFieldId('regular-field')).toBe(false);
    });

    it('should derive facts field id from session field id and back', () => {
      const sessionFieldId = `${MEMORY_SESSION_FIELD_PREFIX}s1`;
      const factsFieldId = factsFieldIdFromSessionFieldId(sessionFieldId);
      expect(factsFieldId).toBe(`${MEMORY_FACTS_FIELD_PREFIX}${sessionFieldId}`);
      expect(sessionFieldIdFromFactsFieldId(factsFieldId)).toBe(sessionFieldId);
    });
  });

  describe('isMemoryResource', () => {
    it('should return false when resource has no conversation fields', () => {
      expect(isMemoryResource({ data: {} })).toBe(false);
      expect(isMemoryResource({ data: undefined } as Pick<Resource, 'data'>)).toBe(false);
    });

    it('should return false when conversation fields are all non-memory', () => {
      const resource: Pick<Resource, 'data'> = { data: { conversations: { 'regular-field': {} } } };
      expect(isMemoryResource(resource)).toBe(false);
    });

    it('should return true when at least one memory session field exists', () => {
      const resource: Pick<Resource, 'data'> = {
        data: { conversations: { 'regular-field': {}, [`${MEMORY_SESSION_FIELD_PREFIX}s1`]: {} } },
      };
      expect(isMemoryResource(resource)).toBe(true);
    });
  });

  describe('getMemorySessionInfos', () => {
    it('should return an empty list when there are no conversation fields', () => {
      expect(getMemorySessionInfos({ data: {} })).toEqual([]);
    });

    it('should extract only memory session fields with their facts field id and page metadata', () => {
      const sessionFieldId = `${MEMORY_SESSION_FIELD_PREFIX}s1`;
      const pages: ConversationFieldPages = { pages: 3, size: 50, total: 120 };
      const resource: Pick<Resource, 'data'> = {
        data: {
          conversations: {
            'regular-field': { value: { messages: [] } },
            [sessionFieldId]: { value: pages },
          },
        },
      };
      expect(getMemorySessionInfos(resource)).toEqual([
        {
          fieldId: sessionFieldId,
          factsFieldId: factsFieldIdFromSessionFieldId(sessionFieldId),
          total: 120,
          pages: 3,
        },
      ]);
    });

    it('should treat a shallow field with no value as having no page metadata', () => {
      const sessionFieldId = `${MEMORY_SESSION_FIELD_PREFIX}s1`;
      const resource: Pick<Resource, 'data'> = { data: { conversations: { [sessionFieldId]: {} } } };
      expect(getMemorySessionInfos(resource)).toEqual([
        {
          fieldId: sessionFieldId,
          factsFieldId: factsFieldIdFromSessionFieldId(sessionFieldId),
          total: undefined,
          pages: undefined,
        },
      ]);
    });
  });

  describe('getConversationMessages', () => {
    it('should return the messages when the field value has them (full field GET)', () => {
      const value: ConversationField = { messages: [message('hi')] };
      expect(getConversationMessages(value)).toEqual([message('hi')]);
    });

    it('should return an empty array for shallow metadata-only values (no messages key)', () => {
      const value: ConversationFieldPages = { pages: 1, size: 10, total: 1 };
      expect(getConversationMessages(value)).toEqual([]);
    });

    it('should return an empty array when value is undefined', () => {
      expect(getConversationMessages(undefined)).toEqual([]);
    });
  });

  describe('parseMemoryEntry', () => {
    it('should parse a well-formed entry message', () => {
      const msg = message(JSON.stringify({ text: 'hello there' }), {
        ident: 'e1',
        timestamp: '2024-05-01T10:00:00.000Z',
      });
      expect(parseMemoryEntry(msg, 'session-1')).toEqual({
        id: 'e1',
        sessionFieldId: 'session-1',
        timestamp: '2024-05-01T10:00:00.000Z',
        content: { text: 'hello there' },
      });
    });

    it('should return null for malformed JSON', () => {
      const msg = message('not-json');
      expect(parseMemoryEntry(msg, 'session-1')).toBeNull();
    });

    it('should return null when parsed content is missing a text field', () => {
      const msg = message(JSON.stringify({ reasoning: 'no text field' }));
      expect(parseMemoryEntry(msg, 'session-1')).toBeNull();
    });

    it('should return null when content.text is undefined', () => {
      const msg = message(undefined as unknown as string);
      expect(parseMemoryEntry(msg, 'session-1')).toBeNull();
    });
  });

  describe('parseMemoryFact', () => {
    const factsFieldId = `${MEMORY_FACTS_FIELD_PREFIX}${MEMORY_SESSION_FIELD_PREFIX}s1`;

    it('should parse a well-formed fact message and derive its source session field id', () => {
      const msg = message(JSON.stringify({ text: 'some fact', related_entry_ids: ['e1', 'e2'] }), {
        ident: 'f1',
        timestamp: '2024-05-01T10:00:00.000Z',
      });
      expect(parseMemoryFact(msg, factsFieldId)).toEqual({
        id: 'f1',
        factsFieldId,
        sessionFieldId: `${MEMORY_SESSION_FIELD_PREFIX}s1`,
        timestamp: '2024-05-01T10:00:00.000Z',
        content: { text: 'some fact', related_entry_ids: ['e1', 'e2'] },
      });
    });

    it('should default related_entry_ids to an empty array when missing or malformed', () => {
      const msgMissing = message(JSON.stringify({ text: 'fact without related ids' }));
      const parsedMissing = parseMemoryFact(msgMissing, factsFieldId);
      expect(parsedMissing?.content.related_entry_ids).toEqual([]);

      const msgWrongType = message(JSON.stringify({ text: 'fact', related_entry_ids: 'not-an-array' }));
      const parsedWrongType = parseMemoryFact(msgWrongType, factsFieldId);
      expect(parsedWrongType?.content.related_entry_ids).toEqual([]);
    });

    it('should return null for malformed JSON', () => {
      const msg = message('not-json');
      expect(parseMemoryFact(msg, factsFieldId)).toBeNull();
    });
  });
});
