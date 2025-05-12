import { deepEqual } from './deep-equal';

describe('deepEqual', () => {
  const object2 = { a: 1, b: '2', c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } };

  describe('with deepIncluded true', () => {
    it('should return true if two objects are equivalent', () => {
      expect(deepEqual({ a: 1, b: '2', c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } }, object2, true)).toBe(true);
    });
    it('should return true if object1 is fully included in object 2', () => {
      expect(deepEqual({ c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } }, object2, true)).toBe(true);
      expect(deepEqual([{ c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } }], [object2], true)).toBe(true);
    });
    it('should return false if object1 is not fully included in object 2', () => {
      expect(deepEqual({ c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' }, f: 2 }, object2, true)).toBe(false);
      expect(deepEqual({ a: 1, b: '2', c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' }, f: 2 }, object2, true)).toBe(false);
    });
    it('should return false if object1 has the same properties than object2 but not the same values', () => {
      expect(deepEqual({ c: [2, 2], d: [{ a: 1 }], e: { a: 'toto' } }, object2, true)).toBe(false);
      expect(deepEqual({ c: [1, 2], d: [{ a: 2 }], e: { a: 'toto' } }, object2, true)).toBe(false);
      expect(deepEqual({ c: [1, 2], d: [{ a: 1 }], e: { a: 'titi' } }, object2, true)).toBe(false);
      expect(deepEqual({ a: 2, c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } }, object2, true)).toBe(false);
      expect(deepEqual({ b: 2, c: [1, 2], d: [{ a: 1 }], e: { a: 'toto' } }, object2, true)).toBe(false);
    });

    it('should return true when comparing null and undefined', () => {
      expect(
        deepEqual(
          {
            some: undefined,
            headers: {
              other: null,
            },
          },
          {
            some: null,
            headers: {
              other: undefined,
            },
          },
          true,
        ),
      ).toBe(true);
    });
  });
});
