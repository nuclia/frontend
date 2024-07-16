import { setLabels } from './resource.helpers';
import { FIELD_TYPE, UserFieldMetadata } from './resource.models';

describe('Resource helpers', () => {
  it('should update fieldmetadata', () => {
    let all: UserFieldMetadata[] = [];

    // add a new label when none exists
    all = setLabels('f1', FIELD_TYPE.text, 'p1', [{ labelset: 'heroes', label: 'batman' }], all);
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);

    // add new label on same paragraph
    all = setLabels(
      'f1',
      FIELD_TYPE.text,
      'p1',
      [
        { labelset: 'heroes', label: 'batman' },
        { labelset: 'heroes', label: 'catwoman' },
      ],
      all,
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
        ],
      },
    ]);

    // add new label on different paragraph
    all = setLabels('f1', FIELD_TYPE.text, 'p2', [{ labelset: 'heroes', label: 'catwoman' }], all);
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
    ]);

    // remove labels
    all = setLabels('f1', FIELD_TYPE.text, 'p1', [], all);
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [
          {
            key: 'p2',
            classifications: [{ labelset: 'heroes', label: 'catwoman' }],
          },
        ],
      },
    ]);
  });
});
