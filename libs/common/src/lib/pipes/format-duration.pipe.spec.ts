import { FormatDurationPipe } from './format-duration.pipe';

describe('FormatDurationPipe', () => {
  const pipe = new FormatDurationPipe();

  it('should return an empty string when passing undefined or null value', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('should return the format in minutes when value <= 60', () => {
    expect(pipe.transform(30)).toBe('30min');
    expect(pipe.transform(60)).toBe('60min');
  });

  it('should return the format in hours when value > 60', () => {
    expect(pipe.transform(120)).toBe('2h');
    expect(pipe.transform(150)).toBe('2.5h');
  });

  it('should return the format in hours with two decimals only when value > 60', () => {
    expect(pipe.transform(65)).toBe('1.08h');
    expect(pipe.transform(6500)).toBe('108.33h');
  });
});
