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

  it('should return the duration in seconds and round the value to the nearest integer', () => {
    expect(pipe.transform(49.982364)).toBe('50s');
    expect(pipe.transform(49.58)).toBe('50s');
    expect(pipe.transform(49.48)).toBe('49s');
    expect(pipe.transform(49.0982364)).toBe('49s');
  });

  it('should return the duration in minutes when value > 90', () => {
    expect(pipe.transform(91)).toBe('2min');
    expect(pipe.transform(120)).toBe('2min');
    expect(pipe.transform(150)).toBe('3min');
    expect(pipe.transform(350)).toBe('6min');
  });

  it('should return the duration in minutes and round the value to the nearest integer when the value > 90', () => {
    expect(pipe.transform(91.58)).toBe('2min');
    expect(pipe.transform(91.48)).toBe('2min');
    expect(pipe.transform(180.48)).toBe('3min');
    expect(pipe.transform(180.58)).toBe('3min');
  });

  it('should return "more than 1h" when value >= 3600', () => {
    expect(pipe.transform(3600)).toBe('> 1h');
    expect(pipe.transform(6500)).toBe('> 1h');
  });
});
