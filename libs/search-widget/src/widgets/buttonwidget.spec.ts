import ButtonWidget from './ButtonWidget.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../core/store';
import type { IResource } from '@nuclia/core';

describe('Button widget', () => {
  it('should open modal', async () => {
    const { container } = render(ButtonWidget);
    await fireEvent.click(container.querySelector('button'));
    expect(container.querySelector('input:focus')).toBeTruthy();
  });

  it('should display results', async () => {
    nucliaStore().searchResults.next({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
    });
    const { container } = render(ButtonWidget);
    await fireEvent.click(container.querySelector('button'));
    await fireEvent.input(container.querySelector('input'), { target: { value: 'Who is Batman?' } });
    await fireEvent.keyPress(container.querySelector('input'), { key: 'Enter' });
    expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
  });
});
