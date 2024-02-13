import { LineBreakFormatterPipe } from './line-break-formatter.pipe';

describe('LineBreakFormatterPipe', () => {
  it('should replace line breaks by <br>', () => {
    const pipe = new LineBreakFormatterPipe();
    expect(pipe.transform('First line\nSecond line')).toBe('First line<br>Second line');
    expect(pipe.transform('First line \n Second line \nThird line')).toBe('First line <br> Second line <br>Third line');
  });
});
