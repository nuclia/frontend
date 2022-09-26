import { setEntities, setLabels } from './resource.helpers';
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

    // add entity
    all = setEntities('f1', FIELD_TYPE.text, [{ token: 'Joker', klass: 'villain', start: 0, end: 4 }], all);
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
        token: [{ token: 'Joker', klass: 'villain', start: 0, end: 4 }],
      },
    ]);

    // update entities
    all = setEntities(
      'f1',
      FIELD_TYPE.text,
      [
        { token: 'Joker', klass: 'villain', start: 0, end: 4 },
        { token: 'Penguin', klass: 'villain', start: 7, end: 14 },
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
          {
            key: 'p2',
            classifications: [{ labelset: 'heroes', label: 'catwoman' }],
          },
        ],
        token: [
          { token: 'Joker', klass: 'villain', start: 0, end: 4 },
          { token: 'Penguin', klass: 'villain', start: 7, end: 14 },
        ],
      },
    ]);

    // add entity on other field
    all = setEntities('f2', FIELD_TYPE.file, [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }], all);
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
        token: [
          { token: 'Joker', klass: 'villain', start: 0, end: 4 },
          { token: 'Penguin', klass: 'villain', start: 7, end: 14 },
        ],
      },
      {
        field: { field: 'f2', field_type: FIELD_TYPE.file },
        token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
      },
    ]);

    // remove labels
    all = setLabels('f1', FIELD_TYPE.text, 'p1', [], all);
    expect(all).toEqual([
      {
        field: { field: 'f2', field_type: FIELD_TYPE.file },
        token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
      },
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [
          {
            key: 'p2',
            classifications: [{ labelset: 'heroes', label: 'catwoman' }],
          },
        ],
        token: [
          { token: 'Joker', klass: 'villain', start: 0, end: 4 },
          { token: 'Penguin', klass: 'villain', start: 7, end: 14 },
        ],
      },
    ]);

    // remove entity
    all = setEntities('f1', FIELD_TYPE.text, [{ token: 'Penguin', klass: 'villain', start: 7, end: 14 }], all);
    expect(all).toEqual([
      {
        field: { field: 'f2', field_type: FIELD_TYPE.file },
        token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
      },
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [
          {
            key: 'p2',
            classifications: [{ labelset: 'heroes', label: 'catwoman' }],
          },
        ],
        token: [{ token: 'Penguin', klass: 'villain', start: 7, end: 14 }],
      },
    ]);
  });
});
