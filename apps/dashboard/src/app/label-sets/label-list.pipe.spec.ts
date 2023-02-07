import { LabelListPipe } from './label-list.pipe';

describe('LabelListPipe', () => {
  it('display the list of labels separated by a comma', () => {
    const pipe = new LabelListPipe();
    expect(pipe).toBeTruthy();

    expect(pipe.transform([{ title: 'Label 1' }, { title: 'Label 2' }, { title: 'Label 3' }])).toEqual(
      'Label 1, Label 2, Label 3',
    );
  });
});
