import { addParagraphToSmartResults } from './search.store';
import type { FIELD_TYPE, Search } from '@nuclia/core';

describe('search.store', () => {
  const r1: Search.SmartResult = {
    id: 'r1',
  };
  const r1p1: Search.SmartParagraph = {
    field: 'r1/f1',
    field_type: 'file',
    rid: 'r1',
    score: 0.9,
    text: 'r1p1 text',
    labels: [],
  };
  const r2p1: Search.SmartParagraph = {
    field: 'r2/f1',
    field_type: 'file',
    rid: 'r2',
    score: 0.9,
    text: 'r2p1 text',
    labels: [],
  };
  const r2p2: Search.SmartParagraph = {
    field: 'r2/f1',
    field_type: 'file',
    rid: 'r2',
    score: 0.5,
    text: 'r2p2 text',
    labels: [],
  };
  const r2p3: Search.SmartParagraph = {
    field: 'r2/f2',
    field_type: 'file',
    rid: 'r2',
    score: 0.6,
    text: 'r2p3 text',
    labels: [],
  };
  const r2: Search.SmartResult = {
    id: 'r2',
    paragraphs: [r2p1],
    field: { field_id: r2p1.field, field_type: r2p1.field_type as FIELD_TYPE },
  };

  describe('addParagraphToSmartResults', () => {
    it('should return existing smartResults when paragraph is undefined', () => {
      expect(addParagraphToSmartResults([], r1, undefined)).toEqual([]);
      expect(addParagraphToSmartResults([r1], r2, undefined)).toEqual([r1]);
    });

    it('should add a resource when paragraph’s resource is not in smart results already ', () => {
      expect(addParagraphToSmartResults([], r1, r1p1)).toEqual([
        {
          ...r1,
          paragraphs: [r1p1],
          field: { field_id: r1p1.field, field_type: r1p1.field_type },
        },
      ]);
      expect(addParagraphToSmartResults([r2], r1, r1p1)).toEqual([
        { ...r2 },
        {
          ...r1,
          paragraphs: [r1p1],
          field: { field_id: r1p1.field, field_type: r1p1.field_type },
        },
      ]);
    });

    it('should add paragraph in smart result’s existing resource', () => {
      expect(addParagraphToSmartResults([r2], r2, r2p2)).toEqual([
        {
          ...r2,
          paragraphs: [r2p1, r2p2],
        },
      ]);
    });

    it('should not add paragraph which already exists in smart results', () => {
      expect(addParagraphToSmartResults([r2], r2, r2p1)).toEqual([r2]);
      const sameWithMarks = {
        ...r2p1,
        field: 'r3/f1',
        text: `\n  Messi <mark>is</mark> <mark>the</mark> <mark>best</mark> <mark>player</mark>. \n`,
      };
      const sameWithBlanks = { ...r2p1, field: 'r3/f1', text: ` Messi is the best player.\n` };
      const r3: Search.SmartResult = {
        id: 'r3',
        paragraphs: [sameWithMarks],
        field: { field_id: 'r3/f1', field_type: r2p1.field_type as FIELD_TYPE },
      };
      expect(addParagraphToSmartResults([r3], { id: 'r3' }, sameWithBlanks)).toEqual([r3]);
    });

    it('should duplicate resource when adding paragraph from another field', () => {
      expect(addParagraphToSmartResults([r2], r2, r2p3)).toEqual([
        { ...r2 },
        { id: r2.id, field: { field_id: r2p3.field, field_type: r2p3.field_type }, paragraphs: [r2p3] },
      ]);
    });
  });
});
