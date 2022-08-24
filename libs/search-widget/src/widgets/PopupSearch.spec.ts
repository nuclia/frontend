import PopupSearch from './PopupSearch.svelte';
import { fireEvent, render } from '@testing-library/svelte';
import { nucliaStore } from '../core/store';
import { firstValueFrom } from 'rxjs';
import type { IResource, Search } from '@nuclia/core';

describe('Popup search', () => {
  it('should trigger suggestion search', async () => {
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      const query = await firstValueFrom(nucliaStore().query);
      expect(query).toEqual('Who is Batman?');
    }
  });

  it('should display suggestions', async () => {
    nucliaStore().suggestions.next({
      resources: {},
      paragraphs: { results: [{ text: 'Knowledge is power, France is bacon' } as Search.Paragraph], facets: {} },
    });
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      expect(container.querySelector('.popup .modal')).toBeTruthy();
    }
  });

  it('should open modal on enter', async () => {
    nucliaStore().searchResults.next({
      resources: {
        res1: { title: 'Knowledge is power', summary: 'France is bacon' } as IResource,
      },
    });
    const { container } = render(PopupSearch);
    const input = container.querySelector('input');
    expect(input).toBeTruthy();
    if (input) {
      await fireEvent.input(input, { target: { value: 'Who is Batman?' } });
      await fireEvent.keyPress(input, { key: 'Enter' });
      expect(container.querySelector('.results:not(.empty)')).toBeTruthy();
    }
  });
});
