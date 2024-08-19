import { format, getObjectValue } from './agentic';

describe('Agentic', () => {
  it('should get values from an object', () => {
    const obj = { a: { b: { c: 1 }, d: [23, 78, 'abc'] } };
    const val1 = getObjectValue(obj, 'a.b');
    expect(val1).toEqual({ c: 1 });
    const val2 = getObjectValue(obj, 'a.b.c');
    expect(val2).toEqual(1);
    const val3 = getObjectValue(obj, 'a.d.[2]');
    expect(val3).toEqual('abc');
    const val4 = getObjectValue(obj, 'a.[0]');
    expect(val4).toEqual({ c: 1 });
    const val5 = getObjectValue(obj, '');
    expect(val5).toEqual(obj);
  });

  it('should replace variables in a string', () => {
    const obj = { a: { b: { c: 1 }, d: [23, 78, 'abc'] } };
    const str1 = 'C is {{a.b.c}} and first item of D is {{a.d.[0]}}';
    expect(format(str1, obj)).toEqual('C is 1 and first item of D is 23');
    const str2 = 'B is {{a.b}}';
    expect(format(str2, obj)).toEqual('B is {"c":1}');
  });
});
