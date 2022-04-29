import FormWidget from './FormWidget.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../core/store';
import { firstValueFrom } from 'rxjs';
import type { IResource } from '@nuclia/core';

describe('Input widget', () => {
  it('should trigger search', async () => {
    const { container } = render(FormWidget);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      const query = await firstValueFrom(nucliaStore().query);
      expect(query).toEqual('Who is Batman?');
    }
  });

  it('should display results', async () => {
    nucliaStore().searchResults.next({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
    });
    const { container } = render(FormWidget);
    expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
  });
});
