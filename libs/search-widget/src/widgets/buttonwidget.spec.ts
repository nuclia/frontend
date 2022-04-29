import ButtonWidget from './ButtonWidget.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../core/store';
import type { IResource } from '@nuclia/core';

describe('Button widget', () => {
  it('should open modal', async () => {
    const { container } = render(ButtonWidget);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
      expect(container.querySelector('input:focus')).toBeTruthy();
    }
  });

  it('should display results', async () => {
    nucliaStore().searchResults.next({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
    });
    const { container } = render(ButtonWidget);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    if (button) {
      await fireEvent.click(button);
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      if (input) {
        await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
        await fireEvent.keyPress(input, { key: 'Enter' });
        expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
      }
    }
  });
});
