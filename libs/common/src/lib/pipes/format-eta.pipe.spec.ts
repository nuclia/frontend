import { FormatETAPipe } from './format-eta.pipe';

describe('FormatETAPipe', () => {
  const pipe = new FormatETAPipe();

  it('should return an empty string when passing undefined or null value', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('should return the duration in seconds when value <= 90', () => {
    expect(pipe.transform(30)).toBe('30s');
    expect(pipe.transform(60)).toBe('60s');
    expect(pipe.transform(90)).toBe('90s');
  });

  it('should return the duration in minutes when value > 90', () => {
    expect(pipe.transform(91)).toBe('2min');
    expect(pipe.transform(120)).toBe('2min');
    expect(pipe.transform(150)).toBe('3min');
    expect(pipe.transform(350)).toBe('6min');
  });

  it('should return "more than 1h" when value >= 3600', () => {
    expect(pipe.transform(3600)).toBe('> 1h');
    expect(pipe.transform(6500)).toBe('> 1h');
  });
});
