import { FIELD_TYPE, FieldId } from '@nuclia/core';
import { getUpdatedUserFieldMetadata } from './edit-resource.helpers';

describe('Edit resource helpers', () => {
  const field: FieldId = { field_id: 'f1', field_type: FIELD_TYPE.text };

  it('should add a new label when none exists', () => {
    const all = getUpdatedUserFieldMetadata(
      field,
      [
        {
          paragraphId: 'p1',
          userClassifications: [{ labelset: 'heroes', label: 'batman' }],
          generatedClassifications: [],
        },
      ],
      [],
    );
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);
  });

  it('should update labels and keep tokens as well as other fields', () => {
    const all = getUpdatedUserFieldMetadata(
      field,
      [
        {
          paragraphId: 'p1',
          userClassifications: [
            { labelset: 'heroes', label: 'batman' },
            { labelset: 'heroes', label: 'catwoman' },
          ],
          generatedClassifications: [],
        },
        {
          paragraphId: 'p2',
          userClassifications: [{ labelset: 'heroes', label: 'catwoman' }],
          generatedClassifications: [],
        },
        {
          paragraphId: 'p3',
          userClassifications: [],
          generatedClassifications: [],
        },
      ],
      [
        {
          field: { field: 'f1', field_type: FIELD_TYPE.text },
          paragraphs: [
            { key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] },
            { key: 'p3', classifications: [{ labelset: 'heroes', label: 'batman' }] },
          ],
          token: [{ token: 'Joker', klass: 'villain', start: 0, end: 4 }],
        },
        {
          field: { field: 'f2', field_type: FIELD_TYPE.text },
          paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
        },
      ],
    );
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [
          {
            key: 'p1',
            classifications: [
              { labelset: 'heroes', label: 'batman' },
              { labelset: 'heroes', label: 'catwoman' },
            ],
          },
          {
            key: 'p2',
            classifications: [{ labelset: 'heroes', label: 'catwoman' }],
          },
          { key: 'p3', classifications: [] },
        ],
        token: [{ token: 'Joker', klass: 'villain', start: 0, end: 4 }],
      },
      {
        field: { field: 'f2', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);
  });
});
