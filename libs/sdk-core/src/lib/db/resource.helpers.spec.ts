import { addFieldMetadata } from './resource.helpers';
import { FIELD_TYPE, UserFieldMetadata } from './resource.models';

describe('Resource helpers', () => {
  it('should update fieldmetadata', () => {
    let all: UserFieldMetadata[] = [];

    // add a new label when none exists
    const label1: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
    };
    all = addFieldMetadata(all, label1);
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);

    // add new label on same paragraph
    const label2onSameParagraph: UserFieldMetadata = {
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
    };
    all = addFieldMetadata(all, label2onSameParagraph);
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
    const label3onOtherParagraph: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      paragraphs: [{ key: 'p2', classifications: [{ labelset: 'heroes', label: 'catwoman' }] }],
    };
    all = addFieldMetadata(all, label3onOtherParagraph);
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
    const entity1: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      token: [{ token: 'Joker', klass: 'villain', start: 0, end: 4 }],
    };
    all = addFieldMetadata(all, entity1);
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

    // add entities including existing one without duplicating them
    const entity2: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      token: [
        { token: 'Joker', klass: 'villain', start: 0, end: 4 },
        { token: 'Penguin', klass: 'villain', start: 7, end: 14 },
      ],
    };

    all = addFieldMetadata(all, entity2);
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
    const entity2onOtherField: UserFieldMetadata = {
      field: { field: 'f2', field_type: FIELD_TYPE.file },
      token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
    };
    all = addFieldMetadata(all, entity2onOtherField);
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
  });
});
