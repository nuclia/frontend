import { Nuclia } from '../core';
import { IAuthentication, INuclia } from '../models';
import { Resource } from './resource';
import { FIELD_TYPE, UserFieldMetadata } from './resource.models';

describe('Resource', () => {
  let resource: Resource;

  beforeEach(() => {
    const nuclia = new Nuclia({ backend: 'http://here', zone: 'europe-1', account: 'dc', knowledgeBox: 'gotham' });
    resource = new Resource(
      {
        ...nuclia,
        auth: {
          getAuthHeaders: () => ({ Authorization: 'Bearer 12345' }),
        } as unknown as IAuthentication,
      } as unknown as INuclia,
      'ABC1234',
      'abcdef',
      { id: 'abcdef', title: 'Batman' },
    );
  });

  it('should update fieldmetadata', () => {
    let all: UserFieldMetadata[] = [];

    // add a new label when none exists
    const label1: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
    };
    all = resource['addFieldMetadata'](all, label1);
    expect(all).toEqual([
      {
        field: { field: 'f1', field_type: FIELD_TYPE.text },
        paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'batman' }] }],
      },
    ]);

    // add new label on same paragraph
    const label2onSameParagraph: UserFieldMetadata = {
      field: { field: 'f1', field_type: FIELD_TYPE.text },
      paragraphs: [{ key: 'p1', classifications: [{ labelset: 'heroes', label: 'catwoman' }] }],
    };
    all = resource['addFieldMetadata'](all, label2onSameParagraph);
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
    all = resource['addFieldMetadata'](all, label3onOtherParagraph);
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
    all = resource['addFieldMetadata'](all, entity1);
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

    // add entity on other field
    const entity2onOtherField: UserFieldMetadata = {
      field: { field: 'f2', field_type: FIELD_TYPE.file },
      token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
    };
    all = resource['addFieldMetadata'](all, entity2onOtherField);
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
      {
        field: { field: 'f2', field_type: FIELD_TYPE.file },
        token: [{ token: 'Joker', klass: 'villain', start: 10, end: 14 }],
      },
    ]);
  });
});
