import { FIELD_TYPE, FieldId } from '@nuclia/core';
import { getFieldMetadataForClassifications } from './edit-resource.helpers';

describe('Edit resource helpers', () => {
  const field: FieldId = { field_id: 'f1', field_type: FIELD_TYPE.text };

  it('should add a new label when none exists', () => {
    const all = getFieldMetadataForClassifications(
      field,
      [
        {
          paragraphId: 'p1',
          userClassifications: [{ labelset: 'heroes', label: 'batman' }],
          generatedClassifications: [],
          text: '',
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

  it('should update labels and keep other fields', () => {
    const all = getFieldMetadataForClassifications(
      field,
      [
        {
          paragraphId: 'p1',
          userClassifications: [
            { labelset: 'heroes', label: 'batman' },
            { labelset: 'heroes', label: 'catwoman' },
          ],
          generatedClassifications: [],
          text: '',
        },
        {
          paragraphId: 'p2',
          userClassifications: [{ labelset: 'heroes', label: 'catwoman' }],
          generatedClassifications: [],
          text: '',
        },
        {
          paragraphId: 'p3',
          userClassifications: [],
          generatedClassifications: [],
          text: '',
        },
      ],
      [
        {
          field: { field: 'f1', field_type: FIELD_TYPE.text },
          paragraphs: [
            { key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] },
            { key: 'p3', classifications: [{ labelset: 'heroes', label: 'batman' }] },
          ],
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
        ],
      },
      {
        field: { field: 'f2', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);
  });
});
