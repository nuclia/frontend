import { extractResourceKeyValueFields, formatResourceKeyValueValue } from './resource-key-values.utils';

describe('resource-key-values utils', () => {
  const resourceWithKvFields = {
    id: 'resource-1',
    title: 'Generic kv field',
    status: 'PROCESSED',
    data: {
      key_values: {
        generic_schema_1: {
          status: 'PROCESSED',
          value: {
            data: {
              available: true,
              expires_at: 'Jul 03, 2026',
              label: 'label_1',
              label_repeated: ['label_1', 'label_2'],
              price: 1.15,
              quantity: '1–5',
            },
          },
        },
      },
    },
  };

  it('extracts real key-value field values from SDK resource detail shape', () => {
    expect(extractResourceKeyValueFields(resourceWithKvFields)).toEqual([
      {
        id: 'generic_schema_1.available',
        group: 'generic_schema_1',
        key: 'available',
        label: 'available',
        value: true,
      },
      {
        id: 'generic_schema_1.expires_at',
        group: 'generic_schema_1',
        key: 'expires_at',
        label: 'expires_at',
        value: 'Jul 03, 2026',
      },
      {
        id: 'generic_schema_1.label',
        group: 'generic_schema_1',
        key: 'label',
        label: 'label',
        value: 'label_1',
      },
      {
        id: 'generic_schema_1.label_repeated',
        group: 'generic_schema_1',
        key: 'label_repeated',
        label: 'label_repeated',
        value: ['label_1', 'label_2'],
      },
      {
        id: 'generic_schema_1.price',
        group: 'generic_schema_1',
        key: 'price',
        label: 'price',
        value: 1.15,
      },
      {
        id: 'generic_schema_1.quantity',
        group: 'generic_schema_1',
        key: 'quantity',
        label: 'quantity',
        value: '1–5',
      },
    ]);
  });

  it('ignores top-level status and field status values', () => {
    const resource = {
      id: 'resource-2',
      status: 'PROCESSED',
      data: {
        key_values: {
          generic_schema_1: {
            status: 'PROCESSED',
            value: {
              data: {
                available: true,
              },
            },
          },
        },
      },
    };

    expect(extractResourceKeyValueFields(resource).map((field) => field.key)).toEqual(['available']);
  });

  it('returns an empty list when resource has no key-value data', () => {
    expect(
      extractResourceKeyValueFields({
        id: 'resource-3',
        title: 'Resource without key-values.pdf',
        status: 'PROCESSED',
      }),
    ).toEqual([]);
  });

  it('returns an empty list when list response only has key-value field status metadata', () => {
    const resource = {
      data: {
        key_values: {
          generic_schema_1: {
            status: 'PROCESSED',
          },
        },
      },
    };

    expect(extractResourceKeyValueFields(resource)).toEqual([]);
  });

  it('formats primitive and structured values for table rendering', () => {
    expect(formatResourceKeyValueValue(true)).toBe('true');
    expect(formatResourceKeyValueValue(1.15)).toBe('1.15');
    expect(formatResourceKeyValueValue('label_1')).toBe('label_1');
    expect(formatResourceKeyValueValue(['label_1', 'label_2'])).toBe('label_1, label_2');
    expect(formatResourceKeyValueValue({ lower: 1, upper: 5 })).toBe('1 – 5');
    expect(formatResourceKeyValueValue({ min: 1, max: 5 })).toBe('1 – 5');
    expect(formatResourceKeyValueValue({ from: 1, to: 5 })).toBe('1 – 5');
    expect(formatResourceKeyValueValue(null)).toBe('—');
    expect(formatResourceKeyValueValue(undefined)).toBe('—');
    expect(formatResourceKeyValueValue({ unknown: 'value' })).toBe('Object');

    expect(formatResourceKeyValueValue('Artemis II')).toBe('Artemis II');
    expect(formatResourceKeyValueValue(2)).toBe('2');
    expect(formatResourceKeyValueValue(false)).toBe('false');
    expect(formatResourceKeyValueValue(['PDF', 'DOCX'])).toBe('PDF, DOCX');
  });
});
