import { Pipe, PipeTransform } from '@angular/core';

export const subscriptionFn = (dataReturn = {}) => ({
  subscribe: (fn: (value: any) => void) => fn(dataReturn),
});

export const subscriptionPipeFn = (dataReturn = {}) => ({
  pipe: () => {
    return {
      subscribe: (fn: (value: any) => void) => fn(dataReturn),
    };
  },
});

export const subscriptionPipeToFn = (dataReturn = {}) => {
  const testcall = () => ({
    pipe: () => {
      return {
        subscribe: (fn: (value: any) => void) => fn(dataReturn),
      };
    },
  });
  return testcall;
};

@Pipe({
  name: 'translate',
  standalone: false,
})
export class TranslatePipeMock implements PipeTransform {
  public name: string = 'translate';

  public transform(query: string, ...args: any[]): any {
    return query;
  }
}
